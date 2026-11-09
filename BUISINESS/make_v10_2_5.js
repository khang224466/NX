const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'build_v10_2_4.js'), 'utf8');

// 1. Bump version
code = code.replace(/v10\.2\.4/g, 'v10.2.5');

// 2. Add bridgeWin definition near state variables
code = code.replace(
  'var lastVisionShotTime = 0;',
  `var lastVisionShotTime = 0;
    var bridgeWin = null;
    function openBridgeWindow() {
      if (bridgeWin && !bridgeWin.closed) {
        bridgeWin.focus();
        log('info', 'Cầu Nối AI Bridge đang hoạt động!');
        return bridgeWin;
      }
      bridgeWin = window.open('https://fpt-studyhub.vercel.app/bridge.html', 'enx_bridge_win', 'width=480,height=540,menubar=no,toolbar=no,location=no');
      log('success', '✓ Đã mở Cầu Nối AI Bridge (Vượt CSP 100%)!');
      return bridgeWin;
    }`
);

// 3. Update Bookmarklet banner with Bridge button
const oldBanner = `      // BANNER 0: CẢNH BÁO NẾU ĐANG CHẠY BẰNG BOOKMARKLET THAY VÌ TAMPERMONKEY
      if (!hasTmGmx) {
        var tmWarn = document.createElement('div');
        tmWarn.style.cssText = 'background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.4);border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
        var twTitle = document.createElement('div');
        twTitle.style.cssText = 'color:#fde047;font-weight:700;margin-bottom:4px;';
        twTitle.textContent = '⚠️ ĐANG CHẠY CHẾ ĐỘ BOOKMARKLET (THIẾU TAMPERMONKEY)';
        tmWarn.appendChild(twTitle);
        var twDesc = document.createElement('div');
        twDesc.style.cssText = 'color:#cbd5e1;font-size:10px;line-height:1.4;';
        twDesc.textContent = 'EduNext chặn kết nối mạng (CSP) của Bookmarklet. Hãy cài script vào Tampermonkey để bypass CSP 100% không bị lỗi Failed to fetch!';
        tmWarn.appendChild(twDesc);
        bodyBox.appendChild(tmWarn);
      }`;

const newBanner = `      // BANNER 0: HỖ TRỢ VƯỢT CSP CHO BOOKMARKLET BẰNG AI BRIDGE
      if (!hasTmGmx) {
        var tmWarn = document.createElement('div');
        tmWarn.style.cssText = 'background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.4);border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
        var twTitle = document.createElement('div');
        twTitle.style.cssText = 'color:#fde047;font-weight:700;margin-bottom:4px;';
        twTitle.textContent = '⚡ CHẾ ĐỘ BOOKMARKLET (CẦN MỞ CẦU NỐI AI)';
        tmWarn.appendChild(twTitle);
        var twDesc = document.createElement('div');
        twDesc.style.cssText = 'color:#cbd5e1;font-size:10px;line-height:1.4;margin-bottom:6px;';
        twDesc.textContent = 'Bấm nút dưới để mở Cầu Nối AI vượt CSP 100% (hoặc cài vào Tampermonkey để chạy ngầm).';
        tmWarn.appendChild(twDesc);
        var openBrBtn = document.createElement('button');
        openBrBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#38bdf8,#0284c7);border:none;color:#fff;font-weight:800;font-size:11px;padding:7px;border-radius:6px;cursor:pointer;box-shadow:0 4px 12px rgba(56,189,248,0.3);';
        openBrBtn.textContent = '🌐 BẤM ĐÂY ĐỂ MỞ CẦU NỐI AI (VƯỢT CSP NGAY)';
        openBrBtn.onclick = function() { openBridgeWindow(); };
        tmWarn.appendChild(openBrBtn);
        bodyBox.appendChild(tmWarn);
      }`;

code = code.replace(oldBanner, newBanner);

// 4. Update callDirectGeminiVision with local solvers & AI Bridge support
const oldCallVision = code.substring(code.indexOf('async function callDirectGeminiVision'), code.indexOf('// BỘ GIẢI CHÍNH'));

