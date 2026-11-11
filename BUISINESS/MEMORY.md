Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-11T16:26:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.30 - Expanded 3 Lessons / Week Quota For All Plans, Realtime Cross-Page Order Sync & Purged Legacy Scripts)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.30**
- **Core Upgrades in v10.2.30**:
  1. **Mở Rộng Hạn Mức Toàn Diện: 3 Bài / Tuần Cho Mọi Gói Bản Quyền**:
     - Nâng cấp hạn mức giải bài tập từ *1 bài / tuần* lên **3 bài / tuần** (trong vòng 7 ngày gần nhất) cho mọi môn học và mọi gói bản quyền (1 Tuần, 1 Tháng, 1 Kỳ).
     - Thuật toán quản lý phiên học thông minh:
       - Lưu mảng các phiên hoàn thành (`completedSessions: [timestamp1, timestamp2, ...]`) trong `localStorage`.
       - Tự động lọc bỏ các phiên đã qua 7 ngày (`Date.now() - ts < 7 * 24 * 3600 * 1000`).
       - Chỉ khóa khi sinh viên đã hoàn thành đủ **3 bài trong vòng 7 ngày** (`recentSessions.length >= 3`).
       - Khi hoàn thành mỗi bài, hệ thống thông báo trạng thái trực quan: `📌 Đã ghi nhận hoàn thành bài (x/3 bài tuần này) cho môn: [Tên môn]`.
     - Cập nhật đồng bộ nội dung tính năng & quy định trên:
       - `SERVICES_CATALOG` (`servicesCatalog.ts`)
       - Giao diện danh mục dịch vụ (`ServiceCatalog.tsx`)
       - Trang công cụ chuyển đổi key (`converter.html`)
       - Mã nguồn Bookmarklet và Script inject (`v10.2.30`)

  2. **Đồng Bộ Tuyệt Đối 100% Giữa Web Khách Hàng (`/`) & Web Quản Trị Admin (`/admin`)**:
     - Client và Server dùng chung 1 bộ mã `orderId` và `transferCode` duy nhất ngay từ khoảnh khắc mở modal thanh toán.
     - Khách hàng bấm **"Tôi Đã Chuyển Khoản — Báo Admin Duyệt Ngay"** $\rightarrow$ Đồng bộ tức thì lên Cloud Store (`waiting_approval`).
     - Admin bấm **`[Duyệt & Cấp Key]`** $\rightarrow$ Màn hình khách tự động nhận `approved` trong 2 giây $\rightarrow$ Nổ pháo hoa $\rightarrow$ Chuyển sang Bookmarklet đã nạp sẵn key.

  3. **Cảnh Báo Trực Quan Định Dạng Master Gemini API Key Cho Admin**:
     - Kiểm tra cú pháp key: Bắt buộc bắt đầu bằng **`AIzaSy...`** (39 ký tự). Ngăn chặn lỗi `400 API key not valid` khi nhập nhầm token khác.

  4. **Nâng Cấp Cầu Nối AI Bridge Lên v10.2.30 & Dọn Sạch Luồng Cũ**:
     - Đồng bộ `bridge.html` và `src/app/bridge/page.tsx` lên **`v10.2.30`**.
     - Đã dọn sạch 25 file `.user.js` cũ trong `public/`.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
