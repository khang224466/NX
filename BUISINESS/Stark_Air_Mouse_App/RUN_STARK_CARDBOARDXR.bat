@echo off
title STARK CARDBOARDXR // WINDOWS SPATIAL COMPUTING SUITE v10.2.88 PRO
cd /d "%~dp0"
color 0B

echo ======================================================================
echo    STARK CARDBOARDXR PRO // WINDOWS NATIVE SPATIAL SUITE (v10.2.88)
echo    100%% Ranh tay (Hands-Free), AimHistory chong hut nut, Material 3
echo ======================================================================
echo.
echo    [1] (Khuyen dung) Chay qua cap USB Lightning iPhone (120 FPS sieu muot)
echo    [2] Chay truc tiep bang Webcam Laptop (Standalone OpenCV)
echo.
set "choice=1"
set /p "choice=Chon che do khoi chay [1 hoac 2, mac dinh la 1]: "

if "%choice%"=="2" (
    echo [*] Dang khoi chay che do Standalone Laptop Webcam...
    python stark_cardboard_xr.py
) else (
    echo [*] Dang khoi chay che do Tethered iPhone USB 120 FPS...
    python stark_tethered_bridge.py
)

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [!] Chuong trinh dung lai voi ma loi %errorlevel%.
    pause
)
