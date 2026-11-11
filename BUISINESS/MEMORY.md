Created At: 2026-11-11T13:43:57+07:00
Completed At: 2026-11-11T14:29:45+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.26 - Self-Destructing Expiring Key, Pre-Baked Bookmarklet Zero-Config for Customer, Auto-Purge from LocalStorage & Memory)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.26**
- **Core Upgrades in v10.2.26**:
  1. **Quy Trình Khách Chỉ Cần Đăng Ký — Admin Tự Nhập Key Cho Khách**:
     - Khách hàng không cần tạo key Google, không cần biết mã hóa là gì.
     - Khách chỉ cần mở web chọn gói (hoặc chuyển khoản).
     - Admin vào trang `/admin`, nhập Master Gemini API Key (lưu 1 lần trên máy Admin), bấm **[Duyệt & Cấp Key]** (hoặc gõ mã `PR...` duyệt nhanh).
     - Hệ thống tự sinh mã bản quyền `ENC_AI_` đóng gói sẵn mốc thời gian hết hạn (`EXP|timestamp|duration|apiKey`).
     - Khi Admin duyệt xong, màn hình khách hàng tự động chuyển sang trang nhận nút Bookmarklet:
       Mã Bookmarklet đã được nhúng sẵn 100% key mã hóa: `javascript:(function(k){...})("ENC_AI_...")`.
       Khách chỉ việc kéo nút này lên thanh trình duyệt hoặc bấm là chạy ngay lập tức.
  2. **Cơ Chế Tự Động Biến Mất Của Key Khi Hết Hạn (Self-Destruct Protocol)**:
     - Khi thời gian thực tế vượt quá mốc đăng ký (`now > exp`):
       - Bot lập tức thực thi xóa vĩnh viễn key khỏi trình duyệt:
         `localStorage.removeItem('enx_encrypted_ai_key')`
         `localStorage.removeItem('enx_license_key')`
       - Xóa biến trong bộ nhớ RAM (`activeEncryptedKey = ''`).
       - Dừng toàn bộ vòng lặp tự động (`isAuto = false`).
       - HUD thông báo: *"Key gói bản quyền đã hết hạn và tự động biến mất khỏi trình duyệt"*.
       - Khách mở lại tool sẽ về trạng thái ban đầu *"Chưa có Key"*, không còn bất kỳ dấu vết nào của key để sử dụng tiếp.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Converter URL**: `https://fpt-studyhub.vercel.app/converter.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
