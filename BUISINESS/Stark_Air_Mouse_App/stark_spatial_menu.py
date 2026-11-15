"""
=============================================================================
STARK CARDBOARDXR // IN-AIR SPATIAL FLOATING UI & PALM SYSTEM GATE v10.2.81 PRO
=============================================================================
Port of CardboardXR (macOS/Unity) In-Air UI & Gesture Control into STARK:
- Zero Laptop Keyboard Dependency: 100% Controllable in thin air while wearing VR headset.
- Apple Vision Pro Palm System Gate (PalmGesture.cs & SettingsSummoner.cs).
- Material 3 Spatial Floating Toolbar & App Library Dock.
- 5 Core Demos: Paint 3D, AR Portal, Orb Rush, Cube Physics, 3D Caliper.
- Contextual Sub-Tools: Color swatches, Undo, Clear, Restart Game, Reset Cube.
- Quick In-Air VR Settings: IPD +/- calibration, Rotation 180 flip, FOV/Crop mode, Camera switch.
- Stereoscopic Dual-Eye (SBS) Parallax: Renders with true 3D physical depth.
- Hysteresis Pinch Router: Consumes pinch on UI, routes to demo when in free space.
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
    """Phat am thanh click khong gian phan hoi xuc giac nhe"""
    if HAVE_SOUND:
        try:
            winsound.MessageBeep(winsound.MB_OK)
        except Exception:
            pass


class PalmGestureDetector:
    """
    Port of CardboardXR PalmGesture.cs & PalmFacingState (visionOS Palm System Gate).
    Nhan dien khi nguoi dung xoe long ban tay huong ve mat de hien thi nut cai dat khong gian.
    """
    def __init__(self, show_thresh=0.35, hide_thresh=0.18, show_time=0.20, hide_time=0.30):
        self.show_thresh = show_thresh
        self.hide_thresh = hide_thresh
        self.show_time = show_time
        self.hide_time = hide_time
        self.facing_start = 0.0
        self.unfacing_start = 0.0
        self.is_facing = False
        self.last_facing_score = 0.0
        self.gear_button_pos = None

    def update(self, lms_2d, now):
        """
        lms_2d: 21 diem khop tay tren frame (x, y)
        Tra ve: (is_facing, facing_score, gear_pos)
        """
        if lms_2d is None or len(lms_2d) < 21:
            self.facing_start = 0.0
            self.unfacing_start = 0.0
            self.is_facing = False
            self.gear_button_pos = None
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

        # Cross product 2D theo cong thuc CardboardXR PalmGesture.cs
        cross = to_index[0] * to_pinky[1] - to_index[1] * to_pinky[0]
        facing = -cross / (len_i * len_p)
        self.last_facing_score = facing

        # Kiem tra ban tay co dang mo (khong nam dam)
        dist_wrist_mid = math.hypot(middle_tip[0] - wrist[0], middle_tip[1] - wrist[1])
        is_open = dist_wrist_mid > (len_i * 0.95)

        # Toa do nut Settings Gear: Giua ngon cai va ngon tro (k_ThumbJoint & k_IndexJoint)
        gear_pos = (
            int((thumb_tip[0] + index_tip[0]) * 0.5),
            int((thumb_tip[1] + index_tip[1]) * 0.5)
        )
        self.gear_button_pos = gear_pos

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

        return self.is_facing, facing, gear_pos


class SpatialButton:
    """Nut bam khong gian 3D phong cach Material 3 / Vision Pro Glass"""
    def __init__(self, btn_id, label, x, y, w, h, color=(0, 243, 255), is_active=False, category="mode"):
        self.btn_id = btn_id
        self.label = label
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.color = color
        self.is_active = is_active
        self.category = category
        self.is_hovered = False
        self.ripple_time = 0.0

    def contains(self, px, py):
        return (self.x <= px <= self.x + self.w) and (self.y <= py <= self.y + self.h)

    def intersects_segment(self, p1, p2):
        if self.contains(p1[0], p1[1]) or self.contains(p2[0], p2[1]):
            return True
        steps = 14
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

        # Nen kinh mo (Frosted Glass) - High-Performance In-Place ROI Blending (Zero Frame Copy)
        x1 = max(0, min(frame.shape[1] - 1, bx))
        y1 = max(0, min(frame.shape[0] - 1, by))
        x2 = max(0, min(frame.shape[1], bx + bw))
        y2 = max(0, min(frame.shape[0], by + bh))
        if x2 > x1 and y2 > y1:
            bg_col = (20, 26, 32)
            if self.is_active:
                bg_col = (15, 75, 45) # Active Green
            if self.is_hovered:
                bg_col = (45, 95, 125) if not self.is_active else (25, 120, 70)
            roi = frame[y1:y2, x1:x2]
            cv2.addWeighted(np.full_like(roi, bg_col), 0.72, roi, 0.28, 0, roi)

        # Vien phat sang Neon
        border_col = (0, 255, 128) if self.is_active else self.color
        border_thick = 2
        if self.is_hovered:
            border_col = (0, 255, 255) # Bright gold/cyan highlight
            border_thick = 3
        cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), border_col, border_thick, cv2.LINE_AA)

        # Chu thich nut
        font_scale = 0.38 if len(self.label) > 8 else 0.44
        (tw, th), _ = cv2.getTextSize(self.label, cv2.FONT_HERSHEY_DUPLEX, font_scale, 1)
        tx = bx + (bw - tw) // 2
        ty = by + (bh + th) // 2
        text_col = (255, 255, 255) if (self.is_hovered or self.is_active) else (210, 230, 230)
        cv2.putText(frame, self.label, (tx, ty), cv2.FONT_HERSHEY_DUPLEX, font_scale, text_col, 1, cv2.LINE_AA)

        # Hieu ung song xung kich khi click (Click Ripple Effect)
        if now - self.ripple_time < 0.28:
            prog = (now - self.ripple_time) / 0.28
            r = int(prog * max(bw, bh))
            cx, cy = bx + bw // 2, by + bh // 2
            cv2.circle(frame, (cx, cy), r, (255, 255, 255), 2, cv2.LINE_AA)


class SpatialInAirMenu:
    """
    Thanh dieu khien khong gian 3D hoan chinh (M3 Spatial In-Air Toolbar).
    Port of CardboardXR (M3Toolbar.cs, SettingsSummoner.cs, PalmGesture.cs, PinchRouter.cs).
    Cho phep nguoi dung dieu khien 100% he thong tren khong ma khong can cham vao ban phim laptop.
    """
    def __init__(self):
        self.is_open = True
        self.last_click_t = 0.0
        self.click_lockout = 0.35 # Lockout 0.35s chong double-click nham
        self.palm_detector = PalmGestureDetector(show_thresh=0.35, hide_thresh=0.18, show_time=0.20, hide_time=0.30)
        self.palm_gear_pos = None
        self.last_pinch_toggle_t = 0.0
        self.buttons = []
        self._build_buttons()

    def _build_buttons(self):
        self.buttons = []

        # =====================================================================
        # 1. HANG CHINH: 5 DEMO APPS CUA CARDBOARDXR (y = 600, h = 46)
        # =====================================================================
        btn_w = 112
        btn_h = 44
        gap = 8
        start_x = 20
        y_modes = 600
        demos = [
            ("demo_1", "PAINT 3D"),
            ("demo_2", "PORTAL"),
            ("demo_3", "ORB RUSH"),
            ("demo_4", "CUBES"),
            ("demo_5", "CALIPER")
        ]
        for i, (b_id, label) in enumerate(demos):
            bx = start_x + i * (btn_w + gap)
            self.buttons.append(SpatialButton(b_id, label, bx, y_modes, btn_w, btn_h, is_active=(i==0), category="mode"))

        # =====================================================================
        # 2. HANG CONTEXTUAL SUB-TOOLS: THEO CHE DO HIEN TAI (y = 548, h = 36)
        # =====================================================================
        y_sub = 548

        # Mode 1: 3D Paint Palette & Actions
        palette = [
            ("col_0", "MAGENTA", (255, 0, 255)),
            ("col_1", "CYAN", (0, 243, 255)),
            ("col_2", "GREEN", (0, 255, 128)),
            ("col_3", "ORANGE", (0, 165, 255)),
            ("col_4", "WHITE", (255, 255, 255))
        ]
        sw_w = 66
        sw_h = 36
        sw_gap = 6
        sw_start_x = 20
        for i, (b_id, label, col) in enumerate(palette):
            bx = sw_start_x + i * (sw_w + sw_gap)
            self.buttons.append(SpatialButton(b_id, label, bx, y_sub, sw_w, sw_h, color=col, is_active=(i==1), category="paint"))

        self.buttons.append(SpatialButton("btn_undo", "UNDO", 380, y_sub, 70, sw_h, color=(220, 220, 100), category="paint"))
        self.buttons.append(SpatialButton("btn_clear", "CLEAR", 456, y_sub, 70, sw_h, color=(120, 120, 255), category="paint"))

        # Mode 3: Orb Rush Controls
        self.buttons.append(SpatialButton("rush_start", "START/RESTART ⚡", 20, y_sub, 180, sw_h, color=(0, 255, 128), category="rush"))
        self.buttons.append(SpatialButton("rush_reset_combo", "RESET COMBO", 210, y_sub, 140, sw_h, color=(0, 243, 255), category="rush"))

        # Mode 4: Cube Physics Controls
        self.buttons.append(SpatialButton("cube_reset", "RESET CUBE POS 📦", 20, y_sub, 180, sw_h, color=(0, 243, 255), category="cube"))

        # Mode 2 & 5 Controls
        self.buttons.append(SpatialButton("portal_reset", "RE-CENTER PORTAL 🌀", 20, y_sub, 190, sw_h, color=(0, 243, 255), category="portal"))

        # Nut [X CLOSE] luon o goc phai cua sub-row
        self.buttons.append(SpatialButton("btn_hide", "X CLOSE", 532, y_sub, 80, sw_h, color=(255, 100, 100), category="all"))

        # =====================================================================
        # 3. HANG TOP QUICK SETTINGS BAR (y = 16, h = 30) - 100% IN-AIR CONTROL
        # =====================================================================
        y_top = 16
        self.buttons.append(SpatialButton("set_view_mode", "VIEW: 1-SCR", 14, y_top, 88, 30, color=(0, 255, 128), category="settings"))
        self.buttons.append(SpatialButton("set_ipd_sub", "IPD -", 108, y_top, 52, 30, color=(0, 243, 255), category="settings"))
        self.buttons.append(SpatialButton("set_ipd_add", "IPD +", 164, y_top, 52, 30, color=(0, 243, 255), category="settings"))
        self.buttons.append(SpatialButton("set_flip_v", "FLIP V", 220, y_top, 64, 30, color=(0, 243, 255), category="settings"))
        self.buttons.append(SpatialButton("set_flip_h", "MIRROR", 288, y_top, 68, 30, color=(0, 243, 255), category="settings"))
        self.buttons.append(SpatialButton("set_rot", "ROT 180", 360, y_top, 68, 30, color=(0, 243, 255), category="settings"))
        self.buttons.append(SpatialButton("set_cam", "CAM USB", 432, y_top, 78, 30, color=(0, 243, 255), category="settings"))
        self.buttons.append(SpatialButton("btn_hide", "X CLOSE", 516, y_top, 74, 30, color=(255, 100, 100), category="settings"))

    def update(self, lms_2d, p_knuckle, p_tip, laser_end, is_pinched, now, suite, bridge=None):
        """
        Kiem tra cu chi long ban tay (Palm Gate) va tia chi dinh (Raycast).
        Thuc thi theo dung quy tac CardboardXR PinchRouter.cs:
        1. Palm Gear showing + Pinch -> Open/Close Settings
        2. Menu Open + Ray on Button + Pinch -> Click Button
        3. Menu Open + Pinch elsewhere -> Consumed by Menu (Block demos from drawing)
        4. Menu Closed -> Forward pinch to active demo
        Tra ve: (consumed, hovered_button)
        """
        # 1. Kiem tra Palm System Gate (visionOS Style - SettingsSummoner.cs)
        is_palm_facing, facing_score, gear_pos = self.palm_detector.update(lms_2d, now)
        self.palm_gear_pos = gear_pos

        # Quy tac CardboardXR SettingsSummoner.cs:
        # Nut Gear o long ban tay chi xuat hien va nhan Pinch de MO MENU khi Menu dang DONG!
        # Khi Menu da mo, nut [X CLOSE] tren thanh toolbar se dung de dong menu.
        if not self.is_open:
            if is_palm_facing and is_pinched and (now - self.last_pinch_toggle_t > 0.40):
                self.last_pinch_toggle_t = now
                self.last_click_t = now
                self.is_open = True
                play_click_chime()
                print(f"\n[SpatialMenu] >>> PALM PINCH TRIGGERED! In-Air Menu is_open = True <<<")
                return True, None
            for btn in self.buttons:
                btn.is_hovered = False
            return False, None

        # 3. Kiem tra va cham Raycast & Direct Touch khi Menu dang mo
        hovered_btn = None
        consumed = False

        if p_tip is not None and laser_end is not None:
            # Chi kiem tra cac button phu hop voi category cua mode hien tai
            cur_mode = suite.current_mode if suite else 1
            cat_map = {1: "paint", 2: "portal", 3: "rush", 4: "cube", 5: "caliper"}
            cur_cat = cat_map.get(cur_mode, "paint")

            for btn in self.buttons:
                if btn.category not in ["mode", "settings", "all", cur_cat]:
                    btn.is_hovered = False
                    continue

                hit = btn.intersects_segment(p_tip, laser_end) or btn.contains(p_tip[0], p_tip[1])
                btn.is_hovered = hit
                if hit and hovered_btn is None:
                    hovered_btn = btn

            if hovered_btn is not None:
                if is_pinched and (now - self.last_click_t > self.click_lockout):
                    self.last_click_t = now
                    hovered_btn.ripple_time = now
                    consumed = True
                    play_click_chime()
                    self._dispatch_click(hovered_btn.btn_id, suite, bridge, now)
            else:
                # Quy tac 3 cua CardboardXR PinchRouter:
                # Khi menu dang mo, bat ky cu chi pinch nao cung bi menu chiem (consumed),
                # khong cho phep xuyen thau lam roi loan net ve 3D hay vat the dang sau menu.
                if is_pinched:
                    consumed = True
        else:
            for btn in self.buttons:
                btn.is_hovered = False

        return consumed, hovered_btn

    def _dispatch_click(self, btn_id, suite, bridge, now):
        print(f"\n[SpatialMenu] >>> IN-AIR CLICK: {btn_id} <<<")
        if btn_id == "demo_1":
            suite.current_mode = 1
        elif btn_id == "demo_2":
            suite.current_mode = 2
        elif btn_id == "demo_3":
            suite.current_mode = 3
            suite.rush_demo.start(now)
        elif btn_id == "demo_4":
            suite.current_mode = 4
        elif btn_id == "demo_5":
            suite.current_mode = 5
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
        elif btn_id == "btn_hide":
            self.is_open = False
        elif btn_id == "set_view_mode" and bridge:
            bridge.suite.stereo_vr_mode = not bridge.suite.stereo_vr_mode
            mode_desc = "STEREO SBS (KÍNH VR)" if bridge.suite.stereo_vr_mode else "1 MÀN HÌNH DUY NHẤT"
            print(f"[SpatialMenu] >>> CHUYEN DOI CHE DO VIEW: {mode_desc} <<<")
        elif btn_id == "set_ipd_sub" and bridge:
            bridge.ipd_offset = max(0, bridge.ipd_offset - 2)
            print(f"[SpatialMenu] IPD: {bridge.ipd_offset}px")
        elif btn_id == "set_ipd_add" and bridge:
            bridge.ipd_offset = min(60, bridge.ipd_offset + 2)
            print(f"[SpatialMenu] IPD: {bridge.ipd_offset}px")
        elif btn_id == "set_rot" and bridge:
            bridge.rotate_180 = not bridge.rotate_180
            print(f"[SpatialMenu] Xoay 180 do: {'BAT' if bridge.rotate_180 else 'TAT'}")
        elif btn_id == "set_flip_v" and bridge:
            bridge.flip_vertical = not bridge.flip_vertical
            print(f"[SpatialMenu] Lat doc: {'BAT' if bridge.flip_vertical else 'TAT'}")
        elif btn_id == "set_flip_h" and bridge:
            bridge.flip_horizontal = not bridge.flip_horizontal
            print(f"[SpatialMenu] Lat guong ngang: {'BAT' if bridge.flip_horizontal else 'TAT'}")
        elif btn_id == "set_fov" and bridge:
            bridge.vr_projection = "full_fov" if bridge.vr_projection == "immersive" else "immersive"
            print(f"[SpatialMenu] Quang hoc: {bridge.vr_projection}")
        elif btn_id == "set_cam" and bridge:
            bridge.use_fallback = not bridge.use_fallback
            print(f"[SpatialMenu] Nguon Camera: {'LAPTOP' if bridge.use_fallback else 'IPHONE USB'}")

        # Cap nhat trang thai active
        cur_mode = suite.current_mode if suite else 1
        for b in self.buttons:
            if b.btn_id == f"demo_{cur_mode}":
                b.is_active = True
            elif b.btn_id.startswith("demo_"):
                b.is_active = False
            elif b.btn_id.startswith("col_") and hasattr(suite, 'paint_demo'):
                idx = int(b.btn_id.split("_")[1])
                b.is_active = (idx == suite.paint_demo.current_color_idx)

    def draw(self, frame, now, current_mode=1, eye_offset_x=0, bridge=None):
        """
        Ve toan bo giao dien len mot mat (Left Eye hoac Right Eye).
        eye_offset_x: Do lech quang hoc Parallax 3D tao cam giac noi khoi (Stereo Depth).
        """
        # Dong bo nhan nut tren Top Settings Bar
        if bridge is not None:
            is_stereo = bridge.suite.stereo_vr_mode
            for b in self.buttons:
                if b.btn_id == "set_view_mode":
                    b.label = "SBS VR" if is_stereo else "1-SCR"
                    b.color = (255, 0, 255) if is_stereo else (0, 255, 128)
                elif b.btn_id == "set_cam":
                    b.label = "LAPTOP" if bridge.use_fallback else "IPHONE"

        # 1. Ve Palm Summoner Gear Button giua ngon cai va ngon tro (k_ThumbJoint & k_IndexJoint)
        # Chi ve khi Menu dang DONG de moi nguoi dung mo menu (giong het visionOS & CardboardXR)
        if not self.is_open and self.palm_gear_pos is not None and self.palm_detector.is_facing:
            cx, cy = self.palm_gear_pos[0] + eye_offset_x, self.palm_gear_pos[1]
            pulse = int(127 + 127 * math.sin(now * 8.0))
            gear_col = (pulse, 243, 255)

            # Vong sang ben ngoai
            cv2.circle(frame, (cx, cy), 30, gear_col, 2, cv2.LINE_AA)

            # Nhan kinh mo ben trong
            btn_bg = (20, 60, 35) if self.is_open else (15, 30, 45)
            cv2.circle(frame, (cx, cy), 22, btn_bg, -1, cv2.LINE_AA)
            cv2.circle(frame, (cx, cy), 22, (0, 255, 128), 1, cv2.LINE_AA)

            label = "CLOSE" if self.is_open else "MENU"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_DUPLEX, 0.36, 1)
            cv2.putText(frame, label, (cx - tw // 2, cy + th // 2), cv2.FONT_HERSHEY_DUPLEX, 0.36, (255, 255, 255), 1, cv2.LINE_AA)

            # Huong dan cu chi ngay duoi nut
            hint = "CHUM DE DONG" if self.is_open else "CHUM DE MO"
            (hw, hh), _ = cv2.getTextSize(hint, cv2.FONT_HERSHEY_SIMPLEX, 0.34, 1)
            cv2.putText(frame, hint, (cx - hw // 2, cy + 42), cv2.FONT_HERSHEY_SIMPLEX, 0.34, (0, 243, 255), 1, cv2.LINE_AA)

        if not self.is_open:
            # Neu dang an, chi hien thi goi y nhe o day
            cv2.putText(frame, "[XOE LONG BAN TAY & CHUM NGON DE MO MENU]", (90 + eye_offset_x, 685),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 243, 255), 1, cv2.LINE_AA)
            return

        # 2. Ve Background Dock Panel cho Hang Chinh & Hang Phu (In-Place ROI Blending)
        dock_y = 538
        dock_h = 114
        x1_d = max(0, min(frame.shape[1] - 1, 10 + eye_offset_x))
        x2_d = max(0, min(frame.shape[1], 630 + eye_offset_x))
        y1_d = max(0, min(frame.shape[0] - 1, dock_y))
        y2_d = max(0, min(frame.shape[0], dock_y + dock_h))
        if x2_d > x1_d and y2_d > y1_d:
            roi_d = frame[y1_d:y2_d, x1_d:x2_d]
            cv2.addWeighted(np.full_like(roi_d, (12, 16, 20)), 0.75, roi_d, 0.25, 0, roi_d)

        # Top Settings Bar overlay
        x1_t = max(0, min(frame.shape[1] - 1, 8 + eye_offset_x))
        x2_t = max(0, min(frame.shape[1], 600 + eye_offset_x))
        y1_t = max(0, min(frame.shape[0] - 1, 10))
        y2_t = max(0, min(frame.shape[0], 52))
        if x2_t > x1_t and y2_t > y1_t:
            roi_t = frame[y1_t:y2_t, x1_t:x2_t]
            cv2.addWeighted(np.full_like(roi_t, (12, 16, 20)), 0.75, roi_t, 0.25, 0, roi_t)

        # Vien neon dock
        cv2.rectangle(frame, (10 + eye_offset_x, dock_y), (630 + eye_offset_x, dock_y + dock_h), (35, 45, 55), 1, cv2.LINE_AA)
        cv2.rectangle(frame, (8 + eye_offset_x, 10), (600 + eye_offset_x, 52), (35, 45, 55), 1, cv2.LINE_AA)

        # Header title
        cv2.putText(frame, "CARDBOARDXR // M3 SPATIAL IN-AIR TOOLBAR", (20 + eye_offset_x, dock_y - 6),
                    cv2.FONT_HERSHEY_DUPLEX, 0.40, (0, 243, 255), 1, cv2.LINE_AA)

        # 3. Ve cac button theo mode hien tai
        cat_map = {1: "paint", 2: "portal", 3: "rush", 4: "cube", 5: "caliper"}
        cur_cat = cat_map.get(current_mode, "paint")

        for btn in self.buttons:
            if btn.category in ["mode", "settings", "all"]:
                btn.draw(frame, now, eye_offset_x)
            elif btn.category == cur_cat:
                btn.draw(frame, now, eye_offset_x)
