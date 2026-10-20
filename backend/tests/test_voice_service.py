import asyncio
import json
from pathlib import Path
import subprocess
import sys
import threading
import time

import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from backend.app.api import speech
from backend.app.services.voice_process import VoiceProcess, VoiceServiceUnavailable
from voice_service.app import create_app, IdleState, ActivityMiddleware
from voice_service.service import NarrationService


def test_main_backend_import_does_not_load_voice_service_or_models():
    code = "import sys,json; import backend.app.main; print(json.dumps([m for m in ['voice_service.service','torch','pocket_tts','stable_whisper','mlx.core'] if m in sys.modules]))"
    result = subprocess.run([sys.executable, '-c', code], capture_output=True, text=True, check=True)
    assert json.loads(result.stdout) == []


def test_idle_exit_waits_for_jobs_and_requests(monkeypatch):
    service = type('Service', (), {'busy': lambda self: self.working})()
    service.working = False
    state = IdleState()
    monkeypatch.setattr('voice_service.app.time.monotonic', lambda: state.last_activity + 61)
    assert state.expired(service, 60)
    service.working = True
    assert not state.expired(service, 60)
    service.working = False
    state.active_requests = 1
    assert not state.expired(service, 60)
    state.active_requests = 0
    assert not state.expired(service, 0)


def test_health_probes_do_not_prevent_idle_shutdown(tmp_path):
    stopped = threading.Event()
    app = create_app(NarrationService(tmp_path), idle_seconds=.1, shutdown=stopped.set)
    with TestClient(app) as client:
        before = app.state.idle.last_activity
        assert client.get('/health').json()['service'] == 'voice'
        assert app.state.idle.last_activity == before
        assert stopped.wait(1)


def test_idle_monitor_never_interrupts_active_jobs(tmp_path):
    service = NarrationService(tmp_path)
    service.jobs['job-busy'] = {'status': 'running'}
    stopped = threading.Event()
    app = create_app(service, idle_seconds=.1, shutdown=stopped.set)
    with TestClient(app):
        assert not stopped.wait(.25)
        service.jobs['job-busy']['status'] = 'complete'
        assert stopped.wait(1)


def test_streaming_download_stays_active_until_body_finishes():
    async def check():
        state = IdleState()
        async def stream(scope, receive, send):
            await send({'type': 'http.response.start', 'status': 200, 'headers': []})
            assert state.active_requests == 1
            await send({'type': 'http.response.body', 'body': b'audio', 'more_body': False})
            assert state.active_requests == 1
        async def noop(*args):
            pass
        await ActivityMiddleware(stream, state)({'type': 'http', 'path': '/api/speech/assets/a/narration.wav'}, noop, noop)
        assert state.active_requests == 0
    asyncio.run(check())


def test_concurrent_first_requests_spawn_once_and_restart_after_idle_exit(tmp_path, monkeypatch):
    manager = VoiceProcess()
    manager.log_path = tmp_path / 'service.log'
    spawned = []
    class Process:
        code = None
        def poll(self): return self.code
        def terminate(self): self.code = 0
        def wait(self, timeout=None): return self.code
    def spawn(*args, **kwargs):
        process = Process()
        spawned.append((process, args, kwargs))
        return process
    async def health():
        return {'service': 'voice'} if manager.process and manager.process.poll() is None else None
    monkeypatch.setattr(manager, 'health', health)
    monkeypatch.setattr(manager, 'interpreter', lambda: sys.executable)
    monkeypatch.setattr('backend.app.services.voice_process.subprocess.Popen', spawn)
    async def check():
        await asyncio.gather(*(manager.ensure_running() for _ in range(8)))
        assert len(spawned) == 1
        assert spawned[0][1][0] == [sys.executable, '-m', 'voice_service']
        assert '--reload' not in spawned[0][1][0]
        manager.process.code = 0  # The worker exited on its idle timeout.
        await manager.ensure_running()
        assert len(spawned) == 2
        await manager.close()
        assert spawned[-1][0].poll() == 0
    asyncio.run(check())


class ByteStream(httpx.AsyncByteStream):
    async def __aiter__(self):
        yield b'voice-bytes'


def test_generation_proxy_preserves_status_and_request_body(monkeypatch):
    seen = []
    async def handler(request):
        seen.append((request, await request.aread()))
        return httpx.Response(202, headers={'content-type': 'application/json'}, stream=ByteStream())
    manager = VoiceProcess()
    manager.client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    async def ready(): pass
    monkeypatch.setattr(manager, 'ensure_running', ready)
    monkeypatch.setattr(speech, 'voice_process', manager)
    app = FastAPI()
    app.include_router(speech.router)
    with TestClient(app) as client:
        body = dict(script='Generate only on request', voice_id='voice-' + 'a' * 32, engine='pocket')
        response = client.post('/api/speech/generate', json=body)
        assert response.status_code == 202
        assert response.content == b'voice-bytes'
        assert json.loads(seen[0][1]) == body
    asyncio.run(manager.close())


def test_status_does_not_start_service_and_busy_stop_is_rejected(monkeypatch):
    manager = VoiceProcess()
    async def health(): return None
    async def unexpected(): pytest.fail('Status must not start voice processing')
    monkeypatch.setattr(manager, 'health', health)
    monkeypatch.setattr(manager, 'ensure_running', unexpected)
    monkeypatch.setattr(speech, 'voice_process', manager)
    app = FastAPI()
    app.include_router(speech.router)
    with TestClient(app) as client:
        assert client.get('/api/speech/service/status').json()['running'] is False
        async def busy(): return {'service': 'voice', 'busy': True}
        monkeypatch.setattr(manager, 'health', busy)
        assert client.post('/api/speech/service/stop').status_code == 409


def test_unavailable_service_returns_useful_503(monkeypatch):
    async def unavailable(): raise VoiceServiceUnavailable('Missing voice environment')
    monkeypatch.setattr(speech.voice_process, 'ensure_running', unavailable)
    app = FastAPI()
    app.include_router(speech.router)
    with TestClient(app) as client:
        assert client.get('/api/speech/voices').status_code == 200
        response = client.post('/api/speech/generate', json=dict(script='Hello', voice_id='voice-' + 'a' * 32))
        assert response.status_code == 503
        assert 'Missing voice environment' in response.json()['detail']
