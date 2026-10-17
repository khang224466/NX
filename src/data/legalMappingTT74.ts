/**
 * BẢN ĐỒ ÁNH XẠ DUY NHẤT (SINGLE SOURCE OF TRUTH)
 * THEO THÔNG TƯ 74/2026/TT-BGDĐT (THAY THẾ TT 09/2022/TT-BGDĐT)
 * ĐỐI SOÁT TOÀN DIỆN DANH MỤC PHỤ LỤC I VÀ PHỤ LỤC II
 */

export interface LegalMappingRecord {
  oldCode7: string;           // Mã 7 chữ số theo TT 09/2022/TT-BGDĐT
  oldName: string;            // Tên ngành theo TT 09/2022
  newCode6: string;           // Mã 6 chữ số chuẩn hóa theo TT 74/2026/TT-BGDĐT
  newName: string;            // Tên ngành chuẩn theo TT 74/2026
  fieldCode: string;          // Mã lĩnh vực 2 chữ số (14, 21, 31, 34, 44, 48, 51, 52, 72, 76, 81...)
  fieldName: string;          // Tên lĩnh vực
  isExceptionMerged: boolean; // Có phải trường hợp sáp nhập đặc biệt không (Phụ lục II)
  appendix: 'I' | 'II';       // Xuất xứ: Phụ lục I (chuyển dịch 1-1) hay Phụ lục II (gom/tách)
  legalNotes: string;         // Căn cứ & lý do pháp lý
  verifiedStatus: 'OFFICIAL_VERIFIED' | 'SECONDARY_ONLY';
}

/**
 * BỘ ÁNH XẠ TOÀN DIỆN ĐỐI SOÁT TT 74/2026/TT-BGDĐT
 */
