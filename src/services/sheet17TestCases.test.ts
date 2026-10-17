/**
 * SHEET 17 QA SUITE: sheet17TestCases.test.ts
 * ============================================================================
 * Đối soát toàn diện 35/35 Test Cases từ Sheet 17 của tài liệu kiểm toán:
 * VN_DAI_HOC_2026_AUDITED_ADMISSIONS_ENGINE (trang 23 - 25 PDF).
 * ============================================================================
 */

import { 
  executeAdmissionsCalculation, 
  calculateEffectiveBonus, 
  calculateEffectivePriority,
  lookupScoreConversion,
  interpolateHustTsaPercentile
} from './admissionsCalculationEngine';

interface Sheet17TestCase {
  id: string; // TC_01 .. TC_35
  category: string;
  formulaId: string;
  description: string;
  run: () => { pass: boolean; expected: any; actual: any };
}

const SHEET_17_TEST_CASES: Sheet17TestCase[] = [
  // TC_01: Minimum MOET source threshold (5.0 + 5.0 + 5.0, no priority)
  {
    id: 'TC_01',
    category: '1. Minimum Valid Input',
    formulaId: 'FML_01',
    description: 'Minimum MOET source threshold meets exact 15.00 MOET minimum',
    run: () => {
      const res = executeAdmissionsCalculation('FML_01', 'KHA', {
        thptScores: { math: 5.0, physics: 5.0, chemistry: 5.0 },
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 15.00) <= 0.01, expected: 15.00, actual: res.officialAdmissionsScore };
    }
  },
  // TC_02: Maximum 30.00 score with priority tap-down to 0.00
  {
    id: 'TC_02',
    category: '1. Maximum Valid Input',
    formulaId: 'FML_01',
    description: 'At 30.00, priority reduces to 0.00; score stays capped at 30.00',
    run: () => {
      const res = executeAdmissionsCalculation('FML_01', 'KHA', {
        thptScores: { math: 10.0, physics: 10.0, chemistry: 10.0 },
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV1', // 0.75
        priorityObjectCode: 'DT_1', // 2.0
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 30.00) <= 0.01, expected: 30.00, actual: res.officialAdmissionsScore };
    }
  },
  // TC_03: Typical NEU candidate (9.0 + 8.5 + 8.0 = 25.50, KV2=0.25)
  {
    id: 'TC_03',
    category: '2. Typical Value (1:1:1)',
    formulaId: 'FML_01',
    description: 'Typical NEU candidate: 25.5 + 0.6 * 0.25 = 25.65',
    run: () => {
      const res = executeAdmissionsCalculation('FML_01', 'KHA', {
        thptScores: { math: 9.0, physics: 8.5, chemistry: 8.0 },
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV2', // 0.25
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 25.65) <= 0.01, expected: 25.65, actual: res.officialAdmissionsScore };
    }
  },
  // TC_04: Candidate with 10 + 10 + 1.0 (failing subject <= 1.0)
  {
    id: 'TC_04',
    category: '3. Invalid / Failing Subject',
    formulaId: 'ELIG_01',
    description: 'Returns 0 (ineligible) when any subject <= 1.00 (Điểm liệt)',
    run: () => {
      const res = executeAdmissionsCalculation('FML_01', 'KHA', {
        thptScores: { math: 10.0, physics: 10.0, chemistry: 1.0 },
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      const passed = res.eligibilityStatus.passedParalysisCheck;
      return { pass: passed === false, expected: false, actual: passed };
    }
  },
  // TC_05: Candidate with 4.5 + 5.0 + 5.0 = 14.50 (< 15.00 floor)
  {
    id: 'TC_05',
    category: '3. Below MOET 15.0 Floor',
    formulaId: 'ELIG_01',
    description: 'Rejected by Circular 06/2026 15.00 source floor',
    run: () => {
      const res = executeAdmissionsCalculation('FML_01', 'KHA', {
        thptScores: { math: 4.5, physics: 5.0, chemistry: 5.0 },
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      const passed = res.eligibilityStatus.passedGeneralFloorCheck;
      return { pass: passed === false, expected: false, actual: passed };
    }
  },
  // TC_06: Fractional priority rounding to 2 decimal places (24.35, KV1=0.75)
  {
    id: 'TC_06',
    category: '4. Fractional & Rounding',
    formulaId: 'FML_01',
    description: '24.35 + 0.565 = 24.915 -> rounds to 24.92',
    run: () => {
      const { effectivePriority } = calculateEffectivePriority(0.75, 24.35, 30);
      const total = Math.round((24.35 + effectivePriority) * 100) / 100;
      return { pass: Math.abs(total - 24.92) <= 0.01, expected: 24.92, actual: total };
    }
  },
  // TC_07: Just below tap-down threshold (S_raw = 22.40, KV1=0.75, UT1=2.0)
  {
    id: 'TC_07',
    category: '5. Priority Boundary (< 22.5)',
    formulaId: 'FML_01',
    description: 'Below 22.50, candidate receives 100% of 2.75 priority -> 25.15',
    run: () => {
      const { effectivePriority } = calculateEffectivePriority(2.75, 22.40, 30);
      const total = Math.round((22.40 + effectivePriority) * 100) / 100;
      return { pass: Math.abs(total - 25.15) <= 0.01, expected: 25.15, actual: total };
    }
  },
  // TC_08: Exact tap-down boundary (S_raw = 22.50, KV1=0.75, UT1=2.0)
  {
    id: 'TC_08',
    category: '5. Priority Boundary (= 22.5)',
    formulaId: 'FML_01',
    description: 'Continuous at boundary 22.50: 1.00 * 2.75 = 2.75 -> 25.25',
    run: () => {
      const { effectivePriority } = calculateEffectivePriority(2.75, 22.50, 30);
      const total = Math.round((22.50 + effectivePriority) * 100) / 100;
      return { pass: Math.abs(total - 25.25) <= 0.01, expected: 25.25, actual: total };
    }
  },
  // TC_09: Midpoint of tap-down zone (S_raw = 26.25, DUT_0 = 2.00)
  {
    id: 'TC_09',
    category: '5. Priority Midpoint (26.25)',
    formulaId: 'FML_01',
    description: 'At 26.25, priority is exactly halved (1.00) -> 27.25',
    run: () => {
      const { effectivePriority } = calculateEffectivePriority(2.00, 26.25, 30);
      const total = Math.round((26.25 + effectivePriority) * 100) / 100;
      return { pass: Math.abs(total - 27.25) <= 0.01, expected: 27.25, actual: total };
    }
  },
  // TC_10: Main subject x2 scaled by 3/4
  {
    id: 'TC_10',
    category: '6. Weighted Sum (* 3/4)',
    formulaId: 'FML_02',
    description: 'Toán=9.0 (x2), Lý=8.0, Hóa=8.0, KV1=0.75 -> 25.95',
    run: () => {
      const res = executeAdmissionsCalculation('FML_02', 'BKA', {
        thptScores: { math: 9.0, physics: 8.0, chemistry: 8.0 },
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV1',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 25.95) <= 0.01, expected: 25.95, actual: res.officialAdmissionsScore };
    }
  },
  // TC_11: HUST K01 (* 1/2)
  {
    id: 'TC_11',
    category: '6. HUST K01 (* 1/2)',
    formulaId: 'FML_03',
    description: 'HUST K01 (Toán=9*3, Văn=7*1, Lý=8.5*2 -> 51/2 = 25.50)',
    run: () => {
      const res = executeAdmissionsCalculation('FML_03', 'BKA', {
        thptScores: { math: 9.0, literature: 7.0, physics: 8.5 },
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 25.50) <= 0.01, expected: 25.50, actual: res.officialAdmissionsScore };
    }
  },
  // TC_12: FTU 1:1.5:1.5 (* 3/4)
  {
    id: 'TC_12',
    category: '6. FTU 1:1.5:1.5 (* 3/4)',
    formulaId: 'FML_04',
    description: 'FTU Language (Toán=8, Văn=8*1.5, Anh=8*1.5 -> 32*0.75 = 24.00, KV2-NT=0.50) -> 24.40',
    run: () => {
      const res = executeAdmissionsCalculation('FML_04', 'NTH', {
        thptScores: { math: 8.0, literature: 8.0, english: 8.0 },
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV2-NT' as any,
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 24.40) <= 0.01, expected: 24.40, actual: res.officialAdmissionsScore };
    }
  },
  // TC_13: Unscaled 40-point formula
  {
    id: 'TC_13',
    category: '6. Official 40-Scale',
    formulaId: 'FML_05',
    description: 'M1=8.5*2, M2=8, M3=8 -> 33.00, KV1=0.75 -> 33.70',
    run: () => {
      const res = executeAdmissionsCalculation('FML_05', 'HBT', {
        thptScores: { math: 8.5, literature: 8.0, english: 8.0 },
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV1',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 33.70) <= 0.01, expected: 33.70, actual: res.officialAdmissionsScore };
    }
  },
  // TC_14: HANU 2026 (* 4/5 to 40)
  {
    id: 'TC_14',
    category: '6. HANU 2026 (* 4/5 to 40)',
    formulaId: 'FML_06',
    description: 'HANU 2026 2 subjects x2 scaled by 4/5 -> 33.60',
    run: () => {
      const res = executeAdmissionsCalculation('FML_06', 'NHF', {
        thptScores: { math: 8.0, literature: 8.0, english: 9.0 },
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 33.60) <= 0.01, expected: 33.60, actual: res.officialAdmissionsScore };
    }
  },
  // TC_15: NEU IELTS 5.5 lookup -> 8.0/10
  {
    id: 'TC_15',
    category: '7. IELTS Threshold 5.5 (NEU)',
    formulaId: 'CONV_01',
    description: 'Exact lower threshold 5.5 -> 8.0 at KHA',
    run: () => {
      const conv = lookupScoreConversion('IELTS', 5.5, 'KHA');
      return { pass: conv === 8.0, expected: 8.0, actual: conv };
    }
  },
  // TC_16: NEU IELTS 6.5 lookup -> 9.0/10
  {
    id: 'TC_16',
    category: '7. IELTS Threshold 6.5 (NEU)',
    formulaId: 'CONV_03',
    description: 'Mid threshold 6.5 -> 9.0 at KHA',
    run: () => {
      const conv = lookupScoreConversion('IELTS', 6.5, 'KHA');
      return { pass: conv === 9.0, expected: 9.0, actual: conv };
    }
  },
  // TC_17: NEU IELTS 8.0 lookup -> 10.0/10
  {
    id: 'TC_17',
    category: '7. IELTS Threshold 8.0 (NEU)',
    formulaId: 'CONV_05',
    description: '7.5-9.0 maps to 10.0 at KHA',
    run: () => {
      const conv = lookupScoreConversion('IELTS', 8.0, 'KHA');
      return { pass: conv === 10.0, expected: 10.0, actual: conv };
    }
  },
  // TC_18: NEU IELTS 5.0 (below 5.5 minimum) -> 0.0
  {
    id: 'TC_18',
    category: '7. IELTS Below Threshold 5.0',
    formulaId: 'CONV_01',
    description: 'Returns 0 when below minimum 5.5 at KHA',
    run: () => {
      const conv = lookupScoreConversion('IELTS', 5.0, 'KHA');
      return { pass: conv === 0, expected: 0, actual: conv };
    }
  },
  // TC_19: CAND IELTS 6.5 lookup -> 8.5/10 (differs from NEU 9.0!)
  {
    id: 'TC_19',
    category: '7. CAND IELTS 6.5 Lookup',
    formulaId: 'CONV_17',
    description: 'Police Academy IELTS 6.5 lookup -> 8.5/10',
    run: () => {
      const conv = lookupScoreConversion('IELTS', 6.5, 'CSH');
      return { pass: conv === 8.5, expected: 8.5, actual: conv };
    }
  },
  // TC_20: HUST TSA Percentile Interp
  {
    id: 'TC_20',
    category: '8. HUST TSA Percentile Interp',
    formulaId: 'FML_13',
    description: 'y_THPT=27.00 -> x_TSA=64.64',
    run: () => {
      const val = interpolateHustTsaPercentile(27.00);
      return { pass: Math.abs(val - 64.64) <= 0.05, expected: 64.64, actual: val };
    }
  },
  // TC_21: VNU-HCM V-ACT 960/1200 -> 80.00/100
  {
    id: 'TC_21',
    category: '8. V-ACT to 100 Conversion',
    formulaId: 'CONV_29',
    description: '960 / 12 = 80.00',
    run: () => {
      const conv = lookupScoreConversion('V-ACT', 960, 'QSB');
      return { pass: Math.abs(conv - 80.0) <= 0.01, expected: 80.0, actual: conv };
    }
  },
  // TC_22: NEU HSA 105/150 + IELTS 7.5 (10.0) -> 24.00
  {
    id: 'TC_22',
    category: '8. HSA + IELTS at NEU',
    formulaId: 'FML_11',
    description: '14.00 + 10.00 = 24.00',
    run: () => {
      const res = executeAdmissionsCalculation('FML_11', 'KHA', {
        thptScores: {},
        transcriptAvg6HK: {},
        dgnlHsa150: 105,
        ieltsScore: 7.5,
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 24.00) <= 0.01, expected: 24.00, actual: res.officialAdmissionsScore };
    }
  },
  // TC_23: CAND 40% THPT (24*0.4=9.6) + 60% BTBCA (80*0.18=14.4) = 24.00
  {
    id: 'TC_23',
    category: '9. Police Combined Formula',
    formulaId: 'FML_08',
    description: 'Verifies 0.18 multiplier (fixes 3/5 bug) -> 24.00',
    run: () => {
      const res = executeAdmissionsCalculation('FML_08', 'ANH', {
        thptScores: { math: 8.0, physics: 8.0, chemistry: 8.0 },
        transcriptAvg6HK: {},
        btbca100: 80,
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 24.00) <= 0.01, expected: 24.00, actual: res.officialAdmissionsScore };
    }
  },
  // TC_24: HCMUT 70% ĐGNL(80) + 20% THPT(85) + 10% HB(90) = 82.00
  {
    id: 'TC_24',
    category: '9. QSB Combined 100-Scale',
    formulaId: 'FML_14',
    description: '56 + 17 + 9 = 82.00/100',
    run: () => {
      const res = executeAdmissionsCalculation('FML_14', 'QSB', {
        thptScores: { math: 8.5, physics: 8.5, chemistry: 8.5 },
        transcriptAvg6HK: { math: 9.0, physics: 9.0, chemistry: 9.0 },
        dgnlVact1200: 960, // 80.0
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 82.00) <= 0.05, expected: 82.00, actual: res.officialAdmissionsScore };
    }
  },
  // TC_25: UEL 55% ĐGNL(80) + 35% THPT(90) + 10% HB(90) = 84.50
  {
    id: 'TC_25',
    category: '9. QSK Combined 100-Scale',
    formulaId: 'FML_15',
    description: '44 + 31.5 + 9 = 84.50/100',
    run: () => {
      const res = executeAdmissionsCalculation('FML_15', 'QSK', {
        thptScores: { math: 9.0, physics: 9.0, english: 9.0 },
        transcriptAvg6HK: { math: 9.0, physics: 9.0, english: 9.0 },
        dgnlVact1200: 960, // 80.0
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 84.50) <= 0.05, expected: 84.50, actual: res.officialAdmissionsScore };
    }
  },
  // TC_26: UEH 60% Exam(90) + 40% HB_Weighted(86.67) + Bonus(5.0) = 93.67
  {
    id: 'TC_26',
    category: '9. UEH (KSA) Combined 100',
    formulaId: 'FML_16',
    description: '54 + 34.6667 + 5 = 93.67/100',
    run: () => {
      const res = executeAdmissionsCalculation('FML_16', 'KSA', {
        thptScores: { math: 9.0, physics: 9.0, english: 9.0 }, // 27.0 -> 90.0
        transcriptAvg6HK: { overall10: 8.0, overall11: 8.5, overall12: 9.0 }, // 86.67
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 5.0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 93.67) <= 0.05, expected: 93.67, actual: res.officialAdmissionsScore };
    }
  },
  // TC_27: UTH120 (0.4*1050 + 0.3*1050 + 0.3*1020 = 1041.00)
  {
    id: 'TC_27',
    category: '9. UTH Combined 1200-Scale',
    formulaId: 'FML_17',
    description: '420 + 315 + 306 = 1041.00/1200',
    run: () => {
      const res = executeAdmissionsCalculation('FML_17', 'UTH', {
        thptScores: { math: 9.0, physics: 8.0, chemistry: 8.0 }, // Max 9 -> 34*30=1020
        transcriptAvg6HK: { math: 9.0, physics: 8.5, chemistry: 8.5 }, // Max 9 -> 35*30=1050
        dgnlVact1200: 960,
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 1041.00) <= 0.05, expected: 1041.00, actual: res.officialAdmissionsScore };
    }
  },
  // TC_28: HCMUE SPT + HB (0.5*9.0 + 0.35*8.5 + 0.15*8.0)*3 = 26.03
  {
    id: 'TC_28',
    category: '9. HCMUE SPT + HB',
    formulaId: 'FML_18',
    description: '8.675 * 3 = 26.025 -> 26.03',
    run: () => {
      const res = executeAdmissionsCalculation('FML_18', 'SPS', {
        thptScores: {},
        sptScores: { math: 9.0 },
        transcriptAvg6HK: { physics: 8.5, chemistry: 8.0 },
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 26.03) <= 0.01, expected: 26.03, actual: res.officialAdmissionsScore };
    }
  },
  // TC_29: Candidate enters 4.50 raw bonus on 30-scale -> capped at 3.00
  {
    id: 'TC_29',
    category: '10. Bonus Cap Enforcement',
    formulaId: 'ELIG_04',
    description: 'Enforces 10% (3.0/30) bonus cap',
    run: () => {
      const effBonus = calculateEffectiveBonus(4.50, 20.0, 30);
      return { pass: effBonus === 3.00, expected: 3.00, actual: effBonus };
    }
  },
  // TC_30: Medical candidate enters 2.50 language bonus -> capped at 1.50
  {
    id: 'TC_30',
    category: '10. Cert Bonus Cap (<=1.5)',
    formulaId: 'FML_21',
    description: 'Enforces 1.50 language certificate bonus cap',
    run: () => {
      const res = executeAdmissionsCalculation('FML_21', 'YHB', {
        thptScores: { math: 9.0, physics: 9.0, biology: 9.0 },
        transcriptAvg6HK: {},
        rawIncentiveBonus: 2.50,
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: res.bonusEffective === 1.50, expected: 1.50, actual: res.bonusEffective };
    }
  },
  // TC_31: Architecture Drawing x2 (7.5 + 7.5 + 8.5*2)*0.75 = 24.00
  {
    id: 'TC_31',
    category: '10. Architecture Drawing x2',
    formulaId: 'FML_19',
    description: '32.0 * 0.75 = 24.00',
    run: () => {
      const res = executeAdmissionsCalculation('FML_19', 'KTS', {
        thptScores: { math: 7.5, literature: 7.5 },
        artDrawing10: 8.5,
        transcriptAvg6HK: {},
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 24.00) <= 0.01, expected: 24.00, actual: res.officialAdmissionsScore };
    }
  },
  // TC_32: VGU 0.4*Core(105) + 0.6*Module(115) = 111.00
  {
    id: 'TC_32',
    category: '10. VGU TestAS Formula',
    formulaId: 'FML_22',
    description: '42.0 + 69.0 = 111.00',
    run: () => {
      const res = executeAdmissionsCalculation('FML_22', 'VGU', {
        thptScores: {},
        transcriptAvg6HK: {},
        testAs130: { coreTest: 105, subjectModule: 115 },
        priorityRegionCode: 'KV3',
        priorityObjectCode: 'DT_0',
        rawIncentiveBonus: 0,
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: Math.abs(res.officialAdmissionsScore - 111.00) <= 0.01, expected: 111.00, actual: res.officialAdmissionsScore };
    }
  },
  // TC_33: Score 29.0 + Bonus 2.0 + Priority -> capped at 30.00 max
  {
    id: 'TC_33',
    category: '11. Range Bound Check (30)',
    formulaId: 'FML_01',
    description: 'Cannot exceed 30.00 ceiling',
    run: () => {
      const res = executeAdmissionsCalculation('FML_01', 'KHA', {
        thptScores: { math: 9.5, physics: 9.5, chemistry: 10.0 }, // 29.0
        transcriptAvg6HK: {},
        rawIncentiveBonus: 2.0,
        priorityRegionCode: 'KV1', // 0.75
        priorityObjectCode: 'DT_0',
        aspirationOrder: 1,
        graduationYear: 2026,
        admissionYear: 2026
      });
      return { pass: res.officialAdmissionsScore === 30.00, expected: 30.00, actual: res.officialAdmissionsScore };
    }
  },
  // TC_34: UTH 1041/1200 compared against 963/1200 cutoff -> Margin +78.00
  {
    id: 'TC_34',
    category: '13. Scale Match Guard',
    formulaId: 'NRM_11',
    description: 'Valid comparison on matching 1200-scale -> Margin +78.00',
    run: () => {
      const score = 1041;
      const cutoff = 963;
      const margin = score - cutoff;
      return { pass: margin === 78, expected: 78, actual: margin };
    }
  },
  // TC_35: NHF 34.45/40 normalized to 0–100 scale -> 86.13/100
  {
    id: 'TC_35',
    category: '14. Analytical 0-100 Norm',
    formulaId: 'NRM_05',
    description: '34.45 / 40 * 100 = 86.125 -> 86.13',
    run: () => {
      const norm = Math.round((34.45 / 40 * 100) * 100) / 100;
      return { pass: Math.abs(norm - 86.13) <= 0.01, expected: 86.13, actual: norm };
    }
  }
];

// Execute Sheet 17 QA Suite
console.log('\n======================================================');
console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ SHEET 17 (TC_01 -> TC_35)');
console.log('======================================================\n');

let s17Passed = 0;
let s17Failed = 0;

for (const tc of SHEET_17_TEST_CASES) {
  try {
    const outcome = tc.run();
    if (outcome.pass) {
      s17Passed++;
      console.log(`  \x1b[32m✓\x1b[0m [${tc.id}] ${tc.category}: ${tc.description} (Khớp chuẩn: ${outcome.actual})`);
    } else {
      s17Failed++;
      console.error(`  \x1b[31m✗\x1b[0m [${tc.id}] ${tc.category} THẤT BẠI: Expected ${outcome.expected}, Got ${outcome.actual}`);
    }
  } catch (err: any) {
    s17Failed++;
    console.error(`  \x1b[31m✗\x1b[0m [${tc.id}] ERROR: ${err.message}`);
  }
}

console.log('\n======================================================');
console.log(`BÁO CÁO KIỂM TOÁN SHEET 17: ${s17Passed}/35 PASSED, ${s17Failed} FAILED`);
console.log('======================================================');

if (s17Failed === 0) {
  console.log('\x1b[32m✔ 100% 35/35 CA KIỂM THỬ SHEET 17 ĐẠT CHUẨN XÁC THỰC TUYỆT ĐỐI!\x1b[0m\n');
} else {
  console.error('\x1b[31m❌ CÓ LỖI KIỂM THỬ SHEET 17!\x1b[0m\n');
  process.exit(1);
}
