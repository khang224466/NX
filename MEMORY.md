# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.11 & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.11** (Tối ưu Cầu Nối AI Bridge: Khắc phục treo 32s do 503, ghi nhớ model chiến thắng Flash-Lite, lọc sạch Gemma/2.5 lỗi, Timeout 7.5s).
- **Core Breakthroughs in v10.2.11 (Zero-Hang AI Bridge + Winner Model Caching)**:
  1. **Khắc Phục Treo Nghẽn Mạng AI Bridge (Chấm dứt lỗi "Đang xử lý câu hỏi trước đó, tạm hoãn yêu cầu lặp...")**:
     - Phân tích log thực tế từ người dùng: Model `gemini-flash-latest` bị Google quá tải (HTTP 503) và treo fetch tới 32 giây, chặn đứng toàn bộ vòng lặp của Bridge.
     - Thêm cơ chế ngắt `AbortController` với thời gian chờ tối đa 7.5 giây: Nếu một model treo hoặc lỗi 503, tự động chuyển ngay sang model tiếp theo chỉ trong chớp mắt.
  2. **Ghi Nhớ Model Chiến Thắng (Preferred Model Caching)**:
     - Log thực tế chứng minh `gemini-flash-lite-latest` phản hồi siêu tốc chỉ trong 2 giây.
     - v10.2.11 bổ sung cơ chế lưu trữ `preferredModel`: Ngay khi một model trả lời thành công, model đó được lưu lại và luôn được gọi trực tiếp đầu tiên ở mọi câu hỏi tiếp theo, không phải quét qua các model lỗi nữa.
  3. **Lọc Bỏ Các Model Gây Lỗi 404 & 500**:
     - Loại bỏ các model `gemma` (không hỗ trợ Vision, gây HTTP 500) và `2.5` (gây HTTP 404).
     - Ưu tiên nhóm model Flash Vision tốc độ cao: `gemini-flash-lite-latest`, `gemini-2.0-flash-lite`, `gemini-1.5-flash`.
  4. **Quy Trình Tự Động Khép Kín Hoàn Thiện**:
     - Bật lên tự động gõ "Sẵn sàng" và bấm Nộp (track trúng nút icon bút chì góc phải).
     - Track câu hỏi bài tập mới xuất hiện và giải qua Gemini Vision.
     - Lặp lại liên tục cho tới khi báo hoàn thành bài học.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\rental_platform\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại (Focus EduNext)**:
  1. **FPT EduNext AI Assistant Pro (v10.2.11)**: **ĐANG HOẠT ĐỘNG CHÍNH THỨC**
     - Trải Nghiệm 2 Tiếng: **Miễn Phí (0₫)**.
     - 1 Tuần: **30.000₫**.
     - 1 Tháng: **69.000₫**.
     - 1 Kỳ Học (4 Tháng): **220.000₫** (Gói khuyên dùng).

---

## Past Milestones
- **v10.2.11**: Smart winner model caching (`gemini-flash-lite-latest`), filtered Gemma/2.5 models, added 7.5s abort timeout, eliminating AI Bridge 32s hang.
- **v10.2.10**: Closed-loop automation (Write 'Sẵn sàng' -> Track submit button -> Solve next question -> Loop until complete), unblocked footer submit button tracker, draggable/collapsible HUD.
- **v10.2.9**: Purged hardcoded regex solvers and traps, fixed auto-submit button detection (Toolbar 'Nộp câu trả lời' + Enter dual-dispatch), auto-submits prefilled textarea text.
- **v10.2.8**: Vision-Only model filtering (eliminated TTS 400 error), Flash priority ordering, and Concurrency lock (eliminated 429 rate limit).
- **v10.2.7**: Auto ListModels Discovery, Cloud AI fallback on 404, and Auto-click Ready button.
- **v10.2.6**: Official Zero-Script Bookmarklet Edition with auto AI Bridge connection and Instant Local Science Solvers.
- **v10.2.5**: Dual-Engine AI Bridge popup for Bookmarklet mode, Tampermonkey native bypass, and Instant Local Science Solvers.
- **v10.2.4**: Added Tampermonkey GM_xmlhttpRequest bridge to window/unsafeWindow and release v10.2.4.
- **v10.2.3**: Support new Google AI Studio Auth Key format AQ... in converter and decrypt engine.
- **v10.2.2**: Direct Google Gemini Studio Vision via GM_xmlhttpRequest, Encrypted Key Engine (`ENC_AI_...`), mandatory screen share & 5s auto-capture, Anti-Sẵn Sàng firewall, and radial submit button auto-click.
- **v10.2.1**: Encrypted key validation & trial guard improvements.
- **v10.2.0**: Added AI bridge & dual mode.
