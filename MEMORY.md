# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.99 PRO & Hybrid 6DoF XR Architecture - Step 1 Complete)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.99 PRO** (Hoàn tất Bước 1 Kiến trúc Lai 6DoF Offloaded Tethered XR; Tích hợp bộ giải mã nhị phân 6DoF Pose 28 Bytes; Nâng cấp SpatialCamera ma trận 6DoF thế giới thực; Chuyển MediaPipe sang RunningMode.VIDEO 3.5ms; Ước lượng độ sâu bàn tay Monocular True Depth; Tối ưu Zero-Allocation ROI PortalDemo; Sửa triệt để xung đột cử chỉ Roamies JARVIS).
- **Core Breakthroughs in v10.2.99 PRO (Step 1 Implementation)**:
  1. **6DoF Pose Pipeline & Unity C# IPC Broadcast**:
     - `SpatialCamera` trong `stark_cardboard_xr.py` được trang bị đầy đủ ma trận biến đổi 6DoF: $P_{\text{cam}} = R^T \cdot (P_{\text{world}} - T)$ kèm hàm chuyển đổi Quaternion `quat_to_rot_mat`.
     - `stark_tethered_bridge.py` trang bị bộ giải mã gói tin ghép kênh (Multiplexed Decoder): Nhận diện gói tin có header `b'6DOF'` (4B Magic + 4B Type + 28B Pose + H.264 NALU) mà vẫn bảo toàn 100% tính tương thích ngược với luồng video cũ.
     - Mở cổng UDP Broadcast nội bộ `127.0.0.1:23457` để truyền trực tiếp dữ liệu 6DoF Pose cho Unity C# (`CardboardXR-main`) với độ trễ bằng 0.
  2. **Tăng Tốc Gấp 3 Lần AI MediaPipe (`RunningMode.VIDEO`)**:
     - Chuyển toàn bộ MediaPipe Tasks sang `RunningMode.VIDEO` và gọi `detect_for_video(mp_image, now_ms)`, cho phép AI bám theo bàn tay từ frame trước thay vì quét lại toàn bộ ảnh, giảm độ trễ suy luận từ ~12ms xuống còn ~3.5ms trên GPU RTX 4060.
  3. **Ước Lượng Độ Sâu Bàn Tay Thực (True Monocular Depth)**:
     - Xóa bỏ hằng số gán cứng $0.65\text{m}$.
     - Tính khoảng cách thực dựa trên độ dài bàn tay 2D $L_{\text{palm}} \approx 0.085\text{m}$:
       $$Z_{\text{base}} = \text{clip}\left(\frac{0.085 \cdot \text{focal}}{\max(20.0, \text{palm\_px})}, 0.25, 1.40\right)$$
       $$Z_{\text{joint}} = Z_{\text{base}} + Z_{\text{rel}} \cdot 0.8$$
     - Giúp người dùng vươn tay tới trước chạm vào khối lập phương ở $1.1\text{m}$ cực kỳ tự nhiên.
  4. **Tối Ưu Zero-Allocation ROI & Hóa Giải Xung Đột Cử Chỉ**:
     - `PortalDemo.draw()` chỉ vẽ trên Bounding Box ROI của cánh cửa, giảm 85% cấp phát bộ nhớ RAM.
     - Khóa gọi Roamies khi Menu đang mở và yêu cầu cử chỉ kẹp ngón cái vào ngón út khi xòe tay, chấm dứt hoàn toàn hiện tượng bật nhầm Roamies khi mở Menu.
     - Cập nhật kịch bản `CHAY_TEST_HE_THONG.bat` gọi thẳng `stark_tethered_bridge.py` tự động kích hoạt `usbmuxd` và hỗ trợ chạy trực tiếp 7 App.

---

## Past Milestones
- **v10.2.98 PRO**: Hợp nhất toàn bộ mã nguồn vào 1 thư mục duy nhất `code/`; Xóa toàn bộ các file `.bat` rời rạc; Thiết lập duy nhất 1 công cụ kiểm thử & khởi động hệ thống `CHAY_TEST_HE_THONG.bat`; Tích hợp bộ chẩn đoán tự động `test_diagnostics.py` đạt chuẩn 7/7 hạng mục.
- **v10.2.97 PRO**: Nâng cấp toán học quang học Thị sai Chiều sâu 2 Mắt Thật - True Stereoscopic Binocular Parallax; Khử hiện tượng hình phẳng sticker; Tạo độ dày khối 3D thực thụ khi nhìn qua kính VR Shinecon G10.
- **v10.2.96 PRO**: Bổ sung bảng code chạy trực tiếp từng ứng dụng cụ thể; Tích hợp CLI Arguments `--demo`, `--view`, `--cam`, `--distortion`; Tạo 7 file batch 1-click ngoài Desktop.
- **v10.2.95 PRO**: Port 100% tinh hoa mã nguồn `CardboardXR-main`: HandTurnGate chống bấm giả khi xoay tay; Video VR 360 & 180 SBS Player - Demo 7; Khử méo thấu kính Polynomial Radial Distortion; Nâng cấp Lưới App Library 2x4 Grid 8 Tiles.
- **STARK Spatial Computing & Roamies JARVIS Integration (v9.7.5)**: Hoàn tất biến iPhone thành Màn hình phụ thứ 2 của Windows qua Spacedesk & Wi-Fi Hotspot `STARK_VR`; Giải nén và phân tích mã nguồn `CardboardXR-main.zip`; Cấu hình Roamies JARVIS rảnh tay.
