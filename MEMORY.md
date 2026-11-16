# Memory - Automated Control & Web Automation Project

## Current Status (v10.3.02 PRO & Hybrid 6DoF XR Architecture - Step 4 Complete / ALL STEPS DONE)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.3.02 PRO** (Hoàn tất Bước 4 / Bước cuối cùng trong Kế hoạch Kiến trúc Lai 6DoF Offloaded Tethered XR; Nâng cấp CHAY_TEST_HE_THONG.bat tự động kiểm tra và forward usbmuxd 23456; Thêm mục [12] Unity 6DoF Hybrid Mode, [13] USB Check, [14] Đồng bộ code; Nâng cấp test_diagnostics.py lên 8/8 hạng mục bao gồm kiểm thử toán học 6DoF Transform và Quaternion Rotation).
- **Core Breakthroughs in v10.3.02 PRO (Step 4 Final Implementation)**:
  1. **Kịch bản 1-Click `CHAY_TEST_HE_THONG.bat` (v10.3.02 PRO)**:
     - Tự động kiểm tra và khởi động `pymobiledevice3 usbmux forward 23456` trước khi chạy bất kỳ lệnh iPhone nào.
     - Hiển thị trạng thái kết nối iPhone USB ngay trên menu chính (Active / Inactive / Chưa cắm cáp).
     - **Mục [12] mới:** Khởi động Unity 6DoF Hybrid Mode — hiện sơ đồ luồng dữ liệu end-to-end trực quan rồi bật Python Bridge + Unity C# IPC đồng thời.
     - **Mục [13] mới:** Kiểm tra chi tiết trạng thái USB Forward (pymobiledevice3 version, list, port 23456, port 23457).
     - **Mục [14] mới:** Đồng bộ 1-click Desktop ↔ `d:\BUISINESS\` qua robocopy mirror.
  2. **Kiểm thử 8/8 hạng mục (`test_diagnostics.py`)**:
     - Hạng mục 8 mới: Kiểm thử 6DoF IPC Pipeline gồm phép biến đổi tịnh tiến, phép quay Quaternion 30°, tồn tại `NetworkPoseSource.cs`, và trạng thái UDP Port 23457.
     - Xác nhận toán học: Di chuyển đầu sang phải 0.5m → vật thể dịch sang trái 503px ✓, Quay đầu 30° → vật thể lệch sang trái px=59 ✓.

---

## Kế hoạch Kiến trúc Lai 6DoF Offloaded Tethered XR (HOÀN TẤT 4/4 BƯỚC)
- [x] **Bước 1 (v10.2.99):** Nâng cấp Python Bridge & Engine — 6DoF Pose Decoder, MediaPipe VIDEO mode 3.5ms, True Monocular Depth.
- [x] **Bước 2 (v10.3.00):** iOS Swift ARKit 6DoF — ARSession World Tracking, 28B Pose mux qua USB Lightning.
- [x] **Bước 3 (v10.3.01):** Unity C# IPC — NetworkPoseSource.cs UDP 23457, HeadPoseFusion đa nền tảng, Lerp/Slerp 6DoF.
- [x] **Bước 4 (v10.3.02):** Kịch bản Test 1-Click — Auto usbmux forward, Unity Hybrid launcher, Diagnostics 8/8 PASS.

---

## Past Milestones
- **v10.3.01 PRO**: Hoàn tất Bước 3 Kiến trúc Lai 6DoF; Viết cầu nối C# Unity `NetworkPoseSource.cs` lắng nghe UDP Port 23457; Chuyển đổi hệ tọa độ iOS ARKit sang Unity Left-Handed; Nâng cấp `HeadPoseFusion.cs` hỗ trợ đa nền tảng PC Standalone RTX 4060 GPU.
- **v10.3.00 PRO**: Hoàn tất Bước 2; Tích hợp ARKit VIO 6DoF World Tracking vào app iOS Swift `STARK_Cam_iOS`; Đóng gói gói tin nhị phân ghép kênh 28 Bytes `6DOF` qua cáp USB Lightning.
- **v10.2.99 PRO**: Hoàn tất Bước 1; Tích hợp bộ giải mã nhị phân 6DoF Pose 28 Bytes; Nâng cấp SpatialCamera ma trận 6DoF; Chuyển MediaPipe sang RunningMode.VIDEO 3.5ms; Ước lượng độ sâu bàn tay Monocular True Depth.
- **v10.2.98 PRO**: Hợp nhất toàn bộ mã nguồn vào 1 thư mục duy nhất `code/`; Thiết lập duy nhất 1 `CHAY_TEST_HE_THONG.bat`; Diagnostics 7/7 PASS.
- **v10.2.97 PRO**: True Stereoscopic Binocular Parallax; Khử hiện tượng hình phẳng sticker.
- **v10.2.96 PRO**: CLI Arguments `--demo`, `--view`, `--cam`, `--distortion`; 7 file batch 1-click.
- **v10.2.95 PRO**: Port 100% CardboardXR-main: HandTurnGate, Video VR 360/180, Polynomial Distortion, App Library 2x4 Grid.
- **STARK Spatial Computing & Roamies JARVIS Integration (v9.7.5)**: Spacedesk iPhone, CardboardXR-main.zip, Roamies JARVIS.
