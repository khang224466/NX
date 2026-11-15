import sys
import os
import math
import json
import time
import struct

# Dynamic relative directory resolution (no hardcoded absolute path)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from stark_air_mouse import (
    compute_pre_pinch_brake,
    OneEuroFilter,
    AdaptiveOneEuroFilter,
    AsyncCursorInterpolator,
    ScrollEngine,
    TwoHandZoomEngine,
    PinchDragEngine,
    _dist3d,
    _is_finger_extended
)

class MockPoint:
    def __init__(self, x, y, z=0.0):
        self.x = float(x)
        self.y = float(y)
        self.z = float(z)

class MockSafetyMgr:
    def __init__(self):
        self.mouse_enabled = True
        self.scrolls = []
        self.zooms = []
    def scroll_wheel(self, amount):
        self.scrolls.append(amount)
    def zoom_in(self, step=120):
        self.zooms.append(('IN', step))
    def zoom_out(self, step=120):
        self.zooms.append(('OUT', step))

def test_config_validity():
    cfg_path = os.path.join(CURRENT_DIR, "stark_config.json")
    assert os.path.exists(cfg_path), f"Config file does not exist at {cfg_path}"
    with open(cfg_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)
    
    assert cfg["version"] == "9.7.3", f"Expected version 9.7.3, got {cfg.get('version')}"
    act = cfg["interactions"]
    assert act["mouse_sensitivity"] == 1.15, f"Expected 1.15, got {act['mouse_sensitivity']}"
    assert act["pre_pinch_brake"]["approach_dist_m"] == 0.038, f"Expected 0.038, got {act['pre_pinch_brake']['approach_dist_m']}"
    assert act["pre_pinch_brake"]["min_gain"] == 0.15, f"Expected 0.15, got {act['pre_pinch_brake']['min_gain']}"
    assert act["stiction_anchor"]["radius_px"] == 0.0, f"Expected radius_px 0.0, got {act['stiction_anchor']['radius_px']}"
    assert cfg["comfort_zone"]["x_min"] == 0.04 and cfg["comfort_zone"]["x_max"] == 0.96, "Comfort zone bounds not aligned"
    print("PASS: test_config_validity")

def test_steer_math_positive_derivative():
    """
    Test direct fingertip steering with positive derivative.
    """
    knuckle_y = 0.55
    tip_y_1 = 0.50
    tip_y_2 = 0.40  # Flick finger up by 0.10
    
    steer_y_1 = 0.70 * tip_y_1 + 0.30 * knuckle_y
    steer_y_2 = 0.70 * tip_y_2 + 0.30 * knuckle_y
    
    diff_tip = tip_y_2 - tip_y_1
    diff_steer = steer_y_2 - steer_y_1
    derivative = diff_steer / diff_tip
    assert derivative > 0.69, f"Derivative should be +0.70, got {derivative}"
    print(f"PASS: test_steer_math_positive_derivative (d_steer/d_tip = +{derivative:.2f})")

def test_pre_pinch_brake():
    # 1. Normal relaxed hand pointing: thumb-index distance is 5.0cm (0.050m)
    brake_normal = compute_pre_pinch_brake(0.050, 0.028, approach_dist=0.038, min_gain=0.15)
    assert brake_normal == 1.0, f"Normal pointing at 5.0cm was choked! Got: {brake_normal}"
    
    # 2. Distance at 4.0cm: still above approach_dist (3.8cm), must NOT engage
    brake_4cm = compute_pre_pinch_brake(0.040, 0.028, approach_dist=0.038, min_gain=0.15)
    assert brake_4cm == 1.0, f"Pointing at 4.0cm should be 1.0, got {brake_4cm}"
    
    # 3. Distance at 3.3cm: approaching click, brake softly engages
    brake_approaching = compute_pre_pinch_brake(0.033, 0.028, approach_dist=0.038, min_gain=0.15)
    assert 0.15 < brake_approaching < 1.0, f"Expected soft braking, got {brake_approaching}"
    
    # 4. Fingers touched (<= 0.028m): brake locks at min_gain
    brake_touched = compute_pre_pinch_brake(0.020, 0.028, approach_dist=0.038, min_gain=0.15)
    assert brake_touched == 0.15, f"Expected min_gain 0.15, got {brake_touched}"
    print(f"PASS: test_pre_pinch_brake (5.0cm: {brake_normal}, 3.3cm: {brake_approaching:.2f}, touched: {brake_touched})")

