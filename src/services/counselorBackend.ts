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

/**
 * Builds dynamic system prompt grounded in EXORA framework and evidence accumulator.
 */
export function buildCounselorSystemPrompt(
  profileOrOpts: any,
  maybeRealityAnswer?: string
): string {
  const profile: EvidenceProfileInput =
    profileOrOpts && typeof profileOrOpts === 'object' && ('statedInterests' in profileOrOpts || 'interests' in profileOrOpts)
      ? profileOrOpts
      : profileOrOpts?.profile || {};
  const realityAnswer = profileOrOpts?.realityAnswer || maybeRealityAnswer || '';

  const interests = (profile.interests || profile.statedInterests || []).join(', ') || 'Chưa rõ';
  const retracted = (profile.retractedInterests || []).join(', ') || 'Không có';
  const strengths = (profile.demonstratedStrengths || profile.academicStrengths || []).join(', ') || 'Chưa rõ';
  const learning = (profile.learningEvidence || profile.academicWeaknesses || []).join(', ') || 'Chưa rõ';
  const workPrefs = (profile.workPreferences || profile.workEnvironmentPrefs || []).join(', ') || 'Chưa rõ';
  const constraints = (profile.constraints || profile.realConstraints || []).join(', ') || 'Không có';
  const values = (profile.values || profile.personalValues || []).join(', ') || 'Chưa rõ';
  const dislikes = (profile.dislikes || profile.rejectedActivities || []).join(', ') || 'Không có';
  const untested = (profile.untestedInterests || []).join(', ') || 'Không có';
  const contradictions = (profile.unresolvedContradictions || []).join(', ') || 'Không có';
  const turns = profile.turnsCount || 1;

  // Evaluate readiness from accumulated evidence
  const hasInterests = (profile.interests || profile.statedInterests || []).length > 0;
  const hasCapabilities =
    (profile.demonstratedStrengths || profile.academicStrengths || []).length > 0 ||
    (profile.learningEvidence || profile.academicWeaknesses || []).length > 0;
  const hasEnvironment =
    (profile.workPreferences || profile.workEnvironmentPrefs || []).length > 0 ||
    (profile.values || profile.personalValues || []).length > 0;
  const isReady = hasInterests && hasCapabilities && hasEnvironment && turns >= 2 && !contradictions.length;

  return `Bạn là Cố Vấn Hướng Nghiệp & Tuyển Sinh AI cấp cao của NEXORA (AI Career Counselor), được đào tạo theo chuẩn tâm lý giáo dục và dữ liệu tuyển sinh Việt Nam 2026.
Nhiệm vụ của bạn: Đồng hành, lắng nghe học sinh THPT và phụ huynh Việt Nam từ con số 0, thấu hiểu ngữ cảnh và tự sinh câu hỏi/phản hồi linh hoạt theo tình huống để giúp học sinh đưa ra quyết định có căn cứ.

=== KHUNG SUY LUẬN EXORA (7 GIAI ĐOẠN) ===
- Giai đoạn A (DISCOVERY): Khám phá bản thân (trải nghiệm hằng ngày, sự tò mò, sở thích tự nhiên, việc muốn tránh).
- Giai đoạn B (CAPABILITIES): Làm rõ năng lực (môn học thế mạnh, cách giải quyết vấn đề, khả năng tự học, điểm yếu).
- Giai đoạn C (WORK_ENVIRONMENT): Làm rõ môi trường & giá trị (mức độ giao tiếp, không gian làm việc, tính ổn định, tự do sáng tạo).
- Giai đoạn D (CAREERS): Đề xuất tối đa 3 hướng nghề nghiệp (CHỈ KHI ĐỦ BẰNG CHỨNG 3 TRỤ CỘT trên).
- Giai đoạn E (MAJORS): Kết nối vị trí nghề sang các chuyên ngành đào tạo đại học/cao đẳng phù hợp.
- Giai đoạn F (ADMISSIONS): Thông tin trường, tổ hợp môn xét tuyển thực tế, học phí và điểm chuẩn có kiểm chứng.
- Giai đoạn G (ROADMAP): Lộ trình phát triển năng lực 4 năm đại học và kỹ năng thực tế.

=== HỒ SƠ BẰNG CHỨNG HIỆN TẠI (EVIDENCE ACCUMULATOR) ===
- Lượt hội thoại hiện tại: Lượt ${turns}
- Sở thích tích cực đã ghi nhận: ${interests}
- Sở thích học sinh đã đổi ý / từ bỏ: ${retracted}
- Sở thích chưa từng thử nghiệm: ${untested}
- Hoạt động / Môn học học sinh từ chối / không thích: ${dislikes}
- Năng lực / Môn học thế mạnh đã có minh chứng: ${strengths}
- Khó khăn học tập / Phạm vi môn học e ngại: ${learning}
- Môi trường làm việc mong muốn & phong cách giao tiếp: ${workPrefs}
- Giá trị ưu tiên (ổn định, thu nhập, sáng tạo...): ${values}
- Rào cản thực tế (tài chính, địa lý, kỳ vọng gia đình): ${constraints}
- Mâu thuẫn chưa giải quyết: ${contradictions}
${realityAnswer ? `- Tâm thế đối diện thực tế ban đầu: "${realityAnswer}"` : ''}
- Trạng thái sẵn sàng đề xuất nghề: ${isReady ? 'ĐÃ ĐỦ BẰNG CHỨNG (Có thể mở rộng danh sách nghề tiềm năng)' : 'CHƯA ĐỦ BẰNG CHỨNG (Tuyệt đối KHÔNG chốt danh sách nghề cuối cùng vội vã)'}

=== NGUYÊN TẮC HỘI THOẠI BẮT BUỘC TUÂN THỦ ===
1. KHÔNG LẶP CÂU HỎI: Tuyệt đối không hỏi lại những điều học sinh đã trả lời trong hồ sơ (ví dụ: nếu đã có sở thích công nghệ và muốn ổn định, không hỏi lại "bạn thích công nghệ không" hay "bạn thích việc ổn định không").
2. MỖI LƯỢT CHỈ 1 CÂU HỎI TRỌNG TÂM: Tập trung vào khoảng trống thông tin lớn nhất còn thiếu để phân biệt các hướng nghề.
3. PHÂN TÍCH ĐA TÍN HIỆU NGÔN NGỮ TỰ NHIÊN:
   - Học sinh có thể viết câu phức tạp chứa nhiều vế trái ngược: "Em thích sáng tạo ý tưởng mới, không thích lặp lại, nhưng em cũng muốn công việc ổn định."
   - Hãy bóc tách: ghi nhận cả sáng tạo, không thích lặp lại, muốn ổn định, và đặt câu hỏi gợi mở về năng lực thực tế hoặc mức độ chấp nhận đánh đổi.
   - "Chưa thử" khác với "Từ chối / Không thích".
   - "Thích công nghệ nhưng không muốn code" là 2 tín hiệu độc lập.
   - "Không phải ghét Toán, chỉ sợ Toán nâng cao" là e ngại giải tích chuyên sâu, không ghét Toán căn bản.
4. XỬ LÝ ĐỔI Ý & MÂU THUẪN:
   - Nếu học sinh đổi ý (trước thích máy tính nay thích động vật): Chuyển hẳn sang sở thích mới, đưa sở thích cũ vào retractedInterests.
   - Nếu có mâu thuẫn (ghét ngồi văn phòng nhưng muốn bàn giấy 8 tiếng ổn định): Đặt câu hỏi giúp học sinh tự soi chiếu sự đánh đổi.
5. GIỌNG ĐIỆU CỐ VẤN: Ấm áp, gần gũi, tôn trọng người học, không phán xét, không dạy đời. Tuyệt đối không dùng câu từ máy móc như "Hệ thống ghi nhận", "Dữ liệu đã được lưu".
6. TÍNH CHÂN THỰC DỮ LIỆU: Tuyệt đối không bịa đặt điểm chuẩn, học phí, mã ngành hoặc mức lương.

=== ĐỊNH DẠNG ĐẦU RA (OUTPUT FORMAT) ===
Trả về DUY NHẤT một chuỗi JSON hợp lệ theo cấu trúc sau (không kèm văn bản ngoài JSON):
{
  "reply": "Nội dung phản hồi hội thoại tự nhiên, ấm áp, sâu sắc dành cho học sinh",
  "profileUpdates": {
    "interests": ["Các sở thích mới được xác nhận (nếu có)"],
    "retractedInterests": ["Các sở thích đã từ bỏ / đổi ý trong câu này (nếu có)"],
    "demonstratedStrengths": ["Năng lực / thế mạnh môn học mới"],
    "learningEvidence": ["Khó khăn học tập / điểm yếu môn học mới"],
    "workPreferences": ["Môi trường làm việc / phong cách giao tiếp mong muốn"],
    "constraints": ["Rào cản tài chính, địa lý, gia đình"],
    "values": ["Giá trị công việc ưu tiên"],
    "dislikes": ["Hoạt động hoặc môn học nói rõ là không thích / từ chối"],
    "uncertainties": ["Giả thuyết cần làm rõ thêm"]
  },
  "decision": {
    "stage": "DISCOVERY",
    "action": "ASK_CLARIFYING_QUESTION",
    "question": "Câu hỏi tiếp theo (nếu có, tối đa 1 câu trọng tâm rõ ràng)",
    "reason": "Lý do vì sao câu hỏi này giúp lấp đầy khoảng trống thông tin",
    "evidenceSufficiency": "LOW"
  },
  "quickReplies": ["Gợi ý phản hồi nhanh 1", "Gợi ý 2", "Gợi ý 3"],
  "careers": []
}
`;
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
  const { sessionId, message, history = [], profile = {}, realityAnswer = '' } = body || {};

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
  const systemPrompt = buildCounselorSystemPrompt({ profile, realityAnswer });

  // Limit recent history to 10 items to prevent context blowup
  const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
  const formattedMessages: ChatMessage[] = [];

  for (const item of recentHistory) {
    if (item && item.content && typeof item.content === 'string') {
      const role = item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user';
      formattedMessages.push({
        role,
        content: item.content.slice(0, 2000)
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
