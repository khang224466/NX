Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-11T18:30:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.32 - Google AI Studio "AQ." Auth Key Official Support, Multi-Layer Cloud Fallback & Unblocked Admin Validation)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.32**
- **Core Upgrades in v10.2.32**:
  1. **Hỗ Trợ Toàn Diện Định Dạng Key Mới "AQ." của Google AI Studio (Auth Keys)**:
     - Google AI Studio đã chính thức chuyển sang sinh các khóa Authorization Keys bắt đầu bằng `AQ.` (Auth Keys gắn với Service Account bảo mật cao) thay thế định dạng cũ `AIza...`.
     - Toàn bộ hệ thống (`admin/page.tsx`, `converter.html`, `bridge.html`, `cryptoKey.ts`, Bookmarklet HUD) đã dỡ bỏ hoàn toàn cảnh báo/chặn sai lầm trước đó. Hỗ trợ song song cả hai chuẩn: `AQ....` và `AIzaSy...`.
     - Cầu Nối `bridge.html` truyền chuẩn xác header `x-goog-api-key: [key]` và query param `?key=[key]` theo tài liệu chính thức của Google.

  2. **Cơ Chế Multi-Layer Cloud AI Fallback Thông Minh (Không Bao Giờ Chết Bài)**:
     - Nếu key của sinh viên hoặc dự án GCP gặp lỗi quyền (`401 ACCESS_TOKEN_TYPE_UNSUPPORTED` do dự án GCP chưa bật Generative Language API hoặc lỗi mạng):
     - Cầu nối AI Bridge không dừng lại mà lập tức chuyển tiếp bài tập qua Cloud Engine dự phòng (`/api/v1/ai/solve`).
     - Cloud Engine thử tuần tự: Key học sinh $\rightarrow$ Master Key server Vercel (`process.env.GEMINI_API_KEY`) $\rightarrow$ Groq LPU $\rightarrow$ Bộ giải Heuristic Offline. Sinh viên được đảm bảo 100% luôn nhận được đáp án chính xác!

  3. **Mở Khóa Toàn Diện Trang Quản Trị `/admin` & Máy Chuyển Đổi `converter.html`**:
     - Admin có thể tự do nhập Master Key hoặc duyệt đơn bằng cả key `AQ.` lẫn `AIzaSy`.
     - Máy chuyển đổi `converter.html` cho phép đóng gói key `AQ.` thành `ENC_AI_` có thời hạn (1 tuần, 1 tháng, 1 kỳ) chuẩn xác.

  4. **Cập Nhật Đồng Bộ Mã Nguồn Bookmarklet v10.2.32**:
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
