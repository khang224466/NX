"""
STARK SPATIAL STREAM SERVER v1.0 PRO
Closed-Loop Tethered Spatial XR Engine for iPhone & Shinecon G10 Headset
- Receives Phone Rear Camera stream via WSS (WebSocket Secure)
- Runs MediaPipe Hands 3D Landmark & Gesture Analysis on Laptop RTX GPU
- Renders Stereoscopic 3D Side-by-Side (SBS) Holograms & Caliper
- Streams processed Spatial Passthrough back to iPhone at 60 FPS
"""

import os
import sys
import time
import math
import ssl
import json
import socket
import struct
import hashlib
import base64
import threading
import http.server
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Win32 SendInput for Roamies JARVIS Integration
import ctypes
from ctypes import wintypes

user32 = ctypes.windll.user32
INPUT_KEYBOARD = 1
KEYEVENTF_KEYUP = 0x0002

class KEYBDINPUT(ctypes.Structure):
    _fields_ = (
        ("wVk", wintypes.WORD),
        ("wScan", wintypes.WORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong))
    )

class INPUT_I(ctypes.Union):
    _fields_ = [("ki", KEYBDINPUT)]

class INPUT(ctypes.Structure):
    _fields_ = [("type", wintypes.DWORD), ("ii", INPUT_I)]

def press_key(vk):
    inp = INPUT()
    inp.type = INPUT_KEYBOARD
    inp.ii.ki.wVk = vk
    inp.ii.ki.wScan = user32.MapVirtualKeyW(vk, 0)
    inp.ii.ki.dwFlags = 0
    user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

def release_key(vk):
    inp = INPUT()
    inp.type = INPUT_KEYBOARD
    inp.ii.ki.wVk = vk
    inp.ii.ki.wScan = user32.MapVirtualKeyW(vk, 0)
    inp.ii.ki.dwFlags = KEYEVENTF_KEYUP
    user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

def trigger_jarvis_snap():
    """Goi Roamies JARVIS chup man hinh & hoi AI (Ctrl + Shift + A)"""
    press_key(0x11) # Ctrl
    press_key(0x10) # Shift
    press_key(ord('A'))
    release_key(ord('A'))
    release_key(0x10)
    release_key(0x11)
    print("[JARVIS] -> Kich hoat Roamies AI Snap (Ctrl+Shift+A)!")

# Khoi tao MediaPipe HandLandmarker Tasks API (Tuong thich MediaPipe 1.2+ va Python 3.12)
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hand_landmarker.task")
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = r"d:\BUISINESS\Stark_Air_Mouse_App\hand_landmarker.task"

base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.IMAGE,
    num_hands=2,
    min_hand_detection_confidence=0.55,
    min_tracking_confidence=0.55
)
hands_detector = vision.HandLandmarker.create_from_options(options)

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),        # Ngon cai
    (0, 5), (5, 6), (6, 7), (7, 8),        # Ngon tro
    (5, 9), (9, 10), (10, 11), (11, 12),   # Ngon giua
    (9, 13), (13, 14), (14, 15), (15, 16), # Ngon ap ut
    (13, 17), (17, 18), (18, 19), (19, 20),# Ngon ut
    (0, 17)                                # Day long ban tay
]

def draw_spatial_hand(frame, lms, w, h, offset_x=0):
    pts = [(int(lm.x * w) + offset_x, int(lm.y * h)) for lm in lms]
    for p1, p2 in HAND_CONNECTIONS:
        cv2.line(frame, pts[p1], pts[p2], (0, 243, 255), 2, cv2.LINE_AA)
    for pt in pts:
        cv2.circle(frame, pt, 3, (0, 150, 255), -1, cv2.LINE_AA)

# Bien trang thai khong gian
caliper_mode = True
radial_menu_active = False
radial_hold_start = 0.0
radial_sel_idx = None
radial_sel_start = 0.0
radial_cooldown = 0.0

