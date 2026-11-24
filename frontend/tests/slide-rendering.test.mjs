import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { buildTimeline, motionSlideAtFrame } from '../src/narration/timeline.js';
import { createReveal } from '../src/narration/reveals.js';
import { resizeGroup } from '../src/rendering/groupResize.js';
import { selectionBounds } from '../src/rendering/alignmentGuides.js';

// Render the actual React components, including the editor's interaction wrappers.
const bundled = await build({ stdin: {
  contents: `import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { Canvas } from './src/components/Canvas.jsx';
    import { RemotionSlideRenderer } from './src/motion/core/RemotionSlideRenderer.jsx';
    import { CaptionOverlay } from './src/narration/CaptionOverlay.jsx';
    import { SlideThumbnail } from './src/components/editor/SlideThumbnail.jsx';
    export const thumbnail = slide => renderToStaticMarkup(React.createElement(SlideThumbnail, { slide, vertical: true }));
    export const captions = (narration, timeMs = 150, scale = 1) => renderToStaticMarkup(React.createElement(CaptionOverlay, { narration, timeMs, scale }));
    export const editor = (slide, vertical, selectedElementIds = []) => renderToStaticMarkup(React.createElement(Canvas, { activeSlide: slide, selectedElementIds, aspectRatio: vertical ? '9:16' : '16:9' }));
    export const video = (slide, vertical, scale = 1) => renderToStaticMarkup(React.createElement(RemotionSlideRenderer, { slide, isVertical: vertical, scale }));`,
  resolveDir: new URL('..', import.meta.url).pathname, loader: 'jsx',
}, bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
  alias: { '@': new URL('../src', import.meta.url).pathname } });
const module = { exports: {} };
new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { editor, video } = module.exports;

test('Grouped selections expose four interactive proportional resize handles', () => {
  const slide = { elements: [
    { id: 'a', type: 'rectangle', x: 100, y: 100, width: 200, height: 100, group_id: 'group' },
    { id: 'b', type: 'text', x: 120, y: 120, width: 100, height: 50, group_id: 'group' },
  ] };
  const markup = editor(slide, false, ['a', 'b']);
  for (const corner of ['nw', 'ne', 'sw', 'se']) {
    assert.match(markup, new RegExp(`pointer-events="all" aria-label="Resize selection ${corner} proportionally"`));
  }
});

test('Shrunk groups preserve original local arrowheads, dashes, text wrapping and icons across surfaces', () => {
  const original = [
    { id: 'box', type: 'rounded_rectangle', x: 0, y: 0, width: 200, height: 100, radius: 16, font_size: 24, text: 'Several words on two lines', group_id: 'g' },
    { id: 'arrow', type: 'arrow', x: 240, y: 0, width: -40, height: 100, stroke_width: 4, stroke_style: 'dashed', arrow_head: 'both', group_id: 'g' },
    { id: 'icon', type: 'icon', x: 0, y: 150, width: 80, height: 80, icon_name: 'Star', text: 'Icon label', group_id: 'g' },
  ];
  const bounds = selectionBounds(original);
  const elements = resizeGroup(original, bounds, 'se', -(bounds.right - bounds.left) / 2, -(bounds.bottom - bounds.top) / 2);
  const slide = { elements };
  const markup = scene(editor(slide));
  assert.equal(markup, scene(video(slide)));
  assert.match(markup, /translate\(0 0\) scale\(0.5\)/);
  assert.match(markup, /font-size="24"/);
  assert.match(markup, /stroke-dasharray="8 6"/);
  assert.match(markup, /rx="16" ry="16"/);
  assert.equal((markup.match(/<tspan/g) || []).length, (scene(editor({ elements: original })).match(/<tspan/g) || []).length);
});

