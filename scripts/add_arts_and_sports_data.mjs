import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  path.resolve('d:/seed_data.json'),
  path.resolve('d:/src/data/seed_data.json')
];

const newMajors = [
  {
    codeTT09: "7580101",
    codeTT74: "758010",
    name: "Kiến trúc",
    sector: "KIEN_TRUC_NGHE_THUAT_TDTT",
    admissionsCombos: ["V00", "V01", "H00", "A00"],
    targetJobs: ["Kiến trúc sư công trình", "Chuyên viên thiết kế kiến trúc cảnh quan", "Kiến trúc sư quy hoạch đô thị"]
  },
  {
    codeTT09: "7210404",
    codeTT74: "721040",
    name: "Thiết kế thời trang",
    sector: "KIEN_TRUC_NGHE_THUAT_TDTT",
    admissionsCombos: ["H00", "H01", "V00", "D01"],
    targetJobs: ["Nhà thiết kế thời trang", "Stylist thời trang", "Chuyên viên phát triển sản phẩm may mặc"]
  },
  {
    codeTT09: "7210205",
    codeTT74: "721020",
    name: "Thanh nhạc",
    sector: "KIEN_TRUC_NGHE_THUAT_TDTT",
    admissionsCombos: ["N00", "N01"],
    targetJobs: ["Ca sĩ biểu diễn chuyên nghiệp", "Giảng viên thanh nhạc", "Biên tập viên âm nhạc"]
  },
  {
    codeTT09: "7140220",
    codeTT74: "714022",
    name: "Sư phạm Giáo dục Thể chất",
    sector: "SU_PHAM_GIAO_DUC",
    admissionsCombos: ["T00", "T01"],
    targetJobs: ["Giáo viên giáo dục thể chất", "Huấn luyện viên thể dục thể thao", "Chuyên viên quản lý phong trào thể thao"]
  },
  {
    codeTT09: "7810301",
    codeTT74: "781030",
    name: "Quản lý Thể dục Thể thao",
    sector: "KIEN_TRUC_NGHE_THUAT_TDTT",
    admissionsCombos: ["T00", "T01", "A01", "D01"],
    targetJobs: ["Chuyên viên quản lý câu lạc bộ thể thao", "Chuyên viên tổ chức sự kiện thể thao", "Quản lý trung tâm thể hình / fitness"]
  },
  {
    codeTT09: "7140201",
    codeTT74: "714020",
    name: "Giáo dục Mầm non",
    sector: "SU_PHAM_GIAO_DUC",
    admissionsCombos: ["M00", "M01"],
    targetJobs: ["Giáo viên mầm non", "Hiệu trưởng trường mầm non tư thục", "Chuyên viên can thiệp sớm và phát triển trẻ em"]
  },
  {
    codeTT09: "7210208",
    codeTT74: "721028",
    name: "Diễn viên sân khấu - điện ảnh",
    sector: "KIEN_TRUC_NGHE_THUAT_TDTT",
    admissionsCombos: ["S00", "R00"],
    targetJobs: ["Diễn viên điện ảnh - truyền hình", "Diễn viên kịch nói", "Người dẫn chương trình (MC) / Diễn giả"]
  }
];

const newAnchorInstitutions = [
  {
    code: "KTA",
    name: "Trường Đại học Kiến trúc Hà Nội",
    city: "Hà Nội",
    region: "BAC",
    tuitionRangeMln: [20, 26],
    avgTuitionMln: 22.0,
    acceptedCombos: ["V00", "V01", "H00", "A00"],
    topMajors: ["Kiến trúc", "Thiết kế đồ họa", "Thiết kế nội thất"],
    benchmarks: {
      "2024": 24.2,
      "2025": 24.8,
      "2026_est": 25.0
    }
  },
  {
    code: "KTS",
    name: "Trường Đại học Kiến trúc TP.HCM",
    city: "TP.HCM",
    region: "NAM",
    tuitionRangeMln: [24, 32],
    avgTuitionMln: 28.0,
    acceptedCombos: ["V00", "V01", "H00", "A00"],
    topMajors: ["Kiến trúc", "Thiết kế đồ họa", "Thiết kế thời trang"],
    benchmarks: {
      "2024": 24.5,
      "2025": 25.2,
      "2026_est": 25.5
    }
  },
  {
    code: "TDH",
    name: "Trường Đại học Sư phạm Thể dục Thể thao Hà Nội",
    city: "Hà Nội",
    region: "BAC",
    tuitionRangeMln: [0, 0],
    avgTuitionMln: 0,
    isFreeTuition: true,
    acceptedCombos: ["T00", "T01"],
    topMajors: ["Sư phạm Giáo dục Thể chất", "Quản lý Thể dục Thể thao"],
    benchmarks: {
      "2024": 20.5,
      "2025": 21.0,
      "2026_est": 21.5
    }
  },
  {
    code: "ANH",
    name: "Học viện Âm nhạc Quốc gia Việt Nam",
    city: "Hà Nội",
    region: "BAC",
    tuitionRangeMln: [16, 22],
    avgTuitionMln: 18.5,
    acceptedCombos: ["N00", "N01"],
    topMajors: ["Thanh nhạc", "Biểu diễn nhạc cụ"],
    benchmarks: {
      "2024": 23.0,
      "2025": 23.5,
      "2026_est": 24.0
    }
  },
  {
    code: "SKD",
    name: "Trường Đại học Sân khấu - Điện ảnh Hà Nội",
    city: "Hà Nội",
    region: "BAC",
    tuitionRangeMln: [17, 23],
    avgTuitionMln: 19.0,
    acceptedCombos: ["S00", "R00", "C00"],
    topMajors: ["Diễn viên sân khấu - điện ảnh", "Đạo diễn điện ảnh", "Truyền thông đa phương tiện"],
    benchmarks: {
      "2024": 22.5,
      "2025": 23.0,
      "2026_est": 23.5
    }
  }
];

