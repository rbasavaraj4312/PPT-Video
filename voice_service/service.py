"""Disk-backed local voice assets and a serial, cancellable subprocess queue."""
import hashlib
import json
import os
import platform
import re
import signal
import subprocess
import sys
import threading
import time
import uuid
import wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import imageio_ffmpeg

from backend.app.models.presentation import CaptionModel
from voice_service.model_config import omnivoice_model
from voice_service.audio_timing import speech_bounds

ROOT = Path(__file__).resolve().parents[1] / "backend"
FRONTEND = ROOT.parent / "frontend"
WORKER = Path(__file__).with_name("speech_worker.py")
TERMINAL = {"complete", "failed", "cancelled"}


def atomic_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(f".{path.name}.{uuid.uuid4().hex}.tmp")
    temp.write_text(json.dumps(value, indent=2), encoding="utf-8")
    temp.replace(path)


def valid_id(value):
    if not re.fullmatch(r"[a-zA-Z0-9_-]{1,80}", value):
        raise ValueError("Invalid identifier")
    return value


def audio_duration(path):
    with wave.open(str(path), "rb") as audio:
        return audio.getnframes() / audio.getframerate() * 1000


class NarrationService:
    def __init__(self, root=None):
        self.root = Path(root or os.getenv("SPEECH_STORAGE_DIR", str(ROOT / "storage" / "speech"))).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.pool = ThreadPoolExecutor(max_workers=1, thread_name_prefix="narration")
        self.lock = threading.RLock()
        self.jobs, self.processes = {}, {}
        for path in self.root.glob("jobs/*/job.json"):
            job = json.loads(path.read_text())
            if job["status"] not in TERMINAL:
                job.update(status="failed", error="Voice service restarted. Retry this job.")
                atomic_json(path, job)
            self.jobs[job["id"]] = job

    def python(self, engine):
        return os.getenv({"omnivoice": "OMNIVOICE_PYTHON", "pocket": "POCKET_TTS_PYTHON",
                          "align": "ALIGNMENT_PYTHON"}[engine], sys.executable)

    def capabilities(self):
        engines = []
        for engine, module in [("omnivoice", "mlx_audio"), ("pocket", "pocket_tts"), ("align", "stable_whisper")]:
            compatible = engine != "omnivoice" or (platform.system() == "Darwin" and platform.machine() == "arm64")
            installed = False
            try:
                check = subprocess.run([self.python(engine), "-c", "import importlib.util,sys; sys.exit(0 if importlib.util.find_spec(sys.argv[1]) else 1)", module],
                                       capture_output=True, timeout=10)
                installed = check.returncode == 0
            except (OSError, subprocess.TimeoutExpired):
                pass
            engines.append(dict(id=engine, available=compatible and installed,
                                reason="Ready (model downloads may be needed)" if compatible and installed else
                                "Requires an Apple Silicon Mac" if not compatible else
                                f"Install speech dependencies or configure {engine} Python; see docs/narration.md"))
        return {"engines": engines, "serial": True, "default_engine": "omnivoice",
                "omnivoice_model": omnivoice_model()}

    def profiles(self):
        return [json.loads(p.read_text()) for p in sorted(self.root.glob("voices/*/profile.json"))]

    def profile(self, voice_id):
        path = self.root / "voices" / valid_id(voice_id) / "profile.json"
        if not path.exists():
            raise FileNotFoundError("Voice profile not found")
        return json.loads(path.read_text())

    def create_profile(self, name, transcript, source, start=0, end=None):
        voice_id = "voice-" + uuid.uuid4().hex
        folder = self.root / "voices" / voice_id
        folder.mkdir(parents=True)
        output = folder / "reference.wav"
        cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-nostdin", "-v", "error", "-protocol_whitelist", "file,pipe", "-ss", str(start), "-i", str(source)]
        limit = min(end - start, 15.1) if end is not None else 15.1
        cmd += ["-t", str(limit), "-ac", "1", "-ar", "24000", "-c:a", "pcm_s16le", "-y", str(output)]
        try:
            subprocess.run(cmd, capture_output=True, check=True, timeout=30)
            duration = audio_duration(output)
            if not 3000 <= duration <= 15000:
                raise ValueError("Choose a reference clip between 3 and 15 seconds; its transcript must match exactly.")
            profile = dict(id=voice_id, name=name.strip(), transcript=transcript.strip(),
                           duration_ms=duration, reference_hash=hashlib.sha256(output.read_bytes()).hexdigest(),
                           created_at=time.time())
            atomic_json(folder / "profile.json", profile)
            return profile
        except Exception:
            output.unlink(missing_ok=True)
            folder.rmdir()
            raise

    def get_job(self, job_id):
        with self.lock:
            job = self.jobs.get(valid_id(job_id))
            if job is None:
                raise FileNotFoundError("Job not found")
            snapshot = dict(job)
        if snapshot.get("kind") == "render" and snapshot["status"] == "running":
            log = self.root / "jobs" / job_id / "worker.log"
            if log.exists():
                with log.open("rb") as source:
                    source.seek(max(0, log.stat().st_size - 4096))
                    tail = source.read().decode(errors="replace")
                matches = re.findall(r"(Bundling|Rendering) (\d+)%", tail)
                if matches:
                    phase, progress = matches[-1]
                    snapshot.update(phase=phase, progress=int(progress))
        return snapshot

    def _update(self, job_id, **changes):
        with self.lock:
            job = self.jobs[job_id]
            if job["status"] == "cancelled":
                return
            job.update(changes, updated_at=time.time())
            atomic_json(self.root / "jobs" / job_id / "job.json", job)

    def cancel(self, job_id):
        with self.lock:
            job = self.get_job(job_id)
            if job["status"] in TERMINAL:
                return job
            self._update(job_id, status="cancelled", phase="Cancelled")
            process = self.processes.get(job_id)
            if process and process.poll() is None:
                self._terminate(process)
            return self.get_job(job_id)

    def _enqueue(self, kind, data):
        job_id = "job-" + uuid.uuid4().hex
        folder = self.root / "jobs" / job_id
        folder.mkdir(parents=True)
        job = dict(id=job_id, kind=kind, status="queued", phase="Queued", created_at=time.time(), error=None)
        with self.lock:
            self.jobs[job_id] = job
            atomic_json(folder / "job.json", job)
        self.pool.submit(self._run, job_id, data)
        return dict(job)

    def generate(self, request):
        profile = self.profile(request.voice_id)
        versions = {}
        for engine, package in [(request.engine, "mlx-audio" if request.engine == "omnivoice" else "pocket-tts"), ("align", "stable-ts")]:
            try:
                probe = subprocess.run([self.python(engine), "-c", "import importlib.metadata,sys; print(importlib.metadata.version(sys.argv[1]))", package], capture_output=True, text=True, timeout=10)
                versions[package] = probe.stdout.strip() if probe.returncode == 0 else "not-installed"
            except (OSError, subprocess.TimeoutExpired):
                versions[package] = "not-installed"
        settings = dict(engine=request.engine, script=request.script.strip(), voice_id=profile["id"],
                        reference_hash=profile["reference_hash"], transcript=profile["transcript"],
                        model=omnivoice_model() if request.engine == "omnivoice" else "pocket-english",
                        alignment_model=os.getenv("ALIGNMENT_MODEL", "base.en"), versions=versions, pipeline_version=3)
        fingerprint = hashlib.sha256(json.dumps(settings, sort_keys=True).encode()).hexdigest()
        prompt_key = hashlib.sha256(json.dumps({k: settings[k] for k in ["engine", "model", "reference_hash", "transcript", "versions", "pipeline_version"]}, sort_keys=True).encode()).hexdigest()
        return self._enqueue("speech", dict(**settings, asset_id=fingerprint,
                             prompt_cache=str(self.root / "voices" / profile["id"] / prompt_key),
                             reference=str(self.root / "voices" / profile["id"] / "reference.wav")))

    def render(self, presentation):
        from backend.app.services.narration_timeline import validate_narrations
        validate_narrations(presentation, self)
        presentation = self.prepare_timing(presentation)
        return self._enqueue("render", {"presentation": presentation.model_dump()})

    def asset_result(self, asset_id):
        path = self.asset(asset_id, "result.json")
        result = json.loads(path.read_text())
        if result.get("audio_start_ms") is None or result.get("audio_end_ms") is None:
            result.update(speech_bounds(self.asset(asset_id, "narration.wav"), result.get("captions", [])))
            atomic_json(path, result)
        return result

    def prepare_timing(self, presentation):
        from backend.app.services.narration_timeline import narration_ready
        prepared = presentation.model_copy(deep=True)
        for slide in prepared.slides:
            if narration_ready(slide.narration):
                result = self.asset_result(slide.narration.asset_id)
                slide.narration.audio_start_ms = result['audio_start_ms']
                slide.narration.audio_end_ms = result['audio_end_ms']
        return prepared

    def asset(self, asset_id, filename):
        if not re.fullmatch(r"[a-f0-9]{64}", asset_id) or filename not in {"narration.wav", "captions.json", "result.json"}:
            raise ValueError("Invalid asset")
        path = self.root / "assets" / asset_id / filename
        if not path.exists():
            raise FileNotFoundError("Audio asset not found")
        return path

    def _process(self, job_id, command, phase):
        self._update(job_id, status="running", phase=phase)
        folder = self.root / "jobs" / job_id
        with (folder / "worker.log").open("a") as log:
            with self.lock:
                if self.jobs[job_id]["status"] == "cancelled":
                    raise InterruptedError("Cancelled")
                process = subprocess.Popen(command, stdout=log, stderr=log, cwd=ROOT.parent,
                                           start_new_session=os.name != "nt")
                self.processes[job_id] = process
            deadline = time.monotonic() + 3600
            while process.poll() is None:
                if self.get_job(job_id)["status"] == "cancelled" or time.monotonic() > deadline:
                    self._terminate(process)
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        self._terminate(process, force=True)
                        process.wait()
                    raise InterruptedError("Cancelled or timed out")
                time.sleep(.2)
            with self.lock:
                self.processes.pop(job_id, None)
            if process.returncode:
                tail = (folder / "worker.log").read_text(errors="replace")[-1600:]
                for line in reversed(tail.splitlines()):
                    if line.startswith("VOICE_WORKER_ERROR: "):
                        try:
                            message = json.loads(line.removeprefix("VOICE_WORKER_ERROR: "))
                            if isinstance(message, str):
                                raise RuntimeError(message)
                        except json.JSONDecodeError:
                            pass
                raise RuntimeError(tail or f"{phase} failed")

    @staticmethod
    def _terminate(process, force=False):
        try:
            if os.name != "nt":
                os.killpg(process.pid, signal.SIGKILL if force else signal.SIGTERM)
            elif force:
                process.kill()
            else:
                process.terminate()
        except ProcessLookupError:
            pass

    def _run(self, job_id, data):
        folder = self.root / "jobs" / job_id
        try:
            if self.get_job(job_id)["status"] == "cancelled":
                return
            if self.jobs[job_id]["kind"] == "render":
                origin = os.getenv("NARRATION_API_ORIGIN", "http://127.0.0.1:8000").rstrip("/")
                data.update(assetBase=f"{origin}/api/speech/assets", output=str(folder / "video.mp4"))
                atomic_json(folder / "render.json", data)
                self._process(job_id, [os.getenv("NODE_BINARY", "node"), str(FRONTEND / "scripts/render-narration.mjs"), str(folder / "render.json")], "Rendering video")
                self._update(job_id, status="complete", phase="Ready", result={"download_url": f"/api/speech/jobs/{job_id}/video"})
                return
            asset_folder = self.root / "assets" / data["asset_id"]
            if (asset_folder / "result.json").exists():
                result = self.asset_result(data["asset_id"])
            else:
                cap = {x["id"]: x for x in self.capabilities()["engines"]}
                for engine in [data["engine"], "align"]:
                    if not cap[engine]["available"]:
                        raise RuntimeError(cap[engine]["reason"])
                data["output"] = str(folder / "narration.wav")
                atomic_json(folder / "synthesize.json", data)
                self._process(job_id, [self.python(data["engine"]), str(WORKER), "synthesize", str(folder / "synthesize.json")], "Generating speech")
                duration = audio_duration(folder / "narration.wav")
                alignment = dict(audio=str(folder / "narration.wav"), script=data["script"],
                                 alignment_model=data["alignment_model"], output=str(folder / "captions.json"))
                atomic_json(folder / "align.json", alignment)
                self._process(job_id, [self.python("align"), str(WORKER), "align", str(folder / "align.json")], "Aligning words")
                captions = [CaptionModel.model_validate(c).model_dump() for c in json.loads((folder / "captions.json").read_text())]
                if any(c["endMs"] > duration + 500 for c in captions):
                    raise ValueError("Caption timing exceeds audio duration")
                result = dict(asset_id=data["asset_id"], duration_ms=duration, captions=captions,
                              generated_script=data["script"], generated_engine=data["engine"], generated_voice_id=data["voice_id"])
                result.update(speech_bounds(folder / "narration.wav", captions))
                result["metrics"] = {}
                for stage, name in [("generation", "narration.wav"), ("alignment", "captions.json")]:
                    metrics_path = folder / f"{name}.metrics.json"
                    if metrics_path.exists():
                        result["metrics"][stage] = json.loads(metrics_path.read_text())
                if self.get_job(job_id)["status"] == "cancelled":
                    return
                asset_folder.mkdir(parents=True, exist_ok=True)
                (folder / "narration.wav").replace(asset_folder / "narration.wav")
                atomic_json(asset_folder / "captions.json", captions)
                atomic_json(asset_folder / "result.json", result)
            self._update(job_id, status="complete", phase="Ready", result=result)
        except Exception as exc:
            self._update(job_id, status="failed", phase="Failed", error=str(exc))

    def busy(self):
        with self.lock:
            return any(job["status"] not in TERMINAL for job in self.jobs.values()) or bool(self.processes)

    def close(self):
        for job_id in list(self.jobs):
            if self.jobs[job_id]["status"] not in TERMINAL:
                self.cancel(job_id)
        self.pool.shutdown(wait=True, cancel_futures=True)

