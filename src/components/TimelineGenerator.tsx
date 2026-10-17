import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Award, 
  Briefcase, 
  Code2, 
  Trophy, 
  CheckCircle2, 
  Circle, 
  Bookmark, 
  BookmarkCheck, 
  ChevronRight, 
  ExternalLink, 
  Sparkles, 
  Calendar, 
  Clock, 
  DollarSign, 
  Filter, 
  Layers, 
  Plus, 
  Share2, 
  ArrowRight, 
  Info, 
  AlertCircle,
  Building2,
  FileCheck2
} from 'lucide-react';
import { OCCUPATION_TIMELINES } from '../data/timelineData';
import { OCCUPATIONS_DATA } from '../data/mockData';
import { TimelineMilestone, MilestoneType, MilestoneStage, Occupation } from '../types';
import { sfx } from '../services/soundEffects';

interface TimelineGeneratorProps {
  initialOccupationId?: string;
  onOpenAIConsult?: (query: string) => void;
}

export const TimelineGenerator: React.FC<TimelineGeneratorProps> = ({
  initialOccupationId = 'occ-ai-engineer',
  onOpenAIConsult
}) => {
  const [selectedOccId, setSelectedOccId] = useState<string>(initialOccupationId);
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [selectedMilestone, setSelectedMilestone] = useState<TimelineMilestone | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customMilestones, setCustomMilestones] = useState<TimelineMilestone[]>([]);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // New Custom Milestone Form State
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState<MilestoneType>('course');
  const [customStage, setCustomStage] = useState<MilestoneStage>('stage-2-specialization');
  const [customProvider, setCustomProvider] = useState('');
  const [customDuration, setCustomDuration] = useState('');
  const [customSummary, setCustomSummary] = useState('');

  // Find occupation metadata
  const currentOcc = OCCUPATIONS_DATA.find(o => o.id === selectedOccId) || OCCUPATIONS_DATA[0];
  const timelineData = OCCUPATION_TIMELINES[selectedOccId] || {
    occupationId: currentOcc.id,
    occupationTitle: currentOcc.title,
    sector: currentOcc.sector,
    overview: currentOcc.techEvolutionNotes || 'Lộ trình tích lũy chứng chỉ và năng lực thực chiến theo chuẩn doanh nghiệp.',
    estimatedTotalMonths: 36,
    recommendedMajors: ['Kỹ thuật & Công nghệ liên quan'],
    targetCompaniesInVN: ['Doanh nghiệp & Tập đoàn đầu ngành'],
    milestones: [
      {
        id: `${currentOcc.id}-m1`,
        title: `Nền tảng học thuật cốt lõi cho ${currentOcc.title}`,
        type: 'course',
        stage: 'stage-1-foundation',
        stageLabel: 'Năm 1 - 2 (Nền tảng)',
        durationText: '8 - 12 tuần',
        provider: 'Đại học & Nền tảng chuyên môn',
        summary: `Trang bị kỹ năng tiên quyết: ${currentOcc.essentialSkills.slice(0, 3).join(', ')}.`,
        skillsGained: currentOcc.essentialSkills.slice(0, 3),
        proTips: 'Tập thói quen đọc tài liệu kỹ thuật bằng tiếng Anh.'
      },
      {
        id: `${currentOcc.id}-m2`,
        title: `Chứng chỉ nghề nghiệp tiêu chuẩn cho ${currentOcc.title}`,
        type: 'certification',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Chứng chỉ Chuyên môn)',
        durationText: '10 - 14 tuần',
        provider: 'Hiệp hội / Tập đoàn cấp chứng chỉ chuyên ngành',
        summary: 'Xác thực năng lực giải quyết bài toán thực tế theo quy chuẩn ngành.',
        skillsGained: currentOcc.essentialSkills.slice(2, 5),
        proTips: 'Luyện đề mẫu trước khi thi chính thức.'
      },
      {
        id: `${currentOcc.id}-m3`,
        title: `Thực tập doanh nghiệp (Internship / Shadowing)`,
        type: 'internship',
        stage: 'stage-3-internship',
        stageLabel: 'Năm 3 - 4 (Thực chiến Doanh nghiệp)',
        durationText: '3 - 6 tháng',
        provider: 'Doanh nghiệp tuyển dụng',
        summary: 'Tham gia dự án thật, thích ứng văn hóa làm việc và quy trình bàn giao sản phẩm.',
        skillsGained: currentOcc.trainableOnJobSkills.concat(['Quy trình Agile/Scrum', 'Báo cáo tiến độ']),
        proTips: 'Chủ động xin feedback hàng tuần từ Mentor hướng dẫn.'
      }
    ] as TimelineMilestone[]
  };

  const allMilestones = [...timelineData.milestones, ...customMilestones.filter(m => m.id.startsWith(selectedOccId))];

  // Filters
  const filteredMilestones = allMilestones.filter(m => {
    const matchStage = stageFilter === 'ALL' || m.stage === stageFilter;
    const matchType = typeFilter === 'ALL' || m.type === typeFilter;
    return matchStage && matchType;
  });

  const completedCount = allMilestones.filter(m => completedIds.has(m.id)).length;
  const progressPercent = allMilestones.length > 0 ? Math.round((completedCount / allMilestones.length) * 100) : 0;

  const toggleComplete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sfx.playActionSuccess();
    setCompletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sfx.playUiSelect();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newMilestone: TimelineMilestone = {
      id: `${selectedOccId}-custom-${Date.now()}`,
      title: customTitle.trim(),
      type: customType,
      stage: customStage,
      stageLabel: customStage === 'stage-1-foundation' ? 'Năm 1-2 (Tự bổ sung)' :
                 customStage === 'stage-2-specialization' ? 'Năm 2-3 (Tự bổ sung)' :
                 customStage === 'stage-3-internship' ? 'Năm 3-4 (Tự bổ sung)' : 'Năm 4+ (Tự bổ sung)',
      durationText: customDuration || '4 - 8 tuần',
      provider: customProvider || 'Cá nhân thiết lập',
      summary: customSummary || 'Kế hoạch cá nhân do bạn tự đặt mục tiêu thực hiện.',
      skillsGained: ['Kỹ năng tự học', 'Quản lý thời gian'],
      proTips: 'Định kỳ xem lại mục tiêu mỗi 2 tuần để giữ cam kết.'
    };

    setCustomMilestones(prev => [newMilestone, ...prev]);
    setShowAddCustomModal(false);
    setCustomTitle('');
    setCustomProvider('');
    setCustomDuration('');
    setCustomSummary('');
    sfx.playActionSuccess();
  };

  const handleCopyRoadmap = () => {
    sfx.playActionSuccess();
    const markdown = `# LỘ TRÌNH NGHỀ NGHIỆP: ${currentOcc.title}
Lĩnh vực: ${currentOcc.sector}
Thời gian dự kiến: ${timelineData.estimatedTotalMonths} tháng
Ngành phù hợp: ${timelineData.recommendedMajors.join(', ')}
Doanh nghiệp mục tiêu: ${timelineData.targetCompaniesInVN.join(', ')}

## CÁC CỘT MỐC CHÍNH
${allMilestones.map((m, idx) => `
### ${idx + 1}. [${m.type.toUpperCase()}] ${m.title}
- Giai đoạn: ${m.stageLabel}
- Thời lượng: ${m.durationText}
- Đơn vị cấp chứng chỉ: ${m.provider}
- Nội dung: ${m.summary}
- Kỹ năng đạt được: ${m.skillsGained.join(', ')}
- Lời khuyên thực chiến: ${m.proTips}
`).join('\n')}
`;
    navigator.clipboard.writeText(markdown);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  const getTypeBadge = (type: MilestoneType) => {
    switch(type) {
      case 'course':
        return { label: 'Khóa học Ngắn', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: GraduationCap };
      case 'certification':
        return { label: 'Chứng Chỉ', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: Award };
      case 'internship':
        return { label: 'Thực tập & Shadowing', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: Briefcase };
      case 'project':
        return { label: 'Dự án Thực Chiến', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: Code2 };
      case 'competition':
        return { label: 'Cuộc Thi & Giải Thưởng', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', icon: Trophy };
    }
  };

  return (
    <div className="py-6 space-y-8">
      {/* Top Banner / Selection */}
      <div className="p-6 rounded-2xl bg-[#0E131A] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#C5A880]/10 via-[#00F0FF]/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-tabular text-[#C5A880] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <span>CÔNG CỤ THIẾT KẾ LỘ TRÌNH NGHỀ NGHIỆP THỰC CHIẾN (TIMELINE GENERATOR)</span>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-serif-luxury text-[#ECEEF2]">
              Lộ trình Cột mốc: <span className="text-[#C5A880]">{currentOcc.title}</span>
            </h3>

            <p className="text-xs sm:text-sm text-[#8E9BAE] max-w-3xl leading-relaxed">
              {timelineData.overview}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-[#18212D] text-[#ECEEF2] border border-white/10 flex items-center gap-1.5 font-tabular">
                <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                Tổng thời lượng khuyến nghị: {timelineData.estimatedTotalMonths} tháng (~3 - 4 năm)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#18212D] text-[#ECEEF2] border border-white/10 flex items-center gap-1.5 font-tabular">
                <Building2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                Mục tiêu: {timelineData.targetCompaniesInVN.slice(0, 3).join(', ')}
              </span>
            </div>
          </div>

          {/* Occupation Dropdown Selector & Export */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[280px]">
            <div>
              <label className="block text-[11px] font-semibold text-[#8E9BAE] mb-1.5">
                Chọn nghề nghiệp mục tiêu
              </label>
              <select
                value={selectedOccId}
                onChange={(e) => {
                  sfx.playUiSelect();
                  setSelectedOccId(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#141A24] border border-white/10 text-xs text-[#ECEEF2] outline-none focus:border-[#C5A880] font-sans cursor-pointer"
              >
                {OCCUPATIONS_DATA.map((occ) => (
                  <option key={occ.id} value={occ.id} className="bg-[#0E131A] text-[#ECEEF2]">
                    {occ.title} ({occ.sector})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                data-magnetic
                onClick={handleCopyRoadmap}
                className="flex-1 px-3 py-2 rounded-xl bg-[#18212D] hover:bg-[#202B3A] text-xs text-[#ECEEF2] border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{copiedNotification ? 'Đã sao chép Markdown!' : 'Xuất Markdown Lộ trình'}</span>
              </button>
              
              <button
                data-magnetic
                onClick={() => {
                  sfx.playUiSelect();
                  setShowAddCustomModal(true);
                }}
                className="px-3 py-2 rounded-xl bg-[#C5A880]/15 hover:bg-[#C5A880]/25 text-[#C5A880] border border-[#C5A880]/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm mốc</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="mt-6 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141A24] border border-white/10 flex items-center justify-center font-tabular font-bold text-sm text-[#00F0FF]">
              {progressPercent}%
            </div>
            <div>
              <div className="text-xs font-medium text-[#ECEEF2]">
                Tiến độ chinh phục: <span className="text-[#00F0FF] font-tabular font-bold">{completedCount}</span> / {allMilestones.length} mốc
              </div>
              <div className="text-[11px] text-[#8E9BAE]">
                Đánh dấu các chứng chỉ và khóa học khi bạn hoàn thành để ghi nhận tích lũy
              </div>
            </div>
          </div>

          <div className="w-full sm:w-64 h-2.5 rounded-full bg-[#141A24] overflow-hidden p-0.5 border border-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#C5A880] to-[#00F0FF]"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0A0D14] p-4 rounded-xl border border-white/5">
        {/* Stage Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#8E9BAE] flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-[#C5A880]" />
            Giai đoạn:
          </span>
          {[
            { id: 'ALL', label: 'Tất cả (4 năm)' },
            { id: 'stage-1-foundation', label: 'Năm 1-2: Nền tảng' },
            { id: 'stage-2-specialization', label: 'Năm 2-3: Chuyên sâu' },
            { id: 'stage-3-internship', label: 'Năm 3-4: Thực tập' },
            { id: 'stage-4-career', label: 'Năm 4+: Khởi nghiệp' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => {
                sfx.playUiSelect();
                setStageFilter(s.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                stageFilter === s.id
                  ? 'bg-[#C5A880] text-[#07090D] font-bold shadow-sm'
                  : 'bg-[#141A24] text-[#8E9BAE] hover:text-white border border-white/5'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#8E9BAE] mr-1">Loại:</span>
          {[
            { id: 'ALL', label: 'Tất cả loại' },
            { id: 'course', label: 'Khóa học' },
            { id: 'certification', label: 'Chứng chỉ' },
            { id: 'internship', label: 'Thực tập' },
            { id: 'project', label: 'Dự án' },
            { id: 'competition', label: 'Cuộc thi' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                sfx.playUiSelect();
                setTypeFilter(t.id);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                typeFilter === t.id
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 font-bold'
                  : 'bg-[#141A24] text-[#8E9BAE] hover:text-white border border-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical Interactive Timeline */}
      <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-[#C5A880] via-[#00F0FF] to-transparent">
        {filteredMilestones.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0E131A] border border-white/10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#8E9BAE] mx-auto" />
            <p className="text-sm text-[#ECEEF2] font-medium">Không tìm thấy mốc phù hợp bộ lọc hiện tại.</p>
            <button
              onClick={() => {
                setStageFilter('ALL');
                setTypeFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-[#141A24] text-xs text-[#C5A880] border border-white/10 hover:border-[#C5A880] transition-colors cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          filteredMilestones.map((milestone, idx) => {
            const isCompleted = completedIds.has(milestone.id);
            const isBookmarked = bookmarkedIds.has(milestone.id);
            const typeInfo = getTypeBadge(milestone.type);
            const Icon = typeInfo.icon;

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className={`relative group rounded-2xl p-5 sm:p-6 transition-all duration-300 border ${
                  isCompleted 
                    ? 'bg-[#0B1516] border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                    : 'bg-[#0E131A] border-white/10 hover:border-white/25 hover:bg-[#121822]'
                }`}
              >
                {/* Node icon along the line */}
                <div 
                  onClick={(e) => toggleComplete(milestone.id, e)}
                  title={isCompleted ? 'Đã hoàn thành - bấm để hủy' : 'Bấm để đánh dấu hoàn thành'}
                  className={`absolute -left-[33px] sm:-left-[43px] top-6 w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 border-white text-[#07090D] scale-110 shadow-lg shadow-emerald-500/50'
                      : 'bg-[#0E131A] border-[#C5A880] text-[#C5A880] hover:scale-110 hover:border-white'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 stroke-[3]" /> : <Circle className="w-3.5 h-3.5" />}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    {/* Header tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${typeInfo.color}`}>
                        <Icon className="w-3 h-3" />
                        {typeInfo.label}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-tabular bg-[#18212D] text-[#ECEEF2] border border-white/10">
                        {milestone.stageLabel}
                      </span>
                      {milestone.costEstimate && (
                        <span className="text-[11px] font-tabular text-[#8E9BAE] flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-[#C5A880]" />
                          {milestone.costEstimate}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className={`text-base sm:text-lg font-semibold leading-snug ${
                      isCompleted ? 'text-emerald-300 line-through decoration-emerald-500/50' : 'text-[#ECEEF2]'
                    }`}>
                      {milestone.title}
                    </h4>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-[#8E9BAE] leading-relaxed">
                      {milestone.summary}
                    </p>

                    {/* Skills pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-[#C5A880] mr-1">Kỹ năng đạt được:</span>
                      {milestone.skillsGained.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md bg-[#141A24] text-[#ECEEF2] text-[11px] border border-white/5 font-tabular"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Pro Tips box */}
                    {milestone.proTips && (
                      <div className="mt-3 p-3 rounded-xl bg-[#090D14] border border-[#C5A880]/20 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                        <div className="text-xs text-[#ECEEF2]/90 leading-relaxed">
                          <span className="text-[#C5A880] font-semibold">Bí quyết thực chiến (Pro Tips): </span>
                          {milestone.proTips}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/5 shrink-0">
                    <div className="text-left lg:text-right">
                      <div className="text-[11px] text-[#8E9BAE] font-medium">Đơn vị tổ chức:</div>
                      <div className="text-xs font-semibold text-[#ECEEF2] max-w-[200px] truncate">
                        {milestone.provider}
                      </div>
                      <div className="text-[11px] font-tabular text-[#00F0FF] mt-0.5">
                        {milestone.durationText}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleBookmark(milestone.id, e)}
                        title={isBookmarked ? 'Đã lưu mốc' : 'Lưu mốc quan tâm'}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          isBookmarked 
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' 
                            : 'bg-[#141A24] text-[#8E9BAE] border-white/10 hover:text-white'
                        }`}
                      >
                        {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => setSelectedMilestone(milestone)}
                        className="px-3 py-1.5 rounded-xl bg-[#141A24] hover:bg-[#202B3A] text-xs text-[#ECEEF2] border border-white/10 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Chi tiết</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0E131A] border border-[#C5A880]/30 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-tabular uppercase tracking-wider text-[#C5A880]">
                    Hồ sơ chi tiết cột mốc
                  </span>
                  <h3 className="text-xl font-serif-luxury text-[#ECEEF2]">
                    {selectedMilestone.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="p-1.5 rounded-lg bg-[#141A24] text-[#8E9BAE] hover:text-white border border-white/10 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-[#8E9BAE] leading-relaxed">
                <div>
                  <strong className="text-[#ECEEF2]">Mô tả chi tiết:</strong>
                  <p className="mt-1">{selectedMilestone.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-[#141A24] border border-white/5">
                    <span className="text-[11px] text-[#8E9BAE]">Đơn vị tổ chức / Nền tảng:</span>
                    <p className="font-semibold text-[#ECEEF2] mt-0.5">{selectedMilestone.provider}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#141A24] border border-white/5">
                    <span className="text-[11px] text-[#8E9BAE]">Thời lượng khuyến nghị:</span>
                    <p className="font-semibold text-[#ECEEF2] mt-0.5">{selectedMilestone.durationText}</p>
                  </div>
                </div>

                {selectedMilestone.prerequisites && (
                  <div className="p-3 rounded-xl bg-[#141A24] border border-white/5">
                    <span className="text-[11px] text-[#8E9BAE]">Điều kiện tiên quyết:</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-[#ECEEF2]">
                      {selectedMilestone.prerequisites.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-[#090D14] border border-[#C5A880]/30 text-xs text-[#ECEEF2]">
                  <strong className="text-[#C5A880]">Lời khuyên tích lũy (Pro Tips):</strong>
                  <p className="mt-1 text-[#8E9BAE]">{selectedMilestone.proTips}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                {onOpenAIConsult && (
                  <button
                    onClick={() => {
                      setSelectedMilestone(null);
                      onOpenAIConsult(`Tôi muốn tìm hiểu chiến lược chinh phục cột mốc: ${selectedMilestone.title} (${selectedMilestone.provider}) cho nghề ${currentOcc.title}.`);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 text-[#00F0FF] border border-[#00F0FF]/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Hỏi AI Mentor về mốc này</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedMilestone(null)}
                  className="px-4 py-2 rounded-xl bg-[#18212D] text-xs text-[#ECEEF2] border border-white/10 hover:bg-[#202B3A] cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Custom Milestone Modal */}
      <AnimatePresence>
        {showAddCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0E131A] border border-[#C5A880]/40 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-serif-luxury text-[#ECEEF2]">
                  Thêm Cột Mốc Cá Nhân Cho Lộ Trình
                </h3>
                <button
                  onClick={() => setShowAddCustomModal(false)}
                  className="p-1 rounded-lg bg-[#141A24] text-[#8E9BAE] hover:text-white border border-white/10 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCustom} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#ECEEF2] font-semibold mb-1">Tên Cột mốc / Khóa học / Chứng chỉ *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Chứng chỉ Cisco CCNA, Khóa Thực tập Viettel..."
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141A24] border border-white/10 text-[#ECEEF2] outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#ECEEF2] font-semibold mb-1">Loại hình</label>
                    <select
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value as MilestoneType)}
                      className="w-full px-3 py-2 rounded-xl bg-[#141A24] border border-white/10 text-[#ECEEF2] outline-none focus:border-[#C5A880]"
                    >
                      <option value="course">Khóa học</option>
                      <option value="certification">Chứng chỉ</option>
                      <option value="internship">Thực tập</option>
                      <option value="project">Dự án</option>
                      <option value="competition">Cuộc thi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#ECEEF2] font-semibold mb-1">Giai đoạn</label>
                    <select
                      value={customStage}
                      onChange={(e) => setCustomStage(e.target.value as MilestoneStage)}
                      className="w-full px-3 py-2 rounded-xl bg-[#141A24] border border-white/10 text-[#ECEEF2] outline-none focus:border-[#C5A880]"
                    >
                      <option value="stage-1-foundation">Năm 1-2: Nền tảng</option>
                      <option value="stage-2-specialization">Năm 2-3: Chuyên sâu</option>
                      <option value="stage-3-internship">Năm 3-4: Thực tập</option>
                      <option value="stage-4-career">Năm 4+: Tốt nghiệp & Đi làm</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#ECEEF2] font-semibold mb-1">Đơn vị tổ chức / Nền tảng</label>
                    <input
                      type="text"
                      placeholder="VD: Coursera, Google, FPT..."
                      value={customProvider}
                      onChange={(e) => setCustomProvider(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#141A24] border border-white/10 text-[#ECEEF2] outline-none focus:border-[#C5A880]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#ECEEF2] font-semibold mb-1">Thời lượng dự kiến</label>
                    <input
                      type="text"
                      placeholder="VD: 6 tuần, 3 tháng..."
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#141A24] border border-white/10 text-[#ECEEF2] outline-none focus:border-[#C5A880]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#ECEEF2] font-semibold mb-1">Mục tiêu đạt được</label>
                  <textarea
                    rows={3}
                    placeholder="Bạn kỳ vọng học được gì hoặc đạt kết quả gì từ mốc này?"
                    value={customSummary}
                    onChange={(e) => setCustomSummary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141A24] border border-white/10 text-[#ECEEF2] outline-none focus:border-[#C5A880] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomModal(false)}
                    className="px-4 py-2 rounded-xl bg-[#141A24] text-[#8E9BAE] hover:text-white cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#C5A880] text-[#07090D] font-bold hover:bg-[#d8bc94] cursor-pointer"
                  >
                    Thêm mốc
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
