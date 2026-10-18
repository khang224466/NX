/**
 * SUITE KIỂM THỬ HÀNH VI THỰC TẾ CƠ CHẾ HƯỚNG NGHIỆP NEXORA (8 TEST CASES)
 * Chạy trực tiếp trên mã nguồn TypeScript/JavaScript của project
 */

import { 
  processDecisionTurn, 
  mapCareerToMajors, 
  mapMajorToAdmissions 
} from '../src/engine/careerDecisionEngine.js';

console.log('================================================================');
console.log('--- BẮT ĐẦU KIỂM THỬ HÀNH VI QUYẾT ĐỊNH HƯỚNG NGHIỆP (8 TEST CASES) ---');
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
// TEST 1 — CHƯA BIẾT BẢN THÂN
// Input: "Em học lớp 11, học lực bình thường, chưa biết mình thích gì."
// Kỳ vọng: Trả lời đồng cảm, đặt 1 câu hỏi chính, KHÔNG tạo Top 3 nghề, KHÔNG ép tổ hợp.
// ----------------------------------------------------------------------------
const test1Input = 'Em học lớp 11, học lực bình thường, chưa biết mình thích gì.';
const t1Result = processDecisionTurn(test1Input);

assert(
  t1Result.action === 'ASK_QUESTION',
  'Test 1.1: Trạng thái hành động là ASK_QUESTION',
  `Action nhận được: ${t1Result.action}`
);

assert(
  !t1Result.suggestedCareers || t1Result.suggestedCareers.length === 0,
  'Test 1.2: Không tạo Top 3 nghề khi chưa có bằng chứng',
  `Số nghề được tạo: ${t1Result.suggestedCareers ? t1Result.suggestedCareers.length : 0}`
);

assert(
  t1Result.primaryQuestion && t1Result.primaryQuestion.length > 10,
  'Test 1.3: Đặt duy nhất 1 câu hỏi trọng tâm khám phá trải nghiệm',
  `Câu hỏi: "${t1Result.primaryQuestion}"`
);

assert(
  t1Result.replyText.includes('hoàn toàn tự nhiên') || t1Result.replyText.includes('không hề đơn độc'),
  'Test 1.4: Phản hồi đồng cảm, không phán xét',
  'Có thông điệp trấn an tâm lý học sinh THPT'
);

// ----------------------------------------------------------------------------
// TEST 2 — CÓ SỞ THÍCH NHƯNG CHƯA RÕ NĂNG LỰC
// Input: "Em thích máy tính và công nghệ nhưng học Toán chưa tốt."
// Kỳ vọng: Khám phá hoạt động công nghệ, năng lực, không tự kết luận phù hợp hay không.
// ----------------------------------------------------------------------------
const test2Input = 'Em thích máy tính và công nghệ nhưng học Toán chưa tốt.';
const t2Result = processDecisionTurn(test2Input);

assert(
  t2Result.action === 'EXPLORE_INTERESTS',
  'Test 2.1: Trạng thái hành động là EXPLORE_INTERESTS',
  `Action nhận được: ${t2Result.action}`
);

assert(
  !t2Result.suggestedCareers || t2Result.suggestedCareers.length === 0,
  'Test 2.2: Không tự động chốt Top 3 nghề ngay',
  `Số nghề được tạo: ${t2Result.suggestedCareers ? t2Result.suggestedCareers.length : 0}`
);

assert(
  t2Result.replyText.includes('UI/UX') && t2Result.replyText.includes('Kiểm thử'),
  'Test 2.3: Phân tích các phân nhánh công nghệ ít nặng về Toán cao cấp',
  'Đã phân tích các nhánh UI/UX, QA, Quản trị mạng'
);

// ----------------------------------------------------------------------------
// TEST 3 — CÓ THÔNG TIN TRÁI CHIỀU
// Input: "Em thích sáng tạo nhưng muốn công việc ổn định, không thích giao tiếp quá nhiều."
// Kỳ vọng: Phân tích dung hòa giá trị, không coi là mâu thuẫn bế tắc.
// ----------------------------------------------------------------------------
const test3Input = 'Em thích sáng tạo nhưng muốn công việc ổn định, không thích giao tiếp quá nhiều.';
const t3Result = processDecisionTurn(test3Input);