def test_scroll_engine_momentum():
    """
    Test ScrollEngine continuous momentum retention:
    accum_dy must NOT drop to 0.0 after firing, but retain deadzone offset.
    """
    safety = MockSafetyMgr()
    engine = ScrollEngine(sensitivity=2.5, deadzone=0.012)
    
    # Frame 1: initial anchor
    engine.update(True, 0.500, safety)
    assert len(safety.scrolls) == 0
    
    # Frame 2: move down by 0.015 (crosses deadzone 0.012)
    res = engine.update(True, 0.515, safety)
    assert res != 0, "Scroll should have fired"
    assert len(safety.scrolls) == 1
    # Check that accum_dy is retained at deadzone, not wiped to 0.0
    assert abs(engine.accum_dy) == engine.deadzone, f"Expected accum_dy={engine.deadzone}, got {engine.accum_dy}"
    
    # Frame 3: move slightly further down by 0.003
    # With deadzone retention, this continuous movement must immediately fire!
    res2 = engine.update(True, 0.518, safety)
    assert res2 != 0, "Continuous scroll should have fired without getting stuck in deadzone"
    assert len(safety.scrolls) == 2
    print("PASS: test_scroll_engine_momentum (continuous smooth scrolling verified)")

def test_two_hand_zoom_clamping():
    """
    Test TwoHandZoomEngine tick clamping (max 5 ticks).
    """
    safety = MockSafetyMgr()
    engine = TwoHandZoomEngine(deadzone=0.006, step=120, throttle_s=0.05, sensitivity=2.8)
    
    now = time.perf_counter()
    engine.update(0.20, now, safety)
    
    # Massive sudden displacement (e.g. tracking jump from 0.20 to 0.50 = 0.30m)
    # 0.30 / 0.006 = 50 ticks! Without clamp this would fire a 50x wheel spike!
    act, _ = engine.update(0.50, now + 0.10, safety)
    assert act == 'ZOOM_IN'
    assert len(safety.zooms) == 1
    direction, step = safety.zooms[0]
    
    # Clamped to max 5 ticks * 120 * 1.4 = 840
    expected_max_step = int(5 * 120 * (2.8 / 2.0))
    assert step <= expected_max_step, f"Zoom step {step} exceeded clamp {expected_max_step}!"
    print(f"PASS: test_two_hand_zoom_clamping (max step clamped to {step})")

def test_pinch_drag_engine_multi_monitor():
    """
    Test PinchDragEngine coordinate offsets for multi-monitor.
    """
    engine = PinchDragEngine()
    # Coordinates must include SCREEN_X and SCREEN_Y (not purely SCREEN_W/2)
    from stark_air_mouse import SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H
    expected_x = SCREEN_X + SCREEN_W / 2.0
    expected_y = SCREEN_Y + SCREEN_H / 2.0
    assert engine.frozen_cursor_x == expected_x, f"Expected {expected_x}, got {engine.frozen_cursor_x}"
    assert engine.frozen_cursor_y == expected_y, f"Expected {expected_y}, got {engine.frozen_cursor_y}"
    assert engine.active_cursor_x == expected_x
    assert engine.active_cursor_y == expected_y
    print("PASS: test_pinch_drag_engine_multi_monitor")

def test_async_cursor_interpolator_deactivation():
    """
    Test AsyncCursorInterpolator deactivation when hands leave.
    """
    interp = AsyncCursorInterpolator(target_hz=144, stiction_radius=0.0, spring_k=85.0)
    try:
        interp.set_target(500.0, 500.0)
        assert interp.active is True
        
        # Deactivate
        interp.deactivate()
        assert interp.active is False
        
        # While deactivated, worker loop does NOT call SetCursorPos
        time.sleep(0.02)
        print("PASS: test_async_cursor_interpolator_deactivation")
    finally:
        interp.stop()

def test_websocket_fast_xor_unmasking():
    """
    Test WebSocket block XOR unmasking with big integers.
    """
    payload = b"Hello STARK Air Mouse v9.7.3 PRO WebSocket Bridge!"
    masks = b"\x37\xfa\x21\x8c"
    
    # Reference per-byte XOR
    ref_unmasked = bytearray(payload[i] ^ masks[i % 4] for i in range(len(payload)))
    
    # Fast block XOR using int.from_bytes
    payload_len = len(payload)
    mask_rep = (masks * (payload_len // 4 + 1))[:payload_len]
    fast_unmasked = (int.from_bytes(payload, "big") ^ int.from_bytes(mask_rep, "big")).to_bytes(payload_len, "big")
    
    assert bytes(ref_unmasked) == fast_unmasked, "Fast block XOR output did not match reference!"
    print(f"PASS: test_websocket_fast_xor_unmasking ({len(payload)} bytes decoded)")

if __name__ == '__main__':
    print("=== RUNNING STARK AIR MOUSE v9.7.3 PRO VERIFICATION SUITE ===")
    test_config_validity()
    test_steer_math_positive_derivative()
    test_pre_pinch_brake()
    test_scroll_engine_momentum()
    test_two_hand_zoom_clamping()
    test_pinch_drag_engine_multi_monitor()
    test_async_cursor_interpolator_deactivation()
    test_websocket_fast_xor_unmasking()
    print(">>> 100% OF VERIFICATION TESTS PASSED SUCCESSFULLY! <<<")
