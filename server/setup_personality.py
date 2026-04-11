"""
Personality setup for i-spy.

Describe your ideal AI coach in plain English — ElevenLabs generates a custom
voice using the v3 model (same as the website) and the description becomes
the assistant's personality.

Usage:
    python setup_personality.py
"""

import json
import os

import requests
from dotenv import load_dotenv
load_dotenv()

from elevenlabs import ElevenLabs

PERSONALITY_FILE = os.path.join(os.path.dirname(__file__), "personality.json")

PREVIEW_TEXT = (
    "Hello there! I'm your new AI assistant. I'll be right here helping you "
    "navigate the world around you. Just ask me anything — what's in front of "
    "you, what time it is, or even what you saw a few minutes ago. I've got "
    "you covered. So, what would you like to know?"
)


def generate_voice_preview(api_key: str, description: str) -> str | None:
    """Call ElevenLabs voice design API directly to use the v3 model."""
    resp = requests.post(
        "https://api.elevenlabs.io/v1/text-to-voice/design",
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
        },
        json={
            "voice_description": description,
            "text": PREVIEW_TEXT,
            "model_id": "eleven_ttv_v3",
        },
    )
    if resp.status_code != 200:
        print(f"  ❌ ElevenLabs API error {resp.status_code}: {resp.text[:200]}")
        return None

    data = resp.json()
    previews = data.get("previews", [])
    if not previews:
        print("  ❌ No voice previews returned.")
        return None

    return previews[0]["generated_voice_id"]


def setup():
    print("\n🎭 i-spy — Personality Setup")
    print("=" * 40)
    print("\nDescribe your ideal AI assistant in plain English.")
    print("Include anything: accent, tone, personality, gender, style.")
    print("\nExamples:")
    print('  "A funny guy with a thick Russian accent"')
    print('  "A calm British woman who speaks like a librarian"')
    print('  "An energetic Australian surfer dude"')
    print()

    user_input = input("Describe your assistant → ").strip()
    if not user_input:
        user_input = "A calm, warm, and patient assistant with a natural voice"

    api_key = os.environ["ELEVENLABS_API_KEY"]

    # ── Step 1: Generate voice with v3 model ────────────────────────
    print("\n[Step 1/2] Generating custom voice with ElevenLabs (v3 model)...")

    generated_id = generate_voice_preview(api_key, user_input)
    if not generated_id:
        return

    print("  ✅ Voice preview generated")

    # ── Step 2: Save the voice permanently ──────────────────────────
    print("\n[Step 2/2] Saving voice to your ElevenLabs account...")

    el_client = ElevenLabs(api_key=api_key)
    voice_name = f"i-spy-{user_input[:30].replace(' ', '-').lower()}"
    voice = el_client.text_to_voice.create(
        voice_name=voice_name,
        voice_description=user_input,
        generated_voice_id=generated_id,
    )

    personality = {
        "name": user_input[:50],
        "description": (
            f"You are an AI vision assistant for a blind user. "
            f"Your personality: {user_input}. "
            f"Stay in character at all times."
        ),
        "voice_id": voice.voice_id,
        "voice_name": voice.name,
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.3,
        },
    }

    with open(PERSONALITY_FILE, "w") as f:
        json.dump(personality, f, indent=2)

    print(f"\n{'=' * 40}")
    print(f"✅ Done!\n")
    print(f"  Voice: {voice.name} (ID: {voice.voice_id})")
    print(f"  Personality: {user_input}")
    print(f"\n💾 Saved to {PERSONALITY_FILE}")
    print("Run 'python main.py' to start with this personality.\n")


if __name__ == "__main__":
    setup()
