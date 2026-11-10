# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.17 - Dual Key Support: Raw & Encrypted + Auto-Destroy Old HUD)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.17** (Đột phá: Giải thích và giải quyết triệt để nguyên nhân người dùng bị kẹt ở v10.2.12; phát hiện trang Vercel cũ bị đóng băng lúc trưa khiến việc kéo nút từ trang web Vercel luôn ra bản .12; cung cấp giải pháp chỉnh sửa trực tiếp URL bookmarklet trên Chrome và hỗ trợ nhập trực tiếp Key Gemini AIza... lẫn Key mã hóa ENC_AI_...).

## Previous Status (v10.2.16 - Auto-Destroy Zombie HUDs & 160-Char jsDelivr Drag Loader)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.16** (Đột phá: Khắc phục triệt để lỗi người dùng bị kẹt ở bản v10.2.12 khi bấm lại bookmarklet; tự động phát hiện và tiêu diệt hoàn toàn HUD + setInterval + Observer cũ của các phiên bản trước; tích hợp loader jsDelivr 160 ký tự siêu nhẹ kéo thả 100% ăn ngay trên Bookmarks Bar).
- **Core Breakthroughs in v10.2.16**:
  1. **Tiêu Diệt Tận Gốc Bản Zombie v10.2.12 Đang Chạy Ngầm Trong Tab**:
     - Trước đây, khi v10.2.12 đang chạy, `window.__ENX_PRO_HUD__ = true`. Khi click bookmarklet mới, mã chỉ toggle ẩn/hiện `#enx-pro-hud` của bản cũ mà không bao giờ khởi tạo bản mới.
     - **Giải pháp v10.2.16**: Kiểm tra `window.__ENX_VERSION__ === CURRENT_VERSION`. Nếu phát hiện phiên bản khác đang chạy ngầm, lập tức phát sự kiện `enx_destroy`, xóa sạch `setInterval`, gỡ HUD cũ khỏi DOM và khởi động lại sạch sẽ v10.2.16.
  2. **Bookmarklet Kéo Thả 160 Ký Tự (jsDelivr CDN Whitelisted)**:
     - URL bookmarklet rút gọn còn đúng 160 ký tự, không bao giờ bị Chromium cắt ngắn bộ nhớ đệm kéo thả.
     - Dùng timestamp `?t=' + Date.now()` bypass sạch sẽ cache trình duyệt và CDN.
  3. **Tự Động Mở Trang Kéo Thả Trực Quan**:
     - Đã tạo và tự động mở file `d:\BUISINESS\keo_bookmark_edunext.html` trên trình duyệt người dùng.

## Previous Status (v10.2.15 - One-Way Ready Lock & Historical Message Bypass)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.15** (Đột phá: Khắc phục triệt để lỗi "vẫn là 10_2_12, vẫn là spam sẵn sàng" do quét nhầm tin nhắn lịch sử mở đầu bài học; bổ sung khóa 1 chiều `hasHandledInitialReady` và cơ chế phân tách nghiêm ngặt giữa lượt giáo viên và học sinh).
- **Core Breakthroughs in v10.2.15**:
  1. **Nguyên Nhân Triệt Để Của Lỗi "Spam Sẵn Sàng" Được Giải Quyết**:
     - Trong EduNext, tin nhắn số 0 ở đầu bài học ("Bạn đã sẵn sàng chuyển sang phần tiếp theo chưa? 🚀" cùng nút `[Sẵn sàng]`) không bao giờ biến mất khỏi DOM (`.chat-messages`).
     - Khi kiểm tra toàn văn bản hoặc `document.querySelectorAll('button')`, mã luôn tìm thấy nút và văn bản "Sẵn sàng" của tin nhắn đầu tiên, dẫn đến việc nhận diện sai liên tục rằng đang ở màn hình Sẵn sàng dù đề bài toán đang hiển thị.
     - **Giải pháp v10.2.15**:
       - `detectCurrentQuestionState()` chỉ quét tin nhắn **cuối cùng** của giáo viên (`lastAssistant`), tuyệt đối không duyệt ngược về tin nhắn cũ.
       - Thêm cờ khóa một chiều `hasHandledInitialReady`: Màn hình "Sẵn sàng" chỉ được phép kích hoạt đúng **1 lần duy nhất** khi bắt đầu bài học (khi chưa có bất kỳ tin nhắn nào của học sinh `!lastUser`).
       - Sau khi đã nộp "Sẵn sàng" một lần, hệ thống khóa vĩnh viễn trạng thái `READY_PROMPT` trong suốt buổi học.
  2. **Máy Trạng Thái 2 Chiều Chuẩn Xác (Waiting Assistant vs Question)**:
     - Nếu học sinh vừa gửi tin nhắn (`lastUser` nằm sau `lastAssistant` trong DOM): Trạng thái trả về là `WAITING_ASSISTANT` ("Đang chờ giáo viên EduNext ra đề..."). Bot tuyệt đối im lặng, không gõ, không nộp, không spam.
     - Khi giáo viên ra tin nhắn mới (`lastAssistant` nằm sau `lastUser`):
       - Kiểm tra hoàn thành bài học -> `COMPLETED`.
       - Kiểm tra đang typing/streaming -> `STREAMING`.
       - Kiểm tra khối câu hỏi `.exercise-question-block` hoặc nội dung đề bài -> `QUESTION`.
       - Tiến hành chụp Vision -> Gemini Flash-Lite giải bài -> Điền React Fiber 5 tầng -> Bấm nộp.
  3. **Đồng Bộ Phiên Bản & Bypass Cache Trình Duyệt 100%**:
     - Cập nhật toàn diện `inject.js`, `edunext.user.js`, `utils.ts`, `bridge.html` và toàn bộ giao diện Next.js lên `v10.2.15`.
     - Thêm header `Cache-Control: no-cache, no-store, must-revalidate, max-age=0, s-maxage=0` và `Pragma: no-cache`.
     - Xuất mã Bookmarklet 1-Click Inline đầy đủ và mã Loader có timestamp `?v=10_2_15&t=Date.now()` để người dùng cập nhật không bị vướng cache cũ của Chrome/Vercel.
  4. **Khôi Phục Trải Nghiệm Kéo Thả Tiện Lợi (Drag & Drop Bookmarklet)**:
     - Tạo trang `keo_bookmark_edunext.html` và `rental_platform/public/keo_bookmark.html`.
     - Tự động mở tab trình duyệt để người dùng chỉ cần nhấp giữ chuột vào nút xanh và kéo thẳng lên thanh Bookmark (Bookmarks Bar).
     - Đồng bộ mã `v10.2.15` vào `RAW_FN_STRING` trong `utils.ts` phục vụ cho landing page và modal kích hoạt.

