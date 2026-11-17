@echo off
chcp 65001 >nul
title CARDBOARDXR UNITY IOS -> BOOST LEN IPHONE (CLOUD IPA BUILDER)
color 0D

set "REPO=khang224466/NX"
set "WF=build_cardboardxr_ipa.yml"
set "OUT_DIR=%~dp0Builds_IPA"

cls
echo ===============================================================================
echo   CARDBOARDXR UNITY 6000.6.8f1 -> CHUAN BI BOOST LEN IPHONE (.IPA)
echo ===============================================================================
echo  Repo: %REPO%
echo  Workflow: .github/workflows/%WF%
echo  Project: BUISINESS/CardboardXR/CardboardXR-main
echo.

where gh >nul 2>&1
if errorlevel 1 (
  echo [LOI] Khong tim thay GitHub CLI (gh). Hay cai GitHub CLI truoc!
  pause
  exit /b 1
)

echo [1/4] Kiem tra Unity License Secret (UNITY_LICENSE / UNITY_SERIAL)...
gh secret list -R %REPO% | findstr /I "UNITY_LICENSE UNITY_SERIAL" >nul
if errorlevel 1 (
  echo.
  echo [CAN 1 BUOC DUY NHAT] Repo %REPO% chua co GitHub Secret "UNITY_LICENSE" !
  echo Vi Windows khong co Xcode / macOS, Unity + Xcode build chay tren GitHub Cloud.
  echo.
  echo Cach lay UNITY_LICENSE mien phi (Unity Personal .ulf) hoac nhanh nhat:
  echo   1. Mo Unity Hub tren may bat ky, hoac dung game-ci activation workflow
  echo   2. Vao https://github.com/%REPO%/settings/secrets/actions
  echo   3. Tao Secret ten: UNITY_LICENSE (dan noi dung file Unity_v6000.x.ulf)
  echo      (hoac UNITY_SERIAL + UNITY_EMAIL + UNITY_PASSWORD neu dung Pro key)
  echo.
  echo Sau khi add Secret xong, chay lai file .bat nay de auto build ^& tai CardboardXR.ipa!
  echo.
  set /p openWeb="Ban co muon mo trang Settings > Secrets tren trinh duyet ngay khong? [Y/N]: "
  if /I "%openWeb%"=="Y" start "" "https://github.com/%REPO%/settings/secrets/actions"
  pause
  exit /b 0
)

echo [2/4] Kich hoat Cloud Build Workflow (%WF%)...
gh workflow run %WF% -R %REPO%
if errorlevel 1 (
  echo [LOI] Khong kich hoat duoc workflow. Kiem tra quyen gh auth status!
  pause
  exit /b 1
)

echo [*] Cho 5 giay de GitHub Actions tao Run moi...
timeout /t 5 >nul

for /f "delims=" %%i in ('gh run list -R %REPO% -w %WF% -L 1 --json databaseId --jq ".[0].databaseId"') do set "RUN_ID=%%i"
if "%RUN_ID%"=="" (
  echo [LOI] Khong lay duoc Run ID!
  pause
  exit /b 1
)

echo [3/4] Dang theo doi qua trinh Unity Export Xcode + MacOS xcodebuild IPA (Run %RUN_ID%)...
gh run watch %RUN_ID% -R %REPO% --exit-status
if errorlevel 1 (
  echo [LOI] Build that bai! Xem log chi tiet: gh run view %RUN_ID% -R %REPO% --log-failed
  pause
  exit /b 1
)

echo [4/4] Tai file CardboardXR.ipa ve may...
if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"
gh run download %RUN_ID% -R %REPO% -n CardboardXR_iOS_IPA -D "%OUT_DIR%"
echo.
echo ===============================================================================
echo  [HOAN TAT] Da tai xong file IPA tai:
echo  %OUT_DIR%\CardboardXR.ipa
echo.
echo  HUONG DAN BOOST LEN IPHONE:
echo   1. Cam cap USB iPhone vao Laptop.
echo   2. Mo Sideloadly -> Keo tha CardboardXR.ipa vao -> Nhap Apple ID -> Start!
echo   3. Tren iPhone: Cai dat ^> Cai dat chung ^> Quan ly VPN ^& Thiet bi ^> Tin cay.
echo ===============================================================================
start "" explorer "%OUT_DIR%"
pause
