Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-11T18:50:20+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.33 - Eliminate Admin Blocking Prompts, Auto-Unwrap ENC_AI Keys, 1-Click Order Approval)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.33**
- **Core Upgrades in v10.2.33**:
  1. **Xóa Bỏ Triệt Để Hộp Thoại Bắt Nhập Key Gây Khó Chịu & Lỗi Chặn `ENC_AI_`**:
     - Đã gỡ bỏ 100% `window.prompt` và popup cảnh báo `❌ Lỗi định dạng Key: Key "ENC_AI_M..." không hợp lệ!`.
     - Giờ đây Admin bấm **[Duyệt & Cấp Key]** là hệ thống duyệt ngay lập tức (1-click approve), không hỏi han lằng nhằng, không chặn bất kỳ định dạng nào.

  2. **Tự Động Mở Gói (Auto-Unwrap) Key Mã Hóa `ENC_AI_`**:
     - Nếu Admin dán mã `ENC_AI_...` vào ô Master Key hoặc duyệt đơn: Hệ thống tự động bóc tách (unwrap) để lấy khóa Google Gemini ẩn bên trong (`AIza...` hoặc `AQ....`).
     - Nếu không có key nhúng bên trong: Hệ thống vẫn chấp nhận bình thường và tự động sử dụng Cloud AI Engine (`process.env.GEMINI_API_KEY`) trên Vercel để phục vụ học sinh.

  3. **Giao Diện Admin Thân Thiện & Linh Hoạt**:
     - Hộp Master Gemini Key hiển thị trạng thái linh hoạt: Nhận cả `AIza...`, `AQ....`, `ENC_AI_...` hoặc trạng thái mặc định `⚡ Cloud AI Server`.
     - Không bao giờ hiện thanh cảnh báo màu đỏ hay amber làm Admin bối rối.

  4. **Cập Nhật Toàn Bộ Hệ Thống Bookmarklet & Server Lên v10.2.33**:
     - Đồng bộ toàn diện: `public/keo_bookmark.html`, `src/lib/utils.ts` (`RAW_FN_BASE64`), `src/app/inject.js/route.ts`, `src/app/edunext.user.js/route.ts`, `public/bridge.html`, `src/app/api/v1/ai/solve/route.ts`.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
