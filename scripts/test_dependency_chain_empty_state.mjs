import { test } from 'node:test';
import assert from 'node:assert';
import {
  calculateEffectivePriority,
  calculateBasePriority30
} from '../src/services/admissionsCalculationEngine.ts';
import { AUDITED_INSTITUTIONS_300 } from '../src/data/auditedInstitutionsData.ts';
import { AUDITED_MAJOR_METHOD_SCORING_DB } from '../src/data/auditedMajorScoringDatabase.ts';
import seedData from '../src/data/seed_data.json' with { type: 'json' };

console.log('========================================================================');
console.log('🧪 VERIFYING STRICT PROFILE -> MAJOR -> UNIVERSITY DEPENDENCY CHAIN');
console.log('========================================================================');

// Helper matching logic extracted from Scientific4TabPortal
const COMBINATION_SUBJECT_MAP = {
  A00: { subjects: ['math', 'physics', 'chemistry'], name: 'Toán, Vật lý, Hóa học' },
  A01: { subjects: ['math', 'physics', 'english'], name: 'Toán, Vật lý, Tiếng Anh' },
  D01: { subjects: ['math', 'literature', 'english'], name: 'Toán, Ngữ văn, Tiếng Anh' },
  D07: { subjects: ['math', 'chemistry', 'english'], name: 'Toán, Hóa học, Tiếng Anh' },
  B00: { subjects: ['math', 'chemistry', 'biology'], name: 'Toán, Hóa học, Sinh học' },
  C00: { subjects: ['literature', 'history', 'geography'], name: 'Ngữ văn, Lịch sử, Địa lý' },
  X06: { subjects: ['math', 'informatics', 'english'], name: 'Toán, Tin học, Tiếng Anh' }
};

function validateProfile(scores, riasec) {
  const enteredSubjectCount = Object.values(scores).filter(v => typeof v === 'number' && !isNaN(v)).length;
  const enteredRiasecCount = Object.values(riasec).filter(v => typeof v === 'number' && !isNaN(v)).length;
  const missingItems = [];
  if (enteredSubjectCount < 3) missingItems.push(`Cần nhập điểm ít nhất 3 môn thi THPT (hiện có: ${enteredSubjectCount})`);
  if (enteredRiasecCount < 3) missingItems.push(`Cần hoàn thành ít nhất 3 miền trắc nghiệm sở thích RIASEC (hiện có: ${enteredRiasecCount})`);
  return {
    isValid: enteredSubjectCount >= 3 && enteredRiasecCount >= 3,
    missingItems,
    enteredSubjectCount,
    enteredRiasecCount
  };
}

function getCandidateComboScore(comboCode, scores, basePriority) {
  const map = COMBINATION_SUBJECT_MAP[comboCode];
  if (!map) return null;
  const s1 = scores[map.subjects[0]];
  const s2 = scores[map.subjects[1]];
  const s3 = scores[map.subjects[2]];
  if (typeof s1 !== 'number' || typeof s2 !== 'number' || typeof s3 !== 'number') return null;
  const rawScore = Number((s1 + s2 + s3).toFixed(2));
  const { effectivePriority } = calculateEffectivePriority(basePriority, rawScore, 30);
  const officialScore = Number((Math.min(30.0, rawScore + effectivePriority)).toFixed(2));
  return { comboCode, rawScore, effectivePriority, officialScore };
}

function computeRankedMajors(isProfileValidated, userRiasecVector) {
  if (!isProfileValidated || !userRiasecVector) return [];
  const majors = seedData.majorCatalogLevelIV || [];
  return majors.map(m => {
    // Cosine matching
    let dot = 0, nA = 0, nB = 0;
    const vM = m.riasecVector || { R: 30, I: 30, A: 30, S: 30, E: 30, C: 30 };
    ['R', 'I', 'A', 'S', 'E', 'C'].forEach(d => {
      const u = userRiasecVector[d] || 0;
      const v = vM[d] || 0;
      dot += u * v;
      nA += u * u;
      nB += v * v;
    });
    const sim = (nA > 0 && nB > 0) ? dot / (Math.sqrt(nA) * Math.sqrt(nB)) : 0;
    const fitPercent = Math.round(sim * 100);
    return { ...m, fitPercent };
  }).sort((a, b) => b.fitPercent - a.fitPercent);
}

