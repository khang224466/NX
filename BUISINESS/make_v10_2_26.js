const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('build_v10_2_25.js', 'utf8');

// Replace all v10.2.25 with v10.2.26
content = content.replace(/v10\.2\.25/g, 'v10.2.26');
content = content.replace(/v10_2_25/g, 'v10_2_26');

// Add active self-destruct / purge logic in validateKeyStatus
const oldExpiryCheck = `          if (now > exp) {
            return { valid: false, expired: true, plan: plan, expDate: expDate, reason: 'Key gói ' + plan + ' đã hết hạn vào ' + expDate };
          }`;

const newExpiryCheck = `          if (now > exp) {
            try {
              localStorage.removeItem('enx_encrypted_ai_key');
              localStorage.removeItem('enx_license_key');
            } catch(_) {}
            activeEncryptedKey = '';
            return { valid: false, expired: true, plan: plan, expDate: expDate, reason: 'Key gói ' + plan + ' đã hết hạn vào ' + expDate + ' và đã tự động biến mất khỏi trình duyệt!' };
          }`;

content = content.replace(oldExpiryCheck, newExpiryCheck);

fs.writeFileSync('build_v10_2_26.js', content, 'utf8');
console.log('Created build_v10_2_26.js successfully');
