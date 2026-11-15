import copy
import os
import sys
import time
import math
import json
import ctypes
from ctypes import wintypes
import threading
import queue
import subprocess
from collections import deque
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# -----------------------------------------------------------------------------
# STARK AIR MOUSE // SPATIAL COMPUTING & 3D FRUSTUM SUITE v9.7.0 PRO
# -----------------------------------------------------------------------------

# High-DPI Per-Monitor v2 Awareness
try:
    ctypes.windll.user32.SetProcessDpiAwarenessContext(ctypes.c_void_p(-4))
except Exception:
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()
        except Exception:
            pass

user32 = ctypes.windll.user32
# Multi-Display Virtual Screen Bounds (SM_XVIRTUALSCREEN=76, SM_YVIRTUALSCREEN=77, SM_CXVIRTUALSCREEN=78, SM_CYVIRTUALSCREEN=79)
VIRT_X = user32.GetSystemMetrics(76)
VIRT_Y = user32.GetSystemMetrics(77)
VIRT_W = user32.GetSystemMetrics(78)
VIRT_H = user32.GetSystemMetrics(79)

if VIRT_W > 0 and VIRT_H > 0:
    SCREEN_X = VIRT_X
    SCREEN_Y = VIRT_Y
    SCREEN_W = VIRT_W
    SCREEN_H = VIRT_H
else:
    SCREEN_X = 0
    SCREEN_Y = 0
    SCREEN_W = user32.GetSystemMetrics(0)
    SCREEN_H = user32.GetSystemMetrics(1)

# Win32 SendInput Structures & Constants
INPUT_MOUSE = 0
INPUT_KEYBOARD = 1
INPUT_HARDWARE = 2

MOUSEEVENTF_MOVE = 0x0001
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010
MOUSEEVENTF_WHEEL = 0x0800
MOUSEEVENTF_ABSOLUTE = 0x8000

KEYEVENTF_KEYUP = 0x0002

VK_SHIFT = 0x10
VK_CONTROL = 0x11
VK_MENU = 0x12       # Alt key
VK_ESCAPE = 0x1B
VK_TAB = 0x09
VK_PRIOR = 0x21      # Page Up
VK_NEXT = 0x22       # Page Down
VK_VOLUME_MUTE = 0xAD
VK_SNAPSHOT = 0x2C   # PrintScreen
VK_LWIN = 0x5B

class MOUSEINPUT(ctypes.Structure):
    _fields_ = [
        ("dx", wintypes.LONG),
        ("dy", wintypes.LONG),
        ("mouseData", wintypes.DWORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_size_t),
    ]

class KEYBDINPUT(ctypes.Structure):
    _fields_ = [
        ("wVk", wintypes.WORD),
        ("wScan", wintypes.WORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_size_t),
    ]

class HARDWAREINPUT(ctypes.Structure):
    _fields_ = [
        ("uMsg", wintypes.DWORD),
        ("wParamL", wintypes.WORD),
        ("wParamH", wintypes.WORD),
    ]

class INPUT_UNION(ctypes.Union):
    _fields_ = [
        ("mi", MOUSEINPUT),
        ("ki", KEYBDINPUT),
        ("hi", HARDWAREINPUT),
    ]

class INPUT(ctypes.Structure):
    _fields_ = [
        ("type", wintypes.DWORD),
        ("union", INPUT_UNION),
    ]

class POINT(ctypes.Structure):
    _fields_ = [("x", wintypes.LONG), ("y", wintypes.LONG)]

def get_cursor_pos():
    pt = POINT()
    user32.GetCursorPos(ctypes.byref(pt))
    return pt.x, pt.y

# -----------------------------------------------------------------------------
# 1. DEEP CONFIGURATION MERGE
# -----------------------------------------------------------------------------
def deep_update(base_dict, update_dict):
    """
    Đệ quy cập nhật nested dictionary, bảo toàn toàn bộ default keys
    ngay cả khi file config ngoài thiếu các thuộc tính con.
    """
    for key, value in update_dict.items():
        if isinstance(value, dict) and key in base_dict and isinstance(base_dict[key], dict):
            deep_update(base_dict[key], value)
        else:
            base_dict[key] = value
    return base_dict

# -----------------------------------------------------------------------------
# 2. PERSISTENT J.A.R.V.I.S. VOICE ENGINE (LOW-LATENCY SAPI WORKER)
# -----------------------------------------------------------------------------
class JarvisVoiceEngine:
    """
    Bộ tổng hợp giọng nói SAPI hiệu năng cao.
    Duy trì 1 tiến trình nền duy nhất tải sẵn System.Speech.Synthesis,
    triệt tiêu hoàn toàn độ trễ 400-800ms mỗi khi khởi tạo tiến trình mới.
    """
    def __init__(self, enabled=True):
        self.enabled = enabled
        self.queue = queue.Queue()
        self.proc = None
        self.running = True
        if self.enabled:
            self.worker = threading.Thread(target=self._speech_worker, daemon=True)
            self.worker.start()

    def speak(self, text):
        if not self.enabled:
            return
        if self.queue.qsize() < 2:
            self.queue.put(text)

    def _start_worker(self):
        ps_script = (
            "Add-Type -AssemblyName System.Speech; "
            "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
            "$s.Rate = 1; "
            "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; "
            "Write-Output 'READY'; "
            "while ($l = [Console]::ReadLine()) { "
            "  if ($l -eq 'EXIT') { break }; "
            "  try { $s.Speak($l) } catch {} "
            "}"
        )
        try:
            self.proc = subprocess.Popen(
                ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                text=True,
                bufsize=1,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
            )
            _ = self.proc.stdout.readline()
            return True
        except Exception:
            self.proc = None
            return False

    def _speech_worker(self):
        self._start_worker()
        while self.running:
            try:
                text = self.queue.get(timeout=0.2)
            except queue.Empty:
                continue

            if not text:
                continue

            try:
                if self.proc is None or self.proc.poll() is not None:
                    self._start_worker()
                if self.proc and self.proc.stdin:
                    clean_text = text.replace("\n", " ").replace("\r", " ")
                    self.proc.stdin.write(clean_text + "\n")
                    self.proc.stdin.flush()
            except Exception:
                pass
            finally:
                self.queue.task_done()

    def stop(self):
        self.running = False
        if self.proc:
            try:
                self.proc.stdin.write("EXIT\n")
                self.proc.stdin.flush()
                self.proc.terminate()
            except Exception:
                pass

# -----------------------------------------------------------------------------
# 3. JARVIS VOICE INPUT LISTENER (CONTINUOUS SPEECH RECOGNITION)
# -----------------------------------------------------------------------------
class JarvisVoiceListener:
    def __init__(self, cmd_queue, enabled=True):
        self.cmd_queue = cmd_queue
        self.enabled = enabled
        self.process = None
        if self.enabled:
            self.thread = threading.Thread(target=self._run_listener, daemon=True)
            self.thread.start()

    def _run_listener(self):
        ps_code = """
Add-Type -AssemblyName System.Speech
$rec = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$choices = New-Object System.Speech.Recognition.Choices
$choices.Add([string[]]@(
    'next slide', 'previous slide', 'presentation mode', 
    'tv mode', 'screenshot', 'zoom in', 'zoom out', 
    'mute audio', 'mouse on', 'mouse off'
))
$gb = New-Object System.Speech.Recognition.GrammarBuilder
$gb.Append($choices)
$grammar = New-Object System.Speech.Recognition.Grammar($gb)
$rec.LoadGrammar($grammar)

try {
    $rec.SetInputToDefaultAudioDevice()
    Write-Output "READY"
    while ($true) {
        $result = $rec.Recognize()
        if ($result -ne $null -and $result.Confidence -gt 0.60) {
            Write-Output "CMD:$($result.Text)"
        }
    }
} catch {
    Write-Output "ERROR:$($_.Exception.Message)"
}
"""
        try:
            self.process = subprocess.Popen(
                ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_code],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                creationflags=subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
            )
            for line in self.process.stdout:
                line = line.strip()
                if line.startswith("CMD:"):
                    cmd = line.split("CMD:")[1].strip().lower()
                    self.cmd_queue.put(cmd)
        except Exception:
            pass

    def stop(self):
        if self.process:
            try:
                self.process.terminate()
            except Exception:
                pass

# -----------------------------------------------------------------------------
# 4. HARDWARE-SYNCHRONIZED THREADED CAMERA
# -----------------------------------------------------------------------------
class ThreadedCamera:
    """
    Luồng riêng đọc camera liên tục đồng bộ với phần cứng (Hardware Shutter Sync).
    Chỉ kích hoạt pipeline khi có frame quang học MỚI từ cảm biến.
    """
    def __init__(self, src=0, width=640, height=480, target_fps=60):
        self.cap = cv2.VideoCapture(src, cv2.CAP_DSHOW)
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(src)

        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        self.cap.set(cv2.CAP_PROP_FPS, target_fps)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        self.latest_frame = None
        self.frame_id = 0
        self.capture_timestamp = time.perf_counter()
        self.running = True
        self.lock = threading.Lock()
        self.new_frame_event = threading.Event()

        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def _capture_loop(self):
        while self.running:
            ret, frame = self.cap.read()
            if ret and frame is not None:
                ts = time.perf_counter()
                with self.lock:
                    self.latest_frame = frame
                    self.frame_id += 1
                    self.capture_timestamp = ts
                self.new_frame_event.set()
            else:
                time.sleep(0.003)

    def read_new(self, timeout=0.020):
        if self.new_frame_event.wait(timeout=timeout):
            self.new_frame_event.clear()
            with self.lock:
                return True, self.latest_frame, self.capture_timestamp, self.frame_id
        return False, None, 0.0, 0

    def is_opened(self):
        return hasattr(self, 'cap') and self.cap is not None and self.cap.isOpened()

    def stop(self):
        self.running = False
        self.new_frame_event.set()
        if hasattr(self, 'thread') and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        if hasattr(self, 'cap') and self.cap.isOpened():
            self.cap.release()

# -----------------------------------------------------------------------------
# 5. ATOMIC WIN32 SENDINPUT SAFETY MANAGER
# -----------------------------------------------------------------------------
class WinInputManager:
    """
    Điều khiển input Windows nguyên tử (atomic) hoàn toàn bằng SendInput.
    Bảo đảm giải phóng toàn bộ phím và nút chuột khi thoát.
    """
    def __init__(self):
        self.mouse_enabled = True
        self.is_left_down = False
        self.is_right_down = False
        self.held_modifiers = set()
        self.alt_tab_active = False
        self.last_alt_tab_time = 0.0
        self.prev_hotkey_q = False
        self.prev_hotkey_m = False
        self.prev_hotkey_c = False
        self.prev_hotkey_r = False

    def move_cursor(self, x, y):
        if not self.mouse_enabled:
            return
        ix = max(SCREEN_X, min(SCREEN_X + SCREEN_W - 1, int(round(x))))
        iy = max(SCREEN_Y, min(SCREEN_Y + SCREEN_H - 1, int(round(y))))
        user32.SetCursorPos(ix, iy)

    def _send_mouse_event(self, flags, data=0, dx=0, dy=0, force=False):
        if not self.mouse_enabled and not force:
            return
        inp = INPUT()
        inp.type = INPUT_MOUSE
        inp.union.mi.dx = int(dx)
        inp.union.mi.dy = int(dy)
        inp.union.mi.mouseData = int(data)
        inp.union.mi.dwFlags = flags
        inp.union.mi.time = 0
        inp.union.mi.dwExtraInfo = 0
        user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

    def _send_key_event(self, vk, is_up=False):
        inp = INPUT()
        inp.type = INPUT_KEYBOARD
        inp.union.ki.wVk = int(vk)
        inp.union.ki.wScan = user32.MapVirtualKeyW(vk, 0)
        inp.union.ki.dwFlags = KEYEVENTF_KEYUP if is_up else 0
        inp.union.ki.time = 0
        inp.union.ki.dwExtraInfo = 0
        user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(INPUT))

    def left_down(self):
        if not self.mouse_enabled or self.is_left_down:
            return
        self._send_mouse_event(MOUSEEVENTF_LEFTDOWN)
        self.is_left_down = True

    def left_up(self, force=False):
        if self.is_left_down or force:
            self._send_mouse_event(MOUSEEVENTF_LEFTUP, force=force)
            self.is_left_down = False

    def right_down(self):
        if not self.mouse_enabled or self.is_right_down:
            return
        self._send_mouse_event(MOUSEEVENTF_RIGHTDOWN)
        self.is_right_down = True

    def right_up(self, force=False):
        if self.is_right_down or force:
            self._send_mouse_event(MOUSEEVENTF_RIGHTUP, force=force)
            self.is_right_down = False

    def click_left(self):
        if not self.mouse_enabled:
            return
        inputs = (INPUT * 2)()
        inputs[0].type = INPUT_MOUSE
        inputs[0].union.mi.dwFlags = MOUSEEVENTF_LEFTDOWN
        inputs[1].type = INPUT_MOUSE
        inputs[1].union.mi.dwFlags = MOUSEEVENTF_LEFTUP
        user32.SendInput(2, ctypes.byref(inputs[0]), ctypes.sizeof(INPUT))
        self.is_left_down = False

    def click_right(self):
        if not self.mouse_enabled:
            return
        inputs = (INPUT * 2)()
        inputs[0].type = INPUT_MOUSE
        inputs[0].union.mi.dwFlags = MOUSEEVENTF_RIGHTDOWN
        inputs[1].type = INPUT_MOUSE
        inputs[1].union.mi.dwFlags = MOUSEEVENTF_RIGHTUP
        user32.SendInput(2, ctypes.byref(inputs[0]), ctypes.sizeof(INPUT))
        self.is_right_down = False

    def scroll_wheel(self, amount):
        if not self.mouse_enabled:
            return
        self._send_mouse_event(MOUSEEVENTF_WHEEL, data=int(amount))

    def zoom_in(self, step=120):
        if not self.mouse_enabled:
            return
        self._press_key(VK_CONTROL)
        try:
            self.scroll_wheel(step)
        finally:
            self._release_key(VK_CONTROL)

    def zoom_out(self, step=120):
        if not self.mouse_enabled:
            return
        self._press_key(VK_CONTROL)
        try:
            self.scroll_wheel(-step)
        finally:
            self._release_key(VK_CONTROL)

    def trigger_jarvis_snap(self):
        """Kich hoat Roamies JARVIS chup man hinh & phan tich AI (Ctrl + Shift + A)"""
        VK_CONTROL = 0x11
        VK_SHIFT = 0x10
        VK_A = ord('A')
        self._press_key(VK_CONTROL)
        self._press_key(VK_SHIFT)
        self._tap_key(VK_A)
        self._release_key(VK_SHIFT)
        self._release_key(VK_CONTROL)

    def trigger_jarvis_summon(self):
        """Hien / An Roamies JARVIS tren man hinh (Ctrl + Shift + S)"""
        VK_CONTROL = 0x11
        VK_SHIFT = 0x10
        VK_S = ord('S')
        self._press_key(VK_CONTROL)
        self._press_key(VK_SHIFT)
        self._tap_key(VK_S)
        self._release_key(VK_SHIFT)
        self._release_key(VK_CONTROL)

    def next_tab(self):
        if not self.mouse_enabled:
            return
        self._press_key(VK_CONTROL)
        try:
            self._tap_key(VK_TAB)
        finally:
            self._release_key(VK_CONTROL)

    def prev_tab(self):
        if not self.mouse_enabled:
            return
        self._press_key(VK_CONTROL)
        try:
            self._press_key(VK_SHIFT)
            try:
                self._tap_key(VK_TAB)
            finally:
                self._release_key(VK_SHIFT)
        finally:
            self._release_key(VK_CONTROL)

    def next_slide(self):
        self._tap_key(VK_NEXT)

    def prev_slide(self):
        self._tap_key(VK_PRIOR)

    def toggle_mute(self):
        self._tap_key(VK_VOLUME_MUTE)

    def take_screenshot(self):
        self._press_key(VK_LWIN)
        self._tap_key(VK_SNAPSHOT)
        self._release_key(VK_LWIN)

    def begin_alt_tab(self):
        if not self.mouse_enabled or self.alt_tab_active:
            return
        self._press_key(VK_MENU)
        self.alt_tab_active = True
        self.last_alt_tab_time = time.perf_counter()

    def step_alt_tab(self, direction=1):
        if not self.mouse_enabled:
            return
        if not self.alt_tab_active:
            self.begin_alt_tab()

        if direction > 0:
            self._tap_key(VK_TAB)
        else:
            self._press_key(VK_SHIFT)
            self._tap_key(VK_TAB)
            self._release_key(VK_SHIFT)
        self.last_alt_tab_time = time.perf_counter()

    def release_alt_tab(self):
        if self.alt_tab_active:
            self._release_key(VK_MENU)
            self.alt_tab_active = False

    def _press_key(self, vKey):
        self._send_key_event(vKey, is_up=False)
        self.held_modifiers.add(vKey)

    def _release_key(self, vKey):
        self._send_key_event(vKey, is_up=True)
        self.held_modifiers.discard(vKey)

    def _tap_key(self, vKey):
        inputs = (INPUT * 2)()
        inputs[0].type = INPUT_KEYBOARD
        inputs[0].union.ki.wVk = int(vKey)
        inputs[0].union.ki.wScan = user32.MapVirtualKeyW(vKey, 0)
        inputs[0].union.ki.dwFlags = 0
        inputs[1].type = INPUT_KEYBOARD
        inputs[1].union.ki.wVk = int(vKey)
        inputs[1].union.ki.wScan = inputs[0].union.ki.wScan
        inputs[1].union.ki.dwFlags = KEYEVENTF_KEYUP
        user32.SendInput(2, ctypes.byref(inputs[0]), ctypes.sizeof(INPUT))

    def cleanup(self):
        self.left_up(force=True)
        self.right_up(force=True)
        self.release_alt_tab()
        for k in list(self.held_modifiers):
            self._send_key_event(k, is_up=True)
        self.held_modifiers.clear()

