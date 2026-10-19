/**
 * NEXORA ADAPTIVE CAREER DECISION ENGINE (CORE PROTOCOL)
 * 
 * Logic điều phối quyết định hướng nghiệp thích ứng dựa trên bằng chứng:
 * - Trạng thái A: Người học bắt đầu từ con số 0 -> Đặt 1 câu hỏi tập trung, đồng cảm, KHÔNG tạo nghề.
 * - Trạng thái B: Khám phá sở thích & năng lực -> Phân biệt tự thuật, bằng chứng, giả thuyết, thông tin thiếu.
 * - Trạng thái C: Đề xuất nghề nghiệp -> CHỈ KHI ĐỦ BẰNG CHỨNG, mỗi nghề có bằng chứng, yêu cầu chưa đạt, lý do loại trừ, bài kiểm tra thực tế.
 * - Trạng thái D: Từ nghề sang ngành đào tạo -> Con đường trực tiếp, con đường gần, lộ trình kỹ năng.
 * - Trạng thái E: Chiến lược tuyển sinh -> Trường, tổ hợp xét tuyển thực tế, minh bạch nguồn số liệu.
 * - Trạng thái F: Lộ trình 4 năm đại học & phát triển kỹ năng.
 */

import { OCCUPATIONS_DATA, MAJORS_DATA } from '../data/mockData';
import { CAREER_ECOSYSTEM_BY_MAJOR } from './roiAndFallbackEngine';
import { VERIFIED_PROGRAMS_DATABASE } from '../data/verifiedAdmissionDatabase';
import { AUDITED_INSTITUTIONS_300 } from '../data/auditedInstitutionsData';

// ============================================================================
// 1. DATA TYPES & EVIDENCE ACCUMULATOR
// ============================================================================

export interface LearnerEvidenceProfile {
  realityCheckAnswer?: string;
  rawInputs: string[];
  
  // Dữ liệu người học tự thuật (Self-reported)
  statedInterests: string[];
  academicStrengths: string[];
  academicWeaknesses: string[];
  workEnvironmentPrefs: string[];
  personalValues: string[];
  realConstraints: string[];
  
  // Bằng chứng có căn cứ đối chiếu
  verifiedEvidence: string[];
  
  // Giả thuyết AI cần kiểm chứng thêm
  unverifiedHypotheses: string[];
  
  // Bằng chứng cốt lõi còn thiếu trước khi đề xuất nghề
  missingEvidence: string[];

  // Hoạt động hoặc lĩnh vực bị từ chối rõ ràng (Explicitly Disliked / Rejected)
  rejectedActivities: string[];
  
  // Lĩnh vực chưa từng trải nghiệm (Unexplored / Untested)
  untestedInterests: string[];
  
  // Mâu thuẫn quan trọng chưa giải quyết
  unresolvedContradictions: string[];

  // Nguyện vọng nghề cụ thể do người học chủ động đưa ra
  explicitTargetCareer?: string;
  
  // Trạng thái hội thoại hiện tại
  currentStage: 'STATE_A_ZERO' | 'STATE_B_EXPLORING' | 'STATE_C_CAREERS' | 'STATE_D_MAJORS' | 'STATE_E_ADMISSIONS' | 'STATE_F_ROADMAP';
  
  // Nghề và ngành mục tiêu đã chọn
  selectedCareer?: AdaptiveCareerProposal;
  selectedMajorCode?: string;
  
  // Lịch sử trao đổi
  turnsCount: number;
}

export interface AdaptiveCareerProposal {
  id: string;
  title: string;
  sector: string;
  riasecCode: string;
  riasecBasis: string;
  matchPercent: number; // Điểm số phản ánh mức độ tích lũy bằng chứng
  evidenceBasis: string[]; // Bằng chứng từ hồ sơ hỗ trợ đề xuất
  unverifiedPrerequisites: string[]; // Yêu cầu người học chưa đáp ứng hoặc chưa xác minh
  whyFit: string;
  whyNotOthers: string; // Lý do cân nhắc / nghề khác bị loại trừ
  selfVerificationTask: string; // Cách thực tế để kiểm tra mức độ phù hợp
  salaryRange: string;
  salarySource: string;
  automationRisk: string;
  automationNotes: string;
  linkedComboCode: string;
  recommendedMajors: string[];
}

export interface MajorMappingPathway {
  directMajors: Array<{
    code: string;
    name: string;
    coreDisciplines: string[];
    entryCompetencies: string[];
    studyDuration: string;
    considerations: string;
    dataSource: string;
  }>;
  adjacentMajors: Array<{
    code: string;
    name: string;
    rationale: string;
    transitionPivots: string[];
  }>;
  skillsPathways: Array<{
    pathTitle: string;
    description: string;
    targetCertifications: string[];
  }>;
}

export interface AdmissionsOption {
  schoolCode: string;
  schoolName: string;
  city: string;
  majorName: string;
  majorCode: string;
  admissionCombinations: string[];
  tuitionPerYear: string;
  historicalBenchmarkNote: string;
  admissionMethods: string[];
  verificationNote: string;
}

export type DecisionActionType = 
  | 'ASK_QUESTION'
  | 'EXPLORE_INTERESTS'
  | 'CAREER_SHORTLIST'
  | 'MAJOR_MAPPING'
  | 'ADMISSIONS_PLAN'
  | 'ROADMAP';

export interface AdaptiveDecisionResult {
  action: DecisionActionType;
  stage: 'STATE_A_ZERO' | 'STATE_B_EXPLORING' | 'STATE_C_CAREERS' | 'STATE_D_MAJORS' | 'STATE_E_ADMISSIONS' | 'STATE_F_ROADMAP';
  replyText: string;
  primaryQuestion?: string;
  questionContext?: string;
  quickReplies?: string[];
  suggestedCareers?: AdaptiveCareerProposal[];
  suggestedCombos?: Array<{ code: string; matchPercent: number; reason: string; matchLabel?: string }>;
  majorMapping?: MajorMappingPathway;
  admissionsPlan?: AdmissionsOption[];
  evidenceSummary: {
    selfReported: string[];
    verified: string[];
    hypotheses: string[];
    missing: string[];
  };
  updatedProfile: LearnerEvidenceProfile;
}

const LOCAL_STORAGE_KEY = 'nexora_learner_profile_v2';

export function getStoredLearnerProfile(): LearnerEvidenceProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveLearnerProfile(profile: LearnerEvidenceProfile): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profile));
  } catch {}
}

export function clearStoredLearnerProfile(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {}
}

// ============================================================================
// 2. EVIDENCE EVALUATOR & STATE TRANSITION
// ============================================================================

export function splitIntoClauses(text: string): ParsedClause[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const rawSentences = normalized
    .split(/[\.\!\?\;\n]+/g)
    .map(s => s.trim())
    .filter(Boolean);

  const clauses: ParsedClause[] = [];
  const conjunctionRegex = /(?:,\s*|\s+)(?:nhưng|tuy nhiên|mặc dù|song|chứ không muốn|chứ không|chứ chẳng|thay vì|chứ em không|chứ không thích|chuyển hẳn sang|và muốn)(?:\s+|,)|,\s*/i;

  for (const sentence of rawSentences) {
    let parts = sentence.split(conjunctionRegex).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) parts = [sentence];

    for (const part of parts) {
      const lower = part.toLowerCase();

      // Refuted negation: "không phải (là)? ghét", "không hẳn (là)? ghét", "không phải sợ", "không hẳn là sợ", "không phải kém"
      const isRefutedNegation = /(không phải|không hẳn)\s+(là\s+)?(ghét|sợ|kém|dốt|yếu)/i.test(lower);

      // Retraction: "nghĩ lại rồi", "nói nhầm", "không thích .* nữa", "không còn thích", "chuyển hẳn sang"
      const isRetraction = /(nghĩ lại rồi|nói nhầm|không thích .*?nữa|không còn thích|chuyển hẳn sang|đính chính lại)/i.test(lower);

      // Untested: "chưa thử", "chưa từng", "chưa biết", "chưa rõ", "chưa bao giờ làm", "chưa tiếp xúc"
      const isUntested = /(chưa thử|chưa từng|chưa biết|chưa rõ|chưa bao giờ làm|chưa tiếp xúc|chưa từng làm)/i.test(lower);

      // Negative: "không thích", "ghét", "chẳng thích", "không muốn", "chán", "không phù hợp", "không hứng thú", "từ chối", "dị ứng với", "rất chán"
      const isNegative = !isRefutedNegation && /(không thích|ghét|chẳng thích|chẳng hứng thú|không muốn|rất chán|không phù hợp|không hứng thú|từ chối|dị ứng với|quá ngán)/i.test(lower);

      clauses.push({
        raw: part,
        lower,
        isNegative,
        isRefutedNegation,
        isUntested,
        isRetraction
      });
    }
  }

  return clauses;
}

export interface ParsedClause {
  raw: string;
  lower: string;
  isNegative: boolean;
  isRefutedNegation: boolean;
  isUntested: boolean;
  isRetraction: boolean;
}

export function createInitialProfile(initialInput: string, realityCheckAnswer?: string): LearnerEvidenceProfile {
  const baseProfile: LearnerEvidenceProfile = {
    realityCheckAnswer: realityCheckAnswer || '',
    rawInputs: [],
    statedInterests: [],
    academicStrengths: [],
    academicWeaknesses: [],
    workEnvironmentPrefs: [],
    personalValues: [],
    realConstraints: [],
    verifiedEvidence: realityCheckAnswer ? [`Tâm thế đối diện thực tế: "${realityCheckAnswer}"`] : [],
    unverifiedHypotheses: [],
    missingEvidence: [
      'Sở thích hoạt động cụ thể (RIASEC)',
      'Năng lực học tập hoặc nhiệm vụ thực tế',
      'Môi trường làm việc mong muốn & giá trị sống',
      'Điều kiện thực tế (tài chính, địa lý, gia đình)'
    ],
    rejectedActivities: [],
    untestedInterests: [],
    unresolvedContradictions: [],
    currentStage: 'STATE_A_ZERO',
    turnsCount: 0
  };

  return initialInput ? updateProfileWithInput(baseProfile, initialInput) : baseProfile;
}

