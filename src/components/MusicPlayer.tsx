import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Volume2, 
  Music, 
  Disc, 
  ChevronDown, 
  Radio,
  Minimize2,
  Maximize2,
  Flame,
  Repeat
} from 'lucide-react';
import { musicEngine, AUDIO_THEMES, AudioTheme } from '../services/musicEngine';
import { sfx } from '../services/soundEffects';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(musicEngine.getIsPlaying());
  const [currentTheme, setCurrentTheme] = useState<AudioTheme>(musicEngine.getCurrentTheme());
  const [volume, setVolume] = useState(musicEngine.getVolume());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const ytPlayerRef = useRef<any>(null);

  // Initialize YouTube Iframe Player API with infinite loop configuration
  useEffect(() => {
    let isMounted = true;

    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (ytPlayerRef.current) return;

      const activeVideoId = currentTheme.youtubeId || 'JMTMew45PN4';

      try {
        ytPlayerRef.current = new window.YT.Player('nexora-yt-audio-player', {
          height: '120',
          width: '120',
          videoId: activeVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            loop: 1,
            playlist: activeVideoId, // Required by YouTube API to enable infinite loop
            playsinline: 1,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              event.target.setVolume(Math.round(musicEngine.getVolume() * 100));
              if (typeof event.target.setLoop === 'function') {
                event.target.setLoop(true);
              }
              if (musicEngine.getIsPlaying()) {
                event.target.playVideo();
              }
            },
            onStateChange: (event: any) => {
              // Guaranteed Infinite Loop: immediately seek to 0:00 and replay when track finishes
              if (window.YT && event.data === window.YT.PlayerState.ENDED) {
                try {
                  event.target.seekTo(0);
                  event.target.playVideo();
                } catch {}
              }
            },
          },
        });
      } catch {}
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        setupPlayer();
      };
    }

    // Register YouTube controller bridge with musicEngine
    musicEngine.registerYoutubeController({
      play: () => {
        try {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
            ytPlayerRef.current.playVideo();
          }
        } catch {}
      },
      pause: () => {
        try {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
            ytPlayerRef.current.pauseVideo();
          }
        } catch {}
      },
      load: (id: string) => {
        try {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
            ytPlayerRef.current.loadVideoById({
              videoId: id,
              startSeconds: 0,
            });
            if (typeof ytPlayerRef.current.setLoop === 'function') {
              ytPlayerRef.current.setLoop(true);
            }
          }
        } catch {}
      },
      setVolume: (vol: number) => {
        try {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
            ytPlayerRef.current.setVolume(Math.round(vol * 100));
          }
        } catch {}
      },
    });

    const unsub = musicEngine.subscribe(() => {
      if (!isMounted) return;
      setIsPlaying(musicEngine.getIsPlaying());
      setCurrentTheme(musicEngine.getCurrentTheme());
      setVolume(musicEngine.getVolume());
    });

    return () => {
      isMounted = false;
      musicEngine.registerYoutubeController(null);
      unsub();
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
          ytPlayerRef.current = null;
        } catch {}
      }
    };
  }, []);

  const handleTogglePlay = async () => {
    sfx.playUiSelect();
    await musicEngine.togglePlay();
  };

  const handleSelectTheme = async (themeId: string) => {
    sfx.playUiSelect();
    await musicEngine.setTheme(themeId);
    setIsMenuOpen(false);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    musicEngine.setVolume(val);
  };

  return (
    <>
      {/* 
        Active YouTube Video Frame (rendered with non-zero dimensions & microscopic opacity)
        Ensures modern browsers NEVER throttle or silence background YouTube playback!
      */}
      <div 
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '120px',
          height: '120px',
          opacity: 0.001,
          pointerEvents: 'none',
          zIndex: -20,
          overflow: 'hidden'
        }}
        aria-hidden="true"
      >
        <div id="nexora-yt-audio-player" />
      </div>

      {/* Floating Audio Container - Positioned at bottom-24 / bottom-28 safely ABOVE the Dock to avoid any overlap */}
      <div className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-40 select-none">
        <div className="relative">
          {/* Theme Selection Dropdown Menu */}
          <AnimatePresence>
            {isMenuOpen && !isMinimized && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-full right-0 mb-3 w-84 p-3 rounded-2xl bg-[#090D18]/95 border border-white/20 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] z-50"
              >
                <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b border-white/10 text-xs">
                  <span className="font-syne font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#00F0FF]" />
                    <span>Chọn Nhạc Nền (Loop Vĩnh Viễn)</span>
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-tabular text-[#00FF88]">
                    <Repeat className="w-3 h-3 animate-pulse" />
                    <span>LOOP ♾️</span>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                  {AUDIO_THEMES.map((theme) => {
                    const isCurrent = theme.id === currentTheme.id;
                    return (
                      <button
                        key={theme.id}
                        data-magnetic
                        onClick={() => handleSelectTheme(theme.id)}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group hover-jiggle cursor-pointer ${
                          isCurrent
                            ? 'bg-white/15 border border-white/25 shadow-md ring-1 ring-white/20'
                            : 'bg-white/[0.03] hover:bg-white/[0.08] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                            style={{ backgroundColor: `${theme.color}25`, border: `1px solid ${theme.color}50` }}
                          >
                            {theme.youtubeId ? (
                              <Flame className="w-3.5 h-3.5" style={{ color: theme.color }} />
                            ) : (
                              <Music className="w-3.5 h-3.5" style={{ color: theme.color }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-syne font-bold text-xs text-white truncate max-w-[160px]">
                                {theme.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#A1A1AA] font-tabular block truncate max-w-[160px]">
                              {theme.artist}
                            </span>
                          </div>
                        </div>

                        <span 
                          className="text-[9px] font-syne font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ml-2"
                          style={{ color: theme.color, backgroundColor: `${theme.color}15` }}
                        >
                          {theme.tag}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Volume Slider inside menu */}
                <div className="mt-3 pt-3 border-t border-white/10 px-2 flex items-center gap-3">
                  <Volume2 className="w-3.5 h-3.5 text-[#A1A1AA] shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-[#00F0FF] cursor-pointer h-1 rounded-lg"
                  />
                  <span className="text-[10px] font-tabular text-[#A1A1AA] w-7 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* MAIN WIDGET: TOGGLEABLE BETWEEN MINIMIZED AND EXPANDED */}
          {isMinimized ? (
            /* MINIMIZED COMPACT MODE: Micro floating capsule (Zero overlap with anything!) */
            <motion.div
              layout
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="flex items-center gap-1 p-1 rounded-full bg-[#0A0E17]/95 border border-white/20 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.85)] hover-jiggle"
            >
              <button
                data-magnetic
                onClick={() => setIsMinimized(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer group"
                style={{ backgroundColor: `${currentTheme.color}20` }}
                title={`Đang phát (Loop): ${currentTheme.name} - Bấm để mở rộng`}
              >
                <Disc 
                  className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`}
                  style={{ color: currentTheme.color }}
                />
              </button>

              <button
                data-magnetic
                onClick={handleTogglePlay}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer text-white shadow-md hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: isPlaying ? currentTheme.color : 'rgba(255, 255, 255, 0.12)',
                  color: isPlaying ? '#0A0E17' : '#FFFFFF',
                }}
                title={isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc nền'}
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3 fill-current" />
                ) : (
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                )}
              </button>

              <button
                data-magnetic
                onClick={() => {
                  sfx.playUiSelect();
                  setIsMinimized(false);
                }}
                className="px-1.5 py-1 text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                title="Mở rộng khung nhạc nền"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </motion.div>
          ) : (
            /* EXPANDED MODE: Sleek Pill Widget */
            <motion.div
              layout
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-[#0A0E17]/95 border border-white/20 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] hover-jiggle"
            >
              {/* Dancing Equalizer Bars */}
              <div 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-end gap-0.5 h-4 cursor-pointer mr-0.5"
                title="Đổi bài nhạc hoặc xem danh sách"
              >
                {[1, 2, 3, 4].map((bar) => (
                  <motion.span
                    key={bar}
                    className="w-1 rounded-full"
                    style={{ backgroundColor: currentTheme.color }}
                    animate={{
                      height: isPlaying
                        ? [
                            `${Math.max(4, (bar * 5) % 16)}px`,
                            `${Math.max(6, ((5 - bar) * 6) % 18)}px`,
                            `${Math.max(4, (bar * 7) % 16)}px`,
                          ]
                        : '4px',
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: isPlaying ? 0.45 + bar * 0.12 : 1,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {/* Current Track Info & Theme Switcher Button */}
              <button
                data-magnetic
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-xs font-syne font-bold text-white transition-all cursor-pointer"
                title="Đổi bài nhạc"
              >
                <Disc className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin' : ''}`} style={{ color: currentTheme.color }} />
                <span className="hidden sm:inline max-w-[140px] truncate text-[11px]">
                  {currentTheme.name}
                </span>
                <span className="text-[9px] font-tabular text-[#00FF88] px-1 rounded bg-[#00FF88]/10" title="Chế độ lặp vô tận">
                  LOOP
                </span>
                <ChevronDown className={`w-3 h-3 text-[#A1A1AA] transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Play/Pause Button */}
              <button
                data-magnetic
                onClick={handleTogglePlay}
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer text-white shadow-md hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: isPlaying ? currentTheme.color : 'rgba(255, 255, 255, 0.12)',
                  color: isPlaying ? '#0A0E17' : '#FFFFFF',
                }}
                title={isPlaying ? 'Tạm dừng nhạc' : 'Phát nhạc nền'}
              >
                {isPlaying ? (
                  <Pause className="w-3 h-3 fill-current" />
                ) : (
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                )}
              </button>

              {/* Minimize Button - Thu nhỏ khung chọn nhạc để tránh che khuất dock */}
              <button
                data-magnetic
                onClick={() => {
                  sfx.playUiSelect();
                  setIsMenuOpen(false);
                  setIsMinimized(true);
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Thu nhỏ khung nhạc nền"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};
