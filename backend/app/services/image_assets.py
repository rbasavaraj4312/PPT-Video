"""Decode portable slide images and apply non-destructive editing metadata."""
import base64
import io
from PIL import Image, ImageEnhance, ImageOps


def rendered_image(element, opacity=1):
    if not element.image_src:
        raise ValueError('Image source is missing')
    raw = base64.b64decode(element.image_src.split(',', 1)[1], validate=True)
    with Image.open(io.BytesIO(raw)) as original:
        if original.width * original.height > 40_000_000:
            raise ValueError('Image dimensions are too large')
        image = ImageOps.exif_transpose(original).convert('RGBA')
    c = element.image_crop
    w, h = image.size
    left, top = round(c.x * w), round(c.y * h)
    image = image.crop((left, top, max(left + 1, round((c.x + c.width) * w)), max(top + 1, round((c.y + c.height) * h))))
    if element.flip_x:
        image = ImageOps.mirror(image)
    if element.flip_y:
        image = ImageOps.flip(image)
    alpha = image.getchannel('A')
    rgb = image.convert('RGB')
    if element.image_brightness != 100:
        rgb = ImageEnhance.Brightness(rgb).enhance(element.image_brightness / 100)
    if element.image_contrast != 100:
        contrast = element.image_contrast / 100
        rgb = rgb.point([max(0, min(255, round((value - 127.5) * contrast + 127.5))) for value in range(256)] * 3)
    if element.image_saturation != 100:
        saturation = element.image_saturation / 100
        # Match the CSS saturate() matrix used by the SVG renderer.
        rows = []
        for channel in range(3):
            rows.extend([weight * (1 - saturation) + (saturation if index == channel else 0)
                         for index, weight in enumerate([.213, .715, .072])] + [0])
        rgb = rgb.convert('RGB', tuple(rows))
    image = rgb.convert('RGBA')
    image.putalpha(alpha.point(lambda value: round(value * max(0, min(1, opacity)))))
    return image
