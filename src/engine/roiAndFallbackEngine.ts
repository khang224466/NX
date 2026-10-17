/**
 * ROI AND FALLBACK ENGINE (AUDITED EDITION)
 * DỮ LIỆU NGHỀ NGHIỆP, FDI, PHÂN VỊ LƯƠNG GSO, HÀM TÍNH ROI HỌC PHÍ & PHÂN LOẠI NGUYỆN VỌNG 3 TẦNG
 */

import { VerificationStatus } from '../services/scoringEngine';

export interface CareerRoleNode {
  roleId: string;
  roleTitle: string;
  level: 'Fresher (0–1 năm)' | 'Junior (1–3 năm)' | 'Senior (3–5 năm)' | 'Lead / Principal (>5 năm)';
  dailyResponsibilities: string[];
  coreTechAndSkills: string[];
  recommendedCertifications: string[];
}

export interface EmpiricalSalaryDistribution {
  currency: 'Triệu VNĐ/tháng';
  fresher_0_1yr: { p25: number; p50: number; p75: number; p90: number };
  junior_1_3yr: { p25: number; p50: number; p75: number; p90: number };
  senior_3_5yr: { p25: number; p50: number; p75: number; p90: number };
  lead_5yr_plus: { p25: number; p50: number; p75: number; p90: number };
  dataSource: string;
  collectionPeriod: string;
  methodologyNote: string;
  verificationStatus: VerificationStatus;
}

export interface MajorCareerEcosystem {
  majorCode6_2027: string;
  majorName: string;
  hollandCodes: string[]; // RIASEC
  aiAugmentationScore: number; // 0-100%: Mức độ AI hỗ trợ tăng năng suất & thu nhập
  routineAutomationRisk: number; // 0-100%: Rủi ro tự động hóa tác vụ lặp ở vị trí sơ cấp
  aiImpactExplanation: string;
  careerTree: CareerRoleNode[];
  fdiAndTopEmployersVN: Array<{
    companyName: string;
    sector: string;
    hiringHubs: string[];
    programOrScholarshipNote: string;
  }>;
  salaryDistribution: EmpiricalSalaryDistribution;
  fallbackPathways: {
    sameUniAdjacentMajors: Array<{ programCode: string; name: string; benchmarkDiffNote: string }>;
    nextTierUniversities: Array<{ uniCode: string; uniName: string; benchmarkNote: string }>;
    alternativeRoutes: string[];
  };
}

