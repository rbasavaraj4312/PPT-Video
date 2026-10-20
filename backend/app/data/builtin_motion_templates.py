"""
Curated Built-in Motion Templates for the Unified Motion Engine.
Each template contains full HTML + CSS in one container and custom variables only.
"""

BUILTIN_MOTION_TEMPLATES = [
    {
        "id": "mot-cyber-hud-card",
        "name": "Cyberpunk HUD Card",
        "description": "Futuristic tech card with corner brackets, breathing neon aura, and dynamic scanning laser line.",
        "category": "cards",
        "width": 420,
        "height": 220,
        "is_builtin": True,
        "custom_vars": {
            "tag": "SECURITY // LVL 4",
            "heading": "Quantum Synapse Mesh",
            "description": "Real-time biometric validation and deterministic state execution across edge nodes",
            "accent_color": "#00f2fe",
            "card_bg": "#070f1e",
            "text_color": "#ffffff"
        },
        "code": """<style>
  .hud-container {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 22px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    background: {{card_bg}};
    border: 1px solid {{accent_color}}40;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }
  .hud-glow {
    position: absolute;
    top: -30px;
    right: -30px;
    width: 100px;
    height: 100px;
    background: {{accent_color}};
    filter: blur(40px);
    opacity: 0.35;
    animation: hudGlowPulse 3s ease-in-out infinite alternate;
  }
  .hud-corners::before, .hud-corners::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    border-color: {{accent_color}};
  }
  .hud-corners::before {
    top: 8px; left: 8px;
    border-top: 2px solid; border-left: 2px solid;
  }
  .hud-corners::after {
    bottom: 8px; right: 8px;
    border-bottom: 2px solid; border-right: 2px solid;
  }
  .hud-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 2;
  }
  .hud-tag {
    font-family: monospace;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.15em;
    padding: 3px 8px;
    border-radius: 4px;
    background: {{accent_color}}18;
    color: {{accent_color}};
    border: 1px solid {{accent_color}}60;
  }
  .hud-status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: {{accent_color}};
    box-shadow: 0 0 10px {{accent_color}};
    animation: hudBlink 1.4s infinite;
  }
  .hud-heading {
    font-size: 21px;
    font-weight: 900;
    color: {{text_color}};
    margin: 8px 0 4px 0;
    z-index: 2;
    letter-spacing: -0.02em;
    line-height: 1.2;
  }
  .hud-desc {
    font-size: 11px;
    color: {{text_color}};
    opacity: 0.75;
    margin: 0;
    z-index: 2;
    line-height: 1.45;
  }
  .hud-scanner {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, {{accent_color}}, transparent);
    animation: hudScan 2.4s ease-in-out infinite;
  }
  @keyframes hudGlowPulse {
    0% { transform: scale(1); opacity: 0.25; }
    100% { transform: scale(1.5); opacity: 0.5; }
  }
  @keyframes hudBlink {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
  }
  @keyframes hudScan {
    0% { transform: translateY(0); opacity: 0; }
    50% { opacity: 1; }
    100% { transform: translateY(-220px); opacity: 0; }
  }
</style>

<div class="hud-container">
  <div class="hud-glow"></div>
  <div class="hud-corners"></div>
  <div class="hud-header">
    <span class="hud-tag">{{tag}}</span>
    <span class="hud-status"></span>
  </div>
  <div>
    <h3 class="hud-heading">{{heading}}</h3>
    <p class="hud-desc">{{description}}</p>
  </div>
  <div class="hud-scanner"></div>
</div>"""
    },
    {
        "id": "mot-neon-metric-counter",
        "name": "Neon Metric Counter",
        "description": "High-impact stat counter with glowing pulse numbers and animated equalizer progress fill.",
        "category": "metrics",
        "width": 380,
        "height": 200,
        "is_builtin": True,
        "custom_vars": {
            "metric_value": "99.98",
            "metric_unit": "%",
            "metric_title": "Global Mesh Availability",
            "badge_text": "▲ GUARANTEED SLA",
            "accent_color": "#10b981",
            "card_bg": "#041610",
            "text_color": "#ffffff"
        },
        "code": """<style>
  .metric-card {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    background: {{card_bg}};
    border: 1.5px solid {{accent_color}}50;
    border-radius: 16px;
    box-shadow: 0 0 24px {{accent_color}}20;
    overflow: hidden;
  }
  .metric-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .metric-badge {
    font-family: monospace;
    font-size: 10px;
    font-weight: 800;
    background: {{accent_color}}20;
    color: {{accent_color}};
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid {{accent_color}}40;
    letter-spacing: 0.05em;
  }
  .metric-display {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin: 4px 0;
  }
  .metric-number {
    font-family: monospace;
    font-size: 46px;
    font-weight: 900;
    color: {{text_color}};
    line-height: 1;
    text-shadow: 0 0 16px {{accent_color}}80;
    animation: metricPulse 2.5s ease-in-out infinite alternate;
  }
  .metric-unit {
    font-family: monospace;
    font-size: 20px;
    font-weight: 800;
    color: {{accent_color}};
  }
  .metric-bar-bg {
    width: 100%;
    height: 5px;
    background: {{accent_color}}25;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 6px;
  }
  .metric-bar-fill {
    width: 85%;
    height: 100%;
    background: {{accent_color}};
    box-shadow: 0 0 8px {{accent_color}};
    animation: barPulse 2.2s ease-in-out infinite alternate;
  }
  .metric-title {
    font-size: 12px;
    font-weight: 700;
    color: {{text_color}};
    opacity: 0.85;
  }
  @keyframes metricPulse {
    0% { transform: scale(1); }
    100% { transform: scale(1.03); }
  }
  @keyframes barPulse {
    0% { width: 65%; }
    100% { width: 95%; }
  }
</style>

<div class="metric-card">
  <div class="metric-top">
    <span class="metric-badge">{{badge_text}}</span>
  </div>
  <div class="metric-display">
    <span class="metric-number">{{metric_value}}</span>
    <span class="metric-unit">{{metric_unit}}</span>
  </div>
  <div>
    <div class="metric-bar-bg">
      <div class="metric-bar-fill"></div>
    </div>
    <span class="metric-title">{{metric_title}}</span>
  </div>
</div>"""
    },
    {
        "id": "mot-kinetic-versus-clash",
        "name": "Kinetic Versus Clash",
        "description": "Side-by-side comparison showdown with clashing gradient columns and central versus divider.",
        "category": "clash",
        "width": 560,
        "height": 240,
        "is_builtin": True,
        "custom_vars": {
            "badge_title": "HEAD-TO-HEAD COMPARISON",
            "left_title": "Legacy Monolith",
            "left_desc": "48h batch sync & brittle schemas requiring constant oncall triage",
            "right_title": "Agentic Mesh",
            "right_desc": "Real-time streaming vectors & self-healing typed reflection loops",
            "accent_color": "#6366f1",
            "card_bg": "#0c0d1e",
            "text_color": "#ffffff"
        },
        "code": """<style>
  .clash-card {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 16px;
    box-sizing: border-box;
    background: {{card_bg}};
    border: 1px solid {{accent_color}}40;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }
  .clash-badge {
    align-self: center;
    font-family: monospace;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: {{accent_color}};
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid {{accent_color}}40;
    background: {{accent_color}}15;
  }
  .clash-cols {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 12px;
    align-items: center;
    margin-top: 8px;
  }
  .clash-box {
    padding: 14px;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .clash-left {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  .clash-right {
    background: rgba(99, 102, 241, 0.12);
    border: 1.5px solid {{accent_color}};
    box-shadow: 0 0 16px rgba(99, 102, 241, 0.2);
  }
  .clash-vs {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: {{accent_color}};
    color: #ffffff;
    font-size: 10px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 10px {{accent_color}};
  }
  .clash-title {
    font-size: 13px;
    font-weight: 800;
    color: {{text_color}};
    margin: 0;
  }
  .clash-desc {
    font-size: 10.5px;
    color: {{text_color}};
    opacity: 0.75;
    margin: 0;
    line-height: 1.35;
  }
</style>

<div class="clash-card">
  <span class="clash-badge">{{badge_title}}</span>
  <div class="clash-cols">
    <div class="clash-box clash-left">
      <h4 class="clash-title" style="color: #f87171;">{{left_title}}</h4>
      <p class="clash-desc">{{left_desc}}</p>
    </div>
    <div class="clash-vs">VS</div>
    <div class="clash-box clash-right">
      <h4 class="clash-title" style="color: {{accent_color}};">{{right_title}}</h4>
      <p class="clash-desc">{{right_desc}}</p>
    </div>
  </div>
</div>"""
    },
    {
        "id": "mot-ambient-radar-circle",
        "name": "Ambient Radar Circle",
        "description": "Pure ambient background radar with continuous expanding concentric ripple rings. Contains no forced text.",
        "category": "ambient",
        "width": 260,
        "height": 260,
        "is_builtin": True,
        "custom_vars": {
            "radar_color": "#c084fc",
            "center_text": "ONLINE",
            "circle_bg": "#0f0a1c"
        },
        "code": """<style>
  .radar-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: {{circle_bg}};
    border: 1.5px solid {{radar_color}}40;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 0 24px {{radar_color}}25;
  }
  .radar-ring {
    position: absolute;
    border-radius: 50%;
    border: 1.5px solid {{radar_color}};
    animation: radarExpand 2.8s cubic-bezier(0.1, 0.8, 0.3, 1) infinite;
  }
  .ring-1 { width: 40px; height: 40px; }
  .ring-2 { width: 40px; height: 40px; animation-delay: 0.9s; }
  .ring-3 { width: 40px; height: 40px; animation-delay: 1.8s; }
  .radar-center {
    position: relative;
    z-index: 5;
    padding: 4px 10px;
    border-radius: 12px;
    background: {{radar_color}}25;
    border: 1px solid {{radar_color}};
    color: {{radar_color}};
    font-family: monospace;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.1em;
    box-shadow: 0 0 12px {{radar_color}}60;
  }
  @keyframes radarExpand {
    0% { width: 20px; height: 20px; opacity: 1; transform: scale(1); }
    100% { width: 240px; height: 240px; opacity: 0; transform: scale(1.1); }
  }
</style>

<div class="radar-wrap">
  <div class="radar-ring ring-1"></div>
  <div class="radar-ring ring-2"></div>
  <div class="radar-ring ring-3"></div>
  <div class="radar-center">{{center_text}}</div>
</div>"""
    },
    {
        "id": "mot-elastic-callout-pill",
        "name": "Elastic Callout Pill",
        "description": "High-energy bouncy stage pill with glowing spring aura and eye-catching tags.",
        "category": "badges",
        "width": 400,
        "height": 180,
        "is_builtin": True,
        "custom_vars": {
            "pill_badge": "⚡ 10X VELOCITY",
            "title": "On-Device Neural Quantization",
            "subtitle": "4-bit SLMs running on mobile NPUs with zero cloud API latency",
            "accent_color": "#f43f5e",
            "card_bg": "#140810",
            "text_color": "#ffffff"
        },
        "code": """<style>
  .pill-card {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: {{card_bg}};
    border: 1.5px solid {{accent_color}}50;
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 0 20px {{accent_color}}20;
    animation: pillBounce 2.8s ease-in-out infinite alternate;
  }
  .pill-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .pill-badge {
    font-size: 11px;
    font-weight: 800;
    color: {{accent_color}};
    background: {{accent_color}}18;
    padding: 3px 10px;
    border-radius: 12px;
    border: 1px solid {{accent_color}}50;
    letter-spacing: 0.05em;
  }
  .pill-title {
    font-size: 18px;
    font-weight: 900;
    color: {{text_color}};
    margin: 6px 0 2px 0;
    line-height: 1.25;
  }
  .pill-sub {
    font-size: 11px;
    color: {{text_color}};
    opacity: 0.75;
    margin: 0;
    line-height: 1.4;
  }
  @keyframes pillBounce {
    0% { transform: translateY(0); }
    100% { transform: translateY(-8px); }
  }
</style>

<div class="pill-card">
  <div class="pill-header">
    <span class="pill-badge">{{pill_badge}}</span>
  </div>
  <div>
    <h3 class="pill-title">{{title}}</h3>
    <p class="pill-sub">{{subtitle}}</p>
  </div>
</div>"""
    }
]
