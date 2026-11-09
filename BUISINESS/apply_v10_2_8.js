const fs = require('fs');
const path = require('path');

const minified = fs.readFileSync(path.join(__dirname, 'v10_2_8_minified.js'), 'utf8');

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

// 100% Zero-Install Inline Bookmarklet for EduNext LMS (v10.2.8) - Direct Gemini Studio Vision & Dual AI Bridge (Zero Script)
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
// @name         FPT EduNext AI Assistant Pro v10.2.8
// @namespace    https://fpt-studyhub.vercel.app/
// @version      10.2.8
// @description  EduNext AI Pro v10.2.8 - Auto-Vision 5s quét ảnh màn hình, gọi trực tiếp Gemini Studio qua Key mã hóa ENC_AI_, bypass CSP bằng Tampermonkey & AI Bridge (Zero Script).
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

  ;(\${minifiedCode})(\${JSON.stringify(licenseKey)});
})();\`;

  return new NextResponse(userScriptContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
`;
fs.writeFileSync(userJsRoutePath, userJsRouteCode, 'utf8');
console.log('✓ Updated edunext.user.js/route.ts');

// 4. Update public standalone files
const userScriptHeader = `// ==UserScript==
// @name         FPT EduNext AI Assistant Pro v10.2.8
// @namespace    https://fpt-studyhub.vercel.app/
// @version      10.2.8
// @description  EduNext AI Pro v10.2.8 - Auto-Vision 5s quét ảnh màn hình, gọi trực tiếp Gemini Studio qua Key mã hóa ENC_AI_, bypass CSP bằng Tampermonkey & AI Bridge (Zero Script).
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

  ;(${minified})("");
})();
`;

fs.writeFileSync(path.join(__dirname, 'rental_platform', 'public', 'FPT_EduNext_Assistant_v10.2.8.user.js'), userScriptHeader, 'utf8');
fs.writeFileSync(path.join(__dirname, 'rental_platform', 'public', 'edunext.user.js'), userScriptHeader, 'utf8');
fs.writeFileSync(path.join(__dirname, 'FPT_EduNext_Assistant_v10.2.8.user.js'), userScriptHeader, 'utf8');

// 5. Generate bookmarklet string file
const bm = 'javascript:(' + minified + ')("");';
fs.writeFileSync(path.join(__dirname, 'bookmarklet_v10_2_8.txt'), bm, 'utf8');
console.log('✓ Generated bookmarklet_v10_2_8.txt (length:', bm.length, ')');
console.log('✓ Successfully applied v10.2.8 updates across all target files');
