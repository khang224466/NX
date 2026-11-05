import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  Search, 
  Building2, 
  AlertCircle, 
  ShieldCheck, 
  CheckCircle, 
  Sliders, 
  MapPin,
  ChevronDown,
  ExternalLink,
  Sparkles,
  BookOpen,
  Scale,
  Award,
  Layers,
  Flame,
  ArrowRight
} from 'lucide-react';
import { 
  VERIFIED_COMBINATIONS_219, 
  VERIFIED_UNIVERSITIES, 
  VERIFIED_PROGRAMS_DATABASE, 
  VerifiedUniversity, 
  VerifiedProgramAdmission,
  evaluateAdmissionSafety 
} from '../data/verifiedAdmissionDatabase';
import { lookupTT74 } from '../data/legalMappingTT74';
import { getInstitutionPolicyByCode } from '../data/institutionPolicyDirectory.js';
import { UniversityScoringInspector } from './UniversityScoringInspector';
import { AuditedAdmissionsSuite } from './AuditedAdmissionsSuite';
import { sfx } from '../services/soundEffects';

type ComboCategoryFilter = 'ALL' | 'KHTN_KY_THUAT' | 'GDPT_MOI' | 'XA_HOI_NGOAI_NGU' | 'NANG_KHIEU_KHAC';

