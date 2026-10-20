// Isolated editor and real MP4 check: synthetic audio, no TTS or saved-deck writes.
import { openBrowser } from '@remotion/renderer';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createReveal } from '../src/narration/reveals.js';

const root = path.resolve(import.meta.dirname, '../..'), output = path.join(root, 'output/reveal-check');
fs.mkdirSync(output, { recursive: true });
const n = { script: 'Plan plan launch.', generated_script: 'Plan plan launch.', engine: 'omnivoice', generated_engine: 'omnivoice',
  voice_id: 'voice', generated_voice_id: 'voice', asset_id: 'a'.repeat(64), duration_ms: 3000, audio_start_ms: 100, audio_end_ms: 2900,
  captions: [{ text: 'Plan', startMs: 200, endMs: 600 }, { text: ' plan', startMs: 1200, endMs: 1600 }, { text: ' launch.', startMs: 2200, endMs: 2600 }], caption_style: { enabled: false } };
let deck = { id: 'reveal-check', title: 'Reveal check', aspect_ratio: '16:9', slides: [{ id: 'one', title: 'Plan',
  background: '#000000', transition_type: 'none', narration: n, elements: [
    { id: 'card', group_id: 'plan', type: 'rectangle', x: 150, y: 150, width: 400, height: 250, fill: '#22d3ee', opacity: .8, stroke_width: 0 },
    { id: 'label', group_id: 'plan', type: 'text', x: 190, y: 230, width: 300, height: 90, content: 'PLAN', font_size: 48, font_color: '#ffffff' },
    { id: 'motion', type: 'motion_component', x: 650, y: 150, width: 500, height: 200,
      reveal: createReveal(n, 1, { effect: 'appear' }), motion_data: { component_id: 'typo-marker-highlight',
        custom_vars: { before: '', highlight: 'REVEAL', after: '', fontSize: 48, baseColor: '#ffffff' } } },
  ] }] };
