# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.22 - Anti-Spam State Lock, Teacher Feedback Learning, VIB 858709070, Admin Approval Portal)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.22**
- **Core Upgrades in v10.2.22**:
  1. **Triệt Tiêu Hoàn Toàn Lỗi Spam Liên Tục & Request Khi Chưa Có Câu Hỏi**:
     - **Nguyên nhân gốc đã tìm ra**: Trước đây, chữ ký định danh `questionSignature` lấy 40 ký tự cuối của base64 ảnh video stream (`shot.image.slice(-40)`). Do video stream liên tục có nhiễu nén vi sai, chữ ký luôn thay đổi sau mỗi frame, khiến `runAutoCycle` lầm tưởng là câu hỏi mới và gọi Gemini mỗi 2.5s dù câu hỏi chưa đổi! Ngoài ra, timer 15s tự động mở khóa submit lại câu cũ khiến bot spam 5 lần "vuông góc".
     - **Giải pháp v10.2.22**:
       - Chuyển `questionSignature` sang dạng văn bản thuần túy 100% tất định (DOM question text + teacher message text). Loại bỏ hoàn toàn nhiễu base64 video frame.
       - Tích hợp máy trạng thái: Nếu tin nhắn cuối cùng trong khung chat là của Học Sinh (`lastMsgIsStudent === true`), bot chuyển trạng thái chờ EduNext chấm điểm & phản hồi, **tuyệt đối không gửi request, không spam câu trả lời lặp lại**.
  2. **Bộ Nhận Diện Phản Hồi Giáo Viên & Tự Sửa Sai Theo Gợi Ý**:
     - Khi EduNext trả lời sai hoặc đưa ra gợi ý (ví dụ: *"Tôi hiểu là bạn đang cảm thấy khá mệt mỏi... bạn đang tập trung vào hướng (vuông góc), nhưng câu hỏi thực chất đang hỏi về tên gọi của một loại lực vật lý... loại lực giúp vật thể về vị trí ban đầu..."*), bot trích xuất toàn bộ ngữ cảnh phản hồi này và truyền cho Gemini Flash-Lite.
     - Gemini đọc gợi ý của giáo viên và nhận biết đáp án cũ ("vuông góc") đã sai, từ đó trả lời chính xác đáp án mới: `Trả lời: lực đàn hồi`.
  3. **Cập Nhật Toàn Bộ Thanh Toán Sang Ngân Hàng VIB (858709070 - DIEP DAI PHU)**:
     - Ngân hàng: **Ngân hàng Quốc Tế (VIB)**
     - Số tài khoản: **`858709070`**
     - Chủ tài khoản: **`DIEP DAI PHU`**
     - Gói 1 Tuần (30.000₫): Dùng mã QR `/qr_30k.jpg`
     - Gói 1 Tháng (69.000₫): Dùng mã QR `/qr_69k.jpg`
     - Gói 1 Kỳ Học 4 Tháng (220.000₫): Dùng mã QR `/qr_69k.jpg` (hoặc VietQR tự động VIB)
     - Liên hệ hỗ trợ: Discord Admin `https://discord.com/users/888713971161505832`
  4. **Web Quyền Admin Duyệt Yêu Cầu Trước Khi Cấp API Key (`/admin`)**:
     - Khi khách hàng quét QR thanh toán và bấm "Tôi Đã Chuyển Khoản", đơn hàng chuyển sang trạng thái `waiting_approval`.
     - Màn hình khách hàng hiển thị chờ Admin duyệt và tự động thăm dò (polling) mỗi 3 giây.
     - Trên web Admin (`/admin`), Admin xem danh sách đơn hàng chờ duyệt kèm Mã Đơn, Mã CK, Gói, Số tiền.
     - Admin bấm **`[Duyệt & Cấp Key]`**: Hệ thống tự động tạo chuỗi `ENC_AI_...` có thời hạn tương ứng (7 ngày, 30 ngày, 120 ngày) và chuyển trạng thái đơn sang `approved`.
     - Ngay lập tức, màn hình khách hàng nhận được Key bản quyền và nút kéo Bookmarklet 1-Click!
  5. **Tối Giản Hóa Khảo Thí & SEB Thành 2 Ô Đen "Sắp Ra Mắt"**:
     - Xóa bỏ toàn bộ danh sách tính năng, checklist bullet points, bảng giá dự kiến.
     - Hiển thị 2 ô đen tối giản, tinh tế với icon Clock và huy hiệu "Sắp Ra Mắt — Đang Kiểm Thử Nội Bộ".
  6. **Cơ Chế Khóa Môn & Khóa Bài Chuẩn Xác**:
     - Giới hạn: Mỗi môn chỉ được hoàn thành 1 bài trong vòng 7 ngày (1 tuần).
     - Gói 1 Tuần: tối đa 3 môn; Gói 1 Tháng: tối đa 5 môn; Gói 1 Kỳ: tối đa 6 môn.
     - Sau khi hoàn thành bài học, môn đó được ghi nhận và tự động khóa trong 7 ngày.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub-onib.vercel.app` & `https://fpt-studyhub.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Converter URL**: `https://fpt-studyhub.vercel.app/converter.html`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons.
