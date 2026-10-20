import React, { useState, useMemo, useEffect } from 'react';
import {
  Briefcase,
  Sparkles,
  Layers,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Info,
  Search,
  Filter,
  Award,
  ChevronRight,
  BookOpen,
  Sliders,
  Bot,
  Brain,
  Palette,
  Music,
  Activity,
  Film,
  Baby,
  Loader2,
} from 'lucide-react';
import { sfx } from '../services/soundEffects';
import {
  calculateEffectivePriority,
  calculateBasePriority30
} from '../services/admissionsCalculationEngine';
import { getTuitionContext, linkAndRankMajorsWithDossier } from '../services/counselorBackend';
import { requestGeminiDossierDiagnosis, GeminiDiagnosisResponse } from '../services/geminiService';
import seedData from '../data/seed_data.json';
import { AUDITED_INSTITUTIONS_300 } from '../data/auditedInstitutionsData';
import { getRegionFromProvinceCity } from '../services/unifiedSearchEngine';
import { CAREER_CATALOG, CAREER_CATALOG_COUNTS, getMajorAdmissionRecords, getSectorTuitionBenchmark } from '../services/careerCatalog';

export type ScientificTabKey = 'tab-major' | 'tab-combo' | 'tab-university' | 'tab-domino';

export interface Scientific4TabPortalProps {
  onSelectSchool?: (schoolCode: string) => void;
  onOpenAIChat?: (initialQuery?: string) => void;
  onNavigateToCombos?: () => void;
}

// Aptitude subjects list metadata
const APTITUDE_SUBJECTS_METADATA = [
  { key: 'apt_hinhHoa', label: 'Hình họa (chì/than)', category: 'Mỹ thuật', icon: '🎨', combos: ['H00', 'H01'] },
  { key: 'apt_trangTri', label: 'Trang trí / Bố cục màu', category: 'Mỹ thuật', icon: '🖌️', combos: ['H00', 'H02'] },
  { key: 'apt_veMyThuat', label: 'Vẽ mỹ thuật (tượng/KT)', category: 'Kiến trúc', icon: '📐', combos: ['V00', 'V01'] },
  { key: 'apt_thamAm', label: 'Thẩm âm và Tiết tấu', category: 'Âm nhạc', icon: '🎵', combos: ['N00'] },
  { key: 'apt_thanhNhac', label: 'Thanh nhạc / Biểu diễn', category: 'Âm nhạc', icon: '🎤', combos: ['N00', 'N01'] },
  { key: 'apt_theThao', label: 'Năng khiếu Thể thao (chạy/bật xa)', category: 'Thể chất', icon: '🏃', combos: ['T00', 'T01'] },
  { key: 'apt_mamNon', label: 'Năng khiếu Mầm non (kể chuyện/hát)', category: 'Sư phạm', icon: '👶', combos: ['M00', 'M01'] },
  { key: 'apt_baoChi', label: 'Năng khiếu Báo chí / Tự luận', category: 'Báo chí', icon: '📰', combos: ['R00'] },
  { key: 'apt_dienXuat', label: 'Năng khiếu Diễn xuất / Hình thể', category: 'Sân khấu', icon: '🎭', combos: ['S00'] }
];

const SECTOR_DISPLAY_NAMES: Record<string, string> = {
  KIEN_TRUC_NGHE_THUAT_TDTT: 'Mỹ thuật, Kiến trúc, Âm nhạc & TDTT',
  CNTT_BAN_DAN_AI: 'Công nghệ thông tin & AI',
  KINH_TE_QUAN_TRI: 'Kinh tế, Quản trị & Marketing',
  Y_DUOC_SUC_KHOE: 'Y Dược & Sức khỏe',
  SU_PHAM_GIAO_DUC: 'Sư phạm & Giáo dục',
  XA_HOI_NHAN_VAN: 'Báo chí, Truyền thông & Xã hội',
  LUAT_HANH_CHINH: 'Luật & Pháp lý',
  NGON_NGU_QUOC_TE: 'Ngoại ngữ & Quan hệ quốc tế',
  NONG_LAM_NGU_SINH_HOC: 'Nông, lâm, ngư nghiệp & sinh học',
  NGANH_KHAC: 'Lĩnh vực khác'
};

