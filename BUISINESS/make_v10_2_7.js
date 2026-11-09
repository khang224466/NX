const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'build_v10_2_6.js'), 'utf8');

// 1. Bump version to v10.2.7
code = code.replace(/v10\.2\.6/g, 'v10.2.7');

// 2. Add Auto-confirm "Sẵn sàng" button in runAgentLoop
const targetLoop = 'if (handleIntent()) return;';
const replacementLoop = `if (handleIntent()) return;

      // TỰ ĐỘNG BẤM NÚT [SẴN SÀNG] NẾU MÀN HÌNH ĐANG HỎI CHUYỂN BÀI
      try {
        var readyBtn = Array.from(document.querySelectorAll('button, [role="button"], a')).find(function(b) {
          if (isSidebarOrInternal(b) || b.offsetParent === null) return false;
          return /^\\s*sẵn\\s*sàng\\s*$/i.test((b.innerText || b.textContent || '').trim());
        });
        if (readyBtn && /sẵn\\s*sàng\\s*chuyển\\s*sang\\s*phần\\s*tiếp\\s*theo/i.test(document.body.innerText)) {
          log('success', '⚡ Tự động bấm nút [Sẵn sàng] để chuyển bài tiếp theo!');
          readyBtn.click();
          lastSubmitTimestamp = Date.now();
          return;
        }
      } catch(e) {}`;

code = code.replace(targetLoop, replacementLoop);

// 3. Update build output filename to v10_2_7_minified.js
code = code.replace(/v10_2_6_minified\.js/g, 'v10_2_7_minified.js');

fs.writeFileSync(path.join(__dirname, 'build_v10_2_7.js'), code, 'utf8');
console.log('✓ Successfully generated build_v10_2_7.js');
