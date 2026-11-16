@echo off
title STARK CARDBOARDXR // TETHERED NATIVE USB XR SUITE (120 FPS PRO)
cd /d "%~dp0"
color 0A

echo ======================================================================
echo    STARK CARDBOARDXR // TETHERED NATIVE USB XR SUITE (v10.2.88 PRO)
echo    Ket noi sieu toc qua cap USB Lightning iPhone (Do tre ~8-12ms)
echo ======================================================================
echo.
echo [*] HUONG DAN VAN HANH TRANH LAG & DIEU KHIEN RANH TAY:
echo    1. Cam cap USB Lightning tu iPhone vao Laptop (tin cay may tinh).
echo    2. Mo app STARK Cam tren iPhone -> Chon ket noi qua USB.
echo    3. XOE LONG BAN TAY truoc camera (0.2s) de hien nut [MENU / CHUM DE MO].
echo    4. CHUM NGON TAY (Pinch) de mo thanh Menu Material 3 va chon app.
echo    5. Nut [1-SCR / SBS VR] tren thanh Menu de doi 1 man hinh hoac kinh 3D.
echo.
echo [*] DANG KHOI CHAY CAY CAU TOI UU 2 LUONG BAT DONG BO...
echo ======================================================================
echo.

python stark_tethered_bridge.py

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [!] Chuong trinh dung lai voi ma loi %errorlevel%.
    pause
)
