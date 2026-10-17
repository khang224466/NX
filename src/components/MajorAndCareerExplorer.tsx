import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Briefcase, 
  GitCompare, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  X,
  ArrowLeftRight,
  DollarSign,
  Award,
  Zap,
  Building2,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  Clock,
  Milestone
} from 'lucide-react';
import { MAJORS_DATA, OCCUPATIONS_DATA, INSTITUTIONS_DATA } from '../data/mockData';
import { Major, Occupation } from '../types';
import { sfx } from '../services/soundEffects';
import { TimelineGenerator } from './TimelineGenerator';

interface MajorAndCareerExplorerProps {
  onOpenAIConsult: (query: string) => void;
}

export const MajorAndCareerExplorer: React.FC<MajorAndCareerExplorerProps> = ({ onOpenAIConsult }) => {
  const [activeTab, setActiveTab] = useState<'majors' | 'occupations' | 'compare' | 'timeline'>('majors');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedMajorForDetail, setSelectedMajorForDetail] = useState<Major | null>(null);
  const [selectedOccForDetail, setSelectedOccForDetail] = useState<Occupation | null>(null);

  // Compare mode state: 2 majors to compare
  const [compareMajorAId, setCompareMajorAId] = useState<string>('major-semiconductor');
  const [compareMajorBId, setCompareMajorBId] = useState<string>('major-robotics');

  const categories = ['All', 'Kỹ thuật & Công nghệ', 'Kinh tế & Quản lý', 'Khoa học tự nhiên & Sức khỏe'];

  const filteredMajors = MAJORS_DATA.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' ? true : m.category.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const filteredOccupations = OCCUPATIONS_DATA.filter(o => 
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.sector.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const majorA = MAJORS_DATA.find(m => m.id === compareMajorAId) || MAJORS_DATA[0];
  const majorB = MAJORS_DATA.find(m => m.id === compareMajorBId) || MAJORS_DATA[1];

  // Helper: Extract quantitative salary, urgency and partner metrics for any major
  const getMajorAnalytics = (major: Major) => {
    const matchedOccs = OCCUPATIONS_DATA.filter(occ => 
      major.directlyRelatedJobs.includes(occ.title) ||
      major.adjacentJobs.includes(occ.title)
    );
    const primaryOcc = matchedOccs[0] || OCCUPATIONS_DATA[0];

    let entryNum = 16;
    let midNum = 30;
    let seniorNum = 60;

    if (major.id === 'major-semiconductor') {
      entryNum = 22; midNum = 45; seniorNum = 80;
    } else if (major.id === 'major-robotics') {
      entryNum = 19; midNum = 38; seniorNum = 65;
    } else if (major.id === 'major-data-ai') {
      entryNum = 20; midNum = 42; seniorNum = 75;
    } else if (major.id === 'major-logistics') {
      entryNum = 15; midNum = 32; seniorNum = 55;
    } else if (major.id === 'major-biotech') {
      entryNum = 14; midNum = 28; seniorNum = 50;
    } else if (major.id === 'major-green-energy') {
      entryNum = 16; midNum = 32; seniorNum = 58;
    }

    const partnerInstitutions = INSTITUTIONS_DATA.filter(inst => 
      inst.programs.some(p => p.majorId === major.id)
    );

    const keyPartners = Array.from(new Set(partnerInstitutions.flatMap(i => i.industryPartnerships))).slice(0, 4);

    return {
      primaryOccupation: primaryOcc,
      matchedOccupations: matchedOccs,
      salaryMetrics: { entryNum, midNum, seniorNum },
      entrySalaryText: primaryOcc?.salaryRangeMonthlyMln?.entry || `${entryNum - 3} - ${entryNum + 3} triệu`,
      midSalaryText: primaryOcc?.salaryRangeMonthlyMln?.mid || `${midNum - 5} - ${midNum + 8} triệu`,
      seniorSalaryText: primaryOcc?.salaryRangeMonthlyMln?.senior || `${seniorNum - 10} - ${seniorNum + 20}+ triệu`,
      urgency: primaryOcc?.laborMarketUrgency || 'Rất cao',
      partnerInstitutions,
      keyPartners: keyPartners.length > 0 ? keyPartners : ['Samsung', 'Viettel', 'FPT', 'Intel'],
    };
  };

  const analyticsA = getMajorAnalytics(majorA);
  const analyticsB = getMajorAnalytics(majorB);

  // Quick preset pairs
  const quickPresets = [
    {
      label: 'Vi mạch Bán dẫn vs Robot & AI',
      idA: 'major-semiconductor',
      idB: 'major-robotics',
      tag: 'KỸ THUẬT TOP 1'
    },
    {
      label: 'Khoa học dữ liệu vs Logistics Chuỗi Cung ứng',
      idA: 'major-data-ai',
      idB: 'major-logistics',
      tag: 'KINH TẾ SỐ'
    },
    {
      label: 'Kỹ thuật Y sinh vs Năng lượng Tái tạo',
      idA: 'major-biotech',
      idB: 'major-green-energy',
      tag: 'CÔNG NGHỆ XANH'
    },
  ];

  const handleSwapMajors = () => {
    sfx.playUiSelect();
    const temp = compareMajorAId;
    setCompareMajorAId(compareMajorBId);
    setCompareMajorBId(temp);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs font-tabular text-[#C5A880] uppercase tracking-wider mb-2">
            <BookOpen className="w-4 h-4 text-[#C5A880]" />
            <span>Modules 3, 4 & 5 • Từ Ngành Đến Nghề Nghiệp Thực Tế</span>
          </div>
          <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#ECEEF2]">
            Khám Phá Ngành Học & Bảng So Sánh Nhanh
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#8E9BAE] max-w-2xl leading-relaxed">
            Ngành học không đồng nghĩa với một nghề duy nhất. Một ngành mở ra nhiều cánh cửa, và một nghề có nhiều con đường đi vào.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-[#0F141C] border border-white/[0.08] shrink-0">
          <button
            data-magnetic
            onClick={() => {
              sfx.playUiSelect();
              setActiveTab('majors');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all hover-jiggle cursor-pointer ${
              activeTab === 'majors' ? 'bg-[#18212D] text-[#ECEEF2] border border-white/10 shadow-sm' : 'text-[#8E9BAE] hover:text-white'
            }`}
          >
            Ngành Học
          </button>
          <button
            data-magnetic
            onClick={() => {
              sfx.playUiSelect();
              setActiveTab('occupations');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all hover-jiggle cursor-pointer ${
              activeTab === 'occupations' ? 'bg-[#18212D] text-[#ECEEF2] border border-white/10 shadow-sm' : 'text-[#8E9BAE] hover:text-white'
            }`}
          >
            Vị Trí Nghề Nghiệp
          </button>
          <button
            data-magnetic
            onClick={() => {
              sfx.playUiSelect();
              setActiveTab('compare');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover-jiggle cursor-pointer ${
              activeTab === 'compare' 
                ? 'bg-gradient-to-r from-[#00F0FF]/20 to-[#FF007A]/20 text-white border border-[#00F0FF]/40 shadow-sm font-bold' 
                : 'text-[#00F0FF] hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span>Bảng So Sánh Nhanh</span>
          </button>
          <button
            data-magnetic
            onClick={() => {
              sfx.playUiSelect();
              setActiveTab('timeline');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 hover-jiggle cursor-pointer ${
              activeTab === 'timeline' 
                ? 'bg-gradient-to-r from-[#C5A880]/30 to-[#48E596]/30 text-white border border-[#48E596]/40 shadow-sm font-bold' 
                : 'text-[#48E596] hover:text-white'
            }`}
          >
            <Milestone className="w-3.5 h-3.5 text-[#48E596]" />
            <span>Lộ Trình Cột Mốc (Timeline)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar when in standard list modes */}
      {(activeTab === 'majors' || activeTab === 'occupations') && (
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-[#8E9BAE] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'majors' ? 'Tìm theo tên ngành hoặc khối...' : 'Tìm theo chức danh hoặc lĩnh vực...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0E131A] border border-white/10 text-xs text-[#ECEEF2] placeholder-[#64748B] outline-none focus:border-[#C5A880]"
            />
          </div>

          {/* Interactive Category Filter Pills */}
          {activeTab === 'majors' && (
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  data-magnetic
                  onClick={() => {
                    sfx.playUiSelect();
                    setCategoryFilter(cat);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-syne font-semibold transition-all hover-jiggle cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#C5A880] text-[#0A0E17] font-bold shadow-md'
                      : 'bg-[#141A24] text-[#A1A1AA] hover:text-white border border-white/5'
                  }`}
                >
                  {cat === 'All' ? 'Tất Cả Ngành' : cat}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Compare Callout Banner in Majors Tab */}
      {activeTab === 'majors' && (
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-[#00F0FF]/10 via-[#0E131A] to-[#FF007A]/10 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00F0FF]/20 border border-[#00F0FF]/40 flex items-center justify-center shrink-0">
              <GitCompare className="w-4 h-4 text-[#00F0FF]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-syne font-bold text-white flex items-center gap-2">
                <span>Bảng So Sánh Nhanh (Quick Comparison Matrix)</span>
                <span className="text-[10px] font-tabular text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.2 rounded-full border border-[#00FF88]/20">
                  MỚI
                </span>
              </h4>
              <p className="text-[11px] text-[#8E9BAE]">
                Đối chiếu 2 ngành bất kỳ về lương khởi điểm, nhu cầu thị trường và cơ hội chuyển đổi
              </p>
            </div>
          </div>
          <button
            data-magnetic
            onClick={() => {
              sfx.playUiSelect();
              setActiveTab('compare');
            }}
            className="px-4 py-2 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/30 text-[#00F0FF] text-xs font-syne font-bold flex items-center gap-2 transition-all hover-jiggle cursor-pointer shrink-0"
          >
            <span>Mở Bảng So Sánh</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ------------------- MAJORS VIEW ------------------- */}
      {activeTab === 'majors' && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMajors.map((major) => (
            <div
              key={major.id}
              onClick={() => {
                sfx.playUiSelect();
                setSelectedMajorForDetail(major);
              }}
              className="p-6 rounded-2xl bg-[#0E131A] border border-white/[0.07] hover:border-[#C5A880]/50 transition-all flex flex-col justify-between hover-jiggle cursor-pointer hover:shadow-xl group"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-[#8E9BAE] mb-2">
                  <span className="font-tabular">Mã: {major.code}</span>
                  <span className="text-[#7FAFA0] font-medium">{major.category}</span>
                </div>

                <h3 className="font-semibold text-base text-[#ECEEF2] group-hover:text-[#C5A880] transition-colors mb-2">
                  {major.name}
                </h3>

                <p className="text-xs text-[#8E9BAE] leading-relaxed line-clamp-3 mb-4">
                  {major.automationImpactAnalysis}
                </p>

                <div className="space-y-2 text-xs text-[#8E9BAE] bg-[#141A24] p-3 rounded-xl border border-white/[0.04]">
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Tổ hợp xét:</span>
                    <span className="font-tabular font-medium text-[#C5A880]">
                      {major.applicableCombinations.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[10px]">Học phí tham khảo:</span>
                    <span className="font-tabular text-[#ECEEF2]">
                      {major.estimatedTuitionRange}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.04] flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.playUiSelect();
                    setCompareMajorAId(major.id);
                    setActiveTab('compare');
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="text-[11px] text-[#00F0FF] hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#00F0FF]/10 hover:bg-[#00F0FF]/20 border border-[#00F0FF]/25 transition-all hover-jiggle cursor-pointer"
                  title="Đưa vào so sánh nhanh"
                >
                  <GitCompare className="w-3 h-3" />
                  <span>So sánh</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.playUiSelect();
                    onOpenAIConsult(`Phân tích cơ hội việc làm và rủi ro chuyển ngành của ${major.name}`);
                  }}
                  className="text-[11px] text-[#7FAFA0] hover:text-[#9ED3C4] flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#7FAFA0]/10 hover:bg-[#7FAFA0]/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Hỏi AI</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------- OCCUPATIONS VIEW ------------------- */}
      {activeTab === 'occupations' && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOccupations.map((occ) => (
            <div
              key={occ.id}
              className="p-6 rounded-2xl bg-[#0E131A] border border-white/[0.07] hover:border-white/20 transition-all flex flex-col justify-between hover-jiggle"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-base text-[#ECEEF2]">{occ.title}</h3>
                  <span className="text-[11px] font-tabular text-[#7FAFA0] bg-[#14231E] px-2 py-0.5 rounded border border-[#7FAFA0]/20">
                    Nhu cầu: {occ.laborMarketUrgency}
                  </span>
                </div>
                <p className="text-xs text-[#8E9BAE] mb-3">{occ.sector}</p>
                <div className="space-y-1 text-xs text-[#8E9BAE] mb-4">
                  <p><strong className="text-[#ECEEF2]">Lương khởi điểm:</strong> <span className="font-tabular text-[#C5A880]">{occ.salaryRangeMonthlyMln.entry}</span> / tháng</p>
                  <p><strong className="text-[#ECEEF2]">Lương 3-5 năm:</strong> <span className="font-tabular text-[#C5A880]">{occ.salaryRangeMonthlyMln.mid}</span> / tháng</p>
                  <p><strong className="text-[#ECEEF2]">Lương chuyên gia:</strong> <span className="font-tabular text-[#C5A880]">{occ.salaryRangeMonthlyMln.senior}</span> / tháng</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-between">
                <button
                  onClick={() => setSelectedOccForDetail(occ)}
                  className="text-xs text-[#C5A880] hover:underline font-medium cursor-pointer"
                >
                  Xem thẻ nghề
                </button>
                <button
                  onClick={() => onOpenAIConsult(`Lộ trình từng bước để làm ${occ.title}`)}
                  className="text-[11px] text-[#7FAFA0] hover:text-[#9ED3C4] flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Kế hoạch chi tiết với AI</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------- QUICK COMPARISON MODE (SO SÁNH NHANH ĐỐI CHIẾU 2 NGÀNH) ------------------- */}
      {activeTab === 'compare' && (
        <div className="mt-8 space-y-8">
          {/* Quick Presets Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#0E131A] border border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs font-syne font-bold text-[#A1A1AA]">
              <Flame className="w-4 h-4 text-[#FF007A]" />
              <span>Gợi ý so sánh hot:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  data-magnetic
                  onClick={() => {
                    sfx.playUiSelect();
                    setCompareMajorAId(preset.idA);
                    setCompareMajorBId(preset.idB);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-syne font-semibold text-white flex items-center gap-1.5 transition-all hover-jiggle cursor-pointer"
                >
                  <span>{preset.label}</span>
                  <span className="text-[9px] text-[#00F0FF] font-tabular bg-[#00F0FF]/10 px-1.5 py-0.2 rounded font-bold">
                    {preset.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Dual Selector with Central Swap Button */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Sector A Picker */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-[#0A121A] border border-[#00F0FF]/30 shadow-lg relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-syne uppercase tracking-wider text-[#00F0FF] font-bold px-2 py-0.5 rounded bg-[#00F0FF]/10 border border-[#00F0FF]/20">
                  LỰA CHỌN A
                </span>
                <span className="text-xs font-tabular text-[#8E9BAE]">Mã: {majorA.code}</span>
              </div>
              <label className="block text-xs font-semibold text-white mb-2">
                Chọn ngành học thứ nhất:
              </label>
              <select
                value={compareMajorAId}
                onChange={(e) => {
                  sfx.playUiSelect();
                  setCompareMajorAId(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141A24] border border-white/15 text-xs font-syne font-bold text-white outline-none focus:border-[#00F0FF] cursor-pointer"
              >
                {MAJORS_DATA.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                ))}
              </select>
            </div>

            {/* Central Swap Button */}
            <div className="md:col-span-2 flex justify-center py-2 md:py-0">
              <button
                data-magnetic
                onClick={handleSwapMajors}
                className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-syne font-bold flex items-center gap-2 transition-all hover-jiggle cursor-pointer shadow-md hover:scale-105 active:scale-95"
                title="Đổi chỗ ngành A và ngành B"
              >
                <ArrowLeftRight className="w-4 h-4 text-[#00FF88]" />
                <span className="text-[11px] uppercase tracking-wider">ĐỔI VỊ TRÍ</span>
              </button>
            </div>

            {/* Sector B Picker */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-[#160E18] border border-[#FF007A]/30 shadow-lg relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-syne uppercase tracking-wider text-[#FF007A] font-bold px-2 py-0.5 rounded bg-[#FF007A]/10 border border-[#FF007A]/20">
                  LỰA CHỌN B
                </span>
                <span className="text-xs font-tabular text-[#8E9BAE]">Mã: {majorB.code}</span>
              </div>
              <label className="block text-xs font-semibold text-white mb-2">
                Chọn ngành học thứ hai:
              </label>
              <select
                value={compareMajorBId}
                onChange={(e) => {
                  sfx.playUiSelect();
                  setCompareMajorBId(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141A24] border border-white/15 text-xs font-syne font-bold text-white outline-none focus:border-[#FF007A] cursor-pointer"
              >
                {MAJORS_DATA.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.category})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Comparison KPI Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KPI Card A */}
            <div className="p-6 rounded-3xl bg-[#0E131A] border border-[#00F0FF]/30 shadow-xl space-y-4">
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-syne uppercase tracking-wider font-bold text-[#00F0FF]">
                    {majorA.category}
                  </span>
                  <h3 className="font-syne font-black text-xl text-white tracking-tight mt-1">
                    {majorA.name}
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#00F0FF]/15 text-[#00F0FF] font-bold shrink-0">
                  NGÀNH A
                </span>
              </div>

              {/* 3 Quick Badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-[#8E9BAE] block">Lương Khởi Điểm</span>
                  <p className="font-syne font-bold text-[#00FF88] text-sm mt-0.5">{analyticsA.entrySalaryText}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-[#8E9BAE] block">Nhu Cầu VN</span>
                  <p className="font-syne font-bold text-[#00F0FF] text-sm mt-0.5">{majorA.marketDemandOutlook}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-[#8E9BAE] block">Thời Gian Học</span>
                  <p className="font-syne font-bold text-white text-sm mt-0.5">{majorA.studyDurationYears} năm</p>
                </div>
              </div>
            </div>

            {/* KPI Card B */}
            <div className="p-6 rounded-3xl bg-[#0E131A] border border-[#FF007A]/30 shadow-xl space-y-4">
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-syne uppercase tracking-wider font-bold text-[#FF007A]">
                    {majorB.category}
                  </span>
                  <h3 className="font-syne font-black text-xl text-white tracking-tight mt-1">
                    {majorB.name}
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#FF007A]/15 text-[#FF007A] font-bold shrink-0">
                  NGÀNH B
                </span>
              </div>

              {/* 3 Quick Badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-[#8E9BAE] block">Lương Khởi Điểm</span>
                  <p className="font-syne font-bold text-[#00FF88] text-sm mt-0.5">{analyticsB.entrySalaryText}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-[#8E9BAE] block">Nhu Cầu VN</span>
                  <p className="font-syne font-bold text-[#FF007A] text-sm mt-0.5">{majorB.marketDemandOutlook}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-[#8E9BAE] block">Thời Gian Học</span>
                  <p className="font-syne font-bold text-white text-sm mt-0.5">{majorB.studyDurationYears} năm</p>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== DIMENSION 1: LƯƠNG DỰ KIẾN (SALARY BENCHMARK) ===================== */}
          <div className="p-6 rounded-3xl bg-[#0E131A] border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00FF88]/15 border border-[#00FF88]/30 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-[#00FF88]" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-base text-white">
                    1. Đối Chiếu Thu Nhập & Lương Dự Kiến (Salary Progression Trajectory)
                  </h3>
                  <p className="text-[11px] text-[#8E9BAE]">
                    Dữ liệu khảo sát lương thực tế năm 2026 và cam kết tuyển dụng từ doanh nghiệp
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-tabular uppercase text-[#00FF88] bg-[#00FF88]/10 px-2 py-0.5 rounded border border-[#00FF88]/20 hidden sm:inline font-bold">
                Triệu VNĐ / Tháng
              </span>
            </div>

            {/* Head-to-Head Salary Progression Bars */}
            <div className="space-y-5">
              {/* Level 1: Entry Level */}
              <div className="p-4 rounded-2xl bg-[#141A24] border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs font-syne">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>Lương khởi điểm (Sinh viên mới ra trường 0 - 2 năm):</span>
                  </span>
                  <span className="text-[#8E9BAE] font-tabular text-[11px]">So sánh tương quan</span>
                </div>

                <div className="space-y-2">
                  {/* Major A */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-syne">
                      <span className="text-[#00F0FF] font-semibold truncate max-w-[280px]">{majorA.name}</span>
                      <span className="font-tabular font-bold text-white">{analyticsA.entrySalaryText}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#00F0FF] to-[#00DFD8] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (analyticsA.salaryMetrics.entryNum / 35) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Major B */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-syne">
                      <span className="text-[#FF007A] font-semibold truncate max-w-[280px]">{majorB.name}</span>
                      <span className="font-tabular font-bold text-white">{analyticsB.entrySalaryText}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#FF007A] to-[#F43F5E] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (analyticsB.salaryMetrics.entryNum / 35) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Level 2: Mid-Level */}
              <div className="p-4 rounded-2xl bg-[#141A24] border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs font-syne">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#00FF88]" />
                    <span>Lương trung cấp (Đã tích lũy kinh nghiệm 3 - 5 năm):</span>
                  </span>
                  <span className="text-[#8E9BAE] font-tabular text-[11px]">Tăng trưởng vượt bậc</span>
                </div>

                <div className="space-y-2">
                  {/* Major A */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-syne">
                      <span className="text-[#00F0FF] font-semibold truncate max-w-[280px]">{majorA.name}</span>
                      <span className="font-tabular font-bold text-white">{analyticsA.midSalaryText}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#00F0FF] to-[#00DFD8] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (analyticsA.salaryMetrics.midNum / 70) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Major B */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-syne">
                      <span className="text-[#FF007A] font-semibold truncate max-w-[280px]">{majorB.name}</span>
                      <span className="font-tabular font-bold text-white">{analyticsB.midSalaryText}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#FF007A] to-[#F43F5E] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (analyticsB.salaryMetrics.midNum / 70) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Level 3: Senior Level */}
              <div className="p-4 rounded-2xl bg-[#141A24] border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs font-syne">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#FFE600]" />
                    <span>Lương cấp cao / Chuyên gia / Quản lý (5+ năm):</span>
                  </span>
                  <span className="text-[#8E9BAE] font-tabular text-[11px]">Trần thu nhập</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-[#00F0FF]/20">
                    <span className="text-[10px] text-[#00F0FF] font-syne uppercase font-bold block">{majorA.name}</span>
                    <span className="font-tabular font-black text-lg text-white mt-1 block">{analyticsA.seniorSalaryText}</span>
                    <span className="text-[10px] text-[#8E9BAE] block mt-0.5">Vị trí: Lead Engineer / Senior Architect</span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-[#FF007A]/20">
                    <span className="text-[10px] text-[#FF007A] font-syne uppercase font-bold block">{majorB.name}</span>
                    <span className="font-tabular font-black text-lg text-white mt-1 block">{analyticsB.seniorSalaryText}</span>
                    <span className="text-[10px] text-[#8E9BAE] block mt-0.5">Vị trí: Principal Specialist / Project Lead</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== DIMENSION 2: NHU CẦU THỊ TRƯỜNG & TÁC ĐỘNG AI ===================== */}
          <div className="p-6 rounded-3xl bg-[#0E131A] border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00F0FF]/15 border border-[#00F0FF]/30 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#00F0FF]" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-base text-white">
                    2. Đối Chiếu Nhu Cầu Thị Trường Lao Động Việt Nam & Tác Động AI
                  </h3>
                  <p className="text-[11px] text-[#8E9BAE]">
                    Xu hướng thu hút vốn FDI, tỷ lệ tuyển dụng và độ an toàn trước làn sóng tự động hóa
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column A */}
              <div className="p-5 rounded-2xl bg-[#141A24] border border-[#00F0FF]/25 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-syne font-bold text-[#00F0FF]">{majorA.name}</span>
                  <span className="text-[10px] font-syne font-bold px-2 py-0.5 rounded-full bg-[#00FF88]/15 text-[#00FF88]">
                    {majorA.marketDemandOutlook}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8E9BAE] block font-semibold mb-1">
                    Doanh nghiệp tuyển dụng & đối tác tiêu biểu
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analyticsA.keyPartners.map((partner, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white/10 text-[11px] text-white font-tabular">
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-[#8E9BAE] block font-semibold mb-1">
                    Tác động của AI & Tự động hóa
                  </span>
                  <p className="text-xs text-[#ECEEF2] leading-relaxed bg-white/[0.03] p-3 rounded-xl border border-white/5">
                    {majorA.automationImpactAnalysis}
                  </p>
                </div>
              </div>

              {/* Column B */}
              <div className="p-5 rounded-2xl bg-[#141A24] border border-[#FF007A]/25 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-syne font-bold text-[#FF007A]">{majorB.name}</span>
                  <span className="text-[10px] font-syne font-bold px-2 py-0.5 rounded-full bg-[#FF007A]/15 text-[#FF007A]">
                    {majorB.marketDemandOutlook}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-[#8E9BAE] block font-semibold mb-1">
                    Doanh nghiệp tuyển dụng & đối tác tiêu biểu
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {analyticsB.keyPartners.map((partner, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white/10 text-[11px] text-white font-tabular">
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-[#8E9BAE] block font-semibold mb-1">
                    Tác động của AI & Tự động hóa
                  </span>
                  <p className="text-xs text-[#ECEEF2] leading-relaxed bg-white/[0.03] p-3 rounded-xl border border-white/5">
                    {majorB.automationImpactAnalysis}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== DIMENSION 3: KỸ NĂNG & KHỐI KIẾN THỨC ===================== */}
          <div className="p-6 rounded-3xl bg-[#0E131A] border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFE600]/15 border border-[#FFE600]/30 flex items-center justify-center">
                  <Award className="w-4 h-4 text-[#FFE600]" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-base text-white">
                    3. Đối Chiếu Kỹ Năng & Chuẩn Đầu Ra (Core Skills & Disciplines)
                  </h3>
                  <p className="text-[11px] text-[#8E9BAE]">
                    Khối kiến thức cốt lõi và năng lực bắt buộc khi tốt nghiệp
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column A Skills */}
              <div className="p-5 rounded-2xl bg-[#141A24] border border-[#00F0FF]/25 space-y-4">
                <h4 className="text-xs font-syne font-bold text-[#00F0FF] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                  <span>Kỹ năng & Năng lực đầu ra: {majorA.name}</span>
                </h4>
                <div className="space-y-2">
                  <span className="text-[11px] text-[#8E9BAE] font-semibold block">Năng lực thực chiến cốt lõi:</span>
                  {majorA.expectedCompetencies.map((comp, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#ECEEF2]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] mt-1.5 shrink-0" />
                      <span>{comp}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[11px] text-[#8E9BAE] font-semibold block">Khối kiến thức chuyên ngành:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {majorA.coreDisciplines.map((disc, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white">
                        {disc}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[#8E9BAE]">Tổ hợp xét tuyển:</span>
                  <span className="font-tabular font-bold text-[#00F0FF]">{majorA.applicableCombinations.join(', ')}</span>
                </div>
              </div>

              {/* Column B Skills */}
              <div className="p-5 rounded-2xl bg-[#141A24] border border-[#FF007A]/25 space-y-4">
                <h4 className="text-xs font-syne font-bold text-[#FF007A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#FF007A]" />
                  <span>Kỹ năng & Năng lực đầu ra: {majorB.name}</span>
                </h4>
                <div className="space-y-2">
                  <span className="text-[11px] text-[#8E9BAE] font-semibold block">Năng lực thực chiến cốt lõi:</span>
                  {majorB.expectedCompetencies.map((comp, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#ECEEF2]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF007A] mt-1.5 shrink-0" />
                      <span>{comp}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <span className="text-[11px] text-[#8E9BAE] font-semibold block">Khối kiến thức chuyên ngành:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {majorB.coreDisciplines.map((disc, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white">
                        {disc}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[#8E9BAE]">Tổ hợp xét tuyển:</span>
                  <span className="font-tabular font-bold text-[#FF007A]">{majorB.applicableCombinations.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== DIMENSION 4: LỘ TRÌNH CHUYỂN ĐỔI & DỰ PHÒNG ===================== */}
          <div className="p-6 rounded-3xl bg-[#0E131A] border border-white/10 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4 text-[#A855F7]" />
                </div>
                <div>
                  <h3 className="font-syne font-bold text-base text-white">
                    4. Khả Năng Thích Ứng & Lộ Trình Dự Phòng (Pivot Flexibility)
                  </h3>
                  <p className="text-[11px] text-[#8E9BAE]">
                    Kịch bản chuyển ngành nếu không hợp sau năm 1-2 và các nghề kề cận
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-2xl bg-[#141A24] border border-white/5 space-y-2">
                <span className="font-syne font-bold text-[#00F0FF] block mb-1">
                  Kịch bản chuyển hướng của {majorA.name}:
                </span>
                {majorA.transitionPivots.map((piv, i) => (
                  <p key={i} className="text-[#ECEEF2] flex items-start gap-1.5">
                    <span className="text-[#00F0FF] font-bold">→</span>
                    <span>{piv}</span>
                  </p>
                ))}
                <div className="pt-2 mt-2 border-t border-white/10">
                  <span className="text-[#8E9BAE] text-[11px] block">Nghề kề cận:</span>
                  <span className="text-white font-medium">{majorA.adjacentJobs.join(' • ')}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141A24] border border-white/5 space-y-2">
                <span className="font-syne font-bold text-[#FF007A] block mb-1">
                  Kịch bản chuyển hướng của {majorB.name}:
                </span>
                {majorB.transitionPivots.map((piv, i) => (
                  <p key={i} className="text-[#ECEEF2] flex items-start gap-1.5">
                    <span className="text-[#FF007A] font-bold">→</span>
                    <span>{piv}</span>
                  </p>
                ))}
                <div className="pt-2 mt-2 border-t border-white/10">
                  <span className="text-[#8E9BAE] text-[11px] block">Nghề kề cận:</span>
                  <span className="text-white font-medium">{majorB.adjacentJobs.join(' • ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===================== SMART AI DECISION HELPER & VERDICT ===================== */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0A121A] via-[#0E131A] to-[#1A0D18] border border-white/15 shadow-2xl space-y-6">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#00F0FF]" />
              <h3 className="font-syne font-black text-lg text-white">
                Gợi Ý Ra Quyết Định: Ai Nên Chọn Ngành Nào?
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#00F0FF]/20 space-y-2">
                <span className="font-syne font-bold text-[#00F0FF] text-sm block">
                  Bạn nên chọn {majorA.name} khi:
                </span>
                <p className="text-[#ECEEF2] leading-relaxed">
                  • Điểm thi nổi trội ở các môn {majorA.applicableCombinations.join(', ')} và yêu thích tư duy logic hệ thống.
                </p>
                <p className="text-[#ECEEF2] leading-relaxed">
                  • Mục tiêu tài chính: {analyticsA.entrySalaryText} ngay khi tốt nghiệp và làm việc trực tiếp trong ngành công nghệ cao quốc gia.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-[#FF007A]/20 space-y-2">
                <span className="font-syne font-bold text-[#FF007A] text-sm block">
                  Bạn nên chọn {majorB.name} khi:
                </span>
                <p className="text-[#ECEEF2] leading-relaxed">
                  • Yêu thích sáng tạo ứng dụng, linh hoạt trong môi trường làm việc đa lĩnh vực và thế mạnh ở {majorB.applicableCombinations.join(', ')}.
                </p>
                <p className="text-[#ECEEF2] leading-relaxed">
                  • Mục tiêu sự nghiệp: Phạm vi cơ hội việc làm rộng mở, khả năng chuyển tiếp sang các lĩnh vực quản lý và phát triển thăng tiến nhanh chóng.
                </p>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                data-magnetic
                onClick={() => onOpenAIConsult(`Tôi đang phân vân lựa chọn giữa 2 ngành: "${majorA.name}" và "${majorB.name}". Hãy đối chiếu năng lực, chi phí học tập và cơ hội việc làm tại thị trường Việt Nam 2026-2030 để đưa ra quyết định phù hợp nhất.`)}
                className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#00F0FF] via-[#7928CA] to-[#FF007A] text-white text-xs font-syne font-black uppercase tracking-wider inline-flex items-center gap-2.5 transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-white animate-spin" />
                <span>Yêu Cầu AI Phân Tích Chuyên Sâu Giữa 2 Ngành Này</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TIMELINE GENERATOR VIEW ===================== */}
      {activeTab === 'timeline' && (
        <div className="mt-8">
          <TimelineGenerator onOpenAIConsult={onOpenAIConsult} />
        </div>
      )}

      {/* Detail Modal for Major */}
      <AnimatePresence>
        {selectedMajorForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#0E131A] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-[#00F0FF] font-medium">{selectedMajorForDetail.category}</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {selectedMajorForDetail.name}
                  </h3>
                  <span className="text-xs text-[#8E9BAE] font-tabular">Mã ngành: {selectedMajorForDetail.code}</span>
                </div>
                <button
                  onClick={() => setSelectedMajorForDetail(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#8E9BAE] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#ECEEF2]">
                <div>
                  <span className="text-[#8E9BAE] block text-[11px] font-semibold mb-1">Chuẩn năng lực khi ra trường:</span>
                  <ul className="list-disc pl-5 space-y-1 text-[#94A3B8]">
                    {selectedMajorForDetail.expectedCompetencies.map((comp, idx) => (
                      <li key={idx}>{comp}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[#8E9BAE] block text-[11px] font-semibold mb-1">Môn học cốt lõi:</span>
                  <p className="text-[#94A3B8]">{selectedMajorForDetail.coreDisciplines.join(' • ')}</p>
                </div>

                <div>
                  <span className="text-[#8E9BAE] block text-[11px] font-semibold mb-1">Cơ hội việc làm trực tiếp:</span>
                  <p className="text-[#00FF88] font-medium">{selectedMajorForDetail.directlyRelatedJobs.join(' • ')}</p>
                </div>

                <div>
                  <span className="text-[#8E9BAE] block text-[11px] font-semibold mb-1">Nghề nghiệp lân cận có thể chuyển dịch:</span>
                  <p className="text-[#A1A1AA]">{selectedMajorForDetail.adjacentJobs.join(' • ')}</p>
                </div>

                <div className="p-4 rounded-xl bg-[#141A24] border border-white/5 space-y-2">
                  <span className="text-[11px] font-semibold text-[#FF007A]">Kịch bản dự phòng & chuyển đổi:</span>
                  {selectedMajorForDetail.transitionPivots.map((piv, idx) => (
                    <p key={idx} className="text-[#94A3B8]">→ {piv}</p>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => {
                    setCompareMajorAId(selectedMajorForDetail.id);
                    setSelectedMajorForDetail(null);
                    setActiveTab('compare');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#00F0FF]/15 text-[#00F0FF] border border-[#00F0FF]/30 text-xs font-semibold flex items-center gap-1.5"
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Đưa vào so sánh nhanh</span>
                </button>
                <button
                  onClick={() => {
                    const name = selectedMajorForDetail.name;
                    setSelectedMajorForDetail(null);
                    onOpenAIConsult(`Tư vấn chi tiết ngành ${name}: lộ trình học, việc làm và cơ hội chuyển đổi.`);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#00FF88]" />
                  <span>Hỏi AI về ngành này</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail Modal for Occupation */}
      <AnimatePresence>
        {selectedOccForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#0E131A] border border-white/20 rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-[#7FAFA0] font-medium">{selectedOccForDetail.sector}</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {selectedOccForDetail.title}
                  </h3>
                  <span className="text-xs text-[#00FF88]">Cấp thiết: {selectedOccForDetail.laborMarketUrgency}</span>
                </div>
                <button
                  onClick={() => setSelectedOccForDetail(null)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#8E9BAE] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#ECEEF2]">
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#141A24] border border-white/5 text-center">
                  <div>
                    <span className="text-[#8E9BAE] text-[10px] block">Khởi điểm</span>
                    <p className="font-bold text-sm text-[#00FF88] font-tabular mt-0.5">{selectedOccForDetail.salaryRangeMonthlyMln.entry}</p>
                  </div>
                  <div>
                    <span className="text-[#8E9BAE] text-[10px] block">3-5 năm</span>
                    <p className="font-bold text-sm text-[#00F0FF] font-tabular mt-0.5">{selectedOccForDetail.salaryRangeMonthlyMln.mid}</p>
                  </div>
                  <div>
                    <span className="text-[#8E9BAE] text-[10px] block">Chuyên gia</span>
                    <p className="font-bold text-sm text-[#FF007A] font-tabular mt-0.5">{selectedOccForDetail.salaryRangeMonthlyMln.senior}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[#8E9BAE] block text-[11px] font-semibold mb-1">Nhiệm vụ hàng ngày:</span>
                  <ul className="list-disc pl-5 space-y-1 text-[#94A3B8]">
                    {selectedOccForDetail.dailyTasks.map((t, idx) => (
                      <li key={idx}>{t}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="text-[#8E9BAE] block text-[11px] font-semibold mb-1">Kỹ năng cốt lõi bắt buộc:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOccForDetail.essentialSkills.map((sk, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-white/10 text-[11px] text-white">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[#8E9BAE] block text-[11px] font-semibold mb-1">Đường vào thay thế (không chỉ ĐH):</span>
                  <ul className="list-disc pl-5 space-y-1 text-[#C5A880]">
                    {selectedOccForDetail.alternativeEntryPaths.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => {
                    const title = selectedOccForDetail.title;
                    setSelectedOccForDetail(null);
                    onOpenAIConsult(`Lộ trình phát triển toàn diện theo đuổi nghề ${title}`);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00F0FF] to-[#00DFD8] text-[#0A0E17] text-xs font-bold flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kế hoạch chi tiết với AI</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
