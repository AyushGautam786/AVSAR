"""
AVSAR — Multi-Provider LLM Client
==================================
Clean abstraction supporting both free and premium LLM providers:
  - gemini     : Google Gemini 1.5 Flash / 2.0 (100% FREE via Google AI Studio)
  - groq       : Groq Llama 3.3 70B / 3.1 8B (100% FREE, ultra-fast inference)
  - openrouter : OpenRouter Free Models
  - anthropic  : Claude 3.5 Haiku / Sonnet
  - openai     : GPT-4o / GPT-4o-mini

Configure in backend/.env:
    LLM_PROVIDER=gemini        # or groq / anthropic / openai / openrouter
    GEMINI_API_KEY=...         # Free from https://aistudio.google.com/
    GROQ_API_KEY=...           # Free from https://console.groq.com/keys
"""

import logging
import os
import requests

log = logging.getLogger(__name__)


def chat(system_prompt: str, user_message: str, max_tokens: int = 2000) -> str:
    """
    Send a chat request to the configured LLM provider.
    Returns the response content as a string.
    """
    provider = os.environ.get("LLM_PROVIDER", "gemini").lower().strip()

    if provider == "gemini":
        return _gemini_chat(system_prompt, user_message, max_tokens)
    elif provider == "groq":
        return _groq_chat(system_prompt, user_message, max_tokens)
    elif provider == "openrouter":
        return _openrouter_chat(system_prompt, user_message, max_tokens)
    elif provider == "anthropic":
        return _anthropic_chat(system_prompt, user_message, max_tokens)
    elif provider == "openai":
        return _openai_chat(system_prompt, user_message, max_tokens)
    else:
        # Auto-detect based on available keys
        if os.environ.get("GEMINI_API_KEY"):
            return _gemini_chat(system_prompt, user_message, max_tokens)
        elif os.environ.get("GROQ_API_KEY"):
            return _groq_chat(system_prompt, user_message, max_tokens)
        elif os.environ.get("ANTHROPIC_API_KEY"):
            return _anthropic_chat(system_prompt, user_message, max_tokens)
        elif os.environ.get("OPENAI_API_KEY"):
            return _openai_chat(system_prompt, user_message, max_tokens)
        raise RuntimeError(f"Unknown or unconfigured LLM_PROVIDER '{provider}'. Set GEMINI_API_KEY, GROQ_API_KEY, or ANTHROPIC_API_KEY in backend/.env")


# ── 1. Google Gemini (100% Free via Google AI Studio) ─────────────────────────

def _gemini_chat(system_prompt: str, user_message: str, max_tokens: int) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable not set. Get a free key at https://aistudio.google.com/")

    # Try gemini-1.5-flash or gemini-2.0-flash
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "contents": [
            {"role": "user", "parts": [{"text": user_message}]}
        ],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.2
        }
    }

    resp = requests.post(url, json=payload, timeout=45)
    if resp.status_code != 200:
        raise RuntimeError(f"Gemini API error ({resp.status_code}): {resp.text}")

    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise RuntimeError(f"Unexpected Gemini response structure: {data}") from exc


# ── 2. Groq (100% Free & Blazing Fast via Groq Cloud) ─────────────────────────

def _groq_chat(system_prompt: str, user_message: str, max_tokens: int) -> str:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY environment variable not set. Get a free key at https://console.groq.com/keys")

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
        "max_tokens": max_tokens,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    if resp.status_code != 200:
        raise RuntimeError(f"Groq API error ({resp.status_code}): {resp.text}")

    data = resp.json()
    return data["choices"][0]["message"]["content"]


# ── 3. OpenRouter Free Tier ───────────────────────────────────────────────────

def _openrouter_chat(system_prompt: str, user_message: str, max_tokens: int) -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY environment variable not set.")

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": os.environ.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-exp:free"),
        "max_tokens": max_tokens,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]
    }

    resp = requests.post(url, headers=headers, json=payload, timeout=40)
    if resp.status_code != 200:
        raise RuntimeError(f"OpenRouter API error ({resp.status_code}): {resp.text}")

    data = resp.json()
    return data["choices"][0]["message"]["content"]


# ── 4. Anthropic Claude ───────────────────────────────────────────────────────

def _anthropic_chat(system_prompt: str, user_message: str, max_tokens: int) -> str:
    try:
        import anthropic
    except ImportError:
        raise RuntimeError("anthropic package not installed. Run: pip install anthropic")

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY environment variable not set.")

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-3-5-haiku-20241022",
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    return message.content[0].text


# ── 5. OpenAI ─────────────────────────────────────────────────────────────────

def _openai_chat(system_prompt: str, user_message: str, max_tokens: int) -> str:
    try:
        from openai import OpenAI
    except ImportError:
        raise RuntimeError("openai package not installed. Run: pip install openai")

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable not set.")

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content
