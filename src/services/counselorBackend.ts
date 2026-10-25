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
import seedData from '../data/seed_data.json';
import { getAdmissionsWorkbookContext } from '../data/admissionsWorkbookSearch.js';
import {
  createRiasecProfileFromNormalizedScores,
  rankMajorsByEvidence
} from './assessment/recommendationEngine';
export { SECTOR_RIASEC_VECTORS } from '../data/riasecSectorProfiles';

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
  const sourcedAdmissionsContext = getAdmissionsWorkbookContext(msg, { maxCharacters: 3400 });
  if (sourcedAdmissionsContext.includes('Học viện Âm nhạc Quốc gia Việt Nam')) {
    return `Thông tin học phí/học bổng theo nguồn chính thức đã đối chiếu:\n${sourcedAdmissionsContext}`;
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

  return `# VAI TRÒ (ROLE)
Bạn là Hệ thống AI Tư vấn Hướng nghiệp & Tuyển sinh thông minh tại Việt Nam. Nhiệm vụ của bạn là dẫn dắt học sinh qua quy trình 4 bước: (1) Xác định Ngành -> (2) Chọn Tổ hợp môn -> (3) Định hướng Việc làm -> (4) Đối chiếu & Phân tích chuỗi ảnh hưởng.

# NGUYÊN TẮC GIAO DIỆN TỐI GIẢN (UI/UX RULES)
- Mỗi lượt chỉ hỏi NGẮN GỌN 1 bước duy nhất. Không hỏi dồn dập.
- Tự động kế thừa dữ liệu: Không bao giờ hỏi lại "thế mạnh, sở thích" nếu người dùng đã cung cấp ở bước trước.
- Luôn hiển thị bảng [HỒ SƠ ĐÃ LƯU] ở đầu mỗi câu trả lời để người dùng thấy kết quả cũ đang được ghi nhớ.
- Phong cách: Điềm đạm, ít chữ, cơ bản tôn trọng, cổ điển, không dùng lời lẽ máy móc, buzzwords như "siêu AI".

Hồ sơ hiện tại: Lượt ${turns} | Sở thích: ${interests} | Thế mạnh: ${strengths} | Môi trường: ${workPrefs} | Muốn tránh: ${dislikes}${realityAnswer ? ` | Tâm thế: "${realityAnswer}"` : ''}${tuitionContext ? ` | ${tuitionContext}` : ''}

# QUY TRÌNH XỬ LÝ & LƯU TRẠNG THÁI (WORKFLOW & STATE)
- BƯỚC 1: XÁC ĐỊNH NGÀNH HỌC (Đã có ngành -> lưu; Chưa có -> phân tích sở thích/thế mạnh, đề xuất 2-3 ngành, yêu cầu chốt 1 ngành).
- BƯỚC 2: CHỌN TỔ HỢP MÔN (Ràng buộc cứng: chỉ xét tổ hợp tuyển sinh ngành ở Bước 1. Phân tích hệ quả đỗ trường top nào).
- BƯỚC 3: ĐỊNH HƯỚNG VIỆC LÀM (Đề xuất 2-3 vị trí thực tế khớp ngành B1 và năng lực B2).
- BƯỚC 4: ĐỐI CHIẾU & PHÂN TÍCH CHUỖI ẢNH HƯỞNG (Kiểm tra độ khớp, What-if analysis: 3-5 trường khả thi, cạnh tranh tổ hợp, lộ trình việc làm).

# ĐỊNH DẠNG PHẢN HỒI (BẮT BUỘC TRONG TRƯỜNG "reply")
📌 **[HỒ SƠ ĐÃ LƯU]**
- Ngành: [Chưa xác định / Tên ngành]
- Tổ hợp & Điểm dự kiến: [Chưa xác định / Tổ hợp - Điểm]
- Việc làm mục tiêu: [Chưa xác định / Tên việc làm]
- Thế mạnh/Sở thích ghi nhận: [Tóm tắt ngắn]

💬 **[PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]**
(Nội dung phân tích ngắn gọn, sắc bén, nêu rõ sự ảnh hưởng giữa các lựa chọn)

👉 **[CÂU HỎI TIẾP THEO]**
(1 câu hỏi duy nhất để người dùng nhập input tiếp theo)

Trả về DUY NHẤT chuỗi JSON hợp lệ:
{
  "reply": "Toàn bộ nội dung tuân thủ đúng 3 khối trên",
  "quickReplies": ["Lựa chọn nhanh 1", "Lựa chọn nhanh 2"]
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
  fitPercent: number | null;
  interestSimilarityIndex: number | null;
  recommendationBasis: 'RIASEC_PROFILE' | 'TEXT_EXPLORATION' | 'AI_HYPOTHESIS';
  fitReason: string;
  targetJobs: string[];
  salaryMedian: string | null;
  aiRisk: string | null;
  aiRiskPercent: number | null;
  popularCombos: string[];
  bestCombo?: string;
  bestComboScore?: number | null;
}

export interface AIDossierAnalysisResult {
  headline: string;
  directAnswer: string;
  strengthsEvaluation: string;
  risksAndBottlenecks: string;
  tuitionFeasibility: string;
  recommendedSectors?: string[];
  avoidSectors?: string[];
  recommendedKeywords?: string[];
  recommendedMajors: RecommendedMajorItem[];
  optimalComboAdvice: string;
  universityAdvice: string;
}

export interface AIDiagnosisSemanticResult {
  headline: string;
  directAnswer: string;
  strengthsEvaluation: string;
  risksAndBottlenecks: string;
  tuitionFeasibility: string;
  recommendedSectors?: string[];
  avoidSectors?: string[];
  recommendedKeywords?: string[];
  optimalComboAdvice: string;
  universityAdvice: string;
}

export const SECTOR_META: Record<string, {
  name: string;
  salaryRange: string;
  salaryMedian: string;
  aiRisk: string;
  aiRiskPercent: number;
  popularCombos: string[];
  popularJobs?: string[];
}> = {
  CNTT_BAN_DAN_AI: {
    name: 'Máy tính, CNTT, Bán dẫn & AI',
    salaryRange: '18 - 50 triệu/tháng',
    salaryMedian: '28 triệu',
    aiRisk: 'Thấp',
    aiRiskPercent: 28,
    popularCombos: ['A00', 'A01', 'D01', 'D07']
  },
  KY_THUAT_CONG_NGHE: {
    name: 'Kỹ thuật - Công nghệ & Xây dựng',
    salaryRange: '15 - 35 triệu/tháng',
    salaryMedian: '22 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 22,
    popularCombos: ['A00', 'A01', 'B00']
  },
  KINH_TE_QUAN_TRI: {
    name: 'Kinh doanh, Quản lý & Tài chính',
    salaryRange: '13 - 38 triệu/tháng',
    salaryMedian: '19 triệu',
    aiRisk: 'Trung bình',
    aiRiskPercent: 44,
    popularCombos: ['A01', 'D01', 'A00', 'D07']
  },
  Y_DUOC_SUC_KHOE: {
    name: 'Sức khỏe & Y Dược',
    salaryRange: '16 - 55 triệu/tháng',
    salaryMedian: '25 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 12,
    popularCombos: ['B00', 'A00', 'D07']
  },
  SU_PHAM_GIAO_DUC: {
    name: 'Khoa học Giáo dục & Sư phạm',
    salaryRange: '10 - 24 triệu/tháng',
    salaryMedian: '15 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 15,
    popularCombos: ['A00', 'A01', 'C00', 'D01']
  },
  LUAT_HANH_CHINH: {
    name: 'Pháp luật & Quản lý Nhà nước',
    salaryRange: '12 - 40 triệu/tháng',
    salaryMedian: '19 triệu',
    aiRisk: 'Trung bình',
    aiRiskPercent: 38,
    popularCombos: ['A00', 'A01', 'C00', 'D01']
  },
  XA_HOI_NHAN_VAN: {
    name: 'Khoa học Xã hội & Nhân văn',
    salaryRange: '11 - 32 triệu/tháng',
    salaryMedian: '17 triệu',
    aiRisk: 'Trung bình',
    aiRiskPercent: 35,
    popularCombos: ['C00', 'D01', 'D14', 'D15']
  },
  KIEN_TRUC_NGHE_THUAT_TDTT: {
    name: 'Kiến trúc, Mỹ thuật & Thiết kế Sáng tạo',
    salaryRange: '14 - 45 triệu/tháng',
    salaryMedian: '23 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 18,
    popularCombos: ['H00', 'V00', 'D01', 'C00']
  },
  NONG_LAM_NGU_SINH_HOC: {
    name: 'Nông Lâm Ngư nghiệp & Sinh học',
    salaryRange: '11 - 28 triệu/tháng',
    salaryMedian: '16 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 14,
    popularCombos: ['A00', 'B00', 'D07']
  },
  CONG_AN_QUAN_DOI: {
    name: 'An ninh, Quốc phòng & Quân sự',
    salaryRange: '12 - 30 triệu/tháng',
    salaryMedian: '18 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 8,
    popularCombos: ['A00', 'A01', 'C00', 'D01']
  }
};

export const COMBINATION_SUBJECTS_MAP: Record<string, string[]> = {
  A00: ['math', 'physics', 'chemistry'],
  A01: ['math', 'physics', 'english'],
  A02: ['math', 'physics', 'biology'],
  B00: ['math', 'chemistry', 'biology'],
  C00: ['literature', 'history', 'geography'],
  C01: ['literature', 'math', 'physics'],
  C02: ['literature', 'math', 'chemistry'],
  C03: ['literature', 'math', 'history'],
  C04: ['literature', 'math', 'geography'],
  D01: ['math', 'literature', 'english'],
  D07: ['math', 'chemistry', 'english'],
  D08: ['math', 'biology', 'english'],
  D09: ['math', 'history', 'english'],
  D10: ['math', 'geography', 'english'],
  D14: ['literature', 'history', 'english'],
  D15: ['literature', 'geography', 'english'],
  H00: ['literature'],
  H01: ['math', 'literature'],
  V00: ['math', 'physics'],
  V01: ['math', 'literature'],
  N00: ['literature'],
  N01: ['literature'],
  M00: ['math', 'literature'],
  M01: ['literature', 'history'],
  T00: ['math', 'biology'],
  T01: ['math', 'chemistry'],
  R00: ['literature', 'history'],
  S00: ['literature'],
  X06: ['math', 'informatics', 'english']
};

/**
 * Matches complete RIASEC profiles independently from admission scores.
 * Text and AI suggestions remain unscored exploration evidence until a full
 * interest profile is available.
 */
export function linkAndRankMajorsWithDossier(
  scores: Record<string, number | '' | undefined>,
  riasecOrInterests?: { R?: number | ''; I?: number | ''; A?: number | ''; S?: number | ''; E?: number | ''; C?: number | '' } | string,
  aiDiagnosis: Partial<AIDiagnosisSemanticResult> = {},
  catalog: any[] = seedData.majorCatalogLevelIV
): RecommendedMajorItem[] {
  const riasecProfile = typeof riasecOrInterests === 'object' && riasecOrInterests !== null
    ? createRiasecProfileFromNormalizedScores(riasecOrInterests)
    : null;
  const interestsText = typeof riasecOrInterests === 'string'
    ? riasecOrInterests
    : String((aiDiagnosis as any)?.user_profile_summary || '');
  const directRecs = Array.isArray((aiDiagnosis as any)?.recommendations) ? (aiDiagnosis as any).recommendations : [];
  const aiSuggestedNames = [
    ...directRecs.map((item: any) => String(item.name || '')).filter(Boolean),
    ...(aiDiagnosis.recommendedKeywords || []).map(String)
  ];
  const ranked = rankMajorsByEvidence(catalog, riasecProfile, interestsText, aiSuggestedNames);

  return ranked.map((major) => {
    const m = major as any;
    const sectorKey = major.sector || 'NGANH_KHAC';
    const meta = SECTOR_META[sectorKey];
    const combos = m.admissionsCombos && m.admissionsCombos.length > 0 ? m.admissionsCombos : (meta?.popularCombos || []);
    const validCombos: Array<{ comboCode: string; score: number }> = [];

    for (const comboCode of combos) {
      const neededSubjects = COMBINATION_SUBJECTS_MAP[comboCode];
      if (!neededSubjects) continue;
      let hasAll = true;
      let sum = 0;
      for (const subj of neededSubjects) {
        const val = scores[subj];
        if (typeof val !== 'number' || isNaN(val)) {
          hasAll = false;
          break;
        }
        sum += val;
      }
      if (hasAll) {
        const scaledScore = neededSubjects.length === 3 ? sum : (sum / neededSubjects.length) * 3;
        validCombos.push({ comboCode, score: Number(scaledScore.toFixed(2)) });
      }
    }

    const bestCombo = validCombos.sort((a, b) => b.score - a.score)[0] || null;
    const recMatch = directRecs.find((r: any) => {
      const rId = String(r.id || '');
      const rName = String(r.name || '').toLowerCase();
      const mName = major.name.toLowerCase();
      return (
        rId === major.codeTT09 ||
        rId.includes(major.codeTT09) ||
        rName === mName ||
        (rName.length >= 4 && mName.includes(rName)) ||
        (mName.length >= 4 && rName.includes(mName))
      );
    });

    return {
      codeTT09: major.codeTT09,
      codeTT74: major.codeTT74 || '',
      name: major.name,
      sector: sectorKey,
      sectorName: meta?.name || 'Lĩnh vực chưa có hồ sơ dữ liệu',
      fitPercent: major.interestSimilarityIndex,
      interestSimilarityIndex: major.interestSimilarityIndex,
      recommendationBasis: major.recommendationBasis,
      fitReason: major.explanation,
      targetJobs: major.targetJobs || meta?.popularJobs || [],
      salaryMedian: m.salaryMedian || meta?.salaryMedian || null,
      aiRisk: m.aiRisk || meta?.aiRisk || null,
      aiRiskPercent: typeof meta?.aiRiskPercent === 'number' ? meta.aiRiskPercent : null,
      popularCombos: meta?.popularCombos || [],
      bestCombo: bestCombo?.comboCode,
      bestComboScore: bestCombo?.score ?? null,
      advantages: recMatch?.advantages || [],
      considerations: recMatch?.considerations || []
    } as any;
  });
}

/**
 * AI DOSSIER INTELLIGENCE ANALYZER
 * Ingests complete student dossier, scores, RIASEC vector, tuition, and genuine question,
 * returning deep AI qualitative diagnosis linked with accredited database records.
 */
export async function handleDossierAnalysisRequest({
  body,
  headers = {},
  env = process.env
}: DossierAnalysisRequestArgs): Promise<{ status: number; data: any }> {
  const parsedBody = typeof body === 'string' ? (() => { try { return JSON.parse(body); } catch { return {}; } })() : (body || {});
  const {
    scores = {},
    aptitudeScores = {},
    hsaScore,
    vactScore,
    tsaScore,
    ieltsBand,
    satScore,
    riasec: rawRiasec = {},
    maxTuition = 35,
    priorityRegion = 'KV2',
    priorityObject = 'DT_0',
    targetRegionFilter = 'ALL',
    personalQuestion = ''
  } = parsedBody;

  const allScores = { ...scores, ...aptitudeScores };

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

  // Never invent a neutral RIASEC profile when the dossier omits one.
  const riasecCodes = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
  const riasecSource = rawRiasec && typeof rawRiasec === 'object' && !Array.isArray(rawRiasec)
    ? rawRiasec as Record<string, unknown>
    : {};
  const riasec = Object.fromEntries(
    riasecCodes
      .filter((code) => typeof riasecSource[code] === 'number' && Number.isFinite(riasecSource[code]) && Number(riasecSource[code]) >= 0 && Number(riasecSource[code]) <= 100)
      .map((code) => [code, Number(riasecSource[code])])
  ) as Partial<Record<typeof riasecCodes[number], number>>;
  const hasCompleteRiasecProfile = riasecCodes.every((code) => typeof riasec[code] === 'number');
  const sortedRiasec = hasCompleteRiasecProfile
    ? (Object.entries(riasec) as [string, number][]).sort((a, b) => b[1] - a[1])
    : [];
  const riasecValues = riasecCodes.map((code) => riasec[code] ?? 0);
  const hasRiasecVariation = hasCompleteRiasecProfile && Math.max(...riasecValues) > Math.min(...riasecValues);
  const dominantCode = hasRiasecVariation
    ? sortedRiasec.slice(0, 3).map(([code]) => code).join('')
    : hasCompleteRiasecProfile
      ? 'hồ sơ cân bằng'
      : 'chưa có dữ liệu RIASEC';
  const riasecSummary = hasCompleteRiasecProfile
    ? riasecCodes.map((code) => `${code}=${riasec[code]}`).join(', ')
    : 'Chưa có hồ sơ RIASEC hoàn chỉnh';

  // Prepare Exam String
  const exams: string[] = [];
  if (hsaScore) exams.push(`ĐGNL HSA: ${hsaScore}/150`);
  if (vactScore) exams.push(`ĐGNL V-ACT: ${vactScore}/1200`);
  if (tsaScore) exams.push(`ĐGTD TSA: ${tsaScore}/100`);
  if (ieltsBand) exams.push(`IELTS: ${ieltsBand}`);
  if (satScore) exams.push(`SAT: ${satScore}/1600`);
  const examSummary = exams.length > 0 ? exams.join(', ') : 'Chưa thi chứng chỉ/ĐGNL';

  // Group entered vs missing subject scores without fabricating fake default grades
  const subjectLabels: Record<string, string> = {
    math: 'Toán học',
    literature: 'Ngữ văn',
    english: 'Tiếng Anh',
    physics: 'Vật lý',
    chemistry: 'Hóa học',
    biology: 'Sinh học',
    history: 'Lịch sử',
    geography: 'Địa lý',
    informatics: 'Tin học',
    economicLegal: 'GDKT&PL',
    apt_veMyThuat: 'Vẽ mỹ thuật (Kiến trúc)',
    apt_hinhHoa: 'Hình họa (Mỹ thuật/Thời trang)',
    apt_trangTri: 'Trang trí/Bố cục màu',
    apt_thamAm: 'Thẩm âm & Tiết tấu (Âm nhạc)',
    apt_thanhNhac: 'Thanh nhạc/Biểu diễn',
    apt_nangKhieuTDTT: 'Năng khiếu Thể dục thể thao',
    apt_nangKhieuMamNon: 'Năng khiếu Mầm non',
    apt_nangKhieuBaoChi: 'Năng khiếu Báo chí',
    apt_nangKhieuDienXuat: 'Năng khiếu Diễn xuất'
  };
  const enteredList: string[] = [];
  const missingList: string[] = [];
  for (const [k, lbl] of Object.entries(subjectLabels)) {
    const val = allScores[k as keyof typeof allScores];
    if (typeof val === 'number' && !isNaN(val) && val >= 0 && val <= 10) {
      enteredList.push(`${lbl}: ${val.toFixed(1)}`);
    } else if (!k.startsWith('apt_')) {
      missingList.push(lbl);
    }
  }

  const systemInstruction = `Bạn là Hệ thống Trí Tuệ Nhân Tạo Hướng Nghiệp NEXORA (AI Career Intelligence Engine) tại Việt Nam.
Nhiệm vụ: Phân tích toàn diện hồ sơ năng lực học tập THPT, trắc nghiệm tâm trắc RIASEC, điều kiện tài chính gia đình và TRỰC TIẾP GIẢI ĐÁP câu hỏi băn khoăn của chính học sinh.
Tuân thủ chuẩn danh mục ngành cấp IV (Thông tư 09/2022 & Thông tư 74/2026/TT-BGDĐT), khung trần học phí Nghị định 238/2025/NĐ-CP (miễn HP Sư phạm NĐ 116), và quy chế tuyển sinh Thông tư 06/2026/TT-BGDĐT.

QUY TẮC CỐT LÕI VỀ MÔN THI & NGÀNH HỌC:
- Học sinh chỉ có thể xét tuyển bằng các môn thi trong danh sách 'CÁC MÔN ĐÃ CÓ ĐIỂM'.
- Đối với 'CÁC MÔN CHƯA CÓ ĐIỂM / KHÔNG THI', học sinh không có điểm thi, tuyệt đối không gợi ý các ngành đòi hỏi tổ hợp bắt buộc môn này.
  (Ví dụ: nếu học sinh chỉ thi Văn, Anh, Sử, Địa thì KHÔNG thể xét tuyển khối A00 Toán-Lý-Hóa, A01 Toán-Lý-Anh, B00 Toán-Hóa-Sinh; các ngành Vi mạch, Bán dẫn, CNTT, Tự động hóa, Y khoa, Sư phạm Toán phải đưa vào avoidSectors!).

YÊU CẦU ĐẦU RA: Trả về DUY NHẤT chuỗi JSON hợp lệ (không kèm chữ ngoài JSON):
{
  "headline": "Tiêu đề chiến lược cô đọng cho hồ sơ (1 câu súc tích)",
  "directAnswer": "Giải đáp sâu sắc, chân thực, đồng cảm và có căn cứ khoa học trực tiếp cho câu hỏi của học sinh (2-3 đoạn ngắn, tuyệt đối không dùng văn mẫu)",
  "strengthsEvaluation": "Đánh giá chi tiết thế mạnh học thuật nổi trội, phản xạ tư duy và tương thích sở thích",
  "risksAndBottlenecks": "Cảnh báo thẳng thắn về môn học nghẽn, mức độ cạnh tranh điểm chuẩn hoặc nguy cơ làm trái ngành",
  "tuitionFeasibility": "Nhận định về khả năng đáp ứng tài chính gia đình so với học phí các trường mục tiêu (NĐ 238/2025)",
  "recommendedSectors": ["Tên_1", "Tên_2"],
  "avoidSectors": ["Tên_hạn_chế_1", "Tên_hạn_chế_2"],
  "recommendedKeywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"],
  "optimalComboAdvice": "Khuyên dùng tổ hợp môn nào có lợi thế điểm xét tuyển cao nhất kèm cách tối ưu",
  "universityAdvice": "Chiến lược phân tầng 3 cấp nguyện vọng (Mơ ước, Vừa sức, An toàn)"
}
Các sector hợp lệ: CNTT_BAN_DAN_AI, KY_THUAT_CONG_NGHE, KINH_TE_QUAN_TRI, Y_DUOC_SUC_KHOE, SU_PHAM_GIAO_DUC, LUAT_HANH_CHINH, XA_HOI_NHAN_VAN, KIEN_TRUC_NGHE_THUAT_TDTT, NONG_LAM_NGU_SINH_HOC, CONG_AN_QUAN_DOI.`;

  const userPrompt = `HỒ SƠ HỌC SINH CẦN PHÂN TÍCH:
