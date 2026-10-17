import { OccupationTimeline } from '../types';

export const OCCUPATION_TIMELINES: Record<string, OccupationTimeline> = {
  // 1. Kỹ sư Trí tuệ Nhân tạo & Học máy (AI/ML Engineer)
  'occ-ai-engineer': {
    occupationId: 'occ-ai-engineer',
    occupationTitle: 'Kỹ sư Trí tuệ Nhân tạo & Học máy (AI/ML Engineer)',
    sector: 'Công nghệ thông tin & Dữ liệu',
    overview: 'Lộ trình từ lập trình căn bản đến huấn luyện mô hình sâu, triển khai MLOps và thực tập thực chiến tại các trung tâm R&D AI hàng đầu.',
    estimatedTotalMonths: 42,
    recommendedMajors: ['Khoa học dữ liệu & AI', 'Khoa học máy tính', 'Toán - Tin ứng dụng'],
    targetCompaniesInVN: ['FPT Software AI Center', 'Viettel AI', 'VNG Corporation', 'VinAI Research', 'Zalo AI'],
    milestones: [
      {
        id: 'ai-m1',
        title: 'Khóa học nền tảng: Machine Learning Specialization (Andrew Ng)',
        type: 'course',
        stage: 'stage-1-foundation',
        stageLabel: 'Năm 1 - 2 (Nền tảng Toán & Code)',
        durationText: '10 - 12 tuần (5h/tuần)',
        provider: 'DeepLearning.AI & Stanford / Coursera',
        summary: 'Nắm vững toán giải tích, đại số tuyến tính, hồi quy tuyến tính, hồi quy logistic, cây quyết định và thuật toán SVM bằng Python & Scikit-learn.',
        skillsGained: ['Python NumPy/Pandas', 'Gradient Descent', 'Model Evaluation & Cross-Validation', 'Scikit-Learn'],
        prerequisites: ['Lập trình Python căn bản', 'Toán cao cấp A1/A2'],
        costEstimate: 'Miễn phí xem thính (Audit) hoặc $49/tháng',
        proTips: 'Học thuật toán Gradient Descent tự viết bằng NumPy thuần trước khi gọi thư viện Scikit-learn để hiểu bản chất.'
      },
      {
        id: 'ai-m2',
        title: 'Khóa học chuyên sâu: Deep Learning & Modern NLP / Vision with PyTorch',
        type: 'course',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Chuyên sâu)',
        durationText: '14 - 16 tuần',
        provider: 'DeepLearning.AI & Fast.ai / Hugging Face Academy',
        summary: 'Huấn luyện mạng nơ-ron tích chập (CNN), Transformers (BERT, GPT, LLaMA), cơ chế Attention và kỹ thuật tăng cường hệ thống RAG.',
        skillsGained: ['PyTorch Framework', 'Hugging Face Transformers', 'Vector Databases (Milvus/Pinecone)', 'Fine-tuning LLM (LoRA/QLoRA)'],
        prerequisites: ['Khóa Machine Learning căn bản'],
        costEstimate: 'Miễn phí tài liệu / Google Colab T4 GPU',
        proTips: 'Đăng tải các notebook thực hành lên GitHub và viết blog kỹ thuật giải thích cơ chế Attention để gây ấn tượng khi xin thực tập.'
      },
      {
        id: 'ai-m3',
        title: 'Chứng chỉ: AWS Certified Machine Learning - Specialty hoặc TensorFlow Dev',
        type: 'certification',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Chứng chỉ Uy tín)',
        durationText: '8 - 10 tuần luyện',
        provider: 'Amazon Web Services (AWS) / Google Cloud',
        summary: 'Chứng chỉ tiêu chuẩn quốc tế xác thực năng lực xây dựng pipeline ML hoàn chỉnh, data engineering và tối ưu chi phí hạ tầng GPU.',
        skillsGained: ['AWS SageMaker / GCP Vertex AI', 'Feature Store', 'Model Registry', 'Data Pipeline Security'],
        prerequisites: ['Kiến thức Deep Learning và quản trị Cloud căn bản'],
        costEstimate: '300 USD (Nhiều trường có voucher giảm 50%)',
        proTips: 'Nếu tài chính có hạn, bạn ưu tiên thi chứng chỉ AWS Cloud Practitioner trước, sau đó xin học bổng doanh nghiệp để thi Specialty.'
      },
      {
        id: 'ai-m4',
        title: 'Dự án Thực chiến & Cuộc thi Kaggle: Xây dựng Hệ thống Trợ lý RAG đa phương thức',
        type: 'project',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 3 (Portfolio & Sản phẩm)',
        durationText: '8 tuần tập trung',
        provider: 'Kaggle / Cộng đồng Vietnam AI Community (Groove/Kmin)',
        summary: 'Xây dựng ứng dụng hoàn chỉnh: Xử lý tài liệu PDF tiếng Việt, sinh nhúng (embedding), truy vấn ngữ nghĩa và giao diện tương tác streaming với FastAPI.',
        skillsGained: ['FastAPI Backend', 'LangChain / LlamaIndex', 'Docker container', 'Prompt Engineering'],
        prerequisites: ['PyTorch & Hugging Face'],
        costEstimate: 'Miễn phí mã nguồn mở',
        proTips: 'Đo độ trễ (latency), tỷ lệ ảo giác (hallucination rate) và đưa demo trực tiếp lên HuggingFace Spaces để nhà tuyển dụng trải nghiệm.'
      },
      {
        id: 'ai-m5',
        title: 'Thực tập Doanh nghiệp: Kỹ sư AI / MLOps Intern tại tập đoàn công nghệ',
        type: 'internship',
        stage: 'stage-3-internship',
        stageLabel: 'Năm 3 - 4 (Thực tập Thực chiến)',
        durationText: '4 - 6 tháng (Hưởng lương 7 - 14 triệu/tháng)',
        provider: 'FPT Software AI Center / Viettel Cyberspace / VNG Zing MP3 AI',
        summary: 'Tham gia dự án thật: Tinh chỉnh giọng nói tiếng Việt, phân loại hình ảnh thương mại hoặc giám sát dữ liệu trôi (data drift) trên dây chuyền.',
        skillsGained: ['MLflow / Kubeflow', 'Gitflow trong môi trường production', 'Tối ưu TensorRT / ONNX', 'Agile/Scrum'],
        prerequisites: ['Ít nhất 1 dự án chạy thật trên GitHub'],
        costEstimate: 'Doanh nghiệp trả lương và tài trợ thiết bị',
        proTips: 'Trong 2 tháng đầu, hãy chủ động tìm hiểu quy trình đẩy log lỗi của công ty; người giải quyết được bug log sẽ nhận offer chính thức sớm nhất.'
      },
      {
        id: 'ai-m6',
        title: 'Khóa luận tốt nghiệp & Chuyển tiếp Kỹ sư AI Chính thức (Junior AI Engineer)',
        type: 'competition',
        stage: 'stage-4-career',
        stageLabel: 'Năm 4 & Sau tốt nghiệp (Gia nhập Thị trường)',
        durationText: '6 tháng',
        provider: 'Hội đồng Khoa CNTT & Doanh nghiệp tuyển dụng',
        summary: 'Bảo vệ đồ án gắn liền bài toán thực tế của doanh nghiệp, chính thức nhận việc với mức thu nhập cạnh tranh.',
        skillsGained: ['System Architecture Design', 'Production CI/CD', 'Cross-functional Communication'],
        prerequisites: ['Hoàn thành các học phần tín chỉ'],
        costEstimate: 'Nhận lương chính thức 18 - 25+ triệu VNĐ/tháng',
        proTips: 'Đàm phán đánh giá năng lực 6 tháng/lần thay vì 1 năm/lần trong 2 năm đầu tiên để tăng tốc thu nhập.'
      }
    ]
  },

  // 2. Kỹ sư Kiểm thử Vi mạch Bán dẫn (IC Verification)
  'occ-ic-verification': {
    occupationId: 'occ-ic-verification',
    occupationTitle: 'Kỹ sư Kiểm thử Vi mạch Bán dẫn (IC Verification)',
    sector: 'Bán dẫn & Vi mạch',
    overview: 'Lộ trình đào tạo chuẩn quốc tế từ logic số, SystemVerilog UVM, thực tập phòng Lab EDA đến kiểm thử silicon trước khi đóng gói chip lớn.',
    estimatedTotalMonths: 48,
    recommendedMajors: ['Kỹ thuật Thiết kế Vi mạch & Bán dẫn', 'Kỹ thuật Điện tử - Viễn thông', 'Kỹ thuật máy tính'],
    targetCompaniesInVN: ['Marvell Vietnam', 'Synopsys Vietnam', 'Renesas Design Vietnam', 'Bosch Global Software', 'Ampere Computing'],
    milestones: [
      {
        id: 'icv-m1',
        title: 'Khóa học: Kiến trúc máy tính & Thiết kế Mạch Logic Số (Digital Logic Design)',
        type: 'course',
        stage: 'stage-1-foundation',
        stageLabel: 'Năm 1 - 2 (Nền tảng Phần cứng)',
        durationText: '12 tuần',
        provider: 'Khoa Điện - Điện tử ĐH Bách Khoa / MIT OpenCourseWare 6.004',
        summary: 'Hiểu đại số Boole, mạch tuần hoàn, máy trạng thái hữu hạn (FSM), cấu trúc thanh ghi, ALU và tập lệnh RISC-V.',
        skillsGained: ['Digital Logic FSM', 'Timing Diagrams', 'Verilog RTL Căn bản', 'Mô phỏng ModelSim / QuestaSim'],
        prerequisites: ['Vật lý đại cương', 'Nhập môn kỹ thuật lập trình C'],
        costEstimate: 'Học phí đại học chính quy',
        proTips: 'Vẽ giản đồ thời gian (timing diagram) bằng tay trước khi viết code Verilog để không bao giờ dính lỗi xung đột chạy đua (race conditions).'
      },
      {
        id: 'icv-m2',
        title: 'Khóa chuyên sâu: SystemVerilog for Functional Verification & OOP Testbench',
        type: 'course',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Ngôn ngữ Kiểm thử Chuyên dụng)',
        durationText: '10 tuần',
        provider: 'Trung tâm Đào tạo Vi mạch NIC / SHTP Training Center (Hợp tác Synopsys)',
        summary: 'Chuyển từ Verilog thông thường sang SystemVerilog hướng đối tượng: Random Stimulus, Functional Coverage, Assertions (SVA) và Mailbox/Semaphore.',
        skillsGained: ['SystemVerilog OOP', 'Constrained-Random Verification', 'SystemVerilog Assertions (SVA)', 'Functional Coverage Matrix'],
        prerequisites: ['Thành thạo Verilog RTL'],
        costEstimate: 'Được chính phủ tài trợ 50-100% học phí cho sinh viên ngành bán dẫn',
        proTips: 'Functional coverage là chìa khóa: nhà tuyển dụng sẽ xem bạn chứng minh đã bao phủ 100% các ca góc (corner cases) chứ không chỉ nhìn code coverage.'
      },
      {
        id: 'icv-m3',
        title: 'Chứng chỉ Chuyên môn: UVM (Universal Verification Methodology) Master Class',
        type: 'certification',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Chuẩn công nghiệp UVM)',
        durationText: '12 tuần',
        provider: 'Synopsys University Academy / Cadence Design Systems',
        summary: 'Phương pháp luận kiểm chứng chip tiêu chuẩn toàn cầu: Xây dựng UVM Agent, Driver, Monitor, Sequencer, Scoreboard và Factory Pattern.',
        skillsGained: ['UVM Architecture', 'TLM (Transaction-Level Modeling)', 'Scoreboard Data Check', 'Regression Scripting'],
        prerequisites: ['Khóa SystemVerilog OOP'],
        costEstimate: 'Cấp chứng nhận thông qua các học phần liên kết doanh nghiệp tại trường',
        proTips: 'Tập trung hiểu kỹ cơ chế phasing trong UVM (build_phase, connect_phase, run_phase) – 90% câu hỏi phỏng vấn kỹ thuật đều xoay quanh vấn đề này.'
      },
      {
        id: 'icv-m4',
        title: 'Dự án Lab: Xây dựng Môi trường UVM Verification cho Bộ vi xử lý RISC-V 32-bit Core',
        type: 'project',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 3 (Dự án Kiểm thử Silicon)',
        durationText: '8 - 10 tuần',
        provider: 'Lab Thiết kế Vi mạch Trường ĐH & Synopsys VCS Simulator',
        summary: 'Kiểm thử toàn diện cho nhân RISC-V RV32I: Viết bộ sinh tập lệnh ngẫu nhiên, mô hình đối chiếu (golden reference model) bằng C++ và tự động săn bug trong logic ALU/Branch.',
        skillsGained: ['Synopsys VCS / Verdi Debugger', 'Linux Scripting (Bash & Python)', 'Bug Tracking & Root Cause Analysis'],
        prerequisites: ['Chứng chỉ UVM'],
        costEstimate: 'Miễn phí trong phòng Lab trường',
        proTips: 'Khi đi phỏng vấn, hãy chuẩn bị slide 5 phút phân tích chi tiết 1 con "bug khó nhất" bạn từng tìm thấy trong mạch bằng Verdi để debug tín hiệu.'
      },
      {
        id: 'icv-m5',
        title: 'Thực tập Doanh nghiệp: IC Verification Intern tại Marvell / Renesas / Synopsys VN',
        type: 'internship',
        stage: 'stage-3-internship',
        stageLabel: 'Năm 3 - 4 (Thực tế Dòng Chip Toàn cầu)',
        durationText: '6 tháng toàn thời gian',
        provider: 'Marvell Technology Vietnam / Renesas Design Vietnam / Bosch VN',
        summary: 'Làm việc trong dự án chip mạng tốc độ cao (Networking PHY) hoặc chip ô tô tự hành; phối hợp với đội ngũ thiết kế tại Mỹ, Nhật để hoàn thiện kiểm thử trước khi gửi file sản xuất (Tape-out).',
        skillsGained: ['Industry EDA Environments', 'Git/Perforce Version Control', 'Cross-site Engineering Collaboration', 'Sub-system Verification'],
        prerequisites: ['Vượt qua vòng test logic số và phỏng vấn SystemVerilog'],
        costEstimate: 'Trợ cấp thực tập 8 - 15 triệu/tháng + tài trợ máy trạm Linux',
        proTips: 'Chủ động đọc hiểu tài liệu đặc tả (Spec sheet) tiếng Anh chuẩn IEEE; kỹ năng đọc hiểu spec sớm sẽ giúp bạn viết code kiểm thử nhanh gấp đôi.'
      },
      {
        id: 'icv-m6',
        title: 'Bảo vệ tốt nghiệp & Nhận Lời Tuyển dụng Kỹ sư Kiểm thử Vi mạch Chính thức',
        type: 'competition',
        stage: 'stage-4-career',
        stageLabel: 'Năm 4.5 & Khởi đầu Sự nghiệp',
        durationText: '6 tháng',
        provider: 'Trường ĐH & Doanh nghiệp',
        summary: 'Chính thức gia nhập đội ngũ vi mạch Việt Nam, tham gia các thế hệ chip tiến trình 5nm, 3nm.',
        skillsGained: ['Full-chip Regression', 'Emulation (Palladium/Zebu)', 'Senior Problem Solving'],
        prerequisites: ['Tốt nghiệp loại Khá/Giỏi'],
        costEstimate: 'Lương khởi điểm 18 - 25 triệu VNĐ/tháng + thưởng ký kết',
        proTips: 'Ngành bán dẫn có tính tích lũy chuyên môn rất cao: sau 3-5 năm lương thường tăng gấp 2 đến 3 lần so với khởi điểm.'
      }
    ]
  },

  // 3. Kỹ sư Thiết kế Vi mạch (IC Design Engineer)
  'occ-ic-design': {
    occupationId: 'occ-ic-design',
    occupationTitle: 'Kỹ sư Thiết kế Vi mạch Số & Tương tự (IC Design)',
    sector: 'Bán dẫn & Vi mạch',
    overview: 'Lộ trình toàn diện từ thiết kế mạch logic số RTL, phân tích thời gian tĩnh STA, tổng hợp mạch đến quy trình Tape-out chip thật.',
    estimatedTotalMonths: 48,
    recommendedMajors: ['Kỹ thuật Thiết kế Vi mạch & Bán dẫn', 'Kỹ thuật Điện tử - Viễn thông', 'Vật lý kỹ thuật'],
    targetCompaniesInVN: ['Marvell', 'Synopsys', 'Viettel High Tech', 'CoAsia Semiconductor', 'Ampere Computing'],
    milestones: [
      {
        id: 'icd-m1',
        title: 'Khóa học: Linh kiện, Vật lý bán dẫn & Công nghệ CMOS',
        type: 'course',
        stage: 'stage-1-foundation',
        stageLabel: 'Năm 1 - 2 (Vật lý & Thiết bị)',
        durationText: '10 tuần',
        provider: 'ĐHQG Hà Nội / ĐHQG TP.HCM / MIT OCW Solid State Devices',
        summary: 'Hiểu tiếp giáp P-N, cấu trúc MOSFET, dòng rò, điện dung ký sinh và nguyên lý hoạt động cổng logic CMOS từ cấp độ transistor.',
        skillsGained: ['MOSFET Physics', 'CMOS Inverter Characteristics', 'SPICE Circuit Simulation', 'Process Variations'],
        prerequisites: ['Vật lý đại cương', 'Giải tích'],
        costEstimate: 'Học phí học phần chính quy',
        proTips: 'Hãy chú ý hiện tượng dòng rò (leakage current) ở các tiến trình dưới 28nm – đây là thách thức lớn nhất của các kỹ sư thiết kế hiện đại.'
      },
      {
        id: 'icd-m2',
        title: 'Khóa học chuyên sâu: RTL Design Architecture & Bus Protocols (AMBA AXI/AHB)',
        type: 'course',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Kiến trúc Vi mạch)',
        durationText: '12 tuần',
        provider: 'Trung tâm Đào tạo SHTP / ARM University Program',
        summary: 'Thiết kế cấu trúc thanh ghi, bộ đệm FIFO đồng bộ/bất đồng bộ, kiến trúc pipeline và triển khai giao thức bus tiêu chuẩn công nghiệp ARM AMBA AXI4.',
        skillsGained: ['Verilog/SystemVerilog RTL', 'Clock Domain Crossing (CDC)', 'AMBA AXI/AHB Protocols', 'Low-power Design Techniques (UPF)'],
        prerequisites: ['Mạch số căn bản'],
        costEstimate: 'Hỗ trợ theo chương trình đào tạo nhân lực quốc gia',
        proTips: 'Clock Domain Crossing (CDC) là nguyên nhân gây chết chip hàng đầu: học thuộc lòng các kỹ thuật bắt tay (handshake) và 2-flip-flop synchronizer.'
      },
      {
        id: 'icd-m3',
        title: 'Chứng chỉ EDA Chuyên nghiệp: Synopsys Design Compiler & Static Timing Analysis (STA)',
        type: 'certification',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Chứng chỉ Thiết kế Chuẩn)',
        durationText: '10 tuần',
        provider: 'Synopsys University Program / NIC',
        summary: 'Sử dụng công cụ hàng đầu Synopsys Design Compiler để tổng hợp code RTL thành netlist cổng logic; phân tích thời gian tĩnh với Synopsys PrimeTime.',
        skillsGained: ['Synopsys Design Compiler (DC)', 'PrimeTime STA', 'Timing Constraints (SDC files)', 'Setup/Hold Time Optimization'],
        prerequisites: ['RTL Design căn bản'],
        costEstimate: 'Cấp chứng nhận thông qua Lab tài trợ của trường',
        proTips: 'File ràng buộc thời gian (SDC - Synopsys Design Constraints) là linh hồn của thiết kế vi mạch; viết đúng SDC sẽ giúp chip chạy tần số cao mà không tốn pin.'
      },
      {
        id: 'icd-m4',
        title: 'Dự án Tape-out Thử nghiệm: Thiết kế lõi tăng tốc mật mã (Hardware Crypto Core)',
        type: 'project',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 3 (Dự án Chip Silicon)',
        durationText: '12 tuần',
        provider: 'Chương trình MPW (Multi-Project Wafer) tài trợ bởi NIC & Doanh nghiệp',
        summary: 'Thiết kế hoàn chỉnh khối phần cứng tăng tốc AES/SHA-256 từ code RTL, tổng hợp mạch, kiểm tra CDC, bố trí linh kiện (Place & Route) và kiểm tra luật thiết kế DRC/LVS.',
        skillsGained: ['Place & Route (Synopsys IC Compiler II)', 'DRC/LVS Verification', 'PPA Analysis (Power, Performance, Area)', 'GDSII Output'],
        prerequisites: ['Chứng chỉ EDA & STA'],
        costEstimate: 'Được đài thọ chi phí tham gia MPW sản xuất chip',
        proTips: 'Sinh viên có kinh nghiệm đưa thiết kế ra file GDSII thật sẽ được 100% doanh nghiệp săn đón ngay từ năm thứ 3.'
      },
      {
        id: 'icd-m5',
        title: 'Thực tập R&D Bán dẫn Vi mạch (Viettel High Tech / Marvell / CoAsia)',
        type: 'internship',
        stage: 'stage-3-internship',
        stageLabel: 'Năm 3 - 4 (Thực tập R&D Trực tiếp)',
        durationText: '6 tháng',
        provider: 'Viettel High Tech Semiconductor / Marvell / Ampere',
        summary: 'Tham gia thiết kế các khối IP (Intellectual Property) trong SoC viễn thông 5G hoặc vi xử lý máy chủ tiết kiệm năng lượng.',
        skillsGained: ['IP Integration', 'Low-power Simulation', 'Silicon Bring-up Preparation'],
        prerequisites: ['Hoàn thành dự án thiết kế chip mẫu'],
        costEstimate: 'Trợ cấp 10 - 18 triệu/tháng',
        proTips: 'Học cách sử dụng Linux Command Line và viết script Python/Tcl thuần thục; môi trường thiết kế chip chuyên nghiệp 100% chạy trên máy chủ Linux.'
      },
      {
        id: 'icd-m6',
        title: 'Tốt nghiệp & Nhận việc Kỹ sư Thiết kế Vi mạch (Junior IC Design Engineer)',
        type: 'competition',
        stage: 'stage-4-career',
        stageLabel: 'Năm 4.5 & Gia nhập Thị trường',
        durationText: '6 tháng',
        provider: 'Tập đoàn công nghệ',
        summary: 'Trở thành kỹ sư thiết kế chính thức, tham gia vận hành những dự án công nghệ chiến lược của Việt Nam.',
        skillsGained: ['Silicon Characterization', 'Advanced Node Design (7nm/5nm/3nm)'],
        prerequisites: ['Bằng Kỹ sư đạt chuẩn'],
        costEstimate: 'Thu nhập khởi điểm 20 - 28+ triệu VNĐ/tháng',
        proTips: 'Tiến sĩ/Thạc sĩ liên kết doanh nghiệp sẽ mở rộng cơ hội lên trưởng nhóm (Lead Architect) với mức đãi ngộ quốc tế.'
      }
    ]
  },

  // 4. Kỹ sư Robot & Tự động hóa (Robotics & Automation Engineer)
  'occ-robotics-engineer': {
    occupationId: 'occ-robotics-engineer',
    occupationTitle: 'Kỹ sư Robot & Tự động hóa',
    sector: 'Sản xuất Thông minh & Công nghệ',
    overview: 'Lộ trình toàn diện từ cơ cấu cơ khí chính xác, Lập trình PLC công nghiệp, Thị giác máy tính đến vận hành cánh tay robot trong nhà máy thông minh.',
    estimatedTotalMonths: 42,
    recommendedMajors: ['Kỹ thuật Robot và Trí tuệ nhân tạo', 'Kỹ thuật Cơ điện tử', 'Kỹ thuật Điều khiển & Tự động hóa'],
    targetCompaniesInVN: ['VinFast Smart Factory', 'Samsung Electronics Vietnam', 'Schneider Electric', 'Bosch Rexroth', 'ABB Vietnam'],
    milestones: [
      {
        id: 'rob-m1',
        title: 'Khóa học: Lý thuyết Điều khiển tự động, Cảm biến & Khí nén - Thủy lực công nghiệp',
        type: 'course',
        stage: 'stage-1-foundation',
        stageLabel: 'Năm 1 - 2 (Nền tảng Điều khiển & Cơ điện)',
        durationText: '12 tuần',
        provider: 'ĐH Bách Khoa / Festo Didactic Training',
        summary: 'Mô hình hóa hệ thống vật lý (hàm truyền, Laplace), bộ điều khiển PID kinh điển, cảm biến quang/tiệm cận và mạch khí nén van đảo chiều Festo.',
        skillsGained: ['PID Tuning', 'Industrial Sensors', 'Pneumatic Circuits', 'MATLAB/Simulink'],
        prerequisites: ['Vật lý đại cương', 'Giải tích'],
        costEstimate: 'Học phí học phần chính quy',
        proTips: 'Hãy thực hành cân chỉnh PID bằng tay trên mô hình con lắc ngược hoặc động cơ DC để cảm nhận trực giác về độ vọt lố (overshoot) và thời gian xác lập.'
      },
      {
        id: 'rob-m2',
        title: 'Chứng chỉ Chuyên nghiệp: Lập trình PLC Siemens TIA Portal & SCADA WinCC',
        type: 'certification',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Chứng chỉ Tự động hóa công nghiệp)',
        durationText: '8 - 10 tuần',
        provider: 'Siemens Automation Training Center / ĐH Bách Khoa',
        summary: 'Thành thạo lập trình PLC S7-1200 / S7-1500 bằng ngôn ngữ Ladder (LAD) và Structured Text (ST); thiết kế giao diện vận hành màn hình HMI & SCADA.',
        skillsGained: ['Siemens TIA Portal', 'Ladder Logic & Structured Text', 'HMI/SCADA Design', 'Profinet Industrial Network'],
        prerequisites: ['Kỹ thuật điện đại cương'],
        costEstimate: 'Khoảng 2.500.000 - 4.500.000 VNĐ (Thường có tài trợ 50% cho SV)',
        proTips: '90% nhà máy FDI tại Việt Nam (Bắc Ninh, Hải Phòng, Bình Dương, Đồng Nai) sử dụng PLC Siemens hoặc Mitsubishi; chứng chỉ này giúp hồ sơ nổi bật.'
      },
      {
        id: 'rob-m3',
        title: 'Khóa học thực hành: Lập trình Cánh tay Robot Công nghiệp (ABB RobotStudio / KUKA)',
        type: 'course',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Lập trình Robot 6 Bậc tự do)',
        durationText: '8 tuần',
        provider: 'ABB Robotics University Partner / KUKA College',
        summary: 'Lập trình ngôn ngữ RAPID cho cánh tay robot 6 bậc tự do: Định nghĩa điểm công cụ (Tool Center Point - TCP), hệ tọa độ phôi, lập trình quỹ đạo độ chính xác cao.',
        skillsGained: ['ABB RAPID Programming', 'Robot Kinematics & Singularity Avoidance', 'Safety Zones Configuration', 'RobotStudio 3D Simulation'],
        prerequisites: ['Hình học không gian và đại số ma trận'],
        costEstimate: 'Sử dụng bản quyền giáo dục miễn phí trong phòng Lab',
        proTips: 'Điểm kỳ dị (Singularity) là cạm bẫy số 1 khi lập trình quỹ đạo tay máy: nắm chắc toán ma trận Jacobian để robot không bị dừng đột ngột.'
      },
      {
        id: 'rob-m4',
        title: 'Dự án Chế tạo: Trạm Phân loại Sản phẩm Thông minh Tích hợp Machine Vision',
        type: 'project',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 3 (Dự án Tích hợp Thực chiến)',
        durationText: '10 tuần',
        provider: 'Lab Robotics & Tự động hóa Trường ĐH',
        summary: 'Tích hợp camera công nghiệp Cognex/OpenCV với cánh tay robot Delta/SCARA và băng tải: Nhận diện lỗi bề mặt, phân loại linh kiện tốc độ 80 sản phẩm/phút.',
        skillsGained: ['Computer Vision (OpenCV/Python)', 'Modbus TCP / MQTT Communication', 'Mechanical Assembly', 'System Integration'],
        prerequisites: ['PLC Siemens & Lập trình Robot'],
        costEstimate: 'Kinh phí lab tài trợ linh kiện',
        proTips: 'Ánh sáng chiếm 70% thành bại của Machine Vision: hãy chọn đèn chiếu sáng chuyên dụng (ring light/backlight) để ảnh không bị lóa bóng.'
      },
      {
        id: 'rob-m5',
        title: 'Thực tập Nhà máy Sản xuất Thông minh (VinFast / Samsung / Schneider)',
        type: 'internship',
        stage: 'stage-3-internship',
        stageLabel: 'Năm 3 - 4 (Thực tập Nhà máy Thông minh)',
        durationText: '4 - 6 tháng',
        provider: 'VinFast Smart Factory Hải Phòng / Samsung Thái Nguyên / Schneider Electric Đồng Nai',
        summary: 'Trực tiếp theo dõi dây chuyền dập hàn tự động; xử lý sự cố dừng chuyền, hiệu chuẩn độ chính xác của robot và tham gia bảo trì dự đoán (PdM).',
        skillsGained: ['Shopfloor Troubleshooting', 'Total Productive Maintenance (TPM)', 'EPLAN Electrical Schematics', 'Industrial Safety ISO 10218'],
        prerequisites: ['Chứng chỉ an toàn và thành thạo PLC'],
        costEstimate: 'Trợ cấp thực tập 6 - 12 triệu/tháng + xe đưa đón',
        proTips: 'Tại nhà máy sản xuất, thời gian dừng chuyền tính bằng nghìn đô tiền phạt: khả năng đọc nhanh sơ đồ EPLAN để tìm lỗi chập dây sẽ giúp bạn ghi điểm tuyệt đối.'
      },
      {
        id: 'rob-m6',
        title: 'Bảo vệ Đồ án & Nhận Việc Kỹ sư Tự động hóa / Robot Chính thức',
        type: 'competition',
        stage: 'stage-4-career',
        stageLabel: 'Năm 4 & Khởi đầu Sự nghiệp',
        durationText: '6 tháng',
        provider: 'Hội đồng Khoa & Doanh nghiệp',
        summary: 'Gia nhập đội ngũ kỹ sư tại các nhà máy thông minh hoặc làm việc cho các nhà tích hợp hệ thống (System Integrator).',
        skillsGained: ['Commissioning Projects', 'Smart Factory Architecture', 'Turnkey Solution Delivery'],
        prerequisites: ['Tốt nghiệp loại Khá trở lên'],
        costEstimate: 'Lương khởi điểm 14 - 20 triệu VNĐ/tháng + thưởng hiệu suất sản xuất',
        proTips: 'Làm việc 2 năm ở công ty System Integrator (SI) sẽ giúp bạn va chạm hàng chục nhà máy khác nhau, học nhanh gấp 3 lần so với chỉ ở một nhà máy.'
      }
    ]
  },

  // 5. Chuyên viên Điều phối Chuỗi Cung ứng & Khai báo hải quan
  'occ-logistics-coordinator': {
    occupationId: 'occ-logistics-coordinator',
    occupationTitle: 'Chuyên viên Điều phối Chuỗi Cung ứng & Khai báo hải quan',
    sector: 'Thương mại & Dịch vụ Vận tải',
    overview: 'Lộ trình từ nghiệp vụ ngoại thương, chứng chỉ khai thuê hải quan quốc gia đến chứng chỉ quản trị chuỗi cung ứng APICS toàn cầu.',
    estimatedTotalMonths: 36,
    recommendedMajors: ['Logistics và Chuỗi Cung ứng', 'Kinh tế đối ngoại', 'Kinh doanh Quốc tế'],
    targetCompaniesInVN: ['Maersk Vietnam', 'DHL Global Forwarding', 'Shopee / SPX Express', 'Viettel Post', 'Tân Cảng Sài Gòn (SNP)'],
    milestones: [
      {
        id: 'log-m1',
        title: 'Khóa học: Vận tải đa phương thức, Incoterms 2020 & Chứng từ Ngoại thương',
        type: 'course',
        stage: 'stage-1-foundation',
        stageLabel: 'Năm 1 - 2 (Nền tảng Ngoại thương & Luật)',
        durationText: '10 tuần',
        provider: 'ĐH Ngoại Thương / ĐH Kinh Tế Quốc Dân / VLA Training Institute',
        summary: 'Nắm vững 11 điều kiện Incoterms 2020, quy trình luân chuyển vận đơn đường biển (Bill of Lading - B/L), hóa đơn thương mại, Packing List và phương thức thanh toán L/C.',
        skillsGained: ['Incoterms 2020 Rules', 'Shipping Documentation (B/L, Invoice, C/O)', 'L/C & Payment Terms', 'FCL/LCL Operations'],
        prerequisites: ['Nhập môn Kinh tế học'],
        costEstimate: 'Học phí học phần chính quy',
        proTips: 'Đừng chỉ học thuộc tên viết tắt Incoterms: hãy hiểu rõ điểm chuyển giao rủi ro và điểm phân chia chi phí của từng điều kiện (FOB, CIF, DDP).'
      },
      {
        id: 'log-m2',
        title: 'Chứng chỉ Quốc gia: Nghiệp vụ Khai thuê hải quan & Hệ thống VNACCS/VCIS',
        type: 'certification',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Chứng chỉ hành nghề hải quan)',
        durationText: '12 tuần (Đào tạo & Thi sát hạch)',
        provider: 'Tổng cục Hải quan Việt Nam / Hiệp hội Logistics Việt Nam (VLA)',
        summary: 'Học và thi sát hạch chứng chỉ hành nghề: Tra cứu phân loại mã HS Code 8 số, tính thuế xuất nhập khẩu, quy tắc xuất xứ hàng hóa (C/O form D, E, EUR.1) và vận hành phần mềm VNACCS/VCIS.',
        skillsGained: ['VNACCS/VCIS System', 'HS Code Classification', 'Rules of Origin (C/O)', 'Customs Clearance Procedures'],
        prerequisites: ['Kiến thức chứng từ ngoại thương'],
        costEstimate: 'Khoảng 3.000.000 - 5.000.000 VNĐ',
        proTips: 'Người phân loại chuẩn mã HS Code sẽ giúp doanh nghiệp tiết kiệm hàng tỷ tiền thuế tránh bị hải quan phạt sau thông quan – đây là năng lực đắt giá nhất.'
      },
      {
        id: 'log-m3',
        title: 'Khóa ứng dụng: Phân tích Dữ liệu Chuỗi Cung ứng với Excel Nâng cao & PowerBI',
        type: 'course',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Dữ liệu trong Logistics)',
        durationText: '8 tuần',
        provider: 'Coursera (Supply Chain Analytics - Rutgers University) / VLA',
        summary: 'Xây dựng dashboard theo dõi KPI giao hàng đúng hạn (OTIF), phân tích tồn kho theo mô hình ABC/XYZ, tính điểm đặt hàng lại (ROP) và tối ưu chi phí lưu kho 3PL.',
        skillsGained: ['PowerBI Dashboarding', 'Inventory Forecasting (EOQ / Safety Stock)', 'Fleet Route Optimization', 'Logistics KPI Tracking'],
        prerequisites: ['Excel căn bản'],
        costEstimate: 'Miễn phí audit trên Coursera',
        proTips: 'Khi đi phỏng vấn TMĐT (Shopee, Lazada, Tiki), một ứng viên biết dựng dashboard PowerBI trực quan sẽ được ưu tiên hơn ứng viên chỉ biết làm giấy tờ.'
      },
      {
        id: 'log-m4',
        title: 'Dự án Tối ưu Mạng lưới Phân phối Kho Bãi E-Commerce (Omnichannel Logistics)',
        type: 'project',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 3 (Dự án Thực tế)',
        durationText: '6 tuần',
        provider: 'Cuộc thi Vietnam Young Logistics Talents (VYLT) / Đề án Khoa',
        summary: 'Giải bài toán giao hàng chặng cuối (Last-mile delivery) cho Hà Nội / TP.HCM: Quy hoạch trạm trung chuyển mini-hub, cắt giảm 15% thời gian giao hàng và giảm phát thải carbon.',
        skillsGained: ['Route Planning', 'Cost-Benefit Analysis', 'Green Logistics Principles', 'Pitching & Presentation'],
        prerequisites: ['Khóa Phân tích Dữ liệu'],
        costEstimate: 'Miễn phí tham dự cho sinh viên',
        proTips: 'Đưa các giải pháp giao hàng bằng xe điện và bao bì tái chế vào bài thi; xu hướng ESG đang là tiêu chí hàng đầu của các tập đoàn quốc gia.'
      },
      {
        id: 'log-m5',
        title: 'Thực tập Doanh nghiệp: Chuyên viên Khai báo hải quan / Freight Forwarder Intern',
        type: 'internship',
        stage: 'stage-3-internship',
        stageLabel: 'Năm 3 - 4 (Thực tập Cảng & Kho)',
        durationText: '4 - 6 tháng',
        provider: 'Maersk Logistics Vietnam / DHL Supply Chain / Tân Cảng Sài Gòn (SNP)',
        summary: 'Trực tiếp ra hiện trường cảng Cát Lái / Hải Phòng mở tờ khai hải quan, làm việc cùng công chức hải quan kiểm hóa thực tế; điều phối xe container.',
        skillsGained: ['On-site Port Operations', 'Crisis Management (Chậm chuyến, Hàng hư hỏng)', 'Bilingual Client Communication'],
        prerequisites: ['Có chứng chỉ khai hải quan hoặc vượt qua bài test ngoại thương'],
        costEstimate: 'Hưởng trợ cấp 5 - 9 triệu/tháng + phụ cấp hiện trường',
        proTips: 'Học cách giao tiếp khéo léo với các anh chị hải quan và tài xế xe tải; kỹ năng mềm giải quyết tình huống hiện trường quyết định 80% sự trôi chảy của chuyến hàng.'
      },
      {
        id: 'log-m6',
        title: 'Chứng chỉ APICS CSCP & Gia nhập Chính thức Chuyên viên Chuỗi Cung ứng',
        type: 'certification',
        stage: 'stage-4-career',
        stageLabel: 'Năm 4 & Sau tốt nghiệp (Chuẩn Quốc tế Hàng đầu)',
        durationText: '3 - 6 tháng luyện thi',
        provider: 'Association for Supply Chain Management (ASCM / APICS USA)',
        summary: 'Chứng chỉ danh giá nhất trong ngành chuỗi cung ứng toàn cầu, mở đường thăng tiến Supply Chain Manager hoặc Regional Operations Lead.',
        skillsGained: ['End-to-End Supply Chain Strategy', 'Global Sourcing & Procurement', 'Risk Management'],
        prerequisites: ['Tốt nghiệp ĐH và 1 năm kinh nghiệm làm việc'],
        costEstimate: 'Thường được các tập đoàn đa quốc gia tài trợ 100% học phí',
        proTips: 'Lương khởi điểm đạt 12 - 18 triệu; khi có thêm chứng chỉ APICS CSCP sau 2 năm, thu nhập thường vượt mốc 30 - 45 triệu/tháng.'
      }
    ]
  },

  // 6. Kỹ sư Thiết bị Y tế & Tin sinh học (Biomedical & Bioinformatics Specialist)
  'occ-biotech-engineer': {
    occupationId: 'occ-biotech-engineer',
    occupationTitle: 'Kỹ sư Thiết bị Y tế & Tin sinh học (Biomedical & Bioinformatics)',
    sector: 'Công nghệ Y tế & Chăm sóc Sức khỏe',
    overview: 'Lộ trình giao thoa giữa Y học lâm sàng, Kỹ thuật cảm biến y sinh, Phân tích dữ liệu ảnh y tế DICOM và Chuẩn quốc tế trang thiết bị y tế ISO 13485.',
    estimatedTotalMonths: 48,
    recommendedMajors: ['Kỹ thuật Y sinh & Thiết bị Y tế', 'Công nghệ Sinh học', 'Khoa học Dữ liệu Y tế'],
    targetCompaniesInVN: ['GE HealthCare Vietnam', 'Siemens Healthineers', 'Philips Healthcare', 'Bệnh viện Đa khoa Tâm Anh / Vinmec', 'VinBrain'],
    milestones: [
      {
        id: 'bio-m1',
        title: 'Khóa học: Sinh lý học giải phẫu & Xử lý Tín hiệu Sinh học (Biomedical Signals)',
        type: 'course',
        stage: 'stage-1-foundation',
        stageLabel: 'Năm 1 - 2 (Nền tảng Y sinh)',
        durationText: '12 tuần',
        provider: 'ĐH Y Dược / ĐH Quốc tế ĐHQG TP.HCM / Johns Hopkins University (Coursera)',
        summary: 'Hiểu các tín hiệu điện sinh học tim (ECG), não (EEG), cơ (EMG); thiết kế mạch khuếch đại vi sai điện tim và lọc nhiễu 50Hz.',
        skillsGained: ['ECG/EEG Signal Processing', 'Differential Amplifiers', 'Biological Transducers', 'LabVIEW / MATLAB'],
        prerequisites: ['Sinh học đại cương', 'Vật lý điện tử'],
        costEstimate: 'Học phí học phần chính quy',
        proTips: 'Nhiễu tiếp xúc da và nhiễu lưới điện 50Hz là kẻ thù số 1 của thiết bị y tế: hãy nắm chắc cách thiết kế mạch lọc Notch Filter để tín hiệu chuẩn xác.'
      },
      {
        id: 'bio-m2',
        title: 'Chứng chỉ: Quản lý Chất lượng & Tiêu chuẩn An toàn Thiết bị Y tế ISO 13485 / IEC 60601',
        type: 'certification',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Chứng chỉ chuẩn bắt buộc)',
        durationText: '8 tuần',
        provider: 'TÜV SÜD / BSI Vietnam / Trung tâm Kỹ thuật Y sinh',
        summary: 'Nắm vững tiêu chuẩn quản lý chất lượng trang thiết bị y tế ISO 13485:2016, tiêu chuẩn an toàn điện y tế IEC 60601 và quy trình cấp phép lưu hành thiết bị của Bộ Y tế.',
        skillsGained: ['ISO 13485 Compliance', 'Medical Device Risk Management (ISO 14971)', 'IEC 60601 Electrical Safety', 'MOH Licensing Dossier'],
        prerequisites: ['Nhập môn Thiết bị Y tế'],
        costEstimate: 'Khoảng 2.000.000 - 3.500.000 VNĐ',
        proTips: 'Mọi hãng thiết bị y tế nước ngoài (GE, Siemens, Philips) đều kiểm tra ISO 13485 trước khi cho phép kỹ sư bước chân vào bệnh viện.'
      },
      {
        id: 'bio-m3',
        title: 'Khóa chuyên sâu: Xử lý Ảnh Y tế DICOM & Trí tuệ nhân tạo trong Chẩn đoán',
        type: 'course',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (AI & Xử lý Ảnh Y tế)',
        durationText: '10 tuần',
        provider: 'DeepLearning.AI (AI for Medicine) / VinBrain AI Academy',
        summary: 'Đọc hiểu định dạng ảnh y tế chuẩn DICOM (CT scanner, MRI, X-quang); xây dựng mô hình phân vùng phổi (Segmentation) và phát hiện tổn thương khối u bằng U-Net / 3D CNN.',
        skillsGained: ['DICOM Processing (Pydicom, SimpleITK)', 'Medical Image Segmentation (U-Net)', 'Clinical Metric Evaluation (Dice Score, IoU)'],
        prerequisites: ['Python & Deep Learning căn bản'],
        costEstimate: 'Miễn phí tài liệu / Khóa học online',
        proTips: 'Độ nhạy (Sensitivity) và độ đặc hiệu (Specificity) quan trọng hơn độ chính xác tổng thể (Accuracy) khi xử lý bài toán y tế: đừng bao giờ bỏ qua hiện tượng mất cân bằng lớp.'
      },
      {
        id: 'bio-m4',
        title: 'Dự án Chế tạo: Thiết bị Đo Nồng độ Oxy Máu (SpO2) & Điện tim Không dây Truyền Dữ liệu Cloud',
        type: 'project',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 3 (Dự án Phần cứng Y tế Thông minh)',
        durationText: '8 tuần',
        provider: 'Lab Nghiên cứu Kỹ thuật Y sinh',
        summary: 'Chế tạo thiết bị theo dõi từ xa đeo tay: Cảm biến quang học MAX30102, vi điều khiển ESP32 BLE, truyền dữ liệu lên dashboard theo dõi nhịp tim bất thường.',
        skillsGained: ['Biomedical Sensor Integration', 'BLE Wireless Communication', 'Mobile Health App Development', 'Electromagnetic Shielding'],
        prerequisites: ['Mạch điện tử và vi điều khiển'],
        costEstimate: 'Lab trường tài trợ bo mạch',
        proTips: 'Chuẩn bị một video ghi lại quá trình thử nghiệm thiết bị trên người thật và đối chiếu kết quả với máy đo chuẩn y tế bệnh viện để chứng minh độ tin cậy khi đi phỏng vấn.'
      },
      {
        id: 'bio-m5',
        title: 'Thực tập: Kỹ sư Ứng dụng & Dịch vụ Thiết bị Y tế (Field Service Intern) tại bệnh viện',
        type: 'internship',
        stage: 'stage-3-internship',
        stageLabel: 'Năm 3 - 4 (Thực tập Hiện trường Bệnh viện)',
        durationText: '5 - 6 tháng',
        provider: 'GE HealthCare Vietnam / Siemens Healthineers / Bệnh viện Đa khoa Tâm Anh',
        summary: 'Đồng hành cùng các chuyên gia đến phòng mổ, khoa chẩn đoán hình ảnh: Kiểm tra máy chụp cộng hưởng từ MRI, hiệu chuẩn máy thở ICU và bàn giao công nghệ cho bác sĩ.',
        skillsGained: ['Clinical Equipment Troubleshooting', 'Hospital Sterile Protocols', 'Customer Relation with Doctors', 'Preventive Maintenance'],
        prerequisites: ['Chứng chỉ an toàn y tế ISO 13485'],
        costEstimate: 'Trợ cấp thực tập 8 - 14 triệu/tháng + công tác phí',
        proTips: 'Tác phong chuẩn chỉnh và tuân thủ tuyệt đối quy định vô trùng trong bệnh viện; sự bình tĩnh xử lý khi bác sĩ yêu cầu khắc phục máy thở trong 10 phút sẽ ghi điểm tuyệt đối.'
      },
      {
        id: 'bio-m6',
        title: 'Tốt nghiệp & Nhận Việc Kỹ sư Ứng dụng Lâm sàng (Clinical Application Specialist)',
        type: 'competition',
        stage: 'stage-4-career',
        stageLabel: 'Năm 4.5 & Sự nghiệp Y tế',
        durationText: '6 tháng',
        provider: 'Tập đoàn Thiết bị Y tế',
        summary: 'Trở thành cầu nối giữa công nghệ và y học: tham gia đấu thầu, đào tạo nhân viên y tế vận hành máy triệu USD.',
        skillsGained: ['Clinical Workflow Optimization', 'High-end Modality Calibration', 'Medical Technology Training'],
        prerequisites: ['Tốt nghiệp ngành Y sinh và tiếng Anh chuyên ngành y tế'],
        costEstimate: 'Lương khởi điểm 15 - 22 triệu VNĐ/tháng + chế độ bảo hiểm quốc tế cao cấp',
        proTips: 'Kỹ sư thiết bị y tế có tính ổn định cực cao và không lo bị sa thải vì nhu cầu khám chữa bệnh của người dân luôn gia tăng bất chấp chu kỳ kinh tế.'
      }
    ]
  },

  // 7. Kỹ sư Năng lượng Tái tạo & Lưới điện Thông minh (Smart Grid & Green Energy)
  'occ-green-energy-engineer': {
    occupationId: 'occ-green-energy-engineer',
    occupationTitle: 'Kỹ sư Năng lượng Tái tạo & Lưới điện Thông minh',
    sector: 'Năng lượng Xanh & Môi trường',
    overview: 'Lộ trình từ tính toán, thiết kế điện mặt trời PVsyst, mô phỏng lưới điện ETAP đến tích hợp hệ thống lưu trữ pin BESS và Net Zero.',
    estimatedTotalMonths: 42,
    recommendedMajors: ['Kỹ thuật Năng lượng Tái tạo & Lưới điện Thông minh', 'Kỹ thuật Điện', 'Hệ thống điện'],
    targetCompaniesInVN: ['EVN / Trung tâm Điều độ Quốc gia', 'Trung Nam Group', 'Schneider Electric Vietnam', 'T&T Green Energy', 'Mainstream Renewable Power'],
    milestones: [
      {
        id: 'grn-m1',
        title: 'Khóa học: Lý thuyết Hệ thống điện, Máy điện & Năng lượng Mặt trời - Gió',
        type: 'course',
        stage: 'stage-1-foundation',
        stageLabel: 'Năm 1 - 2 (Cơ sở Năng lượng & Điện toán)',
        durationText: '12 tuần',
        provider: 'ĐH Bách Khoa / TU Delft (Coursera Solar Energy Basics)',
        summary: 'Hiểu nguyên lý hiệu ứng quang điện (PV cell), đặc tuyến I-V, công suất gió theo định luật Betz, máy biến áp và tính toán tổn thất dòng công suất.',
        skillsGained: ['I-V Curves & MPPT Algorithms', 'Transformer Calculations', 'Wind Turbine Aerodynamics', 'Power Flow Analysis'],
        prerequisites: ['Vật lý đại cương', 'Kỹ thuật mạch'],
        costEstimate: 'Học phí học phần chính quy',
        proTips: 'Nắm chắc thuật toán theo dõi điểm công suất cực đại (MPPT - Perturb and Observe) để giải thích cơ chế biến tần inverter tối ưu khi trời mây che.'
      },
      {
        id: 'grn-m2',
        title: 'Chứng chỉ Thiết kế Chuyên ngành: PVsyst & AutoCAD Electrical cho Điện Mặt Trời Mái Nhà',
        type: 'certification',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Chứng chỉ Thiết kế Chuyên ngành)',
        durationText: '8 tuần',
        provider: 'Viện Năng lượng / Trung tâm Năng lượng Tái tạo Việt - Đức (GIZ)',
        summary: 'Sử dụng phần mềm tiêu chuẩn số 1 thế giới PVsyst: Đồng bộ dữ liệu vệ tinh Meteonorm, thiết kế chuỗi pin mặt trời (string sizing), góc nghiêng và tính toán sản lượng điện P50/P90.',
        skillsGained: ['PVsyst Simulation', 'P50/P90 Yield Reports', 'Loss Diagram Analysis', 'AutoCAD Electrical Single-Line Diagrams'],
        prerequisites: ['Nắm vững nguyên lý điện mặt trời'],
        costEstimate: 'Khoảng 2.500.000 VNĐ (Có hỗ trợ học bổng từ quỹ GIZ/VASI)',
        proTips: 'Các chứng chỉ kỹ sư điện rất coi trọng khả năng phân tích biểu đồ suy hao (Loss Diagram) trong PVsyst khi đi xin việc.'
      },
      {
        id: 'grn-m3',
        title: 'Khóa học chuyên sâu: Mô phỏng Lưới điện & Lưới điện Thông minh bằng phần mềm ETAP',
        type: 'course',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Phân tích Lưới Cao cấp)',
        durationText: '10 tuần',
        provider: 'ETAP University Program / Schneider Electric Energy University',
        summary: 'Mô phỏng mạng tích hợp nguồn năng lượng tái tạo vào lưới 22kV / 110kV: Tính toán ngắn mạch, sụt áp, độ ổn định tần số khi mất nguồn gió và điều phối công suất phản kháng.',
        skillsGained: ['ETAP Power System Software', 'Short-Circuit & Relay Coordination', 'Harmonic Analysis', 'Frequency Stability Control'],
        prerequisites: ['Mạch điện nâng cao'],
        costEstimate: 'Phần mềm bản quyền Lab trường',
        proTips: 'Khi tỷ lệ năng lượng tái tạo vượt quá 30% lưới điện, hiện tượng quá áp và dao động tần số là cơn đau đầu của EVN; người biết chạy ETAP để đề xuất giải pháp luôn được tuyển thẳng.'
      },
      {
        id: 'grn-m4',
        title: 'Đề tài Nghiên cứu: Thiết kế Hệ thống Microgrid Tích hợp Pin Lưu trữ Năng lượng BESS cho KCN',
        type: 'project',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 3 (Dự án Năng lượng Net Zero)',
        durationText: '8 tuần',
        provider: 'Lab Lưới điện Thông minh & Doanh nghiệp tài trợ',
        summary: 'Thiết kế trọn gói nguồn năng lượng tự tiêu thụ cho khu công nghiệp: 2MWp điện mặt trời kết hợp hệ thống pin lưu trữ lithium BESS 1MWh; thuật toán nạp xả pin giờ cao điểm để tiết kiệm tiền điện theo biểu giá TOU.',
        skillsGained: ['Battery Energy Storage Systems (BESS)', 'Peak Shaving Strategies', 'Carbon Footprint Calculation', 'Economic Feasibility (IRR/NPV)'],
        prerequisites: ['PVsyst và ETAP'],
        costEstimate: 'Lab trường hỗ trợ kinh phí',
        proTips: 'Hãy tính thêm chỉ số tài chính (IRR, NPV, LCOE) vào đề tài kỹ thuật; các chủ doanh nghiệp sản xuất FDI cực kỳ quan tâm bài toán tài chính hoàn vốn.'
      },
      {
        id: 'grn-m5',
        title: 'Thực tập Hiện trường: Kỹ sư Năng lượng Tái tạo (Project Engineer Intern)',
        type: 'internship',
        stage: 'stage-3-internship',
        stageLabel: 'Năm 3 - 4 (Thực tập Thực địa Trang trại Điện)',
        durationText: '5 - 6 tháng',
        provider: 'Trung Nam Group / T&T Energy / Schneider Electric / Siemens Energy VN',
        summary: 'Tham gia giám sát thi công trang trại điện gió ngoài khơi Ninh Thuận hoặc điện mặt trời áp mái 5MWp tại các KCN Bình Dương; nghiệm thu trạm biến áp trung/cao thế.',
        skillsGained: ['Site Supervision & HSE Standards', 'Grid Code Testing & Commissioning', 'Inverter Firmware Upgrades', 'High-voltage Safety Protocols'],
        prerequisites: ['Chứng chỉ an toàn cao thế và sức khỏe tốt'],
        costEstimate: 'Trợ cấp 7 - 12 triệu/tháng + bao ăn ở công trình',
        proTips: 'Làm quen với các quy định an toàn lao động (HSE) và quy chuẩn đấu nối của EVN; người vừa vững kỹ thuật vừa chịu khó ra hiện trường sẽ thăng tiến rất nhanh.'
      },
      {
        id: 'grn-m6',
        title: 'Bảo vệ Đồ án & Nhận Việc Kỹ sư Năng lượng Xanh Chính thức',
        type: 'competition',
        stage: 'stage-4-career',
        stageLabel: 'Năm 4 & Khởi đầu Sự nghiệp Bền vững',
        durationText: '6 tháng',
        provider: 'Tập đoàn năng lượng & Chủ đầu tư FDI',
        summary: 'Chính thức trở thành kỹ sư vận hành trạm biến áp, tư vấn giải pháp chuyển dịch năng lượng Net Zero cho các nhà máy xuất khẩu toàn cầu.',
        skillsGained: ['SCADA EMS Operation', 'DPPA Mechanism Execution', 'Green Hydrogen Integration'],
        prerequisites: ['Tốt nghiệp chuyên ngành loại Khá/Giỏi'],
        costEstimate: 'Lương khởi điểm 15 - 22 triệu VNĐ/tháng + thưởng theo tiến độ dự án',
        proTips: 'Việt Nam đang là điểm nóng chuyển dịch năng lượng của Đông Nam Á với hàng tỷ USD cam kết từ quỹ JETP; cơ hội nghề nghiệp trong lĩnh vực này rộng mở ít nhất 30 năm tới.'
      }
    ]
  }
};