export const CAREER_ECOSYSTEM_BY_MAJOR: Record<string, MajorCareerEcosystem> = {
  // 1. TRÍ TUỆ NHÂN TẠO (480107) & KHOA HỌC MÁY TÍNH (480101)
  '480107': {
    majorCode6_2027: '480107',
    majorName: 'Trí tuệ nhân tạo & Khoa học máy tính',
    hollandCodes: ['I (Nghiên cứu)', 'R (Kỹ thuật)', 'C (Quy chuẩn)'],
    aiAugmentationScore: 96,
    routineAutomationRisk: 28,
    aiImpactExplanation:
      'Lập trình viên chỉ biết viết CRUD cơ bản có nguy cơ bị thay thế cao (28%), nhưng Kỹ sư AI/ML, Kiến trúc sư hệ thống và Kỹ sư dữ liệu sử dụng AI làm đòn bẩy tăng năng suất gấp 3–5 lần (Augmentation 96%).',
    careerTree: [
      {
        roleId: 'AI-ENG',
        roleTitle: 'AI / Machine Learning Engineer (Kỹ sư Trí tuệ Nhân tạo)',
        level: 'Junior (1–3 năm)',
        dailyResponsibilities: [
          'Huấn luyện, tinh chỉnh (Fine-tuning) các mô hình ngôn ngữ lớn (LLM), thị giác máy tính (Computer Vision) và hệ thống gợi ý',
          'Tối ưu hóa suy luận (Inference Optimization, Quantization, TensorRT/vLLM) để triển khai mô hình lên môi trường Production',
        ],
        coreTechAndSkills: ['Python', 'PyTorch', 'CUDA', 'RAG / LangGraph', 'Docker / Kubernetes', 'MLOps'],
        recommendedCertifications: ['AWS Certified Machine Learning – Specialty', 'NVIDIA Deep Learning Institute (DLI)'],
      },
      {
        roleId: 'DATA-SCI',
        roleTitle: 'Data Scientist / Quantitative Analyst (Nhà Khoa học Dữ liệu)',
        level: 'Senior (3–5 năm)',
        dailyResponsibilities: [
          'Xây dựng mô hình chấm điểm tín dụng (Credit Scoring), phát hiện gian lận (Fraud Detection) và dự báo chuỗi cung ứng',
          'Thiết kế kiểm thử A/B Testing và mô hình nhân quả (Causal Inference) cho quyết định kinh doanh',
        ],
        coreTechAndSkills: ['SQL nâng cao', 'Spark / Databricks', 'Scikit-learn / XGBoost', 'Xác suất thống kê'],
        recommendedCertifications: ['Databricks Certified Data Scientist', 'Google Professional Data Engineer'],
      },
      {
        roleId: 'AI-ARCH',
        roleTitle: 'Principal AI Architect / Head of AI',
        level: 'Lead / Principal (>5 năm)',
        dailyResponsibilities: [
          'Thiết kế kiến trúc hạ tầng AI toàn doanh nghiệp, quản trị an toàn dữ liệu và tối ưu chi phí GPU Cloud',
        ],
        coreTechAndSkills: ['Distributed Systems', 'System Design', 'AI Governance & Security'],
        recommendedCertifications: ['AWS Certified Solutions Architect – Professional'],
      },
    ],
    fdiAndTopEmployersVN: [
      {
        companyName: 'NVIDIA Vietnam R&D Center & FPT Smart Cloud',
        sector: 'AI Infrastructure & Deep Tech',
        hiringHubs: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'],
        programOrScholarshipNote: 'Tuyển dụng trực tiếp kỹ sư AI Residency & hợp tác phòng Lab tại BKA, QSB, QSC, QST, QHI',
      },
      {
        companyName: 'Viettel AI / Viettel Cyberspace & VinBigData',
        sector: 'Tập đoàn Công nghệ Quốc gia',
        hiringHubs: ['Hà Nội', 'TP. Hồ Chí Minh'],
        programOrScholarshipNote: 'Chương trình Viettel Digital Talent thực tập hưởng lương 10–18 triệu/tháng từ năm 3',
      },
      {
        companyName: 'VNG (Zalo AI / GreenNode) & Grab / Shopee Regional Tech',
        sector: 'Kỳ lân Công nghệ & Consumer Tech',
        hiringHubs: ['TP. Hồ Chí Minh', 'Hà Nội'],
        programOrScholarshipNote: 'Chương trình Software/AI Engineer Fresher khởi điểm 22–35 triệu/tháng',
      },
    ],
    salaryDistribution: {
      currency: 'Triệu VNĐ/tháng',
      fresher_0_1yr: { p25: 12, p50: 18, p75: 25, p90: 35 },
      junior_1_3yr: { p25: 20, p50: 30, p75: 42, p90: 58 },
      senior_3_5yr: { p25: 38, p50: 55, p75: 75, p90: 105 },
      lead_5yr_plus: { p25: 65, p50: 90, p75: 130, p90: 185 },
      dataSource: 'Báo cáo Thị trường IT Việt Nam (TopDev) & Navigos Group Salary Guide',
      collectionPeriod: '2025–2026',
      methodologyNote: 'Phân vị thực nghiệm (P25-P90) tổng hợp từ khảo sát lương Gross theo cấp bậc tại Hà Nội, TP.HCM và Đà Nẵng.',
      verificationStatus: 'SECONDARY_ONLY',
    },
    fallbackPathways: {
      sameUniAdjacentMajors: [
        { programCode: 'MI1 / 460117', name: 'Toán – Tin (ĐHBK Hà Nội)', benchmarkDiffNote: 'Thấp hơn IT-E10 khoảng 1,8 – 2,1 điểm (2024: 27,35 vs 28,22), nền tảng toán cho AI cực mạnh' },
        { programCode: '146 / 460108', name: 'Khoa học Dữ liệu (ĐHBK TP.HCM)', benchmarkDiffNote: 'Thấp hơn KHMT (106) khoảng 1,5 điểm trên thang 100 (83,85 vs 85,41)' },
      ],
      nextTierUniversities: [
        { uniCode: 'QHI', uniName: 'Trường ĐH Công nghệ – ĐHQG Hà Nội (UET)', benchmarkNote: 'Điểm chuẩn AI/KHMT 2026: 26,26 – 26,86 (Thấp hơn BKA ~2,7 điểm)' },
        { uniCode: 'DDK', uniName: 'Trường ĐH Bách khoa – ĐH Đà Nẵng', benchmarkNote: 'Điểm chuẩn CNTT (KHDL & AI) 2026: 26,38 – 27,00' },
        { uniCode: 'TCT', uniName: 'Đại học Cần Thơ (CTU)', benchmarkNote: 'Điểm chuẩn CNTT / KTPM: 25,40 – 26,20' },
        { uniCode: 'VKU', uniName: 'Trường ĐH CNTT&TT Việt – Hàn (ĐH Đà Nẵng)', benchmarkNote: 'Điểm chuẩn AI 2026: 21,00 | học phí công lập thấp' },
      ],
      alternativeRoutes: [
        'Chương trình Tiên tiến / Dạy bằng tiếng Anh tại QSB (Mã 206) hoặc QST',
        'Chương trình Cử nhân Tài năng ISB Công nghệ / Robot & AI tại UEH (KSA: 75,00/100; Phân hiệu KSV: 60,00/100)',
      ],
    },
  },

  // 480101 alias
  '480101': {
    majorCode6_2027: '480101',
    majorName: 'Khoa học Máy tính',
    hollandCodes: ['I (Nghiên cứu)', 'R (Kỹ thuật)', 'C (Quy chuẩn)'],
    aiAugmentationScore: 94,
    routineAutomationRisk: 25,
    aiImpactExplanation:
      'Kỹ sư Khoa học Máy tính nền tảng nắm chắc cấu trúc dữ liệu, giải thuật và hệ điều hành, vận dụng AI Copilot để nhân 3 năng suất phát triển hệ thống.',
    careerTree: [
      {
        roleId: 'SWE-FULL',
        roleTitle: 'Software Engineer / Backend Developer',
        level: 'Fresher (0–1 năm)',
        dailyResponsibilities: [
          'Thiết kế và xây dựng API Microservices hiệu năng cao, tối ưu cơ sở dữ liệu phân tán',
          'Áp dụng CI/CD tự động hóa kiểm thử mã nguồn và triển khai ứng dụng đám mây',
        ],
        coreTechAndSkills: ['Go / Java / Python', 'PostgreSQL / Redis', 'Docker / Kubernetes', 'gRPC'],
        recommendedCertifications: ['AWS Certified Developer – Associate'],
      },
      {
        roleId: 'SYS-ARCH',
        roleTitle: 'Software Architect / System Designer',
        level: 'Senior (3–5 năm)',
        dailyResponsibilities: [
          'Thiết kế kiến trúc hệ thống xử lý triệu CCU (Concurrent Users), khả năng phục hồi (Fault Tolerance) và High Availability',
        ],
        coreTechAndSkills: ['System Design', 'Kafka', 'Distributed Systems', 'Cloud Native'],
        recommendedCertifications: ['AWS Certified Solutions Architect – Professional'],
      },
    ],
    fdiAndTopEmployersVN: [
      {
        companyName: 'Grab Vietnam, Shopee Tech Hub & VNG',
        sector: 'Tech Giants & Regional Unicorns',
        hiringHubs: ['TP. Hồ Chí Minh', 'Hà Nội'],
        programOrScholarshipNote: 'Tuyển dụng Fresher / Junior Software Engineer với đãi ngộ hàng đầu thị trường',
      },
    ],
    salaryDistribution: {
      currency: 'Triệu VNĐ/tháng',
      fresher_0_1yr: { p25: 12, p50: 17, p75: 24, p90: 32 },
      junior_1_3yr: { p25: 20, p50: 28, p75: 40, p90: 55 },
      senior_3_5yr: { p25: 36, p50: 52, p75: 70, p90: 95 },
      lead_5yr_plus: { p25: 60, p50: 85, p75: 120, p90: 170 },
      dataSource: 'Báo cáo Thị trường IT Việt Nam & TopDev Salary Survey',
      collectionPeriod: '2025–2026',
      methodologyNote: 'Khảo sát kỹ sư phần mềm chính quy tại Hà Nội và TP.HCM.',
      verificationStatus: 'SECONDARY_ONLY',
    },
    fallbackPathways: {
      sameUniAdjacentMajors: [
        { programCode: '480201', name: 'Công nghệ Thông tin', benchmarkDiffNote: 'Thấp hơn KHMT ~0,8 - 1,5 điểm' },
        { programCode: '480103', name: 'Kỹ thuật Phần mềm', benchmarkDiffNote: 'Thấp hơn KHMT ~0,5 - 1,2 điểm' },
      ],
      nextTierUniversities: [
        { uniCode: 'QSC', uniName: 'ĐH Công nghệ Thông tin - ĐHQG TP.HCM (UIT)', benchmarkNote: 'Điểm chuẩn: 27.20 - 27.80' },
        { uniCode: 'TCT', uniName: 'Đại học Cần Thơ (CTU)', benchmarkNote: 'Điểm chuẩn: 25.10 - 25.50' },
      ],
      alternativeRoutes: ['Học ngành Kỹ thuật Máy tính hoặc Toán Tin chuyển hướng'],
    },
  },

  // 2. THIẾT KẾ VI MẠCH & CÔNG NGHỆ BÁN DẪN (520202 / 440180)
  '520202': {
    majorCode6_2027: '520202',
    majorName: 'Thiết kế Vi mạch & Công nghệ Bán dẫn',
    hollandCodes: ['R (Kỹ thuật)', 'I (Nghiên cứu)', 'C (Quy chuẩn)'],
    aiAugmentationScore: 92,
    routineAutomationRisk: 12,
    aiImpactExplanation:
      'Thiết kế chip vật lý (RTL, Physical Design, Verification, DFT) đòi hỏi hiểu biết sâu về vật lý bán dẫn và ràng buộc phần cứng thực tế; AI (EDA Copilot của Synopsys/Cadence) giúp rút ngắn thời gian chạy layout & testbench chứ không thể thay thế kỹ sư.',
    careerTree: [
      {
        roleId: 'IC-RTL',
        roleTitle: 'RTL Design & Verification Engineer (Kỹ sư Thiết kế & Kiểm thử Logic Vi mạch)',
        level: 'Fresher (0–1 năm)',
        dailyResponsibilities: [
          'Viết mã phần cứng Verilog / SystemVerilog cho các khối IP (CPU, NPU, PCIe, DDR)',
          'Xây dựng môi trường kiểm thử UVM (Universal Verification Methodology) tìm lỗi trước khi gửi đi đúc chip (Tape-out)',
        ],
        coreTechAndSkills: ['Verilog / SystemVerilog', 'UVM', 'C/C++', 'Linux / Tcl / Python Scripting', 'Synopsys VCS / Cadence Xcelium'],
        recommendedCertifications: ['Chứng chỉ Đào tạo Thiết kế Vi mạch Chuyên sâu Synopsys / Cadence / NIC'],
      },
      {
        roleId: 'IC-PD',
        roleTitle: 'Physical Design & STA Engineer (Kỹ sư Thiết kế Vật lý & Phân tích Định thời)',
        level: 'Senior (3–5 năm)',
        dailyResponsibilities: [
          'Chuyển đổi Netlist sang bản vẽ vật lý (Floorplanning, Placement, Clock Tree Synthesis, Routing) ở tiến trình 3nm/5nm/7nm',
          'Phân tích Static Timing Analysis (STA) và công suất tiêu thụ (Power Integrity)',
        ],
        coreTechAndSkills: ['Synopsys IC Compiler II / PrimeTime', 'Cadence Innovus / Tempus', 'CMOS Physics'],
        recommendedCertifications: ['Kỹ sư Thiết kế Vật lý Cấp cao (Senior ASIC Physical Design)'],
      },
    ],
    fdiAndTopEmployersVN: [
      {
        companyName: 'Synopsys Vietnam, Cadence, Marvell & Renesas Design Vietnam',
        sector: 'Tập đoàn Thiết kế Chip (Fabless & EDA) Toàn cầu',
        hiringHubs: ['TP. Hồ Chí Minh', 'Đà Nẵng', 'Hà Nội'],
        programOrScholarshipNote: 'Tài trợ bản quyền phần mềm EDA hàng triệu USD và cấp học bổng thực tập cho SV BKA, QSB, QSC, QST, DDK, VKU',
      },
      {
        companyName: 'Intel Products Vietnam & Amkor Technology Vietnam',
        sector: 'Nhà máy Đóng gói & Kiểm thử Bán dẫn (ATP) Lớn nhất Thế giới',
        hiringHubs: ['TP. Hồ Chí Minh (Khu CNC Q.9)', 'Bắc Ninh (Yên Phong II-C)'],
        programOrScholarshipNote: 'Tuyển dụng hàng nghìn kỹ sư Đóng gói, Kiểm thử (Test/Packaging/Yield) và Tự động hóa nhà máy mỗi năm',
      },
      {
        companyName: 'Viettel Semiconductor & FPT Semiconductor',
        sector: 'Doanh nghiệp Thiết kế Chip Nội địa Chiến lược',
        hiringHubs: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'],
        programOrScholarshipNote: 'Hưởng chính sách học bổng 111 ngành STEM theo Quyết định 1826/QĐ-BGDĐT & Nghị định 179/2026/NĐ-CP',
      },
    ],
    salaryDistribution: {
      currency: 'Triệu VNĐ/tháng',
      fresher_0_1yr: { p25: 15, p50: 21, p75: 28, p90: 38 },
      junior_1_3yr: { p25: 24, p50: 34, p75: 46, p90: 62 },
      senior_3_5yr: { p25: 42, p50: 60, p75: 85, p90: 115 },
      lead_5yr_plus: { p25: 75, p50: 105, p75: 145, p90: 210 },
      dataSource: 'Khảo sát Nhân lực Bán dẫn Việt Nam (NIC / Cổng TTĐT Chính phủ) & Navigos Group',
      collectionPeriod: '2025–2026',
      methodologyNote: 'Bao gồm lương cơ bản + thưởng hiệu suất và cổ phiếu (RSU) tại các công ty FDI bán dẫn (Marvell, Renesas, Synopsys, Intel).',
      verificationStatus: 'SECONDARY_ONLY',
    },
    fallbackPathways: {
      sameUniAdjacentMajors: [
        { programCode: 'ET1 / 520207', name: 'Kỹ thuật Điện tử – Viễn thông', benchmarkDiffNote: 'Cùng nền tảng mạch điện tử, có thể chọn chuyên ngành Vi mạch từ năm 3' },
        { programCode: 'PH1 / 520401', name: 'Vật lý Kỹ thuật / Khoa học Vật liệu', benchmarkDiffNote: 'Điểm chuẩn mềm hơn 2,0–2,8 điểm, hưởng học bổng ngành cơ bản theo NĐ 179/2026' },
      ],
      nextTierUniversities: [
        { uniCode: 'DDK', uniName: 'Trường ĐH Bách khoa – ĐH Đà Nẵng', benchmarkNote: 'Chuyên ngành Vi điện tử – Thiết kế vi mạch (7520207A) điểm chuẩn 2026 = 26,62' },
        { uniCode: 'VKU', uniName: 'Trường ĐH CNTT&TT Việt – Hàn (ĐH Đà Nẵng)', benchmarkNote: 'Thiết kế vi mạch bán dẫn = 24,00 | Đóng gói & kiểm thử vi mạch = 24,50' },
        { uniCode: 'DSK', uniName: 'Trường ĐH Sư phạm Kỹ thuật – ĐH Đà Nẵng', benchmarkNote: 'CNKT Điện tử - Viễn thông (Thiết kế vi mạch bán dẫn) = 22,75' },
      ],
      alternativeRoutes: [
        'Học ngành Kỹ thuật Điện - Điện tử / Vật lý kỹ thuật rồi tham gia khóa chuyển đổi ngắn hạn 6 tháng tại Trung tâm Đổi mới Sáng tạo Quốc gia (NIC)',
      ],
    },
  },

  // 440180 alias
  '440180': {
    majorCode6_2027: '440180',
    majorName: 'Khoa học và Công nghệ Bán dẫn',
    hollandCodes: ['R (Kỹ thuật)', 'I (Nghiên cứu)', 'C (Quy chuẩn)'],
    aiAugmentationScore: 90,
    routineAutomationRisk: 10,
    aiImpactExplanation:
      'Chuyên môn về vật lý chất rắn, cấu trúc bán dẫn, chế tạo màng mỏng và đóng gói kiểm thử vi mạch. Được xếp vào nhóm ngành chiến lược quốc gia theo QĐ 1826/QĐ-BGDĐT.',
    careerTree: [
      {
        roleId: 'SEMI-PROC',
        roleTitle: 'Semiconductor Process & Yield Engineer (Kỹ sư Quy trình & Hiệu suất Chế tạo)',
        level: 'Junior (1–3 năm)',
        dailyResponsibilities: [
          'Quản lý và giám sát các bước quang khắc (Photolithography), khắc axit (Etching), lắng đọng màng mỏng (CVD/PVD) trong phòng sạch Cleanroom',
          'Tối ưu hóa tỷ lệ chip sống (Yield Learning) và xử lý sự cố thiết bị sản xuất wafer',
        ],
        coreTechAndSkills: ['Semiconductor Physics', 'Photolithography', 'Thin Film Deposition', 'SPC / DOE'],
        recommendedCertifications: ['Cleanroom Operations & Yield Optimization Certificate'],
      },
    ],
    fdiAndTopEmployersVN: [
      {
        companyName: 'Amkor Technology Vietnam & Hana Micron Vina',
        sector: 'Nhà máy OSAT Bán dẫn Hàng đầu',
        hiringHubs: ['Bắc Ninh', 'Bắc Giang'],
        programOrScholarshipNote: 'Tuyển dụng hàng nghìn kỹ sư bán dẫn chế tạo & kiểm thử',
      },
    ],
    salaryDistribution: {
      currency: 'Triệu VNĐ/tháng',
      fresher_0_1yr: { p25: 14, p50: 20, p75: 27, p90: 36 },
      junior_1_3yr: { p25: 22, p50: 32, p75: 45, p90: 60 },
      senior_3_5yr: { p25: 40, p50: 58, p75: 82, p90: 110 },
      lead_5yr_plus: { p25: 70, p50: 100, p75: 140, p90: 200 },
      dataSource: 'Bộ TT&TT & Báo cáo Nhân lực Bán dẫn Việt Nam',
      collectionPeriod: '2025–2026',
      methodologyNote: 'Khảo sát thu nhập kỹ sư bán dẫn và phòng sạch tại các nhà máy FDI.',
      verificationStatus: 'SECONDARY_ONLY',
    },
    fallbackPathways: {
      sameUniAdjacentMajors: [
        { programCode: '520202', name: 'Thiết kế Vi mạch', benchmarkDiffNote: 'Tương đồng nền tảng phần cứng' },
        { programCode: '520401', name: 'Vật lý Kỹ thuật', benchmarkDiffNote: 'Điểm chuẩn thấp hơn 1.5 - 2.5đ' },
      ],
      nextTierUniversities: [
        { uniCode: 'DDK', uniName: 'ĐH Bách khoa - ĐH Đà Nẵng', benchmarkNote: 'Điểm chuẩn ~26.0 - 26.6' },
      ],
      alternativeRoutes: ['Học ngành Kỹ thuật Vật liệu rồi chuyên sâu Bán dẫn'],
    },
  },

  // 3. LOGISTICS & QUẢN LÝ CHUỖI CUNG ỨNG (340123) & KINH DOANH QUỐC TẾ (340120)
  '340123': {
    majorCode6_2027: '340123',
    majorName: 'Logistics và Quản lý Chuỗi cung ứng',
    hollandCodes: ['E (Quản lý)', 'C (Tổ chức)', 'I (Phân tích)'],
    aiAugmentationScore: 84,
    routineAutomationRisk: 45,
    aiImpactExplanation:
      'Khâu khai báo chứng từ hải quan thủ công có rủi ro tự động hóa cao (45%), nhưng Chuyên gia Hoạch định Chuỗi cung ứng (Supply Chain Planner), Thu mua chiến lược (Strategic Sourcing) và Tối ưu mạng lưới kho vận bằng AI đang thiếu hụt nhân sự trầm trọng.',
    careerTree: [
      {
        roleId: 'SCM-PLAN',
        roleTitle: 'Demand & Supply Chain Planner (Chuyên viên Hoạch định Chuỗi cung ứng)',
        level: 'Junior (1–3 năm)',
        dailyResponsibilities: [
          'Dự báo nhu cầu hàng hóa (Demand Forecasting), tối ưu tồn kho (Inventory Optimization) và điều phối S&OP cho các tập đoàn sản xuất/bán lẻ',
        ],
        coreTechAndSkills: ['SAP ERP / Oracle NetSuite', 'PowerBI / Tableau', 'Python / SQL phân tích chuỗi cung ứng', 'Incoterms 2020'],
        recommendedCertifications: ['FIATA Diploma in Freight Forwarding', 'APICS CSCP / CPIM (ASCM)'],
      },
      {
        roleId: 'PROC-MGR',
        roleTitle: 'Strategic Procurement & Global Sourcing Manager (Quản lý Thu mua Quốc tế)',
        level: 'Senior (3–5 năm)',
        dailyResponsibilities: [
          'Đàm phán hợp đồng cung ứng nguyên vật liệu/linh kiện toàn cầu, quản trị rủi ro đứt gãy chuỗi cung ứng cho các nhà máy FDI',
        ],
        coreTechAndSkills: ['Global Sourcing', 'Contract Negotiation', 'Cost Modeling', 'Tiếng Anh + Tiếng Trung/Hàn/Nhật'],
        recommendedCertifications: ['CIPS (Chartered Institute of Procurement & Supply)'],
      },
    ],
    fdiAndTopEmployersVN: [
      {
        companyName: 'Maersk, DHL Supply Chain, Kuehne+Nagel & Schenker',
        sector: 'Tập đoàn Hãng tàu & Logistics Toàn cầu (3PL/4PL)',
        hiringHubs: ['TP. Hồ Chí Minh', 'Hải Phòng', 'Bình Dương', 'Đồng Nai', 'Đà Nẵng'],
        programOrScholarshipNote: 'Chương trình Management Trainee ngành Chuỗi cung ứng & Khai thác cảng',
      },
      {
        companyName: 'Unilever, P&G, Nestlé, Samsung, Apple Supply Chain (Foxconn/Luxshare)',
        sector: 'Chủ hàng Sản xuất & FMCG Đa quốc gia',
        hiringHubs: ['Bắc Ninh', 'Bắc Giang', 'TP. Hồ Chí Minh', 'Bình Dương'],
        programOrScholarshipNote: 'Tuyển dụng kỹ sư Quản lý chuỗi cung ứng & Mua hàng quốc tế (Global Procurement)',
      },
    ],
    salaryDistribution: {
      currency: 'Triệu VNĐ/tháng',
      fresher_0_1yr: { p25: 9, p50: 13, p75: 18, p90: 25 },
      junior_1_3yr: { p25: 15, p50: 22, p75: 30, p90: 42 },
      senior_3_5yr: { p25: 28, p50: 40, p75: 55, p90: 78 },
      lead_5yr_plus: { p25: 50, p50: 72, p75: 100, p90: 145 },
      dataSource: 'Báo cáo Nhân lực Logistics Việt Nam (Bộ Công Thương) & Navigos Group',
      collectionPeriod: '2025–2026',
      methodologyNote: 'Phân vị thu nhập khảo sát tại các trung tâm cảng biển & KCN lớn (TP.HCM, Hải Phòng, Bắc Ninh, Bình Dương).',
      verificationStatus: 'SECONDARY_ONLY',
    },
    fallbackPathways: {
      sameUniAdjacentMajors: [
        { programCode: '7340121 / 340121', name: 'Kinh doanh thương mại / Quản lý công nghiệp (510601)', benchmarkDiffNote: 'Thấp hơn Logistics từ 0,8 – 2,5 điểm nhưng học chung 75% khối kiến thức chuỗi cung ứng' },
      ],
      nextTierUniversities: [
        { uniCode: 'HHA', uniName: 'Trường Đại học Hàng hải Việt Nam (Hải Phòng)', benchmarkNote: 'Cái nôi đào tạo Logistics & Khai thác cảng miền Bắc, điểm chuẩn ~25,5 – 26,8' },
        { uniCode: 'GTS', uniName: 'Trường ĐH Giao thông Vận tải TP.HCM (UTH)', benchmarkNote: 'Thế mạnh thực chiến cảng biển phía Nam' },
        { uniCode: 'VKU', uniName: 'Trường ĐH CNTT&TT Việt – Hàn (ĐH Đà Nẵng)', benchmarkNote: 'Quản trị Logistics và chuỗi cung ứng số (7340101EL): 22,50 điểm' },
      ],
      alternativeRoutes: [
        'Phân hiệu UEH Mekong (KSV): Ngành Logistics điểm chuẩn chỉ 67,00/100 (so với 97,00/100 tại TP.HCM), năm cuối luân chuyển học tại TP.HCM và nhận cùng bằng UEH!',
      ],
    },
  },

  // 4. Y KHOA (720101), RĂNG HÀM MẶT (720501) & DƯỢC HỌC (720201)
  '720101': {
    majorCode6_2027: '720101',
    majorName: 'Y khoa, Răng – Hàm – Mặt & Dược học',
    hollandCodes: ['I (Nghiên cứu)', 'S (Xã hội - Chăm sóc)', 'R (Thực hành lâm sàng)'],
    aiAugmentationScore: 89,
    routineAutomationRisk: 8,
    aiImpactExplanation:
      'AI hỗ trợ đắc lực trong chẩn đoán hình ảnh y học (X-quang, CT, MRI) và sàng lọc tương tác thuốc (Augmentation 89%), nhưng trách nhiệm pháp lý, phẫu thuật lâm sàng và giao tiếp điều trị trực tiếp với bệnh nhân gần như không thể bị thay thế (Risk 8%).',
    careerTree: [
      {
        roleId: 'MED-RES',
        roleTitle: 'Bác sĩ Nội trú (Resident Physician) / Bác sĩ Chuyên khoa',
        level: 'Fresher (0–1 năm)',
        dailyResponsibilities: [
          'Thực hành lâm sàng tại các bệnh viện tuyến cuối, hoàn thành chương trình Bác sĩ Nội trú (3 năm) hoặc thực hành 18 tháng để cấp Giấy phép hành nghề theo Luật Khám bệnh, chữa bệnh mới',
        ],
        coreTechAndSkills: ['Chẩn đoán lâm sàng', 'Phác đồ điều trị Bộ Y tế', 'Tiếng Anh/Pháp chuyên ngành Y khoa'],
        recommendedCertifications: ['Giấy phép hành nghề Khám bệnh, chữa bệnh (Hội đồng Y khoa Quốc gia sát hạch từ 2027)', 'USMLE (nếu định hướng Hoa Kỳ)'],
      },
      {
        roleId: 'MED-SPEC',
        roleTitle: 'Bác sĩ Chuyên khoa I / II / Phẫu thuật viên Chính',
        level: 'Senior (3–5 năm)',
        dailyResponsibilities: [
          'Trực tiếp phẫu thuật, hội chẩn ca bệnh phức tạp và nghiên cứu thử nghiệm lâm sàng tại bệnh viện công lập hạng đặc biệt hoặc bệnh viện quốc tế',
        ],
        coreTechAndSkills: ['Phẫu thuật nội soi / Robot', 'Chẩn đoán hình ảnh can thiệp', 'Quản lý chất lượng bệnh viện'],
        recommendedCertifications: ['Bằng Bác sĩ Nội trú / Chuyên khoa I, II / Tiến sĩ Y học'],
      },
    ],
    fdiAndTopEmployersVN: [
      {
        companyName: 'BV Bạch Mai, BV Việt Đức, BV Chợ Rẫy & BV ĐH Y Dược TP.HCM',
        sector: 'Bệnh viện Tuyến cuối Hạng Đặc biệt',
        hiringHubs: ['Hà Nội', 'TP. Hồ Chí Minh'],
        programOrScholarshipNote: 'Ưu tiên tuyển thẳng Bác sĩ Nội trú từ YHB, YDS, QHY',
      },
      {
        companyName: 'Hệ thống Y tế Vinmec, BV Đa khoa Tâm Anh & FV Hospital',
        sector: 'Tập đoàn Bệnh viện Tư nhân & Quốc tế Chuẩn JCI',
        hiringHubs: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ'],
        programOrScholarshipNote: 'Đãi ngộ cao cho bác sĩ có trình độ ngoại ngữ (IELTS >= 6.5) và chứng chỉ đào tạo quốc tế',
      },
    ],
    salaryDistribution: {
      currency: 'Triệu VNĐ/tháng',
      fresher_0_1yr: { p25: 8, p50: 12, p75: 18, p90: 25 },
      junior_1_3yr: { p25: 15, p50: 24, p75: 35, p90: 50 },
      senior_3_5yr: { p25: 30, p50: 48, p75: 75, p90: 110 },
      lead_5yr_plus: { p25: 55, p50: 90, p75: 150, p90: 250 },
      dataSource: 'Tổng hợp Khảo sát Thu nhập Ngành Y tế & Hệ thống Bệnh viện Tư nhân Việt Nam',
      collectionPeriod: '2025–2026',
      methodologyNote: 'Giai đoạn 0–2 năm đầu trong thời gian thực hành cấp giấy phép hành nghề thu nhập khởi điểm thấp hơn khối IT, nhưng tăng vọt từ năm thứ 4 trở đi.',
      verificationStatus: 'SECONDARY_ONLY',
    },
    fallbackPathways: {
      sameUniAdjacentMajors: [
        { programCode: '7720110 / 720110', name: 'Y học dự phòng / Y học cổ truyền (720115)', benchmarkDiffNote: 'Thấp hơn Y khoa từ 2,5 – 4,5 điểm, vẫn đào tạo cấp bằng Bác sĩ (6 năm)' },
        { programCode: '7720601 / 720601', name: 'Kỹ thuật xét nghiệm y học / Kỹ thuật hình ảnh y học', benchmarkDiffNote: 'Thấp hơn Y khoa 3,0 – 4,0 điểm, thời gian học 4 năm, ra trường đi làm sớm' },
      ],
      nextTierUniversities: [
        { uniCode: 'TYS', uniName: 'Trường ĐH Y khoa Phạm Ngọc Thạch (TP.HCM)', benchmarkNote: 'Điểm chuẩn Y khoa mềm hơn YDS khoảng 1,0 – 1,5 điểm' },
        { uniCode: 'QSY', uniName: 'Trường ĐH Khoa học Sức khỏe – ĐHQG TP.HCM', benchmarkNote: 'Xét tuyển tổng hợp thang 100, lợi thế lớn cho thí sinh có điểm ĐGNL V-ACT và IELTS/SAT' },
        { uniCode: 'YCT', uniName: 'Trường ĐH Y Dược Cần Thơ (CTUMP)', benchmarkNote: 'Điểm chuẩn Y khoa 2025 = 23,88 | RHM = 23,65 | Dược = 22,00' },
        { uniCode: 'DDY', uniName: 'Trường Y Dược – Đại học Đà Nẵng', benchmarkNote: 'Điểm chuẩn 2026: RHM = 24,44 | Y khoa = 24,24 | Xét nghiệm = 23,96' },
      ],
      alternativeRoutes: [
        'Ngành Công nghệ sinh học Y dược (420201) hoặc Hóa dược (720203) tại các trường ĐH Khoa học Tự nhiên / Bách khoa',
      ],
    },
  },

  // 720501 alias (Răng Hàm Mặt)
  '720501': {
    majorCode6_2027: '720501',
    majorName: 'Răng - Hàm - Mặt',
    hollandCodes: ['I (Nghiên cứu)', 'S (Xã hội)', 'R (Thực hành phẫu thuật nha khoa)'],
    aiAugmentationScore: 86,
    routineAutomationRisk: 6,
    aiImpactExplanation: 'Nha khoa kỹ thuật số, scan 3D hàm mặt và mô phỏng chỉnh nha bằng AI hỗ trợ thiết kế khí cụ, kỹ thuật lâm sàng thao tác tay của bác sĩ không thể thay thế.',
    careerTree: [
      {
        roleId: 'DENT-GEN',
        roleTitle: 'Bác sĩ Nha khoa Tổng quát (General Dentist)',
        level: 'Fresher (0–1 năm)',
        dailyResponsibilities: [
          'Khám, chẩn đoán bệnh lý răng miệng, điều trị tủy, nhổ răng tiểu phẫu và phục hình cơ bản',
        ],
        coreTechAndSkills: ['Nha khoa phục hồi', 'Chụp phim Cone Beam CT 3D', 'Vô trùng lâm sàng'],
        recommendedCertifications: ['Chứng chỉ hành nghề Bác sĩ Răng Hàm Mặt', 'Chứng chỉ cấy ghép Implant cơ bản'],
      },
    ],
    fdiAndTopEmployersVN: [
      {
        companyName: 'Bệnh viện Răng Hàm Mặt TW, BV RHM TP.HCM & Chuỗi Nha khoa Quốc tế',
        sector: 'Chuyên khoa Nha khoa & Phục hình Răng mặt',
        hiringHubs: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'],
        programOrScholarshipNote: 'Tuyển dụng bác sĩ nha khoa chính quy tốt nghiệp YDS, HMU',
      },
    ],
    salaryDistribution: {
      currency: 'Triệu VNĐ/tháng',
      fresher_0_1yr: { p25: 10, p50: 16, p75: 25, p90: 38 },
      junior_1_3yr: { p25: 20, p50: 32, p75: 50, p90: 75 },
      senior_3_5yr: { p25: 45, p50: 70, p75: 110, p90: 160 },
      lead_5yr_plus: { p25: 80, p50: 130, p75: 200, p90: 320 },
      dataSource: 'Hiệp hội Răng Hàm Mặt Việt Nam (VOSA) & Khảo sát Phòng khám Nha khoa',
      collectionPeriod: '2025–2026',
      methodologyNote: 'Bao gồm thu nhập cố định + doanh số thủ thuật lâm sàng (Implant, Chỉnh nha).',
      verificationStatus: 'SECONDARY_ONLY',
    },
    fallbackPathways: {
      sameUniAdjacentMajors: [
        { programCode: '720101', name: 'Y khoa', benchmarkDiffNote: 'Tương đương chuẩn' },
        { programCode: '720201', name: 'Dược học', benchmarkDiffNote: 'Thấp hơn ~1.5 - 2.0đ' },
      ],
      nextTierUniversities: [
        { uniCode: 'YCT', uniName: 'ĐH Y Dược Cần Thơ', benchmarkNote: 'RHM ~23.65 - 24.5' },
      ],
      alternativeRoutes: ['Học Y đa khoa rồi chuyên khoa định hướng Tai Mũi Họng - Răng Hàm Mặt'],
    },
  },
};

