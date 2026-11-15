"""Regression tests with simulated Windows input; never move the real cursor.

Run: python -B -m unittest -v test_input_regressions
"""
import ast
import ctypes
import io
import itertools
import json
import os
from pathlib import Path
import socket
import struct
import tempfile
import types
import unittest
from contextlib import ExitStack, redirect_stdout
from unittest.mock import Mock, patch


class FakeWin32:
    def __init__(self):
        self.position = (960, 540)
        self.events = []

    def __getattr__(self, name):
        def call(*args):
            if name == "GetSystemMetrics":
                return {0: 1920, 1: 1080, 76: 0, 77: 0, 78: 1920, 79: 1080}.get(args[0], 0)
            if name == "GetCursorPos":
                args[0]._obj.x, args[0]._obj.y = self.position
            elif name == "SetCursorPos":
                self.position = args[:2]
                self.events.append(("move", self.position))
            elif name == "SendInput":
                self.events.append(("input", self.position))
            return 1
        return call


fake_win32 = FakeWin32()
with patch.object(ctypes.windll, "user32", fake_win32), patch.object(ctypes.windll, "winmm", FakeWin32()):
    import stark_air_mouse as native
    import stark_bridge as bridge


class FakeConnection:
    def __init__(self, chunks, timeout_at_end=False):
        self.chunks = list(chunks)
        self.sent = b""
        self.closed = False
        self.timeout_at_end = timeout_at_end
        self.timeouts = []

    def recv(self, size):
        if not self.chunks:
            if self.timeout_at_end:
                raise socket.timeout()
            return b""
        chunk = self.chunks.pop(0)
        if len(chunk) > size:
            self.chunks.insert(0, chunk[size:])
        return chunk[:size]

    def sendall(self, payload):
        self.sent += payload

    def settimeout(self, timeout):
        self.timeouts.append(timeout)

    def close(self):
        self.closed = True


def handshake(token="test-secret", origin="null"):
    return (
        f"GET /?token={token} HTTP/1.1\r\nHost: 127.0.0.1:8765\r\n"
        f"Origin: {origin}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n"
        "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n\r\n"
    ).encode()


def frame(message, opcode=1):
    payload = json.dumps(message).encode() if not isinstance(message, bytes) else message
    header = bytes([0x80 | opcode])
    if len(payload) < 126:
        header += bytes([0x80 | len(payload)])
    else:
        header += bytes([0x80 | 126]) + struct.pack(">H", len(payload))
    mask = b"abcd"
    return header + mask + bytes(c ^ mask[i % 4] for i, c in enumerate(payload))


