Created At: 2026-11-14T10:00:30+07:00
Completed At: 2026-11-14T10:00:30+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.52 PRO - Fix Auto-Solve 35s Loop Deadlock, Active DOM Traversal, Tested & Live on CDN)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.52 PRO**
- **Root Cause of "đếm ngược auto 35s xong vẫn đứng yên, chả tự làm bài" (Discovered & Solved)**:
  1. **Lỗi Deadlock `waiting_teacher`**:
     - Sau khi học sinh nộp bài ở câu trước, bot ghi nhận trạng thái `n.state = "waiting_teacher"`.
     - Bộ đếm 35s hết giờ gọi `$(!1)` (truyền `false`). Hàm `$` có điều kiện: `if ("waiting_teacher" !== n.state || e)`. Vì `e = false`, điều kiện trả về `false` và bot bỏ qua toàn bộ khối giải bài!
     - Các câu hỏi tiếp theo của EduNext thường không chứa đúng từ khóa cứng `feedback` hay `sửa công thức` (hoặc chỉ là tin nhắn văn bản thông thường từ bot/giáo viên), khiến `n.state` bị kẹt ở `waiting_teacher` vĩnh viễn.
     - Đồng thời, nút `[Sẵn sàng]` / `[Ready]` bị đặt sau điều kiện `waiting_teacher`, dẫn đến bot không bao giờ click nút "Sẵn sàng" để sang câu mới.
  2. **Lỗi Đảo Ngược DOM `compareDocumentPosition`**:
     - Trong đoạn lọc câu hỏi `T`: `t.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING`.
     - Phép toán này lọc các câu hỏi mà `e` (huy hiệu học sinh) đi sau `t` (tức là chỉ lấy các câu hỏi nằm TRƯỚC tin nhắn nộp bài của học sinh). Kết quả là câu hỏi mới xuất hiện phía dưới bị loại bỏ, bot luôn bốc lại câu hỏi cũ `T`, khiến `hash(T) === lastQuestionHash` và bot từ chối giải lại.
  3. **Lỗi Hash rỗng với Auto Vision (`_`)**:
     - Khi đề bài ở dạng hình ảnh (Auto Vision), `T` là chuỗi rỗng `""`. Hàm băm trả về `""`, trùng với `lastQuestionHash = ""`, khiến chế độ Vision bị chặn hoàn toàn sau lượt đầu.

- **Giải Pháp Triệt Để Trong v10.2.52 PRO**:
  1. **Kích hoạt ép giải bài chủ động khi hết 35s**: Đổi gọi hàm sang `$(!0)` (truyền `true`). Mỗi khi đồng hồ 35s về 0s, bot sẽ quét toàn diện và chủ động giải đề ngay.
  2. **Bẻ khóa Deadlock ô nhập bài**: Nếu trên màn hình EduNext đang có ô nhập bài (`textarea`, `input`) đang mở và có thể gõ được sau hơn 8 giây kể từ lần nộp trước, bot lập tức bỏ qua trạng thái `waiting_teacher` và tiến hành giải bài ngay.
  3. **Sửa thứ tự `compareDocumentPosition`**: Đảo thành `e.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_FOLLOWING` để luôn ưu tiên bắt câu hỏi mới nhất xuất hiện sau tin nhắn của học sinh.
  4. **Tự động băm chu kỳ Vision**: Khi đề dạng ảnh (`_`), băm theo chu kỳ thời gian 25s (`VIS_...`) giúp Auto Vision không bao giờ bị đứng im.
  5. **CDN & Cache**: Đã tạo và xuất bản `v10_2_52_minified.js`, đồng thời cập nhật đè `v10_2_51_minified.js` và `v10_2_50_minified.js`.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin` (Trực tiếp, không rào cản mật mã)
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
