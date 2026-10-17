import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sliders, 
  ExternalLink, 
  Building2, 
  Award, 
  Clock, 
  HelpCircle,
  FileText,
  Sparkles,
  MapPin,
  BookOpen,
  Info,
  ChevronRight
} from 'lucide-react';
import { 
  CandidateAdmissionProfile,
  calcNationalPriority30,
  calcYDS2026,
  calcTCT2026,
  calcNationalPriority100,
  interpolateTCTPercentile 
} from '../services/scoringEngine';
import { 
  VerifiedUniversity, 
  VerifiedProgramAdmission, 
  VERIFIED_COMBINATIONS_219,
  evaluateAdmissionSafety 
} from '../data/verifiedAdmissionDatabase';
import { AUDITED_INSTITUTIONS_300 } from '../data/auditedInstitutionsData';
import { lookupTT74 } from '../data/legalMappingTT74';
import { sfx } from '../services/soundEffects';

interface UniversityScoringInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  initialUniversity: VerifiedUniversity;
  initialProgram?: VerifiedProgramAdmission;
}

// 11 High School Graduation Subjects definition
const ALL_THPT_SUBJECTS: { key: string; name: string; short: string; defaultValue: number }[] = [
  { key: 'math', name: 'Toán học', short: 'Toán', defaultValue: 9.0 },
  { key: 'physics', name: 'Vật lý', short: 'Vật lý', defaultValue: 8.5 },
  { key: 'chemistry', name: 'Hóa học', short: 'Hóa', defaultValue: 8.0 },
  { key: 'biology', name: 'Sinh học', short: 'Sinh', defaultValue: 8.0 },
  { key: 'literature', name: 'Ngữ văn', short: 'Văn', defaultValue: 7.75 },
  { key: 'english', name: 'Tiếng Anh', short: 'Tiếng Anh', defaultValue: 8.5 },
  { key: 'history', name: 'Lịch sử', short: 'Sử', defaultValue: 7.5 },
  { key: 'geography', name: 'Địa lý', short: 'Địa', defaultValue: 7.5 },
  { key: 'civics', name: 'GDCD / GDKT&PL', short: 'GDCD', defaultValue: 8.0 },
  { key: 'informatics', name: 'Tin học', short: 'Tin', defaultValue: 9.0 },
  { key: 'technology', name: 'Công nghệ', short: 'Công nghệ', defaultValue: 8.5 }
];