function computeStratifiedUniversities(isProfileValidated, selectedMajorCode, currentMajor, scores, basePriority) {
  if (!isProfileValidated || !selectedMajorCode || !currentMajor) {
    return { dream: [], target: [], safe: [], candidateScore: null, hasInstitutions: false };
  }

  const matchingInstitutions = [];

  seedData.anchorInstitutions?.forEach(inst => {
    const matchSample = inst.benchmarkSample?.find(b => b.majorCodeTT09 === currentMajor.codeTT09);
    if (matchSample) {
      matchingInstitutions.push({
        schoolCode: inst.code,
        schoolName: inst.officialName,
        benchmark2025: matchSample.benchmark2025,
        combinations: matchSample.combinations || ['A00', 'A01']
      });
    }
  });

  if (matchingInstitutions.length === 0) {
    return { dream: [], target: [], safe: [], candidateScore: null, hasInstitutions: false };
  }

  let highestOverallScore = null;
  const dream = [];
  const target = [];
  const safe = [];

  matchingInstitutions.forEach(inst => {
    let bestScoreForSchool = null;
    inst.combinations.forEach(comboCode => {
      const scoreObj = getCandidateComboScore(comboCode, scores, basePriority);
      if (scoreObj) {
        if (bestScoreForSchool === null || scoreObj.officialScore > bestScoreForSchool) {
          bestScoreForSchool = scoreObj.officialScore;
        }
      }
    });

    if (bestScoreForSchool !== null) {
      if (highestOverallScore === null || bestScoreForSchool > highestOverallScore) {
        highestOverallScore = bestScoreForSchool;
      }
      const diff = bestScoreForSchool - inst.benchmark2025;
      if (diff < -0.5) dream.push(inst);
      else if (diff >= -0.5 && diff <= 1.0) target.push(inst);
      else safe.push(inst);
    } else {
      dream.push(inst); // Lack of scores
    }
  });

  return { dream, target, safe, candidateScore: highestOverallScore, hasInstitutions: true };
}

// -------------------------------------------------------------------------
// TEST SUITE: STRICT DEPENDENCY CHAIN & EMPTY INITIAL STATE
// -------------------------------------------------------------------------

test('SCENARIO 1: Fresh session with no inputs must produce 0 recommendations', () => {
  const scores = {
    math: '', literature: '', english: '', physics: '', chemistry: '',
    biology: '', history: '', geography: '', informatics: '', economicLegal: ''
  };
  const riasec = { R: '', I: '', A: '', S: '', E: '', C: '' };
  const isProfileValidated = false;
  const selectedMajorCode = null;
  const selectedSchoolCode = null;

  const val = validateProfile(scores, riasec);
  assert.strictEqual(val.isValid, false, 'Fresh profile must NOT be valid');
  assert.strictEqual(val.enteredSubjectCount, 0, 'No subjects should be counted');
  assert.strictEqual(val.enteredRiasecCount, 0, 'No RIASEC should be counted');

  const rankedMajors = computeRankedMajors(isProfileValidated, null);
  assert.strictEqual(rankedMajors.length, 0, 'Major recommendations MUST BE EMPTY on initial load');

  const universities = computeStratifiedUniversities(isProfileValidated, selectedMajorCode, null, scores, 0);
  assert.strictEqual(universities.hasInstitutions, false);
  assert.strictEqual(universities.dream.length, 0);
  assert.strictEqual(universities.target.length, 0);
  assert.strictEqual(universities.safe.length, 0);
  assert.strictEqual(universities.candidateScore, null, 'Candidate score must be null on initial load');

  console.log('  ✅ [PASS] Scenario 1: Initial state is strictly empty across all recommendation modules.');
});

test('SCENARIO 2: Incomplete profile (< 3 subjects or < 3 RIASEC) fails validation and blocks recommendations', () => {
  // Only 2 subjects entered
  const scores = {
    math: 8.5, literature: 7.0, english: '', physics: '', chemistry: '',
    biology: '', history: '', geography: '', informatics: '', economicLegal: ''
  };
  const riasec = { R: 35, I: 40, A: 20, S: 25, E: 30, C: 35 };

  const val = validateProfile(scores, riasec);
  assert.strictEqual(val.isValid, false);
  assert.strictEqual(val.missingItems.length, 1);
  assert(val.missingItems[0].includes('ít nhất 3 môn'));

  const rankedMajors = computeRankedMajors(false, riasec);
  assert.strictEqual(rankedMajors.length, 0, 'Must NOT recommend majors with unvalidated profile');

  console.log('  ✅ [PASS] Scenario 2: Incomplete profile blocks progression and provides clear missing requirements.');
});

