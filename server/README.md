# Blind Assistant — Backend Prototype

A voice-guided AI assistant for blind users. Point a webcam at anything, ask a question, get a spoken response.

## Setup

```bash
pip install -r requirements.txt
```

### API Keys

**Gemini (required):**
```bash
export GEMINI_API_KEY="your_key_here"
```
Get it at: https://makersuite.google.com/app/apikey

**Google Cloud TTS (optional but recommended for best voice quality):**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service_account.json"
```
If not set, falls back to pyttsx3 (works offline, lower quality).

## Run

```bash
cd blind_assistant
python main.py
```

## Architecture

```
main.py         ← Entry point + CLI interaction loop
camera.py       ← Webcam abstraction (swap source for cap camera or phone stream)
vision.py       ← Gemini 1.5 Flash — vision + conversation
session.py      ← Session memory — stores frames, timestamps, conversation history
tts.py          ← Google Cloud TTS (or pyttsx3 fallback)
config.py       ← Personality, model settings
```

## Integrating with the Mobile App

1. **Replace `camera.py`** — instead of OpenCV, receive JPEG frames pushed from the app over WebSocket or HTTP.
2. **Replace the CLI input loop in `main.py`** — expose a `/ask` HTTP endpoint (FastAPI) that accepts `{query: str, image: base64}`.
3. **Replace `tts.py` output** — instead of playing audio locally, return the audio bytes to the app to play.

## Extending

- **Watch mode**: Add a background polling loop in `camera.py` that calls `agent.ask()` with a binary yes/no prompt.
- **Face recognition**: Add `face_recognition` library + store embeddings in `session.py`.
- **Session persistence**: Serialize `SessionMemory` to JSON at shutdown, reload at startup.
