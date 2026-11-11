const fs = require('fs');
const path = require('path');

const minified = fs.readFileSync('d:/BUISINESS/v10_2_19_minified.js', 'utf8').trim();
// Prepend javascript:(function e(e){...})("");
const inlineHref = 'javascript:(' + minified + ')("");';

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cầm Bookmark Kéo Lên Bấm Vô Là Chạy — EduNext AI Pro v10.2.19</title>
  <link rel="icon" href="https://fpt-studyhub.vercel.app/favicon.ico">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      background: radial-gradient(circle at top, #064e3b 0%, #022c22 35%, #020617 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .container {
      max-width: 720px;
      width: 100%;
      background: rgba(15, 23, 42, 0.92);
      border: 2px solid rgba(16, 185, 129, 0.5);
      border-radius: 24px;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(16, 185, 129, 0.25);
      backdrop-filter: blur(20px);
      padding: 36px 28px;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 9999px;
      color: #34d399;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .why-notice {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 14px;
      padding: 14px 18px;
      margin-bottom: 22px;
      text-align: left;
      font-size: 13px;
      color: #fca5a5;
      line-height: 1.6;
    }
    .why-notice strong {
      color: #ffffff;
    }
    h1 {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      line-height: 1.3;
      margin-bottom: 12px;
    }
    h1 span {
      background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.desc {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 22px;
    }
    .arrow-guide {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #34d399;
      font-weight: 800;
      font-size: 14px;
      margin-bottom: 12px;
      animation: bounce 1.5s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .btn-wrapper {
      padding: 14px;
      background: rgba(2, 6, 23, 0.7);
      border: 2px dashed rgba(16, 185, 129, 0.6);
      border-radius: 20px;
      margin-bottom: 24px;
    }
    .draggable-bookmark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 18px 24px;
      background: linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%);
      color: #ffffff;
      font-size: 18px;
      font-weight: 900;
      text-decoration: none;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 0 25px rgba(16, 185, 129, 0.35);
      cursor: grab;
      user-select: none;
      transition: all 0.2s ease;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
    .draggable-bookmark:active {
      cursor: grabbing;
      transform: scale(0.98);
    }
    .draggable-bookmark:hover {
      box-shadow: 0 15px 35px -5px rgba(16, 185, 129, 0.7), 0 0 30px rgba(16, 185, 129, 0.5);
      transform: translateY(-2px);
    }
    .steps-card {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 20px;
      text-align: left;
      margin-bottom: 24px;
    }
    .steps-card h3 {
      font-size: 13px;
      color: #38bdf8;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .step-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.5;
    }
    .step-item:last-child {
      margin-bottom: 0;
    }
    .step-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10b981;
      color: #34d399;
      font-weight: 800;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-top: 1px;
    }
    kbd {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 4px;
      padding: 2px 6px;
      color: #38bdf8;
      font-family: monospace;
      font-size: 12px;
    }
    .footer-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }
    .btn-secondary {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid #334155;
      color: #e2e8f0;
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-secondary:hover {
      border-color: #10b981;
      color: #34d399;
      background: #0f172a;
    }
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: #000;
      padding: 10px 22px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 13px;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.5);
      display: none;
      z-index: 100;
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="badge">⚡ EduNext AI Assistant Pro v10.2.19 (Mới Nhất)</div>

    <div class="why-notice">
      🔍 <strong>GIẢI THÍCH TẠI SAO KÉO TRÊN WEB CŨ VẪN LÀ v10.2.12:</strong><br>
      Trang web <code>https://fpt-studyhub.vercel.app</code> của bạn là bản deploy từ 4 ngày trước và <strong>chưa được cập nhật lại</strong> (trong ảnh của bạn vẫn hiện v10.2.4).<br>
      👉 Nút màu xanh to bên dưới đã được nạp <strong>100% mã nguồn v10.2.19 MỚI NHẤT</strong>: Tự động phát hiện câu hỏi hiện lên mới chụp giải, triệt tiêu hoàn toàn lỗi spam "Sẵn sàng"!
    </div>

    <h1>Cầm Kéo Nút Này Lên <span>Thanh Dấu Trang</span> Là Xong!</h1>
    <p class="desc">Bản độc lập 100% (Không phụ thuộc mạng CDN, vượt mọi rào cản Cloudflare / CSP của FPT EduNext).</p>

    <div class="arrow-guide">
      <span>⬆️ NHẤP GIỮ CHUỘT VÀO NÚT NÀY ➔ KÉO THẲNG LÊN THANH BOOKMARK ⬆️</span>
      <span style="font-size: 18px; margin-top: 4px;">▲</span>
    </div>

    <div class="btn-wrapper">
      <a 
        id="main-bookmark-btn" 
        class="draggable-bookmark" 
        href="" 
        draggable="true"
        onclick="handleBtnClick(event)"
      >
        <span>⚡</span>
        <span>KÉO NÚT NÀY LÊN THANH BOOKMARK (v10.2.19)</span>
      </a>
    </div>

    <div class="steps-card">
      <h3>🚀 3 Bước Cực Dễ (1 Lần Là Xong):</h3>
      <div class="step-item">
        <div class="step-num">1</div>
        <div>Nhấn phím <kbd>Ctrl + Shift + B</kbd> để hiện thanh Bookmark trình duyệt. (Nếu có bookmark cũ thì <strong>chuột phải vào nó chọn Xóa / Delete</strong>).</div>
      </div>
      <div class="step-item">
        <div class="step-num">2</div>
        <div>Dùng chuột <strong>NHẤP GIỮ NÚT XANH Ở TRÊN ➔ KÉO THẢ VÀO THANH BOOKMARK</strong>.</div>
      </div>
      <div class="step-item">
        <div class="step-num">3</div>
        <div>Vào tab EduNext: <strong style="color: #34d399;">https://fsc-edunext.fpt.edu.vn/home</strong> ➔ Nhấn <kbd>F5</kbd> (hoặc Reload) ➔ <strong>BẤM VÀO BOOKMARK VỪA KÉO LÀ CHẠY NGAY!</strong></div>
      </div>
    </div>

    <div class="footer-actions">
      <button class="btn-secondary" onclick="copyInlineCode()">📋 Sao Chép Mã JavaScript (Dán URL)</button>
      <a class="btn-secondary" href="https://fsc-edunext.fpt.edu.vn/home" target="_blank">🌐 Mở Tab EduNext FPT</a>
      <a class="btn-secondary" href="http://localhost:8443" target="_blank">💻 Mở Local Study Hub (:8443)</a>
    </div>
  </div>

  <div id="toast" class="toast">✓ Đã sao chép mã Bookmarklet v10.2.19!</div>

  <script>
    const INLINE_CODE = PLACEHOLDER_INLINE;
    document.getElementById("main-bookmark-btn").setAttribute("href", INLINE_CODE);

    function handleBtnClick(e) {
      alert("👉 Bạn hãy dùng chuột GIỮ VÀ KÉO NÚT NÀY THẢ LÊN THANH DẤU TRANG (Bookmarks Bar) ở phía trên trình duyệt nhé!\\n\\nSau khi kéo lên xong, sang tab EduNext bấm vô là chạy v10.2.19!");
    }

    function copyInlineCode() {
      navigator.clipboard.writeText(INLINE_CODE).then(() => {
        const toast = document.getElementById("toast");
        toast.style.display = "block";
        setTimeout(() => { toast.style.display = "none"; }, 2500);
      });
    }
  </script>

</body>
</html>`;

const finalHtml = html.replace('PLACEHOLDER_INLINE', JSON.stringify(inlineHref));
fs.writeFileSync('d:/BUISINESS/keo_bookmark_edunext.html', finalHtml, 'utf8');
fs.writeFileSync('d:/BUISINESS/FPT service/public/keo_bookmark.html', finalHtml, 'utf8');
console.log('Successfully built keo_bookmark_edunext.html with inline v10.2.19!');
