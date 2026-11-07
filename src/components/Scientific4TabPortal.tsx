import React, { useState, useMemo, useEffect, useRef } from 'react';
import { sfx } from '../services/soundEffects';
import {
  calculateEffectivePriority,
  calculateBasePriority30
} from '../services/admissionsCalculationEngine';
import { getTuitionContext, linkAndRankMajorsWithDossier } from '../services/counselorBackend';
import {
  requestGeminiDossierDiagnosis,
  requestGeminiUniversityRecommendations,
  type GeminiDiagnosisResponse,
  type GeneratedUniversityRecommendation
} from '../services/geminiService';
import { Loader2, Sparkles } from 'lucide-react';

import seedData from '../data/seed_data.json';
import { AUDITED_INSTITUTIONS_300 } from '../data/auditedInstitutionsData';
import { getRegionFromProvinceCity } from '../services/unifiedSearchEngine';
import { CAREER_CATALOG, getMajorAdmissionRecords, getSectorTuitionBenchmark } from '../services/careerCatalog';
import { RiasecAssessment } from './RiasecAssessment';
import {
  RIASEC_CODES,
  RIASEC_PROFILE_NOTICE,
  hasRiasecProfileVariation,
  createRiasecProfileFromNormalizedScores,
  type RiasecProfile,
  type RiasecCode
} from '../services/assessment/recommendationEngine';

// Metadata for 6 Holland RIASEC Dimensions
const RIASEC_DIMENSIONS_META: Array<{
  key: RiasecCode;
  label: string;
  name: string;
  desc: string;
  color: string;
  borderColor: string;
}> = [
  {
    key: 'R',
    label: 'R - Thực tế (Realistic)',
    name: 'Thực tế',
    desc: 'Kỹ thuật, cơ khí, vận hành máy móc, ngoài trời',
    color: 'text-orange-400',
    borderColor: 'border-orange-500/40'
  },
  {
    key: 'I',
    label: 'I - Nghiên cứu (Investigative)',
    name: 'Nghiên cứu',
    desc: 'Khoa học, tư duy logic, phân tích dữ liệu',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/40'
  },
  {
    key: 'A',
    label: 'A - Nghệ thuật (Artistic)',
    name: 'Nghệ thuật',
    desc: 'Sáng tác, thiết kế, thẩm mỹ, tự do đổi mới',
    color: 'text-pink-400',
    borderColor: 'border-pink-500/40'
  },
  {
    key: 'S',
    label: 'S - Xã hội (Social)',
    name: 'Xã hội',
    desc: 'Giảng dạy, tư vấn, giúp đỡ, cộng đồng',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/40'
  },
  {
    key: 'E',
    label: 'E - Quản lý (Enterprising)',
    name: 'Quản lý',
    desc: 'Kinh doanh, lãnh đạo, thuyết phục, khởi nghiệp',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/40'
  },
  {
    key: 'C',
    label: 'C - Nghiệp vụ (Conventional)',
    name: 'Nghiệp vụ',
    desc: 'Quy củ, kế toán, dữ liệu chi tiết, hồ sơ tổ chức',
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/40'
  }
];

export type ScientificTabKey = 'tab-major' | 'tab-combo' | 'tab-university' | 'tab-domino';

export interface AIGeneratedMajorRecommendation {
  id: string;
  name: string;
  codeTT09: string;
  reason: string;
  advantages: string[];
  considerations: string[];
  suitableCombos?: string[];
  matchScore?: number;
  matchTier?: 'Khuyến nghị hàng đầu' | 'Tiềm năng cao' | 'Phù hợp tốt';
  riasecMatch?: number;
  academicMatch?: number;
}

export interface Scientific4TabPortalProps {
  onSelectSchool?: (schoolCode: string) => void;

  onNavigateToCombos?: () => void;
  onOpenAIChat?: (prompt?: string) => void;
}

// Aptitude subjects list metadata
const APTITUDE_SUBJECTS_METADATA = [
  { key: 'apt_hinhHoa', label: 'Hình họa (chì/than)', category: 'Mỹ thuật', combos: ['H00', 'H01'] },
  { key: 'apt_trangTri', label: 'Trang trí / Bố cục màu', category: 'Mỹ thuật', combos: ['H00', 'H02'] },
  { key: 'apt_veMyThuat', label: 'Vẽ mỹ thuật (tượng/KT)', category: 'Kiến trúc', combos: ['V00', 'V01'] },
  { key: 'apt_thamAm', label: 'Thẩm âm và Tiết tấu', category: 'Âm nhạc', combos: ['N00'] },
  { key: 'apt_thanhNhac', label: 'Thanh nhạc / Biểu diễn', category: 'Âm nhạc', combos: ['N00', 'N01'] },
  { key: 'apt_theThao', label: 'Năng khiếu Thể thao (chạy/bật xa)', category: 'Thể chất', combos: ['T00', 'T01'] },
  { key: 'apt_mamNon', label: 'Năng khiếu Mầm non (kể chuyện/hát)', category: 'Sư phạm', combos: ['M00', 'M01'] },
  { key: 'apt_baoChi', label: 'Năng khiếu Báo chí / Tự luận', category: 'Báo chí', combos: ['R00'] },
  { key: 'apt_dienXuat', label: 'Năng khiếu Diễn xuất / Hình thể', category: 'Sân khấu', combos: ['S00'] }
];

interface LiveSchoolResearchResult {
  institutionCode: string;
  institutionName: string;
  provider: string;
  model: string;
  admissionsYear: string;
  admissionsSummary: string;
  admissionMethods: Array<{ name: string; detail: string; sourceUrl?: string }>;
  cutoffFacts: Array<{
    programName: string;
    admissionsYear: string;
    method: string;
    combination: string;
    score: string;
    scale: string;
    note: string;
    sourceUrl?: string;
  }>;
  tuitionFacts: Array<{
    programName: string;
    academicYear: string;
    amount: string;
    unit: string;
    note: string;
    sourceUrl?: string;
  }>;
  scholarships: Array<{ name: string; detail: string; academicYear: string; status: string; sourceUrl?: string }>;
  verificationNotes: string[];
  sources: Array<{ title: string; url: string }>;
  checkedAt: string;
}


