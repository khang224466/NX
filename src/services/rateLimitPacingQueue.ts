/**
 * SMART API REQUEST PACING & RATE LIMIT MANAGEMENT
 * ============================================================================
 * Centralized queue, request pacing, and rate limit management for Groq Console API
 * and Gemini AI requests.
 * 
 * Features:
 * 1. Configurable REQUEST_DELAY_MS (default 2000ms) - pacing gap between requests.
 * 2. Centralized sequential FIFO Queue - prevents concurrent bursts and 429 errors.
 * 3. Smart Backoff & Automatic Retry (max 3 retries, exponential backoff + jitter).
 * 4. Respect real API rate limit headers: Retry-After, x-ratelimit-reset-requests, x-ratelimit-reset-tokens.
 * 5. Transparent queue status: QUEUED, SENDING, RATE_LIMITED_WAITING, RETRYING, COMPLETED, FAILED.
 * 6. Secure Sanitized Logging: Never logs API keys, bearer tokens or sensitive credentials.
 * 7. Supports text generation, vision AI, and task cancellation.
 * ============================================================================
 */

export type QueueTaskStatus = 
  | 'IDLE'
  | 'QUEUED'
  | 'SENDING'
  | 'RATE_LIMITED_WAITING'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface PacingConfig {
  requestDelayMs: number;
  maxRetries: number;
  defaultGroqModel: string;
}

export interface ApiRateLimitHeaders {
  retryAfterSeconds?: number;
  resetRequestsSeconds?: number;
  resetTokensSeconds?: number;
  remainingRequests?: number;
  remainingTokens?: number;
}

export interface QueueTask {
  id: string;
  type: 'groq_chat' | 'groq_vision' | 'gemini_generate';
  payload: any;
  apiKey?: string;
  status: QueueTaskStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  response?: any;
  resolve?: (value: any) => void;
  reject?: (reason: any) => void;
  abortController: AbortController;
}

export interface QueueLogEntry {
  timestamp: string;
  taskId: string;
  action: string;
  status: QueueTaskStatus;
  retryAttempt?: number;
  waitMs?: number;
  httpStatus?: number;
  message: string;
}

export interface QueueNotificationEvent {
  status: QueueTaskStatus;
  currentTask?: {
    id: string;
    type: QueueTask['type'];
    status: QueueTaskStatus;
    retryCount: number;
    maxRetries: number;
  };
  queueLength: number;
  message?: string;
}

export class SmartApiRateLimiter {
  private config: PacingConfig = {
    requestDelayMs: 2000,
    maxRetries: 3,
    defaultGroqModel: 'llama-3.3-70b-versatile'
  };

  private queue: QueueTask[] = [];
  private isProcessing = false;
  private lastRequestEndTime = 0;
  private cooldownUntil = 0;
  private logs: QueueLogEntry[] = [];
  private listeners: ((event: QueueNotificationEvent) => void)[] = [];

  constructor(customConfig?: Partial<PacingConfig>) {
    if (customConfig) {
      this.config = { ...this.config, ...customConfig };
    }
  }

