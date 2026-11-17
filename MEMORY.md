# Memory - Automated Control & Web Automation Project

## Current Status (v10.6.00 PRO - Ergonomic Index-Anchored Pinch, Top-Clear UI, CAS Sharpen, Predictive VR 6DoF & 48x48 Lens Optics)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.6.00 PRO** (Khắc phục toàn bộ điểm nghẽn điều khiển từ video `v8`: cursor bám đầu ngón trỏ không hụt, dọn toolbar lên safe band trên để vùng tay trống 100%, bỏ xoay lộn khi di chuyển Cube, kết hợp bổ sung bộ kiến trúc VR/MR nâng cao).
- **Core Upgrades in v10.6.00 PRO**:
  1. **Sửa triệt để lỗi "khó điều khiển" (`v8`)**:
     - **Index-Anchored Pinch Aim (`0.78 * index + 0.22 * thumb` lúc rê, `0.58/0.42` lúc kẹp)** + giảm `AimHistory` từ `140ms -> 45ms` + `smoothCursor 0.80` giúp điểm ngắm dính sát đầu ngón trỏ khi bấm nút & gắp vật.
     - **Vòng tròn `pinchProgress` (`0..1`)** thu nhỏ theo độ khép ngón + nới ngưỡng góc nghiêng (`padRatio < 1.32`, `open > 1.56`) + debounce click `280ms`.
     - **Toolbar lên vùng an toàn trên (`yTb = 72..110`, App Library `y = 124..300`)**: Giải phóng hoàn toàn 75% nửa dưới màn hình khỏi chạm nhầm `[0] SBS VR` / `[+] APPS` khi giơ tay.
     - **App 4 Tesseract Cube Ergonomics**: Tự động neo `firstHardwareAnchored` ngay khi nhận Pose 6DoF đầu tiên, tia laser ngắm (`laserLine`), vùng hút `2.15x`, kéo Z đẩy ra/vào theo khoảng cách tay, chỉ xoay nhẹ theo góc cổ tay (`da * 1.45`) không xoay lộn khi kéo ngang, kèm badge chỉ hướng khi khối ra khỏi khung hình.
     - **App iOS (`v1.0.6 Build 7`, `43996450856`, `71,933 bytes`)**: Sửa lỗi nhãn `USB LAPTOP 480M` đè lên `FPS: 60.0` và tự ẩn HUD sau `1.5s` khi kết nối XR.
  2. **Triển khai các Cải tiến Kiến trúc VR/MR Chuyên sâu**:
     - **Predictive Tracking (`xrLocateViews` horizon `14ms`) + Ring Buffer `10ms` Passthrough Sync**: Extrapolate vị trí + quaternion từ vận tốc góc trong `SBS VR` và bù trễ camera trong `1-SCR`.
     - **Single-Pass CAS Video Sharpen GLSL (`bgMat`)**: Làm nét chi tiết chữ/bàn trực tiếp trên RTX 4060 GPU mà không gây quầng halo.
     - **`48x48` Pre-Calculated Barrel Distortion Mesh + R/G/B Lateral Chromatic Aberration + Hidden Area Vignette Mask (`[B]` bật/tắt)**: Khử méo thấu kính và viền cầu vồng ở ms cuối trong `SBS VR`.
  3. **Kiểm chứng**:
     - `test_native_diagnostics.cjs` (Desktop `code\`) đạt **6/6 PASS** (iPhone USB `DeviceID: 27`), `STARK_Cam_iOS.ipa` `v1.0.6 Build 7` build & tải thành công (`71,933 bytes`, `Has binary: True`, `UILaunchScreen`), JS syntax OK.

---

## Past Milestones
- **v10.5.00 PRO**: Hardware NVENC H.264 `0x06` 60FPS return -> `AVSampleBufferDisplayLayer`, ARKit `vFovDeg` 32B Pose, PMREM Studio HDRI, Tesseract Glass Cube, Stencil Portal, Hand Z-Occlusion.
- **v10.4.01 PRO**: Sửa tràn viền `UILaunchScreen` (`43897415415`), `OffscreenCanvas` Worker, `0x05` ACK, Safari Mirror `/phone`.
- **v10.4.00 PRO**: Loại bỏ Python 100%, chuyển sang Node.js Native `usbmuxd` + WebCodecs NVDEC + Three.js WebGL2 + `@mediapipe/tasks-vision` GPU Delegate, tạo Skill `cardboard-xr-webgpu-engine`.
- **v10.3.06 PRO**: Tích hợp `VisualSLAM6DoF` + Frustum/Behind-Camera Culling trên bản Python.
- **v10.3.05 PRO**: Phân tích 2 video thực tế `v1` & `v2`; Sửa lệch 2x `active_cam` trong `SBS VR`, nâng cấp `PinchDetector` đo đốt đầu ngón tay + `hand_world_landmarks`, xóa nút phụ `RESET CUBE` gây bấm nhầm.
- **v10.3.04 PRO**: Phẫu thuật cơ chế điều khiển `PinchRouter` Rising-Edge, `Eye-Through-PinchPoint` Ray, Responsive 480p/720p layout.
- **v10.3.03 PRO**: Sửa lỗi toán học Quaternion ARKit RH->LH `(-Qx, -Qy, Qz, Qw)`, lỗi dead-code/crash luồng nền trong `HeadPoseFusion.cs` & `NetworkPoseSource.cs`, lỗi lệch tâm 320px trên 1080p/SBS, và lỗi treo `.bat`.
- **v10.3.02 PRO**: Hoàn tất Bước 4; Auto `usbmux forward`, Unity Hybrid launcher, Diagnostics 8/8 PASS.
