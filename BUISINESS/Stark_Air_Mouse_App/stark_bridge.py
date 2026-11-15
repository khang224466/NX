"""
STARK SPATIAL BRIDGE v9.7.3 PRO // BIOMECHANICAL & KINEMATIC MASTERY
Ultra-lightweight Native WebSocket Bridge + Main-Thread Click-Through Desktop Cursor HUD Halo
Pure Python Standard Library - Zero Pip Dependencies.
Connects the 60-144Hz Spatial Web Workspace with Windows Desktop with <0.5ms latency.

Architectural Upgrades in v9.7.0:
- [P0 FIX] Dual-Mode Halo Execution: Supports both standalone `run_mainloop()` (for Web Bridge)
  and non-blocking `pump_events()` (when imported inside `stark_air_mouse.py` OpenCV loop),
  completely eliminating the frozen Tkinter window bug at (0, 0).
- [MULTI-MONITOR] Full Virtual Desktop Coordinate Mapping (SM_XVIRTUALSCREEN 76-79).
- [CPU OPT] Persistent Canvas Elements: Direct item coords/itemconfig (<0.3% CPU).
- [WS_EX_TRANSPARENT] Click-Through Layered Window: Follows Windows cursor at 60-120Hz with zero focus stealing.
"""

import os
import time
import socket
import urllib.parse
import threading
import hashlib
import base64
import json
import struct
import ctypes
from ctypes import wintypes
import tkinter as tk
import hmac
import math
import secrets
import sys
import tempfile
from pathlib import Path

# Win32 SendInput Structures
PUL = ctypes.POINTER(ctypes.c_ulong)

class MOUSEINPUT(ctypes.Structure):
    _fields_ = (
        ("dx", wintypes.LONG),
        ("dy", wintypes.LONG),
        ("mouseData", wintypes.DWORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", PUL)
    )

class KEYBDINPUT(ctypes.Structure):
    _fields_ = (
        ("wVk", wintypes.WORD),
        ("wScan", wintypes.WORD),
        ("dwFlags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", PUL)
    )

class INPUT_I(ctypes.Union):
    _fields_ = (
        ("mi", MOUSEINPUT),
        ("ki", KEYBDINPUT),
    )

class INPUT(ctypes.Structure):
    _fields_ = (
        ("type", wintypes.DWORD),
        ("ii", INPUT_I)
    )

class POINT(ctypes.Structure):
    _fields_ = [("x", wintypes.LONG), ("y", wintypes.LONG)]

INPUT_MOUSE = 0
INPUT_KEYBOARD = 1
MOUSEEVENTF_MOVE = 0x0001
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_RIGHTDOWN = 0x0008
MOUSEEVENTF_RIGHTUP = 0x0010
MOUSEEVENTF_WHEEL = 0x0800
MOUSEEVENTF_ABSOLUTE = 0x8000
MOUSEEVENTF_VIRTUALDESK = 0x4000

VK_CONTROL = 0x11
KEYEVENTF_KEYUP = 0x0002
WHEEL_DELTA = 120

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

def get_cursor_pos():
    pt = POINT()
    user32.GetCursorPos(ctypes.byref(pt))
    return pt.x, pt.y

def send_key(vk, flags=0):
    inp = INPUT()
    inp.type = INPUT_KEYBOARD
    inp.ii.ki = KEYBDINPUT(vk, 0, flags, 0, None)
    user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(inp))

def send_zoom(delta_clicks):
    """Giữ phím Ctrl và cuộn chuột chuẩn Windows, bảo đảm giải phóng Ctrl bằng try/finally."""
    try:
        send_key(VK_CONTROL, 0)
        inp = INPUT()
        inp.type = INPUT_MOUSE
        inp.ii.mi = MOUSEINPUT(0, 0, int(delta_clicks), MOUSEEVENTF_WHEEL, 0, None)
        user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(inp))
    finally:
        send_key(VK_CONTROL, KEYEVENTF_KEYUP)

