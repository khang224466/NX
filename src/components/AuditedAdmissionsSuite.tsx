import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calculator, 
  ShieldCheck, 
  Search, 
  Building2, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  Sliders, 
  Layers, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  ChevronRight, 
  FileText,
  Save,
  RotateCcw
} from 'lucide-react';
import { 
  AUDITED_INSTITUTIONS_300 
} from '../data/auditedInstitutionsData';
import { 
  AUDITED_MAJOR_METHOD_SCORING_DB 
} from '../data/auditedMajorScoringDatabase';
import { 
  AUDITED_FORMULAS_LIBRARY,
  AUDITED_SCORE_CONVERSIONS,
  AUDITED_ELIGIBILITY_RULES,
  AUDITED_SOURCE_REGISTRY,
  SectorGroup,
  Institution,
  MajorMethodScoringRecord
} from '../data/admissionsAuditedEngine';
import { 
  ComprehensiveCandidateInput,
  executeAdmissionsCalculation,
  EngineScoringBreakdown
} from '../services/admissionsCalculationEngine';
import { sfx } from '../services/soundEffects';

export type AuditedSuiteModule = 'profile' | 'calculator' | 'optimizer' | 'provenance';

const SECTOR_LABELS: Record<SectorGroup, { label: string; icon: string }> = {
  KINH_TE_QUAN_TRI: { label: 'Kinh tế - Quản trị', icon: '💼' },
  CNTT_BAN_DAN_AI: { label: 'CNTT - Bán dẫn - AI', icon: '💻' },
  KY_THUAT_CONG_NGHE: { label: 'Kỹ thuật - Công nghệ', icon: '⚙️' },
  Y_DUOC_SUC_KHOE: { label: 'Y Dược - Sức khỏe', icon: '🩺' },
  SU_PHAM_GIAO_DUC: { label: 'Sư phạm - Giáo dục', icon: '🎓' },
  LUAT_HANH_CHINH: { label: 'Luật - Hành chính', icon: '⚖️' },
  NGON_NGU_QUOC_TE: { label: 'Ngôn ngữ - Quốc tế', icon: '🌐' },
  CONG_AN_QUAN_DOI: { label: 'Công an - Quân đội', icon: '🛡️' },
  KIEN_TRUC_NGHE_THUAT_TDTT: { label: 'Kiến trúc - Nghệ thuật - TDTT', icon: '🎨' }
};

interface UserAspirationItem {
  id: string;
  order: number;
  record: MajorMethodScoringRecord;
  institution: Institution;
  calculatedScore: number;
  scaleMax: number;
  cutoff: number;
  safetyTier: 'SAFE' | 'COMPETITIVE' | 'RISKY';
  scoreDiff: number;
  warnings: string[];
}

