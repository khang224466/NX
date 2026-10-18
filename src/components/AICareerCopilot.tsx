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
  Clock, 
  RefreshCw, 
  StopCircle, 
  Sliders, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  ExternalLink,
  CheckCircle2,
  Cpu
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
  getStoredSupremeMode,
  setStoredSupremeMode,
  getStoredSelectedModel,
  setStoredSelectedModel,
  testGeminiApiKey,
  testGroqApiKey,
  fetchPacingStatus,
  fetchGatewayMetrics,
  updateServerPacingConfig,
  cancelPacingTask,
  checkServerAIStatus, 
  sendAIChatMessage, 
  ChatMessage 
} from '../services/geminiService';

interface AICareerCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

function renderFormattedInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      if (boldText.includes('MATCH') || boldText.includes('%')) {
        return (
          <strong key={i} className="text-emerald-300 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
            {boldText}
          </strong>
        );
      }
      if (boldText.includes('Lương') || boldText.includes('Thu nhập') || boldText.includes('P25') || boldText.includes('P90')) {
        return (
          <strong key={i} className="text-amber-300 font-bold bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">
            {boldText}
          </strong>
        );
      }
      return <strong key={i} className="text-white font-bold">{boldText}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      const codeText = part.slice(1, -1);
      return (
        <code
          key={i}
          className="mx-0.5 px-1.5 py-0.5 rounded bg-blue-500/15 text-cyan-300 font-mono text-[11px] border border-blue-500/30 font-semibold"
        >
          {codeText}
        </code>
      );
    }
    return part;
  });
}

const MarkdownMessageView: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');

  return (
    <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-[#D8DFEB]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="border-white/10 my-3" />;
        }

        // Section Headers
        if (
          trimmed.includes('PHẦN 1:') ||
          trimmed.includes('PHẦN 2:') ||
          trimmed.includes('PHẦN 3:') ||
          trimmed.includes('PHẦN 4:') ||
          trimmed.includes('HÀNH ĐỘNG CỤ THỂ') ||
          trimmed.startsWith('###') ||
          trimmed.startsWith('##')
        ) {
          const isP1 = trimmed.includes('PHẦN 1') || trimmed.includes('THIÊN HƯỚNG');
          const isP2 = trimmed.includes('PHẦN 2') || trimmed.includes('TOP 3');
          const isP3 = trimmed.includes('PHẦN 3') || trimmed.includes('MA TRẬN');
          const isP4 = trimmed.includes('PHẦN 4') || trimmed.includes('LỘ TRÌNH');
          const isAction = trimmed.includes('HÀNH ĐỘNG');

          const borderColor = isP1
            ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-200'
            : isP2
            ? 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200'
            : isP3
            ? 'border-amber-500/50 bg-amber-950/30 text-amber-200'
            : isP4
            ? 'border-purple-500/50 bg-purple-950/30 text-purple-200'
            : isAction
            ? 'border-blue-500/50 bg-blue-950/30 text-blue-200'
            : 'border-white/20 bg-white/5 text-white';

          const cleanTitle = trimmed.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '');

          return (
            <div
              key={idx}
              className={`mt-4 mb-2 px-3.5 py-2 rounded-xl border font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm ${borderColor}`}
            >
              <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{cleanTitle}</span>
            </div>
          );
        }

        // Callout quote
        if (trimmed.startsWith('>')) {
          return (
            <div
              key={idx}
              className="border-l-2 border-amber-400 pl-3 py-1.5 my-1.5 text-zinc-300 italic bg-amber-500/10 rounded-r text-xs"
            >
              {renderFormattedInline(trimmed.replace(/^>\s*/, ''))}
            </div>
          );
        }

        // Bullet item
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const text = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-blue-400 font-bold shrink-0 mt-0.5">•</span>
              <div className="flex-1">{renderFormattedInline(text)}</div>
            </div>
          );
        }

        // Numbered list item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 my-1">
              <span className="w-5 h-5 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-300 font-mono text-[11px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                {numMatch[1]}
              </span>
              <div className="flex-1">{renderFormattedInline(numMatch[2])}</div>
            </div>
          );
        }

        return <p key={idx}>{renderFormattedInline(trimmed)}</p>;
      })}
    </div>
  );
};

