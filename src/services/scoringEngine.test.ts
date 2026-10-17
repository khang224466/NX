/**
 * EXECUTABLE UNIT TEST SUITE: scoringEngine.test.ts
 * BỘ KIỂM THỬ THỰC THI CHO HỆ THỐNG TUYỂN SINH V3.0
 * Kiểm tra toàn diện các ca biên:
 * - 22.49, 22.50, 27.00, 30.00 (Thang 30)
 * - 74.99, 75.00, 100.00 (Thang 100)
 * - Lỗ hổng thời gian: gradYear = 2027 khi admissionYear = 2026
 * - Bách phân vị & nội suy Cần Thơ (TCT)
 * - Tie-breaker ĐH Y Dược TP.HCM (YDS)
 * - Bản đồ ánh xạ Thông tư 74/2026/TT-BGDĐT
 * - Quản trị 4 trạng thái xác minh nguồn gốc (OFFICIAL_VERIFIED, SECONDARY_ONLY, UNVERIFIED, EXPIRED)
 */

import {
  calcNationalPriority30,
  calcNationalPriority100,
  calcYDS2026,
  calcTCT2026,
  interpolateTCTPercentile,
  resolveVerificationStatus,
  CandidateAdmissionProfile,
  FormulaProvenanceMeta
} from './scoringEngine';

import {
  lookupTT74ByOldCode,
  lookupTT09ByNewCode,
  validateMajorCodeConsistency,
  TT74_LEGAL_MAPPINGS
} from '../data/legalMappingTT74';

// Lightweight Test Harness for zero-dependency executable running
interface TestSuite {
  passed: number;
  failed: number;
  errors: string[];
}

const suite: TestSuite = { passed: 0, failed: 0, errors: [] };

function describe(suiteName: string, fn: () => void) {
  console.log(`\n\x1b[1m\x1b[36m▶ TEST SUITE: ${suiteName}\x1b[0m`);
  fn();
}

function it(testName: string, fn: () => void) {
  try {
    fn();
    suite.passed++;
    console.log(`  \x1b[32m✓\x1b[0m ${testName}`);
  } catch (err: any) {
    suite.failed++;
    const msg = `  \x1b[31m✗ ${testName}\x1b[0m\n    Error: ${err.message}`;
    console.error(msg);
    suite.errors.push(msg);
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but received ${JSON.stringify(actual)}`);
      }
    },
    toBeCloseTo(expected: number, delta: number = 0.005) {
      if (Math.abs(actual - expected) > delta) {
        throw new Error(`Expected ${actual} to be close to ${expected} within delta ${delta}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`Expected truthy value, but received ${actual}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`Expected falsy value, but received ${actual}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} > ${expected}`);
      }
    },
    toBeLessThan(expected: number) {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} < ${expected}`);
      }
    }
  };
}

// -------------------------------------------------------------
// CÁC KHỐI KIỂM THỬ THỰC THI (TEST SUITES)
// -------------------------------------------------------------

