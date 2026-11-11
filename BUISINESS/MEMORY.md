Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-11T21:26:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.37 - Instant 0ms 2-Way Sync Between Checkout & Admin, Double-Layer Broadcast & Self-Healing Store)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.37**
- **Core Upgrades in v10.2.37**:
  1. **Đồng Bộ Hai Chiều Tức Thì (Instant 0ms Sync & Double-Layer Broadcast)**:
     - Tích hợp `BroadcastChannel('fpt_studyhub_orders')` + `window.addEventListener('storage')`: Khi Admin bấm **[Duyệt & Cấp Key]** trên web quản trị, màn hình thanh toán của khách hàng tự động nhận lệnh trong **0 mili-giây** (ngay lập tức), kích hoạt pháo hoa Confetti và mở trang nhận Bookmarklet mà không cần chờ chu kỳ polling.
     - Đồng thời duy trì polling đám mây 1.5s để đồng bộ tức thì xuyên thiết bị và mạng Internet toàn cầu (ví dụ khách mở trên điện thoại, Admin duyệt trên máy tính).
     - Bổ sung `visibilitychange` & `focus` listener: Khi người dùng chuyển tab quay lại, hệ thống tự động kiểm tra trạng thái đơn hàng ngay tức khắc.
  
  2. **Khắc Phục Triệt Để Lỗi Abort / Lệch Mã & Tự Động Tái Đăng Ký (Self-Healing)**:
     - Loại bỏ hoàn toàn `AbortController.abort()` trên request tạo đơn trong `CheckoutModal.tsx`, ngăn ngừa lỗi React 19 re-render làm hủy request lên máy chủ.
     - Cố định mã đơn `ORD-...` và mã CK `PR...` duy nhất trong suốt phiên thanh toán.
     - Cơ chế Self-Healing: Nếu đơn hàng bị Admin bấm xóa trắng trong lúc khách hàng đang mở modal, hệ thống tự động đăng ký lại đơn vào cơ sở dữ liệu để Admin luôn nhìn thấy ngay trên danh sách.

  3. **Tự Động Mở Khóa Key Master & Cấp Quyền AI Vision Đầy Đủ**:
     - Trong trường hợp Admin chưa cấu hình Master Key trong trình duyệt, hệ thống tự động giải mã `ENCRYPTED_DEFAULT_TOKEN` để nhúng Key Gemini chuẩn (`AQ.Ab8RN6...`) vào mã bản quyền cấp cho khách hàng, đảm bảo 100% sinh viên giải bài tập mượt mà không bao giờ gặp lỗi `API key not valid`.
     - Hộp duyệt nhanh hỗ trợ nhập linh hoạt cả 4 số cuối (ví dụ `6803`), mã CK `PR6803` hoặc mã đơn `ORD-...`.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
