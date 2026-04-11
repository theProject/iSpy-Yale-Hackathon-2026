"""
Camera abstraction — uses laptop webcam for the prototype.
Swap out CameraSource to plug in a cap-mounted camera or a mobile stream later.
"""

import cv2
import time


class CameraSource:
    """
    Wraps OpenCV VideoCapture.
    In production, replace the source index with an IP stream URL or
    a platform-specific camera interface from the mobile app.
    """

    def __init__(self, source: int | str = 0):
        """
        Args:
            source: 0 = default laptop webcam.
                    Can be a URL (e.g. "http://192.168.1.x:8080/video")
                    for an external camera streamed from the phone.
        """
        self.source = source
        self._cap: cv2.VideoCapture | None = None

    def open(self):
        self._cap = cv2.VideoCapture(self.source)
        if not self._cap.isOpened():
            raise RuntimeError(f"Could not open camera source: {self.source}")
        # Warmup — first frame is often dark/blurry
        for _ in range(3):
            self._cap.read()
            time.sleep(0.05)

    def capture_frame(self) -> bytes:
        """
        Captures a single frame and returns it as JPEG bytes.
        """
        if self._cap is None:
            raise RuntimeError("Camera is not open. Call open() first.")
        ret, frame = self._cap.read()
        if not ret:
            raise RuntimeError("Failed to read frame from camera.")
        _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return buffer.tobytes()

    def close(self):
        if self._cap:
            self._cap.release()
            self._cap = None

    def __enter__(self):
        self.open()
        return self

    def __exit__(self, *args):
        self.close()
