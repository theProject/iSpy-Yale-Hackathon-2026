"""
Speech-to-text — records audio from microphone and transcribes using Google Speech Recognition.
Used for push-to-talk: hold R to record, release to transcribe and send.
"""

import io
import wave

import numpy as np
import sounddevice as sd
import speech_recognition as sr


class VoiceRecorder:
    """Records audio from the microphone and transcribes it."""

    def __init__(self, sample_rate: int = 16000):
        self.sample_rate = sample_rate
        self._frames: list[np.ndarray] = []
        self._recording = False
        self._stream: sd.InputStream | None = None
        self._recognizer = sr.Recognizer()

    def start_recording(self):
        """Start capturing audio from the default microphone."""
        self._frames = []
        self._recording = True
        self._stream = sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            dtype="int16",
            callback=self._callback,
        )
        self._stream.start()

    def _callback(self, indata, frames, time_info, status):
        if self._recording:
            self._frames.append(indata.copy())

    def stop_recording(self) -> bytes:
        """Stop recording and return WAV bytes."""
        self._recording = False
        if self._stream:
            self._stream.stop()
            self._stream.close()
            self._stream = None

        if not self._frames:
            return b""

        audio_data = np.concatenate(self._frames)

        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(self.sample_rate)
            wf.writeframes(audio_data.tobytes())
        return buf.getvalue()

    def transcribe(self, wav_bytes: bytes) -> str:
        """Transcribe WAV audio to text using Google Speech Recognition."""
        if not wav_bytes:
            return ""

        audio_file = sr.AudioFile(io.BytesIO(wav_bytes))
        with audio_file as source:
            audio = self._recognizer.record(source)

        try:
            return self._recognizer.recognize_google(audio)
        except sr.UnknownValueError:
            return ""
        except sr.RequestError as e:
            print(f"[STT] Google Speech Recognition error: {e}")
            return ""
