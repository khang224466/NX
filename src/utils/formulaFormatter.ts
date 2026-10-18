/**
 * Mathematical Formula Formatter for Vietnamese University Admissions
 * Transforms raw database formula expressions (e.g., F01, F15, HUST W2) into 
 * beautifully styled, human-readable mathematical notations.
 */

export function formatFormulaDisplay(expr?: string | null): string {
  if (!expr || typeof expr !== 'string') {
    return 'ĐXT = M1 + M2 + M3 + Điểm Ưu Tiên';
  }

  return expr
    // Replace raw asterisks with proper multiplication sign
    .replace(/\s*\*\s*/g, ' × ')
    // Replace common fractions with Unicode fractions
    .replace(/3\/4/g, '¾')
    .replace(/1\/2/g, '½')
    .replace(/2\/3/g, '⅔')
    .replace(/1\/4/g, '¼')
    // Replace raw technical variable identifiers with Vietnamese standard labels
    .replace(/\bPriority_30_Eff\b/gi, 'Điểm Ưu Tiên')
    .replace(/\bPriority_40_Eff\b/gi, 'Điểm Ưu Tiên')
    .replace(/\bPriority_100_Eff\b/gi, 'Điểm Ưu Tiên')
    .replace(/\bPriority_1200\b/gi, 'Điểm Ưu Tiên')
    .replace(/\bPriority_10_Eff\b/gi, 'Điểm Ưu Tiên')
    .replace(/\bPriority_Eff\b/gi, 'Điểm Ưu Tiên')
    .replace(/\bPriority\b/gi, 'Điểm Ưu Tiên')
    .replace(/\bBonus_30_Eff\b/gi, 'Điểm Thưởng (Tối đa 3đ)')
    .replace(/\bBonus_40_Eff\b/gi, 'Điểm Thưởng (Tối đa 4đ)')
    .replace(/\bBonus_100\b/gi, 'Điểm Thưởng')
    .replace(/\bBonus_Eff\b/gi, 'Điểm Thưởng')
    .replace(/\bBonus\b/gi, 'Điểm Thưởng')
    .replace(/\bM_Chính\b/gi, 'Môn Chính')
    .replace(/\bCCNN_QuyDoi_10\b/gi, 'Chứng Chỉ Ngoại Ngữ Quy Đổi (Thang 10)')
    .replace(/\bCCNN_QuyDoi_30\b/gi, 'Chứng Chỉ Ngoại Ngữ Quy Đổi (Thang 30)')
    .replace(/\bBTBCA_100\b/gi, 'Bài Thi Bộ Công An (Thang 100)')
    .replace(/\bCore_Test\b/gi, 'Bài Thi TestAS Core')
    .replace(/\bSubject_Module\b/gi, 'Mô-đun Chuyên Ngành TestAS')
    .replace(/\bVSAT_Percentile_30\b/gi, 'Điểm VSAT Quy Đổi Bách Phân Vị')
    .replace(/\bTBC_6HK_M1\b/gi, 'TBC 6HK Môn 1')
    .replace(/\bTBC_6HK_M2\b/gi, 'TBC 6HK Môn 2')
    .replace(/\bTBC_6HK_M3\b/gi, 'TBC 6HK Môn 3')
    .replace(/\bTBC_MC\b/gi, 'TBC Môn Chính')
    .replace(/\bTBC_M2\b/gi, 'TBC Môn 2')
    .replace(/\bTBC_M3\b/gi, 'TBC Môn 3')
    .replace(/\bTBC12_M1\b/gi, 'TBC Lớp 12 Môn 1')
    .replace(/\bTBC12_M2\b/gi, 'TBC Lớp 12 Môn 2')
    .replace(/\bTBC12_M3\b/gi, 'TBC Lớp 12 Môn 3')
    .replace(/\bSPT_MC\b/gi, 'Điểm Môn Chính Sư Phạm')
    .replace(/\bHB_M2\b/gi, 'Học Bạ Môn 2')
    .replace(/\bHB_M3\b/gi, 'Học Bạ Môn 3')
    .replace(/\bNK_TDTT\b/gi, 'Năng Khiếu TDTT')
    // Clean up excessive spaces
    .replace(/\s+/g, ' ')
    .trim();
}
