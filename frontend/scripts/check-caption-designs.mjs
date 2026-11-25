// Render the real caption component in Chrome without loading or saving a deck.
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { openBrowser } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const output = path.resolve(process.argv[2] || '../output/caption-designs-check');
fs.mkdirSync(output, { recursive: true });
const bundled = await build({ stdin: { contents: `import React from 'react';
  import { renderToStaticMarkup } from 'react-dom/server';
  import { CaptionOverlay } from './src/narration/CaptionOverlay.jsx';
  export const render = (design, timeMs) => renderToStaticMarkup(React.createElement(CaptionOverlay, {
    timeMs, scale: .75, narration: { captions: [
      { text: 'Make', startMs: 0, endMs: 500 }, { text: 'it', startMs: 500, endMs: 1000 },
      { text: 'memorable', startMs: 1000, endMs: 1500 }],
      caption_style: { design, font_size: 52, color: '#ffffff', highlight: '#a3e635', position: 'center' }
    } }));`, resolveDir: path.resolve(import.meta.dirname, '..'), loader: 'jsx' },
  bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent' });
const module = { exports: {} };
new Function('require', 'module', 'exports', bundled.outputFiles[0].text)(createRequire(import.meta.url), module, module.exports);
const designs = ['typewriter', 'paper_cutout', 'neon_trace', 'stacked_headlines', 'focus_pull', 'orbiting_words', 'elastic_ribbon', 'big_kinetic', 'handwritten', 'stacking_lyrics', 'outline_to_solid'];
const html = `<html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;padding:24px;background:#090e19;color:#dce3ee;font-family:Arial}
  h1{font-size:24px;margin:0 0 6px}p{font-size:13px;color:#94a3b8;margin:0 0 20px}
  main{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  section{height:242px;position:relative;overflow:hidden;background:linear-gradient(120deg,#233149,#101828 65%,#3c3442);border:1px solid #334155;border-radius:10px}
  label{position:absolute;left:16px;top:14px;font-size:12px;color:#cbd5e1;text-transform:uppercase;letter-spacing:.08em}
  </style></head><body><h1>Speech-timed caption treatments</h1><p>Incoming word · 1.05s / Settled word · 1.40s</p><main>${designs.map(design => [1050, 1400].map(time =>
    `<section data-design="${design}" data-time="${time}"><label>${design.replaceAll('_', ' ')} · ${time === 1050 ? 'entering' : 'settled'}</label>${module.exports.render(design, time)}</section>`).join('')).join('')}
    <div style="grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${[1010, 1250, 1470].map((time, index) =>
      `<section data-design="word_tunnel" data-time="${time}"><label>3D tunnel · ${['approach', 'hold', 'fly-through'][index]}</label>${module.exports.render('word_tunnel', time)}</section>`).join('')}</div></main></body></html>`;
const htmlPath = path.join(output, 'contact-sheet.html');
fs.writeFileSync(htmlPath, html);
const browser = await openBrowser('chrome', { browserExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', logLevel: 'error' });
try {
  const page = await browser.newPage({ context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
  await page.setViewport({ width: 1280, height: 3260, deviceScaleFactor: 1 });
  await page.goto({ url: `file://${htmlPath}`, timeout: 30000 });
  const result = await page.evaluate(() => {
    const word = (design, time) => document.querySelector(`section[data-design="${design}"][data-time="${time}"] [data-caption-design]`).lastElementChild;
    return {
      enteringCursor: Boolean(document.querySelector('section[data-design="typewriter"][data-time="1050"] [data-caption-cursor]')),
      settledCursor: Boolean(document.querySelector('section[data-design="typewriter"][data-time="1400"] [data-caption-cursor]')),
      neonOutline: getComputedStyle(word('neon_trace', 1050)).webkitTextStrokeWidth,
      neonEnteringFill: getComputedStyle(word('neon_trace', 1050)).webkitTextFillColor,
      neonSettledFill: getComputedStyle(word('neon_trace', 1400)).webkitTextFillColor,
      stack: getComputedStyle(word('stacked_headlines', 1400)).display,
      blurEntering: getComputedStyle(word('focus_pull', 1050)).filter,
      blurSettled: getComputedStyle(word('focus_pull', 1400)).filter,
      paper: getComputedStyle(word('paper_cutout', 1400)).backgroundImage,
      tunnelWidths: [1010, 1250, 1470].map(time => word('word_tunnel', time).getBoundingClientRect().width),
      orbitEntering: getComputedStyle(word('orbiting_words', 1050)).transform,
      orbitSettled: getComputedStyle(word('orbiting_words', 1400)).transform,
      ribbonEntering: getComputedStyle(word('elastic_ribbon', 1050)).transform,
      ribbonSettled: getComputedStyle(word('elastic_ribbon', 1400)).transform,
      ribbonWordTransforms: Array.from(document.querySelector('section[data-design="elastic_ribbon"][data-time="1400"] [data-caption-design]').children).map(item => getComputedStyle(item).transform),
      kineticEntering: getComputedStyle(word('big_kinetic', 1050)).transform,
      kineticSettled: getComputedStyle(word('big_kinetic', 1400)).transform,
      handwritingEntering: getComputedStyle(word('handwritten', 1050).querySelector('[data-handwriting-reveal]')).clipPath,
      handwritingSettled: getComputedStyle(word('handwritten', 1400).querySelector('[data-handwriting-reveal]')).clipPath,
      handwritingFont: getComputedStyle(word('handwritten', 1400)).fontFamily,
      lyricLine: Boolean(document.querySelector('[data-caption-lyric="current"]')),
      outlineEntering: getComputedStyle(word('outline_to_solid', 1050).querySelector('[data-caption-fill]')).clipPath,
      outlineSettled: getComputedStyle(word('outline_to_solid', 1400).querySelector('[data-caption-fill]')).clipPath,
    };
  });
  assert.equal(result.enteringCursor, true);
  assert.equal(result.settledCursor, false);
  assert.ok(parseFloat(result.neonOutline) > 0);
  assert.notEqual(result.neonEnteringFill, result.neonSettledFill);
  assert.equal(result.stack, 'block');
  assert.notEqual(result.blurEntering, result.blurSettled);
  assert.equal(result.blurSettled, 'blur(0px)');
  assert.match(result.paper, /repeating-linear-gradient/);
  assert.ok(result.tunnelWidths[0] < result.tunnelWidths[1]);
  assert.ok(result.tunnelWidths[1] < result.tunnelWidths[2]);
  assert.notEqual(result.orbitEntering, result.orbitSettled);
  assert.equal(result.orbitSettled, 'matrix(1, 0, 0, 1, 0, 0)');
  assert.notEqual(result.ribbonEntering, result.ribbonSettled);
  assert.equal(new Set(result.ribbonWordTransforms).size, 3);
  assert.notEqual(result.kineticEntering, result.kineticSettled);
  assert.equal(result.kineticSettled, 'matrix(1, 0, 0, 1, 0, 0)');
  assert.notEqual(result.handwritingEntering, result.handwritingSettled);
  assert.match(result.handwritingFont, /Noteworthy/);
  assert.equal(result.lyricLine, true);
  assert.notEqual(result.outlineEntering, result.outlineSettled);
  const shot = await page._client().send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(output, 'contact-sheet.png'), Buffer.from(shot.value.data, 'base64'));
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(result, null, 2));
  console.log(`Caption designs verified: ${output}`);
} finally { await browser.close({ silent: true }); }
