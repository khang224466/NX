# Memory - Automated Control & Web Automation Project

## Current Status (v10.6.01 PRO - Yaw-Only Gravity Recenter, Clean Pinch Grab Z-Occlusion & Reticle Polish)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.6.01 PRO** (Kiểm tra video thực tế `v9`: độ nét Retina 60FPS + Hand Occlusion + neo Tesseract 3D trên bàn khi quay máy đã chạy chuẩn; xử lý dứt điểm 3 lỗi còn sót từ `v9`).
- **Core Fixes in v10.6.01 PRO**:
  1. **Sửa vệt sọc đen chéo cạnh khối Cube (`v9_k0..k3`)**: `SmoothSpatialTracker6DoF.reset()` chỉ reset góc Yaw quanh trục trọng lực Y (`yawOnly`), giữ nguyên hướng thẳng đứng của ARKit Gravity. Nhờ vậy `shadowPlane` luôn nằm phẳng tròn trên mặt bàn ngay cả khi khởi động máy góc chúi xuống bàn (`-70°`), không bị nhìn nghiêng thành sọc đen.
  2. **Chống lẹm góc kính khi cầm Tesseract (`v9_k1, k3, k4`)**: Thu gọn bán kính khung xương tay tàng hình (`0.0058m`), ẩn đốt đầu ngón cái/trỏ (`3,4,7,8`) trong lúc đang cầm khối (`isGrabbed`) để lòng bàn tay vẫn che phía sau tự nhiên mà khối kính không bị cắn góc.
  3. **Dọn trùng vòng tròn ngắm (`v9_k1`)**: Tắt mesh 3D `handOccluderState.reticle` dư thừa, giữ lại duy nhất `smoothCursor` 2D sắc nét + `targetDot` khi khóa mục tiêu.
  4. **Kiểm chứng**: JS Syntax check OK, `test_native_diagnostics.cjs` (Desktop `code\`) đạt **6/6 PASS** (không cần cài lại IPA vì chỉ cập nhật logic PC).

---

## Past Milestones
- **v10.6.00 PRO**: Index-anchored pinch, top safe-zone toolbar, CAS GPU video sharpen, Predictive 6DoF (`14ms` VR / `10ms` MR sync), `48x48` Barrel/RGB Lens Optics, IPA `v1.0.6 Build 7` (`43996450856`).
- **v10.5.00 PRO**: Hardware NVENC H.264 `0x06` 60FPS return -> `AVSampleBufferDisplayLayer`, ARKit `vFovDeg` 32B Pose, PMREM Studio HDRI, Tesseract Glass Cube, Stencil Portal, Hand Z-Occlusion.
- **v10.4.01 PRO**: Sửa tràn viền `UILaunchScreen` (`43897415415`), `OffscreenCanvas` Worker, `0x05` ACK, Safari Mirror `/phone`.
- **v10.4.00 PRO**: Loại bỏ Python 100%, chuyển sang Node.js Native `usbmuxd` + WebCodecs NVDEC + Three.js WebGL2 + `@mediapipe/tasks-vision` GPU Delegate, tạo Skill `cardboard-xr-webgpu-engine`.
- **v10.3.06 PRO**: Tích hợp `VisualSLAM6DoF` + Frustum/Behind-Camera Culling trên bản Python.
- **v10.3.05 PRO**: Phân tích 2 video thực tế `v1` & `v2`; Sửa lệch 2x `active_cam` trong `SBS VR`, nâng cấp `PinchDetector` đo đốt đầu ngón tay + `hand_world_landmarks`, xóa nút phụ `RESET CUBE` gây bấm nhầm.
- **v10.3.04 PRO**: Phẫu thuật cơ chế điều khiển `PinchRouter` Rising-Edge, `Eye-Through-PinchPoint` Ray, Responsive 480p/720p layout.
- **v10.3.03 PRO**: Sửa lỗi toán học Quaternion ARKit RH->LH `(-Qx, -Qy, Qz, Qw)`, lỗi dead-code/crash luồng nền trong `HeadPoseFusion.cs` & `NetworkPoseSource.cs`, lỗi lệch tâm 320px trên 1080p/SBS, và lỗi treo `.bat`.
- **v10.3.02 PRO**: Hoàn tất Bước 4; Auto `usbmux forward`, Unity Hybrid launcher, Diagnostics 8/8 PASS.
