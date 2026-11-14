Created At: 2026-11-14T11:06:00+07:00
Completed At: 2026-11-14T11:06:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.55 PRO - Fix Key Not Activated / ENC_AI_ XOR Decoder & Auto-Heal Persistence)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.55 PRO**
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
