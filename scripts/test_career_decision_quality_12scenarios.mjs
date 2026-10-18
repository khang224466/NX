/**
 * KIỂM ĐỊNH CHẤT LƯỢNG QUYẾT ĐỊNH HƯỚNG NGHIỆP THỰC TẾ (12 SCENARIOS AUDIT)
 * 
 * Mục tiêu: Đo lường khách quan năng lực định hướng của careerDecisionEngine.ts:
 * - Đánh giá tính khoa học và độ an toàn của quyết định.
 * - Phát hiện hiện tượng bẫy từ khóa (keyword traps), ép xuất nghề non (turnsCount >= 3),
 *   bỏ qua phủ định/mâu thuẫn, và thiếu độ phủ lĩnh vực (Y khoa, Sư phạm, Tài chính...).
 * 
 * KHÔNG SỬA CODE ENGINE ĐỂ LÀM TEST NÀY PASS. Ghi nhận trung thực kết quả thực tế.
 */

import { 
  processDecisionTurn, 
  evaluateEvidenceReadiness,
  createInitialProfile,
  updateProfileWithInput
} from '../src/engine/careerDecisionEngine.js';

console.log('================================================================');
console.log('--- BẮT ĐẦU KIỂM ĐỊNH CHẤT LƯỢNG QUYẾT ĐỊNH HƯỚNG NGHIỆP (12 SCENARIOS) ---');
console.log('================================================================\n');

const results = [];

function recordResult(scenarioId, title, inputDescription, expected, actual, pass, category, failureReason = '') {
  results.push({
    id: scenarioId,
    title,
    inputDescription,
    expected,
    actual,
    pass,
    category, // 'A' (Đạt), 'B' (Hạn chế), 'C' (Nguy cơ định hướng sai), 'D' (Chưa đủ chứng cứ)
    failureReason
  });

  const icon = pass ? '✅ [PASS]' : (category === 'C' ? '🚨 [FAIL - CRITICAL]' : '⚠️ [FAIL - LIMITATION]');
  console.log(`${icon} Kịch bản ${scenarioId}: ${title}`);
  console.log(`   ↳ Kỳ vọng: ${expected}`);
  console.log(`   ↳ Thực tế: ${actual}`);
  if (!pass) {
    console.log(`   ↳ Phân loại: Nhóm ${category} | Lý do: ${failureReason}`);
  }
  console.log('');
}

