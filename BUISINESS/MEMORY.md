Created At: 2026-11-11T13:43:57+07:00
Completed At: 2026-11-11T14:24:45+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.25 - Instant Optimistic State, Auto-Upsert Orders, Quick Approve by Transfer Code PR..., 2s Realtime Sync)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.25**
- **Core Upgrades in v10.2.25**:
  1. **Khắc Phục Nút "Tôi Đã Chuyển Khoản — Báo Admin Duyệt Ngay"**:
     - **Vấn đề đã khắc phục**: Trong ảnh chụp màn hình, khi người mua bấm nút này, modal không đổi trạng thái nếu request tạo đơn trước đó bị chậm hoặc trả về 404, khiến đơn hàng không được ghi nhận sang web Admin.
     - **Giải pháp**:
       - `CheckoutModal.tsx` khởi tạo ngay mã đơn và mã chuyển khoản `PR...` dự phòng tức thì khi modal mở ra (đảm bảo `order` không bao giờ null).
       - Chuyển trạng thái giao diện lạc quan (optimistic UI) ngay lập tức: Nút bấm chuyển sang hộp thông báo màu vàng `Đang Chờ Admin Duyệt Đơn & Cấp Key Bản Quyền...`.
       - Trong API `PUT /api/v1/orders`: Cơ chế **Auto-Upsert** tự động tạo đơn hàng mới với mã chuyển khoản `PR...` và trạng thái `waiting_approval` nếu đơn chưa có trong kho dữ liệu, đảm bảo 100% không bao giờ bị lỗi 404 hoặc mất đơn.
  2. **Thêm Thanh Duyệt Nhanh Theo Mã CK Trên Trang Admin (`/admin`)**:
     - Admin chỉ cần nhập mã chuyển khoản (ví dụ: `PR7874`) vào thanh **Duyệt nhanh theo Mã CK** và bấm `[Duyệt & Cấp Key Ngay]`.
     - Hệ thống tự động tìm đơn hoặc tạo mới và cấp key có chứa Master Gemini API Key tức thì trong 1 click.
     - Tăng tần suất đồng bộ tự động lên **2 giây/lần** (2s realtime polling) kèm `?t=${Date.now()}`.
  3. **Auto Engine EduNext v10.2.25**:
     - Nhận diện lời nhắc / sửa sai của giáo viên, tự động đổi sang đáp án đúng.
     - Giới hạn 1 bài/môn/tuần và hạn mức số lượng môn theo gói.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Converter URL**: `https://fpt-studyhub.vercel.app/converter.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