def draw_spatial_caliper(frame, lms, world_lms, w, h, offset_x=0):
    """Ve thuoc do dien tu khong gian 3D giua ngon cai va ngon tro (mm / cm)"""
    p_thumb = (int(lms[4].x * w) + offset_x, int(lms[4].y * h))
    p_tip = (int(lms[8].x * w) + offset_x, int(lms[8].y * h))

    dx = world_lms[4].x - world_lms[8].x
    dy = world_lms[4].y - world_lms[8].y
    dz = world_lms[4].z - world_lms[8].z
    dist_m = math.sqrt(dx * dx + dy * dy + dz * dz)
    dist_mm = dist_m * 1000.0
    dist_cm = dist_m * 100.0

    vec_x = p_tip[0] - p_thumb[0]
    vec_y = p_tip[1] - p_thumb[1]
    seg_len = math.hypot(vec_x, vec_y)

    if seg_len > 1.0:
        nx = -vec_y / seg_len
        ny = vec_x / seg_len
        jaw_len = 14

        j1_a = (int(p_thumb[0] + nx * jaw_len), int(p_thumb[1] + ny * jaw_len))
        j1_b = (int(p_thumb[0] - nx * jaw_len), int(p_thumb[1] - ny * jaw_len))
        cv2.line(frame, j1_a, j1_b, (0, 243, 255), 2, cv2.LINE_AA)

        j2_a = (int(p_tip[0] + nx * jaw_len), int(p_tip[1] + ny * jaw_len))
        j2_b = (int(p_tip[0] - nx * jaw_len), int(p_tip[1] - ny * jaw_len))
        cv2.line(frame, j2_a, j2_b, (0, 243, 255), 2, cv2.LINE_AA)
        cv2.line(frame, p_thumb, p_tip, (0, 215, 255), 2, cv2.LINE_AA)

    mid_x = (p_thumb[0] + p_tip[0]) // 2
    mid_y = (p_thumb[1] + p_tip[1]) // 2

    badge_w, badge_h = 135, 24
    bx1 = mid_x - badge_w // 2
    by1 = mid_y - 28
    bx2 = bx1 + badge_w
    by2 = by1 + badge_h

    cv2.rectangle(frame, (bx1, by1), (bx2, by2), (20, 30, 40), -1)
    cv2.rectangle(frame, (bx1, by1), (bx2, by2), (0, 243, 255), 1, cv2.LINE_AA)
    cv2.circle(frame, p_thumb, 4, (0, 255, 0), -1, cv2.LINE_AA)
    cv2.circle(frame, p_tip, 4, (0, 255, 0), -1, cv2.LINE_AA)

    label = f"{dist_mm:.1f} mm | {dist_cm:.1f} cm"
    cv2.putText(frame, label, (bx1 + 8, by1 + 16),
                cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 255, 255), 1, cv2.LINE_AA)

def draw_arc_reactor_hologram(frame, cx, cy, t_sec, offset_x=0):
    """Ve Lõi Arc Reactor 3D quay tron lơ lửng trong không gian"""
    cx = cx + offset_x
    # Vòng tròn năng lượng bên ngoài
    r_outer = 55
    cv2.circle(frame, (cx, cy), r_outer, (0, 243, 255), 2, cv2.LINE_AA)
    cv2.circle(frame, (cx, cy), r_outer + 8, (0, 180, 220), 1, cv2.LINE_AA)

    # 10 chấu năng lượng quay tròn
    num_spokes = 10
    angle_offset = (t_sec * 45.0) % 360.0
    for i in range(num_spokes):
        ang = math.radians(angle_offset + i * (360.0 / num_spokes))
        x1 = int(cx + math.cos(ang) * 22)
        y1 = int(cy + math.sin(ang) * 22)
        x2 = int(cx + math.cos(ang) * r_outer)
        y2 = int(cy + math.sin(ang) * r_outer)
        cv2.line(frame, (x1, y1), (x2, y2), (0, 255, 255), 2, cv2.LINE_AA)

    # Lõi sáng trung tâm
    cv2.circle(frame, (cx, cy), 18, (20, 30, 40), -1)
    cv2.circle(frame, (cx, cy), 18, (0, 243, 255), 2, cv2.LINE_AA)
    cv2.circle(frame, (cx, cy), 8, (255, 255, 255), -1, cv2.LINE_AA)
    cv2.putText(frame, "STARK", (cx - 15, cy + 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.30, (0, 243, 255), 1, cv2.LINE_AA)

def draw_spatial_hologram_cube(frame, cx, cy, cz, size, t_sec, offset_x=0):
    """Ve khoi lap phuong Hologram 3D xoay trong khong gian can phong (CardboardXR style)"""
    nodes = np.array([
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1]
    ], dtype=float) * size

    ang_y = t_sec * 0.8
    ang_x = t_sec * 0.5
    rot_y = np.array([
        [math.cos(ang_y), 0, math.sin(ang_y)],
        [0, 1, 0],
        [-math.sin(ang_y), 0, math.cos(ang_y)]
    ])
    rot_x = np.array([
        [1, 0, 0],
        [0, math.cos(ang_x), -math.sin(ang_x)],
        [0, math.sin(ang_x), math.cos(ang_x)]
    ])
    rot_nodes = nodes @ rot_x.T @ rot_y.T

    focal = 350.0
    pts = []
    for node in rot_nodes:
        z = node[2] + cz
        if z <= 10: z = 10
        px = int(cx + offset_x + (node[0] * focal) / z)
        py = int(cy + (node[1] * focal) / z)
        pts.append((px, py))

    edges = [
        (0,1), (1,2), (2,3), (3,0),
        (4,5), (5,6), (6,7), (7,4),
        (0,4), (1,5), (2,6), (3,7)
    ]
    for p1, p2 in edges:
        cv2.line(frame, pts[p1], pts[p2], (0, 243, 255), 2, cv2.LINE_AA)
    for pt in pts:
        cv2.circle(frame, pt, 3, (0, 255, 255), -1, cv2.LINE_AA)

