# Memory - Automated Control & Web Automation Project

## Current Status (v10.4.01 PRO - Fullscreen 60 FPS iPhone USB/Safari Pipeline & Worker OffscreenCanvas)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.4.01 PRO** (Kế thừa toàn bộ kiến trúc Zero-Python RTX 4060 WebCodecs/WebGL2 từ `v10.4.00 PRO`, giải quyết triệt để lỗi iPhone bị kẹt trong khung 3:2 và tụt FPS ~21.8 FPS trên màn hình điện thoại).
- **Core Upgrades in v10.4.01 PRO**:
  1. **Sửa lỗi Full Màn Hình 100% Tràn Viền (19.5:9 Edge-to-Edge)**:
     - **App iOS Native (`BUISINESS/STARK_Cam_iOS/`)**: Bổ sung `UILaunchScreen` (`UIImageRespectsSafeAreaInsets: false`), `UIRequiresFullScreen: true`, `prefersHomeIndicatorAutoHidden = true`, `SceneDelegate` full coordinate bounds, `.scaleAspectFill` + `clipsToBounds = true` trên `vrDisplayImageView`, và safe-zone HUD (`yTb = 588`, `ySub = 534`, App Library `330..506`) trong `stark_xr_gpu_engine.html`. Đã build xong IPA mới qua GitHub Actions (`43897415415`, 46s, `v1.0.4 Build 5`, `61,658 bytes`), tải về và đồng bộ sang Desktop.
     - **Zero-Install Safari Mirror (`/phone`)**: Tạo mới `stark_xr_phone_mirror.html` hiển thị `100dvw x 100dvh` (`viewport-fit=cover`, `object-fit: cover`), nhận khung hình `0x03` + gửi `DeviceOrientationEvent` (`type: "gyro"`) về GPU engine.
  2. **Tăng tốc Return Stream lên 60 FPS & Giảm Tắc Hàng đợi USB**:
     - **PC Engine (`stark_xr_gpu_engine.html`)**: Chuyển nén JPEG sang `OffscreenCanvas` Web Worker + `createImageBitmap` không khóa main thread (`960x540` q=0.58, auto fallback `800x450` q=0.50 khi RTT > 20ms, `[Q]` đổi `540p/720p/450p`), điều nhịp bằng wire ACK `0x05` của server, và tách `aiCanvas` GPU `640x360` kèm cache `lastAiFrameSeq` tránh chạy lặp MediaPipe trên frame trùng.
     - **Server & iOS Receiver (`stark_xr_native_server.cjs`, `USBTunnel.swift`, `ViewController.swift`, `CameraEngine.swift`, `H264Encoder.swift`)**: Bật `TCP_NODELAY` cả 2 đầu, mailbox `latestPendingJpeg` + skip-to-latest-frame cursor (bỏ dịch mảng O(N)), giải mã JPEG off-main-thread bằng `ImageIO` `CGImageSourceCreateImageAtIndex`, cấu hình ARKit `1280x720 @ 60fps` (`8–11 Mbps`) + dynamic reconfigure khi đổi resolution.
  3. **Kiểm chứng**:
     - Cả `d:\BUISINESS\Stark_Air_Mouse_App\test_native_diagnostics.cjs` và `C:\Users\LEGION\Desktop\stark mark ILX\code\test_native_diagnostics.cjs` đều đạt **6/6 PASS**; kiểm thử roundtrip WebSocket (`role`, `0x03`, `gyro`, `mirrorConnected`) đạt PASS.
     - Đã phân tích đối chiếu kiến trúc VR/MR chuẩn công nghiệp (MTP < 12–20ms, EKF + Predictive Tracking, Single-Pass Stereo + Distortion Mesh, Per-Pixel Depth Occlusion, Dual-Socket UDP/FEC, Client-side ATW) để đề xuất lộ trình nâng cấp `v10.5.00+`.

---

## Past Milestones
- **v10.4.00 PRO**: Loại bỏ Python 100%, chuyển sang Node.js Native `usbmuxd` + WebCodecs NVDEC + Three.js WebGL2 + `@mediapipe/tasks-vision` GPU Delegate, tạo Skill `cardboard-xr-webgpu-engine`.
- **v10.3.06 PRO**: Tích hợp `VisualSLAM6DoF` + Frustum/Behind-Camera Culling trên bản Python.
- **v10.3.05 PRO**: Phân tích 2 video thực tế `v1` & `v2`; Sửa lệch 2x `active_cam` trong `SBS VR`, nâng cấp `PinchDetector` đo đốt đầu ngón tay + `hand_world_landmarks`, xóa nút phụ `RESET CUBE` gây bấm nhầm.
- **v10.3.04 PRO**: Phẫu thuật cơ chế điều khiển `PinchRouter` Rising-Edge, `Eye-Through-PinchPoint` Ray, Responsive 480p/720p layout.
- **v10.3.03 PRO**: Sửa lỗi toán học Quaternion ARKit RH->LH `(-Qx, -Qy, Qz, Qw)`, lỗi dead-code/crash luồng nền trong `HeadPoseFusion.cs` & `NetworkPoseSource.cs`, lỗi lệch tâm 320px trên 1080p/SBS, và lỗi treo `.bat`.
- **v10.3.02 PRO**: Hoàn tất Bước 4; Auto `usbmux forward`, Unity Hybrid launcher, Diagnostics 8/8 PASS.
