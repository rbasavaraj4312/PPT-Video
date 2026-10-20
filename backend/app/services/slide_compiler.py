import math
import re
import uuid
from typing import Dict, List, Optional, Tuple, Any
from ..models.presentation import (
    PresentationModel,
    SlideModel,
    ElementModel,
    ElementType,
    ArrowHead,
    StrokeStyle,
)

CANVAS_WIDTH = 1280
CANVAS_HEIGHT = 720

THEMES: Dict[str, Dict[str, Any]] = {
    "modern-dark": {
        "background": "#0f172a",
        "card_fill": "#1e293b",
        "card_stroke": "#334155",
        "title_color": "#f8fafc",
        "body_color": "#94a3b8",
        "accent": "#38bdf8",
        "accent_secondary": "#3b82f6",
        "icon_color": "#38bdf8",
        "badge_fill": "#0369a1",
    },
    "midnight": {
        "background": "#090d16",
        "card_fill": "#131b2e",
        "card_stroke": "#1e293b",
        "title_color": "#ffffff",
        "body_color": "#cbd5e1",
        "accent": "#6366f1",
        "accent_secondary": "#8b5cf6",
        "icon_color": "#818cf8",
        "badge_fill": "#3730a3",
    },
    "emerald-dark": {
        "background": "#064e3b",
        "card_fill": "#065f46",
        "card_stroke": "#047857",
        "title_color": "#f0fdf4",
        "body_color": "#a7f3d0",
        "accent": "#34d399",
        "accent_secondary": "#10b981",
        "icon_color": "#34d399",
        "badge_fill": "#059669",
    },
    "sunset": {
        "background": "#18181b",
        "card_fill": "#27272a",
        "card_stroke": "#3f3f46",
        "title_color": "#fafafa",
        "body_color": "#d4d4d8",
        "accent": "#f97316",
        "accent_secondary": "#ec4899",
        "icon_color": "#fb923c",
        "badge_fill": "#c2410c",
    },
    "clean-light": {
        "background": "#f8fafc",
        "card_fill": "#ffffff",
        "card_stroke": "#e2e8f0",
        "title_color": "#0f172a",
        "body_color": "#64748b",
        "accent": "#2563eb",
        "accent_secondary": "#4f46e5",
        "icon_color": "#2563eb",
        "badge_fill": "#dbeafe",
    },
    "cyber-neon": {
        "background": "#070814",
        "card_fill": "#0e1329",
        "card_stroke": "#232e5d",
        "title_color": "#ffffff",
        "body_color": "#94a3b8",
        "accent": "#00f2fe",
        "accent_secondary": "#f43f5e",
        "icon_color": "#38bdf8",
        "badge_fill": "#1e1b4b",
    },
    "quantum-gold": {
        "background": "#09090b",
        "card_fill": "#18181b",
        "card_stroke": "#27272a",
        "title_color": "#fef08a",
        "body_color": "#d4d4d8",
        "accent": "#f59e0b",
        "accent_secondary": "#e11d48",
        "icon_color": "#fbbf24",
        "badge_fill": "#451a03",
    },
}

DEFAULT_THEME = "modern-dark"


def normalize_token(s: str) -> str:
    """Turn 'Vector DB' or 'PostgreSQL Cluster' into a clean entity ID 'vector-db'."""
    clean = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
    return clean or "entity"


