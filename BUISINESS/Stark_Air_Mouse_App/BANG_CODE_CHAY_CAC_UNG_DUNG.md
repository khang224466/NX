# BẢNG CODE ĐỂ CHẠY CÁC ỨNG DỤNG KHÔNG GIAN // STARK MARK ILX

> **Mục đích**: Bảng mã lệnh Terminal / PowerShell / CMD và File 1-Click dùng để **chạy trực tiếp từng ứng dụng cụ thể** (Paint 3D, Portal, Orb Rush, Cubes Physics, Caliper 3D, Spatial 3D Universe, Video VR 360/180) mà không cần phải vào menu chính để bấm chuyển.
> **Thư mục làm việc**: `C:\Users\LEGION\Desktop\stark mark ILX\Stark_Air_Mouse_App`  
> **Phiên bản Engine**: `v10.2.95 PRO`

---

## 1. BẢNG CODE CHẠY TRỰC TIẾP TỪNG ỨNG DỤNG (CODE COMMAND MATRIX)

| STT | Ứng Dụng Không Gian | Code Chạy Qua Cáp USB iPhone (120 FPS) | Code Chạy Qua Webcam Laptop | Phím Tắt Runtime | File 1-Click Ngoài Desktop |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1** | **PAINT 3D**<br>*(Vẽ neon 3D trên không)* | `python stark_tethered_bridge.py --demo 1` | `python stark_cardboard_xr.py --demo 1` | **`1`** | `[APP_1]_CHAY_PAINT_3D.bat` |
| **2** | **AR PORTAL**<br>*(Cửa không-thời gian)* | `python stark_tethered_bridge.py --demo 2` | `python stark_cardboard_xr.py --demo 2` | **`2`** | `[APP_2]_CHAY_AR_PORTAL.bat` |
| **3** | **ORB RUSH**<br>*(Game đập bóng nhịp điệu)* | `python stark_tethered_bridge.py --demo 3` | `python stark_cardboard_xr.py --demo 3` | **`3`** | `[APP_3]_CHAY_ORB_RUSH.bat` |
| **4** | **CUBES PHYSICS**<br>*(Gắp ném khối hộp 3D)* | `python stark_tethered_bridge.py --demo 4` | `python stark_cardboard_xr.py --demo 4` | **`4`** | `[APP_4]_CHAY_CUBES_PHYSICS.bat` |
| **5** | **3D CALIPER**<br>*(Thước kẹp đo milimet)* | `python stark_tethered_bridge.py --demo 5` | `python stark_cardboard_xr.py --demo 5` | **`5`** | `[APP_5]_CHAY_3D_CALIPER.bat` |
| **6** | **SPATIAL 3D**<br>*(Mô phỏng vũ trụ & quỹ đạo)* | `python stark_tethered_bridge.py --demo 6` | `python stark_cardboard_xr.py --demo 6` | **`6`** | `[APP_6]_CHAY_SPATIAL_UNIVERSE_3D.bat` |
| **7** | **VIDEO VR**<br>*(Phim VR180 SBS & 360)* | `python stark_tethered_bridge.py --demo 7` | `python stark_cardboard_xr.py --demo 7` | **`7`** | `[APP_7]_CHAY_VIDEO_VR_360.bat` |

---

## 2. CODE TÙY BIẾN CHẾ ĐỘ HIỂN THỊ (1 MÀN HÌNH HOẶC KÍNH 3D SBS)

Bạn có thể thêm tham số `--view` và `--distortion` vào bất kỳ lệnh nào ở trên:

### A. Chạy ở chế độ 1 MÀN HÌNH DUY NHẤT (Single Screen / Phone View)
*Dành cho người không dùng kính, nhìn trực tiếp vào màn hình điện thoại hoặc máy tính:*
```bash
# Chạy Paint 3D 1 màn hình duy nhất
python stark_tethered_bridge.py --demo 1 --view mono

# Chạy Vũ trụ Không gian 3D 1 màn hình duy nhất
python stark_tethered_bridge.py --demo 6 --view mono

# Chạy Xem phim Video VR 1 màn hình duy nhất
python stark_tethered_bridge.py --demo 7 --view mono
```

### B. Chạy ở chế độ KÍNH 3D VR (Side-by-Side - SBS cho kính Shinecon G10)
*Tự động chia đôi màn hình 640x720 mỗi mắt:*
```bash
# Chạy Paint 3D chế độ Kính 3D SBS
python stark_tethered_bridge.py --demo 1 --view sbs

# Chạy Vũ trụ 3D chế độ Kính 3D SBS
python stark_tethered_bridge.py --demo 6 --view sbs

# Chạy Xem phim VR180 3D SBS (chia đúng nửa trái/phải cho 2 mắt)
python stark_tethered_bridge.py --demo 7 --view sbs
```

### C. Chạy kèm Bộ lọc khử méo thấu kính Cardboard (`Polynomial Distortion`)
*Tự động uốn cong quang học $p'=p(1+0.28r^2+0.08r^4)$ để ảnh phẳng lì khi nhìn qua thấu kính lồi:*
```bash
python stark_tethered_bridge.py --demo 6 --view sbs --distortion
```

---

## 3. DANH SÁCH TÊN BÍ DANH (ALIASES) CÓ THỂ DÙNG TRONG CODE

Hệ thống hỗ trợ gõ tên chữ hoặc số thứ tự tương đương nhau:

| Tên Ứng Dụng | Các Mã Nhận Diện Hợp Lệ (`--demo <Mã>`) |
| :--- | :--- |
| **Paint 3D** | `1`, `paint` |
| **AR Portal** | `2`, `portal` |
| **Orb Rush** | `3`, `rush`, `orb_rush` |
| **Cubes Physics** | `4`, `cube`, `cubes`, `sandbox` |
| **3D Caliper** | `5`, `caliper` |
| **Spatial 3D Universe** | `6`, `spatial`, `sim`, `universe` |
| **Video VR 360/180** | `7`, `video`, `vr_video` |

*Ví dụ:*
`python stark_cardboard_xr.py --demo spatial` (Chạy thẳng vào Mô phỏng Vũ trụ 3D)  
`python stark_cardboard_xr.py --demo video` (Chạy thẳng vào Trình chiếu Video VR)  
`python stark_cardboard_xr.py --demo rush` (Chạy thẳng vào Game đập bóng Orb Rush)

---

## 4. BẢNG PHÍM TẮT ĐỔI NHANH ỨNG DỤNG KHI ĐANG MỞ (RUNTIME SWITCHING)

Khi cửa sổ ứng dụng đang chạy, chỉ cần bấm 1 phím trên bàn phím:

* **Phím `1`** : Chuyển ngay sang **3D Air Paint**
* **Phím `2`** : Chuyển ngay sang **AR Spatial Portal**
* **Phím `3`** : Chuyển ngay sang **Orb Rush** (Tự động phát bóng)
* **Phím `4`** : Chuyển ngay sang **Cubes Physics**
* **Phím `5`** : Chuyển ngay sang **3D Caliper**
* **Phím `6`** : Chuyển ngay sang **Spatial 3D Universe Simulation**
* **Phím `7`** : Chuyển ngay sang **Video VR 360 & VR180 Player**
* **Phím `V`** : Đổi qua lại giữa **1 Màn hình duy nhất** và **Kính 3D VR SBS**
* **Phím `D`** : Bật / Tắt **Bộ lọc khử méo thấu kính Cardboard**
* **Phím `X`** : Đổi qua lại giữa **Camera iPhone (USB)** và **Webcam Laptop**
* **Phím `ESC`**: Thoát chương trình an toàn
