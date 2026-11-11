Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-11T16:11:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.29 - Realtime Cross-Page Order Sync, Cloud Store Auto-Upsert, Gemini Key Validation & Purged Legacy Scripts)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.29**
- **Core Upgrades in v10.2.29**:
  1. **Đồng Bộ Tuyệt Đối 100% Giữa Web Khách Hàng (`/`) & Web Quản Trị Admin (`/admin`)**:
     - Khắc phục triệt để lỗi phân mảnh mã đơn (`ORD-xxxx`) và mã chuyển khoản (`PRxxxx`) giữa Client và Server:
       - Client và Server sử dụng chung 1 bộ mã `orderId` và `transferCode` duy nhất ngay từ khoảnh khắc mở modal thanh toán.
       - Không còn hiện tượng khách thấy mã này (`PR1702`), Admin lại thấy mã khác (`PR7874`).
     - Khi khách hàng bấm **"Tôi Đã Chuyển Khoản — Báo Admin Duyệt Ngay"**:
       - Trạng thái `waiting_approval` lập tức được đồng bộ lên Cloud Database (`api.restful-api.dev`).
       - Trang Admin (`/admin`) polling mỗi 2 giây nhận diện ngay đơn mới, hiển thị nhấp nháy huy hiệu vàng `[Chờ Admin Duyệt]`.
     - Khi Admin bấm **`[Duyệt & Cấp Key]`** (hoặc gõ mã CK vào ô duyệt nhanh):
       - Hệ thống tự động sinh License Key chuẩn hạn (7 ngày / 30 ngày / 120 ngày) kèm thời điểm hết hạn `expiresAt`.
       - Khách hàng đang mở modal thanh toán lập tức nhận tín hiệu `approved` $\rightarrow$ Nổ pháo hoa Confetti $\rightarrow$ Chuyển thẳng sang trang `/keo_bookmark.html?key=ENC_AI_...` đã nạp sẵn key bản quyền 100%.

  2. **Cảnh Báo Trực Quan Định Dạng Master Gemini API Key Cho Admin**:
     - Key Google Gemini hợp lệ từ Google AI Studio bắt buộc phải bắt đầu bằng **`AIzaSy...`** (39 ký tự).
     - Hệ thống tự động kiểm tra cú pháp trên `/admin`: Nếu Admin nhập token lạ (như `AQ.Ab8RN6I0...`), hệ thống hiển thị cảnh báo đỏ/vàng kèm đường dẫn lấy key miễn phí tại `https://aistudio.google.com/app/apikey`.

  3. **Nâng Cấp Cầu Nối AI Bridge Lên v10.2.29 & Ngăn Chặn Lặp Lỗi 400**:
     - Đồng bộ cả `public/bridge.html` và `src/app/bridge/page.tsx` lên **`v10.2.29`**.
     - Nếu Google trả về `HTTP 400: API key not valid`, Bridge ngắt ngay vòng lặp model, in thông báo tiếng Việt hướng dẫn Admin nạp lại key chuẩn `AIza...`, ngăn chặn việc spam gọi 6 model gây nghẽn kết nối.

  4. **Dọn Sạch Triệt Để Toàn Bộ Luồng Cũ & File Cũ Rác (Xóa Luồng Cũ)**:
     - Đã xóa sạch 25 file `.user.js` cũ từ `v10.1.0` tới `v10.2.14` trong `public/`.
     - Loại bỏ các file txt cũ, giữ lại cấu trúc gọn gàng, tối ưu tốc độ build trên Vercel.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
