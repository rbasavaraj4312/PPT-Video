"""Conservative PCM boundary detection; no inference or audio rewriting."""
from array import array
import math
import sys
import wave


def speech_bounds(path, captions=()):
    with wave.open(str(path), 'rb') as source:
        rate = source.getframerate()
        duration = source.getnframes() / rate * 1000
        if source.getsampwidth() != 2:
            return dict(audio_start_ms=0, audio_end_ms=duration)
        window = max(1, rate // 100)
        levels = []
        while raw := source.readframes(window):
            samples = array('h', raw)
            if sys.byteorder != 'little':
                samples.byteswap()
            levels.append(math.sqrt(sum(value * value for value in samples) / len(samples)) / 32768)
    threshold = max(.0003, max(levels, default=0) * .002)
    active = [index for index, level in enumerate(levels) if level > threshold]
    if not active:
        return dict(audio_start_ms=0, audio_end_ms=duration)
    start, end = active[0] * window / rate * 1000, (active[-1] + 1) * window / rate * 1000
    if captions:
        start = min(start, min(c['startMs'] for c in captions))
        end = max(end, max(c['endMs'] for c in captions))
    return dict(audio_start_ms=max(0, start - 80), audio_end_ms=min(duration, end + 120))
