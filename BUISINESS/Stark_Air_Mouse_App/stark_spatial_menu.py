"""
=============================================================================
CARDBOARDXR // MATERIAL 3 SPATIAL IN-AIR SUITE & INTERACTION ENGINE v10.2.87 PRO
=============================================================================
Complete High-Fidelity Python Port of CardboardXR (macOS/Unity) Architecture:
- Material 3 Design System (developer.android.com/design/ui/xr & M3Theme.cs)
- Anti-Aliased High-Performance Frosted Glass ROI Rendering Engine
- CardboardXR App Library Grid (AppLibrary.cs) with 5 App Tiles & Dynamic Taglines
- CardboardXR M3 Orbiter Toolbar (M3Toolbar.cs) with Glass Capsule Styling
- AimHistory (AimHistory.cs): 0.2s Lookback Buffer preventing Pinch Ray Deflection
- Apple Vision Pro Palm System Gate (PalmGesture.cs & SettingsSummoner.cs)
- Clean Passthrough Perception: Skeleton hidden in AR passthrough, sleek Cursor Reticle
- 100% In-Air Hands-Free Controls: Switch View (1-Screen/SBS), Demos, Camera, Recenter
=============================================================================
"""

import math
import time
import numpy as np
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
    TintActive = (128, 255, 0)   # Neon Green
    TintAmber = (50, 215, 255)   # Amber Gold for Pinch