# -----------------------------------------------------------------------------
# 5b. HOLOMAT SPATIAL CALIPER & RADIAL ARC REACTOR MENU
# -----------------------------------------------------------------------------
def draw_spatial_caliper(frame, lms, world_lms, w, h):
    """Ve thuoc do dien tu khong gian 3D giua ngon cai va ngon tro (mm / cm)"""
    p_thumb = (int(lms[4].x * w), int(lms[4].y * h))
    p_tip = (int(lms[8].x * w), int(lms[8].y * h))

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
        jaw_len = 16

        j1_a = (int(p_thumb[0] + nx * jaw_len), int(p_thumb[1] + ny * jaw_len))
        j1_b = (int(p_thumb[0] - nx * jaw_len), int(p_thumb[1] - ny * jaw_len))
        cv2.line(frame, j1_a, j1_b, (0, 243, 255), 2, cv2.LINE_AA)

        j2_a = (int(p_tip[0] + nx * jaw_len), int(p_tip[1] + ny * jaw_len))
        j2_b = (int(p_tip[0] - nx * jaw_len), int(p_tip[1] - ny * jaw_len))
        cv2.line(frame, j2_a, j2_b, (0, 243, 255), 2, cv2.LINE_AA)

        cv2.line(frame, p_thumb, p_tip, (0, 215, 255), 2, cv2.LINE_AA)

        for i in range(1, 6):
            frac = i / 6.0
            tx = p_thumb[0] + vec_x * frac
            ty = p_thumb[1] + vec_y * frac
            t1 = (int(tx + nx * 5), int(ty + ny * 5))
            t2 = (int(tx - nx * 5), int(ty - ny * 5))
            cv2.line(frame, t1, t2, (0, 243, 255), 1, cv2.LINE_AA)

    mid_x = (p_thumb[0] + p_tip[0]) // 2
    mid_y = (p_thumb[1] + p_tip[1]) // 2

    badge_w, badge_h = 165, 28
    bx1 = mid_x - badge_w // 2
    by1 = mid_y - 35
    bx2 = bx1 + badge_w
    by2 = by1 + badge_h

    cv2.rectangle(frame, (bx1, by1), (bx2, by2), (20, 30, 40), -1)
    cv2.rectangle(frame, (bx1, by1), (bx2, by2), (0, 243, 255), 1, cv2.LINE_AA)
    cv2.circle(frame, p_thumb, 5, (0, 255, 0), -1, cv2.LINE_AA)
    cv2.circle(frame, p_tip, 5, (0, 255, 0), -1, cv2.LINE_AA)

    label = f"{dist_mm:.1f} mm | {dist_cm:.1f} cm"
    cv2.putText(frame, label, (bx1 + 10, by1 + 19),
                cv2.FONT_HERSHEY_SIMPLEX, 0.44, (0, 255, 255), 1, cv2.LINE_AA)

    return dist_mm


def draw_radial_ironman_menu(frame, cx, cy, selected_idx, hold_progress):
    """Ve Arc Reactor Radial Menu cong nghe cao xoay quanh long ban tay"""
    r_in = 36
    r_out = 95
    cv2.circle(frame, (cx, cy), r_in, (30, 40, 50), -1)
    cv2.circle(frame, (cx, cy), r_in, (0, 243, 255), 1, cv2.LINE_AA)
    cv2.circle(frame, (cx, cy), 12, (0, 243, 255), -1, cv2.LINE_AA)
    cv2.putText(frame, "STARK", (cx - 18, cy + 4),
                cv2.FONT_HERSHEY_SIMPLEX, 0.32, (0, 0, 0), 1, cv2.LINE_AA)

    sectors = [
        ("HOI JARVIS", (cx - 36, cy - 55), (0, 243, 255)),
        ("THUOC DO", (cx + 42, cy + 4), (0, 215, 255)),
        ("GOI JARVIS", (cx - 38, cy + 65), (255, 128, 0)),
        ("RESET KHUNG", (cx - 95, cy + 4), (0, 255, 128)),
    ]

    for idx, (label, (tx, ty), col) in enumerate(sectors):
        is_sel = (idx == selected_idx)
        card_w, card_h = 78, 22
        rx1, ry1 = tx - 4, ty - 15
        rx2, ry2 = rx1 + card_w, ry1 + card_h

        bg = (10, 60, 80) if is_sel else (20, 25, 30)
        border = (0, 255, 255) if is_sel else (0, 140, 180)

        cv2.rectangle(frame, (rx1, ry1), (rx2, ry2), bg, -1)
        cv2.rectangle(frame, (rx1, ry1), (rx2, ry2), border, 1, cv2.LINE_AA)

        if is_sel and hold_progress > 0:
            pw = int(card_w * min(1.0, hold_progress))
            cv2.rectangle(frame, (rx1, ry2 - 3), (rx1 + pw, ry2), (0, 255, 0), -1)

        cv2.putText(frame, label, (tx, ty),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.30, border, 1, cv2.LINE_AA)

    cv2.circle(frame, (cx, cy), r_out, (0, 180, 220), 1, cv2.LINE_AA)


# -----------------------------------------------------------------------------
# 6. ONE EURO FILTER & VELOCITY-ADAPTIVE PRE-PINCH BRAKE FILTER
# -----------------------------------------------------------------------------
class OneEuroFilter:
    """
    Casiez et al. (2012) 1€ Filter.
    Hỗ trợ truyền `cutoff_scale` (ví dụ Pre-Pinch Brake) trực tiếp vào tần số cắt
    để ghìm mượt con trỏ khi chuẩn bị bấm mà KHÔNG gây cộng dồn sai số hay nhảy cóc!
    """
    def __init__(self, t0, x0, min_cutoff=1.15, beta=0.014, d_cutoff=1.0):
        self.min_cutoff = float(min_cutoff)
        self.beta = float(beta)
        self.d_cutoff = float(d_cutoff)
        self.x_prev = float(x0)
        self.dx_prev = 0.0
        self.t_prev = float(t0)

    def _alpha(self, cutoff, dt):
        tau = 1.0 / (2.0 * math.pi * max(1e-4, cutoff))
        return 1.0 / (1.0 + tau / dt)

    def reset(self, t, x):
        self.x_prev = float(x)
        self.dx_prev = 0.0
        self.t_prev = float(t)
        return self.x_prev

    def filter(self, t, x, cutoff_scale=1.0):
        dt = (t - self.t_prev)
        if dt <= 1e-5:
            return self.x_prev

        scale = max(0.05, min(1.0, float(cutoff_scale)))
        dx = (x - self.x_prev) / dt
        edx = self.dx_prev + self._alpha(self.d_cutoff, dt) * (dx - self.dx_prev)
        base_cutoff = (self.min_cutoff * scale) + (self.beta * scale) * abs(edx)
        effective_cutoff = max(0.02, base_cutoff)
        x_filtered = self.x_prev + self._alpha(effective_cutoff, dt) * (x - self.x_prev)

        self.x_prev = x_filtered
        self.dx_prev = edx
        self.t_prev = float(t)
        return x_filtered

class AdaptiveOneEuroFilter:
    """
    Mở rộng bộ lọc 1€ với tần số cắt thích ứng theo vận tốc & Pre-Pinch Brake:
    - Khi tay chậm (< 40px/s): min_cutoff = 0.75Hz (đầm, triệt tiêu rung tĩnh).
    - Khi tay nhanh (> 700px/s): min_cutoff = 3.20Hz (bám sát tay tức thì, không trễ).
    - Khi chuẩn bị chụm ngón (cutoff_scale < 1.0): hạ tần số cắt mượt mà, giữ con trỏ
      đứng yên tại mục tiêu mà không làm lệch biến trạng thái khi nhả tay.
    """
    def __init__(self, t0, x0, min_cutoff_slow=0.75, min_cutoff_fast=3.20, beta=0.015, d_cutoff=1.0):
        self.min_cutoff_slow = float(min_cutoff_slow)
        self.min_cutoff_fast = float(min_cutoff_fast)
        self.beta = float(beta)
        self.d_cutoff = float(d_cutoff)
        self.oef = OneEuroFilter(t0, x0, min_cutoff=min_cutoff_slow, beta=beta, d_cutoff=d_cutoff)
        self.prev_x = float(x0)
        self.prev_t = float(t0)

    def reset(self, t, x):
        self.prev_x = float(x)
        self.prev_t = float(t)
        return self.oef.reset(t, x)

    def filter(self, t, x, cutoff_scale=1.0):
        dt = max(1e-4, t - self.prev_t)
        v = abs(x - self.prev_x) / dt
        self.prev_x = x
        self.prev_t = t
        ratio = max(0.0, min(1.0, (v - 40.0) / 500.0))
        self.oef.min_cutoff = self.min_cutoff_slow + ratio * (self.min_cutoff_fast - self.min_cutoff_slow)
        return self.oef.filter(t, x, cutoff_scale=cutoff_scale)