// ----------------------------------------------------------------------------
// KỊCH BẢN 1: Chưa biết sở thích và năng lực (Cold Start)
// ----------------------------------------------------------------------------
const sc1Input = 'Em học lớp 11, học lực bình thường, chưa biết mình thích gì.';
const sc1Res = processDecisionTurn(sc1Input);
const sc1Pass = sc1Res.action === 'ASK_QUESTION' && (!sc1Res.suggestedCareers || sc1Res.suggestedCareers.length === 0);
recordResult(
  1,
  'Chưa biết sở thích và năng lực (Khởi đầu từ số 0)',
  sc1Input,
  'action = ASK_QUESTION, số nghề = 0, phản hồi đồng cảm',
  `action = ${sc1Res.action}, số nghề = ${sc1Res.suggestedCareers?.length || 0}`,
  sc1Pass,
  sc1Pass ? 'A' : 'C',
  sc1Pass ? '' : 'Đã xuất nghề quá sớm khi người học chưa có dữ liệu.'
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 2: Thích công nghệ nhưng yếu Toán
// ----------------------------------------------------------------------------
const sc2Input = 'Em thích máy tính và công nghệ nhưng học Toán chưa tốt.';
const sc2Res = processDecisionTurn(sc2Input);
const sc2Pass = sc2Res.action === 'EXPLORE_INTERESTS' && (!sc2Res.suggestedCareers || sc2Res.suggestedCareers.length === 0) &&
  sc2Res.replyText.includes('UI/UX') && sc2Res.replyText.includes('QA');
recordResult(
  2,
  'Thích công nghệ nhưng yếu Toán',
  sc2Input,
  'action = EXPLORE_INTERESTS, phân tách các nhánh IT ít dùng giải tích, số nghề = 0',
  `action = ${sc2Res.action}, số nghề = ${sc2Res.suggestedCareers?.length || 0}`,
  sc2Pass,
  sc2Pass ? 'A' : 'B',
  sc2Pass ? '' : 'Không phân tích đúng phân nhánh hoặc chốt nghề sớm.'
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 3: Thích nhiều lĩnh vực trái nhau (Đa tiềm năng)
// ----------------------------------------------------------------------------
const sc3Input = 'Em vừa thích vẽ truyện tranh nghệ thuật, vừa thích tìm hiểu về thị trường chứng khoán và kinh doanh.';
const sc3Res = processDecisionTurn(sc3Input);
// Kỳ vọng: Hệ thống phải nhận diện được 2 lĩnh vực và hỏi tiếp về cách dung hòa, KHÔNG chốt một nghề đơn lẻ ngay
const hasMultiInterests = sc3Res.updatedProfile.statedInterests.length >= 2;
const sc3Pass = sc3Res.action === 'ASK_QUESTION' && hasMultiInterests && (!sc3Res.suggestedCareers || sc3Res.suggestedCareers.length === 0);
recordResult(
  3,
  'Thích nhiều lĩnh vực trái nhau (Sáng tạo nghệ thuật & Kinh doanh)',
  sc3Input,
  'Thu nhận cả 2 sở thích, action = ASK_QUESTION để tìm điểm giao, không ép chọn một vế ngay',
  `Sở thích ghi nhận: [${sc3Res.updatedProfile.statedInterests.join(', ')}], action = ${sc3Res.action}`,
  sc3Pass,
  sc3Pass ? 'A' : 'B',
  sc3Pass ? '' : `Chỉ ghi nhận 1 lĩnh vực hoặc xử lý chưa trọn vẹn mong muốn đa chiều.`
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 4: Học giỏi nhưng không thích các môn học đang có điểm cao
// ----------------------------------------------------------------------------
const sc4Input = 'Em thi học sinh giỏi Toán và Hóa được giải nhì, nhưng em rất chán và không muốn làm gì liên quan đến kỹ thuật hay tự nhiên nữa.';
const sc4Res = processDecisionTurn(sc4Input);
// Kỳ vọng: Hệ thống không được đẩy vào Kỹ thuật/CNTT chỉ vì có từ "Toán", phải nhận diện được chữ "không muốn làm kỹ thuật"
const falseTechTag = sc4Res.updatedProfile.statedInterests.some(i => i.includes('Kỹ thuật') || i.includes('Công nghệ'));
const sc4Pass = !falseTechTag;
recordResult(
  4,
  'Học giỏi Toán nhưng từ chối làm kỹ thuật/tự nhiên',
  sc4Input,
  'Không gán sở thích Kỹ thuật/Công nghệ; lắng nghe mong muốn chuyển hướng',
  `Sở thích ghi nhận: [${sc4Res.updatedProfile.statedInterests.join(', ')}], Điểm mạnh: [${sc4Res.updatedProfile.academicStrengths.join(', ')}]`,
  sc4Pass,
  sc4Pass ? 'A' : 'C',
  sc4Pass ? '' : 'Bị bẫy từ khóa: Gán nhãn sở thích Kỹ thuật mặc dù người học tuyên bố chán và từ chối.'
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 5: Chọn D01 ngay từ đầu
// ----------------------------------------------------------------------------
const sc5Input = 'Em cứ chọn D01 vì nhiều ngành, rồi chọn trường sau được không?';
const sc5Res = processDecisionTurn(sc5Input);
const sc5Pass = sc5Res.action === 'EXPLORE_INTERESTS' && !sc5Res.replyText.includes('38%') &&
  (sc5Res.replyText.includes('Gate 2') || sc5Res.replyText.includes('loại công việc'));
recordResult(
  5,
  'Muốn chọn khối D01 trước rồi chọn trường/ngành sau',
  sc5Input,
  'action = EXPLORE_INTERESTS, giải thích quy tắc Nghề -> Ngành -> Khối, không bịa số 38%',
  `action = ${sc5Res.action}, nội dung có giải thích Gate 2: ${sc5Res.replyText.includes('Gate 2') || sc5Res.replyText.includes('loại công việc')}`,
  sc5Pass,
  sc5Pass ? 'A' : 'B',
  sc5Pass ? '' : 'Không giải thích được thứ tự EXORA hoặc để người học chọn tắt khối thi.'
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 6: Trả lời rất ngắn hoặc mơ hồ qua 3 lượt liên tiếp
// ----------------------------------------------------------------------------
let p6 = null;
const turn6_1 = processDecisionTurn('...', p6);
p6 = turn6_1.updatedProfile;
const turn6_2 = processDecisionTurn('ko biet', p6);
p6 = turn6_2.updatedProfile;
const turn6_3 = processDecisionTurn('sao cung duoc', p6);
p6 = turn6_3.updatedProfile;

// Kỳ vọng: Người học KHÔNG cung cấp bất kỳ bằng chứng nào -> KHÔNG ĐƯỢC PHÉP xuất CAREER_SHORTLIST!
const sc6Pass = turn6_3.action !== 'CAREER_SHORTLIST' && (!turn6_3.suggestedCareers || turn6_3.suggestedCareers.length === 0);
recordResult(
  6,
  'Trả lời rất ngắn hoặc mơ hồ qua 3 lượt liên tiếp ("...", "ko biet", "sao cung duoc")',
  'Turn 1: "..." | Turn 2: "ko biet" | Turn 3: "sao cung duoc"',
  'Hệ thống kiên nhẫn hỏi tiếp (action != CAREER_SHORTLIST), tuyệt đối KHÔNG xuất 3 thẻ nghề khi rỗng bằng chứng',
  `Turn 3 action = ${turn6_3.action}, số nghề tạo ra = ${turn6_3.suggestedCareers?.length || 0}`,
  sc6Pass,
  sc6Pass ? 'A' : 'C',
  sc6Pass ? '' : 'LỖI NGHIÊM TRỌNG: Điều kiện "profile.turnsCount >= 3" ép xuất 3 thẻ nghề (BA/Marketing) dù người học hoàn toàn không cung cấp dữ liệu!'
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 7: Cung cấp thông tin mâu thuẫn về môi trường làm việc
// ----------------------------------------------------------------------------
let p7 = null;
const turn7_1 = processDecisionTurn('Em cực kỳ ghét ngồi một chỗ trong văn phòng, em chỉ thích đi lại ngoài trời năng động.', p7);
p7 = turn7_1.updatedProfile;
const turn7_2 = processDecisionTurn('Em lại muốn làm công việc bàn giấy ổn định, ngày ngồi 8 tiếng trong phòng máy tính.', p7);
p7 = turn7_2.updatedProfile;

// Kỳ vọng: Hệ thống phải nhận diện được mâu thuẫn văn phòng vs ngoài trời, không thể đồng thời kết luận phù hợp với cả 2
const hasConflictingWorkEnv = p7.workEnvironmentPrefs.length > 0 && p7.personalValues.length > 0;
// Kiểm tra xem phản hồi có đặt câu hỏi bóc tách mâu thuẫn này không
const asksAboutConflict = turn7_2.replyText.toLowerCase().includes('mâu thuẫn') || 
                          turn7_2.replyText.toLowerCase().includes('văn phòng') ||
                          turn7_2.action === 'ASK_QUESTION';
const sc7Pass = asksAboutConflict && turn7_2.action !== 'CAREER_SHORTLIST';
recordResult(
  7,
  'Cung cấp thông tin mâu thuẫn qua các lượt (Ghét văn phòng vs Muốn bàn giấy 8 tiếng)',
  'Turn 1: Ghét văn phòng | Turn 2: Muốn bàn giấy ổn định 8 tiếng',
  'Hệ thống phát hiện hoặc hỏi lại để làm rõ mâu thuẫn môi trường làm việc, chưa xuất nghề vội',
  `Action = ${turn7_2.action}, Môi trường ghi nhận: [${p7.workEnvironmentPrefs.join('; ')}]`,
  sc7Pass,
  sc7Pass ? 'A' : 'B',
  sc7Pass ? '' : 'Không phát hiện mâu thuẫn, âm thầm tích lũy cả 2 môi trường đối nghịch nhau.'
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 8: Thay đổi nguyện vọng / Phủ định sở thích cũ (Pivot & Negation)
// ----------------------------------------------------------------------------
let p8 = null;
const turn8_1 = processDecisionTurn('Em thích máy tính và công nghệ.', p8);
p8 = turn8_1.updatedProfile;
const turn8_2 = processDecisionTurn('Em nghĩ lại rồi, em hoàn toàn không thích máy tính nữa, em ghét công nghệ và muốn chuyển hẳn sang viết lách và làm báo chí.', p8);
p8 = turn8_2.updatedProfile;

// Kỳ vọng: Profile không được tiếp tục giữ sở thích "Công nghệ & Máy tính" khi người học nói rõ "hoàn toàn không thích máy tính nữa, ghét công nghệ"
const stillHasTech = p8.statedInterests.includes('Công nghệ & Máy tính');
const hasWriting = p8.statedInterests.includes('Sáng tạo nghệ thuật & Nội dung');
const sc8Pass = !stillHasTech && hasWriting;
recordResult(
  8,
  'Thay đổi nguyện vọng & Phủ định rõ ràng ("hoàn toàn không thích máy tính nữa, ghét công nghệ")',
  'Turn 1: Thích máy tính | Turn 2: Hoàn toàn không thích máy tính nữa, chuyển sang viết lách',
  'Xóa bỏ "Công nghệ & Máy tính" khỏi sở thích, chỉ giữ lại "Sáng tạo nghệ thuật & Nội dung"',
  `Sở thích hiện tại: [${p8.statedInterests.join(', ')}]`,
  sc8Pass,
  sc8Pass ? 'A' : 'C',
  sc8Pass ? '' : 'BẪY TỪ KHÓA: Hàm updateProfileWithInput chỉ append bằng .includes() nên câu "ghét công nghệ" vẫn bị nhận diện là CÓ thích công nghệ!'
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 9: Có sở thích nhưng bị giới hạn tài chính nghiêm trọng
// ----------------------------------------------------------------------------
let p9 = null;
const turn9_1 = processDecisionTurn('Gia đình em rất khó khăn, bố mẹ không thể chu cấp học phí đại học cao, em thích truyền thông nhưng sợ không có tiền học.', p9);
p9 = turn9_1.updatedProfile;

const hasFinancialConstraint = p9.realConstraints.some(c => c.toLowerCase().includes('tài chính') || c.toLowerCase().includes('học phí'));
// Kiểm tra xem phản hồi có đề cập giải pháp tài chính (Nghị định 116, học phí, vừa học vừa làm, học bổng)
const addressesFinance = turn9_1.replyText.toLowerCase().includes('học phí') || 
                         turn9_1.replyText.toLowerCase().includes('tài chính') ||
                         turn9_1.primaryQuestion?.toLowerCase().includes('tài chính') ||
                         turn9_1.primaryQuestion?.toLowerCase().includes('học phí');
const sc9Pass = hasFinancialConstraint && addressesFinance;
recordResult(
  9,
  'Có sở thích nhưng bị giới hạn tài chính & học phí khó khăn',
  turn9_1.updatedProfile.rawInputs[0],
  'Ghi nhận rào cản tài chính vào realConstraints VÀ phản hồi tư vấn phương án giải quyết học phí',
  `Rào cản ghi nhận: [${p9.realConstraints.join(', ')}], Có phản hồi về tài chính: ${addressesFinance}`,
  sc9Pass,
  sc9Pass ? 'A' : 'B',
  sc9Pass ? '' : 'Ghi nhận rào cản nhưng không đưa vào câu hỏi tư vấn hoặc logic đề xuất.'
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 10: Muốn nghề ổn định nhưng cũng muốn sáng tạo (Scenario 3)
// ----------------------------------------------------------------------------
const sc10Input = 'Em thích sáng tạo nhưng muốn công việc ổn định, không thích giao tiếp quá nhiều.';
const sc10Res = processDecisionTurn(sc10Input);
const sc10Pass = sc10Res.replyText.includes('Sáng tạo + Ổn định + Tập trung độc lập') || 
  sc10Res.replyText.includes('hoàn toàn không phải là những mong muốn mâu thuẫn');
recordResult(
  10,
  'Muốn nghề ổn định nhưng cũng muốn sáng tạo, ít giao tiếp',
  sc10Input,
  'Dung hòa giá trị: chỉ ra các vị trí chuyên môn độc lập có tính ổn định cao',
  `Phản hồi dung hòa: ${sc10Pass}`,
  sc10Pass,
  sc10Pass ? 'A' : 'B',
  sc10Pass ? '' : 'Không dung hòa được giá trị trái chiều.'
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 11: Đã có nghề mục tiêu cụ thể ngoài IT/Kinh tế (Ngành Y Đa Khoa)
// ----------------------------------------------------------------------------
const sc11Input = 'Em đã quyết định chắc chắn sau này sẽ làm Bác sĩ đa khoa, em cần biết lộ trình học và trường đào tạo.';
const sc11Res = processDecisionTurn(sc11Input);
// Kiểm tra xem hệ thống có nhận diện đúng ngành Y hay bị rơi vào kịch bản chung chung hoặc gán IT/BA
const recognizesMedical = sc11Res.updatedProfile.statedInterests.some(i => i.toLowerCase().includes('y') || i.toLowerCase().includes('bác sĩ')) ||
  sc11Res.replyText.toLowerCase().includes('bác sĩ') || sc11Res.replyText.toLowerCase().includes('y khoa');
const sc11Pass = recognizesMedical;
recordResult(
  11,
  'Đã có nghề mục tiêu cụ thể ngoài IT/Kinh tế (Bác sĩ Đa khoa)',
  sc11Input,
  'Nhận diện lĩnh vực Y Dược / Bác sĩ, không đưa ra câu hỏi lạc đề về máy tính hay kinh doanh',
  `Nhận diện được Y khoa: ${recognizesMedical}, Sở thích ghi nhận: [${sc11Res.updatedProfile.statedInterests.join(', ')}]`,
  sc11Pass,
  sc11Pass ? 'A' : 'C',
  sc11Pass ? '' : 'LỖI PHỦ LĨNH VỰC: Từ điển của engine chỉ có 5 nhóm từ khóa (IT, Sáng tạo, Kinh doanh, Xã hội, Máy móc). Hoàn toàn thiếu nhóm Y Dược, dẫn đến việc người học muốn làm Bác sĩ nhưng hồ sơ rỗng và rơi vào kịch bản lạc đề!'
);

// ----------------------------------------------------------------------------
// KỊCH BẢN 12: Cố yêu cầu hệ thống kết luận dù bằng chứng chưa đủ
// ----------------------------------------------------------------------------
const sc12Input = 'Em chưa biết gì cả, nhưng anh chị chốt luôn cho em 3 nghề tốt nhất hiện nay đi, đừng hỏi em nữa.';
const sc12Res = processDecisionTurn(sc12Input);
// Kỳ vọng: Hệ thống kiên quyết không chốt vội, giải thích vì sao cần hiểu bản thân
const sc12Pass = sc12Res.action !== 'CAREER_SHORTLIST' && (!sc12Res.suggestedCareers || sc12Res.suggestedCareers.length === 0);
recordResult(
  12,
  'Người học cố ép hệ thống chốt nghề dù chưa có bằng chứng ("chốt luôn cho em 3 nghề, đừng hỏi nữa")',
  sc12Input,
  'Kiên định từ chối chốt bừa (action != CAREER_SHORTLIST, số nghề = 0), giải thích nguyên tắc hướng nghiệp có căn cứ',
  `action = ${sc12Res.action}, số nghề = ${sc12Res.suggestedCareers?.length || 0}`,
  sc12Pass,
  sc12Pass ? 'A' : 'C',
  sc12Pass ? '' : 'Nhượng bộ người học và xuất bừa 3 nghề không có căn cứ.'
);

// ----------------------------------------------------------------------------
// TỔNG KẾT BỘ KIỂM ĐỊNH 12 KỊCH BẢN
// ----------------------------------------------------------------------------
console.log('\n================================================================');
console.log('--- BẢNG TỔNG HỢP KIỂM ĐỊNH CHẤT LƯỢNG 12 KỊCH BẢN ---');
console.log('================================================================');

const passCount = results.filter(r => r.pass).length;
const failCount = results.filter(r => !r.pass).length;
const groupA = results.filter(r => r.category === 'A').length;
const groupB = results.filter(r => r.category === 'B').length;
const groupC = results.filter(r => r.category === 'C').length;
const groupD = results.filter(r => r.category === 'D').length;

console.log(`TỔNG SỐ KỊCH BẢN: 12`);
console.log(`✅ ĐẠT (PASS): ${passCount} / 12`);
console.log(`❌ KHÔNG ĐẠT (FAIL): ${failCount} / 12`);
console.log(`\nPHÂN HẠNG THEO MỨC ĐỘ:`);
console.log(`- Nhóm A (Hành vi đạt yêu cầu): ${groupA}`);
console.log(`- Nhóm B (Hành vi còn hạn chế): ${groupB}`);
console.log(`- Nhóm C (Nguy cơ định hướng sai / Lỗi logic nghiêm trọng): ${groupC}`);
console.log(`- Nhóm D (Chưa đủ chứng cứ): ${groupD}`);
console.log('================================================================');
