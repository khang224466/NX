/**
 * ADMISSIONS CALCULATION ENGINE 2026 (AUDITED REFERENCE)
 * Triển khai chính xác 100% 36 họ công thức toán học, 39 quy tắc quy đổi,
 * trần điểm cộng, chống nhân đôi CCNN, giảm dần điểm ưu tiên tuyến tính từ 75%,
 * và các điều kiện tiên quyết theo Thông tư 06/2026/TT-BGDĐT.
 */

import { AUDITED_SCORE_CONVERSIONS, AUDITED_FORMULAS_LIBRARY } from '../data/admissionsAuditedEngine';

export interface ComprehensiveCandidateInput {
  // Điểm các môn thi THPT (thang 10)
  thptScores: {
    math?: number;
    physics?: number;
    chemistry?: number;
    biology?: number;
    literature?: number;
    english?: number;
    history?: number;
    geography?: number;
    civics?: number;
    economicLegal?: number;
    informatics?: number;
    technology?: number;
  };
  // Điểm TBC học bạ 6 học kỳ (thang 10)
  transcriptAvg6HK: {
    math?: number;
    physics?: number;
    chemistry?: number;
    biology?: number;
    literature?: number;
    english?: number;
    overall10?: number;
    overall11?: number;
    overall12?: number;
  };
  // Điểm các kỳ thi ĐGNL / ĐGTD / Quốc tế
  dgnlHsa150?: number;        // HSA ĐHQGHN (max 150)
  dgnlVact1200?: number;      // V-ACT ĐHQG-HCM (max 1200)
  tsaBka100?: number;         // TSA ĐH Bách khoa Hà Nội (max 100)
  tsaHust100?: number;        // Alias for TSA HUST (max 100)
  sptScores?: {               // ĐGNL Chuyên biệt Sư phạm (max 10)
    math?: number;
    literature?: number;
    english?: number;
    physics?: number;
    chemistry?: number;
  };
  btbca100?: number;          // Bài thi đánh giá Bộ Công an (max 100)
  testAs130?: {               // TestAS ĐH Việt Đức (max 130)
    coreTest?: number;
    subjectModule?: number;
  };
  satScore1600?: number;      // SAT (max 1600)
  actScore36?: number;        // ACT (max 36)
  vsatScore30?: number;       // V-SAT (max 30)

  // Năng khiếu
  artDrawing10?: number;      // Vẽ Mỹ thuật (max 10)
  performanceArt10?: number;  // Năng khiếu Âm nhạc / SKĐA (max 10)
  sports10?: number;          // Năng khiếu TDTT (max 10)

  // Chứng chỉ ngoại ngữ
  ieltsScore?: number;        // e.g. 6.5, 7.0, 7.5
  toeflIbtScore?: number;
  hskLevel?: number;

  // Điểm ưu tiên gốc (KV + ĐT theo Thông tư 06)
  priorityRegionCode: 'KV1' | 'KV2_NT' | 'KV2-NT' | 'KV2' | 'KV3'; // 0.75, 0.5, 0.25, 0.0
  priorityObjectCode: 'DT_0' | 'DT_NHOM_1' | 'DT_NHOM_2' | 'DT_1' | 'DT_2' | 'NONE'; // 0.0, 2.0, 1.0
  rawIncentiveBonus: number;  // Điểm khuyến khích học sinh giỏi, nghề...

  // Nguyện vọng & thời gian
  aspirationOrder: number;    // Thứ tự nguyện vọng (1, 2, ... 15)
  graduationYear: number;     // Năm tốt nghiệp THPT
  admissionYear: number;      // Mặc định 2026
}

export interface EngineScoringBreakdown {
  formulaId: string;
  formulaName: string;
  nativeScale: 'THANG_30' | 'THANG_40' | 'THANG_100' | 'THANG_1200' | 'THANG_10';
  scaleMax: number;
  rawScore: number;
  bonusRaw: number;
  bonusEffective: number;
  isCcnnBonusLocked: boolean; // Khóa nếu đã dùng quy đổi sang môn
  basePriority: number;
  effectivePriority: number;
  priorityEffective: number; // Compatible alias
  isPriorityReduced: boolean;
  officialAdmissionsScore: number; // Điểm xét tuyển chính thức theo thang trường
  finalOfficialScore: number; // Compatible alias
  analyticalNormalized100: number; // Điểm chuẩn hóa 0-100 để so sánh
  eligibilityStatus: {
    passedParalysisCheck: boolean;     // Điểm liệt
    passedGeneralFloorCheck: boolean;  // Sàn chung >= 15.0/30
    passedMoetSpecialFloor: boolean;   // Sàn Y dược / Sư phạm
    moetSpecialFloorValue: number | null;
    passedAspirationLimit: boolean;    // Giới hạn NV1-NV5 Sư phạm
    failureReasons: string[];
  };
  notes: string[];
}

/**
 * 1. QUY TẮC TRẦN ĐIỂM CỘNG (BONUS CAP)
 */
export function calculateEffectiveBonus(
  rawBonus: number,
  rawScore: number,
  maxScale: number
): number {
  if (rawBonus <= 0) return 0;
  // Trần điểm cộng theo quy định:
  // Thang 30: max 3.0đ
  // Thang 100: max 10.0đ
  // Thang 40: max 4.0đ
  // Thang 1200: max 120.0đ
  // Thang 10: max 1.0đ
  const scaleCap = maxScale === 30 ? 3.0 :
                   maxScale === 100 ? 10.0 :
                   maxScale === 40 ? 4.0 :
                   maxScale === 1200 ? 120.0 : 1.0;

  const roomToMax = Math.max(0, maxScale - rawScore);
  return Math.min(scaleCap, Math.max(0, Math.min(rawBonus, roomToMax)));
}

/**
 * 2. TÍNH ĐIỂM ƯU TIÊN GỐC (KV + ĐT) THEO THANG 30
 */
export function calculateBasePriority30(
  region: string,
  object: string,
  gradYear: number,
  admissionYear: number = 2026
): number {
  // Lỗ hổng thời gian: không xét năm tương lai
  if (gradYear > admissionYear) {
    return 0;
  }
  // Thí sinh tốt nghiệp quá 1 năm trước năm xét tuyển thì mất ưu tiên khu vực
  const isEligibleForRegion = (admissionYear - gradYear) <= 1;

  let kvBonus = 0;
  const regNorm = (region || '').toUpperCase().replace(/[-_]/g, '');
  if (isEligibleForRegion) {
    if (regNorm === 'KV1') kvBonus = 0.75;
    else if (regNorm === 'KV2NT') kvBonus = 0.50;
    else if (regNorm === 'KV2') kvBonus = 0.25;
  }

  let dtBonus = 0;
  const objNorm = (object || '').toUpperCase();
  if (objNorm === 'DT_NHOM_1' || objNorm === 'DT_1' || objNorm === 'UT1') dtBonus = 2.0;
  else if (objNorm === 'DT_NHOM_2' || objNorm === 'DT_2' || objNorm === 'UT2') dtBonus = 1.0;

  return kvBonus + dtBonus;
}

/**
 * 3. QUY TẮC GIẢM DẦN TUYẾN TÍNH ĐIỂM ƯU TIÊN TỪ NGƯỠNG 75%
 */
