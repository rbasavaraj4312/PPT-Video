"""Verify that both native and HTML motion changed in the encoded test MP4."""
import json
from pathlib import Path
import subprocess
import sys

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'output/motion-animation-check'


def main():
    video = Path(sys.argv[1]) if len(sys.argv) > 1 else OUTPUT / 'motion-check.mp4'
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()

    def crop(frame, region):
        return subprocess.run([ffmpeg, '-v', 'error', '-i', str(video), '-vf',
            f'select=eq(n\\,{frame}),crop={region}', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
            capture_output=True, check=True).stdout

    native = [crop(frame, '750:270:75:300') for frame in [61, 85]]
    legacy = [crop(frame, '750:270:1050:300') for frame in [61, 85]]
    counts = [sum(r > 160 and g > 130 and b < 100 for r, g, b in zip(pixels[::3], pixels[1::3], pixels[2::3])) for pixels in native]
    assert counts[1] > counts[0] + 1000, f'Native highlight is frozen: {counts}'
    difference = sum(abs(a - b) for a, b in zip(*legacy)) / len(legacy[0])
    assert difference > 1, f'HTML motion is frozen: {difference}'
    report = dict(native_highlight_pixels_early_late=counts, legacy_mean_pixel_change=difference,
                  decoded_frames=[61, 85], passed=True)
    (OUTPUT / 'export-check.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
