import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  TrendingUp, 
  ShieldAlert, 
  BookOpen, 
  ChevronRight,
  RotateCcw,
  Sliders,
  DollarSign,
  MapPin
} from 'lucide-react';
import { SUBJECTS_LIST } from '../data/mockData';
import { LearnerProfile, AIAnalysisRecommendation } from '../types';
import { runAIAnalysis } from '../services/geminiService';

interface DiscoveryWizardProps {
  onPlanGenerated: (rec: AIAnalysisRecommendation) => void;
  onOpenAIConsult: (context: string) => void;
}

export const DiscoveryWizard: React.FC<DiscoveryWizardProps> = ({
  onPlanGenerated,
  onOpenAIConsult,
}) => {
  const [profile, setProfile] = useState<LearnerProfile>({
    strongSubjects: ['Toán học', 'Vật lý'],
    favoriteActivities: ['Nghiên cứu kỹ thuật & Lắp ráp', 'Lập trình & Giải thuật'],
    workEnvironment: 'lab',
    personalValues: ['Thu nhập & Cơ hội thăng tiến', 'Tự chủ & Sáng tạo'],
    maxTuitionPerYearMln: 35,
    preferredRegions: ['Hà Nội', 'TP. Hồ Chí Minh'],
    targetEducationType: 'university',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisRecommendation | null>(null);

  const activitiesList = [
    'Nghiên cứu kỹ thuật & Lắp ráp',
    'Lập trình & Giải thuật',
    'Phân tích số liệu & Báo cáo',
    'Giao tiếp khách hàng & Đàm phán',
    'Thiết kế đồ họa & Mỹ thuật thị giác',
    'Chăm sóc sức khỏe & Thí nghiệm y sinh',
    'Quản lý tổ chức & Điều phối dự án'
  ];

  const valuesList = [
    'Thu nhập & Cơ hội thăng tiến',
    'Ổn định lâu dài & Ít áp lực giờ giấc',
    'Tự chủ & Sáng tạo cao',
    'Tác động xã hội & Giúp đỡ cộng đồng',
    'Môi trường quốc tế & Làm việc từ xa'
  ];

  const toggleSubject = (s: string) => {
    setProfile(prev => ({
      ...prev,
      strongSubjects: prev.strongSubjects.includes(s)
        ? prev.strongSubjects.filter(item => item !== s)
        : [...prev.strongSubjects, s]
    }));
  };

  const toggleActivity = (a: string) => {
    setProfile(prev => ({
      ...prev,
      favoriteActivities: prev.favoriteActivities.includes(a)
        ? prev.favoriteActivities.filter(item => item !== a)
        : [...prev.favoriteActivities, a]
    }));
  };

  const toggleValue = (v: string) => {
    setProfile(prev => ({
      ...prev,
      personalValues: prev.personalValues.includes(v)
        ? prev.personalValues.filter(item => item !== v)
        : [...prev.personalValues, v]
    }));
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await runAIAnalysis(profile);
      setAnalysisResult(res);
      onPlanGenerated(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-8 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 text-xs font-tabular text-[#C5A880] uppercase tracking-wider mb-2">
          <Compass className="w-4 h-4 text-[#C5A880]" />
          <span>Module 1 · Career Discovery (Hồ Sơ Đa Tầng)</span>
        </div>
        <h2 className="font-serif-luxury text-3xl sm:text-4xl text-[#ECEEF2]">
          Khám Phá Năng Lực & Thiết Kế Lộ Trình Cá Nhân
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-[#8E9BAE] max-w-3xl leading-relaxed">
          NEXORA không dùng một bài test đơn lẻ để đưa ra con số 97% ảo. Hệ thống ghi nhận 6 tầng dữ liệu: thế mạnh môn học, kiểu công việc, môi trường, giá trị sống, ngân sách gia đình và khả năng chuyển đổi.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Inputs (Left side) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Strong Subjects */}
          <div className="p-6 rounded-2xl bg-[#0E131A] border border-white/[0.07]">
            <h3 className="text-sm font-semibold text-[#ECEEF2] flex items-center justify-between mb-3">
              <span>1. Môn học bạn tự tin hoặc có hứng thú nhất:</span>
              <span className="text-xs font-tabular text-[#C5A880]">
                Đã chọn {profile.strongSubjects.length}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS_LIST.map((subj) => {
                const active = profile.strongSubjects.includes(subj);
                return (
                  <button
                    key={subj}
                    onClick={() => toggleSubject(subj)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      active
                        ? 'bg-[#C5A880] text-[#07090D] font-semibold'
                        : 'bg-[#141A24] text-[#8E9BAE] hover:text-white border border-white/[0.05]'
                    }`}
                  >
                    {subj}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Preferred Activities */}
          <div className="p-6 rounded-2xl bg-[#0E131A] border border-white/[0.07]">
            <h3 className="text-sm font-semibold text-[#ECEEF2] mb-3">
              2. Hoạt động hoặc phương thức làm việc bạn thấy say mê:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activitiesList.map((act) => {
                const active = profile.favoriteActivities.includes(act);
                return (
                  <button
                    key={act}
                    onClick={() => toggleActivity(act)}
                    className={`p-2.5 rounded-xl text-left text-xs transition-all flex items-center gap-2 border ${
                      active
                        ? 'bg-[#182330] border-[#C5A880] text-[#ECEEF2]'
                        : 'bg-[#141A24] border-white/[0.04] text-[#8E9BAE] hover:text-white'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${active ? 'bg-[#C5A880]' : 'bg-white/20'}`} />
                    <span>{act}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Work Environment & Values */}
          <div className="p-6 rounded-2xl bg-[#0E131A] border border-white/[0.07]">
            <h3 className="text-sm font-semibold text-[#ECEEF2] mb-3">
              3. Giá trị cá nhân ưu tiên trong công việc:
            </h3>
            <div className="flex flex-wrap gap-2">
              {valuesList.map((val) => {
                const active = profile.personalValues.includes(val);
                return (
                  <button
                    key={val}
                    onClick={() => toggleValue(val)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      active
                        ? 'bg-[#213028] text-[#7FAFA0] border border-[#7FAFA0]/40 font-medium'
                        : 'bg-[#141A24] text-[#8E9BAE] hover:text-white border border-white/[0.04]'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Budget & Target Education Type */}
          <div className="p-6 rounded-2xl bg-[#0E131A] border border-white/[0.07] space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-[#ECEEF2]">
                  4. Mức học phí tối đa gia đình có thể đáp ứng:
                </span>
                <span className="font-tabular font-bold text-[#DFBA84]">
                  {profile.maxTuitionPerYearMln} triệu VND / năm
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="5"
                value={profile.maxTuitionPerYearMln}
                onChange={(e) => setProfile(prev => ({ ...prev, maxTuitionPerYearMln: Number(e.target.value) }))}
                className="w-full accent-[#C5A880] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-[#8E9BAE] mt-1 font-tabular">
                <span>10 tr (Cao đẳng/Trường nghề)</span>
                <span>35 tr (ĐH Công lập tự chủ)</span>
                <span>80 tr (ĐH Quốc tế/Tư thục)</span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.04]">
              <span className="block text-xs font-semibold text-[#ECEEF2] mb-2">
                5. Định hướng hình thức đào tạo:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'university', label: 'Đại học chính quy' },
                  { id: 'college_vocational', label: 'Cao đẳng thực hành' },
                  { id: 'modular_skills', label: 'Chứng chỉ nghề ngắn' },
                  { id: 'flexible', label: 'Linh hoạt mọi con đường' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setProfile(prev => ({ ...prev, targetEducationType: item.id as any }))}
                    className={`p-2.5 rounded-lg text-center transition-all ${
                      profile.targetEducationType === item.id
                        ? 'bg-[#18212D] border border-[#C5A880] text-[#ECEEF2] font-medium'
                        : 'bg-[#141A24] border border-white/[0.04] text-[#8E9BAE]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trigger Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#C5A880] to-[#E0C7A6] text-[#07090D] font-bold text-sm hover:opacity-95 transition-all shadow-xl shadow-[#C5A880]/15 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-[#07090D]" />
                <span>Đang phân tích 3 kịch bản với NEXORA AI Engine...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#07090D]" />
                <span>Tạo Bản Đồ Lộ Trình Đa Kịch Bản (ROOT-LOOP)</span>
              </>
            )}
          </button>
        </div>

        {/* Output Panel (Right side) */}
        <div className="lg:col-span-5">
          {analysisResult ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Executive Summary */}
              <div className="p-6 rounded-2xl bg-[#111620] border border-[#C5A880]/30 shadow-xl">
                <div className="flex items-center justify-between text-xs text-[#8E9BAE] mb-3">
                  <span className="text-[#C5A880] font-medium font-tabular">KẾT QUẢ ĐỊNH HƯỚNG CÓ CĂN CỨ</span>
                  <span className="bg-[#19241E] text-[#7FAFA0] px-2 py-0.5 rounded border border-[#7FAFA0]/20 font-tabular text-[10px]">
                    {analysisResult.evidenceBadge}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#ECEEF2] leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>

              {/* 6-Dimensional Fit Matrix (Radar/Spider concept) */}
              <div className="p-6 rounded-2xl bg-[#0E131A] border border-white/[0.08]">
                <h4 className="text-xs font-semibold text-[#ECEEF2] uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Hồ Sơ Cân Bằng Đa Chiều (Không Dùng 1 Điểm Ảo)</span>
                  <Sliders className="w-4 h-4 text-[#C5A880]" />
                </h4>
                <div className="space-y-3 text-xs">
                  {[
                    { label: 'Phù hợp sở thích', val: analysisResult.multidimensionalFit.interestScore, color: 'bg-[#C5A880]' },
                    { label: 'Sẵn sàng học thuật', val: analysisResult.multidimensionalFit.academicReadiness, color: 'bg-[#7FAFA0]' },
                    { label: 'Khả thi tuyển sinh', val: analysisResult.multidimensionalFit.admissionFeasibility, color: 'bg-[#DFBA84]' },
                    { label: 'Khả năng chi trả', val: analysisResult.multidimensionalFit.financialFeasibility, color: 'bg-[#5B8C7E]' },
                    { label: 'Cơ hội thị trường VN', val: analysisResult.multidimensionalFit.marketOutlook, color: 'bg-[#E5B573]' },
                    { label: 'Độ linh hoạt chuyển hướng', val: analysisResult.multidimensionalFit.pivotFlexibility, color: 'bg-[#89B9A6]' },
                  ].map((dim, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[#8E9BAE] mb-1">
                        <span>{dim.label}</span>
                        <span className="font-tabular font-medium text-[#ECEEF2]">{dim.val}/100</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${dim.color} rounded-full transition-all duration-700`}
                          style={{ width: `${dim.val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Scenarios / Branches */}
              <div className="space-y-4">
                {/* Branch A */}
                <div className="p-5 rounded-2xl bg-[#0E131A] border border-white/[0.08]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#C5A880]" />
                    <h5 className="font-semibold text-xs text-[#ECEEF2]">{analysisResult.branchA.title}</h5>
                  </div>
                  <p className="text-xs text-[#8E9BAE] mb-2">{analysisResult.branchA.rationale}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {analysisResult.branchA.recommendedMajors.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#18212D] text-[11px] text-[#ECEEF2]">
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#8E9BAE] italic">{analysisResult.branchA.prosAndCons}</p>
                </div>

                {/* Branch B */}
                <div className="p-5 rounded-2xl bg-[#0E131A] border border-white/[0.08]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#7FAFA0]" />
                    <h5 className="font-semibold text-xs text-[#ECEEF2]">{analysisResult.branchB.title}</h5>
                  </div>
                  <p className="text-xs text-[#8E9BAE] mb-2">{analysisResult.branchB.rationale}</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {analysisResult.branchB.recommendedMajors.map((m, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#13221C] text-[11px] text-[#7FAFA0]">
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-[#8E9BAE]">{analysisResult.branchB.marketSignals}</p>
                </div>

                {/* Branch C */}
                <div className="p-5 rounded-2xl bg-[#141920] border border-[#DFBA84]/25">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#DFBA84]" />
                    <h5 className="font-semibold text-xs text-[#DFBA84]">{analysisResult.branchC.title}</h5>
                  </div>
                  <p className="text-xs text-[#8E9BAE] mb-2">{analysisResult.branchC.rationale}</p>
                  <p className="text-xs text-[#ECEEF2] font-medium">{analysisResult.branchC.mitigationStrategy}</p>
                </div>
              </div>

              {/* Consultation trigger */}
              <button
                onClick={() => onOpenAIConsult('Tôi muốn thảo luận chi tiết về kết quả phân tích 3 kịch bản của tôi')}
                className="w-full py-3 rounded-xl bg-[#151D29] hover:bg-[#1B2636] border border-white/10 text-xs text-[#ECEEF2] font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Trò chuyện trực tiếp với AI về kế hoạch này</span>
              </button>
            </motion.div>
          ) : (
            <div className="p-8 rounded-3xl bg-[#0B0F15] border border-dashed border-white/[0.08] text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 rounded-2xl bg-[#141A24] flex items-center justify-center text-[#C5A880] mb-4">
                <Compass className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h4 className="text-base font-semibold text-[#ECEEF2]">Chưa kích hoạt phân tích</h4>
              <p className="text-xs text-[#8E9BAE] max-w-xs mt-2 leading-relaxed">
                Hãy tùy chỉnh thông tin ở bên trái và bấm <strong>"Tạo Bản Đồ Lộ Trình Đa Kịch Bản"</strong> để kích hoạt AI phân tích 6 chiều và 3 nhánh hành động.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
