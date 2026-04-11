"""
Session memory — stores captured frames, timestamps, and conversation history.
Allows the user to ask about things they've seen earlier in the session.
"""

import base64
import time
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class SessionEntry:
    """A single captured moment in the session."""
    timestamp: float
    image_bytes: bytes
    user_query: str
    assistant_response: str
    description: str = ""   # Short auto-description for context retrieval

    @property
    def timestamp_readable(self) -> str:
        return time.strftime("%H:%M:%S", time.localtime(self.timestamp))

    @property
    def image_base64(self) -> str:
        return base64.b64encode(self.image_bytes).decode("utf-8")

    def to_context_summary(self) -> str:
        """Compact string for injecting as past context."""
        return (
            f"[{self.timestamp_readable}] "
            f"User asked: \"{self.user_query}\" | "
            f"Scene: {self.description or '(no description)'}"
        )


class SessionMemory:
    """
    Holds the full conversation + visual history for a session.
    Designed to be serializable for future persistence across sessions.
    """

    def __init__(self):
        self.entries: list[SessionEntry] = []
        self.conversation_history: list[dict] = []  # Gemini-format messages
        self.session_start: float = time.time()

    def add_entry(self, entry: SessionEntry):
        self.entries.append(entry)

    def add_to_conversation(self, role: str, text: str):
        """Add a turn to the Gemini conversation history (text only)."""
        self.conversation_history.append({
            "role": role,
            "parts": [{"text": text}]
        })

    def get_recent_context(self, limit: int = 10) -> str:
        """
        Returns a compact text summary of the last `limit` entries.
        Injected into the system prompt so the model knows what was seen earlier.
        """
        recent = self.entries[-limit:]
        if not recent:
            return "No previous observations in this session."
        lines = ["Session history (oldest first):"]
        for entry in recent:
            lines.append(entry.to_context_summary())
        return "\n".join(lines)

    def get_conversation_history(self, limit: int = 20) -> list[dict]:
        """Returns recent conversation turns for multi-turn context."""
        return self.conversation_history[-limit:]

    def elapsed_minutes(self) -> float:
        return (time.time() - self.session_start) / 60
