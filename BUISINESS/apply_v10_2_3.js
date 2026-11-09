const fs = require('fs');
const path = require('path');

const minified = fs.readFileSync(path.join(__dirname, 'v10_2_3_minified.js'), 'utf8');

// 1. Update src/lib/utils.ts
const utilsPath = path.join(__dirname, 'rental_platform', 'src', 'lib', 'utils.ts');
const utilsContent = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function generateVietQRUrl(bankId: string, accountNo: string, amount: number, memo: string, accountName: string): string {
  const encodedMemo = encodeURIComponent(memo);
  const encodedName = encodeURIComponent(accountName);
  return \`https://img.vietqr.io/image/\${bankId}-\${accountNo}-compact2.png?amount=\${amount}&addInfo=\${encodedMemo}&accountName=\${encodedName}\`;
}

// 100% Zero-Install Inline Bookmarklet for EduNext LMS (v10.2.3) - Direct Gemini Studio Vision & Key Mã Hóa (AQ... & AIza...)
const RAW_FN_STRING = ${JSON.stringify(minified)};

export function generateBookmarkletCode(licenseKey?: string, host?: string): string {
  const preKey = licenseKey ? JSON.stringify(licenseKey) : '""';
  return 'javascript:(' + RAW_FN_STRING + ')(' + preKey + ');';
}
`;
fs.writeFileSync(utilsPath, utilsContent, 'utf8');
console.log('✓ Updated utils.ts');

// 2. Update src/app/inject.js/route.ts
const injectPath = path.join(__dirname, 'rental_platform', 'src', 'app', 'inject.js', 'route.ts');
const injectCode = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const licenseKey = searchParams.get('key') || '';
  
  const minifiedCode = ${JSON.stringify(minified)};
  const scriptContent = ';(' + minifiedCode + ')(' + JSON.stringify(licenseKey) + ');';

  return new NextResponse(scriptContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
`;
fs.writeFileSync(injectPath, injectCode, 'utf8');
console.log('✓ Updated inject.js/route.ts');

// 3. Update src/app/edunext.user.js/route.ts
const userJsRoutePath = path.join(__dirname, 'rental_platform', 'src', 'app', 'edunext.user.js', 'route.ts');
const userJsRouteCode = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const licenseKey = searchParams.get('key') || '';
  const minifiedCode = ${JSON.stringify(minified)};

  const userScriptContent = \`// ==UserScript==
// @name         FPT EduNext AI Assistant Pro v10.2.3
// @namespace    https://fpt-studyhub.vercel.app/
// @version      10.2.3
// @description  EduNext AI Pro v10.2.3 - Auto-Vision 5s quét ảnh màn hình, gọi trực tiếp Gemini Studio qua Key mã hóa ENC_AI_ (hỗ trợ AQ... & AIza...), tường lửa chống "Sẵn sàng" tuyệt đối, tự động nộp bài 100%.
// @author       FPT Study Hub
// @match        *://fsc-edunext.fpt.edu.vn/*
// @match        *://*.fpt.edu.vn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @connect      generativelanguage.googleapis.com
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';
  (\${minifiedCode})(\${JSON.stringify(licenseKey)});
})();
\`;

  return new NextResponse(userScriptContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Content-Disposition': 'inline; filename="FPT_EduNext_Assistant_v10.2.3.user.js"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
`;
fs.writeFileSync(userJsRoutePath, userJsRouteCode, 'utf8');
console.log('✓ Updated edunext.user.js/route.ts');

// 4. Update Cai_Dat_Bookmark_EduNext.html
const bookmarkHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Cài Đặt EduNext AI Pro v10.2.3 Vào Bookmark</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #020617;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: #0b0f19;
      border: 1px solid rgba(16, 185, 129, 0.4);
      border-radius: 24px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.2);
      max-width: 620px;
      width: 100%;
      padding: 36px 32px;
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      font-size: 12px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 26px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 8px;
    }
    p.sub {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 28px;
      line-height: 1.5;
    }
    .drag-box {
      background: rgba(15, 23, 42, 0.8);
      border: 2px dashed rgba(56, 189, 248, 0.5);
      border-radius: 18px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .drag-hint {
      color: #38bdf8;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .bm-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      font-weight: 900;
      font-size: 16px;
      padding: 14px 28px;
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
      cursor: grab;
      border: 2px solid #34d399;
      transition: all 0.2s ease;
      user-select: none;
    }
    .bm-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(16, 185, 129, 0.55);
      filter: brightness(1.1);
    }
    .bm-btn:active {
      cursor: grabbing;
      transform: translateY(1px);
    }
    .steps {
      text-align: left;
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 18px;
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.6;
    }
    .steps ol {
      padding-left: 20px;
    }
    .steps li {
      margin-bottom: 6px;
    }
    .steps strong {
      color: #38bdf8;
    }
    .footer-note {
      margin-top: 20px;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>

  <div class="card">
    <div class="badge">⚡ Phiên Bản VIP v10.2.3 - Auto-Vision 5s & Bảo Mật Key Mã Hóa</div>
    <h1>Cài Đặt Bookmark EduNext AI Pro</h1>
    <p class="sub">Kéo nút xanh bên dưới lên thanh dấu trang (Bookmarks Bar) để sử dụng ngay trên EduNext!</p>

    <div class="drag-box">
      <div class="drag-hint">👇 DÙNG CHUỘT KÉO NÚT NÀY LÊN THANH BOOKMARK:</div>
      <a id="bm-link" class="bm-btn" href="#" draggable="true">
        <span>⚡ EduNext AI Pro v10.2.3</span>
      </a>
    </div>

    <div class="steps">
      <ol>
        <li>Nhấn <strong>Ctrl + Shift + B</strong> (hoặc <strong>Cmd + Shift + B</strong> trên Mac) để hiện thanh Bookmark trình duyệt.</li>
        <li>Dùng chuột <strong>kéo giữ nút xanh ở trên</strong> và thả vào thanh Bookmark.</li>
        <li>Mở phòng học EduNext: <strong>https://fsc-edunext.fpt.edu.vn/home</strong>.</li>
        <li>Bấm vào bookmark <strong>⚡ EduNext AI Pro v10.2.3</strong> -> Cấp quyền <strong>Chia sẻ màn hình</strong> -> Dán <strong>Key mã hóa (ENC_AI_...)</strong> để bot tự động chụp ảnh và giải bài!</li>
      </ol>
    </div>

    <div class="footer-note">
      Bản quyền thuộc FPT Study Hub • Hỗ trợ MBBank & Discord 24/7
    </div>
  </div>

  <script>
    (function() {
      var rawFn = ${JSON.stringify(minified)};
      var bmHref = 'javascript:(' + rawFn + ')("");';
      var link = document.getElementById('bm-link');
      if (link) {
        link.href = bmHref;
      }
    })();
  </script>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'rental_platform', 'public', 'Cai_Dat_Bookmark_EduNext.html'), bookmarkHtml, 'utf8');
