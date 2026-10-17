import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Layers, 
  Calculator, 
  Building2, 
  GraduationCap, 
  BookOpen, 
  DollarSign, 
  MapPin, 
  Scale, 
  FileText, 
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { AUDITED_INSTITUTIONS_300 } from '../data/auditedInstitutionsData';
import { VERIFIED_COMBINATIONS_219 } from '../data/verifiedAdmissionDatabase';

interface BlueprintCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (route: string, param?: string) => void;
  onOpenAIChat: (query?: string) => void;
  onToggleGrid: () => void;
  onTriggerIntro?: () => void;
}

export const BlueprintCommandPalette: React.FC<BlueprintCommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenAIChat,
  onToggleGrid,
  onTriggerIntro
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Route matches
  const routeOptions = [
    { id: 'home', route: '/', label: 'Trang Chủ', desc: 'Hero, 4 lối vào chính, tổng quan tuyển sinh 2026', icon: BookOpen },
    { id: 'motion-suite', route: '/motion-suite', label: '◆ Motion & Micro-interactions Suite', desc: '8 hiệu ứng Pier Gorelli: Token stream, 3-tier view, 1/12th peek, Terminal CLI, Bezier Expo, BRIEF.JSON', icon: Sparkles },
    { id: 'to-hop', route: '/to-hop', label: 'Danh Mục Tổ Hợp', desc: 'Tra cứu 54+ mã tổ hợp chuẩn hóa Root-to-Leaf', icon: Layers },
    { id: 'nganh', route: '/nganh', label: 'Khám Phá Ngành Học', desc: 'Lọc ngành theo 8 lĩnh vực, tổ hợp, học phí', icon: GraduationCap },
    { id: 'truong', route: '/truong', label: 'Hồ Sơ 300 Trường ĐH', desc: 'Tra cứu đề án tuyển sinh, học phí, cơ sở', icon: Building2 },
    { id: 'tinh-diem', route: '/tinh-diem', label: 'Máy Tính Điểm Xét Tuyển', desc: '6 bước tính điểm chuẩn xác 22 họ công thức', icon: Calculator },
    { id: 'diem-chuan', route: '/diem-chuan', label: 'Điểm Chuẩn Lịch Sử', desc: 'Phân tách thang 30, 40, 100, 1200, 130', icon: Scale },
    { id: 'hoc-phi', route: '/hoc-phi', label: 'Học Phí & Chi Phí', desc: 'Lọc theo ngân sách, chương trình, tách sinh hoạt phí', icon: DollarSign },
    { id: 'ban-do', route: '/ban-do', label: 'Bản Đồ Cơ Sở Đào Tạo', desc: 'Xác định địa chỉ thực tế (trụ sở vs phân hiệu)', icon: MapPin },
    { id: 'so-sanh', route: '/so-sanh', label: 'So Sánh & Kế Hoạch', desc: 'Bảng đối chiếu đa trường, lưu hồ sơ cá nhân', icon: Scale },
    { id: 'nguon-du-lieu', route: '/nguon-du-lieu', label: 'Minh Bạch Nguồn Gốc', desc: '28 nguồn pháp lý (SRC_001..028) & 37 lỗi sửa sai', icon: FileText }
  ];

  const filteredRoutes = routeOptions.filter(r => 
    !q || r.label.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q)
  );

  // Combination matches
  const filteredCombos = VERIFIED_COMBINATIONS_219.filter(c => 
    c.code.toLowerCase().includes(q) || 
    c.name.toLowerCase().includes(q) || 
    c.subjects.some(s => s.toLowerCase().includes(q))
  ).slice(0, 6);

  // University matches
  const filteredUnis = AUDITED_INSTITUTIONS_300.filter(u => 
    (u.code || u.institution_code).toLowerCase().includes(q) || 
    u.official_name.toLowerCase().includes(q) || 
    u.verified_province_city.toLowerCase().includes(q)
  ).slice(0, 6);

  return (
    <div className="fixed inset-0 z-[999999] bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div 
        className="w-full max-w-2xl bg-[#0C0D0E] border border-[#262630] text-[#EAEAE3] shadow-2xl rounded-xs overflow-hidden flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#262630] bg-[#141518]">
          <Search className="w-5 h-5 text-[#C6F135]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tổ hợp (A00, A01), trường (BKA, KHA), ngành, tính điểm... [Esc để đóng]"
            className="flex-1 bg-transparent border-none text-[#FFFFFF] placeholder-[#777777] text-sm focus:outline-none font-mono"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#888888] hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono text-[#888888] px-1.5 py-0.5 border border-[#262630]">
            ESC
          </span>
        </div>

        {/* Quick Actions row */}
        <div className="px-4 py-2 bg-[#0E0F12] border-b border-[#1c1d22] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#888888] gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onToggleGrid();
                onClose();
              }}
              className="hover:text-[var(--accent,#C6F135)] transition-colors"
            >
              [⌥G] Lưới
            </button>
            <span>·</span>
            {onTriggerIntro && (
              <>
                <button
                  onClick={() => {
                    onTriggerIntro();
                    onClose();
                  }}
                  className="hover:text-[var(--accent,#C6F135)] transition-colors"
                >
                  Compile Intro
                </button>
                <span>·</span>
              </>
            )}
            <button
              onClick={() => {
                onOpenAIChat(query);
                onClose();
              }}
              className="text-[#60A5FA] hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-[var(--accent,#C6F135)]" />
              Hỏi AI "{query || 'tuyển sinh'}"
            </button>
          </div>

          {/* Quick Accent dots */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#666]">Accent:</span>
            {[
              { code: '#C6F135', title: 'Neon Lime' },
              { code: '#38BDF8', title: 'Sky Technical' },
              { code: '#FB923C', title: 'Safety Orange' },
              { code: '#F472B6', title: 'Cyberpunk Pink' },
              { code: '#A78BFA', title: 'Electric Violet' }
            ].map(col => (
              <button
                key={col.code}
                onClick={() => {
                  document.documentElement.style.setProperty('--accent', col.code);
                  document.documentElement.style.setProperty('--accent-glow', `${col.code}33`);
                }}
                title={col.title}
                className="w-3 h-3 rounded-full border border-white/20 hover:scale-125 transition-transform cursor-pointer"
                style={{ backgroundColor: col.code }}
              />
            ))}
          </div>
        </div>


        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-[#1c1d22] p-2 space-y-3">
          {/* 1. Routes / Trang hệ thống */}
          {filteredRoutes.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#888888] tracking-wider">
                ĐIỀU HƯỚNG TRANG & CÔNG CỤ
              </div>
              <div className="space-y-1 mt-1">
                {filteredRoutes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xs hover:bg-[#1a1b22] hover:border-l-2 hover:border-[#C6F135] flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#C6F135] group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="text-xs font-medium text-white">{item.label}</div>
                          <div className="text-[11px] text-[#888888]">{item.desc}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#555555] group-hover:text-[#C6F135] transition-colors" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Combinations */}
          {filteredCombos.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#888888] tracking-wider">
                MÃ TỔ HỢP XÉT TUYỂN
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                {filteredCombos.map((combo) => (
                  <button
                    key={combo.code}
                    onClick={() => {
                      onNavigate('to-hop-detail', combo.code);
                      onClose();
                    }}
                    className="text-left p-2.5 bg-[#121316] hover:bg-[#181920] border border-[#22232a] hover:border-[#3b82f6] rounded-xs group transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-[#C6F135]">{combo.code}</span>
                      <span className="text-[10px] font-mono text-[#888888]">
                        {combo.subjects.length} môn
                      </span>
                    </div>
                    <div className="text-xs text-[#EAEAE3] truncate mt-0.5">{combo.name}</div>
                    <div className="text-[10px] text-[#888888] mt-1">
                      {combo.subjects.join(' · ')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Universities */}
          {filteredUnis.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#888888] tracking-wider">
                CƠ SỞ ĐÀO TẠO & HỌC VIỆN
              </div>
              <div className="space-y-1 mt-1">
                {filteredUnis.map((uni) => (
                  <button
                    key={uni.code}
                    onClick={() => {
                      onNavigate('truong-detail', uni.code);
                      onClose();
                    }}
                    className="w-full text-left p-2 bg-[#121316] hover:bg-[#181920] border border-[#22232a] hover:border-[#C6F135] rounded-xs flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#60A5FA] bg-[#2563EB]/15 border border-[#3B82F6]/30 px-1.5 py-0.5">
                        {uni.code}
                      </span>
                      <div>
                        <div className="text-xs text-white font-medium">{uni.official_name}</div>
                        <div className="text-[10px] text-[#888888]">
                          {uni.verified_province_city} · {uni.primary_sector}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#C6F135]">
                      Xem hồ sơ →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#262630] bg-[#0E0F12] flex items-center justify-between text-[10px] font-mono text-[#777777]">
          <span>Dùng phím ↑ ↓ để duyệt · Nhấn Enter để chọn</span>
          <span className="text-[#C6F135]">NEXORA · 2026</span>
        </div>
      </div>
    </div>
  );
};
