"""Request metadata shared by the API and worker; no inference dependencies."""
from typing import Literal
from pydantic import BaseModel, Field, field_validator


class GenerateRequest(BaseModel):
    voice_id: str = Field(pattern=r'^voice-[a-f0-9]{32}$')
    engine: Literal['omnivoice', 'pocket'] = 'omnivoice'
    script: str = Field(min_length=1, max_length=12000)

    @field_validator('script')
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError('Enter narration text')
        return value


class BatchSlide(GenerateRequest):
    slide_id: str = Field(min_length=1, max_length=100)


class BatchGenerateRequest(BaseModel):
    id: str = Field(pattern=r'^batch-[a-f0-9]{32}$')
    presentation_id: str = Field(min_length=1, max_length=100)
    slides: list[BatchSlide] = Field(min_length=1, max_length=100)

    @field_validator('slides')
    @classmethod
    def distinct_slides(cls, values):
        if len({slide.slide_id for slide in values}) != len(values):
            raise ValueError('Each slide may appear only once in a voice batch')
        return values
