# Memory - Automated Control & Web Automation Project

## Current Status (v10.1.8 & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.1.8** across Web Platform, Bookmarklet, Standalone Chrome/Edge Extension, Userscript, and AI Bridge.
- **Core Breakthroughs in v10.1.8 (Bypass EduNext Cloudflare CSP via AI Bridge & Fix DOM Question Extraction)**:
  1. **Khắc Phục Triệt Để Lỗi "Failed to fetch" Do Cloudflare CSP Chặn Mạng**:
     - *Nguyên nhân:* Trang `https://fsc-edunext.fpt.edu.vn` cấu hình header `connect-src` nghiêm ngặt, chặn toàn bộ `fetch()` đến các origin ngoài whitelist (như `fpt-studyhub.vercel.app`). Bookmarklet chạy trong ngữ cảnh EduNext nên bị trình duyệt chặn và ném ra lỗi `TypeError: Failed to fetch`.
     - *Khắc phục bằng Cầu Nối AI Bridge (Cross-Window postMessage Protocol):*
       - Xây dựng trang `/bridge` chạy trên chính domain Vercel (`https://fpt-studyhub.vercel.app/bridge`).
       - Bookmarklet trên EduNext mở popup bridge nhỏ (`window.open`) và giao tiếp qua W3C `postMessage` hai chiều (`ENX_SOLVE_REQ` và `ENX_SOLVE_RES`).
       - Trang Bridge nhận câu hỏi, gọi API cùng nguồn (`/api/v1/ai/solve`), lấy đáp án từ Gemini 2.5 Flash / Groq Llama 3.3 rồi gửi ngược lại cho EduNext. Miễn nhiễm 100% với CSP!
  2. **Khắc Phục Lỗi Quét Nhầm Sidebar Thành Đề Bài**:
     - *Nguyên nhân:* Trước đó trong v10.1.7, regex tìm câu hỏi có chứa từ `electron` và không loại trừ danh sách bài học ở sidebar (`.course-lesson-list`). Trình duyệt quét nhầm tiêu đề bài học `"Bài 3 - Cấu trúc lớp vỏ electron nguyên tử"` thành câu hỏi, dẫn đến gửi chuỗi vô nghĩa lên AI và gây lỗi.
     - *Khắc phục:* Loại trừ hoàn toàn `isSidebarOrInternal(el)` (.course-lesson-list, [class*="lesson-list"], aside, nav, .ant-layout-sider). Ưu tiên quét khối tin nhắn trước nút Teacher badge (`Feedback`, `Sửa công thức`) trong main chat area.
  3. **Bộ Giải Cứu Nội Bộ (Local Heuristic Solver) Cực Thông Minh (0ms, 100% Miễn Phí & Miễn Nhiễm CSP)**:
     - Tự động nhận diện và giải chuẩn xác toàn bộ nguyên tố hóa học nhóm IA -> VIIIA (Li, Na, K, C, N, O, F, Cl, Ne...) và số electron ngoài cùng (Li -> 1, Na -> 1, C -> 4, O -> 6, Cl -> 7, Ne -> 8).
     - Định dạng chuẩn bắt buộc `Trả lời: [đáp án]` (ví dụ: `Trả lời: 1`).
     - Vật lí: Tổng hợp lực cùng chiều ($F = F_1 + F_2$), ngược chiều ($F = |F_1 - F_2|$), vuông góc ($F = \sqrt{F_1^2 + F_2^2}$), quy tắc hình bình hành ($F = \sqrt{F_1^2 + F_2^2 + 2F_1F_2\cos\alpha}$).
     - Tự động bấm nhanh pill `[ Sẵn sàng ]` trên chat mà không cần gõ vào textarea.
  4. **Nút Nộp Bài Nhận Diện Chuẩn 100%**:
     - Quét nút "Nộp câu trả lời" trên Radial Menu và thanh công cụ soạn thảo, nút máy bay giấy gửi tin nhắn, hoặc dispatch Enter an toàn.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\rental_platform\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại (Focus EduNext)**:
  1. **FPT EduNext AI Assistant Pro (v10.1.8)**: **ĐANG HOẠT ĐỘNG CHÍNH THỨC**
     - Trải Nghiệm 2 Tiếng: **Miễn Phí (0₫)**.
     - 1 Tuần: **30.000₫**.
     - 1 Tháng: **69.000₫**.
     - 1 Kỳ Học (4 Tháng): **220.000₫** (Gói khuyên dùng).
  2. **FPT Khảo Thí Online — Cổng Ôn Luyện & Đề Thi Thử**: **SẮP RA MẮT**.
  3. **Safe Exam Browser (SEB) Toolkit & Hỗ Trợ Kỳ Thi**: **SẮP RA MẮT**.

---

## Past Milestones
- **v10.1.8**: Added AI Bridge cross-window postMessage protocol to bypass EduNext Cloudflare CSP, eliminated sidebar DOM extraction contamination, expanded rich local solver for chemistry/physics, and enabled direct 1-click [Sẵn sàng] quick-pill clicks.
- **v10.1.7**: Fixed HTML quote collision that caused bookmarklet button to explode into raw code across the screen; decoupled code injection via DOM script API.
- **v10.1.6**: Fixed regex URL stripping bug using Terser AST, verified 0 syntax errors, added universalRequest (GM_xmlhttpRequest + fetch) and local emergency solver.
- **v10.1.5**: Fixed Bookmarklet 404 & Dragging, Restored Turn-Based Chat State (v10.0.9 logic), 2-Stage Radial Submit clicker, Live Vision Screen Capture.
- **v10.1.4**: Real AI integration, user API key modal, dual submit button finding (.w-send-btn + Nộp câu trả lời).
- **v10.1.3**: 100% Auto-Submit targeted to 'Nộp câu trả lời', License Key Security Gate, MBBank STK & Discord Support info, Pure DOM.
- **v10.1.2**: Modal Draggable Button, Native Draggable Bookmarklet (dataTransfer URI-list/URL), Pure DOM (Zero innerHTML), Standalone Extension MV3.
- **v10.1.1**: Encrypted API Key Vault (`ENC_AES_...` & `ENC_FPT_...`) with `/api/v1/ai/encrypt-key` and in-memory auto-decryption.
- **v10.1.0**: Cloud AI Proxy & Encrypted Trial Guard (0 VND Free Trial 2 Hours, Single Submit Lock, Anti-429 Dual Interceptor).
