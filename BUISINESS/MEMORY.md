# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.23 - Cloud Realtime Store Sync Between Storefront & Admin, 220k VietQR, Zero Hardcoded Orders/Stats)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.23**
- **Core Upgrades in v10.2.23**:
  1. **Đồng Bộ Realtime Giữa 2 Web (Khách Mua Hàng <-> Admin Quản Trị)**:
     - **Vấn đề đã khắc phục**: Trên môi trường Serverless của Vercel, các request chạy trên các lambda container độc lập, in-memory Map không chia sẻ được dữ liệu giữa người mua và người duyệt, cũng như giữa các domain khác nhau (`fpt-studyhub-onib.vercel.app` vs `fpt-studyhub.vercel.app`).
     - **Giải pháp**: Tích hợp tầng Persistent Cloud Sync Store (`ff808181a09d98f701a1c947378e0537`). Mọi đơn hàng sinh ra ở bất kỳ domain nào đều được lưu vào kho dùng chung. Admin trên trang `/admin` đọc trực tiếp từ kho này mỗi 3 giây.
     - Khi Admin bấm `[Duyệt & Cấp Key]`, đơn hàng chuyển sang `approved` và lưu key vào kho. Màn hình người mua (đang polling mỗi 3s) lập tức nhận được trạng thái đã duyệt và mở khóa Bookmarklet!
  2. **Xóa Bỏ Toàn Bộ Luồng Cứng & Đơn Hàng Mẫu Giả**:
     - Loại bỏ triệt để các đơn hàng mẫu cứng (`ORD-4219`, `ORD-9104`, `ORD-8821`).
     - Các chỉ số thống kê trên trang Admin (`Tổng Khách Hàng`, `Doanh Thu Thực Nhận`, `Đơn Chờ Admin Duyệt`) được tính toán động 100% từ danh sách đơn hàng thực tế.
  3. **Sửa Lỗi Mã QR Gói 220.000₫ (1 Kỳ Học 4 Tháng)**:
     - Trước đây gói 220k fallback về ảnh `qr_69k.jpg` (có chữ in 69.000₫).
     - Đã tạo và cấu hình riêng mã QR VIB chuẩn xác 220.000₫ (`/qr_220k.png`) khớp hoàn toàn số tiền 220.000₫ và nội dung chuyển khoản.
  4. **Triệt Tiêu Spam & Khóa Trạng Thái v10.2.23**:
     - State lock: Khi tin nhắn cuối trong khung chat là của sinh viên (`lastMsgIsStudent === true`), bot tạm ngưng gửi request, chờ EduNext chấm điểm.
     - Học từ gợi ý giáo viên: Trích xuất lời nhận xét/sửa sai của giảng viên đưa vào prompt Gemini Flash-Lite để tự sửa đáp án đúng.
     - Khóa 1 môn / 1 bài / tuần và giới hạn số môn theo gói bản quyền.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub-onib.vercel.app` & `https://fpt-studyhub.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Converter URL**: `https://fpt-studyhub.vercel.app/converter.html`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons.
