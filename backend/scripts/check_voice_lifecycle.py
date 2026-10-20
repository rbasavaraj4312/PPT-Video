"""Exercise real worker starts/exits using cached synthetic audio, with no inference."""
from contextlib import asynccontextmanager
import json
import os
from pathlib import Path
import socket
import sys
import tempfile
import time
import wave

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend.app.api import speech
from backend.app.models.speech import GenerateRequest
from backend.app.services.speech_storage import atomic_json
from backend.app.services.voice_process import VoiceProcess
from voice_service.service import NarrationService


def main():
    with tempfile.TemporaryDirectory() as temporary:
        root = Path(temporary)
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', 0))
            port = probe.getsockname()[1]
        os.environ.update(SPEECH_STORAGE_DIR=str(root), VOICE_SERVICE_PORT=str(port),
                          VOICE_SERVICE_PYTHON=sys.executable, VOICE_SERVICE_IDLE_SECONDS='60')
        voice_id = 'voice-' + 'a' * 32
        atomic_json(root / 'voices' / voice_id / 'profile.json', dict(id=voice_id, name='Synthetic voice',
            transcript='Synthetic reference', reference_hash='fixture'))
        request = GenerateRequest(script='Synthetic cached speech.', engine='pocket', voice_id=voice_id)
        preparation = NarrationService(root)
        data = preparation._generation_data(request)
        preparation.close()
        asset_id = data['asset_id']
        result = dict(asset_id=asset_id, duration_ms=3000, audio_start_ms=0, audio_end_ms=3000,
            generated_script=request.script, generated_engine=request.engine, generated_voice_id=voice_id,
            captions=[dict(text='Synthetic', startMs=0, endMs=1000)])
        atomic_json(root / 'assets' / asset_id / 'result.json', result)
        with wave.open(str(root / 'assets' / asset_id / 'narration.wav'), 'wb') as output:
            output.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
            output.writeframes(b'\0\0' * 72000)
        manager = VoiceProcess()
        speech.voice_process = manager

        @asynccontextmanager
        async def lifespan(app):
            try:
                yield
            finally:
                await manager.close()

        app = FastAPI(lifespan=lifespan); app.include_router(speech.router)
        with TestClient(app) as client:
            assert client.get('/api/speech/voices').status_code == 200
            assert client.get('/api/speech/capabilities').json()['deferred']
            assert manager.process is None
            pids, shutdown_times = [], []
            for _ in range(2):
                response = client.post('/api/speech/generate', json=request.model_dump())
                assert response.status_code == 202, response.text
                job = response.json()['id']
                pids.append(manager.process.pid)
                deadline = time.monotonic() + 10
                while client.get('/api/speech/jobs/' + job).json()['status'] != 'complete':
                    assert time.monotonic() < deadline, manager.log_path.read_text()
                    time.sleep(.05)
                completed = time.monotonic()
                while manager.process.poll() is None:
                    # Reads must neither keep the host alive nor restart it.
                    assert client.get('/api/speech/voices').status_code == 200
                    assert client.get(f'/api/speech/assets/{asset_id}/result.json').status_code == 200
                    assert client.get('/api/speech/jobs/' + job).json()['status'] == 'complete'
                    assert time.monotonic() < deadline, manager.log_path.read_text()
                    time.sleep(.05)
                shutdown_times.append(time.monotonic() - completed)
                assert client.get('/api/speech/service/status').json()['running'] is False
                assert client.get(f'/api/speech/assets/{asset_id}/narration.wav', headers={'Range': 'bytes=0-15'}).status_code == 206
                assert manager.process.poll() is not None
            assert pids[0] != pids[1]
            assert max(shutdown_times) < 3
        report = dict(explicit_generation_starts=2, automatic_shutdowns=2, shutdown_seconds=shutdown_times,
                      saved_reads_start_worker=False, inference=False)
        folder = ROOT / 'output/voice-lifecycle-check'
        folder.mkdir(parents=True, exist_ok=True)
        (folder / 'verification.json').write_text(json.dumps(report, indent=2))
        print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