# -----------------------------------------------------------------------------
# 6b. ASYNC CURSOR INTERPOLATOR (144Hz UNIFIED CURSOR DISPATCHER)
# -----------------------------------------------------------------------------
class AsyncCursorInterpolator:
    """
    Luồng điều phối con trỏ duy nhất ở tần số 144Hz (tách biệt hoàn toàn khỏi nhịp 30Hz của Camera).
    - Xóa bỏ 100% xung đột gọi SetCursorPos giữa nhiều luồng.
    - Hỗ trợ cả di chuyển mượt (set_target), kéo thả cửa sổ 144Hz, và khóa cứng tức thì (snap_to).
    """
    def __init__(self, target_hz=144, stiction_radius=0.0, spring_k=85.0):
        self.interval = 1.0 / target_hz
        self.stiction_radius = float(stiction_radius)
        self.spring_k = float(spring_k)

        try:
            ctypes.windll.winmm.timeBeginPeriod(1)
        except Exception:
            pass

        self.target_x = SCREEN_X + SCREEN_W / 2.0
        self.target_y = SCREEN_Y + SCREEN_H / 2.0
        self.curr_x = self.target_x
        self.curr_y = self.target_y

        self.anchor_x = self.target_x
        self.anchor_y = self.target_y
        self.is_anchored = False

        self.active = False
        self.running = True
        self.lock = threading.Lock()

        self.thread = threading.Thread(target=self._worker_loop, daemon=True)
        self.thread.start()

    def set_target(self, x, y, force_snap=False):
        with self.lock:
            clamped_x = max(float(SCREEN_X), min(float(SCREEN_X + SCREEN_W - 1), float(x)))
            clamped_y = max(float(SCREEN_Y), min(float(SCREEN_Y + SCREEN_H - 1), float(y)))
            if not self.active:
                # Đồng bộ vị trí thực tế của chuột khi kích hoạt lại để chống giật
                real_x, real_y = get_cursor_pos()
                self.curr_x = float(real_x)
                self.curr_y = float(real_y)
                self.anchor_x = float(real_x)
                self.anchor_y = float(real_y)
                self.is_anchored = False
            if force_snap:
                self.curr_x = clamped_x
                self.curr_y = clamped_y
                self.target_x = clamped_x
                self.target_y = clamped_y
                self.anchor_x = clamped_x
                self.anchor_y = clamped_y
                self.is_anchored = True
                # Share the worker's lock: button events after snap_to must see
                # the new OS position, even before the next interpolation tick.
                if not user32.SetCursorPos(int(round(clamped_x)), int(round(clamped_y))):
                    raise ctypes.WinError()
            else:
                self.target_x = clamped_x
                self.target_y = clamped_y
            self.active = True

    def snap_to(self, x, y):
        self.set_target(x, y, force_snap=True)

    def deactivate(self):
        with self.lock:
            self.active = False
            self.is_anchored = False

    def _worker_loop(self):
        last_time = time.perf_counter()
        last_sent_x = None
        last_sent_y = None
        while self.running:
            t0 = time.perf_counter()
            dt = max(0.001, t0 - last_time)
            last_time = t0

            with self.lock:
                if self.active:
                    if self.stiction_radius > 0.05:
                        dist_from_anchor = math.hypot(self.target_x - self.anchor_x, self.target_y - self.anchor_y)
                        if self.is_anchored:
                            if dist_from_anchor < self.stiction_radius:
                                self.curr_x = self.anchor_x
                                self.curr_y = self.anchor_y
                            else:
                                self.is_anchored = False

                        if not self.is_anchored:
                            alpha = 1.0 - math.exp(-self.spring_k * dt)
                            self.curr_x += (self.target_x - self.curr_x) * alpha
                            self.curr_y += (self.target_y - self.curr_y) * alpha

                            dist_to_target = math.hypot(self.target_x - self.curr_x, self.target_y - self.curr_y)
                            if dist_to_target < 0.8:
                                self.anchor_x = self.curr_x
                                self.anchor_y = self.curr_y
                                self.is_anchored = True
                    else:
                        alpha = 1.0 - math.exp(-self.spring_k * dt)
                        self.curr_x += (self.target_x - self.curr_x) * alpha
                        self.curr_y += (self.target_y - self.curr_y) * alpha

                    rx = int(round(self.curr_x))
                    ry = int(round(self.curr_y))
                    if rx != last_sent_x or ry != last_sent_y:
                        user32.SetCursorPos(rx, ry)
                        last_sent_x = rx
                        last_sent_y = ry

            elapsed = time.perf_counter() - t0
            sleep_time = max(0.001, self.interval - elapsed)
            time.sleep(sleep_time)

    def stop(self):
        self.running = False
        try:
            ctypes.windll.winmm.timeEndPeriod(1)
        except Exception:
            pass
        if hasattr(self, 'thread') and self.thread.is_alive():
            self.thread.join(timeout=0.5)

# -----------------------------------------------------------------------------
# 6c. CONTINUOUS PRE-PINCH DAMPING BRAKE
# -----------------------------------------------------------------------------
def compute_pre_pinch_brake(pinch_dist_m, enter_thresh, approach_dist=0.038, min_gain=0.15):
    """
    Chỉ kích hoạt phanh giảm tốc khi 2 ngón tay thực sự áp sát chuẩn bị bấm (< 3.8cm).
    Khi ngón tay ở khoảng cách tự nhiên (> 3.8cm), trả về 1.0 (không ghìm phanh).
    """
    if pinch_dist_m >= approach_dist:
        return 1.0
    if pinch_dist_m <= enter_thresh:
        return min_gain
    approach_range = max(0.004, approach_dist - enter_thresh)
    ratio = max(0.0, min(1.0, (pinch_dist_m - enter_thresh) / approach_range))
    return max(min_gain, ratio)

# -----------------------------------------------------------------------------
# 6d. DWELL-CLICK ENGINE (ACCESSIBILITY HOVER AUTO-CLICK)
# -----------------------------------------------------------------------------
class DwellClickEngine:
    def __init__(self, enabled=False, dwell_seconds=0.90, radius_px=16.0):
        self.enabled = enabled
        self.dwell_seconds = float(dwell_seconds)
        self.radius_px = float(radius_px)
        self.anchor_x = None
        self.anchor_y = None
        self.dwell_start_time = None
        self.triggered = False

    def reset(self):
        self.anchor_x = None
        self.anchor_y = None
        self.dwell_start_time = None
        self.triggered = False

    def update(self, curr_x, curr_y, now, safety_mgr):
        if not self.enabled:
            return 0.0, False
        if self.anchor_x is None:
            self.anchor_x = curr_x
            self.anchor_y = curr_y
            self.dwell_start_time = now
            self.triggered = False
            return 0.0, False

        dist = math.hypot(curr_x - self.anchor_x, curr_y - self.anchor_y)
        if dist > self.radius_px:
            self.anchor_x = curr_x
            self.anchor_y = curr_y
            self.dwell_start_time = now
            self.triggered = False
            return 0.0, False

        elapsed = now - self.dwell_start_time
        progress = min(1.0, elapsed / self.dwell_seconds)

        if progress >= 1.0 and not self.triggered:
            self.triggered = True
            safety_mgr.click_left()
            return 1.0, True

        return progress, False

# -----------------------------------------------------------------------------
# 7. APPLE VISION PRO UNIFIED PINCH & DRAG ENGINE (FIXED DRAGGING & ROLLBACK)
# -----------------------------------------------------------------------------
class PinchDragEngine:
    """
    Cơ chế tương tác chuẩn Apple Vision Pro:
    - Quick Pinch (< 450ms, < 18px): Chuột trái (Primary Click / Tap).
    - Pinch & Hold (>= 450ms tĩnh): Chuột phải (Context Menu / Secondary Click)
      kèm hiệu ứng vòng tròn sạc (Radial Charging Ring) trên HUD.
    - Pinch & Drag (> 18px): Kéo thả cửa sổ / tab mượt mà ở 144Hz với Grace Frames chống rớt.
    - Pre-Pinch Rollback Buffer (95ms): Đóng băng tọa độ chuột tại thời điểm trước khi co ngón.
    """
    def __init__(self, enter_thresh=0.032, exit_thresh=0.045, drag_cam_px=18.0,
                 click_timeout=0.45, secondary_hold_seconds=0.45, max_grace_frames=4):
        self.state = 'IDLE'
        self.enter_thresh = float(enter_thresh)
        self.exit_thresh = float(exit_thresh)
        self.drag_cam_px = float(drag_cam_px)
        self.click_timeout = float(click_timeout)
        self.secondary_hold_seconds = float(secondary_hold_seconds)
        self.max_grace_frames = int(max_grace_frames)

        self.start_time = 0.0
        self.start_palm_x = 0.0
        self.start_palm_y = 0.0
        center_x = SCREEN_X + SCREEN_W / 2.0
        center_y = SCREEN_Y + SCREEN_H / 2.0
        self.frozen_cursor_x = center_x
        self.frozen_cursor_y = center_y
        self.active_cursor_x = center_x
        self.active_cursor_y = center_y
        self.drag_start_screen_x = 0.0
        self.drag_start_screen_y = 0.0
        self.last_click_time = 0.0
        self.grace_count = 0
        self.secondary_triggered = False

        self.cursor_history = deque(maxlen=16)

    def reset(self, safety_mgr=None):
        if self.state in ('DRAGGING', 'DRAGGING_GRACE') and safety_mgr:
            safety_mgr.left_up()
        self.state = 'IDLE'
        self.grace_count = 0
        self.secondary_triggered = False
        self.cursor_history.clear()

    def update(self, pinch_dist_m, palm_cam_x, palm_cam_y, filtered_screen_x, filtered_screen_y, now, safety_mgr, cursor_interpolator=None):
        feedback = 'NONE'

        if self.state == 'IDLE':
            is_pinching = pinch_dist_m < self.enter_thresh
        else:
            is_pinching = pinch_dist_m < self.exit_thresh

        # Chỉ ghi lịch sử rollback khi chưa chụm để không ghi đè tọa độ bị co rút
        if not is_pinching and self.state == 'IDLE':
            self.cursor_history.append((now, filtered_screen_x, filtered_screen_y))

        if is_pinching:
            self.grace_count = 0
            if self.state == 'IDLE':
                self.state = 'PINCH_PENDING'
                self.start_time = now
                self.start_palm_x = palm_cam_x
                self.start_palm_y = palm_cam_y

                # Tua ngược 95ms tìm tọa độ ổn định trước khi ngón tay bắt đầu khép
                target_ts = now - 0.095
                rollback_x = filtered_screen_x
                rollback_y = filtered_screen_y
                for ts, hx, hy in reversed(self.cursor_history):
                    if ts <= target_ts:
                        rollback_x = hx
                        rollback_y = hy
                        break

                self.frozen_cursor_x = rollback_x
                self.frozen_cursor_y = rollback_y
                self.active_cursor_x = rollback_x
                self.active_cursor_y = rollback_y
                self.secondary_triggered = False
                if cursor_interpolator and safety_mgr.mouse_enabled:
                    cursor_interpolator.snap_to(self.frozen_cursor_x, self.frozen_cursor_y)
                feedback = 'PINCH_PENDING'

            elif self.state == 'PINCH_PENDING':
                palm_move = math.hypot(palm_cam_x - self.start_palm_x, palm_cam_y - self.start_palm_y)
                hold_time = now - self.start_time

                if not self.secondary_triggered and palm_move > self.drag_cam_px:
                    # Bắt đầu KÉO THẢ (DRAGGING)
                    self.state = 'DRAGGING'
                    self.drag_start_screen_x = filtered_screen_x
                    self.drag_start_screen_y = filtered_screen_y
                    self.active_cursor_x = self.frozen_cursor_x
                    self.active_cursor_y = self.frozen_cursor_y
                    if cursor_interpolator and safety_mgr.mouse_enabled:
                        cursor_interpolator.snap_to(self.frozen_cursor_x, self.frozen_cursor_y)
                    safety_mgr.left_down()
                    feedback = 'START_DRAG'
                elif hold_time >= self.secondary_hold_seconds and not self.secondary_triggered:
                    # PINCH & HOLD: Chuột phải tại đúng tọa độ khóa
                    self.secondary_triggered = True
                    self.active_cursor_x = self.frozen_cursor_x
                    self.active_cursor_y = self.frozen_cursor_y
                    if cursor_interpolator and safety_mgr.mouse_enabled:
                        cursor_interpolator.snap_to(self.frozen_cursor_x, self.frozen_cursor_y)
                    safety_mgr.click_right()
                    feedback = 'RIGHT_CLICK'
                else:
                    # Đóng băng con trỏ tại tọa độ Rollback trong lúc chờ Click / Sạc Chuột Phải
                    self.active_cursor_x = self.frozen_cursor_x
                    self.active_cursor_y = self.frozen_cursor_y
                    if cursor_interpolator and safety_mgr.mouse_enabled:
                        cursor_interpolator.snap_to(self.frozen_cursor_x, self.frozen_cursor_y)
                    feedback = 'PINCH_FROZEN'

            elif self.state in ('DRAGGING', 'DRAGGING_GRACE'):
                self.state = 'DRAGGING'
                target_x = self.frozen_cursor_x + (filtered_screen_x - self.drag_start_screen_x)
                target_y = self.frozen_cursor_y + (filtered_screen_y - self.drag_start_screen_y)
                self.active_cursor_x = target_x
                self.active_cursor_y = target_y
                if cursor_interpolator and safety_mgr.mouse_enabled:
                    cursor_interpolator.set_target(target_x, target_y)
                feedback = 'DRAGGING'
        else:
            if self.state in ('DRAGGING', 'DRAGGING_GRACE'):
                if self.grace_count < self.max_grace_frames:
                    self.grace_count += 1
                    self.state = 'DRAGGING_GRACE'
                    target_x = self.frozen_cursor_x + (filtered_screen_x - self.drag_start_screen_x)
                    target_y = self.frozen_cursor_y + (filtered_screen_y - self.drag_start_screen_y)
                    self.active_cursor_x = target_x
                    self.active_cursor_y = target_y
                    if cursor_interpolator and safety_mgr.mouse_enabled:
                        cursor_interpolator.set_target(target_x, target_y)
                    feedback = 'DRAGGING_GRACE'
                else:
                    safety_mgr.left_up()
                    self.state = 'IDLE'
                    self.grace_count = 0
                    feedback = 'RELEASE_DRAG'
            elif self.state == 'PINCH_PENDING':
                hold_time = now - self.start_time
                if not self.secondary_triggered:
                    if hold_time <= self.secondary_hold_seconds:
                        if now - self.last_click_time >= 0.14:
                            self.active_cursor_x = self.frozen_cursor_x
                            self.active_cursor_y = self.frozen_cursor_y
                            if cursor_interpolator and safety_mgr.mouse_enabled:
                                cursor_interpolator.snap_to(self.frozen_cursor_x, self.frozen_cursor_y)
                            safety_mgr.click_left()
                            self.last_click_time = now
                            feedback = 'CLICK'
                    else:
                        self.active_cursor_x = self.frozen_cursor_x
                        self.active_cursor_y = self.frozen_cursor_y
                        if cursor_interpolator and safety_mgr.mouse_enabled:
                            cursor_interpolator.snap_to(self.frozen_cursor_x, self.frozen_cursor_y)
                        safety_mgr.click_right()
                        self.last_click_time = now
                        feedback = 'RIGHT_CLICK'
                self.state = 'IDLE'
                self.secondary_triggered = False
            else:
                self.state = 'IDLE'
                self.active_cursor_x = filtered_screen_x
                self.active_cursor_y = filtered_screen_y

        return self.state, feedback

