import React, { useState, useEffect } from 'react';

interface CompileIntroPreloaderProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

/**
 * Pier Gorelli Authentic Compile Intro Preloader
 * 3-Phase Animation:
 * Nhịp 1 (0s -> 1.2s): Vẽ nét chữ P và G bằng pathLength="1" & stroke-dashoffset từ 1 về 0 + đếm số 0% -> 100%
 * Nhịp 2 (1.2s -> 2.1s): Kéo màn trập mở trang với clip-path: inset(0 0 100% 0) cubic-bezier(0.77, 0, 0.175, 1)
 * Nhịp 3 (1.8s -> 2.8s): Wireframe Hero reveal
 */
export const CompileIntroPreloader: React.FC<CompileIntroPreloaderProps> = ({ 
  onComplete,
  forceShow = false 
}) => {
  const [percent, setPercent] = useState(0);
  const [isLifting, setIsLifting] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // If not forced and already seen in current session, bypass
    if (!forceShow) {
      const seen = sessionStorage.getItem('pier_gorelli_intro_seen');
      if (seen === 'true') {
        setIsHidden(true);
        if (onComplete) onComplete();
        return;
      }
    }

    setIsHidden(false);
    setIsLifting(false);
    setPercent(0);

    // Count up 0% -> 100% within 1100ms
    const startTimestamp = performance.now();
    const duration = 1100;

    const frameId = requestAnimationFrame(function updateCounter(now) {
      const elapsed = now - startTimestamp;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(eased * 100);
      setPercent(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        // At 1.2s trigger lift
        setTimeout(() => {
          setIsLifting(true);
          sessionStorage.setItem('pier_gorelli_intro_seen', 'true');
          // Complete after lift transition (0.9s)
          setTimeout(() => {
            setIsHidden(true);
            if (onComplete) onComplete();
          }, 950);
        }, 150);
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        setIsLifting(true);
        setTimeout(() => {
          setIsHidden(true);
          sessionStorage.setItem('pier_gorelli_intro_seen', 'true');
          if (onComplete) onComplete();
        }, 300);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [forceShow, onComplete]);

  if (isHidden) return null;

  return (
    <div 
      className={`preloader ${isLifting ? 'is-lifting' : ''}`}
      data-preloader
      aria-hidden="true"
      onClick={() => {
        setIsLifting(true);
        setTimeout(() => {
          setIsHidden(true);
          if (onComplete) onComplete();
        }, 400);
      }}
    >
      {/* Top Meta Header Note */}
      <div className="preloader__meta note">
        <span>Plotting nexora.vn / admission-navigator</span>
        <span>rev. 2026.NXR</span>
      </div>

      {/* Center Authentic Monogram SVG Logo: N X R */}
      <div className="flex flex-col items-center justify-center my-auto">
        <svg 
          className="monogram preloader__mark is-plotting w-32 sm:w-44 h-auto" 
          viewBox="0 0 102 40" 
          role="img" 
          aria-label="NEXORA NXR Monogram"
        >
          {/* Stroke N */}
          <path 
            className="monogram__n" 
            d="M6 35V5 L26 35 V5" 
            pathLength="1"
          />
          {/* Stroke X */}
          <path 
            className="monogram__x" 
            d="M36 5 L56 35 M56 5 L36 35" 
            pathLength="1"
          />
          {/* Stroke R */}
          <path 
            className="monogram__r" 
            d="M66 35V5 H78 a 7.5 7.5 0 0 1 0 15 H66 M73 20 L85 35" 
            pathLength="1"
          />
          {/* Dot in Neon Accent */}
          <circle 
            className="monogram__dot" 
            cx="93" 
            cy="34" 
            r="2.8"
          />
        </svg>

        {/* Technical subtitle */}
        <div className="text-xs font-mono font-bold tracking-widest text-[#C6F135] uppercase mt-4">
          NEXORA &middot; NXR ENGINE
        </div>
        <div className="text-[10px] font-mono tracking-widest text-[#777777] uppercase mt-1">
          ADMISSIONS AUDIT &middot; 300 UNIVERSITIES &middot; TT 06/2026
        </div>
      </div>

      {/* Bottom Meta Footer Note & Counter */}
      <div className="preloader__meta note flex items-center justify-between">
        <span className="text-[#555555]">Human + machine</span>
        <span className="preloader__count text-base font-bold text-[#0C0D0E]">
          {percent}%
        </span>
      </div>
    </div>
  );
};
