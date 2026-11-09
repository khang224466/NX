const fs = require('fs');
const path = require('path');

let code = fs.readFileSync(path.join(__dirname, 'build_v10_2_5.js'), 'utf8');

// 1. Bump version to v10.2.6
code = code.replace(/v10\.2\.5/g, 'v10.2.6');

// 2. Change the Bookmarklet warning to positive Zero-Install status
const oldBanner = `      // BANNER 0: HỖ TRỢ VƯỢT CSP CHO BOOKMARKLET BẰNG AI BRIDGE
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

const newBanner = `      // BANNER 0: CHẾ ĐỘ BOOKMARKLET ZERO-INSTALL (KHÔNG CẦN CÀI SCRIPT)
      if (!hasTmGmx) {
        var tmWarn = document.createElement('div');
        var isBridgeOpen = bridgeWin && !bridgeWin.closed;
        tmWarn.style.cssText = 'background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);border-radius:10px;padding:8px 10px;margin-bottom:8px;font-size:11px;';
        
        var twTitle = document.createElement('div');
        twTitle.style.cssText = 'color:#34d399;font-weight:800;margin-bottom:4px;display:flex;align-items:center;justify-content:space-between;';
        twTitle.innerHTML = '<span>⚡ CHẾ ĐỘ BOOKMARKLET 100%</span><span style=\"font-size:10px;padding:1px 5px;border-radius:4px;background:' + (isBridgeOpen ? 'rgba(16,185,129,0.25)' : 'rgba(234,179,8,0.25)') + ';color:' + (isBridgeOpen ? '#34d399' : '#fde047') + ';\">' + (isBridgeOpen ? '🟢 Đã kết nối Cầu Nối AI' : '⚠️ Cần mở Cầu Nối AI') + '</span>';
        tmWarn.appendChild(twTitle);

        var twDesc = document.createElement('div');
        twDesc.style.cssText = 'color:#cbd5e1;font-size:10px;line-height:1.4;margin-bottom:6px;';
        twDesc.textContent = isBridgeOpen ? 'Cầu Nối AI đang hoạt động song song để bypass CSP. Bạn không cần cài bất kỳ tiện ích hay script nào!' : 'Bấm nút dưới để mở Cầu Nối AI vượt CSP Cloudflare (Không cần cài đặt script).';
        tmWarn.appendChild(twDesc);

        var openBrBtn = document.createElement('button');
        openBrBtn.style.cssText = 'width:100%;background:linear-gradient(135deg,#10b981,#059669);border:none;color:#fff;font-weight:800;font-size:11px;padding:7px;border-radius:6px;cursor:pointer;box-shadow:0 4px 12px rgba(16,185,129,0.3);';
        openBrBtn.textContent = isBridgeOpen ? '✓ CẦU NỐI AI ĐANG MỞ (BẤM ĐỂ XEM)' : '🌐 BẤM ĐÂY ĐỂ MỞ CẦU NỐI AI (VƯỢT CSP NGAY)';
        openBrBtn.onclick = function() { 
          openBridgeWindow(); 
          renderView();
        };
        tmWarn.appendChild(openBrBtn);
        bodyBox.appendChild(tmWarn);
      }`;

code = code.replace(oldBanner, newBanner);

// 3. Auto-open Bridge on Bookmarklet start if not already open
code = code.replace(
  'renderView();\n    var autoLoopTimer = setInterval(function() { triggerSolveRoutine(false); }, 2000);',
  `renderView();
    // Tự động kích hoạt Cầu Nối AI ngay khi bấm Bookmarklet (User gesture)
    if (!hasTmGmx && (!bridgeWin || bridgeWin.closed)) {
      try { openBridgeWindow(); } catch(e) {}
    }
    var autoLoopTimer = setInterval(function() { triggerSolveRoutine(false); }, 2000);`
);

// 4. Update output filename
code = code.replace(/v10_2_5_minified\.js/g, 'v10_2_6_minified.js');

fs.writeFileSync(path.join(__dirname, 'build_v10_2_6.js'), code, 'utf8');
console.log('✓ Successfully generated build_v10_2_6.js');