def draw_pointing_ray(frame, p_knuckle, p_tip, offset_x=0):
    """Ve tia laser chi dinh khong gian (Pointing Ray) tu dau ngon tay tro"""
    kx, ky = p_knuckle[0] + offset_x, p_knuckle[1]
    tx, ty = p_tip[0] + offset_x, p_tip[1]
    dx = tx - kx
    dy = ty - ky
    dist = math.hypot(dx, dy)
    if dist > 5:
        scale = 220.0 / dist
        end_x = int(tx + dx * scale)
        end_y = int(ty + dy * scale)
        cv2.line(frame, (tx, ty), (end_x, end_y), (0, 255, 200), 2, cv2.LINE_AA)
        cv2.circle(frame, (end_x, end_y), 5, (0, 255, 255), -1, cv2.LINE_AA)
        cv2.circle(frame, (end_x, end_y), 8, (0, 255, 200), 1, cv2.LINE_AA)

def process_spatial_frame(frame_bytes):
    """Xu ly khung hinh camera tu iPhone va tao khong gian 3D Stereo 2 mat (SBS)"""
    global caliper_mode, radial_menu_active, radial_hold_start, radial_sel_idx, radial_sel_start, radial_cooldown

    nparr = np.frombuffer(frame_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if frame is None:
        return None

    h, w, _ = frame.shape
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    results = hands_detector.detect(mp_image)

    now = time.time()

    left_eye = frame.copy()
    right_eye = frame.copy()

    # Do lech 3D Stereoscopic giua 2 mat
    stereo_offset = 12

    # Ve Lõi Arc Reactor 3D o goc tren
    reactor_cx, reactor_cy = w // 2, 85
    draw_arc_reactor_hologram(left_eye, reactor_cx, reactor_cy, now, offset_x=-stereo_offset)
    draw_arc_reactor_hologram(right_eye, reactor_cx, reactor_cy, now, offset_x=stereo_offset)

    # Ve khoi lap phuong Hologram 3D lo lung giua phong (CardboardXR style)
    cube_cx, cube_cy = w // 2, h // 2 + 30
    draw_spatial_hologram_cube(left_eye, cube_cx, cube_cy, 280, 50, now, offset_x=-stereo_offset)
    draw_spatial_hologram_cube(right_eye, cube_cx, cube_cy, 280, 50, now, offset_x=stereo_offset)

    if results.hand_landmarks:
        for idx, lms in enumerate(results.hand_landmarks):
            world_lms = results.hand_world_landmarks[idx] if results.hand_world_landmarks else None

            # Ve khop tay cyberpunk 3D
            draw_spatial_hand(left_eye, lms, w, h, offset_x=-stereo_offset)
            draw_spatial_hand(right_eye, lms, w, h, offset_x=stereo_offset)

            p_thumb = (int(lms[4].x * w), int(lms[4].y * h))
            p_knuckle = (int(lms[5].x * w), int(lms[5].y * h))
            p_tip = (int(lms[8].x * w), int(lms[8].y * h))
            pinch_dist = math.hypot(p_tip[0] - p_thumb[0], p_tip[1] - p_thumb[1])

            # Ve Tia Laser chi dinh khong gian (Pointing Ray)
            draw_pointing_ray(left_eye, p_knuckle, p_tip, offset_x=-stereo_offset)
            draw_pointing_ray(right_eye, p_knuckle, p_tip, offset_x=stereo_offset)

            # Hieu ung Chop sang tia nang luong khi Pinch (Chum 2 dau ngon tay)
            if pinch_dist < 32:
                mid_x = (p_thumb[0] + p_tip[0]) // 2
                mid_y = (p_thumb[1] + p_tip[1]) // 2
                for target_eye, off in [(left_eye, -stereo_offset), (right_eye, stereo_offset)]:
                    px = mid_x + off
                    cv2.circle(target_eye, (px, mid_y), 10, (255, 255, 255), -1, cv2.LINE_AA)
                    cv2.circle(target_eye, (px, mid_y), 18, (0, 243, 255), 2, cv2.LINE_AA)
                    cv2.putText(target_eye, "PINCH / GRAB", (px + 22, mid_y + 5),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 1, cv2.LINE_AA)

            # Thuoc do Caliper 3D
            if caliper_mode and world_lms:
                draw_spatial_caliper(left_eye, lms, world_lms, w, h, offset_x=-stereo_offset)
                draw_spatial_caliper(right_eye, lms, world_lms, w, h, offset_x=stereo_offset)

            # Nhan dien xoe ban tay (Flat Palm) de goi JARVIS
            is_flat_palm = (lms[8].y < lms[6].y and lms[12].y < lms[10].y and lms[16].y < lms[14].y and lms[20].y < lms[18].y)
            if is_flat_palm:
                if radial_hold_start == 0.0:
                    radial_hold_start = now
                elif (now - radial_hold_start) > 0.40 and (now - radial_cooldown) > 2.0:
                    radial_cooldown = now
                    trigger_jarvis_snap()
                    cv2.putText(left_eye, "JARVIS ANALYZING...", (w//2 - 60, h - 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
                    cv2.putText(right_eye, "JARVIS ANALYZING...", (w//2 - 60, h - 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            else:
                radial_hold_start = 0.0

    sbs_frame = np.hstack((left_eye, right_eye))
    divider_x = w
    cv2.line(sbs_frame, (divider_x, 0), (divider_x, h), (0, 0, 0), 4)

    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 75]
    _, buffer = cv2.imencode('.jpg', sbs_frame, encode_params)
    return buffer.tobytes()

# Vong lap doc frame tu iPhone -> Laptop GPU xu ly -> Tra ve SBS
def ws_stream_loop(conn, addr):
    print(f"[*] Bat dau xu ly Spatial Streaming cho {addr}...")
    buffer = b""
    while True:
        try:
            while len(buffer) < 2:
                chunk = conn.recv(65536)
                if not chunk:
                    return
                buffer += chunk

            b1, b2 = buffer[0], buffer[1]
            opcode = b1 & 0x0f
            if opcode == 8: # Close frame
                break

            masked = (b2 & 0x80) != 0
            payload_len = b2 & 0x7f
            idx = 2

            if payload_len == 126:
                while len(buffer) < idx + 2:
                    chunk = conn.recv(65536)
                    if not chunk: return
                    buffer += chunk
                payload_len = struct.unpack("!H", buffer[idx:idx+2])[0]
                idx += 2
            elif payload_len == 127:
                while len(buffer) < idx + 8:
                    chunk = conn.recv(65536)
                    if not chunk: return
                    buffer += chunk
                payload_len = struct.unpack("!Q", buffer[idx:idx+8])[0]
                idx += 8

            mask_key = None
            if masked:
                while len(buffer) < idx + 4:
                    chunk = conn.recv(65536)
                    if not chunk: return
                    buffer += chunk
                mask_key = buffer[idx:idx+4]
                idx += 4

            while len(buffer) < idx + payload_len:
                chunk = conn.recv(65536)
                if not chunk: return
                buffer += chunk

            payload = buffer[idx:idx+payload_len]
            buffer = buffer[idx+payload_len:]

            if masked and mask_key:
                payload = bytes(b ^ mask_key[i % 4] for i, b in enumerate(payload))

            # Xu ly Spatial Computing tren Laptop GPU
            processed_sbs = process_spatial_frame(payload)
            if processed_sbs:
                p_len = len(processed_sbs)
                header = bytearray([0x82]) # FIN + Binary
                if p_len < 126:
                    header.append(p_len)
                elif p_len <= 65535:
                    header.append(126)
                    header.extend(struct.pack("!H", p_len))
                else:
                    header.append(127)
                    header.extend(struct.pack("!Q", p_len))

                conn.sendall(header + processed_sbs)

        except Exception as e:
            break

    conn.close()
    print(f"[-] iPhone ngat ket noi Spatial Streaming: {addr}")

# WebSocket Standalone Handler (Port 8765)
def ws_handle_client(conn, addr):
    headers = {}
    buf = b""
    while b"\r\n\r\n" not in buf:
        chunk = conn.recv(1024)
        if not chunk:
            return
        buf += chunk

    header_data, rest = buf.split(b"\r\n\r\n", 1)
    for line in header_data.decode("latin1").split("\r\n")[1:]:
        if ":" in line:
            k, v = line.split(":", 1)
            headers[k.strip().lower()] = v.strip()

    sec_key = headers.get("sec-websocket-key")
    if not sec_key:
        conn.close()
        return

    magic = b"258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    accept_val = base64.b64encode(hashlib.sha1(sec_key.encode() + magic).digest()).decode()
    handshake = (
        "HTTP/1.1 101 Switching Protocols\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        f"Sec-WebSocket-Accept: {accept_val}\r\n\r\n"
    )
    conn.sendall(handshake.encode("latin1"))
    ws_stream_loop(conn, addr)

# Unified HTTPS + WSS Handler (Port 8443)
class SpatialUnifiedHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.headers.get("Upgrade", "").lower() == "websocket":
            sec_key = self.headers.get("Sec-WebSocket-Key")
            if not sec_key:
                self.send_error(400, "Missing Sec-WebSocket-Key")
                return

            magic = b"258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
            accept_val = base64.b64encode(hashlib.sha1(sec_key.encode() + magic).digest()).decode()
            handshake = (
                "HTTP/1.1 101 Switching Protocols\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                f"Sec-WebSocket-Accept: {accept_val}\r\n\r\n"
            )
            self.wfile.write(handshake.encode("latin1"))
            self.wfile.flush()
            print(f"[+] Client nang cap len WSS tren cong 8443: {self.client_address}")
            ws_stream_loop(self.connection, self.client_address)
        else:
            super().do_GET()

def run_ws_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("0.0.0.0", 8765))
    server.listen(5)

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(
        certfile=r"d:\BUISINESS\Stark_Air_Mouse_App\server_cert.pem",
        keyfile=r"d:\BUISINESS\Stark_Air_Mouse_App\server_key.pem"
    )

    print("[*] Secure WebSocket Server (WSS) dang lang nghe tren cong 8765...")
    while True:
        try:
            raw_conn, addr = server.accept()
            conn = context.wrap_socket(raw_conn, server_side=True)
            t = threading.Thread(target=ws_handle_client, args=(conn, addr), daemon=True)
            t.start()
        except Exception:
            continue

def run_https_server():
    web_dir = r"d:\BUISINESS\Stark_Air_Mouse_App"
    os.chdir(web_dir)
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", 8443), SpatialUnifiedHandler)

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(
        certfile=r"d:\BUISINESS\Stark_Air_Mouse_App\server_cert.pem",
        keyfile=r"d:\BUISINESS\Stark_Air_Mouse_App\server_key.pem"
    )
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    print("[*] Unified HTTPS + WSS Server dang lang nghe tai cong 8443...")
    httpd.serve_forever()

if __name__ == "__main__":
    print("=" * 70)
    print("   STARK SPATIAL XR ENGINE // CLOSED-LOOP STREAMING CORE")
    print("   Laptop Legion RTX 4060 <-> iPhone 13 Shinecon G10 Headset")
    print("=" * 70)

    t_http = threading.Thread(target=run_https_server, daemon=True)
    t_http.start()

    run_ws_server()