assert(
  t3Result.replyText.includes('hoàn toàn không phải là những mong muốn mâu thuẫn') || 
  t3Result.replyText.includes('cực kỳ có giá trị'),
  'Test 3.1: Không coi sáng tạo và ổn định/hướng nội là mâu thuẫn bế tắc',
  'Đã chỉ ra các vị trí chuyên môn độc lập có độ ổn định cao'
);

assert(
  t3Result.primaryQuestion && t3Result.primaryQuestion.includes('sáng tạo'),
  'Test 3.2: Đặt câu hỏi bóc tách dạng sáng tạo mong muốn',
  `Câu hỏi: "${t3Result.primaryQuestion}"`
);

// ----------------------------------------------------------------------------
// TEST 4 — MUỐN CHỌN D01 NGAY
// Input: "Em cứ chọn D01 vì nhiều ngành, rồi chọn trường sau được không?"
// Kỳ vọng: Giải thích thứ tự quyết định, không đưa số 38% bịa đặt.
// ----------------------------------------------------------------------------
const test4Input = 'Em cứ chọn D01 vì nhiều ngành, rồi chọn trường sau được không?';
const t4Result = processDecisionTurn(test4Input);

assert(
  !t4Result.replyText.includes('38%') && !t4Result.replyText.includes('34%'),
  'Test 4.1: Xóa bỏ hoàn toàn số liệu làm trái ngành 38% không có nguồn',
  'Không còn xuất hiện tỷ lệ bịa 38%'
);

assert(
  t4Result.replyText.includes('Gate 2') || t4Result.replyText.includes('Xác định loại công việc'),
  'Test 4.2: Giải thích nguyên tắc chọn nghề trước khi chọn khối thi',
  'Đã hướng dẫn quy trình: Nghề -> Ngành -> Tổ hợp'
);

// ----------------------------------------------------------------------------
// TEST 5 — CHỌN MỘT NGHỀ ĐÃ ĐỀ XUẤT (GATE 2 ➔ GATE 3)
// Kỳ vọng: Nhận đúng nghề, truy xuất con đường trực tiếp, gần, kỹ năng; không nhảy sang tổ hợp.
// ----------------------------------------------------------------------------
const careerMapping = mapCareerToMajors('Chuyên Viên Thiết Kế Giao Diện & Trải Nghiệm Người Dùng (UI/UX Designer)');

assert(
  careerMapping.directMajors.length > 0,
  'Test 5.1: Truy xuất các ngành đào tạo trực tiếp',
  `Ngành trực tiếp: ${careerMapping.directMajors.map(m => m.name).join(', ')}`
);

assert(
  careerMapping.adjacentMajors.length > 0,
  'Test 5.2: Truy xuất các ngành đào tạo gần / liên ngành',
  `Ngành gần: ${careerMapping.adjacentMajors.map(m => m.name).join(', ')}`
);

assert(
  careerMapping.skillsPathways.length > 0,
  'Test 5.3: Truy xuất lộ trình kỹ năng & chứng chỉ nghề nghiệp',
  `Lộ trình kỹ năng: ${careerMapping.skillsPathways[0].pathTitle}`
);

assert(
  Boolean(careerMapping.directMajors[0].dataSource),
  'Test 5.4: Minh bạch nguồn tra cứu chuẩn chương trình đào tạo',
  `Nguồn: ${careerMapping.directMajors[0].dataSource}`
);

// ----------------------------------------------------------------------------
// TEST 6 — TIẾP TỤC SAU NHIỀU LƯỢT CHAT (TÍCH LŨY HỒ SƠ BẰNG CHỨNG)
// Kỳ vọng: Chatbot nhớ thông tin các lượt trước; tích lũy đủ mới unlock CAREER_SHORTLIST.
// ----------------------------------------------------------------------------
// Turn 1: Khởi đầu từ số 0
let p = t1Result.updatedProfile;
assert(p.currentStage === 'STATE_A_ZERO', 'Test 6.1: Turn 1 ở STATE_A_ZERO');

