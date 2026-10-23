from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field, model_validator, ConfigDict


class ElementType(str, Enum):
    TEXT = "text"
    RECTANGLE = "rectangle"
    ROUNDED_RECTANGLE = "rounded_rectangle"
    ELLIPSE = "ellipse"
    LINE = "line"
    ARROW = "arrow"
    ICON = "icon"
    MOTION_COMPONENT = "motion_component"
    IMAGE = "image"


class MotionAction(str, Enum):
    JUMPING = "jumping"
    MOVING = "moving"
    SLIDING = "sliding"
    COUNTING = "counting"
    PULSING = "pulsing"


class MotionComponentData(BaseModel):
    model_config = ConfigDict(extra="allow")
    component_id: str = "step-badge-jump"
    action_type: str = "jumping"  # jumping | moving | sliding | counting | pulsing
    title: str = ""
    subtitle: str = ""
    tag: Optional[str] = None
    icon: Optional[str] = None
    value_start: float = 0.0
    value_end: float = 0.0
    suffix: str = ""
    prefix: str = ""
    duration: float = 2.0
    speed: str = "normal"  # slow | normal | fast
    loop: bool = True
    spring_tension: str = "bouncy"  # bouncy | smooth | snappy
    accent_color: str = "#38bdf8"
    card_color: str = "#0f172a"
    text_color: str = "#ffffff"
    glow_color: Optional[str] = None
    items: Optional[List[str]] = None
    left_title: Optional[str] = None
    left_desc: Optional[str] = None
    right_title: Optional[str] = None
    right_desc: Optional[str] = None


class ArrowHead(str, Enum):
    NONE = "none"
    START = "start"
    END = "end"
    BOTH = "both"


class StrokeStyle(str, Enum):
    SOLID = "solid"
    DASHED = "dashed"
    DOTTED = "dotted"


class ImageCrop(BaseModel):
    x: float = Field(default=0, ge=0, le=1, allow_inf_nan=False)
    y: float = Field(default=0, ge=0, le=1, allow_inf_nan=False)
    width: float = Field(default=1, ge=.02, le=1, allow_inf_nan=False)
    height: float = Field(default=1, ge=.02, le=1, allow_inf_nan=False)

    @model_validator(mode="after")
    def inside_image(self):
        if self.x + self.width > 1.000001 or self.y + self.height > 1.000001:
            raise ValueError("Crop must stay inside the image")
        return self


class NarrationReveal(BaseModel):
    effect: str = Field(default='fade', pattern=r'^(appear|fade)$')
    word_index: int = Field(ge=0, le=5999)
    word_text: str = Field(min_length=1, max_length=12000)
    script_hash: str = Field(pattern=r'^[0-9a-f]{8}$')
    token_sequence_hash: str = Field(pattern=r'^[0-9a-f]{8}$')
    offset_ms: int = Field(default=0, ge=-500, le=500)
    duration_ms: int = Field(default=200, ge=100, le=1000)


class ElementModel(BaseModel):
    id: str
    type: ElementType
    # Position and sizing for 2D shapes and text boxes (in 1280x720 canvas coordinate space)
    x: float = 0.0
    y: float = 0.0
    width: float = 120.0
    height: float = 80.0
    rotation: float = 0.0  # degrees
    visual_scale: float = Field(default=1.0, gt=0, allow_inf_nan=False)

    # Endpoints for lines and arrows
    x1: Optional[float] = None
    y1: Optional[float] = None
    x2: Optional[float] = None
    y2: Optional[float] = None
    arrow_head: ArrowHead = ArrowHead.END

    # Colors and strokes
    fill: Optional[str] = "#3b82f6"  # Hex color, None or 'transparent' for no fill
    fill_opacity: float = 1.0
    stroke: Optional[str] = "#1e293b"  # Hex color for border/line
    stroke_width: float = 2.0
    stroke_style: StrokeStyle = StrokeStyle.SOLID
    stroke_opacity: float = 1.0
    radius: float = 12.0  # Corner radius for rounded rectangle

    # Text content & typography (for text elements or labeled shapes)
    content: str = ""
    font_size: float = 24.0
    font_family: str = "Inter, sans-serif"
    font_weight: str = "normal"  # 'normal' | 'bold'
    font_style: str = "normal"  # 'normal' | 'italic'
    font_color: str = "#1e293b"
    text_align: str = "left"  # 'left' | 'center' | 'right'
    vertical_align: str = "middle"  # 'top' | 'middle' | 'bottom'

    # Icon properties (for ElementType.ICON)
    icon_name: Optional[str] = None
    icon_badge: str = "none"  # 'none' | 'rounded' | 'circle'
    badge_color: Optional[str] = None
    icon_color: Optional[str] = None

    # Z-order / ordering
    z_index: int = 0

    # Cross-slide morph pairing & visual opacity
    morph_id: Optional[str] = None
    opacity: float = 1.0
    group_id: Optional[str] = None
    reveal: Optional[NarrationReveal] = None

    # Motion Component Data (for ElementType.MOTION_COMPONENT)
    motion_data: Optional[MotionComponentData] = None
    image_src: Optional[str] = Field(default=None, max_length=14_000_000, pattern=r"^data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$")
    image_name: str = "Image"
    image_width: int = Field(default=1, ge=1, le=16384)
    image_height: int = Field(default=1, ge=1, le=16384)
    image_crop: ImageCrop = Field(default_factory=ImageCrop)
    aspect_locked: bool = True
    flip_x: bool = False
    flip_y: bool = False
    image_brightness: float = Field(default=100, ge=0, le=200, allow_inf_nan=False)
    image_contrast: float = Field(default=100, ge=0, le=200, allow_inf_nan=False)
    image_saturation: float = Field(default=100, ge=0, le=200, allow_inf_nan=False)



    @model_validator(mode="before")
    @classmethod
    def from_dict_flexible(cls, data: Any):
        if not isinstance(data, dict):
            return data
        d = dict(data)
        # Aliases for fill
        if "fill_color" in d and "fill" not in d:
            d["fill"] = d["fill_color"]
        # Aliases for stroke
        if "stroke_color" in d and "stroke" not in d:
            d["stroke"] = d["stroke_color"]
        # Aliases for content / text
        if "text" in d and "content" not in d:
            d["content"] = d["text"]
        elif "content" in d and "text" not in d:
            d["text"] = d["content"]
        # Aliases for font color
        if "text_color" in d and "font_color" not in d:
            d["font_color"] = d["text_color"]
        # Bold
        if "font_bold" in d and "font_weight" not in d:
            d["font_weight"] = "bold" if d["font_bold"] else "normal"
        # Italic
        if "font_italic" in d and "font_style" not in d:
            d["font_style"] = "italic" if d["font_italic"] else "normal"
        # Arrow heads
        if "arrow_head_start" in d or "arrow_head_end" in d:
            start = bool(d.get("arrow_head_start"))
            end = bool(d.get("arrow_head_end"))
            if start and end:
                d["arrow_head"] = ArrowHead.BOTH
            elif start:
                d["arrow_head"] = ArrowHead.START
            elif end:
                d["arrow_head"] = ArrowHead.END
            else:
                d["arrow_head"] = ArrowHead.NONE
        return d


