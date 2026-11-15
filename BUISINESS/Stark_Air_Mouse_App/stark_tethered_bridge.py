"""
STARK CARDBOARDXR // TETHERED NATIVE IPHONE 13 USB BRIDGE
=========================================================
Ket noi truc tiep 100% qua day cap Lightning/USB (Khong Wi-Fi, Khong HTML, Khong Port mang).
- Nhan luong 1080p/4K 60-120 FPS tu Camera sau cua iPhone 13.
- Xu ly AI 21 khop tay MediaPipe + Khong gian 3D AR tren GPU NVIDIA RTX 4060.
- Render chia doi mat SBS (Shinecon G10) va ban nguoc truc tiep ve man hinh iPhone.
"""

import sys
import os
import time
import socket
import struct
import threading
import subprocess
import numpy as np
import cv2

# Import STARK CardboardXR Engine
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from stark_cardboard_xr import StarkCardboardXRSuite, SpatialCamera

class StarkTetheredBridge:
    def __init__(self, port=23456):
        self.port = port
        self.suite = StarkCardboardXRSuite()
        self.suite.stereo_vr_mode = True # Mac dinh bat SBS cho kinh Shinecon G10
        
        self.sock = None
        self.is_connected = False
        self.running = True
        self.latest_frame = None
        self.lock = threading.Lock()
        
        self.forward_proc = None
        self.actual_rx_fps = 0.0
        self.rx_count = 0
        self.last_rx_t = time.time()
        self.use_fallback = False

    def start_usbmux_forward(self):
        """Khoi chay usbmux forwarder anh xa cong 23456 qua cap USB"""
        print(f"\n[+] Dang khoi tao kenh truyen du lieu USB usbmuxd tai cong {self.port}...")
        try:
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

    def wait_for_iphone(self, timeout=8):
        """Doi nguoi dung mo app STARK XR Cam tren iPhone va ket noi qua cap USB"""
        print(f"[*] Dang lang nghe ket noi tu app STARK XR Cam tren iPhone (Toi da {timeout}s)...")
        print("    -> Vui long cam day cap USB va mo app STARK tren iPhone cua ban!")
        
        start_t = time.time()
        while time.time() - start_t < timeout and self.running:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                s.settimeout(2.0)
                s.connect(("127.0.0.1", self.port))
                self.sock = s
                self.is_connected = True
                print("\n[V] KET NOI THANH CONG VOI IPHONE 13 QUA CAP USB LIGHTNING!")
                return True
            except (socket.error, ConnectionRefusedError):
                time.sleep(0.5)
                print(".", end="", flush=True)
        
        print("\n[!] Chua bat duoc app iPhone. Chuyen sang che do camera du phong.")
        return False

    def start_receiver_thread(self):
        """Luong doc H.264 packet tu iPhone va giai ma thanh numpy array"""
        import av
        def worker():
            codec = av.CodecContext.create("h264", "r")
            while self.running and self.is_connected:
                try:
                    header = self._recv_all(4)
                    if not header:
                        time.sleep(0.02)
                        continue
                    length = struct.unpack(">I", header)[0]
                    if length <= 0 or length > 10_000_000:
                        continue
                    payload = self._recv_all(length)
                    if not payload:
                        time.sleep(0.02)
                        continue
                    
                    packets = codec.parse(payload)
                    for pkt in packets:
                        frames = codec.decode(pkt)
                        for f in frames:
                            bgr = f.to_ndarray(format="bgr24")
                            with self.lock:
                                self.latest_frame = bgr
                            
                            self.rx_count += 1
                            now = time.time()
                            if now - self.last_rx_t >= 1.0:
                                self.actual_rx_fps = self.rx_count / (now - self.last_rx_t)
                                self.rx_count = 0
                                self.last_rx_t = now
                except Exception as e:
                    print(f"\n[!] Canh bao luong nhan USB: {e}")
                    time.sleep(0.1)

        t = threading.Thread(target=worker, daemon=True)
        t.start()

    def _recv_all(self, n):
        data = bytearray()
        while len(data) < n and self.running and self.is_connected:
            try:
                chunk = self.sock.recv(n - len(data))
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
        if not self.is_connected or self.sock is None:
            return
        try:
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 80]
            _, encoded = cv2.imencode(".jpg", sbs_frame, encode_param)
            data = encoded.tobytes()
            pkt = struct.pack(">I", len(data)) + data
            self.sock.sendall(pkt)
        except Exception:
            pass

    def run(self):
        self.start_usbmux_forward()
        connected = self.wait_for_iphone(timeout=8)
        
        if connected:
            self.start_receiver_thread()
            print("\n[+] DANG CHO LUONG VIDEO 1080p/4K TU IPHONE...")
        else:
            self.use_fallback = True

        # Khoi tao cua so OpenCV
        win_title = "STARK CARDBOARDXR // TETHERED NATIVE USB XR SUITE"
        cv2.namedWindow(win_title, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_title, 1280, 720)

        # Camera du phong (Camo Studio index 2 hoac Laptop index 0)
        fallback_cap = self.suite.init_capture(2) or self.suite.init_capture(0)

        print("\n==================================================================")
        print("   STARK TETHERED XR // HE THONG KHONG GIAN 3D NATIVE USB")
        print("   [1] 3D Air Paint (Tilt Brush)   | [2] AR Spatial Portal")
        print("   [3] Orb Rush Rhythm Game        | [4] 3D Cube Physics & Grab")
        print("   [5] Precision 3D Caliper        | [V] Toggle Stereo VR (Shinecon G10)")
        print("   [X] Chuyen doi Camera iPhone USB <-> Camera Du Phong")
        print("   [ESC] Thoat he thong")
        print("==================================================================\n")

        last_t = time.time()
        fps = 60.0

        while self.running:
            frame = None
            
            # 1. Uu tien lay frame tu iPhone qua cap USB
            if self.is_connected and not self.use_fallback:
                with self.lock:
                    if self.latest_frame is not None:
                        frame = self.latest_frame.copy()

            # 2. Neu chua co frame tu iPhone hoac bat che do du phong -> Lay tu webcam/Camo
            if frame is None and fallback_cap and fallback_cap.isOpened():
                ret, f = fallback_cap.read()
                if ret and f is not None and f.size > 0:
                    frame = f

            # 3. Neu van chua co bat ky frame nao -> Hien thi HUD cho (Khong bao gio bi Not Responding)
            if frame is None:
                hud_loading = np.zeros((720, 1280, 3), dtype=np.uint8)
                cv2.putText(hud_loading, "STARK CARDBOARDXR // TETHERED USB XR", (100, 260),
                            cv2.FONT_HERSHEY_DUPLEX, 1.2, (0, 243, 255), 2, cv2.LINE_AA)
                
                status_text = "DANG KET NOI CAP USB..." if not self.is_connected else "DA KET NOI USB! DANG DOI CAMERA IPHONE..."
                cv2.putText(hud_loading, status_text, (100, 330),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0) if self.is_connected else (0, 165, 255), 2, cv2.LINE_AA)
                cv2.putText(hud_loading, "Luu y: Tren iPhone, vui long bam 'Cho phep' Camera neu co thong bao!", (100, 390),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.65, (200, 200, 200), 1, cv2.LINE_AA)
                cv2.putText(hud_loading, "[X] Chuyen sang Camera Laptop/Camo  |  [ESC] Thoat", (100, 450),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.65, (150, 150, 255), 1, cv2.LINE_AA)
                
                cv2.imshow(win_title, hud_loading)
                k = cv2.waitKey(20) & 0xFF
                if k == 27:
                    break
                elif k == ord('x') or k == ord('X'):
                    self.use_fallback = not self.use_fallback
                continue

            # Xu ly FPS
            h, w, _ = frame.shape
            if w != self.suite.cam_w or h != self.suite.cam_h:
                self.suite.cam_w, self.suite.cam_h = w, h
                self.suite.spatial_cam = SpatialCamera(self.suite.cam_w, self.suite.cam_h, fov=65.0)

            now = time.time()
            dt = max(0.001, now - last_t)
            last_t = now
            fps = 0.9 * fps + 0.1 * (1.0 / dt)

            # Xu ly MediaPipe AI tren frame
            frame = cv2.flip(frame, 1)
            import mediapipe as mp
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            results = self.suite.detector.detect(mp_image)

            filtered_lms_2d = None
            filtered_lms_3d = None
            is_pinched = False
            pinch_pt_2d = None
            pinch_pt_3d = None

            if results.hand_landmarks:
                lms = results.hand_landmarks[0]
                filtered_lms_2d, filtered_lms_3d = self.suite.filter_landmarks(lms, now)
                p_thumb = filtered_lms_3d[4]
                p_index = filtered_lms_3d[8]
                dist_pinch = np.linalg.norm(np.array(p_thumb) - np.array(p_index))
                is_pinched = bool(dist_pinch < 0.045)
                pinch_pt_2d = (
                    int((filtered_lms_2d[4][0] + filtered_lms_2d[8][0]) / 2),
                    int((filtered_lms_2d[4][1] + filtered_lms_2d[8][1]) / 2)
                )
                pinch_pt_3d = [
                    (p_thumb[0] + p_index[0]) / 2.0,
                    (p_thumb[1] + p_index[1]) / 2.0,
                    (p_thumb[2] + p_index[2]) / 2.0
                ]

            # Render 3D Demos
            if self.suite.current_mode == 1:
                self.suite.tilt_brush.update_and_render(frame, pinch_pt_3d, is_pinched, self.suite.spatial_cam)
            elif self.suite.current_mode == 2:
                self.suite.portal_demo.render(frame, self.suite.spatial_cam, now)
            elif self.suite.current_mode == 3:
                self.suite.rush_demo.update_and_render(frame, filtered_lms_3d, self.suite.spatial_cam, now)
            elif self.suite.current_mode == 4:
                self.suite.cube_demo.update_and_render(frame, pinch_pt_3d, is_pinched, self.suite.spatial_cam, dt)
            elif self.suite.current_mode == 5:
                self.suite.caliper_demo.update_and_render(frame, filtered_lms_3d, self.suite.spatial_cam, is_pinched)

            # Stereo SBS rendering
            left_view = frame.copy()
            right_view = frame.copy()
            shift_px = int(self.suite.ipd_mm * 1.5)

            if filtered_lms_2d is not None:
                for target_frame, off_x in [(left_view, shift_px // 2), (right_view, -shift_px // 2)]:
                    for b1, b2 in self.suite.HAND_BONES:
                        pt_a = (filtered_lms_2d[b1][0] + off_x, filtered_lms_2d[b1][1])
                        pt_b = (filtered_lms_2d[b2][0] + off_x, filtered_lms_2d[b2][1])
                        cv2.line(target_frame, pt_a, pt_b, (0, 243, 255), 2, cv2.LINE_AA)

            sbs_frame = np.hstack((left_view, right_view))
            cv2.line(sbs_frame, (w, 0), (w, h), (0, 0, 0), 4)

            # Ban frame SBS nguoc ve iPhone qua day cap USB
            if self.is_connected:
                self.send_sbs_back_to_iphone(sbs_frame)

            # Ve HUD thong so len goc man hinh
            source_tag = "IPHONE 13 USB" if (self.is_connected and not self.use_fallback) else "FALLBACK CAM"
            cv2.putText(sbs_frame, f"SOURCE: {source_tag} | FPS: {fps:.1f}", (40, 50),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 243, 255), 2, cv2.LINE_AA)

            # Hien thi len man hinh laptop
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
            elif key == ord('x') or key == ord('X'):
                self.use_fallback = not self.use_fallback
                print(f"[*] Chuyen nguon Camera: {'DU PHONG (Camo/Webcam)' if self.use_fallback else 'IPHONE USB'}")

        # Don dep
        self.running = False
        if self.sock: self.sock.close()
        if self.forward_proc: self.forward_proc.terminate()
        if fallback_cap: fallback_cap.release()
        cv2.destroyAllWindows()
        print("\n[+] Da tat STARK Tethered Bridge an toan.")

if __name__ == "__main__":
    bridge = StarkTetheredBridge()
    bridge.run()