test('Word highlighting can be disabled without hiding captions', () => {
  const narration = { captions: [{ text: 'Hello', startMs: 0, endMs: 500 }],
    caption_style: { enabled: true, highlight_words: false, color: '#ffffff', highlight: '#22d3ee' } };
  const plain = module.exports.captions(narration);
  assert.match(plain, /Hello/);
  assert.match(plain, /color:#ffffff/);
  assert.doesNotMatch(plain, /color:#22d3ee/);
  assert.match(module.exports.captions({ ...narration, caption_style: { ...narration.caption_style, highlight_words: true } }), /color:#22d3ee/);
});

test('Typography captions render the active word without a subtitle box', () => {
  const narration = { captions: [{ text: 'First', startMs: 0, endMs: 100 }, { text: 'Next', startMs: 100, endMs: 300 }, { text: 'Later', startMs: 300, endMs: 500 }],
    caption_style: { design: 'word', position: 'center', font_size: 120 } };
  const markup = module.exports.captions(narration);
  assert.match(markup, /Next/);
  assert.doesNotMatch(markup, /First|Later|rgba\(0,0,0,.78\)/);
  assert.match(markup, /top:50%/);
  assert.match(markup, /font-size:120px/);
});

test('Custom caption coordinates position the caption center in slide percentages', () => {
  const narration = { captions: [{ text: 'Hello', startMs: 0, endMs: 500 }],
    caption_style: { position: 'custom', x_percent: 25, y_percent: 80 } };
  const markup = module.exports.captions(narration);
  assert.match(markup, /left:25%/);
  assert.match(markup, /top:80%/);
  assert.match(markup, /translate\(-50%, -50%\)/);
  assert.match(module.exports.captions({ ...narration, caption_style: { position: 'bottom' } }), /bottom:48px/);
});

test('New caption designs render distinct treatments and marker ink contrasts with its accent', () => {
  const narration = { captions: [{ text: 'First', startMs: 0, endMs: 100 }, { text: 'Next', startMs: 100, endMs: 300 }, { text: 'Later', startMs: 300, endMs: 500 }], caption_style: { highlight: '#facc15', color: '#ffffff' } };
  const render = design => module.exports.captions({ ...narration, caption_style: { ...narration.caption_style, design } });
  assert.match(render('editorial'), /Georgia/);
  assert.match(render('editorial'), /border-left/);
  assert.match(render('marker'), /background:#facc15/);
  assert.match(render('marker'), /color:#111827/);
  assert.doesNotMatch(render('marker'), /Later/);
  assert.match(render('impact'), /text-transform:uppercase/);
  assert.doesNotMatch(render('impact'), /First|Later/);
  assert.match(render('signal'), /border-bottom/);
  const dark = module.exports.captions({ ...narration, caption_style: { design: 'marker', highlight: '#112233' } });
  assert.match(dark, /color:#ffffff/);
});

test('Camera zoom out pulls each spoken word into place and restarts on the next word', () => {
  const narration = { captions: [{ text: 'Hello', startMs: 0, endMs: 500 }, { text: 'world', startMs: 500, endMs: 1000 }],
    caption_style: { design: 'camera_zoom_out' } };
  const first = module.exports.captions(narration, 0);
  const settled = module.exports.captions(narration, 350);
  const next = module.exports.captions(narration, 500);
  assert.match(first, /scale\(1\.65\)/);
  assert.match(settled, /scale\(1\)/);
  assert.match(next, /scale\(1\.65\)/);
  assert.match(first, /Hello/);
  assert.doesNotMatch(first, /world/);
  assert.match(next, /world/);
  assert.doesNotMatch(next, /Hello/);
});

test('Wavy captions animate letters at the requested time and preserve graphemes', () => {
  const narration = { captions: [{ text: 'Cafe\u0301', startMs: 0, endMs: 500 }], caption_style: { design: 'wavy' } };
  const first = module.exports.captions(narration, 100);
  const later = module.exports.captions(narration, 200);
  assert.match(first, /data-caption-design="wavy"/);
  assert.match(first, /e\u0301<\/span>/);
  assert.notEqual(first, later);
  assert.equal(module.exports.captions(narration, 500), '');
});

test('Only the incoming word waves; earlier letters stay settled', () => {
  const narration = { captions: [{ text: 'AB', startMs: 0, endMs: 500 }, { text: 'CD', startMs: 500, endMs: 1000 }],
    caption_style: { design: 'wavy' } };
  const before = module.exports.captions(narration, 250);
  const entering = module.exports.captions(narration, 550);
  const later = module.exports.captions(narration, 700);
  assert.doesNotMatch(before, />C<|>D</);
  const letter = (html, value) => html.match(new RegExp(`<span style="([^"]+)">${value}</span>`))[1];
  assert.equal(letter(entering, 'A'), letter(later, 'A'));
  assert.equal(letter(entering, 'B'), letter(later, 'B'));
  assert.match(letter(entering, 'B'), /opacity:1;transform:translateY\(0\.000px\)/);
  assert.notEqual(letter(entering, 'C'), letter(later, 'C'));
  assert.match(letter(entering, 'D'), /opacity:0/);
});

test('Typewriter reveals letters and removes the cursor when the word is complete', () => {
  const narration = { captions: [{ text: 'ABCD', startMs: 0, endMs: 500 }], caption_style: { design: 'typewriter' } };
  const first = module.exports.captions(narration, 0);
  assert.match(first, />A<span data-caption-cursor/);
  assert.match(first, /visibility:hidden">BCD/);
  const complete = module.exports.captions(narration, 350);
  assert.match(complete, />ABCD/);
  assert.doesNotMatch(complete, /data-caption-cursor/);
});

test('Paper Cutout and Stacked Headlines settle previously spoken words', () => {
  for (const design of ['paper_cutout', 'stacked_headlines']) {
    const narration = { captions: [{ text: 'First', startMs: 0, endMs: 500 }, { text: 'Next', startMs: 500, endMs: 1000 }], caption_style: { design } };
    const early = module.exports.captions(narration, 550);
    const late = module.exports.captions(narration, 850);
    const wordStyle = (html, word) => html.match(new RegExp(`<span style="([^"]+)"> ?${word}</span>`))[1];
    assert.equal(wordStyle(early, 'First'), wordStyle(late, 'First'));
    assert.notEqual(wordStyle(early, 'Next'), wordStyle(late, 'Next'));
    assert.match(late, design === 'paper_cutout' ? /repeating-linear-gradient/ : /display:block;[^">]*text-align:left/);
  }
});

test('Neon fills its outline and Focus Pull settles into sharp text', () => {
  const words = [{ text: 'First', startMs: 0, endMs: 500 }, { text: 'Next', startMs: 500, endMs: 1000 }];
  const render = (design, time) => module.exports.captions({ captions: words, caption_style: { design } }, time);
  assert.match(render('neon_trace', 0), /-webkit-text-fill-color:rgba\(250,204,21,0\)/);
  assert.match(render('neon_trace', 350), /-webkit-text-fill-color:rgba\(250,204,21,1\)/);
  assert.match(render('focus_pull', 0), /filter:blur\(9\.000px\)/);
  assert.match(render('focus_pull', 350), /filter:blur\(0\.000px\)/);
  assert.match(render('focus_pull', 550), /filter:blur\(0\.000px\).*First/);
  assert.notEqual(render('focus_pull', 550), render('focus_pull', 850));
});

test('3D Word Tunnel approaches, holds at the focal plane, and flies past the camera', () => {
  const narration = { captions: [{ text: 'First', startMs: 0, endMs: 500 }, { text: 'Next', startMs: 500, endMs: 1000 }],
    caption_style: { design: 'word_tunnel', position: 'center', highlight_words: false, color: '#ffffff' } };
  const render = (time, scale = 1) => module.exports.captions(narration, time, scale);
  assert.match(render(0), /perspective\(700px\) translateZ\(-1100\.000px\)/);
  assert.match(render(250), /translateZ\(0\.000px\) rotateY\(0\.000deg\)/);
  const outgoing = render(475);
  assert.ok(Number(outgoing.match(/translateZ\(([-\d.]+)px\)/)[1]) > 0);
  assert.match(outgoing, /First/);
  assert.doesNotMatch(outgoing, /Next/);
  assert.match(render(500), /translateZ\(-1100\.000px\)/);
  assert.doesNotMatch(render(500), /First/);
  assert.match(render(0, 2), /perspective\(1400px\) translateZ\(-2200\.000px\)/);
  assert.doesNotMatch(render(250), /color:#facc15/);
  assert.equal(render(1000), '');
  assert.equal(render(250), render(250), 'Seeking to the same frame stays deterministic');
});

test('Orbiting Words curves incoming words into place and leaves earlier words settled', () => {
  const narration = { captions: [{ text: 'First', startMs: 0, endMs: 500 }, { text: 'Next', startMs: 500, endMs: 1000 }],
    caption_style: { design: 'orbiting_words', font_size: 60 } };
  const render = time => module.exports.captions(narration, time);
  const wordStyle = (html, text) => html.match(new RegExp(`<span style="([^"]+)"> ?${text}</span>`))[1];
  assert.doesNotMatch(render(200), /Next/);
  assert.equal(wordStyle(render(550), 'First'), wordStyle(render(850), 'First'));
  assert.notEqual(wordStyle(render(550), 'Next'), wordStyle(render(650), 'Next'));
  assert.match(wordStyle(render(850), 'Next'), /translate\(0\.000px, 0\.000px\) rotate\(0\.000deg\) scale\(1\.000\)/);
  assert.equal(render(1000), '');
});

test('Elastic Ribbon follows a curved baseline and stretches only around speech entrances', () => {
  const narration = { captions: [{ text: 'Make', startMs: 0, endMs: 500 }, { text: 'it', startMs: 500, endMs: 1000 }, { text: 'memorable', startMs: 1000, endMs: 1500 }],
    caption_style: { design: 'elastic_ribbon', font_size: 60 } };
  const render = (time, scale = 1) => module.exports.captions(narration, time, scale);
  const transform = (html, text) => html.match(new RegExp(`<span style="[^"]*transform:([^"]+)"> ?${text}</span>`))[1];
  assert.doesNotMatch(render(750), /memorable/);
  assert.notEqual(transform(render(1050), 'Make'), transform(render(1400), 'Make'));
  assert.notEqual(transform(render(1400), 'Make'), transform(render(1400), 'memorable'));
  assert.match(transform(render(1400), 'Make'), /scaleX\(1\.000\)/);
  const y = html => Number(transform(html, 'Make').match(/translateY\(([-\d.]+)px\)/)[1]);
  assert.ok(Math.abs(y(render(1400, 2)) - 2 * y(render(1400))) < .002);
  assert.equal(render(1500), '');
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
