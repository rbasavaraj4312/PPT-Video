import json
from pathlib import Path
import struct
import subprocess
import wave

from backend.app.models.presentation import PresentationModel
from backend.app.services.narration_timeline import timeline, srt
from voice_service.audio_timing import speech_bounds
from voice_service.service import NarrationService, atomic_json
from voice_service.api import create_router
from fastapi import FastAPI
from fastapi.testclient import TestClient


def write_audio(path, spans):
    samples = []
    for duration, level in spans:
        samples.extend([level] * round(duration * 1000))
    with wave.open(str(path), 'wb') as out:
        out.setparams((1, 2, 1000, 0, 'NONE', 'not compressed'))
        out.writeframes(struct.pack('<' + 'h' * len(samples), *samples))


def test_boundary_scan_preserves_quiet_speech_and_internal_pauses(tmp_path):
    path = tmp_path / 'voice.wav'
    write_audio(path, [(.4, 0), (.2, 80), (.3, 0), (.2, 8000), (.4, 0)])
    assert speech_bounds(path) == {'audio_start_ms': 320, 'audio_end_ms': 1220}
    captions = [{'startMs': 100, 'endMs': 1400}]
    assert speech_bounds(path, captions) == {'audio_start_ms': 20, 'audio_end_ms': 1500}
    write_audio(path, [(1, 0)])
    assert speech_bounds(path) == {'audio_start_ms': 0, 'audio_end_ms': 1000}


def test_existing_assets_gain_timing_without_running_models(tmp_path, monkeypatch):
    service = NarrationService(tmp_path)
    asset_id = 'a' * 64
    folder = tmp_path / 'assets' / asset_id
    folder.mkdir(parents=True)
    write_audio(folder / 'narration.wav', [(.4, 0), (.4, 8000), (.4, 0)])
    narration = dict(asset_id=asset_id, duration_ms=1200, captions=[], script='Hello', generated_script='Hello',
                     engine='omnivoice', generated_engine='omnivoice', voice_id='v', generated_voice_id='v')
    atomic_json(folder / 'result.json', narration)
    monkeypatch.setattr(service, '_process', lambda *args: (_ for _ in ()).throw(AssertionError('No inference needed')))
    app = FastAPI()
    app.include_router(create_router(service))
    try:
        with TestClient(app) as client:
            result = client.get(f'/api/speech/assets/{asset_id}/result.json').json()
            assert result['audio_start_ms'] == 320
            assert result['audio_end_ms'] == 920
            deck = PresentationModel.model_validate(dict(id='deck', slides=[dict(id='one', narration=narration)]))
            prepared = service.prepare_timing(deck)
            assert prepared.slides[0].narration.audio_start_ms == 320
            assert prepared.slides[0].narration.audio_end_ms == 920
            assert deck.slides[0].narration.audio_start_ms is None
            monkeypatch.setattr('voice_service.service.speech_bounds', lambda *args: (_ for _ in ()).throw(AssertionError('Timing is cached')))
            assert client.get(f'/api/speech/assets/{asset_id}/result.json').json() == result
    finally:
        service.close()


def test_python_and_javascript_timing_and_srt_match():
    narration = dict(script='Hello', generated_script='Hello', engine='omnivoice', generated_engine='omnivoice',
                     voice_id='v', generated_voice_id='v', asset_id='a' * 64, duration_ms=2100,
                     audio_start_ms=400, audio_end_ms=1600, padding_ms=150,
                     captions=[dict(text='Hello', startMs=600, endMs=1400)])
    decks = []
    for fps in [24, 30, 60]:
        for offset in [-5000, -150, 0, 250, 5000]:
            deck = PresentationModel.model_validate(dict(id='deck', slides=[dict(id=str(i),
                narration=({**narration, 'fit_to_audio': i % 2 == 0} if i != 2 else None),
                slide_duration=.5, transition_type=['morph', 'fade', 'none'][i % 3],
                transition_duration=4 if i % 2 else .55, transition_timing='manual', transition_offset_ms=offset)
                for i in range(5)]))
            decks.append(dict(presentation=deck.model_dump(), fps=fps))
    script = """import {buildTimeline} from './frontend/src/narration/timeline.js';
      let input=''; for await(const chunk of process.stdin) input+=chunk;
      console.log(JSON.stringify(JSON.parse(input).map(({presentation,fps})=>{
        const t=buildTimeline(presentation,fps); return {items:t.items.map(({slide,narrated,...item})=>item), total:t.totalFrames};
      })));"""
    process = subprocess.run(['node', '--input-type=module', '-e', script], input=json.dumps(decks),
                             text=True, capture_output=True, check=True, cwd=Path(__file__).resolve().parents[2])
    for request, actual in zip(decks, json.loads(process.stdout)):
        p = PresentationModel.model_validate(request['presentation'])
        items, total = timeline(p, request['fps'])
        assert actual == dict(items=items, total=total)
        assert all(a['start'] + a['audio_frames'] <= b['start'] for a, b in zip(items, items[1:]))
        boundaries = [item for item in items if item['transition']]
        assert all(a['transition_start'] + a['transition'] <= b['transition_start'] for a, b in zip(boundaries, boundaries[1:]))
    p = PresentationModel.model_validate(dict(id='srt', slides=[dict(id='s', narration=narration)]))
    assert '00:00:00,200 --> 00:00:01,000' in srt(p)
