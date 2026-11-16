# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.96 PRO & Spatial Apps Code Table)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.96 PRO** (Bổ sung bảng code chạy trực tiếp từng ứng dụng cụ thể trong hệ thống: Paint 3D, Portal, Orb Rush, Cubes Physics, Caliper 3D, Spatial 3D Universe, Video VR; Tích hợp CLI Arguments `--demo`, `--view`, `--cam`, `--distortion`; Tạo 7 file batch 1-click ngoài Desktop).
- **Core Breakthroughs in v10.2.96 PRO**:
  1. **Bảng Code Chạy Trực Tiếp Từng Ứng Dụng Cụ Thể**:
     - Đã tạo file [BANG_CODE_CHAY_CAC_UNG_DUNG.md](file:///C:/Users/LEGION/Desktop/stark%20mark%20ILX/BANG_CODE_CHAY_CAC_UNG_DUNG.md) và [BANG_CODE_CHAY_CAC_UNG_DUNG.txt](file:///C:/Users/LEGION/Desktop/stark%20mark%20ILX/BANG_CODE_CHAY_CAC_UNG_DUNG.txt) tại thư mục gốc ngoài Desktop.
     - Liệt kê toàn bộ cú pháp lệnh Terminal / PowerShell / CMD để chạy thẳng vào từng ứng dụng mà không cần qua menu tổng.
  2. **Tích hợp Tham số Dòng lệnh (CLI Arguments) cho Engine**:
     - `stark_cardboard_xr.py` & `stark_tethered_bridge.py` hỗ trợ:
       `--demo <1-7 hoặc tên>`, `--view <mono|sbs>`, `--cam <0|1|2>`, `--distortion`.
  3. **Tạo 7 File 1-Click `.bat` Chạy Trực Tiếp Từng Ứng Dụng Ngoài Desktop**:
     - `[APP_1]_CHAY_PAINT_3D.bat`
     - `[APP_2]_CHAY_AR_PORTAL.bat`
     - `[APP_3]_CHAY_ORB_RUSH.bat`
     - `[APP_4]_CHAY_CUBES_PHYSICS.bat`
     - `[APP_5]_CHAY_3D_CALIPER.bat`
     - `[APP_6]_CHAY_SPATIAL_UNIVERSE_3D.bat`
     - `[APP_7]_CHAY_VIDEO_VR_360.bat`

---

## Past Milestones
- **v10.2.95 PRO**: Port 100% tinh hoa mã nguồn `CardboardXR-main`: HandTurnGate chống bấm giả khi xoay tay; Video VR 360 & 180 SBS Player - Demo 7; Khử méo thấu kính Polynomial Radial Distortion; Nâng cấp Lưới App Library 2x4 Grid 8 Tiles.
- **STARK Spatial Computing & Roamies JARVIS Integration (v9.7.5)**:
  1. Hoàn tất biến iPhone thành Màn hình phụ thứ 2 (Secondary Monitor) của Windows qua Spacedesk & Wi-Fi Hotspot `STARK_VR` (2.4GHz). Windows nhận diện `DISPLAY9` với độ phân giải siêu nét `2532 x 1170` (Super Retina XDR OLED). Đã kích hoạt chế độ Extend mở rộng màn hình.
  2. Giải nén và phân tích chuyên sâu mã nguồn `CardboardXR-main.zip` (Unity 6 C#): Nắm trọn kiến trúc 6DoF SLAM + IMU EKF fusion, camera passthrough mono, 3D hand tracking (MediaPipe BlazeHand), cơ chế Gaze + Pinch hysteresis, nắn méo thấu kính `LensDistortion.cs`, và cơ chế Thermal Governor giải quyết hiện tượng quá nhiệt.
  3. Cấu hình Roamies JARVIS (`sidekick.json`): Bật `"autoListen": true` và `"voice": true` với skin `"jarvis"`, cho phép trò chuyện bằng giọng nói rảnh tay (Hands-free Voice AI) qua tai nghe không dây khi đang đeo kính thực tế ảo Shinecon G10.
- **v10.2.36**: Two-way handshake & heartbeat between EduNext and Bridge, encrypted true Gemini key, auto-sync UI.
- **v10.2.35**: Tampermonkey chat scanner, 429 defense, anti-pro ban, auto-drag VIP key, 3 lessons/week quota across packages.
- **v10.2.18**: Smart winner model caching (`gemini-flash-lite-latest`), filtered Gemma/2.5 models, added 7.5s abort timeout.
- **v10.2.10**: Closed-loop automation (Write 'Sẵn sàng' -> Track submit button -> Solve next question -> Loop until complete).