# -----------------------------------------------------------------------------
# 8. SLIDING WINDOW VELOCITY SWIPE ENGINE
# -----------------------------------------------------------------------------
class SlidingWindowSwipeEngine:
    def __init__(self, window_duration=0.16, min_vel=0.35, min_dist=0.08, stop_vel=0.12):
        self.window_duration = window_duration
        self.min_vel = min_vel
        self.min_dist = min_dist
        self.stop_vel = stop_vel
        self.history = deque()
        self.is_locked = False

    def update(self, is_flat_palm, palm_x, now):
        if not is_flat_palm:
            self.history.clear()
            self.is_locked = False
            return 'NONE'

        self.history.append((now, palm_x))

        while self.history and (now - self.history[0][0] > self.window_duration):
            self.history.popleft()

        if len(self.history) < 3:
            return 'NONE'

        t_old, x_old = self.history[0]
        dt = max(1e-4, now - t_old)
        dx = palm_x - x_old
        velocity = abs(dx) / dt

        if self.is_locked:
            if velocity < self.stop_vel:
                self.is_locked = False
                self.history.clear()
            return 'NONE'

        if abs(dx) >= self.min_dist and velocity >= self.min_vel:
            self.is_locked = True
            self.history.clear()
            return 'SWIPE_RIGHT' if dx > 0 else 'SWIPE_LEFT'

        return 'NONE'

# -----------------------------------------------------------------------------
# 9. DEBOUNCED GESTURE CLASSIFIER & CONTINUOUS 2D+3D PINCH METRIC
# -----------------------------------------------------------------------------
class DebouncedGestureClassifier:
    def __init__(self, debounce_frames=3):
        self.debounce_frames = debounce_frames
        self.current_posture = 'REST'
        self.candidate_posture = 'REST'
        self.candidate_count = 0

    def reset(self):
        self.current_posture = 'REST'
        self.candidate_posture = 'REST'
        self.candidate_count = 0

    def update(self, raw_posture):
        if raw_posture == self.candidate_posture:
            self.candidate_count += 1
            if self.candidate_count >= self.debounce_frames:
                self.current_posture = self.candidate_posture
        else:
            self.candidate_posture = raw_posture
            self.candidate_count = 1

        return self.current_posture

def _dist3d(p1, p2):
    return math.hypot(p1.x - p2.x, p1.y - p2.y, p1.z - p2.z)

def _is_finger_extended(world_lms, lms, tip_idx, pip_idx, mcp_idx, palm_len):
    w_t = world_lms[tip_idx]
    w_p = world_lms[pip_idx]
    w_m = world_lms[mcp_idx]
    w_wrist = world_lms[0]

    ext_ratio = _dist3d(w_t, w_m) / palm_len
    reach_3d = _dist3d(w_t, w_wrist) / max(0.01, _dist3d(w_p, w_wrist))

    reach_2d = 1.0
    if lms is not None:
        d_tip_2d = math.hypot(lms[tip_idx].x - lms[0].x, lms[tip_idx].y - lms[0].y)
        d_pip_2d = math.hypot(lms[pip_idx].x - lms[0].x, lms[pip_idx].y - lms[0].y)
        reach_2d = d_tip_2d / max(0.01, d_pip_2d)

    return (reach_3d > 1.05 and ext_ratio > 0.45) or (reach_2d > 1.07 and ext_ratio > 0.41)

def classify_gestures_world_3d(world_lms, lms=None):
    """
    Phân loại tư thế tay và tính khoảng cách Pinch liên tục (không bị đứt gãy bậc thang):
    - 1 NGÓN TRỎ DUỖI (POINTING)  : Di chuyển con trỏ chuột.
    - 2 NGÓN DUỖI (SCROLL)        : Trỏ + Giữa khép sát vuốt lên / xuống để cuộn trang.
    - 3 NGÓN DUỖI (ZOOM)          : Trỏ + Giữa + Áp út đẩy lên / kéo xuống.
    - 4 NGÓN DUỖI (FLAT_PALM)     : Bàn tay phẳng để gạt Tab / Slide.
    - TAY THẢ LỎNG / NẮM HỜ (REST): Ngắt ly hợp (nhấc chuột) trong chế độ HYBRID_CLUTCH.
    """
    w_wrist = world_lms[0]
    w_thumb = world_lms[4]
    w_index = world_lms[8]
    w_middle = world_lms[12]
    w_ring = world_lms[16]
    w_pinky = world_lms[20]

    w_middle_mcp = world_lms[9]

    pinch_index_dist = _dist3d(w_thumb, w_index)
    palm_len = max(0.055, _dist3d(w_wrist, w_middle_mcp))

    if lms is not None:
        d_2d = math.hypot(lms[4].x - lms[8].x, lms[4].y - lms[8].y)
        palm_2d = max(0.045, math.hypot(lms[0].x - lms[9].x, lms[0].y - lms[9].y))
        ratio_2d = d_2d / palm_2d
        pinch_equiv_2d_m = ratio_2d * 0.082
        effective_pinch_dist = 0.72 * pinch_equiv_2d_m + 0.28 * pinch_index_dist
    else:
        effective_pinch_dist = pinch_index_dist

    is_index_ext = _is_finger_extended(world_lms, lms, 8, 6, 5, palm_len)
    is_middle_ext = _is_finger_extended(world_lms, lms, 12, 10, 9, palm_len)
    is_ring_ext = _is_finger_extended(world_lms, lms, 16, 14, 13, palm_len)
    is_pinky_ext = _is_finger_extended(world_lms, lms, 20, 18, 17, palm_len)

    gap_index_middle = _dist3d(w_index, w_middle) / palm_len
    gap_middle_ring = _dist3d(w_middle, w_ring) / palm_len
    gap_ring_pinky = _dist3d(w_ring, w_pinky) / palm_len
    avg_gap = (gap_index_middle + gap_middle_ring + gap_ring_pinky) / 3.0

    all_4_ext = is_index_ext and is_middle_ext and is_ring_ext and is_pinky_ext

    raw_posture = 'REST'
    if all_4_ext and avg_gap < 0.28:
        raw_posture = 'FLAT_PALM'
    elif is_index_ext and is_middle_ext and is_ring_ext and not is_pinky_ext:
        raw_posture = 'ZOOM'
    elif is_index_ext and is_middle_ext and not is_ring_ext and not is_pinky_ext:
        raw_posture = 'SCROLL'
    elif is_index_ext and not is_middle_ext:
        raw_posture = 'POINTING'

    return raw_posture, effective_pinch_dist, palm_len

# -----------------------------------------------------------------------------
# 9b. SCROLL & ZOOM ENGINES
# -----------------------------------------------------------------------------
class ScrollEngine:
    def __init__(self, sensitivity=2.5, deadzone=0.012):
        self.sensitivity = sensitivity
        self.deadzone = deadzone
        self.prev_y = None
        self.accum_dy = 0.0

    def reset(self):
        self.prev_y = None
        self.accum_dy = 0.0

    def update(self, is_active, curr_y, safety_mgr):
        if not is_active:
            self.reset()
            return 0
        if self.prev_y is None:
            self.prev_y = curr_y
            self.accum_dy = 0.0
            return 0

        frame_dy = curr_y - self.prev_y
        self.prev_y = curr_y
        self.accum_dy += frame_dy

        if abs(self.accum_dy) < self.deadzone:
            return 0

        effective_dy = self.accum_dy - (self.deadzone if self.accum_dy > 0 else -self.deadzone)
        wheel_amount = -effective_dy * self.sensitivity * 2200
        safety_mgr.scroll_wheel(int(wheel_amount))
        self.accum_dy = self.deadzone if self.accum_dy > 0 else -self.deadzone
        return int(wheel_amount)

class TwoHandZoomEngine:
    def __init__(self, deadzone=0.006, step=120, throttle_s=0.08, sensitivity=2.8):
        self.deadzone = deadzone
        self.step = step
        self.throttle_s = throttle_s
        self.sensitivity = float(sensitivity)
        self.prev_dist = None
        self.accum_delta = 0.0
        self.last_zoom_time = 0.0

    def reset(self):
        self.prev_dist = None
        self.accum_delta = 0.0

    def update(self, dist, now, safety_mgr):
        if self.prev_dist is None:
            self.prev_dist = dist
            self.accum_delta = 0.0
            return None, dist

        frame_delta = dist - self.prev_dist
        self.prev_dist = dist
        self.accum_delta += frame_delta

        if abs(self.accum_delta) < self.deadzone:
            return 'IDLE', dist

        if (now - self.last_zoom_time) < self.throttle_s:
            return 'THROTTLED', dist

        num_ticks = max(1, min(5, int(abs(self.accum_delta) / self.deadzone)))
        clicks = int(num_ticks * self.step * (self.sensitivity / 2.0))

        action = None
        if self.accum_delta > 0:
            safety_mgr.zoom_in(step=clicks)
            action = 'ZOOM_IN'
        else:
            safety_mgr.zoom_out(step=clicks)
            action = 'ZOOM_OUT'

        self.last_zoom_time = now
        self.accum_delta = 0.0
        return action, dist

class ZoomEngine:
    def __init__(self, throttle_s=0.09, deadzone=0.020):
        self.throttle_s = throttle_s
        self.deadzone = deadzone
        self.anchor_y = None
        self.last_zoom_time = 0.0
        self.last_action = None

    def reset(self):
        self.anchor_y = None
        self.last_action = None

    def update(self, is_active, curr_y, now, safety_mgr):
        if not is_active:
            self.reset()
            return None
        if self.anchor_y is None:
            self.anchor_y = curr_y
            self.last_zoom_time = now
            return None

        dy = curr_y - self.anchor_y

        if now - self.last_zoom_time >= self.throttle_s:
            if dy < -self.deadzone:
                safety_mgr.zoom_in(step=120)
                self.anchor_y = curr_y
                self.last_zoom_time = now
                self.last_action = 'ZOOM_IN'
                return 'ZOOM_IN'
            elif dy > self.deadzone:
                safety_mgr.zoom_out(step=120)
                self.anchor_y = curr_y
                self.last_zoom_time = now
                self.last_action = 'ZOOM_OUT'
                return 'ZOOM_OUT'

        return self.last_action if (now - self.last_zoom_time < 0.25) else None

# -----------------------------------------------------------------------------
# 10. EDGE-TRIGGERED GLOBAL HOTKEYS
# -----------------------------------------------------------------------------
def check_global_hotkeys(safety_mgr):
    ctrl = (user32.GetAsyncKeyState(VK_CONTROL) & 0x8000) != 0
    alt = (user32.GetAsyncKeyState(VK_MENU) & 0x8000) != 0

    if ctrl and alt:
        q_now = (user32.GetAsyncKeyState(ord('Q')) & 0x8000) != 0
        m_now = (user32.GetAsyncKeyState(ord('M')) & 0x8000) != 0
        c_now = (user32.GetAsyncKeyState(ord('C')) & 0x8000) != 0

        if q_now and not safety_mgr.prev_hotkey_q:
            safety_mgr.prev_hotkey_q = True
            return 'QUIT'
        safety_mgr.prev_hotkey_q = q_now

        if m_now and not safety_mgr.prev_hotkey_m:
            safety_mgr.prev_hotkey_m = True
            safety_mgr.mouse_enabled = not safety_mgr.mouse_enabled
            if not safety_mgr.mouse_enabled:
                safety_mgr.cleanup()
            return 'TOGGLED_MOUSE'
        safety_mgr.prev_hotkey_m = m_now

        if c_now and not safety_mgr.prev_hotkey_c:
            safety_mgr.prev_hotkey_c = True
            return 'TOGGLED_CLUTCH'
        safety_mgr.prev_hotkey_c = c_now

        r_now = (user32.GetAsyncKeyState(ord('R')) & 0x8000) != 0
        if r_now and not safety_mgr.prev_hotkey_r:
            safety_mgr.prev_hotkey_r = True
            return 'RESET_FRAME'
        safety_mgr.prev_hotkey_r = r_now
    else:
        safety_mgr.prev_hotkey_q = False
        safety_mgr.prev_hotkey_m = False
        safety_mgr.prev_hotkey_c = False
        safety_mgr.prev_hotkey_r = False

    return 'NONE'

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (17, 18), (18, 19), (19, 20),
    (0, 17)
]

# -----------------------------------------------------------------------------
# 11. TRACKING WATCHDOG & MAIN SENSORY RUNTIME LOOP
# -----------------------------------------------------------------------------
class TrackingWatchdog:
    """Cancel held input once when camera frames stop arriving."""

    def __init__(self, reset_callback, now, timeout=0.35):
        self.reset_callback = reset_callback
        self.timeout = timeout
        self.last_frame_time = now
        self.tripped = False

    def frame_received(self, now):
        self.last_frame_time = now
        self.tripped = False

    def check(self, now):
        if not self.tripped and now - self.last_frame_time >= self.timeout:
            self.reset_callback()
            self.tripped = True
            return True
        return False


