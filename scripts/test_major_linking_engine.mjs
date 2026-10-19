import assert from 'node:assert';
import seedData from '../src/data/seed_data.json' with { type: 'json' };

// RIASEC Standard Vectors for 10 Sectors
const SECTOR_RIASEC_VECTORS = {
  CNTT_BAN_DAN_AI: [35, 48, 25, 20, 30, 42],
  KY_THUAT_CONG_NGHE: [48, 45, 20, 18, 25, 38],
  KINH_TE_QUAN_TRI: [18, 35, 25, 38, 48, 45],
  Y_DUOC_SUC_KHOE: [30, 48, 18, 46, 22, 36],
  SU_PHAM_GIAO_DUC: [18, 40, 32, 50, 32, 30],
  LUAT_HANH_CHINH: [15, 42, 25, 40, 46, 45],
  XA_HOI_NHAN_VAN: [15, 42, 45, 45, 30, 25],
  KIEN_TRUC_NGHE_THUAT_TDTT: [38, 30, 50, 25, 28, 20],
  NONG_LAM_NGU_SINH_HOC: [48, 42, 20, 25, 22, 30],
  CONG_AN_QUAN_DOI: [46, 36, 15, 35, 42, 45]
};

const SECTOR_META = {
  CNTT_BAN_DAN_AI: {
    name: 'Máy tính, CNTT, Bán dẫn & AI',
    salaryRange: '18 - 50 triệu/tháng',
    salaryMedian: '28 triệu',
    aiRisk: 'Thấp',
    aiRiskPercent: 28,
    popularCombos: ['A00', 'A01', 'D01', 'D07']
  },
  KY_THUAT_CONG_NGHE: {
    name: 'Kỹ thuật - Công nghệ & Xây dựng',
    salaryRange: '15 - 35 triệu/tháng',
    salaryMedian: '22 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 22,
    popularCombos: ['A00', 'A01', 'B00']
  },
  KINH_TE_QUAN_TRI: {
    name: 'Kinh doanh, Quản lý & Tài chính',
    salaryRange: '13 - 38 triệu/tháng',
    salaryMedian: '19 triệu',
    aiRisk: 'Trung bình',
    aiRiskPercent: 44,
    popularCombos: ['A01', 'D01', 'A00', 'D07']
  },
  Y_DUOC_SUC_KHOE: {
    name: 'Sức khỏe & Y Dược',
    salaryRange: '16 - 55 triệu/tháng',
    salaryMedian: '25 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 12,
    popularCombos: ['B00', 'A00', 'D07']
  },
  SU_PHAM_GIAO_DUC: {
    name: 'Khoa học Giáo dục & Sư phạm',
    salaryRange: '10 - 24 triệu/tháng',
    salaryMedian: '15 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 15,
    popularCombos: ['A00', 'A01', 'C00', 'D01']
  },
  LUAT_HANH_CHINH: {
    name: 'Pháp luật & Quản lý Nhà nước',
    salaryRange: '12 - 40 triệu/tháng',
    salaryMedian: '19 triệu',
    aiRisk: 'Trung bình',
    aiRiskPercent: 38,
    popularCombos: ['A00', 'A01', 'C00', 'D01']
  },
  XA_HOI_NHAN_VAN: {
    name: 'Khoa học Xã hội & Nhân văn',
    salaryRange: '11 - 32 triệu/tháng',
    salaryMedian: '17 triệu',
    aiRisk: 'Trung bình',
    aiRiskPercent: 35,
    popularCombos: ['C00', 'D01', 'D14', 'D15']
  },
  KIEN_TRUC_NGHE_THUAT_TDTT: {
    name: 'Kiến trúc, Mỹ thuật & Thiết kế Sáng tạo',
    salaryRange: '14 - 45 triệu/tháng',
    salaryMedian: '23 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 18,
    popularCombos: ['H00', 'V00', 'D01', 'C00']
  },
  NONG_LAM_NGU_SINH_HOC: {
    name: 'Nông Lâm Ngư nghiệp & Sinh học',
    salaryRange: '11 - 28 triệu/tháng',
    salaryMedian: '16 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 14,
    popularCombos: ['A00', 'B00', 'D07']
  },
  CONG_AN_QUAN_DOI: {
    name: 'An ninh, Quốc phòng & Quân sự',
    salaryRange: '12 - 30 triệu/tháng',
    salaryMedian: '18 triệu',
    aiRisk: 'Cực thấp',
    aiRiskPercent: 8,
    popularCombos: ['A00', 'A01', 'C00', 'D01']
  }
};

