import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  ChevronRight, 
  Zap, 
  ArrowUpRight 
} from 'lucide-react';
import { runOmniAnalysis } from '../services/geminiService';
import { useTheme } from '../context/ThemeContext';

interface SupremeOmniPortalProps {
  onOpenAICopilot: (query?: string) => void;
  onOpenDataModal: () => void;
  onNavigateToTab: (tabId: string) => void;
  hasApiKey: boolean;
}

interface BranchItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  items: string[];
  highlightColor: string;
}

interface OmniResult {
  interpretedIntent: string;
  coreSeed: string;
  inferredStrengths: string[];
  inferredValues: string[];
  branches: BranchItem[];
  aiAdvice: string;
}

export const SupremeOmniPortal: React.FC<SupremeOmniPortalProps> = ({
  onOpenAICopilot,
  onOpenDataModal,
  onNavigateToTab,
  hasApiKey,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [isBranching, setIsBranching] = useState(false);
  const [result, setResult] = useState<OmniResult | null>(null);
  const [activeBranch, setActiveBranch] = useState<BranchItem | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { theme } = useTheme();

  // Scroll Progress for editorial parallax depth
  const { scrollY } = useScroll();

  const rawTheY = useTransform(scrollY, [0, 600], [0, -45]);
  const rawFutureY = useTransform(scrollY, [0, 600], [0, -90]);
  const rawIndexY = useTransform(scrollY, [0, 600], [0, -35]);
  const rawInputY = useTransform(scrollY, [0, 600], [0, -60]);

  const theY = useSpring(rawTheY, { stiffness: 140, damping: 26 });
  const futureY = useSpring(rawFutureY, { stiffness: 140, damping: 26 });
  const indexY = useSpring(rawIndexY, { stiffness: 140, damping: 26 });
  const inputY = useSpring(rawInputY, { stiffness: 140, damping: 26 });

  const placeholderSeeds = [
    'Em thích Toán & Lý, muốn chế tạo robot và xe điện...',
    'Điểm thi dự kiến 25.5 khối A01, ngân sách 35 triệu/năm...',
    'Muốn học thiết kế Vi mạch bán dẫn tại TP.HCM hoặc Đà Nẵng...',
    'Không muốn học đại học, muốn học nghề kỹ thuật có thu nhập sớm...',
    'Đang phân vân giữa Khoa học dữ liệu (AI) và Logistics chuỗi cung ứng...',
    'Thích mỹ thuật và code game nhưng sợ AI thay thế...',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderSeeds.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [placeholderSeeds.length]);

  const quickPrompts = [
    { label: 'Kỹ sư Robot & Tự động hóa', query: 'Em muốn trở thành Kỹ sư Robot và Tự động hóa, cần học ngành gì và trường nào?' },
    { label: 'Vi mạch & Bán dẫn 2026', query: 'Muốn học thiết kế Vi mạch bán dẫn đón đầu làn sóng FDI tại Việt Nam' },
    { label: 'Điểm 25-27 khối A01/D01', query: 'Điểm thi khoảng 26 điểm khối A01, nên nộp trường nào an toàn?' },
    { label: 'Nếu không học đại học?', query: 'Em muốn biết nếu không học đại học thì tương lai theo nhánh cao đẳng, nghề ra sao?' },
    { label: 'Khoa học dữ liệu & AI', query: 'Học Khoa học dữ liệu và AI tương lai thế nào tại VN?' },
    { label: 'Học phí thấp, có việc ngay', query: 'Gia đình khó khăn, muốn tìm trường học phí dưới 15 triệu/năm có việc làm ngay' },
  ];

  const handleBranchOut = async (seedText?: string) => {
    const textToSearch = seedText || query;
    if (!textToSearch.trim()) return;
    setIsBranching(true);
    try {
      const data = await runOmniAnalysis(textToSearch);
      setResult(data);
      if (data?.branches?.length > 0) {
        setActiveBranch(data.branches[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBranching(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setActiveBranch(null);
    setQuery('');
  };

  return (
    <div 
      ref={containerRef} 
      className="relative min-h-[90vh] w-full flex flex-col justify-between py-24 sm:py-28 px-4 sm:px-8 lg:px-14 bg-[var(--bg-primary)] text-[var(--text-primary)]"
    >
      {/* ------------------- STAGE 1: EDITORIAL COVER WITH SINGLE OMNI INPUT ------------------- */}
      {!result && (
        <div className="relative z-10 max-w-7xl mx-auto w-full my-auto">
          {/* Section Kicker */}
          <div className="flex items-center gap-2 text-[11px] font-tabular tracking-[0.12em] uppercase text-[var(--text-secondary)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0" />
            <span>[ 00 // OMNI-SEED VECTOR · UNIFIED TRAJECTORY ]</span>
          </div>

          {/* Asymmetric Split Layout: Massive Headline (7 cols) + Quick Start Brief (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end pb-12 border-b border-[var(--border-color)]">
            <div className="lg:col-span-8 select-none">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col leading-[0.84] tracking-[-0.04em]"
              >
                {/* Line 1: The */}
                <motion.span 
                  style={{ y: theY }}
                  className="font-syne font-semibold text-6xl sm:text-8xl md:text-9xl lg:text-[9.5rem] text-[var(--text-primary)] will-change-transform inline-block"
                >
                  The
                </motion.span>

                {/* Line 2: Future in solid text (NO gradient) */}
                <motion.div 
                  style={{ y: futureY }}
                  className="ml-2 sm:ml-8 md:ml-12 -my-2 sm:-my-4 will-change-transform inline-block"
                >
                  <span className="font-editorial-italic font-normal text-7xl sm:text-9xl md:text-[10.5rem] lg:text-[11.5rem] tracking-tight text-[var(--text-primary)]">
                    Future
                  </span>
                </motion.div>

                {/* Line 3: Index */}
                <motion.span 
                  style={{ y: indexY }}
                  className="font-syne font-semibold text-6xl sm:text-8xl md:text-9xl lg:text-[9.5rem] text-[var(--text-primary)] will-change-transform inline-block"
                >
                  Index.
                </motion.span>
              </motion.div>
            </div>

            {/* Right Side Editorial Note */}
            <div className="lg:col-span-4 rounded-none border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-tabular uppercase tracking-[0.1em] text-[var(--text-secondary)] block mb-2">
                  [ PROMPT DISPATCH ]
                </span>
                <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)]">
                  Khởi tạo lộ trình từ một ý nghĩ ban đầu. Nhập sở thích, tổ hợp thi, ngân sách học tập hoặc một câu hỏi chưa có lời đáp.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-tabular text-[var(--text-secondary)]">
                <span>REPRESENTATION ENGINE</span>
                <span className="text-[var(--accent-primary)] font-bold">READY</span>
              </div>
            </div>
          </div>

          {/* THE MASTER OMNI-INPUT BOX (Razor-sharp 0px, 1px border, 85-12-3 Rule) */}
          <motion.div
            style={{ y: inputY }}
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="w-full max-w-4xl mt-10"
          >
            <div className="rounded-none border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2">
              <div className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <div className="w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] shrink-0 ml-1">
                  <Zap className="w-4 h-4 text-[var(--accent-primary)]" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBranchOut();
                  }}
                  placeholder={placeholderSeeds[placeholderIndex]}
                  className="flex-1 w-full bg-transparent px-3 py-3.5 text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none font-normal"
                />
                <button
                  data-magnetic
                  onClick={() => handleBranchOut()}
                  disabled={isBranching}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-syne font-bold text-xs uppercase tracking-wider transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isBranching ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang Phân Nhánh...</span>
                    </>
                  ) : (
                    <>
                      <span>Phân Nhánh Ngay</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Inspiration Seed Buttons (Rounded-full, crisp borders) */}
            <div className="mt-5 flex flex-wrap gap-2 items-center">
              <span className="text-[11px] font-tabular uppercase tracking-[0.1em] text-[var(--text-secondary)] mr-2">
                Hạt giống gợi ý:
              </span>
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  data-magnetic
                  onClick={() => {
                    setQuery(p.query);
                    handleBranchOut(p.query);
                  }}
                  className="px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] text-xs text-[var(--text-primary)] transition-colors duration-300 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] shrink-0" />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* ------------------- STAGE 2: BRANCH UNIVERSE (AFTER SEARCH) ------------------- */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-7xl mx-auto my-auto"
        >
          {/* Top Control Bar for current tree (Rounded-none, 1px border) */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 rounded-none bg-[var(--bg-secondary)] border border-[var(--border-color)] mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-full bg-[var(--bg-primary)] hover:bg-[var(--text-primary)] text-[var(--text-primary)] hover:text-[var(--bg-primary)] border border-[var(--border-color)] transition-colors duration-300 flex items-center gap-2 text-xs font-syne font-bold uppercase tracking-wider cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nhập Hạt Giống Mới</span>
              </button>
              <div>
                <span className="text-[10px] font-tabular uppercase tracking-widest text-[var(--text-secondary)] block">
                  [ HẠT GIỐNG ĐÃ NHẬP ]
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] truncate max-w-md">
                  {result.coreSeed}
                </h3>
              </div>
            </div>

            {/* Inferred attributes */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {result.inferredStrengths.map((str, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] font-tabular text-[11px]">
                  {str}
                </span>
              ))}
              <button
                onClick={() => onOpenAICopilot(`Phân tích sâu mục tiêu: "${result.coreSeed}"`)}
                className="px-4 py-1.5 rounded-full bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Hỏi Cố Vấn AI</span>
              </button>
            </div>
          </div>

          {/* AI Synthesis Callout (Brutalist Box) */}
          <div className="p-6 rounded-none bg-[var(--bg-secondary)] border border-[var(--border-color)] mb-10">
            <span className="text-[10px] font-tabular uppercase tracking-[0.1em] text-[var(--text-secondary)] block mb-1">
              [ 01 // NEXORA SYNTHESIS AUDIT ]
            </span>
            <p className="text-sm sm:text-base text-[var(--text-primary)] leading-relaxed">
              {result.aiAdvice}
            </p>
          </div>

          {/* THE 6 BRANCH STATIONS: ASYMMETRIC BRUTALIST GRID WITH HOVER INVERSION */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[var(--border-color)]">
            {result.branches.map((branch, idx) => {
              const isActive = activeBranch?.id === branch.id;
              const idxStr = (idx + 1).toString().padStart(2, '0');

              return (
                <div
                  key={branch.id}
                  onClick={() => setActiveBranch(branch)}
                  data-cursor="CHI TIẾT"
                  className={`group relative p-7 border-r border-b border-[var(--border-color)] transition-colors duration-500 cursor-pointer flex flex-col justify-between min-h-[280px] ${
                    isActive
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                      : 'bg-[var(--bg-primary)] hover:bg-[var(--text-primary)] text-[var(--text-primary)] hover:text-[var(--bg-primary)]'
                  }`}
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-tabular tracking-[0.1em] uppercase mb-3 opacity-80">
                      <span>{idxStr} /</span>
                      <span>{branch.tag}</span>
                    </div>

                    <h4 className="font-syne font-semibold text-lg mb-1 tracking-tight">
                      {branch.title}
                    </h4>
                    <p className="text-xs mb-5 opacity-75 leading-relaxed">
                      {branch.subtitle}
                    </p>

                    <div className="space-y-2">
                      {branch.items.map((item, i) => (
                        <div 
                          key={i}
                          className="p-3 rounded-none border border-[var(--border-color)] text-xs flex items-start gap-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] group-hover:bg-[var(--text-primary)] group-hover:text-[var(--bg-primary)] group-hover:border-[var(--bg-primary)]/20 transition-colors duration-500"
                        >
                          <span className="font-tabular text-[10px] opacity-60 mt-0.5">{i + 1}.</span>
                          <span className="font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-[var(--border-color)] group-hover:border-[var(--bg-primary)]/20 flex items-center justify-between text-xs font-syne font-semibold">
                    <span className="group-hover:text-[var(--accent-primary)] transition-colors">
                      Mở Khóa Chi Tiết
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick link to standard deep tabs */}
          <div className="mt-10 pt-6 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
            <span className="font-tabular">[ 03 // TRA CỨU DANH MỤC CHÍNH THỨC ]</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onNavigateToTab('combinations')}
                className="px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--text-primary)] text-[var(--text-primary)] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Bảng Điểm Chuẩn 2026</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              </button>
              <button
                onClick={() => onNavigateToTab('observatory')}
                className="px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--text-primary)] text-[var(--text-primary)] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Đài Quan Sát GSO Q2/2026</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              </button>
              <button
                onClick={() => onNavigateToTab('alternatives')}
                className="px-4 py-2 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--text-primary)] text-[var(--text-primary)] font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Lộ Trình Khởi Nghiệp</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
