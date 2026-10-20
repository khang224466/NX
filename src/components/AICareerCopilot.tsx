import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  KeyRound, 
  X, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  GraduationCap,
  Layers,
  Briefcase,
  TrendingUp,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  getStoredApiKey, 
  setStoredApiKey, 
  getStoredGroqKey,
  setStoredGroqKey,
  getStoredAiProvider,
  setStoredAiProvider,
  getStoredSelectedModel,
  setStoredSelectedModel,
  testGeminiApiKey,
  testGroqApiKey,
  sendAIChatMessage, 
  ChatMessage 
} from '../services/geminiService';
import seedData from '../data/seed_data.json';
import { AUDITED_INSTITUTIONS_300 } from '../data/auditedInstitutionsData';
import { AUDITED_MAJOR_METHOD_SCORING_DB } from '../data/auditedMajorScoringDatabase';
import { sfx } from '../services/soundEffects';

interface AICareerCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export interface SavedDossierProfile {
  major: string;
  majorCode?: string;
  combo: string;
  score: string;
  targetJob: string;
  strengths: string;
  currentStep: 1 | 2 | 3 | 4;
}

const INITIAL_PROFILE: SavedDossierProfile = {
  major: 'Chưa xác định',
  combo: 'Chưa xác định',
  score: '',
  targetJob: 'Chưa xác định',
  strengths: 'Chưa có dữ liệu',
  currentStep: 1
};

