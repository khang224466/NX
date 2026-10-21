import React, { useState, useMemo, useEffect, useRef } from 'react';
import { sfx } from '../services/soundEffects';
import {
  calculateEffectivePriority,
  calculateBasePriority30
} from '../services/admissionsCalculationEngine';


import seedData from '../data/seed_data.json';
import { AUDITED_INSTITUTIONS_300 } from '../data/auditedInstitutionsData';
import { getRegionFromProvinceCity } from '../services/unifiedSearchEngine';
import { CAREER_CATALOG, CAREER_PROGRAM_CATALOG, getMajorAdmissionRecords, getSectorTuitionBenchmark } from '../services/careerCatalog';

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
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [schoolMatchFilter, setSchoolMatchFilter] = useState<'ALL' | 'MATCHED'>('ALL');

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
  const [analysisError, setAnalysisError] = useState('');
  const analysisRequestIdRef = useRef(0);

  const clearCareerAnalysis = () => {
    analysisRequestIdRef.current += 1;
    setHasRequestedSuggestions(false);
    setIsAnalyzingWithGemini(false);
    setGeminiAnalysis(null);
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
    return catalog.find(m => m.codeTT09 === selectedMajorCode) || null;
  }, [catalog, selectedMajorCode]);

  // Current chosen university object
  const currentSchool = useMemo(() => {
    if (!selectedSchoolCode) return null;
    return (AUDITED_INSTITUTIONS_300.find(i => i.institution_code === selectedSchoolCode) ||
      (seedData.anchorInstitutions as any[])?.find(i => i.code === selectedSchoolCode)) || null;
  }, [selectedSchoolCode]);

  const requestMajorSuggestions = async () => {
    sfx.playUiClick();
    setHasRequestedSuggestions(true);
    setGeminiAnalysis(null);
    setAnalysisError('');

    if (!hasRecommendationInput) {
      setAnalysisError('Hãy nhập sở thích, năng lực hoặc ít nhất một điểm số trước khi gợi ý ngành.');
      return;
    }

    const requestId = ++analysisRequestIdRef.current;
    setIsAnalyzingWithGemini(true);
    try {
      const response = await fetch('/api/ai/counselor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          careerInterests,
          careerStrengths,
          scores,
          aptitudeScores,
          maxTuition,
          priorityRegion,
          priorityObject,
          targetRegionFilter,
          targetJob,
          majorCatalog: catalog.map((major) => ({
            codeTT09: major.codeTT09,
            codeTT74: major.codeTT74,
            name: major.name,
            sector: major.sector,
            admissionsCombos: major.admissionsCombos,
            targetJobs: major.targetJobs,
            programCount: major.programCount,
            admissionRecordCount: major.admissionRecordCount
          }))
        })
      });
      const payload = await response.json();
      if (requestId !== analysisRequestIdRef.current) return;
      if (!response.ok || payload?.success !== true || payload?.provider !== 'gemini' || !payload?.analysis) {
        throw new Error(payload?.error || 'Chưa nhận được phân tích từ Gemini. Hãy thử lại.');
      }
      setGeminiAnalysis(payload.analysis);
    } catch (error) {
      if (requestId === analysisRequestIdRef.current) {
        setAnalysisError(error instanceof Error ? error.message : 'Không thể kết nối Gemini. Hãy thử lại.');
      }
    } finally {
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
    setScores({ math: '', literature: '', english: '', physics: '', chemistry: '', biology: '', history: '', geography: '', informatics: '', economicLegal: '' });
    setAptitudeScores({ apt_hinhHoa: '', apt_trangTri: '', apt_veMyThuat: '', apt_thamAm: '', apt_thanhNhac: '', apt_theThao: '', apt_mamNon: '', apt_baoChi: '', apt_dienXuat: '' });
    setSelectedProgramId(null);
    setSchoolSearchQuery('');
    setSchoolMatchFilter('ALL');
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
                setHasRequestedSuggestions(false);
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
                        setHasRequestedSuggestions(false);
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
                        setHasRequestedSuggestions(false);
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
                                setHasRequestedSuggestions(false);
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
                                setHasRequestedSuggestions(false);
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
                  className="min-h-11 rounded-lg bg-blue-600 px-6 py-3 text-base font-bold text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  Gợi ý ngành
                </button>
              </div>

              {hasRequestedSuggestions && (
                <section aria-labelledby="recommended-majors-title" className="rounded-xl border border-slate-700 bg-[#0E1117] p-5 space-y-4">
                  <div>
                    <h3 id="recommended-majors-title" className="text-xl font-bold text-white">Phân tích và gợi ý ngành</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Kết quả được Gemini phân tích từ hồ sơ bạn nhập và đối chiếu với danh mục ngành.
                    </p>
                  </div>

                  {isAnalyzingWithGemini && (
                    <p role="status" className="rounded-lg border border-slate-700 bg-[#141923] p-4 text-base text-slate-200">
                      Gemini đang phân tích toàn bộ hồ sơ và đối chiếu danh mục ngành…
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
                      <ol className="flex flex-col gap-2" aria-label="Danh sách ngành do Gemini gợi ý">
                        {geminiAnalysis.recommendedMajors.map((major: any, index: number) => (
                          <li key={major.codeTT09} className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-[#141923] p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-blue-300">Gợi ý {index + 1}</p>
                              <h5 className="mt-1 text-lg font-bold text-white">{major.name}</h5>
                              {major.whyFit && <p className="mt-1 text-base leading-relaxed text-slate-300">{major.whyFit}</p>}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectMajor(major.codeTT09, 'tab-combo')}
                              className="min-h-11 shrink-0 rounded-lg bg-blue-600 px-5 text-base font-bold text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                            >
                              Chọn ngành
                            </button>
                          </li>
                        ))}
                      </ol>
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
              className="min-h-12 w-full rounded-xl border border-slate-700 bg-[#141923] px-4 text-base text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
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
                    setActiveTab('tab-domino');
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
                </button>
              ))}
            </div>
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
                    <strong>Kinh phí &amp; Trường học</strong>: {maxTuition == null ? 'Ngân sách chưa biết' : `Giới hạn ${maxTuition} triệu/năm`} · bình quân nhóm ngành {stratifiedSchools.tuitionBenchmark?.avg2026_2027 ?? 'chưa có dữ liệu'} triệu/năm; đây không phải học phí riêng của trường.
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
