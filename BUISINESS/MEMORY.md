# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.21 - Dual Auto-Engine DOM+Vision & Converter Key Expiration Engine)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.21**
- **Core Upgrades in v10.2.21**:
  1. **Dual Auto-Engine (Tự Động 100% Không Cần Bấm Chia Sẻ Màn Hình)**:
     - Tích hợp bộ quét câu hỏi trực tiếp từ DOM EduNext (`extractDomQuestionText`).
     - Tự động nhận diện câu hỏi mới từ bài tập / tin nhắn giảng viên trong DOM, gọi Gemini Flash-Lite giải và nộp bài liên tục.
     - Sinh viên kéo bookmarklet lên và bấm là bot tự động chạy, không bắt buộc phải bấm chia sẻ màn hình. Nếu có chia sẻ màn hình, bot dùng thêm Vision Multimodal để giải cả hình ảnh / đồ thị phức tạp.
  2. **Giải Quyết Vấn Đề Thời Hạn Key Gốc (Không Cần Dùng Groq)**:
     - **Vấn đề**: Google AI Studio Key (`AIzaSy...`) không có hạn dùng trên máy chủ Google; Groq không hỗ trợ model Vision tiếng Việt mạnh như Gemini Flash-Lite.
     - **Giải pháp 2 tầng**:
       - *Tầng 1 (Mã hóa Client Token trên `converter.html`)*: Nhúng gói và timestamp `EXP|{timestamp}|{plan}|{key}` vào token `ENC_AI_...`. Bot EduNext giải mã trong RAM, kiểm tra `Date.now() > exp`. Khi hết hạn, bot lập tức khóa, hủy key trong storage và từ chối gọi API. 99% sinh viên không thể can thiệp.
       - *Tầng 2 (Cloud AI Proxy / Key Tự Hủy)*: Sinh viên chỉ nhận License Token, gọi qua server proxy `/api/v1/ai/solve`. Server giữ API key gốc an toàn, kiểm tra hạn dùng ở server. Khi hết hạn, server trả về `403 Forbidden`. Key gốc không bao giờ lộ ra ngoài.
  3. **Nâng Cấp Trang Chuyển Đổi Key Có Thời Hạn ([/converter.html](file:///d:/BUISINESS/FPT%20service/public/converter.html))**:
     - Thêm các tùy chọn thời hạn: **1 Tuần (7 Ngày)**, **1 Tháng (30 Ngày)**, **4 Tháng (1 Kỳ Học / 120 Ngày)**, và **Vĩnh Viễn**.
     - Tích hợp công cụ giải mã / kiểm tra hạn dùng ngay trên trang.
  4. **Cơ Chế Khóa Môn Học & Khóa Bài Chuẩn Xác**:
     - Nhận diện môn học theo Mã môn FPT (`CSD201`, `MAS291`, `PRN211`, ...) thay vì theo từng URL slot/session, tránh bị đếm nhầm nhiều lần.
     - Mỗi môn học chỉ được hoàn thành 1 bài trong vòng 7 ngày. Khi hoàn thành bài học, môn đó bị khóa trong 7 ngày.

---

## Previous Status (v10.2.20 - Subject Quota Limiter & 1-Lesson Per Course Per Week)
- Current live version: **v10.2.20**
- Khóa 1 bài / môn / tuần.
- Giới hạn số lượng môn kích hoạt theo gói.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub-onib.vercel.app` & `https://fpt-studyhub.vercel.app`
- **Converter URL**: `https://fpt-studyhub.vercel.app/converter.html`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons.
