import React, { useState, useMemo, useEffect, useRef } from 'react';
import { sfx } from '../services/soundEffects';
import {
  calculateEffectivePriority,
  calculateBasePriority30
} from '../services/admissionsCalculationEngine';


import seedData from '../data/seed_data.json';
import { AUDITED_INSTITUTIONS_300 } from '../data/auditedInstitutionsData';
import { getRegionFromProvinceCity } from '../services/unifiedSearchEngine';
import { CAREER_CATALOG, CAREER_PROGRAM_CATALOG, getMajorAdmissionRecords } from '../services/careerCatalog';
import { VERIFIED_COMBINATIONS_219 } from '../data/verifiedAdmissionDatabase';

export type ScientificTabKey = 'tab-major' | 'tab-combo' | 'tab-university' | 'tab-domino';

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

const AUDITED_PROVINCE_OPTIONS = [...new Set(
  AUDITED_INSTITUTIONS_300.flatMap((institution) =>
    institution.verified_province_city.split(/\s*&\s*/).map((place) => place.trim()).filter(Boolean)
  )
)].sort((a, b) => a.localeCompare(b, 'vi'));

const normalizeMajorCatalogName = (value: string) => value.normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLocaleLowerCase('vi')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const getMajorCatalogAliases = (name: string) => {
  const normalized = normalizeMajorCatalogName(name);
  const aliases = [name];
  if (normalized.includes('giao duc the chat') && normalized.startsWith('su pham ')) {
    aliases.push(name.replace(/^sư phạm\s+/i, ''));
  }
  return [...new Set(aliases)];
};

const isPhysicalEducationMajorName = (name: string) => {
  const normalized = normalizeMajorCatalogName(name);
  return normalized.includes('giao duc the chat') ||
    normalized.includes('quan ly the duc the thao') ||
    normalized.includes('huan luyen the thao');
};

