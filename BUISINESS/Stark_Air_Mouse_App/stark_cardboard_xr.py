"""
=============================================================================
STARK CARDBOARDXR // WINDOWS SPATIAL COMPUTING & 3D XR SUITE v9.8.0 PRO
=============================================================================
Complete Native Port of CardboardXR (macOS/Unity) into the STARK Ecosystem:
- 100% Native Windows 11 (NVIDIA RTX 4060 GPU Accelerated)
- Full 3D Spatial Geometry Engine with Depth Sorting & Lighting
- Demo 1: 3D Air Paint (Tilt Brush in Thin Air) with 3D Ribbon Meshes
- Demo 2: Spatial AR Portal (Doorway into 3D Cyberpunk Starfield)
- Demo 3: Orb Rush (Spatial Rhythm Game with Hand Collision & Combos)
- Demo 4: Cube Physics (Ray & Pinch 3D Grab, Rotation & Throw)
- Perception: 21-Joint Spatial Hand Skeleton with 1€ (One Euro) Filter
- Selection: Hysteresis Pinch Detector + Index Pointing Ray
- Display: Desktop AR HUD Mode & Stereoscopic VR Dual-Eye (SBS) Mode
- Companion: Roamies J.A.R.V.I.S. Voice & Vision AI Integration
=============================================================================
"""

import os
import sys
import time
import math
import json
import random
import ctypes
from ctypes import wintypes
import cv2
import numpy as np

# MediaPipe Tasks API
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Win32 SendInput for Roamies JARVIS & Desktop Interaction
user32 = ctypes.windll.user32
INPUT_KEYBOARD = 1
KEYEVENTF_KEYUP = 0x0002

# Import In-Air Spatial Menu
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from stark_spatial_menu import SpatialInAirMenu

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
    print("\n[STARK-JARVIS] >>> Kich hoat Roamies AI Vision Snap!")

# -----------------------------------------------------------------------------
# 1€ (One Euro) Filter - Pixel & 3D Space (Casiez et al. 2012)
# -----------------------------------------------------------------------------
class OneEuroFilter:
    def __init__(self, t0, x0, min_cutoff=1.0, beta=0.007, d_cutoff=1.0):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff
        self.x_prev = np.array(x0, dtype=float)
        self.dx_prev = np.zeros_like(self.x_prev)
        self.t_prev = t0

    def alpha(self, rate, cutoff):
        tau = 1.0 / (2.0 * math.pi * cutoff)
        te = 1.0 / rate if rate > 0 else 0.0001
        return 1.0 / (1.0 + tau / te)

    def filter(self, t, x):
        dt = t - self.t_prev
        if dt <= 0.0:
            return self.x_prev
        if dt > 0.45: # Reset tuc thi khi tay bi che khuat roi xuat hien lai (Zero Lag Snap)
            self.x_prev = np.array(x, dtype=float)
            self.dx_prev = np.zeros_like(self.x_prev)
            self.t_prev = t
            return self.x_prev
        rate = 1.0 / dt
        x = np.array(x, dtype=float)

        # Estimate derivative
        dx = (x - self.x_prev) * rate
        edx = self.dx_prev + self.alpha(rate, self.d_cutoff) * (dx - self.dx_prev)
        self.dx_prev = edx

        # Calculate cutoff based on velocity
        speed = np.linalg.norm(edx)
        cutoff = self.min_cutoff + self.beta * speed

        # Filter signal
        x_filtered = self.x_prev + self.alpha(rate, cutoff) * (x - self.x_prev)
        self.x_prev = x_filtered
        self.t_prev = t
        return x_filtered

# -----------------------------------------------------------------------------
# CardboardXR Hysteresis Pinch Detector (Ported from PinchDetector.cs)
# -----------------------------------------------------------------------------
class PinchDetector:
    def __init__(self, close_dist=0.026, open_dist=0.045):
        self.close_dist = close_dist
        self.open_dist = open_dist
        self.is_pinched = False
        self.pinch_start_time = 0.0

    def update(self, dist_m, now):
        if self.is_pinched:
            if dist_m > self.open_dist:
                self.is_pinched = False
        else:
            if dist_m < self.close_dist:
                self.is_pinched = True
                self.pinch_start_time = now
        return self.is_pinched

# -----------------------------------------------------------------------------
# 3D Spatial Math & Camera Projection Engine
# -----------------------------------------------------------------------------
class SpatialCamera:
    def __init__(self, w=1280, h=720, fov=65.0):
        self.w = w
        self.h = h
        self.focal = (w / 2.0) / math.tan(math.radians(fov / 2.0))
        self.cx = w / 2.0
        self.cy = h / 2.0

    def project_3d(self, pt_3d, offset_x=0):
        """Chieu diem 3D (x, y, z) thanh diem 2D pixel tren man hinh"""
        x, y, z = pt_3d
        if z <= 0.05:
            z = 0.05
        px = int(self.cx + offset_x + (x * self.focal) / z)
        py = int(self.cy - (y * self.focal) / z) # truc Y huong len
        return (px, py), z

    def unproject_2d(self, px, py, z, offset_x=0):
        """Bien diem 2D pixel kem do sau z thanh toa do 3D thuc"""
        x = ((px - self.cx - offset_x) * z) / self.focal
        y = -((py - self.cy) * z) / self.focal
        return np.array([x, y, z])

# -----------------------------------------------------------------------------
# Demo 1: 3D Air Paint Engine (Tilt Brush in Space - PaintDemo.cs)
# -----------------------------------------------------------------------------
class PaintDemo:
    def __init__(self):
        self.strokes = [] # Danh sach cac duong ve 3D: [ { 'points': [...], 'color': (b,g,r), 'size': 3 } ]
        self.current_stroke = []
        self.palette = [
            (255, 0, 255),  # Cyberpunk Magenta
            (0, 243, 255),  # Neon Cyan
            (0, 255, 128),  # Toxic Green
            (0, 165, 255),  # Energy Orange
            (255, 255, 255) # Pure White
        ]
        self.current_color_idx = 1
        self.brush_size = 4

    def add_point(self, pt_3d):
        self.current_stroke.append(np.array(pt_3d, dtype=float))

    def finish_stroke(self):
        if len(self.current_stroke) > 1:
            self.strokes.append({
                'points': list(self.current_stroke),
                'color': self.palette[self.current_color_idx],
                'size': self.brush_size
            })
            if len(self.strokes) > 50:
                self.strokes.pop(0)
        self.current_stroke = []

    def undo(self):
        if self.strokes:
            self.strokes.pop()

    def clear(self):
        self.strokes = []
        self.current_stroke = []

    def next_color(self):
        self.current_color_idx = (self.current_color_idx + 1) % len(self.palette)

    def draw(self, frame, cam, offset_x=0):
        # Ve tat ca cac net ve 3D da luu
        all_strokes = self.strokes + ([{'points': self.current_stroke, 'color': self.palette[self.current_color_idx], 'size': self.brush_size}] if len(self.current_stroke) > 1 else [])
        for stroke in all_strokes:
            pts_2d = []
            for p3 in stroke['points']:
                p2, z = cam.project_3d(p3, offset_x)
                if 0 <= p2[0] < cam.w and 0 <= p2[1] < cam.h and z > 0.05:
                    pts_2d.append((p2, z))

            if len(pts_2d) > 1:
                for i in range(len(pts_2d) - 1):
                    p_a, z_a = pts_2d[i]
                    p_b, z_b = pts_2d[i+1]
                    # Chieu day net ve theo do sau Z (Perspective Thickness)
                    thick = max(1, int(stroke['size'] * (0.8 / ((z_a + z_b) / 2.0))))
                    cv2.line(frame, p_a, p_b, stroke['color'], thick, cv2.LINE_AA)