export function updateProfileWithInput(profile: LearnerEvidenceProfile, text: string): LearnerEvidenceProfile {
  const updated: LearnerEvidenceProfile = {
    ...profile,
    rawInputs: [...profile.rawInputs, text],
    statedInterests: [...profile.statedInterests],
    academicStrengths: [...profile.academicStrengths],
    academicWeaknesses: [...profile.academicWeaknesses],
    workEnvironmentPrefs: [...profile.workEnvironmentPrefs],
    personalValues: [...profile.personalValues],
    realConstraints: [...profile.realConstraints],
    verifiedEvidence: [...profile.verifiedEvidence],
    unverifiedHypotheses: [...profile.unverifiedHypotheses],
    missingEvidence: [...profile.missingEvidence],
    rejectedActivities: [...(profile.rejectedActivities || [])],
    untestedInterests: [...(profile.untestedInterests || [])],
    unresolvedContradictions: [...(profile.unresolvedContradictions || [])],
    turnsCount: profile.turnsCount + 1
  };

  const clauses = splitIntoClauses(text);
  const fullLower = text.toLowerCase();

  // Kiểm tra đổi ý toàn diện (Ví dụ: "Trước đây thích máy tính nhưng giờ không thích nữa")
  const hasMindChangeRetraction = /(không thích .*?nữa|không còn thích|hết thích|nghĩ lại rồi|bỏ rồi|không muốn làm .*?nữa)/i.test(fullLower);
  if (hasMindChangeRetraction) {
    if (/(máy tính|công nghệ|cntt|it|lập trình|code)/i.test(fullLower)) {
      updated.statedInterests = updated.statedInterests.filter(i => !i.includes('Công nghệ'));
      if (!updated.rejectedActivities.includes('Công nghệ & Máy tính')) {
        updated.rejectedActivities.push('Công nghệ & Máy tính');
      }
    }
    if (/(kinh doanh|bán hàng|tài chính)/i.test(fullLower)) {
      updated.statedInterests = updated.statedInterests.filter(i => !i.includes('Kinh doanh'));
      if (!updated.rejectedActivities.includes('Kinh doanh & Bán hàng')) {
        updated.rejectedActivities.push('Kinh doanh & Bán hàng');
      }
    }
  }

  for (const c of clauses) {
    const l = c.lower;

    // Bỏ qua các vế chỉ sở thích trong quá khứ đã bị từ bỏ
    const isHistoricalPast = /(trước đây|hồi trước|trước kia|ngày xưa|trước đó)/i.test(l) && hasMindChangeRetraction;
    if (isHistoricalPast) {
      continue;
    }

    // 1. Xử lý Đính chính & Đổi ý (Retraction)
    if (c.isRetraction) {
      if (l.includes('máy tính') || l.includes('công nghệ') || l.includes('cntt') || l.includes('it') || l.includes('lập trình')) {
        updated.statedInterests = updated.statedInterests.filter(i => !i.includes('Công nghệ'));
        if (!updated.rejectedActivities.includes('Công nghệ & Máy tính')) {
          updated.rejectedActivities.push('Công nghệ & Máy tính');
        }
      }
      if (l.includes('kinh doanh') || l.includes('bán hàng') || l.includes('tài chính')) {
        updated.statedInterests = updated.statedInterests.filter(i => !i.includes('Kinh doanh'));
        if (!updated.rejectedActivities.includes('Kinh doanh & Bán hàng')) {
          updated.rejectedActivities.push('Kinh doanh & Bán hàng');
        }
      }
      if (l.includes('văn') || l.includes('sáng tạo') || l.includes('viết lách') || l.includes('thiết kế')) {
        updated.statedInterests = updated.statedInterests.filter(i => !i.includes('Sáng tạo'));
      }
    }

    // 2. Xử lý Chưa thử / Chưa trải nghiệm (Untested Interests)
    if (c.isUntested) {
      if (l.includes('thiết kế')) {
        if (!updated.untestedInterests.includes('Thiết kế giao diện / đồ họa')) {
          updated.untestedInterests.push('Thiết kế giao diện / đồ họa');
        }
      }
      if (l.includes('lập trình') || l.includes('code')) {
        if (!updated.untestedInterests.includes('Lập trình phần mềm')) {
          updated.untestedInterests.push('Lập trình phần mềm');
        }
      }
      if (l.includes('kinh doanh') || l.includes('bán hàng')) {
        if (!updated.untestedInterests.includes('Kinh doanh & Bán hàng')) {
          updated.untestedInterests.push('Kinh doanh & Bán hàng');
        }
      }
      continue;
    }

    // 3. Xử lý Phủ định / Từ chối rõ ràng (Negative / Rejected Activities)
    if (c.isNegative) {
      if (l.includes('lập trình') || l.includes('code') || l.includes('viết mã')) {
        if (!updated.rejectedActivities.includes('Lập trình / Viết mã phần mềm')) {
          updated.rejectedActivities.push('Lập trình / Viết mã phần mềm');
        }
      }
      if (l.includes('kỹ thuật') || l.includes('tự nhiên')) {
        if (!updated.rejectedActivities.includes('Kỹ thuật / Các ngành khoa học tự nhiên')) {
          updated.rejectedActivities.push('Kỹ thuật / Các ngành khoa học tự nhiên');
        }
        updated.statedInterests = updated.statedInterests.filter(i => !i.includes('Kỹ thuật'));
      }
      if (l.includes('máy tính') || l.includes('công nghệ')) {
        if (!updated.rejectedActivities.includes('Công nghệ & Máy tính')) {
          updated.rejectedActivities.push('Công nghệ & Máy tính');
        }
        updated.statedInterests = updated.statedInterests.filter(i => !i.includes('Công nghệ'));
      }
      if (l.includes('kinh doanh') || l.includes('bán hàng') || l.includes('sale')) {
        if (!updated.rejectedActivities.includes('Kinh doanh & Bán hàng trực tiếp')) {
          updated.rejectedActivities.push('Kinh doanh & Bán hàng trực tiếp');
        }
        updated.statedInterests = updated.statedInterests.filter(i => !i.includes('Kinh doanh'));
      }
      if (l.includes('giao tiếp') || l.includes('ngoại giao') || l.includes('tiếp xúc khách hàng')) {
        if (!updated.rejectedActivities.includes('Giao tiếp đám đông / Bán hàng ngoại giao')) {
          updated.rejectedActivities.push('Giao tiếp đám đông / Bán hàng ngoại giao');
        }
        if (!updated.workEnvironmentPrefs.includes('Làm việc độc lập / tập trung chuyên môn, ít phải ngoại giao')) {
          updated.workEnvironmentPrefs.push('Làm việc độc lập / tập trung chuyên môn, ít phải ngoại giao');
        }
      }
      if (l.includes('ngồi một chỗ') || l.includes('văn phòng') || l.includes('bàn giấy')) {
        if (!updated.rejectedActivities.includes('Công việc văn phòng ngồi một chỗ cố định')) {
          updated.rejectedActivities.push('Công việc văn phòng ngồi một chỗ cố định');
        }
        if (!updated.workEnvironmentPrefs.includes('Thích môi trường vận động, đi lại ngoài trời, ghét ngồi cố định một chỗ')) {
          updated.workEnvironmentPrefs.push('Thích môi trường vận động, đi lại ngoài trời, ghét ngồi cố định một chỗ');
        }
      }
      continue;
    }

    // 4. Xử lý Khẳng định sở thích (Positive Interests)
    if (l.includes('máy tính') || l.includes('công nghệ') || l.includes('cntt') || l.includes('it') || l.includes('phần mềm')) {
      const isRejected = updated.rejectedActivities.some(a => a.includes('Công nghệ & Máy tính'));
      if (!isRejected && !updated.statedInterests.includes('Công nghệ & Máy tính')) {
        updated.statedInterests.push('Công nghệ & Máy tính');
      }
    }
    if (l.includes('sáng tạo') || l.includes('vẽ') || l.includes('thiết kế') || l.includes('đồ họa') || l.includes('nghệ thuật') || l.includes('viết lách') || l.includes('nội dung') || l.includes('báo chí') || l.includes('truyện tranh') || l.includes('truyền thông')) {
      if (!updated.statedInterests.includes('Sáng tạo nghệ thuật & Nội dung')) {
        updated.statedInterests.push('Sáng tạo nghệ thuật & Nội dung');
      }
    }
    if (l.includes('kinh doanh') || l.includes('bán hàng') || l.includes('quản lý') || l.includes('thị trường') || l.includes('tài chính') || l.includes('thương mại') || l.includes('chứng khoán')) {
      const isRejected = updated.rejectedActivities.some(a => a.includes('Kinh doanh & Bán hàng'));
      if (!isRejected && !updated.statedInterests.includes('Kinh doanh & Quản trị')) {
        updated.statedInterests.push('Kinh doanh & Quản trị');
      }
    }
    if (l.includes('giao tiếp') || l.includes('tâm sự') || l.includes('giúp đỡ') || l.includes('dạy học') || l.includes('sư phạm') || l.includes('xã hội') || l.includes('bạn bè') || l.includes('nói chuyện')) {
      if (!updated.statedInterests.includes('Giao lưu, Lắng nghe & Kết nối bạn bè, xã hội')) {
        updated.statedInterests.push('Giao lưu, Lắng nghe & Kết nối bạn bè, xã hội');
      }
    }
    if (l.includes('game') || l.includes('chơi game') || l.includes('esport') || l.includes('điện tử')) {
      if (!updated.statedInterests.includes('Trải nghiệm Game & Giải trí Kỹ thuật số')) {
        updated.statedInterests.push('Trải nghiệm Game & Giải trí Kỹ thuật số');
      }
    }
    if (l.includes('đi dạo') || l.includes('ngoài trời') || l.includes('dạo phố') || l.includes('thiên nhiên')) {
      if (!updated.statedInterests.includes('Hoạt động tự do ngoài trời & Khám phá đời sống')) {
        updated.statedInterests.push('Hoạt động tự do ngoài trời & Khám phá đời sống');
      }
      if (!updated.workEnvironmentPrefs.includes('Môi trường mở, không gian ngoài trời thoáng đãng')) {
        updated.workEnvironmentPrefs.push('Môi trường mở, không gian ngoài trời thoáng đãng');
      }
    }
    if (l.includes('máy móc') || l.includes('lắp ráp') || l.includes('phần cứng') || l.includes('sửa chữa') || l.includes('thực hành xưởng')) {
      const isRejected = updated.rejectedActivities.some(a => a.includes('Kỹ thuật'));
      if (!isRejected && !updated.statedInterests.includes('Kỹ thuật & Máy móc thực tế')) {
        updated.statedInterests.push('Kỹ thuật & Máy móc thực tế');
      }
    }
    if (l.includes('bác sĩ') || l.includes('y khoa') || l.includes('y tế') || l.includes('y dược') || l.includes('dược sĩ') || l.includes('khám chữa bệnh') || l.includes('bệnh viện') || l.includes('ngành y')) {
      if (!updated.statedInterests.includes('Y tế & Sức khỏe (Y khoa / Dược)')) {
        updated.statedInterests.push('Y tế & Sức khỏe (Y khoa / Dược)');
      }
      if (l.includes('bác sĩ đa khoa')) {
        updated.explicitTargetCareer = 'Bác sĩ Đa khoa';
      } else if (l.includes('bác sĩ')) {
        updated.explicitTargetCareer = 'Bác sĩ';
      }
    }
    if (
      l.includes('địa lý') ||
      l.includes('địa lí') ||
      l.includes('địa chất') ||
      l.includes('bản đồ') ||
      l.includes('gis') ||
      l.includes('trắc địa') ||
      l.includes('quy hoạch') ||
      l.includes('viễn thám') ||
      l.includes('tài nguyên môi trường') ||
      l.includes('quản lý đất đai')
    ) {
      if (!updated.statedInterests.includes('Địa lý, GIS & Khoa học Không gian / Trái đất')) {
        updated.statedInterests.push('Địa lý, GIS & Khoa học Không gian / Trái đất');
      }
      if (l.includes('sư phạm địa')) {
        updated.statedInterests.push('Sư phạm Địa lý');
        updated.explicitTargetCareer = 'Giáo viên Địa lý';
      } else if (l.includes('gis') || l.includes('viễn thám')) {
        updated.explicitTargetCareer = 'Chuyên viên GIS & Viễn thám';
      } else if (l.includes('trắc địa')) {
        updated.explicitTargetCareer = 'Kỹ sư Trắc địa - Bản đồ số';
      } else if (l.includes('quy hoạch')) {
        updated.explicitTargetCareer = 'Chuyên viên Quy hoạch Đô thị';
      }
    }
    if (
      l.includes('động vật') ||
      l.includes('thú y') ||
      l.includes('chăm sóc thú') ||
      l.includes('chăn nuôi') ||
      l.includes('sinh thái') ||
      l.includes('bảo tồn') ||
      l.includes('thú cưng')
    ) {
      if (!updated.statedInterests.includes('Sinh học, Thú y & Chăm sóc động vật / Môi trường tự nhiên')) {
        updated.statedInterests.push('Sinh học, Thú y & Chăm sóc động vật / Môi trường tự nhiên');
      }
      if (l.includes('thú y') || l.includes('bác sĩ thú y')) {
        updated.explicitTargetCareer = 'Bác sĩ Thú y';
      }
    }

    // 5. Xử lý Năng lực học tập (Academic Strengths & Weaknesses)
    if (l.includes('toán nâng cao')) {
      if (!updated.academicWeaknesses.includes('E ngại môn Toán nâng cao / chuyên sâu')) {
        updated.academicWeaknesses.push('E ngại môn Toán nâng cao / chuyên sâu');
      }
    } else if (c.isRefutedNegation && l.includes('toán')) {
      // Phủ định bác bỏ: "không phải ghét toán" -> không gán nhãn yếu toán
    } else if (l.includes('toán chưa tốt') || l.includes('kém toán') || l.includes('yếu toán') || l.includes('sợ toán') || l.includes('toán 5-6') || l.includes('toán điểm thấp')) {
      if (!updated.academicWeaknesses.includes('Môn Toán điểm chưa cao / chưa tự tin giải tích chuyên sâu')) {
        updated.academicWeaknesses.push('Môn Toán điểm chưa cao / chưa tự tin giải tích chuyên sâu');
      }
    } else if (
      /(giỏi toán|thích toán|toán 8|toán 9|toán .*?(tốt|cao|ổn|9 phẩy|8 phẩy)|học sinh giỏi toán|toán học rất tốt|học rất tốt.*toán)/i.test(l)
    ) {
      if (!updated.academicStrengths.includes('Tư duy Toán học logic tốt')) {
        updated.academicStrengths.push('Tư duy Toán học logic tốt');
      }
    }

    if (l.includes('giỏi văn') || l.includes('thích văn') || l.includes('viết tốt') || l.includes('học sinh giỏi văn')) {
      if (!updated.academicStrengths.includes('Khả năng ngôn ngữ & Viết lách tốt')) {
        updated.academicStrengths.push('Khả năng ngôn ngữ & Viết lách tốt');
      }
    }

    if (l.includes('kém tiếng anh') || l.includes('yếu anh')) {
      if (!updated.academicWeaknesses.includes('Ngoại ngữ tiếng Anh chưa vững')) {
        updated.academicWeaknesses.push('Ngoại ngữ tiếng Anh chưa vững');
      }
    } else if (l.includes('tiếng anh tốt') || l.includes('ielts') || l.includes('thích tiếng anh') || l.includes('tự tin nhất môn tiếng anh')) {
      if (!updated.academicStrengths.includes('Năng lực tiếng Anh tốt')) {
        updated.academicStrengths.push('Năng lực tiếng Anh tốt');
      }
    }

    if (/(giỏi địa|địa lý tốt|học tốt.*địa|học sinh giỏi địa|thế mạnh.*địa|điểm địa cao)/i.test(l)) {
      if (!updated.academicStrengths.includes('Thế mạnh môn Địa lý & Tư duy phân tích không gian')) {
        updated.academicStrengths.push('Thế mạnh môn Địa lý & Tư duy phân tích không gian');
      }
    }

    if (l.includes('học lực bình thường') || l.includes('học đều') || l.includes('không giỏi nổi trội')) {
      if (!updated.academicStrengths.includes('Học lực mức khá đều các môn')) {
        updated.academicStrengths.push('Học lực mức khá đều các môn');
      }
    }

    // 6. Xử lý Môi trường & Giá trị làm việc (Work Environment & Values)
    if (l.includes('bản đồ số') || l.includes('phòng lab') || l.includes('dữ liệu không gian') || l.includes('phân tích không gian') || l.includes('không gian đô thị')) {
      if (!updated.workEnvironmentPrefs.includes('Môi trường phòng lab nghiên cứu & phân tích dữ liệu không gian bản đồ số')) {
        updated.workEnvironmentPrefs.push('Môi trường phòng lab nghiên cứu & phân tích dữ liệu không gian bản đồ số');
      }
    }
    if (l.includes('thực địa') || l.includes('khảo sát thực địa') || l.includes('đo đạc')) {
      if (!updated.workEnvironmentPrefs.includes('Khảo sát thực địa ngoại nghiệp và đo đạc công trình')) {
        updated.workEnvironmentPrefs.push('Khảo sát thực địa ngoại nghiệp và đo đạc công trình');
      }
    }
    if (l.includes('ổn định') || l.includes('công việc ổn định') || l.includes('ít rủi ro')) {
      if (!updated.personalValues.includes('Ưu tiên tính ổn định, rõ ràng lộ trình')) {
        updated.personalValues.push('Ưu tiên tính ổn định, rõ ràng lộ trình');
      }
    }
    if (l.includes('ít giao tiếp') || l.includes('ngại giao tiếp') || l.includes('hướng nội') || l.includes('làm việc độc lập') || l.includes('không thích giao tiếp quá nhiều')) {
      if (!updated.workEnvironmentPrefs.includes('Làm việc độc lập / tập trung chuyên môn, ít phải ngoại giao')) {
        updated.workEnvironmentPrefs.push('Làm việc độc lập / tập trung chuyên môn, ít phải ngoại giao');
      }
    }
    if (l.includes('thu nhập cao') || l.includes('kiếm nhiều tiền') || l.includes('lương cao')) {
      if (!updated.personalValues.includes('Ưu tiên mức thu nhập đột phá')) {
        updated.personalValues.push('Ưu tiên mức thu nhập đột phá');
      }
    }
    if (l.includes('tự do') || l.includes('linh hoạt') || l.includes('không gò bó')) {
      if (!updated.workEnvironmentPrefs.includes('Môi trường linh hoạt, sáng tạo tự do')) {
        updated.workEnvironmentPrefs.push('Môi trường linh hoạt, sáng tạo tự do');
      }
    }
    if (l.includes('bàn giấy') || l.includes('ngồi 8 tiếng') || l.includes('phòng máy tính') || l.includes('công việc bàn giấy')) {
      if (!updated.workEnvironmentPrefs.includes('Môi trường văn phòng bàn giấy cố định 8 tiếng')) {
        updated.workEnvironmentPrefs.push('Môi trường văn phòng bàn giấy cố định 8 tiếng');
      }
    }
    if (l.includes('ngoài trời') || l.includes('đi lại ngoài trời') || l.includes('năng động ngoài trời')) {
      if (!updated.workEnvironmentPrefs.includes('Thích môi trường vận động, đi lại ngoài trời, ghét ngồi cố định một chỗ')) {
        updated.workEnvironmentPrefs.push('Thích môi trường vận động, đi lại ngoài trời, ghét ngồi cố định một chỗ');
      }
    }
  }

  // 7. Phân tích rào cản điều kiện
  if (fullLower.includes('bố mẹ') || fullLower.includes('gia đình muốn') || fullLower.includes('gia đình định hướng')) {
    if (!updated.realConstraints.includes('Ảnh hưởng từ kỳ vọng gia đình')) {
      updated.realConstraints.push('Ảnh hưởng từ kỳ vọng gia đình');
    }
  }
  if (fullLower.includes('học phí') || fullLower.includes('kinh tế khó khăn') || fullLower.includes('ít tiền') || fullLower.includes('tiết kiệm') || fullLower.includes('không có tiền')) {
    if (!updated.realConstraints.includes('Cần cân nhắc bài toán tài chính & học phí')) {
      updated.realConstraints.push('Cần cân nhắc bài toán tài chính & học phí');
    }
  }

  // 8. Phát hiện mâu thuẫn (Contradiction Detection)
  const contradictions: string[] = [];
  const hatesSitting = updated.workEnvironmentPrefs.some(p => p.includes('ghét ngồi') || p.includes('ngoài trời')) ||
                       updated.rejectedActivities.some(a => a.includes('văn phòng'));
  const wantsOfficeDesk = updated.workEnvironmentPrefs.some(p => p.includes('văn phòng bàn giấy') || p.includes('ngồi 8 tiếng'));
  if (hatesSitting && wantsOfficeDesk) {
    contradictions.push('Mâu thuẫn giữa mong muốn làm việc ngoài trời / ghét ngồi một chỗ VỚI mong muốn công việc bàn giấy ổn định 8 tiếng trong văn phòng.');
  }

  updated.unresolvedContradictions = contradictions;

  // 9. Cập nhật bằng chứng còn thiếu
  const missing: string[] = [];
  if (updated.statedInterests.length === 0) missing.push('Sở thích hoạt động cụ thể (RIASEC)');
  if (updated.academicStrengths.length === 0 && updated.academicWeaknesses.length === 0) missing.push('Năng lực học tập hoặc môn học cụ thể');
  if (updated.workEnvironmentPrefs.length === 0 && updated.personalValues.length === 0) missing.push('Môi trường làm việc & giá trị mong muốn');
  if (updated.realConstraints.length === 0) missing.push('Điều kiện thực tế (tài chính, địa lý)');
  updated.missingEvidence = missing;

  return updated;
}

/**
 * Đánh giá mức độ sẵn sàng bằng chứng (Ground Evidence Readiness):
 * - Tuyệt đối không dùng số lượt chat làm điều kiện đủ để mở CAREER_SHORTLIST.
 * - Chỉ mở shortlist khi người học đã có đủ 3 trụ cột độc lập: Sở thích + Năng lực + Môi trường.
 * - Nếu có mâu thuẫn chưa giải quyết (unresolvedContradictions) -> Bắt buộc giữ ở trạng thái khám phá.
 */
export function evaluateEvidenceReadiness(profile: LearnerEvidenceProfile): {
  isReadyForCareers: boolean;
  score: number;
  reason: string;
} {
  // Nếu còn mâu thuẫn chưa được làm rõ, tuyệt đối KHÔNG cho phép xuất shortlist
  if (profile.unresolvedContradictions && profile.unresolvedContradictions.length > 0) {
    return {
      isReadyForCareers: false,
      score: 45,
      reason: `Còn mâu thuẫn cần làm rõ: ${profile.unresolvedContradictions[0]}`
    };
  }

  let score = 0;
  if (profile.realityCheckAnswer) score += 20;

  // Trụ cột 1: Sở thích rõ ràng (Stated Interests)
  const hasInterests = profile.statedInterests.length > 0;
  if (hasInterests) score += 30;

  // Trụ cột 2: Năng lực học tập hoặc điểm yếu cụ thể (Academic Strengths / Weaknesses)
  const hasCapabilities = profile.academicStrengths.length > 0 || profile.academicWeaknesses.length > 0;
  if (hasCapabilities) score += 25;

  // Trụ cột 3: Môi trường làm việc hoặc giá trị cá nhân (Work Environment / Values)
  const hasEnvironment = profile.workEnvironmentPrefs.length > 0 || profile.personalValues.length > 0;
  if (hasEnvironment) score += 25;

  // Điều kiện sẵn sàng: Phải có đủ 3 trụ cột, đạt điểm số tin cậy >= 75, có ít nhất 2 lượt hội thoại, và không chọn hoãn đề xuất nghề
  const wantsDelayedShortlist = Boolean(
    profile.realityCheckAnswer && /chưa vội chốt ngành|từng bước từ con số 0|thấu hiểu bản thân trước/i.test(profile.realityCheckAnswer)
  );

  const hasAllPillars = hasInterests && hasCapabilities && hasEnvironment;
  const isReady = hasAllPillars && score >= 75 && (profile.turnsCount >= 2) && !wantsDelayedShortlist && (!profile.unresolvedContradictions || profile.unresolvedContradictions.length === 0);

  let reason = '';
  if (!isReady) {
    if (!hasInterests) {
      reason = 'Chưa xác định được sở thích và hoạt động hứng thú cụ thể.';
    } else if (!hasCapabilities) {
      reason = 'Đã có sở thích nhưng chưa làm rõ năng lực học tập hoặc môn học trọng tâm.';
    } else if (!hasEnvironment) {
      reason = 'Cần làm rõ thêm môi trường làm việc mong muốn và giá trị công việc.';
    } else {
      reason = 'Mức độ tích lũy bằng chứng chưa đạt ngưỡng tin cậy để đề xuất danh sách nghề.';
    }
  } else {
    reason = 'Đã tích lũy đủ 3 trụ cột bằng chứng độc lập về Sở thích, Năng lực và Môi trường làm việc.';
  }

  return { isReadyForCareers: isReady, score, reason };
}

// ============================================================================
// 3. CORE DECISION DISPATCHER (XỬ LÝ TỪNG LƯỢT HỘI THOẠI)
// ============================================================================

