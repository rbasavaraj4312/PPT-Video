import io
import json
import subprocess
from pathlib import Path
import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw

folder = Path(__file__).parent
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
video = folder / 'media-check.mp4'
reader = imageio_ffmpeg.read_frames(str(video), pix_fmt='rgb24', output_params=['-vf', 'scale=640:360'])
meta = next(reader)
frames = [Image.frombytes('RGB', (640, 360), data) for data in reader]
assert len(frames) == 60, len(frames)
# Opening is a still blue slide, then video colors, then the still image with subtitles.
assert frames[5].getpixel((20,20))[2] > frames[5].getpixel((20,20))[0]
assert frames[25].getpixel((20,20)) != frames[5].getpixel((20,20))
assert np.count_nonzero(np.all(np.array(frames[52])[270:345] > 210, axis=2)) > 50
raw = subprocess.check_output([ffmpeg, '-v', 'error', '-i', str(video), '-vn', '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'])
samples = np.frombuffer(raw, dtype=np.float32)
def rms(start,end):
    return float(np.sqrt(np.mean(samples[int(start*16000):int(end*16000)]**2)))
levels = dict(opening=rms(.1,.4), video=rms(.65,1.35), image=rms(1.65,1.9))
assert levels['video'] > .01, levels
assert levels['opening'] < .001 and levels['image'] < .001, levels
sheet = Image.new('RGB', (640*3,390), '#101827')
for index, frame in enumerate([frames[5],frames[25],frames[52]]):
    sheet.paste(frame, (index*640,30))
    ImageDraw.Draw(sheet).text((index*640+12,10), ['Opening','Trimmed video + subtitle','Image + subtitle'][index],fill='white')
sheet.save(folder/'contact-sheet.jpg')
(folder/'verification.json').write_text(json.dumps(dict(frames=len(frames), duration=meta['duration'], audio_rms=levels),indent=2))
print((folder/'verification.json').read_text())