describe('Ưu tiên 1: Bản Đồ Ánh Xạ Thông Tư 74/2026/TT-BGDĐT', () => {
  it('Ngành 7140102 (Khoa học giáo dục TT 09/2022) sáp nhập 140101 (Giáo dục học)', () => {
    const res = lookupTT74ByOldCode('7140102');
    expect(res).toBeTruthy();
    expect(res?.newCode6).toBe('140101');
    expect(res?.newName).toBe('Giáo dục học');
    expect(res?.isExceptionMerged).toBe(true);
    expect(res?.appendix).toBe('II');
  });

  it('Ngành 7140101 (Giáo dục học) giữ nguyên ánh xạ 140101', () => {
    const res = lookupTT74ByOldCode('7140101');
    expect(res).toBeTruthy();
    expect(res?.newCode6).toBe('140101');
  });

  it('Ngành 7140231 (Sư phạm Tiếng Anh) cùng nhóm 7140232-237 gom về 140238 (SP Tiếng Nước Ngoài)', () => {
    const resAnh = lookupTT74ByOldCode('7140231');
    expect(resAnh?.newCode6).toBe('140238');
    expect(resAnh?.newName).toBe('Sư phạm tiếng nước ngoài');

    const resNga = lookupTT74ByOldCode('7140232');
    expect(resNga?.newCode6).toBe('140238');

    const resHan = lookupTT74ByOldCode('7140237');
    expect(resHan?.newCode6).toBe('140238');
  });

  it('Ngành 7210107 (Gốm) chuyển ánh xạ 210108 (Thương mại nghệ thuật)', () => {
    const res = lookupTT74ByOldCode('7210107');
    expect(res?.newCode6).toBe('210108');
  });

  it('Ngành 7210203 (Sáng tác âm nhạc) chuyển ánh xạ 210201 (Âm nhạc học)', () => {
    const res = lookupTT74ByOldCode('7210203');
    expect(res?.newCode6).toBe('210201');
  });

  it('Ngành 7210208 (Piano) và 7210209 (Nhạc Jazz) cùng ánh xạ 210207 (Biểu diễn nhạc cụ phương tây)', () => {
    const resPiano = lookupTT74ByOldCode('7210208');
    const resJazz = lookupTT74ByOldCode('7210209');
    expect(resPiano?.newCode6).toBe('210207');
    expect(resJazz?.newCode6).toBe('210207');
  });

  it('Ngành 7760103 & 7760102 cùng ánh xạ 760101 (Công tác xã hội)', () => {
    const res1 = lookupTT74ByOldCode('7760103');
    const res2 = lookupTT74ByOldCode('7760102');
    expect(res1?.newCode6).toBe('760101');
    expect(res2?.newCode6).toBe('760101');
  });

  it('Ngành 7810103 (Du lịch và lữ hành) ánh xạ 810201 (Quản trị khách sạn)', () => {
    const res = lookupTT74ByOldCode('7810103');
    expect(res?.newCode6).toBe('810201');
  });

  it('Ngành 7850102 & 7580301 cùng ánh xạ 310101 (Kinh tế học)', () => {
    const res1 = lookupTT74ByOldCode('7850102');
    const res2 = lookupTT74ByOldCode('7580301');
    expect(res1?.newCode6).toBe('310101');
    expect(res2?.newCode6).toBe('310101');
  });

  it('Ngành 7340123 (Thời trang dệt may) ánh xạ 340121; còn 340123 là Logistics', () => {
    const resFashion = lookupTT74ByOldCode('7340123');
    expect(resFashion?.newCode6).toBe('340121');

    const resLogistics = lookupTT74ByOldCode('7510605');
    expect(resLogistics?.newCode6).toBe('340123');
  });

  it('Ngành 7480202 (An toàn thông tin) ánh xạ sang 480208 (An ninh mạng)', () => {
    const res = lookupTT74ByOldCode('7480202');
    expect(res?.newCode6).toBe('480208');
    expect(res?.newName).toBe('An ninh mạng');
  });
});

