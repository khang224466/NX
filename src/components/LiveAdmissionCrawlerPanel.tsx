import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, 
  RefreshCw, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Building2, 
  CheckCircle2, 
  History, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Calculator, 
  Sparkles,
  MapPin,
  BookOpen,
  School,
  TrendingUp,
  FileCheck2
} from 'lucide-react';
import { LiveAdmissionRecord } from '../types/admissionCrawler';
import { fetchLiveAdmissionRecords, syncSchoolAdmissionData } from '../services/admissionCrawlerService';
import { sfx } from '../services/soundEffects';
import { VERIFIED_UNIVERSITIES, VerifiedUniversity } from '../data/verifiedAdmissionDatabase';

interface LiveAdmissionCrawlerPanelProps {
  onOpenScoringInspector?: (uni: VerifiedUniversity) => void;
}

export const LiveAdmissionCrawlerPanel: React.FC<LiveAdmissionCrawlerPanelProps> = ({
  onOpenScoringInspector
}) => {
  const [records, setRecords] = useState<LiveAdmissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingSchool, setSyncingSchool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [customSchoolInput, setCustomSchoolInput] = useState<string>('');
  
  // Filters
  const [selectedLoaiTruong, setSelectedLoaiTruong] = useState<string>('ALL');
  const [selectedKhuVuc, setSelectedKhuVuc] = useState<string>('ALL');
  const [selectedMajorFilter, setSelectedMajorFilter] = useState<string>('ALL');
  const [selectedComboFilter, setSelectedComboFilter] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Expanded changelog drawers by school ID
  const [expandedChangelog, setExpandedChangelog] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLiveAdmissionRecords();
    setRecords(data);
    setLoading(false);
  };

  const handleSyncSchool = async (schoolName: string) => {
    if (!schoolName.trim()) return;
    sfx.play('click');
    setSyncingSchool(schoolName);
    try {
      const res = await syncSchoolAdmissionData(schoolName);
      if (res.success && res.allRecords) {
        setRecords(res.allRecords);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingSchool(null);
    }
  };

  const handleAddCustomSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSchoolInput.trim()) return;
    const target = customSchoolInput.trim();
    setCustomSchoolInput('');
    await handleSyncSchool(target);
  };

  const toggleChangelog = (id: string) => {
    sfx.play('click');
    setExpandedChangelog(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Quick school suggestions
  const quickSchools = [
    'Đại học Bách Khoa Hà Nội',
    'ĐH Bách Khoa TP.HCM',
    'ĐH Ngoại Thương',
    'ĐH Kinh tế Quốc dân',
    'ĐH Y Hà Nội',
    'ĐH Sư phạm Hà Nội',
    'ĐH Công nghệ Thông tin UIT',
    'ĐH Kinh tế TP.HCM UEH',
    'ĐH Bách Khoa Đà Nẵng',
    'ĐH Cần Thơ',
    'Học viện Bưu chính Viễn thông PTIT'
  ];

  // Filtering
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = r.truong.toLowerCase().includes(q);
        const matchesCode = r.ma_truong.toLowerCase().includes(q);
        const matchesMajor = r.diem_chuan.some(dc => dc.nganh.toLowerCase().includes(q));
        if (!matchesName && !matchesCode && !matchesMajor) return false;
      }

      // Loại trường
      if (selectedLoaiTruong !== 'ALL' && r.loai_truong !== selectedLoaiTruong) {
        return false;
      }

      // Khu vực
      if (selectedKhuVuc !== 'ALL' && r.khu_vuc !== selectedKhuVuc) {
        return false;
      }

      // Trạng thái
      if (selectedStatus !== 'ALL' && r.trang_thai !== selectedStatus) {
        return false;
      }

      // Ngành
      if (selectedMajorFilter !== 'ALL') {
        const qMajor = selectedMajorFilter.toLowerCase();
        const hasMajor = r.diem_chuan.some(dc => dc.nganh.toLowerCase().includes(qMajor));
        if (!hasMajor) return false;
      }

      // Tổ hợp
      if (selectedComboFilter !== 'ALL') {
        const qCombo = selectedComboFilter.toUpperCase();
        const hasCombo = r.diem_chuan.some(dc => dc.to_hop.toUpperCase().includes(qCombo));
        if (!hasCombo) return false;
      }

      return true;
    });
  }, [records, searchQuery, selectedLoaiTruong, selectedKhuVuc, selectedStatus, selectedMajorFilter, selectedComboFilter]);

  const majorWarnings = useMemo(() => {
    return records.filter(r => r.canh_bao_thay_doi);
  }, [records]);

  return (
    <div className="space-y-8">
      {/* ========================================================================= */}
      {/* 1. TOP LIVE CRAWLER HEADER & RADAR STATUS */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0C121E] via-[#0E1726] to-[#0A101A] border border-[#00F0FF]/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00F0FF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/40 text-[#00F0FF] text-[11px] font-tabular font-bold flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F0FF] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00F0FF]"></span>
                </span>
                LIVE CRAWLER STREAMING · THỜI GIAN THỰC (2024–2026)
              </span>
              <span className="text-[11px] font-tabular text-[#98C2B3] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                Ưu tiên 1: Website tuyển sinh chính thức (.edu.vn) & Cổng Bộ GD&ĐT
              </span>
            </div>

            <h2 className="font-serif-luxury text-2xl sm:text-3xl text-white font-bold">
              Hệ Thống Thu Thập & Cập Nhật Dữ Liệu Tuyển Sinh Trực Tiếp Từng Trường
            </h2>

            <p className="text-xs sm:text-sm text-[#8E9BAE] max-w-4xl leading-relaxed">
              Tự động quét, phân tích chỉ tiêu, điểm chuẩn 3 năm và công thức đề án của từng trường theo thời gian thực. Đối chiếu chéo tối thiểu 2 nguồn độc lập, tự động phát hiện và ghi lại lịch sử thay đổi (Diff) với nhãn <strong>OFFICIAL_VERIFIED</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => handleSyncSchool(quickSchools[0])}
              disabled={Boolean(syncingSchool)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00F0FF] via-[#3b63f5] to-[#835ad6] text-white font-syne font-bold text-xs uppercase tracking-wider hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncingSchool ? 'animate-spin' : ''}`} />
              <span>{syncingSchool ? 'Đang Thu Thập Dữ Liệu...' : 'Quét & Đồng Bộ Live 36+ Trường'}</span>
            </button>
          </div>
        </div>

        {/* CẢNH BÁO THAY ĐỔI LỚN BANNER */}
        {majorWarnings.length > 0 && (
          <div className="mt-5 p-4 rounded-2xl bg-[#1F1610] border border-[#FFB800]/40 flex items-start gap-3 text-xs text-[#E5D2BA]">
            <AlertTriangle className="w-5 h-5 text-[#FFB800] shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="font-bold text-[#FFB800] uppercase tracking-wide">
                Cảnh báo thay đổi lớn ({majorWarnings.length} trường có cập nhật mới quan trọng):
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#D8CFBF]">
                {majorWarnings.slice(0, 3).map((w, idx) => (
                  <li key={idx}>
                    <strong className="text-white">{w.truong}:</strong> {w.canh_bao_thay_doi}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. LIVE CRAWLER INPUT & QUICK SCHOOL CHIPS */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-2xl bg-[#0B0F17] border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:flex-1">
            <form onSubmit={handleAddCustomSchool} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8E9BAE] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Nhập tên trường hoặc mã để hệ thống tự động tìm & cập nhật chỉ tiêu (VD: Bưu chính PTIT, Y Hà Nội, Bách Khoa...)"
                  value={customSchoolInput}
                  onChange={(e) => setCustomSchoolInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121824] border border-white/10 text-xs text-white placeholder-[#8E9BAE] outline-none focus:border-[#00F0FF]"
                />
              </div>
              <button
                type="submit"
                disabled={Boolean(syncingSchool) || !customSchoolInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#00F0FF]/15 hover:bg-[#00F0FF]/25 border border-[#00F0FF]/40 text-[#00F0FF] font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer disabled:opacity-40"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tìm & Cập Nhật Live</span>
              </button>
            </form>
          </div>

          <div className="w-full md:w-64">
            <div className="relative">
              <Search className="w-4 h-4 text-[#8E9BAE] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Lọc nhanh danh sách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121824] border border-white/10 text-xs text-white placeholder-[#8E9BAE] outline-none focus:border-[#C5A880]"
              />
            </div>
          </div>
        </div>

        {/* Quick school chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06] text-xs">
          <span className="text-[#8E9BAE] text-[11px] font-semibold">Gợi ý đồng bộ nhanh:</span>
          {quickSchools.map((school, idx) => (
            <button
              key={idx}
              onClick={() => handleSyncSchool(school)}
              disabled={syncingSchool === school}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#ECEEF2] border border-white/[0.08] hover:border-[#00F0FF]/40 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <span>{school}</span>
              {syncingSchool === school && <RefreshCw className="w-3 h-3 animate-spin text-[#00F0FF]" />}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MULTI-FACETED FILTERS */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-[#0E1420] border border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Filter Loại trường */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8E9BAE] mb-1">
            Loại trường:
          </label>
          <select
            value={selectedLoaiTruong}
            onChange={(e) => setSelectedLoaiTruong(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-[#141B2B] border border-white/10 text-white outline-none focus:border-[#00F0FF]"
          >
            <option value="ALL">Tất cả loại trường</option>
            <option value="Đại học Quốc gia">Đại học Quốc gia</option>
            <option value="Đại học Công lập tự chủ">Đại học Công lập tự chủ</option>
            <option value="Đại học Công lập">Đại học Công lập</option>
            <option value="Trường Y Dược">Trường Y Dược</option>
            <option value="Trường Sư phạm">Trường Sư phạm</option>
            <option value="Đại học Tư thục">Đại học Tư thục</option>
          </select>
        </div>

        {/* Filter Khu vực */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8E9BAE] mb-1">
            Khu vực:
          </label>
          <select
            value={selectedKhuVuc}
            onChange={(e) => setSelectedKhuVuc(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-[#141B2B] border border-white/10 text-white outline-none focus:border-[#00F0FF]"
          >
            <option value="ALL">Toàn quốc (3 miền + ĐBSCL)</option>
            <option value="Bắc">Miền Bắc</option>
            <option value="Trung">Miền Trung</option>
            <option value="Nam">Miền Nam</option>
            <option value="ĐBSCL">Đồng bằng Sông Cửu Long</option>
          </select>
        </div>

        {/* Filter Ngành */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8E9BAE] mb-1">
            Nhóm Ngành:
          </label>
          <select
            value={selectedMajorFilter}
            onChange={(e) => setSelectedMajorFilter(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-[#141B2B] border border-white/10 text-white outline-none focus:border-[#00F0FF]"
          >
            <option value="ALL">Tất cả nhóm ngành</option>
            <option value="Máy tính">Khoa học Máy tính / CNTT / AI</option>
            <option value="Vi mạch">Thiết kế Vi mạch / Bán dẫn</option>
            <option value="Logistics">Logistics / Kinh tế Đối ngoại</option>
            <option value="Y khoa">Y khoa / Dược học / Răng Hàm Mặt</option>
            <option value="Sư phạm">Sư phạm / Giáo dục</option>
            <option value="Điều khiển">Tự động hóa / Cơ điện tử</option>
          </select>
        </div>

        {/* Filter Tổ hợp */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8E9BAE] mb-1">
            Tổ hợp môn:
          </label>
          <select
            value={selectedComboFilter}
            onChange={(e) => setSelectedComboFilter(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-[#141B2B] border border-white/10 text-white outline-none focus:border-[#00F0FF]"
          >
            <option value="ALL">Tất cả tổ hợp</option>
            <option value="A00">A00 (Toán, Lý, Hóa)</option>
            <option value="A01">A01 (Toán, Lý, Anh)</option>
            <option value="B00">B00 (Toán, Hóa, Sinh)</option>
            <option value="C00">C00 (Văn, Sử, Địa)</option>
            <option value="D01">D01 (Toán, Văn, Anh)</option>
            <option value="D07">D07 (Toán, Hóa, Anh)</option>
            <option value="K01">K01 (ĐGTD Bách Khoa)</option>
            <option value="Thang 100">Thang 100 (Tổng hợp QSB)</option>
          </select>
        </div>

        {/* Filter Trạng thái */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8E9BAE] mb-1">
            Trạng thái dữ liệu:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-2.5 py-2 rounded-xl bg-[#141B2B] border border-white/10 text-white outline-none focus:border-[#00F0FF]"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="chinh_thuc">Chính thức (Official)</option>
            <option value="du_kien">Dự kiến (Estimated)</option>
            <option value="can_kiem_tra">Cần kiểm tra (Pending)</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LIVE UNIVERSITIES LIST & REAL-TIME CARDS */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#8E9BAE]">
          <span>
            Hiển thị <strong className="text-white">{filteredRecords.length}</strong> trường đại học có dữ liệu live cập nhật
          </span>
          <span className="font-tabular text-[11px] text-[#00F0FF]">
            Tần suất rà soát: Hằng ngày trong mùa tuyển sinh
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#090D14] border border-white/10 space-y-3">
            <Building2 className="w-8 h-8 text-[#8E9BAE] mx-auto opacity-50" />
            <h3 className="text-base font-bold text-white">Không tìm thấy trường nào phù hợp với bộ lọc</h3>
            <p className="text-xs text-[#8E9BAE]">
              Thử đặt lại bộ lọc hoặc nhập tên trường ở ô trên để hệ thống tự động tìm và cập nhật dữ liệu trực tuyến.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredRecords.map((record) => {
              const isSyncingThis = syncingSchool === record.truong;
              const isChangelogOpen = expandedChangelog[record.id];
              const matchedVerifiedUni = VERIFIED_UNIVERSITIES.find(
                u => u.code.toLowerCase() === record.ma_truong.toLowerCase() ||
                     record.truong.toLowerCase().includes(u.code.toLowerCase())
              );

              return (
                <div
                  key={record.id}
                  className="p-6 rounded-3xl bg-[#0A0F18] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between shadow-xl relative overflow-hidden"
                >
                  {/* Newly updated badge banner */}
                  {record.is_newly_updated && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-[#00FF88]/20 to-transparent px-4 py-1 text-[10px] font-tabular font-bold text-[#00FF88] border-b border-l border-[#00FF88]/30 rounded-bl-xl">
                      MỚI CẬP NHẬT
                    </div>
                  )}

                  <div>
                    {/* Top Row: Meta badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] font-tabular font-bold text-[#ECEEF2]">
                        {record.ma_truong}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#00F0FF]/10 text-[11px] text-[#00F0FF] border border-[#00F0FF]/30">
                        {record.loai_truong}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] text-[#8E9BAE]">
                        Miền {record.khu_vuc}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        record.trang_thai === 'chinh_thuc' 
                          ? 'bg-[#00FF88]/10 text-[#00FF88] border border-[#00FF88]/30'
                          : record.trang_thai === 'du_kien'
                            ? 'bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/30'
                            : 'bg-[#FF4D4D]/10 text-[#FF4D4D] border border-[#FF4D4D]/30'
                      }`}>
                        {record.trang_thai === 'chinh_thuc' ? 'CHÍNH THỨC' : record.trang_thai === 'du_kien' ? 'DỰ KIẾN' : 'CẦN KIỂM TRA'}
                      </span>
                    </div>

                    {/* School Name */}
                    <h3 className="font-syne text-lg font-bold text-white mb-1.5 leading-snug">
                      {record.truong}
                    </h3>

                    {/* Timestamp of collection */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-tabular mb-4">
                      <Clock className="w-3.5 h-3.5 text-[#00F0FF]" />
                      <span>Cập nhật lúc: <strong className="text-[#A1A1AA]">{record.cap_nhat_luc}</strong></span>
                    </div>

                    {/* STATS: CHỈ TIÊU & SO SÁNH */}
                    <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-2xl bg-[#0E1524] border border-white/[0.05]">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8E9BAE] block">
                          Chỉ Tiêu Tuyển Sinh 2026:
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xl font-tabular font-black text-[#00F0FF]">
                            {record.chi_tieu.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-[11px] text-[#8E9BAE]">sinh viên</span>
                        </div>
                      </div>

                      <div className="border-l border-white/[0.06] pl-3">
                        <span className="text-[10px] uppercase font-bold text-[#8E9BAE] block">
                          So Với Năm Trước:
                        </span>
                        <div className="text-[12px] font-tabular font-bold mt-1 text-[#00FF88]">
                          {record.chi_tieu_nam_truoc ? (
                            record.chi_tieu > record.chi_tieu_nam_truoc ? (
                              `+${record.chi_tieu - record.chi_tieu_nam_truoc} chỉ tiêu`
                            ) : record.chi_tieu < record.chi_tieu_nam_truoc ? (
                              `-${record.chi_tieu_nam_truoc - record.chi_tieu} chỉ tiêu`
                            ) : 'Giữ nguyên ổn định'
                          ) : 'Chưa có số năm trước'}
                        </div>
                      </div>
                    </div>

                    {/* ĐIỂM CHUẨN 3 NĂM GẦN NHẤT (TABLE MINI) */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#C5A880] uppercase tracking-wide flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          Điểm chuẩn các ngành tiêu biểu (2024–2026):
                        </span>
                      </div>

                      <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#070B12]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/[0.03] text-[10px] uppercase font-bold text-[#8E9BAE] border-b border-white/[0.06]">
                            <tr>
                              <th className="py-2 px-3">Ngành Đào Tạo</th>
                              <th className="py-2 px-2">Tổ Hợp</th>
                              <th className="py-2 px-2 text-right">Năm</th>
                              <th className="py-2 px-3 text-right">Điểm Chuẩn</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.04]">
                            {record.diem_chuan.slice(0, 4).map((dc, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.02]">
                                <td className="py-2 px-3 font-medium text-white max-w-[180px] truncate">
                                  {dc.nganh}
                                </td>
                                <td className="py-2 px-2 font-tabular text-[#98C2B3]">
                                  {dc.to_hop}
                                </td>
                                <td className="py-2 px-2 font-tabular text-[#8E9BAE] text-right">
                                  {dc.nam}
                                </td>
                                <td className="py-2 px-3 font-tabular font-bold text-[#C5A880] text-right">
                                  {dc.diem.toFixed(2)}
                                  <span className="text-[10px] text-[#64748B] block font-normal">
                                    {dc.thang_diem || (dc.diem > 40 ? 'Thang 100' : 'Thang 30')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* HỌC PHÍ & ĐIỀU KIỆN ĐẦU VÀO */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs space-y-1.5 mb-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[#8E9BAE] shrink-0 font-medium">Học phí:</span>
                        <span className="text-white font-semibold text-right">{record.hoc_phi}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-white/[0.04]">
                        <span className="text-[#8E9BAE] shrink-0 font-medium">Điều kiện:</span>
                        <span className="text-[#C5A880] text-right">{record.dieu_kien}</span>
                      </div>
                      <div className="flex items-start justify-between gap-2 pt-1.5 border-t border-white/[0.04]">
                        <span className="text-[#8E9BAE] shrink-0 font-medium">Lịch thi/xét:</span>
                        <span className="text-[#A1A1AA] text-right">{record.lich_tuyen_sinh}</span>
                      </div>
                    </div>

                    {/* NGUỒN CHÍNH THỨC (.EDU.VN) */}
                    <div className="mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00F0FF] block mb-1.5">
                        🔗 Nguồn Dữ Liệu Kiểm Tra (.edu.vn / Đề Án):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {record.nguon.map((url, uidx) => (
                          <a
                            key={uidx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-[#94A3B8] hover:text-[#00F0FF] border border-white/10 transition-colors"
                          >
                            <span className="max-w-[240px] truncate">{url}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* LỊCH SỬ THAY ĐỔI (CHANGELOG) ACCORDION */}
                    {record.lich_su_thay_doi && record.lich_su_thay_doi.length > 0 && (
                      <div className="border border-white/[0.08] rounded-xl overflow-hidden mb-4">
                        <button
                          onClick={() => toggleChangelog(record.id)}
                          className="w-full px-3 py-2 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between text-xs text-[#8E9BAE] cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 font-medium">
                            <History className="w-3.5 h-3.5 text-[#00F0FF]" />
                            Lịch sử thay đổi ({record.lich_su_thay_doi.length} bản ghi diff)
                          </span>
                          {isChangelogOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {isChangelogOpen && (
                          <div className="p-3 bg-[#080C14] space-y-2 text-xs border-t border-white/[0.06]">
                            {record.lich_su_thay_doi.map((ch, cidx) => (
                              <div key={cidx} className="p-2 rounded-lg bg-white/[0.02] space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                                  <span>{ch.thoi_gian}</span>
                                  <span className="text-[#00F0FF]">Đã đối chiếu</span>
                                </div>
                                <p className="text-white font-medium text-[11px]">{ch.noi_dung}</p>
                                {ch.gia_tri_cu && ch.gia_tri_moi && (
                                  <div className="flex items-center gap-2 text-[10px] font-tabular">
                                    <span className="text-[#FF4D4D] line-through">{ch.gia_tri_cu}</span>
                                    <span>→</span>
                                    <span className="text-[#00FF88] font-bold">{ch.gia_tri_moi}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BOTTOM ACTION BUTTONS */}
                  <div className="pt-4 border-t border-white/[0.08] flex items-center gap-2">
                    <button
                      onClick={() => handleSyncSchool(record.truong)}
                      disabled={isSyncingThis}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin text-[#00F0FF]' : ''}`} />
                      <span>{isSyncingThis ? 'Đang cập nhật...' : 'Đồng bộ lại trường này'}</span>
                    </button>

                    {matchedVerifiedUni && onOpenScoringInspector && (
                      <button
                        onClick={() => onOpenScoringInspector(matchedVerifiedUni)}
                        className="py-2 px-3.5 rounded-xl bg-[#C5A880]/15 hover:bg-[#C5A880]/25 text-[#C5A880] border border-[#C5A880]/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Mở Máy Tính Điểm</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
