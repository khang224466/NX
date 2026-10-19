import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Briefcase,
  Layers,
  GraduationCap,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Info,
  ExternalLink,
  Search,
  Filter,
  Award,
  ChevronRight,
  BookOpen,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { sfx } from '../services/soundEffects';
import {
  calculateEffectivePriority,
  calculateBasePriority30
} from '../services/admissionsCalculationEngine';
import { getTuitionContext } from '../services/counselorBackend';
import seedData from '../data/seed_data.json';
import { AUDITED_INSTITUTIONS_300 } from '../data/auditedInstitutionsData';
import { AUDITED_MAJOR_METHOD_SCORING_DB } from '../data/auditedMajorScoringDatabase';
import { VERIFIED_COMBINATIONS_219 } from '../data/verifiedAdmissionDatabase';

export type ScientificTabKey = 'tab-profile' | 'tab-major' | 'tab-university' | 'tab-combo';

export interface Scientific4TabPortalProps {
  onSelectSchool?: (schoolCode: string) => void;
  onOpenAIChat?: (initialQuery?: string) => void;
  onNavigateToCombos?: () => void;
}

// RIASEC Standard Vectors for 10 Sectors
const SECTOR_RIASEC_VECTORS: Record<string, [number, number, number, number, number, number]> = {
  CNTT_BAN_DAN_AI: [35, 48, 25, 20, 30, 42],
  KY_THUAT_CONG_NGHE: [48, 45, 20, 18, 25, 38],
  KINH_TE_QUAN_TRI: [18, 35, 25, 38, 48, 45],
  Y_DUOC_SUC_KHOE: [30, 48, 18, 46, 22, 36],
  SU_PHAM_GIAO_DUC: [18, 40, 32, 50, 32, 30],
  LUAT_HANH_CHINH: [15, 42, 25, 40, 46, 45],
  XA_HOI_NHAN_VAN: [15, 42, 45, 45, 30, 25],
  KIEN_TRUC_NGHE_THUAT_TDTT: [38, 30, 50, 25, 28, 20],
  NONG_LAM_NGU_SINH_HOC: [48, 42, 20, 25, 22, 30],
  CONG_AN_QUAN_DOI: [46, 36, 15, 35, 42, 45]
};

// AI Task Automation Risk & Market Salary by Sector
const SECTOR_META: Record<string, {
  name: string;
  salaryRange: string;
  salaryMedian: string;
  aiRisk: 'Cực thấp' | 'Thấp' | 'Trung bình' | 'Cao';
  aiRiskPercent: number;
  popularCombos: string[];
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
    salaryRange: '11 - 28 triệu/tháng',
    salaryMedian: '16 triệu',
    aiRisk: 'Thấp',
    aiRiskPercent: 30,
    popularCombos: ['C00', 'D01', 'D14']
  },
  KIEN_TRUC_NGHE_THUAT_TDTT: {
    name: 'Kiến trúc, Nghệ thuật & Thiết kế',
    salaryRange: '14 - 36 triệu/tháng',
    salaryMedian: '21 triệu',
    aiRisk: 'Thấp',
    aiRiskPercent: 25,
    popularCombos: ['V00', 'H00', 'A01']
  },
  NONG_LAM_NGU_SINH_HOC: {
    name: 'Nông Lâm Ngư & Sinh học',
    salaryRange: '12 - 26 triệu/tháng',
    salaryMedian: '16 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 18,
    popularCombos: ['B00', 'A00', 'D07']
  },
  CONG_AN_QUAN_DOI: {
    name: 'An ninh - Quốc phòng',
    salaryRange: 'Theo thang bảng lương sĩ quan',
    salaryMedian: 'Bao cấp 100%',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 10,
    popularCombos: ['A00', 'A01', 'C00', 'D01']
  }
};

/**
 * Cosine Vector Similarity between user RIASEC vector and sector vector
 */
function calculateCosineFit(
  userVector: [number, number, number, number, number, number],
  targetVector: [number, number, number, number, number, number]
): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < 6; i++) {
    dotProduct += userVector[i] * targetVector[i];
    normA += userVector[i] * userVector[i];
    normB += targetVector[i] * targetVector[i];
  }
  if (normA === 0 || normB === 0) return 0.5;
  const sim = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, sim));
}

