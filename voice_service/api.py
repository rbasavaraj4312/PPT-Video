import math
import tempfile
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field, field_validator

from backend.app.models.presentation import PresentationModel
from backend.app.services.narration_timeline import srt, validate_narrations


class GenerateRequest(BaseModel):
    voice_id: str = Field(pattern=r"^voice-[a-f0-9]{32}$")
    engine: Literal["omnivoice", "pocket"] = "omnivoice"
    script: str = Field(min_length=1, max_length=12000)

    @field_validator("script")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("Enter narration text")
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


def create_router(narration_service):
    router = APIRouter(prefix="/api/speech", tags=["narration"])

    def translate_error(exc):
        if isinstance(exc, FileNotFoundError):
            raise HTTPException(404, str(exc))
        raise HTTPException(400, str(exc))


    @router.get("/capabilities")
    def capabilities():
        return narration_service.capabilities()


    @router.get("/voices")
    def voices():
        return narration_service.profiles()


    @router.post("/voices", status_code=201)
    def create_voice(name: str = Form(..., min_length=1, max_length=100),
                     transcript: str = Form(..., min_length=1, max_length=3000),
                     start: float = Form(0), end: float | None = Form(None),
                     audio: UploadFile = File(...)):
        if not name.strip() or not transcript.strip():
            raise HTTPException(400, "Name and exact reference transcript are required")
        if not math.isfinite(start) or start < 0 or (end is not None and (not math.isfinite(end) or end <= start)):
            raise HTTPException(400, "Invalid trim interval")
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "upload"
            total = 0
            with path.open("wb") as out:
                while chunk := audio.file.read(1024 * 1024):
                    total += len(chunk)
                    if total > 20 * 1024 * 1024:
                        raise HTTPException(413, "Reference audio must be smaller than 20 MB")
                    out.write(chunk)
            try:
                return narration_service.create_profile(name, transcript, path, start, end)
            except Exception as exc:
                translate_error(exc)


    @router.get("/voices/{voice_id}/reference")
    def reference(voice_id: str):
        try:
            narration_service.profile(voice_id)
            return FileResponse(narration_service.root / "voices" / voice_id / "reference.wav", media_type="audio/wav")
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)


    @router.post("/generate", status_code=202)
    def generate(request: GenerateRequest):
        try:
            return narration_service.generate(request)
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)


    @router.get("/jobs/{job_id}")
    def job(job_id: str):
        try:
            return narration_service.get_job(job_id)
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)


    @router.post('/batches', status_code=202)
    def generate_batch(request: BatchGenerateRequest):
        try:
            return narration_service.generate_batch(request)
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)


    @router.get('/batches/{batch_id}')
    def batch(batch_id: str):
        try:
            return narration_service.get_batch(batch_id)
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)


    @router.delete('/batches/{batch_id}')
    def cancel_batch(batch_id: str):
        try:
            return narration_service.cancel_batch(batch_id)
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)


    @router.delete("/jobs/{job_id}")
    def cancel(job_id: str):
        try:
            return narration_service.cancel(job_id)
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)


    @router.get("/assets/{asset_id}/{filename}")
    def asset(asset_id: str, filename: str):
        try:
            if filename == "result.json":
                return narration_service.asset_result(asset_id)
            path = narration_service.asset(asset_id, filename)
            return FileResponse(path, media_type="audio/wav" if filename.endswith(".wav") else "application/json",
                                filename=filename)
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)


    @router.post("/render", status_code=202)
    def render(presentation: PresentationModel):
        try:
            return narration_service.render(presentation)
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)


    @router.get("/jobs/{job_id}/video")
    def video(job_id: str):
        try:
            state = narration_service.get_job(job_id)
            path = narration_service.root / "jobs" / job_id / "video.mp4"
            if state["status"] != "complete" or state["kind"] != "render" or not path.exists():
                raise FileNotFoundError("Video is not ready")
            return FileResponse(path, media_type="video/mp4", filename="narrated-presentation.mp4")
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)


    @router.post("/captions.srt")
    def captions(presentation: PresentationModel):
        try:
            validate_narrations(presentation, narration_service)
            return Response(srt(narration_service.prepare_timing(presentation)), media_type="application/x-subrip",
                            headers={"Content-Disposition": 'attachment; filename="captions.srt"'})
        except (ValueError, FileNotFoundError) as exc:
            translate_error(exc)

    return router