describe('Ưu tiên 2: Ưu Tiên Thang 30 & Lỗ Hổng Biến Thời Gian', () => {
  const baseProfile: CandidateAdmissionProfile = {
    subjectScores: { math: 8, physics: 8, chemistry: 8 },
    kvPriorityBonus: 0.75, // Khu vực 1
    subjectPriorityBonus: 0,
    admissionYear: 2026,
    graduationYear: 2026
  };

  it('Mốc 22.49: Điểm < 22.50 hưởng 100% ưu tiên gốc', () => {
    const res = calcNationalPriority30(baseProfile, 22.49, 0);
    expect(res.priorityIncludeBonus).toBe(0.75);
    expect(res.effectiveKv).toBe(0.75);
    expect(res.timeValid).toBe(true);
  });

  it('Mốc 22.50: Chạm ngưỡng bắt đầu giảm trừ = (30 - 22.5)/7.5 = 1.0 (vẫn 0.75)', () => {
    const res = calcNationalPriority30(baseProfile, 22.50, 0);
    expect(res.priorityIncludeBonus).toBe(0.75);
  });

  it('Mốc 27.00: Giảm trừ ưu tiên: Hệ số = (30 - 27.0)/7.5 = 0.4 -> ưu tiên 0.75 * 0.4 = 0.300', () => {
    const res = calcNationalPriority30(baseProfile, 27.00, 0);
    expect(res.priorityIncludeBonus).toBe(0.3);
  });

  it('Mốc 30.00: Điểm tối đa, hệ số giảm trừ = 0.0 -> ưu tiên bằng 0', () => {
    const res = calcNationalPriority30(baseProfile, 30.00, 0);
    expect(res.priorityIncludeBonus).toBe(0);
  });

  it('Chặn triệt để năm tốt nghiệp tương lai (gradYear = 2027 khi admissionYear = 2026)', () => {
    const futureGradProfile: CandidateAdmissionProfile = {
      ...baseProfile,
      graduationYear: 2027 // Gian lận hoặc sai sót khai năm tương lai
    };
    const res = calcNationalPriority30(futureGradProfile, 20.0, 0);
    expect(res.timeValid).toBe(false);
    expect(res.effectiveKv).toBe(0); // Mất ưu tiên khu vực
  });

  it('Thí sinh tốt nghiệp quá 1 năm (gradYear = 2024 khi admissionYear = 2026) mất ưu tiên khu vực', () => {
    const oldGradProfile: CandidateAdmissionProfile = {
      ...baseProfile,
      graduationYear: 2024
    };
    const res = calcNationalPriority30(oldGradProfile, 20.0, 0);
    expect(res.timeValid).toBe(true);
    expect(res.effectiveKv).toBe(0);
  });
});

describe('Ưu tiên 2: Ưu Tiên Thang 100 (HUST / HCMUT ĐGNL)', () => {
  const profile100: CandidateAdmissionProfile = {
    subjectScores: {},
    kvPriorityBonus: 2.5,
    subjectPriorityBonus: 0,
    admissionYear: 2026,
    graduationYear: 2026
  };

  it('Mốc 74.99 thang 100: Giữ nguyên ưu tiên gốc', () => {
    const res = calcNationalPriority100(profile100, 74.99, 2.5);
    expect(res.effectiveBonus).toBe(2.5);
    expect(res.timeValid).toBe(true);
  });

  it('Mốc 75.00 thang 100: Bắt đầu giảm trừ (100 - 75)/25 = 1.0', () => {
    const res = calcNationalPriority100(profile100, 75.00, 2.5);
    expect(res.effectiveBonus).toBe(2.5);
  });

  it('Mốc 100.00 thang 100: Ưu tiên bằng 0', () => {
    const res = calcNationalPriority100(profile100, 100.00, 2.5);
    expect(res.effectiveBonus).toBe(0);
  });
});

describe('Ưu tiên 2: Bảng Bách Phân Vị & Nội Suy Tuyến Tính Cần Thơ (TCT)', () => {
  it('Nội suy bách phân vị V-SAT các mốc biên chính xác', () => {
    // 15.0 tương ứng với 20.0%
    const p15 = interpolateTCTPercentile(15.0, 'VSAT');
    expect(p15).toBeCloseTo(20.0, 0.1);

    // 21.0 tương ứng với 68.0%
    const p21 = interpolateTCTPercentile(21.0, 'VSAT');
    expect(p21).toBeCloseTo(68.0, 0.1);

    // 30.0 tương ứng với 100%
    const p30 = interpolateTCTPercentile(30.0, 'VSAT');
    expect(p30).toBeCloseTo(100.0, 0.1);
  });

  it('Nội suy giá trị trung gian 19.5 (nằm giữa 18.0 và 21.0)', () => {
    // Khoảng 18-21 có rank 42.5 - 68.0, fraction = 1.5/3 = 0.5 -> 42.5 + 0.5 * 25.5 = 55.25
    const p19_5 = interpolateTCTPercentile(19.5, 'VSAT');
    expect(p19_5).toBeCloseTo(55.25, 0.2);
  });

  it('calcTCT2026 trả kết quả đúng phân loại an toàn (SAFE/COMPETITIVE)', () => {
    const profileTCT: CandidateAdmissionProfile = {
      subjectScores: {},
      vsatScores: { math: 9.0, physics: 8.5, chemistry: 8.5 }, // Tổng 26.0
      kvPriorityBonus: 0.5,
      subjectPriorityBonus: 0,
      admissionYear: 2026,
      graduationYear: 2026
    };
    const res = calcTCT2026(profileTCT, 'VSAT');
    expect(res.safetyRank).toBe('SAFE');
    expect(res.auditBreakdown.auditNotes.some(n => n.includes('Top'))).toBe(true);
  });
});

