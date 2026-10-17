import {
  SubjectCombination,
  Major,
  Institution,
  Occupation,
  LaborMarketSignal,
  EmployerOrder,
  AlternativePath
} from '../types';

export const SUBJECTS_LIST = [
  'Toán học',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Tin học',
  'Ngữ văn',
  'Tiếng Anh',
  'Lịch sử',
  'Địa lý',
  'Giáo dục kinh tế & pháp luật',
  'Công nghệ công nghiệp',
  'Vẽ mỹ thuật'
];

export const SUBJECT_COMBINATIONS: SubjectCombination[] = [
  {
    code: 'A00',
    name: 'Toán - Vật lý - Hóa học',
    subjects: ['Toán học', 'Vật lý', 'Hóa học'],
    description: 'Tổ hợp truyền thống cho khối kỹ thuật, công nghệ vật liệu, xây dựng và khoa học tự nhiên.',
    majorCount: 245,
    benchmarkRange: '21.0 - 29.5'
  },
  {
    code: 'A01',
    name: 'Toán - Vật lý - Tiếng Anh',
    subjects: ['Toán học', 'Vật lý', 'Tiếng Anh'],
    description: 'Tổ hợp tiêu chuẩn cho CNTT quốc tế, Tự động hóa, Vi mạch bán dẫn và Kinh tế kỹ thuật.',
    majorCount: 268,
    benchmarkRange: '22.0 - 29.2'
  },
  {
    code: 'A02',
    name: 'Toán - Vật lý - Sinh học',
    subjects: ['Toán học', 'Vật lý', 'Sinh học'],
    description: 'Tổ hợp liên ngành Kỹ thuật Y sinh, Công nghệ Sinh học và Nông nghiệp công nghệ cao.',
    majorCount: 65,
    benchmarkRange: '18.0 - 26.5'
  },
  {
    code: 'B00',
    name: 'Toán - Hóa học - Sinh học',
    subjects: ['Toán học', 'Hóa học', 'Sinh học'],
    description: 'Tổ hợp cốt lõi cho nhóm ngành Y Dược, Răng Hàm Mặt, Thú y và Công nghệ sinh học.',
    majorCount: 120,
    benchmarkRange: '19.0 - 28.8'
  },
  {
    code: 'B08',
    name: 'Toán - Sinh học - Tiếng Anh',
    subjects: ['Toán học', 'Sinh học', 'Tiếng Anh'],
    description: 'Tổ hợp hiện đại cho Kỹ thuật Y sinh, Công nghệ gen, Y tế số hóa và Dược học quốc tế.',
    majorCount: 85,
    benchmarkRange: '19.5 - 27.5'
  },
  {
    code: 'C00',
    name: 'Ngữ văn - Lịch sử - Địa lý',
    subjects: ['Ngữ văn', 'Lịch sử', 'Địa lý'],
    description: 'Tổ hợp nền tảng khối Khoa học Xã hội & Nhân văn, Báo chí, Luật và Sư phạm.',
    majorCount: 165,
    benchmarkRange: '20.0 - 29.5'
  },
  {
    code: 'C01',
    name: 'Ngữ văn - Toán - Vật lý',
    subjects: ['Ngữ văn', 'Toán học', 'Vật lý'],
    description: 'Tổ hợp kết hợp tư duy tự nhiên và ngôn ngữ: Kiến trúc, Quản trị công, Kinh tế xây dựng.',
    majorCount: 95,
    benchmarkRange: '18.5 - 26.5'
  },
  {
    code: 'C03',
    name: 'Ngữ văn - Toán - Lịch sử',
    subjects: ['Ngữ văn', 'Toán học', 'Lịch sử'],
    description: 'Tổ hợp đào tạo khối An ninh, Cảnh sát, Luật tư pháp và Quản lý nhà nước.',
    majorCount: 88,
    benchmarkRange: '19.5 - 28.0'
  },
  {
    code: 'C14',
    name: 'Ngữ văn - Toán - GDKT & Pháp luật',
    subjects: ['Ngữ văn', 'Toán học', 'GDKT & Pháp luật'],
    description: 'Tổ hợp vàng cho ngành Luật kinh tế, Hành chính công, Quản lý tài chính công.',
    majorCount: 110,
    benchmarkRange: '20.0 - 27.5'
  },
  {
    code: 'C19',
    name: 'Ngữ văn - Lịch sử - GDKT & Pháp luật',
    subjects: ['Ngữ văn', 'Lịch sử', 'GDKT & Pháp luật'],
    description: 'Tổ hợp cho Sư phạm Lịch sử, Xây dựng Đảng, Khoa học Chính trị và Quản trị nhà nước.',
    majorCount: 90,
    benchmarkRange: '21.0 - 28.5'
  },
  {
    code: 'D01',
    name: 'Toán - Ngữ văn - Tiếng Anh',
    subjects: ['Toán học', 'Ngữ văn', 'Tiếng Anh'],
    description: 'Tổ hợp phổ biến nhất cho khối ngành Kinh tế, Ngoại thương, Luật, Truyền thông và Quản trị.',
    majorCount: 380,
    benchmarkRange: '21.0 - 28.8'
  },
  {
    code: 'D07',
    name: 'Toán - Hóa học - Tiếng Anh',
    subjects: ['Toán học', 'Hóa học', 'Tiếng Anh'],
    description: 'Tổ hợp đắc lực cho Kỹ thuật Hóa học, Công nghệ Thực phẩm, Dược học và Khoa học Vật liệu.',
    majorCount: 140,
    benchmarkRange: '20.5 - 27.5'
  },
  {
    code: 'D08',
    name: 'Toán - Sinh học - Tiếng Anh',
    subjects: ['Toán học', 'Sinh học', 'Tiếng Anh'],
    description: 'Tổ hợp khối Y Dược liên kết quốc tế, Công nghệ sinh học và Quản lý tài nguyên.',
    majorCount: 75,
    benchmarkRange: '19.0 - 26.8'
  },
  {
    code: 'D09',
    name: 'Toán - Lịch sử - Tiếng Anh',
    subjects: ['Toán học', 'Lịch sử', 'Tiếng Anh'],
    description: 'Tổ hợp Ngoại giao, Quốc tế học, Kinh tế đối ngoại và Lịch sử kinh tế.',
    majorCount: 68,
    benchmarkRange: '20.5 - 27.0'
  },
  {
    code: 'D10',
    name: 'Toán - Địa lý - Tiếng Anh',
    subjects: ['Toán học', 'Địa lý', 'Tiếng Anh'],
    description: 'Tổ hợp Logistics quốc tế, Kinh tế biển, Quản lý tài nguyên và Du lịch quốc tế.',
    majorCount: 72,
    benchmarkRange: '20.0 - 26.5'
  },
  {
    code: 'D14',
    name: 'Ngữ văn - Lịch sử - Tiếng Anh',
    subjects: ['Ngữ văn', 'Lịch sử', 'Tiếng Anh'],
    description: 'Tổ hợp Truyền thông quốc tế, Báo chí đối ngoại, Quan hệ quốc tế và Đông phương học.',
    majorCount: 130,
    benchmarkRange: '21.5 - 28.5'
  },
  {
    code: 'D15',
    name: 'Ngữ văn - Địa lý - Tiếng Anh',
    subjects: ['Ngữ văn', 'Địa lý', 'Tiếng Anh'],
    description: 'Tổ hợp Quản trị Khách sạn & Du lịch, Việt Nam học và Địa lý kinh tế thế giới.',
    majorCount: 95,
    benchmarkRange: '20.5 - 27.0'
  },
  {
    code: 'D78',
    name: 'Ngữ văn - Khoa học xã hội - Tiếng Anh',
    subjects: ['Ngữ văn', 'KHXH', 'Tiếng Anh'],
    description: 'Tổ hợp Luật học, Quan hệ công chúng, Báo chí truyền thông và Quản lý văn hóa.',
    majorCount: 85,
    benchmarkRange: '21.0 - 28.0'
  },
  {
    code: 'D84',
    name: 'Toán - GDKT & Pháp luật - Tiếng Anh',
    subjects: ['Toán học', 'GDKT & Pháp luật', 'Tiếng Anh'],
    description: 'Tổ hợp hiện đại cho Tài chính FinTech, Luật thương mại quốc tế và Quản trị kinh doanh.',
    majorCount: 125,
    benchmarkRange: '21.5 - 28.2'
  },
  {
    code: 'D90',
    name: 'Toán - Khoa học tự nhiên - Tiếng Anh',
    subjects: ['Toán học', 'KHTN', 'Tiếng Anh'],
    description: 'Tổ hợp Kỹ thuật công nghệ, Bán dẫn, Khoa học dữ liệu và Cơ điện tử.',
    majorCount: 110,
    benchmarkRange: '22.0 - 28.0'
  },
  {
    code: 'D96',
    name: 'Toán - Khoa học xã hội - Tiếng Anh',
    subjects: ['Toán học', 'KHXH', 'Tiếng Anh'],
    description: 'Tổ hợp Quản trị kinh doanh, Marketing số, Thương mại điện tử và Kinh tế phát triển.',
    majorCount: 118,
    benchmarkRange: '21.0 - 27.8'
  },
  {
    code: 'X01',
    name: 'Toán - Tin học - Vật lý',
    subjects: ['Toán học', 'Tin học', 'Vật lý'],
    description: 'Tổ hợp thế hệ mới theo GDPT 2018 cho Khoa học máy tính, Kỹ thuật phần mềm và Vi mạch.',
    majorCount: 155,
    benchmarkRange: '23.0 - 29.0'
  },
  {
    code: 'X06',
    name: 'Toán - Tin học - Tiếng Anh',
    subjects: ['Toán học', 'Tin học', 'Tiếng Anh'],
    description: 'Tổ hợp hàng đầu cho AI, An toàn thông tin, Phần mềm và Hệ thống nhúng toàn cầu.',
    majorCount: 180,
    benchmarkRange: '23.5 - 29.2'
  },
  {
    code: 'X26',
    name: 'Toán - Tin học - Hóa học',
    subjects: ['Toán học', 'Tin học', 'Hóa học'],
    description: 'Tổ hợp Tính toán lượng tử, Hóa tin học, Công nghệ vật liệu nano và Bán dẫn.',
    majorCount: 65,
    benchmarkRange: '21.0 - 27.5'
  },
  {
    code: 'K01',
    name: 'Toán (x3) + Ngữ văn (x1) + KHTN (x2)',
    subjects: ['Toán học', 'Ngữ văn', 'Khoa học tự nhiên'],
    description: 'Tổ hợp đặc thù ĐH Bách Khoa Hà Nội đánh giá trọng số tư duy toán và logic chuyên sâu.',
    majorCount: 52,
    benchmarkRange: '23.5 - 29.0'
  },
  {
    code: 'H00',
    name: 'Ngữ văn - Năng khiếu Vẽ MT 1 - Vẽ MT 2',
    subjects: ['Ngữ văn', 'Vẽ MT 1', 'Vẽ MT 2'],
    description: 'Tổ hợp năng khiếu Thiết kế đồ họa, Mỹ thuật ứng dụng, Hội họa và Điêu khắc.',
    majorCount: 55,
    benchmarkRange: '21.0 - 27.5'
  },
  {
    code: 'V00',
    name: 'Toán - Vật lý - Vẽ mỹ thuật',
    subjects: ['Toán học', 'Vật lý', 'Vẽ mỹ thuật'],
    description: 'Tổ hợp chuẩn quốc gia cho ngành Kiến trúc công trình, Quy hoạch đô thị và Thiết kế nội thất.',
    majorCount: 48,
    benchmarkRange: '20.5 - 26.8'
  },
  {
    code: 'V01',
    name: 'Toán - Ngữ văn - Vẽ mỹ thuật',
    subjects: ['Toán học', 'Ngữ văn', 'Vẽ mỹ thuật'],
    description: 'Tổ hợp Kiến trúc cảnh quan, Thiết kế nội thất và Thiết kế không gian văn hóa.',
    majorCount: 42,
    benchmarkRange: '20.0 - 26.2'
  },
  {
    code: 'T00',
    name: 'Toán - Sinh học - Năng khiếu TDTT',
    subjects: ['Toán học', 'Sinh học', 'Năng khiếu TDTT'],
    description: 'Tổ hợp Giáo dục Thể chất, Huấn luyện thể thao, Y học thể thao và Quản lý thể thao.',
    majorCount: 35,
    benchmarkRange: '18.0 - 24.5'
  },
  {
    code: 'M00',
    name: 'Ngữ văn - Toán - Đọc kể & Hát',
    subjects: ['Ngữ văn', 'Toán học', 'Năng khiếu Mầm non'],
    description: 'Tổ hợp Giáo dục Mầm non, Giáo dục Đặc biệt (Miễn 100% học phí theo Nghị định 116).',
    majorCount: 38,
    benchmarkRange: '19.0 - 25.5'
  },
  {
    code: 'R00',
    name: 'Ngữ văn - Lịch sử - Năng khiếu Báo chí',
    subjects: ['Ngữ văn', 'Lịch sử', 'NK Báo chí'],
    description: 'Tổ hợp Báo chí điều tra, Báo ảnh, Biên tập truyền hình Học viện Báo chí & Tuyên truyền.',
    majorCount: 32,
    benchmarkRange: '22.0 - 28.5'
  }
];