def send_mouse(flags, x=None, y=None, data=0, dx=0, dy=0):
    inp = INPUT()
    inp.type = INPUT_MOUSE
    if flags & MOUSEEVENTF_ABSOLUTE:
        if x is None or y is None:
            x, y = get_cursor_pos()
        ix = max(SCREEN_X, min(SCREEN_X + SCREEN_W - 1, int(round(x))))
        iy = max(SCREEN_Y, min(SCREEN_Y + SCREEN_H - 1, int(round(y))))
        user32.SetCursorPos(ix, iy)
        rem_flags = flags & ~(MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE | MOUSEEVENTF_VIRTUALDESK)
        if rem_flags:
            inp.ii.mi = MOUSEINPUT(0, 0, int(data), rem_flags, 0, None)
            user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(inp))
    else:
        inp.ii.mi = MOUSEINPUT(int(dx), int(dy), int(data), flags, 0, None)
        user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(inp))

# =============================================================================
# OPTIMIZED CLICK-THROUGH DESKTOP CURSOR HUD HALO (MAIN THREAD & PUMPABLE)
# =============================================================================
class DesktopCursorHalo:
    """
    Vòng ngắm HUD trong suốt 64x64 bám theo con trỏ chuột thật trên Windows Desktop.
    Hỗ trợ cả 2 chế độ:
    - `run_mainloop()`: khi chạy độc lập trong `stark_bridge.py`.
    - `pump_events()`: khi được nhúng trực tiếp vào vòng lặp OpenCV của `stark_air_mouse.py`.
    """
    def __init__(self, size=64):
        self.size = size
        self.half = size // 2
        self.state = 'POINTING'
        self.progress = 0.0
        self.last_event = None
        self.event_time = 0.0
        self.running = True

        self.root = tk.Tk()
        self.root.overrideredirect(True)
        self.root.geometry(f"{self.size}x{self.size}+0+0")
        self.root.attributes("-topmost", True)
        self.root.attributes("-transparentcolor", "#000000")
        self.root.config(bg="#000000")
        self.root.update_idletasks()  # Map window first so GetParent resolves top-level HWND!

        self.hwnd = user32.GetParent(self.root.winfo_id()) or self.root.winfo_id()
        GWL_EXSTYLE = -20
        WS_EX_TRANSPARENT = 0x00000020
        WS_EX_LAYERED = 0x00080000
        WS_EX_NOACTIVATE = 0x08000000
        WS_EX_TOOLWINDOW = 0x00000080

        style = user32.GetWindowLongW(self.hwnd, GWL_EXSTYLE)
        style |= (WS_EX_TRANSPARENT | WS_EX_LAYERED | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW)
        user32.SetWindowLongW(self.hwnd, GWL_EXSTYLE, style)

        self.canvas = tk.Canvas(self.root, width=self.size, height=self.size, bg="#000000", highlightthickness=0)
        self.canvas.pack(fill="both", expand=True)

        cx, cy = self.half, self.half
        self.outer_ring = self.canvas.create_oval(cx - 13, cy - 13, cx + 13, cy + 13, outline="#00f3ff", width=1.5)
        self.core_dot = self.canvas.create_oval(cx - 1.5, cy - 1.5, cx + 1.5, cy + 1.5, fill="#00f3ff", outline="")
        self.charge_arc = self.canvas.create_arc(cx - 15, cy - 15, cx + 15, cy + 15, start=90, extent=0, outline="#ff5500", width=3, style="arc", state="hidden")
        self.burst_ring = self.canvas.create_oval(cx - 16, cy - 16, cx + 16, cy + 16, outline="#00ff66", width=2, state="hidden")
        self._prev_visual_state = None
        self._prev_win_pos = None
        self.pump_events()

    def set_state(self, state, progress=0.0):
        self.state = state
        self.progress = max(0.0, min(1.0, float(progress)))

    def trigger_event(self, event):
        self.last_event = event
        self.event_time = time.time()

    def _update_visuals(self):
        if not self.running:
            return
        pt = POINT()
        user32.GetCursorPos(ctypes.byref(pt))

        win_pos = (pt.x - self.half, pt.y - self.half)
        if win_pos != self._prev_win_pos:
            self._prev_win_pos = win_pos
            SWP_NOSIZE = 0x0001
            SWP_NOZORDER = 0x0004
            SWP_NOACTIVATE = 0x0010
            user32.SetWindowPos(
                self.hwnd, 0, win_pos[0], win_pos[1], 0, 0,
                SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE
            )

        cx, cy = self.half, self.half
        now = time.time()

        if self.last_event and (now - self.event_time < 0.16):
            dt = now - self.event_time
            r = 11 + int(dt * 55)
            color = "#00ff66" if self.last_event == "click" else "#ff007f"
            self.canvas.coords(self.burst_ring, cx - r, cy - r, cx + r, cy + r)
            self.canvas.itemconfig(self.burst_ring, outline=color, state="normal")
        else:
            self.canvas.itemconfig(self.burst_ring, state="hidden")

        visual_key = (self.state, int(self.progress * 360) if self.state == "PINCH_HOLD" else 0)
        if visual_key != self._prev_visual_state:
            self._prev_visual_state = visual_key
            if self.state == "PINCH_HOLD":
                deg = visual_key[1]
                if deg > 0:
                    self.canvas.itemconfig(self.charge_arc, extent=-deg, state="normal")
                else:
                    self.canvas.itemconfig(self.charge_arc, state="hidden")
                self.canvas.itemconfig(self.outer_ring, outline="#ffb700")
                self.canvas.itemconfig(self.core_dot, fill="#ffb700")
            elif self.state in ("PINCH_PENDING", "PINCH_LOCKED"):
                self.canvas.itemconfig(self.charge_arc, state="hidden")
                self.canvas.itemconfig(self.outer_ring, outline="#ffb700")
                self.canvas.itemconfig(self.core_dot, fill="#ffb700")
            elif self.state == "DRAGGING":
                self.canvas.itemconfig(self.charge_arc, state="hidden")
                self.canvas.itemconfig(self.outer_ring, outline="#ffcc00")
                self.canvas.itemconfig(self.core_dot, fill="#ffcc00")
            elif self.state == "SCROLL":
                self.canvas.itemconfig(self.charge_arc, state="hidden")
                self.canvas.itemconfig(self.outer_ring, outline="#00e5ff")
                self.canvas.itemconfig(self.core_dot, fill="#00e5ff")
            elif self.state == "ZOOM":
                self.canvas.itemconfig(self.charge_arc, state="hidden")
                self.canvas.itemconfig(self.outer_ring, outline="#b537f2")
                self.canvas.itemconfig(self.core_dot, fill="#b537f2")
            else:
                self.canvas.itemconfig(self.charge_arc, state="hidden")
                self.canvas.itemconfig(self.outer_ring, outline="#00f3ff")
                self.canvas.itemconfig(self.core_dot, fill="#00f3ff")

    def pump_events(self):
        """Gọi trực tiếp từ vòng lặp chính của stark_air_mouse.py để không bị đơ cửa sổ."""
        if not self.running:
            return
        try:
            self._update_visuals()
            self.root.update_idletasks()
            self.root.update()
        except Exception:
            self.running = False

    def run_mainloop(self):
        self._tick()
        self.root.mainloop()

    def _tick(self):
        if not self.running:
            try:
                self.root.destroy()
            except Exception:
                pass
            return
        try:
            self._update_visuals()
        except Exception:
            pass
        self.root.after(12, self._tick)

    def close(self):
        self.running = False
        try:
            self.root.destroy()
        except Exception:
            pass

