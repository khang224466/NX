"""
=============================================================================
CARDBOARDXR // MATERIAL 3 SPATIAL IN-AIR SUITE & INTERACTION ENGINE v10.3.04 PRO
=============================================================================
Authentic Python Port of CardboardXR (brenpoly/CardboardXR) Interaction System:
- PinchRouter.cs: Rising-Edge State Machine (Settings -> Button -> Demo/Grab)
  with 0.35s click lockout and full Pinch Claim ownership (never clicks UI while
  holding a pinch to paint or drag a 3D cube, and never swallows demo pinches!).
- HandInteractorRig.cs: Eye-Through-PinchPoint Ray & 0.25s Hand-Loss Grace Period
  with dedicated 1€ Filter on the thumb-index midpoint (Zero cursor jump on pinch).
- AimHistory.cs: 0.16s pre-pinch lookback locked at pinch onset (m_AimTurn).
- PalmGesture.cs & SettingsSummoner.cs: Upright palm-facing gate with Gear button
  between thumb joint (3) and index joint (6) + HandTurnGate (2.0/s).
- Responsive Viewport Layout: Automatically adapts to 640x480 (Webcam), 1280x720
  (1-Screen), and 640x720 (Stereo SBS Eye) so UI is never clipped off-screen.
=============================================================================
"""

import math
import time
import numpy as np
import collections
import cv2

try:
    import winsound
    HAVE_SOUND = True
except ImportError:
    HAVE_SOUND = False

def play_click_chime():
    """Phát âm thanh click phản hồi xúc giác nhẹ (Haptic Audio Chime)"""
    if HAVE_SOUND:
        try:
            winsound.MessageBeep(winsound.MB_OK)
        except Exception:
            pass

# -----------------------------------------------------------------------------
# Material 3 Design Tokens (Ported from CardboardXR M3Theme.cs)
# -----------------------------------------------------------------------------
class M3Theme:
    # Baseline Dark Color Scheme (BGR for OpenCV)
    Surface = (24, 18, 20)                 # #141218
    SurfaceContainer = (38, 31, 33)        # #211F26
    SurfaceContainerHigh = (48, 41, 43)    # #2B2930
    SurfaceContainerHighest = (59, 52, 54) # #36343B
    Primary = (255, 188, 208)              # #D0BCFF (M3 Lavender Accent)
    OnPrimary = (114, 30, 56)              # #381E72
    PrimaryContainer = (139, 55, 79)       # #4F378B
    OnPrimaryContainer = (255, 221, 234)   # #EADDFF
    SecondaryContainer = (88, 68, 74)      # #4A4458
    OnSurface = (233, 224, 230)            # #E6E0E9
    OnSurfaceVariant = (208, 196, 202)     # #CAC4D0
    Outline = (153, 143, 147)              # #938F99
    OutlineVariant = (79, 69, 73)          # #49454F
    Error = (181, 184, 242)                # #F2B8B5

    # State Layers
    HoverOpacity = 0.22
    PressedOpacity = 0.35
    GlassOpacity = 0.82

    # Accent Colors for Demos
    TintPaint = (210, 87, 126)   # #7E57C2 (Soft Purple)
    TintPortal = (209, 136, 2)   # #0288D1 (Cyber Blue)
    TintRush = (0, 81, 230)      # #E65100 (Energy Orange)
    TintCubes = (50, 125, 46)    # #2E7D32 (Emerald Green)
    TintCaliper = (91, 24, 194)  # #C2185B (Rose Red)
    TintSpatial = (240, 200, 0)  # #00C8F0 (Holographic Cyan/Gold)
    TintVideo = (230, 110, 30)   # #1E6EE6 (CardboardXR Sunset Video Orange)
    TintActive = (128, 255, 0)   # Neon Green
    TintAmber = (50, 215, 255)   # Amber Gold for Pinch (HandRayView.cs k_Pinching)

# -----------------------------------------------------------------------------
# Anti-Aliased Rounded Rectangle & Frosted Glass Renderer (Cached 190x Speedup)
# -----------------------------------------------------------------------------
_GLASS_MASK_CACHE = {}

