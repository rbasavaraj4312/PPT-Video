"""Check the actual MP4's audio, timings, and decoded frames."""
import json
from pathlib import Path
import subprocess
import sys

import imageio_ffmpeg
import numpy as np
import soundfile as sf

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1]))
from backend.app.models.presentation import PresentationModel
from backend.app.services.narration_timeline import timeline, srt, validate_narrations
from backend.app.services.narration import NarrationService


def main():
    deck = PresentationModel.model_validate_json((HERE / "presentation.json").read_text())
    service = NarrationService(HERE)
    try:
        validate_narrations(deck, service)
    finally:
        service.close()
    items, frames = timeline(deck)
    (HERE / "momentum-demo.srt").write_text(srt(deck))
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    video = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else HERE / "momentum-demo.mp4"
    # Decoding the complete file verifies all frames and the encoded audio.
    checked = subprocess.run([ffmpeg, "-v", "error", "-i", str(video), "-f", "null", "-"], capture_output=True, check=True)
    if checked.stderr:
        raise RuntimeError(checked.stderr.decode())
    reader = imageio_ffmpeg.read_frames(str(video))
    metadata = next(reader)
    reader.close()
    assert metadata["size"] == (1920, 1080)
    assert metadata["fps"] == 30
    assert abs(metadata["duration"] - frames/30) < .05
    raw = subprocess.run([ffmpeg, "-v", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", "24000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    mixed = np.frombuffer(raw, dtype=np.float32)
    clips = []
    for slide, item in zip(deck.slides, items):
        n = slide.narration
        assert " ".join(c.text.strip() for c in n.captions) == n.script
        assert all(0 <= c.startMs < c.endMs <= n.duration_ms for c in n.captions)
        assert all(a.endMs <= b.startMs+.001 for a,b in zip(n.captions,n.captions[1:]))
        source, rate = sf.read(HERE / "assets" / n.asset_id / "narration.wav")
        assert rate == 24000
        start = round(item["start"] / 30 * rate)
        rendered = mixed[start:start + len(source)]
        correlation = float(np.corrcoef(source[:len(rendered)], rendered)[0,1])
        assert correlation > .97, (slide.id, correlation)
        clips.append(dict(scene=slide.id, audio_seconds=len(source)/rate,
                          words=len(n.captions), rendered_audio_correlation=round(correlation,5)))
    qa = HERE / ("qa-consistent" if video.stem.endswith("-consistent") else "qa")
    qa.mkdir(exist_ok=True)
    selected = [45,181,245,397,470,595]
    expression = "+".join(f"eq(n,{frame})" for frame in selected)
    subprocess.run([ffmpeg,"-v","error","-i",str(video),"-vf",
                    f"select='{expression}',scale=640:-1,tile=3x2", "-frames:v","1","-y",str(qa/"contact-sheet.png")], check=True)
    report = dict(duration_seconds=frames/30, resolution=list(metadata["size"]), fps=30,
                  video_bytes=video.stat().st_size, decoded_without_errors=True, clips=clips)
    (qa / "validation.json").write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
