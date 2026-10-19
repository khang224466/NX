/**
 * NEXORA AI CAREER COUNSELOR BACKEND SERVICE
 * Core server-side handler for conversational career counseling.
 * Integrates AIProviderAdapter, CounselorResponseContract, and EXORA scientific reasoning.
 */

import {
  resolveActiveProvider,
  getProviderStatus,
  checkRateLimit,
  ChatMessage
} from './ai/aiProviderAdapter.js';
import {
  validateAndNormalizeCounselorResponse,
  CounselorResponseContract,
  CounselorProfileUpdates
} from './ai/counselorSchema.js';

export interface EvidenceProfileInput {
  interests?: string[];
  statedInterests?: string[];
  retractedInterests?: string[];
  demonstratedStrengths?: string[];
  academicStrengths?: string[];
  learningEvidence?: string[];
  academicWeaknesses?: string[];
  workPreferences?: string[];
  workEnvironmentPrefs?: string[];
  constraints?: string[];
  realConstraints?: string[];
  values?: string[];
  personalValues?: string[];
  dislikes?: string[];
  rejectedActivities?: string[];
  untestedInterests?: string[];
  uncertainties?: string[];
  unresolvedContradictions?: string[];
  turnsCount?: number;
}

export function getTuitionContext(msg: string): string {
  if (!msg || typeof msg !== 'string') return '';
  if (!/(học phí|tiền học|chi phí|tài chính|nghị định 116|miễn học phí|bao nhiêu tiền|học bổng|ngân sách|đắt không|rẻ không)/i.test(msg)) {
    return '';
  }
  if (/(sư phạm|giáo viên|dạy học)/i.test(msg)) {
    return 'Dữ liệu học phí: Sư phạm miễn 100% học phí + trợ cấp 3.63 tr/tháng (NĐ 116/2020 & NĐ 238/2025). Ngoài SP thu 17.5-21 tr/năm.';
  }
  if (/(quân đội|công an|an ninh|cảnh sát|sĩ quan)/i.test(msg)) {
    return 'Dữ liệu học phí: Khối Quân đội & Công an bao cấp 100% học phí, ăn ở và sinh hoạt phí.';
  }
  if (/(ngành y|y khoa|y dược|y tế|bác sĩ|răng hàm mặt|dược)/i.test(msg)) {
    return 'Dữ liệu học phí: Y Dược công lập tự chủ 35-90 tr/năm (Y Hà Nội 24.5-62.2 tr, Y Dược TPHCM 35-90 tr); Quân Y miễn 100%; Tư thục 45-140 tr/năm.';
  }
  if (/(bách khoa|công nghệ|cntt|it|khoa học máy tính)/i.test(msg)) {
    return 'Dữ liệu học phí: Bách Khoa HN 29.5-42 tr/năm; ĐH Công nghệ ĐHQGHN 40 tr/năm; PTIT 38.5 tr/năm; Bách Khoa HCM 31.5 tr/năm; FPT 62 tr/năm.';
  }
  if (/(kinh tế|ngoại thương|neu|ftu|tài chính|ueh|hvtc)/i.test(msg)) {
    return 'Dữ liệu học phí: Kinh tế Quốc dân 23.5-52 tr/năm; Ngoại thương 30-85 tr/năm; Học viện Tài chính 28-52.5 tr/năm; UEH 43.5-72 tr/năm.';
  }
  return 'Dữ liệu học phí (NĐ 238/2025/NĐ-CP): Bình quân ĐH 33.7 tr/năm. Công lập 18-35 tr; Tự chủ/Y Dược 35-70 tr; Quốc tế 200-350 tr. Miễn 100%: Sư phạm (NĐ 116 + 3.63 tr/th) & Quân đội, Công an.';
}

/**
 * Builds dynamic system prompt grounded in EXORA framework and evidence accumulator.
 */
