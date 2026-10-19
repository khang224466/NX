/**
 * NEXORA AI PROVIDER ADAPTER LAYER
 * Decoupled multi-provider abstraction supporting Google Gemini & Groq (OpenAI-compatible).
 * Enforces server-side API key protection, timeout control, and in-memory rate limiting.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
}

export interface ProviderCompletionParams {
  systemPrompt: string;
  messages: ChatMessage[];
  timeoutMs?: number;
  env: Record<string, string | undefined>;
}

export interface ProviderCompletionResult {
  text: string;
  modelUsed: string;
  provider: string;
}

export interface AIProviderAdapter {
  name: string;
  defaultModel: string;
  isAvailable(env: Record<string, string | undefined>): boolean;
  complete(params: ProviderCompletionParams): Promise<ProviderCompletionResult>;
}

// ============================================================================
// 1. IN-MEMORY RATE LIMITER (SLIDING WINDOW)
// ============================================================================
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 25; // 25 requests per minute per identifier

export function checkRateLimit(identifier: string = 'global'): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const timestamps = rateLimitMap.get(identifier) || [];
  const validTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = validTimestamps[0];
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldest)) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, retryAfter) };
  }

  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);

  // Periodic cleanup if map grows too large
  if (rateLimitMap.size > 1000) {
    rateLimitMap.forEach((list: number[], key: string) => {
      const active = list.filter((t: number) => now - t < RATE_LIMIT_WINDOW_MS);
      if (active.length === 0) {
        rateLimitMap.delete(key);
      } else {
        rateLimitMap.set(key, active);
      }
    });
  }

  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - validTimestamps.length };
}

// ============================================================================
// 2. GOOGLE GEMINI ADAPTER
// ============================================================================
const DEFAULT_SERVER_GEMINI_KEY = 'AQ.Ab8RN6Iufs8Djj-3UZGfp4PuCUsMF208uGAF_T4L2PmI6zR-RQ';

export class GeminiProviderAdapter implements AIProviderAdapter {
  name = 'gemini';
  defaultModel = 'gemini-3.1-flash-lite';
  candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];

  isAvailable(env: Record<string, string | undefined>): boolean {
    const key = env.GEMINI_API_KEY?.trim() || DEFAULT_SERVER_GEMINI_KEY;
    return Boolean(key);
  }

  async complete({
    systemPrompt,
    messages,
    timeoutMs = 25000,
    env
  }: ProviderCompletionParams): Promise<ProviderCompletionResult> {
    const apiKey = env.GEMINI_API_KEY?.trim() || DEFAULT_SERVER_GEMINI_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured on the server.');
    }

    // Format chat history for Gemini API
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const msg of messages) {
      if (msg && msg.content && typeof msg.content === 'string') {
        const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
        contents.push({
          role,
          parts: [{ text: msg.content.trim() }]
        });
      }
    }

    let lastError: any = null;

    for (const model of this.candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const controller = new AbortController();
      const perModelTimeout = Math.min(15000, timeoutMs);
      const timeoutId = setTimeout(() => controller.abort(), perModelTimeout);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2500,
              responseMimeType: 'application/json'
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = (await response.json()) as any;
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return {
            text,
            modelUsed: model,
            provider: this.name
          };
        }

        const status = response.status;
        const errJson = (await response.json().catch(() => ({}))) as any;
        const errMsg = errJson?.error?.message || `Google Gemini API error (HTTP ${status})`;
        const errorObj = new Error(errMsg);
        (errorObj as any).status = status;
        lastError = errorObj;

        // If rate limit, high load, or model deprecated, fallback to next model
        if (status === 503 || status === 429 || status === 404) {
          continue;
        }

        // If auth failure, do not retry with same key
        if (status === 401 || status === 403) {
          throw errorObj;
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;
        if (err.name === 'AbortError') {
          // Model timeout, try next candidate
          continue;
        }
        if (err.status === 401 || err.status === 403) {
          throw err;
        }
      }
    }

    if (lastError) {
      if (lastError.name === 'AbortError') {
        const timeoutError = new Error(`Kết nối tới Google Gemini bị timeout sau ${Math.round(timeoutMs / 1000)}s.`);
        (timeoutError as any).status = 504;
        throw timeoutError;
      }
      throw lastError;
    }

    throw new Error('Không thể kết nối tới bất kỳ mô hình Google Gemini nào khả dụng.');
  }
}

// ============================================================================
// 3. GROQ ADAPTER (OPENAI-COMPATIBLE SPEED FALLBACK)
// ============================================================================
export class GroqProviderAdapter implements AIProviderAdapter {
  name = 'groq';
  defaultModel = 'llama-3.3-70b-versatile';

  isAvailable(env: Record<string, string | undefined>): boolean {
    return Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim());
  }

  async complete({
    systemPrompt,
    messages,
    timeoutMs = 25000,
    env
  }: ProviderCompletionParams): Promise<ProviderCompletionResult> {
    const apiKey = env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured on the server.');
    }

    const model = this.defaultModel;
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const formattedMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];

    for (const msg of messages) {
      if (msg && msg.content && typeof msg.content === 'string') {
        const role = msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user';
        formattedMessages.push({ role, content: msg.content.trim() });
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          temperature: 0.7,
          max_tokens: 1200,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const status = response.status;
        const errJson = (await response.json().catch(() => ({}))) as any;
        const errMsg = errJson?.error?.message || `Groq API error (HTTP ${status})`;
        const errorObj = new Error(errMsg);
        (errorObj as any).status = status;
        throw errorObj;
      }

      const data = (await response.json()) as any;
      const text = data.choices?.[0]?.message?.content || '';

      return {
        text,
        modelUsed: model,
        provider: this.name
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutError = new Error(`Kết nối tới Groq AI bị timeout sau ${Math.round(timeoutMs / 1000)}s.`);
        (timeoutError as any).status = 504;
        throw timeoutError;
      }
      throw err;
    }
  }
}

// ============================================================================
// 4. PROVIDER REGISTRY & RESOLVER
// ============================================================================
const registeredAdapters: AIProviderAdapter[] = [
  new GeminiProviderAdapter(),
  new GroqProviderAdapter()
];

export function resolveActiveProvider(env: Record<string, string | undefined>): AIProviderAdapter | null {
  for (const adapter of registeredAdapters) {
    if (adapter.isAvailable(env)) {
      return adapter;
    }
  }
  return null;
}

export function getProviderStatus(env: Record<string, string | undefined>): {
  hasServerKey: boolean;
  provider: string;
  model: string;
} {
  const active = resolveActiveProvider(env);
  if (active) {
    return {
      hasServerKey: true,
      provider: active.name,
      model: active.defaultModel
    };
  }
  return {
    hasServerKey: false,
    provider: 'none',
    model: 'none'
  };
}
