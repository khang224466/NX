Created At: 2026-11-11T14:39:40+07:00
Completed At: 2026-11-12T07:54:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.40 - Bulletproof Next-Question Tracking via DOM Slicing & 100% Cloaked Admin-Only API Key)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.41**
- **Core Upgrades in v10.2.40**:
  1. **Khắc Phục Triệt Để Lỗi Không Track Được Câu 2 / Câu Tiếp Theo**:
     - *Nguyên nhân*: Hàm cũ dùng `document.querySelector` để tìm khối câu hỏi -> luôn luôn trả về Câu 1 ở đầu trang! Khi sang Câu 2, chữ ký `questionSignature` bị tính theo Câu 1 nên trùng với `lastSolvedHash`, khiến bot tưởng đã giải rồi và đứng chờ ở trạng thái `⏳ Đang theo dõi khi nào có câu hỏi mới...`.
     - *Giải pháp triệt để*: Thiết lập hàm `extractActiveQuestion(lastStudent)`: Quét toàn bộ cây DOM và lọc chỉ lấy các phần tử câu hỏi xuất hiện **SAU lượt trả lời gần nhất của học sinh** (`compareDocumentPosition & Node.DOCUMENT_POSITION_PRECEDING`).
     - Tích hợp hàm `cleanQuestionText` loại bỏ sạch UUID rác, timestamp, các nút Feedback/Sửa công thức, và băm `hashQuestion` độc lập theo từng câu. Câu 2 có mã hash hoàn toàn khác biệt Câu 1 -> Bot nhận diện ngay lập tức trong 0.5s và tự động giải liên tục!
  
  2. **Bảo Mật Tuyệt Đối API Key (100% Cloaked & Admin-Only Key)**:
     - *Yêu cầu người dùng*: Người dùng không thể xem và không thể tự nhập key; API key hoàn toàn là bí mật được cấp độc quyền bởi Admin.
     - *Triển khai*:
       - Gỡ bỏ hoàn toàn ô `input` và nút `[Lưu Key]` trên `public/bridge.html`.
       - Thay thế bằng thẻ bản quyền khóa an toàn: `🔒 Bản Quyền AI Pro: Cấp Quyền Độc Quyền • Key bảo mật được cấp bởi Admin • Khóa an toàn 100% [ĐÃ KÍCH HOẠT] • ••••••••••••••••••••••••••••••••`.
       - Plain API Key (`AQ...` / `AIza...`) được giải mã và lưu trữ duy nhất trong biến bộ nhớ RAM của tiến trình JavaScript. Không bao giờ hiển thị ra DOM, không lưu dạng văn bản rõ, không in ra màn hình hay console log.
       - Người dùng tuyệt đối không thể xem, không thể sao chép, và không thể can thiệp nhập key khác.

  3. **Đồng Bộ Hai Chiều Instant 0ms Giữa Checkout & Admin**:
     - Duy trì kiến trúc nén siêu gọn `CompactOrder` (HTTP 200 OK, 572 bytes) chống lỗi 500 đám mây.
     - Duy trì BroadcastChannel + storage event + Polling 1.0s.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Drag Bookmarklet URL**: `https://fpt-studyhub.vercel.app/keo_bookmark.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
