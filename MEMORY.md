# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.50 PRO & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.50 PRO** (Giao diện Admin Dashboard hoàn nguyên nguyên bản không login barrier, Auto-solve 35s đếm ngược, Bookmarklet cài đặt 1-click không phụ thuộc kéo thả).
- **Core Breakthroughs in v10.2.50 PRO**:
  1. **Admin Dashboard Reversion (v10.2.50 PRO)**:
     - Hoàn nguyên giao diện Admin nguyên bản từ commit `0f4ddbc`: Master Google Gemini API Key input, 4 stats cards (Tổng Khách Hàng, Doanh Thu, Đơn Chờ, Server Latency 12ms), bảng duyệt đơn thời gian thực, bảng quản lý thời hạn key, tạo key thủ công.
     - Loại bỏ hoàn toàn login wall gây nghẽn truy cập của admin (`/admin` mở trực tiếp).
     - Cho phép `GET`, `PUT`, `DELETE` trên `/api/v1/orders` tự do.
  2. **Khôi Phục Trọn Vẹn "Cách Cũ: Cầm Kéo Lên Là Xong"**:
     - Phát hiện nguyên nhân: Trước đó bookmarklet bị nhét toàn bộ 34.000 ký tự mã nguồn inline và bị chặn bởi điều kiện `startsWith('FPT1.')` khiến href bị rỗng hoặc quá tải buffer Windows OLE, gây ra biểu tượng cấm 🚫 khi kéo.
     - Đã hoàn nguyên thuật toán sinh Bookmarklet chuẩn loader siêu nhẹ (218 ký tự) qua `/inject.js?key=...`:
       `javascript:(function(){var s=document.createElement('script');s.src='https://fpt-studyhub.vercel.app/inject.js?key='+key+'&t='+Date.now();s.async=true;(document.head||document.documentElement).appendChild(s);})();`
     - Người dùng chỉ cần giữ chuột vào nút màu xanh to kéo thẳng lên thanh Bookmark là thả được ngay 100% (không còn biểu tượng cấm 🚫).
     - Khi bấm vào Bookmark trên EduNext, script `/inject.js` sẽ tự tải trọn bộ v10.2.50 PRO (Auto-solve 35s đếm ngược, Vision chụp ảnh, chống 429) và chạy mượt mà.
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
  1. Hoàn tất biến iPhone thành Màn hình phụ thứ 2 (Secondary Monitor) của Windows qua Spacedesk & Wi-Fi Hotspot `STARK_VR` (2.4GHz). Windows nhận diện `DISPLAY9` với độ phân giải siêu nét `2532 x 1170` (Super Retina XDR OLED). Đã kích hoạt chế độ Extend mở rộng màn hình.
  2. Giải nén và phân tích chuyên sâu mã nguồn `CardboardXR-main.zip` (Unity 6 C#): Nắm trọn kiến trúc 6DoF SLAM + IMU EKF fusion, camera passthrough mono, 3D hand tracking (MediaPipe BlazeHand), cơ chế Gaze + Pinch hysteresis, nắn méo thấu kính `LensDistortion.cs`, và cơ chế Thermal Governor giải quyết hiện tượng quá nhiệt.
  3. Cấu hình Roamies JARVIS (`sidekick.json`): Bật `"autoListen": true` và `"voice": true` với skin `"jarvis"`, cho phép trò chuyện bằng giọng nói rảnh tay (Hands-free Voice AI) qua tai nghe không dây khi đang đeo kính thực tế ảo Shinecon G10.
- **v10.2.36**: Two-way handshake & heartbeat between EduNext and Bridge, encrypted true Gemini key, auto-sync UI.
- **v10.2.35**: Tampermonkey chat scanner, 429 defense, anti-pro ban, auto-drag VIP key, 3 lessons/week quota across packages.
- **v10.2.18**: Smart winner model caching (`gemini-flash-lite-latest`), filtered Gemma/2.5 models, added 7.5s abort timeout.
- **v10.2.10**: Closed-loop automation (Write 'Sẵn sàng' -> Track submit button -> Solve next question -> Loop until complete).
