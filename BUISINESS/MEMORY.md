# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.3 & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.3** across Web Platform, Bookmarklet, Userscript (Tampermonkey), and Standalone script.
- **Core Breakthroughs in v10.2.3 (Support New Google AI Studio Auth Key AQ... + Direct Gemini Studio Vision + Encrypted Key Engine ENC_AI_ + Screen Capture 5s Loop + Anti-Sẵn Sàng Firewall)**:
  1. **Hỗ Trợ Toàn Diện Định Dạng Key Mới Của Google AI Studio (`AQ....`)**:
     - Google vừa cập nhật hệ thống cấp key trên Google AI Studio sang dạng Auth Key bắt đầu bằng `AQ.` (ví dụ: `AQ.Ab8RN6I-jQWHq...`).
     - Bộ chuyển đổi web `converter.html`, CLI `encrypt_key.js` và hàm giải mã `decryptEncryptedKey()` trong bot đã được cập nhật để chấp nhận cả chuẩn mới `AQ....` lẫn chuẩn cũ `AIzaSy...`.
  2. **Tách Rời 100% Khỏi Vercel Khi Giải Bài (Direct Gemini AI Studio)**:
     - Tampermonkey dùng `@grant GM_xmlhttpRequest` và `@connect generativelanguage.googleapis.com` để gọi thẳng Google AI Studio REST API (`/v1beta/models/...:generateContent?key=...`).
     - Bỏ qua 100% rào cản CSP của EduNext, không bị lỗi `Failed to fetch`.
     - Hỗ trợ tuần tự các model Flash tốc độ cao: `gemini-2.0-flash-lite`, `gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-2.0-flash-lite-preview-02-05`.
  3. **Máy Chuyển Đổi & Mã Hóa Key Bảo Mật (`ENC_AI_...`)**:
     - Người dùng lấy Google Gemini API Key (`AQ...` hoặc `AIzaSy...`), đưa vào máy chuyển đổi để tạo Key mã hóa dạng `ENC_AI_...`.
     - Script Tampermonkey / Bookmarklet giải mã trong RAM bằng `decryptEncryptedKey()`. Người dùng không thể xem raw API key và HUD chặn tuyệt đối không cho dán API key thô.
     - Cung cấp 2 công cụ chuyển đổi:
       - CLI: `node encrypt_key.js <KEY>`
       - Web Converter: `https://fpt-studyhub.vercel.app/converter.html`
  4. **Bắt Buộc Chia Sẻ Màn Hình Để Chụp Ảnh (Screen Share 5s Loop)**:
     - Script có banner đỏ cảnh báo bắt buộc bấm [📸 Chia Sẻ Màn Hình] (chọn tab EduNext).
     - Mỗi 5 giây chụp 1 khung hình độ nét cao (`capturePersistentVisionFrame()`, 1600px max, JPEG 0.80) gửi kèm câu hỏi lên Gemini Vision.
  5. **Tự Động Điền & Track Nút Nộp Bài (Radial Submit)**:
     - Điền đáp án vào textarea bằng `HTMLTextAreaElement.prototype` descriptor kích hoạt event React.
     - Tự động mở radial menu (`openRadialMenuIfNeeded()`), dò tìm nút `[data-intent="SUBMIT_ANSWER"]` hoặc nhãn `Nộp câu trả lời` và trigger chuỗi sự kiện click hoàn chỉnh (`pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`).
  6. **Tường Lửa Chống Kẹt "Sẵn sàng"**:
     - Chặn tuyệt đối câu trả lời "Sẵn sàng" nếu câu hỏi hoặc màn hình có nội dung bài tập chuyên môn (Hóa học, Vật lý, Toán, Z, A, electron, neutron...).

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\rental_platform\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại (Focus EduNext)**:
  1. **FPT EduNext AI Assistant Pro (v10.2.2)**: **ĐANG HOẠT ĐỘNG CHÍNH THỨC**
     - Trải Nghiệm 2 Tiếng: **Miễn Phí (0₫)**.
     - 1 Tuần: **30.000₫**.
     - 1 Tháng: **69.000₫**.
     - 1 Kỳ Học (4 Tháng): **220.000₫** (Gói khuyên dùng).

---

## Past Milestones
- **v10.2.2**: Direct Google Gemini Studio Vision via GM_xmlhttpRequest, Encrypted Key Engine (`ENC_AI_...`), mandatory screen share & 5s auto-capture, Anti-Sẵn Sàng firewall, and radial submit button auto-click.
- **v10.2.1**: Encrypted key validation & trial guard improvements.
- **v10.2.0**: Added AI bridge & dual mode.
- **v10.1.9**: Eliminated "Sẵn sàng" infinite loop by fixing question anchor extraction (`findQuestionAnchor`), added dynamic Z-value element matcher (`B và E`), and neutron math solver.
- **v10.1.8**: Added AI Bridge cross-window postMessage protocol to bypass EduNext Cloudflare CSP, eliminated sidebar DOM extraction contamination.
