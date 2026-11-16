# Memory - Automated Control & Web Automation Project

## Current Status (v10.3.00 PRO & Hybrid 6DoF XR Architecture - Step 2 Complete)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.3.00 PRO** (Hoàn tất Bước 2 Kiến trúc Lai 6DoF Offloaded Tethered XR; Tích hợp ARKit VIO 6DoF World Tracking vào app iOS Swift `STARK_Cam_iOS`; Đóng gói gói tin nhị phân ghép kênh 28 Bytes `6DOF` qua cáp USB Lightning; Hiển thị Telemetry tọa độ 3D trên iPhone HUD; Kiểm thử đầu cuối đồng bộ 100% giữa Swift và Python bridge).
- **Core Breakthroughs in v10.3.00 PRO (Step 2 Implementation)**:
  1. **Tích Hợp ARKit 6DoF Engine Trên iOS (`CameraEngine.swift`)**:
     - Sử dụng `ARSession` với cấu hình `ARWorldTrackingConfiguration` (World Alignment Gravity, 1080p 60FPS).
     - Trích xuất ma trận chuyển đổi camera thực tế `transform = frame.camera.transform`:
       - Vị trí thực trong phòng: $P = (X, Y, Z)$ tính bằng mét.
       - Hướng xoay đầu 4 chiều: Quaternion $Q = (Q_x, Q_y, Q_z, Q_w)$.
     - Hỗ trợ chế độ chuyển đổi linh hoạt giữa ARKit 6DoF (60 FPS) và AVCapture thuần túy (120 FPS High-Speed).
  2. **Ghép Kênh Nhị Phân 6DoF Pose Khung Hình (`H264Encoder.swift` & `USBTunnel.swift`)**:
     - Tạo cấu trúc `STARKPose6DoF` chuẩn hóa 28 bytes nhị phân Little-Endian (3 float Position + 4 float Quaternion).
     - Truyền `PoseBox` qua con trỏ `sourceFrameRefCon` trong `VideoToolbox VTCompressionSessionEncodeFrame`, đảm bảo mỗi lát cắt NALU H.264 nén phần cứng luôn gắn liền với đúng góc nhìn camera tại thời điểm đó (Zero Phase Lag).
     - Đóng gói TCP Stream siêu nhẹ:
       $$\text{Packet} = \text{[Length 4B]} + \text{[b'6DOF' 4B]} + \text{[Type 4B]} + \text{[Pose 28B]} + \text{[H.264 Payload]}$$
  3. **Đồng Bộ Hai Chiều & HUD iPhone (`ViewController.swift`)**:
     - Hiển thị tọa độ thời gian thực `6DoF (X, Y, Z)` trên thanh HUD của iPhone và trạng thái VIO (`Tracking`, `Limited`, `Relocalizing`).
     - Kiểm thử giải mã giả lập đầu cuối Python $\leftrightarrow$ Swift đạt độ chính xác $10^{-6}$, hệ thống bridge nhận diện và cập nhật `SpatialCamera` trơn tru.

---

## Past Milestones
- **v10.2.99 PRO**: Hoàn tất Bước 1 Kiến trúc Lai 6DoF Offloaded Tethered XR; Tích hợp bộ giải mã nhị phân 6DoF Pose 28 Bytes; Nâng cấp SpatialCamera ma trận 6DoF thế giới thực; Chuyển MediaPipe sang RunningMode.VIDEO 3.5ms; Ước lượng độ sâu bàn tay Monocular True Depth; Tối ưu Zero-Allocation ROI PortalDemo; Sửa triệt để xung đột cử chỉ Roamies JARVIS.
- **v10.2.98 PRO**: Hợp nhất toàn bộ mã nguồn vào 1 thư mục duy nhất `code/`; Xóa toàn bộ các file `.bat` rời rạc; Thiết lập duy nhất 1 công cụ kiểm thử & khởi động hệ thống `CHAY_TEST_HE_THONG.bat`; Tích hợp bộ chẩn đoán tự động `test_diagnostics.py` đạt chuẩn 7/7 hạng mục.
- **v10.2.97 PRO**: Nâng cấp toán học quang học Thị sai Chiều sâu 2 Mắt Thật - True Stereoscopic Binocular Parallax; Khử hiện tượng hình phẳng sticker; Tạo độ dày khối 3D thực thụ khi nhìn qua kính VR Shinecon G10.
- **v10.2.96 PRO**: Bổ sung bảng code chạy trực tiếp từng ứng dụng cụ thể; Tích hợp CLI Arguments `--demo`, `--view`, `--cam`, `--distortion`; Tạo 7 file batch 1-click ngoài Desktop.
- **v10.2.95 PRO**: Port 100% tinh hoa mã nguồn `CardboardXR-main`: HandTurnGate chống bấm giả khi xoay tay; Video VR 360 & 180 SBS Player - Demo 7; Khử méo thấu kính Polynomial Radial Distortion; Nâng cấp Lưới App Library 2x4 Grid 8 Tiles.
- **STARK Spatial Computing & Roamies JARVIS Integration (v9.7.5)**: Hoàn tất biến iPhone thành Màn hình phụ thứ 2 của Windows qua Spacedesk & Wi-Fi Hotspot `STARK_VR`; Giải nén và phân tích mã nguồn `CardboardXR-main.zip`; Cấu hình Roamies JARVIS rảnh tay.