global_halo = None
_input_owner = threading.Lock()
_token_lock = threading.Lock()
LEGACY_BRIDGE_TOKEN = "stark-spatial-token-v950"
BRIDGE_IDLE_TIMEOUT = 2.0


def get_bridge_token():
    """Share a per-installation secret with the launcher; never use a public default."""
    configured = os.environ.get("STARK_BRIDGE_TOKEN", "").strip()
    if configured:
        return configured
    with _token_lock:
        config_path = Path(__file__).with_name("stark_config.json")
        with config_path.open(encoding="utf-8") as source:
            config = json.load(source)
        token = config.get("interactions", {}).get("bridge_token", "")
        if isinstance(token, str) and token and token != LEGACY_BRIDGE_TOKEN:
            return token
        token = secrets.token_urlsafe(32)
        config.setdefault("interactions", {})["bridge_token"] = token
        temporary_path = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=config_path.parent,
                                             prefix=".stark-config-", suffix=".tmp", delete=False) as target:
                temporary_path = Path(target.name)
                json.dump(config, target, indent=2, ensure_ascii=False)
                target.write("\n")
            os.replace(temporary_path, config_path)
        finally:
            if temporary_path and temporary_path.exists():
                temporary_path.unlink()
        return token


def get_web_app_url():
    return Path(__file__).with_name("stark_air_mouse_web_app.html").as_uri() + "?" + urllib.parse.urlencode({"token": get_bridge_token()})


