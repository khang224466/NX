import { ProviderPoolConfig, PoolRuntimeMetrics, GatewayChatRequest } from './types';
import { CircuitBreaker } from './circuitBreaker';

export interface SchedulerWeights {
  quotaWeight: number;      // 0.45
  latencyWeight: number;    // 0.25
  errorWeight: number;      // 0.20
  concurrencyWeight: number;// 0.10
}

export class QuotaAwareScheduler {
  private pools: Map<string, ProviderPoolConfig> = new Map();
  private metrics: Map<string, PoolRuntimeMetrics> = new Map();
  private circuitBreaker: CircuitBreaker;
  private weights: SchedulerWeights = {
    quotaWeight: 0.45,
    latencyWeight: 0.25,
    errorWeight: 0.20,
    concurrencyWeight: 0.10
  };

  constructor(circuitBreaker: CircuitBreaker) {
    this.circuitBreaker = circuitBreaker;
  }

  /**
   * Register a provider pool (Groq organization or Gemini project)
   */
  public registerPool(config: ProviderPoolConfig) {
    this.pools.set(config.id, config);
    if (!this.metrics.has(config.id)) {
      this.metrics.set(config.id, {
        poolId: config.id,
        circuitState: 'HEALTHY',
        estimatedRequestsRemaining: config.rpmLimit,
        estimatedTokensRemaining: config.tpmLimit,
        inFlightRequests: 0,
        latencyEma: 450, // Initial estimate 450ms
        errorRate: 0.0,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        cooldownUntil: 0,
        lastUsedTimestamp: 0,
        totalRequestsHandled: 0,
        totalTokensConsumed: 0,
        quotaPressure: 0.0
      });
    }
  }

  public getPool(poolId: string): ProviderPoolConfig | undefined {
    return this.pools.get(poolId);
  }

  public getMetrics(poolId: string): PoolRuntimeMetrics | undefined {
    return this.metrics.get(poolId);
  }

  public getAllMetrics(): PoolRuntimeMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Estimate token count of a request (approx 4 chars per token)
   */
  public estimateTokens(request: GatewayChatRequest): number {
    const rawChars = request.messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    const estimatedInput = Math.ceil(rawChars / 3.5);
    const maxOutput = request.maxTokens || 450;
    return estimatedInput + maxOutput;
  }

