"""Saved files and brief WAV conversion. No worker, model, or background threads."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import time
import uuid
import wave
import imageio_ffmpeg
from .audio_timing import speech_bounds

TERMINAL = {'complete', 'failed', 'cancelled'}


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f'.{path.name}.{uuid.uuid4().hex}.tmp')
    temp.write_text(json.dumps(value, indent=2), encoding='utf-8')
    temp.replace(path)


def valid_id(value):
    if not re.fullmatch(r'[a-zA-Z0-9_-]{1,80}', value):
        raise ValueError('Invalid identifier')
    return value


def audio_duration(path):
    with wave.open(str(path), 'rb') as audio:
        return audio.getnframes() / audio.getframerate() * 1000


class SpeechStorage:
    def __init__(self, root=None):
        self.root = Path(root or os.getenv('SPEECH_STORAGE_DIR', str(Path(__file__).resolve().parents[2] / 'storage/speech'))).resolve()

    def profiles(self):
        return [json.loads(path.read_text()) for path in sorted(self.root.glob('voices/*/profile.json'))]

    def profile(self, voice_id):
        path = self.root / 'voices' / valid_id(voice_id) / 'profile.json'
        if not path.is_file():
            raise FileNotFoundError('Voice profile not found')
        return json.loads(path.read_text())

    def create_profile(self, name, transcript, source, start=0, end=None):
        voice_id = 'voice-' + uuid.uuid4().hex
        folder = self.root / 'voices' / voice_id
        folder.mkdir(parents=True)
        output = folder / 'reference.wav'
        limit = min(end - start, 15.1) if end is not None else 15.1
        command = [imageio_ffmpeg.get_ffmpeg_exe(), '-nostdin', '-v', 'error', '-protocol_whitelist', 'file,pipe',
            '-ss', str(start), '-i', str(source), '-t', str(limit), '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', '-y', str(output)]
        try:
            subprocess.run(command, capture_output=True, check=True, timeout=30)
            duration = audio_duration(output)
            if not 3000 <= duration <= 15000:
                raise ValueError('Choose a reference clip between 3 and 15 seconds; its transcript must match exactly.')
            profile = dict(id=voice_id, name=name.strip(), transcript=transcript.strip(), duration_ms=duration,
                reference_hash=hashlib.sha256(output.read_bytes()).hexdigest(), created_at=time.time())
            atomic_json(folder / 'profile.json', profile)
            return profile
        except Exception:
            output.unlink(missing_ok=True)
            folder.rmdir()
            raise

    def asset(self, asset_id, filename):
        if not re.fullmatch(r'[a-f0-9]{64}', asset_id) or filename not in {'narration.wav', 'captions.json', 'result.json'}:
            raise ValueError('Invalid asset')
        path = self.root / 'assets' / asset_id / filename
        if not path.is_file():
            raise FileNotFoundError('Audio asset not found')
        return path

    def asset_result(self, asset_id):
        path = self.asset(asset_id, 'result.json')
        result = json.loads(path.read_text())
        if result.get('audio_start_ms') is None or result.get('audio_end_ms') is None:
            result.update(speech_bounds(self.asset(asset_id, 'narration.wav'), result.get('captions', [])))
            atomic_json(path, result)
        return result

    def prepare_timing(self, presentation):
        from .narration_timeline import narration_ready
        prepared = presentation.model_copy(deep=True)
        for slide in prepared.slides:
            if narration_ready(slide.narration):
                result = self.asset_result(slide.narration.asset_id)
                slide.narration.audio_start_ms = result['audio_start_ms']
                slide.narration.audio_end_ms = result['audio_end_ms']
        return prepared

    def get_job(self, job_id):
        path = self.root / 'jobs' / valid_id(job_id) / 'job.json'
        if not path.is_file():
            raise FileNotFoundError('Job not found')
        job = json.loads(path.read_text())
        if job.get('kind') == 'render' and job['status'] == 'running':
            log = path.with_name('worker.log')
            if log.exists():
                with log.open('rb') as source:
                    source.seek(max(0, log.stat().st_size - 4096))
                    matches = re.findall(r'(Bundling|Rendering) (\d+)%', source.read().decode(errors='replace'))
                if matches:
                    phase, progress = matches[-1]
                    job.update(phase=phase, progress=int(progress))
        return job

    def batch_manifest(self, batch_id):
        path = self.root / 'batches' / valid_id(batch_id) / 'batch.json'
        if not path.is_file():
            raise FileNotFoundError('Voice batch not found')
        return json.loads(path.read_text())

    def get_batch(self, batch_id):
        batch = self.batch_manifest(batch_id)
        batch.pop('fingerprint', None)
        batch['slides'] = [dict(**row, job=self.get_job(row['job_id'])) for row in batch['slides']]
        batch['finished'] = all(row['job']['status'] in TERMINAL for row in batch['slides'])
        return batch
