# Memory - Automated Control & Web Automation Project

## Current Status (v10.5.00 PRO - Hardware NVENC H.264 60FPS Return, True ARKit VFOV Sync, PBR Tesseract 3D & Hand Z-Occlusion)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.5.00 PRO** (Khắc phục dứt điểm lỗi ảnh xuất ra iPhone bị mờ ở `540p JPEG 31 FPS` và nâng cấp toàn diện đồ họa 3D / che khuất tay / chuẩn hóa ống kính ARKit theo kiến trúc Varjo/Vision Pro/ALVR).
- **Core Breakthroughs in v10.5.00 PRO**:
  1. **Sửa triệt để lỗi mờ & tụt FPS trên màn hình iPhone (`31 FPS 540p JPEG` -> `60 FPS 720p Hardware H.264`)**:
     - **PC Engine (`stark_xr_gpu_engine.html`)**: Dùng trực tiếp `WebCodecs VideoEncoder` (`avc1.4d001f`, NVENC RTX 4060 `hardwareAcceleration: "prefer-hardware"`, `15–22 Mbps`, `annexb`) xuất thẳng NALU H.264 `1280x720 @ 60fps` qua **Opcode `0x06`** không cần GPU->CPU readback `toBlob`; Safari `/phone` dùng Worker JPEG `1280x720 q=0.84` qua `0x03`. Phím `[Q]` chuyển 4 chế độ (`H.264 720p 15M` / `H.264 ULTRA 22M` / `JPEG 720p` / `JPEG 540p`).
     - **Server & Native iOS (`stark_xr_native_server.cjs`, `USBTunnel.swift`, `ViewController.swift`)**: `USBTunnel` giữ đúng thứ tự các Access Unit H.264 (`00 00 00 01`), `ViewController` giải mã phần cứng qua **`AVSampleBufferDisplayLayer`** (`kCMSampleAttachmentKey_DisplayImmediately = true`, `.resizeAspectFill`) với 0ms cấp phát `UIImage`. Đã build xong IPA **`v1.0.5 (Build 6)`** trên GitHub Actions (run `43988440949`), tải về và đồng bộ sang Desktop.
  2. **Chuẩn hóa Ống kính 3D & Đồng bộ Anti-Swim (`1:1 ARKit VFOV` + `Pose Ring Buffer`)**:
     - `CameraEngine.swift` trích xuất tiêu cự thực `frame.camera.intrinsics.columns.1.y` tính `vFovDeg` thật gửi trong gói `6DOF Type 2 (32B)`. `SmoothSpatialTracker6DoF` tự khớp `camera.fov` + nội suy qua **Ring Buffer 32 mẫu (`poseDelayMs = 10ms`)** khớp độ trễ H.264 camera để khối 3D bám chặt mặt bàn khi lia điện thoại.
  3. **Nâng cấp Đồ họa 3D PBR & Hand Depth Occlusion (`stark_xr_gpu_engine.html`)**:
     - Thêm `ACESFilmicToneMapping`, `PMREMGenerator` studio HDRI (`scene.environment`), `stencil: true`.
     - **App 4 Tesseract Glass Cube**: Vỏ kính mờ `MeshPhysicalMaterial`, 12 thanh khung kim loại + 8 góc nổi 3D bắt sáng, 2 vòng gyro + lõi plasma xoay bên trong, bóng đổ tiếp xúc mềm chiếu thẳng xuống mặt bàn (co giãn theo độ cao) và xoay mượt theo cả chuyển động + xoắn cổ tay.
     - **App 2 Stencil Portal**: Cửa sổ không gian thật (`stencilRef: 1`) chỉ hiển thị chiều không gian sâu khi nhìn qua vòng portal.
     - **App 1 Capped Neon Tubes & App 6 Lit Solar System** + **Hand Z-Buffer Occluder (`21` đốt tay tàng hình `[O]`)** giúp ngón tay thật che khuất tự nhiên các vật thể 3D phía sau nó.
  4. **Kiểm chứng**:
     - `test_native_diagnostics.cjs` đạt **6/6 PASS** (phát hiện USB iPhone `DeviceID: 25`), JS Syntax check OK, roundtrip nhị phân giả lập (`gotPose32: true, gotFov: 44.5, gotH264OnUsb: true, leakedJpegToUsb: false, gotMirrorJpeg: true, gotAck: true`) đạt **PASS**.

---

## Past Milestones
- **v10.4.01 PRO**: Sửa tràn viền `UILaunchScreen` (`43897415415`), `OffscreenCanvas` Worker, `0x05` ACK, Safari Mirror `/phone`.
- **v10.4.00 PRO**: Loại bỏ Python 100%, chuyển sang Node.js Native `usbmuxd` + WebCodecs NVDEC + Three.js WebGL2 + `@mediapipe/tasks-vision` GPU Delegate, tạo Skill `cardboard-xr-webgpu-engine`.
- **v10.3.06 PRO**: Tích hợp `VisualSLAM6DoF` + Frustum/Behind-Camera Culling trên bản Python.
- **v10.3.05 PRO**: Phân tích 2 video thực tế `v1` & `v2`; Sửa lệch 2x `active_cam` trong `SBS VR`, nâng cấp `PinchDetector` đo đốt đầu ngón tay + `hand_world_landmarks`, xóa nút phụ `RESET CUBE` gây bấm nhầm.
- **v10.3.04 PRO**: Phẫu thuật cơ chế điều khiển `PinchRouter` Rising-Edge, `Eye-Through-PinchPoint` Ray, Responsive 480p/720p layout.
- **v10.3.03 PRO**: Sửa lỗi toán học Quaternion ARKit RH->LH `(-Qx, -Qy, Qz, Qw)`, lỗi dead-code/crash luồng nền trong `HeadPoseFusion.cs` & `NetworkPoseSource.cs`, lỗi lệch tâm 320px trên 1080p/SBS, và lỗi treo `.bat`.
- **v10.3.02 PRO**: Hoàn tất Bước 4; Auto `usbmux forward`, Unity Hybrid launcher, Diagnostics 8/8 PASS.
