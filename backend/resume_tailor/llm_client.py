"""
AVSAR — LLM Client (Anthropic Claude with OpenAI fallback)
===========================================================
Clean abstraction so the LLM provider can be swapped via env var.
Set LLM_PROVIDER=anthropic (default) or LLM_PROVIDER=openai.

Required env vars:
    ANTHROPIC_API_KEY  (if using anthropic)
    OPENAI_API_KEY     (if using openai)
"""

import logging
import os

log = logging.getLogger(__name__)

PROVIDER = os.environ.get("LLM_PROVIDER", "anthropic").lower()


def chat(system_prompt: str, user_message: str, max_tokens: int = 2000) -> str:
    """
    Send a chat request to the configured LLM provider.
    Returns the response content as a string.
    Raises RuntimeError if the provider is not configured.
    """
    if PROVIDER == "anthropic":
        return _anthropic_chat(system_prompt, user_message, max_tokens)
    elif PROVIDER == "openai":
        return _openai_chat(system_prompt, user_message, max_tokens)
    else:
        raise RuntimeError(f"Unknown LLM_PROVIDER: '{PROVIDER}'. Use 'anthropic' or 'openai'.")


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
        model="claude-3-5-haiku-20241022",  # fast and cheap for structured tasks
        max_tokens=max_tokens,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    return message.content[0].text


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