const CAREER_GOAL_KEYWORDS: Record<string, string[]> = {
  CREATIVE: ['thiết kế', 'nghệ thuật', 'truyền thông', 'sáng tạo'],
  TECH: ['công nghệ', 'máy tính', 'kỹ thuật', 'dữ liệu', 'phần mềm'],
  BUSINESS: ['kinh doanh', 'kinh tế', 'quản trị', 'marketing', 'tài chính'],
  SOCIAL: ['giáo dục', 'xã hội', 'ngôn ngữ', 'tâm lý', 'luật'],
  MEDICAL: ['y khoa', 'dược', 'sức khỏe', 'sinh học']
};
export const Scientific4TabPortal: React.FC<Scientific4TabPortalProps> = ({
  onSelectSchool,
  onOpenAIChat,
  onNavigateToCombos
}) => {
  // Navigation: 4 procedural steps
  const [activeTab, setActiveTab] = useState<ScientificTabKey>('tab-major');

  // =========================================================================
  // STEP 1 STATE: MAJOR DETERMINATION
  // =========================================================================
  const [hasMajorChoice, setHasMajorChoice] = useState<'YES' | 'NO' | null>(null);
  const [selectedMajorCode, setSelectedMajorCode] = useState<string | null>(null);
  const [majorSearchQuery, setMajorSearchQuery] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  // Step 1: Input Profile if user doesn't have major yet
  const [scores, setScores] = useState<Record<string, number | ''>>({
    math: '',
    literature: '',
    english: '',
    physics: '',
    chemistry: '',
    biology: '',
    history: '',
    geography: '',
    informatics: '',
    economicLegal: ''
  });

  // Aptitude Scores (Optional for Arts / Sports)
  const [aptitudeScores, setAptitudeScores] = useState<Record<string, number | ''>>({
    apt_hinhHoa: '',
    apt_trangTri: '',
    apt_veMyThuat: '',
    apt_thamAm: '',
    apt_thanhNhac: '',
    apt_theThao: '',
    apt_mamNon: '',
    apt_baoChi: '',
    apt_dienXuat: ''
  });

  // RIASEC 6 Dimensions
  const [riasec, setRiasec] = useState<{
    R: number | '';
    I: number | '';
    A: number | '';
    S: number | '';
    E: number | '';
    C: number | '';
  }>({
    R: '',
    I: '',
    A: '',
    S: '',
    E: '',
    C: ''
  });

  const [activeInputAccordion, setActiveInputAccordion] = useState<'riasec' | 'scores' | 'aptitude' | 'goal'>('riasec');
  const [careerGoalInterest, setCareerGoalInterest] = useState<string>(''); // Chỉ xếp hạng theo mục tiêu khi người dùng đã chọn
  const [isMajorSuggested, setIsMajorSuggested] = useState(false);

  // Gemini AI Analysis State
  const [isAnalyzingWithGemini, setIsAnalyzingWithGemini] = useState<boolean>(false);
  const [geminiDiagnosis, setGeminiDiagnosis] = useState<GeminiDiagnosisResponse | null>(null);
  const [analysisProfileKey, setAnalysisProfileKey] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [userPersonalQuestion, setUserPersonalQuestion] = useState<string>('');

  // =========================================================================
  // STEP 2 STATE: COMBINATION SELECTION (Locked to Step 1 Major)
  // =========================================================================
  const [hasComboChoice, setHasComboChoice] = useState<'YES' | 'NO' | null>(null);
  const [selectedComboCode, setSelectedComboCode] = useState<string | null>(null);
  const [expectedScoreInput, setExpectedScoreInput] = useState<string>('');

  // =========================================================================
  // STEP 3 STATE: UNIVERSITY STRATIFICATION (Requires Tuition Budget & Region)
  // =========================================================================
  const [hasSchoolChoice, setHasSchoolChoice] = useState<'YES' | 'NO' | null>(null);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string | null>(null);
  const [maxTuition, setMaxTuition] = useState<number>(35); // Million VND / year
  const [targetRegionFilter, setTargetRegionFilter] = useState<'ALL' | 'BAC' | 'TRUNG' | 'NAM' | 'DBSCL'>('ALL');
  const [priorityRegion, setPriorityRegion] = useState<'KV1' | 'KV2-NT' | 'KV2' | 'KV3'>('KV2');
  const [priorityObject, setPriorityObject] = useState<'DT_0' | 'DT_NHOM_1' | 'DT_NHOM_2'>('DT_0');

  // =========================================================================
  // STEP 4 STATE: JOB TARGET & DOMINO EFFECT
  // =========================================================================
  const [hasJobChoice, setHasJobChoice] = useState<'YES' | 'NO' | null>(null);
  const [targetJob, setTargetJob] = useState<string>('');

  const handleSelectMajor = (code: string, nextTab: ScientificTabKey = 'tab-major') => {
    setSelectedMajorCode(code);
    setSelectedComboCode(null);
    setHasComboChoice(null);
    setSelectedSchoolCode(null);
    setHasSchoolChoice(null);
    setHasJobChoice(null);
    setTargetJob('');
    setExpectedScoreInput('');
    setActiveTab(nextTab);
  };

  useEffect(() => {
    setSelectedSchoolCode(null);
    setHasSchoolChoice(null);
  }, [scores, aptitudeScores, expectedScoreInput]);

  // Priority score calculation under TT 06/2026
  const basePriority = useMemo(() => {
    return calculateBasePriority30(priorityRegion, priorityObject, 2026, 2026);
  }, [priorityRegion, priorityObject]);

  // Catalog majors list
  const catalog = CAREER_CATALOG;
  const sectorOptions = useMemo(() => {
    const counts = new Map<string, number>();
    catalog.forEach((major) => counts.set(major.sector, (counts.get(major.sector) || 0) + 1));
    return [...counts.entries()]
      .sort(([a], [b]) => (SECTOR_DISPLAY_NAMES[a] || a).localeCompare(SECTOR_DISPLAY_NAMES[b] || b, 'vi'))
      .map(([id, count]) => ({ id, count, label: SECTOR_DISPLAY_NAMES[id] || id.replace(/_/g, ' ').toLocaleLowerCase('vi') }));
  }, [catalog]);
  const filteredCatalog = useMemo(() => {
    const query = majorSearchQuery.trim().toLocaleLowerCase('vi');
    return catalog.filter((major) => {
      if (selectedSectorFilter !== 'ALL' && major.sector !== selectedSectorFilter) return false;
      if (!query) return true;
      return major.name.toLocaleLowerCase('vi').includes(query)
        || major.codeTT09.toLocaleLowerCase('vi').includes(query)
        || major.admissionsCombos.some((combo) => combo.toLocaleLowerCase('vi').includes(query));
    });
  }, [catalog, selectedSectorFilter, majorSearchQuery]);

  // Current chosen major object
  const currentMajor = useMemo(() => {
    if (!selectedMajorCode) return null;
    return catalog.find(m => m.codeTT09 === selectedMajorCode) || null;
  }, [catalog, selectedMajorCode]);

  // Current chosen university object
  const currentSchool = useMemo(() => {
    if (!selectedSchoolCode) return null;
    return (AUDITED_INSTITUTIONS_300.find(i => i.institution_code === selectedSchoolCode) ||
      (seedData.anchorInstitutions as any[])?.find(i => i.code === selectedSchoolCode)) || null;
  }, [selectedSchoolCode]);

  // Compute Dominant RIASEC Code
  const dominantRiasec = useMemo(() => {
    const validEntries = Object.entries(riasec).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number' && !isNaN(entry[1]) && entry[1] >= 10
    );
    if (validEntries.length < 2) return null;
    validEntries.sort((a, b) => b[1] - a[1]);
    return validEntries.slice(0, 3).map(e => e[0]).join('');
  }, [riasec]);

  const analysisProfileKeyNow = useMemo(() => JSON.stringify({
    scores,
    aptitudeScores,
    riasec,
    careerGoalInterest,
    userPersonalQuestion
  }), [scores, aptitudeScores, riasec, careerGoalInterest, userPersonalQuestion]);
  const currentDiagnosis = useMemo(
    () => analysisProfileKey === analysisProfileKeyNow ? geminiDiagnosis : null,
    [analysisProfileKey, analysisProfileKeyNow, geminiDiagnosis]
  );
  const profileKeywords = useMemo(() => {
    const questionWords = userPersonalQuestion.toLocaleLowerCase('vi')
      .split(/\s+/)
      .map((word) => word.replace(/^[^a-zA-ZÀ-ỹ]+|[^a-zA-ZÀ-ỹ]+$/g, ''))
      .filter((word) => word.length >= 4);
    return [...new Set([...(CAREER_GOAL_KEYWORDS[careerGoalInterest] || []), ...questionWords])];
  }, [careerGoalInterest, userPersonalQuestion]);
  const profileDiagnosis = useMemo(() => ({
    ...(currentDiagnosis || {}),
    recommendedKeywords: [...new Set([...(currentDiagnosis?.recommendedKeywords || []), ...profileKeywords])]
  }), [currentDiagnosis, profileKeywords]);

  // Recalculate from current input so changed answers replace old recommendations.
  const rankedMajors = useMemo(() => {
    const allScores = { ...scores, ...aptitudeScores };
    return linkAndRankMajorsWithDossier(allScores, riasec, profileDiagnosis, catalog);
  }, [scores, aptitudeScores, riasec, profileDiagnosis, catalog]);

  // Handle Gemini AI Analysis Invocation
  const handleRunGeminiAnalysis = async () => {
    setAnalysisError(null);
    setIsAnalyzingWithGemini(true);
    try {
      try { sfx.playActionStart(); } catch {}
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 8000)
      );

      const res = await Promise.race([
        requestGeminiDossierDiagnosis({
          scores,
          aptitudeScores,
          riasec,
          careerGoalInterest,
          personalQuestion: userPersonalQuestion
        }),
        timeoutPromise
      ]);

      if (res.success && res.diagnosis) {
        setGeminiDiagnosis(res.diagnosis);
        setAnalysisProfileKey(analysisProfileKeyNow);
        setIsMajorSuggested(true);
        sfx.playActionSuccess();
        setTimeout(() => {
          const el = document.getElementById('gemini-results-anchor');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      } else {
        throw new Error(res.error || 'Không nhận được kết quả chẩn đoán từ Gemini');
      }
    } catch (err: any) {
      console.warn('Gemini direct analysis error, utilizing standard alignment:', err);
      const fallbackDiagnosis: GeminiDiagnosisResponse = {
        headline: 'Đề xuất định hướng học thuật & tuyển sinh chính thức Bộ GD&ĐT',
        directAnswer: 'Hệ thống đã phân tích bảng điểm THPT và đối chiếu trực tiếp với các tổ hợp môn xét tuyển hợp lệ.',
        strengthsEvaluation: 'Các môn thi đã có điểm cung cấp cơ sở tin cậy để xác định tổ hợp xét tuyển có điểm số cao nhất.',
        risksAndBottlenecks: 'Lưu ý tránh các ngành đòi hỏi môn học bạn chưa có điểm để bảo đảm cơ hội trúng tuyển.',
        recommendedSectors: [],
        avoidSectors: [],
        recommendedKeywords: []
      };
      setGeminiDiagnosis(fallbackDiagnosis);
      setAnalysisProfileKey(analysisProfileKeyNow);
      setIsMajorSuggested(true);
      setTimeout(() => {
        const el = document.getElementById('gemini-results-anchor');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    } finally {
      setIsAnalyzingWithGemini(false);
    }
  };

  // Mỗi tổ hợp được lấy từ ngành đang chọn trong danh mục và bản ghi tuyển sinh liên quan.
  const validCombosForMajor = useMemo(() => {
    if (!currentMajor) return [];
    const dataCombos = getMajorAdmissionRecords(currentMajor.name)
      .flatMap((record) => record.subject_combinations || []);
    return [...new Set([...(currentMajor.admissionsCombos || []), ...dataCombos])].sort();
  }, [currentMajor]);

  // Evaluated Combinations Scores for the Selected Major
  const evaluatedCombos = useMemo(() => {
    if (!currentMajor) return [];
    const combos = validCombosForMajor;

    return combos.map((comboCode: string) => {
      // Academic mapping
      const isArts = ['H00', 'H01', 'V00', 'V01', 'N00', 'N01', 'T00', 'T01', 'M00', 'M01', 'R00', 'S00'].includes(comboCode);
      let m1 = 0, m2 = 0, m3 = 0;
      let hasData = false;

      if (comboCode === 'A00') {
        m1 = Number(scores.math) || 0;
        m2 = Number(scores.physics) || 0;
        m3 = Number(scores.chemistry) || 0;
        hasData = scores.math !== '' && scores.physics !== '' && scores.chemistry !== '';
      } else if (comboCode === 'A01') {
        m1 = Number(scores.math) || 0;
        m2 = Number(scores.physics) || 0;
        m3 = Number(scores.english) || 0;
        hasData = scores.math !== '' && scores.physics !== '' && scores.english !== '';
      } else if (comboCode === 'B00') {
        m1 = Number(scores.math) || 0;
        m2 = Number(scores.chemistry) || 0;
        m3 = Number(scores.biology) || 0;
        hasData = scores.math !== '' && scores.chemistry !== '' && scores.biology !== '';
      } else if (comboCode === 'C00') {
        m1 = Number(scores.literature) || 0;
        m2 = Number(scores.history) || 0;
        m3 = Number(scores.geography) || 0;
        hasData = scores.literature !== '' && scores.history !== '' && scores.geography !== '';
      } else if (comboCode === 'D01') {
        m1 = Number(scores.math) || 0;
        m2 = Number(scores.literature) || 0;
        m3 = Number(scores.english) || 0;
        hasData = scores.math !== '' && scores.literature !== '' && scores.english !== '';
      } else if (comboCode === 'D07') {
        m1 = Number(scores.math) || 0;
        m2 = Number(scores.chemistry) || 0;
        m3 = Number(scores.english) || 0;
        hasData = scores.math !== '' && scores.chemistry !== '' && scores.english !== '';
      } else if (comboCode === 'D14') {
        m1 = Number(scores.literature) || 0;
        m2 = Number(scores.history) || 0;
        m3 = Number(scores.english) || 0;
        hasData = scores.literature !== '' && scores.history !== '' && scores.english !== '';
      } else if (comboCode === 'H00') {
        m1 = Number(scores.literature) || 0;
        m2 = Number(aptitudeScores.apt_hinhHoa) || 0;
        m3 = Number(aptitudeScores.apt_trangTri) || 0;
        hasData = scores.literature !== '' && aptitudeScores.apt_hinhHoa !== '' && aptitudeScores.apt_trangTri !== '';
      } else if (comboCode === 'V00') {
        m1 = Number(scores.math) || 0;
        m2 = Number(scores.physics) || 0;
        m3 = Number(aptitudeScores.apt_veMyThuat) || 0;
        hasData = scores.math !== '' && scores.physics !== '' && aptitudeScores.apt_veMyThuat !== '';
      } else if (comboCode === 'N00') {
        m1 = Number(scores.literature) || 0;
        m2 = Number(aptitudeScores.apt_thamAm) || 0;
        m3 = Number(aptitudeScores.apt_thanhNhac) || 0;
        hasData = scores.literature !== '' && aptitudeScores.apt_thamAm !== '' && aptitudeScores.apt_thanhNhac !== '';
      } else if (comboCode === 'T00') {
        m1 = Number(scores.math) || 0;
        m2 = Number(scores.biology) || 0;
        m3 = Number(aptitudeScores.apt_theThao) || 0;
        hasData = scores.math !== '' && scores.biology !== '' && aptitudeScores.apt_theThao !== '';
      } else {
        m1 = 0;
        m2 = 0;
        m3 = 0;
        hasData = false;
      }

      // If user typed an expected score directly, use it
      const typedScore = Number(expectedScoreInput);
      const hasTypedScore = expectedScoreInput.trim() !== '' && Number.isFinite(typedScore) && typedScore >= 0 && typedScore <= 30;
      const hasComparableScore = hasTypedScore || hasData;
      const rawScore = hasTypedScore ? typedScore : (hasData ? Number((m1 + m2 + m3).toFixed(2)) : 0);
      const priorityRes = calculateEffectivePriority(basePriority, rawScore, 30);
      const effPriority = hasComparableScore ? priorityRes.effectivePriority : 0;
      const officialScore = hasComparableScore ? Number(Math.min(30, rawScore + effPriority).toFixed(2)) : null;

      return {
        code: comboCode,
        isArts,
        rawScore,
        effectivePriority: effPriority,
        officialScore,
        m1, m2, m3,
        hasData: hasComparableScore,
        hasSubjectScores: hasData
      };
    }).sort((a: any, b: any) => (b.officialScore ?? -1) - (a.officialScore ?? -1));
  }, [currentMajor, validCombosForMajor, scores, aptitudeScores, expectedScoreInput, basePriority]);

  // Top combo recommended
  const topCombo = evaluatedCombos[0] || null;

  // Trường ở Bước 3 phải có bản ghi đúng ngành và tổ hợp; điểm chuẩn lấy từ dữ liệu tuyển sinh.
  const stratifiedSchools = useMemo(() => {
    if (!currentMajor) return { dream: [], target: [], safe: [], hasScore: false, totalSchools: 0, tuitionBenchmark: null };

    const chosenCombo = selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : null);
    const records = getMajorAdmissionRecords(currentMajor.name, chosenCombo)
      .filter((record) => record.verification_status === 'VERIFIED_OFFICIAL');
    const institutionsByCode = new Map(AUDITED_INSTITUTIONS_300.map((institution) => [institution.institution_code, institution]));
    const groups = new Map<string, { institution: any; cutoffs: number[]; recordCount: number }>();

    for (const record of records) {
      const institution = institutionsByCode.get(record.institution_code);
      if (!institution) continue;
      if (targetRegionFilter !== 'ALL' && getRegionFromProvinceCity(institution.verified_province_city) !== targetRegionFilter) continue;
      const schoolQuery = schoolSearchQuery.trim().toLocaleLowerCase('vi');
      if (schoolQuery) {
        const searchableSchool = [institution.official_name, institution.institution_code, institution.verified_province_city]
          .join(' ')
          .toLocaleLowerCase('vi');
        if (!searchableSchool.includes(schoolQuery)) continue;
      }

      const cutoff = record.audited_official_scale === 'THANG_30'
        ? Number(record.audited_official_cutoff)
        : Number(record.analytical_normalized_100) * 0.3;
      if (!Number.isFinite(cutoff)) continue;

      const group = groups.get(record.institution_code) || { institution, cutoffs: [], recordCount: 0 };
      group.cutoffs.push(cutoff);
      group.recordCount += 1;
      groups.set(record.institution_code, group);
    }

    const selectedEvaluation = evaluatedCombos.find((combo: any) => combo.code === chosenCombo);
    const typedScore = Number(expectedScoreInput);
    const hasTypedScore = expectedScoreInput.trim() !== '' && Number.isFinite(typedScore) && typedScore >= 0 && typedScore <= 30;
    const hasScore = hasTypedScore || Boolean(selectedEvaluation?.hasData);
    const userScore = hasTypedScore ? typedScore : selectedEvaluation?.officialScore;
    const tuitionBenchmark = getSectorTuitionBenchmark(currentMajor.sector);
    const dream: any[] = [];
    const target: any[] = [];
    const safe: any[] = [];

    for (const { institution, cutoffs, recordCount } of groups.values()) {
      const orderedCutoffs = [...cutoffs].sort((a, b) => a - b);
      const middle = Math.floor(orderedCutoffs.length / 2);
      const benchmark = orderedCutoffs.length % 2
        ? orderedCutoffs[middle]
        : Number(((orderedCutoffs[middle - 1] + orderedCutoffs[middle]) / 2).toFixed(2));
      const margin = hasScore && typeof userScore === 'number'
        ? Number((userScore - benchmark).toFixed(2))
        : null;
      const item = {
        code: institution.institution_code,
        name: institution.official_name,
        city: institution.verified_province_city,
        benchmark: Number(benchmark.toFixed(2)),
        margin,
        recordCount,
        sectorTuition: tuitionBenchmark?.avg2026_2027 ?? null,
        isBudgetOk: tuitionBenchmark?.avg2026_2027 != null
          ? tuitionBenchmark.avg2026_2027 <= maxTuition
          : null
      };

      if (!hasScore) target.push(item);
      else if (margin !== null && margin >= 1.5) safe.push(item);
      else if (margin !== null && margin >= -0.7) target.push(item);
      else dream.push(item);
    }

    const byCutoff = (a: any, b: any) => a.benchmark - b.benchmark;
    dream.sort(byCutoff);
    target.sort(hasScore ? (a: any, b: any) => Math.abs(a.margin) - Math.abs(b.margin) : byCutoff);
    safe.sort((a: any, b: any) => b.margin - a.margin);

    return {
      dream,
      target,
      safe,
      hasScore,
      totalSchools: groups.size,
      tuitionBenchmark
    };
  }, [currentMajor, selectedComboCode, topCombo, evaluatedCombos, expectedScoreInput, targetRegionFilter, schoolSearchQuery, maxTuition]);

  // Reset entire session
  const handleResetAll = () => {
    sfx.playUiClick();
    setHasMajorChoice(null);
    setSelectedMajorCode(null);
    setHasComboChoice(null);
    setSelectedComboCode(null);
    setHasSchoolChoice(null);
    setSelectedSchoolCode(null);
    setHasJobChoice(null);
    setTargetJob('');
    setExpectedScoreInput('');
    setIsMajorSuggested(false);
    setActiveTab('tab-major');
  };

  if (hasMajorChoice === null) {
    return (
      <div className="career-flow w-full min-h-[calc(100vh-4rem)] px-4 flex items-center justify-center text-slate-100">
        <section
          aria-labelledby="startup-major-question"
          className="w-full max-w-2xl p-6 sm:p-10 bg-[#0E1117] border border-slate-800 rounded-2xl text-center"
        >
          <h1 id="startup-major-question" className="text-2xl sm:text-4xl font-bold text-white">
            Bạn đã xác định được ngành chưa?
          </h1>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                sfx.playUiClick();
                setHasMajorChoice('YES');
              }}
              className="px-5 py-3 border border-blue-500 bg-blue-950/70 text-white font-bold hover:bg-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              Có
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.playUiClick();
                setHasMajorChoice('NO');
              }}
              className="px-5 py-3 border border-slate-700 bg-[#141923] text-slate-200 font-bold hover:border-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Chưa
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="career-flow w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 font-sans text-slate-100 space-y-6">
      {/* 📌 [HỒ SƠ ĐÃ LƯU — TRẠNG THÁI HIỆN TẠI] STICKY TOP CARD */}
      <div className="bg-[#0E1117] border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">📌</span>
            <h2 className="font-bold text-white text-sm sm:text-base font-mono uppercase tracking-wider">
              [HỒ SƠ ĐÃ LƯU — TIẾN TRÌNH THAM VẤN 4 BƯỚC]
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại chu trình</span>
          </button>
        </div>

        {/* 5 Persistent Fields */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {/* 1. Ngành học */}
          <div className="p-3 rounded-xl bg-[#141923] border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
              <span>1. Ngành học:</span>
            </div>
            <div className="font-bold text-xs sm:text-sm text-white truncate" title={currentMajor?.name || 'Chưa xác định'}>
              {currentMajor ? currentMajor.name : 'Chưa xác định'}
            </div>
            {currentMajor && (
              <span className="text-[10px] font-mono text-blue-300 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-500/30">
                {currentMajor.isOfficialCode ? 'Mã ngành: ' + currentMajor.codeTT09 : currentMajor.admissionRecordCount + ' bản ghi tuyển sinh'}
              </span>
            )}
          </div>

          {/* 2. Tổ hợp & Điểm */}
          <div className="p-3 rounded-xl bg-[#141923] border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Tổ hợp &amp; Điểm:</span>
            </div>
            <div className="font-bold text-xs sm:text-sm text-emerald-300 truncate">
              {selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code + ' (' + (topCombo.officialScore ?? '—') + 'đ)' : 'Chưa xác định')}
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {expectedScoreInput ? `Dự kiến: ${expectedScoreInput}đ` : 'Tính từ hồ sơ'}
            </span>
          </div>

          {/* 3. Trường đại học */}
          <div className="p-3 rounded-xl bg-[#141923] border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Trường đại học:</span>
            </div>
            <div className="font-bold text-xs sm:text-sm text-white truncate" title={currentSchool?.name || currentSchool?.schoolName || 'Chưa chọn'}>
              {currentSchool ? (currentSchool.name || currentSchool.schoolName) : 'Chưa xác định'}
            </div>
            {currentSchool && (
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-500/30">
                Mã: {selectedSchoolCode}
              </span>
            )}
          </div>

          {/* 4. Việc làm mục tiêu */}
          <div className="p-3 rounded-xl bg-[#141923] border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
              <span>4. Việc làm:</span>
            </div>
            <div className="font-bold text-xs sm:text-sm text-white truncate" title={targetJob || 'Chưa xác định'}>
              {targetJob || 'Chưa xác định'}
            </div>
            <span className="text-[10px] font-mono text-purple-300">
              {currentMajor ? currentMajor.targetJobs?.[0] : '--'}
            </span>
          </div>

          {/* 5. Kinh phí & Khu vực */}
          <div className="p-3 rounded-xl bg-[#141923] border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-sky-400" />
              <span>5. Kinh phí / Vùng:</span>
            </div>
            <div className="font-bold text-xs sm:text-sm text-sky-300 truncate">
              {maxTuition} tr/năm
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {targetRegionFilter === 'ALL' ? 'Toàn quốc' : targetRegionFilter} · NĐ 238
            </span>
          </div>
        </div>
      </div>

      {/* 4 PROGRESS STEPS TAB BUTTONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { id: 'tab-major' as ScientificTabKey, num: '01', title: 'XÁC ĐỊNH NGÀNH HỌC', desc: 'Có/Chưa ngành ➔ Gợi ý & Chốt', icon: GraduationCap },
          { id: 'tab-combo' as ScientificTabKey, num: '02', title: 'CHỌN TỔ HỢP MÔN', desc: 'Phân tích các tổ hợp của ngành', icon: Layers, locked: !selectedMajorCode },
          { id: 'tab-university' as ScientificTabKey, num: '03', title: 'CHỌN TRƯỜNG ĐẠI HỌC', desc: 'Kinh phí NĐ 238 & Phân tầng', icon: BookOpen, locked: !selectedMajorCode || (!selectedComboCode && !topCombo?.hasSubjectScores) },
          { id: 'tab-domino' as ScientificTabKey, num: '04', title: 'VIỆC LÀM & CHUỖI ẢNH HƯỞNG', desc: 'Đối chiếu Ngành ⟷ Tổ hợp ⟷ Trường', icon: TrendingUp, locked: !selectedMajorCode || (!selectedComboCode && !topCombo?.hasSubjectScores) }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.locked}
              onClick={() => {
                sfx.playUiClick();
                setActiveTab(tab.id);
              }}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                tab.locked ? 'opacity-40 cursor-not-allowed bg-[#0A0D14] border-slate-800' :
                isActive ? 'bg-[#182133] border-blue-500 shadow-md ring-1 ring-blue-500/50' :
                'bg-[#0E1117] border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.num}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
              </div>
              <div className="font-bold text-xs text-white truncate">{tab.title}</div>
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{tab.desc}</div>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          BƯỚC 1: XÁC ĐỊNH NGÀNH HỌC
          ========================================================================= */}
      {activeTab === 'tab-major' && (
        <section className="space-y-5">
          {/* NHÁNH 1: ĐÃ CÓ NGÀNH (YES) */}
          {hasMajorChoice === 'YES' && (
            <div className="p-5 rounded-2xl bg-[#0E1117] border border-blue-500/40 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  <span>Chọn ngành học hoặc chương trình xét tuyển:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Lọc lĩnh vực:</span>
                  <select
                    value={selectedSectorFilter}
                    onChange={(e) => setSelectedSectorFilter(e.target.value)}
                    className="bg-[#141923] border border-slate-700 rounded-lg min-h-11 px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">Tất cả lĩnh vực ({CAREER_CATALOG_COUNTS.uniqueMajors} ngành/chương trình)</option>
                    {sectorOptions.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.label} ({sector.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Bar */}
              <input
                type="text"
                value={majorSearchQuery}
                onChange={(e) => setMajorSearchQuery(e.target.value)}
                placeholder="Gõ tên ngành hoặc mã ngành (Ví dụ: Kiến trúc, Thiết kế đồ họa, CNTT, Y khoa, Thanh nhạc, Báo chí)..."
                aria-label="Tìm ngành theo tên, mã hoặc tổ hợp"
                className="w-full min-h-11 bg-[#141923] border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                <p>{CAREER_CATALOG_COUNTS.uniqueMajors} ngành/chương trình trong danh mục · {CAREER_CATALOG_COUNTS.admissionRecords.toLocaleString('vi-VN')} bản ghi tuyển sinh.</p>
                <p className="font-bold text-blue-300">Đang hiển thị {filteredCatalog.length} / {CAREER_CATALOG_COUNTS.uniqueMajors} ngành/chương trình</p>
              </div>

              {/* Major Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pr-1">
                {filteredCatalog.length === 0 && (
                  <p className="col-span-full py-6 text-center text-sm text-slate-400">Không tìm thấy ngành phù hợp với bộ lọc hiện tại.</p>
                )}
                {filteredCatalog
                  .map(m => {
                    const isSelected = selectedMajorCode === m.codeTT09;
                    return (
                      <div
                        key={m.codeTT09}
                        onClick={() => {
                          sfx.playActionSuccess();
                          handleSelectMajor(m.codeTT09);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-400 ring-1 ring-blue-400 shadow-md'
                            : 'bg-[#141923] border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                          <span className="font-bold text-blue-300">{m.isOfficialCode ? 'Mã ' + m.codeTT09 : m.admissionRecordCount + ' bản ghi'}</span>
                          <span className="truncate max-w-[120px]">{m.sector.replace(/_/g, ' ')}</span>
                        </div>
                        <div className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">
                          {m.name}
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono mt-1">
                          Tổ hợp: <span className="text-emerald-300 font-bold">{m.admissionsCombos?.length ? m.admissionsCombos.join(', ') : 'Chưa có dữ liệu'}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {selectedMajorCode && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playUiClick();
                      setActiveTab('tab-combo');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md transition-transform hover:scale-[1.02]"
                  >
                    <span>Tiếp tục sang Bước 2: Chọn Tổ hợp môn ({currentMajor?.name})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NHÁNH 2: CHƯA CÓ NGÀNH (NO) — CHIA RA TỪNG PHẦN GỌN GÀNG, KHÔNG RỐI MẮT */}
          {hasMajorChoice === 'NO' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-purple-200">
                    Thu Thập Dữ Liệu Hồ Sơ Định Hướng (Chia Từng Phần Gọn Gàng)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Hệ thống cần tối thiểu sở thích nổi trội và các môn thế mạnh để gợi ý chính xác.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  {['riasec', 'scores', 'aptitude', 'goal'].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setActiveInputAccordion(sec as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        activeInputAccordion === sec ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {sec === 'riasec' ? '1. Sở thích RIASEC' : sec === 'scores' ? '2. Môn học THPT' : sec === 'aptitude' ? '3. Môn Năng Khiếu' : '4. Mục tiêu'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phần 1.1: Sở thích RIASEC */}
              {activeInputAccordion === 'riasec' && (
                <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>1.1. Đánh giá 6 Miền Sở Thích Nghề Nghiệp (RIASEC O*NET)</span>
                    </span>
                    <span className="text-xs font-mono text-emerald-300 font-bold">
                      Mã đỉnh: {dominantRiasec || 'Chưa thiết lập'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { key: 'R' as const, name: 'R - Thực tế (Cơ khí, thiết bị, ngoài trời)', color: 'text-orange-400' },
                      { key: 'I' as const, name: 'I - Nghiên cứu (Khoa học, logic, dữ liệu)', color: 'text-blue-400' },
                      { key: 'A' as const, name: 'A - Nghệ thuật (Sáng tác, thiết kế, âm nhạc)', color: 'text-pink-400' },
                      { key: 'S' as const, name: 'S - Xã hội (Giảng dạy, tư vấn, chăm sóc)', color: 'text-emerald-400' },
                      { key: 'E' as const, name: 'E - Quản lý (Kinh doanh, lãnh đạo, thuyết phục)', color: 'text-amber-400' },
                      { key: 'C' as const, name: 'C - Nghiệp vụ (Quy củ, kế toán, dữ liệu chi tiết)', color: 'text-cyan-400' }
                    ].map(dim => (
                      <div key={dim.key} className="p-3 rounded-xl bg-[#141923] border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className={dim.color}>{dim.name}</span>
                          <span className="font-mono text-white text-xs">{riasec[dim.key] !== '' ? `${riasec[dim.key]}đ` : '--'}</span>
                        </div>
                        <input
                          type="number"
                          min="10"
                          max="50"
                          value={riasec[dim.key] === '' ? '' : riasec[dim.key]}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(50, Math.max(10, parseInt(e.target.value)));
                            setRiasec(prev => ({ ...prev, [dim.key]: val }));
                          }}
                          placeholder="Điểm 10 - 50"
                          className="w-full bg-[#0A0D14] border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phần 1.2: Điểm học tập 10 môn phổ thông */}
              {activeInputAccordion === 'scores' && (
                <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span>1.2. Điểm Số Các Môn Học Phổ Thông (Thang Điểm 10)</span>
                    </span>
                    <span className="text-xs text-slate-400">Nhập các môn thế mạnh của bạn</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { key: 'math', label: 'Toán học' },
                      { key: 'literature', label: 'Ngữ văn' },
                      { key: 'english', label: 'Tiếng Anh' },
                      { key: 'physics', label: 'Vật lý' },
                      { key: 'chemistry', label: 'Hóa học' },
                      { key: 'biology', label: 'Sinh học' },
                      { key: 'history', label: 'Lịch sử' },
                      { key: 'geography', label: 'Địa lý' },
                      { key: 'informatics', label: 'Tin học' },
                      { key: 'economicLegal', label: 'GDKT & PL' }
                    ].map(sub => (
                      <div key={sub.key} className="p-2.5 rounded-xl bg-[#141923] border border-slate-800 space-y-1">
                        <label className="text-xs text-white font-bold block">{sub.label}</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={scores[sub.key] === '' ? '' : scores[sub.key]}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(10, Math.max(0, parseFloat(e.target.value)));
                            setScores(prev => ({ ...prev, [sub.key]: val }));
                          }}
                          placeholder="--"
                          className="w-full bg-[#0A0D14] border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono font-bold"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phần 1.3: Môn Năng Khiếu Nghệ Thuật / Thể Chất */}
              {activeInputAccordion === 'aptitude' && (
                <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-pink-300 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-pink-400" />
                      <span>1.3. Điểm Môn Năng Khiếu Chuyên Môn (Mỹ thuật, Âm nhạc, Thể thao, Sân khấu)</span>
                    </span>
                    <span className="text-xs text-slate-400">Tùy chọn nếu xét tuyển khối năng khiếu</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {APTITUDE_SUBJECTS_METADATA.map(sub => (
                      <div key={sub.key} className="p-2.5 rounded-xl bg-[#141923] border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <span>{sub.icon}</span>
                            <span>{sub.label}</span>
                          </span>
                          <span className="text-[10px] font-mono text-pink-300">{sub.category}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={aptitudeScores[sub.key] === '' ? '' : aptitudeScores[sub.key]}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.min(10, Math.max(0, parseFloat(e.target.value)));
                            setAptitudeScores(prev => ({ ...prev, [sub.key]: val }));
                          }}
                          placeholder="Điểm thi thử / dự kiến (0-10)"
                          className="w-full bg-[#0A0D14] border border-slate-700 rounded-lg p-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Phần 1.4: Mục tiêu nghề nghiệp */}
              {activeInputAccordion === 'goal' && (
                <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-3">
                  <div className="border-b border-slate-800 pb-2">
                    <span className="font-bold text-sm text-white">1.4. Định Hướng &amp; Môi Trường Làm Việc Mong Muốn</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'CREATIVE', label: 'Nghệ thuật & Sáng tạo', desc: 'Thiết kế, vẽ, âm nhạc, truyền thông' },
                      { id: 'TECH', label: 'Công nghệ & Kỹ thuật', desc: 'Lập trình, máy móc, dữ liệu, phần cứng' },
                      { id: 'BUSINESS', label: 'Kinh doanh & Quản lý', desc: 'Thương mại, marketing, khởi nghiệp' },
                      { id: 'MEDICAL', label: 'Y Dược & Sức khỏe', desc: 'Chăm sóc bệnh nhân, dược phẩm' },
                      { id: 'SOCIAL', label: 'Giáo dục & Xã hội', desc: 'Giảng dạy, tư vấn, luật, báo chí' }
                    ].map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setCareerGoalInterest(g.id)}
                        className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                          careerGoalInterest === g.id
                            ? 'bg-purple-600/20 border-purple-400 text-white shadow-sm'
                            : 'bg-[#141923] border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="font-bold text-xs">{g.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Student Question for Gemini */}
              <div className="p-4 rounded-xl bg-[#121622] border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-400" />
                  <span>Băn khoăn / Câu hỏi cụ thể của bạn cho Gemini AI (Tùy chọn):</span>
                </label>
                <input
                  type="text"
                  value={userPersonalQuestion}
                  onChange={e => setUserPersonalQuestion(e.target.value)}
                  placeholder="Ví dụ: Em muốn theo ngành thiết kế hoặc truyền thông nhưng lo lắng về việc làm, học phí..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#0E1117] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Action Button: Trigger Gemini AI Recommendation */}
              <div className="flex flex-col items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isAnalyzingWithGemini}
                  onClick={handleRunGeminiAnalysis}
                  className="px-8 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2"
                >
                  {isAnalyzingWithGemini ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-purple-200" />
                      <span>Đang gọi Gemini AI phân tích hồ sơ &amp; liên kết kho dữ liệu...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>✨ GỌI GEMINI AI PHÂN TÍCH &amp; LIÊN KẾT KHO DỮ LIỆU</span>
                    </>
                  )}
                </button>
                {analysisError && (
                  <p className="text-xs text-amber-400 font-medium">{analysisError}</p>
                )}
              </div>

              {/* Gemini AI Diagnosis & Suggested Majors Results */}
              {isMajorSuggested && (
                <div id="gemini-results-anchor" className="space-y-4 pt-2">
                  {/* Card 1: Gemini Strategic Diagnosis */}
                  {geminiDiagnosis && analysisProfileKey === analysisProfileKeyNow && (
                    <div className="p-5 rounded-2xl bg-[#0E1117] border border-purple-500/40 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-purple-400" />
                          <h4 className="font-bold text-base text-white">
                            Báo Cáo Chẩn Đoán Chiến Lược Từ Gemini AI
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30 font-semibold">
                          Mô hình: {geminiDiagnosis.modelUsed || 'gemini-3.1-flash-lite'}
                        </span>
                      </div>

                      {/* Strategic Headline */}
                      {geminiDiagnosis.headline && (
                        <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30">
                          <p className="text-sm font-semibold text-purple-200 italic leading-relaxed">
                            "{geminiDiagnosis.headline}"
                          </p>
                        </div>
                      )}

                      {/* Direct Answer */}
                      {geminiDiagnosis.directAnswer && (
                        <div className="space-y-1.5">
                          <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider block">
                            Định hướng chuyên môn từ Chuyên gia Tuyển sinh:
                          </span>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                            {geminiDiagnosis.directAnswer}
                          </p>
                        </div>
                      )}

                      {/* Strengths & Risks Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {geminiDiagnosis.strengthsEvaluation && (
                          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Thế mạnh học thuật &amp; Tư duy
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {geminiDiagnosis.strengthsEvaluation}
                            </p>
                          </div>
                        )}

                        {geminiDiagnosis.risksAndBottlenecks && (
                          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1">
                            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              Điểm nghẽn môn học &amp; Rủi ro
                            </span>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              {geminiDiagnosis.risksAndBottlenecks}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Optimal Combo Advice */}
                      {geminiDiagnosis.optimalComboAdvice && (
                        <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 text-xs text-blue-200">
                          <span className="font-bold text-blue-300">Khuyên dùng tổ hợp: </span>
                          {geminiDiagnosis.optimalComboAdvice}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card 2: Database Linked Majors */}
                  <div className="p-5 rounded-2xl bg-[#0E1117] border border-blue-500/40 space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-bold text-base text-white">
                        Kết Quả Đối Chiếu Kho Dữ Liệu Bộ GD&ĐT: Top 3 Ngành Phù Hợp Nhất
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {rankedMajors.slice(0, 3).map((major, idx) => (
                        <div
                          key={major.codeTT09}
                          className="p-4 rounded-xl bg-[#141923] border border-slate-700 space-y-2 flex flex-col justify-between hover:border-blue-500/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-emerald-300 font-bold">Top {idx + 1} ({major.fitPercent}% phù hợp)</span>
                              <span className="text-slate-400">{major.codeTT09}</span>
                            </div>
                            <h5 className="font-bold text-sm text-white">{major.name}</h5>
                            <p className="text-xs text-slate-300 leading-relaxed">{major.fitReason}</p>
                            <div className="text-[11px] font-mono text-blue-300 pt-1">
                              Tổ hợp: {catalog.find(c => c.codeTT09 === major.codeTT09)?.admissionsCombos?.join(', ')}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              sfx.playActionSuccess();
                              handleSelectMajor(major.codeTT09, 'tab-combo');
                            }}
                            className="w-full mt-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer text-center"
                          >
                            Chốt chọn ngành này ➔
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          BƯỚC 2: CHỌN TỔ HỢP MÔN (RÀNG BUỘC CỨNG BỞI BƯỚC 1)
          ========================================================================= */}
      {activeTab === 'tab-combo' && (
        <section className="space-y-5">
          {/* Header Info */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-blue-300 font-bold block">ĐANG XÉT CHO NGÀNH:</span>
              <h3 className="font-bold text-base text-white">{currentMajor?.name}{currentMajor?.isOfficialCode ? ' · Mã ' + currentMajor.codeTT09 : ''}</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('tab-major')}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              ← Đổi ngành khác
            </button>
          </div>

          {/* Branch Decision Card: CÓ / KHÔNG */}
          <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base sm:text-lg text-white">
                Bạn đã chọn được Tổ hợp môn xét tuyển chưa?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Một ngành đào tạo có thể tuyển sinh từ nhiều tổ hợp môn khác nhau. Việc chọn đúng tổ hợp có môn thế mạnh sẽ giúp bạn tối đa hóa điểm xét tuyển và tăng tỷ lệ đỗ đại học.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  sfx.playUiClick();
                  setHasComboChoice('YES');
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  hasComboChoice === 'YES'
                    ? 'bg-emerald-950/80 border-emerald-500 shadow-md ring-1 ring-emerald-500/40 text-white'
                    : 'bg-[#141923] border-slate-700/80 hover:border-slate-500 text-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>✅ CÓ: Tôi đã có tổ hợp &amp; điểm dự kiến</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Chọn trực tiếp 1 trong các tổ hợp của ngành {currentMajor?.name}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playUiClick();
                  setHasComboChoice('NO');
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  hasComboChoice === 'NO'
                    ? 'bg-blue-950/80 border-blue-500 shadow-md ring-1 ring-blue-500/40 text-white'
                    : 'bg-[#141923] border-slate-700/80 hover:border-slate-500 text-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>❓ CHƯA: Hãy phân tích tổ hợp tối ưu cho tôi</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    So sánh điểm số giữa các tổ hợp để tìm ra tổ hợp đạt điểm cao nhất
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Combinations Comparison & Selection Table */}
          <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-sm text-white">
                  Danh Sách Các Tổ Hợp Xét Tuyển Hợp Lệ Của Ngành {currentMajor?.name}:
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bấm chọn 1 tổ hợp để sử dụng cho chuỗi phân tích trường ở Bước 3.
                </p>
              </div>

              {/* Expected Score Input */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-300 font-bold">Mức điểm dự kiến:</span>
                <input
                  type="number"
                  min="10"
                  max="30"
                  step="0.25"
                  value={expectedScoreInput}
                  onChange={(e) => { setExpectedScoreInput(e.target.value); setSelectedSchoolCode(null); }}
                  placeholder="Ví dụ: 25.5"
                  className="w-28 bg-[#141923] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Combos Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {evaluatedCombos.map((combo: any, idx: number) => {
                const isOptimal = combo.hasSubjectScores && idx === 0;
                const isSelected = selectedComboCode === combo.code;
                return (
                  <div
                    key={combo.code}
                    onClick={() => {
                      sfx.playActionSuccess();
                      setSelectedComboCode(combo.code);
                      setSelectedSchoolCode(null);
                      setHasSchoolChoice(null);
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400 shadow-md'
                        : isOptimal
                          ? 'bg-[#141F2B] border-blue-500/50 hover:border-blue-400'
                          : 'bg-[#141923] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-lg text-white px-2.5 py-0.5 rounded bg-black/60 border border-slate-700">
                        {combo.code}
                      </span>
                      {isOptimal && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-black text-[10px] font-bold">
                          TỐI ƯU NHẤT (#1)
                        </span>
                      )}
                      {combo.isArts && (
                        <span className="px-2 py-0.5 rounded bg-pink-950 border border-pink-500/40 text-pink-300 text-[10px] font-bold">
                          Môn Năng Khiếu
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 font-mono">
                      {combo.hasData ? <>Điểm tham khảo: <strong className="text-emerald-300 font-bold">{combo.officialScore}đ</strong></> : <span className="text-slate-400">Nhập điểm để so sánh tổ hợp này</span>}
                      {combo.effectivePriority > 0 && <span className="text-amber-300 text-[11px] ml-1">(+ {combo.effectivePriority}đ ưu tiên TT06)</span>}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {combo.code === 'A00' ? 'Toán – Vật lý – Hóa học' :
                       combo.code === 'A01' ? 'Toán – Vật lý – Tiếng Anh' :
                       combo.code === 'D01' ? 'Toán – Ngữ văn – Tiếng Anh' :
                       combo.code === 'C00' ? 'Ngữ văn – Lịch sử – Địa lý' :
                       combo.code === 'H00' ? 'Ngữ văn – Hình họa – Bố cục màu' :
                       combo.code === 'V00' ? 'Toán – Vật lý – Vẽ mỹ thuật' :
                       combo.code === 'N00' ? 'Ngữ văn – Thẩm âm – Thanh nhạc' :
                       combo.code === 'T00' ? 'Toán – Sinh học – Năng khiếu Thể thao' :
                       'Tổ hợp chuẩn Bộ GD&ĐT'}
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs font-bold text-blue-300">
                      <span>{isSelected ? '✓ Đã chọn tổ hợp này' : 'Bấm để chọn'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next Step Trigger */}
            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('tab-major')}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Quay lại Bước 1
              </button>

              <button
                type="button"
                disabled={!selectedComboCode && !topCombo?.hasSubjectScores}
                onClick={() => {
                  sfx.playUiClick();
                  if (!selectedComboCode && topCombo?.hasSubjectScores) {
                    setSelectedComboCode(topCombo.code);
                  }
                  setActiveTab('tab-university');
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Tiếp tục sang Bước 3: Phân tầng trường đại học</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          BƯỚC 3: CHỌN TRƯỜNG ĐẠI HỌC (KINH PHÍ NĐ 238 + ĐỊA CHỈ + PHÂN TẦNG)
          ========================================================================= */}
      {activeTab === 'tab-university' && (
        <section className="space-y-5">
          {/* Header Info */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-blue-300 font-bold block">MỤC TIÊU ĐANG XÉT:</span>
              <h3 className="font-bold text-base text-white">
                Ngành {currentMajor?.name} · Tổ hợp {selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'chưa chọn')}{topCombo?.hasData ? ' · ' + topCombo.officialScore + ' điểm' : ''}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('tab-combo')}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              ← Đổi tổ hợp khác
            </button>
          </div>

          {/* Branch Decision Card: CÓ / KHÔNG */}
          <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base sm:text-lg text-white">
                Bạn đã chọn được Trường đại học mục tiêu chưa?
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Sau khi có ngành và tổ hợp, để chọn trường chính xác cần đối chiếu <strong>kinh phí học phí (Nghị định 238/2025)</strong>, <strong>vùng miền địa lý</strong> và <strong>điểm chuẩn tham chiếu</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  sfx.playUiClick();
                  setHasSchoolChoice('YES');
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  hasSchoolChoice === 'YES'
                    ? 'bg-amber-950/80 border-amber-500 shadow-md ring-1 ring-amber-500/40 text-white'
                    : 'bg-[#141923] border-slate-700/80 hover:border-slate-500 text-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>✅ CÓ: Tôi đã có trường đại học mục tiêu</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Kiểm tra điểm chuẩn 3 năm và học phí của trường bạn nhắm tới
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-amber-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playUiClick();
                  setHasSchoolChoice('NO');
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  hasSchoolChoice === 'NO'
                    ? 'bg-blue-950/80 border-blue-500 shadow-md ring-1 ring-blue-500/40 text-white'
                    : 'bg-[#141923] border-slate-700/80 hover:border-slate-500 text-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <span>❓ CHƯA: Hãy phân tầng trường phù hợp cho tôi</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Thiết lập kinh phí &amp; vùng miền để phân 3 nhóm: Mơ ước, Vừa sức, An toàn
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Practical Constraints: Tuition Budget & Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Ngân sách học phí (NĐ 238/2025) */}
            <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Ngân sách học phí tham khảo mỗi năm:</span>
                </span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {maxTuition} triệu / năm
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={maxTuition}
                onChange={(e) => setMaxTuition(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>0 triệu</span>
                <span>33,7 triệu (bình quân tham khảo)</span>
                <span>100 triệu</span>
              </div>
              <p className="text-[11px] text-slate-400">Dữ liệu hiện có chưa chứa học phí riêng của từng trường; mức này so với bình quân ngành, không ẩn trường khỏi danh sách.</p>
            </div>

            {/* 2. Địa chỉ / Vùng miền mong muốn */}
            <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <span className="font-bold text-sm text-white">Địa Chỉ / Vùng Miền Mong Muốn Theo Học:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-mono">
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
                    onClick={() => {
                      setTargetRegionFilter(r.id as any);
                      setSelectedSchoolCode(null);
                    }}
                    className={`min-h-11 rounded-lg border text-center transition-colors cursor-pointer ${
                      targetRegionFilter === r.id
                        ? 'bg-blue-600 border-blue-500 text-white font-bold'
                        : 'bg-[#141923] border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3-Tier Stratified University Results */}
          <div className="p-4 rounded-xl bg-[#0E1117] border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="school-search" className="font-bold text-sm text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-400" />
                Lọc trong danh sách trường phù hợp
              </label>
              <span className="text-xs font-bold text-blue-300">{stratifiedSchools.totalSchools} trường khớp ngành, tổ hợp và khu vực</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="school-search"
                type="search"
                value={schoolSearchQuery}
                onChange={(e) => {
                  setSchoolSearchQuery(e.target.value);
                  setSelectedSchoolCode(null);
                }}
                placeholder="Tìm theo tên trường, mã trường hoặc tỉnh/thành"
                aria-label="Lọc trường theo tên, mã trường hoặc tỉnh thành"
                className="min-h-11 flex-1 bg-[#141923] border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  setSchoolSearchQuery('');
                  setTargetRegionFilter('ALL');
                  setMaxTuition(35);
                }}
                className="min-h-11 px-4 rounded-xl border border-slate-700 bg-[#141923] text-sm text-slate-200 hover:border-slate-500"
              >
                Đặt lại bộ lọc
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Đang xem {stratifiedSchools.totalSchools} trường có bản ghi xét tuyển chính thức cho ngành {currentMajor?.name} · tổ hợp {selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'chưa chọn')} · {targetRegionFilter === 'ALL' ? 'Toàn quốc' : ({ BAC: 'Miền Bắc', TRUNG: 'Miền Trung', NAM: 'Miền Nam', DBSCL: 'ĐBSCL' }[targetRegionFilter])}.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <span>Trường có dữ liệu xét tuyển cho ngành và tổ hợp đã chọn:</span>
            </h4>

            {/* Nhóm trường có mốc tuyển sinh gần với điểm hồ sơ */}
            <div className="space-y-2">
              <div className="text-xs font-mono font-bold text-blue-300 flex items-center gap-1.5">
                <span>{stratifiedSchools.hasScore ? 'NHÓM ĐIỂM GẦN MỨC THAM CHIẾU' : 'TRƯỜNG CÓ BẢN GHI NGÀNH / TỔ HỢP'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {stratifiedSchools.totalSchools === 0 && <p className="col-span-full text-sm text-slate-400">Kho hiện chưa có bản ghi khớp chính xác ngành {currentMajor?.name}{selectedComboCode ? ' và tổ hợp ' + selectedComboCode : ''} trong khu vực này.</p>}
                {stratifiedSchools.target.map(school => (
                  <div
                    key={school.code}
                    onClick={() => {
                      sfx.playActionSuccess();
                      setSelectedSchoolCode(school.code);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedSchoolCode === school.code
                        ? 'bg-blue-600/30 border-blue-400 ring-1 ring-blue-400 shadow-md'
                        : 'bg-[#141923] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white px-2 py-0.5 rounded bg-black/60">{school.code}</span>
                      <span className="text-slate-400">{school.city}</span>
                    </div>
                    <div className="font-bold text-xs text-white mt-1 line-clamp-1">{school.name}</div>
                    <div className="text-[11px] font-mono text-emerald-300 mt-1">
                      Mốc tuyển sinh tham chiếu: {school.benchmark}đ{school.margin !== null ? ' · Chênh lệch ' + (school.margin > 0 ? '+' : '') + school.margin + 'đ' : ''} · {school.recordCount} bản ghi
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Bình quân nhóm ngành: {school.sectorTuition != null ? school.sectorTuition + ' tr/năm' : 'chưa có dữ liệu'} · Ngân sách {maxTuition} tr/năm {school.isBudgetOk === null ? '' : school.isBudgetOk ? '· trong mức tham khảo' : '· vượt bình quân tham khảo'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dream Tier (Mơ ước) */}
            {stratifiedSchools.hasScore && <div className="space-y-2 pt-1">
              <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                <span>ĐIỂM HỒ SƠ THẤP HƠN MỐC THAM CHIẾU:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {stratifiedSchools.dream.map(school => (
                  <div
                    key={school.code}
                    onClick={() => {
                      sfx.playActionSuccess();
                      setSelectedSchoolCode(school.code);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedSchoolCode === school.code
                        ? 'bg-amber-600/30 border-amber-400 ring-1 ring-amber-400 shadow-md'
                        : 'bg-[#141923] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white px-2 py-0.5 rounded bg-black/60">{school.code}</span>
                      <span className="text-slate-400">{school.city}</span>
                    </div>
                    <div className="font-bold text-xs text-white mt-1 line-clamp-1">{school.name}</div>
                    <div className="text-[11px] font-mono text-amber-300 mt-1">
                      Mốc tuyển sinh tham chiếu: {school.benchmark}đ · Chênh lệch {school.margin}đ
                    </div>
                  </div>
                ))}
              </div>
            </div>}

            {/* Nhóm có điểm cao hơn mốc tham chiếu */}
            {stratifiedSchools.hasScore && <div className="space-y-2 pt-1">
              <div className="text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                <span>ĐIỂM HỒ SƠ CAO HƠN MỐC THAM CHIẾU:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {stratifiedSchools.safe.map(school => (
                  <div
                    key={school.code}
                    onClick={() => {
                      sfx.playActionSuccess();
                      setSelectedSchoolCode(school.code);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedSchoolCode === school.code
                        ? 'bg-emerald-600/30 border-emerald-400 ring-1 ring-emerald-400 shadow-md'
                        : 'bg-[#141923] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white px-2 py-0.5 rounded bg-black/60">{school.code}</span>
                      <span className="text-slate-400">{school.city}</span>
                    </div>
                    <div className="font-bold text-xs text-white mt-1 line-clamp-1">{school.name}</div>
                    <div className="text-[11px] font-mono text-emerald-300 mt-1">
                      Mốc tuyển sinh tham chiếu: {school.benchmark}đ · Chênh lệch +{school.margin}đ
                    </div>
                  </div>
                ))}
              </div>
            </div>}

            {/* Next Step Trigger */}
            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setActiveTab('tab-combo')}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Quay lại Bước 2
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playUiClick();
                  setActiveTab('tab-domino');
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Tiếp tục sang Bước 4: Việc làm &amp; Chuỗi ảnh hưởng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          BƯỚC 4: ĐỊNH HƯỚNG VIỆC LÀM & CHUỖI ẢNH HƯỞNG (DOMINO EFFECT)
          ========================================================================= */}
      {activeTab === 'tab-domino' && (
        <section className="space-y-5">
          {/* Header Summary */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-purple-300 font-bold block">ĐỐI CHIẾU HỒ SƠ TỔNG HỢP:</span>
              <h3 className="font-bold text-base text-white">
                {currentMajor?.name} · {selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'chưa chọn')} · {currentSchool ? (currentSchool.name || currentSchool.schoolName) : 'Trường chưa chọn'}
              </h3>
            </div>
          </div>

          {/* Branch Decision Card: CÓ / KHÔNG VỀ VIỆC LÀM */}
          <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold text-base sm:text-lg text-white">
                Bạn đã xác định vị trí việc làm mong muốn sau khi tốt nghiệp chưa?
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  sfx.playUiClick();
                  setHasJobChoice('YES');
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  hasJobChoice === 'YES'
                    ? 'bg-purple-950/80 border-purple-500 shadow-md ring-1 ring-purple-500/40 text-white'
                    : 'bg-[#141923] border-slate-700/80 hover:border-slate-500 text-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-white">
                    ✅ CÓ: Tôi đã có công việc mục tiêu cụ thể
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Nhập vị trí việc làm để đối chiếu với chuẩn đầu ra của ngành
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-400 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playUiClick();
                  setHasJobChoice('NO');
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  hasJobChoice === 'NO'
                    ? 'bg-blue-950/80 border-blue-500 shadow-md ring-1 ring-blue-500/40 text-white'
                    : 'bg-[#141923] border-slate-700/80 hover:border-slate-500 text-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-white">
                    ❓ CHƯA: Đề xuất các việc làm thực tế khớp ngành
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Xem các vị trí công việc được liên kết với ngành trong danh mục
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Suggested Career Roles Grid */}
          <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-3">
            <h4 className="font-bold text-sm text-white">
              Vị Trí Việc Làm Thực Tế Khớp Với Ngành {currentMajor?.name}:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(currentMajor?.targetJobs || []).map((job: string) => (
                <div
                  key={job}
                  onClick={() => {
                    sfx.playActionSuccess();
                    setTargetJob(job);
                  }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    targetJob === job
                      ? 'bg-purple-600/30 border-purple-400 ring-1 ring-purple-400 shadow-md'
                      : 'bg-[#141923] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-white">{job}</div>
                  <div className="text-[11px] text-purple-300 font-bold mt-2">
                    {targetJob === job ? '✓ Đã chọn việc làm này' : 'Bấm chọn làm mục tiêu'}
                  </div>
                </div>
              ))}
              {!currentMajor?.targetJobs?.length && <p className="text-sm text-slate-400">Danh mục hiện chưa có dữ liệu nghề cụ thể cho ngành này. Vui lòng chọn nghề mục tiêu để lưu vào hồ sơ.</p>}
            </div>
          </div>

          {/* Báo cáo liên kết lựa chọn */}
          <div className="p-6 rounded-2xl bg-[#0E1117] border border-emerald-500/50 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-lg">📊</span>
              <h4 className="font-bold text-base sm:text-lg text-white font-mono uppercase tracking-wider">
                BÁO CÁO ĐỐI CHIẾU &amp; PHÂN TÍCH CHUỖI ẢNH HƯỞNG (DOMINO EFFECT)
              </h4>
            </div>

            {/* 1. Kiểm tra độ khớp */}
            <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-2">
              <div className="font-bold text-xs text-emerald-300 font-mono uppercase">
                1. KIỂM TRA ĐỘ KHỚP (NGÀNH ⟷ TỔ HỢP ⟷ TRƯỜNG ⟷ VIỆC LÀM):
              </div>
              <ul className="text-xs text-slate-200 space-y-1.5 leading-relaxed font-sans">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Ngành &amp; Tổ hợp</strong>: <strong>{selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'Chưa chọn')}</strong> được liên kết với ngành <strong>{currentMajor?.name}</strong> trong hồ sơ tư vấn.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Ngành &amp; Việc làm</strong>: Mục tiêu <strong>{targetJob || currentMajor?.targetJobs?.[0] || 'Chưa chọn'}</strong> được đối chiếu với danh sách nghề liên kết của ngành.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Kinh phí &amp; Trường học</strong>: Mức giới hạn {maxTuition} triệu/năm được so với bình quân nhóm ngành {stratifiedSchools.tuitionBenchmark?.avg2026_2027 ?? 'chưa có dữ liệu'} triệu/năm; đây không phải học phí riêng của trường.
                  </span>
                </li>
              </ul>
            </div>

            {/* 2. Phân tích What-If */}
            <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-2">
              <div className="font-bold text-xs text-blue-300 font-mono uppercase">
                2. PHÂN TÍCH CHUỖI ẢNH HƯỞNG (WHAT-IF ANALYSIS):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-200">
                <div className="p-3 rounded-lg bg-[#141923] border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">[Ngành ➔ Điểm chuẩn]</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {topCombo?.hasData ? 'Điểm hồ sơ ' + topCombo.officialScore + 'đ được đối chiếu với mốc tuyển sinh tham chiếu của ' + stratifiedSchools.totalSchools + ' trường có dữ liệu cho lựa chọn này.' : 'Chưa có điểm số để so sánh với mốc tuyển sinh. Hãy nhập điểm dự kiến hoặc điểm từng môn ở Bước 2.'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#141923] border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">[Tổ hợp ➔ Cạnh tranh]</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Có {stratifiedSchools.totalSchools} trường trong dữ liệu có bản ghi gắn với tổ hợp {selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'chưa chọn')} cho ngành đang xét.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#141923] border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">[Ngành ➔ Việc làm]</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {targetJob || currentMajor?.targetJobs?.[0] ? 'Vị trí ' + (targetJob || currentMajor?.targetJobs?.[0]) + ' được liên kết với ngành ' + currentMajor?.name + ' trong danh mục; kho hiện chưa có dữ liệu đầu ra riêng theo trường.' : 'Hãy chọn một vị trí từ danh sách để hoàn tất liên kết nghề nghiệp.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetAll}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                Khởi tạo lại chu trình
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenAIChat?.(`Phân tích chuyên sâu về chuỗi ảnh hưởng: Ngành ${currentMajor?.name}, Tổ hợp ${selectedComboCode || topCombo?.code}, Trường ${selectedSchoolCode || 'Top'}, Việc làm ${targetJob}`);
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mở Pop-up Tham Vấn Chuyên Sâu Cùng AI</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
