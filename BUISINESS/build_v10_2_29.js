const fs = require('fs');
const path = require('path');
const terser = require(path.join(__dirname, 'FPT service', 'node_modules', 'next', 'dist', 'compiled', 'terser'));

function bookmarkletFunction(preKey) {
  try {
    var CURRENT_VERSION = 'v10.2.29';

    // 1. NẾU CÙNG PHIÊN BẢN VÀ ĐÃ CÓ HUD THÌ CHỈ ẨN / HIỆN
    if (window.__ENX_PRO_HUD__ && window.__ENX_VERSION__ === CURRENT_VERSION) {
      var ex = document.getElementById('enx-pro-hud');
      if (ex) {
        ex.style.display = (ex.style.display === 'none' ? 'block' : 'none');
        return;
      }
    }

    // 2. NẾU LÀ PHIÊN BẢN CŨ HOẶC CÓ HUD CŨ ĐANG CHẠY NGẦM
    // -> TIÊU DIỆT TOÀN BỘ TIMER, OBSERVER VÀ GỠ HUD CŨ
    try {
      var oldHud = document.getElementById('enx-pro-hud');
      if (oldHud) {
        oldHud.dispatchEvent(new CustomEvent('enx_destroy'));
        oldHud.remove();
      }
    } catch(e) {}

    window.__ENX_PRO_HUD__ = true;
    window.__ENX_VERSION__ = CURRENT_VERSION;
    var ENX_CIPHER_SALT = 'ENX_SEC_2026_FLASH_LITE';

    // GIẢI MÃ & KIỂM TRA HẠN DÙNG KEY BẢN QUYỀN (1 Tuần, 1 Tháng, 1 Kỳ)
    function validateKeyStatus(enc) {
      if (!enc || typeof enc !== 'string') return { valid: false, reason: 'Chưa có Key bản quyền' };
      var clean = enc.trim();
      if (clean.startsWith('AIza') || clean.startsWith('AQ.')) {
        return { valid: true, expired: false, key: clean, plan: 'Lifetime' };
      }
      if (!clean.startsWith('ENC_AI_')) return { valid: false, reason: 'Key không đúng định dạng (cần bắt đầu bằng ENC_AI_)' };
      try {
        var b64 = clean.slice(7);
        var hex = atob(b64);
        var raw = '';
        for (var i = 0; i < hex.length; i += 2) {
          var c = parseInt(hex.substr(i, 2), 16) ^ ENX_CIPHER_SALT.charCodeAt((i / 2) % ENX_CIPHER_SALT.length);
          raw += String.fromCharCode(c);
        }
        if (raw && raw.startsWith('EXP|')) {
          var parts = raw.split('|');
          var exp = parseInt(parts[1], 10);
          var plan = parts[2] || 'VIP';
          var k = parts.slice(3).join('|');
          var now = Date.now();
          if (isNaN(exp)) return { valid: false, reason: 'Lỗi timestamp thời hạn' };
          var expDate = new Date(exp).toLocaleDateString('vi-VN') + ' ' + new Date(exp).toLocaleTimeString('vi-VN');
          if (now > exp) {
            try {
              localStorage.removeItem('enx_encrypted_ai_key');
              localStorage.removeItem('enx_license_key');
            } catch(_) {}
            activeEncryptedKey = '';
            return { valid: false, expired: true, plan: plan, expDate: expDate, reason: 'Key gói ' + plan + ' đã hết hạn vào ' + expDate + ' và đã tự động biến mất khỏi trình duyệt!' };
          }
          var remDays = Math.ceil((exp - now) / 86400000);
          return { valid: true, expired: false, key: k, plan: plan, expDate: expDate, remDays: remDays };
        }
        if (raw && (raw.startsWith('AIza') || raw.startsWith('AQ.') || raw.length >= 20)) {
          return { valid: true, expired: false, key: raw, plan: 'VIP' };
        }
        return { valid: false, reason: 'Key không hợp lệ' };
      } catch(e) {
        return { valid: false, reason: 'Lỗi giải mã: ' + (e.message || e) };
      }
    }

    function decryptEncryptedKey(enc) {
      var st = validateKeyStatus(enc);
      return (st.valid && !st.expired) ? st.key : null;
    }

    // Biến Trạng Thái
    if (preKey && typeof preKey === 'string' && preKey.trim().indexOf('ENC_AI_') === 0) {
      try {
        localStorage.setItem('enx_encrypted_ai_key', preKey.trim());
      } catch(_) {}
    }
    var activeEncryptedKey = preKey || localStorage.getItem('enx_encrypted_ai_key') || localStorage.getItem('enx_license_key') || '';
    var isSubmitting = false;
    var lastSubmitTimestamp = 0;
    var lastSubmittedText = '';
    var lastSolvedHash = '';
    var isAuto = true;
    var rateLimitCooldownUntil = 0;
    var preferredModel = 'gemini-flash-lite-latest';

    // Vision Stream & Video
    var visionScreenStream = null;
    var visionScreenVideo = null;
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

    // Rate Limit 429 Interceptor (Hook cả fetch và XMLHttpRequest)
    (function installRateLimitDetector() {
      try {
        if (window.fetch && !window.__enx_fetch_hooked) {
          var nativeFetch = window.fetch;
          window.fetch = async function(...args) {
            try {
              var res = await nativeFetch.apply(this, args);
              if (res && res.status === 429) {
                rateLimitCooldownUntil = Date.now() + 25000;
                log('warn', 'EduNext 429 Too Many Requests -> Tự động hoãn 25s bảo vệ nick');
              }
              return res;
            } catch(e) {
              return nativeFetch.apply(this, args);
            }
          };
          window.__enx_fetch_hooked = true;
        }

        if (window.XMLHttpRequest && !window.__enx_xhr_hooked) {
          var realSend = XMLHttpRequest.prototype.send;
          XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('load', function() {
              if (this.status === 429) {
                rateLimitCooldownUntil = Date.now() + 25000;
                log('warn', 'EduNext 429 Too Many Requests (XHR) -> Tự động hoãn 25s');
              }
            });
            return realSend.apply(this, args);
          };
          window.__enx_xhr_hooked = true;
        }
      } catch(_) {}
    })();

    // Giao Diện HUD v10.2.29
    var d = document.createElement('div');
    d.id = 'enx-pro-hud';
    d.style.cssText = 'position:fixed;top:70px;right:25px;z-index:2147483647;width:370px;background:rgba(11,15,25,0.98);border:2px solid #10b981;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,0.85),0 0 25px rgba(16,185,129,0.35);padding:14px;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;backdrop-filter:blur(16px);font-size:12px;box-sizing:border-box;transition:opacity 0.2s;';

    // Dragging
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

    var titleBox = document.createElement('div');
    titleBox.style.cssText = 'display:flex;align-items:center;gap:8px;';
    var icon = document.createElement('div');
    icon.style.cssText = 'width:28px;height:28px;border-radius:8px;background:#10b981;display:flex;align-items:center;justify-content:center;color:#000;font-weight:900;font-size:14px;';
    icon.textContent = '⚡';
    titleBox.appendChild(icon);

    var titleText = document.createElement('div');
    var tRow1 = document.createElement('div');
    tRow1.style.cssText = 'font-weight:800;font-size:13px;color:#fff;display:flex;align-items:center;gap:6px;';
    tRow1.textContent = 'EduNext AI Pro ';
    var vBadge = document.createElement('span');
    vBadge.style.cssText = 'font-size:10px;background:rgba(16,185,129,0.2);color:#34d399;border:1px solid rgba(16,185,129,0.4);padding:1px 5px;border-radius:4px;';
    vBadge.textContent = CURRENT_VERSION;
    tRow1.appendChild(vBadge);

    var tRow2 = document.createElement('div');
    tRow2.style.cssText = 'font-size:10px;color:#10b981;font-weight:600;';
    tRow2.textContent = 'Auto Loop: Tự Động Quét & Giải Liên Tục 100%';
    titleText.appendChild(tRow1);
    titleText.appendChild(tRow2);
    titleBox.appendChild(titleText);
    hd.appendChild(titleBox);

    var actBox = document.createElement('div');
    actBox.style.cssText = 'display:flex;align-items:center;gap:4px;';

    var minBtn = document.createElement('button');
    minBtn.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:2px 4px;line-height:1;';
    minBtn.textContent = '─';
    minBtn.title = 'Thu nhỏ / Mở rộng';
    minBtn.onclick = function() {
      bodyBox.style.display = (bodyBox.style.display === 'none' ? 'block' : 'none');
    };
    actBox.appendChild(minBtn);

    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:2px 6px;line-height:1;';
    closeBtn.textContent = '✕';
    closeBtn.onclick = function() {
      try { d.dispatchEvent(new CustomEvent('enx_destroy')); } catch(e) {}
      if (visionScreenStream) {
        visionScreenStream.getTracks().forEach(function(t) { t.stop(); });
      }
      d.remove();
      window.__ENX_PRO_HUD__ = false;
      window.__ENX_VERSION__ = null;
    };
    actBox.appendChild(closeBtn);
    hd.appendChild(actBox);
    d.appendChild(hd);

    // Body
    var bodyBox = document.createElement('div');

    function renderBody() {
      while (bodyBox.firstChild) bodyBox.removeChild(bodyBox.firstChild);

      var hasVision = !!(visionScreenStream && visionScreenStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; }));
      var keyCheck = validateKeyStatus(activeEncryptedKey);
      var hasKey = keyCheck.valid && !keyCheck.expired;
      var hasTampermonkey = (typeof GM_xmlhttpRequest === 'function') || 
                            (typeof window !== 'undefined' && typeof window.__ENX_GM_XHR__ === 'function') || 
                            (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.__ENX_GM_XHR__ === 'function');

      // 1. BANNER CẦU NỐI AI
      if (!hasTampermonkey) {
        var bridgeBox = document.createElement('div');
        bridgeBox.style.cssText = 'background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:8px 10px;margin-bottom:8px;';
        
        var bHead = document.createElement('div');
        bHead.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;';
        var bTitle = document.createElement('span');
        bTitle.style.cssText = 'font-weight:700;color:#34d399;font-size:10px;';
        bTitle.textContent = '⚡ CHẾ ĐỘ BOOKMARKLET 100%';
        bHead.appendChild(bTitle);

        var bStatus = document.createElement('span');
        var isBridgeOpen = bridgeWin && !bridgeWin.closed;
        bStatus.style.cssText = isBridgeOpen ? 'color:#10b981;font-weight:700;font-size:10px;' : 'color:#f59e0b;font-weight:700;font-size:10px;';
        bStatus.textContent = isBridgeOpen ? '✓ Đã mở Cầu Nối' : '⚠️ Cần mở Cầu Nối AI';
        bHead.appendChild(bStatus);
        bridgeBox.appendChild(bHead);

        var bDesc = document.createElement('div');
        bDesc.style.cssText = 'font-size:9.5px;color:#cbd5e1;margin-bottom:6px;line-height:1.3;';
        bDesc.textContent = 'Bấm nút dưới để mở Cầu Nối AI vượt CSP Cloudflare (Không cần cài đặt script).';
        bridgeBox.appendChild(bDesc);

        var bBtn = document.createElement('button');
        bBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#059669,#10b981);border:none;color:#fff;font-weight:800;font-size:10px;padding:6px;border-radius:6px;cursor:pointer;';
        bBtn.textContent = '🌐 BẤM ĐÂY ĐỂ MỞ CẦU NỐI AI (VƯỢT CSP NGAY)';
        bBtn.onclick = function() {
          openBridgeWindow();
          renderBody();
        };
        bridgeBox.appendChild(bBtn);
        bodyBox.appendChild(bridgeBox);
      }

      // 2. BANNER CẦN CHIA SẺ MÀN HÌNH NẾU CHƯA BẬT
      if (!hasVision) {
        var vAlert = document.createElement('div');
        vAlert.style.cssText = 'background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:10px;padding:8px 10px;margin-bottom:8px;text-align:center;';
        var vaTxt = document.createElement('div');
        vaTxt.style.cssText = 'font-size:10px;color:#fca5a5;font-weight:700;margin-bottom:6px;';
        vaTxt.textContent = '📷 CẦN CHIA SẺ MÀN HÌNH ĐỂ BOT TỰ ĐỘNG CHỤP & GIẢI BÀI!';
        vAlert.appendChild(vaTxt);

        var vaBtn = document.createElement('button');
        vaBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#ef4444,#dc2626);border:none;color:#fff;font-weight:900;font-size:11px;padding:8px;border-radius:6px;cursor:pointer;animation:pulse 2s infinite;';
        vaBtn.textContent = '👉 BẤM ĐÂY ĐỂ BẬT CHIA SẺ MÀN HÌNH (TAB EDUNEXT)';
        vaBtn.onclick = function() {
          toggleScreenVision();
        };
        vAlert.appendChild(vaBtn);
        bodyBox.appendChild(vAlert);
      }

      // 3. TRẠNG THÁI BẢN QUYỀN (100% READ-ONLY TỰ ĐỘNG - KHÔNG HIỂN THỊ NÚT SỬA/COPY/MODAL)
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
      bodyBox.appendChild(kBox);

      // 4. TRẠNG THÁI MÀN HÌNH VISION
      var vBox = document.createElement('div');
      vBox.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:6px 10px;margin-bottom:8px;';
      var vLabel = document.createElement('div');
      vLabel.style.cssText = 'display:flex;align-items:center;gap:6px;';
      var vDot = document.createElement('span');
      vDot.style.cssText = hasVision ? 'color:#10b981;' : 'color:#ef4444;';
      vDot.textContent = '●';
      vLabel.appendChild(vDot);
      var vStatusText = document.createElement('span');
      vStatusText.style.cssText = hasVision ? 'color:#10b981;font-weight:700;' : 'color:#94a3b8;';
      vStatusText.textContent = hasVision ? 'Màn Hình: Đang kết nối (Auto Vision)' : 'Màn Hình: Chưa bật';
      vLabel.appendChild(vStatusText);
      vBox.appendChild(vLabel);

      var vToggleBtn = document.createElement('button');
      vToggleBtn.style.cssText = hasVision ? 'background:rgba(239,68,68,0.2);border:1px solid #ef4444;color:#fca5a5;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:10px;font-weight:700;' : 'background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#34d399;padding:4px 8px;border-radius:6px;cursor:pointer;font-size:10px;font-weight:700;';
      vToggleBtn.textContent = hasVision ? 'Ngắt Kết Nối' : '📷 Chia Sẻ Màn Hình';
      vToggleBtn.onclick = function() {
        toggleScreenVision();
      };
      vBox.appendChild(vToggleBtn);
      bodyBox.appendChild(vBox);

      // 5. NÚT CHỤP & GIẢI THỦ CÔNG + NÚT TOGGLE AUTO
      var actRow = document.createElement('div');
      actRow.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';

      var solveBtn = document.createElement('button');
      solveBtn.style.cssText = 'flex:1;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-weight:800;font-size:11px;padding:9px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(16,185,129,0.3);';
      solveBtn.textContent = '🎯 Chụp & Giải Câu Này Ngay';
      solveBtn.onclick = function() {
        var qc = checkCourseWeeklyQuota();
        if (!qc.allowed) {
          alert('⛔ ' + qc.reason);
          return;
        }
        if (!hasVision) {
          alert('Vui lòng bấm [📸 Chia Sẻ Màn Hình] để bot có thể chụp ảnh đề bài!');
          toggleScreenVision();
          return;
        }
        runAutoCycle(true);
      };
      actRow.appendChild(solveBtn);

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
        log('info', 'Chế độ tự động liên tục: ' + (isAuto ? 'BẬT' : 'TẮT'));
        if (isAuto) runAutoCycle(true);
      };
      actRow.appendChild(autoBtn);
      bodyBox.appendChild(actRow);

      // 6. DÒNG TRẠNG THÁI HIỆN TẠI
      var stLine = document.createElement('div');
      stLine.id = 'hud-status-text';
      stLine.style.cssText = 'font-size:11px;color:#38bdf8;margin-bottom:6px;min-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;';
      stLine.textContent = hasVision ? '● Auto Loop đang chạy: Tự động chụp & giải bài...' : '⚠️ Chờ cấp quyền chia sẻ màn hình...';
      bodyBox.appendChild(stLine);

      // 7. KHUNG LOG THỜI GIAN THỰC
      var logsBox = document.createElement('div');
      logsBox.id = 'hud-logs-box';
      logsBox.style.cssText = 'background:#020617;border:1px solid #1e293b;border-radius:8px;height:95px;overflow-y:auto;padding:6px 8px;font-family:monospace;font-size:10px;line-height:1.45;color:#94a3b8;';
      bodyBox.appendChild(logsBox);

      log('success', 'EduNext AI Pro ' + CURRENT_VERSION + ' sẵn sàng!');
      if (hasTampermonkey) {
        log('success', '✓ Đã kích hoạt Tampermonkey Bypass CSP 100%');
      } else {
        log('info', 'Chế độ Bookmarklet 100% (Sử dụng song song Cầu Nối AI)');
      }
      if (hasKey) {
        log('info', 'Key hợp lệ (Gọi trực tiếp Google Gemini Flash-Lite)');
      } else {
        log('warn', 'Chưa có Key bản quyền hợp lệ (Bắt đầu bằng ENC_AI_)');
      }
    }

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

    function setStatus(txt, col) {
      var el = document.getElementById('hud-status-text');
      if (!el) return;
      el.textContent = txt;
      if (col) el.style.color = col;
    }

    // BẬT / TẮT CHIA SẺ MÀN HÌNH
    async function toggleScreenVision() {
      if (visionScreenStream) {
        visionScreenStream.getTracks().forEach(function(t) { t.stop(); });
        visionScreenStream = null;
        visionScreenVideo = null;
        renderBody();
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

        var vt = stream.getVideoTracks()[0];
        if (vt) {
          vt.onended = function() {
            visionScreenStream = null;
            visionScreenVideo = null;
            renderBody();
            log('warn', 'Chia sẻ màn hình đã ngắt.');
          };
        }

        await video.play();
        renderBody();
        log('success', '✓ Đã kích hoạt Auto Vision! Bot bắt đầu tự động giải liên tục!');
        runAutoCycle(true);
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

    // YÊU CẦU MẠNG ĐA PHƯƠNG THỨC
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

        fetch(opts.url, {
          method: opts.method || 'GET',
          headers: opts.headers || {},
          body: opts.body || undefined
        }).then(resolve).catch(function(err) {
          reject(new Error('EduNext CSP chặn mạng! Bạn đang chạy Bookmarklet. Vui lòng cài script vào Tampermonkey hoặc mở Cầu Nối AI để bypass CSP 100%!'));
        });
      });
    }

    // GỌI TRỰC TIẾP GOOGLE GEMINI FLASH
    async function callDirectGeminiVision(rawKey, promptText, imageBase64) {
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

        var sysPrompt = 'Bạn là Trợ lý Học tập FPT EduNext AI Pro. Đọc kỹ câu hỏi và mọi phản hồi, gợi ý của giáo viên. Nếu giáo viên vừa từ chối câu trả lời trước, tuyệt đối không lặp lại câu sai cũ mà phải đưa ra đáp án mới đúng theo gợi ý. Trả lời đúng mẫu yêu cầu (ví dụ: "Trả lời: [đáp án]").';

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

            var res = await universalRequest({
              url: url,
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              timeout: 8000,
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: sysPrompt }] },
                contents: [{ role: 'user', parts: parts }],
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 800
                }
              })
            });

            if (res.ok) {
              var json = await res.json();
              var txt = json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0] ? json.candidates[0].content.parts[0].text : '';
              if (txt && txt.trim()) {
                var clean = txt.replace(/```(?:markdown|json|text)?/gi, '').replace(/```/g, '').trim();
                clean = clean.replace(/^\*\*Trả lời:\*\*/i, 'Trả lời:').trim();
                preferredModel = model;
                log('success', '✓ Gemini (' + model + ') phản hồi thành công!');
                return clean;
              }
            } else {
              var errBody = await res.text();
              log('warn', 'Model ' + model + ' (HTTP ' + res.status + '): ' + (errBody.slice(0, 70) || 'Lỗi'));
            }
          } catch(err) {
            log('warn', 'Lỗi gọi ' + model + ': ' + (err.message || err));
          }
        }
        return null;
      }

      // CHẾ ĐỘ BOOKMARKLET: GỬI QUA CẦU NỐI AI POPUP
      if (!bridgeWin || bridgeWin.closed) {
        openBridgeWindow();
      }

      if (bridgeWin && !bridgeWin.closed) {
        log('info', 'Đang gửi ảnh và câu hỏi qua Cầu Nối AI Bridge...');
        var reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        
        var bridgeAns = await new Promise(function(resolve) {
          var timer = setTimeout(function() {
            window.removeEventListener('message', onBridgeMsg);
            log('warn', 'Cầu Nối AI Bridge phản hồi quá hạn (timeout 25s)');
            resolve(null);
          }, 25000);

          function onBridgeMsg(ev) {
            if (ev.data && ev.data.type === 'ENX_SOLVE_RES' && ev.data.requestId === reqId) {
              clearTimeout(timer);
              window.removeEventListener('message', onBridgeMsg);
              if (ev.data.success && ev.data.answer) {
                log('success', '✓ Cầu Nối AI Bridge giải thành công!');
                resolve(ev.data.answer);
              } else {
                log('warn', 'Cầu Nối AI: ' + (ev.data.error || 'Không có đáp án'));
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

        if (bridgeAns) return bridgeAns;
      } else {
        log('warn', '⚠️ Cần bấm [Mở Cầu Nối AI] để cấp quyền vượt CSP cho Bookmarklet!');
      }

      return null;
    }

    async function solveQuestion(prompt, imageBase64) {
      var isRequirePrefix = /trả lời:\s*\[|theo mẫu/i.test(prompt);
      var rawKey = decryptEncryptedKey(activeEncryptedKey);
      if (!rawKey) {
        log('warn', 'Chưa có Key bản quyền! Vui lòng kéo Bookmarklet từ fpt-studyhub.');
        return null;
      }

      var ans = await callDirectGeminiVision(rawKey, prompt, imageBase64);
      if (!ans) {
        return null;
      }

      if (isRequirePrefix && !/^\s*(?:tr[aả]\s*l[oờ]i|answer)\s*:/i.test(ans) && !ans.startsWith('__')) {
        ans = 'Trả lời: ' + ans;
      }
      return ans;
    }

    // REACT 18 FIBER & PROPS DISCOVERY
    function getReactFiber(dom) {
      if (!dom) return null;
      for (var key in dom) {
        if (key.startsWith('__reactFiber$')) return dom[key];
      }
      return null;
    }

    function getReactProps(dom) {
      if (!dom) return null;
      for (var key in dom) {
        if (key.startsWith('__reactProps$') || key.startsWith('__reactEventHandlers$')) {
          return dom[key];
        }
      }
      return null;
    }

    function findReactFunction(dom, fnName) {
      var fiber = getReactFiber(dom);
      var depth = 0;
      while (fiber && depth < 60) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps[fnName] === 'function') {
          return fiber.memoizedProps[fnName];
        }
        if (fiber.pendingProps && typeof fiber.pendingProps[fnName] === 'function') {
          return fiber.pendingProps[fnName];
        }
        fiber = fiber.return;
        depth++;
      }
      return null;
    }

    // XÓA SẠCH VÀ ĐIỀN NỘI DUNG VÀO TEXTAREA REACT
    function fillReactInput(textarea, text) {
      if (!textarea) return;
      textarea.focus();

      try {
        var onInputChange = findReactFunction(textarea, 'onInputChange');
        if (typeof onInputChange === 'function') {
          onInputChange(text);
        }
      } catch(e) {}

      try {
        textarea.select();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
      } catch(e) {}

      try {
        var tracker = textarea._valueTracker;
        if (tracker) tracker.setValue(textarea.value + '_diff');
        var proto = window.HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        var desc = Object.getOwnPropertyDescriptor(proto, 'value');
        if (desc && desc.set) {
          desc.set.call(textarea, text);
        } else {
          textarea.value = text;
        }
      } catch(e) {
        textarea.value = text;
      }

      try {
        textarea.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
        if (typeof InputEvent !== 'undefined') {
          textarea.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text }));
        }
      } catch(e) {}

      try {
        var props = getReactProps(textarea);
        if (props && typeof props.onChange === 'function') {
          props.onChange({ target: { value: text }, currentTarget: { value: text } });
        }
      } catch(e) {}
    }

    function getTextarea() {
      var inps = document.querySelectorAll('textarea.w-md-editor-text-input, .w-md-editor textarea, textarea, input[type="text"], div[contenteditable="true"]');
      for (var i = 0; i < inps.length; i++) {
        var inp = inps[i];
        if (!inp.closest('#enx-pro-hud') && inp.offsetParent !== null) return inp;
      }
      return null;
    }

    function openRadialMenuIfNeeded() {
      try {
        var submitDirect = document.querySelector('button[data-intent="SUBMIT_ANSWER"], [data-intent="SUBMIT_ANSWER"]');
        if (submitDirect && submitDirect.offsetParent !== null) return;
        var visibleItems = Array.from(document.querySelectorAll('.exercise-intent-radial__item, [class*="radial__item"]')).filter(function(el) {
          return !el.closest('#enx-pro-hud') && el.offsetParent !== null;
        });
        if (visibleItems.length > 0) return;
        var trigger = document.querySelector('button.w-send-btn:not(.w-send-btn--close), .exercise-intent-radial__trigger, [class*="radial__trigger"], [class*="intent-radial"] > button, .radial-trigger');
        if (trigger && !trigger.closest('#enx-pro-hud') && trigger.offsetParent !== null) {
          log('info', 'Mở menu nộp bài...');
          trigger.click();
        }
      } catch(e) {}
    }

    function findSubmitButton(inp) {
      var candidates = [];

      function consider(el, score, reason) {
        if (!el) return;
        if (el.closest('#enx-pro-hud, .course-lesson-list, [class*="lesson-list"], aside:not(.w-chat-input__intent-panel), nav, .ant-layout-sider')) return;
        candidates.push({ el: el, score: score, reason: reason });
      }

      var intentBtns = Array.from(document.querySelectorAll('button[data-intent="SUBMIT_ANSWER"], [data-intent="SUBMIT_ANSWER"]'));
      for (var i = 0; i < intentBtns.length; i++) {
        consider(intentBtns[i], 100, 'intent=SUBMIT_ANSWER');
      }

      var intentItems = Array.from(document.querySelectorAll('.exercise-intent-column__item, .exercise-intent-radial__item, .exercise-intent-submit__button, [class*="exercise-intent"] button'));
      for (var j = 0; j < intentItems.length; j++) {
        var it = intentItems[j];
        var itTxt = (it.innerText || it.textContent || it.getAttribute('aria-label') || '').trim();
        if (/nộp\s*(?:câu\s*trả\s*lời|đáp\s*án|bài)?|submit/i.test(itTxt)) {
          consider(it, 95, 'intent-item-submit');
        }
      }

      var sendBtns = Array.from(document.querySelectorAll('button.w-send-btn:not(.w-send-btn--close), .w-send-btn:not(.w-send-btn--close), button[class*="w-send-btn"], button[aria-label*="Gửi tin nhắn"], button[aria-label*="Send message"]'));
      for (var k = 0; k < sendBtns.length; k++) {
        consider(sendBtns[k], 90, 'w-send-btn');
      }

      var allClickables = Array.from(document.querySelectorAll('button, [role="button"], div, span, a, input[type="button"], input[type="submit"]'));
      for (var l = 0; l < allClickables.length; l++) {
        var el = allClickables[l];
        if (el.closest('#enx-pro-hud, .course-lesson-list, aside:not(.w-chat-input__intent-panel), nav, .ant-layout-sider')) continue;
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

      if (inp) {
        var composerRow = inp.closest('.w-chat-input__composer-row, .w-chat-input__layout, .w-chat-input, .chat-footer') || inp.parentElement;
        if (composerRow) {
          var btns = Array.from(composerRow.querySelectorAll('button, [role="button"]'));
          for (var m = 0; m < btns.length; m++) {
            var b = btns[m];
            if (b.closest('#enx-pro-hud')) continue;
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
        if (typeof el.click === 'function') el.click();
        return true;
      } catch(e) {
        return false;
      }
    }

    function dispatchEnter(textarea) {
      if (!textarea) return;
      var evOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
      textarea.dispatchEvent(new KeyboardEvent('keydown', evOpts));
      textarea.dispatchEvent(new KeyboardEvent('keypress', evOpts));
      textarea.dispatchEvent(new KeyboardEvent('keyup', evOpts));
    }

    // TỰ ĐỘNG XÓA BẢN NHÁP CŨ, GÕ ĐÁP ÁN MỚI & BẤM NỘP
    async function submitAnswerToEduNext(answerText) {
      var clean = answerText.trim();
      var ta = getTextarea();
      if (!ta) {
        log('warn', 'Không tìm thấy ô nhập câu trả lời!');
        return false;
      }

      isSubmitting = true;
      try {
        setStatus('✍️ Đang làm sạch ô nhập & điền đáp án mới...', '#38bdf8');
        
        // 1. Xóa sạch ô nhập trước (đúng như triết lý Tampermonkey v10.1.4: clear composer before typing)
        fillReactInput(ta, '');
        await new Promise(function(resolve) { setTimeout(resolve, 80); });

        // 2. Điền đáp án mới vào
        fillReactInput(ta, clean);
        log('info', 'Đã gõ nội dung: "' + clean.slice(0, 35) + '..."');
        setStatus('● Đang tìm và bấm nút Nộp câu trả lời...', '#10b981');

        await new Promise(function(resolve) { setTimeout(resolve, 300); });
        openRadialMenuIfNeeded();

        await new Promise(function(resolve) { setTimeout(resolve, 300); });

        var submittedSuccessfully = false;

        var btn = findSubmitButton(ta);
        if (btn) {
          var btnName = (btn.innerText || btn.textContent || btn.getAttribute('aria-label') || 'Nút Nộp').trim();
          var ok = triggerClick(btn);
          if (ok) {
            submittedSuccessfully = true;
            lastSubmitTimestamp = Date.now();
            lastSubmittedText = clean;
            log('success', '✓ ĐÃ BẤM [' + (btnName.slice(0, 25) || 'Nộp câu trả lời') + '] thành công!');
            setStatus('✓ Đã nộp thành công! Chờ EduNext chấm bài...', '#34d399');
          }
        }

        try {
          var onSendFn = findReactFunction(ta, 'onSendMessage');
          if (typeof onSendFn === 'function') {
            log('info', '✓ Kích hoạt onSendMessage trực tiếp từ EduNext React Fiber!');
            onSendFn(clean, clean, { resolved_intent: 'SUBMIT_ANSWER' });
            submittedSuccessfully = true;
            lastSubmitTimestamp = Date.now();
            lastSubmittedText = clean;
            setStatus('✓ Đã nộp qua React Fiber!', '#34d399');
          }
        } catch(e) {}

        if (!submittedSuccessfully) {
          dispatchEnter(ta);
          lastSubmitTimestamp = Date.now();
          lastSubmittedText = clean;
          log('warn', 'Không thấy nút nộp dạng click, đã gửi Enter bài làm!');
          setStatus('● Đã gửi Enter bài làm.', '#38bdf8');
        }

        // Giữ khóa chống spam ít nhất 5 giây sau khi nộp
        setTimeout(function() { isSubmitting = false; }, 5000);
        return true;
      } catch(err) {
        isSubmitting = false;
        log('err', 'Lỗi khi nộp bài: ' + (err.message || err));
        return false;
      }
    }

    // =========================================================================
    // GIỚI HẠN MÔN HỌC: 1 MÔN / 1 BÀI / TUẦN & GIỚI HẠN SỐ MÔN THEO GÓI
    // =========================================================================
    function detectEduNextCourse() {
      var courseId = '';
      var courseCode = '';
      var courseName = '';

      try {
        var bodyText = (document.title || '') + ' ' + ((document.querySelector('.breadcrumb, .ant-breadcrumb, h1, h2, .course-header, [class*="course"]') || {}).innerText || '');
        var mCode = bodyText.match(/\b([A-Z]{3}\s*\d{3})\b/i);
        if (mCode) {
          courseCode = mCode[1].toUpperCase().replace(/\s+/g, '');
        }
      } catch(e) {}

      try {
        var url = window.location.href;
        var mCourse = url.match(/courses?(?:\/detail)?\/([a-zA-Z0-9_-]+)/i);
        if (mCourse) courseId = mCourse[1];
      } catch(e) {}

      try {
        var titleEl = document.querySelector('.course-name, .course-title, [class*="course-name"], [class*="CourseHeader"]');
        if (titleEl) {
          courseName = (titleEl.innerText || titleEl.textContent || '').trim().replace(/\s+/g, ' ');
        }
      } catch(e) {}

      var key = courseCode || (courseId ? ('ID_' + courseId) : 'EDUNEXT_ACTIVE_COURSE');
      var label = courseCode || courseName || (courseId ? ('Môn #' + courseId) : 'Môn học hiện tại');

      return {
        key: key,
        code: courseCode,
        id: courseId,
        label: label
      };
    }

    function getCourseHistory() {
      try {
        var raw = localStorage.getItem('enx_course_quota_v10');
        if (raw) return JSON.parse(raw);
      } catch(e) {}
      return { courses: {}, count: 0 };
    }

    function saveCourseHistory(data) {
      try {
        localStorage.setItem('enx_course_quota_v10', JSON.stringify(data));
      } catch(e) {}
    }

    function checkCourseWeeklyQuota() {
      var c = detectEduNextCourse();
      var history = getCourseHistory();
      var record = history.courses[c.key];
      var ONE_WEEK_MS = 7 * 24 * 3600 * 1000;

      // 1. Kiểm tra giới hạn 1 bài / môn trong 1 tuần
      if (record && record.completedAt) {
        var elapsed = Date.now() - record.completedAt;
        if (elapsed < ONE_WEEK_MS) {
          var remainingMs = ONE_WEEK_MS - elapsed;
          var remDays = Math.ceil(remainingMs / (24 * 3600 * 1000));
          var remHours = Math.ceil(remainingMs / (3600 * 1000));
          var dateStr = new Date(record.completedAt).toLocaleDateString('vi-VN');
          return {
            allowed: false,
            course: c,
            reason: 'Môn [' + c.label + '] đã làm 1 bài vào ngày ' + dateStr + '. Giới hạn bản quyền: Mỗi môn chỉ được làm 1 bài / tuần (vui lòng chờ ' + (remDays > 1 ? remDays + ' ngày' : remHours + ' giờ') + ').'
          };
        }
      }

      // 2. Kiểm tra tổng số lượng môn được kích hoạt theo gói
      var maxCoursesAllowed = 5;
      var activeKeyInfo = validateKeyStatus(activeEncryptedKey);
      if (activeKeyInfo.valid && activeKeyInfo.plan) {
        if (activeKeyInfo.plan.includes('1 Tuần')) maxCoursesAllowed = 3;
        else if (activeKeyInfo.plan.includes('1 Tháng')) maxCoursesAllowed = 5;
        else if (activeKeyInfo.plan.includes('Kỳ')) maxCoursesAllowed = 6;
      }

      if (!history.courses[c.key]) {
        var totalCourses = Object.keys(history.courses).length;
        if (totalCourses >= maxCoursesAllowed) {
          return {
            allowed: false,
            course: c,
            reason: 'Đã đạt giới hạn số lượng môn của gói (' + totalCourses + '/' + maxCoursesAllowed + ' môn). Vui lòng liên hệ Discord Admin để mở rộng thêm môn.'
          };
        }
      }

      return {
        allowed: true,
        course: c
      };
    }

    function recordCourseCompletion() {
      var c = detectEduNextCourse();
      var history = getCourseHistory();
      history.courses[c.key] = {
        label: c.label,
        completedAt: Date.now(),
        url: window.location.pathname
      };
      history.count = Object.keys(history.courses).length;
      saveCourseHistory(history);
      log('warn', '📌 Đã ghi nhận hoàn thành bài cho môn: ' + c.label + ' (Khóa môn này trong 1 tuần)');
    }

    // =========================================================================
    // TRÍCH XUẤT NGỮ CẢNH CHAT & PHÂN ĐỊNH LƯỢT HỌC SINH / GIÁO VIÊN
    // (LẤY NGUYÊN BẢN TINH TÚY TỪ TAMPERMONKEY v10.1.4: HUY HIỆU & VỊ TRÍ DOM)
    // =========================================================================
    function getLatestChatState() {
      try {
        // 1. Quét toàn bộ huy hiệu của học sinh (nhãn "Học sinh" hoặc avatar/bên phải)
        var studentBadges = Array.from(document.querySelectorAll('span, div, p, small, label')).filter(function(el) {
          if (el.closest('#enx-pro-hud')) return false;
          var t = (el.innerText || el.textContent || '').trim();
          return /^học\s*sinh$/i.test(t);
        });

        // 2. Quét toàn bộ huy hiệu giáo viên / phản hồi AI
        var teacherBadges = Array.from(document.querySelectorAll('button, a, span, div, p')).filter(function(el) {
          if (el.closest('#enx-pro-hud')) return false;
          var t = (el.innerText || el.textContent || '').trim();
          return /^(?:feedback|sửa\s*công\s*thức)$/i.test(t) || /đã\s*chấm\s*bằng\s*ai/i.test(t) || /^int:\s*\w+/i.test(t);
        });

        var lastStudent = studentBadges.length > 0 ? studentBadges[studentBadges.length - 1] : null;
        var lastTeacher = teacherBadges.length > 0 ? teacherBadges[teacherBadges.length - 1] : null;

        var lastStudentMsg = '';
        if (lastStudent) {
          var pBox = lastStudent.closest('.wrap-message-view, [class*="message"], [class*="chat-item"], .chat-message') || lastStudent.parentElement;
          if (pBox) lastStudentMsg = (pBox.innerText || pBox.textContent || '').trim();
        }

        // Nếu học sinh xuất hiện sau giáo viên -> Học sinh đã gửi bài, đang chờ giáo viên phản hồi
        if (lastStudent && lastTeacher && (lastTeacher.compareDocumentPosition(lastStudent) & Node.DOCUMENT_POSITION_FOLLOWING)) {
          return {
            state: 'waiting_teacher',
            lastStudentBadge: lastStudent,
            lastTeacherBadge: lastTeacher,
            lastStudentMsg: lastStudentMsg,
            lastTeacherMsg: ''
          };
        }
        if (lastStudent && !lastTeacher) {
          return {
            state: 'waiting_teacher',
            lastStudentBadge: lastStudent,
            lastTeacherBadge: null,
            lastStudentMsg: lastStudentMsg,
            lastTeacherMsg: ''
          };
        }

        // Đến lượt học sinh trả lời! Quét khối tin nhắn mới nhất của giáo viên
        var teacherMsgText = '';
        if (lastTeacher) {
          var curr = lastTeacher;
          var messageEl = curr;
          while (curr && curr !== document.body && !curr.classList.contains('wrap-message-view')) {
            if (lastStudent && curr.contains(lastStudent)) break;
            var txt = (curr.innerText || '').trim();
            if (txt.length > 25 && (txt.includes('Câu hỏi') || txt.includes('Bài sau') || txt.includes('bài sau') || txt.includes('Trả lời:') || txt.includes('sẵn sàng') || txt.includes('hoàn thành') || txt.length > 50)) {
              messageEl = curr;
            }
            curr = curr.parentElement;
          }
          teacherMsgText = (messageEl ? messageEl.innerText : '').trim();
        }

        // Fallback nếu không có teacherBadge chuẩn: quét tin nhắn cuối cùng trong chat
        if (!teacherMsgText) {
          var allItems = Array.from(document.querySelectorAll('.wrap-message-view, [class*="message-item"], [class*="chat-item"], .chat-message, .w-chat-item')).filter(function(el) {
            return !el.closest('#enx-pro-hud');
          });
          if (allItems.length > 0) {
            var lastItem = allItems[allItems.length - 1];
            var isUser = lastItem.classList.contains('user') || lastItem.classList.contains('student') || !!lastItem.querySelector('.user-avatar, [class*="self"], [class*="right"]');
            if (isUser) {
              return { state: 'waiting_teacher', lastStudentBadge: lastItem, lastTeacherBadge: null, lastStudentMsg: (lastItem.innerText || '').trim(), lastTeacherMsg: '' };
            } else {
              teacherMsgText = (lastItem.innerText || lastItem.textContent || '').trim();
            }
          }
        }

        // Khối câu hỏi chuyên dụng nếu có
        var qBlock = document.querySelector('.exercise-question-block, [class*="exercise-question"], [class*="question-content"], .question-title');
        var questionBlockText = '';
        if (qBlock && qBlock.innerText && qBlock.innerText.trim().length > 8) {
          questionBlockText = qBlock.innerText.trim();
        }

        return {
          state: 'student_turn',
          lastStudentBadge: lastStudent,
          lastTeacherBadge: lastTeacher,
          lastStudentMsg: lastStudentMsg,
          lastTeacherMsg: teacherMsgText,
          questionBlockText: questionBlockText
        };
      } catch(e) {
        return { state: 'idle', lastTeacherMsg: '', lastStudentMsg: '' };
      }
    }

    // NHẬN DIỆN LỜI PHÊ BÌNH / BÁO SAI CỦA GIÁO VIÊN (ĐỂ SỬA SAI & THAY ĐÁP ÁN)
    function isTeacherComplaint(text) {
      if (!text) return false;
      var l = text.toLowerCase();
      return l.includes('chưa đúng') || l.includes('chưa chính xác') || l.includes('chưa thực hiện') ||
             l.includes('thử lại') || l.includes('kiểm tra lại') || l.includes('câu trả lời vừa rồi') ||
             l.includes('lặp lại nhiều lần') || l.includes('thử đến lần') || l.includes('điểm cần lưu ý là') ||
             l.includes('thực chất đang hỏi') || l.includes('suy nghĩ lại') || l.includes('không chính xác') ||
             l.includes('chưa phải') || l.includes('not correct') || l.includes('incorrect') || l.includes('try again') ||
             l.includes('check again') || l.includes('wrong answer');
    }

    // TÌM NÚT "SẴN SÀNG" / "READY" TRONG LƯỢT MỚI NHẤT CỦA GIÁO VIÊN
    function findReadyQuickReply(lastStudentBadge) {
      try {
        var candidates = Array.from(document.querySelectorAll(
          'button, [role="button"], .quick-reply, .chat-chip, .suggestion-item, [class*="chip"], [class*="quick"], [class*="suggestion"], .quick-insert-btn'
        ));

        for (var i = 0; i < candidates.length; i++) {
          var el = candidates[i];
          if (el.closest('#enx-pro-hud')) continue;
          if (el.disabled || el.offsetParent === null) continue;

          // Nút phải xuất hiện SAU tin nhắn gần nhất của học sinh (không bấm nút cũ ở lịch sử chat)
          if (lastStudentBadge && (el.compareDocumentPosition(lastStudentBadge) & Node.DOCUMENT_POSITION_FOLLOWING)) {
            continue;
          }

          var txt = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
          if (/^(?:sẵn\s*sàng|ready|tôi\s*đã\s*sẵn\s*sàng|i'm\s*ready|im\s*ready)[!.]?$/i.test(txt)) {
            return el;
          }
        }
      } catch(e) {}
      return null;
    }

    // KIỂM TRA BÀI HỌC ĐÃ KẾT THÚC CHƯA (CHUẨN XÁC THEO v10.1.4: CHỈ XÉT LƯỢT MỚI NHẤT CỦA GIÁO VIÊN)
    function looksLikeNewQuestion(text) {
      if (!text) return false;
      var q = text.includes('Câu hỏi') || text.includes('Hãy trả lời') || /\bQuestion\b/i.test(text) || /Please try the exercise/i.test(text) || /\?/i.test(text);
      var a = text.includes('Trả lời:') || text.includes('trả lời theo') || text.includes('điền đáp án') || /\bAnswer\s*:/i.test(text) || /Use this answer format/i.test(text);
      return q && a;
    }

    function isLessonEnded(text) {
      if (!text) return false;
      // Nếu có câu hỏi hoặc bài tập hoặc lời nhắc sẵn sàng -> Chưa thể kết thúc!
      if (looksLikeNewQuestion(text)) return false;
      if (/sẵn\s*sàng\s*chuyển\s*sang|bạn\s*đã\s*sẵn\s*sàng|are\s*you\s*ready|ready\s*to\s*move\s*on|sẵn\s*sàng\s*chưa/i.test(text)) return false;
      
      // Khớp các mẫu câu kết thúc buổi học chính thức
      if (/chúc\s*mừng.{0,60}(?:hoàn\s*thành|kết\s*thúc).{0,40}(?:buổi\s*học|bài\s*học|khóa\s*học)|(?:buổi\s*học|bài\s*học|khóa\s*học).{0,40}(?:đã\s*hoàn\s*thành|đã\s*kết\s*thúc)|congratulations.{0,80}(?:completed|finished).{0,60}(?:lesson|session|course)/i.test(text)) return true;
      if (/hẹn\s*gặp\s*(?:em|bạn).{0,20}(?:buổi|bài|chặng)\s*tiếp\s*theo/i.test(text)) return true;
      return false;
    }

    // =========================================================================
    // HÀM CHÍNH ĐIỀU PHỐI AUTO LOOP v10.2.29 (TỰ ĐỘNG THÔNG MINH THEO LƯỢT)
    // =========================================================================
    async function runAutoCycle(isForced) {
      if (!isAuto && !isForced) return;
      if (isSubmitting) return;

      // 0. Kiểm tra hạn mức môn học: 1 tuần chỉ làm 1 bài của 1 môn
      var quotaCheck = checkCourseWeeklyQuota();
      if (!quotaCheck.allowed) {
        isAuto = false;
        setStatus('⛔ ' + quotaCheck.reason, '#ef4444');
        log('warn', '⛔ ' + quotaCheck.reason);
        var abOff = document.getElementById('hud-auto-btn');
        if (abOff) {
          abOff.textContent = '⏸ Auto: TẮT';
          abOff.style.background = 'rgba(239,68,68,0.2)';
          abOff.style.borderColor = '#ef4444';
          abOff.style.color = '#fca5a5';
        }
        return;
      }

      // 1. Quét trạng thái cuộc hội thoại trên EduNext
      var chatState = getLatestChatState();

      // NẾU HỌC SINH VỪA GỬI VÀ ĐANG CHỜ GIÁO VIÊN DUYỆT -> CHỜ, KHÔNG GỬI TIẾP!
      if (chatState.state === 'waiting_teacher' && !isForced) {
        setStatus('👀 Đã nộp bài, đang chờ EduNext phản hồi...', '#38bdf8');
        return;
      }

      // 2. Chống nghẽn rate limit 429
      if (Date.now() < rateLimitCooldownUntil) {
        var remainSec = Math.ceil((rateLimitCooldownUntil - Date.now()) / 1000);
        setStatus('⏳ Chờ hồi phục Rate Limit 429 (' + remainSec + 's)...', '#f59e0b');
        return;
      }

      // 3. Nếu vừa mới nộp bài chưa đầy 4 giây thì tạm chờ EduNext chuyển cảnh
      if (Date.now() - lastSubmitTimestamp < 4000 && !isForced) {
        setStatus('⏳ Chờ EduNext cập nhật sau khi nộp...', '#94a3b8');
        return;
      }

      var teacherText = chatState.lastTeacherMsg || '';

      // 4. KIỂM TRA BÀI HỌC HOÀN THÀNH: CHỈ KHI TIN NHẮN GIÁO VIÊN CUỐI CÙNG THỰC SỰ LÀ LỜI CHÚC MỪNG HOÀN THÀNH!
      if (isLessonEnded(teacherText)) {
        recordCourseCompletion();
        log('success', '🎉 CHÚC MỪNG: BẠN ĐÃ HOÀN THÀNH TOÀN BỘ BÀI HỌC!');
        setStatus('🎉 HOÀN THÀNH TOÀN BỘ BÀI HỌC!', '#10b981');
        isAuto = false;
        var ab = document.getElementById('hud-auto-btn');
        if (ab) {
          ab.textContent = '⏸ Auto: TẮT';
          ab.style.background = 'rgba(100,116,139,0.2)';
        }
        return;
      }

      // 5. TỰ ĐỘNG XỬ LÝ LỜI NHẮC "SẴN SÀNG" / "READY" Ở ĐẦU HOẶC CHUYỂN CHẶNG (KHÔNG GIỚI HẠN 1 LẦN)
      var hasExercise = looksLikeNewQuestion(teacherText) || /câu hỏi|bài sau|hãy làm|trả lời:|đáp án|\?/i.test(teacherText);
      var quickReadyBtn = findReadyQuickReply(chatState.lastStudentBadge);
      var isReadyPrompt = !hasExercise && (
        /bạn\s*đã\s*sẵn\s*sàng|sẵn\s*sàng\s*chuyển\s*sang|are\s*you\s*ready|ready\s*to\s*move\s*on|sẵn\s*sàng\s*chưa/i.test(teacherText) ||
        !!quickReadyBtn
      );

      if (isReadyPrompt) {
        var readyText = /ready/i.test(teacherText) ? 'Ready' : 'Sẵn sàng';
        log('info', '🎯 Bắt được lời nhắc/nút [' + readyText + '] -> Tự động bấm & gửi để chuyển phần!');
        setStatus('🎯 Bấm "' + readyText + '" chuyển phần...', '#10b981');
        if (quickReadyBtn) {
          try { triggerClick(quickReadyBtn); } catch(e) {}
        }
        await submitAnswerToEduNext(readyText);
        setStatus('👀 Đang chờ câu hỏi tiếp theo hiện lên...', '#38bdf8');
        return;
      }

      // 6. XÁC ĐỊNH CÂU HỎI & PHẢN HỒI SỬA SAI (FEEDBACK)
      var questionText = chatState.questionBlockText || teacherText || '';
      var hasVision = !!(visionScreenStream && visionScreenStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; }));
      var shot = hasVision ? capturePersistentVisionFrame() : null;

      if (!questionText && !shot) {
        if (isForced) {
          alert('Chưa thấy câu hỏi mới trên trang. Nếu đề bài dạng hình ảnh, hãy bấm [Chia Sẻ Màn Hình]!');
          toggleScreenVision();
        } else {
          setStatus('👀 Đang theo dõi khi nào câu hỏi hiện lên...', '#94a3b8');
        }
        return;
      }

      var isComplaint = isTeacherComplaint(teacherText);
      var questionSignature = (questionText.slice(0, 150)) + '||' + (teacherText ? teacherText.slice(-100) : '');

      // Nếu câu hỏi trùng chữ ký VÀ giáo viên KHÔNG phàn nàn/sửa sai -> Đã giải rồi, chờ câu mới
      if (questionSignature === lastSolvedHash && !isComplaint && !isForced) {
        setStatus('👀 Đang theo dõi khi nào có câu hỏi mới...', '#94a3b8');
        return;
      }

      // 7. GỬI GEMINI PHÂN TÍCH VÀ GIẢI ĐỀ (KÈM GỢI Ý CỦA GIÁO VIÊN VÀ ĐÁP ÁN SAI CŨ NẾU CÓ)
      isSubmitting = true;
      try {
        if (isComplaint) {
          setStatus('🔄 Giáo viên phản hồi chưa đúng -> Tự động sửa sai theo gợi ý...', '#f59e0b');
          log('warn', '⚡ Giáo viên phản hồi đáp án chưa đúng! Gửi kèm gợi ý để Gemini giải lại...');
        } else {
          setStatus('⚡ Đang tự động phân tích và giải đề...', '#38bdf8');
          log('info', '⚡ Bắt được câu hỏi! Gửi Gemini Flash-Lite giải ngay...');
        }

        var promptParts = [
          'Bạn là Trợ lý Học tập FPT EduNext AI Pro.',
          questionText ? ('CÂU HỎI TRÊN EDUNEXT:\n' + questionText) : 'Dùng ảnh màn hình mới nhất để nhận diện câu hỏi và bài tập trên EduNext.'
        ];

        // Nếu giáo viên có phản hồi/sửa sai hoặc từ chối câu trả lời trước đó:
        if (isComplaint || (teacherText && chatState.lastStudentMsg)) {
          var wrongAns = lastSubmittedText || chatState.lastStudentMsg;
          promptParts.push(
            '🚨 LƯU Ý ĐẶC BIỆT - GIÁO VIÊN VỪA TỪ CHỐI ĐÁP ÁN VÀ ĐƯA RA GỢI Ý:\n' +
            '- Đáp án sai học sinh vừa gửi: "' + wrongAns + '" (CÂU NÀY ĐÃ SAI HOẶC BỊ TỪ CHỐI)\n' +
            '- Toàn bộ phản hồi, phân tích và gợi ý của Giáo viên:\n"' + teacherText + '"\n' +
            '-> YÊU CẦU BẮT BUỘC:\n' +
            '1. Đọc thật kỹ phân tích và gợi ý của giáo viên ở trên.\n' +
            '2. Tìm ra bản chất câu hỏi thực sự đang yêu cầu (tên gọi đại lượng, lực, công thức, số lượng, v.v.).\n' +
            '3. Xuất đáp án MỚI HOÀN TOÀN, CHÍNH XÁC. TUYỆT ĐỐI KHÔNG lặp lại đáp án cũ "' + wrongAns + '"!'
          );
        }

        promptParts.push(
          'QUY TẮC BẮT BUỘC:\n' +
          '1. Nếu đề bài yêu cầu trả lời theo mẫu hoặc bắt đầu bằng "Trả lời:", hãy xuất ĐÚNG ĐÁP ÁN: Trả lời: [đáp án].\n' +
          '2. Nếu là trắc nghiệm hoặc bài tập tự luận/toán/lập trình, trả lời ngắn gọn, chính xác, trực tiếp vào trọng tâm.\n' +
          '3. Tuyệt đối KHÔNG trả lời lan man dài dòng, KHÔNG nói lời chào.\n' +
          '4. Nếu bài học đã kết thúc, xuất mã: __LESSON_COMPLETE__'
        );

        var solverPrompt = promptParts.join('\n\n');
        var ans = await solveQuestion(solverPrompt, shot ? shot.image : null);

        if (!ans || /_{0,2}\s*NO_QUESTION\s*_{0,2}/i.test(ans)) {
          setStatus('👀 Đang theo dõi khi nào câu hỏi hiện lên...', '#94a3b8');
          isSubmitting = false;
          return;
        }

        if (/_{0,2}\s*LESSON_COMPLETE\s*_{0,2}/i.test(ans)) {
          recordCourseCompletion();
          log('success', '🎉 CHÚC MỪNG: BẠN ĐÃ HOÀN THÀNH TOÀN BỘ BÀI HỌC!');
          setStatus('🎉 HOÀN THÀNH TOÀN BỘ BÀI HỌC!', '#10b981');
          isAuto = false;
          var ab2 = document.getElementById('hud-auto-btn');
          if (ab2) {
            ab2.textContent = '⏸ Auto: TẮT';
            ab2.style.background = 'rgba(100,116,139,0.2)';
          }
          isSubmitting = false;
          return;
        }

        // Kiểm tra xem đáp án có bị trùng y hệt câu vừa nộp không (nếu là sửa sai mà vẫn ra câu cũ thì chặn lại)
        if (lastSubmittedText && ans.trim().toLowerCase() === lastSubmittedText.trim().toLowerCase() && isComplaint) {
          log('warn', '⚠️ Gemini vẫn trả lời đáp án cũ "' + ans + '", đang thử yêu cầu đáp án khác...');
          // Thử loại bỏ tiền tố và gửi lại
          isSubmitting = false;
          return;
        }

        // Nộp đáp án mới
        log('success', '✓ Gemini Flash-Lite trả lời: "' + ans.slice(0, 35) + '..."');
        setStatus('✍️ Đang làm sạch ô nhập & nộp bài...', '#34d399');

        lastSolvedHash = questionSignature;
        await submitAnswerToEduNext(ans);
        log('success', '✓ ĐÃ NỘP XONG! Tự động chờ câu hỏi tiếp theo...');
        setStatus('👀 Đang theo dõi khi nào câu hỏi tiếp theo hiện lên...', '#38bdf8');
      } catch(err) {
        log('err', 'Lỗi: ' + (err.message || err));
      } finally {
        isSubmitting = false;
      }
    }

    // KHỞI ĐỘNG GIAO DIỆN
    d.appendChild(bodyBox);
    renderBody();

    // VÒNG LẶP TỰ ĐỘNG CHẠY (MỖI 3 GIÂY)
    var autoLoopInterval = setInterval(function() {
      runAutoCycle(false);
    }, 3000);

    // DỌN DẸP KHI ĐÓNG HOẶC NÂNG CẤP
    d.addEventListener('enx_destroy', function() {
      clearInterval(autoLoopInterval);
      window.__ENX_PRO_HUD__ = false;
      window.__ENX_VERSION__ = null;
    });

    (document.body || document.documentElement).appendChild(d);
  } catch(fatalErr) {
    alert('Lỗi khởi động EduNext AI Pro: ' + fatalErr.message);
  }
}

