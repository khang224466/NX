# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.89 PRO & STARK Mark ILX Standalone Desktop Release)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.89 PRO** (Đóng gói trọn vẹn toàn bộ dự án Không Gian & Kính 3D thành folder độc lập `stark mark ILX` trên Desktop với bộ 4 Launcher 1-Click).
- **Packaging Details (C:\Users\LEGION\Desktop\stark mark ILX)**:
  1. **Launcher Scripts 1-Click Tại Gốc**:
     - `[1]_KHOI_DONG_STARK_XR_IPHONE_120FPS.bat`: Khởi động kết nối cáp USB Lightning iPhone 120 FPS mượt mà không độ trễ.
     - `[2]_KHOI_DONG_STARK_XR_LAPTOP_WEBCAM.bat`: Khởi động chế độ Standalone bằng Webcam Laptop.
     - `[3]_KHOI_DONG_ROAMIES_JARVIS_VOICE.bat`: Khởi động trợ lý giọng nói Roamies JARVIS rảnh tay.
     - `[4]_KHOI_DONG_AIR_MOUSE_DESKTOP.bat`: Khởi động chuột không gian Windows Desktop.
     - `HUONG_DAN_SU_DUNG_STARK_MARK_ILX.txt`: Hướng dẫn vận hành rảnh tay chi tiết.
  2. **Thư Mục Thành Phần Được Đóng Gói Đầy Đủ**:
     - `Stark_Air_Mouse_App/`: Toàn bộ mã nguồn Python XR (M3 Menu, AimHistory, 1€ Filter, Tethered Bridge).
     - `STARK_Cam_iOS/` & `STARK_Cam_iOS_IPA*`: Client camera iOS cho iPhone 13.
     - `CardboardXR/` & `CardboardXR_Windows/`: Mã nguồn Unity 6 C# và bản build Windows.
     - `Roamies/`: Cấu hình và daemon trợ lý ảo giọng nói.
  3. **Core Breakthroughs in v10.2.88 PRO (CardboardXR Port)**:
     - Hệ thống Giao diện Material 3 (`M3Theme`, frosted glass, Capsule Toolbar, App Library Grid 5 apps).
     - Bộ đệm `AimHistory.cs` triệt tiêu $5.6^\circ$ độ vặn ngón khi chụm ngón, chống trượt nút 100%.
     - visionOS Palm Gate: Xòe lòng bàn tay $\ge 0.2$s hiện nút bánh răng `MENU / CHỤM ĐỂ MỞ` rảnh tay.
     - Passthrough sạch sẽ ẩn khung xương 21 khớp, hiển thị con trỏ Reticle trắng $\rightarrow$ vàng hổ phách.
     - Vật lý CubePhysics gắp gần, gắp xa bằng tia và ném quán tính.

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