export const AICareerCopilot: React.FC<AICareerCopilotProps> = ({
  isOpen,
  onClose,
  initialQuery
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Chào bạn! Mình là **Nexora AI** — Cố vấn hướng nghiệp & tuyển sinh đại học 2026.

Bạn đang quan tâm đến ngành nghề nào hoặc muốn tìm trường theo điểm thi và sở thích (như thể thao, công nghệ, kinh doanh, nghệ thuật...)? Hãy nhắn cho mình nhé!

💡 *Mẹo: Bạn có thể chọn các câu hỏi gợi ý bên dưới hoặc bấm nút **[Cài API Key]** ở góc trên để kết nối trực tiếp Gemini / Groq.*`,
      timestamp: 'Ngay bây giờ'
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [customGroqKey, setCustomGroqKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq'>('gemini');
  const [isSupremeMode, setIsSupremeMode] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash');
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [testKeyStatus, setTestKeyStatus] = useState<{ testing: boolean; message: string; success?: boolean } | null>(null);

  const [requestDelayMs, setRequestDelayMs] = useState<number>(2000);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [pacingStatus, setPacingStatus] = useState<any>(null);

  const [serverStatus, setServerStatus] = useState<{ hasServerKey: boolean; hasGroqKey?: boolean; recommendedModel: string }>({
    hasServerKey: false,
    hasGroqKey: false,
    recommendedModel: 'gemini-2.0-flash (Mode Supreme)'
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkServerAIStatus().then(setServerStatus);
    setCustomKey(getStoredApiKey());
    setCustomGroqKey(getStoredGroqKey());
    setAiProvider(getStoredAiProvider());
    setRequestDelayMs(getStoredPacingDelay());
    setIsSupremeMode(getStoredSupremeMode());
    setSelectedModel(getStoredSelectedModel());
  }, []);

  const [gatewayMetrics, setGatewayMetrics] = useState<any>(null);

  // Poll pacing queue status every 1.5s when dialog is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(async () => {
      const status = await fetchPacingStatus();
      if (status) setPacingStatus(status);
    }, 1500);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Poll Multi-Provider Gateway Metrics when config drawer is open
  useEffect(() => {
    if (!showKeyConfig) return;
    const loadMetrics = async () => {
      const data = await fetchGatewayMetrics();
      if (data) setGatewayMetrics(data);
    };
    loadMetrics();
    const interval = setInterval(loadMetrics, 2500);
    return () => clearInterval(interval);
  }, [showKeyConfig]);

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

  const handleToggleSupremeMode = () => {
    const nextVal = !isSupremeMode;
    setIsSupremeMode(nextVal);
    setStoredSupremeMode(nextVal);
  };

  const handleTestKey = async () => {
    setTestKeyStatus({ testing: true, message: 'Đang gửi ping kiểm tra kết nối API trực tiếp...' });
    if (aiProvider === 'gemini') {
      if (!customKey.trim()) {
        setTestKeyStatus({ testing: false, message: 'Vui lòng dán Google Gemini API Key trước!', success: false });
        return;
      }
      const res = await testGeminiApiKey(customKey, selectedModel);
      setTestKeyStatus({ testing: false, message: res.message, success: res.success });
    } else {
      if (!customGroqKey.trim()) {
        setTestKeyStatus({ testing: false, message: 'Vui lòng dán Groq API Key trước!', success: false });
        return;
      }
      const res = await testGroqApiKey(customGroqKey);
      setTestKeyStatus({ testing: false, message: res.message, success: res.success });
    }
  };

  const handleSaveSettings = async () => {
    setStoredApiKey(customKey);
    setStoredGroqKey(customGroqKey);
    setStoredAiProvider(aiProvider);
    setStoredSupremeMode(isSupremeMode);
    setStoredSelectedModel(selectedModel);
    setStoredPacingDelay(requestDelayMs);
    await updateServerPacingConfig({
      requestDelayMs,
      maxRetries: 3,
      defaultGroqModel: 'llama-3.3-70b-versatile'
    });
    setShowKeyConfig(false);
    setTestKeyStatus(null);
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

      const res = await sendAIChatMessage(history, undefined, {
        isSupremeMode,
        selectedModel,
        provider: aiProvider
      });
      
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
        content: `Rất tiếc, đã có lỗi kết nối với mô hình AI: ${err?.message || 'Vui lòng kiểm tra lại API Key hoặc mạng'}.`,
        timestamp: 'Lỗi'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
      setActiveTaskId(null);
    }
  };

  const sampleQuestions = [
    '⚽ Em thích đá banh / thể thao thì học ngành gì, trường nào?',
    '💻 Tư vấn định hướng Công nghệ thông tin & Trí tuệ nhân tạo',
    '💼 Ngành Kinh doanh, Marketing & Logistics cơ hội ra sao?',
    '🏛️ Điểm tầm 24–26 nên lập ma trận 3 tầng trường thế nào?',
    '🔄 Khi lỡ chọn ngành không hợp thì có cách chuyển hướng an toàn nào?'
  ];

  if (!isOpen) return null;

  const hasConfiguredKey = (aiProvider === 'gemini' && !!customKey) || (aiProvider === 'groq' && !!customGroqKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-3xl h-[82vh] max-h-[740px] min-h-[460px] bg-[#0A0E15] border border-white/15 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0F141D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-amber-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-syne text-lg font-bold text-white flex items-center gap-1.5">
                  Nexora AI Hướng Nghiệp
                </h3>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 font-medium">
                  Tuyển Sinh 2026
                </span>
                {pacingStatus?.isCoolingDown && (
                  <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3" />
                    Cooldown: {Math.ceil(pacingStatus.remainingCooldownMs / 1000)}s
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#A1A1AA]">
                Cố Vấn Hướng Nghiệp Tối Cao · 300 Trường Đại Học · 219 Tổ Hợp Tuyển Sinh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Supreme Toggle Pill in Header */}
            <button
              type="button"
              onClick={handleToggleSupremeMode}
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-sm ${
                isSupremeMode
                  ? 'bg-gradient-to-r from-amber-500/25 via-orange-500/25 to-yellow-500/25 border-amber-400/60 text-amber-300 shadow-amber-500/20'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
              title="Bật/Tắt chế độ phân tích chuyên sâu 4 chiều (Holland RIASEC, Top 3 ngành, Ma trận 3 tầng trường, Lộ trình 4 năm)"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSupremeMode ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
              <span className="hidden sm:inline">MODE SUPREME:</span>
              <span>{isSupremeMode ? 'BẬT ⚡' : 'TẮT'}</span>
            </button>

            {/* API Key / Provider Button */}
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                hasConfiguredKey
                  ? 'bg-[#141A25] hover:bg-[#1B2433] text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse'
              }`}
              title="Cấu hình API Key & Mô hình"
            >
              {hasConfiguredKey ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[11px]">
                    {aiProvider === 'gemini' ? (selectedModel.includes('2.0') ? 'Gemini 2.0' : 'Gemini') : 'Groq 70B'}
                  </span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-[11px]">Cài API Key</span>
                </>
              )}
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

        {/* Configuration Drawer */}
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
                    Cấu Hình API Key & Trí Tuệ Nhân Tạo Mode Supreme
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Bảo Mật Trực Tiếp Trong Trình Duyệt (Local Only)
                  </span>
                </div>

                {/* Mode Supreme Spotlight Toggle */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>MODE SUPREME: Phân Tích Chuyên Gia 4 Chiều</span>
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">KHUYÊN DÙNG</span>
                      </div>
                      <p className="text-[11px] text-zinc-300">
                        (1) Holland RIASEC & Ikigai • (2) Top 3 ngành & lương GSO • (3) Ma trận 3 tầng trường 2026 • (4) Lộ trình 4 năm
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSupremeMode(!isSupremeMode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSupremeMode
                        ? 'bg-amber-400 text-black font-bold shadow-md shadow-amber-500/30'
                        : 'bg-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isSupremeMode ? 'ĐANG BẬT ⚡' : 'ĐANG TẮT'}
                  </button>
                </div>

                {/* 100-Concurrent-User AI Gateway Monitor Card */}
                {gatewayMetrics && (
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                    <div className="flex items-center justify-between text-blue-300 font-bold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        Trạng Thái Cụm Gateway Chịu Tải 100 Người Dùng Đồng Thời:
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {gatewayMetrics.activeClients} / {gatewayMetrics.maxClients} Clients Kết Nối
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-zinc-300">
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                        <span className="text-zinc-500 block">In-Flight LLM:</span>
                        <span className="text-amber-300 font-bold">{gatewayMetrics.inFlight} / {gatewayMetrics.maxInFlight} max</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                        <span className="text-zinc-500 block">Queue Chờ:</span>
                        <span className="text-cyan-300 font-bold">{gatewayMetrics.queuedTasks} / {gatewayMetrics.maxQueue}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-black/50 border border-white/5">
                        <span className="text-zinc-500 block">Circuit State:</span>
                        <span className="text-emerald-400 font-bold">{gatewayMetrics.pools?.[0]?.circuitState || 'HEALTHY'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select AI Provider */}
                  <div>
                    <label className="text-zinc-300 font-medium block mb-1">Chọn Động Cơ AI:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiProvider('gemini')}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          aiProvider === 'gemini'
                            ? 'bg-blue-600/25 border-blue-500 text-white font-bold'
                            : 'bg-[#0E141D] border-[#2A3444] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1 text-xs">
                          <span>Google Gemini</span>
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 rounded">Ưu tiên</span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Gemini 2.0 Flash • 1.5 Pro</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiProvider('groq')}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          aiProvider === 'groq'
                            ? 'bg-blue-600/25 border-blue-500 text-white font-bold'
                            : 'bg-[#0E141D] border-[#2A3444] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs">Groq Console</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">Llama-3.3-70B • Siêu tốc</div>
                      </button>
                    </div>
                  </div>

                  {/* Select Model if Gemini */}
                  {aiProvider === 'gemini' ? (
                    <div>
                      <label className="text-zinc-300 font-medium block mb-1">Phiên Bản Mô Hình Gemini:</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#090D14] border border-white/10 text-xs text-white font-mono outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="gemini-2.0-flash">gemini-2.0-flash (Mới nhất, siêu nhanh & thông minh)</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro (Lý luận sâu sắc, phân tích học thuật)</option>
                        <option value="gemini-1.5-flash">gemini-1.5-flash (Tốc độ tối ưu)</option>
                      </select>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        Khuyên dùng <code className="text-cyan-300">gemini-2.0-flash</code> để đạt hiệu suất cao nhất.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="text-zinc-300 font-medium block mb-1">Mô Hình Groq:</label>
                      <input
                        type="text"
                        disabled
                        value="llama-3.3-70b-versatile (70 Tỷ Tham Số)"
                        className="w-full px-3 py-2 rounded-xl bg-[#090D14] border border-white/10 text-xs text-zinc-300 font-mono opacity-80"
                      />
                    </div>
                  )}
                </div>

                {/* API Key Inputs */}
                {aiProvider === 'gemini' ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                        Google Gemini API Key:
                      </label>
                      <a
                        href="https://aistudio.google.com/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-sans"
                      >
                        <span>Lấy API key miễn phí tại Google AI Studio</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showSecretKey ? 'text' : 'password'}
                        placeholder="Dán Gemini API Key (bắt đầu bằng AIzaSy...)"
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        className="w-full px-3 py-2 pr-10 rounded-xl bg-[#090D14] border border-white/10 text-xs text-white font-mono outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                        Groq API Key:
                      </label>
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-sans"
                      >
                        <span>Lấy API key tại Groq Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showSecretKey ? 'text' : 'password'}
                        placeholder="Dán Groq API Key (bắt đầu bằng gsk_...)"
                        value={customGroqKey}
                        onChange={(e) => setCustomGroqKey(e.target.value)}
                        className="w-full px-3 py-2 pr-10 rounded-xl bg-[#090D14] border border-white/10 text-xs text-white font-mono outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                      >
                        {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Test Key Status Banner */}
                {testKeyStatus && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs ${
                      testKeyStatus.testing
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        : testKeyStatus.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}
                  >
                    {testKeyStatus.testing ? (
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                    ) : testKeyStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{testKeyStatus.message}</span>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={testKeyStatus?.testing}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testKeyStatus?.testing ? 'animate-spin' : ''}`} />
                    <span>Kiểm Tra Kết Nối Key</span>
                  </button>

                  <div className="flex gap-2">
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
                      className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold cursor-pointer transition-all shadow-md"
                    >
                      Lưu & Kích Hoạt
                    </button>
                  </div>
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
                  : `Đang phân tích đa chiều Mode Supreme & đối soát 300 trường...`}
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {hasConfiguredKey && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] text-emerald-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  Đang kết nối: <strong>{aiProvider === 'gemini' ? selectedModel : 'Groq Llama-3.3-70B'}</strong>
                  {isSupremeMode ? ' · ⚡ MODE SUPREME BẬT' : ''}
                </span>
              </div>
              <button
                onClick={() => setShowKeyConfig(true)}
                className="text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Cấu hình
              </button>
            </div>
          )}

          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#14231E] border border-[#00FF88]/40 flex items-center justify-center text-[#00FF88] shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4 text-amber-300" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-[#182330] to-[#1f2e42] border border-[#00F0FF]/30 text-[#ECEEF2] rounded-tr-sm'
                      : 'bg-[#0E141D] border border-white/[0.08] text-[#D8DFEB] rounded-tl-sm'
                  }`}
                >
                  <MarkdownMessageView content={msg.content} />

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
                      <span className="text-white/40 text-[9px] uppercase font-mono">
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
              <span className="italic">Nexora AI đang phân tích dữ liệu 300 trường & sinh lộ trình chiến lược...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-4 py-2 border-t border-white/[0.04] bg-[#0B0F16] flex gap-2 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-[#71717A] shrink-0 self-center text-[10px] uppercase font-bold tracking-wider">
            Gợi ý:
          </span>
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="whitespace-nowrap px-3 py-1 rounded-full bg-[#141A25] hover:bg-white/10 text-[#A1A1AA] hover:text-white border border-white/10 transition-all cursor-pointer text-xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-3.5 border-t border-white/[0.08] bg-[#0E131C] flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Hỏi về chọn ngành, tổ hợp thi, điểm chuẩn 2026, ma trận trường hoặc lộ trình học..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#080B10] border border-white/10 text-xs sm:text-sm text-[#ECEEF2] placeholder-[#64748B] outline-none focus:border-[#C5A880]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isSending}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A880] to-[#E5C8A0] text-[#07090D] font-bold text-xs sm:text-sm hover:from-[#D4B384] hover:to-[#F5D8B0] transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Gửi</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
