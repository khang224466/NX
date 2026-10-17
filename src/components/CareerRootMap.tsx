import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  ArrowRight, 
  RotateCcw, 
  BookOpen, 
  Building2, 
  Briefcase, 
  Layers, 
  Sparkles,
  Info,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { 
  SUBJECT_COMBINATIONS, 
  MAJORS_DATA, 
  INSTITUTIONS_DATA, 
  OCCUPATIONS_DATA,
  SUBJECTS_LIST
} from '../data/mockData';
import { Major, Occupation, Institution, SubjectCombination } from '../types';
import { ScrollParallax } from './ScrollParallax';

interface CareerRootMapProps {
  onSelectMajor: (major: Major) => void;
  onSelectOccupation: (occ: Occupation) => void;
  onOpenAIConsult: (context: string) => void;
}

export const CareerRootMap: React.FC<CareerRootMapProps> = ({
  onSelectMajor,
  onSelectOccupation,
  onOpenAIConsult
}) => {
  // Navigation mode: 'forward' (Người học -> Nghề) or 'reverse' (Nghề -> Ngành & Tổ hợp)
  const [navMode, setNavMode] = useState<'forward' | 'reverse'>('forward');
  
  // Selected items in Forward Mode
  const [selectedSubject, setSelectedSubject] = useState<string>('Toán học');
  const [selectedCombo, setSelectedCombo] = useState<string>('A01');
  const [selectedMajorId, setSelectedMajorId] = useState<string>('major-robotics');
  const [selectedOccId, setSelectedOccId] = useState<string>('occ-robotics-engineer');

  // Selected item in Reverse Mode
  const [targetOccId, setTargetOccId] = useState<string>('occ-robotics-engineer');

  // Inspector modal/drawer state
  const [inspectingNode, setInspectingNode] = useState<{
    type: 'subject' | 'combo' | 'major' | 'institution' | 'occupation';
    data: any;
  } | null>(null);

  // Active major and occupation objects
  const activeMajor = MAJORS_DATA.find(m => m.id === selectedMajorId) || MAJORS_DATA[0];
  const activeOccupation = OCCUPATIONS_DATA.find(o => o.id === (navMode === 'forward' ? selectedOccId : targetOccId)) || OCCUPATIONS_DATA[0];

  // Filtered combinations based on selected subject in Forward mode
  const filteredCombos = SUBJECT_COMBINATIONS.filter(c => c.subjects.includes(selectedSubject));

  // Filtered majors based on selected combination
  const filteredMajors = MAJORS_DATA.filter(m => m.applicableCombinations.includes(selectedCombo));

  // In Reverse mode, find connected majors and combos
  const reverseConnectedMajors = MAJORS_DATA.filter(m => 
    m.directlyRelatedJobs.includes(activeOccupation.title) || 
    m.adjacentJobs.includes(activeOccupation.title)
  );

  return (
    <div className="relative py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header controls & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-tabular text-[#C5A880] uppercase tracking-wider mb-2">
            <Network className="w-4 h-4 text-[#C5A880]" />
            <span>Mô Hình Rễ Cây Đa Chiều · ROOT-LOOP</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#F1F3F7]">
            Bản Đồ Điều Hướng Giáo Dục & Nghề Nghiệp
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#8E9BAE] max-w-2xl">
            Cho phép truy vấn <span className="text-[#C5A880] font-medium">hai chiều</span>: từ điểm mạnh bản thân tỏa ra các cơ hội, hoặc từ vị trí việc làm mơ ước lần ngược về kỹ năng và điều kiện tuyển sinh.
          </p>
        </div>

        {/* Direction Switcher Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-[#0F141C] border border-white/[0.08] shrink-0">
          <button
            onClick={() => setNavMode('forward')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              navMode === 'forward'
                ? 'bg-[#192330] text-[#ECEEF2] shadow-sm border border-white/10'
                : 'text-[#8E9BAE] hover:text-[#ECEEF2]'
            }`}
          >
            <span>Chiều Xuôi: Từ Người Học → Nghề</span>
          </button>
          <button
            onClick={() => setNavMode('reverse')}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              navMode === 'reverse'
                ? 'bg-[#192330] text-[#C5A880] shadow-sm border border-[#C5A880]/30'
                : 'text-[#8E9BAE] hover:text-[#ECEEF2]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Chiều Ngược: Từ Nghề → Ngành & Thi</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Graph Canvas Container */}
      <div className="mt-8 rounded-3xl bg-[#090D13] border border-white/[0.08] p-6 lg:p-8 relative overflow-hidden shadow-2xl">
        {/* Subtle Ambient SVG Tree Root Grid lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="rootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C5A880" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#4E7A68" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path d="M 100 400 Q 300 250, 500 200 T 900 150" fill="none" stroke="url(#rootGrad)" strokeWidth="1.5" strokeDasharray="4 6" />
            <path d="M 100 400 Q 350 450, 600 350 T 1100 300" fill="none" stroke="url(#rootGrad)" strokeWidth="1" strokeDasharray="6 8" />
          </svg>
        </div>

        {/* ------------------- MODE 1: FORWARD (NGƯỜI HỌC -> NGHỀ) ------------------- */}
        {navMode === 'forward' && (
          <div className="space-y-10 relative z-10">
            {/* TẦNG 1 & 2: HẠT GIỐNG & HỆ RỄ (MÔN HỌC & TỔ HỢP) */}
            <ScrollParallax speed={-0.08}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-tabular text-[#f261ac] bg-[#f261ac]/10 px-2 py-0.5 rounded border border-[#f261ac]/20 font-bold">
                    TẦNG 1 & 2 · HỆ RỄ
                  </span>
                  <h3 className="text-sm font-semibold text-[#ECEEF2]">
                    Môn Học Mạnh & Tổ Hợp Xét Tuyển Phù Hợp
                  </h3>
                </div>
                <span className="text-xs text-[#8E9BAE]">Chọn môn học cốt lõi của bạn:</span>
              </div>

              {/* Subject selectors */}
              <div className="flex flex-wrap gap-2 mb-4">
                {SUBJECTS_LIST.map((subj) => (
                  <button
                    key={subj}
                    data-magnetic
                    onClick={() => {
                      setSelectedSubject(subj);
                      const match = SUBJECT_COMBINATIONS.find(c => c.subjects.includes(subj));
                      if (match) setSelectedCombo(match.code);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all hover-jiggle cursor-pointer ${
                      selectedSubject === subj
                        ? 'bg-gradient-to-r from-[#f261ac] to-[#835ad6] text-white font-semibold shadow-md'
                        : 'bg-[#121720] text-[#94A3B8] border border-white/[0.06] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>

              {/* Combination cards connected to selected subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {filteredCombos.map((combo) => (
                  <div
                    key={combo.code}
                    data-magnetic
                    onClick={() => {
                      setSelectedCombo(combo.code);
                      const matchingMajor = MAJORS_DATA.find(m => m.applicableCombinations.includes(combo.code));
                      if (matchingMajor) setSelectedMajorId(matchingMajor.id);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all hover-jiggle ${
                      selectedCombo === combo.code
                        ? 'bg-[#18212D] border-[#f261ac] shadow-lg shadow-[#f261ac]/15'
                        : 'bg-[#0E131A] border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-tabular font-bold text-base text-[#ECEEF2]">
                        {combo.code}
                      </span>
                      <span className="text-[10px] font-tabular text-[#8E9BAE]">
                        Điểm chuẩn: {combo.benchmarkRange}
                      </span>
                    </div>
                    <p className="text-xs text-[#00F0FF] mt-1 font-medium">{combo.name}</p>
                    <p className="text-[11px] text-[#8E9BAE] mt-1 line-clamp-2">{combo.description}</p>
                  </div>
                ))}
              </div>
            </ScrollParallax>

            {/* Connecting visual beam */}
            <div className="flex items-center justify-center my-2 text-xs text-[#8E9BAE] gap-2">
              <span className="h-px w-24 bg-gradient-to-r from-transparent to-white/20" />
              <span className="font-tabular text-[10px] uppercase tracking-widest text-[#00FF88]">
                Rễ nuôi dưỡng thân cây
              </span>
              <span className="h-px w-24 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            {/* TẦNG 3 & 4: THÂN CÂY & NHÁNH HỌC TẬP (NGÀNH & TRƯỜNG ĐÀO TẠO) */}
            <ScrollParallax speed={-0.18}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-tabular text-[#00F0FF] bg-[#00F0FF]/10 px-2 py-0.5 rounded border border-[#00F0FF]/20 font-bold">
                    TẦNG 3 & 4 · NHÁNH HỌC TẬP
                  </span>
                  <h3 className="text-sm font-semibold text-[#ECEEF2]">
                    Ngành Đào Tạo Tiếp Nhận Tổ Hợp {selectedCombo}
                  </h3>
                </div>
                <span className="text-xs text-[#8E9BAE]">Bấm vào ngành để mở chi tiết 8 câu hỏi cốt lõi</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMajors.map((major) => {
                  const isSelected = selectedMajorId === major.id;
                  return (
                    <motion.div
                      key={major.id}
                      onClick={() => {
                        setSelectedMajorId(major.id);
                        const matchedOcc = OCCUPATIONS_DATA.find(o => major.directlyRelatedJobs.includes(o.title));
                        if (matchedOcc) setSelectedOccId(matchedOcc.id);
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all hover-jiggle ${
                        isSelected
                          ? 'bg-[#151D29] border-[#C5A880] shadow-md'
                          : 'bg-[#0E131B] border-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#8E9BAE] mb-1.5">
                        <span className="font-tabular">Mã: {major.code}</span>
                        <span className="text-[#7FAFA0] font-medium">{major.category}</span>
                      </div>
                      <h4 className="font-semibold text-sm text-[#ECEEF2] group-hover:text-[#C5A880]">
                        {major.name}
                      </h4>
                      <p className="text-xs text-[#8E9BAE] mt-2 line-clamp-2">
                        {major.automationImpactAnalysis}
                      </p>
                      <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between text-[11px]">
                        <span className="text-[#C5A880] font-tabular">{major.estimatedTuitionRange}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingNode({ type: 'major', data: major });
                          }}
                          className="text-[#94A3B8] hover:text-white underline decoration-dotted"
                        >
                          Hồ sơ chi tiết
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollParallax>

            {/* Connecting visual beam */}
            <div className="flex items-center justify-center my-2 text-xs text-[#8E9BAE] gap-2">
              <span className="h-px w-24 bg-gradient-to-r from-transparent to-white/20" />
              <span className="font-tabular text-[10px] uppercase tracking-widest text-[#00FF88]">
                Chuyển giao năng lực sang thực tế việc làm
              </span>
              <span className="h-px w-24 bg-gradient-to-l from-transparent to-white/20" />
            </div>

            {/* TẦNG 5: LÁ VÀ QUẢ (NGHỀ NGHIỆP & THỊ TRƯỜNG LAO ĐỘNG) */}
            <ScrollParallax speed={-0.26}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-tabular text-[#f59433] bg-[#f59433]/10 px-2 py-0.5 rounded border border-[#f59433]/20 font-bold">
                    TẦNG 5 · HOA TRÁI NGHỀ NGHIỆP
                  </span>
                  <h3 className="text-sm font-semibold text-[#ECEEF2]">
                    Vị Trí Công Việc Thực Tế Cho Ngành: {activeMajor.name}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {OCCUPATIONS_DATA.filter(o => 
                  activeMajor.directlyRelatedJobs.includes(o.title) || 
                  activeMajor.adjacentJobs.includes(o.title)
                ).map((occ) => {
                  const isSelected = selectedOccId === occ.id;
                  return (
                    <div
                      key={occ.id}
                      onClick={() => setSelectedOccId(occ.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all hover-jiggle ${
                        isSelected
                          ? 'bg-[#18212D] border-[#f261ac] shadow-xl'
                          : 'bg-[#0E131A] border-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-[#ECEEF2]">{occ.title}</span>
                        <span className="text-[11px] font-tabular text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded">
                          Nhu cầu: {occ.laborMarketUrgency}
                        </span>
                      </div>
                      <p className="text-xs text-[#8E9BAE] mb-3">{occ.sector}</p>

                      <div className="space-y-1.5 text-xs text-[#8E9BAE]">
                        <p><strong className="text-[#ECEEF2]">Lương khởi điểm:</strong> <span className="font-tabular text-[#f59433]">{occ.salaryRangeMonthlyMln.entry}</span> / tháng</p>
                        <p><strong className="text-[#ECEEF2]">Lương 3-5 năm:</strong> <span className="font-tabular text-[#f59433]">{occ.salaryRangeMonthlyMln.mid}</span> / tháng</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingNode({ type: 'occupation', data: occ });
                          }}
                          className="text-[#00F0FF] hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>Xem thẻ nghề toàn diện</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAIConsult(`Phân tích kỹ năng và con đường tối ưu để trở thành ${occ.title}`);
                          }}
                          className="text-[11px] text-[#00FF88] hover:text-[#9DD1C1] flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Hỏi AI về nghề này</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollParallax>
          </div>
        )}

        {/* ------------------- MODE 2: REVERSE (TỪ NGHỀ -> NGÀNH & TỔ HỢP) ------------------- */}
        {navMode === 'reverse' && (
          <div className="space-y-8 relative z-10">
            {/* Step 1: Select dream career */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-tabular text-[#C5A880] bg-[#1C1710] px-2 py-0.5 rounded border border-[#C5A880]/20">
                    BƯỚC 1: XÁC ĐỊNH MỤC TIÊU NGHỀ NGHIỆP
                  </span>
                  <h3 className="text-sm font-semibold text-[#ECEEF2] mt-1">
                    Chọn Vị Trí Việc Làm Bạn Đang Hướng Tới
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {OCCUPATIONS_DATA.map((occ) => (
                  <div
                    key={occ.id}
                    onClick={() => setTargetOccId(occ.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      targetOccId === occ.id
                        ? 'bg-[#18212D] border-[#C5A880] shadow-lg shadow-[#C5A880]/15'
                        : 'bg-[#0E131A] border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <h4 className="text-xs font-semibold text-[#ECEEF2]">{occ.title}</h4>
                    <p className="text-[11px] text-[#8E9BAE] mt-1">{occ.sector}</p>
                    <div className="mt-2 text-[11px] font-tabular text-[#C5A880]">
                      {occ.salaryRangeMonthlyMln.entry}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Reverse-engineered Skills & Requirements */}
            <div className="p-6 rounded-2xl bg-[#121822] border border-white/[0.08]">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs text-[#7FAFA0] font-tabular uppercase tracking-wider">
                    BƯỚC 2: KỸ THUẬT ĐẢO NGƯỢC (REVERSE ENGINEERING)
                  </span>
                  <h4 className="text-lg font-serif-luxury text-[#ECEEF2] mt-1">
                    Yêu Cầu Năng Lực & Bằng Cấp Của: <span className="text-[#C5A880] font-sans">{activeOccupation.title}</span>
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#8E9BAE]">Nguồn thẩm định lương:</span>
                  <span className="text-xs text-[#ECEEF2] font-tabular bg-[#0B0F15] px-2.5 py-1 rounded border border-white/10">
                    {activeOccupation.salaryRangeMonthlyMln.source}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div>
                  <h5 className="font-semibold text-[#ECEEF2] mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
                    Kỹ Năng Cốt Lõi Bắt Buộc
                  </h5>
                  <ul className="space-y-1 text-[#8E9BAE]">
                    {activeOccupation.essentialSkills.map((s, i) => (
                      <li key={i}>· {s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-[#ECEEF2] mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7FAFA0]" />
                    Kỹ Năng Đào Tạo Sau Tuyển
                  </h5>
                  <ul className="space-y-1 text-[#8E9BAE]">
                    {activeOccupation.trainableOnJobSkills.map((s, i) => (
                      <li key={i}>· {s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-[#ECEEF2] mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4B384]" />
                    Lộ Trình Không Cần Bằng ĐH?
                  </h5>
                  <p className="text-[#94A3B8] leading-relaxed">
                    {activeOccupation.alternativeEntryPaths[0] || 'Có thể tiếp cận qua hệ Cao đẳng kèm chứng chỉ chuyên ngành.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3: Majors & Combinations to achieve this goal */}
            <div>
              <span className="text-[11px] font-tabular text-[#C5A880] bg-[#1C1710] px-2 py-0.5 rounded border border-[#C5A880]/20">
                BƯỚC 3: NGÀNH HỌC VÀ TỔ HỢP XÉT TUYỂN TƯƠNG ỨNG
              </span>
              <h3 className="text-sm font-semibold text-[#ECEEF2] mt-1 mb-4">
                Các Ngành Đào Tạo Trực Tiếp Cho Vị Trí Này
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reverseConnectedMajors.map((major) => (
                  <div key={major.id} className="p-5 rounded-2xl bg-[#0E131A] border border-white/[0.08]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-[#ECEEF2]">{major.name}</h4>
                      <span className="text-xs font-tabular text-[#7FAFA0]">Mã: {major.code}</span>
                    </div>
                    <p className="text-xs text-[#8E9BAE] mb-3">{major.estimatedTuitionRange}</p>

                    <div className="p-3 rounded-xl bg-[#141A24] border border-white/[0.05] mb-3">
                      <span className="text-[11px] text-[#8E9BAE]">Tổ hợp xét tuyển hợp lệ:</span>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {major.applicableCombinations.map((cCode) => {
                          const combo = SUBJECT_COMBINATIONS.find(c => c.code === cCode);
                          return (
                            <span 
                              key={cCode} 
                              className="text-xs font-tabular px-2.5 py-1 rounded bg-[#1B2533] border border-white/10 text-[#C5A880]"
                              title={combo?.name}
                            >
                              <strong>{cCode}</strong> ({combo?.name})
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2">
                      <span className="text-[#8E9BAE]">Thời gian đào tạo: <strong className="text-[#ECEEF2]">{major.studyDurationYears} năm</strong></span>
                      <button
                        onClick={() => setInspectingNode({ type: 'major', data: major })}
                        className="text-[#C5A880] hover:underline"
                      >
                        Xem phương án dự phòng nếu trượt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------------------- INSPECTOR DRAWER / MODAL ------------------- */}
      <AnimatePresence>
        {inspectingNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0E131C] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setInspectingNode(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#8E9BAE] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {inspectingNode.type === 'major' && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-tabular text-[#C5A880] mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#7FAFA0]" />
                    <span>Hồ Sơ Ngành Học · Giải Đáp 8 Câu Hỏi Cốt Lõi</span>
                  </div>
                  <h3 className="font-serif-luxury text-2xl sm:text-3xl text-[#ECEEF2]">
                    {(inspectingNode.data as Major).name}
                  </h3>
                  <p className="text-xs text-[#8E9BAE] font-tabular mt-1">
                    Mã ngành: {(inspectingNode.data as Major).code} · Khối: {(inspectingNode.data as Major).category}
                  </p>

                  <div className="mt-6 space-y-6 text-xs sm:text-sm">
                    <div className="p-4 rounded-xl bg-[#141A25] border border-white/[0.06]">
                      <h4 className="font-semibold text-[#ECEEF2] mb-2">1. Nhóm kiến thức cốt lõi được đào tạo</h4>
                      <div className="flex flex-wrap gap-2">
                        {(inspectingNode.data as Major).coreDisciplines.map((d, i) => (
                          <span key={i} className="px-2.5 py-1 rounded bg-[#1A2433] text-[#8E9BAE] border border-white/5">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141A25] border border-white/[0.06]">
                      <h4 className="font-semibold text-[#ECEEF2] mb-2">2. Kỹ năng kỳ vọng khi tốt nghiệp</h4>
                      <ul className="space-y-1.5 text-[#8E9BAE]">
                        {(inspectingNode.data as Major).expectedCompetencies.map((c, i) => (
                          <li key={i}>· {c}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141A25] border border-white/[0.06]">
                      <h4 className="font-semibold text-[#ECEEF2] mb-2">3. Đánh giá tác động của AI & Tự động hóa (Không giật gân)</h4>
                      <p className="text-[#8E9BAE] leading-relaxed">
                        {(inspectingNode.data as Major).automationImpactAnalysis}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#14231E] border border-[#7FAFA0]/20">
                      <h4 className="font-semibold text-[#7FAFA0] mb-2">4. Kịch bản chuyển hướng (Nếu sau 1 năm nhận ra không phù hợp)</h4>
                      <ul className="space-y-1 text-[#8E9BAE]">
                        {(inspectingNode.data as Major).transitionPivots.map((p, i) => (
                          <li key={i}>✓ {p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      onClick={() => setInspectingNode(null)}
                      className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#ECEEF2]"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={() => {
                        const major = inspectingNode.data as Major;
                        setInspectingNode(null);
                        onOpenAIConsult(`Tôi muốn tìm hiểu sâu về lộ trình học tập và cơ hội việc làm ngành ${major.name}`);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#C5A880] text-[#07090D] font-medium text-xs hover:bg-[#D4B384]"
                    >
                      Hỏi AI Cố Vấn Về Ngành Này
                    </button>
                  </div>
                </div>
              )}

              {inspectingNode.type === 'occupation' && (
                <div>
                  <div className="flex items-center gap-2 text-xs font-tabular text-[#C5A880] mb-2">
                    <Briefcase className="w-4 h-4 text-[#C5A880]" />
                    <span>Thẻ Nghề Nghiệp Toàn Diện · Vị Trí Thị Trường Lao Động</span>
                  </div>
                  <h3 className="font-serif-luxury text-2xl sm:text-3xl text-[#ECEEF2]">
                    {(inspectingNode.data as Occupation).title}
                  </h3>
                  <p className="text-xs text-[#8E9BAE] mt-1">
                    Lĩnh vực: {(inspectingNode.data as Occupation).sector}
                  </p>

                  <div className="mt-6 space-y-5 text-xs sm:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#141A25]">
                      <div>
                        <span className="text-[#8E9BAE] text-[11px]">Khởi điểm (0-1 năm):</span>
                        <p className="text-sm font-tabular font-bold text-[#DFBA84]">{(inspectingNode.data as Occupation).salaryRangeMonthlyMln.entry}</p>
                      </div>
                      <div>
                        <span className="text-[#8E9BAE] text-[11px]">Trung cấp (2-4 năm):</span>
                        <p className="text-sm font-tabular font-bold text-[#DFBA84]">{(inspectingNode.data as Occupation).salaryRangeMonthlyMln.mid}</p>
                      </div>
                      <div>
                        <span className="text-[#8E9BAE] text-[11px]">Cấp cao (5+ năm):</span>
                        <p className="text-sm font-tabular font-bold text-[#DFBA84]">{(inspectingNode.data as Occupation).salaryRangeMonthlyMln.senior}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-[#ECEEF2] mb-2">Nhiệm vụ thường ngày trong thực tế</h4>
                      <ul className="space-y-1.5 text-[#8E9BAE]">
                        {(inspectingNode.data as Occupation).dailyTasks.map((t, i) => (
                          <li key={i}>• {t}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-xl bg-[#141A25]">
                      <h4 className="font-semibold text-[#ECEEF2] mb-1">Yêu cầu bằng cấp & chứng chỉ</h4>
                      <p className="text-[#8E9BAE]">{(inspectingNode.data as Occupation).credentialRequirements}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#1C1A14] border border-[#C5A880]/20">
                      <h4 className="font-semibold text-[#C5A880] mb-1">Lộ trình tiếp cận không cần Đại học</h4>
                      <ul className="space-y-1 text-[#8E9BAE]">
                        {(inspectingNode.data as Occupation).alternativeEntryPaths.map((p, i) => (
                          <li key={i}>→ {p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <button
                      onClick={() => setInspectingNode(null)}
                      className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-[#ECEEF2]"
                    >
                      Đóng
                    </button>
                    <button
                      onClick={() => {
                        const occ = inspectingNode.data as Occupation;
                        setInspectingNode(null);
                        onOpenAIConsult(`Tôi muốn lên kế hoạch học tập để làm ${occ.title}`);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#C5A880] text-[#07090D] font-medium text-xs hover:bg-[#D4B384]"
                    >
                      Xây Dựng Kế Hoạch Cá Nhân Với AI
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