  /**
   * Filter eligible pools and score them using:
   * S_i = 0.45 * Q_i + 0.25 * L_i + 0.20 * E_i + 0.10 * C_i
   */
  public selectBestPool(request: GatewayChatRequest): { pool: ProviderPoolConfig; score: number } | null {
    const estimatedTokens = this.estimateTokens(request);
    const candidates: { pool: ProviderPoolConfig; score: number }[] = [];

    // Periodic quota replenishment (per minute reset)
    this.refreshQuotasIfNeeded();

    for (const [poolId, poolConfig] of this.pools.entries()) {
      const metric = this.metrics.get(poolId)!;

      // 1. Check Circuit Breaker
      if (!this.circuitBreaker.canExecute(metric)) {
        continue;
      }

      // 2. Check In-Flight Concurrency Capacity
      if (metric.inFlightRequests >= poolConfig.maxConcurrency) {
        continue;
      }

      // 3. Check Estimated Token Quota
      if (metric.estimatedTokensRemaining < estimatedTokens && metric.estimatedTokensRemaining > 0) {
        continue;
      }

      // 4. Provider preference filter (if client explicitly requests Groq or Gemini)
      if (request.providerPreference && poolConfig.provider !== request.providerPreference && !request.byokApiKey) {
        continue;
      }

      // Calculate Normalized Variables (0.0 to 1.0)
      // Q_i: Quota pressure (used ratio)
      const Q_i = Math.max(0, Math.min(1.0, 1.0 - (metric.estimatedTokensRemaining / Math.max(1, poolConfig.tpmLimit))));
      
      // L_i: Latency normalized (0ms = 0.0, 3000ms+ = 1.0)
      const L_i = Math.max(0, Math.min(1.0, metric.latencyEma / 3000));

      // E_i: Error penalty (0.0 to 1.0)
      const E_i = Math.max(0, Math.min(1.0, metric.errorRate));

      // C_i: In-flight capacity pressure (0.0 to 1.0)
      const C_i = Math.max(0, Math.min(1.0, metric.inFlightRequests / Math.max(1, poolConfig.maxConcurrency)));

      // Final Score: Lower is better
      const S_i = (
        this.weights.quotaWeight * Q_i +
        this.weights.latencyWeight * L_i +
        this.weights.errorWeight * E_i +
        this.weights.concurrencyWeight * C_i
      );

      metric.quotaPressure = parseFloat(Q_i.toFixed(3));
      candidates.push({ pool: poolConfig, score: S_i });
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort by lowest score
    candidates.sort((a, b) => a.score - b.score);
    return candidates[0];
  }

  /**
   * ATOMIC RESERVATION
   * Reserves in-flight slot and estimated tokens before request dispatch
   */
  public reserveQuota(poolId: string, estimatedTokens: number): boolean {
    const metric = this.metrics.get(poolId);
    const pool = this.pools.get(poolId);
    if (!metric || !pool) return false;

    metric.inFlightRequests += 1;
    metric.estimatedTokensRemaining = Math.max(0, metric.estimatedTokensRemaining - estimatedTokens);
    metric.lastUsedTimestamp = Date.now();
    return true;
  }

  /**
   * RELEASE QUOTA AFTER COMPLETION
   */
  public releaseQuota(poolId: string, actualTokensUsed?: number, latencyMs: number = 500) {
    const metric = this.metrics.get(poolId);
    if (!metric) return;

    metric.inFlightRequests = Math.max(0, metric.inFlightRequests - 1);
    metric.totalRequestsHandled += 1;
    if (actualTokensUsed && actualTokensUsed > 0) {
      metric.totalTokensConsumed += actualTokensUsed;
    }

    this.circuitBreaker.recordSuccess(metric, latencyMs);
  }

  /**
   * HANDLE PROVIDER FAILURE
   */
  public handleFailure(poolId: string, httpStatus?: number, retryAfterSeconds?: number, errMsg?: string) {
    const metric = this.metrics.get(poolId);
    if (!metric) return;

    metric.inFlightRequests = Math.max(0, metric.inFlightRequests - 1);
    this.circuitBreaker.recordFailure(metric, httpStatus, retryAfterSeconds, errMsg);
  }

  /**
   * UPDATE METRICS FROM REAL PROVIDER RESPONSE HEADERS
   */
  public updateFromHeaders(poolId: string, headers: Headers | Record<string, any>) {
    const metric = this.metrics.get(poolId);
    if (!metric) return;

    const getH = (key: string): string | null => {
      if (typeof (headers as any).get === 'function') {
        return (headers as Headers).get(key);
      }
      return (headers as any)[key] || (headers as any)[key.toLowerCase()] || null;
    };

    const remainingRequests = getH('x-ratelimit-remaining-requests');
    if (remainingRequests) {
      const parsed = parseInt(remainingRequests, 10);
      if (!isNaN(parsed)) metric.estimatedRequestsRemaining = parsed;
    }

    const remainingTokens = getH('x-ratelimit-remaining-tokens');
    if (remainingTokens) {
      const parsed = parseInt(remainingTokens, 10);
      if (!isNaN(parsed)) metric.estimatedTokensRemaining = parsed;
    }
  }

  /**
   * Sliding window reset for tokens/requests when a minute has elapsed
   */
  private refreshQuotasIfNeeded() {
    const now = Date.now();
    for (const [poolId, pool] of this.pools.entries()) {
      const metric = this.metrics.get(poolId);
      if (!metric) continue;

      if (now - metric.lastUsedTimestamp >= 60000) {
        // Replenish rate limit pool
        metric.estimatedRequestsRemaining = pool.rpmLimit;
        metric.estimatedTokensRemaining = pool.tpmLimit;
      }
    }
  }
}
