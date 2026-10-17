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
}

/**
 * Technical Blueprint Header Ruler
 * - Monogram + Role: "NX. NEXORA / WEBSITE HỖ TRỢ HƯỚNG NGHIỆP"
 * - High-precision tick scroll ruler
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
  savedCount
}) => {
  const { theme, toggleTheme, zoomLevel, zoomIn, zoomOut, setZoom } = useTheme();
  const isDarkMode = theme === 'dark';
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressBadgeRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  useEffect(() => {
    let ticking = false;

    const updateScrollDOM = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalScroll) * 100));
        const rounded = Math.round(progress);
        if (progressFillRef.current) {
          progressFillRef.current.style.width = `${progress}%`;
        }
        if (progressBadgeRef.current) {
          progressBadgeRef.current.style.left = `${Math.max(2, Math.min(98, progress))}%`;
          progressBadgeRef.current.textContent = `${rounded}%`;
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

  const handleToggleAudio = () => {
    const nextState = !isAudioMuted;
    setIsAudioMuted(nextState);
    sfx.setMuted(nextState);
    if (!nextState) {
      sfx.playUiSelect();
    }
  };


  return (
    <header className="w-full bg-[#07080B]/90 border-b border-[#262630]/80 backdrop-blur-md sticky top-0 z-50 text-[11px] font-mono select-none">
      {/* Precision Scroll Tick Ruler Bar */}
      <div className="relative w-full h-2.5 border-b border-[#1c1d22]/80 overflow-hidden flex items-end">
        {/* Progress indicator fill */}
        <div 
          ref={progressFillRef}
          className="absolute top-0 left-0 bottom-0 bg-[#3B82F6]/30 border-r border-[#60A5FA] pointer-events-none"
          style={{ width: '0%' }}
        />
        {/* Metric tick lines */}
        <div className="w-full flex justify-between px-2 items-end h-full opacity-35">
          {Array.from({ length: 48 }).map((_, i) => (
            <div 
              key={i} 
              className={`w-[1px] bg-[#EAEAE3] ${i % 6 === 0 ? 'h-2 opacity-90' : 'h-1 opacity-25'}`} 
            />
          ))}
        </div>
        {/* Floating progress badge */}
        <div 
          ref={progressBadgeRef}
          className="absolute top-0 -translate-x-1/2 bg-[#3B82F6] text-white font-bold text-[8px] px-1 py-0.2 rounded-xs shadow-xs pointer-events-none"
          style={{ left: '2%' }}
        >
          0%
        </div>
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
              <span className="text-[#64748B]">/</span>
              <span className="text-[#94A3B8] hidden sm:inline text-[11px]">WEBSITE HỖ TRỢ HƯỚNG NGHIỆP</span>
            </div>
          </button>
        </div>

        {/* Center: Consolidated Nav Tabs (01 Trang Chủ, 02 Tổ Hợp Môn) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {[
            { id: 'home', num: '01', label: 'Trang Chủ' },
            { id: 'to-hop', num: '02', label: 'Tổ Hợp Môn' },
          ].map((tab) => {
            const isActive = currentTab === tab.id || (tab.id === 'to-hop' && (currentTab === 'to-hop-detail' || currentTab === 'to-hop'));
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sfx.playUiSelect();
                  onNavigate?.(tab.id);
                }}
                className={`px-3 py-1.5 whitespace-nowrap text-xs transition-all duration-200 rounded-full flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#3B82F6]/20 text-white border border-[#3B82F6] font-semibold shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                    : 'bg-transparent text-[#94A3B8] hover:text-white border border-transparent hover:border-[#262630]'
                }`}
              >
                <span className={`text-[10px] ${isActive ? 'text-[#60A5FA] font-bold' : 'text-[#64748B]'}`}>
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
                // Toggle between standard 125% and 135%
                setZoom(Math.round(zoomLevel * 100) === 135 ? 1.25 : 1.35);
              }}
              title="Bấm để đổi nhanh giữa 125% và 135%"
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

          {/* 2. Interactive Audio Dot */}
          <button
            onClick={handleToggleAudio}
            title={isAudioMuted ? 'Bật âm thanh hiệu ứng' : 'Tắt âm thanh hiệu ứng'}
            className="w-7 h-7 rounded-full border border-[#262630] hover:border-[#60A5FA] bg-[#121316] flex items-center justify-center transition-colors relative cursor-pointer group"
          >
            <span 
              className={`w-2 h-2 rounded-full transition-transform ${
                isAudioMuted 
                  ? 'bg-[#64748B]' 
                  : 'bg-[#3B82F6] shadow-[0_0_8px_#3B82F6]'
              }`} 
            />
            {!isAudioMuted && (
              <span className="absolute inset-0 rounded-full border border-[#3B82F6]/40 animate-ping pointer-events-none" />
            )}
          </button>

          {/* 3. Signature White Pill Button */}
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
