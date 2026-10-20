import React, { useEffect, useState, useRef } from 'react';
import { sfx } from '../services/soundEffects';
import { useTheme } from '../context/ThemeContext';
import { Bookmark } from 'lucide-react';

interface BlueprintHeaderRulerProps {
  currentTab: string;
  totalSections?: number;
  currentSectionIndex?: number;
  isGridActive?: boolean;
  onToggleGrid?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenAIChat: () => void;
  onTriggerIntro?: () => void;
  viewportSize?: { width: number; height: number };
  onNavigate?: (tab: any) => void;
  savedCount?: number;
  onOpenTestRunner?: () => void;
}

/**
 * NEXORA Header
 * - Monogram + Role: "NX. NEXORA / WEBSITE HỖ TRỢ HƯỚNG NGHIỆP"
 * - Minimal reading progress
 * - Real Theme toggle (◑)
 * - Interactive Web Audio synthesizer dot
 * - Signature white pill CTA button: "Tham vấn ngay"
 */
export const BlueprintHeaderRuler: React.FC<BlueprintHeaderRulerProps> = ({
  currentTab,
  totalSections = 10,
  currentSectionIndex = 1,
  isGridActive,
  onToggleGrid,
  onOpenCommandPalette,
  onOpenAIChat,
  onTriggerIntro,
  viewportSize = { width: 1440, height: 900 },
  onNavigate,
  savedCount,
  onOpenTestRunner
}) => {
  const { theme, toggleTheme, zoomLevel, zoomIn, zoomOut, setZoom } = useTheme();
  const isDarkMode = theme === 'dark';
  const progressFillRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);

  useEffect(() => {
    let ticking = false;

    const updateScrollDOM = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalScroll) * 100));
        if (progressFillRef.current) {
          progressFillRef.current.style.width = String(progress) + '%';
        }
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDOM);
        ticking = true;
      }
    };

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      handleScroll();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    updateScrollDOM();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <header className="w-full bg-[#111827] border-b border-slate-700 sticky top-0 z-50 text-sm select-none">
      <div className="h-0.5 w-full bg-[#262630]" aria-hidden="true">
        <div ref={progressFillRef} className="h-full bg-[#3B82F6] transition-[width] duration-150" style={{ width: '0%' }} />
      </div>

      {/* Consolidated 1 Single Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand Monogram & Role */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => {
              sfx.playUiHover();
              onNavigate?.('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <span className="font-bold text-white text-base sm:text-lg tracking-tight font-sans group-hover:text-[#60A5FA] transition-colors">
              NX.
            </span>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-[#D1D5DB] tracking-wider uppercase">
              <span className="font-semibold text-white">NEXORA</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-200 hidden sm:inline text-[11px] font-medium">WEBSITE HỖ TRỢ HƯỚNG NGHIỆP</span>
            </div>
          </button>
        </div>

        {/* Center: Consolidated Nav Tabs (01 Cố Vấn & Tuyển Sinh, 02 Tra Cứu Tổ Hợp, 03 Tra Cứu 300 Trường) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { id: 'home', num: '01', label: 'Cố Vấn & Tuyển Sinh' },
            { id: 'to-hop', num: '02', label: 'Tra Cứu Tổ Hợp' },
            { id: 'truong', num: '03', label: 'Tra Cứu 300 Trường' },
          ].map((tab) => {
            const isActive = currentTab === tab.id || (tab.id === 'to-hop' && (currentTab === 'to-hop-detail' || currentTab === 'to-hop')) || (tab.id === 'truong' && (currentTab === 'truong-detail' || currentTab === 'truong'));
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sfx.playUiSelect();
                  onNavigate?.(tab.id);
                }}
                className={`px-3 py-1.5 whitespace-nowrap text-xs transition-all duration-200 rounded-full flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-900/40 text-white border border-blue-500 font-semibold'
                    : 'bg-transparent text-slate-200 hover:text-white border border-transparent hover:border-[#262630] font-medium'
                }`}
              >
                <span className={`text-[10px] ${isActive ? 'text-[#60A5FA] font-bold' : 'text-slate-400 font-semibold'}`}>
                  {tab.num}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Controls: Saved Counter, Theme (◑), Audio Dot (●), and Signature White Pill Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {savedCount !== undefined && savedCount > 0 && (
            <button
              onClick={() => onNavigate?.('so-sanh')}
              className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-[#EAEAE3] hover:text-[#60A5FA] transition-colors cursor-pointer mr-1"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#3B82F6]" />
              <span>Đã lưu ({savedCount})</span>
            </button>
          )}

          {/* 1. Interactive UI Zoom Pill */}
          <div 
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-[#262630] hover:border-[#3B82F6]/60 bg-[#121316] text-[#D1D5DB] text-[10px] font-mono transition-colors"
            title="Tùy chỉnh tỷ lệ phóng to giao diện"
          >
            <button 
              onClick={() => {
                sfx.playUiClick();
                zoomOut();
              }}
              title="Thu nhỏ giao diện (-5%)"
              className="w-4 h-4 rounded flex items-center justify-center hover:bg-[#262630] hover:text-white transition-colors cursor-pointer select-none text-[12px] leading-none"
            >
              −
            </button>
            <button
              onClick={() => {
                sfx.playUiClick();
                setZoom(1.0);
              }}
              title="Bấm để đặt lại về 100% mặc định"
              className="px-1 font-semibold text-[#60A5FA] hover:underline cursor-pointer select-none text-[11px]"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button 
              onClick={() => {
                sfx.playUiClick();
                zoomIn();
              }}
              title="Phóng to giao diện (+5%)"
              className="w-4 h-4 rounded flex items-center justify-center hover:bg-[#262630] hover:text-white transition-colors cursor-pointer select-none text-[12px] leading-none"
            >
              +
            </button>
          </div>

          {/* 2. Theme toggle circle icon (◑) */}
          <button
            onClick={() => {
              sfx.playUiClick();
              toggleTheme();
            }}
            title={isDarkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            className="w-7 h-7 rounded-full border border-[#262630] hover:border-[#60A5FA] bg-[#121316] text-[#D1D5DB] hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            {isDarkMode ? '◑' : '◐'}
          </button>

          {/* 4. Signature White Pill Button */}
          <button
            onClick={() => {
              sfx.playActionSuccess();
              onOpenAIChat();
            }}
            className="px-3.5 sm:px-4 py-1.5 rounded-full bg-white text-[#07080B] hover:bg-[#E4E4E7] font-sans font-semibold text-xs tracking-tight transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Tham vấn ngay</span>
          </button>
        </div>
      </div>
    </header>
  );
};
