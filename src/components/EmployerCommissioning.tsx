import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  Award, 
  Users, 
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { EMPLOYER_ORDERS } from '../data/mockData';
import { EmployerOrder } from '../types';

import { sfx } from '../services/soundEffects';

export const EmployerCommissioning: React.FC = () => {
  const [selectedOrder, setSelectedOrder] = useState<EmployerOrder>(EMPLOYER_ORDERS[0]);
  const [activeTierFilter, setActiveTierFilter] = useState<string>('All');

  const tiers = [
    { id: 'Forecast', name: '1. Dự Báo (Forecast)', desc: 'Khai báo nhu cầu dài hạn, không ràng buộc pháp lý.' },
    { id: 'Reservation', name: '2. Đăng Ký (Reservation)', desc: 'Hợp tác khung với nhà trường theo tiêu chuẩn đầu ra.' },
    { id: 'Sponsorship', name: '3. Tài Trợ (Sponsorship)', desc: 'Tài trợ thiết bị, học bổng và chi phí xưởng thực hành.' },
    { id: 'Hiring commitment', name: '4. Cam Kết Tuyển (Hiring)', desc: 'Hợp đồng tuyển dụng có điều kiện mở, quyền từ chối thuộc về SV.' },
  ];

  const filteredOrders = EMPLOYER_ORDERS.filter(o => 
    activeTierFilter === 'All' ? true : o.commitmentTier === activeTierFilter
  );

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-8 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 text-xs font-tabular text-[#00F0FF] uppercase tracking-wider mb-2 font-bold">
          <Building2 className="w-4 h-4 text-[#00F0FF]" />
          <span>Phần V · Cơ Chế Doanh Nghiệp Đặt Hàng Nhân Lực</span>
        </div>
        <h2 className="font-syne font-black text-3xl sm:text-4xl text-[#ECEEF2]">
          Không Mua Sinh Viên — Đặt Hàng Năng Lực Đào Tạo
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#8E9BAE] max-w-3xl leading-relaxed">
          Mô hình kết nối nhu cầu tuyển dụng thực tế của doanh nghiệp với chương trình đào tạo của nhà trường, đảm bảo quyền tự do lựa chọn của người học.
        </p>
      </div>

      {/* 3 Core Inviolable Rules Callout with hover-jiggle */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl glass-surface border border-white/[0.07] hover-jiggle">
          <span className="text-[11px] font-syne uppercase tracking-wider text-[#00F0FF] block mb-1 font-bold">NGUYÊN TẮC 01</span>
          <h4 className="text-sm font-syne font-bold text-[#ECEEF2] mb-1.5">Dự báo không phải mệnh lệnh</h4>
          <p className="text-xs text-[#8E9BAE] leading-relaxed">
            Nhu cầu của doanh nghiệp có thể thay đổi sau 3–5 năm. Nhà trường tham khảo để điều chỉnh năng lực chứ không ép buộc chỉ tiêu cứng nhắc.
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-surface border border-white/[0.07] hover-jiggle">
          <span className="text-[11px] font-syne uppercase tracking-wider text-[#00FF88] block mb-1 font-bold">NGUYÊN TẮC 02</span>
          <h4 className="text-sm font-syne font-bold text-[#ECEEF2] mb-1.5">Doanh nghiệp không sở hữu sinh viên</h4>
          <p className="text-xs text-[#8E9BAE] leading-relaxed">
            Người học hoàn toàn giữ quyền lựa chọn, từ chối việc làm hoặc chuyển hướng ngành học mà không bị ràng buộc nô dịch.
          </p>
        </div>

        <div className="p-5 rounded-2xl glass-surface border border-white/[0.07] hover-jiggle">
          <span className="text-[11px] font-syne uppercase tracking-wider text-[#f59433] block mb-1 font-bold">NGUYÊN TẮC 03</span>
          <h4 className="text-sm font-syne font-bold text-[#ECEEF2] mb-1.5">Bảo toàn nền tảng cốt lõi</h4>
          <p className="text-xs text-[#8E9BAE] leading-relaxed">
            Không để một công ty biến trường học thành xưởng đào tạo hẹp của riêng họ. Sinh viên luôn được trang bị kiến thức nền vững chắc để thích ứng suốt đời.
          </p>
        </div>
      </div>

      {/* 4 Tiers of Commitment */}
      <div className="mt-10">
        <h3 className="text-base font-syne font-bold text-[#ECEEF2] mb-3">
          Bốn Cấp Độ Cam Kết Đặt Hàng Từ Doanh Nghiệp (Bấm để lọc)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => {
                sfx.playUiSelect();
                setActiveTierFilter(activeTierFilter === tier.id ? 'All' : tier.id);
              }}
              className={`p-4 rounded-2xl text-left border transition-all hover-jiggle cursor-pointer ${
                activeTierFilter === tier.id
                  ? 'bg-gradient-to-r from-[#f261ac]/20 to-[#835ad6]/20 border-white/40 shadow-lg ring-1 ring-[#f261ac]'
                  : 'glass-surface border-white/[0.06] hover:border-white/25'
              }`}
            >
              <h4 className="text-xs font-syne font-bold text-[#ECEEF2]">{tier.name}</h4>
              <p className="text-[11px] text-[#8E9BAE] mt-1">{tier.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Orders List & Active Detail */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-3">
          <h4 className="text-xs font-syne font-bold text-[#ECEEF2] uppercase tracking-wider mb-2">
            Danh Sách Đơn Đặt Hàng Năng Lực ({filteredOrders.length})
          </h4>
          {filteredOrders.map((order) => {
            const isSelected = selectedOrder.id === order.id;
            return (
              <div
                key={order.id}
                onClick={() => {
                  sfx.playUiSelect();
                  setSelectedOrder(order);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all hover-jiggle ${
                  isSelected
                    ? 'bg-white/10 border-[#00F0FF] shadow-lg ring-1 ring-[#00F0FF]/30'
                    : 'glass-surface border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-tabular text-[#8E9BAE]">{order.industry}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-tabular bg-[#1A251F] text-[#7FAFA0] border border-[#7FAFA0]/20">
                    {order.commitmentTier}
                  </span>
                </div>
                <h5 className="font-semibold text-xs text-[#ECEEF2] mb-1">{order.targetRole}</h5>
                <p className="text-[11px] text-[#8E9BAE]">{order.enterpriseName}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] pt-2 border-t border-white/[0.04]">
                  <span className="text-[#C5A880] font-tabular">Cần: {order.quantityNeeded} nhân sự</span>
                  <span className="text-[#8E9BAE]">{order.timelineYears} năm tới</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Order Detailed Contract Card */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-2xl bg-[#0E131A] border border-white/[0.08] space-y-6">
            <div className="border-b border-white/[0.06] pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-tabular text-[#7FAFA0] bg-[#12221C] px-2.5 py-1 rounded border border-[#7FAFA0]/20">
                  {selectedOrder.verifiedStatus} · Cấp độ: {selectedOrder.commitmentTier}
                </span>
                <span className="text-xs text-[#8E9BAE] font-tabular">Mã đơn: {selectedOrder.id}</span>
              </div>
              <h3 className="text-lg font-serif-luxury text-[#ECEEF2] font-semibold">
                {selectedOrder.targetRole}
              </h3>
              <p className="text-xs text-[#C5A880] mt-0.5 font-medium">
                Doanh nghiệp bảo trợ: {selectedOrder.enterpriseName}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#141A24]">
                <span className="text-[10px] text-[#8E9BAE] block">Quy mô chỉ tiêu:</span>
                <p className="font-tabular font-bold text-sm text-[#ECEEF2] mt-0.5">{selectedOrder.quantityNeeded} kỹ sư</p>
              </div>
              <div className="p-3 rounded-xl bg-[#141A24]">
                <span className="text-[10px] text-[#8E9BAE] block">Lương khởi điểm dự kiến:</span>
                <p className="font-tabular font-bold text-sm text-[#DFBA84] mt-0.5">{selectedOrder.expectedStartingSalary}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#141A24]">
                <span className="text-[10px] text-[#8E9BAE] block">Địa điểm làm việc:</span>
                <p className="font-semibold text-xs text-[#ECEEF2] mt-0.5">{selectedOrder.location}</p>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-semibold text-[#ECEEF2] mb-2">
                Yêu Cầu Năng Lực Thiết Yếu Được Đặt Hàng:
              </h5>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.essentialCompetencies.map((comp, idx) => (
                  <span key={idx} className="text-xs px-3 py-1.5 rounded-lg bg-[#18212E] text-[#ECEEF2] border border-white/[0.05]">
                    ✓ {comp}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#191512] border border-[#C5A880]/30 text-xs text-[#B5A492]">
              <div className="flex items-center gap-1.5 text-[#DFBA84] font-semibold mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>Khuôn Khổ Pháp Lý & Quyền Lợi Của Người Học:</span>
              </div>
              <p className="leading-relaxed">
                {selectedOrder.legalNotice}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
