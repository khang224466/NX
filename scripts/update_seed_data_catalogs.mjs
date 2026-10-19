import fs from 'fs';
import path from 'path';

const filePaths = [
  path.resolve('src/data/seed_data.json'),
  path.resolve('seed_data.json')
];

const newMajors = [
  {
    codeTT09: "7480101",
    codeTT74: "748010",
    name: "Khoa học máy tính",
    sector: "CNTT_BAN_DAN_AI",
    admissionsCombos: ["A00", "A01"],
    targetJobs: ["Kỹ sư Trí tuệ nhân tạo", "Kỹ sư Dữ liệu", "Kiến trúc sư giải pháp phần mềm"]
  },
  {
    codeTT09: "7480201",
    codeTT74: "748020",
    name: "Công nghệ thông tin",
    sector: "CNTT_BAN_DAN_AI",
    admissionsCombos: ["A00", "A01", "D01", "D07"],
    targetJobs: ["Kỹ sư Phát triển Phần mềm", "Chuyên viên Quản trị Mạng", "Kỹ sư DevOps / Cloud"]
  },
  {
    codeTT09: "7520208",
    codeTT74: "752024",
    name: "Kỹ thuật vi mạch bán dẫn",
    sector: "CNTT_BAN_DAN_AI",
    admissionsCombos: ["A00", "A01"],
    targetJobs: ["Kỹ sư Thiết kế Vi mạch", "Kỹ sư Kiểm thử Vi mạch", "Kỹ sư Đóng gói Bán dẫn"]
  },
  {
    codeTT09: "7520216",
    codeTT74: "752021",
    name: "Kỹ thuật điều khiển và tự động hóa",
    sector: "KY_THUAT_CONG_NGHE",
    admissionsCombos: ["A00", "A01"],
    targetJobs: ["Kỹ sư Tự động hóa", "Kỹ sư Robot & IoT", "Kỹ sư Lập trình PLC"]
  },
  {
    codeTT09: "7720101",
    codeTT74: "772010",
    name: "Y khoa",
    sector: "Y_DUOC_SUC_KHOE",
    admissionsCombos: ["B00", "A00"],
    targetJobs: ["Bác sĩ Đa khoa", "Bác sĩ Nội trú", "Bác sĩ Chuyên khoa"]
  },
  {
    codeTT09: "7720201",
    codeTT74: "772020",
    name: "Dược học",
    sector: "Y_DUOC_SUC_KHOE",
    admissionsCombos: ["A00", "B00"],
    targetJobs: ["Dược sĩ Lâm sàng", "Chuyên viên Nghiên cứu Dược phẩm", "Dược sĩ Quản lý Chất lượng"]
  },
  {
    codeTT09: "7720501",
    codeTT74: "772050",
    name: "Răng - Hàm - Mặt",
    sector: "Y_DUOC_SUC_KHOE",
    admissionsCombos: ["B00"],
    targetJobs: ["Bác sĩ Răng Hàm Mặt", "Bác sĩ Chỉnh nha", "Bác sĩ Phẫu thuật Hàm mặt"]
  },
  {
    codeTT09: "7340120",
    codeTT74: "734012",
    name: "Kinh doanh quốc tế",
    sector: "KINH_TE_QUAN_TRI",
    admissionsCombos: ["A00", "A01", "D01", "D07"],
    targetJobs: ["Chuyên viên Thương mại Quốc tế", "Giám đốc Phát triển Thị trường Toàn cầu", "Chuyên viên Xuất nhập khẩu"]
  },
  {
    codeTT09: "7340302",
    codeTT74: "734032",
    name: "Kiểm toán",
    sector: "KINH_TE_QUAN_TRI",
    admissionsCombos: ["A00", "A01", "D01", "D07"],
    targetJobs: ["Kiểm toán viên Độc lập", "Kiểm toán viên Nội bộ", "Chuyên viên Tư vấn Thuế"]
  },
  {
    codeTT09: "7510605",
    codeTT74: "751065",
    name: "Logistics và Quản lý chuỗi cung ứng",
    sector: "KINH_TE_QUAN_TRI",
    admissionsCombos: ["A00", "A01", "D01", "D07"],
    targetJobs: ["Chuyên viên Chuỗi Cung Ứng", "Điều phối viên Vận tải Quốc tế", "Quản lý Kho bãi Thông minh"]
  },
  {
    codeTT09: "7340115",
    codeTT74: "734011",
    name: "Marketing",
    sector: "KINH_TE_QUAN_TRI",
    admissionsCombos: ["A00", "A01", "D01", "D07"],
    targetJobs: ["Chuyên viên Chiến lược Marketing", "Quản lý Thương hiệu", "Digital Marketing Specialist"]
  },
  {
    codeTT09: "7340122",
    codeTT74: "734012",
    name: "Thương mại điện tử",
    sector: "KINH_TE_QUAN_TRI",
    admissionsCombos: ["A00", "A01", "D01"],
    targetJobs: ["Chuyên viên Vận hành Sàn TMĐT", "Quản trị Kinh doanh Số", "Chuyên viên Phân tích Tăng trưởng"]
  },
  {
    codeTT09: "7140209",
    codeTT74: "714020",
    name: "Sư phạm Toán học",
    sector: "SU_PHAM_GIAO_DUC",
    admissionsCombos: ["A00", "A01"],
    targetJobs: ["Giáo viên Toán THPT", "Giảng viên Toán học", "Chuyên viên Nghiên cứu Giáo dục"]
  },
  {
    codeTT09: "7140217",
    codeTT74: "714021",
    name: "Sư phạm Ngữ văn",
    sector: "SU_PHAM_GIAO_DUC",
    admissionsCombos: ["C00", "D14"],
    targetJobs: ["Giáo viên Ngữ văn THPT", "Biên tập viên Giáo dục", "Chuyên viên Truyền thông Giáo dục"]
  },
  {
    codeTT09: "7140218",
    codeTT74: "714021",
    name: "Sư phạm Lịch sử",
    sector: "SU_PHAM_GIAO_DUC",
    admissionsCombos: ["C00", "D14"],
    targetJobs: ["Giáo viên Lịch sử THPT", "Chuyên viên Nghiên cứu Lịch sử", "Biên tập viên Xuất bản Lịch sử"]
  },
  {
    codeTT09: "7140219",
    codeTT74: "714021",
    name: "Sư phạm Địa lý",
    sector: "SU_PHAM_GIAO_DUC",
    admissionsCombos: ["C00", "D15"],
    targetJobs: ["Giáo viên Địa lý THPT", "Chuyên viên Khí tượng - Địa chất", "Quy hoạch Lãnh thổ & Môi trường"]
  },
  {
    codeTT09: "7140231",
    codeTT74: "714023",
    name: "Sư phạm Tiếng Anh",
    sector: "SU_PHAM_GIAO_DUC",
    admissionsCombos: ["D01", "D14"],
    targetJobs: ["Giáo viên Tiếng Anh Trường Quốc Tế / Chuyên", "Chuyên gia Khảo thí Ngôn ngữ", "Giảng viên Ngôn ngữ học Ứng dụng"]
  },
  {
    codeTT09: "7320104",
    codeTT74: "732010",
    name: "Truyền thông đa phương tiện",
    sector: "XA_HOI_NHAN_VAN",
    admissionsCombos: ["D01", "C00", "D14", "A01"],
    targetJobs: ["Chuyên viên Truyền thông Số", "Nhà sản xuất Nội dung Đa phương tiện", "Chuyên viên Kỹ xảo & Hậu kỳ"]
  },
  {
    codeTT09: "7320101",
    codeTT74: "732010",
    name: "Báo chí",
    sector: "XA_HOI_NHAN_VAN",
    admissionsCombos: ["C00", "D01", "D14"],
    targetJobs: ["Nhà báo Đa phương tiện", "Biên tập viên Tòa soạn", "Phóng viên Điều tra / Truyền hình"]
  },
  {
    codeTT09: "7320108",
    codeTT74: "732010",
    name: "Quan hệ công chúng",
    sector: "XA_HOI_NHAN_VAN",
    admissionsCombos: ["D01", "C00", "D14"],
    targetJobs: ["Chuyên viên Quan hệ Công chúng (PR)", "Giám đốc Truyền thông Thương hiệu", "Chuyên viên Quản trị Khủng hoảng"]
  },
  {
    codeTT09: "7220201",
    codeTT74: "722020",
    name: "Ngôn ngữ Anh",
    sector: "XA_HOI_NHAN_VAN",
    admissionsCombos: ["D01", "D14", "A01"],
    targetJobs: ["Biên - Phiên dịch viên Cao cấp", "Chuyên viên Đối ngoại Quốc tế", "Giảng viên Ngôn ngữ & Khảo thí"]
  },
  {
    codeTT09: "7310401",
    codeTT74: "731040",
    name: "Tâm lý học",
    sector: "XA_HOI_NHAN_VAN",
    admissionsCombos: ["C00", "D01", "B00"],
    targetJobs: ["Chuyên viên Tham vấn Tâm lý", "Chuyên gia Nhân sự & Trải nghiệm Nhân viên", "Nhà Tâm lý học Tổ chức"]
  },
  {
    codeTT09: "7210403",
    codeTT74: "721040",
    name: "Thiết kế đồ họa",
    sector: "KIEN_TRUC_NGHE_THUAT_TDTT",
    admissionsCombos: ["H00", "V00", "D01", "C00"],
    targetJobs: ["Chuyên viên Thiết kế Đồ họa (Graphic Designer)", "Giám đốc Nghệ thuật (Art Director)", "UI/UX Designer"]
  },
  {
    codeTT09: "7380101",
    codeTT74: "738010",
    name: "Luật",
    sector: "LUAT_HANH_CHINH",
    admissionsCombos: ["A00", "A01", "C00", "D01"],
    targetJobs: ["Luật sư Tranh tụng", "Pháp chế Doanh nghiệp", "Thư ký Tòa án / Công chứng viên"]
  }
];

