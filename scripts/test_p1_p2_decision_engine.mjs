/**
 * KIỂM THỬ ĐẶC TẢ P1 & P2 CHO CORE DECISION ENGINE (NEXORA)
 * 
 * Kiểm tra 8 ca kiểm thử cốt lõi:
 * 1. Chat > 3 lượt nhưng thông tin mơ hồ ("...", "ko biet", "sao cung duoc") -> không mở shortlist, tiếp tục hỏi hoặc đề xuất hoạt động khám phá.
 * 2. Đủ bằng chứng trước 3 lượt (lượt 2 đã có đủ 3 trụ cột) -> mở shortlist ngay, không bắt đợi đến lượt 3.
 * 3. "Em không thích lập trình" -> rejectedActivities có lập trình, statedInterests không có lập trình/IT coding.
 * 4. "Em chưa thử thiết kế" -> untestedInterests có thiết kế, không bị coi là ghét và không bị coi là đã khẳng định thích.
 * 5. "Em không phải ghét Toán, em chỉ sợ Toán nâng cao" -> không bị trích xuất là ghét Toán.
 * 6. "Em thích công nghệ nhưng không muốn lập trình" -> công nghệ vào statedInterests, lập trình vào rejectedActivities.
 * 7. Khai báo mâu thuẫn giữa 2 lượt (lượt 1: ghét ngồi một chỗ, lượt 2: muốn làm văn phòng 8 tiếng) -> engine phát hiện mâu thuẫn, hỏi làm rõ, không mở shortlist.
 * 8. Ép chốt nghề ("chốt luôn cho em 3 nghề đi") khi chưa có thông tin -> từ chối đoán mò, giải thích lý do, đưa câu hỏi tiếp theo.
 */

import { 
  processDecisionTurn, 
  updateProfileWithInput, 
  createInitialProfile, 
  evaluateEvidenceReadiness 
} from '../src/engine/careerDecisionEngine.js';

