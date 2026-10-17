import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight,
  Check,
  Brain,
  Target,
  Layers
} from 'lucide-react';
import { sfx } from '../services/soundEffects';

interface PierGorelliMotionSuiteProps {
  onNavigate?: (route: any, param?: string) => void;
  onTriggerIntro?: () => void;
}

export const PierGorelliMotionSuite: React.FC<PierGorelliMotionSuiteProps> = ({ 
  onNavigate,
  onTriggerIntro 
}) => {
  // =========================================================================
  // 1. KHAI PHÁ SỞ THÍCH (Ikigai - Vòng tròn 1)
  // =========================================================================
  const availableKeywords = [
    { id: 'ai', label: '#TríTuệNhânTạo', count: 184 },
    { id: 'chips', label: '#ViMạchBánDẫn', count: 68 },
    { id: 'fintech', label: '#FintechKinhTếSố', count: 142 },
    { id: 'cyber', label: '#AnNinhMạng', count: 96 },
    { id: 'biotech', label: '#CôngNghệSinhHọc', count: 74 },
    { id: 'design', label: '#ThiếtKếMỹThuậtSố', count: 88 },
    { id: 'robotics', label: '#RobotTựĐộngHóa', count: 112 },
    { id: 'data', label: '#KhoaHọcDữLiệu', count: 165 }
  ];
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>(['ai', 'chips', 'data']);

  const toggleKeyword = (id: string) => {
    sfx.playUiHover();
    setSelectedKeywords(prev => 
      prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]
    );
  };

  // =========================================================================
  // 2. ĐỊNH VỊ TÍNH CÁCH (Holland RIASEC)
  // =========================================================================
  const [riasecScores] = useState<Record<string, number>>({
    R: 88, // Kỹ thuật
    I: 95, // Nghiên cứu
    A: 64, // Nghệ thuật
    S: 58, // Xã hội
    E: 78, // Quản lý
    C: 72  // Nghiệp vụ
  });

  const riasecLabels: Record<string, string> = {
    R: 'Kỹ thuật (Realistic)',
    I: 'Nghiên cứu (Investigative)',
    A: 'Nghệ thuật (Artistic)',
    S: 'Xã hội (Social)',
    E: 'Quản lý (Enterprising)',
    C: 'Nghiệp vụ (Conventional)'
  };

  // =========================================================================
  // 3. KIỂM KÊ NĂNG LỰC (Feature Engineering)
  // =========================================================================
  const [hardSkills, setHardSkills] = useState([
    { id: 'math', label: 'Toán cao cấp & Giải tích', checked: true },
    { id: 'code', label: 'Lập trình Python / C++', checked: true },
    { id: 'english', label: 'Tiếng Anh IELTS 7.0+', checked: true },
    { id: 'chips', label: 'Vật lý điện tử & Vi mạch', checked: true }
  ]);
  const [softSkills, setSoftSkills] = useState([
    { id: 'crit', label: 'Tư duy phản biện độc lập', checked: true },
    { id: 'prob', label: 'Giải quyết vấn đề phức tạp', checked: true },
    { id: 'team', label: 'Phối hợp kỹ thuật liên ngành', checked: false }
  ]);

  const toggleHardSkill = (id: string) => {
    sfx.playUiHover();
    setHardSkills(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };
  const toggleSoftSkill = (id: string) => {
    sfx.playUiHover();
    setSoftSkills(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  // =========================================================================
  // 4. XÁC ĐỊNH HỆ GIÁ TRỊ (Mô hình GPV)
  // =========================================================================
  const [gpvPriorities, setGpvPriorities] = useState([
    { id: 'money', label: 'Cần tiền (Thu nhập & Tự chủ tài chính)', icon: '💵', weight: 45 },
    { id: 'freedom', label: 'Cần tự do (Work-life balance linh hoạt)', icon: '🕊️', weight: 30 },
    { id: 'prestige', label: 'Cần danh vọng (Thăng tiến & Vị thế)', icon: '👑', weight: 15 },
    { id: 'impact', label: 'Cần cống hiến (Ý nghĩa phụng sự xã hội)', icon: '🌱', weight: 10 }
  ]);

  const movePriorityUp = (idx: number) => {
    if (idx === 0) return;
    sfx.playUiSelect();
    setGpvPriorities(prev => {
      const copy = [...prev];
      const temp = copy[idx - 1];
      copy[idx - 1] = copy[idx];
      copy[idx] = temp;
      return copy;
    });
  };

  // =========================================================================
  // 5. TRÍCH XUẤT DỮ LIỆU THỊ TRƯỜNG (TopCV, LinkedIn)
  // =========================================================================
  const marketTelemetry = [
    {
      major: 'Kỹ sư AI & Học máy',
      salary: '38.5 – 65 tr/tháng',
      openings: '1.480 vị trí',
      ratio: '1:6 (Rất khan hiếm)',
      status: 'HOT'
    },
    {
      major: 'Thiết kế Vi mạch Bán dẫn',
      salary: '35.0 – 58 tr/tháng',
      openings: '920 vị trí',
      ratio: '1:4 (Ưu tiên quốc gia)',
      status: 'HOT'
    },
    {
      major: 'Khoa học Dữ liệu & BI',
      salary: '24.0 – 42 tr/tháng',
      openings: '2.150 vị trí',
      ratio: '1:12 (Ổn định cao)',
      status: 'STABLE'
    },
    {
      major: 'Thiết kế Đồ họa Cơ bản',
      salary: '11.0 – 16 tr/tháng',
      openings: '850 vị trí',
      ratio: '1:38 (Bão hòa do AI)',
      status: 'SATURATED'
    }
  ];

  // =========================================================================
  // 6. DỰ PHÓNG XU HƯỚNG (McKinsey / WEF)
  // =========================================================================
  const automationRiskData = [
    { title: 'Nhập liệu, hành chính văn phòng thủ công', risk: 89, safe: false, status: 'RỦI RO CAO' },
    { title: 'Lập trình viên cơ bản (Junior Boilerplate)', risk: 58, safe: false, status: 'CẦN NÂNG CẤP' },
    { title: 'Kiến trúc sư hệ thống AI & Thiết kế Vi mạch', risk: 11, safe: true, status: 'BỀN VỮNG' },
    { title: 'Bác sĩ chuyên khoa, Chẩn đoán & Phẫu thuật', risk: 8, safe: true, status: 'AN TOÀN TUYỆT ĐỐI' }
  ];

  // =========================================================================
  // 7. ÁP ĐẶT RÀNG BUỘC (Constraint Matrix)
  // =========================================================================
  const [budgetPerYear, setBudgetPerYear] = useState<number>(45);
  const [regionPref, setRegionPref] = useState<string>('bac');

  // =========================================================================
  // 8. ĐỀ XUẤT & LỘ TRÌNH HÀNH ĐỘNG (Output Engine)
  // =========================================================================
  const topRecommendations = [
    {
      rank: '01',
      score: 97.4,
      title: 'Kỹ nghệ Phần mềm & Hệ thống AI',
      schools: ['ĐHBK Hà Nội (BKA)', 'ĐH Công Nghệ ĐHQGHN (QHI)'],
      combo: 'A00, A01, X06',
      actions: [
        'Toán THPT cần rèn đạt ≥ 9.20 điểm để đảm bảo an toàn xét tuyển.',
        'Hoàn tất chứng chỉ DeepLearning.AI hoặc Python trước tháng 6/2026.',
        'Đăng ký thi Đánh giá tư duy TSA (BKA) để nhân đôi cơ hội.'
      ]
    },
    {
      rank: '02',
      score: 94.8,
      title: 'Kỹ thuật Thiết kế Vi mạch & Bán dẫn',
      schools: ['ĐHBK Hà Nội (BKA)', 'ĐHBK TP.HCM (QSB)'],
      combo: 'A00, A01',
      actions: [
        'Tập trung môn Vật lý & Điện tử cơ bản đạt ≥ 8.80 điểm.',
        'Rèn luyện tiếng Anh chuyên ngành kỹ thuật đạt TOEIC 750+ / IELTS 6.5.',
        'Đăng ký NV1 chương trình tiên tiến bán dẫn theo Đề án Quốc gia.'
      ]
    },
    {
      rank: '03',
      score: 91.2,
      title: 'Khoa học Dữ liệu & Phân tích Kinh tế',
      schools: ['ĐH Kinh Tế Quốc Dân (KHA)', 'ĐH Ngoại Thương (NTH)'],
      combo: 'A01, D01, D07',
      actions: [
        'Tiếng Anh D01 đạt ≥ 9.0 để hưởng quy đổi điểm 10 theo đề án trường.',
        'Luyện tập tư duy thống kê tài chính và giải thuật SQL cơ bản.',
        'Chuẩn bị hồ sơ xét tuyển chứng chỉ quốc tế đợt 1 (tháng 4–5/2026).'
      ]
    }
  ];

  return (
    <section className="border-t border-b border-[#262630] bg-[#07080B]/95 py-20 px-4 sm:px-8 relative overflow-hidden font-mono">
      {/* Background Architectural Markings */}
      <div className="absolute top-4 left-6 text-xs font-mono text-[#555555] tracking-widest select-none">
        [AI ADMISSION PIPELINE &middot; 8-STEP ENGINE]
      </div>
      <div className="absolute top-4 right-6 text-xs font-mono text-[#60A5FA] tracking-widest select-none flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-ping" />
        <span>SCROLL-REVEAL ACTIVE</span>
      </div>

      <div className="max-w-7xl mx-auto space-y-20 mt-8">
        {/* =====================================================================
            1. SECTION HEADER: Full 8-Step Architectural Overview (+20% Font Size)
           ===================================================================== */}
        <div className="border-b border-[#262630] pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-mono text-[#8E929F] mb-3 uppercase tracking-wider">
              <span className="text-[#3B82F6] font-bold text-base">◆</span>
              <span className="text-white font-semibold">4 KHỐI KIẾN TRÚC &middot; 8 BƯỚC ĐỊNH HƯỚNG NGHỀ 2026</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-sans text-white tracking-tight leading-tight">
              Quy Trình 8 Bước Khai Phá &amp; Đề Xuất Nghề Nghiệp
            </h2>
            <p className="text-base sm:text-lg text-[#A1A1AA] max-w-3xl mt-3 leading-relaxed">
              Thuật toán khớp nối từ thiên hướng nội tại, dữ liệu thị trường thực tế đến ma trận ràng buộc và lộ trình hành động tối ưu.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3.5 py-1.5 bg-[#121316] border border-[#262630] text-xs sm:text-sm text-[#60A5FA] font-medium">
              Cuộn tới đâu tự động kích hoạt tới đó
            </span>
          </div>
        </div>

        {/* =====================================================================
            2. STEP 1: 1. Khai phá Sở thích (Ikigai - Vòng tròn 1)
            CSS selector 1 target element
           ===================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 44, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 bg-[#0E0F14] border border-[#22232a] relative transition-all hover:border-[#3B82F6]/60 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1c1d22] pb-4 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[#60A5FA] font-bold text-lg sm:text-xl">[01]</span>
              <span className="text-[#60A5FA] bg-[#2563EB]/15 px-2.5 py-1 border border-[#3B82F6]/40 text-xs uppercase font-bold tracking-wider">
                📊 KHỐI HỒ SƠ CÁ NHÂN
              </span>
              <h3 className="text-white font-bold text-lg sm:text-xl font-sans">
                1. Khai phá Sở thích
              </h3>
            </div>
            <span className="text-xs sm:text-sm text-[#8E929F]">
              Đang chọn: <strong className="text-white">{selectedKeywords.length} từ khóa</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4 border-r border-[#1c1d22]/80 pr-4">
              <div className="text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-[#60A5FA] font-bold block mb-1.5 text-xs uppercase tracking-wider">AI Thu thập:</span>
                Các từ khóa về lĩnh vực bạn thích tìm hiểu, đọc sách và dành thời gian trải nghiệm lúc rảnh rỗi.
              </div>
              <div className="text-sm text-[#D1D5DB] leading-relaxed pt-3 border-t border-[#1a1b22]">
                <span className="text-[#34D399] font-bold block mb-1.5 text-xs uppercase tracking-wider">Mục tiêu:</span>
                Tạo màng lọc đầu tiên để thu hẹp phạm vi ngành nghề, loại bỏ các lĩnh vực hoàn toàn lệch thiên hướng.
              </div>
              <div className="p-3.5 bg-[#07080B] border border-[#1e1f28] text-xs space-y-1.5">
                <span className="text-[#60A5FA] font-bold">MÀNG LỌC IKIGAI:</span>
                <div className="text-[#34D399] font-semibold text-sm">
                  2.158 ngành → còn 142 ngành phù hợp ban đầu
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div className="text-sm text-[#A1A1AA]">
                Chọn từ khóa đam mê (bấm để kích hoạt / bỏ chọn):
              </div>
              <div className="flex flex-wrap gap-2.5">
                {availableKeywords.map(kw => {
                  const isChecked = selectedKeywords.includes(kw.id);
                  return (
                    <button
                      key={kw.id}
                      onClick={() => toggleKeyword(kw.id)}
                      className={`px-4 py-2.5 border text-sm transition-all flex items-center gap-2.5 cursor-pointer rounded-xs ${
                        isChecked
                          ? 'bg-[#2563EB]/25 border-[#3B82F6] text-white font-bold shadow-[0_0_14px_rgba(59,130,246,0.35)]'
                          : 'bg-[#07080B] border-[#22232a] text-[#8E929F] hover:text-white hover:border-[#444]'
                      }`}
                    >
                      <span className="text-sm">{kw.label}</span>
                      <span className="text-xs text-[#60A5FA] bg-[#1a1b26] px-1.5 py-0.5">
                        {kw.count} ngành
                      </span>
                      {isChecked && <Check className="w-4 h-4 text-[#60A5FA]" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-3.5 bg-[#07080B] border border-[#1a1b22] flex items-center justify-between text-xs sm:text-sm text-[#8E929F]">
                <span className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#3B82F6]" />
                  <span>Ikigai Circle 1: Sở thích cốt lõi</span>
                </span>
                <span className="text-white font-bold">
                  Khớp {selectedKeywords.length * 28 + 42} ngành tiềm năng
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =====================================================================
            3. CONTAINER: STEPS 2 & 3 (Grid 2-column)
            CSS selector 2 -> div:nth-of-type(3) > div:nth-of-type(1)
            CSS selector 3 -> div:nth-of-type(3) > div:nth-of-type(2)
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Step 2: 2. Định vị Tính cách -> CSS selector 2 */}
          <motion.div
            initial={{ opacity: 0, y: 44, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 bg-[#0E0F14] border border-[#22232a] flex flex-col justify-between hover:border-[#3B82F6]/60 transition-all space-y-6"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#1c1d22] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#60A5FA] font-bold text-lg sm:text-xl">[02]</span>
                  <h3 className="text-white font-bold text-lg sm:text-xl font-sans">
                    2. Định vị Tính cách
                  </h3>
                </div>
                <span className="text-xs text-[#60A5FA] font-bold bg-[#141824] px-2.5 py-1 border border-[#3B82F6]/30">
                  TOP: I - R - E
                </span>
              </div>

              <div className="text-sm text-[#A1A1AA] space-y-2 mb-5 leading-relaxed">
                <div><strong className="text-white">• AI Thu thập:</strong> Phân loại bạn vào 6 nhóm RIASEC (Kỹ thuật, Nghiên cứu, Nghệ thuật, Xã hội, Quản lý, Nghiệp vụ).</div>
                <div><strong className="text-[#60A5FA]">• Mục tiêu:</strong> Xác định môi trường làm việc giúp bạn phát huy tối đa tiềm năng tự nhiên.</div>
              </div>

              {/* 6 RIASEC Dimension Bars (+20% size) */}
              <div className="space-y-3 bg-[#07080B] p-5 border border-[#1a1b22]">
                {Object.entries(riasecScores).map(([code, score]) => (
                  <div key={code} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-semibold flex items-center gap-2">
                        <span className="w-5 h-5 bg-[#121316] border border-[#262630] flex items-center justify-center text-xs text-[#60A5FA] font-bold">
                          {code}
                        </span>
                        <span>{riasecLabels[code]}</span>
                      </span>
                      <span className="text-[#60A5FA] font-bold">{score}%</span>
                    </div>
                    <div className="w-full bg-[#161720] h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#2563EB] to-[#60A5FA] transition-all duration-500"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1a1b22] flex items-center justify-between text-xs sm:text-sm text-[#8E929F]">
              <span>Môi trường tự nhiên:</span>
              <span className="text-white font-bold">Phòng Lab R&amp;D &middot; Kỹ thuật chuyên sâu</span>
            </div>
          </motion.div>

          {/* Step 3: 3. Kiểm kê Năng lực -> CSS selector 3 */}
          <motion.div
            initial={{ opacity: 0, y: 44, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 bg-[#0E0F14] border border-[#22232a] flex flex-col justify-between hover:border-[#3B82F6]/60 transition-all space-y-6"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#1c1d22] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#60A5FA] font-bold text-lg sm:text-xl">[03]</span>
                  <h3 className="text-white font-bold text-lg sm:text-xl font-sans">
                    3. Kiểm kê Năng lực
                  </h3>
                </div>
                <span className="text-xs text-[#34D399] font-bold bg-[#0c1f15] px-2.5 py-1 border border-[#166534]">
                  ENTRY-LEVEL: 85%
                </span>
              </div>

              <div className="text-sm text-[#A1A1AA] space-y-2 mb-5 leading-relaxed">
                <div><strong className="text-white">• AI Thu thập:</strong> Danh sách Kỹ năng cứng (Hard skills) đã có và Kỹ năng mềm (Soft skills) nổi trội.</div>
                <div><strong className="text-[#60A5FA]">• Mục tiêu:</strong> Đánh giá mức độ đáp ứng yêu cầu sàn (Entry-Level) của ngành học.</div>
              </div>

              {/* Skills Checklists (+20% size) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#07080B] p-5 border border-[#1a1b22]">
                <div className="space-y-3">
                  <div className="text-xs text-[#60A5FA] uppercase font-bold tracking-wider">Kỹ năng cứng (Hard skills):</div>
                  {hardSkills.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => toggleHardSkill(s.id)}
                      className="flex items-center gap-2.5 text-sm text-[#E4E4E7] cursor-pointer hover:text-white"
                    >
                      <div className={`w-4 h-4 border flex items-center justify-center ${s.checked ? 'border-[#3B82F6] bg-[#2563EB]' : 'border-[#333]'}`}>
                        {s.checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={s.checked ? 'text-white font-medium' : 'text-[#777]'}>{s.label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t sm:border-t-0 sm:border-l border-[#1c1d24] sm:pl-4 pt-3 sm:pt-0">
                  <div className="text-xs text-[#818CF8] uppercase font-bold tracking-wider">Kỹ năng mềm (Soft skills):</div>
                  {softSkills.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => toggleSoftSkill(s.id)}
                      className="flex items-center gap-2.5 text-sm text-[#E4E4E7] cursor-pointer hover:text-white"
                    >
                      <div className={`w-4 h-4 border flex items-center justify-center ${s.checked ? 'border-[#818CF8] bg-[#6366F1]' : 'border-[#333]'}`}>
                        {s.checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={s.checked ? 'text-white font-medium' : 'text-[#777]'}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1a1b22] flex items-center justify-between text-xs sm:text-sm text-[#8E929F]">
              <span>Đánh giá chuẩn sàn:</span>
              <span className="text-[#34D399] font-bold">Đạt ngưỡng Entry-Level khối Kỹ thuật/AI ✓</span>
            </div>
          </motion.div>
        </div>

        {/* =====================================================================
            4. STEP 4: 4. Xác định Hệ giá trị (Mô hình GPV)
            CSS selector 4 target element
           ===================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 44, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 bg-[#0E0F14] border border-[#22232a] hover:border-[#3B82F6]/60 transition-all space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1c1d22] pb-4 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[#60A5FA] font-bold text-lg sm:text-xl">[04]</span>
              <span className="text-[#60A5FA] bg-[#2563EB]/15 px-2.5 py-1 border border-[#3B82F6]/40 text-xs uppercase font-bold tracking-wider">
                📊 KHỐI HỒ SƠ CÁ NHÂN
              </span>
              <h3 className="text-white font-bold text-lg sm:text-xl font-sans">
                4. Xác định Hệ giá trị
              </h3>
            </div>
            <span className="text-xs sm:text-sm font-mono text-[#60A5FA] font-bold">
              Hàm mục tiêu: Ranking J(x)
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-4 border-r border-[#1c1d22]/80 pr-4">
              <div className="text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-[#60A5FA] font-bold block mb-1.5 text-xs uppercase tracking-wider">AI Thu thập:</span>
                Thứ tự ưu tiên của bạn: Cần tiền (Thu nhập), Cần danh vọng (Thăng tiến), Cần tự do (Work-life balance) hay Cần cống hiến (Ý nghĩa).
              </div>
              <div className="text-sm text-[#D1D5DB] leading-relaxed pt-3 border-t border-[#1a1b22]">
                <span className="text-[#34D399] font-bold block mb-1.5 text-xs uppercase tracking-wider">Mục tiêu:</span>
                Định hình &quot;Hàm mục tiêu&quot; để AI xếp hạng kết quả ở bước cuối, đúng theo giá trị sống của bạn.
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="text-xs sm:text-sm text-[#A1A1AA] flex justify-between">
                <span>Thứ tự ưu tiên GPV (Bấm &quot;Lên ↑&quot; để xếp thứ tự ưu tiên cao nhất):</span>
              </div>

              <div className="space-y-2.5">
                {gpvPriorities.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#07080B] border border-[#1a1b22] hover:border-[#3B82F6] flex items-center justify-between text-sm transition-colors rounded-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-[#121316] border border-[#22232e] text-[#60A5FA] font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-white font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#60A5FA] text-xs font-bold">
                        Trọng số: {45 - idx * 12}%
                      </span>
                      {idx > 0 && (
                        <button
                          onClick={() => movePriorityUp(idx)}
                          className="px-2.5 py-1 bg-[#181922] hover:bg-[#2563EB] text-white text-xs border border-[#2c2d38] cursor-pointer transition-colors"
                        >
                          Lên ↑
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* =====================================================================
            5. CONTAINER: STEPS 5 & 6 (Grid 2-column)
            CSS selector 5 -> div:nth-of-type(5) > div:nth-of-type(1)
            CSS selector 6 -> div:nth-of-type(5) > div:nth-of-type(2)
           ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Step 5: 5. Trích xuất Dữ liệu Thị trường -> CSS selector 5 */}
          <motion.div
            initial={{ opacity: 0, y: 44, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 bg-[#0E0F14] border border-[#22232a] flex flex-col justify-between hover:border-[#3B82F6]/60 transition-all space-y-6"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#1c1d22] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#60A5FA] font-bold text-lg sm:text-xl">[05]</span>
                  <h3 className="text-white font-bold text-lg sm:text-xl font-sans">
                    5. Trích xuất Dữ liệu Thị trường
                  </h3>
                </div>
                <span className="text-xs text-[#60A5FA] font-bold bg-[#141824] px-2.5 py-1 border border-[#3B82F6]/30">
                  TOPCV &middot; LINKEDIN
                </span>
              </div>

              <div className="text-sm text-[#A1A1AA] space-y-2 mb-5 leading-relaxed">
                <div><strong className="text-white">• AI Thu thập:</strong> Tỷ lệ tuyển dụng, mức lương trung bình thực tế và độ cạnh tranh (tỷ lệ CV nộp vào / tin tuyển dụng).</div>
                <div><strong className="text-[#60A5FA]">• Mục tiêu:</strong> Lọc bỏ các ngành &quot;đam mê&quot; nhưng thị trường bão hòa hoặc không đủ nuôi sống bạn.</div>
              </div>

              {/* Market Scraping Telemetry Feed */}
              <div className="space-y-2.5 bg-[#07080B] p-4 border border-[#1a1b22]">
                {marketTelemetry.map((item, idx) => (
                  <div key={idx} className="p-3 bg-[#0b0c10] border border-[#1a1b24] space-y-1.5 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold truncate max-w-[280px]">{item.major}</span>
                      <span className={`text-xs px-2 py-0.5 border font-bold ${
                        item.status === 'HOT' ? 'text-[#34D399] border-[#166534] bg-[#0c1f15]' :
                        item.status === 'STABLE' ? 'text-[#60A5FA] border-[#2563EB] bg-[#141824]' :
                        'text-[#F87171] border-[#991B1B] bg-[#220c0c]'
                      }`}>
                        {item.ratio}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-[#8E929F]">
                      <span>Lương: <strong className="text-white">{item.salary}</strong></span>
                      <span>Tin tuyển dụng: <strong className="text-[#60A5FA]">{item.openings}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1a1b22] flex items-center justify-between text-xs sm:text-sm text-[#8E929F]">
              <span>Màng lọc bão hòa:</span>
              <span className="text-[#34D399] font-bold">Tự động cảnh báo ngành có tỷ lệ nộp &gt; 1:30 ✓</span>
            </div>
          </motion.div>

          {/* Step 6: 6. Dự phóng Xu hướng -> CSS selector 6 */}
          <motion.div
            initial={{ opacity: 0, y: 44, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 bg-[#0E0F14] border border-[#22232a] flex flex-col justify-between hover:border-[#3B82F6]/60 transition-all space-y-6"
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#1c1d22] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-[#60A5FA] font-bold text-lg sm:text-xl">[06]</span>
                  <h3 className="text-white font-bold text-lg sm:text-xl font-sans">
                    6. Dự phóng Xu hướng
                  </h3>
                </div>
                <span className="text-xs text-[#FBBF24] font-bold bg-[#261f0c] px-2.5 py-1 border border-[#854d0e]">
                  MCKINSEY &middot; WEF
                </span>
              </div>

              <div className="text-sm text-[#A1A1AA] space-y-2 mb-5 leading-relaxed">
                <div><strong className="text-white">• AI Thu thập:</strong> Khả năng ngành nghề bị thay thế bởi AI, tự động hóa trong 3–5 năm tới (2026–2030).</div>
                <div><strong className="text-[#60A5FA]">• Mục tiêu:</strong> Đảm bảo bạn không chọn nhầm ngành đang thu hẹp hay biến mất dần.</div>
              </div>

              {/* Automation Displacement Risk Bars */}
              <div className="space-y-3.5 bg-[#07080B] p-4 border border-[#1a1b22]">
                {automationRiskData.map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-medium truncate max-w-[270px]">{item.title}</span>
                      <span className={`text-xs font-bold ${item.safe ? 'text-[#34D399]' : 'text-[#F87171]'}`}>
                        {item.risk}% nguy cơ ({item.status})
                      </span>
                    </div>
                    <div className="w-full bg-[#181924] h-2 overflow-hidden">
                      <div 
                        className={`h-full ${item.safe ? 'bg-[#34D399]' : item.risk > 70 ? 'bg-[#EF4444]' : 'bg-[#F59E0B]'}`}
                        style={{ width: `${item.risk}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1a1b22] flex items-center justify-between text-xs sm:text-sm text-[#8E929F]">
              <span>Bảo vệ dài hạn:</span>
              <span className="text-white font-bold">Chỉ giữ ngành có chỉ số bền vững &gt; 80% ✓</span>
            </div>
          </motion.div>
        </div>

        {/* =====================================================================
            6. STEP 7: 7. Áp đặt Ràng buộc (Constraint Matrix)
            CSS selector 7 target element
           ===================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 44, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 bg-[#0E0F14] border border-[#22232a] hover:border-[#3B82F6]/60 transition-all space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1c1d22] pb-4 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[#60A5FA] font-bold text-lg sm:text-xl">[07]</span>
              <span className="text-[#60A5FA] bg-[#2563EB]/15 px-2.5 py-1 border border-[#3B82F6]/40 text-xs uppercase font-bold tracking-wider">
                🎛️ KHỐI BỘ LỌC BIÊN
              </span>
              <h3 className="text-white font-bold text-lg sm:text-xl font-sans">
                7. Áp đặt Ràng buộc
              </h3>
            </div>
            <span className="text-xs sm:text-sm text-[#34D399] font-bold">
              Đã lọc 48 phương án phi thực tế
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4 border-r border-[#1c1d22]/80 pr-4">
              <div className="text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-[#60A5FA] font-bold block mb-1.5 text-xs uppercase tracking-wider">AI Thu thập:</span>
                Điều kiện kinh tế gia đình, Ngân sách học phí, Vị trí địa lý (chuyển vùng / remote), và độ tuổi hiện tại.
              </div>
              <div className="text-sm text-[#D1D5DB] leading-relaxed pt-3 border-t border-[#1a1b22]">
                <span className="text-[#34D399] font-bold block mb-1.5 text-xs uppercase tracking-wider">Mục tiêu:</span>
                Cắt giảm các lựa chọn phi thực tế (ví dụ: thích phi công nhưng ngân sách không đủ, hoặc đổi ngành Y khi đã 35 tuổi).
              </div>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Budget Slider */}
                <div className="p-4 bg-[#07080B] border border-[#1a1b22] space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white font-semibold">Ngân sách học phí trần:</span>
                    <span className="text-[#60A5FA] font-bold">{budgetPerYear} triệu VNĐ / năm</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="150"
                    step="5"
                    value={budgetPerYear}
                    onChange={(e) => setBudgetPerYear(parseInt(e.target.value))}
                    className="w-full accent-[#3B82F6] cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[#888]">
                    <span>15 tr/năm (Công lập chuẩn)</span>
                    <span>150 tr/năm (Quốc tế)</span>
                  </div>
                </div>

                {/* Region Selector */}
                <div className="p-4 bg-[#07080B] border border-[#1a1b22] space-y-3">
                  <span className="text-white font-semibold text-sm block">Vùng địa lý chấp nhận:</span>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    {[
                      { id: 'bac', label: 'Miền Bắc' },
                      { id: 'nam', label: 'Miền Nam' },
                      { id: 'remote', label: 'Linh hoạt' }
                    ].map(r => (
                      <button
                        key={r.id}
                        onClick={() => {
                          sfx.playUiHover();
                          setRegionPref(r.id);
                        }}
                        className={`py-2 px-2.5 border text-center transition-colors cursor-pointer text-xs font-semibold ${
                          regionPref === r.id
                            ? 'bg-[#2563EB] text-white border-[#3B82F6]'
                            : 'bg-[#121316] text-[#8E929F] border-[#22232a]'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#07080B] border border-[#1a1b22] flex items-center justify-between text-xs sm:text-sm text-[#8E929F]">
                <span>Tình trạng ma trận ràng buộc:</span>
                <span className="text-[#34D399] font-bold">100% kết quả thỏa mãn điều kiện kinh tế &amp; địa lý</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =====================================================================
            7. STEP 8: 8. Đề xuất & Lộ trình Hành động (Output Engine)
            CSS selector 8 target element
           ===================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 44, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 bg-[#0E0F14] border border-[#22232a] hover:border-[#3B82F6]/60 transition-all space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1c1d22] pb-4 gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[#60A5FA] font-bold text-lg sm:text-xl">[08]</span>
              <span className="text-[#3B82F6] bg-[#2563EB]/15 px-2.5 py-1 border border-[#3B82F6]/40 text-xs uppercase font-bold tracking-wider">
                🚀 KHỐI ĐẦU RA
              </span>
              <h3 className="text-white font-bold text-lg sm:text-xl font-sans">
                8. Đề xuất &amp; Lộ trình Hành động
              </h3>
            </div>
            <span className="text-xs sm:text-sm text-[#34D399] font-bold">
              AI MATCHING SCORE &middot; TOP 3 NGÀNH TỐI ƯU
            </span>
          </div>

          <div className="text-sm text-[#D1D5DB] border-b border-[#1c1d22] pb-4 leading-relaxed">
            <div><strong className="text-white">• AI Xử lý:</strong> So khớp Matching Score và xuất Top 3 ngành nghề phù hợp nhất kèm theo Lộ trình lấp đầy khoảng cách (Gap-filling roadmap): chứng chỉ cần học, địa điểm thực tập và ngưỡng điểm vượt an toàn.</div>
          </div>

          {/* Top 3 Recommendation Cards (+20% size & cleaner text) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topRecommendations.map((rec) => (
              <div
                key={rec.rank}
                className="p-5 bg-[#07080B] border border-[#1e1f28] hover:border-[#3B82F6] transition-all flex flex-col justify-between space-y-4 rounded-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-sm mb-2.5">
                    <span className="text-[#60A5FA] font-bold">TOP {rec.rank}</span>
                    <span className="text-[#34D399] font-bold bg-[#0c1f15] border border-[#166534] px-2.5 py-0.5 text-xs">
                      Match: {rec.score}%
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-base leading-snug">{rec.title}</h4>
                  
                  <div className="text-xs text-[#A1A1AA] mt-3 space-y-1.5">
                    <div><span className="text-[#60A5FA] font-semibold">Tổ hợp:</span> {rec.combo}</div>
                    <div><span className="text-white font-semibold">Trường đào tạo đề xuất:</span></div>
                    <ul className="list-disc list-inside text-[#E4E4E7] pl-1 space-y-0.5">
                      {rec.schools.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1a1b24] space-y-2">
                  <div className="text-xs text-[#60A5FA] uppercase font-bold tracking-wider">Hành động cụ thể (Gap-filling):</div>
                  <ul className="text-xs text-[#A1A1AA] space-y-1.5">
                    {rec.actions.map((act, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#3B82F6] font-bold mt-0.5">›</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Action Roadmap Timeline */}
          <div className="p-5 bg-[#07080B] border border-[#1a1b24] space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
                <Target className="w-5 h-5 text-[#3B82F6]" />
                <span>Next-Best-Action: Kế hoạch Hành Động Tuyển Sinh 2026</span>
              </span>
              <span className="text-[#60A5FA] text-xs font-semibold">3 Giai đoạn</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm font-mono">
              <div className="p-4 bg-[#101118] border border-[#1e1f2c] space-y-1.5">
                <div className="text-[#60A5FA] font-bold text-xs">Giai đoạn 1: Tháng 1 - 4/2026</div>
                <div className="text-white font-semibold text-sm">Tập trung tổ hợp hạt nhân</div>
                <p className="text-[#8E929F] text-xs leading-relaxed">
                  Khóa tổ hợp A01 / X06. Tăng cường giải toán nâng cao và duy trì tiếng Anh đạt ngưỡng quy đổi điểm 10.
                </p>
              </div>

              <div className="p-4 bg-[#101118] border border-[#1e1f2c] space-y-1.5">
                <div className="text-[#34D399] font-bold text-xs">Giai đoạn 2: Tháng 5 - 6/2026</div>
                <div className="text-white font-semibold text-sm">Xét tuyển sớm &amp; Thi ĐGNL</div>
                <p className="text-[#8E929F] text-xs leading-relaxed">
                  Nộp hồ sơ xét tuyển kết hợp chứng chỉ IELTS/SAT. Tham gia đợt thi đánh giá tư duy TSA của Bách Khoa.
                </p>
              </div>

              <div className="p-4 bg-[#101118] border border-[#1e1f2c] space-y-1.5">
                <div className="text-[#818CF8] font-bold text-xs">Giai đoạn 3: Tháng 7/2026</div>
                <div className="text-white font-semibold text-sm">Đăng ký nguyện vọng thông minh</div>
                <p className="text-[#8E929F] text-xs leading-relaxed">
                  Xếp NV1 vào ngành ước mơ (Match 97.4%), NV2 vào ngành an toàn (+1.5đ so với điểm chuẩn dự kiến).
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Navigation Action */}
        <div className="p-5 bg-[#121316] border border-[#262630] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-mono text-[#8E929F]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#3B82F6]" />
            <span className="text-sm text-white">Đã hoàn tất 8 bước định vị. Sẵn sàng tra cứu danh mục ngành và điểm chuẩn?</span>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('nganh')}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer rounded-xs"
          >
            <span>Khám Phá Chi Tiết 2.158 Ngành</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
