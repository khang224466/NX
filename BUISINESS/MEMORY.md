# Memory - Automated Control & Web Automation Project

## Current Status (v10.1.5 & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.1.5** across Web Platform, Bookmarklet, Standalone Chrome/Edge Extension, and Userscript.
- **Core Breakthroughs in v10.1.5 (Intelligent Chat State, Screen Share Vision, Real AI Solver, 2-Stage Radial Submit & Zero-Newline Drag)**:
  1. **Khắc Phục Triệt Để Lỗi 404 & Lỗi Kéo Bookmark Không Chạy ("có kéo cái con mẹ gì đâu")**:
     - *Nguyên nhân:* Trước đây mã `javascript:...` trong thuộc tính `href` chứa nhiều ký tự xuống dòng (`\n`). Khi kéo thả lên thanh Bookmark, trình duyệt Chromium (Chrome/Edge/Brave) chiếu theo RFC 2483 phân tách `text/uri-list` theo từng dòng, biến dòng đầu thành URL không hợp lệ và rơi vào cơ chế kéo HTML toàn trang (`<!DOCTYPE html>...`) vào thanh địa chỉ gây lỗi `404 This page could not be found`.
     - *Khắc phục:* Minify toàn bộ hàm JavaScript thành một chuỗi duy nhất trên 1 dòng duy nhất (`Has newline: false`, 28,200 ký tự). Dùng chuột kéo nút xanh thả lên thanh Bookmark mượt mà 100%. Bổ sung nút "📋 Bấm Vào Đây Để Sao Chép Mã" dành cho người dùng không muốn kéo thả.
  2. **Khôi Phục Logic Thông Minh Của Code Cũ (v10.0.9) — Xóa Bỏ Hoàn Toàn Luồng Cứng**:
     - Áp dụng cấu trúc `getLatestChatState()`: So sánh vị trí badge `"Học sinh"` và badge của giáo viên (`"Feedback"`, `"Sửa công thức"`, `"đã chấm bằng ai"`, `"INT:..."`).
     - Khi học sinh đã gửi bài và học sinh nằm sau giáo viên -> Chuyển sang trạng thái `waiting_teacher` ("Đang chờ giáo viên/AI chấm bài..."). Tuyệt đối KHÔNG gửi lại, không điền đè "Sẵn sàng".
     - Chỉ khi giáo viên ra câu hỏi mới hoặc bài tập mới (`student_turn`) mới tiến hành giải và nộp bài.
  3. **Bộ Nộp Bài 2 Giai Đoạn (Two-Stage Radial Submit)**:
     - Giai đoạn 1: Mở Radial Menu bằng cách click `.w-send-btn` hoặc `.exercise-intent-radial__trigger` nếu menu đang đóng.
     - Giai đoạn 2: Quét chính xác mục `.exercise-intent-radial__item` chứa nhãn `"Nộp câu trả lời"` (icon cây bút) và mô phỏng chuỗi sự kiện chuột toàn diện (`pointerdown`, `mousedown`, `pointerup`, `mouseup`, `click`).
     - Khóa cứng Single Submit Guard chống bão 429 và spam click.
  4. **Tích Hợp Toàn Diện AI Thật & Chia Sẻ Màn Hình (Vision AI)**:
     - Cho phép chia sẻ màn hình trực tiếp bằng `navigator.mediaDevices.getDisplayMedia` để chụp lại công thức, bảng biểu, đồ thị (VD: Bảng 6.1 hóa học, hình tổng hợp lực vật lí).
     - Kết nối trực tiếp: Google Gemini 2.5 Flash (`AIza...`), Groq Llama 3.3 70B (`gsk_...`), hoặc Cloud AI Proxy (`https://fpt-studyhub.vercel.app/api/v1/ai/solve`).
     - Tự động định dạng `Trả lời: [đáp án]` khi câu hỏi yêu cầu theo mẫu.
  5. **Bảo Mật Key, STK MBBank & Discord**:
     - Modal cấu hình Key riêng biệt, hỗ trợ nạp key Gemini/Groq/License.
     - STK MBBank: `0987654321` (Chủ TK: `VO TRI KHANG`).
     - Discord Admin: `https://discord.com/users/888713971161505832`.
  6. **100% Pure DOM (Zero innerHTML)**:
     - Kháng 100% Cloudflare Trusted Types CSP trên EduNext LMS.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\rental_platform\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại (Focus EduNext)**:
  1. **FPT EduNext AI Assistant Pro (v10.1.5)**: **ĐANG HOẠT ĐỘNG CHÍNH THỨC**
     - Trải Nghiệm 2 Tiếng: **Miễn Phí (0₫)**.
     - 1 Tuần: **30.000₫**.
     - 1 Tháng: **69.000₫**.
     - 1 Kỳ Học (4 Tháng): **220.000₫** (Gói khuyên dùng).
  2. **FPT Khảo Thí Online — Cổng Ôn Luyện & Đề Thi Thử**: **SẮP RA MẮT**.
  3. **Safe Exam Browser (SEB) Toolkit & Hỗ Trợ Kỳ Thi**: **SẮP RA MẮT**.

---

## Past Milestones
- **v10.1.5**: Fixed Bookmarklet 404 & Dragging, Restored Turn-Based Chat State (v10.0.9 logic), 2-Stage Radial Submit clicker, Live Vision Screen Capture, Multi-AI Dispatch (Gemini/Groq/Proxy).
- **v10.1.4**: Real AI integration, user API key modal, dual submit button finding (.w-send-btn + Nộp câu trả lời).
- **v10.1.3**: 100% Auto-Submit targeted to 'Nộp câu trả lời', License Key Security Gate, MBBank STK & Discord Support info, Pure DOM.
- **v10.1.2**: Modal Draggable Button, Native Draggable Bookmarklet (dataTransfer URI-list/URL), Pure DOM (Zero innerHTML), Standalone Extension MV3.
- **v10.1.1**: Encrypted API Key Vault (`ENC_AES_...` & `ENC_FPT_...`) with `/api/v1/ai/encrypt-key` and in-memory auto-decryption.
- **v10.1.0**: Cloud AI Proxy & Encrypted Trial Guard (0 VND Free Trial 2 Hours, Single Submit Lock, Anti-429 Dual Interceptor).
