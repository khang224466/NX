Created At: 2026-11-14T13:50:00+07:00
Completed At: 2026-11-14T13:50:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.59 PRO - Remove Blocking E===u Check & Seamless 35s Auto Solve)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.59 PRO**
- **Xử Lý Triệt Để Lỗi "Có Timer Nhưng Hết Timer Thì Không Tự Làm"**:
  1. **Nguyên Nhân Chính Xác Trực Tiếp (100% Root Cause)**:
     - Trong phiên bản trước, ở hàm `Q()`, tồn tại đoạn mã kiểm tra:
       ```js
       if (E === u && !isManual && !C) {
           L("👀 Đã nộp bài, đang chờ EduNext phản hồi câu tiếp theo...", "#38bdf8");
           remaining = 15;
           updateCountdownUI();
           return;
       }
       ```
     - Khi người dùng bật tính năng chia sẻ màn hình (**Auto Vision**), `fingerprint` chỉ quét DOM text (không bao gồm hash ảnh chụp màn hình). Sau khi nộp một đáp án (ví dụ `volunteer`), `u` được gán bằng `E`.
     - Ở các chu kỳ 35s tiếp theo, ngay cả khi trên màn hình giáo viên đã đưa câu hỏi mới hoặc câu hỏi chuyển phần, chuỗi `fingerprint` của DOM không đổi (`E === u`).
     - Đoạn code trên lập tức đánh chặn, hiển thị đúng dòng chữ mà người dùng chụp lại: `"👀 Đã nộp bài, đang chờ EduNext phản hồi câu tiếp theo..."`, rồi `return` thoát hàm và reset `remaining = 15s`.
     - Hậu quả: Gemini Flash-Lite KHÔNG BAO GIỜ ĐƯỢC GỌI, bot liên tục reset về 15s/35s và hoàn toàn đứng yên!
  2. **Giải Pháp Kiến Trúc Hoàn Thiện trong v10.2.59 PRO**:
     - **Xóa bỏ hoàn toàn rào cản `if (E === u && !isManual && !C) return;`**:
       Khi hết 35s đếm ngược, bot bắt buộc tiến hành quét ảnh màn hình và câu hỏi, gửi trực tiếp cho Gemini Flash-Lite phân tích.
     - **Cơ Chế Chống Trùng Thông Minh Dựa Trên Đáp Án Thực Tế (`l`)**:
       Chỉ sau khi Gemini phân tích và đưa ra đáp án `A`, bot mới so sánh:
       + Nếu `A` trùng với đáp án vừa nộp `l` (ví dụ đều là `volunteer`) VÀ giáo viên không báo sai (`!C`): bot hiểu là EduNext đang tải chậm chưa sang câu mới -> lùi nhẹ 15s chờ tiếp.
       + Nếu `A` khác `l` (là câu hỏi mới, đáp án mới, hoặc bài chuyển phần `Yes`): bot ngay lập tức điền vào ô soạn thảo và nộp bài!
       + Nếu là màn hình chờ hoặc chấm điểm: Gemini trả về `__NO_QUESTION__`, bot giữ nguyên trạng thái chờ.
     - **Cập nhật nhận diện chuyển phần tiếng Anh (`cleanMsg`)**:
       Quét cả `questionBlockText`, `lastTeacherMsg`, và `document.body.innerText` để bắt trọn câu hỏi `Are you ready to move on to the next part?` và tự động trả lời `Yes`.
     - **Nâng cấp `turn-tracker.js`**:
       Tìm kiếm câu hỏi linh hoạt: ưu tiên sau tin nhắn học sinh, nhưng nếu không thấy sẽ quét toàn trang để không bao giờ bỏ sót đề bài.
  3. **Đồng Bộ & Triển Khai CDN**:
     - Tạo bản phân phối `v10_2_59_minified.js` và ghi đè đồng bộ các phiên bản `v10_2_58` đến `v10_2_16`.
     - Đã build Next.js thành công 100% trong 4.2s (0 lỗi TypeScript).
     - Commit và push cả 2 remote (`fpt-studyhub` và `NX`).

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
