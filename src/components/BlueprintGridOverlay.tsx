import React, { useEffect } from 'react';

interface BlueprintGridOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Technical 12-Column Blueprint Grid Overlay
 * Displays wireframe grid lines, column numbers [01]–[12], and gutter markings
 * matching Pier Gorelli's technical drawing layout (Image 2 & 3).
 */
export const BlueprintGridOverlay: React.FC<BlueprintGridOverlayProps> = ({
  isVisible,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Alt+G (⌥G) or Cmd+G (⌘G) or Ctrl+G
      if ((e.altKey && e.code === 'KeyG') || ((e.metaKey || e.ctrlKey) && e.code === 'KeyG')) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {/* 12-Column Grid Container */}
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 grid grid-cols-12 gap-3 sm:gap-6 relative">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i}
            className="h-full border-x border-[#3b82f6]/15 bg-[#3b82f6]/[0.02] relative flex flex-col justify-between py-4"
          >
            {/* Top Column Number */}
            <div className="text-[9px] font-mono text-[#3b82f6]/60 pl-1">
              COL_{String(i + 1).padStart(2, '0')}
            </div>

            {/* Mid guide crosshair */}
            <div className="w-full h-[1px] bg-[#3b82f6]/10 relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#3b82f6]/40">
                +
              </span>
            </div>

            {/* Bottom column width info */}
            <div className="text-[8px] font-mono text-[#3b82f6]/50 pl-1">
              ↤ 1/12 ↦
            </div>
          </div>
        ))}
      </div>

      {/* Floating Blueprint Badge */}
      <div className="fixed bottom-6 right-6 pointer-events-auto bg-[#0C0D0E]/95 border border-[#C6F135] text-[#C6F135] px-3 py-1.5 text-xs font-mono shadow-2xl flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#C6F135] animate-ping" />
        <span>LƯỚI BẢN VẼ 12 CỘT: ĐANG BẬT</span>
        <button
          onClick={onClose}
          className="ml-2 underline hover:text-white"
        >
          [Tắt ⌥G]
        </button>
      </div>
    </div>
  );
};
