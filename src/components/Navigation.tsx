import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ShieldCheck, 
  Menu, 
  X
} from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAICopilot: () => void;
  onOpenDataModal: () => void;
  hasApiKey: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAICopilot,
  onOpenDataModal,
  hasApiKey,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'omni', label: '✦ Ô Nhập Omni', shortLabel: 'Omni', badge: '01', desc: 'Giao diện hạt giống đơn nguyên & phân nhánh' },
    { id: 'tree', label: 'Bản Đồ Rễ Cây', shortLabel: 'Rễ Cây', badge: '02', desc: 'Khám phá 2 chiều theo rễ cây tự nhiên' },
    { id: 'discovery', label: 'Khám Phá Năng Lực', shortLabel: 'Khám Phá', badge: '03', desc: 'Trắc nghiệm hồ sơ đa tầng ROOT-1' },
    { id: 'combinations', label: 'Tổ Hợp & Tuyển Sinh', shortLabel: 'Tuyển Sinh 2026', badge: '04', desc: 'Tra cứu điểm chuẩn 2026 & vùng an toàn' },
    { id: 'majors-careers', label: 'Ngành & Nghề Nghiệp', shortLabel: 'Ngành Nghề', badge: '05', desc: 'So sánh mức lương thực tế và nhu cầu việc làm theo dữ liệu kiểm toán' },
  ];

  const currentPortalIndex = navItems.findIndex(item => item.id === currentTab);
  const activePortal = navItems[currentPortalIndex] || navItems[0];

  // Handle drawer Escape key to close
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleDrawerKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleDrawerKeyDown);
    return () => window.removeEventListener('keydown', handleDrawerKeyDown);
  }, [isMenuOpen]);

  return (
    <>
      {/* Sleek Minimalist Top Header (Clean blue accent, no arrow buttons, no theme toggle) */}
      <header className="sticky top-0 z-40 w-full bg-[var(--header-bg)] backdrop-blur-2xl border-b border-[var(--border-color)] transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between gap-4">
          {/* Brand Mark */}
          <div 
            onClick={() => setCurrentTab('omni')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            data-cursor="TRANG CHỦ"
          >
            <div className="w-8 h-8 rounded-none bg-[var(--bg-secondary)] border border-[var(--border-color)] group-hover:border-[var(--accent-primary)] flex items-center justify-center text-[var(--text-primary)] transition-colors duration-300">
              <span className="font-syne font-black text-xs tracking-tighter">NX</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-syne font-bold text-base tracking-tight text-[var(--text-primary)]">
                  NEXORA
                </span>
                <span className="text-[10px] font-tabular uppercase font-semibold px-2 py-0.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  Edition 2026
                </span>
              </div>
              <p className="text-[10px] font-tabular text-[var(--text-secondary)] tracking-tight hidden sm:block uppercase">
                Nền tảng hướng nghiệp · Tra cứu tuyển sinh có nguồn
              </p>
            </div>
          </div>

          {/* Major Portals Navigator (Direct clickable pills, no arrow buttons) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Desktop Full Portal Tablist */}
            <div 
              role="tablist"
              aria-label="Cổng thông tin chính"
              className="hidden lg:flex items-center p-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs"
            >
              {navItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    role="tab"
                    aria-selected={isActive}
                    data-cursor="PORTAL"
                    onClick={() => setCurrentTab(item.id)}
                    className={`px-3 py-1 rounded-full text-xs font-syne font-medium transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-bold shadow-sm'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {item.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Mobile / Tablet Compact Portal Indicator (No arrow buttons) */}
            <div 
              onClick={() => setIsMenuOpen(true)}
              className="flex lg:hidden items-center px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs cursor-pointer hover:border-[var(--accent-primary)] transition-colors"
              title="Nhấn để chọn cổng thông tin"
            >
              <span className="font-syne font-bold text-xs text-[var(--text-primary)] whitespace-nowrap flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-[var(--accent-primary)]">
                  {activePortal.badge}/08
                </span>
                <span>{activePortal.shortLabel}</span>
              </span>
            </div>
          </div>

          {/* Minimalist Top Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Data Principle Badge */}
            <button
              data-magnetic
              onClick={onOpenDataModal}
              title="Nguyên tắc Dữ liệu Thẩm định"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-all font-tabular cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>GSO Q2/2026</span>
            </button>

            {/* AI Copilot Button (No keyboard shortcut badge) */}
            <button
              data-magnetic
              data-cursor="COPILOT"
              onClick={onOpenAICopilot}
              title="Mở AI Copilot"
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer group"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              <span className="hidden sm:inline">AI Copilot</span>
              <span className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </button>

            {/* Menu Trigger Button */}
            <button
              data-magnetic
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--card-surface)] border border-[var(--border-color)] text-xs text-[var(--text-primary)] font-syne font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span className="hidden sm:inline">{isMenuOpen ? 'Đóng' : 'Tất Cả Module'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Fullscreen Editorial Drawer Menu when User clicks "Tất Cả Module" */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-12 overflow-y-auto text-[var(--text-primary)]"
          >
            <div className="flex items-center justify-between pb-8 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="font-syne font-black text-2xl text-[var(--text-primary)]">NEXORA</span>
                <span className="text-xs font-tabular text-[var(--accent-primary)] uppercase tracking-widest border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2.5 py-0.5 rounded-full font-bold">
                  Directory · 8 Modules
                </span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-3 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--card-surface)] border border-[var(--border-color)] text-[var(--text-primary)] transition-all cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Grid */}
            <div className="my-auto py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-[var(--border-color)] max-w-7xl mx-auto w-full">
              {navItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`p-7 rounded-none border-r border-b border-[var(--border-color)] transition-colors duration-500 cursor-pointer group ${
                    currentTab === item.id
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] ring-2 ring-[var(--accent-primary)]'
                      : 'bg-[var(--bg-primary)] hover:bg-[var(--text-primary)] text-[var(--text-primary)] hover:text-[var(--bg-primary)]'
                  }`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <div className="flex items-center justify-between text-xs font-tabular uppercase mb-3 opacity-80">
                    <span>MODULE {item.badge}</span>
                    <span className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300">↗</span>
                  </div>
                  <h4 className="font-syne font-semibold text-lg mb-2">
                    {item.label}
                  </h4>
                  <p className="text-xs opacity-75 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer inside menu */}
            <div className="pt-8 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-tabular text-[var(--text-secondary)]">
              <span>Căn cứ TT 06/2026/TT-BGDĐT & TT 74/2026/TT-BGDĐT</span>
              <button
                onClick={() => {
                  onOpenDataModal();
                  setIsMenuOpen(false);
                }}
                className="hover:text-[var(--accent-primary)] underline cursor-pointer"
              >
                Xem Nguyên Tắc Dữ Liệu →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
