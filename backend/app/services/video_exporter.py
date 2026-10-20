import io
import math
import os
import tempfile
import logging
import functools
from typing import Dict, List, Optional, Tuple
from PIL import Image, ImageDraw, ImageFont
import numpy as np
import imageio
import imageio.v3 as iio

from ..models.presentation import (
    PresentationModel,
    SlideModel,
    ElementModel,
    ElementType,
    ArrowHead,
    StrokeStyle,
)

logger = logging.getLogger(__name__)

CANVAS_WIDTH = 1280
CANVAS_HEIGHT = 720
DEFAULT_FPS = 30

RESOLUTION_MAP_16_9: Dict[str, Tuple[int, int]] = {
    "480p": (854, 480),
    "720p": (1280, 720),
    "1080p": (1920, 1080),
    "1440p": (2560, 1440),
    "2k": (2560, 1440),
    "4k": (3840, 2160),
}

RESOLUTION_MAP_9_16: Dict[str, Tuple[int, int]] = {
    "480p": (480, 854),
    "720p": (720, 1280),
    "1080p": (1080, 1920),
    "1440p": (1440, 2560),
    "2k": (1440, 2560),
    "4k": (2160, 3840),
}

# Legacy alias for backward compatibility
RESOLUTION_MAP = RESOLUTION_MAP_16_9


def parse_resolution(res_str: str, aspect_ratio: str = "16:9") -> Tuple[int, int]:
    """Parse resolution string e.g. '1080p', '720p', '1080x1920' into (width, height) honoring aspect ratio."""
    clean = str(res_str).strip().lower()
    is_vertical = str(aspect_ratio).strip() == "9:16"
    res_map = RESOLUTION_MAP_9_16 if is_vertical else RESOLUTION_MAP_16_9

    if clean in res_map:
        return res_map[clean]
    if "x" in clean:
        try:
            parts = clean.split("x")
            w, h = int(parts[0]), int(parts[1])
            w = (w // 2) * 2
            h = (h // 2) * 2
            if w >= 240 and h >= 240:
                return (w, h)
        except Exception:
            pass
    return (720, 1280) if is_vertical else (CANVAS_WIDTH, CANVAS_HEIGHT)

# System fonts search list
SYSTEM_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
]
SYSTEM_BOLD_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
]


@functools.lru_cache(maxsize=256)
def get_font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    candidates = SYSTEM_BOLD_FONTS if bold else SYSTEM_FONTS
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, max(10, int(size)))
            except Exception:
                continue
    try:
        return ImageFont.load_default()
    except Exception:
        return None


def hex_to_rgba(hex_str: Optional[str], opacity: float = 1.0) -> Optional[Tuple[int, int, int, int]]:
    if not hex_str or hex_str in ("transparent", "none"):
        return None
    clean = hex_str.strip().lstrip("#")
    if len(clean) == 3:
        clean = "".join(c * 2 for c in clean)
    if len(clean) != 6:
        return None
    try:
        r = int(clean[0:2], 16)
        g = int(clean[2:4], 16)
        b = int(clean[4:6], 16)
        a = max(0, min(255, int(opacity * 255)))
        return (r, g, b, a)
    except ValueError:
        return None


def lerp(a: float, b: float, t: float) -> float:
    return (1.0 - t) * a + t * b


def lerp_color(
    c1: Optional[str], c2: Optional[str], t: float, op1: float = 1.0, op2: float = 1.0
) -> Optional[str]:
    rgba1 = hex_to_rgba(c1, op1)
    rgba2 = hex_to_rgba(c2, op2)

    if rgba1 is None and rgba2 is None:
        return None
    if rgba1 is None:
        # Fade in c2
        return c2
    if rgba2 is None:
        # Fade out c1
        return c1

    r = int(lerp(rgba1[0], rgba2[0], t))
    g = int(lerp(rgba1[1], rgba2[1], t))
    b = int(lerp(rgba1[2], rgba2[2], t))
    return f"#{r:02x}{g:02x}{b:02x}"


def ease_in_out(t: float) -> float:
    # Smoothstep easing (3t^2 - 2t^3)
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


