"""Encode a short synthetic fixture to verify real audio trims and Morph captions.

No TTS inference, model downloads, or changes to saved presentations.
"""
from array import array
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import math
import os
from pathlib import Path
import random
import struct
import subprocess
import sys
import tempfile
import threading
import wave

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
import imageio_ffmpeg
from backend.app.models.presentation import PresentationModel
from backend.app.services.narration_timeline import timeline, srt
from voice_service.audio_timing import speech_bounds


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, *args):
        pass


def main():
    report_path = ROOT / 'output/continuous-narration/export-check.json'
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        folder = Path(temporary)
        rate, slides, originals = 24000, [], []
        for index, word in enumerate(['First', 'Second']):
            asset_id = str(index + 1) * 64
            directory = folder / 'assets' / asset_id
            directory.mkdir(parents=True)
            rng = random.Random(index)
            samples = [0] * 9600 + [rng.randrange(-6000, 6001) for _ in range(9600)] + [0] * 9600
            path = directory / 'narration.wav'
            with wave.open(str(path), 'wb') as out:
                out.setparams((1, 2, rate, 0, 'NONE', 'not compressed'))
                out.writeframes(struct.pack('<' + 'h' * len(samples), *samples))
            captions = [dict(text=word, startMs=400, endMs=800)]
            narration = dict(script=word, generated_script=word, engine='omnivoice', generated_engine='omnivoice',
                voice_id='v', generated_voice_id='v', asset_id=asset_id, duration_ms=1200, padding_ms=200,
                captions=captions, caption_style=dict(highlight='#22d3ee', font_size=40), **speech_bounds(path, captions))
            slides.append(dict(id=word, title=word, background=['#152030', '#302015'][index],
                               transition_type='morph', transition_duration=1, narration=narration, elements=[]))
            originals.append(samples)
        presentation = PresentationModel.model_validate(dict(id='continuous-check', slides=slides))
        items, frames = timeline(presentation)
        server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=str(folder)))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            request = folder / 'request.json'
            video = folder / 'check.mp4'
            request.write_text(json.dumps(dict(presentation=presentation.model_dump(),
                assetBase=f'http://127.0.0.1:{server.server_port}/assets', output=str(video))))
            env = dict(os.environ)
            browser = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            if Path(browser).exists():
                env.setdefault('REMOTION_BROWSER_EXECUTABLE', browser)
            encoded = subprocess.run(['node', str(ROOT / 'frontend/scripts/render-narration.mjs'), str(request)],
                env=env, capture_output=True, text=True, timeout=180)
            if encoded.returncode:
                raise RuntimeError(encoded.stdout[-4000:] + encoded.stderr[-4000:])
            ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
            raw = subprocess.run([ffmpeg, '-v', 'error', '-i', str(video), '-vn', '-ac', '1', '-ar', str(rate),
                                  '-f', 'f32le', '-'], capture_output=True, check=True).stdout
            audio = array('f', raw)
            correlations = []
            for source, item in zip(originals, items):
                # Compare the middle of the actual signal after the source trim.
                source_from, source_to = 11000, 18000
                encoded_from = round((item['start'] - item['audio_from']) / 30 * rate) + source_from
                a = [value / 32768 for value in source[source_from:source_to]]
                b = audio[encoded_from:encoded_from + len(a)]
                correlation = sum(x*y for x, y in zip(a, b)) / math.sqrt(sum(x*x for x in a) * sum(y*y for y in b))
                assert correlation > .85, correlation
                correlations.append(correlation)
            reader = imageio_ffmpeg.read_frames(str(video))
            metadata = next(reader)
            reader.close()
            assert abs(metadata['duration'] - frames / 30) < .05
            # At this frame Morph and an outgoing highlighted caption overlap.
            frame = items[0]['transition_start']
            pixels = subprocess.run([ffmpeg, '-v', 'error', '-i', str(video), '-vf',
                f'select=eq(n\\,{frame}),crop=iw:ih/3:0:ih*2/3', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                capture_output=True, check=True).stdout
            cyan = sum(1 for r, g, b in zip(pixels[::3], pixels[1::3], pixels[2::3]) if r < 100 and g > 150 and b > 170)
            assert cyan > 100, 'Highlighted caption missing during Morph'
            report = dict(frames=frames, duration_seconds=frames / 30, transition_adds_silence=False,
                          audio_correlations=correlations, highlighted_caption_pixels_during_morph=cyan,
                          timeline=items, srt=srt(presentation), model_inference=False)
            report_path.write_text(json.dumps(report, indent=2))
            print(json.dumps(report, indent=2))
        finally:
            server.shutdown()
            server.server_close()
            thread.join()


if __name__ == '__main__':
    main()