def main():
    print("=" * 75)
    print("  STARK AIR MOUSE // SPATIAL COMPUTING & 3D FRUSTUM SUITE v9.7.0 PRO")
    print("=" * 75)

    record_file = None
    if "--record" in sys.argv:
        try:
            r_idx = sys.argv.index("--record") + 1
            if r_idx < len(sys.argv) and not sys.argv[r_idx].startswith("--"):
                record_path = sys.argv[r_idx]
            else:
                record_path = f"stark_telemetry_{int(time.time())}.jsonl"
            record_file = open(record_path, "a", encoding="utf-8")
            print(f"[+] Recording landmark telemetry to: {record_path}")
        except Exception as e:
            print(f"[!] Can not open record file: {e}")

    cfg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stark_config.json")
    default_cfg = {
        "camera": {"device_index": 0, "width": 640, "height": 480, "target_fps": 60, "model_complexity": 1},
        "comfort_zone": {"calibrated": False, "x_min": 0.04, "x_max": 0.96, "y_min": 0.05, "y_max": 0.95},
        "one_euro_filter": {"min_cutoff": 0.95, "beta": 0.015, "d_cutoff": 1.0, "resting_deadzone_px": 1.5},
        "interactions": {
            "mouse_sensitivity": 1.15,
            "pointing_mode": "ABSOLUTE",
            "scroll_sensitivity": 2.5,
            "pinch_enter_distance_m": 0.028,
            "pinch_exit_distance_m": 0.038,
            "pitch_slope_compensation": 0.0,
            "desk_rest_bias": 0.0,
            "drag_threshold_cam_px": 20.0,
            "drag_grace_frames": 4,
            "click_timeout_seconds": 0.45,
            "secondary_click_hold_seconds": 0.45,
            "swipe_min_velocity": 0.35,
            "swipe_min_displacement": 0.08,
            "tab_mode": "TAB",
            "voice_feedback": True,
            "desktop_halo": {"enabled": True, "size": 64},
            "magnetic_snapping": {"enabled": True, "radius_px": 36, "gravity_factor": 0.72},
            "two_hand_zoom": {"enabled": True, "sensitivity": 2.8, "deadzone": 0.006, "step": 120, "throttle_seconds": 0.08},
            "pre_pinch_brake": {"enabled": True, "approach_dist_m": 0.038, "min_gain": 0.15},
            "stiction_anchor": {"enabled": False, "radius_px": 0.0, "breakout_speed_px_s": 20.0},
            "spring_k": 85.0,
            "clutch_ballistics": {"low_gain": 0.50, "high_gain": 1.95, "sigmoid_midpoint": 0.10, "sigmoid_steepness": 16.0}
        },
        "adaptive_one_euro": {
            "min_cutoff_slow": 0.85,
            "min_cutoff_fast": 3.60,
            "beta": 0.015,
            "d_cutoff": 1.0,
            "resting_deadzone_px": 1.5
        },
        "dwell_click": {"enabled": False, "dwell_seconds": 0.9, "radius_px": 16.0},
        "two_hand_precision": {"enabled": True, "sensitivity_factor": 0.35},
        "version": "9.7.3"
    }
    cfg = copy.deepcopy(default_cfg)
    if os.path.exists(cfg_path):
        try:
            with open(cfg_path, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                deep_update(cfg, loaded)
        except Exception:
            pass

    cam_cfg = cfg.get("camera", {})
    cz_cfg = cfg.get("comfort_zone", {})
    oef_cfg = cfg.get("one_euro_filter", {})
    act_cfg = cfg.get("interactions", {})
    aoef_cfg = cfg.get("adaptive_one_euro", {})

    voice_enabled = act_cfg.get("voice_feedback", True)
    voice_cmd_queue = queue.Queue()
    jarvis = JarvisVoiceEngine(enabled=voice_enabled)
    voice_listener = JarvisVoiceListener(voice_cmd_queue, enabled=voice_enabled)
    if voice_enabled:
        jarvis.speak("Stark Spatial Suite v9.7 online. True mouse parity engaged.")

    cam_w = cam_cfg.get("width", 640)
    cam_h = cam_cfg.get("height", 480)
    cam = ThreadedCamera(
        src=cam_cfg.get("device_index", 0),
        width=cam_w,
        height=cam_h,
        target_fps=cam_cfg.get("target_fps", 60)
    )

    task_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hand_landmarker.task")
    if not os.path.exists(task_path):
        print(f"[!] LOI: Khong tim thay {task_path}")
        cam.stop()
        return

    try:
        base_options = python.BaseOptions(
            model_asset_path=task_path,
            delegate=python.BaseOptions.Delegate.GPU
        )
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_hands=2,
            min_hand_detection_confidence=0.60,
            min_hand_presence_confidence=0.60,
            min_tracking_confidence=0.60
        )
        detector = vision.HandLandmarker.create_from_options(options)
        print("[+] Hardware Inference Backend: GPU Delegate Active (DirectML / CUDA)")
    except Exception:
        base_options = python.BaseOptions(
            model_asset_path=task_path,
            delegate=python.BaseOptions.Delegate.CPU
        )
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_hands=2,
            min_hand_detection_confidence=0.60,
            min_hand_presence_confidence=0.60,
            min_tracking_confidence=0.60
        )
        detector = vision.HandLandmarker.create_from_options(options)
        print("[*] Hardware Inference Backend: CPU XNNPACK Multi-threaded Active")

    scale_factor = cam_w / 640.0
    base_drag_px = act_cfg.get("drag_threshold_cam_px", 18.0)
    scaled_drag_px = max(12.0, base_drag_px * scale_factor)

    safety_mgr = WinInputManager()
    two_hand_cfg = act_cfg.get("two_hand_zoom", {})
    two_hand_enabled = two_hand_cfg.get("enabled", True)
    two_hand_zoom_engine = TwoHandZoomEngine(
        deadzone=float(two_hand_cfg.get("deadzone", 0.006)),
        step=int(two_hand_cfg.get("step", 120)),
        throttle_s=float(two_hand_cfg.get("throttle_seconds", 0.08)),
        sensitivity=float(two_hand_cfg.get("sensitivity", 2.8))
    )
    pinch_engine = PinchDragEngine(
        enter_thresh=act_cfg.get("pinch_enter_distance_m", 0.032),
        exit_thresh=act_cfg.get("pinch_exit_distance_m", 0.045),
        drag_cam_px=scaled_drag_px,
        click_timeout=act_cfg.get("click_timeout_seconds", 0.45),
        secondary_hold_seconds=act_cfg.get("secondary_click_hold_seconds", 0.45),
        max_grace_frames=act_cfg.get("drag_grace_frames", 4)
    )
    swipe_engine = SlidingWindowSwipeEngine(
        window_duration=0.16,
        min_vel=act_cfg.get("swipe_min_velocity", 0.35),
        min_dist=act_cfg.get("swipe_min_displacement", 0.08)
    )
    debouncer = DebouncedGestureClassifier(debounce_frames=2)
    scroll_engine = ScrollEngine(
        sensitivity=act_cfg.get("scroll_sensitivity", 2.5),
        deadzone=act_cfg.get("scroll_deadzone", 0.012)
    )
    zoom_engine = ZoomEngine()

    dwell_cfg = cfg.get("dwell_click", {})
    dwell_engine = DwellClickEngine(
        enabled=dwell_cfg.get("enabled", False),
        dwell_seconds=dwell_cfg.get("dwell_seconds", 0.90),
        radius_px=dwell_cfg.get("radius_px", 16.0)
    )

    filter_pixel_x = None
    filter_pixel_y = None
    clutch_filter_x = None
    clutch_filter_y = None

    tab_mode = act_cfg.get("tab_mode", "TAB")
    presentation_mode = False
    tv_couch_mode = False

    calib_mode = False
    calib_step = 0
    calib_hold_start = 0.0
    calib_tl = None
    calib_br = None

    # HoloMat Upgrades: Caliper & Radial Menu
    caliper_mode = False
    caliper_last_spoken_val = 0.0
    caliper_hold_time = 0.0

    radial_menu_active = False
    radial_hold_start = 0.0
    radial_sel_idx = None
    radial_sel_start = 0.0
    radial_cooldown = 0.0


    # Khởi tạo Desktop Click-Through Cursor Halo Overlay (được bơm sự kiện qua pump_events())
    desktop_halo = None
    if act_cfg.get("desktop_halo", {}).get("enabled", True):
        try:
            from stark_bridge import DesktopCursorHalo
            desktop_halo = DesktopCursorHalo(size=64)
            print("[+] Windows Desktop Cursor Halo Overlay Active (Non-blocking pump_events)")
        except Exception:
            desktop_halo = None

    # Khởi tạo AsyncCursorInterpolator 144Hz duy nhất điều phối chuột
    stiction_cfg = act_cfg.get("stiction_anchor", {})
    stiction_r = stiction_cfg.get("radius_px", 0.0) if stiction_cfg.get("enabled", False) else 0.0
    spring_k_val = act_cfg.get("spring_k", 85.0)
    cursor_interpolator = AsyncCursorInterpolator(target_hz=144, stiction_radius=stiction_r, spring_k=spring_k_val)

    pointing_mode = act_cfg.get("pointing_mode", "ABSOLUTE")
    prev_clutch_x, prev_clutch_y = None, None
    last_clutch_time = time.perf_counter()
    clutch_x = SCREEN_X + SCREEN_W / 2.0
    clutch_y = SCREEN_Y + SCREEN_H / 2.0
    screen_x = clutch_x
    screen_y = clutch_y

    def reset_tracking():
        nonlocal prev_clutch_x, prev_clutch_y, filter_pixel_x, filter_pixel_y
        nonlocal clutch_filter_x, clutch_filter_y, calib_hold_start
        cursor_interpolator.deactivate()
        pinch_engine.reset(safety_mgr)
        safety_mgr.cleanup()
        dwell_engine.reset()
        scroll_engine.reset()
        zoom_engine.reset()
        two_hand_zoom_engine.reset()
        debouncer.reset()
        swipe_engine.update(False, 0, time.perf_counter())
        prev_clutch_x, prev_clutch_y = None, None
        filter_pixel_x, filter_pixel_y = None, None
        clutch_filter_x, clutch_filter_y = None, None
        calib_hold_start = 0.0

    tracking_watchdog = TrackingWatchdog(reset_tracking, time.perf_counter())
    had_tracking = False

    window_name = "STARK AIR MOUSE // SPATIAL SUITE v9.7.3 PRO"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 960, 720)

    reset_button_clicked = False
    btn_bounds = {"x1": 0, "y1": 0, "x2": 0, "y2": 0}

    def on_camera_mouse(event, mx, my, flags, param):
        nonlocal reset_button_clicked
        if event == cv2.EVENT_LBUTTONDOWN:
            if btn_bounds["x1"] <= mx <= btn_bounds["x2"] and btn_bounds["y1"] <= my <= btn_bounds["y2"]:
                reset_button_clicked = True

    cv2.setMouseCallback(window_name, on_camera_mouse)

    def reset_to_default_frame():
        nonlocal calib_mode, calib_step, calib_hold_start, calib_tl, calib_br
        nonlocal status_text, status_color, x_min, x_max, y_min, y_max
        calib_mode = False
        calib_step = 0
        calib_hold_start = 0.0
        calib_tl = None
        calib_br = None
        cz_cfg["calibrated"] = False
        cz_cfg["x_min"] = 0.04
        cz_cfg["x_max"] = 0.96
        cz_cfg["y_min"] = 0.05
        cz_cfg["y_max"] = 0.95
        x_min = 0.04
        x_max = 0.96
        y_min = 0.05
        y_max = 0.95
        cfg["comfort_zone"] = cz_cfg
        try:
            with open(cfg_path, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=2)
        except Exception as e:
            print(f"[!] Can not save config: {e}")
        status_text = "DA KHOI PHUC GIAO DIEN THUONG // FULL FRAME"
        status_color = (0, 255, 0)
        jarvis.speak("Reset to default interface.")

    print("[+] He thong Dien Toan Khong Gian STARK v9.7.0 PRO san sang:")
    print("    - 144Hz Unified Cursor : Dong bo 1 luong duy nhat, KEO THA (DRAG) & CLICK muot tuyet doi.")
    print("    - Knuckle-Ray Steering : Tach khop ngon bam khoi khop lai, khong giat lech khi chum tay.")
    print("    - Smooth Pre-Pinch     : Giam tan so cat OneEuroFilter muot ma, khong nhay coc khi nha tay.")
    print("    - True Ballistic Clutch: Bam 'H' de chuyen ABSOLUTE <-> HYBRID_CLUTCH (Nam ho tay = Nhac chuot).\n")

    try:
        while True:
            # Bơm sự kiện cho Desktop Cursor Halo mỗi vòng lặp để cửa sổ Tkinter không bao giờ bị đơ
            if desktop_halo:
                desktop_halo.pump_events()

            # 1. Edge-triggered Global Hotkeys
            hotkey_action = check_global_hotkeys(safety_mgr)
            if hotkey_action == 'QUIT':
                jarvis.speak("Powering down.")
                break
            elif hotkey_action == 'TOGGLED_MOUSE':
                if not safety_mgr.mouse_enabled:
                    reset_tracking()
                st = "engaged" if safety_mgr.mouse_enabled else "disengaged"
                jarvis.speak(f"Mouse control {st}")
            elif hotkey_action == 'TOGGLED_CLUTCH':
                pointing_mode = "ABSOLUTE" if pointing_mode == "HYBRID_CLUTCH" else "HYBRID_CLUTCH"
                prev_clutch_x, prev_clutch_y = None, None
                clutch_x, clutch_y = screen_x, screen_y
                jarvis.speak(f"{pointing_mode.replace('_', ' ')} mode active")
            elif hotkey_action == 'RESET_FRAME':
                reset_to_default_frame()

            # 2. Xử lý khẩu lệnh từ J.A.R.V.I.S.
            while not voice_cmd_queue.empty():
                cmd = voice_cmd_queue.get_nowait()
                if cmd == 'next slide':
                    safety_mgr.next_slide()
                    jarvis.speak("Next slide, sir.")
                elif cmd == 'previous slide':
                    safety_mgr.prev_slide()
                    jarvis.speak("Previous slide.")
                elif cmd == 'presentation mode':
                    presentation_mode = not presentation_mode
                    jarvis.speak(f"Presentation mode {'engaged' if presentation_mode else 'disengaged'}")
                elif cmd == 'tv mode':
                    tv_couch_mode = not tv_couch_mode
                    jarvis.speak(f"TV couch mode {'active' if tv_couch_mode else 'standard'}")
                elif cmd == 'zoom in':
                    safety_mgr.zoom_in(150)
                    jarvis.speak("Zooming in.")
                elif cmd == 'zoom out':
                    safety_mgr.zoom_out(150)
                    jarvis.speak("Zooming out.")
                elif cmd == 'screenshot':
                    safety_mgr.take_screenshot()
                    jarvis.speak("Capturing screen.")
                elif cmd == 'mute audio':
                    safety_mgr.toggle_mute()
                    jarvis.speak("Audio toggle.")
                elif cmd == 'mouse on':
                    safety_mgr.mouse_enabled = True
                    jarvis.speak("Mouse active.")
                elif cmd == 'mouse off':
                    safety_mgr.mouse_enabled = False
                    reset_tracking()
                    jarvis.speak("Mouse standby.")

            # 3. Đọc frame camera đồng bộ Shutter quang học
            has_new, frame, capture_ts, frame_id = cam.read_new(timeout=0.035)
            if not has_new or frame is None:
                tracking_watchdog.check(time.perf_counter())
                key = cv2.waitKey(1) & 0xFF
                if key in (ord('r'), ord('R'), ord('b'), ord('B'), 8) or reset_button_clicked:
                    reset_button_clicked = False
                    reset_to_default_frame()
                elif key == ord('q') or key == 27:
                    jarvis.speak("Powering down.")
                    break
                elif key == ord('m'):
                    safety_mgr.mouse_enabled = not safety_mgr.mouse_enabled
                    if not safety_mgr.mouse_enabled:
                        reset_tracking()
                    jarvis.speak(f"Mouse {'on' if safety_mgr.mouse_enabled else 'off'}")
                continue

            frame = cv2.flip(frame, 1)
            h, w, _ = frame.shape
            now = time.perf_counter()
            tracking_watchdog.frame_received(now)
            ts_ms = int(now * 1000)

            # 4. MediaPipe VIDEO Mode
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            res = detector.detect_for_video(mp_img, ts_ms)

            status_text = "CHO BAN TAY..."
            status_color = (150, 150, 150)

            if safety_mgr.alt_tab_active:
                if (now - safety_mgr.last_alt_tab_time > 1.2):
                    safety_mgr.release_alt_tab()

            x_min = cz_cfg.get("x_min", 0.04)
            x_max = cz_cfg.get("x_max", 0.96)
            y_min = cz_cfg.get("y_min", 0.05)
            y_max = cz_cfg.get("y_max", 0.95)

            cz_x1 = int(x_min * w)
            cz_y1 = int(y_min * h)
            cz_x2 = int(x_max * w)
            cz_y2 = int(y_max * h)

            # Ve Vung Dieu Khien Rong Rai (Expanded Sci-Fi Reticle HUD)
            # Khung vien mong thanh lich, triet tieu 100% cac duong cheo dam qua mat nguoi dung
            cv2.rectangle(frame, (cz_x1, cz_y1), (cz_x2, cz_y2), (0, 120, 160), 1, cv2.LINE_AA)
            
            # 4 Goc ngam cong nghe cao chu L (Corner Reticles)
            c_len = 24
            # Goc tren trai
            cv2.line(frame, (cz_x1, cz_y1), (cz_x1 + c_len, cz_y1), (0, 243, 255), 2, cv2.LINE_AA)
            cv2.line(frame, (cz_x1, cz_y1), (cz_x1, cz_y1 + c_len), (0, 243, 255), 2, cv2.LINE_AA)
            # Goc tren phai
            cv2.line(frame, (cz_x2, cz_y1), (cz_x2 - c_len, cz_y1), (0, 243, 255), 2, cv2.LINE_AA)
            cv2.line(frame, (cz_x2, cz_y1), (cz_x2, cz_y1 + c_len), (0, 243, 255), 2, cv2.LINE_AA)
            # Goc duoi trai
            cv2.line(frame, (cz_x1, cz_y2), (cz_x1 + c_len, cz_y2), (0, 243, 255), 2, cv2.LINE_AA)
            cv2.line(frame, (cz_x1, cz_y2), (cz_x1, cz_y2 - c_len), (0, 243, 255), 2, cv2.LINE_AA)
            # Goc duoi phai
            cv2.line(frame, (cz_x2, cz_y2), (cz_x2 - c_len, cz_y2), (0, 243, 255), 2, cv2.LINE_AA)
            cv2.line(frame, (cz_x2, cz_y2), (cz_x2, cz_y2 - c_len), (0, 243, 255), 2, cv2.LINE_AA)

            for pt in [(cz_x1, cz_y1), (cz_x2, cz_y1), (cz_x2, cz_y2), (cz_x1, cz_y2)]:
                cv2.circle(frame, pt, 3, (0, 243, 255), -1)

            box_label = f"VUNG DIEU KHIEN RONG [{pointing_mode}]"
            if cz_cfg.get("calibrated", False):
                box_label = f"VUNG CALIBRATE [{pointing_mode}] - BAM [R] VE THUONG"
            cv2.putText(frame, box_label, (cz_x1 + 8, max(18, cz_y1 - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.40, (0, 243, 255), 1, cv2.LINE_AA)

            proj_x = w // 2
            proj_y = h // 2

            if res.hand_landmarks and res.hand_world_landmarks:
                had_tracking = True
                lms = res.hand_landmarks[0]
                world_lms = res.hand_world_landmarks[0]

                if record_file:
                    rec_entry = {
                        "ts": capture_ts,
                        "frame_id": frame_id,
                        "lms": [{"x": p.x, "y": p.y, "z": p.z} for p in lms],
                        "world_lms": [{"x": p.x, "y": p.y, "z": p.z} for p in world_lms],
                    }
                    record_file.write(json.dumps(rec_entry) + "\n")

                num_detected_hands = len(res.hand_landmarks)

                if num_detected_hands == 2 and two_hand_enabled and not calib_mode:
                    cursor_interpolator.deactivate()
                    dwell_engine.reset()
                    lms2 = res.hand_landmarks[1]
                    pixel_pts1 = [(int(lm.x * w), int(lm.y * h)) for lm in lms]
                    pixel_pts2 = [(int(lm.x * w), int(lm.y * h)) for lm in lms2]
                    for p1_i, p2_i in HAND_CONNECTIONS:
                        cv2.line(frame, pixel_pts1[p1_i], pixel_pts1[p2_i], (0, 180, 220), 2, cv2.LINE_AA)
                        cv2.line(frame, pixel_pts2[p1_i], pixel_pts2[p2_i], (180, 0, 220), 2, cv2.LINE_AA)

                    cam_tip1_x, cam_tip1_y = int(lms[8].x * w), int(lms[8].y * h)
                    cam_mcp1_x, cam_mcp1_y = int(lms[5].x * w), int(lms[5].y * h)
                    cam_tip2_x, cam_tip2_y = int(lms2[8].x * w), int(lms2[8].y * h)
                    cam_mcp2_x, cam_mcp2_y = int(lms2[5].x * w), int(lms2[5].y * h)

                    cv2.line(frame, (cam_mcp1_x, cam_mcp1_y), (cam_tip1_x, cam_tip1_y), (0, 230, 255), 1, cv2.LINE_AA)
                    cv2.circle(frame, (cam_tip1_x, cam_tip1_y), 7, (0, 243, 255), 1, cv2.LINE_AA)
                    cv2.line(frame, (cam_mcp2_x, cam_mcp2_y), (cam_tip2_x, cam_tip2_y), (255, 0, 255), 1, cv2.LINE_AA)
                    cv2.circle(frame, (cam_tip2_x, cam_tip2_y), 7, (255, 0, 255), 1, cv2.LINE_AA)
                    cv2.line(frame, (cam_tip1_x, cam_tip1_y), (cam_tip2_x, cam_tip2_y), (0, 243, 255), 1, cv2.LINE_AA)

                    mid_2h_x = (cam_tip1_x + cam_tip2_x) // 2
                    mid_2h_y = (cam_tip1_y + cam_tip2_y) // 2
                    dist_2h = math.hypot(lms[8].x - lms2[8].x, lms[8].y - lms2[8].y)
                    cv2.putText(frame, f'SPAN: {dist_2h:.2f}', (mid_2h_x - 35, mid_2h_y - 12),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 243, 255), 1, cv2.LINE_AA)

                    two_act, span_dist = two_hand_zoom_engine.update(dist_2h, now, safety_mgr)
                    if desktop_halo:
                        desktop_halo.set_state('ZOOM')
                    if two_act == 'ZOOM_IN':
                        status_text = f'2 TAY: PHONG TO [+] ({span_dist:.2f})'
                        status_color = (0, 255, 0)
                    elif two_act == 'ZOOM_OUT':
                        status_text = f'2 TAY: THU NHO [-] ({span_dist:.2f})'
                        status_color = (0, 165, 255)
                    else:
                        status_text = f'2 TAY: SAN SANG ZOOM (SPAN: {dist_2h:.2f})'
                        status_color = (255, 0, 255)

                    scroll_engine.reset()
                    zoom_engine.reset()
                    pinch_engine.reset(safety_mgr)
                else:
                    two_hand_zoom_engine.reset()
                    raw_posture, pinch_d_m, palm_len = classify_gestures_world_3d(world_lms, lms)
                    posture = debouncer.update(raw_posture)

                    # =============================================================
                    # ANATOMICAL KNUCKLE-ASSISTED STEERING (ZERO PINCH DEFLECTION)
                    # =============================================================
                    # Khớp xương bàn tay (MCP 5 + MCP 9) đứng yên tuyệt đối khi ngón trỏ gập xuống để bấm.
                    # Kết hợp 75% Knuckle + 25% hướng ngón trỏ giúp vừa lái linh hoạt bằng cổ tay/ngón tay,
                    # vừa triệt tiêu 100% hiện tượng co rút gân làm lệch con trỏ khi Pinch!
                    knuckle_x = 0.65 * lms[5].x + 0.35 * lms[9].x
                    knuckle_y = 0.65 * lms[5].y + 0.35 * lms[9].y
                    mcp_x, mcp_y = lms[5].x, lms[5].y
                    tip_x, tip_y = lms[8].x, lms[8].y

                    cam_mcp_x, cam_mcp_y = int(mcp_x * w), int(mcp_y * h)
                    cam_tip_x, cam_tip_y = int(tip_x * w), int(tip_y * h)

                    enter_thresh_m = act_cfg.get("pinch_enter_distance_m", 0.028)
                    pre_pinch_brake = compute_pre_pinch_brake(
                        pinch_d_m,
                        enter_thresh_m,
                        approach_dist=act_cfg.get("pre_pinch_brake", {}).get("approach_dist_m", 0.038),
                        min_gain=act_cfg.get("pre_pinch_brake", {}).get("min_gain", 0.15)
                    )
                    if not act_cfg.get("pre_pinch_brake", {}).get("enabled", True):
                        pre_pinch_brake = 1.0

                    # Điểm lái trực tiếp đầu ngón trỏ với 30% hỗ trợ ổn định từ khớp bàn tay (MCP 5 & 9)
                    # Đạo hàm dương d(steer)/d(tip) = +0.70: vẫy ngón trỏ lên -> con trỏ đi lên tức thì!
                    steer_x = 0.70 * tip_x + 0.30 * knuckle_x
                    steer_y = 0.70 * tip_y + 0.30 * knuckle_y
                    mouse_sens = act_cfg.get("mouse_sensitivity", 1.15)

                    # =============================================================
                    # ĐIỀU HƯỚNG CHUẨN XÁC: HYBRID_CLUTCH (TRACKPAD) HOẶC ABSOLUTE
                    # =============================================================
                    if pointing_mode == "HYBRID_CLUTCH":
                        if clutch_filter_x is None:
                            clutch_filter_x = OneEuroFilter(now, steer_x, min_cutoff=1.5, beta=0.02, d_cutoff=1.0)
                            clutch_filter_y = OneEuroFilter(now, steer_y, min_cutoff=1.5, beta=0.02, d_cutoff=1.0)

                        smooth_sx = clutch_filter_x.filter(now, steer_x)
                        smooth_sy = clutch_filter_y.filter(now, steer_y)

                        # Bám ly hợp khi đang giơ ngón trỏ (POINTING) HOẶC đang giữ Pinch / Kéo thả (DRAGGING)!
                        # Ngắt ly hợp ("Nhấc chuột") khi nắm hờ bàn tay (REST) hoặc chuyển sang SCROLL / ZOOM / FLAT_PALM.
                        clutch_engaged = (posture == 'POINTING') or (pinch_engine.state != 'IDLE')

                        if clutch_engaged:
                            if prev_clutch_x is None:
                                prev_clutch_x = smooth_sx
                                prev_clutch_y = smooth_sy
                                last_clutch_time = now
                            else:
                                dt_clutch = max(0.005, now - last_clutch_time)
                                last_clutch_time = now
                                dx = smooth_sx - prev_clutch_x
                                dy = smooth_sy - prev_clutch_y
                                prev_clutch_x = smooth_sx
                                prev_clutch_y = smooth_sy

                                hand_vel = math.hypot(dx, dy) / dt_clutch
                                if hand_vel < 0.005:
                                    dx, dy = 0.0, 0.0

                                # Đường cong gia tốc Trackpad thích ứng từ cấu hình, lướt nhanh nhưng đầm tay
                                cb_cfg = act_cfg.get("clutch_ballistics", {})
                                low_gain = cb_cfg.get("low_gain", 0.50)
                                high_gain = cb_cfg.get("high_gain", 1.95)
                                midpoint = cb_cfg.get("sigmoid_midpoint", 0.10)
                                steepness = cb_cfg.get("sigmoid_steepness", 16.0)
                                ballistic_gain = low_gain + (high_gain - low_gain) / (1.0 + math.exp(-steepness * (hand_vel - midpoint)))
                                effective_gain = ballistic_gain * (pre_pinch_brake if pinch_engine.state in ('IDLE', 'PINCH_PENDING') else 1.0)

                                delta_scr_x = dx * SCREEN_W * mouse_sens * effective_gain
                                delta_scr_y = dy * SCREEN_H * mouse_sens * effective_gain

                                clutch_x = max(float(SCREEN_X), min(float(SCREEN_X + SCREEN_W - 1), clutch_x + delta_scr_x))
                                clutch_y = max(float(SCREEN_Y), min(float(SCREEN_Y + SCREEN_H - 1), clutch_y + delta_scr_y))

                            screen_x = clutch_x
                            screen_y = clutch_y
                        else:
                            # Nhấc chuột (Clutch Disengaged): đưa tay về tư thế nghỉ không làm trôi con trỏ
                            prev_clutch_x = None
                            prev_clutch_y = None
                            screen_x = clutch_x
                            screen_y = clutch_y
                    else:
                        # ABSOLUTE MODE: Ánh xạ từ Comfort Zone lên màn hình với 1 tầng lọc thích ứng duy nhất
                        screen_aspect = float(SCREEN_W) / max(1.0, float(SCREEN_H))
                        cam_aspect = float(cam_w) / max(1.0, float(cam_h))
                        aspect_comp = max(0.85, min(1.20, (screen_aspect / cam_aspect) * 0.75))

                        raw_norm_x = (steer_x - x_min) / max(0.05, x_max - x_min)
                        raw_norm_y = (steer_y - y_min) / max(0.05, y_max - y_min)
                        norm_x = (raw_norm_x - 0.5) * mouse_sens + 0.5
                        norm_y = (raw_norm_y - 0.5) * (mouse_sens * aspect_comp) + 0.5

                        if tv_couch_mode:
                            dist_gain = max(1.0, min(2.0, 0.085 / max(0.025, palm_len)))
                            norm_x = (norm_x - 0.5) * dist_gain + 0.5
                            norm_y = (norm_y - 0.5) * dist_gain + 0.5

                        norm_x_clamped = max(0.0, min(1.0, norm_x))
                        norm_y_clamped = max(0.0, min(1.0, norm_y))

                        raw_screen_x = SCREEN_X + norm_x_clamped * (SCREEN_W - 1)
                        raw_screen_y = SCREEN_Y + norm_y_clamped * (SCREEN_H - 1)

                        if filter_pixel_x is None:
                            cut_slow = aoef_cfg.get("min_cutoff_slow", 0.75)
                            cut_fast = aoef_cfg.get("min_cutoff_fast", 3.20)
                            b_val = aoef_cfg.get("beta", 0.015)
                            d_val = aoef_cfg.get("d_cutoff", 1.0)
                            filter_pixel_x = AdaptiveOneEuroFilter(now, raw_screen_x, cut_slow, cut_fast, b_val, d_val)
                            filter_pixel_y = AdaptiveOneEuroFilter(now, raw_screen_y, cut_slow, cut_fast, b_val, d_val)

                        # Khi đang DRAGGING thì không bóp phanh để kéo cửa sổ nhẹ nhàng; khi sắp bấm (IDLE) thì phanh mượt
                        cutoff_scale = pre_pinch_brake if pinch_engine.state in ('IDLE', 'PINCH_PENDING') else 1.0
                        screen_x = filter_pixel_x.filter(now, raw_screen_x, cutoff_scale=cutoff_scale)
                        screen_y = filter_pixel_y.filter(now, raw_screen_y, cutoff_scale=cutoff_scale)
                        clutch_x, clutch_y = screen_x, screen_y

                    # Tọa độ phản chiếu trên Inner Plane
                    filtered_norm_x = (screen_x - SCREEN_X) / max(1.0, float(SCREEN_W))
                    filtered_norm_y = (screen_y - SCREEN_Y) / max(1.0, float(SCREEN_H))
                    proj_x = int(cz_x1 + filtered_norm_x * (cz_x2 - cz_x1))
                    proj_y = int(cz_y1 + filtered_norm_y * (cz_y2 - cz_y1))

                    # Vẽ HUD khung xương bàn tay sạch sẽ (Đã xóa bỏ hoàn toàn tia laser dài gây vướng mắt)
                    # Khung nhìn thanh lịch sạch sẽ - hoàn toàn không có đường chiếu laser gây vướng tầm nhìn

                    pixel_pts = [(int(lm.x * w), int(lm.y * h)) for lm in lms]
                    for p1_i, p2_i in HAND_CONNECTIONS:
                        cv2.line(frame, pixel_pts[p1_i], pixel_pts[p2_i], (0, 150, 180), 1, cv2.LINE_AA)
                    for pt in pixel_pts:
                        cv2.circle(frame, pt, 1, (200, 140, 0), -1, cv2.LINE_AA)

                    # HoloMat: Khi che do Thuoc do Caliper duoc bat, ve thuoc do dien tu
                    if caliper_mode and world_lms:
                        cur_dist_mm = draw_spatial_caliper(frame, lms, world_lms, w, h)
                        if abs(cur_dist_mm - caliper_last_spoken_val) < 3.0:
                            if caliper_hold_time == 0.0:
                                caliper_hold_time = now
                            elif (now - caliper_hold_time) > 1.2:
                                caliper_last_spoken_val = cur_dist_mm
                                caliper_hold_time = 0.0
                                jarvis.speak(f"{int(round(cur_dist_mm))} millimeters")
                        else:
                            caliper_last_spoken_val = cur_dist_mm
                            caliper_hold_time = now

                    # =============================================================
                    # ĐIỀU PHỐI HÀNH ĐỘNG CỬ CHỈ (VISION PRO STATE MACHINE)
                    # =============================================================
                    if calib_mode:
                        cursor_interpolator.deactivate()
                        target_label = "GOC TREN-TRAI (TOP-LEFT)" if calib_step == 0 else "GOC DUOI-PHAI (BOTTOM-RIGHT)"
                        cv2.putText(frame, f"CALIBRATION: {target_label}", (30, 110),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2, cv2.LINE_AA)
                        cv2.putText(frame, "Giu tay tai goc thoai mai trong 1.5s...", (30, 140),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1, cv2.LINE_AA)

                        if calib_hold_start == 0.0:
                            calib_hold_start = now

                        hold_time = now - calib_hold_start
                        bar_w = int(min(1.0, hold_time / 1.5) * 200)
                        cv2.rectangle(frame, (30, 160), (30 + bar_w, 175), (0, 255, 0), -1)
                        cv2.rectangle(frame, (30, 160), (230, 175), (0, 255, 255), 2)

                        if hold_time >= 1.5:
                            if calib_step == 0:
                                calib_tl = (steer_x, steer_y)
                                calib_step = 1
                                calib_hold_start = 0.0
                                jarvis.speak("Top left saved. Now hold bottom right.")
                            elif calib_step == 1:
                                calib_br = (steer_x, steer_y)
                                calib_mode = False
                                if calib_tl is None or calib_br is None:
                                    calib_step = 0
                                    calib_hold_start = 0.0
                                    jarvis.speak("Calibration error. Please try again.")
                                    continue
                                raw_xmin = min(calib_tl[0], calib_br[0])
                                raw_xmax = max(calib_tl[0], calib_br[0])
                                raw_ymin = min(calib_tl[1], calib_br[1])
                                raw_ymax = max(calib_tl[1], calib_br[1])

                                cx = (raw_xmin + raw_xmax) / 2.0
                                cy = (raw_ymin + raw_ymax) / 2.0
                                span_x = max(0.35, raw_xmax - raw_xmin)
                                span_y = max(0.35, raw_ymax - raw_ymin)

                                new_xmin = max(0.05, cx - span_x / 2.0)
                                new_xmax = min(0.95, cx + span_x / 2.0)
                                new_ymin = max(0.05, cy - span_y / 2.0)
                                new_ymax = min(0.95, cy + span_y / 2.0)

                                cz_cfg["x_min"] = round(float(new_xmin), 3)
                                cz_cfg["x_max"] = round(float(new_xmax), 3)
                                cz_cfg["y_min"] = round(float(new_ymin), 3)
                                cz_cfg["y_max"] = round(float(new_ymax), 3)
                                cz_cfg["calibrated"] = True
                                cfg["comfort_zone"] = cz_cfg

                                try:
                                    with open(cfg_path, "w", encoding="utf-8") as f:
                                        json.dump(cfg, f, indent=2)
                                except Exception:
                                    pass

                                jarvis.speak("Calibration complete. Comfort zone updated.")
                                calib_step = 0
                                calib_hold_start = 0.0
                    else:
                        cam_palm_x = int(lms[9].x * w)
                        cam_palm_y = int(lms[9].y * h)

                        # HYBRID_CLUTCH & REST POSTURE SAFETY GATE
                        # Khóa chặt cử chỉ Pinch khi bàn tay đang ở tư thế nghỉ (REST) hoặc mở phẳng (FLAT_PALM).
                        # Triệt tiêu 100% lỗi nhấc ngón tay co lại để dời chuột mà vô tình chụm ngón cái gây click / bôi đen màn hình!
                        can_pinch = (posture == 'POINTING') or (pinch_engine.state != 'IDLE')
                        effective_pinch_d = pinch_d_m if can_pinch else 999.0

                        pinch_st, pinch_fb = pinch_engine.update(
                            effective_pinch_d, cam_palm_x, cam_palm_y, screen_x, screen_y, now, safety_mgr, cursor_interpolator
                        )

                        if posture == 'POINTING' and pinch_st == 'IDLE' and safety_mgr.mouse_enabled:
                            dwell_prog, dwell_click_fired = dwell_engine.update(screen_x, screen_y, now, safety_mgr)
                        else:
                            dwell_engine.reset()
                            dwell_prog, dwell_click_fired = 0.0, False
                        if dwell_click_fired:
                            pinch_fb = 'CLICK'

                        if pinch_st == 'PINCH_PENDING' and not pinch_engine.secondary_triggered:
                            hold_t = now - pinch_engine.start_time
                            prog = min(1.0, hold_t / pinch_engine.secondary_hold_seconds)
                            deg = int(prog * 360)
                            cv2.ellipse(frame, (cam_tip_x, cam_tip_y), (10, 10), -90, 0, deg, (0, 165, 255), 1, cv2.LINE_AA)

                        # =============================================================
                        # TÂM NGẮM MICRO RETICLE & ĐỒNG BỘ 144Hz KHÔNG XUNG ĐỘT
                        # =============================================================
                        if pinch_st == 'PINCH_PENDING':
                            cam_thumb_x, cam_thumb_y = int(lms[4].x * w), int(lms[4].y * h)
                            cv2.line(frame, (cam_thumb_x, cam_thumb_y), (cam_tip_x, cam_tip_y), (0, 255, 0), 1, cv2.LINE_AA)
                            cv2.circle(frame, (cam_tip_x, cam_tip_y), 6, (0, 255, 0), 1, cv2.LINE_AA)
                            disp_x, disp_y = int(pinch_engine.frozen_cursor_x), int(pinch_engine.frozen_cursor_y)
                            cv2.putText(frame, f"[PINCH LOCK: {disp_x}px, {disp_y}px]", (cam_tip_x + 10, cam_tip_y - 4),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.34, (0, 255, 0), 1, cv2.LINE_AA)
                        elif pinch_st in ('DRAGGING', 'DRAGGING_GRACE'):
                            cam_thumb_x, cam_thumb_y = int(lms[4].x * w), int(lms[4].y * h)
                            cv2.line(frame, (cam_thumb_x, cam_thumb_y), (cam_tip_x, cam_tip_y), (0, 255, 255), 1, cv2.LINE_AA)
                            cv2.circle(frame, (cam_tip_x, cam_tip_y), 7, (0, 255, 255), 1, cv2.LINE_AA)
                            disp_x, disp_y = int(pinch_engine.active_cursor_x), int(pinch_engine.active_cursor_y)
                            cv2.putText(frame, f"[DRAGGING: {disp_x}px, {disp_y}px]", (cam_tip_x + 10, cam_tip_y - 4),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.34, (0, 255, 255), 1, cv2.LINE_AA)
                        elif pinch_fb == 'CLICK':
                            cv2.circle(frame, (cam_tip_x, cam_tip_y), 9, (0, 255, 0), 1, cv2.LINE_AA)
                            disp_x, disp_y = int(pinch_engine.frozen_cursor_x), int(pinch_engine.frozen_cursor_y)
                            cv2.putText(frame, f"[CLICK: {disp_x}px, {disp_y}px]", (cam_tip_x + 10, cam_tip_y - 4),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.36, (0, 255, 0), 1, cv2.LINE_AA)
                        else:
                            cv2.drawMarker(frame, (cam_tip_x, cam_tip_y), (0, 243, 255), cv2.MARKER_CROSS, 8, 1, cv2.LINE_AA)
                            cv2.circle(frame, (cam_tip_x, cam_tip_y), 5, (0, 243, 255), 1, cv2.LINE_AA)
                            disp_x, disp_y = int(screen_x), int(screen_y)
                            cv2.putText(frame, f"[{disp_x}px, {disp_y}px]", (cam_tip_x + 10, cam_tip_y + 8),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.33, (0, 240, 255), 1, cv2.LINE_AA)

                        if pinch_fb in ('CLICK', 'RIGHT_CLICK'):
                            if filter_pixel_x is not None and filter_pixel_y is not None:
                                filter_pixel_x.reset(now, pinch_engine.frozen_cursor_x)
                                filter_pixel_y.reset(now, pinch_engine.frozen_cursor_y)
                        if pinch_fb == 'RIGHT_CLICK':
                            status_text = "SECONDARY CLICK (CHUOT PHAI THANH CONG)!"
                            status_color = (255, 0, 128)
                            if desktop_halo:
                                desktop_halo.trigger_event('right_click')
                        elif pinch_fb == 'CLICK':
                            status_text = "PRIMARY CLICK (CHAM NHANH THANH CONG)!"
                            status_color = (0, 255, 0)
                            if desktop_halo:
                                desktop_halo.trigger_event('click')
                        elif pinch_st in ('DRAGGING', 'DRAGGING_GRACE'):
                            status_text = "LASER ANNOTATION // VE LEN SLIDE" if presentation_mode else "KEO THA CUA SO / TAB (DRAGGING 144Hz)"
                            status_color = (0, 255, 255)
                            if desktop_halo:
                                desktop_halo.set_state('DRAGGING')
                        elif pinch_st == 'PINCH_PENDING':
                            status_text = "CHUM TAY // NHA DE CLICK - GIU DE MO MENU PHAI"
                            status_color = (0, 255, 0)
                            if desktop_halo:
                                hold_t = now - pinch_engine.start_time
                                prog = min(1.0, hold_t / pinch_engine.secondary_hold_seconds)
                                desktop_halo.set_state('PINCH_HOLD', prog)
                        elif posture == 'POINTING':
                            scroll_engine.reset()
                            zoom_engine.reset()
                            if desktop_halo:
                                desktop_halo.set_state('POINTING')
                            if safety_mgr.mouse_enabled:
                                cursor_interpolator.set_target(screen_x, screen_y)
                            status_text = f"POINTING [{pointing_mode}] // DI CHUYEN CHUOT" if not presentation_mode else "LASER POINTER PRESENTATION"
                            status_color = (0, 243, 255) if not presentation_mode else (0, 0, 255)
                        elif posture == 'SCROLL':
                            if pinch_engine.state == 'IDLE':
                                cursor_interpolator.deactivate()
                            zoom_engine.reset()
                            if desktop_halo:
                                desktop_halo.set_state('SCROLL')
                            mid_y = (lms[8].y + lms[12].y) / 2.0
                            wheel_val = scroll_engine.update(True, mid_y, safety_mgr)
                            cam_mid_x, cam_mid_y = int(lms[12].x * w), int(lms[12].y * h)
                            cv2.circle(frame, (cam_tip_x, cam_tip_y), 10, (0, 255, 200), 2, cv2.LINE_AA)
                            cv2.circle(frame, (cam_mid_x, cam_mid_y), 10, (0, 255, 200), 2, cv2.LINE_AA)
                            cv2.line(frame, (cam_tip_x, cam_tip_y), (cam_mid_x, cam_mid_y), (0, 255, 200), 2, cv2.LINE_AA)
                            if wheel_val > 0:
                                status_text = f"CUON TRANG LEN (SCROLL UP) [+{wheel_val}]"
                                status_color = (0, 255, 200)
                            elif wheel_val < 0:
                                status_text = f"CUON TRANG XUONG (SCROLL DOWN) [{wheel_val}]"
                                status_color = (0, 200, 255)
                            else:
                                status_text = "SCROLL MODE // 2 NGON VUOT LEN / XUONG"
                                status_color = (0, 243, 255)
                        elif posture == 'ZOOM':
                            if pinch_engine.state == 'IDLE':
                                cursor_interpolator.deactivate()
                            scroll_engine.reset()
                            if desktop_halo:
                                desktop_halo.set_state('ZOOM')
                            mid_y = (lms[8].y + lms[12].y + lms[16].y) / 3.0
                            zoom_act = zoom_engine.update(True, mid_y, now, safety_mgr)
                            cam_mid_x, cam_mid_y = int(lms[12].x * w), int(lms[12].y * h)
                            cam_ring_x, cam_ring_y = int(lms[16].x * w), int(lms[16].y * h)
                            for pt in [(cam_tip_x, cam_tip_y), (cam_mid_x, cam_mid_y), (cam_ring_x, cam_ring_y)]:
                                cv2.circle(frame, pt, 10, (0, 215, 255), 2, cv2.LINE_AA)
                            if zoom_act == 'ZOOM_IN':
                                status_text = "ZOOM IN [+] (PHONG TO MAN HINH)"
                                status_color = (0, 255, 0)
                            elif zoom_act == 'ZOOM_OUT':
                                status_text = "ZOOM OUT [-] (THU NHO MAN HINH)"
                                status_color = (255, 165, 0)
                            else:
                                status_text = "ZOOM MODE // 3 NGON: DAY LEN [+] | KEO XUONG [-]"
                                status_color = (255, 215, 0)
                        elif posture == 'FLAT_PALM':
                            if pinch_engine.state == 'IDLE':
                                cursor_interpolator.deactivate()
                            scroll_engine.reset()
                            zoom_engine.reset()
                            palm_center_x = lms[9].x
                            swipe_evt = swipe_engine.update(True, palm_center_x, now)

                            # HoloMat Radial Menu: Giu nguyen long ban tay 0.35s de bung Radial Menu
                            mcx, mcy = int(lms[9].x * w), int(lms[9].y * h)
                            if swipe_evt is None:
                                if radial_hold_start == 0.0:
                                    radial_hold_start = now
                                if (now - radial_hold_start) > 0.35:
                                    radial_menu_active = True
                                    # Tinh huong nghieng cua ban tay tu co tay (LM 0) toi MCP (LM 9)
                                    tilt_dx = lms[9].x - lms[0].x
                                    tilt_dy = -(lms[9].y - lms[0].y) # Oy huong xuong
                                    ang = math.degrees(math.atan2(tilt_dy, tilt_dx))
                                    if 45 <= ang <= 135:
                                        cur_sel = 0 # TOP: Hoi Jarvis
                                    elif -45 <= ang < 45:
                                        cur_sel = 1 # RIGHT: Thuoc do 3D
                                    elif -135 <= ang < -45:
                                        cur_sel = 2 # BOTTOM: Goi Jarvis
                                    else:
                                        cur_sel = 3 # LEFT: Reset khung

                                    if cur_sel != radial_sel_idx:
                                        radial_sel_idx = cur_sel
                                        radial_sel_start = now

                                    hold_prog = min(1.0, (now - radial_sel_start) / 0.55)
                                    draw_radial_ironman_menu(frame, mcx, mcy, radial_sel_idx, hold_prog)

                                    if hold_prog >= 1.0 and (now - radial_cooldown) > 1.2:
                                        radial_cooldown = now
                                        if radial_sel_idx == 0:
                                            safety_mgr.trigger_jarvis_snap()
                                            jarvis.speak("Analyzing screen.")
                                            status_text = "RADIAL: HOI JARVIS (SCREEN SNAP)!"
                                        elif radial_sel_idx == 1:
                                            caliper_mode = not caliper_mode
                                            jarvis.speak(f"Spatial caliper {'on' if caliper_mode else 'off'}.")
                                            status_text = f"RADIAL: THUOC DO 3D [{'BAT' if caliper_mode else 'TAT'}]"
                                        elif radial_sel_idx == 2:
                                            safety_mgr.trigger_jarvis_summon()
                                            jarvis.speak("Jarvis summoned.")
                                            status_text = "RADIAL: TOGGLE JARVIS DESKTOP!"
                                        elif radial_sel_idx == 3:
                                            reset_to_default_frame()
                                            status_text = "RADIAL: DA RESET GIAO DIEN CHUAN!"
                                        status_color = (0, 255, 0)
                            else:
                                radial_hold_start = 0.0
                                radial_menu_active = False
                            if swipe_evt == 'SWIPE_RIGHT':
                                if presentation_mode:
                                    safety_mgr.next_slide()
                                    status_text = "GAT PHAI -> SLIDE TIEP THEO"
                                elif tab_mode == "TAB":
                                    safety_mgr.next_tab()
                                    status_text = "GAT PHAI -> TAB TIEP THEO"
                                else:
                                    safety_mgr.step_alt_tab(direction=1)
                                    status_text = "GAT PHAI -> CUA SO TIEP (ALT+TAB)"
                                status_color = (0, 255, 0)
                            elif swipe_evt == 'SWIPE_LEFT':
                                if presentation_mode:
                                    safety_mgr.prev_slide()
                                    status_text = "GAT TRAI <- SLIDE TRUOC"
                                elif tab_mode == "TAB":
                                    safety_mgr.prev_tab()
                                    status_text = "GAT TRAI <- TAB TRUOC"
                                else:
                                    safety_mgr.step_alt_tab(direction=-1)
                                    status_text = "GAT TRAI <- CUA SO TRUOC (ALT+TAB)"
                                status_color = (0, 255, 0)
                            else:
                                status_text = f"TAY PHANG // GAT DE CHUYEN {'SLIDE' if presentation_mode else tab_mode}"
                                status_color = (0, 165, 255)
                        else:
                            scroll_engine.reset()
                            zoom_engine.reset()
                            swipe_engine.update(False, 0, now)
                            if safety_mgr.alt_tab_active:
                                safety_mgr.release_alt_tab()
                            if pointing_mode == "HYBRID_CLUTCH":
                                status_text = "CLUTCH LIFTED (NHAC CHUOT // DUA TAY VE GIUA BAN)"
                            else:
                                if pinch_engine.state == 'IDLE':
                                    cursor_interpolator.deactivate()
                                status_text = "TAY NGHI (REST)"
                            status_color = (180, 180, 180)

            else:
                if had_tracking:
                    reset_tracking()
                    had_tracking = False
                status_text = "KHONG THAY TAY // VUNG DIEU KHIEN TRONG"
                status_color = (100, 100, 100)
                calib_hold_start = 0.0

            dispatch_ts = time.perf_counter()
            latency_ms = (dispatch_ts - capture_ts) * 1000.0

            # 5. Render HUD Display
            mode_tag = "SLIDES" if presentation_mode else tab_mode
            cv2.putText(frame, f"STARK SUITE v9.7.3 PRO | {status_text}", (15, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, status_color, 2, cv2.LINE_AA)

            hud_line = (
                f"Pointing: {pointing_mode} ['H'] | Swipe: {mode_tag} ['T'] | "
                f"TV: {'ON' if tv_couch_mode else 'OFF'} ['V'] | Lat: {latency_ms:.1f}ms"
            )
            cv2.putText(frame, hud_line, (15, 54),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (0, 243, 255), 1, cv2.LINE_AA)

            caliper_tag = "BAT" if caliper_mode else "TAT"
            hud_voice = f"Hotkeys: ['R'] Reset Khung | ['K'] Thuoc Do [{caliper_tag}] | ['C'] Calib | ['H'] Mode | ['Q'] Quit"
            cv2.putText(frame, hud_voice, (15, 74),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.36, (0, 255, 128), 1, cv2.LINE_AA)

            # Nut bam truc tiep tren man hinh: [ < GIAO DIEN THUONG (R) ]
            btn_w = 210
            btn_h = 32
            btn_x1 = max(15, w - btn_w - 15)
            btn_y1 = 12
            btn_x2 = btn_x1 + btn_w
            btn_y2 = btn_y1 + btn_h
            btn_bounds["x1"] = btn_x1
            btn_bounds["y1"] = btn_y1
            btn_bounds["x2"] = btn_x2
            btn_bounds["y2"] = btn_y2

            is_calib = cz_cfg.get("calibrated", False)
            btn_border = (0, 165, 255) if is_calib else (0, 243, 255)
            btn_bg = (10, 45, 60) if is_calib else (25, 30, 35)

            cv2.rectangle(frame, (btn_x1, btn_y1), (btn_x2, btn_y2), btn_bg, -1)
            cv2.rectangle(frame, (btn_x1, btn_y1), (btn_x2, btn_y2), btn_border, 1, cv2.LINE_AA)
            cv2.putText(frame, "< GIAO DIEN THUONG [R]", (btn_x1 + 8, btn_y1 + 21),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.38, (0, 255, 255), 1, cv2.LINE_AA)

            cv2.imshow(window_name, frame)

            key = cv2.waitKey(1) & 0xFF
            if reset_button_clicked or key in (ord('r'), ord('R'), ord('b'), ord('B'), 8):
                reset_button_clicked = False
                reset_to_default_frame()
            elif key == ord('k') or key == ord('K'):
                caliper_mode = not caliper_mode
                jarvis.speak(f"Spatial caliper {'on' if caliper_mode else 'off'}")
            elif key == ord('q') or key == 27:
                jarvis.speak("Powering down.")
                break
            elif key == ord('d'):
                dwell_engine.enabled = not dwell_engine.enabled
                jarvis.speak(f"Dwell click {'enabled' if dwell_engine.enabled else 'disabled'}")
            elif key == ord('f'):
                is_full = cv2.getWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN) == cv2.WINDOW_FULLSCREEN
                if is_full:
                    cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_NORMAL)
                    cv2.resizeWindow(window_name, 960, 720)
                    jarvis.speak("Windowed camera")
                else:
                    cv2.setWindowProperty(window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
                    jarvis.speak("Fullscreen camera")
            elif key == ord('h'):
                pointing_mode = 'HYBRID_CLUTCH' if pointing_mode == 'ABSOLUTE' else 'ABSOLUTE'
                prev_clutch_x, prev_clutch_y = None, None
                clutch_x, clutch_y = screen_x, screen_y
                if filter_pixel_x is not None:
                    filter_pixel_x.reset(now, screen_x)
                    filter_pixel_y.reset(now, screen_y)
                jarvis.speak(f"Mode {pointing_mode.lower().replace('_', ' ')}")
            elif key == ord('m'):
                safety_mgr.mouse_enabled = not safety_mgr.mouse_enabled
                if not safety_mgr.mouse_enabled:
                    reset_tracking()
                st = "on" if safety_mgr.mouse_enabled else "off"
                jarvis.speak(f"Mouse {st}")
            elif key == ord('t'):
                tab_mode = "WINDOW" if tab_mode == "TAB" else "TAB"
                cfg["interactions"]["tab_mode"] = tab_mode
                jarvis.speak(f"Switching to {tab_mode.lower()} mode")
            elif key == ord('p'):
                presentation_mode = not presentation_mode
                jarvis.speak(f"Presentation mode {'on' if presentation_mode else 'off'}")
            elif key == ord('v'):
                tv_couch_mode = not tv_couch_mode
                jarvis.speak(f"TV couch mode {'active' if tv_couch_mode else 'disabled'}")
            elif key == ord('c'):
                reset_tracking()
                calib_mode = not calib_mode
                calib_step = 0
                calib_hold_start = 0.0
                jarvis.speak("Calibration mode. Hold top-left corner.")

            try:
                if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
                    break
            except Exception:
                break

    finally:
        if desktop_halo:
            try:
                desktop_halo.close()
            except Exception:
                pass
        print("\n[*] Giai phong phan cung an toan tuyet doi...")
        try:
            cursor_interpolator.stop()
        except Exception:
            pass
        if record_file:
            try:
                record_file.close()
            except Exception:
                pass
        voice_listener.stop()
        jarvis.stop()
        safety_mgr.cleanup()
        if 'detector' in locals() and detector is not None:
            try:
                detector.close()
            except Exception:
                pass
        cam.stop()
        cv2.destroyAllWindows()
        print("[+] He thong da dong sach se. Hoan tat an toan.")

if __name__ == "__main__":
    main()