export interface TuitionROIInput {
  studyYears: 4 | 4.5 | 5 | 6;
  tuitionPerYearMillion: number;
  livingCostPerMonthMillion: number;
  scholarshipCoveragePercent: number; // 0..100
  monthlyGovAllowanceMillion?: number; // VD: 3.63 triệu/tháng cho SV Sư phạm theo NĐ 116
  expectedMonthlySalaryAfterGradMillion: {
    year1_2: number; // Fresher/Junior
    year3_5: number; // Senior
  };
  savingRatePercent?: number; // Tỷ lệ trích thu nhập để hoàn vốn (mặc định 40%)
}

export interface TuitionROIResult {
  totalTuitionMillion: number;
  totalLivingCostMillion: number;
  totalGrantReceivedMillion: number;
  netInvestmentCostMillion: number;
  breakEvenMonthsAfterGrad: number;
  fiveYearCumulativeNetCashflowMillion: number;
  roiRating: 'SIÊU LỢI NHUẬN (MIỄN HỌC PHÍ / HỌC BỔNG)' | 'HOÀN VỐN NHANH (< 24 THÁNG)' | 'CÂN BẰNG (24–48 THÁNG)' | 'ĐẦU TƯ DÀI HẠN (> 48 THÁNG)';
}

export function calculateUniversityROI(input: TuitionROIInput): TuitionROIResult {
  const effectiveTuitionPerYear =
    input.tuitionPerYearMillion * (1 - Math.min(100, Math.max(0, input.scholarshipCoveragePercent)) / 100);
  const totalTuitionMillion = Math.round(effectiveTuitionPerYear * input.studyYears * 10) / 10;
  const totalLivingCostMillion = Math.round(input.livingCostPerMonthMillion * 12 * input.studyYears * 10) / 10;
  const totalGrantReceivedMillion =
    Math.round((input.monthlyGovAllowanceMillion ?? 0) * 10 * input.studyYears * 10) / 10;

  const netInvestmentCostMillion = Math.max(
    0,
    Math.round((totalTuitionMillion + totalLivingCostMillion - totalGrantReceivedMillion) * 10) / 10
  );

  const savingRate = (input.savingRatePercent ?? 40) / 100;
  const monthlySavingYr1_2 = Math.max(1, input.expectedMonthlySalaryAfterGradMillion.year1_2 * savingRate);
  const monthlySavingYr3_5 = Math.max(1, input.expectedMonthlySalaryAfterGradMillion.year3_5 * savingRate);

  let breakEvenMonths = 0;
  if (netInvestmentCostMillion > 0) {
    const maxSavedFirst24Months = monthlySavingYr1_2 * 24;
    if (netInvestmentCostMillion <= maxSavedFirst24Months) {
      breakEvenMonths = Math.ceil(netInvestmentCostMillion / monthlySavingYr1_2);
    } else {
      const remaining = netInvestmentCostMillion - maxSavedFirst24Months;
      breakEvenMonths = 24 + Math.ceil(remaining / monthlySavingYr3_5);
    }
  }

  const total5YrSaved = monthlySavingYr1_2 * 24 + monthlySavingYr3_5 * 36;
  const fiveYearCumulativeNetCashflowMillion = Math.round((total5YrSaved - netInvestmentCostMillion) * 10) / 10;

  const roiRating =
    netInvestmentCostMillion === 0 || input.scholarshipCoveragePercent >= 100
      ? 'SIÊU LỢI NHUẬN (MIỄN HỌC PHÍ / HỌC BỔNG)'
      : breakEvenMonths <= 24
        ? 'HOÀN VỐN NHANH (< 24 THÁNG)'
        : breakEvenMonths <= 48
          ? 'CÂN BẰNG (24–48 THÁNG)'
          : 'ĐẦU TƯ DÀI HẠN (> 48 THÁNG)';

  return {
    totalTuitionMillion,
    totalLivingCostMillion,
    totalGrantReceivedMillion,
    netInvestmentCostMillion,
    breakEvenMonthsAfterGrad: breakEvenMonths,
    fiveYearCumulativeNetCashflowMillion,
    roiRating,
  };
}

