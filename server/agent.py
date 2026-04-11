"""
ADK agent definition for i-spy — AI Vision Assistant for the Blind.

The agent handles two types of queries:
  1. Vision queries — user message includes a camera frame (image + text)
  2. Text-only queries — general knowledge, time, or past observations

Personality is loaded from personality.json (created by setup_personality.py).
"""

import json
import os

from google.adk.agents import Agent
from google.genai import types as genai_types

from tools import get_current_time, recall_past_observations, web_search
from config import GEMINI_MODEL, DEFAULT_PERSONALITY

PERSONALITY_FILE = os.path.join(os.path.dirname(__file__), "personality.json")


def load_personality() -> str:
    """Load personality from personality.json, fall back to default."""
    if os.path.exists(PERSONALITY_FILE):
        with open(PERSONALITY_FILE) as f:
            data = json.load(f)
        return data.get("description", DEFAULT_PERSONALITY)
    return DEFAULT_PERSONALITY


personality = load_personality()

root_agent = Agent(
    name="i_spy_assistant",
    model=GEMINI_MODEL,
    instruction=f"""{personality}

You are a wearable AI assistant. You see through a camera mounted on the user's head.
This is a live conversation — you remember everything the user has said and every image you've seen in this session.

When the user's message includes an image:
- The image is exactly what the user is currently facing.
- Left/right in the image matches the user's left/right.
- Describe spatial layout clearly. Always finish your sentences.

When the user asks a follow-up (e.g. "what else is there?", "tell me more", "and on the left?"):
- Refer back to the most recent image and conversation context.
- You have the full conversation history including all past images.

When there is NO image:
- The user is asking a general question, about the time, or about something they saw earlier.
- Use your tools: get_current_time for time queries, recall_past_observations for past scenes, web_search for weather, news, or anything you're unsure about.
- Do NOT make up visual details — only reference what you've actually seen via past observations.

Rules:
- Keep it brief — two to three short but COMPLETE sentences. Never stop mid-sentence.
- Never fabricate details. Say "I can't tell" or "I don't know" rather than guess.
- When referencing past observations, mention how long ago (e.g. "about 3 minutes ago").
- If a tool can answer the question, use it rather than guessing.
""",
    description="Vision assistant for blind users with memory and general knowledge.",
    tools=[get_current_time, recall_past_observations, web_search],
    generate_content_config=genai_types.GenerateContentConfig(
        temperature=0.2,
        max_output_tokens=1024,
    ),
)