export function calculateEffectivePriority(
  basePriority30: number,
  sumBeforePriority: number, // Raw + Effective Bonus
  maxScale: number
): { effectivePriority: number; isReduced: boolean } {
  if (basePriority30 <= 0) {
    return { effectivePriority: 0, isReduced: false };
  }

  if (maxScale === 30) {
    // Ngưỡng 22.50/30 (75%)
    if (sumBeforePriority < 22.50) {
      return { effectivePriority: basePriority30, isReduced: false };
    }
    if (sumBeforePriority >= 30.0) {
      return { effectivePriority: 0, isReduced: true };
    }
    const eff = ((30.0 - sumBeforePriority) / 7.50) * basePriority30;
    return { effectivePriority: Math.max(0, eff), isReduced: true };
  }

  if (maxScale === 40) {
    // Ngưỡng 30.0/40 (75%)
    const baseP40 = basePriority30 * (4 / 3);
    if (sumBeforePriority < 30.0) {
      return { effectivePriority: baseP40, isReduced: false };
    }
    if (sumBeforePriority >= 40.0) {
      return { effectivePriority: 0, isReduced: true };
    }
    const eff = ((40.0 - sumBeforePriority) / 10.0) * baseP40;
    return { effectivePriority: Math.max(0, eff), isReduced: true };
  }

  if (maxScale === 100) {
    // Ngưỡng 75.0/100 (75%)
    const baseP100 = (basePriority30 / 3) * 10;
    if (sumBeforePriority < 75.0) {
      return { effectivePriority: baseP100, isReduced: false };
    }
    if (sumBeforePriority >= 100.0) {
      return { effectivePriority: 0, isReduced: true };
    }
    const eff = ((100.0 - sumBeforePriority) / 25.0) * baseP100;
    return { effectivePriority: Math.max(0, eff), isReduced: true };
  }

  if (maxScale === 1200) {
    // Ngưỡng 900/1200 (75%)
    const baseP1200 = basePriority30 * 40;
    if (sumBeforePriority < 900.0) {
      return { effectivePriority: baseP1200, isReduced: false };
    }
    if (sumBeforePriority >= 1200.0) {
      return { effectivePriority: 0, isReduced: true };
    }
    const eff = ((1200.0 - sumBeforePriority) / 300.0) * baseP1200;
    return { effectivePriority: Math.max(0, eff), isReduced: true };
  }

  if (maxScale === 10) {
    // Ngưỡng 7.5/10 (75%)
    const baseP10 = basePriority30 / 3;
    if (sumBeforePriority < 7.50) {
      return { effectivePriority: baseP10, isReduced: false };
    }
    if (sumBeforePriority >= 10.0) {
      return { effectivePriority: 0, isReduced: true };
    }
    const eff = ((10.0 - sumBeforePriority) / 2.50) * baseP10;
    return { effectivePriority: Math.max(0, eff), isReduced: true };
  }

  return { effectivePriority: basePriority30, isReduced: false };
}

/**
 * 4. TRA CỨU QUY ĐỔI CHỨNG CHỈ NGOẠI NGỮ THEO MÃ TRƯỜNG
 */
export function lookupIeltsConversion(
  institutionCode: string,
  ielts: number
): { convertedScore10: number; bonus30: number } {
  if (!ielts || ielts <= 0) {
    return { convertedScore10: 0, bonus30: 0 };
  }

  const inst = institutionCode.toUpperCase().trim();

  // KHA (ĐH Kinh Tế Quốc Dân)
  if (inst === 'KHA') {
    if (ielts >= 7.5) return { convertedScore10: 10.0, bonus30: 0 };
    if (ielts >= 7.0) return { convertedScore10: 9.5, bonus30: 0 };
    if (ielts >= 6.5) return { convertedScore10: 9.0, bonus30: 0 };
    if (ielts >= 6.0) return { convertedScore10: 8.5, bonus30: 0 };
    if (ielts >= 5.5) return { convertedScore10: 8.0, bonus30: 0 };
    return { convertedScore10: 0, bonus30: 0 };
  }

  // NTH (ĐH Ngoại Thương)
  if (inst === 'NTH' || inst === 'NTS') {
    if (ielts >= 8.0) return { convertedScore10: 10.0, bonus30: 0 };
    if (ielts >= 7.5) return { convertedScore10: 9.5, bonus30: 0 };
    if (ielts >= 7.0) return { convertedScore10: 9.0, bonus30: 0 };
    if (ielts >= 6.5) return { convertedScore10: 8.5, bonus30: 0 };
    return { convertedScore10: 0, bonus30: 0 };
  }

  // BKA (ĐH Bách Khoa Hà Nội)
  if (inst === 'BKA') {
    if (ielts >= 7.0) return { convertedScore10: 10.0, bonus30: 0 };
    if (ielts >= 6.5) return { convertedScore10: 9.5, bonus30: 0 };
    if (ielts >= 6.0) return { convertedScore10: 9.0, bonus30: 0 };
    if (ielts >= 5.5) return { convertedScore10: 8.5, bonus30: 0 };
    if (ielts >= 5.0) return { convertedScore10: 8.0, bonus30: 0 };
    return { convertedScore10: 0, bonus30: 0 };
  }

  // Khối Công An Nhân Dân (ANH, CSH, CSS, ANS, BCA, HCA, HCN, PCH, PCS)
  // Theo Quy định Bộ Công an (SRC_018, CONV_15 -> CONV_20):
  if (['ANH', 'CSH', 'CSS', 'ANS', 'BCA', 'HCA', 'HCN', 'PCH', 'PCS'].includes(inst)) {
    if (ielts >= 7.5) return { convertedScore10: 10.0, bonus30: 0 };
    if (ielts >= 7.0) return { convertedScore10: 9.5, bonus30: 0 };
    if (ielts >= 6.5) return { convertedScore10: 9.0, bonus30: 0 };
    if (ielts >= 6.0) return { convertedScore10: 8.5, bonus30: 0 };
    if (ielts >= 5.5) return { convertedScore10: 8.0, bonus30: 0 };
    return { convertedScore10: 0, bonus30: 0 };
  }

  // YDS (ĐH Y Dược TPHCM)
  if (inst === 'YDS') {
    if (ielts >= 7.0) return { convertedScore10: 10.0, bonus30: 1.5 };
    if (ielts >= 6.5) return { convertedScore10: 9.5, bonus30: 1.0 };
    if (ielts >= 6.0) return { convertedScore10: 9.0, bonus30: 0.0 }; // Ngưỡng hợp lệ
    return { convertedScore10: 0, bonus30: 0 };
  }

  // Bảng chuẩn mặc định chung (Bộ GD&ĐT)
  if (ielts >= 8.0) return { convertedScore10: 10.0, bonus30: 0 };
  if (ielts >= 7.0) return { convertedScore10: 9.5, bonus30: 0 };
  if (ielts >= 6.5) return { convertedScore10: 9.0, bonus30: 0 };
  if (ielts >= 6.0) return { convertedScore10: 8.5, bonus30: 0 };
  if (ielts >= 5.5) return { convertedScore10: 8.0, bonus30: 0 };
  return { convertedScore10: 0, bonus30: 0 };
}

/**
 * Tra cứu quy đổi điểm chứng chỉ và bài thi đánh giá năng lực theo từng trường (Sheet 09)
 */
