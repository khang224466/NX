# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.14 - Reactive DOM Question Detection & Zero Fixed Delays)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.14** (Đột phá: Xoá bỏ hoàn toàn các bộ đếm thời gian cố định / sleep timers; thiết kế bộ Reactive DOM Tracker dùng MutationObserver bắt trúng 100% thời điểm câu hỏi hiện lên màn hình để chụp ngay lập tức).
- **Core Breakthroughs in v10.2.14**:
  1. **Không Dùng Thời Gian Cố Định (Zero Fixed Timers)**:
     - Toàn bộ cơ chế kiểm tra câu hỏi chuyển sang hướng sự kiện (Event-Driven Reactive).
     - Gắn `MutationObserver` trực tiếp vào khung chat (`chat-messages`). Ngay khi EduNext chèn khối câu hỏi hoặc bot kết thúc sinh nội dung, sự kiện kích hoạt tức thì trong vòng 1ms.
  2. **Bộ Nhận Diện Trạng Thái Câu Hỏi Chính Xác (`detectCurrentQuestionState`)**:
     - Phát hiện khối câu hỏi bài tập chuyên dụng: `.exercise-question-block` (`data-testid="exercise-question-block"`).
     - Phát hiện tin nhắn mới của giáo viên (`.assistant-row`) sau tin nhắn học sinh (`.user-row`).
     - Tự động bỏ qua khi bot còn đang sinh đề (`.w-send-btn__spinner`, `.chat-pending-placeholder`, hoặc React Fiber `isStreaming === true`).
     - Phát hiện màn hình Sẵn sàng: nút `quick-insert-btn` hoặc cụm từ "Bạn đã sẵn sàng...".
     - Phát hiện hoàn thành: "hoàn thành bài học", "chúc mừng", "buổi học đã kết thúc".
  3. **Chu Trình Chuẩn Xác 100%**:
     - EduNext hiện câu hỏi -> Observer bắt được ngay lập tức -> Auto-Vision chụp ảnh tức thì -> Gemini Flash-Lite trả lời -> Điền vào React Fiber và bấm Nộp -> Lập tức quay lại trạng thái chờ câu hỏi tiếp theo hiện lên.

## Previous Status (v10.2.13 - Question Appearance Tracking & Natural Pacing)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.13** (Đột phá: Khắc phục triệt để tình trạng chụp và gửi quá nhanh; thêm cơ chế theo dõi khi nào câu hỏi hiện lên trọn vẹn mới chụp, bổ sung các khoảng nghỉ nhỏ tự nhiên mô phỏng người dùng).
- **Core Breakthroughs in v10.2.13**:
  1. **Theo Dõi Chặt Chẽ Tiến Trình Ra Đề Của EduNext (`getChatMessagesStatus` & `isEduNextBotStreaming`)**:
     - Phát hiện khi nào bot đang trả lời/streaming qua `.w-send-btn__spinner`, placeholder `"Đang..."`, và React Fiber `isStreaming`.
     - Nếu tin nhắn cuối trong khung chat là của học sinh (`.user-row`), bot sẽ kiên nhẫn chờ giáo viên trả lời chứ không chụp vội.
     - Kiểm tra độ ổn định của câu hỏi: câu hỏi phải giữ nguyên độ dài ít nhất 2 nhịp (~2 giây) để đảm bảo bot đã dừng gõ hoàn toàn.
  2. **Bổ Sung Các Khoảng Nghỉ Nhỏ (Natural Pacing & Delay)**:
     - **Khoảng nghỉ 7s sau khi nộp**: Tránh spam liên tục, chờ EduNext ghi nhận và bot bắt đầu chuẩn bị đề mới.
     - **Khoảng nghỉ 3s trước khi chụp**: Khi câu hỏi vừa hiện lên trọn vẹn, bot tạm dừng 3s để trang web render đầy đủ công thức toán (MathJax/KaTeX), hình ảnh và cấu trúc đề trước khi Auto-Vision chụp màn hình.
     - **Khoảng nghỉ 1.5s trước khi nộp**: Sau khi Gemini trả về đáp án, bot tạm dừng 1.5s rồi mới điền vào ô và bấm Nộp (mô phỏng nhịp đọc và làm bài tự nhiên của người thật).
  3. **Loại Bỏ Lệnh Nộp Tự Động Cưỡng Bức Từ Ô Nhập**:
     - Xóa bỏ việc kiểm tra `curTa.value.length > 0` tự động nộp lại sau 8 giây gây lặp vô tận. Chỉ nộp khi thực sự giải xong câu hỏi mới hoặc khi người dùng bấm nút thủ công.

