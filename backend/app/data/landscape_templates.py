"""Reusable 16:9 scenes built from editable elements and Morph transitions."""


def label(key, value, x, y, w, h, size, color, *, bold=False, align="left"):
    return {"id": key, "morph_id": key, "type": "text", "content": value,
            "x": x, "y": y, "width": w, "height": h, "font_size": size,
            "font_color": color, "font_weight": "bold" if bold else "normal",
            "text_align": align, "vertical_align": "middle", "fill": "transparent",
            "stroke": "transparent", "z_index": 3}


def shape(key, x, y, w, h, fill, stroke="transparent", *, kind="rounded_rectangle", z=1):
    return {"id": key, "morph_id": key, "type": kind, "x": x, "y": y,
            "width": w, "height": h, "fill": fill, "stroke": stroke,
            "stroke_width": 2, "radius": 22, "z_index": z}


def make_template(key, name, description, category, background, frames):
    slides = [{"id": f"{key}-{i + 1}", "title": title, "background": background,
               "transition_type": "morph" if i < len(frames) - 1 else "none",
               "transition_duration": 0.9, "slide_duration": 3.5, "elements": elements}
              for i, (title, elements) in enumerate(frames)]
    return {"id": key, "name": name, "description": description, "category": category,
            "aspect_ratio": "16:9", "is_builtin": True, "slide_count": len(slides), "slides": slides}


def heading(tag, title, subtitle, accent, ink, muted):
    return [label("tag", tag, 80, 55, 800, 30, 15, accent, bold=True),
            label("title", title, 76, 98, 1100, 70, 45, ink, bold=True),
            label("subtitle", subtitle, 80, 172, 1000, 38, 20, muted)]


def roadmap():
    frames = []
    titles = ["Discover", "Design", "Launch"]
    descriptions = ["Understand the opportunity", "Shape the right solution", "Deliver and learn"]
    for active in range(3):
        els = heading("THE ROADMAP", "From idea to impact", "A clear path, one milestone at a time.", "#67e8f9", "#f8fafc", "#a8bad3")
        els.append(shape("track", 165, 356, 950, 6, "#29445b", kind="rectangle"))
        els.append(shape("progress", 165, 356, 70 + active * 440, 6, "#22d3ee", kind="rectangle", z=2))
        for i, (title, desc) in enumerate(zip(titles, descriptions)):
            x = 100 + i * 440
            on = i == active
            els += [shape(f"node-{i}", x + 40, 321, 76, 76, "#22d3ee" if on else "#17344a", "#67e8f9", kind="ellipse", z=2),
                    label(f"number-{i}", f"0{i+1}", x + 40, 321, 76, 76, 22, "#07212c" if on else "#a5f3fc", bold=True, align="center"),
                    label(f"name-{i}", title, x, 425, 300, 42, 27, "#ffffff" if on else "#94a3b8", bold=True),
                    label(f"desc-{i}", desc, x, 475, 300, 55, 18, "#b4c9da")]
        frames.append((f"Milestone {active + 1}: {titles[active]}", els))
    return make_template("tpl-landscape-roadmap", "Milestone Roadmap", "Three milestones come into focus as the progress line advances.", "timeline", "#071827", frames)


def comparison():
    frames = []
    for active in range(3):
        els = heading("THE COMPARISON", "See the difference", "Replace these examples with the options you want to compare.", "#a78bfa", "#f8fafc", "#aeb9d1")
        for i, (title, detail, color) in enumerate([("BEFORE", "Describe the challenge\nor current approach.", "#fb7185"), ("AFTER", "Show the improvement\nor new approach.", "#2dd4bf")]):
            on = active == i + 1
            x = 80 + i * 570
            els += [shape(f"panel-{i}", x, 255 - (12 if on else 0), 540, 300, "#202039" if i == 0 else "#102f35", color if on else "#344155"),
                    label(f"panel-tag-{i}", title, x + 32, 283 - (12 if on else 0), 460, 36, 17, color, bold=True),
                    label(f"panel-copy-{i}", detail, x + 32, 345 - (12 if on else 0), 470, 120, 30, "#ffffff", bold=True),
                    shape(f"panel-line-{i}", x + 32, 505 - (12 if on else 0), 180 if on else 70, 5, color, kind="rectangle", z=2)]
        els.append(label("vs", "VS", 605, 365, 70, 50, 18, "#d4c9ff", bold=True, align="center"))
        frames.append((['Overview', 'Before', 'After'][active], els))
    return make_template("tpl-landscape-comparison", "Before & After", "A split-screen comparison that shifts emphasis from challenge to solution.", "focus", "#101426", frames)


