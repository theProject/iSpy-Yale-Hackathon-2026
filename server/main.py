"""
i-spy — AI Vision Assistant for the Blind.

HTTP API server + always-on wake word listener.
Camera, microphone, and speaker are all on this computer.
The mobile app is an optional remote control.

Wake words (hands-free):
  "Hey Helen, <question>"   → capture frame + respond + speak
  "Watch for <condition>"   → start watch mode

API (push-to-talk from mobile):
  POST   /ask/start       → start recording from laptop mic
  POST   /ask/stop        → stop recording, transcribe, capture frame, respond + speak
  POST   /watch/start     → start recording a watch condition
  POST   /watch/stop      → stop recording, transcribe, start watching
  DELETE /watch            → cancel current watch
  GET    /status           → health check
"""

import asyncio
import logging
import os
import time

# Suppress noisy warnings
logging.getLogger("google.genai").setLevel(logging.ERROR)
logging.getLogger("google.adk").setLevel(logging.ERROR)

import warnings
warnings.filterwarnings("ignore", message=".*non-text parts.*")
warnings.filterwarnings("ignore", message=".*not compatible with automatic function calling.*")

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agent import root_agent
from camera import CameraSource
from tts import TextToSpeech
from stt import VoiceRecorder
from watch import WatchMode
from wake import WakeWordListener
from config import CAMERA_SOURCE


# ── Shared state ───────────────────────────────────────────────────
camera: CameraSource = None
tts: TextToSpeech = None
recorder: VoiceRecorder = None
watcher: WatchMode = None
listener: WakeWordListener = None
runner: Runner = None
session_service: InMemorySessionService = None
event_loop: asyncio.AbstractEventLoop = None

# What mode we're recording for via HTTP: "ask" or "watch"
recording_mode: str = None

USER_ID = "user"
SESSION_ID = "session_1"


# ── Shared helpers (used by both HTTP endpoints and wake listener) ─
async def run_agent_query(message):
    """Run the ADK agent and return the final response text."""
    response_text = ""
    async for event in runner.run_async(
        user_id=USER_ID,
        session_id=SESSION_ID,
        new_message=message,
    ):
        if event.is_final_response() and event.content and event.content.parts:
            texts = [p.text for p in event.content.parts if hasattr(p, "text") and p.text]
            if texts:
                response_text = " ".join(texts)
    return response_text


async def store_observation(query, response, description=""):
    """Store an observation in ADK session state for the recall tool."""
    session = await session_service.get_session(
        app_name="i_spy",
        user_id=USER_ID,
        session_id=SESSION_ID,
    )
    if session:
        observations = session.state.get("observations", [])
        observations.append({
            "timestamp": time.time(),
            "time_readable": time.strftime("%H:%M:%S"),
            "user_query": query,
            "assistant_response": response,
            "description": description,
        })
        session.state["observations"] = observations


async def handle_ask(question_text: str) -> str:
    """
    Shared ask logic: capture frame, send to Gemini, speak response.
    Used by both /ask/stop endpoint and wake word listener.
    Returns the response text.
    """
    print(f'💬 "{question_text}"')
    print("[Capturing frame...]")

    image_bytes = camera.capture_frame()

    parts = [
        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
        types.Part.from_text(text=question_text),
    ]
    user_message = types.Content(role="user", parts=parts)

    print("[Thinking...]")
    response = await run_agent_query(user_message)

    if not response:
        response = "Sorry, I couldn't come up with a response."

    print(f"🤖 {response}\n")

    # Pause listener while TTS speaks to avoid feedback loop
    if listener:
        listener.pause()
    tts.speak(response, blocking=True)
    if listener:
        listener.resume()

    # Store in session memory
    await store_observation(
        query=question_text,
        response=response,
        description=response[:100],
    )

    return response


async def handle_watch(condition_text: str) -> str:
    """
    Shared watch logic: start watching for a condition.
    Used by both /watch/stop endpoint and wake word listener.
    Returns the condition.
    """
    print(f'👁️  Watch condition: "{condition_text}"')

    if watcher.is_active:
        watcher.stop()

    def on_trigger(cond: str):
        alert = f"Alert! I see {cond}!"
        print(f"\n🚨 {alert}\n")
        if listener:
            listener.pause()
        tts.speak(alert, blocking=True)
        if listener:
            listener.resume()

    watcher.start(condition_text, camera, on_trigger)
    print(f"👁️  Watching for: {condition_text}\n")

    if listener:
        listener.pause()
    tts.speak(f"Watching for {condition_text}.")
    if listener:
        listener.resume()

    return condition_text


# ── Wake word callbacks (called from background thread) ────────────
def on_wake_ask(question_text: str):
    """Called by WakeWordListener when 'Hey Helen <question>' is detected."""
    if event_loop:
        future = asyncio.run_coroutine_threadsafe(handle_ask(question_text), event_loop)
        try:
            future.result(timeout=30)  # Wait for completion
        except Exception as e:
            print(f"[Wake ask error] {e}")


