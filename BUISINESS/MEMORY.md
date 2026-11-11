Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-11T17:22:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.31 - Multi-Layer True Gemini Key Extraction, Bridge HTTP 400 Elimination, Admin Mandatory Key Validation & Cloud AI Fallback)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.31**
- **Core Upgrades in v10.2.31**:
  1. **Giải Mã Đa Tầng Trích Xuất Master Gemini Key (Xóa Triệt Để Lỗi Google HTTP 400 `API key not valid`)**:
     - Cầu Nối `bridge.html` được trang bị thuật toán `extractTrueGeminiKey`: tự động mở gói giải mã tối đa 5 tầng `ENC_AI_` lồng nhau để trích xuất khóa API chuẩn `AIzaSy...` của Google AI Studio.
     - **Tường lửa chặn gửi nhầm mã mã hóa lên Google**: Nếu key truyền sang là chuỗi mã hóa `ENC_AI_...` hoặc không bắt đầu bằng `AIza`, Bridge **tuyệt đối không bao giờ** gửi lên Google Studio API (tránh bị Google từ chối lỗi `400 / 401 unauthenticated`).
     - Tự động chuyển thẳng sang Cloud AI Engine (`/api/v1/ai/solve`) với đầy đủ `licenseKey: rawKey`.

  2. **Bắt Buộc Cấu Hình Master Gemini API Key Khi Admin Duyệt Đơn**:
     - Trang Quản trị `/admin` gắn cờ báo động đỏ nổi bật khi Admin chưa nhập Master Key, kèm nút 1-click `[+ Lấy Key Miễn Phí (Google Studio)]` dẫn thẳng tới `https://aistudio.google.com/app/apikey`.
     - Khi Admin bấm `[Duyệt & Cấp Key]` hoặc Duyệt nhanh: Nếu chưa có key `AIzaSy...`, hệ thống lập tức mở hộp thoại yêu cầu Admin dán Key Gemini chuẩn.
     - Kiểm tra định dạng nghiêm ngặt: Ngăn chặn nhập nhầm Access Token `AQ.` hay token lạ. Key hợp lệ được tự động lưu vào trình duyệt của Admin và nhúng vào License cấp cho học sinh.

  3. **Nâng Cấp Toàn Diện Cloud AI Solver (`/api/v1/ai/solve`) & Multi-Model Fallback**:
     - Hỗ trợ giải mã tự động `ENC_AI_` ngay trên server Vercel nếu khách hàng gửi `licenseKey` qua Cloud.
     - Cơ chế Multi-Model Fallback thông minh: thử tuần tự `gemini-flash-lite-latest` $\rightarrow$ `gemini-2.0-flash-lite` $\rightarrow$ `gemini-1.5-flash` $\rightarrow$ `gemini-2.0-flash`.
     - Tích hợp bộ heuristic solver giải bài hóa học/toán học offline khi mạng AI gián đoạn.

  4. **Cập Nhật Đồng Bộ Mã Nguồn Bookmarklet v10.2.31**:
     - Đồng bộ toàn diện: `public/keo_bookmark.html`, `src/lib/utils.ts` (`RAW_FN_BASE64`), `src/app/inject.js/route.ts`, `src/app/edunext.user.js/route.ts`.
     - Quản lý hạn mức chuẩn xác: 3 bài / tuần cho mọi môn học và mọi gói bản quyền.
     - Giao diện HUD 100% không lộ key thô (zero-leak), tự hủy khi hết hạn.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
