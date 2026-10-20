"""Resolve existing OmniVoice files without importing an inference library."""
import os
from pathlib import Path


def omnivoice_model():
    explicit = os.getenv("OMNIVOICE_MODEL")
    if explicit:
        return explicit
    home = Path(os.getenv("HF_HOME", str(Path(os.getenv("XDG_CACHE_HOME", str(Path.home() / ".cache"))) / "huggingface")))
    cache = Path(os.getenv("HF_HUB_CACHE", os.getenv("HUGGINGFACE_HUB_CACHE", str(home / "hub"))))
    for repo in ("k2-fsa/OmniVoice", "mlx-community/OmniVoice-bf16", "mlx-community/OmniVoice-bfloat16"):
        root = cache / ("models--" + repo.replace("/", "--"))
        ref = root / "refs" / "main"
        preferred = [root / "snapshots" / ref.read_text().strip()] if ref.is_file() else []
        candidates = preferred + sorted((root / "snapshots").glob("*"))
        for folder in candidates:
            required = ("config.json", "model.safetensors", "tokenizer.json", "tokenizer_config.json",
                        "audio_tokenizer/config.json", "audio_tokenizer/model.safetensors")
            if all((folder / name).is_file() for name in required):
                return str(folder)
    return "mlx-community/OmniVoice-bf16"
