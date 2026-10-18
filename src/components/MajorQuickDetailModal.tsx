import React from 'react';
import { 
  X, 
  GraduationCap, 
  Building2, 
  Calculator, 
  TrendingUp, 
  DollarSign, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { sfx } from '../services/soundEffects';
import { formatFormulaDisplay, formatAdmissionMethod, formatCutoffScore } from '../utils/formulaFormatter';

export interface MajorQuickDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    record_id: string;
    institution_code: string;
    audited_major_name: string;
    audited_official_cutoff: number;
    audited_official_scale: string;
    subject_combinations: string[];
    method_id: string;
    formula_id: string;
    formula_expression?: string;
    bonus_and_priority_rule?: string;
    eligibility_and_tie_breaker?: string;
    campus_location?: string;
  } | null;
  schoolName?: string;
  onGoToSchoolWithMajor?: (schoolCode: string, majorName: string) => void;
  onCalculateScore?: (recordId: string) => void;
  onOpenAIChat?: (prompt: string) => void;
}

export const MajorQuickDetailModal: React.FC<MajorQuickDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  schoolName,
  onGoToSchoolWithMajor,
  onCalculateScore,
  onOpenAIChat
}) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-[#0B0E14] border border-[#2563EB]/40 rounded-2xl shadow-2xl overflow-hidden font-sans text-xs flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E293B] bg-[#0E131E] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA] shrink-0 mt-0.5">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-[#60A5FA] bg-[#2563EB]/15 px-2 py-0.5 rounded border border-[#3B82F6]/30">
                  [{record.institution_code}]
                </span>
                <span className="text-xs text-slate-200 font-medium font-mono">
                  {schoolName || record.institution_code} &middot; {record.campus_location || 'Trụ sở chính'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-snug">
                {record.audited_major_name}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              sfx.playUiClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-[#182030] text-slate-200 hover:text-white hover:bg-[#25324E] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-100">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#121722] border border-[#262838]">
              <span className="text-[11px] font-mono text-slate-200 font-bold uppercase">Điểm chuẩn:</span>
              <div className="text-lg font-bold text-[#10B981] font-mono mt-0.5">
                {formatCutoffScore(record.audited_official_cutoff, record.audited_official_scale)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#121722] border border-[#262838]">
              <span className="text-[11px] font-mono text-slate-200 font-bold uppercase">Tổ hợp xét tuyển:</span>
              <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">
                {record.subject_combinations.join(', ')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#121722] border border-[#262838] col-span-2 sm:col-span-1">
              <span className="text-[11px] font-mono text-slate-200 font-bold uppercase">Phương thức xét:</span>
              <div className="text-xs font-bold text-white font-mono mt-0.5">
                {formatAdmissionMethod(record.method_id)}
              </div>
            </div>
          </div>

          {/* Formula Details */}
          <div className="p-4 rounded-xl bg-[#0E131E] border border-[#262838] space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
              <span>Quy Chế Tính Điểm &amp; Tiêu Chí Phụ:</span>
            </h4>
            <div className="space-y-2 text-xs font-mono text-slate-200">
              {record.formula_expression && (
                <div>
                  • <strong className="text-white">Biểu thức tính điểm:</strong>{' '}
                  <code className="text-cyan-300 font-bold px-1.5 py-0.5 bg-black/60 rounded border border-cyan-500/20">
                    {formatFormulaDisplay(record.formula_expression)}
                  </code>
                </div>
              )}
              {record.bonus_and_priority_rule && (
                <div>
                  • <strong className="text-white">Điểm ưu tiên &amp; thưởng:</strong>{' '}
                  <span className="text-slate-100">{record.bonus_and_priority_rule}</span>
                </div>
              )}
              {record.eligibility_and_tie_breaker && (
                <div>
                  • <strong className="text-white">Điều kiện phụ:</strong>{' '}
                  <span className="text-slate-100">{record.eligibility_and_tie_breaker}</span>
                </div>
              )}
            </div>
          </div>

          {/* Career & Market Prospects */}
          <div className="p-4 rounded-xl bg-[#0E131E] border border-[#262838] space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
              <span>Cơ Hội Nghề Nghiệp &amp; Triển Vọng Thị Trường:</span>
            </h4>
            <p className="text-xs leading-relaxed text-slate-100">
              Sinh viên tốt nghiệp ngành <strong className="text-white">{record.audited_major_name}</strong> tại{' '}
              <strong className="text-white">{record.institution_code}</strong> có thể làm việc tại các tập đoàn thương mại quốc tế, cơ quan xúc tiến đầu tư, đại sứ quán, doanh nghiệp FDI, hoặc phát triển theo hướng chuyên gia phân tích dữ liệu thị trường và đàm phán hợp đồng xuất nhập khẩu.
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 border-t border-[#1E293B] bg-[#0E131E] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onCalculateScore && (
              <button
                type="button"
                onClick={() => {
                  sfx.playUiClick();
                  onClose();
                  onCalculateScore(record.record_id);
                }}
                className="px-3 py-2 rounded-xl bg-[#141C2B] hover:bg-[#1E293B] text-slate-100 hover:text-white border border-[#3B82F6]/50 transition-colors font-mono flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Thử tính điểm</span>
              </button>
            )}

            {onOpenAIChat && (
              <button
                type="button"
                onClick={() => {
                  sfx.playUiClick();
                  onClose();
                  onOpenAIChat(`Tư vấn cho em chi tiết về ngành "${record.audited_major_name}" tại trường [${record.institution_code}] xét tổ hợp ${record.subject_combinations.join(', ')}`);
                }}
                className="px-3 py-2 rounded-xl bg-[#141C2B] hover:bg-[#1E293B] text-slate-100 hover:text-white border border-[#3B82F6]/50 transition-colors font-mono flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
              >
                <span>Hỏi AI về ngành này</span>
              </button>
            )}
          </div>

          {onGoToSchoolWithMajor && (
            <button
              type="button"
              onClick={() => {
                sfx.playUiClick();
                onClose();
                onGoToSchoolWithMajor(record.institution_code, record.audited_major_name);
              }}
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-blue-600/30 text-xs font-mono ml-auto"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Xem vị trí ngành tại trường [{record.institution_code}]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
