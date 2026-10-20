import io
import json
import threading
import time
import wave

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest

from backend.app.api.routes import router
from backend.app.services.narration_draft import parse_narration, build_draft, DraftBuildRequest
from voice_service.api import create_router
from voice_service.service import NarrationService, atomic_json


def test_parse_preserves_multiline_script_and_supports_markdown_and_inline_headers():
    source = '```text\n# Slide 1:\nOne clear idea.\nKeep this exact line!\n\nSlide 2: Turn the idea into a plan. Then launch.\n```'
    drafts = parse_narration(source)
    assert [s.script for s in drafts] == ['One clear idea.\nKeep this exact line!', 'Turn the idea into a plan. Then launch.']
    assert drafts[0].title == 'One clear idea.'
    assert drafts[1].points == ['Turn the idea into a plan.', 'Then launch.']
    assert parse_narration('ಕನ್ನಡ explanation without slide headings.')[0].script == 'ಕನ್ನಡ explanation without slide headings.'


@pytest.mark.parametrize('source, message', [('', 'Paste narration'), ('Slide 1:\n\nSlide 2: Hello', 'no narration'),
    ('Slide 1: A\nSlide 1: B', 'unique'), ('Introduction\nSlide 1: Hello', 'before the first'),
    ('Slide 1: ' + 'x' * 12001, '12,000'), ('\n'.join(f'Slide {i}: hello' for i in range(1, 102)), '100 slides')])
def test_invalid_imports_fail_before_creating_slides(source, message):
    with pytest.raises(ValueError, match=message):
        parse_narration(source)


def test_draft_api_generates_editable_bounded_slides_without_changing_narration():
    app = FastAPI(); app.include_router(router)
    with TestClient(app) as client:
        response = client.post('/api/narration-draft/parse', json={'text': 'Slide 1: A clear idea. A practical plan. A confident launch.'})
        assert response.status_code == 200
        drafts = response.json()['slides']; drafts[0]['title'] = 'My reviewed title'
        for ratio, width, height in [('16:9', 1280, 720), ('9:16', 720, 1280)]:
            result = client.post('/api/narration-draft/build', json={'slides': drafts, 'aspect_ratio': ratio, 'theme': 'clean-light'})
            assert result.status_code == 200, result.text
            slide = result.json()['slides'][0]
            assert slide['title'] == 'My reviewed title'
            assert slide['narration']['script'] == drafts[0]['script']
            assert slide['narration']['asset_id'] is None
            assert slide['narration']['padding_ms'] == 0
            for element in slide['elements']:
                assert element['x'] >= 0 and element['y'] >= 0
                assert element['x'] + element['width'] <= width
                assert element['y'] + element['height'] <= height - 100
        assert client.post('/api/narration-draft/build', json={'slides': [], 'aspect_ratio': 'bad'}).status_code == 422
        assert client.post('/api/narration-draft/parse', json={'text': 'Slide 1:'}).status_code == 400


def test_draft_visuals_fit_long_titles_and_unbroken_words_without_shortening_the_spoken_script():
    for ratio in ['16:9', '9:16']:
        draft = parse_narration('Slide 1: ' + 'VeryLongIdentifier' * 15)[0]
        draft.title = 'W' * 90
        draft.points = ['W' * 180, 'An explanation. ' * 10, '示例内容' * 40]
        deck = build_draft(DraftBuildRequest(slides=[draft], aspect_ratio=ratio))
        assert deck.slides[0].narration.script == draft.script
        for element in deck.slides[0].elements:
            if element.type == 'text':
                assert len(element.content.splitlines()) * element.font_size * 1.25 <= element.height


VOICE = 'voice-' + 'a' * 32


@pytest.fixture
def queued_service(tmp_path, monkeypatch):
    service = NarrationService(tmp_path)
    atomic_json(tmp_path / 'voices' / VOICE / 'profile.json', dict(id=VOICE, reference_hash='sample', transcript='Reference'))
    monkeypatch.setattr(service, 'capabilities', lambda: {'engines': [{'id': e, 'available': True} for e in ['pocket', 'align']]})
    yield service
    service.close()


