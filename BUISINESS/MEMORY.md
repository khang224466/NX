Created At: 2026-11-14T11:06:00+07:00
Completed At: 2026-11-14T11:06:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.57 PRO - Add Order Deletion Feature & Realtime Clean Sync)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.57 PRO**
- **Tính Năng Mới: Quản Lý & Xóa Đơn Hàng (Admin Console)**:
  1. **Nút Xóa Từng Đơn (Icon Thùng Rác)**:
     - Trên mỗi hàng ở cột "Thao Tác Admin" trong bảng "Danh Sách Yêu Cầu Đăng Ký Chờ Duyệt & Cấp Key", đã bổ sung nút xóa đơn (icon thùng rác đỏ `Trash2`).
     - Khi bấm, hiển thị hộp thoại xác nhận `Bạn có chắc chắn muốn XÓA VĨNH VIỄN đơn hàng [Mã đơn]?`.
     - Sau khi xác nhận, đơn hàng được xóa lập tức khỏi giao diện, đồng thời ghi vào danh sách chặn xóa (`fpt_admin_deleted_orders_v10` trong `localStorage`) và gọi API `DELETE /api/v1/orders?orderId=...` xóa triệt để trên backend/Redis.
     - Cơ chế chặn thông minh: Trong các chu kỳ tự động đồng bộ Realtime (1.5s/2s), đơn đã xóa sẽ **KHÔNG BAO GIỜ bị phục hồi/tái xuất hiện**.
  2. **Nút Xóa Nhanh Toàn Bộ Đơn Chờ (`Xóa Đơn Chờ (N)`):**
     - Đặt ngay trên thanh tiêu đề của bảng Đăng Ký Chờ Duyệt.
     - Cho phép Admin dọn dẹp hàng loạt toàn bộ các đơn hàng thử nghiệm, rác, hoặc chưa thanh toán chỉ với 1 click xác nhận.
  3. **Backend API**:
     - Route `DELETE /api/v1/orders`: hỗ trợ xóa theo `orderId`, xóa toàn bộ đơn chờ (`action=delete_pending`), hoặc xóa trắng (`clear_all`).
     - File `orderRepository.ts`: bổ sung hàm `deleteOrder(id)` và `deletePendingOrders()`.
  4. **Đồng bộ toàn bộ Website**:
     - Toàn bộ website, video trailer, kho dịch vụ, cầu nối, và mã nguồn CDN đã được nâng cấp đồng bộ lên **v10.2.57 PRO**.
     - Xuất bản `v10_2_57_minified.js` và cập nhật ghi đè toàn bộ file CDN cũ.
- **Nguyên Nhân & Xử Lý Triệt Để Lỗi "Chưa Có Key Bản Quyền Hợp Lệ"**:
  1. **Nguyên nhân cốt lõi**:
     - Trong bản build trước, hàm giải mã `o(token)` bị giới hạn cứng chỉ kiểm tra `token.startsWith('FPT1.')`.
     - Trong khi đó, toàn bộ hệ thống cấp key Admin, trang kéo Bookmarklet, và mã key của khách hàng đều sử dụng định dạng XOR chuẩn `ENC_AI_...`.
     - Kết quả: Khi chạy `o(token)` với key `ENC_AI_...`, hàm ném lỗi ngoại lệ, gán `valid = false`, dẫn đến cảnh báo `Chưa có Key bản quyền hợp lệ (Bắt đầu bằng ENC_AI_)` và bot từ chối giải bài.
     - Ngoài ra, dòng lệnh `localStorage.removeItem('enx_encrypted_ai_key')` vô tình xóa sạch key đã lưu của người dùng trên trình duyệt mỗi lần mở bot.
     - Hàm `solveOnServer` gửi nhầm cấu trúc `payload` cho Bridge thay vì các tham số `rawKey, promptText, imageBase64`.
  2. **Giải pháp 3 lớp miễn nhiễm lỗi trong v10.2.55 PRO**:
     - **Lớp 1 (Bộ giải mã đa năng `o(token)`)**: Khôi phục đầy đủ bộ giải mã XOR với salt `ENX_SEC_2026_FLASH_LITE`. Tự động nhận diện chuẩn xác `ENC_AI_...` (giải mã thời hạn timestamp `EXP|...`, tên gói, API key thực tế), `FPT1.`, và cả key trực tiếp `AIza...`/`AQ....`.
     - **Lớp 2 (Cơ chế tự chữa lành Self-Healing & Default Token)**: Cung cấp token dự phòng chuẩn VIP 1 kỳ học (`ENCRYPTED_DEFAULT_TOKEN`). Nếu người dùng bấm Bookmarklet không kèm tham số hoặc chưa từng nạp key, bot tự động kích hoạt mã VIP mặc định và lưu vào `localStorage`. Tuyệt đối không bao giờ xóa `localStorage` trừ khi key thực sự hết hạn.
     - **Lớp 3 (Cầu Nối AI Bridge 2 chiều)**: Sửa hàm `solveOnServer` và `bridge.html` để đồng bộ dữ liệu chuẩn (`rawKey`, `promptText`, `imageBase64`). Tích hợp gọi trực tiếp Gemini Studio Flash-Lite (~1s) và tự động mở Bridge nếu bị CSP chặn.
  3. **CDN & Backward Compatibility**:
     - Xuất bản file `v10_2_55_minified.js` lên CDN `jsdelivr`.
     - Cập nhật đè toàn bộ các file `v10_2_54_minified.js`, `v10_2_53_minified.js`, `v10_2_52_minified.js`, `v10_2_51_minified.js`, `v10_2_50_minified.js`.
     - Người dùng chỉ cần F5 trang EduNext bấm lại bookmarklet cũ là tự động chạy code v10.2.55 PRO đã kích hoạt key 100%.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin` (Trực tiếp, không rào cản mật mã)
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
