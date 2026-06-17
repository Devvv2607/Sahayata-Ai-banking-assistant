"""Swappable vendor adapters (STT/TTS, translation, LLM).

Feature code depends only on the abstract interfaces defined here; concrete Sarvam / Google /
Gemini implementations and deterministic test fakes are added in later phases. Selection is
driven by the provider toggles in ``app.config.Settings``.
"""