class BridgeRegressionTests(unittest.TestCase):
    def setUp(self):
        self.token_patch = patch.object(bridge, "get_bridge_token", return_value="test-secret")
        self.token_patch.start()
        self.addCleanup(self.token_patch.stop)

    def dispatch(self, conn):
        events = []
        with patch.object(bridge, "send_mouse", side_effect=lambda *a, **kw: events.append((a, kw))), redirect_stdout(io.StringIO()):
            bridge.handle_client(conn)
        self.assertTrue(conn.closed)
        return events

    def test_every_origin_requires_correct_token(self):
        for origin in ("null", "http://localhost:9999", "http://127.0.0.1", "file://"):
            for token in ("", "wrong"):
                with self.subTest(origin=origin, token=token):
                    conn = FakeConnection([handshake(token, origin)])
                    self.assertEqual(self.dispatch(conn), [])
                    self.assertTrue(conn.sent.startswith(b"HTTP/1.1 403"))

    def test_valid_secret_and_local_origins_are_accepted(self):
        for origin in ("null", "http://localhost:8443", "file://"):
            conn = FakeConnection([handshake(origin=origin)])
            self.dispatch(conn)
            self.assertTrue(conn.sent.startswith(b"HTTP/1.1 101"))

    def test_external_origin_is_rejected_even_with_secret(self):
        conn = FakeConnection([handshake(origin="https://example.com")])
        self.assertEqual(self.dispatch(conn), [])
        self.assertFalse(conn.sent.startswith(b"HTTP/1.1 101"))

    def test_coalesced_handshake_keeps_first_click_frame(self):
        conn = FakeConnection([handshake() + frame({"type": "click"})])
        events = self.dispatch(conn)
        self.assertEqual([event[0][0] for event in events], [bridge.MOUSEEVENTF_LEFTDOWN, bridge.MOUSEEVENTF_LEFTUP])

    def test_tcp_byte_splits_do_not_lose_frames(self):
        payload = handshake() + frame({"type": "click", "norm_x": .25, "norm_y": .75})
        conn = FakeConnection([bytes([byte]) for byte in payload])
        events = self.dispatch(conn)
        self.assertEqual(len(events), 2)
        self.assertEqual(events[0][0][1:3], (479, 809))

    def test_relative_buttons_never_reposition_desktop_cursor(self):
        for kind, button in (("down", bridge.MOUSEEVENTF_LEFTDOWN), ("click", bridge.MOUSEEVENTF_LEFTDOWN), ("right_click", bridge.MOUSEEVENTF_RIGHTDOWN)):
            conn = FakeConnection([handshake(), frame({"type": kind, "pointing_mode": "HYBRID_CLUTCH", "norm_x": .1, "norm_y": .9})])
            events = self.dispatch(conn)
            self.assertEqual(events[0][0][0], button)
            self.assertTrue(all(not (args[0] & bridge.MOUSEEVENTF_ABSOLUTE) for args, _ in events))

    def test_absolute_down_maps_position_and_release_does_not_move(self):
        conn = FakeConnection([handshake(), frame({"type": "down", "norm_x": 0, "norm_y": 1}), frame({"type": "up", "norm_x": 1, "norm_y": 0})])
        events = self.dispatch(conn)
        self.assertEqual(events[0][0], (bridge.MOUSEEVENTF_MOVE | bridge.MOUSEEVENTF_ABSOLUTE | bridge.MOUSEEVENTF_LEFTDOWN, 0, 1079))
        self.assertEqual(events[1][0], (bridge.MOUSEEVENTF_LEFTUP,))

    def test_cancel_and_idle_timeout_release_drag(self):
        for ending in ("cancel", "timeout", "disconnect"):
            with self.subTest(ending=ending):
                chunks = [handshake(), frame({"type": "down"})]
                if ending == "cancel":
                    chunks += [frame({"type": "cancel"}), frame({"type": "heartbeat"})]
                conn = FakeConnection(chunks, timeout_at_end=ending == "timeout")
                events = self.dispatch(conn)
                self.assertEqual([args[0] for args, _ in events], [bridge.MOUSEEVENTF_LEFTDOWN, bridge.MOUSEEVENTF_LEFTUP])
                self.assertIn(bridge.BRIDGE_IDLE_TIMEOUT, conn.timeouts)

    def test_one_client_owns_input_at_a_time(self):
        with bridge._input_owner:
            conn = FakeConnection([handshake(), frame({"type": "click"})])
            self.assertEqual(self.dispatch(conn), [])
            self.assertTrue(conn.sent.startswith(b"HTTP/1.1 409"))

    def test_nonfinite_relative_input_is_ignored(self):
        for value in (float("nan"), float("inf"), True):
            conn = FakeConnection([handshake(), frame({"type": "move_relative", "dx": value, "dy": 1})])
            self.assertEqual(self.dispatch(conn), [])

    def test_ping_is_answered_without_mouse_input(self):
        conn = FakeConnection([handshake() + frame(b"ping", opcode=9)])
        self.assertEqual(self.dispatch(conn), [])
        self.assertTrue(conn.sent.endswith(b"\x8a\x04ping"))

    def test_incomplete_headers_cannot_upgrade(self):
        conn = FakeConnection([b"GET / HTTP/1.1\r\n"])
        self.assertEqual(self.dispatch(conn), [])
        self.assertEqual(conn.sent, b"")


