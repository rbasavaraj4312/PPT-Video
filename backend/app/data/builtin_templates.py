"""Single, motion-first template designed for screen-recorded video stories."""

from typing import Any, Dict, List


def text(id: str, value: str, x: int, y: int, w: int, h: int, size: int, color: str, morph: str, *, align: str = "left", bold: bool = False, z: int = 2) -> Dict[str, Any]:
    return {"id": id, "type": "text", "content": value, "x": x, "y": y, "width": w, "height": h, "font_size": size, "font_color": color, "font_weight": "bold" if bold else "normal", "text_align": align, "vertical_align": "middle", "fill": "transparent", "stroke": "transparent", "morph_id": morph, "z_index": z}


def card(id: str, x: int, y: int, w: int, h: int, fill: str, stroke: str, morph: str, z: int = 1) -> Dict[str, Any]:
    return {"id": id, "type": "rounded_rectangle", "x": x, "y": y, "width": w, "height": h, "fill": fill, "stroke": stroke, "stroke_width": 1.5, "radius": 28, "morph_id": morph, "z_index": z}


def widget(id: str, component: str, x: int, y: int, w: int, h: int, morph: str, data: Dict[str, Any], z: int = 0) -> Dict[str, Any]:
    return {"id": id, "type": "motion_component", "x": x, "y": y, "width": w, "height": h, "fill": "transparent", "stroke": "transparent", "morph_id": morph, "z_index": z, "motion_data": {"component_id": component, "loop": True, **data}}


ACCENT = "#59e5ff"
BG = "#050916"


def scene(id: str, title: str, elements: List[Dict[str, Any]], *, duration: float = 3.2, final: bool = False) -> Dict[str, Any]:
    return {"id": id, "title": title, "background": BG, "transition_type": "none" if final else "morph", "transition_duration": 1.05, "slide_duration": duration, "elements": elements}


