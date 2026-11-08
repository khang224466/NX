# Memory - Automated Control & Web Automation Project

## Current Status (v10.1.6 & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.1.6** across Web Platform, Bookmarklet, Standalone Chrome/Edge Extension, and Userscript.
- **Core Breakthroughs in v10.1.6 (Fix Regex URL Stripping Bug, Terser AST Minifier & Universal Cross-Origin Engine)**:
  1. **Khắc Phục Triệt Để Lỗi "didnt work"**:
     - *Phát hiện chí mạng:* Trong bản `v10.1.5`, đoạn regex loại bỏ comment `\/\/[^\n]*\n` đã vô tình xóa phần đuôi của chuỗi `https://discord.com/users/...`, để lại mã `dcLink.href = 'https: dcLink.target = '_blank';`. Điều này gây ra lỗi nghiêm trọng `SyntaxError: Unexpected identifier '_blank'` khiến trình duyệt hoàn toàn KHÔNG THỂ chạy Bookmarklet khi click!
     - *Khắc phục:* Chuyển sang sử dụng bộ nén AST chuyên nghiệp **Terser (`next/dist/compiled/terser`)**. Bảo toàn nguyên vẹn 100% mọi URL `https://...` (Discord, Gemini, Groq, Cloud Proxy). Kiểm thử `new vm.Script()` pass 100% (0 lỗi cú pháp).
  2. **Bổ Sung Động Cơ Gửi Yêu Cầu Đa Nền Tảng (`universalRequest`)**:
     - Tự động nhận diện môi trường: Nếu chạy trên Tampermonkey / Tiện ích mở rộng sẽ sử dụng `GM_xmlhttpRequest` (vượt 100% rào cản CSP của trang web). Nếu chạy qua Bookmarklet sẽ sử dụng `fetch()`.
  3. **Bộ Giải Cứu Nguy Cấp Nội Bộ (`localSolver`)**:
     - Tích hợp bộ giải tức thì (0ms latency, không phụ thuộc mạng/CSP) cho các câu hỏi phổ biến trên EduNext:
       - Hóa học cấu hình electron: $Li \rightarrow 1$, $Na \rightarrow 1$, $K \rightarrow 1$, $C \rightarrow 4$, $O \rightarrow 6$, $N \rightarrow 5$, $Cl \rightarrow 7$, $Ne \rightarrow 8$.
       - Vật lí tổng hợp lực: Cùng chiều ($F = F_1 + F_2$), ngược chiều ($F = |F_1 - F_2|$), vuông góc ($F = \sqrt{F_1^2 + F_2^2}$), quy tắc hình bình hành.
       - Sẵn sàng chuyển phần tiếp theo.
  4. **Giữ Nguyên Các Tính Năng Cao Cấp**:
     - Chia sẻ màn hình Live Vision (`navigator.mediaDevices.getDisplayMedia`).
     - Hộp thoại nạp Key riêng biệt, hỗ trợ Google Gemini (`AIza...`), Groq (`gsk_...`), hoặc License Key.
     - STK MBBank: `0987654321` (Chủ TK: `VO TRI KHANG`), Discord Admin: `https://discord.com/users/888713971161505832`.
     - Nộp bài 2 giai đoạn: Mở Radial Menu qua `.w-send-btn` $\rightarrow$ bấm `.exercise-intent-radial__item` ("Nộp câu trả lời").
     - 100% Pure DOM (Zero innerHTML), kháng Trusted Types CSP.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\rental_platform\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại (Focus EduNext)**:
  1. **FPT EduNext AI Assistant Pro (v10.1.6)**: **ĐANG HOẠT ĐỘNG CHÍNH THỨC**
     - Trải Nghiệm 2 Tiếng: **Miễn Phí (0₫)**.
     - 1 Tuần: **30.000₫**.
     - 1 Tháng: **69.000₫**.
     - 1 Kỳ Học (4 Tháng): **220.000₫** (Gói khuyên dùng).
  2. **FPT Khảo Thí Online — Cổng Ôn Luyện & Đề Thi Thử**: **SẮP RA MẮT**.
  3. **Safe Exam Browser (SEB) Toolkit & Hỗ Trợ Kỳ Thi**: **SẮP RA MẮT**.

---

## Past Milestones
- **v10.1.6**: Fixed regex URL stripping bug using Terser AST, verified 0 syntax errors, added universalRequest (GM_xmlhttpRequest + fetch) and local emergency solver.
- **v10.1.5**: Fixed Bookmarklet 404 & Dragging, Restored Turn-Based Chat State (v10.0.9 logic), 2-Stage Radial Submit clicker, Live Vision Screen Capture.
- **v10.1.4**: Real AI integration, user API key modal, dual submit button finding (.w-send-btn + Nộp câu trả lời).
- **v10.1.3**: 100% Auto-Submit targeted to 'Nộp câu trả lời', License Key Security Gate, MBBank STK & Discord Support info, Pure DOM.
- **v10.1.2**: Modal Draggable Button, Native Draggable Bookmarklet (dataTransfer URI-list/URL), Pure DOM (Zero innerHTML), Standalone Extension MV3.
- **v10.1.1**: Encrypted API Key Vault (`ENC_AES_...` & `ENC_FPT_...`) with `/api/v1/ai/encrypt-key` and in-memory auto-decryption.
- **v10.1.0**: Cloud AI Proxy & Encrypted Trial Guard (0 VND Free Trial 2 Hours, Single Submit Lock, Anti-429 Dual Interceptor).