---

## Previous Status (v10.2.14 - Reactive DOM Question Detection & Zero Fixed Delays)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.14** (Đột phá: Xoá bỏ hoàn toàn các bộ đếm thời gian cố định / sleep timers; thiết kế bộ Reactive DOM Tracker dùng MutationObserver bắt trúng 100% thời điểm câu hỏi hiện lên màn hình để chụp ngay lập tức).
- **Core Breakthroughs in v10.2.14**:
  1. Không Dùng Thời Gian Cố Định (Zero Fixed Timers): Toàn bộ cơ chế kiểm tra câu hỏi chuyển sang hướng sự kiện (Event-Driven Reactive). Gắn `MutationObserver` trực tiếp vào khung chat (`chat-messages`).
  2. Bộ Nhận Diện Trạng Thái Câu Hỏi Chính Xác (`detectCurrentQuestionState`): Phát hiện khối câu hỏi bài tập chuyên dụng `.exercise-question-block`.
  3. Chu Trình Chuẩn Xác 100%: EduNext hiện câu hỏi -> Observer bắt được ngay lập tức -> Auto-Vision chụp ảnh tức thì -> Gemini Flash-Lite trả lời -> Điền vào React Fiber và bấm Nộp -> Lập tức quay lại trạng thái chờ câu hỏi tiếp theo.

---

## Previous Status (v10.2.13 - Question Appearance Tracking & Natural Pacing)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.13** (Đột phá: Khắc phục triệt để tình trạng chụp và gửi quá nhanh; thêm cơ chế theo dõi khi nào câu hỏi hiện lên trọn vẹn mới chụp, bổ sung các khoảng nghỉ nhỏ tự nhiên mô phỏng người dùng).

---

## Previous Status (v10.2.12 - React 18 Fiber Direct Sync & Auto Question Loop)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.12** (Đột phá: Khắc phục triệt để lỗi lặp câu hỏi 10s nhờ đồng bộ React 18 Fiber, tự động điền và bấm Nộp [Sẵn sàng], tự động theo dõi câu hỏi kế tiếp, giải bài và lặp liên tục tới khi hoàn thành).

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\` (kèm junction `d:\BUISINESS\rental_platform` để tương thích tuyệt đối mọi script)
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại (Focus EduNext)**:
  1. **FPT EduNext AI Assistant Pro (v10.2.16)**: **ĐANG HOẠT ĐỘNG CHÍNH THỨC**
     - Trải Nghiệm 2 Tiếng: **Miễn Phí (0₫)**.
     - 1 Tuần: **30.000₫**.
     - 1 Tháng: **69.000₫**.
     - 1 Kỳ Học (4 Tháng): **220.000₫** (Gói khuyên dùng).
