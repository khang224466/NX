const fs = require('fs');
const path = require('path');
const terser = require(path.join(__dirname, 'rental_platform', 'node_modules', 'next', 'dist', 'compiled', 'terser'));

function bookmarkletFunction(preKey) {
  try {
    if (window.__ENX_PRO_HUD__) {
      var ex = document.getElementById('enx-pro-hud');
      if (ex) {
        ex.style.display = (ex.style.display === 'none' ? 'block' : 'none');
        return;
      }
    }
    window.__ENX_PRO_HUD__ = true;

    var CURRENT_VERSION = 'v10.2.12';
    var ENX_CIPHER_SALT = 'ENX_SEC_2026_FLASH_LITE';

    // GIẢI MÃ NỘI BỘ TRONG BỘ NHỚ (HỖ TRỢ KEY AIza... VÀ KEY MỚI AQ....)
    function decryptEncryptedKey(enc) {
      if (!enc || typeof enc !== 'string' || !enc.startsWith('ENC_AI_')) return null;
      try {
        var b64 = enc.slice(7);
        var hex = atob(b64);
        var raw = '';
        for (var i = 0; i < hex.length; i += 2) {
          var c = parseInt(hex.substr(i, 2), 16) ^ ENX_CIPHER_SALT.charCodeAt((i / 2) % ENX_CIPHER_SALT.length);
          raw += String.fromCharCode(c);
        }
        if (raw && (raw.startsWith('AIza') || raw.startsWith('AQ.') || raw.length >= 20)) {
          return raw;
        }
        return null;
      } catch(e) {
        return null;
      }
    }

    // State Variables
    var activeEncryptedKey = preKey || localStorage.getItem('enx_encrypted_ai_key') || localStorage.getItem('enx_license_key') || '';
    var isSubmitting = false;
    var lastSubmitTimestamp = 0;
    var lastSubmittedText = '';
    var isAuto = true;
    var rateLimitCooldownUntil = 0;
    var lastSolvedHash = '';
    var preferredModel = 'gemini-flash-lite-latest';

    // Vision Stream & 5s Auto-Vision Loop
    var visionScreenStream = null;
    var visionScreenVideo = null;
    var lastVisionShotTime = 0;
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
    }

    // Rate Limit 429 Interceptor
    (function installRateLimitDetector() {
      try {
        if (window.fetch && !window.__enx_fetch_hooked) {
          var nativeFetch = window.fetch;
          window.fetch = async function(...args) {
            try {
              var res = await nativeFetch.apply(this, args);
              if (res && res.status === 429) {
                rateLimitCooldownUntil = Date.now() + 12000;
                log('warn', 'EduNext 429 Too Many Requests -> Tự động hoãn 12s');
              }
              return res;
            } catch(e) {
              return nativeFetch.apply(this, args);
            }
          };
          window.__enx_fetch_hooked = true;
        }
      } catch(_) {}
    })();

    // HUD Container - Draggable & Resilient
    var d = document.createElement('div');
    d.id = 'enx-pro-hud';
    d.style.cssText = 'position:fixed;top:70px;right:25px;z-index:2147483647;width:370px;background:rgba(11,15,25,0.98);border:2px solid #10b981;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,0.85),0 0 25px rgba(16,185,129,0.35);padding:14px;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;backdrop-filter:blur(16px);font-size:12px;box-sizing:border-box;transition:opacity 0.2s;';

    // Drag support
    var isDragging = false, dragStartX = 0, dragStartY = 0, hudStartX = 0, hudStartY = 0;

    // Header
    var hd = document.createElement('div');
    hd.style.cssText = 'display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:8px;margin-bottom:10px;cursor:move;user-select:none;';
    hd.onmousedown = function(e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      var rect = d.getBoundingClientRect();
      hudStartX = rect.left;
      hudStartY = rect.top;
      function onMouseMove(ev) {
        if (!isDragging) return;
        var dx = ev.clientX - dragStartX;
        var dy = ev.clientY - dragStartY;
        d.style.bottom = 'auto';
        d.style.right = 'auto';
        d.style.left = Math.max(10, Math.min(window.innerWidth - 380, hudStartX + dx)) + 'px';
        d.style.top = Math.max(10, Math.min(window.innerHeight - 100, hudStartY + dy)) + 'px';
      }
      function onMouseUp() {
        isDragging = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    var brand = document.createElement('div');
    brand.style.cssText = 'display:flex;align-items:center;gap:8px;';
    var ic = document.createElement('div');
    ic.style.cssText = 'width:28px;height:28px;border-radius:8px;background:#10b981;display:flex;align-items:center;justify-content:center;color:#000;font-weight:900;font-size:14px;';
    ic.textContent = '⚡';
    brand.appendChild(ic);

    var titles = document.createElement('div');
    var mainTitle = document.createElement('div');
    mainTitle.style.cssText = 'font-weight:800;font-size:13px;color:#fff;display:flex;align-items:center;gap:6px;';
    mainTitle.textContent = 'EduNext AI Pro ';
    var badge = document.createElement('span');
    badge.style.cssText = 'font-size:10px;background:rgba(16,185,129,0.2);color:#34d399;border:1px solid rgba(16,185,129,0.4);padding:1px 5px;border-radius:4px;';
    badge.textContent = CURRENT_VERSION;
    mainTitle.appendChild(badge);

    var subTitle = document.createElement('div');
    subTitle.style.cssText = 'font-size:10px;color:#10b981;font-weight:600;';
    subTitle.textContent = 'Auto Loop: Sẵn sàng ➔ Giải bài ➔ Hoàn thành';
    titles.appendChild(mainTitle);
    titles.appendChild(subTitle);
    brand.appendChild(titles);
    hd.appendChild(brand);

    var hdrBtns = document.createElement('div');
    hdrBtns.style.cssText = 'display:flex;align-items:center;gap:4px;';

    // Minimize button
    var minBtn = document.createElement('button');
    minBtn.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:2px 4px;line-height:1;';
    minBtn.textContent = '─';
    minBtn.title = 'Thu nhỏ / Mở rộng';
    minBtn.onclick = function() {
      bodyWrap.style.display = (bodyWrap.style.display === 'none' ? 'block' : 'none');
    };
    hdrBtns.appendChild(minBtn);

    // Close Button
    var clBtn = document.createElement('button');
    clBtn.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:2px 6px;line-height:1;';
    clBtn.textContent = '✕';
    clBtn.onclick = function() {
      if (visionScreenStream) {
        visionScreenStream.getTracks().forEach(function(t) { t.stop(); });
      }
      d.remove();
      window.__ENX_PRO_HUD__ = false;
    };
    hdrBtns.appendChild(clBtn);
    hd.appendChild(hdrBtns);
    d.appendChild(hd);

    // Body Wrapper (can collapse)
    var bodyWrap = document.createElement('div');

    function renderView() {
      while (bodyWrap.firstChild) {
        bodyWrap.removeChild(bodyWrap.firstChild);
      }

      var hasVision = visionScreenStream && visionScreenStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; });
      var hasKey = !!decryptEncryptedKey(activeEncryptedKey);
      var hasTampermonkey = (typeof GM_xmlhttpRequest === 'function') || 
                            (typeof window !== 'undefined' && typeof window.__ENX_GM_XHR__ === 'function') ||
                            (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.__ENX_GM_XHR__ === 'function');

      // 1. Cầu Nối AI Bridge (nếu chạy Bookmarklet không có Tampermonkey)
      if (!hasTampermonkey) {
        var bridgeBox = document.createElement('div');
        var isBridgeOpen = bridgeWin && !bridgeWin.closed;
        bridgeBox.style.cssText = 'background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
        
        var bridgeHeader = document.createElement('div');
        bridgeHeader.style.cssText = 'color:#34d399;font-weight:800;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;';
        bridgeHeader.innerHTML = '<span>⚡ CHẾ ĐỘ BOOKMARKLET 100%</span><span style="font-size:10px;padding:1px 5px;border-radius:4px;background:' + (isBridgeOpen ? 'rgba(16,185,129,0.25)' : 'rgba(234,179,8,0.25)') + ';color:' + (isBridgeOpen ? '#34d399' : '#fde047') + ';">' + (isBridgeOpen ? '🟢 Đã kết nối Cầu Nối AI' : '⚠️ Cần mở Cầu Nối AI') + '</span>';
        bridgeBox.appendChild(bridgeHeader);

        var bridgeDesc = document.createElement('div');
        bridgeDesc.style.cssText = 'color:#cbd5e1;font-size:10px;line-height:1.4;margin-bottom:6px;';
        bridgeDesc.textContent = isBridgeOpen ? 'Cầu Nối AI đang hoạt động song song để bypass CSP. Bạn không cần cài bất kỳ tiện ích hay script nào!' : 'Bấm nút dưới để mở Cầu Nối AI vượt CSP Cloudflare (Không cần cài đặt script).';
        bridgeBox.appendChild(bridgeDesc);

        var bridgeBtn = document.createElement('button');
        bridgeBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-weight:800;font-size:11px;padding:7px;border-radius:6px;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.3);';
        bridgeBtn.textContent = isBridgeOpen ? '✓ CẦU NỐI AI ĐANG MỞ (BẤM ĐỂ XEM)' : '🌐 BẤM ĐÂY ĐỂ MỞ CẦU NỐI AI (VƯỢT CSP NGAY)';
        bridgeBtn.onclick = function() {
          openBridgeWindow();
          renderView();
        };
        bridgeBox.appendChild(bridgeBtn);
        bodyWrap.appendChild(bridgeBox);
      }

      // 2. Banner yêu cầu chia sẻ màn hình nếu chưa bật
      if (!hasVision) {
        var warnBox = document.createElement('div');
        warnBox.style.cssText = 'background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
        var warnTxt = document.createElement('div');
        warnTxt.style.cssText = 'color:#fca5a5;font-weight:700;margin-bottom:6px;';
        warnTxt.textContent = '📸 CẦN CHIA SẺ MÀN HÌNH ĐỂ BOT CHỤP ẢNH & GIẢI BÀI!';
        warnBox.appendChild(warnTxt);

        var shareBtn = document.createElement('button');
        shareBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#ef4444,#dc2626);border:none;color:#fff;font-weight:800;font-size:11px;padding:8px;border-radius:6px;cursor:pointer;box-shadow:0 4px 12px rgba(239,68,68,0.3);';
        shareBtn.textContent = '👉 BẤM ĐÂY ĐỂ BẬT CHIA SẺ MÀN HÌNH (TAB EDUNEXT)';
        shareBtn.onclick = function() {
          toggleScreenShare();
        };
        warnBox.appendChild(shareBtn);
        bodyWrap.appendChild(warnBox);
      }

      // 3. Key Management
      var keyCard = document.createElement('div');
      keyCard.style.cssText = 'background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
      var keyRow = document.createElement('div');
      keyRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
      
      var keyStatus = document.createElement('div');
      keyStatus.style.cssText = 'color:' + (hasKey ? '#34d399' : '#f87171') + ';font-weight:700;';
      keyStatus.textContent = hasKey ? '🔑 Key Mã Hóa: ' + activeEncryptedKey.slice(0, 14) + '... (✓ Hợp Lệ)' : '⚠️ Chưa có Key mã hóa (Cần nhập)';
      keyRow.appendChild(keyStatus);

      var changeKeyBtn = document.createElement('button');
      changeKeyBtn.style.cssText = 'background:none;border:none;color:#38bdf8;cursor:pointer;font-size:10px;text-decoration:underline;';
      changeKeyBtn.textContent = hasKey ? 'Đổi Key' : 'Nhập Key Mã Hóa';
      changeKeyBtn.onclick = function() {
        showKeyModal();
      };
      keyRow.appendChild(changeKeyBtn);
      keyCard.appendChild(keyRow);
      bodyWrap.appendChild(keyCard);

      // 4. Vision Live Status
      var visionCard = document.createElement('div');
      visionCard.style.cssText = 'background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;';
      
      var visionLeft = document.createElement('div');
      visionLeft.style.cssText = 'display:flex;align-items:center;gap:6px;';
      var vDot = document.createElement('span');
      vDot.id = 'vision-dot';
      vDot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + (hasVision ? '#10b981' : '#ef4444') + ';display:inline-block;';
      visionLeft.appendChild(vDot);

      var vText = document.createElement('span');
      vText.id = 'vision-text';
      vText.style.cssText = 'color:' + (hasVision ? '#34d399' : '#f87171') + ';font-weight:700;font-size:11px;';
      vText.textContent = hasVision ? 'Auto-Vision: Đang quét ảnh 5s' : 'Màn Hình: Chưa bật';
      visionLeft.appendChild(vText);
      visionCard.appendChild(visionLeft);

      var vBtn = document.createElement('button');
      vBtn.id = 'vision-btn';
      vBtn.style.cssText = 'background:' + (hasVision ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)') + ';border:1px solid ' + (hasVision ? '#ef4444' : '#10b981') + ';color:' + (hasVision ? '#f87171' : '#34d399') + ';padding:4px 8px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;';
      vBtn.textContent = hasVision ? '⏹ Dừng' : '📸 Chia Sẻ Màn Hình';
      vBtn.onclick = function() {
        toggleScreenShare();
      };
      visionCard.appendChild(vBtn);
      bodyWrap.appendChild(visionCard);

      // 5. Action Row: Run Now + Toggle Auto
      var actRow = document.createElement('div');
      actRow.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';

      var runBtn = document.createElement('button');
      runBtn.style.cssText = 'flex:1;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-weight:800;font-size:11px;padding:9px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(16,185,129,0.3);';
      runBtn.textContent = '🎯 Chụp & Giải Câu Này Ngay';
      runBtn.onclick = function() {
        if (!hasVision) {
          alert('Vui lòng bấm [📸 Chia Sẻ Màn Hình] để bot có thể chụp ảnh đề bài!');
          toggleScreenShare();
          return;
        }
        runAgentLoop(true);
      };
      actRow.appendChild(runBtn);

      var autoBtn = document.createElement('button');
      autoBtn.id = 'hud-auto-btn';
      autoBtn.style.cssText = 'background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#34d399;font-weight:700;font-size:11px;padding:9px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:4px;';
      autoBtn.textContent = isAuto ? '⚡ Auto: BẬT' : '⏸ Auto: TẮT';
      autoBtn.onclick = function() {
        isAuto = !isAuto;
        autoBtn.textContent = isAuto ? '⚡ Auto: BẬT' : '⏸ Auto: TẮT';
        autoBtn.style.background = isAuto ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)';
        autoBtn.style.borderColor = isAuto ? '#10b981' : '#64748b';
        autoBtn.style.color = isAuto ? '#34d399' : '#94a3b8';
        log('info', 'Chế độ tự động: ' + (isAuto ? 'BẬT' : 'TẮT'));
      };
      actRow.appendChild(autoBtn);
      bodyWrap.appendChild(actRow);

      // 6. Status Text
      var st = document.createElement('div');
      st.id = 'hud-status-text';
      st.style.cssText = 'font-size:11px;color:#38bdf8;margin-bottom:6px;min-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;';
      st.textContent = hasVision ? '● Đang lắng nghe & chụp ảnh đề bài...' : '⚠️ Chờ cấp quyền chia sẻ màn hình...';
      bodyWrap.appendChild(st);

      // 7. Mini Terminal Logs
      var logs = document.createElement('div');
      logs.id = 'hud-logs-box';
      logs.style.cssText = 'background:#020617;border:1px solid #1e293b;border-radius:8px;height:95px;overflow-y:auto;padding:6px 8px;font-family:monospace;font-size:10px;line-height:1.45;color:#94a3b8;';
      bodyWrap.appendChild(logs);

      log('success', 'EduNext AI Pro ' + CURRENT_VERSION + ' sẵn sàng!');
      if (hasTampermonkey) {
        log('success', '✓ Đã kích hoạt Tampermonkey Bypass CSP 100%');
      } else {
        log('info', 'Chế độ Bookmarklet 100% (Sử dụng song song Cầu Nối AI)');
      }
      if (hasKey) {
        log('info', 'Key hợp lệ (Gọi trực tiếp Google Gemini Flash-Lite)');
      } else {
        log('warn', 'Vui lòng nhập Key mã hóa (bắt đầu bằng ENC_AI_)');
      }
    }

    d.appendChild(bodyWrap);

    function log(type, msg) {
      var box = document.getElementById('hud-logs-box');
      if (!box) return;
      var row = document.createElement('div');
      if (type === 'warn') row.style.color = '#f59e0b';
      else if (type === 'err') row.style.color = '#ef4444';
      else if (type === 'success') row.style.color = '#10b981';
      else row.style.color = '#94a3b8';
      var time = new Date().toLocaleTimeString('vi-VN');
      row.textContent = '[' + time + '] ' + msg;
      box.appendChild(row);
      box.scrollTop = box.scrollHeight;
    }

    function setStatus(text, color) {
      var st = document.getElementById('hud-status-text');
      if (st) {
        st.textContent = text;
        if (color) st.style.color = color;
      }
    }

    // Modal nhập key mã hóa
    function showKeyModal() {
      var old = document.getElementById('enx-key-modal');
      if (old) old.remove();

      var m = document.createElement('div');
      m.id = 'enx-key-modal';
      m.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;width:380px;background:#0b0f19;border:2px solid #38bdf8;border-radius:16px;box-shadow:0 25px 60px rgba(0,0,0,0.9),0 0 30px rgba(56,189,248,0.3);padding:18px;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-sizing:border-box;';

      var mh = document.createElement('div');
      mh.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;';
      var mt = document.createElement('div');
      mt.style.cssText = 'font-weight:800;font-size:14px;color:#38bdf8;';
      mt.textContent = '🔑 CẤU HÌNH KEY MÃ HÓA';
      mh.appendChild(mt);

      var mcl = document.createElement('button');
      mcl.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;';
      mcl.textContent = '✕';
      mcl.onclick = function() { m.remove(); };
      mh.appendChild(mcl);
      m.appendChild(mh);

      var hint = document.createElement('div');
      hint.style.cssText = 'font-size:11px;color:#94a3b8;margin-bottom:8px;line-height:1.4;';
      hint.textContent = 'Dán mã Key đã được chuyển đổi từ máy mã hóa (Bắt buộc bắt đầu bằng ENC_AI_).';
      m.appendChild(hint);

      var inp = document.createElement('input');
      inp.type = 'text';
      inp.value = activeEncryptedKey || '';
      inp.placeholder = 'Dán Key mã hóa (ENC_AI_...)';
      inp.style.cssText = 'width:100%;box-sizing:border-box;background:#020617;border:1px solid #334155;border-radius:8px;padding:8px 10px;color:#fff;font-family:monospace;font-size:11px;margin-bottom:10px;outline:none;';
      m.appendChild(inp);

      var saveBtn = document.createElement('button');
      saveBtn.textContent = '✓ LƯU & KÍCH HOẠT NGAY';
      saveBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#38bdf8,#0284c7);border:none;color:#fff;font-weight:800;font-size:11px;padding:9px;border-radius:8px;cursor:pointer;margin-bottom:12px;';
      saveBtn.onclick = function() {
        var val = (inp.value || '').trim();
        var raw = decryptEncryptedKey(val);
        if (raw) {
          activeEncryptedKey = val;
          localStorage.setItem('enx_encrypted_ai_key', val);
          alert('✓ Đã lưu và kích hoạt Key thành công!');
          m.remove();
          renderView();
          log('success', 'Đã nạp Key mã hóa thành công!');
        } else {
          alert('❌ Key không hợp lệ! Vui lòng nhập Key đã được mã hóa (bắt đầu bằng ENC_AI_).');
        }
      };
      m.appendChild(saveBtn);

      var payBox = document.createElement('div');
      payBox.style.cssText = 'background:#020617;border:1px solid #1e293b;border-radius:8px;padding:8px 10px;font-size:11px;line-height:1.5;color:#94a3b8;';
      var payT = document.createElement('div');
      payT.style.cssText = 'font-weight:700;color:#e2e8f0;margin-bottom:4px;';
      payT.textContent = '💳 HỖ TRỢ / MUA KEY BẢN QUYỀN:';
      payBox.appendChild(payT);

      var bank = document.createElement('div');
      var bTitle = document.createElement('b');
      bTitle.textContent = '• STK MBBank: ';
      bank.appendChild(bTitle);
      var bNum = document.createElement('span');
      bNum.style.cssText = 'color:#10b981;font-family:monospace;font-weight:700;';
      bNum.textContent = '0987654321';
      bank.appendChild(bNum);
      bank.appendChild(document.createTextNode(' (VO TRI KHANG)'));
      payBox.appendChild(bank);

      var dc = document.createElement('div');
      dc.style.cssText = 'margin-top:2px;';
      var dcB = document.createElement('b');
      dcB.textContent = '• Discord Admin: ';
      dc.appendChild(dcB);
      var dcLink = document.createElement('a');
      dcLink.href = 'https://discord.com/users/888713971161505832';
      dcLink.target = '_blank';
      dcLink.style.cssText = 'color:#38bdf8;text-decoration:underline;font-weight:600;';
      dcLink.textContent = 'Nhắn tin Admin Discord';
      dc.appendChild(dcLink);
      payBox.appendChild(dc);

      m.appendChild(payBox);
      document.body.appendChild(m);
    }

    // SCREEN CAPTURE API
    async function toggleScreenShare() {
      if (visionScreenStream) {
        visionScreenStream.getTracks().forEach(function(t) { t.stop(); });
        visionScreenStream = null;
        visionScreenVideo = null;
        renderView();
        log('info', 'Đã dừng chia sẻ màn hình.');
        return;
      }

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          alert('Trình duyệt không hỗ trợ Screen Capture API');
          return;
        }
        log('info', 'Đang yêu cầu quyền chia sẻ màn hình...');
        var stream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 1, displaySurface: 'browser' },
          audio: false,
          preferCurrentTab: true
        });

        var video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        visionScreenStream = stream;
        visionScreenVideo = video;

        var track = stream.getVideoTracks()[0];
        if (track) {
          track.onended = function() {
            visionScreenStream = null;
            visionScreenVideo = null;
            renderView();
            log('warn', 'Chia sẻ màn hình đã ngắt.');
          };
        }

        await video.play();
        renderView();
        log('success', '✓ Đã kích hoạt Auto-Vision (Chụp khung hình 5s tự động)!');
      } catch(e) {
        log('warn', 'Hủy chia sẻ màn hình: ' + (e.message || e));
      }
    }

    function capturePersistentVisionFrame() {
      if (!visionScreenVideo || !visionScreenVideo.videoWidth) return null;
      try {
        var canvas = document.createElement('canvas');
        var scale = Math.min(1.0, 1600 / Math.max(visionScreenVideo.videoWidth, visionScreenVideo.videoHeight));
        canvas.width = Math.max(1, Math.round(visionScreenVideo.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(visionScreenVideo.videoHeight * scale));
        var ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return null;
        ctx.drawImage(visionScreenVideo, 0, 0, canvas.width, canvas.height);
        var dataUrl = canvas.toDataURL('image/jpeg', 0.80);
        if (!dataUrl || dataUrl.length < 500) return null;
        return { image: dataUrl, width: canvas.width, height: canvas.height };
      } catch(e) {
        return null;
      }
    }

    function stripNoise(text) {
      if (!text) return '';
      return String(text)
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/[0-9a-f]{8}-[0-9a-f-]{20,}/gi, ' ')
        .replace(/\b[0-9a-f]{20,}\b/gi, ' ')
        .replace(/\b\d{2}:\d{2}:\d{2}\s+\d{1,2}\/\d{1,2}\/\d{4}\b/g, ' ')
        .replace(/đã chấm bằng ai|int:\s*\w+|feedback|sửa công thức/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function isInternalOrSidebarElement(el) {
      if (!el) return true;
      if (el.closest('#enx-pro-hud, #enx-key-modal, .course-lesson-list, [class*="lesson-list"], aside, nav, .ant-layout-sider')) {
        return true;
      }
      return false;
    }

    function getLatestChatState() {
      try {
        var studentBadges = Array.from(document.querySelectorAll('span, div, p, small, label')).filter(function(el) {
          if (isInternalOrSidebarElement(el)) return false;
          return /^học\s*sinh$/i.test((el.innerText || el.textContent || '').trim());
        });

        var teacherBadges = Array.from(document.querySelectorAll('button, a, span, div, p')).filter(function(el) {
          if (isInternalOrSidebarElement(el)) return false;
          var t = (el.innerText || el.textContent || '').trim();
          return /^(?:feedback|sửa công thức)$/i.test(t) || /đã chấm bằng ai/i.test(t) || /^int:\s*\w+/i.test(t);
        });

        var lastStudent = studentBadges.length > 0 ? studentBadges[studentBadges.length - 1] : null;
        var lastTeacher = teacherBadges.length > 0 ? teacherBadges[teacherBadges.length - 1] : null;

        if (lastStudent && lastTeacher && (lastTeacher.compareDocumentPosition(lastStudent) & Node.DOCUMENT_POSITION_FOLLOWING)) {
          return { state: 'waiting_teacher' };
        }
        if (lastStudent && !lastTeacher) {
          return { state: 'waiting_teacher' };
        }

        var messageEl = lastTeacher;
        if (lastTeacher) {
          var curr = lastTeacher;
          while (curr && curr !== document.body && !curr.classList?.contains('wrap-message-view')) {
            if (lastStudent && curr.contains(lastStudent)) break;
            var txt = (curr.innerText || curr.textContent || '').trim();
            if (txt.length > 25 && (txt.includes('Câu hỏi') || txt.includes('Bài sau') || txt.includes('bài sau') || txt.includes('Trả lời:') || txt.includes('sẵn sàng') || txt.includes('hoàn thành') || txt.length > 50)) {
              messageEl = curr;
            }
            curr = curr.parentElement;
          }
        }

        var rawText = messageEl ? (messageEl.innerText || messageEl.textContent || '') : '';
        var cleanText = stripNoise(rawText);

        if (!cleanText || cleanText.length < 15) {
          cleanText = extractFallbackQuestion();
        }

        if (cleanText) {
          return { state: 'student_turn', text: cleanText };
        }

        return { state: 'idle' };
      } catch(e) {
        return { state: 'idle' };
      }
    }

    function extractFallbackQuestion() {
      var mainArea = document.querySelector('.chat-view, [class*="chat-content"], [class*="chat-container"], main, .ant-layout-content') || document.body;
      var fullTxt = (mainArea.innerText || mainArea.textContent || '').trim();
      var qIdx = fullTxt.lastIndexOf('Câu hỏi:');
      if (qIdx === -1) qIdx = fullTxt.lastIndexOf('câu hỏi:');
      if (qIdx === -1) qIdx = fullTxt.lastIndexOf('Trả lời:');
      if (qIdx !== -1) {
        var rawSlice = fullTxt.slice(qIdx, qIdx + 750);
        var cleanQ = stripNoise(rawSlice);
        if (cleanQ.length >= 10) return cleanQ;
      }
      return '';
    }

    // YÊU CẦU MẠNG ĐA PHƯƠNG THỨC: HỖ TRỢ TAMPERMONKEY (BYPASS CSP 100%)
    function universalRequest(opts) {
      return new Promise(function(resolve, reject) {
        var gm = (typeof GM_xmlhttpRequest === 'function' ? GM_xmlhttpRequest : null) ||
                 (typeof window !== 'undefined' && typeof window.__ENX_GM_XHR__ === 'function' ? window.__ENX_GM_XHR__ : null) ||
                 (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.__ENX_GM_XHR__ === 'function' ? unsafeWindow.__ENX_GM_XHR__ : null) ||
                 (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function' ? GM.xmlHttpRequest : null);

        if (gm) {
          try {
            gm({
              method: opts.method || 'GET',
              url: opts.url,
              headers: opts.headers || {},
              data: opts.body || null,
              timeout: opts.timeout || 8000,
              onload: function(r) {
                try {
                  var json = JSON.parse(r.responseText);
                  resolve({
                    ok: r.status >= 200 && r.status < 300,
                    status: r.status,
                    json: async function() { return json; },
                    text: async function() { return r.responseText; }
                  });
                } catch(e) {
                  resolve({
                    ok: r.status >= 200 && r.status < 300,
                    status: r.status,
                    json: async function() { return {}; },
                    text: async function() { return r.responseText; }
                  });
                }
              },
              onerror: function(err) {
                reject(new Error(err && err.error ? err.error : 'Network Error'));
              },
              ontimeout: function() {
                reject(new Error('Request timeout'));
              }
            });
            return;
          } catch(err) {
            console.warn('[GM_xmlhttpRequest Error]:', err);
          }
        }

        // NẾU KHÔNG CÓ TAMPERMONKEY (ĐANG DÙNG BOOKMARKLET):
        fetch(opts.url, {
          method: opts.method || 'GET',
          headers: opts.headers || {},
          body: opts.body || undefined
        }).then(resolve).catch(function(err) {
          reject(new Error('EduNext CSP chặn mạng! Bạn đang chạy Bookmarklet. Vui lòng cài script vào Tampermonkey hoặc mở Cầu Nối AI để bypass CSP 100%!'));
        });
      });
    }

    // GỌI TRỰC TIẾP GOOGLE GEMINI (FLASH VISION) VỚI ƯU TIÊN MODEL ĐÃ KIỂM CHỨNG
    async function callDirectGeminiVision(rawKey, promptText, imageBase64) {
      // 1. NẾU CÓ TAMPERMONKEY -> GỌI TRỰC TIẾP QUA GM_xmlhttpRequest
      var hasTmGmx = (typeof GM_xmlhttpRequest === 'function') || 
                     (typeof window !== 'undefined' && typeof window.__ENX_GM_XHR__ === 'function') || 
                     (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.__ENX_GM_XHR__ === 'function');

      if (hasTmGmx) {
        var baseModels = [
          'gemini-flash-lite-latest',
          'gemini-2.0-flash-lite',
          'gemini-1.5-flash',
          'gemini-2.0-flash',
          'gemini-flash-latest'
        ];
        var candidateModels = [preferredModel].concat(baseModels.filter(function(m) { return m !== preferredModel; }));

        var sysPrompt = 'Bạn là Trợ lý Học tập FPT EduNext AI Pro. Giải bài tập ngắn gọn, chính xác theo định dạng trong ảnh. Nếu là câu hỏi bài tập, trả lời đúng đáp án. Nếu yêu cầu mẫu "Trả lời: [đáp án]", bắt buộc chỉ trả lời đúng theo mẫu đó.';

        var parts = [];
        if (imageBase64) {
          var b64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
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
              timeout: 8000,
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
                var clean = text.replace(/```(?:markdown|json|text)?/gi, '').replace(/```/g, '').trim();
                clean = clean.replace(/^\*\*Trả lời:\*\*/i, 'Trả lời:').trim();
                preferredModel = model;
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

      // 2. NẾU CHẠY BOOKMARKLET -> GỌI QUA AI BRIDGE WINDOW
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

    // BỘ GIẢI CHÍNH
    async function solveQuestion(q, imageBase64) {
      var requiresFormat = (/trả lời:\s*\[|theo mẫu/i).test(q);

      var rawGeminiKey = decryptEncryptedKey(activeEncryptedKey);
      if (!rawGeminiKey) {
        log('warn', 'Chưa có Key mã hóa hợp lệ! Nhấn "Nhập Key Mã Hóa" để kích hoạt.');
        return null;
      }

      var ans = await callDirectGeminiVision(rawGeminiKey, q, imageBase64);

      if (!ans) {
        log('warn', 'Google Gemini chưa phản hồi đáp án.');
        return null;
      }

      if (requiresFormat && !/^\s*(?:tr[aả]\s*l[oờ]i|answer)\s*:/i.test(ans) && !ans.startsWith('__')) {
        ans = 'Trả lời: ' + ans;
      }

      return ans;
    }


    // BỘ ĐIỀU HỢP REACT FIBER & PROPS SIÊU CẤP CHO EDUNEXT
    function getReactFiber(el) {
      if (!el) return null;
      for (var k in el) {
        if (k.startsWith('__reactFiber$')) return el[k];
      }
      return null;
    }

    function getReactProps(el) {
      if (!el) return null;
      for (var k in el) {
        if (k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$')) return el[k];
      }
      return null;
    }

    function findReactFunction(el, fnName) {
      var fiber = getReactFiber(el);
      var count = 0;
      while (fiber && count < 60) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps[fnName] === 'function') {
          return fiber.memoizedProps[fnName];
        }
        if (fiber.pendingProps && typeof fiber.pendingProps[fnName] === 'function') {
          return fiber.pendingProps[fnName];
        }
        fiber = fiber.return;
        count++;
      }
      return null;
    }

    // ĐIỀN TEXT 5 TẦNG: ĐỒNG BỘ REACT STATE 100%, KHÔNG BAO GIỜ BỊ RỖNG HOẶC TREO
    function fillReactInput(ta, text) {
      if (!ta) return;
      ta.focus();

      // Tầng 1: Đồng bộ trực tiếp state cha qua onInputChange của React Fiber
      try {
        var onInputFn = findReactFunction(ta, 'onInputChange');
        if (typeof onInputFn === 'function') {
          onInputFn(text);
        }
      } catch(e) {}

      // Tầng 2: Native execCommand giả lập người dùng gõ phím chuẩn trình duyệt
      try {
        ta.select();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
      } catch(e) {}

      // Tầng 3: Reset _valueTracker của React 18 để React không bỏ qua sự kiện
      try {
        var tracker = ta._valueTracker;
        if (tracker) tracker.setValue(ta.value + '_diff');
        var proto = window.HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        var desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) {
          desc.set.call(ta, text);
        } else {
          ta.value = text;
        }
      } catch(e) {
        ta.value = text;
      }

      // Tầng 4: Dispatch chuỗi sự kiện native input & change
      try {
        ta.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        ta.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        if (typeof InputEvent !== 'undefined') {
          ta.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text }));
        }
      } catch(e) {}

      // Tầng 5: Gọi trực tiếp onChange trong __reactProps$ của component Textarea
      try {
        var props = getReactProps(ta);
        if (props && typeof props.onChange === 'function') {
          props.onChange({ target: { value: text }, currentTarget: { value: text } });
        }
      } catch(e) {}
    }

    function getTextarea() {
      var inps = document.querySelectorAll('textarea.w-md-editor-text-input, .w-md-editor textarea, textarea, input[type="text"], div[contenteditable="true"]');
      for (var i = 0; i < inps.length; i++) {
        var inp = inps[i];
        if (!inp.closest('#enx-pro-hud, #enx-key-modal') && inp.offsetParent !== null) return inp;
      }
      return null;
    }

    function openRadialMenuIfNeeded() {
      try {
        var submitDirect = document.querySelector('button[data-intent="SUBMIT_ANSWER"], [data-intent="SUBMIT_ANSWER"]');
        if (submitDirect && submitDirect.offsetParent !== null) return;
        var visibleItems = Array.from(document.querySelectorAll('.exercise-intent-radial__item, [class*="radial__item"]')).filter(function(el) {
          return !el.closest('#enx-pro-hud, #enx-key-modal') && el.offsetParent !== null;
        });
        if (visibleItems.length > 0) return;
        var trigger = document.querySelector('button.w-send-btn:not(.w-send-btn--close), .exercise-intent-radial__trigger, [class*="radial__trigger"], [class*="intent-radial"] > button, .radial-trigger');
        if (trigger && !trigger.closest('#enx-pro-hud, #enx-key-modal') && trigger.offsetParent !== null) {
          log('info', 'Mở menu nộp bài...');
          trigger.click();
        }
      } catch(e) {}
    }

    // BỘ TRACK VÀ BẤM NÚT NỘP ĐA TẦNG - TƯƠNG THÍCH CHUẨN EDUNEXT REACT 18
    function findSubmitButton(inp) {
      var candidates = [];

      function consider(el, score, reason) {
        if (!el) return;
        // Chỉ loại trừ chính HUD và sidebar bên trái, KHÔNG loại trừ intent-panel bên phải input
        if (el.closest('#enx-pro-hud, #enx-key-modal, .course-lesson-list, [class*="lesson-list"], aside:not(.w-chat-input__intent-panel), nav, .ant-layout-sider')) return;
        candidates.push({ el: el, score: score, reason: reason });
      }

      // 1. data-intent="SUBMIT_ANSWER" (EduNext chuẩn khi ở bài tập)
      var intentBtns = Array.from(document.querySelectorAll('button[data-intent="SUBMIT_ANSWER"], [data-intent="SUBMIT_ANSWER"]'));
      for (var i = 0; i < intentBtns.length; i++) {
        consider(intentBtns[i], 100, 'intent=SUBMIT_ANSWER');
      }

      // 2. Intent column/radial/submit items trong EduNext chat widget
      var intentItems = Array.from(document.querySelectorAll('.exercise-intent-column__item, .exercise-intent-radial__item, .exercise-intent-submit__button, [class*="exercise-intent"] button'));
      for (var j = 0; j < intentItems.length; j++) {
        var it = intentItems[j];
        var itTxt = (it.innerText || it.textContent || it.getAttribute('aria-label') || '').trim();
        if (/nộp\s*(?:câu\s*trả\s*lời|đáp\s*án|bài)?|submit/i.test(itTxt)) {
          consider(it, 95, 'intent-item-submit');
        }
      }

      // 3. Nút Gửi tin nhắn w-send-btn (khi ở chế độ chat thông thường / hỏi sẵn sàng)
      var sendBtns = Array.from(document.querySelectorAll('button.w-send-btn:not(.w-send-btn--close), .w-send-btn:not(.w-send-btn--close), button[class*="w-send-btn"], button[aria-label*="Gửi tin nhắn"], button[aria-label*="Send message"]'));
      for (var k = 0; k < sendBtns.length; k++) {
        consider(sendBtns[k], 90, 'w-send-btn');
      }

      // 4. Tìm tất cả phần tử có text/aria/title "Nộp câu trả lời" hoặc "Nộp đáp án"
      var allClickables = Array.from(document.querySelectorAll('button, [role="button"], div, span, a, input[type="button"], input[type="submit"]'));
      for (var l = 0; l < allClickables.length; l++) {
        var el = allClickables[l];
        if (el.closest('#enx-pro-hud, #enx-key-modal, .course-lesson-list, aside:not(.w-chat-input__intent-panel), nav, .ant-layout-sider')) continue;
        if (el.classList.contains('w-chat-input__submit-note') || (el.innerText || '').includes('Enter là xuống hàng')) continue;

        var txt = (el.innerText || el.textContent || '').trim();
        var aria = (el.getAttribute('aria-label') || '').trim();
        var title = (el.getAttribute('title') || '').trim();

        if (/^(?:nộp\s+câu\s+trả\s+lời|nộp\s+đáp\s+án|nộp\s+bài|submit\s+answer)$/i.test(txt)) {
          var targetEl = el.tagName === 'BUTTON' ? el : (el.querySelector('button, [role="button"]') || el.closest('button, [role="button"]') || el);
          consider(targetEl, 85, 'text=Nộp câu trả lời');
        } else if (/nộp\s+câu\s+trả\s+lời|nộp\s+đáp\s+án|nộp\s+bài/i.test(aria) || /nộp\s+câu\s+trả\s+lời|nộp\s+đáp\s+án|nộp\s+bài/i.test(title)) {
          var targetEl2 = el.tagName === 'BUTTON' ? el : (el.querySelector('button, [role="button"]') || el.closest('button, [role="button"]') || el);
          consider(targetEl2, 80, 'aria/title=Nộp câu trả lời');
        }
      }

      // 5. Nút nằm cạnh ô input trong composer row
      if (inp) {
        var composerRow = inp.closest('.w-chat-input__composer-row, .w-chat-input__layout, .w-chat-input, .chat-footer') || inp.parentElement;
        if (composerRow) {
          var btns = Array.from(composerRow.querySelectorAll('button, [role="button"]'));
          for (var m = 0; m < btns.length; m++) {
            var b = btns[m];
            if (b.closest('#enx-pro-hud, #enx-key-modal')) continue;
            var bTxt = (b.innerText || b.textContent || '').trim().toLowerCase();
            if (bTxt === 'text' || bTxt === 'math' || bTxt === '∑ math' || bTxt === 'sigma' || bTxt === 'b' || bTxt === 'i') continue;
            consider(b, 70, 'composer-button');
          }
        }
      }

      if (candidates.length > 0) {
        candidates.sort(function(a, b) { return b.score - a.score; });
        return candidates[0].el;
      }
      return null;
    }

    function triggerClick(el) {
      if (!el) return false;
      try {
        el.focus && el.focus();
        try {
          el.disabled = false;
          el.removeAttribute('disabled');
        } catch(e) {}

        var opts = { bubbles: true, cancelable: true, view: window, composed: true };
        el.dispatchEvent(new PointerEvent('pointerdown', opts));
        el.dispatchEvent(new MouseEvent('mousedown', opts));
        el.dispatchEvent(new PointerEvent('pointerup', opts));
        el.dispatchEvent(new MouseEvent('mouseup', opts));
        el.dispatchEvent(new MouseEvent('click', opts));
        el.click && el.click();

        // Kích hoạt trực tiếp onClick trong React Props
        var props = getReactProps(el);
        if (props && typeof props.onClick === 'function') {
          props.onClick({ preventDefault: function(){}, stopPropagation: function(){}, currentTarget: el, target: el });
        }
        return true;
      } catch(e) {
        try {
          el.click();
          return true;
        } catch(err) {
          return false;
        }
      }
    }

    function dispatchEnter(target) {
      if (!target) return;
      try {
        target.focus && target.focus();
        var ctrlEv = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, charCode: 13, ctrlKey: true, bubbles: true, cancelable: true, composed: true, view: window };
        target.dispatchEvent(new KeyboardEvent('keydown', ctrlEv));
        target.dispatchEvent(new KeyboardEvent('keypress', ctrlEv));
        target.dispatchEvent(new KeyboardEvent('keyup', ctrlEv));

        var ev = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, charCode: 13, bubbles: true, cancelable: true, composed: true, view: window };
        target.dispatchEvent(new KeyboardEvent('keydown', ev));
        target.dispatchEvent(new KeyboardEvent('keypress', ev));
        target.dispatchEvent(new KeyboardEvent('keyup', ev));
      } catch(e) {}
    }

    // THỰC HIỆN NỘP BÀI: ĐIỀN TEXT 5 TẦNG, TRACK NÚT VÀ BẤM NỘP + GỌI REACT FIBER
    async function submitAnswerToEduNext(ans) {
      if (!ans || isSubmitting) return false;
      var clean = ans.trim();

      var ta = getTextarea();
      if (!ta) {
        log('warn', 'Không tìm thấy ô nhập câu trả lời!');
        return false;
      }

      isSubmitting = true;
      try {
        // 1. Điền text bằng cơ chế đồng bộ React Fiber & DOM 5 tầng
        fillReactInput(ta, clean);
        log('info', 'Đã gõ nội dung: "' + clean.slice(0, 35) + '..."');
        setStatus('● Đang tìm và bấm nút Nộp câu trả lời...', '#10b981');

        await new Promise(function(resolve) { setTimeout(resolve, 250); });
        openRadialMenuIfNeeded();

        await new Promise(function(resolve) { setTimeout(resolve, 250); });

        var submittedSuccessfully = false;

        // 2. Track nút nộp và click
        var btn = findSubmitButton(ta);
        if (btn) {
          var btnName = (btn.innerText || btn.textContent || btn.getAttribute('aria-label') || 'Nút Nộp').trim();
          var ok = triggerClick(btn);
          if (ok) {
            submittedSuccessfully = true;
            lastSubmitTimestamp = Date.now();
            lastSubmittedText = clean;
            log('success', '✓ ĐÃ BẤM [' + (btnName.slice(0, 25) || 'Nộp câu trả lời') + '] thành công!');
            setStatus('✓ Đã nộp thành công! Đang chờ phản hồi...', '#34d399');
          }
        }

        // 3. Kích hoạt trực tiếp onSendMessage qua React Fiber nếu chưa nộp thành công
        try {
          var onSendFn = findReactFunction(ta, 'onSendMessage');
          if (typeof onSendFn === 'function') {
            log('info', '✓ Kích hoạt onSendMessage trực tiếp từ EduNext React Fiber!');
            onSendFn(clean, clean, { resolved_intent: 'SUBMIT_ANSWER' });
            submittedSuccessfully = true;
            lastSubmitTimestamp = Date.now();
            lastSubmittedText = clean;
            setStatus('✓ Đã gửi qua React Fiber! Đang chờ chuyển tiếp...', '#34d399');
          }
        } catch(e) {}

        // 4. Fallback gửi phím Enter nếu mọi cách khác không phản hồi
        if (!submittedSuccessfully) {
          dispatchEnter(ta);
          lastSubmitTimestamp = Date.now();
          lastSubmittedText = clean;
          log('warn', 'Không thấy nút nộp dạng click, đã gửi tổ hợp Ctrl+Enter & Enter!');
          setStatus('● Đã gửi Enter bài làm.', '#38bdf8');
        }

        setTimeout(function() { isSubmitting = false; }, 3500);
        return true;
      } catch(err) {
        isSubmitting = false;
        log('err', 'Lỗi khi nộp bài: ' + (err.message || err));
        return false;
      }
    }

    function handleIntentModal() {
      for (var modals = document.querySelectorAll('.ant-modal, .dialog, [role="dialog"]'), i = 0; i < modals.length; i++) {
        var m = modals[i];
        if (/làm rõ ý định|ý định của bạn/i.test(m.textContent || '')) {
          var opts = m.querySelectorAll('input[type="radio"], .ant-radio-wrapper, button[class*="option"]');
          if (opts.length > 0) {
            opts[Math.floor(Math.random() * opts.length)].click();
            log('success', 'Tự chọn ý định học tập.');
            setTimeout(function() {
              for (var btns = m.querySelectorAll('button'), b = 0; b < btns.length; b++) {
                var btn = btns[b];
                if (/xác nhận|đồng ý|tiếp tục|submit|confirm/i.test(btn.textContent || '')) {
                  btn.click();
                  log('success', 'Bấm Xác nhận lựa chọn!');
                  break;
                }
              }
            }, 400);
            return true;
          }
        }
      }
      return false;
    }

    // TÌM NÚT SẴN SÀNG TRONG KHUNG CHAT
    function findReadyButtonInChat() {
      var allBtns = Array.from(document.querySelectorAll('button, [role="button"], a, div'));
      for (var i = 0; i < allBtns.length; i++) {
        var b = allBtns[i];
        if (b.closest('#enx-pro-hud, #enx-key-modal, .course-lesson-list') || b.offsetParent === null) continue;
        var txt = (b.innerText || b.textContent || '').trim();
        if (/^sẵn\s*sàng$/i.test(txt)) {
          return b;
        }
      }
      return null;
    }

    // KIỂM TRA TOÀN BỘ MÀN HÌNH CÓ BÁO HOÀN THÀNH BÀI HỌC KHÔNG
    function checkLessonCompleted() {
      var mainArea = document.querySelector('.chat-view, [class*="chat-content"], [class*="chat-container"], main, .ant-layout-content') || document.body;
      var text = (mainArea.innerText || '').toLowerCase();
      return text.includes('hoàn thành bài học') || 
             text.includes('chúc mừng bạn đã hoàn thành') || 
             text.includes('buổi học đã kết thúc') || 
             text.includes('bài học đã kết thúc') ||
             text.includes('đã hoàn thành toàn bộ');
    }

    // VÒNG LẶP CHÍNH (THEO ĐÚNG CHỈ ĐẠO CỦA USER):
    // 1. Khi bật lên / gặp slide bắt đầu: viết "Sẵn sàng", track nút nộp rồi bấm nộp.
    // 2. Tiếp theo có câu hỏi hiện ra: track câu hỏi, type câu trả lời và nộp.
    // 3. Lặp lại tới khi hiện hoàn thành bài học!
    async function runAgentLoop(isForced) {
      if (!isAuto && !isForced) return;
      if (isSubmitting) return;

      var now = Date.now();

      // Kiểm tra hoàn thành bài học
      if (checkLessonCompleted()) {
        log('success', '🎉 CHÚC MỪNG: ĐÃ HOÀN THÀNH TOÀN BỘ BÀI HỌC!');
        setStatus('🎉 ĐÃ HOÀN THÀNH TOÀN BỘ BÀI HỌC!', '#10b981');
        isAuto = false;
        var btn = document.getElementById('hud-auto-btn');
        if (btn) {
          btn.textContent = '⏸ Auto: TẮT';
          btn.style.background = 'rgba(100,116,139,0.2)';
        }
        return;
      }

      if (now < rateLimitCooldownUntil && !isForced) {
        setStatus('⚠️ Đang hoãn chờ rate-limit phục hồi...', '#f59e0b');
        return;
      }

      if (now - lastSubmitTimestamp < 4500 && !isForced) {
        return;
      }

      if (handleIntentModal()) return;

      // KIỂM TRA XEM MÀN HÌNH CÓ ĐANG HỎI "BẠN ĐÃ SẴN SÀNG CHUYỂN SANG PHẦN TIẾP THEO CHƯA?"
      var mainArea = document.querySelector('.chat-view, [class*="chat-content"], [class*="chat-container"], main, .ant-layout-content') || document.body;
      var domText = (mainArea.innerText || '');
      var isReadyScreen = /sẵn\s*sàng\s*chuyển\s*sang\s*phần\s*tiếp\s*theo|bạn\s*đã\s*sẵn\s*sàng/i.test(domText);
      var readyBtn = findReadyButtonInChat();

      // TRƯỜNG HỢP 1: MÀN HÌNH HỎI SẴN SÀNG (HOẶC VỪA BẬT LÊN) -> VIẾT SẴN SÀNG & NỘP NGAY
      if (isReadyScreen || readyBtn) {
        // Tránh nộp lặp nếu vừa mới nộp "Sẵn sàng" trong vòng 7 giây
        if (lastSubmittedText === 'Sẵn sàng' && now - lastSubmitTimestamp < 7000 && !isForced) {
          setStatus('● Đã nộp "Sẵn sàng", đang chờ câu hỏi đầu tiên...', '#38bdf8');
          return;
        }

        log('info', 'Phát hiện màn hình bắt đầu -> Tự động điền "Sẵn sàng" và bấm Nộp!');
        setStatus('● Tự động nộp "Sẵn sàng"...', '#10b981');
        if (readyBtn) {
          try { readyBtn.click(); } catch(e) {}
        }
        await submitAnswerToEduNext('Sẵn sàng');
        return;
      }

      // TRƯỜNG HỢP 2: Ô NHẬP ĐÃ CÓ TEXT (VÍ DỤ ĐÃ ĐIỀN ĐÁP ÁN HOẶC USER GÕ) -> TỰ ĐỘNG BẤM NỘP
      var curTa = getTextarea();
      if (curTa && curTa.value && curTa.value.trim().length > 0) {
        var curVal = curTa.value.trim();
        // Nếu khác text vừa nộp, hoặc đã qua 8s mà ô text vẫn chưa được hệ thống xóa
        if ((curVal !== lastSubmittedText || now - lastSubmitTimestamp > 8000)) {
          log('info', 'Phát hiện ô nhập đã có nội dung: "' + curVal.slice(0, 30) + '..." -> Bấm Nộp bài ngay!');
          await submitAnswerToEduNext(curVal);
          return;
        }
      }

      // TRƯỜNG HỢP 3: TRACK CÂU HỎI TIẾP THEO QUA VISION & GIẢI BẰNG GEMINI
      var hasLiveVision = visionScreenStream && visionScreenStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; });
      if (hasLiveVision) {
        if (now - lastVisionShotTime < 4500 && !isForced) {
          return;
        }
        lastVisionShotTime = now;

        var shot = capturePersistentVisionFrame();
        if (shot && shot.image) {
          var chat = getLatestChatState();
          var latestText = chat.text || '';

          // Tránh gọi Gemini trùng lặp nếu câu hỏi chưa thay đổi
          var questionHash = shot.image.slice(-100) + '_' + latestText.slice(0, 50);
          if (questionHash === lastSolvedHash && !isForced && now - lastSubmitTimestamp < 20000) {
            setStatus('● Đang chờ phản hồi câu vừa nộp...', '#94a3b8');
            return;
          }

          log('info', '📸 Quét ảnh màn hình 5s (' + shot.width + 'x' + shot.height + ')...');
          setStatus('● Gemini Flash đang giải bài từ ảnh...', '#38bdf8');

          var visionPrompt = [
            'Dùng ảnh màn hình mới nhất để nhận diện và giải quyết bài tập trên EduNext.',
            latestText ? 'NỘI DUNG VĂN BẢN TRÊN KHUNG CHAT:\n' + latestText : '',
            'QUY TẮC BẮT BUỘC:',
            '1. Nếu ảnh cho thấy buổi học ĐÃ KẾT THÚC hoặc có lời chúc mừng hoàn thành bài học, CHỈ XUẤT ĐÚNG MÃ: __LESSON_COMPLETE__',
            '2. Nếu ảnh có câu hỏi xác nhận "Bạn đã sẵn sàng chuyển sang phần tiếp theo chưa?", CHỈ XUẤT ĐÚNG: Sẵn sàng',
            '3. Nếu ảnh có CÂU HỎI / BÀI TẬP MỚI cần học sinh trả lời (bài tập hóa học, vật lý, toán, tiếng Anh, trắc nghiệm hoặc tự luận điền vào ô trống):',
            '   - Hãy giải câu hỏi đó và xuất ĐÚNG ĐÁP ÁN theo định dạng trong ảnh.',
            '   - Trả lời ngắn gọn, trực tiếp theo mẫu đề (ví dụ "Trả lời: [đáp án]"), không giải thích dài dòng.',
            '   - Tuyệt đối KHÔNG trả lời "Sẵn sàng" khi có câu hỏi bài tập.',
            '4. Nếu ảnh KHÔNG CÓ CÂU HỎI MỚI cần trả lời (chỉ là màn hình chờ, đang phân tích, bài giảng lý thuyết đang đọc, hoặc câu trả lời vừa gửi đang chờ chấm), CHỈ XUẤT ĐÚNG MÃ: __NO_QUESTION__'
          ].filter(Boolean).join('\n\n');

          isSubmitting = true;
          try {
            var ans = await solveQuestion(visionPrompt, shot.image);
            if (!ans) {
              isSubmitting = false;
              setStatus('idle');
              return;
            }

            // Hoàn thành toàn bộ bài học
            if (/_{0,2}\s*LESSON_COMPLETE\s*_{0,2}/i.test(ans)) {
              log('success', '🎉 ĐÃ HOÀN THÀNH TOÀN BỘ BÀI HỌC!');
              setStatus('🎉 ĐÃ HOÀN THÀNH TOÀN BỘ BÀI HỌC!', '#10b981');
              isAuto = false;
              var autoBtnEl = document.getElementById('hud-auto-btn');
              if (autoBtnEl) {
                autoBtnEl.textContent = '⏸ Auto: TẮT';
                autoBtnEl.style.background = 'rgba(100,116,139,0.2)';
              }
              isSubmitting = false;
              return;
            }

            // Không có câu hỏi mới
            if (/_{0,2}\s*NO_QUESTION\s*_{0,2}/i.test(ans)) {
              setStatus('● Chưa có câu hỏi mới; quét tiếp sau 5s...', '#94a3b8');
              isSubmitting = false;
              return;
            }

            // Nếu câu trả lời trùng câu vừa nộp trong vòng 20s
            if (lastSubmittedText && ans.trim() === lastSubmittedText.trim() && now - lastSubmitTimestamp < 20000 && !isForced) {
              setStatus('● Đáp án khớp câu vừa nộp, đang chờ hệ thống chuyển bài...', '#94a3b8');
              isSubmitting = false;
              return;
            }

            lastSolvedHash = questionHash;
            isSubmitting = false; // Mở khóa để submitAnswerToEduNext có thể chạy
            await submitAnswerToEduNext(ans);
          } catch(err) {
            isSubmitting = false;
            log('warn', 'Lỗi Gemini: ' + (err.message || err));
          }
        }
      } else {
        // NẾU CHƯA CÓ CHIA SẺ MÀN HÌNH NHƯNG CÓ VĂN BẢN CÂU HỎI TRONG DOM
        var chatState = getLatestChatState();
        if (chatState.state === 'student_turn' && chatState.text) {
          if (now - lastVisionShotTime > 5000) {
            lastVisionShotTime = now;
            log('info', 'Phát hiện câu hỏi văn bản: "' + chatState.text.slice(0, 30) + '..."');
            setStatus('● Đang giải câu hỏi từ văn bản...', '#38bdf8');
            var textPrompt = 'Giải câu hỏi bài tập sau ngắn gọn, chính xác theo mẫu:\n' + chatState.text;
            isSubmitting = true;
            try {
              var textAns = await solveQuestion(textPrompt, null);
              isSubmitting = false;
              if (textAns && !textAns.startsWith('__')) {
                await submitAnswerToEduNext(textAns);
              }
            } catch(e) {
              isSubmitting = false;
            }
          }
        } else if (isForced) {
          alert('⚠️ Vui lòng bấm [📸 Chia Sẻ Màn Hình] để bot có thể chụp ảnh giải bài!');
          toggleScreenShare();
        }
      }
    }

    renderView();

    var agentInterval = setInterval(function() {
      runAgentLoop(false);
    }, 2000);

    d.addEventListener('enx_destroy', function() {
      clearInterval(agentInterval);
    });

    (document.body || document.documentElement).appendChild(d);

  } catch(e) {
    alert('Lỗi khởi động EduNext AI Pro: ' + e.message);
  }
}

async function build() {
  const fnString = bookmarkletFunction.toString();
  console.log(`Original bookmarkletFunction length: ${fnString.length} chars`);

  const minified = await terser.minify(fnString, {
    compress: {
      drop_console: false,
      passes: 2
    },
    mangle: {
      toplevel: true
    },
    format: {
      comments: false,
      quote_style: 1
    }
  });

  const singleLine = minified.code.replace(/[\r\n]+/g, ' ').trim();
  console.log(`Minified bookmarkletFunction length: ${singleLine.length} chars`);

  fs.writeFileSync(path.join(__dirname, 'v10_2_12_minified.js'), singleLine, 'utf8');
  console.log('Saved v10_2_12_minified.js');
}

build();
