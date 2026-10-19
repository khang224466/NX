/**
 * NEXORA AI CAREER COUNSELOR CONTRACT & SCHEMA VALIDATOR
 * Enforces structured output format, validated enums, and graceful self-repair.
 */

export type ExoraStage =
  | 'DISCOVERY'
  | 'CAPABILITIES'
  | 'WORK_ENVIRONMENT'
  | 'CAREERS'
  | 'MAJORS'
  | 'ADMISSIONS'
  | 'ROADMAP';

export type CounselorAction =
  | 'ASK_CLARIFYING_QUESTION'
  | 'REFLECT_AND_ANALYZE'
  | 'SUGGEST_EXPLORATION_EXERCISE'
  | 'PRESENT_PROVISIONAL_CAREERS'
  | 'EXPLORE_SELECTED_CAREER'
  | 'MAP_CAREER_TO_MAJORS'
  | 'MAP_MAJOR_TO_ADMISSIONS'
  | 'BUILD_DEVELOPMENT_PLAN';

export type EvidenceSufficiency = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CounselorProfileUpdates {
  interests?: string[];
  retractedInterests?: string[];
  demonstratedStrengths?: string[];
  learningEvidence?: string[];
  workPreferences?: string[];
  constraints?: string[];
  values?: string[];
  dislikes?: string[];
  uncertainties?: string[];
}

export interface CounselorDecision {
  stage: ExoraStage;
  action: CounselorAction;
  question: string | null;
  reason: string;
  evidenceSufficiency: EvidenceSufficiency;
}

export interface CounselorCareerItem {
  id?: string;
  title: string;
  sector: string;
  riasecCode: string;
  matchPercent: number;
  whyFit: string;
  whyNotOthers?: string;
  uncertaintiesAndRisks?: string;
  selfVerificationTask: string;
  recommendedMajors?: string[];
}

export interface CounselorResponseContract {
  reply: string;
  profileUpdates: CounselorProfileUpdates;
  decision: CounselorDecision;
  quickReplies: string[];
  careers?: CounselorCareerItem[];
}

const VALID_STAGES: ExoraStage[] = [
  'DISCOVERY',
  'CAPABILITIES',
  'WORK_ENVIRONMENT',
  'CAREERS',
  'MAJORS',
  'ADMISSIONS',
  'ROADMAP'
];

const VALID_ACTIONS: CounselorAction[] = [
  'ASK_CLARIFYING_QUESTION',
  'REFLECT_AND_ANALYZE',
  'SUGGEST_EXPLORATION_EXERCISE',
  'PRESENT_PROVISIONAL_CAREERS',
  'EXPLORE_SELECTED_CAREER',
  'MAP_CAREER_TO_MAJORS',
  'MAP_MAJOR_TO_ADMISSIONS',
  'BUILD_DEVELOPMENT_PLAN'
];

/**
 * Validates and normalizes raw model output against CounselorResponseContract.
 * Handles markdown fences, partial JSON, missing keys, and schema correction.
 */
