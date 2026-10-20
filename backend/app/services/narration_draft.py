"""Turn slide-wise narration into editable, bounded layouts without loading models."""
import re
import textwrap
import uuid
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from ..models.presentation import PresentationModel, SlideModel, NarrationModel, ElementModel
from .slide_compiler import THEMES

HEADER = re.compile(r'^\s*(?:#{1,6}[ \t]*)?(?:slide|scene)[ \t]+(\d+)[ \t]*(?::|[—–-]|$)[ \t]*', re.I | re.M)


class DraftSlide(BaseModel):
    number: int = Field(ge=1)
    title: str = Field(min_length=1, max_length=90)
    script: str = Field(min_length=1, max_length=12000)
    points: list[str] = Field(min_length=1, max_length=3)
    layout: Literal['focus', 'key_points'] = 'key_points'

    @field_validator('script', 'title')
    @classmethod
    def not_blank(cls, value):
        if not value.strip():
            raise ValueError('Text must not be blank')
        return value

    @field_validator('points')
    @classmethod
    def valid_points(cls, values):
        if any(not text.strip() or len(text) > 180 for text in values):
            raise ValueError('Visual excerpts must contain 1–180 characters each')
        return values


class DraftTextRequest(BaseModel):
    text: str = Field(min_length=1, max_length=400000)


class DraftBuildRequest(BaseModel):
    slides: list[DraftSlide] = Field(min_length=1, max_length=100)
    aspect_ratio: Literal['16:9', '9:16'] = '16:9'
    theme: Literal['modern-dark', 'clean-light', 'midnight', 'emerald-dark', 'sunset'] = 'modern-dark'


def excerpt(text, limit):
    text = re.sub(r'\s+', ' ', text).strip()
    if len(text) <= limit:
        return text
    head = text[:limit - 1]
    return (head.rsplit(' ', 1)[0] if ' ' in head else head) + '…'


def parse_narration(text):
    text = text.lstrip('\ufeff').strip()
    if text.startswith('```') and text.endswith('```'):
        text = text.split('\n', 1)[-1].rsplit('```', 1)[0].strip()
    if not text:
        raise ValueError('Paste narration or upload a text file first.')
    headers = list(HEADER.finditer(text))
    if headers and text[:headers[0].start()].strip():
        raise ValueError('Place all narration under a Slide 1: heading. Remove text before the first slide.')
    if len(headers) > 100:
        raise ValueError('Import up to 100 slides at a time.')
    parts = [(int(match[1]), text[match.end():headers[index + 1].start() if index + 1 < len(headers) else len(text)].strip())
             for index, match in enumerate(headers)] if headers else [(1, text)]
    numbers, slides = set(), []
    for number, script in parts:
        if number < 1 or number in numbers:
            raise ValueError(f'Slide {number}: use unique positive slide numbers.')
        numbers.add(number)
        if not script:
            raise ValueError(f'Slide {number} has no narration. Add its explanation before importing.')
        if len(script) > 12000:
            raise ValueError(f'Slide {number} exceeds 12,000 characters. Split it into smaller slides.')
        sentences = [s.strip() for s in re.split(r'(?<=[.!?。！？])[ \t\r\n]+|\n\s*\n', script) if s.strip()]
        points = [excerpt(sentence, 140) for sentence in sentences[:3]]
        slides.append(DraftSlide(number=number, title=excerpt(sentences[0], 65), script=script,
                                 points=points, layout='focus' if len(points) == 1 else 'key_points'))
    return slides


def build_draft(request):
    theme = THEMES[request.theme]
    vertical = request.aspect_ratio == '9:16'
    width, height, margin = (720, 1280, 48) if vertical else (1280, 720, 64)
    slides = []
    for index, draft in enumerate(request.slides):
        elements = []

        def add(kind, role, **values):
            elements.append(ElementModel(id='el-' + uuid.uuid4().hex, type=kind, morph_id='narration-' + role,
                                         z_index=len(elements), **values))

        def text(role, content, x, y, w, h, size, color, bold=False):
            visual = re.sub(r'\s+', ' ', content).strip()
            char_factor = 1 if any(ord(c) >= 0x2e80 for c in visual) else .7 if not visual.isascii() else .55
            if any(len(word) * size > w for word in visual.split()):
                char_factor = 1
            while True:
                lines = textwrap.wrap(visual, width=max(1, int(w / (size * char_factor))), break_on_hyphens=False)
                if len(lines) * size * 1.25 <= h or size <= 16:
                    break
                size -= 2
            add('text', role, content='\n'.join(lines), x=x, y=y, width=w, height=h, font_size=size,
                font_color=color, font_weight='bold' if bold else 'normal', font_family='Arial')

        add('rectangle', 'accent', x=margin, y=52, width=46, height=4, fill=theme['accent'], stroke_width=0)
        text('index', f'{index + 1:02d} / {len(request.slides):02d}', width - margin - 130, 38, 130, 35, 18, theme['body_color'])
        text('title', draft.title, margin, 105, width - margin * 2, 150 if vertical else 130,
             42 if vertical else 48, theme['title_color'], True)
        points = draft.points[:1] if draft.layout == 'focus' else draft.points
        gap, top = 22, (320 if vertical else 290)
        card_width = width - margin * 2 if vertical or draft.layout == 'focus' else (width - margin * 2 - gap * (len(points) - 1)) / len(points)
        card_height = (205 if vertical else 290) if draft.layout != 'focus' else (530 if vertical else 290)
        for position, point in enumerate(points):
            x = margin if vertical else margin + position * (card_width + gap)
            y = top + position * (card_height + gap) if vertical else top
            add('rounded_rectangle', f'card-{position}', x=x, y=y, width=card_width, height=card_height,
                fill=theme['card_fill'], stroke=theme['card_stroke'], stroke_width=1, radius=18)
            text(f'number-{position}', f'{position + 1:02d}', x + 24, y + 20, 60, 30, 18, theme['accent'], True)
            text(f'point-{position}', point, x + 24, y + 64, card_width - 48, card_height - 84,
                 30 if draft.layout == 'focus' else 24, theme['title_color'])
        slides.append(SlideModel(id='slide-' + uuid.uuid4().hex, title=draft.title, background=theme['background'],
            transition_type='morph', transition_duration=.8, elements=elements,
            narration=NarrationModel(script=draft.script, padding_ms=0,
                caption_style={'highlight': theme['accent'], 'font_size': 28})))
    return PresentationModel(id='pres-' + uuid.uuid4().hex, title=request.slides[0].title,
                             aspect_ratio=request.aspect_ratio, slides=slides)
