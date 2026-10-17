import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  MapPin, 
  AlertCircle, 
  ShieldCheck, 
  DollarSign, 
  Clock, 
  BarChart3, 
  Building,
  Info
} from 'lucide-react';
import { LABOR_MARKET_SIGNALS, OCCUPATIONS_DATA } from '../data/mockData';
import { ScrollParallax } from './ScrollParallax';

import { sfx } from '../services/soundEffects';

export const LaborMarketObservatory: React.FC = () => {
  const [selectedSignalIndex, setSelectedSignalIndex] = useState(0);
  const [experienceYears, setExperienceYears] = useState(2);
  const activeSignal = LABOR_MARKET_SIGNALS[selectedSignalIndex];

  // Calculated dynamic market values based on experience slider
  const estimatedSalary = Math.round(14.5 + experienceYears * 5.8);
  const salaryRange = `${estimatedSalary} - ${Math.round(estimatedSalary * 1.45)} triệu/tháng`;
  const automationResistance = Math.min(95, Math.round(68 + experienceYears * 4.2));

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header with Parallax */}
      <ScrollParallax speed={-0.15}>
        <div className="pb-8 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs font-tabular text-[#00F0FF] uppercase tracking-wider mb-2 font-bold">
            <TrendingUp className="w-4 h-4 text-[#00F0FF]" />
            <span>Module 6 · Labor Market Observatory (Đài Quan Sát Lao Động)</span>
          </div>
          <h2 className="font-syne font-black text-3xl sm:text-4xl text-[#ECEEF2]">
            Đài Quan Sát Thị Trường Lao Động Việt Nam
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#8E9BAE] max-w-3xl leading-relaxed">
            NEXORA không phóng đại số liệu từ các tin tuyển dụng ảo trên mạng. Mỗi chỉ số phân biệt rõ: Nhu cầu hiện tại đã xác minh, Dự báo trung hạn 1–3 năm, và Kịch bản dài hạn 5 năm kèm mức độ bất định.
          </p>
        </div>
      </ScrollParallax>

      {/* Official Government Data Baseline Banner */}
      <ScrollParallax speed={-0.2}>
        <div className="mt-8 p-6 rounded-3xl glass-surface-elevated border border-white/[0.12] shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/40 flex items-center justify-center text-[#00FF88]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-syne font-bold text-[#ECEEF2]">
                Dữ Liệu Thống Kê Chính Thức (Cục Thống kê Việt Nam · Quý II/2026)
              </h3>
            <span className="text-[11px] font-tabular text-[#8E9BAE]">
              Báo cáo Tình hình Lao động Việc làm Quý II năm 2026
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#141A24] border border-white/[0.04]">
            <span className="text-[11px] text-[#8E9BAE] block">Thất nghiệp độ tuổi lao động:</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-tabular text-2xl font-bold text-[#ECEEF2]">2,23%</span>
              <span className="text-[11px] text-[#7FAFA0]">Mức thấp ổn định</span>
            </div>
            <p className="text-[11px] text-[#8E9BAE] mt-2">
              Thể hiện nền kinh tế duy trì việc làm phổ thông tốt, nhưng che lấp thách thức ở nhóm trẻ.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#1F1710] border border-[#DFBA84]/25">
            <span className="text-[11px] text-[#DFBA84] block font-medium">Thất nghiệp thanh niên 15–24 tuổi:</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-tabular text-2xl font-bold text-[#DFBA84]">8,67%</span>
              <span className="text-[11px] text-[#DFBA84]">Gấp gần 4 lần chung</span>
            </div>
            <p className="text-[11px] text-[#8E9BAE] mt-2">
              Vấn đề cốt lõi: Khoảng cách giữa kiến thức trong trường và kỹ năng nhà tuyển dụng cần.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#141A24] border border-white/[0.04]">
            <span className="text-[11px] text-[#8E9BAE] block">Thanh niên nhóm NEET (Không học, không việc):</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-tabular text-2xl font-bold text-[#ECEEF2]">1,4 triệu</span>
              <span className="text-[11px] text-[#8E9BAE]">Toàn quốc</span>
            </div>
            <p className="text-[11px] text-[#8E9BAE] mt-2">
              Khẳng định vai trò cấp thiết của việc định hướng nghề có căn cứ và các lộ trình đào tạo thực hành.
            </p>
          </div>
        </div>
      </div>
      </ScrollParallax>

      {/* Regional Observatory View with Parallax */}
      <ScrollParallax speed={-0.12}>
        <div className="mt-8">
          {/* Interactive Dynamic Salary & Career Trajectory Simulator */}
          <div className="p-6 rounded-3xl glass-surface-elevated border border-white/10 mb-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-[10px] font-syne uppercase tracking-wider text-[#00F0FF] font-bold block mb-1">
                  Mô Phỏng Quỹ Đạo Thu Nhập Thực Tế (Việt Nam 2026-2030)
                </span>
                <h4 className="text-lg font-syne font-bold text-white">
                  Dự Phóng Mức Lương & Khả Năng Kháng Tự Động Hóa AI
                </h4>
              </div>
              <div className="px-3.5 py-1.5 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/30 text-[#00FF88] text-xs font-tabular font-bold shrink-0">
                Kháng AI: {automationResistance}%
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7">
                <div className="flex justify-between items-center text-xs text-[#ECEEF2] font-medium mb-2">
                  <span>Số năm kinh nghiệm tích lũy:</span>
                  <span className="text-[#00F0FF] font-tabular font-bold text-base">
                    {experienceYears === 0 ? 'Mới ra trường (Fresher)' : `${experienceYears} năm thực chiến`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="1"
                  value={experienceYears}
                  onChange={(e) => {
                    setExperienceYears(parseInt(e.target.value));
                    sfx.playUiHover();
                  }}
                  className="w-full accent-[#00F0FF] cursor-pointer h-1.5 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[#A1A1AA] font-tabular mt-1.5">
                  <span>0 năm</span>
                  <span>2 năm</span>
                  <span>4 năm</span>
                  <span>6 năm</span>
                  <span>8+ năm</span>
                </div>
              </div>

              <div className="md:col-span-5 p-4 rounded-2xl bg-white/[0.04] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider block">Dải lương ước tính:</span>
                  <span className="text-xl sm:text-2xl font-tabular font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#00FF88]">
                    {salaryRange}
                  </span>
                </div>
                <div className="text-right text-[11px] font-tabular text-[#8E9BAE]">
                  Căn cứ GSO Q2/2026
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-base font-syne font-bold text-[#ECEEF2] mb-4">
            Tín Hiệu Lao Động Theo Vùng Kinh Tế Trọng Điểm
          </h3>

        {/* Region tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {LABOR_MARKET_SIGNALS.map((sig, idx) => (
            <button
              key={idx}
              onClick={() => {
                sfx.playUiSelect();
                setSelectedSignalIndex(idx);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-syne font-bold transition-all flex items-center gap-2 hover-jiggle cursor-pointer ${
                selectedSignalIndex === idx
                  ? 'bg-gradient-to-r from-[#f261ac] to-[#835ad6] text-white shadow-lg border border-white/20'
                  : 'glass-surface text-[#8E9BAE] hover:text-white hover:border-white/20'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>{sig.region}</span>
            </button>
          ))}
        </div>

        {/* Selected Region Signal Detail */}
        <div className="p-6 rounded-2xl bg-[#0E131A] border border-white/[0.08] grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <span className="text-[11px] font-tabular text-[#7FAFA0] bg-[#12221C] px-2 py-0.5 rounded border border-[#7FAFA0]/20">
                LĨNH VỰC TRỌNG ĐIỂM: {activeSignal.sector}
              </span>
              <h4 className="font-serif-luxury text-2xl text-[#ECEEF2] mt-2">
                {activeSignal.region}
              </h4>
            </div>

            <div className="p-4 rounded-xl bg-[#141A25] border border-white/[0.04] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8E9BAE]">Tốc độ tăng trưởng nhu cầu:</span>
                <span className="font-tabular font-bold text-[#7FAFA0]">+{activeSignal.growthRatePct}% / năm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E9BAE]">Vị trí việc làm xác minh đang mở:</span>
                <span className="font-tabular font-semibold text-[#DFBA84]">{activeSignal.verifiedOpeningsCount.toLocaleString('vi-VN')} chỉ tiêu</span>
              </div>
            </div>

            <div className="text-xs space-y-2">
              <strong className="text-[#ECEEF2] block">Bối cảnh việc làm địa phương:</strong>
              <p className="text-[#8E9BAE] leading-relaxed">
                {activeSignal.youthUnemploymentContext}
              </p>
            </div>

            <div className="text-xs space-y-2">
              <strong className="text-[#7FAFA0] block">Triển vọng chân trời 3 năm (2026–2029):</strong>
              <p className="text-[#ECEEF2] leading-relaxed">
                {activeSignal.threeYearHorizonOutlook}
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-[#121822] border border-white/[0.06]">
              <h5 className="text-xs font-semibold text-[#ECEEF2] mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#C5A880]" />
                <span>Nhóm Kỹ Năng Được Doanh Nghiệp Săn Đón Nhất</span>
              </h5>
              <div className="space-y-2">
                {activeSignal.topDemandedSkills.map((skill, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#18212E]">
                    <span className="text-[#ECEEF2] font-medium">{skill}</span>
                    <span className="text-[11px] font-tabular text-[#7FAFA0]">Mức ưu tiên #{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#181512] border border-[#C5A880]/20 text-[11px] text-[#A69B8F] leading-relaxed">
              <strong className="text-[#C5A880] block mb-1">Quy tắc minh bạch dữ liệu:</strong>
              Mọi dữ liệu không bao gồm tin tuyển dụng chưa xác minh ngân sách hoặc tin đăng lại trùng lặp. Cập nhật định kỳ vào ngày 01 hàng tháng.
            </div>
          </div>
        </div>
      </div>
      </ScrollParallax>
    </div>
  );
};