def motion_storyboard() -> Dict[str, Any]:
    slides = [
        scene("story-hook", "Hook", [
            widget("hook-radar", "pulsing-radar-circle", 155, 100, 410, 410, "ambient", {"accent_color": ACCENT, "card_color": "#08182e", "speed": "slow", "transparent_fill": True}),
            text("hook-tag", "MOTION STORYBOARD", 85, 80, 550, 34, 14, "#8eeeff", "tag", align="center", bold=True),
            widget("hook-headline", "kinetic-headline-slide", 65, 505, 590, 225, "headline", {"title": "Explain the idea\nlike a video.", "subtitle": "One powerful story, built in motion.", "tag": "THE 60s FORMULA", "accent_color": ACCENT, "card_color": "#071426", "text_color": "#ffffff", "speed": "normal"}, 3),
            card("hook-pill", 155, 830, 410, 56, "#0b2943", ACCENT, "pill", 2),
            text("hook-pill-text", "HOOK · BUILD · PAYOFF", 155, 830, 410, 56, 14, "#d9fbff", "pill-text", align="center", bold=True, z=3),
        ], duration=3.6),
        scene("story-problem", "Problem", [
            widget("problem-scan", "scanning-frame-box", 95, 92, 530, 300, "ambient", {"accent_color": "#fb7185", "card_color": "#180a18", "speed": "normal", "transparent_fill": True}),
            text("problem-tag", "THE PROBLEM", 85, 78, 550, 34, 14, "#fda4af", "tag", align="center", bold=True),
            text("problem-title", "Most explanations\nlose attention here.", 80, 165, 560, 135, 42, "#ffffff", "headline", align="center", bold=True),
            widget("problem-duel", "split-comparison-duel", 85, 450, 550, 250, "focus", {"left_title": "Static Slides", "left_desc": "Everything appears at once", "right_title": "Visual Story", "right_desc": "The idea unfolds with intent", "accent_color": "#fb7185", "card_color": "#150c20", "text_color": "#ffffff", "speed": "normal"}, 2),
            card("problem-pill", 155, 830, 410, 56, "#351027", "#fb7185", "pill", 2),
            text("problem-pill-text", "CREATE CURIOSITY FIRST", 155, 830, 410, 56, 14, "#ffe4e6", "pill-text", align="center", bold=True, z=3),
        ]),
        scene("story-build", "Build", [
            widget("build-frame", "glowing-neon-box", 65, 90, 590, 690, "ambient", {"accent_color": ACCENT, "card_color": "#071326", "speed": "slow", "transparent_fill": True}),
            text("build-tag", "THE BUILD", 85, 92, 550, 34, 14, "#8eeeff", "tag", align="center", bold=True),
            text("build-title", "Make the viewer\nsee the system.", 80, 150, 560, 120, 40, "#ffffff", "headline", align="center", bold=True),
            card("build-card-one", 105, 340, 510, 112, "#0c2038", "#25678a", "layer-one"),
            text("build-one-title", "01  CONTEXT", 140, 355, 430, 35, 20, "#e0f9ff", "layer-one-text", bold=True),
            text("build-one-copy", "Give the audience a reason to care.", 140, 392, 430, 32, 16, "#9eb7d4", "layer-one-copy"),
            card("build-card-two", 105, 485, 510, 112, "#142140", "#8b5cf6", "layer-two"),
            text("build-two-title", "02  MODEL", 140, 500, 430, 35, 20, "#f3e8ff", "layer-two-text", bold=True),
            text("build-two-copy", "Turn complexity into one memorable visual.", 140, 537, 430, 32, 16, "#c4b5fd", "layer-two-copy"),
            card("build-card-three", 105, 630, 510, 112, "#102b35", "#2dd4bf", "layer-three"),
            text("build-three-title", "03  PAYOFF", 140, 645, 430, 35, 20, "#d1fae5", "layer-three-text", bold=True),
            text("build-three-copy", "End with the action viewers should remember.", 140, 682, 430, 32, 16, "#99f6e4", "layer-three-copy"),
            card("build-pill", 155, 830, 410, 56, "#0b2943", ACCENT, "pill", 2),
            text("build-pill-text", "KEEP THE STORY MOVING", 155, 830, 410, 56, 14, "#d9fbff", "pill-text", align="center", bold=True, z=3),
        ], duration=4.2),
        scene("story-spotlight", "Spotlight", [
            widget("spotlight-halo", "glowing-halo-circle", 210, 105, 300, 300, "ambient", {"accent_color": "#c084fc", "card_color": "#140d2e", "speed": "normal", "transparent_fill": True}),
            text("spotlight-tag", "THE SPOTLIGHT", 85, 92, 550, 34, 14, "#d8b4fe", "tag", align="center", bold=True),
            widget("spotlight-card", "floating-feature-card", 105, 420, 510, 255, "focus", {"tag": "THE KEY MOMENT", "icon": "crosshair", "title": "Focus on one important change", "subtitle": "A moving focal card makes the viewer look exactly where the explanation needs them.", "status": "ACTIVE", "accent_color": "#c084fc", "card_color": "#15102b", "text_color": "#ffffff", "speed": "normal"}, 2),
            card("spotlight-pill", 155, 830, 410, 56, "#261543", "#c084fc", "pill", 2),
            text("spotlight-pill-text", "ONE FRAME · ONE IDEA", 155, 830, 410, 56, 14, "#f3e8ff", "pill-text", align="center", bold=True, z=3),
        ]),
        scene("story-proof", "Proof", [
            widget("proof-radar", "pulsing-flow-connector", 105, 85, 510, 150, "ambient", {"tag": "SIGNAL DETECTED", "title": "Attention follows change", "subtitle": "Motion directs the eye", "accent_color": "#22d3ee", "card_color": "#07172b", "text_color": "#ffffff", "speed": "normal"}),
            text("proof-tag", "THE PROOF", 85, 95, 550, 34, 14, "#8eeeff", "tag", align="center", bold=True),
            text("proof-title", "Show the impact\nwith a living metric.", 80, 265, 560, 105, 39, "#ffffff", "headline", align="center", bold=True),
            widget("proof-metric", "metric-number-ticker", 105, 430, 510, 225, "metric", {"value_start": 0, "value_end": 3, "suffix": " beats", "title": "The story rhythm", "subtitle": "Hook · model · payoff", "accent_color": "#22d3ee", "card_color": "#07172b", "text_color": "#ffffff", "speed": "normal"}, 2),
            widget("proof-gauge", "radial-progress-gauge", 185, 685, 350, 120, "focus", {"value_start": 0, "value_end": 100, "suffix": "%", "title": "Clarity", "subtitle": "One idea at a time", "accent_color": "#34d399", "card_color": "#092018", "text_color": "#ffffff", "speed": "normal"}, 2),
            card("proof-pill", 155, 830, 410, 56, "#0b2943", ACCENT, "pill", 2),
            text("proof-pill-text", "MAKE THE RESULT VISIBLE", 155, 830, 410, 56, 14, "#d9fbff", "pill-text", align="center", bold=True, z=3),
        ], duration=3.8),
        scene("story-payoff", "Payoff", [
            widget("payoff-beacon", "blinking-beacon-circle", 250, 105, 220, 220, "ambient", {"accent_color": "#fbbf24", "card_color": "#1a1206", "speed": "normal", "transparent_fill": True}),
            text("payoff-tag", "THE PAYOFF", 85, 90, 550, 34, 14, "#fde68a", "tag", align="center", bold=True),
            text("payoff-title", "The lesson feels\nlike it is progressing.", 70, 350, 580, 118, 40, "#ffffff", "headline", align="center", bold=True),
            widget("payoff-card", "step-badge-jump", 105, 545, 510, 180, "focus", {"tag": "FINAL TAKEAWAY", "number": "03", "title": "Motion should serve the lesson", "subtitle": "Use it to guide attention — never to distract.", "accent_color": "#fbbf24", "card_color": "#1d1508", "text_color": "#ffffff", "speed": "normal"}, 2),
            card("payoff-pill", 155, 830, 410, 56, "#3b2807", "#fbbf24", "pill", 2),
            text("payoff-pill-text", "MAKE IT MEMORABLE", 155, 830, 410, 56, 14, "#fef3c7", "pill-text", align="center", bold=True, z=3),
        ]),
        scene("story-cta", "Call to Action", [
            widget("cta-radar", "pulsing-radar-circle", 170, 70, 380, 380, "ambient", {"accent_color": "#38bdf8", "card_color": "#07152b", "speed": "slow", "transparent_fill": True}),
            text("cta-tag", "YOUR TURN", 85, 100, 550, 34, 14, "#8eeeff", "tag", align="center", bold=True),
            widget("cta-headline", "kinetic-headline-slide", 60, 425, 600, 235, "headline", {"title": "Build your next\nvideo story.", "subtitle": "Replace the placeholders, then present and record.", "tag": "READY TO CREATE", "accent_color": "#38bdf8", "card_color": "#071426", "text_color": "#ffffff", "speed": "normal"}, 3),
            card("cta-pill", 125, 790, 470, 70, "#0b2943", "#38bdf8", "pill", 2),
            text("cta-pill-text", "FOLLOW · SAVE · BUILD THE NEXT ONE", 125, 790, 470, 70, 14, "#d9fbff", "pill-text", align="center", bold=True, z=3),
        ], duration=3.8, final=True),
    ]
    return {"id": "tpl-tech-short-storyboard", "name": "High-Energy Tech — Motion Storyboard", "description": "A seven-scene vertical video template with living ambience, kinetic widgets, counters, scanning effects, and continuous Morph transitions.", "category": "reels", "aspect_ratio": "9:16", "is_builtin": True, "slide_count": len(slides), "slides": slides, "motion_style": "tech", "use_case": "shorts", "pacing": "manual", "intended_duration": "45–75 seconds"}


