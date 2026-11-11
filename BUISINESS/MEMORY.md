Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-11T19:01:20+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.34 - True Realtime Order Linking Between Landing & Admin, Stale Orders Purged, 1-Click Order Wipe)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.34**
- **Core Upgrades in v10.2.34**:
  1. **Liên Kết Đồng Bộ 100% Hai Chiều Giữa Màn Hình Khách Hàng & Trang Quản Trị Admin**:
     - Khắc phục triệt để lỗi phân mảnh mã đơn: Khi học sinh mở Modal thanh toán, mã đơn `ORD-...` và mã chuyển khoản `PR...` được đồng nhất tuyệt đối giữa Client và Server (loại bỏ hoàn toàn việc server tự tạo mã lệch ngẫu nhiên).
     - Khi học sinh mở modal thanh toán: Đơn lập tức xuất hiện trong danh sách Admin ở trạng thái `pending` (Chờ Chuyển Khoản).
     - Khi học sinh bấm **[Tôi Đã Chuyển Khoản]**: Đơn lập tức chuyển sang `waiting_approval` (Chờ Admin Duyệt) với nút xanh `[Duyệt & Cấp Key]` sáng rực.
     - Khi Admin bấm **[Duyệt & Cấp Key]**: Modal thanh toán của học sinh tự động kích hoạt, bắn pháo hoa Confetti và chuyển sang trang nhận Bookmarklet trong vòng 1-2 giây.

  2. **Xóa Sạch Mọi Đơn Cũ / Luồng Cứng (Reset Danh Sách Trắng Tinh)**:
     - Toàn bộ các đơn hàng cũ / rác (`ORD-74224794`, `ORD-12166413`, `ORD-31043373`) trên Cloud Database đã được dọn sạch về `0` (trắng tinh).
     - Bổ sung nút **`[🗑️ Xóa Trắng Đơn Hàng]`** trực tiếp trên thanh công cụ Admin kèm API `DELETE /api/v1/orders` để Admin có thể tự reset toàn bộ danh sách trắng tinh bất cứ lúc nào chỉ với 1 click.

  3. **Cập Nhật Đồng Bộ Toàn Bộ Hệ Thống Bookmarklet & Server Lên v10.2.34**:
     - Đồng bộ toàn diện: `public/keo_bookmark.html`, `src/lib/utils.ts` (`RAW_FN_BASE64`), `src/app/inject.js/route.ts`, `src/app/edunext.user.js/route.ts`, `public/bridge.html`, `src/app/api/v1/ai/solve/route.ts`.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
