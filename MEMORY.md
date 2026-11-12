# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.36 & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.36** (Thiết lập liên kết & đồng bộ hai chiều thời gian thực giữa EduNext Bookmarklet và AI Bridge, nạp Google Gemini Key chuẩn qua mã hóa).
- **Core Breakthroughs in v10.2.36**:
  1. **Đồng Bộ Hai Chiều Realtime (Two-Way Handshake & Heartbeat)**:
     - EduNext Bookmarklet và Cầu Nối AI Bridge liên tục gửi gói tin Ping/Pong qua lại mỗi 2-2.5s.
     - Khi Cầu Nối AI được mở, banner trên EduNext HUD lập tức chuyển sang trạng thái:
       `🟢 ĐÃ KẾT NỐI THÔNG SUỐT` (glowing emerald), ẩn hoàn toàn cảnh báo vàng và nút bấm mở thừa thãi.
     - Kiểm tra và cảnh báo rõ ràng nếu trình duyệt chặn Pop-up (`window.open`).
     - Trả lời `ENX_SOLVE_RES` đồng thời cho cả `e.source` và `window.opener` để đảm bảo kết quả giải bài luôn quay về EduNext 100%.
  2. **Tích Hợp Google Gemini Key Chuẩn Qua Mã Hóa**:
     - Nạp token mã hóa chứa sẵn Google Key thực sự của hệ thống (`AQ.Ab8RN6I0...`) vào Bookmarklet và Bridge.
     - `extractTrueGeminiKey` luôn tự động giải mã ra key chuẩn, giải quyết triệt để lỗi Google trả về `HTTP 400: API key not valid`.
     - Thêm ô nhập và lưu Google Gemini API Key trực tiếp trên giao diện Cầu Nối AI Bridge cho phép người dùng tùy chỉnh bất cứ lúc nào.
  3. **Kế Thừa Toàn Bộ Tính Năng Mạnh Mẽ Từ v10.2.35**:
     - Thuật toán leo cây DOM ngược từ Teacher Badge (`Feedback`, `Sửa công thức`, `Đã chấm bằng AI`, `INT: ANS`).
     - Băm định danh DJB2 độc lập cho từng câu hỏi, giải mượt mà từ Câu 1 tới Câu 2 và các câu tiếp theo.
     - Nhận diện khi giáo viên báo sai (`isComplaint`) để tự sửa bài và nộp lại.
     - Cấm toàn bộ model `pro` và `ultra`, chỉ dùng các model `flash` cao RPM với debounce 4s chống bão 429.
     - Kéo Bookmarklet có sẵn bản quyền 120 ngày.
     - Mở giới hạn 3 bài/tuần cho mọi môn học.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT
- **Directory**: `d:\BUISINESS\FPT service\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại**:
  - Gói 1 Tuần: **30.000đ**
  - Gói 1 Tháng: **69.000đ**
  - Gói 1 Kỳ Học (4 Tháng): **220.000đ** (Khuyên dùng)
  - Admin Bank: **VIB • STK: 858709070 • DIEP DAI PHU**

---

## Past Milestones
- **v10.2.36**: Two-way handshake & heartbeat between EduNext and Bridge, encrypted true Gemini key, auto-sync UI.
- **v10.2.35**: Tampermonkey chat scanner, 429 defense, anti-pro ban, auto-drag VIP key, 3 lessons/week quota across packages.
- **v10.2.18**: Smart winner model caching (`gemini-flash-lite-latest`), filtered Gemma/2.5 models, added 7.5s abort timeout.
- **v10.2.10**: Closed-loop automation (Write 'Sẵn sàng' -> Track submit button -> Solve next question -> Loop until complete).
