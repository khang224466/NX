const fs = require('fs');
const path = require('path');
const terser = require(path.join(__dirname, 'FPT service', 'node_modules', 'next', 'dist', 'compiled', 'terser'));

function bookmarkletFunction(preKey) {
  try {
    var CURRENT_VERSION = 'v10.2.20';

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
      if (!enc || typeof enc !== 'string') return { valid: false, reason: 'Chưa có Key' };
      var clean = enc.trim();
      if (clean.startsWith('AIza') || clean.startsWith('AQ.')) {
        return { valid: true, expired: false, key: clean, plan: 'Lifetime' };
      }
      if (!clean.startsWith('ENC_AI_')) return { valid: false, reason: 'Key không đúng định dạng' };
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
          if (isNaN(exp)) return { valid: false, reason: 'Lỗi timestamp' };
          var expDate = new Date(exp).toLocaleDateString('vi-VN') + ' ' + new Date(exp).toLocaleTimeString('vi-VN');
          if (now > exp) {
            return { valid: false, expired: true, plan: plan, expDate: expDate, reason: 'Key gói ' + plan + ' đã hết hạn vào ' + expDate };
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
    var activeEncryptedKey = preKey || localStorage.getItem('enx_encrypted_ai_key') || localStorage.getItem('enx_license_key') || '';
    var isSubmitting = false;
    var lastSubmitTimestamp = 0;
    var lastSubmittedText = '';
    var lastSolvedHash = '';
    var isAuto = true;
    var rateLimitCooldownUntil = 0;
    var preferredModel = 'gemini-flash-lite-latest';
    var hasHandledInitialReady = false;

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

    // Giao Diện HUD
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
      var isKeyExpired = keyCheck.expired;
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

      // 3. THANH KEY MÃ HÓA
      var kBox = document.createElement('div');
      kBox.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:6px 10px;margin-bottom:8px;';
      var kLabel = document.createElement('div');
      kLabel.style.cssText = 'display:flex;align-items:center;gap:6px;';
      var kIcon = document.createElement('span');
      kIcon.textContent = hasKey ? '🔑' : '⚠️';
      kLabel.appendChild(kIcon);
      var kTxt = document.createElement('span');
      kTxt.style.cssText = hasKey ? 'color:#34d399;font-weight:700;' : 'color:#f59e0b;font-weight:700;';
      kTxt.textContent = hasKey ? 'Key: Đã kích hoạt' : 'Chưa có Key mã hóa (Cần nhập)';
      kLabel.appendChild(kTxt);
      kBox.appendChild(kLabel);

      var kBtn = document.createElement('button');
      kBtn.style.cssText = 'background:none;border:none;color:#38bdf8;cursor:pointer;font-size:10px;text-decoration:underline;';
      kBtn.textContent = hasKey ? 'Đổi Key' : 'Nhập Key Mã Hóa';
      kBtn.onclick = function() {
        showKeyConfigModal();
      };
      kBox.appendChild(kBtn);
      bodyBox.appendChild(kBox);

      // 4. TRẠNG THÁI MÀN HÌNH VISION
      var vBox = document.createElement('div');
      vBox.style.cssText = 'display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:6px 10px;margin-bottom:8px;';
      var vLabel = document.createElement('div');
      vLabel.style.cssText = 'display:flex;align-items:center;gap:6px;';
      var vDot = document.createElement('span');
      vDot.style.cssText = hasVision ? 'color:#10b981;' : 'color:#ef4444;';
      vDot.textContent = hasVision ? '●' : '●';
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
        log('warn', 'Vui lòng nhập Key mã hóa (bắt đầu bằng ENC_AI_)');
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

    // Modal cấu hình Key
    function showKeyConfigModal() {
      var oldModal = document.getElementById('enx-key-modal');
      if (oldModal) oldModal.remove();

      var m = document.createElement('div');
      m.id = 'enx-key-modal';
      m.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;width:380px;background:#0b0f19;border:2px solid #38bdf8;border-radius:16px;box-shadow:0 25px 60px rgba(0,0,0,0.9),0 0 30px rgba(56,189,248,0.3);padding:18px;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-sizing:border-box;';

      var mh = document.createElement('div');
      mh.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;';
      var mTitle = document.createElement('div');
      mTitle.style.cssText = 'font-weight:800;font-size:14px;color:#38bdf8;';
      mTitle.textContent = '🔑 CẤU HÌNH KEY MÃ HÓA';
      mh.appendChild(mTitle);

      var mcBtn = document.createElement('button');
      mcBtn.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;';
      mcBtn.textContent = '✕';
      mcBtn.onclick = function() { m.remove(); };
      mh.appendChild(mcBtn);
      m.appendChild(mh);

      var desc = document.createElement('div');
      desc.style.cssText = 'font-size:11px;color:#94a3b8;margin-bottom:8px;line-height:1.4;';
      desc.textContent = 'Dán mã Key đã được chuyển đổi từ máy mã hóa (Bắt buộc bắt đầu bằng ENC_AI_).';
      m.appendChild(desc);

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
        var v = (inp.value || '').trim();
        var raw = decryptEncryptedKey(v);
        if (raw) {
          activeEncryptedKey = v;
          localStorage.setItem('enx_encrypted_ai_key', v);
          alert('✓ Đã lưu và kích hoạt Key thành công!');
          m.remove();
          renderBody();
          log('success', 'Đã nạp Key mã hóa thành công!');
        } else {
          alert('❌ Key không hợp lệ! Vui lòng nhập Key đã được mã hóa (bắt đầu bằng ENC_AI_).');
        }
      };
      m.appendChild(saveBtn);

      var foot = document.createElement('div');
      foot.style.cssText = 'background:#020617;border:1px solid #1e293b;border-radius:8px;padding:8px 10px;font-size:11px;line-height:1.5;color:#94a3b8;';
      var fTitle = document.createElement('div');
      fTitle.style.cssText = 'font-weight:700;color:#e2e8f0;margin-bottom:4px;';
      fTitle.textContent = '💳 HỖ TRỢ / MUA KEY BẢN QUYỀN:';
      foot.appendChild(fTitle);

      var mbRow = document.createElement('div');
      var mbB = document.createElement('b');
      mbB.textContent = '• STK MBBank: ';
      mbRow.appendChild(mbB);
      var mbSpan = document.createElement('span');
      mbSpan.style.cssText = 'color:#10b981;font-family:monospace;font-weight:700;';
      mbSpan.textContent = '151010042005';
      mbRow.appendChild(mbSpan);
      mbRow.appendChild(document.createTextNode(' (DIEP DAI PHU)'));
      foot.appendChild(mbRow);

      var dcRow = document.createElement('div');
      dcRow.style.cssText = 'margin-top:2px;';
      var dcB = document.createElement('b');
      dcB.textContent = '• Discord Admin: ';
      dcRow.appendChild(dcB);
      var dcLink = document.createElement('a');
      dcLink.href = 'https://discord.com/users/888713971161505832';
      dcLink.target = '_blank';
      dcLink.style.cssText = 'color:#38bdf8;text-decoration:underline;font-weight:600;';
      dcLink.textContent = 'Nhắn tin Admin Discord';
      dcRow.appendChild(dcLink);
      foot.appendChild(dcRow);

      m.appendChild(foot);
      document.body.appendChild(m);
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
        log('warn', 'Chưa có Key mã hóa hợp lệ! Nhấn "Nhập Key Mã Hóa" để kích hoạt.');
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

    function findSubmitButton(inp) {
      var candidates = [];

      function consider(el, score, reason) {
        if (!el) return;
        if (el.closest('#enx-pro-hud, #enx-key-modal, .course-lesson-list, [class*="lesson-list"], aside:not(.w-chat-input__intent-panel), nav, .ant-layout-sider')) return;
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
            setStatus('✓ Đã nộp thành công! Chờ hệ thống ghi nhận...', '#34d399');
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

        setTimeout(function() { isSubmitting = false; }, 3500);
        return true;
      } catch(err) {
        isSubmitting = false;
        log('err', 'Lỗi khi nộp bài: ' + (err.message || err));
        return false;
      }
    }

    // =========================================================================
    // VÒNG LẶP TỰ ĐỘNG LIÊN TỤC 100% v10.2.20 (XÓA BỎ HOÀN TOÀN LUỒNG CỨNG)
    // =========================================================================

    // KIỂM TRA TOÀN BỘ BÀI HỌC CÓ HOÀN THÀNH KHÔNG
    
    // =========================================================================
    // GIỚI HẠN MÔN HỌC: 1 MÔN / 1 BÀI / TUẦN & GIỚI HẠN SỐ MÔN THEO GÓI
    // =========================================================================
    function detectEduNextCourse() {
      var courseId = '';
      var courseCode = '';
      var courseName = '';

      try {
        var url = window.location.href;
        var mCourse = url.match(/course(?:s|\/detail)?\/([a-zA-Z0-9_-]+)/i);
        if (mCourse) courseId = mCourse[1];
        var mSession = url.match(/session(?:s)?\/([a-zA-Z0-9_-]+)/i);
      } catch(e) {}

      try {
        var textContent = document.title + ' ' + (document.querySelector('.breadcrumb, .ant-breadcrumb, h1, h2, .course-header, [class*="course"]') || {}).innerText;
        var mCode = textContent.match(/\b([A-Z]{3}\s*\d{3})\b/i);
        if (mCode) {
          courseCode = mCode[1].toUpperCase().replace(/\s+/g, '');
        }
      } catch(e) {}

      try {
        var titleEl = document.querySelector('.course-name, .course-title, [class*="course-name"], [class*="CourseHeader"]');
        if (titleEl) {
          courseName = (titleEl.innerText || titleEl.textContent || '').trim();
        }
      } catch(e) {}

      var key = courseCode || courseId || ('COURSE_' + window.location.pathname.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30));
      var label = courseCode || courseName || ('Môn ' + (courseId || 'hiện tại'));

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

    function checkIsLessonCompleted() {
      var mainArea = document.querySelector('.chat-view, [class*="chat-content"], [class*="chat-container"], main, .ant-layout-content') || document.body;
      var text = (mainArea.innerText || '').toLowerCase();
      return text.includes('hoàn thành bài học') || 
             text.includes('chúc mừng bạn đã hoàn thành') || 
             text.includes('buổi học đã kết thúc') || 
             text.includes('bài học đã kết thúc') ||
             text.includes('đã hoàn thành toàn bộ');
    }

    // HÀM CHÍNH ĐIỀU PHỐI AUTO LOOP TỰ ĐỘNG CHẠY LIÊN TỤC
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

      // 1. Kiểm tra bài học đã xong chưa
      if (checkIsLessonCompleted()) {
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

      // 2. Chống nghẽn rate limit 429
      if (Date.now() < rateLimitCooldownUntil) {
        setStatus('⏳ Đang chờ hồi phục Rate Limit...', '#f59e0b');
        return;
      }

      // 3. Màn hình đầu tiên: Nếu có nút "Sẵn sàng" hiển thị và chưa bấm
      if (!hasHandledInitialReady) {
        var readyBtn = Array.from(document.querySelectorAll('button, [role="button"], .quick-insert-btn')).find(function(b) {
          if (b.closest('#enx-pro-hud, #enx-key-modal')) return false;
          var t = (b.innerText || b.textContent || '').trim();
          return /^sẵn\s*sàng$/i.test(t);
        });

        if (readyBtn) {
          hasHandledInitialReady = true;
          log('info', '🎯 Bắt được nút [Sẵn sàng] mở đầu -> Bấm để bắt đầu bài học!');
          setStatus('🎯 Bấm "Sẵn sàng" mở bài...', '#10b981');
          try { triggerClick(readyBtn); } catch(e) {}
          await submitAnswerToEduNext('Sẵn sàng');
          setStatus('👀 Chờ câu hỏi đầu tiên hiện lên...', '#38bdf8');
          return;
        }
      }

      // 4. Nếu vừa mới nộp bài chưa đầy 4 giây thì tạm chờ EduNext chuyển cảnh
      if (Date.now() - lastSubmitTimestamp < 4000 && !isForced) {
        setStatus('⏳ Chờ EduNext cập nhật sau khi nộp...', '#94a3b8');
        return;
      }

      // 5. Kiểm tra quyền chia sẻ màn hình (Vision Stream)
      var hasVision = !!(visionScreenStream && visionScreenStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; }));
      if (!hasVision) {
        if (isForced) {
          alert('Vui lòng bấm [📸 Chia Sẻ Màn Hình] để bot có thể tự động nhìn đề và giải bài!');
          toggleScreenVision();
        } else {
          setStatus('⚠️ Cần bật [Chia Sẻ Màn Hình] để bot tự giải liên tục', '#f59e0b');
        }
        return;
      }

      // 6. Chụp ảnh màn hình mới nhất
      var shot = capturePersistentVisionFrame();
      if (!shot || !shot.image) {
        return;
      }

      // Tạo mã băm hình ảnh nhẹ để nhận biết câu hỏi đã đổi chưa
      var frameHash = shot.image.length + '_' + shot.image.slice(-80);
      if (frameHash === lastSolvedHash && (Date.now() - lastSubmitTimestamp < 15000) && !isForced) {
        setStatus('👀 Đang theo dõi khi nào câu hỏi mới hiện lên...', '#94a3b8');
        return;
      }

      // 7. Gửi Gemini Vision phân tích và giải quyết
      isSubmitting = true;
      try {
        setStatus('📸 Đang quét đề và giải bài tự động...', '#38bdf8');
        log('info', '📸 Quét màn hình tự động (' + shot.width + 'x' + shot.height + ')...');

        var visionPrompt = [
          'Dùng ảnh màn hình mới nhất để nhận diện và giải quyết bài tập trên EduNext.',
          'QUY TẮC BẮT BUỘC:',
          '1. Nếu ảnh cho thấy buổi học ĐÃ KẾT THÚC hoặc có lời chúc mừng hoàn thành bài học, CHỈ XUẤT ĐÚNG MÃ: __LESSON_COMPLETE__',
          '2. Nếu ảnh có câu hỏi xác nhận "Bạn đã sẵn sàng chuyển sang phần tiếp theo chưa?", CHỈ XUẤT ĐÚNG: Sẵn sàng',
          '3. Nếu ảnh có CÂU HỎI / BÀI TẬP (trắc nghiệm, tự luận, điền ô trống, câu hỏi lý thuyết, bài tập toán/lý/hóa):',
          '   - Hãy giải câu hỏi đó và xuất ĐÚNG ĐÁP ÁN theo định dạng trong ảnh.',
          '   - Trả lời ngắn gọn, trực tiếp vào trọng tâm (ví dụ: "Trả lời: [đáp án]"), không thêm mở đầu kết thúc.',
          '   - Tuyệt đối KHÔNG trả lời "Sẵn sàng" khi có câu hỏi bài tập.',
          '4. Nếu ảnh KHÔNG CÓ CÂU HỎI MỚI cần trả lời (chỉ là màn hình chờ, đang tải, bài giảng lý thuyết đang đọc, hoặc câu trả lời vừa gửi đang chờ chấm), CHỈ XUẤT ĐÚNG MÃ: __NO_QUESTION__'
        ].join('\n\n');

        var ans = await solveQuestion(visionPrompt, shot.image);

        if (!ans || /_{0,2}\s*NO_QUESTION\s*_{0,2}/i.test(ans)) {
          setStatus('👀 Đang theo dõi khi nào câu hỏi hiện lên...', '#94a3b8');
          isSubmitting = false;
          return;
        }

        if (/_{0,2}\s*LESSON_COMPLETE\s*_{0,2}/i.test(ans)) {
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

        // Kiểm tra xem đáp án có bị trùng với câu vừa nộp không
        if (lastSubmittedText && ans.trim() === lastSubmittedText.trim() && (Date.now() - lastSubmitTimestamp < 15000) && !isForced) {
          setStatus('⏳ Đã nộp đáp án này, đang chờ hệ thống duyệt câu mới...', '#94a3b8');
          isSubmitting = false;
          return;
        }

        // Nộp đáp án mới
        log('success', '✓ Gemini Flash-Lite trả lời: "' + ans.slice(0, 35) + '..."');
        setStatus('✍️ Đang điền đáp án và nộp...', '#34d399');

        lastSolvedHash = frameHash;
        isSubmitting = false; // Mở khóa nộp
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

    // VÒNG LẶP TỰ ĐỘNG CHẠY LIÊN TỤC (MỖI 2.5 GIÂY)
    var autoLoopInterval = setInterval(function() {
      runAutoCycle(false);
    }, 2500);

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
  fs.writeFileSync(path.join(toolsDir, 'v10_2_20_minified.js'), minifiedCode, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'v10_2_20_minified.js'), minifiedCode, 'utf8');

  // 1. Tạo Bookmarklet 1-Click Inline
  const bookmarkletCode = `javascript:(${minifiedCode})("");`;
  fs.writeFileSync(path.join(toolsDir, 'bookmarklet_v10_2_20.txt'), bookmarkletCode, 'utf8');
  fs.writeFileSync(path.join(rootDir, 'bookmarklet_v10_2_20.txt'), bookmarkletCode, 'utf8');
  console.log(`✓ Generated bookmarklet_v10_2_20.txt (${bookmarkletCode.length} chars)`);

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
  console.log(`✓ Updated inject.js/route.ts with cache-busting headers`);

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
// @version      10.2.19
// @description  Hỗ trợ sinh viên FPT giải bài tập EduNext tự động, chụp ảnh Vision qua Google Gemini Flash, không cần click, auto liên tục cho đến khi hoàn thành.
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
  console.log(`✓ Updated edunext.user.js/route.ts`);

  // 4. Cập nhật utils.ts: Dùng Safe Base64 Bundle chống lỗi unicode escape Turbopack
  const utilsPath = path.join(webDir, 'src', 'lib', 'utils.ts');
  const b64 = Buffer.from(minifiedCode, 'utf8').toString('base64');
  let utilsContent = fs.readFileSync(utilsPath, 'utf8');
  utilsContent = utilsContent.replace(/v10\.2\.\d+/g, 'v10.2.20');
  utilsContent = utilsContent.replace(/const RAW_FN_BASE64 = ".*?";/s, 'const RAW_FN_BASE64 = "' + b64 + '";');
  fs.writeFileSync(utilsPath, utilsContent, 'utf8');
  console.log(`✓ Updated utils.ts to v10.2.20 with Safe Base64 bundle`);

  // 5. Cập nhật ActivationSuccessModal.tsx và layout.tsx
  const modalPath = path.join(webDir, 'src', 'components', 'checkout', 'ActivationSuccessModal.tsx');
  let modalContent = fs.readFileSync(modalPath, 'utf8');
  modalContent = modalContent.replace(/v10\.2\.\d+/g, 'v10.2.20');
  fs.writeFileSync(modalPath, modalContent, 'utf8');
  console.log(`✓ Updated ActivationSuccessModal.tsx to v10.2.20`);

  const layoutPath = path.join(webDir, 'src', 'app', 'layout.tsx');
  let layoutContent = fs.readFileSync(layoutPath, 'utf8');
  layoutContent = layoutContent.replace(/v10\.2\.\d+/g, 'v10.2.20');
  fs.writeFileSync(layoutPath, layoutContent, 'utf8');
  console.log(`✓ Updated layout.tsx to v10.2.20`);

  // 6. Cập nhật build_keo_bookmark.js và tạo keo_bookmark_edunext.html
  const buildKeoPath = path.join(rootDir, 'build_keo_bookmark.js');
  let buildKeoContent = fs.readFileSync(buildKeoPath, 'utf8');
  buildKeoContent = buildKeoContent.replace(/v10_2_17/g, 'v10_2_20');
  buildKeoContent = buildKeoContent.replace(/v10\.2\.17/g, 'v10.2.20');
  fs.writeFileSync(buildKeoPath, buildKeoContent, 'utf8');
  console.log(`✓ Updated build_keo_bookmark.js to v10.2.20`);
}

build();
