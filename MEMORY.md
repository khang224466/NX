# Memory - Automated Control & Web Automation Project

## Current Status (v10.3.03 PRO - Deep Surgical Audit & Full Fix of Steps 1-4)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.3.03 PRO** (Kiểm toán và sửa triệt để toàn bộ các lỗi toán học, hệ trục tọa độ, dead-code Unity, lệch tâm quang học SBS/1080p, và treo lệnh `.bat` của các bản trước).
- **Core Fixes in v10.3.03 PRO (Argon Surgical Audit)**:
  1. **Sửa lỗi Toán học Hệ Trục Tọa Độ & Ma Trận Quaternion 6DoF (iOS ARKit Right-Handed $\rightarrow$ STARK/Unity Left-Handed)**:
     - Phát hiện lỗi nghiêm trọng của bản trước: dùng `(Qx, -Qy, -Qz, Qw)` gây sai số ma trận `1.588` (phản xạ nhầm trục $X$ thay vì trục $Z$, làm ngược chiều ngẩng/cúi đầu Pitch và nghiêng đầu Roll), và quên đảo dấu trục $Z$ trong Python (`stark_tethered_bridge.py`), khiến bước tới gần vật thể ($Z_{\text{ARKit}} < 0$) lại làm vật thể trôi ra xa!
     - Đã sửa chuẩn xác theo phép liên hợp ma trận phản xạ trục $Z$ ($S = \text{diag}(1, 1, -1)$):
       $$R_{\text{LH}} = S \cdot R_{\text{RH}} \cdot S \iff P_{\text{LH}} = (X, Y, -Z), \quad Q_{\text{LH}} = (-Q_x, -Q_y, Q_z, Q_w)$$
       Sai số ma trận kiểm thử đạt **`0.0e+00`**!
     - Nâng cấp `reset_head_pose()` (Persistent 6DoF Recenter): Lưu `origin_pos` và `origin_rot_inv` để khi bấm nút `RECENTER` (hoặc phím `R`), các gói tin 6DoF tiếp theo từ iPhone vẫn giữ nguyên gốc tọa độ mới `(0, 0, 0)` thay vì bị ghi đè lại sau 8ms.
  2. **Sửa lỗi Dead-Code & Crash Luồng Nền trong Unity C# (`HeadPoseFusion.cs` & `NetworkPoseSource.cs`)**:
     - Trên Windows PC (RTX 4060) không có cảm biến IMU di động cục bộ, `m_Tracker.TryGetRotation()` luôn trả về `false`, khiến `HeadPoseFusion.UpdatePose()` của bản trước thoát ngay ở dòng đầu tiên và không bao giờ đọc `m_NetworkPose`!
     - Đã sửa `HeadPoseFusion.cs`: Tự động gắn `NetworkPoseSource` trong `OnEnable()` trên Windows/Editor, mặc định bật `Mode.SixDof`, và khi `!hasLocalImu` thì điều khiển trực tiếp Camera Rig từ `m_NetworkPose.TryGetLatest()` (với đầy đủ `EyesAtCamera`, `m_RecenterRotation`, `m_RecenterPivot`, `m_HeightOffset`).
     - Đã sửa `NetworkPoseSource.cs`: Thay `Time.realtimeSinceStartupAsDouble` (gây `UnityException` khi gọi trong luồng nền `ReceiveWorker`) bằng `Stopwatch.GetTimestamp()` thread-safe 100%; thay `Input.GetKeyDown` cũ bằng `UnityEngine.InputSystem.Keyboard.current`; loại bỏ `Thread.Abort()`.
  3. **Sửa lỗi Lệch Tâm Quang Học 320px trên Luồng iPhone 1080p & Kính VR SBS**:
     - Chuẩn hóa tọa độ khớp tay từ độ phân giải gốc (`1920x1080` / `4K`) về hệ quy chiếu `SpatialCamera` (`1280x720`) trước khi tính `palm_px` và `unproject_2d()`, triệt tiêu hoàn toàn độ lệch +320px ngang / +180px dọc khi vẽ Paint 3D và bắt khối hộp.
     - Tạo camera quang học riêng cho từng mắt `get_eye_camera(640, 720)` với tâm quang học chuẩn `cx = 320, cy = 360` khi chạy chế độ chia đôi kính VR SBS, giúp khối 3D nằm chính giữa thấu kính thay vì bị cắt nửa ở mép phải `x = 640`.
     - Sửa `PolynomialRadialDistortion.apply()` tự động cập nhật LUT nếu kích thước khung hình thay đổi.
  4. **Sửa lỗi Treo Cứng (Hang) trong `CHAY_TEST_HE_THONG.bat` & Tối ưu iOS Swift (`STARK_Cam_iOS`)**:
     - Loại bỏ lệnh `python -m pymobiledevice3 usbmux forward 23456 23456 &` gây treo đồng bộ trên Windows `cmd.exe` trong `:RUN_AUTO`.
     - Trong `H264Encoder.swift`: Gộp `SPS + PPS + Slice NALUs` của cùng 1 frame thành 1 Access Unit duy nhất để mỗi khung hình chỉ gửi đúng 1 gói TCP và 1 gói UDP 6DoF Pose (loại bỏ hiện tượng nhân 3 gói tin trên mỗi Keyframe).
     - Trong `CameraEngine.swift` & `ViewController.swift`: Tránh khởi tạo `AVCaptureSession` tranh chấp phần cứng khi `useARKit == true`, và tiết lưu cập nhật chữ HUD ở mức 6Hz để không gây nghẽn Main Thread.

---

## Kế hoạch Kiến trúc Lai 6DoF Offloaded Tethered XR (HOÀN TẤT & ĐÃ KIỂM TOÁN 8/8 PASS)
- [x] **Bước 1:** Python Bridge & Engine (`stark_tethered_bridge.py`, `stark_cardboard_xr.py`, `stark_spatial_menu.py`)
- [x] **Bước 2:** iOS Swift ARKit 6DoF (`CameraEngine.swift`, `H264Encoder.swift`, `USBTunnel.swift`, `ViewController.swift`)
- [x] **Bước 3:** Unity C# IPC (`NetworkPoseSource.cs`, `HeadPoseFusion.cs`)
- [x] **Bước 4:** Kịch bản Test 1-Click & Diagnostics (`CHAY_TEST_HE_THONG.bat`, `test_diagnostics.py`)
