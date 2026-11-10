# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.10 & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.10** (Vòng lặp tự động khép kín: Điền Sẵn sàng ➔ Track nút Nộp ➔ Giải câu hỏi ➔ Lặp lại tới khi Hoàn thành).
- **Core Breakthroughs in v10.2.10 (Autonomous Closed Loop + Unblocked Submit Tracker)**:
  1. **Khởi Động Tự Động Điền & Nộp "Sẵn sàng" ("khi bật lên, viết sẵn sàng, track nút nộp rồi bấm nộp")**:
     - Phát hiện màn hình tóm tắt / bắt đầu buổi học (có chữ "Bạn đã sẵn sàng chuyển sang phần tiếp theo chưa?" hoặc nút `[Sẵn sàng]`).
     - Tự động điền "Sẵn sàng" vào textarea với React prototype setters, đồng thời click đồng bộ nút `[Sẵn sàng]` trên EduNext.
     - Lập tức track nút `Nộp câu trả lời` và click nộp bài chỉ trong < 300ms.
  2. **Track Nút Nộp Bài Siêu Chuẩn (Unblocked Submit Button Tracker)**:
     - Sửa triệt để bug `isSidebarOrInternal`: Loại bỏ việc loại trừ `.chat-footer` và `toolbar`, cho phép tìm thấy 100% nút `Nộp câu trả lời` (icon bút chì) nằm ở góc dưới cùng bên phải ô input.
     - Tìm kiếm đa tầng có chấm điểm: `data-intent="SUBMIT_ANSWER"`, văn bản/aria/title `Nộp câu trả lời`, menu radial, `w-send-btn`, và các nút trong footer (loại trừ nút Text, Math).
     - Kích hoạt chuỗi sự kiện click hoàn chỉnh (`pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`) kết hợp phím tắt `Ctrl+Enter` và `Enter`.
  3. **Tự Động Track Câu Hỏi Tiếp Theo & Giải Bằng Gemini Flash Vision**:
     - Sau khi nộp "Sẵn sàng", hệ thống tự động track câu hỏi bài tập mới xuất hiện từ giáo viên (qua Vision chụp màn hình + trích xuất DOM).
     - Gửi yêu cầu tới Gemini Flash Vision để giải chính xác và điền đáp án (ví dụ `Trả lời: [đáp án]`).
     - Tiếp tục bấm nộp bài tự động.
  4. **Lặp Lại Liên Tục Tới Khi Hoàn Thành ("rồi lặp lại tới khi nó hiện hoàn thành")**:
     - Tự động theo dõi các câu hỏi 2, 3, 4,... và giải tuần tự.
     - Tự động nhận diện tín hiệu kết thúc ("hoàn thành bài học", "chúc mừng bạn đã hoàn thành", "buổi học đã kết thúc", `__LESSON_COMPLETE__`).
     - Khi hoàn thành: Báo thành công `🎉 ĐÃ HOÀN THÀNH TOÀN BỘ BÀI HỌC!`, tự động tắt chế độ Auto để kết thúc phiên học an toàn.
  5. **HUD Kéo Thả & Thu Nhỏ Linh Hoạt**:
     - HUD có thể kéo thả di chuyển (`onmousedown` ở header) để không che khuất bất kỳ nút nào trên màn hình EduNext.
     - Thêm nút thu nhỏ (`─`) để ẩn gọn gàng khi cần quan sát toàn bộ trang.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\rental_platform\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại (Focus EduNext)**:
  1. **FPT EduNext AI Assistant Pro (v10.2.10)**: **ĐANG HOẠT ĐỘNG CHÍNH THỨC**
     - Trải Nghiệm 2 Tiếng: **Miễn Phí (0₫)**.
     - 1 Tuần: **30.000₫**.
     - 1 Tháng: **69.000₫**.
     - 1 Kỳ Học (4 Tháng): **220.000₫** (Gói khuyên dùng).

---

## Past Milestones
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
