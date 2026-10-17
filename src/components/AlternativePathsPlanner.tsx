import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Clock, 
  Wallet, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  GitBranch,
  Building
} from 'lucide-react';
import { ALTERNATIVE_PATHS_DATA, OCCUPATIONS_DATA } from '../data/mockData';

import { sfx } from '../services/soundEffects';

interface AlternativePathsPlannerProps {
  onOpenAIConsult: (query: string) => void;
}

export const AlternativePathsPlanner: React.FC<AlternativePathsPlannerProps> = ({ onOpenAIConsult }) => {
  const [selectedPathId, setSelectedPathId] = useState<string>(ALTERNATIVE_PATHS_DATA[0].id);
  const [selectedOverviewIndex, setSelectedOverviewIndex] = useState<number>(1);
  const activePath = ALTERNATIVE_PATHS_DATA.find(p => p.id === selectedPathId) || ALTERNATIVE_PATHS_DATA[0];

  const overviewOptions = [
    {
      title: '1. Đại học Chính quy',
      time: '4 – 4.5 năm',
      cost: '100 – 180 triệu',
      focus: 'Nền tảng lý thuyết rộng, tư duy nghiên cứu, bằng kỹ sư/cử nhân.',
      suit: 'Phù hợp người học mạnh môn lý thuyết, điểm thi cao, gia đình có ngân sách dài hạn.'
    },
    {
      title: '2. Cao đẳng Thực hành',
      time: '2.5 – 3 năm',
      cost: '30 – 45 triệu',
      focus: '70% thời lượng xưởng máy, tốt nghiệp làm được việc ngay, chi phí thấp.',
      suit: 'Phù hợp người muốn có thu nhập sớm từ năm 20 tuổi, sau đó học liên thông.'
    },
    {
      title: '3. Doanh nghiệp (Apprenticeship)',
      time: '1.5 – 2 năm',
      cost: 'Miễn phí / Có lương',
      focus: 'Đào tạo trực tiếp tại dây chuyền sản xuất, gắn liền vị trí làm việc cụ thể.',
      suit: 'Phù hợp người học thực chiến, muốn vừa làm vừa học có thu nhập trang trải.'
    },
    {
      title: '4. Mô-đun Kỹ năng & Chứng chỉ',
      time: '6 – 12 tháng',
      cost: '12 – 25 triệu',
      focus: 'Tập trung công cụ chuyên sâu (EDA vi mạch, lập trình PLC, ngoại ngữ, hải quan).',
      suit: 'Phù hợp người đã có nền tảng muốn chuyển ngành nhanh hoặc bổ sung kỹ năng.'
    },
  ];

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-8 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 text-xs font-tabular text-[#f59433] uppercase tracking-wider mb-2 font-bold">
          <GraduationCap className="w-4 h-4 text-[#f59433]" />
          <span>Phần VI · Nếu Không Đỗ Đại Học Thì Sao? (Module Độc Lập)</span>
        </div>
        <h2 className="font-syne font-black text-3xl sm:text-4xl text-[#ECEEF2]">
          Các Lộ Trình Thay Thế & Chiến Lược Dự Phòng
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#8E9BAE] max-w-3xl leading-relaxed">
          Không đỗ đại học không đồng nghĩa với thất bại giáo dục. Một bản đồ hướng nghiệp hoàn chỉnh phải cho phép bạn chọn mục tiêu nghề nghiệp trước, rồi mở ra mọi con đường khả thi: Cao đẳng thực hành, học nghề tại doanh nghiệp, tích lũy mô-đun kỹ năng và liên thông đại học khi đã đi làm.
        </p>
      </div>

      {/* Realistic comparative paths overview with interactive selection */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {overviewOptions.map((item, idx) => (
          <div 
            key={idx}
            onClick={() => {
              sfx.playUiSelect();
              setSelectedOverviewIndex(idx);
            }}
            className={`p-5 rounded-2xl border transition-all hover-jiggle cursor-pointer flex flex-col justify-between ${
              selectedOverviewIndex === idx
                ? 'bg-gradient-to-b from-[#f261ac]/15 to-transparent border-white/40 ring-1 ring-[#f261ac] shadow-lg'
                : 'glass-surface border-white/[0.07] hover:border-white/20'
            }`}
          >
            <div>
              <h4 className="font-syne font-bold text-sm text-[#ECEEF2] mb-2">{item.title}</h4>
              <div className="space-y-1 text-xs text-[#8E9BAE] mb-3">
                <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#00F0FF]" /> {item.time}</p>
                <p className="flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-[#00FF88]" /> {item.cost}</p>
              </div>
              <p className="text-xs text-white mb-2 font-medium">{item.focus}</p>
              <p className="text-[11px] text-[#8E9BAE] leading-relaxed">{item.suit}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Actionable Alternative Pathways */}
      <div className="mt-12">
        <h3 className="text-base font-syne font-bold text-[#ECEEF2] mb-4">
          Chi Tiết Các Lộ Trình Dự Phòng Điển Hình Tại Việt Nam
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Path tabs */}
          <div className="lg:col-span-5 space-y-3">
            {ALTERNATIVE_PATHS_DATA.map((path) => (
              <div
                key={path.id}
                onClick={() => {
                  sfx.playUiSelect();
                  setSelectedPathId(path.id);
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all hover-jiggle ${
                  selectedPathId === path.id
                    ? 'bg-white/10 border-[#00F0FF] shadow-xl ring-1 ring-[#00F0FF]/30'
                    : 'glass-surface border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-[#00FF88] mb-1 font-syne font-bold">
                  <span>{path.pathType}</span>
                  <span className="font-tabular">{path.durationMonths} tháng</span>
                </div>
                <h4 className="text-sm font-syne font-bold text-[#ECEEF2] mb-1">{path.targetGoal}</h4>
                <p className="text-xs text-[#8E9BAE] font-tabular">Học phí dự kiến: ~{path.estimatedCostMln} triệu VND</p>
              </div>
            ))}
          </div>

          {/* Path details */}
          <div className="lg:col-span-7">
            <div className="p-6 rounded-2xl bg-[#0E131A] border border-white/[0.08] space-y-6">
              <div className="border-b border-white/[0.06] pb-4">
                <span className="text-xs font-tabular text-[#DFBA84] uppercase tracking-wider">
                  MỤC TIÊU: {activePath.targetGoal}
                </span>
                <h3 className="text-xl font-serif-luxury text-[#ECEEF2] mt-1">
                  Hình thức: {activePath.pathType}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#141A25]">
                  <span className="text-[10px] text-[#8E9BAE] block">Thời lượng toàn khóa:</span>
                  <p className="font-tabular font-bold text-base text-[#ECEEF2] mt-0.5">{activePath.durationMonths} tháng</p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#141A25]">
                  <span className="text-[10px] text-[#8E9BAE] block">Học phí toàn khóa ước tính:</span>
                  <p className="font-tabular font-bold text-base text-[#DFBA84] mt-0.5">~{activePath.estimatedCostMln} triệu VND</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <h5 className="font-semibold text-[#ECEEF2]">Lợi thế cạnh tranh ban đầu:</h5>
                <p className="text-[#8E9BAE] leading-relaxed p-3.5 rounded-xl bg-[#121822]">
                  {activePath.startingAdvantage}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <h5 className="font-semibold text-[#7FAFA0]">Hệ số chuyển đổi & Cơ hội học tiếp (Liên thông):</h5>
                <p className="text-[#ECEEF2] leading-relaxed p-3.5 rounded-xl bg-[#13221C] border border-[#7FAFA0]/20">
                  {activePath.transferabilityIndex}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <h5 className="font-semibold text-[#ECEEF2]">Các cơ sở / chương trình tiêu biểu tại Việt Nam:</h5>
                <div className="flex flex-wrap gap-2">
                  {activePath.keyProgramsInVN.map((prog, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-[#18212E] text-[#ECEEF2] border border-white/5">
                      {prog}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onOpenAIConsult(`Tôi muốn lập kế hoạch học tập theo lộ trình thay thế: ${activePath.targetGoal} qua ${activePath.pathType}`)}
                  className="w-full py-3 rounded-xl bg-[#151D29] hover:bg-[#1C2738] border border-white/10 text-xs text-[#ECEEF2] font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Tham vấn AI về chiến lược liên thông và tích lũy kỹ năng</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