def on_wake_watch(condition_text: str):
    """Called by WakeWordListener when 'Watch for <condition>' is detected."""
    if event_loop:
        future = asyncio.run_coroutine_threadsafe(handle_watch(condition_text), event_loop)
        try:
            future.result(timeout=10)
        except Exception as e:
            print(f"[Wake watch error] {e}")


# ── Lifespan (startup / shutdown) ──────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global camera, tts, recorder, watcher, listener, runner, session_service, event_loop

    print("\n🔵 i-spy — AI Vision Assistant (API Server + Wake Word)")
    print("=" * 55)

    # Capture event loop for thread→async bridge
    event_loop = asyncio.get_running_loop()

    # Setup ADK
    session_service = InMemorySessionService()
    runner = Runner(
        agent=root_agent,
        app_name="i_spy",
        session_service=session_service,
    )
    await session_service.create_session(
        app_name="i_spy",
        user_id=USER_ID,
        session_id=SESSION_ID,
    )

    # Setup peripherals
    tts = TextToSpeech()
    recorder = VoiceRecorder()
    watcher = WatchMode()
    camera = CameraSource(source=CAMERA_SOURCE)
    camera.open()

    # Setup wake word listener
    listener = WakeWordListener(on_ask=on_wake_ask, on_watch=on_wake_watch)
    listener.start()

    camera_label = CAMERA_SOURCE if isinstance(CAMERA_SOURCE, str) else f"webcam {CAMERA_SOURCE}"
    print(f"\n📷 Camera: {camera_label}")
    print("🎤 Microphone: laptop default")
    print("🔊 Speaker: laptop default")
    print("\nWake words:")
    print('  "Hey Helen, <question>"   → vision + answer')
    print('  "Watch for <condition>"   → start watching')
    print("\nAPI Endpoints:")
    print("  POST   /ask/start    → start recording")
    print("  POST   /ask/stop     → stop, transcribe, capture frame, respond")
    print("  POST   /watch/start  → start recording a watch trigger")
    print("  POST   /watch/stop   → stop, transcribe, start watching")
    print("  DELETE /watch        → cancel watch")
    print("  GET    /status       → health check\n")

    yield  # Server runs

    # Cleanup
    listener.stop()
    if watcher.is_active:
        watcher.stop()
    camera.close()
    print("Goodbye.")


app = FastAPI(title="i-spy", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── API Endpoints ──────────────────────────────────────────────────

@app.post("/ask/start")
async def ask_start():
    """Start recording from laptop microphone."""
    global recording_mode
    recording_mode = "ask"
    listener.pause()
    recorder.start_recording()
    print("🎤 Recording (ask)...")
    return {"status": "recording", "mode": "ask"}


@app.post("/ask/stop")
async def ask_stop():
    """Stop recording, transcribe, capture frame, send to Gemini, speak."""
    global recording_mode

    if recording_mode != "ask":
        return {"error": "Not recording. Call /ask/start first."}

    recording_mode = None

    # Stop recording + transcribe
    wav_bytes = recorder.stop_recording()
    print("[Transcribing...]")
    query = recorder.transcribe(wav_bytes)

    if not query:
        msg = "Sorry, I didn't catch that. Try again."
        print(f"❌ {msg}")
        tts.speak(msg)
        listener.resume()
        return {"error": "transcription_failed", "response": msg}

    # Use shared handler (it handles TTS pause/resume internally)
    response = await handle_ask(query)
    # listener.resume() is called inside handle_ask after TTS

    return {"query": query, "response": response}


@app.post("/watch/start")
async def watch_start():
    """Start recording a watch condition from laptop microphone."""
    global recording_mode
    recording_mode = "watch"
    listener.pause()
    recorder.start_recording()
    print("🎤 Recording (watch trigger)...")
    return {"status": "recording", "mode": "watch"}


@app.post("/watch/stop")
async def watch_stop():
    """Stop recording, transcribe, and start watching."""
    global recording_mode

    if recording_mode != "watch":
        return {"error": "Not recording. Call /watch/start first."}

    recording_mode = None

    wav_bytes = recorder.stop_recording()
    print("[Transcribing...]")
    condition = recorder.transcribe(wav_bytes)

    if not condition:
        msg = "Sorry, I didn't catch that. Try again."
        print(f"❌ {msg}")
        tts.speak(msg)
        listener.resume()
        return {"error": "transcription_failed", "response": msg}

    # Use shared handler
    await handle_watch(condition)
    # listener.resume() is called inside handle_watch after TTS

    return {"status": "watching", "condition": condition}


@app.delete("/watch")
async def cancel_watch():
    """Cancel the current watch."""
    if watcher.is_active:
        watcher.stop()
        print("⏹️  Watch cancelled.\n")
        tts.speak("Watch cancelled.")
        return {"status": "cancelled"}
    return {"status": "no_active_watch"}


@app.get("/status")
async def status():
    """Health check."""
    return {
        "status": "running",
        "camera": CAMERA_SOURCE,
        "recording": recording_mode is not None,
        "recording_mode": recording_mode,
        "watch_active": watcher.is_active if watcher else False,
        "watch_condition": watcher.condition if watcher and watcher.is_active else None,
        "wake_listener": listener.state if listener else None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
