import { CircuitState, PoolRuntimeMetrics } from './types';

export interface CircuitBreakerConfig {
  failureThreshold: number;       // Consecutive failures before OPEN
  cooldownPeriodMs: number;       // Base cooldown duration
  probeSuccessThreshold: number;  // Consecutive successes in HALF_OPEN to return to HEALTHY
  maxCooldownMs: number;          // Max backoff cooldown (e.g. 60s)
}

/**
 * 4-STATE CIRCUIT BREAKER FOR AI PROVIDER POOLS
 * Prevents cascading failures and rate-limit hammering across Groq and Gemini.
 * States: HEALTHY -> COOLDOWN (429) -> OPEN (Errors) -> HALF_OPEN (Probe)
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig;

  constructor(customConfig?: Partial<CircuitBreakerConfig>) {
    this.config = {
      failureThreshold: 4,
      cooldownPeriodMs: 15000,
      probeSuccessThreshold: 2,
      maxCooldownMs: 60000,
      ...customConfig
    };
  }

  /**
   * Determine whether a request can be dispatched to this pool
   */
  public canExecute(metrics: PoolRuntimeMetrics): boolean {
    const now = Date.now();

    switch (metrics.circuitState) {
      case 'HEALTHY':
        return true;

      case 'COOLDOWN':
        if (now >= metrics.cooldownUntil) {
          // Cooldown timer expired, transition to HALF_OPEN probe state
          metrics.circuitState = 'HALF_OPEN';
          metrics.consecutiveSuccesses = 0;
          return true;
        }
        return false;

      case 'OPEN':
        if (now >= metrics.cooldownUntil) {
          // Trip duration elapsed, transition to HALF_OPEN probe state
          metrics.circuitState = 'HALF_OPEN';
          metrics.consecutiveSuccesses = 0;
          return true;
        }
        return false;

      case 'HALF_OPEN':
        // Only allow a limited probe concurrency (e.g. 1 in-flight probe request)
        return metrics.inFlightRequests < 1;

      default:
        return false;
    }
  }

  /**
   * Record a successful response
   */
  public recordSuccess(metrics: PoolRuntimeMetrics, latencyMs: number) {
    metrics.consecutiveFailures = 0;
    metrics.lastHttpStatus = 200;

    // Update Exponential Moving Average (EMA) of latency: alpha = 0.2
    if (metrics.latencyEma === 0) {
      metrics.latencyEma = latencyMs;
    } else {
      metrics.latencyEma = Math.round(0.2 * latencyMs + 0.8 * metrics.latencyEma);
    }

    // Decay error rate
    metrics.errorRate = Math.max(0, metrics.errorRate * 0.8);

    if (metrics.circuitState === 'HALF_OPEN') {
      metrics.consecutiveSuccesses += 1;
      if (metrics.consecutiveSuccesses >= this.config.probeSuccessThreshold) {
        metrics.circuitState = 'HEALTHY';
        metrics.consecutiveSuccesses = 0;
      }
    } else if (metrics.circuitState !== 'HEALTHY') {
      metrics.circuitState = 'HEALTHY';
    }
  }

  /**
   * Record a failure (429 Rate Limit, 5xx Server Error, Timeout)
   */
  public recordFailure(
    metrics: PoolRuntimeMetrics,
    httpStatus?: number,
    retryAfterSeconds?: number,
    errorMessage?: string
  ) {
    metrics.consecutiveFailures += 1;
    metrics.consecutiveSuccesses = 0;
    metrics.lastHttpStatus = httpStatus;
    metrics.lastErrorMessage = errorMessage;
    metrics.errorRate = Math.min(1.0, metrics.errorRate + 0.25);

    const is429 = httpStatus === 429;
    const now = Date.now();

    if (is429) {
      // 429 Rate Limit: Enter COOLDOWN state
      let waitMs = this.config.cooldownPeriodMs;
      if (retryAfterSeconds && retryAfterSeconds > 0) {
        waitMs = Math.min(this.config.maxCooldownMs, retryAfterSeconds * 1000);
      } else {
        // Exponential backoff for 429: 15s * 2^(failures-1) + jitter
        waitMs = Math.min(
          this.config.maxCooldownMs,
          this.config.cooldownPeriodMs * Math.pow(1.5, Math.max(0, metrics.consecutiveFailures - 1)) +
            Math.floor(Math.random() * 2000)
        );
      }
      metrics.circuitState = 'COOLDOWN';
      metrics.cooldownUntil = now + waitMs;
    } else {
      // General errors / timeouts
      if (metrics.circuitState === 'HALF_OPEN') {
        // If failed during probe, immediately trip back to OPEN with doubled duration
        metrics.circuitState = 'OPEN';
        metrics.cooldownUntil = now + Math.min(this.config.maxCooldownMs, this.config.cooldownPeriodMs * 2);
      } else if (metrics.consecutiveFailures >= this.config.failureThreshold) {
        // Threshold breached, trip circuit OPEN
        metrics.circuitState = 'OPEN';
        metrics.cooldownUntil = now + this.config.cooldownPeriodMs;
      }
    }
  }

  /**
   * Manually reset circuit to HEALTHY
   */
  public reset(metrics: PoolRuntimeMetrics) {
    metrics.circuitState = 'HEALTHY';
    metrics.consecutiveFailures = 0;
    metrics.consecutiveSuccesses = 0;
    metrics.cooldownUntil = 0;
    metrics.errorRate = 0;
  }
}
