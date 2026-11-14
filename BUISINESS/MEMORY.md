Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-14T08:33:30+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.50 PRO - Full Rich Admin Dashboard Restored, 35s Countdown Timer UI, Auto-Solve Loop)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.50 PRO**
- **Core Upgrades in v10.2.50 PRO**:
  1. **Khôi Phục Hoàn Chỉnh Toàn Bộ Giao Diện Quản Trị Đỉnh Cao**:
     - Khôi phục trọn vẹn 100% giao diện đẹp mắt (Master Gemini Key config box, link lấy key Google Studio miễn phí, 4 thẻ thống kê doanh thu, khách hàng, đơn chờ duyệt).
     - Bảng duyệt đơn trực tiếp theo thời gian thực (0ms qua BroadcastChannel & Polling), nút Duyệt nhanh bằng mã CK.
     - Bảng theo dõi hạn dùng & cảnh báo key tự hủy với bộ lọc: Tất cả, Sắp hết hạn, Còn hạn, Đã tự hủy, kèm nút gia hạn nhanh +7 ngày, +30 ngày, +1 kỳ.
     - Bộ tạo key bản quyền thủ công & Bookmarklet 1-click (hỗ trợ cả FPT1. và ENC_AI_).
     - Nút Xóa trắng đơn hàng (DELETE route) & Đăng xuất an toàn.
     - Tự động ghi nhớ phiên đăng nhập qua sessionStorage/localStorage để admin không phải gõ lại mật mã.
  2. **Mật Mã Quản Trị Mặc Định**:
     - Mật mã: **`admin123`** (hoặc `fptadmin` hoặc `ADMIN_ACCESS_TOKEN` trên Vercel nếu có cài).
  3. **Bộ đếm ngược 35s trực quan & Tự dừng khi xong bài**:
     - Subtitle hiển thị badge màu vàng: `(35s)` -> `(34s)` -> ... -> `(1s)` -> reset 35s.
     - Nút Auto hiển thị đồng bộ: `⚡ Auto: 35s` -> `⚡ Auto: 1s`.
     - Tự động gọi chu kỳ giải mỗi 35 giây (thay vì 3s).
     - Khi bài học hoàn tất ("Hoàn thành buổi học"): tự động dừng và hiển thị `✅ Hoàn thành`.
  4. **Trang Kéo Bookmarklet Trực Tiếp**:
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