console.log('================================================================');
console.log('--- BẮT ĐẦU KIỂM THỬ P1 & P2: QUYẾT ĐỊNH & NGỮ CẢNH (8 CASES) ---');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    if (details) console.log(`   ↳ ${details}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    if (details) console.error(`   ↳ ${details}`);
    failCount++;
  }
}

// ----------------------------------------------------------------------------
// CASE 1: Chat > 3 lượt nhưng thông tin mơ hồ -> Không mở shortlist
// ----------------------------------------------------------------------------
let p1 = null;
const t1_1 = processDecisionTurn('...', p1);
p1 = t1_1.updatedProfile;
const t1_2 = processDecisionTurn('ko biet', p1);
p1 = t1_2.updatedProfile;
const t1_3 = processDecisionTurn('sao cung duoc', p1);
p1 = t1_3.updatedProfile;
const t1_4 = processDecisionTurn('chưa rõ', p1);
p1 = t1_4.updatedProfile;

assert(
  t1_3.action === 'ASK_QUESTION' && (!t1_3.suggestedCareers || t1_3.suggestedCareers.length === 0),
  'Case 1.1: Lượt 3 mơ hồ ("sao cung duoc") tuyệt đối không xuất CAREER_SHORTLIST',
  `Action: ${t1_3.action} | Số nghề: ${t1_3.suggestedCareers?.length || 0}`
);

assert(
  t1_4.action === 'ASK_QUESTION' && (!t1_4.suggestedCareers || t1_4.suggestedCareers.length === 0),
  'Case 1.2: Lượt 4 mơ hồ ("chưa rõ") vẫn kiên trì hỏi kịch bản tình huống, không ép đề xuất nghề',
  `Action: ${t1_4.action} | Số nghề: ${t1_4.suggestedCareers?.length || 0}`
);

// ----------------------------------------------------------------------------
// CASE 2: Đủ bằng chứng trước 3 lượt (Lượt 2 có đủ 3 trụ cột) -> Mở shortlist ngay
// ----------------------------------------------------------------------------
let p2 = null;
// Turn 1: Khởi đầu và nêu sở thích công nghệ
const t2_1 = processDecisionTurn('Em thích máy tính và công nghệ', p2, 'Em sẵn sàng đối mặt thực tế');
p2 = t2_1.updatedProfile;

// Turn 2: Cung cấp đầy đủ cả năng lực học tập và môi trường làm việc
const t2_2 = processDecisionTurn('Môn Toán em học rất tốt được 9 phẩy, và em thích làm việc văn phòng ổn định làm việc độc lập chuyên môn', p2);
p2 = t2_2.updatedProfile;

assert(
  t2_2.action === 'CAREER_SHORTLIST',
  'Case 2.1: Mở CAREER_SHORTLIST ngay ở Lượt 2 khi đã đủ 3 trụ cột bằng chứng, không bắt đợi đến lượt 3',
  `Lượt 2 action: ${t2_2.action} | TurnsCount: ${p2.turnsCount}`
);

assert(
  Boolean(t2_2.suggestedCareers && t2_2.suggestedCareers.length >= 2),
  'Case 2.2: Danh sách nghề đề xuất ở lượt 2 được tạo đầy đủ và có căn cứ',
  `Số nghề tạo ra: ${t2_2.suggestedCareers?.length} | Nghề 1: ${t2_2.suggestedCareers?.[0]?.title}`
);

// ----------------------------------------------------------------------------
// CASE 3: "Em không thích lập trình" -> rejectedActivities có lập trình, statedInterests không có
// ----------------------------------------------------------------------------
const prof3 = createInitialProfile('Em không thích lập trình');
assert(
  prof3.rejectedActivities.some(a => a.toLowerCase().includes('lập trình')),
  'Case 3.1: Ghi nhận lập trình vào rejectedActivities',
  `rejectedActivities: [${prof3.rejectedActivities.join(', ')}]`
);
assert(
  !prof3.statedInterests.some(i => i.toLowerCase().includes('công nghệ') || i.toLowerCase().includes('lập trình')),
  'Case 3.2: statedInterests KHÔNG bị gán sai Công nghệ / Lập trình khi người học tuyên bố không thích',
  `statedInterests: [${prof3.statedInterests.join(', ')}]`
);

// ----------------------------------------------------------------------------
// CASE 4: "Em chưa thử thiết kế" -> untestedInterests có thiết kế, không bị coi là ghét / khẳng định thích
// ----------------------------------------------------------------------------
const prof4 = createInitialProfile('Em chưa thử thiết kế bao giờ');
assert(
  prof4.untestedInterests.some(u => u.toLowerCase().includes('thiết kế')),
  'Case 4.1: Ghi nhận thiết kế vào untestedInterests',
  `untestedInterests: [${prof4.untestedInterests.join(', ')}]`
);
assert(
  !prof4.statedInterests.some(i => i.toLowerCase().includes('thiết kế') || i.toLowerCase().includes('sáng tạo')),
  'Case 4.2: Không coi việc "chưa thử" là đã khẳng định thích (statedInterests rỗng)',
  `statedInterests: [${prof4.statedInterests.join(', ')}]`
);
assert(
  !prof4.rejectedActivities.some(r => r.toLowerCase().includes('thiết kế')),
  'Case 4.3: Không coi việc "chưa thử" là ghét hay từ chối (rejectedActivities rỗng)',
  `rejectedActivities: [${prof4.rejectedActivities.join(', ')}]`
);

// ----------------------------------------------------------------------------
// CASE 5: "Em không phải ghét Toán, em chỉ sợ Toán nâng cao" -> Không bị trích xuất là ghét Toán
// ----------------------------------------------------------------------------
const prof5 = createInitialProfile('Em không phải ghét Toán, em chỉ sợ Toán nâng cao');
assert(
  !prof5.academicWeaknesses.some(w => w.toLowerCase().includes('kém toán') || w.toLowerCase().includes('yếu toán')),
  'Case 5.1: Không gán nhãn kém Toán / ghét Toán tuyệt đối khi có cấu trúc phủ định bác bỏ',
  `academicWeaknesses: [${prof5.academicWeaknesses.join(', ')}]`
);
assert(
  prof5.academicWeaknesses.some(w => w.toLowerCase().includes('nâng cao')),
  'Case 5.2: Ghi nhận chính xác phạm vi e ngại là Toán nâng cao / chuyên sâu',
  `Điểm yếu phân hóa: [${prof5.academicWeaknesses.join(', ')}]`
);

// ----------------------------------------------------------------------------
// CASE 6: "Em thích công nghệ nhưng không muốn lập trình" -> Phân tách 2 vế đối lập
// ----------------------------------------------------------------------------
const prof6 = createInitialProfile('Em thích công nghệ nhưng không muốn lập trình');
assert(
  prof6.statedInterests.some(i => i.includes('Công nghệ')),
  'Case 6.1: Vế 1 ghi nhận sở thích Công nghệ vào statedInterests',
  `statedInterests: [${prof6.statedInterests.join(', ')}]`
);
assert(
  prof6.rejectedActivities.some(a => a.toLowerCase().includes('lập trình')),
  'Case 6.2: Vế 2 nhận diện liên từ "nhưng" và ghi nhận lập trình vào rejectedActivities',
  `rejectedActivities: [${prof6.rejectedActivities.join(', ')}]`
);

// ----------------------------------------------------------------------------
// CASE 7: Khai báo mâu thuẫn giữa 2 lượt -> Phát hiện mâu thuẫn, hỏi làm rõ, không mở shortlist
// ----------------------------------------------------------------------------
let p7 = null;
const t7_1 = processDecisionTurn('Em cực kỳ ghét ngồi một chỗ trong văn phòng, em chỉ thích đi lại ngoài trời năng động.', p7);
p7 = t7_1.updatedProfile;

const t7_2 = processDecisionTurn('Em lại muốn làm công việc bàn giấy ổn định, ngày ngồi 8 tiếng trong phòng máy tính.', p7);
p7 = t7_2.updatedProfile;

assert(
  p7.unresolvedContradictions.length > 0,
  'Case 7.1: Phát hiện chính xác mâu thuẫn giữa ghét ngồi văn phòng VỚI muốn bàn giấy 8 tiếng',
  `Mâu thuẫn ghi nhận: "${p7.unresolvedContradictions[0]}"`
);

assert(
  t7_2.action === 'ASK_QUESTION' && (!t7_2.suggestedCareers || t7_2.suggestedCareers.length === 0),
  'Case 7.2: Khi có mâu thuẫn chưa giải quyết, kiên quyết KHÔNG mở CAREER_SHORTLIST',
  `Action nhận được: ${t7_2.action} | Số nghề: ${t7_2.suggestedCareers?.length || 0}`
);

assert(
  t7_2.replyText.includes('mâu thuẫn') || t7_2.primaryQuestion.includes('công việc văn phòng bàn giấy'),
  'Case 7.3: Phản hồi tập trung bóc tách và làm rõ điểm mâu thuẫn không gian làm việc',
  `Câu hỏi điều phối: "${t7_2.primaryQuestion}"`
);

// ----------------------------------------------------------------------------
// CASE 8: Ép chốt nghề khi chưa có thông tin -> Từ chối đoán mò, giải thích nguy cơ
// ----------------------------------------------------------------------------
const t8 = processDecisionTurn('Chốt luôn cho em 3 nghề đi, đừng hỏi em nữa');
assert(
  t8.action === 'ASK_QUESTION' && (!t8.suggestedCareers || t8.suggestedCareers.length === 0),
  'Case 8.1: Từ chối đoán mò, không mở CAREER_SHORTLIST khi người học ép chốt',
  `Action nhận được: ${t8.action} | Số nghề: ${t8.suggestedCareers?.length || 0}`
);

assert(
  t8.replyText.includes('không phù hợp') || t8.replyText.includes('chỉ đề xuất nghề khi có đủ bằng chứng') || t8.replyText.includes('đoán mò'),
  'Case 8.2: Giải thích rõ rủi ro học nhầm ngành và nguyên tắc đề xuất dựa trên bằng chứng',
  'Có thông điệp giải thích hệ quả của việc chọn bừa'
);

// ----------------------------------------------------------------------------
// TỔNG KẾT BỘ KIỂM THỬ P1 & P2
// ----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TỔNG SỐ ASSERTIONS: ${passCount + failCount}`);
console.log(`✅ [PASS]: ${passCount}`);
console.log(`❌ [FAIL]: ${failCount}`);
console.log('================================================================');

if (failCount > 0) {
  process.exit(1);
}