const newCallVision = `async function callDirectGeminiVision(rawKey, promptText, imageBase64) {
      // 1. LOCAL INSTANT SOLVERS (0ms latency, bypass mạng 100%)
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
      }

      // 2. NẾU CÓ TAMPERMONKEY -> GỌI TRỰC TIẾP QUA GM_xmlhttpRequest
      var hasTmGmx = (typeof GM_xmlhttpRequest === 'function') || (typeof window !== 'undefined' && typeof window.__ENX_GM_XHR__ === 'function') || (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.__ENX_GM_XHR__ === 'function');
      if (hasTmGmx) {
        var candidateModels = [
          'gemini-2.0-flash-lite',
          'gemini-2.0-flash',
          'gemini-1.5-flash',
          'gemini-2.0-flash-lite-preview-02-05',
          'gemini-2.5-flash'
        ];

        var sysPrompt = 'Bạn là Trợ lý Học tập FPT EduNext AI Pro. Giải bài tập ngắn gọn, chính xác theo định dạng trong ảnh. Tuyệt đối KHÔNG trả lời "Sẵn sàng" khi có câu hỏi bài tập. Nếu yêu cầu mẫu "Trả lời: [đáp án]", bắt buộc chỉ trả về đúng định dạng đó.';

        var parts = [];
        if (imageBase64) {
          var b64 = imageBase64.replace(/^data:image\\/\\w+;base64,/, '');
          parts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
        }
        parts.push({ text: promptText });

        for (var i = 0; i < candidateModels.length; i++) {
          var model = candidateModels[i];
          try {
            var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + rawKey;
            log('info', 'Đang gửi ảnh tới Google Gemini (' + model + ')...');

            var res = await universalRequest({
              url: url,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: sysPrompt }] },
                contents: [{ role: 'user', parts: parts }],
                generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
              })
            });

            if (res.ok) {
              var json = await res.json();
              var text = (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0]) ? json.candidates[0].content.parts[0].text : '';
              if (text && text.trim()) {
                var clean = text.replace(/\`\`\`(?:markdown|json|text)?/gi, '').replace(/\`\`\`/g, '').trim();
                clean = clean.replace(/^\\*\\*Trả lời:\\*\\*/i, 'Trả lời:').trim();
                log('success', '✓ Gemini (' + model + ') phản hồi thành công!');
                return clean;
              }
            } else {
              var errTxt = await res.text();
              log('warn', 'Model ' + model + ' (HTTP ' + res.status + '): ' + (errTxt.slice(0, 70) || 'Lỗi'));
            }
          } catch(e) {
            log('warn', 'Lỗi gọi ' + model + ': ' + (e.message || e));
          }
        }
        return null;
      }

      // 3. NẾU CHẠY BOOKMARKLET -> GỌI QUA AI BRIDGE WINDOW
      if (!bridgeWin || bridgeWin.closed) {
        openBridgeWindow();
      }
      if (bridgeWin && !bridgeWin.closed) {
        log('info', 'Đang gửi ảnh và câu hỏi qua Cầu Nối AI Bridge...');
        var reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        var bridgeAnswer = await new Promise(function(resolve) {
          var timeout = setTimeout(function() {
            window.removeEventListener('message', onBridgeMsg);
            log('warn', 'Cầu Nối AI Bridge phản hồi quá hạn (timeout 25s)');
            resolve(null);
          }, 25000);
          function onBridgeMsg(evt) {
            if (evt.data && evt.data.type === 'ENX_SOLVE_RES' && evt.data.requestId === reqId) {
              clearTimeout(timeout);
              window.removeEventListener('message', onBridgeMsg);
              if (evt.data.success && evt.data.answer) {
                log('success', '✓ Cầu Nối AI Bridge giải thành công!');
                resolve(evt.data.answer);
              } else {
                log('warn', 'Cầu Nối AI: ' + (evt.data.error || 'Không có đáp án'));
                resolve(null);
              }
            }
          }
          window.addEventListener('message', onBridgeMsg);
          bridgeWin.postMessage({
            type: 'ENX_SOLVE_REQ',
            requestId: reqId,
            rawKey: rawKey,
            promptText: promptText,
            imageBase64: imageBase64
          }, '*');
        });
        if (bridgeAnswer) return bridgeAnswer;
      } else {
        log('warn', '⚠️ Cần bấm [Mở Cầu Nối AI] để cấp quyền vượt CSP cho Bookmarklet!');
      }

      return null;
    }

    `;

code = code.replace(oldCallVision, newCallVision);

// 5. Update build output filename to v10_2_5_minified.js
code = code.replace(/v10_2_4_minified\.js/g, 'v10_2_5_minified.js');

fs.writeFileSync(path.join(__dirname, 'build_v10_2_5.js'), code, 'utf8');
console.log('✓ Successfully wrote build_v10_2_5.js');