const COMBINATION_SUBJECTS_MAP = {
  A00: ['math', 'physics', 'chemistry'],
  A01: ['math', 'physics', 'english'],
  A02: ['math', 'physics', 'biology'],
  B00: ['math', 'chemistry', 'biology'],
  C00: ['literature', 'history', 'geography'],
  C01: ['literature', 'math', 'physics'],
  C02: ['literature', 'math', 'chemistry'],
  C03: ['literature', 'math', 'history'],
  C04: ['literature', 'math', 'geography'],
  D01: ['math', 'literature', 'english'],
  D07: ['math', 'chemistry', 'english'],
  D08: ['math', 'biology', 'english'],
  D09: ['math', 'history', 'english'],
  D10: ['math', 'geography', 'english'],
  D14: ['literature', 'history', 'english'],
  D15: ['literature', 'geography', 'english'],
  H00: ['literature'],
  V00: ['math', 'physics'],
  X06: ['math', 'informatics', 'english']
};

function calculateCosineFit(vecA, vecB) {
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < 6; i++) {
    dot += (vecA[i] || 0) * (vecB[i] || 0);
    nA += (vecA[i] || 0) * (vecA[i] || 0);
    nB += (vecB[i] || 0) * (vecB[i] || 0);
  }
  if (nA === 0 || nB === 0) return 0.5;
  return Math.max(0, Math.min(1, dot / (Math.sqrt(nA) * Math.sqrt(nB))));
}