export const UniversityScoringInspector: React.FC<UniversityScoringInspectorProps> = ({
  isOpen,
  onClose,
  initialUniversity,
  initialProgram
}) => {
  // Input states: Priorities & Regulations
  const [admissionYear] = useState<number>(2026);
  const [gradYear, setGradYear] = useState<number>(2026);
  const [kvBonus, setKvBonus] = useState<number>(0.25); // KV2 default
  const [subjectBonus, setSubjectBonus] = useState<number>(0);
  const [incentiveBonus, setIncentiveBonus] = useState<number>(0);
  const [aspirationOrder, setAspirationOrder] = useState<number>(1);
  const [ieltsScore, setIeltsScore] = useState<number>(6.5);

  // Subject scores map (11 graduation subjects + drawing aptitude)
  const [subjectScores, setSubjectScores] = useState<Record<string, number>>({
    math: 9.0,
    physics: 8.5,
    chemistry: 8.0,
    biology: 8.0,
    literature: 7.75,
    english: 8.5,
    history: 7.5,
    geography: 7.5,
    civics: 8.0,
    informatics: 9.0,
    technology: 8.5,
    drawing: 8.0
  });

  // Scale 100 components (ĐGNL ĐHQG-HCM, TSA BKA, HSA ĐHQG-HN, Học bạ)
  const [dgnlScore, setDgnlScore] = useState<number>(880); // max 1200 ĐHQG-HCM
  const [tsaScore, setTsaScore] = useState<number>(78.5);  // max 100 TSA Bách Khoa
  const [hsaScore, setHsaScore] = useState<number>(105);   // max 150 HSA ĐHQG-HN
  const [transcriptAvg, setTranscriptAvg] = useState<number>(27.0); // max 30 (3 môn học bạ)

  // For CTU / TCT: VSAT score
  const [vsatTotal, setVsatTotal] = useState<number>(26.0);

  // Active university & program selection
  const [selectedUni] = useState<VerifiedUniversity>(initialUniversity);
  const [selectedProg, setSelectedProg] = useState<VerifiedProgramAdmission | undefined>(initialProgram);

  // Selected combination code for the active program
  const availableCombos = useMemo(() => {
    if (selectedProg?.combinations && selectedProg.combinations.length > 0) {
      return selectedProg.combinations;
    }
    return ['A00', 'A01', 'D01', 'D07'];
  }, [selectedProg]);

  const [selectedComboCode, setSelectedComboCode] = useState<string>(() => {
    return selectedProg?.combinations?.[0] || 'A00';
  });

  // Switch between "Môn theo tổ hợp" vs "Toàn bộ 11 môn THPT"
  const [subjectInputMode, setSubjectInputMode] = useState<'combo' | 'all'>('combo');

  // Detailed institution registry data for address and background
  const institutionFullInfo = useMemo(() => {
    return AUDITED_INSTITUTIONS_300.find(i => i.code === selectedUni.code);
  }, [selectedUni]);

  // Legal code mapping via TT 74
  const legalMapping = useMemo(() => {
    if (!selectedProg) return null;
    return lookupTT74(selectedProg.majorCodeTT09);
  }, [selectedProg]);

  // Current combo metadata
  const currentComboMeta = useMemo(() => {
    return VERIFIED_COMBINATIONS_219.find(c => c.code === selectedComboCode) || {
      code: selectedComboCode,
      name: 'Tổ hợp xét tuyển',
      subjects: ['Toán', 'Vật lý', 'Hóa học'] as [string, string, string],
      description: 'Tổ hợp 3 môn chuẩn xét tuyển đại học'
    };
  }, [selectedComboCode]);

  // Resolve 3 subjects of selected combination into subjectScores keys
  const resolvedComboSubjects = useMemo(() => {
    const subs = currentComboMeta.subjects;
    return subs.map((subName: string, index: number) => {
      const lower = subName.toLowerCase();
      let key = 'math';
      if (lower.includes('toán')) key = 'math';
      else if (lower.includes('lý') || lower.includes('vật lí') || lower.includes('vật lý')) key = 'physics';
      else if (lower.includes('hóa')) key = 'chemistry';
      else if (lower.includes('sinh')) key = 'biology';
      else if (lower.includes('văn') || lower.includes('ngữ văn')) key = 'literature';
      else if (lower.includes('anh') || lower.includes('ngoại ngữ') || lower.includes('tiếng')) key = 'english';
      else if (lower.includes('sử') || lower.includes('lịch sử')) key = 'history';
      else if (lower.includes('địa')) key = 'geography';
      else if (lower.includes('tin') || lower.includes('tin học')) key = 'informatics';
      else if (lower.includes('công nghệ')) key = 'technology';
      else if (lower.includes('công dân') || lower.includes('gdcd') || lower.includes('gdkt')) key = 'civics';
      else if (lower.includes('vẽ') || lower.includes('mỹ thuật') || lower.includes('năng khiếu')) key = 'drawing';
      else {
        // Fallback for 3 distinct slots
        key = index === 0 ? 'math' : index === 1 ? 'literature' : 'english';
      }
      return {
        key,
        label: subName,
        score: subjectScores[key] ?? 8.0
      };
    });
  }, [currentComboMeta, subjectScores]);

  if (!isOpen) return null;

  // Build candidate profile
  const candidateProfile: CandidateAdmissionProfile = {
    subjectScores: {
      math: subjectScores.math,
      physics: subjectScores.physics,
      chemistry: subjectScores.chemistry,
      biology: subjectScores.biology,
      literature: subjectScores.literature,
      english: subjectScores.english,
      informatics: subjectScores.informatics
    },
    hsTranscriptScores: {
      math: transcriptAvg / 3,
      physics: transcriptAvg / 3,
      chemistry: transcriptAvg / 3
    },
    vsatScores: {
      math: vsatTotal / 3,
      physics: vsatTotal / 3,
      chemistry: vsatTotal / 3
    },
    ieltsScore,
    kvPriorityBonus: kvBonus,
    subjectPriorityBonus: subjectBonus,
    incentiveBonus,
    admissionYear,
    graduationYear: gradYear,
    aspirationOrder
  };

  // ===========================================================================
  // DYNAMIC SCALE DETECTION & CALCULATION ENGINE
  // ===========================================================================
  const uniCode = selectedUni.code;
  const isScale100 = selectedProg?.scale === 'Thang 100' || selectedUni.primaryScale === 'Thang 100 Kép' || uniCode === 'QSB';
  const isScale40 = selectedProg?.scale === 'Thang 40';

  let finalCalculatedScore = 0;
  let maxScale = isScale100 ? 100 : (isScale40 ? 40 : 30);
  let auditNotes: string[] = [];
  let rawScore = 0;
  let effectivePriority = 0;
  let tctPercentile: number | null = null;
  let tieBreakers: string[] = [];
  let formulaTitle = 'Phương thức Điểm thi Tốt nghiệp THPT 2026';
  let formulaExpression = 'M1 + M2 + M3 + Điểm Ưu Tiên';

  // Calculate combination 3 subjects score
  const sub1 = resolvedComboSubjects[0]?.score ?? 8.0;
  const sub2 = resolvedComboSubjects[1]?.score ?? 8.0;
  const sub3 = resolvedComboSubjects[2]?.score ?? 8.0;
  const rawComboSum = Number((sub1 + sub2 + sub3).toFixed(2));

  if (isScale100) {
    // =========================================================================
    // SCALE 100 COMPREHENSIVE (HCMUT / VNU-HCM / TSA BKA Scale 100)
    // =========================================================================
    maxScale = 100;
    formulaTitle = 'Phương thức Kết Hợp Toàn Diện Thang 100 (ĐGNL 70% + THPT 20% + Học Bạ 10%)';
    formulaExpression = '(ĐGNL / 1200 * 70) + (Tổ hợp 3 môn / 30 * 20) + (Học bạ 3 môn / 30 * 10) + ĐƯT_100';

    const dgnlConverted = Number(((dgnlScore / 1200) * 70).toFixed(2));
    const thptConverted = Number(((rawComboSum / 30) * 20).toFixed(2));
    const transcriptConverted = Number(((transcriptAvg / 30) * 10).toFixed(2));
    rawScore = Number((dgnlConverted + thptConverted + transcriptConverted).toFixed(2));

    const baseBonusScale100 = (kvBonus + subjectBonus) * (100 / 30);
    const pri100 = calcNationalPriority100(candidateProfile, rawScore, baseBonusScale100);
    effectivePriority = pri100.effectiveBonus;
    finalCalculatedScore = Number(Math.min(100, rawScore + effectivePriority).toFixed(2));

    auditNotes = [
      `[THANG 100 CHUẨN XÁC] Điểm ĐGNL (${dgnlScore}/1200) chiếm 70% = ${dgnlConverted.toFixed(2)} điểm.`,
      `Tổ hợp ${selectedComboCode} (${sub1} + ${sub2} + ${sub3} = ${rawComboSum.toFixed(2)}/30) chiếm 20% = ${thptConverted.toFixed(2)} điểm.`,
      `Học bạ 3 năm THPT (${transcriptAvg.toFixed(2)}/30) chiếm 10% = ${transcriptConverted.toFixed(2)} điểm.`,
      `Tổng điểm thành phần trước ưu tiên: ${rawScore.toFixed(2)} / 100 điểm.`,
      ...pri100.notes
    ];

    if (selectedProg?.tieBreakerRule) {
      tieBreakers.push(selectedProg.tieBreakerRule);
    }
  } else if (uniCode === 'BKA') {
    // =========================================================================
    // BÁCH KHOA HÀ NỘI (HUST - BKA): Môn Toán nhân đôi quy về Thang 30
    // =========================================================================
    maxScale = 30;
    formulaTitle = 'Công thức Chuẩn Bách Khoa Hà Nội (Môn Toán hệ số 2 quy về 30)';
    formulaExpression = '[(Toán x 2 + Môn 2 + Môn 3) * 3/4] + Điểm Ưu Tiên';

    const mathScore = subjectScores.math;
    const rawHust = (mathScore * 2 + sub2 + sub3) * (3 / 4);
    rawScore = Number(rawHust.toFixed(2));

    const pri = calcNationalPriority30(candidateProfile, rawScore, incentiveBonus);
    effectivePriority = pri.priorityIncludeBonus;
    finalCalculatedScore = Number(Math.min(30, rawScore + effectivePriority + incentiveBonus).toFixed(2));

    auditNotes = [
      `[HUST ĐẶC THÙ] Môn Toán (${mathScore}) nhân hệ số 2 theo công thức: (Toán x 2 + ${resolvedComboSubjects[1]?.label} + ${resolvedComboSubjects[2]?.label}) * 3/4.`,
      `Chi tiết: (${mathScore} x 2 + ${sub2} + ${sub3}) * 0.75 = ${rawScore.toFixed(2)} điểm thuần.`,
      `Ưu tiên khu vực/đối tượng theo Thông tư 06/2026/TT-BGDĐT: +${effectivePriority.toFixed(3)} điểm.`,
      ...pri.notes
    ];

    if (selectedProg?.tieBreakerRule) {
      tieBreakers.push(selectedProg.tieBreakerRule);
    }
  } else if (uniCode === 'YDS') {
    // =========================================================================
    // ĐẠI HỌC Y DƯỢC TP.HCM (YDS): B00 / B08 + Tie-breaker Sinh học
    // =========================================================================
    maxScale = 30;
    formulaTitle = 'Phương thức Điểm thi THPT Khối Y Dược (B00 / B08)';
    formulaExpression = 'Toán + Hóa + Sinh (hoặc Anh) + Điểm Ưu Tiên (Bộ GD&ĐT)';

    const ydsRes = calcYDS2026(candidateProfile, 'Y_KHOA_RHM');
    finalCalculatedScore = ydsRes.finalScore;
    rawScore = ydsRes.auditBreakdown.raw3SubjectTotal;
    effectivePriority = ydsRes.auditBreakdown.priorityIncludeBonus;
    auditNotes = ydsRes.auditBreakdown.auditNotes;
    tieBreakers = ydsRes.tieBreakerNotes || [];
    if (selectedProg?.tieBreakerRule) {
      tieBreakers.push(selectedProg.tieBreakerRule);
    }
  } else if (uniCode === 'TCT') {
    // =========================================================================
    // ĐẠI HỌC CẦN THƠ (CTU - TCT): VSAT & Bách phân vị
    // =========================================================================
    maxScale = 30;
    formulaTitle = 'Phương thức Điểm thi V-SAT & Học bạ Bách Phân Vị Cần Thơ';
    formulaExpression = 'Tổng 3 môn V-SAT (hoặc Học bạ) + Điểm Ưu Tiên -> Tra Bách Phân Vị';

    const tctRes = calcTCT2026(candidateProfile, 'VSAT');
    finalCalculatedScore = tctRes.finalScore;
    rawScore = tctRes.auditBreakdown.raw3SubjectTotal;
    effectivePriority = tctRes.auditBreakdown.priorityIncludeBonus;
    auditNotes = tctRes.auditBreakdown.auditNotes;
    tctPercentile = interpolateTCTPercentile(rawScore, 'VSAT');
    if (selectedProg?.tieBreakerRule) {
      tieBreakers.push(selectedProg.tieBreakerRule);
    }
  } else {
    // =========================================================================
    // CÁC TRƯỜNG KHÁC: TÍNH CHUẨN XÁC THEO TỔ HỢP ĐƯỢC CHỌN VÀ THANG ĐIỂM
    // =========================================================================
    rawScore = rawComboSum;
    formulaTitle = `Xét tuyển Tổ hợp ${selectedComboCode} (${currentComboMeta.name})`;

    // Check if program specifies a primary subject with multiplier
    if (selectedProg?.primarySubject && selectedProg.primarySubject.includes('Hệ số 2')) {
      const pSub = sub1;
      rawScore = Number(((pSub * 2 + sub2 + sub3) * 0.75).toFixed(2));
      formulaExpression = `[(${resolvedComboSubjects[0]?.label} x 2 + ${resolvedComboSubjects[1]?.label} + ${resolvedComboSubjects[2]?.label}) * 3/4] + ĐƯT`;
      auditNotes.push(`Môn chính (${resolvedComboSubjects[0]?.label}) nhân hệ số 2 quy đổi thang 30 (*3/4).`);
    } else {
      formulaExpression = `${resolvedComboSubjects[0]?.label} (${sub1}) + ${resolvedComboSubjects[1]?.label} (${sub2}) + ${resolvedComboSubjects[2]?.label} (${sub3}) + ĐƯT`;
    }

    const pri = calcNationalPriority30(candidateProfile, rawScore, incentiveBonus);
    effectivePriority = pri.priorityIncludeBonus;
    finalCalculatedScore = Number(Math.min(30, rawScore + effectivePriority + incentiveBonus).toFixed(2));

    auditNotes = [
      `Tổ hợp ${selectedComboCode} (${currentComboMeta.name}): ${rawScore.toFixed(2)}/30 điểm thuần.`,
      `Các môn thành phần: ${resolvedComboSubjects[0]?.label}=${sub1}, ${resolvedComboSubjects[1]?.label}=${sub2}, ${resolvedComboSubjects[2]?.label}=${sub3}.`,
      ...pri.notes
    ];

    if (selectedProg?.tieBreakerRule) {
      tieBreakers.push(selectedProg.tieBreakerRule);
    }
  }

  // Safety evaluation against selected program
  const safetyEval = selectedProg 
    ? evaluateAdmissionSafety(finalCalculatedScore, selectedProg.benchmark2025, selectedProg.scale)
    : null;

  const handleScoreChange = (key: string, val: number) => {
    const clamped = Math.max(0, Math.min(10, Number(val)));
    setSubjectScores(prev => ({ ...prev, [key]: clamped }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl bg-[#090C12] border border-white/10 shadow-2xl overflow-hidden my-auto"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-start justify-between bg-[#0E131C]">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#2563EB]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA] shrink-0 mt-0.5">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#2563EB]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                  MÃ TRƯỜNG: {selectedUni.code}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#48E596]/10 text-[#48E596] border border-[#48E596]/30">
                  {selectedUni.provenance.sourceType === 'PRIMARY_OFFICIAL' ? 'ĐỀ ÁN CHÍNH THỨC 2026' : 'DỮ LIỆU ĐỐI SOÁT'}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold">
                  THANG {maxScale}
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-bold text-white mt-1">
                Bộ Soi Công Thức &amp; Tính Điểm Chuẩn Thực Tế: {selectedUni.shortName}
              </h3>
              <p className="text-xs text-[#8E9BAE] mt-0.5">
                {selectedUni.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.play('close');
              onClose();
            }}
            className="p-2 rounded-lg text-[#8E9BAE] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Institutional Address & Official Provenance Card */}
          <div className="p-4 rounded-xl bg-[#141A24] border border-white/[0.06] space-y-2.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.05] pb-2">
              <div className="flex items-center gap-2 text-white font-bold">
                <Building2 className="w-4 h-4 text-[#60A5FA]" />
                <span>Trụ Sở &amp; Hồ Sơ Pháp Lý Tuyển Sinh</span>
              </div>
              {selectedUni.provenance.officialDocumentUrl && (
                <a
                  href={selectedUni.provenance.officialDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-[#60A5FA] hover:text-blue-300 hover:underline"
                >
                  <span>Xem văn bản đề án gốc</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div className="space-y-1">
                <div className="flex items-start gap-1.5 text-[#CCCCCC]">
                  <MapPin className="w-3.5 h-3.5 text-[#C6F135] shrink-0 mt-0.5" />
                  <span>
                    <strong>Địa chỉ trụ sở chính:</strong> {institutionFullInfo?.detailed_address_and_history || `${selectedUni.city}, Việt Nam`}
                  </span>
                </div>
                <div className="text-[#8E9BAE] pl-5">
                  Tỉnh/Thành phố: <strong className="text-white">{selectedUni.city}</strong> · Vùng: <span className="text-white">{selectedUni.region}</span> · Phân hạng: <span className="text-white">{selectedUni.tier}</span>
                </div>
              </div>

              <div className="space-y-1 text-[#8E9BAE]">
                <div>
                  Văn bản đề án: <strong className="text-white">{selectedUni.provenance.officialDocumentNumber}</strong> (Ngày ban hành: {selectedUni.provenance.officialDocumentDate})
                </div>
                <div>
                  Kiểm toán quy chuẩn: <strong className="text-[#48E596]">{selectedUni.provenance.lastAuditedDate}</strong> theo Thông tư 06/2026/TT-BGDĐT
                </div>
              </div>
            </div>
          </div>

          {/* Program context & Major Code Badge (TT 74 & TT 09) */}
          {selectedProg && (
            <div className="p-4 rounded-xl bg-[#0F1824] border border-[#3B82F6]/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                      MÃ TT 74/2026: {selectedProg.majorCodeTT74} (MÃ MỚI 6 CHỮ SỐ)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#8E9BAE]">
                      Mã TT 09/2022: {selectedProg.majorCodeTT09}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {selectedProg.scale.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">
                    {selectedProg.majorName}
                  </h4>
                  {selectedProg.subMajorName && (
                    <p className="text-xs text-[#8E9BAE] italic">{selectedProg.subMajorName}</p>
                  )}
                </div>

                {safetyEval && (
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono text-center shrink-0 ${safetyEval.colorClass}`}>
                    {safetyEval.label}
                  </div>
                )}
              </div>

              {/* Benchmarks 3 years & Quota & Tuition */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#141A24] border border-white/[0.04]">
                  <span className="text-[10px] text-[#8E9BAE] block">Điểm chuẩn 2024</span>
                  <span className="font-bold text-white text-sm">{selectedProg.benchmark2024}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141A24] border border-white/[0.04]">
                  <span className="text-[10px] text-[#8E9BAE] block">Điểm chuẩn 2025</span>
                  <span className="font-bold text-[#60A5FA] text-sm">{selectedProg.benchmark2025}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141A24] border border-white/[0.04]">
                  <span className="text-[10px] text-[#8E9BAE] block">Dự kiến 2026</span>
                  <span className="font-bold text-[#48E596] text-sm">{selectedProg.benchmark2026Est}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141A24] border border-white/[0.04]">
                  <span className="text-[10px] text-[#8E9BAE] block">Chỉ tiêu / Học phí</span>
                  <span className="font-bold text-white text-xs">{selectedProg.quota} SV · {selectedProg.tuitionMlnYear} tr/năm</span>
                </div>
              </div>

              {/* Formula & Tie-breaker notes */}
              <div className="text-[11px] text-[#A1A1AA] space-y-1 bg-[#121620] p-3 rounded-lg border border-white/[0.04]">
                <div>
                  <strong className="text-white">Cách tính điểm:</strong> <span className="text-[#60A5FA]">{formulaTitle}</span> · <code className="text-[#C6F135]">{formulaExpression}</code>
                </div>
                {selectedProg.primarySubject && (
                  <div className="text-amber-300">
                    • Môn chính: <strong>{selectedProg.primarySubject}</strong>
                  </div>
                )}
                <div>
                  • Tiêu chí phụ xét tuyển (Tie-Breaker): <span className="text-[#CCCCCC]">{selectedProg.tieBreakerRule}</span>
                </div>
                {legalMapping && (
                  <div className="text-[10px] text-[#8E9BAE] pt-1 border-t border-white/[0.05]">
                    ℹ️ Đối soát TT 74/2026: {legalMapping.legalNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Combination Selector Tabs */}
          <div className="p-4 rounded-xl bg-[#121722] border border-white/[0.05] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#60A5FA]" />
                <span>Chọn Tổ Hợp Môn Xét Tuyển Cho Ngành Này:</span>
              </label>
              <span className="text-[11px] text-[#8E9BAE]">
                {availableCombos.length} tổ hợp được chấp nhận
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableCombos.map(combo => {
                const isSelected = selectedComboCode === combo;
                const meta = VERIFIED_COMBINATIONS_219.find(c => c.code === combo);
                return (
                  <button
                    key={combo}
                    type="button"
                    onClick={() => {
                      sfx.play('click');
                      setSelectedComboCode(combo);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#2563EB] text-white font-bold shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                        : 'bg-[#18202F] text-[#CCCCCC] hover:text-white hover:bg-[#202b3f] border border-white/10'
                    }`}
                  >
                    <span className="font-bold">{combo}</span>
                    {meta && <span className="text-[10px] opacity-80">({meta.subjects.join(' - ')})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Column: Component Scores & THPT Subjects */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#60A5FA]" />
                  <span>1. Nhập Điểm Thành Phần Thí Sinh</span>
                </h4>

                {/* Mode toggle */}
                <div className="flex items-center bg-[#18202F] p-0.5 rounded-lg text-[10px] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSubjectInputMode('combo')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      subjectInputMode === 'combo' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#8E9BAE] hover:text-white'
                    }`}
                  >
                    3 Môn Tổ Hợp ({selectedComboCode})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubjectInputMode('all')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      subjectInputMode === 'all' ? 'bg-[#2563EB] text-white font-bold' : 'text-[#8E9BAE] hover:text-white'
                    }`}
                  >
                    Tất Cả 11 Môn THPT
                  </button>
                </div>
              </div>

              {/* SCALE 100 SPECIFIC INPUTS (ĐGNL + THPT + HỌC BẠ) */}
              {isScale100 && (
                <div className="space-y-3 p-4 rounded-xl bg-[#121722] border border-[#3B82F6]/30">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#48E596]" />
                      Các Thành Phần Thang 100 Toàn Diện
                    </span>
                    <span className="text-[10px] text-[#48E596] font-mono font-bold">Trọng số 70% : 20% : 10%</span>
                  </div>

                  {/* 1. ĐGNL ĐHQG-HCM (70%) */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">1. Điểm thi ĐGNL ĐHQG-HCM (70%):</span>
                      <span className="font-mono font-bold text-[#48E596]">{dgnlScore} / 1200 điểm</span>
                    </div>
                    <input
                      type="range"
                      min="400"
                      max="1200"
                      step="5"
                      value={dgnlScore}
                      onChange={(e) => setDgnlScore(Number(e.target.value))}
                      className="w-full accent-[#48E596] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#8E9BAE] mt-0.5">
                      <span>400đ</span>
                      <span>Quy đổi: {((dgnlScore / 1200) * 70).toFixed(2)} / 70đ</span>
                      <span>1200đ</span>
                    </div>
                  </div>

                  {/* 2. Điểm TSA Bách Khoa (nếu dùng) */}
                  <div className="pt-2 border-t border-white/[0.04]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#CCCCCC]">Hoặc Điểm thi TSA Bách Khoa Hà Nội:</span>
                      <span className="font-mono font-bold text-blue-300">{tsaScore.toFixed(1)} / 100 điểm</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      step="0.5"
                      value={tsaScore}
                      onChange={(e) => setTsaScore(Number(e.target.value))}
                      className="w-full accent-[#3B82F6] cursor-pointer"
                    />
                  </div>

                  {/* 3. Điểm học bạ 3 môn (10%) */}
                  <div className="pt-2 border-t border-white/[0.04]">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white">2. Tổng điểm học bạ THPT 3 môn (10%):</span>
                      <span className="font-mono font-bold text-amber-300">{transcriptAvg.toFixed(1)} / 30 điểm</span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="30"
                      step="0.25"
                      value={transcriptAvg}
                      onChange={(e) => setTranscriptAvg(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#8E9BAE] mt-0.5">
                      <span>18đ</span>
                      <span>Quy đổi: {((transcriptAvg / 30) * 10).toFixed(2)} / 10đ</span>
                      <span>30đ</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC THPT SUBJECT INPUTS */}
              <div className="p-4 rounded-xl bg-[#121722] border border-white/[0.05] space-y-3">
                <div className="flex items-center justify-between border-b border-white/[0.05] pb-2">
                  <span className="text-xs font-semibold text-white">
                    {subjectInputMode === 'combo' 
                      ? `Điểm 3 môn tổ hợp ${selectedComboCode}: ${currentComboMeta.subjects.join(' - ')}` 
                      : 'Nhập điểm tất cả 11 môn thi THPT (Thang điểm 0 - 10)'}
                  </span>
                  <span className="text-[10px] font-mono text-[#60A5FA]">
                    Tổng 3 môn: {rawComboSum.toFixed(2)} / 30đ
                  </span>
                </div>

                {subjectInputMode === 'combo' ? (
                  /* Combo Mode: exactly the 3 subjects required */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {resolvedComboSubjects.map((sub, idx) => (
                      <div key={sub.key + idx} className="space-y-1">
                        <label className="block text-xs text-[#ECEEF2] font-medium truncate">
                          Môn {idx + 1}: <strong className="text-white">{sub.label}</strong>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.1"
                          value={sub.score}
                          onChange={(e) => handleScoreChange(sub.key, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 rounded-lg bg-[#18202F] border border-white/10 text-xs text-white font-mono focus:border-[#3B82F6] outline-none"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* All 11 subjects grid */
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {ALL_THPT_SUBJECTS.map(item => {
                      const isPartOfActiveCombo = currentComboMeta.subjects.some((s: string) => 
                        s.toLowerCase().includes(item.short.toLowerCase())
                      );
                      return (
                        <div 
                          key={item.key} 
                          className={`p-2 rounded-lg border ${
                            isPartOfActiveCombo ? 'bg-[#18253a] border-[#3B82F6]/50' : 'bg-[#18202F] border-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className={isPartOfActiveCombo ? 'text-[#60A5FA] font-bold' : 'text-[#8E9BAE]'}>
                              {item.name}
                            </span>
                            {isPartOfActiveCombo && (
                              <span className="text-[9px] px-1 rounded bg-[#2563EB]/20 text-[#60A5FA]">Tổ hợp</span>
                            )}
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={subjectScores[item.key] ?? item.defaultValue}
                            onChange={(e) => handleScoreChange(item.key, parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 rounded bg-[#0F141E] border border-white/10 text-xs text-white font-mono focus:border-[#3B82F6] outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Priority & Eligibility Controls */}
              <div className="p-4 rounded-xl bg-[#121722] border border-white/[0.05] space-y-3">
                <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#48E596]" />
                  <span>Điều Kiện Biên &amp; Điểm Ưu Tiên Quy Chế Tuyển Sinh Bộ GD&amp;ĐT</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-[#8E9BAE] mb-1">Năm tốt nghiệp:</label>
                    <input
                      type="number"
                      value={gradYear}
                      onChange={(e) => setGradYear(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 rounded-lg bg-[#18202F] border text-xs font-mono outline-none ${
                        gradYear > admissionYear ? 'border-[#FF4D4D] text-[#FF4D4D]' : 'border-white/10 text-white'
                      }`}
                    />
                    {gradYear > admissionYear && (
                      <span className="text-[9px] text-[#FF4D4D] block mt-0.5">Lỗi: Tốt nghiệp tương lai!</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8E9BAE] mb-1">Khu vực ưu tiên:</label>
                    <select
                      value={kvBonus}
                      onChange={(e) => setKvBonus(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#18202F] border border-white/10 text-xs text-white outline-none"
                    >
                      <option value="0.75">KV1 (+0.75đ)</option>
                      <option value="0.5">KV2-NT (+0.50đ)</option>
                      <option value="0.25">KV2 (+0.25đ)</option>
                      <option value="0">KV3 (+0.00đ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8E9BAE] mb-1">Đối tượng chính sách:</label>
                    <select
                      value={subjectBonus}
                      onChange={(e) => setSubjectBonus(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#18202F] border border-white/10 text-xs text-white outline-none"
                    >
                      <option value="0">Không có (0.00)</option>
                      <option value="2.0">ĐT 01 - 04 (+2.0đ)</option>
                      <option value="1.0">ĐT 05 - 07 (+1.0đ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8E9BAE] mb-1">Chứng chỉ IELTS:</label>
                    <select
                      value={ieltsScore}
                      onChange={(e) => setIeltsScore(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg bg-[#18202F] border border-white/10 text-xs text-white outline-none"
                    >
                      <option value="0">Không có</option>
                      <option value="5.5">IELTS 5.5</option>
                      <option value="6.0">IELTS 6.0</option>
                      <option value="6.5">IELTS 6.5</option>
                      <option value="7.0">IELTS 7.0</option>
                      <option value="7.5">IELTS 7.5+</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Audit Result Card */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-4">
              <div className="p-5 rounded-2xl bg-[#0D121B] border border-[#3B82F6]/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <span className="text-xs font-mono text-[#8E9BAE]">Điểm xét tuyển chính thức</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-[#60A5FA] border border-[#3B82F6]/40 font-mono">
                    THANG {maxScale}
                  </span>
                </div>

                <div className="text-center py-2">
                  <div className="font-mono font-extrabold text-4xl sm:text-5xl text-white tracking-tight">
                    {finalCalculatedScore.toFixed(2)}
                    <span className="text-lg text-[#8E9BAE] font-medium font-sans"> / {maxScale}</span>
                  </div>
                  <p className="text-xs text-[#48E596] font-medium mt-1">
                    Công thức thực tế {selectedUni.shortName} · {selectedComboCode}
                  </p>
                </div>

                {/* Score breakdown mini-table */}
                <div className="space-y-1.5 text-xs font-mono bg-[#141A24] p-3 rounded-xl border border-white/[0.05]">
                  <div className="flex justify-between text-[#8E9BAE]">
                    <span>Điểm thành phần thô:</span>
                    <span className="text-white font-semibold">{rawScore.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#8E9BAE]">
                    <span>Ưu tiên thực nhận:</span>
                    <span className="text-[#48E596] font-semibold">+{effectivePriority.toFixed(3)}</span>
                  </div>

                  {/* Progressive reduction alert */}
                  {rawScore >= (maxScale === 100 ? 75.0 : 22.5) && (
                    <div className="text-[10px] text-amber-300 flex items-center gap-1 pt-1 border-t border-white/[0.05]">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Kích hoạt giảm trừ lũy tiến ưu tiên Bộ GD&amp;ĐT</span>
                    </div>
                  )}

                  {/* Cutoff Comparison */}
                  {selectedProg && (
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-[#8E9BAE]">Điểm chuẩn 2025:</span>
                      <span className="font-bold text-white">
                        {selectedProg.benchmark2025} ({selectedProg.scale})
                      </span>
                    </div>
                  )}

                  {selectedProg && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#8E9BAE]">Chênh lệch:</span>
                      {(() => {
                        const diff = finalCalculatedScore - selectedProg.benchmark2025;
                        return (
                          <span className={`font-bold ${diff >= 0 ? 'text-[#48E596]' : 'text-[#FF4D4D]'}`}>
                            {diff >= 0 ? '+' : ''}{diff.toFixed(2)} điểm
                          </span>
                        );
                      })()}
                    </div>
                  )}

                  {tctPercentile !== null && (
                    <div className="flex justify-between text-[#C5A880] pt-1 border-t border-white/[0.05]">
                      <span>Bách phân vị Cần Thơ:</span>
                      <span className="font-bold">Top {(100 - tctPercentile).toFixed(1)}% (P{tctPercentile.toFixed(1)})</span>
                    </div>
                  )}
                </div>

                {/* Tie breaker if any */}
                {tieBreakers.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#1A1420] border border-[#A855F7]/30 text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-[#A855F7]">Tiêu chí phụ (Tie-Breaker):</span>
                    {tieBreakers.map((tb, idx) => (
                      <p key={idx} className="text-[#ECEEF2] text-[11px] leading-relaxed">
                        • {tb}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => {
                  sfx.play('click');
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Kiểm Định Lại Kết Quả Với Tổ Hợp Này</span>
              </button>
            </div>
          </div>

          {/* Audit Trail Log */}
          <div className="p-4 rounded-xl bg-[#0B0F16] border border-white/[0.06] space-y-2">
            <h5 className="text-xs font-bold text-[#8E9BAE] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#48E596]" />
              <span>Báo Cáo Kiểm Toán Thuật Toán Điểm Tuyển Sinh (Audit Breakdown)</span>
            </h5>
            <div className="space-y-1.5 font-mono text-[11px] text-[#A1A1AA] bg-black/40 p-3 rounded-lg border border-white/[0.04]">
              {auditNotes.map((note, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="text-[#60A5FA]">[Log {idx + 1}]</span> {note}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0E131C] flex justify-end">
          <button
            onClick={() => {
              sfx.play('close');
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white font-medium transition-colors cursor-pointer"
          >
            Đóng Trình Soi
          </button>
        </div>
      </motion.div>
    </div>
  );
};
