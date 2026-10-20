// Real pointer regression check. Presentation reads/saves are intercepted locally.
import { openBrowser } from '@remotion/renderer';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const output = path.resolve(import.meta.dirname, '../../output/alignment-check');
fs.mkdirSync(output, { recursive: true });
let deck = { id: 'alignment-check', title: 'Alignment check', aspect_ratio: '16:9', slides: [{ id: 'one', title: 'Guides',
  background: '#081321', transition_type: 'none', elements: [
    { id: 'target', type: 'rectangle', x: 100, y: 100, width: 200, height: 150, fill: '#2563eb' },
    { id: 'moving', group_id: 'card', type: 'rectangle', x: 500, y: 350, width: 200, height: 150, fill: '#22d3ee' },
    { id: 'label', group_id: 'card', type: 'text', x: 520, y: 370, width: 100, height: 40, content: 'GROUP', font_size: 24, font_color: '#ffffff' },
  ] }] };
const browser = await openBrowser('chrome', { browserExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', logLevel: 'error' });
try {
  const page = await browser.newPage({ context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
  const client = page._client(), errors = [];
  client.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails.exception?.description || event.exceptionDetails.text));
  await client.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/presentations/alignment-check' }, { urlPattern: '*/api/presentations' }] });
  client.on('Fetch.requestPaused', async event => {
    if (event.request.method === 'POST') deck = JSON.parse(event.request.postData);
    await client.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: event.request.method === 'OPTIONS' ? 204 : 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' }],
      ...(event.request.method === 'OPTIONS' ? {} : { body: Buffer.from(JSON.stringify(deck)).toString('base64') }) });
  });
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  const click = selector => page.evaluate(value => document.querySelector(value)?.click(), selector);
  async function waitFor(predicate, label) {
    const deadline = Date.now() + 10000;
    while (!await page.evaluate(predicate)) {
      if (Date.now() > deadline) throw new Error(`${label}: ${JSON.stringify(await page.evaluate(() => ({
        x: document.querySelector('.workspace-stage rect[fill="#22d3ee"]')?.getAttribute('x'),
        undoDisabled: document.querySelector('button[aria-label="Undo"]')?.disabled,
        redoDisabled: document.querySelector('button[aria-label="Redo"]')?.disabled,
        guides: document.querySelectorAll('[data-alignment-guides] line').length,
      })))} ${errors.join('\n')}`);
      await new Promise(resolve => setTimeout(resolve, 80));
    }
  }
  await page.goto({ url: 'http://localhost:3000/editor/alignment-check', timeout: 30000 });
  await waitFor(() => Boolean(document.querySelector('.workspace-stage rect[fill="#22d3ee"]')), 'Fixture');
  await new Promise(resolve => setTimeout(resolve, 300));
  async function point(x, y) {
    return page.evaluate(({ x, y }) => {
      const rect = document.querySelector('.workspace-stage svg.block').getBoundingClientRect();
      return { x: rect.left + x / 1280 * rect.width, y: rect.top + y / 720 * rect.height };
    }, { x, y });
  }
  async function drag(from, to, modifiers = 0, release = true) {
    await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...await point(...from), button: 'left', clickCount: 1 });
    await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...await point(...to), button: 'left', buttons: 1, modifiers });
    await new Promise(resolve => setTimeout(resolve, 80));
    if (release) await up(to, modifiers);
  }
  async function up(to, modifiers = 0) {
    await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...await point(...to), button: 'left', clickCount: 1, modifiers });
  }
  const geometry = () => page.evaluate(() => {
    const rect = document.querySelector('.workspace-stage rect[fill="#22d3ee"]');
    return { x: Number(rect.getAttribute('x')), y: Number(rect.getAttribute('y')) };
  });
  await drag([600, 450], [204, 204], 0, false);
  assert.deepEqual(await geometry(), { x: 100, y: 100 });
  assert.ok(await page.evaluate(() => document.querySelectorAll('[data-alignment-guides] line').length >= 2));
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, 'guides.png'), Buffer.from(screenshot.value.data, 'base64'));
  await up([204, 204]);
  assert.equal(await page.evaluate(() => Boolean(document.querySelector('[data-alignment-guides]'))), false);
  await waitFor(() => document.querySelector('button[aria-label="Undo"]')?.disabled === false, 'Drag recorded in history');
  await click('button[aria-label="Undo"]');
  await waitFor(() => document.querySelector('.workspace-stage rect[fill="#22d3ee"]').getAttribute('x') === '500', 'Undo group drag');
  await click('button[aria-label="Redo"]');
  await waitFor(() => document.querySelector('.workspace-stage rect[fill="#22d3ee"]').getAttribute('x') === '100', 'Redo group drag');
  await click('button[aria-label="Undo"]');
  await drag([600, 450], [204, 204], 1, false); // CDP Alt modifier.
  assert.deepEqual(await geometry(), { x: 104, y: 104 });
  assert.equal(await page.evaluate(() => Boolean(document.querySelector('[data-alignment-guides]'))), false);
  await up([204, 204], 1);
  await click('button[aria-label="Undo"]');
  await click('button[aria-label="Smart alignment guides"]');
  await drag([600, 450], [204, 204]);
  assert.deepEqual(await geometry(), { x: 104, y: 104 });
  await page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'Save')?.click());
  await waitFor(() => document.querySelector('button[title="Save to JSON (Ctrl+S)"]')?.textContent.includes('Saved'), 'Save');
  assert.equal(deck.slides[0].elements[2].x - deck.slides[0].elements[1].x, 20);
  assert.equal(deck.slides[0].elements[2].y - deck.slides[0].elements[1].y, 20);
  await page.goto({ url: 'http://localhost:3000/editor/alignment-check', timeout: 30000 });
  await waitFor(() => document.querySelector('button[aria-label="Smart alignment guides"]')?.getAttribute('aria-pressed') === 'false', 'Preference reload');
  await waitFor(() => [...document.querySelectorAll('.workspace-stage svg.block text')].some(el => el.textContent === 'GROUP'), 'Saved label reloaded');
  await new Promise(resolve => setTimeout(resolve, 300));
  const textPoint = await page.evaluate(() => {
    const text = [...document.querySelectorAll('.workspace-stage svg.block text')].find(el => el.textContent === 'GROUP');
    const rect = text.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });
  for (const count of [1, 2]) {
    await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...textPoint, button: 'left', clickCount: count });
    await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...textPoint, button: 'left', clickCount: count });
  }
  await waitFor(() => Boolean(document.querySelector('.workspace-stage textarea')), 'Double-click text editing');
  assert.deepEqual(errors, []);
  const report = { snapping: true, liveGuides: true, clearedAfterDrop: true, groupSpacing: true,
    undoRedo: true, altBypass: true, disabledFreeMovement: true, savedPreference: true, textDoubleClick: true, errors };
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close({ silent: true }); }
