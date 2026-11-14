Created At: 2026-11-14T14:35:00+07:00
Completed At: 2026-11-14T14:35:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.60 PRO - Fix Yes Spam Loop, Strict Exercise Detection & Dynamic 429 Rate Limit Cooldown)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.60 PRO**
- **Xử Lý Triệt Để Lỗi "Bot Liên Tục Spam 'Yes' Thay Vì Giải Bài Tiếng Anh" & "Too Many Requests (429)"**:
  1. **Nguyên Nhân Gốc Rễ (100% Root Cause)**:
     - Trong phiên bản `v10.2.59`, biến `cleanMsg` được tính bằng cách ghép:
       `cleanMsg = ((n.questionBlockText || "") + " " + (i || "") + " " + (document.body ? (document.body.innerText || "") : "")).slice(-3000).toLowerCase();`
     - Do EduNext là Single-Page App (SPA), toàn bộ lịch sử hội thoại của slot học từ đầu buổi (lúc 06:32:10 có câu hỏi mở đầu `Are you ready to move on to the next part? 🚀`) vẫn nằm nguyên trong `document.body.innerText`.
     - Vì vậy, biến `isEnglishReady` luôn trả về `true` ở MỌI CHU KỲ 35s!
     - Khi kiểm tra chuyển phần đặt trước logic giải bài, bot lập tức điền `"Yes"`, bấm gửi, và lặp lại liên tục hơn 30 lần trong ~25 phút, dẫn đến việc bị EduNext khóa tạm thời vì spam (`Too many requests. Please try again after 265 seconds.`).
     - Khi bị 429, mã cũ hardcode thời gian chờ cố định là 25 giây, nên cứ 25s sau bot lại gửi request trong khi EduNext vẫn đang áp lệnh khóa 265s, gây vòng lặp lỗi.
  2. **Giải Pháp Kiến Trúc Hoàn Thiện trong v10.2.60 PRO**:
     - **Bổ sung cờ `hasActualExercise`**:
       Kiểm tra chặt chẽ xem màn hình có đang xuất hiện câu hỏi/bài tập thật sự hay không (`Câu hỏi:`, `Question:`, `In the context of...`, `Answer: [your answer]`, `Which...`, v.v.).
       + NẾU CÓ BÀI TẬP: **TUYỆT ĐỐI KHÔNG BAO GIỜ TRẢ LỜI "Yes" HOẶC "Sẵn sàng"**. Bỏ qua toàn bộ logic chuyển phần và chuyển thẳng cho Gemini Flash-Lite giải chi tiết bằng tiếng Anh.
       + Thêm lớp chắn phản hồi: nếu Gemini nhầm lẫn trả về `"Yes"` khi `hasActualExercise` đang bật, bot sẽ lập tức chặn lại và yêu cầu Gemini giải đúng nội dung bài tập.
     - **Giới hạn phạm vi kiểm tra chuyển phần**:
       Chỉ kiểm tra câu hỏi chuyển phần (`Are you ready...`) trong tin nhắn mới nhất của giáo viên (`i`), TUYỆT ĐỐI KHÔNG quét lịch sử cũ trong `document.body.innerText`.
     - **Phân tích thời gian Rate Limit động (Dynamic 429 Cooldown Parser)**:
       Cả trong hook mạng (`fetch`/`XHR`) lẫn trên giao diện hiển thị (`document.body`), bot tự động trích xuất chính xác số giây cần chờ: `after (\d+) seconds` hoặc `(\d+) giây` (ví dụ 265s, 250s).
       Bot hiển thị rõ thời gian bảo vệ nick (vd: `Chờ hồi phục Rate Limit 429 (270s)...`) và tự động bấm nút `[Try again]` khi hết thời gian mà không cần người dùng can thiệp thủ công.
     - **Nâng cấp `turn-tracker.js`**:
       Loại bỏ neo `^` ở regex tìm kiếm tiêu đề câu hỏi (`/(?:câu\s*hỏi|question|bài\s*sau|đề\s*bài|exercise)\s*:/i`), ưu tiên khối bài tập cụ thể so với lời thoại hướng dẫn.
  3. **Đồng Bộ & Triển Khai CDN**:
     - Tạo bản phân phối `v10_2_60_minified.js` và ghi đè đồng bộ các file `v10_2_59` đến `v10_2_16` để tương thích 100% với bookmarklet cũ của người dùng.
     - Build Next.js thành công 100% trong 2.3s (0 lỗi TypeScript).
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