- Các môn THPT ĐÃ CÓ ĐIỂM THI: ${enteredList.length > 0 ? enteredList.join(', ') : 'Chưa có môn nào'}.
- Các môn THPT CHƯA CÓ ĐIỂM / KHÔNG THI: ${missingList.join(', ')}.
- Bài thi năng lực / Chứng chỉ: ${examSummary}.
- Hồ sơ RIASEC: ${riasecSummary}${hasCompleteRiasecProfile ? ` (mã nổi trội: ${dominantCode})` : '. Không tự suy ra mã Holland khi thiếu câu trả lời.'}
- Ngân sách học phí: ${maxTuition} triệu VNĐ/năm.
- Khu vực: ${priorityRegion}, Đối tượng: ${priorityObject}, Vùng mong muốn: ${targetRegionFilter}.
- Câu hỏi / Băn khoăn từ chính học sinh: "${personalQuestion || 'Em muốn chuyên gia phân tích toàn diện tiềm năng học tập và tư vấn định hướng ngành trường phù hợp nhất.'}"

Hãy phân tích toàn diện và trả về JSON theo đúng định dạng.`;

  const DEFAULT_SERVER_GEMINI_KEY = 'AQ.Ab8RN6Iufs8Djj-3UZGfp4PuCUsMF208uGAF_T4L2PmI6zR-RQ';
  const geminiKey = (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim()) || DEFAULT_SERVER_GEMINI_KEY;
  const groqKey = env.GROQ_API_KEY && env.GROQ_API_KEY.trim();

  // 1. Try Gemini
  if (geminiKey) {
    const geminiModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];
    for (const model of geminiModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 2500,
              responseMimeType: 'application/json',
              thinkingConfig: { thinkingBudget: 0 }
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
            // Algorithmic Database Linking & Prerequisite Subject Filtering
            const linkedMajors = linkAndRankMajorsWithDossier(allScores, riasec, parsed, seedData.majorCatalogLevelIV);
            parsed.recommendedMajors = linkedMajors;

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
          const linkedMajors = linkAndRankMajorsWithDossier(scores, riasec, parsed, seedData.majorCatalogLevelIV);
          parsed.recommendedMajors = linkedMajors;

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
  const mathVal = typeof scores.math === 'number' ? scores.math : 0;
  const phyVal = typeof scores.physics === 'number' ? scores.physics : 0;
  const chemVal = typeof scores.chemistry === 'number' ? scores.chemistry : 0;
  const litVal = typeof scores.literature === 'number' ? scores.literature : 0;
  const engVal = typeof scores.english === 'number' ? scores.english : 0;
  const hisVal = typeof scores.history === 'number' ? scores.history : 0;
  const geoVal = typeof scores.geography === 'number' ? scores.geography : 0;

  const isStemOriented = mathVal >= 7.5 && (phyVal >= 7.0 || chemVal >= 7.0);
  const isHumanitiesOriented = litVal >= 7.5 || hisVal >= 7.5 || geoVal >= 7.5;
  const isArtisticOriented = hasCompleteRiasecProfile && Number(riasec.A) >= 35;
  const riasecHeadline = hasCompleteRiasecProfile ? ` · RIASEC ${dominantCode}` : '';

  const fallbackDiagnosis: AIDiagnosisSemanticResult = {
    headline: isStemOriented
      ? `Chiến lược Định hướng: Tối ưu Tư duy STEM & Năng lực Phân tích${riasecHeadline}`
      : isArtisticOriented
      ? `Chiến lược Định hướng: Khai phóng Sáng tạo Nghệ thuật & Truyền thông Đa phương tiện${riasecHeadline}`
      : isHumanitiesOriented
      ? `Chiến lược Định hướng: Phát huy Thế mạnh Khoa học Xã hội, Ngôn ngữ & Sư phạm${riasecHeadline}`
      : `Chiến lược Định hướng: Tối ưu Lộ trình Học thuật & Năng lực Thích ứng${riasecHeadline}`,
    directAnswer: personalQuestion
      ? `Đối với băn khoăn của bạn ("${personalQuestion}"): Phân tích dữ liệu học tập cho thấy bạn hoàn toàn có cơ sở để chủ động định hình lộ trình. Đừng quá lo lắng về áp lực xã hội hay những nhận định phiến diện. Sự kết hợp giữa năng lực thực tế và định hướng rõ ràng sẽ giúp bạn vượt trội trong môi trường học thuật 2026.`
      : hasCompleteRiasecProfile
        ? `Hồ sơ của bạn sở hữu nền tảng học tập đồng đều và vững vàng. ${dominantCode === 'hồ sơ cân bằng' ? 'Các chiều sở thích hiện khá cân bằng.' : `Mã sở thích ${dominantCode} có thể là một hướng để khám phá thêm.`}`
        : 'Chưa có kết quả RIASEC nên nhận định này chưa thể kết luận về sở thích nghề nghiệp; hãy hoàn thành khảo sát để có thêm dữ liệu.',
    strengthsEvaluation: `Điểm số phản ánh thái độ học tập nghiêm túc. Thế mạnh môn ${
      isStemOriented ? 'Toán - KHTN' : isHumanitiesOriented ? 'Văn - Sử - Địa' : 'Ngoại ngữ'
    }${hasCompleteRiasecProfile ? ` kết hợp với miền sở thích ${dominantCode} là một tín hiệu tham khảo.` : '; chưa có đủ dữ liệu RIASEC để mô tả miền sở thích.'}`,
    risksAndBottlenecks: `Cần lưu ý kiểm soát các môn điều kiện trong tổ hợp chính và theo dõi sát sao điểm chuẩn 3 năm gần nhất để tránh tình trạng dồn toàn bộ nguyện vọng vào nhóm ngành có tỷ lệ chọi quá cao.`,
    tuitionFeasibility: `Ngân sách ${maxTuition} triệu VNĐ/năm hoàn toàn nằm trong khung trần Nghị định 238/2025/NĐ-CP đối với các trường đại học công lập và chương trình chuẩn chất lượng cao.`,
    recommendedSectors: isStemOriented
      ? ['CNTT_BAN_DAN_AI', 'KY_THUAT_CONG_NGHE']
      : isArtisticOriented
      ? ['KIEN_TRUC_NGHE_THUAT_TDTT', 'XA_HOI_NHAN_VAN']
      : isHumanitiesOriented
      ? ['XA_HOI_NHAN_VAN', 'SU_PHAM_GIAO_DUC', 'LUAT_HANH_CHINH']
      : ['KINH_TE_QUAN_TRI', 'XA_HOI_NHAN_VAN'],
    avoidSectors: isStemOriented
      ? ['XA_HOI_NHAN_VAN', 'SU_PHAM_GIAO_DUC']
      : ['CNTT_BAN_DAN_AI', 'KY_THUAT_CONG_NGHE', 'Y_DUOC_SUC_KHOE'],
    recommendedKeywords: isStemOriented
      ? ['máy tính', 'công nghệ thông tin', 'bán dẫn', 'tự động hóa']
      : isArtisticOriented
      ? ['thiết kế đồ họa', 'truyền thông', 'báo chí', 'quan hệ công chúng']
      : ['truyền thông', 'báo chí', 'sư phạm ngữ văn', 'ngôn ngữ anh', 'luật'],
    optimalComboAdvice: engVal >= 8.0
      ? 'Khuyên dùng tổ hợp có môn Tiếng Anh (D01, D14, A01) để tận dụng tối đa năng lực ngôn ngữ.'
      : isHumanitiesOriented
      ? 'Khuyên dùng tổ hợp C00 (Văn, Sử, Địa) hoặc D14 theo thế mạnh cốt lõi.'
      : 'Khuyên dùng tổ hợp A00 hoặc D01 theo thế mạnh cốt lõi.',
    universityAdvice: `Phân bổ nguyện vọng theo chiến lược 3 tầng: 1-2 nguyện vọng Mơ ước (điểm chuẩn cao hơn 0.5-1.0đ), 2-3 nguyện vọng Vừa sức (biên độ an toàn), và ít nhất 1 nguyện vọng An toàn tuyệt đối.`
  };

  const fallbackMajors = linkAndRankMajorsWithDossier(scores, riasec, fallbackDiagnosis, seedData.majorCatalogLevelIV);

  const fallbackAnalysis: AIDossierAnalysisResult = {
    ...fallbackDiagnosis,
    recommendedMajors: fallbackMajors
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
