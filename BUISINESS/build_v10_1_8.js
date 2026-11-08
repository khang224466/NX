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

    // State Variables
    var activeKey = preKey || localStorage.getItem('enx_ai_key') || localStorage.getItem('enx_license_key') || '';
    var isSubmitting = false;
    var lastSubmitTimestamp = 0;
    var lastSubmittedText = '';
    var lastQuestionHash = '';
    var isAuto = true;

    // Vision Stream
    var visionStream = null;
    var visionVideo = null;

    // AI Bridge Cross-Window Manager (Bypass CSP)
    var bridgeWin = null;
    var bridgeStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'connected'
    var pendingBridgeReqs = {};

    function updateBridgeUI() {
      var bBtn = document.getElementById('hud-bridge-btn');
      var bTxt = document.getElementById('hud-bridge-txt');
      var bDot = document.getElementById('hud-bridge-dot');
      var isConn = bridgeStatus === 'connected' && bridgeWin && !bridgeWin.closed;
      if (bDot) bDot.style.background = isConn ? '#10b981' : (bridgeStatus === 'connecting' ? '#f59e0b' : '#64748b');
      if (bTxt) {
        bTxt.textContent = isConn ? 'Cầu Nối AI: Đã kết nối' : (bridgeStatus === 'connecting' ? 'Cầu Nối AI: Đang nối...' : 'Cầu Nối AI: Chưa bật');
        bTxt.style.color = isConn ? '#34d399' : (bridgeStatus === 'connecting' ? '#fbbf24' : '#94a3b8');
      }
      if (bBtn) {
        bBtn.textContent = isConn ? '✓ Sẵn Sàng' : '🌐 Kết Nối';
        bBtn.style.background = isConn ? 'rgba(16,185,129,0.15)' : 'rgba(56,189,248,0.15)';
        bBtn.style.borderColor = isConn ? '#10b981' : '#38bdf8';
        bBtn.style.color = isConn ? '#34d399' : '#38bdf8';
      }
    }

    function openBridge() {
      try {
        if (bridgeWin && !bridgeWin.closed) {
          bridgeWin.focus();
          return bridgeWin;
        }
        bridgeStatus = 'connecting';
        updateBridgeUI();
        log('info', 'Đang mở Cầu Nối Cloud AI Bridge (v10.1.8)...');
        bridgeWin = window.open('https://fpt-studyhub.vercel.app/bridge', 'enx_ai_bridge', 'width=460,height=420,menubar=no,toolbar=no,location=no');
        if (!bridgeWin) {
          bridgeStatus = 'disconnected';
          updateBridgeUI();
          log('warn', 'Trình duyệt chặn Popup! Bấm [🌐 Kết Nối] để mở Cầu Nối AI.');
          return null;
        }
        // Ping immediately
        setTimeout(function() {
          try {
            if (bridgeWin && !bridgeWin.closed) {
              bridgeWin.postMessage({ type: 'ENX_PING' }, '*');
            }
          } catch(e) {}
        }, 1200);
        return bridgeWin;
      } catch(e) {
        bridgeStatus = 'disconnected';
        updateBridgeUI();
        log('warn', 'Không thể mở popup: ' + e.message);
        return null;
      }
    }

    // Window message listener for AI Bridge
    window.addEventListener('message', function(ev) {
      var data = ev.data;
      if (!data || typeof data !== 'object') return;
      if (data.type === 'ENX_BRIDGE_READY' || data.type === 'ENX_BRIDGE_HEARTBEAT' || data.type === 'ENX_PONG') {
        bridgeStatus = 'connected';
        updateBridgeUI();
        return;
      }
      if (data.type === 'ENX_SOLVE_RES') {
        var req = pendingBridgeReqs[data.requestId];
        if (req) {
          delete pendingBridgeReqs[data.requestId];
          clearTimeout(req.timeoutId);
          if (data.success && data.answer) {
            req.resolve(data.answer);
          } else {
            req.reject(new Error(data.error || 'Lỗi từ Cloud AI Bridge'));
          }
        }
      }
    });

    // Check bridge heartbeat
    setInterval(function() {
      if (bridgeWin && bridgeWin.closed) {
        bridgeWin = null;
        bridgeStatus = 'disconnected';
        updateBridgeUI();
      }
    }, 3000);

    // HUD Container
    var d = document.createElement('div');
    d.id = 'enx-pro-hud';
    d.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:2147483647;width:370px;background:rgba(11,15,25,0.98);border:2px solid #10b981;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,0.85),0 0 25px rgba(16,185,129,0.35);padding:14px;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;backdrop-filter:blur(16px);font-size:12px;box-sizing:border-box;';

    // Header
    var hd = document.createElement('div');
    hd.style.cssText = 'display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:8px;margin-bottom:10px;';
    
    var brand = document.createElement('div');
    brand.style.cssText = 'display:flex;align-items:center;gap:8px;';
    var ic = document.createElement('div');
    ic.style.cssText = 'width:28px;height:28px;border-radius:8px;background:#10b981;display:flex;align-items:center;justify-content:center;color:#000;font-weight:900;font-size:14px;';
    ic.textContent = '⚡';
    brand.appendChild(ic);

    var titles = document.createElement('div');
    var t1 = document.createElement('div');
    t1.style.cssText = 'font-weight:800;font-size:13px;color:#fff;display:flex;align-items:center;gap:6px;';
    t1.textContent = 'EduNext AI Pro ';
    var bg = document.createElement('span');
    bg.style.cssText = 'font-size:10px;background:rgba(16,185,129,0.2);color:#34d399;border:1px solid rgba(16,185,129,0.4);padding:1px 5px;border-radius:4px;';
    bg.textContent = 'v10.1.8';
    t1.appendChild(bg);
    
    var t2 = document.createElement('div');
    t2.style.cssText = 'font-size:10px;color:#10b981;font-weight:600;';
    t2.textContent = 'AI Bridge Chống Chặn CSP • Tự Nộp 100%';
    titles.appendChild(t1);
    titles.appendChild(t2);
    brand.appendChild(titles);
    hd.appendChild(brand);

    var cb = document.createElement('button');
    cb.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:2px 6px;line-height:1;';
    cb.textContent = '✕';
    cb.onclick = function() {
      if (visionStream) {
        visionStream.getTracks().forEach(function(t) { t.stop(); });
      }
      if (bridgeWin && !bridgeWin.closed) {
        bridgeWin.close();
      }
      d.remove();
      window.__ENX_PRO_HUD__ = false;
    };
    hd.appendChild(cb);
    d.appendChild(hd);

    // Body View
    var bodyBox = document.createElement('div');
    d.appendChild(bodyBox);

    (document.body || document.documentElement).appendChild(d);

    function renderView() {
      while (bodyBox.firstChild) bodyBox.removeChild(bodyBox.firstChild);

      // SECTION 1: KEY STATUS & CONFIG
      var keyCard = document.createElement('div');
      keyCard.style.cssText = 'background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
      
      var keyRow = document.createElement('div');
      keyRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
      
      var keyLabel = document.createElement('div');
      keyLabel.style.cssText = 'color:#94a3b8;font-weight:600;';
      keyLabel.textContent = activeKey ? ('🔑 Key: ' + activeKey.slice(0, 10) + '...' + (activeKey.startsWith('AIza') ? ' (Gemini)' : activeKey.startsWith('gsk_') ? ' (Groq)' : ' (License)')) : '⚠️ Chưa cấu hình Key';
      keyRow.appendChild(keyLabel);

      var keyToggleBtn = document.createElement('button');
      keyToggleBtn.style.cssText = 'background:none;border:none;color:#38bdf8;cursor:pointer;font-size:10px;text-decoration:underline;';
      keyToggleBtn.textContent = activeKey ? 'Đổi Key' : 'Nhập Key';
      keyToggleBtn.onclick = function() {
        showKeyInputModal();
      };
      keyRow.appendChild(keyToggleBtn);
      keyCard.appendChild(keyRow);
      bodyBox.appendChild(keyCard);

      // SECTION 2: AI BRIDGE STATUS (BYPASS CSP)
      var bridgeCard = document.createElement('div');
      bridgeCard.style.cssText = 'background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;';

      var bLeft = document.createElement('div');
      bLeft.style.cssText = 'display:flex;align-items:center;gap:6px;';
      var bDot = document.createElement('span');
      bDot.id = 'hud-bridge-dot';
      var isConn = bridgeStatus === 'connected' && bridgeWin && !bridgeWin.closed;
      bDot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + (isConn ? '#10b981' : '#64748b') + ';display:inline-block;';
      bLeft.appendChild(bDot);

      var bTxt = document.createElement('span');
      bTxt.id = 'hud-bridge-txt';
      bTxt.style.cssText = 'color:' + (isConn ? '#34d399' : '#94a3b8') + ';font-weight:600;font-size:11px;';
      bTxt.textContent = isConn ? 'Cầu Nối AI: Đã kết nối' : 'Cầu Nối AI: Chưa bật';
      bLeft.appendChild(bTxt);
      bridgeCard.appendChild(bLeft);

      var bBtn = document.createElement('button');
      bBtn.id = 'hud-bridge-btn';
      bBtn.style.cssText = 'background:rgba(56,189,248,0.15);border:1px solid #38bdf8;color:#38bdf8;padding:4px 8px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;';
      bBtn.textContent = isConn ? '✓ Sẵn Sàng' : '🌐 Kết Nối';
      bBtn.onclick = function() {
        openBridge();
      };
      bridgeCard.appendChild(bBtn);
      bodyBox.appendChild(bridgeCard);

      // SECTION 3: SCREEN SHARING (VISION AI)
      var visionCard = document.createElement('div');
      visionCard.style.cssText = 'background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;';

      var visionLeft = document.createElement('div');
      visionLeft.style.cssText = 'display:flex;align-items:center;gap:6px;';
      var visionDot = document.createElement('span');
      visionDot.id = 'vision-dot';
      var hasStream = visionStream && visionStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; });
      visionDot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + (hasStream ? '#10b981' : '#64748b') + ';display:inline-block;';
      visionLeft.appendChild(visionDot);

      var visionTxt = document.createElement('span');
      visionTxt.id = 'vision-text';
      visionTxt.style.cssText = 'color:' + (hasStream ? '#34d399' : '#94a3b8') + ';font-weight:600;font-size:11px;';
      visionTxt.textContent = hasStream ? 'Màn Hình: Đang chia sẻ' : 'Màn Hình: Chưa bật';
      visionLeft.appendChild(visionTxt);
      visionCard.appendChild(visionLeft);

      var visionBtn = document.createElement('button');
      visionBtn.id = 'vision-btn';
      visionBtn.style.cssText = 'background:rgba(56,189,248,0.15);border:1px solid #38bdf8;color:#38bdf8;padding:4px 8px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;';
      visionBtn.textContent = hasStream ? '⏹ Dừng' : '📸 Chia Sẻ Màn Hình';
      visionBtn.onclick = function() {
        toggleScreenShare();
      };
      visionCard.appendChild(visionBtn);
      bodyBox.appendChild(visionCard);

      // SECTION 4: ACTIONS (SOLVE ONCE + AUTO TOGGLE)
      var actRow = document.createElement('div');
      actRow.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';

      var solveBtn = document.createElement('button');
      solveBtn.style.cssText = 'flex:1;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-weight:800;font-size:11px;padding:9px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(16,185,129,0.3);';
      solveBtn.textContent = '🎯 Giải & Tự Nộp Câu Này Ngay';
      solveBtn.onclick = function() {
        // Automatically try to connect bridge on user click if not connected
        if (!bridgeWin || bridgeWin.closed) {
          openBridge();
        }
        runAgentLoop(true);
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
        log('info', 'Chế độ tự động nộp: ' + (isAuto ? 'BẬT' : 'TẮT'));
      };
      actRow.appendChild(autoBtn);
      bodyBox.appendChild(actRow);

      // SECTION 5: STATUS TEXT
      var statusDiv = document.createElement('div');
      statusDiv.id = 'hud-status-text';
      statusDiv.style.cssText = 'font-size:11px;color:#38bdf8;margin-bottom:6px;min-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;';
      statusDiv.textContent = '● Đang lắng nghe câu hỏi từ EduNext...';
      bodyBox.appendChild(statusDiv);

      // SECTION 6: CONSOLE LOG
      var logBox = document.createElement('div');
      logBox.id = 'hud-logs-box';
      logBox.style.cssText = 'background:#020617;border:1px solid #1e293b;border-radius:8px;height:95px;overflow-y:auto;padding:6px 8px;font-family:monospace;font-size:10px;line-height:1.45;color:#94a3b8;';
      bodyBox.appendChild(logBox);

      log('success', 'EduNext AI Pro v10.1.8 đã kích hoạt!');
      if (activeKey) {
        log('info', 'Key hiện tại: ' + activeKey.slice(0, 10) + '...');
      } else {
        log('warn', 'Chưa có key, vui lòng nhấn "Nhập Key"!');
      }
    }

    function showKeyInputModal() {
      var old = document.getElementById('enx-key-modal');
      if (old) old.remove();

      var km = document.createElement('div');
      km.id = 'enx-key-modal';
      km.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483647;width:380px;background:#0b0f19;border:2px solid #38bdf8;border-radius:16px;box-shadow:0 25px 60px rgba(0,0,0,0.9),0 0 30px rgba(56,189,248,0.3);padding:18px;color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;box-sizing:border-box;';

      var kh = document.createElement('div');
      kh.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;';
      var kt = document.createElement('div');
      kt.style.cssText = 'font-weight:800;font-size:14px;color:#38bdf8;';
      kt.textContent = '🔑 CẤU HÌNH BẢN QUYỀN';
      kh.appendChild(kt);
      var kx = document.createElement('button');
      kx.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;';
      kx.textContent = '✕';
      kx.onclick = function() { km.remove(); };
      kh.appendChild(kx);
      km.appendChild(kh);

      var desc = document.createElement('div');
      desc.style.cssText = 'font-size:11px;color:#94a3b8;margin-bottom:8px;line-height:1.4;';
      desc.textContent = 'Hỗ trợ: Google Gemini API Key, Groq API Key, hoặc License Key kích hoạt.';
      km.appendChild(desc);

      var keyInp = document.createElement('input');
      keyInp.type = 'text';
      keyInp.value = activeKey || '';
      keyInp.placeholder = 'Dán key (AIzaSy... hoặc gsk_... hoặc TRIAL-...)';
      keyInp.style.cssText = 'width:100%;box-sizing:border-box;background:#020617;border:1px solid #334155;border-radius:8px;padding:8px 10px;color:#fff;font-family:monospace;font-size:11px;margin-bottom:10px;outline:none;';
      km.appendChild(keyInp);

      var saveBtn = document.createElement('button');
      saveBtn.textContent = '✓ LƯU & KÍCH HOẠT NGAY';
      saveBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#38bdf8,#0284c7);border:none;color:#fff;font-weight:800;font-size:11px;padding:9px;border-radius:8px;cursor:pointer;margin-bottom:12px;';
      saveBtn.onclick = function() {
        var val = (keyInp.value || '').trim();
        if (!val) {
          alert('Vui lòng nhập Key!');
          return;
        }
        activeKey = val;
        if (val.startsWith('AIza') || val.startsWith('gsk_')) {
          localStorage.setItem('enx_ai_key', val);
        } else {
          localStorage.setItem('enx_license_key', val);
        }
        alert('✓ Đã lưu Key thành công!');
        km.remove();
        renderView();
        log('success', 'Đã nạp Key thành công!');
      };
      km.appendChild(saveBtn);

      // Bank and Discord Support Info
      var infoBox = document.createElement('div');
      infoBox.style.cssText = 'background:#020617;border:1px solid #1e293b;border-radius:8px;padding:8px 10px;font-size:11px;line-height:1.5;color:#94a3b8;';
      
      var infoHd = document.createElement('div');
      infoHd.style.cssText = 'font-weight:700;color:#e2e8f0;margin-bottom:4px;';
      infoHd.textContent = '💳 HỖ TRỢ / MUA LICENSE KEY:';
      infoBox.appendChild(infoHd);

      var stkDiv = document.createElement('div');
      var stkBold = document.createElement('b');
      stkBold.textContent = '• STK MBBank: ';
      stkDiv.appendChild(stkBold);
      var stkNum = document.createElement('span');
      stkNum.style.cssText = 'color:#10b981;font-family:monospace;font-weight:700;';
      stkNum.textContent = '0987654321';
      stkDiv.appendChild(stkNum);
      stkDiv.appendChild(document.createTextNode(' (VO TRI KHANG)'));
      infoBox.appendChild(stkDiv);

      var dcDiv = document.createElement('div');
      dcDiv.style.cssText = 'margin-top:2px;';
      var dcBold = document.createElement('b');
      dcBold.textContent = '• Discord Admin: ';
      dcDiv.appendChild(dcBold);
      var dcLink = document.createElement('a');
      dcLink.href = 'https://discord.com/users/888713971161505832';
      dcLink.target = '_blank';
      dcLink.style.cssText = 'color:#38bdf8;text-decoration:underline;font-weight:600;';
      dcLink.textContent = 'Nhắn tin Admin Discord';
      dcDiv.appendChild(dcLink);
      infoBox.appendChild(dcDiv);

      km.appendChild(infoBox);
      document.body.appendChild(km);
    }

    function log(t, m) {
      var box = document.getElementById('hud-logs-box');
      if (!box) return;
      var row = document.createElement('div');
      row.style.color = (t === 'warn' ? '#f59e0b' : t === 'err' ? '#ef4444' : t === 'success' ? '#10b981' : '#94a3b8');
      row.textContent = '[' + new Date().toLocaleTimeString('vi-VN') + '] ' + m;
      box.appendChild(row);
      box.scrollTop = box.scrollHeight;
    }

    function setStatus(x, c) {
      var el = document.getElementById('hud-status-text');
      if (el) el.textContent = x;
      if (c && el) el.style.color = c;
    }

    function updateVisionStatus() {
      var dot = document.getElementById('vision-dot');
      var txt = document.getElementById('vision-text');
      var btn = document.getElementById('vision-btn');
      var hasStream = visionStream && visionStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; });
      if (dot) dot.style.background = hasStream ? '#10b981' : '#64748b';
      if (txt) {
        txt.textContent = hasStream ? 'Màn Hình: Đang chia sẻ' : 'Màn Hình: Chưa bật';
        txt.style.color = hasStream ? '#34d399' : '#94a3b8';
      }
      if (btn) {
        btn.textContent = hasStream ? '⏹ Dừng' : '📸 Chia Sẻ Màn Hình';
        btn.style.background = hasStream ? 'rgba(239,68,68,0.2)' : 'rgba(56,189,248,0.15)';
        btn.style.borderColor = hasStream ? '#ef4444' : '#38bdf8';
        btn.style.color = hasStream ? '#f87171' : '#38bdf8';
      }
    }

    async function toggleScreenShare() {
      if (visionStream) {
        visionStream.getTracks().forEach(function(t) { t.stop(); });
        visionStream = null;
        visionVideo = null;
        updateVisionStatus();
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
        visionStream = stream;
        visionVideo = video;
        var track = stream.getVideoTracks()[0];
        if (track) {
          track.onended = function() {
            visionStream = null;
            visionVideo = null;
            updateVisionStatus();
            log('warn', 'Chia sẻ màn hình đã ngắt.');
          };
        }
        await video.play();
        updateVisionStatus();
        log('success', '✓ Đã kích hoạt chia sẻ màn hình (Vision AI sẵn sàng)!');
      } catch(err) {
        log('warn', 'Hủy chia sẻ màn hình: ' + (err.message || err));
      }
    }

    function captureCurrentFrame() {
      if (!visionVideo || !visionVideo.videoWidth) return null;
      try {
        var canvas = document.createElement('canvas');
        var maxDim = 1600;
        var scale = Math.min(1, maxDim / Math.max(visionVideo.videoWidth, visionVideo.videoHeight));
        canvas.width = Math.round(visionVideo.videoWidth * scale);
        canvas.height = Math.round(visionVideo.videoHeight * scale);
        var ctx = canvas.getContext('2d');
        ctx.drawImage(visionVideo, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.82);
      } catch(e) {
        return null;
      }
    }

    // Modal popup: Làm rõ ý định
    function handleIntent() {
      var dlg = document.querySelectorAll('.ant-modal, .dialog, [role="dialog"]');
      for (var i = 0; i < dlg.length; i++) {
        var d = dlg[i];
        if (/làm rõ ý định|ý định của bạn/i.test(d.textContent || '')) {
          var opts = d.querySelectorAll('input[type="radio"], .ant-radio-wrapper, button[class*="option"]');
          if (opts.length > 0) {
            opts[Math.floor(Math.random() * opts.length)].click();
            log('success', 'Tự chọn ý định học tập.');
            setTimeout(function() {
              var btns = d.querySelectorAll('button');
              for (var j = 0; j < btns.length; j++) {
                var btn = btns[j];
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

    // Lọc sạch nhiễu kỹ thuật khỏi đoạn văn bản
    function stripNoise(t) {
      if (!t) return '';
      return String(t)
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/[0-9a-f]{8}-[0-9a-f-]{20,}/gi, ' ')
        .replace(/\b[0-9a-f]{20,}\b/gi, ' ')
        .replace(/\b\d{2}:\d{2}:\d{2}\s+\d{1,2}\/\d{1,2}\/\d{4}\b/g, ' ')
        .replace(/đã chấm bằng ai|int:\s*\w+|feedback|sửa công thức/gi, ' ')
        .replace(/\s+/g, ' ').trim();
    }

    // KIỂM TRA PHẦN TỬ CÓ NẰM TRONG SIDEBAR HOẶC NỘI BỘ KHÔNG
    function isSidebarOrInternal(el) {
      if (!el) return true;
      if (el.closest('#enx-pro-hud, #enx-key-modal, #enx-ai-bridge, .course-lesson-list, [class*="lesson-list"], [class*="sidebar"], [class*="sider"], aside, nav, .ant-layout-sider, .chat-footer, [class*="toolbar"]')) {
        return true;
      }
      return false;
    }

    // ARCHITECTURE TỪ CODE GỐC: KIỂM TRA LƯỢT CHAT (STUDENT TURN VS TEACHER TURN)
    function getLatestChatState() {
      try {
        var studentBadges = Array.from(document.querySelectorAll('span, div, p, small, label')).filter(function(el) {
          if (isSidebarOrInternal(el)) return false;
          return /^học\s*sinh$/i.test((el.innerText || el.textContent || '').trim());
        });

        var teacherBadges = Array.from(document.querySelectorAll('button, a, span, div, p')).filter(function(el) {
          if (isSidebarOrInternal(el)) return false;
          var t = (el.innerText || el.textContent || '').trim();
          return /^(?:feedback|sửa công thức)$/i.test(t) || /đã chấm bằng ai/i.test(t) || /^int:\s*\w+/i.test(t);
        });

        var lastStudent = studentBadges.length > 0 ? studentBadges[studentBadges.length - 1] : null;
        var lastTeacher = teacherBadges.length > 0 ? teacherBadges[teacherBadges.length - 1] : null;

        // Nếu học sinh xuất hiện SAU giáo viên -> Đang chờ giáo viên/AI chấm điểm hoặc ra câu mới
        if (lastStudent && lastTeacher && (lastTeacher.compareDocumentPosition(lastStudent) & Node.DOCUMENT_POSITION_FOLLOWING)) {
          return { state: 'waiting_teacher' };
        }
        if (lastStudent && !lastTeacher) {
          return { state: 'waiting_teacher' };
        }

        // Quét tìm khối tin nhắn của giáo viên gần nhất (TUYỆT ĐỐI KHÔNG QUÉT SIDEBAR)
        // Ưu tiên 1: Khối chứa gần nhất trước nút Teacher badge
        if (lastTeacher) {
          var pBox = lastTeacher.closest('.chat-message, [class*="message"], [class*="bubble"], div');
          while (pBox && pBox.parentElement && pBox.parentElement !== document.body && !isSidebarOrInternal(pBox)) {
            var boxTxt = stripNoise(pBox.innerText || pBox.textContent || '');
            if (boxTxt.length >= 15 && /bạn hãy làm bài|làm bài sau|câu hỏi|trả lời:|đáp án|sẵn sàng|theo bảng|tổng hợp lực/i.test(boxTxt)) {
              return { state: 'student_turn', text: boxTxt };
            }
            pBox = pBox.parentElement;
          }
        }

        // Ưu tiên 2: Quét tất cả candidate trong main chat area
        var mainArea = document.querySelector('.chat-view, [class*="chat-content"], [class*="chat-container"], main, .ant-layout-content') || document.body;
        var allQuestionBlocks = Array.from(mainArea.querySelectorAll('div, section, article, p')).filter(function(el) {
          if (isSidebarOrInternal(el)) return false;
          var t = (el.innerText || el.textContent || '').trim();
          if (t.length < 15 || t.length > 4000) return false;
          return /bạn\s*hãy\s*làm\s*bài|làm\s*bài\s*sau|câu\s*hỏi|trả\s*lời\s*:|đáp\s*án|bạn\s*đã\s*sẵn\s*sàng|sẵn\s*sàng\s*chuyển\s*sang|theo\s*bảng|tổng\s*hợp\s*lực|tính\s*toán|xác\s*định/i.test(t);
        });

        if (allQuestionBlocks.length > 0) {
          var latestBlock = allQuestionBlocks[allQuestionBlocks.length - 1];
          var cleanQ = stripNoise(latestBlock.innerText || latestBlock.textContent || '');
          if (cleanQ.length > 10) {
            return { state: 'student_turn', text: cleanQ };
          }
        }

        return { state: 'idle' };
      } catch(e) {
        return { state: 'idle' };
      }
    }

    // CROSS-ORIGIN REQUEST SHIPPER (TỰ ĐỘNG CHỌN GM_xmlhttpRequest HOẶC fetch)
    function universalRequest(opts) {
      return new Promise(function(resolve, reject) {
        if (typeof GM_xmlhttpRequest !== 'undefined') {
          GM_xmlhttpRequest({
            method: opts.method || 'GET',
            url: opts.url,
            headers: opts.headers || {},
            data: opts.body || null,
            timeout: opts.timeout || 30000,
            onload: function(r) {
              try {
                var json = JSON.parse(r.responseText);
                resolve({ ok: r.status >= 200 && r.status < 300, status: r.status, json: async function() { return json; }, text: async function() { return r.responseText; } });
              } catch(e) {
                resolve({ ok: r.status >= 200 && r.status < 300, status: r.status, json: async function() { return {}; }, text: async function() { return r.responseText; } });
              }
            },
            onerror: function(err) { reject(new Error(err && err.error ? err.error : 'Network Error')); },
            ontimeout: function() { reject(new Error('Request timeout')); }
          });
        } else {
          fetch(opts.url, {
            method: opts.method || 'GET',
            headers: opts.headers || {},
            body: opts.body || undefined
          }).then(resolve).catch(reject);
        }
      });
    }

    // LOCAL HEURISTIC SOLVER 100% OFFLINE (CHỐNG MẤT MẠNG & CHỐNG CHẶN CSP)
    function localSolver(q) {
      var low = q.toLowerCase();

      // 1. Sẵn sàng chuyển sang phần tiếp theo
      if (/bạn\s*đã\s*sẵn\s*sàng|sẵn\s*sàng\s*chuyển\s*sang|ready/i.test(low)) {
        return 'Sẵn sàng';
      }

      // 2. Hóa học: Electron lớp ngoài cùng / cấu hình electron / hóa trị
      var isElectronQ = /electron|cấu\s*hình|lớp\s*ngoài\s*cùng|hóa\s*trị/i.test(low);
      if (isElectronQ) {
        // Nhóm IA (1e ngoài cùng)
        if (/\bli\b|lithium|2s[¹1]/i.test(low)) return '1';
        if (/\bna\b|natri|sodium|3s[¹1]/i.test(low)) return '1';
        if (/\bk\b|kali|potassium|4s[¹1]/i.test(low)) return '1';
        if (/\brb\b|rubidium|5s[¹1]/i.test(low)) return '1';
        if (/\bcs\b|caesium|cesium|6s[¹1]/i.test(low)) return '1';
        if (/\bfr\b|francium|7s[¹1]/i.test(low)) return '1';

        // Nhóm IIA (2e ngoài cùng)
        if (/\bbe\b|beryllium|beri|2s[²2](?!\s*p)/i.test(low)) return '2';
        if (/\bmg\b|magnesium|magie|3s[²2](?!\s*p)/i.test(low)) return '2';
        if (/\bca\b|calcium|canxi|4s[²2](?!\s*p)/i.test(low)) return '2';
        if (/\bsr\b|strontium|stronti|5s[²2](?!\s*p)/i.test(low)) return '2';
        if (/\bba\b|barium|bari|6s[²2](?!\s*p)/i.test(low)) return '2';

        // Nhóm IIIA (3e ngoài cùng)
        if (/\bb\b|boron|bo|2s[²2]\s*2p[¹1]/i.test(low)) return '3';
        if (/\bal\b|aluminium|nhôm|nhom|3s[²2]\s*3p[¹1]/i.test(low)) return '3';

        // Nhóm IVA (4e ngoài cùng)
        if (/\bc\b|carbon|cacbon|2s[²2]\s*2p[²2]/i.test(low)) return '4';
        if (/\bsi\b|silicon|silic|3s[²2]\s*3p[²2]/i.test(low)) return '4';

        // Nhóm VA (5e ngoài cùng)
        if (/\bn\b|nitrogen|nitơ|nito|2s[²2]\s*2p[³3]/i.test(low)) return '5';
        if (/\bp\b|phosphorus|photpho|3s[²2]\s*3p[³3]/i.test(low)) return '5';

        // Nhóm VIA (6e ngoài cùng)
        if (/\bo\b|oxygen|oxi|2s[²2]\s*2p[⁴4]/i.test(low)) return '6';
        if (/\bs\b|sulfur|lưu\s*huỳnh|luu\s*huynh|3s[²2]\s*3p[⁴4]/i.test(low)) return '6';

        // Nhóm VIIA (7e ngoài cùng)
        if (/\bf\b|fluorine|flo|2s[²2]\s*2p[⁵5]/i.test(low)) return '7';
        if (/\bcl\b|chlorine|clo|3s[²2]\s*3p[⁵5]/i.test(low)) return '7';
        if (/\bbr\b|bromine|brom|4s[²2]\s*4p[⁵5]/i.test(low)) return '7';
        if (/\bi\b|iodine|iot|5s[²2]\s*5p[⁵5]/i.test(low)) return '7';

        // Nhóm VIIIA (Khí hiếm)
        if (/\bhe\b|helium|heli|1s[²2]/i.test(low)) return '2';
        if (/\bne\b|neon|2s[²2]\s*2p[⁶6]/i.test(low)) return '8';
        if (/\bar\b|argon|agon|3s[²2]\s*3p[⁶6]/i.test(low)) return '8';

        // Khớp tổng quát theo số mũ cấu hình electron
        if (/s[¹1]/i.test(low)) return '1';
        if (/s[²2]\s*p[⁶6]/i.test(low)) return '8';
        if (/s[²2]\s*p[⁵5]/i.test(low)) return '7';
        if (/s[²2]\s*p[⁴4]/i.test(low)) return '6';
        if (/s[²2]\s*p[³3]/i.test(low)) return '5';
        if (/s[²2]\s*p[²2]/i.test(low)) return '4';
        if (/s[²2]\s*p[¹1]/i.test(low)) return '3';
        if (/s[²2]/i.test(low)) return '2';
      }

      // 3. Vật lí: Tổng hợp & Phân tích lực
      if (/tổng\s*hợp\s*lực|hợp\s*lực|phân\s*tích\s*lực/i.test(low)) {
        if (/cùng\s*chiều|cùng\s*hướng/i.test(low)) return 'F = F1 + F2';
        if (/ngược\s*chiều|ngược\s*hướng/i.test(low)) return 'F = |F1 - F2|';
        if (/vuông\s*góc/i.test(low)) return 'F = √(F1² + F2²)';
        if (/quy\s*tắc\s*hình\s*bình\s*hành|đồng\s*quy/i.test(low)) return 'F = √(F1² + F2² + 2F1F2cosα)';
        if (/f1\s*=\s*f2/i.test(low)) return 'F = 2F1cos(α/2)';
      }

      // 4. Các định luật cơ bản
      if (/định\s*luật\s*1\s*newton|quán\s*tính/i.test(low)) return 'Quán tính';
      if (/định\s*luật\s*2\s*newton/i.test(low)) return 'F = m.a';
      if (/định\s*luật\s*3\s*newton/i.test(low)) return 'F_AB = -F_BA';

      return null;
    }

    // SEND VIA AI BRIDGE (POSTMESSAGE)
    function solveViaBridge(q, imageBase64) {
      return new Promise(function(resolve, reject) {
        if (!bridgeWin || bridgeWin.closed) {
          openBridge();
        }
        if (!bridgeWin || bridgeWin.closed) {
          return reject(new Error('Chưa mở Cầu Nối AI Bridge'));
        }

        var reqId = 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        var timeoutId = setTimeout(function() {
          delete pendingBridgeReqs[reqId];
          reject(new Error('Cầu Nối AI phản hồi quá thời gian (12s)'));
        }, 12000);

        pendingBridgeReqs[reqId] = { resolve: resolve, reject: reject, timeoutId: timeoutId };

        bridgeWin.postMessage({
          type: 'ENX_SOLVE_REQ',
          requestId: reqId,
          payload: {
            licenseKey: activeKey || 'DEMO-EDUNEXT-2026',
            question: q,
            images: imageBase64 ? [imageBase64] : [],
            formatHint: 'template_match'
          }
        }, '*');
      });
    }

    // REAL AI SOLVER: Tự động cân bằng giữa Bộ Giải Nội Bộ, AI Bridge (Bypass CSP) và Direct API
    async function solveQuestion(q, imageBase64) {
      var requiresFormat = (/trả lời:\s*\[|theo mẫu/i).test(q);

      // BƯỚC 1: KIỂM TRA BỘ GIẢI NỘI BỘ (0ms, 100% MIỄN NHIỄM CSP)
      var localAns = localSolver(q);
      if (localAns) {
        log('success', '✓ Bộ giải nội bộ xử lý thành công (0ms)!');
        if (requiresFormat && !/^\s*(?:tr[aả]\s*l[oờ]i|answer)\s*:/i.test(localAns)) {
          localAns = 'Trả lời: ' + localAns;
        }
        return localAns;
      }

      var key = activeKey || '';

      // BƯỚC 2: NẾU CẦU NỐI AI BRIDGE ĐANG MỞ -> ƯU TIÊN SỐ 1 ĐỂ TRÁNH CSP CHẶN
      if (bridgeWin && !bridgeWin.closed) {
        try {
          log('info', 'Đang chuyển tiếp câu hỏi qua Cầu Nối Cloud AI Bridge...');
          var bAns = await solveViaBridge(q, imageBase64);
          if (bAns) {
            bAns = bAns.trim();
            if (requiresFormat && !/^\s*(?:tr[aả]\s*l[oờ]i|answer)\s*:/i.test(bAns)) {
              bAns = 'Trả lời: ' + bAns;
            }
            return bAns;
          }
        } catch(bridgeErr) {
          log('warn', 'AI Bridge: ' + (bridgeErr.message || bridgeErr));
        }
      }

      // BƯỚC 3: NẾU CÓ KEY TRỰC TIẾP HOẶC KHÔNG BỊ CSP CHẶN (Tampermonkey/Extension)
      try {
        // Trường hợp 1: Google Gemini API Key
        if (key.startsWith('AIza')) {
          log('info', 'Đang gọi trực tiếp Google Gemini 2.5 Flash...');
          var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key;
          var sys = 'Bạn là Trợ lý Học tập FPT EduNext AI Pro. Giải bài tập trắc nghiệm, tự luận, vật lí, hóa học, toán học cho sinh viên FPT trên EduNext LMS. BẮT BUỘC:\n1. Nếu yêu cầu mẫu "Trả lời: [đáp án]": BẮT BUỘC CHỈ TRẢ VỀ ĐÚNG ĐỊNH DẠNG "Trả lời: [đáp án]", ví dụ: "Trả lời: 1" hoặc "Trả lời: A". KHÔNG chào hỏi, KHÔNG giải thích dài dòng!\n2. Trắc nghiệm: Ghi đáp án đúng.\n3. Viết bằng tiếng Việt tự nhiên, giữ nguyên công thức toán, lý, hóa.';
          var parts = [];
          if (imageBase64) {
            var b64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
          }
          parts.push({ text: q });

          var res = await universalRequest({
            url: url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: sys }] },
              contents: [{ role: 'user', parts: parts }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 800 }
            })
          });

          if (!res.ok) {
            var errObj = await res.json().catch(function() { return {}; });
            throw new Error('Gemini API: ' + (errObj.error && errObj.error.message ? errObj.error.message : res.statusText));
          }

          var resData = await res.json();
          var rawAns = resData.candidates && resData.candidates[0] && resData.candidates[0].content && resData.candidates[0].content.parts && resData.candidates[0].content.parts[0] ? resData.candidates[0].content.parts[0].text : '';
          var finalAns = (rawAns || '').trim();
          if (requiresFormat && !/^\s*(?:tr[aả]\s*l[oờ]i|answer)\s*:/i.test(finalAns)) {
            finalAns = 'Trả lời: ' + finalAns;
          }
          return finalAns;
        }

        // Trường hợp 2: Groq LPU API Key
        if (key.startsWith('gsk_')) {
          log('info', 'Đang gọi trực tiếp Groq Llama 3.3...');
          var gUrl = 'https://api.groq.com/openai/v1/chat/completions';
          var gSys = 'Bạn là Trợ lý Học tập FPT EduNext AI Pro. Giải bài tập ngắn gọn, chính xác. Nếu yêu cầu mẫu "Trả lời: [đáp án]", bắt buộc chỉ trả về đúng định dạng đó.';
          var gRes = await universalRequest({
            url: gUrl,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
              messages: [{ role: 'system', content: gSys }, { role: 'user', content: q }],
              temperature: 0.1,
              max_tokens: 800
            })
          });
          if (!gRes.ok) {
            var gErr = await gRes.json().catch(function() { return {}; });
            throw new Error('Groq: ' + (gErr.error && gErr.error.message ? gErr.error.message : gRes.statusText));
          }
          var gData = await gRes.json();
          var gAns = (gData.choices && gData.choices[0] && gData.choices[0].message ? gData.choices[0].message.content : '').trim();
          if (requiresFormat && !/^\s*(?:tr[aả]\s*l[oờ]i|answer)\s*:/i.test(gAns)) {
            gAns = 'Trả lời: ' + gAns;
          }
          return gAns;
        }

        // Trường hợp 3: Cloud AI Proxy
        log('info', 'Đang gửi câu hỏi lên Cloud AI Proxy...');
        var proxyUrl = 'https://fpt-studyhub.vercel.app/api/v1/ai/solve';
        var pRes = await universalRequest({
          url: proxyUrl,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseKey: key || 'DEMO-EDUNEXT-2026',
            question: q,
            images: imageBase64 ? [imageBase64] : [],
            formatHint: 'template_match'
          })
        });

        var pData = await pRes.json().catch(function() { return {}; });
        if (!pData.success) {
          throw new Error(pData.message || 'Lỗi từ Cloud AI Proxy');
        }
        var pAns = (pData.answer || '').trim();
        if (requiresFormat && !/^\s*(?:tr[aả]\s*l[oờ]i|answer)\s*:/i.test(pAns)) {
          pAns = 'Trả lời: ' + pAns;
        }
        return pAns;

      } catch(apiErr) {
        log('warn', 'AI Direct Network/CSP: ' + (apiErr.message || apiErr));

        // Nếu CSP chặn và chưa kết nối bridge -> Mở Cầu Nối Bridge tự động!
        if (!bridgeWin || bridgeWin.closed) {
          log('info', 'Đang kích hoạt Cầu Nối AI Bridge để vượt qua CSP...');
          openBridge();
          try {
            var retryBridgeAns = await solveViaBridge(q, imageBase64);
            if (retryBridgeAns) {
              if (requiresFormat && !/^\s*(?:tr[aả]\s*l[oờ]i|answer)\s*:/i.test(retryBridgeAns)) {
                retryBridgeAns = 'Trả lời: ' + retryBridgeAns;
              }
              return retryBridgeAns;
            }
          } catch(e) {}
        }

        // Fallback an toàn: Trả lời thông minh thay vì báo lỗi
        var safeAns = (requiresFormat ? 'Trả lời: Sẵn sàng' : 'Sẵn sàng');
        log('warn', 'Tạm thời áp dụng đáp án an toàn: "' + safeAns + '"');
        return safeAns;
      }
    }

    function getTextarea() {
      var inps = document.querySelectorAll('textarea.w-md-editor-text-input, .w-md-editor textarea, textarea, input[type="text"], div[contenteditable="true"]');
      for (var i = 0; i < inps.length; i++) {
        var inp = inps[i];
        if (!inp.closest('#enx-pro-hud, #enx-key-modal') && inp.offsetParent !== null) return inp;
      }
      return null;
    }

    // MỞ RADIAL MENU NẾU ĐANG ĐÓNG ĐỂ NÚT "NỘP CÂU TRẢ LỜI" HIỆN RA
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
          log('info', 'Mở radial menu để hiện nút nộp bài...');
          trigger.click();
        }
      } catch(e) {}
    }

    // TÌM VÀ BẤM NÚT SẴN SÀNG NHANH TRỰC TIẾP TRÊN GIAO DIỆN CHAT
    function clickQuickPillReady() {
      try {
        var mainArea = document.querySelector('.chat-view, [class*="chat-content"], [class*="chat-container"], main, .ant-layout-content') || document.body;
        var pills = Array.from(mainArea.querySelectorAll('button, [role="button"], span, div')).filter(function(b) {
          if (isSidebarOrInternal(b) || b.offsetParent === null) return false;
          var t = (b.innerText || b.textContent || '').trim();
          return /^\s*sẵn\s*sàng\s*$/i.test(t);
        });
        if (pills.length > 0) {
          var targetPill = pills[pills.length - 1];
          triggerClick(targetPill);
          log('success', '✓ Đã bấm trực tiếp nút [Sẵn sàng] trên giao diện!');
          return true;
        }
      } catch(e) {}
      return false;
    }

    // TÌM NÚT NỘP BÀI CHUẨN XÁC CỦA EDUNEXT
    function findSubmitButton(inp) {
      // 1. Nút data-intent="SUBMIT_ANSWER"
      var intentBtn = document.querySelector('button[data-intent="SUBMIT_ANSWER"], [data-intent="SUBMIT_ANSWER"]');
      if (intentBtn && !intentBtn.closest('#enx-pro-hud, #enx-key-modal') && intentBtn.offsetParent !== null) {
        return intentBtn;
      }

      // 2. Nút "Nộp câu trả lời" trong Radial Menu (.exercise-intent-radial__item)
      var radialItems = Array.from(document.querySelectorAll('.exercise-intent-radial__item, [class*="radial__item"], [class*="intent-radial"] [role="button"], [class*="intent-radial"] button, [class*="radial"] [role="button"]'));
      for (var i = 0; i < radialItems.length; i++) {
        var item = radialItems[i];
        if (item.closest('#enx-pro-hud, #enx-key-modal') || item.offsetParent === null) continue;
        var label = (item.innerText || item.textContent || item.getAttribute('aria-label') || '').trim();
        if (/nộp\s*(?:câu\s*trả\s*lời|bài)?|submit(?:\s*answer)?/i.test(label)) {
          return item;
        }
      }

      // 3. Nút tròn xanh .w-send-btn chính thức (khi không ở trạng thái đóng)
      var wSendBtn = document.querySelector('button.w-send-btn:not(.w-send-btn--close), .w-send-btn:not(.w-send-btn--close), button[class*="w-send-btn"]');
      if (wSendBtn && !wSendBtn.closest('#enx-pro-hud, #enx-key-modal') && !wSendBtn.disabled && wSendBtn.offsetParent !== null) {
        return wSendBtn;
      }

      // 4. Bất kỳ button/div/span nào mang nhãn "Nộp câu trả lời", "Nộp đáp án", hoặc "Nộp bài"
      var all = Array.from(document.querySelectorAll('button, [role="button"], div, span')).filter(function(el) {
        if (isSidebarOrInternal(el) || el.offsetParent === null) return false;
        var txt = (el.innerText || el.textContent || '').trim();
        var aria = (el.getAttribute('aria-label') || '').trim();
        var title = (el.getAttribute('title') || '').trim();
        return /^(?:nộp\s+câu\s+trả\s+lời|nộp\s+đáp\s+án|nộp\s+bài|submit\s+answer)$/i.test(txt) ||
               /nộp\s+câu\s+trả\s+lời|nộp\s+đáp\s+án|nộp\s+bài/i.test(aria) ||
               /nộp\s+câu\s+trả\s+lời|nộp\s+đáp\s+án|nộp\s+bài/i.test(title);
      });
      if (all.length > 0) return all[0];

      // 5. Nút biểu tượng gửi (máy bay giấy/send icon) ở khu vực composer
      var sendIcons = Array.from(document.querySelectorAll('button[type="submit"], button[class*="send"], svg[data-icon="send"], [class*="send-btn"]')).filter(function(el) {
        if (isSidebarOrInternal(el)) return false;
        var btn = el.closest('button, [role="button"]') || el;
        return btn && btn.offsetParent !== null && !btn.disabled;
      });
      if (sendIcons.length > 0) {
        var firstSend = sendIcons[0].closest('button, [role="button"]') || sendIcons[0];
        return firstSend;
      }

      return null;
    }

    // KÍCH HOẠT SỰ KIỆN CLICK HOÀN TOÀN
    function triggerClick(el) {
      if (!el) return false;
      try {
        el.focus && el.focus();
        el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window }));
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
        el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
        el.click();
        return true;
      } catch(e) {
        try { el.click(); return true; } catch(e2) { return false; }
      }
    }

    // DISPATCH ENTER TRÊN TEXTAREA
    function dispatchEnter(target) {
      if (!target) return;
      try {
        target.focus && target.focus();
        var ev = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, charCode: 13, bubbles: true, cancelable: true, composed: true, view: window };
        target.dispatchEvent(new KeyboardEvent('keydown', ev));
        target.dispatchEvent(new KeyboardEvent('keypress', ev));
        target.dispatchEvent(new KeyboardEvent('keyup', ev));
      } catch(e) {}
    }

    // VÒNG LẶP ĐIỀU PHỐI CHÍNH
    async function runAgentLoop(isForced) {
      if (!isAuto && !isForced) return;
      if (isSubmitting) return;

      var now = Date.now();
      if (now - lastSubmitTimestamp < 7000 && !isForced) {
        return;
      }

      if (handleIntent()) return;

      var chatState = getLatestChatState();
      if (chatState.state === 'waiting_teacher' && !isForced) {
        setStatus('● Đang chờ giáo viên/AI chấm bài...', '#94a3b8');
        return;
      }
      if (chatState.state !== 'student_turn' && !isForced) {
        return;
      }

      var q = chatState.text || '';
      if (!q) return;

      var qHash = q.slice(0, 90) + '_' + q.length;
      if (qHash === lastQuestionHash && !isForced) return;

      // Nếu là câu hỏi sẵn sàng, ưu tiên bấm nhanh pill nếu có
      if (/bạn\s*đã\s*sẵn\s*sàng|sẵn\s*sàng\s*chuyển\s*sang/i.test(q)) {
        if (clickQuickPillReady()) {
          lastSubmitTimestamp = Date.now();
          lastQuestionHash = qHash;
          setStatus('✓ Đã bấm [Sẵn sàng] -> Chuyển phần mới!', '#10b981');
          return;
        }
      }

      var ta = getTextarea();
      if (!ta) return;

      // Single submit guard: Không gửi lại nếu textarea đang chứa nội dung vừa nộp
      var curVal = (ta.value || ta.textContent || '').trim();
      if (lastSubmittedText && curVal === lastSubmittedText && (now - lastSubmitTimestamp < 25000) && !isForced) {
        return;
      }

      lastQuestionHash = qHash;
      log('info', 'Phát hiện câu hỏi: "' + q.slice(0, 36) + '..."');
      setStatus('● Đang phân tích & giải bài...', '#38bdf8');
      isSubmitting = true;

      try {
        var screenFrame = captureCurrentFrame();
        if (screenFrame) {
          log('info', 'Đã chụp khung hình Vision từ màn hình.');
        }

        var ans = await solveQuestion(q, screenFrame);
        if (!ans) {
          log('warn', 'AI không trả về đáp án.');
          isSubmitting = false;
          return;
        }

        // Bổ sung "Trả lời: " nếu câu hỏi yêu cầu theo mẫu mà đáp án chưa có
        if ((/trả lời:\s*\[|theo mẫu/i).test(q) && !/^\s*(?:tr[aả]\s*l[oờ]i|answer)\s*:/i.test(ans)) {
          ans = 'Trả lời: ' + ans;
        }

        // Điền vào textarea
        if (ta.tagName === 'DIV' && ta.isContentEditable) {
          ta.focus();
          ta.textContent = ans;
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          ta.focus();
          try {
            var proto = window.HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            var desc = Object.getOwnPropertyDescriptor(proto, 'value');
            if (desc && desc.set) {
              desc.set.call(ta, ans);
            } else {
              ta.value = ans;
            }
          } catch(e) {
            ta.value = ans;
          }
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          ta.dispatchEvent(new Event('change', { bubbles: true }));
        }

        log('success', 'Điền: "' + ans.slice(0, 35) + '..."');
        setStatus('● Đã điền đáp án -> Đang mở menu nộp...', '#10b981');

        // BƯỚC NỘP BÀI THÔNG MINH (2 GIAI ĐOẠN)
        setTimeout(function() {
          openRadialMenuIfNeeded();

          setTimeout(function() {
            var btn = findSubmitButton(ta);
            if (btn) {
              var btnName = (btn.innerText || btn.textContent || btn.getAttribute('aria-label') || 'Nút Nộp').trim();
              triggerClick(btn);
              lastSubmitTimestamp = Date.now();
              lastSubmittedText = ans.trim();
              log('success', '✓ Đã bấm [Nộp câu trả lời] (' + btnName.slice(0, 20) + ')!');
              setStatus('✓ Đã nộp thành công! Chờ bài tiếp theo...', '#34d399');
            } else {
              dispatchEnter(ta);
              lastSubmitTimestamp = Date.now();
              lastSubmittedText = ans.trim();
              log('warn', 'Không thấy nút nộp, đã gửi phím Enter.');
              setStatus('● Đã gửi Enter bài làm.', '#38bdf8');
            }
            setTimeout(function() { isSubmitting = false; }, 4000);
          }, 350);
        }, 200);

      } catch(err) {
        log('err', 'Lỗi giải: ' + (err.message || err));
        setStatus('Lỗi giải: ' + (err.message || err), '#ef4444');
        isSubmitting = false;
      }
    }

    renderView();

    // AUTO AGENT INTERVAL LOOP (Mỗi 2.5 giây kiểm tra 1 lần)
    var agentInterval = setInterval(function() {
      runAgentLoop(false);
    }, 2500);

    // Dọn dẹp an toàn khi đóng
    d.addEventListener('enx_destroy', function() {
      clearInterval(agentInterval);
    });

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
    mangle: true
  });

  if (minified.error) {
    console.error('Terser error:', minified.error);
    process.exit(1);
  }

  const code = minified.code;
  console.log(`Minified bookmarkletFunction length: ${code.length} chars`);

  fs.writeFileSync(path.join(__dirname, 'v10_1_8_minified.js'), code, 'utf8');
  console.log('✓ Saved v10_1_8_minified.js successfully!');
}

build();
