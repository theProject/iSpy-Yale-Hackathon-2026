# iSpy

<p align="center">
  <img src="https://i.ibb.co/vSKRMYd/Screenshot-2026-04-11-at-1-52-58-PM.png" alt="iSpy Logo" width="180" />
</p>

<h1 align="center">iSpy</h1>

<p align="center"><strong>Giving eyes to the blind.</strong></p>

<p align="center">
  Built by
  <a href="https://www.linkedin.com/in/kanikajakhar">Kanika Jakhar</a>,
  <a href="https://www.linkedin.com/in/sophiabugay/">Sophia Bugay</a>,
  <a href="https://www.linkedin.com/in/filippo-fonseca/">Filippo Fonseca</a>,
  <a href="https://www.linkedin.com/in/emir-ahmed-6016422a1/">Emir Ahmed</a> &
  <a href="https://www.linkedin.com/in/david-antwi-b17727205/">David Antwi</a>
</p>

---

## The World Doesn't Wait for You to See It

1.1 billion people worldwide have vision impairment. Traditional assistive tools are clunky, expensive, and require both hands. Guide dogs take years to train and cost $50,000+. Screen readers don't work in the real world.

We built something different.

**iSpy** is a wearable AI vision system that sees the world for you — and tells you about it. In real-time. With your voice. No hands needed.

> *"Hey Hellen, what's in front of me?"*
>
> *"There's a wooden bench about 6 feet ahead, and a person walking a golden retriever coming from your left."*

---

## How It Works

A cap-mounted camera streams what you'd see. An AI agent understands it. You just talk.

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   iSpy Device   │  WiFi   │  Laptop Server  │  WiFi   │   Mobile App    │
│  (cap camera)   │ ──────> │   (FastAPI)     │ <────── │  (React Native) │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        │                    ┌──────┴──────┐
        │                    │             │
        ▼                    ▼             ▼
   Visual Feed         Gemini AI      ElevenLabs
   (real-time)         (vision)         (TTS)
```

## 🔒 Privacy & Data Handling

**Your privacy matters.** Here's exactly what iSpy does (and doesn't) with your data:

### ✅ What We Protect
- **Images & Video**: Never stored or uploaded — processed in real-time and immediately discarded
- **Camera Feed**: Only analyzed locally on your device, never sent to cloud storage
- **Voice Commands**: Processed locally, not recorded or stored

### ⚠️ What Gets Stored (Optional)
- **Conversation History**: Questions you ask and AI responses can be stored in Firebase for session continuity
- **Purpose**: Allows you to review past conversations and continue sessions across app restarts
- **Default**: Enabled for better user experience

### 🚫 How to Disable Cloud Storage (Local-Only Mode)

If you prefer complete local privacy:

1. **Skip Firebase Setup**: Don't configure Firebase environment variables
2. **Or Disable in Code**: Comment out Firebase calls in `src/services/sessionService.ts`:
   ```typescript
   // Comment out these lines to disable cloud storage:
   // await saveSession(session);
   // const sessions = await fetchSessions();
   ```
3. **Use Local Memory Only**: The app will use device storage instead of cloud

### 🔐 Security Notes
- API keys are stored locally in `.env` (not committed to git)
- Gemini AI processes images but doesn't retain them
- All processing happens on your device or trusted AI services
- No data is shared with third parties beyond required AI processing

---

## Quick Start

1. **Wear it** — clip the camera to your cap or collar
2. **Ask anything** — "Hey Hellen, is this my coffee or water?" / "What color is this shirt?"
3. **Get answers** — natural voice response in under 2 seconds

No buttons. No screens. Just your voice and an AI that never blinks.

---

## Features

### "Hey Hellen..."

Hands-free, always-listening wake word activation. Just say it and ask.

- Works offline (Vosk local speech recognition)
- Multiple trigger phrases: "Hey Helen", "Hey Hellen", "Hey Ellen"
- Captures follow-up questions automatically
- Pauses intelligently during responses

### "Watch For..." Mode

Set it and forget it. Tell iSpy what to look for, and it'll alert you when it appears.

> *"Watch for a taxi"*
>
> *[30 seconds later]*
>
> *"Alert! I see a yellow taxi approaching from the right."*

- Continuous background scanning (1 frame/second)
- Binary detection (no hallucination — just yes/no)
- Works for anything visual: people, objects, colors, signs, vehicles

### Session Memory

iSpy remembers what you've seen and asked.

> *"Was that the same dog as earlier?"*
>
> *"No, the dog you saw 10 minutes ago was a black labrador. This one appears to be a golden retriever."*

- Stores observations with timestamps
- Enables temporal questions ("what did I see 5 minutes ago?")
- Builds context over your entire session

### 24/7 Agent

A persistent assistant that runs in the background and watches out for you.

| Mode | What It Does |
|------|--------------|
| **Safety** | Detects stairs, obstacles, curbs — alerts before you reach them |
| **Social** | Recognizes faces, announces who's approaching |
| **Navigation** | Guides you through spaces with spatial awareness |
| **Exploration** | Proactively describes interesting things around you |

### Mobile App (Accessibility-First)

Designed for users who can't see it.

- **Large touch targets** (44px minimum, usually larger)
- **Haptic feedback** on every interaction
- **VoiceOver/TalkBack optimized**
- **High contrast dark theme**
- **Voice-first** — the app is optional, everything works by voice

---

## Tech Stack

### Mobile App
- **Framework**: React Native + Expo
- **Language**: TypeScript
- **State**: Zustand
- **Voice**: expo-speech, native speech recognition
- **Haptics**: expo-haptics
- **Backend Sync**: Firebase Firestore

### Server
- **Framework**: FastAPI (Python)
- **AI**: Google Gemini (vision + conversation)
- **Agent Framework**: Google ADK (tools, memory, context)
- **Vision**: OpenCV (camera capture)
- **STT**: Google Speech Recognition
- **TTS**: ElevenLabs (primary), pyttsx3 (fallback)
- **Wake Word**: Vosk (offline, local)

### Hardware (Prototype)
- Laptop webcam (swappable to IP camera or dedicated hardware)
- System microphone + speaker
- Future: cap-mounted camera, depth sensors, BLE connection

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- Expo CLI
- A laptop with webcam + microphone

### Server Setup

```bash
cd server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download Vosk model for wake word
mkdir -p models
cd models
wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
cd ..

