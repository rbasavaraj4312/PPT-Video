from voice_service.model_config import omnivoice_model


def cached_model(cache, repo, revision="test"):
    root = cache / ("models--" + repo.replace("/", "--"))
    folder = root / "snapshots" / revision
    for name in ("config.json", "model.safetensors", "tokenizer.json", "tokenizer_config.json",
                 "audio_tokenizer/config.json", "audio_tokenizer/model.safetensors"):
        path = folder / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("{}")
    return folder


def test_reuses_complete_original_model_and_honors_explicit_override(tmp_path, monkeypatch):
    monkeypatch.delenv("OMNIVOICE_MODEL", raising=False)
    monkeypatch.setenv("HF_HUB_CACHE", str(tmp_path))
    original = cached_model(tmp_path, "k2-fsa/OmniVoice")
    cached_model(tmp_path, "mlx-community/OmniVoice-bf16")
    assert omnivoice_model() == str(original)
    monkeypatch.setenv("OMNIVOICE_MODEL", "/custom/model")
    assert omnivoice_model() == "/custom/model"


def test_incomplete_snapshot_is_not_used(tmp_path, monkeypatch):
    monkeypatch.delenv("OMNIVOICE_MODEL", raising=False)
    monkeypatch.setenv("HF_HUB_CACHE", str(tmp_path))
    original = cached_model(tmp_path, "k2-fsa/OmniVoice")
    (original / "audio_tokenizer/model.safetensors").unlink()
    assert omnivoice_model() == "mlx-community/OmniVoice-bf16"


def test_current_revision_is_preferred(tmp_path, monkeypatch):
    monkeypatch.delenv("OMNIVOICE_MODEL", raising=False)
    monkeypatch.setenv("HF_HUB_CACHE", str(tmp_path))
    cached_model(tmp_path, "k2-fsa/OmniVoice", "aaa")
    current = cached_model(tmp_path, "k2-fsa/OmniVoice", "zzz")
    ref = current.parent.parent / "refs/main"
    ref.parent.mkdir()
    ref.write_text("zzz\n")
    assert omnivoice_model() == str(current)
