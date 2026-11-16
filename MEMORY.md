# Memory - Automated Control & Web Automation Project

## Current Status (v10.3.01 PRO & Hybrid 6DoF XR Architecture - Step 3 Complete)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.3.01 PRO** (Hoàn tất Bước 3 Kiến trúc Lai 6DoF Offloaded Tethered XR; Viết cầu nối C# Unity `NetworkPoseSource.cs` lắng nghe UDP Port 23457 từ Python Bridge; Tự động chuyển đổi hệ tọa độ iOS ARKit sang Unity Left-Handed; Nâng cấp `HeadPoseFusion.cs` hỗ trợ đa nền tảng PC Standalone RTX 4060 GPU; Tích hợp gọi Roamies JARVIS và phím Recenter).
- **Core Breakthroughs in v10.3.01 PRO (Step 3 Implementation)**:
  1. **Cầu Nối 6DoF Unity C# IPC (`NetworkPoseSource.cs`)**:
     - Lắng nghe luồng nhị phân 28 bytes (3 float vị trí $X, Y, Z$ + 4 float quaternion $Q_x, Q_y, Q_z, Q_w$) từ `stark_tethered_bridge.py` qua cổng `UDP 23457`.
     - Tự động chuyển đổi trục tọa độ quang học iOS ARKit (Right-Handed) sang Unity (Left-Handed) chuẩn xác:
       $$P_{\text{unity}} = (X, Y, -Z) \quad \text{và} \quad Q_{\text{unity}} = (Q_x, -Q_y, -Q_z, Q_w)$$
     - Trang bị bộ nội suy trơn tru `Lerp` / `Slerp` khử vi rung giật micro-jitter mạng.
     - Tích hợp Win32 `keybd_event` (`Ctrl + Shift + A`) gọi trợ lý AI Roamies J.A.R.V.I.S. bằng phím `J` và phím `R` để Recenter tọa độ thế giới ảo.
  2. **Tương Thích Đa Nền Tảng Với `HeadPoseFusion.cs`**:
     - Bổ sung trường `NetworkPoseSource m_NetworkPose` vào `HeadPoseFusion`.
     - Tự động ưu tiên đọc mẫu từ `NetworkPoseSource` khi chạy trên Unity Windows PC (tận dụng 100% sức mạnh Shader/Mesh của GPU NVIDIA RTX 4060), và tự fallback sang `ArPoseSource` khi build APK Android/IPA iOS.
     - Null-safety 100% cho các cảm biến phần cứng di động (`m_Tracker`, `m_ArPose`) khi chạy ở chế độ Standalone Windows.
  3. **Đồng Bộ Hóa Dự Án Toàn Diện**:
     - Cập nhật đầy đủ file C# và file `.meta` chuẩn GUID trong `CardboardXR-main/Assets/_Project/Scripts/Stereo/`.
     - Đồng bộ song song giữa `d:\BUISINESS\` và Desktop `C:\Users\LEGION\Desktop\stark mark ILX\`.
     - Kiểm thử tự động `test_diagnostics.py` đạt **7/7 PASS**.

---

## Past Milestones
- **v10.3.00 PRO**: Hoàn tất Bước 2 Kiến trúc Lai 6DoF Offloaded Tethered XR; Tích hợp ARKit VIO 6DoF World Tracking vào app iOS Swift `STARK_Cam_iOS`; Đóng gói gói tin nhị phân ghép kênh 28 Bytes `6DOF` qua cáp USB Lightning; Hiển thị Telemetry tọa độ 3D trên iPhone HUD; Kiểm thử đầu cuối đồng bộ 100% giữa Swift và Python bridge.
- **v10.2.99 PRO**: Hoàn tất Bước 1 Kiến trúc Lai 6DoF Offloaded Tethered XR; Tích hợp bộ giải mã nhị phân 6DoF Pose 28 Bytes; Nâng cấp SpatialCamera ma trận 6DoF thế giới thực; Chuyển MediaPipe sang RunningMode.VIDEO 3.5ms; Ước lượng độ sâu bàn tay Monocular True Depth; Tối ưu Zero-Allocation ROI PortalDemo; Sửa triệt để xung đột cử chỉ Roamies JARVIS.
- **v10.2.98 PRO**: Hợp nhất toàn bộ mã nguồn vào 1 thư mục duy nhất `code/`; Xóa toàn bộ các file `.bat` rời rạc; Thiết lập duy nhất 1 công cụ kiểm thử & khởi động hệ thống `CHAY_TEST_HE_THONG.bat`; Tích hợp bộ chẩn đoán tự động `test_diagnostics.py` đạt chuẩn 7/7 hạng mục.
- **v10.2.97 PRO**: Nâng cấp toán học quang học Thị sai Chiều sâu 2 Mắt Thật - True Stereoscopic Binocular Parallax; Khử hiện tượng hình phẳng sticker; Tạo độ dày khối 3D thực thụ khi nhìn qua kính VR Shinecon G10.
- **v10.2.96 PRO**: Bổ sung bảng code chạy trực tiếp từng ứng dụng cụ thể; Tích hợp CLI Arguments `--demo`, `--view`, `--cam`, `--distortion`; Tạo 7 file batch 1-click ngoài Desktop.
- **v10.2.95 PRO**: Port 100% tinh hoa mã nguồn `CardboardXR-main`: HandTurnGate chống bấm giả khi xoay tay; Video VR 360 & 180 SBS Player - Demo 7; Khử méo thấu kính Polynomial Radial Distortion; Nâng cấp Lưới App Library 2x4 Grid 8 Tiles.
- **STARK Spatial Computing & Roamies JARVIS Integration (v9.7.5)**: Hoàn tất biến iPhone thành Màn hình phụ thứ 2 của Windows qua Spacedesk & Wi-Fi Hotspot `STARK_VR`; Giải nén và phân tích mã nguồn `CardboardXR-main.zip`; Cấu hình Roamies JARVIS rảnh tay.
