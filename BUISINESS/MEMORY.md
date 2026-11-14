Created At: 2026-11-14T10:39:30+07:00
Completed At: 2026-11-14T10:39:30+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.54 PRO - English Ready/Yes Detection, 7 Sessions/Week Quota, No False Lesson Completion)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.54 PRO**
- **Nguyên Nhân & Xử Lý Vấn Đề Môn Tiếng Anh & Giới Hạn Tuần**:
  1. **Đưa giới hạn lên 7 bài/tuần**:
     - Cập nhật hạn mức khóa bản quyền trong `scripts/edunext-client.js` từ `s.length >= 3` lên `s.length >= 7`.
     - Cho phép làm thoải mái tối đa **7 bài/tuần** cho mỗi môn (tất cả các gói bản quyền).
     - Mở rộng số môn tối đa lên 12 môn mà không lo chạm ngưỡng giới hạn.
  2. **Lỗi bot nhận nhầm hoàn thành buổi học trong môn Tiếng Anh**:
     - Đoạn code cũ kiểm tra `document.body.innerText` tìm từ khóa `"completed/hoàn thành"`. Trong môn Tiếng Anh, đoạn văn đọc hiểu hoặc thanh sidebar danh sách bài của EduNext chứa từ `"completed session"` khiến bot tưởng nhầm là đã xong bài học và tự động tắt Auto (`🎉 HOÀN THÀNH TOÀN BỘ BÀI HỌC!`).
     - Đã loại bỏ hoàn toàn kiểm tra `document.body.innerText`.
     - Chỉ cho phép báo hoàn thành khi **KHÔNG CÒN Ô NHẬP BÀI** (`activeInput`) trên màn hình và tin nhắn của giáo viên thực sự là câu chúc mừng kết thúc buổi học.
  3. **Xử lý câu hỏi bắt đầu / chuyển phần trong Tiếng Anh ("Are you ready to move on...", "Yes")**:
     - Đã bổ sung bộ nhận diện chuyên biệt cho môn Tiếng Anh: Khi giáo viên hỏi `Are you ready to move on to the next part?`, `Ready to practice?`, `Are you ready?`, v.v. -> Bot tự động gõ hoặc click nút **`Yes`** (hoặc `Sẵn sàng` nếu là tiếng Việt) và nộp ngay để chuyển sang câu hỏi bài tập.
     - Sửa prompt Gemini cho môn Tiếng Anh: Trả lời 100% bằng tiếng Anh, không thêm tiền tố tiếng Việt (`Trả lời:`), trả lời trực diện ngắn gọn.
  4. **CDN & Cache jsDelivr**:
     - Xuất bản `v10_2_54_minified.js` lên CDN `jsdelivr`.
     - Cập nhật đè các file tương thích ngược `v10_2_53_minified.js`, `v10_2_52_minified.js`, `v10_2_51_minified.js`, `v10_2_50_minified.js`.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin` (Trực tiếp, không rào cản mật mã)
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