export function buildCounselorSystemPrompt(
  profileOrOpts: any,
  maybeRealityAnswer?: string,
  tuitionContext?: string
): string {
  const profile: EvidenceProfileInput =
    profileOrOpts && typeof profileOrOpts === 'object' && ('statedInterests' in profileOrOpts || 'interests' in profileOrOpts)
      ? profileOrOpts
      : profileOrOpts?.profile || {};
  const realityAnswer = profileOrOpts?.realityAnswer || maybeRealityAnswer || '';

  const interests = (profile.interests || profile.statedInterests || []).join(', ') || 'Chưa rõ';
  const strengths = (profile.demonstratedStrengths || profile.academicStrengths || []).join(', ') || 'Chưa rõ';
  const workPrefs = (profile.workPreferences || profile.workEnvironmentPrefs || []).join(', ') || 'Chưa rõ';
  const dislikes = (profile.dislikes || profile.rejectedActivities || []).join(', ') || 'Không có';
  const turns = profile.turnsCount || 1;

  return `Bạn là Cố Vấn Hướng Nghiệp Nexora. Bạn trò chuyện 1:1 chân thành, ấm áp, thấu cảm với học sinh Việt Nam.
Hồ sơ: Lượt ${turns} | Sở thích: ${interests} | Thế mạnh: ${strengths} | Môi trường: ${workPrefs} | Muốn tránh: ${dislikes}${realityAnswer ? ` | Tâm thế tự vấn ban đầu: "${realityAnswer}"` : ''}${tuitionContext ? ` | ${tuitionContext}` : ''}

Quy tắc:
1. Phản hồi súc tích, tự nhiên (1-2 đoạn ngắn), tuyệt đối không dùng văn mẫu hay sáo rỗng.
2. Không vội vàng chốt ngành/nghề khi chưa đủ cơ sở.
3. Mỗi lượt chỉ đặt ĐÚNG 1 CÂU HỎI gợi mở nhẹ nhàng để học sinh tự soi chiếu.
4. Trả về DUY NHẤT chuỗi JSON hợp lệ (không kèm chữ ngoài JSON):
{
  "reply": "Nội dung phản hồi súc tích, ấm áp kèm 1 câu hỏi định hướng",
  "quickReplies": ["Gợi ý trả lời ngắn 1", "Gợi ý 2", "Gợi ý 3"]
}`;
}

export interface CounselorChatRequestArgs {
  body: {
    sessionId?: string;
    message?: string;
    history?: Array<{ role: string; content: string }>;
    profile?: any;
    realityAnswer?: string;
  };
  headers?: Record<string, string | string[] | undefined>;
  env?: Record<string, string | undefined>;
}

export interface CounselorChatResult {
  status: number;
  data: {
    success: boolean;
    code?: string;
    error?: string;
    sessionId?: string;
    modelUsed?: string;
    provider?: string;
    replyText?: string;
    quickReplies?: string[];
    contract?: CounselorResponseContract;
    detectedUpdates?: any;
  };
}

/**
 * Handle POST /api/ai/counselor/chat
 */
