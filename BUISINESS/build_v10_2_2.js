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

    var CURRENT_VERSION = 'v10.2.2';
    var ENX_CIPHER_SALT = 'ENX_SEC_2026_FLASH_LITE';

    // GIẢI MÃ NỘI BỘ TRONG BỘ NHỚ (NGƯỜI DÙNG KHÔNG THỂ XEM RAW KEY)
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
        return raw.startsWith('AIza') ? raw : null;
      } catch(e) {
        return null;
      }
    }

    // State Variables
    var activeEncryptedKey = preKey || localStorage.getItem('enx_encrypted_ai_key') || localStorage.getItem('enx_license_key') || '';
    var isSubmitting = false;
    var lastSubmitTimestamp = 0;
    var lastSubmittedText = '';
    var lastProcessedHash = '';
    var isAuto = true;
    var rateLimitCooldownUntil = 0;

    // Vision Stream & 5s Auto-Vision Loop
    var visionScreenStream = null;
    var visionScreenVideo = null;
    var lastVisionShotTime = 0;

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
    bg.textContent = CURRENT_VERSION;
    t1.appendChild(bg);
    
    var t2 = document.createElement('div');
    t2.style.cssText = 'font-size:10px;color:#10b981;font-weight:600;';
    t2.textContent = 'Auto-Vision 5s • Gọi Trực Tiếp Gemini Studio';
    titles.appendChild(t1);
    titles.appendChild(t2);
    brand.appendChild(titles);
    hd.appendChild(brand);

    var cb = document.createElement('button');
    cb.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:2px 6px;line-height:1;';
    cb.textContent = '✕';
    cb.onclick = function() {
      if (visionScreenStream) {
        visionScreenStream.getTracks().forEach(function(t) { t.stop(); });
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

      var hasStream = visionScreenStream && visionScreenStream.getVideoTracks().some(function(t) { return t.readyState === 'live'; });
      var isKeyValid = !!decryptEncryptedKey(activeEncryptedKey);

      // BANNER 1: CẢNH BÁO BẮT BUỘC CHIA SẺ MÀN HÌNH NẾU CHƯA BẬT
      if (!hasStream) {
        var warnCard = document.createElement('div');
        warnCard.style.cssText = 'background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
        
        var warnTxt = document.createElement('div');
        warnTxt.style.cssText = 'color:#fca5a5;font-weight:700;margin-bottom:6px;';
        warnTxt.textContent = '📸 CẦN CHIA SẺ MÀN HÌNH ĐỂ BOT CHỤP ẢNH & GIẢI BÀI!';
        warnCard.appendChild(warnTxt);

        var startShareBtn = document.createElement('button');
        startShareBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#ef4444,#dc2626);border:none;color:#fff;font-weight:800;font-size:11px;padding:8px;border-radius:6px;cursor:pointer;box-shadow:0 4px 12px rgba(239,68,68,0.3);';
        startShareBtn.textContent = '👉 BẤM ĐÂY ĐỂ BẬT CHIA SẺ MÀN HÌNH (TAB EDUNEXT)';
        startShareBtn.onclick = function() { toggleScreenShare(); };
        warnCard.appendChild(startShareBtn);

        bodyBox.appendChild(warnCard);
      }

      // SECTION 1: KEY STATUS & CONFIG (BẢO MẬT BẰNG MÃ HÓA ENC_AI_...)
      var keyCard = document.createElement('div');
      keyCard.style.cssText = 'background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
      
      var keyRow = document.createElement('div');
      keyRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;';
      
      var keyLabel = document.createElement('div');
      keyLabel.style.cssText = 'color:' + (isKeyValid ? '#34d399' : '#f87171') + ';font-weight:700;';
      keyLabel.textContent = isKeyValid ? ('🔑 Key Mã Hóa: ' + activeEncryptedKey.slice(0, 14) + '... (✓ Hợp Lệ)') : '⚠️ Chưa có Key mã hóa (Cần nhập)';
      keyRow.appendChild(keyLabel);

      var keyBtn = document.createElement('button');
      keyBtn.style.cssText = 'background:none;border:none;color:#38bdf8;cursor:pointer;font-size:10px;text-decoration:underline;';
      keyBtn.textContent = isKeyValid ? 'Đổi Key' : 'Nhập Key Mã Hóa';
      keyBtn.onclick = function() { showKeyInputModal(); };
      keyRow.appendChild(keyBtn);
      keyCard.appendChild(keyRow);
      bodyBox.appendChild(keyCard);

      // SECTION 2: VISION STREAM STATUS
      var visionCard = document.createElement('div');
      visionCard.style.cssText = 'background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:8px 10px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;';
      
      var visionLeft = document.createElement('div');
      visionLeft.style.cssText = 'display:flex;align-items:center;gap:6px;';
      
      var vDot = document.createElement('span');
      vDot.id = 'vision-dot';
      vDot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:' + (hasStream ? '#10b981' : '#ef4444') + ';display:inline-block;';
      visionLeft.appendChild(vDot);

      var vText = document.createElement('span');
      vText.id = 'vision-text';
      vText.style.cssText = 'color:' + (hasStream ? '#34d399' : '#f87171') + ';font-weight:700;font-size:11px;';
      vText.textContent = hasStream ? 'Auto-Vision: Đang quét ảnh 5s' : 'Màn Hình: Chưa bật';
      visionLeft.appendChild(vText);
      visionCard.appendChild(visionLeft);

      var vBtn = document.createElement('button');
      vBtn.id = 'vision-btn';
      vBtn.style.cssText = 'background:' + (hasStream ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)') + ';border:1px solid ' + (hasStream ? '#ef4444' : '#10b981') + ';color:' + (hasStream ? '#f87171' : '#34d399') + ';padding:4px 8px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;';
      vBtn.textContent = hasStream ? '⏹ Dừng' : '📸 Chia Sẻ Màn Hình';
      vBtn.onclick = function() { toggleScreenShare(); };
      visionCard.appendChild(vBtn);
      bodyBox.appendChild(visionCard);

      // SECTION 3: ACTIONS
      var actRow = document.createElement('div');
      actRow.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;';

      var solveBtn = document.createElement('button');
      solveBtn.style.cssText = 'flex:1;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-weight:800;font-size:11px;padding:9px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(16,185,129,0.3);';
      solveBtn.textContent = '🎯 Chụp & Giải Câu Này Ngay';
      solveBtn.onclick = function() {
        if (!hasStream) {
          alert('Vui lòng bấm [📸 Chia Sẻ Màn Hình] để bot có thể chụp ảnh đề bài!');
          toggleScreenShare();
          return;
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

      // SECTION 4: STATUS
      var stTxt = document.createElement('div');
      stTxt.id = 'hud-status-text';
      stTxt.style.cssText = 'font-size:11px;color:#38bdf8;margin-bottom:6px;min-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;';
      stTxt.textContent = hasStream ? '● Đang lắng nghe & chụp ảnh đề bài...' : '⚠️ Chờ cấp quyền chia sẻ màn hình...';
      bodyBox.appendChild(stTxt);

      // SECTION 5: LOGS BOX
      var logsBox = document.createElement('div');
      logsBox.id = 'hud-logs-box';
      logsBox.style.cssText = 'background:#020617;border:1px solid #1e293b;border-radius:8px;height:95px;overflow-y:auto;padding:6px 8px;font-family:monospace;font-size:10px;line-height:1.45;color:#94a3b8;';
      bodyBox.appendChild(logsBox);

      log('success', 'EduNext AI Pro ' + CURRENT_VERSION + ' đã sẵn sàng!');
      if (isKeyValid) {
        log('info', 'Key hợp lệ (Gọi trực tiếp Google Gemini Flash-Lite)');
      } else {
        log('warn', 'Vui lòng nhập Key mã hóa (bắt đầu bằng ENC_AI_)');
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
      kt.textContent = '🔑 CẤU HÌNH KEY MÃ HÓA';
      kh.appendChild(kt);
      var kx = document.createElement('button');
      kx.style.cssText = 'background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;';
      kx.textContent = '✕';
      kx.onclick = function() { km.remove(); };
      kh.appendChild(kx);
      km.appendChild(kh);

      var desc = document.createElement('div');
      desc.style.cssText = 'font-size:11px;color:#94a3b8;margin-bottom:8px;line-height:1.4;';
      desc.textContent = 'Dán mã Key đã được chuyển đổi từ máy mã hóa (Bắt buộc bắt đầu bằng ENC_AI_).';
      km.appendChild(desc);

      var keyInp = document.createElement('input');
      keyInp.type = 'text';
      keyInp.value = activeEncryptedKey || '';
      keyInp.placeholder = 'Dán Key mã hóa (ENC_AI_...)';
      keyInp.style.cssText = 'width:100%;box-sizing:border-box;background:#020617;border:1px solid #334155;border-radius:8px;padding:8px 10px;color:#fff;font-family:monospace;font-size:11px;margin-bottom:10px;outline:none;';
      km.appendChild(keyInp);

      var saveBtn = document.createElement('button');
      saveBtn.textContent = '✓ LƯU & KÍCH HOẠT NGAY';
      saveBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#38bdf8,#0284c7);border:none;color:#fff;font-weight:800;font-size:11px;padding:9px;border-radius:8px;cursor:pointer;margin-bottom:12px;';
      saveBtn.onclick = function() {
        var val = (keyInp.value || '').trim();
        var dec = decryptEncryptedKey(val);
        if (!dec) {
          alert('❌ Key không hợp lệ! Vui lòng nhập Key đã được mã hóa (bắt đầu bằng ENC_AI_). Không hỗ trợ dán trực tiếp API key thô.');
          return;
        }
        activeEncryptedKey = val;
        localStorage.setItem('enx_encrypted_ai_key', val);
        alert('✓ Đã lưu và kích hoạt Key thành công!');
        km.remove();
        renderView();
        log('success', 'Đã nạp Key mã hóa thành công!');
      };
      km.appendChild(saveBtn);

      var infoBox = document.createElement('div');
      infoBox.style.cssText = 'background:#020617;border:1px solid #1e293b;border-radius:8px;padding:8px 10px;font-size:11px;line-height:1.5;color:#94a3b8;';
      
      var infoHd = document.createElement('div');
      infoHd.style.cssText = 'font-weight:700;color:#e2e8f0;margin-bottom:4px;';
      infoHd.textContent = '💳 HỖ TRỢ / MUA KEY BẢN QUYỀN:';
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
      } catch(err) {
        log('warn', 'Hủy chia sẻ màn hình: ' + (err.message || err));
      }
    }

    function capturePersistentVisionFrame() {
      if (!visionScreenVideo || !visionScreenVideo.videoWidth) return null;
      try {
        var canvas = document.createElement('canvas');
        var maxDim = 1600;
        var scale = Math.min(1, maxDim / Math.max(visionScreenVideo.videoWidth, visionScreenVideo.videoHeight));
        canvas.width = Math.max(1, Math.round(visionScreenVideo.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(visionScreenVideo.videoHeight * scale));
        var ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return null;
        ctx.drawImage(visionScreenVideo, 0, 0, canvas.width, canvas.height);
        var img = canvas.toDataURL('image/jpeg', 0.80);
        if (!img || img.length < 500) return null;
        return { image: img, width: canvas.width, height: canvas.height };
      } catch(e) {
        return null;
      }
    }

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

    function isSidebarOrInternal(el) {
      if (!el) return true;
      if (el.closest('#enx-pro-hud, #enx-key-modal, .course-lesson-list, [class*="lesson-list"], [class*="sidebar"], [class*="sider"], aside, nav, .ant-layout-sider, .chat-footer, [class*="toolbar"]')) {
        return true;
      }
      return false;
    }

    function hasExercise(text) {
      if (!text) return false;
      return /câu\s*hỏi|bài\s*sau|bài\s*tập|hóa\s*học|vật\s*lí|toán|tiếng\s*anh|nguyên\s*tử|electron|neutron|proton|bảng\s*\d|tính\s*toán|thực\s*hiện\s*phép\s*tính|hợp\s*lực|phân\s*tích\s*lực|orbital|li\s*2s|theo\s*mẫu|\?/i.test(text);
    }

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

      var anchors = [
        'Câu hỏi:',
        'câu hỏi:',
        'Trong các nguyên tử',
        'Thực hiện phép tính',
        'Tính toán số neutron',
        'Bạn hãy làm bài',
        'Theo Bảng',
        'theo bảng'
      ];

      var bestIdx = -1;
      for (var i = 0; i < anchors.length; i++) {
        var idx = fullTxt.lastIndexOf(anchors[i]);
        if (idx > bestIdx) {
          bestIdx = idx;
        }
      }

      if (bestIdx !== -1) {
        var rawSlice = fullTxt.slice(bestIdx, bestIdx + 750);
        var cleanQ = stripNoise(rawSlice);
        if (cleanQ.length >= 12) return cleanQ;
      }

      return '';
    }

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

    // GỌI TRỰC TIẾP GOOGLE GEMINI (FLASH-LITE / FLASH - KHÔNG CẦN QUA VERCEL)
    async function callDirectGeminiVision(rawKey, promptText, imageBase64) {
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
        var b64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
      }
      parts.push({ text: promptText });

      for (var m = 0; m < candidateModels.length; m++) {
        var model = candidateModels[m];
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
            var data = await res.json();
            var text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : '';
            if (text && text.trim()) {
              var cleanAns = text.replace(/```(?:markdown|json|text)?/gi, '').replace(/```/g, '').trim();
              cleanAns = cleanAns.replace(/^\*\*Trả lời:\*\*/i, 'Trả lời:').trim();
              log('success', '✓ Gemini (' + model + ') phản hồi thành công!');
              return cleanAns;
            }
          } else {
            var errBody = await res.text();
            log('warn', 'Model ' + model + ' (HTTP ' + res.status + '): ' + (errBody.slice(0, 70) || 'Lỗi'));
          }
        } catch(e) {
          log('warn', 'Lỗi gọi ' + model + ': ' + (e.message || e));
        }
      }
      return null;
    }

    // BỘ GIẢI CHÍNH
    async function solveQuestion(q, imageBase64) {
      var requiresFormat = (/trả lời:\s*\[|theo mẫu/i).test(q);
      var isExerciseQuestion = hasExercise(q);

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

      // TƯỜNG LỬA CHỐNG "SẴN SÀNG"
      if (isExerciseQuestion && /^\s*(?:trả\s*lời\s*:\s*)?(?:sẵn\s*sàng|ready)\s*[.!]?\s*$/i.test(ans)) {
        log('warn', '🛡️ Tường lửa: Bỏ qua "Sẵn sàng" do ảnh chứa bài tập!');
        return null;
      }

      if (requiresFormat && !/^\s*(?:tr[aả]\s*l[oờ]i|answer)\s*:/i.test(ans) && !ans.startsWith('__')) {
        ans = 'Trả lời: ' + ans;
      }

      return ans;
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
          log('info', 'Mở radial menu để hiện nút nộp bài...');
          trigger.click();
        }
      } catch(e) {}
    }

    function findSubmitButton(inp) {
      var intentBtn = document.querySelector('button[data-intent="SUBMIT_ANSWER"], [data-intent="SUBMIT_ANSWER"]');
      if (intentBtn && !intentBtn.closest('#enx-pro-hud, #enx-key-modal') && intentBtn.offsetParent !== null) {
        return intentBtn;
      }

      var radialItems = Array.from(document.querySelectorAll('.exercise-intent-radial__item, [class*="radial__item"], [class*="intent-radial"] [role="button"], [class*="intent-radial"] button, [class*="radial"] [role="button"]'));
      for (var i = 0; i < radialItems.length; i++) {
        var item = radialItems[i];
        if (item.closest('#enx-pro-hud, #enx-key-modal') || item.offsetParent === null) continue;
        var label = (item.innerText || item.textContent || item.getAttribute('aria-label') || '').trim();
        if (/nộp\s*(?:câu\s*trả\s*lời|bài)?|submit(?:\s*answer)?/i.test(label)) {
          return item;
        }
      }

      var wSendBtn = document.querySelector('button.w-send-btn:not(.w-send-btn--close), .w-send-btn:not(.w-send-btn--close), button[class*="w-send-btn"]');
      if (wSendBtn && !wSendBtn.closest('#enx-pro-hud, #enx-key-modal') && !wSendBtn.disabled && wSendBtn.offsetParent !== null) {
        return wSendBtn;
      }

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

      return null;
    }

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

    async function submitAnswerToEduNext(ans) {
      if (!ans || isSubmitting) return false;
      var clean = ans.trim();

      var mainArea = document.querySelector('.chat-view, [class*="chat-content"], [class*="chat-container"], main, .ant-layout-content') || document.body;
      var currentDomText = (mainArea.innerText || '').trim();
      var isReadyAttempt = /^\s*(?:trả\s*lời\s*:\s*)?(?:sẵn\s*sàng|ready)\s*[.!]?\s*$/i.test(clean);
      if (isReadyAttempt && hasExercise(currentDomText)) {
        log('warn', '🛡️ CHẶN TUYỆT ĐỐI: Không gửi "Sẵn sàng" khi giao diện có bài tập!');
        return false;
      }

      var ta = getTextarea();
      if (!ta) {
        log('warn', 'Không tìm thấy ô nhập câu trả lời!');
        return false;
      }

      isSubmitting = true;
      try {
        if (ta.tagName === 'DIV' && ta.isContentEditable) {
          ta.focus();
          ta.textContent = clean;
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
          ta.focus();
          try {
            var proto = window.HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            var desc = Object.getOwnPropertyDescriptor(proto, 'value');
            if (desc && desc.set) {
              desc.set.call(ta, clean);
            } else {
              ta.value = clean;
            }
          } catch(e) {
            ta.value = clean;
          }
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          ta.dispatchEvent(new Event('change', { bubbles: true }));
        }

        log('success', 'Điền đáp án: "' + clean.slice(0, 35) + '..."');
        setStatus('● Đã điền đáp án -> Đang mở menu nộp...', '#10b981');

        await new Promise(function(resolve) { setTimeout(resolve, 250); });
        openRadialMenuIfNeeded();

        await new Promise(function(resolve) { setTimeout(resolve, 350); });
        var btn = findSubmitButton(ta);
        if (btn) {
          var btnName = (btn.innerText || btn.textContent || btn.getAttribute('aria-label') || 'Nút Nộp').trim();
          triggerClick(btn);
          lastSubmitTimestamp = Date.now();
          lastSubmittedText = clean;
          log('success', '✓ Đã bấm [Nộp câu trả lời] (' + btnName.slice(0, 20) + ')!');
          setStatus('✓ Đã nộp thành công! Chờ bài tiếp theo...', '#34d399');
        } else {
          dispatchEnter(ta);
          lastSubmitTimestamp = Date.now();
          lastSubmittedText = clean;
          log('warn', 'Không thấy nút nộp, đã gửi phím Enter.');
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

    async function runAgentLoop(isForced) {
      if (!isAuto && !isForced) return;
      if (isSubmitting) return;

      var now = Date.now();

      if (now < rateLimitCooldownUntil && !isForced) {
        setStatus('⚠️ Đang hoãn chờ rate-limit phục hồi...', '#f59e0b');
        return;
      }

      if (now - lastSubmitTimestamp < 5500 && !isForced) {
        return;
      }

      if (handleIntent()) return;

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
          log('info', '📸 Quét ảnh màn hình 5s (' + shot.width + 'x' + shot.height + ')...');
          setStatus('● Gemini Flash-Lite đang giải bài từ ảnh...', '#38bdf8');

          var visionPrompt = [
            'Dùng ảnh màn hình mới nhất để nhận diện và giải quyết bài tập trên EduNext.',
            latestText ? ('NỘI DUNG VĂN BẢN TRÊN KHUNG CHAT:\n' + latestText) : '',
            'QUY TẮC BẮT BUỘC:',
            '1. Nếu ảnh cho thấy buổi học ĐÃ KẾT THÚC hoặc có lời chúc mừng hoàn thành bài học, CHỈ XUẤT ĐÚNG MÃ: __LESSON_COMPLETE__',
            '2. Nếu ảnh có câu hỏi xác nhận "Bạn đã sẵn sàng chuyển sang phần tiếp theo chưa?", CHỈ XUẤT ĐÚNG: Sẵn sàng',
            '3. Nếu ảnh có CÂU HỎI / BÀI TẬP MỚI cần học sinh trả lời (bài tập hóa học, vật lý, toán, tiếng Anh, trắc nghiệm hoặc tự luận điền vào ô trống):',
            '   - Hãy giải câu hỏi đó và xuất ĐÚNG ĐÁP ÁN theo định dạng trong ảnh.',
            '   - Trả lời ngắn gọn, trực tiếp theo mẫu đề, không giải thích dài dòng.',
            '   - Tuyệt đối KHÔNG trả lời "Sẵn sàng" khi có câu hỏi bài tập.',
            '4. Nếu ảnh KHÔNG CÓ CÂU HỎI MỚI cần trả lời (chỉ là màn hình chờ, đang phân tích, bài giảng lý thuyết đang đọc, hoặc câu trả lời vừa gửi đang chờ chấm), CHỈ XUẤT ĐÚNG MÃ: __NO_QUESTION__'
          ].filter(Boolean).join('\n\n');

          try {
            var vAns = await solveQuestion(visionPrompt, shot.image);
            if (!vAns) {
              setStatus('idle');
              return;
            }

            if (/_{0,2}\s*LESSON_COMPLETE\s*_{0,2}/i.test(vAns)) {
              log('success', '🎉 Đã hoàn thành toàn bộ bài học!');
              setStatus('🎉 Đã hoàn thành toàn bộ bài học!', '#10b981');
              isAuto = false;
              var ab = document.getElementById('hud-auto-btn');
              if (ab) { ab.textContent = '⏸ Auto: TẮT'; ab.style.background = 'rgba(100,116,139,0.2)'; }
              return;
            }

            if (/_{0,2}\s*NO_QUESTION\s*_{0,2}/i.test(vAns)) {
              setStatus('● Chưa có câu hỏi mới; quét tiếp sau 5s...', '#94a3b8');
              return;
            }

            if (lastSubmittedText && vAns.trim() === lastSubmittedText.trim() && (now - lastSubmitTimestamp < 25000) && !isForced) {
              setStatus('● Đáp án khớp câu vừa nộp, đang chờ bài chấm...', '#94a3b8');
              return;
            }

            await submitAnswerToEduNext(vAns);
            return;
          } catch(vErr) {
            log('warn', 'Lỗi Gemini: ' + (vErr.message || vErr));
            return;
          }
        }
      }

      if (!hasLiveVision && isForced) {
        alert('⚠️ Vui lòng bấm [📸 Chia Sẻ Màn Hình] để bot có thể chụp ảnh giải bài!');
        toggleScreenShare();
      }
    }

    renderView();

    var agentInterval = setInterval(function() {
      runAgentLoop(false);
    }, 2000);

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

  fs.writeFileSync(path.join(__dirname, 'v10_2_2_minified.js'), singleLine, 'utf8');
  console.log('Saved v10_2_2_minified.js');
}

build();
