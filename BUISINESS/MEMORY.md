Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-14T08:26:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.50 - 35s Countdown Timer UI, Auto-Solve Loop, Admin Passcode & Drag Bookmarklet)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.50**
- **Core Upgrades in v10.2.50**:
  1. **Bộ đếm ngược 35s trực quan**:
     - Subtitle hiển thị badge màu vàng: `(35s)` -> `(34s)` -> ... -> `(1s)` -> reset 35s.
     - Nút Auto hiển thị đồng bộ: `⚡ Auto: 35s` -> `⚡ Auto: 1s`.
     - Tự động gọi chu kỳ giải mỗi 35 giây (thay vì 3s).
     - Khi bài học hoàn tất ("Hoàn thành buổi học"): tự động dừng và hiển thị `✅ Hoàn thành`.
  2. **Trang Quản Trị /admin & Mật Mã Quản Trị**:
     - Mật mã quản trị mặc định: **`admin123`** (hoặc chuỗi trong biến môi trường `ADMIN_ACCESS_TOKEN` trên Vercel nếu có cài).
     - Loại bỏ việc khóa người dùng khi chưa cấu hình biến môi trường trên Vercel.
     - Hệ thống lưu trữ đơn hàng có in-memory fallback nếu chưa cấu hình Redis, chống lỗi 503 hoàn toàn.
  3. **Trang Kéo Bookmarklet Trực Tiếp**:
     - URL: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
     - Nút kéo xanh trực tiếp nạp sẵn mã bookmarklet v10.2.50, kèm nút 1-click sao chép vào bộ nhớ đệm.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin` (Mật mã đăng nhập: `admin123`)
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
