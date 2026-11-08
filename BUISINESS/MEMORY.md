# Memory - Automated Control & Web Automation Project

## Current Status (v10.1.7 & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.1.7** across Web Platform, Bookmarklet, Standalone Chrome/Edge Extension, and Userscript.
- **Core Breakthroughs in v10.1.7 (Fix Button HTML Explosion Bug & Pure DOM Bookmarklet Injection)**:
  1. **Khắc Phục Triệt Để Lỗi Nút Bấm Nổ Thành Khối Xanh Khổng Lồ Che Kín Màn Hình**:
     - *Nguyên nhân:* Trước đó trong file HTML `Cai_Dat_Bookmark_EduNext.html`, chuỗi code minified được nhúng trực tiếp vào thuộc tính `href="..."`. Vì mã JavaScript minified chứa các dấu ngoặc kép `"` (ví dụ: `getElementById("enx-pro-hud")`), trình duyệt hiểu dấu `"` đầu tiên là kết thúc thuộc tính `href`, và toàn bộ 27.900 ký tự code còn lại bị đẩy vào phần text hiển thị bên trong thẻ `<a>`, khiến nút bấm màu xanh bung nở phủ kín 80% màn hình!
     - *Khắc phục:* Tách hoàn toàn code ra khỏi HTML tĩnh. Thẻ `<a>` chỉ chứa văn bản ngắn gọn: `⭐ EduNext AI Pro v10.1.7`. Thuộc tính `href` và sự kiện kéo thả `dragstart` được gán động an toàn bằng DOM API trong thẻ `<script>`, miễn nhiễm 100% với lỗi xung đột dấu ngoặc kép HTML.
  2. **Bảo Toàn Logic v10.1.6**:
     - Nén AST Terser chuyên dụng, giữ nguyên 100% URL Discord/Gemini/Groq/Proxy.
     - Bộ nạp mạng `universalRequest` (hỗ trợ `GM_xmlhttpRequest` và `fetch`).
     - Bộ giải cứu nguy cấp nội bộ `localSolver` cho Hóa học (cấu hình electron) và Vật lí (tổng hợp lực).
     - Nộp bài 2 giai đoạn: Mở Radial Menu $\rightarrow$ click nút "Nộp câu trả lời".
     - Chia sẻ màn hình Live Vision (`navigator.mediaDevices.getDisplayMedia`).
     - Hộp thoại nhập Key riêng biệt + STK MBBank `0987654321` (`VO TRI KHANG`) & Discord Admin.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\rental_platform\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại (Focus EduNext)**:
  1. **FPT EduNext AI Assistant Pro (v10.1.7)**: **ĐANG HOẠT ĐỘNG CHÍNH THỨC**
     - Trải Nghiệm 2 Tiếng: **Miễn Phí (0₫)**.
     - 1 Tuần: **30.000₫**.
     - 1 Tháng: **69.000₫**.
     - 1 Kỳ Học (4 Tháng): **220.000₫** (Gói khuyên dùng).
  2. **FPT Khảo Thí Online — Cổng Ôn Luyện & Đề Thi Thử**: **SẮP RA MẮT**.
  3. **Safe Exam Browser (SEB) Toolkit & Hỗ Trợ Kỳ Thi**: **SẮP RA MẮT**.

---

## Past Milestones
- **v10.1.7**: Fixed HTML quote collision that caused bookmarklet button to explode into raw code across the screen; decoupled code injection via DOM script API.
- **v10.1.6**: Fixed regex URL stripping bug using Terser AST, verified 0 syntax errors, added universalRequest (GM_xmlhttpRequest + fetch) and local emergency solver.
- **v10.1.5**: Fixed Bookmarklet 404 & Dragging, Restored Turn-Based Chat State (v10.0.9 logic), 2-Stage Radial Submit clicker, Live Vision Screen Capture.
- **v10.1.4**: Real AI integration, user API key modal, dual submit button finding (.w-send-btn + Nộp câu trả lời).
- **v10.1.3**: 100% Auto-Submit targeted to 'Nộp câu trả lời', License Key Security Gate, MBBank STK & Discord Support info, Pure DOM.
- **v10.1.2**: Modal Draggable Button, Native Draggable Bookmarklet (dataTransfer URI-list/URL), Pure DOM (Zero innerHTML), Standalone Extension MV3.
- **v10.1.1**: Encrypted API Key Vault (`ENC_AES_...` & `ENC_FPT_...`) with `/api/v1/ai/encrypt-key` and in-memory auto-decryption.
- **v10.1.0**: Cloud AI Proxy & Encrypted Trial Guard (0 VND Free Trial 2 Hours, Single Submit Lock, Anti-429 Dual Interceptor).
