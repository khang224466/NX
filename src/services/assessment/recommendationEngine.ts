import seedData from '../../data/seed_data.json';
import { SECTOR_RIASEC_PROFILE_NOTE, SECTOR_RIASEC_VECTORS } from '../../data/riasecSectorProfiles';
import type { RiasecVector } from '../../data/riasecSectorProfiles';

export const RIASEC_CODES = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
export type RiasecCode = typeof RIASEC_CODES[number];

export interface RiasecQuestion {
  id: string;
  dimension: RiasecCode;
  text: string;
}

export type RiasecAnswers = Record<string, number>;
export type RiasecScores = Record<RiasecCode, number>;

export interface RiasecProfile {
  rawScores: RiasecScores;
  scores: RiasecScores;
  answeredByDimension: Record<RiasecCode, number>;
  questionCount: number;
  answeredCount: number;
  isComplete: boolean;
  dominantDimensions: RiasecCode[];
}

export interface MajorCandidate {
  codeTT09: string;
  codeTT74?: string;
  name: string;
  sector: string;
  targetJobs?: string[];
  admissionsCombos?: string[];
}

export type RecommendationBasis = 'RIASEC_PROFILE' | 'TEXT_EXPLORATION' | 'AI_HYPOTHESIS';

export interface MajorRecommendation extends MajorCandidate {
  interestSimilarityIndex: number | null;
  profileCorrelation: number | null;
  recommendationBasis: RecommendationBasis;
  evidence: string[];
  explanation: string;
  profileNote: string;
}

interface QuestionnaireData {
  questions: RiasecQuestion[];
}

const questionnaire = (seedData as unknown as { riasecQuestionnaire: QuestionnaireData }).riasecQuestionnaire;
export const RIASEC_QUESTIONS: readonly RiasecQuestion[] = questionnaire.questions;
export const RIASEC_PROFILE_NOTICE =
  'Bộ câu hỏi tiếng Việt này được biên soạn theo cấu trúc RIASEC và tham khảo O*NET; bản dịch/bản biên soạn chưa được chuẩn hóa tâm trắc tại Việt Nam.';

const ZERO_SCORES = (): RiasecScores => ({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });
const ZERO_COUNTS = (): Record<RiasecCode, number> => ({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });

function dimensionsAboveProfileMean(scores: RiasecScores): RiasecCode[] {
  const mean = RIASEC_CODES.reduce((sum, code) => sum + scores[code], 0) / RIASEC_CODES.length;
  return RIASEC_CODES.filter((code) => scores[code] > mean);
}

export function isValidRiasecAnswer(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;
}

export function sanitizeRiasecAnswers(value: unknown): RiasecAnswers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const candidate = value as Record<string, unknown>;
  const allowedIds = new Set(RIASEC_QUESTIONS.map((question) => question.id));
  return Object.fromEntries(
    Object.entries(candidate).filter(([id, answer]) => allowedIds.has(id) && isValidRiasecAnswer(answer))
  ) as RiasecAnswers;
}

/**
 * Converts each six-dimension interest sum to 0–100 using the actual response
 * range (1–5), so the theoretical minimum is 0 and maximum is 100.
 */
export function scoreRiasecAnswers(answersInput: RiasecAnswers): RiasecProfile {
  const answers = sanitizeRiasecAnswers(answersInput);
  const rawScores = ZERO_SCORES();
  const answeredByDimension = ZERO_COUNTS();
  const totalByDimension = ZERO_COUNTS();

  for (const question of RIASEC_QUESTIONS) {
    totalByDimension[question.dimension] += 1;
    const answer = answers[question.id];
    if (!isValidRiasecAnswer(answer)) continue;
    rawScores[question.dimension] += answer;
    answeredByDimension[question.dimension] += 1;
  }

  const scores = ZERO_SCORES();
  for (const code of RIASEC_CODES) {
    const answered = answeredByDimension[code];
    if (answered > 0) {
      scores[code] = Number((((rawScores[code] - answered) / (answered * 4)) * 100).toFixed(2));
    }
  }

  const answeredCount = Object.keys(answers).length;
  const questionCount = RIASEC_QUESTIONS.length;
  const isComplete = questionCount > 0 && answeredCount === questionCount &&
    RIASEC_CODES.every((code) => answeredByDimension[code] === totalByDimension[code]);

  let dominantDimensions: RiasecCode[] = [];
  if (isComplete) {
    dominantDimensions = dimensionsAboveProfileMean(scores);
  }

  return {
    rawScores,
    scores,
    answeredByDimension,
    questionCount,
    answeredCount,
    isComplete,
    dominantDimensions
  };
}