export const TT74_LEGAL_MAPPINGS: LegalMappingRecord[] = [
  // --- NHÓM ƯU TIÊN 1: CÁC NGOẠI LỆ ĐẶC BIỆT THEO PHỤ LỤC II ---
  {
    oldCode7: '7140102',
    oldName: 'Khoa học giáo dục',
    newCode6: '140101',
    newName: 'Giáo dục học',
    fieldCode: '14',
    fieldName: 'Khoa học giáo dục và đào tạo giáo viên',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Ngành Khoa học giáo dục (7140102) gộp chính thức vào ngành Giáo dục học (140101). Triệt tiêu sự tách biệt với 7140101 trước đây.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7140101',
    oldName: 'Giáo dục học',
    newCode6: '140101',
    newName: 'Giáo dục học',
    fieldCode: '14',
    fieldName: 'Khoa học giáo dục và đào tạo giáo viên',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7140231',
    oldName: 'Sư phạm Tiếng Anh',
    newCode6: '140238',
    newName: 'Sư phạm tiếng nước ngoài',
    fieldCode: '14',
    fieldName: 'Khoa học giáo dục và đào tạo giáo viên',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: 7140231 (SP Tiếng Anh) cùng các mã 7140232..7140237 (Nga, Pháp, Trung, Đức, Nhật, Hàn) gom vào 140238 (Sư phạm tiếng nước ngoài). Chú ý: 140231 ở Phụ lục I mới là Sư phạm tiếng Lào.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7140232',
    oldName: 'Sư phạm Tiếng Nga',
    newCode6: '140238',
    newName: 'Sư phạm tiếng nước ngoài',
    fieldCode: '14',
    fieldName: 'Khoa học giáo dục và đào tạo giáo viên',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Gom vào 140238 (Sư phạm tiếng nước ngoài) theo Phụ lục II TT 74/2026.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7140233',
    oldName: 'Sư phạm Tiếng Pháp',
    newCode6: '140238',
    newName: 'Sư phạm tiếng nước ngoài',
    fieldCode: '14',
    fieldName: 'Khoa học giáo dục và đào tạo giáo viên',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Gom vào 140238 (Sư phạm tiếng nước ngoài) theo Phụ lục II TT 74/2026.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7140234',
    oldName: 'Sư phạm Tiếng Trung Quốc',
    newCode6: '140238',
    newName: 'Sư phạm tiếng nước ngoài',
    fieldCode: '14',
    fieldName: 'Khoa học giáo dục và đào tạo giáo viên',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Gom vào 140238 (Sư phạm tiếng nước ngoài) theo Phụ lục II TT 74/2026.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7140235',
    oldName: 'Sư phạm Tiếng Đức',
    newCode6: '140238',
    newName: 'Sư phạm tiếng nước ngoài',
    fieldCode: '14',
    fieldName: 'Khoa học giáo dục và đào tạo giáo viên',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Gom vào 140238 (Sư phạm tiếng nước ngoài) theo Phụ lục II TT 74/2026.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7140236',
    oldName: 'Sư phạm Tiếng Nhật',
    newCode6: '140238',
    newName: 'Sư phạm tiếng nước ngoài',
    fieldCode: '14',
    fieldName: 'Khoa học giáo dục và đào tạo giáo viên',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Gom vào 140238 (Sư phạm tiếng nước ngoài) theo Phụ lục II TT 74/2026.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7140237',
    oldName: 'Sư phạm Tiếng Hàn Quốc',
    newCode6: '140238',
    newName: 'Sư phạm tiếng nước ngoài',
    fieldCode: '14',
    fieldName: 'Khoa học giáo dục và đào tạo giáo viên',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Gom vào 140238 (Sư phạm tiếng nước ngoài) theo Phụ lục II TT 74/2026.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7210107',
    oldName: 'Gốm',
    newCode6: '210108',
    newName: 'Thương mại nghệ thuật',
    fieldCode: '21',
    fieldName: 'Nghệ thuật',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Ngành Gốm (7210107) chuyển vào nhóm Thương mại nghệ thuật (210108).',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7210203',
    oldName: 'Sáng tác âm nhạc',
    newCode6: '210201',
    newName: 'Âm nhạc học',
    fieldCode: '21',
    fieldName: 'Nghệ thuật',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Sáng tác âm nhạc gộp vào 210201 (Âm nhạc học).',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7210208',
    oldName: 'Piano',
    newCode6: '210207',
    newName: 'Biểu diễn nhạc cụ phương tây',
    fieldCode: '21',
    fieldName: 'Nghệ thuật',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Piano gộp vào 210207 (Biểu diễn nhạc cụ phương tây).',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7210209',
    oldName: 'Nhạc Jazz',
    newCode6: '210207',
    newName: 'Biểu diễn nhạc cụ phương tây',
    fieldCode: '21',
    fieldName: 'Nghệ thuật',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Nhạc Jazz cùng ánh xạ vào 210207 (Biểu diễn nhạc cụ phương tây).',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7760103',
    oldName: 'Công tác xã hội với người khuyết tật',
    newCode6: '760101',
    newName: 'Công tác xã hội',
    fieldCode: '76',
    fieldName: 'Dịch vụ xã hội',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Gom về 760101 (Công tác xã hội).',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7760102',
    oldName: 'Công tác thanh thiếu niên',
    newCode6: '760101',
    newName: 'Công tác xã hội',
    fieldCode: '76',
    fieldName: 'Dịch vụ xã hội',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Công tác thanh thiếu niên được ánh xạ về 760101 (Công tác xã hội).',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7810103',
    oldName: 'Quản trị dịch vụ du lịch và lữ hành',
    newCode6: '810201',
    newName: 'Quản trị khách sạn',
    fieldCode: '81',
    fieldName: 'Du lịch, khách sạn, thể thao và dịch vụ cá nhân',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Ánh xạ chuyển dịch về nhóm Quản trị khách sạn 810201.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7850102',
    oldName: 'Kinh tế tài nguyên thiên nhiên',
    newCode6: '310101',
    newName: 'Kinh tế học',
    fieldCode: '31',
    fieldName: 'Khoa học xã hội và hành vi',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Kinh tế tài nguyên thiên nhiên gộp vào 310101 (Kinh tế học).',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7580301',
    oldName: 'Kinh tế xây dựng',
    newCode6: '310101',
    newName: 'Kinh tế học',
    fieldCode: '31',
    fieldName: 'Khoa học xã hội và hành vi',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Kinh tế xây dựng cùng ánh xạ về 310101 (Kinh tế học).',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7340123',
    oldName: 'Kinh doanh thời trang và dệt may',
    newCode6: '340121',
    newName: 'Kinh doanh thương mại',
    fieldCode: '34',
    fieldName: 'Kinh doanh và quản lý',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: 7340123 ánh xạ vào 340121 (Kinh doanh thương mại). Chú ý: 340123 mới trong TT 74 là ngành Logistics và chuỗi cung ứng!',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7480202',
    oldName: 'An toàn thông tin',
    newCode6: '480208',
    newName: 'An ninh mạng',
    fieldCode: '48',
    fieldName: 'Máy tính và công nghệ thông tin',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: 7480202 đã chuyển thành 480208 (An ninh mạng).',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7440110',
    oldName: 'Công nghệ vi sinh học',
    newCode6: '440109',
    newName: 'Vi sinh học',
    fieldCode: '44',
    fieldName: 'Khoa học sự sống',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Điều chỉnh mã 7440110 sang 440109.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7720502',
    oldName: 'Kỹ thuật phục hình răng',
    newCode6: '720611',
    newName: 'Kỹ thuật phục hình răng',
    fieldCode: '72',
    fieldName: 'Sức khỏe',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Điều chỉnh mã phân định nhóm kỹ thuật nha khoa.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },

  // --- CÁC NGÀNH KỸ THUẬT & CÔNG NGHỆ TRỌNG ĐIỂM THEO ĐỀ ÁN 2026 ---
  {
    oldCode7: '7520401',
    oldName: 'Vật lý kỹ thuật (Chuyên ngành Thiết kế vi mạch)',
    newCode6: '520401',
    newName: 'Vật lý kỹ thuật & Thiết kế Vi mạch bán dẫn',
    fieldCode: '52',
    fieldName: 'Kỹ thuật',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7520216',
    oldName: 'Kỹ thuật cơ điện tử (Robot & Hệ thống thông minh)',
    newCode6: '520216',
    newName: 'Kỹ thuật Robot & Hệ thống Cơ điện tử thông minh',
    fieldCode: '52',
    fieldName: 'Kỹ thuật',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7480109',
    oldName: 'Khoa học dữ liệu (Data Science & AI)',
    newCode6: '480109',
    newName: 'Khoa học dữ liệu & Trí tuệ nhân tạo',
    fieldCode: '48',
    fieldName: 'Máy tính và công nghệ thông tin',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch trực tiếp chuẩn hóa.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7510605',
    oldName: 'Logistics và chuỗi cung ứng',
    newCode6: '340123',
    newName: 'Logistics và chuỗi cung ứng',
    fieldCode: '34',
    fieldName: 'Kinh doanh và quản lý',
    isExceptionMerged: true,
    appendix: 'II',
    legalNotes: 'Phụ lục II: Logistics chuyển sang khối kinh doanh 340123 theo quy chuẩn phân loại quốc tế ISCED.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7520212',
    oldName: 'Kỹ thuật Y sinh (Biomedical Engineering)',
    newCode6: '520212',
    newName: 'Kỹ thuật Y sinh',
    fieldCode: '52',
    fieldName: 'Kỹ thuật',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển sang 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7520110',
    oldName: 'Kỹ thuật năng lượng tái tạo',
    newCode6: '520110',
    newName: 'Kỹ thuật năng lượng và Năng lượng tái tạo',
    fieldCode: '52',
    fieldName: 'Kỹ thuật',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển 6 chữ số chuẩn hóa.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7720101',
    oldName: 'Y khoa',
    newCode6: '720101',
    newName: 'Y khoa',
    fieldCode: '72',
    fieldName: 'Sức khỏe',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7720501',
    oldName: 'Răng - Hàm - Mặt',
    newCode6: '720501',
    newName: 'Răng - Hàm - Mặt',
    fieldCode: '72',
    fieldName: 'Sức khỏe',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7720201',
    oldName: 'Dược học',
    newCode6: '720201',
    newName: 'Dược học',
    fieldCode: '72',
    fieldName: 'Sức khỏe',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7480101',
    oldName: 'Khoa học máy tính',
    newCode6: '480101',
    newName: 'Khoa học máy tính',
    fieldCode: '48',
    fieldName: 'Máy tính và công nghệ thông tin',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7480102',
    oldName: 'Mạng máy tính và truyền thông dữ liệu',
    newCode6: '480102',
    newName: 'Mạng máy tính và truyền thông dữ liệu',
    fieldCode: '48',
    fieldName: 'Máy tính và công nghệ thông tin',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7480103',
    oldName: 'Kỹ thuật phần mềm',
    newCode6: '480103',
    newName: 'Kỹ thuật phần mềm',
    fieldCode: '48',
    fieldName: 'Máy tính và công nghệ thông tin',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7480104',
    oldName: 'Hệ thống thông tin',
    newCode6: '480104',
    newName: 'Hệ thống thông tin',
    fieldCode: '48',
    fieldName: 'Máy tính và công nghệ thông tin',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7340201',
    oldName: 'Tài chính - Ngân hàng',
    newCode6: '340201',
    newName: 'Tài chính - Ngân hàng',
    fieldCode: '34',
    fieldName: 'Kinh doanh và quản lý',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7340301',
    oldName: 'Kế toán',
    newCode6: '340301',
    newName: 'Kế toán',
    fieldCode: '34',
    fieldName: 'Kinh doanh và quản lý',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7380101',
    oldName: 'Luật',
    newCode6: '380101',
    newName: 'Luật',
    fieldCode: '38',
    fieldName: 'Pháp luật',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  },
  {
    oldCode7: '7380107',
    oldName: 'Luật kinh tế',
    newCode6: '380107',
    newName: 'Luật kinh tế',
    fieldCode: '38',
    fieldName: 'Pháp luật',
    isExceptionMerged: false,
    appendix: 'I',
    legalNotes: 'Phụ lục I: Chuyển dịch mã trực tiếp sang hệ 6 chữ số.',
    verifiedStatus: 'OFFICIAL_VERIFIED'
  }
];

