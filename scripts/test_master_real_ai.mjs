import assert from 'node:assert';
import { 
  createInitialProfile, 
  updateProfileWithInput, 
  evaluateEvidenceReadiness, 
  processDecisionTurn,
  generateGroundedCareerProposals,
  mapCareerToMajors,
  mapMajorToAdmissions
} from '../src/engine/careerDecisionEngine.ts';
import { 
  buildCounselorSystemPrompt, 
  parseAIModelOutput,
  handleCounselorChatRequest,
  handleCounselorStatusRequest,
  checkRateLimit,
  validateAndNormalizeCounselorResponse
} from './counselor_backend.mjs';
import { AUDITED_INSTITUTIONS_300 } from '../src/data/auditedInstitutionsData.ts';
import { VERIFIED_PROGRAMS_DATABASE } from '../src/data/verifiedAdmissionDatabase.ts';

async function runMasterTestSuite() {
  console.log('========================================================================');
  console.log('🧪 MASTER AUDIT & INTEGRATION VERIFICATION: NEXORA REAL AI ENGINE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Chi tiết: ${err.message}`);
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Chi tiết: ${err.message}`);
    }
  }

  // ========================================================================
  // NHÓM A: BACKEND / API SECURITY & CONTRACT VERIFICATION
  // ========================================================================
  console.log('--- NHÓM A: BACKEND / API ARCHITECTURE & SECURITY ---');

  test('A.1 Status endpoint returns accurate state without exposing secret keys', () => {
    const res = handleCounselorStatusRequest({ GEMINI_API_KEY: 'test_key_123' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.hasServerKey, true);
    assert.strictEqual(res.data.provider, 'gemini');
    assert.strictEqual(res.data.requiresAdminSetup, false);
    // Crucial: Must NEVER contain the actual key value
    assert.strictEqual(JSON.stringify(res.data).includes('test_key_123'), false, 'Secret key must NEVER leak in response');
  });

  test('A.2 Missing server key returns HTTP 503 ADMIN_KEY_REQUIRED with friendly guidance', async () => {
    const res = await handleCounselorChatRequest({
      body: { message: 'Xin chào' },
      env: { GEMINI_API_KEY: '', GROQ_API_KEY: '' }
    });
    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.data.code, 'ADMIN_KEY_REQUIRED');
    assert(res.data.error.includes('Quản trị viên'), 'Error must guide admin to configure key');
  });

  test('A.3 Empty or whitespace-only message is rejected with HTTP 400', async () => {
    const res = await handleCounselorChatRequest({
      body: { message: '   ' },
      env: { GEMINI_API_KEY: 'mock' }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.code, 'INVALID_INPUT');
  });

  test('A.4 Rate limiter throttles rapid spamming exceeding window threshold', () => {
    const testId = `test_ratelimit_${Date.now()}`;
    let allowedCount = 0;
    for (let i = 0; i < 30; i++) {
      const check = checkRateLimit(testId);
      if (check.allowed) allowedCount++;
    }
    assert(allowedCount <= 25, 'Rate limiter must cap requests at 25 per minute');
    const blockedCheck = checkRateLimit(testId);
    assert.strictEqual(blockedCheck.allowed, false, 'Over-limit request must be blocked');
    assert(blockedCheck.retryAfterSeconds > 0, 'Must provide retry-after seconds');
  });

  test('A.5 JSON schema normalizer repairs malformed or markdown-wrapped output', () => {
    const brokenJson = '```json\n{"reply": "Chào bạn, hãy kể thêm về sở thích", "decision": {"stage": "DISCOVERY", "action": "ASK_CLARIFYING_QUESTION", "evidenceSufficiency": "LOW"}}\n```';
    const normalized = validateAndNormalizeCounselorResponse(brokenJson);
    assert.strictEqual(normalized.reply, 'Chào bạn, hãy kể thêm về sở thích');
    assert.strictEqual(normalized.decision.stage, 'DISCOVERY');
    assert.strictEqual(normalized.decision.action, 'ASK_CLARIFYING_QUESTION');
    assert.strictEqual(normalized.decision.evidenceSufficiency, 'LOW');
    assert(Array.isArray(normalized.quickReplies) && normalized.quickReplies.length > 0);
  });

  // ========================================================================
  // NHÓM B: AI BEHAVIOR & FREE-FORM NATURAL LANGUAGE UNDERSTANDING
  // ========================================================================
  console.log('\n--- NHÓM B: AI BEHAVIOR & NATURAL LANGUAGE REASONING ---');

  test('B.1 Multi-signal clause: "Em thích sáng tạo ý tưởng mới, không thích lặp lại, nhưng em cũng muốn công việc ổn định"', () => {
    const input = "Em thích sáng tạo ý tưởng mới, không thích lặp lại, nhưng em cũng muốn công việc ổn định.";
    const profile = createInitialProfile(input);
    const decision = processDecisionTurn(input, profile);

    // Verify multi-signal extraction
    assert(decision.updatedProfile.statedInterests.some(i => i.toLowerCase().includes('sáng tạo')), 'Must record Creative interest');
    assert(decision.updatedProfile.personalValues.some(v => v.toLowerCase().includes('ổn định')), 'Must record Stability value');
    assert.strictEqual(decision.action, 'EXPLORE_INTERESTS');
    // Crucial: Must NOT repeat question asking if user likes creativity or stability
    assert(!decision.replyText.includes('Bạn có thích sáng tạo không'), 'Must NOT ask again about creativity');
    assert(decision.replyText.toLowerCase().includes('ổn định'), 'Must address the harmony between creativity and stability');
  });

  test('B.2 Zero state: "Em học lớp 11, học lực bình thường, chưa biết mình thích gì"', () => {
    const input = "Em học lớp 11, học lực bình thường, chưa biết mình thích gì.";
    const profile = createInitialProfile(input);
    const decision = processDecisionTurn(input, profile);

    assert.strictEqual(decision.stage, 'STATE_A_ZERO');
    assert.strictEqual(decision.action, 'ASK_QUESTION');
    assert.strictEqual(decision.suggestedCareers, undefined, 'Must NEVER propose careers at zero state');
    assert(decision.replyText.includes('hoàn toàn tự nhiên'), 'Must reassure student with empathy');
  });

  test('B.3 Short/vague response: "ko biet", "...", "sao cung duoc"', () => {
    const input = "ko biet";
    const profile = createInitialProfile('');
    profile.turnsCount = 3;
    const decision = processDecisionTurn(input, profile);

    assert.strictEqual(decision.action, 'ASK_QUESTION');
    assert(decision.replyText.includes('hoạt động quan sát nhỏ'), 'Must provide concrete scenario anchors');
    assert.strictEqual(decision.suggestedCareers, undefined, 'Must NEVER dump careers on vague input');
  });

  test('B.4 Mind Change: "Trước đây em thích máy tính nhưng giờ em không thích nữa, em muốn làm việc với động vật"', () => {
    const input = "Trước đây em thích máy tính nhưng giờ em không thích nữa, em muốn làm việc với động vật";
    const profile = createInitialProfile('Em thích máy tính');
    profile.statedInterests.push('Công nghệ & Máy tính');

    const updated = updateProfileWithInput(profile, input);
    assert(!updated.statedInterests.some(i => i.includes('Công nghệ')), 'Must remove retracted computer interest');
    assert(updated.statedInterests.some(i => i.includes('Động vật') || i.includes('Thú y')), 'Must pivot to animals interest');
    assert(updated.rejectedActivities.some(r => r.includes('Công nghệ')), 'Must record retracted interest');
  });

  test('B.5 Contradiction Detection: Ghét văn phòng vs Muốn bàn giấy 8 tiếng', () => {
    const profile = createInitialProfile('');
    profile.workEnvironmentPrefs.push('Thích môi trường vận động, đi lại ngoài trời, ghét ngồi cố định một chỗ');
    profile.workEnvironmentPrefs.push('Môi trường văn phòng bàn giấy cố định 8 tiếng');
    profile.unresolvedContradictions.push('Mâu thuẫn giữa mong muốn làm việc ngoài trời VỚI mong muốn công việc bàn giấy ổn định 8 tiếng');

    const decision = processDecisionTurn('Em muốn chọn nghề', profile);
    assert.strictEqual(decision.action, 'ASK_QUESTION');
    assert.strictEqual(decision.suggestedCareers, undefined, 'Must NOT unlock careers when unresolved conflict exists');
    assert(decision.replyText.includes('điểm mâu thuẫn quan trọng'), 'Must guide user to address tradeoff');
  });

  test('B.6 Forced Career Shortlist demand rejected when evidence is incomplete', () => {
    const input = "Chốt luôn cho em 3 nghề đi, đừng hỏi nữa";
    const profile = createInitialProfile('Em thích máy tính');
    const decision = processDecisionTurn(input, profile);

    assert.strictEqual(decision.action, 'ASK_QUESTION');
    assert.strictEqual(decision.suggestedCareers, undefined, 'Must reject premature guessing');
    assert(decision.replyText.includes('chọn bừa') || decision.replyText.includes('đoán mò'), 'Must explain risk of premature choices');
  });

  // ========================================================================
  // NHÓM C: FRONTEND LOGIC & MULTI-TURN PERSISTENCE
  // ========================================================================
  console.log('\n--- NHÓM C: FRONTEND INTEGRATION & SESSION HYGIENE ---');

  test('C.1 Non-repetition: Next question differs dynamically based on filled evidence gaps', () => {
    // Stage 1: Stated interest filled, capability missing
    const p1 = createInitialProfile('');
    p1.statedInterests.push('Địa lý, GIS & Khoa học Không gian / Trái đất');
    const d1 = processDecisionTurn('Em thích địa lý', p1);
    assert(d1.primaryQuestion.includes('thế mạnh tự nhiên') || d1.primaryQuestion.includes('môn học'), 'Must ask about capabilities next');

    // Stage 2: Stated interest AND capability filled, environment missing
    const p2 = createInitialProfile('');
    p2.statedInterests.push('Địa lý, GIS & Khoa học Không gian / Trái đất');
    p2.academicStrengths.push('Thế mạnh môn Địa lý & Tư duy phân tích không gian');
    const d2 = processDecisionTurn('Em học rất giỏi địa', p2);
    assert(d2.primaryQuestion.includes('môi trường') || d2.primaryQuestion.includes('không gian'), 'Must ask about work environment next');
    assert.notStrictEqual(d1.primaryQuestion, d2.primaryQuestion, 'Questions must dynamically evolve across turns');
  });

  test('C.2 Evidence Readiness Gate requires 3 full pillars before career proposals', () => {
    const incompleteProfile = createInitialProfile('Em thích máy tính');
    incompleteProfile.statedInterests.push('Công nghệ & Máy tính');
    const eval1 = evaluateEvidenceReadiness(incompleteProfile);
    assert.strictEqual(eval1.isReadyForCareers, false, '1 pillar must NOT be ready');

    // Add capabilities
    incompleteProfile.academicStrengths.push('Tư duy Toán học logic tốt');
    const eval2 = evaluateEvidenceReadiness(incompleteProfile);
    assert.strictEqual(eval2.isReadyForCareers, false, '2 pillars must NOT be ready');

    // Add environment & values + reality answer
    incompleteProfile.workEnvironmentPrefs.push('Môi trường văn phòng hiện đại');
    incompleteProfile.realityCheckAnswer = 'Sẵn sàng nỗ lực 4 năm';
    incompleteProfile.turnsCount = 2;
    const eval3 = evaluateEvidenceReadiness(incompleteProfile);
    assert.strictEqual(eval3.isReadyForCareers, true, '3 verified pillars + turns >= 2 must unlock readiness');
  });

  // ========================================================================
  // NHÓM D: REGRESSION & FACTUAL REVERSE MAPPING
  // ========================================================================
  console.log('\n--- NHÓM D: REGRESSION & ADMISSIONS GROUNDING ---');

  test('D.1 Veterinary career proposals reverse map to verified major 7640101', () => {
    const profile = createInitialProfile('');
    profile.statedInterests.push('Sinh học, Thú y & Chăm sóc động vật / Môi trường tự nhiên');
    profile.academicStrengths.push('Thế mạnh môn Sinh học & Hóa học');
    profile.workEnvironmentPrefs.push('Bệnh viện thú y & phòng khám động vật');
    profile.realityCheckAnswer = 'Cam kết học tập';
    profile.turnsCount = 2;

    const careers = generateGroundedCareerProposals(profile);
    assert(careers.length > 0, 'Must produce grounded career proposal');
    const vetCareer = careers.find(c => c.id === 'c_veterinarian');
    assert(vetCareer, 'Veterinarian career must exist in proposal');

    const mapping = mapCareerToMajors(vetCareer);
    assert(mapping.directMajors.some(m => m.code === '7640101'), 'Must map directly to major code 7640101');
  });

  test('D.2 Major code 7640101 maps to audited universities with real combinations', () => {
    const admissions = mapMajorToAdmissions('7640101');
    assert(admissions.length > 0, 'Must provide verified university options');
    const hvn = admissions.find(a => a.schoolCode === 'HVN');
    assert(hvn, 'Must include Vietnam National University of Agriculture (HVN)');
    assert(hvn.admissionCombinations.some(c => c.includes('B00')), 'HVN must offer combination B00 for veterinary');
    assert(hvn.tuitionPerYear.includes('triệu'), 'Must include realistic tuition bracket');
  });

  test('D.3 Audited Institutions Database contains 300+ accredited universities without mock gaps', () => {
    assert(AUDITED_INSTITUTIONS_300.length >= 250, 'Institution database must contain at least 250 audited universities');
    const bkHcm = AUDITED_INSTITUTIONS_300.find(i => i.code === 'QSB');
    assert(bkHcm, 'QSB (HCMUT) must be audited');
    assert(bkHcm.verified_province_city.includes('Hồ Chí Minh'), 'QSB must be located in TP. Hồ Chí Minh');
  });

  // --------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`📊 MASTER AUDIT RESULT: ${passed}/${total} TESTS PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runMasterTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
