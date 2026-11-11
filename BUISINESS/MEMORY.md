Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-11T14:57:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.27 - Key Expiration Warning Dashboard, Instant Admin Renewal, Zero-Leak Read-Only Client HUD Without Edit/Copy)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.27**
- **Core Upgrades in v10.2.27**:
  1. **Bảng Quản Lý Thời Hạn & Cảnh Báo Key Gần Hết Hạn Trên Trang `/admin`**:
     - Phân loại trực quan toàn bộ key đã cấp theo 3 cấp độ:
       - 🟢 **Còn Hạn (An Toàn)**: Key còn trên 5 ngày sử dụng.
       - 🟡 **Sắp Hết Hạn (Cảnh Báo Gia Hạn)**: Key còn $\le 5$ ngày (hiển thị số ngày & giờ còn lại, gắn badge vàng cảnh báo nhấp nháy để Admin chủ động chăm sóc khách).
       - 🔴 **Đã Tự Hủy**: Key đã quá hạn (hiển thị số ngày đã hết hạn, trạng thái đã tự hủy).
     - Bộ lọc Tab 1-Click: *Tất Cả*, *Sắp Hết Hạn*, *Còn Hạn*, *Đã Tự Hủy*.
     - Thao tác nhanh cho Admin ngay trên bảng:
       - `[+7 Ngày]`: Gia hạn thêm 1 tuần.
       - `[+30 Ngày]`: Gia hạn thêm 1 tháng (30 ngày).
       - `[+1 Kỳ]`: Gia hạn thêm 1 kỳ học (120 ngày).
       - `[Khóa / Thu hồi]`: Thu hồi bản quyền ngay lập tức.
     - Endpoint `PUT /api/v1/orders` hỗ trợ các action `extend` và `revoke` đồng bộ Realtime vào Cloud Database.

  2. **Bảo Mật Tuyệt Đối & Tự Động Hóa 100% Cho Khách Hàng (Zero Key Leakage)**:
     - **Xóa vĩnh viễn nút "Đổi Key" và cửa sổ "Cấu hình key bản quyền"** (`showKeyConfigModal`) khỏi mã nguồn bot.
     - Khách hàng không thể xem, sửa hoặc sao chép chuỗi mã key thô (`ENC_AI_...`).
     - Key được đóng gói sẵn 100% bên trong nút Bookmarklet:
       `javascript:(function(k){...})("ENC_AI_...")`.
     - Khách hàng sau khi được Admin duyệt chỉ cần kéo nút Bookmarklet thả vào thanh dấu trang của trình duyệt và bấm chạy trên EduNext.
     - Tool tự động nhận diện và lưu key vào `localStorage` ngầm, không hiện ô nhập, không cần thao tác thủ công.
     - Trên EduNext HUD chỉ hiển thị thẻ trạng thái đọc (Read-Only):
       - Còn hạn: `🔑 Bản Quyền: Đang Hoạt Động • Còn X ngày (Hết hạn: dd/mm/yyyy)` kèm huy hiệu `[ĐÃ KÍCH HOẠT]`.
       - Hết hạn: `⛔ Bản Quyền: Đã Hết Hạn (Key đã tự hủy)` kèm huy hiệu `[ĐÃ TỰ HỦY]`.
       - Tự hủy ngay lập tức khi `now > exp`: xóa sạch biến RAM và `localStorage`.

  3. **Chuẩn Hóa Ký Tự ASCII Trong Chuỗi Payload Mã Hóa**:
     - Sử dụng nhãn `1 Tuan`, `1 Thang`, `1 Ky Hoc (4 Thang)` khi đóng gói vào payload `EXP|timestamp|plan|key`.
     - Ngăn ngừa hiện tượng lệch byte khi giải mã XOR Base64 đối với ký tự Unicode tiếng Việt có dấu.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Converter URL**: `https://fpt-studyhub.vercel.app/converter.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
