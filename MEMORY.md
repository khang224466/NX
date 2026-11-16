# Memory - Automated Control & Web Automation Project

## Current Status (v10.3.04 PRO - Authentic CardboardXR Interaction Engine Overhaul)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.3.04 PRO** (Phẫu thuật toàn diện cơ chế điều khiển chuẩn 100% `CardboardXR`: `PinchRouter.cs` Rising-Edge State Machine, `HandInteractorRig.cs` Eye-Through-PinchPoint Ray, loại bỏ tia laser vô hình 750px gây bấm nhầm, loại bỏ lỗi nuốt cử chỉ `consumed=True` khi đang mở Toolbar, chuẩn hóa con trỏ `PinchPoint` duy nhất không giật nhảy, và Responsive Viewport Layout tự co giãn cho cả Webcam 640x480 lẫn 1280x720 / SBS 640x720).
- **Core Breakthroughs in v10.3.04 PRO (Authentic CardboardXR Control Overhaul)**:
  1. **Sửa lỗi Menu nuốt sạch cử chỉ 3D (`PinchRouter.cs` Rising-Edge & Claim Ownership)**:
     - Bản cũ đặt `if is_pinched: consumed = True` ở nhánh `else` khi `self.is_open == True` (mặc định mở!), khiến khi Toolbar đang hiển thị, người dùng chụm tay ở giữa màn hình không thể vẽ Paint 3D hay bắt khối hộp Cubes!
     - Đã port chuẩn `PinchRouter.cs`: Chỉ xét định tuyến tại **sườn lên (`just_pinched = is_pinched and not was_pinched`)** theo thứ tự `Settings Gear -> UI Button -> Demo/Grab`.
     - Khi chụm tay ở vùng không gian trống (`hovered_btn is None`), trả về `consumed = False` và khóa quyền sở hữu `active_route = "DEMO"`. Trong suốt lúc đang giữ Pinch để vẽ 3D hoặc kéo khối hộp, dù tay có lướt ngang qua các nút trên Toolbar cũng **tuyệt đối không bao giờ bấm nhầm nút**; và giữ Pinch trên nút chỉ click **đúng 1 lần duy nhất** (không bị lặp 3 lần/giây).
  2. **Loại bỏ Tia Laser Vô Hình 750px & Thay bằng Tia `Eye-Through-PinchPoint` (`HandInteractorRig.cs` dòng 85)**:
     - Bản cũ ẩn tia laser trên màn hình nhưng ngầm bên dưới vẫn phóng một đoạn thẳng dài 750px dọc theo xương ngón trỏ (`lms[5] -> lms[8]`) và dùng `intersects_segment` quét qua các nút ở đỉnh/đáy màn hình (`FLIP V`, `ROT 180`, `CLOSE`), gây bấm nhầm điên loạn; đồng thời trong `CubePhysicsDemo`, vector `lms[8] - lms[5]` chỉ lên trần nhà thay vì chỉ vào màn hình nên không thể gắp được khối hộp ở xa $1.1\text{m}$!
     - Đã thay bằng đúng công thức của `HandInteractorRig.cs`:
       $$\vec{d}_{\text{ray}} = \frac{P_{\text{pinch}} - P_{\text{head}}}{\|P_{\text{pinch}} - P_{\text{head}}\|}$$
       Tia đi từ **Mắt (`head_pos`) xuyên qua điểm giữa ngón cái & ngón trỏ (`PinchPoint`) thẳng vào chiều sâu màn hình**, kèm chấm tròn mục tiêu `HandRayView.cs` hiện ngay trên tâm khối hộp khi ngắm trúng (`is_hovered = True`).
  3. **Con trỏ `PinchPoint` Duy Nhất + `AimHistory` 0.16s + `PinchDetector` Bất Biến Khoảng Cách**:
     - Bản cũ đổi vị trí con trỏ từ đầu ngón trỏ `lms[8]` sang trung điểm `(lms[4]+lms[8])/2` ngay khoảnh khắc Pinch làm con trỏ giật nhảy 30px trượt khỏi nút. Đã hợp nhất về duy nhất `PinchPoint` lọc mượt + khóa điểm ngắm từ `0.16s` trước khi khép ngón (`AimHistory.cs`).
     - Nâng cấp `PinchDetector` kết hợp khoảng cách 3D (mét) và tỉ lệ 2D bất biến theo kích thước bàn tay (`pinch_px / palm_px`), nhạy bén ở mọi cự ly `25cm – 1.2m`.
  4. **Responsive Layout Cho Mọi Độ Phân Giải (`640x480`, `1280x720`, `640x720` SBS)**:
     - Bản cũ hardcode `tb_y = 628` nên khi chạy trên Webcam Laptop `640x480` (`h = 480`), toàn bộ thanh Toolbar nằm ngoài màn hình (`628 > 480`). Đã nâng cấp `_sync_layout(fw, fh)` tự động co giãn và căn giữa trên mọi độ phân giải, đồng thời cất các nút `FLIP V / MIRROR / ROT 180` vào trong bảng `APP LIBRARY` để không bao giờ bấm nhầm khi đang chơi.

---

## Past Milestones
- **v10.3.03 PRO**: Kiểm toán và sửa triệt để lỗi toán học Quaternion ARKit RH->LH `(-Qx, -Qy, Qz, Qw)`, lỗi dead-code/crash luồng nền trong `HeadPoseFusion.cs` & `NetworkPoseSource.cs`, lỗi lệch tâm 320px trên 1080p/SBS, và lỗi treo `.bat`.
- **v10.3.02 PRO**: Hoàn tất Bước 4; Auto `usbmux forward`, Unity Hybrid launcher, Diagnostics 8/8 PASS.
- **v10.3.01 PRO**: Hoàn tất Bước 3; `NetworkPoseSource.cs` UDP 23457 & `HeadPoseFusion.cs`.
- **v10.3.00 PRO**: Hoàn tất Bước 2; iOS Swift ARKit 6DoF + 28B Pose Mux.
- **v10.2.99 PRO**: Hoàn tất Bước 1; Python 6DoF Decoder + MediaPipe VIDEO mode 3.5ms.
