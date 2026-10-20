/**
 * Motion Components Catalog - Unified HTML + CSS Motion Engine
 * Pure custom variables only, no forced default fields.
 */

export const MOTION_ACTION_CATEGORIES = [
  { id: 'all', label: 'All Motion Templates' },
  { id: 'cards', label: 'HUD & Feature Cards' },
  { id: 'metrics', label: 'Metrics & Counters' },
  { id: 'ambient', label: 'Ambient Backgrounds' },
  { id: 'clash', label: 'Versus & Comparison' },
  { id: 'badges', label: 'Pills & Badges' },
  { id: 'general', label: 'General' },
];

export const BUILTIN_STARTER_TEMPLATES = [
  {
    id: 'mot-cyber-hud-card',
    name: 'Cyberpunk HUD Card',
    description: 'Futuristic tech card with corner brackets, breathing neon aura, and dynamic scanning laser line.',
    category: 'cards',
    width: 420,
    height: 220,
    is_builtin: true,
    custom_vars: {
      tag: 'SECURITY // LVL 4',
      heading: 'Quantum Synapse Mesh',
      description: 'Real-time biometric validation and deterministic state execution across edge nodes',
      accent_color: '#00f2fe',
      card_bg: '#070f1e',
      text_color: '#ffffff',
    },
    code: `<style>
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
    line-height: 1.4;
  }
  .hud-scan {
    position: absolute;
    bottom: 0;
    left: -100%;
    width: 60%;
    height: 2px;
    background: linear-gradient(90deg, transparent, {{accent_color}}, transparent);
    animation: hudScanLine 2.8s linear infinite;
  }
  @keyframes hudGlowPulse {
    0% { transform: scale(0.9); opacity: 0.2; }
    100% { transform: scale(1.3); opacity: 0.45; }
  }
  @keyframes hudBlink {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.3; transform: scale(0.85); }
  }
  @keyframes hudScanLine {
    0% { left: -60%; }
    100% { left: 140%; }
  }
</style>

<div class="hud-container">
  <div class="hud-corners"></div>
  <div class="hud-glow"></div>
  <div class="hud-header">
    <span class="hud-tag">{{tag}}</span>
    <span class="hud-status"></span>
  </div>
  <div>
    <h3 class="hud-heading">{{heading}}</h3>
    <p class="hud-desc">{{description}}</p>
  </div>
  <div class="hud-scan"></div>
</div>`,
  },
  {
    id: 'mot-neon-metric-counter',
    name: 'Neon Metric Counter',
    description: 'High-visibility KPI ticker with live pulsating neon badge, trend pill, and numeric counter.',
    category: 'metrics',
    width: 380,
    height: 190,
    is_builtin: true,
    custom_vars: {
      metric_label: 'CLUSTER THROUGHPUT',
      metric_value: '2.4M',
      unit_suffix: 'req/s',
      trend_badge: '+340% YoY',
      accent_color: '#10b981',
      box_bg: '#061712',
      text_color: '#ffffff',
    },
    code: `<style>
  .metric-card {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 22px;
    box-sizing: border-box;
    background: {{box_bg}};
    border: 1.5px solid {{accent_color}}40;
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }
  .metric-glow {
    position: absolute;
    bottom: -40px;
    left: -40px;
    width: 120px;
    height: 120px;
    background: {{accent_color}};
    filter: blur(50px);
    opacity: 0.3;
  }
  .metric-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .metric-title {
    font-size: 10.5px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: {{accent_color}};
    text-transform: uppercase;
  }
  .metric-trend {
    font-size: 11px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 20px;
    background: {{accent_color}}20;
    color: {{accent_color}};
    border: 1px solid {{accent_color}}60;
  }
  .metric-value-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 8px 0;
  }
  .metric-val {
    font-size: 46px;
    font-weight: 900;
    color: {{text_color}};
    line-height: 1;
    letter-spacing: -0.03em;
  }
  .metric-unit {
    font-size: 14px;
    font-weight: 700;
    color: {{accent_color}};
    opacity: 0.9;
  }
  .metric-bar-bg {
    width: 100%;
    height: 5px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
  }
  .metric-bar-fill {
    width: 82%;
    height: 100%;
    background: {{accent_color}};
    border-radius: 4px;
    animation: barShimmer 2.2s ease-in-out infinite alternate;
  }
  @keyframes barShimmer {
    0% { width: 45%; }
    100% { width: 92%; }
  }
</style>

<div class="metric-card">
  <div class="metric-glow"></div>
  <div class="metric-top">
    <span class="metric-title">{{metric_label}}</span>
    <span class="metric-trend">{{trend_badge}}</span>
  </div>
  <div class="metric-value-row">
    <span class="metric-val">{{metric_value}}</span>
    <span class="metric-unit">{{unit_suffix}}</span>
  </div>
  <div class="metric-bar-bg">
    <div class="metric-bar-fill"></div>
  </div>
</div>`,
  },
  {
    id: 'mot-kinetic-versus-clash',
    name: 'Kinetic Versus Clash',
    description: 'Split clash card contrasting legacy monolith versus agentic modern architecture with central VS badge.',
    category: 'clash',
    width: 480,
    height: 210,
    is_builtin: true,
    custom_vars: {
      badge_title: 'HEAD TO HEAD',
      left_title: 'Legacy ETL',
      left_desc: 'Batch pipelines, 24h delay, brittle failure states',
      right_title: 'Agentic Mesh',
      right_desc: 'Sub-second neural workflows, auto-healing routing',
      accent_color: '#818cf8',
      card_bg: '#0a0d1e',
      text_color: '#ffffff',
    },
    code: `<style>
  .clash-card {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 18px;
    box-sizing: border-box;
    background: {{card_bg}};
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 18px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }
  .clash-badge {
    align-self: flex-start;
    font-size: 9.5px;
    font-weight: 900;
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
</div>`,
  },
  {
    id: 'mot-ambient-radar-circle',
    name: 'Ambient Radar Circle',
    description: 'Pure ambient background radar with continuous expanding concentric ripple rings. Contains no forced text.',
    category: 'ambient',
    width: 260,
    height: 260,
    is_builtin: true,
    custom_vars: {
      radar_color: '#c084fc',
      center_text: 'ONLINE',
      circle_bg: '#0f0a1c',
    },
    code: `<style>
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
  }
  @keyframes radarExpand {
    0% { transform: scale(1); opacity: 0.9; }
    100% { transform: scale(5.8); opacity: 0; }
  }
</style>

<div class="radar-wrap">
  <div class="radar-ring ring-1"></div>
  <div class="radar-ring ring-2"></div>
  <div class="radar-ring ring-3"></div>
  <div class="radar-center">{{center_text}}</div>
</div>`,
  },
  {
    id: 'mot-elastic-callout-pill',
    name: 'Elastic Callout Pill',
    description: 'High-contrast floating callout badge with glowing dot indicator and smooth spring physics.',
    category: 'badges',
    width: 320,
    height: 70,
    is_builtin: true,
    custom_vars: {
      pill_text: 'BREAKTHROUGH ACCELERATION',
      pill_color: '#f43f5e',
      pill_bg: '#18070d',
    },
    code: `<style>
  .pill-wrap {
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 10px 18px;
    border-radius: 9999px;
    background: {{pill_bg}};
    border: 1.5px solid {{pill_color}};
    box-shadow: 0 0 20px {{pill_color}}35;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    animation: pillFloat 3s ease-in-out infinite alternate;
  }
  .pill-beacon {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: {{pill_color}};
    box-shadow: 0 0 10px {{pill_color}};
    animation: beaconFlash 1.2s infinite;
  }
  .pill-title {
    font-family: sans-serif;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #ffffff;
    text-transform: uppercase;
  }
  @keyframes pillFloat {
    0% { transform: translateY(0); }
    100% { transform: translateY(-4px); }
  }
  @keyframes beaconFlash {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.85); }
  }
</style>

<div class="pill-wrap">
  <span class="pill-beacon"></span>
  <span class="pill-title">{{pill_text}}</span>
</div>`,
  },
];

// Helper to get motion components list
export function getAllMotionComponents() {
  return BUILTIN_STARTER_TEMPLATES;
}

// Alias for backward compatibility
export const MOTION_COMPONENTS = BUILTIN_STARTER_TEMPLATES;

export function getMotionTemplateById(id) {
  return BUILTIN_STARTER_TEMPLATES.find((t) => t.id === id) || BUILTIN_STARTER_TEMPLATES[0];
}
