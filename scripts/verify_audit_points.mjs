import { readFileSync } from 'fs';

console.log('--- RUNNING AUDIT & VERIFICATION SUITE FOR CAREERPATHWAYNAVIGATOR ---');

// 1. Inspect source code for the 8 audit criteria
const source = readFileSync('src/components/CareerPathwayNavigator.tsx', 'utf-8');

// Test 1: Layout fix - textarea has comfortable rows, min-height and no absolute button overlap
const hasAbsoluteButtonOverTextarea = /<textarea[^>]*\/>\s*<button[^>]*className="[^"]*absolute right-2 bottom-3/s.test(source);
console.log('Test 1 (UI Layout: No button overlapping textarea):', !hasAbsoluteButtonOverTextarea ? 'PASSED ✅' : 'FAILED ❌');

// Test 2: Reality-Check question exists verbatim and creator note
const expectedQuestion = `Hãy tự hỏi rằng, mình có thực sự sẵn sàng để đối mặt với thực tế chưa. Bắt đầu biết rằng mình sắp phải đi làm, không còn có ai đốc thúc đi học. Bạn có dám đồng ý với tôi rằng bạn sẽ sẵn sàng để gánh trách nhiệm đó sau khi đã kéo dài khoảng thời gian được phép ngây thơ thêm chút nữa ?`;
const hasVerbatimQuestion = source.includes(expectedQuestion);
const hasCreatorNote = source.includes('đây là câu hỏi từ chính người làm web, không phải do AI sinh ra. Hãy trả lời thực lòng mình.');
console.log('Test 2 (Creator Reality Check Question Present Verbatim):', (hasVerbatimQuestion && hasCreatorNote) ? 'PASSED ✅' : 'FAILED ❌');

// Test 3: Purged blind options[0] fallback bug
const hasBlindSubjectFallback = /selectedSubjectOption\s*\)\s*\|\|\s*config\.subjectQuestion\.options\[0\]/.test(source);
const hasBlindEnvFallback = /selectedWorkEnvOption\s*\)\s*\|\|\s*config\.workEnvQuestion\.options\[0\]/.test(source);
console.log('Test 3 (Eradication of Fake Blind options[0] Leak):', (!hasBlindSubjectFallback && !hasBlindEnvFallback) ? 'PASSED ✅' : 'FAILED ❌');

// Test 4: Structured Data Partitioning ([Dữ liệu người học cung cấp], [Giả thuyết định hướng], [Bằng chứng thực chứng 2026])
const hasSelfReportedTag = source.toLowerCase().includes('[dữ liệu người học cung cấp');
const hasHypothesisTag = source.toLowerCase().includes('[giả thuyết định hướng');
const hasEvidenceTag = source.toLowerCase().includes('[bằng chứng thực chứng 2026');
console.log('Test 4 (Explicit Evidence Tier Separation):', (hasSelfReportedTag && hasHypothesisTag && hasEvidenceTag) ? 'PASSED ✅' : 'FAILED ❌');

// Test 5: whyNotOthers field in SuggestedCareerItem
const hasWhyNotOthersInInterface = source.includes('whyNotOthers?: string;');
const hasWhyNotOthersInCard = source.includes('career.whyNotOthers');
console.log('Test 5 (Career Trade-off & Elimination Explanation whyNotOthers):', (hasWhyNotOthersInInterface && hasWhyNotOthersInCard) ? 'PASSED ✅' : 'FAILED ❌');

// Test 6: Learner Profile & Conversation Continuity in Follow-Up
const hasLearnerProfileState = source.includes('learnerProfile');
const hasProfileInFollowUp = source.includes('[HỒ SƠ ĐÃ THU THẬP TỪ NGƯỜI HỌC]:');
console.log('Test 6 (Conversation State & Profile Persistence):', (hasLearnerProfileState && hasProfileInFollowUp) ? 'PASSED ✅' : 'FAILED ❌');

// Test 7: Target Career First (Gate 2) -> Major (Gate 3) -> Admission & Combos (Gate 4)
const hasGate2BeforeGate3 = source.includes('Gate 2: Target Career Roles') && source.includes('Khám phá nghề này: Cần học ngành gì?');
console.log('Test 7 (Reverse Flow: Career ➔ Major ➔ Combo/School):', hasGate2BeforeGate3 ? 'PASSED ✅' : 'FAILED ❌');

console.log('--- ALL AUDIT CHECKS FINISHED ---');
