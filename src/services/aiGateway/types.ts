/**
 * TYPES & INTERFACES FOR MULTI-PROVIDER AI GATEWAY & QUOTA SCHEDULER
 * Architected for 100 concurrent users with zero/minimal cost constraint.
 */

export type CircuitState = 'HEALTHY' | 'COOLDOWN' | 'OPEN' | 'HALF_OPEN';

export type ProviderType = 'groq' | 'gemini' | 'byok';

export interface ProviderPoolConfig {
  id: string;
  name: string;
  provider: ProviderType;
  organizationId?: string;
  allowedModels: string[];
  defaultModel: string;
  rpmLimit: number;       // Requests per minute
  tpmLimit: number;       // Tokens per minute
  rpdLimit: number;       // Requests per day
  maxConcurrency: number; // Max in-flight requests allowed for this pool (e.g. 5-10)
  apiKey?: string;        // Server secret or injected BYOK
  isByok?: boolean;
}

export interface PoolRuntimeMetrics {
  poolId: string;
  circuitState: CircuitState;
  estimatedRequestsRemaining: number;
  estimatedTokensRemaining: number;
  inFlightRequests: number;
  latencyEma: number;            // Exponential Moving Average of latency (ms)
  errorRate: number;             // Rolling error rate (0.0 - 1.0)
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  cooldownUntil: number;         // Timestamp (ms)
  lastUsedTimestamp: number;
  totalRequestsHandled: number;
  totalTokensConsumed: number;
  quotaPressure: number;         // Normalized Q_i (0.0 - 1.0)
  lastHttpStatus?: number;
  lastErrorMessage?: string;
}

export interface ChatMessagePayload {
  role: 'system' | 'user' | 'assistant' | 'model';
  content: string;
}

export interface GatewayChatRequest {
  id: string;
  userId: string;
  userIp?: string;
  messages: ChatMessagePayload[];
  modelPreference?: string;
  providerPreference?: ProviderType;
  temperature?: number;
  maxTokens?: number;
  isSupremeMode?: boolean;
  stream?: boolean;
  byokApiKey?: string;
  createdAt: number;
}

export interface GatewayChatResponse {
  id: string;
  reply: string;
  modelUsed: string;
  poolUsed: string;
  providerUsed: ProviderType;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  durationMs: number;
  cached?: boolean;
}

export interface SystemGatewayLimits {
  maxConcurrentClients: number;     // e.g. 100 concurrent SSE sessions
  maxGlobalInFlight: number;        // e.g. 15 active LLM calls
  maxQueueBuffer: number;           // e.g. 50 tasks waiting
  maxOutputTokens: number;          // e.g. 450 tokens per turn
  requestTimeoutMs: number;         // e.g. 30000 ms (30s)
  userRateLimitPerMinute: number;   // e.g. 5 req/min per user
  circuitFailureThreshold: number;  // e.g. 4 consecutive errors
  circuitCooldownMs: number;        // e.g. 15000 ms
  circuitProbeSuccessesRequired: number; // e.g. 2 probe successes
}
