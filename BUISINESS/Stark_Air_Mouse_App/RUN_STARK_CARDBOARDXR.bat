@echo off
title STARK CARDBOARDXR // WINDOWS SPATIAL COMPUTING SUITE v9.8.0 PRO
cd /d "%~dp0"

echo ======================================================================
echo    STARK CARDBOARDXR PRO // WINDOWS NATIVE SPATIAL SUITE
echo    Running directly on Windows 11 with NVIDIA RTX 4060 GPU
echo ======================================================================
echo.
echo    [1] 3D Air Paint (Tilt Brush in Space)
echo    [2] AR Spatial Portal (Cyberpunk Doorway)
echo    [3] Orb Rush Rhythm Game (Hand Collision Beat Saber)
echo    [4] 3D Cube Physics (Ray & Pinch Grab & Throw)
echo    [5] Precision 3D Caliper (mm/cm Measurement)
echo    [X] Switch Camera Input (Toggle Laptop Webcam / iPhone USB Passthrough)
    [V] Toggle Stereo VR SBS Mode (Shinecon G10)
echo    [C] Clear 3D Canvas
echo    [Z] Undo 3D Stroke
echo    [N] Next Color
echo.
echo Starting Engine...
python stark_cardboard_xr.py
pause
