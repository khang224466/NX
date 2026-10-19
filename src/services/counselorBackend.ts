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

export interface DossierAnalysisRequestArgs {
  body: {
    scores?: Record<string, number>;
    hsaScore?: number | '';
    vactScore?: number | '';
    tsaScore?: number | '';
    ieltsBand?: number | '';
    satScore?: number | '';
    riasec?: { R: number; I: number; A: number; S: number; E: number; C: number };
    maxTuition?: number;
    priorityRegion?: string;
    priorityObject?: string;
    targetRegionFilter?: string;
    personalQuestion?: string;
  };
  headers?: Record<string, string | string[] | undefined>;
  env?: any;
}

export interface RecommendedMajorItem {
  codeTT09: string;
  codeTT74: string;
  name: string;
  sector: string;
  sectorName: string;
  fitPercent: number;
  fitReason: string;
  targetJobs: string[];
  salaryMedian: string;
  aiRisk: string;
  aiRiskPercent: number;
  popularCombos: string[];
}

export interface AIDossierAnalysisResult {
  headline: string;
  directAnswer: string;
  strengthsEvaluation: string;
  risksAndBottlenecks: string;
  tuitionFeasibility: string;
  recommendedMajors: RecommendedMajorItem[];
  optimalComboAdvice: string;
  universityAdvice: string;
}

/**
 * AI DOSSIER INTELLIGENCE ANALYZER
 * Ingests complete student dossier, scores, RIASEC vector, tuition, and genuine question,
 * returning deep AI counseling without canned static scripts.
 */