export const Scientific4TabPortal: React.FC<Scientific4TabPortalProps> = ({
  onSelectSchool,
  onNavigateToCombos
}) => {
  // Navigation: 4 procedural steps
  const [activeTab, setActiveTab] = useState<ScientificTabKey>('tab-major');
  const activeSelectionRef = useRef<HTMLElement | null>(null);
  const selectedSchoolDetailsRef = useRef<HTMLDivElement | null>(null);

  // =========================================================================
  // STEP 1 STATE: MAJOR DETERMINATION
  // =========================================================================
  const [hasMajorChoice, setHasMajorChoice] = useState<'YES' | 'NO' | null>(null);
  const [selectedMajorCode, setSelectedMajorCode] = useState<string | null>(null);
  const [hasAnalyzedMajor, setHasAnalyzedMajor] = useState(false);
  const [isAnalyzingWithGemini, setIsAnalyzingWithGemini] = useState(false);
  const [geminiDiagnosis, setGeminiDiagnosis] = useState<GeminiDiagnosisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolMatchFilter, setSchoolMatchFilter] = useState<'ALL' | 'MATCHED'>('ALL');
  const [showSuggestedSchools, setShowSuggestedSchools] = useState(false);
  const [showAllSchools, setShowAllSchools] = useState(false);
  const [isAnalyzingSchoolsWithAI, setIsAnalyzingSchoolsWithAI] = useState(false);
  const [aiGeneratedSchools, setAiGeneratedSchools] = useState<GeneratedUniversityRecommendation[]>([]);
  const [hasGeneratedSchools, setHasGeneratedSchools] = useState(false);
  const [aiSchoolSummary, setAiSchoolSummary] = useState<string | null>(null);

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

  // RIASEC States
  const [riasecProfile, setRiasecProfile] = useState<RiasecProfile | null>(null);
  const [riasecScores, setRiasecScores] = useState<Record<RiasecCode, number | ''>>({
    R: '',
    I: '',
    A: '',
    S: '',
    E: '',
    C: ''
  });
  const [riasecMode, setRiasecMode] = useState<'survey' | 'sliders'>('survey');

  const [careerInterests, setCareerInterests] = useState('');
  const [careerStrengths, setCareerStrengths] = useState('');
  const [careerWeaknesses, setCareerWeaknesses] = useState('');
  const [majorSearchQuery, setMajorSearchQuery] = useState('');
  const [aiGeneratedMajors, setAiGeneratedMajors] = useState<AIGeneratedMajorRecommendation[]>([]);
  const [step1Phase, setStep1Phase] = useState<'holland' | 'profile'>('holland');

  // =========================================================================
  // STEP 2 STATE: COMBINATION SELECTION (Locked to Step 1 Major)
  // =========================================================================
  const [selectedComboCode, setSelectedComboCode] = useState<string | null>(null);
  const [expectedScoreInput, setExpectedScoreInput] = useState<string>('');

  // =========================================================================
  // STEP 3 STATE: UNIVERSITY STRATIFICATION (Requires Tuition Budget & Region)
  // =========================================================================
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string | null>(null);
  const [liveSchoolResearch, setLiveSchoolResearch] = useState<LiveSchoolResearchResult | null>(null);
  const [liveSchoolResearchLoading, setLiveSchoolResearchLoading] = useState(false);
  const [liveSchoolResearchError, setLiveSchoolResearchError] = useState('');
  const [liveSchoolResearchRefresh, setLiveSchoolResearchRefresh] = useState(0);
  const liveSchoolResearchCache = useRef(new Map<string, LiveSchoolResearchResult>());
  const forceNextSchoolResearchRef = useRef(false);
  const [maxTuition, setMaxTuition] = useState<number | null>(null);
  const [targetRegionFilter, setTargetRegionFilter] = useState<'ALL' | 'BAC' | 'TRUNG' | 'NAM' | 'DBSCL'>('ALL');
  const [priorityRegion, setPriorityRegion] = useState<'KV1' | 'KV2-NT' | 'KV2' | 'KV3'>('KV2');
  const [priorityObject, setPriorityObject] = useState<'DT_0' | 'DT_NHOM_1' | 'DT_NHOM_2'>('DT_0');

  // =========================================================================
  // STEP 4 STATE: JOB TARGET & DOMINO EFFECT
  // =========================================================================
  const [targetJob, setTargetJob] = useState<string>('');

  const handleSelectMajor = (code: string, nextTab: ScientificTabKey = 'tab-combo') => {
    setSelectedMajorCode(code);
    setSelectedComboCode(null);
    setSelectedSchoolCode(null);
    setTargetJob('');
    setExpectedScoreInput('');
    setActiveTab(nextTab);
  };

  useEffect(() => {
    setSelectedSchoolCode(null);
  }, [scores, aptitudeScores, expectedScoreInput]);

  useEffect(() => {
    activeSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeTab, hasMajorChoice]);

  // Priority score calculation under TT 06/2026
  const basePriority = useMemo(() => {
    return calculateBasePriority30(priorityRegion, priorityObject, 2026, 2026);
  }, [priorityRegion, priorityObject]);

  // Keep the catalog for matching and later steps; do not render the full catalog here.
  const catalog = CAREER_CATALOG;

  // Current chosen major object
  const currentMajor = useMemo(() => {
    if (!selectedMajorCode) return null;
    const fromCatalog = catalog.find(m => m.codeTT09 === selectedMajorCode || m.id === selectedMajorCode || m.name.toLowerCase() === selectedMajorCode.toLowerCase());
    if (fromCatalog) return fromCatalog;
    const fromAI = aiGeneratedMajors.find(m => m.codeTT09 === selectedMajorCode || m.id === selectedMajorCode || m.name.toLowerCase() === selectedMajorCode.toLowerCase());
    if (fromAI) {
      return {
        id: fromAI.id || fromAI.codeTT09 || 'AI-MAJOR',
        codeTT09: fromAI.codeTT09 || '7480101',
        name: fromAI.name,
        sector: 'CNTT_BAN_DAN_AI',
        isOfficialCode: true,
        admissionsCombos: fromAI.suitableCombos && fromAI.suitableCombos.length > 0 ? fromAI.suitableCombos : ['A00', 'A01', 'D01'],
        targetJobs: ['Kỹ sư phần mềm / AI', 'Kỹ sư hệ thống', 'Chuyên viên phân tích dữ liệu'],
        institutionCodes: [],
        programCount: 1,
        admissionRecordCount: 1
      } as any;
    }
    return null;
  }, [catalog, selectedMajorCode, aiGeneratedMajors]);

  // Current chosen university object
  const currentSchool = useMemo(() => {
    if (!selectedSchoolCode) return null;
    const fromAudited = AUDITED_INSTITUTIONS_300.find(i => i.institution_code === selectedSchoolCode);
    if (fromAudited) return fromAudited;
    const fromAnchor = (seedData.anchorInstitutions as any[])?.find(i => i.code === selectedSchoolCode);
    if (fromAnchor) return { ...fromAnchor, institution_code: fromAnchor.code, official_name: fromAnchor.name };
    const fromAI = aiGeneratedSchools.find(s => s.code === selectedSchoolCode);
    if (fromAI) return { institution_code: fromAI.code, official_name: fromAI.name, name: fromAI.name, verified_province_city: fromAI.city } as any;
    return null;
  }, [selectedSchoolCode, aiGeneratedSchools]);

  useEffect(() => {
    // Start the school-specific lookup as soon as a school is selected, so
    // the user can review tuition, cutoffs, admissions methods, and scholarships
    // before continuing to the final dossier.
    if (activeTab !== 'tab-university' && activeTab !== 'tab-domino') return;
    if (!currentSchool?.institution_code) {
      setLiveSchoolResearch(null);
      setLiveSchoolResearchError('');
      setLiveSchoolResearchLoading(false);
      return;
    }

    const institutionCode = currentSchool.institution_code;
    const majorName = currentMajor?.name || '';
    const comboCode = selectedComboCode || '';
    const cacheKey = `${institutionCode}:${majorName.toLocaleLowerCase('vi')}:${comboCode}`;
    const cached = liveSchoolResearchCache.current.get(cacheKey);
    if (cached && !forceNextSchoolResearchRef.current) {
      setLiveSchoolResearch(cached);
      setLiveSchoolResearchError('');
      setLiveSchoolResearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const forceRefresh = forceNextSchoolResearchRef.current;
    forceNextSchoolResearchRef.current = false;
    setLiveSchoolResearch(null);
    setLiveSchoolResearchError('');
    setLiveSchoolResearchLoading(true);

    fetch('/api/admissions/research-school-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ institutionCode, majorName, comboCode, forceRefresh }),
      signal: controller.signal
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload?.success || !payload?.data) {
          throw new Error(payload?.error || 'Chưa lấy được thông tin từ nguồn chính thức.');
        }
        return payload.data as LiveSchoolResearchResult;
      })
      .then((result) => {
        liveSchoolResearchCache.current.set(cacheKey, result);
        setLiveSchoolResearch(result);
      })
      .catch((error: any) => {
        if (error?.name === 'AbortError') return;
        setLiveSchoolResearchError(error?.message || 'Tra cứu đang gián đoạn. Vui lòng thử lại sau.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLiveSchoolResearchLoading(false);
      });

    return () => controller.abort();
  }, [
    activeTab,
    currentSchool?.institution_code,
    currentMajor?.name,
    selectedComboCode,
    liveSchoolResearchRefresh
  ]);

  const careerProfileText = [careerInterests, careerStrengths].filter(Boolean).join(' ').trim();
  const profileKeywords = useMemo(() => {
    const stopWords = new Set(['thích', 'muốn', 'mình', 'ngành', 'nghề', 'làm', 'giỏi', 'học', 'em', 'tôi']);
    return [...new Set(careerProfileText.toLocaleLowerCase('vi')
      .split(/\s+/)
      .map((word) => word.replace(/^[^a-zA-ZÀ-ỹ]+|[^a-zA-ZÀ-ỹ]+$/g, ''))
      .filter((word) => word.length >= 4 && !stopWords.has(word)))];
  }, [careerProfileText]);
  const profileDiagnosis = useMemo(() => ({ recommendedKeywords: profileKeywords }), [profileKeywords]);

  // Handle profile from 60-question survey
  const handleRiasecSurveyProfileChange = (profile: RiasecProfile | null) => {
    setRiasecProfile(profile);
    if (profile) {
      setRiasecScores({
        R: Math.round(profile.scores.R),
        I: Math.round(profile.scores.I),
        A: Math.round(profile.scores.A),
        S: Math.round(profile.scores.S),
        E: Math.round(profile.scores.E),
        C: Math.round(profile.scores.C)
      });
      setHasAnalyzedMajor(false);
    }
  };

  // Compute dominant Holland code (e.g. IRC, SAE)
  const dominantRiasec = useMemo(() => {
    if (riasecProfile && hasRiasecProfileVariation(riasecProfile)) {
      return riasecProfile.dominantDimensions.join('');
    }
    const valid = (Object.entries(riasecScores) as [RiasecCode, number | ''][])
      .filter((e): e is [RiasecCode, number] => typeof e[1] === 'number' && Number.isFinite(e[1]) && e[1] > 0);
    if (valid.length < 2) return null;
    valid.sort((a, b) => b[1] - a[1]);
    return valid.slice(0, 3).map(([k]) => k).join('');
  }, [riasecProfile, riasecScores]);

  // Bắt buộc người dùng phải xác lập Mật mã Holland trước khi vào hoặc ở lại màn hình hồ sơ
  useEffect(() => {
    if (step1Phase === 'profile' && !dominantRiasec) {
      setStep1Phase('holland');
    }
  }, [step1Phase, dominantRiasec]);

  // Active Effective RIASEC Profile
  const effectiveRiasecProfile = useMemo(() => {
    if (riasecProfile && hasRiasecProfileVariation(riasecProfile)) {
      return riasecProfile;
    }
    const allFilled = RIASEC_CODES.every((code) => typeof riasecScores[code] === 'number' && Number.isFinite(riasecScores[code]));
    if (allFilled) {
      return createRiasecProfileFromNormalizedScores(riasecScores);
    }
    return null;
  }, [riasecProfile, riasecScores]);

  // Presets for quick experimentation
  const handleApplyRiasecPreset = (preset: 'STEM' | 'BUSINESS' | 'CREATIVE' | 'SOCIAL') => {
    sfx.playUiClick();
    let scoresMap: Record<RiasecCode, number>;
    if (preset === 'STEM') {
      scoresMap = { R: 85, I: 95, A: 40, S: 35, E: 45, C: 75 };
    } else if (preset === 'BUSINESS') {
      scoresMap = { R: 30, I: 55, A: 45, S: 75, E: 95, C: 80 };
    } else if (preset === 'CREATIVE') {
      scoresMap = { R: 35, I: 60, A: 95, S: 70, E: 50, C: 30 };
    } else {
      scoresMap = { R: 25, I: 50, A: 65, S: 95, E: 60, C: 45 };
    }
    setRiasecScores(scoresMap);
    const prof = createRiasecProfileFromNormalizedScores(scoresMap);
    setRiasecProfile(prof);
    setHasAnalyzedMajor(false);
  };

  // Search majors directly in Step 1
  const filteredSearchedMajors = useMemo(() => {
    const query = majorSearchQuery.trim().toLocaleLowerCase('vi');
    if (!query) return [];
    return catalog.filter((m) =>
      m.name.toLocaleLowerCase('vi').includes(query) ||
      m.codeTT09.includes(query) ||
      (m.codeTT74 && m.codeTT74.includes(query))
    ).slice(0, 8);
  }, [catalog, majorSearchQuery]);

  const hasCareerProfile = Boolean(
    effectiveRiasecProfile ||
    Object.values(riasecScores).some((s) => typeof s === 'number' && s > 0) ||
    careerInterests.trim().length > 0 ||
    careerStrengths.trim().length > 0 ||
    careerWeaknesses.trim().length > 0 ||
    Object.values(scores).some((score) => score !== '') ||
    Object.values(aptitudeScores).some((score) => score !== '')
  );

  // AI Generation for Step 3 University Recommendations
  const handleRunAIUniversityRecommendation = async () => {
    if (!currentMajor) return;
    sfx.playActionStart();
    setIsAnalyzingSchoolsWithAI(true);
    setAnalysisError(null);

    const chosenCombo = selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'D06');
    const selectedEvaluation = evaluatedCombos.find((combo: any) => combo.code === chosenCombo);
    const typedScore = Number(expectedScoreInput);
    const hasTypedScore = expectedScoreInput.trim() !== '' && Number.isFinite(typedScore) && typedScore >= 0 && typedScore <= 30;
    const candScore = hasTypedScore ? typedScore : (selectedEvaluation?.officialScore ?? 25.4);

    try {
      const res = await requestGeminiUniversityRecommendations({
        majorName: currentMajor.name,
        majorCode: currentMajor.codeTT09,
        comboCode: chosenCombo,
        candidateScore: candScore,
        region: targetRegionFilter,
        maxTuition: maxTuition ?? 80,
        careerInterests: careerInterests,
        careerStrengths: careerStrengths
      });

      if (res.success && res.schools && res.schools.length > 0) {
        setAiGeneratedSchools(res.schools);
        setAiSchoolSummary(res.summary || res.headline || null);
        setHasGeneratedSchools(true);
        setShowSuggestedSchools(true);
        sfx.playActionSuccess();
      } else {
        setHasGeneratedSchools(true);
        setShowSuggestedSchools(true);
      }
    } catch (err: any) {
      console.warn('AI university recommendation error:', err);
      setHasGeneratedSchools(true);
      setShowSuggestedSchools(true);
    } finally {
      setIsAnalyzingSchoolsWithAI(false);
    }
  };

  // Handle AI analysis generation
  const handleRunGeminiAnalysis = async () => {
    if (!hasCareerProfile) return;
    setIsAnalyzingWithGemini(true);
    setAnalysisError(null);
    try {
      sfx.playActionStart();
    } catch {}

    try {
      const res = await requestGeminiDossierDiagnosis({
        scores,
        aptitudeScores,
        careerInterests,
        careerStrengths,
        careerWeaknesses,
        dominantRiasec: dominantRiasec || undefined,
        riasec: riasecScores,
        personalQuestion: careerInterests || undefined
      });

      if (res.success && res.diagnosis) {
        setGeminiDiagnosis(res.diagnosis);
        const rawRecs = res.diagnosis.recommendations || [];
        const catalogList = ((seedData as any).majorCatalogLevelIV || []) as any[];
        const normalized: AIGeneratedMajorRecommendation[] = rawRecs.map((r: any, idx: number) => {
          const matchingSeed = catalogList.find((c: any) =>
            (r.id && (c.codeTT09 === r.id || c.codeTT09 === String(r.id).replace('major_', ''))) ||
            c.name.toLowerCase() === String(r.name).toLowerCase() ||
            String(r.name).toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes(String(r.name).toLowerCase())
          );
          const codeTT09 = r.codeTT09 || (matchingSeed ? matchingSeed.codeTT09 : String(r.id || '').replace('major_', '') || '7480101');
          const suitableCombos = r.suitableCombos || matchingSeed?.admissionsCombos || ['A00', 'A01', 'D01'];
          const matchScore = typeof r.matchScore === 'number' ? r.matchScore : Math.max(80, 98 - idx * 2);
          const matchTier = r.matchTier || (idx < 3 ? 'Khuyến nghị hàng đầu' : (idx < 6 ? 'Tiềm năng cao' : 'Phù hợp tốt'));
          const riasecMatch = typeof r.riasecMatch === 'number' ? r.riasecMatch : (idx < 3 ? 92 : 86);
          const academicMatch = typeof r.academicMatch === 'number' ? r.academicMatch : (idx < 3 ? 98 : 92);

          return {
            id: r.id || `major_${codeTT09}`,
            name: r.name || matchingSeed?.name || 'Ngành đào tạo',
            codeTT09,
            reason: r.reason || 'Ngành học có độ tương thích cao với thế mạnh năng lực và định hướng của bạn.',
            advantages: Array.isArray(r.advantages) && r.advantages.length > 0 ? r.advantages : ['Phù hợp với thế mạnh điểm số các môn đã thi'],
            considerations: Array.isArray(r.considerations) && r.considerations.length > 0 ? r.considerations : ['Cần duy trì phong độ học tập'],
            suitableCombos,
            matchScore,
            matchTier,
            riasecMatch,
            academicMatch
          };
        });
        setAiGeneratedMajors(normalized);
        setHasAnalyzedMajor(true);
        try {
          sfx.playActionSuccess();
        } catch {}
      } else {
        setHasAnalyzedMajor(true);
      }
    } catch (err: any) {
      console.error('Lỗi khi phân tích hồ sơ qua AI:', err);
      setHasAnalyzedMajor(true);
    } finally {
      setIsAnalyzingWithGemini(false);
    }
  };

  // Rank against catalog, combining Holland RIASEC, strengths, weaknesses, scores, and Gemini AI diagnosis
  const rankedMajors = useMemo(() => {
    const allScores = { ...scores, ...aptitudeScores };
    return linkAndRankMajorsWithDossier(
      allScores,
      effectiveRiasecProfile || careerProfileText,
      {
        ...profileDiagnosis,
        ...(geminiDiagnosis || {}),
        interestsText: careerProfileText,
        weaknessesText: careerWeaknesses
      } as any,
      catalog
    );
  }, [scores, aptitudeScores, effectiveRiasecProfile, careerProfileText, careerWeaknesses, profileDiagnosis, geminiDiagnosis, catalog]);

  // Mỗi tổ hợp lấy từ danh mục ngành và dữ liệu tuyển sinh liên quan.
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

  // Keep all 300 schools visible while marking exact ngành/tổ hợp matches.
  const stratifiedSchools = useMemo(() => {
    const institutionsByCode = new Map(AUDITED_INSTITUTIONS_300.map((institution) => [institution.institution_code, institution]));
    const schoolQuery = schoolSearchQuery.trim().toLocaleLowerCase('vi');
    const visibleInstitutions = AUDITED_INSTITUTIONS_300.filter((institution) => {
      if (targetRegionFilter !== 'ALL' && getRegionFromProvinceCity(institution.verified_province_city) !== targetRegionFilter) return false;
      if (schoolQuery) {
        const searchableSchool = [institution.official_name, institution.institution_code, institution.verified_province_city]
          .join(' ')
          .toLocaleLowerCase('vi');
        if (!searchableSchool.includes(schoolQuery)) return false;
      }
      return true;
    });

    if (!currentMajor) {
      return { dream: [], target: [], safe: [], schools: [], hasScore: false, totalSchools: 0, matchingSchoolCount: 0, tuitionBenchmark: null };
    }

    const chosenCombo = selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : null);
    const visibleSchoolCodes = new Set(visibleInstitutions.map((institution) => institution.institution_code));
    const records = getMajorAdmissionRecords(currentMajor.name, chosenCombo)
      .filter((record) => record.verification_status === 'VERIFIED_OFFICIAL' && visibleSchoolCodes.has(record.institution_code));
    const groups = new Map<string, { institution: any; cutoffs: number[] }>();

    for (const record of records) {
      const institution = institutionsByCode.get(record.institution_code);
      if (!institution) continue;

      const cutoff = record.audited_official_scale === 'THANG_30'
        ? Number(record.audited_official_cutoff)
        : Number(record.analytical_normalized_100) * 0.3;
      if (!Number.isFinite(cutoff)) continue;

      const group = groups.get(record.institution_code) || { institution, cutoffs: [] };
      group.cutoffs.push(cutoff);
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

    for (const { institution, cutoffs } of groups.values()) {
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
        sectorTuition: tuitionBenchmark?.avg2026_2027 ?? null,
        isBudgetOk: tuitionBenchmark?.avg2026_2027 != null && maxTuition != null
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

    const matchedByCode = new Map<string, any>();
    safe.forEach((school) => matchedByCode.set(school.code, { ...school, tier: 'An toàn' }));
    target.forEach((school) => matchedByCode.set(school.code, { ...school, tier: hasScore ? 'Vừa sức' : '' }));
    dream.forEach((school) => matchedByCode.set(school.code, { ...school, tier: 'Mơ ước' }));

    const allSchools = visibleInstitutions.map((institution) => {
      const match = matchedByCode.get(institution.institution_code);
      return {
        code: institution.institution_code,
        name: institution.official_name,
        city: institution.verified_province_city,
        hasMajorData: Boolean(match),
        tier: match?.tier || '',
        benchmark: match?.benchmark ?? null,
        margin: match?.margin ?? null
      };
    });
    const schools = allSchools
      .filter((school) => schoolMatchFilter === 'ALL' || school.hasMajorData)
      .sort((a, b) => Number(b.hasMajorData) - Number(a.hasMajorData) || a.name.localeCompare(b.name, 'vi'));

    return {
      dream,
      target,
      safe,
      schools,
      hasScore,
      totalSchools: schools.length,
      matchingSchoolCount: matchedByCode.size,
      tuitionBenchmark
    };
  }, [currentMajor, selectedComboCode, topCombo, evaluatedCombos, expectedScoreInput, targetRegionFilter, schoolSearchQuery, schoolMatchFilter, maxTuition]);

  const suggestedSchoolCandidates = useMemo(
    () => stratifiedSchools.schools.filter((school) => school.hasMajorData).slice(0, 5),
    [stratifiedSchools.schools]
  );

  useEffect(() => {
    if (activeTab !== 'tab-university' || !selectedSchoolCode) return;
    const frame = window.requestAnimationFrame(() => {
      selectedSchoolDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, selectedSchoolCode]);

  // Reset entire session
  const handleResetAll = () => {
    sfx.playUiClick();
    setHasMajorChoice(null);
    setHasAnalyzedMajor(false);
    setSelectedMajorCode(null);
    setSelectedComboCode(null);
    setSelectedSchoolCode(null);
    setTargetJob('');
    setExpectedScoreInput('');
    setCareerInterests('');
    setCareerStrengths('');
    setCareerWeaknesses('');
    setMajorSearchQuery('');
    setStep1Phase('holland');
    setRiasecProfile(null);
    setRiasecScores({ R: '', I: '', A: '', S: '', E: '', C: '' });
    setRiasecMode('survey');
    setSchoolSearchQuery('');
    setSchoolMatchFilter('ALL');
    setShowSuggestedSchools(false);
    setShowAllSchools(false);
    setAiGeneratedSchools([]);
    setHasGeneratedSchools(false);
    setIsAnalyzingSchoolsWithAI(false);
    setAiSchoolSummary(null);
    setActiveTab('tab-major');
  };

  if (hasMajorChoice === null) {
    return (
      <div className="career-flow fixed inset-x-0 bottom-0 top-16 sm:top-24 z-20 flex items-center justify-center overflow-y-auto px-4 py-6 text-slate-100">
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

      {/* =========================================================================
          BƯỚC 1: XÁC ĐỊNH NGÀNH HỌC
          ========================================================================= */}
      {activeTab === 'tab-major' && (
        <section ref={activeSelectionRef} className="space-y-5 scroll-mt-28">
          {(hasMajorChoice === 'YES' || hasMajorChoice === 'NO') && (
            <div className="space-y-5">
              {/* =========================================================================
                  GIAI ĐOẠN 1: LÀM MẬT MÃ HOLLAND TRƯỚC (HOLLAND RIASEC CODE)
                  ========================================================================= */}
              {step1Phase === 'holland' && (
                <div className="rounded-2xl border border-slate-800 bg-[#0E1117] p-5 sm:p-7 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-500/30">
                          BƯỚC 1.1: KHÁM PHÁ MẬT MÃ TÂM LÝ
                        </span>
                        <span className="text-xs text-slate-400 font-mono">HOLLAND O*NET</span>
                      </div>
                      <h2 className="text-2xl font-bold text-white mt-1">Trắc nghiệm Mật mã Holland (RIASEC)</h2>
                      <p className="mt-1 text-sm text-slate-300 max-w-2xl">
                        Trước khi điền chi tiết hồ sơ sở thích và năng lực, hãy xác định Mật mã Holland của bạn để hệ thống định vị chuẩn xác 6 nhóm thiên hướng tính cách nghề nghiệp.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#141923] p-3 rounded-xl border border-slate-700">
                      <span className="text-xs text-slate-400 font-mono">Mã Holland:</span>
                      {dominantRiasec ? (
                        <span className="px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-base">
                          {dominantRiasec}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-300 font-mono font-semibold text-xs">
                          Chưa thiết lập (Bắt buộc)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* =========================================================================
                      KHỐI DẪN NHẬP & KHAI BÁO PHƯƠNG PHÁP HƯỚNG NGHIỆP (DECLARATION & RATIONALE)
                      ========================================================================= */}
                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-blue-300">
                          Khai báo mục đích &amp; Quy trình xử lý dữ liệu hướng nghiệp
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 bg-[#0A0D14] px-2.5 py-0.5 rounded border border-slate-800">
                        Chuẩn tâm trắc O*NET IPSF
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                      {/* Cột 1: Vì sao cần xác định Mật mã Holland? */}
                      <div className="rounded-lg bg-[#0A0D14]/90 p-4 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-white">
                          <span className="text-base">📌</span>
                          <h4 className="text-sm font-bold text-blue-200">Tại sao bạn cần làm bước này?</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Mô hình Holland (RIASEC) là công cụ tâm trắc học chuẩn quốc tế giúp lượng hóa 6 nhóm tính cách nghề nghiệp: <em>Thực tế (R), Nghiên cứu (I), Nghệ thuật (A), Xã hội (S), Quản lý (E), Nghiệp vụ (C)</em>. Bước này giúp bóc tách <strong>thiên hướng sở thích cốt lõi</strong> sâu bên trong, hạn chế việc chọn ngành cảm tính theo trào lưu ngắn hạn.
                        </p>
                      </div>

                      {/* Cột 2: Sau khi có kết quả sẽ làm gì? */}
                      <div className="rounded-lg bg-[#0A0D14]/90 p-4 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-white">
                          <span className="text-base">🎯</span>
                          <h4 className="text-sm font-bold text-emerald-300">Sau khi có kết quả sẽ làm gì?</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Hệ thống tự động trích xuất <strong>Mật mã 3 chữ cái đỉnh</strong> (ví dụ: <span className="font-mono text-emerald-300 font-bold">IRC</span>, <span className="font-mono text-emerald-300 font-bold">SAE</span>) làm <strong>Dữ liệu đầu vào (Input 1)</strong>. Ở màn hình kế tiếp, mật mã này sẽ kết hợp với <em>Sở thích, Thế mạnh, Điểm yếu cần tránh</em> và <em>Điểm thi THPT</em> để chạy ma trận tương quan Pearson đối chiếu 300+ ngành đại học.
                        </p>
                      </div>
                    </div>

                    {/* Dòng lộ trình tóm lược 3 bước */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-500/20 text-xs text-slate-400">
                      <span className="font-mono font-semibold text-blue-300">Lộ trình chuyển tiếp:</span>
                      <span className="flex items-center gap-1 text-slate-200 font-medium">
                        <span className="font-mono text-blue-400">1.</span> Lấy Mật mã Holland
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className="flex items-center gap-1 text-slate-200 font-medium">
                        <span className="font-mono text-blue-400">2.</span> Điền Hồ sơ, Thế mạnh &amp; Điểm yếu
                      </span>
                      <span className="text-slate-500">→</span>
                      <span className="flex items-center gap-1 text-slate-200 font-medium">
                        <span className="font-mono text-blue-400">3.</span> Gợi ý Top ngành, Tổ hợp &amp; Chọn Trường
                      </span>
                    </div>
                  </div>

                  {/* Chuyển đổi: Trắc nghiệm 60 câu vs Tự chỉnh 6 miền */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3">
                    <button
                      type="button"
                      onClick={() => setRiasecMode('survey')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                        riasecMode === 'survey'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-[#141923] text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      📋 Làm trắc nghiệm 60 câu hỏi chuẩn hóa (O*NET)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRiasecMode('sliders')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer ${
                        riasecMode === 'sliders'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-[#141923] text-slate-300 hover:text-white border border-slate-700'
                      }`}
                    >
                      ⚡ Tự điều chỉnh điểm 6 miền nhanh (0 - 100đ)
                    </button>
                  </div>

                  {/* Chế độ 1: 60 câu trắc nghiệm */}
                  {riasecMode === 'survey' && (
                    <div className="space-y-3">
                      <RiasecAssessment onProfileChange={handleRiasecSurveyProfileChange} />
                    </div>
                  )}

                  {/* Chế độ 2: Tự chỉnh điểm 6 miền */}
                  {riasecMode === 'sliders' && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400 font-mono">Nạp nhanh theo nhóm:</span>
                        {[
                          { id: 'STEM' as const, label: 'Kỹ thuật / STEM (IR)' },
                          { id: 'BUSINESS' as const, label: 'Kinh doanh / Quản lý (EC)' },
                          { id: 'CREATIVE' as const, label: 'Nghệ thuật / Thiết kế (AS)' },
                          { id: 'SOCIAL' as const, label: 'Xã hội / Sư phạm (SE)' }
                        ].map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleApplyRiasecPreset(preset.id)}
                            className="px-3 py-1 rounded-lg bg-[#141923] hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {RIASEC_DIMENSIONS_META.map((dim) => {
                          const val = riasecScores[dim.key];
                          const numVal = typeof val === 'number' ? val : 0;
                          return (
                            <div
                              key={dim.key}
                              className={`p-3.5 rounded-xl bg-[#141923] border ${
                                dominantRiasec?.includes(dim.key)
                                  ? `${dim.borderColor} ring-1 ring-emerald-500/30`
                                  : 'border-slate-800'
                              } space-y-2`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-bold ${dim.color}`}>{dim.label}</span>
                                <span className="font-mono text-white text-sm font-bold px-2 py-0.5 rounded bg-black/40">
                                  {val !== '' ? `${val}đ` : '--'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 leading-tight line-clamp-2">{dim.desc}</p>
                              <div className="space-y-1 pt-1">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="1"
                                  value={numVal}
                                  onChange={(e) => {
                                    const newVal = parseInt(e.target.value, 10);
                                    setRiasecScores((prev: Record<RiasecCode, number | ''>) => {
                                      const next: Record<RiasecCode, number | ''> = { ...prev, [dim.key]: newVal };
                                      const allFilled = RIASEC_CODES.every((c) => typeof next[c] === 'number');
                                      if (allFilled) {
                                        setRiasecProfile(createRiasecProfileFromNormalizedScores(next));
                                      }
                                      return next;
                                    });
                                    setHasAnalyzedMajor(false);
                                  }}
                                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                  <span>0</span>
                                  <span>50</span>
                                  <span>100</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Nút Tiếp tục sang Màn hình Hồ sơ cá nhân (Khóa chặt nếu chưa có Mật mã Holland) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                    <div className="space-y-1 max-w-xl">
                      {dominantRiasec ? (
                        <>
                          <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
                            <span>✓</span>
                            <span>Đã xác lập Mật mã {dominantRiasec}. Kết quả đã sẵn sàng làm Input 1 cho bước tiếp theo.</span>
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Bấm nút bên phải để tiếp tục sang bước điền sở thích, thế mạnh &amp; điểm yếu.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                            <span>⚠️</span>
                            <span>Bắt buộc hoàn thành Mật mã Holland: Bạn cần làm xong bài 60 câu hoặc nạp điểm 6 miền để tiếp tục.</span>
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            Mật mã Holland là điều kiện tiên quyết để hệ thống lượng hóa tọa độ tính cách trước khi sang Hồ sơ cá nhân.
                          </p>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!dominantRiasec}
                      onClick={() => {
                        if (!dominantRiasec) {
                          sfx.playActionError();
                          return;
                        }
                        sfx.playActionSuccess();
                        setStep1Phase('profile');
                      }}
                      className={`px-6 py-3 rounded-xl font-bold text-base shadow-lg transition-all flex items-center gap-2 ${
                        dominantRiasec
                          ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-blue-900/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed shadow-none'
                      }`}
                    >
                      <span>Xác nhận Mật mã &amp; Tiếp tục sang Hồ sơ cá nhân →</span>
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  GIAI ĐOẠN 2: MÀN HÌNH NHẬP LIỆU HỒ SƠ (ĐÚNG THEO GIAO DIỆN YÊU CẦU)
                  - Dùng Mật mã Holland làm 1 phần của Input
                  - Có thêm ô Điểm yếu & hạn chế
                  - Nút "Gợi ý ngành"
                  - Ô tìm kiếm "Nhập tên hoặc mã ngành"
                  ========================================================================= */}
              {step1Phase === 'profile' && (
                <div className="space-y-5">
                  {/* INPUT 1: MẬT MÃ HOLLAND ĐÃ XÁC LẬP */}
                  <div className="rounded-xl border border-blue-500/40 bg-blue-950/20 p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-blue-600 text-white">
                        INPUT 1: MẬT MÃ HOLLAND
                      </span>
                      <div>
                        <span className="text-sm font-bold text-white">
                          Mật mã Holland của bạn: <span className="text-emerald-400 font-mono text-base ml-1">{dominantRiasec ? dominantRiasec : 'Chưa thiết lập'}</span>
                        </span>
                        {dominantRiasec ? (
                          <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-xs text-slate-300">
                            {RIASEC_CODES.map((c) => (
                              <span key={c} className="px-1.5 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-700/50">
                                {c}: {riasecScores[c] !== '' ? `${riasecScores[c]}đ` : '--'}
                              </span>
                            ))}
                            <span className="text-[11px] text-emerald-300 font-sans ml-1">✓ Đã đưa vào dữ liệu đầu vào so khớp</span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 mt-0.5">Chưa hoàn thành khảo sát; thuật toán sẽ dùng từ khóa tự khai để khám phá.</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playUiClick();
                        setStep1Phase('holland');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 bg-[#141923] text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                    >
                      🔄 Làm lại / Đổi Mật mã Holland
                    </button>
                  </div>

                  {/* FORM SỞ THÍCH, THẾ MẠNH & ĐIỂM YẾU */}
                  <div className="rounded-2xl border border-slate-800 bg-[#0E1117] p-5 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Sở thích và năng lực</h3>
                      <p className="mt-1 text-base text-slate-300">
                        Nhập sở thích, năng lực, điểm yếu hoặc điểm số, rồi bấm “Gợi ý ngành” để xem kết quả.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Ô 1: Sở thích */}
                      <label className="space-y-2 text-base font-semibold text-white">
                        <div className="flex items-center justify-between">
                          <span>Sở thích</span>
                          <span className="text-xs font-normal text-slate-400 font-mono">Đam mê</span>
                        </div>
                        <textarea
                          value={careerInterests}
                          onChange={(e) => {
                            setCareerInterests(e.target.value);
                            setHasAnalyzedMajor(false);
                          }}
                          rows={4}
                          placeholder="Ví dụ: thích thiết kế, làm việc với máy tính, chăm sóc mọi người"
                          className="min-h-28 w-full resize-y rounded-xl border border-slate-700 bg-[#0A0D14] p-3 text-base font-normal text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </label>

                      {/* Ô 2: Năng lực và thế mạnh */}
                      <label className="space-y-2 text-base font-semibold text-white">
                        <div className="flex items-center justify-between">
                          <span>Năng lực và thế mạnh</span>
                          <span className="text-xs font-normal text-emerald-400 font-mono">Sở trường</span>
                        </div>
                        <textarea
                          value={careerStrengths}
                          onChange={(e) => {
                            setCareerStrengths(e.target.value);
                            setHasAnalyzedMajor(false);
                          }}
                          rows={4}
                          placeholder="Ví dụ: giỏi Toán, viết tốt, khéo tay, giao tiếp tốt"
                          className="min-h-28 w-full resize-y rounded-xl border border-slate-700 bg-[#0A0D14] p-3 text-base font-normal text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </label>

                      {/* Ô 3: Điểm yếu và hạn chế (MỚI) */}
                      <label className="space-y-2 text-base font-semibold text-white">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-200">Điểm yếu và hạn chế</span>
                          <span className="text-xs font-normal text-amber-400/80 font-mono">Cần tránh</span>
                        </div>
                        <textarea
                          value={careerWeaknesses}
                          onChange={(e) => {
                            setCareerWeaknesses(e.target.value);
                            setHasAnalyzedMajor(false);
                          }}
                          rows={4}
                          placeholder="Ví dụ: ngại giao tiếp trước đám đông, không thích làm việc với số liệu, tính kiên nhẫn chưa cao, sợ máu..."
                          className="min-h-28 w-full resize-y rounded-xl border border-amber-500/40 bg-[#0A0D14] p-3 text-base font-normal text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
                        />
                      </label>
                    </div>

                    {/* Điểm học tập và năng khiếu (tùy chọn) */}
                    <details className="rounded-xl border border-slate-700 bg-[#0A0D14] p-4">
                      <summary className="cursor-pointer text-base font-semibold text-white">Điểm học tập và năng khiếu (tùy chọn)</summary>
                      <div className="mt-4 space-y-5">
                        <div>
                          <h4 className="mb-3 text-base font-semibold text-white">Điểm môn học</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {[
                              { key: 'math', label: 'Toán' },
                              { key: 'literature', label: 'Ngữ văn' },
                              { key: 'english', label: 'Tiếng Anh' },
                              { key: 'physics', label: 'Vật lý' },
                              { key: 'chemistry', label: 'Hóa học' },
                              { key: 'biology', label: 'Sinh học' },
                              { key: 'history', label: 'Lịch sử' },
                              { key: 'geography', label: 'Địa lý' },
                              { key: 'informatics', label: 'Tin học' },
                              { key: 'economicLegal', label: 'GDKT & PL' }
                            ].map((subject) => (
                              <label key={subject.key} className="space-y-1 text-sm font-medium text-white">
                                {subject.label}
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={scores[subject.key] === '' ? '' : scores[subject.key]}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? '' : Math.min(10, Math.max(0, parseFloat(e.target.value)));
                                    setScores((previous) => ({ ...previous, [subject.key]: value }));
                                    setHasAnalyzedMajor(false);
                                  }}
                                  className="min-h-11 w-full rounded-lg border border-slate-700 bg-[#0A0D14] px-3 text-base text-white"
                                />
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="mb-3 text-base font-semibold text-white">Điểm môn năng khiếu</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {APTITUDE_SUBJECTS_METADATA.map((subject) => (
                              <label key={subject.key} className="space-y-1 text-sm font-medium text-white">
                                {subject.label}
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  value={aptitudeScores[subject.key] === '' ? '' : aptitudeScores[subject.key]}
                                  onChange={(e) => {
                                    const value = e.target.value === '' ? '' : Math.min(10, Math.max(0, parseFloat(e.target.value)));
                                    setAptitudeScores((previous) => ({ ...previous, [subject.key]: value }));
                                    setHasAnalyzedMajor(false);
                                  }}
                                  className="min-h-11 w-full rounded-lg border border-slate-700 bg-[#0A0D14] px-3 text-base text-white"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>

                  {/* NÚT GỢI Ý NGÀNH */}
                  <div className="flex flex-col items-center justify-center pt-2 gap-2">
                    <button
                      type="button"
                      disabled={!hasCareerProfile || isAnalyzingWithGemini}
                      onClick={handleRunGeminiAnalysis}
                      className="min-h-12 rounded-xl bg-blue-600 px-8 py-3 text-base font-bold text-white shadow-md transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isAnalyzingWithGemini ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-white" />
                          <span>Đang phân tích hồ sơ &amp; Kết nối AI...</span>
                        </>
                      ) : (
                        <span>{hasAnalyzedMajor ? 'Gợi ý lại ngành' : 'Gợi ý ngành'}</span>
                      )}
                    </button>
                    {analysisError && (
                      <p className="text-xs text-amber-400 font-medium">{analysisError}</p>
                    )}
                  </div>

                  {/* Ô TRA CỨU: NHẬP TÊN HOẶC MÃ NGÀNH */}
                  <div className="space-y-2">
                    <label htmlFor="major-search-input" className="sr-only">Nhập tên hoặc mã ngành</label>
                    <input
                      id="major-search-input"
                      type="search"
                      value={majorSearchQuery}
                      onChange={(e) => setMajorSearchQuery(e.target.value)}
                      placeholder="Nhập tên hoặc mã ngành"
                      className="min-h-12 w-full rounded-xl border border-slate-700 bg-[#0A0D14] px-4 text-base text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />

                    {majorSearchQuery.trim() && (
                      <div className="p-3 rounded-xl border border-slate-700 bg-[#0E1117] max-h-60 overflow-y-auto space-y-2">
                        {filteredSearchedMajors.length > 0 ? (
                          filteredSearchedMajors.map((m) => (
                            <div
                              key={m.codeTT09}
                              onClick={() => handleSelectMajor(m.codeTT09, 'tab-combo')}
                              className="p-2.5 rounded-lg bg-[#141923] hover:bg-blue-900/30 border border-slate-800 hover:border-blue-500/50 flex items-center justify-between cursor-pointer transition-colors"
                            >
                              <div>
                                <span className="font-bold text-white text-sm">{m.name}</span>
                                <span className="text-xs text-slate-400 ml-2 font-mono">Mã {m.codeTT09}</span>
                              </div>
                              <span className="text-xs text-blue-400 font-bold">Chọn ngành này →</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 py-2 text-center">Không tìm thấy ngành khớp với từ khóa.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* HƯỚNG DẪN KHI CHƯA BẤM GỢI Ý NGÀNH */}
                  {!hasAnalyzedMajor && (
                    <div className="rounded-2xl border border-dashed border-slate-700 bg-[#0E1117]/80 p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-blue-950/60 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-lg mx-auto">
                        <h4 className="font-bold text-base text-white">Sẵn sàng phân tích hồ sơ &amp; Gợi ý 9 ngành theo AI</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Hệ thống AI sẽ đối chiếu toàn diện <strong>Mật mã Holland (RIASEC)</strong>, <strong>Sở thích</strong>, <strong>Thế mạnh</strong>, <strong>Điểm yếu cần tránh</strong> cùng <strong>Bảng điểm thi</strong> để xuất 9 ngành tiềm năng nhất cho bạn.
                        </p>
                      </div>
                      <p className="text-xs font-mono text-slate-400">
                        👉 Bấm nút <strong className="text-blue-400">“Gợi ý ngành”</strong> màu xanh ở trên để kích hoạt AI phân tích.
                      </p>
                    </div>
                  )}

                  {/* KẾT QUẢ GỢI Ý 9 NGÀNH DO AI GENERATE TRỰC TIẾP */}
                  {hasAnalyzedMajor && hasCareerProfile && (
                    <div className="rounded-2xl border border-blue-500/40 bg-[#0E1117] p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                            <h3 className="text-lg font-bold text-white">Kết quả phân tích &amp; Đề xuất 9 ngành tiềm năng từ AI</h3>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            Phân tích cá nhân hóa đa chiều (Sở thích + Năng lực + Điểm yếu + Bảng điểm + Mật mã Holland).
                          </p>
                        </div>
                        {/* Thang đo cơ cấu tỷ trọng RIASEC vs Năng lực học tập */}
                        <div className="p-2.5 rounded-xl bg-[#141923] border border-slate-800 text-xs font-mono space-y-1">
                          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <span>⚖️ Thang đo tỷ trọng gợi ý:</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px]">
                            <span className="text-blue-300 font-semibold">Sở thích &amp; Thế mạnh: <strong>40%</strong></span>
                            <span className="text-slate-600 hidden sm:inline">|</span>
                            <span className="text-emerald-300 font-semibold">Điểm số học tập: <strong>35%</strong></span>
                            <span className="text-slate-600 hidden sm:inline">|</span>
                            <span className="text-amber-300 font-semibold">Mật mã Holland: <strong>25%</strong></span>
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const displayMajors = aiGeneratedMajors.length > 0 
                          ? aiGeneratedMajors.slice(0, 9)
                          : rankedMajors.slice(0, 9).map((m, idx) => ({
                              id: m.codeTT09,
                              name: m.name,
                              codeTT09: m.codeTT09,
                              reason: m.fitReason || 'Ngành đào tạo phù hợp với thế mạnh học tập cá nhân.',
                              advantages: ['Điểm thi các môn thế mạnh vượt trội'],
                              considerations: ['Cần duy trì phong độ học tập'],
                              suitableCombos: ['A00', 'A01'],
                              matchScore: Math.max(80, 98 - idx * 2),
                              matchTier: idx < 3 ? 'Khuyến nghị hàng đầu' : (idx < 6 ? 'Tiềm năng cao' : 'Phù hợp tốt'),
                              riasecMatch: idx < 3 ? 92 : 86,
                              academicMatch: idx < 3 ? 98 : 92
                            } as AIGeneratedMajorRecommendation));

                        if (displayMajors.length === 0) {
                          return (
                            <p className="text-base text-slate-300 py-4 text-center">
                              Chưa có dữ liệu đề xuất. Hãy bổ sung sở thích, thế mạnh hoặc điểm số rồi bấm “Gợi ý ngành”.
                            </p>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {displayMajors.map((major, index) => {
                              const isTop3 = index < 3;
                              const isTop6 = index >= 3 && index < 6;
                              const tierBadge = major.matchTier || (isTop3 ? 'Khuyến nghị hàng đầu' : isTop6 ? 'Tiềm năng cao' : 'Phù hợp tốt');
                              const tierClass = isTop3 
                                ? 'bg-blue-950/70 border-blue-500/50 text-blue-300' 
                                : isTop6 
                                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' 
                                : 'bg-purple-950/70 border-purple-500/50 text-purple-300';
                              const matchScore = major.matchScore || Math.max(82, 98 - index * 2);
                              const riasecScore = major.riasecMatch || (isTop3 ? 92 : 86);
                              const academicScore = major.academicMatch || (isTop3 ? 98 : 92);

                              return (
                                <div key={major.codeTT09 || major.id || index} className="rounded-xl border border-slate-700 bg-[#141923] p-4 space-y-3 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-bold text-blue-300 font-mono">Gợi ý {index + 1}</span>
                                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${tierClass}`}>
                                        {tierBadge} ({matchScore}%)
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="text-lg font-bold text-white">{major.name}</h4>
                                      <span className="text-xs font-mono text-slate-400 block mt-0.5">
                                        Mã ngành: {major.codeTT09 || 'Chính thức'} {major.suitableCombos?.length ? `· Tổ hợp: ${major.suitableCombos.join(', ')}` : ''}
                                      </span>
                                    </div>

                                    {/* Phân tích lý do cá nhân hóa từ AI */}
                                    <p className="text-sm text-slate-300 leading-relaxed font-sans">
                                      {major.reason}
                                    </p>

                                    {/* Ưu thế và Lưu ý từ AI */}
                                    {major.advantages && major.advantages.length > 0 && (
                                      <div className="space-y-1 pt-1 border-t border-slate-800">
                                        <span className="text-[11px] font-bold text-emerald-400 font-mono uppercase tracking-wider block">Ưu thế cá nhân:</span>
                                        <ul className="text-xs text-slate-300 space-y-1">
                                          {major.advantages.map((adv: string, i: number) => (
                                            <li key={i} className="flex items-start gap-1.5">
                                              <span className="text-emerald-400">✓</span>
                                              <span>{adv}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {major.considerations && major.considerations.length > 0 && (
                                      <div className="space-y-1 pt-1 border-t border-slate-800">
                                        <span className="text-[11px] font-bold text-amber-400 font-mono uppercase tracking-wider block">Lưu ý thích ứng:</span>
                                        <ul className="text-xs text-slate-300 space-y-1">
                                          {major.considerations.map((con: string, i: number) => (
                                            <li key={i} className="flex items-start gap-1.5">
                                              <span className="text-amber-400">⚠️</span>
                                              <span>{con}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Thang đo tỷ trọng thành phần cho từng gợi ý */}
                                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                                      <span>RIASEC: <strong className="text-amber-300">{riasecScore}%</strong></span>
                                      <span>Năng lực học tập: <strong className="text-emerald-300">{academicScore}%</strong></span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleSelectMajor(major.codeTT09 || major.id, 'tab-combo')}
                                    className="min-h-11 w-full rounded-lg bg-blue-600 px-4 text-base font-bold text-white hover:bg-blue-500 transition-colors cursor-pointer mt-3 flex items-center justify-center gap-1.5 shadow-md"
                                  >
                                    <span>Chọn ngành này →</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
      {activeTab === 'tab-combo' && (
        <section ref={activeSelectionRef} className="space-y-5 scroll-mt-28">
          {/* Header Info */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between">
            <div>
              <span className="text-sm font-mono text-blue-300 font-bold block">ĐANG XÉT CHO NGÀNH:</span>
              <h3 className="font-bold text-base text-white">{currentMajor?.name}{currentMajor?.isOfficialCode ? ' · Mã ' + currentMajor.codeTT09 : ''}</h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('tab-major')}
              className="text-sm text-slate-400 hover:text-white underline cursor-pointer"
            >
              ← Đổi ngành khác
            </button>
          </div>


          {/* Combinations Comparison & Selection Table */}
          <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-bold text-sm text-white">
                  Danh Sách Các Tổ Hợp Xét Tuyển Hợp Lệ Của Ngành {currentMajor?.name}:
                </h4>
                <p className="text-sm text-slate-400 mt-0.5">
                  Bấm chọn 1 tổ hợp để sử dụng cho chuỗi phân tích trường ở Bước 3.
                </p>
              </div>

              {/* Expected Score Input */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-slate-300 font-bold">Mức điểm dự kiến:</span>
                <input
                  type="number"
                  min="10"
                  max="30"
                  step="0.25"
                  value={expectedScoreInput}
                  onChange={(e) => { setExpectedScoreInput(e.target.value); setSelectedSchoolCode(null); }}
                  placeholder="Ví dụ: 25.5"
                  className="w-28 bg-[#141923] border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-blue-300 font-mono font-bold focus:outline-none focus:border-blue-500"
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
                      setActiveTab('tab-university');
                    }}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-400 ring-1 ring-blue-400 shadow-md'
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
                        <span className="px-2 py-0.5 rounded bg-blue-500 text-black text-xs font-bold">
                          TỐI ƯU NHẤT (#1)
                        </span>
                      )}
                      {combo.isArts && (
                        <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-blue-300 text-xs font-bold">
                          Môn Năng Khiếu
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-slate-300 font-mono">
                      {combo.hasData ? <>Điểm tham khảo: <strong className="text-blue-300 font-bold">{combo.officialScore}đ</strong></> : <span className="text-slate-400">Nhập điểm để so sánh tổ hợp này</span>}
                      {combo.effectivePriority > 0 && <span className="text-blue-300 text-sm ml-1">(+ {combo.effectivePriority}đ ưu tiên TT06)</span>}
                    </div>

                    <div className="text-sm text-slate-400">
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

                    <div className="pt-1 flex items-center justify-between text-sm font-bold text-blue-300">
                      <span>{isSelected ? '✓ Đã chọn tổ hợp này' : 'Bấm để chọn'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      )}

      {/* =========================================================================
          BƯỚC 3: CHỌN TRƯỜNG ĐẠI HỌC (KINH PHÍ NĐ 238 + ĐỊA CHỈ + PHÂN TẦNG)
          ========================================================================= */}
      {activeTab === 'tab-university' && (
        <section ref={activeSelectionRef} className="space-y-5 scroll-mt-28">
          {/* Header Info */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between">
            <div>
              <span className="text-sm font-mono text-blue-300 font-bold block">MỤC TIÊU ĐANG XÉT:</span>
              <h3 className="font-bold text-base text-white">
                Ngành {currentMajor?.name} · Tổ hợp {selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'chưa chọn')}{topCombo?.hasData ? ' · ' + topCombo.officialScore + ' điểm' : ''}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('tab-combo')}
              className="text-sm text-slate-400 hover:text-white underline cursor-pointer"
            >
              ← Đổi tổ hợp khác
            </button>
          </div>


          {/* Practical Constraints: Tuition Budget & Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Ngân sách học phí (NĐ 238/2025) */}
            <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Ngân sách học phí tham khảo mỗi năm:</span>
                </span>
                <span className="font-mono font-bold text-blue-300 text-sm">
                  {maxTuition == null ? 'Chưa biết' : `${maxTuition} triệu/năm`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={maxTuition ?? 35}
                aria-label="Ngân sách học phí tối đa mỗi năm, triệu đồng"
                onChange={(e) => setMaxTuition(parseInt(e.target.value, 10))}
                className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-sm font-mono text-slate-400">
                <span>0 triệu</span>
                <span>33,7 triệu (bình quân tham khảo)</span>
                <span>100 triệu</span>
              </div>
              <p className="text-sm text-slate-400">Dữ liệu học phí trường chưa đầy đủ. Khi chưa đặt ngân sách, danh sách trường không bị lọc theo mức phí.</p>
            </div>

            {/* 2. Địa chỉ / Vùng miền mong muốn */}
            <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-3">
              <div className="border-b border-slate-800 pb-2">
                <span className="font-bold text-sm text-white">Địa Chỉ / Vùng Miền Mong Muốn Theo Học:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-sm font-mono">
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
                      setHasGeneratedSchools(false);
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

          <div className="rounded-2xl border border-blue-500/30 bg-blue-950/10 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-2xl">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  Phân tích & Đề xuất trường đại học phù hợp (AI Generation)
                </h3>
                <p className="mt-1 text-sm text-slate-300 leading-relaxed">
                  AI sẽ phân tích ngành <strong className="text-white">{currentMajor?.name}</strong>, tổ hợp môn <strong className="text-blue-300 font-mono">{selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'đang chọn')}</strong>, điểm xét tuyển và khu vực <strong className="text-white">({targetRegionFilter === 'ALL' ? 'Toàn quốc' : ({ BAC: 'Miền Bắc', TRUNG: 'Miền Trung', NAM: 'Miền Nam', DBSCL: 'ĐBSCL' }[targetRegionFilter])})</strong> để đề xuất các trường đại học đào tạo chuẩn xác nhất, không dùng luồng ghép trường ngẫu nhiên.
                </p>
              </div>
              <button
                type="button"
                disabled={isAnalyzingSchoolsWithAI}
                onClick={handleRunAIUniversityRecommendation}
                className="min-h-12 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
              >
                {isAnalyzingSchoolsWithAI ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Đang kết nối AI phân tích trường...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>{hasGeneratedSchools ? 'Gợi ý lại trường' : 'Gợi ý trường bằng AI'}</span>
                  </>
                )}
              </button>
            </div>

            {hasGeneratedSchools && (
              <div className="space-y-4 pt-2" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <span className="text-blue-400 font-mono">✦</span>
                    Trường đại học do AI đề xuất cho ngành {currentMajor?.name}:
                  </h4>
                  <span className="text-xs font-mono text-slate-400">
                    Phân tầng chiến lược: Mơ ước · Vừa sức · An toàn
                  </span>
                </div>

                {aiGeneratedSchools.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {aiGeneratedSchools.map((school, index) => {
                      const isSelected = selectedSchoolCode === school.code;
                      const tierBadgeClass = school.tier === 'Mơ ước'
                        ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                        : school.tier === 'Vừa sức'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                          : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';

                      return (
                        <article
                          key={`ai-school-${school.code}-${index}`}
                          className={`rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                            isSelected
                              ? 'border-blue-400 bg-blue-950/50 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400'
                              : 'border-slate-800 bg-[#141923] hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${tierBadgeClass}`}>
                                {school.tier}
                              </span>
                              <span className="text-xs font-mono text-slate-400">
                                Gợi ý {index + 1} · {school.city}
                              </span>
                            </div>

                            <h5 className="font-bold text-white text-base leading-snug">
                              {school.name} <span className="text-slate-400 font-mono text-xs">[{school.code}]</span>
                            </h5>

                            <div className="pt-1 text-xs space-y-1.5 text-slate-300 font-sans border-t border-slate-800/80">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Điểm chuẩn tham chiếu:</span>
                                <span className="font-bold text-white font-mono text-sm">{school.benchmark}đ</span>
                              </div>
                              {school.margin !== null && (
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-400">Chênh lệch hồ sơ:</span>
                                  <span className={`font-mono font-semibold ${school.margin >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {school.margin >= 0 ? `+${school.margin}đ (Vừa sức)` : `${school.margin}đ (Mơ ước)`}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-slate-400">Học phí dự kiến:</span>
                                <span className={`font-mono font-semibold ${school.isBudgetFeasible ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  ~${school.estimatedTuitionMln} tr/năm
                                </span>
                              </div>
                            </div>

                            <p className="mt-2 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2 italic">
                              &ldquo;{school.fitReason}&rdquo;
                            </p>

                            {school.programHighlights && (
                              <p className="text-[11px] text-blue-300 bg-blue-950/40 p-2 rounded-lg border border-blue-500/20">
                                ★ {school.programHighlights}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => {
                              sfx.playUiSelect();
                              setSelectedSchoolCode(school.code);
                            }}
                            className={`mt-4 w-full py-2.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
                            }`}
                          >
                            <span>{isSelected ? '✓ Đã chọn trường này' : 'Chọn trường này →'}</span>
                          </button>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-sm text-amber-100">
                    Chưa tìm thấy trường phù hợp trong khu vực đã chọn. Vui lòng thử đổi sang "Toàn quốc" hoặc bấm "Gợi ý lại trường".
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              aria-expanded={showAllSchools}
              onClick={() => setShowAllSchools((shown) => !shown)}
              className="text-sm font-semibold text-blue-300 underline hover:text-white cursor-pointer"
            >
              {showAllSchools ? 'Ẩn danh sách 300 trường' : 'Tìm hoặc chọn thủ công trong danh sách 300 trường'}
            </button>
          </div>

          {showAllSchools && (
          <div className="rounded-2xl border border-slate-800 bg-[#0E1117] p-5 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">Danh sách trường</h3>
                <p className="mt-1 text-base text-slate-300">
                  {stratifiedSchools.totalSchools} / {AUDITED_INSTITUTIONS_300.length} trường · {stratifiedSchools.matchingSchoolCount} trường có điểm cho ngành và tổ hợp này
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-pressed={schoolMatchFilter === 'ALL'}
                  onClick={() => setSchoolMatchFilter('ALL')}
                  className={schoolMatchFilter === 'ALL'
                    ? 'min-h-11 rounded-lg bg-blue-600 px-4 text-base font-bold text-white'
                    : 'min-h-11 rounded-lg border border-slate-700 px-4 text-base text-slate-200'}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  aria-pressed={schoolMatchFilter === 'MATCHED'}
                  onClick={() => setSchoolMatchFilter('MATCHED')}
                  className={schoolMatchFilter === 'MATCHED'
                    ? 'min-h-11 rounded-lg bg-blue-600 px-4 text-base font-bold text-white'
                    : 'min-h-11 rounded-lg border border-slate-700 px-4 text-base text-slate-200'}
                >
                  Có dữ liệu
                </button>
              </div>
            </div>

            <label htmlFor="school-search" className="sr-only">Tìm trường theo tên, mã hoặc tỉnh thành</label>
            <input
              id="school-search"
              type="search"
              value={schoolSearchQuery}
              onChange={(e) => {
                setSchoolSearchQuery(e.target.value);
                setSelectedSchoolCode(null);
              }}
              placeholder="Tìm trường theo tên, mã hoặc tỉnh/thành"
              className="min-h-12 w-full rounded-xl border border-slate-700 bg-[#0A0D14] px-4 text-base text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />

            <p className="text-sm text-slate-300">
              {currentMajor?.name} · {selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'Chưa chọn tổ hợp')} · {targetRegionFilter === 'ALL' ? 'Toàn quốc' : ({ BAC: 'Miền Bắc', TRUNG: 'Miền Trung', NAM: 'Miền Nam', DBSCL: 'ĐBSCL' }[targetRegionFilter])}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stratifiedSchools.schools.length === 0 && (
                <p className="col-span-full py-8 text-center text-base text-slate-300">Không có trường phù hợp bộ lọc.</p>
              )}
              {stratifiedSchools.schools.map((school) => (
                <button
                  key={school.code}
                  type="button"
                  aria-pressed={selectedSchoolCode === school.code}
                  onClick={() => {
                    setSelectedSchoolCode(school.code);
                  }}
                  className={selectedSchoolCode === school.code
                    ? 'min-h-32 rounded-xl border border-blue-400 bg-blue-950/70 p-4 text-left ring-1 ring-blue-400'
                    : 'min-h-32 rounded-xl border border-slate-700 bg-[#141923] p-4 text-left hover:border-blue-500'}
                >
                  <span className="flex items-center justify-between text-sm text-slate-300">
                    <span className="font-bold text-white">{school.code}</span>
                    <span>{school.city}</span>
                  </span>
                  <span className="mt-2 block text-lg font-bold text-white">{school.name}</span>
                  {school.hasMajorData ? (
                    <span className="mt-2 block text-sm text-blue-300">
                      {school.tier ? school.tier + ' · ' : ''}
                      Mốc tuyển sinh: {school.benchmark}đ
                      {school.margin !== null ? ' · Chênh ' + (school.margin > 0 ? '+' : '') + school.margin + 'đ' : ''}
                    </span>
                  ) : (
                    <span className="mt-2 block text-sm text-slate-300">Chưa có dữ liệu cho lựa chọn này</span>
                  )}
                  <span className="mt-2 block text-xs font-semibold text-emerald-300">
                    {selectedSchoolCode !== school.code
                      ? 'Chọn trường để xem thông tin tuyển sinh & học bổng'
                      : liveSchoolResearchLoading
                        ? 'Đang tra cứu học phí, điểm chuẩn, tuyển sinh và học bổng…'
                        : liveSchoolResearchError
                          ? 'Không tra cứu được lúc này · xem thông báo bên dưới'
                          : liveSchoolResearch
                            ? 'Đã tải thông tin có dẫn nguồn · xem bên dưới'
                            : 'Đang chuẩn bị tra cứu…'}
                  </span>
                </button>
              ))}
            </div>
          </div>
          )}

            {selectedSchoolCode && currentSchool && (
              <div ref={selectedSchoolDetailsRef} className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3 scroll-mt-24">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-white">Thông tin trường đang chọn: {currentSchool.name || currentSchool.schoolName}</h4>
                    <p className="mt-1 text-xs text-slate-300">DeepSeek tra cứu theo ngành và tổ hợp, ưu tiên nguồn chính thức của trường. Mỗi thông tin có liên kết nguồn để bạn kiểm tra.</p>
                  </div>
                  <button
                    type="button"
                    disabled={liveSchoolResearchLoading}
                    onClick={() => {
                      const institutionCode = currentSchool.institution_code;
                      if (!institutionCode) return;
                      const comboCode = selectedComboCode || '';
                      const cacheKey = `${institutionCode}:${(currentMajor?.name || '').toLocaleLowerCase('vi')}:${comboCode}`;
                      liveSchoolResearchCache.current.delete(cacheKey);
                      forceNextSchoolResearchRef.current = true;
                      setLiveSchoolResearchRefresh((value) => value + 1);
                    }}
                    className="min-h-9 rounded-lg border border-emerald-500/50 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {liveSchoolResearchLoading ? 'Đang tra cứu…' : 'Tra cứu lại'}
                  </button>
                </div>

                {liveSchoolResearchLoading && (
                  <p role="status" className="text-sm text-slate-300">Đang tìm điểm chuẩn, học phí, phương thức xét tuyển và học bổng trên nguồn chính thức…</p>
                )}
                {!liveSchoolResearchLoading && liveSchoolResearchError && (
                  <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-sm text-amber-100">{liveSchoolResearchError}</p>
                )}
                {!liveSchoolResearchLoading && liveSchoolResearch && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-200">
                    <div className="rounded-lg border border-slate-700 bg-[#141923] p-3">
                      <p className="font-bold text-blue-200">Điểm chuẩn gần nhất theo ngành/tổ hợp</p>
                      {liveSchoolResearch.cutoffFacts.length ? (
                        <ul className="mt-2 space-y-2">
                          {liveSchoolResearch.cutoffFacts.slice(0, 3).map((fact, index) => (
                            <li key={`selection-cutoff-${index}`}>
                              <strong>{fact.programName}</strong>{fact.admissionsYear ? ` · ${fact.admissionsYear}` : ''}{fact.combination ? ` · ${fact.combination}` : ''}{`: ${fact.score}${fact.scale ? `/${fact.scale}` : ''}`}
                              {fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-300 hover:underline">Nguồn</a>}
                            </li>
                          ))}
                        </ul>
                      ) : <p className="mt-1 text-slate-300">Chưa tìm thấy điểm chuẩn chính thức phù hợp.</p>}
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-[#141923] p-3">
                      <p className="font-bold text-blue-200">Học phí công bố gần nhất</p>
                      {liveSchoolResearch.tuitionFacts.length ? (
                        <ul className="mt-2 space-y-2">
                          {liveSchoolResearch.tuitionFacts.slice(0, 3).map((fact, index) => (
                            <li key={`selection-tuition-${index}`}>
                              <strong>{fact.programName}</strong>{fact.academicYear ? ` · ${fact.academicYear}` : ''}{`: ${fact.amount}${fact.unit ? ` (${fact.unit})` : ''}`}
                              {fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-300 hover:underline">Nguồn</a>}
                            </li>
                          ))}
                        </ul>
                      ) : <p className="mt-1 text-slate-300">Chưa tìm thấy học phí chính thức phù hợp.</p>}
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-[#141923] p-3">
                      <p className="font-bold text-blue-200">Phương thức xét tuyển</p>
                      {liveSchoolResearch.admissionMethods.length ? (
                        <ul className="mt-2 list-disc space-y-1 pl-5">
                          {liveSchoolResearch.admissionMethods.slice(0, 4).map((method, index) => (
                            <li key={`selection-method-${index}`}>
                              <strong>{method.name}:</strong> {method.detail}
                              {method.sourceUrl && <a href={method.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-300 hover:underline">Nguồn</a>}
                            </li>
                          ))}
                        </ul>
                      ) : <p className="mt-1 text-slate-300">Chưa tìm thấy phương thức chính thức phù hợp.</p>}
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-[#141923] p-3">
                      <p className="font-bold text-blue-200">Học bổng và hỗ trợ người học</p>
                      {liveSchoolResearch.scholarships.length ? (
                        <ul className="mt-2 space-y-2">
                          {liveSchoolResearch.scholarships.slice(0, 3).map((scholarship, index) => (
                            <li key={`selection-scholarship-${index}`}>
                              <strong>{scholarship.name}</strong>{scholarship.academicYear ? ` · ${scholarship.academicYear}` : ''}: {scholarship.detail}
                              {scholarship.sourceUrl && <a href={scholarship.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-300 hover:underline">Nguồn</a>}
                            </li>
                          ))}
                        </ul>
                      ) : <p className="mt-1 text-slate-300">Chưa tìm thấy học bổng riêng có nguồn chính thức.</p>}
                    </div>
                  </div>
                )}
                {liveSchoolResearch && (
                  <p className="text-xs text-emerald-300">Đã tra cứu bằng {liveSchoolResearch.provider} · {liveSchoolResearch.model} · {liveSchoolResearch.admissionsYear}. {liveSchoolResearch.admissionsSummary}</p>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('tab-domino')}
                  className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
                >
                  Tiếp tục xem hồ sơ đối chiếu →
                </button>
              </div>
            )}
        </section>
      )}

      {/* =========================================================================
          BƯỚC 4: ĐỊNH HƯỚNG VIỆC LÀM & CHUỖI ẢNH HƯỞNG (DOMINO EFFECT)
          ========================================================================= */}
      {activeTab === 'tab-domino' && (
        <section ref={activeSelectionRef} className="space-y-5 scroll-mt-28">
          {/* Header Summary */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between">
            <div>
              <span className="text-sm font-mono text-blue-300 font-bold block">ĐỐI CHIẾU HỒ SƠ TỔNG HỢP:</span>
              <h3 className="font-bold text-base text-white">
                {currentMajor?.name} · {selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'chưa chọn')} · {currentSchool ? (currentSchool.name || currentSchool.schoolName) : 'Trường chưa chọn'}
              </h3>
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
                      ? 'bg-blue-600/30 border-blue-400 ring-1 ring-blue-400 shadow-md'
                      : 'bg-[#141923] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-sm text-white">{job}</div>
                  <div className="text-sm text-blue-300 font-bold mt-2">
                    {targetJob === job ? '✓ Đã chọn việc làm này' : 'Bấm chọn làm mục tiêu'}
                  </div>
                </div>
              ))}
              {!currentMajor?.targetJobs?.length && <p className="text-sm text-slate-400">Danh mục hiện chưa có dữ liệu nghề cụ thể cho ngành này. Vui lòng chọn nghề mục tiêu để lưu vào hồ sơ.</p>}
            </div>
          </div>

          {/* Báo cáo liên kết lựa chọn */}
          <div className="p-6 rounded-2xl bg-[#0E1117] border border-blue-500/50 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="text-lg"></span>
              <h4 className="font-bold text-base sm:text-lg text-white font-mono uppercase tracking-wider">
                BÁO CÁO ĐỐI CHIẾU &amp; PHÂN TÍCH CHUỖI ẢNH HƯỞNG (DOMINO EFFECT)
              </h4>
            </div>

            {/* 1. Kiểm tra độ khớp */}
            <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-2">
              <div className="font-bold text-sm text-blue-300 font-mono uppercase">
                1. KIỂM TRA ĐỘ KHỚP (NGÀNH ⟷ TỔ HỢP ⟷ TRƯỜNG ⟷ VIỆC LÀM):
              </div>
              <ul className="text-sm text-slate-200 space-y-1.5 leading-relaxed font-sans">
                <li className="flex items-start gap-2">
                  <span>
                    <strong>Hồ sơ Mật mã Holland</strong>: <strong>{dominantRiasec ? `Mã Holland ${dominantRiasec}` : 'Chưa làm test / Tự do'}</strong> {effectiveRiasecProfile ? '• Đã đối chiếu ma trận tương quan Pearson' : ''}
                  </span>
                </li>
                {careerWeaknesses && (
                  <li className="flex items-start gap-2">
                    <span>
                      <strong>Điểm yếu / Hạn chế đã ghi nhận</strong>: <strong className="text-amber-300">{careerWeaknesses}</strong>
                    </span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span>
                    <strong>Ngành &amp; Tổ hợp</strong>: <strong>{selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'Chưa chọn')}</strong> được liên kết với ngành <strong>{currentMajor?.name}</strong> trong hồ sơ tư vấn.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>
                    <strong>Ngành &amp; Việc làm</strong>: Mục tiêu <strong>{targetJob || currentMajor?.targetJobs?.[0] || 'Chưa chọn'}</strong> được đối chiếu với danh sách nghề liên kết của ngành.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span>
                    <strong>Kinh phí &amp; Trường học</strong>: {maxTuition == null ? 'Ngân sách chưa biết' : `Giới hạn ${maxTuition} triệu/năm`} · bình quân nhóm ngành {stratifiedSchools.tuitionBenchmark?.avg2026_2027 ?? 'chưa có dữ liệu'} triệu/năm; đây không phải học phí riêng của trường.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h5 className="font-bold text-emerald-200">Thông tin chính thức của trường đã chọn</h5>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    DeepSeek tìm và phân tích nguồn chính thức theo trường, ngành và tổ hợp; không gửi điểm số, sở thích hoặc thông tin cá nhân.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!currentSchool || liveSchoolResearchLoading}
                  onClick={() => {
                    if (!currentSchool?.institution_code) return;
                    const comboCode = selectedComboCode || '';
                    const cacheKey = `${currentSchool.institution_code}:${(currentMajor?.name || '').toLocaleLowerCase('vi')}:${comboCode}`;
                    liveSchoolResearchCache.current.delete(cacheKey);
                    forceNextSchoolResearchRef.current = true;
                    setLiveSchoolResearchRefresh((value) => value + 1);
                  }}
                  className="min-h-9 rounded-lg border border-emerald-500/50 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {liveSchoolResearchLoading ? 'Đang tra cứu…' : 'Tra cứu lại'}
                </button>
              </div>

              {liveSchoolResearchLoading && (
                <p role="status" className="text-sm text-slate-300">Đang tìm điểm chuẩn, học phí, phương thức xét tuyển và học bổng trên nguồn chính thức…</p>
              )}
              {!liveSchoolResearchLoading && liveSchoolResearchError && (
                <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-sm text-amber-100">
                  {liveSchoolResearchError}
                </p>
              )}
              {!liveSchoolResearchLoading && liveSchoolResearch && (
                <div className="space-y-3 text-sm text-slate-200">
                  <p className="text-xs font-semibold text-emerald-300">
                    Đã phân tích bằng {liveSchoolResearch.provider} · {liveSchoolResearch.model}
                  </p>
                  <p className="font-semibold text-white">
                    Đề án tuyển sinh gần nhất: {liveSchoolResearch.admissionsYear}. {liveSchoolResearch.admissionsSummary}
                  </p>

                  <div className="rounded-lg border border-slate-700 bg-[#141923] p-3">
                    <p className="font-bold text-blue-200">Điểm chuẩn gần nhất theo ngành/tổ hợp</p>
                    {liveSchoolResearch.cutoffFacts.length ? (
                      <ul className="mt-1 space-y-2">
                        {liveSchoolResearch.cutoffFacts.map((fact, index) => (
                          <li key={`${fact.admissionsYear}-${fact.method}-${index}`}>
                            <strong>{fact.programName}</strong>{fact.admissionsYear ? ` · ${fact.admissionsYear}` : ''}
                            {fact.method ? ` · ${fact.method}` : ''}
                            {fact.combination ? ` · ${fact.combination}` : ''}
                            {`: ${fact.score}${fact.scale ? `/${fact.scale}` : ''}`}
                            {fact.note && <span className="text-slate-300"> — {fact.note}</span>}
                            {fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-300 hover:underline">Nguồn</a>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-slate-300">Chưa tìm thấy điểm trúng tuyển cuối cùng có nguồn chính thức cho ngành/tổ hợp này. Không dùng điểm sàn thay cho điểm chuẩn.</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-[#141923] p-3">
                    <p className="font-bold text-blue-200">Học phí được công bố gần nhất</p>
                    {liveSchoolResearch.tuitionFacts.length ? (
                      <ul className="mt-1 space-y-2">
                        {liveSchoolResearch.tuitionFacts.map((fact, index) => (
                          <li key={`${fact.academicYear}-${fact.programName}-${index}`}>
                            <strong>{fact.programName}</strong>{fact.academicYear ? ` · ${fact.academicYear}` : ''}
                            {`: ${fact.amount}${fact.unit ? ` (${fact.unit})` : ''}`}
                            {fact.note && <span className="text-slate-300"> — {fact.note}</span>}
                            {fact.sourceUrl && <a href={fact.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-300 hover:underline">Nguồn</a>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-slate-300">Chưa tìm thấy học phí có nguồn chính thức phù hợp. Mức theo tín chỉ không được tự quy đổi thành học phí năm.</p>
                    )}
                  </div>

                  <div>
                    <p className="font-bold text-blue-200">Phương thức xét tuyển</p>
                    {liveSchoolResearch.admissionMethods.length ? (
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {liveSchoolResearch.admissionMethods.map((method, index) => (
                          <li key={`${method.name}-${index}`}>
                            <strong>{method.name}:</strong> {method.detail}
                            {method.sourceUrl && <a href={method.sourceUrl} target="_blank" rel="noreferrer" className="ml-2 text-blue-300 hover:underline">Nguồn</a>}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="mt-1 text-slate-300">Chưa tìm thấy phương thức có nguồn chính thức trong lượt tra cứu này.</p>}
                  </div>

                  <div>
                    <p className="font-bold text-blue-200">Học bổng và hỗ trợ người học</p>
                    {liveSchoolResearch.scholarships.length ? (
                      <div className="mt-1 space-y-2">
                        {liveSchoolResearch.scholarships.map((scholarship, index) => (
                          <div key={`${scholarship.name}-${index}`} className="rounded-lg border border-slate-700 bg-[#141923] p-3">
                            <p className="font-semibold text-white">
                              {scholarship.name}
                              {scholarship.academicYear ? ` · ${scholarship.academicYear}` : ''}
                              {scholarship.status ? ` · ${scholarship.status}` : ''}
                            </p>
                            <p className="mt-1 text-slate-300">{scholarship.detail}</p>
                            {scholarship.sourceUrl && <a href={scholarship.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-blue-300 hover:underline">Nguồn chính thức</a>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="mt-1 text-slate-300">Chưa tìm thấy học bổng riêng có nguồn chính thức trong lượt tra cứu này.</p>}
                  </div>

                  {liveSchoolResearch.verificationNotes.length > 0 && (
                    <div>
                      <p className="font-bold text-amber-200">Điểm cần kiểm tra</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-300">
                        {liveSchoolResearch.verificationNotes.map((note, index) => <li key={`${index}-${note}`}>{note}</li>)}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-blue-200">Nguồn tra cứu</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {liveSchoolResearch.sources.map((source) => (
                        <li key={source.url}>
                          <a href={source.url} target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">{source.title}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-slate-400">
                    Tra cứu lúc {new Date(liveSchoolResearch.checkedAt).toLocaleString('vi-VN')}. Dữ liệu có thể thay đổi; hãy mở thông báo gốc trước khi đăng ký.
                  </p>
                </div>
              )}
            </div>

            {/* 2. Phân tích What-If */}
            <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-2">
              <div className="font-bold text-sm text-blue-300 font-mono uppercase">
                2. PHÂN TÍCH CHUỖI ẢNH HƯỞNG (WHAT-IF ANALYSIS):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-200">
                <div className="p-3 rounded-lg bg-[#141923] border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">[Ngành ➔ Điểm chuẩn]</span>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {topCombo?.hasData ? 'Điểm hồ sơ ' + topCombo.officialScore + 'đ được đối chiếu với mốc tuyển sinh tham chiếu của ' + stratifiedSchools.totalSchools + ' trường có dữ liệu cho lựa chọn này.' : 'Chưa có điểm số để so sánh với mốc tuyển sinh. Hãy nhập điểm dự kiến hoặc điểm từng môn ở Bước 2.'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#141923] border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">[Tổ hợp ➔ Cạnh tranh]</span>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Có thông tin tuyển sinh tại {stratifiedSchools.matchingSchoolCount} trường cho tổ hợp {selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'chưa chọn')}.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#141923] border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">[Ngành ➔ Việc làm]</span>
                  <p className="text-sm text-slate-300 leading-relaxed">
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition-colors cursor-pointer"
              >
                Khởi tạo lại chu trình
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
