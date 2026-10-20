"""Lazy process supervision and HTTP transport, without importing any voice code."""
import asyncio
import os
from pathlib import Path
import subprocess
import time

import httpx

ROOT = Path(__file__).resolve().parents[3]


class VoiceServiceUnavailable(RuntimeError):
    pass


class VoiceProcess:
    def __init__(self):
        self.port = int(os.getenv("VOICE_SERVICE_PORT", "8001"))
        self.url = f"http://127.0.0.1:{self.port}"
        self.process = None
        self.lock = asyncio.Lock()
        self.client = None
        self.log_path = Path(os.getenv("SPEECH_STORAGE_DIR", str(ROOT / "backend/storage/speech"))) / "service.log"

    def http(self):
        if self.client is None or self.client.is_closed:
            self.client = httpx.AsyncClient(timeout=httpx.Timeout(60, connect=2), trust_env=False)
        return self.client

    async def health(self):
        try:
            response = await self.http().get(self.url + "/health", timeout=.5)
            data = response.json()
            return data if response.status_code == 200 and data.get("service") == "voice" else None
        except (httpx.HTTPError, ValueError):
            return None

    def interpreter(self):
        configured = os.getenv("VOICE_SERVICE_PYTHON")
        if configured:
            return configured
        for path in (ROOT / "voice_service/.venv/bin/python", ROOT / "backend/.venv-speech/bin/python"):
            if path.is_file():
                return str(path)
        raise VoiceServiceUnavailable("Set up voice_service/.venv or set VOICE_SERVICE_PYTHON to your speech environment's Python. See docs/narration.md.")

    async def ensure_running(self):
        async with self.lock:
            if await self.health():
                return
            if self.process is not None and self.process.poll() is None:
                raise VoiceServiceUnavailable("Voice service is not responding. Check " + str(self.log_path))
            self.log_path.parent.mkdir(parents=True, exist_ok=True)
            try:
                with self.log_path.open("ab") as log:
                    self.process = subprocess.Popen([self.interpreter(), "-m", "voice_service"], cwd=ROOT,
                        env=dict(os.environ, VOICE_SERVICE_PORT=str(self.port)), stdout=log,
                        stderr=subprocess.STDOUT, start_new_session=True)
            except OSError as exc:
                raise VoiceServiceUnavailable(f"Could not start voice service: {exc}") from exc
            deadline = time.monotonic() + 30
            while time.monotonic() < deadline:
                if self.process.poll() is not None:
                    raise VoiceServiceUnavailable("Voice service could not start. Install its requirements and check " + str(self.log_path))
                if await self.health():
                    return
                await asyncio.sleep(.1)
            await self.stop()
            raise VoiceServiceUnavailable("Voice service startup timed out. Check " + str(self.log_path))

    async def stop(self):
        process = self.process
        if process is not None and process.poll() is None:
            process.terminate()
            try:
                await asyncio.to_thread(process.wait, timeout=15)
            except subprocess.TimeoutExpired:
                process.kill()
                await asyncio.to_thread(process.wait)
        self.process = None

    async def close(self):
        await self.stop()
        if self.client:
            await self.client.aclose()


voice_process = VoiceProcess()