export const MAJORS_DATA: Major[] = [
  {
    id: 'major-cs',
    code: '7480101',
    name: 'Khoa học Máy tính (Computer Science)',
    category: 'Công nghệ Thông tin & AI',
    coreDisciplines: [
      'Cấu trúc dữ liệu và Giải thuật nâng cao',
      'Kiến trúc máy tính & Hệ điều hành phân tán',
      'Lý thuyết tính toán & Trí tuệ nhân tạo',
      'Học máy (Machine Learning) & Deep Learning',
      'Bảo mật và Mật mã học'
    ],
    expectedCompetencies: [
      'Nghiên cứu và hiện thực hóa các thuật toán phức tạp',
      'Phát triển hệ thống tính toán hiệu năng cao (HPC)',
      'Tối ưu hóa kiến trúc xử lý dữ liệu quy mô hàng triệu người dùng',
      'Xây dựng các mô hình nền tảng AI'
    ],
    directlyRelatedJobs: ['Kỹ sư AI/ML', 'Nhà khoa học dữ liệu', 'Kỹ sư Thuật toán', 'Kỹ sư Phần mềm'],
    adjacentJobs: ['Kiến trúc sư Giải pháp Phần mềm', 'Kỹ sư Hệ thống Phân tán', 'Kỹ sư MLOps'],
    estimatedTuitionRange: '30 - 65 triệu VND/năm',
    studyDurationYears: 4,
    marketDemandOutlook: 'Tăng trưởng mạnh',
    automationImpactAnalysis: 'AI tự sinh code cơ bản, nhưng chuyên môn tối ưu hóa thuật toán tầng sâu, mô hình toán học và điện toán biên có nhu cầu tăng trên 40%.',
    transitionPivots: [
      'Sau năm 1: Có thể chuyển sang Kỹ thuật Phần mềm hoặc Hệ thống Thông tin.',
      'Sau năm 2: Chuyển hướng sang Kỹ thuật Dữ liệu hoặc An toàn Thông tin.'
    ],
    applicableCombinations: ['A00', 'A01', 'X01', 'X06', 'D01']
  },
  {
    id: 'major-software-eng',
    code: '7480103',
    name: 'Kỹ thuật Phần mềm (Software Engineering)',
    category: 'Công nghệ Thông tin & AI',
    coreDisciplines: [
      'Phát triển phần mềm hướng đối tượng',
      'Kiến trúc Microservices & Điện toán Đám mây',
      'Quy trình Agile/Scrum & CI/CD tự động',
      'Kiểm thử phần mềm & Đảm bảo chất lượng (QA/QC)',
      'Lập trình di động và Web hiện đại'
    ],
    expectedCompetencies: [
      'Thiết kế kiến trúc hệ thống phần mềm mở rộng linh hoạt',
      'Lập trình Fullstack với các framework chuẩn công nghiệp',
      'Quản lý vòng đời sản phẩm số từ ý tưởng đến triển khai vận hành',
      'Tích hợp công nghệ bảo mật ứng dụng (DevSecOps)'
    ],
    directlyRelatedJobs: ['Kỹ sư Phần mềm Fullstack', 'Kỹ sư Backend', 'Kỹ sư Frontend', 'Kỹ sư DevOps'],
    adjacentJobs: ['Product Manager công nghệ', 'Scrum Master', 'Kỹ sư Kiểm thử Tự động'],
    estimatedTuitionRange: '28 - 55 triệu VND/năm',
    studyDurationYears: 4,
    marketDemandOutlook: 'Tăng trưởng mạnh',
    automationImpactAnalysis: 'Công cụ AI hỗ trợ lập trình nhanh hơn, đòi hỏi kỹ sư tập trung vào thiết kế nghiệp vụ phức tạp, kiểm soát kiến trúc và trải nghiệm người dùng.',
    transitionPivots: [
      'Sau năm 1: Dễ dàng chuyển sang Khoa học Máy tính hoặc An toàn Thông tin.',
      'Sau năm 2: Chuyển sang Thiết kế Trải nghiệm Người dùng (UI/UX) hoặc Quản lý Dự án IT.'
    ],
    applicableCombinations: ['A00', 'A01', 'X01', 'X06', 'D01']
  },
  {
    id: 'major-data-ai',
    code: '7480201',
    name: 'Khoa học Dữ liệu & Trí tuệ Nhân tạo (Data Science & AI)',
    category: 'Công nghệ Thông tin & AI',
    coreDisciplines: [
      'Toán giải tích và Xác suất thống kê đa biến',
      'Học sâu & Mạng nơ-ron (Deep Learning & Transformers)',
      'Xử lý ngôn ngữ tự nhiên (NLP) & Thị giác máy tính (CV)',
      'Kỹ thuật Dữ liệu lớn (Big Data Engineering: Spark, Kafka)',
      'Đạo đức AI và Bảo mật dữ liệu cá nhân'
    ],
    expectedCompetencies: [
      'Xây dựng đường ống thu thập và tiền xử lý dữ liệu lớn',
      'Huấn luyện, đánh giá và tinh chỉnh các mô hình học máy',
      'Triển khai mô hình AI trên môi trường đám mây và biên (Edge AI)',
      'Trực quan hóa và diễn giải kết luận dự báo cho ban lãnh đạo'
    ],
    directlyRelatedJobs: ['Kỹ sư Trí tuệ Nhân tạo', 'Nhà phân tích Dữ liệu cao cấp', 'Kỹ sư Dữ liệu', 'Kỹ sư Thị giác máy tính'],
    adjacentJobs: ['Kỹ sư MLOps', 'Chuyên viên Phân tích Định lượng Tài chính', 'Chuyên viên Tư vấn Chuyển đổi số'],
    estimatedTuitionRange: '32 - 60 triệu VND/năm',
    studyDurationYears: 4,
    marketDemandOutlook: 'Tăng trưởng mạnh',
    automationImpactAnalysis: 'Nhu cầu nhân lực phát triển các hệ thống Agentic AI và xử lý dữ liệu nội bộ doanh nghiệp tăng gấp 3 lần tại Việt Nam đến 2030.',
    transitionPivots: [
      'Sau năm 1: Chuyển sang Khoa học Máy tính hoặc Toán ứng dụng.',
      'Sau năm 2: Chuyển sang Phân tích Kinh doanh (Business Analytics).'
    ],
    applicableCombinations: ['A00', 'A01', 'D01', 'D07', 'X06']
  },
  {
    id: 'major-semiconductor',
    code: '7520207',
    name: 'Thiết kế Vi mạch & Công nghệ Bán dẫn (Semiconductor & IC Design)',
    category: 'Kỹ thuật & Công nghệ',
    coreDisciplines: [
      'Vật lý bán dẫn và Linh kiện vi điện tử',
      'Thiết kế mạch logic số & RTL (SystemVerilog)',
      'Quy trình thiết kế vi mạch tương tự & vi cơ điện tử (MEMS)',
      'Công cụ EDA tiêu chuẩn ngành (Synopsys, Cadence)',
      'Công nghệ đóng gói vi mạch nâng cao và kiểm thử phần cứng'
    ],
    expectedCompetencies: [
      'Viết mã mô tả phần cứng và tổng hợp logic vi mạch',
      'Xây dựng môi trường kiểm thử chức năng theo chuẩn UVM',
      'Phân tích định thời tĩnh (STA) và tối ưu hóa diện tích/công suất (PPA)',
      'Vận hành máy đo kiểm phần cứng logic analyzer và máy hiện sóng tốc độ cao'
    ],
    directlyRelatedJobs: ['Kỹ sư Thiết kế RTL', 'Kỹ sư Kiểm thử Vi mạch (Verification)', 'Kỹ sư Layout Vật lý', 'Kỹ sư Đóng gói Bán dẫn'],
    adjacentJobs: ['Kỹ sư Hệ thống Nhúng', 'Kỹ sư Thiết kế Bo mạch Điện tử (PCB)', 'Kỹ sư Ứng dụng Phần cứng (FA)'],
    estimatedTuitionRange: '28 - 45 triệu VND/năm',
    studyDurationYears: 4.5,
    marketDemandOutlook: 'Tăng trưởng mạnh',
    automationImpactAnalysis: 'Chiến lược quốc gia đào tạo 50.000 kỹ sư bán dẫn đến 2030 tạo cơ hội việc làm rộng mở tại các trung tâm R&D quốc tế tại VN.',
    transitionPivots: [
      'Sau năm 1: Chuyển sang Kỹ thuật Điện tử - Viễn thông hoặc Kỹ thuật Máy tính.',
      'Sau năm 2: Chuyển sang Kỹ thuật Cơ điện tử hoặc Tự động hóa.'
    ],
    applicableCombinations: ['A00', 'A01', 'X01', 'X06']
  },
  {
    id: 'major-robotics',
    code: '7520216',
    name: 'Kỹ thuật Robot và Trí tuệ Nhân tạo (Robotics & AI)',
    category: 'Kỹ thuật & Công nghệ',
    coreDisciplines: [
      'Điều khiển tự động & Cảm biến thông minh',
      'Thị giác máy tính cho Robot & Định vị bản đồ (SLAM)',
      'Hệ thống nhúng & IoT công nghiệp',
      'Cơ học Robot & Động lực học cánh tay robot',
      'Lập trình ROS (Robot Operating System) & PLC'
    ],
    expectedCompetencies: [
      'Thiết kế và mô phỏng cánh tay robot & xe tự hành AGV/AMR',
      'Lập trình PLC & vi điều khiển nhúng thời gian thực',
      'Tích hợp giải pháp tự động hóa dây chuyền sản xuất nhà máy thông minh',
      'Bảo trì và chẩn đoán hệ thống robot công nghiệp chuẩn quốc tế'
    ],
    directlyRelatedJobs: ['Kỹ sư Robot', 'Kỹ sư Tự động hóa', 'Kỹ sư Hệ thống Nhúng', 'Kỹ sư Vận hành Nhà máy Thông minh'],
    adjacentJobs: ['Kỹ sư Thiết kế Cơ điện tử', 'Kỹ thuật viên Vận hành SCADA', 'Chuyên viên Kiểm thử Firmware'],
    estimatedTuitionRange: '28 - 45 triệu VND/năm',
    studyDurationYears: 4.5,
    marketDemandOutlook: 'Tăng trưởng mạnh',
    automationImpactAnalysis: 'Nhiệm vụ thủ công bị robot thay thế, nhưng nhu cầu kỹ sư tích hợp robot và lập trình thuật toán an toàn tăng hơn 35%.',
    transitionPivots: [
      'Sau năm 1: Chuyển sang Kỹ thuật Cơ điện tử hoặc Kỹ thuật Điều khiển & Tự động hóa.',
      'Sau năm 2: Chuyển sang Khoa học Máy tính chuyên ngành thị giác máy.'
    ],
    applicableCombinations: ['A00', 'A01', 'X01', 'X06']
  },
  {
    id: 'major-cybersecurity',
    code: '7480202',
    name: 'An toàn Thông tin (Cybersecurity)',
    category: 'Công nghệ Thông tin & AI',
    coreDisciplines: [
      'Mật mã học ứng dụng và Quản lý khóa',
      'Bảo mật mạng và Kiến trúc Zero Trust',
      'Điều tra số và Ứng cứu sự cố (DFIR)',
      'Kiểm thử thâm nhập & Đánh giá lỗ hổng (Penetration Testing)',
      'Bảo mật ứng dụng đám mây và DevSecOps'
    ],
    expectedCompetencies: [
      'Thiết lập và vận hành trung tâm điều hành an ninh mạng (SOC)',
      'Thực hiện kiểm thử xâm nhập tìm kiếm lỗ hổng hệ thống',
      'Phân tích mã độc và đối phó tấn công APT tinh vi',
      'Xây dựng chính sách an toàn bảo mật tuân thủ tiêu chuẩn ISO 27001'
    ],
    directlyRelatedJobs: ['Chuyên viên An ninh Mạng', 'Kỹ sư Kiểm thử Bảo mật (Pentester)', 'Chuyên viên SOC', 'Chuyên viên Phân tích Mã độc'],
    adjacentJobs: ['Quản trị viên Hệ thống Mạng', 'Kỹ sư DevSecOps', 'Chuyên viên Tuân thủ & Pháp chế Dữ liệu'],
    estimatedTuitionRange: '28 - 50 triệu VND/năm',
    studyDurationYears: 4,
    marketDemandOutlook: 'Tăng trưởng mạnh',
    automationImpactAnalysis: 'Tội phạm mạng sử dụng AI tạo ra các cuộc tấn công tinh vi đòi hỏi chuyên gia an toàn thông tin chuyên sâu bảo vệ hạ tầng trọng yếu.',
    transitionPivots: [
      'Sau năm 1: Chuyển sang Kỹ thuật Mạng hoặc Kỹ thuật Phần mềm.',
      'Sau năm 2: Chuyển sang Quản trị Hệ thống Thông tin.'
    ],
    applicableCombinations: ['A00', 'A01', 'X01', 'X06', 'D01']
  },
  {
    id: 'major-logistics',
    code: '7510605',
    name: 'Logistics và Quản lý Chuỗi Cung ứng (Logistics & Supply Chain)',
    category: 'Kinh tế & Quản trị',
    coreDisciplines: [
      'Quản trị mua hàng và Quản lý kho bãi hiện đại (WMS)',
      'Quy trình vận tải đa phương thức quốc tế & Cảng biển',
      'Nghiệp vụ xuất nhập khẩu & Khai báo hải quan điện tử',
      'Tối ưu hóa chuỗi cung ứng bằng dữ liệu và phần mềm ERP/TMS',
      'Logistics xanh và Phát triển chuỗi cung ứng bền vững'
    ],
    expectedCompetencies: [
      'Lập kế hoạch nhu cầu và điều phối chuỗi cung ứng toàn diện',
      'Xử lý thủ tục thông quan và chứng từ vận tải quốc tế',
      'Vận hành kho hàng tự động và hệ thống phân phối hàng hóa',
      'Đàm phán cước tàu và hợp đồng ngoại thương Incoterms'
    ],
    directlyRelatedJobs: ['Chuyên viên Chuỗi Cung ứng', 'Chuyên viên Xuất Nhập khẩu', 'Quản lý Kho vận', 'Chuyên viên Điều phối Cảng biển'],
    adjacentJobs: ['Chuyên viên Thu mua (Procurement)', 'Chuyên viên Phân tích Dữ liệu Chuỗi cung ứng', 'Chuyên viên Kinh doanh Cước'],
    estimatedTuitionRange: '26 - 48 triệu VND/năm',
    studyDurationYears: 4,
    marketDemandOutlook: 'Tăng trưởng mạnh',
    automationImpactAnalysis: 'Việt Nam giữ vai trò trung tâm sản xuất và cảng nước sâu của ASEAN, đẩy nhu cầu nhân sự logistics chất lượng cao tăng trưởng ổn định 15%/năm.',
    transitionPivots: [
      'Sau năm 1: Chuyển sang Kinh doanh Quốc tế hoặc Kinh tế Đối ngoại.',
      'Sau năm 2: Chuyển sang Quản trị Kinh doanh hoặc Thương mại Điện tử.'
    ],
    applicableCombinations: ['A00', 'A01', 'D01', 'D07', 'D10']
  },
  {
    id: 'major-intl-business',
    code: '7340120',
    name: 'Kinh doanh Quốc tế (International Business)',
    category: 'Kinh tế & Quản trị',
    coreDisciplines: [
      'Thương mại quốc tế & Đầu tư trực tiếp nước ngoài (FDI)',
      'Đàm phán kinh doanh đa văn hóa',
      'Thanh toán quốc tế & Quản trị rủi ro tỷ giá',
      'Marketing quốc tế & Xâm nhập thị trường mới',
      'Luật thương mại quốc tế & WTO/CPTPP/EVFTA'
    ],
    expectedCompetencies: [
      'Xây dựng chiến lược xuất khẩu và tiếp cận thị trường nước ngoài',
      'Đàm phán ký kết hợp đồng thương mại quốc tế bằng ngoại ngữ',
      'Tổ chức và giám sát hoạt động thanh toán qua L/C, T/T',
      'Quản trị dự án đầu tư có yếu tố nước ngoài'
    ],
    directlyRelatedJobs: ['Chuyên viên Phát triển Thị trường Quốc tế', 'Chuyên viên Xuất Nhập khẩu', 'Chuyên viên Xúc tiến Đầu tư FDI'],
    adjacentJobs: ['Chuyên viên Quản lý Thương hiệu Quốc tế', 'Tư vấn Chiến lược Doanh nghiệp', 'Chuyên viên Mua hàng Toàn cầu'],
    estimatedTuitionRange: '26 - 55 triệu VND/năm',
    studyDurationYears: 4,
    marketDemandOutlook: 'Tăng trưởng mạnh',
    automationImpactAnalysis: 'Kỹ năng đàm phán con người, thấu cảm văn hóa và xây dựng quan hệ ngoại giao kinh doanh không thể bị AI thay thế.',
    transitionPivots: [
      'Sau năm 1: Chuyển sang Kinh tế Đối ngoại hoặc Quản trị Kinh doanh.',
      'Sau năm 2: Chuyển sang Marketing hoặc Ngôn ngữ Thương mại.'
    ],
    applicableCombinations: ['A01', 'D01', 'D07', 'D09', 'D14']
  },
  {
    id: 'major-fintech',
    code: '7340205',
    name: 'Công nghệ Tài chính (FinTech & Digital Banking)',
    category: 'Kinh tế & Quản trị',
    coreDisciplines: [
      'Kinh tế học tiền tệ & Ngân hàng thương mại số',
      'Blockchain, Hợp đồng thông minh và Tài sản số',
      'Lập trình phân tích tài chính với Python/R',
      'Máy học trong Chấm điểm tín dụng & Phát hiện gian lận',
      'Pháp chế và Quản lý rủi ro công nghệ tài chính (RegTech)'
    ],
    expectedCompetencies: [
      'Thiết kế sản phẩm tài chính số (ví điện tử, cho vay số, bảo hiểm số)',
      'Xây dựng thuật toán giao dịch tự động và quản lý danh mục đầu tư',
      'Phân tích hành vi tiêu dùng và rủi ro tín dụng khách hàng',
      'Ứng dụng blockchain vào thanh toán xuyên biên giới'
    ],
    directlyRelatedJobs: ['Chuyên viên Sản phẩm FinTech', 'Chuyên viên Phân tích Định lượng (Quant)', 'Chuyên viên Rủi ro Số', 'Kỹ sư Blockchain Tài chính'],
    adjacentJobs: ['Chuyên viên Ngân hàng Số', 'Chuyên viên Đầu tư Quỹ', 'Chuyên viên Dữ liệu Khách hàng Tài chính'],
    estimatedTuitionRange: '28 - 58 triệu VND/năm',
    studyDurationYears: 4,
    marketDemandOutlook: 'Tăng trưởng mạnh',
    automationImpactAnalysis: 'Chuyển đổi số ngân hàng tại Việt Nam đạt tốc độ cao nhất khu vực, tạo sức hút mạnh mẽ cho nhân lực liên ngành tài chính - công nghệ.',
    transitionPivots: [
      'Sau năm 1: Chuyển sang Tài chính - Ngân hàng truyền thống hoặc Khoa học Dữ liệu.',
      'Sau năm 2: Chuyển sang Quản trị Kinh doanh hoặc Thương mại Điện tử.'
    ],
    applicableCombinations: ['A00', 'A01', 'D01', 'D07', 'D84']
  },
  {
    id: 'major-medicine',
    code: '7720101',
    name: 'Y khoa (General Medicine)',
    category: 'Y Dược & Sức khỏe',
    coreDisciplines: [
      'Giải phẫu học, Sinh lý học và Mô phôi học lâm sàng',
      'Bệnh học Nội - Ngoại - Sản - Nhi chuyên sâu',
      'Chẩn đoán hình ảnh kỹ thuật cao & Xét nghiệm cận lâm sàng',
      'Dược lý học và Phác đồ điều trị cá thể hóa',
      'Y học dự phòng, Đạo đức y khoa và Kỹ năng giao tiếp bệnh nhân'
    ],
    expectedCompetencies: [
      'Thăm khám, chẩn đoán xác định và phân biệt các bệnh lý',
      'Xử trí cấp cứu ban đầu các tình huống nguy kịch',
      'Chỉ định cận lâm sàng hợp lý và diễn giải kết quả chính xác',
      'Thực hiện các thủ thuật y khoa vô khuẩn chuẩn mực'
    ],
    directlyRelatedJobs: ['Bác sĩ Đa khoa', 'Bác sĩ Nội trú', 'Bác sĩ Cấp cứu', 'Bác sĩ Gia đình'],
    adjacentJobs: ['Bác sĩ Chuyên khoa Sau đại học', 'Chuyên viên Nghiên cứu Lâm sàng (CRA)', 'Tư vấn Viên Y khoa Bảo hiểm'],
    estimatedTuitionRange: '45 - 85 triệu VND/năm',
    studyDurationYears: 6,
    marketDemandOutlook: 'Tăng trưởng mạnh',
    automationImpactAnalysis: 'AI hỗ trợ đọc phim X-quang/CT và gợi ý phác đồ, nhưng tay nghề phẫu thuật, khám lâm sàng thực tế và y đức chăm sóc bệnh nhân là bất khả thay thế.',
    transitionPivots: [
      'Sau năm 1-2: Có thể chuyển sang Y học Dự phòng hoặc Kỹ thuật Xét nghiệm Y học.',
      'Sau tốt nghiệp: Có thể học tiếp bác sĩ chuyên khoa hoặc chuyển hướng sang quản lý bệnh viện.'
    ],
    applicableCombinations: ['B00']
  },
  {
    id: 'major-pharmacy',
    code: '7720201',
    name: 'Dược học (Pharmacy)',
    category: 'Y Dược & Sức khỏe',
    coreDisciplines: [
      'Hóa dược, Dược lý học lâm sàng và Độc chất học',
      'Bào chế học và Công nghệ sinh học dược phẩm',
      'Dược liệu học và Phát triển thuốc từ thảo dược',
      'Dược lâm sàng và Sử dụng thuốc an toàn, hợp lý',
      'Quản lý chuỗi cung ứng dược phẩm và Luật dược'
    ],
    expectedCompetencies: [
      'Tham gia nghiên cứu công thức và bào chế dạng thuốc mới',
      'Tư vấn sử dụng thuốc và tương tác thuốc cho bác sĩ và người bệnh',
      'Kiểm nghiệm chất lượng thuốc theo tiêu chuẩn Dược điển',
      'Quản lý và vận hành nhà thuốc chuẩn GPP và kho dược GSP'
    ],
    directlyRelatedJobs: ['Dược sĩ Lâm sàng Bệnh viện', 'Dược sĩ Nghiên cứu & Phát triển (R&D)', 'Dược sĩ Đăng ký Thuốc (Regulatory Affairs)', 'Quản lý Nhà thuốc'],
    adjacentJobs: ['Chuyên viên Đảm bảo Chất lượng Nhà máy Dược (QA/QC)', 'Trình Dược viên Bệnh viện (Medical Rep)', 'Chuyên viên Nghiên cứu Lâm sàng'],
    estimatedTuitionRange: '35 - 75 triệu VND/năm',
    studyDurationYears: 5,
    marketDemandOutlook: 'Ổn định',
    automationImpactAnalysis: 'Sự phát triển của công nghiệp dược sinh học và vắc-xin tại Việt Nam mở ra nhiều vị trí nghiên cứu chất lượng cao thay vì chỉ bán lẻ.',
    transitionPivots: [
      'Sau năm 1: Chuyển sang Công nghệ Sinh học hoặc Kỹ thuật Hóa học.',
      'Sau năm 2: Chuyển sang Hóa phân tích hoặc Quản lý Y tế.'
    ],
    applicableCombinations: ['A00', 'B00', 'D07']
  },
  {
    id: 'major-pedagogy-math',
    code: '7140209',
    name: 'Sư phạm Toán học (Mathematics Pedagogy)',
    category: 'Sư phạm & Giáo dục',
    coreDisciplines: [
      'Toán cao cấp: Giải tích, Đại số tuyến tính, Hình học topo',
      'Tâm lý học lứa tuổi học sinh và Giáo dục học hiện đại',
      'Phương pháp dạy học môn Toán theo định hướng phát triển năng lực (GDPT 2018)',
      'Ứng dụng công nghệ và phần mềm dạy học (GeoGebra, Desmos)',
      'Kiểm tra, đánh giá chất lượng dạy học và Đổi mới sáng tạo sư phạm'
    ],
    expectedCompetencies: [
      'Thiết kế kế hoạch bài dạy sinh động khơi dậy tư duy logic cho học sinh',
      'Vận dụng linh hoạt các phương pháp dạy học tích cực và dự án STEM',
      'Xây dựng ma trận đề kiểm tra đánh giá đúng chuẩn khung năng lực',
      'Làm công tác chủ nhiệm lớp và tư vấn tâm lý học đường'
    ],
    directlyRelatedJobs: ['Giáo viên Toán THPT/THCS', 'Giảng viên Đại học', 'Chuyên viên Nghiên cứu Giáo dục', 'Tác giả Sách giáo khoa & Tài liệu toán'],
    adjacentJobs: ['Chuyên viên Thiết kế Khóa học Số (Instructional Designer)', 'Cố vấn Giáo dục STEM', 'Chuyên viên Phân tích Dữ liệu Giáo dục'],
    estimatedTuitionRange: '0 triệu VND (Miễn 100% theo NĐ 116 + 3.63 tr/tháng trợ cấp)',
    studyDurationYears: 4,
    marketDemandOutlook: 'Ổn định',
    automationImpactAnalysis: 'Chính sách miễn học phí toàn phần và hỗ trợ sinh hoạt phí 3.63 triệu/tháng theo Nghị định 116/2020/NĐ-CP thu hút thí sinh xuất sắc vào ngành sư phạm.',
    transitionPivots: [
      'Sau năm 1: Có thể chuyển sang Toán học ứng dụng hoặc Khoa học Máy tính.',
      'Sau năm 2: Chuyển sang Công nghệ Giáo dục (EdTech).'
    ],
    applicableCombinations: ['A00', 'A01', 'D01', 'X01']
  }
];