const wav = Buffer.alloc(44 + 24000 * 3 * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
for (let i = 0; i < 72000; i++) wav.writeInt16LE(Math.round(Math.sin(i / 24000 * Math.PI * 440 * 2) * 1000), 44 + i * 2);
const server = createServer((request, response) => { response.writeHead(200, { 'Content-Type': 'audio/wav', 'Access-Control-Allow-Origin': '*' }); response.end(wav); });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await openBrowser('chrome', { browserExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', logLevel: 'error' });
const errors = [];
try {
  const page = await browser.newPage({ context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
  const client = page._client();
  client.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails.exception?.description || event.exceptionDetails.text));
  await client.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/presentations/reveal-check' }, { urlPattern: '*/api/presentations' }, { urlPattern: `*/assets/${n.asset_id}/*` }] });
  client.on('Fetch.requestPaused', async event => {
    if (event.request.method === 'POST') deck = JSON.parse(event.request.postData);
    const audio = event.request.url.endsWith('narration.wav');
    await client.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: event.request.method === 'OPTIONS' ? 204 : 200,
      responseHeaders: [{ name: 'Content-Type', value: audio ? 'audio/wav' : 'application/json' }, { name: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' }],
      ...(event.request.method !== 'OPTIONS' ? { body: (audio ? wav : Buffer.from(JSON.stringify(deck))).toString('base64') } : {}) });
  });
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  async function waitFor(predicate, label) {
    const deadline = Date.now() + 12000;
    while (!await page.evaluate(predicate)) {
      if (Date.now() > deadline) throw new Error(`${label}: ${errors.join('\n')}`);
      await new Promise(resolve => setTimeout(resolve, 80));
    }
  }
  const click = selector => page.evaluate(value => document.querySelector(value)?.click(), selector);
  const button = text => page.evaluate(value => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === value)?.click(), text);
  async function selectCard() {
    const point = await page.evaluate(() => {
      const rect = document.querySelector('.workspace-stage rect[fill="#22d3ee"]').getBoundingClientRect();
      return { x: rect.left + 20, y: rect.top + 20 };
    });
    await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    await waitFor(() => document.querySelector('.reveal-controls')?.textContent.includes('2 selected elements'), 'Grouped selection');
  }
  async function seek(frame) {
    const point = await page.evaluate(f => {
      const ruler = document.querySelector('.timeline-ruler'), rect = ruler.getBoundingClientRect();
      return { x: rect.left + rect.width * f / (Number(ruler.getAttribute('aria-valuemax')) + 1), y: rect.top + rect.height / 2 };
    }, frame);
    await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    await waitFor(() => Boolean(document.querySelector('.workspace-inline-preview rect[fill="#22d3ee"]')), 'Preview');
    await new Promise(resolve => setTimeout(resolve, 100));
    return page.evaluate(() => ({ frame: Number(document.querySelector('.timeline-ruler').getAttribute('aria-valuenow')),
      opacity: Number(document.querySelector('.workspace-inline-preview rect[fill="#22d3ee"]').parentElement.getAttribute('opacity')),
      motion: document.querySelector('.workspace-inline-preview [data-motion-component] [aria-hidden]')?.style.transform }));
  }
  await page.goto({ url: 'http://localhost:3000/editor/reveal-check', timeout: 30000 });
  await waitFor(() => Boolean(document.querySelector('.workspace-stage rect[fill="#22d3ee"]')), 'Fixture loaded');
  await new Promise(resolve => setTimeout(resolve, 300));
  await selectCard(); await button('Choose spoken word');
  await click('button[aria-label="Link word 2: plan at 1.20 seconds"]');
  await waitFor(() => document.querySelectorAll('.timeline-reveal-marker').length === 3, 'Grouped cues');
  assert.equal(await page.evaluate(() => document.querySelector('select[aria-label="Reveal effect"]').value), 'fade');
  await click('button[aria-label="Undo"]');
  await waitFor(() => document.querySelectorAll('.timeline-reveal-marker').length === 1, 'Undo');
  await click('button[aria-label="Redo"]');
  await waitFor(() => document.querySelectorAll('.timeline-reveal-marker').length === 3, 'Redo');
  await selectCard(); await button('Preview reveal');
  await waitFor(() => Boolean(document.querySelector('.workspace-inline-preview')), 'Bounded reveal playback');
  await waitFor(() => Boolean(document.querySelector('button[aria-label="Play preview"]')), 'Reveal playback stops');
  assert.equal(await page.evaluate(() => Number(document.querySelector('.timeline-ruler').getAttribute('aria-valuenow'))), 69);
  const before = await seek(32), at = await seek(33), half = await seek(36), full = await seek(39), late = await seek(80), repeated = await seek(36);
  assert.equal(before.opacity, 0); assert.equal(at.opacity, 0); assert.equal(half.opacity, .4);
  assert.equal(full.opacity, .8); assert.equal(late.opacity, .8); assert.deepEqual(repeated, half);
  assert.notEqual(at.motion, late.motion, 'Motion restarts at reveal and then animates');
  await click('.timeline-reveal-marker');
  await waitFor(() => Boolean(document.querySelector('.reveal-controls')), 'Marker selects element');
  assert.equal(await page.evaluate(() => Number(document.querySelector('.timeline-ruler').getAttribute('aria-valuenow'))), 33);
  await button('Back to editing');
  assert.equal(await page.evaluate(() => document.querySelector('.workspace-stage rect[fill="#22d3ee"]').parentElement.getAttribute('opacity')), '0.8');
  await button('Save');
  await waitFor(() => document.querySelector('button[title="Save to JSON (Ctrl+S)"]')?.textContent.includes('Saved'), 'Save');
  assert.deepEqual(deck.slides[0].elements[0].reveal, deck.slides[0].elements[1].reveal);
  assert.equal(deck.slides[0].elements[0].reveal.duration_ms, 200);
  await page.goto({ url: 'http://localhost:3000/editor/reveal-check', timeout: 30000 });
  await waitFor(() => document.querySelectorAll('.timeline-reveal-marker').length === 3, 'Save/reload');
  await new Promise(resolve => setTimeout(resolve, 300));
  await selectCard(); await button('Change word');
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, 'editor.png'), Buffer.from(screenshot.value.data, 'base64'));
  const saved = structuredClone(deck);
  const incoming = structuredClone(deck.slides[0]);
  incoming.id = 'incoming'; incoming.title = 'Incoming';
  for (const element of incoming.elements) element.reveal = createReveal(n, 0, { offset_ms: -150 });
  deck.slides = [{ id: 'intro', title: 'Intro', background: '#000000', slide_duration: 2,
    transition_type: 'morph', transition_duration: 1, elements: [] }, incoming];
  await page.goto({ url: 'http://localhost:3000/editor/reveal-check', timeout: 30000 });
  await waitFor(() => document.querySelectorAll('.timeline-reveal-marker').length === 3, 'Incoming Morph cues');
  await click('.timeline-reveal-marker');
  await waitFor(() => document.querySelector('.reveal-controls')?.textContent.includes('2 selected elements'), 'Cross-slide marker selects the group');
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(await page.evaluate(() => Number(document.querySelector('.timeline-ruler').getAttribute('aria-valuenow'))), 59);
  assert.equal(await page.evaluate(() => Boolean(document.querySelector('.workspace-inline-preview'))), true);
  deck = structuredClone(saved);
  deck.slides[0].narration.script = deck.slides[0].narration.generated_script = 'Updated narration';
  await page.goto({ url: 'http://localhost:3000/editor/reveal-check', timeout: 30000 });
  await waitFor(() => Boolean(document.querySelector('.timeline-reveal-marker.unresolved')), 'Stale links marked');
  await new Promise(resolve => setTimeout(resolve, 300));
  const unresolved = await seek(32);
  assert.equal(unresolved.opacity, .8, 'Unresolved elements remain fully visible');
  assert.equal(await page.evaluate(() => Boolean(document.querySelector('.reveal-preview-warning'))), true);
  deck = saved;
  assert.deepEqual(errors, []);
  fs.writeFileSync(path.join(output, 'preview-check.json'), JSON.stringify({ before, at, half, full, late, repeated, grouped: true,
    undoRedo: true, saveReload: true, incomingMorphMarker: true, unresolvedWarning: true, errors }, null, 2));
} finally { await browser.close({ silent: true }); }

try {
  const request = path.join(output, 'request.json');
  fs.writeFileSync(request, JSON.stringify({ presentation: deck, assetBase: `http://127.0.0.1:${server.address().port}/assets`, output: path.join(output, 'reveals.mp4') }));
  const child = spawn('node', [path.join(root, 'frontend/scripts/render-narration.mjs'), request], {
    env: { ...process.env, REMOTION_BROWSER_EXECUTABLE: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', chunk => { log += chunk; }); child.stderr.on('data', chunk => { log += chunk; });
  const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); });
  assert.equal(code, 0, log.slice(-4000));
  const python = ['backend/.venv/bin/python', 'backend/.venv-speech/bin/python'].map(file => path.join(root, file)).find(file => fs.existsSync(file)) || 'python3';
  execFileSync(python, [path.join(root, 'backend/scripts/check_reveal_export.py')], { stdio: 'inherit' });
} finally { server.close(); }
