@echo off
chcp 65001 > nul
title STARK XR // TETHERED NATIVE IPHONE 13 USB BRIDGE

echo ======================================================================
echo       STARK CARDBOARDXR PRO // NATIVE IPHONE 13 USB WIRED XR
echo ======================================================================
echo  - Che do: Truyen dan truc tiep qua day cap Lightning (usbmuxd 480Mbps)
echo  - Do phan giai: 1080p HD / 4K UHD @ 60-120 FPS
echo  - AI: MediaPipe 21 khop tay + 1-Euro Filter tren RTX 4060 GPU
echo  - Output: Stereo SBS ban nguoc ve man hinh iPhone (Kinh Shinecon G10)
echo ======================================================================
echo.

cd /d "d:\BUISINESS\Stark_Air_Mouse_App"
python stark_tethered_bridge.py

pause
