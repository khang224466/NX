import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  Send, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Lightbulb, 
  AlertCircle,
  GraduationCap,
  Building2,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { sfx } from '../services/soundEffects';
import { formatCutoffScore } from '../utils/formulaFormatter';

export interface AIMajorSchoolAssistantProps {
  mode: 'combo' | 'school';
  contextId: string; // e.g. 'D02' or 'KHA'
  contextName?: string; // e.g. 'Toán – Ngữ văn – Tiếng Nga' or 'Đại học Kinh Tế Quốc Dân'
  records: Array<{
    record_id: string;
    institution_code: string;
    audited_major_name: string;
    audited_official_cutoff: number;
    audited_official_scale: string;
    subject_combinations: string[];
    method_id: string;
    formula_id: string;
    campus_location?: string;
  }>;
  onSelectRecord?: (record: any) => void;
  onSelectSchoolWithMajor?: (schoolCode: string, majorName: string) => void;
}

interface GeneratedRecommendation {
  recordId: string;
  majorName: string;
  schoolCode: string;
  cutoff: number;
  scale: string;
  combos: string[];
  matchReason: string;
  careerTrend: string;
}

export const AIMajorSchoolAssistant: React.FC<AIMajorSchoolAssistantProps> = ({
  mode,
  contextId,
  contextName,
  records,
  onSelectRecord,
  onSelectSchoolWithMajor
}) => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedRecommendation[] | null>(null);

  // In-memory cache to prevent redundant requests
  const queryCacheRef = useRef<Record<string, GeneratedRecommendation[]>>({});
  const timerRef = useRef<any>(null);

  // Quick Chips tailored to mode
  const quickChips = useMemo(() => {
    if (mode === 'combo') {
      return [
        { label: '🎯 Điểm chuẩn 21 – 24.5đ', prompt: 'Gợi ý các ngành xét tổ hợp này có điểm chuẩn an toàn từ 21 đến 24.5 điểm' },
        { label: '🌍 Cơ hội làm việc quốc tế', prompt: 'Tìm ngành có cơ hội làm việc quốc tế, đối ngoại hoặc giao thương toàn cầu' },
        { label: '💼 Ngành kinh tế & tài chính', prompt: 'Các ngành kinh tế, thương mại hoặc tài chính xét tuyển bằng tổ hợp này' },
        { label: '🏛️ Trường top đầu tại Hà Nội / TP.HCM', prompt: 'Gợi ý các trường đại học uy tín nhất tuyển tổ hợp này' },
      ];
    } else {
      return [
        { label: '🔥 Top ngành hot nhất trường', prompt: 'Gợi ý các ngành có điểm chuẩn cao và được quan tâm nhất tại trường này' },
        { label: '🎯 Điểm chuẩn vừa phải (22 – 25đ)', prompt: 'Tìm các ngành có điểm chuẩn dao động từ 22 đến 25 điểm' },
        { label: '🌐 Ngành có ngoại ngữ / quốc tế', prompt: 'Các ngành có chương trình đào tạo liên kết hoặc sử dụng ngoại ngữ' },
        { label: '📊 Ngành quản trị & công nghệ', prompt: 'Các ngành kết hợp quản trị kinh doanh với công nghệ số' },
      ];
    }
  }, [mode]);

  // Clean up cooldown timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Cooldown countdown helper
  const startCooldown = (seconds: number = 4) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Smart local generator with anti-spam rate limiting
  const handleGenerate = (customPrompt?: string) => {
    const rawText = (customPrompt || query).trim();
    if (!rawText) return;

    // 1. Anti-spam / Cooldown check
    if (cooldown > 0) {
      sfx.playUiClick();
      setWarningMessage(`⚠️ Bạn đang thao tác quá nhanh. Vui lòng chờ ${cooldown} giây trước khi gửi yêu cầu tiếp theo.`);
      setTimeout(() => setWarningMessage(null), 3000);
      return;
    }

    if (isGenerating) return;

    setWarningMessage(null);
    setIsGenerating(true);
    sfx.playUiClick();

    const cacheKey = `${mode}_${contextId}_${rawText.toLowerCase()}`;

    // 2. Cache Hit check
    if (queryCacheRef.current[cacheKey]) {
      setTimeout(() => {
        setResults(queryCacheRef.current[cacheKey]);
        setIsGenerating(false);
        startCooldown(3);
        sfx.playActionSuccess();
      }, 250);
      return;
    }

    // 3. Local Intelligent Analysis on Audited Database
    setTimeout(() => {
      const lower = rawText.toLowerCase();
      let matched = [...records];

      // Filter by point ranges if detected
      if (lower.includes('21') || lower.includes('22') || lower.includes('23') || lower.includes('24') || lower.includes('25')) {
        matched = matched.filter(r => r.audited_official_cutoff >= 20.0 && r.audited_official_cutoff <= 26.0);
      } else if (lower.includes('cao') || lower.includes('top') || lower.includes('hot')) {
        matched = matched.sort((a, b) => b.audited_official_cutoff - a.audited_official_cutoff);
      }

      // Filter by keywords
      if (lower.includes('kinh tế') || lower.includes('thương mại') || lower.includes('ngoại thương') || lower.includes('logistics')) {
        matched = matched.filter(r => {
          const n = r.audited_major_name.toLowerCase();
          return n.includes('kinh tế') || n.includes('thương mại') || n.includes('kinh doanh') || n.includes('quản trị') || n.includes('logistics');
        });
      } else if (lower.includes('quốc tế') || lower.includes('ngoại giao') || lower.includes('nga') || lower.includes('pháp') || lower.includes('trung') || lower.includes('nhật') || lower.includes('hàn') || lower.includes('ngoại ngữ') || lower.includes('ngôn ngữ')) {
        matched = matched.filter(r => {
          const n = r.audited_major_name.toLowerCase();
          return n.includes('quốc tế') || n.includes('nga') || n.includes('pháp') || n.includes('trung') || n.includes('nhật') || n.includes('hàn') || n.includes('ngôn ngữ') || n.includes('ngoại giao') || n.includes('đối ngoại');
        });
      } else if (lower.includes('cntt') || lower.includes('ai') || lower.includes('công nghệ') || lower.includes('máy tính') || lower.includes('phần mềm') || lower.includes('bán dẫn')) {
        matched = matched.filter(r => {
          const n = r.audited_major_name.toLowerCase();
          return n.includes('công nghệ') || n.includes('máy tính') || n.includes('phần mềm') || n.includes('thông tin') || n.includes('trí tuệ') || n.includes('dữ liệu') || n.includes('bán dẫn') || n.includes('điện tử');
        });
      } else if (lower.includes('y') || lower.includes('dược') || lower.includes('bác sĩ') || lower.includes('răng') || lower.includes('sinh học')) {
        matched = matched.filter(r => {
          const n = r.audited_major_name.toLowerCase();
          return n.includes('y') || n.includes('dược') || n.includes('răng') || n.includes('sinh') || n.includes('điều dưỡng');
        });
      } else if (lower.includes('vẽ') || lower.includes('kiến trúc') || lower.includes('mỹ thuật') || lower.includes('thiết kế') || lower.includes('đồ họa')) {
        matched = matched.filter(r => {
          const n = r.audited_major_name.toLowerCase();
          return n.includes('kiến trúc') || n.includes('thiết kế') || n.includes('mỹ thuật') || n.includes('quy hoạch') || n.includes('nội thất') || n.includes('đồ họa');
        });
      } else if (lower.includes('sư phạm') || lower.includes('luật') || lower.includes('báo chí') || lower.includes('truyền thông')) {
        matched = matched.filter(r => {
          const n = r.audited_major_name.toLowerCase();
          return n.includes('sư phạm') || n.includes('luật') || n.includes('báo') || n.includes('truyền thông') || n.includes('xã hội');
        });
      } else if (lower.includes('quản trị') || lower.includes('marketing') || lower.includes('tài chính') || lower.includes('ngân hàng')) {
        matched = matched.filter(r => {
          const n = r.audited_major_name.toLowerCase();
          return n.includes('quản trị') || n.includes('marketing') || n.includes('tài chính') || n.includes('ngân hàng');
        });
      }

      // If empty after strict filter, fallback to top records in this context
      if (matched.length === 0) {
        matched = records.slice(0, 5);
      }

      // Select top 3 diverse recommendations
      const top3 = matched.slice(0, 3);
      const generated: GeneratedRecommendation[] = top3.map((rec) => {
        let reason = '';
        let trend = '';

        const mName = rec.audited_major_name;
        const lowerName = mName.toLowerCase();
        if (lowerName.includes('máy tính') || lowerName.includes('phần mềm') || lowerName.includes('ai') || lowerName.includes('công nghệ') || lowerName.includes('cntt')) {
          reason = `Ngành mũi nhọn thời đại số, nhu cầu tuyển dụng kỹ sư phần mềm, AI & phân tích dữ liệu ở mức cao.`;
          trend = `Thực chứng DuckDB (908 CV & 1.500 việc làm): Mức lương P50 15–28 triệu/tháng; tỷ lệ trái ngành/liên quan 31.72%.`;
        } else if (lowerName.includes('quản trị') || lowerName.includes('kinh doanh') || lowerName.includes('marketing') || lowerName.includes('thương mại') || lowerName.includes('logistics')) {
          reason = `Phù hợp với mục tiêu làm việc trong khối kinh tế, vận hành chuỗi cung ứng và thương mại quốc tế.`;
          trend = `Thực chứng DuckDB (412 CV): Tỷ lệ làm trái ngành chỉ 9.47%, cơ hội việc làm tuyển dụng rộng khắp.`;
        } else if (lowerName.includes('tài chính') || lowerName.includes('ngân hàng') || lowerName.includes('kế toán') || lowerName.includes('kiểm toán')) {
          reason = `Khối ngành quy chuẩn, nghiệp vụ kiểm toán, tài chính định lượng và phân tích rủi ro bền vững.`;
          trend = `Thực chứng DuckDB (78 CV): Tỷ lệ đúng/liên quan ngành đạt 97.44% (chỉ 2.56% làm trái ngành).`;
        } else if (lowerName.includes('cơ điện') || lowerName.includes('tự động') || lowerName.includes('kỹ thuật') || lowerName.includes('cơ khí') || lowerName.includes('điện tử')) {
          reason = `Nền tảng kỹ thuật cơ khí, tự động hóa và điều khiển công nghiệp 4.0 tiếp cận các nhà máy thông minh.`;
          trend = `Thực chứng DuckDB (68 CV): Tỷ lệ làm việc đúng/liên quan đạt 83.82% (16.18% trái ngành), các tập đoàn FDI săn đón.`;
        } else if (lowerName.includes('kiến trúc') || lowerName.includes('thiết kế') || lowerName.includes('mỹ thuật') || lowerName.includes('đồ họa')) {
          reason = `Phát huy năng khiếu mỹ thuật, tư duy không gian và sáng tạo giao diện sản phẩm số.`;
          trend = `Thực chứng DuckDB: Tỷ lệ dịch chuyển công việc 25.0%, thị trường truyền thông số và game cần nhân lực sáng tạo.`;
        } else if (lowerName.includes('sư phạm')) {
          reason = `Chính sách miễn 100% học phí và trợ cấp sinh hoạt phí 3,63 triệu/tháng theo Nghị định 116/2020/NĐ-CP.`;
          trend = `Thực chứng DuckDB: 80% sinh viên ra trường làm đúng hoặc liên quan trực tiếp đến ngành sư phạm.`;
        } else if (lowerName.includes('đối ngoại') || lowerName.includes('quốc tế') || lowerName.includes('ngôn ngữ')) {
          reason = `Lợi thế đào tạo chuyên sâu về ngôn ngữ kết hợp kỹ năng biên phiên dịch, thương mại và văn hóa đối tác.`;
          trend = `Cơ hội việc làm đa dạng tại đại sứ quán, doanh nghiệp FDI, du lịch cao cấp và xuất khẩu lao động tay nghề cao.`;
        } else {
          reason = `Điểm chuẩn ${rec.audited_official_cutoff} (${rec.audited_official_scale}) nằm trong ngưỡng an toàn, tỷ lệ cạnh tranh hợp lý.`;
          trend = `Chương trình đào tạo chuẩn kiểm định, cơ hội việc làm rộng mở tại các trung tâm kinh tế lớn.`;
        }

        return {
          recordId: rec.record_id,
          majorName: rec.audited_major_name,
          schoolCode: rec.institution_code,
          cutoff: rec.audited_official_cutoff,
          scale: rec.audited_official_scale,
          combos: rec.subject_combinations || [],
          matchReason: reason,
          careerTrend: trend
        };
      });

      // Save to cache
      queryCacheRef.current[cacheKey] = generated;
      setResults(generated);
      setIsGenerating(false);
      startCooldown(4);
      sfx.playActionSuccess();
    }, 400);
  };

  const handleReset = () => {
    sfx.playUiClick();
    setQuery('');
    setResults(null);
    setWarningMessage(null);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1017] border border-[#2563EB]/30 shadow-xl space-y-4 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2563EB]/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs sm:text-sm">
              Trợ Lý AI: Gợi Ý Chọn {mode === 'combo' ? `Ngành & Trường Theo Tổ Hợp ${contextId}` : `Ngành Phù Hợp Tại ${contextId}`}
            </h4>
            <p className="text-xs text-slate-200 font-mono">
              Phân tích tự động từ dữ liệu tuyển sinh 2026 đã kiểm toán &middot; Tốc độ phản hồi tức thì
            </p>
          </div>
        </div>

        {results && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-mono text-slate-200 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Làm mới</span>
          </button>
        )}
      </div>

      {/* Input Form with Cooldown & Anti-Spam Indicator */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleGenerate();
        }}
        className="space-y-2"
      >
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'combo'
                ? `Nhập mong muốn (VD: Ngành có yếu tố quốc tế, điểm từ 21 - 24đ, việc làm sau ra trường...)`
                : `Nhập sở thích hoặc điểm số (VD: Ngành quản trị, marketing, hoặc điểm từ 22 - 25đ...)`
            }
            className="w-full bg-[#07090D] text-white pl-3.5 pr-28 py-2.5 rounded-xl border border-[#262D3D] focus:border-[#3B82F6] text-xs placeholder-slate-400 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isGenerating || cooldown > 0 || !query.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#1E2536] disabled:text-slate-400 text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-3.5 h-3.5" />
                <span>Chờ {cooldown}s</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>AI Gợi Ý</span>
              </>
            )}
          </button>
        </div>

        {/* Cooldown / Anti-spam warning */}
        {warningMessage && (
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono bg-amber-950/40 border border-amber-800/60 p-2 rounded-lg animate-fadeIn">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}

        {/* Quick Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-slate-200 font-mono flex items-center gap-1 font-semibold">
            <Lightbulb className="w-3 h-3 text-amber-400" />
            Gợi ý nhanh:
          </span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isGenerating || cooldown > 0}
              onClick={() => {
                setQuery(chip.prompt);
                handleGenerate(chip.prompt);
              }}
              className="text-xs px-2.5 py-1 rounded-full bg-[#141A26] text-slate-100 hover:text-white hover:bg-[#2563EB] transition-colors border border-[#2c3852] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </form>

      {/* Generated Suggestions Output */}
      {results && results.length > 0 && (
        <div className="pt-2 border-t border-[#2563EB]/20 space-y-2.5">
          <div className="text-xs font-mono text-[#60A5FA] uppercase tracking-wider font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Top {results.length} Ngành Đào Tạo Phù Hợp Nhất Do AI Đề Xuất:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {results.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#090D14] border border-[#262d3d] hover:border-[#3B82F6] transition-all flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono mb-1">
                    <span className="text-cyan-300 font-bold px-1.5 py-0.5 bg-[#2563EB]/20 rounded border border-[#3B82F6]/40">
                      [{item.schoolCode}]
                    </span>
                    <span className="text-[#10B981] font-bold">
                      {formatCutoffScore(item.cutoff, item.scale)}
                    </span>
                  </div>

                  <h5 className="font-bold text-xs text-white group-hover:text-[#60A5FA] transition-colors line-clamp-2">
                    {item.majorName}
                  </h5>

                  <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                    {item.matchReason}
                  </p>

                  <div className="mt-2 text-xs text-slate-200 font-mono flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="line-clamp-1">{item.careerTrend}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  {onSelectSchoolWithMajor ? (
                    <button
                      type="button"
                      onClick={() => onSelectSchoolWithMajor(item.schoolCode, item.majorName)}
                      className="text-cyan-400 hover:text-white font-mono font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Xem vị trí ngành này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-200 font-mono">Tổ hợp: {item.combos.join(', ')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