const newInstitutions = [
  {
    code: "QHX",
    officialName: "Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQG Hà Nội",
    city: "Hà Nội",
    tuitionRange2026: "15.0 – 30.0 triệu/năm",
    officialWebsite: "https://ussh.vnu.edu.vn/",
    admissionFormulas: ["FML_01"],
    benchmarkSample: [
      {
        majorName: "Truyền thông đa phương tiện",
        majorCodeTT09: "7320104",
        combinations: ["D01", "C00", "D14"],
        scale: 30,
        benchmark2024: 28.50,
        benchmark2025: 28.75,
        benchmark2026: 28.85,
        tuitionYear: "22.0 tr/năm"
      },
      {
        majorName: "Báo chí",
        majorCodeTT09: "7320101",
        combinations: ["C00", "D01", "D14"],
        scale: 30,
        benchmark2024: 28.25,
        benchmark2025: 28.50,
        benchmark2026: 28.60,
        tuitionYear: "18.0 tr/năm"
      },
      {
        majorName: "Quan hệ công chúng",
        majorCodeTT09: "7320108",
        combinations: ["D01", "C00", "D14"],
        scale: 30,
        benchmark2024: 28.75,
        benchmark2025: 29.00,
        benchmark2026: 29.10,
        tuitionYear: "22.0 tr/năm"
      },
      {
        majorName: "Tâm lý học",
        majorCodeTT09: "7310401",
        combinations: ["C00", "D01"],
        scale: 30,
        benchmark2024: 27.50,
        benchmark2025: 27.80,
        benchmark2026: 28.00,
        tuitionYear: "18.0 tr/năm"
      }
    ]
  },
  {
    code: "SPH",
    officialName: "Trường Đại học Sư phạm Hà Nội",
    city: "Hà Nội",
    tuitionRange2026: "0.0 – 0.0 triệu/năm",
    officialWebsite: "https://hnue.edu.vn/",
    admissionFormulas: ["FML_01"],
    benchmarkSample: [
      {
        majorName: "Sư phạm Ngữ văn",
        majorCodeTT09: "7140217",
        combinations: ["C00", "D14"],
        scale: 30,
        benchmark2024: 28.83,
        benchmark2025: 29.10,
        benchmark2026: 29.25,
        tuitionYear: "0.0 tr/năm (Miễn 100% học phí theo NĐ 116)"
      },
      {
        majorName: "Sư phạm Lịch sử",
        majorCodeTT09: "7140218",
        combinations: ["C00", "D14"],
        scale: 30,
        benchmark2024: 28.42,
        benchmark2025: 28.80,
        benchmark2026: 28.95,
        tuitionYear: "0.0 tr/năm (Miễn 100% học phí theo NĐ 116)"
      },
      {
        majorName: "Sư phạm Tiếng Anh",
        majorCodeTT09: "7140231",
        combinations: ["D01", "D14"],
        scale: 30,
        benchmark2024: 28.20,
        benchmark2025: 28.45,
        benchmark2026: 28.55,
        tuitionYear: "0.0 tr/năm (Miễn 100% học phí theo NĐ 116)"
      }
    ]
  },
  {
    code: "MTH",
    officialName: "Trường Đại học Mỹ thuật Công nghiệp",
    city: "Hà Nội",
    tuitionRange2026: "18.5 – 24.0 triệu/năm",
    officialWebsite: "https://mythuatcongnghiep.edu.vn/",
    admissionFormulas: ["FML_01"],
    benchmarkSample: [
      {
        majorName: "Thiết kế đồ họa",
        majorCodeTT09: "7210403",
        combinations: ["H00", "D01", "C00"],
        scale: 30,
        benchmark2024: 24.50,
        benchmark2025: 25.10,
        benchmark2026: 25.40,
        tuitionYear: "21.5 tr/năm"
      }
    ]
  }
];

for (const p of filePaths) {
  const raw = fs.readFileSync(p, 'utf8');
  const data = JSON.parse(raw);

  data.majorCatalogLevelIV = newMajors;

  // Add institutions if not present
  for (const inst of newInstitutions) {
    const existingIdx = data.anchorInstitutions.findIndex(i => i.code === inst.code);
    if (existingIdx >= 0) {
      data.anchorInstitutions[existingIdx] = inst;
    } else {
      data.anchorInstitutions.push(inst);
    }
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${p} successfully. Major count: ${data.majorCatalogLevelIV.length}, Institution count: ${data.anchorInstitutions.length}`);
}