def metrics():
    frames = []
    for active in range(3):
        els = heading("THE IMPACT", "Make the result visible", "Use three figures to tell a stronger story.", "#fb923c", "#172033", "#617089")
        for i, (value, title, copy, color) in enumerate([("68%", "Growth", "Your key result", "#f97316"), ("2.4×", "Speed", "A meaningful change", "#6366f1"), ("12K", "Reach", "The people affected", "#0d9488")]):
            x = 80 + i * 380
            on = i == active
            els += [shape(f"metric-card-{i}", x, 270 - (16 if on else 0), 350, 290, "#ffffff", color if on else "#dbe3ee"),
                    shape(f"metric-accent-{i}", x + 28, 300 - (16 if on else 0), 70 if on else 35, 6, color, kind="rectangle", z=2),
                    label(f"metric-value-{i}", value, x + 28, 333 - (16 if on else 0), 285, 90, 58, color, bold=True),
                    label(f"metric-title-{i}", title, x + 28, 435 - (16 if on else 0), 285, 38, 23, "#172033", bold=True),
                    label(f"metric-copy-{i}", copy, x + 28, 482 - (16 if on else 0), 285, 36, 17, "#617089")]
        frames.append((f"Metric {active + 1}: {titlesafe(active)}", els))
    return make_template("tpl-landscape-metrics", "Impact Metrics", "Three editable metric cards rise into focus in sequence.", "focus", "#f3f6fb", frames)


def titlesafe(index):
    return ("Growth", "Speed", "Reach")[index]


def flow():
    frames = []
    for active in range(3):
        els = heading("THE SYSTEM", "How the pieces connect", "Follow the flow from input to outcome.", "#7dd3fc", "#f8fafc", "#a7bdd0")
        for i, (title, copy) in enumerate([("INPUT", "Start with the\nraw ingredients"), ("PROCESS", "Transform them\ninto value"), ("OUTCOME", "Deliver a clear\nresult")]):
            x = 80 + i * 400
            on = i == active
            els += [shape(f"flow-card-{i}", x, 280, 320, 260, "#11364c" if on else "#102637", "#38bdf8" if on else "#315063"),
                    label(f"flow-number-{i}", f"0{i+1}", x + 25, 305, 70, 35, 16, "#7dd3fc", bold=True),
                    label(f"flow-title-{i}", title, x + 25, 350, 270, 45, 26, "#ffffff", bold=True),
                    label(f"flow-copy-{i}", copy, x + 25, 410, 270, 75, 20, "#b3c7d5")]
            if i < 2:
                els.append(label(f"flow-arrow-{i}", "→", x + 325, 355, 68, 70, 42, "#38bdf8" if active > i else "#4b6476", bold=True, align="center"))
        frames.append((f"Flow: {['Input', 'Process', 'Outcome'][active]}", els))
    return make_template("tpl-landscape-flow", "System Flow", "A three-part system lights up from input through process to outcome.", "architecture", "#071b2a", frames)


def spotlight():
    frames = []
    for active in range(3):
        els = heading("THE BIG IDEA", "One idea, three perspectives", "Guide attention through the points that matter most.", "#c4b5fd", "#ffffff", "#c5bddb")
        for i, (title, copy, color) in enumerate([("01 / WHY", "Explain why this\nmatters now.", "#c4b5fd"), ("02 / HOW", "Make the core\nidea tangible.", "#f9a8d4"), ("03 / NEXT", "Give your audience\na clear next step.", "#a5f3fc")]):
            x = 80 + i * 380
            on = i == active
            els += [shape(f"spot-card-{i}", x, 267 - (16 if on else 0), 350, 300, "#332c52" if on else "#211d35", color if on else "#49415f"),
                    label(f"spot-tag-{i}", title, x + 28, 303 - (16 if on else 0), 290, 35, 16, color, bold=True),
                    label(f"spot-copy-{i}", copy, x + 28, 367 - (16 if on else 0), 295, 110, 29, "#ffffff" if on else "#bdb5cd", bold=True),
                    shape(f"spot-rule-{i}", x + 28, 510 - (16 if on else 0), 200 if on else 50, 5, color, kind="rectangle", z=2)]
        frames.append((f"Perspective {active + 1}", els))
    return make_template("tpl-landscape-spotlight", "Three-Part Spotlight", "Three editorial cards take turns in the spotlight, ideal for a concept or takeaway.", "cinematic", "#171426", frames)


LANDSCAPE_TEMPLATES = [roadmap(), comparison(), metrics(), flow(), spotlight()]