class NativeRegressionTests(unittest.TestCase):
    def setUp(self):
        fake_win32.events.clear()
        fake_win32.position = (960, 540)

    def interpolator(self):
        # Pausing the worker models the scheduling gap that caused wrong clicks.
        with patch.object(native.threading, "Thread"), patch.object(ctypes.windll, "winmm", FakeWin32()):
            cursor = native.AsyncCursorInterpolator()
        self.addCleanup(lambda: self.stop_cursor(cursor))
        return cursor

    @staticmethod
    def stop_cursor(cursor):
        with patch.object(ctypes.windll, "winmm", FakeWin32()):
            cursor.stop()

    def test_snap_is_applied_before_click_without_worker_tick(self):
        cursor = self.interpolator()
        safety = native.WinInputManager()
        cursor.snap_to(100, 200)
        safety.click_left()
        self.assertEqual(fake_win32.events, [("move", (100, 200)), ("input", (100, 200))])

    def test_pinch_release_clicks_at_rollback_position(self):
        cursor = self.interpolator()
        safety = native.WinInputManager()
        pinch = native.PinchDragEngine()
        pinch.update(.1, 0, 0, 100, 200, 1.0, safety, cursor)
        pinch.update(.01, 0, 0, 400, 500, 1.15, safety, cursor)
        _, feedback = pinch.update(.1, 0, 0, 450, 550, 1.25, safety, cursor)
        self.assertEqual(feedback, "CLICK")
        self.assertEqual(fake_win32.events[-1], ("input", (100, 200)))

    def test_reset_discards_old_pinch_history_and_releases_drag(self):
        pinch = native.PinchDragEngine()
        safety = native.WinInputManager()
        safety.is_left_down = True
        pinch.state = "DRAGGING"
        pinch.cursor_history.append((1, 123, 456))
        pinch.reset(safety)
        self.assertFalse(safety.is_left_down)
        self.assertEqual(pinch.state, "IDLE")
        self.assertFalse(pinch.cursor_history)

    def test_watchdog_fires_once_and_rearms_on_fresh_frame(self):
        resets = []
        watchdog = native.TrackingWatchdog(lambda: resets.append(True), now=10)
        self.assertFalse(watchdog.check(10.1))
        self.assertTrue(watchdog.check(10.4))
        self.assertFalse(watchdog.check(20))
        watchdog.frame_received(21)
        self.assertTrue(watchdog.check(21.4))
        self.assertEqual(len(resets), 2)

    def test_actual_missing_frame_branch_runs_the_watchdog(self):
        safety = native.WinInputManager()
        safety.is_left_down = True
        cursor = types.SimpleNamespace(active=True)
        def reset():
            safety.cleanup()
            cursor.active = False
        watchdog = native.TrackingWatchdog(reset, now=0)
        tree = ast.parse(Path(native.__file__).read_text(encoding="utf-8"))
        branch = next(n for n in ast.walk(tree) if isinstance(n, ast.If) and ast.unparse(n.test) == "not has_new or frame is None")
        loop = ast.For(target=ast.Name(id="_i", ctx=ast.Store()), iter=ast.List(elts=[ast.Constant(0)], ctx=ast.Load()), body=[branch], orelse=[])
        code = compile(ast.fix_missing_locations(ast.Module(body=[loop], type_ignores=[])), "<camera missing frame>", "exec")
        exec(code, dict(has_new=False, frame=None, tracking_watchdog=watchdog, time=types.SimpleNamespace(perf_counter=lambda: 1), cv2=types.SimpleNamespace(waitKey=lambda _: 0), reset_button_clicked=False))
        self.assertFalse(safety.is_left_down)
        self.assertFalse(cursor.active)

    def test_dwell_reset_requires_a_fresh_dwell_interval(self):
        clicks = []
        safety = types.SimpleNamespace(click_left=lambda: clicks.append(True))
        dwell = native.DwellClickEngine(enabled=True)
        dwell.update(100, 200, 1, safety)
        dwell.reset()
        self.assertEqual(dwell.update(100, 200, 5, safety), (0.0, False))
        self.assertEqual(clicks, [])

    def test_native_runtime_releases_input_before_shutdown_when_camera_stalls(self):
        safety = native.WinInputManager()
        safety.is_left_down = True
        cursor, camera = Mock(), Mock()
        camera.read_new.return_value = (False, None, 0, 0)
        snapshots, keys = [], iter([0, ord('q')])
        def wait_key(_):
            snapshots.append(safety.is_left_down)
            return next(keys)
        with ExitStack() as stack:
            for name in ("namedWindow", "resizeWindow", "setMouseCallback", "destroyAllWindows"):
                stack.enter_context(patch.object(native.cv2, name))
            for name in ("JarvisVoiceEngine", "JarvisVoiceListener"):
                stack.enter_context(patch.object(native, name))
            stack.enter_context(patch.object(native, "ThreadedCamera", return_value=camera))
            stack.enter_context(patch.object(native, "WinInputManager", return_value=safety))
            stack.enter_context(patch.object(native, "AsyncCursorInterpolator", return_value=cursor))
            stack.enter_context(patch.object(native, "check_global_hotkeys", return_value="NONE"))
            stack.enter_context(patch.object(native.vision.HandLandmarker, "create_from_options"))
            stack.enter_context(patch.object(bridge, "DesktopCursorHalo"))
            stack.enter_context(patch.object(native.cv2, "waitKey", side_effect=wait_key))
            stack.enter_context(patch.object(native.time, "perf_counter", side_effect=itertools.count()))
            stack.enter_context(patch.object(native.sys, "argv", ["stark_air_mouse.py"]))
            stack.enter_context(redirect_stdout(io.StringIO()))
            native.main()
        self.assertEqual(snapshots, [False, False])
        cursor.deactivate.assert_called()
        camera.stop.assert_called_once()

    def test_original_verification_suite(self):
        import test_v973_ergonomic_surgery as original
        with patch.object(ctypes.windll, "winmm", FakeWin32()), redirect_stdout(io.StringIO()):
            for name in sorted(dir(original)):
                if name.startswith("test_"):
                    with self.subTest(name=name):
                        getattr(original, name)()

    def test_concurrent_holomat_feature_suite(self):
        import test_holomat_features as holomat
        with redirect_stdout(io.StringIO()):
            for name in sorted(dir(holomat)):
                if name.startswith("test_"):
                    with self.subTest(name=name):
                        getattr(holomat, name)()


class TokenRegressionTests(unittest.TestCase):
    def test_legacy_token_is_migrated_and_persisted_for_launcher(self):
        test_root = Path(__file__).resolve().parent
        with tempfile.TemporaryDirectory(prefix=".stark-token-test-", dir=test_root) as directory:
            self.assertTrue(Path(directory).resolve().is_relative_to(test_root))
            path = Path(directory) / "stark_config.json"
            path.write_text(json.dumps({"interactions": {"bridge_token": bridge.LEGACY_BRIDGE_TOKEN}}), encoding="utf-8")
            with patch.object(bridge, "__file__", str(Path(directory) / "stark_bridge.py")), patch.dict(os.environ, {"STARK_BRIDGE_TOKEN": ""}):
                token = bridge.get_bridge_token()
                self.assertNotEqual(token, bridge.LEGACY_BRIDGE_TOKEN)
                self.assertGreaterEqual(len(token), 32)
                self.assertEqual(bridge.get_bridge_token(), token)
                self.assertIn("?token=" + token, bridge.get_web_app_url())
                self.assertEqual(json.loads(path.read_text(encoding="utf-8"))["interactions"]["bridge_token"], token)


if __name__ == "__main__":
    unittest.main()
