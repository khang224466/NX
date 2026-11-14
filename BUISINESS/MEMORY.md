Created At: 2026-11-14T15:47:00+07:00
Completed At: 2026-11-14T15:47:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.62 PRO - Admin Security PIN, Order Deletion with Instant Key Revocation, Anti-Duplicate Submission Guard, Dead Conversation Auto Recovery, Full Teacher Feedback Parsing, and Enterprise Anti-Pentest Hardening)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.62 PRO**
- **Bảo Mật Chống Tấn Công Burp Suite & Công Cụ Linux (Pentest & Anti-Tamper Hardening)**:
  1. **Bảo vệ Endpoint Quản Trị (`/api/v1/orders`)**:
     - Trước đây: Không có kiểm tra quyền server-side, kẻ tấn công dùng Burp Suite sửa gói tin `PUT action=approve` có thể tự cấp key miễn phí hoặc `DELETE` để xóa dữ liệu.
     - Đã bọc giáp: Bắt buộc xác thực `isAdmin(req)` bằng header `x-admin-token` hoặc `Authorization: Bearer <pin>` trên toàn bộ các thao tác `approve`, `extend`, `revoke`, `sync_bulk`, `DELETE` và `GET` toàn bộ đơn hàng. Không có token -> server trả về **401 Unauthorized**.
  2. **Bộ Lọc Chống Flood / DoS / Spam Rate Limiter (IP Bucket)**:
     - `/api/v1/orders` (Tạo đơn hàng): Giới hạn tối đa 5 đơn / phút / IP. Nếu tool Linux chạy loop cURL spam đơn rác -> Server chặn với **429 Too Many Requests**.
     - `/api/v1/ai/solve` (Giải bài AI): Giới hạn tối đa 30 request / phút / IP. Ngăn chặn việc vét cạn quota Gemini API.
  3. **Bảo Mật Token Ký Số Mã Hóa**:
     - License key sinh bằng thuật toán HMAC/XOR và Salt bí mật `ENX_SEC_2026_FLASH_LITE`. Burp Suite không thể tự tạo key giả mạo hợp lệ.
  4. **Tường Lửa Vercel WAF & Edge Network**:
     - Tự động lọc các đợt tấn công DDoS L3/L4/L7, botnet scanner và brute-force.