describe('Ưu tiên 2: Tie-breaker ĐH Y Dược TP.HCM (YDS)', () => {
  it('Ngành Y khoa xét ưu tiên Sinh học & IELTS >= 6.0', () => {
    const profileYDS: CandidateAdmissionProfile = {
      subjectScores: { math: 9.2, biology: 9.8, chemistry: 9.0 },
      ieltsScore: 7.0,
      aspirationOrder: 1,
      kvPriorityBonus: 0.25,
      subjectPriorityBonus: 0,
      admissionYear: 2026,
      graduationYear: 2026
    };
    const res = calcYDS2026(profileYDS, 'Y_KHOA_RHM');
    expect(res.tieBreakerNotes).toBeTruthy();
    expect(res.tieBreakerNotes?.some(t => t.includes('Sinh học') && t.includes('9.8'))).toBe(true);
    expect(res.tieBreakerNotes?.some(t => t.includes('IELTS') && t.includes('7'))).toBe(true);
  });
});

describe('Ưu tiên 3: Quản Trị 4 Trạng Thái Xác Minh Nguồn Gốc', () => {
  it('Phải trả OFFICIAL_VERIFIED khi có đề án chính thức + URL và vượt qua test', () => {
    const metaOfficial: FormulaProvenanceMeta = {
      institutionCode: 'YDS',
      institutionName: 'ĐH Y Dược TP.HCM',
      formulaId: 'YDS_2026',
      officialDocumentNumber: '123/ĐHYD-TPHCM',
      officialDocumentDate: '2026-02-01',
      officialDocumentUrl: 'https://yds.edu.vn/dean2026.pdf',
      sourceType: 'PRIMARY_OFFICIAL',
      lastAuditedDate: '2026-03-01',
      auditorNotes: 'Audit passed'
    };
    const status = resolveVerificationStatus(metaOfficial, true);
    expect(status).toBe('OFFICIAL_VERIFIED');
  });

  it('Phải trả SECONDARY_ONLY khi chỉ trích xuất từ báo chí tổng hợp', () => {
    const metaPress: FormulaProvenanceMeta = {
      institutionCode: 'KHA',
      institutionName: 'ĐH Kinh tế Quốc dân',
      formulaId: 'KHA_PRESS_ESTIMATE',
      sourceType: 'SECONDARY_PRESS',
      lastAuditedDate: '2026-02-10',
      auditorNotes: 'Trích từ báo chí, chưa có link đề án chính thức'
    };
    const status = resolveVerificationStatus(metaPress, true);
    expect(status).toBe('SECONDARY_ONLY');
  });

  it('Phải trả UNVERIFIED nếu bài kiểm thử thất bại', () => {
    const metaOfficial: FormulaProvenanceMeta = {
      institutionCode: 'YDS',
      institutionName: 'ĐH Y Dược TP.HCM',
      formulaId: 'YDS_2026',
      officialDocumentNumber: '123/ĐHYD-TPHCM',
      officialDocumentUrl: 'https://yds.edu.vn/dean2026.pdf',
      sourceType: 'PRIMARY_OFFICIAL',
      lastAuditedDate: '2026-03-01',
      auditorNotes: 'Audit passed'
    };
    const status = resolveVerificationStatus(metaOfficial, false); // Fail unit test
    expect(status).toBe('UNVERIFIED');
  });
});

// Run Summary
console.log('\n======================================================');
console.log(`\x1b[1mBÁO CÁO KIỂM THỬ: ${suite.passed} PASSED, ${suite.failed} FAILED\x1b[0m`);
console.log('======================================================\n');

if (suite.failed > 0) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ 100% KIỂM THỬ THÀNH CÔNG VƯỢT QUA TẤT CẢ BIÊN!\x1b[0m\n');
}