/**
 * Profile correlation uses all six RIASEC dimensions. It returns null when
 * either profile is flat because correlation is undefined in that case.
 */
export function correlateRiasecProfiles(
  userScores: RiasecScores,
  targetVector: RiasecVector
): number | null {
  const userValues = RIASEC_CODES.map((code) => userScores[code]);
  const targetValues = [...targetVector];
  const userMean = userValues.reduce((sum, value) => sum + value, 0) / userValues.length;
  const targetMean = targetValues.reduce((sum, value) => sum + value, 0) / targetValues.length;
  const centeredUser = userValues.map((value) => value - userMean);
  const centeredTarget = targetValues.map((value) => value - targetMean);
  const numerator = centeredUser.reduce((sum, value, index) => sum + value * centeredTarget[index], 0);
  const userNorm = Math.sqrt(centeredUser.reduce((sum, value) => sum + value * value, 0));
  const targetNorm = Math.sqrt(centeredTarget.reduce((sum, value) => sum + value * value, 0));
  if (userNorm === 0 || targetNorm === 0) return null;
  return Math.max(-1, Math.min(1, numerator / (userNorm * targetNorm)));
}

export function correlationToSimilarityIndex(correlation: number | null): number | null {
  if (correlation === null || !Number.isFinite(correlation)) return null;
  return Math.round(((correlation + 1) / 2) * 100);
}

export function hasRiasecProfileVariation(profile: RiasecProfile | null): boolean {
  if (!profile?.isComplete) return false;
  const values = RIASEC_CODES.map((code) => profile.scores[code]);
  return Math.max(...values) > Math.min(...values);
}

const TEXT_SECTOR_TERMS: Record<string, string[]> = {
  CNTT_BAN_DAN_AI: ['công nghệ', 'máy tính', 'lập trình', 'phần mềm', 'dữ liệu', 'ai', 'bán dẫn'],
  KY_THUAT_CONG_NGHE: ['kỹ thuật', 'cơ khí', 'điện', 'robot', 'tự động hóa', 'xây dựng'],
  KINH_TE_QUAN_TRI: ['kinh doanh', 'kinh tế', 'quản trị', 'tài chính', 'marketing', 'thương mại'],
  Y_DUOC_SUC_KHOE: ['y khoa', 'y tế', 'dược', 'sức khỏe', 'chăm sóc bệnh nhân'],
  SU_PHAM_GIAO_DUC: ['sư phạm', 'giáo dục', 'dạy học', 'giảng dạy'],
  LUAT_HANH_CHINH: ['luật', 'pháp lý', 'hành chính'],
  XA_HOI_NHAN_VAN: ['xã hội', 'truyền thông', 'báo chí', 'viết', 'ngôn ngữ'],
  KIEN_TRUC_NGHE_THUAT_TDTT: ['thiết kế', 'mỹ thuật', 'nghệ thuật', 'kiến trúc', 'thể thao', 'sáng tạo'],
  NONG_LAM_NGU_SINH_HOC: ['nông nghiệp', 'động vật', 'sinh học', 'môi trường', 'thú y'],
  CONG_AN_QUAN_DOI: ['công an', 'quân đội', 'an ninh', 'quốc phòng']
};

function getTextEvidence(text: string, candidate: MajorCandidate): string[] {
  const normalizedText = text.toLocaleLowerCase('vi');
  const evidence = (TEXT_SECTOR_TERMS[candidate.sector] || [])
    .filter((term) => normalizedText.includes(term));
  const normalizedName = candidate.name.toLocaleLowerCase('vi').trim();
  if (normalizedName.length > 4 && normalizedText.includes(normalizedName)) {
    evidence.unshift(`ngành ${candidate.name} được nêu trực tiếp`);
  }
  return [...new Set(evidence)];
}