const aptitudeDisciplines = {
  myThuatKienTruc: {
    name: "Mỹ thuật, Kiến trúc & Thiết kế",
    subjects: [
      { id: "apt_hinhHoa", name: "Hình họa", desc: "Vẽ họa hình (chân dung, người) bằng chì hoặc than", combos: ["H00", "H01"] },
      { id: "apt_trangTri", name: "Trang trí / Bố cục màu", desc: "Vẽ trang trí, bố cục màu sắc, họa tiết", combos: ["H00", "H02"] },
      { id: "apt_veMyThuat", name: "Vẽ mỹ thuật", desc: "Vẽ đầu tượng hoặc hình họa kiến trúc", combos: ["V00", "V01"] }
    ]
  },
  amNhacNgheThuat: {
    name: "Âm nhạc & Nghệ thuật biểu diễn",
    subjects: [
      { id: "apt_thamAm", name: "Thẩm âm và Tiết tấu", desc: "Kiểm tra nghe, lặp lại cao độ và tiết tấu", combos: ["N00"] },
      { id: "apt_thanhNhac", name: "Thanh nhạc / Biểu diễn", desc: "Hát bài hát sở trường hoặc độc tấu nhạc cụ", combos: ["N00", "N01"] }
    ]
  },
  giaoDucMamNon: {
    name: "Giáo dục Mầm non",
    subjects: [
      { id: "apt_mamNon", name: "Năng khiếu Mầm non", desc: "Đọc diễn cảm, kể chuyện theo tranh, hát tự chọn", combos: ["M00", "M01"] }
    ]
  },
  theDucTheThao: {
    name: "Thể dục Thể thao",
    subjects: [
      { id: "apt_theThao", name: "Năng khiếu Thể thao", desc: "Chạy cự ly ngắn, bật xa tại chỗ, thể hình", combos: ["T00", "T01"] }
    ]
  },
  sanKhauTruyenThong: {
    name: "Sân khấu, Điện ảnh & Truyền thông",
    subjects: [
      { id: "apt_baoChi", name: "Năng khiếu Báo chí", desc: "Viết bài bình luận xã hội hoặc phân tích tác phẩm", combos: ["R00"] },
      { id: "apt_dienXuat", name: "Năng khiếu Diễn xuất", desc: "Tiểu phẩm tình huống, tiếng nói và hình thể sân khấu", combos: ["S00"] }
    ]
  }
};

for (const fp of filesToUpdate) {
  if (!fs.existsSync(fp)) continue;
  const raw = fs.readFileSync(fp, 'utf8');
  const data = JSON.parse(raw);

  // Add new majors if not exist
  const existingCodes = new Set(data.majorCatalogLevelIV.map(m => m.codeTT09));
  for (const m of newMajors) {
    if (!existingCodes.has(m.codeTT09)) {
      data.majorCatalogLevelIV.push(m);
    }
  }

  // Add new institutions
  const existingInstCodes = new Set((data.anchorInstitutions || []).map(i => i.code));
  if (!data.anchorInstitutions) data.anchorInstitutions = [];
  for (const inst of newAnchorInstitutions) {
    if (!existingInstCodes.has(inst.code)) {
      data.anchorInstitutions.push(inst);
    }
  }

  // Add aptitude disciplines
  data.aptitudeDisciplines = aptitudeDisciplines;

  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${fp}: Total majors = ${data.majorCatalogLevelIV.length}, Total anchor schools = ${data.anchorInstitutions.length}`);
}
