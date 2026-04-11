"""
Always-on wake word listener using vosk for local, offline speech recognition.

Listens for:
  "Hey Helen" (+ variants) → triggers ask mode (capture frame + Gemini + TTS)
  "Watch for ..."          → triggers watch mode with the spoken condition

Runs in a daemon thread alongside the FastAPI server.
"""

import json
import os
import queue
import threading
import time

import numpy as np
import sounddevice as sd
from vosk import Model, KaldiRecognizer, SetLogLevel

from config import VOSK_MODEL_PATH, WAKE_PHRASES_ASK, WAKE_PHRASES_WATCH, WAKE_TIMEOUT

# Suppress vosk's verbose logging
SetLogLevel(-1)

# States
IDLE = "idle"
CAPTURING = "capturing"
PAUSED = "paused"


class WakeWordListener:
    """
    Always-on listener that detects wake phrases using local vosk STT.
    Runs in a background thread. Calls on_ask or on_watch when triggered.
    """

    def __init__(self, on_ask=None, on_watch=None, sample_rate=16000):
        """
        Args:
            on_ask: Callback(question_text, audio_bytes) called when "hey helen <question>" is detected.
                    audio_bytes contains the recorded audio after the wake word (WAV format).
            on_watch: Callback(condition_text) called when "watch for <condition>" is detected.
            sample_rate: Audio sample rate (must match vosk model expectations).
        """
        self.on_ask = on_ask
        self.on_watch = on_watch
        self.sample_rate = sample_rate

        self._state = IDLE
        self._state_lock = threading.Lock()
        self._audio_queue = queue.Queue()
        self._stream = None
        self._thread = None
        self._running = False

        # Load vosk model
        if not os.path.exists(VOSK_MODEL_PATH):
            raise FileNotFoundError(
                f"Vosk model not found at {VOSK_MODEL_PATH}. "
                f"Download from https://alphacephei.com/vosk/models"
            )
        self._model = Model(VOSK_MODEL_PATH)

    @property
    def state(self):
        with self._state_lock:
            return self._state

    def start(self):
        """Start the always-listening loop in a daemon thread."""
        self._running = True
        self._state = IDLE

        # Open audio stream — callback pushes chunks to queue
        self._stream = sd.RawInputStream(
            samplerate=self.sample_rate,
            blocksize=4000,  # 250ms chunks at 16kHz
            dtype="int16",
            channels=1,
            callback=self._audio_callback,
        )
        self._stream.start()

        # Start listener thread
        self._thread = threading.Thread(target=self._listen_loop, daemon=True)
        self._thread.start()

        print("🎧 Wake word listener active (say 'Hey Helen' or 'Watch for ...')")

    def stop(self):
        """Stop listening and clean up."""
        self._running = False
        if self._stream:
            self._stream.stop()
            self._stream.close()
            self._stream = None
        if self._thread:
            self._thread.join(timeout=2)
            self._thread = None

    def pause(self):
        """Temporarily pause wake word detection (e.g. HTTP endpoint using mic)."""
        with self._state_lock:
            self._state = PAUSED

    def resume(self):
        """Resume wake word detection after pause."""
        with self._state_lock:
            if self._state == PAUSED:
                self._state = IDLE
                # Drain any queued audio from while we were paused
                while not self._audio_queue.empty():
                    try:
                        self._audio_queue.get_nowait()
                    except queue.Empty:
                        break

    def _audio_callback(self, indata, frames, time_info, status):
        """Sounddevice callback — push raw audio to queue."""
        if self._running:
            self._audio_queue.put(bytes(indata))

    def _listen_loop(self):
        """Main loop: feed audio to vosk, detect wake phrases, capture speech."""
        recognizer = KaldiRecognizer(self._model, self.sample_rate)

        while self._running:
            # Get audio chunk (blocking with timeout so we can check _running)
            try:
                data = self._audio_queue.get(timeout=0.5)
            except queue.Empty:
                continue

            # Skip processing if paused
            if self.state == PAUSED:
                continue

            # Feed audio to vosk
            if recognizer.AcceptWaveform(data):
                # Full utterance boundary — check final result
                result = json.loads(recognizer.Result())
                text = result.get("text", "").lower().strip()

                if text:
                    self._check_and_route(text, recognizer)
            else:
                # Check partial results for early wake word detection
                partial = json.loads(recognizer.PartialResult())
                partial_text = partial.get("partial", "").lower().strip()

                # If we see a wake phrase in partial, check if it looks like a
                # complete enough phrase to act on — but wait for the full result
                # for better accuracy

    def _check_and_route(self, text, recognizer):
        """Check if text contains a wake phrase and route accordingly."""
        # Check for ask wake phrases ("hey helen ...")
        for phrase in WAKE_PHRASES_ASK:
            if phrase in text:
                # Extract question — everything after the wake phrase
                idx = text.index(phrase) + len(phrase)
                question = text[idx:].strip()

                if question:
                    # Got the full command in one utterance
                    print(f'🎧 Wake: "{phrase}" → question: "{question}"')
                    if self.on_ask:
                        self.on_ask(question)
                    return
                else:
                    # Wake word only, need to capture the follow-up question
                    print(f'🎧 Wake: "{phrase}" detected — listening for question...')
                    question = self._capture_followup(recognizer)
                    if question:
                        print(f'🎧 Question: "{question}"')
                        if self.on_ask:
                            self.on_ask(question)
                    else:
                        print("🎧 No question detected after wake word.")
                    return

        # Check for watch wake phrases ("watch for ...")
        for phrase in WAKE_PHRASES_WATCH:
            if phrase in text:
                idx = text.index(phrase) + len(phrase)
                condition = text[idx:].strip()

                if condition:
                    print(f'🎧 Wake: "{phrase}" → condition: "{condition}"')
                    if self.on_watch:
                        self.on_watch(condition)
                    return
                else:
                    # Need to capture the condition
                    print(f'🎧 Wake: "{phrase}" detected — listening for condition...')
                    condition = self._capture_followup(recognizer)
                    if condition:
                        print(f'🎧 Condition: "{condition}"')
                        if self.on_watch:
                            self.on_watch(condition)
                    else:
                        print("🎧 No condition detected after 'watch for'.")
                    return

    def _capture_followup(self, recognizer):
        """
        After wake word detected with no trailing content,
        capture the next utterance (until silence or timeout).
        Returns the transcribed text, or empty string on timeout.
        """
        start_time = time.time()

        while self._running and (time.time() - start_time) < WAKE_TIMEOUT:
            try:
                data = self._audio_queue.get(timeout=0.5)
            except queue.Empty:
                continue

            if self.state == PAUSED:
                return ""

            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                text = result.get("text", "").strip()
                if text:
                    return text

        # Timeout — check if there's a partial result
        final = json.loads(recognizer.FinalResult())
        return final.get("text", "").strip()
