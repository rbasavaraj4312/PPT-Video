/**
 * Master Motion Component & Recipe Registry
 * Fully parameterized with Typed Variable Schemas & Multi-dimensional Categorization.
 */

import { BlurText } from '../blocks/typography/BlurText';
import { ScrambleText } from '../blocks/typography/ScrambleText';
import { MarkerHighlight } from '@/components/remocn/marker-highlight';
import { KineticSupernovaText } from '../blocks/typography/KineticSupernovaText';
import { LiquidMorphText } from '../blocks/typography/LiquidMorphText';
import { NeonSignFlicker } from '../blocks/typography/NeonSignFlicker';
import { GlitchScrambleDecode } from '../blocks/typography/GlitchScrambleDecode';
import { PaperCutReveal } from '../blocks/typography/PaperCutReveal';
import { TypewriterSpotlight } from '../blocks/typography/TypewriterSpotlight';
import { SpotlightBg } from '../blocks/backgrounds/SpotlightBg';
import { GlowingCard } from '../blocks/surfaces/GlowingCard';
import { ShotHeroHook } from '../recipes/ShotHeroHook';
import { ShotTrendCountdown } from '../recipes/ShotTrendCountdown';
import { ShotMetricTicking } from '../recipes/ShotMetricTicking';
import { REMOCN_TYPOGRAPHY_REGISTRY } from './remocnTypographyRegistry';