export const INSTITUTIONS_DATA: Institution[] = [
  {
    id: 'inst-hust',
    code: 'BKA',
    name: 'Đại học Bách Khoa Hà Nội',
    shortName: 'HUST',
    type: 'Đại học công lập',
    region: 'Miền Bắc',
    city: 'Hà Nội',
    tuitionPerYearMln: 32,
    scholarshipPolicies: 'Học bổng khuyến khích học tập tới 100% học phí; học bổng tài trợ doanh nghiệp từ Samsung, Synopsys, Foxconn.',
    industryPartnerships: ['Viettel', 'Samsung R&D', 'Synopsys', 'VinFast', 'Schneider Electric'],
    programs: [
      { majorId: 'major-cs', majorName: 'Khoa học Máy tính (IT1)', admissionCombinations: ['A00', 'A01', 'X06', 'K01'], benchmark2025: 28.65, benchmark2024: 28.53, quota: 300 },
      { majorId: 'major-data-ai', majorName: 'Khoa học Dữ liệu & AI (IT-E10)', admissionCombinations: ['A00', 'A01', 'X06'], benchmark2025: 28.15, benchmark2024: 28.05, quota: 120 },
      { majorId: 'major-semiconductor', majorName: 'Thiết kế Vi mạch & Bán dẫn (ET-E16)', admissionCombinations: ['A00', 'A01', 'X01'], benchmark2025: 27.20, benchmark2024: 26.85, quota: 100 },
      { majorId: 'major-robotics', majorName: 'Kỹ thuật Robot và Trí tuệ Nhân tạo', admissionCombinations: ['A00', 'A01'], benchmark2025: 27.80, benchmark2024: 27.50, quota: 120 },
      { majorId: 'major-cybersecurity', majorName: 'An toàn Không gian Số (IT-E15)', admissionCombinations: ['A00', 'A01', 'X06'], benchmark2025: 27.50, benchmark2024: 27.25, quota: 110 }
    ]
  },
  {
    id: 'inst-neu',
    code: 'KHA',
    name: 'Đại học Kinh tế Quốc dân',
    shortName: 'NEU',
    type: 'Đại học công lập',
    region: 'Miền Bắc',
    city: 'Hà Nội',
    tuitionPerYearMln: 26,
    scholarshipPolicies: 'Quỹ học bổng NEU vươn cao, học bổng doanh nghiệp ngành tài chính, bảo hiểm, kiểm toán Big4.',
    industryPartnerships: ['KPMG', 'PwC', 'Vietcombank', 'MB Bank', 'Deloitte'],
    programs: [
      { majorId: 'major-intl-business', majorName: 'Kinh doanh Quốc tế', admissionCombinations: ['A00', 'A01', 'D01', 'D07'], benchmark2025: 28.10, benchmark2024: 28.00, quota: 250 },
      { majorId: 'major-logistics', majorName: 'Logistics và Quản lý Chuỗi Cung ứng', admissionCombinations: ['A00', 'A01', 'D01', 'D07'], benchmark2025: 28.25, benchmark2024: 28.15, quota: 200 },
      { majorId: 'major-fintech', majorName: 'Công nghệ Tài chính (FinTech)', admissionCombinations: ['A00', 'A01', 'D01', 'D07'], benchmark2025: 27.60, benchmark2024: 27.40, quota: 150 }
    ]
  },
  {
    id: 'inst-ftu',
    code: 'NTH',
    name: 'Trường Đại học Ngoại Thương',
    shortName: 'FTU',
    type: 'Đại học công lập',
    region: 'Miền Bắc',
    city: 'Hà Nội',
    tuitionPerYearMln: 28,
    scholarshipPolicies: 'Học bổng khuyến khích FTU hạng A, B, C; Học bổng đồng hành của các tập đoàn đa quốc gia và ngân hàng.',
    industryPartnerships: ['Shopee', 'Unilever', 'Standard Chartered', 'HSBC', 'McKinsey'],
    programs: [
      { majorId: 'major-intl-business', majorName: 'Kinh tế Đối ngoại', admissionCombinations: ['A00', 'A01', 'D01', 'D07'], benchmark2025: 28.55, benchmark2024: 28.45, quota: 400 },
      { majorId: 'major-logistics', majorName: 'Logistics và Chuỗi Cung ứng Quốc tế', admissionCombinations: ['A00', 'A01', 'D01', 'D07'], benchmark2025: 28.60, benchmark2024: 28.50, quota: 180 }
    ]
  },
  {
    id: 'inst-hcmut',
    code: 'QSB',
    name: 'Trường Đại học Bách Khoa - ĐHQG TP.HCM',
    shortName: 'HCMUT',
    type: 'Đại học công lập',
    region: 'Miền Nam',
    city: 'TP. Hồ Chí Minh',
    tuitionPerYearMln: 35,
    scholarshipPolicies: 'Học bổng khuyến khích học tập ĐHQG-HCM, tài trợ nghiên cứu vi mạch từ Intel, Marvell, Renesas.',
    industryPartnerships: ['Intel Products Vietnam', 'Bosch Global Software', 'Marvell', 'Renesas', 'Synopsys'],
    programs: [
      { majorId: 'major-cs', majorName: 'Khoa học Máy tính', admissionCombinations: ['A00', 'A01'], benchmark2025: 28.20, benchmark2024: 28.00, quota: 350 },
      { majorId: 'major-semiconductor', majorName: 'Kỹ thuật Thiết kế Vi mạch', admissionCombinations: ['A00', 'A01'], benchmark2025: 26.80, benchmark2024: 26.50, quota: 120 },
      { majorId: 'major-robotics', majorName: 'Kỹ thuật Cơ điện tử & Robot', admissionCombinations: ['A00', 'A01'], benchmark2025: 26.90, benchmark2024: 26.50, quota: 160 }
    ]
  },
  {
    id: 'inst-uit',
    code: 'QSC',
    name: 'Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM',
    shortName: 'UIT',
    type: 'Đại học công lập',
    region: 'Miền Nam',
    city: 'TP. Hồ Chí Minh',
    tuitionPerYearMln: 36,
    scholarshipPolicies: 'Học bổng thủ khoa 100% học phí, học bổng doanh nghiệp phần mềm Nhật Bản, Hoa Kỳ tài trợ toàn phần.',
    industryPartnerships: ['VNG', 'FPT Software', 'KMS Technology', 'Tiki', 'NAB Innovation'],
    programs: [
      { majorId: 'major-cs', majorName: 'Khoa học Máy tính & AI', admissionCombinations: ['A00', 'A01', 'X06'], benchmark2025: 28.05, benchmark2024: 27.90, quota: 280 },
      { majorId: 'major-software-eng', majorName: 'Kỹ thuật Phần mềm', admissionCombinations: ['A00', 'A01', 'X06', 'D01'], benchmark2025: 27.85, benchmark2024: 27.70, quota: 320 },
      { majorId: 'major-cybersecurity', majorName: 'An toàn Thông tin', admissionCombinations: ['A00', 'A01', 'X06'], benchmark2025: 27.20, benchmark2024: 27.00, quota: 160 }
    ]
  },
  {
    id: 'inst-ueh',
    code: 'UEH',
    name: 'Đại học Kinh tế TP. Hồ Chí Minh',
    shortName: 'UEH',
    type: 'Đại học công lập',
    region: 'Miền Nam',
    city: 'TP. Hồ Chí Minh',
    tuitionPerYearMln: 34,
    scholarshipPolicies: 'Quỹ học bổng phát triển tài năng trẻ UEH, tài trợ sinh viên khởi nghiệp đổi mới sáng tạo.',
    industryPartnerships: ['PwC', 'EY', 'VietinBank', 'ACB', 'Lazada'],
    programs: [
      { majorId: 'major-intl-business', majorName: 'Kinh doanh Quốc tế', admissionCombinations: ['A00', 'A01', 'D01', 'D07'], benchmark2025: 27.80, benchmark2024: 27.60, quota: 300 },
      { majorId: 'major-logistics', majorName: 'Logistics và Chuỗi Cung ứng', admissionCombinations: ['A00', 'A01', 'D01', 'D07'], benchmark2025: 27.90, benchmark2024: 27.70, quota: 220 },
      { majorId: 'major-fintech', majorName: 'Công nghệ Tài chính (FinTech)', admissionCombinations: ['A00', 'A01', 'D01', 'D07'], benchmark2025: 27.40, benchmark2024: 27.20, quota: 160 }
    ]
  },
  {
    id: 'inst-hmu',
    code: 'HMU',
    name: 'Trường Đại học Y Hà Nội',
    shortName: 'HMU',
    type: 'Đại học công lập',
    region: 'Miền Bắc',
    city: 'Hà Nội',
    tuitionPerYearMln: 55,
    scholarshipPolicies: 'Quỹ học bổng GS. Tôn Thất Tùng, Quỹ Thắp sáng tương lai cho sinh viên y khoa nghèo vượt khó.',
    industryPartnerships: ['Bệnh viện Bạch Mai', 'Bệnh viện Việt Đức', 'Bệnh viện Nhi Trung ương'],
    programs: [
      { majorId: 'major-medicine', majorName: 'Y khoa (Bác sĩ đa khoa)', admissionCombinations: ['B00'], benchmark2025: 28.35, benchmark2024: 28.27, quota: 420 }
    ]
  },
  {
    id: 'inst-yds',
    code: 'YDS',
    name: 'Đại học Y Dược TP. Hồ Chí Minh',
    shortName: 'YDS',
    type: 'Đại học công lập',
    region: 'Miền Nam',
    city: 'TP. Hồ Chí Minh',
    tuitionPerYearMln: 62,
    scholarshipPolicies: 'Trích 8% học phí cấp học bổng tài năng và miễn giảm cho tân sinh viên hoàn cảnh khó khăn.',
    industryPartnerships: ['Bệnh viện Chợ Rẫy', 'Bệnh viện Đại học Y Dược', 'Bệnh viện Từ Dũ'],
    programs: [
      { majorId: 'major-medicine', majorName: 'Y khoa', admissionCombinations: ['B00'], benchmark2025: 28.20, benchmark2024: 28.10, quota: 400 },
      { majorId: 'major-pharmacy', majorName: 'Dược học', admissionCombinations: ['A00', 'B00'], benchmark2025: 26.50, benchmark2024: 26.25, quota: 350 }
    ]
  },
  {
    id: 'inst-hnue',
    code: 'SPH',
    name: 'Trường Đại học Sư phạm Hà Nội',
    shortName: 'HNUE',
    type: 'Đại học công lập',
    region: 'Miền Bắc',
    city: 'Hà Nội',
    tuitionPerYearMln: 0,
    scholarshipPolicies: 'Miễn 100% học phí theo Nghị định 116/2020/NĐ-CP + Hỗ trợ sinh hoạt phí 3.63 triệu đồng/tháng.',
    industryPartnerships: ['Hệ thống Trường THPT Chuyên', 'Vinschool', 'Đoàn TNCS Hồ Chí Minh'],
    programs: [
      { majorId: 'major-pedagogy-math', majorName: 'Sư phạm Toán học', admissionCombinations: ['A00', 'A01', 'D01'], benchmark2025: 28.40, benchmark2024: 28.20, quota: 220 }
    ]
  },
  {
    id: 'inst-ctu',
    code: 'TCT',
    name: 'Trường Đại học Cần Thơ',
    shortName: 'CTU',
    type: 'Đại học công lập',
    region: 'Miền Nam',
    city: 'Cần Thơ',
    tuitionPerYearMln: 22,
    scholarshipPolicies: 'Học bổng khuyến khích cho 10% sinh viên giỏi; hỗ trợ đặc biệt cho con em gia đình nông nghiệp ĐBSCL.',
    industryPartnerships: ['Lộc Trời Group', 'Thành Công Group', 'VNPT Cần Thơ'],
    programs: [
      { majorId: 'major-cs', majorName: 'Công nghệ Thông tin', admissionCombinations: ['A00', 'A01', 'X06'], benchmark2025: 25.50, benchmark2024: 25.10, quota: 300 },
      { majorId: 'major-logistics', majorName: 'Logistics & Quản lý Chuỗi Cung ứng', admissionCombinations: ['A00', 'A01', 'D01'], benchmark2025: 25.80, benchmark2024: 25.40, quota: 160 }
    ]
  }
];