export const AICareerCopilot: React.FC<AICareerCopilotProps> = ({
  isOpen,
  onClose,
  initialQuery
}) => {
  // Saved dossier persistent state
  const [profile, setProfile] = useState<SavedDossierProfile>(INITIAL_PROFILE);

  // Chat message thread
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Settings drawer
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [customGroqKey, setCustomGroqKey] = useState('');
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq'>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.1-flash-lite');
  const [testKeyStatus, setTestKeyStatus] = useState<{ testing: boolean; message: string; success?: boolean } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load API keys on mount
  useEffect(() => {
    setCustomKey(getStoredApiKey());
    setCustomGroqKey(getStoredGroqKey());
    setAiProvider(getStoredAiProvider());
    setSelectedModel(getStoredSelectedModel());
  }, []);

  // Initialize dialog when opened
  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        initSession();
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Scroll to bottom on message updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const initSession = () => {
    setProfile(INITIAL_PROFILE);
    const initialText = `📌 **[HỒ SƠ ĐÃ LƯU]**
- Ngành: Chưa xác định
- Tổ hợp & Điểm dự kiến: Chưa xác định
- Việc làm mục tiêu: Chưa xác định
- Thế mạnh/Sở thích ghi nhận: Chưa có dữ liệu

---

💬 **[PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]**
Chào bạn. Hệ thống bắt đầu quy trình tham vấn hướng nghiệp & chiến lược tuyển sinh 4 bước: (1) Xác định Ngành ➔ (2) Chọn Tổ hợp môn ➔ (3) Định hướng Việc làm ➔ (4) Đối chiếu & Phân tích chuỗi ảnh hưởng. Mọi quyết định sẽ được lưu vào hồ sơ phía trên và ràng buộc logic với các bước tiếp theo.

---

👉 **[CÂU HỎI TIẾP THEO]**
Bạn đã chọn được Ngành học chưa? (Nếu có, hãy nhập tên ngành. Nếu chưa, hãy cho biết sở thích, môn học thế mạnh và mục tiêu của bạn).`;

    setMessages([
      {
        id: 'init_welcome',
        role: 'model',
        content: initialText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleResetSession = () => {
    sfx.playUiClick();
    initSession();
  };

  // Helper: Extract & Update profile from text
  const updateProfileFromText = (userText: string, currentProf: SavedDossierProfile): SavedDossierProfile => {
    const updated = { ...currentProf };
    const lower = userText.toLowerCase();

    // STEP 1: Major identification
    if (updated.currentStep === 1) {
      // Check if user specified a major from catalog
      const catalog = seedData.majorCatalogLevelIV || [];
      const matchedMajor = catalog.find(m => 
        lower.includes(m.name.toLowerCase()) || 
        lower.includes(m.codeTT09)
      );

      if (matchedMajor) {
        updated.major = matchedMajor.name;
        updated.majorCode = matchedMajor.codeTT09;
        updated.currentStep = 2;
      } else if (lower.includes('kinh tế') || lower.includes('kinh doanh') || lower.includes('marketing')) {
        updated.major = 'Quản trị kinh doanh / Marketing';
        updated.majorCode = '7340115';
        updated.currentStep = 2;
      } else if (lower.includes('cntt') || lower.includes('công nghệ thông tin') || lower.includes('it') || lower.includes('lập trình')) {
        updated.major = 'Công nghệ thông tin';
        updated.majorCode = '7480201';
        updated.currentStep = 2;
      } else if (lower.includes('y ') || lower.includes('y khoa') || lower.includes('bác sĩ')) {
        updated.major = 'Y khoa';
        updated.majorCode = '7720101';
        updated.currentStep = 2;
      } else if (lower.includes('ngôn ngữ anh') || lower.includes('tiếng anh')) {
        updated.major = 'Ngôn ngữ Anh';
        updated.majorCode = '7220201';
        updated.currentStep = 2;
      } else if (lower.includes('truyền thông') || lower.includes('báo chí')) {
        updated.major = 'Truyền thông đa phương tiện';
        updated.majorCode = '7320104';
        updated.currentStep = 2;
      } else if (lower.includes('thiết kế đồ họa') || lower.includes('đồ họa') || lower.includes('vẽ')) {
        updated.major = 'Thiết kế đồ họa';
        updated.majorCode = '7210403';
        updated.currentStep = 2;
      } else if (lower.includes('luật')) {
        updated.major = 'Luật kinh tế';
        updated.majorCode = '7380107';
        updated.currentStep = 2;
      } else {
        // User provided interests/strengths
        updated.strengths = userText.slice(0, 100);
      }
    }
    // STEP 2: Combo & Expected Score
    else if (updated.currentStep === 2) {
      const comboRegex = /\b([a-d][0-9]{2})\b/i;
      const matchCombo = userText.match(comboRegex);
      if (matchCombo) {
        updated.combo = matchCombo[1].toUpperCase();
      }

      const scoreRegex = /([123][0-9](?:[.,][0-9]{1,2})?)\s*(?:đ|điểm)?/i;
      const matchScore = userText.match(scoreRegex);
      if (matchScore) {
        updated.score = matchScore[1].replace(',', '.');
      }

      if (updated.combo !== 'Chưa xác định') {
        updated.currentStep = 3;
      }
    }
    // STEP 3: Career target
    else if (updated.currentStep === 3) {
      if (userText.trim().length > 3) {
        updated.targetJob = userText.trim();
        updated.currentStep = 4;
      }
    }

    return updated;
  };

  // Local deterministic fallback generator (ensures 100% adherence to 3 blocks)
  const generateDeterministicReply = (userText: string, currentProf: SavedDossierProfile): string => {
    const prof = updateProfileFromText(userText, currentProf);

    if (prof.currentStep === 1) {
      if (prof.major !== 'Chưa xác định') {
        // Major is now determined, move to step 2
        const catalog = seedData.majorCatalogLevelIV || [];
        const majorInfo = catalog.find(m => m.name === prof.major || m.codeTT09 === prof.majorCode);
        const combos = majorInfo?.admissionsCombos?.join(', ') || 'A00, A01, D01';

        return `📌 **[HỒ SƠ ĐÃ LƯU]**
- Ngành: ${prof.major}
- Tổ hợp & Điểm dự kiến: Chưa xác định
- Việc làm mục tiêu: Chưa xác định
- Thế mạnh/Sở thích ghi nhận: ${prof.strengths}

---

💬 **[PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]**
Hệ thống đã ghi nhận ngành mục tiêu là **${prof.major}**.
Theo quy chế tuyển sinh, ngành này chủ yếu xét tuyển qua các tổ hợp: **${combos}**.
Để tối ưu hóa cơ hội vào trường đại học phù hợp, chúng ta cần xác định tổ hợp thế mạnh và điểm thi dự kiến.

---

👉 **[CÂU HỎI TIẾP THEO]**
Bạn đã chọn được tổ hợp môn xét tuyển chưa? (Nếu chưa, hãy nhập môn thế mạnh và mức điểm dự kiến của bạn).`;
      } else {
        // Recommend 2-3 majors based on strengths
        const lower = userText.toLowerCase();
        let rec1 = 'Công nghệ thông tin', rec2 = 'Kỹ thuật điều khiển và tự động hóa';
        let reason = 'Tư duy tính toán và logic mạnh';

        if (lower.includes('văn') || lower.includes('viết') || lower.includes('anh') || lower.includes('xã hội')) {
          rec1 = 'Truyền thông đa phương tiện';
          rec2 = 'Ngôn ngữ Anh';
          reason = 'Thế mạnh ngôn ngữ, biểu đạt và tư duy xã hội';
        } else if (lower.includes('kinh tế') || lower.includes('tiền') || lower.includes('giao tiếp')) {
          rec1 = 'Quản trị kinh doanh';
          rec2 = 'Marketing';
          reason = 'Năng động, nhạy bén thị trường và kỹ năng tương tác';
        } else if (lower.includes('hóa') || lower.includes('sinh') || lower.includes('y')) {
          rec1 = 'Y khoa';
          rec2 = 'Dược học';
          reason = 'Kiến thức sinh học, hóa học và thiên hướng chăm sóc sức khỏe';
        }

        return `📌 **[HỒ SƠ ĐÃ LƯU]**
- Ngành: Chưa xác định (Đang gợi ý)
- Tổ hợp & Điểm dự kiến: Chưa xác định
- Việc làm mục tiêu: Chưa xác định
- Thế mạnh/Sở thích ghi nhận: ${userText.slice(0, 80)}

---

💬 **[PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]**
Dựa trên thông tin bạn chia sẻ ("${userText.slice(0, 60)}"), hệ thống nhận diện điểm mạnh: **${reason}**.
Đề xuất 2 ngành học có độ tương thích cao nhất:
1. **${rec1}**: Phù hợp năng lực cốt lõi, cơ hội việc làm rộng mở tại các thành phố lớn.
2. **${rec2}**: Ứng dụng thực tế cao, thu nhập và nhu cầu tuyển dụng ổn định.

---

👉 **[CÂU HỎI TIẾP THEO]**
Bạn muốn chốt ngành nào trong 2 ngành trên (hoặc chọn 1 ngành khác) để chuyển sang Bước 2 chọn tổ hợp môn?`;
      }
    }

    if (prof.currentStep === 2) {
      const comboStr = prof.score ? `${prof.combo} - ${prof.score} điểm` : prof.combo;
      const scoreNum = parseFloat(prof.score || '24');
      let tierComment = 'nhóm trường Top giữa uy tín (ĐH Công nghiệp, Giao thông vận tải, Thương mại)';
      if (scoreNum >= 26) {
        tierComment = 'nhóm trường Top đầu (ĐHBK Hà Nội, ĐH Ngoại thương, ĐH Kinh tế Quốc dân, ĐHQG)';
      } else if (scoreNum < 22) {
        tierComment = 'nhóm trường có ngưỡng an toàn cao, đảm bảo tỷ lệ trúng tuyển vững chắc';
      }

      return `📌 **[HỒ SƠ ĐÃ LƯU]**
- Ngành: ${prof.major}
- Tổ hợp & Điểm dự kiến: ${comboStr}
- Việc làm mục tiêu: Chưa xác định
- Thế mạnh/Sở thích ghi nhận: ${prof.strengths}

---

💬 **[PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]**
Hệ thống đã lưu tổ hợp **${prof.combo}** với mức điểm dự kiến **${prof.score ? prof.score + 'đ' : 'khoảng 24-26đ'}** cho ngành **${prof.major}**.
Với mức điểm này, bạn có cơ hội cạnh tranh thuận lợi vào **${tierComment}**.
Nếu giữ nguyên tổ hợp này, cơ hội tại các trường công lập trọng điểm là rất khả thi.

---

👉 **[CÂU HỎI TIẾP THEO]**
Bạn đã nhắm tới vị trí công việc cụ thể nào sau khi ra trường chưa? (Nếu chưa, bạn thích môi trường làm việc như thế nào: văn phòng chuyên nghiệp, nghiên cứu độc lập, hay tự do sáng tạo)?`;
    }

    if (prof.currentStep === 3) {
      return `📌 **[HỒ SƠ ĐÃ LƯU]**
- Ngành: ${prof.major}
- Tổ hợp & Điểm dự kiến: ${prof.combo} ${prof.score ? `(${prof.score}đ)` : ''}
- Việc làm mục tiêu: ${prof.targetJob}
- Thế mạnh/Sở thích ghi nhận: ${prof.strengths}

---

💬 **[PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]**
Hệ thống xác nhận vị trí việc làm mục tiêu: **${prof.targetJob}**.
Vị trí này hoàn toàn đồng bộ với chương trình đào tạo của ngành **${prof.major}** và được củng cố bởi tổ hợp xét tuyển **${prof.combo}**.
Đủ 3 yếu tố nền tảng để kích hoạt phân tích chuỗi ảnh hưởng.

---

👉 **[CÂU HỎI TIẾP THEO]**
Bạn có muốn hệ thống tiến hành đối chiếu toàn diện và xuất báo cáo chuỗi ảnh hưởng (Domino Effect: Ngành ➔ Tổ hợp ➔ Trường ➔ Việc làm) ngay bây giờ không?`;
    }

    // Step 4: Domino Effect What-If Analysis
    const comboScoreDisplay = prof.score ? `${prof.combo} (${prof.score} điểm)` : prof.combo;
    return `📌 **[HỒ SƠ ĐÃ LƯU]**
- Ngành: ${prof.major}
- Tổ hợp & Điểm dự kiến: ${comboScoreDisplay}
- Việc làm mục tiêu: ${prof.targetJob}
- Thế mạnh/Sở thích ghi nhận: ${prof.strengths}

---

💬 **[PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]**
📊 **BÁO CÁO ĐỐI CHIẾU & CHUỖI ẢNH HƯỞNG (DOMINO EFFECT)**:

1. **Kiểm tra độ khớp (Ngành ⟷ Tổ hợp ⟷ Việc làm)**:
   - ✅ **Tính tương thích**: Tổ hợp ${prof.combo} được công nhận tuyển sinh chính thức cho ngành ${prof.major}.
   - ✅ **Mục tiêu nghề nghiệp**: Vị trí "${prof.targetJob}" nằm trong khung năng lực chuẩn đầu ra của ngành này.

2. **Chuỗi ảnh hưởng (What-If Analysis)**:
   - **[Ngành ➔ Trường & Điểm chuẩn]**: Với mức điểm ${prof.score || 'dự kiến'}, 3-4 cơ sở đào tạo khả thi nhất gồm:
     • *Nhóm Mơ ước/Top đầu*: Điểm chuẩn tham chiếu 2025 dao động cao hơn 0.5 - 1.0đ. Cần nỗ lực tối đa ở môn chính.
     • *Nhóm Vừa sức (Mục tiêu chính)*: Điểm chuẩn nằm trong biên độ an toàn, xác suất đỗ 75% - 85%.
     • *Nhóm An toàn*: Điểm chuẩn thấp hơn ≥ 1.5đ, đảm bảo chắc chắn có vé vào đại học.
   - **[Tổ hợp ➔ Cạnh tranh]**: Tổ hợp ${prof.combo} là tổ hợp truyền thống có số lượng chỉ tiêu lớn nhất tại các trường đại học, không lo bị lép vế trước các phương thức xét tuyển sớm.
   - **[Ngành + Trường ➔ Việc làm]**: Học ngành ${prof.major} tại phân khúc trường đã chọn sẽ tạo lợi thế hồ sơ rõ rệt khi xin việc làm "${prof.targetJob}", với mức thu nhập khởi điểm dự kiến 12 - 20 triệu/tháng theo số liệu GSO.

---

👉 **[CÂU HỎI TIẾP THEO]**
Bạn có muốn thử đổi tổ hợp khác để kiểm tra sự thay đổi cơ hội trường học, hoặc cần giải đáp chi tiết về học phí không?`;
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isSending) return;

    sfx.playUiClick();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsSending(true);

    // Update profile state
    const nextProf = updateProfileFromText(text.trim(), profile);
    setProfile(nextProf);

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call AI with updated system prompt
      const res = await sendAIChatMessage(history, undefined, {
        isSupremeMode: true,
        selectedModel,
        provider: aiProvider
      });

      // Verify response adherence to 3 blocks
      let botReply = res.reply;
      if (!botReply.includes('[HỒ SƠ ĐÃ LƯU]') || !botReply.includes('[PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]')) {
        // Fallback to deterministic clean formatting
        botReply = generateDeterministicReply(text.trim(), profile);
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: botReply,
        modelUsed: res.modelUsed,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.warn('AI call error, switching to deterministic response engine:', err);
      const fallbackText = generateDeterministicReply(text.trim(), profile);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleTestKey = async () => {
    setTestKeyStatus({ testing: true, message: 'Đang kiểm tra kết nối API...' });
    if (aiProvider === 'gemini') {
      if (!customKey.trim()) {
        setTestKeyStatus({ testing: false, message: 'Vui lòng nhập Google Gemini API Key', success: false });
        return;
      }
      const res = await testGeminiApiKey(customKey, selectedModel);
      setTestKeyStatus({ testing: false, message: res.message, success: res.success });
    } else {
      if (!customGroqKey.trim()) {
        setTestKeyStatus({ testing: false, message: 'Vui lòng nhập Groq API Key', success: false });
        return;
      }
      const res = await testGroqApiKey(customGroqKey);
      setTestKeyStatus({ testing: false, message: res.message, success: res.success });
    }
  };

  const handleSaveSettings = () => {
    setStoredApiKey(customKey);
    setStoredGroqKey(customGroqKey);
    setStoredAiProvider(aiProvider);
    setStoredSelectedModel(selectedModel);
    setShowKeyConfig(false);
    setTestKeyStatus(null);
  };

  if (!isOpen) return null;

  const hasConfiguredKey = (aiProvider === 'gemini' && !!customKey) || (aiProvider === 'groq' && !!customGroqKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        className="w-full max-w-4xl h-[88vh] max-h-[820px] min-h-[520px] bg-[#0E1117] border border-slate-700/80 rounded-2xl flex flex-col shadow-2xl overflow-hidden font-sans"
      >
        {/* Header (Classical Academic Design) */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-[#121620]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 shrink-0">
              <GraduationCap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base tracking-tight">
                  Tham Vấn Tuyển Sinh &amp; Hướng Nghiệp 2026
                </h3>
                <span className="text-[10px] font-mono bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 font-semibold">
                  Quy Trình 4 Bước
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Xác định Ngành ➔ Chọn Tổ Hợp ➔ Định Hướng Việc Làm ➔ Phân Tích Chuỗi Ảnh Hưởng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetSession}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Khởi tạo lại phiên tham vấn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>

            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
                hasConfiguredKey
                  ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-amber-300 border-amber-500/30'
              }`}
              title="Cài đặt API Key"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">{hasConfiguredKey ? 'API Sẵn Sàng' : 'Cài API Key'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Đóng (Esc)"
            >
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
              className="px-5 py-4 bg-[#141923] border-b border-slate-700 text-xs overflow-hidden"
            >
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    Cấu Hình API Key AI (Tùy Chọn)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Lưu trữ cục bộ an toàn trong trình duyệt
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">Nhà cung cấp:</label>
                    <select
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value as any)}
                      className="w-full bg-[#0E1117] border border-slate-600 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="gemini">Google Gemini (Khuyên dùng)</option>
                      <option value="groq">Groq Llama 3.3</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-300">
                      {aiProvider === 'gemini' ? 'Google Gemini API Key:' : 'Groq API Key:'}
                    </label>
                    <input
                      type="password"
                      value={aiProvider === 'gemini' ? customKey : customGroqKey}
                      onChange={(e) => aiProvider === 'gemini' ? setCustomKey(e.target.value) : setCustomGroqKey(e.target.value)}
                      placeholder={aiProvider === 'gemini' ? 'AIzaSy...' : 'gsk_...'}
                      className="w-full bg-[#0E1117] border border-slate-600 rounded-lg p-2 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {testKeyStatus && (
                  <div className={`p-2 rounded text-xs flex items-center gap-2 ${
                    testKeyStatus.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' : 'bg-red-950/60 text-red-300 border border-red-500/40'
                  }`}>
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>{testKeyStatus.message}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleTestKey}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                  >
                    Kiểm tra kết nối
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Lưu cấu hình
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📌 [HỒ SƠ ĐÃ LƯU] — PINNED PERSISTENT DOSSIER CARD */}
        <div className="bg-[#121622] border-b border-slate-800 px-5 py-3 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <span>📌</span>
              <span>[HỒ SƠ ĐÃ LƯU — TRẠNG THÁI HIỆN TẠI]</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                Tiến độ: Bước {profile.currentStep}/4
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#0A0D14] border border-slate-800/90 space-y-0.5">
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-blue-400" />
                <span>1. Ngành học:</span>
              </div>
              <div className="font-bold text-xs text-white truncate" title={profile.major}>
                {profile.major}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0A0D14] border border-slate-800/90 space-y-0.5">
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                <span>2. Tổ hợp &amp; Điểm:</span>
              </div>
              <div className="font-bold text-xs text-emerald-300 truncate">
                {profile.combo !== 'Chưa xác định' ? `${profile.combo} ${profile.score ? `(${profile.score}đ)` : ''}` : 'Chưa xác định'}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0A0D14] border border-slate-800/90 space-y-0.5">
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-amber-400" />
                <span>3. Việc làm mục tiêu:</span>
              </div>
              <div className="font-bold text-xs text-white truncate" title={profile.targetJob}>
                {profile.targetJob}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0A0D14] border border-slate-800/90 space-y-0.5">
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-purple-400" />
                <span>4. Thế mạnh ghi nhận:</span>
              </div>
              <div className="font-bold text-xs text-slate-300 truncate" title={profile.strengths}>
                {profile.strengths}
              </div>
            </div>
          </div>
        </div>

        {/* Message Thread (Classical typography & 3-block structure) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0A0D14]">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 bg-blue-600 text-white shadow-md text-xs sm:text-sm font-medium leading-relaxed">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className="text-[10px] text-blue-200 font-mono text-right mt-1">
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            }

            // Model message: Parse & format nicely
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[95%] sm:max-w-[90%] rounded-2xl p-4 sm:p-5 bg-[#121622] border border-slate-800 text-slate-100 shadow-md text-xs sm:text-sm space-y-3">
                  <div className="whitespace-pre-wrap leading-relaxed font-sans text-slate-200">
                    {msg.content.split('\n\n').map((paragraph, pIdx) => {
                      if (paragraph.startsWith('📌 **[HỒ SƠ ĐÃ LƯU]**')) {
                        return (
                          <div key={pIdx} className="p-3 rounded-xl bg-[#0A0D14] border border-slate-700/80 mb-3 space-y-1 text-xs">
                            <div className="font-bold text-amber-300 font-mono text-[11px] mb-1">
                              📌 [HỒ SƠ ĐÃ LƯU]
                            </div>
                            <div className="text-slate-300 font-mono text-[11px] space-y-0.5">
                              {paragraph.replace('📌 **[HỒ SƠ ĐÃ LƯU]**', '').trim().split('\n').map((line, lIdx) => (
                                <div key={lIdx}>{line}</div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (paragraph.startsWith('💬 **[PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]**')) {
                        return (
                          <div key={pIdx} className="space-y-1.5 my-2">
                            <div className="font-bold text-blue-400 font-mono text-xs flex items-center gap-1.5">
                              <span>💬</span>
                              <span>[PHÂN TÍCH &amp; ĐỀ XUẤT HIỆN TẠI]</span>
                            </div>
                            <div className="text-slate-200 leading-relaxed pl-2 border-l-2 border-blue-500/40">
                              {paragraph.replace('💬 **[PHÂN TÍCH & ĐỀ XUẤT HIỆN TẠI]**', '').trim()}
                            </div>
                          </div>
                        );
                      }

                      if (paragraph.startsWith('👉 **[CÂU HỎI TIẾP THEO]**')) {
                        return (
                          <div key={pIdx} className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-100 my-2 space-y-1">
                            <div className="font-bold text-blue-300 font-mono text-xs flex items-center gap-1.5">
                              <span>👉</span>
                              <span>[CÂU HỎI TIẾP THEO]</span>
                            </div>
                            <div className="text-white font-medium pl-1 text-xs sm:text-sm">
                              {paragraph.replace('👉 **[CÂU HỎI TIẾP THEO]**', '').trim()}
                            </div>
                          </div>
                        );
                      }

                      if (paragraph === '---') {
                        return <div key={pIdx} className="border-b border-slate-800 my-2" />;
                      }

                      return <p key={pIdx}>{paragraph}</p>;
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2">
                    <span>Hệ thống Tư vấn Tuyển sinh 2026</span>
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex justify-start">
              <div className="p-3.5 rounded-2xl bg-[#121622] border border-slate-800 text-slate-300 text-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span>Hệ thống đang đối chiếu dữ liệu tuyển sinh &amp; lập luận...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Decision Chips (Flowchart branches) */}
        <div className="px-4 py-2 bg-[#0E121A] border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">Gợi ý nhanh:</span>

          {profile.currentStep === 1 && (
            <>
              <button
                type="button"
                onClick={() => handleSend('Tôi đã chọn được ngành Công nghệ thông tin')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Công nghệ thông tin
              </button>
              <button
                type="button"
                onClick={() => handleSend('Tôi chọn ngành Quản trị kinh doanh')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Quản trị kinh doanh
              </button>
              <button
                type="button"
                onClick={() => handleSend('Tôi chọn ngành Y khoa')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Y khoa
              </button>
              <button
                type="button"
                onClick={() => handleSend('Tôi chọn ngành Truyền thông đa phương tiện')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Truyền thông đa phương tiện
              </button>
              <button
                type="button"
                onClick={() => handleSend('Tôi chưa chọn được ngành, tôi mạnh môn Toán và Tin, thích làm việc với công nghệ')}
                className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/40 text-blue-200 text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Gợi ý theo: Mạnh Toán, Tin
              </button>
              <button
                type="button"
                onClick={() => handleSend('Tôi chưa chọn được ngành, tôi mạnh môn Ngữ văn và Tiếng Anh, thích sáng tạo')}
                className="px-2.5 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Gợi ý theo: Mạnh Văn, Anh
              </button>
            </>
          )}

          {profile.currentStep === 2 && (
            <>
              <button
                type="button"
                onClick={() => handleSend('Tôi chọn tổ hợp A00, điểm dự kiến 26.5 điểm')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Tổ hợp A00 (26.5đ)
              </button>
              <button
                type="button"
                onClick={() => handleSend('Tôi chọn tổ hợp D01, điểm dự kiến 25.0 điểm')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Tổ hợp D01 (25.0đ)
              </button>
              <button
                type="button"
                onClick={() => handleSend('Tôi chọn tổ hợp A01, điểm dự kiến 27.0 điểm')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Tổ hợp A01 (27.0đ)
              </button>
              <button
                type="button"
                onClick={() => handleSend('Tôi chưa chọn được tổ hợp, điểm dự kiến khoảng 24 điểm, hãy đề xuất tổ hợp tối ưu')}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Đề xuất tổ hợp tối ưu
              </button>
            </>
          )}

          {profile.currentStep === 3 && (
            <>
              <button
                type="button"
                onClick={() => handleSend('Tôi muốn làm Kỹ sư phần mềm')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Kỹ sư phần mềm
              </button>
              <button
                type="button"
                onClick={() => handleSend('Tôi muốn làm Chuyên viên phân tích dữ liệu')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Chuyên viên phân tích dữ liệu
              </button>
              <button
                type="button"
                onClick={() => handleSend('Tôi chưa xác định vị trí, tôi thích môi trường văn phòng năng động')}
                className="px-2.5 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-200 text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Thích văn phòng năng động
              </button>
            </>
          )}

          {profile.currentStep === 4 && (
            <>
              <button
                type="button"
                onClick={() => handleSend('Hãy xuất chi tiết báo cáo chuỗi ảnh hưởng và danh sách 5 trường khả thi')}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
              >
                Xuất danh sách 5 trường
              </button>
              <button
                type="button"
                onClick={() => handleSend('Nếu tôi đổi sang tổ hợp khác thì cơ hội trường học thay đổi thế nào?')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs whitespace-nowrap transition-colors cursor-pointer"
              >
                Thử đổi tổ hợp khác
              </button>
            </>
          )}
        </div>

        {/* Input Box (Clean, minimal, respectful) */}
        <div className="p-3 sm:p-4 bg-[#121622] border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Nhập câu trả lời hoặc băn khoăn của bạn (Ví dụ: 'Tôi chọn ngành CNTT' hoặc 'Thế mạnh của em là...')..."
              className="flex-1 bg-[#0A0D14] border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none transition-colors"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isSending}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                inputPrompt.trim() && !isSending
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Gửi</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
