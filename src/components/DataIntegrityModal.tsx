import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileText, Database, X, ExternalLink } from 'lucide-react';

interface DataIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataIntegrityModal: React.FC<DataIntegrityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const dataSources = [
    {
      domain: 'Quy chế tuyển sinh & Danh mục ngành',
      source: 'Bộ Giáo dục & Đào tạo (Thông tư 06/2026/TT-BGDĐT ban hành 15/02/2026 & Thông tư 74/2026/TT-BGDĐT)',
      status: 'Đã xác minh 100%',
      type: 'Văn bản quy phạm pháp luật'
    },
    {
      domain: 'Điểm chuẩn & Học phí các trường',
      source: 'Đề án tuyển sinh chính thức công bố của từng trường ĐH & CĐ năm 2024–2026',
      status: 'Đã xác minh theo đề án',
      type: 'Thông báo chính thức từ cơ sở đào tạo'
    },
    {
      domain: 'Tỷ lệ thất nghiệp & Lao động thanh niên',
      source: 'Cục Thống kê (GSO) — Thông cáo Báo chí Tình hình Lao động Việc làm Quý II/2026',
      status: 'Đã xác minh',
      type: 'Thống kê nhà nước'
    },
    {
      domain: 'Dải lương & Tín hiệu kỹ năng',
      source: 'Khảo sát Navigos/VietnamWorks, Báo cáo IT TopDev 2026, Hiệp hội Bán dẫn TP.HCM (HSIA), Hiệp hội Logistics VLA',
      status: 'Tín hiệu có nguồn phương pháp',
      type: 'Khảo sát thị trường độc lập'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0A0E15] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-[#8E9BAE] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-tabular text-[#7FAFA0] uppercase mb-2">
          <ShieldCheck className="w-4 h-4 text-[#7FAFA0]" />
          <span>Phần VIII · Nguyên Tắc Dữ Liệu & Thẩm Quyền Kiểm Chứng</span>
        </div>

        <h3 className="font-serif-luxury text-2xl sm:text-3xl text-[#ECEEF2]">
          Dữ Liệu Tốt Quan Trọng Hơn Giao Diện Đẹp
        </h3>

        <p className="mt-2 text-xs sm:text-sm text-[#8E9BAE] leading-relaxed">
          NEXORA tuân thủ cam kết minh bạch tuyệt đối: Không đưa ra số liệu lương hoặc điểm số không có nguồn xác minh. Mỗi bản ghi trên nền tảng đều đi kèm dấu thời gian và phân loại trạng thái tin cậy.
        </p>

        {/* 4 Confidence Tiers */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-[#13221C] border border-[#7FAFA0]/30 text-[#7FAFA0]">
            <strong className="block text-[11px] mb-0.5">1. Đã xác minh</strong>
            <span className="text-[10px] text-[#A6CDBF]">Văn bản chính thức của Bộ GDĐT & Trường.</span>
          </div>
          <div className="p-3 rounded-xl bg-[#19222E] border border-[#C5A880]/30 text-[#C5A880]">
            <strong className="block text-[11px] mb-0.5">2. Có nguồn hạn chế</strong>
            <span className="text-[10px] text-[#C0CAD9]">Khảo sát hiệp hội, có phương pháp rõ.</span>
          </div>
          <div className="p-3 rounded-xl bg-[#221C14] border border-[#DFBA84]/30 text-[#DFBA84]">
            <strong className="block text-[11px] mb-0.5">3. Dự báo (Forecast)</strong>
            <span className="text-[10px] text-[#D4C3AD]">Kịch bản 3-5 năm, có bất định công khai.</span>
          </div>
          <div className="p-3 rounded-xl bg-[#221515] border border-[#D97768]/30 text-[#D97768]">
            <strong className="block text-[11px] mb-0.5">4. Chưa xác minh</strong>
            <span className="text-[10px] text-[#E0A299]">Không dùng làm căn cứ quyết định lớn.</span>
          </div>
        </div>

        {/* Sources table */}
        <div className="mt-6 space-y-3">
          <h4 className="text-xs font-semibold text-[#ECEEF2] uppercase tracking-wider">
            Các Nguồn Dữ Liệu Nền Tảng Đang Sử Dụng
          </h4>
          <div className="space-y-2">
            {dataSources.map((s, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-[#0E131C] border border-white/[0.06] text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[#ECEEF2]">{s.domain}</span>
                  <span className="text-[10px] font-tabular text-[#7FAFA0] bg-[#14231E] px-2 py-0.5 rounded border border-[#7FAFA0]/20">
                    {s.status}
                  </span>
                </div>
                <p className="text-[#8E9BAE]">{s.source}</p>
                <span className="text-[10px] text-[#64748B] block mt-1 italic">Loại nguồn: {s.type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Schema */}
        <div className="mt-6 p-4 rounded-xl bg-[#080B10] border border-white/[0.05]">
          <h5 className="text-[11px] font-tabular text-[#C5A880] mb-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>CẤU TRÚC BẢN GHI DỮ LIỆU ĐƯỢC CHUẨN HÓA (DATA SCHEMA):</span>
          </h5>
          <code className="text-[11px] font-tabular text-[#8E9BAE] block leading-relaxed break-all">
            data_id · entity_id · field_name · value · unit · geographic_scope · time_period · published_at · verified_at · source_url · source_type · methodology · confidence_status
          </code>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#C5A880] text-[#07090D] font-bold text-xs hover:bg-[#D4B384]"
          >
            Đã Hiểu Nguyên Tắc
          </button>
        </div>
      </motion.div>
    </div>
  );
};