export const OCCUPATIONS_DATA: Occupation[] = [
  {
    id: 'occ-robotics-engineer',
    title: 'Kỹ sư Robot & Tự động hóa',
    sector: 'Sản xuất Thông minh & Công nghệ',
    dailyTasks: [
      'Lập trình và tích hợp cánh tay robot công nghiệp (ABB, KUKA, Yaskawa) vào trạm hàn, gắp, sơn.',
      'Viết mã điều khiển PLC (Siemens S7-1500, Mitsubishi) và giao diện màn hình HMI.',
      'Phối hợp đội ngũ cơ khí để cân chỉnh độ chính xác và an toàn lao động chuẩn ISO 10218.',
      'Khắc phục sự cố dừng chuyền trong thời gian nhanh nhất.'
    ],
    essentialSkills: [
      'Lập trình PLC nâng cao & C/C++',
      'Thiết kế sơ đồ điện EPLAN',
      'Động học Robot & Hệ thống khí nén/thủy lực',
      'Tư duy giải quyết sự cố thực địa (Troubleshooting)'
    ],
    trainableOnJobSkills: [
      'Giao thức truyền thông công nghiệp Profinet/Modbus',
      'Quy trình vận hành chuẩn của từng hãng sản xuất',
      'Kỹ năng thương lượng với nhà thầu phụ'
    ],
    credentialRequirements: 'Bằng Cử nhân/Kỹ sư Kỹ thuật Cơ điện tử, Tự động hóa hoặc Bằng Cao đẳng Kỹ thuật kèm chứng chỉ PLC nâng cao.',
    salaryRangeMonthlyMln: {
      entry: '11 - 16 triệu',
      mid: '20 - 35 triệu',
      senior: '40 - 65 triệu',
      source: 'Khảo sát Navigos / VietnamWorks Q1/2026 cho nhóm Kỹ thuật Công nghiệp'
    },
    laborMarketUrgency: 'Rất cao',
    techEvolutionNotes: 'AI không thay thế kỹ sư trực tiếp tại sàn xưởng; trái lại, AI hỗ trợ tối ưu hóa quỹ đạo chuyển động robot và bảo trì dự đoán (Predictive Maintenance), giúp kỹ sư giảm thời gian trực ca đêm.',
    alternativeEntryPaths: [
      'Học Cao đẳng Cơ điện tử 2.5 năm -> Đi làm kỹ thuật viên bảo trì -> Tích lũy chứng chỉ PLC Siemens -> Thăng tiến lên Kỹ sư Tự động hóa sau 3 năm.',
      'Học nghề tại trường đối tác kết hợp vừa học vừa làm tại các KCN Bắc Ninh, Bình Dương.'
    ],
    adjacentOccupations: ['Kỹ sư Vận hành SCADA', 'Kỹ thuật viên Bảo trì Cơ điện', 'Chuyên viên Tư vấn Kỹ thuật Thiết bị']
  },
  {
    id: 'occ-ai-engineer',
    title: 'Kỹ sư Trí tuệ Nhân tạo & Học máy (AI/ML Engineer)',
    sector: 'Công nghệ Thông tin & Dữ liệu',
    dailyTasks: [
      'Thu thập, làm sạch và chuẩn hóa tập dữ liệu chuyên ngành lớn.',
      'Huấn luyện, tinh chỉnh (fine-tuning) các mô hình ngôn ngữ lớn hoặc mô hình thị giác máy tính.',
      'Tối ưu hóa độ trễ mô hình (Model quantization, ONNX) để triển khai trên môi trường sản phẩm.',
      'Theo dõi độ trôi dữ liệu (data drift) và đánh giá độ chính xác thực tế.'
    ],
    essentialSkills: [
      'Thành thạo Python, PyTorch/TensorFlow',
      'Kiến trúc mô hình Transformer, CNN, RAG (Retrieval-Augmented Generation)',
      'Kỹ năng MLOps (Docker, Kubernetes, MLflow)',
      'Toán giải tích và xác suất ứng dụng'
    ],
    trainableOnJobSkills: [
      'Hiểu biết nghiệp vụ ngân hàng/bán lẻ/sản xuất',
      'Kỹ thuật Prompting & Agentic workflows phức tạp',
      'Tối ưu chi phí inference trên GPU đám mây'
    ],
    credentialRequirements: 'Bằng Đại học chuyên ngành Khoa học Máy tính, Toán-Tin, Khoa học Dữ liệu hoặc portfolio sản phẩm AI mã nguồn mở đã được kiểm chứng.',
    salaryRangeMonthlyMln: {
      entry: '15 - 24 triệu',
      mid: '30 - 55 triệu',
      senior: '60 - 100+ triệu',
      source: 'Báo cáo Thị trường IT Việt Nam TopDev 2026'
    },
    laborMarketUrgency: 'Rất cao',
    techEvolutionNotes: 'Tốc độ tự động hóa mã nguồn cao đòi hỏi kỹ sư AI không chỉ biết gọi API, mà phải có năng lực đánh giá rủi ro thiên vị (bias), bảo mật dữ liệu riêng tư và tối ưu chi phí vận hành mô hình.',
    alternativeEntryPaths: [
      'Xuất phát từ lập trình viên Backend -> Bổ sung khóa học chuyên sâu MLOps và chứng chỉ Cloud (AWS/GCP Machine Learning Specialty) -> Chuyển hướng sang Kỹ sư AI.',
      'Tự học qua các dự án Kaggle & mã nguồn mở kèm cố vấn từ cộng đồng.'
    ],
    adjacentOccupations: ['Kỹ sư Dữ liệu (Data Engineer)', 'Kỹ sư Phần mềm', 'Chuyên viên Phân tích Dữ liệu (BI Analyst)']
  },
  {
    id: 'occ-ic-design',
    title: 'Kỹ sư Thiết kế Vi mạch Bán dẫn (IC Design & Verification)',
    sector: 'Bán dẫn & Vi điện tử',
    dailyTasks: [
      'Thiết kế kiến trúc khối vi mạch logic (RTL Design) bằng Verilog/SystemVerilog.',
      'Xây dựng môi trường kiểm thử chức năng theo chuẩn UVM và chạy mô phỏng kiểm tra lỗi logic.',
      'Phân tích định thời tĩnh STA và giải quyết vi phạm thời gian.',
      'Phối hợp với trung tâm đúc chip để hoàn thiện hồ sơ Tape-out.'
    ],
    essentialSkills: [
      'Verilog/SystemVerilog & EDA Tools (Synopsys/Cadence)',
      'Phương pháp kiểm thử UVM & Mô phỏng chức năng',
      'Kiến trúc máy tính & Giao thức bus SoC (AXI, AHB)',
      'Tối ưu hóa công suất tiêu thụ & diện tích silicon (PPA)'
    ],
    trainableOnJobSkills: [
      'Quy trình làm việc với xưởng đúc TSMC/GlobalFoundries',
      'Kỹ năng phối hợp với đội ngũ thiết kế toàn cầu tại Mỹ, Nhật, Đài Loan',
      'Quy trình thiết kế vi mạch tương tự tín hiệu hỗn hợp'
    ],
    credentialRequirements: 'Bằng Kỹ sư Kỹ thuật Điện tử - Viễn thông, Kỹ thuật Máy tính hoặc Bán dẫn; ưu tiên có chứng chỉ Synopsys/Cadence EDA.',
    salaryRangeMonthlyMln: {
      entry: '18 - 26 triệu',
      mid: '35 - 55 triệu',
      senior: '65 - 110+ triệu',
      source: 'Hiệp hội Bán dẫn TP.HCM & VietnamWorks In-demand Semi 2026'
    },
    laborMarketUrgency: 'Rất cao',
    techEvolutionNotes: 'Các tập đoàn toàn cầu (Marvell, Synopsys, Renesas, Ampere, Qualcomm) mở rộng trung tâm R&D tại VN khiến kỹ sư thiết kế RTL và Verification được săn đón với mức đãi ngộ top đầu thị trường.',
    alternativeEntryPaths: [
      'Tốt nghiệp Điện tử/CNTT -> Tham gia khóa đào tạo chuyên sâu thiết kế vi mạch 6-9 tháng tại NIC / SHTP Training Center do nhà nước tài trợ -> Được tuyển dụng trực tiếp.'
    ],
    adjacentOccupations: ['Kỹ sư Kiểm thử Vi mạch (Verification)', 'Kỹ sư Thiết kế Bo mạch Nhúng', 'Kỹ sư Kiến trúc Chip']
  },
  {
    id: 'occ-logistics-coordinator',
    title: 'Chuyên viên Chuỗi Cung ứng & Khai báo Hải quan',
    sector: 'Thương mại & Dịch vụ Vận tải',
    dailyTasks: [
      'Theo dõi tiến độ đơn hàng quốc tế từ cảng xuất phát đến kho nội địa.',
      'Lập bộ chứng từ xuất nhập khẩu (Bill of Lading, Invoice, Packing List, C/O).',
      'Thực hiện khai báo hải quan điện tử qua hệ thống VNACCS/VCIS.',
      'Giải quyết các tình huống phát sinh tại cảng (kiểm hóa, lưu bãi, chậm chuyến).'
    ],
    essentialSkills: [
      'Nghiệp vụ Ngoại thương & Incoterms 2020',
      'Sử dụng phần mềm khai báo hải quan điện tử',
      'Tiếng Anh thương mại & giao tiếp giải quyết xung đột',
      'Kỹ năng Excel và phân tích số liệu vận chuyển'
    ],
    trainableOnJobSkills: [
      'Mối quan hệ làm việc với hãng tàu và chi cục hải quan',
      'Quản lý rủi ro tỷ giá và phụ phí container',
      'Quy trình vận hành logistics kho bãi 3PL'
    ],
    credentialRequirements: 'Bằng Cử nhân/Cao đẳng ngành Logistics, Ngoại thương, Kinh tế Quốc tế hoặc có chứng chỉ Nghiệp vụ Khai thuê Hải quan.',
    salaryRangeMonthlyMln: {
      entry: '9 - 14 triệu',
      mid: '16 - 28 triệu',
      senior: '32 - 50 triệu',
      source: 'Hiệp hội Doanh nghiệp Dịch vụ Logistics Việt Nam (VLA)'
    },
    laborMarketUrgency: 'Trung bình',
    techEvolutionNotes: 'Hệ thống một cửa quốc gia tự động hóa việc cấp phép; người lao động cần nâng cao năng lực phân tích dữ liệu tuyến vận tải để cắt giảm chi phí phát thải carbon (Green Logistics).',
    alternativeEntryPaths: [
      'Tốt nghiệp Cao đẳng Kinh tế hoặc Ngoại ngữ -> Học khóa chứng chỉ Khai hải quan 3 tháng -> Đi làm nhân viên chứng từ Forwarding -> Thăng tiến sau 2 năm.'
    ],
    adjacentOccupations: ['Nhân viên Mua hàng (Procurement)', 'Quản lý Kho vận (Warehouse Supervisor)', 'Chuyên viên Kinh doanh Cước (Freight Sales)']
  },
  {
    id: 'occ-doctor',
    title: 'Bác sĩ Đa khoa & Chuyên khoa',
    sector: 'Y Dược & Chăm sóc Sức khỏe',
    dailyTasks: [
      'Thăm khám, đánh giá lâm sàng toàn diện tình trạng sức khỏe bệnh nhân.',
      'Chỉ định cận lâm sàng hợp lý và phân tích kết quả xét nghiệm, chẩn đoán hình ảnh.',
      'Kê đơn thuốc, lập phác đồ điều trị và tư vấn chế độ chăm sóc phục hồi.',
      'Tham gia hội chẩn các ca bệnh khó và xử trí cấp cứu khẩn cấp.'
    ],
    essentialSkills: [
      'Kiến thức bệnh học lâm sàng vững vàng và phản xạ chẩn đoán nhanh',
      'Kỹ năng giao tiếp, lắng nghe và đồng cảm với người bệnh',
      'Kỹ thuật thủ thuật can thiệp y khoa vô khuẩn tuyệt đối',
      'Đạo đức y tế và tinh thần trách nhiệm trước sinh mệnh con người'
    ],
    trainableOnJobSkills: [
      'Sử dụng máy móc chẩn đoán công nghệ mới (nội soi thông minh, AI chẩn đoán)',
      'Kỹ năng quản lý hồ sơ bệnh án điện tử bệnh viện',
      'Nghiên cứu khoa học và thử nghiệm lâm sàng'
    ],
    credentialRequirements: 'Bằng Bác sĩ Y khoa hệ 6 năm + Chứng chỉ hành nghề y khoa sau 18 tháng thực hành tại bệnh viện tuyến tỉnh/trung ương.',
    salaryRangeMonthlyMln: {
      entry: '12 - 20 triệu',
      mid: '25 - 45 triệu',
      senior: '50 - 100+ triệu',
      source: 'Báo cáo Thu nhập Y tế Công & Tư Việt Nam 2026'
    },
    laborMarketUrgency: 'Rất cao',
    techEvolutionNotes: 'AI chẩn đoán hỗ trợ bác sĩ loại trừ sai sót, nhưng phán đoán lâm sàng và y đức chăm sóc người bệnh luôn là trách nhiệm bất khả xâm phạm của bác sĩ.',
    alternativeEntryPaths: [
      'Học liên thông từ Y sĩ đa khoa lên Bác sĩ theo quy chế Bộ Y tế và Bộ GD&ĐT.'
    ],
    adjacentOccupations: ['Bác sĩ Nội trú', 'Bác sĩ Gia đình', 'Chuyên viên Nghiên cứu Dược lý Lâm sàng']
  }
];