export function linkAndRankMajorsWithDossier(scores, riasec, aiDiagnosis = {}, catalog = seedData.majorCatalogLevelIV) {
  const enteredSubjectCount = Object.values(scores).filter(v => typeof v === 'number' && !isNaN(v)).length;
  const userRiasecVector = [
    typeof riasec.R === 'number' ? riasec.R : 0,
    typeof riasec.I === 'number' ? riasec.I : 0,
    typeof riasec.A === 'number' ? riasec.A : 0,
    typeof riasec.S === 'number' ? riasec.S : 0,
    typeof riasec.E === 'number' ? riasec.E : 0,
    typeof riasec.C === 'number' ? riasec.C : 0
  ];

  const sortedRiasec = Object.entries(riasec).sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));
  const dominantCode = sortedRiasec.slice(0, 3).map(e => e[0]).join('');

  const recommendedSectors = Array.isArray(aiDiagnosis.recommendedSectors) ? aiDiagnosis.recommendedSectors : [];
  const avoidSectors = Array.isArray(aiDiagnosis.avoidSectors) ? aiDiagnosis.avoidSectors : [];
  const recommendedKeywords = Array.isArray(aiDiagnosis.recommendedKeywords)
    ? aiDiagnosis.recommendedKeywords.map(k => String(k).toLowerCase())
    : [];

  return catalog.map(m => {
    const sectorKey = m.sector || 'CNTT_BAN_DAN_AI';
    const meta = SECTOR_META[sectorKey] || SECTOR_META.CNTT_BAN_DAN_AI;
    const targetVector = SECTOR_RIASEC_VECTORS[sectorKey] || [30, 30, 30, 30, 30, 30];
    const riasecFit = calculateCosineFit(userRiasecVector, targetVector) * 100;

    // Check combinations
    const combos = m.admissionsCombos && m.admissionsCombos.length > 0 ? m.admissionsCombos : meta.popularCombos;
    const validCombos = [];

    for (const comboCode of combos) {
      const neededSubjects = COMBINATION_SUBJECTS_MAP[comboCode];
      if (!neededSubjects) continue;
      let hasAll = true;
      let sum = 0;
      for (const subj of neededSubjects) {
        const val = scores[subj];
        if (typeof val !== 'number' || isNaN(val)) {
          hasAll = false;
          break;
        }
        sum += val;
      }
      if (hasAll) {
        // scale to 30 if needed (e.g. H00 with only 1 subject)
        const scaledScore = neededSubjects.length === 3 ? sum : (sum / neededSubjects.length) * 3;
        validCombos.push({ comboCode, score: Number(scaledScore.toFixed(2)) });
      }
    }

    const hasEligibleCombo = validCombos.length > 0;
    const bestCombo = hasEligibleCombo
      ? validCombos.sort((a, b) => b.score - a.score)[0]
      : null;

    let comboFitScore = 0;
    if (hasEligibleCombo && bestCombo) {
      comboFitScore = Math.min(100, Math.max(0, (bestCombo.score / 30) * 100));
    }

    // AI Semantic Alignment
    let aiAlignment = 50;
    if (recommendedSectors.includes(sectorKey)) aiAlignment += 25;
    if (avoidSectors.includes(sectorKey)) aiAlignment -= 40;
    if (recommendedKeywords.some(kw => m.name.toLowerCase().includes(kw))) aiAlignment += 20;
    aiAlignment = Math.max(0, Math.min(100, aiAlignment));

    // Hard disqualification rule:
    // If student entered >= 3 subjects, but has ZERO valid combinations for this major,
    // they cannot qualify for this major under current exam selection!
    let fitPercent = 0;
    let isDisqualified = false;
    let fitReason = '';

    if (enteredSubjectCount >= 3 && !hasEligibleCombo) {
      isDisqualified = true;
      fitPercent = Math.min(35, Math.round(riasecFit * 0.35));
      fitReason = `Chưa đủ điều kiện xét tuyển: Hồ sơ chưa có điểm các môn bắt buộc trong tổ hợp (${combos.slice(0, 3).join(', ')}).`;
    } else if (enteredSubjectCount >= 3 && avoidSectors.includes(sectorKey)) {
      fitPercent = Math.min(42, Math.round(riasecFit * 0.4));
      fitReason = `Không khuyến nghị: Ngành thuộc nhóm hạn chế do không phù hợp với xu hướng điểm thi và thiên hướng sở thích.`;
    } else {
      // Valid eligible match
      fitPercent = Math.round(0.40 * comboFitScore + 0.35 * riasecFit + 0.25 * aiAlignment);
      fitPercent = Math.min(98, Math.max(48, fitPercent));
      if (bestCombo && bestCombo.score >= 24) {
        fitReason = `Lợi thế xét tuyển vượt trội tổ hợp ${bestCombo.comboCode} (${bestCombo.score}đ), tương thích cao với miền sở thích ${meta.name} (mã đỉnh ${dominantCode}).`;
      } else if (bestCombo) {
        fitReason = `Phù hợp với tổ hợp ${bestCombo.comboCode} (${bestCombo.score}đ) và thiên hướng ${meta.name}.`;
      } else {
        fitReason = `Phù hợp với nhóm sở thích ${meta.name} (mã đỉnh ${dominantCode}).`;
      }
    }

    return {
      codeTT09: m.codeTT09,
      codeTT74: m.codeTT74,
      name: m.name,
      sector: sectorKey,
      sectorName: meta.name,
      fitPercent,
      isAiRecommended: !isDisqualified && fitPercent >= 80,
      fitReason,
      targetJobs: m.targetJobs || [],
      salaryMedian: meta.salaryMedian + '/tháng',
      aiRisk: meta.aiRisk,
      aiRiskPercent: meta.aiRiskPercent,
      popularCombos: combos,
      bestCombo: bestCombo ? bestCombo.comboCode : combos[0],
      bestComboScore: bestCombo ? bestCombo.score : null
    };
  }).sort((a, b) => b.fitPercent - a.fitPercent);
}

