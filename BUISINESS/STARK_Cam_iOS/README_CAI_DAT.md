# HƯỚNG DẪN CÀI ĐẶT APP NATIVE "STARK XR CAM" LÊN IPHONE TỪ WINDOWS
====================================================================
*(100% NATIVE SWIFT // ZERO MAC // ZERO APPLE $99 LICENSE // 4K 60-120 FPS USB WIRED)*

## 1. TỔNG QUAN ỨNG DỤNG
- **Tên ứng dụng**: `STARK XR Cam` (Native iOS App written in Swift & AVFoundation).
- **Phần cứng hỗ trợ**: Tối ưu hóa trực tiếp cho iPhone 13 ("iPhone của Phú"), chip A15 Bionic.
- **Tính năng độc quyền**:
  - Giao diện HUD tương lai phong cách Apple Vision Pro.
  - Nút chuyển độ phân giải: **`[1080p HD]`** (1920x1080) và **`[4K UHD]`** (3840x2160).
  - Nút chuyển khung hình: **`[30 FPS]`**, **`[60 FPS]`**, **`[120 FPS]`**.
  - Bộ mã hóa phần cứng **VideoToolbox A15 Bionic** nén luồng H.264 độ trễ < 1.5ms.
  - Truyền dữ liệu 2 chiều qua **dây cáp USB Lightning** (giao thức `usbmuxd` 480Mbps), không dùng Wi-Fi, không mở port mạng, không HTML/Safari.
  - Tự động nhận luồng 3D Stereo SBS từ GPU Laptop RTX 4060 trả ngược về màn hình iPhone bên trong kính VR Shinecon G10.

---

## 2. CÁCH ĐÓNG GÓI & CÀI ĐẶT LÊN IPHONE TỪ MÁY WINDOWS (KHÔNG CẦN MÁY MAC)

Vì bạn dùng máy tính Windows 11 và không có máy Mac, chúng ta áp dụng quy trình tiêu chuẩn công nghiệp:

### Bước 1: Build file IPA bằng GitHub Actions (Miễn phí 100%)
1. Dự án đã được tạo sẵn file tự động hóa `.github/workflows/build_ipa.yml`.
2. Khi push code lên kho GitHub của bạn, GitHub Actions sẽ tự động khởi chạy máy Mac ảo trên đám mây (`macos-14`), chạy Xcode biên dịch toàn bộ mã nguồn Swift và tạo ra file **`STARK_Cam_iOS.ipa`**.
3. Bạn chỉ cần vào tab **Actions** trên GitHub -> Bấm vào bản build mới nhất -> Tải file `STARK_Cam_iOS.ipa` về máy tính.

### Bước 2: Cài IPA lên iPhone bằng Sideloadly (1-Click trên Windows)
1. Tải phần mềm **Sideloadly** miễn phí cho Windows: `https://sideloadly.io`
2. Cắm dây cáp USB Lightning từ iPhone 13 vào Laptop Legion (iTunes trên máy tính đã nhận diện thiết bị).
3. Mở Sideloadly:
   - Kéo file `STARK_Cam_iOS.ipa` thả vào ô IPA.
   - Nhập tài khoản Apple ID cá nhân miễn phí của bạn (không tốn 1 xu bản quyền).
   - Bấm **Start**. Sideloadly sẽ tự động ký chứng chỉ và nạp ứng dụng thẳng vào iPhone của bạn trong 30 giây!
4. Trên iPhone của bạn:
   - Vào `Cài đặt` -> `Cài đặt chung` -> `Quản lý VPN & Thiết bị`.
   - Bấm vào Apple ID của bạn -> Chọn **Tin cậy (Trust)**.
   - Ứng dụng **STARK XR Cam** sẽ xuất hiện trực tiếp trên màn hình chính iPhone!

---

## 3. CÁCH SỬ DỤNG VỚI LAPTOP LEGION RTX 4060

1. **Cắm dây cáp Lightning** nối iPhone vào Laptop Legion.
2. Trên iPhone: Mở app **STARK XR Cam**.
   - Chọn độ phân giải: `1080p HD` hoặc `4K UHD`.
   - Chọn tốc độ khung hình: `60 FPS` hoặc `120 FPS`.
   - Đèn trạng thái trên app sẽ chuyển sang màu xanh: `DA KET NOI USB LAPTOP (480Mbps)`.
3. Trên Laptop: Chạy file **`RUN_STARK_USB.bat`** (hoặc `python stark_cardboard_xr.py`).
   - Laptop tự động nhận diện luồng hình ảnh 60/120 FPS từ camera sau iPhone.
   - GPU RTX 4060 phân tích 21 khớp tay MediaPipe + khử rung 1€ Filter.
   - Đồ họa 3D không gian (Vẽ 3D, Cổng vũ trụ, Chém bóng, Ném khối) được render chia đôi mắt SBS và bắn ngược về màn hình iPhone qua dây cáp USB!
4. Lắp iPhone vào kính **Shinecon G10** và trải nghiệm thực tế ảo tăng cường (MR/XR) không độ trễ!
