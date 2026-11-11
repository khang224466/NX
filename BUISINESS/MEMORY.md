Created At: 2026-11-11T13:43:57+07:00
Completed At: 2026-11-11T14:02:00+07:00

# Memory - Automated Control & Web Automation Project

## Current Status (v10.2.24 - Triệt Tiêu Hoàn Toàn Luồng Cứng & Fake Orders, Master Gemini API Key Console, Realtime Cloud Sync 2 Web, Sửa Lỗi QR 220k)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.2.24**
- **Core Upgrades in v10.2.24**:
  1. **Triệt Tiêu 100% "Luồng Cứng" & Key Ảo Hỏng**:
     - **Vấn đề đã khắc phục**: Trước đây khi Admin bấm duyệt đơn hoặc sinh key thủ công, hệ thống sử dụng chuỗi fallback cứng `'AIzaSyFPT_PRO_STUDYHUB_...'`. Đây là key giả, khiến bot sinh viên khi giải mã ra gọi Google Gemini bị lỗi `API_KEY_INVALID`.
     - **Giải pháp**:
       - Thêm ô cấu hình **Master Google Gemini API Key** ngay trên đầu trang Admin (`/admin`), tự động lưu trên `localStorage` máy Admin.
       - Khi Admin bấm `[Duyệt & Cấp Key]`, API nhận `apiKey` thực tế này và mã hóa chuẩn xác vào token `EXP|timestamp|duration|apiKey`.
       - Sinh viên mở Bookmarklet/Assistant nhận được key thật, gọi trực tiếp Gemini Flash-Lite thành công 100%.
  2. **Đồng Bộ Dữ Liệu Thời Gian Thực Giữa 2 Web (Khách Mua <-> Admin)**:
     - Khắc phục sự cố không đồng bộ giữa các instance Serverless và giữa 2 domain (`fpt-studyhub-onib.vercel.app` & `fpt-studyhub.vercel.app`).
     - Tầng Persistent Cloud Sync Store (`https://api.restful-api.dev/objects/ff808181a09d98f701a1c947378e0537`) kết nối trực tiếp.
     - `GET /api/v1/orders` và `CheckoutModal` polling mỗi 3 giây với `?t=${Date.now()}` và `Cache-Control: no-cache, no-store`.
     - Khi Admin duyệt đơn, modal khách hàng lập tức kích hoạt pháo hoa (confetti) và mở khóa Bookmarklet.
  3. **Khắc Phục Hoàn Toàn Lỗi Mã QR 220.000₫**:
     - Đã tìm ra nguyên nhân tệp `qr_220k.png` trước đây bị lỗi hiển thị: curl không theo dõi redirect (-L) nên lưu trang HTML 301 (167 bytes).
     - Đã tải lại tệp nhị phân PNG chuẩn xác 50.671 bytes và cấu hình kèm `qr_220k.svg` với fallback `onError` trực tiếp từ VietQR API.
  4. **Triệt Tiêu Toàn Bộ Đơn Hàng Mẫu & Số Liệu Ảo**:
     - Xóa bỏ triệt để các đơn hàng fake (`ORD-4219`, `ORD-9104`, `ORD-8821`).
     - Các chỉ số trên Admin (Doanh thu, Khách hàng, Đơn chờ) được tính toán 100% từ đơn hàng thực tế trên Cloud Store.
  5. **Auto Engine EduNext v10.2.24**:
     - Tự động phát hiện câu hỏi, gửi Gemini Flash-Lite giải bài.
     - Tự động nhận diện nhận xét / gợi ý sửa sai của giáo viên trong khung chat để tự động đổi đáp án đúng (không lặp lại đáp án cũ bị từ chối).
     - Khóa giới hạn 1 môn / 1 bài / tuần và giới hạn số môn theo gói bản quyền.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\FPT service\`
- **Production URL**: `https://fpt-studyhub.vercel.app` & `https://fpt-studyhub-onib.vercel.app`
- **Admin Console**: `https://fpt-studyhub.vercel.app/admin`
- **Converter URL**: `https://fpt-studyhub.vercel.app/converter.html`
- **Beneficiary**: **Ngân hàng Quốc Tế (VIB)** • STK: **`858709070`** • Chủ TK: **`DIEP DAI PHU`**
- **Admin Discord**: `https://discord.com/users/888713971161505832`
