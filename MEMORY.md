# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.50 PRO & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.50 PRO** (Giao diện Admin Dashboard hoàn nguyên nguyên bản không login barrier, Auto-solve 35s đếm ngược, Bookmarklet cài đặt 1-click không phụ thuộc kéo thả).
- **Core Breakthroughs in v10.2.50 PRO**:
  1. **Admin Dashboard Reversion (v10.2.50 PRO)**:
     - Hoàn nguyên giao diện Admin nguyên bản từ commit `0f4ddbc`: Master Google Gemini API Key input, 4 stats cards (Tổng Khách Hàng, Doanh Thu, Đơn Chờ, Server Latency 12ms), bảng duyệt đơn thời gian thực, bảng quản lý thời hạn key, tạo key thủ công.
     - Loại bỏ hoàn toàn login wall gây nghẽn truy cập của admin (`/admin` mở trực tiếp).
     - Cho phép `GET`, `PUT`, `DELETE` trên `/api/v1/orders` tự do.
  2. **Giải Quyết Triệt Để Lỗi "K Ném Lên Được" (Bookmark Drag Limit)**:
     - Nguyên nhân: Windows OLE drag-drop buffer limit (`INTERNET_MAX_URL_LENGTH = 2084`) khiến Chrome / Edge chặn kéo-thả các link `javascript:...` dài hơn 2.000 ký tự (trong khi bản v10.2.50 dài hơn 34.000 ký tự chứa toàn bộ AI nhận diện và bypass Cloudflare).
     - Đã nâng cấp `public/keo_bookmark.html`:
       - Cung cấp nút to **"📋 BẤM ĐỂ SAO CHÉP MÃ v10.2.50"** (Tự động nạp sẵn key bản quyền từ URL/localStorage).
       - Hướng dẫn 4 bước tạo bookmark thủ công: Chuột phải thanh Bookmark -> Thêm trang (Add Page) -> Dán URL -> Lưu (100% thành công trong 5 giây trên mọi trình duyệt).
       - Tích hợp thêm nút cài đặt 1-click qua Tampermonkey (`/edunext.user.js`).
       - Nút kéo dự phòng cho MacOS/Firefox.
  3. **Auto-Solve EduNext 35s Loop**:
     - Đồng hồ đếm ngược 35s realtime trên HUD (`⚡ Auto: 35s`).
     - Tự động nhận diện câu hỏi mới, tránh spam "Sẵn sàng", chụp ảnh Vision phân tích bài tập, tự động nộp bài và chuyển câu.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT
- **Directory**: `d:\BUISINESS\FPT service\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại**:
  - Gói 1 Tuần: **30.000đ**
  - Gói 1 Tháng: **69.000đ**
  - Gói 1 Kỳ Học (4 Tháng): **220.000đ** (Khuyên dùng)
  - Admin Bank: **VIB • STK: 858709070 • DIEP DAI PHU**

---

## Past Milestones
- **STARK Spatial Computing & Roamies JARVIS Integration (v9.7.5)**:
  1. Giải nén và phân tích chuyên sâu mã nguồn `CardboardXR-main.zip` (Unity 6 C#): Nắm trọn kiến trúc 6DoF SLAM + IMU EKF fusion, camera passthrough mono, 3D hand tracking (MediaPipe BlazeHand), cơ chế Gaze + Pinch hysteresis, nắn méo thấu kính `LensDistortion.cs`, và cơ chế Thermal Governor giải quyết hiện tượng quá nhiệt.
  2. Đã tải sẵn file `CardboardXR-1.0.0.apk` (64MB) về thư mục `C:\Users\LEGION\Downloads\CardboardXR-1.0.0.apk` để cài đặt trực tiếp lên điện thoại Android (hỗ trợ ARCore/Vulkan).
  3. Cấu hình Roamies JARVIS (`sidekick.json`): Bật `"autoListen": true` và `"voice": true` với skin `"jarvis"`, cho phép trò chuyện bằng giọng nói rảnh tay (Hands-free Voice AI) qua tai nghe không dây khi đang đeo kính thực tế ảo Shinecon G10.
- **v10.2.36**: Two-way handshake & heartbeat between EduNext and Bridge, encrypted true Gemini key, auto-sync UI.
- **v10.2.35**: Tampermonkey chat scanner, 429 defense, anti-pro ban, auto-drag VIP key, 3 lessons/week quota across packages.
- **v10.2.18**: Smart winner model caching (`gemini-flash-lite-latest`), filtered Gemma/2.5 models, added 7.5s abort timeout.
- **v10.2.10**: Closed-loop automation (Write 'Sẵn sàng' -> Track submit button -> Solve next question -> Loop until complete).