# -----------------------------------------------------------------------------
# Anti-Aliased Rounded Rectangle & Frosted Glass Renderer
# -----------------------------------------------------------------------------
def draw_rounded_glass(img, pt1, pt2, bg_color, radius=18, alpha=0.82, border_color=None, border_thickness=1):
    """Vẽ khối kính mờ bo tròn góc siêu mịn (Anti-Aliased Frosted Glass ROI)"""
    x1, y1 = pt1
    x2, y2 = pt2
    x1 = max(0, min(img.shape[1] - 1, x1))
    y1 = max(0, min(img.shape[0] - 1, y1))
    x2 = max(0, min(img.shape[1], x2))
    y2 = max(0, min(img.shape[0], y2))
    if x2 <= x1 or y2 <= y1:
        return
    w = x2 - x1
    h = y2 - y1
    radius = min(radius, w // 2, h // 2)
    roi = img[y1:y2, x1:x2]

    # Tạo mặt nạ bo góc chống răng cưa
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.rectangle(mask, (radius, 0), (w - radius, h), 255, -1)
    cv2.rectangle(mask, (0, radius), (w, h - radius), 255, -1)
    cv2.circle(mask, (radius, radius), radius, 255, -1, cv2.LINE_AA)
    cv2.circle(mask, (w - radius, radius), radius, 255, -1, cv2.LINE_AA)
    cv2.circle(mask, (radius, h - radius), radius, 255, -1, cv2.LINE_AA)
    cv2.circle(mask, (w - radius, h - radius), radius, 255, -1, cv2.LINE_AA)

    # Hòa trộn màu nền kính mờ
    color_block = np.full_like(roi, bg_color)
    blended = cv2.addWeighted(color_block, alpha, roi, 1.0 - alpha, 0)
    np.copyto(roi, blended, where=(mask[:, :, None] > 0))

    # Vẽ đường viền tinh tế
    if border_color is not None and border_thickness > 0:
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(roi, contours, -1, border_color, border_thickness, cv2.LINE_AA)

# -----------------------------------------------------------------------------
# AimHistory Buffer (Ported from CardboardXR AimHistory.cs)
# -----------------------------------------------------------------------------
class AimHistory:
    """
    Recent pointing rays buffer:
    Closing fingers moves the point between them by a median 5.6 degrees on phones.
    AimHistory samples the ray from 0.20s ago before fingers started closing,
    completely eliminating ray jumping/slipping off buttons during pinch!
    """
    def __init__(self, keep_seconds=0.5):
        self.keep_seconds = keep_seconds
        self.history = [] # [ (t, p_knuckle, p_tip, laser_end) ]

    def add(self, t, p_knuckle, p_tip, laser_end):
        self.history.append((t, p_knuckle, p_tip, laser_end))
        while self.history and (t - self.history[0][0] > self.keep_seconds):
            self.history.pop(0)

    def get_lookback_aim(self, current_t, lookback_seconds=0.18):
        if not self.history:
            return None
        target_t = current_t - lookback_seconds
        for i in range(len(self.history) - 1, -1, -1):
            if self.history[i][0] <= target_t:
                return self.history[i]
        return self.history[0]

# -----------------------------------------------------------------------------
# Palm Gesture Detector (Ported from CardboardXR PalmGesture.cs)
# -----------------------------------------------------------------------------
class PalmGestureDetector:
    """
    visionOS & CardboardXR Palm System Gate:
    Detects when hand shows palm squarely to camera to summon the spatial settings gear.
    """
    def __init__(self, show_thresh=0.34, hide_thresh=0.18, show_time=0.20, hide_time=0.28):
        self.show_thresh = show_thresh
        self.hide_thresh = hide_thresh
        self.show_time = show_time
        self.hide_time = hide_time
        self.facing_start = 0.0
        self.unfacing_start = 0.0
        self.is_facing = False
        self.gear_pos = None

    def update(self, lms_2d, now):
        if lms_2d is None or len(lms_2d) < 21:
            self.facing_start = 0.0
            self.unfacing_start = 0.0
            self.is_facing = False
            self.gear_pos = None
            return False, 0.0, None

        wrist = lms_2d[0]
        thumb_tip = lms_2d[4]
        index_knuckle = lms_2d[5]
        index_tip = lms_2d[8]
        pinky_knuckle = lms_2d[17]
        middle_tip = lms_2d[12]

        to_index = (index_knuckle[0] - wrist[0], index_knuckle[1] - wrist[1])
        to_pinky = (pinky_knuckle[0] - wrist[0], pinky_knuckle[1] - wrist[1])
        len_i = math.hypot(to_index[0], to_index[1])
        len_p = math.hypot(to_pinky[0], to_pinky[1])
        if len_i * len_p < 1e-4:
            return False, 0.0, None

        cross = to_index[0] * to_pinky[1] - to_index[1] * to_pinky[0]
        facing = -cross / (len_i * len_p)

        dist_wrist_mid = math.hypot(middle_tip[0] - wrist[0], middle_tip[1] - wrist[1])
        is_open = dist_wrist_mid > (len_i * 0.95)

        # Gear button sits between thumb and index finger (k_ThumbJoint & k_IndexJoint)
        gear_x = int((thumb_tip[0] + index_tip[0]) * 0.5)
        gear_y = int((thumb_tip[1] + index_tip[1]) * 0.5)
        self.gear_pos = (gear_x, gear_y)

        facing_mag = abs(facing)
        if is_open:
            if not self.is_facing:
                if facing_mag > self.show_thresh:
                    if self.facing_start == 0.0:
                        self.facing_start = now
                    elif (now - self.facing_start) >= self.show_time:
                        self.is_facing = True
                        self.unfacing_start = 0.0
                else:
                    self.facing_start = 0.0
            else:
                if facing_mag < self.hide_thresh:
                    if self.unfacing_start == 0.0:
                        self.unfacing_start = now
                    elif (now - self.unfacing_start) >= self.hide_time:
                        self.is_facing = False
                        self.facing_start = 0.0
                else:
                    self.unfacing_start = 0.0
        else:
            self.is_facing = False
            self.facing_start = 0.0
            self.unfacing_start = 0.0

        return self.is_facing, facing, self.gear_pos

# -----------------------------------------------------------------------------
# Material 3 Spatial Button (Ported from M3Button.cs & M3StateLayer.cs)
# -----------------------------------------------------------------------------
class M3SpatialButton:
    """Nút bấm không gian 3D chuẩn Material 3: Bo tròn, State Layer phản hồi xúc giác"""
    def __init__(self, btn_id, label, icon, x, y, w, h, radius=18, is_active=False, category="all", color=None, tagline=""):
        self.btn_id = btn_id
        self.label = label
        self.icon = icon
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

    def contains(self, px, py):
        return (self.x <= px <= self.x + self.w) and (self.y <= py <= self.y + self.h)

    def intersects_segment(self, p1, p2):
        if self.contains(p1[0], p1[1]) or self.contains(p2[0], p2[1]):
            return True
        steps = 12
        for s in range(1, steps):
            t = s / float(steps)
            sx = p1[0] + (p2[0] - p1[0]) * t
            sy = p1[1] + (p2[1] - p1[1]) * t
            if self.contains(sx, sy):
                return True
        return False

    def draw(self, frame, now, offset_x=0):
        bx = self.x + offset_x
        by = self.y
        bw = self.w
        bh = self.h

        # Màu nền và State Layer (M3StateLayer)
        bg = M3Theme.SurfaceContainerHigh
        border = M3Theme.OutlineVariant
        text_col = M3Theme.OnSurface

        if self.is_active:
            bg = M3Theme.PrimaryContainer
            border = M3Theme.Primary
            text_col = M3Theme.OnPrimaryContainer
        elif self.is_hovered:
            bg = (70, 60, 68) # Hover brighten
            border = M3Theme.Primary
            text_col = (255, 255, 255)

        # Vẽ khối kính mờ bo tròn
        draw_rounded_glass(frame, (bx, by), (bx + bw, by + bh), bg, radius=self.radius, alpha=0.88,
                           border_color=border, border_thickness=2 if (self.is_hovered or self.is_active) else 1)

        # Vẽ Icon hoặc Nhãn text
        display_text = f"{self.icon} {self.label}".strip() if self.icon else self.label
        font_scale = 0.40 if len(display_text) > 10 else 0.44
        (tw, th), _ = cv2.getTextSize(display_text, cv2.FONT_HERSHEY_DUPLEX, font_scale, 1)
        tx = bx + (bw - tw) // 2
        ty = by + (bh + th) // 2
        cv2.putText(frame, display_text, (tx, ty), cv2.FONT_HERSHEY_DUPLEX, font_scale, text_col, 1, cv2.LINE_AA)

        # Hiệu ứng gợn sóng khi bấm (Click Ripple)
        if now - self.ripple_time < 0.28:
            prog = (now - self.ripple_time) / 0.28
            r = int(prog * max(bw, bh))
            cv2.circle(frame, (bx + bw // 2, by + bh // 2), r, (255, 255, 255), 2, cv2.LINE_AA)

# -----------------------------------------------------------------------------
# CardboardXR Complete In-Air Spatial UI Suite (M3Toolbar + AppLibrary)
# -----------------------------------------------------------------------------
class SpatialInAirMenu:
    """
    Hệ thống Giao diện và Điều khiển Không gian hoàn chỉnh chuẩn CardboardXR:
    - M3 Floating Capsule Toolbar (y=620)
    - App Library Grid (y=340) với 5 Tiles & Taglines giải thích trực quan
    - AimHistory chống giật tia khi chụm ngón
    - Cổng cử chỉ Lòng bàn tay (visionOS Palm System Gate)
    - Tách biệt luồng Passthrough AR không bị vẽ đè xương tay thô kệch
    """
    def __init__(self):
        self.is_open = True
        self.is_library_open = False # CardboardXR App Library Grid (Mở từ nút APPS)
        self.show_skeleton_debug = False # Passthrough sạch sẽ: Tắt khung xương vẽ đè mặc định
        self.last_click_t = 0.0
        self.click_lockout = 0.35
        self.palm_detector = PalmGestureDetector(show_thresh=0.34, hide_thresh=0.18, show_time=0.20, hide_time=0.28)
        self.aim_history = AimHistory(keep_seconds=0.5)
        self.last_pinch_toggle_t = 0.0
        self.hovered_tagline = ""

        self.toolbar_buttons = []
        self.library_tiles = []
        self.sub_buttons = []
        self._build_ui()

    def _build_ui(self):
        # =====================================================================
        # 1. CARDBOARDXR M3 ORBITER TOOLBAR (Floating Capsule Dock y = 628, h = 56)
        # =====================================================================
        self.toolbar_buttons = []
        tb_y = 628
        tb_h = 52
        
        # 5 Nút chính trên thanh Capsule Toolbar
        # [APPS] [VIEW: 1-SCR] [RECENTER] [CAM USB] [X CLOSE]
        self.toolbar_buttons.append(M3SpatialButton("tb_apps", "APPS", "[+]", 24, tb_y, 96, tb_h, radius=24, is_active=False))
        self.toolbar_buttons.append(M3SpatialButton("tb_view", "1-SCR", "[O]", 128, tb_y, 110, tb_h, radius=24, is_active=True))
        self.toolbar_buttons.append(M3SpatialButton("tb_recenter", "RESET", "[*]", 246, tb_y, 100, tb_h, radius=24))
        self.toolbar_buttons.append(M3SpatialButton("tb_cam", "IPHONE", "[~]", 354, tb_y, 106, tb_h, radius=24))
        self.toolbar_buttons.append(M3SpatialButton("tb_close", "CLOSE", "[X]", 468, tb_y, 94, tb_h, radius=24, color=M3Theme.Error))

        # =====================================================================
        # 2. CARDBOARDXR APP LIBRARY GRID (Floating Panel y = 370, h = 230)
        # =====================================================================
        self.library_tiles = []
        # 5 CardboardXR Apps: Paint 3D, Portal, Orb Rush, Cubes, Caliper
        apps = [
            ("demo_1", "PAINT 3D", "Pinch to draw 3D ribbons in the air", 32, 385, 160, 68, M3Theme.TintPaint),
            ("demo_2", "PORTAL", "A doorway into a 3D starfield universe", 204, 385, 160, 68, M3Theme.TintPortal),
            ("demo_3", "ORB RUSH", "Pop floating glowing rhythm orbs", 376, 385, 160, 68, M3Theme.TintRush),
            ("demo_4", "CUBES", "Grab, throw, and stack 3D physics cubes", 118, 465, 160, 68, M3Theme.TintCubes),
            ("demo_5", "CALIPER", "Measure real-world objects in millimeters", 290, 465, 160, 68, M3Theme.TintCaliper),
        ]
        for b_id, label, tagline, x, y, w, h, col in apps:
            tile = M3SpatialButton(b_id, label, "", x, y, w, h, radius=18, is_active=(b_id=="demo_1"), color=col, tagline=tagline)
            self.library_tiles.append(tile)

        # =====================================================================
        # 3. CONTEXTUAL SUB-TOOLS (Floating Controls y = 560, h = 42)
        # =====================================================================
        self.sub_buttons = []
        y_sub = 564
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
            self.sub_buttons.append(M3SpatialButton(b_id, "", "", 30 + i * 54, y_sub, 44, h_sub, radius=22, is_active=(i==1), color=col, category="paint"))
        self.sub_buttons.append(M3SpatialButton("btn_undo", "UNDO", "", 310, y_sub, 76, h_sub, radius=16, category="paint"))
        self.sub_buttons.append(M3SpatialButton("btn_clear", "CLEAR", "", 394, y_sub, 82, h_sub, radius=16, category="paint"))

        # Orb Rush Controls
        self.sub_buttons.append(M3SpatialButton("rush_start", "START GAME", "", 30, y_sub, 140, h_sub, radius=18, category="rush"))
        self.sub_buttons.append(M3SpatialButton("rush_reset_combo", "RESET COMBO", "", 180, y_sub, 140, h_sub, radius=18, category="rush"))

        # Cubes Controls
        self.sub_buttons.append(M3SpatialButton("cube_reset", "RESET CUBES POS", "", 30, y_sub, 180, h_sub, radius=18, category="cube"))

        # Portal Controls
        self.sub_buttons.append(M3SpatialButton("portal_reset", "RE-CENTER PORTAL", "", 30, y_sub, 180, h_sub, radius=18, category="portal"))

        # Quick Camera Flip Controls on Top Bar (y = 16, h = 32)
        y_top = 16
        self.sub_buttons.append(M3SpatialButton("set_flip_v", "FLIP V", "", 24, y_top, 74, 32, radius=16, category="settings"))
        self.sub_buttons.append(M3SpatialButton("set_flip_h", "MIRROR", "", 106, y_top, 78, 32, radius=16, category="settings"))
        self.sub_buttons.append(M3SpatialButton("set_rot", "ROT 180", "", 192, y_top, 82, 32, radius=16, category="settings"))
        self.sub_buttons.append(M3SpatialButton("set_ipd_sub", "IPD -", "", 282, y_top, 56, 32, radius=16, category="settings"))
        self.sub_buttons.append(M3SpatialButton("set_ipd_add", "IPD +", "", 346, y_top, 56, 32, radius=16, category="settings"))
        self.sub_buttons.append(M3SpatialButton("toggle_skel", "SKEL OFF", "", 410, y_top, 96, 32, radius=16, category="settings"))

    def update(self, lms_2d, p_knuckle, p_tip, laser_end, is_pinched, now, suite, bridge=None):
        """
        Quy trình xử lý tương tác chuẩn CardboardXR PinchRouter & AimHistory:
        1. Ghi nhận tia vào AimHistory buffer
        2. Khi có Pinch -> Lấy hướng tia từ 0.18s trước để triệt tiêu độ lệch gập ngón tay
        3. Kiểm tra Palm Summoner Gear khi mở bàn tay
        4. Kiểm tra va chạm tia với các nút trên Toolbar / App Library
        """
        # 1. Cập nhật AimHistory buffer
        if p_knuckle is not None and p_tip is not None and laser_end is not None:
            self.aim_history.add(now, p_knuckle, p_tip, laser_end)

        # 2. Sử dụng tia ổn định từ AimHistory nếu đang Pinch
        effective_tip = p_tip
        effective_laser = laser_end
        if is_pinched:
            lookback_sample = self.aim_history.get_lookback_aim(now, lookback_seconds=0.18)
            if lookback_sample is not None:
                effective_tip = lookback_sample[2]
                effective_laser = lookback_sample[3]

        # 3. Kiểm tra Cổng cử chỉ Lòng bàn tay (visionOS Palm Gate)
        is_palm_facing, facing_score, gear_pos = self.palm_detector.update(lms_2d, now)

        # Nếu Menu đang đóng và người dùng nhìn vào lòng bàn tay -> Pinch để mở
        if not self.is_open:
            if is_palm_facing and is_pinched and (now - self.last_pinch_toggle_t > 0.40):
                self.last_pinch_toggle_t = now
                self.last_click_t = now
                self.is_open = True
                play_click_chime()
                print("\n[CardboardXR] >>> PALM PINCH: OPENED SPATIAL TOOLBAR! <<<")
                return True, None
            for b in self.toolbar_buttons + self.library_tiles + self.sub_buttons:
                b.is_hovered = False
            return False, None

        # 4. Kiểm tra tương tác tia khi Menu đang mở
        hovered_btn = None
        consumed = False
        self.hovered_tagline = ""

        # Gom danh sách các nút đang hiển thị
        active_buttons = list(self.toolbar_buttons)
        if self.is_library_open:
            active_buttons.extend(self.library_tiles)

        # Thêm các nút sub-tools theo category hiện tại
        cur_mode = suite.current_mode if suite else 1
        cat_map = {1: "paint", 2: "portal", 3: "rush", 4: "cube", 5: "caliper"}
        cur_cat = cat_map.get(cur_mode, "paint")
        for b in self.sub_buttons:
            if b.category in ["settings", cur_cat]:
                active_buttons.append(b)

        if effective_tip is not None and effective_laser is not None:
            # Ưu tiên số 1: Nút mà điểm ngắm con trỏ Laser đang đặt lên (Laser Reticle Focus)
            target_hit = None
            for btn in active_buttons:
                if btn.contains(effective_laser[0], effective_laser[1]):
                    target_hit = btn
                    break

            # Ưu tiên số 2: Chạm trực tiếp bằng đầu ngón tay (Near-touch)
            if target_hit is None:
                for btn in active_buttons:
                    if btn.contains(effective_tip[0], effective_tip[1]):
                        target_hit = btn
                        break

            # Ưu tiên số 3: Tia cắt qua nút (Raycast Sweep)
            if target_hit is None:
                for btn in active_buttons:
                    if btn.intersects_segment(effective_tip, effective_laser):
                        target_hit = btn
                        break

            for btn in active_buttons:
                btn.is_hovered = (btn == target_hit)

            hovered_btn = target_hit
            if hovered_btn is not None and hovered_btn.tagline:
                self.hovered_tagline = hovered_btn.tagline

            if hovered_btn is not None:
                if is_pinched and (now - self.last_click_t > self.click_lockout):
                    self.last_click_t = now
                    hovered_btn.ripple_time = now
                    consumed = True
                    play_click_chime()
                    self._dispatch_click(hovered_btn.btn_id, suite, bridge, now)
            else:
                if is_pinched:
                    consumed = True # Consumed by menu to prevent stray background actions
        else:
            for btn in active_buttons:
                btn.is_hovered = False

        return consumed, hovered_btn

    def _dispatch_click(self, btn_id, suite, bridge, now):
        print(f"\n[CardboardXR] >>> IN-AIR CLICK: {btn_id} <<<")
        if btn_id == "tb_apps":
            self.is_library_open = not self.is_library_open
        elif btn_id == "tb_view":
            target_suite = bridge.suite if bridge else suite
            if target_suite:
                target_suite.stereo_vr_mode = not target_suite.stereo_vr_mode
                self._last_stereo = target_suite.stereo_vr_mode
                desc = "STEREO SBS (VR KÍNH)" if target_suite.stereo_vr_mode else "1 MÀN HÌNH DUY NHẤT (PHONE VIEW)"
                print(f"[CardboardXR] Chế độ hiển thị: {desc}")
                for b in self.toolbar_buttons:
                    if b.btn_id == "tb_view":
                        b.label = "SBS VR" if target_suite.stereo_vr_mode else "1-SCR"
                        b.is_active = target_suite.stereo_vr_mode
        elif btn_id == "tb_recenter":
            if suite and suite.current_mode == 4:
                suite.cube_demo.pos = np.array([0.0, 0.0, 1.1])
                suite.cube_demo.vel = np.array([0.0, 0.0, 0.0])
            elif suite and suite.current_mode == 2:
                suite.portal_demo.pos = np.array([0.0, -0.2, 1.4])
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
            self.is_library_open = False # Auto-close library upon app selection (AppLibrary.cs)
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

        # Cập nhật trạng thái active
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
        """
        Render toàn bộ giao diện CardboardXR chuẩn Material 3
        """
        # Đồng bộ nhãn nút động
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

        # 1. Vẽ Palm Summoner Gear Button giữa ngón cái và trỏ (khi Menu đang ĐÓNG)
        if not self.is_open and self.palm_detector.gear_pos is not None and self.palm_detector.is_facing:
            gx, gy = self.palm_detector.gear_pos[0] + eye_offset_x, self.palm_detector.gear_pos[1]
            pulse = int(140 + 115 * math.sin(now * 7.0))
            ring_col = (pulse, 240, 255)

            # Vòng tròn phát sáng nhịp tim
            cv2.circle(frame, (gx, gy), 32, ring_col, 2, cv2.LINE_AA)
            cv2.circle(frame, (gx, gy), 24, M3Theme.SurfaceContainerHigh, -1, cv2.LINE_AA)
            cv2.circle(frame, (gx, gy), 24, M3Theme.Primary, 1, cv2.LINE_AA)

            (tw, th), _ = cv2.getTextSize("MENU", cv2.FONT_HERSHEY_DUPLEX, 0.36, 1)
            cv2.putText(frame, "MENU", (gx - tw // 2, gy + th // 2), cv2.FONT_HERSHEY_DUPLEX, 0.36, M3Theme.OnSurface, 1, cv2.LINE_AA)

            hint = "CHUM DE MO"
            (hw, hh), _ = cv2.getTextSize(hint, cv2.FONT_HERSHEY_SIMPLEX, 0.34, 1)
            cv2.putText(frame, hint, (gx - hw // 2, gy + 44), cv2.FONT_HERSHEY_SIMPLEX, 0.34, M3Theme.Primary, 1, cv2.LINE_AA)

        if not self.is_open:
            # Nhắc nhở tinh tế dưới đáy
            cv2.putText(frame, "[XOE LONG BAN TAY & CHUM NGON DE MO MENU]", (90 + eye_offset_x, 695),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.40, M3Theme.OnSurfaceVariant, 1, cv2.LINE_AA)
            return

        # 2. Vẽ Background Capsule cho M3 Toolbar (y=620, h=68, w=560)
        tb_box_x1 = 12 + eye_offset_x
        tb_box_x2 = 580 + eye_offset_x
        tb_box_y1 = 618
        tb_box_y2 = 690
        draw_rounded_glass(frame, (tb_box_x1, tb_box_y1), (tb_box_x2, tb_box_y2), M3Theme.SurfaceContainer,
                           radius=32, alpha=0.90, border_color=M3Theme.OutlineVariant, border_thickness=1)

        # 3. Vẽ App Library Grid nếu đang bật (AppLibrary.cs)
        if self.is_library_open:
            lib_x1 = 16 + eye_offset_x
            lib_x2 = 560 + eye_offset_x
            lib_y1 = 345
            lib_y2 = 590
            draw_rounded_glass(frame, (lib_x1, lib_y1), (lib_x2, lib_y2), M3Theme.SurfaceContainerHigh,
                               radius=28, alpha=0.92, border_color=M3Theme.Primary, border_thickness=2)

            # Tiêu đề App Library
            cv2.putText(frame, "CARDBOARDXR // APP LIBRARY", (lib_x1 + 24, lib_y1 + 28),
                        cv2.FONT_HERSHEY_DUPLEX, 0.42, M3Theme.Primary, 1, cv2.LINE_AA)

            # Vẽ các Tiles ứng dụng
            for tile in self.library_tiles:
                tile.draw(frame, now, eye_offset_x)

            # Thanh Tagline giải thích ứng dụng đang chỉ vào
            tagline_text = self.hovered_tagline if self.hovered_tagline else "Look at an app to see what it is"
            (tw, th), _ = cv2.getTextSize(tagline_text, cv2.FONT_HERSHEY_SIMPLEX, 0.38, 1)
            cv2.putText(frame, tagline_text, (lib_x1 + (lib_x2 - lib_x1 - tw) // 2, lib_y2 - 16),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.38, M3Theme.OnSurfaceVariant, 1, cv2.LINE_AA)

        # 4. Vẽ Contextual Sub-Tools (nếu Library đang đóng)
        if not self.is_library_open:
            cat_map = {1: "paint", 2: "portal", 3: "rush", 4: "cube", 5: "caliper"}
            cur_cat = cat_map.get(current_mode, "paint")
            for btn in self.sub_buttons:
                if btn.category in ["settings", cur_cat]:
                    btn.draw(frame, now, eye_offset_x)

        # 5. Vẽ các nút trên Toolbar
        for btn in self.toolbar_buttons:
            btn.draw(frame, now, eye_offset_x)

    def draw_cursor_reticle(self, frame, cursor_pt, is_pinched, is_hovering=False):
        """
        Vẽ con trỏ ngắm không gian chuẩn CardboardXR HandRayView.cs:
        - Passthrough tinh tế: Chấm trắng mềm mại khi nhàn rỗi
        - Phóng to và chuyển sang màu vàng hổ phách (Amber) khi Pinch
        - Vòng ánh sáng mở rộng khi trúng nút
        """
        if cursor_pt is None:
            return
        cx, cy = int(cursor_pt[0]), int(cursor_pt[1])
        if cx < 0 or cx >= frame.shape[1] or cy < 0 or cy >= frame.shape[0]:
            return

        color = M3Theme.TintAmber if is_pinched else (255, 255, 255)
        radius = 7 if is_pinched else (5 if is_hovering else 4)

        # Vầng sáng mờ xung quanh
        cv2.circle(frame, (cx, cy), radius + 3, (40, 40, 50), -1, cv2.LINE_AA)
        cv2.circle(frame, (cx, cy), radius, color, -1, cv2.LINE_AA)
        if is_hovering:
            cv2.circle(frame, (cx, cy), radius + 6, M3Theme.Primary, 1, cv2.LINE_AA)