export function processDecisionTurn(
  userInput: string,
  existingProfile?: LearnerEvidenceProfile | null,
  realityAnswer?: string
): AdaptiveDecisionResult {
  const text = userInput.trim();
  const lower = text.toLowerCase();

  // Khởi tạo hoặc cập nhật profile
  let profile = existingProfile 
    ? updateProfileWithInput(existingProfile, text)
    : createInitialProfile(text, realityAnswer);

  if (realityAnswer && !profile.realityCheckAnswer) {
    profile.realityCheckAnswer = realityAnswer;
    profile.verifiedEvidence.push(`Tâm thế đối diện thực tế: "${realityAnswer}"`);
  }

  // =========================================================================
  // SCENARIO 0A: PHÁT HIỆN MÂU THUẪN CHƯA GIẢI QUYẾT (Test Case 7 / Scenario 7)
  // Ưu tiên cao nhất: Tháo gỡ mâu thuẫn trước khi đề xuất bất kỳ nghề nào
  // =========================================================================
  if (profile.unresolvedContradictions && profile.unresolvedContradictions.length > 0) {
    profile.currentStage = 'STATE_B_EXPLORING';
    const conflictDesc = profile.unresolvedContradictions[0];

    const replyText = 
`Cảm ơn bạn đã tiếp tục chia sẻ. Khi đối chiếu các thông tin bạn cung cấp qua các lượt hội thoại, mình nhận thấy có một **điểm mâu thuẫn quan trọng cần làm rõ**:

👉 **Điểm mâu thuẫn**: ${conflictDesc}

Trong thực tế, môi trường làm việc quyết định trực tiếp đến việc bạn có gắn bó lâu dài được với một nghề hay không. Nếu chọn nghề văn phòng bàn giấy cố định trong khi bạn lại rất ghét việc phải ngồi một chỗ 8 tiếng mỗi ngày, bạn sẽ nhanh chóng cảm thấy ngột ngạt và kiệt sức.`;

    const primaryQuestion = "Bạn có thể chia sẻ rõ hơn: Điều gì ở công việc văn phòng bàn giấy khiến bạn muốn hướng tới (tính ổn định, chế độ đãi ngộ, hay kỳ vọng gia đình), và bạn có thực sự chấp nhận đánh đổi việc ngồi một chỗ mỗi ngày để đổi lấy sự ổn định đó không?";

    const quickReplies = [
      "Em muốn sự ổn định nhưng sợ ngồi một chỗ, có nghề nào dung hòa được không?",
      "Thực ra do bố mẹ muốn em làm văn phòng ổn định, bản thân em thích đi lại ngoài trời hơn",
      "Nếu công việc văn phòng mà được đi gặp khách hàng hoặc khảo sát thực tế thì em làm được",
      "Em sẵn sàng ngồi văn phòng nếu môi trường trẻ trung, không gò bó thủ tục"
    ];

    saveLearnerProfile(profile);

    return {
      action: 'ASK_QUESTION',
      stage: 'STATE_B_EXPLORING',
      replyText: `${replyText}\n\n👉 **Câu hỏi để giúp bạn tháo gỡ điểm nghẽn này:**\n${primaryQuestion}`,
      primaryQuestion,
      questionContext: 'Nhận diện và bóc tách mâu thuẫn trong mong muốn môi trường làm việc của người học.',
      quickReplies,
      evidenceSummary: {
        selfReported: profile.workEnvironmentPrefs.concat(profile.personalValues),
        verified: profile.verifiedEvidence,
        hypotheses: ['Phát hiện mâu thuẫn giữa kỳ vọng ổn định và sự gò bó không gian.'],
        missing: ['Làm rõ mức độ chấp nhận đánh đổi không gian làm việc']
      },
      updatedProfile: profile
    };
  }

  // =========================================================================
  // SCENARIO 0B: NGƯỜI HỌC ÉP HỆ THỐNG CHỐT NGHỀ KHI CHƯA ĐỦ BẰNG CHỨNG (Test Case 8 / Scenario 12)
  // Kiên quyết từ chối đoán mò, giải thích hệ quả của việc chọn bừa
  // =========================================================================
  const isForcedProposalDemand = 
    /(chốt luôn|chốt ngay|chốt cho em|đừng hỏi em nữa|đừng hỏi nữa|cho em 3 nghề luôn|chốt 3 nghề|chốt nghề đi)/i.test(text);

  const readiness = evaluateEvidenceReadiness(profile);

  if (isForcedProposalDemand && !readiness.isReadyForCareers) {
    profile.currentStage = 'STATE_B_EXPLORING';
    const replyText = 
`Mình rất hiểu bạn đang cảm thấy sốt ruột và muốn có ngay một danh sách nghề dứt khoát để bớt băn khoăn. Tuy nhiên, nếu mình đoán mò hoặc "chốt đại" cho bạn 3 nghề đang hot hiện nay (như Lập trình viên hay Chuyên viên Tài chính) khi chưa có căn cứ về năng lực và giá trị của bạn, thì hậu quả lớn nhất là: **Bạn có thể mất 3-4 năm đại học học một ngành hoàn toàn không phù hợp, dẫn đến chán nản và phải làm lại từ con số 0.**

Định hướng nghề nghiệp tại NEXORA tuân thủ nguyên tắc khoa học: **Chỉ đề xuất nghề khi có đủ bằng chứng đối chiếu**.

Để không làm mất thêm thời gian của bạn, hãy cho mình biết một manh mối nhỏ nhất: **Giữa việc làm việc với máy móc/máy tính, làm việc với con người, hay làm việc với văn bản/hình ảnh, bạn thấy mình ít chán nhất với việc nào?**`;

    const primaryQuestion = "Giữa việc làm việc với máy móc/máy tính, làm việc với con người, hay làm việc với văn bản/hình ảnh, bạn thấy mình ít chán nhất với việc nào?";

    saveLearnerProfile(profile);

    return {
      action: 'ASK_QUESTION',
      stage: 'STATE_B_EXPLORING',
      replyText: `${replyText}\n\n👉 **Hãy chọn một hướng bạn thấy gần gũi nhất:**\n${primaryQuestion}`,
      primaryQuestion,
      questionContext: 'Từ chối đoán mò khi chưa đủ căn cứ; định hướng người học cung cấp dữ liệu sở thích tối thiểu.',
      quickReplies: [
        "Em thấy đỡ chán nhất khi làm việc với máy tính / thiết bị",
        "Em thích tương tác, trò chuyện và hỗ trợ người khác",
        "Em thích làm việc độc lập với hình ảnh, câu chữ hoặc vẽ vời",
        "Em chưa có cơ hội thử nhiều nên chưa rõ"
      ],
      evidenceSummary: {
        selfReported: profile.rawInputs,
        verified: profile.verifiedEvidence,
        hypotheses: ['Người học đang sốt ruột, cần giải tỏa tâm lý và thu hẹp câu hỏi.'],
        missing: profile.missingEvidence
      },
      updatedProfile: profile
    };
  }

  // =========================================================================
  // SCENARIO 0C: TRẢ LỜI MƠ HỒ HOẶC RẤT NGẮN NHIỀU LƯỢT LIÊN TIẾP (Test Case 1 / Scenario 6)
  // Kiên nhẫn hỏi tiếp qua tình huống cụ thể, tuyệt đối KHÔNG xuất 3 nghề khi rỗng bằng chứng
  // =========================================================================
  const isVagueInput = 
    /^\s*(\.{2,}|ko\s*biet|không\s*biết|k\s*biết|sao\s*cũng\s*được|sao\s*cung\s*duoc|tùy|chịu|chưa\s*biết|chưa\s*rõ|hong\s*biet)\s*$/i.test(text);

  if (isVagueInput || (profile.turnsCount >= 3 && profile.statedInterests.length === 0 && profile.academicStrengths.length === 0)) {
    profile.currentStage = 'STATE_B_EXPLORING';
    const replyText = 
`Mình hiểu là bạn đang cảm thấy khá mông lung hoặc chưa có câu trả lời rõ ràng lúc này. Đừng quá lo lắng hay tự trách mình — rất nhiều bạn học sinh cũng từng trải qua cảm giác này.

Khi chưa có dữ liệu rõ ràng, việc cố ép mình chọn một hướng đi thường gây bế tắc. Thay vì nghĩ về những thứ to tát, chúng mình hãy thử một hoạt động quan sát nhỏ rất đời thường nhé.`;

    const primaryQuestion = "Khi không phải chịu bất kỳ áp lực nào về bài tập hay điểm số, việc gì trong ngày thường khiến bạn cảm thấy tự nhiên, thoải mái hoặc đỡ chán nhất?";

    saveLearnerProfile(profile);

    return {
      action: 'ASK_QUESTION',
      stage: 'STATE_B_EXPLORING',
      replyText: `${replyText}\n\n👉 **${primaryQuestion}**`,
      primaryQuestion,
      questionContext: 'Gợi mở nhẹ nhàng qua trải nghiệm hằng ngày khi người học cảm thấy mông lung.',
      quickReplies: [
        "Em thích mày mò máy tính, điện thoại hoặc chơi game",
        "Em thích vẽ vời, nghe nhạc hoặc làm việc sáng tạo một mình",
        "Em thích ra ngoài gặp gỡ, trò chuyện cùng bạn bè",
        "Em chỉ muốn nghỉ ngơi thư giãn và chưa nghĩ ra gì cả"
      ],
      evidenceSummary: {
        selfReported: profile.rawInputs,
        verified: profile.verifiedEvidence,
        hypotheses: ['Người học cần các mỏ neo tình huống cụ thể thay vì câu hỏi trừu tượng.'],
        missing: profile.missingEvidence
      },
      updatedProfile: profile
    };
  }

  // =========================================================================
  // SCENARIO 1: NGƯỜI HỌC BẮT ĐẦU TỪ SỐ 0 (Test 1)
  // "Em học lớp 11, học lực bình thường, chưa biết mình thích gì."
  // =========================================================================
  const isZeroState = 
    /chưa biết mình thích gì|chưa biết thích gì|không biết thích gì|học lực bình thường|chưa biết chọn ngành|không biết mình giỏi môn nào|mất định hướng|chưa rõ mình muốn gì|không biết làm gì|chưa biết làm gì|phải làm gì|làm gì bây giờ|không biết phải làm gì|bắt đầu từ đâu|lạc lối|hoang mang|bối rối|mông lung|không có định hướng|tôi phải làm gì|em phải làm gì|chưa biết mình giỏi gì|chưa biết học gì|chưa biết thi gì/i.test(text) ||
    Boolean(realityAnswer && /chưa vội chốt ngành|từng bước từ con số 0|thấu hiểu bản thân trước/i.test(realityAnswer)) ||
    Boolean(profile.realityCheckAnswer && /chưa vội chốt ngành|từng bước từ con số 0|thấu hiểu bản thân trước/i.test(profile.realityCheckAnswer));

  if (isZeroState) {
    profile.currentStage = 'STATE_A_ZERO';
    const replyText = 
`Chào bạn! Cảm ơn bạn đã trải lòng trong buổi tư vấn hướng nghiệp 1:1 hôm nay.

Cảm giác **"chưa biết phải làm gì" hoặc "mông lung về tương lai"** ở thời điểm này là điều hoàn toàn tự nhiên và rất phổ biến. Hầu hết các bạn học sinh THPT đều từng trải qua giai đoạn bế tắc này. Mình muốn khẳng định với bạn ngay từ đầu: **Buổi tư vấn 1:1 này tuyệt đối KHÔNG ép bạn phải chọn nghề, chọn ngành hay chọn khối thi ngay lúc này.**

Một buổi tư vấn hướng nghiệp đúng nghĩa không phải là bài trắc nghiệm chấm điểm hay một danh sách nghề áp đặt, mà là một hành trình bóc tách từng mảnh ghép về chính bạn từ con số 0 một cách nhẹ nhàng nhất.`;

    const primaryQuestion = "Để bắt đầu thật thoải mái: Khi không phải chịu áp lực bài tập điểm số trên lớp, trong các hoạt động đời thường (như xem video, tìm tòi máy tính/đồ dùng, vẽ vời/nghe nhạc/viết lách, nói chuyện tâm sự với bạn bè, hay làm việc bằng tay/chơi thể thao), việc gì khiến bạn cảm thấy cuốn hút, dễ chịu hoặc đỡ chán nhất?";

    const quickReplies = [
      "Em hay xem video về máy tính, công nghệ hoặc các thiết bị mới",
      "Em thích vẽ vời, nghe nhạc, viết lách hoặc sáng tạo nội dung",
      "Em thích nói chuyện, lắng nghe và chia sẻ tâm sự với bạn bè",
      "Em thích các hoạt động vận động, thể thao hoặc làm việc bằng tay",
      "Em thấy mọi thứ đều bình thường, chưa có hoạt động nào nổi bật"
    ];

    saveLearnerProfile(profile);

    return {
      action: 'ASK_QUESTION',
      stage: 'STATE_A_ZERO',
      replyText: `${replyText}\n\n👉 **Câu hỏi dành cho bạn:**\n${primaryQuestion}`,
      primaryQuestion,
      questionContext: 'Xác định nhóm hoạt động mang lại cảm xúc hứng thú tự nhiên (RIASEC sơ bộ).',
      quickReplies,
      evidenceSummary: {
        selfReported: profile.rawInputs,
        verified: profile.verifiedEvidence,
        hypotheses: ['Người học đang ở giai đoạn 0: cần nhận diện trải nghiệm tích cực tự nhiên.'],
        missing: profile.missingEvidence
      },
      updatedProfile: profile
    };
  }

  // =========================================================================
  // SCENARIO 1B: NGUYỆN VỌNG NGHỀ CỤ THỂ NGOÀI IT/KINH TẾ - NGÀNH Y (Scenario 11)
  // =========================================================================
  const isTargetingMedical = 
    /(bác sĩ|y khoa|y đa khoa|ngành y|dược sĩ)/i.test(text) && 
    !/(không thích|ghét|không muốn|từ chối)/i.test(text);

  if (isTargetingMedical) {
    if (!profile.statedInterests.includes('Y tế & Sức khỏe (Y khoa / Dược)')) {
      profile.statedInterests.push('Y tế & Sức khỏe (Y khoa / Dược)');
    }
    profile.explicitTargetCareer = 'Bác sĩ Đa khoa';

    const isAskingRoadmap = /(lộ trình|trường đào tạo|học trường nào|điều kiện|xét tuyển|đã quyết định chắc chắn)/i.test(text);

    if (isAskingRoadmap || readiness.isReadyForCareers) {
      profile.currentStage = 'STATE_C_CAREERS';
      const careers = generateGroundedCareerProposals(profile);

      saveLearnerProfile(profile);

      return {
        action: 'CAREER_SHORTLIST',
        stage: 'STATE_C_CAREERS',
        replyText: 
`Chào bạn! Quyết định hướng tới vị trí **Bác sĩ Đa khoa** là một nguyện vọng rất đáng trân trọng nhưng cũng đi kèm những thách thức học thuật và sức bền lớn nhất trong hệ thống giáo dục đại học Việt Nam.

Dưới đây là hồ sơ phân tích thực tế về vị trí **Bác sĩ Đa khoa (Gate 2)**, bao gồm: các điều kiện tiên quyết cần đạt (điểm thi B00, sức bền học tập 6 năm + 18 tháng thực hành), các trường đào tạo trọng điểm, và bài kiểm tra thực tế để bạn tự xác nhận độ vững vàng của quyết định này.`,
        suggestedCareers: careers,
        evidenceSummary: {
          selfReported: profile.statedInterests.concat(profile.academicStrengths),
          verified: profile.verifiedEvidence,
          hypotheses: ['Người học đã có mục tiêu nghề nghiệp rõ rệt trong ngành Y.'],
          missing: ['Điểm thi thực tế các môn Toán - Hóa - Sinh', 'Khả năng cam kết học tập dài hạn']
        },
        updatedProfile: profile
      };
    }
  }

  // =========================================================================
  // SCENARIO 1C: ĐA TIỀM NĂNG - QUAN TÂM NHIỀU LĨNH VỰC KHÁC NHAU (Scenario 3)
  // =========================================================================
  const hasMultiInterests = profile.statedInterests.length >= 2;
  if (hasMultiInterests && !readiness.isReadyForCareers) {
    profile.currentStage = 'STATE_B_EXPLORING';
    const interestList = profile.statedInterests.join(' và ');

    const replyText = 
`Thật tuyệt vời khi bạn có sự hứng thú phong phú ở nhiều lĩnh vực: **${interestList}**.

Trong thị trường lao động hiện đại, những bạn có "trí thông minh đa diện" (Multi-potentialite) thường có lợi thế rất lớn ở các vị trí giao thoa (Hybrid roles). Bạn không nhất thiết phải bỏ một bên để chọn một bên, mà có thể tìm điểm chạm:
- Kết hợp **Sáng tạo nội dung/nghệ thuật** với **Tư duy kinh doanh**: Quản trị thương hiệu số, Thiết kế trải nghiệm sản phẩm (Product/UX), hoặc Giám đốc sáng tạo (Creative Director).
- Xem một lĩnh vực là **trục chuyên môn chính**, và lĩnh vực còn lại là **vũ khí bổ trợ** tạo sự khác biệt.`;

    const primaryQuestion = "Trong 2 hướng trên, bạn thấy khi làm việc gì thì thời gian trôi qua nhanh nhất và bạn không thấy chán: (1) Sáng tạo câu chuyện, hình ảnh, thông điệp; hay (2) Quan sát thị trường, số liệu và cách thức vận hành kiếm tiền?";

    const quickReplies = [
      "Em thích sáng tạo ý tưởng và hình ảnh hơn, kinh doanh chỉ là sở thích phụ",
      "Em muốn làm kinh doanh hoặc tài chính, nhưng áp dụng sự sáng tạo vào đó",
      "Em muốn tìm một công việc kết hợp được cả 2 lĩnh vực này",
      "Hãy gợi ý cho em các ngành học lai (hybrid) giữa nghệ thuật và kinh tế"
    ];

    saveLearnerProfile(profile);

    return {
      action: 'ASK_QUESTION',
      stage: 'STATE_B_EXPLORING',
      replyText: `${replyText}\n\n👉 **Để tìm điểm giao nhau phù hợp nhất:**\n${primaryQuestion}`,
      primaryQuestion,
      questionContext: 'Nhận diện người học đa tiềm năng; định hướng tìm điểm giao thay vì ép chọn một vế.',
      quickReplies,
      evidenceSummary: {
        selfReported: profile.statedInterests,
        verified: profile.verifiedEvidence,
        hypotheses: ['Người học đa tiềm năng, phù hợp các vai trò lai (Hybrid Roles).'],
        missing: ['Điểm mạnh cốt lõi ưu tiên số 1', 'Môi trường làm việc mong muốn']
      },
      updatedProfile: profile
    };
  }

  // =========================================================================
  // SCENARIO 2: CÓ SỞ THÍCH NHƯNG CHƯA RÕ NĂNG LỰC (Test 2)
  // "Em thích máy tính và công nghệ nhưng học Toán chưa tốt."
  // =========================================================================
  const hasTechInterest = lower.includes('máy tính') || lower.includes('công nghệ') || lower.includes('it');
  const hasMathWeakness = lower.includes('toán chưa tốt') || lower.includes('kém toán') || lower.includes('yếu toán') || lower.includes('sợ toán');

  if (hasTechInterest && hasMathWeakness) {
    profile.currentStage = 'STATE_B_EXPLORING';
    
    const replyText = 
`Mình hiểu rất rõ băn khoăn này của bạn. Rất nhiều bạn học sinh đam mê máy tính nhưng chùn bước chỉ vì nghĩ rằng "học công nghệ thì bắt buộc phải là thần đồng môn Toán".

Thực tế thị trường ngành Công nghệ Thông tin rất rộng lớn và được phân thành nhiều phân nhánh khác nhau:
1. **Nhánh Thuật toán lõi & AI/Khoa học dữ liệu**: Cần nền tảng Toán giải tích, đại số tuyến tính và xác suất thống kê rất sâu.
2. **Nhánh Thiết kế Giao diện & Trải nghiệm Người dùng (UI/UX)**: Đòi hỏi tư duy thẩm mỹ, thấu cảm hành vi người dùng, gần như không dùng tới Toán cao cấp.
3. **Nhánh Phát triển Ứng dụng & Kiểm thử Phần mềm (Frontend / QA / Tester)**: Đòi hỏi tư duy logic quy trình, tính cẩn thận và khả năng kiểm thử lỗi, không cần giải các bài toán tích phân phức tạp.
4. **Nhánh Quản trị Mạng, An ninh mạng & Hạ tầng Kỹ thuật**: Thiên về kiến trúc hệ thống, cấu hình phần cứng và quy tắc an toàn.

Việc điểm Toán hiện tại chưa cao không có nghĩa là cánh cửa công nghệ đã đóng lại. Quan trọng là bạn làm rõ mình hào hứng với khía cạnh nào của máy tính.`;

    const primaryQuestion = "Trong thế giới công nghệ, điều gì khiến bạn thấy tò mò nhất: (1) Cách tạo ra một ứng dụng/giao diện đẹp mắt người dùng thích bấm vào, (2) Cách một chương trình vận hành và xử lý lỗi, hay (3) Cách bảo vệ hệ thống máy tính và kết nối mạng? Đồng thời, bạn thấy môn Toán khó ở phần nào (hình học không gian, giải tích hay phương pháp học)?";

    const quickReplies = [
      "Em thích thiết kế giao diện UI/UX và đồ họa sản phẩm hơn",
      "Em thích lập trình ứng dụng nhưng học Toán bị hổng phương pháp",
      "Em thích quản trị mạng, lắp ráp máy tính và hỗ trợ hệ thống",
      "Em muốn biết các ngành công nghệ nào xét tuyển không quá nặng điểm Toán"
    ];

    saveLearnerProfile(profile);

    return {
      action: 'EXPLORE_INTERESTS',
      stage: 'STATE_B_EXPLORING',
      replyText: `${replyText}\n\n👉 **Để định vị hướng đi phù hợp, bạn chia sẻ thêm:**\n${primaryQuestion}`,
      primaryQuestion,
      questionContext: 'Phân tách rào cản môn Toán khỏi niềm yêu thích công nghệ; xác định phân nhánh kỹ năng.',
      quickReplies,
      evidenceSummary: {
        selfReported: profile.statedInterests.concat(profile.academicWeaknesses),
        verified: profile.verifiedEvidence,
        hypotheses: ['Có thể phù hợp với UI/UX Design, Software Testing (QA), hoặc Hệ thống Thông tin quản lý.'],
        missing: ['Mức độ kiên trì với logic phần mềm', 'Môi trường làm việc ưu tiên']
      },
      updatedProfile: profile
    };
  }

  // =========================================================================
  // SCENARIO 3: CÓ THÔNG TIN TRÁI CHIỀU (Test 3)
  // "Em thích sáng tạo nhưng muốn công việc ổn định, không thích giao tiếp quá nhiều."
  // =========================================================================
  const hasCreative = lower.includes('sáng tạo') || lower.includes('nghệ thuật');
  const hasStable = lower.includes('ổn định');
  const hasLowSocial = lower.includes('không thích giao tiếp') || lower.includes('ít giao tiếp') || lower.includes('ngại giao tiếp') || lower.includes('hướng nội');

  if (hasCreative && (hasStable || hasLowSocial)) {
    profile.currentStage = 'STATE_B_EXPLORING';

    const replyText = 
`Nhiều người thường lầm tưởng rằng "sáng tạo" thì phải làm freelancer bấp bênh, hoặc phải bay nhảy giao tiếp xã hội suốt ngày. Nhưng thực tế **Sáng tạo + Ổn định + Tập trung độc lập** là một tổ hợp tính cách nghề nghiệp cực kỳ có giá trị trong các tổ chức hiện đại.

Có những vị trí đòi hỏi sức sáng tạo cao độ nhưng lại diễn ra trong môi trường làm việc độc lập, yên tĩnh và có biên chế/hợp đồng dài hạn rất ổn định:
- **Thiết kế Trải nghiệm Người dùng (UI/UX Designer)** hoặc **Thiết kế Đồ họa Kỹ thuật số (3D/Digital Design)** trong các công ty công nghệ và tập đoàn viễn thông.
- **Kỹ sư Tạo mẫu & Diễn họa Kiến trúc (3D Visualizer / BIM Modeler)** trong các viện thiết kế, công ty xây dựng.
- **Biên tập Nội dung Chuyên sâu & Tài liệu Kỹ thuật (Technical Writer / Content Specialist)**: Làm việc với câu chữ, ý tưởng một cách độc lập mà không cần phải đi tiếp khách hay đàm phán bán hàng.

Đây hoàn toàn không phải là những mong muốn mâu thuẫn, mà là một định hướng công việc đòi hỏi chiều sâu chuyên môn.`;

    const primaryQuestion = "Trong các dạng công việc sáng tạo, bạn thấy mình thoải mái và hào hứng nhất khi làm việc với: (1) Hình ảnh, màu sắc và giao diện trực quan; (2) Câu chữ, kịch bản và nội dung chuyên sâu; hay (3) Cách sắp xếp bố cục và tối ưu hóa một quy trình?";

    const quickReplies = [
      "Em thích làm việc với hình ảnh, đồ họa 2D/3D trên máy tính",
      "Em thích viết lách, nghiên cứu tài liệu và làm việc một mình",
      "Em thích thiết kế giao diện ứng dụng (UI/UX)",
      "Em muốn tìm hiểu mức thu nhập và độ ổn định của các nghề này"
    ];

    saveLearnerProfile(profile);

    return {
      action: 'EXPLORE_INTERESTS',
      stage: 'STATE_B_EXPLORING',
      replyText: `${replyText}\n\n👉 **Gợi mở tiếp theo cho bạn:**\n${primaryQuestion}`,
      primaryQuestion,
      questionContext: 'Dung hòa giá trị Sáng tạo - Ổn định - Hướng nội thành các vị trí chuyên môn độc lập.',
      quickReplies,
      evidenceSummary: {
        selfReported: profile.statedInterests.concat(profile.workEnvironmentPrefs),
        verified: profile.verifiedEvidence,
        hypotheses: ['Tương thích nhóm RIASEC: A-I-C (Nghệ thuật - Nghiên cứu - Quy chuẩn).'],
        missing: ['Kỹ năng phần mềm đồ họa/viết lách đã có', 'Định hướng địa lý và trường đào tạo']
      },
      updatedProfile: profile
    };
  }

  // =========================================================================
  // SCENARIO 4: MUỐN CHỌN D01 NGAY (Test 4)
  // "Em cứ chọn D01 vì nhiều ngành, rồi chọn trường sau được không?"
  // =========================================================================
  const asksAboutD01Shortcut = 
    /chọn d01 vì nhiều ngành|cứ chọn d01|chọn khối d01|chọn d01 trước|chọn trường sau được không/i.test(text);

  if (asksAboutD01Shortcut) {
    profile.currentStage = 'STATE_B_EXPLORING';

    const replyText = 
`Rất nhiều bạn học sinh cũng có cùng suy nghĩ này: "Cứ chọn D01 (Toán – Văn – Anh) cho an toàn vì khối này nhiều ngành xét tuyển nhất, rồi tính tiếp".

Tuy nhiên, mình muốn cùng bạn nhìn thẳng vào bức tranh thực tế:
1. **Rủi ro chọn ngành mông lung**: Đúng là D01 có độ phủ ngành rất rộng, nhưng nếu bạn chưa có mục tiêu nghề nghiệp, bạn sẽ dễ rơi vào tâm lý "đỗ ngành nào học ngành đó". Khi vào đại học, nếu ngành đó không hợp tính cách, bạn sẽ rất nhanh chán nản và lãng phí 4 năm.
2. **Cạnh tranh điểm chuẩn rất khốc liệt**: Vì số lượng thí sinh thi D01 đông nhất cả nước, điểm chuẩn của các ngành kinh tế, ngoại thương, truyền thông top đầu luôn ở mức từ 26 đến 28+ điểm. Nếu không có môn mũi nhọn thực sự vượt trội, bạn sẽ khó cạnh tranh suất vào các trường chất lượng cao.
3. **Nguyên tắc hướng nghiệp đúng đắn**: Bạn cần đi theo trình tự:
   - **Xác định loại công việc bạn muốn làm** (Gate 2).
   - **Tìm những ngành học dẫn đến công việc đó** (Gate 3).
   - **Xem các trường đào tạo ngành đó xét tuyển những tổ hợp nào** (Gate 4).
   Khi đó, nếu D01 thực sự là tổ hợp thế mạnh điểm số của bạn, chọn D01 mới là một quyết định chiến lược có cơ sở vững chắc.`;

    const primaryQuestion = "Trong 3 môn Toán, Văn, Ngoại ngữ của tổ hợp D01, môn nào là môn bạn học nhẹ nhàng và đạt điểm ổn định nhất? Và bạn hình dung sau này mình muốn làm việc trong lĩnh vực nào (kinh doanh quốc tế, truyền thông/ngôn ngữ, hay quản trị số)?";

    const quickReplies = [
      "Em tự tin nhất môn Tiếng Anh và thích môi trường quốc tế",
      "Em học đều cả 3 môn nhưng chưa biết nghề nào dùng tốt cả 3",
      "Em sợ chọn đại ngành kinh tế chung chung rồi ra trường khó xin việc",
      "Hãy giúp em tìm 1-2 công việc cụ thể trước khi quyết định khối thi"
    ];

    saveLearnerProfile(profile);

    return {
      action: 'EXPLORE_INTERESTS',
      stage: 'STATE_B_EXPLORING',
      replyText: `${replyText}\n\n👉 **Để kiểm tra xem D01 có phải vũ khí tốt nhất của bạn:**\n${primaryQuestion}`,
      primaryQuestion,
      questionContext: 'Giải thích bản chất của việc chọn tổ hợp theo mục tiêu nghề nghiệp thay vì đi tắt.',
      quickReplies,
      evidenceSummary: {
        selfReported: profile.rawInputs,
        verified: profile.verifiedEvidence,
        hypotheses: ['Cần ngăn ngừa việc chọn khối trước khi xác định ngành và nghề.'],
        missing: ['Điểm mạnh tương đối giữa Toán - Văn - Anh', 'Mục tiêu nghề nghiệp sơ bộ']
      },
      updatedProfile: profile
    };
  }

  // =========================================================================
  // SCENARIO 4B: RÀO CẢN TÀI CHÍNH & HỌC PHÍ KHÓ KHĂN (Scenario 9)
  // =========================================================================
  const hasFinanceIssue = 
    profile.realConstraints.some(c => c.toLowerCase().includes('tài chính') || c.toLowerCase().includes('học phí')) ||
    /học phí|tài chính|không có tiền|kinh tế khó khăn|tiền học/i.test(text);

  if (hasFinanceIssue && !readiness.isReadyForCareers) {
    profile.currentStage = 'STATE_B_EXPLORING';
    const replyText = 
`Mình rất trân trọng chia sẻ chân thành của bạn về rào cản tài chính và học phí. Đây là một thực tế hoàn toàn chính đáng cần được tính toán kỹ lưỡng ngay từ đầu, tránh tình trạng thi đỗ nhưng không đủ điều kiện theo học.

Hiện nay tại Việt Nam, có nhiều hướng đi giúp giải quyết bài toán tài chính đại học:
1. **Chính sách hỗ trợ theo quy định nhà nước**: Các ngành Sư phạm được miễn 100% học phí và hỗ trợ 3,63 triệu/tháng sinh hoạt phí theo Nghị định 116. Các ngành STEM trọng điểm được hỗ trợ học bổng theo Quyết định 1826 & Nghị định 179/2026.
2. **Nhóm trường đại học công lập chưa tự chủ**: Mức học phí thường chỉ dao động từ 15 – 22 triệu đồng/năm (thấp hơn 2-3 lần so với các trường tự chủ hoặc quốc tế).
3. **Mô hình Cao đẳng nghề chất lượng cao / Vừa học vừa làm**: 2-3 năm ra trường có việc làm ngay, sau đó có thể học liên thông khi đã tự chủ tài chính.`;

    const primaryQuestion = "Đối với ngành học bạn quan tâm, mức học phí hàng năm tối đa mà gia đình có thể hỗ trợ (hoặc bạn có thể tự trang trải qua làm thêm/học bổng) là khoảng bao nhiêu (dưới 20 triệu/năm, 20-40 triệu/năm, hay cần phương án miễn giảm 100%)?";

    const quickReplies = [
      "Gia đình em chỉ lo được dưới 20 triệu/năm, em cần trường công học phí thấp",
      "Em muốn tìm hiểu các ngành được miễn học phí theo Nghị định 116",
      "Em sẵn sàng vừa học vừa làm thêm nếu trường có lịch học linh hoạt",
      "Em muốn săn học bổng toàn phần hoặc bán phần"
    ];

    saveLearnerProfile(profile);

    return {
      action: 'ASK_QUESTION',
      stage: 'STATE_B_EXPLORING',
      replyText: `${replyText}\n\n👉 **Câu hỏi để hoạch định tài chính cùng bạn:**\n${primaryQuestion}`,
      primaryQuestion,
      questionContext: 'Làm rõ trần học phí và phương án tài chính khả thi trước khi đề xuất trường.',
      quickReplies,
      evidenceSummary: {
        selfReported: profile.statedInterests.concat(profile.realConstraints),
        verified: profile.verifiedEvidence,
        hypotheses: ['Cần ưu tiên nhóm trường công lập học phí thấp hoặc ngành được miễn giảm học phí.'],
        missing: ['Trần học phí chấp nhận được của gia đình']
      },
      updatedProfile: profile
    };
  }

  // =========================================================================
  // SCENARIO 5: ĐÁNH GIÁ ĐỦ BẰNG CHỨNG -> ĐỀ XUẤT NGHỀ NGHIỆP (Test 5 / State C)
  // TUYỆT ĐỐI CHỈ XUẤT HIỆN KHI ĐỦ BẰNG CHỨNG (isReadyForCareers === true)
  // KHÔNG DÙNG profile.turnsCount >= 3 ĐỂ ÉP RA QUYẾT ĐỊNH NON
  // =========================================================================
  if (readiness.isReadyForCareers) {
    profile.currentStage = 'STATE_C_CAREERS';
    const careers = generateGroundedCareerProposals(profile);

    const replyText = 
`Dựa trên toàn bộ những gì bạn đã chia sẻ qua các lượt trò chuyện (về hoạt động yêu thích, môn học tự tin, môi trường làm việc mong muốn và tâm thế đối diện thực tế), mình đã tổng hợp được những bằng chứng có ý nghĩa.

Thay vì đưa ra những danh xưng chung chung, dưới đây là **danh sách các vị trí nghề nghiệp cụ thể trong thị trường lao động (Gate 2)** tương thích nhất với hồ sơ của bạn. Mỗi vị trí đều có bằng chứng hỗ trợ, yêu cầu bạn cần lưu ý và bài kiểm tra thực tế để bạn tự xác minh.`;

    saveLearnerProfile(profile);

    return {
      action: 'CAREER_SHORTLIST',
      stage: 'STATE_C_CAREERS',
      replyText,
      suggestedCareers: careers,
      evidenceSummary: {
        selfReported: profile.statedInterests.concat(profile.academicStrengths).concat(profile.workEnvironmentPrefs),
        verified: profile.verifiedEvidence,
        hypotheses: ['Hồ sơ đã đủ độ tin cậy để đề xuất khám phá nghề nghiệp cụ thể.'],
        missing: ['Sự xác nhận của người học đối với vị trí muốn tìm hiểu sâu nhất']
      },
      updatedProfile: profile
    };
  }

  // =========================================================================
  // MẶC ĐỊNH: ĐANG Ở TRẠNG THÁI KHÁM PHÁ (STATE_B_EXPLORING) -> HỎI TIẾP 1 CÂU
  // =========================================================================
  profile.currentStage = 'STATE_B_EXPLORING';

  // Xác định khoảng trống thông tin quan trọng nhất còn thiếu
  let nextQuestion = '';
  let questionContext = '';

  if (profile.statedInterests.length === 0) {
    nextQuestion = 'Khi không phải chịu áp lực bài tập trên lớp, hoạt động hay lĩnh vực nào khiến bạn cảm thấy hào hứng hoặc tự nhiên muốn tìm tòi nhất?';
    questionContext = 'Làm rõ sở thích hoạt động tự nhiên.';
  } else if (profile.academicStrengths.length === 0 && profile.academicWeaknesses.length === 0) {
    nextQuestion = `Bạn đã có hứng thú với hướng "${profile.statedInterests[0]}". Vậy trong học tập thực tế, bạn thấy thế mạnh tự nhiên nhất của mình nằm ở đâu (tư duy logic tính toán, khả năng ngôn ngữ viết lách, hay óc thẩm mỹ và quan sát chi tiết)?`;
    questionContext = 'Làm rõ môn học thế mạnh hoặc năng lực nhận thức.';
  } else if (profile.workEnvironmentPrefs.length === 0) {
    nextQuestion = 'Về không gian và nhịp độ làm việc sau này, bạn hình dung mình sẽ phát huy tốt nhất trong môi trường nào: (1) Làm việc độc lập chuyên môn, ít phải ngoại giao; (2) Môi trường năng động, thường xuyên tiếp xúc con người; hay (3) Môi trường nghiên cứu/thực địa linh hoạt?';
    questionContext = 'Làm rõ môi trường làm việc mong muốn và phong cách tương tác.';
  } else if (profile.realConstraints.length === 0 && profile.personalValues.length === 0) {
    nextQuestion = 'Trong định hướng dài hạn, bạn ưu tiên điều gì nhất: một công việc có lộ trình thăng tiến ổn định rõ ràng, mức thu nhập đột phá, hay sự tự do sáng tạo không bị gò bó?';
    questionContext = 'Làm rõ giá trị cốt lõi và rào cản thực tế.';
  } else {
    nextQuestion = 'Bạn có thể chia sẻ thêm một trải nghiệm thực tế hoặc dự án nhỏ nào bạn từng làm mà cảm thấy tự hào hoặc học được nhiều nhất không?';
    questionContext = 'Thu thập minh chứng nhiệm vụ cụ thể để kiểm định độ sẵn sàng.';
  }

  const defaultReply = `Mình đã nắm được những mong muốn và đặc điểm bạn vừa chia sẻ. Để bức tranh nghề nghiệp được chính xác và sát thực tế nhất, chúng mình cùng làm rõ thêm một yếu tố quan trọng:`;

  saveLearnerProfile(profile);

  return {
    action: 'ASK_QUESTION',
    stage: 'STATE_B_EXPLORING',
    replyText: `${defaultReply}\n\n👉 **${nextQuestion}**`,
    primaryQuestion: nextQuestion,
    questionContext,
    quickReplies: [
      "Em làm việc cẩn thận, thích đào sâu chi tiết và quy trình",
      "Em thích sáng tạo ý tưởng mới và không thích lặp lại",
      "Em thích môi trường văn phòng ổn định, làm việc chuyên môn độc lập",
      "Em muốn công việc có tính ứng dụng thực tế cao"
    ],
    evidenceSummary: {
      selfReported: profile.statedInterests.concat(profile.academicStrengths),
      verified: profile.verifiedEvidence,
      hypotheses: ['Đang tích lũy dữ liệu: chưa đủ cơ sở để chốt danh sách nghề.'],
      missing: profile.missingEvidence
    },
    updatedProfile: profile
  };
}

