"""Serve saved speech files locally; start a worker only for generation/rendering."""
import hashlib
import math
import os
from pathlib import Path
import tempfile
import httpx
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, Response, StreamingResponse
from starlette.background import BackgroundTask

from ..models.presentation import PresentationModel
from ..models.speech import GenerateRequest, BatchGenerateRequest
from ..services.narration_timeline import srt, validate_narrations
from ..services.speech_storage import SpeechStorage, TERMINAL, atomic_json, valid_id
from ..services.voice_process import voice_process, VoiceServiceUnavailable

router = APIRouter(prefix="/api/speech", tags=["narration"])
HOP_HEADERS = {"connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "host"}


def storage():
    return SpeechStorage()


def translate_error(exc):
    raise HTTPException(404 if isinstance(exc, FileNotFoundError) else 400, str(exc)) from exc


def interrupted(job):
    if job['status'] in TERMINAL:
        return job
    return {**job, 'status': 'failed', 'phase': 'Interrupted',
            'error': 'Voice processing stopped before this job finished. Retry generation.'}


async def saved_batch(batch_id):
    batch = storage().get_batch(batch_id)
    if not batch['finished'] and not await voice_process.is_running():
        batch['slides'] = [{**row, 'job': interrupted(row['job'])} for row in batch['slides']]
        batch['finished'] = True
    return batch


@router.get("/service/status")
async def service_status():
    health = await voice_process.health()
    return {"running": health is not None, "busy": bool(health and health["busy"]),
            "idle_seconds": float(os.getenv("VOICE_SERVICE_IDLE_SECONDS", "10")),
            "shutdown_after_jobs": True}


@router.post("/service/stop")
async def stop_service():
    health = await voice_process.health()
    if health and health["busy"]:
        raise HTTPException(409, "Wait for the current voice or video job to finish, or cancel it first.")
    if health and voice_process.process is None:
        raise HTTPException(409, "This voice service was started manually. Stop it in its terminal.")
    await voice_process.stop()
    return {"running": False}


async def forward_work(path: str, request: Request, start=True):
    try:
        headers = {key: value for key, value in request.headers.items() if key.lower() not in HOP_HEADERS}
        url = httpx.URL(voice_process.url + "/api/speech/" + path).copy_with(query=request.url.query.encode())
        for attempt in range(2):
            if start:
                await voice_process.ensure_running()
            upstream = voice_process.http().build_request(request.method, url, headers=headers, content=request.stream())
            response = await voice_process.http().send(upstream, stream=True)
            if not (start and attempt == 0 and response.status_code == 503 and response.headers.get('x-voice-worker-draining') == '1'):
                break
            await response.aclose()
    except (VoiceServiceUnavailable, httpx.HTTPError) as exc:
        raise HTTPException(503, f"Voice service unavailable: {exc}") from exc
    return StreamingResponse(response.aiter_raw(), status_code=response.status_code,
        headers={key: value for key, value in response.headers.items() if key.lower() not in HOP_HEADERS},
        background=BackgroundTask(response.aclose))


@router.get('/voices')
def voices():
    return storage().profiles()


@router.get('/capabilities')
def capabilities():
    # Do not spawn Python probes or load optional environments just to open a menu.
    return {'engines': [dict(id=engine, available=None, reason='Checked when generation starts.')
                        for engine in ['omnivoice', 'pocket', 'align']],
            'serial': True, 'default_engine': 'omnivoice', 'deferred': True}


@router.post('/voices', status_code=201)
def create_voice(name: str = Form(..., min_length=1, max_length=100),
                 transcript: str = Form(..., min_length=1, max_length=3000),
                 start: float = Form(0), end: float | None = Form(None), audio: UploadFile = File(...)):
    if not name.strip() or not transcript.strip():
        raise HTTPException(400, 'Name and exact reference transcript are required')
    if not math.isfinite(start) or start < 0 or (end is not None and (not math.isfinite(end) or end <= start)):
        raise HTTPException(400, 'Invalid trim interval')
    with tempfile.TemporaryDirectory() as temporary:
        path = Path(temporary) / 'upload'
        total = 0
        with path.open('wb') as out:
            while chunk := audio.file.read(1024 * 1024):
                total += len(chunk)
                if total > 20 * 1024 * 1024:
                    raise HTTPException(413, 'Reference audio must be smaller than 20 MB')
                out.write(chunk)
        try:
            return storage().create_profile(name, transcript, path, start, end)
        except Exception as exc:
            translate_error(exc)


@router.get('/voices/{voice_id}/reference')
def reference(voice_id: str):
    try:
        store = storage(); store.profile(voice_id)
        return FileResponse(store.root / 'voices' / voice_id / 'reference.wav', media_type='audio/wav')
    except (ValueError, FileNotFoundError) as exc:
        translate_error(exc)


@router.get('/assets/{asset_id}/{filename}')
def asset(asset_id: str, filename: str):
    try:
        store = storage()
        if filename == 'result.json':
            return store.asset_result(asset_id)
        return FileResponse(store.asset(asset_id, filename), media_type='audio/wav' if filename.endswith('.wav') else 'application/json')
    except (ValueError, FileNotFoundError) as exc:
        translate_error(exc)


@router.post('/generate', status_code=202)
async def generate(body: GenerateRequest, request: Request):
    return await forward_work('generate', request)


@router.post('/render', status_code=202)
async def render(body: PresentationModel, request: Request):
    return await forward_work('render', request)


@router.post('/batches', status_code=202)
async def generate_batch(body: BatchGenerateRequest, request: Request):
    store = storage()
    try:
        manifest = store.batch_manifest(body.id)
    except FileNotFoundError:
        return await forward_work('batches', request)
    if manifest['fingerprint'] != hashlib.sha256(body.model_dump_json().encode()).hexdigest():
        raise HTTPException(400, 'This batch identifier already belongs to a different request.')
    try:
        return await saved_batch(body.id)
    except (ValueError, FileNotFoundError) as exc:
        translate_error(exc)


@router.get('/jobs/{job_id}')
async def job(job_id: str):
    try:
        state = storage().get_job(job_id)
        return interrupted(state) if state['status'] not in TERMINAL and not await voice_process.is_running() else state
    except (ValueError, FileNotFoundError) as exc:
        translate_error(exc)


@router.get('/batches/{batch_id}')
async def batch(batch_id: str):
    try:
        return await saved_batch(batch_id)
    except (ValueError, FileNotFoundError) as exc:
        translate_error(exc)


@router.delete('/jobs/{job_id}')
async def cancel_job(job_id: str, request: Request):
    try:
        store = storage(); state = store.get_job(job_id)
        if state['status'] in TERMINAL:
            return state
        if await voice_process.is_running():
            return await forward_work(f'jobs/{job_id}', request, start=False)
        state.update(status='cancelled', phase='Cancelled')
        atomic_json(store.root / 'jobs' / valid_id(job_id) / 'job.json', state)
        return state
    except (ValueError, FileNotFoundError) as exc:
        translate_error(exc)


@router.delete('/batches/{batch_id}')
async def cancel_batch(batch_id: str, request: Request):
    try:
        store = storage(); state = store.get_batch(batch_id)
        if state['finished']:
            return state
        if await voice_process.is_running():
            return await forward_work(f'batches/{batch_id}', request, start=False)
        for row in state['slides']:
            if row['job']['status'] not in TERMINAL:
                row['job'].update(status='cancelled', phase='Cancelled')
                atomic_json(store.root / 'jobs' / valid_id(row['job_id']) / 'job.json', row['job'])
        return store.get_batch(batch_id)
    except (ValueError, FileNotFoundError) as exc:
        translate_error(exc)


@router.get('/jobs/{job_id}/video')
def video(job_id: str):
    try:
        store = storage(); state = store.get_job(job_id)
        path = store.root / 'jobs' / valid_id(job_id) / 'video.mp4'
        if state['status'] != 'complete' or state['kind'] != 'render' or not path.is_file():
            raise FileNotFoundError('Video is not ready')
        return FileResponse(path, media_type='video/mp4', filename='narrated-presentation.mp4')
    except (ValueError, FileNotFoundError) as exc:
        translate_error(exc)


@router.post('/captions.srt')
def captions(presentation: PresentationModel):
    try:
        store = storage(); validate_narrations(presentation, store)
        return Response(srt(store.prepare_timing(presentation)), media_type='application/x-subrip',
                        headers={'Content-Disposition': 'attachment; filename="captions.srt"'})
    except (ValueError, FileNotFoundError) as exc:
        translate_error(exc)