export function validateAndNormalizeCounselorResponse(rawText: string): CounselorResponseContract {
  if (!rawText || typeof rawText !== 'string') {
    return createSafeFallbackContract('Xin lỗi bạn, phản hồi từ máy chủ AI không có nội dung. Bạn vui lòng thử lại nhé.');
  }

  // Strip markdown code fences if wrapped
  let cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: any = null;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Attempt relaxed regex extraction if direct JSON.parse fails
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {}
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    // If output is plain conversational text without JSON
    return createSafeFallbackContract(cleaned);
  }

  // 1. Validate & extract conversational reply
  const reply = typeof parsed.reply === 'string' && parsed.reply.trim()
    ? parsed.reply.trim()
    : (typeof parsed.replyText === 'string' && parsed.replyText.trim()
        ? parsed.replyText.trim()
        : 'Mình đã lắng nghe chia sẻ của bạn. Hãy cùng đào sâu thêm một khía cạnh nhé.');

  // 2. Validate & normalize profileUpdates
  const rawUpdates = parsed.profileUpdates || parsed.detectedUpdates || {};
  const profileUpdates: CounselorProfileUpdates = {
    interests: sanitizeStringArray(rawUpdates.interests || rawUpdates.statedInterests),
    retractedInterests: sanitizeStringArray(rawUpdates.retractedInterests),
    demonstratedStrengths: sanitizeStringArray(rawUpdates.demonstratedStrengths || rawUpdates.academicStrengths),
    learningEvidence: sanitizeStringArray(rawUpdates.learningEvidence || rawUpdates.academicWeaknesses),
    workPreferences: sanitizeStringArray(rawUpdates.workPreferences || rawUpdates.workEnvironmentPrefs),
    constraints: sanitizeStringArray(rawUpdates.constraints || rawUpdates.realConstraints),
    values: sanitizeStringArray(rawUpdates.values || rawUpdates.personalValues),
    dislikes: sanitizeStringArray(rawUpdates.dislikes || rawUpdates.rejectedActivities),
    uncertainties: sanitizeStringArray(rawUpdates.uncertainties || rawUpdates.missingEvidence)
  };

  // 3. Validate & normalize decision
  const rawDecision = parsed.decision || {};
  const stage: ExoraStage = VALID_STAGES.includes(rawDecision.stage) ? rawDecision.stage : 'DISCOVERY';
  const action: CounselorAction = VALID_ACTIONS.includes(rawDecision.action) ? rawDecision.action : 'ASK_CLARIFYING_QUESTION';
  const question = typeof rawDecision.question === 'string' && rawDecision.question.trim() ? rawDecision.question.trim() : null;
  const reason = typeof rawDecision.reason === 'string' && rawDecision.reason.trim() ? rawDecision.reason.trim() : 'Thu thập thêm bằng chứng định hướng';
  const evidenceSufficiency: EvidenceSufficiency = ['LOW', 'MEDIUM', 'HIGH'].includes(rawDecision.evidenceSufficiency)
    ? rawDecision.evidenceSufficiency
    : 'LOW';

  const decision: CounselorDecision = {
    stage,
    action,
    question,
    reason,
    evidenceSufficiency
  };

  // 4. Validate & normalize quickReplies
  const quickReplies = sanitizeStringArray(parsed.quickReplies);
  if (quickReplies.length === 0) {
    quickReplies.push('Chia sẻ thêm về trải nghiệm học tập', 'Khám phá thế mạnh của bản thân');
  }

  // 5. Validate & normalize careers (only if present)
  let careers: CounselorCareerItem[] | undefined = undefined;
  if (Array.isArray(parsed.careers) && parsed.careers.length > 0) {
    careers = parsed.careers
      .filter((c: any) => c && typeof c.title === 'string' && c.title.trim())
      .slice(0, 3)
      .map((c: any, idx: number) => ({
        id: String(c.id || `c_ai_${idx + 1}`),
        title: String(c.title).trim(),
        sector: String(c.sector || 'Chuyên môn đa ngành').trim(),
        riasecCode: String(c.riasecCode || 'RIC').trim(),
        matchPercent: typeof c.matchPercent === 'number' ? Math.min(100, Math.max(50, c.matchPercent)) : 80,
        whyFit: String(c.whyFit || 'Phù hợp với đặc điểm hứng thú và năng lực bạn vừa chia sẻ.').trim(),
        whyNotOthers: c.whyNotOthers ? String(c.whyNotOthers).trim() : undefined,
        uncertaintiesAndRisks: c.uncertaintiesAndRisks ? String(c.uncertaintiesAndRisks).trim() : undefined,
        selfVerificationTask: String(c.selfVerificationTask || 'Thử tự thực hiện 1 dự án nhỏ hoặc trao đổi với người trong nghề 30 phút.').trim(),
        recommendedMajors: sanitizeStringArray(c.recommendedMajors)
      }));
  }

  return {
    reply,
    profileUpdates,
    decision,
    quickReplies: quickReplies.slice(0, 4),
    careers
  };
}

function sanitizeStringArray(input: any): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function createSafeFallbackContract(rawText: string): CounselorResponseContract {
  return {
    reply: rawText.slice(0, 1500),
    profileUpdates: {},
    decision: {
      stage: 'DISCOVERY',
      action: 'ASK_CLARIFYING_QUESTION',
      question: null,
      reason: 'Tiếp tục tìm hiểu thông tin định hướng',
      evidenceSufficiency: 'LOW'
    },
    quickReplies: ['Chia sẻ thêm về môn học thế mạnh', 'Khám phá sở thích hoạt động hằng ngày']
  };
}