def landscape_lesson(template_id: str, name: str, *, tech: bool) -> Dict[str, Any]:
    accent = "#38bdf8" if tech else "#2563eb"
    surface = "#07172b" if tech else "#ffffff"
    bg = "#050916" if tech else "#f5f8ff"
    ink = "#ffffff" if tech else "#10203d"
    muted = "#a8bddb" if tech else "#52647e"
    accent_surface = "#102a45" if tech else "#e8f0ff"
    slides = [
        {"id": f"{template_id}-hook", "title": "Lesson Hook", "background": bg, "transition_type": "morph", "transition_duration": 1.1, "slide_duration": 4.0, "motion_preset": "energetic" if tech else "calm", "motion_intensity": "balanced", "beats": [], "elements": [
            widget("ambient", "pulsing-radar-circle", 880, 95, 270, 270, "ambient", {"accent_color": accent, "card_color": surface, "speed": "slow", "transparent_fill": True}),
            text("tag", "TEACHING STORY", 100, 95, 420, 32, 14, accent, "tag", bold=True),
            text("headline", "Make the hard idea\nfeel obvious.", 95, 150, 720, 150, 54, ink, "headline", bold=True),
            text("support", "Start with the outcome, then reveal the mental model.", 100, 335, 680, 48, 23, muted, "support"),
            card("pill", 100, 470, 280, 58, accent_surface, accent, "pill"), text("pill-text", "THE VIEWER'S WHY", 100, 470, 280, 58, 14, accent, "pill-text", align="center", bold=True, z=3),
        ]},
        {"id": f"{template_id}-model", "title": "Visual Model", "background": bg, "transition_type": "morph", "transition_duration": 1.1, "slide_duration": 4.2, "motion_preset": "cinematic", "motion_intensity": "balanced", "beats": [{"id": "beat-1", "label": "Frame the model", "element_ids": ["tag", "headline", "model-a"]}, {"id": "beat-2", "label": "Add the connection", "element_ids": ["model-b", "model-arrow"]}, {"id": "beat-3", "label": "Land the result", "element_ids": ["model-c", "pill", "pill-text"]}], "elements": [
            widget("ambient", "scanning-frame-box", 810, 105, 360, 410, "ambient", {"accent_color": accent, "card_color": surface, "speed": "normal", "transparent_fill": True}),
            text("tag", "THE VISUAL MODEL", 100, 82, 420, 32, 14, accent, "tag", bold=True), text("headline", "Build the explanation\none layer at a time.", 95, 125, 700, 115, 43, ink, "headline", bold=True),
            card("model-a", 100, 335, 245, 150, accent_surface, accent, "model-a"), text("model-a-copy", "01 · CONTEXT\nShow the problem", 125, 350, 195, 95, 22, ink, "model-a-copy", bold=True),
            {"id": "model-arrow", "type": "arrow", "x": 365, "y": 410, "width": 90, "height": 0, "stroke": accent, "stroke_width": 4, "arrow_head": "end", "morph_id": "model-arrow", "z_index": 2, "entrance": "draw_line"},
            card("model-b", 475, 335, 245, 150, accent_surface, accent, "model-b"), text("model-b-copy", "02 · MODEL\nShow the logic", 500, 350, 195, 95, 22, ink, "model-b-copy", bold=True),
            card("model-c", 100, 540, 620, 78, surface, accent, "model-c"), text("model-c-copy", "03 · PAYOFF  Give one action viewers can use.", 130, 540, 560, 78, 21, ink, "model-c-copy", bold=True),
            card("pill", 100, 650, 280, 54, accent_surface, accent, "pill"), text("pill-text", "REVEAL WITH INTENT", 100, 650, 280, 54, 13, accent, "pill-text", align="center", bold=True, z=3),
        ]},
        {"id": f"{template_id}-recap", "title": "Recap", "background": bg, "transition_type": "none", "transition_duration": 1, "slide_duration": 3.8, "motion_preset": "calm", "motion_intensity": "subtle", "beats": [], "elements": [
            widget("ambient", "glowing-halo-circle", 865, 155, 250, 250, "ambient", {"accent_color": accent, "card_color": surface, "speed": "normal", "transparent_fill": True}),
            text("tag", "THE TAKEAWAY", 100, 105, 420, 32, 14, accent, "tag", bold=True), text("headline", "Clarity is what\nkeeps people watching.", 95, 165, 700, 135, 50, ink, "headline", bold=True),
            widget("metric", "metric-number-ticker", 100, 390, 370, 175, "metric", {"value_start": 0, "value_end": 3, "suffix": " beats", "title": "Story rhythm", "subtitle": "Why · model · payoff", "accent_color": accent, "card_color": surface, "text_color": ink, "speed": "normal"}, 2),
            card("pill", 520, 450, 310, 58, accent_surface, accent, "pill"), text("pill-text", "READY TO PRESENT", 520, 450, 310, 58, 14, accent, "pill-text", align="center", bold=True, z=3),
        ]},
    ]
    return {"id": template_id, "name": name, "description": "A complete 16:9 lesson with guided reveals, live ambience, and Morph continuity.", "category": "cinematic", "aspect_ratio": "16:9", "is_builtin": True, "slide_count": len(slides), "slides": slides, "motion_style": "tech" if tech else "minimal", "use_case": "teaching", "pacing": "manual", "intended_duration": "8–15 minutes"}