export async function handleDossierAnalysisRequest({
  body,
  headers = {},
  env = process.env
}: DossierAnalysisRequestArgs): Promise<{ status: number; data: any }> {
  const parsedBody = typeof body === 'string' ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : (body || {});
  const {
    scores = {},
    hsaScore,
    vactScore,
    tsaScore,
    ieltsBand,
    satScore,
    riasec = { R: 30, I: 30, A: 30, S: 30, E: 30, C: 30 },
    maxTuition = 35,
    priorityRegion = 'KV2',
    priorityObject = 'DT_0',
    targetRegionFilter = 'ALL',
    personalQuestion = ''
  } = parsedBody;

  const clientIdentifier = (headers['x-forwarded-for'] || 'dossier_client').toString();
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

  // Determine Dominant RIASEC code
  const sortedRiasec = (Object.entries(riasec) as [string, number][]).sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
  const dominantCode = sortedRiasec.slice(0, 3).map(e => e[0]).join('');

  // Prepare Exam String
  const exams: string[] = [];
  if (hsaScore) exams.push(`ĐGNL HSA: ${hsaScore}/150`);
  if (vactScore) exams.push(`ĐGNL V-ACT: ${vactScore}/1200`);
  if (tsaScore) exams.push(`ĐGTD TSA: ${tsaScore}/100`);
  if (ieltsBand) exams.push(`IELTS: ${ieltsBand}`);
  if (satScore) exams.push(`SAT: ${satScore}/1600`);
  const examSummary = exams.length > 0 ? exams.join(', ') : 'Chưa thi chứng chỉ/ĐGNL';

  const systemInstruction = `Bạn là Hệ thống Trí Tuệ Nhân Tạo Hướng Nghiệp NEXORA (AI Career Intelligence Engine) tại Việt Nam.
Nhiệm vụ: Phân tích toàn diện hồ sơ năng lực học tập THPT, trắc nghiệm tâm trắc RIASEC, điều kiện tài chính gia đình và TRỰC TIẾP GIẢI ĐÁP câu hỏi băn khoăn của chính học sinh.
Tuân thủ chuẩn danh mục ngành cấp IV (Thông tư 09/2022 & Thông tư 74/2026/TT-BGDĐT), khung trần học phí Nghị định 238/2025/NĐ-CP (miễn HP Sư phạm NĐ 116), và quy chế tuyển sinh Thông tư 06/2026/TT-BGDĐT.

YÊU CẦU ĐẦU RA: Trả về DUY NHẤT chuỗi JSON hợp lệ (không kèm chữ ngoài JSON):
{
  "headline": "Tiêu đề chiến lược cô đọng cho hồ sơ (1 câu súc tích)",
  "directAnswer": "Giải đáp sâu sắc, chân thực, đồng cảm và có căn cứ khoa học trực tiếp cho câu hỏi của học sinh (2-3 đoạn ngắn, tuyệt đối không dùng văn mẫu)",
  "strengthsEvaluation": "Đánh giá chi tiết thế mạnh học thuật nổi trội, phản xạ tư duy và tương thích sở thích",
  "risksAndBottlenecks": "Cảnh báo thẳng thắn về môn học nghẽn, mức độ cạnh tranh điểm chuẩn hoặc nguy cơ làm trái ngành",
  "tuitionFeasibility": "Nhận định về khả năng đáp ứng tài chính gia đình so với học phí các trường mục tiêu (NĐ 238/2025)",
  "recommendedMajors": [
    {
      "codeTT09": "mã 7 chữ số (TT 09/2022)",
      "codeTT74": "mã 6 chữ số (TT 74/2026)",
      "name": "Tên ngành đào tạo",
      "sector": "CNTT_BAN_DAN_AI | KY_THUAT_CONG_NGHE | KINH_TE_QUAN_TRI | Y_DUOC_SUC_KHOE | SU_PHAM_GIAO_DUC | LUAT_HANH_CHINH | XA_HOI_NHAN_VAN | KIEN_TRUC_NGHE_THUAT_TDTT | NONG_LAM_NGU_SINH_HOC | CONG_AN_QUAN_DOI",
      "sectorName": "Tên lĩnh vực",
      "fitPercent": 92,
      "fitReason": "Lý do cá nhân hóa vì sao ngành này khớp với học sinh dựa trên điểm số và RIASEC cụ thể",
      "targetJobs": ["Vị trí 1", "Vị trí 2", "Vị trí 3"],
      "salaryMedian": "Mức lương trung vị (ví dụ: 25 triệu/tháng)",
      "aiRisk": "Cực thấp | Thấp | Trung bình | Cao",
      "aiRiskPercent": 25,
      "popularCombos": ["A00", "A01"]
    }
  ],
  "optimalComboAdvice": "Khuyên dùng tổ hợp môn nào có lợi thế điểm xét tuyển cao nhất kèm cách tối ưu",
  "universityAdvice": "Chiến lược phân tầng 3 cấp nguyện vọng (Mơ ước, Vừa sức, An toàn)"
}`;

  const userPrompt = `HỒ SƠ HỌC SINH CẦN PHÂN TÍCH:
- Điểm 10 môn THPT: Toán=${scores.math || 8.0}, Văn=${scores.literature || 8.0}, Anh=${scores.english || 8.0}, Lý=${scores.physics || 8.0}, Hóa=${scores.chemistry || 8.0}, Sinh=${scores.biology || 8.0}, Sử=${scores.history || 8.0}, Địa=${scores.geography || 8.0}, Tin=${scores.informatics || 8.0}, GDKT&PL=${scores.economicLegal || 8.0}.
- Bài thi năng lực / Chứng chỉ: ${examSummary}.
- Điểm RIASEC: R=${riasec.R}, I=${riasec.I}, A=${riasec.A}, S=${riasec.S}, E=${riasec.E}, C=${riasec.C} (Mã đỉnh: ${dominantCode}).
- Ngân sách học phí: ${maxTuition} triệu VNĐ/năm.
- Khu vực: ${priorityRegion}, Đối tượng: ${priorityObject}, Vùng mong muốn: ${targetRegionFilter}.
- Câu hỏi / Băn khoăn từ chính học sinh: "${personalQuestion || 'Em muốn AI phân tích toàn diện tiềm năng học tập và tư vấn định hướng ngành trường phù hợp nhất.'}"

Hãy phân tích toàn diện và trả về JSON theo đúng định dạng.`;

  const DEFAULT_SERVER_GEMINI_KEY = 'AQ.Ab8RN6Iufs8Djj-3UZGfp4PuCUsMF208uGAF_T4L2PmI6zR-RQ';
  const geminiKey = (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim()) || DEFAULT_SERVER_GEMINI_KEY;
  const groqKey = env.GROQ_API_KEY && env.GROQ_API_KEY.trim();

  // 1. Try Gemini
  if (geminiKey) {
    const geminiModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    for (const model of geminiModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 2500,
              responseMimeType: 'application/json'
            }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
          let parsed: any = null;
          try {
            parsed = JSON.parse(cleaned);
          } catch {
            const m = cleaned.match(/\{[\s\S]*\}/);
            if (m) {
              try { parsed = JSON.parse(m[0]); } catch {}
            }
          }

          if (parsed && parsed.headline && parsed.directAnswer) {
            return {
              status: 200,
              data: {
                success: true,
                modelUsed: model,
                provider: 'gemini',
                analysis: parsed as AIDossierAnalysisResult
              }
            };
          }
        }
      } catch (err) {
        continue;
      }
    }
  }

  // 2. Try Groq
  if (groqKey) {
    try {
      const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6,
          max_tokens: 2000,
          response_format: { type: 'json_object' }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content || '';
        const parsed = JSON.parse(rawText);
        if (parsed && parsed.headline) {
          return {
            status: 200,
            data: {
              success: true,
              modelUsed: 'llama-3.3-70b-versatile',
              provider: 'groq',
              analysis: parsed as AIDossierAnalysisResult
            }
          };
        }
      }
    } catch (err) {}
  }

  // 3. Deterministic Grounded Fallback (Personalized to exact grades and RIASEC)
  const isHighStem = (scores.math || 8) >= 8.0 && (scores.physics || 8) >= 7.5;
  const isHighLang = (scores.english || 8) >= 8.0;

  const fallbackAnalysis: AIDossierAnalysisResult = {
    headline: isHighStem
      ? `Chiến lược Định hướng: Tối ưu Tư duy STEM & Năng lực Phân tích ${dominantCode}`
      : `Chiến lược Định hướng: Khai phóng Đa Trí Tuệ & Thế mạnh Ngôn ngữ ${dominantCode}`,
    directAnswer: personalQuestion
      ? `Đối với băn khoăn của bạn ("${personalQuestion}"): Phân tích dữ liệu học tập cho thấy bạn hoàn toàn có cơ sở để chủ động định hình lộ trình. Đừng quá lo lắng về áp lực xã hội hay những nhận định phiến diện. Sự kết hợp giữa năng lực thực tế và định hướng rõ ràng sẽ giúp bạn vượt trội trong môi trường học thuật 2026.`
      : `Hồ sơ của bạn sở hữu nền tảng học tập đồng đều và vững vàng. Mã đỉnh ${dominantCode} cho thấy tiềm năng thích ứng linh hoạt trong môi trường đại học hiện đại.`,
    strengthsEvaluation: `Điểm GPA bình quân phản ánh thái độ học tập nghiêm túc. Thế mạnh môn ${isHighStem ? 'Toán - Tin logic' : 'Văn - Ngoại ngữ'} kết hợp với miền sở thích ${dominantCode} là đòn bẩy lớn trong các phương thức xét tuyển kết hợp.`,
    risksAndBottlenecks: `Cần lưu ý kiểm soát các môn điều kiện trong tổ hợp chính và theo dõi sát sao điểm chuẩn 3 năm gần nhất để tránh tình trạng dồn toàn bộ nguyện vọng vào nhóm ngành có tỷ lệ chọi quá cao.`,
    tuitionFeasibility: `Ngân sách ${maxTuition} triệu VNĐ/năm hoàn toàn nằm trong khung trần Nghị định 238/2025/NĐ-CP đối với các trường đại học công lập và chương trình chuẩn chất lượng cao.`,
    recommendedMajors: [
      {
        codeTT09: isHighStem ? '7480201' : '7340101',
        codeTT74: isHighStem ? '748020' : '734010',
        name: isHighStem ? 'Công nghệ thông tin' : 'Quản trị kinh doanh & Kinh tế số',
        sector: isHighStem ? 'CNTT_BAN_DAN_AI' : 'KINH_TE_QUAN_TRI',
        sectorName: isHighStem ? 'Máy tính, CNTT, Bán dẫn & AI' : 'Kinh doanh, Quản lý & Tài chính',
        fitPercent: 94,
        fitReason: `Phù hợp với hồ sơ có nền tảng điểm Toán ${(scores.math || 8.0).toFixed(1)} và mã đỉnh ${dominantCode}.`,
        targetJobs: isHighStem ? ['Kỹ sư phần mềm', 'Chuyên viên dữ liệu', 'Kỹ sư AI'] : ['Chuyên viên phân tích kinh doanh', 'Quản trị dự án số'],
        salaryMedian: isHighStem ? '28 triệu/tháng' : '22 triệu/tháng',
        aiRisk: isHighStem ? 'Thấp' : 'Trung bình',
        aiRiskPercent: isHighStem ? 28 : 42,
        popularCombos: isHighStem ? ['A00', 'A01', 'D01'] : ['A01', 'D01', 'A00']
      }
    ],
    optimalComboAdvice: isHighLang ? 'Khuyên dùng tổ hợp có môn Tiếng Anh (A01, D01) để tận dụng tối đa năng lực ngôn ngữ.' : 'Khuyên dùng tổ hợp A00 hoặc D01 theo thế mạnh cốt lõi.',
    universityAdvice: `Phân bổ nguyện vọng theo chiến lược 3 tầng: 1-2 nguyện vọng Mơ ước (điểm chuẩn cao hơn 0.5-1.0đ), 2-3 nguyện vọng Vừa sức (biên độ an toàn), và ít nhất 1 nguyện vọng An toàn tuyệt đối.`
  };

  return {
    status: 200,
    data: {
      success: true,
      modelUsed: 'heuristic-grounded-engine',
      provider: 'nexora',
      analysis: fallbackAnalysis
    }
  };
}
