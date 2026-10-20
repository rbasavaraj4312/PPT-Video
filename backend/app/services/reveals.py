"""Export preflight for word-linked reveals. No inference imports."""
import json
import math
import re
import unicodedata

from .narration_timeline import narration_ready, timeline


def fingerprint(text):
    value = 2166136261
    for byte in text.encode('utf-8'):
        value = ((value ^ byte) * 16777619) & 0xffffffff
    return f'{value:08x}'


def normalize_word(text):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFC', text).strip().lower())


def reveal_anchors(narration):
    sequence = json.dumps([normalize_word(word.text) for word in narration.captions], ensure_ascii=False, separators=(',', ':'))
    return dict(script_hash=fingerprint(narration.script.strip()), token_sequence_hash=fingerprint(sequence))


def validate_reveals(presentation, fps=30):
    items, _ = timeline(presentation, fps)
    for index, (slide, item) in enumerate(zip(presentation.slides, items)):
        for element in slide.elements:
            cue = element.reveal
            if cue is None:
                continue
            label = f'Reveal on "{slide.title}" ({element.id})'
            n = slide.narration
            if not narration_ready(n) or not n.captions:
                raise ValueError(f'{label}: generate current narration to link words.')
            anchors = reveal_anchors(n)
            word = n.captions[cue.word_index] if cue.word_index < len(n.captions) else None
            if anchors['script_hash'] != cue.script_hash or anchors['token_sequence_hash'] != cue.token_sequence_hash or not word or normalize_word(word.text) != normalize_word(cue.word_text):
                raise ValueError(f'{label}: needs relinking because narration words changed.')
            trigger = item['start'] - item['audio_from'] + math.ceil((word.startMs + cue.offset_ms) / 1000 * fps)
            previous = items[index - 1] if index else None
            start = previous['transition_start'] if previous and previous['transition'] else item['start']
            end = item['transition_start'] + item['transition'] if item['transition'] else item['start'] + item['hold']
            if trigger < start or trigger >= end:
                raise ValueError(f'{label}: trigger falls outside the slide’s visible interval. Adjust its word, offset, or transition.')