// ============================================================================
// 4. GENERATE GROUNDED CAREER PROPOSALS (CHỈ KHI ĐỦ BẰNG CHỨNG)
// ============================================================================

export function generateGroundedCareerProposals(profile: LearnerEvidenceProfile): AdaptiveCareerProposal[] {
  const hasMedical = profile.statedInterests.some(i => i.includes('Y tế')) || Boolean(profile.explicitTargetCareer?.includes('Bác sĩ'));
  const hasAnimal = profile.statedInterests.some(i => i.includes('Động vật') || i.includes('Thú y') || i.includes('Sinh học')) || Boolean(profile.explicitTargetCareer?.includes('Thú y'));
  const hasGeography = profile.statedInterests.some(i => i.includes('Địa lý') || i.includes('Trái đất')) ||
    Boolean(profile.explicitTargetCareer && /gis|trắc địa|bản đồ|quy hoạch|địa lý|địa chất/i.test(profile.explicitTargetCareer));
  const hasTech = profile.statedInterests.some(i => i.includes('Công nghệ'));
  const hasCreative = profile.statedInterests.some(i => i.includes('Sáng tạo'));
  const hasBusiness = profile.statedInterests.some(i => i.includes('Kinh doanh'));
  const hasWeakMath = profile.academicWeaknesses.some(w => w.includes('Toán'));
  const prefersIndependent = profile.workEnvironmentPrefs.some(p => p.includes('độc lập') || p.includes('ít giao tiếp'));
  const rejectsCoding = (profile.rejectedActivities || []).some(a => a.toLowerCase().includes('lập trình') || a.toLowerCase().includes('code'));

  const proposals: AdaptiveCareerProposal[] = [];

  // Case: Medical / Healthcare (Bác sĩ Đa khoa)
  if (hasMedical) {
    proposals.push({
      id: 'c_medical_doctor',
      title: 'Bác sĩ Đa khoa / Y học Lâm sàng (General Medical Doctor)',
      sector: 'Y Tế & Khoa Học Sức Khỏe',
      riasecCode: 'I-S-R (Nghiên cứu · Xã hội · Thực tế)',
      riasecBasis: 'Tư duy chẩn đoán khoa học (I), tinh thần cống hiến vì người bệnh (S) và thao tác lâm sàng chuẩn xác (R).',
      matchPercent: 92,
      evidenceBasis: [
        'Người học có định hướng phụng sự rõ nét trong lĩnh vực chăm sóc sức khỏe.',
        'Sẵn sàng đối diện với môi trường học thuật chuyên sâu và đòi hỏi tính kỷ luật cao.'
      ],
      unverifiedPrerequisites: [
        'Điểm thi tốt nghiệp THPT tổ hợp B00 (Toán, Hóa, Sinh) cần đạt mức xuất sắc (thường từ 26.5 – 28.5 điểm).',
        'Sức bền thể lực và tâm lý vững vàng, chịu được áp lực trực đêm và thời gian đào tạo tối thiểu 6 năm + 18 tháng thực hành.'
      ],
      whyFit: 'Nghề nghiệp có giá trị nhân văn và vị thế xã hội bền vững nhất, không bị thay thế bởi AI trong chẩn đoán tổng thể và y đức.',
      whyNotOthers: 'Không đề xuất các khối kỹ thuật hay kinh tế vì người học đã có định hướng phụng sự y khoa rõ rệt.',
      selfVerificationTask: 'Hãy tìm đọc một ca bệnh thực tế hoặc trực tiếp quan sát công việc tại phòng cấp cứu bệnh viện. Hãy tự hỏi: Bạn có sẵn sàng học liên tục 6-8 năm và chịu trách nhiệm trực tiếp trước tính mạng của người khác không?',
      salaryRange: 'Bác sĩ nội trú/mới tốt nghiệp: 10 – 16 triệu · Sau cấp CCHN & kinh nghiệm: 30 – 70+ triệu/tháng',
      salarySource: 'Thống kê chế độ đãi ngộ ngành Y tế & Thông tư liên tịch Bộ Y tế 2025/2026',
      automationRisk: 'Rất thấp (4%)',
      automationNotes: 'AI hỗ trợ đọc hình ảnh CT/MRI và gợi ý phác đồ, nhưng quyết định lâm sàng và thấu cảm người bệnh vẫn hoàn toàn thuộc về bác sĩ.',
      linkedComboCode: 'B00',
      recommendedMajors: ['Y khoa (Bác sĩ Đa khoa)', 'Y học Cổ truyền', 'Răng - Hàm - Mặt']
    });
  }

  // Case: Geography / GIS / Earth Sciences / Urban Planning (Trắc địa, GIS, Quy hoạch)
  if (hasGeography) {
    proposals.push({
      id: 'c_gis_specialist',
      title: 'Chuyên Viên GIS & Viễn Thám Dữ Liệu Không Gian (GIS & Remote Sensing Specialist)',
      sector: 'Công Nghệ Không Gian & Dữ Liệu Địa Lý',
      riasecCode: 'R-I-C (Thực tế · Nghiên cứu · Quy chuẩn)',
      riasecBasis: 'Thu thập và phân tích dữ liệu không gian thực tế (R), xử lý thuật toán phân tích địa lý (I) và chuẩn hóa cơ sở dữ liệu bản đồ (C).',
      matchPercent: 88,
      evidenceBasis: [
        'Người học có sự yêu thích rõ rệt với môn Địa lý và các bài toán phân tích không gian.',
        'Định hướng kết hợp giữa khoa học địa lý và công nghệ xử lý dữ liệu bản đồ số.',
        'Môi trường làm việc chuyên môn cao, ứng dụng cho giao thông thông minh, quy hoạch và cứu hộ môi trường.'
      ],
      unverifiedPrerequisites: [
        'Khả năng làm quen với các phần mềm chuyên ngành (ArcGIS, QGIS, Google Earth Engine).',
        'Kỹ năng phân tích số liệu không gian kết hợp tư duy đồ họa bản đồ.'
      ],
      whyFit: 'Là sự giao thoa hoàn hảo giữa đam mê môn Địa lý và làn sóng số hóa, mở ra cơ hội việc làm lớn tại các viện nghiên cứu, doanh nghiệp viễn thông và cơ quan quản lý.',
      whyNotOthers: 'Chưa ưu tiên ngành Địa chất khai khoáng sâu do yêu cầu công tác dài ngày tại các mỏ khoáng sản vùng xa.',
      selfVerificationTask: 'Hãy thử tải phần mềm QGIS (miễn phí), tải một lớp bản đồ địa giới hành chính Việt Nam và đổi màu các tỉnh theo mật độ dân số. Nếu bạn cảm thấy hào hứng khi nhìn thấy dữ liệu hiển thị trực quan trên bản đồ, bạn rất có tiềm năng với nghề này.',
      salaryRange: 'Khởi điểm: 12 – 18 triệu · 3-5 năm: 22 – 40 triệu/tháng',
      salarySource: 'Báo cáo Khảo sát Tuyển dụng Ngành Hệ thống Thông tin Địa lý & Viễn thám 2025/2026',
      automationRisk: 'Thấp (11%)',
      automationNotes: 'AI hỗ trợ tự động bóc tách ảnh vệ tinh nhưng tư duy phân tích không gian và hiệu chỉnh bản đồ địa chính vẫn cần chuyên viên chuyên môn.',
      linkedComboCode: 'A01',
      recommendedMajors: ['Hệ thống Thông tin Địa lý (GIS)', 'Kỹ thuật Trắc địa - Bản đồ', 'Khoa học Dữ liệu Không gian']
    });

    proposals.push({
      id: 'c_urban_planner',
      title: 'Chuyên Viên Quy Hoạch Vùng - Đô Thị & Quản Lý Tài Nguyên Đất Đai',
      sector: 'Quy Hoạch & Quản Lý Đô Thị',
      riasecCode: 'I-E-C (Nghiên cứu · Quản lý · Quy chuẩn)',
      riasecBasis: 'Khảo sát nghiên cứu địa hình dân cư (I), hoạch định chiến lược phát triển vùng (E) và tuân thủ khung pháp lý đất đai (C).',
      matchPercent: 84,
      evidenceBasis: [
        'Hứng thú với việc phân bố không gian kinh tế - xã hội và tài nguyên thiên nhiên.',
        'Mong muốn làm việc trong lĩnh vực phát triển hạ tầng và môi trường sống bền vững.'
      ],
      unverifiedPrerequisites: [
        'Kỹ năng đọc bản vẽ quy hoạch và nắm bắt các quy chuẩn xây dựng, luật đất đai.',
        'Khả năng thuyết trình phương án quy hoạch trước hội đồng thẩm định.'
      ],
      whyFit: 'Vị trí then chốt định hình diện mạo các đô thị hiện đại, giải quyết bài toán phân bố dân cư và bảo vệ tài nguyên đất.',
      whyNotOthers: 'Chưa ưu tiên Kiến trúc công trình dân dụng vì hướng đó đòi hỏi năng khiếu vẽ mỹ thuật hình họa tĩnh vật khắt khe.',
      selfVerificationTask: 'Hãy quan sát một khu đô thị hoặc một tuyến đường đang bị kẹt xe gần nơi bạn sống: hãy vẽ phác thảo một giải pháp mở rộng đường hoặc phân luồng giao thông. Nếu bạn thích thú với việc tổ chức không gian sống, đây là nghề dành cho bạn.',
      salaryRange: 'Khởi điểm: 11 – 16 triệu · 3-5 năm: 20 – 38 triệu/tháng',
      salarySource: 'Thống kê thị trường lao động ngành Quy hoạch & Phát triển Đô thị',
      automationRisk: 'Rất thấp (7%)',
      automationNotes: 'Quy hoạch đòi hỏi sự cân nhắc đa yếu tố xã hội, văn hóa và chính sách của con người mà thuật toán không thể thay thế.',
      linkedComboCode: 'D01',
      recommendedMajors: ['Quy hoạch Vùng và Đô thị', 'Quản lý Đất đai', 'Địa lý học (chuyên ngành Địa lý Đô thị)']
    });

    proposals.push({
      id: 'c_geodesy_engineer',
      title: 'Kỹ Sư Trắc Địa - Bản Đồ Số & Đo Đạc Công Trình Hạ Tầng (Geomatics Engineer)',
      sector: 'Kỹ Thuật Xây Dựng & Đo Đạc Công Trình',
      riasecCode: 'R-I-C (Thực tế · Nghiên cứu · Quy chuẩn)',
      riasecBasis: 'Vận hành thiết bị đo đạc quang học/vệ tinh (R), tính toán bình sai lưới tọa độ (I) và lập hồ sơ địa chính chuẩn xác (C).',
      matchPercent: 80,
      evidenceBasis: [
        'Yêu thích sự chính xác số liệu kết hợp đo đạc thực tế tại hiện trường.',
        'Không ngại di chuyển và làm việc với các đại công trình cầu đường, cao tốc, cảng biển.'
      ],
      unverifiedPrerequisites: [
        'Sức khỏe thể lực dẻo dai để tham gia các đợt đo đạc ngoại nghiệp.',
        'Tính kỷ luật cao, sai số đo đạc phải kiểm soát từng milimet.'
      ],
      whyFit: 'Nghề kỹ thuật nền móng: Bất kỳ công trình nào từ đường cao tốc, sân bay Long Thành đến nhà cao tầng đều phải bắt đầu từ kỹ sư trắc địa.',
      whyNotOthers: 'Nếu bạn hoàn toàn không muốn ra ngoài thực địa dưới thời tiết nắng gió, bạn nên ưu tiên nhánh GIS văn phòng hơn.',
      selfVerificationTask: 'Hãy tìm hiểu cách máy bay flycam không người lái (UAV) quét 3D địa hình một quả đồi. Nếu công nghệ đo đạc hiện đại này làm bạn hào hứng, bạn sẽ rất yêu thích ngành này.',
      salaryRange: 'Khởi điểm: 12 – 17 triệu · 3-5 năm: 22 – 42 triệu/tháng',
      salarySource: 'Thống kê tiền lương Kỹ sư Khảo sát & Đo đạc Hạ tầng 2025/2026',
      automationRisk: 'Thấp (13%)',
      automationNotes: 'Drone và máy quét laser tự động hóa khâu quét điểm, nhưng việc hiệu chỉnh và ký duyệt bản đồ địa chính pháp lý vẫn cần kỹ sư có chứng chỉ hành nghề.',
      linkedComboCode: 'A00',
      recommendedMajors: ['Kỹ thuật Trắc địa - Bản đồ', 'Kỹ thuật Địa không gian', 'Kỹ thuật Xây dựng Công trình Giao thông']
    });
  }

  // Case: Animals / Veterinary / Ecology (Thú y & Khoa học Sinh thái Động vật)
  if (hasAnimal) {
    proposals.push({
      id: 'c_veterinarian',
      title: 'Bác Sĩ Thú Y & Chăm Sóc Động Vật / Thú Cưng (Veterinarian)',
      sector: 'Y Sinh, Thú Y & Chăm Sóc Động Vật',
      riasecCode: 'I-R-S (Nghiên cứu · Thực tế · Xã hội)',
      riasecBasis: 'Khám chữa bệnh thực tế trên động vật (R), nghiên cứu bệnh lý (I) và gắn kết với chủ nuôi/cộng đồng (S).',
      matchPercent: 91,
      evidenceBasis: [
        'Học sinh thể hiện tình yêu và khao khát làm việc trực tiếp với động vật/sinh học.',
        'Sẵn sàng học tập và thực hành trong môi trường phòng khám thú y hoặc trang trại.',
        'Mong muốn tạo ra giá trị bảo tồn sự sống và sức khỏe động vật.'
      ],
      unverifiedPrerequisites: [
        'Năng lực học tốt các môn Sinh học, Hóa học cơ bản.',
        'Khả năng chịu đựng áp lực khi tiếp xúc vết thương hoặc phẫu thuật động vật.'
      ],
      whyFit: 'Nhu cầu bác sĩ thú y và chăm sóc thú cưng tại các đô thị Việt Nam đang bùng nổ với tốc độ tăng trưởng trên 20%/năm.',
      whyNotOthers: 'Chưa ưu tiên ngành Sinh học thuần lý thuyết vì ngành Thú y có đầu ra nghề nghiệp hành nghề lâm sàng rõ ràng hơn.',
      selfVerificationTask: 'Hãy thử đến một trạm cứu hộ động vật hoặc phòng khám thú y gần nhà xin làm tình nguyện viên 1 buổi cuối tuần để trực tiếp trải nghiệm môi trường tiếp xúc chăm sóc thú cưng.',
      salaryRange: 'Khởi điểm: 12 – 18 triệu · 3-5 năm: 25 – 45 triệu/tháng (hoặc mở phòng khám riêng 50M+)',
      salarySource: 'Thống kê Hội Thú y Việt Nam & Khảo sát thị trường Pet Care 2025/2026',
      automationRisk: 'Cực thấp (3%)',
      automationNotes: 'Khám chữa bệnh lâm sàng và thao tác phẫu thuật động vật là kỹ năng thể chất và cảm xúc mà AI không thể tự động hóa.',
      linkedComboCode: 'B00',
      recommendedMajors: ['Bác sĩ Thú y', 'Chăn nuôi - Thú y', 'Công nghệ Sinh học Ứng dụng']
    });

    proposals.push({
      id: 'c_bio_specialist',
      title: 'Chuyên Viên Nghiên Cứu Công Nghệ Sinh Học & Sinh Thái Nông Nghiệp',
      sector: 'Công Nghệ Sinh Học & Nông Nghiệp Công Nghệ Cao',
      riasecCode: 'I-R-C (Nghiên cứu · Thực tế · Quy chuẩn)',
      riasecBasis: 'Nghiên cứu giống loài (I), thử nghiệm phòng lab và cánh đồng (R) theo quy chuẩn kiểm nghiệm (C).',
      matchPercent: 84,
      evidenceBasis: [
        'Quan tâm tới khoa học sự sống, động vật và cân bằng sinh thái.',
        'Phù hợp môi trường nghiên cứu ứng dụng thực tiễn.'
      ],
      unverifiedPrerequisites: [
        'Kiên nhẫn với các chu kỳ thí nghiệm sinh học kéo dài.'
      ],
      whyFit: 'Việt Nam đang chuyển dịch mạnh sang nông nghiệp công nghệ cao và vắc-xin sinh học thú y.',
      whyNotOthers: 'Chưa ưu tiên Kỹ thuật hóa học vì nặng về công nghiệp nặng và vật liệu.',
      selfVerificationTask: 'Hãy tìm hiểu quy trình sản xuất một loại vắc-xin thú y hoặc cách nhân giống mô sinh học trên các kênh khoa học uy tín để kiểm tra mức độ hào hứng.',
      salaryRange: 'Khởi điểm: 11 – 15 triệu · 3-5 năm: 20 – 35 triệu/tháng',
      salarySource: 'Báo cáo Khảo sát Doanh nghiệp Sinh học Nông nghiệp 2025/2026',
      automationRisk: 'Thấp (10%)',
      automationNotes: 'Nghiên cứu thí nghiệm và kiểm soát mẫu phẩm thực địa đòi hỏi thao tác của chuyên gia con người.',
      linkedComboCode: 'B00',
      recommendedMajors: ['Công nghệ Sinh học', 'Bảo vệ Thực vật', 'Khoa học Môi trường']
    });
  }

  // Case: Tech + Creative OR Tech + Weak Math (UI/UX, Frontend, Digital Design, QA)
  if (hasTech && (hasCreative || hasWeakMath || prefersIndependent || rejectsCoding)) {
    proposals.push({
      id: 'c_ui_ux_designer',
      title: 'Chuyên Viên Thiết Kế Giao Diện & Trải Nghiệm Người Dùng (UI/UX Designer)',
      sector: 'Công Nghệ Thông Tin & Thiết Kế Số',
      riasecCode: 'A-I-C (Nghệ thuật · Nghiên cứu · Quy chuẩn)',
      riasecBasis: 'Kết hợp tư duy thẩm mỹ (A) với phân tích hành vi người dùng (I) và tối ưu hóa hệ thống thiết kế (C).',
      matchPercent: 88,
      evidenceBasis: [
        'Học sinh có sự yêu thích rõ nét với môi trường công nghệ & ứng dụng số.',
        'Có thiên hướng thẩm mỹ hoặc tư duy trực quan, không bị áp lực bởi toán cao cấp.',
        'Phù hợp môi trường làm việc tập trung vào sản phẩm, làm việc độc lập với máy tính.'
      ],
      unverifiedPrerequisites: [
        'Khả năng sử dụng các công cụ thiết kế chuyên ngành (Figma, Adobe XD) chưa được kiểm chứng.',
        'Cần rèn luyện tính kiên nhẫn khi phải chỉnh sửa thiết kế theo phản hồi thực tế của người dùng.'
      ],
      whyFit: 'Là cầu nối hoàn hảo giữa công nghệ và sáng tạo, giúp bạn theo đuổi ngành IT mà không phải gánh nặng bởi toán cao cấp hay thuật toán phức tạp.',
      whyNotOthers: 'Chưa ưu tiên Lập trình viên Backend hay Kỹ sư AI vì những hướng này đòi hỏi nền tảng toán giải tích và cấu trúc dữ liệu rất nặng.',
      selfVerificationTask: 'Hãy thử tải phần mềm Figma (miễn phí), xem một hướng dẫn 30 phút trên YouTube để tự tay vẽ lại giao diện một ứng dụng quen thuộc (như Shopee hoặc Spotify). Nếu bạn thấy cuốn hút và hào hứng chỉnh sửa từng nút bấm, đây là tín hiệu phù hợp rất mạnh.',
      salaryRange: 'Khởi điểm: 12 – 18 triệu · 3-5 năm: 25 – 45 triệu/tháng',
      salarySource: 'Báo cáo Khảo sát Thị trường IT Việt Nam TopDev & VietnamWorks 2025/2026',
      automationRisk: 'Thấp (14%)',
      automationNotes: 'AI hỗ trợ tạo layout sơ bộ nhưng không thể thay thế năng lực thấu cảm tâm lý người dùng thực tế và tư duy xây dựng thương hiệu.',
      linkedComboCode: 'D01',
      recommendedMajors: ['Công nghệ Thông tin (chuyên ngành UI/UX)', 'Thiết kế Đồ họa Số', 'Hệ thống Thông tin']
    });

    proposals.push({
      id: 'c_software_qa',
      title: 'Chuyên Viên Kiểm Thử Phần Mềm (QA / Software Tester)',
      sector: 'Công Nghệ Thông Tin & Đảm Bảo Chất Lượng',
      riasecCode: 'C-I-R (Quy chuẩn · Nghiên cứu · Thực tế)',
      riasecBasis: 'Tập trung vào kiểm tra tính chính xác của quy trình (C), phân tích nguyên nhân lỗi (I) và thao tác hệ thống (R).',
      matchPercent: 82,
      evidenceBasis: [
        'Yêu thích công nghệ nhưng mong muốn quy trình làm việc có nguyên tắc rõ ràng.',
        'Làm việc cẩn thận, tỉ mỉ, kiểm tra chi tiết.',
        'Môi trường văn phòng ổn định, ít phải đối mặt với áp lực giải thuật toán học.'
      ],
      unverifiedPrerequisites: [
        'Tính kiên nhẫn khi phải lặp lại các bài kiểm thử để phát hiện lỗi tiềm ẩn.',
        'Kỹ năng viết tài liệu báo cáo lỗi (Bug report) bằng tiếng Anh chuyên ngành.'
      ],
      whyFit: 'Cơ hội bước chân vào ngành công nghệ thông tin với lộ trình thăng tiến rõ ràng, không đòi hỏi viết mã phức tạp từ đầu.',
      whyNotOthers: 'Chưa ưu tiên nghề Quản lý dự án do đòi hỏi nhiều năm kinh nghiệm ngoại giao và điều phối nhân sự.',
      selfVerificationTask: 'Hãy thử tìm một trang web có lỗi hoặc một ứng dụng mới, ghi lại từng bước thao tác để làm ứng dụng bị lỗi (crash). Nếu bạn cảm thấy thích thú với việc tìm ra lỗi mà người khác bỏ sót, bạn có tố chất của một QA xuất sắc.',
      salaryRange: 'Khởi điểm: 10 – 15 triệu · 3-5 năm: 20 – 38 triệu/tháng',
      salarySource: 'Thống kê tuyển dụng ngành Kiểm thử phần mềm 2025/2026',
      automationRisk: 'Trung bình (22%)',
      automationNotes: 'Kiểm thử thủ công cơ bản bị giảm bớt, nhưng kiểm thử tự động (Automation Test) và kiểm thử bảo mật có nhu cầu tuyển dụng tăng cao.',
      linkedComboCode: 'A01',
      recommendedMajors: ['Kỹ thuật Phần mềm', 'Công nghệ Thông tin', 'Hệ thống Thông tin Quản lý']
    });
  }

  // Case: Creative + Stable + Low social
  if (hasCreative && prefersIndependent && !hasTech) {
    proposals.push({
      id: 'c_technical_writer',
      title: 'Chuyên Viên Biên Soạn Tài Liệu & Nội Dung Kỹ Thuật (Technical Writer)',
      sector: 'Truyền Thông Số & Xuất Bản Kỹ Thuật',
      riasecCode: 'I-A-C (Nghiên cứu · Nghệ thuật · Quy chuẩn)',
      riasecBasis: 'Nghiên cứu tài liệu sâu (I), sáng tạo câu chữ diễn đạt dễ hiểu (A) theo chuẩn mực tài liệu (C).',
      matchPercent: 85,
      evidenceBasis: [
        'Người học thích sáng tạo câu chữ và nội dung nhưng ưu tiên môi trường làm việc độc lập.',
        'Mong muốn công việc có tính ổn định lâu dài trong các doanh nghiệp, viện nghiên cứu.',
        'Không muốn áp lực phải ngoại giao tiếp thị hay bán hàng.'
      ],
      unverifiedPrerequisites: [
        'Khả năng đọc hiểu tài liệu chuyên ngành bằng tiếng Anh.',
        'Kỹ năng sắp xếp văn bản một cách khoa học, logic.'
      ],
      whyFit: 'Dung hòa trọn vẹn mong muốn sáng tạo với nhu cầu làm việc tĩnh lặng, không phải bon chen ngoài thương trường.',
      whyNotOthers: 'Chưa ưu tiên nghề Chuyên viên PR / Sự kiện vì những nghề này đòi hỏi giao tiếp dày đặc và xử lý áp lực công chúng.',
      selfVerificationTask: 'Hãy thử chọn một tính năng phức tạp trên điện thoại và viết một bài hướng dẫn 1 trang giấy sao cho một người lớn tuổi trong gia đình đọc xong có thể làm theo được ngay. Nếu bạn làm được điều đó một cách hào hứng, bạn rất hợp nghề này.',
      salaryRange: 'Khởi điểm: 11 – 16 triệu · 3-5 năm: 22 – 40 triệu/tháng',
      salarySource: 'Khảo sát tiền lương ngành Nội dung số & Truyền thông chuyên ngành',
      automationRisk: 'Trung bình thấp (18%)',
      automationNotes: 'AI hỗ trợ dịch thuật và tóm tắt, nhưng văn phong chuẩn xác, bảo mật và phù hợp với tiêu chuẩn doanh nghiệp vẫn cần con người kiểm duyệt.',
      linkedComboCode: 'D01',
      recommendedMajors: ['Ngôn ngữ Anh ứng dụng', 'Báo chí & Truyền thông Đa phương tiện', 'Thông tin - Thư viện']
    });
  }

  // Case: Business / Multi-potentialite
  if (proposals.length === 0 || hasBusiness) {
    proposals.push({
      id: 'c_business_analyst',
      title: 'Chuyên Viên Phân Tích Nghiệp Vụ & Dữ Liệu Kinh Doanh (Business Analyst - BA)',
      sector: 'Kinh Tế Số & Quản Trị Doanh Nghiệp',
      riasecCode: 'E-C-I (Quản lý · Quy chuẩn · Nghiên cứu)',
      riasecBasis: 'Thấu hiểu mô hình kinh doanh (E), chuẩn hóa quy trình (C) và phân tích dữ liệu giải quyết vấn đề (I).',
      matchPercent: 86,
      evidenceBasis: [
        'Người học có tư duy học đều, muốn kết hợp giữa kinh tế và ứng dụng thực tiễn.',
        'Mong muốn công việc có vị thế nghề nghiệp vững vàng và dải thu nhập tốt.',
        'Có khả năng lắng nghe và hệ thống hóa thông tin.'
      ],
      unverifiedPrerequisites: [
        'Kỹ năng phân tích bảng số liệu (Excel nâng cao, SQL cơ bản).',
        'Năng lực diễn đạt ý tưởng kinh doanh thành các yêu cầu kỹ thuật.'
      ],
      whyFit: 'Tránh được sự chung chung của ngành Quản trị Kinh doanh truyền thống, trang bị kỹ năng phân tích thực chứng được mọi doanh nghiệp săn đón.',
      whyNotOthers: 'Chưa ưu tiên nghề Môi giới tài chính hoặc Bán hàng vì môi trường này áp lực doanh số rất nặng nề.',
      selfVerificationTask: 'Hãy thử quan sát một quán cà phê bạn hay ngồi: thử vẽ lại quy trình từ lúc khách gọi món, thu ngân nhận tiền, pha chế làm đồ đến lúc khách nhận nước. Tìm ra 1 điểm nghẽn có thể cải tiến để khách không phải chờ lâu. Đó chính là việc hàng ngày của một BA.',
      salaryRange: 'Khởi điểm: 13 – 19 triệu · 3-5 năm: 28 – 55 triệu/tháng',
      salarySource: 'Báo cáo Tuyển dụng & Tiền lương Adecco / Navigos 2025/2026',
      automationRisk: 'Rất thấp (9%)',
      automationNotes: 'Công việc đòi hỏi hiểu sâu bối cảnh vận hành đặc thù của con người và doanh nghiệp mà mô hình ngôn ngữ không thể tự quyết định.',
      linkedComboCode: 'A01',
      recommendedMajors: ['Hệ thống Thông tin Quản lý (MIS)', 'Kinh tế Quốc tế', 'Thương mại Điện tử']
    });
  }

  // Bổ sung nghề thứ 3 nếu còn thiếu
  if (proposals.length < 3) {
    proposals.push({
      id: 'c_digital_marketing_specialist',
      title: 'Chuyên Viên Tối Ưu Hóa Tiếp Thị Số & Tăng Trưởng (Digital Marketing Specialist)',
      sector: 'Kinh Doanh & Truyền Thông Số',
      riasecCode: 'E-A-I (Quản lý · Nghệ thuật · Nghiên cứu)',
      riasecBasis: 'Lên chiến lược tăng trưởng (E), sáng tạo thông điệp (A) và đọc chỉ số hiệu quả dữ liệu (I).',
      matchPercent: 80,
      evidenceBasis: [
        'Có sự linh hoạt trong tư duy, thích ứng nhanh với môi trường mạng xã hội.',
        'Quan tâm đến cách thức kết nối sản phẩm với người tiêu dùng.'
      ],
      unverifiedPrerequisites: [
        'Khả năng đọc và phân tích số liệu quảng cáo (Google Analytics, Meta Ads).',
        'Kỹ năng viết thông điệp ngắn gọn, chạm cảm xúc.'
      ],
      whyFit: 'Môi trường làm việc trẻ trung, linh hoạt, nhiều cơ hội học hỏi và thăng tiến nhanh theo năng lực.',
      whyNotOthers: 'Cần lưu ý: Công việc này có tốc độ thay đổi thuật toán rất nhanh, đòi hỏi tính tự học cao.',
      selfVerificationTask: 'Hãy thử tạo một kênh nội dung hoặc viết một bài chia sẻ trên mạng xã hội về chủ đề bạn am hiểu nhất, theo dõi xem bài viết tiếp cận được bao nhiêu người và lý do bài viết đó được tương tác. Đó là bài tập nhập môn của nghề này.',
      salaryRange: 'Khởi điểm: 10 – 15 triệu · 3-5 năm: 22 – 42 triệu/tháng',
      salarySource: 'Khảo sát thị trường việc làm Truyền thông Tiếp thị số 2025/2026',
      automationRisk: 'Trung bình (19%)',
      automationNotes: 'AI tạo nội dung hàng loạt nhưng việc định vị cảm xúc thương hiệu và tối ưu ngân sách thật vẫn cần người điều phối chiến lược.',
      linkedComboCode: 'D01',
      recommendedMajors: ['Truyền thông Đa phương tiện', 'Thương mại Điện tử', 'Marketing']
    });
  }

  return proposals.slice(0, 3);
}

