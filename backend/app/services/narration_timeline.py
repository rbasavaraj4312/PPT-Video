import json
import math


def narration_ready(n):
    return bool(n and n.asset_id and n.duration_ms > 0 and n.generated_script == n.script.strip()
                and n.generated_engine == n.engine and n.generated_voice_id == n.voice_id)


def validate_narrations(presentation, service):
    if not presentation.slides:
        raise ValueError("Add at least one slide")
    for slide in presentation.slides:
        n = slide.narration
        if n and n.script.strip():
            if not narration_ready(n):
                raise ValueError(f'Generate current narration for "{slide.title}" before exporting.')
            result = json.loads(service.asset(n.asset_id, "result.json").read_text())
            for field in ["duration_ms", "generated_script", "generated_engine", "generated_voice_id"]:
                if result[field] != getattr(n, field):
                    raise ValueError(f'Narration metadata does not match audio for "{slide.title}".')
            service.asset(n.asset_id, "narration.wav")
            if any(c.endMs > n.duration_ms + 500 for c in n.captions):
                raise ValueError("Caption timing exceeds audio duration")


def audio_bounds(n, fps=30):
    duration = max(1, math.ceil(n.duration_ms / 1000 * fps))
    start = max(0, math.floor((n.audio_start_ms or 0) / 1000 * fps))
    end = min(duration, math.ceil((n.audio_end_ms if n.audio_end_ms is not None else n.duration_ms) / 1000 * fps))
    if n.captions:
        start = min(start, max(0, math.floor((min(c.startMs for c in n.captions) - 80) / 1000 * fps)))
        end = max(end, min(duration, math.ceil((max(c.endMs for c in n.captions) + 120) / 1000 * fps)))
    if start >= end:
        return 0, duration
    return start, end - start


def timeline(presentation, fps=30):
    """Same frame rounding contract as frontend/src/narration/timeline.js."""
    cursor, items = 0, []
    for index, slide in enumerate(presentation.slides):
        n = slide.narration
        narrated = narration_ready(n) and bool(n.script.strip())
        audio_from, audio_frames = audio_bounds(n, fps) if narrated else (0, 0)
        hold = max(1, math.ceil(max(500, slide.slide_duration * 1000) / 1000 * fps))
        if narrated:
            audio_hold = audio_frames + (math.ceil(n.padding_ms / 1000 * fps) if index < len(presentation.slides) - 1 else 0)
            hold = audio_hold if n.fit_to_audio else max(hold, audio_hold)
        items.append(dict(start=cursor, hold=hold, transition=0, transition_start=cursor + hold,
                          audio_from=audio_from, audio_frames=audio_frames))
        cursor += hold
    for index, (slide, item) in enumerate(zip(presentation.slides, items)):
        if index == len(items) - 1 or slide.transition_type == "none":
            continue
        next_item = items[index + 1]
        lower = item['start'] + math.ceil(item['hold'] / 2)
        upper = next_item['start'] + math.floor(next_item['hold'] / 2)
        requested = math.ceil(max(0, slide.transition_duration) * fps)
        item['transition'] = min(requested, upper - lower)
        offset = slide.transition_offset_ms / 1000 * fps if slide.transition_timing == 'manual' else 0
        # JavaScript Math.round rounds halves toward positive infinity.
        center_start = math.floor(next_item['start'] + offset - item['transition'] / 2 + .5)
        item['transition_start'] = max(lower, min(upper - item['transition'], center_start))
    return items, max(1, cursor)


def srt(presentation):
    def stamp(ms):
        value = max(0, round(ms))
        hours, value = divmod(value, 3600000)
        minutes, value = divmod(value, 60000)
        seconds, millis = divmod(value, 1000)
        return f"{hours:02}:{minutes:02}:{seconds:02},{millis:03}"
    items, _ = timeline(presentation)
    blocks = []
    for slide, item in zip(presentation.slides, items):
        n = slide.narration
        if not narration_ready(n) or not n.script.strip() or not n.caption_style.enabled:
            continue
        size = n.caption_style.words_per_phrase
        for offset in range(0, len(n.captions), size):
            phrase = n.captions[offset:offset + size]
            if not phrase:
                continue
            base_ms = (item["start"] - item["audio_from"]) * 1000 / 30
            text = " ".join(c.text.strip() for c in phrase)
            blocks.append(f"{len(blocks)+1}\n{stamp(base_ms + phrase[0].startMs)} --> {stamp(base_ms + phrase[-1].endMs)}\n{text}\n")
    return "\n".join(blocks)
