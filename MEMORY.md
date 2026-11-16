# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.97 PRO & True Stereoscopic 3D Optics)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.97 PRO** (Nâng cấp toán học quang học Thị sai Chiều sâu 2 Mắt Thật - True Stereoscopic Binocular Parallax; Khử hiện tượng hình phẳng sticker; Tạo độ dày khối 3D thực thụ khi nhìn qua kính VR Shinecon G10).
- **Core Breakthroughs in v10.2.97 PRO**:
  1. **Toán Học Thị Sai Quang Học 2 Mắt Thực Sự (`SpatialCamera.project_3d`)**:
     - Thay thế hoàn toàn cơ chế trượt hằng số phẳng ($\pm 14\text{px}$) bằng công thức chuẩn nhãn khoa:
       $$\text{parallax}(z) = - \text{eye\_offset\_m} \cdot \text{focal} \cdot \left(\frac{1}{z} - \frac{1}{z_{\text{convergence}}}\right)$$
     - Khi $z < 1.35\text{m}$ (vật thể ở gần): Thị sai dương lớn (+45px đến +91px) $\rightarrow$ Vật thể nổi hẳn ra ngoài màn hình lơ lửng trước mắt người dùng.
     - Khi $z > 1.35\text{m}$ (vật thể ở xa): Thị sai âm $\rightarrow$ Vật thể chìm sâu vào đường chân trời.
     - Mặt trước và mặt sau của khối hộp có độ lệch thị sai 22px $\rightarrow$ Khối hộp có thể tích và độ dày nổi khối 3D thật 100%.
  2. **Đồng Bộ Hóa**:
     - Cập nhật `stark_cardboard_xr.py` và `stark_tethered_bridge.py`.
     - Đồng bộ ra Desktop `C:\Users\LEGION\Desktop\stark mark ILX\`.

---

## Past Milestones
- **v10.2.96 PRO**: Bổ sung bảng code chạy trực tiếp từng ứng dụng cụ thể; Tích hợp CLI Arguments `--demo`, `--view`, `--cam`, `--distortion`; Tạo 7 file batch 1-click ngoài Desktop.
- **v10.2.95 PRO**: Port 100% tinh hoa mã nguồn `CardboardXR-main`: HandTurnGate chống bấm giả khi xoay tay; Video VR 360 & 180 SBS Player - Demo 7; Khử méo thấu kính Polynomial Radial Distortion; Nâng cấp Lưới App Library 2x4 Grid 8 Tiles.
- **STARK Spatial Computing & Roamies JARVIS Integration (v9.7.5)**: Hoàn tất biến iPhone thành Màn hình phụ thứ 2 của Windows qua Spacedesk & Wi-Fi Hotspot `STARK_VR`; Giải nén và phân tích mã nguồn `CardboardXR-main.zip`; Cấu hình Roamies JARVIS rảnh tay.