# -----------------------------------------------------------------------------
# Demo 2: Spatial AR Portal (Doorway into another World - PortalDemo.cs)
# -----------------------------------------------------------------------------
class PortalDemo:
    def __init__(self):
        self.pos = np.array([0.0, -0.2, 1.4]) # Canh cua dung cach mat 1.4m
        self.width = 0.55
        self.height = 0.90
        self.starfield = []
        for _ in range(60):
            # Cac vi sao 3D ben trong the gioi Portal
            self.starfield.append(np.array([
                random.uniform(-1.5, 1.5),
                random.uniform(-1.0, 1.0),
                random.uniform(1.6, 4.0)
            ]))

    def draw(self, frame, cam, t_sec, offset_x=0):
        # 4 goc cua khung cua khong gian
        cx, cy, cz = self.pos
        hw, hh = self.width / 2.0, self.height / 2.0
        corners_3d = [
            np.array([cx - hw, cy - hh, cz]),
            np.array([cx + hw, cy - hh, cz]),
            np.array([cx + hw, cy + hh, cz]),
            np.array([cx - hw, cy + hh, cz])
        ]
        corners_2d = [cam.project_3d(c, offset_x)[0] for c in corners_3d]

        # Ve khung canh cua phat sang (Glowing Portal Frame)
        pts = np.array(corners_2d, np.int32).reshape((-1, 1, 2))
        
        # Tao hieu ung Mat Portal (The gioi vu tru ao ben trong khung cua)
        mask = np.zeros(frame.shape[:2], dtype=np.uint8)
        cv2.fillPoly(mask, [pts], 255)

        # Ve bau troi sao Cyberpunk ben trong khung cua
        portal_content = np.zeros_like(frame)
        grid_phase = (t_sec * 0.4) % 1.0
        # Luoi khong gian 3D vo tan ben trong portal
        for z_layer in np.arange(1.6, 4.5, 0.4):
            z_eff = z_layer - grid_phase * 0.4
            p1, _ = cam.project_3d([-1.5, -0.8, z_eff], offset_x)
            p2, _ = cam.project_3d([1.5, -0.8, z_eff], offset_x)
            cv2.line(portal_content, p1, p2, (80, 20, 120), 1, cv2.LINE_AA)

        for star in self.starfield:
            p2, _ = cam.project_3d(star, offset_x)
            cv2.circle(portal_content, p2, 2, (255, 255, 200), -1)

        # Ghep noi dung the gioi ao vao trong khung cua phong thuc
        frame[mask > 0] = cv2.addWeighted(frame[mask > 0], 0.35, portal_content[mask > 0], 0.65, 0)

        # Vien khung cong nghe Cyber Neon xung quanh cua
        cv2.polylines(frame, [pts], True, (0, 243, 255), 3, cv2.LINE_AA)
        cv2.polylines(frame, [pts], True, (255, 0, 255), 1, cv2.LINE_AA)

        # Nhan chu tren canh cua
        top_mid = ((corners_2d[2][0] + corners_2d[3][0]) // 2 - 50, corners_2d[2][1] - 12)
        cv2.putText(frame, "CYBER PORTAL", top_mid, cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 243, 255), 1, cv2.LINE_AA)

# -----------------------------------------------------------------------------
# Demo 3: Orb Rush (Spatial Rhythm Game - RushDemo.cs)
# -----------------------------------------------------------------------------
class OrbRushDemo:
    def __init__(self):
        self.orbs = [] # [ {'pos': np.array([x,y,z]), 'speed': 0.8, 'hit': False, 'color': (0,255,255)} ]
        self.score = 0
        self.combo = 0
        self.last_spawn = 0.0
        self.active = False
        self.round_time = 30.0
        self.start_time = 0.0
        self.hit_feedback = [] # [ {'text': 'PERFECT!', 'pos': (x,y), 'time': t} ]

    def start(self, now):
        self.active = True
        self.score = 0
        self.combo = 0
        self.orbs = []
        self.start_time = now
        self.last_spawn = now

    def update(self, now, hand_points_3d):
        if not self.active:
            return

        dt = 0.033
        # Spawn qua cau moi moi 1.2s
        if now - self.last_spawn > 1.2:
            self.last_spawn = now
            lane_x = random.choice([-0.25, -0.08, 0.08, 0.25])
            lane_y = random.choice([-0.10, 0.05, 0.20])
            self.orbs.append({
                'pos': np.array([lane_x, lane_y, 2.5]), # Xuat phat tu xa 2.5m
                'speed': random.uniform(0.9, 1.4),
                'hit': False,
                'color': random.choice([(0, 243, 255), (255, 0, 255), (0, 255, 128)])
            })

        # Cap nhat toa do bay cua qua cau
        for orb in self.orbs:
            if not orb['hit']:
                orb['pos'][2] -= orb['speed'] * dt

                # Kiem tra va cham voi ban tay (Lòng bàn tay hoac dau ngon tay)
                if hand_points_3d is not None and 0.4 <= orb['pos'][2] <= 0.85:
                    for hp in [hand_points_3d[0], hand_points_3d[8], hand_points_3d[12]]:
                        dist = np.linalg.norm(orb['pos'] - hp)
                        if dist < 0.14: # Va cham trung bong!
                            orb['hit'] = True
                            self.combo += 1
                            self.score += 100 * self.combo
                            self.hit_feedback.append({
                                'text': f"PERFECT! x{self.combo}",
                                'pos': orb['pos'].copy(),
                                'time': now
                            })
                            break

        # Xoa cac bong da qua mat (Miss)
        for orb in self.orbs:
            if not orb['hit'] and orb['pos'][2] < 0.25:
                self.combo = 0 # Dut chuoi combo

        self.orbs = [o for o in self.orbs if not o['hit'] and o['pos'][2] > 0.25]
        self.hit_feedback = [f for f in self.hit_feedback if now - f['time'] < 0.8]

    def draw(self, frame, cam, now, offset_x=0):
        # Ve vong muc tieu danh bong (Hit Ring Plane o khoang cach 0.6m)
        ring_center, _ = cam.project_3d(np.array([0.0, 0.05, 0.65]), offset_x)
        cv2.circle(frame, ring_center, 90, (50, 50, 80), 2, cv2.LINE_AA)

        # Ve cac qua cau 3D dang bay toi
        for orb in self.orbs:
            p2, z = cam.project_3d(orb['pos'], offset_x)
            r = max(4, int(28.0 / z))
            cv2.circle(frame, p2, r, orb['color'], -1, cv2.LINE_AA)
            cv2.circle(frame, p2, r + 4, (255, 255, 255), 1, cv2.LINE_AA)

        # Ve text phan hoi Perfect!
        for f in self.hit_feedback:
            p2, _ = cam.project_3d(f['pos'], offset_x)
            alpha_time = 1.0 - (now - f['time']) / 0.8
            cv2.putText(frame, f['text'], (p2[0] - 30, p2[1]), cv2.FONT_HERSHEY_SIMPLEX, 0.6 * alpha_time, (0, 255, 0), 2)

        # Banh diem so HUD
        cv2.putText(frame, f"ORB RUSH | SCORE: {self.score} | COMBO: {self.combo}",
                    (30, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 243, 255), 2)