export async function handleCounselorChatRequest({
  body,
  headers = {},
  env = process.env
}: CounselorChatRequestArgs): Promise<CounselorChatResult> {
  const parsedBody = typeof body === 'string' ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : (body || {});
  const { sessionId, message, history = [], profile = {}, realityAnswer = '' } = parsedBody;

  // 1. Validate Input
  if (!message || typeof message !== 'string' || !message.trim()) {
    return {
      status: 400,
      data: {
        success: false,
        code: 'INVALID_INPUT',
        error: 'Nội dung tin nhắn không được để trống.'
      }
    };
  }

  // 2. Length Guard: Max 2000 chars per message to avoid token abuse
  const cleanMessage = message.trim().slice(0, 2000);

  // 3. Rate Limiter Guard: Sliding window per session/IP
  const clientIdentifier = (sessionId || (headers['x-forwarded-for'] as string) || 'global_client').toString();
  const rateLimit = checkRateLimit(clientIdentifier);
  if (!rateLimit.allowed) {
    return {
      status: 429,
      data: {
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        error: `Bạn đang gửi yêu cầu quá nhanh. Vui lòng đợi ${rateLimit.retryAfterSeconds || 5} giây rồi thử lại nhé.`
      }
    };
  }

  // 4. Resolve Server-Side AI Provider Adapter
  const activeProvider = resolveActiveProvider(env);

  if (!activeProvider) {
    return {
      status: 503,
      data: {
        success: false,
        code: 'ADMIN_KEY_REQUIRED',
        error:
          'Hệ thống AI chưa được cấu hình API Key trên máy chủ (biến môi trường GEMINI_API_KEY hoặc GROQ_API_KEY trong file .env hoặc trên Vercel). Quản trị viên vui lòng cấu hình để kích hoạt AI Career Counselor thời gian thực.'
      }
    };
  }

  // 5. Construct System Prompt & Format Message History
  const tuitionContext = getTuitionContext(cleanMessage);
  const systemPrompt = buildCounselorSystemPrompt({ profile, realityAnswer }, undefined, tuitionContext);

  // Limit recent history to 6 items to prevent token waste
  const recentHistory = Array.isArray(history) ? history.slice(-6) : [];
  const formattedMessages: ChatMessage[] = [];

  for (const item of recentHistory) {
    if (item && item.content && typeof item.content === 'string') {
      const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
      formattedMessages.push({
        role,
        content: item.content.slice(0, 1000)
      });
    }
  }

  // Add current user prompt
  formattedMessages.push({
    role: 'user',
    content: cleanMessage
  });

  // 6. Execute Completion via Adapter with Resilient Timeout Handling
  try {
    const completion = await activeProvider.complete({
      systemPrompt,
      messages: formattedMessages,
      timeoutMs: 25000,
      env
    });

    // 7. Validate and Normalize Structured Output Schema
    const contract = validateAndNormalizeCounselorResponse(completion.text);

    return {
      status: 200,
      data: {
        success: true,
        sessionId: sessionId || `sess_${Date.now()}`,
        modelUsed: completion.modelUsed,
        provider: completion.provider,
        replyText: contract.reply,
        quickReplies: contract.quickReplies,
        contract,
        detectedUpdates: {
          statedInterests: contract.profileUpdates.interests,
          retractedInterests: contract.profileUpdates.retractedInterests,
          academicStrengths: contract.profileUpdates.demonstratedStrengths,
          academicWeaknesses: contract.profileUpdates.learningEvidence,
          workEnvironmentPrefs: contract.profileUpdates.workPreferences,
          realConstraints: contract.profileUpdates.constraints,
          personalValues: contract.profileUpdates.values,
          rejectedActivities: contract.profileUpdates.dislikes,
          missingEvidence: contract.profileUpdates.uncertainties
        }
      }
    };
  } catch (err: any) {
    const status = err.status || 500;
    const isTimeout = status === 504 || err.message?.includes('timeout');

    let userMsg = 'Đã có lỗi xảy ra khi kết nối tới dịch vụ AI.';
    if (isTimeout) {
      userMsg = 'Yêu cầu kết nối AI bị quá thời gian chờ (timeout sau 25 giây). Bạn vui lòng thử lại nhé.';
    } else if (status === 429) {
      userMsg = 'Hệ thống AI đang nhận được nhiều yêu cầu cùng lúc. Bạn vui lòng chờ một lát rồi nhấn Thử lại nhé.';
    } else if (status === 401 || status === 403) {
      userMsg = 'Khóa API trên máy chủ không hợp lệ hoặc đã hết hạn. Quản trị viên vui lòng kiểm tra lại cấu hình biến môi trường.';
    } else if (err.message) {
      userMsg = `Lỗi dịch vụ AI: ${err.message}`;
    }

    return {
      status: status >= 400 && status < 600 ? status : 500,
      data: {
        success: false,
        code: isTimeout ? 'TIMEOUT' : `AI_ERROR_${status}`,
        error: userMsg
      }
    };
  }
}

/**
 * Handle GET /api/ai/counselor/status
 */
export function handleCounselorStatusRequest(env = process.env) {
  const status = getProviderStatus(env);
  return {
    status: 200,
    data: {
      success: true,
      hasServerKey: status.hasServerKey,
      provider: status.provider,
      model: status.model,
      requiresAdminSetup: !status.hasServerKey
    }
  };
}