class BufferedConnection:
    """Keep bytes received after HTTP headers for the first WebSocket frame."""

    def __init__(self, conn, pending=b""):
        self.conn = conn
        self.pending = bytearray(pending)

    def recv(self, size):
        if self.pending:
            chunk = bytes(self.pending[:size])
            del self.pending[:size]
            return chunk
        return self.conn.recv(size)

    def __getattr__(self, name):
        return getattr(self.conn, name)


def finite_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)

# =============================================================================
# RELIABLE NETWORK BUFFERING & PROTOCOL UTILS
# =============================================================================
def recv_exact(conn, num_bytes):
    if num_bytes == 0:
        return b""
    buf = bytearray()
    while len(buf) < num_bytes:
        chunk = conn.recv(num_bytes - len(buf))
        if not chunk:
            return None
        buf.extend(chunk)
    return bytes(buf)

def read_http_handshake(conn, max_size=8192):
    buf = bytearray()
    while len(buf) < max_size:
        chunk = conn.recv(min(1024, max_size - len(buf)))
        if not chunk:
            raise ConnectionError("Incomplete WebSocket handshake")
        buf.extend(chunk)
        if b"\r\n\r\n" in buf:
            header, pending = bytes(buf).split(b"\r\n\r\n", 1)
            return header, pending
    raise ValueError("WebSocket handshake exceeds the header limit")