class FolderModel(BaseModel):
    id: str
    name: str
    color: Optional[str] = "#3b82f6"
    parent_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CaptionModel(BaseModel):
    text: str
    startMs: float = Field(ge=0, allow_inf_nan=False)
    endMs: float = Field(ge=0, allow_inf_nan=False)
    timestampMs: Optional[float] = None
    confidence: Optional[float] = None

    @model_validator(mode="after")
    def ordered(self):
        if self.endMs < self.startMs:
            raise ValueError("Caption end must follow its start")
        return self


class CaptionStyle(BaseModel):
    enabled: bool = True
    highlight_words: bool = True
    font_size: int = Field(default=34, ge=16, le=72)
    color: str = Field(default="#ffffff", pattern=r"^#[0-9a-fA-F]{6}$")
    highlight: str = Field(default="#facc15", pattern=r"^#[0-9a-fA-F]{6}$")
    position: str = Field(default="bottom", pattern=r"^(top|bottom)$")
    words_per_phrase: int = Field(default=6, ge=2, le=12)


class NarrationModel(BaseModel):
    script: str = Field(default="", max_length=12000)
    engine: str = Field(default="omnivoice", pattern=r"^(omnivoice|pocket)$")
    voice_id: str = ""
    asset_id: Optional[str] = Field(default=None, pattern=r"^[a-f0-9]{64}$")
    duration_ms: float = Field(default=0, ge=0, le=3600000, allow_inf_nan=False)
    generated_script: str = ""
    generated_engine: str = ""
    generated_voice_id: str = ""
    fit_to_audio: bool = True
    padding_ms: int = Field(default=200, ge=0, le=5000)
    audio_start_ms: Optional[float] = Field(default=None, ge=0, allow_inf_nan=False)
    audio_end_ms: Optional[float] = Field(default=None, ge=0, allow_inf_nan=False)
    captions: List[CaptionModel] = Field(default_factory=list, max_length=6000)
    caption_style: CaptionStyle = Field(default_factory=CaptionStyle)


class SlideModel(BaseModel):
    id: str
    title: str = "Untitled Slide"
    background: str = "#ffffff"
    notes: Optional[str] = ""
    transition_type: str = "morph"  # 'morph' | 'fade' | 'none'
    transition_duration: float = 1.0  # seconds for morph/fade transition
    transition_timing: str = Field(default="auto", pattern=r"^(auto|manual)$")
    transition_offset_ms: int = Field(default=0, ge=-5000, le=5000)
    slide_duration: float = 3.0  # seconds to display slide in video
    elements: List[ElementModel] = Field(default_factory=list)
    narration: Optional[NarrationModel] = None


class PresentationModel(BaseModel):
    id: str
    title: str = "Untitled Presentation"
    aspect_ratio: str = "16:9"  # '16:9' (landscape) or '9:16' (vertical reels/shorts)
    folder_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    slides: List[SlideModel] = Field(default_factory=list)


class PresentationSummary(BaseModel):
    id: str
    title: str
    aspect_ratio: str
    slide_count: int
    folder_id: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TemplateModel(BaseModel):
    id: str
    name: str
    description: str = ""
    category: str = "general"  # 'focus' | 'timeline' | 'cinematic' | 'architecture' | 'reels' | 'general'
    aspect_ratio: str = "16:9"  # '16:9' | '9:16'
    is_builtin: bool = False
    slide_count: int = 1
    slides: List[SlideModel] = Field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TemplateSummary(BaseModel):
    id: str
    name: str
    description: str = ""
    category: str = "general"
    aspect_ratio: str = "16:9"
    is_builtin: bool = False
    slide_count: int = 1
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class MotionTemplateModel(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    name: str
    description: str = ""
    category: str = "cards"  # 'cards' | 'metrics' | 'clash' | 'ambient' | 'badges' | 'general'
    width: int = 420
    height: int = 220
    code: str = ""  # Full HTML + CSS in one single container
    custom_vars: dict = Field(default_factory=dict)  # Pure custom variables
    is_builtin: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
