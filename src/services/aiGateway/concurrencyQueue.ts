import { GatewayChatRequest, GatewayChatResponse, SystemGatewayLimits } from './types';

interface QueuedItem {
  request: GatewayChatRequest;
  resolve: (value: GatewayChatResponse) => void;
  reject: (reason: any) => void;
  enqueuedAt: number;
  timeoutTimer: NodeJS.Timeout;
}

interface CacheEntry {
  response: GatewayChatResponse;
  expiresAt: number;
}

export class GatewayConcurrencyQueue {
  private limits: SystemGatewayLimits;
  private queue: QueuedItem[] = [];
  private activeInFlight = 0;
  private activeClientConnections = 0;
  private userRequestTimestamps: Map<string, number[]> = new Map();
  private promptCache: Map<string, CacheEntry> = new Map();
  private maxCacheSize = 250;

  constructor(customLimits?: Partial<SystemGatewayLimits>) {
    this.limits = {
      maxConcurrentClients: 100,
      maxGlobalInFlight: 15,
      maxQueueBuffer: 50,
      maxOutputTokens: 450,
      requestTimeoutMs: 30000,
      userRateLimitPerMinute: 5,
      circuitFailureThreshold: 4,
      circuitCooldownMs: 15000,
      circuitProbeSuccessesRequired: 2,
      ...customLimits
    };

    // Clean up expired cache every 60s
    setInterval(() => this.purgeExpiredCache(), 60000);
  }

  public getLimits(): SystemGatewayLimits {
    return { ...this.limits };
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public getActiveInFlight(): number {
    return this.activeInFlight;
  }

  public getActiveClientConnections(): number {
    return this.activeClientConnections;
  }

  public registerClientConnection(): boolean {
    if (this.activeClientConnections >= this.limits.maxConcurrentClients) {
      return false;
    }
    this.activeClientConnections += 1;
    return true;
  }

  public releaseClientConnection() {
    this.activeClientConnections = Math.max(0, this.activeClientConnections - 1);
  }

  /**
   * USER RATE LIMIT CHECK (Sliding window: max 5 req/min)
   */
  public checkUserRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
    const now = Date.now();
    const timestamps = this.userRequestTimestamps.get(userId) || [];
    const validTimestamps = timestamps.filter(t => now - t < 60000);

    if (validTimestamps.length >= this.limits.userRateLimitPerMinute) {
      const oldest = validTimestamps[0];
      const waitSeconds = Math.ceil((60000 - (now - oldest)) / 1000);
      return { allowed: false, retryAfterSeconds: Math.max(1, waitSeconds) };
    }

    validTimestamps.push(now);
    this.userRequestTimestamps.set(userId, validTimestamps);
    return { allowed: true };
  }

  /**
   * PROMPT DEDUPLICATION & CACHING (0 token cost for repeated questions)
   */
  public getCachedResponse(request: GatewayChatRequest): GatewayChatResponse | null {
    const cacheKey = this.computeCacheKey(request);
    const entry = this.promptCache.get(cacheKey);
    if (entry && entry.expiresAt > Date.now()) {
      return { ...entry.response, cached: true };
    }
    return null;
  }

  public setCachedResponse(request: GatewayChatRequest, response: GatewayChatResponse, ttlMs: number = 300000) {
    const cacheKey = this.computeCacheKey(request);
    if (this.promptCache.size >= this.maxCacheSize) {
      const oldestKey = this.promptCache.keys().next().value;
      if (oldestKey) this.promptCache.delete(oldestKey);
    }
    this.promptCache.set(cacheKey, {
      response: { ...response, cached: true },
      expiresAt: Date.now() + ttlMs
    });
  }

  /**
   * ENQUEUE OR REJECT
   */
  public enqueue(
    request: GatewayChatRequest,
    executor: (req: GatewayChatRequest) => Promise<GatewayChatResponse>
  ): Promise<GatewayChatResponse> {
    // 1. Check queue buffer capacity (max 50)
    if (this.queue.length >= this.limits.maxQueueBuffer) {
      return Promise.reject(new Error('Hàng đợi AI đã đầy (50/50). Vui lòng thử lại sau 5-10 giây.'));
    }

    return new Promise<GatewayChatResponse>((resolve, reject) => {
      // 30s timeout guard
      const timeoutTimer = setTimeout(() => {
        this.removeFromQueue(request.id);
        reject(new Error(`Tác vụ AI bị hủy do quá thời gian chờ ${this.limits.requestTimeoutMs / 1000}s`));
      }, this.limits.requestTimeoutMs);

      this.queue.push({
        request,
        resolve,
        reject,
        enqueuedAt: Date.now(),
        timeoutTimer
      });

      this.processNext(executor);
    });
  }

  private async processNext(executor: (req: GatewayChatRequest) => Promise<GatewayChatResponse>) {
    if (this.activeInFlight >= this.limits.maxGlobalInFlight || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.activeInFlight += 1;

    try {
      const response = await executor(item.request);
      clearTimeout(item.timeoutTimer);
      item.resolve(response);
    } catch (err) {
      clearTimeout(item.timeoutTimer);
      item.reject(err);
    } finally {
      this.activeInFlight = Math.max(0, this.activeInFlight - 1);
      // Process next item in queue
      setImmediate(() => this.processNext(executor));
    }
  }

  private removeFromQueue(requestId: string) {
    const idx = this.queue.findIndex(item => item.request.id === requestId);
    if (idx !== -1) {
      this.queue.splice(idx, 1);
    }
  }

  private computeCacheKey(request: GatewayChatRequest): string {
    const lastMsg = request.messages[request.messages.length - 1]?.content || '';
    const mode = request.isSupremeMode ? 'supreme' : 'normal';
    return `${mode}_${lastMsg.trim().toLowerCase().slice(0, 200)}`;
  }

  private purgeExpiredCache() {
    const now = Date.now();
    for (const [key, entry] of this.promptCache.entries()) {
      if (entry.expiresAt <= now) {
        this.promptCache.delete(key);
      }
    }
  }
}
