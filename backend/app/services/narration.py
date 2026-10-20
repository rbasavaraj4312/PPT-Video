"""Compatibility import; the main backend never instantiates the voice engine."""
from voice_service.service import NarrationService, atomic_json, audio_duration

__all__ = ["NarrationService", "atomic_json", "audio_duration"]
