import admissionsWorkbook from './importedAdmissions2025_2026.json' with { type: 'json' };
import officialInstitutionTuitionFacts from './officialInstitutionTuitionFacts.json' with { type: 'json' };

const supplementalTuitionBySourceId = new Map();
for (const fact of officialInstitutionTuitionFacts.facts || []) {
  const facts = supplementalTuitionBySourceId.get(fact.sourceId) || [];
  facts.push(fact);
  supplementalTuitionBySourceId.set(fact.sourceId, facts);
}

const curatedPoliciesBySourceId = {
  'ĐV-002': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng và ưu tiên xét tuyển',
        description: 'Theo quy chế tuyển sinh của Bộ GD&ĐT và quy định của trường.',
        sourceUrl: 'https://tuyensinh.uet.vnu.edu.vn/wp-content/images/Thong-tin-tuyen-sinh-DHCQ-nam-2026-cap-nhat.pdf'
      },
      {
        name: 'Xét kết quả đánh giá năng lực HSA',
        description: 'Sử dụng kết quả kỳ thi đánh giá năng lực của ĐHQG Hà Nội theo đề án 2026.',
        sourceUrl: 'https://tuyensinh.uet.vnu.edu.vn/wp-content/images/Thong-tin-tuyen-sinh-DHCQ-nam-2026-cap-nhat.pdf'
      },
      {
        name: 'Xét chứng chỉ SAT',
        description: 'Áp dụng theo điều kiện và ngưỡng của đề án tuyển sinh 2026.',
        sourceUrl: 'https://tuyensinh.uet.vnu.edu.vn/wp-content/images/Thong-tin-tuyen-sinh-DHCQ-nam-2026-cap-nhat.pdf'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Đề án 2026 nêu các tổ hợp A00, A01 và X06; điều kiện cụ thể theo ngành.',
        sourceUrl: 'https://tuyensinh.uet.vnu.edu.vn/wp-content/images/Thong-tin-tuyen-sinh-DHCQ-nam-2026-cap-nhat.pdf'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng theo Nghị định 179/2026/NĐ-CP',
        description: '18/20 ngành đại học của trường thuộc danh mục được áp dụng chính sách; điều kiện và mức hưởng cụ thể do trường/cơ quan có thẩm quyền hướng dẫn.',
        academicYear: '2026',
        sourceUrl: 'https://uet.vnu.edu.vn/cac-nganh-tuyen-sinh-dai-hoc-2026-tai-truong-dai-hoc-cong-nghe-thuoc-danh-muc-cac-nganh-dao-tao-duoc-ap-dung-chinh-sach-hoc-bong-theo-nghi-dinh-so-179-2026-nd-cp/'
      }
    ],
    financialNotes: [
      {
        description: 'Học phí hệ chuẩn thu theo tín chỉ và thay đổi từng năm; hệ chất lượng cao thu theo học kỳ với mức ổn định theo khóa; chương trình đặc thù theo niên chế và có thể tăng theo quy định. Học phí tạm thu 8.616.125 đồng khi nhập học QH-2026 được khấu trừ vào học kỳ I, không phải tổng học phí năm.',
        sourceUrl: 'https://uet.vnu.edu.vn/thu-tuc-nhap-hoc-vao-truong-dai-hoc-cong-nghe-dhqghn-danh-cho-tan-sinh-vien-khoa-qh-2026/'
      }
    ]
  },
  'ĐV-015': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng, ưu tiên xét tuyển thẳng',
        description: 'Theo quy chế tuyển sinh của Bộ GD&ĐT; trường công bố chỉ tiêu 1–5% tổng chỉ tiêu năm 2026.',
        sourceUrl: 'https://hcmut.edu.vn/tuyen-sinh/dai-hoc-chinh-quy/phuong-thuc-tuyen-sinh/xet-tuyen-thang-2026'
      },
      {
        name: 'Xét tuyển tổng hợp',
        description: 'Phương thức chính, chỉ tiêu công bố 95–99%; xét các nhóm hồ sơ theo kết quả ĐGNL ĐHQG-HCM, thi tốt nghiệp THPT, học bạ và thành tích/chứng chỉ theo đối tượng.',
        sourceUrl: 'https://hcmut.edu.vn/tuyen-sinh/dai-hoc-chinh-quy/phuong-thuc-tuyen-sinh/xet-tuyen-tong-hop-2026'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng và hỗ trợ tài chính Bách khoa',
        description: 'Trường cho biết năm học 2025–2026 đã triển khai hơn 5.300 suất học bổng trị giá hơn 92 tỷ đồng; chương trình cùng đối tác, cựu sinh viên và học bổng Chính phủ được duy trì/mở rộng cho 2026–2027. Đây là số liệu toàn trường, không phải mức bảo đảm cho từng sinh viên.',
        academicYear: '2026–2027',
        sourceUrl: 'https://hcmut.edu.vn/tintuc/dac-quyen-huong-ho-tro-tai-chinh-danh-cho-sinh-vien-Bach-khoa'
      },
      {
        name: 'Học bổng Sumiden',
        description: 'Đợt 2026–2027 có 5 suất, mỗi suất 400 USD cho sinh viên chính quy Khoa Điện – Điện tử hoặc Khoa Khoa học và Kỹ thuật Máy tính, thuộc hộ nghèo/cận nghèo/hoàn cảnh đặc biệt khó khăn và đạt GPA học kỳ 2 năm 2025–2026 cùng GPA tích lũy từ 3.2/4.0. Hạn nộp 04/10/2026 đã qua; đây là một đợt tài trợ cụ thể, không phải học bổng đảm bảo hằng năm.',
        academicYear: '2026–2027; đợt đăng ký đã kết thúc',
        sourceUrl: 'https://hcmut.edu.vn/news/item/24953'
      }
    ],
    financialNotes: [
      {
        description: 'Chưa xác minh được bảng số tiền học phí 2026–2027 cho từng chương trình đại học chính quy dạy bằng tiếng Việt; thông báo học vụ của trường hướng dẫn xem quyết định điều chỉnh tại mục Đào tạo → Học phí. Prospectus quốc tế 2026–2027 công bố mức 3.513 USD/năm cho chương trình cử nhân dạy bằng tiếng Anh, theo chính sách học phí ngang nhau theo quốc tịch; mức này không đại diện cho chương trình tiếng Việt.',
        sourceUrl: 'https://hcmut.edu.vn/brochure/international2026.pdf',
        additionalSourceUrls: ['https://hcmut.edu.vn/news/item/25121']
      }
    ]
  },
  'ĐV-016': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng, ưu tiên xét tuyển theo quy định của Bộ GD&ĐT',
        description: 'Phương thức 1a trong thông tin tuyển sinh đại học chính quy 2026.',
        sourceUrl: 'https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/'
      },
      {
        name: 'Xét tuyển thí sinh nước ngoài theo kết quả học tập THPT',
        description: 'Áp dụng cho thí sinh có quốc tịch nước ngoài và tốt nghiệp THPT nước ngoài theo điều kiện công bố năm 2026.',
        sourceUrl: 'https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/'
      },
      {
        name: 'Xét tuyển tổng hợp kết quả thi và học bạ',
        description: 'Kết hợp kết quả thi tốt nghiệp THPT hoặc kỳ thi ĐGNL ĐHQG-HCM năm 2026 theo ngành/nhóm ngành với điểm học bạ cả ba năm lớp 10, 11, 12.',
        sourceUrl: 'https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng tuyển sinh cho thí sinh đạt thành tích xuất sắc',
        description: 'Quy định tuyển sinh 2026 có suất học bổng 100% học phí thực đóng cho các nhóm điểm đầu vào cao nhất và thành tích học thuật quốc tế; một số nhóm được cấp tối đa 4 năm. Học bổng cấp theo học kỳ và duy trì theo kết quả học tập, rèn luyện.',
        academicYear: '2026; xét theo từng học kỳ, duy trì có điều kiện',
        sourceUrl: 'https://hcmus.edu.vn/hoc-bong-tuyen-sinh-nam-2026-truong-dai-hoc-khoa-hoc-tu-nhien-dhqg-hcm/',
        additionalSourceUrls: ['https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/']
      },
      {
        name: 'Học bổng tân sinh viên chương trình tiên tiến/tăng cường tiếng Anh và ngành chiến lược',
        description: 'Theo ngành và thứ hạng tuyển sinh, học bổng năm đầu có thể bằng 100% hoặc 50% học phí thực đóng; số suất khác nhau theo chương trình, ngành và kết quả THPT/ĐGNL. Ngành phát triển bền vững/chiến lược quốc gia có các suất 50–100% học phí năm đầu.',
        academicYear: '2026',
        sourceUrl: 'https://hcmus.edu.vn/hoc-bong-tuyen-sinh-nam-2026-truong-dai-hoc-khoa-hoc-tu-nhien-dhqg-hcm/',
        additionalSourceUrls: ['https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/']
      },
      {
        name: 'Học bổng khuyến khích học tập và học bổng tài trợ',
        description: 'Học bổng khuyến khích học tập xét theo kết quả từng học kỳ; nguồn tuyển sinh 2026 nêu các mức tương ứng 100%, 110% và 120% học phí trong kỳ. Trường còn có học bổng do cựu sinh viên và đối tác tài trợ; điều kiện và số suất theo từng đợt.',
        academicYear: '2026–2027; xét theo học kỳ',
        sourceUrl: 'https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/'
      }
    ],
    financialNotes: [
      {
        description: 'Bảng tuyển sinh khóa 2026 công bố học phí năm học 2026–2027 theo 44 mã/ngành/chương trình; phải tra theo mã chính xác. Mức thấp nhất 32,6 triệu đồng/năm, cao nhất 70 triệu đồng/năm ở chương trình tiên tiến Khoa học máy tính. Các mức này không đại diện cho cùng một loại chương trình.',
        sourceUrl: 'https://tuyensinh.hcmus.edu.vn/2026-thong-tin-tuyen-sinh/'
      }
    ]
  },
  'ĐV-018': {
    admissionMethods: [
      {
        name: 'Xét tuyển tổng hợp',
        description: 'Phương thức tuyển sinh đại học chính quy năm 2026; trường nhận các hồ sơ theo điều kiện công bố từ kết quả thi tốt nghiệp THPT, ĐGNL ĐHQG-HCM, chứng chỉ quốc tế và minh chứng điểm cộng. Ngưỡng tuyển sinh tùy nhóm dữ liệu/ngành; không tự hiểu là xét học bạ độc lập.',
        sourceUrl: 'https://tuyensinh.uit.edu.vn/2026-thong-bao-nguong-dam-bao-chat-luong-dau-vao-theo-phuong-thuc-xet-tuyen-tong-hop-nam-2026',
        additionalSourceUrls: ['https://tuyensinh.uit.edu.vn/2026-thong-bao-ve-viec-dang-ky-thong-tin-minh-chung-xet-diem-cong-dung-de-xet-tuyen-theo-phuong-thuc-tong-hop-vao-dai-hoc-chinh-quy-nam-2026']
      },
      {
        name: 'Tuyển thẳng theo quy chế Bộ GD&ĐT',
        description: 'Có thông báo riêng năm 2026 về tuyển thẳng theo Điều 8 Quy chế tuyển sinh; cần kiểm tra nhóm đối tượng và hồ sơ của từng thí sinh.',
        sourceUrl: 'https://tuyensinh.uit.edu.vn/tuyen-sinh-uit'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập và học bổng chương trình tiên tiến',
        description: 'Học bổng khuyến khích học tập xét dựa trên điểm học tập và rèn luyện học kỳ trước; học bổng chương trình tiên tiến có tiêu chí riêng. Thông báo HK1 năm học 2026–2027 yêu cầu đăng ký trước 01/11/2026; sinh viên khóa 2026 không đăng ký diện KKHT/CTTT trong thông báo này, còn học bổng tuyển sinh không cần đăng ký.',
        academicYear: '2026–2027, học kỳ I; hạn đăng ký theo thông báo đến 01/11/2026',
        sourceUrl: 'https://portal.uit.edu.vn/bai-viet/thong-bao-dang-ky-xet-cap-cac-loai-hoc-bong-hk-1-nh-2026-2027'
      },
      {
        name: 'Học bổng ngoài ngân sách',
        description: 'Xét theo tiêu chí của từng đơn vị tài trợ. Sinh viên có thể đăng ký học bổng trong ngân sách và ngoài ngân sách; trong mỗi học kỳ ưu tiên nhận một học bổng ngoài ngân sách, trừ trường hợp đặc biệt do hội đồng quyết định.',
        academicYear: '2026–2027, học kỳ I; hạn đăng ký theo thông báo đến 01/11/2026',
        sourceUrl: 'https://portal.uit.edu.vn/bai-viet/thong-bao-dang-ky-xet-cap-cac-loai-hoc-bong-hk-1-nh-2026-2027'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình chuẩn, Việt–Nhật, Cử nhân Tài năng và Kỹ sư Tài năng (khóa 2023–2026)',
        academicYear: '2026–2027',
        annualVnd: 41800000,
        note: 'Quyết định 875/QĐ-ĐHCNTT quy định 41.800.000 đồng/năm học cho học mới; học lại/học cải thiện có đơn giá riêng 1.300.000 đồng/tín chỉ. Phí hè cũng tính riêng; áp dụng theo khóa/chương trình như quyết định.',
        sourceUrl: 'https://khtc.uit.edu.vn/sites/default/files/202608/quyet_dinh_muc_thu_hp_2026-2027_cqdtcntnkstn_pdf.pdf'
      },
      {
        programName: 'Chương trình tiên tiến (khóa 2026)',
        academicYear: '2026–2027',
        annualVnd: 60000000,
        note: 'Quyết định 876/QĐ-ĐHCNTT quy định 60.000.000 đồng/năm học cho học mới khóa 2023, 2025 và 2026; một số khóa cũ có mức khác. Học lại/học cải thiện tính riêng theo tín chỉ.',
        sourceUrl: 'https://khtc.uit.edu.vn/sites/default/files/202608/quyet_dinh_muc_thu_hp_2026-2027_cttt_pdf.pdf'
      },
      {
        programName: 'Chương trình chất lượng cao — học phần riêng dạy bằng tiếng Việt/ngoại ngữ',
        academicYear: '2026–2027',
        creditVnd: 1300000,
        note: 'Đơn giá học phần riêng bằng tiếng Việt và ngoại ngữ là 1.300.000 đồng/tín chỉ; học phần chung với chương trình chuẩn cũng theo mức được quyết định quy định. Học kỳ hè áp dụng đơn giá khác; không quy đổi thành học phí năm nếu chưa biết số tín chỉ.',
        sourceUrl: 'https://khtc.uit.edu.vn/sites/default/files/202608/quyet_dinh_muc_thu_hp_2026-2027_clc_pdf_0.pdf'
      },
      {
        programName: 'Chương trình chất lượng cao — học phần riêng dạy bằng tiếng Anh',
        academicYear: '2026–2027',
        creditVnd: 1500000,
        note: 'Đơn giá học phần riêng dạy bằng tiếng Anh là 1.500.000 đồng/tín chỉ; học kỳ hè áp dụng 2.250.000 đồng/tín chỉ. Không phải mức học phí trọn năm.',
        sourceUrl: 'https://khtc.uit.edu.vn/sites/default/files/202608/quyet_dinh_muc_thu_hp_2026-2027_clc_pdf_0.pdf'
      },
      {
        programName: 'Các chương trình đại học chính quy giảng dạy bằng tiếng Anh',
        academicYear: '2026–2027',
        annualVnd: 80000000,
        note: 'Quyết định 966/QĐ-ĐHCNTT quy định 80.000.000 đồng/năm học cho học mới; học lại/học cải thiện tính 2.400.000 đồng/tín chỉ và học mới trong hè/ngoài giờ tính đơn giá riêng.',
        sourceUrl: 'https://khtc.uit.edu.vn/sites/default/files/202608/quyet_dinh_muc_thu_hp_2026-2027_ctta_pdf.pdf'
      }
    ],
    financialNotes: [
      {
        description: 'Mức 41,8 triệu/năm thay cho bảng dự kiến cũ 42 triệu/năm đối với nhóm chương trình và khóa được nêu trong quyết định chính thức. Học phí học lại, cải thiện điểm, học kỳ hè và chương trình chất lượng cao có cách thu riêng.',
        sourceUrl: 'https://portal.uit.edu.vn/bai-viet/thong-bao-quy-dinh-muc-thu-hoc-phi-trinh-do-dtdh-nam-hoc-2026-2027',
        additionalSourceUrls: ['https://tuyensinh.uit.edu.vn/hoc-phi-hoc-bong']
      }
    ]
  },
  'ĐV-020': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng và ưu tiên xét tuyển thẳng',
        description: 'Phương thức 1 năm 2026, tối đa 5% chỉ tiêu theo thông tin tuyển sinh của trường.',
        sourceUrl: 'https://tuyensinh.uel.edu.vn/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2026/'
      },
      {
        name: 'Xét tuyển tổng hợp',
        description: 'Phương thức 2 kết hợp kết quả ĐGNL ĐHQG-HCM, thi tốt nghiệp THPT, học bạ và chứng chỉ tuyển sinh quốc tế theo nhóm đối tượng; không áp dụng xét học bạ độc lập. Công thức và trọng số 2026 được đề án công bố riêng.',
        sourceUrl: 'https://tuyensinh.uel.edu.vn/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2026/'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập',
        description: 'UEL dành nguồn khoảng 8% học phí năm học cho học bổng khuyến khích học tập; mức theo chính sách 2026 được công bố tối đa 121% giá trị học phí. Xét theo kết quả học tập/rèn luyện từng kỳ; quỹ tổng thể không bảo đảm mỗi sinh viên đều nhận.',
        academicYear: '2026–2027; xét theo học kỳ',
        sourceUrl: 'https://tuyensinh.uel.edu.vn/hoc-phi-uel-2026-cap-nhat-muc-thu-va-chinh-sach-ho-tro-tai-chinh/'
      },
      {
        name: 'Học bổng tuyển sinh tân sinh viên 2026',
        description: 'Tiên phong: 3 suất × 40 triệu đồng, tự động cho thủ khoa theo nhóm THPT, ĐGNL và chứng chỉ quốc tế. Vượt trội: 5 suất × 15 triệu đồng cho nhóm điểm trúng tuyển cao, xét tự động. Nỗ lực bứt phá: 10 suất × 15 triệu đồng cho tân sinh viên có thành tích tốt và hoàn cảnh khó khăn. Tiếp sức đến trường: 10 suất × 15 triệu đồng. Các đợt tuyển sinh 2026 đã qua thời gian xét/trao.',
        academicYear: '2026; đợt tuyển sinh đã kết thúc',
        sourceUrl: 'https://tuyensinh.uel.edu.vn/wp-content/uploads/2026/07/20260708-Thong-bao-hoc-bong-tuyen-sinh-DHCQ_-1-Signed-2.pdf',
        additionalSourceUrls: ['https://tuyensinh.uel.edu.vn/thong-bao-ve-hoc-bong-tuyen-sinh-danh-cho-tan-sinh-vien-nam-2026/']
      },
      {
        name: 'Học bổng Chắp cánh',
        description: 'Khoảng 10 suất cho tân sinh viên 2026 có hoàn cảnh khó khăn, tổng giá trị chương trình 1 tỷ đồng gồm học phí, sinh hoạt phí và đào tạo kỹ năng trong 4 năm; duy trì có điều kiện và không đồng thời nhận học bổng cùng mục đích nếu chưa được chấp thuận. Đợt tân sinh viên 2026 đã qua thời gian nhận hồ sơ.',
        academicYear: '2026; đợt tuyển sinh đã kết thúc',
        sourceUrl: 'https://tuyensinh.uel.edu.vn/wp-content/uploads/2026/07/20260708-Thong-bao-hoc-bong-tuyen-sinh-DHCQ_-1-Signed-2.pdf'
      },
      {
        name: 'Học bổng Chắp cánh 2026–2027 cho sinh viên năm 2, năm 3',
        description: 'Thông báo Phòng Tuyển sinh và Công tác sinh viên nêu 10 suất có thể điều chỉnh theo hồ sơ; giá trị do nhà tài trợ đề xuất, dự kiến tối đa tương đương học phí một năm. Dành cho sinh viên K24/K25 khó khăn, nỗ lực học tập, không nhận học bổng hỗ trợ cùng mục đích nếu chưa được chấp thuận; duy trì theo hoàn cảnh và quá trình học tập/tham gia cộng đồng.',
        academicYear: '2026–2027',
        sourceUrl: 'https://ctsv.uel.edu.vn/hoc-bong-ngoai-ngan-sach-2/chuong-trinh-hoc-bong-chap-canh-nam-hoc-2026-2027'
      },
      {
        name: 'Học bổng POSCO TJ Park',
        description: 'Năm học 2026–2027, giá trị 1.000 USD/suất; dành cho sinh viên chính quy năm cận cuối/cuối có GPA năm học 2025–2026 từ 8,5, rèn luyện mỗi kỳ từ 80, không thi lại, tích cực nghiên cứu/ngoại khóa và chưa nhận học bổng tổ chức khác trong năm học. Hạn 12/10/2026 đã qua.',
        academicYear: '2026–2027; đợt đăng ký đã kết thúc',
        sourceUrl: 'https://ctsv.uel.edu.vn/thong-bao-chung-5/hoc-bong-posco-tj-park-nam-hoc-2026-2027'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình dạy và học bằng tiếng Việt',
        academicYear: '2026–2027 (dự kiến)',
        annualVnd: 35800000,
        note: 'Mức dự kiến cho khóa tuyển sinh 2026; học phí thu theo năm học.',
        sourceUrl: 'https://tuyensinh.uel.edu.vn/maytech_faq/hoc-phi-cua-truong-nhu-the-nao/'
      },
      {
        programName: 'Chương trình Co-op tiếng Anh bán phần',
        academicYear: '2026–2027 (dự kiến)',
        annualVnd: 55000000,
        note: 'Mức dự kiến cho khóa tuyển sinh 2026; học phí thu theo năm học.',
        sourceUrl: 'https://tuyensinh.uel.edu.vn/maytech_faq/hoc-phi-cua-truong-nhu-the-nao/'
      },
      {
        programName: 'Chương trình dạy học bằng tiếng Anh',
        academicYear: '2026–2027 (dự kiến)',
        annualVnd: 73500000,
        note: 'Mức dự kiến cho khóa tuyển sinh 2026; học phí thu theo năm học.',
        sourceUrl: 'https://tuyensinh.uel.edu.vn/maytech_faq/hoc-phi-cua-truong-nhu-the-nao/'
      },
      {
        programName: 'Chương trình liên kết quốc tế do trường nước ngoài cấp bằng',
        academicYear: '2026–2027 (dự kiến)',
        annualVnd: 91250000,
        note: 'Mức dự kiến 91.250.000 đồng/năm được nêu riêng trong đề án cho chương trình liên kết quốc tế; không áp dụng cho các chương trình UEL cấp bằng trong nước.',
        sourceUrl: 'https://tuyensinh.uel.edu.vn/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2026/'
      }
    ],
    financialNotes: [
      {
        description: 'Mức học phí năm 2026–2027 là dự kiến; chương trình liên kết quốc tế có mức riêng. UEL còn thực hiện miễn, giảm học phí, trợ cấp xã hội và hướng dẫn tiếp cận các khoản vay ưu đãi theo điều kiện từng chính sách.',
        sourceUrl: 'https://tuyensinh.uel.edu.vn/hoc-phi-uel-2026-cap-nhat-muc-thu-va-chinh-sach-ho-tro-tai-chinh/',
        additionalSourceUrls: ['https://tuyensinh.uel.edu.vn/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-2026/']
      }
    ]
  },
  'ĐV-021': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng',
        description: 'Theo Quy chế tuyển sinh của Bộ GD&ĐT và thông tin tuyển sinh chính quy năm 2026 của AGU.',
        sourceUrl: 'https://tuyensinh.agu.edu.vn/tuyen-sinh',
        additionalSourceUrls: ['https://tuyensinh.agu.edu.vn/tin-tuc/quyet-dinh-ban-hanh-thong-tin-tuyen-sinh-dai-hoc-hinh-thuc-dao-tao-chinh-quy-hinh-thuc-dao-tao-thuong-xuyen-nam-2026-cua-truong-dai-hoc-an-giang-cap-nhat-3-nganh-moi']
      },
      {
        name: 'Xét tuyển tổng hợp',
        description: 'Kết hợp kết quả thi tốt nghiệp THPT, kỳ thi ĐGNL ĐHQG-HCM, học bạ và điểm cộng theo trọng số linh hoạt từng nhóm ngành. Đây không phải các phương thức xét riêng biệt trong thông tin tuyển sinh chính quy 2026.',
        sourceUrl: 'https://tuyensinh.agu.edu.vn/tuyen-sinh',
        additionalSourceUrls: ['https://tuyensinh.agu.edu.vn/tin-tuc/quyet-dinh-ban-hanh-thong-tin-tuyen-sinh-dai-hoc-hinh-thuc-dao-tao-chinh-quy-hinh-thuc-dao-tao-thuong-xuyen-nam-2026-cua-truong-dai-hoc-an-giang-cap-nhat-3-nganh-moi']
      }
    ],
    scholarships: [
      {
        name: 'Học bổng Tiếp bước đến trường',
        description: 'Đợt 2026 công bố 10 suất, mỗi suất 10 triệu đồng. Dành cho sinh viên khóa DH24–DH26 thường trú An Giang, điểm trung bình học kỳ I năm 2025–2026 từ 7,0, có hoàn cảnh khó khăn và đáp ứng điều kiện về học bổng đã nhận. Khoa đề cử; hạn nộp do từng khoa thông báo, đợt 2026 đã qua.',
        academicYear: '2026; đợt xét đã qua',
        sourceUrl: 'https://sao.agu.edu.vn/article/thong-bao-xet-chon-hoc-bong-tiep-buoc-den-truong-nam-2026-sinh-vien-lien-he-khoa-de-biet-han-nop-va-nop-ho-so-o-khoa.html'
      },
      {
        name: 'Học bổng Vượt khó học tốt do ACB tài trợ',
        description: 'Đợt 2026 công bố 5 triệu đồng/suất; xét sinh viên có điểm học tập kỳ gần nhất từ 7,5, rèn luyện khá trở lên, hoàn cảnh khó khăn và chưa nhận học bổng từ đơn vị tài trợ khác trong năm học 2025–2026. Thông báo ghi 15 suất ở phần mở đầu nhưng bảng phân bổ theo khoa cộng thành 22, nên kho không khẳng định số suất cho tới khi trường xác nhận. Đợt xét đã qua.',
        academicYear: '2026; đợt xét đã qua',
        sourceUrl: 'https://sao.agu.edu.vn/article/thong-bao-ve-viec-xet-chon-hoc-bong-vuot-kho-hoc-tot-do-acb-tai-tro-nam-2026.html'
      },
      {
        name: 'Quỹ Tiếp sức tài năng An Giang — hỗ trợ sinh viên khó khăn',
        description: 'Quỹ nhận hồ sơ hỗ trợ năm học 2026–2027 theo tiêu chí tại Điều 9 Quyết định 12/QĐ-QTSTN ngày 04/05/2026. Thông báo đã kiểm tra không nêu mức tiền hoặc số suất riêng cho AGU; không xem đây là học bổng bảo đảm.',
        academicYear: '2026–2027',
        sourceUrl: 'https://sao.agu.edu.vn/article/thong-bao-cua-quy-tiep-suc-tai-nang-an-giang-ve-viec-tiep-nhan-ho-so-ho-tro-tiep-suc-cho-sinh-vien-co-hoan-canh-kho-khan-nam-hoc-2026-2027.html'
      },
      {
        name: 'Học bổng khuyến khích học tập',
        description: 'AGU xét và công bố định mức theo từng học kỳ; nguồn gần nhất đã xác minh là thông báo xét/cấp cho học kỳ II năm 2025–2026. Chưa xác minh định mức và ngưỡng xét cho năm học 2026–2027.',
        academicYear: 'Thông tin gần nhất: học kỳ II năm học 2025–2026',
        sourceUrl: 'https://sao.agu.edu.vn/article/cong-van-v-v-trien-khai-dinh-muc-chi-tiet-xet-va-cap-hoc-bong-kkht-hoc-ky-ii-nam-hoc-2025-2026.html'
      }
    ],
    financialNotes: [
      {
        description: 'Chưa xác minh được bảng học phí đại học chính quy 2026–2027 theo ngành trong nguồn công khai đã rà. Tài liệu học phí 2026 tìm thấy dành cho hình thức giáo dục thường xuyên/vừa làm vừa học; không dùng mức đó thay cho học phí chính quy.',
        sourceUrl: 'https://tuyensinh.agu.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-hinh-thuc-giao-duc-chinh-quy-vua-lam-vua-hoc-nam-2026-ma-truong-qsa',
        additionalSourceUrls: ['https://tuyensinh.agu.edu.vn/uploads/6873800cde536d1c45faad666f3056a7.pdf']
      }
    ]
  },
  'ĐV-022': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng theo quy chế Bộ GD&ĐT',
        description: 'Thông tin tuyển sinh 2026 nêu nhóm đạt giải học sinh giỏi quốc gia phù hợp ngành và các đối tượng xét tuyển thẳng theo quy chế; điều kiện học tập và chỉ tiêu phụ thuộc nhóm đối tượng.',
        sourceUrl: 'https://www.uhsvnu.edu.vn/tuyen-sinh-dao-tao/thong-tin-tuyen-sinh/tu-van-tuyen-sinh/thong-tin-tuyen-sinh-nam-2026-18052026',
        additionalSourceUrls: ['https://tuyensinh.uhsvnu.edu.vn/news.php?slug=thongtintuyensinh1']
      },
      {
        name: 'Xét tuyển tổng hợp',
        description: 'Kết hợp điểm thi tốt nghiệp THPT, điểm ĐGNL ĐHQG-HCM và học bạ lớp 10–12 theo thang 100. Trọng số THPT 30–35%, ĐGNL 45–50%, học bạ 20%, cộng điểm ưu tiên/điểm cộng nếu đủ điều kiện; trường có quy tắc quy đổi nếu thiếu một thành phần.',
        sourceUrl: 'https://www.uhsvnu.edu.vn/tuyen-sinh-dao-tao/thong-tin-tuyen-sinh/tu-van-tuyen-sinh/thong-tin-tuyen-sinh-nam-2026-18052026',
        additionalSourceUrls: ['https://tuyensinh.uhsvnu.edu.vn/news.php?slug=thongtintuyensinh1']
      }
    ],
    scholarships: [
      {
        name: 'Học bổng POSCO TJ Park',
        description: 'Đợt 2026–2027 công bố 1.000 USD/suất cho sinh viên chính quy năm cận cuối hoặc năm cuối. Điều kiện chi tiết và hạn nộp theo thông báo của trường/Quỹ; đợt công bố tháng 10/2026, cần kiểm tra hạn trước khi nộp.',
        academicYear: '2026–2027',
        sourceUrl: 'https://www.uhsvnu.edu.vn/doi-song-sinh-vien/ho-tro-sinh-vien/hoc-bong-trong-nuoc-doanh-nghiep/thong-bao-chuong-trinh-hoc-bong-posco-tj-park-nam-hoc-2026-2027-02102026'
      },
      {
        name: 'Học bổng Pony Chung',
        description: 'Thông báo năm học 2026–2027 công bố 600 USD/suất. Đây là học bổng tài trợ theo đợt; hồ sơ, đối tượng ưu tiên và hạn nộp theo thông báo năm nay, không phải khoản giảm học phí mặc định.',
        academicYear: '2026–2027; đợt thông báo tháng 8/2026',
        sourceUrl: 'https://www.uhsvnu.edu.vn/doi-song-sinh-vien/ho-tro-sinh-vien/hoc-bong-trong-nuoc-doanh-nghiep/thong-bao-hoc-bong-pony-chung-nam-hoc-2026-2027-26082026'
      },
      {
        name: 'Học bổng NK Lee',
        description: 'Năm học 2026–2027 có 1 suất trị giá 4 triệu đồng/tháng, tiếp tục nhận đến khi tốt nghiệp. Dành cho sinh viên các năm có hoàn cảnh khó khăn/hộ nghèo, kết quả học tập ít nhất trung bình-khá, IELTS 5.0 hoặc tương đương và chưa nhận học bổng khác trong năm học; hồ sơ theo thông báo của trường.',
        academicYear: '2026–2027',
        sourceUrl: 'https://www.uhsvnu.edu.vn/doi-song-sinh-vien/ho-tro-sinh-vien/hoc-bong-trong-nuoc-doanh-nghiep/thong-bao-chuong-trinh-hoc-bong-nk-lee-11092026'
      }
    ],
    financialNotes: [
      {
        description: 'Chưa xác minh được biểu học phí chính quy 2026–2027 theo ngành. Bảng trên cổng trường cũ chỉ công bố lộ trình đến năm học 2025–2026; không dùng các mức cũ làm học phí hiện hành. Trường cũng thông báo chính sách miễn/giảm học phí, trợ cấp xã hội và hỗ trợ chi phí học tập theo hồ sơ đủ điều kiện.',
        sourceUrl: 'https://oldwebportal.uhsvnu.edu.vn/hoc-phi-hoc-bong/',
        additionalSourceUrls: ['https://www.uhsvnu.edu.vn/doi-song-sinh-vien/ho-tro-sinh-vien/mien-giam-hoc-phi/thong-bao-ve-viec-thuc-hien-che-do-chinh-sach-mien-giam-hoc-phi-tro-cap-xa-hoi-va-ho-tro-chi-phi-hoc-tap-hoc-ky-i-nam-hoc-2026-2027-21092026']
      },
      {
        description: 'Chương trình “ACB đồng hành cùng sinh viên ĐHQG-HCM” là khoản vay hỗ trợ, không phải học bổng: năm học 2026–2027 có hạn mức chung 50 tỷ đồng; sinh viên UHS cần đạt học tập từ 6,0/10 và rèn luyện từ 70/100 để đăng ký. Lãi trong thời gian ân hạn được chương trình hỗ trợ, vốn vay vẫn phải hoàn trả theo điều kiện chương trình.',
        sourceUrl: 'https://www.uhsvnu.edu.vn/doi-song-sinh-vien/ho-tro-sinh-vien/vay-von-sinh-vien/thong-bao-ve-viec-trien-khai-chuong-trinh-acb-dong-hanh-cung-sinh-vien-dhqg-hcm-hoc-ky-1-nam-hoc-2026-2027-28092026'
      }
    ]
  },
  'ĐV-024': {
    admissionMethods: [
      {
        name: 'Xét điểm thi tốt nghiệp THPT',
        description: 'Một trong bốn phương thức tuyển sinh đại học chính quy năm 2026; tổ hợp và chỉ tiêu theo ngành.',
        sourceUrl: 'https://admission.tnut.edu.vn/thong-bao/nganh-va-chi-tieu-tuyen-sinh-nam-2026'
      },
      {
        name: 'Xét kết quả học bạ THPT',
        description: 'Một trong bốn phương thức tuyển sinh đại học chính quy năm 2026; điểm và cách quy đổi theo hướng dẫn của Đại học Thái Nguyên.',
        sourceUrl: 'https://admission.tnut.edu.vn/thong-bao/nganh-va-chi-tieu-tuyen-sinh-nam-2026'
      },
      {
        name: 'Xét kết quả kỳ thi V-SAT',
        description: 'Một trong bốn phương thức tuyển sinh đại học chính quy năm 2026; kết quả V-SAT được quy đổi theo hướng dẫn năm tuyển sinh.',
        sourceUrl: 'https://admission.tnut.edu.vn/thong-bao/nganh-va-chi-tieu-tuyen-sinh-nam-2026'
      },
      {
        name: 'Xét tuyển thẳng',
        description: 'Theo quy chế tuyển sinh của Bộ GD&ĐT. Thí sinh đăng ký trên hệ thống chung của Bộ; trường không yêu cầu nộp hồ sơ trực tuyến riêng cho các phương thức thông thường.',
        sourceUrl: 'https://admission.tnut.edu.vn/thong-bao/nganh-va-chi-tieu-tuyen-sinh-nam-2026'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập',
        description: 'Xét theo từng học kỳ dựa trên kết quả học tập, rèn luyện và quy định của trường; điều kiện/định mức cần xem thông báo từng kỳ. Công khai tài chính năm 2026 ghi nhận 8.114.070.000 đồng học bổng đã cấp trong học kỳ I và II năm học 2025–2026; đây là tổng đã chi, không phải mức mỗi sinh viên hay cam kết cho năm sau.',
        academicYear: 'Cơ chế trường; số liệu chi gần nhất công khai thuộc năm học 2025–2026',
        sourceUrl: 'https://www.tnut.edu.vn/blog/3-chinh-sach-va-ket-qua-thuc-hien-chinh-sach-hang-nam-ve-tro-cap-va-mien-giam-hoc-phi-hoc-bong-doi-voi-nguoi-hoc-16140700',
        additionalSourceUrls: ['https://www.tnut.edu.vn/quyet-dinh-ban-hanh-quy-dinh-hoc-bong-khuyen-khich-hoc-tap-cho-sinh-vien-dai-hoc-chinh-quy-tai-truong-dai-hoc-ky-thuat-cong-nghiep-dz15180.html']
      },
      {
        name: 'Học bổng tài trợ Panasonic bậc đại học',
        description: 'TNUT đăng thông báo giới thiệu chương trình học bổng Panasonic năm 2026. Trang trường dẫn tới văn bản đính kèm; chưa xác minh được số suất, giá trị và tiêu chí của đợt dành riêng cho người học TNUT từ phần thông tin công khai, nên không suy ra mức tiền.',
        academicYear: '2026; thông báo giới thiệu ngày 20/04/2026',
        sourceUrl: 'https://www.tnut.edu.vn/cong-van-v-v-gioi-thieu-chuong-trinh-hoc-bong-bac-dai-hoc-panasonic-nam-2026-dz21243.html'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình đại trà giảng dạy bằng tiếng Việt — tân sinh viên khóa K62',
        academicYear: '2026–2027',
        creditVnd: 630000,
        note: 'Tính theo số tín chỉ học phí có trọng số: 630.000 đồng/tín chỉ chuẩn. Học phần thực hành/thí nghiệm có hệ số 2; thực tập/tập huấn có hệ số 2,5; khóa luận, đồ án hoặc ngoại ngữ có hệ số theo quyết định. Không thể quy đổi thành học phí năm khi chưa biết kế hoạch tín chỉ của ngành.',
        sourceUrl: 'https://admission.tnut.edu.vn/thong-bao/hoc-phi-2026-2027'
      },
      {
        programName: 'Chương trình tiên tiến giảng dạy bằng tiếng Anh — tân sinh viên khóa K62',
        academicYear: '2026–2027',
        creditVnd: 945000,
        note: 'Đơn giá 945.000 đồng/tín chỉ học phí có trọng số; tổng thu phụ thuộc số tín chỉ và hệ số loại học phần theo quyết định. Không phải học phí năm trọn gói.',
        sourceUrl: 'https://admission.tnut.edu.vn/thong-bao/hoc-phi-2026-2027'
      },
      {
        programName: 'Khóa K61 trở về trước — ngành kỹ thuật/công nghệ',
        academicYear: '2026–2027',
        amount: 2090000,
        currency: 'VND',
        note: 'Mức thu công bố là 2.090.000 đồng/tháng; trường tính 10 tháng/năm học cho nhóm ngành được nêu. Sinh viên học theo tín chỉ, học lại/cải thiện hoặc chương trình khác có thể áp dụng đơn giá riêng; không dùng mức này thay cho K62.',
        sourceUrl: 'https://admission.tnut.edu.vn/thong-bao/hoc-phi-2026-2027'
      },
      {
        programName: 'Khóa K61 trở về trước — Kinh tế công nghiệp, Quản lý công nghiệp và Ngôn ngữ Anh',
        academicYear: '2026–2027',
        amount: 1790000,
        currency: 'VND',
        note: 'Mức thu công bố là 1.790.000 đồng/tháng; trường tính 10 tháng/năm học cho nhóm ngành được nêu. Sinh viên học theo tín chỉ, học lại/cải thiện hoặc chương trình khác có thể áp dụng đơn giá riêng; không dùng mức này thay cho K62.',
        sourceUrl: 'https://admission.tnut.edu.vn/thong-bao/hoc-phi-2026-2027'
      }
    ],
    financialNotes: [
      {
        description: 'Đối với K62, học phí tính theo tín chỉ có trọng số và loại học phần; bảng trên chỉ ghi đơn giá, không quy đổi thành một mức năm nếu chưa có kế hoạch tín chỉ từng ngành. Mức của khóa cũ được giữ tách riêng theo tháng và nhóm ngành.',
        sourceUrl: 'https://admission.tnut.edu.vn/thong-bao/hoc-phi-2026-2027'
      }
    ]
  },
  'ĐV-025': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng',
        description: 'Theo Quy chế tuyển sinh của Bộ GD&ĐT; điều kiện và ngành áp dụng theo thông tin tuyển sinh TNUE năm 2026.',
        sourceUrl: 'https://admissions.tnue.edu.vn/dai-hoc-chinh-quy/thong-tin-tuyen-sinh-trinh-do-dai-hoc-nam-2026-hinh-thuc-dao-tao-dai-hoc-chinh-quy-cua-truong-dai-hoc-su-pham-dai-hoc-thai-nguyen'
      },
      {
        name: 'Xét kết quả thi đánh giá năng lực SPT',
        description: 'Dùng kết quả kỳ thi đánh giá năng lực của Trường Đại học Sư phạm Hà Nội; không áp dụng cho Sư phạm Âm nhạc, Giáo dục Thể chất và Huấn luyện thể thao.',
        sourceUrl: 'https://admissions.tnue.edu.vn/dai-hoc-chinh-quy/thong-tin-tuyen-sinh-trinh-do-dai-hoc-nam-2026-hinh-thuc-dao-tao-dai-hoc-chinh-quy-cua-truong-dai-hoc-su-pham-dai-hoc-thai-nguyen'
      },
      {
        name: 'Xét kết quả thi V-SAT',
        description: 'Dùng kết quả kỳ thi đánh giá đầu vào đại học trên máy tính; một số ngành không áp dụng phương thức này, cần xem danh sách theo ngành trong đề án 2026.',
        sourceUrl: 'https://admissions.tnue.edu.vn/dai-hoc-chinh-quy/thong-tin-tuyen-sinh-trinh-do-dai-hoc-nam-2026-hinh-thuc-dao-tao-dai-hoc-chinh-quy-cua-truong-dai-hoc-su-pham-dai-hoc-thai-nguyen'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Xét theo tổ hợp và ngưỡng đầu vào công bố cho từng ngành năm 2026; các ngành có năng khiếu có thể kết hợp điểm thi tốt nghiệp với thi năng khiếu.',
        sourceUrl: 'https://admissions.tnue.edu.vn/dai-hoc-chinh-quy/thong-tin-tuyen-sinh-trinh-do-dai-hoc-nam-2026-hinh-thuc-dao-tao-dai-hoc-chinh-quy-cua-truong-dai-hoc-su-pham-dai-hoc-thai-nguyen'
      },
      {
        name: 'Xét tuyển kết hợp thi năng khiếu hoặc chuyển từ dự bị đại học',
        description: 'Đề án 2026 có phương thức kết hợp điểm thi THPT với thi năng khiếu và phương thức chuyển học sinh hoàn thành chương trình dự bị đại học; ngành áp dụng tùy theo đề án.',
        sourceUrl: 'https://admissions.tnue.edu.vn/dai-hoc-chinh-quy/thong-tin-tuyen-sinh-trinh-do-dai-hoc-nam-2026-hinh-thuc-dao-tao-dai-hoc-chinh-quy-cua-truong-dai-hoc-su-pham-dai-hoc-thai-nguyen'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập',
        description: 'Trường xét theo kết quả học tập và rèn luyện, ban hành định mức theo quy chế riêng và công khai danh sách theo học kỳ. Nguồn mới nhất rà được là danh sách cấp học bổng học kỳ II năm 2025–2026; chưa dùng số liệu hoặc định mức cũ để khẳng định mức nhận cho năm 2026–2027.',
        academicYear: 'Thông tin gần nhất: học kỳ II năm học 2025–2026',
        sourceUrl: 'https://tnue.edu.vn/thong-bao-danh-cho-nguoi-hoc/so-800dhspctsv-ngay-16042026-vv-cong-khai-danh-sach-sinh-vien-nhan-hoc-bong-khuyen-khich-hoc-tap-hoc-ky-ii-nam-hoc-20252026-lan-2',
        additionalSourceUrls: ['https://tnue.edu.vn/3707qddhsp']
      },
      {
        name: 'Hỗ trợ học phí và chi phí sinh hoạt cho sinh viên sư phạm',
        description: 'Sinh viên các ngành đào tạo giáo viên có thể đăng ký cơ chế hỗ trợ của Nhà nước; TNUE công khai danh sách sinh viên thực hiện hoặc không nhận hỗ trợ theo Nghị định 116. Điều kiện, mức hỗ trợ và nghĩa vụ sau tốt nghiệp phải đối chiếu quy định hiện hành và hồ sơ từng sinh viên.',
        academicYear: 'Thông tin triển khai cho khóa 2026',
        sourceUrl: 'https://tnue.edu.vn/thong-bao-danh-cho-nguoi-hoc',
        additionalSourceUrls: ['https://art.tnue.edu.vn/thong-bao-danh-cho-nguoi-hoc']
      }
    ],
    tuition: [
      {
        programName: 'Đại học chính quy — đơn giá theo tín chỉ',
        academicYear: '2026–2027',
        creditVnd: 470000,
        note: 'Mức thu công bố là 470.000 đồng/sinh viên/tín chỉ; tổng học phí phụ thuộc số tín chỉ học trong kỳ và ngành. Các năm từ 2027 trở đi thực hiện theo lộ trình, không tự suy rộng mức năm nay.',
        sourceUrl: 'https://admissions.tnue.edu.vn/dai-hoc-chinh-quy/thong-tin-tuyen-sinh-trinh-do-dai-hoc-nam-2026-hinh-thuc-dao-tao-dai-hoc-chinh-quy-cua-truong-dai-hoc-su-pham-dai-hoc-thai-nguyen'
      },
      {
        programName: 'Đại học chính quy — đơn giá theo niên chế',
        academicYear: '2026–2027',
        amount: 1790000,
        currency: 'VND',
        note: 'Mức thu công bố là 1.790.000 đồng/sinh viên/tháng đối với cách tính theo niên chế; không quy đổi thành tổng năm khi chưa biết số tháng thu của chương trình.',
        sourceUrl: 'https://admissions.tnue.edu.vn/dai-hoc-chinh-quy/thong-tin-tuyen-sinh-trinh-do-dai-hoc-nam-2026-hinh-thuc-dao-tao-dai-hoc-chinh-quy-cua-truong-dai-hoc-su-pham-dai-hoc-thai-nguyen'
      }
    ],
    financialNotes: [
      {
        description: 'Mức học phí 2026–2027 là 470.000 đồng/tín chỉ hoặc 1.790.000 đồng/tháng theo hình thức tính phí. Hỗ trợ học phí/chi phí sinh hoạt cho sinh viên sư phạm là chính sách theo diện đủ điều kiện, không mặc định áp dụng cho mọi ngành hoặc mọi sinh viên.',
        sourceUrl: 'https://admissions.tnue.edu.vn/dai-hoc-chinh-quy/thong-tin-tuyen-sinh-trinh-do-dai-hoc-nam-2026-hinh-thuc-dao-tao-dai-hoc-chinh-quy-cua-truong-dai-hoc-su-pham-dai-hoc-thai-nguyen',
        additionalSourceUrls: ['https://tnue.edu.vn/thong-bao-danh-cho-nguoi-hoc']
      }
    ]
  },
  'ĐV-026': {
    admissionMethods: [
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Một trong năm phương thức tuyển sinh chính quy năm 2026; sử dụng tổng điểm ba môn theo tổ hợp đăng ký và điểm ưu tiên nếu có.',
        sourceUrl: 'https://tuyensinh.tuaf.edu.vn/cauhoithuonggap/index.php'
      },
      {
        name: 'Xét học bạ THPT',
        description: 'Với thí sinh tốt nghiệp năm 2026, tính điểm theo điểm trung bình môn cả năm lớp 10, 11 và 12; thí sinh tốt nghiệp trước đó áp dụng cách tính được nêu trong FAQ tuyển sinh.',
        sourceUrl: 'https://tuyensinh.tuaf.edu.vn/cauhoithuonggap/index.php'
      },
      {
        name: 'Xét kết quả kỳ thi V-SAT',
        description: 'FAQ tuyển sinh 2026 nêu ngưỡng từ 225 điểm, sau đó quy đổi về thang 30 theo quy định của trường.',
        sourceUrl: 'https://tuyensinh.tuaf.edu.vn/cauhoithuonggap/index.php'
      },
      {
        name: 'Xét tuyển thẳng',
        description: 'Theo quy định của Bộ GD&ĐT và của trường.',
        sourceUrl: 'https://tuyensinh.tuaf.edu.vn/cauhoithuonggap/index.php'
      },
      {
        name: 'Xét học sinh hoàn thành chương trình dự bị đại học',
        description: 'Là một phương thức riêng trong thông tin tuyển sinh chính quy năm 2026; điều kiện và ngành áp dụng theo đề án của trường.',
        sourceUrl: 'https://tuyensinh.tuaf.edu.vn/cauhoithuonggap/index.php'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập',
        description: 'Xét theo học kỳ theo kết quả học tập và rèn luyện, căn cứ quy trình riêng của trường; quyết định 144/QĐ-ĐHNL-HSSV ban hành năm 2023 là quy định nền. Mức và ngưỡng của từng kỳ phụ thuộc thông báo/quyết định cấp học bổng, không lấy kết quả kỳ trước làm cam kết cho năm sau.',
        academicYear: 'Cơ chế hiện hành; định mức xem theo từng học kỳ',
        sourceUrl: 'https://tuaf.edu.vn/gallery/files/Phong_CTHSSV/Quy%20dinh%2C%20Quy%20che/144_02_3_2023%20Q%C4%90%20ban%20h%C3%A0nh%20quy%20tr%C3%ACnh%20x%C3%A9t%2C%20c%E1%BA%A5p%20HBKKHT.pdf',
        additionalSourceUrls: ['https://tuaf.edu.vn/danh-sach-bai-viet/hoc-bong-238.html']
      },
      {
        name: 'Học bổng thủ khoa, tài năng và học bổng doanh nghiệp/tài trợ',
        description: 'FAQ tuyển sinh 2026 xác nhận các nhóm học bổng thủ khoa đầu vào, học bổng tài năng, học bổng doanh nghiệp và học bổng tài trợ khác; tiêu chí, suất và mức tiền theo thông báo từng chương trình.',
        academicYear: '2026; điều kiện theo từng chương trình',
        sourceUrl: 'https://tuyensinh.tuaf.edu.vn/cauhoithuonggap/index.php'
      },
      {
        name: 'Học bổng tài trợ The PAN Group',
        description: 'Đợt tháng 4/2026 công bố tổng 200 triệu đồng học bổng cho 35 sinh viên, gồm 15 suất “PAN Ươm mầm tài năng”, 15 suất hỗ trợ học tập và 5 suất “Thắp sáng ước mơ”. Đây là tổng ngân sách của đợt, không phải mức tiền mỗi suất; đợt trao đã diễn ra.',
        academicYear: '2026; đợt trao tháng 4 đã qua',
        sourceUrl: 'https://tuaf.edu.vn/bai-viet/the-pan-group-tai-tro-300-trieu-dong-cho-truong-dai-hoc-nong-lam-dai-hoc-thai-nguyen-43549.html'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình đại trà hệ đại học chính quy',
        academicYear: '2026–2027',
        annualMinVnd: 17000000,
        annualMaxVnd: 19200000,
        note: 'Cổng tuyển sinh công bố khoảng 17.000.000–19.200.000 đồng/năm tùy ngành/chương trình. Quyết định 648/QĐ-ĐHNL-TC&CSVC là căn cứ biểu phí năm học 2026–2027; cần đối chiếu ngành cụ thể trước khi chốt mức.',
        sourceUrl: 'https://tuyensinh.tuaf.edu.vn/cauhoithuonggap/index.php'
      },
      {
        programName: 'Chương trình tiên tiến quốc tế',
        academicYear: '2026–2027',
        annualVnd: 28900000,
        note: 'Cổng tuyển sinh công bố mức 28.900.000 đồng/năm cho chương trình tiên tiến quốc tế; xác nhận lại chương trình và ngành khi đăng ký.',
        sourceUrl: 'https://tuyensinh.tuaf.edu.vn/cauhoithuonggap/index.php'
      }
    ],
    financialNotes: [
      {
        description: 'Mức 17–19,2 triệu đồng/năm là dải hệ đại trà theo FAQ tuyển sinh; chương trình tiên tiến quốc tế được nêu riêng ở mức 28,9 triệu đồng/năm. Học bổng có nhiều nhóm, nhưng số tiền và điều kiện phụ thuộc thông báo từng đợt.',
        sourceUrl: 'https://tuyensinh.tuaf.edu.vn/cauhoithuonggap/index.php',
        additionalSourceUrls: ['https://tuaf.edu.vn/bai-viet/quy-dinh-muc-hoc-phi-dao-tao-bac-dai-hoc-he-chinh-quy-nam-hoc-2026-2027-43627.html']
      }
    ]
  },
  'ĐV-027': {
    admissionMethods: [
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Áp dụng theo chỉ tiêu, tổ hợp và ngưỡng đầu vào của từng ngành trong thông tin tuyển sinh đại học chính quy năm 2026.',
        sourceUrl: 'https://tump.edu.vn/post/thong-tin-tuyen-sinh-dai-hoc-cao-dang-nam-2026',
        additionalSourceUrls: ['https://tuyensinh.tump.edu.vn/article/thong-tin-tuyen-sinh-dai-hoc-cao-dang-nam-2026']
      },
      {
        name: 'Xét kết quả học tập THPT',
        description: 'Trường công bố quy tắc quy đổi điểm học bạ tương đương điểm thi tốt nghiệp THPT 2026; điều kiện áp dụng theo ngành và thông báo tuyển sinh.',
        sourceUrl: 'https://tump.edu.vn/post/thong-bao-quy-tac-doi-tuong-duong-giua-diem-dgnl-cua-dh-quoc-gia-ha-noi-hsa-diem-danh-gia-dau-vao-dh-tren-may-tinh-v-sat-va-diem-xet-tuyen-theo-ket-qua-hoc-tap-cap-thpt-hoc-ba-theo-diem-thi-tn-thpt-2026',
        additionalSourceUrls: ['https://tump.edu.vn/post/thong-tin-tuyen-sinh-dai-hoc-cao-dang-nam-2026']
      },
      {
        name: 'Xét kết quả bài thi đánh giá năng lực HSA',
        description: 'Sử dụng bài thi đánh giá năng lực của ĐHQG Hà Nội và quy tắc quy đổi tương đương của trường năm 2026; ngành áp dụng theo đề án.',
        sourceUrl: 'https://tump.edu.vn/post/thong-bao-quy-tac-doi-tuong-duong-giua-diem-dgnl-cua-dh-quoc-gia-ha-noi-hsa-diem-danh-gia-dau-vao-dh-tren-may-tinh-v-sat-va-diem-xet-tuyen-theo-ket-qua-hoc-tap-cap-thpt-hoc-ba-theo-diem-thi-tn-thpt-2026'
      },
      {
        name: 'Xét kết quả kỳ thi V-SAT',
        description: 'Sử dụng kết quả kỳ thi đánh giá đầu vào đại học trên máy tính; trường công bố quy tắc quy đổi về cùng thang điểm xét tuyển năm 2026.',
        sourceUrl: 'https://tump.edu.vn/post/thong-bao-quy-tac-doi-tuong-duong-giua-diem-dgnl-cua-dh-quoc-gia-ha-noi-hsa-diem-danh-gia-dau-vao-dh-tren-may-tinh-v-sat-va-diem-xet-tuyen-theo-ket-qua-hoc-tap-cap-thpt-hoc-ba-theo-diem-thi-tn-thpt-2026'
      },
      {
        name: 'Xét tuyển thẳng',
        description: 'Theo quy chế tuyển sinh hiện hành và nhóm đối tượng trong thông tin tuyển sinh đại học chính quy năm 2026.',
        sourceUrl: 'https://tump.edu.vn/post/thong-tin-tuyen-sinh-dai-hoc-cao-dang-nam-2026'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập theo học kỳ',
        description: 'Quy định áp dụng từ năm học 2026–2027: quỹ học bổng trích 8% tổng tiền học phí lần đầu trong kỳ; xét theo ngành, khóa và kết quả học tập/rèn luyện. Sinh viên cần hoàn thành tối thiểu 15 tín chỉ/kỳ, GPA học kỳ từ 2,5, không có học phần F và rèn luyện từ loại khá. Mức theo xếp loại: loại Khá bằng 100%, loại Giỏi 105%, loại Xuất sắc 110% mức học phí một học kỳ; nếu đủ nhiều loại thì chỉ nhận mức cao nhất.',
        academicYear: 'Từ năm học 2026–2027',
        sourceUrl: 'https://tump.edu.vn/uploads/media/1764_Ban_hanh_Quy_dinh_xet_cap_hoc_bong_doi_voi_sinh_vien_dai_hoc_cao_dang_hinh_thuc_dao_tao_chinh_.pdf',
        additionalSourceUrls: ['https://tump.edu.vn/post/ban-hanh-quy-dinh-xet-cap-hoc-bong-doi-voi-sinh-vien-dai-hoc-cao-dang-hinh-thuc-dao-tao-chinh-quy/page10']
      },
      {
        name: 'Học bổng đầu vào toàn phần hoặc bán phần',
        description: 'Dành cho tân sinh viên đạt thành tích cao trong tuyển sinh/kỳ thi học sinh giỏi; học bổng toàn phần hỗ trợ 100% học phí năm thứ nhất, bán phần hỗ trợ 50%. Số suất phân bổ theo ngành và không vượt quá 5% số sinh viên nhập học ngành đó; duy trì ở các kỳ sau phải đáp ứng điều kiện học tập, rèn luyện theo quy định. Đây là mức hỗ trợ học phí, không phải tiền mặt cố định.',
        academicYear: 'Từ năm học 2026–2027',
        sourceUrl: 'https://tump.edu.vn/uploads/media/1764_Ban_hanh_Quy_dinh_xet_cap_hoc_bong_doi_voi_sinh_vien_dai_hoc_cao_dang_hinh_thuc_dao_tao_chinh_.pdf',
        additionalSourceUrls: ['https://tump.edu.vn/post/ban-hanh-quy-dinh-xet-cap-hoc-bong-doi-voi-sinh-vien-dai-hoc-cao-dang-hinh-thuc-dao-tao-chinh-quy/page10']
      }
    ],
    financialNotes: [
      {
        description: 'Chưa xác minh được đơn giá hoặc tổng học phí chính quy năm học 2026–2027 cho từng ngành từ biểu phí công khai. Thông báo hiện có cho học kỳ I chỉ nêu lịch và cách nộp học phí, không phải bảng đơn giá; không lấy mức 2025–2026 hoặc mức truyền thông ước tính để thay thế.',
        sourceUrl: 'https://tump.edu.vn/post/thong-bao-thu-hoc-phi-he-dai-hoc-hoc-ky-i-nam-hoc-2026-2027',
        additionalSourceUrls: ['https://tump.edu.vn/category/van-ban-ve-hoc-phi-kpdt']
      }
    ]
  },
  'ĐV-028': {
    admissionMethods: [
      {
        name: 'Tuyển thẳng theo quy định của Bộ GD&ĐT',
        description: 'Phương thức 301 trong thông tin tuyển sinh đại học chính quy năm 2026.',
        sourceUrl: 'https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc--Chinh-Quy-Nam-2026-%28Cap-Nhat%29-146.html',
        additionalSourceUrls: ['https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc-Chinh-Quy-Nam-2026-133.html']
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Phương thức 100; xét theo tổ hợp, ngưỡng và chỉ tiêu công bố cho từng ngành/chương trình năm 2026.',
        sourceUrl: 'https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc--Chinh-Quy-Nam-2026-%28Cap-Nhat%29-146.html',
        additionalSourceUrls: ['https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc-Chinh-Quy-Nam-2026-133.html']
      },
      {
        name: 'Xét kết quả học tập THPT',
        description: 'Phương thức 200; cách tính và tổ hợp áp dụng theo thông tin tuyển sinh năm 2026 của từng chương trình.',
        sourceUrl: 'https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc--Chinh-Quy-Nam-2026-%28Cap-Nhat%29-146.html',
        additionalSourceUrls: ['https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc-Chinh-Quy-Nam-2026-133.html']
      },
      {
        name: 'Xét kết quả thi đánh giá năng lực HSA hoặc SPT',
        description: 'Phương thức 402; sử dụng kết quả kỳ thi đánh giá năng lực của ĐHQG Hà Nội hoặc Trường Đại học Sư phạm Hà Nội, theo ngành/chương trình có áp dụng.',
        sourceUrl: 'https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc--Chinh-Quy-Nam-2026-%28Cap-Nhat%29-146.html',
        additionalSourceUrls: ['https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc-Chinh-Quy-Nam-2026-133.html']
      },
      {
        name: 'Xét kết quả kỳ thi V-SAT-TNU',
        description: 'Phương thức 417; sử dụng kết quả thi đánh giá đầu vào đại học trên máy tính của Đại học Thái Nguyên, theo ngành/chương trình có áp dụng.',
        sourceUrl: 'https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc--Chinh-Quy-Nam-2026-%28Cap-Nhat%29-146.html',
        additionalSourceUrls: ['https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc-Chinh-Quy-Nam-2026-133.html']
      }
    ],
    scholarships: [
      {
        name: 'Học bổng đầu vào và học bổng đối tác năm 2026',
        description: 'Thông báo năm 2026 nêu 50 suất học bổng tân sinh viên, mỗi suất 6 triệu đồng; học bổng thủ khoa cấp trường/khoa 6–10 triệu đồng; học bổng Hessen 216 EUR; học bổng đối tác thường ở mức 5–10 triệu đồng hoặc hiện vật; và hỗ trợ tân sinh viên khó khăn 1–2 triệu đồng. Số suất, điều kiện và khả năng cộng dồn tùy từng quỹ/đợt, không phải mọi sinh viên đều nhận.',
        academicYear: 'Tuyển sinh 2026; xét theo từng quỹ và thông báo',
        sourceUrl: 'https://tuyensinh.tueba.edu.vn/bai-viet/Truong-Dai-Hoc-Kinh-Te-Va-Quan-Tri-Kinh-Doanh-Cong-Bo-Quy-Hoc-Bong-Chao-Don-Tan-Sinh-Vien-130.html'
      },
      {
        name: 'Học bổng khuyến khích học tập và học bổng chương trình ngoại ngữ',
        description: 'Trường xét học bổng khuyến khích học tập theo kết quả học tập/rèn luyện; thông báo 2026 nêu quỹ theo kỳ có thể lên tới 5 tỷ đồng, mức một suất tối thiểu bằng học phí sinh viên phải đóng. Một số chương trình dạy bằng tiếng Anh/tiếng Trung có học bổng toàn phần hoặc bán phần học phí; điều kiện và suất cụ thể cần theo thông báo của chương trình.',
        academicYear: 'Thông tin công bố cho tuyển sinh 2026; xét theo kỳ/chương trình',
        sourceUrl: 'https://tuyensinh.tueba.edu.vn/bai-viet/Truong-Dai-Hoc-Kinh-Te-Va-Quan-Tri-Kinh-Doanh-Cong-Bo-Quy-Hoc-Bong-Chao-Don-Tan-Sinh-Vien-130.html',
        additionalSourceUrls: ['https://tuyensinh.tueba.edu.vn/tuyen-sinh-dai-hoc-chinh-quy']
      }
    ],
    financialNotes: [
      {
        description: 'Chưa ghi mức học phí đại học chính quy 2026–2027: hướng dẫn nhập học 2026 của trường nói mức thu sẽ được ban hành theo chương trình đào tạo. Các mức tạm thu hoặc học phí của hệ từ xa/VLVH không thay thế biểu phí chính quy.',
        sourceUrl: 'https://tuyensinh.tueba.edu.vn/bai-viet/Huong-Dan--Thu-Tuc-Nhap-Hoc-Dai-Hoc-Chinh-Quy-Nam-2026-155.html',
        additionalSourceUrls: ['https://tuyensinh.tueba.edu.vn/bai-viet/Thong-Tin-Tuyen-Sinh-Dai-Hoc--Chinh-Quy-Nam-2026-%28Cap-Nhat%29-146.html']
      }
    ]
  },
  'ĐV-029': {
    admissionMethods: [
      {
        name: 'Xét kết quả thi tốt nghiệp THPT 2026',
        description: 'Phương thức PT1; xét theo tổ hợp và quy tắc quy đổi/ngưỡng do trường công bố cho kỳ tuyển sinh 2026.',
        sourceUrl: 'https://tuyensinh.tnus.edu.vn/uploads/docs/2026/07/cap-nhat-thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026.pdf'
      },
      {
        name: 'Xét kết quả học tập THPT',
        description: 'Phương thức PT2; dùng điểm trung bình môn cả năm lớp 10, 11, 12 theo tổ hợp và quy tắc quy đổi của trường.',
        sourceUrl: 'https://tuyensinh.tnus.edu.vn/uploads/docs/2026/07/cap-nhat-thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026.pdf'
      },
      {
        name: 'Xét tuyển thẳng',
        description: 'Phương thức PT3 theo quy chế tuyển sinh của Bộ GD&ĐT.',
        sourceUrl: 'https://tuyensinh.tnus.edu.vn/uploads/docs/2026/07/cap-nhat-thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026.pdf'
      },
      {
        name: 'Xét kết quả kỳ thi V-SAT',
        description: 'Phương thức PT4; đề án 2026 nêu ngưỡng điểm V-SAT chưa quy đổi từ 225 trở lên; điểm được quy đổi theo hướng dẫn của Đại học Thái Nguyên.',
        sourceUrl: 'https://tuyensinh.tnus.edu.vn/uploads/docs/2026/07/cap-nhat-thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026.pdf'
      },
      {
        name: 'Xét kết quả HSA hoặc TSA',
        description: 'Phương thức PT5; sử dụng kết quả đánh giá năng lực HSA của ĐHQG Hà Nội hoặc đánh giá tư duy TSA của ĐH Bách khoa Hà Nội, theo ngưỡng và cách quy đổi của đề án 2026.',
        sourceUrl: 'https://tuyensinh.tnus.edu.vn/uploads/docs/2026/07/cap-nhat-thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026.pdf'
      },
      {
        name: 'Xét chuyển học sinh hoàn thành chương trình dự bị đại học',
        description: 'Phương thức PT6; thực hiện theo kế hoạch của Bộ GD&ĐT và quy định chuyển học sinh dự bị đại học.',
        sourceUrl: 'https://tuyensinh.tnus.edu.vn/uploads/docs/2026/07/cap-nhat-thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026.pdf'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng đầu vào K24 năm 2026',
        description: 'Quỹ dự kiến 1,1 tỷ đồng: thủ khoa toàn trường 88 triệu đồng (điểm xét tuyển từ 28, tính ưu tiên; có điều kiện duy trì theo học kỳ); thủ khoa ngành/chương trình 22 triệu đồng (điểm từ 25); thí sinh điểm cao/vượt khó 2 triệu đồng/suất; thí sinh tuyển thẳng được thưởng 2 triệu đồng. Hai học bổng thủ khoa có điều kiện duy trì học tập/rèn luyện và cam kết học toàn khóa; không đồng thời nhận học bổng đầu vào khác của K24.',
        academicYear: 'Tuyển sinh năm 2026, khóa K24',
        sourceUrl: 'https://tuyensinh.tnus.edu.vn/learning-condition/hoc-bong-dau-vao-cho-sinh-vien-khoa-24-tuyen-sinh-nam-2026'
      },
      {
        name: 'Miễn/giảm học phí, hỗ trợ chi phí học tập và trợ cấp xã hội',
        description: 'Trường công bố các chế độ năm 2026 cho nhóm người có công, sinh viên khuyết tật/mồ côi, một số đối tượng dân tộc thiểu số và hoàn cảnh khó khăn. Tùy đối tượng có thể được miễn 100%, giảm 70% hoặc 50% học phí, hỗ trợ chi phí học tập hay trợ cấp xã hội; phải nộp minh chứng và xét theo quy định, không mặc định áp dụng đại trà.',
        academicYear: 'Chính sách công bố năm 2026; xét theo đối tượng và hồ sơ',
        sourceUrl: 'https://tuyensinh.tnus.edu.vn/learning-condition/chinh-sach-uu-dai-cua-tnus-nam-2026'
      }
    ],
    financialNotes: [
      {
        description: 'Chưa xác minh được biểu đơn giá học phí theo tín chỉ hoặc tổng học phí năm 2026–2027. Hướng dẫn nhập học chỉ nêu mức tạm thu học kỳ I là 10 triệu đồng với thí sinh không thuộc diện chính sách và 3,5 triệu đồng với thí sinh thuộc diện chính sách; đây là khoản tạm thu học kỳ, không phải học phí năm hoặc đơn giá chính thức.',
        sourceUrl: 'https://tuyensinh.tnus.edu.vn/article/huong-dan-thu-tuc-nhap-hoc-nam-hoc-2026',
        additionalSourceUrls: ['https://tuyensinh.tnus.edu.vn/learning-condition/chinh-sach-uu-dai-cua-tnus-nam-2026']
      }
    ]
  },
  'ĐV-030': {
    admissionMethods: [
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Một trong bốn phương thức tuyển sinh đại học chính quy năm 2026; ngưỡng và tổ hợp theo ngành.',
        sourceUrl: 'https://tuyensinh.ictu.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026',
        additionalSourceUrls: ['https://tuyensinh.ictu.edu.vn/tuyen-sinh/chinh-quy']
      },
      {
        name: 'Xét kết quả học tập THPT',
        description: 'Xét học bạ theo điểm các môn/tổ hợp và điều kiện đầu vào công bố trong thông tin tuyển sinh năm 2026.',
        sourceUrl: 'https://tuyensinh.ictu.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026',
        additionalSourceUrls: ['https://tuyensinh.ictu.edu.vn/tuyen-sinh/chinh-quy']
      },
      {
        name: 'Xét kết quả kỳ thi đánh giá năng lực V-SAT',
        description: 'Dùng kết quả kỳ thi V-SAT theo điều kiện, cách quy đổi và ngành áp dụng trong đề án 2026.',
        sourceUrl: 'https://tuyensinh.ictu.edu.vn/tuyen-sinh/chinh-quy'
      },
      {
        name: 'Xét tuyển thẳng',
        description: 'Theo quy chế tuyển sinh của Bộ GD&ĐT và hướng dẫn hồ sơ, thời hạn do ICTU công bố năm 2026.',
        sourceUrl: 'https://tuyensinh.ictu.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng đầu vào chương trình IT Global và AI Global',
        description: 'Thông tin tuyển sinh 2026 nêu 5 suất, mỗi suất 8,5 triệu đồng cho tân sinh viên xuất sắc có IELTS từ 6.5 hoặc tương đương. Chỉ áp dụng cho các chương trình được nêu; không phải học bổng chung cho mọi ngành ICTU.',
        academicYear: 'Tuyển sinh 2026; điều kiện IELTS 6.5 hoặc tương đương',
        sourceUrl: 'https://iit.ictu.edu.vn/vien-dao-tao-quoc-te-tuyen-sinh-2026/',
        additionalSourceUrls: ['https://tuyensinh.ictu.edu.vn/tuyen-sinh/chinh-quy/chuong-trinh/cong-nghe-thong-tin-quoc-te-it-global']
      },
      {
        name: 'Học bổng khuyến khích học tập của Viện Đào tạo Quốc tế',
        description: 'Viện công bố xét học bổng khuyến khích học tập hằng kỳ cho sinh viên có thành tích tốt; mức tiền và tiêu chí chi tiết cần theo thông báo từng kỳ.',
        academicYear: 'Cơ chế được nêu trong thông tin tuyển sinh 2026; xét theo kỳ',
        sourceUrl: 'https://iit.ictu.edu.vn/vien-dao-tao-quoc-te-tuyen-sinh-2026/'
      },
      {
        name: 'Học bổng chương trình song bằng KPMKN và cơ hội trao đổi tại KNU',
        description: 'Trang chương trình 2026 nêu cơ hội giảm 50% học phí kỳ đầu và học bổng trao đổi khoảng 70 triệu đồng tại Đại học Quốc gia Kyungpook; đây là cơ hội gắn với chương trình song bằng/trao đổi, không phải mức bảo đảm cho sinh viên mọi ngành.',
        academicYear: 'Chương trình tuyển sinh 2026; điều kiện theo chương trình và đối tác',
        sourceUrl: 'https://tuyensinh.ictu.edu.vn/tuyen-sinh/chinh-quy/chuong-trinh/ky-thuat-phan-mem-song-bang-dhqg-kyungpook-han-quoc'
      },
      {
        name: 'Học bổng khóa đào tạo Samsung Innovation Campus',
        description: 'ICTU được phân bổ 350 suất học bổng toàn phần trong chương trình đào tạo Samsung Innovation Campus 2026. Đây là học bổng cho khóa đào tạo công nghệ, không phải miễn học phí đại học; đợt đăng ký theo thông báo năm 2026 đã kết thúc.',
        academicYear: 'Đợt 2026; thời hạn đăng ký đã qua',
        sourceUrl: 'https://tuyensinh.ictu.edu.vn/tin-tuc/350-suat-hoc-bong-toan-phan-samsung-innovation-campus-2026-danh-cho-sinh-vien-ictu'
      }
    ],
    tuition: [
      {
        programName: 'Đại học chính quy ICTU — dải học phí tổng quan, tùy ngành',
        academicYear: '2026',
        annualMinVnd: 15000000,
        annualMaxVnd: 30000000,
        note: 'Góc phụ huynh tuyển sinh ICTU công bố học phí năm 2026 dao động 15–30 triệu đồng/năm tùy ngành. Đây là dải tham khảo chung; cần xem bảng học phí 2026 theo ngành/chương trình để xác định mức cá nhân.',
        sourceUrl: 'https://tuyensinh.ictu.edu.vn/goc-phu-huynh'
      }
    ],
    financialNotes: [
      {
        description: 'Ngoài học bổng, ICTU giới thiệu khoản vay vốn sinh viên lãi suất 0% qua Ngân hàng Chính sách Xã hội, tối đa 4 triệu đồng/tháng; đây là khoản vay, không phải học bổng. Học phí 2026 được nêu ở mức 15–30 triệu đồng/năm tùy ngành, nên đối chiếu bảng chi tiết theo đúng chương trình.',
        sourceUrl: 'https://tuyensinh.ictu.edu.vn/goc-phu-huynh'
      }
    ]
  },
  'ĐV-031': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng, ưu tiên xét tuyển',
        description: 'Áp dụng cho mọi ngành trong tuyển sinh 2026; chỉ tiêu tối đa 10% mỗi ngành, xét theo giải và lĩnh vực phù hợp.',
        sourceUrl: 'https://tuyensinh.hueuni.edu.vn/News/Detail/cac-phuong-thuc-tuyen-sinh-dai-hoc-he-chinh-quy-cua-dai-hoc-hue-nam-2026_20260226073154'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Áp dụng cho tất cả ngành; dùng kết quả thi THPT năm 2026 và tổ hợp của từng ngành.',
        sourceUrl: 'https://tuyensinh.hueuni.edu.vn/News/Detail/cac-phuong-thuc-tuyen-sinh-dai-hoc-he-chinh-quy-cua-dai-hoc-hue-nam-2026_20260226073154'
      },
      {
        name: 'Xét học bạ THPT',
        description: 'Chỉ áp dụng cho các ngành/trường thành viên được nêu trong thông báo 2026; không phải mọi ngành Đại học Huế.',
        sourceUrl: 'https://tuyensinh.hueuni.edu.vn/News/Detail/cac-phuong-thuc-tuyen-sinh-dai-hoc-he-chinh-quy-cua-dai-hoc-hue-nam-2026_20260226073154'
      },
      {
        name: 'Xét kết quả kỳ thi đánh giá năng lực',
        description: 'Nhận kết quả các kỳ thi ĐGNL của ĐHQG Hà Nội, ĐHQG TP.HCM, Đại học Sư phạm Hà Nội và Đại học Sư phạm TP.HCM; từng kỳ thi chỉ dùng cho trường/ngành được quy định.',
        sourceUrl: 'https://tuyensinh.hueuni.edu.vn/News/Detail/cac-phuong-thuc-tuyen-sinh-dai-hoc-he-chinh-quy-cua-dai-hoc-hue-nam-2026_20260226073154'
      },
      {
        name: 'Xét tuyển kết hợp',
        description: 'Kết hợp kết quả thi THPT hoặc học bạ với chứng chỉ ngoại ngữ tại các trường/ngành được công bố; điều kiện áp dụng khác nhau theo đơn vị.',
        sourceUrl: 'https://tuyensinh.hueuni.edu.vn/News/Detail/cac-phuong-thuc-tuyen-sinh-dai-hoc-he-chinh-quy-cua-dai-hoc-hue-nam-2026_20260226073154'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng hỗ trợ sinh viên có hoàn cảnh khó khăn năm 2026',
        description: 'Đại học Huế cùng đơn vị tài trợ đã trao 225 suất, mỗi suất 2.000.000 đồng, tổng trị giá 450.000.000 đồng vào tháng 8/2026. Đây là đợt hỗ trợ đã trao cho sinh viên khó khăn, không phải suất đầu vào được bảo đảm cho mọi tân sinh viên.',
        academicYear: 'Đợt trao ngày 15/08/2026',
        sourceUrl: 'https://hueuni.edu.vn/portal/vi/index.php/News/trao-225-suat-hoc-bong-cho-sinh-vien-dai-hoc-hue.html'
      }
    ],
    tuition: [],
    financialNotes: [
      {
        description: 'Đại học Huế là đơn vị quản lý chung; biểu phí thực thu phải đối chiếu theo trường thành viên, chương trình và khóa tuyển sinh. Không dùng mức khung/nhóm ngành trong workbook thay cho biểu phí của từng trường.',
        sourceUrl: 'https://tuyensinh.hueuni.edu.vn/News/Detail/cac-phuong-thuc-tuyen-sinh-dai-hoc-he-chinh-quy-cua-dai-hoc-hue-nam-2026_20260226073154'
      }
    ]
  },
  'ĐV-032': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng, ưu tiên xét tuyển',
        description: 'Theo quy chế tuyển sinh 2026; chỉ tiêu tối đa 10% mỗi ngành.',
        sourceUrl: 'https://tuyensinh.husc.edu.vn/thongbao.php?id=63'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Dùng điểm thi THPT 2026 theo tổ hợp và điều kiện của ngành.',
        sourceUrl: 'https://tuyensinh.husc.edu.vn/thongbao.php?id=63'
      },
      {
        name: 'Xét học bạ THPT',
        description: 'Dùng kết quả học tập THPT theo tổ hợp và yêu cầu cụ thể trong thông báo tuyển sinh 2026.',
        sourceUrl: 'https://tuyensinh.husc.edu.vn/thongbao.php?id=63'
      },
      {
        name: 'Xét kết quả thi đánh giá năng lực',
        description: 'Dùng kết quả kỳ thi ĐGNL của ĐHQG Hà Nội hoặc ĐHQG TP.HCM; phạm vi ngành theo đề án 2026, có ngoại lệ đối với ngành Kiến trúc.',
        sourceUrl: 'https://tuyensinh.husc.edu.vn/thongbao.php?id=63',
        additionalSourceUrls: ['https://tuyensinh.hueuni.edu.vn/News/Detail/cac-phuong-thuc-tuyen-sinh-dai-hoc-he-chinh-quy-cua-dai-hoc-hue-nam-2026_20260226073154']
      },
      {
        name: 'Xét tuyển kết hợp',
        description: 'Kết hợp điểm thi THPT hoặc học bạ với chứng chỉ ngoại ngữ ở ngành áp dụng; ngành Kiến trúc có thể dùng điểm thi năng khiếu theo phương án công bố.',
        sourceUrl: 'https://tuyensinh.husc.edu.vn/thongbao.php?id=63'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng đầu vào năm học 2026–2027',
        description: 'Tân sinh viên diện tuyển thẳng hoặc thủ khoa ngành đạt từ 26/30 điểm (không tính điểm ưu tiên/điểm cộng) được 100% học phí học kỳ I; thủ khoa ngành đạt 25 đến dưới 26 được 50%; thí sinh đạt từ 25 điểm được 25%. Thủ khoa toàn trường được tối thiểu 20 triệu đồng từ các nguồn học bổng/miễn giảm. Trường cấp học bổng chung vào đầu học kỳ II sau khi hoàn thành học kỳ I và đăng ký học kỳ II.',
        academicYear: 'Tuyển sinh 2026, năm học 2026–2027',
        sourceUrl: 'https://tuyensinh.husc.edu.vn/thongbao.php?id=67'
      },
      {
        name: 'Học bổng ngành và học bổng tài trợ',
        description: 'Ngoài chính sách chung, trường công bố các suất theo ngành và học bổng từ tổ chức/cá nhân cho sinh viên học tập, rèn luyện tốt hoặc có hoàn cảnh khó khăn. Ví dụ Khoa Hóa học có 10 suất khuyến học mỗi năm, mỗi suất 2–3 triệu đồng; số lượng và tiêu chí ngành khác theo thông báo riêng.',
        academicYear: 'Năm học 2026–2027; từng ngành/đợt có điều kiện riêng',
        sourceUrl: 'https://tuyensinh.husc.edu.vn/thongbao.php?id=67'
      }
    ],
    tuition: [],
    financialNotes: [
      {
        description: 'Chưa xác minh được biểu phí chính thức 2026–2027 theo ngành của Trường Đại học Khoa học. Các mức khung tính theo nhóm ngành trong workbook không được coi là học phí thực thu của trường.',
        sourceUrl: 'https://tuyensinh.husc.edu.vn/thongbao.php?id=67'
      }
    ]
  },
  'ĐV-033': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng, ưu tiên xét tuyển',
        description: 'Theo Điều 8 của quy chế hiện hành và thông báo Đại học Huế; trường nêu dự kiến 2% chỉ tiêu ưu tiên xét chuyển cho học sinh hoàn thành dự bị đại học.',
        sourceUrl: 'https://tuyensinh.dhsphue.edu.vn/Modules/Tintuc/front_detail_news.aspx?idmenu=135&idnews=1282'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Dùng điểm thi THPT 2026 cho tất cả ngành/chương trình; ngành đào tạo giáo viên còn phụ thuộc ngưỡng đầu vào do Bộ công bố.',
        sourceUrl: 'https://tuyensinh.dhsphue.edu.vn/Modules/Tintuc/front_detail_news.aspx?idmenu=135&idnews=1282'
      },
      {
        name: 'Xét học bạ THPT',
        description: 'Chỉ áp dụng cho Hệ thống thông tin, Tâm lý học giáo dục và các chương trình Vật lý kỹ thuật được nêu trong kế hoạch 2026.',
        sourceUrl: 'https://tuyensinh.dhsphue.edu.vn/Modules/Tintuc/front_detail_news.aspx?idmenu=135&idnews=1282'
      },
      {
        name: 'Xét kết quả thi đánh giá năng lực',
        description: 'Dùng kết quả kỳ thi ĐGNL của ĐHQG TP.HCM và các bài thi của Đại học Sư phạm Hà Nội/TP.HCM; ngành có năng khiếu và phạm vi môn thi theo đề án.',
        sourceUrl: 'https://tuyensinh.dhsphue.edu.vn/Modules/Tintuc/front_detail_news.aspx?idmenu=135&idnews=1282',
        additionalSourceUrls: ['https://tuyensinh.hueuni.edu.vn/News/Detail/cac-phuong-thuc-tuyen-sinh-dai-hoc-he-chinh-quy-cua-dai-hoc-hue-nam-2026_20260226073154']
      },
      {
        name: 'Xét tuyển kết hợp',
        description: 'Kết hợp điểm thi THPT hoặc học bạ với chứng chỉ ngoại ngữ; một số ngành Giáo dục Mầm non/Giáo dục Âm nhạc kết hợp thêm môn năng khiếu theo thông báo 2026.',
        sourceUrl: 'https://tuyensinh.dhsphue.edu.vn/Modules/Tintuc/front_detail_news.aspx?idmenu=135&idnews=1282'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng tài trợ và khuyến khích học tập',
        description: 'Trường thông tin hằng năm có hàng trăm suất học bổng từ nguồn tài trợ của tập thể/cá nhân, tổng trị giá khoảng 1 tỷ đồng. Đây là tổng nguồn hỗ trợ được trường mô tả, không phải định mức mỗi sinh viên; suất và tiêu chí xét theo từng đợt.',
        academicYear: 'Cơ chế hằng năm theo thông tin hỗ trợ sinh viên của trường; không có mức đảm bảo riêng cho khóa 2026',
        sourceUrl: 'https://tuyensinh.dhsphue.edu.vn/Modules/Tintuc/front_detail_news.aspx?idmenu=134&idnews=33'
      }
    ],
    tuition: [],
    financialNotes: [
      {
        description: 'Sinh viên ngành đào tạo giáo viên có thể đăng ký hỗ trợ học phí và chi phí sinh hoạt theo Nghị định 116/2020/NĐ-CP; việc duyệt phụ thuộc hồ sơ, chỉ tiêu và đối tượng. Khoản 7.000.000 đồng trường tạm thu ở học kỳ I năm 2026–2027 đối với nhóm không đăng ký/không thuộc diện hỗ trợ là khoản thu tạm thời, không phải biểu phí cả năm hoặc đơn giá tín chỉ.',
        sourceUrl: 'https://nhaphoc2026.dhsphue.edu.vn/',
        additionalSourceUrls: ['https://tuyensinh.dhsphue.edu.vn/Modules/Tintuc/front_detail_news.aspx?idmenu=135&idnews=1282']
      }
    ]
  },
  'ĐV-034': {
    admissionMethods: [
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Dùng kết quả kỳ thi tốt nghiệp THPT năm 2026.',
        sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TTTS2026_977.pdf'
      },
      {
        name: 'Kết hợp điểm thi THPT với chứng chỉ tiếng Anh quốc tế',
        description: 'Quy đổi chứng chỉ tiếng Anh quốc tế thành điểm môn tiếng Anh theo quy định trong thông tin tuyển sinh 2026.',
        sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TTTS2026_977.pdf'
      },
      {
        name: 'Xét tuyển thẳng',
        description: 'Theo quy chế của Bộ GD&ĐT và phương án dành cho học sinh dự bị Trung ương được nêu trong thông tin tuyển sinh 2026.',
        sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TTTS2026_977.pdf'
      },
      {
        name: 'Xét kết quả thi đánh giá năng lực',
        description: 'Chỉ áp dụng cho Điều dưỡng, Kỹ thuật xét nghiệm y học, Kỹ thuật hình ảnh y học, Hộ sinh, Y tế công cộng và Dinh dưỡng theo kế hoạch 2026.',
        sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TTTS2026_977.pdf'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng Cựu sinh viên Y khoa Huế và Quỹ Giáo dục Huế hiếu học',
        description: 'Năm học 2026–2027, chương trình dành tổng kinh phí 461.000.000 đồng cho 56 sinh viên. Đây là một đợt xét hỗ trợ đã công bố cho sinh viên có hoàn cảnh phù hợp, không phải học bổng đầu vào được bảo đảm cho mọi tân sinh viên; mức mỗi suất tùy hồ sơ.',
        academicYear: '2026–2027; công bố ngày 17/10/2026',
        sourceUrl: 'https://humed.hueuni.edu.vn/tin-tuc/cong-tac-sinh-vien/cuu-sinh-vien-y-khoa-hue-va-quy-giao-duc-hue-hieu-hoc-trao-hoc-bong-cho-56-sinh-vien-3647'
      }
    ],
    tuition: [
      { programName: 'Y khoa', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 59985000, creditVnd: 1935000, note: 'Dự kiến 31 tín chỉ trong năm học 2026–2027; 1.935.000 đồng/tín chỉ, tổng dự kiến 59.985.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' },
      { programName: 'Răng hàm mặt', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 46655000, creditVnd: 1505000, note: 'Dự kiến 31 tín chỉ trong năm học 2026–2027; 1.505.000 đồng/tín chỉ, tổng dự kiến 46.655.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' },
      { programName: 'Dược học', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 50605000, creditVnd: 1745000, note: 'Dự kiến 29 tín chỉ trong năm học 2026–2027; 1.745.000 đồng/tín chỉ, tổng dự kiến 50.605.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' },
      { programName: 'Y học cổ truyền', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 53940000, creditVnd: 1860000, note: 'Dự kiến 29 tín chỉ trong năm học 2026–2027; 1.860.000 đồng/tín chỉ, tổng dự kiến 53.940.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' },
      { programName: 'Y học dự phòng', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 37830000, creditVnd: 1455000, note: 'Dự kiến 26 tín chỉ trong năm học 2026–2027; 1.455.000 đồng/tín chỉ, tổng dự kiến 37.830.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' },
      { programName: 'Kỹ thuật xét nghiệm y học', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 34970000, creditVnd: 1345000, note: 'Dự kiến 26 tín chỉ trong năm học 2026–2027; 1.345.000 đồng/tín chỉ, tổng dự kiến 34.970.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' },
      { programName: 'Kỹ thuật hình ảnh y học', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 37660000, creditVnd: 1345000, note: 'Dự kiến 28 tín chỉ trong năm học 2026–2027; 1.345.000 đồng/tín chỉ, tổng dự kiến 37.660.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' },
      { programName: 'Điều dưỡng', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 36315000, creditVnd: 1345000, note: 'Dự kiến 27 tín chỉ trong năm học 2026–2027; 1.345.000 đồng/tín chỉ, tổng dự kiến 36.315.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' },
      { programName: 'Hộ sinh', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 32550000, creditVnd: 1085000, note: 'Dự kiến 30 tín chỉ trong năm học 2026–2027; 1.085.000 đồng/tín chỉ, tổng dự kiến 32.550.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' },
      { programName: 'Dinh dưỡng', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 30800000, creditVnd: 1100000, note: 'Dự kiến 28 tín chỉ trong năm học 2026–2027; 1.100.000 đồng/tín chỉ, tổng dự kiến 30.800.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' },
      { programName: 'Y tế công cộng', academicYear: '2026–2027, khóa tuyển sinh mới; sinh viên Việt Nam', annualVnd: 29850000, creditVnd: 995000, note: 'Dự kiến 30 tín chỉ trong năm học 2026–2027; 995.000 đồng/tín chỉ, tổng dự kiến 29.850.000 đồng/năm. Không áp dụng cho sinh viên nước ngoài.', sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf' }
    ],
    financialNotes: [
      {
        description: 'Biểu phí là mức dự kiến cho khóa tuyển sinh mới năm học 2026–2027, tính theo tín chỉ và tổng số tín chỉ kế hoạch từng ngành; thông báo nêu không áp dụng cho sinh viên nước ngoài.',
        sourceUrl: 'https://huemed-univ.edu.vn/uploads/Thongbao/TB%20HOC%20PHI_1011.pdf'
      }
    ]
  },
  'ĐV-035': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng, ưu tiên xét tuyển',
        description: 'Theo thông tin tuyển sinh đại học chính quy năm 2026 của HUAF.',
        sourceUrl: 'https://tuyensinh.huaf.edu.vn/thong-bao-dang-ky-xet-tuyen-dai-hoc-he-chinh-quy-nam-2026/'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Dùng kết quả kỳ thi THPT năm 2026 theo tổ hợp và điều kiện của ngành.',
        sourceUrl: 'https://tuyensinh.huaf.edu.vn/thong-bao-dang-ky-xet-tuyen-dai-hoc-he-chinh-quy-nam-2026/'
      },
      {
        name: 'Xét học bạ THPT',
        description: 'Dùng kết quả học tập THPT theo điều kiện và tổ hợp trong thông tin tuyển sinh 2026.',
        sourceUrl: 'https://tuyensinh.huaf.edu.vn/thong-bao-dang-ky-xet-tuyen-dai-hoc-he-chinh-quy-nam-2026/'
      },
      {
        name: 'Xét tuyển kết hợp',
        description: 'Phương thức kết hợp theo tiêu chí, ngành và hồ sơ mà trường quy định trong kế hoạch tuyển sinh 2026.',
        sourceUrl: 'https://tuyensinh.huaf.edu.vn/thong-bao-dang-ky-xet-tuyen-dai-hoc-he-chinh-quy-nam-2026/'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng đầu vào, khuyến khích học tập và tài trợ',
        description: 'Trường nêu thủ khoa toàn trường/ngành nhận 5–10 triệu đồng; quỹ học bổng khuyến khích học tập có kinh phí đến 5 tỷ đồng/năm; học bổng doanh nghiệp/tổ chức có suất đến 20 triệu đồng. Tổng quỹ toàn trường được công bố ở mức 7–8 tỷ đồng/năm; đây là tổng quỹ, không phải mức cấp cho từng sinh viên.',
        academicYear: 'Thông tin tuyển sinh 2026; mức/quyền nhận phụ thuộc tiêu chí và từng đợt',
        sourceUrl: 'https://tuyensinh.huaf.edu.vn/co-hoi-hoc-bong-gia-tri-khi-xet-tuyen-vao-truong-dai-hoc-nong-lam-dai-hoc-hue-ma-xet-tuyen-dhl/'
      },
      {
        name: 'Hỗ trợ theo Nghị định 179/2026/NĐ-CP cho một số ngành kỹ thuật',
        description: 'Thông tin HUAF nêu cơ hội hưởng chính sách đối với Kỹ thuật cơ điện tử và Kỹ thuật cơ sở hạ tầng; mức được trang/khoa công bố là 3,7–5 triệu đồng/tháng tùy nhóm đối tượng. Chỉ áp dụng nếu ngành, hồ sơ và điều kiện pháp lý của người học đáp ứng; không phải học bổng phổ thông cho mọi ngành.',
        academicYear: 'Chính sách năm 2026; có điều kiện ngành và đối tượng',
        sourceUrl: 'https://tuyensinh.huaf.edu.vn/tuyen-sinh-dai-hoc-2026-cua-khoa-co-khi-va-cong-nghe-truong-dai-hoc-nong-lam-dai-hoc-hue/',
        additionalSourceUrls: [
          'https://ckcn.huaf.edu.vn/2026/08/04/gioi-thieu-chuong-trinh-dao-tao-dai-hoc-nganh-ky-thuat-co-so-ha-tang/',
          'https://ckcn.huaf.edu.vn/2015/08/11/gioi-thieu-nganh-ky-thuat-co-dien-tu-tai-khoa-co-khi-cong-nghe-truong-dh-nong-lam-hue/'
        ]
      }
    ],
    tuition: [
      {
        programName: 'Chăn nuôi; Công nghệ kỹ thuật cơ khí; Công nghệ thực phẩm; Đảm bảo chất lượng và an toàn thực phẩm; Khoa học cây trồng; Kỹ thuật cơ điện tử; Kỹ thuật cơ sở hạ tầng; Lâm nghiệp; Nông nghiệp công nghệ cao; Nuôi trồng thủy sản',
        academicYear: '2026–2027, khóa K59 trở về sau',
        creditVnd: 579800,
        note: 'Quyết định 473/QĐ-ĐHNL: mức học phí 579.800 đồng/tín chỉ đối với các ngành liệt kê; áp dụng biểu cohort K59 trở về sau, không quy đổi thành mức năm nếu chưa có số tín chỉ đăng ký.',
        sourceUrl: 'https://huaf.edu.vn/wp-content/uploads/2026/06/QD-473-ngay-26.05.2026-ve-quy-dinh-muc-hoc-phi-nam-hoc-2026-2027.pdf'
      },
      {
        programName: 'Khuyến nông; Kinh doanh và khởi nghiệp nông thôn; Phát triển nông thôn; Quản lý tài nguyên rừng; Quản lý thủy sản',
        academicYear: '2026–2027, khóa K59 trở về sau',
        creditVnd: 597800,
        note: 'Quyết định 473/QĐ-ĐHNL: mức học phí 597.800 đồng/tín chỉ đối với các ngành liệt kê; áp dụng biểu cohort K59 trở về sau, không quy đổi thành mức năm nếu chưa có số tín chỉ đăng ký.',
        sourceUrl: 'https://huaf.edu.vn/wp-content/uploads/2026/06/QD-473-ngay-26.05.2026-ve-quy-dinh-muc-hoc-phi-nam-hoc-2026-2027.pdf'
      },
      {
        programName: 'Thú y',
        academicYear: '2026–2027, khóa K59 trở về sau',
        creditVnd: 601400,
        note: 'Quyết định 473/QĐ-ĐHNL: mức học phí 601.400 đồng/tín chỉ cho ngành Thú y; áp dụng biểu cohort K59 trở về sau, không quy đổi thành mức năm nếu chưa có số tín chỉ đăng ký.',
        sourceUrl: 'https://huaf.edu.vn/wp-content/uploads/2026/06/QD-473-ngay-26.05.2026-ve-quy-dinh-muc-hoc-phi-nam-hoc-2026-2027.pdf'
      },
      {
        programName: 'Địa chính và Quản lý đô thị; Quản lý đất đai',
        academicYear: '2026–2027, khóa K59 trở về sau',
        creditVnd: 525800,
        note: 'Quyết định 473/QĐ-ĐHNL: mức học phí 525.800 đồng/tín chỉ đối với các ngành liệt kê; áp dụng biểu cohort K59 trở về sau, không quy đổi thành mức năm nếu chưa có số tín chỉ đăng ký.',
        sourceUrl: 'https://huaf.edu.vn/wp-content/uploads/2026/06/QD-473-ngay-26.05.2026-ve-quy-dinh-muc-hoc-phi-nam-hoc-2026-2027.pdf'
      }
    ],
    financialNotes: [
      {
        description: 'Học phí nêu theo đồng/tín chỉ và bảng cohort K59 trở về sau; số tiền thực tế mỗi năm phụ thuộc số tín chỉ đăng ký. Không dùng các mức trần/khung ngành trong workbook làm thay mức này.',
        sourceUrl: 'https://huaf.edu.vn/wp-content/uploads/2026/06/QD-473-ngay-26.05.2026-ve-quy-dinh-muc-hoc-phi-nam-hoc-2026-2027.pdf'
      }
    ]
  },
  'ĐV-036': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng',
        description: 'Theo quy chế tuyển sinh của Bộ GD&ĐT năm 2026.',
        sourceUrl: 'https://tuyensinh.hce.edu.vn/5-phuong-thuc-tuyen-sinh-nam-2026/'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Dùng điểm ba môn của tổ hợp thi THPT năm 2026, cộng điểm ưu tiên/điểm cộng theo quy định.',
        sourceUrl: 'https://tuyensinh.hce.edu.vn/5-phuong-thuc-tuyen-sinh-nam-2026/'
      },
      {
        name: 'Kết hợp điểm thi THPT với chứng chỉ ngoại ngữ',
        description: 'Quy đổi chứng chỉ ngoại ngữ thành điểm môn ngoại ngữ, kết hợp điểm thi hai môn còn lại theo phương án 2026.',
        sourceUrl: 'https://tuyensinh.hce.edu.vn/5-phuong-thuc-tuyen-sinh-nam-2026/'
      },
      {
        name: 'Kết hợp học bạ THPT với chứng chỉ ngoại ngữ',
        description: 'Dùng điểm học bạ hai môn trong tổ hợp cùng điểm quy đổi chứng chỉ ngoại ngữ theo điều kiện 2026.',
        sourceUrl: 'https://tuyensinh.hce.edu.vn/5-phuong-thuc-tuyen-sinh-nam-2026/'
      },
      {
        name: 'Xét kết quả thi đánh giá năng lực ĐHQG TP.HCM',
        description: 'Sử dụng kết quả kỳ thi đánh giá năng lực ĐHQG TP.HCM năm 2026 theo ngưỡng và quy tắc quy đổi của trường.',
        sourceUrl: 'https://tuyensinh.hce.edu.vn/5-phuong-thuc-tuyen-sinh-nam-2026/'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng đầu vào chương trình tiêu chuẩn',
        description: 'Theo bảng học bổng tuyển sinh 2026: thí sinh đạt từ 27 điểm được miễn 100% học phí học kỳ I; từ 25 đến dưới 27 điểm được miễn 50% học phí học kỳ I. Điểm xét tuyển tính theo quy định trong bảng; đây là học bổng đầu vào kỳ đầu, khác với xét học bổng ở các kỳ sau.',
        academicYear: 'Tuyển sinh 2026, học kỳ I năm học 2026–2027',
        sourceUrl: 'https://tuyensinh.hce.edu.vn/thong-tin-hoc-bong-tuyen-sinh-nam-2026/'
      },
      {
        name: 'Học bổng chương trình Tài năng và giảng dạy bằng tiếng Anh',
        description: 'Bảng tuyển sinh 2026 nêu mức miễn học phí tối đa 100% toàn khóa nếu đạt từ 27 điểm hoặc IELTS từ 7.0; 75% nếu từ 25,5 điểm hoặc IELTS từ 6.5; 50% nếu từ 24 điểm, IELTS từ 6.0 hoặc đạt học lực giỏi cả ba năm THPT. Từ học kỳ II, việc duy trì xét theo từng học kỳ và yêu cầu kết quả học tập/rèn luyện từ loại Khá; nếu đủ nhiều mức chỉ áp dụng mức cao nhất.',
        academicYear: 'Tuyển sinh 2026; xét duy trì theo từng học kỳ trong khóa học',
        sourceUrl: 'https://tuyensinh.hce.edu.vn/thong-tin-hoc-bong-tuyen-sinh-nam-2026/'
      }
    ],
    tuition: [
      { programName: 'Tài chính – Ngân hàng', programCode: '7340201', academicYear: '2026–2027, khóa tuyển sinh 2026', amount: 12400000, currency: 'VND', note: '12.400.000 đồng/học kỳ; trường công bố mức này không thay đổi trong suốt khóa học 4 năm.', sourceUrl: 'https://tuyensinh.hce.edu.vn/nganh-tai-chinh-ngan-hang/' },
      { programName: 'Kinh tế số', programCode: '7310109', academicYear: '2026–2027, khóa tuyển sinh 2026', amount: 12400000, currency: 'VND', note: '12.400.000 đồng/học kỳ; mức công bố cho chương trình/khóa được giới thiệu trên trang tuyển sinh.', sourceUrl: 'https://tuyensinh.hce.edu.vn/nganh-kinh-te-so/' },
      { programName: 'Kế toán', programCode: '7340301', academicYear: '2026–2027, khóa tuyển sinh 2026', amount: 14000000, currency: 'VND', note: '14.000.000 đồng/học kỳ; mức công bố cho ngành Kế toán năm học 2026–2027.', sourceUrl: 'https://tuyensinh.hce.edu.vn/nganh-ke-toan/' },
      { programName: 'Kiểm toán', programCode: '7340302', academicYear: '2026–2027, khóa tuyển sinh 2026', amount: 10800000, currency: 'VND', note: '10.800.000 đồng/học kỳ; trường công bố mức này không thay đổi trong suốt khóa học 4 năm.', sourceUrl: 'https://tuyensinh.hce.edu.vn/nganh-kiem-toan/' },
      { programName: 'Kinh tế', programCode: '7310101', academicYear: '2026–2027, khóa tuyển sinh 2026', amount: 10800000, currency: 'VND', note: '10.800.000 đồng/học kỳ; mức công bố cho ngành Kinh tế năm học 2026–2027.', sourceUrl: 'https://tuyensinh.hce.edu.vn/nganh-kinh-te/' },
      { programName: 'Kế hoạch đầu tư chất lượng cao', academicYear: '2026–2027, khóa tuyển sinh 2026', amount: 17000000, currency: 'VND', note: '17.000.000 đồng/học kỳ; mức công bố cho chương trình chất lượng cao Kế hoạch đầu tư, không đại diện cho toàn trường.', sourceUrl: 'https://tuyensinh.hce.edu.vn/nganh-ke-hoach-dau-tu-chat-luong-cao/' }
    ],
    financialNotes: [
      {
        description: 'Các trang tuyển sinh công bố mức học phí riêng theo từng ngành/chương trình, thường tính theo học kỳ; các ví dụ ở đây không phải bảng đầy đủ toàn trường. Cần mở trang đúng ngành và xác nhận lại khóa/năm nhập học.',
        sourceUrl: 'https://tuyensinh.hce.edu.vn/5-phuong-thuc-tuyen-sinh-nam-2026/'
      }
    ]
  },
  'ĐV-037': {
    admissionMethods: [
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Phương thức 1 năm 2026; dùng điểm ba môn trong tổ hợp và điều kiện ngoại ngữ theo ngành.',
        sourceUrl: 'https://tuyensinh.huflis.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026_20251231114356'
      },
      {
        name: 'Xét học bạ THPT',
        description: 'Phương thức 2; dùng điểm trung bình ba năm lớp 10–12 theo tổ hợp, kèm điều kiện môn ngoại ngữ khi áp dụng.',
        sourceUrl: 'https://tuyensinh.huflis.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026_20251231114356'
      },
      {
        name: 'Xét tuyển thẳng',
        description: 'Phương thức 3 theo quy chế hiện hành; tiêu chí giải thưởng, môn đạt giải và ngành phù hợp theo thông báo 2026.',
        sourceUrl: 'https://tuyensinh.huflis.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026_20251231114356'
      },
      {
        name: 'Kết hợp điểm thi THPT với chứng chỉ ngoại ngữ',
        description: 'Phương thức 4; quy đổi chứng chỉ ngoại ngữ thành điểm môn ngoại ngữ, kết hợp điểm hai môn thi còn lại; loại chứng chỉ/ngưỡng tùy ngành.',
        sourceUrl: 'https://tuyensinh.huflis.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026_20251231114356'
      },
      {
        name: 'Kết hợp học bạ THPT với chứng chỉ ngoại ngữ',
        description: 'Phương thức 5; kết hợp học bạ hai môn còn lại với điểm quy đổi chứng chỉ ngoại ngữ; chứng chỉ và ngưỡng phụ thuộc ngành.',
        sourceUrl: 'https://tuyensinh.huflis.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026_20251231114356'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng Vì ngày mai tươi sáng 2026–2027',
        description: 'Đợt dành cho tân sinh viên khóa 23 chính quy có thường trú tại TP Huế hoặc Quảng Trị, đạt ngưỡng điểm theo ngành, không hưởng diện miễn/giảm học phí hoặc hỗ trợ sư phạm; trường giới thiệu tối đa 20 hồ sơ, nhà tài trợ dự kiến chọn 7–8 suất. Mỗi suất gồm 6,5 triệu đồng học phí/học kỳ, 1,4 triệu đồng sinh hoạt phí/tháng trong 5 tháng mỗi học kỳ và 5 triệu đồng phát triển kỹ năng/năm; duy trì đến 8 học kỳ nếu kết quả không giảm.',
        academicYear: '2026–2027; đợt tuyển hồ sơ tháng 9/2026',
        sourceUrl: 'https://tuyensinh.huflis.edu.vn/tin-tuc/hoc-bong-vi-ngay-mai-tuoi-sang-2026-2027'
      },
      {
        name: 'Học bổng khuyến khích học tập',
        description: 'Trường công bố trích 8% nguồn thu học phí và tiền cấp bù miễn/giảm học phí cho sinh viên chính quy có kết quả học tập, rèn luyện từ Khá trở lên và không bị kỷ luật từ mức khiển trách. Năm 2024–2025 trường báo cáo 784 lượt học bổng, tổng 8.846.075.000 đồng; đây là kết quả lịch sử, không phải mức đảm bảo năm 2026–2027.',
        academicYear: 'Cơ chế tuyển sinh 2026; số liệu trao năm học 2024–2025',
        sourceUrl: 'https://tuyensinh.huflis.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026_20251231114356'
      }
    ],
    tuition: [
      {
        programName: 'Sư phạm Tiếng Anh; Sư phạm Tiếng Pháp; Sư phạm Tiếng Trung Quốc',
        academicYear: 'Khóa tuyển sinh 2026; mức dự kiến',
        annualMinVnd: 17900000,
        annualMaxVnd: 23290000,
        note: 'Thông tin tuyển sinh 2026 dự kiến khoảng 17.900.000–23.290.000 đồng/năm, tương đương 550.000–685.000 đồng/tín chỉ tùy khóa và số tín chỉ. Sinh viên đủ điều kiện, đăng ký và được duyệt hỗ trợ theo Nghị định 116/2020/NĐ-CP có thể được hỗ trợ học phí; không tự động áp dụng cho mọi người học.',
        sourceUrl: 'https://tuyensinh.huflis.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026_20251231114356'
      },
      {
        programName: 'Ngôn ngữ Anh; Ngôn ngữ Trung Quốc; Ngôn ngữ Nhật; Ngôn ngữ Hàn Quốc; Ngôn ngữ Nga; Ngôn ngữ Pháp; Quốc tế học; Việt Nam học; Hoa Kỳ học; Truyền thông quốc tế',
        academicYear: 'Khóa tuyển sinh 2026; mức dự kiến',
        annualMinVnd: 19100000,
        annualMaxVnd: 26030000,
        note: 'Thông tin tuyển sinh 2026 dự kiến khoảng 19.100.000–26.030.000 đồng/năm, tương đương 570.000–685.000 đồng/tín chỉ. Mức thực nộp phụ thuộc ngành, khóa, số tín chỉ và diện miễn/giảm; đây là dải dự kiến chứ không phải một mức đồng nhất cho các ngành.',
        sourceUrl: 'https://tuyensinh.huflis.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026_20251231114356'
      }
    ],
    financialNotes: [
      {
        description: 'Học phí khóa 2026 được trường nêu là dự kiến theo đơn giá tín chỉ và số tín chỉ học mỗi kỳ; không so sánh bằng một mức cố định cho mọi ngành. Chính sách miễn/giảm và hỗ trợ sư phạm cần xét theo đối tượng, hồ sơ và quy định hiện hành.',
        sourceUrl: 'https://tuyensinh.huflis.edu.vn/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026_20251231114356',
        additionalSourceUrls: ['https://tuyensinh.huflis.edu.vn/tin-tuc/xet-duyet-che-do-chinh-sach-hoc-ky-1-2026-2027']
      }
    ]
  },
  'ĐV-038': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng, ưu tiên xét tuyển',
        description: 'Theo quy chế tuyển sinh Bộ GD&ĐT năm 2026; đối tượng và ngành phù hợp theo thông báo của trường.',
        sourceUrl: 'https://hul.edu.vn/vi/news/detail/cac-phuong-thuc-tuyen-sinh-va-to-hop-xet-tuyen-vao-truong-dai-hoc-luat-dai-hoc-hue-nam-2026'
      },
      {
        name: 'Xét học bạ THPT',
        description: 'Dùng điểm trung bình cả năm lớp 10, 11, 12 của các môn trong tổ hợp; môn Toán hoặc Ngữ văn phải đạt tối thiểu 6/10 theo kế hoạch 2026.',
        sourceUrl: 'https://hul.edu.vn/vi/news/detail/cac-phuong-thuc-tuyen-sinh-va-to-hop-xet-tuyen-vao-truong-dai-hoc-luat-dai-hoc-hue-nam-2026'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Dùng tổng điểm ba môn trong tổ hợp thi tốt nghiệp THPT năm 2026; Toán hoặc Ngữ văn phải đạt tối thiểu 6/10.',
        sourceUrl: 'https://hul.edu.vn/vi/news/detail/cac-phuong-thuc-tuyen-sinh-va-to-hop-xet-tuyen-vao-truong-dai-hoc-luat-dai-hoc-hue-nam-2026'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng và khen thưởng tuyển sinh 2026',
        description: 'Thủ khoa/á khoa trường nhận 30/20 triệu đồng; thí sinh đạt từ 28 điểm thi THPT (không tính ưu tiên/điểm cộng) nhận học bổng tương đương học phí năm 3; từ 26 đến dưới 28 điểm nhận mức tương đương học phí học kỳ I năm 3; thí sinh được tuyển thẳng theo nhóm giải quốc gia/quốc tế đủ điều kiện nhận học bổng toàn khóa. Một số nhóm có điểm cộng được xét mức tương đương học phí học kỳ I năm 3; nếu đạt nhiều mức chỉ nhận mức cao nhất.',
        academicYear: 'Tuyển sinh 2026; theo điểm thi, diện tuyển thẳng và điều kiện của từng nhóm',
        sourceUrl: 'https://tuyensinh.hul.edu.vn/News/Detail/thong-tin-tuyen-sinh-dai-hoc-he-chinh-quy-nam-2026-cua-truong-dai-hoc-luat-dai-hoc-hue_20260331161546'
      }
    ],
    tuition: [
      {
        programName: 'Luật; Luật Kinh tế',
        academicYear: '2026–2027, khóa tuyển sinh K50',
        annualVnd: 18000000,
        note: 'Mức học phí dự kiến do trường công bố là 18.000.000 đồng/năm/sinh viên cho năm học 2026–2027; mức tăng các năm sau (nếu có) không quá 20% so với năm liền kề.',
        sourceUrl: 'https://tuyensinh.hul.edu.vn/News/Detail/thong-tin-tuyen-sinh-dai-hoc-he-chinh-quy-nam-2026-cua-truong-dai-hoc-luat-dai-hoc-hue_20260331161546'
      }
    ],
    financialNotes: [
      {
        description: 'Hướng dẫn nhập học K50 ghi học phí học kỳ I là 8.400.000 đồng cho 14 tín chỉ. Đây là khoản theo số tín chỉ của học kỳ I; không thay thế mức dự kiến 18 triệu đồng/năm trong thông tin tuyển sinh.',
        sourceUrl: 'https://hul.edu.vn/vi/news/detail/thong-bao-ve-viec-huong-dan-tan-sinh-vien-khoa-50-trung-tuyen-dai-hoc-chinh-quy-nam-2026-nhap-hoc'
      }
    ]
  },
  'ĐV-039': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng, ưu tiên xét tuyển',
        description: 'Theo quy chế tuyển sinh Bộ GD&ĐT và kế hoạch 2026 của Đại học Huế; điều kiện theo đối tượng/ngành.',
        sourceUrl: 'https://tuyensinh.hueuni.edu.vn/News/Detail/cac-phuong-thuc-tuyen-sinh-dai-hoc-he-chinh-quy-cua-dai-hoc-hue-nam-2026_20260226073154'
      },
      {
        name: 'Xét điểm thi THPT kết hợp môn năng khiếu',
        description: 'Tổ hợp có Ngữ văn và hai môn năng khiếu. Sư phạm Mỹ thuật, Hội họa, Thiết kế Đồ họa, Thiết kế Thời trang, Thiết kế Nội thất thi Hình họa và Trang trí; ngành Điêu khắc thi Tượng tròn và Phù điêu. Thí sinh dự kỳ đánh giá năng khiếu của trường và dùng chứng nhận kết quả để đăng ký xét tuyển.',
        sourceUrl: 'https://nghethuathue.edu.vn/tuyen-sinh-dai-hoc/'
      }
    ],
    scholarships: [],
    tuition: [
      {
        programName: 'Sư phạm Mỹ thuật',
        programCode: '7140222',
        academicYear: 'Học kỳ I, năm học 2026–2027',
        creditVnd: 542000,
        note: 'Thông báo thu học phí học kỳ I năm học 2026–2027 áp dụng 542.000 đồng/tín chỉ cho Sư phạm Mỹ thuật.',
        sourceUrl: 'https://ums.nghethuathue.edu.vn/home/gia-han-hoc-phi-hoc-ky-1-nam-hoc-2026-2027/'
      },
      {
        programName: 'Thiết kế Đồ họa; Thiết kế Thời trang; Điêu khắc; Hội họa',
        academicYear: 'Học kỳ I, năm học 2026–2027',
        creditVnd: 518000,
        note: 'Thông báo thu học phí học kỳ I năm học 2026–2027 áp dụng 518.000 đồng/tín chỉ cho các ngành liệt kê.',
        sourceUrl: 'https://ums.nghethuathue.edu.vn/home/gia-han-hoc-phi-hoc-ky-1-nam-hoc-2026-2027/'
      },
      {
        programName: 'Thiết kế Nội thất',
        programCode: '7580108',
        academicYear: 'Học kỳ I, năm học 2026–2027',
        creditVnd: 633000,
        note: 'Thông báo thu học phí học kỳ I năm học 2026–2027 áp dụng 633.000 đồng/tín chỉ cho ngành Thiết kế Nội thất.',
        sourceUrl: 'https://ums.nghethuathue.edu.vn/home/gia-han-hoc-phi-hoc-ky-1-nam-hoc-2026-2027/'
      }
    ],
    financialNotes: [
      {
        description: 'Mức được công bố theo tín chỉ cho học kỳ I năm học 2026–2027; không quy đổi thành học phí năm khi chưa biết số tín chỉ đăng ký. Sổ tay trường nêu có xét học bổng khuyến khích học tập và học bổng tài trợ theo quy định, nhưng chưa xác minh được một thông báo 2026 có mức tiền/chỉ tiêu riêng của trường.',
        sourceUrl: 'https://ums.nghethuathue.edu.vn/home/gia-han-hoc-phi-hoc-ky-1-nam-hoc-2026-2027/',
        additionalSourceUrls: ['https://nghethuathue.edu.vn/wp-content/uploads/2022/12/SO-TAY-SV-%402025_DHN.pdf']
      }
    ]
  },
  'ĐV-040': {
    admissionMethods: [
      {
        name: 'Xét tuyển đại học chính quy qua kế hoạch chung của Đại học Đà Nẵng',
        description: 'Thông báo năm 2026 tổ chức xét tuyển vào các trường thành viên và đơn vị thuộc/trực thuộc. Phương thức, tổ hợp và điều kiện được xác định riêng theo từng cơ sở đào tạo và ngành; Đại học Đà Nẵng không có một bộ phương thức chung thay cho các trường thành viên.',
        sourceUrl: 'https://ts.udn.vn/DHCD/Chinhquy/DHTbao/19360'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng Nhà nước theo Nghị định 179/2026/NĐ-CP tại các ngành đủ điều kiện',
        description: 'Từ tuyển sinh 2026, người học một số ngành/chương trình tại các trường và đơn vị của Đại học Đà Nẵng có thể thuộc diện nhận học bổng ngân sách nhà nước cho khoa học cơ bản, kỹ thuật then chốt và công nghệ chiến lược. Chỉ áp dụng cho chương trình, người học đủ điều kiện theo Nghị định; không phải học bổng mặc định cho mọi trường/ngành và không thay cho học bổng riêng của từng đơn vị.',
        academicYear: 'Từ khóa tuyển sinh 2026; theo ngành/chương trình đủ điều kiện',
        sourceUrl: 'https://ts.udn.vn/DHCD/Chinhquy/DHTbao/19533'
      }
    ],
    financialNotes: [
      {
        description: 'Đại học Đà Nẵng là cơ sở quản lý hệ thống trường thành viên; mức học phí và học bổng tuyển sinh cụ thể phải tra tại trường/ngành/chương trình dự định đăng ký, không áp một mức toàn Đại học Đà Nẵng.',
        sourceUrl: 'https://ts.udn.vn/DHCD/Chinhquy/DHTbao/19360'
      }
    ]
  },
  'ĐV-041': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng theo quy chế tuyển sinh',
        description: 'Một trong 3 phương thức tuyển sinh đại học chính quy năm 2026 của Trường Đại học Bách khoa – Đại học Đà Nẵng.',
        sourceUrl: 'https://dut.udn.vn/Tuyensinh2019/Tintuc/id/11780'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT năm 2026',
        description: 'Một trong 3 phương thức tuyển sinh đại học chính quy năm 2026; tổ hợp và điều kiện cụ thể theo ngành trong thông tin tuyển sinh của trường.',
        sourceUrl: 'https://dut.udn.vn/Tuyensinh2019/Tintuc/id/11780'
      },
      {
        name: 'Xét kết quả thi Đánh giá tư duy của Đại học Bách khoa Hà Nội năm 2026',
        description: 'Một trong 3 phương thức tuyển sinh đại học chính quy năm 2026; áp dụng theo ngành và ngưỡng do trường công bố.',
        sourceUrl: 'https://dut.udn.vn/Tuyensinh2019/Tintuc/id/11780'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng tuyển sinh và vinh danh tân sinh viên khóa 2026',
        description: 'Trường đã trao học bổng 70 triệu đồng cho giải Nhất, 60 triệu đồng cho giải Nhì và 50 triệu đồng cho giải Ba học sinh giỏi quốc gia; thủ khoa toàn trường nhận 40 triệu đồng; 48 thủ khoa ngành/chương trình nhận tổng 480 triệu đồng (10 triệu đồng/người). Đây là kết quả trao của khóa 2026, không phải mức được bảo đảm tự động cho khóa sau.',
        academicYear: 'Tuyển sinh 2026; trao ngày 19/09/2026',
        sourceUrl: 'https://dut.udn.vn/TuyenSinh2017/Tintuc/id/12281'
      },
      {
        name: 'Hỗ trợ tân sinh viên có hoàn cảnh khó khăn',
        description: 'Tại chương trình chào tân sinh viên khóa 2026, trường trao 5 suất, mỗi suất 30 triệu đồng; đây là đợt hỗ trợ cụ thể, không phải định mức học bổng thường niên.',
        academicYear: 'Khóa tuyển sinh 2026; đợt trao ngày 19/09/2026',
        sourceUrl: 'https://dut.udn.vn/TuyenSinh2017/Tintuc/id/12281'
      },
      {
        name: 'Học bổng theo Nghị định 179/2026/NĐ-CP',
        description: 'Người học thuộc chương trình/ngành và điều kiện chính sách có thể được hỗ trợ theo tháng: 5,5 triệu đồng cho chương trình đào tạo tài năng; 4,2 triệu đồng cho vi mạch bán dẫn và một số lĩnh vực khoa học cơ bản; 3,7 triệu đồng cho nhóm kỹ thuật then chốt/công nghệ chiến lược. Phải kiểm tra ngành và điều kiện hưởng theo quy định hiện hành; không cộng gộp vào học phí hoặc coi là học bổng toàn trường.',
        academicYear: 'Áp dụng từ khóa tuyển sinh 2026; theo điều kiện Nghị định',
        sourceUrl: 'https://dut.udn.vn/TrangDaoTaoSDH/Tintuc/id/12208'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình truyền thống – nhóm ngành 1 (các ngành xây dựng, môi trường, tài nguyên và một số ngành hạ tầng/tàu thủy)',
        academicYear: 'Năm học 2026–2027; khóa tuyển sinh 2023–2026',
        creditVnd: 750000,
        note: 'Thông báo mức thu học phí của trường quy định 750.000 đồng/tín chỉ cho khóa 2023–2026 thuộc nhóm ngành 1. Đây là đơn giá theo tín chỉ, không phải học phí năm.',
        sourceUrl: 'https://dut.udn.vn/hoidongtruong/Thongbao/id/12158',
        additionalSourceUrls: ['https://drive.google.com/file/d/1AAYjuxmHKDmEOPIK2w78iBZctvM-XERZ/preview']
      },
      {
        programName: 'Chương trình truyền thống – nhóm ngành 2 (các ngành còn lại)',
        academicYear: 'Năm học 2026–2027; khóa tuyển sinh 2023–2026',
        creditVnd: 900000,
        note: 'Thông báo mức thu học phí của trường quy định 900.000 đồng/tín chỉ cho khóa 2023–2026 thuộc nhóm ngành 2. Đây là đơn giá theo tín chỉ, không phải học phí năm.',
        sourceUrl: 'https://dut.udn.vn/hoidongtruong/Thongbao/id/12158',
        additionalSourceUrls: ['https://drive.google.com/file/d/1AAYjuxmHKDmEOPIK2w78iBZctvM-XERZ/preview']
      },
      {
        programName: 'Chương trình Kỹ sư PFIEV',
        academicYear: 'Năm học 2026–2027; khóa tuyển sinh từ 2022',
        creditVnd: 685000,
        note: 'Đơn giá được thông báo là 685.000 đồng/tín chỉ cho chương trình PFIEV, áp dụng từ khóa tuyển sinh 2022 trở về sau; không quy đổi thành mức năm.',
        sourceUrl: 'https://dut.udn.vn/hoidongtruong/Thongbao/id/12158',
        additionalSourceUrls: ['https://drive.google.com/file/d/1AAYjuxmHKDmEOPIK2w78iBZctvM-XERZ/preview']
      },
      {
        programName: 'Chương trình đào tạo 100% bằng tiếng Anh (Kỹ thuật cơ khí – chuyên ngành Cơ khí hàng không)',
        academicYear: 'Năm học 2026–2027; khóa tuyển sinh 2026',
        creditVnd: 1030000,
        note: 'Đơn giá học phí công bố là 1.030.000 đồng/tín chỉ cho chương trình nêu tên; không phải mức chung cho mọi chương trình tiếng Anh hoặc học phí năm.',
        sourceUrl: 'https://dut.udn.vn/hoidongtruong/Thongbao/id/12158',
        additionalSourceUrls: ['https://drive.google.com/file/d/1AAYjuxmHKDmEOPIK2w78iBZctvM-XERZ/preview']
      },
      {
        programName: 'Chương trình đào tạo tài năng – các ngành được trường liệt kê',
        academicYear: 'Năm học 2026–2027; khóa tuyển sinh 2026',
        creditVnd: 900000,
        note: 'Đơn giá học phí công bố là 900.000 đồng/tín chỉ cho chương trình đào tạo tài năng khóa 2026; danh mục gồm CNTT định hướng Khoa học dữ liệu và AI, Kỹ thuật điện, Điều khiển và tự động hóa, Điện tử – viễn thông, Ô tô, Cơ điện tử và Xây dựng. Không quy đổi thành học phí năm.',
        sourceUrl: 'https://dut.udn.vn/hoidongtruong/Thongbao/id/12158',
        additionalSourceUrls: ['https://drive.google.com/file/d/1AAYjuxmHKDmEOPIK2w78iBZctvM-XERZ/preview']
      }
    ],
    financialNotes: [
      {
        description: 'Các đơn giá trong thông báo áp dụng theo khóa, nhóm ngành và chương trình; khoản thực tế phụ thuộc số tín chỉ đăng ký. Workbook nêu mức triệu đồng/năm chưa được trường xác nhận trong thông báo này nên không dùng thay đơn giá tín chỉ.',
        sourceUrl: 'https://dut.udn.vn/hoidongtruong/Thongbao/id/12158'
      }
    ]
  },
  'ĐV-042': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng',
        description: 'Áp dụng cho các loại hình tiêu chuẩn, tiếng Anh bán phần và toàn phần theo đối tượng, điều kiện của Bộ GD&ĐT và quy chế tuyển sinh 2026 của trường.',
        sourceUrl: 'https://due.udn.vn/vi-vn/daotao/daotaochitiet/id/22895/cid/3419'
      },
      {
        name: 'Xét kết hợp năng lực tiếng Anh và thành tích học tập',
        description: 'Dành cho chương trình tiếng Anh toàn phần/bán phần; kết hợp tiêu chí tiếng Anh với thành tích học tập. Với loại hình bán phần, trường nêu các điều kiện như năng lực ngoại ngữ từ bậc 3, giải khuyến khích HSG tiếng Anh cấp tỉnh hoặc điểm thi THPT môn tiếng Anh từ 6,5; điều kiện và quy đổi chứng chỉ theo thông báo 2026.',
        sourceUrl: 'https://due.udn.vn/vi-vn/daotao/daotaochitiet/id/22895/cid/3419'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT năm 2026',
        description: 'Áp dụng cho loại hình tiêu chuẩn; tổ hợp và cách tính điểm chi tiết theo ngành/chương trình trong thông tin tuyển sinh 2026.',
        sourceUrl: 'https://due.udn.vn/vi-vn/daotao/daotaochitiet/id/22895/cid/3419'
      },
      {
        name: 'Xét kết quả kỳ thi Đánh giá năng lực ĐHQG TP.HCM năm 2026',
        description: 'Áp dụng cho loại hình tiêu chuẩn theo điều kiện và quy đổi trong thông tin tuyển sinh 2026.',
        sourceUrl: 'https://due.udn.vn/vi-vn/daotao/daotaochitiet/id/22895/cid/3419'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập của trường',
        description: 'Trường có xét và cấp học bổng khuyến khích học tập theo học kỳ; điều kiện dựa trên kết quả học tập/rèn luyện và quy định, chỉ tiêu của đợt xét. Trang trường ghi nhận đợt học kỳ II năm 2024–2025 cho khóa 47K có tổng kinh phí 894.537.000 đồng; đây là số liệu lịch sử của một khóa, không phải mức/số suất bảo đảm cho sinh viên mới 2026.',
        academicYear: 'Cơ chế theo học kỳ; ví dụ lịch sử 2024–2025',
        sourceUrl: 'https://due.udn.vn/vi-vn/phongctsv/phongctsvchitiet/id/21008/cid/4680',
        additionalSourceUrls: ['https://due.udn.vn/vi-vn/phong/ctsv/ctsvgioithieu/cid/531']
      },
      {
        name: 'Học bổng từ doanh nghiệp và nhà tài trợ',
        description: 'Phòng Công tác sinh viên của trường có kênh riêng cho học bổng doanh nghiệp và học bổng trường cấp; thông báo từng đợt có đối tượng, hồ sơ, thời hạn và giá trị riêng. Chưa xác minh được một mức học bổng tuyển sinh chung áp dụng cho mọi tân sinh viên khóa 2026.',
        academicYear: 'Theo từng đợt tài trợ; kiểm tra thông báo hiện hành',
        sourceUrl: 'https://due.udn.vn/vi-vn/phong/ctsv/ctsvgioithieu/cid/531',
        additionalSourceUrls: ['https://due.udn.vn/vi-vn/phongctsv/phongctsvds/cid/4680']
      }
    ],
    tuition: [
      {
        programName: 'Chương trình tiêu chuẩn – tất cả chuyên ngành',
        academicYear: 'Năm học 2026–2027; khóa 52K',
        creditVnd: 906710,
        note: 'Đơn giá học phí khối kiến thức chuyên môn cho khóa 52K là 906.710 đồng/tín chỉ. Mức thực đóng phụ thuộc số tín chỉ và học phần đăng ký; không phải mức cố định theo năm.',
        sourceUrl: 'https://due.udn.vn/vi-vn/phong/kehoachtaichinh/kehoachtaichinhchitiet/id/23316/cid/632'
      },
      {
        programName: 'Cử nhân tài năng Ngoại thương – toàn phần tiếng Anh',
        academicYear: 'Năm học 2026–2027; khóa 52K',
        creditVnd: 2033690,
        note: 'Đơn giá học phí công bố là 2.033.690 đồng/tín chỉ; không quy đổi thành học phí năm.',
        sourceUrl: 'https://due.udn.vn/vi-vn/phong/kehoachtaichinh/kehoachtaichinhchitiet/id/23316/cid/632'
      },
      {
        programName: 'Chương trình toàn phần tiếng Anh – Ngoại thương, Marketing số, Thương mại điện tử',
        academicYear: 'Năm học 2026–2027; khóa 52K',
        creditVnd: 1335280,
        note: 'Đơn giá học phí công bố là 1.335.280 đồng/tín chỉ cho các chương trình nêu tên; không phải mức chung cho mọi hệ tiếng Anh.',
        sourceUrl: 'https://due.udn.vn/vi-vn/phong/kehoachtaichinh/kehoachtaichinhchitiet/id/23316/cid/632'
      },
      {
        programName: 'Chương trình bán phần tiếng Anh',
        academicYear: 'Năm học 2026–2027; khóa 52K',
        creditVnd: 1128930,
        note: 'Đơn giá học phí công bố là 1.128.930 đồng/tín chỉ cho các chương trình bán phần tiếng Anh liệt kê trong thông báo; không quy đổi thành mức năm.',
        sourceUrl: 'https://due.udn.vn/vi-vn/phong/kehoachtaichinh/kehoachtaichinhchitiet/id/23316/cid/632'
      }
    ],
    financialNotes: [
      {
        description: 'Học phí được thu theo đơn giá tín chỉ, khóa tuyển sinh và loại hình chương trình. Thông báo năm học 2026–2027 yêu cầu căn cứ số tín chỉ thực học để xác định tiền phải nộp/hoàn trả; các mức triệu đồng/năm trong workbook không thay cho bảng đơn giá chính thức này. Trường thực hiện miễn, giảm cho người học thuộc diện chính sách và người học nhận học bổng theo quy định.',
        sourceUrl: 'https://due.udn.vn/vi-vn/phong/kehoachtaichinh/kehoachtaichinhchitiet/id/23316/cid/632',
        additionalSourceUrls: ['https://due.udn.vn/vi-vn/thongbao/thongbaochitiet/id/23587/bid/456']
      }
    ]
  },
  'ĐV-043': {
    admissionMethods: [
      {
        name: 'Xét tuyển kết hợp điểm thi tốt nghiệp THPT và học bạ',
        description: 'Phương thức 1 năm 2026; trọng số giữa điểm thi và học bạ thay đổi theo lĩnh vực đào tạo. Ngành có môn năng khiếu còn kết hợp điểm thi năng khiếu theo quy định của ngành.',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      },
      {
        name: 'Xét tuyển kết hợp mở rộng với kỳ thi đánh giá năng lực',
        description: 'Phương thức 2 kết hợp kết quả thi ĐGNL của Trường ĐH Sư phạm Hà Nội hoặc Trường ĐH Sư phạm TP.HCM với điểm thi tốt nghiệp THPT và học bạ; điều kiện môn ĐGNL và tổ hợp cụ thể tùy ngành.',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      },
      {
        name: 'Xét tuyển thẳng theo quy chế của Bộ GD&ĐT',
        description: 'Phương thức 3 theo quy chế tuyển sinh hiện hành và đối tượng/điều kiện trong thông tin tuyển sinh UED năm 2026.',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng Tài năng UED 2026',
        description: 'Áp dụng cho 6 chương trình chiến lược được trường liệt kê. Thí sinh phải trúng tuyển và đạt từ 8,0 điểm ở từng môn của tổ hợp theo điểm thi THPT 2026; mỗi chương trình xem xét 2 sinh viên điểm cao nhất, với học bổng toàn phần học phí năm nhất và miễn phí ký túc xá năm nhất. Từ năm hai, duy trì xét cho 2 sinh viên có kết quả học tập cao nhất mỗi chương trình; đây là chính sách có điều kiện, không phải hỗ trợ mặc định.',
        academicYear: 'Tuyển sinh 2026; xét duy trì theo kết quả từng năm học',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      }
    ],
    tuition: [
      {
        programName: 'Các ngành sư phạm, nếu không đăng ký hưởng chính sách hỗ trợ',
        academicYear: 'Năm học 2026–2027 (dự kiến)',
        annualVnd: 17900000,
        note: 'Mức dự kiến 17.900.000 đồng/năm cho các ngành sư phạm đối với người học không đăng ký hưởng hỗ trợ theo Nghị định 116/2020 và quy định sửa đổi liên quan.',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      },
      {
        programName: 'Công nghệ sinh học, Hóa Dược, Hóa học và Hóa phân tích – Ứng dụng',
        academicYear: 'Năm học 2026–2027 (dự kiến)',
        annualVnd: 22195000,
        note: 'Mức dự kiến 22.195.000 đồng/năm cho các ngành/chuyên ngành được nêu tên trong đề án.',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      },
      {
        programName: 'Công nghệ thông tin',
        academicYear: 'Năm học 2026–2027 (dự kiến)',
        annualVnd: 24035000,
        note: 'Mức dự kiến riêng cho ngành Công nghệ thông tin; không dùng làm mức chung cho các ngành kỹ thuật khác.',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      },
      {
        programName: 'Tâm lý học, Công tác xã hội, Địa lý, Văn hóa, Báo chí và Quản lý tài nguyên – môi trường',
        academicYear: 'Năm học 2026–2027 (dự kiến)',
        annualVnd: 21965000,
        note: 'Mức dự kiến 21.965.000 đồng/năm cho các chương trình như Địa lý học/Địa lý du lịch, Văn hóa học, Tâm lý học, Công tác xã hội, Báo chí và Quản lý tài nguyên và môi trường; cần đối chiếu đúng tên ngành trong đề án.',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      },
      {
        programName: 'Văn học, Lịch sử/Quan hệ quốc tế, Hỗ trợ giáo dục người khuyết tật và Quan hệ công chúng',
        academicYear: 'Năm học 2026–2027 (dự kiến)',
        annualVnd: 19100000,
        note: 'Mức dự kiến 19.100.000 đồng/năm cho các ngành/chuyên ngành được liệt kê; không áp dụng mức này cho toàn bộ khối xã hội – nhân văn.',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      },
      {
        programName: 'Nông nghiệp thông minh, Vật lý kỹ thuật và Khoa học dữ liệu',
        academicYear: 'Năm học 2026–2027 (dự kiến)',
        annualVnd: 20900000,
        note: 'Mức dự kiến 20.900.000 đồng/năm cho các chương trình được đề án nêu tên.',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      }
    ],
    financialNotes: [
      {
        description: 'Đề án 2026 ghi các khoản trên là học phí dự kiến năm học 2026–2027. Sinh viên ngành đào tạo giáo viên đăng ký và đủ điều kiện nhận hỗ trợ theo Nghị định 116/2020/NĐ-CP, các văn bản sửa đổi liên quan, có thể được hỗ trợ học phí; không áp dụng mức 17,9 triệu như khoản chắc chắn phải tự đóng cho mọi sinh viên sư phạm.',
        sourceUrl: 'https://tuyensinh.ued.udn.vn/wp-content/uploads/2026/02/DDS.-THONG-TIN-TUYEN-SINH-08.6.2026.pdf'
      }
    ]
  },
  'ĐV-044': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng',
        description: 'Phương thức 1 trong thông tin tuyển sinh chính quy năm 2026; áp dụng theo quy chế Bộ GD&ĐT và điều kiện của từng ngành/chương trình.',
        sourceUrl: 'https://tuyensinh.ufl.udn.vn/wp-content/uploads/2026/03/2026.03.25-Thong-tin-tuyen-sinh-nam-2026.pdf'
      },
      {
        name: 'Xét tuyển kết hợp học bạ THPT và điểm thi tốt nghiệp THPT 2026',
        description: 'Phương thức 2; tổ hợp xét tuyển thay đổi theo ngành và chương trình hợp tác doanh nghiệp. Đề án 2026 công bố nhóm tổ hợp ngoại ngữ tương ứng từng ngành.',
        sourceUrl: 'https://tuyensinh.ufl.udn.vn/wp-content/uploads/2026/03/2026.03.25-Thong-tin-tuyen-sinh-nam-2026.pdf'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng/khen thưởng đầu vào năm 2026',
        description: 'Mức theo thành tích tuyển thẳng: 50 triệu đồng cho thí sinh đạt giải Olympic quốc tế do Bộ GD&ĐT cử đi; 30/20/10 triệu đồng cho giải Nhất/Nhì/Ba học sinh giỏi quốc gia. Ngoài ra có 1 suất thủ khoa trường trị giá 30 triệu và 23 suất thủ khoa ngành/chương trình hợp tác doanh nghiệp, mỗi suất 10 triệu. Nếu đủ nhiều diện, mỗi sinh viên nhận một suất cao nhất; phải hoàn thành chương trình theo điều kiện của trường.',
        academicYear: 'Tuyển sinh 2026',
        sourceUrl: 'https://tuyensinh.ufl.udn.vn/wp-content/uploads/2026/03/2026.03.25-Thong-tin-tuyen-sinh-nam-2026.pdf'
      },
      {
        name: 'Học bổng khuyến khích học tập theo học kỳ',
        description: 'Xét theo kết quả học tập và rèn luyện: mức Khá ít nhất bằng mức trần học phí hiện hành của ngành; loại Giỏi bằng 110% mức Khá; loại Xuất sắc bằng 110% mức Giỏi. Người học phải đạt đồng thời điều kiện học tập và rèn luyện tương ứng, phụ thuộc quy chế và kết quả xét từng kỳ.',
        academicYear: 'Theo từng học kỳ; quy chế trong đề án tuyển sinh 2026',
        sourceUrl: 'https://tuyensinh.ufl.udn.vn/wp-content/uploads/2026/03/2026.03.25-Thong-tin-tuyen-sinh-nam-2026.pdf'
      },
      {
        name: 'Học bổng Bright Scholars của Children Of Vietnam',
        description: 'Trong năm học 2026–2027, trường thông tin chương trình dự kiến dành tối thiểu 8 suất toàn phần cho sinh viên hoàn cảnh khó khăn, nghị lực vươn lên; tổng hỗ trợ 32 triệu đồng/năm gồm học phí, sinh hoạt phí và hoạt động bổ trợ, dự kiến đồng hành 4–5 năm tùy chương trình. Số suất và quyền lợi cần kiểm tra thông báo triển khai chính thức.',
        academicYear: 'Năm học 2026–2027 (dự kiến)',
        sourceUrl: 'https://ufl.udn.vn/tiep-suc-sinh-vien-vuot-kho-cung-hoc-bong-bright-scholars/'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình truyền thống nhóm 1: Nga, Pháp, Thái Lan, Đông phương học, Quan hệ quốc tế, Tiếng Việt và văn hóa Việt Nam',
        academicYear: 'Năm học 2026–2027 (dự kiến)',
        annualVnd: 24800000,
        note: 'Học phí dự kiến 24.800.000 đồng/năm học cho các chương trình được liệt kê trong nhóm 1.',
        sourceUrl: 'https://tuyensinh.ufl.udn.vn/wp-content/uploads/2026/03/2026.03.25-Thong-tin-tuyen-sinh-nam-2026.pdf'
      },
      {
        programName: 'Các chương trình truyền thống còn lại',
        academicYear: 'Năm học 2026–2027 (dự kiến)',
        annualVnd: 26700000,
        note: 'Học phí dự kiến 26.700.000 đồng/năm học cho các chương trình truyền thống còn lại; không đồng nhất với một số học phí chương trình hợp tác doanh nghiệp.',
        sourceUrl: 'https://tuyensinh.ufl.udn.vn/wp-content/uploads/2026/03/2026.03.25-Thong-tin-tuyen-sinh-nam-2026.pdf'
      },
      {
        programName: 'Chương trình hợp tác doanh nghiệp',
        academicYear: 'Năm học 2026–2027 (dự kiến)',
        annualVnd: 26700000,
        note: 'Mức dự kiến năm thứ nhất là 26.700.000 đồng/năm; đề án lưu ý học phí năm thứ tư của nhóm này cao hơn nhóm truyền thống, cần xem lộ trình cụ thể theo chương trình.',
        sourceUrl: 'https://tuyensinh.ufl.udn.vn/wp-content/uploads/2026/03/2026.03.25-Thong-tin-tuyen-sinh-nam-2026.pdf'
      }
    ],
    financialNotes: [
      {
        description: 'Các mức 2026–2027 trong đề án là dự kiến và được thu theo đơn giá tín chỉ nhân số tín chỉ đăng ký. Người học các ngành Sư phạm Tiếng Anh, Sư phạm Tiếng Pháp, Sư phạm Tiếng Trung Quốc hoặc Sư phạm Tiếng Hàn Quốc nếu đăng ký, đủ điều kiện hưởng hỗ trợ theo Nghị định 116 thì không phải nộp học phí theo chính sách này.',
        sourceUrl: 'https://tuyensinh.ufl.udn.vn/wp-content/uploads/2026/03/2026.03.25-Thong-tin-tuyen-sinh-nam-2026.pdf'
      }
    ]
  },
  'ĐV-045': {
    officialCodeAliases: ['DSK'],
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng',
        description: 'Phương thức 1 theo quy chế tuyển sinh của Bộ GD&ĐT và quy định tuyển sinh đại học chính quy năm 2026 của trường.',
        sourceUrl: 'https://ts.udn.vn/files/2026/2026_4_10_49_15_27_dsk_thong_tin_tuyen_sinh_2026_new_09.4.2026_24_ct%C4%91t.pdf'
      },
      {
        name: 'Xét kết hợp điểm thi tốt nghiệp THPT và học bạ',
        description: 'Phương thức 2; sử dụng tổ hợp môn và điều kiện theo từng ngành trong thông tin tuyển sinh DSK năm 2026.',
        sourceUrl: 'https://ts.udn.vn/files/2026/2026_4_10_49_15_27_dsk_thong_tin_tuyen_sinh_2026_new_09.4.2026_24_ct%C4%91t.pdf'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập',
        description: 'Xét theo từng học kỳ cho sinh viên có kết quả học tập và rèn luyện từ loại Khá trở lên; mức và số suất phụ thuộc kết quả xét, quy định và nguồn quỹ từng kỳ.',
        academicYear: 'Theo từng học kỳ',
        sourceUrl: 'https://ts.udn.vn/files/2026/2026_4_10_49_15_27_dsk_thong_tin_tuyen_sinh_2026_new_09.4.2026_24_ct%C4%91t.pdf'
      },
      {
        name: 'Học bổng Thử thách UTE',
        description: 'Trường dự kiến trao 20 suất mỗi năm, trị giá 20 triệu đồng/suất cho sinh viên có thành tích học tập xuất sắc, nghiên cứu khoa học và hoạt động Đoàn; cần kiểm tra quyết định xét của năm học cụ thể.',
        academicYear: 'Theo năm học; đề án tuyển sinh 2026',
        sourceUrl: 'https://ts.udn.vn/files/2026/2026_4_10_49_15_27_dsk_thong_tin_tuyen_sinh_2026_new_09.4.2026_24_ct%C4%91t.pdf'
      },
      {
        name: 'Học bổng đầu vào và hỗ trợ tân sinh viên khóa 2026',
        description: 'Có diện hỗ trợ học phí năm học đầu cho sinh viên hoàn cảnh đặc biệt khó khăn từ nhóm trường THPT được nêu trong đề án; thủ khoa trường được hỗ trợ tương đương học phí năm học 2026–2027 cộng học bổng doanh nghiệp 10 triệu đồng; 2 á khoa được hỗ trợ tương đương học phí học kỳ I cộng 10 triệu đồng mỗi suất; thủ khoa ngành đạt điểm quy đổi từ 25 được xem xét học bổng tương đương học phí học kỳ I. Điều kiện và kết quả xét áp dụng theo đề án, không phải mức tự động cho mọi thí sinh.',
        academicYear: 'Tuyển sinh 2026',
        sourceUrl: 'https://ts.udn.vn/files/2026/2026_4_10_49_15_27_dsk_thong_tin_tuyen_sinh_2026_new_09.4.2026_24_ct%C4%91t.pdf'
      }
    ],
    financialNotes: [
      {
        description: 'Thông tin tuyển sinh DSK năm 2026 ghi học phí sẽ công bố sau. Thông báo thu học phí 2026–2027 đang có áp dụng cho sinh viên các khóa tuyển sinh đến 2025 và cho biết đơn giá phụ thuộc chương trình/ngành/khóa; không dùng các đơn giá khóa cũ hoặc mức workbook làm học phí tân sinh viên 2026.',
        sourceUrl: 'https://ts.udn.vn/files/2026/2026_4_10_49_15_27_dsk_thong_tin_tuyen_sinh_2026_new_09.4.2026_24_ct%C4%91t.pdf',
        additionalSourceUrls: ['https://qldt.ute.udn.vn/thong-bao/thong-bao-ve-viec-thu-hoc-phi-hoc-ky-i-nam-hoc-20262027']
      }
    ]
  },
  'ĐV-046': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng và ưu tiên xét tuyển',
        description: 'Áp dụng theo quy chế tuyển sinh của Bộ GD&ĐT và kế hoạch tuyển sinh VKU năm 2026.',
        sourceUrl: 'https://tuyensinh.vku.udn.vn/thong-bao/699d270922d808765d0d6ad2'
      },
      {
        name: 'Xét tuyển hỗn hợp',
        description: 'Một trong 3 phương thức tuyển sinh chính quy được VKU công bố; xét hồ sơ theo tiêu chí của trường, có nhóm sử dụng điểm thi THPT và kết hợp dữ liệu học tập/thành tích theo thông báo từng ngành.',
        sourceUrl: 'https://vku.udn.vn/vi/vku-tong-ket-cong-tac-tuyen-sinh-nam-2025-san-sang-but-pha-mua-tuyen-sinh-2026/'
      },
      {
        name: 'Phương thức tuyển sinh riêng/đặc thù',
        description: 'Phương thức thứ ba do trường tổ chức theo quy chế tuyển sinh VKU 2026; cổng trường cũng công bố kênh nhận kết quả ĐGNL ĐHQG TP.HCM. Điều kiện, cách quy đổi và ngành áp dụng cần tra thông báo/biểu ngành năm 2026.',
        sourceUrl: 'https://vku.udn.vn/vi/vku-tong-ket-cong-tac-tuyen-sinh-nam-2025-san-sang-but-pha-mua-tuyen-sinh-2026/',
        additionalSourceUrls: ['https://tuyensinh.vku.udn.vn/thong-bao/699d270922d808765d0d6ad2', 'https://tuyensinh.vku.udn.vn/']
      }
    ],
    scholarships: [
      {
        name: 'Học bổng đầu vào thủ khoa, á khoa và nhóm thành tích cao',
        description: 'Chính sách tuyển sinh khóa 2026 công bố: thủ khoa 70 triệu đồng, á khoa 1 là 50 triệu, á khoa 2 là 40 triệu; 10 sinh viên có thành tích xuất sắc tiếp theo (không gồm ba vị trí trên) nhận 25 triệu đồng/suất. Học bổng được khấu trừ vào học phí, không đổi tiền mặt; điều kiện duy trì theo thông báo của trường.',
        academicYear: 'Tuyển sinh khóa 2026',
        sourceUrl: 'https://tuyensinh.vku.udn.vn/thong-bao/699fedf448d97e2c10006596'
      },
      {
        name: 'Học bổng ưu tú và chính sách theo Nghị định 179/2026/NĐ-CP',
        description: 'Người trúng tuyển vào chương trình/ngành đủ điều kiện có thể được xét mức hỗ trợ tối đa 6 triệu đồng/tháng theo chính sách trường; nhóm thiết kế/đóng gói vi mạch bán dẫn được nêu mức 4,2 triệu đồng/tháng và các ngành CNTT/kỹ thuật được liệt kê mức 3,7 triệu đồng/tháng theo Nghị định 179. Có điều kiện về thành tích hoặc điểm thi, nhóm ngành, xếp hạng tuyển sinh và duy trì kết quả; không phải quyền lợi mặc định của mọi sinh viên.',
        academicYear: 'Khóa tuyển sinh 2026; theo điều kiện chính sách',
        sourceUrl: 'https://vku.udn.vn/vi/nhieu-co-hoi-hoc-bong-va-ho-tro-tai-chinh-hap-dan-cho-thi-sinh-lua-chon-vku-trong-mua-tuyen-sinh-nam-2026/',
        additionalSourceUrls: ['https://tuyensinh.vku.udn.vn/thong-bao/699fedf448d97e2c10006596']
      },
      {
        name: 'Hỗ trợ tài chính tương đương học phí cho chương trình/ngành mới',
        description: 'Thông báo khóa 2026 cho phép xét hỗ trợ tương đương 50%–100% học phí trong các học kỳ cho một số ngành/chuyên ngành được nêu tên như Công nghệ tài chính, Thiết kế vi mạch bán dẫn và các chương trình lần đầu tuyển sinh; áp dụng theo điểm, nhóm ngành, giới thiệu và điều kiện xét trong thông báo, không mặc định cho mọi người học.',
        academicYear: 'Tuyển sinh khóa 2026',
        sourceUrl: 'https://tuyensinh.vku.udn.vn/thong-bao/699fedf448d97e2c10006596'
      }
    ],
    tuition: [
      {
        programName: 'Khoảng học phí công bố tổng quan; không thay biểu thu theo tín chỉ từng khóa/ngành',
        academicYear: 'Tuyển sinh 2026; mức tham khảo theo thông tin trường',
        note: 'Trang tuyển sinh VKU công bố mức ưu đãi khoảng 8,5–11,5 triệu đồng/học kỳ. Chưa coi đây là giá trị cố định của mọi ngành hoặc hóa đơn chính xác cho tân sinh viên; cần tra mức theo chương trình và tín chỉ thực đăng ký.',
        sourceUrl: 'https://vku.udn.vn/vi/nhieu-co-hoi-hoc-bong-va-ho-tro-tai-chinh-hap-dan-cho-thi-sinh-lua-chon-vku-trong-mua-tuyen-sinh-nam-2026/'
      }
    ],
    financialNotes: [
      {
        description: 'Thông báo thu học kỳ I năm 2026–2027 có đơn giá theo tín chỉ cho các khóa 2020–2025, không có cột khóa 2026. Không áp đơn giá khóa cũ cho tân sinh viên; hồ sơ nhập học khóa 2026 dẫn chiếu mức thu do Đại học Đà Nẵng ban hành, cần đối chiếu theo chương trình và hóa đơn học kỳ của người học.',
        sourceUrl: 'https://daotao.vku.udn.vn/thong-bao-tai-vu/thong-bao-thu-hoc-phi-hoc-ky-1-nam-hoc-2026-2027-1397.html',
        additionalSourceUrls: ['https://vku.udn.vn/vi/huong-dan-nhap-hoc-doi-voi-thi-sinh-trung-tuyen-dai-hoc-nam-2026/']
      }
    ]
  },
  'ĐV-047': {
    admissionMethods: [
      {
        name: 'Tuyển thẳng, ưu tiên xét tuyển',
        description: 'Phương thức 1 trong thông tin tuyển sinh đại học chính quy năm 2026.',
        sourceUrl: 'https://tuyensinh.ctu.edu.vn/chuong-trinh-dai-tra/177-thong-tin/943-phuong-thuc-xet-tuyen.html'
      },
      {
        name: 'Xét điểm thi tốt nghiệp THPT',
        description: 'Phương thức 2 năm 2026; điều kiện và tổ hợp tùy ngành.',
        sourceUrl: 'https://tuyensinh.ctu.edu.vn/chuong-trinh-dai-tra/177-thong-tin/943-phuong-thuc-xet-tuyen.html'
      },
      {
        name: 'Xét học bạ THPT',
        description: 'Phương thức 3 năm 2026; điều kiện và tổ hợp tùy ngành.',
        sourceUrl: 'https://tuyensinh.ctu.edu.vn/chuong-trinh-dai-tra/177-thong-tin/943-phuong-thuc-xet-tuyen.html'
      },
      {
        name: 'Xét kết quả thi V-SAT',
        description: 'Phương thức 4 năm 2026; điểm được quy đổi theo quy định của trường.',
        sourceUrl: 'https://tuyensinh.ctu.edu.vn/chuong-trinh-dai-tra/177-thong-tin/943-phuong-thuc-xet-tuyen.html'
      },
      {
        name: 'Tuyển chọn chương trình tiên tiến và chất lượng cao',
        description: 'Phương thức 5; điều kiện phụ thuộc chương trình.',
        sourceUrl: 'https://tuyensinh.ctu.edu.vn/chuong-trinh-dai-tra/177-thong-tin/943-phuong-thuc-xet-tuyen.html'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng “Hợp tác và Chia sẻ”',
        description: 'Đợt 2026 có 4 suất toàn phần dự kiến hỗ trợ học phí từng học kỳ và sinh hoạt phí hoặc tiền trọ đến khi tốt nghiệp; dành cho tân sinh viên khóa 52 hoàn cảnh khó khăn, ưu tiên Hóa học, Công nghệ kỹ thuật hóa học và Công nghệ thực phẩm. Hạn nhận hồ sơ 10/09/2026 đã qua; gia hạn ở các năm sau cần chờ thông báo mới.',
        academicYear: '2026',
        sourceUrl: 'https://yu.ctu.edu.vn/thong-bao/3224-dtn-hb-htvcs-2026.html'
      },
      {
        name: 'Học bổng “Khuyến học Đại học Cần Thơ”',
        description: 'Đợt 2026 có 60 suất, mỗi suất 3 triệu đồng cho tân sinh viên khóa 52 hoàn cảnh khó khăn; ưu tiên hộ nghèo, cận nghèo hoặc khuyết tật. Hạn nộp 10/09/2026 đã qua; cần xem thông báo mới cho năm tiếp theo.',
        academicYear: '2026',
        sourceUrl: 'https://yu.ctu.edu.vn/thong-bao/3225-dtn-hb-khdhct-2026.html'
      },
      {
        name: 'Học bổng VietHope Student Development',
        description: 'Dành cho tân sinh viên khóa 52 có thành tích học tập tốt, khó khăn tài chính và nghị lực vươn lên. Mức công bố là 400 USD năm nhất và 200 USD năm hai nếu đáp ứng điều kiện duy trì; số suất do Ban điều hành quyết định theo chất lượng hồ sơ. Lịch trường thông báo mở đơn giữa tháng 09/2026, phỏng vấn tháng 11–12/2026; cần kiểm tra trạng thái tiếp nhận hiện hành.',
        academicYear: '2026',
        sourceUrl: 'https://yu.ctu.edu.vn/thong-bao/3226-dtn-hb-viethope-2026.html'
      },
      {
        name: 'Học bổng Nguyễn Sinh Sắc',
        description: 'Sinh viên thường trú tại Đồng Tháp thuộc hộ nghèo/cận nghèo, học lực từ Khá và rèn luyện từ Tốt; mức 10 triệu đồng/suất/năm học. Đợt nộp 2026 kết thúc 30/09/2026; cần chờ thông báo kỳ tiếp theo.',
        academicYear: '2026–2027',
        sourceUrl: 'https://yu.ctu.edu.vn/thong-bao/3243-dtn-hb-hkhtdt-2026.html'
      }
    ],
    financialNotes: [
      {
        description: 'Bảng học phí chính quy 2026 được công bố riêng theo 127 mã ngành, khoảng 27,38–44 triệu đồng/năm. Với ngành sư phạm, sinh viên đăng ký hưởng hỗ trợ theo Nghị định 116/2020/NĐ-CP không phải đóng học phí; cần kiểm tra điều kiện và hồ sơ hiện hành.',
        sourceUrl: 'https://tuyensinh.ctu.edu.vn/chuong-trinh-tien-tien/178-thong-tin/944-hoc-phi.html'
      }
    ]
  },
  'ĐV-048': {
    admissionMethods: [
      {
        name: 'Xét tuyển tài năng',
        description: 'Bao gồm xét tuyển thẳng theo quy định của Bộ GD&ĐT và các nhóm xét tuyển tài năng theo đề án 2026.',
        sourceUrl: 'https://ts.hust.edu.vn/index.php/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026'
      },
      {
        name: 'Xét điểm thi Đánh giá tư duy (TSA)',
        description: 'Sử dụng kết quả kỳ thi TSA theo điều kiện và chỉ tiêu công bố năm 2026.',
        sourceUrl: 'https://ts.hust.edu.vn/index.php/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026'
      },
      {
        name: 'Xét điểm thi tốt nghiệp THPT',
        description: 'Một trong ba phương thức tuyển sinh cốt lõi năm 2026.',
        sourceUrl: 'https://ts.hust.edu.vn/index.php/tin-tuc/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng Chính phủ theo Nghị định 179/2026/NĐ-CP',
        description: 'Trường công bố 55/68 chương trình đào tạo thuộc danh mục dự kiến được áp dụng chính sách; cần xem danh sách ngành và hướng dẫn chính thức, không mặc định mọi sinh viên đều nhận.',
        academicYear: '2026',
        sourceUrl: 'https://www.hust.edu.vn/vi/news/tin-tuc-su-kien/chi-tiet-55-chuong-trinh-dao-tao-tai-bach-khoa-ha-noi-nhan-hoc-bong-chinh-phu-theo-nghi-dinh-179-2026-655959.html'
      },
      {
        name: 'Học bổng Trần Đại Nghĩa',
        description: 'Đợt học kỳ I năm 2026–2027 dành cho sinh viên có hoàn cảnh kinh tế đặc biệt khó khăn theo nhóm tiêu chí tuyển sinh, kết quả học tập/rèn luyện, mồ côi/không nguồn nuôi dưỡng hoặc rủi ro đột xuất. Mức hỗ trợ theo nhóm là 50% hoặc 100% học phí học kỳ, hoặc 5/10 triệu đồng; có điều kiện loại trừ và hồ sơ minh chứng trong thông báo.',
        academicYear: '2026–2027, học kỳ I',
        sourceUrl: 'https://ctt.hust.edu.vn/DisplayWeb/DisplayBaiViet?baiviet=51636'
      },
      {
        name: 'Học bổng doanh nghiệp và học bổng hỗ trợ sinh viên',
        description: 'Cổng sinh viên HUST đăng các chương trình theo từng đợt, nhà tài trợ và điều kiện riêng; cần mở thông báo hiện hành để kiểm tra hạn nộp.',
        academicYear: '2026–2027',
        sourceUrl: 'https://e.hust.edu.vn/students'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình đại học chính quy chuẩn (theo nhóm ngành)',
        academicYear: '2026–2027',
        creditVnd: 620000,
        note: 'Quyết định học phí 2026–2027 quy định đơn giá 620.000–700.000 đồng/tín chỉ học phí cho chương trình chuẩn, tùy ngành; mức phải nộp phụ thuộc số tín chỉ đăng ký. Không phải mức học phí trọn năm.',
        sourceUrl: 'https://ctt.hust.edu.vn/Upload/Nguy%E1%BB%85n%20Qu%E1%BB%91c%20%C4%90%E1%BA%A1t/files/DTDH_QDQC/Hocphi/2026-2027/12006_Q%C4%90-%C4%90HBK.pdf'
      },
      {
        programName: 'Chương trình đặc biệt và ELITECH',
        academicYear: '2026–2027',
        creditVnd: 680000,
        note: 'Đơn giá khác nhau theo chương trình và loại học phần; quyết định công bố khoảng 680.000–1.020.000 đồng/tín chỉ học phí cho các chương trình đặc biệt/ELITECH. Học phí thực tế phụ thuộc số tín chỉ và chương trình; không quy đổi thành tổng năm nếu chưa biết kế hoạch học.',
        sourceUrl: 'https://ctt.hust.edu.vn/Upload/Nguy%E1%BB%85n%20Qu%E1%BB%91c%20%C4%90%E1%BA%A1t/files/DTDH_QDQC/Hocphi/2026-2027/12006_Q%C4%90-%C4%90HBK.pdf'
      }
    ]
  },
  'ĐV-049': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng',
        description: 'Phân bổ 3% chỉ tiêu tuyển sinh đại học chính quy năm 2026.',
        sourceUrl: 'https://neu.edu.vn/wp-content/uploads/2026/03/Thong-tin-TS-nam-2026-hinh-thuc-dao-tao-DHCQ.pdf'
      },
      {
        name: 'Xét tuyển kết hợp',
        description: 'Gồm bốn phương thức thành phần trong đề án 2026.',
        sourceUrl: 'https://neu.edu.vn/wp-content/uploads/2026/03/Thong-tin-TS-nam-2026-hinh-thuc-dao-tao-DHCQ.pdf'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Đề án 2026 dành tổng cộng 97% chỉ tiêu cho xét tuyển kết hợp và điểm thi THPT; tỷ trọng riêng giữa hai nhóm cần tra theo đề án/ngành.',
        sourceUrl: 'https://neu.edu.vn/wp-content/uploads/2026/03/Thong-tin-TS-nam-2026-hinh-thuc-dao-tao-DHCQ.pdf'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập và học bổng tài trợ',
        description: 'Quy chế riêng của NEU quy định học bổng cho sinh viên chính quy; năm học 2025–2026 trường báo cáo 2.079 lượt học bổng khuyến khích học tập trị giá 26 tỷ đồng và hơn 4 tỷ đồng học bổng doanh nghiệp. Số liệu này là kết quả năm trước, không phải cam kết cho năm sau.',
        academicYear: '2025–2026',
        sourceUrl: 'https://neu.edu.vn/hoi-nghi-tong-ket-cong-tac-sinh-vien-nam-hoc-2025-2026-va-trien-khai-nhiem-vu-trong-tam-nam-hoc-2026-2027/'
      },
      {
        name: 'Quỹ học bổng dự kiến tuyển sinh NEU 2026',
        description: 'Đề án tuyển sinh 2026 dự kiến quỹ học bổng khoảng 30 tỷ đồng, gồm 25 tỷ học bổng khuyến khích học tập và 5 tỷ học bổng doanh nghiệp/tổ chức tài trợ. Đây là quy mô quỹ dự kiến toàn trường, không phải mức hoặc suất bảo đảm cho từng sinh viên.',
        academicYear: '2026',
        sourceUrl: 'https://neu.edu.vn/wp-content/uploads/2026/03/Thong-tin-TS-nam-2026-hinh-thuc-dao-tao-DHCQ.pdf'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình đại học chính quy chuẩn',
        academicYear: '2026–2027 (dự kiến)',
        annualMinVnd: 20000000,
        annualMaxVnd: 28000000,
        note: 'Đề án tuyển sinh 2026 dự kiến học phí chương trình chuẩn khoảng 20–28 triệu đồng/năm, theo ngành/chương trình.',
        sourceUrl: 'https://neu.edu.vn/wp-content/uploads/2026/03/Thong-tin-TS-nam-2026-hinh-thuc-dao-tao-DHCQ.pdf'
      },
      {
        programName: 'Chương trình tiên tiến, chất lượng cao, POHE và đào tạo bằng tiếng Anh',
        academicYear: '2026–2027 (dự kiến)',
        annualMinVnd: 41000000,
        annualMaxVnd: 68000000,
        note: 'Đề án tuyển sinh 2026 dự kiến học phí nhóm chương trình tiên tiến, chất lượng cao, POHE và chương trình bằng tiếng Anh khoảng 41–68 triệu đồng/năm; mức cụ thể tùy chương trình.',
        sourceUrl: 'https://neu.edu.vn/wp-content/uploads/2026/03/Thong-tin-TS-nam-2026-hinh-thuc-dao-tao-DHCQ.pdf'
      }
    ]
  },
  'ĐV-050': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng theo quy định của Bộ GD&ĐT',
        description: 'Phương thức 1 của tuyển sinh khóa 52 năm 2026; xét theo đối tượng và quy định hiện hành của Bộ GD&ĐT và UEH. Thí sinh vẫn phải đăng ký nguyện vọng trên hệ thống chung của Bộ.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        name: 'Xét tuyển tích hợp',
        description: 'Phương thức 2 cho thí sinh Việt Nam chủ yếu kết hợp điểm của một kỳ thi (THPT 2026, ĐGNL ĐHQG-HCM 2026 hoặc V-SAT của ĐH Cần Thơ 2026) theo hệ số 60% với điểm trung bình THPT theo hệ số 40%, cộng điểm cộng/ưu tiên nếu có. Khi có nhiều điểm thi, UEH quy đổi và dùng điểm có lợi nhất; điều kiện khác nhau theo nhóm thí sinh và chương trình.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng tuyển sinh K52 tại TP.HCM (KSA)',
        description: 'Dành cho tân sinh viên quốc tịch Việt Nam có kết quả xét tuyển cao: 50 suất xuất sắc × 27 triệu đồng, 170 suất toàn phần × 18 triệu đồng và 350 suất bán phần × 9 triệu đồng; tổng quỹ công bố 7,56 tỷ đồng. Đây là số suất của KSA, không áp dụng nhầm sang UEH Mekong.',
        academicYear: '2026, khóa 52',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        name: 'Học bổng tuyển sinh K52 tại UEH Mekong (KSV)',
        description: 'Dành cho tân sinh viên Việt Nam học tại Vĩnh Long: 5 suất xuất sắc × 16,5 triệu đồng, 15 suất toàn phần × 11 triệu đồng và 36 suất bán phần × 5,5 triệu đồng. Ba chương trình Công nghệ và Đổi mới sáng tạo, Robot và Trí tuệ nhân tạo (hệ kỹ sư), Kinh doanh nông nghiệp có chính sách học bổng học kỳ đầu riêng cho thí sinh đủ điều kiện từ các tỉnh được nêu trong đề án.',
        academicYear: '2026, khóa 52',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        name: 'Học bổng ưu tiên nhóm máy tính, công nghệ, thiết kế và vận tải',
        description: 'UEH dự kiến cấp học bổng cho 50% sinh viên trúng tuyển vào các chương trình thuộc các lĩnh vực được đề án liệt kê; cơ cấu gồm 50% học bổng toàn phần và 50% bán phần. Phạm vi chương trình và điều kiện áp dụng cần đối chiếu đề án, không suy rộng cho toàn trường.',
        academicYear: '2026, khóa 52',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình tiên tiến quốc tế – học bằng tiếng Việt',
        academicYear: '2026–2027 (mức công bố cho khóa 52)',
        creditVnd: 1400000,
        annualMinVnd: 50000000,
        annualMaxVnd: 55000000,
        note: 'Đơn giá 1,4 triệu đồng/tín chỉ; mức năm tham khảo 50–55 triệu đồng. Phần tiếng Anh và thực hành áp dụng hệ số riêng theo đề án.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        programName: 'Chương trình tiên tiến quốc tế – tiếng Anh bán phần',
        academicYear: '2026–2027 (mức công bố cho khóa 52)',
        annualMinVnd: 55000000,
        annualMaxVnd: 60000000,
        note: 'Mức học phí năm tham khảo do đề án tuyển sinh 2026 công bố; số thực nộp tùy ngành và học phần.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        programName: 'Chương trình tiên tiến quốc tế – tiếng Anh toàn phần',
        academicYear: '2026–2027 (mức công bố cho khóa 52)',
        annualMinVnd: 65000000,
        annualMaxVnd: 75000000,
        note: 'Mức học phí năm tham khảo do đề án tuyển sinh 2026 công bố; số thực nộp tùy ngành và học phần.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        programName: 'Chương trình tiên tiến khối III, VII – tiếng Việt',
        academicYear: '2026–2027 (mức công bố cho khóa 52)',
        creditVnd: 1200000,
        annualMinVnd: 40000000,
        annualMaxVnd: 50000000,
        note: 'Đơn giá 1,2 triệu đồng/tín chỉ; mức năm tham khảo 40–50 triệu đồng. Học phần tiếng Anh và thực hành áp dụng hệ số riêng theo đề án.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        programName: 'Chương trình tiên tiến khối III, VII – tiếng Anh bán phần',
        academicYear: '2026–2027 (mức công bố cho khóa 52)',
        annualMinVnd: 50000000,
        annualMaxVnd: 55000000,
        note: 'Mức học phí năm tham khảo do đề án tuyển sinh 2026 công bố; số thực nộp tùy ngành và học phần.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        programName: 'Chương trình tiên tiến khối III, VII – tiếng Anh toàn phần',
        academicYear: '2026–2027 (mức công bố cho khóa 52)',
        annualMinVnd: 55000000,
        annualMaxVnd: 60000000,
        note: 'Mức học phí năm tham khảo do đề án tuyển sinh 2026 công bố; số thực nộp tùy ngành và học phần.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        programName: 'Chương trình tích hợp chứng chỉ nghề nghiệp quốc tế ACCA/ICAEW',
        academicYear: '2026–2027 (ước tính trong đề án tuyển sinh)',
        creditVnd: 1400000,
        annualMinVnd: 60000000,
        annualMaxVnd: 65000000,
        note: 'Mức năm ước tính 60–65 triệu đồng; đơn giá học phần tiếng Việt 1,4 triệu đồng/tín chỉ và tiếng Anh 1,96 triệu đồng/tín chỉ.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        programName: 'Chương trình song bằng quốc tế',
        academicYear: '2026–2027 (mức từ trong đề án tuyển sinh)',
        annualMinVnd: 70000000,
        note: 'Học phí từ 70 triệu đồng/năm, thay đổi theo chương trình và đối tác quốc tế.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        programName: 'Cử nhân tài năng ISB – Kinh doanh/Công nghệ',
        academicYear: '2026–2027 (ước tính trong đề án tuyển sinh)',
        creditVnd: 1400000,
        annualMinVnd: 70000000,
        annualMaxVnd: 75000000,
        note: 'Mức năm ước tính 70–75 triệu đồng; tùy chương trình và khối lượng tín chỉ.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      },
      {
        programName: 'Chương trình ASIA Co-op',
        academicYear: '2026–2027 (ước tính trong đề án tuyển sinh)',
        creditVnd: 1400000,
        annualMinVnd: 80000000,
        note: 'Mức năm khoảng 80 triệu đồng; phần học phần thực hành/Co-op có đơn giá riêng 3,29 triệu đồng/tín chỉ.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      }
    ],
    financialNotes: [
      {
        description: 'UEH Mekong (mã KSV) công bố mức học phí năm học 2026–2027 bằng 60% mức tại cơ sở chính; áp dụng theo chương trình và đơn giá từng loại học phần. Học phí dự kiến theo năm trong đề án không thay cho hóa đơn hoặc số tiền đăng ký tín chỉ thực tế.',
        sourceUrl: 'https://tuyensinh.ueh.edu.vn/bai-viet/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-ma-truong-ksa-ksv-khoa-52-nam-2026/'
      }
    ]
  },
  'ĐV-051': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng theo quy chế của Bộ GD&ĐT',
        description: 'Phương thức 1, áp dụng cho thí sinh đủ điều kiện theo quy chế tuyển sinh 2026; một số diện học sinh dự bị đại học có thể được xét chuyển theo quy định riêng.',
        sourceUrl: 'https://www.haui.edu.vn/vn/page/ts/detail/67454'
      },
      {
        name: 'Xét học bạ kết hợp giải học sinh giỏi hoặc chứng chỉ quốc tế',
        description: 'Phương thức 2; áp dụng cho thí sinh có giải học sinh giỏi cấp tỉnh/thành phố hoặc chứng chỉ quốc tế đủ điều kiện, kết hợp điểm học tập THPT. Đề án nêu yêu cầu điểm học bạ và tổng điểm thi THPT tối thiểu, cùng bảng quy đổi riêng.',
        sourceUrl: 'https://www.haui.edu.vn/vn/page/ts/detail/67454'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT 2026',
        description: 'Phương thức 3; tổ hợp môn và ngành áp dụng theo bảng của đề án tuyển sinh 2026.',
        sourceUrl: 'https://www.haui.edu.vn/vn/page/ts/detail/67454'
      },
      {
        name: 'Xét điểm thi đánh giá năng lực HSA của ĐHQG Hà Nội',
        description: 'Phương thức 4; đề án yêu cầu điểm HSA từ 75 trở lên và tổng điểm 3 môn THPT theo tổ hợp đạt ít nhất 15/30; chỉ áp dụng cho ngành được liệt kê.',
        sourceUrl: 'https://www.haui.edu.vn/vn/page/ts/detail/67454'
      },
      {
        name: 'Xét điểm thi đánh giá tư duy TSA của ĐH Bách khoa Hà Nội',
        description: 'Phương thức 5; yêu cầu điểm TSA từ 50 trở lên và tổng điểm 3 môn THPT theo tổ hợp đạt ít nhất 15/30; chỉ áp dụng cho ngành được liệt kê.',
        sourceUrl: 'https://www.haui.edu.vn/vn/page/ts/detail/67454'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng đầu vào cho chương trình chuẩn khóa 2026',
        description: 'Đề án chia theo ngành/nhóm ngành: có học bổng toàn khóa cho một số thí sinh đoạt giải/thủ khoa; 30 suất dự kiến miễn 100% học phí năm thứ nhất cho người đạt điểm xét tuyển từ 25; và 61 suất dự kiến miễn 100% học phí học kỳ 1 năm nhất cho người đạt từ 24. Các suất xét theo thứ hạng và nhóm ngành; cần đạt điều kiện duy trì học bổng.',
        academicYear: '2026, khóa nhập học 2026',
        sourceUrl: 'https://www.haui.edu.vn/vn/page/ts/detail/67454'
      },
      {
        name: 'Học bổng đầu vào chương trình đào tạo bằng tiếng Anh',
        description: 'Tổng quỹ dự kiến khoảng 3 tỷ đồng. Mức học bổng gồm 100% học phí toàn khóa cho nhóm đủ tiêu chí giải thưởng/thủ khoa; 15 suất 50% học phí toàn khóa cho thí sinh đạt từ 25; và 15 suất 100% học phí năm thứ nhất cho thí sinh đạt từ 24. Học bổng phân bổ theo nhóm chương trình, có điều kiện duy trì.',
        academicYear: '2026, khóa nhập học 2026',
        sourceUrl: 'https://www.haui.edu.vn/vn/page/ts/detail/67454'
      },
      {
        name: 'Học bổng khuyến khích học tập, Nguyễn Thanh Bình và học bổng doanh nghiệp',
        description: 'Ngoài học bổng đầu vào, trường xét học bổng khuyến khích theo kết quả học tập/rèn luyện từng học kỳ; học bổng Nguyễn Thanh Bình cho một số hoàn cảnh khó khăn hoặc thành tích nghiên cứu; và học bổng tài trợ theo điều kiện từng nhà tài trợ.',
        academicYear: '2026; xét theo học kỳ/đợt',
        sourceUrl: 'https://www.haui.edu.vn/vn/page/ts/detail/67454'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình đào tạo chuẩn',
        academicYear: '2026–2027; khóa nhập học 2026',
        creditVnd: 770000,
        annualMinVnd: 25000000,
        annualMaxVnd: 31000000,
        note: 'Đơn giá 770.000 đồng/tín chỉ học phí; học phí năm thứ nhất ước khoảng 25–31 triệu đồng, chưa gồm học phần giáo dục quốc phòng – an ninh. Mức thực tế tùy ngành và số tín chỉ.',
        sourceUrl: 'https://www.haui.edu.vn/vn/page/ts/detail/67454'
      },
      {
        programName: 'Chương trình đào tạo bằng tiếng Anh',
        academicYear: '2026–2027; khóa nhập học 2026',
        creditVnd: 1100000,
        annualMinVnd: 36000000,
        annualMaxVnd: 44000000,
        note: 'Đơn giá 1.100.000 đồng/tín chỉ học phí; học phí năm thứ nhất ước khoảng 36–44 triệu đồng, chưa gồm học phần giáo dục quốc phòng – an ninh. Mức thực tế tùy ngành và số tín chỉ.',
        sourceUrl: 'https://www.haui.edu.vn/vn/page/ts/detail/67454'
      }
    ]
  },
  'ĐV-052': {
    admissionMethods: [
      {
        name: 'Xét kết quả thi tốt nghiệp THPT 2026',
        description: 'Phương thức mã 100; áp dụng ngưỡng chung và ngưỡng/ngành theo thông báo chính thức của TVU.',
        sourceUrl: 'https://tuyensinh.tvu.edu.vn/dai-hoc-tra-vinh-cong-bo-phuong-an-tuyen-sinh-2026-tuyen-7-415-chi-tieu-qua-4-phuong-thuc/'
      },
      {
        name: 'Xét học bạ THPT',
        description: 'Phương thức mã 200; dựa trên điểm trung bình cả năm lớp 10, 11, 12 của tối thiểu 3 môn theo thang 30. Không áp dụng cho Y khoa, Răng–Hàm–Mặt và Dược học theo thông báo 2026.',
        sourceUrl: 'https://tuyensinh.tvu.edu.vn/dai-hoc-tra-vinh-cong-bo-phuong-an-tuyen-sinh-2026-tuyen-7-415-chi-tieu-qua-4-phuong-thuc/'
      },
      {
        name: 'Xét điểm V-SAT do Đại học Trà Vinh tổ chức',
        description: 'Phương thức mã 416; sử dụng điểm 3 môn trong cùng một đợt thi V-SAT do TVU tổ chức, theo ngưỡng chất lượng và điểm trúng tuyển của trường.',
        sourceUrl: 'https://tuyensinh.tvu.edu.vn/dai-hoc-tra-vinh-cong-bo-phuong-an-tuyen-sinh-2026-tuyen-7-415-chi-tieu-qua-4-phuong-thuc/'
      },
      {
        name: 'Xét điểm V-SAT do đơn vị khác tổ chức',
        description: 'Phương thức mã 417; sử dụng điểm 3 môn trong cùng một đợt V-SAT do đơn vị khác tổ chức, theo ngưỡng chất lượng và điểm trúng tuyển của TVU.',
        sourceUrl: 'https://tuyensinh.tvu.edu.vn/dai-hoc-tra-vinh-cong-bo-phuong-an-tuyen-sinh-2026-tuyen-7-415-chi-tieu-qua-4-phuong-thuc/'
      }
    ],
    scholarships: [
      {
        name: 'Miễn 100% học phí năm thứ nhất cho 13 ngành tuyển sinh 2026',
        description: 'Áp dụng cho tân sinh viên nhập học các ngành: Trí tuệ nhân tạo, Cơ điện tử, Kỹ thuật môi trường, Công nghệ nông nghiệp, Hóa dược, Y tế công cộng, Tâm lý học, Công tác xã hội, Bảo vệ thực vật, Công nghệ kỹ thuật hóa học, Kỹ thuật xây dựng công trình giao thông, Công nghệ sinh học và Chính trị học. Phạm vi miễn là năm thứ nhất, không phải toàn khóa.',
        academicYear: '2026, tân sinh viên',
        sourceUrl: 'https://www.tvu.edu.vn/boc-hanh-trang-san-hoc-bong-khung-2026-cung-dai-hoc-tra-vinh-tvu/',
        additionalSourceUrls: ['https://cce.tvu.edu.vn/dai-hoc-tra-vinh-mien-hoc-phi-nam-nhat-cho-13-nganh-tang-manh-hoc-bong-tuyen-sinh-nam-2026/']
      },
      {
        name: 'Học bổng cho thí sinh đạt giải học thuật, khoa học và cuộc thi',
        description: 'Bài công bố chính sách tuyển sinh 2026 nêu mức thưởng theo cấp và giải: cấp Bộ/quốc gia/quốc tế 20–50 triệu đồng; cấp khu vực 10–25 triệu; cấp tỉnh/trường 5–10 triệu. Các thành viên đội đạt giải được kèm học bổng miễn 100% học phí năm thứ nhất theo điều kiện công bố.',
        academicYear: '2026',
        sourceUrl: 'https://www.tvu.edu.vn/boc-hanh-trang-san-hoc-bong-khung-2026-cung-dai-hoc-tra-vinh-tvu/'
      },
      {
        name: 'Ưu đãi ngành nghệ thuật truyền thống và văn hóa Khmer',
        description: 'Tân sinh viên ngành Biểu diễn nhạc cụ truyền thống được miễn 100% học phí toàn khóa và hỗ trợ sinh hoạt phí 450.000 đồng/tháng. Ngành Văn hóa học, Âm nhạc học và Ngôn ngữ Khmer được nêu mức hỗ trợ 30% học phí toàn khóa.',
        academicYear: '2026',
        sourceUrl: 'https://www.tvu.edu.vn/boc-hanh-trang-san-hoc-bong-khung-2026-cung-dai-hoc-tra-vinh-tvu/'
      },
      {
        name: 'Học bổng 50% học phí toàn khóa cho nữ sinh một số ngành kỹ thuật',
        description: 'Áp dụng theo thông báo 2026 cho nữ sinh đăng ký và nhập học các ngành kỹ thuật được liệt kê: Kỹ thuật xây dựng công trình giao thông, Công nghệ kỹ thuật công trình xây dựng, Công nghệ kỹ thuật cơ khí, Công nghệ kỹ thuật điện–điện tử, Công nghệ kỹ thuật điều khiển và tự động hóa, Công nghệ kỹ thuật ô tô và Công nghệ kỹ thuật hóa.',
        academicYear: '2026',
        sourceUrl: 'https://www.tvu.edu.vn/boc-hanh-trang-san-hoc-bong-khung-2026-cung-dai-hoc-tra-vinh-tvu/'
      },
      {
        name: 'Học bổng tiếng Anh cho Kinh tế Ngoại thương và Kinh tế Du lịch',
        description: 'Tân sinh viên hai chuyên ngành được nêu có thể nhận học bổng tương đương 50% học phí năm thứ nhất nếu đạt chuẩn năng lực tiếng Anh theo thông báo; nguồn trường nêu VSTEP bậc 3 (B1) trở lên hoặc chứng chỉ quốc tế tương đương.',
        academicYear: '2026',
        sourceUrl: 'https://cce.tvu.edu.vn/dai-hoc-tra-vinh-mien-100-hoc-phi-cho-sinh-vien-nam-nhat-13-nganh-hoc-kem-nhieu-chinh-sach-hoc-bong-trong-nam-2026/'
      }
    ],
    financialNotes: [
      {
        description: 'Chương trình tích hợp tiếng Anh EIP ngành Công nghệ thông tin và Quản trị kinh doanh được trường nêu mức giảm 0,5 lần học phí toàn khóa; mức đóng tham khảo sau hỗ trợ tương đương hệ đại trà, khoảng 1.090.000–1.190.000 đồng/tín chỉ. Đây là mức của EIP được nêu trong thông tin tuyển sinh 2026, không đại diện cho học phí của mọi ngành TVU.',
        sourceUrl: 'https://www.tvu.edu.vn/boc-hanh-trang-san-hoc-bong-khung-2026-cung-dai-hoc-tra-vinh-tvu/'
      }
    ]
  },
  'ĐV-053': {
    admissionMethods: [
      {
        name: 'Xét kết quả thi tốt nghiệp THPT 2026',
        description: 'Một trong các phương thức tuyển sinh đại học chính quy năm 2026 của Học viện; tổ hợp/điều kiện theo từng ngành trong thông báo tuyển sinh.',
        sourceUrl: 'https://khoaquanly.naem.edu.vn/tuyen-sinh-2026-tong-hop-chi-tiet-thong-tin-tuyen-sinh-hoc-vien-quan-ly-giao-duc-nam-2026/'
      },
      {
        name: 'Xét học bạ THPT',
        description: 'Học viện nhận hồ sơ xét học bạ theo lịch và hồ sơ công bố cho tuyển sinh năm 2026; nguyện vọng vẫn phải đăng ký trên hệ thống chung của Bộ GD&ĐT.',
        sourceUrl: 'https://khoaquanly.naem.edu.vn/tuyen-sinh-2026-tong-hop-chi-tiet-thong-tin-tuyen-sinh-hoc-vien-quan-ly-giao-duc-nam-2026/'
      },
      {
        name: 'Xét tuyển thẳng theo quy chế của Bộ GD&ĐT',
        description: 'Áp dụng theo quy chế tuyển sinh hiện hành và hướng dẫn hồ sơ riêng của Học viện năm 2026.',
        sourceUrl: 'https://khoaquanly.naem.edu.vn/tuyen-sinh-2026-tong-hop-chi-tiet-thong-tin-tuyen-sinh-hoc-vien-quan-ly-giao-duc-nam-2026/'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập và hỗ trợ người học',
        description: 'Thông tin tuyển sinh 2026 cho biết Học viện duy trì học bổng khuyến khích học tập và hỗ trợ sinh viên khó khăn, sinh viên dân tộc thiểu số; trang được kiểm tra không nêu mức tiền, số suất hoặc ngưỡng năm 2026–2027 nên không suy đoán giá trị cá nhân.',
        academicYear: '2026–2027; mức và tiêu chí chi tiết chưa được nêu trong nguồn tuyển sinh đã kiểm tra',
        sourceUrl: 'https://khoaquanly.naem.edu.vn/tuyen-sinh-2026-tong-hop-chi-tiet-thong-tin-tuyen-sinh-hoc-vien-quan-ly-giao-duc-nam-2026/'
      }
    ],
    financialNotes: [
      {
        description: 'Mức học phí 2026–2027 được thông báo theo tháng, không phải đơn giá năm: 1.790.000 đồng/tháng cho Quản lý giáo dục, Giáo dục học và Quản trị văn phòng; 1.910.000 đồng/tháng cho Ngôn ngữ Anh, Tâm lý học giáo dục và Kinh tế; 2.090.000 đồng/tháng cho Công nghệ thông tin. Không quy đổi thành tổng năm vì nguồn không nêu số tháng thu.',
        sourceUrl: 'https://khoaquanly.naem.edu.vn/tuyen-sinh-2026-tong-hop-chi-tiet-thong-tin-tuyen-sinh-hoc-vien-quan-ly-giao-duc-nam-2026/'
      }
    ]
  },
  'ĐV-059': {
    admissionMethods: [
      {
        name: 'Xét tuyển thẳng theo quy chế Bộ GD&ĐT',
        description: 'Theo điều kiện đối tượng và quy trình trong thông tin tuyển sinh FTU 2026.',
        sourceUrl: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods'
      },
      {
        name: 'Xét kết quả học tập THPT cho nhóm đủ điều kiện',
        description: 'Áp dụng cho các nhóm đối tượng/ chương trình đáp ứng điều kiện của FTU; có thể kết hợp chứng chỉ ngoại ngữ.',
        sourceUrl: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods'
      },
      {
        name: 'Xét kết quả đánh giá năng lực/tư duy trong nước và quốc tế',
        description: 'Điều kiện hồ sơ và cách kết hợp chứng chỉ tùy nhóm phương thức của đề án 2026.',
        sourceUrl: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods'
      },
      {
        name: 'Xét kết quả thi tốt nghiệp THPT',
        description: 'Có lựa chọn xét điểm thi kết hợp chứng chỉ ngoại ngữ cho các chương trình được quy định.',
        sourceUrl: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập A, B, C và D',
        description: 'Quy chế FTU áp dụng từ năm học 2024–2025 nêu: A cho kết quả học tập tốt; B cho tài năng/thủ khoa; C cho sinh viên khó khăn có kết quả tốt; D hỗ trợ dịp Tết cho sinh viên khó khăn có kết quả tốt. Suất và mức cụ thể phụ thuộc điều kiện, cơ sở và thông báo từng kỳ.',
        academicYear: 'Từ 2024–2025; kiểm tra thông báo hiện hành',
        sourceUrl: 'https://cs2.ftu.edu.vn/wp-content/uploads/2025/04/QUY-DINH-VE-HOC-BONG-KHUYEN-KHICH-HOC-TAP-TU-NAM-HOC-2024-2025-TRO-DI-TAI-TRUONG-DAI-HOC-NGOAI-THUONG.pdf'
      },
      {
        name: 'Học bổng hỗ trợ học phí chương trình i-Hons',
        description: 'Trong tuyển sinh 2026, sinh viên theo chương trình i-Hons Kinh doanh quốc tế và Phân tích dữ liệu kinh doanh được trường hỗ trợ khoảng 30% học phí gốc dự kiến 125 triệu đồng/năm; mức dự kiến người học trực tiếp nộp là 88 triệu đồng/năm. Không áp dụng mặc định cho ngành hoặc chương trình FTU khác.',
        academicYear: '2026–2027 (dự kiến)',
        sourceUrl: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods'
      }
    ],
    tuition: [
      {
        programName: 'Chương trình tiêu chuẩn',
        academicYear: '2026–2027 (dự kiến)',
        annualMinVnd: 28000000,
        annualMaxVnd: 32000000,
        note: 'Học phí dự kiến 28–32 triệu đồng/năm.',
        sourceUrl: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods'
      },
      {
        programName: 'Chương trình tích hợp',
        academicYear: '2026–2027 (dự kiến)',
        annualMinVnd: 34000000,
        annualMaxVnd: 39000000,
        note: 'Học phí dự kiến 34–39 triệu đồng/năm.',
        sourceUrl: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods'
      },
      {
        programName: 'Chương trình chất lượng cao',
        academicYear: '2026–2027 (dự kiến)',
        annualMinVnd: 50000000,
        annualMaxVnd: 54000000,
        note: 'Học phí dự kiến 50–54 triệu đồng/năm.',
        sourceUrl: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods'
      },
      {
        programName: 'Chương trình định hướng nghề nghiệp và phát triển quốc tế',
        academicYear: '2026–2027 (dự kiến)',
        annualMinVnd: 50000000,
        annualMaxVnd: 70000000,
        note: 'Học phí dự kiến 50–70 triệu đồng/năm tùy chương trình; một số chương trình Quản trị khách sạn, Marketing số, Truyền thông Marketing tích hợp và Kinh doanh số toàn cầu ở mức 65–70 triệu.',
        sourceUrl: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods'
      },
      {
        programName: 'Chương trình tiên tiến',
        academicYear: '2026–2027 (dự kiến)',
        annualMinVnd: 77000000,
        annualMaxVnd: 88000000,
        note: 'Học phí dự kiến 77–80 triệu đồng/năm với Kinh tế đối ngoại, Quản trị kinh doanh, Tài chính – Ngân hàng; chương trình i-Hons Kinh doanh quốc tế và Phân tích dữ liệu kinh doanh dự kiến 88 triệu đồng/năm sau hỗ trợ học phí đã nêu riêng.',
        sourceUrl: 'https://thongtintuyensinh.ftu.edu.vn/admissions-methods'
      }
    ]
  },
  'ĐV-096': {
    admissionMethods: [
      {
        name: 'Kết hợp xét tuyển và thi tuyển năng khiếu chuyên ngành',
        description: 'Thông tin tuyển sinh đại học chính quy 2026 kết hợp xét điểm Ngữ văn với thi chuyên ngành và kiến thức âm nhạc tổng hợp. Với Thanh nhạc, bài thi chuyên ngành gồm aria, romance, ca khúc Việt Nam và dân ca Việt Nam. Mã N00 trong hồ sơ tham khảo không tự xác nhận tổ hợp này là phương thức xét tuyển chính thức của Học viện; xem đề án và lịch thi từng đợt.',
        sourceUrl: 'https://www.vnam.edu.vn/NewsDetail.aspx?ItemID=2044&lang=vn'
      },
      {
        name: 'Xét tuyển thẳng, ưu tiên xét tuyển',
        description: 'Áp dụng theo đối tượng của Thông tư 06/2026/TT-BGDĐT và đề án tuyển sinh của Học viện; đề án 2026 công bố cơ chế điểm thưởng cho một số thành tích âm nhạc.',
        sourceUrl: 'https://www.vnam.edu.vn/NewsDetail.aspx?CatID=9&ItemID=2047&SubID=5&lang=vn'
      }
    ],
    scholarships: [
      {
        name: 'Học bổng khuyến khích học tập và học bổng tài trợ',
        description: 'Đề án tuyển sinh 2026 nêu việc xét học bổng khuyến khích học tập và miễn, giảm học phí theo Nghị định 238/2025/NĐ-CP. Quy chế công tác người học 2025 cũng cho phép xét học bổng của Học viện và nhà tài trợ; kết quả học tập, rèn luyện được dùng khi xét. Chưa tìm thấy thông báo chính thức hiện hành công bố mức tiền, số suất và ngưỡng cụ thể cho năm 2026–2027; không coi học bổng là khoản chắc chắn.',
        academicYear: '2026–2027; mức/điều kiện cụ thể chưa công bố trong nguồn đã kiểm tra',
        sourceUrl: 'https://www.vnam.edu.vn/NewsDetail.aspx?ItemID=2002&lang=vn',
        additionalSourceUrls: [
          'https://www.vnam.edu.vn/NewsDetail.aspx?CatID=9&ItemID=2047&SubID=5&lang=vn',
          'https://vanban.chinhphu.vn/?docid=215169&pageid=27160'
        ]
      }
    ],
    tuition: [
      {
        programName: 'Thanh nhạc',
        programCode: '7210205',
        academicYear: '2026–2027',
        annualVnd: 17100000,
        creditVnd: 502000,
        note: '17.100.000 đồng/năm học nếu đào tạo theo niên chế; 502.000 đồng/tín chỉ nếu đào tạo theo tín chỉ. Hai cách thu là hai hình thức riêng, không cộng với nhau.',
        sourceUrl: 'https://vnam.edu.vn/NewsDetail.aspx?ItemID=2090'
      }
    ],
    financialNotes: [
      {
        description: 'Ưu đãi 70% học phí theo Quyết định 41/2014/QĐ-TTg chỉ áp dụng cho các ngành nghệ thuật truyền thống/đặc thù được liệt kê trong văn bản; ngành Thanh nhạc không nằm trong danh sách đó. Người học vẫn có thể thuộc diện miễn, giảm/hỗ trợ khác theo hồ sơ cá nhân và quy định hiện hành.',
        sourceUrl: 'https://vanban.chinhphu.vn/default.aspx?docid=174994&pageid=27160'
      }
    ]
  }
};

