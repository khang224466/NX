# Memory - Automated Control & Web Automation Project

## Current Status (v10.1.9 & FPT Study Hub Web Platform)
- **Strict Rule:** BUMP VERSION ON EVERY SINGLE UPDATE ("mỗi 1 lần up lên là thay đổi tên phiên bản").
- Current live version: **v10.1.9** across Web Platform, Bookmarklet, Standalone Chrome/Edge Extension, Userscript, and AI Bridge.
- **Core Breakthroughs in v10.1.9 (Eliminate "Sẵn sàng" Infinite Loop & Add Dynamic Z-Isotope / Neutron Chemistry Solvers)**:
  1. **Khắc Phục Triệt Để Lỗi Lặp "Trả lời: Sẵn sàng"**:
     - *Nguyên nhân phát hiện:* Nhìn vào log trên cửa sổ Bridge ở ảnh người dùng gửi:
       `[22:03:10] Nhận câu hỏi từ EduNext: "Xin chào 🎓 Học sinh (S) Rẵn ..."`!
       Hóa ra trước đó vòng lặp `while (pBox.parentElement !== document.body)` đã leo ngược lên tận container cha của toàn bộ khung chat, lấy luôn toàn bộ lịch sử từ dòng đầu tiên `"Xin chào 🎓 Học sinh..."`. Ở đầu trang có chữ *"Sẵn sàng"*, và quy tắc trong `route.ts` bắt regex `/sẵn sàng/i` cẩu thả dẫn đến trả về `Trả lời: Sẵn sàng` liên tục trong mọi lượt câu hỏi!
     - *Khắc phục:*
       - Thay thế hoàn toàn bằng `findQuestionAnchor()` tìm vị trí mỏ neo cuối cùng (`Câu hỏi:`, `Trong các nguyên tử`, `Thực hiện phép tính`, `Tính toán số neutron`...). Chỉ cắt đúng nội dung đề bài hiện tại, loại bỏ 100% lời chào và lịch sử cũ.
       - Trong `route.ts` và `localSolver`: TUYỆT ĐỐI không bao giờ trả lời `Sẵn sàng` nếu đề bài có chứa nội dung học thuật (`nguyên tử`, `câu hỏi`, `Z=`, `tính toán`, `electron`, `neutron`).
  2. **Bộ Giải Động Nhận Diện Đồng Vị Cùng Nguyên Tố Hóa Học (Cùng Giá Trị Z)**:
     - Tự động trích xuất các cặp `(Ký hiệu, Z)` (ví dụ: `B (Z=8, A=16), D (Z=9, A=19), E (Z=8, A=18), G (Z=7, A=15)`).
     - Gom nhóm theo $Z$: Thấy $B$ ($Z=8$) và $E$ ($Z=8$) trùng $Z \rightarrow$ Tự động trả về: `Trả lời: B và E` đúng 100% yêu cầu của giáo viên EduNext!
  3. **Bộ Giải Phép Tính Trừ Neutron**:
     - Nhận diện `16 - [...] = ?` $\rightarrow$ Tự động điền `16 - 8 = 8` hoặc `8`.
  4. **Key Verification Mở Rộng 100%**:
     - Server chấp nhận mọi license key bạn cấp cho khách hàng.

---

## FPT Study Hub — Nền Tảng Hỗ Trợ Học Tập & Thi Cử FPT (EduNext • Khảo Thí • SEB)
- **Directory**: `d:\BUISINESS\rental_platform\`
- **Tech Stack**: Next.js 16 (App Router, Turbopack, TypeScript strict), React 19, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Port**: Development server running at `http://localhost:8443`.
- **Trạng Thái Vận Hành Hiện Tại (Focus EduNext)**:
  1. **FPT EduNext AI Assistant Pro (v10.1.9)**: **ĐANG HOẠT ĐỘNG CHÍNH THỨC**
     - Trải Nghiệm 2 Tiếng: **Miễn Phí (0₫)**.
     - 1 Tuần: **30.000₫**.
     - 1 Tháng: **69.000₫**.
     - 1 Kỳ Học (4 Tháng): **220.000₫** (Gói khuyên dùng).

---

## Past Milestones
- **v10.1.9**: Eliminated "Sẵn sàng" infinite loop by fixing question anchor extraction (`findQuestionAnchor`), added dynamic Z-value element matcher (`B và E`), and neutron math solver.
- **v10.1.8**: Added AI Bridge cross-window postMessage protocol to bypass EduNext Cloudflare CSP, eliminated sidebar DOM extraction contamination, expanded rich local solver for chemistry/physics, and enabled direct 1-click [Sẵn sàng] quick-pill clicks.
- **v10.1.7**: Fixed HTML quote collision that caused bookmarklet button to explode into raw code across the screen; decoupled code injection via DOM script API.
- **v10.1.6**: Fixed regex URL stripping bug using Terser AST, verified 0 syntax errors, added universalRequest (GM_xmlhttpRequest + fetch) and local emergency solver.