// =========================================================================
// BUILD PIPELINE: MINIFICATION VÀ XUẤT RA TOÀN BỘ HỆ THỐNG
// =========================================================================
async function build() {
  const codeString = bookmarkletFunction.toString();
  console.log(`Original Code Length: ${codeString.length} chars`);

  const minified = await terser.minify(codeString, {
    compress: {
      passes: 2,
      drop_debugger: true
    },
    mangle: {
      toplevel: true
    }
  });

  const minifiedCode = minified.code;
  console.log(`Minified Code Length: ${minifiedCode.length} chars`);

  const rootDir = __dirname;
  const toolsDir = __dirname;
  const webDir = path.join(__dirname, 'FPT service');

  // Lưu file minified
  fs.writeFileSync(path.join(toolsDir, 'v10_2_29_minified.js'), minifiedCode, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'v10_2_29_minified.js'), minifiedCode, 'utf8');

  // 1. Tạo Bookmarklet 1-Click Inline
  const bookmarkletCode = `javascript:(${minifiedCode})("");`;
  fs.writeFileSync(path.join(toolsDir, 'bookmarklet_v10_2_29.txt'), bookmarkletCode, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'bookmarklet_v10_2_29.txt'), bookmarkletCode, 'utf8');
  console.log(`✓ Generated bookmarklet_v10_2_29.txt (${bookmarkletCode.length} chars)`);

  // 2. Cập nhật route inject.js
  const injectRoutePath = path.join(webDir, 'src', 'app', 'inject.js', 'route.ts');
  const injectContent = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const licenseKey = searchParams.get('key') || '';
  
  const minifiedCode = ${JSON.stringify(minifiedCode)};
  const scriptContent = ';(' + minifiedCode + ')(' + JSON.stringify(licenseKey) + ');';

  return new NextResponse(scriptContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
`;
  fs.writeFileSync(injectRoutePath, injectContent, 'utf8');
  console.log(`✓ Updated inject.js/route.ts to v10.2.29`);

  // 3. Cập nhật route edunext.user.js
  const tmRoutePath = path.join(webDir, 'src', 'app', 'edunext.user.js', 'route.ts');
  const tmContent = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key') || '';
  
  const minifiedCode = ${JSON.stringify(minifiedCode)};
  
  const userScript = \`// ==UserScript==
// @name         EduNext AI Assistant Pro (Bypass Cloudflare & Auto-Solve)
// @namespace    https://fpt-studyhub.vercel.app/
// @version      10.2.28
// @description  Hỗ trợ sinh viên FPT giải bài tập EduNext tự động, chụp ảnh Vision qua Google Gemini Flash, không spam, học theo gợi ý giáo viên, auto liên tục cho đến khi hoàn thành.
// @author       FPT Study Hub
// @match        *://fu-edunext.fpt.edu.vn/*
// @match        *://fsc-edunext.fpt.edu.vn/*
// @match        *://edunext.fpt.edu.vn/*
// @icon         https://fpt-studyhub.vercel.app/favicon.ico
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @connect      generativelanguage.googleapis.com
// @connect      fpt-studyhub.vercel.app
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    try {
        if (typeof GM_xmlhttpRequest === 'function') {
            window.__ENX_GM_XHR__ = GM_xmlhttpRequest;
            if (typeof unsafeWindow !== 'undefined') {
                unsafeWindow.__ENX_GM_XHR__ = GM_xmlhttpRequest;
            }
        }
    } catch(e) {}
    
    ;(\${minifiedCode})(\${JSON.stringify(key)});
})();\`;

  return new NextResponse(userScript, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Content-Disposition': 'attachment; filename="edunext.user.js"',
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
`;
  fs.writeFileSync(tmRoutePath, tmContent, 'utf8');
  console.log(`✓ Updated edunext.user.js/route.ts to v10.2.29`);

  // 4. Cập nhật utils.ts: Dùng Safe Base64 Bundle chống lỗi unicode escape Turbopack
  const utilsPath = path.join(webDir, 'src', 'lib', 'utils.ts');
  const b64 = Buffer.from(minifiedCode, 'utf8').toString('base64');
  let utilsContent = fs.readFileSync(utilsPath, 'utf8');
  utilsContent = utilsContent.replace(/v10\.2\.\d+/g, 'v10.2.29');
  utilsContent = utilsContent.replace(/const RAW_FN_BASE64 = ".*?";/s, 'const RAW_FN_BASE64 = "' + b64 + '";');
  fs.writeFileSync(utilsPath, utilsContent, 'utf8');
  console.log(`✓ Updated utils.ts to v10.2.29 with Safe Base64 bundle`);

  // 5. Cập nhật ActivationSuccessModal.tsx và layout.tsx
  const modalPath = path.join(webDir, 'src', 'components', 'checkout', 'ActivationSuccessModal.tsx');
  let modalContent = fs.readFileSync(modalPath, 'utf8');
  modalContent = modalContent.replace(/v10\.2\.\d+/g, 'v10.2.29');
  fs.writeFileSync(modalPath, modalContent, 'utf8');
  console.log(`✓ Updated ActivationSuccessModal.tsx to v10.2.29`);

  const layoutPath = path.join(webDir, 'src', 'app', 'layout.tsx');
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  layoutContent = layoutContent.replace(/v10\.2\.\d+/g, 'v10.2.29');
  fs.writeFileSync(layoutPath, layoutContent, 'utf8');
  console.log(`✓ Updated layout.tsx to v10.2.29`);

  // 6. Cập nhật keo_bookmark.html
  const keoHtmlPath = path.join(webDir, 'public', 'keo_bookmark.html');
  if (fs.existsSync(keoHtmlPath)) {
    let keoHtml = fs.readFileSync(keoHtmlPath, 'utf8');
    keoHtml = keoHtml.replace(/v10\.2\.\d+/g, 'v10.2.29');

    const scriptBlock = `<script>
    const INLINE_CODE = ${JSON.stringify(bookmarkletCode)};

    // 1. Nhận diện Key bản quyền truyền qua URL (?key=ENC_AI_...) hoặc từ LocalStorage
    const urlParams = new URLSearchParams(window.location.search);
    let activeKey = urlParams.get('key') || '';
    if (!activeKey) {
      try {
        activeKey = localStorage.getItem('enx_encrypted_ai_key') || localStorage.getItem('enx_license_key') || '';
      } catch(_) {}
    } else {
      try {
        localStorage.setItem('enx_encrypted_ai_key', activeKey);
        localStorage.setItem('enx_license_key', activeKey);
      } catch(_) {}
    }

    // 2. Tự động đóng gói Key vào bên trong mã Bookmarklet nếu có key
    let finalBookmarklet = INLINE_CODE;
    if (activeKey && activeKey.startsWith('ENC_AI_')) {
      finalBookmarklet = INLINE_CODE.replace(/\\)\\(""\\);?$/, ')(' + JSON.stringify(activeKey) + ');');
      const badgeEl = document.querySelector('.badge');
      if (badgeEl) {
        badgeEl.textContent = '🔑 ĐÃ NẠP SẴN BẢN QUYỀN VÀO BOOKMARKLET (TỰ ĐỘNG 100%)';
        badgeEl.style.background = 'rgba(16, 185, 129, 0.25)';
        badgeEl.style.borderColor = '#10b981';
        badgeEl.style.color = '#34d399';
      }
      const noticeEl = document.querySelector('.why-notice');
      if (noticeEl) {
        noticeEl.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        noticeEl.style.background = 'rgba(16, 185, 129, 0.15)';
        noticeEl.style.color = '#a7f3d0';
        noticeEl.innerHTML = '✓ <strong>KEY BẢN QUYỀN ĐÃ ĐƯỢC TỰ ĐỘNG ĐÓNG GÓI VÀO NÚT BÊN DƯỚI!</strong><br>Bạn không cần nhập hay sao chép key thủ công. Chỉ cần dùng chuột giữ nút màu xanh to kéo lên thanh Bookmark của trình duyệt là chạy ngay trên EduNext!';
      }
    }

    const mainBtn = document.getElementById("main-bookmark-btn");
    if (mainBtn) mainBtn.setAttribute("href", finalBookmarklet);

    function handleBtnClick(e) {
      alert("👉 Bạn hãy dùng chuột GIỮ VÀ KÉO NÚT NÀY THẢ LÊN THANH DẤU TRANG (Bookmarks Bar) ở phía trên trình duyệt nhé!\\n\\nSau khi kéo lên xong, sang tab EduNext bấm vô là chạy v10.2.29!");
    }

    function copyInlineCode() {
      navigator.clipboard.writeText(finalBookmarklet).then(() => {
        const toast = document.getElementById("toast");
        if (toast) {
          toast.style.display = "block";
          setTimeout(() => { toast.style.display = "none"; }, 2500);
        }
      });
    }
  </script>`;

    keoHtml = keoHtml.replace(/<script>[\s\S]*?<\/script>/, scriptBlock);
    fs.writeFileSync(keoHtmlPath, keoHtml, 'utf8');
    console.log(`✓ Updated public/keo_bookmark.html with baked key support in v10.2.29`);
  }

  // 7. Cập nhật servicesCatalog.ts
  const catalogPath = path.join(webDir, 'src', 'data', 'servicesCatalog.ts');
  if (fs.existsSync(catalogPath)) {
    let cat = fs.readFileSync(catalogPath, 'utf8');
    cat = cat.replace(/v10\.2\.\d+/g, 'v10.2.29');
    fs.writeFileSync(catalogPath, cat, 'utf8');
    console.log('✓ Updated servicesCatalog.ts to v10.2.29');
  }

  // 8. Cập nhật admin/page.tsx
  const adminPagePath = path.join(webDir, 'src', 'app', 'admin', 'page.tsx');
  if (fs.existsSync(adminPagePath)) {
    let adm = fs.readFileSync(adminPagePath, 'utf8');
    adm = adm.replace(/v10\.2\.\d+/g, 'v10.2.29');
    fs.writeFileSync(adminPagePath, adm, 'utf8');
    console.log('✓ Updated admin/page.tsx to v10.2.29');
  }
}

build();