class SlideCompiler:
    """
    Compiles Approach-4 natural semantic outlines into pixel-perfect PresentationModel instances
    with deterministic spatial math, responsive layout presets, icons, arrows, and morph tags.
    """

    def compile(self, outline_text: str, theme_override: Optional[str] = None) -> PresentationModel:
        lines = [line.rstrip() for line in outline_text.strip().split("\n")]
        
        # 1. Parse Deck-Level Metadata
        deck_title = "AI Architecture Presentation"
        theme_name = theme_override or DEFAULT_THEME
        deck_aspect_ratio = "16:9"
        slides_raw: List[Dict[str, Any]] = []
        current_slide: Optional[Dict[str, Any]] = None

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            # Title
            if line_str.lower().startswith("title:"):
                deck_title = line_str.split(":", 1)[1].strip()
                continue

            # Theme
            if line_str.lower().startswith("theme:"):
                cand = line_str.split(":", 1)[1].strip().lower()
                if cand in THEMES:
                    theme_name = cand
                continue

            # Format / Aspect Ratio
            if (
                line_str.lower().startswith("format:")
                or line_str.lower().startswith("aspect_ratio:")
                or line_str.lower().startswith("aspect-ratio:")
            ):
                cand = line_str.split(":", 1)[1].strip().lower()
                if cand in ("9:16", "reels", "reel", "shorts", "short", "vertical", "portrait", "tiktok"):
                    deck_aspect_ratio = "9:16"
                elif cand in ("16:9", "landscape", "horizontal", "youtube"):
                    deck_aspect_ratio = "16:9"
                continue

            # Slide delimiter
            slide_match = re.match(
                r"^(?:#{1,4}\s*(?:Slide\s*\d*[:.]?)?|Slide\s+\d+[:.]?|---\s*(?:Slide\s*\d*[:.]?)?)\s*(.*)$",
                line_str,
                re.IGNORECASE,
            )
            if slide_match:
                if current_slide:
                    slides_raw.append(current_slide)
                rest = slide_match.group(1).strip() if slide_match.group(1) else ""
                current_slide = {
                    "title": rest if rest else f"Slide {len(slides_raw) + 1}",
                    "layout": "default",
                    "transition": "morph",
                    "slide_duration": 3.0,
                    "items": [],
                }
                continue

            if not current_slide:
                current_slide = {
                    "title": "Introduction",
                    "layout": "hero",
                    "transition": "morph",
                    "slide_duration": 3.0,
                    "items": [],
                }

            # Layout directive
            if line_str.lower().startswith("layout:"):
                current_slide["layout"] = line_str.split(":", 1)[1].strip().lower()
                continue

            # Transition directive
            if line_str.lower().startswith("transition:"):
                current_slide["transition"] = line_str.split(":", 1)[1].strip().lower()
                continue

            # Duration directive
            if line_str.lower().startswith("duration:"):
                try:
                    val = float(line_str.split(":", 1)[1].strip().replace("s", ""))
                    current_slide["slide_duration"] = max(0.5, val)
                except Exception:
                    pass
                continue

            # Bullet / item entry
            current_slide["items"].append(line_str)

        if current_slide:
            slides_raw.append(current_slide)

        if not slides_raw:
            slides_raw = [{
                "title": deck_title,
                "layout": "hero",
                "transition": "morph",
                "slide_duration": 3.0,
                "items": ["Welcome to Slide Studio"],
            }]

        theme = THEMES.get(theme_name, THEMES[DEFAULT_THEME])

        # 2. Compile each slide into Canvas Elements
        compiled_slides: List[SlideModel] = []
        entity_registry: Dict[str, str] = {}  # Normalized entity name -> morph_id

        for idx, s_data in enumerate(slides_raw):
            slide_id = f"slide-{uuid.uuid4().hex[:8]}"
            title = s_data["title"]
            layout = s_data["layout"]
            raw_items = s_data["items"]
            trans_type = s_data.get("transition", "morph")
            duration = s_data.get("slide_duration", 3.0)

            elements = self._layout_slide(
                title=title,
                layout=layout,
                items=raw_items,
                theme=theme,
                entity_registry=entity_registry,
                slide_index=idx,
                aspect_ratio=deck_aspect_ratio,
            )

            compiled_slides.append(
                SlideModel(
                    id=slide_id,
                    title=title,
                    background=theme["background"],
                    transition_type=trans_type,
                    transition_duration=1.0,
                    slide_duration=duration,
                    elements=elements,
                )
            )

        return PresentationModel(
            id=f"pres-{uuid.uuid4().hex[:8]}",
            title=deck_title,
            aspect_ratio=deck_aspect_ratio,
            slides=compiled_slides,
        )

    def _extract_item_parts(self, raw_line: str) -> Dict[str, Any]:
        """Extract icon, label, description, and arrow details from a bullet item."""
        line = raw_line.lstrip("-*•> ").strip()
        icon = None
        arrow_to = None
        arrow_label = None

        # Check arrow directive
        arrow_match = re.search(r"-->\s*Arrow:?\s*[\"']?([^\"']+)[\"']?", line, re.IGNORECASE)
        if arrow_match:
            arrow_label = arrow_match.group(1).strip()
            line = line[:arrow_match.start()].strip()

        # Check icon directive e.g. (icon: database) or [icon: server]
        icon_match = re.search(r"[\(\[]icon:\s*([a-zA-Z0-9_\-]+)[\)\]]", line, re.IGNORECASE)
        if icon_match:
            icon = icon_match.group(1).strip().lower()
            line = (line[:icon_match.start()] + line[icon_match.end():]).strip()

        # Check explicit morph directive e.g. (morph: card-ingest) or [morph: card-ingest]
        morph = None
        morph_match = re.search(r"[\(\[]morph:\s*([a-zA-Z0-9_\-]+)[\)\]]", line, re.IGNORECASE)
        if morph_match:
            morph = morph_match.group(1).strip()
            line = (line[:morph_match.start()] + line[morph_match.end():]).strip()

        # Split into Title / Description if contains colon or hyphen
        parts = re.split(r"[:\-–]\s+", line, maxsplit=1)
        if len(parts) == 2:
            item_title = parts[0].strip()
            item_desc = parts[1].strip()
        else:
            item_title = line
            item_desc = ""

        return {
            "title": item_title,
            "description": item_desc,
            "icon": icon,
            "morph": morph,
            "arrow_label": arrow_label,
            "raw": line,
        }

    def _layout_slide(
        self,
        title: str,
        layout: str,
        items: List[str],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
        slide_index: int,
        aspect_ratio: str = "16:9",
    ) -> List[ElementModel]:
        """Place slide elements onto 1280x720 (or 720x1280 vertical) canvas based on layout type."""
        elements: List[ElementModel] = []
        
        # Separate standalone arrow connections like [A] -> [B] from entity definitions
        node_items = []
        connection_map: Dict[str, str] = {}  # source entity -> arrow label/target
        for it in items:
            raw = it.strip().lstrip("-*•> ")
            conn_match = re.match(r"^\[?([^\]]+)\]?\s*--?>\s*\[?([^\]]+)\]?$", raw)
            if conn_match and not ("(icon:" in raw.lower() or ":" in raw):
                src = conn_match.group(1).strip()
                dst = conn_match.group(2).strip()
                connection_map[src.lower()] = dst
            else:
                node_items.append(it)

        parsed_items = [self._extract_item_parts(it) for it in node_items if it.strip()]

        # Layout detection aliases
        clean_layout = layout.lower().replace("-", " ")

        if aspect_ratio == "9:16":
            return self._layout_vertical_reels(title, parsed_items, theme, entity_registry, clean_layout, raw_lines=items)

        if "code" in clean_layout or "walkthrough" in clean_layout:
            elements = self._layout_code_walkthrough(title, items, theme, entity_registry)
        elif "stack" in clean_layout or "layer" in clean_layout:
            elements = self._layout_architecture_layers(title, parsed_items, theme, entity_registry)
        elif "problem" in clean_layout or "solution" in clean_layout or "anti" in clean_layout or "bottleneck" in clean_layout:
            elements = self._layout_problem_solution(title, parsed_items, theme, entity_registry, raw_lines=items)
        elif "circular" in clean_layout or "loop" in clean_layout or "lifecycle" in clean_layout:
            elements = self._layout_circular_loop(title, parsed_items, theme, entity_registry)
        elif "stream" in clean_layout or "event" in clean_layout or "pipeline" in clean_layout:
            elements = self._layout_event_stream(title, parsed_items, theme, entity_registry, connection_map)
        elif "bento" in clean_layout:
            elements = self._layout_bento_box(title, parsed_items, theme, entity_registry)
        elif "matrix" in clean_layout or "feature" in clean_layout:
            elements = self._layout_feature_matrix(title, parsed_items, theme, entity_registry)
        elif "hero" in clean_layout:
            elements = self._layout_hero(title, parsed_items, theme, entity_registry)
        elif "process" in clean_layout or "flow" in clean_layout:
            elements = self._layout_process_flow(title, parsed_items, theme, entity_registry)
        elif "compare" in clean_layout or "comparison" in clean_layout or "2 col" in clean_layout:
            elements = self._layout_comparison(title, parsed_items, theme, entity_registry)
        elif "metric" in clean_layout or "stat" in clean_layout:
            elements = self._layout_metrics(title, parsed_items, theme, entity_registry)
        elif "arch" in clean_layout or "hub" in clean_layout:
            elements = self._layout_architecture(title, parsed_items, theme, entity_registry)
        elif "split" in clean_layout or "spotlight" in clean_layout:
            elements = self._layout_split(title, parsed_items, theme, entity_registry)
        elif "timeline" in clean_layout or "roadmap" in clean_layout:
            elements = self._layout_timeline(title, parsed_items, theme, entity_registry)
        elif "cards" in clean_layout or "grid" in clean_layout:
            elements = self._layout_card_grid(title, parsed_items, theme, entity_registry)
        else:
            # Default fallback: If 3-4 items with icons, use process flow or card grid
            if len(parsed_items) >= 2 and any(it["icon"] for it in parsed_items):
                elements = self._layout_process_flow(title, parsed_items, theme, entity_registry)
            elif len(parsed_items) >= 2:
                elements = self._layout_card_grid(title, parsed_items, theme, entity_registry)
            else:
                elements = self._layout_hero(title, parsed_items, theme, entity_registry)

        return elements

    def _get_morph_id(self, entity_name: str, entity_registry: Dict[str, str], explicit_morph: Optional[str] = None) -> str:
        """Assign or retrieve a stable morph_id across slides for this entity name."""
        if explicit_morph:
            return explicit_morph
        norm = normalize_token(entity_name)
        if norm not in entity_registry:
            entity_registry[norm] = f"morph-{norm}"
        return entity_registry[norm]

    def _layout_hero(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []
        
        # Main Hero Headline
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=100,
                y=180,
                width=1080,
                height=120,
                content=title,
                font_size=52,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="center",
                vertical_align="middle",
                z_index=1,
            )
        )

        # Subtitle or highlighted description
        desc_text = " ".join([it["raw"] for it in items]) if items else "Presentation Overview"
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=180,
                y=320,
                width=920,
                height=80,
                content=desc_text,
                font_size=24,
                font_weight="normal",
                font_color=theme["body_color"],
                text_align="center",
                vertical_align="middle",
                z_index=2,
            )
        )

        # If an icon was specified in the first item, display a hero icon badge
        first_icon = next((it["icon"] for it in items if it["icon"]), None)
        if first_icon:
            morph_tag = self._get_morph_id(items[0]["title"], entity_registry)
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=590,
                    y=80,
                    width=100,
                    height=80,
                    icon_name=first_icon,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=2,
                    content="",
                    morph_id=morph_tag,
                    z_index=3,
                )
            )

        return elements

    def _layout_process_flow(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []
        count = max(1, min(5, len(items)))

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=60,
                width=1120,
                height=60,
                content=title,
                font_size=38,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                z_index=1,
            )
        )

        # Distribute process nodes horizontally
        margin_x = 80
        total_width = CANVAS_WIDTH - (margin_x * 2)
        gap = 40
        card_w = (total_width - (gap * (count - 1))) / count
        card_h = 280
        pos_y = 220

        node_positions = []

        for i, item in enumerate(items[:count]):
            node_x = margin_x + i * (card_w + gap)
            node_positions.append((node_x, pos_y, card_w, card_h))
            morph_tag = self._get_morph_id(item["title"], entity_registry, item.get("morph"))
            card_morph = item["morph"] if item.get("morph") else f"{morph_tag}-card"

            # 1. Background Card
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=node_x,
                    y=pos_y,
                    width=card_w,
                    height=card_h,
                    fill=theme["card_fill"],
                    stroke=theme["card_stroke"],
                    stroke_width=2,
                    radius=16,
                    morph_id=card_morph,
                    z_index=2,
                )
            )

            # 2. Icon (if present) or Step Badge
            icon_name = item.get("icon") or "zap"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=node_x + (card_w - 64) / 2,
                    y=pos_y + 24,
                    width=64,
                    height=64,
                    icon_name=icon_name,
                    icon_badge="rounded",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=2,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            # 3. Step Title
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=node_x + 16,
                    y=pos_y + 104,
                    width=card_w - 32,
                    height=44,
                    content=item["title"],
                    font_size=20,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="center",
                    vertical_align="middle",
                    morph_id=f"{morph_tag}-title",
                    z_index=4,
                )
            )

            # 4. Step Description
            if item["description"]:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=node_x + 16,
                        y=pos_y + 152,
                        width=card_w - 32,
                        height=card_h - 168,
                        content=item["description"],
                        font_size=15,
                        font_weight="normal",
                        font_color=theme["body_color"],
                        text_align="center",
                        vertical_align="top",
                        z_index=4,
                    )
                )

            # 5. Connector Arrow to next step
            if i < count - 1:
                arrow_start_x = node_x + card_w + 6
                arrow_end_x = node_x + card_w + gap - 6
                arrow_y = pos_y + (card_h / 2)
                arrow_label = item.get("arrow_label") or ""

                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.ARROW,
                        x1=arrow_start_x,
                        y1=arrow_y,
                        x2=arrow_end_x,
                        y2=arrow_y,
                        stroke=theme["accent"],
                        stroke_width=3,
                        arrow_head=ArrowHead.END,
                        content=arrow_label,
                        font_size=12,
                        font_color=theme["accent"],
                        text_align="center",
                        z_index=5,
                    )
                )

        return elements

    def _layout_card_grid(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []
        count = max(1, min(4, len(items)))

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=60,
                width=1120,
                height=60,
                content=title,
                font_size=38,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                z_index=1,
            )
        )

        margin_x = 80
        total_width = CANVAS_WIDTH - (margin_x * 2)
        gap = 30
        card_w = (total_width - (gap * (count - 1))) / count
        card_h = 360
        pos_y = 180

        for i, item in enumerate(items[:count]):
            node_x = margin_x + i * (card_w + gap)
            morph_tag = self._get_morph_id(item["title"], entity_registry)

            # Card Container
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=node_x,
                    y=pos_y,
                    width=card_w,
                    height=card_h,
                    fill=theme["card_fill"],
                    stroke=theme["card_stroke"],
                    stroke_width=2,
                    radius=16,
                    morph_id=f"{morph_tag}-card",
                    z_index=2,
                )
            )

            # Icon
            icon_name = item.get("icon") or "box"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=node_x + 24,
                    y=pos_y + 24,
                    width=56,
                    height=56,
                    icon_name=icon_name,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=2,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            # Card Title
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=node_x + 24,
                    y=pos_y + 96,
                    width=card_w - 48,
                    height=40,
                    content=item["title"],
                    font_size=22,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{morph_tag}-title",
                    z_index=4,
                )
            )

            # Description
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=node_x + 24,
                    y=pos_y + 146,
                    width=card_w - 48,
                    height=card_h - 166,
                    content=item["description"] or item["raw"],
                    font_size=15,
                    font_weight="normal",
                    font_color=theme["body_color"],
                    text_align="left",
                    vertical_align="top",
                    z_index=4,
                )
            )

        return elements

    def _layout_comparison(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []

        # Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=60,
                width=1120,
                height=60,
                content=title,
                font_size=38,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="center",
                z_index=1,
            )
        )

        col_w = 510
        col_h = 420
        pos_y = 160

        # Check if items are partitioned by Left: / Right:
        left_items = []
        right_items = []
        current_side = None

        for it in items:
            raw_lower = it["raw"].lower().strip()
            if raw_lower.startswith("left:") or raw_lower == "left":
                current_side = "left"
                clean_title = re.sub(r"^left:?\s*", "", it["raw"], flags=re.IGNORECASE).strip()
                if clean_title:
                    left_items.append(self._extract_item_parts(clean_title))
                continue
            elif raw_lower.startswith("right:") or raw_lower == "right":
                current_side = "right"
                clean_title = re.sub(r"^right:?\s*", "", it["raw"], flags=re.IGNORECASE).strip()
                if clean_title:
                    right_items.append(self._extract_item_parts(clean_title))
                continue

            if current_side == "left":
                left_items.append(it)
            elif current_side == "right":
                right_items.append(it)

        if left_items or right_items:
            def combine_side(side_list, default_title, default_icon):
                if not side_list:
                    return {"title": default_title, "icon": default_icon, "description": ""}
                first = side_list[0]
                first_icon = next((x["icon"] for x in side_list if x["icon"]), default_icon)
                first_title = first["title"] or default_title
                desc_lines = []
                if first.get("description"):
                    desc_lines.append(first["description"])
                for extra in side_list[1:]:
                    line = extra["raw"].strip().lstrip("-*•> ")
                    if line:
                        desc_lines.append(f"• {line}")
                return {
                    "title": first_title,
                    "icon": first_icon,
                    "description": "\n".join(desc_lines),
                    "raw": first.get("raw", "")
                }
            cols_data = [
                combine_side(left_items, "Option A", "server"),
                combine_side(right_items, "Option B", "check-circle")
            ]
        else:
            cols_data = items[:2] if len(items) >= 2 else (items + [{"title": "Option B", "description": ""}])
        positions = [(100, pos_y), (670, pos_y)]

        for i, (col_x, col_y) in enumerate(positions):
            col_item = cols_data[i]
            morph_tag = self._get_morph_id(col_item["title"], entity_registry)
            is_right = (i == 1)

            # Container
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=col_x,
                    y=col_y,
                    width=col_w,
                    height=col_h,
                    fill=theme["card_fill"],
                    stroke=theme["accent_secondary"] if is_right else theme["accent"],
                    stroke_width=2,
                    radius=16,
                    morph_id=f"{morph_tag}-card",
                    z_index=2,
                )
            )

            # Icon
            icon_name = col_item.get("icon") or ("check-circle" if is_right else "database")
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=col_x + 30,
                    y=col_y + 30,
                    width=60,
                    height=60,
                    icon_name=icon_name,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=2,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            # Title
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=col_x + 106,
                    y=col_y + 38,
                    width=col_w - 136,
                    height=44,
                    content=col_item["title"],
                    font_size=24,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{morph_tag}-title",
                    z_index=4,
                )
            )

            # Body
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=col_x + 30,
                    y=col_y + 110,
                    width=col_w - 60,
                    height=col_h - 130,
                    content=col_item["description"] or col_item["raw"],
                    font_size=17,
                    font_weight="normal",
                    font_color=theme["body_color"],
                    text_align="left",
                    vertical_align="top",
                    z_index=4,
                )
            )

        # "VS" Circle in the center
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ELLIPSE,
                x=616,
                y=pos_y + (col_h / 2) - 24,
                width=48,
                height=48,
                fill=theme["background"],
                stroke=theme["accent"],
                stroke_width=2,
                content="VS",
                font_size=14,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="center",
                vertical_align="middle",
                z_index=5,
            )
        )

        return elements

    def _layout_metrics(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []
        count = max(1, min(4, len(items)))

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=60,
                width=1120,
                height=60,
                content=title,
                font_size=38,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                z_index=1,
            )
        )

        margin_x = 80
        total_width = CANVAS_WIDTH - (margin_x * 2)
        gap = 24
        card_w = (total_width - (gap * (count - 1))) / count
        card_h = 420
        pos_y = 180

        for i, item in enumerate(items[:count]):
            node_x = margin_x + i * (card_w + gap)
            raw_title = item["title"]

            # Parse value and label if pipe | exists e.g. "0.4ms | Gossip Latency"
            if "|" in raw_title:
                parts = raw_title.split("|", 1)
                metric_val = parts[0].strip()
                metric_label = parts[1].strip()
            elif ":" in item["raw"] and len(item["raw"].split(":", 1)[0]) < 12:
                parts = item["raw"].split(":", 1)
                metric_val = parts[0].strip()
                metric_label = parts[1].strip()
            else:
                metric_val = raw_title
                metric_label = ""

            morph_tag = self._get_morph_id(metric_label or metric_val, entity_registry)

            # Card Container
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=node_x,
                    y=pos_y,
                    width=card_w,
                    height=card_h,
                    fill=theme["card_fill"],
                    stroke=theme["card_stroke"],
                    stroke_width=2,
                    radius=16,
                    morph_id=f"{morph_tag}-card",
                    z_index=2,
                )
            )

            # Icon Badge
            icon_name = item.get("icon") or "zap"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=node_x + (card_w - 56) / 2,
                    y=pos_y + 28,
                    width=56,
                    height=56,
                    icon_name=icon_name,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["accent"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=2,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            # Metric Big Number Value
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=node_x + 16,
                    y=pos_y + 105,
                    width=card_w - 32,
                    height=60,
                    content=metric_val,
                    font_size=42,
                    font_weight="bold",
                    font_color=theme["accent"],
                    text_align="center",
                    vertical_align="middle",
                    morph_id=f"{morph_tag}-val",
                    z_index=4,
                )
            )

            # Metric Label
            if metric_label:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=node_x + 16,
                        y=pos_y + 175,
                        width=card_w - 32,
                        height=40,
                        content=metric_label,
                        font_size=19,
                        font_weight="bold",
                        font_color=theme["title_color"],
                        text_align="center",
                        vertical_align="middle",
                        morph_id=f"{morph_tag}-title",
                        z_index=4,
                    )
                )

            # Description
            desc = item.get("description") or ""
            if desc:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=node_x + 20,
                        y=pos_y + 225,
                        width=card_w - 40,
                        height=card_h - 245,
                        content=desc,
                        font_size=14,
                        font_weight="normal",
                        font_color=theme["body_color"],
                        text_align="center",
                        vertical_align="top",
                        z_index=4,
                    )
                )

        return elements

    def _layout_architecture(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []

        # Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=50,
                width=1120,
                height=55,
                content=title,
                font_size=36,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                z_index=1,
            )
        )

        if not items:
            return elements

        # Center Hub (Item 0)
        hub_item = items[0]
        hub_w = 340
        hub_h = 190
        hub_x = (CANVAS_WIDTH - hub_w) / 2
        hub_y = 280
        hub_morph = self._get_morph_id(hub_item["title"], entity_registry)

        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=hub_x,
                y=hub_y,
                width=hub_w,
                height=hub_h,
                fill=theme["card_fill"],
                stroke=theme["accent"],
                stroke_width=3,
                radius=18,
                morph_id=f"{hub_morph}-card",
                z_index=2,
            )
        )

        hub_icon = hub_item.get("icon") or "cpu"
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ICON,
                x=hub_x + (hub_w - 56) / 2,
                y=hub_y + 18,
                width=56,
                height=56,
                icon_name=hub_icon,
                icon_badge="circle",
                badge_color=theme["badge_fill"],
                icon_color=theme["accent"],
                fill=theme["badge_fill"],
                stroke=theme["accent"],
                stroke_width=2,
                morph_id=f"{hub_morph}-icon",
                z_index=3,
            )
        )

        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=hub_x + 16,
                y=hub_y + 82,
                width=hub_w - 32,
                height=36,
                content=hub_item["title"],
                font_size=20,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="center",
                vertical_align="middle",
                morph_id=f"{hub_morph}-title",
                z_index=4,
            )
        )

        if hub_item.get("description"):
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=hub_x + 16,
                    y=hub_y + 122,
                    width=hub_w - 32,
                    height=56,
                    content=hub_item["description"],
                    font_size=13,
                    font_weight="normal",
                    font_color=theme["body_color"],
                    text_align="center",
                    vertical_align="top",
                    z_index=4,
                )
            )

        # Satellite positions for up to 4 peripheral nodes
        satellites = items[1:5]
        sat_w = 320
        sat_h = 160
        positions = [
            (80, 140, "in"),    # Top-Left -> Hub
            (80, 460, "in"),    # Bottom-Left -> Hub
            (880, 140, "out"),  # Hub -> Top-Right
            (880, 460, "out"),  # Hub -> Bottom-Right
        ]

        for i, sat_item in enumerate(satellites):
            sx, sy, flow_dir = positions[i]
            sat_morph = self._get_morph_id(sat_item["title"], entity_registry)

            # Satellite card
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=sx,
                    y=sy,
                    width=sat_w,
                    height=sat_h,
                    fill=theme["card_fill"],
                    stroke=theme["card_stroke"],
                    stroke_width=2,
                    radius=14,
                    morph_id=f"{sat_morph}-card",
                    z_index=2,
                )
            )

            # Icon
            s_icon = sat_item.get("icon") or "box"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=sx + 20,
                    y=sy + 20,
                    width=46,
                    height=46,
                    icon_name=s_icon,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["card_stroke"],
                    stroke_width=1,
                    morph_id=f"{sat_morph}-icon",
                    z_index=3,
                )
            )

            # Title
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=sx + 78,
                    y=sy + 22,
                    width=sat_w - 94,
                    height=42,
                    content=sat_item["title"],
                    font_size=18,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{sat_morph}-title",
                    z_index=4,
                )
            )

            # Description
            if sat_item.get("description"):
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=sx + 20,
                        y=sy + 74,
                        width=sat_w - 40,
                        height=sat_h - 84,
                        content=sat_item["description"],
                        font_size=13,
                        font_weight="normal",
                        font_color=theme["body_color"],
                        text_align="left",
                        vertical_align="top",
                        z_index=4,
                    )
                )

            # Connecting arrow
            if flow_dir == "in":
                # From sat to hub
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.ARROW,
                        x1=sx + sat_w + 10,
                        y1=sy + sat_h / 2,
                        x2=hub_x - 10,
                        y2=hub_y + (40 if i == 0 else hub_h - 40),
                        stroke=theme["accent"],
                        stroke_width=2,
                        arrow_head=ArrowHead.END,
                        z_index=5,
                    )
                )
            else:
                # From hub to sat
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.ARROW,
                        x1=hub_x + hub_w + 10,
                        y1=hub_y + (40 if i == 2 else hub_h - 40),
                        x2=sx - 10,
                        y2=sy + sat_h / 2,
                        stroke=theme["accent"],
                        stroke_width=2,
                        arrow_head=ArrowHead.END,
                        z_index=5,
                    )
                )

        return elements

    def _layout_split(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []

        # Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=50,
                width=1120,
                height=55,
                content=title,
                font_size=36,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                z_index=1,
            )
        )

        if not items:
            return elements

        # Left Spotlight Hero (Item 0)
        hero = items[0]
        hero_morph = self._get_morph_id(hero["title"], entity_registry, hero.get("morph"))
        card_morph = hero["morph"] if hero.get("morph") else f"{hero_morph}-card"
        left_w = 480
        left_h = 510
        left_x = 80
        left_y = 130

        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=left_x,
                y=left_y,
                width=left_w,
                height=left_h,
                fill=theme["card_fill"],
                stroke=theme["accent"],
                stroke_width=2,
                radius=18,
                morph_id=card_morph,
                z_index=2,
            )
        )

        hero_icon = hero.get("icon") or "cpu"
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ICON,
                x=left_x + 36,
                y=left_y + 36,
                width=64,
                height=64,
                icon_name=hero_icon,
                icon_badge="rounded",
                badge_color=theme["badge_fill"],
                icon_color=theme["accent"],
                fill=theme["badge_fill"],
                stroke=theme["accent"],
                stroke_width=2,
                morph_id=f"{hero_morph}-icon",
                z_index=3,
            )
        )

        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=left_x + 36,
                y=left_y + 120,
                width=left_w - 72,
                height=50,
                content=hero["title"],
                font_size=24,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                vertical_align="middle",
                morph_id=f"{hero_morph}-title",
                z_index=4,
            )
        )

        if hero.get("description"):
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=left_x + 36,
                    y=left_y + 180,
                    width=left_w - 72,
                    height=left_h - 200,
                    content=hero["description"],
                    font_size=16,
                    font_weight="normal",
                    font_color=theme["body_color"],
                    text_align="left",
                    vertical_align="top",
                    z_index=4,
                )
            )

        # Right Stacked Feature Cards (Items 1 to 3)
        right_items = items[1:4]
        right_x = 590
        right_w = 610
        card_h = 150
        gap = 30

        for i, r_item in enumerate(right_items):
            ry = left_y + i * (card_h + gap)
            r_morph = self._get_morph_id(r_item["title"], entity_registry)

            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=right_x,
                    y=ry,
                    width=right_w,
                    height=card_h,
                    fill=theme["card_fill"],
                    stroke=theme["card_stroke"],
                    stroke_width=2,
                    radius=14,
                    morph_id=f"{r_morph}-card",
                    z_index=2,
                )
            )

            r_icon = r_item.get("icon") or "check-circle"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=right_x + 24,
                    y=ry + 24,
                    width=50,
                    height=50,
                    icon_name=r_icon,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["accent"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    morph_id=f"{r_morph}-icon",
                    z_index=3,
                )
            )

            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=right_x + 90,
                    y=ry + 20,
                    width=right_w - 110,
                    height=36,
                    content=r_item["title"],
                    font_size=19,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{r_morph}-title",
                    z_index=4,
                )
            )

            if r_item.get("description"):
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=right_x + 90,
                        y=ry + 60,
                        width=right_w - 110,
                        height=card_h - 75,
                        content=r_item["description"],
                        font_size=14,
                        font_weight="normal",
                        font_color=theme["body_color"],
                        text_align="left",
                        vertical_align="top",
                        z_index=4,
                    )
                )

        return elements

    def _layout_timeline(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []
        count = max(1, min(4, len(items)))

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=50,
                width=1120,
                height=55,
                content=title,
                font_size=36,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                z_index=1,
            )
        )

        track_y = 350
        # Horizontal connecting line
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.LINE,
                x1=100,
                y1=track_y,
                x2=1180,
                y2=track_y,
                stroke=theme["card_stroke"],
                stroke_width=4,
                z_index=2,
            )
        )

        margin_x = 160
        total_w = CANVAS_WIDTH - (margin_x * 2)
        step_x = total_w / (count - 1) if count > 1 else total_w / 2
        card_w = 240
        card_h = 170

        for i, item in enumerate(items[:count]):
            node_cx = margin_x + (i * step_x if count > 1 else total_w / 2)
            morph_tag = self._get_morph_id(item["title"], entity_registry)

            # Track circle badge
            badge_r = 24
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ELLIPSE,
                    x=node_cx - badge_r,
                    y=track_y - badge_r,
                    width=badge_r * 2,
                    height=badge_r * 2,
                    fill=theme["background"],
                    stroke=theme["accent"],
                    stroke_width=3,
                    content=f"0{i+1}",
                    font_size=15,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="center",
                    vertical_align="middle",
                    z_index=5,
                )
            )

            # Alternate card placement: above (even) and below (odd)
            is_above = (i % 2 == 0)
            card_y = track_y - card_h - 40 if is_above else track_y + 40
            card_x = node_cx - (card_w / 2)

            # Connector line between badge and card
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.LINE,
                    x1=node_cx,
                    y1=track_y - badge_r if is_above else track_y + badge_r,
                    x2=node_cx,
                    y2=card_y + card_h if is_above else card_y,
                    stroke=theme["accent"],
                    stroke_width=2,
                    z_index=3,
                )
            )

            # Milestone Card
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=card_x,
                    y=card_y,
                    width=card_w,
                    height=card_h,
                    fill=theme["card_fill"],
                    stroke=theme["card_stroke"],
                    stroke_width=2,
                    radius=14,
                    morph_id=f"{morph_tag}-card",
                    z_index=3,
                )
            )

            # Icon
            icon_name = item.get("icon") or "globe"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=card_x + 16,
                    y=card_y + 14,
                    width=38,
                    height=38,
                    icon_name=icon_name,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["accent"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    morph_id=f"{morph_tag}-icon",
                    z_index=4,
                )
            )

            # Title
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=card_x + 60,
                    y=card_y + 14,
                    width=card_w - 74,
                    height=38,
                    content=item["title"],
                    font_size=15,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{morph_tag}-title",
                    z_index=4,
                )
            )

            # Description
            if item.get("description"):
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=card_x + 16,
                        y=card_y + 58,
                        width=card_w - 32,
                        height=card_h - 68,
                        content=item["description"],
                        font_size=12,
                        font_weight="normal",
                        font_color=theme["body_color"],
                        text_align="left",
                        vertical_align="top",
                        z_index=4,
                    )
                )

        return elements

    def _parse_code_and_steps(self, items: List[str]) -> Tuple[str, str, str, List[Dict[str, Any]]]:
        """Extract filename, language, code snippet string, and step explanation items."""
        filename = "main.py"
        language = "Python"
        code_lines: List[str] = []
        step_raw_lines: List[str] = []
        in_code_block = False

        for raw_line in items:
            line_str = raw_line.strip()
            if not line_str:
                if in_code_block:
                    code_lines.append("")
                continue

            # Code fence ``` or ```lang [filename]
            if line_str.startswith("```"):
                in_code_block = not in_code_block
                rest = line_str.lstrip("`").strip()
                if rest:
                    fn_match = re.search(r"\[([^\]]+)\]", rest)
                    if fn_match:
                        filename = fn_match.group(1).strip()
                        rest = rest[:fn_match.start()].strip()
                    if rest:
                        language = rest.capitalize()
                continue

            if in_code_block:
                code_lines.append(raw_line)
                continue

            # Directive Code: [filename] or Code: filename
            if line_str.lower().startswith("code:"):
                rest = line_str.split(":", 1)[1].strip()
                fn_match = re.search(r"\[([^\]]+)\]", rest)
                if fn_match:
                    filename = fn_match.group(1).strip()
                elif rest:
                    filename = rest
                lower_fn = filename.lower()
                if lower_fn.endswith(".ts") or lower_fn.endswith(".tsx"):
                    language = "TypeScript"
                elif lower_fn.endswith(".js") or lower_fn.endswith(".jsx"):
                    language = "JavaScript"
                elif lower_fn.endswith(".py"):
                    language = "Python"
                elif lower_fn.endswith(".go"):
                    language = "Go"
                elif lower_fn.endswith(".rs"):
                    language = "Rust"
                elif lower_fn.endswith(".sql"):
                    language = "SQL"
                elif lower_fn.endswith(".yaml") or lower_fn.endswith(".yml"):
                    language = "YAML"
                elif lower_fn.endswith(".json"):
                    language = "JSON"
                continue

            # Check if this is a step item
            is_step = (
                re.match(r"^[-*•]\s*(?:\[\d+\]|\d+\.|\(icon:|step\s*\d+)", line_str, re.IGNORECASE)
                or line_str.startswith("- ")
                or line_str.startswith("* ")
                or line_str.startswith("• ")
                or re.match(r"^\d+\.\s+", line_str)
            )
            if is_step:
                step_raw_lines.append(line_str)
            else:
                code_lines.append(raw_line)

        code_text = "\n".join(code_lines).strip()
        if not code_text:
            code_text = (
                "# Distributed Token Bucket Rate Limiter\n"
                "def evaluate_request(client_id: str, limit: int = 100):\n"
                "    key = f\"rate_limit:{client_id}\"\n"
                "    tokens = redis_client.get(key)\n"
                "    if tokens and int(tokens) > 0:\n"
                "        redis_client.decr(key)\n"
                "        return {\"status\": 200, \"allowed\": True}\n"
                "    return {\"status\": 429, \"retry_after\": 60}"
            )

        step_items = [self._extract_item_parts(s) for s in step_raw_lines if s.strip()]
        if not step_items:
            step_items = [
                {"title": "1. Sliding Window Check", "description": "Queries current token quota in low-latency in-memory cache", "icon": "clock"},
                {"title": "2. Atomic Decrement", "description": "Safely consumes available quota without race conditions", "icon": "zap"},
                {"title": "3. 429 Rejection Guard", "description": "Rejects burst spam and protects downstream services", "icon": "shield"},
            ]

        return filename, language, code_text, step_items

    def _layout_code_walkthrough(
        self,
        title: str,
        items: List[str],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []
        filename, language, code_text, step_items = self._parse_code_and_steps(items)

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=45,
                width=1120,
                height=50,
                content=title,
                font_size=36,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                vertical_align="middle",
                z_index=1,
            )
        )

        win_x = 80
        win_y = 110
        win_w = 660
        win_h = 565

        # Code window frame
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=win_x,
                y=win_y,
                width=win_w,
                height=win_h,
                fill="#080c18",
                stroke=theme["card_stroke"],
                stroke_width=2,
                radius=16,
                morph_id=f"code-win-{normalize_token(filename)}",
                z_index=2,
            )
        )

        # Window header bar
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=win_x,
                y=win_y,
                width=win_w,
                height=44,
                fill="#121829",
                stroke=theme["card_stroke"],
                stroke_width=1,
                radius=16,
                z_index=3,
            )
        )

        # macOS traffic lights
        dots = [
            ("#ef4444", "#dc2626"),
            ("#f59e0b", "#d97706"),
            ("#10b981", "#059669"),
        ]
        for i, (dot_fill, dot_stroke) in enumerate(dots):
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=win_x + 18 + i * 20,
                    y=win_y + 15,
                    width=14,
                    height=14,
                    fill=dot_fill,
                    stroke=dot_stroke,
                    stroke_width=1,
                    radius=7,
                    z_index=4,
                )
            )

        # Filename badge
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=win_x + 88,
                y=win_y + 10,
                width=280,
                height=24,
                content=f"📄 {filename}",
                font_size=13,
                font_weight="bold",
                font_color=theme["body_color"],
                text_align="left",
                vertical_align="middle",
                z_index=4,
            )
        )

        # Language Pill
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=win_x + win_w - 95,
                y=win_y + 10,
                width=80,
                height=24,
                fill=theme["badge_fill"],
                stroke=theme["accent"],
                stroke_width=1,
                radius=6,
                z_index=4,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=win_x + win_w - 95,
                y=win_y + 10,
                width=80,
                height=24,
                content=language,
                font_size=11,
                font_weight="bold",
                font_color=theme["accent"],
                text_align="center",
                vertical_align="middle",
                z_index=5,
            )
        )

        # Monospace Code Text
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=win_x + 20,
                y=win_y + 58,
                width=win_w - 40,
                height=win_h - 72,
                content=code_text,
                font_size=14,
                font_weight="normal",
                font_color="#e2e8f0",
                text_align="left",
                vertical_align="top",
                z_index=3,
            )
        )

        # Right-side Step Callouts
        step_x = 765
        step_w = 435
        total_h = 565
        count = max(1, min(4, len(step_items)))
        gap = 16
        card_h = (total_h - (gap * (count - 1))) / count

        for i, step in enumerate(step_items[:count]):
            card_y = 110 + i * (card_h + gap)
            morph_tag = self._get_morph_id(step["title"], entity_registry, step.get("morph"))

            # Step card container
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=step_x,
                    y=card_y,
                    width=step_w,
                    height=card_h,
                    fill=theme["card_fill"],
                    stroke=theme["accent"] if i == 0 else theme["card_stroke"],
                    stroke_width=2,
                    radius=14,
                    morph_id=f"{morph_tag}-card",
                    z_index=2,
                )
            )

            # Step Number Badge
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=step_x + 16,
                    y=card_y + 14,
                    width=38,
                    height=28,
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    radius=8,
                    z_index=3,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=step_x + 16,
                    y=card_y + 14,
                    width=38,
                    height=28,
                    content=f"0{i+1}",
                    font_size=13,
                    font_weight="bold",
                    font_color=theme["accent"],
                    text_align="center",
                    vertical_align="middle",
                    z_index=4,
                )
            )

            # Icon
            s_icon = step.get("icon") or "zap"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=step_x + 62,
                    y=card_y + 13,
                    width=30,
                    height=30,
                    icon_name=s_icon,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            # Title
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=step_x + 100,
                    y=card_y + 14,
                    width=step_w - 116,
                    height=28,
                    content=step["title"],
                    font_size=17,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{morph_tag}-title",
                    z_index=4,
                )
            )

            # Description
            desc_text = step.get("description") or step.get("raw", "")
            if desc_text:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=step_x + 16,
                        y=card_y + 48,
                        width=step_w - 32,
                        height=max(28, card_h - 58),
                        content=desc_text,
                        font_size=13,
                        font_weight="normal",
                        font_color=theme["body_color"],
                        text_align="left",
                        vertical_align="top",
                        z_index=4,
                    )
                )

            # Pointer arrow from code towards step
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ARROW,
                    x1=step_x - 16,
                    y1=card_y + card_h / 2,
                    x2=step_x - 3,
                    y2=card_y + card_h / 2,
                    stroke=theme["accent"],
                    stroke_width=2,
                    arrow_head=ArrowHead.END,
                    z_index=5,
                )
            )

        return elements

    def _layout_architecture_layers(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []
        count = max(2, min(5, len(items)))

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=45,
                width=1120,
                height=50,
                content=title,
                font_size=36,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                vertical_align="middle",
                z_index=1,
            )
        )

        total_h = 560
        gap = 16
        layer_h = (total_h - (gap * (count - 1))) / count
        protocols = ["▼ HTTP/3 / TLS", "▼ gRPC / mTLS", "▼ TCP Sockets", "▼ WAL Stream", "▼ Storage I/O"]
        default_tiers = ["EDGE & CDN", "API GATEWAY", "MICROSERVICES", "STORAGE & CACHE", "INFRASTRUCTURE"]

        for i, item in enumerate(items[:count]):
            layer_y = 115 + i * (layer_h + gap)
            raw_title = item["title"]

            tier_label = default_tiers[i % len(default_tiers)]
            if "|" in raw_title:
                parts = raw_title.split("|", 1)
                tier_label = parts[0].strip().upper()
                card_title = parts[1].strip()
            else:
                card_title = raw_title

            morph_tag = self._get_morph_id(card_title, entity_registry, item.get("morph"))

            # Layer Container Card
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=80,
                    y=layer_y,
                    width=1120,
                    height=layer_h,
                    fill=theme["card_fill"],
                    stroke=theme["accent"] if i == 0 else theme["card_stroke"],
                    stroke_width=2,
                    radius=14,
                    morph_id=f"{morph_tag}-card",
                    z_index=2,
                )
            )

            # Tier Pill Badge
            badge_w = 180
            badge_h = layer_h - 24
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=96,
                    y=layer_y + 12,
                    width=badge_w,
                    height=badge_h,
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1.5,
                    radius=10,
                    z_index=3,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=96,
                    y=layer_y + 12,
                    width=badge_w,
                    height=badge_h,
                    content=f"LAYER 0{i+1}\n{tier_label}",
                    font_size=12,
                    font_weight="bold",
                    font_color=theme["accent"],
                    text_align="center",
                    vertical_align="middle",
                    z_index=4,
                )
            )

            # Icon
            s_icon = item.get("icon") or "layers"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=295,
                    y=layer_y + (layer_h - 40) / 2,
                    width=40,
                    height=40,
                    icon_name=s_icon,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            # Layer Title
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=350,
                    y=layer_y + 14,
                    width=650,
                    height=28,
                    content=card_title,
                    font_size=18,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{morph_tag}-title",
                    z_index=4,
                )
            )

            # Layer Description / Specs
            desc_text = item.get("description") or item.get("raw", "")
            if desc_text:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=350,
                        y=layer_y + 44,
                        width=650,
                        height=max(26, layer_h - 52),
                        content=desc_text,
                        font_size=13,
                        font_weight="normal",
                        font_color=theme["body_color"],
                        text_align="left",
                        vertical_align="top",
                        z_index=4,
                    )
                )

            # Vertical Interconnect Connector between tiers
            if i < count - 1:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.ARROW,
                        x1=1130,
                        y1=layer_y + layer_h,
                        x2=1130,
                        y2=layer_y + layer_h + gap,
                        stroke=theme["accent"],
                        stroke_width=2,
                        arrow_head=ArrowHead.END,
                        z_index=5,
                    )
                )
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=1030,
                        y=layer_y + layer_h - 2,
                        width=95,
                        height=gap + 4,
                        content=protocols[i % len(protocols)],
                        font_size=10,
                        font_weight="bold",
                        font_color=theme["accent"],
                        text_align="right",
                        vertical_align="middle",
                        z_index=5,
                    )
                )

        return elements

    def _parse_problem_solution(
        self, items: List[Dict[str, Any]], raw_lines: Optional[List[str]] = None
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        problem_items: List[Dict[str, Any]] = []
        solution_items: List[Dict[str, Any]] = []
        current_mode = None

        lines_to_scan = raw_lines if raw_lines else [it.get("raw", "") for it in items]

        for raw in lines_to_scan:
            line_str = raw.strip()
            if not line_str:
                continue
            lower_line = line_str.lower()
            if any(lower_line.startswith(p) for p in ("problem:", "bottleneck:", "anti-pattern:", "legacy:", "issue:", "before:", "problem")):
                current_mode = "problem"
                clean = re.sub(r"^(?:problem|bottleneck|anti-pattern|legacy|issue|before):\s*", "", line_str, flags=re.IGNORECASE).strip()
                if clean and clean.lower() != "problem":
                    problem_items.append(self._extract_item_parts(clean))
                continue
            elif any(lower_line.startswith(s) for s in ("solution:", "fix:", "modern:", "resolved:", "optimized:", "after:", "solution")):
                current_mode = "solution"
                clean = re.sub(r"^(?:solution|fix|modern|resolved|optimized|after):\s*", "", line_str, flags=re.IGNORECASE).strip()
                if clean and clean.lower() != "solution":
                    solution_items.append(self._extract_item_parts(clean))
                continue

            if current_mode == "problem":
                problem_items.append(self._extract_item_parts(line_str))
            elif current_mode == "solution":
                solution_items.append(self._extract_item_parts(line_str))

        if not problem_items and not solution_items:
            mid = max(1, len(items) // 2)
            problem_items = items[:mid]
            solution_items = items[mid:]

        def build_side(side_items, default_title, default_icon, default_bullets):
            if not side_items:
                return {
                    "title": default_title,
                    "icon": default_icon,
                    "bullets": default_bullets,
                }
            first = side_items[0]
            first_title = first["title"] or default_title
            first_icon = next((x["icon"] for x in side_items if x["icon"]), default_icon)
            bullets = []
            if first.get("description"):
                bullets.append(first["description"])
            for extra in side_items[1:]:
                b_line = extra.get("raw", "").strip().lstrip("-*•> ")
                if b_line:
                    bullets.append(b_line)
            if not bullets:
                bullets = default_bullets
            return {
                "title": first_title,
                "icon": first_icon,
                "bullets": bullets,
            }

        p_data = build_side(
            problem_items,
            "Legacy HTTP Polling Bottleneck",
            "alert-triangle",
            [
                "100,000 active clients pinging server every 2 seconds",
                "99% of requests return empty 304 payloads",
                "Database connection pool exhaustion under load",
            ],
        )
        s_data = build_side(
            solution_items,
            "Bidirectional WebSocket Mesh",
            "check-circle",
            [
                "Single persistent duplex TCP connection per client",
                "Events pushed only when database state mutates",
                "94% reduction in server CPU and network bandwidth",
            ],
        )
        return p_data, s_data

    def _layout_problem_solution(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
        raw_lines: Optional[List[str]] = None,
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []
        p_data, s_data = self._parse_problem_solution(items, raw_lines)

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=45,
                width=1120,
                height=50,
                content=title,
                font_size=36,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="center",
                vertical_align="middle",
                z_index=1,
            )
        )

        card_w = 535
        card_h = 555
        p_morph = self._get_morph_id("problem", entity_registry)
        s_morph = self._get_morph_id("solution", entity_registry)

        # Left Problem Card
        p_x = 80
        p_y = 115
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=p_x,
                y=p_y,
                width=card_w,
                height=card_h,
                fill="#160810",
                stroke="#f43f5e",
                stroke_width=2,
                radius=16,
                morph_id=f"{p_morph}-card",
                z_index=2,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=p_x + 24,
                y=p_y + 20,
                width=290,
                height=32,
                fill="#4c0519",
                stroke="#f43f5e",
                stroke_width=1,
                radius=8,
                z_index=3,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=p_x + 24,
                y=p_y + 20,
                width=290,
                height=32,
                content="⚠️  THE BOTTLENECK / PROBLEM",
                font_size=12,
                font_weight="bold",
                font_color="#fca5a5",
                text_align="center",
                vertical_align="middle",
                z_index=4,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ICON,
                x=p_x + 24,
                y=p_y + 66,
                width=44,
                height=44,
                icon_name="alert-triangle",
                icon_badge="circle",
                badge_color="#4c0519",
                icon_color="#fca5a5",
                fill="#4c0519",
                stroke="#f43f5e",
                stroke_width=2,
                morph_id=f"{p_morph}-icon",
                z_index=3,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=p_x + 80,
                y=p_y + 66,
                width=card_w - 104,
                height=44,
                content=p_data["title"],
                font_size=20,
                font_weight="bold",
                font_color="#ffffff",
                text_align="left",
                vertical_align="middle",
                morph_id=f"{p_morph}-title",
                z_index=4,
            )
        )
        p_bullets_text = "\n\n".join([f"•  {b.lstrip('•- ')}" for b in p_data["bullets"]])
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=p_x + 24,
                y=p_y + 128,
                width=card_w - 48,
                height=card_h - 148,
                content=p_bullets_text,
                font_size=15,
                font_weight="normal",
                font_color="#fecdd3",
                text_align="left",
                vertical_align="top",
                z_index=4,
            )
        )

        # Right Solution Card
        s_x = 665
        s_y = 115
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=s_x,
                y=s_y,
                width=card_w,
                height=card_h,
                fill="#041812",
                stroke="#10b981",
                stroke_width=2,
                radius=16,
                morph_id=f"{s_morph}-card",
                z_index=2,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=s_x + 24,
                y=s_y + 20,
                width=290,
                height=32,
                fill="#064e3b",
                stroke="#10b981",
                stroke_width=1,
                radius=8,
                z_index=3,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=s_x + 24,
                y=s_y + 20,
                width=290,
                height=32,
                content="⚡  MODERN ARCHITECTURE SOLUTION",
                font_size=12,
                font_weight="bold",
                font_color="#6ee7b7",
                text_align="center",
                vertical_align="middle",
                z_index=4,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ICON,
                x=s_x + 24,
                y=s_y + 66,
                width=44,
                height=44,
                icon_name="check-circle",
                icon_badge="circle",
                badge_color="#064e3b",
                icon_color="#6ee7b7",
                fill="#064e3b",
                stroke="#10b981",
                stroke_width=2,
                morph_id=f"{s_morph}-icon",
                z_index=3,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=s_x + 80,
                y=s_y + 66,
                width=card_w - 104,
                height=44,
                content=s_data["title"],
                font_size=20,
                font_weight="bold",
                font_color="#ffffff",
                text_align="left",
                vertical_align="middle",
                morph_id=f"{s_morph}-title",
                z_index=4,
            )
        )
        s_bullets_text = "\n\n".join([f"✓  {b.lstrip('•- ')}" for b in s_data["bullets"]])
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=s_x + 24,
                y=s_y + 128,
                width=card_w - 48,
                height=card_h - 148,
                content=s_bullets_text,
                font_size=15,
                font_weight="normal",
                font_color="#a7f3d0",
                text_align="left",
                vertical_align="top",
                z_index=4,
            )
        )

        # Center VS Badge
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=618,
                y=370,
                width=44,
                height=44,
                fill=theme["card_fill"],
                stroke=theme["accent"],
                stroke_width=2,
                radius=22,
                z_index=4,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=618,
                y=370,
                width=44,
                height=44,
                content="VS",
                font_size=13,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="center",
                vertical_align="middle",
                z_index=5,
            )
        )

        return elements

    def _layout_circular_loop(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=40,
                width=1120,
                height=50,
                content=title,
                font_size=36,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="center",
                vertical_align="middle",
                z_index=1,
            )
        )

        cx = 640
        cy = 405
        k = max(3, min(6, len(items)))

        # Center Hub Card
        hub_w = 230
        hub_h = 110
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=cx - hub_w / 2,
                y=cy - hub_h / 2,
                width=hub_w,
                height=hub_h,
                fill=theme["card_fill"],
                stroke=theme["accent"],
                stroke_width=2,
                radius=18,
                morph_id="circular-hub",
                z_index=2,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ICON,
                x=cx - 22,
                y=cy - 44,
                width=44,
                height=44,
                icon_name="repeat",
                icon_badge="circle",
                badge_color=theme["badge_fill"],
                icon_color=theme["title_color"],
                fill=theme["badge_fill"],
                stroke=theme["accent"],
                stroke_width=1,
                z_index=3,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=cx - 100,
                y=cy + 4,
                width=200,
                height=40,
                content="Continuous Loop",
                font_size=14,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="center",
                vertical_align="middle",
                z_index=4,
            )
        )

        # Orbit Nodes
        rx = 390
        ry = 195
        cw = 220
        ch = 105

        node_centers = []
        for i in range(k):
            theta = -math.pi / 2 + (2 * math.pi * i / k)
            nx = cx + rx * math.cos(theta)
            ny = cy + ry * math.sin(theta)
            node_centers.append((nx, ny))

        for i, item in enumerate(items[:k]):
            nx, ny = node_centers[i]
            card_x = max(80, min(980, nx - cw / 2))
            card_y = max(95, min(580, ny - ch / 2))
            morph_tag = self._get_morph_id(item["title"], entity_registry, item.get("morph"))

            # Container
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=card_x,
                    y=card_y,
                    width=cw,
                    height=ch,
                    fill=theme["card_fill"],
                    stroke=theme["accent"] if i == 0 else theme["card_stroke"],
                    stroke_width=2,
                    radius=14,
                    morph_id=f"{morph_tag}-card",
                    z_index=2,
                )
            )

            # Icon
            s_icon = item.get("icon") or "zap"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=card_x + 14,
                    y=card_y + 14,
                    width=32,
                    height=32,
                    icon_name=s_icon,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            # Title
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=card_x + 52,
                    y=card_y + 14,
                    width=cw - 64,
                    height=30,
                    content=item["title"],
                    font_size=15,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{morph_tag}-title",
                    z_index=4,
                )
            )

            # Description
            desc_text = item.get("description") or item.get("raw", "")
            if desc_text:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=card_x + 14,
                        y=card_y + 48,
                        width=cw - 28,
                        height=ch - 54,
                        content=desc_text,
                        font_size=12,
                        font_weight="normal",
                        font_color=theme["body_color"],
                        text_align="left",
                        vertical_align="top",
                        z_index=4,
                    )
                )

            # Connecting arrow to next node
            next_idx = (i + 1) % k
            next_nx, next_ny = node_centers[next_idx]
            mid_x1 = nx + (next_nx - nx) * 0.32
            mid_y1 = ny + (next_ny - ny) * 0.32
            mid_x2 = nx + (next_nx - nx) * 0.68
            mid_y2 = ny + (next_ny - ny) * 0.68

            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ARROW,
                    x1=mid_x1,
                    y1=mid_y1,
                    x2=mid_x2,
                    y2=mid_y2,
                    stroke=theme["accent"],
                    stroke_width=2,
                    arrow_head=ArrowHead.END,
                    z_index=5,
                )
            )

        return elements

    def _layout_event_stream(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
        connection_map: Optional[Dict[str, str]] = None,
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=45,
                width=1120,
                height=50,
                content=title,
                font_size=36,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                vertical_align="middle",
                z_index=1,
            )
        )

        stages = [
            {"title": "1. Ingestion Sources", "sub": "Mobile & Web Event Telemetry", "icon": "globe", "x": 80, "w": 240, "h": 525, "y": 135},
            {"title": "2. Message Broker", "sub": "Distributed Partitioned Log", "icon": "server", "x": 360, "w": 265, "h": 555, "y": 120},
            {"title": "3. Stream Processors", "sub": "Stateful Parallel Worker Mesh", "icon": "cpu", "x": 665, "w": 250, "h": 525, "y": 135},
            {"title": "4. Storage Sinks", "sub": "Real-Time OLAP & Data Lake", "icon": "database", "x": 955, "w": 245, "h": 525, "y": 135},
        ]

        for idx, item in enumerate(items[:4]):
            stages[idx]["title"] = item["title"]
            if item.get("description"):
                stages[idx]["sub"] = item["description"]
            if item.get("icon"):
                stages[idx]["icon"] = item["icon"]

        for i, stg in enumerate(stages):
            morph_tag = self._get_morph_id(stg["title"], entity_registry)

            # Stage Container Card
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=stg["x"],
                    y=stg["y"],
                    width=stg["w"],
                    height=stg["h"],
                    fill=theme["card_fill"],
                    stroke=theme["accent"] if i == 1 else theme["card_stroke"],
                    stroke_width=2,
                    radius=16,
                    morph_id=f"{morph_tag}-card",
                    z_index=2,
                )
            )

            # Icon
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=stg["x"] + 20,
                    y=stg["y"] + 20,
                    width=42,
                    height=42,
                    icon_name=stg["icon"],
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            # Title
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=stg["x"] + 72,
                    y=stg["y"] + 20,
                    width=stg["w"] - 86,
                    height=42,
                    content=stg["title"],
                    font_size=17,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{morph_tag}-title",
                    z_index=4,
                )
            )

            # Subtitle
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=stg["x"] + 20,
                    y=stg["y"] + 70,
                    width=stg["w"] - 40,
                    height=40,
                    content=stg["sub"],
                    font_size=13,
                    font_weight="normal",
                    font_color=theme["body_color"],
                    text_align="left",
                    vertical_align="top",
                    z_index=4,
                )
            )

            if i == 1:
                # Broker partitions visual
                for p_idx in range(3):
                    p_y = stg["y"] + 130 + p_idx * 50
                    elements.append(
                        ElementModel(
                            id=f"el-{uuid.uuid4().hex[:8]}",
                            type=ElementType.ROUNDED_RECTANGLE,
                            x=stg["x"] + 20,
                            y=p_y,
                            width=stg["w"] - 40,
                            height=38,
                            fill="#111827",
                            stroke=theme["accent"],
                            stroke_width=1,
                            radius=8,
                            z_index=3,
                        )
                    )
                    elements.append(
                        ElementModel(
                            id=f"el-{uuid.uuid4().hex[:8]}",
                            type=ElementType.TEXT,
                            x=stg["x"] + 30,
                            y=p_y,
                            width=stg["w"] - 60,
                            height=38,
                            content=f"Partition [{p_idx}]: Immutable Log",
                            font_size=11,
                            font_weight="bold",
                            font_color=theme["accent"],
                            text_align="left",
                            vertical_align="middle",
                            z_index=4,
                        )
                    )
            elif i == 2:
                # Parallel workers visual
                w_labels = ["⚡ Worker A: Tumbling Window", "⚡ Worker B: Deduplication & Enrich"]
                for w_idx in range(2):
                    w_y = stg["y"] + 140 + w_idx * 65
                    elements.append(
                        ElementModel(
                            id=f"el-{uuid.uuid4().hex[:8]}",
                            type=ElementType.ROUNDED_RECTANGLE,
                            x=stg["x"] + 18,
                            y=w_y,
                            width=stg["w"] - 36,
                            height=50,
                            fill="#111827",
                            stroke=theme["card_stroke"],
                            stroke_width=1,
                            radius=8,
                            z_index=3,
                        )
                    )
                    elements.append(
                        ElementModel(
                            id=f"el-{uuid.uuid4().hex[:8]}",
                            type=ElementType.TEXT,
                            x=stg["x"] + 26,
                            y=w_y,
                            width=stg["w"] - 52,
                            height=50,
                            content=w_labels[w_idx],
                            font_size=11,
                            font_weight="bold",
                            font_color=theme["body_color"],
                            text_align="left",
                            vertical_align="middle",
                            z_index=4,
                        )
                    )
            elif i == 3:
                # Storage sinks visual
                s_labels = ["⚡ Real-Time Columnar OLAP", "🗄 Parquet Lakehouse Sink"]
                for s_idx in range(2):
                    s_y = stg["y"] + 140 + s_idx * 65
                    elements.append(
                        ElementModel(
                            id=f"el-{uuid.uuid4().hex[:8]}",
                            type=ElementType.ROUNDED_RECTANGLE,
                            x=stg["x"] + 18,
                            y=s_y,
                            width=stg["w"] - 36,
                            height=50,
                            fill="#111827",
                            stroke=theme["card_stroke"],
                            stroke_width=1,
                            radius=8,
                            z_index=3,
                        )
                    )
                    elements.append(
                        ElementModel(
                            id=f"el-{uuid.uuid4().hex[:8]}",
                            type=ElementType.TEXT,
                            x=stg["x"] + 26,
                            y=s_y,
                            width=stg["w"] - 52,
                            height=50,
                            content=s_labels[s_idx],
                            font_size=11,
                            font_weight="bold",
                            font_color=theme["body_color"],
                            text_align="left",
                            vertical_align="middle",
                            z_index=4,
                        )
                    )

            # Connecting arrow to next stage
            if i < 3:
                next_stg = stages[i + 1]
                mid_y = 390
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.ARROW,
                        x1=stg["x"] + stg["w"] + 5,
                        y1=mid_y,
                        x2=next_stg["x"] - 5,
                        y2=mid_y,
                        stroke=theme["accent"],
                        stroke_width=2.5,
                        arrow_head=ArrowHead.END,
                        z_index=5,
                    )
                )
                rate_labels = ["1.5M/s", "Sub-5ms", "Batch"]
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=stg["x"] + stg["w"] - 8,
                        y=mid_y - 24,
                        width=next_stg["x"] - (stg["x"] + stg["w"]) + 16,
                        height=20,
                        content=rate_labels[i],
                        font_size=10,
                        font_weight="bold",
                        font_color=theme["accent"],
                        text_align="center",
                        vertical_align="middle",
                        z_index=5,
                    )
                )

        return elements

    def _layout_bento_box(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=45,
                width=1120,
                height=50,
                content=title,
                font_size=36,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                vertical_align="middle",
                z_index=1,
            )
        )

        hero = items[0] if items else {"title": "Architecture Overview", "description": "High performance computing core", "icon": "zap"}
        hero_morph = self._get_morph_id(hero["title"], entity_registry, hero.get("morph"))

        # 1. Left Hero Tile (55% width, 550px height)
        hero_x = 80
        hero_y = 115
        hero_w = 610
        hero_h = 550

        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=hero_x,
                y=hero_y,
                width=hero_w,
                height=hero_h,
                fill=theme["card_fill"],
                stroke=theme["accent"],
                stroke_width=2,
                radius=18,
                morph_id=f"{hero_morph}-card",
                z_index=2,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=hero_x + 28,
                y=hero_y + 24,
                width=175,
                height=28,
                fill=theme["badge_fill"],
                stroke=theme["accent"],
                stroke_width=1,
                radius=8,
                z_index=3,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=hero_x + 28,
                y=hero_y + 24,
                width=175,
                height=28,
                content="FEATURE SPOTLIGHT",
                font_size=11,
                font_weight="bold",
                font_color=theme["accent"],
                text_align="center",
                vertical_align="middle",
                z_index=4,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ICON,
                x=hero_x + 28,
                y=hero_y + 70,
                width=56,
                height=56,
                icon_name=hero.get("icon") or "zap",
                icon_badge="circle",
                badge_color=theme["badge_fill"],
                icon_color=theme["title_color"],
                fill=theme["badge_fill"],
                stroke=theme["accent"],
                stroke_width=2,
                morph_id=f"{hero_morph}-icon",
                z_index=3,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=hero_x + 28,
                y=hero_y + 140,
                width=hero_w - 56,
                height=48,
                content=hero["title"],
                font_size=26,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                vertical_align="middle",
                morph_id=f"{hero_morph}-title",
                z_index=4,
            )
        )
        hero_desc = hero.get("description") or hero.get("raw", "")
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=hero_x + 28,
                y=hero_y + 196,
                width=hero_w - 56,
                height=hero_h - 220,
                content=hero_desc,
                font_size=16,
                font_weight="normal",
                font_color=theme["body_color"],
                text_align="left",
                vertical_align="top",
                z_index=4,
            )
        )

        # 2. Top-Right Metric Tile
        metric_item = items[1] if len(items) > 1 else {"title": "10x | Speedup", "description": "Near instant compiler builds", "icon": "cpu"}
        m_raw = metric_item["title"]
        if "|" in m_raw:
            m_val, m_label = [p.strip() for p in m_raw.split("|", 1)]
        else:
            m_val, m_label = "10x", m_raw

        m_morph = self._get_morph_id(m_label, entity_registry, metric_item.get("morph"))
        m_x = 715
        m_y = 115
        m_w = 485
        m_h = 260

        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.ROUNDED_RECTANGLE,
                x=m_x,
                y=m_y,
                width=m_w,
                height=m_h,
                fill=theme["card_fill"],
                stroke=theme["card_stroke"],
                stroke_width=2,
                radius=18,
                morph_id=f"{m_morph}-card",
                z_index=2,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=m_x + 26,
                y=m_y + 20,
                width=m_w - 52,
                height=56,
                content=m_val,
                font_size=46,
                font_weight="bold",
                font_color=theme["accent"],
                text_align="left",
                vertical_align="middle",
                z_index=3,
            )
        )
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=m_x + 26,
                y=m_y + 82,
                width=m_w - 52,
                height=30,
                content=m_label,
                font_size=18,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                vertical_align="middle",
                morph_id=f"{m_morph}-title",
                z_index=4,
            )
        )
        m_desc = metric_item.get("description") or metric_item.get("raw", "")
        if m_desc:
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=m_x + 26,
                    y=m_y + 118,
                    width=m_w - 52,
                    height=m_h - 134,
                    content=m_desc,
                    font_size=14,
                    font_weight="normal",
                    font_color=theme["body_color"],
                    text_align="left",
                    vertical_align="top",
                    z_index=4,
                )
            )

        # 3. Bottom-Right Mini Tiles
        sub2 = items[2] if len(items) > 2 else {"title": "Task Graph", "description": "Topological DAG execution", "icon": "workflow"}
        sub3 = items[3] if len(items) > 3 else {"title": "Zero Config", "description": "Automatic workspace discovery", "icon": "shield"}
        sub_items = [sub2, sub3]
        sub_w = 232
        sub_h = 270
        sub_y = 395

        for i, sub in enumerate(sub_items):
            sub_x = 715 + i * (sub_w + 21)
            s_morph = self._get_morph_id(sub["title"], entity_registry, sub.get("morph"))

            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=sub_x,
                    y=sub_y,
                    width=sub_w,
                    height=sub_h,
                    fill=theme["card_fill"],
                    stroke=theme["card_stroke"],
                    stroke_width=2,
                    radius=16,
                    morph_id=f"{s_morph}-card",
                    z_index=2,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=sub_x + 20,
                    y=sub_y + 20,
                    width=38,
                    height=38,
                    icon_name=sub.get("icon") or "box",
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    morph_id=f"{s_morph}-icon",
                    z_index=3,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=sub_x + 20,
                    y=sub_y + 70,
                    width=sub_w - 40,
                    height=32,
                    content=sub["title"],
                    font_size=16,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{s_morph}-title",
                    z_index=4,
                )
            )
            s_desc = sub.get("description") or sub.get("raw", "")
            if s_desc:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=sub_x + 20,
                        y=sub_y + 110,
                        width=sub_w - 40,
                        height=sub_h - 124,
                        content=s_desc,
                        font_size=13,
                        font_weight="normal",
                        font_color=theme["body_color"],
                        text_align="left",
                        vertical_align="top",
                        z_index=4,
                    )
                )

        return elements

    def _layout_feature_matrix(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
    ) -> List[ElementModel]:
        elements: List[ElementModel] = []
        count = max(2, min(4, len(items)))

        # Header Title
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=80,
                y=45,
                width=1120,
                height=50,
                content=title,
                font_size=36,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="left",
                vertical_align="middle",
                z_index=1,
            )
        )

        gap = 25
        col_w = (1120 - (gap * (count - 1))) / count
        pos_y = 115
        col_h = 550

        for i, item in enumerate(items[:count]):
            col_x = 80 + i * (col_w + gap)
            raw_title = item["title"]

            if "|" in raw_title:
                t_name, t_sub = [p.strip() for p in raw_title.split("|", 1)]
            else:
                t_name, t_sub = raw_title, f"PARADIGM 0{i+1}"

            morph_tag = self._get_morph_id(t_name, entity_registry, item.get("morph"))

            # Column Container
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=col_x,
                    y=pos_y,
                    width=col_w,
                    height=col_h,
                    fill=theme["card_fill"],
                    stroke=theme["accent"] if i == 0 else theme["card_stroke"],
                    stroke_width=2,
                    radius=16,
                    morph_id=f"{morph_tag}-card",
                    z_index=2,
                )
            )

            # Top Option Tag
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=col_x + 18,
                    y=pos_y + 18,
                    width=col_w - 36,
                    height=28,
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    radius=6,
                    z_index=3,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=col_x + 18,
                    y=pos_y + 18,
                    width=col_w - 36,
                    height=28,
                    content=t_sub.upper(),
                    font_size=11,
                    font_weight="bold",
                    font_color=theme["accent"],
                    text_align="center",
                    vertical_align="middle",
                    z_index=4,
                )
            )

            # Icon
            s_icon = item.get("icon") or "database"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=col_x + 18,
                    y=pos_y + 60,
                    width=42,
                    height=42,
                    icon_name=s_icon,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            # Column Title
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=col_x + 68,
                    y=pos_y + 60,
                    width=col_w - 86,
                    height=42,
                    content=t_name,
                    font_size=20,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    morph_id=f"{morph_tag}-title",
                    z_index=4,
                )
            )

            # Spec breakdown lines
            desc = item.get("description") or item.get("raw", "")
            specs = [s.strip() for s in re.split(r"[,;•\n]", desc) if s.strip()]
            if not specs:
                specs = ["ACID Transactions", "Sub-millisecond Latency", "Horizontal Sharding"]

            spec_text = "\n\n".join([f"•  {s}" for s in specs[:6]])
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=col_x + 18,
                    y=pos_y + 120,
                    width=col_w - 36,
                    height=col_h - 138,
                    content=spec_text,
                    font_size=14,
                    font_weight="normal",
                    font_color=theme["body_color"],
                    text_align="left",
                    vertical_align="top",
                    z_index=4,
                )
            )

        return elements

    def _layout_vertical_reels(
        self,
        title: str,
        items: List[Dict[str, Any]],
        theme: Dict[str, Any],
        entity_registry: Dict[str, str],
        clean_layout: str,
        raw_lines: Optional[List[str]] = None,
    ) -> List[ElementModel]:
        """Place slide elements onto 720x1280 vertical canvas tailored for Reels and Shorts."""
        elements: List[ElementModel] = []
        c_w = 720

        # Header Title (top of phone screen)
        elements.append(
            ElementModel(
                id=f"el-{uuid.uuid4().hex[:8]}",
                type=ElementType.TEXT,
                x=40,
                y=70,
                width=640,
                height=80,
                content=title,
                font_size=30,
                font_weight="bold",
                font_color=theme["title_color"],
                text_align="center",
                vertical_align="middle",
                z_index=1,
            )
        )

        # 1. Code Walkthrough in 9:16 Vertical
        if "code" in clean_layout or "walkthrough" in clean_layout:
            filename, language, code_text, step_items = self._parse_code_and_steps(raw_lines or [])
            win_y = 160
            win_h = 430

            # Terminal window
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=40,
                    y=win_y,
                    width=640,
                    height=win_h,
                    fill="#080c18",
                    stroke=theme["card_stroke"],
                    stroke_width=2,
                    radius=16,
                    z_index=2,
                )
            )
            # Window header bar
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=40,
                    y=win_y,
                    width=640,
                    height=40,
                    fill="#121829",
                    stroke=theme["card_stroke"],
                    stroke_width=1,
                    radius=16,
                    z_index=3,
                )
            )
            dots = [("#ef4444", "#dc2626"), ("#f59e0b", "#d97706"), ("#10b981", "#059669")]
            for i, (dot_fill, dot_stroke) in enumerate(dots):
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.ROUNDED_RECTANGLE,
                        x=56 + i * 18,
                        y=win_y + 13,
                        width=12,
                        height=12,
                        fill=dot_fill,
                        stroke=dot_stroke,
                        radius=6,
                        z_index=4,
                    )
                )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=120,
                    y=win_y + 8,
                    width=380,
                    height=24,
                    content=f"📄 {filename}",
                    font_size=12,
                    font_weight="bold",
                    font_color=theme["body_color"],
                    text_align="left",
                    vertical_align="middle",
                    z_index=4,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=56,
                    y=win_y + 50,
                    width=608,
                    height=win_h - 60,
                    content=code_text,
                    font_size=13,
                    font_weight="normal",
                    font_color="#e2e8f0",
                    text_align="left",
                    vertical_align="top",
                    z_index=3,
                )
            )

            # Stacked step cards below
            step_start_y = 610
            step_count = max(1, min(3, len(step_items)))
            step_card_h = 185
            step_gap = 18

            for i, step in enumerate(step_items[:step_count]):
                sc_y = step_start_y + i * (step_card_h + step_gap)
                morph_tag = self._get_morph_id(step["title"], entity_registry)

                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.ROUNDED_RECTANGLE,
                        x=40,
                        y=sc_y,
                        width=640,
                        height=step_card_h,
                        fill=theme["card_fill"],
                        stroke=theme["accent"] if i == 0 else theme["card_stroke"],
                        stroke_width=2,
                        radius=14,
                        morph_id=f"{morph_tag}-card",
                        z_index=2,
                    )
                )
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.ROUNDED_RECTANGLE,
                        x=56,
                        y=sc_y + 14,
                        width=36,
                        height=26,
                        fill=theme["badge_fill"],
                        stroke=theme["accent"],
                        radius=6,
                        z_index=3,
                    )
                )
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=56,
                        y=sc_y + 14,
                        width=36,
                        height=26,
                        content=f"0{i+1}",
                        font_size=12,
                        font_weight="bold",
                        font_color=theme["accent"],
                        text_align="center",
                        vertical_align="middle",
                        z_index=4,
                    )
                )
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=102,
                        y=sc_y + 14,
                        width=560,
                        height=26,
                        content=step["title"],
                        font_size=17,
                        font_weight="bold",
                        font_color=theme["title_color"],
                        text_align="left",
                        vertical_align="middle",
                        morph_id=f"{morph_tag}-title",
                        z_index=4,
                    )
                )
                s_desc = step.get("description") or step.get("raw", "")
                if s_desc:
                    elements.append(
                        ElementModel(
                            id=f"el-{uuid.uuid4().hex[:8]}",
                            type=ElementType.TEXT,
                            x=56,
                            y=sc_y + 48,
                            width=608,
                            height=step_card_h - 58,
                            content=s_desc,
                            font_size=14,
                            font_color=theme["body_color"],
                            text_align="left",
                            vertical_align="top",
                            z_index=4,
                        )
                    )
            return elements

        # 2. Problem vs Solution in 9:16 Vertical
        if "problem" in clean_layout or "solution" in clean_layout or "anti" in clean_layout or "bottleneck" in clean_layout:
            p_data, s_data = self._parse_problem_solution(items, raw_lines)
            ps_card_h = 490

            # Problem Card (Top)
            p_y = 160
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=40,
                    y=p_y,
                    width=640,
                    height=ps_card_h,
                    fill="#160810",
                    stroke="#f43f5e",
                    stroke_width=2,
                    radius=16,
                    z_index=2,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=56,
                    y=p_y + 16,
                    width=608,
                    height=30,
                    content="⚠️  THE BOTTLENECK / PROBLEM",
                    font_size=12,
                    font_weight="bold",
                    font_color="#fca5a5",
                    text_align="left",
                    vertical_align="middle",
                    z_index=3,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=56,
                    y=p_y + 50,
                    width=608,
                    height=36,
                    content=p_data["title"],
                    font_size=20,
                    font_weight="bold",
                    font_color="#ffffff",
                    text_align="left",
                    vertical_align="middle",
                    z_index=4,
                )
            )
            p_text = "\n\n".join([f"•  {b.lstrip('•- ')}" for b in p_data["bullets"]])
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=56,
                    y=p_y + 96,
                    width=608,
                    height=ps_card_h - 110,
                    content=p_text,
                    font_size=14,
                    font_color="#fecdd3",
                    text_align="left",
                    vertical_align="top",
                    z_index=4,
                )
            )

            # Solution Card (Bottom)
            s_y = 680
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=40,
                    y=s_y,
                    width=640,
                    height=ps_card_h,
                    fill="#041812",
                    stroke="#10b981",
                    stroke_width=2,
                    radius=16,
                    z_index=2,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=56,
                    y=s_y + 16,
                    width=608,
                    height=30,
                    content="⚡  THE MODERN ARCHITECTURE SOLUTION",
                    font_size=12,
                    font_weight="bold",
                    font_color="#6ee7b7",
                    text_align="left",
                    vertical_align="middle",
                    z_index=3,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=56,
                    y=s_y + 50,
                    width=608,
                    height=36,
                    content=s_data["title"],
                    font_size=20,
                    font_weight="bold",
                    font_color="#ffffff",
                    text_align="left",
                    vertical_align="middle",
                    z_index=4,
                )
            )
            s_text = "\n\n".join([f"✓  {b.lstrip('•- ')}" for b in s_data["bullets"]])
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=56,
                    y=s_y + 96,
                    width=608,
                    height=ps_card_h - 110,
                    content=s_text,
                    font_size=14,
                    font_color="#a7f3d0",
                    text_align="left",
                    vertical_align="top",
                    z_index=4,
                )
            )

            # Center VS badge
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=330,
                    y=655,
                    width=60,
                    height=30,
                    fill=theme["card_fill"],
                    stroke=theme["accent"],
                    stroke_width=2,
                    radius=15,
                    z_index=5,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=330,
                    y=655,
                    width=60,
                    height=30,
                    content="VS",
                    font_size=12,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="center",
                    vertical_align="middle",
                    z_index=6,
                )
            )
            return elements

        # 3. Bento Box in 9:16 Vertical
        if "bento" in clean_layout:
            hero = items[0] if items else {"title": "Architecture Hero", "description": "High performance computing core", "icon": "zap"}
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=40,
                    y=160,
                    width=640,
                    height=390,
                    fill=theme["card_fill"],
                    stroke=theme["accent"],
                    stroke_width=2,
                    radius=18,
                    z_index=2,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=64,
                    y=180,
                    width=46,
                    height=46,
                    icon_name=hero.get("icon") or "zap",
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["title_color"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=1,
                    z_index=3,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=120,
                    y=184,
                    width=540,
                    height=40,
                    content=hero["title"],
                    font_size=22,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    z_index=4,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=64,
                    y=236,
                    width=592,
                    height=300,
                    content=hero.get("description") or hero.get("raw", ""),
                    font_size=15,
                    font_color=theme["body_color"],
                    text_align="left",
                    vertical_align="top",
                    z_index=4,
                )
            )

            # Metric card in middle
            m_item = items[1] if len(items) > 1 else {"title": "10x | Speedup", "description": "Real-time query processing"}
            m_raw = m_item["title"]
            m_val, m_label = [p.strip() for p in m_raw.split("|", 1)] if "|" in m_raw else ("10x", m_raw)

            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=40,
                    y=570,
                    width=640,
                    height=240,
                    fill=theme["card_fill"],
                    stroke=theme["card_stroke"],
                    stroke_width=2,
                    radius=16,
                    z_index=2,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=64,
                    y=586,
                    width=592,
                    height=50,
                    content=m_val,
                    font_size=42,
                    font_weight="bold",
                    font_color=theme["accent"],
                    text_align="left",
                    vertical_align="middle",
                    z_index=3,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=64,
                    y=642,
                    width=592,
                    height=28,
                    content=m_label,
                    font_size=18,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="left",
                    vertical_align="middle",
                    z_index=4,
                )
            )
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=64,
                    y=676,
                    width=592,
                    height=120,
                    content=m_item.get("description") or m_item.get("raw", ""),
                    font_size=14,
                    font_color=theme["body_color"],
                    text_align="left",
                    vertical_align="top",
                    z_index=4,
                )
            )

            # Bottom 2 mini cards side-by-side
            sub2 = items[2] if len(items) > 2 else {"title": "Task Graph", "description": "Topological execution", "icon": "workflow"}
            sub3 = items[3] if len(items) > 3 else {"title": "Zero Config", "description": "Auto discovery", "icon": "shield"}
            for i, sub in enumerate([sub2, sub3]):
                bx = 40 + i * 330
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.ROUNDED_RECTANGLE,
                        x=bx,
                        y=830,
                        width=310,
                        height=360,
                        fill=theme["card_fill"],
                        stroke=theme["card_stroke"],
                        stroke_width=2,
                        radius=16,
                        z_index=2,
                    )
                )
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.ICON,
                        x=bx + 20,
                        y=850,
                        width=36,
                        height=36,
                        icon_name=sub.get("icon") or "box",
                        icon_badge="circle",
                        badge_color=theme["badge_fill"],
                        icon_color=theme["title_color"],
                        fill=theme["badge_fill"],
                        stroke=theme["accent"],
                        stroke_width=1,
                        z_index=3,
                    )
                )
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=bx + 20,
                        y=896,
                        width=270,
                        height=30,
                        content=sub["title"],
                        font_size=16,
                        font_weight="bold",
                        font_color=theme["title_color"],
                        text_align="left",
                        vertical_align="middle",
                        z_index=4,
                    )
                )
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=bx + 20,
                        y=932,
                        width=270,
                        height=240,
                        content=sub.get("description") or sub.get("raw", ""),
                        font_size=13,
                        font_color=theme["body_color"],
                        text_align="left",
                        vertical_align="top",
                        z_index=4,
                    )
                )
            return elements

        # Fallback to standard vertical cards list or hero
        if "hero" in clean_layout or len(items) <= 1:
            first_icon = next((it["icon"] for it in items if it["icon"]), "zap")
            first_title = items[0]["title"] if items else title
            morph_tag = self._get_morph_id(first_title, entity_registry)

            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=315,
                    y=320,
                    width=90,
                    height=90,
                    icon_name=first_icon,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["accent"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=3,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=50,
                    y=440,
                    width=620,
                    height=180,
                    content=title,
                    font_size=38,
                    font_weight="bold",
                    font_color=theme["title_color"],
                    text_align="center",
                    vertical_align="middle",
                    z_index=2,
                )
            )

            desc_text = " ".join([it["raw"] for it in items]) if items else "Vertical Story"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.TEXT,
                    x=60,
                    y=640,
                    width=600,
                    height=200,
                    content=desc_text,
                    font_size=20,
                    font_weight="normal",
                    font_color=theme["body_color"],
                    text_align="center",
                    vertical_align="top",
                    z_index=2,
                )
            )
            return elements

        count = max(1, min(4, len(items)))
        card_w = 640
        card_x = 40
        gap = 24
        start_y = 190
        available_h = 1000
        card_h = min(220, (available_h - (gap * (count - 1))) / count)

        for i, item in enumerate(items[:count]):
            card_y = start_y + i * (card_h + gap)
            raw_title = item["title"]

            if "|" in raw_title:
                m_val, m_label = raw_title.split("|", 1)
                m_val, m_label = m_val.strip(), m_label.strip()
            else:
                m_val, m_label = None, raw_title

            morph_tag = self._get_morph_id(m_label or raw_title, entity_registry)

            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ROUNDED_RECTANGLE,
                    x=card_x,
                    y=card_y,
                    width=card_w,
                    height=card_h,
                    fill=theme["card_fill"],
                    stroke=theme["accent"] if i == 0 else theme["card_stroke"],
                    stroke_width=2,
                    radius=16,
                    morph_id=f"{morph_tag}-card",
                    z_index=2,
                )
            )

            icon_name = item.get("icon") or "zap"
            elements.append(
                ElementModel(
                    id=f"el-{uuid.uuid4().hex[:8]}",
                    type=ElementType.ICON,
                    x=card_x + 24,
                    y=card_y + (card_h - 52) / 2,
                    width=52,
                    height=52,
                    icon_name=icon_name,
                    icon_badge="circle",
                    badge_color=theme["badge_fill"],
                    icon_color=theme["accent"],
                    fill=theme["badge_fill"],
                    stroke=theme["accent"],
                    stroke_width=2,
                    morph_id=f"{morph_tag}-icon",
                    z_index=3,
                )
            )

            if m_val:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=card_x + 92,
                        y=card_y + 16,
                        width=card_w - 110,
                        height=44,
                        content=f"{m_val} — {m_label}",
                        font_size=22,
                        font_weight="bold",
                        font_color=theme["accent"],
                        text_align="left",
                        vertical_align="middle",
                        morph_id=f"{morph_tag}-title",
                        z_index=4,
                    )
                )
            else:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=card_x + 92,
                        y=card_y + 16,
                        width=card_w - 110,
                        height=44,
                        content=raw_title,
                        font_size=20,
                        font_weight="bold",
                        font_color=theme["title_color"],
                        text_align="left",
                        vertical_align="middle",
                        morph_id=f"{morph_tag}-title",
                        z_index=4,
                    )
                )

            desc = item.get("description") or item.get("raw", "")
            if desc:
                elements.append(
                    ElementModel(
                        id=f"el-{uuid.uuid4().hex[:8]}",
                        type=ElementType.TEXT,
                        x=card_x + 92,
                        y=card_y + 64,
                        width=card_w - 110,
                        height=card_h - 76,
                        content=desc,
                        font_size=15,
                        font_weight="normal",
                        font_color=theme["body_color"],
                        text_align="left",
                        vertical_align="top",
                        z_index=4,
                    )
                )

            if "flow" in clean_layout or "process" in clean_layout:
                if i < count - 1:
                    elements.append(
                        ElementModel(
                            id=f"el-{uuid.uuid4().hex[:8]}",
                            type=ElementType.ARROW,
                            x1=c_w / 2,
                            y1=card_y + card_h + 3,
                            x2=c_w / 2,
                            y2=card_y + card_h + gap - 3,
                            stroke=theme["accent"],
                            stroke_width=3,
                            arrow_head=ArrowHead.END,
                            z_index=5,
                        )
                    )

        return elements


slide_compiler = SlideCompiler()