  public getConfig(): PacingConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<PacingConfig>): PacingConfig {
    this.config = { ...this.config, ...newConfig };
    this.addLog('SYSTEM', 'CONFIG_UPDATE', 'IDLE', `Cập nhật cấu hình: REQUEST_DELAY_MS=${this.config.requestDelayMs}ms, MAX_RETRIES=${this.config.maxRetries}`);
    return { ...this.config };
  }

  public getQueueLength(): number {
    return this.queue.filter(t => t.status === 'QUEUED').length;
  }

  public getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.getQueueLength(),
      totalTasks: this.queue.length,
      cooldownUntil: this.cooldownUntil,
      isCoolingDown: Date.now() < this.cooldownUntil,
      remainingCooldownMs: Math.max(0, this.cooldownUntil - Date.now()),
      config: this.getConfig(),
      recentLogs: this.logs.slice(-25)
    };
  }

  public subscribe(fn: (event: QueueNotificationEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify(status: QueueTaskStatus, currentTask?: QueueTask, message?: string) {
    const event = {
      status,
      currentTask: currentTask ? {
        id: currentTask.id,
        type: currentTask.type,
        status: currentTask.status,
        retryCount: currentTask.retryCount,
        maxRetries: currentTask.maxRetries
      } : undefined,
      queueLength: this.getQueueLength(),
      message
    };
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in rate limit listener:', err);
      }
    }
  }

  private addLog(
    taskId: string, 
    action: string, 
    status: QueueTaskStatus, 
    message: string, 
    extra?: { retryAttempt?: number; waitMs?: number; httpStatus?: number }
  ) {
    // Sanitization: Ensure no API keys or tokens are in logs
    const sanitizedMsg = message
      .replace(/gsk_[a-zA-Z0-9_-]+/g, 'gsk_***')
      .replace(/AIza[a-zA-Z0-9_-]+/g, 'AIza***')
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ***');

    const entry: QueueLogEntry = {
      timestamp: new Date().toISOString(),
      taskId,
      action,
      status,
      message: sanitizedMsg,
      ...extra
    };
    this.logs.push(entry);
    if (this.logs.length > 200) {
      this.logs.shift();
    }
    console.log(`[RateLimiter] [${entry.action}] [${taskId}] ${sanitizedMsg}`);
  }

  /**
   * Enqueue a new request
   */
  public enqueue<T = any>(
    type: 'groq_chat' | 'groq_vision' | 'gemini_generate',
    payload: any,
    apiKey?: string
  ): Promise<T> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const abortController = new AbortController();

    return new Promise<T>((resolve, reject) => {
      const task: QueueTask = {
        id: taskId,
        type,
        payload,
        apiKey,
        status: 'QUEUED',
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        createdAt: Date.now(),
        abortController,
        resolve,
        reject
      };

      this.queue.push(task);
      this.addLog(taskId, 'ENQUEUE', 'QUEUED', `Tác vụ ${type} đã xếp hàng (Vị trí #${this.getQueueLength()})`);
      this.notify('QUEUED', task, `Tác vụ #${taskId} đang chờ trong hàng đợi`);

      this.processQueue();
    });
  }

  /**
   * Cancel a pending task in queue
   */
  public cancelTask(taskId: string): boolean {
    const idx = this.queue.findIndex(t => t.id === taskId);
    if (idx !== -1) {
      const task = this.queue[idx];
      task.status = 'CANCELLED';
      task.abortController.abort();
      if (task.reject) {
        task.reject(new Error('Tác vụ đã bị người dùng hủy'));
      }
      this.addLog(taskId, 'CANCEL', 'CANCELLED', 'Tác vụ đã được hủy bởi người dùng');
      this.queue.splice(idx, 1);
      this.notify('CANCELLED', undefined, `Đã hủy tác vụ ${taskId}`);
      return true;
    }
    return false;
  }

  /**
   * Main Queue processing loop (Sequential FIFO + Rate Pacing + Backoff)
   */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const currentTask = this.queue[0];
        if (currentTask.status === 'CANCELLED') {
          this.queue.shift();
          continue;
        }

        // 1. Check active Cooldown Period (from prior 429 or rate-limit headers)
        const now = Date.now();
        if (now < this.cooldownUntil) {
          const waitCooldownMs = this.cooldownUntil - now;
          currentTask.status = 'RATE_LIMITED_WAITING';
          this.addLog(
            currentTask.id, 
            'RATE_LIMIT_COOLDOWN', 
            'RATE_LIMITED_WAITING', 
            `Đang trong thời gian hạ nhiệt rate-limit. Chờ ${(waitCooldownMs / 1000).toFixed(1)}s`,
            { waitMs: waitCooldownMs }
          );
          this.notify('RATE_LIMITED_WAITING', currentTask, `Đang chờ API hết giới hạn (${(waitCooldownMs / 1000).toFixed(1)}s)`);
          await this.sleep(waitCooldownMs);
        }

        // 2. Enforce Configurable Minimum Pacing Delay between consecutive requests
        const elapsedSinceLast = Date.now() - this.lastRequestEndTime;
        if (this.lastRequestEndTime > 0 && elapsedSinceLast < this.config.requestDelayMs) {
          const pacingWaitMs = this.config.requestDelayMs - elapsedSinceLast;
          this.addLog(
            currentTask.id,
            'PACING_DELAY',
            'QUEUED',
            `Khoảng cách an toàn giữa 2 request: Chờ ${pacingWaitMs}ms (REQUEST_DELAY_MS=${this.config.requestDelayMs}ms)`,
            { waitMs: pacingWaitMs }
          );
          await this.sleep(pacingWaitMs);
        }

        // 3. Execute Request
        currentTask.status = 'SENDING';
        currentTask.startedAt = Date.now();
        this.addLog(currentTask.id, 'DISPATCH', 'SENDING', `Đang gửi request ${currentTask.type} tới API`);
        this.notify('SENDING', currentTask, `Đang gửi request tới AI Engine...`);

        let success = false;
        try {
          const result = await this.executeTask(currentTask);
          currentTask.status = 'COMPLETED';
          currentTask.completedAt = Date.now();
          currentTask.response = result;
          success = true;

          this.addLog(
            currentTask.id, 
            'COMPLETE', 
            'COMPLETED', 
            `Tác vụ hoàn thành trong ${currentTask.completedAt - (currentTask.startedAt || 0)}ms`
          );
          this.notify('COMPLETED', currentTask, 'Tác vụ AI hoàn thành thành công');
          
          if (currentTask.resolve) {
            currentTask.resolve(result);
          }
        } catch (error: any) {
          const isAborted = currentTask.abortController.signal.aborted;
          if (isAborted) {
            currentTask.status = 'CANCELLED';
            if (currentTask.reject) currentTask.reject(error);
            this.queue.shift();
            this.lastRequestEndTime = Date.now();
            continue;
          }

          const httpStatus = error.status || error.statusCode || (error.response ? error.response.status : undefined);
          const isRateLimit = httpStatus === 429 || /rate limit|429|quota exceeded/i.test(error.message || '');
          const isServerError = httpStatus >= 500 && httpStatus <= 504;
          const isFatalClientError = httpStatus === 401 || httpStatus === 403 || httpStatus === 400;

          // Non-retryable errors
          if (isFatalClientError) {
            currentTask.status = 'FAILED';
            currentTask.error = error.message;
            this.addLog(currentTask.id, 'FATAL_ERROR', 'FAILED', `Lỗi xác thực hoặc cú pháp không thể retry: ${error.message}`, { httpStatus });
            this.notify('FAILED', currentTask, `Lỗi API (${httpStatus}): ${error.message}`);
            if (currentTask.reject) currentTask.reject(error);
            this.queue.shift();
            this.lastRequestEndTime = Date.now();
            continue;
          }

          // Check if retry is possible
          if ((isRateLimit || isServerError) && currentTask.retryCount < currentTask.maxRetries) {
            currentTask.retryCount += 1;
            currentTask.status = 'RETRYING';

            // Extract retry delay from headers if available
            let delayMs = 0;
            if (error.rateLimits?.retryAfterSeconds) {
              delayMs = error.rateLimits.retryAfterSeconds * 1000;
            } else if (isRateLimit) {
              // 429 backoff: 3s, 6s, 12s + jitter
              delayMs = Math.min(30000, (Math.pow(2, currentTask.retryCount) * 1500) + Math.floor(Math.random() * 800));
              this.cooldownUntil = Date.now() + delayMs;
            } else {
              // 5xx exponential backoff: 2s, 4s, 8s + jitter
              delayMs = Math.min(20000, (Math.pow(2, currentTask.retryCount) * 1000) + Math.floor(Math.random() * 500));
            }

            this.addLog(
              currentTask.id, 
              'RETRY_BACKOFF', 
              'RETRYING', 
              `Gặp lỗi ${httpStatus || 'Network'}. Thử lại lần ${currentTask.retryCount}/${currentTask.maxRetries} sau ${(delayMs / 1000).toFixed(1)}s (Exponential Backoff + Jitter)`,
              { retryAttempt: currentTask.retryCount, waitMs: delayMs, httpStatus }
            );
            this.notify('RETRYING', currentTask, `Đang thử lại lần thứ ${currentTask.retryCount} sau ${(delayMs / 1000).toFixed(1)}s...`);

            await this.sleep(delayMs);
            // Don't shift queue; it will retry at top of queue
            continue;
          }

          // Retries exhausted or unhandled error
          currentTask.status = 'FAILED';
          currentTask.error = error.message;
          this.addLog(currentTask.id, 'FAIL', 'FAILED', `Tác vụ thất bại sau ${currentTask.retryCount} lần thử: ${error.message}`, { httpStatus });
          this.notify('FAILED', currentTask, `Tác vụ thất bại: ${error.message}`);
          if (currentTask.reject) currentTask.reject(error);
        }

        // Pop completed or failed task from queue
        this.queue.shift();
        this.lastRequestEndTime = Date.now();
      }
    } finally {
      this.isProcessing = false;
      this.notify('IDLE', undefined, 'Hàng đợi sẵn sàng');
    }
  }

  /**
   * Internal Task Executor (Groq Chat, Groq Vision, or Gemini fallback)
   */
  private async executeTask(task: QueueTask): Promise<any> {
    if (task.type === 'groq_chat' || task.type === 'groq_vision') {
      return this.callGroqApi(task);
    }
    throw new Error(`Loại tác vụ không hỗ trợ: ${task.type}`);
  }

  /**
   * Call Groq Console API (/openai/v1/chat/completions) with Rate-Limit Header Extraction
   */
  private async callGroqApi(task: QueueTask): Promise<any> {
    const apiKey = task.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw {
        status: 401,
        message: 'Chưa cấu hình GROQ_API_KEY. Vui lòng cung cấp API Key qua cài đặt hoặc biến môi trường.'
      };
    }

    const { messages, model, temperature, max_tokens, response_format } = task.payload;
    const selectedModel = model || (task.type === 'groq_vision' ? 'llama-3.2-11b-vision-preview' : this.config.defaultGroqModel);

    const body: any = {
      model: selectedModel,
      messages,
      temperature: temperature !== undefined ? temperature : 0.4,
      max_tokens: max_tokens || 4096,
    };

    if (response_format) {
      body.response_format = response_format;
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      signal: task.abortController.signal
    });

    // Extract rate-limit headers
    const rateLimits: ApiRateLimitHeaders = {};
    const retryAfter = res.headers.get('retry-after');
    if (retryAfter) rateLimits.retryAfterSeconds = parseInt(retryAfter, 10);

    const resetReq = res.headers.get('x-ratelimit-reset-requests');
    if (resetReq) rateLimits.resetRequestsSeconds = parseFloat(resetReq);

    const resetTok = res.headers.get('x-ratelimit-reset-tokens');
    if (resetTok) rateLimits.resetTokensSeconds = parseFloat(resetTok);

    const remReq = res.headers.get('x-ratelimit-remaining-requests');
    if (remReq) rateLimits.remainingRequests = parseInt(remReq, 10);

    const remTok = res.headers.get('x-ratelimit-remaining-tokens');
    if (remTok) rateLimits.remainingTokens = parseInt(remTok, 10);

    // If API warned that remaining requests/tokens are near zero, proactively apply cooldown
    if (rateLimits.remainingRequests !== undefined && rateLimits.remainingRequests <= 1) {
      const waitTime = (rateLimits.resetRequestsSeconds || 2) * 1000;
      this.cooldownUntil = Math.max(this.cooldownUntil, Date.now() + waitTime);
    }

    if (!res.ok) {
      let errBody: any = {};
      try {
        errBody = await res.json();
      } catch {}
      const errMsg = errBody?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
      const err: any = new Error(errMsg);
      err.status = res.status;
      err.rateLimits = rateLimits;
      throw err;
    }

    const data = await res.json();
    return {
      data,
      rateLimits,
      modelUsed: selectedModel,
      tokensUsed: data.usage
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global Singleton Instance for application-wide rate limiting
export const globalSmartRateLimiter = new SmartApiRateLimiter();