// -------------------------------------------------------------
// VERIFY SCENARIO 1: Pure Humanities User Test Case
// -------------------------------------------------------------
console.log('--- TEST 1: User Case: Văn=10, Anh=10, Sử=10, Địa=10, RIASEC A=50 ---');
const humanitiesScores = { literature: 10, english: 10, history: 10, geography: 10 };
const humanitiesRiasec = { R: 0, I: 0, A: 50, S: 0, E: 19, C: 17 };
const humanitiesAiDiagnosis = {
  recommendedSectors: ['XA_HOI_NHAN_VAN', 'KIEN_TRUC_NGHE_THUAT_TDTT', 'SU_PHAM_GIAO_DUC'],
  avoidSectors: ['CNTT_BAN_DAN_AI', 'KY_THUAT_CONG_NGHE', 'Y_DUOC_SUC_KHOE'],
  recommendedKeywords: ['truyền thông', 'báo chí', 'quan hệ công chúng', 'thiết kế đồ họa', 'ngữ văn']
};

const res1 = linkAndRankMajorsWithDossier(humanitiesScores, humanitiesRiasec, humanitiesAiDiagnosis);

console.log('Top 6 Recommended Majors:');
res1.slice(0, 6).forEach((m, idx) => {
  console.log(`  ${idx + 1}. [${m.codeTT09}] ${m.name} (${m.sector}) - Fit: ${m.fitPercent}% - Best Combo: ${m.bestCombo} (${m.bestComboScore}đ)`);
});

const topNames = res1.slice(0, 6).map(m => m.name);
assert(topNames.includes('Truyền thông đa phương tiện') || topNames.includes('Báo chí') || topNames.includes('Thiết kế đồ họa'));
assert(!topNames.includes('Kỹ thuật vi mạch bán dẫn'), 'Semiconductor MUST NOT be in top recommendations');
assert(!topNames.includes('Khoa học máy tính'), 'Computer Science MUST NOT be in top recommendations');
assert(!topNames.includes('Sư phạm Toán học'), 'Math Education MUST NOT be in top recommendations');

const semiconductor = res1.find(m => m.name === 'Kỹ thuật vi mạch bán dẫn');
console.log('Semiconductor Fit:', semiconductor.fitPercent, '% (Disqualified:', semiconductor.fitPercent <= 38, ')');
assert(semiconductor.fitPercent <= 38, 'Semiconductor must have fitPercent <= 38%');

console.log('✅ TEST 1 PASSED: Humanities student strictly recommended Humanities/Arts, STEM strictly disqualified!\n');

// -------------------------------------------------------------
// VERIFY SCENARIO 2: Pure STEM User Test Case
// -------------------------------------------------------------
console.log('--- TEST 2: STEM Case: Toán=9.0, Lý=8.8, Hóa=8.5, Tin=9.0, RIASEC R=45, I=48 ---');
const stemScores = { math: 9.0, physics: 8.8, chemistry: 8.5, informatics: 9.0 };
const stemRiasec = { R: 45, I: 48, A: 15, S: 20, E: 25, C: 40 };
const stemAiDiagnosis = {
  recommendedSectors: ['CNTT_BAN_DAN_AI', 'KY_THUAT_CONG_NGHE'],
  avoidSectors: ['XA_HOI_NHAN_VAN', 'SU_PHAM_GIAO_DUC'],
  recommendedKeywords: ['máy tính', 'công nghệ thông tin', 'bán dẫn', 'tự động hóa']
};

const res2 = linkAndRankMajorsWithDossier(stemScores, stemRiasec, stemAiDiagnosis);

console.log('Top 6 Recommended Majors:');
res2.slice(0, 6).forEach((m, idx) => {
  console.log(`  ${idx + 1}. [${m.codeTT09}] ${m.name} (${m.sector}) - Fit: ${m.fitPercent}% - Best Combo: ${m.bestCombo} (${m.bestComboScore}đ)`);
});

const topNames2 = res2.slice(0, 6).map(m => m.name);
assert(topNames2.includes('Khoa học máy tính') || topNames2.includes('Công nghệ thông tin') || topNames2.includes('Kỹ thuật vi mạch bán dẫn'));
assert(!topNames2.includes('Sư phạm Ngữ văn'), 'Literature Education MUST NOT be in top recommendations');
assert(!topNames2.includes('Báo chí'), 'Journalism MUST NOT be in top recommendations');

console.log('✅ TEST 2 PASSED: STEM student strictly recommended STEM, Humanities disqualified!\n');
console.log('🎉 ALL LINKING ENGINE TESTS PASSED 100%!');
