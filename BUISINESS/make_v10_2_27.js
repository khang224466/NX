const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('build_v10_2_26.js', 'utf8');

// 1. Replace version v10.2.26 -> v10.2.27
content = content.replace(/v10\.2\.26/g, 'v10.2.27');
content = content.replace(/v10_2_26/g, 'v10_2_27');

// 2. Pre-baked key auto-storage
const oldStateVar = `    // Biến Trạng Thái
    var activeEncryptedKey = preKey || localStorage.getItem('enx_encrypted_ai_key') || localStorage.getItem('enx_license_key') || '';`;

const newStateVar = `    // Biến Trạng Thái
    if (preKey && typeof preKey === 'string' && preKey.trim().indexOf('ENC_AI_') === 0) {
      try {
        localStorage.setItem('enx_encrypted_ai_key', preKey.trim());
      } catch(_) {}
    }
    var activeEncryptedKey = preKey || localStorage.getItem('enx_encrypted_ai_key') || localStorage.getItem('enx_license_key') || '';`;

content = content.replace(oldStateVar, newStateVar);

// 3. Replace kBox with Zero-Leak, Zero-Tamper Read-Only License Card
const oldKBox = `      // 3. THANH KEY MÃ HÓA
      var kBox = document.createElement('div');
      kBox.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:6px 10px;margin-bottom:8px;';
      var kLabel = document.createElement('div');
      kLabel.style.cssText = 'display:flex;align-items:center;gap:6px;';
      var kIcon = document.createElement('span');
      kIcon.textContent = hasKey ? '🔑' : '⚠️';
      kLabel.appendChild(kIcon);
      var kTxt = document.createElement('span');
      kTxt.style.cssText = hasKey ? 'color:#34d399;font-weight:700;' : 'color:#f59e0b;font-weight:700;';
      kTxt.textContent = hasKey ? 'Key: Đã kích hoạt' : 'Chưa có Key bản quyền (Cần nhập)';
      kLabel.appendChild(kTxt);
      kBox.appendChild(kLabel);

      var kBtn = document.createElement('button');
      kBtn.style.cssText = 'background:none;border:none;color:#38bdf8;cursor:pointer;font-size:10px;text-decoration:underline;';
      kBtn.textContent = hasKey ? 'Đổi Key' : 'Nhập Key Bản Quyền';
      kBtn.onclick = function() {
        showKeyConfigModal();
      };
      kBox.appendChild(kBtn);
      bodyBox.appendChild(kBox);`;

const newKBox = `      // 3. TRẠNG THÁI BẢN QUYỀN (100% TỰ ĐỘNG - KHÔNG HIỂN THỊ NÚT SỬA/COPY)
      var kBox = document.createElement('div');
      kBox.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:8px 10px;margin-bottom:8px;';
      
      var kRowTop = document.createElement('div');
      kRowTop.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
      
      var kLeft = document.createElement('div');
      kLeft.style.cssText = 'display:flex;align-items:center;gap:6px;';
      
      var kIcon = document.createElement('span');
      kIcon.textContent = hasKey ? '🔑' : (keyCheck.expired ? '⛔' : '⚠️');
      kLeft.appendChild(kIcon);
      
      var kTxt = document.createElement('span');
      kTxt.style.cssText = hasKey ? 'color:#34d399;font-weight:700;' : (keyCheck.expired ? 'color:#ef4444;font-weight:700;' : 'color:#f59e0b;font-weight:700;');
      kTxt.textContent = hasKey ? ('Bản Quyền: ' + (keyCheck.plan || 'VIP')) : (keyCheck.expired ? 'Bản Quyền: Đã Hết Hạn' : 'Bản Quyền: Chưa Kích Hoạt');
      kLeft.appendChild(kTxt);
      kRowTop.appendChild(kLeft);

      var kBadge = document.createElement('span');
      if (hasKey) {
        kBadge.style.cssText = 'font-size:9.5px;padding:2px 6px;border-radius:4px;background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#34d399;font-weight:700;';
        kBadge.textContent = 'ĐÃ KÍCH HOẠT';
      } else if (keyCheck.expired) {
        kBadge.style.cssText = 'font-size:9.5px;padding:2px 6px;border-radius:4px;background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#f87171;font-weight:700;';
        kBadge.textContent = 'ĐÃ TỰ HỦY';
      } else {
        kBadge.style.cssText = 'font-size:9.5px;padding:2px 6px;border-radius:4px;background:rgba(245,158,11,0.15);border:1px solid #f59e0b;color:#fbbf24;font-weight:700;';
        kBadge.textContent = 'CHƯA KÍCH HOẠT';
      }
      kRowTop.appendChild(kBadge);
      kBox.appendChild(kRowTop);

      var kSub = document.createElement('div');
      kSub.style.cssText = 'font-size:10px;color:#94a3b8;margin-top:4px;line-height:1.3;padding-left:20px;';
      if (hasKey) {
        kSub.textContent = 'Thời hạn: Còn ' + (keyCheck.remDays || 0) + ' ngày (Hết hạn: ' + (keyCheck.expDate || '') + ')';
      } else if (keyCheck.expired) {
        kSub.style.color = '#fca5a5';
        kSub.textContent = 'Key đã tự động hủy. Vui lòng liên hệ Admin Discord để gia hạn.';
      } else {
        kSub.textContent = 'Kéo nút Bookmarklet từ website fpt-studyhub sau khi Admin duyệt đơn.';
      }
      kBox.appendChild(kSub);
      bodyBox.appendChild(kBox);`;

content = content.replace(oldKBox, newKBox);

// 4. Delete showKeyConfigModal
const modalFuncRegex = /\/\/ Modal cấu hình Key[\s\S]*?document\.body\.appendChild\(m\);\s*\}/;
content = content.replace(modalFuncRegex, '// Key configuration modal deleted in v10.2.27 (Zero key leakage, pre-baked bookmarklet)');

fs.writeFileSync('build_v10_2_27.js', content, 'utf8');
console.log('Created build_v10_2_27.js successfully');
