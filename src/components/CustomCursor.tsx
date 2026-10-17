import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../context/ThemeContext';

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();

  // State 1: Normal (Happy star-eyed) | State 2: Hover (Crying/Shocked face)
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isClicking, setIsClicking] = useState<boolean>(false);
  const [cursorText, setCursorText] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    const cursorEl = cursorRef.current;
    if (!cursorEl) return;

    // Track mouse position directly for ZERO lag
    let mouseX = -100;
    let mouseY = -100;
    let hasMoved = false;

    const updatePosition = (x: number, y: number) => {
      mouseX = x;
      mouseY = y;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!hasMoved) {
        hasMoved = true;
        setIsVisible(true);
        document.documentElement.classList.add('custom-cursor-enabled');
      }
      updatePosition(e.clientX, e.clientY);

      // Detect interactive target for State 2 (Crying/Shocked)
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest(
        'button, a, input, select, textarea, [data-magnetic], [data-cursor], .interactive-theme-card, [role="button"], label, [tabindex]:not([tabindex="-1"])'
      );

      if (interactive) {
        setIsHovering(true);
        const customText = interactive.getAttribute('data-cursor') || '';
        setCursorText(customText);
      } else {
        setIsHovering(false);
        setCursorText('');
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseLeave = () => {
      setIsVisible(false);
      document.documentElement.classList.remove('custom-cursor-enabled');
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
      document.documentElement.classList.add('custom-cursor-enabled');
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.documentElement.classList.remove('custom-cursor-enabled');
    };
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  // Normal blue color palette (no neon):
  // Accent Blue #2563EB, White features #FFFFFF, Soft Sky Blue tears #93C5FD
  const faceBg = '#2563EB';
  const faceStroke = '#0B0B0E';
  const featureColor = '#FFFFFF';
  const tearColor = '#93C5FD';

  return createPortal(
    <div
      ref={cursorRef}
      className="custom-cursor-wrapper fixed top-0 left-0 pointer-events-none select-none z-[99999]"
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    >
      <div
        className="relative flex items-start -translate-x-[2px] -translate-y-[2px]"
        style={{
          transform: `scale(${isClicking ? 0.86 : isHovering ? 1.18 : 1}) rotate(${
            isClicking ? '-6deg' : isHovering ? '-3deg' : '0deg'
          })`,
          transition: 'transform 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* SVG CURSOR CONTAINER - 2 DISTINCT STATES */}
        <div className="relative filter drop-shadow-md">
          {!isHovering ? (
            /* ========================================================
               STATE 1: HAPPY STAR-EYED GLITCH FACE (NORMAL NAVIGATION)
               ======================================================== */
            <svg
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible"
            >
              {/* Badge Silhouette with Top-Left Pointer Tip at (2, 2) */}
              <path
                d="M 2 2 L 12 5.5 C 14.5 4.5 17.5 3.8 20.5 3.8 C 29.5 3.8 36.5 10.8 36.5 19.8 C 36.5 28.8 29.5 35.8 20.5 35.8 C 11.5 35.8 4.5 28.8 4.5 19.8 C 4.5 16 5.8 12.5 8 9.5 Z"
                fill={faceBg}
                stroke={faceStroke}
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Top-Left Sharp Hotspot Notch Dot */}
              <circle cx="2" cy="2" r="1.5" fill={faceStroke} />

              {/* LEFT EYE: 4-Pointed Star (Sparkle) */}
              <path
                d="M 15 12 Q 15 16.5 12 16.5 Q 15 16.5 15 21 Q 15 16.5 18 16.5 Q 15 16.5 15 12 Z"
                fill={featureColor}
              />
              <circle cx="15" cy="16.5" r="0.8" fill={faceBg} />

              {/* RIGHT EYE: 4-Pointed Star (Sparkle) */}
              <path
                d="M 26 12 Q 26 16.5 23 16.5 Q 26 16.5 26 21 Q 26 16.5 29 16.5 Q 26 16.5 26 12 Z"
                fill={featureColor}
              />
              <circle cx="26" cy="16.5" r="0.8" fill={faceBg} />

              {/* Cute Cheek Blush Spots */}
              <ellipse cx="10" cy="21.5" rx="1.8" ry="1.2" fill={featureColor} opacity="0.35" />
              <ellipse cx="31" cy="21.5" rx="1.8" ry="1.2" fill={featureColor} opacity="0.35" />

              {/* HAPPY SMILE */}
              <path
                d="M 16 23.5 Q 20.5 28.5 25 23.5"
                stroke={featureColor}
                strokeWidth="2.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Subtle Tongue Accent */}
              <path
                d="M 18 25 Q 20.5 28 23 25 Z"
                fill={featureColor}
                opacity="0.3"
              />
            </svg>
          ) : (
            /* ========================================================
               STATE 2: CRYING / SHOCKED GLITCH EMOJI (HOVER / INTERACTION)
               ======================================================== */
            <svg
              width="42"
              height="44"
              viewBox="0 0 42 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="overflow-visible animate-[wiggle_0.4s_ease-in-out_infinite_alternate]"
            >
              {/* Badge Silhouette with Top-Left Pointer Tip at (2, 2) */}
              <path
                d="M 2 2 L 12 5.5 C 14.5 4.5 17.5 3.8 20.5 3.8 C 29.5 3.8 36.5 10.8 36.5 19.8 C 36.5 28.8 29.5 35.8 20.5 35.8 C 11.5 35.8 4.5 28.8 4.5 19.8 C 4.5 16 5.8 12.5 8 9.5 Z"
                fill={faceBg}
                stroke={faceStroke}
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* Hotspot Tip Dot */}
              <circle cx="2" cy="2" r="1.5" fill={faceStroke} />

              {/* CRYING / SHOCKED EYES: Crying Arch Curves */}
              <path
                d="M 11.5 17 Q 15 13.5 18.5 17"
                stroke={featureColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 22.5 17 Q 26 13.5 29.5 17"
                stroke={featureColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* LEFT TEAR STREAM: Flowing Down with Drop */}
              <path
                d="M 14 18 C 12.2 22 12 26.5 14.2 30 C 16.2 26.5 15.8 22 14.8 18 Z"
                fill={tearColor}
              />
              <ellipse cx="14" cy="34" rx="1.6" ry="2.2" fill={tearColor} />

              {/* RIGHT TEAR STREAM: Flowing Down with Drop */}
              <path
                d="M 27 18 C 25.2 22 25 26.5 27.2 30 C 29.2 26.5 28.8 22 27.8 18 Z"
                fill={tearColor}
              />
              <ellipse cx="27" cy="34.5" rx="1.6" ry="2.2" fill={tearColor} />

              {/* SHOCKED OPEN MOUTH (O) */}
              <ellipse
                cx="20.5"
                cy="26"
                rx="3.6"
                ry="4.8"
                fill={featureColor}
              />
              <ellipse
                cx="20.5"
                cy="26"
                rx="2"
                ry="3"
                fill={faceBg}
              />

              {/* SHOCK / ANXIETY GLITCH SWEAT DROP */}
              <path
                d="M 33 13 C 31.5 15 32 17.5 34 18 C 35.5 17.5 36 15 34.5 13 C 34 12 33.5 12 33 13 Z"
                fill={tearColor}
              />
            </svg>
          )}
        </div>

        {/* EDITORIAL MONOSPACE ACTION BADGE (IF DATA-CURSOR IS SET) */}
        {cursorText && (
          <div
            className="ml-2 mt-1 px-2 py-0.5 whitespace-nowrap select-none font-mono text-[10px] font-bold tracking-widest uppercase border"
            style={{
              backgroundColor: '#16161D',
              color: '#FFFFFF',
              borderColor: '#2563EB',
              borderRadius: '0px', // Strict Anti-AI: 0px brutalist sharp edge
            }}
          >
            {cursorText}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