export function classifyAdmissionSafetyTier(
  candidateScore: number,
  latestBenchmark: number,
  scale: 30 | 40 | 100
): {
  tier: 'SAFETY' | 'MATCH' | 'REACH';
  badgeLabel: string;
  deltaScore: number;
  recommendation: string;
} {
  const delta = Math.round((candidateScore - latestBenchmark) * 100) / 100;
  const safetyMargin = scale === 100 ? 2.5 : scale === 40 ? 1.0 : 0.75;
  const reachMargin = scale === 100 ? -2.0 : scale === 40 ? -0.75 : -0.5;

  if (delta >= safetyMargin) {
    return {
      tier: 'SAFETY',
      badgeLabel: 'Vùng An Toàn (Khả năng đỗ cao)',
      deltaScore: delta,
      recommendation: `Điểm của bạn cao hơn điểm chuẩn (+${delta} điểm). Có thể đặt làm nguyện vọng chốt an toàn.`,
    };
  }
  if (delta >= reachMargin) {
    return {
      tier: 'MATCH',
      badgeLabel: 'Vùng Cạnh Tranh (Cần theo dõi tiêu chí phụ)',
      deltaScore: delta,
      recommendation: `Chênh lệch ${delta >= 0 ? '+' : ''}${delta} điểm so với điểm chuẩn. Bắt buộc chuẩn bị thêm 1–2 nguyện vọng dự phòng bên dưới.`,
    };
  }
  return {
    tier: 'REACH',
    badgeLabel: 'Rủi Ro Cao (Bắt buộc có Lộ trình Dự phòng)',
    deltaScore: delta,
    recommendation: `Điểm đang thấp hơn chuẩn (${delta} điểm). Hãy bật ngay Ma trận 3 Phương án Dự phòng (Cùng trường ngành gần / Trường kế cận / Phân hiệu).`,
  };
}
