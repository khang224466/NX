const fs = require('fs');
const path = require('path');

const minified = fs.readFileSync(path.join(__dirname, 'v10_2_4_minified.js'), 'utf8');

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

// 100% Zero-Install Inline Bookmarklet for EduNext LMS (v10.2.4) - Direct Gemini Studio Vision & Key Mã Hóa
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
// @name         FPT EduNext AI Assistant Pro v10.2.4
// @namespace    https://fpt-studyhub.vercel.app/
// @version      10.2.4
// @description  EduNext AI Pro v10.2.4 - Auto-Vision 5s quét ảnh màn hình, gọi trực tiếp Gemini Studio qua Key mã hóa ENC_AI_, bypass CSP bằng Tampermonkey.
// @author       FPT Study Hub
// @match        *://fsc-edunext.fpt.edu.vn/*
// @match        *://*.fpt.edu.vn/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      generativelanguage.googleapis.com
// @connect      *
// @sandbox      JavaScript
// ==/UserScript==

(function() {
  'use strict';
  try {
    if (typeof unsafeWindow !== 'undefined') {
      unsafeWindow.__ENX_GM_XHR__ = GM_xmlhttpRequest;
    }
    if (typeof window !== 'undefined') {
      window.__ENX_GM_XHR__ = GM_xmlhttpRequest;
    }
  } catch(e) {}

  (\${minifiedCode})(\${JSON.stringify(licenseKey)});
})();
\`;

  return new NextResponse(userScriptContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Content-Disposition': 'inline; filename="FPT_EduNext_Assistant_v10.2.4.user.js"',
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
  <title>Cài Đặt EduNext AI Pro v10.2.4</title>
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
      max-width: 650px;
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
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      margin-bottom: 8px;
    }
    p.sub {
      color: #94a3b8;
      font-size: 13px;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .tm-box {
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid #10b981;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
      text-align: center;
    }
    .tm-title {
      font-size: 15px;
      font-weight: 800;
      color: #34d399;
      margin-bottom: 10px;
    }
    .tm-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 15px;
      padding: 12px 24px;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
      transition: all 0.2s ease;
    }
    .tm-btn:hover {
      filter: brightness(1.1);
      transform: translateY(-2px);
    }
    .steps {
      text-align: left;
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 14px;
      padding: 18px;
      font-size: 12px;
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
  </style>
</head>
<body>

  <div class="card">
    <div class="badge">⚡ Phiên Bản VIP v10.2.4 - Tampermonkey Bypass CSP 100%</div>
    <h1>Cài Đặt EduNext AI Pro v10.2.4</h1>
    <p class="sub">Để không bị lỗi CSP ("Refused to connect because it violates CSP"), bạn bắt buộc phải cài đặt qua Tampermonkey extension để có quyền GM_xmlhttpRequest.</p>

    <div class="tm-box">
      <div class="tm-title">👉 CÀI ĐẶT 1-CLICK VÀO TAMPERMONKEY (KHUYÊN DÙNG):</div>
      <a class="tm-btn" href="/edunext.user.js" target="_blank">
        <span>⚡ CÀI ĐẶT EDUNEXT AI PRO V10.2.4</span>
      </a>
    </div>

    <div class="steps">
      <ol>
        <li>Cài extension <strong>Tampermonkey</strong> từ Chrome Web Store nếu máy chưa có.</li>
        <li>Bấm vào nút xanh <strong>⚡ CÀI ĐẶT EDUNEXT AI PRO V10.2.4</strong> ở trên.</li>
        <li>Tampermonkey sẽ hiện tab xác nhận $\rightarrow$ Bấm nút <strong>Cài đặt (Install)</strong> hoặc <strong>Cập nhật (Update)</strong>.</li>
        <li>Mở tab EduNext (<strong>https://fsc-edunext.fpt.edu.vn/home</strong>) $\rightarrow$ Nhấn <strong>F5</strong> để bot tự động xuất hiện!</li>
        <li>Bấm <strong>[📸 Chia Sẻ Màn Hình]</strong> $\rightarrow$ Dán <strong>Key mã hóa (ENC_AI_...)</strong> là bot tự động giải và nộp bài 100%!</li>
      </ol>
    </div>
  </div>

</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'rental_platform', 'public', 'Cai_Dat_Bookmark_EduNext.html'), bookmarkHtml, 'utf8');
console.log('✓ Updated Cai_Dat_Bookmark_EduNext.html');

// 5. Create FPT_EduNext_Assistant_v10.2.4.user.js in public/ and root
const userJsContent = `// ==UserScript==
// @name         FPT EduNext AI Assistant Pro v10.2.4
// @namespace    https://fpt-studyhub.vercel.app/
// @version      10.2.4
// @description  EduNext AI Pro v10.2.4 - Auto-Vision 5s quét ảnh màn hình, gọi trực tiếp Gemini Studio qua Key mã hóa ENC_AI_, bypass CSP bằng Tampermonkey.
// @author       FPT Study Hub
// @match        *://fsc-edunext.fpt.edu.vn/*
// @match        *://*.fpt.edu.vn/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      generativelanguage.googleapis.com
// @connect      *
// @sandbox      JavaScript
// ==/UserScript==

(function() {
  'use strict';
  try {
    if (typeof unsafeWindow !== 'undefined') {
      unsafeWindow.__ENX_GM_XHR__ = GM_xmlhttpRequest;
    }
    if (typeof window !== 'undefined') {
      window.__ENX_GM_XHR__ = GM_xmlhttpRequest;
    }
  } catch(e) {}

  (${minified})("");
})();
`;
fs.writeFileSync(path.join(__dirname, 'rental_platform', 'public', 'FPT_EduNext_Assistant_v10.2.4.user.js'), userJsContent, 'utf8');
fs.writeFileSync(path.join(__dirname, 'FPT_EduNext_Assistant_v10.2.4.user.js'), userJsContent, 'utf8');
console.log('✓ Created FPT_EduNext_Assistant_v10.2.4.user.js');

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
    content = content.replace(/v10\.[0-9]+\.[0-9]+/g, 'v10.2.4');
    content = content.replace(/10\.[0-9]+\.[0-9]+/g, '10.2.4');
    fs.writeFileSync(p, content, 'utf8');
    console.log('✓ Bumped version to v10.2.4 in ' + rel);
  }
});

console.log('\nAll v10.2.4 changes applied successfully!');
