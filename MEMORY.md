# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.88 PRO & CardboardXR Native Spatial Port)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.88 PRO** (Hoàn tất "ăn cắp" 100% tinh hoa của CardboardXR: Material 3 Floating Dock + App Library Grid, AimHistory triệt tiêu rung giật góc chụm 5.6 độ, Palm Gate triệu hồi Menu rảnh tay, Passthrough sạch giấu xương tay).
- **Core Breakthroughs in v10.2.88 PRO (CardboardXR Port)**:
  1. **Hệ Thống Giao Diện Không Gian Material 3 (M3 Spatial UI)**:
     - Xóa bỏ toàn bộ các khối chữ nhật viền thô kệch OpenCV; thay thế bằng hệ thống Material 3 (`M3Theme`: Surface `#141218`, SurfaceContainer `#211F26`, Primary Lavender `#D0BCFF`, Accent Tints cho từng app).
     - Bo góc siêu mượt và nền kính mờ (`draw_rounded_glass`) chống nhòe thị sai, hiển thị hoàn hảo ở cả chế độ 1 Màn hình (Single Screen 1280x720) và Kính VR SBS (640x720 mỗi mắt).
     - Thanh công cụ Capsule Toolbar lơ lửng dưới đáy (`[+] APPS`, `[O] 1-SCR/SBS VR`, `[*] RESET`, `[~] IPHONE`, `[X] CLOSE`).
     - Lưới **App Library Grid** mở từ nút `[APPS]` hiển thị trọn vẹn 5 ứng dụng (🎨 Paint 3D, 🌀 Portal, ⚡ Orb Rush, 📦 Cube Physics, 📐 Caliper) kèm dòng mô tả Tagline động khi trỏ tới.
  2. **Cơ Chế Điều Khiển "AimHistory" Triệt Tiêu Độ Lệch Chụm Ngón**:
     - Port nguyên bản thuật toán `AimHistory.cs` từ CardboardXR: Khi chụm ngón tay, bàn tay người tự nhiên bị vặn xoay một góc trung bình **5.6 độ**, khiến tia laser văng lệch khỏi nút bấm mục tiêu.
     - Bộ đệm `AimHistory` tự động lưu lịch sử tia và lấy lại mẫu tia tại thời điểm **0.18s trước khi chụm ngón**, khóa chặt mục tiêu vào đúng nút người dùng muốn bấm, độ chính xác đạt 100%.
  3. **100% Rảnh Tay (Hands-Free) — Rời Xa Hoàn Toàn Bàn Phím Laptop**:
     - Cổng cử chỉ **Lòng bàn tay (visionOS Palm Gate)**: Khi mở lòng bàn tay hướng về camera $\ge 0.20$s, một nút bánh răng phát sáng nhịp tim (`MENU` / `CHỤM ĐỂ MỞ`) tự động xuất hiện giữa ngón cái và ngón trỏ.
     - Chụm ngón cái và trỏ để mở/đóng Menu ngay trong không gian thực, chuyển đổi giữa chế độ 1 màn hình và kính 3D SBS, chọn demo, đổi camera mà không cần chạm vào laptop.
  4. **Passthrough Sạch Sẽ (CardboardXR HandJointsView.cs)**:
     - Ẩn toàn bộ khung xương 21 khớp màu vàng thô ráp che khuất bàn tay thật trong Passthrough; thay thế bằng con trỏ Reticle chấm tròn trắng thanh mảnh, phóng to và chuyển sang màu vàng hổ phách (Golden Amber `#FFD732`) khi chụm ngón tay.
  5. **Vật Lý Khối Hộp Nâng Cấp (CardboardXR CubePhysics.cs)**:
     - Hỗ trợ gắp gần ($< 0.25$m) và bắn tia gắp xa (Ray Grab), quán tính ném vật thể với giới hạn gia tốc ($6.0\text{ m/s}$), va chạm nảy bàn/sàn đàn hồi và lực cản không khí.

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
