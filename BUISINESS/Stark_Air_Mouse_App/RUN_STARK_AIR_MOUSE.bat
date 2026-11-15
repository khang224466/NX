@echo off
setlocal
title STARK AIR MOUSE v9.7.3 PRO - SPATIAL COMPUTING SUITE
color 0B
echo ======================================================================
echo    STARK AIR MOUSE // SPATIAL COMPUTING SUITE v9.7.3 PRO
echo    PERFORMANCE & MEMORY OPTIMIZED // KINEMATICS & ZERO-LAG PRECISION
echo ======================================================================
echo.

:: 1. Kiem tra moi truong Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [!] LOI NGHIEP TRONG: May tinh cua ban chua cai dat Python hoac chua them vao PATH!
    echo     Vui long cai dat Python 3.10+ tu https://www.python.org/
    pause
    exit /b 1
)

:: Web Bridge chi can Python standard library. Chi cai AI cho che do Native.

:: 3. Kiem tra model AI MediaPipe
if not exist "%~dp0hand_landmarker.task" (
    color 0E
    echo [!] CANH BAO: Khong tim thay file model hand_landmarker.task tai thu muc hien tai!
    echo     Ban co the gap loi khi khoi chay che do Python Native.
    echo.
)

echo.
echo [*] HE THONG SPATIAL COMPUTING v9.7.3 PRO - TINH NANG DOT PHA:
echo    - DIRECT FINGERTIP STEERING: Dao ham duong (+0.70) vay ngon tay tro la chuot bay
echo    - DESKTOP CURSOR HALO   : Vong ngam HUD trong suot xuyen thau (WS_EX_TRANSPARENT)
echo    - CACHED DOM SNAPPING   : Bo dem toa do nut bam triet tieu Layout Thrashing
echo    - UNCHOKED PRE-PINCH    : Chi ham khi sap cham (3.8cm), giu nguyen toc do luot
echo    - ZERO STICTION TRAP    : Ma sat vi mo 0.0px + lo xo 85Hz muot ma tung pixel
echo    - GATED PINCH IN REST   : Nhac chuot dua tay ve giua ban khong bi click nham
echo    - FAST BLOCK XOR DECODE : Giai ma frame WebSocket bang so nguyen lon sieu toc
echo    - ZERO WEBCAM CONFLICT  : Bo dieu phoi thong minh triet tieu 100%% tranh chap camera
echo ======================================================================
echo.
echo    [1] (Khuyen dung) Khoi dong Web Studio + Desktop Bridge (Sieu Muot 60-120 FPS)
echo    [2] Khoi dong Python Native Desktop Suite (Truc tiep OpenCV + Desktop Halo)
echo    [3] Thoat
echo.
set "opt=1"
set /p "opt=Chon che do khoi dong [1, 2 hoac 3, mac dinh la 1]: "

if "%opt%"=="2" goto run_python
if "%opt%"=="3" exit /b 0

:run_web
set "STARK_WEB_URL="
for /f "usebackq delims=" %%U in (`python "%~dp0stark_bridge.py" --print-web-url`) do set "STARK_WEB_URL=%%U"
if not defined STARK_WEB_URL (
    echo [!] Khong the tao ket noi an toan. Kiem tra stark_config.json va quyen ghi thu muc.
    pause
    exit /b 1
)
echo.
echo [*] Dang mo STARK Web Studio o che do App chong bop FPS nen...

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --app="%STARK_WEB_URL%"
    goto start_bridge
)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --app="%STARK_WEB_URL%"
    goto start_bridge
)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --app="%STARK_WEB_URL%"
    goto start_bridge
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --app="%STARK_WEB_URL%"
    goto start_bridge
)

start "" "%STARK_WEB_URL%"

:start_bridge
echo [*] Kiem tra cong WebSocket 8765...
netstat -ano | findstr ":8765 " | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [*] Cong 8765 da dang lang nghe boi tien trinh Bridge hien co.
    echo     Ban co the su dung ngay tren Web Studio!
    pause
    exit /b 0
)

echo [*] Dang kich hoat Desktop Bridge ws://127.0.0.1:8765 (Kem Desktop Cursor Halo)...
python "%~dp0stark_bridge.py"
goto end

:run_python
echo [*] Kiem tra cac thu vien AI...
python -c "import cv2, mediapipe, numpy" >nul 2>&1
if %errorlevel% neq 0 (
    python -m pip install --user opencv-python mediapipe numpy
    if errorlevel 1 (
        echo [!] Cai dat thu vien that bai.
        pause
        exit /b 1
    )
)
echo.
echo [*] Dang khoi dong STARK Python Native Suite v9.7.3 PRO...
python "%~dp0stark_air_mouse.py"
goto end

:end
pause
