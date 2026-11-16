# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.91 PRO & 3D Spatial Sim + CardboardXR Feature Matrix)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.91 PRO** (Bổ sung Mô phỏng Không gian Vũ trụ 3D `SpatialSimDemo` - Demo 6; Lập bảng đối chiếu 1:1 từng chức năng với CardboardXR; Xuất file danh sách code chạy ứng dụng ra thư mục Desktop).
- **Core Breakthroughs in v10.2.91 PRO**:
  1. **Bổ Sung Demo 6: Mô Phỏng Không Gian Vũ Trụ 3D (`SpatialSimDemo`)**:
     - **Sàn Lưới Tọa Độ Chiều Sâu 3D (Depth Horizon Grid)**: Lưới phối cảnh $X-Z$ mở rộng từ $0.6\text{m}$ đến $2.6\text{m}$ (y = -0.42m) tạo cảm giác chiều sâu không gian vượt trội trong kính 3D.
     - **Hệ Thiên Thể Chuyển Động Đa Tầng**: Mặt trời trung tâm tỏa hào quang ánh sáng, Cyber Node quay nhanh, Trái Đất có Mặt Trăng quay quanh, Sao Thổ có vành đai elip lơ lửng.
     - **Tương Tác Thuần Ngón Tay**: Đưa đầu ngón tay lại gần bất kỳ hành tinh nào ($< 0.20\text{m}$), hành tinh đó sáng bừng và hiển thị bảng đo đạc tọa độ thực ($X, Y, Z$) theo mét. Chụm ngón tay vào không gian để nắm và xoay tự do mặt phẳng quỹ đạo 3D.
     - **Nâng Cấp Lưới App Library Thành 2x3 Grid (6 Ứng Dụng)**:
       `PAINT 3D` | `PORTAL` | `ORB RUSH` | `CUBES` | `CALIPER` | `SPATIAL 3D`.
  2. **Bảng Đối Chiếu Tính Năng Từng Chức Năng Với CardboardXR**:
     - Đã lập và xuất file [BANG_DOI_CHIEU_TINH_NANG_CARDBOARDXR.md](file:///C:/Users/LEGION/Desktop/stark%20mark%20ILX/BANG_DOI_CHIEU_TINH_NANG_CARDBOARDXR.md) so sánh chi tiết từng file C# gốc (`M3Theme.cs`, `AimHistory.cs`, `PalmGesture.cs`, `HandJointsView.cs`, `StereoBuilder.cs`, `LensDistortion.cs`, `CubePhysics.cs`, `ThermalGovernor.cs`) với mã nguồn Python XR.
  3. **Danh Sách Code Chạy Ứng Dụng Tại Thư Mục Desktop Gốc**:
     - Đã tạo file [DANH_SACH_CODE_CHAY_UNG_DUNG.txt](file:///C:/Users/LEGION/Desktop/stark%20mark%20ILX/DANH_SACH_CODE_CHAY_UNG_DUNG.txt) liệt kê tất cả các lệnh Terminal / PowerShell / CMD trực tiếp, 4 file `.bat` 1-click và bảng phím tắt runtime.

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
