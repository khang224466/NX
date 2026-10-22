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
  parseAIModelOutput 
} from './counselor_backend.mjs';

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 RUNNING NEXORA AI CAREER COUNSELOR INTEGRATION TEST SUITE');
  console.log('===============================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function test(name, fn) {
    totalCount++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  async function asyncTest(name, fn) {
    totalCount++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 1: Backend System Prompt & Parsing
  // --------------------------------------------------------------------------
  console.log('--- TEST SUITE 1: AI Prompt Construction & Output Parser ---');

  test('1.1 buildCounselorSystemPrompt formats profile and readiness correctly', () => {
    const profile = createInitialProfile('Em thích động vật và chăm sóc thú cưng', 'Chuẩn bị tâm thế 3-5 năm');
    profile.statedInterests.push('Sinh học, Động vật, Thú y');
    profile.academicStrengths.push('Thế mạnh môn Sinh học & Hóa học');
    profile.workEnvironmentPrefs.push('Môi trường bệnh viện thú y');

    const prompt = buildCounselorSystemPrompt(profile);
    assert(prompt.includes('AI Career Counselor'), 'Prompt must define counselor role');
    assert(prompt.includes('Sinh học, Động vật, Thú y'), 'Prompt must inject stated interests');
    assert(prompt.includes('NGUYÊN TẮC HỘI THOẠI'), 'Prompt must inject coordination principles');
    assert(prompt.includes('JSON'), 'Prompt must enforce structured JSON output format');
  });

  test('1.2 parseAIModelOutput handles clean JSON string', () => {
    const jsonStr = JSON.stringify({
      replyText: 'Chào bạn, mình hiểu bạn thích động vật. Bạn đã từng tiếp xúc thực tế tại phòng khám thú y chưa?',
      quickReplies: ['Em từng phụ việc', 'Chưa có cơ hội', 'Em chỉ nuôi ở nhà'],
      detectedUpdates: {
        statedInterests: ['Động vật', 'Thú y']
      }
    });

    const parsed = parseAIModelOutput(jsonStr);
    assert.strictEqual(parsed.quickReplies.length, 3);
    assert(parsed.replyText.includes('thích động vật'));
    assert(parsed.detectedUpdates.statedInterests.includes('Thú y'));
  });

  test('1.3 parseAIModelOutput handles markdown-wrapped JSON code fences', () => {
    const markdownStr = `Dưới đây là phân tích của tôi:
\`\`\`json
{
  "replyText": "Một hướng đi rất ý nghĩa! Nghề Bác sĩ Thú y đòi hỏi kiến thức Sinh học vững chắc.",
  "quickReplies": ["Tìm hiểu ngành Thú y", "Học phí và trường đào tạo"]
}
\`\`\``;

    const parsed = parseAIModelOutput(markdownStr);
    assert(parsed.replyText.includes('Bác sĩ Thú y'));
    assert.strictEqual(parsed.quickReplies.length, 2);
  });

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Mind Change & Clause-Aware Negation Parsing
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 2: Mind Change & Clause-Aware Negation ---');

  test('2.1 Mind Change: Retract computer and pivot to animals', () => {
    // User initially had computer interests
    let profile = createInitialProfile('Thích máy tính và lập trình phần mềm');
    profile = updateProfileWithInput(profile, 'Thích máy tính và lập trình phần mềm');
    assert(profile.statedInterests.some(i => i.includes('Công nghệ')), 'Should have tech interest initially');

    // User explicitly changes mind
    profile = updateProfileWithInput(profile, 'Trước đây em thích máy tính nhưng giờ em không thích nữa, em muốn làm việc với động vật');
    
    // Check that tech is retracted
    const stillHasTech = profile.statedInterests.some(i => i.includes('Công nghệ'));
    assert.strictEqual(stillHasTech, false, 'Stated interests must NOT contain Công nghệ after explicit retraction');

    // Check that animals/biology is added
    const hasAnimal = profile.statedInterests.some(i => i.includes('Động vật') || i.includes('Thú y') || i.includes('Sinh học'));
    assert.strictEqual(hasAnimal, true, 'Stated interests must contain Động vật / Thú y after mind change');
  });

  test('2.2 Rejected Sub-activity: Likes tech but rejects programming', () => {
    let profile = createInitialProfile('Em thích công nghệ nhưng không muốn lập trình');
    profile = updateProfileWithInput(profile, 'Em thích công nghệ nhưng không muốn lập trình');

    assert(profile.statedInterests.some(i => i.includes('Công nghệ')), 'Must acknowledge overall interest in Công nghệ');
    assert(profile.rejectedActivities.some(a => a.toLowerCase().includes('lập trình')), 'Must categorize programming as a rejected activity');
  });

  test('2.3 Untested Interest: Not tried design yet', () => {
    let profile = createInitialProfile('Em chưa thử thiết kế');
    profile = updateProfileWithInput(profile, 'Em chưa thử thiết kế');

    assert(profile.untestedInterests.some(u => u.toLowerCase().includes('thiết kế')), 'Must record as untested interest');
    assert(!profile.statedInterests.some(s => s.toLowerCase().includes('thiết kế')), 'Must NOT mark as confirmed stated interest');
    assert(!profile.rejectedActivities.some(r => r.toLowerCase().includes('thiết kế')), 'Must NOT mark as rejected activity');
  });

  test('2.4 Refuted Negation: Not hating Math, only afraid of Advanced Math', () => {
    let profile = createInitialProfile('Em không phải ghét Toán, em chỉ sợ Toán nâng cao');
    profile = updateProfileWithInput(profile, 'Em không phải ghét Toán, em chỉ sợ Toán nâng cao');

    // Should NOT blindly put Math into academicWeaknesses
    const hasGeneralMathWeakness = profile.academicWeaknesses.some(w => w === 'Môn Toán' || w === 'Khối tự nhiên');
    assert.strictEqual(hasGeneralMathWeakness, false, 'Must not classify Math as a global weakness when user said "không phải ghét Toán"');
  });

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Veterinary Domain & Grounded Admissions
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 3: Veterinary & Biology Career Proposals ---');

  test('3.1 Veterinary proposals generated when evidence is ready', () => {
    let profile = createInitialProfile('Em muốn làm bác sĩ thú y', 'Sẵn sàng học chuyên sâu');
    profile.statedInterests.push('Sinh học, Động vật, Thú y');
    profile.academicStrengths.push('Thế mạnh môn Sinh học & Hóa học');
    profile.workEnvironmentPrefs.push('Phòng khám thú y và chăm sóc vật nuôi');
    profile.explicitTargetCareer = 'Bác sĩ Thú y';

    const proposals = generateGroundedCareerProposals(profile);
    assert(proposals.length > 0, 'Must generate career proposals');
    assert(proposals.some(p => p.id === 'c_veterinarian'), 'Must propose c_veterinarian');
    
    const vetProposal = proposals.find(p => p.id === 'c_veterinarian');
    assert(vetProposal.title.toLowerCase().includes('bác sĩ thú y'), 'Title must include Bác sĩ Thú y');
  });

  test('3.2 mapCareerToMajors correctly maps veterinary career to code 7640101', () => {
    const mapped = mapCareerToMajors('c_veterinarian');
    assert(mapped.directMajors.some(m => m.code === '7640101'), 'Must include direct major 7640101 (Thú y)');
  });

  test('3.3 mapMajorToAdmissions provides verified universities for 7640101', () => {
    const admissions = mapMajorToAdmissions('7640101');
    assert(admissions.length >= 2, 'Must provide audited admission options');
    const schoolCodes = admissions.map(a => a.schoolCode);
    assert(schoolCodes.includes('HVN') || schoolCodes.includes('NLS'), 'Must include HVN or NLS');
    
    // Check verification note
    const verifiedItem = admissions.find(a => a.schoolCode === 'HVN');
    assert(verifiedItem.verificationNote.includes('Học viện Nông nghiệp Việt Nam'), 'Must cite official university name');
  });

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Backend Dev Server Endpoints (Live Verification)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST SUITE 4: Backend AI Counselor Live HTTP API ---');

  await asyncTest('4.1 GET /api/ai/counselor/status responds with 200 OK and valid status info', async () => {
    const res = await fetch('http://localhost:8443/api/ai/counselor/status');
    assert.strictEqual(res.status, 200, 'Status endpoint should be 200 OK');
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert(typeof data.hasServerKey === 'boolean');
  });

  await asyncTest('4.2 POST /api/ai/counselor/chat without key handles missing key gracefully', async () => {
    const res = await fetch('http://localhost:8443/api/ai/counselor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'test_session_1',
        message: 'Em đang băn khoăn chọn ngành',
        history: [],
        clientApiKey: ''
      })
    });

    const data = await res.json();
    if (res.status === 503) {
      assert.strictEqual(data.code, 'MISSING_API_KEY');
      assert(data.error.includes('API Key'), 'Error message must mention API Key');
    } else {
      assert.strictEqual(res.status, 200, 'If server has key, it returns 200');
    }
  });

  await asyncTest('4.3 POST /api/ai/counselor/chat with invalid key returns client-safe error', async () => {
    const res = await fetch('http://localhost:8443/api/ai/counselor/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-gemini-key': 'client-provided-test-key-must-be-ignored'
      },
      body: JSON.stringify({
        sessionId: 'test_session_invalid',
        message: 'Xin chào',
        history: []
      })
    });

    const data = await res.json();
    assert(res.status === 401 || res.status === 400 || res.status === 500, 'Should reject invalid key with client-safe error');
  });

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`📊 INTEGRATION TEST RESULT: ${passedCount}/${totalCount} PASSED`);
  console.log('===============================================================');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
