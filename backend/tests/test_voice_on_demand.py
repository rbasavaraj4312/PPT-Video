import hashlib
import io
import json
import subprocess
import sys
import threading
import wave
import asyncio
import httpx

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from backend.app.api import speech
from backend.app.models.speech import BatchGenerateRequest
from backend.app.services.speech_storage import SpeechStorage, atomic_json
from backend.app.services.voice_process import VoiceProcess
from voice_service.app import create_app
from voice_service.service import NarrationService


def wav_bytes():
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as out:
        out.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
        out.writeframes(b'\x10\x10' * 72000)
    return buffer.getvalue()


@pytest.fixture
def offline(tmp_path, monkeypatch):
    store = SpeechStorage(tmp_path)
    monkeypatch.setenv('SPEECH_STORAGE_DIR', str(tmp_path))
    async def unexpected(): pytest.fail('Reading saved data must never start voice processing')
    async def stopped(): return False
    monkeypatch.setattr(speech.voice_process, 'ensure_running', unexpected)
    monkeypatch.setattr(speech.voice_process, 'is_running', stopped)
    app = FastAPI(); app.include_router(speech.router)
    with TestClient(app) as client:
        yield store, client


def seed(store):
    voice_id, asset_id = 'voice-' + 'a' * 32, 'b' * 64
    atomic_json(store.root / 'voices' / voice_id / 'profile.json', {'id': voice_id, 'name': 'Saved voice'})
    (store.root / 'voices' / voice_id / 'reference.wav').write_bytes(wav_bytes())
    result = dict(asset_id=asset_id, duration_ms=3000, generated_script='Hello', generated_voice_id=voice_id,
        generated_engine='pocket', captions=[dict(text='Hello', startMs=0, endMs=2000)])
    atomic_json(store.root / 'assets' / asset_id / 'result.json', result)
    atomic_json(store.root / 'assets' / asset_id / 'captions.json', result['captions'])
    (store.root / 'assets' / asset_id / 'narration.wav').write_bytes(wav_bytes())
    atomic_json(store.root / 'jobs/job-ready/job.json', dict(id='job-ready', kind='speech', status='complete', result=result))
    return voice_id, asset_id, result


def test_voice_lists_audio_ranges_waveforms_timing_and_job_history_stay_offline(offline):
    store, client = offline
    voice, asset, result = seed(store)
    assert client.get('/api/speech/voices').json()[0]['id'] == voice
    assert client.get('/api/speech/capabilities').json()['deferred'] is True
    assert client.get(f'/api/speech/voices/{voice}/reference').content == wav_bytes()
    audio = client.get(f'/api/speech/assets/{asset}/narration.wav', headers={'Range': 'bytes=0-15'})
    assert audio.status_code == 206
    assert audio.content == wav_bytes()[:16]
    assert audio.headers['content-range'].startswith('bytes 0-15/')
    upgraded = client.get(f'/api/speech/assets/{asset}/result.json').json()
    assert upgraded['audio_start_ms'] == 0
    assert upgraded['audio_end_ms'] == 3000
    assert json.loads(store.asset(asset, 'result.json').read_text()) == upgraded
    assert client.get('/api/speech/jobs/job-ready').json()['status'] == 'complete'
    assert client.get('/api/speech/jobs/missing').status_code == 404
    assert client.get('/api/speech/assets/invalid/narration.wav').status_code == 400
    assert client.get('/api/speech/unknown').status_code == 404


def test_voice_sample_preparation_uses_only_a_short_converter_not_the_voice_host(offline):
    store, client = offline
    response = client.post('/api/speech/voices', data={'name': 'My sample', 'transcript': 'Exact words'},
                           files={'audio': ('reference.wav', wav_bytes(), 'audio/wav')})
    assert response.status_code == 201, response.text
    assert response.json()['duration_ms'] == 3000
    assert len(store.profiles()) == 1


def test_srt_and_finished_video_downloads_do_not_boot_voice_processing(offline):
    store, client = offline
    voice, asset, result = seed(store)
    deck = dict(id='deck', slides=[dict(id='slide', narration=dict(script='Hello', voice_id=voice, engine='pocket', **result))])
    response = client.post('/api/speech/captions.srt', json=deck)
    assert response.status_code == 200, response.text
    assert 'Hello' in response.text
    atomic_json(store.root / 'jobs/job-video/job.json', dict(id='job-video', kind='render', status='complete'))
    (store.root / 'jobs/job-video/video.mp4').write_bytes(b'cached-video')
    assert client.get('/api/speech/jobs/job-video/video').content == b'cached-video'


