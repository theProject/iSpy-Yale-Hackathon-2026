"""
Vision + conversation engine powered by Gemini 1.5 Flash.
Handles both "what do I see right now?" and "what did I see earlier?" queries.
"""

import time
from typing import Optional

from google import genai
from google.genai import types

from config import GEMINI_MODEL, SESSION_CONTEXT_LIMIT, DEFAULT_PERSONALITY
from session import SessionMemory, SessionEntry


def build_system_prompt(personality: str, session: SessionMemory) -> str:
    """
    Builds the full system prompt: personality + session memory context.
    Refreshed on every call so history is always current.
    """
    past_context = session.get_recent_context(limit=SESSION_CONTEXT_LIMIT)
    return f"""{personality}

--- Current session context ---
Session started {session.elapsed_minutes():.1f} minutes ago.
{past_context}
---

Instructions:
- You see through a camera mounted on the user's head (like a cap). The image you receive is exactly what the user is facing. "In front of me" means the center of the frame. Left/right in the image matches the user's left/right.
- Be brief and direct. The user cannot see — paint the picture with words.
- When answering about something seen earlier, reference the time (e.g. "about 3 minutes ago").
- If the current frame is not relevant to the question, say so and answer from memory.
- Never fabricate details. Say "I can't tell" rather than guess.
- Spatial descriptions matter: left/right, near/far, center of frame.
"""


class VisionAgent:
    """
    Core agent. Takes a user query + optional image frame and returns a response.
    Maintains conversation history for multi-turn dialogue.
    """

    def __init__(self, api_key: str, personality: str = DEFAULT_PERSONALITY):
        self.client = genai.Client(api_key=api_key)
        self.personality = personality
        self.session = SessionMemory()

    def set_personality(self, personality: str):
        """Update personality at runtime — user can reconfigure anytime."""
        self.personality = personality
        print(f"[Agent] Personality updated.")

    def ask(self, query: str, image_bytes: Optional[bytes] = None) -> str:
        """
        Main entry point. Pass image_bytes if you have a fresh frame.
        If image_bytes is None, the agent answers from memory only.

        Returns the assistant's text response.
        """
        system_context = build_system_prompt(self.personality, self.session)

        # Build current turn parts
        parts = []
        if image_bytes:
            parts.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))
        parts.append(types.Part.from_text(text=query))

        # Construct full message list: history + current query
        history = self.session.get_conversation_history(limit=16)
        contents = []
        for msg in history:
            role = msg["role"] if msg["role"] != "model" else "model"
            contents.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=p["text"]) for p in msg["parts"]],
            ))
        contents.append(types.Content(role="user", parts=parts))

        # Call Gemini
        response = self.client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_context,
                temperature=0.2,
                max_output_tokens=1024,
            ),
        )

        response_text = response.text.strip()

        # Persist to session memory
        description = (
            self._extract_scene_description(image_bytes) if image_bytes else ""
        )
        entry = SessionEntry(
            timestamp=time.time(),
            image_bytes=image_bytes or b"",
            user_query=query,
            assistant_response=response_text,
            description=description,
        )
        self.session.add_entry(entry)

        # Update conversation history (text only — images not stored in history to save tokens)
        self.session.add_to_conversation("user", query)
        self.session.add_to_conversation("model", response_text)

        return response_text

    def _extract_scene_description(self, image_bytes: bytes) -> str:
        """
        Generates a short 1-sentence scene description for memory indexing.
        Called in the background — used when the user asks about past observations.
        """
        try:
            response = self.client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[
                    types.Content(role="user", parts=[
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                        types.Part.from_text(text="Describe this scene in one sentence, focusing on key objects and spatial layout. Be factual."),
                    ]),
                ],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=60,
                ),
            )
            return response.text.strip()
        except Exception:
            return ""
