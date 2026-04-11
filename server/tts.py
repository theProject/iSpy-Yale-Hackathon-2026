"""
Text-to-speech using ElevenLabs (high quality, natural voice).
Falls back to pyttsx3 if ElevenLabs API key is not set.
"""

import io
import os
import threading

# ElevenLabs TTS
try:
    from elevenlabs import ElevenLabs
    ELEVENLABS_AVAILABLE = bool(os.environ.get("ELEVENLABS_API_KEY"))
except ImportError:
    ELEVENLABS_AVAILABLE = False

# Local TTS fallback
try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False

# Audio playback
try:
    import pygame
    pygame.mixer.init()
    PYGAME_AVAILABLE = True
except Exception:
    PYGAME_AVAILABLE = False

from config import ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL


class TextToSpeech:
    """
    Speaks text aloud. Uses ElevenLabs for best quality.
    Non-blocking by default (speaks in a background thread).
    """

    def __init__(self):
        self._lock = threading.Lock()  # Prevent overlapping speech
        if ELEVENLABS_AVAILABLE:
            self._client = ElevenLabs(api_key=os.environ["ELEVENLABS_API_KEY"])
            print("[TTS] Using ElevenLabs.")
        elif PYTTSX3_AVAILABLE:
            self._engine = pyttsx3.init()
            self._engine.setProperty("rate", 175)
            print("[TTS] ElevenLabs not available — using pyttsx3 fallback.")
        else:
            print("[TTS] No TTS engine available. Responses will be text-only.")

    def speak(self, text: str, blocking: bool = False):
        """
        Speak text aloud.
        blocking=False runs in background so the app stays responsive.
        """
        if blocking:
            self._speak(text)
        else:
            t = threading.Thread(target=self._speak, args=(text,), daemon=True)
            t.start()

    def _speak(self, text: str):
        with self._lock:
            if ELEVENLABS_AVAILABLE and PYGAME_AVAILABLE:
                self._speak_elevenlabs(text)
            elif PYTTSX3_AVAILABLE:
                self._engine.say(text)
                self._engine.runAndWait()
            else:
                print(f"[TTS - text only]: {text}")

    def _speak_elevenlabs(self, text: str):
        audio_iter = self._client.text_to_speech.convert(
            text=text,
            voice_id=ELEVENLABS_VOICE_ID,
            model_id=ELEVENLABS_MODEL,
            output_format="mp3_44100_128",
        )
        # Collect streamed chunks into a single buffer for pygame
        audio_data = io.BytesIO(b"".join(audio_iter))
        pygame.mixer.music.load(audio_data)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
