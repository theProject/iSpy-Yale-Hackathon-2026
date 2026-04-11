"""
Watch mode — continuously scans camera frames for a user-defined trigger condition.

The user describes what to watch for (e.g. "a blue car"), and a background loop
captures frames at a regular interval, sending each to Gemini with a binary
yes/no prompt. When the condition is detected, fires an alert callback.

Uses a direct genai.Client call (not ADK) for speed — no tool overhead.
"""

import asyncio
import os
import threading

from google import genai
from google.genai import types

from config import GEMINI_MODEL, WATCH_INTERVAL


class WatchMode:
    """Background watcher that scans camera frames for a trigger condition."""

    def __init__(self):
        self._client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
        self._task: asyncio.Task | None = None
        self._condition: str = ""
        self._active = False

    @property
    def is_active(self) -> bool:
        return self._active

    @property
    def condition(self) -> str:
        return self._condition

    def start(self, condition: str, camera, on_trigger):
        """
        Start watching for a condition.

        Args:
            condition: What to watch for, e.g. "a blue car"
            camera: CameraSource instance (must be open)
            on_trigger: Callback called with the condition string when detected
        """
        # Cancel any existing watch
        self.stop()

        self._condition = condition
        self._active = True

        # Start the background scanning loop
        loop = asyncio.get_event_loop()
        self._task = loop.create_task(
            self._scan_loop(camera, on_trigger)
        )

    def stop(self):
        """Stop the current watch."""
        self._active = False
        if self._task and not self._task.done():
            self._task.cancel()
        self._task = None
        self._condition = ""

    async def _scan_loop(self, camera, on_trigger):
        """Background loop: capture frame → binary Gemini check → repeat."""
        while self._active:
            try:
                # Capture frame
                image_bytes = camera.capture_frame()

                # Binary yes/no check — fast, no hallucination
                prompt = (
                    f'Does this image contain {self._condition}? '
                    f'Answer ONLY "yes" or "no".'
                )

                response = self._client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=[
                        types.Content(role="user", parts=[
                            types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                            types.Part.from_text(text=prompt),
                        ]),
                    ],
                    config=types.GenerateContentConfig(
                        temperature=0.0,
                        max_output_tokens=5,
                    ),
                )

                answer = response.text.strip().lower()

                if answer.startswith("yes"):
                    print(f"🚨 Watch triggered: {self._condition}")
                    self._active = False
                    on_trigger(self._condition)
                    return

            except asyncio.CancelledError:
                return
            except Exception as e:
                print(f"[Watch] Error: {e}")

            # Wait before next scan
            await asyncio.sleep(WATCH_INTERVAL)
