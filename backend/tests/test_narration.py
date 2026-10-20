import io
import json
import math
import struct
import subprocess
import sys
import time
import wave

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from voice_service import api as speech
from backend.app.models.presentation import NarrationModel, PresentationModel, SlideModel, CaptionModel
from voice_service.service import NarrationService, atomic_json, audio_duration
from backend.app.services.narration_timeline import timeline, srt, validate_narrations
from voice_service.speech_worker import chunks


def wav_bytes(seconds=4):
    data = io.BytesIO()
    with wave.open(data, 'wb') as out:
        out.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
        out.writeframes(b''.join(struct.pack('<h', int(8000 * math.sin(i / 30))) for i in range(int(seconds * 24000))))
    return data.getvalue()


@pytest.fixture
def service(tmp_path):
    instance = NarrationService(tmp_path / 'speech')
    yield instance
    instance.close()


@pytest.fixture
def client(service, monkeypatch):
    app = FastAPI()
    app.include_router(speech.create_router(service))
    return TestClient(app)


def wait_job(service, job_id):
    for _ in range(150):
        job = service.get_job(job_id)
        if job['status'] in {'complete', 'failed', 'cancelled'}:
            return job
        time.sleep(.02)
    pytest.fail('Job did not finish')


def ready_narration():
    return NarrationModel(script='Hello world', engine='pocket', voice_id='v',
                          generated_script='Hello world', generated_engine='pocket', generated_voice_id='v',
                          asset_id='a' * 64, duration_ms=1201,
                          captions=[CaptionModel(text='Hello', startMs=0, endMs=600),
                                    CaptionModel(text=' world', startMs=600, endMs=1200)])


def test_voice_upload_trim_and_asset_access(client, service):
    response = client.post('/api/speech/voices', data={'name': 'My voice', 'transcript': 'An exact sample', 'start': 1, 'end': 4},
                           files={'audio': ('reference.wav', wav_bytes(5), 'audio/wav')})
    assert response.status_code == 201, response.text
    profile = response.json()
    assert profile['duration_ms'] == 3000
    assert client.get(f"/api/speech/voices/{profile['id']}/reference").status_code == 200
    assert client.get('/api/speech/voices').json()[0]['name'] == 'My voice'
    assert client.get('/api/speech/assets/invalid/narration.wav').status_code == 400
    assert client.get('/api/speech/jobs/unknown').status_code == 404
    assert client.post('/api/speech/voices', data={'name': 'x', 'transcript': 'x'},
                       files={'audio': ('short.wav', wav_bytes(.5), 'audio/wav')}).status_code == 400
    assert len(service.profiles()) == 1


def test_generation_cache_and_separate_alignment_process(client, service, monkeypatch):
    profile = client.post('/api/speech/voices', data={'name': 'Voice', 'transcript': 'Reference'},
                          files={'audio': ('voice.wav', wav_bytes(), 'audio/wav')}).json()
    calls = []
    monkeypatch.setattr(service, 'capabilities', lambda: {'engines': [{'id': x, 'available': True} for x in ['pocket', 'align']]})
    def fake_process(job_id, command, phase):
        calls.append(phase)
        data = json.loads(open(command[-1]).read())
        if phase == 'Generating speech':
            open(data['output'], 'wb').write(wav_bytes())
        else:
            atomic_json(__import__('pathlib').Path(data['output']), [{'text': 'Hello', 'startMs': 0, 'endMs': 1000}])
    monkeypatch.setattr(service, '_process', fake_process)
    body = {'voice_id': profile['id'], 'engine': 'pocket', 'script': 'Hello'}
    first = wait_job(service, client.post('/api/speech/generate', json=body).json()['id'])
    assert first['status'] == 'complete', first
    second = wait_job(service, client.post('/api/speech/generate', json=body).json()['id'])
    assert first['result'] == second['result']
    assert calls == ['Generating speech', 'Aligning words']
    assert client.get(f"/api/speech/assets/{first['result']['asset_id']}/narration.wav").status_code == 200
    assert client.post('/api/speech/generate', json={**body, 'script': ' '}).status_code == 422


def test_timing_and_srt_use_same_frame_rounding():
    n = ready_narration()
    p = PresentationModel(id='deck', slides=[SlideModel(id='one', narration=n, transition_duration=.3),
                                           SlideModel(id='two', narration=n)])
    items, duration = timeline(p)
    assert items == [{'start': 0, 'hold': 43, 'transition': 9, 'transition_start': 39, 'audio_from': 0, 'audio_frames': 37},
                     {'start': 43, 'hold': 37, 'transition': 0, 'transition_start': 80, 'audio_from': 0, 'audio_frames': 37}]
    assert duration == 80
    assert '00:00:01,433 --> 00:00:02,633' in srt(p)
    n.fit_to_audio = False
    assert timeline(p)[0][0]['hold'] == 90


def test_invalid_caption_and_stale_audio_rejected(client, service):
    with pytest.raises(ValidationError):
        CaptionModel(text='x', startMs=20, endMs=10)
    with pytest.raises(ValidationError):
        NarrationModel(duration_ms=float('nan'))
    n = ready_narration()
    n.script = 'Changed script'
    p = PresentationModel(id='deck', slides=[SlideModel(id='slide', narration=n)])
    assert client.post('/api/speech/render', json=p.model_dump()).status_code == 400
    n.script = n.generated_script
    folder = service.root / 'assets' / n.asset_id
    atomic_json(folder / 'result.json', {**n.model_dump(), 'duration_ms': 900})
    with pytest.raises(ValueError, match='metadata'):
        validate_narrations(p, service)


def test_worker_cancellation_reaps_process(service):
    job_id = 'job-test'
    service.jobs[job_id] = dict(id=job_id, kind='speech', status='queued')
    (service.root / 'jobs' / job_id).mkdir(parents=True)
    future = service.pool.submit(service._process, job_id, [sys.executable, '-c', 'import time; time.sleep(30)'], 'test')
    for _ in range(100):
        if job_id in service.processes:
            break
        time.sleep(.01)
    process = service.processes[job_id]
    service.cancel(job_id)
    with pytest.raises((InterruptedError, RuntimeError)):
        future.result(timeout=5)
    assert process.poll() is not None
    assert service.get_job(job_id)['status'] == 'cancelled'


def test_pending_jobs_fail_clearly_after_restart(tmp_path):
    root = tmp_path / 'speech'
    atomic_json(root / 'jobs' / 'job-old' / 'job.json', {'id': 'job-old', 'status': 'running'})
    instance = NarrationService(root)
    try:
        assert instance.get_job('job-old')['status'] == 'failed'
        assert 'restarted' in instance.get_job('job-old')['error']
    finally:
        instance.close()


def test_old_decks_and_new_narration_round_trip():
    old = PresentationModel.model_validate({'id': 'old', 'slides': [{'id': 's'}]})
    assert old.slides[0].narration is None
    old.slides[0].narration = ready_narration()
    assert PresentationModel.model_validate_json(old.model_dump_json()) == old
    assert old.slides[0].narration.caption_style.highlight_words is True
    old.slides[0].narration.caption_style.highlight_words = False
    assert PresentationModel.model_validate_json(old.model_dump_json()).slides[0].narration.caption_style.highlight_words is False


def test_chunking_preserves_all_words_and_sentence_order():
    script = 'A first sentence. ' + 'A longer sentence with details. ' * 60
    parts = chunks(script)
    assert ' '.join(parts).split() == script.split()
    assert all(len(p) <= 280 for p in parts)