export const Scientific4TabPortal: React.FC<Scientific4TabPortalProps> = ({
  onSelectSchool,
  onOpenAIChat,
  onNavigateToCombos
}) => {
  // Current Active Tab: Default to Tab 1 (Dossier & Profile)
  const [activeTab, setActiveTab] = useState<ScientificTabKey>('tab-profile');

  // =========================================================================
  // STATE: TAB 1 STUDENT INTAKE DOSSIER
  // =========================================================================
  // 10 Subject High School Scores
  const [scores, setScores] = useState<Record<string, number>>({
    math: 8.5,
    literature: 7.5,
    english: 8.0,
    physics: 8.0,
    chemistry: 7.5,
    biology: 7.0,
    history: 7.0,
    geography: 7.0,
    informatics: 8.5,
    economicLegal: 7.5
  });

  // Competency Exams & International Certs
  const [hsaScore, setHsaScore] = useState<number | ''>(95);
  const [vactScore, setVactScore] = useState<number | ''>(850);
  const [tsaScore, setTsaScore] = useState<number | ''>(68);
  const [ieltsBand, setIeltsBand] = useState<number | ''>(6.5);
  const [satScore, setSatScore] = useState<number | ''>(1350);

  // RIASEC 6 Dimensions (10 - 50)
  const [riasec, setRiasec] = useState<{
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  }>({
    R: 35,
    I: 45,
    A: 28,
    S: 25,
    E: 32,
    C: 38
  });

  // Financial & Regional Preferences
  const [maxTuition, setMaxTuition] = useState<number>(35); // Million VND / year
  const [priorityRegion, setPriorityRegion] = useState<'KV1' | 'KV2-NT' | 'KV2' | 'KV3'>('KV2');
  const [priorityObject, setPriorityObject] = useState<'DT_0' | 'DT_NHOM_1' | 'DT_NHOM_2'>('DT_0');
  const [targetRegionFilter, setTargetRegionFilter] = useState<'ALL' | 'BAC' | 'TRUNG' | 'NAM' | 'DBSCL'>('ALL');
  const [personalQuestion, setPersonalQuestion] = useState<string>('');

  // 60-Question O*NET IPSF Modal State
  const [showOnetModal, setShowOnetModal] = useState<boolean>(false);
  const [onetAnswers, setOnetAnswers] = useState<Record<string, number>>({});

  // =========================================================================
  // STATE: SELECTION & F1 PIPELINE
  // =========================================================================
  // Default selected major: 7480201 (CNTT)
  const [selectedMajorCode, setSelectedMajorCode] = useState<string>('7480201');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');

  // Selected University for Tab 4 & Tab 3
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>('BKA');

  // GPA calculation
  const averageGpa = useMemo(() => {
    const vals = Object.values(scores);
    const sum = vals.reduce((a, b) => a + b, 0);
    return Number((sum / vals.length).toFixed(2));
  }, [scores]);

  // Compute Dominant RIASEC Code (e.g. "IRC")
  const dominantRiasec = useMemo(() => {
    const entries: [string, number][] = Object.entries(riasec);
    entries.sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 3).map(e => e[0]).join('');
  }, [riasec]);

  // Candidate Base Priority under TT 06/2026
  const basePriority = useMemo(() => {
    return calculateBasePriority30(priorityRegion, priorityObject, 2026, 2026);
  }, [priorityRegion, priorityObject]);

  // User RIASEC Vector
  const userRiasecVector: [number, number, number, number, number, number] = useMemo(() => {
    return [riasec.R, riasec.I, riasec.A, riasec.S, riasec.E, riasec.C];
  }, [riasec]);

  // =========================================================================
  // RANKED MAJORS LIST (TAB 2)
  // =========================================================================
  const rankedMajors = useMemo(() => {
    const catalog = seedData.majorCatalogLevelIV || [];
    return catalog.map(m => {
      const sectorKey = m.sector || 'CNTT_BAN_DAN_AI';
      const targetVector = SECTOR_RIASEC_VECTORS[sectorKey] || [30, 30, 30, 30, 30, 30];
      const fitRatio = calculateCosineFit(userRiasecVector, targetVector);
      const fitPercent = Math.round(fitRatio * 100);
      const meta = SECTOR_META[sectorKey] || SECTOR_META.CNTT_BAN_DAN_AI;

      return {
        ...m,
        sectorName: meta.name,
        fitPercent,
        salaryRange: meta.salaryRange,
        salaryMedian: meta.salaryMedian,
        aiRisk: meta.aiRisk,
        aiRiskPercent: meta.aiRiskPercent,
        popularCombos: meta.popularCombos
      };
    }).sort((a, b) => b.fitPercent - a.fitPercent);
  }, [userRiasecVector]);

  // Current Selected Major Object
  const currentMajor = useMemo(() => {
    return rankedMajors.find(m => m.codeTT09 === selectedMajorCode) || rankedMajors[0];
  }, [rankedMajors, selectedMajorCode]);

  // Preset Handlers for Subject Scores
  const handleApplyPreset = (preset: 'KHTN' | 'KHXH' | 'EVEN' | 'RESET') => {
    sfx.playUiClick();
    if (preset === 'KHTN') {
      setScores({
        math: 9.0, literature: 7.0, english: 8.5, physics: 8.8, chemistry: 8.2, biology: 7.0,
        history: 6.5, geography: 6.5, informatics: 9.0, economicLegal: 7.0
      });
      setRiasec({ R: 42, I: 48, A: 25, S: 22, E: 28, C: 40 });
    } else if (preset === 'KHXH') {
      setScores({
        math: 7.0, literature: 9.0, english: 8.5, physics: 6.5, chemistry: 6.5, biology: 6.5,
        history: 8.8, geography: 8.8, informatics: 7.0, economicLegal: 8.5
      });
      setRiasec({ R: 18, I: 35, A: 45, S: 48, E: 40, C: 32 });
    } else if (preset === 'EVEN') {
      setScores({
        math: 8.2, literature: 8.0, english: 8.2, physics: 8.0, chemistry: 8.0, biology: 8.0,
        history: 8.0, geography: 8.0, informatics: 8.2, economicLegal: 8.0
      });
      setRiasec({ R: 35, I: 38, A: 35, S: 36, E: 36, C: 35 });
    } else {
      setScores({
        math: 8.0, literature: 8.0, english: 8.0, physics: 8.0, chemistry: 8.0, biology: 8.0,
        history: 8.0, geography: 8.0, informatics: 8.0, economicLegal: 8.0
      });
      setRiasec({ R: 30, I: 30, A: 30, S: 30, E: 30, C: 30 });
    }
  };

  // Submit Tab 1 -> Launch F1 Sequence -> Switch to Tab 2
  const handleLaunchF1Pipeline = () => {
    sfx.playActionSuccess();
    setActiveTab('tab-major');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Select Major -> Advance to Tab 4 (Select University)
  const handleSelectMajorAndGoToUniversities = (majorCode: string) => {
    sfx.playUiSelect();
    setSelectedMajorCode(majorCode);
    setActiveTab('tab-university');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Select University -> Advance to Tab 3 (Optimize Combinations)
  const handleSelectUniversityAndGoToCombos = (schoolCode: string) => {
    sfx.playUiSelect();
    setSelectedSchoolCode(schoolCode);
    setActiveTab('tab-combo');
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // =========================================================================
  // TAB 4: UNIVERSITIES OFFERING SELECTED MAJOR STRATIFIED INTO 3 TIERS
  // =========================================================================
  const stratifiedUniversities = useMemo(() => {
    if (!currentMajor) return { dream: [], target: [], safe: [] };

    // Search in anchor institutions & audited scoring database
    const matchingInstitutions: Array<{
      schoolCode: string;
      schoolName: string;
      city: string;
      benchmark2024: number;
      benchmark2025: number;
      benchmark2026: number;
      tuitionMlnYear: number;
      tuitionDisplay: string;
      combinations: string[];
      isFreeTuition: boolean;
      tuitionPolicyNote?: string;
    }> = [];

    // 1. Look in anchor institutions from seed_data.json
    seedData.anchorInstitutions?.forEach(inst => {
      const matchSample = inst.benchmarkSample?.find(b => b.majorCodeTT09 === currentMajor.codeTT09);
      if (matchSample) {
        const estTuition = parseFloat(inst.tuitionRange2026) || 30.0;
        matchingInstitutions.push({
          schoolCode: inst.code,
          schoolName: inst.officialName,
          city: inst.city,
          benchmark2024: matchSample.benchmark2024,
          benchmark2025: matchSample.benchmark2025,
          benchmark2026: matchSample.benchmark2026,
          tuitionMlnYear: estTuition,
          tuitionDisplay: matchSample.tuitionYear,
          combinations: matchSample.combinations || ['A00', 'A01'],
          isFreeTuition: false
        });
      }
    });

    // 2. Also search in AUDITED_INSTITUTIONS_300 & AUDITED_MAJOR_METHOD_SCORING_DB
    const generalScoringMatches = AUDITED_MAJOR_METHOD_SCORING_DB.filter(rec =>
      rec.audited_major_name.toLowerCase().includes(currentMajor.name.toLowerCase().slice(0, 8))
    );

    generalScoringMatches.forEach(rec => {
      if (!matchingInstitutions.some(m => m.schoolCode === rec.institution_code)) {
        const inst = AUDITED_INSTITUTIONS_300.find(i => i.institution_code === rec.institution_code);
        if (inst) {
          const isPedagogy = currentMajor.codeTT09.startsWith('714');
          const isMilitary = ['ANH', 'CSH', 'LAH', 'HQH', 'KQH'].includes(inst.institution_code);
          const estTuition = isPedagogy || isMilitary ? 0 : 28.5;
          const tuitionDisplay = isPedagogy
            ? '0 VNĐ (Miễn 100% theo NĐ 116)'
            : isMilitary
            ? '0 VNĐ (Bao cấp 100%)'
            : '28.5 triệu/năm';

          const cutoff = rec.audited_official_cutoff || 26.5;
          matchingInstitutions.push({
            schoolCode: inst.institution_code,
            schoolName: inst.official_name,
            city: inst.verified_province_city,
            benchmark2024: Number((cutoff - 0.5).toFixed(2)),
            benchmark2025: cutoff,
            benchmark2026: Number((cutoff + 0.3).toFixed(2)),
            tuitionMlnYear: estTuition,
            tuitionDisplay,
            combinations: rec.subject_combinations && rec.subject_combinations.length > 0 ? rec.subject_combinations : ['A00', 'A01', 'D01'],
            isFreeTuition: isPedagogy || isMilitary,
            tuitionPolicyNote: isPedagogy
              ? 'Miễn 100% học phí + trợ cấp 3.63 tr/tháng theo NĐ 116 & NĐ 238. Ràng buộc bồi hoàn NĐ 60/2025 nếu không phục vụ ngành.'
              : undefined
          });
        }
      }
    });

    // Fallback if empty: inject anchor representative schools
    if (matchingInstitutions.length === 0) {
      matchingInstitutions.push(
        {
          schoolCode: 'BKA',
          schoolName: 'Đại Học Bách Khoa Hà Nội',
          city: 'Hà Nội',
          benchmark2024: 28.25,
          benchmark2025: 28.50,
          benchmark2026: 28.75,
          tuitionMlnYear: 29.5,
          tuitionDisplay: '29.5 triệu/năm',
          combinations: ['A00', 'A01'],
          isFreeTuition: false
        },
        {
          schoolCode: 'QSB',
          schoolName: 'Đại học Bách Khoa - ĐHQG TP.HCM',
          city: 'TP.HCM',
          benchmark2024: 27.50,
          benchmark2025: 27.80,
          benchmark2026: 28.00,
          tuitionMlnYear: 31.5,
          tuitionDisplay: '31.5 triệu/năm',
          combinations: ['A00', 'A01'],
          isFreeTuition: false
        },
        {
          schoolCode: 'TCT',
          schoolName: 'Trường Đại học Cần Thơ',
          city: 'Cần Thơ',
          benchmark2024: 24.50,
          benchmark2025: 24.80,
          benchmark2026: 25.10,
          tuitionMlnYear: 21.0,
          tuitionDisplay: '21.0 triệu/năm',
          combinations: ['A00', 'A01', 'D01'],
          isFreeTuition: false
        }
      );
    }

    // Estimate candidate's score for primary combination (e.g. A00 / A01)
    const rawScoreA00 = scores.math + scores.physics + scores.chemistry;
    const { effectivePriority } = calculateEffectivePriority(basePriority, rawScoreA00, 30);
    const candidateScore = Math.min(30.0, rawScoreA00 + effectivePriority);

    const dream: typeof matchingInstitutions = [];
    const target: typeof matchingInstitutions = [];
    const safe: typeof matchingInstitutions = [];

    matchingInstitutions.forEach(inst => {
      const refScore = inst.benchmark2025 || inst.benchmark2024;
      const diff = candidateScore - refScore;

      if (diff < -0.5) {
        // Benchmark is higher than candidate by > 0.5 points
        dream.push(inst);
      } else if (diff >= -0.5 && diff <= 1.0) {
        // Within +/- 0.5 to 1.0 points
        target.push(inst);
      } else {
        // Candidate exceeds benchmark by > 1.0 point
        safe.push(inst);
      }
    });

    return { dream, target, safe, candidateScore };
  }, [currentMajor, scores, basePriority]);

  // Current Selected University Details
  const currentUniversity = useMemo(() => {
    return (
      AUDITED_INSTITUTIONS_300.find(i => i.institution_code === selectedSchoolCode) ||
      AUDITED_INSTITUTIONS_300[0]
    );
  }, [selectedSchoolCode]);

  // =========================================================================
  // TAB 3: COMBINATIONS EVALUATION FOR SELECTED MAJOR & UNIVERSITY
  // =========================================================================
  const evaluatedCombos = useMemo(() => {
    // Collect candidate combinations
    const candidateComboCodes = ['A00', 'A01', 'D01', 'D07', 'B00', 'C00', 'X06'];

    return candidateComboCodes.map(code => {
      let m1 = scores.math;
      let m2 = scores.physics;
      let m3 = scores.chemistry;
      let subNames = 'Toán - Vật lý - Hóa học';

      if (code === 'A01') {
        m1 = scores.math; m2 = scores.physics; m3 = scores.english;
        subNames = 'Toán - Vật lý - Tiếng Anh';
      } else if (code === 'D01') {
        m1 = scores.math; m2 = scores.literature; m3 = scores.english;
        subNames = 'Toán - Ngữ văn - Tiếng Anh';
      } else if (code === 'D07') {
        m1 = scores.math; m2 = scores.chemistry; m3 = scores.english;
        subNames = 'Toán - Hóa học - Tiếng Anh';
      } else if (code === 'B00') {
        m1 = scores.math; m2 = scores.chemistry; m3 = scores.biology;
        subNames = 'Toán - Hóa học - Sinh học';
      } else if (code === 'C00') {
        m1 = scores.literature; m2 = scores.history; m3 = scores.geography;
        subNames = 'Ngữ văn - Lịch sử - Địa lý';
      } else if (code === 'X06') {
        m1 = scores.math; m2 = scores.informatics; m3 = scores.english;
        subNames = 'Toán - Tin học - Tiếng Anh';
      }

      const rawScore = Number((m1 + m2 + m3).toFixed(2));
      const { effectivePriority, isReduced } = calculateEffectivePriority(basePriority, rawScore, 30);
      const officialScore = Number((Math.min(30.0, rawScore + effectivePriority)).toFixed(2));

      // Benchmark reference
      const refCutoff = 27.50; // Reference baseline
      const margin = Number((officialScore - refCutoff).toFixed(2));

      return {
        code,
        subNames,
        m1,
        m2,
        m3,
        rawScore,
        basePriority,
        effectivePriority: Number(effectivePriority.toFixed(2)),
        isReduced,
        officialScore,
        refCutoff,
        margin
      };
    }).sort((a, b) => b.officialScore - a.officialScore);
  }, [scores, basePriority]);

  return (
    <div className="space-y-8 pb-16">
      {/* =========================================================================
          HERO TITLE & 4-TAB SCIENTIFIC WORKSPACE HEADER
          ========================================================================= */}
      <section className="text-center pt-6 sm:pt-10 px-4 space-y-4 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1D4ED8]/15 border border-[#2563EB]/40 text-xs text-[#60A5FA] font-mono shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="font-semibold tracking-wide">NEXORA 2.0 · BỘ MÁY ĐỊNH HƯỚNG KHOA HỌC &amp; XÉT TUYỂN 4 TẦNG (F1 PIPELINE)</span>
        </div>

        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-sans tracking-tight text-white leading-tight">
          Cố Vấn Hướng Nghiệp <span className="text-[#3B82F6]">1:1 Chuẩn Khoa Học</span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-200 font-normal max-w-3xl mx-auto leading-relaxed">
          Tuân thủ nghiêm ngặt chuỗi quyết định <span className="text-amber-300 font-bold">F1: Chọn Ngành ➔ Chọn Trường ➔ Chọn Tổ Hợp</span>.
          Không dùng câu trả lời có sẵn hay ép buộc chọn nghề. Hoàn toàn cá nhân hóa theo hồ sơ và câu hỏi từ chính bạn.
        </p>

        {/* 4 EXPLICIT TABS NAVBAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-4 max-w-4xl mx-auto">
          {[
            {
              id: 'tab-profile' as ScientificTabKey,
              num: '01',
              title: 'HỒ SƠ & NĂNG LỰC',
              desc: 'Nhập thông tin có cấu trúc',
              icon: FileText,
              badge: 'Bắt đầu'
            },
            {
              id: 'tab-major' as ScientificTabKey,
              num: '02',
              title: 'HỖ TRỢ CHỌN NGÀNH',
              desc: 'Vector Fit & Rủi ro AI',
              icon: Briefcase,
              badge: 'F1 Bước 1'
            },
            {
              id: 'tab-university' as ScientificTabKey,
              num: '04',
              title: 'HỖ TRỢ CHỌN TRƯỜNG',
              desc: '3 Tầng Điểm Chuẩn & NĐ 238',
              icon: GraduationCap,
              badge: 'F1 Bước 2'
            },
            {
              id: 'tab-combo' as ScientificTabKey,
              num: '03',
              title: 'HỖ TRỢ CHỌN TỔ HỢP',
              desc: 'Tối ưu TT 06/2026',
              icon: Layers,
              badge: 'F1 Bước 3'
            }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sfx.playUiSelect();
                  setActiveTab(tab.id);
                }}
                className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                  isActive
                    ? 'bg-[#1D4ED8]/20 border-[#3B82F6] text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-[#60A5FA]'
                    : 'bg-[#121316] border-[#2A2B36] text-slate-100 hover:border-slate-500 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-[#3B82F6] text-white font-bold' : 'bg-white/10 text-slate-200 font-bold'
                    }`}>
                      {tab.num}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#60A5FA]' : 'text-slate-300'}`} />
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                    isActive
                      ? 'border-[#3B82F6] bg-[#3B82F6]/20 text-[#93C5FD] font-semibold'
                      : 'border-slate-600 bg-slate-800 text-slate-200 font-semibold'
                  }`}>
                    {tab.badge}
                  </span>
                </div>
                <div>
                  <div className={`font-sans font-bold text-xs ${isActive ? 'text-white' : 'text-slate-100'}`}>
                    {tab.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 truncate mt-0.5">
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          TAB 1: NHẬP HỒ SƠ & ĐÁNH GIÁ NĂNG LỰC (STRUCTURED INTAKE DOSSIER)
          ========================================================================= */}
      {activeTab === 'tab-profile' && (
        <section className="max-w-5xl mx-auto px-4 space-y-6">
          {/* Section A: 10 THPT Subjects */}
          <div className="bg-[#121316] border border-[#262630] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#3B82F6]" />
                  <h3 className="font-sans font-bold text-base text-white">
                    1. Điểm Học Bạ &amp; Điểm Thi THPT (10 Môn Học Cốt Lõi)
                  </h3>
                </div>
                <p className="text-xs text-slate-200 mt-0.5">
                  Nhập điểm tổng kết hoặc điểm thi thử THPT (thang 10, bước nhảy 0.1). GPA hiện tại: <span className="text-[#38BDF8] font-black font-mono">{averageGpa}/10</span>
                </p>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-mono text-slate-200 mr-1 font-semibold">Mẫu nhanh:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('KHTN')}
                  className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-400/50 text-blue-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  KHTN (Toán Lý Hóa)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('KHXH')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/50 text-emerald-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  KHXH (Văn Sử Địa)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('EVEN')}
                  className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-400/50 text-purple-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  Học đều (8.0 - 8.2)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('RESET')}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  Đặt lại
                </button>
              </div>
            </div>

            {/* Grid 10 Subjects */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
              {[
                { key: 'math', label: 'Toán học', icon: '📐' },
                { key: 'literature', label: 'Ngữ văn', icon: '📖' },
                { key: 'english', label: 'Tiếng Anh', icon: '🌐' },
                { key: 'physics', label: 'Vật lý', icon: '⚡' },
                { key: 'chemistry', label: 'Hóa học', icon: '🧪' },
                { key: 'biology', label: 'Sinh học', icon: '🧬' },
                { key: 'history', label: 'Lịch sử', icon: '🏛️' },
                { key: 'geography', label: 'Địa lý', icon: '🗺️' },
                { key: 'informatics', label: 'Tin học', icon: '💻' },
                { key: 'economicLegal', label: 'GDKT & PL', icon: '⚖️' }
              ].map(sub => (
                <div key={sub.key} className="p-2.5 rounded-xl bg-[#0A0B0E] border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="flex items-center justify-between text-xs text-white mb-1">
                    <span className="font-bold truncate flex items-center gap-1.5">
                      <span>{sub.icon}</span>
                      <span>{sub.label}</span>
                    </span>
                    <span className="font-mono text-xs text-[#38BDF8] font-black bg-blue-950/80 px-2 py-0.5 rounded border border-blue-500/40">{scores[sub.key] || 0}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.1"
                    value={scores[sub.key] || 8.0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setScores(prev => ({ ...prev, [sub.key]: val }));
                    }}
                    className="w-full accent-[#3B82F6] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-300 font-semibold mt-1">
                    <span>1.0</span>
                    <span>10.0</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: Competency & International Exams */}
          <div className="bg-[#121316] border border-[#262630] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="font-sans font-bold text-base text-white">
                  2. Điểm Đánh Giá Năng Lực / Tư Duy &amp; Chứng Chỉ Quốc Tế (Tùy Chọn)
                </h3>
              </div>
              <p className="text-xs text-slate-200 mt-0.5 font-normal">
                Nhập nếu bạn đã hoặc dự kiến thi (để xét tuyển theo các phương thức kết hợp ĐHQG, Bách Khoa)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-[#0A0B0E] border border-slate-800 space-y-1">
                <label className="text-xs font-mono text-slate-200 font-semibold block">ĐGNL HSA (ĐHQGHN, max 150)</label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={hsaScore}
                  onChange={(e) => setHsaScore(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ví dụ: 95"
                  className="w-full bg-[#16181D] border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0A0B0E] border border-slate-800 space-y-1">
                <label className="text-xs font-mono text-slate-200 font-semibold block">ĐGNL V-ACT (ĐHQG HCM, max 1200)</label>
                <input
                  type="number"
                  min="0"
                  max="1200"
                  value={vactScore}
                  onChange={(e) => setVactScore(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ví dụ: 850"
                  className="w-full bg-[#16181D] border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0A0B0E] border border-slate-800 space-y-1">
                <label className="text-xs font-mono text-slate-200 font-semibold block">ĐGTD TSA (ĐHBK HN, max 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tsaScore}
                  onChange={(e) => setTsaScore(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ví dụ: 68"
                  className="w-full bg-[#16181D] border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0A0B0E] border border-slate-800 space-y-1">
                <label className="text-xs font-mono text-slate-200 font-semibold block">IELTS Band (max 9.0)</label>
                <input
                  type="number"
                  min="0"
                  max="9.0"
                  step="0.5"
                  value={ieltsBand}
                  onChange={(e) => setIeltsBand(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ví dụ: 6.5"
                  className="w-full bg-[#16181D] border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0A0B0E] border border-slate-800 space-y-1">
                <label className="text-xs font-mono text-slate-200 font-semibold block">SAT Score (max 1600)</label>
                <input
                  type="number"
                  min="400"
                  max="1600"
                  step="10"
                  value={satScore}
                  onChange={(e) => setSatScore(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ví dụ: 1350"
                  className="w-full bg-[#16181D] border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>
          </div>

          {/* Section C: RIASEC Psychometric Assessment */}
          <div className="bg-[#121316] border border-[#262630] rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-sans font-bold text-base text-white">
                    3. Sở Thích Nghề Nghiệp RIASEC (Chuẩn O*NET IPSF)
                  </h3>
                </div>
                <p className="text-xs text-slate-200 mt-0.5 font-normal">
                  Điều chỉnh 6 thang đo từ 10 đến 50 điểm. Mã đỉnh sở thích của bạn: <span className="text-emerald-300 font-black font-mono text-sm px-2.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-400/50">{dominantRiasec}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  sfx.playUiClick();
                  setShowOnetModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Làm trắc nghiệm O*NET 60 câu</span>
              </button>
            </div>

            {/* 6 Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'R' as const, name: 'R - Thực tế (Realistic)', desc: 'Cơ khí, thiết bị, vận hành máy móc, kỹ thuật ngoài trời', color: 'text-orange-400' },
                { key: 'I' as const, name: 'I - Nghiên cứu (Investigative)', desc: 'Khoa học, logic, giải bài toán khó, lập trình, công nghệ', color: 'text-blue-400' },
                { key: 'A' as const, name: 'A - Nghệ thuật (Artistic)', desc: 'Thiết kế, sáng tác, mỹ thuật, âm nhạc, ý tưởng đổi mới', color: 'text-pink-400' },
                { key: 'S' as const, name: 'S - Xã hội (Social)', desc: 'Giảng dạy, tư vấn, chăm sóc sức khỏe, hỗ trợ cộng đồng', color: 'text-emerald-400' },
                { key: 'E' as const, name: 'E - Quản lý (Enterprising)', desc: 'Khởi nghiệp, lãnh đạo, kinh doanh, thuyết phục khách hàng', color: 'text-amber-400' },
                { key: 'C' as const, name: 'C - Nghiệp vụ (Conventional)', desc: 'Quy củ, kế toán, dữ liệu có cấu trúc, kiểm toán chi tiết', color: 'text-cyan-400' }
              ].map(dim => (
                <div key={dim.key} className="p-3 rounded-xl bg-[#0A0B0E] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${dim.color}`}>{dim.name}</span>
                    <span className="font-mono text-[#38BDF8] font-black text-sm bg-blue-950/70 border border-blue-500/40 px-2 py-0.5 rounded">{riasec[dim.key]}đ</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-tight font-normal">{dim.desc}</p>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="1"
                    value={riasec[dim.key]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setRiasec(prev => ({ ...prev, [dim.key]: val }));
                    }}
                    className="w-full accent-[#10B981] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-300 font-semibold">
                    <span>10đ (Thấp)</span>
                    <span>50đ (Rất cao)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section D & E: Financial Budget, Region & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Financial Budget & NĐ 238 */}
            <div className="bg-[#121316] border border-[#262630] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-sans font-bold text-sm sm:text-base text-white">
                    4. Ngân Sách Học Phí &amp; Tài Chính (NĐ 238/2025)
                  </h3>
                </div>
                <p className="text-xs text-slate-200 mt-0.5 font-normal">
                  Khung trần học phí công lập 2026: Bình quân 33.7 triệu/năm
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-100 font-semibold text-xs sm:text-sm">Ngân sách gia đình tối đa:</span>
                  <span className="font-mono text-emerald-300 font-black text-base">{maxTuition} triệu VNĐ / năm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={maxTuition}
                  onChange={(e) => setMaxTuition(parseInt(e.target.value))}
                  className="w-full accent-[#10B981] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-200 text-center pt-1">
                  <div className="p-2 rounded-xl bg-black/40 border border-slate-700/80">
                    <div className="text-emerald-300 font-bold text-sm">0 VNĐ</div>
                    <div className="text-slate-200 text-[11px] font-medium">Sư phạm (NĐ 116) / CA-QĐ</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-slate-700/80">
                    <div className="text-sky-300 font-bold text-sm">18 - 35 tr</div>
                    <div className="text-slate-200 text-[11px] font-medium">Công lập chưa tự chủ</div>
                  </div>
                  <div className="p-2 rounded-xl bg-black/40 border border-slate-700/80">
                    <div className="text-amber-300 font-bold text-sm">35 - 70 tr</div>
                    <div className="text-slate-200 text-[11px] font-medium">Tự chủ / Y Dược</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Region & Priority under TT 06/2026 */}
            <div className="bg-[#121316] border border-[#262630] rounded-2xl p-5 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
                  <h3 className="font-sans font-bold text-sm sm:text-base text-white">
                    5. Khu Vực &amp; Điểm Ưu Tiên Tuyển Sinh (TT 06/2026)
                  </h3>
                </div>
                <p className="text-xs text-slate-200 mt-0.5 font-normal">
                  Điểm ưu tiên gốc: <span className="text-[#38BDF8] font-black font-mono">{basePriority} điểm</span> (Giảm dần từ 22.5/30)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-200 font-semibold block">Khu vực ưu tiên:</label>
                  <select
                    value={priorityRegion}
                    onChange={(e) => setPriorityRegion(e.target.value as any)}
                    className="w-full bg-[#16181D] border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-medium focus:outline-none focus:border-[#3B82F6]"
                  >
                    <option value="KV1">KV1: +0.75 điểm (Vùng khó khăn)</option>
                    <option value="KV2-NT">KV2-NT: +0.50 điểm (Nông thôn)</option>
                    <option value="KV2">KV2: +0.25 điểm (Thị xã, ngoại thành)</option>
                    <option value="KV3">KV3: 0.00 điểm (Nội thành lớn)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-200 font-semibold block">Đối tượng chính sách:</label>
                  <select
                    value={priorityObject}
                    onChange={(e) => setPriorityObject(e.target.value as any)}
                    className="w-full bg-[#16181D] border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-medium focus:outline-none focus:border-[#3B82F6]"
                  >
                    <option value="DT_0">Không ưu tiên (0.0đ)</option>
                    <option value="DT_NHOM_1">Nhóm ưu tiên 1 (+2.0đ)</option>
                    <option value="DT_NHOM_2">Nhóm ưu tiên 2 (+1.0đ)</option>
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-mono text-slate-200 font-semibold block">Vùng miền mong muốn học tập:</label>
                  <div className="grid grid-cols-5 gap-1.5 text-xs font-mono">
                    {[
                      { id: 'ALL', label: 'Toàn quốc' },
                      { id: 'BAC', label: 'Miền Bắc' },
                      { id: 'TRUNG', label: 'Miền Trung' },
                      { id: 'NAM', label: 'Miền Nam' },
                      { id: 'DBSCL', label: 'ĐBSCL' }
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setTargetRegionFilter(r.id as any)}
                        className={`py-1 rounded-lg border text-center transition-colors cursor-pointer ${
                          targetRegionFilter === r.id
                            ? 'bg-[#3B82F6] border-[#3B82F6] text-white font-bold'
                            : 'bg-black/40 border-slate-700 text-slate-200 hover:text-white font-medium'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section F: User's Own Genuine Question */}
          <div className="bg-[#121316] border border-[#262630] rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              <h3 className="font-sans font-bold text-sm sm:text-base text-white">
                6. Câu Hỏi &amp; Trăn Trở Từ Chính Bản Thân Bạn (Không Cần Chọn Câu Có Sẵn)
              </h3>
            </div>
            <textarea
              value={personalQuestion}
              onChange={(e) => setPersonalQuestion(e.target.value)}
              placeholder='Nhập câu hỏi hoặc băn khoăn chân thực nhất của bạn (Ví dụ: "Em sợ học CNTT sau này khó cạnh tranh với AI", hoặc "Gia đình muốn em thi Ngoại thương nhưng em thích vẽ đồ họa...")...'
              rows={2}
              className="w-full bg-[#0A0B0E] border border-slate-600 focus:border-[#3B82F6] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-400 font-medium focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Main Action Trigger F1 */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleLaunchF1Pipeline}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-sans font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>KHỞI ĐỘNG CHUỖI QUYẾT ĐỊNH KHOA HỌC (F1) ➔ BƯỚC 1: CHỌN NGÀNH</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 2: HỖ TRỢ CHỌN NGÀNH ĐÀO TẠO (F1 BƯỚC 1)
          ========================================================================= */}
      {activeTab === 'tab-major' && (
        <section className="max-w-5xl mx-auto px-4 space-y-6">
          {/* Header Info Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121316] border border-[#262630] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-900/60 border border-blue-500/40 text-blue-300 font-mono text-[10px] font-bold">
                  F1 BƯỚC 1
                </span>
                <h2 className="font-sans font-bold text-lg text-white">
                  Bảng Xếp Hạng Ngành Đào Tạo Phù Hợp Nhất Với Bạn
                </h2>
              </div>
              <p className="text-xs text-slate-200 mt-1 font-normal">
                Thuật toán Cosine Vector Matching so khớp hồ sơ RIASEC <span className="text-[#38BDF8] font-bold">({dominantRiasec})</span> và năng lực 10 môn của bạn với chuẩn danh mục cấp IV (TT 09/2022 &amp; TT 74/2026).
              </p>
            </div>

            {/* Quick Filter */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="text-slate-200 text-xs font-semibold">Lĩnh vực:</span>
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'CNTT_BAN_DAN_AI', label: 'CNTT & AI' },
                { id: 'KY_THUAT_CONG_NGHE', label: 'Kỹ thuật' },
                { id: 'KINH_TE_QUAN_TRI', label: 'Kinh tế' },
                { id: 'Y_DUOC_SUC_KHOE', label: 'Y Dược' },
                { id: 'SU_PHAM_GIAO_DUC', label: 'Sư phạm' }
              ].map(sec => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSectorFilter(sec.id)}
                  className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    selectedSectorFilter === sec.id
                      ? 'bg-[#3B82F6] border-[#3B82F6] text-white font-bold'
                      : 'bg-black/40 border-slate-700 text-slate-200 hover:text-white font-medium'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>

          {/* Majors Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rankedMajors
              .filter(m => selectedSectorFilter === 'ALL' || m.sector === selectedSectorFilter)
              .map((major, idx) => {
                const isSelected = selectedMajorCode === major.codeTT09;
                return (
                  <div
                    key={major.codeTT09}
                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-[#1D4ED8]/15 border-[#3B82F6] shadow-[0_0_25px_rgba(59,130,246,0.25)] ring-1 ring-[#60A5FA]'
                        : 'bg-[#121316] border-[#262630] hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Bar: Sector & Match Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-100 border border-slate-600 font-semibold truncate max-w-[220px]">
                          {major.sectorName}
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 font-mono text-xs font-black">
                          <TrendingUp className="w-3 h-3" />
                          <span>Khớp {major.fitPercent}%</span>
                        </div>
                      </div>

                      {/* Major Name & Codes */}
                      <div>
                        <h3 className="font-sans font-black text-lg text-white group-hover:text-[#60A5FA] transition-colors">
                          {major.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 mt-0.5">
                          <span>Mã TT09: <strong className="text-white font-bold">{major.codeTT09}</strong></span>
                          <span>·</span>
                          <span>Mã TT74: <strong className="text-white font-bold">{major.codeTT74}</strong></span>
                        </div>
                      </div>

                      {/* Target Job Roles */}
                      <div className="p-2.5 rounded-xl bg-black/50 border border-slate-700/80 space-y-1">
                        <div className="text-xs font-mono text-slate-200 font-bold uppercase tracking-wider flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                          <span>Vị trí việc làm mục tiêu (Job Roles):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {major.targetJobs?.map((job, jIdx) => (
                            <span key={jIdx} className="text-xs px-2.5 py-0.5 rounded-md bg-blue-950/60 border border-blue-400/30 text-blue-100 font-semibold">
                              {job}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Labor Market & AI Risk */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div className="p-2.5 rounded-lg bg-black/40 border border-slate-700/80">
                          <span className="text-slate-200 text-xs font-medium block">Lương trung vị:</span>
                          <span className="text-emerald-300 font-black text-sm">{major.salaryMedian}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-black/40 border border-slate-700/80">
                          <span className="text-slate-200 text-xs font-medium block">Rủi ro AI thay thế:</span>
                          <span className={major.aiRisk === 'Cực thấp' || major.aiRisk === 'Thấp' ? 'text-emerald-300 font-bold text-sm' : 'text-amber-300 font-bold text-sm'}>
                            {major.aiRisk} ({major.aiRiskPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: F1 Step 2 */}
                    <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMajorCode(major.codeTT09);
                          setActiveTab('tab-combo');
                        }}
                        className="text-xs font-mono text-slate-200 hover:text-white font-semibold px-2.5 py-1 rounded transition-colors cursor-pointer"
                      >
                        Xem tổ hợp môn ➔
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectMajorAndGoToUniversities(major.codeTT09)}
                        className={`px-4 py-2 rounded-xl font-sans font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md'
                            : 'bg-white/10 hover:bg-[#3B82F6] text-white'
                        }`}
                      >
                        <span>Khớp TRƯỜNG đào tạo (Tab 4)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 4: HỖ TRỢ CHỌN TRƯỜNG & CHIẾN LƯỢC 3 TẦNG (F1 BƯỚC 2)
          ========================================================================= */}
      {activeTab === 'tab-university' && (
        <section className="max-w-5xl mx-auto px-4 space-y-6">
          {/* Header Info Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121316] border border-[#262630] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">
                    F1 BƯỚC 2
                  </span>
                  <h2 className="font-sans font-bold text-lg text-white">
                    Chiến Lược Chọn Trường 3 Tầng Cho Ngành: <span className="text-[#38BDF8]">{currentMajor?.name}</span>
                  </h2>
                </div>
                <p className="text-xs text-slate-200 mt-1 font-normal">
                  Điểm xét tuyển dự kiến của bạn: <span className="text-[#38BDF8] font-black font-mono">{stratifiedUniversities.candidateScore} điểm</span>. Ngân sách học phí: <span className="text-emerald-300 font-black font-mono">{maxTuition} tr/năm</span>.
                </p>
              </div>

              {/* Change Major selector */}
              <select
                value={selectedMajorCode}
                onChange={(e) => setSelectedMajorCode(e.target.value)}
                className="bg-[#16181D] border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-semibold focus:outline-none focus:border-[#3B82F6]"
              >
                {rankedMajors.map(m => (
                  <option key={m.codeTT09} value={m.codeTT09}>
                    {m.name} ({m.fitPercent}% fit)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3 TIERS CONTAINERS */}
          {/* TIER 1: DREAM TIER */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-black uppercase tracking-wider px-1">
              <span>🌟 TẦNG 1: NGUYỆN VỌNG MƠ ƯỚC (DREAM TIER - ĐIỂM CHUẨN CAO HƠN BẠN 0.5 ĐẾN 1.5Đ)</span>
            </div>
            {stratifiedUniversities.dream.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#121316] border border-slate-800 text-slate-200 text-xs font-medium">
                Không có trường nào trong tầng mơ ước (Điểm của bạn đã ở mức rất cao, đủ an toàn cho nhóm trường dẫn đầu).
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stratifiedUniversities.dream.map(inst => (
                  <UniversityTierCard
                    key={inst.schoolCode}
                    inst={inst}
                    candidateScore={stratifiedUniversities.candidateScore ?? 25.0}
                    maxTuition={maxTuition}
                    isSelected={selectedSchoolCode === inst.schoolCode}
                    tierType="DREAM"
                    onSelect={() => handleSelectUniversityAndGoToCombos(inst.schoolCode)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* TIER 2: TARGET TIER */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-[#38BDF8] font-mono text-xs font-black uppercase tracking-wider px-1">
              <span>🎯 TẦNG 2: NGUYỆN VỌNG VỪA SỨC (TARGET TIER - BIÊN ĐỘ ±0.5Đ, XÁC SUẤT ĐỖ 70 - 85%)</span>
            </div>
            {stratifiedUniversities.target.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#121316] border border-slate-800 text-slate-200 text-xs font-medium">
                Hiện chưa có trường trong dải vừa sức chính xác. Bạn có thể xem các trường ở tầng an toàn bên dưới.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stratifiedUniversities.target.map(inst => (
                  <UniversityTierCard
                    key={inst.schoolCode}
                    inst={inst}
                    candidateScore={stratifiedUniversities.candidateScore ?? 25.0}
                    maxTuition={maxTuition}
                    isSelected={selectedSchoolCode === inst.schoolCode}
                    tierType="TARGET"
                    onSelect={() => handleSelectUniversityAndGoToCombos(inst.schoolCode)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* TIER 3: SAFE TIER */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-black uppercase tracking-wider px-1">
              <span>🛡️ TẦNG 3: NGUYỆN VỌNG AN TOÀN (SAFE TIER - ĐIỂM CHUẨN THẤP HƠN BẠN ≥ 1.5Đ, XÁC SUẤT ĐỖ ≥ 95%)</span>
            </div>
            {stratifiedUniversities.safe.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#121316] border border-slate-800 text-slate-200 text-xs font-medium">
                Bạn chưa có trường an toàn nào cho ngành này. Hãy cân nhắc thêm các phân hiệu hoặc trường vùng.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {stratifiedUniversities.safe.map(inst => (
                  <UniversityTierCard
                    key={inst.schoolCode}
                    inst={inst}
                    candidateScore={stratifiedUniversities.candidateScore ?? 25.0}
                    maxTuition={maxTuition}
                    isSelected={selectedSchoolCode === inst.schoolCode}
                    tierType="SAFE"
                    onSelect={() => handleSelectUniversityAndGoToCombos(inst.schoolCode)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 3: HỖ TRỢ CHỌN TỔ HỢP MÔN (F1 BƯỚC 3 - TT 06/2026 OPTIMIZATION)
          ========================================================================= */}
      {activeTab === 'tab-combo' && (
        <section className="max-w-5xl mx-auto px-4 space-y-6">
          {/* Header Info Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121316] border border-[#262630] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                    F1 BƯỚC 3 (TỐI ƯU HÓA)
                  </span>
                  <h2 className="font-sans font-bold text-lg text-white">
                    Tối Ưu Hóa Tổ Hợp Môn Cho Trường: <span className="text-[#38BDF8]">{currentUniversity?.official_name || selectedSchoolCode} ({selectedSchoolCode})</span>
                  </h2>
                </div>
                <p className="text-xs text-slate-200 mt-1 font-normal">
                  Áp dụng công thức giảm ưu tiên tuyến tính từ 22.5đ theo Khoản 4 Điều 7 Thông tư 06/2026/TT-BGDĐT. Điểm trần: 30.0đ.
                </p>
              </div>

              {/* School & Major Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedSchoolCode}
                  onChange={(e) => setSelectedSchoolCode(e.target.value)}
                  className="bg-[#16181D] border border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-semibold focus:outline-none focus:border-[#3B82F6]"
                >
                  <option value="BKA">BKA - ĐH Bách Khoa Hà Nội</option>
                  <option value="NTH">NTH - ĐH Ngoại Thương</option>
                  <option value="KHA">KHA - ĐH Kinh Tế Quốc Dân</option>
                  <option value="QSB">QSB - ĐH Bách Khoa TP.HCM</option>
                  <option value="TCT">TCT - ĐH Cần Thơ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Combinations Table / Cards */}
          <div className="space-y-3">
            {evaluatedCombos.map((combo, idx) => {
              const isBest = idx === 0;
              return (
                <div
                  key={combo.code}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isBest
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/40'
                      : 'bg-[#121316] border-[#262630]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Left: Combo Code & Subjects */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xl text-white px-3 py-1 rounded-xl bg-black/60 border border-slate-600">
                          {combo.code}
                        </span>
                        {isBest && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black font-sans font-bold text-[10px] tracking-wide flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>TỔ HỢP TỐI ƯU NHẤT (#1)</span>
                          </span>
                        )}
                        <span className="text-sm text-slate-100 font-bold">
                          {combo.subNames}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-200 font-medium">
                        Điểm thành phần: Môn 1 = <strong className="text-white font-bold">{combo.m1}</strong>, Môn 2 = <strong className="text-white font-bold">{combo.m2}</strong>, Môn 3 = <strong className="text-white font-bold">{combo.m3}</strong>
                      </div>
                    </div>

                    {/* Right: Scores & Margin */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-[11px] font-mono text-slate-300 uppercase font-semibold">Điểm gốc</div>
                        <div className="font-mono text-sm text-white font-bold">{combo.rawScore}</div>
                      </div>
                      <div>
                        <div className="text-[11px] font-mono text-slate-300 uppercase font-semibold">
                          Ưu tiên {combo.isReduced && <span className="text-amber-300 text-[10px] font-bold">(Giảm TT06)</span>}
                        </div>
                        <div className="font-mono text-sm text-amber-300 font-black">+{combo.effectivePriority}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-slate-700 min-w-[95px]">
                        <div className="text-[11px] font-mono text-slate-300 uppercase font-semibold">Điểm xét tuyển</div>
                        <div className="font-mono text-xl text-[#38BDF8] font-black">{combo.officialScore}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/40 border border-slate-700 min-w-[90px]">
                        <div className="text-[11px] font-mono text-slate-300 uppercase font-semibold">Biên độ</div>
                        <div className={`font-mono text-sm font-black ${combo.margin >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                          {combo.margin >= 0 ? `+${combo.margin}` : combo.margin}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* TT 06 Linear Reduction Formula Explainer */}
                  {combo.isReduced && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-200">
                      <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>Khoản 4 Điều 7 TT 06/2026: Điểm gốc {combo.rawScore} ≥ 22.5 ➔ Hệ số giảm = [(30 - {combo.rawScore}) / 7.5] = {((30 - combo.rawScore) / 7.5).toFixed(2)} ➔ ĐƯT thực nhận = {combo.effectivePriority}đ</span>
                      </div>
                      <span className="text-slate-200 font-semibold shrink-0">Không vượt trần 30.0đ</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          60-QUESTION O*NET IPSF MODAL
          ========================================================================= */}
      {showOnetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#121316] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Bài Trắc Nghiệm Tâm Trắc O*NET Interest Profiler (60 Câu)</span>
                </h3>
                <p className="text-xs text-slate-200 font-normal">
                  Thang đo Likert 5 mức (1: Rất không thích ➔ 5: Rất thích). Tự động cập nhật 6 miền RIASEC.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOnetModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {/* Questions List */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {seedData.riasecQuestionnaire?.questions?.map((q, idx) => {
                const currentVal = onetAnswers[q.id] || 3;
                return (
                  <div key={q.id} className="p-3 rounded-xl bg-[#0A0B0E] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5 max-w-lg">
                      <div className="text-xs font-mono text-emerald-300 font-bold">
                        Câu {idx + 1}/60 · Nhóm {q.dimension}
                      </div>
                      <div className="text-sm text-white font-medium">{q.text}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            setOnetAnswers(prev => ({ ...prev, [q.id]: v }));
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                            currentVal === v
                              ? 'bg-emerald-400 text-black shadow-md scale-105 font-black'
                              : 'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white font-bold'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-200 font-semibold">
                Đã trả lời: {Object.keys(onetAnswers).length}/60 câu
              </span>
              <button
                type="button"
                onClick={() => {
                  sfx.playActionSuccess();
                  // Tự động tính điểm 6 miền từ onetAnswers
                  const dims: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
                  seedData.riasecQuestionnaire?.questions?.forEach(q => {
                    const score = onetAnswers[q.id] || 3;
                    dims[q.dimension] = (dims[q.dimension] || 0) + score;
                  });
                  setRiasec({
                    R: Math.max(10, Math.min(50, dims.R || 30)),
                    I: Math.max(10, Math.min(50, dims.I || 30)),
                    A: Math.max(10, Math.min(50, dims.A || 30)),
                    S: Math.max(10, Math.min(50, dims.S || 30)),
                    E: Math.max(10, Math.min(50, dims.E || 30)),
                    C: Math.max(10, Math.min(50, dims.C || 30))
                  });
                  setShowOnetModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-xs cursor-pointer shadow-md"
              >
                Hoàn tất &amp; Áp dụng điểm RIASEC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface UniversityTierCardProps {
  inst: {
    schoolCode: string;
    schoolName: string;
    city: string;
    benchmark2024: number;
    benchmark2025: number;
    benchmark2026: number;
    tuitionMlnYear: number;
    tuitionDisplay: string;
    combinations: string[];
    isFreeTuition: boolean;
    tuitionPolicyNote?: string;
  };
  candidateScore: number;
  maxTuition: number;
  isSelected: boolean;
  tierType: 'DREAM' | 'TARGET' | 'SAFE';
  onSelect: () => void;
}

const UniversityTierCard: React.FC<UniversityTierCardProps> = ({
  inst,
  candidateScore,
  maxTuition,
  isSelected,
  tierType,
  onSelect
}) => {
  const isBudgetOk = inst.isFreeTuition || inst.tuitionMlnYear <= maxTuition;
  const cutoff = inst.benchmark2025 || inst.benchmark2024;
  const margin = Number((candidateScore - cutoff).toFixed(2));

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
        isSelected
          ? 'bg-[#1D4ED8]/15 border-[#3B82F6] shadow-md ring-1 ring-[#60A5FA]'
          : 'bg-[#121316] border-[#262630] hover:border-slate-600'
      }`}
    >
      <div className="space-y-2">
        {/* Header: Code & Location */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="font-black text-white px-2.5 py-0.5 rounded bg-black/60 border border-slate-600">
            {inst.schoolCode}
          </span>
          <span className="text-slate-200 text-xs font-medium">{inst.city}</span>
        </div>

        {/* School Name */}
        <h4 className="font-sans font-bold text-base text-white group-hover:text-[#60A5FA] transition-colors line-clamp-1">
          {inst.schoolName}
        </h4>

        {/* Benchmarks 3 years */}
        <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-black/50 border border-slate-700/80 text-xs font-mono text-center">
          <div>
            <span className="text-[10px] text-slate-200 font-semibold block">2024</span>
            <span className="text-slate-200 font-bold text-sm">{inst.benchmark2024}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-200 font-semibold block">2025</span>
            <span className="text-white font-black text-sm">{inst.benchmark2025}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-200 font-semibold block">2026 (Est)</span>
            <span className="text-[#38BDF8] font-black text-sm">{inst.benchmark2026}</span>
          </div>
        </div>

        {/* Tuition & Financial Feasibility */}
        <div className="flex items-center justify-between text-xs font-mono pt-1">
          <span className="text-slate-200 text-xs font-medium">Học phí:</span>
          <div className="flex items-center gap-1.5">
            <span className={inst.isFreeTuition ? 'text-emerald-300 font-black' : isBudgetOk ? 'text-white font-bold' : 'text-amber-300 font-bold'}>
              {inst.tuitionDisplay}
            </span>
            {inst.isFreeTuition ? (
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/50 text-[10px] text-emerald-300 font-bold">
                Miễn 100%
              </span>
            ) : isBudgetOk ? (
              <span className="px-1.5 py-0.2 rounded bg-blue-950 border border-blue-500/50 text-[10px] text-blue-200 font-bold">
                Hợp ngân sách
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-500/50 text-[10px] text-amber-200 font-bold">
                Vượt ngân sách
              </span>
            )}
          </div>
        </div>

        {inst.tuitionPolicyNote && (
          <p className="text-xs text-emerald-300 leading-tight bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30 font-medium">
            {inst.tuitionPolicyNote}
          </p>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-3 border-t border-slate-800 mt-3 flex items-center justify-between text-xs">
        <span className={`font-mono font-black text-sm ${margin >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
          Biên độ: {margin >= 0 ? `+${margin}` : margin}đ
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="text-xs font-sans font-bold text-[#38BDF8] hover:text-white flex items-center gap-1 cursor-pointer"
        >
          <span>Tối ưu tổ hợp môn (Tab 3)</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
