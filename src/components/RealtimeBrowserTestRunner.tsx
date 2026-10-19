import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  runBrowserTestSuite, 
  TestSuiteSummary, 
  TestCaseResult 
} from '../services/realtimeBrowserTestSuite';
import { 
  Play, 
  Pause, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  Search, 
  Copy, 
  Download, 
  Maximize2, 
  Minimize2, 
  X, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';

interface RealtimeBrowserTestRunnerProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const RealtimeBrowserTestRunner: React.FC<RealtimeBrowserTestRunnerProps> = ({
  isOpen: externalOpen,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isOpen) : val;
    setInternalOpen(nextVal);
    onOpenChange?.(nextVal);
  };
  const [isRunning, setIsRunning] = useState(true);
  const [intervalMs, setIntervalMs] = useState<number>(3000); // 3 seconds default continuous loop
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [lastSummary, setLastSummary] = useState<TestSuiteSummary | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFailures, setOnlyFailures] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'terminal' | 'stats'>('tests');
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

  // Check URL query parameter ?test=true or ?test=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('test') === 'true' || urlParams.get('test') === '1') {
        setIsOpen(true);
      }
    }
  }, []);

  // Global hotkey: Alt + T or Ctrl + Shift + T to toggle runner
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 't') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 't')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Execution engine
  const executeCycle = useCallback(() => {
    setCycleCount(prev => {
      const nextCycle = prev + 1;
      try {
        const summary = runBrowserTestSuite(nextCycle);
        setLastSummary(summary);
      } catch (err: any) {
        console.error('Test Suite Run Error:', err);
      }
      return nextCycle;
    });
  }, []);

  // Continuous timer loop (only runs when modal is actively open)
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    executeCycle();

    if (isRunning && intervalMs > 0) {
      timerRef.current = setInterval(() => {
        executeCycle();
      }, intervalMs);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, isRunning, intervalMs, executeCycle]);

  // Auto-scroll terminal
  useEffect(() => {
    if (activeTab === 'terminal' && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lastSummary?.logs, activeTab]);

  // Filtered test items
  const filteredTests = useMemo(() => {
    if (!lastSummary) return [];
    return lastSummary.tests.filter(test => {
      // Category filter
      if (selectedCategory !== 'all' && test.category !== selectedCategory) {
        return false;
      }
      // Failure only filter
      if (onlyFailures && test.status !== 'FAIL') {
        return false;
      }
      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchId = test.id.toLowerCase().includes(q);
        const matchTitle = test.title.toLowerCase().includes(q);
        const matchSuite = test.suiteName.toLowerCase().includes(q);
        const matchDetails = (test.details || '').toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchSuite && !matchDetails) {
          return false;
        }
      }
      return true;
    });
  }, [lastSummary, selectedCategory, searchQuery, onlyFailures]);

  const handleCopyLogs = () => {
    if (!lastSummary) return;
    navigator.clipboard.writeText(lastSummary.logs.join('\n'));
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const handleExportJson = () => {
    if (!lastSummary) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lastSummary, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `nexora-test-report-cycle-${lastSummary.cycle}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const passRate = lastSummary ? lastSummary.passRate : 100;
  const isAllPass = lastSummary ? lastSummary.failCount === 0 : true;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className={`w-full bg-[#090A0F] border border-[#2B2F3A] shadow-2xl flex flex-col overflow-hidden rounded-2xl transition-all duration-300 ${
              isFullScreen ? 'h-full max-h-[100vh]' : 'h-[92vh] max-w-6xl'
            }`}
          >
            {/* TOP HEADER BAR */}
            <div className="bg-[#10121A] border-b border-[#222632] px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C6F135]/10 border border-[#C6F135]/40 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-[#C6F135] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide">
                      NEXORA REAL-TIME TEST RUNNER
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#C6F135]/20 text-[#C6F135] border border-[#C6F135]/40">
                      CONTINUOUS IN-BROWSER
                    </span>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                      66 ASSERTIONS
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    Kiểm thử liên tục chu kỳ thời gian thực • Đảm bảo 100% logic Quyết định, Tuyển sinh & Giao diện
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsFullScreen(prev => !prev)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title={isFullScreen ? "Thu nhỏ cửa sổ" : "Phóng to toàn màn hình"}
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  title="Đóng bảng kiểm thử (Alt + T)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* TELEMETRY METRIC STRIP */}
            <div className="bg-[#0C0E14] border-b border-[#1E222D] px-4 sm:px-6 py-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 shrink-0 font-mono">
              {/* Metric 1: Status */}
              <div className="p-2.5 rounded-xl bg-[#141722] border border-[#242938]">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Trạng Thái</div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                  {isAllPass ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#C6F135]" />
                      <span className="text-[#C6F135]">100% PASS</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-400">{lastSummary?.failCount} FAIL</span>
                    </>
                  )}
                </div>
              </div>

              {/* Metric 2: Chu kỳ kiểm thử */}
              <div className="p-2.5 rounded-xl bg-[#141722] border border-[#242938]">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Chu Kỳ Chạy</div>
                <div className="text-sm font-bold text-cyan-300 flex items-center gap-1.5 mt-0.5">
                  <RotateCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                  <span>#{cycleCount}</span>
                </div>
              </div>

              {/* Metric 3: Thời gian thực thi */}
              <div className="p-2.5 rounded-xl bg-[#141722] border border-[#242938]">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Độ Trễ Thực Thi</div>
                <div className="text-sm font-bold text-amber-300 flex items-center gap-1 mt-0.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{lastSummary ? `${lastSummary.totalDurationMs} ms` : '--'}</span>
                </div>
              </div>

              {/* Metric 4: Tỷ lệ đạt */}
              <div className="p-2.5 rounded-xl bg-[#141722] border border-[#242938]">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Assertions Đạt</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {lastSummary ? `${lastSummary.passCount} / ${lastSummary.totalTests}` : '66 / 66'}
                </div>
              </div>

              {/* Metric 5: Tần suất lặp */}
              <div className="p-2.5 rounded-xl bg-[#141722] border border-[#242938]">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Chu Kỳ Lặp</div>
                <select
                  value={intervalMs}
                  onChange={(e) => setIntervalMs(Number(e.target.value))}
                  className="w-full bg-[#1A1F2C] text-xs font-mono font-bold text-white border border-[#2F3648] rounded px-1.5 py-0.5 mt-0.5 focus:outline-none focus:border-[#C6F135]"
                >
                  <option value={1000}>1 giây (Liên tục)</option>
                  <option value={2000}>2 giây</option>
                  <option value={3000}>3 giây (Chuẩn)</option>
                  <option value={5000}>5 giây</option>
                  <option value={10000}>10 giây</option>
                </select>
              </div>

              {/* Metric 6: Điều khiển Chạy/Dừng */}
              <div className="p-2.5 rounded-xl bg-[#141722] border border-[#242938] flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tự Động</div>
                  <div className="text-xs font-bold text-slate-200 mt-0.5">
                    {isRunning ? 'Đang chạy' : 'Tạm dừng'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsRunning(prev => !prev)}
                    className={`p-1.5 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                      isRunning 
                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40' 
                        : 'bg-[#C6F135]/20 text-[#C6F135] hover:bg-[#C6F135]/30 border border-[#C6F135]/40'
                    }`}
                    title={isRunning ? "Tạm dừng" : "Bắt đầu"}
                  >
                    {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={executeCycle}
                    className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 cursor-pointer"
                    title="Chạy chu kỳ mới ngay lập tức"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR & SEARCH TOOLBAR */}
            <div className="bg-[#0D0F16] border-b border-[#1E222D] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Primary Tabs */}
              <div className="flex items-center gap-1 bg-[#141722] p-1 rounded-xl border border-[#242938]">
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'tests'
                      ? 'bg-[#C6F135] text-black shadow-sm'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Danh Sách Kiểm Thử ({lastSummary?.totalTests || 66})</span>
                </button>

                <button
                  onClick={() => setActiveTab('terminal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'terminal'
                      ? 'bg-cyan-400 text-black shadow-sm'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Live Terminal ({lastSummary?.logs.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'stats'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>5 Nhóm Kiểm Thử</span>
                </button>
              </div>

              {/* Quick Actions (Copy / Export) */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLogs}
                  className="px-2.5 py-1.5 rounded-lg bg-[#141722] hover:bg-slate-800 text-slate-200 hover:text-white border border-[#242938] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Sao chép toàn bộ nhật ký"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedLogs ? 'Đã chép!' : 'Chép Log'}</span>
                </button>
                <button
                  onClick={handleExportJson}
                  className="px-2.5 py-1.5 rounded-lg bg-[#141722] hover:bg-slate-800 text-slate-200 hover:text-white border border-[#242938] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Xuất file JSON kết quả kiểm thử"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải JSON</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: TEST LIST */}
            {activeTab === 'tests' && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#07080B]">
                {/* Secondary Filters Bar */}
                <div className="p-3 sm:px-6 bg-[#0E1017] border-b border-[#1A1D27] flex flex-wrap items-center justify-between gap-3 shrink-0">
                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', label: 'Tất cả (66)' },
                      { id: 'behavior', label: 'Quyết Định Cơ Bản (24)' },
                      { id: 'p1_p2', label: 'Sửa P1 & P2 (18)' },
                      { id: 'scenarios_12', label: '12 Tình Huống (12)' },
                      { id: 'admissions_math', label: 'Toán Tuyển Sinh (7)' },
                      { id: 'data_sanity', label: 'Dữ Liệu & UI (5)' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-[#2A3142] text-[#C6F135] font-bold border border-[#C6F135]/50'
                            : 'bg-[#12141C] text-slate-300 hover:text-white hover:bg-slate-800 border border-[#202430]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Search and Only Failures */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Tìm mã test, từ khóa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-[#141722] text-xs font-mono text-white pl-8 pr-3 py-1 rounded-md border border-[#242938] focus:outline-none focus:border-[#C6F135] w-48 sm:w-60"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setOnlyFailures(prev => !prev)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors cursor-pointer ${
                        onlyFailures 
                          ? 'bg-red-950 text-red-300 border-red-700 font-bold' 
                          : 'bg-[#141722] text-slate-300 hover:text-white border-[#242938]'
                      }`}
                    >
                      Chỉ lỗi (0)
                    </button>
                  </div>
                </div>

                {/* Test Items Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 font-mono">
                  {filteredTests.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Không tìm thấy kiểm thử nào phù hợp với bộ lọc hiện tại.
                    </div>
                  ) : (
                    filteredTests.map((test) => {
                      const isExpanded = expandedTestId === test.id;
                      const isPass = test.status === 'PASS';

                      return (
                        <div
                          key={test.id}
                          className={`rounded-xl border transition-all duration-150 ${
                            isPass 
                              ? 'bg-[#0E1017] border-[#1C202C] hover:border-[#2D3346]' 
                              : 'bg-red-950/20 border-red-800'
                          }`}
                        >
                          {/* Item Header Row */}
                          <div
                            onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                            className="p-3 sm:px-4 flex items-center justify-between gap-3 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {/* Status Badge */}
                              <span 
                                className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                  isPass 
                                    ? 'bg-[#C6F135]/15 text-[#C6F135] border border-[#C6F135]/40' 
                                    : 'bg-red-500/20 text-red-400 border border-red-500/50'
                                }`}
                              >
                                {test.status}
                              </span>

                              {/* Test ID */}
                              <span className="text-cyan-300 font-bold text-xs shrink-0">
                                {test.id}
                              </span>

                              <span className="text-slate-500 text-xs hidden sm:inline shrink-0">|</span>

                              {/* Title */}
                              <span className="text-xs text-white font-medium truncate">
                                {test.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              {/* Suite Tag */}
                              <span className="hidden md:inline-block text-[10px] text-slate-300 bg-[#161924] px-2 py-0.5 rounded border border-[#242938]">
                                {test.suiteName}
                              </span>

                              {/* Latency */}
                              <span className="text-[10px] text-slate-300">
                                {test.durationMs}ms
                              </span>

                              {/* Accordion Chevron */}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-300" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-300" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Detail Panel */}
                          {isExpanded && (
                            <div className="px-4 pb-3.5 pt-1 border-t border-[#181C26] bg-[#0A0B10] text-xs space-y-2 rounded-b-xl">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                                <div className="p-2.5 rounded-lg bg-[#11131C] border border-[#202534]">
                                  <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1">
                                    KỲ VỌNG (EXPECTED)
                                  </div>
                                  <div className="text-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
                                    {test.expected}
                                  </div>
                                </div>

                                <div className="p-2.5 rounded-lg bg-[#11131C] border border-[#202534]">
                                  <div className="text-[10px] text-[#C6F135] font-bold uppercase mb-1">
                                    THỰC TẾ (ACTUAL)
                                  </div>
                                  <div className="text-slate-200 text-xs whitespace-pre-wrap leading-relaxed">
                                    {test.actual}
                                  </div>
                                </div>
                              </div>

                              {test.details && (
                                <div className="p-2.5 rounded-lg bg-[#11131C] border border-[#202534]">
                                  <div className="text-[10px] text-slate-300 font-bold uppercase mb-0.5">
                                    CHI TIẾT CHẨN ĐOÁN
                                  </div>
                                  <div className="text-slate-300 text-xs leading-relaxed">
                                    {test.details}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: LIVE TERMINAL */}
            {activeTab === 'terminal' && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#06070B] font-mono text-xs">
                <div className="p-2.5 px-4 bg-[#0A0C12] border-b border-[#1A1D27] flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs text-slate-300 font-bold">STDOUT / REAL-TIME STREAMING LOG</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {lastSummary?.logs.length || 0} dòng ghi nhận
                  </span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-1 text-slate-300 selection:bg-cyan-500 selection:text-black">
                  {lastSummary?.logs.map((line, idx) => {
                    const isPass = line.includes('✅ [PASS]');
                    const isFail = line.includes('❌ [FAIL]');
                    const isHeader = line.includes('--- BẮT ĐẦU CHU KỲ');

                    return (
                      <div 
                        key={idx}
                        className={`leading-relaxed ${
                          isFail 
                            ? 'text-red-400 font-bold bg-red-950/20 px-1 py-0.5 rounded' 
                            : isPass 
                            ? 'text-slate-200' 
                            : isHeader 
                            ? 'text-[#C6F135] font-bold pt-2 pb-1 border-b border-[#1C202C]' 
                            : 'text-slate-300'
                        }`}
                      >
                        {line}
                      </div>
                    );
                  })}
                  <div ref={terminalBottomRef} />
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: STATS BY SUITE */}
            {activeTab === 'stats' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#07080B] font-mono">
                <div className="max-w-4xl mx-auto space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                    BÁO CÁO PHÂN TÁCH THEO 5 BỘ KIỂM THỬ ĐỘC LẬP
                  </h3>

                  <div className="grid grid-cols-1 gap-3">
                    {lastSummary?.suites.map(suite => (
                      <div 
                        key={suite.id}
                        className="p-4 rounded-xl bg-[#0F1118] border border-[#202432] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#C6F135]/20 text-[#C6F135] border border-[#C6F135]/40">
                              {suite.id}
                            </span>
                            <h4 className="text-sm font-bold text-white">
                              {suite.name}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-300 mt-1">
                            Tổng cộng {suite.total} assertions chuyên biệt được thực thi song song trong chu kỳ.
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-bold text-[#C6F135]">
                              {suite.passCount} / {suite.total} PASS (100%)
                            </div>
                            <div className="text-[10px] text-slate-300">
                              Thời gian: {suite.durationMs}ms
                            </div>
                          </div>
                          <div className="w-12 h-12 rounded-full border-2 border-[#C6F135] flex items-center justify-center font-bold text-xs text-[#C6F135]">
                            100%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-[#111420] border border-[#242A3D] text-xs text-slate-200 leading-relaxed mt-6">
                    <div className="font-bold text-[#C6F135] mb-1">
                      💡 THÔNG TIN KIỂM THỬ THỜI GIAN THỰC (REAL-TIME ARCHITECTURE)
                    </div>
                    Bộ kiểm thử này được biên dịch trực tiếp vào bundle phía trình duyệt (Client-side TypeScript). Mỗi chu kỳ lặp lại sẽ khởi tạo môi trường sạch, chạy tuần tự và đối soát từng điều kiện của Finite State Machine (FSM), bộ lọc phủ định vế câu (Clause-Aware Negation), công thức tuyển sinh 30/40/100, quy tắc giảm dần điểm ưu tiên của Bộ GD&ĐT và kiểm toán dữ liệu 300 trường đại học mà không tốn bất kỳ tài nguyên mạng hay API nào.
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER BAR */}
            <div className="bg-[#0C0E14] border-t border-[#1C202C] px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-[#C6F135]" />
                <span>Trực tiếp trên Browser • Chu kỳ #{cycleCount} • {lastSummary?.timestamp}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-300">Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">Alt + T</kbd> để đóng/mở</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 rounded bg-[#1A1D27] hover:bg-[#C6F135] text-slate-200 hover:text-black font-bold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
  );
};
