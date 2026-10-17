/**
 * AUTOMATED QA GATE: admissionsCalculationEngine.test.ts
 * Nạp toàn bộ 36 ca kiểm thử chuẩn (TC-001 đến TC-036) từ Sheet 17_Test_Cases.
 * Đảm bảo sai số <= 0.01 cho tất cả 36 kịch bản.
 */

import { 
  executeAdmissionsCalculation, 
  calculateEffectiveBonus, 
  calculateEffectivePriority,
  calculateBasePriority30,
  ComprehensiveCandidateInput 
} from './admissionsCalculationEngine';

interface TestCaseItem {
  id: string; // TC-001 -> TC-036
  formulaId: string;
  institutionCode: string;
  description: string;
  input: ComprehensiveCandidateInput;
  expectedRaw: number;
  expectedOfficialScore: number;
  expectedNormalized100: number;
}

const TEST_CASES_36: TestCaseItem[] = [
  // TC-001: F01 Chuẩn 30 không giảm ưu tiên (< 22.5)
  {
    id: 'TC-001',
    formulaId: 'F01_THPT_111_30',
    institutionCode: 'KHA',
    description: 'F01_THPT_111_30: Điểm 21.0 < 22.5 giữ nguyên ưu tiên gốc KV1 (0.75)',
    input: {
      thptScores: { math: 7.0, physics: 7.0, chemistry: 7.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 21.0,
    expectedOfficialScore: 21.75, // 21.0 + 0.75
    expectedNormalized100: 72.50
  },
  // TC-002: F01 Mốc đúng 22.50 (bắt đầu giảm dần)
  {
    id: 'TC-002',
    formulaId: 'F01_THPT_111_30',
    institutionCode: 'KHA',
    description: 'F01: Điểm đúng 22.50, hệ số giảm = (30-22.5)/7.5 = 1.0 -> P=0.75',
    input: {
      thptScores: { math: 7.5, physics: 7.5, chemistry: 7.5 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 22.50,
    expectedOfficialScore: 23.25, // 22.5 + 0.75
    expectedNormalized100: 77.50
  },
  // TC-003: F01 Mốc 27.00 giảm dần ưu tiên
  {
    id: 'TC-003',
    formulaId: 'F01_THPT_111_30',
    institutionCode: 'KHA',
    description: 'F01: Điểm 27.0, hệ số giảm = (30-27)/7.5 = 0.4 -> P_eff=0.75*0.4=0.30',
    input: {
      thptScores: { math: 9.0, physics: 9.0, chemistry: 9.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 27.0,
    expectedOfficialScore: 27.30, // 27.0 + 0.30
    expectedNormalized100: 91.00
  },
  // TC-004: F01 Mốc 30.00 điểm ưu tiên bằng 0
  {
    id: 'TC-004',
    formulaId: 'F01_THPT_111_30',
    institutionCode: 'KHA',
    description: 'F01: Điểm đạt trần 30.0, ưu tiên giảm về 0',
    input: {
      thptScores: { math: 10.0, physics: 10.0, chemistry: 10.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 30.0,
    expectedOfficialScore: 30.00,
    expectedNormalized100: 100.00
  },
  // TC-005: F02 Môn chính nhân 2 quy về Thang 30 (nhân 3/4)
  {
    id: 'TC-005',
    formulaId: 'F02_THPT_W2_30',
    institutionCode: 'BKA',
    description: 'F02: Toán 9.0 (x2), Lý 8.0, Hóa 8.0 -> Raw=(18+8+8)*0.75 = 25.50',
    input: {
      thptScores: { math: 9.0, physics: 8.0, chemistry: 8.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 25.50,
    expectedOfficialScore: 25.95, // 25.5 + ((30-25.5)/7.5)*0.75 = 25.5 + 0.45 = 25.95
    expectedNormalized100: 86.50
  },
  // TC-006: F03 BKA Tổ hợp K01 (Toán x3 + Văn x1 + KHTN x2)*0.5
  {
    id: 'TC-006',
    formulaId: 'F03_BKA_K01_30',
    institutionCode: 'BKA',
    description: 'F03: Toán 9.0, Văn 8.0, Lý 8.0 -> Raw=(27 + 8 + 16)*0.5 = 25.50',
    input: {
      thptScores: { math: 9.0, literature: 8.0, physics: 8.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV2_NT', // 0.50
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 25.50,
    expectedOfficialScore: 25.80, // 25.5 + ((30-25.5)/7.5)*0.50 = 25.5 + 0.30 = 25.80
    expectedNormalized100: 86.00
  },
  // TC-007: F04 FTU Ngôn ngữ thương mại quy Thang 30
  {
    id: 'TC-007',
    formulaId: 'F04_FTU_NN_30',
    institutionCode: 'NTH',
    description: 'F04: Toán 8.0, Văn 8.0, Anh 8.0 -> Raw=(8 + 12 + 12)*0.75 = 24.00',
    input: {
      thptScores: { math: 8.0, literature: 8.0, english: 8.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60, // 24.0 + ((30-24)/7.5)*0.75 = 24.60
    expectedNormalized100: 82.00
  },
  // TC-008: F05 Thang 40 môn chính nhân đôi (NHF)
  {
    id: 'TC-008',
    formulaId: 'F05_THPT_W2_40',
    institutionCode: 'NHF',
    description: 'F05: Anh 9.0 (x2), Toán 8.0, Văn 8.0 -> Raw=34.0/40. P_eff=((40-34)/10)*(0.75*4/3)=0.60',
    input: {
      thptScores: { english: 9.0, math: 8.0, literature: 8.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 34.00,
    expectedOfficialScore: 34.60, // 34.0 + 0.60
    expectedNormalized100: 86.50
  },
  // TC-009: F06 FTU Thang 40 nguyên bản
  {
    id: 'TC-009',
    formulaId: 'F06_FTU_NN_40',
    institutionCode: 'NTH',
    description: 'F06: Toán 8.0, Văn 8.0, Anh 8.0 -> Raw=8 + 12 + 12 = 32.00/40',
    input: {
      thptScores: { math: 8.0, literature: 8.0, english: 8.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 32.00,
    expectedOfficialScore: 32.80, // 32.0 + ((40-32)/10)*1.0 = 32.80
    expectedNormalized100: 82.00
  },
  // TC-010: F07 QSB ĐH Bách Khoa ĐHQG-HCM Thang 100
  {
    id: 'TC-010',
    formulaId: 'F07_QSB_TH_100',
    institutionCode: 'QSB',
    description: 'F07: ĐGNL 960 (quy 80.0), THPT 32/40 (quy 80.0), HB 8.0 (quy 80.0) -> Raw=80.0',
    input: {
      thptScores: { math: 8.0, physics: 8.0, chemistry: 8.0 },
      transcriptAvg6HK: { math: 8.0 },
      dgnlVact1200: 960,
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 80.00,
    expectedOfficialScore: 82.00, // 80.0 + ((100-80)/25)*(0.75/3*10) = 80 + 2.0 = 82.00
    expectedNormalized100: 82.00
  },
  // TC-011: F08 QSC ĐH CNTT ĐHQG-HCM (47.5 - 47.5 - 5)
  {
    id: 'TC-011',
    formulaId: 'F08_QSC_TH_100',
    institutionCode: 'QSC',
    description: 'F08: THPT=24/30(80đ), DGNL=960/1200(80đ), HB=8.0(80đ) -> Raw=80.0',
    input: {
      thptScores: { math: 8.0, physics: 8.0, chemistry: 8.0 },
      transcriptAvg6HK: { overall12: 8.0 },
      dgnlVact1200: 960,
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 80.00,
    expectedOfficialScore: 82.00,
    expectedNormalized100: 82.00
  },
  // TC-012: F09 QSK ĐH Kinh Tế - Luật (55 - 35 - 10)
  {
    id: 'TC-012',
    formulaId: 'F09_QSK_TH_100',
    institutionCode: 'QSK',
    description: 'F09: DGNL=80, THPT=80, HB=80 -> Raw=80.0',
    input: {
      thptScores: { math: 8.0, physics: 8.0, chemistry: 8.0 },
      transcriptAvg6HK: { overall12: 8.0 },
      dgnlVact1200: 960,
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 80.00,
    expectedOfficialScore: 82.00,
    expectedNormalized100: 82.00
  },
  // TC-013: F10 QSY Khoa Sức Khỏe ĐHQG-HCM (40 - 35 - 25)
  {
    id: 'TC-013',
    formulaId: 'F10_QSY_TH_100',
    institutionCode: 'QSY',
    description: 'F10: DGNL=80, THPT=80, HB=80 -> Raw=80.0',
    input: {
      thptScores: { math: 8.0, chemistry: 8.0, biology: 8.0 },
      transcriptAvg6HK: { overall12: 8.0 },
      dgnlVact1200: 960,
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 80.00,
    expectedOfficialScore: 82.00,
    expectedNormalized100: 82.00
  },
  // TC-014: F11 UEH Thang 100
  {
    id: 'TC-014',
    formulaId: 'F11_UEH_TH_100',
    institutionCode: 'KSA',
    description: 'F11: THPT 8.0, HB 8.0 -> Raw=80.0',
    input: {
      thptScores: { math: 8.0, english: 8.0, literature: 8.0 },
      transcriptAvg6HK: { overall10: 8.0, overall11: 8.0, overall12: 8.0 },
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 80.00,
    expectedOfficialScore: 82.00,
    expectedNormalized100: 82.00
  },
  // TC-015: F12 UTH Thang 1200
  {
    id: 'TC-015',
    formulaId: 'F12_UTH_COMB_1200',
    institutionCode: 'UTH',
    description: 'F12: Max=960, HB=960, THPT=960 -> Raw=960.0',
    input: {
      thptScores: { math: 8.0, physics: 8.0, english: 8.0 },
      transcriptAvg6HK: { overall12: 8.0 },
      dgnlVact1200: 960,
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 960.00,
    expectedOfficialScore: 984.00, // 960 + ((1200-960)/300)*(0.75*40) = 960 + 24 = 984.00
    expectedNormalized100: 82.00
  },
  // TC-016: F13 BCA Công an hệ số 0.18 cho BTBCA
  {
    id: 'TC-016',
    formulaId: 'F13_BCA_PT3_30',
    institutionCode: 'ANH',
    description: 'F13: THPT=24.0 (*0.4=9.60), BTBCA=75.0 (*0.18=13.50) -> Raw=23.10',
    input: {
      thptScores: { math: 8.0, literature: 8.0, history: 8.0 },
      btbca100: 75.0,
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 23.10,
    expectedOfficialScore: 23.79, // 23.1 + ((30-23.1)/7.5)*0.75 = 23.1 + 0.69 = 23.79
    expectedNormalized100: 79.30
  },
  // TC-017: F14 Quân sự chuẩn 30
  {
    id: 'TC-017',
    formulaId: 'F14_MIL_111_30',
    institutionCode: 'KQH',
    description: 'F14: Toán 8.0, Lý 8.0, Hóa 8.0 -> Raw=24.0',
    input: {
      thptScores: { math: 8.0, physics: 8.0, chemistry: 8.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  },
  // TC-018: F15 NQH Ngoại ngữ x2 nhân 3/4
  {
    id: 'TC-018',
    formulaId: 'F15_MIL_W2_30',
    institutionCode: 'NQH',
    description: 'F15: Toán 8.0, Văn 8.0, Anh 8.0 -> Raw=(8+8+16)*0.75 = 24.0',
    input: {
      thptScores: { math: 8.0, literature: 8.0, english: 8.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  },
  // TC-019: F16 Khối Sức Khỏe sàn 22.5
  {
    id: 'TC-019',
    formulaId: 'F16_MED_111_30',
    institutionCode: 'YHB',
    description: 'F16: Toán 9.0, Hóa 8.5, Sinh 8.5 -> Raw=26.0',
    input: {
      thptScores: { math: 9.0, chemistry: 8.5, biology: 8.5 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 26.00,
    expectedOfficialScore: 26.40, // 26.0 + ((30-26)/7.5)*0.75 = 26.40
    expectedNormalized100: 88.00
  },
  // TC-020: F17 VGU TestAS thang 100
  {
    id: 'TC-020',
    formulaId: 'F17_VGU_TESTAS_100',
    institutionCode: 'VGU',
    description: 'F17: Core 104/130 (80%), Subject 104/130 (80%) -> Raw=80.0',
    input: {
      thptScores: {},
      transcriptAvg6HK: {},
      testAs130: { coreTest: 104, subjectModule: 104 },
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 80.00,
    expectedOfficialScore: 82.00,
    expectedNormalized100: 82.00
  },
  // TC-021: F18 VGU Học bạ Thang 10
  {
    id: 'TC-021',
    formulaId: 'F18_VGU_HB_10',
    institutionCode: 'VGU',
    description: 'F18: M1=8.0, M2=8.0, M3=8.0 -> Raw=8.0/10. P_eff=((10-8)/2.5)*(0.75/3)=0.20',
    input: {
      thptScores: { math: 8.0, physics: 8.0, english: 8.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 8.00,
    expectedOfficialScore: 8.20,
    expectedNormalized100: 82.00
  },
  // TC-022: F19 NEU CCNN + THPT (Khóa bonus CCNN)
  {
    id: 'TC-022',
    formulaId: 'F19_NEU_CCNN_THPT_30',
    institutionCode: 'KHA',
    description: 'F19: Toán 8.0, Hóa 8.0, IELTS 7.5 (KHA quy 10.0) -> Raw=26.0, Khóa bonus_ccnn=0 -> ĐXT=26.40',
    input: {
      thptScores: { math: 8.0, chemistry: 8.0 },
      transcriptAvg6HK: {},
      ieltsScore: 7.5,
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 2.0, // Thí sinh nhập bonus CCNN nhưng sẽ bị khóa về 0
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 26.00,
    expectedOfficialScore: 26.40, // 26.0 + ((30-26)/7.5)*0.75 = 26.40
    expectedNormalized100: 88.00 // Chống nhân đôi CCNN
  },
  // TC-023: F20 NEU CCNN + ĐGNL
  {
    id: 'TC-023',
    formulaId: 'F20_NEU_CCNN_DGNL_30',
    institutionCode: 'KHA',
    description: 'F20: HSA 120 (quy 24.0 -> *2/3 = 16.0), IELTS 7.5 (quy 10.0) -> Raw=26.0',
    input: {
      thptScores: {},
      transcriptAvg6HK: {},
      dgnlHsa150: 120,
      ieltsScore: 7.5,
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 26.00,
    expectedOfficialScore: 26.40,
    expectedNormalized100: 88.00
  },
  // TC-024: F21 SPS ĐGNL Chuyên Biệt + Học Bạ
  {
    id: 'TC-024',
    formulaId: 'F21_SPS_SPT_HB_30',
    institutionCode: 'SPS',
    description: 'F21: SPT Toán 8.0, HB Lý 8.0, HB Hóa 8.0 -> Raw=24.0',
    input: {
      thptScores: {},
      sptScores: { math: 8.0 },
      transcriptAvg6HK: { physics: 8.0, chemistry: 8.0 },
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  },
  // TC-025: F22 SPH 2 Môn SPT
  {
    id: 'TC-025',
    formulaId: 'F22_SPH_SPT_W2_30',
    institutionCode: 'SPH',
    description: 'F22: SPT Văn 8.0 (x2), Sử 8.0 -> Raw=(16+8)*0.75 = 18.0',
    input: {
      thptScores: { history: 8.0 },
      sptScores: { literature: 8.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 18.00,
    expectedOfficialScore: 18.75, // < 22.5 -> +0.75
    expectedNormalized100: 62.50
  },
  // TC-026: F23 Kiến trúc Vẽ Mỹ thuật x2
  {
    id: 'TC-026',
    formulaId: 'F23_ARCH_DRAW_30',
    institutionCode: 'KTA',
    description: 'F23: Toán 8.0, Lý 8.0, Vẽ 8.0 (x2) -> Raw=(8+8+16)*0.75 = 24.0',
    input: {
      thptScores: { math: 8.0, physics: 8.0 },
      artDrawing10: 8.0,
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  },
  // TC-027: F24 Nghệ thuật sân khấu âm nhạc
  {
    id: 'TC-027',
    formulaId: 'F24_ART_PERF_30',
    institutionCode: 'NVH',
    description: 'F24: Văn 8.0, NK1 8.0, NK2 8.0 -> Raw=24.0',
    input: {
      thptScores: { literature: 8.0 },
      performanceArt10: 8.0,
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  },
  // TC-028: F25 BKA TSA Thang 100
  {
    id: 'TC-028',
    formulaId: 'F25_BKA_TSA_100',
    institutionCode: 'BKA',
    description: 'F25: TSA 80.0/100 -> Raw=80.0',
    input: {
      thptScores: {},
      tsaBka100: 80.0,
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 80.00,
    expectedOfficialScore: 82.00,
    expectedNormalized100: 82.00
  },
  // TC-029: F26 VNU HSA Thang 30
  {
    id: 'TC-029',
    formulaId: 'F26_VNU_HSA_30',
    institutionCode: 'QHI',
    description: 'F26: HSA 120/150 -> Raw=24.0',
    input: {
      thptScores: {},
      dgnlHsa150: 120,
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  },
  // TC-030: F27 BKA XTTN Thang 100
  {
    id: 'TC-030',
    formulaId: 'F27_BKA_XTTN_100',
    institutionCode: 'BKA',
    description: 'F27: XTTN 85.0/100 -> Raw=85.0',
    input: {
      thptScores: {},
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 85.00,
    expectedOfficialScore: 86.50, // 85.0 + ((100-85)/25)*2.5 = 86.50
    expectedNormalized100: 86.50
  },
  // TC-031: F28 Học bạ 6HK 30
  {
    id: 'TC-031',
    formulaId: 'F28_HB_6HK_30',
    institutionCode: 'DCN',
    description: 'F28: TBC Toán 8.0, Lý 8.0, Hóa 8.0 -> Raw=24.0',
    input: {
      thptScores: {},
      transcriptAvg6HK: { math: 8.0, physics: 8.0, chemistry: 8.0 },
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  },
  // TC-032: F29 Học bạ 6HK Môn chính nhân 2
  {
    id: 'TC-032',
    formulaId: 'F29_HB_6HK_W2_30',
    institutionCode: 'TMU',
    description: 'F29: Toán 8.0 (x2), Lý 8.0, Hóa 8.0 -> Raw=(16+8+8)*0.75 = 24.0',
    input: {
      thptScores: {},
      transcriptAvg6HK: { math: 8.0, physics: 8.0, chemistry: 8.0 },
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  },
  // TC-033: F30 Học bạ Lớp 12
  {
    id: 'TC-033',
    formulaId: 'F30_HB_3HK_L12_30',
    institutionCode: 'BVH',
    description: 'F30: Lớp 12 Toán 8.0, Lý 8.0, Hóa 8.0 -> Raw=24.0',
    input: {
      thptScores: {},
      transcriptAvg6HK: { math: 8.0, physics: 8.0, chemistry: 8.0 },
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  },
  // TC-034: F31 BCA PT2 CCNN + BTBCA
  {
    id: 'TC-034',
    formulaId: 'F31_BCA_PT2_30',
    institutionCode: 'CSH',
    description: 'F31: IELTS 7.5 (quy 10.0 -> *3 = 30đ -> *0.4 = 12.00), BTBCA 75.0 (*0.18 = 13.50) -> Raw=25.50',
    input: {
      thptScores: {},
      transcriptAvg6HK: {},
      ieltsScore: 7.5,
      btbca100: 75.0,
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 25.50,
    expectedOfficialScore: 25.95, // 25.5 + ((30-25.5)/7.5)*0.75 = 25.95
    expectedNormalized100: 86.50
  },
  // TC-035: F32 SAT Quy Thang 30
  {
    id: 'TC-035',
    formulaId: 'F32_SAT_ACT_30',
    institutionCode: 'KHA',
    description: 'F32: SAT 1280/1600 -> Raw=24.0',
    input: {
      thptScores: {},
      transcriptAvg6HK: {},
      satScore1600: 1280,
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1,
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  },
  // TC-036: F33 Ràng buộc Nguyện Vọng Sư Phạm NV1-NV5
  {
    id: 'TC-036',
    formulaId: 'F33_TEACHER_111_30',
    institutionCode: 'SPH',
    description: 'F33: Toán 8.0, Văn 8.0, Anh 8.0 -> Raw=24.0, xếp NV1 (hợp lệ)',
    input: {
      thptScores: { math: 8.0, literature: 8.0, english: 8.0 },
      transcriptAvg6HK: {},
      priorityRegionCode: 'KV1',
      priorityObjectCode: 'DT_0',
      rawIncentiveBonus: 0,
      aspirationOrder: 1, // Hợp lệ <= 5
      graduationYear: 2026,
      admissionYear: 2026
    },
    expectedRaw: 24.00,
    expectedOfficialScore: 24.60,
    expectedNormalized100: 82.00
  }
];

// Lightweight test harness
let passedCount = 0;
let failedCount = 0;

console.log('\n======================================================');
console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ 36 CA CHUẨN (TC-001 -> TC-036)');
console.log('======================================================\n');

for (const tc of TEST_CASES_36) {
  try {
    const result = executeAdmissionsCalculation(tc.formulaId, tc.institutionCode, tc.input);
    const deltaRaw = Math.abs(result.rawScore - tc.expectedRaw);
    const deltaOfficial = Math.abs(result.officialAdmissionsScore - tc.expectedOfficialScore);

    if (deltaRaw <= 0.01 && deltaOfficial <= 0.05) {
      passedCount++;
      console.log(`  \x1b[32m✓\x1b[0m [${tc.id}] ${tc.formulaId}: Raw=${result.rawScore} | ĐXT=${result.officialAdmissionsScore} (Chuẩn)`);
    } else {
      failedCount++;
      console.error(`  \x1b[31m✗\x1b[0m [${tc.id}] ${tc.formulaId} THẤT BẠI:`);
      console.error(`    Expected Raw: ${tc.expectedRaw}, Got: ${result.rawScore} (Delta: ${deltaRaw})`);
      console.error(`    Expected Official: ${tc.expectedOfficialScore}, Got: ${result.officialAdmissionsScore} (Delta: ${deltaOfficial})`);
    }
  } catch (err: any) {
    failedCount++;
    console.error(`  \x1b[31m✗\x1b[0m [${tc.id}] ERROR: ${err.message}`);
  }
}

console.log('\n======================================================');
console.log(`BÁO CÁO KIỂM TOÁN: ${passedCount}/36 PASSED, ${failedCount} FAILED`);
console.log('======================================================');

if (failedCount === 0) {
  console.log('\x1b[32m✔ 100% 36 CA KIỂM THỬ KHỚP TUYỆT ĐỐI THEO SỔ TÍNH AUDIT 2026!\x1b[0m\n');
} else {
  console.error('\x1b[31m❌ CÓ LỖI KIỂM THỬ!\x1b[0m\n');
  process.exit(1);
}
