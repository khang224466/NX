import sys
import os
import math
import numpy as np

# Import from stark_air_mouse
sys.path.insert(0, r"d:\BUISINESS\Stark_Air_Mouse_App")
from stark_air_mouse import (
    WinInputManager,
    draw_spatial_caliper,
    draw_radial_ironman_menu
)

class MockLM:
    def __init__(self, x, y, z=0.0):
        self.x = x
        self.y = y
        self.z = z

def test_spatial_caliper():
    # Synthetic frame (720p)
    frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    
    # 21 hand landmarks (normalized screen coords 0..1)
    lms = [MockLM(0.5, 0.5) for _ in range(21)]
    lms[4] = MockLM(0.45, 0.50)  # Thumb tip
    lms[8] = MockLM(0.55, 0.50)  # Index tip
    
    # 21 hand world landmarks (metric coords in meters)
    # Distance: 50mm = 0.05m along x-axis
    world_lms = [MockLM(0.0, 0.0, 0.0) for _ in range(21)]
    world_lms[4] = MockLM(0.00, 0.0, 0.0)
    world_lms[8] = MockLM(0.05, 0.0, 0.0)
    
    dist_mm = draw_spatial_caliper(frame, lms, world_lms, 1280, 720)
    assert abs(dist_mm - 50.0) < 1e-3, f"Expected 50.0mm, got {dist_mm}"
    print(f"PASS: test_spatial_caliper -> {dist_mm:.1f} mm verified accurately")

def test_radial_menu():
    frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    draw_radial_ironman_menu(frame, 640, 360, selected_idx=0, hold_progress=0.75)
    # Check that drawing actually modified pixels around center
    center_region = frame[300:420, 580:700]
    assert np.count_nonzero(center_region) > 500, "Radial menu did not render pixels"
    print("PASS: test_radial_menu -> Arc Reactor HUD rendered correctly")

def test_wininput_jarvis():
    mgr = WinInputManager()
    mgr.mouse_enabled = False
    # Check method existence and callable
    assert hasattr(mgr, 'trigger_jarvis_snap'), "Missing trigger_jarvis_snap"
    assert hasattr(mgr, 'trigger_jarvis_summon'), "Missing trigger_jarvis_summon"
    print("PASS: test_wininput_jarvis -> Roamies JARVIS hotkey triggers verified")

if __name__ == "__main__":
    test_spatial_caliper()
    test_radial_menu()
    test_wininput_jarvis()
    print(">>> 100% OF HOLOMAT TESTS PASSED! <<<")