def minimal_short() -> Dict[str, Any]:
    deck = motion_storyboard()
    deck["id"] = "tpl-minimal-short"
    deck["name"] = "Polished Minimal — 60s Explainer"
    deck["description"] = "A calm vertical teaching sequence with clean visual hierarchy and controlled ambient motion."
    deck["motion_style"] = "minimal"
    deck["intended_duration"] = "45–75 seconds"
    for slide in deck["slides"]:
        slide["motion_preset"] = "calm"
        slide["motion_intensity"] = "subtle"
        slide["transition_duration"] = 0.9
    return deck


def binary_search_template() -> Dict[str, Any]:
    slides = [
        scene("dsa-bs-intro", "Binary Search Hook", [
            widget("bs-ambient", "pulsing-radar-circle", 870, 100, 290, 290, "bs-ambient", {"accent_color": "#38bdf8", "card_color": "#07172b", "speed": "slow", "transparent_fill": True}),
            text("bs-tag", "DSA VISUAL EXPLAINER", 95, 95, 420, 32, 14, "#7dd3fc", "bs-tag", bold=True),
            text("bs-title", "Binary Search\nfinds the answer by\nthrowing half away.", 90, 150, 720, 205, 48, "#ffffff", "bs-title", bold=True),
            text("bs-sub", "Target: find 23 in a sorted array.", 95, 385, 560, 45, 22, "#a8bddb", "bs-sub"),
            card("bs-pill", 95, 490, 265, 54, "#102a45", "#38bdf8", "bs-pill"), text("bs-pill-text", "O(log n) SEARCH", 95, 490, 265, 54, 14, "#d9fbff", "bs-pill-text", align="center", bold=True, z=3),
        ], duration=3.5),
        scene("dsa-bs-window", "Binary Search Window", [
            widget("bs-scan", "scanning-frame-box", 820, 100, 355, 470, "bs-ambient", {"accent_color": "#38bdf8", "card_color": "#07172b", "speed": "normal", "transparent_fill": True}),
            text("bs-tag-2", "STEP 01 · PICK THE MIDDLE", 95, 90, 520, 32, 14, "#7dd3fc", "bs-tag", bold=True),
            text("bs-title-2", "Start with the\ncenter element.", 90, 135, 650, 110, 43, "#ffffff", "bs-title", bold=True),
            *[card(f"bs-cell-{i}", 95 + i * 112, 355, 88, 82, "#102038" if value != 23 else "#0e4c63", "#25678a" if value != 23 else "#38bdf8", f"bs-cell-{i}") for i, value in enumerate([3, 7, 12, 18, 23, 31, 42])],
            *[text(f"bs-value-{i}", str(value), 95 + i * 112, 355, 88, 82, 25, "#ffffff", f"bs-value-{i}", align="center", bold=True, z=3) for i, value in enumerate([3, 7, 12, 18, 23, 31, 42])],
            text("bs-mid", "MID", 95 + 3 * 112, 300, 88, 35, 14, "#fbbf24", "bs-marker", align="center", bold=True, z=3),
            text("bs-sub-2", "18 is smaller than 23 — discard the entire left half.", 95, 500, 650, 45, 20, "#a8bddb", "bs-sub"),
            card("bs-pill-2", 95, 600, 310, 54, "#102a45", "#38bdf8", "bs-pill"), text("bs-pill-text-2", "KEEP THE RIGHT HALF", 95, 600, 310, 54, 14, "#d9fbff", "bs-pill-text", align="center", bold=True, z=3),
        ], duration=4.0),
        scene("dsa-bs-result", "Binary Search Result", [
            widget("bs-halo", "glowing-halo-circle", 860, 150, 260, 260, "bs-ambient", {"accent_color": "#34d399", "card_color": "#081c1a", "speed": "normal", "transparent_fill": True}),
            text("bs-tag-3", "STEP 02 · SHRINK AND REPEAT", 95, 100, 520, 32, 14, "#6ee7b7", "bs-tag", bold=True),
            text("bs-title-3", "The window shrinks\nuntil the target wins.", 90, 150, 680, 120, 45, "#ffffff", "bs-title", bold=True),
            widget("bs-metric", "metric-number-ticker", 95, 370, 360, 180, "bs-metric", {"value_start": 0, "value_end": 3, "suffix": " checks", "title": "23 found", "subtitle": "Seven values, only three comparisons", "accent_color": "#34d399", "card_color": "#092018", "text_color": "#ffffff", "speed": "normal"}, 2),
            card("bs-pill-3", 500, 455, 290, 54, "#0e3029", "#34d399", "bs-pill"), text("bs-pill-text-3", "DIVIDE · COMPARE · WIN", 500, 455, 290, 54, 13, "#d1fae5", "bs-pill-text", align="center", bold=True, z=3),
        ], final=True),
    ]
    return {"id": "tpl-dsa-binary-search", "name": "DSA Motion — Binary Search", "description": "A three-scene visual walkthrough of binary search: sorted array, shrinking window, and result.", "category": "architecture", "aspect_ratio": "16:9", "is_builtin": True, "slide_count": len(slides), "slides": slides}


