# i-spy API Reference

Base URL: `http://<laptop-ip>:8000`

The laptop runs the server. It controls the webcam, microphone, and speaker. The mobile app is a remote control — it only sends HTTP requests to trigger actions.

---

## Endpoints

### Ask a question (vision + voice)

The user holds a button to speak their question. The laptop records from its mic, captures a frame from the webcam, sends both to Gemini, and speaks the response aloud.

**Start recording:**

```
POST /ask/start
```

No body required. Returns:

```json
{"status": "recording", "mode": "ask"}
```

**Stop recording and get answer:**

```
POST /ask/stop
```

No body required. The server stops recording, transcribes the audio, captures a camera frame, sends it to Gemini, speaks the response, and returns:

```json
{"query": "what's in front of me?", "response": "You're facing a wooden desk with a laptop and a coffee mug on the left side."}
```

If transcription fails:

```json
{"error": "transcription_failed", "response": "Sorry, I didn't catch that. Try again."}
```

If called without a prior `/ask/start`:

```json
{"error": "Not recording. Call /ask/start first."}
```

---

### Watch mode

Watch mode runs in the background. The user describes a condition (e.g. "a blue car"). The server continuously captures frames and asks Gemini a binary yes/no question. When the condition is detected, it speaks an alert.

**Start recording a watch condition:**

```
POST /watch/start
```

No body required. Returns:

```json
{"status": "recording", "mode": "watch"}
```

**Stop recording and activate watch:**

```
POST /watch/stop
```

No body required. The server transcribes the audio and starts watching. If a previous watch was active, it is cancelled first. Returns:

```json
{"status": "watching", "condition": "a blue car"}
```

If transcription fails:

```json
{"error": "transcription_failed", "response": "Sorry, I didn't catch that. Try again."}
```

**Cancel watch:**

```
DELETE /watch
```

Returns:

```json
{"status": "cancelled"}
```

Or if no watch is active:

```json
{"status": "no_active_watch"}
```

---

### Health check

```
GET /status
```

Returns:

```json
{
  "status": "running",
  "camera": 0,
  "recording": false,
  "recording_mode": null,
  "watch_active": true,
  "watch_condition": "a blue car"
}
```

| Field             | Type    | Description                                      |
|-------------------|---------|--------------------------------------------------|
| `status`          | string  | Always `"running"` if the server is up           |
| `camera`          | int/str | Camera source (device index or URL)              |
| `recording`       | bool    | Whether the mic is currently recording           |
| `recording_mode`  | string  | `"ask"`, `"watch"`, or `null`                    |
| `watch_active`    | bool    | Whether watch mode is running in the background  |
| `watch_condition` | string  | What the watch is looking for, or `null`          |

---

## Typical flows

### Ask what you see

```
1. POST /ask/start        ← user presses button (start recording)
2. (user speaks question)
3. POST /ask/stop         ← user releases button (stop, process, hear answer)
```

### Set a watch

```
1. POST /watch/start      ← user presses watch button (start recording)
2. (user says "a blue car")
3. POST /watch/stop       ← user releases button (watch starts scanning)
4. (server alerts when condition is seen)
```

### Cancel a watch

```
1. DELETE /watch           ← one call, immediate
```

### Check server state

```
1. GET /status             ← returns camera, recording, and watch state
```

---

## Notes

- All audio recording and playback happens on the laptop. The mobile app never handles audio.
- Every `/ask/stop` captures a fresh webcam frame. There is no text-only mode — every question includes what the camera sees.
- The server speaks responses aloud via ElevenLabs TTS on the laptop speaker.
- Watch mode alerts are also spoken aloud on the laptop.
- Session memory is maintained — the user can ask "was that the same dog as before?" and the agent will reference past observations.
- Interactive API docs are available at `GET /docs` (Swagger UI).