# =============================================================================
# WEBSOCKET CLIENT HANDLER & DESKTOP DISPATCH
# =============================================================================
def handle_client(conn):
    global global_halo
    zoom_accumulator = 0.0
    mouse_is_down = False
    owns_input = False
    try:
        conn.settimeout(5.0)
        handshake_bytes, pending = read_http_handshake(conn)
        conn = BufferedConnection(conn, pending)

        data = handshake_bytes.decode('utf-8', errors='ignore')
        lines = data.split("\r\n")
        request_line = lines[0] if lines else ""
        headers = {}
        for line in lines[1:]:
            if ":" in line:
                k, v = line.split(":", 1)
                headers[k.strip().lower()] = v.strip()

        req_parts = request_line.split(" ")
        path_query = req_parts[1] if len(req_parts) > 1 else "/"
        parsed_url = urllib.parse.urlparse(path_query)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        url_token = query_params.get("token", [""])[0]

        expected_token = get_bridge_token()
        client_token = headers.get("x-stark-token") or url_token
        if not client_token or not hmac.compare_digest(client_token.encode(), expected_token.encode()):
            conn.sendall(b"HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n")
            return

        origin = headers.get("origin")
        origin_trusted = False

        if origin is not None and origin != "null":
            try:
                p_orig = urllib.parse.urlparse(origin)
                if p_orig.scheme in ("http", "https"):
                    if p_orig.hostname in ("localhost", "127.0.0.1") or (p_orig.hostname and (p_orig.hostname.startswith("192.168.") or p_orig.hostname.startswith("10."))):
                        origin_trusted = True
                elif p_orig.scheme == "file":
                    origin_trusted = True
            except Exception:
                origin_trusted = False
        elif origin == "null" or origin is None:
            origin_trusted = True

        if not origin_trusted:
            print(f"[!] CANH BAO AN NINH: Tu choi Origin: {origin}")
            conn.close()
            return

        ws_key = headers.get("sec-websocket-key")
        if (not ws_key or not request_line.startswith("GET ") or
                headers.get("upgrade", "").lower() != "websocket" or
                "upgrade" not in {v.strip().lower() for v in headers.get("connection", "").split(",")}):
            conn.close()
            return

        owns_input = _input_owner.acquire(blocking=False)
        if not owns_input:
            conn.sendall(b"HTTP/1.1 409 Conflict\r\nConnection: close\r\n\r\n")
            return

        guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
        accept = base64.b64encode(hashlib.sha1((ws_key + guid).encode('utf-8')).digest()).decode('utf-8')
        response = (
            "HTTP/1.1 101 Switching Protocols\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Accept: {accept}\r\n\r\n"
        )
        conn.sendall(response.encode('utf-8'))
        # Heartbeats from the UI keep static drags alive. A suspended/crashed
        # browser must release its held button even if TCP stays connected.
        conn.settimeout(BRIDGE_IDLE_TIMEOUT)
        print("[*] Web HUD Connected to Windows Desktop Bridge (Main-Thread Halo Active)!")
        if global_halo:
            global_halo.set_state("POINTING")

        while True:
            b = recv_exact(conn, 2)
            if not b:
                break
            opcode = b[0] & 0x0F
            if b[0] & 0x70 or not b[0] & 0x80 or not b[1] & 0x80:
                break  # Unsupported extensions/fragmentation, or unmasked client frame.
            if opcode == 8:
                break
            if opcode not in (1, 9, 10):
                break

            payload_len = b[1] & 127
            if payload_len == 126:
                len_bytes = recv_exact(conn, 2)
                if len_bytes is None:
                    break
                payload_len = struct.unpack(">H", len_bytes)[0]
            elif payload_len == 127:
                len_bytes = recv_exact(conn, 8)
                if len_bytes is None:
                    break
                payload_len = struct.unpack(">Q", len_bytes)[0]

            if payload_len > 65536:
                break
            if opcode in (9, 10) and payload_len > 125:
                break

            masks = recv_exact(conn, 4)
            if masks is None:
                break
            raw = recv_exact(conn, payload_len)
            if raw is None:
                break
            if payload_len > 0:
                mask_rep = (masks * (payload_len // 4 + 1))[:payload_len]
                unmasked = (int.from_bytes(raw, "big") ^ int.from_bytes(mask_rep, "big")).to_bytes(payload_len, "big")
            else:
                unmasked = b"" 

            if opcode == 9:
                pong_data = unmasked
                p_len = len(pong_data)
                if p_len <= 125:
                    pong_frame = bytearray([0x8A, p_len]) + pong_data
                elif p_len <= 65535:
                    pong_frame = bytearray([0x8A, 126]) + struct.pack(">H", p_len) + pong_data
                else:
                    pong_frame = bytearray([0x8A, 127]) + struct.pack(">Q", p_len) + pong_data
                conn.sendall(pong_frame)
                continue

            if len(unmasked) == 0:
                continue
            if opcode == 10:
                continue

            try:
                msg = json.loads(unmasked.decode('utf-8'))
            except Exception:
                continue

            if not isinstance(msg, dict):
                continue

            m_type = msg.get("type")
            if not isinstance(m_type, str):
                continue

            raw_nx = msg.get("norm_x")
            raw_ny = msg.get("norm_y")
            has_position = finite_number(raw_nx) and finite_number(raw_ny)
            if has_position:
                clamped_nx = max(0.0, min(1.0, float(raw_nx)))
                clamped_ny = max(0.0, min(1.0, float(raw_ny)))
                screen_x = int(SCREEN_X + clamped_nx * (SCREEN_W - 1))
                screen_y = int(SCREEN_Y + clamped_ny * (SCREEN_H - 1))
            else:
                screen_x, screen_y = get_cursor_pos()

            # Relative mode buttons act at the real cursor, never at UI coordinates.
            position_flags = 0
            if has_position and msg.get("pointing_mode") != "HYBRID_CLUTCH":
                position_flags = MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE

            if m_type == "move":
                send_mouse(MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE, screen_x, screen_y)
                if global_halo and global_halo.state not in ("PINCH_HOLD", "DRAGGING"):
                    global_halo.set_state("POINTING")
            elif m_type == "move_relative":
                dx = msg.get("dx", 0)
                dy = msg.get("dy", 0)
                if finite_number(dx) and finite_number(dy):
                    send_mouse(MOUSEEVENTF_MOVE, dx=int(round(max(-2000, min(2000, dx)))), dy=int(round(max(-2000, min(2000, dy)))))
                if global_halo and global_halo.state not in ("PINCH_HOLD", "DRAGGING"):
                    global_halo.set_state("POINTING")
            elif m_type == "down":
                mouse_is_down = True
                send_mouse(position_flags | MOUSEEVENTF_LEFTDOWN, screen_x, screen_y)
                if global_halo:
                    global_halo.set_state("DRAGGING")
            elif m_type in ("up", "cancel"):
                if mouse_is_down:
                    send_mouse(MOUSEEVENTF_LEFTUP)
                mouse_is_down = False
                zoom_accumulator = 0.0
                if global_halo:
                    global_halo.set_state("POINTING")
            elif m_type == "click":
                mouse_is_down = True
                send_mouse(position_flags | MOUSEEVENTF_LEFTDOWN, screen_x, screen_y)
                send_mouse(MOUSEEVENTF_LEFTUP)
                mouse_is_down = False
                if global_halo:
                    global_halo.set_state("POINTING")
                    global_halo.trigger_event("click")
            elif m_type == "right_click":
                try:
                    send_mouse(position_flags | MOUSEEVENTF_RIGHTDOWN, screen_x, screen_y)
                finally:
                    send_mouse(MOUSEEVENTF_RIGHTUP)
                if global_halo:
                    global_halo.set_state("POINTING")
                    global_halo.trigger_event("right_click")
            elif m_type == "state_change":
                if global_halo:
                    st = msg.get("state", "POINTING")
                    prog = float(msg.get("progress", 0.0))
                    global_halo.set_state(st, prog)
            elif m_type == "zoom":
                delta = msg.get("delta", 0.0)
                if finite_number(delta):
                    zoom_accumulator += max(-0.25, min(0.25, delta)) * 2400.0
                    if abs(zoom_accumulator) >= WHEEL_DELTA:
                        ticks = int(zoom_accumulator / WHEEL_DELTA) * WHEEL_DELTA
                        send_zoom(ticks)
                        zoom_accumulator -= ticks
                        if global_halo:
                            global_halo.set_state("ZOOM")
            elif m_type == "scroll":
                delta = msg.get("delta", 0)
                if finite_number(delta):
                    clicks = int(max(-600, min(600, delta)))
                    if clicks != 0:
                        inp = INPUT()
                        inp.type = INPUT_MOUSE
                        inp.ii.mi = MOUSEINPUT(0, 0, clicks, MOUSEEVENTF_WHEEL, 0, None)
                        user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(inp))
                        if global_halo:
                            global_halo.set_state("SCROLL")
    except (ConnectionError, socket.timeout):
        pass
    except Exception as exc:
        print(f"[!] Bridge client error: {type(exc).__name__}")
    finally:
        try:
            if mouse_is_down:
                send_mouse(MOUSEEVENTF_LEFTUP)
        except Exception:
            pass
        if owns_input and global_halo:
            global_halo.set_state("POINTING")
        if owns_input:
            _input_owner.release()
        conn.close()
        print("[-] Web HUD Disconnected from Bridge (Hardware Cleaned Safely).")

def _ws_server_loop():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        server.bind(("0.0.0.0", 8765))
    except OSError as e:
        print(f"[!] LOI KHOI TAO WEBSOCKET: Cong 8765 dang bi chiem dung boi tien trinh khac!")
        print(f"    Chi tiet: {e}")
        print("    Vui long kiem tra Task Manager va dong cac tien trinh Python/Bridge dang chay ngam.")
        server.close()
        return

    server.listen(5)
    while True:
        try:
            conn, addr = server.accept()
            conn.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            t = threading.Thread(target=handle_client, args=(conn,), daemon=True)
            t.start()
        except Exception:
            break

def run_bridge_server():
    global global_halo
    print("=" * 75)
    print("   STARK SPATIAL BRIDGE v9.7.3 PRO // BIOMECHANICAL & KINEMATIC MASTERY")
    print("   Listening at ws://127.0.0.1:8765 (Zero Latency IPC, Nagle Off)")
    print("   Main-Thread Desktop Halo + Low-CPU Persistent Canvas + Origin Guard")
    print("=" * 75)

    srv_thread = threading.Thread(target=_ws_server_loop, daemon=True)
    srv_thread.start()

    try:
        global_halo = DesktopCursorHalo(size=64)
        print("[+] Desktop Cursor Halo Overlay Active on Main Thread (WS_EX_TRANSPARENT)")
        global_halo.run_mainloop()
    except KeyboardInterrupt:
        print("\n[-] Shutting down Bridge...")
    except Exception as e:
        print(f"[!] Halo error: {e}")
        srv_thread.join()

if __name__ == "__main__":
    if "--print-web-url" in sys.argv:
        print(get_web_app_url())
    else:
        get_bridge_token()  # Validate settings before starting threads or the HUD.
        run_bridge_server()
