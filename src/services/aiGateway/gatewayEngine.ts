import { CircuitBreaker } from './circuitBreaker';
import { QuotaAwareScheduler } from './quotaScheduler';
import { GatewayConcurrencyQueue } from './concurrencyQueue';
import {
  GatewayChatRequest,
  GatewayChatResponse,
  ProviderPoolConfig,
  ProviderType
} from './types';

/**
 * CENTRAL MULTI-PROVIDER AI GATEWAY ENGINE
 * Orchestrates circuit breakers, quota-aware scheduling, concurrent queueing,
 * and multi-provider failover (Groq <-> Gemini) for 100 concurrent users.
 */
export class AIGatewayEngine {
  public circuitBreaker: CircuitBreaker;
  public scheduler: QuotaAwareScheduler;
  public queue: GatewayConcurrencyQueue;

  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 4,
      cooldownPeriodMs: 15000,
      probeSuccessThreshold: 2,
      maxCooldownMs: 60000
    });

    this.scheduler = new QuotaAwareScheduler(this.circuitBreaker);
    this.queue = new GatewayConcurrencyQueue({
      maxConcurrentClients: 100,
      maxGlobalInFlight: 15,
      maxQueueBuffer: 50,
      maxOutputTokens: 450,
      requestTimeoutMs: 30000,
      userRateLimitPerMinute: 5
    });

    this.initializeDefaultPools();
  }

  /**
   * Register system default provider pools from environment variables
   */
  public initializeDefaultPools() {
    const groqKey = typeof process !== 'undefined' ? process.env?.GROQ_API_KEY : undefined;
    const geminiKey = typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined;

    // Pool 1: Groq Authorized Pool
    this.scheduler.registerPool({
      id: 'groq_primary',
      name: 'Groq High-Speed Cluster',
      provider: 'groq',
      allowedModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
      defaultModel: 'llama-3.3-70b-versatile',
      rpmLimit: 30,           // 30 requests / minute
      tpmLimit: 131072,       // 131k tokens / minute
      rpdLimit: 14400,        // 14.4k requests / day
      maxConcurrency: 8,      // Max 8 concurrent calls to Groq
      apiKey: groqKey || ''
    });

    // Pool 2: Google Gemini Deep Reasoning Pool
    this.scheduler.registerPool({
      id: 'gemini_fallback',
      name: 'Google Gemini 2.0 Reasoning Cluster',
      provider: 'gemini',
      allowedModels: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      defaultModel: 'gemini-2.0-flash',
      rpmLimit: 15,           // 15 requests / minute (Gemini free tier)
      tpmLimit: 1000000,      // 1M tokens / minute
      rpdLimit: 1500,         // 1.5k requests / day
      maxConcurrency: 7,      // Max 7 concurrent calls to Gemini
      apiKey: geminiKey || ''
    });
  }

  /**
   * MAIN CHAT DISPATCH (With Rate Limiting, Caching, Queue, Scheduler, Circuit Breaker)
   */
  public async handleChat(request: GatewayChatRequest): Promise<GatewayChatResponse> {
    // Step 1: User rate limit enforcement (5 req/min)
    const userLimit = this.queue.checkUserRateLimit(request.userId);
    if (!userLimit.allowed) {
      throw new Error(`Bạn đã gửi yêu cầu quá nhanh. Vui lòng chờ ${userLimit.retryAfterSeconds} giây trước khi gửi tiếp.`);
    }

    // Step 2: Prompt Cache & Deduplication (0 token cost)
    const cached = this.queue.getCachedResponse(request);
    if (cached) {
      return cached;
    }

    // Step 3: Enqueue via Concurrency Queue (max 15 in-flight, max 50 buffer)
    return this.queue.enqueue(request, async (req) => {
      return this.executeWithFailover(req);
    });
  }

  /**
   * Internal Execution with Max 1 Failover Retry
   */
  private async executeWithFailover(request: GatewayChatRequest): Promise<GatewayChatResponse> {
    const startTime = Date.now();
    const estimatedTokens = this.scheduler.estimateTokens(request);

    // If client supplied their own BYOK key, bypass system pool
    if (request.byokApiKey) {
      return this.executeWithByok(request, startTime);
    }

    // Step 1: Select Best Pool via formula S_i = 0.45Qi + 0.25Li + 0.20Ei + 0.10Ci
    const candidate = this.scheduler.selectBestPool(request);
    if (!candidate) {
      throw new Error('Tất cả động cơ AI đang trong chu kỳ bảo vệ hạ nhiệt (Cooldown). Vui lòng thử lại sau 10 giây.');
    }

    const { pool } = candidate;
    this.scheduler.reserveQuota(pool.id, estimatedTokens);

    try {
      const response = await this.dispatchToProvider(pool, request);
      const latencyMs = Date.now() - startTime;
      this.scheduler.releaseQuota(pool.id, response.tokensUsed.totalTokens, latencyMs);

      // Cache successful response (5 min TTL)
      this.queue.setCachedResponse(request, response, 300000);
      return response;
    } catch (err: any) {
      const httpStatus = err.status || (err.message?.includes('429') ? 429 : 500);
      this.scheduler.handleFailure(pool.id, httpStatus, err.retryAfterSeconds, err.message);

      // Attempt Failover: Max 1 retry to alternate provider
      console.warn(`[AIGateway] Pool ${pool.id} failed (${httpStatus}). Attempting failover...`);
      const alternatePoolId = pool.provider === 'groq' ? 'gemini_fallback' : 'groq_primary';
      const backupPool = this.scheduler.getPool(alternatePoolId);
      const backupMetric = this.scheduler.getMetrics(alternatePoolId);

      if (backupPool && backupMetric && this.circuitBreaker.canExecute(backupMetric)) {
        this.scheduler.reserveQuota(backupPool.id, estimatedTokens);
        try {
          const backupResponse = await this.dispatchToProvider(backupPool, request);
          const latencyMs = Date.now() - startTime;
          this.scheduler.releaseQuota(backupPool.id, backupResponse.tokensUsed.totalTokens, latencyMs);
          this.queue.setCachedResponse(request, backupResponse, 300000);
          return backupResponse;
        } catch (backupErr: any) {
          this.scheduler.handleFailure(backupPool.id, backupErr.status || 500, undefined, backupErr.message);
          throw new Error(`Cả 2 động cơ AI chính và dự phòng đều quá tải: ${backupErr.message}`);
        }
      }

      throw err;
    }
  }

  /**
   * Direct Dispatch to Provider (Groq or Gemini)
   */
  private async dispatchToProvider(
    pool: ProviderPoolConfig,
    request: GatewayChatRequest
  ): Promise<GatewayChatResponse> {
    const startTime = Date.now();
    const apiKey = pool.apiKey;
    if (!apiKey) {
      throw new Error(`Chưa cấu hình API Key cho cụm ${pool.name}`);
    }

    if (pool.provider === 'groq') {
      return this.callGroq(pool, apiKey, request, startTime);
    } else {
      return this.callGemini(pool, apiKey, request, startTime);
    }
  }

  /**
   * Call Groq Cloud API
   */
  private async callGroq(
    pool: ProviderPoolConfig,
    apiKey: string,
    request: GatewayChatRequest,
    startTime: number
  ): Promise<GatewayChatResponse> {
    const model = request.modelPreference || pool.defaultModel;
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: request.messages.map(m => ({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: m.content
        })),
        temperature: request.temperature ?? 0.6,
        max_tokens: Math.min(request.maxTokens || 450, 600)
      })
    });

    this.scheduler.updateFromHeaders(pool.id, res.headers);

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const error: any = new Error(errJson?.error?.message || `Groq API HTTP ${res.status}`);
      error.status = res.status;
      const retryHeader = res.headers.get('retry-after');
      if (retryHeader) error.retryAfterSeconds = parseInt(retryHeader, 10);
      throw error;
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '';
    const usage = data.usage || {};

    return {
      id: request.id,
      reply,
      modelUsed: model,
      poolUsed: pool.id,
      providerUsed: 'groq',
      tokensUsed: {
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0
      },
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Call Google Gemini API
   */
  private async callGemini(
    pool: ProviderPoolConfig,
    apiKey: string,
    request: GatewayChatRequest,
    startTime: number
  ): Promise<GatewayChatResponse> {
    const model = request.modelPreference || pool.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const rawContents = request.messages.map(m => ({
      role: (m.role === 'model' || m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      parts: [{ text: m.content }]
    }));

    // Coalesce same-role messages
    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const item of rawContents) {
      if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
        contents[contents.length - 1].parts[0].text += `\n\n${item.parts[0].text}`;
      } else {
        contents.push(item);
      }
    }

    if (contents.length > 0 && contents[0].role !== 'user') {
      contents.unshift({ role: 'user', parts: [{ text: 'Bắt đầu tư vấn hướng nghiệp 2026' }] });
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: Math.min(request.maxTokens || 450, 600)
        }
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const error: any = new Error(errJson?.error?.message || `Gemini API HTTP ${res.status}`);
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const reply = candidate?.content?.parts?.map((p: any) => p.text).join('') || '';
    const meta = data.usageMetadata || {};

    return {
      id: request.id,
      reply,
      modelUsed: model,
      poolUsed: pool.id,
      providerUsed: 'gemini',
      tokensUsed: {
        promptTokens: meta.promptTokenCount || 0,
        completionTokens: meta.candidatesTokenCount || 0,
        totalTokens: meta.totalTokenCount || 0
      },
      durationMs: Date.now() - startTime
    };
  }

  /**
   * Execute with BYOK (Bring Your Own Key)
   */
  private async executeWithByok(request: GatewayChatRequest, startTime: number): Promise<GatewayChatResponse> {
    const isGroq = request.byokApiKey?.startsWith('gsk_');
    const provider: ProviderType = isGroq ? 'groq' : 'gemini';

    const ephemeralPool: ProviderPoolConfig = {
      id: `byok_${request.userId}`,
      name: `User BYOK (${provider.toUpperCase()})`,
      provider,
      allowedModels: isGroq ? ['llama-3.3-70b-versatile'] : ['gemini-2.0-flash'],
      defaultModel: isGroq ? 'llama-3.3-70b-versatile' : 'gemini-2.0-flash',
      rpmLimit: 60,
      tpmLimit: 1000000,
      rpdLimit: 100000,
      maxConcurrency: 5,
      apiKey: request.byokApiKey,
      isByok: true
    };

    return this.dispatchToProvider(ephemeralPool, request);
  }

  /**
   * Return real-time metrics for admin dashboard
   */
  public getSystemMetrics() {
    return {
      timestamp: new Date().toISOString(),
      activeClients: this.queue.getActiveClientConnections(),
      maxClients: this.queue.getLimits().maxConcurrentClients,
      inFlight: this.queue.getActiveInFlight(),
      maxInFlight: this.queue.getLimits().maxGlobalInFlight,
      queuedTasks: this.queue.getQueueLength(),
      maxQueue: this.queue.getLimits().maxQueueBuffer,
      pools: this.scheduler.getAllMetrics()
    };
  }
}

// Singleton Engine Export
export const globalAIGateway = new AIGatewayEngine();