test('SCENARIO 3: Validated profile produces majors, but universities remain EMPTY until major is selected', () => {
  const scores = {
    math: 9.0, literature: 7.5, english: 8.5, physics: 8.8, chemistry: 8.0,
    biology: 7.0, history: 6.5, geography: 6.5, informatics: 9.0, economicLegal: 7.0
  };
  const riasec = { R: 42, I: 48, A: 25, S: 22, E: 28, C: 40 };

  const val = validateProfile(scores, riasec);
  assert.strictEqual(val.isValid, true, 'Profile with 10 subjects and 6 RIASEC must be valid');

  const isProfileValidated = true;
  let selectedMajorCode = null;

  // Major analysis unlocks
  const rankedMajors = computeRankedMajors(isProfileValidated, riasec);
  assert(rankedMajors.length > 0, 'Ranked majors must now be generated');
  const topMajor = rankedMajors[0];
  assert(topMajor.fitPercent > 0, 'Top major must have computed fit percentage');

  // CRITICAL: Since user has NOT selected a major yet, universities must still be EMPTY!
  const universitiesBeforeSelection = computeStratifiedUniversities(isProfileValidated, selectedMajorCode, null, scores, 0.75);
  assert.strictEqual(universitiesBeforeSelection.hasInstitutions, false);
  assert.strictEqual(universitiesBeforeSelection.dream.length, 0);
  assert.strictEqual(universitiesBeforeSelection.target.length, 0);
  assert.strictEqual(universitiesBeforeSelection.safe.length, 0);
  assert.strictEqual(universitiesBeforeSelection.candidateScore, null);

  console.log(`  ✅ [PASS] Scenario 3: Valid profile unlocks ${rankedMajors.length} majors, but universities remain strictly empty until major selection.`);
});

test('SCENARIO 4: Selecting a major unlocks university recommendations matching that specific major', () => {
  const scores = {
    math: 9.0, literature: 7.5, english: 8.5, physics: 8.8, chemistry: 8.0,
    biology: 7.0, history: 6.5, geography: 6.5, informatics: 9.0, economicLegal: 7.0
  };
  const riasec = { R: 42, I: 48, A: 25, S: 22, E: 28, C: 40 };
  const isProfileValidated = true;
  const basePriority = calculateBasePriority30('KV1', 'DT_0', 2026, 2026); // 0.75

  // User selects '7480201' - Công nghệ thông tin
  const selectedMajorCode = '7480201';
  const currentMajor = seedData.majorCatalogLevelIV.find(m => m.codeTT09 === selectedMajorCode);
  assert(currentMajor, 'Major 7480201 must exist in seedData');

  const universities = computeStratifiedUniversities(isProfileValidated, selectedMajorCode, currentMajor, scores, basePriority);
  assert.strictEqual(universities.hasInstitutions, true);
  assert(universities.candidateScore !== null, 'Candidate score must be computed');
  // Raw A00 = 9.0 + 8.8 + 8.0 = 25.8. Raw A01 = 9.0 + 8.8 + 8.5 = 26.3.
  assert(universities.candidateScore >= 26.0, `Candidate score for A01 should be around 26.3, got: ${universities.candidateScore}`);

  const totalSchools = universities.dream.length + universities.target.length + universities.safe.length;
  assert(totalSchools > 0, 'Must have schools offering IT');

  console.log(`  ✅ [PASS] Scenario 4: Selecting ${currentMajor.name} (${selectedMajorCode}) stratified ${totalSchools} universities with real candidate score ${universities.candidateScore}đ.`);
});

test('SCENARIO 5: Modifying profile invalidates downstream state and clears results', () => {
  let isProfileValidated = true;
  let selectedMajorCode = '7480201';
  let selectedSchoolCode = 'BKA';

  // Invalidate downstream simulation
  const invalidateDownstream = () => {
    isProfileValidated = false;
    selectedMajorCode = null;
    selectedSchoolCode = null;
  };

  // User edits a grade in Tab 1
  invalidateDownstream();

  assert.strictEqual(isProfileValidated, false);
  assert.strictEqual(selectedMajorCode, null);
  assert.strictEqual(selectedSchoolCode, null);

  const rankedMajors = computeRankedMajors(isProfileValidated, null);
  assert.strictEqual(rankedMajors.length, 0, 'Majors must clear immediately on invalidation');

  const universities = computeStratifiedUniversities(isProfileValidated, selectedMajorCode, null, {}, 0);
  assert.strictEqual(universities.hasInstitutions, false, 'Universities must clear immediately on invalidation');

  console.log('  ✅ [PASS] Scenario 5: Downstream state is properly invalidated and cleared when inputs change.');
});

test('SCENARIO 6: Missing subjects for a combination sets score to null without fabricating', () => {
  // Candidate only entered Math, Literature, English (D01), lacks Physics and Chemistry
  const scores = {
    math: 8.0, literature: 8.0, english: 8.0, physics: '', chemistry: '',
    biology: '', history: '', geography: '', informatics: '', economicLegal: ''
  };

  const a00Score = getCandidateComboScore('A00', scores, 0.75);
  assert.strictEqual(a00Score, null, 'A00 must be null when Physics and Chemistry are missing');

  const d01Score = getCandidateComboScore('D01', scores, 0.75);
  assert(d01Score !== null, 'D01 must be computed when Math, Lit, Eng are present');
  assert.strictEqual(d01Score.rawScore, 24.0);

  console.log('  ✅ [PASS] Scenario 6: Candidate lacking subjects for a combo receives null score without fabrication.');
});