const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const STOP_WORDS = new Set(
  'va la cua cho voi ve trong tren duoi mot nhung cac nhieu em ban toi minh muon can hay giup tu van phan tich truong dai hoc hoc vien hoc bong hoc phi phi tuyen sinh phuong thuc chinh sach thong tin nam nay nganh chuong trinh'.split(' ')
);

const queryTokens = (query = '') => [...new Set(
  normalize(query).split(/\s+/).filter((token) => token.length > 1 && !STOP_WORDS.has(token))
)];

export const INSTITUTION_POLICY_DIRECTORY = admissionsWorkbook.institutions.map((institution) => {
  const curated = curatedPoliciesBySourceId[institution.sourceId];
  return {
    sourceId: institution.sourceId,
    name: institution.name,
    institutionCode: institution.institutionCodeRaw,
    officialCodeAliases: curated?.officialCodeAliases || [],
    officialHomepage: institution.officialHomepage,
    academicYear: '2026',
    admissionMethods: curated?.admissionMethods || [],
    scholarships: curated?.scholarships || [],
    tuition: [
      ...(curated?.tuition || []),
      ...(supplementalTuitionBySourceId.get(institution.sourceId) || [])
    ],
    financialNotes: curated?.financialNotes || [],
    verificationStatus: curated ? 'OFFICIAL_PARTIAL' : 'NEEDS_SOURCE'
  };
});

