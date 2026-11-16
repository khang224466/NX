# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.90 PRO & Pure Fingertip In-Air Interaction)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.90 PRO** (Xóa bỏ hoàn toàn đường kẻ tia laser vướng tầm nhìn; chuyển 100% sang tương tác thuần ngón tay: Direct Fingertip Touch + Pinch Amber Haptic Ring).
- **Core Breakthroughs in v10.2.90 PRO (Pure Fingertip Interaction)**:
  1. **Xóa Bỏ Hoàn Toàn Tia Laser (Zero Laser Visuals)**:
     - Xóa bỏ triệt để hàm vẽ `draw_pointing_ray`: Không còn bất kỳ đường kẻ tia laser dài nào phóng ra từ ngón tay gây vướng mắt hoặc làm mất tính chân thực của AR Passthrough.
  2. **Tương Tác Thuần Bằng Ngón Tay (Direct In-Air Fingertip Touch)**:
     - **Khi di chuyển ngón tay (Idle)**: Con trỏ chấm tròn trắng tinh tế bám trực tiếp tại đầu ngón tay trỏ (`p_tip`), đi theo ngón tay 1:1.
     - **Khi lướt qua nút bấm (Direct Hover)**: Bán kính vùng chạm ngón tay được mở rộng tự nhiên (`margin = 16px`), chỉ cần đầu ngón tay chạm nhẹ vào nút là nút phát sáng tím (`M3Theme.Primary`).
     - **Khi chụm ngón (Pinch)**: Con trỏ chuyển ngay sang màu vàng hổ phách (`Golden Amber #FFD732`) kèm vòng sóng xúc giác Haptic Ripple (`r = 14px`) ngay tại điểm tiếp xúc giữa ngón cái và ngón trỏ để kích hoạt nút bấm.
  3. **Đồng Bộ Trọn Gói Về Desktop `stark mark ILX`**:
     - Cập nhật đồng bộ toàn bộ file mã nguồn mới nhất vào thư mục `C:\Users\LEGION\Desktop\stark mark ILX\Stark_Air_Mouse_App`.

---

## Past Milestones
- **STARK Spatial Computing & Roamies JARVIS Integration (v9.7.5)**:
  1. Hoàn tất biến iPhone thành Màn hình phụ thứ 2 (Secondary Monitor) của Windows qua Spacedesk & Wi-Fi Hotspot `STARK_VR` (2.4GHz). Windows nhận diện `DISPLAY9` với độ phân giải siêu nét `2532 x 1170` (Super Retina XDR OLED). Đã kích hoạt chế độ Extend mở rộng màn hình.
  2. Giải nén và phân tích chuyên sâu mã nguồn `CardboardXR-main.zip` (Unity 6 C#): Nắm trọn kiến trúc 6DoF SLAM + IMU EKF fusion, camera passthrough mono, 3D hand tracking (MediaPipe BlazeHand), cơ chế Gaze + Pinch hysteresis, nắn méo thấu kính `LensDistortion.cs`, và cơ chế Thermal Governor giải quyết hiện tượng quá nhiệt.
  3. Cấu hình Roamies JARVIS (`sidekick.json`): Bật `"autoListen": true` và `"voice": true` với skin `"jarvis"`, cho phép trò chuyện bằng giọng nói rảnh tay (Hands-free Voice AI) qua tai nghe không dây khi đang đeo kính thực tế ảo Shinecon G10.
- **v10.2.36**: Two-way handshake & heartbeat between EduNext and Bridge, encrypted true Gemini key, auto-sync UI.
- **v10.2.35**: Tampermonkey chat scanner, 429 defense, anti-pro ban, auto-drag VIP key, 3 lessons/week quota across packages.
- **v10.2.18**: Smart winner model caching (`gemini-flash-lite-latest`), filtered Gemma/2.5 models, added 7.5s abort timeout.
- **v10.2.10**: Closed-loop automation (Write 'Sẵn sàng' -> Track submit button -> Solve next question -> Loop until complete).
