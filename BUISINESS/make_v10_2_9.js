const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'build_v10_2_8.js'), 'utf8');

// 1. Bump version to v10.2.9
code = code.replace(/v10\.2\.8/g, 'v10.2.9');

// 2. Remove hardcoded solvers in callDirectGeminiVision
const hardcodedRegexBlock = `      // 1. LOCAL INSTANT SOLVERS (0ms latency, bypass mạng 100%)
      var pText = promptText || '';
      // A. Số neutron (N = A - Z)
      var nMatch = pText.match(/(?:z\\s*=\\s*(\\d+).*?a\\s*=\\s*(\\d+)|a\\s*=\\s*(\\d+).*?z\\s*=\\s*(\\d+)|(\\d+)\\s*-\\s*(\\d+)\\s*bằng\\s*bao\\s*nhiêu)/i);
      if (nMatch && (/neutron|khối\\s*lượng\\s*số/i.test(pText) || /phép\\s*tính/i.test(pText))) {
        var aVal = parseInt(nMatch[2] || nMatch[3] || nMatch[5], 10);
        var zVal = parseInt(nMatch[1] || nMatch[4] || nMatch[6], 10);
        if (!isNaN(aVal) && !isNaN(zVal) && aVal >= zVal) {
          var nVal = aVal - zVal;
          log('success', '⚡ Giải nhanh số neutron: ' + aVal + ' - ' + zVal + ' = ' + nVal);
          return 'Trả lời: ' + nVal;
        }
      }
      // B. Định nghĩa chuyển động thẳng biến đổi đều
      if (/nhanh\\s*dần\\s*đều.*?chậm\\s*dần\\s*đều/i.test(pText) || /thế\\s*nào\\s*là\\s*chuyển\\s*động\\s*thẳng\\s*nhanh\\s*dần\\s*đều/i.test(pText)) {
        log('success', '⚡ Giải nhanh định nghĩa chuyển động thẳng biến đổi đều');
        return 'Trả lời: Chuyển động thẳng nhanh dần đều là chuyển động thẳng có độ lớn vận tốc tăng đều theo thời gian. Chuyển động thẳng chậm dần đều là chuyển động thẳng có độ lớn vận tốc giảm đều theo thời gian.';
      }`;

code = code.replace(hardcodedRegexBlock, '      // Xóa các luồng cứng -> 100% để Google Gemini Vision giải tự nhiên theo ảnh thực tế');