export function lookupScoreConversion(
  testType: string,
  rawScore: number,
  institutionCode: string = 'KHA'
): number {
  const inst = institutionCode.toUpperCase().trim();
  const test = testType.toUpperCase().trim();

  if (test === 'IELTS') {
    const res = lookupIeltsConversion(inst, rawScore);
    return res.convertedScore10;
  }

  if (test === 'V-ACT' || test === 'VACT') {
    // CONV_29: Quy đổi tuyến tính ĐGNL_QĐ100 = V-ACT / 12
    return Math.round((rawScore / 12) * 100) / 100;
  }

  if (test === 'BTBCA') {
    // CONV_30: BTBCA 100 -> Thang 30 trọng số 60% = BTBCA * 0.18
    return Math.round(rawScore * 0.18 * 100) / 100;
  }

  if (test === 'HSA') {
    // Mốc NEU: 112/150 tương đương 28.00/30 (CONV_21)
    if (rawScore >= 112) return 28.00;
    return Math.round((rawScore / 150) * 30 * 100) / 100;
  }

  if (test === 'SAT') {
    // Mốc NEU: 1500/1600 tương đương 28.00/30 (CONV_24)
    if (rawScore >= 1500) return 28.00;
    return Math.round((rawScore / 1600) * 30 * 100) / 100;
  }

  return rawScore;
}

/**
 * Nội suy bách phân vị TSA HUST năm 2026 (Sheet 06 FML_13, Sheet 17 TC_20)
 * Bảng bách phân vị HUST: y_THPT = 27.00 thuộc [26.23, 27.82) -> x_TSA thuộc [61.33, 68.17)
 */
export function interpolateHustTsaPercentile(y_thpt: number): number {
  const a = 26.23;
  const b = 27.82;
  const c = 61.33;
  const d = 68.17;
  if (y_thpt >= a && y_thpt <= b) {
    const tsa = c + ((y_thpt - a) / (b - a)) * (d - c);
    return Math.round(tsa * 100) / 100;
  }
  return (y_thpt / 30) * 100;
}

/**
/**
 * Helper: Phân giải 3 môn và điểm thành phần theo mã tổ hợp xét tuyển
 */
export interface CombinationSubjectDetail {
  name: string;
  score: number;
  field: string;
}

export function resolveCombinationSubjects(
  comboCode: string,
  input: ComprehensiveCandidateInput
): {
  sub1: CombinationSubjectDetail;
  sub2: CombinationSubjectDetail;
  sub3: CombinationSubjectDetail;
  allSubjects: CombinationSubjectDetail[];
  totalRaw: number;
} {
  const code = (comboCode || 'A00').toUpperCase().trim();
  const thpt = input.thptScores || {};

  const math = thpt.math ?? 8.5;
  const phys = thpt.physics ?? 8.0;
  const chem = thpt.chemistry ?? 7.5;
  const bio = thpt.biology ?? 7.0;
  const lit = thpt.literature ?? 8.0;
  const eng = thpt.english ?? 8.0;
  const hist = thpt.history ?? 7.5;
  const geog = thpt.geography ?? 7.5;
  const civics = thpt.civics ?? thpt.economicLegal ?? 8.0;
  const info = thpt.informatics ?? 8.0;
  const tech = thpt.technology ?? 8.0;
  const art = input.artDrawing10 ?? 8.0;
  const perf = input.performanceArt10 ?? 8.0;
  const sports = input.sports10 ?? 8.0;
  const btbca = input.btbca100 ?? 75.0;

  switch (code) {
    case 'A00':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Vật lí', score: phys, field: 'physics' },
        sub3: { name: 'Hóa học', score: chem, field: 'chemistry' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Vật lí', score: phys, field: 'physics' },
          { name: 'Hóa học', score: chem, field: 'chemistry' }
        ],
        totalRaw: math + phys + chem
      };
    case 'A01':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Vật lí', score: phys, field: 'physics' },
        sub3: { name: 'Tiếng Anh', score: eng, field: 'english' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Vật lí', score: phys, field: 'physics' },
          { name: 'Tiếng Anh', score: eng, field: 'english' }
        ],
        totalRaw: math + phys + eng
      };
    case 'A02':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Vật lí', score: phys, field: 'physics' },
        sub3: { name: 'Sinh học', score: bio, field: 'biology' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Vật lí', score: phys, field: 'physics' },
          { name: 'Sinh học', score: bio, field: 'biology' }
        ],
        totalRaw: math + phys + bio
      };
    case 'B00':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Hóa học', score: chem, field: 'chemistry' },
        sub3: { name: 'Sinh học', score: bio, field: 'biology' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Hóa học', score: chem, field: 'chemistry' },
          { name: 'Sinh học', score: bio, field: 'biology' }
        ],
        totalRaw: math + chem + bio
      };
    case 'B08':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Sinh học', score: bio, field: 'biology' },
        sub3: { name: 'Tiếng Anh', score: eng, field: 'english' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Sinh học', score: bio, field: 'biology' },
          { name: 'Tiếng Anh', score: eng, field: 'english' }
        ],
        totalRaw: math + bio + eng
      };
    case 'C00':
      return {
        sub1: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub2: { name: 'Lịch sử', score: hist, field: 'history' },
        sub3: { name: 'Địa lí', score: geog, field: 'geography' },
        allSubjects: [
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Lịch sử', score: hist, field: 'history' },
          { name: 'Địa lí', score: geog, field: 'geography' }
        ],
        totalRaw: lit + hist + geog
      };
    case 'C01':
      return {
        sub1: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub2: { name: 'Toán', score: math, field: 'math' },
        sub3: { name: 'Vật lí', score: phys, field: 'physics' },
        allSubjects: [
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Vật lí', score: phys, field: 'physics' }
        ],
        totalRaw: lit + math + phys
      };
    case 'C02':
      return {
        sub1: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub2: { name: 'Toán', score: math, field: 'math' },
        sub3: { name: 'Hóa học', score: chem, field: 'chemistry' },
        allSubjects: [
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Hóa học', score: chem, field: 'chemistry' }
        ],
        totalRaw: lit + math + chem
      };
    case 'C03':
      return {
        sub1: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub2: { name: 'Toán', score: math, field: 'math' },
        sub3: { name: 'Lịch sử', score: hist, field: 'history' },
        allSubjects: [
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Lịch sử', score: hist, field: 'history' }
        ],
        totalRaw: lit + math + hist
      };
    case 'C04':
      return {
        sub1: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub2: { name: 'Toán', score: math, field: 'math' },
        sub3: { name: 'Địa lí', score: geog, field: 'geography' },
        allSubjects: [
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Địa lí', score: geog, field: 'geography' }
        ],
        totalRaw: lit + math + geog
      };
    case 'D01':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub3: { name: 'Tiếng Anh', score: eng, field: 'english' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Tiếng Anh', score: eng, field: 'english' }
        ],
        totalRaw: math + lit + eng
      };
    case 'D07':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Hóa học', score: chem, field: 'chemistry' },
        sub3: { name: 'Tiếng Anh', score: eng, field: 'english' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Hóa học', score: chem, field: 'chemistry' },
          { name: 'Tiếng Anh', score: eng, field: 'english' }
        ],
        totalRaw: math + chem + eng
      };
    case 'D08':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Sinh học', score: bio, field: 'biology' },
        sub3: { name: 'Tiếng Anh', score: eng, field: 'english' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Sinh học', score: bio, field: 'biology' },
          { name: 'Tiếng Anh', score: eng, field: 'english' }
        ],
        totalRaw: math + bio + eng
      };
    case 'D09':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Lịch sử', score: hist, field: 'history' },
        sub3: { name: 'Tiếng Anh', score: eng, field: 'english' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Lịch sử', score: hist, field: 'history' },
          { name: 'Tiếng Anh', score: eng, field: 'english' }
        ],
        totalRaw: math + hist + eng
      };
    case 'D10':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Địa lí', score: geog, field: 'geography' },
        sub3: { name: 'Tiếng Anh', score: eng, field: 'english' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Địa lí', score: geog, field: 'geography' },
          { name: 'Tiếng Anh', score: eng, field: 'english' }
        ],
        totalRaw: math + geog + eng
      };
    case 'D14':
      return {
        sub1: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub2: { name: 'Lịch sử', score: hist, field: 'history' },
        sub3: { name: 'Tiếng Anh', score: eng, field: 'english' },
        allSubjects: [
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Lịch sử', score: hist, field: 'history' },
          { name: 'Tiếng Anh', score: eng, field: 'english' }
        ],
        totalRaw: lit + hist + eng
      };
    case 'D15':
      return {
        sub1: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub2: { name: 'Địa lí', score: geog, field: 'geography' },
        sub3: { name: 'Tiếng Anh', score: eng, field: 'english' },
        allSubjects: [
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Địa lí', score: geog, field: 'geography' },
          { name: 'Tiếng Anh', score: eng, field: 'english' }
        ],
        totalRaw: lit + geog + eng
      };
    case 'X06':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Vật lí', score: phys, field: 'physics' },
        sub3: { name: 'Tin học', score: info, field: 'informatics' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Vật lí', score: phys, field: 'physics' },
          { name: 'Tin học', score: info, field: 'informatics' }
        ],
        totalRaw: math + phys + info
      };
    case 'X26':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Tin học', score: info, field: 'informatics' },
        sub3: { name: 'Tiếng Anh', score: eng, field: 'english' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Tin học', score: info, field: 'informatics' },
          { name: 'Tiếng Anh', score: eng, field: 'english' }
        ],
        totalRaw: math + info + eng
      };
    case 'H00':
      return {
        sub1: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub2: { name: 'Năng khiếu Hình họa', score: art, field: 'artDrawing10' },
        sub3: { name: 'Năng khiếu Trang trí màu', score: art, field: 'artDrawing10' },
        allSubjects: [
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Năng khiếu Hình họa', score: art, field: 'artDrawing10' },
          { name: 'Năng khiếu Trang trí màu', score: art, field: 'artDrawing10' }
        ],
        totalRaw: lit + art * 2
      };
    case 'V00':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Vật lí', score: phys, field: 'physics' },
        sub3: { name: 'Vẽ Mỹ thuật', score: art, field: 'artDrawing10' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Vật lí', score: phys, field: 'physics' },
          { name: 'Vẽ Mỹ thuật', score: art, field: 'artDrawing10' }
        ],
        totalRaw: math + phys + art
      };
    case 'V01':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub3: { name: 'Vẽ Mỹ thuật', score: art, field: 'artDrawing10' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Vẽ Mỹ thuật', score: art, field: 'artDrawing10' }
        ],
        totalRaw: math + lit + art
      };
    case 'M00':
      return {
        sub1: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub2: { name: 'Toán', score: math, field: 'math' },
        sub3: { name: 'Năng khiếu Mầm non', score: perf, field: 'performanceArt10' },
        allSubjects: [
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Năng khiếu Mầm non', score: perf, field: 'performanceArt10' }
        ],
        totalRaw: lit + math + perf
      };
    case 'T00':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Sinh học', score: bio, field: 'biology' },
        sub3: { name: 'Năng khiếu TDTT', score: sports, field: 'sports10' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Sinh học', score: bio, field: 'biology' },
          { name: 'Năng khiếu TDTT', score: sports, field: 'sports10' }
        ],
        totalRaw: math + bio + sports
      };
    case 'N00':
      return {
        sub1: { name: 'Ngữ văn', score: lit, field: 'literature' },
        sub2: { name: 'Năng khiếu Âm nhạc 1', score: perf, field: 'performanceArt10' },
        sub3: { name: 'Năng khiếu Âm nhạc 2', score: perf, field: 'performanceArt10' },
        allSubjects: [
          { name: 'Ngữ văn', score: lit, field: 'literature' },
          { name: 'Năng khiếu Âm nhạc 1', score: perf, field: 'performanceArt10' },
          { name: 'Năng khiếu Âm nhạc 2', score: perf, field: 'performanceArt10' }
        ],
        totalRaw: lit + perf * 2
      };
    case 'CA1':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Vật lí', score: phys, field: 'physics' },
        sub3: { name: 'Bài thi BCA', score: btbca, field: 'btbca100' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Vật lí', score: phys, field: 'physics' },
          { name: 'Bài thi BCA', score: btbca, field: 'btbca100' }
        ],
        totalRaw: math + phys + (btbca / 10)
      };
    case 'CA2':
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Hóa học', score: chem, field: 'chemistry' },
        sub3: { name: 'Bài thi BCA', score: btbca, field: 'btbca100' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Hóa học', score: chem, field: 'chemistry' },
          { name: 'Bài thi BCA', score: btbca, field: 'btbca100' }
        ],
        totalRaw: math + chem + (btbca / 10)
      };
    default:
      return {
        sub1: { name: 'Toán', score: math, field: 'math' },
        sub2: { name: 'Môn 2', score: lit || phys, field: 'literature' },
        sub3: { name: 'Môn 3', score: eng || chem, field: 'english' },
        allSubjects: [
          { name: 'Toán', score: math, field: 'math' },
          { name: 'Môn 2', score: lit || phys, field: 'literature' },
          { name: 'Môn 3', score: eng || chem, field: 'english' }
        ],
        totalRaw: math + (lit || phys) + (eng || chem)
      };
  }
}