export const AuditedAdmissionsSuite: React.FC = () => {
  const [activeModule, setActiveModule] = useState<AuditedSuiteModule>('calculator');

  // ===========================================================================
  // MODULE 1: COMPREHENSIVE CANDIDATE PROFILE STATE
  // ===========================================================================
  const [selectedSector, setSelectedSector] = useState<SectorGroup>('CNTT_BAN_DAN_AI');
  const [profile, setProfile] = useState<ComprehensiveCandidateInput>({
    thptScores: {
      math: 9.0,
      physics: 8.5,
      chemistry: 8.0,
      biology: 7.5,
      literature: 7.5,
      english: 8.5,
      history: 7.0,
      geography: 7.0,
      civics: 8.0,
      informatics: 9.0,
      technology: 8.5
    },
    transcriptAvg6HK: {
      math: 8.8,
      physics: 8.5,
      chemistry: 8.2,
      biology: 8.0,
      literature: 7.8,
      english: 8.7,
      overall10: 8.4,
      overall11: 8.6,
      overall12: 8.8
    },
    dgnlHsa150: 105,
    dgnlVact1200: 880,
    tsaBka100: 78.5,
    sptScores: {
      math: 8.5,
      literature: 7.5,
      english: 8.5,
      physics: 8.0,
      chemistry: 7.5
    },
    btbca100: 76.0,
    testAs130: {
      coreTest: 110,
      subjectModule: 115
    },
    satScore1600: 1350,
    ieltsScore: 7.0,
    toeflIbtScore: 85,
    hskLevel: 0,
    priorityRegionCode: 'KV2', // +0.25
    priorityObjectCode: 'DT_0', // 0.0
    rawIncentiveBonus: 0.5,
    aspirationOrder: 1,
    graduationYear: 2026,
    admissionYear: 2026
  });

  // Load candidate profile from localStorage if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem('AUDITED_CANDIDATE_PROFILE_2026');
      if (saved) {
        const parsed = JSON.parse(saved);
        setProfile(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore JSON errors
    }
  }, []);

  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSaveProfile = () => {
    try {
      localStorage.setItem('AUDITED_CANDIDATE_PROFILE_2026', JSON.stringify(profile));
      setSaveStatus('Đã lưu hồ sơ thành công vào bộ nhớ trình duyệt!');
      sfx.play('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('Lỗi lưu trữ cục bộ');
    }
  };

  const handleResetProfile = () => {
    if (window.confirm('Bạn có chắc muốn đặt lại hồ sơ mẫu mặc định không?')) {
      localStorage.removeItem('AUDITED_CANDIDATE_PROFILE_2026');
      setProfile({
        thptScores: {
          math: 9.0,
          physics: 8.5,
          chemistry: 8.0,
          biology: 7.0,
          literature: 7.5,
          english: 8.5,
          history: 7.0,
          geography: 7.0,
          economicLegal: 7.0,
          informatics: 9.0,
          technology: 8.0
        },
        transcriptAvg6HK: {
          math: 8.8,
          physics: 8.5,
          chemistry: 8.2,
          biology: 8.0,
          literature: 7.8,
          english: 8.7,
          overall10: 8.4,
          overall11: 8.6,
          overall12: 8.8
        },
        dgnlHsa150: 105,
        dgnlVact1200: 880,
        tsaBka100: 78.5,
        sptScores: {
          math: 8.5,
          literature: 7.5,
          english: 8.5,
          physics: 8.0,
          chemistry: 7.5
        },
        btbca100: 76.0,
        testAs130: {
          coreTest: 110,
          subjectModule: 115
        },
        satScore1600: 1350,
        ieltsScore: 7.0,
        toeflIbtScore: 85,
        hskLevel: 0,
        priorityRegionCode: 'KV2',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0.5,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      sfx.play('click');
      setSaveStatus('Đã đặt lại hồ sơ mẫu!');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // ===========================================================================
  // MODULE 2: INTERACTIVE CALCULATOR SELECTION STATE
  // ===========================================================================
  const [selectedUniCode, setSelectedUniCode] = useState<string>('BKA');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('BKA_IT1_PT100');
  const [uniSearchQuery, setUniSearchQuery] = useState<string>('');

  // ===========================================================================
  // MODULE 3: ASPIRATION OPTIMIZER LIST STATE
  // ===========================================================================
  const [aspirations, setAspirations] = useState<string[]>([
    'BKA_IT1_PT100',
    'KHA_KT_PT100',
    'QSC_KHMT_PT402',
    'SPS_TOAN_PT100'
  ]);

  // ===========================================================================
  // MODULE 4: AUDIT REGISTRY ACTIVE TAB
  // ===========================================================================
  const [registryTab, setRegistryTab] = useState<'institutions' | 'formulas' | 'conversions' | 'sources' | 'eligibility'>('institutions');
  const [registrySearch, setRegistrySearch] = useState<string>('');

  // ---------------------------------------------------------------------------
  // FILTERED INSTITUTIONS
  // ---------------------------------------------------------------------------
  const filteredInstitutions = useMemo(() => {
    return AUDITED_INSTITUTIONS_300.filter(inst => {
      if (uniSearchQuery.trim()) {
        const q = uniSearchQuery.toLowerCase().trim();
        const matchCode = inst.institution_code.toLowerCase().includes(q);
        const matchName = inst.official_name.toLowerCase().includes(q);
        const matchCity = inst.verified_province_city.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCity) return false;
      }
      return true;
    });
  }, [uniSearchQuery]);

  const currentInstitution = useMemo(() => {
    return AUDITED_INSTITUTIONS_300.find(i => i.institution_code === selectedUniCode) || AUDITED_INSTITUTIONS_300[0];
  }, [selectedUniCode]);

  // Majors available for the selected institution
  const availableMajorRecords = useMemo(() => {
    const list = AUDITED_MAJOR_METHOD_SCORING_DB.filter(r => r.institution_code === selectedUniCode);
    if (list.length > 0) return list;
    return [{
      record_id: `${selectedUniCode}_GEN_PT100`,
      institution_code: selectedUniCode,
      program_id: `${selectedUniCode}_GEN`,
      method_id: 'PT100_THPT',
      formula_id: 'F01_THPT_111_30',
      campus_location: currentInstitution.verified_province_city,
      audited_major_name: `Xét tuyển chính quy ${currentInstitution.official_name}`,
      admissions_year: 2026,
      subject_combinations: ['A00', 'A01', 'D01'],
      formula_expression: 'M1 + M2 + M3 + Bonus + Priority_Eff',
      audited_official_scale: 'THANG_30' as const,
      scale_max: 30,
      audited_official_cutoff: 24.50,
      analytical_normalized_100: 81.67,
      moet_quality_floor_30: 15.0,
      bonus_and_priority_rule: 'Trần bonus 3.0đ; giảm tuyến tính từ 22.5',
      eligibility_and_tie_breaker: 'Tốt nghiệp THPT, không có môn <= 1.0',
      source_url: currentInstitution.official_scheme_or_cutoff_url,
      verification_status: currentInstitution.verification_status
    }];
  }, [selectedUniCode, currentInstitution]);

  const activeRecord = useMemo(() => {
    return availableMajorRecords.find(r => r.record_id === selectedRecordId) || availableMajorRecords[0];
  }, [availableMajorRecords, selectedRecordId]);

  const activeFormula = useMemo(() => {
    return AUDITED_FORMULAS_LIBRARY.find(f => f.formula_id === activeRecord.formula_id) || AUDITED_FORMULAS_LIBRARY[0];
  }, [activeRecord]);

  // ---------------------------------------------------------------------------
  // REAL-TIME CALCULATION BREAKDOWN
  // ---------------------------------------------------------------------------
  const calculationResult: EngineScoringBreakdown = useMemo(() => {
    return executeAdmissionsCalculation(
      activeRecord.formula_id,
      selectedUniCode,
      profile,
      activeRecord.audited_official_scale,
      activeRecord.scale_max,
      activeRecord.subject_combinations?.[0] || 'A00'
    );
  }, [activeRecord, selectedUniCode, profile]);

  // ---------------------------------------------------------------------------
  // ASPIRATION OPTIMIZER LIST CALCULATION
  // ---------------------------------------------------------------------------
  const aspirationEvaluations: UserAspirationItem[] = useMemo(() => {
    return aspirations.map((recId, idx) => {
      const order = idx + 1;
      let rec = AUDITED_MAJOR_METHOD_SCORING_DB.find(r => r.record_id === recId);
      let inst = AUDITED_INSTITUTIONS_300.find(i => i.institution_code === rec?.institution_code);

      if (!rec || !inst) {
        rec = availableMajorRecords[0];
        inst = currentInstitution;
      }

      const res = executeAdmissionsCalculation(
        rec.formula_id,
        rec.institution_code,
        { ...profile, aspirationOrder: order },
        rec.audited_official_scale,
        rec.scale_max,
        rec.subject_combinations?.[0] || 'A00'
      );

      const scoreDiff = Number((res.officialAdmissionsScore - rec.audited_official_cutoff).toFixed(2));
      let safetyTier: 'SAFE' | 'COMPETITIVE' | 'RISKY' = 'COMPETITIVE';
      if (scoreDiff >= 1.0) {
        safetyTier = 'SAFE';
      } else if (scoreDiff < -0.5) {
        safetyTier = 'RISKY';
      }

      const warnings: string[] = [];
      if (rec.formula_id === 'F33_TEACHER_111_30' || rec.audited_major_name.toLowerCase().includes('sư phạm')) {
        if (order > 5) {
          warnings.push(`⚠️ VI PHẠM TT 06/2026: Ngành Sư phạm phải đặt từ NV1 đến NV5 (hiện tại là NV${order}).`);
        }
      }

      if (inst.institution_status === 'MERGED_HISTORICAL' || inst.institution_code === 'DNV' || inst.institution_code === 'LBS') {
        warnings.push(`ℹ️ MÃ TRƯỜNG LỊCH SỬ: ${inst.official_name} (${inst.institution_code}) đã chuyển giao/sáp nhập. Thí sinh cần đăng ký theo mã mới: ${inst.redirect_target_code || 'HCH'}.`);
      }

      if (!res.eligibilityStatus.passedParalysisCheck) {
        warnings.push('❌ Có môn thi bị điểm liệt (<= 1.00 điểm).');
      }

      if (!res.eligibilityStatus.passedMoetSpecialFloor) {
        warnings.push(`⚠️ Không đạt ngưỡng sàn Bộ GD&ĐT: ${res.eligibilityStatus.moetSpecialFloorValue} điểm.`);
      }

      return {
        id: `${rec.record_id}_${order}`,
        order,
        record: rec,
        institution: inst,
        calculatedScore: res.officialAdmissionsScore,
        scaleMax: res.scaleMax,
        cutoff: rec.audited_official_cutoff,
        safetyTier,
        scoreDiff,
        warnings
      };
    });
  }, [aspirations, profile, availableMajorRecords, currentInstitution]);

  const moveAspiration = (index: number, direction: 'UP' | 'DOWN') => {
    sfx.play('click');
    const newIdx = direction === 'UP' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= aspirations.length) return;
    const nextList = [...aspirations];
    const temp = nextList[index];
    nextList[index] = nextList[newIdx];
    nextList[newIdx] = temp;
    setAspirations(nextList);
  };

  const removeAspiration = (index: number) => {
    sfx.play('click');
    setAspirations(aspirations.filter((_, i) => i !== index));
  };

  const addCurrentToAspirations = () => {
    sfx.play('success');
    if (!aspirations.includes(activeRecord.record_id)) {
      setAspirations([...aspirations, activeRecord.record_id]);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* =======================================================================
          TOP ARCHITECTURAL HERO & 4-MODULE SELECTOR
          ======================================================================= */}
      <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 text-xs font-mono font-bold tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                AUDITED ADMISSIONS ENGINE 2026
              </span>
              <span className="px-3 py-1 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                36 HỌ CÔNG THỨC • 39 QUY TẮC QUY ĐỔI • 300 TRƯỜNG
              </span>
              <span className="px-3 py-1 text-xs font-mono text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-full">
                TT 06/2026/TT-BGDĐT
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif-luxury font-bold text-white tracking-tight">
              Kiến Trúc Máy Tính Điểm & Đối Soát Tuyển Sinh Đại Học 2026
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Tích hợp toàn bộ dữ liệu kiểm toán từ sổ tính chuẩn, triệt để loại bỏ công thức gộp sai lệch. Tự động áp dụng trần điểm cộng, chống nhân đôi chứng chỉ ngoại ngữ và hàm suy giảm ưu tiên tuyến tính từ 75% thang điểm.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <button
              onClick={() => {
                sfx.play('click');
                setActiveModule('calculator');
              }}
              className="flex-1 md:flex-initial px-5 py-3 text-xs font-bold tracking-wider uppercase bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              Tính Điểm Ngay
            </button>
          </div>
        </div>

        {/* 4 Connected Modules Segmented Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-8 pt-6 border-t border-[#262630]">
          {[
            { id: 'profile', label: '1. Hồ Sơ Năng Lực', desc: '11 môn, 6HK, ĐGNL, CCNN', icon: Sliders },
            { id: 'calculator', label: '2. Máy Tính Thời Gian Thực', desc: '36 công thức, giải trình bước', icon: Calculator },
            { id: 'optimizer', label: '3. Tối Ưu Nguyện Vọng', desc: 'NV1-NV15, 3 vùng, cảnh báo TT06', icon: Layers },
            { id: 'provenance', label: '4. Minh Bạch Nguồn Gốc', desc: 'Đề án gốc, 9 bảng kiểm toán', icon: BookOpen }
          ].map(m => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  sfx.play('click');
                  setActiveModule(m.id as AuditedSuiteModule);
                }}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border ${
                  isActive 
                    ? 'bg-blue-600/15 border-blue-500 text-white shadow-md shadow-blue-600/10' 
                    : 'bg-[#121217] border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#1c1c24]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-500'}`} />
                  <span className="font-bold text-xs">{m.label}</span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 truncate">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =======================================================================
          MODULE 1: CAREER & CANDIDATE PROFILE BUILDER
          ======================================================================= */}
      {activeModule === 'profile' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Sector Group Selector */}
          <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>🎯</span> Định Hướng Nhóm Ngành Trọng Điểm (Sector Group)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Kết nối trực tiếp cột Sector_Group trong 03_Major_Program_Registry & 02_Institution_Registry
                </p>
              </div>
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
                {SECTOR_LABELS[selectedSector].label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {(Object.keys(SECTOR_LABELS) as SectorGroup[]).map(key => {
                const item = SECTOR_LABELS[key];
                const isSelected = selectedSector === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      sfx.play('click');
                      setSelectedSector(key);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 font-bold shadow-md shadow-blue-600/30'
                        : 'bg-[#121217] border-[#262630] text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    <div className="text-lg mb-1">{item.icon}</div>
                    <div className="truncate">{item.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comprehensive Score Input Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Điểm 11 môn thi THPT */}
            <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-5 space-y-4">
              <div className="border-b border-[#262630] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Điểm 11 Môn Thi Tốt Nghiệp THPT (Thang 10)
                </h4>
                <span className="text-[11px] text-zinc-400">Dùng cho các phương thức PT100, K01, CAND, Sư phạm...</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { key: 'math', label: 'Toán học' },
                  { key: 'physics', label: 'Vật lý' },
                  { key: 'chemistry', label: 'Hóa học' },
                  { key: 'biology', label: 'Sinh học' },
                  { key: 'literature', label: 'Ngữ văn' },
                  { key: 'english', label: 'Tiếng Anh' },
                  { key: 'informatics', label: 'Tin học' },
                  { key: 'technology', label: 'Công nghệ' },
                  { key: 'history', label: 'Lịch sử' },
                  { key: 'geography', label: 'Địa lý' },
                  { key: 'civics', label: 'GDCD' },
                ].map(item => (
                  <div key={item.key} className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">{item.label}</div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={profile.thptScores[item.key as keyof typeof profile.thptScores] ?? ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setProfile({
                          ...profile,
                          thptScores: { ...profile.thptScores, [item.key]: val }
                        });
                      }}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Điểm Học bạ 6 Học kỳ & Đánh giá năng lực */}
            <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-5 space-y-4">
              <div className="border-b border-[#262630] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Học Bạ 6 Kỳ & Kỳ Thi ĐGNL / ĐGTD 2026
                </h4>
                <span className="text-[11px] text-zinc-400">Dùng cho UEH Thang 100, VGU HB10, QSB, HUST TSA</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-[#121217] p-3 rounded-xl border border-[#262630] space-y-2">
                  <div className="font-bold text-zinc-300">Điểm TBC Học Bạ Theo Lớp</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-[10px] text-zinc-400 mb-1">Lớp 10 (TB)</div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={profile.transcriptAvg6HK.overall10 || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          transcriptAvg6HK: { ...profile.transcriptAvg6HK, overall10: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 mb-1">Lớp 11 (TB)</div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={profile.transcriptAvg6HK.overall11 || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          transcriptAvg6HK: { ...profile.transcriptAvg6HK, overall11: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400 mb-1">Lớp 12 (TB)</div>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={profile.transcriptAvg6HK.overall12 || ''}
                        onChange={(e) => setProfile({
                          ...profile,
                          transcriptAvg6HK: { ...profile.transcriptAvg6HK, overall12: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">HSA ĐHQGHN (max 150)</div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="150"
                      value={profile.dgnlHsa150 || ''}
                      onChange={(e) => setProfile({ ...profile, dgnlHsa150: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">V-ACT ĐHQG-HCM (max 1200)</div>
                    <input
                      type="number"
                      step="5"
                      min="0"
                      max="1200"
                      value={profile.dgnlVact1200 || ''}
                      onChange={(e) => setProfile({ ...profile, dgnlVact1200: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">TSA Bách Khoa (max 100)</div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={profile.tsaBka100 || ''}
                      onChange={(e) => setProfile({ ...profile, tsaBka100: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">Bài thi Bộ Công an (max 100)</div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={profile.btbca100 || ''}
                      onChange={(e) => setProfile({ ...profile, btbca100: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Chứng chỉ & Điểm Ưu tiên theo Thông tư 06/2026 */}
            <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-5 space-y-4">
              <div className="border-b border-[#262630] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Chứng Chỉ Quốc Tế & Điểm Ưu Tiên (TT 06)
                </h4>
                <span className="text-[11px] text-zinc-400">Kiểm soát trần điểm cộng & chống nhân đôi CCNN</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">Điểm IELTS (e.g. 7.0)</div>
                    <select
                      value={profile.ieltsScore || 0}
                      onChange={(e) => setProfile({ ...profile, ieltsScore: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="0">Không có</option>
                      <option value="5.5">IELTS 5.5</option>
                      <option value="6.0">IELTS 6.0</option>
                      <option value="6.5">IELTS 6.5</option>
                      <option value="7.0">IELTS 7.0</option>
                      <option value="7.5">IELTS 7.5</option>
                      <option value="8.0">IELTS 8.0</option>
                      <option value="8.5">IELTS 8.5+</option>
                    </select>
                  </div>
                  <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">SAT (max 1600)</div>
                    <input
                      type="number"
                      step="10"
                      min="0"
                      max="1600"
                      value={profile.satScore1600 || ''}
                      onChange={(e) => setProfile({ ...profile, satScore1600: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">Khu Vực Ưu Tiên</div>
                    <select
                      value={profile.priorityRegionCode}
                      onChange={(e) => setProfile({ ...profile, priorityRegionCode: e.target.value as any })}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="KV1">KV1 (+0.75đ)</option>
                      <option value="KV2_NT">KV2-NT (+0.50đ)</option>
                      <option value="KV2">KV2 (+0.25đ)</option>
                      <option value="KV3">KV3 (0.00đ)</option>
                    </select>
                  </div>
                  <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">Đối Tượng Ưu Tiên</div>
                    <select
                      value={profile.priorityObjectCode}
                      onChange={(e) => setProfile({ ...profile, priorityObjectCode: e.target.value as any })}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="DT_0">Không (+0.0đ)</option>
                      <option value="DT_NHOM_1">Nhóm 1 (+2.0đ)</option>
                      <option value="DT_NHOM_2">Nhóm 2 (+1.0đ)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">Điểm Khuyến Khích Thô</div>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max="5"
                      value={profile.rawIncentiveBonus}
                      onChange={(e) => setProfile({ ...profile, rawIncentiveBonus: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                    <div className="text-[10px] text-zinc-500 mt-1">Trần tối đa 3.0đ/30</div>
                  </div>
                  <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630]">
                    <div className="text-zinc-400 text-[11px] mb-1">Năm Tốt Nghiệp THPT</div>
                    <select
                      value={profile.graduationYear}
                      onChange={(e) => setProfile({ ...profile, graduationYear: parseInt(e.target.value, 10) })}
                      className="w-full bg-[#1c1c24] border border-[#333344] rounded px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value={2026}>2026 (Năm hiện tại)</option>
                      <option value={2025}>2025 (Hưởng ưu tiên)</option>
                      <option value={2024}>2024 (Mất ưu tiên KV)</option>
                    </select>
                    <div className="text-[10px] text-amber-500/80 mt-1">&gt; 1 năm mất KV theo TT06</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#262630]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                Lưu Hồ Sơ
              </button>
              <button
                type="button"
                onClick={handleResetProfile}
                className="px-3.5 py-2 bg-[#22222d] hover:bg-[#2c2c3a] text-zinc-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer border border-[#333344] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Đặt Lại Hồ Sơ Gốc
              </button>
              {saveStatus && (
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saveStatus}
                </span>
              )}
            </div>

            <button
              onClick={() => {
                sfx.play('success');
                setActiveModule('calculator');
              }}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
            >
              Chuyển Sang Máy Tính Điểm
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* =======================================================================
          MODULE 2: INTERACTIVE CALCULATOR (SHEET 13 REPLICATION)
          ======================================================================= */}
      {activeModule === 'calculator' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* University & Program Picker Toolbar */}
          <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  Chọn Trường & Ngành Xét Tuyển Năm 2026
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tự động ánh xạ 1 trong 36 họ công thức chuẩn và bảng quy đổi riêng của từng trường
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Tìm mã hoặc tên trường (BKA, KHA, QSB...)"
                  value={uniSearchQuery}
                  onChange={(e) => setUniSearchQuery(e.target.value)}
                  className="w-full bg-[#121217] border border-[#262630] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick School Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <span className="text-xs font-mono text-zinc-400 whitespace-nowrap">Trường tiêu biểu:</span>
              {[
                { code: 'BKA', name: 'ĐH Bách Khoa Hà Nội' },
                { code: 'KHA', name: 'ĐH Kinh Tế Quốc Dân' },
                { code: 'NTH', name: 'ĐH Ngoại Thương' },
                { code: 'QSB', name: 'ĐH Bách Khoa ĐHQG-HCM' },
                { code: 'QSC', name: 'ĐH CNTT ĐHQG-HCM' },
                { code: 'KSA', name: 'ĐH Kinh Tế TP.HCM' },
                { code: 'VGU', name: 'ĐH Việt Đức' },
                { code: 'GTS', name: 'ĐH Giao Thông Vận Tải' },
                { code: 'SPS', name: 'ĐH Sư Phạm Hà Nội' },
                { code: 'YDS', name: 'ĐH Y Dược TP.HCM' },
                { code: 'CSH', name: 'Học Viện Cảnh Sát Nhân Dân' },
              ].map(s => (
                <button
                  key={s.code}
                  onClick={() => {
                    sfx.play('click');
                    setSelectedUniCode(s.code);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer border ${
                    selectedUniCode === s.code 
                      ? 'bg-blue-600 text-white border-blue-500 font-bold' 
                      : 'bg-[#121217] text-zinc-400 border-[#262630] hover:text-white'
                  }`}
                >
                  {s.code} • {s.name.split(' ').slice(0, 3).join(' ')}
                </button>
              ))}
            </div>

            {/* University & Major Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  1. Cơ sở giáo dục đại học (02_Institution_Registry):
                </label>
                <select
                  value={selectedUniCode}
                  onChange={(e) => {
                    sfx.play('click');
                    setSelectedUniCode(e.target.value);
                  }}
                  className="w-full bg-[#121217] border border-[#262630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {filteredInstitutions.slice(0, 100).map(u => (
                    <option key={u.institution_code} value={u.institution_code}>
                      [{u.institution_code}] {u.official_name} — {u.verified_province_city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  2. Ngành & Phương thức xét tuyển (05_Major_Method_Scoring):
                </label>
                <select
                  value={selectedRecordId}
                  onChange={(e) => {
                    sfx.play('click');
                    setSelectedRecordId(e.target.value);
                  }}
                  className="w-full bg-[#121217] border border-[#262630] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {availableMajorRecords.map(r => (
                    <option key={r.record_id} value={r.record_id}>
                      {r.audited_major_name} ({r.method_id}) — Điểm chuẩn: {r.audited_official_cutoff} / Thang {r.scale_max}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ACTIVE RECORD & FORMULA METADATA BANNER */}
          <div className="bg-[#16161D] border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/40">
                    {activeFormula.formula_id}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    Họ: {activeFormula.formula_family}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Thang điểm gốc: {activeRecord.audited_official_scale} (Max: {activeRecord.scale_max})
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">
                  {activeRecord.audited_major_name} — {currentInstitution.official_name}
                </h4>
                <div className="text-xs text-blue-300 font-mono bg-blue-950/40 border border-blue-800/40 px-3 py-1.5 rounded-lg inline-block">
                  Công thức toán: {activeFormula.formula_math}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={addCurrentToAspirations}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/30"
                >
                  <Plus className="w-4 h-4" />
                  Thêm Vào Nguyện Vọng
                </button>
                <a
                  href={currentInstitution.official_scheme_or_cutoff_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[#121217] border border-[#262630] hover:border-zinc-500 text-zinc-300 rounded-xl text-xs flex items-center gap-1.5"
                  title="Xem Đề án tuyển sinh gốc"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* REAL-TIME CALCULATION AUDIT BREAKDOWN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Step-by-Step Mathematical Computation */}
            <div className="lg:col-span-2 bg-[#16161D] border border-[#262630] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#262630] pb-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-400" />
                  Bảng Giải Trình Từng Bước Tính Điểm (Admissions Scoring Engine)
                </h4>
                <span className="text-xs font-mono text-zinc-400">
                  Năm tuyển sinh: 2026
                </span>
              </div>

              {/* 4 Key Calculation Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#121217] p-3.5 rounded-xl border border-[#262630]">
                  <div className="text-[11px] text-zinc-400">1. Điểm thô (Raw)</div>
                  <div className="text-xl font-mono font-bold text-white mt-1">
                    {calculationResult.rawScore.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">Chưa ưu tiên/thưởng</div>
                </div>

                <div className="bg-[#121217] p-3.5 rounded-xl border border-[#262630]">
                  <div className="text-[11px] text-zinc-400">2. Điểm cộng hiệu lực</div>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                    +{calculationResult.bonusEffective.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {calculationResult.isCcnnBonusLocked 
                      ? 'Khóa (Đã quy đổi CCNN)' 
                      : `Trần: max ${(calculationResult.scaleMax === 30 ? 3 : calculationResult.scaleMax === 100 ? 10 : 4).toFixed(1)}đ`}
                  </div>
                </div>

                <div className="bg-[#121217] p-3.5 rounded-xl border border-[#262630]">
                  <div className="text-[11px] text-zinc-400">3. Điểm ưu tiên hiệu lực</div>
                  <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                    +{calculationResult.effectivePriority.toFixed(3)}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {calculationResult.isPriorityReduced 
                      ? 'Đã giảm tuyến tính từ 75%' 
                      : `Gốc: ${calculationResult.basePriority.toFixed(2)}đ`}
                  </div>
                </div>

                <div className="bg-[#121217] p-3.5 rounded-xl border border-blue-500/40 bg-blue-950/20">
                  <div className="text-[11px] text-blue-300 font-bold">4. ĐIỂM XÉT TUYỂN</div>
                  <div className="text-2xl font-mono font-black text-white mt-1">
                    {calculationResult.officialAdmissionsScore.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-blue-400/80 mt-1 font-mono">
                    / Thang {calculationResult.scaleMax}
                  </div>
                </div>
              </div>

              {/* Mathematical Formula Walkthrough */}
              <div className="bg-[#121217] p-4 rounded-xl border border-[#262630] space-y-3">
                <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Chi tiết cơ chế tính toán & Quy chuẩn pháp lý:
                </div>

                <div className="space-y-2 text-xs text-zinc-400 font-mono">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Hàm công thức áp dụng: <strong className="text-zinc-200">{activeFormula.formula_name}</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Quy tắc trần điểm cộng: <span className="text-zinc-300">bonus_eff = min({calculationResult.scaleMax === 30 ? '3.0' : '10.0'}, bonus_raw) = {calculationResult.bonusEffective}đ</span></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Hàm giảm ưu tiên Thông tư 06: {calculationResult.isPriorityReduced ? (
                      <span className="text-amber-400">S = { (calculationResult.rawScore + calculationResult.bonusEffective).toFixed(2) } &gt;= {(calculationResult.scaleMax * 0.75).toFixed(1)} =&gt; priority_eff = (({calculationResult.scaleMax} - S)/{(calculationResult.scaleMax * 0.25).toFixed(1)}) * {calculationResult.basePriority} = {calculationResult.effectivePriority.toFixed(3)}đ</span>
                    ) : (
                      <span className="text-emerald-400">S &lt; {(calculationResult.scaleMax * 0.75).toFixed(1)} =&gt; Hưởng 100% ưu tiên gốc = {calculationResult.effectivePriority.toFixed(2)}đ</span>
                    )}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span>Chỉ số phân tích chuẩn hóa 100 (Analytical Normalized 100): <strong className="text-blue-400">{calculationResult.analyticalNormalized100.toFixed(2)} / 100</strong> (dùng đối chiếu tương quan giữa các phương thức xét tuyển khác nhau).</span>
                  </div>
                </div>

                {calculationResult.notes.length > 0 && (
                  <div className="pt-2 border-t border-[#262630]/60 space-y-1">
                    {calculationResult.notes.map((note, i) => (
                      <div key={i} className="text-[11px] text-zinc-400 italic">
                        ℹ️ {note}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Prerequisites & Floor Check Card */}
            <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-6 space-y-4">
              <div className="border-b border-[#262630] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Kiểm Tra Điều Kiện Tiên Quyết & Điểm Sàn
                </h4>
                <span className="text-[11px] text-zinc-400">12_Eligibility_TieBreakers & Thông tư 06</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Paralysis check */}
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  calculationResult.eligibilityStatus.passedParalysisCheck
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}>
                  {calculationResult.eligibilityStatus.passedParalysisCheck ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">Kiểm tra điểm liệt (&gt; 1.00đ)</div>
                    <div className="text-[11px] opacity-80">
                      {calculationResult.eligibilityStatus.passedParalysisCheck 
                        ? 'ĐẠT: Không có môn nào trong tổ hợp xét tuyển <= 1.00 điểm.'
                        : 'VI PHẠM: Thí sinh có môn thi <= 1.00 điểm bị loại trực tiếp.'}
                    </div>
                  </div>
                </div>

                {/* General MOET Floor check */}
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  calculationResult.eligibilityStatus.passedGeneralFloorCheck
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}>
                  {calculationResult.eligibilityStatus.passedGeneralFloorCheck ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">Ngưỡng nguồn tuyển chung (&gt;= 15.00/30)</div>
                    <div className="text-[11px] opacity-80">
                      {calculationResult.eligibilityStatus.passedGeneralFloorCheck 
                        ? 'ĐẠT: Tổng 3 môn thi tốt nghiệp THPT đạt từ 15.00 điểm trở lên.'
                        : 'VI PHẠM: Tổng 3 môn dưới 15.00 điểm, không đủ điều kiện xét tuyển đại học.'}
                    </div>
                  </div>
                </div>

                {/* MOET Health / Education floor */}
                <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                  calculationResult.eligibilityStatus.passedMoetSpecialFloor
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                }`}>
                  {calculationResult.eligibilityStatus.passedMoetSpecialFloor ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">Sàn Y Dược & Sư Phạm Bộ GD&ĐT</div>
                    <div className="text-[11px] opacity-80">
                      {calculationResult.eligibilityStatus.moetSpecialFloorValue 
                        ? `Yêu cầu sàn: >= ${calculationResult.eligibilityStatus.moetSpecialFloorValue} điểm. Thí sinh: ${calculationResult.eligibilityStatus.passedMoetSpecialFloor ? 'ĐẠT' : 'CHƯA ĐẠT'}`
                        : 'Ngành này áp dụng ngưỡng đảm bảo chất lượng thông thường của Nhà trường.'}
                    </div>
                  </div>
                </div>

                {/* Score vs Cutoff Safety Card */}
                <div className="bg-[#121217] p-4 rounded-xl border border-[#262630] space-y-2">
                  <div className="text-zinc-400 text-xs flex justify-between">
                    <span>Điểm chuẩn đề án 2026:</span>
                    <strong className="text-white font-mono">{activeRecord.audited_official_cutoff}</strong>
                  </div>
                  <div className="text-zinc-400 text-xs flex justify-between">
                    <span>Điểm xét tuyển của bạn:</span>
                    <strong className="text-blue-400 font-mono">{calculationResult.officialAdmissionsScore.toFixed(2)}</strong>
                  </div>
                  <div className="pt-2 border-t border-[#262630] flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">Chênh lệch:</span>
                    {(() => {
                      const scoreDiff = (calculationResult?.officialAdmissionsScore ?? 0) - (activeRecord?.audited_official_cutoff ?? 0);
                      if (scoreDiff >= 1.0) {
                        return (
                          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
                            +{scoreDiff.toFixed(2)}đ • VÙNG AN TOÀN
                          </span>
                        );
                      } else if (scoreDiff >= -0.5) {
                        return (
                          <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg">
                            {scoreDiff.toFixed(2)}đ • VÙNG CẠNH TRANH
                          </span>
                        );
                      } else {
                        return (
                          <span className="px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg">
                            {scoreDiff.toFixed(2)}đ • VÙNG THÁCH THỨC
                          </span>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* =======================================================================
          MODULE 3: SMART PREFERENCE OPTIMIZER & WARNING SYSTEM
          ======================================================================= */}
      {activeModule === 'optimizer' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Chiến Lược Tối Ưu Hóa Nguyện Vọng (NV1 - NV15)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tự động phân 3 tầng an toàn và kiểm tra pháp lý Thông tư 06/2026/TT-BGDĐT
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">
                  Tổng số nguyện vọng: <strong className="text-white">{aspirationEvaluations.length}</strong>
                </span>
                <button
                  onClick={addCurrentToAspirations}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Thêm ngành đang chọn
                </button>
              </div>
            </div>

            {/* 3 Safety Tiers Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#262630]">
              <div className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-300 font-bold">Vùng An Toàn:</span>
                <span className="text-zinc-400 text-[11px]">&gt;= Điểm chuẩn + 1.0đ</span>
              </div>
              <div className="bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-xl flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-amber-300 font-bold">Vùng Cạnh Tranh:</span>
                <span className="text-zinc-400 text-[11px]">-0.5đ đến +1.0đ</span>
              </div>
              <div className="bg-rose-950/20 border border-rose-500/30 p-2.5 rounded-xl flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-rose-300 font-bold">Vùng Rủi Ro:</span>
                <span className="text-zinc-400 text-[11px]">&lt; Điểm chuẩn - 0.5đ</span>
              </div>
            </div>
          </div>

          {/* Aspirations Ordered List */}
          <div className="space-y-3">
            {aspirationEvaluations.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                className={`bg-[#16161D] border rounded-2xl p-4 sm:p-5 transition-all ${
                  item.safetyTier === 'SAFE'
                    ? 'border-emerald-500/40 bg-emerald-950/10'
                    : item.safetyTier === 'COMPETITIVE'
                    ? 'border-blue-500/40 bg-blue-950/10'
                    : 'border-rose-500/40 bg-rose-950/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Order badge & info */}
                  <div className="flex items-start sm:items-center gap-3.5">
                    <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                      NV{item.order}
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {item.record.audited_major_name}
                        </span>
                        <span className="text-xs font-mono text-zinc-400">
                          [{item.institution.institution_code}] {item.institution.official_name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {item.record.formula_id}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-400 font-mono">
                        <span>Điểm của bạn: <strong className="text-white">{(item.calculatedScore ?? 0).toFixed(2)}</strong></span>
                        <span>•</span>
                        <span>Điểm chuẩn: <strong className="text-zinc-300">{item.cutoff}</strong></span>
                        <span>•</span>
                        <span>Chênh lệch: <strong className={(item.scoreDiff ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{(item.scoreDiff ?? 0) > 0 ? `+${item.scoreDiff}` : (item.scoreDiff ?? 0)}đ</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Tier Badge & Reorder actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {item.safetyTier === 'SAFE' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        AN TOÀN
                      </span>
                    )}
                    {item.safetyTier === 'COMPETITIVE' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        VỪA SỨC
                      </span>
                    )}
                    {item.safetyTier === 'RISKY' && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        THÁCH THỨC
                      </span>
                    )}

                    <div className="flex items-center gap-1 border-l border-[#262630] pl-2">
                      <button
                        onClick={() => moveAspiration(index, 'UP')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-[#121217] border border-[#262630] text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Đẩy lên NV ưu tiên cao hơn"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveAspiration(index, 'DOWN')}
                        disabled={index === aspirationEvaluations.length - 1}
                        className="p-1.5 rounded-lg bg-[#121217] border border-[#262630] text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Hạ xuống NV ưu tiên thấp hơn"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeAspiration(index)}
                        className="p-1.5 rounded-lg bg-[#121217] border border-[#262630] text-rose-400 hover:bg-rose-950/40 cursor-pointer ml-1"
                        title="Xóa nguyện vọng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Real-time Legal Warning Box */}
                {item.warnings.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#262630]/60 space-y-1">
                    {item.warnings.map((w, wIdx) => (
                      <div key={wIdx} className="text-xs text-amber-300 bg-amber-950/30 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* =======================================================================
          MODULE 4: DATA PROVENANCE & AUDIT REGISTRY
          ======================================================================= */}
      {activeModule === 'provenance' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  Sổ Kiểm Toán Dữ Liệu Tuyển Sinh 2026 (Audit Registry)
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tra cứu trực tiếp 9 bảng chuẩn: CSDL 300 trường, 36 họ công thức, 39 bảng quy đổi và văn bản pháp lý
                </p>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex items-center gap-1.5 bg-[#121217] p-1 rounded-xl border border-[#262630] overflow-x-auto">
                {[
                  { id: 'institutions', label: '300 Trường' },
                  { id: 'formulas', label: '36 Công Thức' },
                  { id: 'conversions', label: '39 Quy Đổi' },
                  { id: 'sources', label: 'Văn Bản Pháp Lý' },
                  { id: 'eligibility', label: 'Điểm Sàn & Liệt' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      sfx.play('click');
                      setRegistryTab(t.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      registryTab === t.id
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sub-tab 1: Institutions */}
          {registryTab === 'institutions' && (
            <div className="bg-[#16161D] border border-[#262630] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[#262630] flex items-center justify-between gap-4">
                <span className="text-xs font-mono text-zinc-400">
                  Hiển thị <strong>{AUDITED_INSTITUTIONS_300.length}</strong> trường đại học & học viện đã kiểm toán
                </span>
                <input
                  type="text"
                  placeholder="Lọc theo tên, mã, tỉnh..."
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  className="bg-[#121217] border border-[#262630] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 w-64"
                />
              </div>

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#121217] border-b border-[#262630] text-zinc-400 uppercase font-mono text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Mã Trường</th>
                      <th className="py-3 px-4">Tên Chính Thức</th>
                      <th className="py-3 px-4">Tỉnh / Thành</th>
                      <th className="py-3 px-4">Nhóm Ngành Trọng Điểm</th>
                      <th className="py-3 px-4">Trạng Thái Kiểm Toán</th>
                      <th className="py-3 px-4 text-right">Đề Án Gốc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262630]/60">
                    {AUDITED_INSTITUTIONS_300
                      .filter(i => {
                        if (!registrySearch.trim()) return true;
                        const q = registrySearch.toLowerCase();
                        return i.institution_code.toLowerCase().includes(q) ||
                               i.official_name.toLowerCase().includes(q) ||
                               i.verified_province_city.toLowerCase().includes(q);
                      })
                      .map(u => (
                        <tr key={u.institution_code} className="hover:bg-[#1c1c24] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-blue-400">{u.institution_code}</td>
                          <td className="py-3 px-4 text-white font-medium">{u.official_name}</td>
                          <td className="py-3 px-4 text-zinc-400">{u.verified_province_city}</td>
                          <td className="py-3 px-4 text-zinc-400">{SECTOR_LABELS[u.primary_sector]?.label || u.primary_sector}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              u.verification_status === 'VERIFIED_OFFICIAL'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : u.verification_status === 'MERGED_HISTORICAL'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}>
                              {u.verification_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <a
                              href={u.official_scheme_or_cutoff_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 font-mono inline-flex items-center gap-1"
                            >
                              <span>Xem</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 2: 36 Formulas */}
          {registryTab === 'formulas' && (
            <div className="bg-[#16161D] border border-[#262630] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[#262630]">
                <span className="text-xs font-mono text-zinc-400">
                  Thư viện <strong>{AUDITED_FORMULAS_LIBRARY.length}</strong> họ công thức toán học F01 - F36 (06_Formula_Library)
                </span>
              </div>

              <div className="divide-y divide-[#262630]/60 max-h-[500px] overflow-y-auto">
                {AUDITED_FORMULAS_LIBRARY.map(f => (
                  <div key={f.formula_id} className="p-4 hover:bg-[#1c1c24] transition-colors space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {f.formula_id}
                        </span>
                        <strong className="text-white text-sm">{f.formula_name}</strong>
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        Thang điểm: {f.final_official_scale}
                      </span>
                    </div>

                    <div className="bg-[#121217] p-2.5 rounded-lg border border-[#262630] text-xs font-mono text-emerald-400">
                      f(x) = {f.formula_math}
                    </div>

                    <div className="text-xs text-zinc-400 flex items-start gap-2">
                      <span className="text-zinc-500">Ví dụ chuẩn hóa:</span>
                      <span className="text-zinc-300">{f.worked_example}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 3: 39 Score Conversions */}
          {registryTab === 'conversions' && (
            <div className="bg-[#16161D] border border-[#262630] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[#262630]">
                <span className="text-xs font-mono text-zinc-400">
                  Bảng quy đổi chứng chỉ quốc tế & ĐGNL theo từng trường (09_Score_Conversions)
                </span>
              </div>

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#121217] border-b border-[#262630] text-zinc-400 uppercase font-mono text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Mã Quy Đổi</th>
                      <th className="py-3 px-4">Mã Trường</th>
                      <th className="py-3 px-4">Chứng Chỉ / ĐGNL</th>
                      <th className="py-3 px-4">Ngưỡng Điểm Thô</th>
                      <th className="py-3 px-4">Thang Quy Đổi</th>
                      <th className="py-3 px-4 font-mono">Điểm Quy Đổi</th>
                      <th className="py-3 px-4">Ghi Chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#262630]/60 font-mono">
                    {AUDITED_SCORE_CONVERSIONS.map(c => (
                      <tr key={c.conv_id} className="hover:bg-[#1c1c24] transition-colors">
                        <td className="py-3 px-4 text-blue-400 font-bold">{c.conv_id}</td>
                        <td className="py-3 px-4 text-white">{c.institution_code}</td>
                        <td className="py-3 px-4 text-emerald-400">{c.certificate_or_test}</td>
                        <td className="py-3 px-4 text-zinc-300">{c.raw_score_range}</td>
                        <td className="py-3 px-4 text-zinc-400">Thang {c.target_scale}</td>
                        <td className="py-3 px-4 text-amber-400 font-bold">{c.converted_score}</td>
                        <td className="py-3 px-4 text-zinc-400 text-[11px] font-sans">{c.applicable_scope}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 4: Sources */}
          {registryTab === 'sources' && (
            <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-6 space-y-4">
              <div className="border-b border-[#262630] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Sổ Bộ Nguồn Văn Bản Pháp Lý Tuyển Sinh 2026 (14_Source_Register)
                </h4>
              </div>

              <div className="space-y-3">
                {AUDITED_SOURCE_REGISTRY.map(s => (
                  <div key={s.source_id} className="bg-[#121217] p-4 rounded-xl border border-[#262630] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400">
                          {s.tier}
                        </span>
                        <strong className="text-white text-sm">{s.document_title}</strong>
                      </div>
                      <span className="text-xs text-zinc-400 font-mono">Ban hành: {s.publication_date}</span>
                    </div>

                    <div className="text-xs text-zinc-300">
                      Cơ quan ban hành: <strong>{s.issuing_organization}</strong>
                    </div>

                    <div className="text-xs text-zinc-400 italic">
                      Minh chứng dữ liệu: &quot;{s.exact_evidence_supported}&quot;
                    </div>

                    <div className="pt-2">
                      <a
                        href={s.direct_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                      >
                        <span>{s.direct_url}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-tab 5: Eligibility & Tie-breakers */}
          {registryTab === 'eligibility' && (
            <div className="bg-[#16161D] border border-[#262630] rounded-2xl p-6 space-y-4">
              <div className="border-b border-[#262630] pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  Quy Tắc Điểm Sàn, Điểm Liệt & Tiêu Chí Phụ (12_Eligibility_TieBreakers)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AUDITED_ELIGIBILITY_RULES.map(r => (
                  <div key={r.rule_id} className="bg-[#121217] p-4 rounded-xl border border-[#262630] space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-white text-sm">{r.rule_title}</strong>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {r.scope}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Phạm vi áp dụng: <span className="text-zinc-200">{r.target_programs}</span>
                    </div>
                    <div className="text-xs text-emerald-400 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20">
                      Điều kiện tiên quyết: {r.prerequisite_condition}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Tiêu chí phụ: {r.tie_breaker_rule}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