// 3. Remove hardcoded readyBtn.click() trap in runAgentLoop
const hardcodedReadyLoop = `      // TỰ ĐỘNG BẤM NÚT [SẴN SÀNG] NẾU MÀN HÌNH ĐANG HỎI CHUYỂN BÀI
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

// Replace with: Nếu ô nhập đã có chữ (như Sẵn sàng) -> Tự nộp ngay!
const autoSubmitExistingText = `      // TỰ ĐỘNG NỘP NẾU Ô NHẬP ĐÃ CÓ NỘI DUNG (Ví dụ "Sẵn sàng" hoặc đáp án chưa nộp)
      var curTa = getTextarea();
      if (curTa && curTa.value && curTa.value.trim().length > 0 && curTa.value.trim() !== lastSubmittedText && (now - lastSubmitTimestamp > 3500)) {
        log('info', 'Phát hiện ô nhập đã có nội dung: "' + curTa.value.trim().slice(0, 30) + '..." -> Tiến hành nộp bài ngay!');
        await submitAnswerToEduNext(curTa.value.trim());
        return;
      }`;

code = code.replace(hardcodedReadyLoop, autoSubmitExistingText);

// 4. Remove the hardcoded firewall in submitAnswerToEduNext that blocked "Sẵn sàng"
const readyFirewall = `      var isReadyAttempt = /^\\s*(?:trả\\s*lời\\s*:\\s*)?(?:sẵn\\s*sàng|ready)\\s*[.!]?\\s*$/i.test(clean);
      if (isReadyAttempt && hasExercise(currentDomText)) {
        log('warn', '🛡️ CHẶN TUYỆT ĐỐI: Không gửi "Sẵn sàng" khi giao diện có bài tập!');
        return false;
      }`;

code = code.replace(readyFirewall, '// Cho phép gửi "Sẵn sàng" khi chuyển bài');

// 5. Enhance findSubmitButton to prioritize "Nộp câu trả lời" and radial items
const oldFindSubmit = code.substring(code.indexOf('function findSubmitButton(inp) {'), code.indexOf('function triggerClick(el) {'));

const newFindSubmit = `function findSubmitButton(inp) {
      // 1. Direct intent
      var intentBtn = document.querySelector('button[data-intent="SUBMIT_ANSWER"], [data-intent="SUBMIT_ANSWER"]');
      if (intentBtn && !intentBtn.closest('#enx-pro-hud, #enx-key-modal') && intentBtn.offsetParent !== null) {
        return intentBtn;
      }

      // 2. Elements with text / aria / title matching "Nộp câu trả lời"
      var submitElements = Array.from(document.querySelectorAll('div, button, [role="button"], span, a')).filter(function(el) {
        if (isSidebarOrInternal(el) || el.offsetParent === null) return false;
        var txt = (el.innerText || el.textContent || '').trim();
        var aria = (el.getAttribute('aria-label') || '').trim();
        var title = (el.getAttribute('title') || '').trim();
        return /^(?:nộp\\s+câu\\s+trả\\s+lời|nộp\\s+đáp\\s+án|nộp\\s+bài|submit\\s+answer|submit)$/i.test(txt) ||
               /nộp\\s+câu\\s+trả\\s+lời|nộp\\s+đáp\\s+án|nộp\\s+bài/i.test(aria) ||
               /nộp\\s+câu\\s+trả\\s+lời|nộp\\s+đáp\\s+án|nộp\\s+bài/i.test(title);
      });
      if (submitElements.length > 0) {
        var best = submitElements.find(function(e) { return e.tagName === 'BUTTON' || e.getAttribute('role') === 'button'; }) || submitElements[0];
        return best;
      }

      // 3. Radial items
      var radialItems = Array.from(document.querySelectorAll('.exercise-intent-radial__item, [class*="radial__item"], [class*="intent-radial"] [role="button"], [class*="intent-radial"] button, [class*="radial"] [role="button"]'));
      for (var i = 0; i < radialItems.length; i++) {
        var item = radialItems[i];
        if (item.closest('#enx-pro-hud, #enx-key-modal') || item.offsetParent === null) continue;
        var label = (item.innerText || item.textContent || item.getAttribute('aria-label') || '').trim();
        if (/nộp\\s*(?:câu\\s*trả\\s*lời|bài)?|submit(?:\\s*answer)?/i.test(label)) {
          return item;
        }
      }

      // 4. Send buttons near input
      var wSendBtn = document.querySelector('button.w-send-btn:not(.w-send-btn--close), .w-send-btn:not(.w-send-btn--close), button[class*="w-send-btn"], button[class*="send-btn"], [class*="submit-btn"]');
      if (wSendBtn && !wSendBtn.closest('#enx-pro-hud, #enx-key-modal') && !wSendBtn.disabled && wSendBtn.offsetParent !== null) {
        return wSendBtn;
      }

      // 5. Any clickable button in the same footer container
      if (inp) {
        var parentBox = inp.closest('.chat-footer, [class*="chat-footer"], [class*="footer"], [class*="input"], form, .w-md-editor') || inp.parentElement;
        if (parentBox) {
          var btns = Array.from(parentBox.querySelectorAll('button, [role="button"], div[class*="btn"], div[class*="send"]')).filter(function(b) {
            return !b.closest('#enx-pro-hud, #enx-key-modal') && b.offsetParent !== null && !b.disabled;
          });
          if (btns.length > 0) return btns[0];
        }
      }

      return null;
    }

    `;

code = code.replace(oldFindSubmit, newFindSubmit);

// 6. Update output filename
code = code.replace(/v10_2_8_minified\.js/g, 'v10_2_9_minified.js');

fs.writeFileSync(path.join(__dirname, 'build_v10_2_9.js'), code, 'utf8');
console.log('✓ Successfully generated build_v10_2_9.js');
