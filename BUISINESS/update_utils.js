const fs = require('fs');
const path = require('path');

const minified = fs.readFileSync(path.join(__dirname, 'v10_2_15_minified.js'), 'utf8');

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

// 100% Zero-Install Inline Bookmarklet for EduNext LMS (v10.2.15) - Self-Contained, Reactive Question Detection
const RAW_FN_STRING = ${JSON.stringify(minified)};

export function generateBookmarkletCode(licenseKey?: string, host?: string): string {
  const preKey = licenseKey ? JSON.stringify(licenseKey) : '""';
  return 'javascript:(' + RAW_FN_STRING + ')(' + preKey + ');';
}
`;

fs.writeFileSync(utilsPath, utilsContent, 'utf8');
console.log('✓ Successfully updated utils.ts with v10.2.15 minified code!');
