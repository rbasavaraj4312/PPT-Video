"""Scratch cleanup is gated by durable presentation saves, never job completion."""
import json

import pytest

from backend.app.models.presentation import PresentationModel
from backend.app.services import storage as storage_module
from backend.app.services.speech_storage import SpeechStorage, SPEECH_TEMP_FILES, atomic_json


@pytest.fixture
def saved_job(tmp_path, monkeypatch):
    root = tmp_path / 'speech'
    monkeypatch.setenv('SPEECH_STORAGE_DIR', str(root))
    speech = SpeechStorage()
    asset_id = 'a' * 64
    result = dict(asset_id=asset_id, generated_script='Hello', generated_engine='pocket',
                  generated_voice_id='my-voice', duration_ms=1000, captions=[])
    asset = root / 'assets' / asset_id
    atomic_json(asset / 'result.json', result)
    atomic_json(asset / 'captions.json', [])
    (asset / 'narration.wav').write_bytes(b'permanent audio')
    job = root / 'jobs' / 'job-ready'
    atomic_json(job / 'job.json', dict(id='job-ready', kind='speech', status='complete', result=result))
    for name in SPEECH_TEMP_FILES:
        (job / name).write_bytes(b'temporary')
    atomic_json(root / 'batches/batch-ready/batch.json', dict(id='batch-ready', presentation_id='pres-cleanup',
        fingerprint='request', slides=[dict(slide_id='slide-one', job_id='job-ready')]))
    pres = PresentationModel.model_validate(dict(id='pres-cleanup', title='Cleanup', slides=[
        dict(id='slide-one', narration=dict(script='Hello', engine='pocket', voice_id='my-voice', **result))]))
    storage = storage_module.StorageService.__new__(storage_module.StorageService)
    storage.data_dir = tmp_path / 'presentations'
    storage.data_dir.mkdir()
    return speech, storage, pres, job, asset


def test_save_cleans_scratch_keeps_audio_profiles_video_and_recovery(saved_job):
    speech, storage, pres, job, asset = saved_job
    # A finished job alone is not sufficient: the user has not saved yet.
    assert (job / 'worker.log').exists()
    (job / 'video.mp4').write_bytes(b'keep download')
    (job / 'unknown-file').write_bytes(b'keep unknown')
    atomic_json(speech.root / 'voices/my-voice/profile.json', {'id': 'my-voice'})
    original = {p.name: p.read_bytes() for p in asset.iterdir()}
    storage.save_presentation(pres)
    assert storage.get_presentation(pres.id).slides[0].narration.asset_id == 'a' * 64
    assert all(not (job / name).exists() for name in SPEECH_TEMP_FILES)
    assert {p.name: p.read_bytes() for p in asset.iterdir()} == original
    assert speech.profiles() == [{'id': 'my-voice'}]
    assert (job / 'video.mp4').read_bytes() == b'keep download'
    assert (job / 'unknown-file').exists()
    assert speech.get_job('job-ready')['result']['asset_id'] == 'a' * 64
    assert speech.get_batch('batch-ready')['finished'] is True
    # Repeated saves and worker restarts retain the same recovery records.
    storage.save_presentation(pres)
    assert SpeechStorage(speech.root).get_batch('batch-ready')['slides'][0]['job']['result']['captions'] == []


@pytest.mark.parametrize('change', ['running', 'failed', 'cancelled', 'render', 'unsaved_asset', 'mismatch', 'missing_audio'])
def test_unrelated_unfinished_or_incomplete_jobs_are_preserved(saved_job, change):
    speech, storage, pres, job, asset = saved_job
    record = json.loads((job / 'job.json').read_text())
    if change in ('running', 'failed', 'cancelled'):
        record['status'] = change
    elif change == 'render':
        record['kind'] = 'render'
    elif change == 'unsaved_asset':
        pres.slides[0].narration = None
    elif change == 'mismatch':
        pres.slides[0].narration.generated_script = 'Different result'
    else:
        (asset / 'narration.wav').unlink()
    atomic_json(job / 'job.json', record)
    storage.save_presentation(pres)
    assert all((job / name).exists() for name in SPEECH_TEMP_FILES)


def test_failed_save_does_not_cleanup(saved_job, monkeypatch):
    _, storage, pres, job, _ = saved_job
    def fail(*args):
        raise OSError('Disk full')
    monkeypatch.setattr(storage_module, 'atomic_json', fail)
    with pytest.raises(OSError, match='Disk full'):
        storage.save_presentation(pres)
    assert (job / 'worker.log').exists()
    assert not storage._get_file_path(pres.id).exists()


def test_corrupt_job_does_not_block_other_cleanup_or_save(saved_job):
    speech, storage, pres, job, _ = saved_job
    broken = speech.root / 'jobs/job-broken'
    broken.mkdir()
    (broken / 'job.json').write_text('{broken')
    (broken / 'worker.log').write_text('retain diagnostics')
    storage.save_presentation(pres)
    assert not (job / 'worker.log').exists()
    assert (broken / 'worker.log').exists()
    assert storage.get_presentation(pres.id) is not None


def test_cleanup_failure_does_not_fail_saved_presentation(saved_job, monkeypatch):
    _, storage, pres, job, _ = saved_job
    def fail(*args):
        raise OSError('Locked scratch directory')
    monkeypatch.setattr(SpeechStorage, 'cleanup_saved_jobs', fail)
    storage.save_presentation(pres)
    assert storage.get_presentation(pres.id) is not None
    assert (job / 'worker.log').exists()