export const MOTION_REGISTRY = [
  // ================= 1. HOOKS & INTROS =================
  {
    id: 'shot-hero-hook',
    name: 'Cinematic Hero Hook',
    description: 'High-impact opening scene with spotlight sweep, cyber tag, and kinetic blur headline.',
    category: 'hooks',
    aspectRatio: 'flexible',
    stylePreset: 'cyber',
    sourceLibrary: 'shotcraft',
    tags: ['hook', 'hero', 'intro', 'cinematic', 'shotcraft', 'headline'],
    component: ShotHeroHook,
    defaultDimensions: { width: 640, height: 380 },
    variableSchema: [
      { key: 'badgeText', label: 'Top Badge', type: 'text', defaultValue: '2026 ARCHITECTURE SHIFT', category: 'content' },
      { key: 'headline', label: 'Main Headline', type: 'text', defaultValue: 'Why Monolithic Pipelines Fail', category: 'content' },
      { key: 'subheadline', label: 'Sub-Headline', type: 'text', defaultValue: 'Autonomous Multi-Agent Swarms Rewrite Modern Infrastructure', category: 'content' },
      { key: 'accentColor', label: 'Accent Neon Color', type: 'color', defaultValue: '#00f2fe', category: 'style' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },

  // ================= 2. KINETIC TYPOGRAPHY =================
  {
    id: 'typo-blur-text',
    name: 'Blur-In Kinetic Headline',
    description: 'Letter & word-by-word blur, opacity, and spring glide-in (React Bits).',
    category: 'typography',
    aspectRatio: 'flexible',
    stylePreset: 'minimal',
    sourceLibrary: 'react-bits',
    tags: ['text', 'blur', 'react-bits', 'kinetic', 'title', 'headline'],
    component: BlurText,
    defaultDimensions: { width: 500, height: 120 },
    variableSchema: [
      { key: 'text', label: 'Headline Text', type: 'text', defaultValue: 'Autonomous Cognitive Architecture', category: 'content' },
      { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', category: 'style' },
      { key: 'fontSize', label: 'Font Size (px)', type: 'number', defaultValue: 38, min: 18, max: 80, category: 'style' },
      { key: 'textAlign', label: 'Alignment', type: 'select', defaultValue: 'center', options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }], category: 'style' },
      { key: 'staggerDelay', label: 'Word Stagger Delay', type: 'number', defaultValue: 3, min: 1, max: 10, category: 'timing' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },
  {
    id: 'typo-scramble-text',
    name: 'Cyber Scramble Decoder',
    description: 'Futuristic character decoding cipher that resolves deterministically (React Bits).',
    category: 'typography',
    aspectRatio: 'flexible',
    stylePreset: 'cyber',
    sourceLibrary: 'react-bits',
    tags: ['scramble', 'decoder', 'cyberpunk', 'react-bits', 'tag', 'code'],
    component: ScrambleText,
    defaultDimensions: { width: 380, height: 70 },
    variableSchema: [
      { key: 'text', label: 'Decoded Text', type: 'text', defaultValue: 'SYSTEM // ONLINE 99.9%', category: 'content' },
      { key: 'textColor', label: 'Locked Text Color', type: 'color', defaultValue: '#00f2fe', category: 'style' },
      { key: 'scrambleColor', label: 'Cipher Glitch Color', type: 'color', defaultValue: '#38bdf8', category: 'style' },
      { key: 'fontSize', label: 'Font Size (px)', type: 'number', defaultValue: 24, min: 14, max: 48, category: 'style' },
      { key: 'speed', label: 'Frames per Char', type: 'number', defaultValue: 2, min: 1, max: 8, category: 'timing' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },
  {
    id: 'typo-marker-highlight',
    name: 'Marker Highlight',
    description: 'Animated marker highlighter stroke sweeps behind key text as color transitions (Remocn).',
    category: 'typography',
    aspectRatio: 'flexible',
    stylePreset: 'minimal',
    sourceLibrary: 'remocn',
    tags: ['marker', 'highlight', 'remocn', 'typography', 'kinetic', 'underline', 'emphasis'],
    component: MarkerHighlight,
    defaultDimensions: { width: 560, height: 130 },
    variableSchema: [
      { key: 'before', label: 'Prefix Text', type: 'text', defaultValue: 'Made for ', category: 'content' },
      { key: 'highlight', label: 'Highlighted Text', type: 'text', defaultValue: 'builders', category: 'content' },
      { key: 'after', label: 'Suffix Text', type: 'text', defaultValue: '.', category: 'content' },
      { key: 'markerColor', label: 'Marker Color', type: 'color', defaultValue: '#facc15', category: 'style' },
      { key: 'baseColor', label: 'Base Text Color', type: 'color', defaultValue: '#171717', category: 'style' },
      { key: 'highlightedTextColor', label: 'Highlighted Text Color', type: 'color', defaultValue: '#171717', category: 'style' },
      { key: 'fontSize', label: 'Font Size (px)', type: 'number', defaultValue: 56, min: 20, max: 96, category: 'style' },
      { key: 'fontWeight', label: 'Font Weight', type: 'select', defaultValue: '600', options: [{ label: 'Normal (400)', value: '400' }, { label: 'Medium (500)', value: '500' }, { label: 'Semi-Bold (600)', value: '600' }, { label: 'Bold (700)', value: '700' }, { label: 'Extra Bold (800)', value: '800' }], category: 'style' },
      { key: 'speed', label: 'Speed Multiplier', type: 'number', defaultValue: 1, min: 0.2, max: 3, step: 0.1, category: 'timing' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },
  {
    id: 'typo-supernova-blast',
    name: 'Supernova Kinetic Blast',
    description: 'Motion graphics level 3D perspective slam, chromatic RGB split, 360° particle shockwave detonation, and anamorphic laser glint sweep.',
    category: 'typography',
    aspectRatio: 'flexible',
    stylePreset: 'cyber',
    sourceLibrary: 'builtin',
    tags: ['motion-graphics', '3d', 'particles', 'supernova', 'chromatic', 'kinetic', 'vfx', 'headline'],
    component: KineticSupernovaText,
    defaultDimensions: { width: 720, height: 260 },
    variableSchema: [
      { key: 'headline', label: 'Main Headline', type: 'text', defaultValue: 'BREAK THE LIMITS', category: 'content' },
      { key: 'subheadline', label: 'Sub-Headline', type: 'text', defaultValue: 'AUTONOMOUS MOTION GRAPHICS CORE', category: 'content' },
      { key: 'badgeText', label: 'Top Cyber Badge', type: 'text', defaultValue: 'HYPER-KINETIC VFX', category: 'content' },
      { key: 'primaryColor', label: 'Primary Neon Color', type: 'color', defaultValue: '#00f2fe', category: 'style' },
      { key: 'secondaryColor', label: 'Secondary Flare Color', type: 'color', defaultValue: '#f43f5e', category: 'style' },
      { key: 'accentGlow', label: 'Glow Aura Color', type: 'color', defaultValue: '#8b5cf6', category: 'style' },
      { key: 'fontSize', label: 'Headline Font Size (px)', type: 'number', defaultValue: 58, min: 24, max: 96, category: 'style' },
      { key: 'chromaticShift', label: 'RGB Split Amount (px)', type: 'number', defaultValue: 10, min: 0, max: 25, category: 'style' },
      { key: 'particleCount', label: 'Detonation Sparks Count', type: 'number', defaultValue: 32, min: 12, max: 60, category: 'style' },
      { key: 'speed', label: 'Animation Speed', type: 'number', defaultValue: 1, min: 0.5, max: 2.5, step: 0.1, category: 'timing' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },
  {
    id: 'typo-liquid-morph',
    name: 'Liquid Morph Chrome',
    description: 'Letters ripple and melt like molten liquid metal as a wave distortion passes through, then snap back into crisp shape.',
    category: 'typography',
    aspectRatio: 'flexible',
    stylePreset: 'cyber',
    sourceLibrary: 'builtin',
    tags: ['liquid', 'chrome', 'melt', 'morph', 'wave', 'metal', 'typography'],
    component: LiquidMorphText,
    defaultDimensions: { width: 680, height: 200 },
    variableSchema: [
      { key: 'text', label: 'Display Text', type: 'text', defaultValue: 'LIQUID CHROME', category: 'content' },
      { key: 'primaryColor', label: 'Base Metal Color', type: 'color', defaultValue: '#e2e8f0', category: 'style' },
      { key: 'accentColor', label: 'Liquid Glow Accent', type: 'color', defaultValue: '#38bdf8', category: 'style' },
      { key: 'highlightColor', label: 'Specular Shine Color', type: 'color', defaultValue: '#ffffff', category: 'style' },
      { key: 'fontSize', label: 'Font Size (px)', type: 'number', defaultValue: 62, min: 24, max: 96, category: 'style' },
      { key: 'meltIntensity', label: 'Melt Distortion (0-2)', type: 'number', defaultValue: 1, min: 0.2, max: 2, step: 0.1, category: 'style' },
      { key: 'waveSpeed', label: 'Wave Ripple Speed', type: 'number', defaultValue: 1, min: 0.4, max: 3, step: 0.1, category: 'timing' },
      { key: 'speed', label: 'Playback Speed', type: 'number', defaultValue: 1, min: 0.5, max: 2.5, step: 0.1, category: 'timing' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },
  {
    id: 'typo-neon-flicker',
    name: 'Neon Sign Flicker',
    description: 'Gas-discharge tube light sign that buzzes on with stuttering electric flickers, then settles into a steady glow with a faint hum pulse.',
    category: 'typography',
    aspectRatio: 'flexible',
    stylePreset: 'cyber',
    sourceLibrary: 'builtin',
    tags: ['neon', 'flicker', 'tube', 'glow', 'buzz', 'electric', 'sign'],
    component: NeonSignFlicker,
    defaultDimensions: { width: 620, height: 220 },
    variableSchema: [
      { key: 'text', label: 'Sign Headline', type: 'text', defaultValue: 'OPEN ALL NIGHT', category: 'content' },
      { key: 'subtext', label: 'Sign Subtitle', type: 'text', defaultValue: '24/7 COCKTAILS & CODE', category: 'content' },
      { key: 'neonColor', label: 'Main Tube Neon Color', type: 'color', defaultValue: '#ff2a85', category: 'style' },
      { key: 'accentColor', label: 'Subtext Neon Color', type: 'color', defaultValue: '#00f2fe', category: 'style' },
      { key: 'tubeColor', label: 'Glass Tube Color', type: 'color', defaultValue: '#ffffff', category: 'style' },
      { key: 'fontSize', label: 'Font Size (px)', type: 'number', defaultValue: 54, min: 24, max: 92, category: 'style' },
      { key: 'flickerStutter', label: 'Enable Electric Stutter', type: 'boolean', defaultValue: true, category: 'timing' },
      { key: 'speed', label: 'Playback Speed', type: 'number', defaultValue: 1, min: 0.5, max: 2.5, step: 0.1, category: 'timing' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },
  {
    id: 'typo-glitch-scramble',
    name: 'Glitch Scramble Decode',
    description: 'Hacker terminal sequence: characters shuffle through random cyber symbols, then lock in one by one with digital slice glitches.',
    category: 'typography',
    aspectRatio: 'flexible',
    stylePreset: 'cyber',
    sourceLibrary: 'builtin',
    tags: ['glitch', 'scramble', 'decode', 'terminal', 'hacker', 'matrix', 'cipher'],
    component: GlitchScrambleDecode,
    defaultDimensions: { width: 640, height: 180 },
    variableSchema: [
      { key: 'text', label: 'Decoded Text', type: 'text', defaultValue: 'TERMINAL_BREACH_DETECTED', category: 'content' },
      { key: 'subtext', label: 'Status Subtext', type: 'text', defaultValue: 'SYSTEM OVERRIDE // 0x7F9A_AUTHORIZED', category: 'content' },
      { key: 'textColor', label: 'Resolved Text Color', type: 'color', defaultValue: '#00ff66', category: 'style' },
      { key: 'glitchColor', label: 'Glitch Slice Color', type: 'color', defaultValue: '#ff0055', category: 'style' },
      { key: 'scrambleColor', label: 'Cipher Glyphs Color', type: 'color', defaultValue: '#38bdf8', category: 'style' },
      { key: 'fontSize', label: 'Font Size (px)', type: 'number', defaultValue: 38, min: 18, max: 72, category: 'style' },
      { key: 'decodeSpeed', label: 'Frames Per Char Lock', type: 'number', defaultValue: 2, min: 1, max: 8, category: 'timing' },
      { key: 'speed', label: 'Playback Speed', type: 'number', defaultValue: 1, min: 0.5, max: 2.5, step: 0.1, category: 'timing' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },
  {
    id: 'typo-paper-cut',
    name: 'Paper Cut Reveal',
    description: 'Layered paper-style words slide in from alternating directions with soft multi-layered shadows and a 3D fold tilt into a collage.',
    category: 'typography',
    aspectRatio: 'flexible',
    stylePreset: 'minimal',
    sourceLibrary: 'builtin',
    tags: ['paper', 'cutout', 'collage', 'editorial', 'craft', '3d', 'shadow'],
    component: PaperCutReveal,
    defaultDimensions: { width: 560, height: 260 },
    variableSchema: [
      { key: 'word1', label: 'First Word', type: 'text', defaultValue: 'CRAFT', category: 'content' },
      { key: 'word2', label: 'Second Word', type: 'text', defaultValue: 'DESIGN', category: 'content' },
      { key: 'word3', label: 'Third Word', type: 'text', defaultValue: 'INNOVATE', category: 'content' },
      { key: 'tagText', label: 'Header Badge Tag', type: 'text', defaultValue: 'EDITORIAL COLLAGE // VOL. 04', category: 'content' },
      { key: 'paperColor1', label: 'Top Paper Color', type: 'color', defaultValue: '#fef08a', category: 'style' },
      { key: 'paperColor2', label: 'Middle Paper Color', type: 'color', defaultValue: '#fda4af', category: 'style' },
      { key: 'paperColor3', label: 'Bottom Paper Color', type: 'color', defaultValue: '#67e8f9', category: 'style' },
      { key: 'textColor', label: 'Paper Text Color', type: 'color', defaultValue: '#0f172a', category: 'style' },
      { key: 'fontSize', label: 'Base Font Size (px)', type: 'number', defaultValue: 48, min: 24, max: 80, category: 'style' },
      { key: 'speed', label: 'Playback Speed', type: 'number', defaultValue: 1, min: 0.5, max: 2.5, step: 0.1, category: 'timing' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },
  {
    id: 'typo-typewriter-spotlight',
    name: 'Typewriter Spotlight',
    description: 'Text types out character-by-character with a blinking cursor while a dynamic moving spotlight beam sweeps across to illuminate active letters.',
    category: 'typography',
    aspectRatio: 'flexible',
    stylePreset: 'minimal',
    sourceLibrary: 'builtin',
    tags: ['typewriter', 'spotlight', 'beam', 'cursor', 'cinematic', 'minimal'],
    component: TypewriterSpotlight,
    defaultDimensions: { width: 680, height: 180 },
    variableSchema: [
      { key: 'text', label: 'Typewriter Text', type: 'text', defaultValue: 'Ideas emerge in the quietest hours.', category: 'content' },
      { key: 'subtext', label: 'Header Chapter Tag', type: 'text', defaultValue: 'CHAPTER 01 — THE GENESIS', category: 'content' },
      { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', category: 'style' },
      { key: 'spotlightColor', label: 'Spotlight Cone Color', type: 'color', defaultValue: '#38bdf8', category: 'style' },
      { key: 'cursorColor', label: 'Cursor Color', type: 'color', defaultValue: '#38bdf8', category: 'style' },
      { key: 'fontSize', label: 'Font Size (px)', type: 'number', defaultValue: 38, min: 18, max: 72, category: 'style' },
      { key: 'typeSpeed', label: 'Frames Per Character', type: 'number', defaultValue: 2, min: 1, max: 6, category: 'timing' },
      { key: 'speed', label: 'Playback Speed', type: 'number', defaultValue: 1, min: 0.5, max: 2.5, step: 0.1, category: 'timing' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },

  // ================= 2B. REMOCN KINETIC TYPOGRAPHY CATALOG (42 PACKS) =================
  ...REMOCN_TYPOGRAPHY_REGISTRY,

  // ================= 3. FEATURE & BENTO CARDS =================
  {
    id: 'card-glowing-hud',
    name: 'Cyberpunk Glowing HUD Card',
    description: 'Glassmorphism feature container with corner brackets, neon aura, and spring entrance (Aceternity UI / Remocn).',
    category: 'cards',
    aspectRatio: 'flexible',
    stylePreset: 'cyber',
    sourceLibrary: 'aceternity',
    tags: ['card', 'bento', 'hud', 'aceternity', 'remocn', 'glassmorphism'],
    component: GlowingCard,
    defaultDimensions: { width: 380, height: 220 },
    variableSchema: [
      { key: 'tag', label: 'Badge Tag', type: 'text', defaultValue: 'FEATURE // 01', category: 'content' },
      { key: 'heading', label: 'Card Title', type: 'text', defaultValue: 'Autonomous Agent Mesh', category: 'content' },
      { key: 'description', label: 'Description', type: 'text', defaultValue: 'Distributed stream processing cluster with zero-loss checkpointing.', category: 'content' },
      { key: 'accentColor', label: 'Neon Border & Glow', type: 'color', defaultValue: '#00f2fe', category: 'style' },
      { key: 'cardBg', label: 'Card Background', type: 'color', defaultValue: 'transparent', category: 'style' },
      { key: 'textColor', label: 'Text Color', type: 'color', defaultValue: '#ffffff', category: 'style' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },

  // ================= 4. METRICS & COUNTERS =================
  {
    id: 'metric-ticking-gauge',
    name: 'Live Metric Ticker & Gauge',
    description: 'Numbers smoothly count up from 0 to target value with animated radial gauge ring (Video-Shotcraft).',
    category: 'metrics',
    aspectRatio: 'flexible',
    stylePreset: 'emerald',
    sourceLibrary: 'shotcraft',
    tags: ['metric', 'counter', 'gauge', 'shotcraft', 'telemetry', 'stat'],
    component: ShotMetricTicking,
    defaultDimensions: { width: 360, height: 360 },
    variableSchema: [
      { key: 'targetNumber', label: 'Target Value', type: 'number', defaultValue: 99.9, category: 'content' },
      { key: 'suffix', label: 'Unit Suffix', type: 'text', defaultValue: '%', category: 'content' },
      { key: 'label', label: 'Stat Metric Label', type: 'text', defaultValue: 'SYSTEM AVAILABILITY', category: 'content' },
      { key: 'subtitle', label: 'Description Subtitle', type: 'text', defaultValue: 'Zero-downtime distributed consensus across 42 global regions', category: 'content' },
      { key: 'accentColor', label: 'Gauge Color', type: 'color', defaultValue: '#10b981', category: 'style' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },

  // ================= 5. PROCESS & TIMELINES (REELS) =================
  {
    id: 'shot-trend-countdown',
    name: '3-Trend Countdown Stack',
    description: 'Stacked countdown card sequence ideal for 9:16 vertical reels and roadmap slides (Video-Shotcraft).',
    category: 'process',
    aspectRatio: '9:16',
    stylePreset: 'cyber',
    sourceLibrary: 'shotcraft',
    tags: ['countdown', 'reels', 'trends', 'roadmap', 'shotcraft', 'vertical'],
    component: ShotTrendCountdown,
    defaultDimensions: { width: 440, height: 560 },
    variableSchema: [
      { key: 'badge', label: 'Header Tag', type: 'text', defaultValue: 'REELS RADAR', category: 'content' },
      { key: 'title', label: 'Reel Title', type: 'text', defaultValue: '3 Major Tech Trends in 2026', category: 'content' },
      { key: 'primaryColor', label: 'Primary Accent Color', type: 'color', defaultValue: '#00f2fe', category: 'style' },
      { key: 'cardBg', label: 'Card Background', type: 'color', defaultValue: 'transparent', category: 'style' },
      { key: 'staggerFrames', label: 'Stagger Delay (Frames)', type: 'number', defaultValue: 8, min: 4, max: 20, category: 'timing' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },

  // ================= 6. AMBIENT BACKGROUNDS =================
  {
    id: 'ambient-spotlight-bg',
    name: 'Cinematic Spotlight & Cyber Grid',
    description: 'Dramatic radial spotlight beam with animated breathing glow and subtle cyber grid (Aceternity UI).',
    category: 'ambient',
    aspectRatio: 'flexible',
    stylePreset: 'cyber',
    sourceLibrary: 'aceternity',
    tags: ['background', 'spotlight', 'grid', 'ambient', 'aceternity'],
    component: SpotlightBg,
    defaultDimensions: { width: 1280, height: 720 },
    variableSchema: [
      { key: 'spotlightColor', label: 'Spotlight Cone Color', type: 'color', defaultValue: '#00f2fe', category: 'style' },
      { key: 'ambientColor', label: 'Base Background Color', type: 'color', defaultValue: 'transparent', category: 'style' },
      { key: 'glowIntensity', label: 'Glow Intensity', type: 'number', defaultValue: 0.35, min: 0.1, max: 0.8, step: 0.05, category: 'style' },
      { key: 'showGrid', label: 'Show Cyber Grid', type: 'boolean', defaultValue: true, category: 'style' },
      { key: 'loop', label: 'Loop Animation', type: 'boolean', defaultValue: false, category: 'timing' },
    ],
  },
];

/**
 * Helper to get a registered motion component by ID
 */
export function getRegisteredMotionComponent(id) {
  if (!id) return null;
  return MOTION_REGISTRY.find((item) => item.id === id) || null;
}

/**
 * Extracts default variables object from an item's variableSchema
 */
export function getDefaultVariables(item) {
  if (!item || !Array.isArray(item.variableSchema)) return {};
  const defaults = {};
  item.variableSchema.forEach((v) => {
    defaults[v.key] = v.defaultValue;
  });
  return defaults;
}
