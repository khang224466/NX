const fs = require('fs');
const path = require('path');
const terser = require(path.join(__dirname, 'rental_platform', 'node_modules', 'next', 'dist', 'compiled', 'terser'));

function bookmarkletFunction(preKey) {
  try {
    var CURRENT_VERSION = 'v10.2.16';

    // NẾU CÙNG PHIÊN BẢN VÀ ĐÃ CÓ HUD THÌ CHỈ ẨN / HIỆN
    if (window.__ENX_PRO_HUD__ && window.__ENX_VERSION__ === CURRENT_VERSION) {
      var ex = document.getElementById('enx-pro-hud');
      if (ex) {
        ex.style.display = (ex.style.display === 'none' ? 'block' : 'none');
        return;
      }
    }

    // NẾU LÀ PHIÊN BẢN CŨ HOẶC CÓ HUD CŨ ĐANG CHẠY NGẦM
    // -> TIÊU DIỆT TOÀN BỘ TIMER, MUTATION OBSERVER VÀ GỠ HUD CŨ
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
    var preferredModel = 'gemini-flash-lite-latest';
    var hasHandledInitialReady = false; // Khóa một chiều: Không bao giờ spam Sẵn sàng

    // Vision Stream & Screen Video
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

    var titleBox = document.createElement('div');
    titleBox.style.cssText = 'display:flex;align-items:center;gap:8px;';
    var icon = document.createElement('div');
    icon.style.cssText = 'width:28px;height:28px;border-radius:8px;background:#10b981;display:flex;align-items:center;justify-content:center;color:#000;font-weight:900;font-size:14px;';
    icon.textContent = '⚡';
    titleBox.appendChild(icon);

    var titleText = document.createElement('div');
    var mainTitle = document.createElement('div');
    mainTitle.style.cssText = 'font-weight:800;font-size:13px;color:#fff;display:flex;align-items:center;gap:6px;';
    mainTitle.textContent = 'EduNext AI Pro ';
    var vTag = document.createElement('span');
    vTag.style.cssText = 'font-size:10px;background:rgba(16,185,129,0.2);color:#34d399;border:1px solid rgba(16,185,129,0.4);padding:1px 5px;border-radius:4px;';
    vTag.textContent = CURRENT_VERSION;
    mainTitle.appendChild(vTag);

    var subTitle = document.createElement('div');
    subTitle.style.cssText = 'font-size:10px;color:#10b981;font-weight:600;';
    subTitle.textContent = 'Auto Loop: Sẵn sàng ➔ Giải bài ➔ Hoàn thành';

    titleText.appendChild(mainTitle);
    titleText.appendChild(subTitle);
    titleBox.appendChild(titleText);
    hd.appendChild(titleBox);

    // Minimize & Close buttons
    var actionsBox = document.createElement('div');
    actionsBox.style.cssText = 'display:flex;align-items:center;gap:4px;';

    var minBtn = document.createElement('button');
    minBtn.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:2px 4px;line-height:1;';
    minBtn.textContent = '─';
    minBtn.title = 'Thu nhỏ / Mở rộng';
    minBtn.onclick = function() {
      bodyBox.style.display = (bodyBox.style.display === 'none' ? 'block' : 'none');
    };
    actionsBox.appendChild(minBtn);

    var closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:2px 6px;line-height:1;';
    closeBtn.textContent = '✕';
    closeBtn.onclick = function() {
      try {
        d.dispatchEvent(new CustomEvent('enx_destroy'));
      } catch(e){}
      if (visionScreenStream) {
        visionScreenStream.getTracks().forEach(function(t) { t.stop(); });
      }
      d.remove();
      window.__ENX_PRO_HUD__ = false;
      window.__ENX_VERSION__ = null;
    };
    actionsBox.appendChild(closeBtn);
    hd.appendChild(actionsBox);
    d.appendChild(hd);

    var bodyBox = document.createElement('div');

    function renderBody() {
      while (bodyBox.firstChild) bodyBox.removeChild(bodyBox.firstChild);

      var hasVision = visionScreenStream && visionScreenStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; });
      var hasKey = !!decryptEncryptedKey(activeEncryptedKey);
      var hasTampermonkey = (typeof GM_xmlhttpRequest === 'function') ||
                            (typeof window !== 'undefined' && typeof window.__ENX_GM_XHR__ === 'function') ||
                            (typeof unsafeWindow !== 'undefined' && typeof unsafeWindow.__ENX_GM_XHR__ === 'function');

      // 1. BANNER CẦU NỐI AI NẾU CHƯA CÓ TAMPERMONKEY
      if (!hasTampermonkey) {
        var bridgeBanner = document.createElement('div');
        bridgeBanner.style.cssText = 'background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
        var isBridgeOpen = (bridgeWin && !bridgeWin.closed);

        var bTitle = document.createElement('div');
        bTitle.style.cssText = 'color:#34d399;font-weight:800;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;';
        bTitle.innerHTML = '<span>⚡ CHẾ ĐỘ BOOKMARKLET 100%</span><span style="font-size:10px;padding:1px 5px;border-radius:4px;background:' + (isBridgeOpen ? 'rgba(16,185,129,0.25)' : 'rgba(234,179,8,0.25)') + ';color:' + (isBridgeOpen ? '#34d399' : '#fde047') + ';">' + (isBridgeOpen ? '🟢 Đã kết nối Cầu Nối AI' : '⚠️ Cần mở Cầu Nối AI') + '</span>';
        bridgeBanner.appendChild(bTitle);

        var bDesc = document.createElement('div');
        bDesc.style.cssText = 'color:#cbd5e1;font-size:10px;line-height:1.4;margin-bottom:6px;';
        bDesc.textContent = isBridgeOpen ? 'Cầu Nối AI đang hoạt động song song để bypass CSP. Bạn không cần cài bất kỳ tiện ích hay script nào!' : 'Bấm nút dưới để mở Cầu Nối AI vượt CSP Cloudflare (Không cần cài đặt script).';
        bridgeBanner.appendChild(bDesc);

        var bBtn = document.createElement('button');
        bBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-weight:800;font-size:11px;padding:7px;border-radius:6px;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.3);';
        bBtn.textContent = isBridgeOpen ? '✓ CẦU NỐI AI ĐANG MỞ (BẤM ĐỂ XEM)' : '🌐 BẤM ĐÂY ĐỂ MỞ CẦU NỐI AI (VƯỢT CSP NGAY)';
        bBtn.onclick = function() {
          openBridgeWindow();
          renderBody();
        };
        bridgeBanner.appendChild(bBtn);
        bodyBox.appendChild(bridgeBanner);
      }

      // 2. BANNER YÊU CẦU CHIA SẺ MÀN HÌNH NẾU CHƯA BẬT
      if (!hasVision) {
        var vBanner = document.createElement('div');
        vBanner.style.cssText = 'background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
        var vNotice = document.createElement('div');
        vNotice.style.cssText = 'color:#fca5a5;font-weight:700;margin-bottom:6px;';
        vNotice.textContent = '📸 CẦN CHIA SẺ MÀN HÌNH ĐỂ BOT CHỤP ẢNH & GIẢI BÀI!';
        vBanner.appendChild(vNotice);

        var vActionBtn = document.createElement('button');
        vActionBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#ef4444,#dc2626);border:none;color:#fff;font-weight:800;font-size:11px;padding:8px;border-radius:6px;cursor:pointer;box-shadow:0 4px 12px rgba(239,68,68,0.3);';
        vActionBtn.textContent = '👉 BẤM ĐÂY ĐỂ BẬT CHIA SẺ MÀN HÌNH (TAB EDUNEXT)';
        vActionBtn.onclick = function() {
          toggleScreenVision();
        };
        vBanner.appendChild(vActionBtn);
        bodyBox.appendChild(vBanner);
      }

      // 3. THẺ TRẠNG THÁI KEY MÃ HÓA
      var keyBox = document.createElement('div');
      keyBox.style.cssText = 'background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
      var kRow = document.createElement('div');
      kRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';

      var kStatus = document.createElement('div');
      kStatus.style.cssText = 'color:' + (hasKey ? '#34d399' : '#f87171') + ';font-weight:700;';
      kStatus.textContent = hasKey ? ('🔑 Key Mã Hóa: ' + activeEncryptedKey.slice(0, 14) + '... (✓ Hợp Lệ)') : '⚠️ Chưa có Key mã hóa (Cần nhập)';
      kRow.appendChild(kStatus);

      var kBtn = document.createElement('button');
      kBtn.style.cssText = 'background:none;border:none;color:#38bdf8;cursor:pointer;font-size:10px;text-decoration:underline;';
      kBtn.textContent = hasKey ? 'Đổi Key' : 'Nhập Key Mã Hóa';
      kBtn.onclick = function() {
        showKeyConfigModal();
      };
      kRow.appendChild(kBtn);
      keyBox.appendChild(kRow);
      bodyBox.appendChild(keyBox);

      // 4. TRẠNG THÁI VISION & NÚT ĐIỀU KHIỂN
      var vBox = document.createElement('div');
      vBox.style.cssText = 'background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;';

      var vLeft = document.createElement('div');
      vLeft.style.cssText = 'display:flex;align-items:center;gap:6px;';
      var vDot = document.createElement('span');
      vDot.id = 'vision-dot';
      vDot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + (hasVision ? '#10b981' : '#ef4444') + ';display:inline-block;';
      vLeft.appendChild(vDot);

      var vTxt = document.createElement('span');
      vTxt.id = 'vision-text';
      vTxt.style.cssText = 'color:' + (hasVision ? '#34d399' : '#f87171') + ';font-weight:700;font-size:11px;';
      vTxt.textContent = hasVision ? 'Auto-Vision: Sẵn sàng chụp' : 'Màn Hình: Chưa bật';
      vLeft.appendChild(vTxt);
      vBox.appendChild(vLeft);

      var vToggleBtn = document.createElement('button');
      vToggleBtn.id = 'vision-btn';
      vToggleBtn.style.cssText = 'background:' + (hasVision ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)') + ';border:1px solid ' + (hasVision ? '#ef4444' : '#10b981') + ';color:' + (hasVision ? '#f87171' : '#34d399') + ';padding:4px 8px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;';
      vToggleBtn.textContent = hasVision ? '⏹ Dừng' : '📸 Chia Sẻ Màn Hình';
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
        if (!hasVision) {
          alert('Vui lòng bấm [📸 Chia Sẻ Màn Hình] để bot có thể chụp ảnh đề bài!');
          toggleScreenVision();
          return;
        }
        triggerQuestionCheck(true);
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
        log('info', 'Chế độ tự động: ' + (isAuto ? 'BẬT' : 'TẮT'));
      };
      actRow.appendChild(autoBtn);
      bodyBox.appendChild(actRow);

      // 6. DÒNG TRẠNG THÁI HIỆN TẠI
      var stLine = document.createElement('div');
      stLine.id = 'hud-status-text';
      stLine.style.cssText = 'font-size:11px;color:#38bdf8;margin-bottom:6px;min-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;';
      stLine.textContent = hasVision ? '● Đang lắng nghe & chụp ảnh đề bài...' : '⚠️ Chờ cấp quyền chia sẻ màn hình...';
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

    // BẬT / TẮT CHIA SẺ MÀN HÌNH (AUTO-VISION)
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
        log('success', '✓ Đã kích hoạt Auto-Vision (Chụp ngay khi câu hỏi xuất hiện)!');
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
      mbSpan.textContent = '0987654321';
      mbRow.appendChild(mbSpan);
      mbRow.appendChild(document.createTextNode(' (VO TRI KHANG)'));
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
        log('warn', 'Google Gemini chưa phản hồi đáp án.');
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

    function findReactProp(dom, propName) {
      var fiber = getReactFiber(dom);
      var depth = 0;
      while (fiber && depth < 60) {
        if (fiber.memoizedProps && fiber.memoizedProps[propName] !== undefined) {
          return fiber.memoizedProps[propName];
        }
        if (fiber.pendingProps && fiber.pendingProps[propName] !== undefined) {
          return fiber.pendingProps[propName];
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

        await new Promise(function(resolve) { setTimeout(resolve, 250); });
        openRadialMenuIfNeeded();

        await new Promise(function(resolve) { setTimeout(resolve, 250); });

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
            setStatus('✓ Đã nộp thành công! Đang chờ phản hồi...', '#34d399');
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
            setStatus('✓ Đã gửi qua React Fiber! Đang chờ chuyển tiếp...', '#34d399');
          }
        } catch(e) {}

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

    // =========================================================================
    // HỆ THỐNG PHÁT HIỆN TRẠNG THÁI CHAT REACTIVE v10.2.16 (KHẮC PHỤC TRIỆT ĐỂ SPAM SẴN SÀNG)
    // =========================================================================
    var lastSolvedHash = '';
    var activeChatObserver = null;

    // LẤY DANH SÁCH DÒNG TIN NHẮN TỪ .chat-messages
    function getChatRows() {
      var container = document.querySelector('.chat-messages, [class*="chat-messages"]');
      if (container) {
        var children = Array.from(container.children);
        var rows = children.filter(function(el) {
          return el.classList.contains('assistant-row') || 
                 el.classList.contains('user-row') || 
                 el.classList.contains('message-assistant') || 
                 el.classList.contains('message-user') ||
                 el.querySelector('.assistant-message-stack, .user-message-stack');
        });
        if (rows.length > 0) return rows;
      }
      return Array.from(document.querySelectorAll('.assistant-row, .user-row, .message-assistant, .message-user'));
    }

    // KIỂM TRA TOÀN BỘ BÀI HỌC CÓ HOÀN THÀNH KHÔNG
    function isLessonCompleted() {
      var mainArea = document.querySelector('.chat-view, [class*="chat-content"], [class*="chat-container"], main, .ant-layout-content') || document.body;
      var text = (mainArea.innerText || '').toLowerCase();
      return text.includes('hoàn thành bài học') || 
             text.includes('chúc mừng bạn đã hoàn thành') || 
             text.includes('buổi học đã kết thúc') || 
             text.includes('bài học đã kết thúc') ||
             text.includes('đã hoàn thành toàn bộ');
    }

    // BỘ PHÂN LOẠI TRẠNG THÁI CHAT THỰC THỜI CHUẨN XÁC 100%
    function detectCurrentQuestionState() {
      // 1. Kiểm tra hoàn thành bài học trước tiên
      if (isLessonCompleted()) {
        return { type: 'COMPLETED' };
      }

      // 2. Kiểm tra bot EduNext có đang streaming/phân tích không
      var isStreaming = !!document.querySelector('.w-send-btn__spinner, .chat-pending-placeholder, .ant-spin');
      if (isStreaming) {
        return { type: 'STREAMING' };
      }
      var ta = getTextarea();
      if (ta) {
        try {
          if (findReactProp(ta, 'isStreaming') === true) return { type: 'STREAMING' };
        } catch(e) {}
      }

      // 3. Phân tích các hàng tin nhắn chat
      var assistantRows = Array.from(document.querySelectorAll('.assistant-row, .message-assistant'));
      var userRows = Array.from(document.querySelectorAll('.user-row, .message-user'));

      var lastAssistant = assistantRows.length > 0 ? assistantRows[assistantRows.length - 1] : null;
      var lastUser = userRows.length > 0 ? userRows[userRows.length - 1] : null;

      // TRƯỜNG HỢP A: ĐÃ GỬI BÀI, ĐANG CHỜ GIÁO VIÊN TRẢ LỜI
      if (lastUser && lastAssistant) {
        // Nếu userRow nằm sau assistantRow trong cây DOM -> Học sinh vừa gửi, giáo viên chưa ra câu hỏi mới
        if (lastAssistant.compareDocumentPosition(lastUser) & Node.DOCUMENT_POSITION_FOLLOWING) {
          return { type: 'WAITING_ASSISTANT' };
        }
      }
      if (lastUser && !lastAssistant) {
        return { type: 'WAITING_ASSISTANT' };
      }

      // TRƯỜNG HỢP B: CHƯA CÓ TIN NHẮN NÀO CỦA HỌC SINH (MỚI VÀO BÀI HỌC)
      // CHỈ TẠI ĐÂY MỚI ĐƯỢC XÉT MÀN HÌNH "SẴN SÀNG"
      if (!lastUser && lastAssistant && !hasHandledInitialReady) {
        var firstText = (lastAssistant.innerText || lastAssistant.textContent || '').trim();
        var firstReadyBtn = lastAssistant.querySelector('.quick-insert-btn, button');
        var isReadyBtn = firstReadyBtn && /^sẵn\s*sàng$/i.test((firstReadyBtn.innerText || firstReadyBtn.textContent || '').trim());
        var hasReadyText = /bạn\s*đã\s*sẵn\s*sàng|sẵn\s*sàng\s*chuyển\s*sang/i.test(firstText);

        if (isReadyBtn || hasReadyText) {
          return {
            type: 'READY_PROMPT',
            button: isReadyBtn ? firstReadyBtn : null,
            text: 'Sẵn sàng'
          };
        }
      }

      // TRƯỜNG HỢP C: GIÁO VIÊN ĐÃ GỬI TIN NHẮN MỚI SAU HỌC SINH (HOẶC ĐANG CÓ ĐỀ BÀI)
      if (lastAssistant) {
        var assistantText = (lastAssistant.innerText || lastAssistant.textContent || '').trim();

        // Bỏ qua placeholder
        if (/^đang\s*(?:suy\s*nghĩ|tải|phân\s*tích|xử\s*lý)\b/i.test(assistantText)) {
          return { type: 'STREAMING' };
        }

        // Kiểm tra xem có khối câu hỏi bài tập không (.exercise-question-block)
        var qBlocks = lastAssistant.querySelectorAll('.exercise-question-block, [data-testid="exercise-question-block"]');
        if (qBlocks.length === 0) {
          // Tìm toàn cục nếu khối bài tập render độc lập
          qBlocks = document.querySelectorAll('.exercise-question-block, [data-testid="exercise-question-block"]');
        }

        if (qBlocks.length > 0) {
          var lastBlock = qBlocks[qBlocks.length - 1];
          var blockTxt = (lastBlock.innerText || lastBlock.textContent || '').trim();
          if (blockTxt.length > 5) {
            return {
              type: 'QUESTION',
              subtype: 'EXERCISE_BLOCK',
              element: lastBlock,
              text: blockTxt
            };
          }
        }

        // Nếu nội dung tin nhắn giáo viên dài và chứa câu hỏi
        if (assistantText.length > 10) {
          // Bỏ qua nếu là lời chào mở đầu mà chưa có câu hỏi
          if (/bạn\s*đã\s*sẵn\s*sàng/i.test(assistantText) && !hasHandledInitialReady) {
            return { type: 'READY_PROMPT', text: 'Sẵn sàng' };
          }
          return {
            type: 'QUESTION',
            subtype: 'ASSISTANT_MESSAGE',
            element: lastAssistant,
            text: assistantText
          };
        }
      }

      return { type: 'NONE' };
    }

    // XỬ LÝ SỰ KIỆN TRẠNG THÁI CÂU HỎI
    async function handleDetectedQuestion(state, isForced) {
      if (!state || isSubmitting) return;

      var currentHash = state.type + '_' + (state.text ? state.text.slice(0, 80) : '') + (state.button ? '_btn' : '');
      if (currentHash === lastSolvedHash && !isForced) {
        return;
      }

      isSubmitting = true;
      try {
        // 1. HOÀN THÀNH TOÀN BỘ BÀI HỌC
        if (state.type === 'COMPLETED') {
          log('success', '🎉 CHÚC MỪNG: BẠN ĐÃ HOÀN THÀNH TOÀN BỘ BÀI HỌC!');
          setStatus('🎉 HOÀN THÀNH TOÀN BỘ BÀI HỌC!', '#10b981');
          isAuto = false;
          var autoBtnEl = document.getElementById('hud-auto-btn');
          if (autoBtnEl) {
            autoBtnEl.textContent = '⏸ Auto: TẮT';
            autoBtnEl.style.background = 'rgba(100,116,139,0.2)';
          }
          isSubmitting = false;
          return;
        }

        // 2. MÀN HÌNH BẮT ĐẦU: BẤM [SẴN SÀNG] (CHỈ THỰC HIỆN 1 LẦN DUY NHẤT)
        if (state.type === 'READY_PROMPT') {
          if (hasHandledInitialReady && !isForced) {
            isSubmitting = false;
            return;
          }
          hasHandledInitialReady = true;
          lastSolvedHash = currentHash;

          log('info', '🎯 Bắt được màn hình [Sẵn sàng] -> Bấm nộp để mở câu hỏi đầu tiên!');
          setStatus('🎯 Đang nộp "Sẵn sàng"...', '#10b981');

          if (state.button) {
            try { triggerClick(state.button); } catch(e) {}
          }
          await submitAnswerToEduNext('Sẵn sàng');
          setStatus('👀 Chờ câu hỏi đầu tiên hiện lên...', '#38bdf8');
          isSubmitting = false;
          return;
        }

        // 3. CÂU HỎI BÀI TẬP HIỆN LÊN MÀN HÌNH
        if (state.type === 'QUESTION') {
          lastSolvedHash = currentHash;
          log('info', '📸 ĐÃ PHÁT HIỆN CÂU HỎI MỚI! Chụp ảnh màn hình và gửi Gemini...');
          setStatus('📸 Đang chụp câu hỏi vừa hiện lên...', '#38bdf8');

          var shot = capturePersistentVisionFrame();
          var currentQText = state.text || '';

          var promptParts = [
            'Dùng ảnh màn hình mới nhất để nhận diện và giải quyết bài tập trên EduNext.',
            currentQText ? ('CÂU HỎI TRÊN KHUNG CHAT:\n' + currentQText.slice(-400)) : '',
            'QUY TẮC BẮT BUỘC:',
            '1. Nếu ảnh cho thấy buổi học ĐÃ KẾT THÚC hoặc có lời chúc mừng hoàn thành bài học, CHỈ XUẤT ĐÚNG MÃ: __LESSON_COMPLETE__',
            '2. Nếu ảnh có câu hỏi xác nhận "Bạn đã sẵn sàng chuyển sang phần tiếp theo chưa?", CHỈ XUẤT ĐÚNG: Sẵn sàng',
            '3. Nếu ảnh có CÂU HỎI / BÀI TẬP (trắc nghiệm, tự luận, điền ô trống, câu hỏi lý thuyết, bài tập toán/lý/hóa):',
            '   - Giải câu hỏi đó và xuất ĐÚNG ĐÁP ÁN ngắn gọn, súc tích, chính xác nhất.',
            '   - Trả lời trực tiếp vào trọng tâm (ví dụ: "Trả lời: [đáp án]"), không thêm mở đầu kết thúc.',
            '   - Tuyệt đối KHÔNG trả lời "Sẵn sàng" khi có câu hỏi bài tập.',
            '4. Nếu ảnh chưa có câu hỏi hoặc đang tải, CHỈ XUẤT ĐÚNG MÃ: __NO_QUESTION__'
          ];
          var visionPrompt = promptParts.filter(Boolean).join('\n\n');

          var ans = '';
          if (shot && shot.image) {
            ans = await solveQuestion(visionPrompt, shot.image);
          } else {
            var textPrompt = 'Giải câu hỏi bài tập sau ngắn gọn, chính xác theo mẫu:\n' + currentQText;
            ans = await solveQuestion(textPrompt, null);
          }

          if (!ans || /_{0,2}\s*NO_QUESTION\s*_{0,2}/i.test(ans)) {
            log('warn', 'AI phản hồi chưa có câu hỏi mới, tiếp tục theo dõi...');
            setStatus('👀 Đang theo dõi khi nào câu hỏi hiện lên...', '#94a3b8');
            isSubmitting = false;
            return;
          }

          if (/_{0,2}\s*LESSON_COMPLETE\s*_{0,2}/i.test(ans)) {
            log('success', '🎉 CHÚC MỪNG: BẠN ĐÃ HOÀN THÀNH TOÀN BỘ BÀI HỌC!');
            setStatus('🎉 HOÀN THÀNH TOÀN BỘ BÀI HỌC!', '#10b981');
            isAuto = false;
            var autoBtnEl2 = document.getElementById('hud-auto-btn');
            if (autoBtnEl2) {
              autoBtnEl2.textContent = '⏸ Auto: TẮT';
              autoBtnEl2.style.background = 'rgba(100,116,139,0.2)';
            }
            isSubmitting = false;
            return;
          }

          log('success', '✓ Gemini Flash-Lite trả lời: "' + ans.slice(0, 35) + '..."');
          setStatus('✍️ Đang điền đáp án và nộp...', '#34d399');

          isSubmitting = false; // Mở khóa để nộp bài
          await submitAnswerToEduNext(ans);
          log('success', '✓ ĐÃ NỘP XONG! Đang theo dõi khi nào câu hỏi tiếp theo hiện lên...');
          setStatus('👀 Đang theo dõi khi nào câu hỏi mới hiện lên...', '#38bdf8');
        }
      } catch(err) {
        log('err', 'Lỗi: ' + (err.message || err));
      } finally {
        isSubmitting = false;
      }
    }

    // ĐIỀU PHỐI VÒNG LẶP SỰ KIỆN REACTIVE
    function triggerQuestionCheck(isForced) {
      if (!isAuto && !isForced) return;
      if (isSubmitting) return;

      var state = detectCurrentQuestionState();
      if (state.type === 'STREAMING') {
        setStatus('● Giáo viên EduNext đang nhập câu hỏi...', '#f59e0b');
        return;
      }
      if (state.type === 'WAITING_ASSISTANT') {
        setStatus('⏳ Đang chờ giáo viên EduNext ra đề...', '#94a3b8');
        return;
      }
      if (state.type === 'QUESTION' || state.type === 'READY_PROMPT' || state.type === 'COMPLETED') {
        handleDetectedQuestion(state, isForced);
      }
    }

    // KHỞI ĐỘNG GIAO DIỆN
    d.appendChild(bodyBox);
    renderBody();

    // GẮN MUTATION OBSERVER ĐÓN BẮT CÂU HỎI TRONG 1MS
    (function installReactiveObserver() {
      if (activeChatObserver) {
        try { activeChatObserver.disconnect(); } catch(e) {}
      }
      var chatContainer = document.querySelector('.chat-messages, .chat-view, [class*="chat-content"]') || document.body;
      activeChatObserver = new MutationObserver(function() {
        triggerQuestionCheck(false);
      });
      activeChatObserver.observe(chatContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });
      log('info', '✓ Đã kích hoạt Reactive Question Tracker (Chụp ngay khi câu hỏi hiện lên)');
    })();

    // NHỊP KIỂM TRA ĐỀ PHÒNG MUTATION KHÔNG BẮN (MỖI 500MS)
    var fallbackInterval = setInterval(function() {
      triggerQuestionCheck(false);
    }, 500);

    d.addEventListener('enx_destroy', function() {
      if (activeChatObserver) {
        try { activeChatObserver.disconnect(); } catch(e) {}
      }
      clearInterval(fallbackInterval);
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

  // Lưu file minified độc lập
  fs.writeFileSync(path.join(__dirname, 'v10_2_16_minified.js'), minifiedCode, 'utf8');

  // 1. Tạo Bookmarklet 1-Click Inline
  const bookmarkletCode = `javascript:(${minifiedCode})("");`;
  fs.writeFileSync(path.join(__dirname, 'bookmarklet_v10_2_16.txt'), bookmarkletCode, 'utf8');
  console.log(`✓ Generated bookmarklet_v10_2_16.txt (${bookmarkletCode.length} chars)`);

  // 2. Cập nhật route inject.js
  const injectRoutePath = path.join(__dirname, 'rental_platform', 'src', 'app', 'inject.js', 'route.ts');
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
  const tmRoutePath = path.join(__dirname, 'rental_platform', 'src', 'app', 'edunext.user.js', 'route.ts');
  const tmContent = `import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key') || '';
  
  const minifiedCode = ${JSON.stringify(minifiedCode)};
  
  const userScript = \`// ==UserScript==
// @name         EduNext AI Assistant Pro (Bypass Cloudflare & Auto-Solve)
// @namespace    https://fpt-studyhub.vercel.app/
// @version      10.2.16
// @description  Hỗ trợ sinh viên FPT giải bài tập EduNext tự động, chụp ảnh Vision qua Google Gemini Flash, khắc phục 100% spam Sẵn sàng, nộp bài chuẩn React Fiber.
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

  // 4. Cập nhật utils.ts và bridge.html
  const utilsPath = path.join(__dirname, 'rental_platform', 'src', 'lib', 'utils.ts');
  let utilsContent = fs.readFileSync(utilsPath, 'utf8');
  utilsContent = utilsContent.replace(/v10\.2\.\d+/g, 'v10.2.16');
  fs.writeFileSync(utilsPath, utilsContent, 'utf8');
  console.log(`✓ Updated utils.ts to v10.2.16`);

  const bridgePath = path.join(__dirname, 'rental_platform', 'public', 'bridge.html');
  let bridgeContent = fs.readFileSync(bridgePath, 'utf8');
  bridgeContent = bridgeContent.replace(/v10\.2\.\d+/g, 'v10.2.16');
  fs.writeFileSync(bridgePath, bridgeContent, 'utf8');
  console.log(`✓ Updated bridge.html to v10.2.16`);
}

build();
