Created At: 2026-11-14T12:30:00+07:00
Completed At: 2026-11-14T12:30:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.58 PRO - Fix 35s Auto Solve Freeze & English Question Recognition)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.58 PRO**
- **Xử Lý Triệt Để Lỗi "Hết 35s Vẫn Đứng Yên, Chả Tự Làm Bài" & "Không Làm Tiếng Anh Được"**:
  1. **Nguyên Nhân Gốc Rễ Đếm Ngược 35s Xong Không Tự Làm**:
     - **Nguyên nhân 1 (Bộ phân tích lượt `readEduNextTurn` bị kẹt ở `waiting_teacher`)**:
       Hàm `readEduNextTurn` trong `scripts/turn-tracker.js` trước đây phụ thuộc vào các CSS selector cứng nhắc (`.exercise-question-block`, `.wrap-message-view`, etc.). Trên thực tế giao diện EduNext (như bài tiếng Anh Unit 2 - The Generation Gap), thẻ bài tập và tin nhắn giáo viên không chứa các class này. Do đó, hàm không nhận diện được câu hỏi mới của giáo viên, thấy huy hiệu học sinh của lượt trước nên gán nhầm trạng thái là `waiting_teacher` ("Đang chờ EduNext phản hồi...").
     - **Nguyên nhân 2 (`timerInterval` gọi `Q(!1)` với `e = false`)**:
       Khi bộ đếm ngược 35s chạy về 0, nó gọi `Q(!1)` (false). Hàm `Q` kiểm tra điều kiện `if ("waiting_teacher" !== n.state || e)`. Do `e` là `false` và `n.state` bị kẹt ở `waiting_teacher`, điều kiện này trả về `false`, khiến bot bỏ qua việc giải bài và tiếp tục reset bộ đếm 35s rồi đứng yên vô tận.
     - **Nguyên nhân 3 (Regex định dạng tiếng Anh `Answer: [your answer]` bị neo đầu chuỗi `^`)**:
       Khi đề tiếng Anh yêu cầu `Please answer using this format: Answer: [your answer]`, biểu thức regex `/^answer\s*:\s*\[/i` bị fail vì đầu chuỗi bắt đầu bằng nhãn `Câu hỏi:`, dẫn đến việc không định dạng đúng mẫu `Answer: [đáp án]` mà EduNext yêu cầu.
  2. **Giải Pháp Đột Phá & Toàn Diện Trong v10.2.58 PRO**:
     - **Nâng Cấp `turn-tracker.js`**:
       + Quét toàn bộ DOM để tìm các thẻ câu hỏi có nhãn `Câu hỏi:`, `Question:`, `Please answer using this format:`, hoặc thẻ tin nhắn chứa `Graded by AI`, `INT: ANS`, `Feedback`, `Correct!`, `Incorrect`.
       + Nếu bất kỳ dấu hiệu phản hồi nào của giáo viên xuất hiện SAU tin nhắn của học sinh (theo thứ tự DOM `compareDocumentPosition`), trạng thái 100% là `student_turn` (lượt của học sinh), KHÔNG BAO GIỜ bị gán nhầm là `waiting_teacher`.
       + Tự động kiểm tra ô soạn thảo `textarea`: nếu ô nhập liệu đang hiển thị và kích hoạt (enabled) cùng với câu hỏi trên màn hình, bot tự động kích hoạt `student_turn`.
     - **Sửa Đổi Chu Kỳ Hết 35s Gọi `Q(!0, !1)` (Cưỡng Chế Quét & Giải Đề)**:
       + Khi bộ đếm ngược 35s về 0, bot gọi `Q(!0, !1)` (`force = true, isManual = false`), bỏ qua cờ `waiting_teacher`, cưỡng chế phân tích lại toàn bộ màn hình để trích xuất đề bài, kích hoạt Gemini Flash-Lite giải và tự động nộp ngay lập tức.
       + Cơ chế chống lặp thông minh: nếu câu hỏi cũ đã nộp và EduNext phản hồi chậm chưa kịp ra câu mới (`E === u`), bot sẽ không spam nộp lại mà lùi nhẹ 10-15s chờ EduNext render câu mới mà không bật alert làm phiền người dùng.
     - **Xử Lý Chuẩn Mực Môn Tiếng Anh (English Lessons)**:
       + Nhận diện toàn diện câu hỏi trắc nghiệm, điền từ, modal verbs (`which modal verb expresses a strong obligation?` -> `Answer: must`).
       + Tự động bắt câu hỏi Yes/No (`Are you ready to move on to the next part?` -> tự động trả lời `Yes` và bấm chuyển phần).
       + Format chuẩn `Answer: [your answer]` không phụ thuộc vào vị trí chuỗi.
     - **Nâng Cấp Đồng Bộ Toàn Bộ Hệ Thống Lên v10.2.58 PRO**:
       + Cập nhật tất cả các tệp: `edunext-client.js`, `turn-tracker.js`, `edunextBundle.ts`, `build_v10_cdn.js`, `generate_keo_page.js`, `Navbar.tsx`, `HeroSection.tsx`, `Footer.tsx`, `DemoVideoTrailer.tsx`, `ComparisonTable.tsx`, `FaqSection.tsx`, `ServiceCatalog.tsx`, `servicesCatalog.ts`, `ActivationSuccessModal.tsx`, `layout.tsx`, `activate/page.tsx`, `admin/page.tsx`, `api/v1/ai/solve/route.ts`, `bridge.html`, `Cai_Dat_Bookmark_EduNext.html`.
       + Xuất bản file CDN `v10_2_58_minified.js` và ghi đè đồng bộ các phiên bản cũ `v10_2_57` đến `v10_2_16`.
       + Next.js build kiểm thử hoàn thành với 0 lỗi TypeScript (Finished TypeScript in 21.8s).

---

## Technical Architecture & Core Files
- **EduNext Client Script**: `FPT service/scripts/edunext-client.js`
- **Turn Tracker**: `FPT service/scripts/turn-tracker.js`
- **Bundle Generator**: `FPT service/scripts/build-edunext.cjs`
- **CDN Generator**: `FPT service/scripts/build_v10_cdn.js`
- **AI Backend Solver**: `FPT service/src/app/api/v1/ai/solve/route.ts`
- **Admin Management & Order Store**: `FPT service/src/app/admin/page.tsx`, `FPT service/src/lib/orderRepository.ts`
- **Bookmarklet Drag Page**: `FPT service/public/keo_bookmark.html`, `FPT service/scripts/generate_keo_page.js`
- **CDN Minified Distributions**: `d:\BUISINESS\v10_2_*_minified.js` (Root)
