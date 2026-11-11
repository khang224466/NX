# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.20 - Subject Quota Limiter & 1-Lesson Per Course Per Week Enforcement)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.20**
- **Core Upgrades in v10.2.20**:
  1. **Khóa Giới Hạn 1 Tuần Chỉ Được Làm 1 Bài Cho Mỗi Môn**:
     - Nhận diện chính xác môn học từ URL (`/course/...`, `/session/...`) và mã môn FPT (`CSD201`, `MAS291`, `PRN211`, `SWT301`, `DBI202`, ...).
     - Khi một bài học của môn được hoàn thành: Hệ thống ghi nhận lịch sử và khóa vĩnh viễn quyền làm bài tiếp theo của môn đó trong 7 ngày (`7 * 24 * 3600 * 1000` ms).
     - Nếu học sinh cố tình mở bài khác của cùng môn đó trong tuần: Bot lập tức cảnh báo đỏ `⛔ Môn [...] đã làm 1 bài trong tuần này! Giới hạn bản quyền: Mỗi môn chỉ được làm 1 bài/tuần`, đồng thời tắt Auto và chặn mọi thao tác giải/nộp.
  2. **Kiểm Soát Đúng Số Lượng Môn Theo Gói Bản Quyền**:
     - Gói 1 Tuần: Tối đa 3 môn học.
     - Gói 1 Tháng: Tối đa 5 môn học.
     - Gói 1 Kỳ Học: Tối đa 6 môn học (toàn bộ chương trình kỳ).
     - Khi số môn kích hoạt vượt quá giới hạn gói: Chặn không cho giải môn mới và yêu cầu nâng cấp gói.
  3. **Đồng Bộ Toàn Bộ Hệ Thống & Vercel**:
     - Đã build và cập nhật `build_v10_2_20.js`, `v10_2_20_minified.js`, `bookmarklet_v10_2_20.txt`, `utils.ts`, `keo_bookmark_edunext.html`, `public/keo_bookmark.html`.
     - Pushed to `khang224466/fpt-studyhub@main` (commit `b09b18b`) và `khang224466/NX@main` (commit `499323e`).

---

## Previous Status (v10.2.19 - Expiration Engine, MBBank QR, Discord Admin & Interactive Video Trailer)
- Current live version: **v10.2.19**
- QR MBBank: 151010042005 (DIEP DAI PHU)
- Discord Admin: https://discord.com/users/888713971161505832
- Key Expiration: EXP|timestamp|plan|key
- DemoVideoTrailer.tsx live on landing page.
- Khảo Thí & SEB placeholder Sắp Ra Mắt.