def test_stopped_incomplete_jobs_are_retryable_and_cancellable_without_restart(offline):
    store, client = offline
    atomic_json(store.root / 'jobs/job-stale/job.json', dict(id='job-stale', status='running', kind='speech'))
    state = client.get('/api/speech/jobs/job-stale').json()
    assert state['status'] == 'failed' and 'Retry' in state['error']
    assert client.delete('/api/speech/jobs/job-stale').json()['status'] == 'cancelled'
    assert store.get_job('job-stale')['status'] == 'cancelled'


def test_finished_batch_recovery_and_post_replay_do_not_restart_a_worker(offline):
    store, client = offline
    voice, _, result = seed(store)
    body = BatchGenerateRequest(id='batch-' + 'c' * 32, presentation_id='deck',
        slides=[dict(slide_id='slide', script='Hello', voice_id=voice, engine='pocket')])
    atomic_json(store.root / 'batches' / body.id / 'batch.json', dict(id=body.id, presentation_id='deck',
        fingerprint=hashlib.sha256(body.model_dump_json().encode()).hexdigest(), slides=[
            dict(slide_id='slide', job_id='job-ready', script='Hello', voice_id=voice, engine='pocket')]))
    assert client.get('/api/speech/batches/' + body.id).json()['finished'] is True
    response = client.post('/api/speech/batches', json=body.model_dump())
    assert response.status_code == 202 and response.json()['finished'] is True
    different = body.model_dump(); different['slides'][0]['script'] = 'Different'
    assert client.post('/api/speech/batches', json=different).status_code == 400
    assert client.delete('/api/speech/batches/' + body.id).json()['finished'] is True


def test_unknown_recovered_batch_and_bad_generation_inputs_never_start_a_worker(offline):
    _, client = offline
    assert client.get('/api/speech/batches/batch-missing').status_code == 404
    assert client.post('/api/speech/generate', json={}).status_code == 422
    assert client.post('/api/speech/batches', json={}).status_code == 422


def test_generation_host_exits_after_queue_finishes_even_when_idle_timeout_disabled(tmp_path):
    service = NarrationService(tmp_path)
    service.jobs['job-active'] = {'status': 'running'}
    stopped = threading.Event()
    with TestClient(create_app(service, idle_seconds=0, shutdown=stopped.set)) as client:
        assert not stopped.wait(.15)
        service.jobs['job-active']['status'] = 'complete'
        assert stopped.wait(.5)
        assert client.get('/health').json()['stopping'] is True


def test_failed_generation_request_also_stops_host_without_waiting_for_idle_timer(tmp_path):
    stopped = threading.Event()
    with TestClient(create_app(NarrationService(tmp_path), idle_seconds=60, shutdown=stopped.set)) as client:
        response = client.post('/api/speech/generate', json=dict(script='Hello', voice_id='voice-' + 'f' * 32))
        assert response.status_code == 404
        assert stopped.wait(.5)
        rejected = client.post('/api/speech/generate', json=dict(script='Hello', voice_id='voice-' + 'f' * 32))
        assert rejected.status_code == 503
        assert rejected.headers['x-voice-worker-draining'] == '1'


def test_generation_racing_with_shutdown_retries_only_when_no_job_was_accepted(monkeypatch):
    seen, starts = [], []
    class Body(httpx.AsyncByteStream):
        async def __aiter__(self):
            yield b'{"id":"job-new"}'
    async def handler(request):
        seen.append(await request.aread())
        if len(seen) == 1:
            return httpx.Response(503, headers={'x-voice-worker-draining': '1'}, stream=Body())
        return httpx.Response(202, headers={'content-type': 'application/json'}, stream=Body())
    manager = VoiceProcess()
    manager.client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    async def start(): starts.append(True)
    monkeypatch.setattr(manager, 'ensure_running', start)
    monkeypatch.setattr(speech, 'voice_process', manager)
    app = FastAPI(); app.include_router(speech.router)
    with TestClient(app) as client:
        response = client.post('/api/speech/generate', json={'script': 'Hello', 'voice_id': 'voice-' + 'a' * 32})
        assert response.status_code == 202
        assert response.json()['id'] == 'job-new'
        assert len(starts) == 2
        assert seen[0] == seen[1]
    asyncio.run(manager.close())


def test_main_api_import_does_not_load_any_voice_service_or_ml_modules():
    code = "import json,sys; import backend.app.main; print(json.dumps([m for m in sys.modules if m.startswith('voice_service') or m in ['torch','pocket_tts','stable_whisper','mlx.core']]))"
    result = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, check=True)
    assert json.loads(result.stdout) == []