export function getInstitutionPolicyByCode(code) {
  const sought = normalize(code).split(' ').filter(Boolean);
  if (!sought.length) return null;
  const codesFor = (institution) => [institution.institutionCode, ...(institution.officialCodeAliases || [])].filter(Boolean);
  const exactFullCodeMatches = INSTITUTION_POLICY_DIRECTORY.filter((institution) => codesFor(institution).some((candidate) => normalize(candidate) === sought.join(' ')));
  if (exactFullCodeMatches.length === 1) return exactFullCodeMatches[0];

  const exactPrimaryCodeMatches = INSTITUTION_POLICY_DIRECTORY.filter((institution) => {
    return codesFor(institution).some((candidate) => {
      const primaryCode = normalize(candidate.split('(')[0]).split(' ').filter(Boolean);
      return primaryCode.length > 0 && primaryCode.join(' ') === sought.join(' ');
    });
  });
  if (exactPrimaryCodeMatches.length === 1) return exactPrimaryCodeMatches[0];

  const allTokenMatches = INSTITUTION_POLICY_DIRECTORY.filter((institution) => {
    const institutionCodes = codesFor(institution).flatMap((candidate) => normalize(candidate).split(' '));
    return sought.every((token) => institutionCodes.includes(token));
  });
  return allTokenMatches.length === 1 ? allTokenMatches[0] : null;
}

