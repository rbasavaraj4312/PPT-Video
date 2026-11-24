import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, needsAnimatedExport, visualAtFrame } from '../src/narration/timeline.js';
import { mediaGeometry } from '../src/rendering/mediaModel.js';

test('Trimmed video and timed images keep exact boundaries in the middle of a deck', () => {
  const slides = [
    { id: 'a', slide_duration: 1 },
    { id: 'video', media: { kind: 'video', trim_start: 2, trim_end: 3.5 } },
    { id: 'image', slide_duration: 2.5, media: { kind: 'image' } },
    { id: 'b', slide_duration: 1 },
  ].map(s => ({ elements: [], transition_type: 'morph', transition_duration: 1, ...s }));
  const deck = { slides };
  assert.equal(needsAnimatedExport(deck), true);
  const { items, totalFrames } = buildTimeline(deck);
  assert.equal(totalFrames, 180);
  assert.deepEqual(items.map(i => i.start), [0, 30, 75, 150]);
  assert.ok(items.every(i => i.transition === 0));
  assert.equal(visualAtFrame(items, 74).index, 1);
  assert.equal(visualAtFrame(items, 75).index, 2);
});

test('Portrait and landscape fit and fill preserve source aspect ratio', () => {
  assert.deepEqual(mediaGeometry({ fit: 'contain' }, 1280, 720, 400, 400), { x: 280, y: 0, width: 720, height: 720 });
  assert.deepEqual(mediaGeometry({ fit: 'cover' }, 720, 1280, 400, 400), { x: -280, y: 0, width: 1280, height: 1280 });
});

// Exercise the actual subtitle renderer at boundaries without narration assets.
const { build } = await import('esbuild');
const { createRequire } = await import('node:module');
const bundled = await build({ stdin: {
  contents: `import React from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import { MediaSubtitles } from './src/narration/MediaClip.jsx';
    import { MediaControls } from './src/components/editor/MediaControls.jsx';
    export const subtitles = (media, timeMs) => renderToStaticMarkup(<MediaSubtitles media={media} timeMs={timeMs} />);
    export const controls = slide => renderToStaticMarkup(<MediaControls slide={slide} onChange={() => {}} onEdit={() => {}} />);`,
  resolveDir: new URL('..', import.meta.url).pathname, loader: 'jsx',
}, bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent' });
const module = { exports: {} };
new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);

test('Subtitles render at clip-relative times independently of generated narration', () => {
  const media = { kind: 'video', subtitle_position: 'top', subtitle_size: 42,
    subtitles: [{ text: '<Hello> world', startMs: 500, endMs: 1000 }] };
  assert.equal(module.exports.subtitles(media, 499), '');
  const visible = module.exports.subtitles(media, 500);
  assert.match(visible, /&lt;Hello&gt; world/);
  assert.match(visible, /top:7%/);
  assert.match(visible, /42px/);
  assert.equal(module.exports.subtitles(media, 1000), '');
});

test('Image and video expose their own timing controls and subtitle editor', () => {
  const base = { elements: [], slide_duration: 4, media: { kind: 'image', fit: 'contain', subtitles: [] } };
  assert.match(module.exports.controls(base), /Image duration \(s\)/);
  const video = module.exports.controls({ ...base, media: { ...base.media, kind: 'video', duration: 10, trim_start: 1, trim_end: 6, volume: .5 } });
  for (const label of ['Video start', 'Video end', 'Video volume', 'Mute video audio', 'Add subtitle']) assert.ok(video.includes(label), label);
  assert.doesNotMatch(video, /Image duration/);
});
