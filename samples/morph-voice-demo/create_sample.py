"""Generate the sample's speech, forced word alignment, and editable deck.

Run from the repository root with backend/.venv-speech/bin/python.
Model caches stay inside this sample directory.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
os.environ.setdefault("HF_HOME", str(HERE / ".cache" / "huggingface"))
os.environ.setdefault("XDG_CACHE_HOME", str(HERE / ".cache"))
sys.path.insert(0, str(ROOT))

SCRIPTS = [
    "Start with one clear idea. Give your audience a single message they can remember.",
    "Turn that idea into a plan. Notice how the same cards move smoothly into alignment.",
    "Now bring the launch into focus. Combine clarity, practical planning, and one confident next step.",
]
VOICE_ID = "voice-" + hashlib.md5(b"momentum-demo-alba").hexdigest()


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2))


def element(key, kind, x, y, width, height, **style):
    return dict(id=key, morph_id=key, type=kind, x=x, y=y, width=width,
                height=height, rotation=0, opacity=1, **style)


def main():
    import numpy as np
    import soundfile as sf
    import torch
    from pocket_tts import TTSModel
    from backend.app.models.presentation import PresentationModel

    torch.set_num_threads(2)
    torch.manual_seed(42)
    assets = HERE / "assets"
    model = None
    results = []
    for i, script in enumerate(SCRIPTS):
        asset_id = hashlib.sha256(("morph-demo-alba-v1:" + script).encode()).hexdigest()
        folder = assets / asset_id
        folder.mkdir(parents=True, exist_ok=True)
        wav = folder / "narration.wav"
        if not wav.exists():
            if model is None:
                print("Loading Pocket TTS and the built-in Alba voice...", flush=True)
                model = TTSModel.load_model()
                voice = model.get_state_for_audio_prompt("alba")
            print(f"Generating voice {i+1}/3", flush=True)
            # Pocket TTS handles gradients itself and generates on worker threads.
            # An outer inference_mode creates caches those threads cannot update.
            speech = model.generate_audio(voice, script).detach().cpu().numpy().reshape(-1)
            # A short lead-in gives each scene a clean visual opening.
            speech = np.concatenate([np.zeros(int(model.sample_rate * .25)), speech])
            sf.write(wav, speech, model.sample_rate, subtype="PCM_16")
        results.append(dict(folder=folder, asset_id=asset_id, duration_ms=sf.info(wav).duration * 1000))

    del model
    import gc
    gc.collect()
    import stable_whisper
    aligner = None
    for i, (script, result) in enumerate(zip(SCRIPTS, results)):
        folder = result.pop("folder")
        if not (folder / "captions.json").exists():
            if aligner is None:
                print("Loading Whisper for forced word alignment...", flush=True)
                aligner = stable_whisper.load_model("base.en", device="cpu", download_root=str(HERE / ".cache" / "whisper"))
            audio, rate = sf.read(folder / "narration.wav", dtype="float32")
            import scipy.signal
            audio = scipy.signal.resample_poly(audio, 16000, rate).astype(np.float32)
            print(f"Aligning words {i+1}/3", flush=True)
            aligned = aligner.align(audio, script, language="en")
            if aligned is None:
                raise RuntimeError("Forced alignment failed")
            captions = [dict(text=w["word"], startMs=w["start"]*1000,
                             endMs=w["end"]*1000,
                             timestampMs=(w["start"]+w["end"])*500,
                             confidence=w.get("probability"))
                        for seg in aligned.to_dict()["segments"] for w in seg["words"]]
            save(folder / "alignment-review.json", aligned.to_dict())
            if not captions or any(c["endMs"] <= c["startMs"] for c in captions):
                raise RuntimeError("Alignment contains missing or zero-length words")
            save(folder / "captions.json", captions)
        result.update(captions=json.loads((folder / "captions.json").read_text()),
                      generated_script=script, generated_engine="pocket", generated_voice_id=VOICE_ID)
        save(folder / "result.json", result)

    voice_folder = HERE / "voices" / VOICE_ID
    voice_folder.mkdir(parents=True, exist_ok=True)
    reference = assets / results[0]["asset_id"] / "narration.wav"
    shutil.copyfile(reference, voice_folder / "reference.wav")
    save(voice_folder / "profile.json", dict(id=VOICE_ID, name="Alba (sample voice)",
         transcript=SCRIPTS[0], duration_ms=results[0]["duration_ms"],
         reference_hash=hashlib.sha256(reference.read_bytes()).hexdigest(), created_at=time.time()))
    shutil.copytree(voice_folder, ROOT / "backend/storage/speech/voices" / VOICE_ID, dirs_exist_ok=True)

    colors = ["#67e8f9", "#a5b4fc", "#fcd34d"]
    layouts = [
        [(86,300,530,220),(648,300,258,220),(938,300,256,220)],
        [(86,300,340,220),(458,300,340,220),(830,300,364,220)],
        [(86,300,240,220),(358,300,242,220),(632,300,562,220)],
    ]
    headlines = ["One idea. Real momentum.", "Put the pieces in place.", "Make the next move."]
    subtitles = ["Start with a message worth remembering.", "A simple plan turns clarity into progress.", "From a clear idea to a confident launch."]
    slides = []
    for i, result in enumerate(results):
        els = [
            element("brand", "text", 82, 48, 700, 34, content="M O M E N T U M   /   A VISUAL STORY", font_size=20, font_color="#94a3b8", font_weight="bold", z_index=5),
            element("step", "text", 1080, 48, 114, 34, content="01 → 03", font_size=20, font_color=colors[i], text_align="right", z_index=5),
            element("headline", "text", 82, 119, 1112, 90, content="One idea. Real momentum.", font_size=64, font_weight="bold", font_color="#f8fafc", z_index=5),
            element("subtitle", "text", 84, 216, 1110, 50, content="One clear message. A simple plan. A confident launch.", font_size=28, font_color="#94a3b8", z_index=5),
            element("baseline", "rectangle", 86, 564, 1108, 2, fill="#263244", stroke="transparent", z_index=1),
        ]
        for j, (x,y,w,h) in enumerate(layouts[i]):
            active = i == j
            els.append(element(f"card-{j}", "rounded_rectangle", x,y,w,h,
                               fill="#172d3d" if active else "#111e30", stroke=colors[j] if active else "#2b3b50",
                               stroke_width=2, radius=24, z_index=2))
            els.append(element(f"number-{j}", "text", x+22,y+20,w-44,30,
                               content=f"0{j+1}", font_size=20, font_weight="bold", font_color=colors[j], z_index=3))
            els.append(element(f"label-{j}", "text", x+22,y+h/2-12,w-44,64,
                               content=["IDEA","PLAN","LAUNCH"][j], font_size=44,
                               font_weight="bold", font_color=colors[j] if active else "#e2e8f0", z_index=3))
        narration = dict(script=SCRIPTS[i], engine="pocket", voice_id=VOICE_ID, **result,
                         fit_to_audio=True, padding_ms=550,
                         caption_style=dict(enabled=True,font_size=28,highlight="#67e8f9",color="#ffffff",position="bottom",words_per_phrase=6))
        slides.append(dict(id=f"momentum-{i+1}",title=headlines[i],background="#081321",
                           transition_type="morph",transition_duration=1.15,
                           elements=els,narration=narration))
    deck = PresentationModel.model_validate(dict(id="sample-morph-voice-demo",title="Momentum — Voice & Morph Demo",aspect_ratio="16:9",slides=slides)).model_dump(mode="json")
    save(HERE / "presentation.json", deck)
    # Keep this example editable and playable in the existing application.
    save(ROOT / "backend/storage/data/sample-morph-voice-demo.json", deck)
    for result in results:
        shutil.copytree(assets / result["asset_id"], ROOT / "backend/storage/speech/assets" / result["asset_id"], dirs_exist_ok=True)
    save(HERE / "render.json", dict(presentation=deck,assetBase="http://127.0.0.1:8766/assets",output=str(HERE / "momentum-demo.mp4")))
    print("READY: presentation.json, render.json and aligned narration assets", flush=True)


if __name__ == "__main__":
    main()
