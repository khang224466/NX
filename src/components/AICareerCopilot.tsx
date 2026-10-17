import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  KeyRound, 
  X, 
  Bot, 
  User, 
  Check, 
  AlertCircle, 
  HelpCircle,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { 
  getStoredApiKey, 
  setStoredApiKey, 
  getStoredGroqKey,
  setStoredGroqKey,
  getStoredPacingDelay,
  setStoredPacingDelay,
  getStoredAiProvider,
  setStoredAiProvider,
  fetchPacingStatus,
  updateServerPacingConfig,
  cancelPacingTask,
  checkServerAIStatus, 
  sendAIChatMessage, 
  ChatMessage 
} from '../services/geminiService';
import { Clock, ShieldAlert, Cpu, RefreshCw, StopCircle, Sliders } from 'lucide-react';

interface AICareerCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const AICareerCopilot: React.FC<AICareerCopilotProps> = ({
  isOpen,
  onClose,
  initialQuery
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: 'Xin chào bạn. Tôi là Chuyên gia Tư vấn Hướng nghiệp và Tuyển sinh Đại học Việt Nam 2026, kết nối trực tiếp CSDL Kiểm toán Tuyển sinh 2026 (300 trường, 2.158 bản ghi, 36 họ công thức, 39 quy tắc quy đổi).\n\nHệ thống tích hợp cơ chế Điều tiết Tốc độ Gọi API (Smart Request Pacing & Rate Limiting) giúp kiểm soát lưu lượng, tránh lỗi 429 và duy trì ổn định cao nhất.',
      timestamp: 'Ngay bây giờ'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [customGroqKey, setCustomGroqKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq'>('groq');
  const [requestDelayMs, setRequestDelayMs] = useState<number>(2000);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [pacingStatus, setPacingStatus] = useState<any>(null);

  const [serverStatus, setServerStatus] = useState<{ hasServerKey: boolean; hasGroqKey?: boolean; recommendedModel: string }>({
    hasServerKey: false,
    hasGroqKey: false,
    recommendedModel: 'llama-3.3-70b-versatile (Groq Speed)'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkServerAIStatus().then(setServerStatus);
    setCustomKey(getStoredApiKey());
    setCustomGroqKey(getStoredGroqKey());
    setAiProvider(getStoredAiProvider());
    setRequestDelayMs(getStoredPacingDelay());
  }, []);

  // Poll pacing queue status every 1.5s when dialog is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(async () => {
      const status = await fetchPacingStatus();
      if (status) setPacingStatus(status);
    }, 1500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSend(initialQuery);
    }
  }, [initialQuery, isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveSettings = async () => {
    setStoredApiKey(customKey);
    setStoredGroqKey(customGroqKey);
    setStoredAiProvider(aiProvider);
    setStoredPacingDelay(requestDelayMs);
    await updateServerPacingConfig({
      requestDelayMs,
      maxRetries: 3,
      defaultGroqModel: 'llama-3.3-70b-versatile'
    });
    setShowKeyConfig(false);
  };

  const handleCancelActiveTask = async () => {
    if (activeTaskId) {
      await cancelPacingTask(activeTaskId);
    }
    setIsSending(false);
    setActiveTaskId(null);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsSending(true);
    const thisTaskId = `task_${Date.now()}`;
    setActiveTaskId(thisTaskId);

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await sendAIChatMessage(history);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: res.reply,
        sources: res.sources,
        modelUsed: res.modelUsed,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: `Rất tiếc, đã có lỗi kết nối với mô hình AI: ${err?.message || 'Vui lòng kiểm tra lại cấu hình'}.`,
        timestamp: 'Lỗi'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      setActiveTaskId(null);
    }
  };

  const sampleQuestions = [
    'Điểm chuẩn Bách khoa Hà Nội IT1, EE2, MS2 các năm gần đây là bao nhiêu?',
    'Cách tính điểm Thang 100 ĐHBK TP.HCM (70% ĐGNL + 20% THPT + 10% HB)?',
    'Mức lương P25 - P90 của Kỹ sư Thiết kế Vi mạch & Bán dẫn tại Việt Nam?',
    'Với mức điểm 25.5 khối A01, em nên đặt ma trận nguyện vọng thế nào?',
    'Nếu không đỗ Đại học Bách Khoa, học Cao đẳng Kỹ thuật Cao Thắng có tốt không?'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-4xl h-[88vh] bg-[#0A0E15] border border-white/15 rounded-3xl flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0F141D]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-syne text-lg font-bold text-white">
                  NEXORA AI Copilot 2026
                </h3>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-medium">
                  {aiProvider === 'groq' ? 'Groq Console (Rate-Paced)' : 'Google Gemini (Search Grounded)'}
                </span>
                {pacingStatus?.isCoolingDown && (
                  <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3" />
                    Cooldown: {Math.ceil(pacingStatus.remainingCooldownMs / 1000)}s
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A1A1AA]">
                Trợ lý Hướng nghiệp & Tuyển sinh · Pacing {requestDelayMs}ms · Hàng đợi FIFO an toàn
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className="px-3 py-1.5 rounded-lg bg-[#141A25] hover:bg-[#1B2433] text-xs text-blue-400 border border-blue-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Cấu hình Pacing & Khóa API"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">
                {requestDelayMs}ms · {aiProvider.toUpperCase()}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#8E9BAE] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Đóng (Esc)"
            >
              <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/70">Esc</kbd>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rate Limiting & Pacing Configuration Drawer */}
        <AnimatePresence>
          {showKeyConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-4 bg-[#111722] border-b border-white/10 overflow-hidden text-xs"
            >
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    Cấu Hình Điều Tiết Tốc Độ (Request Pacing & Rate Limit)
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Hạn chế lỗi 429 • Max 3 Retries
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select AI Provider */}
                  <div>
                    <label className="text-zinc-300 font-medium block mb-1">Nhà Cung Cấp Mô Hình AI:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiProvider('groq')}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          aiProvider === 'groq'
                            ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                            : 'bg-[#0E141D] border-[#2A3444] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold">Groq Console</div>
                        <div className="text-[10px] text-zinc-400">Llama-3.3-70B • Tốc độ siêu tốc</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiProvider('gemini')}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          aiProvider === 'gemini'
                            ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                            : 'bg-[#0E141D] border-[#2A3444] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold">Google Gemini</div>
                        <div className="text-[10px] text-zinc-400">Search Grounding • Tra cứu web</div>
                      </button>
                    </div>
                  </div>

                  {/* Configurable REQUEST_DELAY_MS */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-zinc-300 font-medium">Khoảng Nghỉ Giữa Request (REQUEST_DELAY_MS):</label>
                      <span className="font-mono font-bold text-blue-400">{requestDelayMs} ms</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="8000"
                      step="250"
                      value={requestDelayMs}
                      onChange={(e) => setRequestDelayMs(parseInt(e.target.value, 10))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-0.5">
                      <span>500ms (Nhanh)</span>
                      <span>2000ms (Mặc định đề xuất)</span>
                      <span>8000ms (Bảo vệ 429)</span>
                    </div>
                  </div>
                </div>

                {/* Groq API Key Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-300 font-medium">Groq API Key (từ console.groq.com):</label>
                    <span className="text-[10px] text-zinc-400 font-mono">Bảo mật cục bộ (Local Only)</span>
                  </div>
                  <input
                    type="password"
                    placeholder="Dán Groq API Key (gsk_...)"
                    value={customGroqKey}
                    onChange={(e) => setCustomGroqKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090D14] border border-white/10 text-xs text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>

                {/* Gemini API Key Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-zinc-300 font-medium">Google Gemini API Key (tùy chọn):</label>
                    <span className="text-[10px] text-zinc-400 font-mono">{customKey ? 'Đã lưu' : 'Mặc định dùng key hệ thống'}</span>
                  </div>
                  <input
                    type="password"
                    placeholder="Dán Gemini API Key (AIzaSy...)"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090D14] border border-white/10 text-xs text-white font-mono outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowKeyConfig(false)}
                    className="px-4 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-all shadow-md"
                  >
                    Lưu Cấu Hình Pacing
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Pacing Queue Status Ribbon */}
        {isSending && (
          <div className="px-6 py-2 bg-blue-950/60 border-b border-blue-500/20 flex items-center justify-between text-xs text-blue-300 font-mono">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>
                {pacingStatus?.isCoolingDown
                  ? `Đang chờ API hết giới hạn (Cooldown: ${Math.ceil(pacingStatus.remainingCooldownMs / 1000)}s)...`
                  : pacingStatus?.queueLength > 1
                  ? `Đang chờ lượt gửi request (Vị trí #${pacingStatus.queueLength} trong hàng đợi)...`
                  : `Đang gửi request qua hàng đợi điều tiết (${requestDelayMs}ms pacing)...`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancelActiveTask}
              className="px-2 py-0.5 rounded bg-red-600/30 hover:bg-red-600 text-red-200 text-[11px] font-sans flex items-center gap-1 cursor-pointer transition-colors"
            >
              <StopCircle className="w-3 h-3" />
              Hủy
            </button>
          </div>
        )}

        {/* Chat message stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#14231E] border border-[#00FF88]/40 flex items-center justify-center text-[#00FF88] shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-[#182330] to-[#1f2e42] border border-[#00F0FF]/30 text-[#ECEEF2] rounded-tr-sm'
                      : 'bg-[#0E141D] border border-white/[0.08] text-[#D8DFEB] rounded-tl-sm'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Grounding sources from Google Search if available */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <span className="text-[10px] font-tabular uppercase tracking-wider text-[#00F0FF] font-semibold block mb-1">
                        🔗 Nguồn Dữ Liệu Tra Cứu Google:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((s, idx) => (
                          <a
                            key={idx}
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-[#A1A1AA] hover:text-[#00F0FF] border border-white/10 transition-colors"
                          >
                            <span className="truncate max-w-[200px]">{s.title || s.url}</span>
                            <span>↗</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-[#64748B] mt-2 font-tabular">
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && (
                      <span className="text-white/30 text-[9px] uppercase">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#182330] border border-white/10 flex items-center justify-center text-[#ECEEF2] shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isSending && (
            <div className="flex gap-3 items-center text-xs text-[#00F0FF] p-3 rounded-2xl bg-white/[0.03] border border-white/10 w-fit">
              <div className="w-7 h-7 rounded-lg bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <span className="italic">NEXORA Copilot đang tìm kiếm Google & sinh phân tích chiến lược...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-6 py-2.5 border-t border-white/[0.04] bg-[#0B0F16] flex gap-2 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-[#71717A] shrink-0 self-center text-[10px] uppercase font-bold tracking-wider">
            Gợi ý hỏi:
          </span>
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-[#141A25] hover:bg-white/10 text-[#A1A1AA] hover:text-white border border-white/10 transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0E131C] flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Hỏi về điểm chuẩn, tổ hợp, ngành học, mức lương thực tế..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-[#080B10] border border-white/10 text-xs sm:text-sm text-[#ECEEF2] placeholder-[#64748B] outline-none focus:border-[#C5A880]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isSending}
            className="px-5 py-3 rounded-xl bg-[#C5A880] text-[#07090D] font-bold text-xs sm:text-sm hover:bg-[#D4B384] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