export function createRiasecProfileFromNormalizedScores(
  input: Partial<Record<RiasecCode, number | '' | undefined>>
): RiasecProfile | null {
  if (!RIASEC_CODES.every((code) => typeof input[code] === 'number' && Number.isFinite(input[code]) && input[code]! >= 0 && input[code]! <= 100)) {
    return null;
  }
  const scores = Object.fromEntries(RIASEC_CODES.map((code) => [code, Number(input[code])])) as RiasecScores;
  const counts = ZERO_COUNTS();
  for (const question of RIASEC_QUESTIONS) counts[question.dimension] += 1;
  const rawScores = ZERO_SCORES();
  for (const code of RIASEC_CODES) {
    rawScores[code] = Number((counts[code] + (scores[code] / 100) * counts[code] * 4).toFixed(2));
  }
  const dominantDimensions = dimensionsAboveProfileMean(scores);
  return {
    rawScores,
    scores,
    answeredByDimension: counts,
    questionCount: RIASEC_QUESTIONS.length,
    answeredCount: RIASEC_QUESTIONS.length,
    isComplete: true,
    dominantDimensions
  };
}

export function rankMajorsByEvidence(
  catalog: MajorCandidate[],
  profile: RiasecProfile | null,
  selfReportedText = '',
  aiSuggestedNames: string[] = []
): MajorRecommendation[] {
  const useRiasecProfile = hasRiasecProfileVariation(profile);
  const recommendations = catalog.map((candidate) => {
    const targetVector = SECTOR_RIASEC_VECTORS[candidate.sector];
    const correlation = useRiasecProfile && targetVector
      ? correlateRiasecProfiles(profile!.scores, targetVector)
      : null;
    const interestSimilarityIndex = correlationToSimilarityIndex(correlation);
    const textEvidence = getTextEvidence(selfReportedText, candidate);
    const aiMatch = aiSuggestedNames.find((name) => {
      const normalizedName = name.toLocaleLowerCase('vi').trim();
      const candidateName = candidate.name.toLocaleLowerCase('vi');
      return normalizedName.length > 3 && (normalizedName === candidateName || candidateName.includes(normalizedName) || normalizedName.includes(candidateName));
    });
    const hasRiasecMetric = interestSimilarityIndex !== null;
    const recommendationBasis: RecommendationBasis = hasRiasecMetric
      ? 'RIASEC_PROFILE'
      : textEvidence.length > 0
        ? 'TEXT_EXPLORATION'
        : 'AI_HYPOTHESIS';
    const evidence = hasRiasecMetric
      ? [
          `Hồ sơ người học: ${profile!.dominantDimensions.join(', ') || 'các chiều RIASEC đã chấm'}`,
          `Hồ sơ lĩnh vực: ${candidate.sector}`,
          ...textEvidence.map((item) => `Tự khai: ${item}`),
          ...(aiMatch ? [`Giả thuyết AI: ${aiMatch}`] : [])
        ]
      : [
          ...textEvidence.map((item) => `Tự khai: ${item}`),
          ...(aiMatch ? [`Giả thuyết AI: ${aiMatch}`] : [])
        ];
    const explanation = hasRiasecMetric
      ? `Chỉ số tương đồng hồ sơ RIASEC sáu chiều: ${interestSimilarityIndex}/100. Đây là độ tương đồng giữa hồ sơ sở thích và hồ sơ lĩnh vực, không phải xác suất đỗ hay thước đo năng lực.`
      : textEvidence.length > 0
        ? `Gợi ý khám phá từ nội dung bạn tự khai (${textEvidence.join(', ')}); chưa có điểm RIASEC hoàn chỉnh để tính độ tương đồng.`
        : aiMatch
          ? `Đây là giả thuyết do AI nêu (${aiMatch}); chưa có hồ sơ RIASEC hoàn chỉnh để tính độ tương đồng.`
        : 'Chưa có đủ hồ sơ RIASEC hoặc tín hiệu tự khai để giải thích gợi ý này.';

    return {
      ...candidate,
      interestSimilarityIndex,
      profileCorrelation: correlation,
      recommendationBasis,
      evidence,
      explanation,
      profileNote: hasRiasecMetric
        ? `${RIASEC_PROFILE_NOTICE} ${SECTOR_RIASEC_PROFILE_NOTE}`
        : RIASEC_PROFILE_NOTICE
    };
  });

  if (useRiasecProfile) {
    return recommendations.sort((a, b) =>
      (b.interestSimilarityIndex ?? -1) - (a.interestSimilarityIndex ?? -1) ||
      a.name.localeCompare(b.name, 'vi')
    );
  }

  return recommendations
    .filter((recommendation) => recommendation.evidence.length > 0)
    .sort((a, b) => b.evidence.length - a.evidence.length || a.name.localeCompare(b.name, 'vi'));
}