def request(slides=None, **values):
    return dict(id='batch-' + 'b' * 32, presentation_id='deck', slides=slides or [
        dict(slide_id=str(i), script=script, voice_id=VOICE, engine='pocket') for i, script in enumerate(['First.', 'Fail.', 'Last.'])], **values)


def test_batch_is_idempotent_serial_and_independent_of_one_child_failure(queued_service, monkeypatch):
    service = queued_service
    active = 0; maximum = 0; stages = []
    def process(job_id, command, phase):
        nonlocal active, maximum
        active += 1; maximum = max(maximum, active)
        try:
            data = json.loads(open(command[-1]).read())
            service._update(job_id, status='running', phase=phase)
            stages.append(data['script'])
            time.sleep(.02)
            if data['script'] == 'Fail.':
                raise RuntimeError('Synthetic failure')
            if phase == 'Generating speech':
                with wave.open(data['output'], 'wb') as audio:
                    audio.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
                    audio.writeframes(b'\x40\x1f' * 24000)
            else:
                atomic_json(__import__('pathlib').Path(data['output']), [dict(text=data['script'], startMs=0, endMs=900)])
        finally:
            active -= 1
    monkeypatch.setattr(service, '_process', process)
    app = FastAPI(); app.include_router(create_router(service))
    with TestClient(app) as client:
        response = client.post('/api/speech/batches', json=request())
        assert response.status_code == 202, response.text
        first = response.json()
        again = client.post('/api/speech/batches', json=request()).json()
        assert [s['job_id'] for s in first['slides']] == [s['job_id'] for s in again['slides']]
        assert len(service.jobs) == 3
        for _ in range(200):
            result = client.get('/api/speech/batches/' + first['id']).json()
            if result['finished']: break
            time.sleep(.02)
        assert [s['job']['status'] for s in result['slides']] == ['complete', 'failed', 'complete']
        assert maximum == 1
        assert result['slides'][1]['job']['error'] == 'Synthetic failure'
        altered = request(); altered['slides'][0]['script'] = 'Different request'
        assert client.post('/api/speech/batches', json=altered).status_code == 400
        assert len(service.jobs) == 3
        # A retry has a fresh batch identifier and queues only the failed slide.
        retry = request(slides=[request()['slides'][1]]); retry['id'] = 'batch-' + 'c' * 32
        assert client.post('/api/speech/batches', json=retry).status_code == 202
        assert len(service.jobs) == 4


def test_batch_validates_every_profile_before_scheduling_any_job(queued_service):
    app = FastAPI(); app.include_router(create_router(queued_service))
    body = request(); body['slides'][1]['voice_id'] = 'voice-' + 'f' * 32
    with TestClient(app) as client:
        assert client.post('/api/speech/batches', json=body).status_code == 404
        assert queued_service.jobs == {}
        body = request(); body['slides'][1]['slide_id'] = body['slides'][0]['slide_id']
        assert client.post('/api/speech/batches', json=body).status_code == 422


def test_batch_cancel_and_restart_keep_completed_progress_and_expose_retryable_failures(queued_service, monkeypatch):
    from voice_service.api import BatchGenerateRequest
    service = queued_service
    monkeypatch.setattr(service.pool, 'submit', lambda *args: None)
    batch = service.generate_batch(BatchGenerateRequest.model_validate(request()))
    first = batch['slides'][0]['job_id']
    service._update(first, status='complete', result={'asset_id': 'cached'})
    restored = NarrationService(service.root)
    try:
        result = restored.get_batch(batch['id'])
        assert [s['job']['status'] for s in result['slides']] == ['complete', 'failed', 'failed']
        assert result['slides'][0]['job']['result']['asset_id'] == 'cached'
        assert 'restarted' in result['slides'][1]['job']['error']
    finally:
        restored.close()
    result = service.cancel_batch(batch['id'])
    assert [s['job']['status'] for s in result['slides']] == ['complete', 'cancelled', 'cancelled']
