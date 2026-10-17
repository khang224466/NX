import React, { useEffect, useState } from 'react';

interface PageTransitionShutterProps {
  isActive: boolean;
  targetLabel: string;
  onAnimationMidpoint?: () => void;
  onAnimationComplete?: () => void;
}

/**
 * Pier Gorelli Authentic Page Transition (div.pt — Monogram Sheet & View Transitions)
 * Pha 1 (0s -> 0.45s): Quét màn trập che trang cũ, kéo 4 cột lưới, trượt .pt__stage, vẽ monogram + hiện tên trang đích
 * Midpoint: Hoán đổi nội dung route
 * Pha 2 (0.45s -> 0.9s): Rút màn trập lên để lộ trang mới
 */
export const PageTransitionShutter: React.FC<PageTransitionShutterProps> = ({
  isActive,
  targetLabel,
  onAnimationMidpoint,
  onAnimationComplete
}) => {
  const [phase, setPhase] = useState<'idle' | 'closing' | 'opening'>('idle');
  const [displayLabel, setDisplayLabel] = useState(targetLabel);

  useEffect(() => {
    if (isActive && phase === 'idle') {
      setDisplayLabel(targetLabel);
      setPhase('closing');

      // Midpoint: swap DOM when shutter is fully closed
      const midTimer = setTimeout(() => {
        if (onAnimationMidpoint) onAnimationMidpoint();
        setPhase('opening');
      }, 450);

      // Complete: hide shutter
      const completeTimer = setTimeout(() => {
        setPhase('idle');
        if (onAnimationComplete) onAnimationComplete();
      }, 950);

      return () => {
        clearTimeout(midTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isActive]);

  if (phase === 'idle') return null;

  return (
    <div 
      className={`pt-shutter ${
        phase === 'closing' ? 'is-closed' : 'is-open-top'
      }`}
      aria-hidden="true"
    >
      {/* 4 Vertical Columns in 12-Column Grid */}
      <div className="pt__cols">
        <span style={{ transform: phase === 'closing' ? 'scaleY(1)' : 'scaleY(0)', transitionDelay: '0.02s' }} />
        <span style={{ transform: phase === 'closing' ? 'scaleY(1)' : 'scaleY(0)', transitionDelay: '0.06s' }} />
        <span style={{ transform: phase === 'closing' ? 'scaleY(1)' : 'scaleY(0)', transitionDelay: '0.10s' }} />
        <span style={{ transform: phase === 'closing' ? 'scaleY(1)' : 'scaleY(0)', transitionDelay: '0.14s' }} />
      </div>

      {/* Top Meta Note */}
      <div className="preloader__meta note relative z-20">
        <span className="text-zinc-400">Plotting route</span>
        <span className="text-[var(--accent,#C6F135)]">rev. 2026</span>
      </div>

      {/* Center Stage & Monogram Bounding Box */}
      <div className="pt__stage z-20">
        <div className="pt__guide pt__guide--h1" />
        <div className="pt__guide pt__guide--h2" />

        <div className="pt__box">
          {/* Authentic Monogram SVG Logo: N X R */}
          <svg 
            className="monogram pt__mark w-28 sm:w-32 h-auto" 
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

          {/* Destination Route Name */}
          <div className="pt__to tracking-wider">
            {displayLabel}
          </div>

          <div className="pt__count">
            100% &middot; VIEW TRANSITION &middot; NXR
          </div>
        </div>
      </div>

      {/* Bottom Meta Note */}
      <div className="preloader__meta note relative z-20 flex items-center justify-between">
        <span className="text-zinc-500">View transition</span>
        <span className="text-zinc-400">NEXORA &middot; NXR ENGINE</span>
      </div>
    </div>
  );
};
