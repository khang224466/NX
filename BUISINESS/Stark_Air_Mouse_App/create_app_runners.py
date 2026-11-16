import os

desktop_dir = r"C:\Users\LEGION\Desktop\stark mark ILX"

apps = [
    ("1", "[APP_1]_CHAY_PAINT_3D.bat", "PAINT 3D (Ve Neon Khong Gian)"),
    ("2", "[APP_2]_CHAY_AR_PORTAL.bat", "AR SPATIAL PORTAL (Canh Cua Khong-Thoi Gian)"),
    ("3", "[APP_3]_CHAY_ORB_RUSH.bat", "ORB RUSH (Game Chem Bong Nhip Dieu)"),
    ("4", "[APP_4]_CHAY_CUBES_PHYSICS.bat", "CUBES PHYSICS SANDBOX (Gap Nem Khoi Hop 3D)"),
    ("5", "[APP_5]_CHAY_3D_CALIPER.bat", "PRECISION 3D CALIPER (Thuoc Kep Do Milimet)"),
    ("6", "[APP_6]_CHAY_SPATIAL_UNIVERSE_3D.bat", "SPATIAL 3D UNIVERSE (Mo Phong Vu Tru & Quy Dao)"),
    ("7", "[APP_7]_CHAY_VIDEO_VR_360.bat", "VIDEO VR 360 & VR180 SBS (Rap Chieu Phim 3D)")
]

for demo_id, fname, title in apps:
    bat_content = f"""@echo off
title STARK MARK ILX // {title}
cd /d "%~dp0Stark_Air_Mouse_App"
color 0A

echo ======================================================================
echo    STARK MARK ILX // KHOI DONG TRUC TIEP: {title}
echo ======================================================================
echo.
echo [*] Khoi chay truc tiep Ung dung {demo_id} (Khuyen dung qua cap USB iPhone)...
echo.

python stark_tethered_bridge.py --demo {demo_id}

if %errorlevel% neq 0 (
    echo.
    echo [*] Phat hien bridge khong ket noi iPhone, tu dong fallback sang Webcam Laptop...
    python stark_cardboard_xr.py --demo {demo_id}
)

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [!] Chuong trinh dung lai voi ma loi %errorlevel%.
    pause
)
"""
    p = os.path.join(desktop_dir, fname)
    with open(p, "w", encoding="utf-8") as f:
        f.write(bat_content)
    print("Created:", fname)

print("SUCCESS: 7 App Runners Created!")