export const CombinationExplorer: React.FC = () => {
  // Main Suite View Toggle
  const [suiteMode, setSuiteMode] = useState<'AUDITED_ENGINE' | 'COMBOS_MATRIX'>('AUDITED_ENGINE');

  // Stage 1: Combination selection & search
  const [selectedComboCode, setSelectedComboCode] = useState<string>('A01');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<ComboCategoryFilter>('ALL');

  // Simulation controls
  const [candidateScore30, setCandidateScore30] = useState<number>(27.5);
  const [candidateScore100, setCandidateScore100] = useState<number>(82.0);
  const [regionFilter, setRegionFilter] = useState<string>('All');

  // Stage 2: Selected university filter (null means show all matching)
  const [selectedUniCode, setSelectedUniCode] = useState<string | null>(null);

  // Stage 4: Scoring Inspector Modal state
  const [inspectorUni, setInspectorUni] = useState<VerifiedUniversity | null>(null);
  const [inspectorProg, setInspectorProg] = useState<VerifiedProgramAdmission | null>(null);

  // Filtered combinations for Stage 1
  const filteredCombos = useMemo(() => {
    return VERIFIED_COMBINATIONS_219.filter(combo => {
      if (activeCategory !== 'ALL' && combo.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = combo.code.toLowerCase().includes(q);
        const matchesName = combo.name.toLowerCase().includes(q);
        const matchesSubjects = combo.subjects.some(s => s.toLowerCase().includes(q));
        if (!matchesCode && !matchesName && !matchesSubjects) return false;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  const activeCombo = useMemo(() => {
    return VERIFIED_COMBINATIONS_219.find(c => c.code === selectedComboCode) || VERIFIED_COMBINATIONS_219[0];
  }, [selectedComboCode]);

  // Stage 2: Programs matching the active combination
  const matchingPrograms = useMemo(() => {
    return VERIFIED_PROGRAMS_DATABASE.filter(prog => {
      const matchesCombo = prog.combinations.includes(selectedComboCode);
      if (!matchesCombo) return false;

      const uni = VERIFIED_UNIVERSITIES.find(u => u.code === prog.universityCode);
      if (!uni) return false;

      if (regionFilter !== 'All' && uni.region !== regionFilter) return false;
      if (selectedUniCode && prog.universityCode !== selectedUniCode) return false;

      return true;
    });
  }, [selectedComboCode, regionFilter, selectedUniCode]);

  // Unique universities offering this combination
  const matchingUniversities = useMemo(() => {
    const allProgsForCombo = VERIFIED_PROGRAMS_DATABASE.filter(p => p.combinations.includes(selectedComboCode));
    const uniCodes = Array.from(new Set(allProgsForCombo.map(p => p.universityCode)));
    return VERIFIED_UNIVERSITIES.filter(u => {
      if (!uniCodes.includes(u.code)) return false;
      if (regionFilter !== 'All' && u.region !== regionFilter) return false;
      return true;
    });
  }, [selectedComboCode, regionFilter]);

  const handleOpenInspector = (uni: VerifiedUniversity, prog?: VerifiedProgramAdmission) => {
    sfx.play('click');
    setInspectorUni(uni);
    setInspectorProg(prog || null);
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Architecture Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-[#121217] border border-[#262630] rounded-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfx.play('click');
              setSuiteMode('AUDITED_ENGINE');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              suiteMode === 'AUDITED_ENGINE'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-[#1c1c24]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Kiến Trúc Tính Điểm & Kiểm Toán 2026 (4 Phân Hệ)</span>
          </button>

          <button
            onClick={() => {
              sfx.play('click');
              setSuiteMode('COMBOS_MATRIX');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              suiteMode === 'COMBOS_MATRIX'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-[#1c1c24]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Ma Trận 219 Tổ Hợp Xét Tuyển</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-zinc-400 hidden sm:block pr-3">
          Thông tư 06/2026/TT-BGDĐT • 36 Họ Công Thức Chuẩn
        </div>
      </div>

      {suiteMode === 'AUDITED_ENGINE' ? (
        <AuditedAdmissionsSuite />
      ) : (
        <div className="space-y-10">
          {/* Header with Official Circulars */}
          <div className="pb-6 border-b border-white/[0.08]">
            <div className="flex flex-wrap items-center gap-2 text-xs font-tabular text-[#C5A880] uppercase tracking-wider mb-2">
              <Calculator className="w-4 h-4 text-[#C5A880]" />
              <span>Hệ Thống Tuyển Sinh Đa Chiều 4 Tầng • Omni-Relational Admission Pipeline</span>
            </div>
            <h1 className="font-serif-luxury text-3xl sm:text-4xl text-[#ECEEF2]">
              Tra Cứu Tổ Hợp & Điểm Chuẩn Thông Minh (2024 – 2026)
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-[#8E9BAE] max-w-4xl leading-relaxed">
              Tuân thủ <strong className="text-[#ECEEF2]">Thông tư 06/2026/TT-BGDĐT</strong> (Quy chế tuyển sinh ĐH 2026, ban hành 15/02/2026) & <strong className="text-[#ECEEF2]">Thông tư 74/2026/TT-BGDĐT</strong> (Danh mục ngành mới 6 chữ số). Xóa bỏ điểm chuẩn giả lập; tích hợp 100% dữ liệu thực từ ĐHQG, ĐHBK, ĐHYD, ĐHCT...
            </p>

            {/* Official Banner */}
            <div className="mt-4 p-4 rounded-xl bg-[#0F1B17] border border-[#48E596]/30 flex items-start gap-3 text-xs text-[#98C2B3]">
              <ShieldCheck className="w-5 h-5 text-[#48E596] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-[#48E596]">Căn cứ quy chế chính thức:</span> Mỗi điểm chuẩn được phân loại theo đúng thang điểm trường (<span className="text-white font-semibold">Thang 30</span> chuẩn, <span className="text-white font-semibold">Thang 40</span> nhân hệ số môn chính của HUST, <span className="text-white font-semibold">Thang 100</span> kết hợp toàn diện của HCMUT). Tự động kích hoạt thuật toán giảm trừ điểm ưu tiên khi đạt từ 22.50 điểm (Thang 30) hoặc 75.0 điểm (Thang 100).
              </div>
            </div>
          </div>

      {/* ========================================================================= */}
      {/* TẦNG 1: CHỌN TỔ HỢP (SUBJECT COMBINATION SELECTOR - 219 TỔ HỢP) */}
      {/* ========================================================================= */}
      <section className="p-6 rounded-2xl bg-[#0A0E15] border border-white/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#C5A880] uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[10px]">1</span>
              <span>Tầng 1 • Tổ Hợp Xét Tuyển (219 Mã Quốc Gia)</span>
            </div>
            <p className="text-xs text-[#8E9BAE] mt-1">
              Hỗ trợ cả tổ hợp truyền thống và tổ hợp GDPT 2018 mới (Tin học, Công nghệ, GDKT&PL).
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tổ hợp (A00, Tin học, Lý...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141A24] border border-white/10 text-xs text-white placeholder-[#8E9BAE] outline-none focus:border-[#C5A880]"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.05]">
          {[
            { id: 'ALL', label: 'Tất cả tổ hợp' },
            { id: 'KHTN_KY_THUAT', label: 'KHTN & Kỹ thuật (A00, A01, B00, D07...)' },
            { id: 'GDPT_MOI', label: 'GDPT Mới (Tin & Công nghệ - X06, X26...)' },
            { id: 'XA_HOI_NGOAI_NGU', label: 'KHXH, Kinh tế & Ngôn ngữ (D01, C00...)' },
            { id: 'NANG_KHIEU_KHAC', label: 'Năng khiếu & Nghệ thuật' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                sfx.play('click');
                setActiveCategory(cat.id as ComboCategoryFilter);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-[#C5A880] text-[#07090D] font-bold shadow-md'
                  : 'bg-[#141A24] text-[#8E9BAE] hover:text-white border border-white/[0.04]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Quick combination buttons grid */}
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
          {filteredCombos.map((c) => {
            const isSelected = selectedComboCode === c.code;
            return (
              <button
                key={c.code}
                onClick={() => {
                  sfx.play('click');
                  setSelectedComboCode(c.code);
                  setSelectedUniCode(null); // Reset university drilldown
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-tabular transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#C5A880] text-[#07090D] font-bold ring-2 ring-[#C5A880]/50'
                    : 'bg-[#121722] text-[#ECEEF2] hover:bg-[#1A2130] border border-white/[0.06]'
                }`}
              >
                <span>{c.code}</span>
                {c.popularRank && c.popularRank <= 5 && (
                  <Flame className={`w-3 h-3 ${isSelected ? 'text-[#07090D]' : 'text-[#f59433]'}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Active combo details callout */}
        <div className="p-4 rounded-xl bg-[#141A24] border border-[#C5A880]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#C5A880] font-tabular">{activeCombo.code}</span>
              <span className="text-[#ECEEF2] font-semibold">{activeCombo.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#8E9BAE]">
                {activeCombo.categoryLabel}
              </span>
            </div>
            <p className="text-[#8E9BAE] text-[11px] mt-1 leading-relaxed">
              {activeCombo.description}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-[#48E596] font-tabular font-bold">
              {matchingPrograms.length} chương trình tuyển sinh
            </span>
          </div>
        </div>
      </section>

      {/* Simulator Filters Bar */}
      <section className="p-5 rounded-2xl bg-[#0E131A] border border-white/[0.06] grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Score simulation (Scale 30) */}
        <div className="md:col-span-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-[#ECEEF2]">Mức điểm THPT dự kiến (Thang 30):</span>
            <span className="font-tabular font-bold text-base text-[#C5A880]">{candidateScore30.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="18"
            max="30"
            step="0.25"
            value={candidateScore30}
            onChange={(e) => setCandidateScore30(Number(e.target.value))}
            className="w-full accent-[#C5A880] cursor-pointer"
          />
        </div>

        {/* Score simulation (Scale 100 for HCMUT) */}
        <div className="md:col-span-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-[#ECEEF2]">Điểm ĐGNL ĐHQG (Thang 100):</span>
            <span className="font-tabular font-bold text-base text-[#48E596]">{candidateScore100.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="60"
            max="100"
            step="0.5"
            value={candidateScore100}
            onChange={(e) => setCandidateScore100(Number(e.target.value))}
            className="w-full accent-[#48E596] cursor-pointer"
          />
        </div>

        {/* Region filter */}
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-[#ECEEF2] mb-1.5">
            Khu vực đào tạo:
          </label>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#141A24] border border-white/10 text-xs text-[#ECEEF2] outline-none focus:border-[#C5A880]"
          >
            <option value="All">Toàn quốc (Bắc, Trung, Nam, ĐBSCL)</option>
            <option value="Bắc">Miền Bắc (Hà Nội...)</option>
            <option value="Nam">Miền Nam (TP.HCM...)</option>
            <option value="ĐBSCL">Đồng bằng Sông Cửu Long (Cần Thơ...)</option>
          </select>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TẦNG 2: CÁC TRƯỜNG ĐANG TUYỂN SINH TỔ HỢP NÀY (UNIVERSITY CARDS) */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#C5A880] uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[10px]">2</span>
            <span>Tầng 2 • Các Trường Đại Học Tuyển Sinh Tổ Hợp {selectedComboCode}</span>
          </div>
          {selectedUniCode && (
            <button
              onClick={() => setSelectedUniCode(null)}
              className="text-xs text-[#C5A880] hover:underline cursor-pointer"
            >
              Hiển thị tất cả ({matchingUniversities.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchingUniversities.map((uni) => {
            const isSelected = selectedUniCode === uni.code;
            const progsForUni = matchingPrograms.filter(p => p.universityCode === uni.code);
            const schoolPolicy = getInstitutionPolicyByCode(uni.code);
            const hasSchoolPolicy = schoolPolicy?.verificationStatus === 'OFFICIAL_PARTIAL';
            const admissionMethodSummary = schoolPolicy?.admissionMethods.map(method => method.name).join('; ');
            const scholarshipSummary = schoolPolicy?.scholarships
              .map(scholarship => `${scholarship.name}: ${scholarship.description}`)
              .join(' ');
            const tuitionSummary = schoolPolicy?.tuition?.length
              ? (() => {
                  const annualRates = schoolPolicy.tuition.map(tuition => tuition.annualVnd).filter((value): value is number => Number.isFinite(value));
                  if (schoolPolicy.tuition.length > 8 && annualRates.length) {
                    const minimum = Math.min(...annualRates) / 1_000_000;
                    const maximum = Math.max(...annualRates) / 1_000_000;
                    return `Bảng học phí chính thức có ${schoolPolicy.tuition.length} mã ngành cho ${schoolPolicy.tuition[0].academicYear}, khoảng ${minimum.toLocaleString('vi-VN')}–${maximum.toLocaleString('vi-VN')} triệu đồng/năm; tra đúng ngành tại nguồn.`;
                  }
                  return schoolPolicy.tuition
                    .slice(0, 5)
                    .map(tuition => `${tuition.programName} (${tuition.academicYear}): ${tuition.note}`)
                    .join(' ');
                })()
              : '';

            return (
              <div
                key={uni.id}
                className={`p-5 rounded-2xl bg-[#0B0F16] border transition-all flex flex-col justify-between ${
                  isSelected 
                    ? 'border-[#C5A880] ring-1 ring-[#C5A880]/40 shadow-xl' 
                    : 'border-white/[0.07] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-tabular font-bold px-2 py-0.5 rounded bg-white/5 text-[#8E9BAE]">
                      {uni.code} • {uni.city}
                    </span>
                    <span className={`text-[10px] font-tabular font-bold px-2 py-0.5 rounded border ${
                      hasSchoolPolicy
                        ? 'bg-[#48E596]/10 text-[#48E596] border-[#48E596]/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-300/30'
                    }`}>
                      {hasSchoolPolicy ? 'CHÍNH SÁCH CÓ NGUỒN 2026' : 'CHÍNH SÁCH CHƯA XÁC MINH'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#ECEEF2] mb-1">
                    {uni.shortName}
                  </h3>
                  <p className="text-xs text-[#8E9BAE]">{uni.name}</p>

                  <div className="mt-3 p-3 rounded-xl bg-[#121722] border border-white/[0.04] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#8E9BAE]">Thang điểm:</span>
                      <span className="font-tabular font-bold text-white">{uni.primaryScale}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8E9BAE]">{uni.tuitionDisplayLabel || 'Học phí chuẩn'}:</span>
                      <span className="font-tabular text-[#C5A880] font-semibold">{uni.tuitionStandardMlnYear} tr/năm</span>
                    </div>
                    {uni.tuitionHighQualityMlnYear && (
                      <div className="flex justify-between">
                        <span className="text-[#8E9BAE]">Học phí CLC/ELITECH:</span>
                        <span className="font-tabular text-[#C5A880] font-semibold">{uni.tuitionHighQualityMlnYear} tr/năm</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-white/[0.04] text-[11px] text-[#A1A1AA] leading-snug space-y-1.5">
                      <p>
                        <span className="text-[#48E596] font-medium">Tuyển sinh 2026:</span>{' '}
                        {admissionMethodSummary || 'Chưa có phương thức tuyển sinh riêng được xác minh trong kho.'}
                      </p>
                      <p>
                        <span className="text-[#48E596] font-medium">Học bổng:</span>{' '}
                        {scholarshipSummary || 'Chưa có chính sách học bổng riêng được xác minh trong kho.'}
                      </p>
                      {tuitionSummary && (
                        <p>
                          <span className="text-[#48E596] font-medium">Học phí có nguồn:</span>{' '}
                          {tuitionSummary}
                        </p>
                      )}
                      {schoolPolicy?.tuition[0]?.sourceUrl && (
                        <a
                          href={schoolPolicy.tuition[0].sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#8FB9FF] hover:underline mr-3"
                        >
                          Nguồn học phí <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {schoolPolicy?.admissionMethods[0]?.sourceUrl && (
                        <a
                          href={schoolPolicy.admissionMethods[0].sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#8FB9FF] hover:underline mr-3"
                        >
                          Nguồn tuyển sinh <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {schoolPolicy?.scholarships[0]?.sourceUrl && (
                        <a
                          href={schoolPolicy.scholarships[0].sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#8FB9FF] hover:underline"
                        >
                          Nguồn học bổng <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                  <button
                    onClick={() => {
                      sfx.play('click');
                      setSelectedUniCode(isSelected ? null : uni.code);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[#C5A880] text-[#07090D]'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                    }`}
                  >
                    {isSelected ? 'Đang lọc ngành trường này' : `Xem ${progsForUni.length} ngành tuyển sinh`}
                  </button>
                  <button
                    onClick={() => handleOpenInspector(uni)}
                    title="Mở Trình Soi Công Thức & Điểm"
                    className="p-2 rounded-xl bg-[#141A24] hover:bg-[#1E2638] text-[#C5A880] border border-[#C5A880]/30 transition-all cursor-pointer"
                  >
                    <Calculator className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* TẦNG 3: DANH SÁCH NGÀNH & ĐIỂM CHUẨN THẬT 3 NĂM (VERIFIED PROGRAM MATRIX) */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#C5A880] uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[10px]">3</span>
            <span>Tầng 3 • Danh Sách Ngành & Điểm Chuẩn Thật 3 Năm (2024 – 2025 – 2026 Dự kiến)</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-tabular">
            <span className="flex items-center gap-1 text-[#48E596]">
              <span className="w-2 h-2 rounded-full bg-[#48E596]" /> An toàn
            </span>
            <span className="flex items-center gap-1 text-[#E0B272]">
              <span className="w-2 h-2 rounded-full bg-[#E0B272]" /> Cạnh tranh
            </span>
            <span className="flex items-center gap-1 text-[#FF4D4D]">
              <span className="w-2 h-2 rounded-full bg-[#FF4D4D]" /> Dự phòng
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchingPrograms.map((prog) => {
            const uni = VERIFIED_UNIVERSITIES.find(u => u.code === prog.universityCode)!;
            const userScore = prog.scale === 'Thang 100' ? candidateScore100 : candidateScore30;
            const safety = evaluateAdmissionSafety(userScore, prog.benchmark2025, prog.scale);
            const legalMap = lookupTT74(prog.majorCodeTT09);

            return (
              <motion.div
                key={prog.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-[#0B0F16] border border-white/[0.07] hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-tabular font-bold text-[#C5A880]">
                      {uni.shortName}
                    </span>
                    <span className={`text-[10px] font-tabular px-2 py-0.5 rounded border font-semibold ${safety.colorClass}`}>
                      {safety.label}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#ECEEF2] mb-0.5">
                    {prog.majorName}
                  </h4>
                  {prog.subMajorName && (
                    <p className="text-xs text-[#8E9BAE] italic mb-1">{prog.subMajorName}</p>
                  )}

                  {/* TT 74 Legal Code Badge */}
                  <div className="flex items-center gap-2 text-[10px] font-tabular text-[#8E9BAE] mb-3">
                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                      Mã TT 74: <strong className="text-white">{prog.majorCodeTT74}</strong>
                    </span>
                    <span>•</span>
                    <span>Mã cũ: {prog.majorCodeTT09}</span>
                  </div>

                  {/* Benchmark & Quota Matrix */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#121722] border border-white/[0.04] text-xs font-tabular mb-3">
                    <div>
                      <span className="text-[10px] text-[#8E9BAE] block">Chuẩn 2024</span>
                      <span className="font-bold text-[#ECEEF2]">{prog.benchmark2024}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E9BAE] block">Chuẩn 2025</span>
                      <span className="font-bold text-[#C5A880]">{prog.benchmark2025}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#8E9BAE] block">Dự kiến 2026</span>
                      <span className="font-bold text-[#48E596]">{prog.benchmark2026Est}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-[#8E9BAE]">
                      <span>Học phí/năm:</span>
                      <span className="text-[#C5A880] font-tabular font-semibold">
                        {prog.tuitionMlnYear === 0 ? 'MIỄN 100% (NĐ 116)' : `${prog.tuitionMlnYear} triệu`}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#8E9BAE]">
                      <span>Chỉ tiêu xét:</span>
                      <span className="text-white font-tabular">{prog.quota} sinh viên</span>
                    </div>
                    <div className="flex justify-between text-[#8E9BAE]">
                      <span>Thang điểm:</span>
                      <span className="text-white font-tabular">{prog.scale}</span>
                    </div>
                    {prog.primarySubject && (
                      <div className="text-[11px] text-[#E0B272] pt-1">
                        Môn chính: {prog.primarySubject}
                      </div>
                    )}
                    <div className="text-[10px] text-[#8E9BAE] pt-1 leading-snug">
                      Tiêu chí phụ: {prog.tieBreakerRule}
                    </div>
                  </div>
                </div>

                {/* Stage 4 trigger button */}
                <div className="mt-4 pt-3 border-t border-white/[0.06]">
                  <button
                    onClick={() => handleOpenInspector(uni, prog)}
                    className="w-full py-2 px-3 rounded-xl bg-[#C5A880]/10 hover:bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Soi Công Thức & Tính Điểm Thật</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  )}

      {/* ========================================================================= */}
      {/* TẦNG 4: BỘ SOI CÔNG THỨC & ĐIỂM (MODAL POPUP) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {inspectorUni && (
          <UniversityScoringInspector
            isOpen={true}
            onClose={() => {
              setInspectorUni(null);
              setInspectorProg(null);
            }}
            initialUniversity={inspectorUni}
            initialProgram={inspectorProg || undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