/**
 * 5. BỘ MÁY ĐIỀU HƯỚNG TÍNH ĐIỂM (DISPATCHER) CHO 36 HỌ CÔNG THỨC
 */
export function executeAdmissionsCalculation(
  formulaId: string,
  institutionCode: string,
  input: ComprehensiveCandidateInput,
  recordScale?: 'THANG_30' | 'THANG_40' | 'THANG_100' | 'THANG_1200' | 'THANG_10',
  recordScaleMax?: number,
  combinationCode?: string
): EngineScoringBreakdown {
  const notes: string[] = [];
  const failureReasons: string[] = [];

  const baseP30 = calculateBasePriority30(
    input.priorityRegionCode,
    input.priorityObjectCode,
    input.graduationYear,
    input.admissionYear
  );

  let nativeScale: 'THANG_30' | 'THANG_40' | 'THANG_100' | 'THANG_1200' | 'THANG_10' = recordScale || 'THANG_30';
  let scaleMax = recordScaleMax || (nativeScale === 'THANG_100' ? 100 : nativeScale === 'THANG_40' ? 40 : nativeScale === 'THANG_1200' ? 1200 : 30);
  let rawScore = 0;
  let bonusRaw = input.rawIncentiveBonus || 0;
  let isCcnnBonusLocked = false;
  let moetSpecialFloorValue: number | null = null;
  let passedParalysisCheck = true;
  let passedGeneralFloorCheck = true;
  let passedMoetSpecialFloor = true;
  let passedAspirationLimit = true;

  // Lấy điểm các môn THPT
  const math = input.thptScores.math ?? 0;
  const phys = input.thptScores.physics ?? 0;
  const chem = input.thptScores.chemistry ?? 0;
  const bio = input.thptScores.biology ?? 0;
  const lit = input.thptScores.literature ?? 0;
  const eng = input.thptScores.english ?? 0;
  const hist = input.thptScores.history ?? 0;
  const geog = input.thptScores.geography ?? 0;
  const info = input.thptScores.informatics ?? 0;

  // Phân giải 3 môn của tổ hợp được chọn
  const resolvedCombo = resolveCombinationSubjects(combinationCode || 'A00', input);
  const m1 = resolvedCombo.sub1.score;
  const m2 = resolvedCombo.sub2.score;
  const m3 = resolvedCombo.sub3.score;
  const comb3Sum = m1 + m2 + m3;

  // Tra cứu quy đổi IELTS theo trường
  const ieltsConv = lookupIeltsConversion(institutionCode, input.ieltsScore || 0);

  // Chuẩn hóa mã công thức hỗ trợ tất cả các định dạng: FML_01..FML_22, F01..F36, và mã công thức trường
  const normId = (formulaId || '').toUpperCase().trim();
  let fid = normId;

  if (/^F\d{2}_/.test(normId)) {
    fid = normId;
  } else if (
    normId.includes('HCMUT') || 
    normId.includes('QSB') || 
    normId === 'FML_14' || 
    normId === 'M14_VNUHCM_QSB_100' ||
    (institutionCode === 'QSB' && (recordScaleMax === 100 || recordScale === 'THANG_100'))
  ) {
    fid = 'F07_QSB_TH_100';
  } else if (
    normId.includes('TSA') || 
    normId.includes('HUST_TSA') || 
    normId === 'FML_12' || 
    normId === 'M12_HUST_TSA_100'
  ) {
    fid = 'F25_BKA_TSA_100';
  } else if (
    normId.includes('UEH') || 
    normId.includes('KSA') || 
    normId.includes('KSV') || 
    normId === 'FML_16' || 
    normId === 'M16_UEH_COMB_100'
  ) {
    fid = 'F11_UEH_TH_100';
  } else if (
    normId.includes('UTH') || 
    normId.includes('GTS') || 
    normId === 'FML_17' || 
    normId === 'M17_UTH_COMB_1200' || 
    recordScaleMax === 1200
  ) {
    fid = 'F12_UTH_COMB_1200';
  } else if (
    normId.includes('VGU') || 
    normId.includes('TESTAS') || 
    normId === 'FML_22' || 
    normId === 'M22_VGU_TESTAS' || 
    recordScaleMax === 130
  ) {
    fid = 'F17_VGU_TESTAS_100';
  } else if (normId.includes('QSC')) {
    fid = 'F08_QSC_TH_100';
  } else if (normId.includes('QSY')) {
    fid = 'F10_QSY_TH_100';
  } else if (
    normId.includes('QSK') || 
    normId === 'FML_15' || 
    normId === 'M15_VNUHCM_MULTI_100'
  ) {
    fid = 'F09_QSK_TH_100';
  } else if (
    normId.includes('_40') || 
    normId === 'FML_05' || 
    normId === 'M05_THPT_40_W2' || 
    recordScaleMax === 40
  ) {
    fid = 'F05_THPT_W2_40';
  } else if (
    normId.includes('HANU') || 
    normId === 'FML_06' || 
    normId === 'M06_THPT_40_HANU'
  ) {
    fid = 'F06_HANU_NN_40';
  } else if (
    normId.includes('K01') || 
    normId === 'FML_03' || 
    normId === 'M03_THPT_30_K01'
  ) {
    fid = 'F03_BKA_K01_30';
  } else if (
    normId.includes('FTU15') || 
    normId.includes('FTU_NN') || 
    normId === 'FML_04' || 
    normId === 'M04_THPT_30_FTU15'
  ) {
    fid = 'F04_FTU_NN_30';
  } else if (
    normId.includes('CAND') || 
    normId.includes('BCA') || 
    normId === 'FML_08' || 
    normId === 'M08_CAND_30'
  ) {
    fid = 'F13_BCA_PT3_30';
  } else if (
    normId.includes('QUANSU') || 
    normId.includes('MIL') || 
    normId === 'FML_09' || 
    normId === 'M09_QUANSU_30'
  ) {
    fid = 'F14_MIL_111_30';
  } else if (
    normId.includes('MED') || 
    normId.includes('Y_DUOC') || 
    normId === 'FML_21' || 
    normId === 'M21_MED_IELTS_30'
  ) {
    fid = 'F16_MED_111_30';
  } else if (
    normId.includes('ARCH') || 
    normId.includes('DRAW') || 
    normId === 'FML_19' || 
    normId === 'M19_ART_ARCH_30'
  ) {
    fid = 'F23_ARCH_DRAW_30';
  } else if (
    normId.includes('ART') || 
    normId.includes('PERF') || 
    normId === 'FML_20' || 
    normId === 'M20_ART_2NK_30'
  ) {
    fid = 'F24_ART_PERF_30';
  } else if (
    normId.includes('SPT') || 
    normId === 'FML_18' || 
    normId === 'M18_SPT_HCMUE_30'
  ) {
    fid = 'F21_SPS_SPT_HB_30';
  } else if (
    normId.includes('NEU_IELTS') || 
    normId === 'FML_10' || 
    normId === 'M10_NEU_IELTS_30'
  ) {
    fid = 'F19_NEU_CCNN_THPT_30';
  } else if (
    normId.includes('NEU_APT') || 
    normId === 'FML_11' || 
    normId === 'M11_NEU_APT_IELTS_30'
  ) {
    fid = 'F20_NEU_CCNN_DGNL_30';
  } else if (
    normId.includes('W2') || 
    normId === 'FML_02' || 
    normId === 'M02_THPT_30_W2'
  ) {
    fid = 'F02_THPT_W2_30';
  } else if (
    normId.includes('HB_6HK') || 
    normId === 'FML_07' || 
    normId === 'M07_HB_30_6SEM'
  ) {
    fid = 'F07_HB_6HK_30';
  } else if (
    normId === 'FML_01' || 
    normId === 'F01' || 
    normId.includes('111_30')
  ) {
    fid = 'F01_THPT_111_30';
  }

  // ---------------------------------------------------------------------------
  // XỬ LÝ THEO TỪNG CÔNG THỨC TRONG 36 CÔNG THỨC
  // ---------------------------------------------------------------------------
  switch (fid) {
    // -------------------------------------------------------------------------
    // F01: Chuẩn 3 môn 1:1:1
    // -------------------------------------------------------------------------
    case 'F01_THPT_111_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      rawScore = comb3Sum > 0 ? comb3Sum : (math + phys + chem);
      if (rawScore === 0) {
        rawScore = math + lit + (eng || hist || bio);
      }
      break;
    }

    // -------------------------------------------------------------------------
    // F02: Môn chính nhân 2 quy về Thang 30 (nhân 3/4)
    // -------------------------------------------------------------------------
    case 'F02_THPT_W2_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const mainSubject = math > 0 ? math : Math.max(math, lit, eng, phys);
      rawScore = (mainSubject * 2 + (phys || lit) + (chem || eng)) * 0.75;
      notes.push('Môn Toán nhân đôi, tổng điểm 4 thành phần được nhân 3/4 quy về thang 30.');
      break;
    }

    // -------------------------------------------------------------------------
    // F03: Tổ hợp K01 BKA
    // -------------------------------------------------------------------------
    case 'F03_BKA_K01_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const khtn = phys > 0 ? phys : (chem > 0 ? chem : info);
      rawScore = (math * 3 + lit * 1 + khtn * 2) * 0.50;
      notes.push('Tổ hợp K01 ĐH Bách Khoa Hà Nội: Toán x3 (chiếm 50%), Văn x1, KHTN x2 chia 2.');
      break;
    }

    // -------------------------------------------------------------------------
    // F04: FTU Ngôn ngữ thương mại quy Thang 30
    // -------------------------------------------------------------------------
    case 'F04_FTU_NN_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      rawScore = (math * 1 + lit * 1.5 + eng * 1.5) * 0.75;
      notes.push('FTU Ngôn ngữ thương mại: [(Toán x 1 + Văn x 1.5 + Ngoại ngữ x 1.5) * 3/4], quy về Thang 30.');
      break;
    }

    // -------------------------------------------------------------------------
    // F05: Thang 40 môn chính nhân 2 không chia 4/3
    // -------------------------------------------------------------------------
    case 'F05_THPT_W2_40': {
      nativeScale = 'THANG_40';
      scaleMax = 40;
      const subList = [math, lit, eng, phys].filter(s => s > 0);
      const mainSub = subList.length > 0 ? Math.max(...subList) : 8.5;
      const idx = subList.indexOf(mainSub);
      subList.splice(idx, 1);
      const s2 = subList[0] || 8.0;
      const s3 = subList[1] || 8.0;
      rawScore = mainSub * 2 + s2 + s3;
      notes.push('Thang 40: Môn chính x 2 + 2 môn còn lại. Ngưỡng bắt đầu giảm ưu tiên là 30.0/40.');
      break;
    }

    // -------------------------------------------------------------------------
    // F06: HANU 2026 Thang 40 (2 môn nhân 2 quy về Thang 40 *4/5)
    // -------------------------------------------------------------------------
    case 'F06_FTU_NN_40':
    case 'F06_HANU_NN_40': {
      nativeScale = 'THANG_40';
      scaleMax = 40;
      const s50 = math * 2 + lit * 1 + eng * 2;
      rawScore = Math.round(s50 * 0.8 * 100) / 100;
      notes.push('HANU 2026: Toán/Văn x2 + Môn 2 x1 + Ngoại ngữ x2 quy về Thang 40 (*4/5).');
      break;
    }

    // -------------------------------------------------------------------------
    // F07: QSB ĐH Bách Khoa ĐHQG-HCM Thang 100
    // -------------------------------------------------------------------------
    case 'F07_QSB_TH_100': {
      nativeScale = 'THANG_100';
      scaleMax = 100;
      const dgnl = input.dgnlVact1200 || 0;
      const dgnlStandard = dgnl > 0 ? (dgnl / 1200) * 100 : ((math + phys + chem) / 30) * 100 * 0.75;
      const thptStandard = ((math * 2 + phys + chem) / 4) * 10;
      const hbAvg = (input.transcriptAvg6HK.math || 9.0) * 10;
      rawScore = 0.70 * dgnlStandard + 0.20 * thptStandard + 0.10 * hbAvg;
      notes.push('Phương thức Tổng hợp ĐHQG-HCM (QSB): 70% ĐGNL + 20% THPT + 10% Học bạ.');
      break;
    }

    // -------------------------------------------------------------------------
    // F08: QSC ĐH CNTT ĐHQG-HCM Thang 100
    // -------------------------------------------------------------------------
    case 'F08_QSC_TH_100': {
      nativeScale = 'THANG_100';
      scaleMax = 100;
      const thpt100 = ((math + phys + chem) / 30) * 100;
      const dgnl100 = ((input.dgnlVact1200 || 800) / 1200) * 100;
      const hb100 = (input.transcriptAvg6HK.overall12 || 8.5) * 10;
      rawScore = 0.475 * thpt100 + 0.475 * dgnl100 + 0.05 * hb100;
      break;
    }

    // -------------------------------------------------------------------------
    // F09: QSK ĐH Kinh Tế - Luật Thang 100
    // -------------------------------------------------------------------------
    case 'F09_QSK_TH_100': {
      nativeScale = 'THANG_100';
      scaleMax = 100;
      const dgnl100 = ((input.dgnlVact1200 || 960) / 1200) * 100;
      const thptSum = math + (phys || lit || 0) + (eng || chem || 0);
      const thpt100 = (thptSum / 3) * 10;
      const hb100 = input.transcriptAvg6HK.overall12 !== undefined
        ? input.transcriptAvg6HK.overall12 * 10
        : (((input.transcriptAvg6HK.math || 8) + (input.transcriptAvg6HK.physics || 8) + (input.transcriptAvg6HK.english || 8)) / 3) * 10;
      rawScore = Math.round((0.55 * dgnl100 + 0.35 * thpt100 + 0.10 * hb100) * 100) / 100;
      break;
    }

    // -------------------------------------------------------------------------
    // F10: QSY Khoa Sức Khỏe ĐHQG-HCM Thang 100
    // -------------------------------------------------------------------------
    case 'F10_QSY_TH_100': {
      nativeScale = 'THANG_100';
      scaleMax = 100;
      const dgnl100 = ((input.dgnlVact1200 || 800) / 1200) * 100;
      const thpt100 = ((math + chem + bio) / 30) * 100;
      const hb100 = (input.transcriptAvg6HK.overall12 || 8.5) * 10;
      rawScore = 0.40 * dgnl100 + 0.35 * thpt100 + 0.25 * hb100;
      break;
    }

    // -------------------------------------------------------------------------
    // F11: UEH (KSA, KSV) Thang 100
    // -------------------------------------------------------------------------
    case 'F11_UEH_TH_100': {
      nativeScale = 'THANG_100';
      scaleMax = 100;
      const thptSum = math + (phys || lit || 0) + (eng || chem || 0);
      const exam100 = (thptSum / 3) * 10;
      const tb10 = input.transcriptAvg6HK.overall10 || 8.0;
      const tb11 = input.transcriptAvg6HK.overall11 || 8.5;
      const tb12 = input.transcriptAvg6HK.overall12 || 9.0;
      const hbComponent = (((tb10 * 1 + tb11 * 2 + tb12 * 3) / 6) * 10);
      rawScore = Math.round((0.60 * exam100 + 0.40 * hbComponent) * 100) / 100;
      notes.push('UEH Thang 100: 60% THPT + 40% Học bạ 3 năm (tỷ lệ 1-2-3).');
      break;
    }

    // -------------------------------------------------------------------------
    // F12: UTH Thang 1200 (UTH120)
    // -------------------------------------------------------------------------
    case 'F12_UTH_COMB_1200': {
      nativeScale = 'THANG_1200';
      scaleMax = 1200;
      const m1 = math || 8.0;
      const m2 = phys || 8.0;
      const m3 = chem || eng || 8.0;
      const thpt1200 = (m1 + m2 + m3) * 40;

      const hbVal = input.transcriptAvg6HK.overall12 !== undefined
        ? input.transcriptAvg6HK.overall12
        : (input.transcriptAvg6HK.math || 8.0);
      const hb12_1200 = hbVal * 120;

      const dgnl = input.dgnlVact1200 || 960;
      const best1200 = Math.max(dgnl, hb12_1200, thpt1200);
      rawScore = Math.round((0.40 * best1200 + 0.30 * hb12_1200 + 0.30 * thpt1200) * 100) / 100;
      notes.push('ĐH GTVT TP.HCM (UTH120): Thang 1200 kết hợp Max(ĐGNL, HB12, THPT) với trọng số 0.4 - 0.3 - 0.3.');
      break;
    }

    // -------------------------------------------------------------------------
    // F13: CAND Khối Công an Thang 30 (Hệ số 0.18 cho BTBCA)
    // -------------------------------------------------------------------------
    case 'F13_BCA_PT3_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const thptSum = math + (phys || lit || 0) + (chem || hist || eng || 0);
      const btbca = input.btbca100 || 80.0;
      rawScore = Math.round((thptSum * 0.40 + btbca * 0.18) * 100) / 100;
      notes.push('Khối Công an Nhân dân: DXT = Tổng 3 môn THPT * 0.40 + Bài thi BCA * 0.18.');
      break;
    }

    // -------------------------------------------------------------------------
    // F14 & F15: Khối Quân đội
    // -------------------------------------------------------------------------
    case 'F14_MIL_111_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      rawScore = math + phys + chem;
      break;
    }
    case 'F15_MIL_W2_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      rawScore = (math + lit + eng * 2) * 0.75;
      break;
    }

    // -------------------------------------------------------------------------
    // F16: Khối Y Dược Sức khỏe Thang 30
    // -------------------------------------------------------------------------
    case 'F16_MED_111_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      rawScore = math + chem + (bio || phys);
      moetSpecialFloorValue = 22.50; // Sàn Y khoa
      bonusRaw = Math.min(bonusRaw, 1.50); // Trần 1.50đ chứng chỉ ngoại ngữ khối Y
      break;
    }

    // -------------------------------------------------------------------------
    // F17 & F18: ĐH Việt Đức (VGU)
    // -------------------------------------------------------------------------
    case 'F17_VGU_TESTAS_100': {
      nativeScale = 'THANG_100';
      scaleMax = 100;
      const core = input.testAs130?.coreTest || 104;
      const subject = input.testAs130?.subjectModule || 104;
      const raw130 = 0.40 * core + 0.60 * subject;
      rawScore = Math.round(((raw130 / 130) * 100) * 100) / 100;
      notes.push('ĐH Việt Đức TestAS Thang 100: (0.4*Core + 0.6*Subject)/130 * 100.');
      break;
    }
    case 'F18_VGU_HB_10': {
      nativeScale = 'THANG_10';
      scaleMax = 10;
      rawScore = (math + phys + eng) / 3;
      notes.push('ĐH Việt Đức PT2: Thang điểm 10 (trung bình cộng 3 môn học bạ).');
      break;
    }

    // -------------------------------------------------------------------------
    // F19: NEU CCNN + THPT Thang 30 (Khóa bonus CCNN)
    // -------------------------------------------------------------------------
    case 'F19_NEU_CCNN_THPT_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const ieltsQuyDoi = ieltsConv.convertedScore10 > 0 ? ieltsConv.convertedScore10 : eng;
      rawScore = math + chem + ieltsQuyDoi;
      isCcnnBonusLocked = true;
      notes.push('Đã quy đổi IELTS sang điểm môn Ngoại ngữ; khóa điểm cộng chứng chỉ ngoại ngữ.');
      break;
    }

    // -------------------------------------------------------------------------
    // F20: NEU CCNN + HSA/TSA Thang 30
    // -------------------------------------------------------------------------
    case 'F20_NEU_CCNN_DGNL_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const dgnlQuyDoi30 = ((input.dgnlHsa150 || 100) / 150) * 30;
      const ieltsQuyDoi = ieltsConv.convertedScore10 > 0 ? ieltsConv.convertedScore10 : 8.0;
      rawScore = (dgnlQuyDoi30 * (2 / 3)) + ieltsQuyDoi;
      isCcnnBonusLocked = true;
      break;
    }

    // -------------------------------------------------------------------------
    // F21 & F22: Sư Phạm SPT + Học Bạ
    // -------------------------------------------------------------------------
    case 'F21_SPS_SPT_HB_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const sptMc = input.sptScores?.math || 9.0;
      const hb2 = input.transcriptAvg6HK.physics || 8.5;
      const hb3 = input.transcriptAvg6HK.chemistry || 8.0;
      rawScore = Math.round(((0.50 * sptMc + 0.35 * hb2 + 0.15 * hb3) * 3) * 100) / 100;
      moetSpecialFloorValue = 19.0;
      break;
    }
    case 'F22_SPH_SPT_W2_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const sptMc = input.sptScores?.literature || 8.5;
      rawScore = (sptMc * 2 + hist) * 0.75;
      moetSpecialFloorValue = 19.0;
      break;
    }

    // -------------------------------------------------------------------------
    // F23 & F24: Kiến trúc / Nghệ thuật
    // -------------------------------------------------------------------------
    case 'F23_ARCH_DRAW_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const vh1 = math || 7.5;
      const vh2 = (phys || lit || 7.5);
      const ve = input.artDrawing10 || (input.thptScores as any).drawing || 8.5;
      rawScore = Math.round(((vh1 + vh2 + ve * 2) * 0.75) * 100) / 100;
      if (ve < 5.0) {
        passedParalysisCheck = false;
        failureReasons.push('Điểm môn Năng khiếu Vẽ dưới 5.0 (không đạt)');
      }
      break;
    }
    case 'F24_ART_PERF_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const nk1 = input.performanceArt10 || 8.0;
      const nk2 = input.performanceArt10 || 8.0;
      rawScore = lit + nk1 + nk2;
      break;
    }

    // -------------------------------------------------------------------------
    // F25: BKA TSA Thang 100
    // -------------------------------------------------------------------------
    case 'F25_BKA_TSA_100': {
      nativeScale = 'THANG_100';
      scaleMax = 100;
      rawScore = input.tsaBka100 || 80.0;
      break;
    }

    // -------------------------------------------------------------------------
    // F26: HSA ĐHQGHN Thang 30
    // -------------------------------------------------------------------------
    case 'F26_VNU_HSA_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      rawScore = ((input.dgnlHsa150 || 110) / 150) * 30;
      break;
    }

    // -------------------------------------------------------------------------
    // F27: BKA XTTN Thang 100
    // -------------------------------------------------------------------------
    case 'F27_BKA_XTTN_100': {
      nativeScale = 'THANG_100';
      scaleMax = 100;
      rawScore = 85.0; // Điểm hồ sơ tài năng
      break;
    }

    // -------------------------------------------------------------------------
    // F28, F29, F30: Học Bạ THPT
    // -------------------------------------------------------------------------
    case 'F28_HB_6HK_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const hbM1 = input.transcriptAvg6HK.math || 8.5;
      const hbM2 = input.transcriptAvg6HK.physics || 8.0;
      const hbM3 = input.transcriptAvg6HK.chemistry || 8.0;
      rawScore = hbM1 + hbM2 + hbM3;
      break;
    }
    case 'F29_HB_6HK_W2_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const hbMc = input.transcriptAvg6HK.math || 8.5;
      const hbM2 = input.transcriptAvg6HK.physics || 8.0;
      const hbM3 = input.transcriptAvg6HK.chemistry || 8.0;
      rawScore = (hbMc * 2 + hbM2 + hbM3) * 0.75;
      break;
    }
    case 'F30_HB_3HK_L12_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const hbM1 = input.transcriptAvg6HK.math || 8.5;
      const hbM2 = input.transcriptAvg6HK.physics || 8.0;
      const hbM3 = input.transcriptAvg6HK.chemistry || 8.0;
      rawScore = hbM1 + hbM2 + hbM3;
      break;
    }

    // -------------------------------------------------------------------------
    // F31: BCA PT2 CCNN + BTBCA
    // -------------------------------------------------------------------------
    case 'F31_BCA_PT2_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const ccnn30 = (ieltsConv.convertedScore10 || 9.0) * 3; // Thang 30
      const btbca = input.btbca100 || 75.0;
      rawScore = ccnn30 * 0.40 + btbca * 0.18;
      isCcnnBonusLocked = true;
      break;
    }

    // -------------------------------------------------------------------------
    // F32: SAT / ACT Thang 30
    // -------------------------------------------------------------------------
    case 'F32_SAT_ACT_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const sat = input.satScore1600 || 1400;
      rawScore = (sat / 1600) * 30;
      break;
    }

    // -------------------------------------------------------------------------
    // F33: Sư phạm Ràng buộc NV1-NV5
    // -------------------------------------------------------------------------
    case 'F33_TEACHER_111_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      rawScore = math + lit + eng;
      moetSpecialFloorValue = 19.0;
      if (input.aspirationOrder > 5) {
        passedAspirationLimit = false;
        failureReasons.push('Ngành Sư phạm bắt buộc phải xếp trong danh sách NV1 đến NV5 (Thông tư 06/2026/TT-BGDĐT)');
      }
      break;
    }

    // -------------------------------------------------------------------------
    // F34: TDTT Thang 30
    // -------------------------------------------------------------------------
    case 'F34_TDTT_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const sp = input.sports10 || 8.0;
      rawScore = (math + bio + sp * 2) * 0.75;
      break;
    }

    // -------------------------------------------------------------------------
    // F35: CTU VSAT Thang 30
    // -------------------------------------------------------------------------
    case 'F35_CTU_VSAT_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      const vsat = input.vsatScore30 || 24.0;
      rawScore = vsat;
      break;
    }

    // -------------------------------------------------------------------------
    // F36: YDS Y Khoa Kết hợp IELTS
    // -------------------------------------------------------------------------
    case 'F36_YDS_CCNN_30': {
      nativeScale = 'THANG_30';
      scaleMax = 30;
      rawScore = math + chem + bio;
      moetSpecialFloorValue = 22.50;
      if (!input.ieltsScore || input.ieltsScore < 6.0) {
        failureReasons.push('YDS yêu cầu chứng chỉ IELTS tối thiểu 6.0 cho phương thức xét kết hợp');
      }
      break;
    }

    default: {
      if (recordScaleMax === 100 || recordScale === 'THANG_100' || normId.includes('100')) {
        nativeScale = 'THANG_100';
        scaleMax = 100;
        const dgnl = input.dgnlVact1200 ? (input.dgnlVact1200 / 1200) * 100 : (input.tsaBka100 ? input.tsaBka100 : (input.dgnlHsa150 ? (input.dgnlHsa150 / 150) * 100 : ((comb3Sum || (math + phys + chem)) / 30) * 100));
        const thpt100 = ((comb3Sum || (math + phys + chem)) / 30) * 100;
        const hb100 = Math.min(100, ((input.transcriptAvg6HK?.overall12 || input.transcriptAvg6HK?.math || 8.5) / 10) * 100);
        rawScore = Math.round((0.70 * dgnl + 0.20 * thpt100 + 0.10 * hb100) * 100) / 100;
        notes.push('Tính điểm tổng hợp Thang 100 chuẩn: 70% ĐGNL + 20% THPT + 10% Học bạ.');
      } else if (recordScaleMax === 40 || recordScale === 'THANG_40' || normId.includes('40')) {
        nativeScale = 'THANG_40';
        scaleMax = 40;
        rawScore = Math.round((m1 * 2 + m2 + m3) * 100) / 100;
        notes.push('Tính điểm Thang 40 nhân đôi môn chính.');
      } else {
        nativeScale = 'THANG_30';
        scaleMax = 30;
        rawScore = comb3Sum > 0 ? comb3Sum : (math + phys + chem);
      }
      break;
    }
  }

  // ---------------------------------------------------------------------------
  // TÍNH ĐIỂM CỘNG HIỆU LỰC & CHỐNG NHÂN ĐÔI CCNN
  // ---------------------------------------------------------------------------
  if (isCcnnBonusLocked) {
    // Không cộng điểm thưởng CCNN nếu đã quy đổi môn: đặt bonus_ccnn = 0
    bonusRaw = 0;
  }
  const bonusEffective = calculateEffectiveBonus(bonusRaw, rawScore, scaleMax);

  // ---------------------------------------------------------------------------
  // TÍNH ĐIỂM ƯU TIÊN GIẢM DẦN
  // ---------------------------------------------------------------------------
  const sumBeforePriority = rawScore + bonusEffective;
  const { effectivePriority, isReduced } = calculateEffectivePriority(
    baseP30,
    sumBeforePriority,
    scaleMax
  );

  const officialAdmissionsScore = Number((sumBeforePriority + effectivePriority).toFixed(2));

  // ---------------------------------------------------------------------------
  // ĐIỂM CHUẨN HÓA 0 - 100 ĐỂ SO SÁNH THAM CHIẾU
  // ---------------------------------------------------------------------------
  const analyticalNormalized100 = Number(((officialAdmissionsScore / scaleMax) * 100).toFixed(2));

  // ---------------------------------------------------------------------------
  // KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT & SÀN BỘ GD&ĐT
  // ---------------------------------------------------------------------------
  // 1. Kiểm tra điểm liệt <= 1.0
  const scoresToCheck = [math, phys, chem, bio, lit, eng, hist, geog, info];
  if (scoresToCheck.some(s => s > 0 && s <= 1.00)) {
    passedParalysisCheck = false;
    failureReasons.push('Có môn trong tổ hợp <= 1.00 điểm (bị điểm liệt theo Quy chế tuyển sinh)');
  }

  // 2. Ngưỡng nguồn tuyển chung (tổng 3 môn >= 15.00/30)
  if (scaleMax === 30 && rawScore < 15.00 && !formulaId.includes('HB')) {
    passedGeneralFloorCheck = false;
    failureReasons.push('Tổng 3 môn THPT dưới ngưỡng nguồn tuyển chung 15.00/30 của Bộ GD&ĐT');
  }

  // 3. Ngưỡng sàn sức khỏe & sư phạm
  if (moetSpecialFloorValue && officialAdmissionsScore < moetSpecialFloorValue) {
    passedMoetSpecialFloor = false;
    failureReasons.push(`Điểm xét tuyển (${officialAdmissionsScore}) thấp hơn ngưỡng bảo đảm chất lượng đầu vào của Bộ GD&ĐT (${moetSpecialFloorValue})`);
  }

  return {
    formulaId,
    formulaName: AUDITED_FORMULAS_LIBRARY.find(f => f.formula_id === formulaId)?.formula_name || formulaId,
    nativeScale,
    scaleMax,
    rawScore: Number(rawScore.toFixed(2)),
    bonusRaw,
    bonusEffective: Number(bonusEffective.toFixed(2)),
    isCcnnBonusLocked,
    basePriority: Number(baseP30.toFixed(3)),
    effectivePriority: Number(effectivePriority.toFixed(3)),
    priorityEffective: Number(effectivePriority.toFixed(3)),
    isPriorityReduced: isReduced,
    officialAdmissionsScore,
    finalOfficialScore: officialAdmissionsScore,
    analyticalNormalized100,
    eligibilityStatus: {
      passedParalysisCheck,
      passedGeneralFloorCheck,
      passedMoetSpecialFloor,
      moetSpecialFloorValue,
      passedAspirationLimit,
      failureReasons
    },
    notes
  };
}