export const LABOR_MARKET_SIGNALS: LaborMarketSignal[] = [
  {
    region: 'Toàn quốc (Theo Cục Thống kê Q2/2026)',
    sector: 'Tổng quan Lao động & Thanh niên',
    growthRatePct: 3.2,
    verifiedOpeningsCount: 84500,
    topDemandedSkills: ['Kỹ năng số thích ứng', 'Kỹ thuật vận hành', 'Ngoại ngữ ứng dụng', 'Giải quyết sự cố'],
    youthUnemploymentContext: 'Tỷ lệ thất nghiệp trong độ tuổi lao động là 2,23%, nhưng thất nghiệp thanh niên 15–24 tuổi lên tới 8,67%; khoảng 1,4 triệu thanh niên thuộc nhóm không có việc làm, không học tập và không tham gia đào tạo (NEET).',
    threeYearHorizonOutlook: 'Khoảng cách giữa bằng cấp lý thuyết và kỹ năng thực hành đòi hỏi định hướng sớm và tăng cường trải nghiệm thực tế ngay từ năm 1.'
  },
  {
    region: 'Vùng Kinh tế Trọng điểm Phía Nam (TP.HCM, Bình Dương, Đồng Nai)',
    sector: 'Vi mạch, Bán dẫn & Tự động hóa',
    growthRatePct: 18.5,
    verifiedOpeningsCount: 14200,
    topDemandedSkills: ['SystemVerilog/UVM', 'Lập trình PLC Siemens/Mitsubishi', 'Bảo trì dây chuyền SMT', 'An toàn điện'],
    youthUnemploymentContext: 'Các khu công nghệ cao thiếu hụt trầm trọng kỹ thuật viên thực hành có thể vận hành máy ngay, trong khi sinh viên mới ra trường thiếu trải nghiệm thiết bị thực tế.',
    threeYearHorizonOutlook: 'Dòng vốn FDI chuyển dịch từ lắp ráp đơn giản sang đóng gói bán dẫn và tự động hóa cao, mức lương kỹ sư có tay nghề tăng trung bình 12%/năm.'
  },
  {
    region: 'Vùng Kinh tế Trọng điểm Phía Bắc (Hà Nội, Bắc Ninh, Hải Phòng)',
    sector: 'Điện tử, Logistics Cảng biển & AI',
    growthRatePct: 16.2,
    verifiedOpeningsCount: 19800,
    topDemandedSkills: ['Khai báo hải quan số', 'Kiểm soát chất lượng Six Sigma', 'Python/Dữ liệu', 'Tiếng Hàn/Trung'],
    youthUnemploymentContext: 'Cạnh tranh gay gắt ở các vị trí văn phòng chung, nhưng các vị trí kỹ thuật sản xuất và điều phối cảng biển luôn trong tình trạng khát ứng viên đạt chuẩn.',
    threeYearHorizonOutlook: 'Sự mở rộng của các tổ hợp cảng nước sâu Lạch Huyện và các trung tâm R&D tạo ra nhu cầu ổn định trong 5 năm tới.'
  }
];