/**
 * Tra cứu chuẩn hóa TT 74/2026 từ mã 7 chữ số TT 09/2022
 */
export function lookupTT74ByOldCode(oldCode7: string): LegalMappingRecord | undefined {
  const cleanCode = oldCode7.trim();
  return TT74_LEGAL_MAPPINGS.find(r => r.oldCode7 === cleanCode);
}

export const lookupTT74 = lookupTT74ByOldCode;

/**
 * Tra cứu nguồn TT 09/2022 từ mã 6 chữ số TT 74/2026
 */
export function lookupTT09ByNewCode(newCode6: string): LegalMappingRecord[] {
  const cleanCode = newCode6.trim();
  return TT74_LEGAL_MAPPINGS.filter(r => r.newCode6 === cleanCode);
}

/**
 * Kiểm tra tính nhất quán mã giữa 2 phiên bản thông tư
 */
export function validateMajorCodeConsistency(code: string): {
  isValid: boolean;
  version: 'TT09' | 'TT74' | 'INVALID';
  targetRecord?: LegalMappingRecord;
  warningNote?: string;
} {
  const clean = code.trim();
  if (clean.length === 7 && clean.startsWith('7')) {
    const record = lookupTT74ByOldCode(clean);
    return {
      isValid: !!record,
      version: 'TT09',
      targetRecord: record,
      warningNote: record 
        ? `Mã theo TT 09/2022 (${clean}). Trong đề án tuyển sinh 2026 phải chuyển thành mã 6 chữ số: ${record.newCode6} (${record.newName}).`
        : `Mã ${clean} không nằm trong danh mục đối soát của TT 74/2026.`
    };
  }

  if (clean.length === 6) {
    const records = lookupTT09ByNewCode(clean);
    return {
      isValid: records.length > 0,
      version: 'TT74',
      targetRecord: records[0],
      warningNote: records.length > 0
        ? `Mã chuẩn phù hợp TT 74/2026: ${clean} (${records[0].newName}).`
        : `Mã 6 chữ số ${clean} chưa được lập chỉ mục.`
    };
  }

  return {
    isValid: false,
    version: 'INVALID',
    warningNote: `Mã ngành '${code}' không đúng định dạng chuẩn 6 hoặc 7 chữ số.`
  };
}