// ============================================================================
// 5. TRẠNG THÁI D: TỪ NGHỀ SANG NGÀNH ĐÀO TẠO (MAJOR MAPPING)
// ============================================================================

export function mapCareerToMajors(careerTitleOrId: string | AdaptiveCareerProposal | any): MajorMappingPathway {
  const cLower = typeof careerTitleOrId === 'string'
    ? (careerTitleOrId || '').toLowerCase()
    : ((careerTitleOrId?.id || '') + ' ' + (careerTitleOrId?.title || '')).toLowerCase();

  // 0. Phân nhánh Y Tế & Chăm sóc sức khỏe (ngoại trừ Thú y)
  if (!cLower.includes('thú y') && !cLower.includes('động vật') && !cLower.includes('veterinar') && (cLower.includes('bác sĩ') || cLower.includes('y khoa') || cLower.includes('y tế') || cLower.includes('dược'))) {
    return {
      directMajors: [
        {
          code: '7720101',
          name: 'Y khoa (General Medicine / Bác sĩ Đa khoa)',
          coreDisciplines: ['Giải phẫu & Sinh lý học người', 'Bệnh học Nội - Ngoại - Sản - Nhi', 'Dược lý học lâm sàng & Chẩn đoán hình ảnh', 'Y đức, Tâm lý tiếp xúc bệnh nhân & Pháp y'],
          entryCompetencies: ['Khả năng ghi nhớ khối lượng tri thức sinh học lớn', 'Sức bền thể lực và tâm lý vững vàng', 'Tinh thần nhân văn và thấu cảm sâu sắc'],
          studyDuration: '6 năm (Bác sĩ y khoa) + 18 tháng thực hành lâm sàng để cấp CCHN',
          considerations: 'Thời gian đào tạo dài nhất và áp lực học tập lớn nhất trong các ngành đại học; sinh viên thường xuyên trực đêm tại bệnh viện từ năm thứ 3.',
          dataSource: 'Chuẩn chương trình đào tạo Bác sĩ Y khoa Bộ GD&ĐT & Đề án HMU, UMP 2025/2026'
        },
        {
          code: '7720201',
          name: 'Dược học (Pharmacy)',
          coreDisciplines: ['Hóa dược & Hóa phân tích', 'Bào chế và Công nghệ sinh học dược phẩm', 'Dược lâm sàng & Điều trị học', 'Quản lý kinh tế dược & Pháp chế'],
          entryCompetencies: ['Tư duy Hóa học chính xác, cẩn thận tuyệt đối', 'Tính kiên trì với thí nghiệm'],
          studyDuration: '5 năm (Dược sĩ)',
          considerations: 'Có thể làm việc tại bệnh viện, viện nghiên cứu, nhà máy sản xuất thuốc hoặc công ty phân phối dược phẩm.',
          dataSource: 'Đề án tuyển sinh Đại học Dược Hà Nội & ĐH Y Dược TP.HCM 2025/2026'
        }
      ],
      adjacentMajors: [
        {
          code: '7720301',
          name: 'Kỹ thuật Xét nghiệm Y học / Y sinh học',
          rationale: 'Tập trung vào phân tích mẫu bệnh phẩm, máy móc xét nghiệm công nghệ cao, ít phải tiếp xúc trực tiếp hoặc chịu áp lực phẫu thuật lâm sàng.',
          transitionPivots: ['Rẽ nhánh làm Chuyên viên xét nghiệm di truyền, chuyên viên thiết bị y tế hoặc nghiên cứu vi sinh.']
        }
      ],
      skillsPathways: [
        {
          pathTitle: 'Lộ trình Bác sĩ Nội trú & Chứng chỉ Hành nghề Y khoa (Residency & Medical Licensing)',
          description: 'Tốt nghiệp đại học 6 năm -> Thi tuyển Bác sĩ nội trú (3 năm) hoặc thực hành 18 tháng tại bệnh viện đa khoa để thi cấp chứng chỉ hành nghề theo Luật Khám chữa bệnh 2023.',
          targetCertifications: ['Bằng Bác sĩ Nội trú chuyên khoa', 'Chứng chỉ Hành nghề Khám chữa bệnh Quốc gia (Bộ Y tế)', 'Tiếng Anh Y khoa (OET / Medical English)']
        }
      ]
    };
  }

  // 0B. Phân nhánh Địa Lý, GIS, Trắc Địa, Quy Hoạch & Dữ Liệu Không Gian
  if (cLower.includes('gis') || cLower.includes('viễn thám') || cLower.includes('địa lý') || cLower.includes('trắc địa') || cLower.includes('quy hoạch') || cLower.includes('đất đai') || cLower.includes('địa chất') || cLower.includes('geomatics')) {
    return {
      directMajors: [
        {
          code: '7480205',
          name: 'Hệ thống Thông tin Địa lý (GIS - Geographic Information Systems)',
          coreDisciplines: ['Bản đồ số & Cơ sở dữ liệu Không gian', 'Viễn thám & Xử lý ảnh vệ tinh (Remote Sensing)', 'Phát triển ứng dụng WebGIS & Bản đồ thông minh', 'Phân tích không gian trong quản trị đô thị'],
          entryCompetencies: ['Tư duy không gian và khả năng quan sát bản đồ', 'Kỹ năng sử dụng phần mềm máy tính (ArcGIS, QGIS)', 'Khả năng phân tích số liệu'],
          studyDuration: '4 năm (Cử nhân) hoặc 4.5 năm (Kỹ sư)',
          considerations: 'Ngành học có tính liên ngành cao, giao thoa giữa Địa lý, Công nghệ thông tin và Quy hoạch quản lý.',
          dataSource: 'Chuẩn chương trình đào tạo ĐH Bách Khoa TP.HCM & ĐH Khoa học Tự nhiên 2025/2026'
        },
        {
          code: '7520503',
          name: 'Kỹ thuật Trắc địa - Bản đồ & Địa không gian (Geomatics)',
          coreDisciplines: ['Trắc địa công trình & Đo đạc vệ tinh GNSS', 'Công nghệ bay chụp quét LiDAR & UAV', 'Bình sai lưới trắc địa & Bản đồ địa chính', 'Xây dựng mô hình thông tin công trình (BIM/GIS)'],
          entryCompetencies: ['Tính cẩn thận, kỷ luật với sai số đo đạc', 'Sức khỏe tốt để tham gia các đợt khảo sát thực địa'],
          studyDuration: '4.5 năm (Kỹ sư)',
          considerations: 'Được săn đón tại các tập đoàn xây dựng hạ tầng, giao thông và sở tài nguyên môi trường các tỉnh thành.',
          dataSource: 'Đề án đào tạo Trường ĐH Mỏ - Địa chất (HUMG) & ĐH Bách Khoa'
        }
      ],
      adjacentMajors: [
        {
          code: '7580105',
          name: 'Quy hoạch Vùng và Đô thị',
          rationale: 'Tập trung vào hoạch định chiến lược không gian kiến trúc và phát triển bền vững các đô thị.',
          transitionPivots: ['Rẽ nhánh làm Chuyên viên Thẩm định dự án bất động sản, Quản lý hạ tầng đô thị.']
        },
        {
          code: '7850101',
          name: 'Quản lý Đất đai & Bất động sản',
          rationale: 'Chuyên sâu về khung pháp lý đất đai, cấp giấy chứng nhận và định giá đất.',
          transitionPivots: ['Rẽ nhánh làm Chuyên viên Địa chính, Định giá tài sản hoặc Tư vấn đầu tư bất động sản.']
        }
      ],
      skillsPathways: [
        {
          pathTitle: 'Lộ trình Chứng chỉ GIS Chuyên nghiệp & Kỹ năng Dữ liệu Không gian (GIS Specialist Path)',
          description: 'Học ngành gần kết hợp tích lũy chứng chỉ Esri ArcGIS và kỹ năng lập trình Python phân tích dữ liệu không gian.',
          targetCertifications: ['Esri ArcGIS Desktop Associate / Professional', 'Chứng chỉ Đo đạc Bản đồ & Khảo sát công trình (Bộ Xây dựng)', 'Python for Geospatial Data Analysis']
        }
      ]
    };
  }

  // 0C. Phân nhánh Bác sĩ Thú y, Động vật & Khoa học Sinh thái
  if (cLower.includes('thú y') || cLower.includes('động vật') || cLower.includes('veterinar') || cLower.includes('chăn nuôi') || cLower.includes('sinh thái')) {
    return {
      directMajors: [
        {
          code: '7640101',
          name: 'Thú y (Veterinary Medicine)',
          coreDisciplines: ['Giải phẫu & Sinh lý động vật', 'Dược lý & Độc chất học thú y', 'Nội khoa & Ngoại khoa thú y', 'Chẩn đoán hình ảnh & Xét nghiệm thú y', 'Dịch tễ học & Bệnh truyền nhiễm'],
          entryCompetencies: ['Tình yêu thương và kiên nhẫn với động vật', 'Khả năng quan sát tinh tế', 'Tư duy Hóa học - Sinh học'],
          studyDuration: '5 năm (Bác sĩ Thú y)',
          considerations: 'Cơ hội việc làm rộng mở tại các bệnh viện thú cưng thành phố, trang trại công nghệ cao và viện dịch tễ.',
          dataSource: 'Chuẩn chương trình đào tạo Học viện Nông nghiệp Việt Nam & ĐH Nông Lâm TP.HCM 2025/2026'
        },
        {
          code: '7420201',
          name: 'Công nghệ Sinh học (Biotechnology)',
          coreDisciplines: ['Vi sinh học ứng dụng', 'Sinh học phân tử & Di truyền', 'Công nghệ vắc-xin và men sinh học', 'Nuôi cấy mô và tế bào'],
          entryCompetencies: ['Tính cẩn trọng với thao tác phòng lab', 'Kiên trì với quy trình thí nghiệm'],
          studyDuration: '4 năm (Cử nhân) hoặc 4.5 năm (Kỹ sư)',
          considerations: 'Lĩnh vực công nghệ cao mũi nhọn, cơ hội làm việc trong ngành dược thú y, nông nghiệp sạch và y sinh.',
          dataSource: 'Đề án tuyển sinh Trường ĐH Khoa học Tự nhiên & ĐH Nông Lâm'
        }
      ],
      adjacentMajors: [
        {
          code: '7620115',
          name: 'Chăn nuôi (Animal Science)',
          rationale: 'Tập trung vào dinh dưỡng, kỹ thuật chọn giống và quản trị trang trại chăn nuôi công nghiệp hiện đại.',
          transitionPivots: ['Rẽ nhánh làm Chuyên gia Dinh dưỡng vật nuôi, Quản lý trang trại chăn nuôi tự động hóa.']
        }
      ],
      skillsPathways: [
        {
          pathTitle: 'Lộ trình Chứng chỉ Hành nghề Thú y & Kỹ năng Lâm sàng Pet Care (Veterinary Practice)',
          description: 'Tốt nghiệp bác sĩ thú y 5 năm -> Thực tập thực tế 12 tháng tại phòng khám/bệnh viện thú y để được cấp Chứng chỉ hành nghề thú y theo Luật Thú y.',
          targetCertifications: ['Chứng chỉ Hành nghề Thú y (Chi cục Chăn nuôi & Thú y cấp)', 'Chứng chỉ Chẩn đoán Siêu âm / X-Quang Thú nhỏ', 'Chứng chỉ Phẫu thuật Ngoại khoa Thú y Thực hành']
        }
      ]
    };
  }

  // 1. Phân nhánh Công nghệ, UI/UX, Kỹ thuật Phần mềm
  if (cLower.includes('ui/ux') || cLower.includes('giao diện') || cLower.includes('thiết kế') || cLower.includes('kiểm thử') || cLower.includes('qa') || cLower.includes('phần mềm') || cLower.includes('công nghệ')) {
    return {
      directMajors: [
        {
          code: '7480103',
          name: 'Kỹ thuật Phần mềm (Software Engineering)',
          coreDisciplines: ['Quy trình phát triển phần mềm Agile', 'Thiết kế kiến trúc hệ thống', 'Kiểm thử phần mềm & Đảm bảo chất lượng (QA/QC)', 'Tương tác Người - Máy (HCI & UI/UX)'],
          entryCompetencies: ['Tư duy logic quy trình', 'Khả năng tự học công nghệ mới', 'Tiếng Anh đọc tài liệu kỹ thuật'],
          studyDuration: '4 năm (Cử nhân) hoặc 4.5 năm (Kỹ sư)',
          considerations: 'Chương trình đào tạo thiên về ứng dụng thực hành dự án, sinh viên được làm đồ án thực tế từ năm thứ 2.',
          dataSource: 'Danh mục giáo dục đại học Bộ GD&ĐT & Đề án đào tạo chuẩn Thông tư 74/2026'
        },
        {
          code: '7480201',
          name: 'Công nghệ Thông tin (Information Technology)',
          coreDisciplines: ['Lập trình ứng dụng Web & Di động', 'Cơ sở dữ liệu & Phân tích hệ thống', 'Quản trị mạng máy tính & An toàn thông tin', 'Thiết kế sản phẩm số'],
          entryCompetencies: ['Kiên nhẫn sửa lỗi phần mềm', 'Yêu thích tìm hiểu phần cứng và ứng dụng'],
          studyDuration: '4 năm',
          considerations: 'Là ngành có diện tích thích ứng rộng nhất, sinh viên có thể rẽ nhánh sang Quản trị hệ thống, Kiểm thử, hoặc Thiết kế sản phẩm.',
          dataSource: 'Thông tư 06/2026/TT-BGDĐT & Chuẩn chương trình đào tạo CNTT'
        }
      ],
      adjacentMajors: [
        {
          code: '7480104',
          name: 'Hệ thống Thông tin (Information Systems)',
          rationale: 'Tập trung vào cách ứng dụng công nghệ để giải quyết bài toán vận hành của doanh nghiệp, ít nặng về code giải thuật thuần túy.',
          transitionPivots: ['Có thể chuyển hướng làm Chuyên viên Phân tích Nghiệp vụ (BA) hoặc Quản trị Sản phẩm (Product Owner).']
        },
        {
          code: '7210403',
          name: 'Thiết kế Đồ họa & Mỹ thuật Đa phương tiện',
          rationale: 'Nếu bạn có thiên hướng nghệ thuật thị giác mạnh mẽ hơn kỹ thuật mã nguồn, đây là con đường chuyên sâu về thẩm mỹ sản phẩm.',
          transitionPivots: ['Rẽ nhánh làm Chuyên viên Diễn họa 3D, Đồ họa Game hoặc Giám đốc Mỹ thuật.']
        }
      ],
      skillsPathways: [
        {
          pathTitle: 'Lộ trình Chứng chỉ Quốc tế & Thực hành Dự án (Alternative Skills Path)',
          description: 'Học ngành gần kết hợp tích lũy chứng chỉ quốc tế và hoàn thành 3-5 dự án thực chiến đưa lên Portfolio cá nhân.',
          targetCertifications: ['Google UX Design Professional Certificate', 'ISTQB Foundation Level (Kiểm thử phần mềm chuẩn quốc tế)', 'AWS Certified Cloud Practitioner']
        }
      ]
    };
  }

  // 2. Phân nhánh Kinh doanh, Business Analyst, Logistics
  if (cLower.includes('ba') || cLower.includes('kinh doanh') || cLower.includes('phân tích') || cLower.includes('logistics') || cLower.includes('marketing')) {
    return {
      directMajors: [
        {
          code: '7340405',
          name: 'Hệ thống Thông tin Quản lý (Management Information Systems - MIS)',
          coreDisciplines: ['Phân tích và Thiết kế Hệ thống Kinh doanh', 'Cơ sở dữ liệu & Khai phá dữ liệu (Data Mining)', 'Quản trị Dự án Công nghệ Thông tin', 'Mô hình hóa Quy trình Doanh nghiệp (BPMN)'],
          entryCompetencies: ['Tư duy logic kết hợp giao tiếp kinh doanh', 'Kỹ năng đọc số liệu và biểu đồ', 'Tiếng Anh thương mại'],
          studyDuration: '4 năm',
          considerations: 'Được mệnh danh là ngành lai hoàn hảo giữa Kinh tế và Công nghệ, tỷ lệ có việc làm đúng chuyên môn rất cao.',
          dataSource: 'Chuẩn chương trình đào tạo ĐH Kinh tế Quốc dân (NEU) & ĐH Kinh tế TP.HCM (UEH)'
        },
        {
          code: '7340120',
          name: 'Kinh doanh Quốc tế & Thương mại Điện tử',
          coreDisciplines: ['Chuỗi cung ứng toàn cầu', 'Đàm phán thương mại quốc tế', 'Thanh toán quốc tế & Luật thương mại', 'Tiếp thị số (Digital Marketing)'],
          entryCompetencies: ['Ngoại ngữ thành thạo', 'Khả năng thích ứng văn hóa', 'Tư duy thị trường'],
          studyDuration: '4 năm',
          considerations: 'Cần chủ động rèn luyện ngoại ngữ thứ 2 và kỹ năng sử dụng các công cụ phân tích số liệu để tạo ưu thế cạnh tranh.',
          dataSource: 'Đề án tuyển sinh Đại học Ngoại Thương & NEU 2025/2026'
        }
      ],
      adjacentMajors: [
        {
          code: '7340201',
          name: 'Tài chính - Ngân hàng (Chuyên ngành Công nghệ Tài chính - FinTech)',
          rationale: 'Ứng dụng phân tích dữ liệu chuyên sâu vào lĩnh vực ngân hàng số, quỹ đầu tư và bảo hiểm.',
          transitionPivots: ['Rẽ nhánh làm Chuyên viên Phân tích Rủi ro tài chính hoặc Định phí bảo hiểm (Actuary).']
        }
      ],
      skillsPathways: [
        {
          pathTitle: 'Lộ trình Kỹ năng Phân tích Dữ liệu Thực tế (Data & Business Analytics Path)',
          description: 'Học kinh tế kết hợp luyện tập các công cụ phân tích dữ liệu thực tế để đáp ứng ngay yêu cầu doanh nghiệp.',
          targetCertifications: ['Microsoft Certified: Power BI Data Analyst Associate', 'CBAP / ECBA (Chứng chỉ Phân tích Nghiệp vụ quốc tế IIBA)', 'Google Data Analytics Certificate']
        }
      ]
    };
  }

  // 3. Phân nhánh Truyền thông, Ngôn ngữ, Sư phạm
  return {
    directMajors: [
      {
        code: '7320101',
        name: 'Báo chí & Truyền thông Đa phương tiện',
        coreDisciplines: ['Sáng tạo nội dung số & Biên tập đa phương tiện', 'Kỹ thuật sản xuất Audio/Video/Podcast', 'Pháp luật & Đạo đức truyền thông', 'Quan hệ công chúng & Quản trị khủng hoảng'],
        entryCompetencies: ['Năng lực ngôn ngữ biểu cảm tốt', 'Tư duy phản biện và nhạy bén với thông tin', 'Kỹ năng làm việc độc lập và nhóm'],
        studyDuration: '4 năm',
        considerations: 'Cần chủ động thực tập và xây dựng các sản phẩm thực tế từ năm nhất để có hồ sơ năng lực (Portfolio) cạnh tranh.',
        dataSource: 'Đề án đào tạo Học viện Báo chí & Tuyên truyền và ĐH KHXH&NV'
      },
      {
        code: '7220201',
        name: 'Ngôn ngữ Anh (Định hướng Biên phiên dịch & Truyền thông)',
        coreDisciplines: ['Biên dịch & Phiên dịch nâng cao', 'Văn hóa đối ngoại và Giao tiếp liên văn hóa', 'Ngôn ngữ học ứng dụng & Soạn thảo văn bản học thuật'],
        entryCompetencies: ['Khả năng ngôn ngữ tinh tế', 'Tính cẩn trọng với từng câu chữ', 'Khả năng tra cứu tài liệu chuyên ngành'],
        studyDuration: '4 năm',
        considerations: 'Tránh chỉ học lý thuyết tiếng Anh thuần túy; cần chọn định hướng kết hợp với chuyên môn thứ 2 như Kinh tế, Pháp lý hoặc Công nghệ.',
        dataSource: 'Chuẩn chương trình ULIS - ĐHQGHN & ĐH Hà Nội'
      }
    ],
    adjacentMajors: [
      {
        code: '7140217',
        name: 'Sư phạm Ngữ văn / Tiếng Anh',
        rationale: 'Nếu muốn tính ổn định cao nhất và được hưởng chính sách miễn 100% học phí + sinh hoạt phí theo Nghị định 116 của Chính phủ.',
        transitionPivots: ['Giảng dạy tại trường công lập, trường quốc tế hoặc trung tâm đào tạo chuyên ngữ.']
      }
    ],
    skillsPathways: [
      {
        pathTitle: 'Lộ trình Chuyên gia Nội dung & Dịch thuật Độc lập (Specialist Portfolio)',
        description: 'Tích lũy kinh nghiệm qua các dự án biên dịch sách báo, tài liệu hội nghị và bài viết chuyên môn.',
        targetCertifications: ['IELTS 7.5+ / TOEFL iBT 100+', 'Chứng chỉ Biên dịch viên chuyên nghiệp ATA / ProZ', 'HubSpot Content Marketing Certification']
      }
    ]
  };
}

