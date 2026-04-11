# i-spy — AI Vision Assistant for the Blind

## Project Overview

A wearable AI assistant for blind users. A camera (currently: laptop webcam, eventually: cap-mounted camera) continuously feeds into an AI pipeline. The user holds a button on a mobile app to ask questions about what they're currently seeing, or about things they've seen earlier in the session. The assistant responds with synthesized speech.

## Current Status

MVP in progress. Core vision + conversation loop exists (`main.py`, `vision.py`, `tts.py`). Currently debugging TTS auth issues.

## Tech Stack

- **Vision/AI**: Google Gemini (`google.genai` — NOT `google.generativeai`, that package is deprecated)
- **TTS**: ElevenLabs (preferred) or Google Cloud TTS (has quota project auth issues currently)
- **Camera**: OpenCV (`cv2`) — currently laptop webcam, must stay modular for hardware swap
- **Audio playback**: pygame
- **Language**: Python 3.12

## Architecture

```
main.py          — entry point, CLI loop, orchestrates everything
vision.py        — webcam capture + Gemini Vision calls
tts.py           — text-to-speech (ElevenLabs or GCP)
session.py       — session memory: stores timestamped frames + conversation history
```

## Core Features (MVP)

1. **Live Q&A** — capture current frame, send to Gemini with conversation history, speak the response
2. **Session memory** — every frame + prompt is stored with a timestamp; user can ask about past observations (e.g. "was that the same dog as before?")
3. **Sustained conversation** — full conversation history passed to Gemini on every turn
4. **Configurable personality** — user describes the assistant's personality in natural language; this is injected into the system prompt

## Planned Features (Post-MVP)

- **Watch mode** — user sets a natural language trigger (e.g. "alert me when you see a blue car"); background loop polls frames with a binary yes/no prompt until condition is met
- **Face recognition** — store embeddings of named people; alert user when a recognized face appears in frame
- **Mobile app** — push-to-talk button, settings UI, personality config
- **Hardware** — cap-mounted webcam replacing laptop webcam

## Key Design Constraints

- **Low latency is the #1 priority** — stream Gemini response to TTS as tokens arrive, don't wait for full response
- **No hallucinations** — use focused, constrained prompts; for watch mode use binary yes/no questions
- **Good voice quality** — ElevenLabs preferred over Google TTS
- **Modularity** — camera input and TTS must be swappable without rewriting core logic

## Known Issues

- `google.generativeai` is deprecated — use `google.genai` everywhere
- Google Cloud TTS throws `PERMISSION_DENIED` due to missing quota project. Fix: `gcloud auth application-default set-quota-project YOUR_PROJECT_ID`. Or just switch to ElevenLabs.

## Environment Variables

```
GEMINI_API_KEY=
ELEVENLABS_API_KEY=       # if using ElevenLabs
GOOGLE_CLOUD_PROJECT=     # if using GCP TTS
```

## Running Locally

```bash
python main.py
```

### CLI Commands (current)

```
[ENTER]           → ask about what you see right now
memory <query>    → query session memory only
personality       → update assistant personality
quit              → exit
```

## Modular Interfaces to Preserve

When editing, keep these interfaces stable so the mobile app and hardware can integrate cleanly:

- **Camera**: abstracted behind a `get_frame() -> np.ndarray` function — swap webcam for external camera without touching the rest
- **TTS**: abstracted behind a `speak(text: str, blocking: bool)` method — swap ElevenLabs for another provider freely
- **Trigger**: the "ask" action should be callable as a function so the mobile app's push-to-talk button can invoke it over a socket or API