class VideoExporter:
    def __init__(self, fps: int = DEFAULT_FPS):
        self.fps = fps

    def render_element(
        self,
        base_img: Image.Image,
        elem: ElementModel,
        global_opacity: float = 1.0,
        scale: float = 1.0,
        canvas_w: int = CANVAS_WIDTH,
        canvas_h: int = CANVAS_HEIGHT,
    ) -> None:
        """Render a single element onto the PIL RGBA image with alpha transparency and resolution scaling."""
        effective_opacity = elem.opacity * global_opacity
        if effective_opacity <= 0.01:
            return

        if elem.type == ElementType.IMAGE:
            from .image_assets import rendered_image
            image = rendered_image(elem, effective_opacity).resize((max(1, round(elem.width * scale)), max(1, round(elem.height * scale))), Image.Resampling.LANCZOS)
            if elem.rotation:
                image = image.rotate(-elem.rotation, resample=Image.Resampling.BICUBIC, expand=True)
            center = ((elem.x + elem.width / 2) * scale, (elem.y + elem.height / 2) * scale)
            base_img.alpha_composite(image, (round(center[0] - image.width / 2), round(center[1] - image.height / 2)))
            return

        # Create overlay layer for transparent drawing
        overlay = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        fill_rgba = hex_to_rgba(elem.fill, effective_opacity)
        stroke_rgba = hex_to_rgba(elem.stroke, effective_opacity)
        stroke_width = max(1, round(elem.stroke_width * scale))

        # 1. Shapes
        if elem.type in (ElementType.RECTANGLE, ElementType.ROUNDED_RECTANGLE):
            x1 = round(elem.x * scale)
            y1 = round(elem.y * scale)
            x2 = round((elem.x + max(2, elem.width)) * scale)
            y2 = round((elem.y + max(2, elem.height)) * scale)

            if elem.type == ElementType.ROUNDED_RECTANGLE:
                radius = max(2, round((elem.radius or 16) * scale))
                draw.rounded_rectangle(
                    [x1, y1, x2, y2],
                    radius=radius,
                    fill=fill_rgba,
                    outline=stroke_rgba if elem.stroke else None,
                    width=stroke_width if elem.stroke else 0,
                )
            else:
                draw.rectangle(
                    [x1, y1, x2, y2],
                    fill=fill_rgba,
                    outline=stroke_rgba if elem.stroke else None,
                    width=stroke_width if elem.stroke else 0,
                )

            # Labeled shape text if content exists
            if elem.content:
                pad = 10 * scale
                self._draw_text(
                    draw,
                    elem.content,
                    x1 + pad,
                    y1 + pad,
                    max(10, elem.width * scale - pad * 2),
                    max(10, elem.height * scale - pad * 2),
                    elem.font_size * scale,
                    elem.font_color,
                    elem.font_weight == "bold",
                    align="center",
                    opacity=effective_opacity,
                )

        elif elem.type == ElementType.ELLIPSE:
            x1 = round(elem.x * scale)
            y1 = round(elem.y * scale)
            x2 = round((elem.x + max(2, elem.width)) * scale)
            y2 = round((elem.y + max(2, elem.height)) * scale)
            draw.ellipse(
                [x1, y1, x2, y2],
                fill=fill_rgba,
                outline=stroke_rgba if elem.stroke else None,
                width=stroke_width if elem.stroke else 0,
            )
            if elem.content:
                pad = 10 * scale
                self._draw_text(
                    draw,
                    elem.content,
                    x1 + pad,
                    y1 + pad,
                    max(10, elem.width * scale - pad * 2),
                    max(10, elem.height * scale - pad * 2),
                    elem.font_size * scale,
                    elem.font_color,
                    elem.font_weight == "bold",
                    align="center",
                    opacity=effective_opacity,
                )

        elif elem.type in (ElementType.LINE, ElementType.ARROW):
            x1 = float((elem.x1 if elem.x1 is not None else elem.x) * scale)
            y1 = float((elem.y1 if elem.y1 is not None else elem.y) * scale)
            x2 = float((elem.x2 if elem.x2 is not None else (elem.x + elem.width)) * scale)
            y2 = float((elem.y2 if elem.y2 is not None else (elem.y + elem.height)) * scale)

            color = stroke_rgba or (37, 99, 235, int(255 * effective_opacity))
            draw.line([x1, y1, x2, y2], fill=color, width=stroke_width)

            # Arrowheads
            angle = math.atan2(y2 - y1, x2 - x1)
            head_len = max(8.0 * scale, stroke_width * 4.0)

            # Arrow head end
            if elem.type == ElementType.ARROW or elem.arrow_head in (
                ArrowHead.END,
                ArrowHead.BOTH,
            ):
                tip = (x2, y2)
                p1 = (
                    x2 - head_len * math.cos(angle - math.pi / 6),
                    y2 - head_len * math.sin(angle - math.pi / 6),
                )
                p2 = (
                    x2 - head_len * math.cos(angle + math.pi / 6),
                    y2 - head_len * math.sin(angle + math.pi / 6),
                )
                draw.polygon([tip, p1, p2], fill=color)

            # Arrow head start
            if elem.arrow_head in (ArrowHead.START, ArrowHead.BOTH):
                tip = (x1, y1)
                p1 = (
                    x1 + head_len * math.cos(angle - math.pi / 6),
                    y1 + head_len * math.sin(angle - math.pi / 6),
                )
                p2 = (
                    x1 + head_len * math.cos(angle + math.pi / 6),
                    y1 + head_len * math.sin(angle + math.pi / 6),
                )
                draw.polygon([tip, p1, p2], fill=color)

        elif elem.type == ElementType.TEXT:
            self._draw_text(
                draw,
                elem.content,
                elem.x * scale,
                elem.y * scale,
                elem.width * scale,
                elem.height * scale,
                elem.font_size * scale,
                elem.font_color,
                elem.font_weight == "bold",
                align=elem.text_align,
                opacity=effective_opacity,
                vertical_align=elem.vertical_align,
            )

        elif elem.type == ElementType.ICON:
            x1 = round(elem.x * scale)
            y1 = round(elem.y * scale)
            x2 = round((elem.x + max(2.0, elem.width)) * scale)
            y2 = round((elem.y + max(2.0, elem.height)) * scale)
            w = max(2, x2 - x1)
            h = max(2, y2 - y1)

            # 1. Badge container
            badge_color_hex = getattr(elem, "badge_color", None) or elem.fill
            badge_rgba = hex_to_rgba(badge_color_hex, effective_opacity)
            badge_style = getattr(elem, "icon_badge", "none") or "none"

            # If label exists, icon badge takes upper portion, label takes lower portion
            label_text = elem.content.strip() if elem.content else ""
            if label_text:
                label_font_size = max(10, elem.font_size * scale * 0.75)
                badge_h = max(20, h - int(label_font_size * 1.5))
                icon_box_y2 = y1 + badge_h
            else:
                badge_h = h
                icon_box_y2 = y2

            if badge_style == "circle":
                diam = min(w, badge_h)
                bcx = x1 + w / 2
                bcy = y1 + badge_h / 2
                bx1 = round(bcx - diam / 2)
                by1 = round(bcy - diam / 2)
                bx2 = round(bcx + diam / 2)
                by2 = round(bcy + diam / 2)
                draw.ellipse(
                    [bx1, by1, bx2, by2],
                    fill=badge_rgba,
                    outline=stroke_rgba if elem.stroke else None,
                    width=stroke_width if elem.stroke else 0,
                )
                center_x, center_y = bcx, bcy
                icon_size = diam * 0.55
            elif badge_style == "rounded":
                rx = round(min(16 * scale, w * 0.25))
                draw.rounded_rectangle(
                    [x1, y1, x2, icon_box_y2],
                    radius=rx,
                    fill=badge_rgba,
                    outline=stroke_rgba if elem.stroke else None,
                    width=stroke_width if elem.stroke else 0,
                )
                center_x = (x1 + x2) / 2
                center_y = (y1 + icon_box_y2) / 2
                icon_size = min(w, badge_h) * 0.55
            else:
                if badge_rgba:
                    draw.rectangle([x1, y1, x2, icon_box_y2], fill=badge_rgba)
                center_x = (x1 + x2) / 2
                center_y = (y1 + icon_box_y2) / 2
                icon_size = min(w, badge_h) * 0.65

            # 2. Icon symbol vector drawing
            icon_color_hex = getattr(elem, "icon_color", None) or elem.stroke or elem.font_color or "#38bdf8"
            icon_rgba = hex_to_rgba(icon_color_hex, effective_opacity) or (56, 189, 248, int(255 * effective_opacity))
            icon_name = getattr(elem, "icon_name", "box") or "box"
            self._draw_icon_symbol(
                draw,
                icon_name,
                center_x,
                center_y,
                max(12.0, icon_size),
                icon_rgba,
                stroke_w=max(2, int(stroke_width)),
            )

            # 3. Label text underneath if present
            if label_text:
                self._draw_text(
                    draw,
                    label_text,
                    x1,
                    icon_box_y2 + 4 * scale,
                    w,
                    h - badge_h,
                    max(10, elem.font_size * scale * 0.75),
                    elem.font_color or "#ffffff",
                    bold=elem.font_weight == "bold",
                    align="center",
                    opacity=effective_opacity,
                )

        # Composite overlay on base image
        base_img.alpha_composite(overlay)

    def _draw_icon_symbol(
        self,
        draw: ImageDraw.Draw,
        icon_name: str,
        cx: float,
        cy: float,
        size: float,
        color: Tuple[int, int, int, int],
        stroke_w: int = 2,
    ) -> None:
        """Draw crisp vector iconography onto PIL canvas for 60 FPS video export."""
        clean_name = icon_name.lower().replace("-", "_").strip() if icon_name else "box"
        half = size / 2.0
        x1 = cx - half
        y1 = cy - half
        x2 = cx + half
        y2 = cy + half

        if "database" in clean_name or "db" in clean_name:
            disk_h = size * 0.22
            draw.ellipse([x1, y1, x2, y1 + disk_h * 2], outline=color, width=stroke_w)
            mid_y = y1 + size * 0.35
            draw.arc([x1, mid_y, x2, mid_y + disk_h * 2], start=0, end=180, fill=color, width=stroke_w)
            bot_y = y1 + size * 0.7
            draw.arc([x1, bot_y, x2, bot_y + disk_h * 2], start=0, end=180, fill=color, width=stroke_w)
            draw.line([x1, y1 + disk_h, x1, bot_y + disk_h], fill=color, width=stroke_w)
            draw.line([x2, y1 + disk_h, x2, bot_y + disk_h], fill=color, width=stroke_w)

        elif "server" in clean_name:
            bar_h = size * 0.24
            gap = size * 0.1
            for i in range(3):
                by1 = y1 + i * (bar_h + gap)
                by2 = by1 + bar_h
                draw.rounded_rectangle([x1, by1, x2, by2], radius=max(2, int(bar_h * 0.25)), outline=color, width=stroke_w)
                led_r = max(2.0, size * 0.04)
                draw.ellipse([x1 + size * 0.15 - led_r, (by1 + by2) / 2 - led_r, x1 + size * 0.15 + led_r, (by1 + by2) / 2 + led_r], fill=color)

        elif "cloud" in clean_name:
            base_y = cy + half * 0.6
            draw.line([cx - half * 0.65, base_y, cx + half * 0.65, base_y], fill=color, width=stroke_w)
            r_c = half * 0.55
            draw.arc([cx - r_c, cy - half * 0.7, cx + r_c, cy + half * 0.4], start=180, end=360, fill=color, width=stroke_w)
            draw.arc([cx - half * 0.9, cy - half * 0.2, cx - half * 0.1, cy + half * 0.6], start=130, end=310, fill=color, width=stroke_w)
            draw.arc([cx + half * 0.1, cy - half * 0.1, cx + half * 0.9, cy + half * 0.6], start=230, end=50, fill=color, width=stroke_w)

        elif "shield" in clean_name:
            crest = [
                (cx - half * 0.7, cy - half * 0.7),
                (cx + half * 0.7, cy - half * 0.7),
                (cx + half * 0.7, cy + half * 0.1),
                (cx, cy + half * 0.8),
                (cx - half * 0.7, cy + half * 0.1),
            ]
            draw.polygon(crest, outline=color, width=stroke_w)
            draw.line([cx - half * 0.25, cy, cx - half * 0.05, cy + half * 0.25], fill=color, width=stroke_w)
            draw.line([cx - half * 0.05, cy + half * 0.25, cx + half * 0.35, cy - half * 0.2], fill=color, width=stroke_w)

        elif "lock" in clean_name:
            body_y1 = cy - half * 0.1
            draw.rounded_rectangle([cx - half * 0.6, body_y1, cx + half * 0.6, y2], radius=max(2, int(size * 0.08)), outline=color, width=stroke_w)
            draw.arc([cx - half * 0.35, y1 + half * 0.1, cx + half * 0.35, body_y1 + half * 0.35], start=180, end=360, fill=color, width=stroke_w)
            draw.line([cx - half * 0.35, cy - half * 0.1, cx - half * 0.35, body_y1], fill=color, width=stroke_w)
            draw.line([cx + half * 0.35, cy - half * 0.1, cx + half * 0.35, body_y1], fill=color, width=stroke_w)
            draw.ellipse([cx - 2, cy + half * 0.2 - 2, cx + 2, cy + half * 0.2 + 2], fill=color)

        elif "cpu" in clean_name or "chip" in clean_name:
            pw = size * 0.5
            px1, py1, px2, py2 = cx - pw / 2, cy - pw / 2, cx + pw / 2, cy + pw / 2
            draw.rounded_rectangle([px1, py1, px2, py2], radius=max(2, int(size * 0.08)), outline=color, width=stroke_w)
            draw.rounded_rectangle([px1 + 4, py1 + 4, px2 - 4, py2 - 4], radius=2, outline=color, width=1)
            pin_len = size * 0.15
            for offset in (-pw * 0.25, pw * 0.25):
                draw.line([px1 - pin_len, cy + offset, px1, cy + offset], fill=color, width=stroke_w)
                draw.line([px2, cy + offset, px2 + pin_len, cy + offset], fill=color, width=stroke_w)
                draw.line([cx + offset, py1 - pin_len, cx + offset, py1], fill=color, width=stroke_w)
                draw.line([cx + offset, py2, cx + offset, py2 + pin_len], fill=color, width=stroke_w)

        elif "terminal" in clean_name or "code" in clean_name:
            draw.rounded_rectangle([x1, y1, x2, y2], radius=max(2, int(size * 0.1)), outline=color, width=stroke_w)
            draw.line([x1, y1 + size * 0.22, x2, y1 + size * 0.22], fill=color, width=1)
            for dx in (-0.6, -0.4, -0.2):
                dot_x = cx + half * dx
                dot_y = y1 + size * 0.11
                draw.ellipse([dot_x - 1.5, dot_y - 1.5, dot_x + 1.5, dot_y + 1.5], fill=color)
            draw.line([cx - half * 0.5, cy + half * 0.1, cx - half * 0.2, cy + half * 0.3], fill=color, width=stroke_w)
            draw.line([cx - half * 0.2, cy + half * 0.3, cx - half * 0.5, cy + half * 0.5], fill=color, width=stroke_w)
            draw.line([cx, cy + half * 0.5, cx + half * 0.4, cy + half * 0.5], fill=color, width=stroke_w)

        elif "globe" in clean_name or "network" in clean_name:
            draw.ellipse([x1, y1, x2, y2], outline=color, width=stroke_w)
            draw.line([x1, cy, x2, cy], fill=color, width=stroke_w)
            draw.ellipse([cx - half * 0.45, y1, cx + half * 0.45, y2], outline=color, width=stroke_w)

        elif "user" in clean_name:
            head_r = half * 0.38
            draw.ellipse([cx - head_r, cy - half * 0.7 - head_r / 2, cx + head_r, cy - half * 0.7 + head_r * 1.5], outline=color, width=stroke_w)
            draw.arc([cx - half * 0.75, cy - half * 0.1, cx + half * 0.75, cy + half * 1.1], start=180, end=360, fill=color, width=stroke_w)

        elif "zap" in clean_name or "lightning" in clean_name:
            pts = [
                (cx + half * 0.1, y1),
                (cx - half * 0.5, cy + half * 0.1),
                (cx, cy + half * 0.1),
                (cx - half * 0.1, y2),
                (cx + half * 0.5, cy - half * 0.1),
                (cx, cy - half * 0.1),
            ]
            draw.polygon(pts, fill=color)

        elif "check" in clean_name:
            draw.ellipse([x1, y1, x2, y2], outline=color, width=stroke_w)
            draw.line([cx - half * 0.4, cy, cx - half * 0.1, cy + half * 0.3], fill=color, width=stroke_w)
            draw.line([cx - half * 0.1, cy + half * 0.3, cx + half * 0.45, cy - half * 0.3], fill=color, width=stroke_w)

        elif "boxes" in clean_name or "layer" in clean_name:
            layer_h = size * 0.28
            for offset_y in (-half * 0.35, half * 0.25):
                top_y = cy + offset_y - layer_h / 2
                pts = [
                    (cx, top_y),
                    (cx + half * 0.7, top_y + layer_h / 2),
                    (cx, top_y + layer_h),
                    (cx - half * 0.7, top_y + layer_h / 2),
                ]
                draw.polygon(pts, outline=color, width=stroke_w)

        elif "git" in clean_name or "branch" in clean_name or "workflow" in clean_name:
            r_node = max(3.0, size * 0.1)
            draw.line([cx - half * 0.3, y1 + r_node, cx - half * 0.3, y2 - r_node], fill=color, width=stroke_w)
            draw.line([cx - half * 0.3, cy, cx + half * 0.3, cy - half * 0.4], fill=color, width=stroke_w)
            draw.ellipse([cx - half * 0.3 - r_node, y1, cx - half * 0.3 + r_node, y1 + r_node * 2], fill=color)
            draw.ellipse([cx - half * 0.3 - r_node, y2 - r_node * 2, cx - half * 0.3 + r_node, y2], fill=color)
            draw.ellipse([cx + half * 0.3 - r_node, cy - half * 0.4 - r_node, cx + half * 0.3 + r_node, cy - half * 0.4 + r_node], fill=color)

        else:
            pts = [
                (cx, y1 + 2),
                (x2 - 2, cy),
                (cx, y2 - 2),
                (x1 + 2, cy),
            ]
            draw.polygon(pts, outline=color, width=stroke_w)
            letter = (icon_name[0] if icon_name else "★").upper()
            font = get_font(max(10, int(size * 0.45)), bold=True)
            if font:
                try:
                    bbox = font.getbbox(letter)
                    lw = bbox[2] - bbox[0]
                    lh = bbox[3] - bbox[1]
                except Exception:
                    lw = size * 0.3
                    lh = size * 0.3
                draw.text((cx - lw / 2, cy - lh / 2), letter, fill=color, font=font)

    def _draw_text(
        self,
        draw: ImageDraw.Draw,
        text: str,
        x: float,
        y: float,
        w: float,
        h: float,
        font_size: float,
        color_hex: str,
        bold: bool = False,
        align: str = "left",
        opacity: float = 1.0,
        vertical_align: Optional[str] = None,
    ) -> None:
        if not text:
            return
        font = get_font(max(8, int(font_size)), bold)
        color = hex_to_rgba(color_hex, opacity) or (15, 23, 42, int(255 * opacity))

        def get_line_width(s: str) -> float:
            if not s:
                return 0.0
            if font:
                try:
                    return font.getlength(s)
                except Exception:
                    try:
                        bbox = font.getbbox(s)
                        return float(bbox[2] - bbox[0])
                    except Exception:
                        pass
            return len(s) * font_size * 0.55

        # Word wrap text into lines that fit within max_w
        max_w = max(10.0, w) if w > 0 else float("inf")
        lines: List[str] = []
        for raw_line in str(text).split("\n"):
            if not raw_line.strip():
                lines.append("")
                continue
            words = raw_line.strip().split(" ")
            curr_line = ""
            for word in words:
                if not word:
                    continue
                test_line = f"{curr_line} {word}".strip() if curr_line else word
                if get_line_width(test_line) <= max_w or not curr_line:
                    curr_line = test_line
                else:
                    lines.append(curr_line)
                    curr_line = word
            if curr_line:
                lines.append(curr_line)

        if not lines:
            return

        line_height = font_size * 1.25
        total_text_height = len(lines) * line_height

        # Determine vertical alignment
        # If not explicitly specified, fallback: center align -> middle, left/right -> top
        v_align = vertical_align or ("middle" if align == "center" else "top")
        if v_align == "middle":
            curr_y = y + max(0.0, (h - total_text_height) / 2)
        elif v_align == "bottom":
            curr_y = y + max(0.0, h - total_text_height)
        else:  # "top"
            curr_y = y

        for line in lines:
            if not line:
                curr_y += line_height
                continue

            text_w = get_line_width(line)

            if align == "center":
                curr_x = x + (w - text_w) / 2
            elif align == "right":
                curr_x = x + w - text_w
            else:
                curr_x = x

            draw.text((curr_x, curr_y), line, fill=color, font=font)
            curr_y += line_height

    def render_slide_image(
        self,
        slide: SlideModel,
        scale: float = 1.0,
        canvas_w: int = CANVAS_WIDTH,
        canvas_h: int = CANVAS_HEIGHT,
    ) -> Image.Image:
        """Render a complete static slide."""
        bg_rgba = hex_to_rgba(slide.background, 1.0) or (255, 255, 255, 255)
        img = Image.new("RGBA", (canvas_w, canvas_h), bg_rgba)

        sorted_elements = sorted(slide.elements, key=lambda e: e.z_index)
        for elem in sorted_elements:
            self.render_element(img, elem, scale=scale, canvas_w=canvas_w, canvas_h=canvas_h)

        return img

    def match_elements(
        self, slide_a: SlideModel, slide_b: SlideModel
    ) -> Tuple[List[Tuple[ElementModel, ElementModel]], List[ElementModel], List[ElementModel]]:
        """
        Match elements between two slides for Morph transition.
        Priority:
          1. Explicit morph_id match
          2. Direct id match
          3. Exact content + type match
        Returns:
          (matched_pairs, departing_from_a, arriving_to_b)
        """
        matched_pairs: List[Tuple[ElementModel, ElementModel]] = []
        unmatched_a = list(slide_a.elements)
        unmatched_b = list(slide_b.elements)

        # 1. Match by morph_id (if specified) - prefer matching same type first
        for el_a in list(unmatched_a):
            if el_a.morph_id:
                candidate_b = next((b for b in unmatched_b if b.morph_id == el_a.morph_id and b.type == el_a.type), None)
                if candidate_b is None:
                    candidate_b = next((b for b in unmatched_b if b.morph_id == el_a.morph_id), None)
                if candidate_b is not None:
                    matched_pairs.append((el_a, candidate_b))
                    unmatched_a.remove(el_a)
                    unmatched_b.remove(candidate_b)

        # 1b. Match by group_id (if elements belong to matching group)
        for el_a in list(unmatched_a):
            if getattr(el_a, "group_id", None):
                candidate_b = next((b for b in unmatched_b if getattr(b, "group_id", None) == el_a.group_id and b.type == el_a.type), None)
                if candidate_b is not None:
                    matched_pairs.append((el_a, candidate_b))
                    unmatched_a.remove(el_a)
                    unmatched_b.remove(candidate_b)

        # 2. Match by direct ID
        for el_a in list(unmatched_a):
            for el_b in list(unmatched_b):
                if el_b.id == el_a.id:
                    matched_pairs.append((el_a, el_b))
                    unmatched_a.remove(el_a)
                    unmatched_b.remove(el_b)
                    break

        # 3. Match by content/icon and type (e.g. same text heading/box or same icon)
        for el_a in list(unmatched_a):
            key_a = el_a.icon_name if el_a.type == ElementType.ICON else el_a.content
            if key_a:
                for el_b in list(unmatched_b):
                    key_b = el_b.icon_name if el_b.type == ElementType.ICON else el_b.content
                    if el_b.type == el_a.type and key_b == key_a:
                        matched_pairs.append((el_a, el_b))
                        unmatched_a.remove(el_a)
                        unmatched_b.remove(el_b)
                        break

        # 4. Smart fallback: Match remaining elements of the SAME type by closest distance
        for el_a in list(unmatched_a):
            candidates = [el_b for el_b in unmatched_b if el_b.type == el_a.type]
            if candidates:
                best_b = min(
                    candidates,
                    key=lambda b: (b.x - el_a.x) ** 2 + (b.y - el_a.y) ** 2,
                )
                matched_pairs.append((el_a, best_b))
                unmatched_a.remove(el_a)
                unmatched_b.remove(best_b)

        return matched_pairs, unmatched_a, unmatched_b

    def render_morph_frame(
        self,
        slide_a: SlideModel,
        slide_b: SlideModel,
        matched: List[Tuple[ElementModel, ElementModel]],
        departing: List[ElementModel],
        arriving: List[ElementModel],
        t: float,
        scale: float = 1.0,
        canvas_w: int = CANVAS_WIDTH,
        canvas_h: int = CANVAS_HEIGHT,
    ) -> Image.Image:
        """Render a single intermediate frame during a morph transition."""
        eased_t = ease_in_out(t)

        # Interpolate background color
        bg_hex = lerp_color(slide_a.background, slide_b.background, eased_t)
        bg_rgba = hex_to_rgba(bg_hex, 1.0) or (255, 255, 255, 255)
        frame = Image.new("RGBA", (canvas_w, canvas_h), bg_rgba)

        # 1. Departing elements fade out and gently glide
        for el in departing:
            shift_x = el.x + (15.0 * eased_t)
            departing_el = el.model_copy(update={"x": shift_x})
            self.render_element(
                frame,
                departing_el,
                global_opacity=(1.0 - eased_t),
                scale=scale,
                canvas_w=canvas_w,
                canvas_h=canvas_h,
            )

        # 2. Matched elements morph smoothly in position, size, and styling
        for el_a, el_b in matched:
            text_a = el_a.content or ""
            text_b = el_b.content or ""
            same_text = (text_a == text_b)

            morphed = ElementModel(
                id=el_a.id,
                type=el_b.type if eased_t > 0.5 else el_a.type,
                x=lerp(el_a.x, el_b.x, eased_t),
                y=lerp(el_a.y, el_b.y, eased_t),
                width=lerp(el_a.width, el_b.width, eased_t),
                height=lerp(el_a.height, el_b.height, eased_t),
                x1=lerp(
                    el_a.x1 if el_a.x1 is not None else el_a.x,
                    el_b.x1 if el_b.x1 is not None else el_b.x,
                    eased_t,
                ),
                y1=lerp(
                    el_a.y1 if el_a.y1 is not None else el_a.y,
                    el_b.y1 if el_b.y1 is not None else el_b.y,
                    eased_t,
                ),
                x2=lerp(
                    el_a.x2 if el_a.x2 is not None else (el_a.x + el_a.width),
                    el_b.x2 if el_b.x2 is not None else (el_b.x + el_b.width),
                    eased_t,
                ),
                y2=lerp(
                    el_a.y2 if el_a.y2 is not None else (el_a.y + el_a.height),
                    el_b.y2 if el_b.y2 is not None else (el_b.y + el_b.height),
                    eased_t,
                ),
                rotation=lerp(el_a.rotation, el_b.rotation, eased_t),
                fill=lerp_color(el_a.fill, el_b.fill, eased_t),
                stroke=lerp_color(el_a.stroke, el_b.stroke, eased_t),
                stroke_width=lerp(el_a.stroke_width, el_b.stroke_width, eased_t),
                radius=lerp(el_a.radius, el_b.radius, eased_t),
                content=text_a if same_text else "",
                font_size=lerp(el_a.font_size, el_b.font_size, eased_t),
                font_color=lerp_color(el_a.font_color, el_b.font_color, eased_t) or "#0f172a",
                font_weight=el_b.font_weight if eased_t >= 0.5 else el_a.font_weight,
                text_align=el_b.text_align if eased_t >= 0.5 else el_a.text_align,
                vertical_align=el_b.vertical_align if eased_t >= 0.5 else el_a.vertical_align,
                arrow_head=el_b.arrow_head if eased_t >= 0.5 else el_a.arrow_head,
                icon_name=el_b.icon_name if eased_t >= 0.5 else el_a.icon_name,
                icon_badge=el_b.icon_badge if eased_t >= 0.5 else el_a.icon_badge,
                badge_color=lerp_color(getattr(el_a, "badge_color", None) or el_a.fill, getattr(el_b, "badge_color", None) or el_b.fill, eased_t),
                icon_color=lerp_color(getattr(el_a, "icon_color", None) or el_a.stroke, getattr(el_b, "icon_color", None) or el_b.stroke, eased_t),
                opacity=lerp(el_a.opacity, el_b.opacity, eased_t),
                z_index=max(el_a.z_index, el_b.z_index),
                image_src=el_a.image_src,
                image_width=el_a.image_width,
                image_height=el_a.image_height,
                image_crop=el_a.image_crop.model_copy(update={key: lerp(getattr(el_a.image_crop, key), getattr(el_b.image_crop, key), eased_t) for key in ['x', 'y', 'width', 'height']}),
                flip_x=el_a.flip_x, flip_y=el_a.flip_y,
                image_brightness=lerp(el_a.image_brightness, el_b.image_brightness, eased_t),
                image_contrast=lerp(el_a.image_contrast, el_b.image_contrast, eased_t),
                image_saturation=lerp(el_a.image_saturation, el_b.image_saturation, eased_t),
            )
            if el_a.type == ElementType.IMAGE and (el_a.image_src != el_b.image_src or el_a.flip_x != el_b.flip_x or el_a.flip_y != el_b.flip_y):
                self.render_element(frame, morphed, global_opacity=1 - eased_t, scale=scale, canvas_w=canvas_w, canvas_h=canvas_h)
                incoming = morphed.model_copy(update={'image_src': el_b.image_src, 'flip_x': el_b.flip_x, 'flip_y': el_b.flip_y})
                self.render_element(frame, incoming, global_opacity=eased_t, scale=scale, canvas_w=canvas_w, canvas_h=canvas_h)
                continue
            self.render_element(
                frame,
                morphed,
                scale=scale,
                canvas_w=canvas_w,
                canvas_h=canvas_h,
            )

            # If text content changes, smoothly cross-fade text A -> text B without snapping
            if not same_text:
                if text_a:
                    morphed_text_a = morphed.model_copy(update={
                        "content": text_a,
                        "fill": None,
                        "stroke": None,
                        "font_color": el_a.font_color or "#0f172a",
                    })
                    self.render_element(
                        frame,
                        morphed_text_a,
                        global_opacity=max(0.0, 1.0 - eased_t * 1.5),
                        scale=scale,
                        canvas_w=canvas_w,
                        canvas_h=canvas_h,
                    )
                if text_b:
                    morphed_text_b = morphed.model_copy(update={
                        "content": text_b,
                        "fill": None,
                        "stroke": None,
                        "font_color": el_b.font_color or "#0f172a",
                    })
                    self.render_element(
                        frame,
                        morphed_text_b,
                        global_opacity=max(0.0, (eased_t - 0.33) * 1.5),
                        scale=scale,
                        canvas_w=canvas_w,
                        canvas_h=canvas_h,
                    )

        # 3. Arriving elements fade in and gently settle
        for el in arriving:
            shift_x = el.x - (15.0 * (1.0 - eased_t))
            arriving_el = el.model_copy(update={"x": shift_x})
            self.render_element(
                frame,
                arriving_el,
                global_opacity=eased_t,
                scale=scale,
                canvas_w=canvas_w,
                canvas_h=canvas_h,
            )

        return frame

    def render_fade_frame(
        self,
        img_a: Image.Image,
        img_b: Image.Image,
        t: float,
    ) -> Image.Image:
        """Cross-dissolve between two rendered slide images."""
        alpha = ease_in_out(t)
        return Image.blend(img_a, img_b, alpha)

    def export(
        self,
        presentation: PresentationModel,
        resolution: str = "720p",
        fps: int = DEFAULT_FPS,
        slide_duration: Optional[float] = None,
    ) -> io.BytesIO:
        """
        Generate MP4 video from presentation with morph transitions.
        Supports customizable resolution and frame rate.
        Returns BytesIO buffer containing the encoded .mp4 file.
        """
        if not presentation.slides:
            raise ValueError("Presentation has no slides to export.")

        aspect_ratio = getattr(presentation, "aspect_ratio", "16:9") or "16:9"
        is_vertical = str(aspect_ratio).strip() == "9:16"
        base_w = 720 if is_vertical else CANVAS_WIDTH
        base_h = 1280 if is_vertical else CANVAS_HEIGHT

        canvas_w, canvas_h = parse_resolution(resolution, aspect_ratio=aspect_ratio)
        scale = canvas_w / float(base_w)
        actual_fps = max(10, min(60, int(fps)))

        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_file:
            tmp_path = tmp_file.name

        try:
            # Stream frames directly to ffmpeg writer with optimized GOP and faststart
            with imageio.get_writer(
                tmp_path,
                fps=actual_fps,
                codec="libx264",
                pixelformat="yuv420p",
                macro_block_size=None,
                ffmpeg_params=[
                    "-preset", "veryfast",
                    "-crf", "18",
                    "-g", str(actual_fps),
                    "-keyint_min", str(max(1, actual_fps // 2)),
                    "-movflags", "+faststart",
                ],
            ) as writer:
                for idx, slide in enumerate(presentation.slides):
                    # 1. Slide static display phase
                    slide_img = self.render_slide_image(
                        slide, scale=scale, canvas_w=canvas_w, canvas_h=canvas_h
                    )
                    slide_rgb = slide_img.convert("RGB")
                    slide_np = np.array(slide_rgb)

                    if slide_duration is not None and float(slide_duration) > 0:
                        hold_duration = max(0.2, float(slide_duration))
                    else:
                        hold_duration = max(0.5, float(slide.slide_duration or 3.0))

                    hold_frames = max(1, int(hold_duration * actual_fps))

                    for _ in range(hold_frames):
                        writer.append_data(slide_np)

                    # 2. Transition phase to next slide
                    if idx < len(presentation.slides) - 1:
                        next_slide = presentation.slides[idx + 1]
                        trans_type = getattr(slide, "transition_type", "morph") or "morph"
                        trans_duration = max(0.3, float(slide.transition_duration or 1.0))
                        trans_frames = int(trans_duration * actual_fps)

                        if trans_type == "morph":
                            matched, departing, arriving = self.match_elements(slide, next_slide)
                            for frame_i in range(1, trans_frames):
                                t = frame_i / float(trans_frames)
                                frame_img = self.render_morph_frame(
                                    slide,
                                    next_slide,
                                    matched,
                                    departing,
                                    arriving,
                                    t,
                                    scale=scale,
                                    canvas_w=canvas_w,
                                    canvas_h=canvas_h,
                                )
                                writer.append_data(np.array(frame_img.convert("RGB")))

                        elif trans_type == "fade":
                            next_img = self.render_slide_image(
                                next_slide, scale=scale, canvas_w=canvas_w, canvas_h=canvas_h
                            )
                            for frame_i in range(1, trans_frames):
                                t = frame_i / float(trans_frames)
                                faded = self.render_fade_frame(slide_img, next_img, t)
                                writer.append_data(np.array(faded.convert("RGB")))

            with open(tmp_path, "rb") as f:
                video_bytes = f.read()

            buffer = io.BytesIO(video_bytes)
            buffer.seek(0)
            return buffer

        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass


video_exporter = VideoExporter()

