"""Short-lived inference process. Heavy libraries are never imported by FastAPI."""
import argparse
import os
import json
import re
import resource
import sys
import time
import uuid
from pathlib import Path


def chunks(text, limit=280):
    """Sentence-aware chunks, with a hard word-boundary limit for long sentences."""
    result, current = [], ""
    for word in re.findall(r"\S+\s*", text):
        if current and len(current) + len(word) > limit:
            result.append(current.strip())
            current = ""
        current += word
        if re.search(r'[.!?][\"\u201d\u2019)]?\s*$', word) and len(current) > limit // 2:
            result.append(current.strip())
            current = ""
    if current.strip():
        result.append(current.strip())
    return result


def synthesize(data):
    import numpy as np
    import soundfile as sf
    audio_parts = []
    if data["engine"] == "pocket":
        import torch
        from pocket_tts import TTSModel, export_model_state
        torch.set_num_threads(max(1, min(4, int(os.getenv("VOICE_CPU_THREADS", "1")))))
        model = TTSModel.load_model()
        if not model.has_voice_cloning:
            raise RuntimeError(
                "Your voice profile is saved, but Pocket TTS could not access its voice-cloning weights. "
                "Accept the terms at https://huggingface.co/kyutai/pocket-tts, then run "
                "`hf auth login` in the voice service's Python environment using the same account. "
                "Retry Generate voice afterward; no new recording is needed. "
                "If already logged in, check model access, token permissions, and the worker log."
            )
        prompt = Path(data["prompt_cache"] + ".safetensors")
        if not prompt.exists():
            voice = model.get_state_for_audio_prompt(data["reference"])
            temp = prompt.with_name(f".{uuid.uuid4().hex}.safetensors")
            export_model_state(voice, str(temp))
            temp.replace(prompt)
        else:
            voice = model.get_state_for_audio_prompt(str(prompt))
        rate = model.sample_rate
        for text in chunks(data["script"]):
            # Pocket TTS disables gradients internally. An outer inference_mode
            # creates inference tensors its generation threads cannot update.
            part = model.generate_audio(voice, text).detach().cpu().numpy().reshape(-1)
            audio_parts.extend([part, np.zeros(int(rate * .12), dtype=np.float32)])
    else:
        import mlx.core as mx
        from mlx_audio.tts.utils import load_model
        from mlx_audio.tts.models.omnivoice.utils import create_voice_clone_prompt
        model = load_model(data["model"])
        if model.audio_tokenizer is None or model.text_tokenizer is None:
            raise RuntimeError("OmniVoice's local audio and text tokenizer files are required for voice cloning.")
        prompt = Path(data["prompt_cache"] + ".npy")
        if prompt.exists():
            ref_tokens = mx.load(str(prompt))
        else:
            ref_tokens = create_voice_clone_prompt(data["reference"], tokenizer=model.audio_tokenizer,
                                                  ref_text=data["transcript"], max_duration_s=15)
            mx.eval(ref_tokens)
            temp = prompt.with_name(f".{uuid.uuid4().hex}.npy")
            mx.save(str(temp), ref_tokens)
            temp.replace(prompt)
        rate = 24000
        for text in chunks(data["script"]):
            # Reference is already a short, user-reviewed clip with its exact transcript.
            parts = list(model.generate(text=text, language="en",
                         ref_tokens=ref_tokens, ref_text=data["transcript"],
                         num_steps=32))
            if not parts:
                raise RuntimeError("OmniVoice returned no audio")
            for part in parts:
                rate = part.sample_rate
                audio_parts.append(np.asarray(part.audio, dtype=np.float32).reshape(-1))
            audio_parts.append(np.zeros(int(rate * .12), dtype=np.float32))
            mx.clear_cache()
    if not audio_parts:
        raise RuntimeError("Speech engine returned no audio")
    sf.write(data["output"], np.concatenate(audio_parts), rate, subtype="PCM_16")


def align(data):
    import torch
    torch.set_num_threads(max(1, min(4, int(os.getenv("VOICE_CPU_THREADS", "1")))))
    import stable_whisper
    model = stable_whisper.load_model(data.get("alignment_model", "base.en"), device="cpu")
    result = model.align(data["audio"], data["script"], language="en")
    if result is None:
        raise RuntimeError("Alignment failed. Retry or use a larger alignment model.")
    captions = []
    for segment in result.to_dict()["segments"]:
        for word in segment.get("words", []):
            start, end = float(word["start"]) * 1000, float(word["end"]) * 1000
            captions.append(dict(text=word["word"], startMs=start, endMs=max(start, end),
                                 timestampMs=(start + end) / 2, confidence=word.get("probability")))
    if not captions:
        raise RuntimeError("Alignment returned no words")
    Path(data["output"]).write_text(json.dumps(captions), encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=["synthesize", "align"])
    parser.add_argument("request")
    args = parser.parse_args()
    data = json.loads(Path(args.request).read_text(encoding="utf-8"))
    try:
        started = time.monotonic()
        {"synthesize": synthesize, "align": align}[args.mode](data)
        rss = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
        metrics = dict(elapsed_seconds=round(time.monotonic() - started, 3),
                       peak_rss_mb=round(rss / (1024 * 1024 if sys.platform == "darwin" else 1024), 1))
        Path(data["output"] + ".metrics.json").write_text(json.dumps(metrics))
    except Exception as exc:
        # Keep the full engine diagnostics in worker.log, but give the UI only
        # the final error instead of download progress and catalog dumps.
        print("VOICE_WORKER_ERROR: " + json.dumps(f"{type(exc).__name__}: {exc}"), file=sys.stderr)
        raise SystemExit(1)