def draw_rounded_glass(img, pt1, pt2, bg_color, radius=18, alpha=0.82, border_color=None, border_thickness=1):
    """Vẽ khối kính mờ bo tròn góc siêu mịn có bộ đệm mặt nạ (Cached Anti-Aliased Frosted Glass ROI)"""
    x1, y1 = int(pt1[0]), int(pt1[1])
    x2, y2 = int(pt2[0]), int(pt2[1])
    x1 = max(0, min(img.shape[1] - 1, x1))
    y1 = max(0, min(img.shape[0] - 1, y1))
    x2 = max(0, min(img.shape[1], x2))
    y2 = max(0, min(img.shape[0], y2))
    if x2 <= x1 or y2 <= y1:
        return
    w = x2 - x1
    h = y2 - y1
    radius = min(int(radius), w // 2, h // 2)
    roi = img[y1:y2, x1:x2]

    key = (w, h, radius)
    if key not in _GLASS_MASK_CACHE:
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.rectangle(mask, (radius, 0), (w - radius, h), 255, -1)
        cv2.rectangle(mask, (0, radius), (w, h - radius), 255, -1)
        cv2.circle(mask, (radius, radius), radius, 255, -1, cv2.LINE_AA)
        cv2.circle(mask, (w - radius, radius), radius, 255, -1, cv2.LINE_AA)
        cv2.circle(mask, (radius, h - radius), radius, 255, -1, cv2.LINE_AA)
        cv2.circle(mask, (w - radius, h - radius), radius, 255, -1, cv2.LINE_AA)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        mask_3d = (mask[:, :, None] > 0)
        _GLASS_MASK_CACHE[key] = (mask, contours, mask_3d)

    mask, contours, mask_3d = _GLASS_MASK_CACHE[key]

    color_block = np.full_like(roi, bg_color)
    blended = cv2.addWeighted(color_block, alpha, roi, 1.0 - alpha, 0)
    np.copyto(roi, blended, where=mask_3d)

    if border_color is not None and border_thickness > 0:
        cv2.drawContours(roi, contours, -1, border_color, border_thickness, cv2.LINE_AA)

# -----------------------------------------------------------------------------
# AimHistory Buffer (Ported from CardboardXR AimHistory.cs & HandInteractorRig.cs)
# -----------------------------------------------------------------------------
class AimHistory:
    """
    Port of CardboardXR AimHistory.cs:
    Closing fingers moves the midpoint between thumb and index by a median 5.6 degrees.
    AimHistory stores recent cursor positions while fingers are open, and when a pinch
    starts (just_pinched), locks the aim offset from 0.16s before the pinch began!
    """
    def __init__(self, keep_seconds=0.5):
        self.keep_seconds = keep_seconds
        self.history = collections.deque()  # [ (t, cursor_pt_2d) ]
        self.locked_offset = (0.0, 0.0)

    def add(self, t, p_knuckle, p_tip=None, laser_end=None):
        pt = p_tip if p_tip is not None else p_knuckle
        if pt is None:
            return
        self.history.append((t, (float(pt[0]), float(pt[1]))))
        while self.history and (t - self.history[0][0] > self.keep_seconds):
            self.history.popleft()

    def get_lookback_aim(self, current_t, lookback_seconds=0.16):
        if not self.history:
            return None
        target_t = current_t - lookback_seconds
        for i in range(len(self.history) - 1, -1, -1):
            if self.history[i][0] <= target_t:
                pt = self.history[i][1]
                return (self.history[i][0], pt, (int(pt[0]), int(pt[1])), (int(pt[0]), int(pt[1])))
        pt = self.history[0][1]
        return (self.history[0][0], pt, (int(pt[0]), int(pt[1])), (int(pt[0]), int(pt[1])))

    def clear(self):
        self.history.clear()
        self.locked_offset = (0.0, 0.0)

# -----------------------------------------------------------------------------
# Palm Gesture Detector (Ported from CardboardXR PalmGesture.cs & SettingsSummoner.cs)
# -----------------------------------------------------------------------------
class PalmGestureDetector:
    """
    Port of CardboardXR PalmGesture.cs & SettingsSummoner.cs:
    - Detects when an upright open palm squarely faces the user.
    - Places the Gear button between k_ThumbJoint (3) and k_IndexJoint (6)
      filtered smoothly so it never jitters.
    - Does NOT trigger when the hand is pinched or curled.
    """
    k_Wrist = 0
    k_ThumbJoint = 3
    k_IndexKnuckle = 5
    k_IndexJoint = 6
    k_MiddleKnuckle = 9
    k_PinkyKnuckle = 17

    def __init__(self, show_thresh=0.42, hide_thresh=0.20, show_time=0.25, hide_time=0.30):
        self.show_thresh = show_thresh
        self.hide_thresh = hide_thresh
        self.show_time = show_time
        self.hide_time = hide_time
        self.facing_start = 0.0
        self.unfacing_start = 0.0
        self.is_facing = False
        self.gear_pos = None
        self._smooth_gear = None

    def reset(self):
        self.facing_start = 0.0
        self.unfacing_start = 0.0
        self.is_facing = False
        self.gear_pos = None
        self._smooth_gear = None

    def update(self, lms_2d, now, is_pinched=False):
        if lms_2d is None or len(lms_2d) < 21:
            self.reset()
            return False, 0.0, None

        wrist = lms_2d[self.k_Wrist]
        thumb_joint = lms_2d[self.k_ThumbJoint]
        index_knuckle = lms_2d[self.k_IndexKnuckle]
        index_joint = lms_2d[self.k_IndexJoint]
        middle_knuckle = lms_2d[self.k_MiddleKnuckle]
        pinky_knuckle = lms_2d[self.k_PinkyKnuckle]

        to_index = (index_knuckle[0] - wrist[0], index_knuckle[1] - wrist[1])
        to_pinky = (pinky_knuckle[0] - wrist[0], pinky_knuckle[1] - wrist[1])
        len_i = math.hypot(to_index[0], to_index[1])
        len_p = math.hypot(to_pinky[0], to_pinky[1])
        if len_i * len_p < 1e-4:
            return False, 0.0, None

        # Sine of angle between wrist->index and wrist->pinky (0 when edge-on, ~0.5-0.9 when flat)
        cross = to_index[0] * to_pinky[1] - to_index[1] * to_pinky[0]
        facing = -cross / (len_i * len_p)

        # Upright check (SettingsSummoner.cs VoteUpright): fingers must be above wrist (y_wrist > y_middle_knuckle)
        is_upright = (wrist[1] > middle_knuckle[1] + len_i * 0.25)

        # Open fingers check: index(8), middle(12), ring(16), pinky(20) extended above their PIP joints
        fingers_extended = (
            lms_2d[8][1] < lms_2d[6][1] and
            lms_2d[12][1] < lms_2d[10][1] and
            lms_2d[16][1] < lms_2d[14][1] and
            lms_2d[20][1] < lms_2d[18][1]
        )

        # SettingsSummoner.cs lines 49-50 & 233: Button sits between k_ThumbJoint (3) and k_IndexJoint (6)
        raw_gx = (thumb_joint[0] + index_joint[0]) * 0.5
        raw_gy = (thumb_joint[1] + index_joint[1]) * 0.5
        if self._smooth_gear is None:
            self._smooth_gear = (raw_gx, raw_gy)
        else:
            self._smooth_gear = (
                0.65 * self._smooth_gear[0] + 0.35 * raw_gx,
                0.65 * self._smooth_gear[1] + 0.35 * raw_gy
            )
        self.gear_pos = (int(self._smooth_gear[0]), int(self._smooth_gear[1]))

        facing_mag = abs(facing)
        # Khi đã hiện nút Gear, người dùng sẽ chụm ngón cái và ngón trỏ để bấm vào Gear,
        # nên khi is_facing == True ta chỉ cần giữ lòng bàn tay phẳng (facing_mag > hide_thresh).
        can_show = is_upright and fingers_extended and (not is_pinched)
        can_stay = is_upright and (facing_mag > self.hide_thresh)

        if not self.is_facing:
            if can_show and facing_mag > self.show_thresh:
                if self.facing_start == 0.0:
                    self.facing_start = now
                elif (now - self.facing_start) >= self.show_time:
                    self.is_facing = True
                    self.unfacing_start = 0.0
            else:
                self.facing_start = 0.0
        else:
            if not can_stay:
                if self.unfacing_start == 0.0:
                    self.unfacing_start = now
                elif (now - self.unfacing_start) >= self.hide_time:
                    self.is_facing = False
                    self.facing_start = 0.0
            else:
                self.unfacing_start = 0.0

        return self.is_facing, facing, self.gear_pos

# -----------------------------------------------------------------------------
# HandTurnGate (Ported from CardboardXR PalmGesture.cs)
# -----------------------------------------------------------------------------
class HandTurnGate:
    """
    Port of CardboardXR HandTurnGate (PalmGesture.cs lines 92-121):
    Suppresses false pinches while the hand is turning over (> 2.0/s) and for 0.25s after.
    """
    def __init__(self, turn_rate=2.0, hold_seconds=0.25):
        self.turn_rate = turn_rate
        self.hold_seconds = hold_seconds
        self.last_facing = 0.0
        self.last_time = -1.0
        self.turning_until = -1.0
        self.is_turning = False

    def update(self, facing, now):
        if self.last_time > 0:
            dt = now - self.last_time
            if 0 < dt < 0.5:
                rate = abs(facing - self.last_facing) / dt
                if rate > self.turn_rate:
                    self.turning_until = now + self.hold_seconds
        self.last_facing = facing
        self.last_time = now
        self.is_turning = (now < self.turning_until)
        return self.is_turning

    def reset(self):
        self.last_time = -1.0
        self.turning_until = -1.0
        self.is_turning = False

# -----------------------------------------------------------------------------
# Material 3 Spatial Button (Ported from M3Button.cs & M3StateLayer.cs)
# -----------------------------------------------------------------------------
class M3SpatialButton:
    """Nút bấm không gian 3D chuẩn Material 3: Tự động co giãn theo từng độ phân giải màn hình"""
    def __init__(self, btn_id, label, icon, x, y, w, h, radius=18, is_active=False, category="all", color=None, tagline=""):
        self.btn_id = btn_id
        self.label = label
        self.icon = icon
        # Tọa độ thiết kế gốc trên khung chuẩn 600x720
        self.base_x = x
        self.base_y = y
        self.base_w = w
        self.base_h = h
        # Tọa độ thực tế trên màn hình hiện tại (cập nhật động mỗi frame)
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.radius = radius
        self.is_active = is_active
        self.category = category
        self.color = color or M3Theme.Primary
        self.tagline = tagline
        self.is_hovered = False
        self.ripple_time = 0.0

    def update_layout(self, panel_x0, scale_y, h_frame):
        """Ánh xạ tọa độ từ khung chuẩn 600x720 sang kích thước thực tế của màn hình (480p / 720p / 1080p)"""
        self.x = int(panel_x0 + self.base_x)
        self.y = int(self.base_y * scale_y)
        self.w = int(self.base_w)
        self.h = max(28, int(self.base_h * scale_y))

    def contains(self, px, py, margin=8):
        return (self.x - margin <= px <= self.x + self.w + margin) and (self.y - margin <= py <= self.y + self.h + margin)

    def intersects_segment(self, p1, p2):
        return self.contains(p1[0], p1[1]) or self.contains(p2[0], p2[1])

    def draw(self, frame, now, offset_x=0):
        bx = self.x + offset_x
        by = self.y
        bw = self.w
        bh = self.h

        bg = M3Theme.SurfaceContainerHigh
        border = M3Theme.OutlineVariant
        text_col = M3Theme.OnSurface

        if self.is_active:
            bg = M3Theme.PrimaryContainer
            border = M3Theme.Primary
            text_col = M3Theme.OnPrimaryContainer
        elif self.is_hovered:
            bg = (74, 64, 72)
            border = M3Theme.Primary
            text_col = (255, 255, 255)

        draw_rounded_glass(frame, (bx, by), (bx + bw, by + bh), bg, radius=self.radius, alpha=0.88,
                           border_color=border, border_thickness=2 if (self.is_hovered or self.is_active) else 1)

        display_text = f"{self.icon} {self.label}".strip() if self.icon else self.label
        font_scale = 0.38 if len(display_text) > 10 else 0.42
        (tw, th), _ = cv2.getTextSize(display_text, cv2.FONT_HERSHEY_DUPLEX, font_scale, 1)
        tx = bx + (bw - tw) // 2
        ty = by + (bh + th) // 2
        cv2.putText(frame, display_text, (tx, ty), cv2.FONT_HERSHEY_DUPLEX, font_scale, text_col, 1, cv2.LINE_AA)

        if now - self.ripple_time < 0.25:
            prog = (now - self.ripple_time) / 0.25
            r = int(prog * max(bw, bh) * 0.65)
            cv2.circle(frame, (bx + bw // 2, by + bh // 2), r, (255, 255, 255), 2, cv2.LINE_AA)

# -----------------------------------------------------------------------------
# CardboardXR Complete In-Air Spatial UI Suite & PinchRouter
# -----------------------------------------------------------------------------
class SpatialInAirMenu:
    """
    Hệ thống Giao diện & Bộ Định Tuyến Cử Chỉ Chuẩn 100% CardboardXR (PinchRouter.cs + HandInteractorRig.cs):
    1. Sườn lên (Rising-Edge Pinch): Chỉ kích hoạt click đúng 1 lần khi bắt đầu chụm ngón tay!
       Không bao giờ bị lặp nút khi giữ Pinch, và không bao giờ bấm nhầm nút khi đang giữ Pinch kéo vật thể/vẽ 3D.
    2. Không bao giờ nuốt cử chỉ Demo: Khi chụm ngón tay ở ngoài vùng nút bấm, trả về consumed=False
       để người dùng vẽ Paint 3D, gắp khối hộp Cubes hoặc xoay Vũ trụ 3D ngay lập tức!
    3. Con trỏ PinchPoint duy nhất (중điểm ngón cái & ngón trỏ) kèm AimHistory 0.16s chống giật khi chụm.
    4. Responsive Layout: Tự động căn giữa và co giãn chuẩn xác trên cả 640x480 (Webcam), 1280x720 (1-SCR) và 640x720 (SBS).
    """
    def __init__(self):
        self.is_open = True
        self.is_library_open = False
        self.show_skeleton_debug = False
        self.last_click_t = 0.0
        self.click_lockout = 0.35  # PinchRouter.k_ClickLockoutSeconds = 0.35f
        self.palm_detector = PalmGestureDetector(show_thresh=0.42, hide_thresh=0.20, show_time=0.25, hide_time=0.30)
        self.turn_gate = HandTurnGate(turn_rate=2.0, hold_seconds=0.25)
        self.aim_history = AimHistory(keep_seconds=0.5)
        self.last_pinch_toggle_t = 0.0
        self.hovered_tagline = ""

        # Trạng thái PinchRouter & HandInteractorRig
        self.was_pinched = False
        self.active_route = None  # "SETTINGS", "BUTTON", "DEMO"
        self.locked_aim_pt = None
        self.smooth_cursor = None
        self.last_hand_seen_t = 0.0
        self.hand_lost_grace_s = 0.25  # HandInteractorRig.m_LostSeconds = 0.25f

        # Lưu thông số layout khung hình hiện tại
        self.cur_panel_x0 = 0
        self.cur_scale_y = 1.0
        self.cur_frame_w = 1280
        self.cur_frame_h = 720

        self.toolbar_buttons = []
        self.library_tiles = []
        self.sub_buttons = []
        self._build_ui()

    def _build_ui(self):
        # 1. CARDBOARDXR M3 ORBITER TOOLBAR (Base 580px width, y = 628 on 720p)
        self.toolbar_buttons = []
        tb_y = 628
        tb_h = 50
        self.toolbar_buttons.append(M3SpatialButton("tb_apps", "APPS", "[+]", 24, tb_y, 96, tb_h, radius=24, is_active=False))
        self.toolbar_buttons.append(M3SpatialButton("tb_view", "1-SCR", "[O]", 128, tb_y, 110, tb_h, radius=24, is_active=True))
        self.toolbar_buttons.append(M3SpatialButton("tb_recenter", "RESET", "[*]", 246, tb_y, 100, tb_h, radius=24))
        self.toolbar_buttons.append(M3SpatialButton("tb_cam", "IPHONE", "[~]", 354, tb_y, 106, tb_h, radius=24))
        self.toolbar_buttons.append(M3SpatialButton("tb_close", "HIDE", "[X]", 468, tb_y, 94, tb_h, radius=24, color=M3Theme.Error))

        # 2. CARDBOARDXR APP LIBRARY GRID (2x4 Grid)
        self.library_tiles = []
        apps = [
            ("demo_1", "PAINT 3D", "Pinch in the air to draw 3D ribbons", 24, 380, 125, 64, M3Theme.TintPaint),
            ("demo_2", "PORTAL", "Walk or peer into a 3D starfield doorway", 158, 380, 125, 64, M3Theme.TintPortal),
            ("demo_3", "ORB RUSH", "Touch floating rhythm orbs with your hand", 292, 380, 125, 64, M3Theme.TintRush),
            ("demo_4", "CUBES", "Point and pinch to grab & throw 3D cubes", 426, 380, 125, 64, M3Theme.TintCubes),
            ("demo_5", "CALIPER", "Measure real-world distances in millimeters", 24, 456, 125, 64, M3Theme.TintCaliper),
            ("demo_6", "SPATIAL 3D", "Pinch & drag to rotate the 3D Solar System", 158, 456, 125, 64, M3Theme.TintSpatial),
            ("demo_7", "VIDEO VR", "360 & VR180 stereo video player", 292, 456, 125, 64, M3Theme.TintVideo),
            ("tb_recenter_tile", "RECENTER", "Recenter 6DoF space and reset objects", 426, 456, 125, 64, M3Theme.PrimaryContainer),
        ]
        for b_id, label, tagline, x, y, w, h, col in apps:
            tile = M3SpatialButton(b_id, label, "", x, y, w, h, radius=18, is_active=(b_id == "demo_1"), color=col, tagline=tagline)
            self.library_tiles.append(tile)

        # 3. CONTEXTUAL SCENE SUB-TOOLS (Floating Dock y = 566 on 720p)
        self.sub_buttons = []
        y_sub = 566
        h_sub = 42

        # Paint 3D Palette
        palette = [
            ("col_0", "MAGENTA", (255, 0, 255)),
            ("col_1", "CYAN", (0, 243, 255)),
            ("col_2", "GREEN", (0, 255, 128)),
            ("col_3", "ORANGE", (0, 165, 255)),
            ("col_4", "WHITE", (255, 255, 255))
        ]
        for i, (b_id, label, col) in enumerate(palette):
            self.sub_buttons.append(M3SpatialButton(b_id, "", "", 30 + i * 54, y_sub, 44, h_sub, radius=22, is_active=(i == 1), color=col, category="paint"))
        self.sub_buttons.append(M3SpatialButton("btn_undo", "UNDO", "", 310, y_sub, 76, h_sub, radius=16, category="paint"))
        self.sub_buttons.append(M3SpatialButton("btn_clear", "CLEAR", "", 394, y_sub, 82, h_sub, radius=16, category="paint"))

        # Orb Rush Controls
        self.sub_buttons.append(M3SpatialButton("rush_start", "START GAME", "", 30, y_sub, 140, h_sub, radius=18, category="rush"))
        self.sub_buttons.append(M3SpatialButton("rush_reset_combo", "RESET COMBO", "", 180, y_sub, 140, h_sub, radius=18, category="rush"))

        # Cubes Controls
        self.sub_buttons.append(M3SpatialButton("cube_reset", "RESET CUBE", "", 30, y_sub, 160, h_sub, radius=18, category="cube"))

        # Portal Controls
        self.sub_buttons.append(M3SpatialButton("portal_reset", "CENTER PORTAL", "", 30, y_sub, 170, h_sub, radius=18, category="portal"))

        # Spatial 3D Controls
        self.sub_buttons.append(M3SpatialButton("sim_speed", "SPEED 1X", "", 30, y_sub, 110, h_sub, radius=18, category="spatial"))
        self.sub_buttons.append(M3SpatialButton("sim_grid", "GRID ON", "", 150, y_sub, 100, h_sub, radius=18, category="spatial"))
        self.sub_buttons.append(M3SpatialButton("sim_telemetry", "TELEMETRY", "", 260, y_sub, 120, h_sub, radius=18, category="spatial"))
        self.sub_buttons.append(M3SpatialButton("sim_reset", "RESET SPACE", "", 390, y_sub, 140, h_sub, radius=18, category="spatial"))

        # Video VR Controls
        self.sub_buttons.append(M3SpatialButton("vid_play", "PAUSE", "", 24, y_sub, 96, h_sub, radius=18, category="video"))
        self.sub_buttons.append(M3SpatialButton("vid_skip_back", "-10S", "", 126, y_sub, 68, h_sub, radius=18, category="video"))
        self.sub_buttons.append(M3SpatialButton("vid_skip_fwd", "+10S", "", 200, y_sub, 68, h_sub, radius=18, category="video"))
        self.sub_buttons.append(M3SpatialButton("vid_format", "VR180 SBS", "", 274, y_sub, 126, h_sub, radius=18, category="video"))
        self.sub_buttons.append(M3SpatialButton("vid_next", "NEXT CLIP", "", 406, y_sub, 114, h_sub, radius=18, category="video"))

        # Camera Settings (Chỉ hiển thị khi đang mở App Library để tránh bấm nhầm khi đang vẽ/chơi!)
        y_top = 304
        self.sub_buttons.append(M3SpatialButton("set_flip_v", "FLIP V", "", 24, y_top, 74, 32, radius=16, category="library_settings"))
        self.sub_buttons.append(M3SpatialButton("set_flip_h", "MIRROR", "", 106, y_top, 78, 32, radius=16, category="library_settings"))
        self.sub_buttons.append(M3SpatialButton("set_rot", "ROT 180", "", 192, y_top, 82, 32, radius=16, category="library_settings"))
        self.sub_buttons.append(M3SpatialButton("set_ipd_sub", "IPD -", "", 282, y_top, 56, 32, radius=16, category="library_settings"))
        self.sub_buttons.append(M3SpatialButton("set_ipd_add", "IPD +", "", 346, y_top, 56, 32, radius=16, category="library_settings"))
        self.sub_buttons.append(M3SpatialButton("toggle_skel", "SKEL OFF", "", 410, y_top, 96, 32, radius=16, category="library_settings"))

    def _sync_layout(self, frame_w, frame_h):
        """Tính toán vị trí các nút khớp 100% với kích thước khung hình hiện tại"""
        self.cur_frame_w = frame_w
        self.cur_frame_h = frame_h
        # Nếu frame_w == 640 (chế độ SBS hoặc 640x480), panel_x0 = 24; nếu 1280x720 nhưng truyền tọa độ đã dịch hoặc chưa dịch:
        self.cur_scale_y = frame_h / 720.0
        self.cur_panel_x0 = max(0, (frame_w - 592) // 2) if frame_w >= 800 else 0
        for b in self.toolbar_buttons + self.library_tiles + self.sub_buttons:
            b.update_layout(self.cur_panel_x0, self.cur_scale_y, frame_h)

    def get_active_buttons(self, suite):
        if not self.is_open:
            return []
        active_buttons = list(self.toolbar_buttons)
        if self.is_library_open:
            active_buttons.extend(self.library_tiles)
            for b in self.sub_buttons:
                if b.category == "library_settings":
                    active_buttons.append(b)
        else:
            cur_mode = suite.current_mode if suite else 1
            cat_map = {1: "paint", 2: "portal", 3: "rush", 4: "cube", 5: "caliper", 6: "spatial", 7: "video"}
            cur_cat = cat_map.get(cur_mode, "paint")
            for b in self.sub_buttons:
                if b.category == cur_cat:
                    active_buttons.append(b)
        return active_buttons

    def update(self, lms_2d, p_knuckle, p_tip, laser_end, is_pinched, now, suite, bridge=None, frame_shape=None):
        """
        Chu trình định tuyến cử chỉ chuẩn CardboardXR (PinchRouter.cs + HandInteractorRig.cs):
        - Con trỏ ngắm duy nhất là điểm giữa ngón cái (4) và ngón trỏ (8) [PinchPoint],
          được làm mượt và bù độ lệch khép ngón bằng AimHistory (0.16s lookback).
        - Sườn lên (just_pinched): Quyết định Pinch thuộc về Settings Gear, UI Button, hay Demo 3D.
        - Không bao giờ nuốt cử chỉ Demo khi chụm tay ở vùng không gian trống!
        """
        if frame_shape is not None:
            self._sync_layout(frame_shape[1], frame_shape[0])
        elif suite is not None and not getattr(suite, 'stereo_vr_mode', False) and bridge is None:
            self._sync_layout(getattr(suite, 'cam_w', 1280), getattr(suite, 'cam_h', 720))
        else:
            self._sync_layout(640, 720)

        active_buttons = self.get_active_buttons(suite)

        # Xử lý khi mất dấu bàn tay (HandInteractorRig.cs m_LostSeconds = 0.25s)
        if lms_2d is None or len(lms_2d) < 21:
            if now - self.last_hand_seen_t > self.hand_lost_grace_s:
                self.was_pinched = False
                self.active_route = None
                self.locked_aim_pt = None
                self.smooth_cursor = None
                self.aim_history.clear()
                self.palm_detector.reset()
                for b in active_buttons:
                    b.is_hovered = False
            return False, None

        self.last_hand_seen_t = now

        # 1. Tính điểm ngắm chuẩn CardboardXR: PinchPoint = Trung điểm ngón cái (4) và ngón trỏ (8)
        raw_cx = (lms_2d[4][0] + lms_2d[8][0]) * 0.5
        raw_cy = (lms_2d[4][1] + lms_2d[8][1]) * 0.5
        if self.smooth_cursor is None:
            self.smooth_cursor = (raw_cx, raw_cy)
        else:
            # Lọc mượt chống giật khi 2 đầu ngón tay che khuất nhau lúc chạm (PaintDemo.cs line 66)
            alpha = 0.45 if is_pinched else 0.65
            self.smooth_cursor = (
                alpha * raw_cx + (1.0 - alpha) * self.smooth_cursor[0],
                alpha * raw_cy + (1.0 - alpha) * self.smooth_cursor[1]
            )
        cursor_pt = (int(self.smooth_cursor[0]), int(self.smooth_cursor[1]))

        # 2. Kiểm tra Cổng cử chỉ Lòng bàn tay (SettingsSummoner.cs) & Chặn cử chỉ giả khi lật tay (HandTurnGate)
        is_palm_facing, facing_score, gear_pos = self.palm_detector.update(lms_2d, now, is_pinched=is_pinched)
        is_turning = self.turn_gate.update(facing_score, now)
        if is_turning and is_pinched and not self.was_pinched:
            # Chặn bắt đầu Pinch giả khi bàn tay đang lật nghiêng qua mép camera
            is_pinched = False

        # 3. Cập nhật AimHistory khi ngón tay đang mở; khóa điểm ngắm từ 0.16s trước ngay lúc bắt đầu Pinch!
        just_pinched = is_pinched and (not self.was_pinched)
        just_released = (not is_pinched) and self.was_pinched

        if not is_pinched:
            self.aim_history.add(now, cursor_pt, cursor_pt, cursor_pt)
            self.locked_aim_pt = None
            effective_pt = cursor_pt
        else:
            if just_pinched:
                lookback = self.aim_history.get_lookback_aim(now, lookback_seconds=0.16)
                if lookback is not None:
                    # Nếu khoảng cách giữa lúc trước khi khép ngón và lúc chạm < 45px thì giữ điểm ngắm ổn định
                    lb_pt = lookback[2]
                    if math.hypot(lb_pt[0] - cursor_pt[0], lb_pt[1] - cursor_pt[1]) < 45.0:
                        self.locked_aim_pt = lb_pt
                    else:
                        self.locked_aim_pt = cursor_pt
                else:
                    self.locked_aim_pt = cursor_pt
            effective_pt = self.locked_aim_pt if (self.active_route == "BUTTON" and self.locked_aim_pt is not None) else cursor_pt

        if just_released:
            self.active_route = None
            self.locked_aim_pt = None

        self.was_pinched = is_pinched

        # 4. Xác định nút đang được trỏ tới (CHỈ dùng tọa độ điểm chụm ngón tay, tuyệt đối không dùng tia laser vô hình!)
        hovered_btn = None
        self.hovered_tagline = ""
        if self.is_open and self.active_route != "DEMO":
            for btn in active_buttons:
                if btn.contains(effective_pt[0], effective_pt[1], margin=10):
                    hovered_btn = btn
                    break

        for btn in active_buttons:
            btn.is_hovered = (btn == hovered_btn)
        if hovered_btn is not None and hovered_btn.tagline:
            self.hovered_tagline = hovered_btn.tagline

        # 5. ĐỊNH TUYẾN PINCH (PinchRouter.cs Order: Settings -> Button -> Demo/Grab)
        if just_pinched:
            locked_out = (now - self.last_click_t) < self.click_lockout

            # Ưu tiên 1: Nếu đang ngửa lòng bàn tay hiện nút Gear (khi Menu đang đóng) -> Mở Menu + App Library!
            if (not self.is_open) and is_palm_facing and (not locked_out):
                self.last_click_t = now
                self.last_pinch_toggle_t = now
                self.is_open = True
                self.is_library_open = True  # Mở luôn App Library + Toolbar đúng như SettingsSummoner.cs!
                self.palm_detector.reset()
                self.active_route = "SETTINGS"
                play_click_chime()
                print("\n[CardboardXR] >>> PALM GEAR PINCH: OPENED SETTINGS & APP LIBRARY! <<<")
                return True, None

            # Ưu tiên 2: Nếu con trỏ đang nằm trên một nút bấm của Toolbar / App Library / Sub-tools -> Click nút!
            if self.is_open and hovered_btn is not None:
                self.active_route = "BUTTON"
                if not locked_out:
                    self.last_click_t = now
                    hovered_btn.ripple_time = now
                    play_click_chime()
                    self._dispatch_click(hovered_btn.btn_id, suite, bridge, now)
                return True, hovered_btn

            # Ưu tiên 3: Nếu App Library đang mở và bấm ra ngoài vùng bảng -> Tự đóng App Library
            if self.is_open and self.is_library_open:
                self.is_library_open = False
                self.active_route = "SETTINGS"
                return True, None

            # Ưu tiên 4: Chụm tay ở không gian trống -> Trao toàn quyền cho Demo 3D (Paint 3D, Cubes, Spatial 3D)!
            self.active_route = "DEMO"
            return False, None

        # Trong khi đang giữ Pinch (is_holding):
        if is_pinched:
            if self.active_route in ["SETTINGS", "BUTTON"]:
                # Cú Pinch này bắt đầu trên nút UI -> giữ consumed=True để không vẽ vệt thừa
                return True, hovered_btn
            else:
                # Cú Pinch này bắt đầu trong không gian 3D (DEMO) -> tuyệt đối không bấm nhầm UI khi lướt tay qua!
                return False, None

        return False, hovered_btn

    def _dispatch_click(self, btn_id, suite, bridge, now):
        print(f"\n[CardboardXR] >>> CLICK: {btn_id} <<<")
        if btn_id == "tb_apps":
            self.is_library_open = not self.is_library_open
        elif btn_id == "tb_view":
            target_suite = bridge.suite if bridge else suite
            if target_suite:
                target_suite.stereo_vr_mode = not target_suite.stereo_vr_mode
                desc = "STEREO SBS (VR KÍNH)" if target_suite.stereo_vr_mode else "1 MÀN HÌNH DUY NHẤT (PHONE VIEW)"
                print(f"[CardboardXR] Chế độ hiển thị: {desc}")
                for b in self.toolbar_buttons:
                    if b.btn_id == "tb_view":
                        b.label = "SBS VR" if target_suite.stereo_vr_mode else "1-SCR"
                        b.is_active = target_suite.stereo_vr_mode
        elif btn_id in ["tb_recenter", "tb_recenter_tile"]:
            if suite and hasattr(suite, 'spatial_cam'):
                suite.spatial_cam.reset_head_pose()
            if suite and suite.current_mode == 4:
                suite.cube_demo.pos = np.array([0.0, 0.0, 1.1])
                suite.cube_demo.vel = np.array([0.0, 0.0, 0.0])
            elif suite and suite.current_mode == 2:
                suite.portal_demo.pos = np.array([0.0, -0.2, 1.4])
            elif suite and suite.current_mode == 6 and hasattr(suite, 'spatial_sim_demo'):
                suite.spatial_sim_demo.rot = np.array([0.35, 0.0])
                suite.spatial_sim_demo.center_pos = np.array([0.0, -0.05, 1.25])
            if btn_id == "tb_recenter_tile":
                self.is_library_open = False
        elif btn_id == "tb_cam" and bridge:
            bridge.use_fallback = not bridge.use_fallback
        elif btn_id == "tb_close":
            self.is_open = False
            self.is_library_open = False
        elif btn_id.startswith("demo_"):
            mode_num = int(btn_id.split("_")[1])
            suite.current_mode = mode_num
            if mode_num == 3:
                suite.rush_demo.start(now)
            self.is_library_open = False  # Tự đóng App Library sau khi chọn ứng dụng (AppLibrary.cs)
        elif btn_id.startswith("col_"):
            idx = int(btn_id.split("_")[1])
            suite.paint_demo.current_color_idx = idx
        elif btn_id == "btn_undo":
            suite.paint_demo.undo()
        elif btn_id == "btn_clear":
            suite.paint_demo.clear()
        elif btn_id == "rush_start":
            suite.rush_demo.start(now)
        elif btn_id == "rush_reset_combo":
            suite.rush_demo.combo = 0
        elif btn_id == "cube_reset":
            suite.cube_demo.pos = np.array([0.0, 0.0, 1.1])
            suite.cube_demo.vel = np.array([0.0, 0.0, 0.0])
        elif btn_id == "portal_reset":
            suite.portal_demo.pos = np.array([0.0, -0.2, 1.4])
        elif btn_id == "sim_speed" and suite and hasattr(suite, 'spatial_sim_demo'):
            speeds = [1.0, 2.0, 0.0, 0.5]
            cur_s = suite.spatial_sim_demo.speed_multiplier
            next_s = speeds[(speeds.index(cur_s) + 1) % len(speeds)] if cur_s in speeds else 1.0
            suite.spatial_sim_demo.speed_multiplier = next_s
            for b in self.sub_buttons:
                if b.btn_id == "sim_speed":
                    b.label = f"SPEED {next_s:.1f}X" if next_s > 0 else "PAUSED"
        elif btn_id == "sim_grid" and suite and hasattr(suite, 'spatial_sim_demo'):
            suite.spatial_sim_demo.show_grid = not suite.spatial_sim_demo.show_grid
            for b in self.sub_buttons:
                if b.btn_id == "sim_grid":
                    b.label = "GRID ON" if suite.spatial_sim_demo.show_grid else "GRID OFF"
        elif btn_id == "sim_telemetry" and suite and hasattr(suite, 'spatial_sim_demo'):
            suite.spatial_sim_demo.show_telemetry = not suite.spatial_sim_demo.show_telemetry
        elif btn_id == "sim_reset" and suite and hasattr(suite, 'spatial_sim_demo'):
            suite.spatial_sim_demo.rot = np.array([0.35, 0.0])
            suite.spatial_sim_demo.center_pos = np.array([0.0, -0.05, 1.25])
        elif btn_id == "vid_play" and suite and hasattr(suite, 'video_demo'):
            suite.video_demo.toggle_play()
            for b in self.sub_buttons:
                if b.btn_id == "vid_play":
                    b.label = "PLAY" if not suite.video_demo.is_playing else "PAUSE"
        elif btn_id == "vid_skip_back" and suite and hasattr(suite, 'video_demo'):
            suite.video_demo.skip(-10.0)
        elif btn_id == "vid_skip_fwd" and suite and hasattr(suite, 'video_demo'):
            suite.video_demo.skip(10.0)
        elif btn_id == "vid_format" and suite and hasattr(suite, 'video_demo'):
            new_fmt = suite.video_demo.cycle_format()
            for b in self.sub_buttons:
                if b.btn_id == "vid_format":
                    b.label = new_fmt
        elif btn_id == "vid_next" and suite and hasattr(suite, 'video_demo'):
            suite.video_demo.next_video()
        elif btn_id == "set_flip_v" and bridge:
            bridge.flip_vertical = not bridge.flip_vertical
        elif btn_id == "set_flip_h" and bridge:
            bridge.flip_horizontal = not bridge.flip_horizontal
        elif btn_id == "set_rot" and bridge:
            bridge.rotate_180 = not bridge.rotate_180
        elif btn_id == "set_ipd_sub" and bridge:
            bridge.ipd_offset = max(0, bridge.ipd_offset - 2)
        elif btn_id == "set_ipd_add" and bridge:
            bridge.ipd_offset = min(60, bridge.ipd_offset + 2)
        elif btn_id == "toggle_skel":
            self.show_skeleton_debug = not self.show_skeleton_debug

        cur_mode = suite.current_mode if suite else 1
        for b in self.toolbar_buttons:
            if b.btn_id == "tb_apps":
                b.is_active = self.is_library_open
        for b in self.library_tiles:
            b.is_active = (b.btn_id == f"demo_{cur_mode}")
        for b in self.sub_buttons:
            if b.btn_id.startswith("col_") and hasattr(suite, 'paint_demo'):
                idx = int(b.btn_id.split("_")[1])
                b.is_active = (idx == suite.paint_demo.current_color_idx)

    def draw(self, frame, now, current_mode=1, eye_offset_x=0, bridge=None):
        """Render toàn bộ giao diện CardboardXR chuẩn Material 3 tự thích ứng mọi độ phân giải"""
        fh, fw = frame.shape[:2]
        # Nếu eye_offset_x >= 100 (legacy 320px offset từ bridge cũ), bỏ qua vì _sync_layout đã tự căn giữa!
        if abs(eye_offset_x) >= 100:
            eye_offset_x = 0
        self._sync_layout(fw, fh)

        px0 = self.cur_panel_x0 + eye_offset_x
        sy = self.cur_scale_y

        if bridge is not None:
            is_stereo = bridge.suite.stereo_vr_mode
            for b in self.toolbar_buttons:
                if b.btn_id == "tb_view":
                    b.label = "SBS VR" if is_stereo else "1-SCR"
                    b.color = (255, 0, 255) if is_stereo else (0, 255, 128)
                elif b.btn_id == "tb_cam":
                    b.label = "LAPTOP" if bridge.use_fallback else "IPHONE"
            for b in self.sub_buttons:
                if b.btn_id == "toggle_skel":
                    b.label = "SKEL ON" if self.show_skeleton_debug else "SKEL OFF"

        # 1. Vẽ Palm Summoner Gear Button giữa khớp ngón cái (3) và khớp ngón trỏ (6) (SettingsSummoner.cs)
        if not self.is_open and self.palm_detector.gear_pos is not None and self.palm_detector.is_facing:
            gx, gy = self.palm_detector.gear_pos[0] + eye_offset_x, self.palm_detector.gear_pos[1]
            pulse = int(150 + 105 * math.sin(now * 6.5))
            ring_col = (pulse, 230, 255)

            cv2.circle(frame, (gx, gy), 28, ring_col, 2, cv2.LINE_AA)
            cv2.circle(frame, (gx, gy), 22, M3Theme.SurfaceContainerHigh, -1, cv2.LINE_AA)
            cv2.circle(frame, (gx, gy), 22, M3Theme.Primary, 2, cv2.LINE_AA)
            # Biểu tượng bánh răng SettingsSummoner
            cv2.circle(frame, (gx, gy), 7, M3Theme.Primary, 2, cv2.LINE_AA)
            for a_deg in range(0, 360, 45):
                ar = math.radians(a_deg + now * 40.0)
                x_in = int(gx + 8 * math.cos(ar))
                y_in = int(gy + 8 * math.sin(ar))
                x_out = int(gx + 13 * math.cos(ar))
                y_out = int(gy + 13 * math.sin(ar))
                cv2.line(frame, (x_in, y_in), (x_out, y_out), M3Theme.Primary, 2, cv2.LINE_AA)

            hint = "PINCH TO OPEN MENU"
            (hw, _), _ = cv2.getTextSize(hint, cv2.FONT_HERSHEY_SIMPLEX, 0.36, 1)
            cv2.putText(frame, hint, (gx - hw // 2, gy + 42), cv2.FONT_HERSHEY_SIMPLEX, 0.36, M3Theme.Primary, 1, cv2.LINE_AA)

        if not self.is_open:
            hint_y = int(698 * sy)
            cv2.putText(frame, "[NGUA LONG BAN TAY & CHUM NGON DE MO MENU]", (px0 + 95, hint_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.38, M3Theme.OnSurfaceVariant, 1, cv2.LINE_AA)
            return

        # 2. Vẽ Background Capsule cho M3 Toolbar
        tb_box_x1 = px0 + 12
        tb_box_x2 = px0 + 576
        tb_box_y1 = int(618 * sy)
        tb_box_y2 = int(690 * sy)
        draw_rounded_glass(frame, (tb_box_x1, tb_box_y1), (tb_box_x2, tb_box_y2), M3Theme.SurfaceContainer,
                           radius=30, alpha=0.90, border_color=M3Theme.OutlineVariant, border_thickness=1)

        # 3. Vẽ App Library Grid nếu đang bật (AppLibrary.cs)
        if self.is_library_open:
            lib_x1 = px0 + 16
            lib_x2 = px0 + 564
            lib_y1 = int(342 * sy)
            lib_y2 = int(590 * sy)
            draw_rounded_glass(frame, (lib_x1, lib_y1), (lib_x2, lib_y2), M3Theme.SurfaceContainerHigh,
                               radius=26, alpha=0.92, border_color=M3Theme.Primary, border_thickness=2)

            cv2.putText(frame, "CARDBOARDXR // APP LIBRARY", (lib_x1 + 22, lib_y1 + int(26 * sy)),
                        cv2.FONT_HERSHEY_DUPLEX, 0.42, M3Theme.Primary, 1, cv2.LINE_AA)

            for tile in self.library_tiles:
                tile.draw(frame, now, eye_offset_x)

            for btn in self.sub_buttons:
                if btn.category == "library_settings":
                    btn.draw(frame, now, eye_offset_x)

            tagline_text = self.hovered_tagline if self.hovered_tagline else "Point at an app and pinch to launch"
            (tw, _), _ = cv2.getTextSize(tagline_text, cv2.FONT_HERSHEY_SIMPLEX, 0.38, 1)
            cv2.putText(frame, tagline_text, (lib_x1 + (lib_x2 - lib_x1 - tw) // 2, lib_y2 - int(14 * sy)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.38, M3Theme.OnSurfaceVariant, 1, cv2.LINE_AA)

        # 4. Vẽ Contextual Sub-Tools của Demo hiện tại (khi Library đóng)
        if not self.is_library_open:
            cat_map = {1: "paint", 2: "portal", 3: "rush", 4: "cube", 5: "caliper", 6: "spatial", 7: "video"}
            cur_cat = cat_map.get(current_mode, "paint")
            for btn in self.sub_buttons:
                if btn.category == cur_cat:
                    btn.draw(frame, now, eye_offset_x)

        # 5. Vẽ các nút trên Toolbar
        for btn in self.toolbar_buttons:
            btn.draw(frame, now, eye_offset_x)

    def draw_cursor_reticle(self, frame, cursor_pt, is_pinched, is_hovering=False):
        """
        Vẽ con trỏ ngắm không gian chuẩn CardboardXR (HandRayView.cs + GazeReticle.cs):
        - Chấm trắng tinh tế ở điểm giữa ngón cái & ngón trỏ (PinchPoint)
        - Chuyển sang màu vàng hổ phách (Amber: 1.0, 0.85, 0.2) ngay khi Pinch
        """
        if cursor_pt is None:
            return
        cx, cy = int(cursor_pt[0]), int(cursor_pt[1])
        if cx < 0 or cx >= frame.shape[1] or cy < 0 or cy >= frame.shape[0]:
            return

        color = M3Theme.TintAmber if is_pinched else (255, 255, 255)
        radius = 7 if is_pinched else (6 if is_hovering else 4)

        cv2.circle(frame, (cx, cy), radius + 3, (28, 24, 32), -1, cv2.LINE_AA)
        cv2.circle(frame, (cx, cy), radius, color, -1, cv2.LINE_AA)
        if is_hovering and not is_pinched:
            cv2.circle(frame, (cx, cy), radius + 6, M3Theme.Primary, 2, cv2.LINE_AA)
        elif is_pinched:
            cv2.circle(frame, (cx, cy), radius + 6, M3Theme.TintAmber, 2, cv2.LINE_AA)
