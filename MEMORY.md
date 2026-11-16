# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.98 PRO & Unified Code Architecture)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.98 PRO** (Hợp nhất toàn bộ mã nguồn vào 1 thư mục duy nhất `code/`; Xóa toàn bộ các file `.bat` rời rạc; Thiết lập duy nhất 1 công cụ kiểm thử & khởi động hệ thống `CHAY_TEST_HE_THONG.bat`; Tích hợp bộ chẩn đoán tự động `test_diagnostics.py` đạt chuẩn 7/7 hạng mục).
- **Core Breakthroughs in v10.2.98 PRO**:
  1. **Quy Hoạch Thư Mục Tinh Gọn**:
     - Xóa sạch 12 file `.bat` rác gây lộn xộn ngoài Desktop.
     - Gom toàn bộ mã nguồn Python (`stark_cardboard_xr.py`, `stark_spatial_menu.py`, `stark_tethered_bridge.py`, `stark_air_mouse.py`, `stark_usb_cam.py`), model AI `hand_landmarker.task`, HTML passthrough, và video 3D SBS vào thư mục duy nhất: `.\code\`
     - Thư mục Desktop `C:\Users\LEGION\Desktop\stark mark ILX\` đạt chuẩn sạch sẽ, chỉ giữ lại DUY NHẤT 1 file thực thi chính: `CHAY_TEST_HE_THONG.bat`.
  2. **Single Interactive Runner `CHAY_TEST_HE_THONG.bat`**:
     - Menu đánh số trực quan từ 0 đến 11, phím Enter mặc định kích hoạt Chế độ Tự động [1].
     - Tự động dò tìm luồng dữ liệu iPhone 13 qua cổng USB Lightning (120 FPS Direct Tether) hoặc tự fallback sang Webcam Laptop nếu chưa cắm cáp.
     - Tích hợp phím tắt khởi chạy độc lập từng ứng dụng từ App 1 đến App 7.
  3. **Bộ Chẩn Đoán Tự Động Toàn Diện `test_diagnostics.py`**:
     - Kiểm thử 7/7 hạng mục: Môi trường thư viện, AI Hand Landmarker GPU/CPU, Toán học thị sai lập thể 3D Parallax, Menu Vision Pro Palm Gate, Khởi tạo 7 Spatial Apps, Video Assets 360/180 SBS, Phần cứng Camera/Cáp kết nối USB. Đạt chuẩn 100% PASS.

---

## Past Milestones
- **v10.2.97 PRO**: Nâng cấp toán học quang học Thị sai Chiều sâu 2 Mắt Thật - True Stereoscopic Binocular Parallax; Khử hiện tượng hình phẳng sticker; Tạo độ dày khối 3D thực thụ khi nhìn qua kính VR Shinecon G10.
- **v10.2.96 PRO**: Bổ sung bảng code chạy trực tiếp từng ứng dụng cụ thể; Tích hợp CLI Arguments `--demo`, `--view`, `--cam`, `--distortion`; Tạo 7 file batch 1-click ngoài Desktop.
- **v10.2.95 PRO**: Port 100% tinh hoa mã nguồn `CardboardXR-main`: HandTurnGate chống bấm giả khi xoay tay; Video VR 360 & 180 SBS Player - Demo 7; Khử méo thấu kính Polynomial Radial Distortion; Nâng cấp Lưới App Library 2x4 Grid 8 Tiles.
- **STARK Spatial Computing & Roamies JARVIS Integration (v9.7.5)**: Hoàn tất biến iPhone thành Màn hình phụ thứ 2 của Windows qua Spacedesk & Wi-Fi Hotspot `STARK_VR`; Giải nén và phân tích mã nguồn `CardboardXR-main.zip`; Cấu hình Roamies JARVIS rảnh tay.
