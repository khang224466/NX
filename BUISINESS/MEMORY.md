Created At: 2026-11-14T15:10:00+07:00
Completed At: 2026-11-14T15:10:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.61 PRO - Eliminate Hardcoded Yes Bypass, Hide UI API Keys, Guaranteed Instant Key Revocation On Delete & Fresh CDN Endpoint)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.61 PRO**
- **Giải Quyết Toàn Diện 4 Vấn Đề Người Dùng Yêu Cầu**:
  1. **Xóa Sạch API Key Khỏi Giao Diện (Bảo Mật Tuyệt Đối)**:
     - Đã loại bỏ hoàn toàn khối `key-box` chứa input `custom-key-input` hiển thị API key dạng plaintext (`AQ.Ab8RN6I0...`) khỏi giao diện `bridge.html`.
     - API key được xử lý an toàn 100% trong bộ nhớ/localStorage ngầm dưới nền, không bao giờ xuất hiện trên DOM để tránh lộ key khi quay video, chụp màn hình hay chia sẻ tab.
  2. **Cam Kết Tuyệt Đối Khi Bấm Xóa Đơn Ở Bảng Quản Lý (Ảnh 4)**:
     - **Trước đây**: Khi Admin bấm xóa đơn, hệ thống chỉ xóa đơn ở UI admin, nhưng script khách vẫn chạy được vì giải mã offline và tự fallback về `DEFAULT_TOKEN`.
     - **Bản v10.2.61 PRO**: Đã thiết lập cơ chế thu hồi 3 tầng:
       + Khi bấm xóa (🗑️) ở ảnh 4: Mã `licenseKey` (`ENC_AI_...`) và `orderId` lập tức được ghi vào danh sách đen `fpt_revoked_keys_v10` và `revokedLicenseKeys` trên server.
       + Mọi yêu cầu gọi `/api/v1/ai/solve` hoặc `AI Bridge` với key bị xóa sẽ bị từ chối 403 Forbidden ngay lập tức.
       + Tại client, hàm `o(token)` kiểm tra trực tiếp danh sách thu hồi: nếu key bị xóa/hủy, bot lập tức tắt Auto (`d = false`), xóa sạch key khỏi máy và hiển thị cảnh báo đỏ `⛔ Key bản quyền đã bị xóa / vô hiệu hóa vĩnh viễn bởi Quản trị viên!`. Tuyệt đối KHÔNG fallback sang token mặc định.
       + **Kết luận: 100% khi bấm xóa ở ảnh 4, Key sẽ dừng hoạt động NGAY LẬP TỨC trên toàn bộ máy khách.**
  3. **Xóa Bỏ Toàn Bộ Luồng Cứng (Xóa Tận Gốc Lỗi Lặp "Yes" & Giảm 35s Xuống 15s)**:
     - **Xóa bỏ hoàn toàn luồng tự động gõ "Yes"**: Loại bỏ triệt để biến `isPureTransitionPrompt` và lệnh `await z(readyWord)`. Script client không bao giờ tự tiện gõ "Yes" vào ô soạn thảo.
     - **Sửa lỗi trích xuất đề trong `turn-tracker.js`**: Loại bỏ bộ lọc `readyPrompts` trong `findQuestion()`. Trước đây, khi không tìm thấy câu hỏi sau tin nhắn học sinh, nó quét toàn trang và bắt nhầm câu chào `Are you ready to move on...` từ 06:32 sáng! Nay chỉ tập trung tìm khối câu hỏi thực tế (`Câu hỏi:`, `Question:`, `Which...`, `What...`, `Please answer...`).
     - **Xóa bỏ hiện tượng drop 15s**: Đã xóa bỏ các điểm ngắt 15s cứng nhắc, chuyển sang chu kỳ thăm dò linh hoạt 5s khi đang phân tích hoặc khi chưa có câu mới. Khi ô soạn thảo (`activeInput`) đang mở và sẵn sàng, bot coi đó luôn là lượt của học sinh (`student_turn`) và gọi thẳng AI giải bài, không bao giờ chặn bằng thông báo "Đã nộp bài, đang chờ EduNext phản hồi".
     - **Khắc phục AI Bridge bị treo**: Loại bỏ cờ chặn `if (isBridgeSolving) return;` gây nuốt mất yêu cầu của EduNext khiến bot phải chờ 25s timeout rồi rơi vào trạng thái chờ 15s.
  4. **Giải Thích & Sửa Dứt Điểm "Thả Bản 60 Mở Lên Ra Bản 58" (CDN Caching)**:
     - Trước đây, `utils.ts` và `keo_bookmark.html` vẫn trỏ vào URL cũ `v10_2_57_minified.js`, và CDN jsDelivr lưu cache file đó từ các giờ trước (lúc còn là bản 58).
     - Nay bản mới nhất được phát hành độc lập dưới URL hoàn toàn mới: `v10_2_61_minified.js`. Do là URL mới 100%, jsDelivr chưa từng lưu cache nên sẽ kéo thẳng bản mới nhất từ GitHub.
     - Đồng thời kích hoạt API Purge (`purge.jsdelivr.net`) cho toàn bộ các phiên bản `v10_2_61` đến `v10_2_57`.

---

## Technical Architecture & Core Files
- **EduNext Client Script**: `FPT service/scripts/edunext-client.js` (v10.2.61)
- **Turn Tracker**: `FPT service/scripts/turn-tracker.js`
- **Bundle Generator**: `FPT service/scripts/build-edunext.cjs`
- **CDN Generator**: `FPT service/scripts/build_v10_cdn.js`
- **AI Backend Solver**: `FPT service/src/app/api/v1/ai/solve/route.ts`
- **AI Bridge**: `FPT service/public/bridge.html`
- **Admin Management & Order Store**: `FPT service/src/app/admin/page.tsx`, `FPT service/src/lib/orderRepository.ts`
- **Bookmarklet Drag Page**: `FPT service/public/keo_bookmark.html`, `FPT service/scripts/generate_keo_page.js`
- **CDN Minified Distributions**: `d:\BUISINESS\v10_2_*_minified.js` (Root)