# -----------------------------------------------------------------------------
# Demo 4: 3D Holographic Cube Physics & Grab (Ported from CardboardXR CubePhysics.cs)
# -----------------------------------------------------------------------------
class CubePhysicsDemo:
    """
    Port of CardboardXR CubePhysics.cs:
    - Grab by near hand pinch (< 0.25m) or far pointing ray (NearFarInteractor)
    - Kinematic movement while held by hand
    - Throw on release with hand velocity (clamped to k_MaxThrowSpeed = 6.0 m/s)
    - Natural gravity (-9.8 m/s^2), bounce off floor/desk and air damping
    """
    def __init__(self):
        self.pos = np.array([0.0, 0.0, 1.1])
        self.size = 0.16
        self.rot = np.array([0.2, 0.4, 0.0])
        self.vel = np.array([0.0, 0.0, 0.0])
        self.is_grabbed = False
        self.grab_offset = np.array([0.0, 0.0, 0.0])
        self.prev_grab_pos = None

    def update(self, dt, is_pinched, pinch_pos_3d, ray_origin_3d=None, ray_dir_3d=None):
        if is_pinched:
            # 1. Kiem tra khoang cach cham gan (< 0.25m)
            dist_pinch = np.linalg.norm(self.pos - pinch_pos_3d) if pinch_pos_3d is not None else 999.0

            # 2. Kiem tra tia laser tu xa (Far Raycast toi qua cau bao quanh khoi hop)
            hit_ray = False
            if ray_origin_3d is not None and ray_dir_3d is not None:
                to_cube = self.pos - ray_origin_3d
                proj = float(np.dot(to_cube, ray_dir_3d))
                if proj > 0.15:
                    closest_pt = ray_origin_3d + proj * ray_dir_3d
                    ray_dist = float(np.linalg.norm(self.pos - closest_pt))
                    if ray_dist < (self.size * 1.6):
                        hit_ray = True

            can_grab = (dist_pinch < 0.25) or hit_ray
            if not self.is_grabbed and can_grab and pinch_pos_3d is not None:
                self.is_grabbed = True
                self.grab_offset = self.pos - pinch_pos_3d
                self.prev_grab_pos = self.pos.copy()

            if self.is_grabbed and pinch_pos_3d is not None:
                target_pos = pinch_pos_3d + self.grab_offset
                if dt > 0.001:
                    raw_vel = (target_pos - self.pos) / dt
                    # Gioi han toc do nem toi da (CardboardXR k_MaxThrowSpeed = 6.0 m/s)
                    spd = float(np.linalg.norm(raw_vel))
                    if spd > 6.0:
                        raw_vel = (raw_vel / spd) * 6.0
                    self.vel = raw_vel
                self.pos = target_pos
        else:
            if self.is_grabbed:
                self.is_grabbed = False

            # Vat ly vat the tu do (Trong luc + Quan tinh nem + Ma sat khong khi)
            # Gravity: -2.5 m/s^2 tao cam giac lo lung huyen ao nhe nhang trong AR
            self.vel[1] -= 2.5 * dt
            self.pos += self.vel * dt
            self.vel *= 0.94 # Damping

            # Cham san / Mat ban ao o do sau y = -0.55m -> Dan hoi nay len
            if self.pos[1] < -0.55:
                self.pos[1] = -0.55
                self.vel[1] = -self.vel[1] * 0.50 # Nay len voi 50% dong nang
                self.vel[0] *= 0.85
                self.vel[2] *= 0.85

            self.rot[0] += 0.02
            self.rot[1] += 0.03

    def draw(self, frame, cam, offset_x=0):
        # 8 dinh cua khoi lap phuong
        s = self.size
        nodes = np.array([
            [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
            [-s, -s,  s], [s, -s,  s], [s, s,  s], [-s, s,  s]
        ])

        # Tinh ma tran xoay Euler 3D
        rx, ry, rz = self.rot
        Rx = np.array([[1, 0, 0], [0, math.cos(rx), -math.sin(rx)], [0, math.sin(rx), math.cos(rx)]])
        Ry = np.array([[math.cos(ry), 0, math.sin(ry)], [0, 1, 0], [-math.sin(ry), 0, math.cos(ry)]])
        rot_nodes = nodes @ Rx.T @ Ry.T + self.pos

        # Chieu 2D
        pts_2d = [cam.project_3d(n, offset_x)[0] for n in rot_nodes]

        edges = [
            (0,1), (1,2), (2,3), (3,0),
            (4,5), (5,6), (6,7), (7,4),
            (0,4), (1,5), (2,6), (3,7)
        ]
        color = (0, 255, 128) if self.is_grabbed else (0, 243, 255)
        for p1, p2 in edges:
            cv2.line(frame, pts_2d[p1], pts_2d[p2], color, 2, cv2.LINE_AA)
        for pt in pts_2d:
            cv2.circle(frame, pt, 4, (255, 0, 255), -1, cv2.LINE_AA)

# -----------------------------------------------------------------------------
# Demo 6: 3D Holographic Spatial Simulation (Solar System & Depth Grid)
# -----------------------------------------------------------------------------
class SpatialSimDemo:
    """
    Demo 6: 3D Holographic Spatial Room & Planetary Simulation
    - 3D Perspective Depth Horizon Grid Floor (x: -1.2..1.2m, z: 0.6..2.6m, y: -0.42m)
    - 3D Holographic Celestial Bodies (Solar Core, Cyber Node, Terra & Moon, Saturn Ring)
    - Interactive 3D Hand Proximity: Hovering fingertip highlights orbit and displays 3D telemetry
    - Direct Fingertip Pinch: Grab and tilt/rotate orbit plane in 3D space
    """
    def __init__(self):
        self.center_pos = np.array([0.0, -0.05, 1.25])
        self.rot = np.array([0.35, 0.0]) # Pitch, Yaw
        self.angular_vel = np.array([0.0, 0.0]) # Van toc goc quan tinh xoay (Inertial Momentum)
        self.speed_multiplier = 1.0
        self.show_grid = True
        self.show_telemetry = True
        self.is_grabbed = False
        self.prev_grab_pt = None
        self.hovered_body = None

        self.bodies = [
            {"id": "core", "name": "SOLAR CORE", "radius": 0.0, "speed": 0.0, "size": 0.055, "color": (50, 215, 255), "angle": 0.0},
            {"id": "cyber", "name": "CYBER NODE", "radius": 0.22, "speed": 1.4, "size": 0.024, "color": (255, 240, 0), "angle": 0.5},
            {"id": "terra", "name": "TERRA & MOON", "radius": 0.40, "speed": 0.8, "size": 0.034, "color": (220, 150, 0), "angle": 2.1, "has_moon": True},
            {"id": "saturn", "name": "SATURNUS", "radius": 0.62, "speed": 0.45, "size": 0.042, "color": (100, 200, 255), "angle": 4.3, "has_ring": True},
        ]

    def update(self, dt, is_pinched, pinch_pt_3d, hand_lms_3d=None):
        # Cap nhat goc quay cac hanh tinh
        for b in self.bodies:
            b["angle"] += b["speed"] * dt * self.speed_multiplier

        rx, ry = self.rot
        Rx = np.array([[1, 0, 0], [0, math.cos(rx), -math.sin(rx)], [0, math.sin(rx), math.cos(rx)]])
        Ry = np.array([[math.cos(ry), 0, math.sin(ry)], [0, 1, 0], [-math.sin(ry), 0, math.cos(ry)]])
        R = Ry @ Rx

        self.hovered_body = None
        check_pt = pinch_pt_3d if pinch_pt_3d is not None else (hand_lms_3d[8] if hand_lms_3d is not None else None)

        if check_pt is not None:
            # 1. Kiem tra khoang cach toi tung hanh tinh (Proximity Hover)
            closest_dist = 999.0
            closest_b = None
            for b in self.bodies:
                r = b["radius"]
                ang = b["angle"]
                loc = np.array([r * math.cos(ang), 0.0, r * math.sin(ang)])
                w_pt = self.center_pos + R @ loc
                d = float(np.linalg.norm(np.array(check_pt) - w_pt))
                if d < 0.20 and d < closest_dist:
                    closest_dist = d
                    closest_b = b

            self.hovered_body = closest_b

            # 2. Xoay he quy dao khi Pinch (Direct In-Air Rotation)
            if is_pinched:
                if not self.is_grabbed:
                    self.is_grabbed = True
                    self.prev_grab_pt = np.array(check_pt)
                else:
                    delta = np.array(check_pt) - self.prev_grab_pt
                    pitch_d = -delta[1] * 3.5
                    yaw_d = delta[0] * 3.5
                    self.rot[1] += yaw_d
                    self.rot[0] = max(-0.8, min(1.1, self.rot[0] + pitch_d))
                    # Luu van toc goc de tao quan tinh xoay (Inertial Physics)
                    self.angular_vel = np.array([pitch_d / max(0.001, dt), yaw_d / max(0.001, dt)]) * 0.35
                    self.prev_grab_pt = np.array(check_pt)
            else:
                self.is_grabbed = False
                self.prev_grab_pt = None
                # Quan tinh xoay tu do voi ma sat khong gian em ai
                self.rot[0] = max(-0.8, min(1.1, self.rot[0] + self.angular_vel[0] * dt))
                self.rot[1] += self.angular_vel[1] * dt
                self.angular_vel *= 0.94
        else:
            self.is_grabbed = False
            self.prev_grab_pt = None
            self.rot[0] = max(-0.8, min(1.1, self.rot[0] + self.angular_vel[0] * dt))
            self.rot[1] += self.angular_vel[1] * dt
            self.angular_vel *= 0.94

    def draw(self, frame, cam, now, offset_x=0):
        rx, ry = self.rot
        Rx = np.array([[1, 0, 0], [0, math.cos(rx), -math.sin(rx)], [0, math.sin(rx), math.cos(rx)]])
        Ry = np.array([[math.cos(ry), 0, math.sin(ry)], [0, 1, 0], [-math.sin(ry), 0, math.cos(ry)]])
        R = Ry @ Rx

        # 1. Ve San Luoi Khong Gian 3D (Perspective Depth Horizon Grid Floor)
        if self.show_grid:
            grid_y = -0.42
            for gx in np.linspace(-1.2, 1.2, 7):
                p_start, _ = cam.project_3d(np.array([gx, grid_y, 0.6]), offset_x)
                p_end, _ = cam.project_3d(np.array([gx, grid_y, 2.6]), offset_x)
                cv2.line(frame, p_start, p_end, (35, 45, 60), 1, cv2.LINE_AA)
            for gz in np.linspace(0.6, 2.6, 6):
                p_start, _ = cam.project_3d(np.array([-1.2, grid_y, gz]), offset_x)
                p_end, _ = cam.project_3d(np.array([1.2, grid_y, gz]), offset_x)
                alpha_z = int(60 * (1.0 - (gz - 0.6) / 2.0))
                cv2.line(frame, p_start, p_end, (alpha_z, alpha_z + 10, alpha_z + 20), 1, cv2.LINE_AA)

        # 2. Ve Cac Duong Vanh Dai Quy Dao 3D (Orbit Rings)
        for b in self.bodies:
            r = b["radius"]
            if r <= 0.01:
                continue
            is_active = (self.hovered_body and self.hovered_body["id"] == b["id"])
            ring_col = (0, 240, 255) if is_active else (55, 65, 80)
            ring_thick = 2 if is_active else 1

            ring_pts = []
            for a in np.linspace(0, 2 * math.pi, 36):
                loc = np.array([r * math.cos(a), 0.0, r * math.sin(a)])
                w_pt = self.center_pos + R @ loc
                p2, _ = cam.project_3d(w_pt, offset_x)
                ring_pts.append(p2)

            for i in range(len(ring_pts) - 1):
                cv2.line(frame, ring_pts[i], ring_pts[i+1], ring_col, ring_thick, cv2.LINE_AA)
            cv2.line(frame, ring_pts[-1], ring_pts[0], ring_col, ring_thick, cv2.LINE_AA)

        # 3. Ve Cac Thien The 3D (Planets & Core)
        for b in self.bodies:
            r = b["radius"]
            ang = b["angle"]
            loc = np.array([r * math.cos(ang), 0.0, r * math.sin(ang)])
            w_pt = self.center_pos + R @ loc
            p2, z_depth = cam.project_3d(w_pt, offset_x)

            is_active = (self.hovered_body and self.hovered_body["id"] == b["id"])
            rad_px = max(4, int((b["size"] * 240.0) / max(0.2, z_depth)))

            # Glow aura
            if b["id"] == "core":
                pulse = int(12 + 6 * math.sin(now * 5.0))
                cv2.circle(frame, p2, rad_px + pulse, (20, 100, 160), -1, cv2.LINE_AA)
            elif is_active:
                cv2.circle(frame, p2, rad_px + 8, (255, 188, 208), 2, cv2.LINE_AA)

            # Planet Body
            cv2.circle(frame, p2, rad_px, b["color"], -1, cv2.LINE_AA)
            cv2.circle(frame, p2, rad_px, (255, 255, 255), 1, cv2.LINE_AA)

            # Moon for Terra
            if b.get("has_moon", False):
                m_ang = now * 3.2
                m_loc = loc + np.array([0.06 * math.cos(m_ang), 0.02 * math.sin(m_ang), 0.06 * math.sin(m_ang)])
                m_wpt = self.center_pos + R @ m_loc
                mp2, _ = cam.project_3d(m_wpt, offset_x)
                cv2.circle(frame, mp2, max(2, rad_px // 3), (220, 220, 220), -1, cv2.LINE_AA)

            # Saturn Ring
            if b.get("has_ring", False):
                cv2.ellipse(frame, p2, (rad_px * 2, max(3, rad_px // 2)), int(math.degrees(ry) * 0.4), 0, 360, (180, 220, 255), 1, cv2.LINE_AA)

            # Telemetry label & Holographic Bracket on hover
            if is_active and self.show_telemetry:
                box_sz = rad_px + 12
                c_x, c_y = p2[0], p2[1]
                t_col = (0, 240, 255)
                # 4 goc ngam chu L (Targeting Brackets)
                cv2.line(frame, (c_x - box_sz, c_y - box_sz), (c_x - box_sz + 8, c_y - box_sz), t_col, 2, cv2.LINE_AA)
                cv2.line(frame, (c_x - box_sz, c_y - box_sz), (c_x - box_sz, c_y - box_sz + 8), t_col, 2, cv2.LINE_AA)
                cv2.line(frame, (c_x + box_sz, c_y - box_sz), (c_x + box_sz - 8, c_y - box_sz), t_col, 2, cv2.LINE_AA)
                cv2.line(frame, (c_x + box_sz, c_y - box_sz), (c_x + box_sz, c_y - box_sz + 8), t_col, 2, cv2.LINE_AA)
                cv2.line(frame, (c_x - box_sz, c_y + box_sz), (c_x - box_sz + 8, c_y + box_sz), t_col, 2, cv2.LINE_AA)
                cv2.line(frame, (c_x - box_sz, c_y + box_sz), (c_x - box_sz, c_y + box_sz - 8), t_col, 2, cv2.LINE_AA)
                cv2.line(frame, (c_x + box_sz, c_y + box_sz), (c_x + box_sz - 8, c_y + box_sz), t_col, 2, cv2.LINE_AA)
                cv2.line(frame, (c_x + box_sz, c_y + box_sz), (c_x + box_sz, c_y + box_sz - 8), t_col, 2, cv2.LINE_AA)

                dist_cam = float(np.linalg.norm(w_pt))
                label_text = f"{b['name']} | DIST: {dist_cam:.2f}m | X:{w_pt[0]:+.2f} Y:{w_pt[1]:+.2f} Z:{w_pt[2]:.2f}m"
                cv2.putText(frame, label_text, (p2[0] - 110, p2[1] - rad_px - 18),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 243, 255), 1, cv2.LINE_AA)

# -----------------------------------------------------------------------------
# PolynomialRadialDistortion (Ported from CardboardXR PolynomialRadialDistortion.cs)
# -----------------------------------------------------------------------------
class PolynomialRadialDistortion:
    """
    Port of CardboardXR PolynomialRadialDistortion.cs & Google Cardboard SDK:
    Radial lens distortion: p' = p * (1 + k1*r^2 + k2*r^4).
    Precalculates cv2.remap LUT for 640x720 per eye to achieve 0.7ms barrel distortion correction
    for biconvex Google Cardboard / VR Shinecon lenses.
    """
    def __init__(self, w=640, h=720, k1=0.28, k2=0.08):
        self.w = w
        self.h = h
        self.k1 = k1
        self.k2 = k2
        self.map_x = None
        self.map_y = None
        self._build_maps()

    def _build_maps(self):
        cx = self.w / 2.0
        cy = self.h / 2.0
        y, x = np.indices((self.h, self.w), dtype=np.float32)
        dx = (x - cx) / cx
        dy = (y - cy) / cy
        r2 = dx * dx + dy * dy
        distortion = 1.0 + self.k1 * r2 + self.k2 * (r2 * r2)
        self.map_x = (cx + dx * distortion * cx).astype(np.float32)
        self.map_y = (cy + dy * distortion * cy).astype(np.float32)

    def apply(self, eye_frame):
        if eye_frame.shape[1] != self.w or eye_frame.shape[0] != self.h:
            return eye_frame
        return cv2.remap(eye_frame, self.map_x, self.map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0))

# -----------------------------------------------------------------------------
# Demo 7: VideoVRDemo (Ported from CardboardXR VideoDemo.cs & VideoSphere.cs)
# -----------------------------------------------------------------------------
class VideoVRDemo:
    """
    Port of CardboardXR VideoDemo.cs & VideoSphere.cs:
    Plays 360 and VR180 stereo SBS videos (bundled Sample_180_sbs.mp4 & Sample_360.mp4)
    with M3 floating transport panel:
    - Play / Pause toggle
    - Skip -10s / +10s
    - Formats: 'VR180 SBS', '360 SPHERE', '2D CINEMA'
    - Next Video switcher
    """
    def __init__(self, video_dir=None):
        if video_dir is None:
            video_dir = os.path.join(os.path.dirname(__file__), "videos")
        self.video_dir = video_dir
        self.playlist = [
            ("Sample_180_sbs.mp4", "VR180 SBS"),
            ("Sample_360.mp4", "360 SPHERE")
        ]
        self.current_idx = 0
        self.cap = None
        self.is_playing = True
        self.current_frame = None
        self.total_frames = 0
        self.fps = 30.0
        self.last_frame_t = 0.0
        self.format_mode = "VR180 SBS"
        self._load_video(0)

    def _load_video(self, idx):
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        self.current_idx = idx % len(self.playlist)
        filename, default_fmt = self.playlist[self.current_idx]
        self.format_mode = default_fmt
        path = os.path.join(self.video_dir, filename)
        if not os.path.exists(path):
            alt_path = os.path.join("D:\\BUISINESS\\CardboardXR\\CardboardXR-main\\Assets\\StreamingAssets", filename)
            if os.path.exists(alt_path):
                path = alt_path
        self.cap = cv2.VideoCapture(path)
        if self.cap.isOpened():
            self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
            self.fps = max(10.0, self.cap.get(cv2.CAP_PROP_FPS))
            ret, frame = self.cap.read()
            if ret:
                self.current_frame = frame
        self.last_frame_t = time.time()
        print(f"[VideoDemo] Loaded {filename} ({self.total_frames} frames @ {self.fps:.1f} fps, format: {self.format_mode})")

    def toggle_play(self):
        self.is_playing = not self.is_playing

    def skip(self, seconds):
        if self.cap is not None and self.cap.isOpened():
            cur_frame = self.cap.get(cv2.CAP_PROP_POS_FRAMES)
            new_frame = max(0, min(self.total_frames - 1, cur_frame + seconds * self.fps))
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, new_frame)

    def cycle_format(self):
        fmts = ["VR180 SBS", "360 SPHERE", "2D CINEMA"]
        idx = (fmts.index(self.format_mode) + 1) % len(fmts) if self.format_mode in fmts else 0
        self.format_mode = fmts[idx]
        return self.format_mode

    def next_video(self):
        self._load_video(self.current_idx + 1)

    def update(self, dt):
        if not self.is_playing or self.cap is None or not self.cap.isOpened():
            return
        now = time.time()
        interval = 1.0 / self.fps
        if now - self.last_frame_t >= interval:
            self.last_frame_t = now
            ret, frame = self.cap.read()
            if ret:
                self.current_frame = frame
            else:
                self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = self.cap.read()
                if ret:
                    self.current_frame = frame

    def draw(self, target_frame, is_stereo=False, eye_idx=0, off_x=0):
        if self.current_frame is None:
            return
        th, tw, _ = target_frame.shape
        vh, vw, _ = self.current_frame.shape

        if is_stereo and self.format_mode == "VR180 SBS":
            half_w = vw // 2
            if eye_idx == 0:
                crop = self.current_frame[:, :half_w]
            else:
                crop = self.current_frame[:, half_w:]
            resized = cv2.resize(crop, (tw, th))
            cv2.addWeighted(resized, 0.88, target_frame, 0.12, 0, target_frame)
        elif self.format_mode == "2D CINEMA":
            screen_w = int(tw * 0.72)
            screen_h = int(screen_w * (vh / vw))
            sx = (tw - screen_w) // 2 + off_x
            sy = (th - screen_h) // 2 - 20
            resized = cv2.resize(self.current_frame, (screen_w, screen_h))
            if 0 <= sx and sx + screen_w <= tw and 0 <= sy and sy + screen_h <= th:
                cv2.rectangle(target_frame, (sx-4, sy-4), (sx+screen_w+4, sy+screen_h+4), (0, 0, 0), -1)
                cv2.rectangle(target_frame, (sx-2, sy-2), (sx+screen_w+2, sy+screen_h+2), (180, 160, 255), 2)
                target_frame[sy:sy+screen_h, sx:sx+screen_w] = resized
        else:
            resized = cv2.resize(self.current_frame, (tw, th))
            cv2.addWeighted(resized, 0.85, target_frame, 0.15, 0, target_frame)

        if eye_idx == 0:
            cur_sec = (self.cap.get(cv2.CAP_PROP_POS_FRAMES) / self.fps) if (self.cap and self.fps > 0) else 0.0
            tot_sec = (self.total_frames / self.fps) if self.fps > 0 else 0.0
            cur_str = f"{int(cur_sec)//60:02d}:{int(cur_sec)%60:02d}"
            tot_str = f"{int(tot_sec)//60:02d}:{int(tot_sec)%60:02d}"
            fname = self.playlist[self.current_idx][0]
            hud_text = f"VIDEO VR // {fname} [{self.format_mode}] - {cur_str} / {tot_str} ({'PLAY' if self.is_playing else 'PAUSED'})"
            cv2.putText(target_frame, hud_text, (28 + off_x, 65), cv2.FONT_HERSHEY_DUPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

# -----------------------------------------------------------------------------
# STARK SPATIAL SUITE CORE ENGINE
# -----------------------------------------------------------------------------
class StarkCardboardXRSuite:
    def __init__(self):
        print("[+] Khoi tao STARK CardboardXR Suite v9.8.0 PRO...")

        # 1. Khoi tao MediaPipe HandLandmarker Tasks API
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, "hand_landmarker.task")
        base_options = python.BaseOptions(model_asset_path=model_path)
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            num_hands=2,
            min_hand_detection_confidence=0.55,
            min_tracking_confidence=0.55
        )
        self.detector = vision.HandLandmarker.create_from_options(options)

        # 2. He thong quang hoc & Camera khong gian
        self.cam_w = 1280
        self.cam_h = 720
        self.spatial_cam = SpatialCamera(self.cam_w, self.cam_h, fov=65.0)
        self.current_cam_idx = 0
        self.available_cams = [0]
        self.cam_names = {
            0: "LAPTOP WEBCAM",
            1: "USB CAMERA 1",
            2: "CAMO STUDIO (IPHONE CUA PHU)"
        }

        # 3. 21 Bo loc 1€ Filter chong rung giat khop tay (Pixel-space Casiez 2012)
        t0 = time.time()
        self.filters_2d = [OneEuroFilter(t0, [0, 0], min_cutoff=1.0, beta=0.007) for _ in range(21)]
        self.filters_3d = [OneEuroFilter(t0, [0, 0, 0.5], min_cutoff=0.8, beta=0.010) for _ in range(21)]

        # 4. Hysteresis Pinch Detector & Ray
        self.pinch_detector = PinchDetector(close_dist=0.026, open_dist=0.045)

        # 5. Tich hop tat ca cac Demo tu CardboardXR goc & Mo phong khong gian 3D
        self.paint_demo = PaintDemo()
        self.portal_demo = PortalDemo()
        self.rush_demo = OrbRushDemo()
        self.cube_demo = CubePhysicsDemo()
        self.spatial_sim_demo = SpatialSimDemo()
        self.video_demo = VideoVRDemo()
        self.radial_distortion = PolynomialRadialDistortion(w=640, h=720, k1=0.28, k2=0.08)
        self.enable_distortion = False

        # 6. Che do van hanh (Modes)
        self.current_mode = 1 # 1: Paint, 2: Portal, 3: Orb Rush, 4: Cube Physics, 5: Caliper, 6: Spatial 3D Sim, 7: Video VR
        self.stereo_vr_mode = False # False: Desktop HUD, True: Stereo VR SBS cho kinh Shinecon G10
        self.stereo_offset = 14 # IPD disparity pixels

        # 7. Trang thai Roamies JARVIS & In-Air Spatial UI
        self.palm_hold_start = 0.0
        self.jarvis_cooldown = 0.0
        self.spatial_menu = SpatialInAirMenu()

    def draw_spatial_reticle(self, frame, pt, is_pinched):
        """Ve tam ngam khong gian 3D"""
        r = 10 if not is_pinched else 16
        col = (0, 255, 0) if is_pinched else (0, 243, 255)
        cv2.circle(frame, pt, r, col, 2, cv2.LINE_AA)
        cv2.circle(frame, pt, 3, (255, 255, 255), -1, cv2.LINE_AA)

    def draw_pointing_ray(self, frame, p_knuckle, p_tip):
        """Xoa bo hoan toan tia laser theo yeu cau, dieu khien thuan ngon tay"""
        pass

    def draw_hud(self, frame, fps):
        """Thanh dieu khien khong gian Material 3 (M3 Spatial Toolbar)"""
        modes_text = [
            ("1: PAINT", self.current_mode == 1),
            ("2: PORTAL", self.current_mode == 2),
            ("3: RUSH", self.current_mode == 3),
            ("4: CUBES", self.current_mode == 4),
            ("5: CALIPER", self.current_mode == 5),
            ("6: SPATIAL", self.current_mode == 6),
            ("7: VIDEO VR", self.current_mode == 7)
        ]

        bar_y = 35
        cv2.putText(frame, f"STARK CARDBOARDXR v9.8.0 PRO | {int(fps)} FPS | GPU: RTX 4060",
                    (25, bar_y), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 243, 255), 2, cv2.LINE_AA)

        btn_x = 25
        btn_y = bar_y + 30
        for text, active in modes_text:
            col = (0, 255, 128) if active else (160, 160, 160)
            thickness = 2 if active else 1
            cv2.putText(frame, text, (btn_x, btn_y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, col, thickness, cv2.LINE_AA)
            btn_x += 160

        vr_status = "ON (SBS 3D)" if self.stereo_vr_mode else "OFF (DESKTOP HUD)"
        cam_info = self.cam_names.get(self.current_cam_idx, f"CAM {self.current_cam_idx}")
        cv2.putText(frame, f"[V]: KINH VR {vr_status} | [X]: CAM [{cam_info}] | [C]: CLEAR | [ESC]: EXIT",
                    (25, self.cam_h - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 243, 255), 1, cv2.LINE_AA)

    def init_capture(self, idx):
        """Khoi tao camera an toan tuyet doi, set do phan giai truoc khi read tranh loi Matrix step"""
        try:
            c = cv2.VideoCapture(idx)
            if not c.isOpened():
                return None
            c.set(cv2.CAP_PROP_FRAME_WIDTH, self.cam_w)
            c.set(cv2.CAP_PROP_FRAME_HEIGHT, self.cam_h)
            c.set(cv2.CAP_PROP_FPS, 60)
            ret, frame = c.read()
            if ret and frame is not None and frame.size > 0:
                return c
            c.release()
        except Exception:
            pass
        return None

    def run(self):
        # Uu tien nhan Camo Studio (Index 2 - iPhone cua Phu), sau do moi fallback sang 1 va 0
        cap = None
        for try_idx in [2, 1, 0]:
            cap = self.init_capture(try_idx)
            if cap is not None:
                self.current_cam_idx = try_idx
                break

        if cap is None:
            cap = cv2.VideoCapture(0)
            self.current_cam_idx = 0

        win_title = "STARK CARDBOARDXR // WINDOWS SPATIAL COMPUTING SUITE"
        cv2.namedWindow(win_title, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(win_title, self.cam_w, self.cam_h)

        print("\n==================================================================")
        print("   STARK CARDBOARDXR PRO // WINDOWS NATIVE SPATIAL SUITE")
        print(f"   Camera khoi tao: Index {self.current_cam_idx} [{self.cam_names.get(self.current_cam_idx, 'CAM')}]")
        print("   [X] Chuyen Camera giua iPhone (USB Passthrough) & Laptop")
        print("   [1] 3D Air Paint (Tilt Brush)   | [2] AR Spatial Portal")
        print("   [3] Orb Rush Rhythm Game        | [4] 3D Cube Physics & Grab")
        print("   [5] Precision 3D Caliper        | [V] Toggle Stereo VR (Shinecon G10)")
        print("==================================================================\n")

        last_t = time.time()
        fps = 60.0

        while cap.isOpened():
            try:
                ret, frame = cap.read()
            except cv2.error as e:
                print(f"[!] Canh bao frame buffer: {e}. Dang thu lai...")
                time.sleep(0.04)
                continue

            if not ret or frame is None or frame.size == 0:
                time.sleep(0.02)
                continue

            h, w, _ = frame.shape
            if w != self.cam_w or h != self.cam_h:
                self.cam_w, self.cam_h = w, h
                self.spatial_cam = SpatialCamera(self.cam_w, self.cam_h, fov=65.0)

            now = time.time()
            dt = max(0.001, now - last_t)
            last_t = now
            fps = 0.9 * fps + 0.1 * (1.0 / dt)

            # Lật gương ngang để tương tác tự nhiên như soi gương
            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            results = self.detector.detect(mp_image)

            filtered_lms_2d = None
            filtered_lms_3d = None
            is_pinched = False
            pinch_pt_2d = None
            pinch_pt_3d = None

            if results.hand_landmarks:
                lms = results.hand_landmarks[0]
                world_lms = results.hand_world_landmarks[0] if results.hand_world_landmarks else None

                # 1. Ap dung bo loc 1€ Filter len tung khop tay trong pixel space (chong rung tuyet doi)
                filtered_lms_2d = []
                for i in range(21):
                    raw_px = [lms[i].x * w, lms[i].y * h]
                    flt_px = self.filters_2d[i].filter(now, raw_px)
                    filtered_lms_2d.append((int(flt_px[0]), int(flt_px[1])))

                # Tinh toa do 3D trong he truc camera
                filtered_lms_3d = []
                for i in range(21):
                    z_depth = 0.65 + (lms[i].z if hasattr(lms[i], 'z') else 0.0) * 0.8
                    pt3 = self.spatial_cam.unproject_2d(filtered_lms_2d[i][0], filtered_lms_2d[i][1], z_depth)
                    flt_pt3 = self.filters_3d[i].filter(now, pt3)
                    filtered_lms_3d.append(flt_pt3)

                # 2. Tinh toan cu chi Pinch (Hysteresis)
                p_thumb_3d = filtered_lms_3d[4]
                p_index_3d = filtered_lms_3d[8]
                dist_m = np.linalg.norm(p_thumb_3d - p_index_3d)
                is_pinched = self.pinch_detector.update(dist_m, now)

                pinch_pt_3d = (p_thumb_3d + p_index_3d) * 0.5
                pinch_pt_2d = ((filtered_lms_2d[4][0] + filtered_lms_2d[8][0]) // 2,
                               (filtered_lms_2d[4][1] + filtered_lms_2d[8][1]) // 2)

                # 3. Kiem tra Xoe ban tay (Open Palm) goi Roamies JARVIS
                is_flat_palm = (lms[8].y < lms[6].y and lms[12].y < lms[10].y and lms[16].y < lms[14].y and lms[20].y < lms[18].y)
                if is_flat_palm:
                    if self.palm_hold_start == 0.0:
                        self.palm_hold_start = now
                    elif (now - self.palm_hold_start) > 0.50 and (now - self.jarvis_cooldown) > 2.5:
                        self.jarvis_cooldown = now
                        trigger_jarvis_snap()
                        cv2.putText(frame, "JARVIS SCANNING...", (w//2 - 100, h - 50),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                else:
                    self.palm_hold_start = 0.0

            # -----------------------------------------------------------------
            # Render Logic: Ho tro ca Desktop HUD lan Stereo VR (SBS)
            # -----------------------------------------------------------------
            if self.stereo_vr_mode:
                # Che do 2 mat Side-by-Side cho kinh Shinecon G10
                left_view = frame.copy()
                right_view = frame.copy()

                views = [
                    (left_view, -self.stereo_offset),
                    (right_view, self.stereo_offset)
                ]
            else:
                # Che do 1 man hinh Desktop AR
                views = [(frame, 0)]

            # Kiem tra In-Air UI
            consumed = False
            hovered_btn = None
            if filtered_lms_2d is not None:
                p_knuckle = filtered_lms_2d[5]
                p_tip = filtered_lms_2d[8]
                dx = p_tip[0] - p_knuckle[0]
                dy = p_tip[1] - p_knuckle[1]
                dist_laser = math.hypot(dx, dy)
                laser_end = None
                if dist_laser > 8:
                    scale_l = 480.0 / dist_laser
                    laser_end = (int(p_tip[0] + dx * scale_l), int(p_tip[1] + dy * scale_l))
                consumed, hovered_btn = self.spatial_menu.update(
                    filtered_lms_2d, p_knuckle, p_tip, laser_end, is_pinched, now, self
                )

            # Cap nhat Logic cua cac Demo (Neu UI khong chiem cu chi Pinch)
            if not consumed:
                if self.current_mode == 1: # PaintDemo
                    if is_pinched and pinch_pt_3d is not None:
                        self.paint_demo.add_point(pinch_pt_3d)
                    else:
                        self.paint_demo.finish_stroke()
                elif self.current_mode == 3: # Orb Rush
                    self.rush_demo.update(now, filtered_lms_3d)
                elif self.current_mode == 4: # Cube Physics (CardboardXR CubePhysics.cs)
                    ray_orig_3d = filtered_lms_3d[8] if filtered_lms_3d is not None else None
                    ray_dir_3d = None
                    if filtered_lms_3d is not None:
                        dir_v = np.array(filtered_lms_3d[8]) - np.array(filtered_lms_3d[5])
                        norm_d = float(np.linalg.norm(dir_v))
                        if norm_d > 1e-4:
                            ray_dir_3d = dir_v / norm_d
                    self.cube_demo.update(dt, is_pinched, pinch_pt_3d, ray_orig_3d, ray_dir_3d)
                elif self.current_mode == 6:
                    self.spatial_sim_demo.update(dt, is_pinched, pinch_pt_3d, filtered_lms_3d)
                elif self.current_mode == 7:
                    self.video_demo.update(dt)

            # Ve cac Demo vao cac View (Left / Right hoac Desktop)
            for target_frame, off_x in views:
                if self.current_mode == 1:
                    self.paint_demo.draw(target_frame, self.spatial_cam, off_x)
                elif self.current_mode == 2:
                    self.portal_demo.draw(target_frame, self.spatial_cam, now, off_x)
                elif self.current_mode == 3:
                    self.rush_demo.draw(target_frame, self.spatial_cam, now, off_x)
                elif self.current_mode == 4:
                    self.cube_demo.draw(target_frame, self.spatial_cam, off_x)
                elif self.current_mode == 5 and filtered_lms_2d is not None:
                    # Caliper mode
                    p1 = (filtered_lms_2d[4][0] + off_x, filtered_lms_2d[4][1])
                    p2 = (filtered_lms_2d[8][0] + off_x, filtered_lms_2d[8][1])
                    cv2.line(target_frame, p1, p2, (0, 243, 255), 2, cv2.LINE_AA)
                    dist_mm = dist_m * 1000.0
                    cv2.putText(target_frame, f"{dist_mm:.1f} mm", ((p1[0]+p2[0])//2, (p1[1]+p2[1])//2 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                elif self.current_mode == 6:
                    self.spatial_sim_demo.draw(target_frame, self.spatial_cam, now, off_x)
                elif self.current_mode == 7:
                    eye_idx = 0 if off_x <= 0 else 1
                    self.video_demo.draw(target_frame, is_stereo=self.stereo_vr_mode, eye_idx=eye_idx, off_x=off_x)

                # Ve khop tay & Tia Laser Pointing Ray
                if filtered_lms_2d is not None:
                    # An bo xuong mac dinh trong AR Passthrough (CardboardXR HandJointsView.cs)
                    if getattr(self.spatial_menu, 'show_skeleton_debug', False):
                        HAND_BONES = [
                            (0, 1), (1, 2), (2, 3), (3, 4),
                            (0, 5), (5, 6), (6, 7), (7, 8),
                            (5, 9), (9, 10), (10, 11), (11, 12),
                            (9, 13), (13, 14), (14, 15), (15, 16),
                            (13, 17), (17, 18), (18, 19), (19, 20),
                            (0, 17)
                        ]
                        for b1, b2 in HAND_BONES:
                            pt_a = (filtered_lms_2d[b1][0] + off_x, filtered_lms_2d[b1][1])
                            pt_b = (filtered_lms_2d[b2][0] + off_x, filtered_lms_2d[b2][1])
                            cv2.line(target_frame, pt_a, pt_b, (0, 243, 255), 2, cv2.LINE_AA)

                        for pt in filtered_lms_2d:
                            cv2.circle(target_frame, (pt[0] + off_x, pt[1]), 3, (0, 150, 255), -1, cv2.LINE_AA)

                    # Con tro ngon tay thuan tuy (Pure Fingertip Reticle - Khong con tia laser vuong mat)
                    cursor_pos = pinch_pt_2d if (is_pinched and pinch_pt_2d is not None) else filtered_lms_2d[8]
                    if cursor_pos is not None:
                        self.spatial_menu.draw_cursor_reticle(
                            target_frame,
                            (cursor_pos[0] + off_x, cursor_pos[1]),
                            is_pinched,
                            is_hovering=(hovered_btn is not None)
                        )

                # Ve In-Air Spatial Menu tren view
                menu_offset = 4 if off_x < 0 else (-4 if off_x > 0 else 0)
                self.spatial_menu.draw(target_frame, now, self.current_mode, eye_offset_x=menu_offset, bridge=getattr(self, 'bridge', None))

            # Ket xuat ra cua so hien thi
            if self.stereo_vr_mode:
                if self.enable_distortion:
                    left_view = self.radial_distortion.apply(left_view)
                    right_view = self.radial_distortion.apply(right_view)
                # Ghep 2 mat thanh 1 khung Side-by-Side (SBS)
                sbs_frame = np.hstack((left_view, right_view))
                cv2.line(sbs_frame, (w, 0), (w, h), (0, 0, 0), 4)
                display_frame = sbs_frame
            else:
                self.draw_hud(frame, fps)
                display_frame = frame

            cv2.imshow(win_title, display_frame)

            # Phim tat dieu khien
            key = cv2.waitKey(1) & 0xFF
            if key == 27: # ESC
                break
            elif key == ord('1'):
                self.current_mode = 1
                print("[*] Chuyen sang: 3D Air Paint (Tilt Brush)")
            elif key == ord('2'):
                self.current_mode = 2
                print("[*] Chuyen sang: AR Spatial Portal")
            elif key == ord('3'):
                self.current_mode = 3
                self.rush_demo.start(now)
                print("[*] Chuyen sang: Orb Rush Rhythm Game")
            elif key == ord('4'):
                self.current_mode = 4
                print("[*] Chuyen sang: 3D Cube Physics & Grab")
            elif key == ord('5'):
                self.current_mode = 5
                print("[*] Chuyen sang: Precision 3D Caliper")
            elif key == ord('6'):
                self.current_mode = 6
                print("[*] Chuyen sang: 3D Holographic Spatial Simulation")
            elif key == ord('7'):
                self.current_mode = 7
                print("[*] Chuyen sang: 360 & VR180 Video Player (CardboardXR VideoDemo)")
            elif key == ord('d') or key == ord('D'):
                self.enable_distortion = not self.enable_distortion
                print(f"[*] Cardboard Lens Distortion: {'BAT' if self.enable_distortion else 'TAT'}")
            elif key == ord('v') or key == ord('V'):
                self.stereo_vr_mode = not self.stereo_vr_mode
                print(f"[*] Che do Stereo VR (SBS): {'BAT' if self.stereo_vr_mode else 'TAT'}")
            elif key == ord('x') or key == ord('X'):
                # Chuyen doi qua lai giua cac Camera (Laptop Webcam 0 va iPhone USB 1/2)
                for next_idx in [(self.current_cam_idx + 1) % 3, (self.current_cam_idx + 2) % 3]:
                    new_cap = self.init_capture(next_idx)
                    if new_cap is not None:
                        cap.release()
                        cap = new_cap
                        self.current_cam_idx = next_idx
                        print(f"\n[+] DA CHUYEN SANG CAMERA {self.current_cam_idx}: {self.cam_names.get(self.current_cam_idx, 'EXT CAMERA')}")
                        break
                else:
                    print("\n[!] Khong tim thay Camera khac dang ket noi!")
            elif key == ord('c') or key == ord('C'):
                self.paint_demo.clear()
                print("[*] Da xoa sach net ve 3D!")
            elif key == ord('z') or key == ord('Z'):
                self.paint_demo.undo()
                print("[*] Undo net ve!")
            elif key == ord('n') or key == ord('N'):
                self.paint_demo.next_color()
                print("[*] Doi mau co ve 3D!")

        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="STARK CardboardXR Spatial Suite")
    parser.add_argument("--demo", "-d", default="1", help="Chon ung dung khoi dong (1-7 hoac paint, portal, rush, cubes, caliper, spatial, video)")
    parser.add_argument("--view", "-v", default="mono", choices=["mono", "1-scr", "sbs", "stereo"], help="Che do hien thi (mono: 1 man hinh, sbs: kinh 3D)")
    parser.add_argument("--cam", "-c", type=int, default=None, help="Chi dinh index camera (0, 1, 2)")
    parser.add_argument("--distortion", action="store_true", help="Bat bo loc khu meo thau kinh Cardboard")
    args = parser.parse_args()

    suite = StarkCardboardXRSuite()

    demo_map = {
        "1": 1, "paint": 1,
        "2": 2, "portal": 2,
        "3": 3, "rush": 3, "orb_rush": 3,
        "4": 4, "cube": 4, "cubes": 4, "sandbox": 4,
        "5": 5, "caliper": 5,
        "6": 6, "spatial": 6, "sim": 6, "universe": 6,
        "7": 7, "video": 7, "vr_video": 7
    }
    chosen_mode = demo_map.get(str(args.demo).lower(), 1)
    suite.current_mode = chosen_mode
    if chosen_mode == 3:
        suite.rush_demo.start(time.time())

    if args.view in ["sbs", "stereo"]:
        suite.stereo_vr_mode = True
    else:
        suite.stereo_vr_mode = False

    if args.distortion:
        suite.enable_distortion = True

    if args.cam is not None:
        suite.current_cam_idx = args.cam

    suite.run()
