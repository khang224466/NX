import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { ScrollParallax } from './ScrollParallax';

interface HeroSectionProps {
  onSelectPortal: (portalId: string) => void;
  onOpenAICopilot: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSelectPortal, onOpenAICopilot }) => {
  const portals = [
    {
      idx: '01',
      id: 'discovery',
      title: 'Tôi chưa biết chọn ngành nào',
      desc: 'Bắt đầu từ năng khiếu tự nhiên, hồ sơ năng lực 6 chiều và ma trận định hướng bản thân.',
      tag: 'ROOT-1 DISCOVERY',
      targetTab: 'discovery',
    },
    {
      idx: '02',
      id: 'reverse-career',
      title: 'Tôi đã có nghề mình muốn làm',
      desc: 'Đi ngược từ chức danh việc làm thực tế về tổ hợp xét tuyển, trường đào tạo và bộ kỹ năng cốt lõi.',
      tag: 'REVERSE PATH',
      targetTab: 'tree',
    },
    {
      idx: '03',
      id: 'score-calc',
      title: 'Tôi muốn tính điểm & kiểm tra an toàn',
      desc: 'Mô phỏng cơ hội trúng tuyển 2024–2026 theo đúng thang điểm và quy chế giảm trừ ưu tiên chính thức.',
      tag: 'BENCHMARK AUDIT',
      targetTab: 'combinations',
    },
    {
      idx: '04',
      id: 'compare-majors',
      title: 'Tôi đang phân vân giữa vài ngành',
      desc: 'Đặt lên bàn cân đối đầu về học phí, tỷ lệ tự động hóa bởi AI và cơ hội chuyển đổi liên ngành.',
      tag: 'SIDE-BY-SIDE',
      targetTab: 'majors-careers',
    },
    {
      idx: '05',
      id: 'budget-path',
      title: 'Tôi cần tìm đường phù hợp với ngân sách',
      desc: 'Lọc trường công lập - tư thục theo biểu giá học phí niên khóa 2026 và chính sách học bổng doanh nghiệp.',
      tag: 'BUDGET OPTIMIZER',
      targetTab: 'combinations',
    },
    {
      idx: '06',
      id: 'alt-vocational',
      title: 'Tôi muốn lộ trình không phụ thuộc đại học',
      desc: 'Cao đẳng thực hành chất lượng cao, đặt hàng doanh nghiệp FDI và các chứng chỉ nghề ngắn hạn thu nhập sớm.',
      tag: 'DUAL VOCATIONAL',
      targetTab: 'alternatives',
    },
  ];

  return (
    <section className="relative py-24 sm:py-32 lg:py-36 px-4 sm:px-8 lg:px-14 overflow-hidden bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto">
        {/* =========================================================================
            ASYMMETRIC 12-COLUMN EDITORIAL HERO LAYOUT (7 COLS / 5 COLS)
            No center alignment. No AI gradient text. 85-12-3 palette rule.
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start pb-20 border-b border-[var(--border-color)]">
          {/* Left Column: 7 Cols - Command Typography */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Monospace Editorial Kicker */}
              <div className="flex items-center gap-2 text-[11px] font-tabular tracking-[0.12em] uppercase text-[var(--text-secondary)] mb-6">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0" />
                <span>[ 01 // NATIONAL CAREER INDEX · VIETNAM 2026 ]</span>
              </div>

              {/* High-Impact Solid Editorial Headline (Extreme Contrast) */}
              <h1 className="text-[clamp(2.8rem,7vw,6.5rem)] font-semibold text-[var(--text-primary)] leading-[0.93] tracking-[-0.04em] text-balance">
                Choose your path.
                <br />
                <span className="font-editorial-italic font-normal block mt-2 text-[var(--text-primary)]">
                  Understand your future.
                </span>
              </h1>

              {/* Narrative description */}
              <p className="mt-8 text-base sm:text-lg text-[var(--text-secondary)] font-normal max-w-xl leading-relaxed text-balance">
                Một người học — nhiều con đường — một bản đồ có căn cứ. Điều hướng từ năng lực thực chất đến tổ hợp xét tuyển, mã ngành Thông tư 74/2026, cơ sở đào tạo và nhu cầu việc làm thực tế của thị trường.
              </p>
            </div>

            {/* Actions: Strict 85-12-3 Rule (Only 1 primary CTA uses accent-primary, rounded-full) */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                data-magnetic
                onClick={() => onSelectPortal('tree')}
                className="px-7 py-3.5 rounded-full bg-[var(--accent-primary)] text-[var(--accent-primary-text)] font-syne font-bold text-xs uppercase tracking-wider transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer flex items-center gap-2"
              >
                <span>Mở Bản Đồ Rễ Cây</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                data-magnetic
                onClick={onOpenAICopilot}
                className="px-6 py-3.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:border-[var(--text-primary)] font-syne font-semibold text-xs uppercase tracking-wider transition-colors duration-300 flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                <span>Tham Vấn Cố Vấn AI</span>
              </button>
            </div>
          </div>

          {/* Right Column: 5 Cols - Brutalist-Editorial Fact Box (Square 0px, 1px border, no box-shadow) */}
          <div className="lg:col-span-5 rounded-none border border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
                <span className="text-[11px] font-tabular uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                  [ GSO DATA BENCHMARK · Q2/2026 ]
                </span>
                <TrendingUp className="w-4 h-4 text-[var(--text-secondary)]" />
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <span className="text-[11px] font-tabular uppercase tracking-wider text-[var(--text-secondary)] block">
                    Tỷ lệ thất nghiệp thanh niên (15–24 tuổi)
                  </span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="font-tabular text-4xl sm:text-5xl font-bold text-[var(--text-primary)] tracking-tight">
                      8,67%
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      gấp 3.9 lần mức thất nghiệp chung
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)] grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-tabular uppercase tracking-wider text-[var(--text-secondary)] block">
                      Thanh niên NEET
                    </span>
                    <span className="font-tabular text-2xl font-bold text-[var(--text-primary)]">
                      1,4 Triệu
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-tabular uppercase tracking-wider text-[var(--text-secondary)] block">
                      Chỉ số FDI Công nghệ
                    </span>
                    <span className="font-tabular text-2xl font-bold text-[var(--text-primary)]">
                      +18,4%
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border-color)]">
                  <span className="text-[10px] font-tabular uppercase tracking-wider text-[var(--text-secondary)] block mb-1">
                    Khung pháp lý tuyển sinh & Đào tạo
                  </span>
                  <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                    Thông tư 06/2026/TT-BGDĐT (Quy chế tuyển sinh) & Thông tư 74/2026/TT-BGDĐT (Danh mục ngành chuẩn 6 chữ số).
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] font-tabular text-[var(--text-secondary)]">
              <span>NEXORA AUDIT ENGINE</span>
              <span className="text-[var(--text-primary)] font-bold">STATE CERTIFIED</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            THE SIX ENTRY VECTORS: ASYMMETRIC EDITORIAL LIST WITH HOVER INVERSION
            No 3-column cards with top icons. Crisp 1px grid with color inversion.
            ========================================================================= */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[var(--border-color)]">
            <div>
              <span className="text-[11px] font-tabular uppercase tracking-[0.1em] text-[var(--text-secondary)] block mb-1">
                [ 02 // VECTOR MATRICES ]
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                Bạn muốn bắt đầu từ đâu?
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] max-w-sm">
              Không cần biết trước nghề nghiệp để bắt đầu — chọn điểm xuất phát gần với hoàn cảnh của bạn nhất.
            </p>
          </div>

          {/* Brutalist Editorial Matrix (2 Columns of Sharp-Edged Rows) */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-[var(--border-color)]">
            {portals.map((portal) => (
              <div
                key={portal.id}
                onClick={() => onSelectPortal(portal.targetTab)}
                data-cursor="KHÁM PHÁ"
                className="group relative p-8 border-r border-b border-[var(--border-color)] bg-[var(--bg-primary)] hover:bg-[var(--text-primary)] text-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-colors duration-500 cursor-pointer flex flex-col justify-between min-h-[220px]"
                style={{
                  transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-tabular tracking-[0.1em] uppercase mb-4 text-[var(--text-secondary)] group-hover:text-[var(--bg-primary)] opacity-80 transition-colors duration-500">
                    <span>{portal.idx} /</span>
                    <span>{portal.tag}</span>
                  </div>

                  <h3 className="text-xl font-medium tracking-tight group-hover:translate-x-1 transition-transform duration-500 flex items-center justify-between">
                    <span>{portal.title}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:text-[var(--accent-primary)] transition-all duration-300 shrink-0 ml-2" />
                  </h3>

                  <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)] group-hover:text-[var(--bg-primary)] opacity-90 transition-colors duration-500 max-w-md">
                    {portal.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-[var(--border-color)] group-hover:border-[var(--bg-primary)]/20 flex items-center justify-between text-[11px] font-tabular uppercase tracking-wider text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors duration-500">
                  <span>Khởi chạy phân tích</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
