import base64
import io
import json
import subprocess
from pathlib import Path
import imageio_ffmpeg
from PIL import Image

folder = Path(__file__).parent
video = folder / 'source.mp4'
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc2=size=320x180:rate=30:duration=2', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', str(video)], check=True)
stream = io.BytesIO()
Image.new('RGB', (320, 180), '#0b6785').save(stream, format='PNG')
image = 'data:image/png;base64,' + base64.b64encode(stream.getvalue()).decode()
def scene(id, duration, media=None):
    return dict(id=id, title=id, slide_duration=duration, transition_type='none', background='#000000', media=media, elements=[dict(id=id+'-image', type='image', image_src=image, image_width=320, image_height=180, x=0, y=0, width=1280, height=720)])
clip = dict(kind='video', src='data:video/mp4;base64,' + base64.b64encode(video.read_bytes()).decode(), duration=2, trim_start=.5, trim_end=1.5, fit='contain', volume=.5, muted=False, subtitles=[dict(text='Video subtitle', startMs=100, endMs=900)])
photo = dict(kind='image', src=image, duration=5, trim_start=0, trim_end=5, fit='contain', subtitles=[dict(text='Image subtitle', startMs=0, endMs=500)])
deck = dict(id='media-check', title='Media check', slides=[scene('opening', .5), scene('video', 1, clip), scene('image', .5, photo)])
(folder / 'render.json').write_text(json.dumps(dict(presentation=deck, assetBase='', output=str(folder.resolve() / 'media-check.mp4'))))