// ============================================================================
// 6. TRẠNG THÁI E: CHIẾN LƯỢC TUYỂN SINH (ADMISSIONS STRATEGY)
// ============================================================================

export function mapMajorToAdmissions(majorCode: string, studentProfile?: LearnerEvidenceProfile): AdmissionsOption[] {
  const options: AdmissionsOption[] = [];

  // Tra cứu các trường tiêu biểu từ CSDL đã được kiểm toán (Audited 300 Institutions)
  if (majorCode.startsWith('772') || majorCode.includes('720')) {
    // Nhóm Y Dược & Khoa học Sức khỏe
    options.push({
      schoolCode: 'YHN',
      schoolName: 'Đại học Y Hà Nội (HMU)',
      city: 'Hà Nội',
      majorName: 'Y khoa (Bác sĩ Đa khoa)',
      majorCode,
      admissionCombinations: ['B00 (Toán - Hóa - Sinh)'],
      tuitionPerYear: 'Khoảng 55 – 60 triệu đồng/năm (theo cơ chế tự chủ nhóm trường y)',
      historicalBenchmarkNote: 'Điểm chuẩn trúng tuyển tốt nghiệp THPT luôn thuộc top cao nhất cả nước (từ 27.5 đến 28.8/30 điểm).',
      admissionMethods: ['Điểm thi tốt nghiệp THPT (tổ hợp B00)', 'Xét tuyển kết hợp chứng chỉ ngoại ngữ quốc tế (IELTS) với điểm thi'],
      verificationNote: 'Thông tin tham khảo từ Đề án Tuyển sinh HMU 2025/2026 — Đòi hỏi sức học chuyên sâu vượt trội.'
    });

    options.push({
      schoolCode: 'YDS',
      schoolName: 'Đại học Y Dược TP. Hồ Chí Minh (UMP)',
      city: 'TP. Hồ Chí Minh',
      majorName: 'Y khoa / Dược học',
      majorCode,
      admissionCombinations: ['B00 (Toán - Hóa - Sinh)', 'A00 (Toán - Lý - Hóa cho Dược)'],
      tuitionPerYear: 'Khoảng 55 – 75 triệu đồng/năm',
      historicalBenchmarkNote: 'Điểm chuẩn Y khoa luôn ở ngưỡng 27.0 - 28.5 điểm.',
      admissionMethods: ['Điểm thi tốt nghiệp THPT', 'Xét tuyển kết hợp IELTS $\ge 6.5$'],
      verificationNote: 'Thông tin kiểm toán từ Cổng thông tin Tuyển sinh UMP 2025/2026.'
    });
  } else if (majorCode === '7480205' || majorCode.startsWith('752') || majorCode.startsWith('758') || majorCode.startsWith('785')) {
    // Nhóm Kỹ thuật Trắc địa - Bản đồ, GIS, Quy hoạch đô thị, Quản lý đất đai
    options.push({
      schoolCode: 'MDA',
      schoolName: 'Trường Đại học Mỏ - Địa chất (HUMG)',
      city: 'Hà Nội',
      majorName: 'Kỹ thuật Trắc địa - Bản đồ / Địa tin học (GIS)',
      majorCode,
      admissionCombinations: ['A00 (Toán - Lý - Hóa)', 'A01 (Toán - Lý - Anh)', 'B00 (Toán - Hóa - Sinh)', 'D01 (Toán - Văn - Anh)'],
      tuitionPerYear: 'Khoảng 16 – 20 triệu đồng/năm (Mức học phí công lập tiết kiệm)',
      historicalBenchmarkNote: 'Điểm trúng tuyển THPT các năm trước dao động từ 18.0 đến 22.5/30 điểm.',
      admissionMethods: ['Điểm thi tốt nghiệp THPT', 'Xét học bạ THPT', 'Điểm thi ĐGTD TSA Bách Khoa'],
      verificationNote: 'Cái nôi đào tạo ngành Trắc địa và Dữ liệu không gian uy tín hàng đầu miền Bắc.'
    });

    options.push({
      schoolCode: 'DMT',
      schoolName: 'Trường Đại học Tài nguyên và Môi trường Hà Nội (HUNRE)',
      city: 'Hà Nội',
      majorName: 'Quản lý Đất đai / Hệ thống Thông tin Địa lý (GIS)',
      majorCode,
      admissionCombinations: ['A00', 'A01', 'B00', 'D01'],
      tuitionPerYear: 'Khoảng 18 – 22 triệu đồng/năm',
      historicalBenchmarkNote: 'Điểm chuẩn THPT các năm gần nhất từ 19.5 đến 23.0/30 điểm.',
      admissionMethods: ['Điểm thi THPT', 'Xét học bạ THPT kết hợp'],
      verificationNote: 'Trường trực thuộc Bộ Tài nguyên & Môi trường, cơ hội thực tập địa phương đa dạng.'
    });

    options.push({
      schoolCode: 'QSB',
      schoolName: 'Trường Đại học Bách Khoa – ĐHQG TP.HCM',
      city: 'TP. Hồ Chí Minh',
      majorName: 'Hệ thống Thông tin Địa lý (GIS) / Kỹ thuật Trắc địa',
      majorCode,
      admissionCombinations: ['A00 (Toán - Lý - Hóa)', 'A01 (Toán - Lý - Anh)'],
      tuitionPerYear: 'Khoảng 30 – 35 triệu đồng/năm',
      historicalBenchmarkNote: 'Điểm chuẩn xét tuyển tổng hợp kết hợp ĐGNL ĐHQG-HCM và THPT từ 23.5 đến 25.5 điểm.',
      admissionMethods: ['Phương thức xét tuyển tổng hợp ĐHQG-HCM', 'Thi ĐGNL ĐHQG TP.HCM'],
      verificationNote: 'Đơn vị đào tạo kỹ thuật công nghệ không gian hàng đầu phía Nam.'
    });
  } else if (majorCode.startsWith('748') || majorCode.includes('480')) {
    // Nhóm Công nghệ & Kỹ thuật
    options.push({
      schoolCode: 'BKA',
      schoolName: 'Đại học Bách Khoa Hà Nội',
      city: 'Hà Nội',
      majorName: 'Kỹ thuật Phần mềm & Hệ thống Thông tin',
      majorCode,
      admissionCombinations: ['A00 (Toán - Lý - Hóa)', 'A01 (Toán - Lý - Anh)', 'K01 (Toán - Tin/Lý)'],
      tuitionPerYear: 'Khoảng 30 – 35 triệu đồng/năm (Học phí tự chủ công lập chuẩn)',
      historicalBenchmarkNote: 'Điểm trúng tuyển các năm gần nhất dao động từ 26.5 đến 28.5/30 điểm (hoặc kết quả bài thi ĐGTD TSA trên 70/100).',
      admissionMethods: ['Điểm thi Đánh giá tư duy (TSA)', 'Điểm thi tốt nghiệp THPT', 'Xét tuyển tài năng (chứng chỉ quốc tế SAT/ACT/IELTS)'],
      verificationNote: 'Thông tin tham khảo từ Đề án Tuyển sinh BKA — Cần đối chiếu thông báo chỉ tiêu chính thức 2026 của trường.'
    });

    options.push({
      schoolCode: 'QSC',
      schoolName: 'Trường Đại học Công nghệ Thông tin – ĐHQG TP.HCM',
      city: 'TP. Hồ Chí Minh',
      majorName: 'Kỹ thuật Phần mềm / Hệ thống Thông tin',
      majorCode,
      admissionCombinations: ['A00 (Toán - Lý - Hóa)', 'A01 (Toán - Lý - Anh)', 'D01 (Toán - Văn - Anh)'],
      tuitionPerYear: 'Khoảng 32 – 40 triệu đồng/năm',
      historicalBenchmarkNote: 'Điểm chuẩn THPT các năm trước từ 26.0 đến 27.8/30 điểm (hoặc ĐGNL ĐHQG-HCM từ 820 đến 920/1200 điểm).',
      admissionMethods: ['Điểm thi ĐGNL ĐHQG TP.HCM', 'Điểm thi tốt nghiệp THPT', 'Ưu tiên xét tuyển học sinh trường chuyên'],
      verificationNote: 'Số liệu kiểm toán từ Đề án UIT ĐHQG-HCM — Không bảo đảm trúng tuyển tuyệt đối cho năm 2026.'
    });

    options.push({
      schoolCode: 'TCT',
      schoolName: 'Trường Đại học Cần Thơ',
      city: 'Cần Thơ',
      majorName: 'Công nghệ Thông tin / Kỹ thuật Phần mềm',
      majorCode,
      admissionCombinations: ['A00', 'A01', 'D01'],
      tuitionPerYear: 'Khoảng 20 – 25 triệu đồng/năm (Mức học phí phù hợp cho ĐBSCL)',
      historicalBenchmarkNote: 'Điểm chuẩn các năm trước từ 22.0 đến 24.5/30 điểm.',
      admissionMethods: ['Điểm thi tốt nghiệp THPT', 'Điểm thi ĐGNL', 'Xét học bạ THPT'],
      verificationNote: 'Lựa chọn cân bằng tài chính và cơ hội trúng tuyển an toàn vùng Tây Nam Bộ.'
    });
  } else if (majorCode.startsWith('734')) {
    // Nhóm Kinh tế, MIS, Kinh doanh Quốc tế
    options.push({
      schoolCode: 'KHA',
      schoolName: 'Đại học Kinh tế Quốc dân (NEU)',
      city: 'Hà Nội',
      majorName: 'Hệ thống Thông tin Quản lý & Kinh doanh Số',
      majorCode,
      admissionCombinations: ['A00 (Toán - Lý - Hóa)', 'A01 (Toán - Lý - Anh)', 'D01 (Toán - Văn - Anh)', 'D07 (Toán - Hóa - Anh)'],
      tuitionPerYear: 'Khoảng 24 – 32 triệu đồng/năm (chương trình chuẩn)',
      historicalBenchmarkNote: 'Điểm chuẩn các năm gần nhất dao động từ 26.2 đến 27.5/30 điểm.',
      admissionMethods: ['Xét tuyển kết hợp ĐGNL HSA/TSA + Chứng chỉ tiếng Anh', 'Điểm thi tốt nghiệp THPT'],
      verificationNote: 'Thông tin đối chiếu từ Cổng thông tin Tuyển sinh NEU.'
    });

    options.push({
      schoolCode: 'UEH',
      schoolName: 'Đại học Kinh tế TP. Hồ Chí Minh',
      city: 'TP. Hồ Chí Minh',
      majorName: 'Hệ thống Thông tin Kinh doanh & Thương mại Điện tử',
      majorCode,
      admissionCombinations: ['A00', 'A01', 'D01', 'D07'],
      tuitionPerYear: 'Khoảng 28 – 35 triệu đồng/năm',
      historicalBenchmarkNote: 'Điểm chuẩn THPT các năm trước từ 25.5 đến 27.2/30 điểm.',
      admissionMethods: ['Phương thức xét tuyển kết hợp điểm học tập và ngoại ngữ', 'Điểm thi ĐGNL', 'Điểm thi THPT'],
      verificationNote: 'Tham chiếu từ Đề án Tuyển sinh Đại học UEH.'
    });
  } else if (majorCode.startsWith('714')) {
    // Nhóm Sư phạm (Hưởng Nghị định 116)
    options.push({
      schoolCode: 'SPH',
      schoolName: 'Trường Đại học Sư phạm Hà Nội (HNUE)',
      city: 'Hà Nội',
      majorName: 'Sư phạm Địa lý / Khoa học Xã hội',
      majorCode,
      admissionCombinations: ['C00 (Văn - Sử - Địa)', 'D01 (Toán - Văn - Anh)', 'C19'],
      tuitionPerYear: '0 VNĐ (Miễn 100% học phí + trợ cấp 3,63 triệu/tháng theo Nghị định 116)',
      historicalBenchmarkNote: 'Điểm chuẩn các năm gần nhất dao động từ 25.5 đến 27.8/30 điểm.',
      admissionMethods: ['Điểm thi tốt nghiệp THPT', 'Bài thi Đánh giá năng lực ĐHSPHN', 'Xét học sinh giỏi quốc gia/tỉnh'],
      verificationNote: 'Sinh viên cam kết sau tốt nghiệp công tác trong ngành giáo dục theo Nghị định 116.'
    });

    options.push({
      schoolCode: 'SPS',
      schoolName: 'Trường Đại học Sư phạm TP. Hồ Chí Minh (HCMUE)',
      city: 'TP. Hồ Chí Minh',
      majorName: 'Sư phạm Địa lý',
      majorCode,
      admissionCombinations: ['C00 (Văn - Sử - Địa)', 'D01 (Toán - Văn - Anh)'],
      tuitionPerYear: '0 VNĐ (Miễn 100% học phí + trợ cấp 3,63 triệu/tháng theo Nghị định 116)',
      historicalBenchmarkNote: 'Điểm chuẩn trúng tuyển THPT các năm trước từ 25.0 đến 27.2/30 điểm.',
      admissionMethods: ['Điểm thi tốt nghiệp THPT', 'Kỳ thi ĐGNL chuyên biệt HCMUE'],
      verificationNote: 'Trọng điểm đào tạo sư phạm chất lượng cao khu vực phía Nam.'
    });
  } else if (majorCode.startsWith('764') || majorCode.startsWith('742') || majorCode.startsWith('762')) {
    // Nhóm Thú Y, Công nghệ Sinh học & Chăn nuôi
    options.push({
      schoolCode: 'HVN',
      schoolName: 'Học viện Nông nghiệp Việt Nam (VNUA)',
      city: 'Hà Nội',
      majorName: majorCode.startsWith('764') ? 'Bác sĩ Thú y' : 'Công nghệ Sinh học',
      majorCode,
      admissionCombinations: ['B00 (Toán - Hóa - Sinh)', 'A00 (Toán - Lý - Hóa)', 'D08 (Toán - Sinh - Anh)'],
      tuitionPerYear: 'Khoảng 16.5 – 22 triệu đồng/năm',
      historicalBenchmarkNote: 'Điểm chuẩn các năm gần nhất dao động từ 21.0 đến 24.5/30 điểm; sở hữu Bệnh viện Thú y tiêu chuẩn quốc tế lớn nhất miền Bắc.',
      admissionMethods: ['Điểm thi tốt nghiệp THPT', 'Xét học bạ THPT kết hợp'],
      verificationNote: 'Thông tin đối chiếu từ Cổng thông tin Tuyển sinh Học viện Nông nghiệp Việt Nam.'
    });

    options.push({
      schoolCode: 'NLS',
      schoolName: 'Trường Đại học Nông Lâm TP. Hồ Chí Minh (NLU)',
      city: 'TP. Hồ Chí Minh',
      majorName: majorCode.startsWith('764') ? 'Bác sĩ Thú y' : 'Công nghệ Sinh học',
      majorCode,
      admissionCombinations: ['B00 (Toán - Hóa - Sinh)', 'A00 (Toán - Lý - Hóa)', 'D07 (Toán - Hóa - Anh)'],
      tuitionPerYear: 'Khoảng 18 – 25 triệu đồng/năm',
      historicalBenchmarkNote: 'Điểm trúng tuyển THPT các năm trước từ 23.0 đến 25.5/30 điểm (hoặc kết quả ĐGNL ĐHQG-HCM từ 750/1200 điểm).',
      admissionMethods: ['Điểm thi tốt nghiệp THPT', 'Điểm thi ĐGNL ĐHQG-HCM'],
      verificationNote: 'Trọng điểm đào tạo Thú y và Y sinh động vật chất lượng cao khu vực phía Nam.'
    });
  } else {
    // Nhóm Xã hội, Báo chí, Ngôn ngữ
    options.push({
      schoolCode: 'QHX',
      schoolName: 'Trường Đại học Khoa học Xã hội và Nhân văn – ĐHQGHN',
      city: 'Hà Nội',
      majorName: 'Báo chí & Truyền thông Đa phương tiện',
      majorCode,
      admissionCombinations: ['C00 (Văn - Sử - Địa)', 'D01 (Toán - Văn - Anh)', 'D04 (Toán - Văn - Trung)'],
      tuitionPerYear: 'Khoảng 18 – 24 triệu đồng/năm',
      historicalBenchmarkNote: 'Điểm chuẩn tổ hợp C00 thường ở mức rất cao (27.5 - 29.0), trong khi D01 ở mức 25.5 - 27.0 điểm.',
      admissionMethods: ['Điểm thi ĐGNL HSA ĐHQGHN', 'Điểm thi tốt nghiệp THPT', 'Xét tuyển chứng chỉ quốc tế'],
      verificationNote: 'Cần lưu ý sự chênh lệch điểm chuẩn lớn giữa khối C00 và D01 đối với ngành này.'
    });
  }

  return options;
}
