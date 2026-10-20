import json
import sys
from types import SimpleNamespace

import pytest

from voice_service.service import NarrationService
from voice_service.speech_worker import synthesize


def test_custom_voice_requires_cloning_weights_before_prompt_creation(monkeypatch):
    model = SimpleNamespace(has_voice_cloning=False)
    monkeypatch.setitem(sys.modules, "torch", SimpleNamespace(set_num_threads=lambda count: None))
    monkeypatch.setitem(sys.modules, "pocket_tts", SimpleNamespace(
        TTSModel=SimpleNamespace(load_model=lambda: model), export_model_state=None))
    with pytest.raises(RuntimeError, match="Your voice profile is saved") as error:
        synthesize({"engine": "pocket"})
    assert "https://huggingface.co/kyutai/pocket-tts" in str(error.value)
    assert "hf auth login" in str(error.value)


def test_worker_error_excludes_download_noise_from_ui(tmp_path):
    service = NarrationService(tmp_path)
    job_id = "job-test-error"
    folder = tmp_path / "jobs" / job_id
    folder.mkdir(parents=True)
    service.jobs[job_id] = {"id": job_id, "status": "queued"}
    message = "Your voice profile is saved; enable cloning access."
    script = "import sys; print('Download diagnostics'); print('VOICE_WORKER_ERROR: ' + " + repr(json.dumps(message)) + "); sys.exit(1)"
    try:
        with pytest.raises(RuntimeError) as error:
            service._process(job_id, [sys.executable, "-c", script], "Generating")
        assert str(error.value) == message
        assert "Download diagnostics" in (folder / "worker.log").read_text()
    finally:
        service.close()
