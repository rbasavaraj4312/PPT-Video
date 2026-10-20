import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { buildTimeline, motionSlideAtFrame } from '../src/narration/timeline.js';
import { createReveal } from '../src/narration/reveals.js';

// Render the actual React components, including the editor's interaction wrappers.
const bundled = await build({ stdin: {
  contents: `import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { Canvas } from './src/components/Canvas.jsx';
    import { RemotionSlideRenderer } from './src/motion/core/RemotionSlideRenderer.jsx';
    import { CaptionOverlay } from './src/narration/CaptionOverlay.jsx';
    import { SlideThumbnail } from './src/components/editor/SlideThumbnail.jsx';
    export const thumbnail = slide => renderToStaticMarkup(React.createElement(SlideThumbnail, { slide, vertical: true }));
    export const captions = narration => renderToStaticMarkup(React.createElement(CaptionOverlay, { narration, timeMs: 150 }));
    export const editor = (slide, vertical) => renderToStaticMarkup(React.createElement(Canvas, { activeSlide: slide, aspectRatio: vertical ? '9:16' : '16:9' }));
    export const video = (slide, vertical, scale = 1) => renderToStaticMarkup(React.createElement(RemotionSlideRenderer, { slide, isVertical: vertical, scale }));`,
  resolveDir: new URL('..', import.meta.url).pathname, loader: 'jsx',
}, bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
  alias: { '@': new URL('../src', import.meta.url).pathname } });
const module = { exports: {} };
new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { editor, video } = module.exports;

test('Word highlighting can be disabled without hiding captions', () => {
  const narration = { captions: [{ text: 'Hello', startMs: 0, endMs: 500 }],
    caption_style: { enabled: true, highlight_words: false, color: '#ffffff', highlight: '#22d3ee' } };
  const plain = module.exports.captions(narration);
  assert.match(plain, /Hello/);
  assert.match(plain, /color:#ffffff/);
  assert.doesNotMatch(plain, /color:#22d3ee/);
  assert.match(module.exports.captions({ ...narration, caption_style: { ...narration.caption_style, highlight_words: true } }), /color:#22d3ee/);
});

function scene(html, vertical = false) {
  const viewBox = vertical ? '0 0 720 1280' : '0 0 1280 720';
  const root = new RegExp(`<svg[^>]*viewBox="${viewBox}"[^>]*>`).exec(html);
  assert.ok(root, 'Slide SVG missing');
  const start = root.index + root[0].length;
  const rest = html.slice(start);
  let depth = 1, end;
  for (const match of rest.matchAll(/<svg\b[^>]*>|<\/svg>/g)) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (depth === 0) { end = match.index; break; }
  }
  assert.notEqual(end, undefined);
  // Pointer event groups have no visual effect; all visible SVG must match exactly.
  const groups = [];
  return rest.slice(0, end).replace(/<g\b[^>]*>|<\/g>/g, tag => {
    if (tag.startsWith('</')) return groups.pop() ? '' : tag;
    const interaction = tag.includes('class="cursor-move"');
    groups.push(interaction);
    return interaction ? '' : tag;
  });
}

const sample = JSON.parse(readFileSync(new URL('../../samples/morph-voice-demo/presentation.json', import.meta.url)));
test('All sample slides have identical SVG visuals in editor, preview and 1080p export', () => {
  for (const slide of sample.slides) {
    const reference = scene(editor(slide, false));
    assert.equal(scene(video(slide, false)), reference);
    assert.equal(scene(video(slide, false, 1.5)), reference);
  }
});

test('Thin shapes, zero strokes/radii, fonts, wrapping, opacity and z order match in vertical video', () => {
  const slide = { background: '#ffffff', elements: [
    { id: 'text', type: 'text', x: 20, y: 100, width: 180, height: 140, text: 'Several words wrap\nonto new lines', font_family: 'Courier New', font_size: 24, font_bold: true, font_italic: true, text_align: 'right', vertical_align: 'middle', text_color: '#ff0000', opacity: .2, z_index: 3 },
    { id: 'divider', type: 'rectangle', x: 20, y: 80, width: 600, height: 2, fill: '#cccccc', stroke_width: 0, z_index: 0 },
    { id: 'box', type: 'rounded_rectangle', x: 20, y: 300, width: 200, height: 100, radius: 0, content: 'Label', font_size: 20, stroke_width: 0, z_index: 1 },
    { id: 'ellipse', type: 'ellipse', x: 260, y: 300, width: 80, height: 80, content: 'Dot', font_size: 16, z_index: 2 },
    { id: 'arrow', type: 'arrow', x: 20, y: 450, width: 200, height: 50, arrow_head: 'both', stroke_width: 1, stroke_style: 'dashed', z_index: 4 },
  ] };
  const reference = scene(editor(slide, true), true);
  assert.equal(scene(video(slide, true, 1.5), true), reference);
  assert.match(reference, /width="600" height="2"/);
  assert.match(reference, /rx="0" ry="0"/);
  assert.match(reference, /font-family="Courier New"/);
  assert.match(reference, /opacity="0.2"/);
  assert.match(reference, /stroke-width="0"/);
});

test('Cropped, flipped, rotated images use identical layout in editor and video', () => {
  const slide = { background: '#ffffff', elements: [{ id: 'picture', type: 'image', x: 50, y: 70, width: 300, height: 200,
    image_src: 'data:image/png;base64,aGVsbG8=', image_width: 600, image_height: 400,
    image_crop: { x: .2, y: .1, width: .5, height: .6 }, rotation: 90, flip_x: true,
    image_brightness: 120, image_contrast: 80, image_saturation: 50, opacity: .7 }] };
  assert.equal(scene(editor(slide)), scene(video(slide)));
  assert.match(scene(video(slide)), /viewBox="120 40 300 240"/);
  assert.match(scene(video(slide)), /brightness\(120%\)/);
});

test('Portrait image reveals affect video opacity while editing and thumbnails remain visible', () => {
  const narration = { script: 'Show image', generated_script: 'Show image', engine: 'omnivoice', generated_engine: 'omnivoice',
    voice_id: 'v', generated_voice_id: 'v', asset_id: 'a'.repeat(64), duration_ms: 2000,
    captions: [{ text: 'Show', startMs: 0, endMs: 400 }, { text: ' image', startMs: 1000, endMs: 1500 }] };
  const slide = { id: 'portrait', transition_type: 'none', narration, elements: [{ id: 'picture', type: 'image', x: 50, y: 500,
    width: 500, height: 300, image_src: 'data:image/png;base64,aGVsbG8=', image_width: 600, image_height: 400,
    image_crop: { x: .1, y: .2, width: .5, height: .6 }, flip_x: true, rotation: 90, opacity: .6, reveal: createReveal(narration, 1) }] };
  const { items } = buildTimeline({ aspect_ratio: '9:16', slides: [slide] });
  const hidden = scene(video(motionSlideAtFrame(items, 0, 29), true), true);
  const fading = scene(video(motionSlideAtFrame(items, 0, 33), true), true);
  const revealed = scene(video(motionSlideAtFrame(items, 0, 36), true), true);
  assert.match(hidden, /opacity="0"/);
  assert.match(fading, /opacity="0.3"/);
  assert.match(revealed, /opacity="0.6"/);
  assert.equal(scene(editor(slide, true), true), revealed);
  assert.match(module.exports.thumbnail(slide), /opacity="0.6"/);
  assert.match(revealed, /viewBox="60 80 300 240"/);
});
