"""
Custom ADK tools for the i-spy vision assistant.
"""

import os
import time
from datetime import datetime
from zoneinfo import ZoneInfo

from google import genai
from google.genai import types as genai_types
from google.adk.tools import ToolContext


def get_current_time(timezone: str) -> dict:
    """Returns the current date and time in the specified timezone.

    Args:
        timezone: IANA timezone name, e.g. "America/New_York", "Europe/London", "Asia/Tokyo", "UTC".
    """
    try:
        tz = ZoneInfo(timezone)
        now = datetime.now(tz)
        return {
            "status": "success",
            "timezone": timezone,
            "datetime": now.strftime("%Y-%m-%d %H:%M:%S %Z"),
            "time": now.strftime("%I:%M %p"),
            "date": now.strftime("%A, %B %d, %Y"),
        }
    except Exception as e:
        return {"status": "error", "message": f"Unknown timezone: {timezone}. Use IANA format like 'America/New_York'."}


def recall_past_observations(query: str, tool_context: ToolContext) -> dict:
    """Searches the user's session memory for past observations. Use this when the user
    asks about something they saw earlier, or wants to compare current and past scenes.

    Args:
        query: What to search for in past observations, e.g. "dog", "red car", "the person I saw earlier".
    """
    observations = tool_context.state.get("observations", [])

    if not observations:
        return {"status": "no_history", "message": "No observations recorded yet in this session."}

    query_lower = query.lower()
    matches = []
    for obs in observations:
        desc = obs.get("description", "").lower()
        user_q = obs.get("user_query", "").lower()
        response = obs.get("assistant_response", "").lower()

        if query_lower in desc or query_lower in user_q or query_lower in response:
            matches.append(obs)

    # If no keyword matches, return the most recent observations as context
    if not matches:
        matches = observations[-5:]

    results = []
    for obs in matches[-5:]:  # Cap at 5 results
        results.append({
            "time": obs.get("time_readable", ""),
            "minutes_ago": round((time.time() - obs.get("timestamp", 0)) / 60, 1),
            "scene": obs.get("description", "(no description)"),
            "user_asked": obs.get("user_query", ""),
            "assistant_said": obs.get("assistant_response", ""),
        })

    return {
        "status": "success",
        "total_observations": len(observations),
        "matches_found": len(results),
        "results": results,
    }


# Lazy-init client for web search
_search_client = None


def _get_search_client():
    global _search_client
    if _search_client is None:
        _search_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    return _search_client


def web_search(query: str) -> dict:
    """Searches the web using Google Search for real-time information like weather,
    news, sports scores, current events, or any factual question you're unsure about.

    Args:
        query: The search query, e.g. "weather in New Haven", "latest news about AI".
    """
    try:
        client = _get_search_client()
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=query,
            config=genai_types.GenerateContentConfig(
                tools=[genai_types.Tool(google_search=genai_types.GoogleSearch())],
                tool_config=genai_types.ToolConfig(
                    include_server_side_tool_invocations=True,
                ),
                temperature=0.1,
                max_output_tokens=256,
            ),
        )
        # Extract text parts only (skip function_call parts)
        text_parts = []
        if response.candidates and response.candidates[0].content:
            for part in response.candidates[0].content.parts:
                if hasattr(part, "text") and part.text:
                    text_parts.append(part.text)

        if text_parts:
            return {"status": "success", "answer": " ".join(text_parts)}
        else:
            return {"status": "error", "message": "Search returned no results."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
