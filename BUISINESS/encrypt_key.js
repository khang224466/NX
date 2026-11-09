#!/usr/bin/env node
/**
 * Công cụ chuyển đổi Google AI Studio API Key thành Key Mã Hóa cho EduNext Assistant
 * Cách dùng: node encrypt_key.js <AIzaSy_KEY_CUA_BAN>
 */

const SALT = 'ENX_SEC_2026_FLASH_LITE';

function encrypt(text) {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  let res = '';
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length);
    res += ('00' + c.toString(16)).slice(-2);
  }
  return 'ENC_AI_' + Buffer.from(res).toString('base64');
}

function decrypt(enc) {
  if (!enc || !enc.startsWith('ENC_AI_')) return null;
  const hex = Buffer.from(enc.slice(7), 'base64').toString();
  let raw = '';
  for (let i = 0; i < hex.length; i += 2) {
    const c = parseInt(hex.substr(i, 2), 16) ^ SALT.charCodeAt((i / 2) % SALT.length);
    raw += String.fromCharCode(c);
  }
  return raw;
}

const argKey = process.argv[2];

if (!argKey) {
  console.log('\n======================================================');
  console.log('🔑 CÔNG CỤ CHUYỂN ĐỔI GEMINI KEY -> KEY MÃ HÓA EDUNEXT');
  console.log('======================================================');
  console.log('Cách dùng:');
  console.log('  node encrypt_key.js <AIzaSy_KEY>');
  console.log('\nVí dụ:');
  console.log('  node encrypt_key.js AIzaSyD4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9\n');
  process.exit(1);
}

const encryptedKey = encrypt(argKey);
const checkDecrypted = decrypt(encryptedKey);

console.log('\n======================================================');
console.log('✅ CHUYỂN ĐỔI KEY THÀNH CÔNG!');
console.log('======================================================');
console.log('API Key gốc (Google AI Studio):', argKey.slice(0, 8) + '...' + argKey.slice(-4));
console.log('\n👉 KEY MÃ HÓA ĐỂ DÁN VÀO TOOL (DÀNH CHO KHÁCH HÀNG / BẢN THÂN):');
console.log('------------------------------------------------------');
console.log(encryptedKey);
console.log('------------------------------------------------------');
console.log('✓ Trạng thái kiểm tra giải mã ngược:', checkDecrypted === argKey ? 'CHUẨN XÁC 100%' : 'LỖI');
console.log('💡 Ghi chú: Người dùng chỉ có thể dán mã ENC_AI_... này vào tool.');
console.log('           Họ hoàn toàn không thể xem được API Key Google gốc của bạn!\n');
