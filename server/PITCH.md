# i-spy — AI Vision Assistant for the Blind

## 3-Minute Hackathon Pitch Outline

---

### [0:00–0:30] The Problem

- 285 million people worldwide are visually impaired. They navigate the world relying on limited tools — white canes, guide dogs, asking strangers.
- Simple tasks sighted people take for granted are daily friction: "What's on this menu?", "Is anyone in front of me?", "Did that car just stop?"
- Existing solutions are either too slow (call a volunteer), too limited (static image description), or too expensive (dedicated hardware).
- **What if you had a trusted friend who could see for you — always there, always listening, instantly responsive?**

---

### [0:30–1:30] The Solution — Live Demo

> **Demo: Say "Hey Helen, what's in front of me?"**

- Helen is a wearable AI assistant. Camera on your head, voice in your ear.
- **Hands-free** — just say "Hey Helen" and ask anything. No buttons, no phone, no fumbling.
- She responds in **1-2 seconds** with exactly what matters: hazards first, then people, then text, then objects.

> **Demo: "Hey Helen, can you read that sign?"**

- She reads text, menus, labels — offers to read more if there's a lot.
- Full **conversation memory** — ask follow-ups: "What else is there?", "Was that the same person as before?"

> **Demo: "Watch for a blue backpack"**

- **Watch mode** — set a trigger and Helen scans continuously in the background.
- Uses binary yes/no prompts for speed and zero hallucination.
- Alerts you the moment the condition is met.

> **Demo: Trigger the same actions from phone (show /ask/start from phone browser)**

- Also works as an **HTTP API** — mobile app acts as a remote control.
- Same backend, two input methods: voice wake word or phone buttons.

---

### [1:30–2:15] How It Works — Architecture

**Google products at the core:**

| Google Product | How We Use It |
|---|---|
| **Gemini 3 Flash** | Vision + conversation — processes camera frames with full context |
| **Google ADK** | Agent framework — tools, session memory, conversation history |
| **Google Search Grounding** | Real-time info — weather, news, "what's that building?" |
| **Google Speech-to-Text** | Voice transcription for questions and commands |

**Key design decisions:**

- **Gemini as the brain** — multimodal (image + text + history) in one call. No chaining multiple models.
- **ADK session state** — every observation stored with timestamp. The agent can recall past scenes by keyword. True conversational memory, not just chat history.
- **Watch mode uses direct Gemini calls** — no ADK overhead. Temperature 0.0, 5 tokens max. Binary yes/no. Fast and hallucination-proof.
- **Local wake word detection (vosk)** — always listening, fully offline, no audio sent to cloud until you actually speak a question. Privacy-first.
- **ElevenLabs TTS** — natural, warm voice. Not robotic. Because if someone is your eyes all day, they shouldn't sound like a GPS.

---

### [2:15–2:45] What Makes This Different

- **Not a camera app.** It's a conversational assistant with memory. Ask "was that the same dog?" and she knows.
- **Not a chatbot.** She sees in real-time, prioritizes hazards, uses clock positions and step distances. Built for navigation, not novelty.
- **Not cloud-dependent for wake words.** Vosk runs locally — the mic is always on but audio stays on-device until you trigger a query.
- **Modular.** Swap the laptop webcam for a cap-mounted camera. Swap keyboard for phone app. The interfaces are clean — `capture_frame()`, `speak()`, `handle_ask()`. Ready for hardware iteration.

---

### [2:45–3:00] Vision & Close

- **Today:** laptop + webcam + voice. Works now, fully functional.
- **Next:** cap-mounted ESP32 camera, mobile app with push-to-talk, face recognition ("That's Sarah, 5 steps ahead").
- **The goal:** a blind person puts on a cap, puts in an earbud, and has a trusted friend with them all day.

> "Hey Helen, is anyone near me?"
> "One person at your 2 o'clock, about 8 steps away, walking toward you."

**That's i-spy. Thank you.**
