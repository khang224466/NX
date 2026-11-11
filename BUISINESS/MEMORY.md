Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-11T15:47:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.28 - Turn-Based State Machine, Smart Teacher Feedback Re-Solve, Baked Bookmarklet Key, Zero-Leak Read-Only HUD)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.28**
- **Core Upgrades in v10.2.28**:
  1. **Kế Thừa Tinh Túy State Machine & Feedback Loop Từ Tampermonkey**:
     - Phân định lượt Giáo viên vs Học sinh theo thứ tự DOM thẻ huy hiệu (`compareDocumentPosition` giữa `teacherBadges` và `studentBadges`).
     - Khi lượt cuối là Học sinh (`waiting_teacher`): Bot kiên nhẫn chờ giáo viên/AI chấm điểm, không spam lặp lại đáp án cũ.
     - Phát hiện nhận xét/khiếu nại từ giáo viên (`isTeacherComplaint`):
       - Nhận diện: "chưa đúng", "thử lại", "chưa chính xác", "lặp lại nhiều lần mà vẫn chưa tìm ra đáp án đúng", "điểm cần lưu ý là bạn đang tập trung vào", "thực chất đang hỏi về", "suy nghĩ lại",...
       - Khi giáo viên chỉ ra lỗi: Tự động xóa sạch nội dung cũ trong textarea (`fillReactInput(ta, '')`), giải phóng cache hash câu hỏi để giải lại ngay lập tức.
       - Tích hợp toàn bộ gợi ý/nhận xét của giáo viên và danh sách các câu trả lời sai trước đó vào Prompt của Gemini Flash-Lite với chỉ thị nghiêm ngặt: Tuyệt đối không lặp lại đáp án sai cũ, bám sát trọng tâm gợi ý của giáo viên.

  2. **Sửa Triệt Để Lỗi Vừa Vào Đã Báo "Hoàn Thành Toàn Bộ Bài Học"**:
     - Loại bỏ việc quét toàn bộ trang `mainArea.innerText.toLowerCase()` (tránh việc trùng khớp với các từ khóa "hoàn thành bài học" trên thanh menu/breadcrumb hoặc lịch sử bài cũ).
     - `isLessonEnded` chỉ kiểm tra duy nhất nội dung từ tin nhắn cuối cùng của giáo viên (`chatState.lastTeacherMsg`).
     - Nếu còn câu hỏi mới (`looksLikeNewQuestion`) hoặc còn nút "Sẵn sàng", tuyệt đối không kích hoạt trạng thái hoàn thành.

  3. **Tự Động Nạp Key Vào Nút Kéo Bookmarklet (`/keo_bookmark.html`)**:
     - Modal kích hoạt thành công tự động chuyển hướng sang `/keo_bookmark.html?key=${encodeURIComponent(licenseKey)}` và lưu ngầm vào `localStorage`.
     - Script trên trang kéo bookmarklet tự động thay thế mã bookmarklet, nạp sẵn key vào payload: `javascript:(function(preKey){...})("ENC_AI_...")`.
     - Sinh viên chỉ cần kéo nút Bookmarklet lên thanh dấu trang là chạy được ngay 100%, không cần biết key và không thể sao chép hay xem key thô.

  4. **Xóa Vĩnh Viễn Modal Đổi Key & Ô Nhập Key Trên Client HUD (Zero Key Leakage)**:
     - Gỡ bỏ hoàn toàn `showKeyConfigModal` và `enx-key-modal`.
     - Client HUD 100% read-only, chỉ hiển thị trạng thái bản quyền (ĐÃ KÍCH HOẠT / ĐÃ TỰ HỦY), loại bỏ toàn bộ nút "Đổi Key", link sửa và ô input.

  5. **Xử Lý Nút "Sẵn sàng" Tự Động Xuyên Suốt Mọi Chặng**:
     - Tự động nhận diện tin nhắn mời chuyển phần và bấm nút `[Sẵn sàng]` trên mọi chặng bài học, không bị giới hạn chỉ ở lần chạy đầu tiên.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
