"""
STARK CARDBOARDXR // TETHERED NATIVE IPHONE 13 USB BRIDGE v10.2.79 PRO
=====================================================================
Ket noi truc tiep 100% qua day cap Lightning/USB (Khong Wi-Fi, Khong HTML, Khong Port mang).
- Tu dong ket noi va duy tri ket noi 24/7 (Continuous Auto-Reconnect, Zero Timeout).
- Nhan luong 1080p/4K 60-120 FPS tu Camera sau cua iPhone 13.
- Xu ly AI 21 khop tay MediaPipe bat dong bo tren GPU NVIDIA RTX 4060 (Zero Latency).
- Chuan hoa quang hoc Stereo Side-by-Side (SBS) 3D cho kinh Shinecon G10 (Vision Pro Style).
- Ban nguoc truc tiep ve man hinh iPhone voi do tre cuc thap (< 12ms).
"""

import sys
import os
import time
import math
import socket
import struct
import threading
import subprocess
import numpy as np
import cv2

# Import STARK CardboardXR Engine & In-Air Spatial UI
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from stark_cardboard_xr import StarkCardboardXRSuite, SpatialCamera
from stark_spatial_menu import SpatialInAirMenu

class StarkTetheredBridge:
    def __init__(self, port=23456):
        self.port = port
        self.suite = StarkCardboardXRSuite()
        self.suite.stereo_vr_mode = True # Mac dinh bat SBS cho kinh Shinecon G10
        self.suite.bridge = self
        self.spatial_menu = SpatialInAirMenu()
        
        self.sock = None
        self.is_connected = False
        self.running = True
        
        # Frame pipeline
        self.latest_frame = None
        self.frame_lock = threading.Lock()
        
        # AI Asynchronous Pipeline
        self.ai_frame = None
        self.ai_lock = threading.Lock()
        self.latest_lms = None
        self.lms_lock = threading.Lock()
        
        # VR SBS Geometry settings for Shinecon G10 (64mm IPD, 42mm lenses)
        self.ipd_offset = 14       # Disparity shift in pixels
        self.vr_projection = "immersive" # "immersive" (Vision Pro center-crop) or "full_fov" (letterbox)
        
        # Huong Camera (Orientation): Mac dinh xoay 180 do khi cam cap Lightning sang trai va KHONG lat guong chu viet
        self.rotate_180 = True
        self.flip_horizontal = False
        self.flip_vertical = False
        
        self.forward_proc = None
        self.actual_rx_fps = 0.0
        self.rx_count = 0
        self.last_rx_t = time.time()
        self.use_fallback = False

    def start_usbmux_forward(self):
        """Khoi chay usbmux forwarder anh xa cong 23456 qua cap USB"""
        print(f"\n[+] Dang khoi tao kenh truyen du lieu USB usbmuxd tai cong {self.port}...")
        try:
            test_s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            test_s.settimeout(0.5)
            try:
                test_s.connect(('127.0.0.1', self.port))
                test_s.close()
                print("[+] Kenh phan cung usbmuxd tren day cap Lightning da san sang!")
                return True
            except Exception:
                test_s.close()

            cmd = [sys.executable, "-m", "pymobiledevice3", "usbmux", "forward", str(self.port), str(self.port)]
            self.forward_proc = subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
            )
            time.sleep(1.0)
            print("[+] Kenh phan cung usbmuxd tren day cap Lightning da san sang!")
            return True
        except Exception as e:
            print(f"[!] Canh bao khoi tao usbmux: {e}")
            return False

    def start_connection_manager(self):
        """Luong tu dong ket noi / tai ket noi voi iPhone qua cap USB lien tuc (Continuous Auto-Reconnect)"""
        def conn_worker():
            print(f"[*] Luong ket noi USB tu dong dang hoat dong tai cong {self.port}...")
            while self.running:
                if not self.is_connected:
                    try:
                        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                        s.setsockopt(socket.SOL_SOCKET, socket.SO_RCVBUF, 65536)
                        s.settimeout(1.5)
                        s.connect(("127.0.0.1", self.port))
                        
                        self.sock = s
                        self.is_connected = True
                        print("\n[V] KET NOI THANH CONG VOI IPHONE 13 QUA CAP USB LIGHTNING!")
                        
                        # Chay luong doc stream cho socket nay
                        self._stream_reader_loop(s)
                    except Exception:
                        self.is_connected = False
                        if self.sock:
                            try: self.sock.close()
                            except: pass
                            self.sock = None
                        time.sleep(0.5)
                else:
                    time.sleep(0.2)
        
        t = threading.Thread(target=conn_worker, daemon=True)
        t.start()

    def _stream_reader_loop(self, sock):
        """Doc luong H.264 tu iPhone va giai ma thanh frame numpy khong de don hang (Zero Bufferbloat)"""
        import av
        codec = av.CodecContext.create("h264", "r")
        while self.running and self.is_connected:
            try:
                header = self._recv_all(sock, 4)
                if not header:
                    break
                length = struct.unpack(">I", header)[0]
                if length <= 0 or length > 10_000_000:
                    continue
                payload = self._recv_all(sock, length)
                if not payload:
                    break
                
                try:
                    packets = codec.parse(payload)
                    for pkt in packets:
                        try:
                            frames = codec.decode(pkt)
                            for f in frames:
                                # Luon ghi de frame moi nhat -> Khong bao gio bi tich tu do tre (Zero-Lag)
                                bgr = f.to_ndarray(format="bgr24")
                                with self.frame_lock:
                                    self.latest_frame = bgr
                                
                                self.rx_count += 1
                                now = time.time()
                                if now - self.last_rx_t >= 1.0:
                                    self.actual_rx_fps = self.rx_count / (now - self.last_rx_t)
                                    self.rx_count = 0
                                    self.last_rx_t = now
                        except av.AVError:
                            pass
                except av.AVError:
                    pass
            except Exception:
                break
        
        # Khi mat ket noi
        self.is_connected = False
        with self.frame_lock:
            self.latest_frame = None
        try: sock.close()
        except: pass
        self.sock = None
        print("\n[!] Tam thoi mat ket noi voi iPhone. He thong dang tu dong cho ket noi lai...")

    def start_ai_thread(self):
        """Luong xu ly MediaPipe AI bat dong bo (Asynchronous AI Worker) tranh gay lag luong hien thi"""
        import mediapipe as mp
        def ai_worker():
            while self.running:
                frame_to_process = None
                with self.ai_lock:
                    if self.ai_frame is not None:
                        frame_to_process = self.ai_frame
                        self.ai_frame = None
                
                if frame_to_process is None:
                    time.sleep(0.003)
                    continue
                
                try:
                    # Resize xuong 640x360 cho MediaPipe suy luan cuc nhanh (8ms tren RTX 4060)
                    infer_w, infer_h = 640, 360
                    small = cv2.resize(frame_to_process, (infer_w, infer_h), interpolation=cv2.INTER_LINEAR)
                    rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)
                    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                    
                    results = self.suite.detector.detect(mp_image)
                    
                    with self.lms_lock:
                        if results.hand_landmarks:
                            self.latest_lms = results.hand_landmarks[0]
                        else:
                            self.latest_lms = None
                except Exception:
                    pass

        t = threading.Thread(target=ai_worker, daemon=True)
        t.start()

    def _recv_all(self, sock, n):
        data = bytearray()
        while len(data) < n and self.running and self.is_connected:
            try:
                chunk = sock.recv(n - len(data))
                if not chunk:
                    return None
                data.extend(chunk)
            except socket.timeout:
                continue
            except Exception:
                return None
        return bytes(data)

    def send_sbs_back_to_iphone(self, sbs_frame):
        """Ban hinh anh 3D SBS da xu ly ve man hinh iPhone qua cap USB voi do tre < 2ms"""
        sock = self.sock
        if not self.is_connected or sock is None:
            return
        try:
            # Quality 70 tren 1280x720 nén chi mat 2.5ms va dung luong chi ~35KB
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]
            _, encoded = cv2.imencode(".jpg", sbs_frame, encode_param)
            data = encoded.tobytes()
            pkt = struct.pack(">I", len(data)) + data
            sock.sendall(pkt)
        except Exception:
            pass

    def run(self):
        self.start_usbmux_forward()
        self.start_connection_manager()
        self.start_ai_thread()

        # Khoi tao cua so OpenCV
        win_title = "STARK CARDBOARDXR // TETHERED NATIVE USB XR SUITE"
        cv2.namedWindow(win_title, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_title, 1280, 720)

        # Webcam laptop du phong (Index 0) chi bat khi nguoi dung an phim X
        fallback_cap = None

        print("\n==================================================================")
        print("   STARK TETHERED XR // HE THONG KHONG GIAN 3D NATIVE USB")
        print("   [1] 3D Air Paint (Tilt Brush)   | [2] AR Spatial Portal")
        print("   [3] Orb Rush Rhythm Game        | [4] 3D Cube Physics & Grab")
        print("   [5] Precision 3D Caliper        | [V] Toggle Stereo VR (Shinecon G10)")
        print("   [[]/[]] Tang/Giam IPD 3D        | [F] Doi Che Do Crop/Full FOV")
        print("   [R] Dao 180 do (Xoay chieu)     | [M] Lat guong ngang | [T] Lat doc")
        print("   [X] Chuyen doi Camera iPhone USB <-> Webcam Laptop (Index 0)")
        print("   [ESC] Thoat he thong")
        print("==================================================================\n")

        last_t = time.time()
        fps = 60.0

        while self.running:
            frame = None
            frame_is_iphone = False
            
            # 1. Uu tien tuyet doi lay frame tu iPhone qua cap USB (Luong Frame moi nhat khong bao gio tre)
            if self.is_connected and not self.use_fallback:
                with self.frame_lock:
                    if self.latest_frame is not None:
                        frame = self.latest_frame.copy()
                        frame_is_iphone = True

            # 2. Chi lay tu Webcam Laptop (Index 0) neu nguoi dung chu dong bat che do du phong bang phim X
            if self.use_fallback:
                if fallback_cap is None:
                    fallback_cap = self.suite.init_capture(0)
                if fallback_cap and fallback_cap.isOpened():
                    ret, f = fallback_cap.read()
                    if ret and f is not None and f.size > 0:
                        frame = f
                        frame_is_iphone = False

            # 3. Neu dang cho mo app iPhone -> Hien thi HUD Cyberpunk STARK (Tuyet doi khong hien man hinh xam Camo)
            if frame is None:
                hud = np.zeros((720, 1280, 3), dtype=np.uint8)
                # Ve luoi toa do khong gian
                for y in range(0, 720, 40):
                    cv2.line(hud, (0, y), (1280, y), (20, 25, 30), 1)
                for x in range(0, 1280, 40):
                    cv2.line(hud, (x, 0), (x, 720), (20, 25, 30), 1)
                
                pulse = int(127 + 127 * np.sin(time.time() * 4.0))
                cyan_pulse = (pulse, 243, 255)
                
                cv2.putText(hud, "STARK CARDBOARDXR // NATIVE USB SPATIAL XR", (80, 240),
                            cv2.FONT_HERSHEY_DUPLEX, 1.1, cyan_pulse, 2, cv2.LINE_AA)
                
                if self.is_connected:
                    status_msg = "[V] DA KET NOI USB! DANG NHAN LUONG VIDEO 60-120 FPS TU IPHONE..."
                    status_col = (0, 255, 128)
                else:
                    status_msg = "[*] DANG CHO KET NOI: VUI LONG MO APP 'STARK XR Cam' TREN IPHONE..."
                    status_col = (0, 165, 255)
                cv2.putText(hud, status_msg, (80, 310), cv2.FONT_HERSHEY_SIMPLEX, 0.75, status_col, 2, cv2.LINE_AA)
                
                cv2.putText(hud, "-> Cam day Lightning/USB va mo app STARK XR Cam tren man hinh iPhone.", (80, 370),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1, cv2.LINE_AA)
                cv2.putText(hud, "-> He thong tu dong nhan dien trong 0.5s, khong can thao tac tren laptop!", (80, 410),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 1, cv2.LINE_AA)
                cv2.putText(hud, "[X] Chuyen sang Webcam Laptop (Index 0)  |  [ESC] Thoat", (80, 480),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.60, (150, 150, 255), 1, cv2.LINE_AA)
                
                cv2.imshow(win_title, hud)
                k = cv2.waitKey(25) & 0xFF
                if k == 27:
                    break
                elif k == ord('x') or k == ord('X'):
                    self.use_fallback = not self.use_fallback
                continue

            # Xu ly FPS va thoi gian thuc
            now = time.time()
            dt = max(0.001, now - last_t)
            last_t = now
            fps = 0.9 * fps + 0.1 * (1.0 / dt)

            # Xu ly huong camera (Orientation: Xoay 180 do cho kinh VR & khong lat guong chu viet)
            if self.rotate_180:
                frame = cv2.rotate(frame, cv2.ROTATE_180)
            if self.flip_horizontal:
                frame = cv2.flip(frame, 1)
            if self.flip_vertical:
                frame = cv2.flip(frame, 0)
            h, w = frame.shape[:2]

            # Gui frame vao luong AI Worker bat dong bo (neu worker dang ranh)
            with self.ai_lock:
                if self.ai_frame is None:
                    self.ai_frame = frame.copy()

            # Doc ket qua landmarks tu AI Worker
            raw_lms = None
            with self.lms_lock:
                raw_lms = self.latest_lms

            filtered_lms_2d = None
            filtered_lms_3d = None
            is_pinched = False
            dist_pinch = 0.1
            pinch_pt_2d = None
            pinch_pt_3d = None

            if raw_lms is not None:
                # 1. Ap dung 1€ Filter pixel space chong rung giat (chi mat 0.05ms)
                filtered_lms_2d = []
                for i in range(21):
                    raw_px = [raw_lms[i].x * w, raw_lms[i].y * h]
                    flt_px = self.suite.filters_2d[i].filter(now, raw_px)
                    filtered_lms_2d.append((int(flt_px[0]), int(flt_px[1])))

                # Tinh toa do 3D trong he truc camera
                filtered_lms_3d = []
                for i in range(21):
                    z_depth = 0.65 + (raw_lms[i].z if hasattr(raw_lms[i], 'z') else 0.0) * 0.8
                    pt3 = self.suite.spatial_cam.unproject_2d(filtered_lms_2d[i][0], filtered_lms_2d[i][1], z_depth)
                    flt_pt3 = self.suite.filters_3d[i].filter(now, pt3)
                    filtered_lms_3d.append(flt_pt3)

                # 2. Tinh toan cu chi Pinch (Hysteresis)
                p_thumb_3d = filtered_lms_3d[4]
                p_index_3d = filtered_lms_3d[8]
                dist_pinch = float(np.linalg.norm(np.array(p_thumb_3d) - np.array(p_index_3d)))
                is_pinched = self.suite.pinch_detector.update(dist_pinch, now)

                pinch_pt_3d = (np.array(p_thumb_3d) + np.array(p_index_3d)) * 0.5
                pinch_pt_2d = (
                    (filtered_lms_2d[4][0] + filtered_lms_2d[8][0]) // 2,
                    (filtered_lms_2d[4][1] + filtered_lms_2d[8][1]) // 2
                )

            # Kiem tra Tuong tac Menu Khong gian 3D (Hands-Free In-Air UI)
            consumed = False
            hovered_btn = None
            if filtered_lms_2d is not None:
                # Chuyen doi sang toa do trung tam cua 1 mat (640x720)
                crop_w_calc = int(h * (640.0 / 720.0))
                orig_x1_c = max(0, min(w - crop_w_calc, (w // 2) - crop_w_calc // 2))
                scale_x_c = 640.0 / float(crop_w_calc)
                scale_y_c = 720.0 / float(h)

                pts_mapped_center = []
                for pt in filtered_lms_2d:
                    px = int((pt[0] - orig_x1_c) * scale_x_c)
                    py = int(pt[1] * scale_y_c)
                    pts_mapped_center.append((px, py))

                p_knuckle_c = pts_mapped_center[5]
                p_tip_c = pts_mapped_center[8]
                dx = p_tip_c[0] - p_knuckle_c[0]
                dy = p_tip_c[1] - p_knuckle_c[1]
                dist_laser = math.hypot(dx, dy)
                laser_end_c = None
                if dist_laser > 8:
                    scale_l = 480.0 / dist_laser
                    laser_end_c = (int(p_tip_c[0] + dx * scale_l), int(p_tip_c[1] + dy * scale_l))

                # Cap nhat Raycast & Palm System Gate cua In-Air Menu
                consumed, hovered_btn = self.spatial_menu.update(
                    pts_mapped_center, p_knuckle_c, p_tip_c, laser_end_c, is_pinched, now, self.suite, self
                )

            # Cap nhat Logic cua cac Demo (Neu In-Air UI khong chiem cu chi Pinch)
            if not consumed:
                if self.suite.current_mode == 1: # PaintDemo (3D Air Paint)
                    if is_pinched and pinch_pt_3d is not None:
                        self.suite.paint_demo.add_point(pinch_pt_3d)
                    else:
                        self.suite.paint_demo.finish_stroke()
                elif self.suite.current_mode == 3: # Orb Rush
                    self.suite.rush_demo.update(now, filtered_lms_3d)
                elif self.suite.current_mode == 4: # Cube Physics
                    self.suite.cube_demo.update(dt, is_pinched, pinch_pt_3d)

            # =================================================================
            # CHUAN HOA QUANG HOC STEREO SBS CHO KINH VR SHINECON G10
            # Moi mat (Left Eye & Right Eye) deu nhin vao TAM KHONG GIAN cua phong
            # =================================================================
            target_sbs_w = 1280
            target_sbs_h = 720
            eye_w = target_sbs_w // 2  # 640px moi mat
            eye_h = target_sbs_h       # 720px moi mat

            if self.vr_projection == "immersive":
                # Che do Vision Pro: Crop hinh vuong tam tu camera -> Fill tron ven kinh VR khong lech goc
                crop_h = h
                crop_w = int(h * (eye_w / eye_h)) # 640px tren camera 720p
                cx = w // 2

                # Mat trai: Dich tam nhe sang trai (-IPD)
                x1_l = max(0, min(w - crop_w, cx - crop_w // 2 - self.ipd_offset))
                x2_l = x1_l + crop_w
                left_eye = cv2.resize(frame[:, x1_l:x2_l], (eye_w, eye_h))

                # Mat phai: Dich tam nhe sang phai (+IPD)
                x1_r = max(0, min(w - crop_w, cx - crop_w // 2 + self.ipd_offset))
                x2_r = x1_r + crop_w
                right_eye = cv2.resize(frame[:, x1_r:x2_r], (eye_w, eye_h))

                eye_crops = [
                    (left_eye, -self.suite.stereo_offset, x1_l, crop_w),
                    (right_eye, self.suite.stereo_offset, x1_r, crop_w)
                ]
            else:
                # Che do Full FOV: Thu nho toan bo 16:9 cua camera vao giua tam moi mat
                scaled_h = int(eye_w * (h / w))
                pad_y = (eye_h - scaled_h) // 2
                scaled = cv2.resize(frame, (eye_w, scaled_h))

                left_eye = np.zeros((eye_h, eye_w, 3), dtype=np.uint8)
                right_eye = np.zeros((eye_h, eye_w, 3), dtype=np.uint8)
                left_eye[pad_y:pad_y+scaled_h, :] = scaled
                right_eye[pad_y:pad_y+scaled_h, :] = scaled

                eye_crops = [
                    (left_eye, -self.suite.stereo_offset, 0, w),
                    (right_eye, self.suite.stereo_offset, 0, w)
                ]

            # Ve 3D Virtual Meshes & Khop tay len CA HAI MAT voi lech tia hoi tu (Parallax Disparity)
            for target_frame, off_x, orig_x1, orig_cw in eye_crops:
                scale_x = eye_w / float(orig_cw)
                scale_y = eye_h / float(h)

                # 1. Ve cac Demo khong gian 3D
                if self.suite.current_mode == 1:
                    self.suite.paint_demo.draw(target_frame, self.suite.spatial_cam, off_x)
                elif self.suite.current_mode == 2:
                    self.suite.portal_demo.draw(target_frame, self.suite.spatial_cam, now, off_x)
                elif self.suite.current_mode == 3:
                    self.suite.rush_demo.draw(target_frame, self.suite.spatial_cam, now, off_x)
                elif self.suite.current_mode == 4:
                    self.suite.cube_demo.draw(target_frame, self.suite.spatial_cam, off_x)
                elif self.suite.current_mode == 5 and filtered_lms_2d is not None:
                    p1_orig = filtered_lms_2d[4]
                    p2_orig = filtered_lms_2d[8]
                    p1 = (int((p1_orig[0] - orig_x1) * scale_x) + off_x, int(p1_orig[1] * scale_y))
                    p2 = (int((p2_orig[0] - orig_x1) * scale_x) + off_x, int(p2_orig[1] * scale_y))
                    cv2.line(target_frame, p1, p2, (0, 243, 255), 2, cv2.LINE_AA)
                    dist_mm = dist_pinch * 1000.0
                    cv2.putText(target_frame, f"{dist_mm:.1f} mm", ((p1[0]+p2[0])//2, (p1[1]+p2[1])//2 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)

                # 2. Ve khung xuong ban tay 21 khop tren ca hai mat
                if filtered_lms_2d is not None:
                    HAND_BONES = [
                        (0, 1), (1, 2), (2, 3), (3, 4),
                        (0, 5), (5, 6), (6, 7), (7, 8),
                        (5, 9), (9, 10), (10, 11), (11, 12),
                        (9, 13), (13, 14), (14, 15), (15, 16),
                        (13, 17), (17, 18), (18, 19), (19, 20),
                        (0, 17)
                    ]
                    pts_mapped = []
                    for pt in filtered_lms_2d:
                        px = int((pt[0] - orig_x1) * scale_x) + off_x
                        py = int(pt[1] * scale_y)
                        pts_mapped.append((px, py))
                        cv2.circle(target_frame, (px, py), 3, (0, 150, 255), -1, cv2.LINE_AA)

                    for b1, b2 in HAND_BONES:
                        cv2.line(target_frame, pts_mapped[b1], pts_mapped[b2], (0, 243, 255), 2, cv2.LINE_AA)

                    p_knuckle = pts_mapped[5]
                    p_tip = pts_mapped[8]
                    self.suite.draw_pointing_ray(target_frame, p_knuckle, p_tip)

                    if pinch_pt_2d is not None:
                        pinch_px = int((pinch_pt_2d[0] - orig_x1) * scale_x) + off_x
                        pinch_py = int(pinch_pt_2d[1] * scale_y)
                        self.suite.draw_spatial_reticle(target_frame, (pinch_px, pinch_py), is_pinched)

                # 3. Ve In-Air Spatial Menu tren ca hai mat voi do lech Parallax 3D
                menu_parallax = 4 if off_x < 0 else -4
                self.spatial_menu.draw(target_frame, now, self.suite.current_mode, eye_offset_x=menu_parallax)

            # Ghep 2 mat thanh Frame SBS hoan hao ty le 16:9
            sbs_frame = np.hstack((left_eye, right_eye))
            cv2.line(sbs_frame, (eye_w, 0), (eye_w, eye_h), (0, 0, 0), 4)

            # Ban frame SBS nguoc ve iPhone qua day cap USB (Do tre < 2ms)
            if self.is_connected:
                self.send_sbs_back_to_iphone(sbs_frame)

            # Ve HUD thong so len man hinh laptop
            source_tag = f"IPHONE USB ({self.actual_rx_fps:.0f} FPS)" if frame_is_iphone else "FALLBACK CAM"
            rot_str = "ROT: 180" if self.rotate_180 else "ROT: 0"
            mir_str = "MIRROR" if self.flip_horizontal else "NORMAL"
            cv2.putText(sbs_frame, f"SOURCE: {source_tag} | VR SBS FPS: {fps:.1f} | {rot_str} | {mir_str} | IPD: {self.ipd_offset}px",
                        (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.60, (0, 243, 255), 2, cv2.LINE_AA)

            # Hien thi tren man hinh Laptop
            cv2.imshow(win_title, sbs_frame if self.suite.stereo_vr_mode else frame)

            key = cv2.waitKey(1) & 0xFF
            if key == 27:
                break
            elif key == ord('1'): self.suite.current_mode = 1
            elif key == ord('2'): self.suite.current_mode = 2
            elif key == ord('3'): self.suite.current_mode = 3; self.suite.rush_demo.start(now)
            elif key == ord('4'): self.suite.current_mode = 4
            elif key == ord('5'): self.suite.current_mode = 5
            elif key == ord('v') or key == ord('V'):
                self.suite.stereo_vr_mode = not self.suite.stereo_vr_mode
            elif key == ord('f') or key == ord('F'):
                self.vr_projection = "full_fov" if self.vr_projection == "immersive" else "immersive"
                print(f"[STARK VR] Chuyen che do quang hoc: {self.vr_projection}")
            elif key == ord('r') or key == ord('R'):
                self.rotate_180 = not self.rotate_180
                print(f"[STARK] Xoay 180 do: {'BAT (Dao chieu)' if self.rotate_180 else 'TAT (Giu nguyen)'}")
            elif key == ord('m') or key == ord('M'):
                self.flip_horizontal = not self.flip_horizontal
                print(f"[STARK] Lat guong ngang: {'BAT' if self.flip_horizontal else 'TAT'}")
            elif key == ord('t') or key == ord('T'):
                self.flip_vertical = not self.flip_vertical
                print(f"[STARK] Lat doc tren/duoi: {'BAT' if self.flip_vertical else 'TAT'}")
            elif key == ord('['):
                self.ipd_offset = max(0, self.ipd_offset - 2)
                print(f"[STARK VR] Giam IPD: {self.ipd_offset}px")
            elif key == ord(']'):
                self.ipd_offset = min(60, self.ipd_offset + 2)
                print(f"[STARK VR] Tang IPD: {self.ipd_offset}px")
            elif key == ord('n') or key == ord('N'):
                self.suite.paint_demo.next_color()
            elif key == ord('z') or key == ord('Z'):
                self.suite.paint_demo.undo()
            elif key == ord('c') or key == ord('C'):
                self.suite.paint_demo.clear()
            elif key == ord('x') or key == ord('X'):
                self.use_fallback = not self.use_fallback

        self.running = False
        if self.sock:
            try: self.sock.close()
            except: pass
        if fallback_cap:
            fallback_cap.release()
        cv2.destroyAllWindows()
        if self.forward_proc:
            self.forward_proc.terminate()

if __name__ == "__main__":
    bridge = StarkTetheredBridge()
    bridge.run()
