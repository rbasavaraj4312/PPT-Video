"""Exercise real on-demand startup, streaming, idle exit and restart without ML inference.

Run from the project root using an environment with backend requirements installed.
Uses temporary storage and temporary localhost ports; existing voices stay untouched.
"""
import io
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import time
import wave

import httpx

ROOT = Path(__file__).resolve().parents[2]


def port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def main():
    backend_port, voice_port = port(), port()
    while voice_port == backend_port:
        voice_port = port()
    with tempfile.TemporaryDirectory(prefix="ppt-voice-check-") as temp:
        folder = Path(temp)
        env = dict(os.environ, VOICE_SERVICE_PORT=str(voice_port), VOICE_SERVICE_IDLE_SECONDS="1",
                   VOICE_SERVICE_PYTHON=sys.executable, SPEECH_STORAGE_DIR=str(folder / "speech"))
        with (folder / "backend.log").open("wb") as log:
            process = subprocess.Popen([sys.executable, "-m", "uvicorn", "backend.app.main:app",
                "--host", "127.0.0.1", "--port", str(backend_port)], cwd=ROOT, env=env,
                stdout=log, stderr=subprocess.STDOUT)
        try:
            with httpx.Client(base_url=f"http://127.0.0.1:{backend_port}", timeout=40, trust_env=False) as client:
                deadline = time.monotonic() + 15
                while True:
                    try:
                        if client.get('/health').status_code == 200:
                            break
                    except httpx.HTTPError:
                        pass
                    if process.poll() is not None or time.monotonic() > deadline:
                        raise RuntimeError((folder / "backend.log").read_text())
                    time.sleep(.1)
                assert client.get('/api/speech/service/status').json()['running'] is False
                voices = client.get('/api/speech/voices')
                assert voices.status_code == 200, voices.text
                assert voices.json() == []
                assert client.get('/api/speech/service/status').json()['running'] is True
                data = io.BytesIO()
                with wave.open(data, 'wb') as out:
                    out.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
                    out.writeframes(b'\0\0' * (24000 * 4))
                upload = client.post('/api/speech/voices', data={'name': 'Check', 'transcript': 'Test reference.'},
                    files={'audio': ('voice.wav', data.getvalue(), 'audio/wav')})
                assert upload.status_code == 201, upload.text
                profile = upload.json()
                audio = client.get(f"/api/speech/voices/{profile['id']}/reference", headers={'Range': 'bytes=0-31'})
                assert audio.status_code == 206, audio.text
                assert audio.content[:4] == b'RIFF'
                assert len(audio.content) == 32
                invalid = client.post('/api/speech/render', json={'id': 'empty', 'slides': []})
                assert invalid.status_code == 400, invalid.text
                deadline = time.monotonic() + 10
                while client.get('/api/speech/service/status').json()['running']:
                    assert time.monotonic() < deadline, 'Voice service did not exit when idle'
                    time.sleep(.15)
                reopened = client.get('/api/speech/voices')
                assert reopened.status_code == 200, reopened.text
                assert reopened.json()[0]['id'] == profile['id']
                assert client.post('/api/speech/service/stop').json()['running'] is False
                assert client.get('/api/speech/service/status').json()['running'] is False
                assert client.get('/health').status_code == 200
                print(json.dumps(dict(lazy_start=True, multipart_upload=True, range_streaming=True,
                    validation_errors_preserved=True, idle_exit=True, restart_preserves_voices=True,
                    explicit_stop=True, backend_stays_healthy=True, models_downloaded=False), indent=2))
        except Exception:
            print((folder / "backend.log").read_text(errors="replace"), file=sys.stderr)
            worker_log = folder / "speech/service.log"
            if worker_log.exists():
                print(worker_log.read_text(errors="replace"), file=sys.stderr)
            raise
        finally:
            process.terminate()
            try:
                process.wait(timeout=20)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == '__main__':
    main()
