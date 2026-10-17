export interface LearnerProfile {
  name?: string;
  strongSubjects: string[]; // ['Toán', 'Vật lý', 'Hóa học'...]
  favoriteActivities: string[]; // ['Nghiên cứu kỹ thuật', 'Lập trình', 'Sáng tạo nội dung'...]
  workEnvironment: 'office' | 'lab' | 'factory' | 'outdoor' | 'hybrid';
  personalValues: string[]; // ['Thu nhập cao', 'Ổn định lâu dài', 'Tự chủ sáng tạo', 'Tác động xã hội'...]
  maxTuitionPerYearMln: number; // Triệu VND / năm
  preferredRegions: string[]; // ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'...]
  targetEducationType: 'university' | 'college_vocational' | 'modular_skills' | 'flexible';
  selfReportedScores?: { [subject: string]: number }; // Điểm thi dự kiến
}

export interface SubjectCombination {
  code: string; // 'A00', 'A01', 'B00', 'D01'
  name: string;
  subjects: string[];
  description: string;
  majorCount: number;
  benchmarkRange: string; // '21.5 - 28.5'
}

export interface Major {
  id: string;
  code: string; // Mã ngành bộ GDĐT
  name: string;
  category: string; // Kỹ thuật, Y Dược, Kinh tế, Công nghệ, Thiết kế
  coreDisciplines: string[]; // Các môn học cốt lõi
  expectedCompetencies: string[]; // Kỹ năng khi ra trường
  directlyRelatedJobs: string[]; // Nghề trực tiếp
  adjacentJobs: string[]; // Nghề kề bên có thể chuyển hướng
  estimatedTuitionRange: string; // 24 - 45 tr/năm
  studyDurationYears: number; // 4 - 4.5 năm
  marketDemandOutlook: 'Tăng trưởng mạnh' | 'Ổn định' | 'Chuyển dịch kỹ năng' | 'Cạnh tranh cao';
  automationImpactAnalysis: string; // Không giật gân, phân tích nhiệm vụ thay đổi
  transitionPivots: string[]; // Nếu sau 1 năm thấy không hợp, chuyển đi đâu
  applicableCombinations: string[]; // ['A00', 'A01', 'D07']
}

export interface Institution {
  id: string;
  code: string;
  name: string;
  shortName: string;
  type: 'Đại học công lập' | 'Đại học tư thục' | 'Cao đẳng thực hành' | 'Trường nghề';
  region: 'Miền Bắc' | 'Miền Trung' | 'Miền Nam';
  city: string;
  tuitionPerYearMln: number;
  scholarshipPolicies: string;
  industryPartnerships: string[];
  programs: {
    majorId: string;
    majorName: string;
    admissionCombinations: string[];
    benchmark2025: number;
    benchmark2024: number;
    quota: number;
  }[];
}

export interface Occupation {
  id: string;
  title: string;
  sector: string;
  dailyTasks: string[];
  essentialSkills: string[];
  trainableOnJobSkills: string[];
  credentialRequirements: string;
  salaryRangeMonthlyMln: {
    entry: string; // '10 - 16 triệu'
    mid: string; // '18 - 35 triệu'
    senior: string; // '40 - 70+ triệu'
    source: string;
  };
  laborMarketUrgency: 'Rất cao' | 'Trung bình' | 'Đặc thù niche';
  techEvolutionNotes: string; // Phân tích nhiệm vụ thay đổi do AI/Tự động hóa
  alternativeEntryPaths: string[]; // Không chỉ ĐH, mà qua cao đẳng + chứng chỉ
  adjacentOccupations: string[];
}

export interface LaborMarketSignal {
  region: string;
  sector: string;
  growthRatePct: number;
  verifiedOpeningsCount: number;
  topDemandedSkills: string[];
  youthUnemploymentContext: string; // Trích xuất thống kê Cục Thống kê Q2/2026
  threeYearHorizonOutlook: string;
}

export interface EmployerOrder {
  id: string;
  enterpriseName: string;
  industry: string;
  targetRole: string;
  quantityNeeded: number;
  timelineYears: number; // 1, 3, 5 năm
  location: string;
  essentialCompetencies: string[];
  expectedStartingSalary: string;
  commitmentTier: 'Forecast' | 'Reservation' | 'Sponsorship' | 'Hiring commitment';
  verifiedStatus: 'Đã xác minh' | 'Đang xử lý';
  legalNotice: string;
}

export interface AlternativePath {
  id: string;
  targetGoal: string;
  pathType: 'Cao đẳng thực hành' | 'Đào tạo nghề (Apprenticeship)' | 'Mô-đun kỹ năng & Chứng chỉ' | 'Liên thông đại học';
  durationMonths: number;
  estimatedCostMln: number;
  startingAdvantage: string;
  transferabilityIndex: string; // Khả năng công nhận tín chỉ / học tiếp
  keyProgramsInVN: string[];
}

export interface AIAnalysisRecommendation {
  summary: string;
  branchA: {
    title: string;
    rationale: string;
    recommendedMajors: string[];
    prosAndCons: string;
  };
  branchB: {
    title: string;
    rationale: string;
    recommendedMajors: string[];
    marketSignals: string;
  };
  branchC: {
    title: string;
    rationale: string;
    recommendedAlternatives: string[];
    mitigationStrategy: string;
  };
  multidimensionalFit: {
    interestScore: number; // 0-100
    academicReadiness: number;
    admissionFeasibility: number;
    financialFeasibility: number;
    marketOutlook: number;
    pivotFlexibility: number;
  };
  evidenceBadge: 'Đã xác minh theo đề án' | 'Tín hiệu ước lượng có nguồn' | 'Dự báo dài hạn';
}

export type MilestoneType = 'course' | 'certification' | 'internship' | 'project' | 'competition';
export type MilestoneStage = 
  | 'stage-1-foundation'      // Năm 1-2: Nền tảng
  | 'stage-2-specialization'  // Năm 2-3: Tăng tốc & Chứng chỉ chuyên sâu
  | 'stage-3-internship'      // Năm 3-4: Thực tập Doanh nghiệp & Dự án
  | 'stage-4-career';         // Năm 4+ & Sau tốt nghiệp: Gia nhập thị trường

export interface TimelineMilestone {
  id: string;
  title: string;
  type: MilestoneType;
  stage: MilestoneStage;
  stageLabel: string;
  durationText: string;
  provider: string;
  summary: string;
  skillsGained: string[];
  prerequisites?: string[];
  costEstimate?: string;
  proTips: string;
  isCompleted?: boolean;
  isBookmarked?: boolean;
  externalLink?: string;
}

export interface OccupationTimeline {
  occupationId: string;
  occupationTitle: string;
  sector: string;
  overview: string;
  estimatedTotalMonths: number;
  recommendedMajors: string[];
  targetCompaniesInVN: string[];
  milestones: TimelineMilestone[];
}
