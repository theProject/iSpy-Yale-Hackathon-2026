"""
Configuration for the blind assistant.
Personality and behavior are fully configurable via natural language.
"""

import os

DEFAULT_PERSONALITY = (
    "You are a calm, warm, and highly descriptive AI assistant helping a blind person "
    "navigate and understand the world around them. Be concise but precise. "
    "Prioritize spatial information (distances, positions, obstacles). "
    "Never guess — if you're uncertain, say so clearly."
)

# Gemini model to use — Flash for lowest latency
GEMINI_MODEL = "gemini-3-flash-preview"

# How many past session entries to include as context when answering questions
SESSION_CONTEXT_LIMIT = 10

# ElevenLabs TTS settings
ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # "Rachel" — calm, natural voice
ELEVENLABS_MODEL = "eleven_turbo_v2_5"          # Lowest latency model

# Watch mode — how often to scan frames (seconds)
WATCH_INTERVAL = 1.0

# Wake word settings
VOSK_MODEL_PATH = os.environ.get(
    "VOSK_MODEL_PATH",
    os.path.join(os.path.dirname(__file__), "models", "vosk-model-small-en-us-0.15"),
)
WAKE_PHRASES_ASK = ["hey helen", "hey ellen", "hey hellen"]
WAKE_PHRASES_WATCH = ["watch for"]
WAKE_TIMEOUT = 8.0  # Max seconds to record after wake word

# Camera source
# - 0 = default laptop webcam
# - 1, 2, ... = other connected cameras
# - "http://<phone-ip>:8080/video" = phone camera via IP Webcam app
CAMERA_SOURCE = os.environ.get("CAMERA_SOURCE", "0")
# Auto-convert to int if it's a device index
try:
    CAMERA_SOURCE = int(CAMERA_SOURCE)
except ValueError:
    pass  # It's a URL string, keep as-is