# Set environment variables
export GEMINI_API_KEY="your-gemini-api-key"
export ELEVENLABS_API_KEY="your-elevenlabs-api-key"

# Run server
python main.py
```

Server runs at `http://localhost:8000`

### Mobile App Setup

```bash
# Install dependencies
npm install

# Configure server IP
# Edit src/config/index.ts with your laptop's local IP

# Start Expo
npx expo start
```

Scan the QR code with Expo Go, or run on iOS simulator.

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `GEMINI_API_KEY` | Vision + conversation AI | Yes |
| `ELEVENLABS_API_KEY` | High-quality text-to-speech | For voice |
| `EXPO_PUBLIC_FIREBASE_*` | Session sync + auth | For app |

---

## Project Structure

```
/
├── src/                      # React Native mobile app
│   ├── screens/              # Home, Session, History, Stats, Settings
│   ├── services/             # Agent, memory, face recognition, depth
│   ├── components/           # Neumorphic buttons, message bubbles
│   ├── hooks/                # useVoice, custom hooks
│   ├── store/                # Zustand state management
│   ├── theme/                # Colors, spacing, typography
│   └── config/               # Server endpoints, API keys
│
├── server/                   # Python FastAPI backend
│   ├── main.py               # HTTP endpoints + server startup
│   ├── agent.py              # ADK agent with tools
│   ├── wake.py               # Wake word listener (Vosk)
│   ├── watch.py              # "Watch for..." mode
│   ├── vision.py             # Gemini vision integration
│   ├── camera.py             # OpenCV camera abstraction
│   ├── stt.py                # Speech-to-text
│   ├── tts.py                # Text-to-speech (ElevenLabs)
│   └── session.py            # Memory management
│
├── ios/                      # Native iOS configuration
├── app.json                  # Expo configuration
└── package.json              # Node dependencies
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/status` | GET | Check server + camera status |
| `/ask/start` | POST | Start recording voice question |
| `/ask/stop` | POST | Stop recording, process, respond |
| `/watch/start` | POST | Start recording watch condition |
| `/watch/stop` | POST | Stop recording, begin monitoring |
| `/watch` | DELETE | Cancel active watch |

---

## Personality Presets

Customize how iSpy talks to you.

| Preset | Tone | Best For |
|--------|------|----------|
| **Assistant** | Professional, balanced | General use |
| **Buddy** | Friendly, humorous | Casual, conversational |
| **Navigator** | Concise, minimal | Efficient navigation |
| **Companion** | Warm, detailed | Rich descriptions |

Or create your own with custom prompts, greetings, and verbosity levels.

---

## Architecture Principles

**Simplicity first.** A blind user shouldn't need a manual.

**Voice is the interface.** Buttons are fallbacks, not requirements.

**Modular hardware.** Swap cameras, sensors, or devices without rewriting code.

**Graceful degradation.** No ElevenLabs? Falls back to pyttsx3. No network? Wake word still works locally.

**Memory matters.** Context from 5 minutes ago is still relevant.

---

## Roadmap

- [x] Ask mode (vision + voice Q&A)
- [x] Watch mode (background monitoring)
- [x] Wake word activation
- [x] Session memory
- [x] 24/7 agent framework
- [x] Personality system
- [x] Mobile app with accessibility
- [ ] Face recognition (ML model integration)
- [ ] Depth perception (hardware sensors)
- [ ] Stair/obstacle detection (CV models)
- [ ] Wearable hardware (cap camera + BLE)
- [ ] Navigation with Google Maps
- [ ] Gemini Live (real-time audio streaming)

---

## The Vision

A world where vision impairment doesn't mean navigating blind.

Where asking "what's in front of me?" gets an instant, accurate answer.

Where technology doesn't require seeing a screen to use it.

**iSpy: giving eyes to those who cannot use their own.**

---

<p align="center">
  <sub>Built with Gemini, ElevenLabs, React Native, and a lot of empathy.</sub>
</p>
