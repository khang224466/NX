# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.95 PRO & Full CardboardXR 1:1 Port Suite)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.95 PRO** (Tích hợp 100% tinh hoa mã nguồn `CardboardXR-main`: HandTurnGate chống bấm giả khi xoay tay; Video VR 360 & 180 SBS Player - Demo 7; Khử méo thấu kính Polynomial Radial Distortion; Nâng cấp Lưới App Library 2x4 Grid 8 Tiles; Đồng bộ Desktop `stark mark ILX`).
- **Core Breakthroughs in v10.2.95 PRO**:
  1. **Tích hợp `HandTurnGate` từ `PalmGesture.cs` & `HandSubsystemFeed.cs`**:
     - Đo lường đạo hàm góc xoay lòng bàn tay $\Delta \text{facing}/\Delta t$. Nếu bàn tay xoay lật $> 2.0/\text{s}$, hệ thống lập tức khóa cử chỉ Pinch trong $0.25\text{s}$.
     - Triệt tiêu 100% hiện tượng ngón tay cái và ngón trỏ chập vào nhau trong ảnh 2D khi bàn tay đi ngang mép camera, loại bỏ hoàn toàn các cú click ảo ngoài ý muốn.
  2. **Tích hợp Demo 7: Trình Phát Video Không Gian 360 & 180 SBS (`VideoVRDemo`)**:
     - Port trọn vẹn từ `CardboardXR VideoDemo.cs` & `VideoSphere.cs`, tích hợp 2 video mẫu `Sample_180_sbs.mp4` và `Sample_360.mp4`.
     - Tách 2 mắt Left/Right cho video VR180 SBS mang lại chiều sâu 3D thực tế ảo thật.
     - Thanh điều khiển M3 lơ lửng: Play/Pause, Tua nhanh/lùi 10s, Format switcher (VR180 SBS / 360 Sphere / 2D Cinema), Next clip.
  3. **Khử méo thấu kính quang học (`PolynomialRadialDistortion`)**:
     - Port từ `PolynomialRadialDistortion.cs` của Google Cardboard SDK: $p' = p(1 + 0.28r^2 + 0.08r^4)$.
     - Khử méo thấu kính VR Shinecon G10 với bảng tra cứu GPU `cv2.remap` siêu tốc ($0.75\text{ms}$).
  4. **Nâng cấp App Library thành 2x4 Grid (8 Ô Hoàn Chỉnh)**:
     - `PAINT 3D` | `PORTAL` | `ORB RUSH` | `CUBES` | `CALIPER` | `SPATIAL 3D` | `VIDEO VR` | `RECENTER`.
  5. **Đồng bộ hóa 100% Thư mục Desktop `C:\Users\LEGION\Desktop\stark mark ILX`**:
     - Chép file gốc `CardboardXR-main.zip` vào thư mục desktop.
     - Cập nhật bảng đối chiếu [BANG_DOI_CHIEU_TINH_NANG_CARDBOARDXR.md](file:///C:/Users/LEGION/Desktop/stark%20mark%20ILX/BANG_DOI_CHIEU_TINH_NANG_CARDBOARDXR.md).
     - Cập nhật danh sách lệnh [DANH_SACH_CODE_CHAY_UNG_DUNG.txt](file:///C:/Users/LEGION/Desktop/stark%20mark%20ILX/DANH_SACH_CODE_CHAY_UNG_DUNG.txt).

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