- **Giải Quyết Toàn Diện 5 Vấn Đề Người Dùng Yêu Cầu**:
  1. **Thêm Lớp Bảo Mật Cho Web Admin (Admin Security PIN Barrier)**:
     - Thêm màn hình khóa xác thực Admin Passcode trước khi truy cập `/admin`.
     - Chỉ khi nhập đúng PIN quản trị (`FPTADMIN2026` hoặc admin passcode bí mật), hệ thống mới mở khóa bảng quản lý đơn hàng, doanh thu và cấu hình Key.
     - Trang bị nút "Khóa Quản Trị" trên thanh công cụ để admin có thể khóa lại ngay lập tức bất cứ lúc nào.
  2. **Thêm Chức Năng Xóa Đơn & Cam Kết Chắc Chắn Khi Xóa Đơn/Key Thì Key Dừng Hoạt Động 100%**:
     - Bổ sung nút đỏ Xóa Đơn (🗑️) cho từng đơn hàng trong "Danh Sách Yêu Cầu Đăng Ký Chờ Duyệt & Cấp Key" (Bảng 1).
     - Bổ sung nút "Xóa Toàn Bộ Đơn Rác Chưa Thanh Toán" giúp lọc sạch hàng loạt đơn rác chỉ với 1 click.
     - **Cơ chế thu hồi thực tế**: Khi bấm Xóa Đơn, hệ thống:
       + Thêm `orderId` vào `deletedOrderIds` và danh sách đen client/server.
       + Thêm `licenseKey` vào `revokedLicenseKeys` trên server.
       + `bridge.html` và `edunext-client.js` gọi kiểm tra `GET /api/v1/orders?action=check_key`: nếu key đã bị xóa/thu hồi, bot lập tức DỪNG HOẠT ĐỘNG, hiển thị thông báo đỏ và từ chối giải bài.
       + Endpoint `/api/v1/ai/solve` trả về 403 Forbidden nếu key đã bị xóa.
       + Khẳng định 100%: Khi bấm xóa ở Bảng 1 hay Bảng 2, Key sẽ bị vô hiệu hóa VĨNH VIỄN trên mọi máy khách.
  3. **Ẩn & Xóa Sạch API Key / License Key Khỏi Giao Diện**:
     - Toàn bộ License Key trên bảng hiển thị dưới dạng mã hóa `ENC_AI_••••••••••••` kèm nút Copy tiện lợi, không để lộ chuỗi token dài trên màn hình.
     - Giao diện `bridge.html` không hiển thị bất kỳ ô nhập liệu hay chuỗi API key nào.
  4. **Tạo Các Nhánh IF Thông Minh Tự Xử Lý Mọi Tình Huống**:
     - **IF 1 (Hội thoại bị ngắt)**: Khi xuất hiện thông báo *"This conversation can no longer be continued. Please start a new chat and ask again."* hoặc nút `[Try again]`: bot tự động click `[Try again]`. Nếu không giải quyết được, bot tự động click nút `[+ New]` trên thanh công cụ EduNext để mở phiên mới ngay, không để học sinh bị kẹt.
     - **IF 2 (Giáo viên phản hồi / Có gợi ý Hint)**: `turn-tracker.js` trích xuất TOÀN BỘ container lời giảng của giáo viên bao gồm cả lời nhận xét (ví dụ: *"I noticed you sent the definition of a vocabulary word again..."*) và khối `Hint:` để truyền đầy đủ vào prompt Gemini. Gemini thấy rõ vì sao đáp án cũ bị từ chối và giải đáp án mới chuẩn xác.
     - **IF 3 (Chống trùng lặp đáp án - `submittedHistory`)**: Duy trì mảng lịch sử `submittedHistory = []`. Nếu Gemini đề xuất đáp án đã từng nộp trước đó, bot lập tức từ chối và re-prompt Gemini đổi sang đáp án mới khác hoàn toàn. Tuyệt đối không bao giờ gửi cùng 1 định nghĩa 3 lần liên tiếp.
     - **IF 4 (Xóa bỏ lỗi Abort giả `fingerprint !== E`)**: Loại bỏ lệnh ném lỗi `Câu hỏi đã đổi khi AI đang giải. Bỏ đáp án cũ.` gây vứt bỏ đáp án đúng của Gemini. Thay vào đó, kiểm tra trực tiếp nếu ô nhập liệu (`activeInput`) còn tồn tại trên trang thì điền bài và nộp ngay.
     - **IF 5 (Bắt chính xác thời gian Rate Limit 429)**: Trích xuất số giây chính xác từ tin nhắn EduNext (ví dụ `after 250 seconds`) thay vì cứng nhắc 35s. Đếm ngược đúng thời gian và tự động click `[Try again]` khi hết giờ.
  5. **Đồng Bộ Phiên Bản v10.2.62 PRO & Endpoint Mới Trên CDN**:
     - Phát hành file phân phối mới: `v10_2_62_minified.js`.
     - Cập nhật toàn bộ link Bookmarklet, trang kéo thả `keo_bookmark.html`, và các component sang `v10.2.62 PRO`.
     - Purge cache jsDelivr cho các bản 62, 61, 60, 58 để đảm bảo khách kéo bookmark mới sẽ tải đúng 100% bản v10.2.62 PRO.

---

## Technical Architecture & Core Files
- **EduNext Client Script**: `FPT service/scripts/edunext-client.js` (v10.2.62)
- **Turn Tracker**: `FPT service/scripts/turn-tracker.js`
- **Bundle Generator**: `FPT service/scripts/build-edunext.cjs`
- **CDN Generator**: `FPT service/scripts/build_v10_cdn.js`
- **AI Backend Solver**: `FPT service/src/app/api/v1/ai/solve/route.ts`
- **AI Bridge**: `FPT service/public/bridge.html`
- **Admin Management & Security Gate**: `FPT service/src/app/admin/page.tsx`, `FPT service/src/lib/orderRepository.ts`
- **Bookmarklet Drag Page**: `FPT service/public/keo_bookmark.html`, `FPT service/scripts/generate_keo_page.js`
- **CDN Minified Distributions**: `d:\BUISINESS\v10_2_*_minified.js` (Root)
