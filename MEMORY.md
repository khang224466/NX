# Memory - Automated Control & Web Automation Project

## Current Status (v10.3.05 PRO - Video-Verified Close-Range Pinch & SBS 1:1 Cube Lock)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.3.05 PRO** (Phân tích trực tiếp 2 video thực tế của người dùng `v1` & `v2`; Sửa triệt để 4 lỗi thực tế khi cầm tay gần camera iPhone trong chế độ `SBS VR`: lệch hệ tọa độ 2x giữa `spatial_cam` 1280x720 và `eye_cam` 640x720, kẹt trạng thái Pinch vàng khi ngón tay mở gần camera, tuột khối hộp khi MediaPipe chớp mất tay 1 frame, và bấm nhầm nút `RESET CUBE` dưới ngón cái).
- **Core Breakthroughs in v10.3.05 PRO**:
  1. **Giải phẫu & Triển khai chuẩn Cơ chế Pinch của `CardboardXR` (`HandTracker.cs`, `HandGeometry.cs`, `HandSubsystemFeed.cs`)**:
     - Đo kích thước chuẩn ngay tại đốt đầu ngón tay (`tip_pad = 0.5 * (dist(7,8) + dist(3,4))`) và bề rộng khớp gốc ngón tay (`knuckle_w = 0.5 * (dist(5,9) + dist(9,13))`), kết hợp `hand_world_landmarks` 3D chuẩn hóa theo `HandGeometry.PalmSize` (`0.055m` trên 10 cặp `{0, 5, 9, 13, 17}`).
     - Miễn nhiễm 100% với hiệu ứng phóng đại góc rộng khi để bàn tay sát camera 10cm (khi cổ tay `0` bị khuất ngoài mép dưới khung hình như trong video của người dùng).
     - Tích hợp `k_OpenResults = 2` (phải mở rõ ràng 2 frame liên tiếp mới nhả) và `k_PinchKeptSeconds = 0.30s` (`hold_on_hand_lost`), chấm dứt hoàn toàn hiện tượng đang kéo khối hộp thì bị tuột tay khi MediaPipe chớp mắt 1–5 frame.
  2. **Đồng bộ 1:1 Hệ Tọa Độ `active_cam` trong Chế độ `SBS VR` (`640x720` Cropped Eye Space)**:
     - Phát hiện lỗi chí mạng trong video của người dùng: Khi chạy `SBS VR`, khối hộp được vẽ bằng `eye_cam` (`640x720`, cắt vùng giữa `orig_x1 .. orig_x1 + crop_w`), nhưng `pinch_pt_3d` lại được `unproject_2d` bằng `spatial_cam` (`1280x720` chưa cắt), làm tọa độ 3D của ngón tay lệch gấp 2 lần so với hình ảnh trong kính VR!
     - Đã sửa cả `stark_tethered_bridge.py` và `stark_cardboard_xr.py` dùng chung `active_cam` (`eye_cam` khi bật `SBS VR`), giúp tâm khối hộp bám khít 1:1 vào đúng chấm vàng `PinchPoint` giữa 2 đầu ngón tay.
  3. **Gắp & Xoay Khối Hộp Bám Khít 1:1 (`CubePhysicsDemo`) + Xóa nút `RESET CUBE` gây vướng**:
     - Cho phép gắp khối hộp ngay khi chạm vào vùng hover (không bị kẹt nếu chụm tay sớm 50ms trước khi chạm hộp), kéo `grab_ray_offset` hội tụ mượt về `0` để khối hộp nằm gọn giữa ngón cái và ngón trỏ, kèm xoay khối hộp theo góc nghiêng 2 ngón tay.
     - Xóa nút phụ `RESET CUBE` thừa thãi nằm chắn dưới ngón cái từng gây nổ vòng click trắng trong video `v2_f3.jpg`.

---

## Past Milestones
- **v10.3.04 PRO**: Phẫu thuật cơ chế điều khiển `PinchRouter` Rising-Edge, `Eye-Through-PinchPoint` Ray, Responsive 480p/720p layout.
- **v10.3.03 PRO**: Sửa lỗi toán học Quaternion ARKit RH->LH `(-Qx, -Qy, Qz, Qw)`, lỗi dead-code/crash luồng nền trong `HeadPoseFusion.cs` & `NetworkPoseSource.cs`, lỗi lệch tâm 320px trên 1080p/SBS, và lỗi treo `.bat`.
- **v10.3.02 PRO**: Hoàn tất Bước 4; Auto `usbmux forward`, Unity Hybrid launcher, Diagnostics 8/8 PASS.
