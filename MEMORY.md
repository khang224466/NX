# Memory - Automated Control & Web Automation Project

## Current Status (v10.7.00 PRO - True 3D Spatial AR/VR Room, Locked 60 FPS Zero-Copy GPU Pipeline & CardboardXR iOS Prep)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.7.00 PRO** (Phân tích video thực tế `v10a`, `v10b`: hết sọc đen & chữ sắc nét, nhưng thiếu môi trường 3D xung quanh và khung hình bị giật ~27.8 FPS trên iPhone; nâng cấp toàn diện kiến trúc render & thêm pipeline build `CardboardXR.ipa` lên iPhone).
- **Core Upgrades in v10.7.00 PRO**:
  1. **Môi trường 3D Không gian Thực thụ (`envState`, phím `[E]` & nút `[E] AR ROOM / VR 3D / CAM`)**:
     - `AR ROOM` (mặc định): Sàn lưới hologram `8m x 8m` mờ dần theo bán kính, 3 vòng radar định tâm, 4 trụ neo hologram góc phòng (parallax 6DoF mạnh) và 80 hạt bụi ánh sáng 3D trôi nổi.
     - `VR 3D` (Port 1:1 từ CardboardXR Unity): Tắt luồng camera, dựng phòng Courtyard `10m x 5m x 10m` lát gạch caro neon, bầu trời đêm 900 ngôi sao (`NightSkyDome`), bệ đỡ Hologram ở trung tâm, 6 khối định hướng màu CardboardXR (Đỏ/Trắng/Xanh lá/Xanh dương/Tím/Hổ phách) và bàn tay Cyber-Hand cyan phát sáng thay cho Z-occlusion.
  2. **Khóa Mượt 60 FPS Zero-Copy WebGL2 + Async Throttled AI**:
     - `<canvas id="composite-canvas">` đóng vai trò trực tiếp là WebGL2 swapchain (`alpha: false`, `renderer` vẽ thẳng `uiFullOverlayScene` `1280x720` & thanh chia đen SBS VR trong GPU), loại bỏ hoàn toàn `glCanvas -> 2D compCtx.drawImage` và `getImageData` khi đã có ARKit 6DoF.
     - Đảo thứ tự `animate()`: Render WebGL2 + đẩy NVENC H.264 (`0x06`) lên trước với `applyToCamera(..., dt)` bất biến tần số quét và pipelining USB 18ms/10ms gate; chuyển `handLandmarker.detectForVideo` xuống SAU render ở nhịp `>= 32ms` (~30Hz) để không bao giờ chặn VSync 60 FPS.
  3. **Boost CardboardXR (`Unity 6000.6.8f1`) thành công lên iPhone (`CardboardXR.ipa` 44.61 MB)**:
     - Vượt qua lỗi `game-ci` `UNITY_SERIAL=x` bằng auth thẳng `Unity.Licensing.Client --activate-all --include-personal` trong container `unityci/editor:ubuntu-6000.6.8f1-ios-3`, sửa lỗi C# `CS0165` (`trackerRotation`) trong [HeadPoseFusion.cs](BUISINESS/CardboardXR/CardboardXR-main/Assets/_Project/Scripts/Stereo/HeadPoseFusion.cs), hoàn tất Run **#44010618198** (`Export Xcode 12m3s` -> `macOS Archive IPA 13m17s`) và tải xác minh `CardboardXR.ipa` (`72` entries, `46,775,425 bytes`) tại `BUISINESS/CardboardXR/Builds_IPA/CardboardXR.ipa`.
  4. **Kiểm chứng**: JS `vm.Script` + `node -c` + `YAML_OK` + `test_native_diagnostics.cjs` (`Desktop\stark mark ILX\code\`) đạt **6/6 PASS** (không cần cài lại `STARK_Cam_iOS.ipa` v1.0.6 Build 7).

---

## Past Milestones
- **v10.6.01 PRO**: Yaw-only gravity recenter, ẩn đốt đầu ngón khi cầm Tesseract tránh lẹm kính, bỏ reticle 3D trùng lặp.
- **v10.6.00 PRO**: Index-anchored pinch, top safe-zone toolbar, CAS GPU video sharpen, Predictive 6DoF (`14ms` VR / `10ms` MR sync), `48x48` Barrel/RGB Lens Optics, IPA `v1.0.6 Build 7` (`43996450856`).
- **v10.5.00 PRO**: Hardware NVENC H.264 `0x06` 60FPS return -> `AVSampleBufferDisplayLayer`, ARKit `vFovDeg` 32B Pose, PMREM Studio HDRI, Tesseract Glass Cube, Stencil Portal, Hand Z-Occlusion.
- **v10.4.01 PRO**: Sửa tràn viền `UILaunchScreen` (`43897415415`), `OffscreenCanvas` Worker, `0x05` ACK, Safari Mirror `/phone`.
- **v10.4.00 PRO**: Loại bỏ Python 100%, chuyển sang Node.js Native `usbmuxd` + WebCodecs NVDEC + Three.js WebGL2 + `@mediapipe/tasks-vision` GPU Delegate, tạo Skill `cardboard-xr-webgpu-engine`.
- **v10.3.06 PRO**: Tích hợp `VisualSLAM6DoF` + Frustum/Behind-Camera Culling trên bản Python.
- **v10.3.05 PRO**: Phân tích 2 video thực tế `v1` & `v2`; Sửa lệch 2x `active_cam` trong `SBS VR`, nâng cấp `PinchDetector` đo đốt đầu ngón tay + `hand_world_landmarks`, xóa nút phụ `RESET CUBE` gây bấm nhầm.
- **v10.3.04 PRO**: Phẫu thuật cơ chế điều khiển `PinchRouter` Rising-Edge, `Eye-Through-PinchPoint` Ray, Responsive 480p/720p layout.
- **v10.3.03 PRO**: Sửa lỗi toán học Quaternion ARKit RH->LH `(-Qx, -Qy, Qz, Qw)`, lỗi dead-code/crash luồng nền trong `HeadPoseFusion.cs` & `NetworkPoseSource.cs`, lỗi lệch tâm 320px trên 1080p/SBS, và lỗi treo `.bat`.
- **v10.3.02 PRO**: Hoàn tất Bước 4; Auto `usbmux forward`, Unity Hybrid launcher, Diagnostics 8/8 PASS.