export function getInstitutionPolicyContext(query, { maxCharacters = 3000, maxInstitutions = 2 } = {}) {
  const tokens = queryTokens(query);
  if (!tokens.length) return '';

  const rankedMatches = INSTITUTION_POLICY_DIRECTORY
    .map((institution) => {
      const searchable = normalize([
        institution.name,
        institution.institutionCode,
        ...(institution.officialCodeAliases || []),
        institution.sourceId,
        ...(institution.tuition || []).map((tuition) => tuition.programName),
        ...(institution.scholarships || []).map((scholarship) => scholarship.name)
      ].join(' '));
      const score = tokens.reduce((total, token) => total + (searchable.split(' ').includes(token) ? 1 : 0), 0);
      const institutionCodes = [institution.institutionCode, ...(institution.officialCodeAliases || [])].filter(Boolean);
      const exactFullCodeMatch = institutionCodes.some((code) => normalize(query).includes(normalize(code)));
      const exactPrimaryCodeMatch = institutionCodes.some((code) => {
        const primaryCodeTokens = normalize(code.split('(')[0]).split(' ').filter(Boolean);
        return primaryCodeTokens.length > 0 && primaryCodeTokens.every((token) => tokens.includes(token));
      });
      const exactAliasCodeMatch = institutionCodes.some((code) => {
        const aliasCodeTokens = normalize(code.match(/\(([^)]+)\)/)?.[1] || '').split(' ').filter(Boolean);
        return aliasCodeTokens.some((token) => tokens.includes(token) && getInstitutionPolicyByCode(token)?.sourceId === institution.sourceId);
      });
      const exactCodeMatch = exactFullCodeMatch || exactPrimaryCodeMatch || exactAliasCodeMatch;
      const exactNameMatch = normalize(query).includes(normalize(institution.name));
      return { institution, score, exactCodeMatch, exactNameMatch };
    })
    .filter(({ score, exactCodeMatch }) => exactCodeMatch || (tokens.length > 1 && score >= 2) || (tokens.length === 1 && score === 1))
    .sort((a, b) => Number(b.exactNameMatch || b.exactCodeMatch) - Number(a.exactNameMatch || a.exactCodeMatch) || b.score - a.score);

  const exactIdentityMatches = rankedMatches.filter(({ exactCodeMatch, exactNameMatch }) => exactCodeMatch || exactNameMatch);
  const matches = (exactIdentityMatches.length ? exactIdentityMatches : rankedMatches).slice(0, maxInstitutions);

  if (!matches.length) return '';

  const lines = ['THÔNG TIN TUYỂN SINH VÀ HỌC BỔNG RIÊNG THEO TRƯỜNG — NĂM 2026:'];
  for (const { institution } of matches) {
    const institutionCodes = [institution.institutionCode, ...(institution.officialCodeAliases || [])].filter(Boolean).join('; mã tuyển sinh bổ sung ');
    lines.push(`- ${institution.name} (${institutionCodes || institution.sourceId}) — trạng thái ${institution.verificationStatus}.`);
    if (institution.verificationStatus === 'NEEDS_SOURCE') {
      lines.push(`  Kho chưa có phương thức tuyển sinh/học bổng riêng được xác minh. Không suy đoán hoặc dùng chính sách trường khác thay thế. Website trường trong workbook: ${institution.officialHomepage || 'chưa có link'}.`);
      continue;
    }
    if (institution.admissionMethods.length) {
      lines.push(`  Phương thức tuyển sinh (nguồn chính thức): ${institution.admissionMethods.map((method) => method.name).join('; ')}.`);
      for (const sourceUrl of [...new Set(institution.admissionMethods.map((method) => method.sourceUrl))]) {
        lines.push(`  Nguồn tuyển sinh: ${sourceUrl}`);
      }
      for (const sourceUrl of [...new Set(institution.admissionMethods.flatMap((method) => method.additionalSourceUrls || []))]) {
        lines.push(`  Nguồn tuyển sinh bổ sung: ${sourceUrl}`);
      }
    } else {
      lines.push('  Chưa có phương thức tuyển sinh riêng được xác minh trong kho.');
    }
    if (institution.tuition?.length) {
      const subjectTokens = tokens.filter((token) => !/^20\d\d$/.test(token) && !['ctu', 'tct'].includes(token));
      const rankedTuition = institution.tuition.map((tuition) => {
        const tuitionTokens = normalize(`${tuition.programName} ${tuition.programCode || ''}`).split(' ');
        const score = subjectTokens.reduce((total, token) => total + (tuitionTokens.includes(token) ? 1 : 0), 0);
        const codeMatch = Boolean(tuition.programCode && tokens.includes(normalize(tuition.programCode)));
        return { tuition, score, codeMatch };
      }).sort((a, b) => Number(b.codeMatch) - Number(a.codeMatch) || b.score - a.score);
      const bestScore = rankedTuition[0]?.score || 0;
      const matchedTuition = rankedTuition
        .filter(({ score, codeMatch }) => codeMatch || (bestScore >= 2 && score === bestScore))
        .slice(0, 3)
        .map(({ tuition }) => tuition);

      if (matchedTuition.length) {
        for (const tuition of matchedTuition) {
          lines.push(`  Học phí ${tuition.programName}${tuition.programCode ? ` (mã ${tuition.programCode})` : ''} ${tuition.academicYear}: ${tuition.note}; nguồn ${tuition.sourceUrl}.`);
        }
      } else {
        const groupedTuition = institution.tuition.filter((tuition) => !tuition.programCode).slice(0, 6);
        if (groupedTuition.length) {
          for (const tuition of groupedTuition) {
            lines.push(`  Học phí ${tuition.programName} ${tuition.academicYear}: ${tuition.note}; nguồn ${tuition.sourceUrl}.`);
          }
        } else {
          const annualFees = institution.tuition.map((tuition) => tuition.annualVnd).filter(Number.isFinite);
          const sources = [...new Set(institution.tuition.map((tuition) => tuition.sourceUrl).filter(Boolean))].slice(0, 2);
          if (annualFees.length) {
            const min = Math.min(...annualFees) / 1_000_000;
            const max = Math.max(...annualFees) / 1_000_000;
            lines.push(`  Kho có bảng học phí chính thức theo ${institution.tuition.length} mã/chương trình ${institution.tuition[0].academicYear}; khoảng ${min.toLocaleString('vi-VN')}–${max.toLocaleString('vi-VN')} triệu đồng/năm. Tra mức đúng ngành theo mã tuyển sinh trong bảng nguồn.`);
            for (const sourceUrl of sources) lines.push(`  Nguồn học phí: ${sourceUrl}`);
          } else {
            lines.push('  Có thông tin/đơn giá theo tín chỉ hoặc học phí dự kiến theo nhóm chương trình; không được quy đổi thành mức niên phí nếu nguồn không công bố số tín chỉ/năm.');
            for (const tuition of institution.tuition.slice(0, 4)) {
              lines.push(`  Học phí ${tuition.programName} ${tuition.academicYear}: ${tuition.note}; nguồn ${tuition.sourceUrl}.`);
            }
          }
        }
      }
    } else {
      lines.push('  Chưa có mức học phí riêng theo trường/ngành được xác minh trong kho.');
    }
    if (institution.scholarships.length) {
      lines.push(`  Học bổng/hỗ trợ: ${institution.scholarships.map((scholarship) => `${scholarship.name} — ${scholarship.description}`).join(' ')}`);
      for (const sourceUrl of [...new Set(institution.scholarships.map((scholarship) => scholarship.sourceUrl))]) {
        lines.push(`  Nguồn học bổng: ${sourceUrl}`);
      }
      for (const sourceUrl of [...new Set(institution.scholarships.flatMap((scholarship) => scholarship.additionalSourceUrls || []))]) {
        lines.push(`  Nguồn bổ sung học bổng: ${sourceUrl}`);
      }
    } else {
      lines.push('  Chưa có học bổng riêng được xác minh trong kho.');
    }
    for (const note of institution.financialNotes || []) {
      lines.push(`  Thông tin tài chính: ${note.description} Nguồn: ${note.sourceUrl}.`);
      for (const sourceUrl of note.additionalSourceUrls || []) lines.push(`  Nguồn tài chính bổ sung: ${sourceUrl}`);
    }
    lines.push('  OFFICIAL_PARTIAL nghĩa là dữ liệu có nguồn nhưng chưa bao quát mọi ngành, đối tượng hoặc đợt xét; phải mở thông báo hiện hành để kiểm tra điều kiện và hạn nộp.');
  }

  let result = '';
  for (const line of lines) {
    const next = `${result}${line}\n`;
    if (next.length > maxCharacters) break;
    result = next;
  }
  return result.trim();
}
