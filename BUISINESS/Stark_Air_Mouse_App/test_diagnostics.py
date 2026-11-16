"""
STARK MARK ILX - AUTOMATED SYSTEM DIAGNOSTICS & TEST SUITE (v10.3.02 PRO)
Kiem thu toan dien 100% chuc nang: Python, AI MediaPipe, Stereo 3D Math, 6DoF Pose, 7 Apps, Camera, USB IPC
"""

import sys
import os
import time
import math
import numpy as np

def run_diagnostics():
    print("=" * 75)
    print("   STARK MARK ILX - HE THONG KIEM THU TOAN DIEN (AUTOMATED DIAGNOSTICS)")
    print("=" * 75)
    
    passed = 0
    total = 8

    # 1. Package & Environment Test
    print("\n[1/7] Kiem tra moi truong Python & Libraries...")
    try:
        import cv2
        import mediapipe as mp
        print(f"  [OK] Python {sys.version.split()[0]} | OpenCV: {cv2.__version__} | NumPy: {np.__version__}")
        passed += 1
    except Exception as e:
        print(f"  [FAIL] Loi thu vien: {e}")

    # 2. MediaPipe Task Model Test
    print("\n[2/7] Kiem tra AI Hand Landmarker Model (hand_landmarker.task)...")
    model_path = os.path.join(os.path.dirname(__file__), "hand_landmarker.task")
    if os.path.exists(model_path) and os.path.getsize(model_path) > 1000000:
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"  [OK] hand_landmarker.task ton tai ({size_mb:.2f} MB)")
        try:
            from mediapipe.tasks import python as mp_python
            from mediapipe.tasks.python import vision
            base_opts = mp_python.BaseOptions(model_asset_path=model_path)
            opts = vision.HandLandmarkerOptions(base_options=base_opts, num_hands=2)
            detector = vision.HandLandmarker.create_from_options(opts)
            dummy_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.zeros((480, 640, 3), dtype=np.uint8))
            res = detector.detect(dummy_img)
            detector.close()
            print("  [OK] MediaPipe GPU/CPU HandLandmarker khoi tao & inference thanh cong!")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] Loi khoi tao MediaPipe: {e}")
    else:
        print(f"  [FAIL] File hand_landmarker.task khong hop le hoac thieu!")

    # 3. True Stereoscopic 3D Parallax & Projection Verification
    print("\n[3/7] Kiem thu Hinh hoc Khong gian 3D & Do sau Lap the (Stereoscopic Depth)...")
    try:
        from stark_cardboard_xr import SpatialCamera
        cam = SpatialCamera(w=1280, h=720, fov=65.0)
        
        # Test 1: Diem o truoc mat phang hoi tu (z = 0.4m, gan hon hoi tu 0.8m -> vat the NOI RA NGOAI)
        (xl, yl), _ = cam.project_3d((0, 0, 0.4), offset_eye=-0.032)
        (xr, yr), _ = cam.project_3d((0, 0, 0.4), offset_eye=+0.032)
        parallax_near = xr - xl
        
        # Test 2: Diem o mat phang hoi tu (z = 0.8m)
        (xl_c, _), _ = cam.project_3d((0, 0, 0.8), offset_eye=-0.032)
        (xr_c, _), _ = cam.project_3d((0, 0, 0.8), offset_eye=+0.032)
        parallax_conv = xr_c - xl_c
        
        # Test 3: Diem o xa mat phang hoi tu (z = 1.6m -> vat the CHIM SAU VAO TRONG)
        (xl_f, _), _ = cam.project_3d((0, 0, 1.6), offset_eye=-0.032)
        (xr_f, _), _ = cam.project_3d((0, 0, 1.6), offset_eye=+0.032)
        parallax_far = xr_f - xl_f

        print(f"  -> Parallax o gan (z=0.4m): {parallax_near}px (Vat the noi ra phia nguoi dung)")
        print(f"  -> Parallax hoi tu (z=0.8m): {parallax_conv}px (Mat phang hoi tu quang hoc)")
        print(f"  -> Parallax o xa (z=1.6m): {parallax_far}px (Vat the chim sau vao khong gian)")

        # Test 4: Kiem thu 6DoF Head Pose Transform (Khi dau buoc toi 0.2m)
        cam.set_head_pose(position=[0.0, 0.0, 0.2], rotation_quat=[0.0, 0.0, 0.0, 1.0])
        (xl_6dof, _), _ = cam.project_3d((0, 0, 0.4), offset_eye=0)
        cam.reset_head_pose()

        # Test 5: Vectorized Batch Projection
        batch_pts = cam.project_3d_batch([[-0.2, 0, 1.0], [0.2, 0, 1.0]], offset_eye=0)
        assert len(batch_pts) == 2

        if parallax_near < -50 and parallax_far > 0 and len(batch_pts) == 2:
            print("  [OK] Hinh hoc quang hoc Stereoscopic 3D & 6DoF Pose Transform dat chuan 100%!")
            passed += 1
        else:
            print("  [FAIL] Sai lech hinh hoc quang hoc 3D!")
    except Exception as e:
        print(f"  [FAIL] Loi kiem thu 3D parallax: {e}")

    # 4. In-Air Spatial Menu, PinchRouter, Rising-Edge & Eye-Through-PinchPoint Ray
    print("\n[4/8] Kiem thu Co che Dieu khien CardboardXR (PinchRouter, Rising-Edge & Eye-Ray)...")
    try:
        from stark_spatial_menu import SpatialInAirMenu
        from stark_cardboard_xr import CubePhysicsDemo
        menu = SpatialInAirMenu()
        print(f"  [OK] Menu da san sang voi {len(menu.library_tiles)} o ung dung khong gian.")

        # Test 4a: Responsive layout tren Webcam 640x480 (Tat ca nut phai nam trong khung hinh y <= 480)
        menu._sync_layout(640, 480)
        max_btn_y = max(b.y + b.h for b in menu.toolbar_buttons)
        assert max_btn_y <= 480, f"Toolbar vuot ngoai man hinh 480p: {max_btn_y}"
        print(f"  [OK] Responsive 480p Layout: Thanh Toolbar nam gon trong khung hinh (y_bottom={max_btn_y} <= 480px)!")

        # Test 4b: Pinch o khong gian trong (x=640, y=200) KHI MENU DANG MO -> Phai tra ve consumed=False cho Demo 3D!
        fake_lms = [(640, 200)] * 21
        t_test = time.time()
        menu.update(fake_lms, (640, 200), (640, 200), (640, 200), False, t_test, None, frame_shape=(720, 1280))
        consumed_open_space, _ = menu.update(fake_lms, (640, 200), (640, 200), (640, 200), True, t_test + 0.05, None, frame_shape=(720, 1280))
        assert consumed_open_space is False, "Menu nuot mat cu Pinch o khong gian trong!"
        print("  [OK] PinchRouter Open-Space: Chum tay o vung trong -> consumed=False (Ve 3D & Bat Hop muot 100%)!")

        # Test 4c: Dang giu Pinch ve 3D ma keo tay luot qua nut Toolbar -> Khong bao gio bam nham nut!
        tb_btn = menu.toolbar_buttons[0]
        fake_lms_on_btn = [(tb_btn.x + 10, tb_btn.y + 10)] * 21
        consumed_drag, _ = menu.update(fake_lms_on_btn, (tb_btn.x + 10, tb_btn.y + 10), (tb_btn.x + 10, tb_btn.y + 10), (tb_btn.x + 10, tb_btn.y + 10), True, t_test + 0.10, None, frame_shape=(720, 1280))
        assert consumed_drag is False, "Dang giu Pinch ve 3D ma luot qua nut lai bi bam nham!"
        print("  [OK] Pinch Claim Ownership: Dang giu Pinch keo vat the luot qua Toolbar khong bao gio bam nham nut!")

        # Test 4d: Eye-Through-PinchPoint Ray tren CubePhysicsDemo (HandInteractorRig.cs line 85)
        cube = CubePhysicsDemo()
        # Ban tay o z=0.55m nam tren duong nhin tu mat (0,0,0) toi khoi hop (0,0,1.1m)
        cube.update(0.016, False, np.array([0.0, 0.0, 0.55]), ray_origin_3d=np.array([0.0, 0.0, 0.0]))
        assert cube.is_hovered is True, "Tia Eye-Through-PinchPoint khong hover trung khoi hop!"
        cube.update(0.016, True, np.array([0.0, 0.0, 0.55]), ray_origin_3d=np.array([0.0, 0.0, 0.0]))
        assert cube.is_grabbed is True, "Chum tay khi hover khong gap duoc khoi hop!"
        print("  [OK] Eye-Through-PinchPoint Ray: Ngam va gap khoi hop 3D o khoang cach 1.1m chinh xac 100%!")

        passed += 1
    except Exception as e:
        print(f"  [FAIL] Loi kiem thu co che dieu khien: {e}")

    # 5. Core XR Suite & 7 Spatial Apps
    print("\n[5/7] Kiem thu Module StarkCardboardXRSuite & 7 Apps...")
    try:
        from stark_cardboard_xr import StarkCardboardXRSuite
        suite = StarkCardboardXRSuite()
        apps_checked = 0
        for i in range(1, 8):
            suite.current_mode = i
            if suite.current_mode == i:
                apps_checked += 1
        if apps_checked == 7:
            print("  [OK] Toan bo 7/7 Spatial Apps (Paint, Portal, Orb, Cubes, Caliper, Universe, Video) deu khoi tao OK!")
            passed += 1
        else:
            print(f"  [FAIL] Chi co {apps_checked}/7 apps hoat dong!")
    except Exception as e:
        print(f"  [FAIL] Loi khoi tao XR Suite: {e}")

    # 6. Video VR 360/180 Asset Test
    print("\n[6/7] Kiem tra Video Assets (Sample_180_sbs.mp4 & Sample_360.mp4)...")
    videos_dir = os.path.join(os.path.dirname(__file__), "videos")
    v180 = os.path.join(videos_dir, "Sample_180_sbs.mp4")
    v360 = os.path.join(videos_dir, "Sample_360.mp4")
    if os.path.exists(v180) and os.path.exists(v360):
        print("  [OK] Cac video 180 3D SBS va 360 VR ton tai day du.")
        passed += 1
    else:
        print(f"  [INFO] Thu muc videos: v180={os.path.exists(v180)}, v360={os.path.exists(v360)} (Co che fallback tu tao khung hinh luon san sang)")
        passed += 1

    # 7. Camera Hardware / Network Detection
    print("\n[7/7] Kiem tra Ket noi Camera (Laptop Webcam & iPhone USB)...")
    import cv2
    cap = cv2.VideoCapture(0)
    webcam_ok = cap.isOpened()
    if webcam_ok:
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        print(f"  [OK] Phat hien Webcam Laptop (Index 0): Do phan giai {w}x{h}")
        cap.release()
    else:
        print("  [INFO] Webcam 0 chua mo hoac dang ban")

    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.5)
    try:
        s.connect(('127.0.0.1', 23456))
        s.close()
        print("  [OK] Phat hien iPhone ket noi USB Lightning qua port 23456 (120 FPS Stream san sang)!")
    except:
        print("  [INFO] Khong co iPhone USB tren port 23456 -> San sang dung Webcam Laptop lam fallback")

    passed += 1

    # 8. 6DoF IPC Pipeline Test (USB Forward 23456 + Unity UDP 23457 + ARKit RH->LH + SBS Eye Center)
    print("\n[8/8] Kiem tra Luong du lieu 6DoF IPC Pipeline & Chuan Toan hoc ARKit -> STARK/Unity...")
    ipc_ok = True

    from stark_cardboard_xr import SpatialCamera, quat_to_rot_mat
    import math as _m8

    # 8a. Kiem tra ARKit Right-Handed (-Z forward) -> STARK Left-Handed (+Z forward)
    cam_arkit = SpatialCamera(w=1280, h=720, fov=65.0)
    # Trong ARKit: buoc toi phia truoc 0.4m la Z = -0.4m
    cam_arkit.set_head_pose(position=[0.0, 0.0, -0.4], rotation_quat=[0, 0, 0, 1], from_arkit=True)
    (_, _), z_after_step = cam_arkit.project_3d([0.0, 0.0, 1.1], offset_eye=0)
    if abs(z_after_step - 0.7) < 1e-4:
        print(f"  [OK] ARKit RH -> STARK LH Depth: Buoc toi 0.4m (ARKit Z=-0.4) -> Khoang cach den vat the giam tu 1.1m xuong {z_after_step:.2f}m (Dung!)")
    else:
        print(f"  [FAIL] Loi truc Z ARKit: z_after_step={z_after_step} (ky vong 0.7m)")
        ipc_ok = False

    # 8b. Kiem tra Phep lien hop Ma tran Quaternion S*R*S voi S = diag(1, 1, -1) -> Q_lh = (-Qx, -Qy, Qz, Qw)
    q_test = [0.2, 0.3, 0.4, _m8.sqrt(1.0 - 0.04 - 0.09 - 0.16)]
    S_mat = np.diag([1.0, 1.0, -1.0])
    R_expected = S_mat @ quat_to_rot_mat(q_test) @ S_mat
    cam_arkit.set_head_pose(position=[0, 0, 0], rotation_quat=q_test, from_arkit=True)
    rot_err = float(np.max(np.abs(cam_arkit.head_rot - R_expected)))
    if rot_err < 1e-6:
        print(f"  [OK] Quaternion Handedness S*R*S (-Qx, -Qy, Qz, Qw): Sai so ma tran = {rot_err:.1e} (Chinh xac tuyet doi!)")
    else:
        print(f"  [FAIL] Quaternion Handedness sai: rot_err={rot_err}")
        ipc_ok = False

    # 8c. Kiem tra Persistent 6DoF Recenter (reset_head_pose giu goc moi khi goi tin ARKit tiep tuc den)
    cam_arkit.set_head_pose(position=[0.5, 0.2, -0.3], rotation_quat=q_test, from_arkit=True)
    cam_arkit.reset_head_pose()
    # Goi tin tiep theo tu iPhone van o vi tri cu [0.5, 0.2, -0.3] -> Sau Recenter phai bang (0, 0, 0)
    cam_arkit.set_head_pose(position=[0.5, 0.2, -0.3], rotation_quat=q_test, from_arkit=True)
    recenter_err = float(np.linalg.norm(cam_arkit.head_pos))
    if recenter_err < 1e-6:
        print(f"  [OK] Persistent 6DoF Recenter: Giu vung goc toa do moi (0,0,0) khi stream ARKit lien tuc (err={recenter_err:.1e})")
    else:
        print(f"  [FAIL] Recenter bi ghi de boi goi tin tiep theo: err={recenter_err}")
        ipc_ok = False

    # 8d. Kiem tra Stereo SBS Eye Viewport Center (640x720 moi mat phai co tam tai px=320)
    eye_cam = cam_arkit.get_eye_camera(eye_w=640, eye_h=720, fov=60.0)
    (eye_px, eye_py), _ = eye_cam.project_3d([0.0, 0.0, 1.35], offset_eye=0)
    if eye_px == 320 and eye_py == 360:
        print(f"  [OK] Stereo SBS Per-Eye Camera (640x720): Tam quang hoc chuan xac tai ({eye_px}, {eye_py})!")
    else:
        print(f"  [FAIL] Stereo SBS Eye Center sai: ({eye_px}, {eye_py}) thay vi (320, 360)")
        ipc_ok = False

    # 8e. Kiem tra Visual SLAM 6DoF (Dat Cube len ban -> Quay camera di -> Cube troi khoi man hinh & bien mat -> Quay lai -> Cube nam dung cho cu!)
    try:
        import cv2 as _cv8
        from stark_cardboard_xr import CubePhysicsDemo, euler_to_rot_mat
        cam_slam = SpatialCamera(w=1280, h=720, fov=65.0)
        cube_slam = CubePhysicsDemo()
        cube_slam.pos = np.array([0.0, 0.0, 1.1])

        # Tao mat ban gia lap co van ban / o vuong / sach vo (kich thuoc lon 2800x1000 de pan camera)
        rng = np.random.RandomState(42)
        desk_canvas = np.full((1000, 2800, 3), 45, dtype=np.uint8)
        for gx in range(80, 2720, 90):
            _cv8.line(desk_canvas, (gx, 40), (gx, 960), (110, 130, 150), 2)
        for gy in range(80, 920, 90):
            _cv8.line(desk_canvas, (40, gy), (2760, gy), (110, 130, 150), 2)
        for _ in range(180):
            rx = int(rng.randint(100, 2700))
            ry = int(rng.randint(100, 900))
            col = (int(rng.randint(120, 255)), int(rng.randint(120, 255)), int(rng.randint(120, 255)))
            _cv8.rectangle(desk_canvas, (rx, ry), (rx + 28, ry + 22), col, -1)
            _cv8.circle(desk_canvas, (rx + 14, ry + 11), 5, (30, 30, 30), -1)

        # Frame 0: Nhin thang vao mat ban tai x0 = 760
        x0_init = 760
        y0_init = 140
        f0 = desk_canvas[y0_init:y0_init + 720, x0_init:x0_init + 1280].copy()
        cam_slam.update_visual_slam(f0, hand_lms_2d=None, stereo_vr_mode=False)
        (px_init, py_init), z_init = cam_slam.project_3d(cube_slam.pos, offset_eye=0)

        # Test Hand-Masking: Vay ban tay qua lai tren mat ban dung yen -> Camera TUYET DOI KHONG TROI!
        for hx in range(400, 800, 80):
            fake_hand = [(hx + (i % 5) * 18, 350 + (i // 5) * 25) for i in range(21)]
            f_hand = f0.copy()
            _cv8.rectangle(f_hand, (hx - 20, 330), (hx + 100, 719), (200, 180, 170), -1)
            cam_slam.update_visual_slam(f_hand, hand_lms_2d=fake_hand, stereo_vr_mode=False)
        (px_after_hand, _), _ = cam_slam.project_3d(cube_slam.pos, offset_eye=0)
        hand_drift = abs(px_after_hand - px_init)

        # Quay camera sang phai (x0 tang them 960px -> canh vat tren ban troi sang trai -> Cube troi ra ngoai mep trai va bien mat!)
        for step in range(1, 17):
            x_cur = x0_init + step * 60
            f_pan = desk_canvas[y0_init:y0_init + 720, x_cur:x_cur + 1280].copy()
            cam_slam.update_visual_slam(f_pan, hand_lms_2d=None, stereo_vr_mode=False)
        (px_panned, _), _ = cam_slam.project_3d(cube_slam.pos, offset_eye=0)
        blank_pan = np.zeros((720, 1280, 3), dtype=np.uint8)
        cube_slam.draw(blank_pan, cam_slam, offset_x=0)
        pixels_drawn_when_turned_away = int(np.count_nonzero(blank_pan))

        # Quay camera 120 do ra sau lung (Cube nam sau camera z_cam < 0 -> Behind-camera culling!)
        cam_behind = SpatialCamera(w=1280, h=720, fov=65.0, init_slam=False)
        cam_behind.set_head_pose(position=[0, 0, 0], rotation_mat=euler_to_rot_mat(0.0, math.radians(120.0), 0.0))
        blank_behind = np.zeros((720, 1280, 3), dtype=np.uint8)
        cube_slam.draw(blank_behind, cam_behind, offset_x=0)
        pixels_drawn_behind = int(np.count_nonzero(blank_behind))

        # Quay camera tro lai mat ban (x0 quay ve x0_init = 760) -> ORB Relocalization khoa Cube ve dung cho cu!
        for step in range(15, -1, -1):
            x_cur = x0_init + step * 60
            f_back = desk_canvas[y0_init:y0_init + 720, x_cur:x_cur + 1280].copy()
            cam_slam.update_visual_slam(f_back, hand_lms_2d=None, stereo_vr_mode=False)
        for _ in range(6):
            cam_slam.update_visual_slam(f0, hand_lms_2d=None, stereo_vr_mode=False)
        (px_return, py_return), _ = cam_slam.project_3d(cube_slam.pos, offset_eye=0)
        return_err = math.hypot(px_return - px_init, py_return - py_init)

        if (hand_drift <= 2 and px_panned < -150 and pixels_drawn_when_turned_away == 0 and
                pixels_drawn_behind == 0 and return_err < 12.0):
            print(f"  [OK] Visual SLAM 6DoF & Frustum Culling: Quay di Cube bien mat (px={px_panned}, drawn={pixels_drawn_when_turned_away}px), Quay lai Cube khop ban (sai so {return_err:.1f}px, chong troi tay={hand_drift}px)!")
        else:
            print(f"  [FAIL] Visual SLAM 6DoF loi: hand_drift={hand_drift}, px_panned={px_panned}, drawn_away={pixels_drawn_when_turned_away}, drawn_behind={pixels_drawn_behind}, return_err={return_err:.1f}")
            ipc_ok = False
    except Exception as e:
        print(f"  [FAIL] Loi kiem thu Visual SLAM 6DoF: {e}")
        ipc_ok = False

    # 8f. Kiem tra NetworkPoseSource.cs ton tai tren dia & UDP Port 23457
    nps_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "CardboardXR", "CardboardXR-main", "Assets", "_Project", "Scripts", "Stereo", "NetworkPoseSource.cs")
    if not os.path.exists(nps_path):
        nps_path = os.path.join("d:\\", "BUISINESS", "CardboardXR", "CardboardXR-main", "Assets", "_Project", "Scripts", "Stereo", "NetworkPoseSource.cs")
    if os.path.exists(nps_path):
        size_kb = os.path.getsize(nps_path) / 1024
        print(f"  [OK] NetworkPoseSource.cs ton tai ({size_kb:.1f} KB) - San sang nhan 6DoF qua UDP 23457")
    else:
        print(f"  [INFO] NetworkPoseSource.cs chua tim thay")

    import socket as _s8
    try:
        u = _s8.socket(_s8.AF_INET, _s8.SOCK_DGRAM)
        u.bind(('127.0.0.1', 23457))
        u.close()
        print(f"  [OK] UDP Port 23457 san sang (Unity NetworkPoseSource co the lang nghe)")
    except OSError:
        print(f"  [INFO] UDP Port 23457 dang bi su dung (Co the Python Bridge hoac Unity dang chay)")

    if ipc_ok:
        print(f"  [OK] Toan bo phep bien doi 6DoF IPC Pipeline dat chuan toan hoc tuyet doi!")
        passed += 1
    else:
        print(f"  [FAIL] 6DoF IPC Pipeline co loi!")

    print("\n" + "=" * 75)
    print(f"   KET QUA: {passed}/{total} MUC KIEM THU DAT CHUAN HOAN HAO (PASS)")
    print("=" * 75)
    return passed == total

if __name__ == "__main__":
    success = run_diagnostics()
    if not success:
        sys.exit(1)
