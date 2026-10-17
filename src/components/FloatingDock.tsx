import React from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Network, 
  Calculator, 
  BookOpen, 
  TrendingUp, 
  GraduationCap, 
  Building2,
  Compass
} from 'lucide-react';

interface FloatingDockProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAICopilot: () => void;
}

export const FloatingDock: React.FC<FloatingDockProps> = ({
  currentTab,
  setCurrentTab,
  onOpenAICopilot,
}) => {
  const dockItems = [
    { id: 'omni', icon: Compass, label: 'Bắt Đầu', color: '#2563EB' },
    { id: 'tree', icon: Network, label: 'Rễ Cây 2 Chiều', color: '#3B82F6' },
    { id: 'combinations', icon: Calculator, label: 'Tuyển Sinh 2026', color: '#10B981' },
    { id: 'majors-careers', icon: BookOpen, label: 'Lương & Nhu Cầu Thật', color: '#6366F1' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] px-3 py-2 rounded-full bg-[var(--dock-bg)] border border-[var(--border-color)] backdrop-blur-2xl flex items-center gap-1.5 transition-colors duration-300">
      {dockItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            data-magnetic
            onClick={() => setCurrentTab(item.id)}
            title={item.label}
            className={`relative px-3 sm:px-3.5 py-2 rounded-full text-xs font-syne font-semibold transition-all flex items-center gap-2 shrink-0 hover-jiggle cursor-pointer ${
              isActive
                ? 'bg-[var(--card-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-surface)]/60'
            }`}
          >
            <Icon 
              className="w-3.5 h-3.5 transition-transform group-hover:scale-110 shrink-0" 
              style={{ color: isActive ? item.color : 'inherit' }}
            />
            <span className="hidden lg:inline text-[11px] font-syne font-bold tracking-wider uppercase whitespace-nowrap">
              {item.label}
            </span>
            {isActive && (
              <motion.span
                layoutId="dockActiveDot"
                className="w-1.5 h-1.5 rounded-full absolute -top-1 left-1/2 -translate-x-1/2"
                style={{ backgroundColor: item.color }}
              />
            )}
          </button>
        );
      })}

      <div className="h-4 w-[1px] bg-[var(--border-color)] mx-1 hidden sm:block" />

      {/* Direct AI trigger in dock (Clean blue, no neon, no Cmd+K shortcut badge) */}
      <button
        data-magnetic
        data-cursor="COPILOT"
        onClick={onOpenAICopilot}
        title="Mở AI Copilot"
        className="px-3.5 py-2 rounded-full text-[11px] font-syne font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">AI Copilot</span>
      </button>
    </div>
  );
};