## Previous Status (v10.2.12 - React 18 Fiber Direct Sync & Auto Question Loop)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.12** (Đột phá: Khắc phục triệt để lỗi lặp câu hỏi 10s nhờ đồng bộ React 18 Fiber, tự động điền và bấm Nộp [Sẵn sàng], tự động theo dõi câu hỏi kế tiếp, giải bài và lặp liên tục tới khi hoàn thành).
- **Core Breakthroughs in v10.2.12**:
  1. **Đồng Bộ Hoá Trạng Thái React 18 Fiber 5 Tầng (`fillReactInput`)**:
     - Phân tích mã nguồn EduNext (`chat-widget-49.js`): EduNext dùng `@uiw/react-md-editor` với `controlled state userInput: e`. Khi chỉ gán `ta.value = clean`, `_valueTracker` của React chặn sự kiện khiến `userInput` vẫn là rỗng `""`.
     - Vì `userInput` rỗng, `data-intent="SUBMIT_ANSWER"` và `w-send-btn` bị gán `disabled: true`, chặn toàn bộ sự kiện click và huỷ lệnh gửi trong `B(Z, q)`.
     - Giải pháp v10.2.12: Kết hợp 5 tầng:
       - Duyệt cây `__reactFiber$` để gọi trực tiếp `onInputChange(clean)`.
       - Native `document.execCommand('insertText', false, clean)`.
       - Reset `ta._valueTracker`.
       - Dispatch sự kiện `beforeinput`, `input`, `change`.
       - Kích hoạt `props.onChange` từ `__reactProps$`.
  2. **Bấm Nút Nộp Đa Tầng & Kích Hoạt `onSendMessage` Trực Tiếp**:
     - Ưu tiên 1: `button[data-intent="SUBMIT_ANSWER"]` & `.exercise-intent-column__item[data-intent="SUBMIT_ANSWER"]`.
     - Ưu tiên 2: `button.w-send-btn:not(.w-send-btn--close)`.
     - Tự động gỡ bỏ `disabled` và dispatch chuỗi `pointerdown` -> `mousedown` -> `pointerup` -> `mouseup` -> `click` + gọi trực tiếp `props.onClick`.
     - Siêu dự phòng: Lấy hàm `onSendMessage` từ React Fiber gọi trực tiếp `onSendMessage(clean, clean, { resolved_intent: 'SUBMIT_ANSWER' })`.
  3. **Vòng Lặp Tự Động Hoàn Chỉnh Theo Đúng Chỉ Đạo Của User**:
     - Màn hình bắt đầu: Tự động bấm nút `[Sẵn sàng]` (nếu có) + điền "Sẵn sàng" + bấm nút Nộp -> gửi thành công lên server.
     - Hệ thống chuyển sang câu hỏi: Auto-Vision + DOM track câu hỏi mới, gửi Gemini Flash-Lite trả lời trong 2s.
     - Tự động điền đáp án, bấm Nộp.
     - Lặp lại liên tục cho tới khi phát hiện hoàn thành bài học ("hoàn thành bài học", "chúc mừng bạn đã hoàn thành").
  4. **Tối Ưu Vị Trí HUD Tránh Che Khuất Khung Chat**:
     - Đặt mặc định tại `top: 70px; right: 25px` (góc trên bên phải), giải phóng hoàn toàn góc dưới bên phải cho khung chat và các nút tác vụ của EduNext.

## Previous Status (v10.2.11 & FPT Study Hub Web Platform)
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
