// Real Player + MP4 regression check. No saved deck changes or model inference.
import { openBrowser } from '@remotion/renderer';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '../..');
const output = path.join(root, 'output/motion-animation-check');
fs.mkdirSync(output, { recursive: true });
const motion = (id, x, componentId, vars = {}, code) => ({ id, type: 'motion_component', x, y: 200,
  width: 500, height: 180, opacity: 1, motion_data: { component_id: componentId, custom_vars: vars, ...(code ? { code } : {}) } });
const deck = { id: 'motion-animation-check', title: 'Motion animation check', aspect_ratio: '16:9', slides: [
  { id: 'intro', title: 'Intro', slide_duration: 2, transition_type: 'none', background: '#081321', elements: [] },
  { id: 'motion', title: 'Motion', slide_duration: 2, transition_type: 'none', background: '#081321', elements: [
    motion('native', 50, 'typo-marker-highlight', { before: '', highlight: 'ANIMATING', after: '', baseColor: '#ffffff', highlightedTextColor: '#081321', fontSize: 52 }),
    motion('legacy', 700, 'custom-html-probe', {}, '<style>@keyframes motionProbe{from{transform:translateX(0px)}to{transform:translateX(200px)}}.motion-probe{width:70px;height:70px;background:#22d3ee;animation:motionProbe 2s linear infinite}</style><div class="motion-probe"></div>'),
  ] },
] };
const browser = await openBrowser('chrome', { browserExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', logLevel: 'error' });
const errors = [];
try {
  const page = await browser.newPage({ context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
  const client = page._client();
  client.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails.exception?.description || event.exceptionDetails.text));
  await client.send('Fetch.enable', { patterns: [{ urlPattern: `*/api/presentations/${deck.id}` }] });
  client.on('Fetch.requestPaused', async event => {
    await client.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: 200,
      responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' }],
      body: Buffer.from(JSON.stringify(deck)).toString('base64') });
  });
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  await page.goto({ url: `http://localhost:3000/editor/${deck.id}`, timeout: 30000 });
  async function waitFor(predicate) {
    const deadline = Date.now() + 12000;
    while (!await page.evaluate(predicate)) {
      if (Date.now() > deadline) {
        const state = await page.evaluate(() => ({ clock: document.querySelector('.timeline-clock')?.textContent,
          frame: document.querySelector('.timeline-ruler')?.getAttribute('aria-valuenow'),
          preview: Boolean(document.querySelector('.workspace-inline-preview')),
          components: [...document.querySelectorAll('[data-motion-component]')].map(el => el.getAttribute('data-motion-component')),
          text: document.querySelector('.workspace-stage')?.textContent }));
        throw new Error(`UI timeout: ${JSON.stringify(state)} ${errors.join('\n')}`);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  await waitFor(() => Boolean(document.querySelector('.timeline-ruler')));
  await new Promise(resolve => setTimeout(resolve, 300));
  async function seek(frame) {
    const point = await page.evaluate(f => {
      const ruler = document.querySelector('.timeline-ruler');
      const rect = ruler.getBoundingClientRect();
      return { x: rect.left + rect.width * f / (Number(ruler.getAttribute('aria-valuemax')) + 1), y: rect.top + rect.height / 2 };
    }, frame);
    await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
    await waitFor(() => Boolean(document.querySelector('.workspace-inline-preview .motion-probe')));
    await new Promise(resolve => setTimeout(resolve, 150));
    return page.evaluate(() => ({
      frame: Number(document.querySelector('.timeline-ruler').getAttribute('aria-valuenow')),
      native: document.querySelector('.workspace-inline-preview [data-motion-component="typo-marker-highlight"] [aria-hidden]').style.transform,
      legacy: getComputedStyle(document.querySelector('.workspace-inline-preview .motion-probe')).transform,
    }));
  }
  const early = await seek(61), later = await seek(85), repeated = await seek(61);
  assert.equal(early.frame, 61);
  assert.notEqual(early.native, later.native, 'Native motion must animate on the second slide');
  assert.notEqual(early.legacy, later.legacy, 'HTML/CSS motion must animate');
  assert.deepEqual(repeated, early, 'Seeking the same frame must reproduce both animation states');
  assert.deepEqual(errors, []);
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, 'preview.png'), Buffer.from(screenshot.value.data, 'base64'));
  fs.writeFileSync(path.join(output, 'preview-check.json'), JSON.stringify({ early, later, repeated, errors }, null, 2));
} finally { await browser.close({ silent: true }); }

const request = path.join(output, 'request.json');
fs.writeFileSync(request, JSON.stringify({ presentation: deck, assetBase: '', output: path.join(output, 'motion-check.mp4') }));
const child = spawn('node', [path.join(root, 'frontend/scripts/render-narration.mjs'), request], {
  env: { ...process.env, REMOTION_BROWSER_EXECUTABLE: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', chunk => { log += chunk; }); child.stderr.on('data', chunk => { log += chunk; });
const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); });
assert.equal(code, 0, log.slice(-4000));
const python = ['backend/.venv-speech/bin/python', 'backend/.venv/bin/python'].map(file => path.join(root, file)).find(file => fs.existsSync(file)) || 'python3';
execFileSync(python, [path.join(root, 'backend/scripts/check_motion_export.py')], { stdio: 'inherit' });
console.log(JSON.stringify({ previewPassed: true, export: path.join(output, 'motion-check.mp4') }));
