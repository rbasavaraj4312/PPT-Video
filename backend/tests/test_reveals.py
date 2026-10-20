import json
from pathlib import Path
import subprocess

import pytest
from pydantic import ValidationError

from backend.app.models.presentation import PresentationModel
from backend.app.services.reveals import reveal_anchors, validate_reveals


def deck():
    return PresentationModel.model_validate(dict(id='reveals', slides=[dict(id='one', title='Plan', narration=dict(
        script='Plan plan launch.', generated_script='Plan plan launch.', engine='omnivoice', generated_engine='omnivoice',
        voice_id='voice', generated_voice_id='voice', asset_id='a' * 64, duration_ms=3000, audio_start_ms=100, audio_end_ms=2900,
        captions=[dict(text='Plan', startMs=200, endMs=600), dict(text=' plan', startMs=1200, endMs=1600), dict(text=' launch.', startMs=2200, endMs=2600)]),
        elements=[dict(id='card', type='rectangle', reveal=None)])]))


def link(p, index=1, **patch):
    n = p.slides[0].narration
    from backend.app.models.presentation import NarrationReveal
    p.slides[0].elements[0].reveal = NarrationReveal(word_index=index, word_text=n.captions[index].text.strip(), **reveal_anchors(n), **patch)


def test_valid_reveals_roundtrip_and_follow_timing_corrections():
    p = deck(); link(p)
    validate_reveals(p)
    loaded = PresentationModel.model_validate_json(p.model_dump_json())
    loaded.slides[0].narration.captions[1].startMs = 1400
    loaded.slides[0].narration.asset_id = 'b' * 64
    validate_reveals(loaded)
    assert loaded.slides[0].elements[0].reveal == p.slides[0].elements[0].reveal


def test_stale_links_remain_saveable_but_block_export():
    p = deck(); link(p)
    p.slides[0].narration.captions[1].text = 'different'
    loaded = PresentationModel.model_validate_json(p.model_dump_json())
    with pytest.raises(ValueError, match='needs relinking'):
        validate_reveals(loaded)
    loaded.slides[0].elements[0].reveal = None
    validate_reveals(loaded)


def test_missing_narration_and_out_of_view_reveals_block_export():
    p = deck(); link(p, 0, offset_ms=-500)
    with pytest.raises(ValueError, match='visible interval'):
        validate_reveals(p)
    p.slides[0].narration = None
    with pytest.raises(ValueError, match='generate current narration'):
        validate_reveals(p)
    p = deck()
    with pytest.raises(ValidationError):
        link(p, duration_ms=20)


def test_python_and_javascript_word_anchor_hashes_match_for_unicode():
    p = deck(); p.slides[0].narration.script = 'Café 👋 ಕಂಠ'; p.slides[0].narration.captions[0].text = ' CAFE\u0301 '
    n = p.slides[0].narration
    source = "import {revealAnchors} from './frontend/src/narration/reveals.js'; let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(revealAnchors(JSON.parse(s))));"
    result = subprocess.run(['node', '--input-type=module', '-e', source], input=n.model_dump_json(), text=True,
                            capture_output=True, check=True, cwd=Path(__file__).resolve().parents[2])
    assert json.loads(result.stdout) == reveal_anchors(n)


def test_render_api_rejects_invalid_links_before_queuing_work(tmp_path, monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from voice_service.api import create_router
    from voice_service.service import NarrationService

    p = deck(); link(p)
    n = p.slides[0].narration
    folder = tmp_path / 'assets' / n.asset_id
    folder.mkdir(parents=True)
    (folder / 'result.json').write_text(n.model_dump_json())
    (folder / 'narration.wav').write_bytes(b'cached audio')
    service = NarrationService(tmp_path)
    queued = []
    monkeypatch.setattr(service, '_enqueue', lambda kind, data: queued.append((kind, data)) or {'id': 'render-check'})
    app = FastAPI(); app.include_router(create_router(service))
    with TestClient(app) as client:
        n.captions[1].text = 'different'
        response = client.post('/api/speech/render', json=p.model_dump())
        assert response.status_code == 400
        assert 'needs relinking' in response.json()['detail']
        assert queued == []
        n.captions[1].text = ' plan'
        assert client.post('/api/speech/render', json=p.model_dump()).status_code == 202
        assert queued[0][0] == 'render'
        assert len(queued) == 1  # No speech-generation job.
    service.pool.shutdown(wait=True)
