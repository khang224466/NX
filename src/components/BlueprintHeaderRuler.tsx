import React, { useEffect, useState, useRef } from 'react';
import { sfx } from '../services/soundEffects';

interface BlueprintHeaderRulerProps {
  currentTab: string;
  totalSections?: number;
  currentSectionIndex?: number;
  isGridActive: boolean;
  onToggleGrid: () => void;
  onOpenCommandPalette: () => void;
  onOpenAIChat: () => void;
  onTriggerIntro?: () => void;
  viewportSize?: { width: number; height: number };
}

/**
 * Technical Blueprint Header Ruler (Exact Pier Gorelli Header Match)
 * - Monogram + Role: "NX. NEXORA / CAREER & ADMISSION ARCHITECTURE"
 * - High-precision tick scroll ruler
 * - Theme toggle (◑)
 * - Interactive Web Audio synthesizer dot (blue pulse) with live audio clicks
 * - Command shortcut badge (⌘K)
 * - Signature white pill CTA button: "Tham vấn ngay" (Let's talk replica)
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
  viewportSize = { width: 1440, height: 900 }
}) => {
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressBadgeRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1440);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

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

  const handleToggleTheme = () => {
    sfx.playUiHover();
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
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

      {/* Main Header Row (Matches Pier Gorelli top navigation in Image 1) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between gap-4">
        {/* Left: Brand Monogram & Role */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              sfx.playUiHover();
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
              <span className="text-[#94A3B8] hidden sm:inline text-[11px]">CỔNG TUYỂN SINH QUỐC GIA 2026</span>
            </div>
          </button>
        </div>

        {/* Center: Live Bounding Box Metrics */}
        <div className="hidden xl:flex items-center gap-3 text-[#94A3B8] text-[10px] font-mono">
          <span className="text-[#60A5FA] font-bold">
            [{String(currentSectionIndex).padStart(2, '0')}/{String(totalSections).padStart(2, '0')}]
          </span>
          <span className="text-[#475569]">·</span>
          <span className="font-medium text-[#CBD5E1]">THÔNG TƯ 06 &amp; 74/2026/TT-BGDĐT</span>
        </div>

        {/* Right Controls: Theme (◑), Audio Dot (●), and Signature White Pill Button */}
        <div className="flex items-center gap-3">
          {/* 1. Theme toggle circle icon (◑) */}
          <button
            onClick={handleToggleTheme}
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
            className="px-4 py-1.5 rounded-full bg-white text-[#07080B] hover:bg-[#E4E4E7] font-sans font-semibold text-xs tracking-tight transition-transform duration-200 hover:scale-[1.04] active:scale-[0.98] shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <span>Tham vấn ngay</span>
          </button>
        </div>
      </div>
    </header>
  );
};