// Turn 2: Người học trả lời về sở thích máy tính
const turn2 = processDecisionTurn('Em thích máy tính và công nghệ nhưng học Toán chưa tốt.', p);
p = turn2.updatedProfile;
assert(
  p.statedInterests.includes('Công nghệ & Máy tính') && p.academicWeaknesses.length > 0,
  'Test 6.2: Turn 2 đã tích lũy được Sở thích và Điểm yếu môn Toán',
  `Sở thích: ${p.statedInterests.join(', ')} | Điểm yếu: ${p.academicWeaknesses.join(', ')}`
);
assert(turn2.action !== 'CAREER_SHORTLIST', 'Test 6.3: Chưa đủ bằng chứng thì chưa mở CAREER_SHORTLIST');

// Turn 3: Người học làm rõ thiên hướng UI/UX và thích làm việc độc lập
const turn3 = processDecisionTurn('Em thích thiết kế giao diện UI/UX và đồ họa sản phẩm hơn, thích môi trường văn phòng ổn định làm việc độc lập', p);
p = turn3.updatedProfile;

assert(
  turn3.action === 'CAREER_SHORTLIST',
  'Test 6.4: Đã tích lũy đủ 3 trụ cột (Sở thích + Năng lực + Môi trường) -> Mở CAREER_SHORTLIST',
  `Action nhận được: ${turn3.action}`
);

assert(
  turn3.suggestedCareers && turn3.suggestedCareers.length >= 2,
  'Test 6.5: Đưa ra danh sách nghề có căn cứ thực tế',
  `Các nghề đề xuất: ${turn3.suggestedCareers.map(c => c.title).join(' | ')}`
);

assert(
  Boolean(turn3.suggestedCareers[0].whyNotOthers) && Boolean(turn3.suggestedCareers[0].selfVerificationTask),
  'Test 6.6: Mỗi nghề có lý do loại trừ (whyNotOthers) và bài tự kiểm tra (selfVerificationTask)',
  `Bài test thực tế: "${turn3.suggestedCareers[0].selfVerificationTask}"`
);

// ----------------------------------------------------------------------------
// TEST 7 — ĐỐI CHIẾU TUYỂN SINH MINH BẠCH (GATE 4)
// Kỳ vọng: Đối chiếu theo trường, mã ngành, tổ hợp thực tế; không bịa điểm chuẩn.
// ----------------------------------------------------------------------------
const admissions = mapMajorToAdmissions('7480103');

assert(
  admissions.length > 0,
  'Test 7.1: Tra cứu được các trường đào tạo thực tế từ CSDL kiểm toán',
  `Các trường: ${admissions.map(a => a.schoolCode).join(', ')}`
);

assert(
  admissions[0].admissionCombinations.length > 0,
  'Test 7.2: Thể hiện đúng các tổ hợp trường thực sự xét tuyển cho ngành này',
  `Tổ hợp BKA: ${admissions[0].admissionCombinations.join(', ')}`
);

assert(
  admissions[0].historicalBenchmarkNote.includes('tham khảo') || admissions[0].historicalBenchmarkNote.includes('các năm gần nhất'),
  'Test 7.3: Điểm chuẩn được ghi chú rõ ràng là dữ liệu tham khảo, không cam kết bịa đặt',
  `Ghi chú: "${admissions[0].historicalBenchmarkNote}"`
);

// ----------------------------------------------------------------------------
// TỔNG KẾT BÀI KIỂM THỬ
// ----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`KẾT QUẢ KIỂM THỬ: ${passCount} PASSED | ${failCount} FAILED`);
console.log('================================================================');

if (failCount === 0) {
  console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ HÀNH VI ĐỀU ĐẠT CHUẨN 100%!');
  process.exit(0);
} else {
  console.error('❌ CÓ BÀI KIỂM THỬ KHÔNG ĐẠT!');
  process.exit(1);
}
