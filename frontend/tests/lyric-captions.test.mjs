import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { captionLyricLines, captionWords } from '../src/narration/timeline.js';

const bundled = await build({ stdin: { contents: `import React from 'react';
  import { renderToStaticMarkup } from 'react-dom/server';
  import { CaptionOverlay } from './src/narration/CaptionOverlay.jsx';
  export const render = (captions, design, timeMs, extra = {}) => renderToStaticMarkup(React.createElement(CaptionOverlay, {
    narration: { captions, caption_style: { design, words_per_phrase: 2, ...extra } }, timeMs }));`,
  resolveDir: new URL('..', import.meta.url).pathname, loader: 'jsx' },
  bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent' });
const module = { exports: {} };
new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const { render } = module.exports;
const words = Array.from({ length: 10 }, (_, i) => ({ text: `word${i}`, startMs: i * 500, endMs: i * 500 + 400 }));

test('Kinetic and handwritten captions follow speech and clear at the end', () => {
  for (const design of ['big_kinetic', 'handwritten']) {
    assert.deepEqual(captionWords(words, 600, 2, design).map(w => w.text), ['word0', 'word1']);
    assert.equal(render(words, design, -1), '');
    assert.equal(render(words, design, 4900), '');
    assert.equal(render(words, design, 100), render(words, design, 100));
    assert.notEqual(render(words, design, 100), render(words, design, 350));
  }
  assert.match(render(words, 'handwritten', 100), /data-handwriting-reveal/);
  assert.match(render(words, 'handwritten', 350), /stroke-dashoffset="0"/);
  assert.match(render(words, 'big_kinetic', 350), /scale\(1.000, 1.000\)/);
});

test('Outline captions retain upcoming outlines and fill in speech order', () => {
  const html = render(words, 'outline_to_solid', 200);
  assert.match(html, /word1/);
  assert.match(html, /-webkit-text-fill-color:transparent/);
  assert.match(html, /clip-path:inset\(0 50.000% 0 0\)/);
  assert.match(html, /clip-path:inset\(0 100.000% 0 0\)/);
  assert.match(render(words, 'outline_to_solid', 600), /clip-path:inset\(0 0.000% 0 0\)/);
});

test('Lyric stack preserves previous phrases and gaps, keeps three lines, and supports backward seeking', () => {
  const lines = captionLyricLines(words, 3600, 2);
  assert.deepEqual(lines.map(line => line.id), [1, 2, 3]);
  assert.deepEqual(lines.map(line => line.current), [false, false, true]);
  assert.equal(lines[2].words[1].active, true);
  assert.equal(captionLyricLines(words, 950, 2).length, 1);
  assert.equal(captionLyricLines(words, 1100, 2).length, 2);
  assert.equal(captionLyricLines(words, 100, 2).length, 1);
  assert.deepEqual(captionLyricLines(words, -1, 2), []);
  assert.deepEqual(captionLyricLines(words, 4900, 2), []);
  const html = render(words, 'stacking_lyrics', 3600);
  assert.equal((html.match(/data-caption-lyric="previous"/g) || []).length, 2);
  assert.equal((html.match(/data-caption-lyric="current"/g) || []).length, 1);
  assert.doesNotMatch(html, /word0|word8/);
});

test('All four designs respect disabled captions, highlight settings, and custom placement', () => {
  for (const design of ['big_kinetic', 'handwritten', 'stacking_lyrics', 'outline_to_solid']) {
    assert.equal(render(words, design, 200, { enabled: false }), '');
    const html = render(words, design, 200, { highlight_words: false, highlight: '#22d3ee', position: 'custom', x_percent: 30, y_percent: 40 });
    assert.doesNotMatch(html, /#22d3ee/);
    assert.match(html, /left:30%/);
    assert.match(html, /top:40%/);
  }
});