export const EMPLOYER_ORDERS: EmployerOrder[] = [
  {
    id: 'emp-order-01',
    enterpriseName: 'Tập đoàn Công nghệ Sản xuất Vi mạch SynoVN',
    industry: 'Bán dẫn & Vi điện tử',
    targetRole: 'Kỹ sư Kiểm thử Vi mạch Số (Digital Verification)',
    quantityNeeded: 250,
    timelineYears: 3,
    location: 'Khu Công nghệ Cao TP. Hồ Chí Minh & Đà Nẵng',
    essentialCompetencies: ['SystemVerilog', 'UVM', 'Linux Scripting', 'Giao tiếp tiếng Anh kỹ thuật'],
    expectedStartingSalary: '16.5 - 21.0 triệu VND/tháng',
    commitmentTier: 'Reservation',
    verifiedStatus: 'Đã xác minh',
    legalNotice: 'Đăng ký nhu cầu đào tạo trong khuôn khổ hợp tác với Đại học Bách Khoa và TT Đào tạo Vi mạch; không ràng buộc độc quyền người học.'
  },
  {
    id: 'emp-order-02',
    enterpriseName: 'Công ty CP Tự động hóa & Chế tạo Robot Công nghiệp V-Robo',
    industry: 'Chế tạo Cơ điện tử',
    targetRole: 'Kỹ thuật viên Tự động hóa Vận hành Robot',
    quantityNeeded: 180,
    timelineYears: 1,
    location: 'Bình Dương & Bắc Ninh',
    essentialCompetencies: ['Lập trình PLC', 'Vận hành cánh tay robot 6 bậc', 'Đọc bản vẽ điện tử EPLAN'],
    expectedStartingSalary: '12.0 - 16.0 triệu VND/tháng',
    commitmentTier: 'Sponsorship',
    verifiedStatus: 'Đã xác minh',
    legalNotice: 'Tài trợ 50% học phí năm cuối cho sinh viên Cao đẳng Kỹ thuật Cao Thắng & FPT Poly cam kết thực tập tại xưởng chế tạo.'
  },
  {
    id: 'emp-order-03',
    enterpriseName: 'Liên minh Cảng biển & Logistics Quốc tế MekongLog',
    industry: 'Vận tải & Thương mại Biển',
    targetRole: 'Chuyên viên Điều phối Cảng cạn & Logistics Xanh',
    quantityNeeded: 120,
    timelineYears: 3,
    location: 'Hải Phòng & Bà Rịa - Vũng Tàu',
    essentialCompetencies: ['Hệ thống quản lý cảng TOS', 'Nghiệp vụ hải quan điện tử', 'Tối ưu luồng hàng container'],
    expectedStartingSalary: '13.5 - 18.0 triệu VND/tháng',
    commitmentTier: 'Forecast',
    verifiedStatus: 'Đã xác minh',
    legalNotice: 'Dự báo tăng trưởng nhu cầu giai đoạn mở rộng luồng hàng 2026-2028; số liệu phục vụ hoạch định chỉ tiêu các trường đại học.'
  }
];