console.log('✓ Updated Cai_Dat_Bookmark_EduNext.html');

// 5. Create FPT_EduNext_Assistant_v10.2.3.user.js in public/ and root
const userJsContent = `// ==UserScript==
// @name         FPT EduNext AI Assistant Pro v10.2.3
// @namespace    https://fpt-studyhub.vercel.app/
// @version      10.2.3
// @description  EduNext AI Pro v10.2.3 - Auto-Vision 5s quét ảnh màn hình, gọi trực tiếp Gemini Studio qua Key mã hóa ENC_AI_ (hỗ trợ AQ... & AIza...), tường lửa chống "Sẵn sàng" tuyệt đối, tự động nộp bài 100%.
// @author       FPT Study Hub
// @match        *://fsc-edunext.fpt.edu.vn/*
// @match        *://*.fpt.edu.vn/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @connect      generativelanguage.googleapis.com
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';
  (${minified})("");
})();
`;
fs.writeFileSync(path.join(__dirname, 'rental_platform', 'public', 'FPT_EduNext_Assistant_v10.2.3.user.js'), userJsContent, 'utf8');
fs.writeFileSync(path.join(__dirname, 'FPT_EduNext_Assistant_v10.2.3.user.js'), userJsContent, 'utf8');
console.log('✓ Created FPT_EduNext_Assistant_v10.2.3.user.js');

// 6. Replace version strings in app files
const filesToBump = [
  'rental_platform/src/app/activate/page.tsx',
  'rental_platform/src/components/checkout/ActivationSuccessModal.tsx',
  'rental_platform/src/components/landing/HeroSection.tsx',
  'rental_platform/src/components/landing/ComparisonTable.tsx',
  'rental_platform/src/components/landing/FaqSection.tsx',
  'rental_platform/src/components/landing/Footer.tsx',
  'rental_platform/src/components/landing/ServiceCatalog.tsx',
  'rental_platform/src/data/servicesCatalog.ts',
  'rental_platform/src/app/api/v1/ai/solve/route.ts',
  'rental_platform/src/app/bridge/page.tsx'
];

filesToBump.forEach(rel => {
  const p = path.join(__dirname, rel);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/v10\.[0-9]+\.[0-9]+/g, 'v10.2.3');
    content = content.replace(/10\.[0-9]+\.[0-9]+/g, '10.2.3');
    fs.writeFileSync(p, content, 'utf8');
    console.log('✓ Bumped version to v10.2.3 in ' + rel);
  }
});

console.log('\nAll v10.2.3 changes applied successfully!');