def stack_queue_template() -> Dict[str, Any]:
    slides = [
        scene("dsa-stack-hook", "Stack and Queue", [
            widget("sq-ambient", "pulsing-flow-connector", 780, 115, 390, 155, "sq-ambient", {"tag": "DSA CORE", "title": "Data has a direction", "subtitle": "Push/pop versus enqueue/dequeue", "accent_color": "#c084fc", "card_color": "#120d26", "text_color": "#ffffff", "speed": "normal"}),
            text("sq-tag", "STACK VS QUEUE", 95, 100, 400, 32, 14, "#d8b4fe", "sq-tag", bold=True),
            text("sq-title", "Same values.\nCompletely different flow.", 90, 155, 650, 125, 48, "#ffffff", "sq-title", bold=True),
            card("sq-pill", 95, 460, 300, 54, "#261543", "#c084fc", "sq-pill"), text("sq-pill-text", "LIFO  VS  FIFO", 95, 460, 300, 54, 14, "#f3e8ff", "sq-pill-text", align="center", bold=True, z=3),
        ], duration=3.4),
        scene("dsa-stack-flow", "Stack and Queue Flow", [
            widget("sq-frame", "glowing-neon-box", 70, 90, 1140, 520, "sq-ambient", {"accent_color": "#c084fc", "card_color": "#0c1024", "speed": "slow", "transparent_fill": True}),
            text("sq-tag-2", "WATCH THE VALUES MOVE", 95, 95, 500, 32, 14, "#d8b4fe", "sq-tag", bold=True),
            text("sq-title-2", "The operation tells the story.", 90, 145, 780, 65, 40, "#ffffff", "sq-title", bold=True),
            card("stack-panel", 120, 280, 350, 230, "#171033", "#a78bfa", "stack-panel"), text("stack-label", "STACK · LIFO", 150, 300, 290, 34, 20, "#ede9fe", "stack-label", align="center", bold=True, z=3),
            *[card(f"stack-{i}", 215, 365 - i * 44, 160, 38, "#2e1d59", "#c084fc", f"stack-{i}", 2) for i in range(3)],
            *[text(f"stack-val-{i}", value, 215, 365 - i * 44, 160, 38, 16, "#ffffff", f"stack-val-{i}", align="center", bold=True, z=3) for i, value in enumerate(["PUSH 10", "PUSH 20", "TOP 20"])],
            card("queue-panel", 710, 280, 350, 230, "#0b2631", "#22d3ee", "queue-panel"), text("queue-label", "QUEUE · FIFO", 740, 300, 290, 34, 20, "#cffafe", "queue-label", align="center", bold=True, z=3),
            *[card(f"queue-{i}", 745 + i * 95, 385, 80, 58, "#104252", "#22d3ee", f"queue-{i}", 2) for i in range(3)],
            *[text(f"queue-val-{i}", value, 745 + i * 95, 385, 80, 58, 16, "#ffffff", f"queue-val-{i}", align="center", bold=True, z=3) for i, value in enumerate(["10", "20", "30"])],
            text("queue-note", "DEQUEUE → 10", 745, 455, 270, 32, 16, "#67e8f9", "queue-note", align="center", bold=True, z=3),
            card("sq-pill-2", 440, 640, 400, 54, "#261543", "#c084fc", "sq-pill"), text("sq-pill-text-2", "FOLLOW THE ENTRY / EXIT POINT", 440, 640, 400, 54, 13, "#f3e8ff", "sq-pill-text", align="center", bold=True, z=3),
        ], final=True, duration=4.2),
    ]
    return {"id": "tpl-dsa-stack-queue", "name": "DSA Motion — Stack & Queue", "description": "An animated comparison of LIFO and FIFO with visible data flow.", "category": "architecture", "aspect_ratio": "16:9", "is_builtin": True, "slide_count": len(slides), "slides": slides}


def dsa_short_template() -> Dict[str, Any]:
    deck = motion_storyboard()
    deck["id"] = "tpl-dsa-60s-pattern"
    deck["name"] = "DSA Motion — 60s Pattern Explainer"
    deck["description"] = "A seven-scene vertical template for teaching one DSA pattern quickly: hook, model, proof, and takeaway."
    for slide in deck["slides"]:
        for element in slide["elements"]:
            if element.get("type") == "text" and "story" in (element.get("content") or "").lower():
                element["content"] = element["content"].replace("story", "pattern")
    return deck


BUILTIN_TEMPLATES: List[Dict[str, Any]] = [
    motion_storyboard(),
    binary_search_template(),
    stack_queue_template(),
    dsa_short_template(),
]