export const ALTERNATIVE_PATHS_DATA: AlternativePath[] = [
  {
    id: 'alt-caodang-kythuat',
    targetGoal: 'Trở thành Kỹ sư Tự động hóa / Kỹ thuật viên Robot',
    pathType: 'Cao đẳng thực hành',
    durationMonths: 30,
    estimatedCostMln: 35,
    startingAdvantage: 'Thời gian học thực hành máy xưởng chiếm 70%; tốt nghiệp sớm 2 năm so với đại học, có thu nhập ngay từ 20 tuổi.',
    transferabilityIndex: 'Có thể học liên thông lên Đại học Bách Khoa hoặc ĐH Sư phạm Kỹ thuật trong 1.5 năm sau khi đi làm có kinh nghiệm.',
    keyProgramsInVN: ['CĐ Kỹ thuật Cao Thắng', 'CĐ Nghề Công nghệ Cao Hà Nội', 'CĐ Kỹ thuật Lý Tự Trọng']
  },
  {
    id: 'alt-semiconductor-short',
    targetGoal: 'Gia nhập ngành Thiết kế Vi mạch & Bán dẫn',
    pathType: 'Mô-đun kỹ năng & Chứng chỉ',
    durationMonths: 6,
    estimatedCostMln: 12,
    startingAdvantage: 'Dành cho người đã có nền tảng CNTT/Điện tử: tập trung 100% vào công cụ EDA thực chiến của Synopsys/Cadence, bypass 4 năm lý thuyết.',
    transferabilityIndex: 'Được các công ty thiết kế chip công nhận tương đương 1 năm kinh nghiệm thực tập sinh.',
    keyProgramsInVN: ['Trung tâm Đào tạo Khu Công nghệ Cao SHTP', 'Trung tâm Đổi mới sáng tạo Quốc gia NIC']
  },
  {
    id: 'alt-logistics-apprenticeship',
    targetGoal: 'Làm việc trong ngành Logistics & Xuất nhập khẩu',
    pathType: 'Đào tạo nghề (Apprenticeship)',
    durationMonths: 18,
    estimatedCostMln: 22,
    startingAdvantage: 'Vừa học vừa làm tại các tổng kho logistics 3PL và công ty Forwarding, hưởng phụ cấp hàng tháng 4-6 triệu trong thời gian học.',
    transferabilityIndex: 'Tích lũy chứng chỉ Khai hải quan Bộ Tài chính có giá trị toàn quốc.',
    keyProgramsInVN: ['Viện Nghiên cứu & Phát triển Logistics VLI', 'Hệ đào tạo doanh nghiệp Gemadept / ITL']
  }
];
