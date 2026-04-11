"""List available camera devices so you can find the right index."""

import cv2
import os

os.environ["OPENCV_LOG_LEVEL"] = "SILENT"

print("Scanning for cameras...\n")

found = 0
for i in range(10):
    cap = cv2.VideoCapture(i)
    if cap.isOpened():
        ret, frame = cap.read()
        if ret:
            h, w = frame.shape[:2]
            print(f"  Camera {i}: {w}x{h}")
            found += 1
        else:
            print(f"  Camera {i}: opened but no frame")
        cap.release()
    # Don't break — keep scanning all 10 indices

print(f"\nFound {found} camera(s).")
if found:
    print("Set CAMERA_SOURCE in your .env to the number you want.")
else:
    print("No cameras found. On macOS, make sure Terminal/Python has camera")
    print("permission: System Settings → Privacy & Security → Camera")