// Helper: Get timeline for any occupation id with fallback generator
export const getOccupationTimeline = (occupationId: string): OccupationTimeline => {
  if (OCCUPATION_TIMELINES[occupationId]) {
    return OCCUPATION_TIMELINES[occupationId];
  }

  // Fallback dynamic sequence for custom or unspecified occupations
  return {
    occupationId,
    occupationTitle: 'Lộ trình Nghề Nghiệp Tiêu Chuẩn',
    sector: 'Kỹ thuật & Công nghệ',
    overview: 'Lộ trình các mốc chuẩn tích lũy học phần, chứng chỉ và kinh nghiệm tại doanh nghiệp.',
    estimatedTotalMonths: 42,
    recommendedMajors: ['Kỹ thuật & Công nghệ', 'Kinh tế & Quản lý'],
    targetCompaniesInVN: ['Tập đoàn Viettel', 'FPT Corporation', 'Samsung Vietnam', 'VinGroup'],
    milestones: [
      {
        id: `${occupationId}-m1`,
        title: 'Khóa học Nền tảng & Công cụ Căn bản',
        type: 'course',
        stage: 'stage-1-foundation',
        stageLabel: 'Năm 1 - 2 (Nền tảng & Khởi đầu)',
        durationText: '10 - 12 tuần',
        provider: 'Đại học trọng điểm & Nền tảng EdTech uy tín (Coursera / edX)',
        summary: 'Xây dựng tư duy logic, toán ứng dụng, ngoại ngữ chuyên ngành và công cụ lập trình/phần mềm cốt lõi.',
        skillsGained: ['Tư duy kỹ thuật', 'Ngoại ngữ chuyên ngành', 'Phần mềm căn bản'],
        prerequisites: ['Kiến thức phổ thông vững chắc'],
        costEstimate: 'Học phí đại học chính quy',
        proTips: 'Tập trung xây dựng thói quen đọc tài liệu kỹ thuật bằng tiếng Anh ngay từ năm nhất.'
      },
      {
        id: `${occupationId}-m2`,
        title: 'Chứng chỉ Chuyên môn Quốc tế & Kỹ năng Đặc thù',
        type: 'certification',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 2 - 3 (Tăng tốc & Chứng chỉ)',
        durationText: '8 - 10 tuần',
        provider: 'Tổ chức cấp chứng chỉ chuyên nghiệp toàn cầu',
        summary: 'Tham gia các khóa đào tạo chuyên sâu và thi chứng chỉ được nhà tuyển dụng hàng đầu công nhận.',
        skillsGained: ['Kỹ năng chuyên sâu', 'Chuẩn quy trình quốc tế', 'Giải quyết sự cố'],
        prerequisites: ['Kiến thức nền tảng hoàn thành'],
        costEstimate: 'Chính sách hỗ trợ sinh viên',
        proTips: 'Chọn chứng chỉ được nêu tên trực tiếp trong các tin tuyển dụng của công ty mục tiêu.'
      },
      {
        id: `${occupationId}-m3`,
        title: 'Dự án Thực chiến & Sản phẩm Portfolio Cá nhân',
        type: 'project',
        stage: 'stage-2-specialization',
        stageLabel: 'Năm 3 (Sản phẩm Thực tế)',
        durationText: '8 tuần',
        provider: 'Phòng Lab trường & Cuộc thi sáng tạo',
        summary: 'Tự tay giải quyết bài toán thực tế và đóng gói thành sản phẩm có giao diện trực quan cho nhà tuyển dụng xem xét.',
        skillsGained: ['Xây dựng sản phẩm', 'Làm việc nhóm', 'Thuyết trình kỹ thuật'],
        prerequisites: ['Kiến thức chuyên môn năm 2-3'],
        costEstimate: 'Kinh phí lab trường tài trợ',
        proTips: 'Đăng tải mã nguồn mở hoặc làm video demo ngắn 2 phút để gây ấn tượng.'
      },
      {
        id: `${occupationId}-m4`,
        title: 'Kỳ Thực tập Doanh nghiệp (Paid Internship)',
        type: 'internship',
        stage: 'stage-3-internship',
        stageLabel: 'Năm 3 - 4 (Thực tập Thực chiến)',
        durationText: '4 - 6 tháng',
        provider: 'Công ty hàng đầu trong ngành',
        summary: 'Trải nghiệm văn hóa doanh nghiệp, tham gia trực tiếp vào dự án thương mại thật và mở rộng mạng lưới quan hệ.',
        skillsGained: ['Kinh nghiệm sản xuất/kinh doanh', 'Giao tiếp chuyên nghiệp', 'Xử lý khủng hoảng'],
        prerequisites: ['Portfolio cá nhân & Vượt qua phỏng vấn'],
        costEstimate: 'Được trả lương hàng tháng',
        proTips: 'Chủ động học hỏi và tìm hiểu quy trình phối hợp giữa các phòng ban.'
      },
      {
        id: `${occupationId}-m5`,
        title: 'Tốt nghiệp & Nhận Việc Làm Chính thức (Junior Specialist)',
        type: 'competition',
        stage: 'stage-4-career',
        stageLabel: 'Năm 4 & Khởi đầu Sự nghiệp',
        durationText: '6 tháng',
        provider: 'Doanh nghiệp tuyển dụng trực tiếp',
        summary: 'Chính thức gia nhập thị trường lao động với hành trang bằng cấp, chứng chỉ và kinh nghiệm thực chiến.',
        skillsGained: ['Năng lực thực chiến', 'Quản lý dự án', 'Định hướng thăng tiến'],
        prerequisites: ['Bằng tốt nghiệp đại học/cao đẳng chính quy'],
        costEstimate: 'Mức lương khởi điểm cạnh tranh theo mặt bằng thị trường',
        proTips: 'Mục tiêu là tích lũy giá trị trong 2 năm đầu tiên thay vì so sánh mức lương chênh lệch nhỏ.'
      }
    ]
  };
};