export const Scientific4TabPortal: React.FC<Scientific4TabPortalProps> = ({
  onSelectSchool,
  onNavigateToCombos
}) => {
  // Navigation: 4 procedural steps
  const [activeTab, setActiveTab] = useState<ScientificTabKey>('tab-major');
  const activeSelectionRef = useRef<HTMLElement | null>(null);

  // =========================================================================
  // STEP 1 STATE: MAJOR DETERMINATION
  // =========================================================================
  const [hasMajorChoice, setHasMajorChoice] = useState<'YES' | 'NO' | null>(null);
  const [selectedMajorCode, setSelectedMajorCode] = useState<string | null>(null);
  const [majorSearchQuery, setMajorSearchQuery] = useState('');

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

  const [careerInterests, setCareerInterests] = useState('');
  const [careerStrengths, setCareerStrengths] = useState('');
  const [hasRequestedSuggestions, setHasRequestedSuggestions] = useState(false);
  const [isAnalyzingWithGemini, setIsAnalyzingWithGemini] = useState(false);
  const [geminiAnalysis, setGeminiAnalysis] = useState<any | null>(null);
  const [discoveredMajors, setDiscoveredMajors] = useState<any[]>([]);
  const [analysisError, setAnalysisError] = useState('');
  const analysisRequestIdRef = useRef(0);
  const [isAnalyzingUniversities, setIsAnalyzingUniversities] = useState(false);
  const [universityAnalysis, setUniversityAnalysis] = useState<any | null>(null);
  const [universityAnalysisError, setUniversityAnalysisError] = useState('');
  const [hasRequestedUniversityAnalysis, setHasRequestedUniversityAnalysis] = useState(false);
  const universityAnalysisRequestIdRef = useRef(0);

  const clearUniversityAnalysis = () => {
    universityAnalysisRequestIdRef.current += 1;
    setIsAnalyzingUniversities(false);
    setUniversityAnalysis(null);
    setUniversityAnalysisError('');
    setHasRequestedUniversityAnalysis(false);
  };

  const clearCareerAnalysis = () => {
    analysisRequestIdRef.current += 1;
    setHasRequestedSuggestions(false);
    setIsAnalyzingWithGemini(false);
    setGeminiAnalysis(null);
    setDiscoveredMajors([]);
    setAnalysisError('');
  };

  // =========================================================================
  // STEP 2 STATE: COMBINATION SELECTION (Locked to Step 1 Major)
  // =========================================================================
  const [selectedComboCode, setSelectedComboCode] = useState<string | null>(null);
  const [expectedScoreInput, setExpectedScoreInput] = useState<string>('');

  // =========================================================================
  // STEP 3 STATE: UNIVERSITY STRATIFICATION (Requires Tuition Budget & Region)
  // =========================================================================
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string | null>(null);
  const [maxTuition, setMaxTuition] = useState<number | null>(null);
  const [targetRegionFilter, setTargetRegionFilter] = useState<'ALL' | 'BAC' | 'TRUNG' | 'NAM' | 'DBSCL'>('ALL');
  const [targetProvinceFilter, setTargetProvinceFilter] = useState('');
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
    clearUniversityAnalysis();
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

  // Display each major once; retain school and combination links only for later analysis.
  const catalog = CAREER_CATALOG;
  const programCatalog = CAREER_PROGRAM_CATALOG;
  const majorOptions = useMemo(() => {
    const majorsByCode = new Map<string, { code: string; name: string }>();
    programCatalog.forEach((program) => {
      if (majorsByCode.has(program.majorCode)) return;
      const canonicalMajor = catalog.find((major) => major.codeTT09 === program.majorCode);
      majorsByCode.set(program.majorCode, {
        code: program.majorCode,
        name: canonicalMajor?.name || program.name
      });
    });
    return [...majorsByCode.values()].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }, [catalog, programCatalog]);
  const filteredMajors = useMemo(() => {
    const query = majorSearchQuery.trim().toLocaleLowerCase('vi');
    if (!query) return [];
    return majorOptions.filter((major) =>
      `${major.name} ${major.code}`.toLocaleLowerCase('vi').includes(query)
    );
  }, [majorOptions, majorSearchQuery]);

  // Current chosen major object
  const currentMajor = useMemo(() => {
    if (!selectedMajorCode) return null;
    return discoveredMajors.find(m => m.codeTT09 === selectedMajorCode) ||
      catalog.find(m => m.codeTT09 === selectedMajorCode) || null;
  }, [catalog, discoveredMajors, selectedMajorCode]);

  // Current chosen university object
  const getComboSubjectLabel = (comboCode: string) => {
    // T00/T01 are school-specific aptitude codes for physical-education majors.
    if (isPhysicalEducationMajorName(currentMajor?.name || '') && comboCode === 'T00') {
      return 'Toán – Sinh học – Năng khiếu TDTT';
    }
    if (isPhysicalEducationMajorName(currentMajor?.name || '') && comboCode === 'T01') {
      return 'Toán – Ngữ văn – Năng khiếu TDTT';
    }

    const verifiedCombo = VERIFIED_COMBINATIONS_219.find((item) => item.code === comboCode);
    return verifiedCombo
      ? verifiedCombo.subjects.join(' – ')
      : 'Chưa có mô tả môn cho tổ hợp này trong danh mục.';
  };

  const currentSchool = useMemo(() => {
    if (!selectedSchoolCode) return null;
    return (universityAnalysis?.recommendedSchools?.find((school: any) =>
      school.institutionCode === selectedSchoolCode || school.name === selectedSchoolCode
    ) ||
      AUDITED_INSTITUTIONS_300.find(i => i.institution_code === selectedSchoolCode) ||
      (seedData.anchorInstitutions as any[])?.find(i => i.code === selectedSchoolCode) ||
      null) || null;
  }, [selectedSchoolCode, universityAnalysis]);

  const requestMajorSuggestions = async () => {
    sfx.playUiClick();
    setHasRequestedSuggestions(true);
    setGeminiAnalysis(null);
    setDiscoveredMajors([]);
    setAnalysisError('');

    if (!hasRecommendationInput) {
      setAnalysisError('Hãy nhập sở thích, năng lực hoặc ít nhất một điểm số trước khi gợi ý ngành.');
      return;
    }

    const requestId = ++analysisRequestIdRef.current;
    setIsAnalyzingWithGemini(true);
    const controller = new AbortController();
    const requestTimeout = window.setTimeout(() => controller.abort(), 16_000);
    try {
      const response = await fetch('/api/ai/counselor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          careerInterests,
          careerStrengths,
          scores,
          aptitudeScores,
          analysisType: 'majors',
          academicYear: new Date().getFullYear(),
          maxTuition,
          priorityRegion,
          priorityObject,
          targetRegionFilter,
          targetJob
        })
      });
      const payload = await response.json();
      if (requestId !== analysisRequestIdRef.current) return;
      if (!response.ok || payload?.success !== true || payload?.provider !== 'verified-search' || !payload?.analysis) {
        throw new Error(payload?.error || 'Chưa nhận được kết quả phân tích. Hãy thử lại.');
      }
      setDiscoveredMajors(Array.isArray(payload.analysis.recommendedMajors)
        ? payload.analysis.recommendedMajors.map((major: any) => ({ ...major, isDynamicRecommendation: true }))
        : []);
      setGeminiAnalysis(payload.analysis);
    } catch (error) {
      if (requestId === analysisRequestIdRef.current) {
        setAnalysisError(error instanceof Error && error.name === 'AbortError'
          ? 'Phân tích quá thời gian cho phép. Hãy thử lại sau.'
          : error instanceof Error ? error.message : 'Không kết nối được dịch vụ phân tích. Hãy thử lại.');
      }
    } finally {
      window.clearTimeout(requestTimeout);
      if (requestId === analysisRequestIdRef.current) setIsAnalyzingWithGemini(false);
    }
  };

  const hasCareerProfile = careerInterests.trim().length > 0 || careerStrengths.trim().length > 0;
  const hasEnteredScore = [...Object.values(scores), ...Object.values(aptitudeScores)].some((value) => value !== '');
  const hasRecommendationInput = hasCareerProfile || hasEnteredScore;

  const majorCatalogPanel = (
    <div className="space-y-3">
      <label htmlFor="major-search" className="sr-only">Tìm ngành học</label>
      <input
        id="major-search"
        type="search"
        value={majorSearchQuery}
        onChange={(e) => setMajorSearchQuery(e.target.value)}
        placeholder="Nhập tên hoặc mã ngành"
        aria-controls="major-search-results"
        aria-expanded={Boolean(majorSearchQuery.trim())}
        className="min-h-12 w-full rounded-xl border border-slate-700 bg-[#141923] px-4 text-base text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
      />

      {majorSearchQuery.trim() && (
        <div
          id="major-search-results"
          role="listbox"
          aria-label="Kết quả tìm ngành"
          className="flex max-h-80 flex-col gap-2 overflow-y-auto"
        >
          {filteredMajors.length === 0 ? (
            <p role="status" className="py-4 text-center text-base text-slate-300">Không tìm thấy ngành phù hợp.</p>
          ) : (
            filteredMajors.map((major) => (
              <button
                key={major.code}
                type="button"
                role="option"
                aria-selected={selectedMajorCode === major.code}
                onClick={() => {
                  sfx.playActionSuccess();
                  handleSelectMajor(major.code);
                }}
                className="flex min-h-14 w-full items-center rounded-lg border border-slate-700 bg-[#141923] px-4 py-3 text-left hover:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <span className="block text-lg font-bold text-white">{major.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );

  // Mỗi tổ hợp lấy từ danh mục ngành và dữ liệu tuyển sinh liên quan.
  const validCombosForMajor = useMemo(() => {
    if (!currentMajor) return [];
    const dataCombos = currentMajor.isDynamicRecommendation ? [] : getMajorAdmissionRecords(currentMajor.name)
      .flatMap((record) => record.subject_combinations || []);
    return [...new Set([...(currentMajor.admissionsCombos || []), ...dataCombos])].sort();
  }, [currentMajor]);

  // Evaluated Combinations Scores for the Selected Major
  const evaluatedCombos = useMemo(() => {
    if (!currentMajor) return [];
    const combos = validCombosForMajor;

    return combos.map((comboCode: string) => {
      // Academic mapping
      const isArts = ['H00', 'H01', 'V00', 'V01', 'N00', 'N01', 'M00', 'M01', 'R00', 'S00'].includes(comboCode) ||
        (isPhysicalEducationMajorName(currentMajor.name) && ['T00', 'T01'].includes(comboCode));
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
      } else if (comboCode === 'T01' && isPhysicalEducationMajorName(currentMajor.name)) {
        m1 = Number(scores.math) || 0;
        m2 = Number(scores.literature) || 0;
        m3 = Number(aptitudeScores.apt_theThao) || 0;
        hasData = scores.math !== '' && scores.literature !== '' && aptitudeScores.apt_theThao !== '';
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
  const requestUniversityAnalysis = async () => {
    sfx.playUiClick();
    setHasRequestedUniversityAnalysis(true);
    setUniversityAnalysis(null);
    setUniversityAnalysisError('');

    const chosenCombo = selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : null);
    if (!currentMajor || !chosenCombo) {
      setUniversityAnalysisError('Chọn ngành và tổ hợp trước khi tra cứu trường.');
      return;
    }

    const requestId = ++universityAnalysisRequestIdRef.current;
    setIsAnalyzingUniversities(true);
    const selectedEvaluation = evaluatedCombos.find((combo: any) => combo.code === chosenCombo);
    const controller = new AbortController();
    const requestTimeout = window.setTimeout(() => controller.abort(), 17_000);
    try {
      const response = await fetch('/api/ai/counselor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          analysisType: 'universities',
          academicYear: new Date().getFullYear(),
          studentProfile: {
            interests: careerInterests,
            strengths: careerStrengths,
            scores,
            aptitudeScores,
            targetJob,
            major: {
              codeTT09: currentMajor.codeTT09,
              name: currentMajor.name,
              sector: currentMajor.sector
            },
            selectedCombination: chosenCombo,
            userEnteredExpectedScore: expectedScoreInput.trim() === '' ? null : Number(expectedScoreInput),
            calculatedSubjectScore: selectedEvaluation?.rawScore ?? null,
            effectivePriority: selectedEvaluation ? Number(selectedEvaluation.effectivePriority.toFixed(2)) : null,
            officialScoreForComparison: selectedEvaluation?.officialScore ?? null,
            maxAnnualTuitionMillions: maxTuition,
            preferredStudyRegion: targetRegionFilter,
            preferredProvince: targetProvinceFilter,
            priorityRegion,
            priorityObject
          }
        })
      });
      const payload = await response.json();
      if (requestId !== universityAnalysisRequestIdRef.current) return;
      if (!response.ok || payload?.success !== true || payload?.provider !== 'verified-search' || !payload?.analysis) {
        throw new Error(payload?.error || 'Chưa nhận được kết quả tra cứu trường. Hãy thử lại.');
      }
      setUniversityAnalysis(payload.analysis);
    } catch (error) {
      if (requestId === universityAnalysisRequestIdRef.current) {
        setUniversityAnalysisError(error instanceof Error && error.name === 'AbortError'
          ? 'Tra cứu quá thời gian cho phép. Hãy thử lại sau.'
          : error instanceof Error ? error.message : 'Không kết nối được dịch vụ tra cứu. Hãy thử lại.');
      }
    } finally {
      window.clearTimeout(requestTimeout);
      if (requestId === universityAnalysisRequestIdRef.current) setIsAnalyzingUniversities(false);
    }
  };

  // Reset entire session
  const handleResetAll = () => {
    sfx.playUiClick();
    setHasMajorChoice(null);
    setSelectedMajorCode(null);
    setSelectedComboCode(null);
    setSelectedSchoolCode(null);
    setTargetJob('');
    setExpectedScoreInput('');
    setCareerInterests('');
    setCareerStrengths('');
    clearCareerAnalysis();
    clearUniversityAnalysis();
    setScores({ math: '', literature: '', english: '', physics: '', chemistry: '', biology: '', history: '', geography: '', informatics: '', economicLegal: '' });
    setAptitudeScores({ apt_hinhHoa: '', apt_trangTri: '', apt_veMyThuat: '', apt_thamAm: '', apt_thanhNhac: '', apt_theThao: '', apt_mamNon: '', apt_baoChi: '', apt_dienXuat: '' });
    setMaxTuition(null);
    setTargetRegionFilter('ALL');
    setTargetProvinceFilter('');
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
                clearCareerAnalysis();
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
          {hasMajorChoice === 'YES' && majorCatalogPanel}

          {hasMajorChoice === 'NO' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-800 bg-[#0E1117] p-5 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Sở thích và năng lực</h3>
                  <p className="mt-1 text-base text-slate-300">Nhập sở thích, năng lực hoặc điểm số, rồi bấm “Gợi ý ngành” để xem kết quả.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-2 text-base font-semibold text-white">
                    Sở thích
                    <textarea
                      value={careerInterests}
                      onChange={(e) => {
                        setCareerInterests(e.target.value);
                        clearCareerAnalysis();
                      }}
                      rows={4}
                      placeholder="Ví dụ: thích thiết kế, làm việc với máy tính, chăm sóc mọi người"
                      className="min-h-28 w-full resize-y rounded-xl border border-slate-700 bg-[#141923] p-3 text-base font-normal text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </label>
                  <label className="space-y-2 text-base font-semibold text-white">
                    Năng lực và thế mạnh
                    <textarea
                      value={careerStrengths}
                      onChange={(e) => {
                        setCareerStrengths(e.target.value);
                        clearCareerAnalysis();
                      }}
                      rows={4}
                      placeholder="Ví dụ: giỏi Toán, viết tốt, khéo tay, giao tiếp tốt"
                      className="min-h-28 w-full resize-y rounded-xl border border-slate-700 bg-[#141923] p-3 text-base font-normal text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </label>
                </div>

                <details className="rounded-xl border border-slate-700 bg-[#141923] p-4">
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
                                clearCareerAnalysis();
                                 clearUniversityAnalysis();
                              }}
                              className="min-h-11 w-full rounded-lg border border-slate-700 bg-[#0A0D14] px-3 text-base text-white"
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3 text-base font-semibold text-white">Điểm năng khiếu</h4>
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
                                clearCareerAnalysis();
                                 clearUniversityAnalysis();
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

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void requestMajorSuggestions()}
                  disabled={isAnalyzingWithGemini}
                  className="min-h-11 rounded-lg bg-blue-600 px-6 py-3 text-base font-bold text-white hover:bg-blue-500 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  {isAnalyzingWithGemini ? 'Đang phân tích…' : 'Gợi ý ngành'}
                </button>
              </div>

              {hasRequestedSuggestions && (
                <section aria-labelledby="recommended-majors-title" className="rounded-xl border border-slate-700 bg-[#0E1117] p-5 space-y-4">
                  <div>
                    <h3 id="recommended-majors-title" className="text-xl font-bold text-white">Phân tích và gợi ý ngành</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Thông tin được tra cứu theo hồ sơ và kèm nguồn chính thức khi xác minh được.
                    </p>
                  </div>

                      {isAnalyzingWithGemini && (
                    <p role="status" className="rounded-lg border border-slate-700 bg-[#141923] p-4 text-base text-slate-200">
                      Đang phân tích hồ sơ và tra cứu thông tin tuyển sinh chính thức…
                    </p>
                  )}
                  {analysisError && (
                    <p role="alert" className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-base text-red-200">
                      {analysisError}
                    </p>
                  )}
                  {geminiAnalysis && (
                    <div className="space-y-4">
                      {geminiAnalysis.headline && <h4 className="text-lg font-bold text-white">{geminiAnalysis.headline}</h4>}
                      {geminiAnalysis.directAnswer && <p className="text-base leading-relaxed text-slate-200">{geminiAnalysis.directAnswer}</p>}
                      {geminiAnalysis.strengthsEvaluation && (
                        <p className="text-sm leading-relaxed text-slate-300">{geminiAnalysis.strengthsEvaluation}</p>
                      )}
                      {geminiAnalysis.risksAndBottlenecks && (
                        <p className="text-sm leading-relaxed text-slate-300">{geminiAnalysis.risksAndBottlenecks}</p>
                      )}
                      {geminiAnalysis.warnings?.map((warning: string, index: number) => (
                        <p key={`major-warning-${index}`} className="rounded-lg border border-amber-700/70 bg-amber-950/30 p-3 text-sm text-amber-200">{warning}</p>
                      ))}
                      <ol className="flex flex-col gap-2" aria-label="Danh sách ngành được gợi ý">
                        {geminiAnalysis.recommendedMajors.map((major: any, index: number) => (
                          <li key={major.codeTT09} className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-[#141923] p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-blue-300">Gợi ý {index + 1}</p>
                              <h5 className="mt-1 text-lg font-bold text-white">{major.name}{major.codeTT09 ? ` · ${major.codeTT09}` : ''}</h5>
                              <p className={`mt-1 text-sm ${major.verificationStatus === 'VERIFIED' ? 'text-emerald-300' : 'text-amber-300'}`}>
                                {major.verificationStatus === 'VERIFIED' ? `Đã xác minh theo nguồn năm ${major.year}` : 'Chưa xác minh đầy đủ nguồn, năm hoặc mã ngành'}
                              </p>
                              {major.whyFit && <p className="mt-1 text-base leading-relaxed text-slate-300">{major.whyFit}</p>}
                              {major.source?.url && (
                                <a href={major.source.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-300 underline underline-offset-2">
                                  Nguồn chính thức: {major.source.title}
                                </a>
                              )}
                              {major.admissionsCombos?.length > 0 && (
                                <div className="mt-1 text-sm text-slate-300">
                                  <p>Tổ hợp được nguồn xác nhận: {major.admissionsCombos.join(', ')}</p>
                                  {major.comboSource?.url && (
                                    <a href={major.comboSource.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-blue-300 underline underline-offset-2">
                                      Nguồn tổ hợp: {major.comboSource.title}
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectMajor(major.codeTT09, 'tab-combo')}
                              disabled={major.verificationStatus !== 'VERIFIED' || !major.codeTT09}
                              className="min-h-11 shrink-0 rounded-lg bg-blue-600 px-5 text-base font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                            >
                              {major.verificationStatus === 'VERIFIED' && major.codeTT09 ? 'Chọn ngành' : 'Chưa thể chọn'}
                            </button>
                          </li>
                        ))}
                      </ol>
                      {geminiAnalysis.recommendedMajors.length === 0 && !geminiAnalysis.warnings?.length && (
                        <p role="status" className="rounded-lg border border-amber-700/70 bg-amber-950/30 p-3 text-sm text-amber-200">Chưa tìm được ngành có nguồn chính thức phù hợp. Hãy thử mô tả thêm sở thích hoặc thế mạnh.</p>
                      )}
                    </div>
                  )}
                </section>
              )}

              {majorCatalogPanel}
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
                  onChange={(e) => { setExpectedScoreInput(e.target.value); setSelectedSchoolCode(null); clearUniversityAnalysis(); }}
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
                      clearUniversityAnalysis();
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
                      {combo.effectivePriority > 0 && <span className="text-blue-300 text-sm ml-1">(+ {combo.effectivePriority.toLocaleString('vi-VN', { maximumFractionDigits: 2 })}đ ưu tiên TT06)</span>}
                    </div>

                    <div className="text-sm text-slate-300">
                      Gồm: {getComboSubjectLabel(combo.code)}
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
              {(selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : null)) && (
                <p className="mt-1 text-sm text-slate-300">
                  Gồm: {getComboSubjectLabel(selectedComboCode || topCombo!.code)}
                </p>
              )}
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
            {/* Ngân sách: để trống nếu người dùng chưa biết */}
            <div className="p-5 rounded-2xl bg-[#0E1117] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <label htmlFor="annual-tuition-budget" className="font-bold text-sm text-white">
                  Ngân sách học phí tối đa mỗi năm:
                </label>
                <span className="font-mono font-bold text-blue-300 text-sm">
                  {maxTuition == null ? 'Chưa biết' : String(maxTuition) + ' triệu/năm'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="annual-tuition-budget"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={maxTuition ?? ''}
                  placeholder="Chưa biết"
                  aria-label="Ngân sách học phí tối đa mỗi năm, triệu đồng; để trống nếu chưa biết"
                  onChange={(e) => {
                    const rawValue = e.target.value;
                    const nextValue = rawValue === '' ? null : Math.min(100, Math.max(0, Number(rawValue)));
                    setMaxTuition(nextValue !== null && Number.isFinite(nextValue) ? nextValue : null);
                    clearUniversityAnalysis();
                  }}
                  className="min-h-11 w-full rounded-lg border border-slate-700 bg-[#141923] px-3 text-base text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                {maxTuition != null && (
                  <button
                    type="button"
                    onClick={() => {
                      setMaxTuition(null);
                      clearUniversityAnalysis();
                    }}
                    className="min-h-11 shrink-0 rounded-lg border border-slate-700 px-3 text-sm text-slate-200 hover:border-blue-500"
                  >
                    Chưa biết
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Đơn vị triệu đồng/năm. Để trống nếu chưa biết; mức bình quân ngành chỉ là tham khảo, không phải học phí riêng của trường.
              </p>
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
                      setTargetProvinceFilter('');
                      setSelectedSchoolCode(null);
                      clearUniversityAnalysis();
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
            <label className="block space-y-2 text-sm font-semibold text-white">
              Tỉnh/thành phố mong muốn
              <select
                value={targetProvinceFilter}
                onChange={(e) => {
                  setTargetProvinceFilter(e.target.value);
                  setSelectedSchoolCode(null);
                  clearUniversityAnalysis();
                }}
                className="min-h-11 w-full rounded-lg border border-slate-700 bg-[#141923] px-3 text-base text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Tất cả tỉnh/thành trong vùng đã chọn</option>
                {AUDITED_PROVINCE_OPTIONS.filter((province) => targetRegionFilter === 'ALL' || getRegionFromProvinceCity(province) === targetRegionFilter).map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </label>

          <div className="rounded-2xl border border-blue-500/40 bg-[#0E1117] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-white">Phân tích trường</h3>
                <p className="mt-1 text-sm text-slate-300">Tra cứu ngành, tổ hợp, điểm chuẩn và học phí theo yêu cầu; chỉ xác nhận dữ kiện có nguồn chính thức đúng năm.</p>
              </div>
              <button
                type="button"
                onClick={() => void requestUniversityAnalysis()}
                disabled={isAnalyzingUniversities}
                className="min-h-11 rounded-lg bg-blue-600 px-5 py-2 text-base font-bold text-white hover:bg-blue-500 disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
              >
                {isAnalyzingUniversities ? 'Đang phân tích…' : 'Gợi ý trường'}
              </button>
            </div>

            {hasRequestedUniversityAnalysis && (
              <div className="space-y-3">
                {isAnalyzingUniversities && (
                  <p role="status" className="rounded-lg border border-slate-700 bg-[#141923] p-4 text-base text-slate-200">
                    Đang tra cứu nguồn chính thức cho ngành, tổ hợp, khu vực và ngân sách bạn đã nhập…
                  </p>
                )}
                {universityAnalysisError && (
                  <p role="alert" className="rounded-lg border border-red-900 bg-red-950/30 p-4 text-base text-red-200">
                    {universityAnalysisError}
                  </p>
                )}
                {universityAnalysis && (
                  <div className="space-y-3">
                    {universityAnalysis.headline && <h4 className="text-lg font-bold text-white">{universityAnalysis.headline}</h4>}
                    {universityAnalysis.summary && <p className="text-base leading-relaxed text-slate-200">{universityAnalysis.summary}</p>}
                    {universityAnalysis.scoreAnalysis && <p className="text-sm leading-relaxed text-slate-300">{universityAnalysis.scoreAnalysis}</p>}
                    {universityAnalysis.budgetNote && <p className="text-sm leading-relaxed text-slate-300">{universityAnalysis.budgetNote}</p>}
                    {universityAnalysis.warnings?.map((warning: string, index: number) => (
                      <p key={`school-warning-${index}`} className="rounded-lg border border-amber-700/70 bg-amber-950/30 p-3 text-sm text-amber-200">{warning}</p>
                    ))}
                    <ol className="flex flex-col gap-2" aria-label="Trường được gợi ý">
                      {(universityAnalysis.recommendedSchools || []).map((school: any, index: number) => (
                        <li key={`${school.institutionCode || school.name}-${index}`} className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-[#141923] p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-blue-300">Gợi ý {index + 1}{school.city ? ' · ' + school.city : ''}</p>
                            <h4 className="mt-1 text-lg font-bold text-white">{school.name}</h4>
                            <p className={`mt-1 text-sm ${school.programStatus === 'VERIFIED' ? 'text-emerald-300' : 'text-amber-300'}`}>
                              {school.programStatus === 'VERIFIED'
                                ? `Ngành, tổ hợp và trường đã xác minh năm ${school.programYear}`
                                : school.programStatus === 'CONFLICT' ? 'Nguồn chính thức mâu thuẫn về ngành hoặc tổ hợp; không xác nhận kết quả này.' : 'Thông tin ngành hoặc tổ hợp chưa xác minh đầy đủ'}
                            </p>
                            {school.programName && <p className="mt-1 text-sm text-slate-300">Ngành: {school.programName}{school.majorCode ? ` · Mã ${school.majorCode}` : ''}{school.combinationCode ? ` · Tổ hợp ${school.combinationCode}` : ''}</p>}
                            {school.programSource?.url && (
                              <a href={school.programSource.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-blue-300 underline underline-offset-2">
                                Nguồn ngành và tổ hợp: {school.programSource.title}
                              </a>
                            )}
                            {school.whyFit && <p className="mt-1 text-base leading-relaxed text-slate-300">{school.whyFit}</p>}
                            {school.cutoffBenchmark != null && (
                              <p className="mt-1 text-sm text-slate-400">
                                Điểm chuẩn năm {school.cutoffYear}: {Number(school.cutoffBenchmark).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} điểm
                              </p>
                            )}
                            {school.cutoffSource?.url && (
                              <a href={school.cutoffSource.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-blue-300 underline underline-offset-2">
                                Nguồn điểm chuẩn: {school.cutoffSource.title}
                              </a>
                            )}
                            {school.cutoffBenchmark == null && (
                              <p className="mt-1 text-sm text-amber-300">
                                {school.cutoffStatus === 'CONFLICT'
                                  ? `Nguồn chính thức mâu thuẫn về điểm chuẩn năm ${universityAnalysis.academicYear}; hệ thống không chọn một con số.`
                                  : `Điểm chuẩn năm ${universityAnalysis.academicYear}: chưa xác minh từ nguồn chính thức.`}
                              </p>
                            )}
                            {school.tuitionAnnualMillions != null && (
                              <p className="mt-1 text-sm text-slate-400">
                                Học phí năm {school.tuitionYear}: {Number(school.tuitionAnnualMillions).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} triệu/năm
                              </p>
                            )}
                            {school.tuitionSource?.url && (
                              <a href={school.tuitionSource.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm text-blue-300 underline underline-offset-2">
                                Nguồn học phí: {school.tuitionSource.title}
                              </a>
                            )}
                            {school.tuitionAnnualMillions == null && <p className="mt-1 text-sm text-amber-300">{school.tuitionStatus === 'CONFLICT' ? `Nguồn chính thức mâu thuẫn về học phí năm ${universityAnalysis.academicYear}; hệ thống không chọn một con số.` : `Học phí năm ${universityAnalysis.academicYear}: chưa xác minh từ nguồn chính thức.`}</p>}
                          </div>
                          <button
                            type="button"
                            disabled={school.programStatus !== 'VERIFIED'}
                            onClick={() => {
                              setSelectedSchoolCode(school.institutionCode || school.name);
                              setActiveTab('tab-domino');
                            }}
                            className="min-h-11 shrink-0 rounded-lg bg-blue-600 px-5 text-base font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                          >
                            {school.programStatus === 'VERIFIED' ? 'Chọn trường' : 'Chưa thể chọn'}
                          </button>
                        </li>
                      ))}
                    </ol>
                    {(!universityAnalysis.recommendedSchools || universityAnalysis.recommendedSchools.length === 0) && (
                      <p role="status" className="rounded-lg border border-amber-700/70 bg-amber-950/30 p-3 text-sm text-amber-200">Chưa tìm thấy kết quả ngành và tổ hợp có thể xác minh từ nguồn chính thức cho năm này. Không có điểm chuẩn hoặc học phí dựng sẵn được hiển thị.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>


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
                    <strong>Kinh phí &amp; Trường học</strong>: {maxTuition == null ? 'Ngân sách chưa biết' : `Giới hạn ${maxTuition} triệu/năm`} · học phí chỉ được nêu khi có nguồn chính thức cho trường đã chọn.
                  </span>
                </li>
              </ul>
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
                    {topCombo?.hasData ? `Điểm hồ sơ ${topCombo.officialScore}đ đã được gửi cùng ngành và tổ hợp để tra cứu. Kết quả có điểm chuẩn sẽ kèm năm và nguồn chính thức.` : 'Chưa có điểm số để so sánh với mốc tuyển sinh. Hãy nhập điểm dự kiến hoặc điểm từng môn ở Bước 2.'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#141923] border border-slate-800 space-y-1">
                  <span className="font-bold text-white block">[Tổ hợp ➔ Cạnh tranh]</span>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {universityAnalysis?.recommendedSchools?.length || 0} kết quả đã được tìm cho tổ hợp {selectedComboCode || (topCombo?.hasSubjectScores ? topCombo.code : 'chưa chọn')}; dữ kiện thiếu sẽ được ghi là chưa xác minh.
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
