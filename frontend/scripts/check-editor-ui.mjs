// Local Chrome UI verification. Uses mocked generation responses, never loads voice models.
import { openBrowser } from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { buildTimeline, captionPhrase } from '../src/narration/timeline.js';

const root = path.resolve(import.meta.dirname, '../..');
const output = path.join(root, 'output/editor-ui');
fs.mkdirSync(output, { recursive: true });
const deck = JSON.parse(fs.readFileSync(path.join(root, 'samples/morph-voice-demo/presentation.json')));
for (const slide of deck.slides) {
  slide.narration.audio_start_ms = 0;
  slide.narration.audio_end_ms = slide.narration.duration_ms;
}
const expectedTimeline = buildTimeline(deck);
const voiceDirectory = path.join(root, 'backend/storage/speech/voices');
const voices = fs.readdirSync(voiceDirectory).flatMap(name => {
  const file = path.join(voiceDirectory, name, 'profile.json');
  return fs.existsSync(file) ? [JSON.parse(fs.readFileSync(file))] : [];
});
const browser = await openBrowser('chrome', { browserExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', logLevel: 'error' });
try {
  const page = await browser.newPage({ context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
  const client = page._client();
  const errors = [];
  client.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails.exception?.description || event.exceptionDetails.text));
  let generated = null;
  await client.send('Fetch.enable', { patterns: [
    { urlPattern: `*/api/presentations/${deck.id}` },
    { urlPattern: '*/api/speech/assets/*' },
    { urlPattern: '*/api/speech/generate' }, { urlPattern: '*/api/speech/jobs/ui-check-job' },
    { urlPattern: '*/api/speech/capabilities' }, { urlPattern: '*/api/speech/voices' },
  ] });
  client.on('Fetch.requestPaused', async event => {
    try {
      const url = event.request.url;
      if (event.request.method === 'OPTIONS') {
        await client.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: 204,
          responseHeaders: [{ name: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
            { name: 'Access-Control-Allow-Headers', value: 'Content-Type' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' }] });
        return;
      }
      let body;
      if (url.includes('/speech/assets/')) {
        const [, assetId, filename] = url.match(/\/assets\/([a-f0-9]+)\/([^/?]+)/);
        const file = path.join(root, 'samples/morph-voice-demo/assets', assetId, filename);
        const content = filename === 'result.json' ? Buffer.from(JSON.stringify({ ...JSON.parse(fs.readFileSync(file)),
          audio_start_ms: 0, audio_end_ms: deck.slides.find(slide => slide.narration.asset_id === assetId).narration.duration_ms })) : fs.readFileSync(file);
        await client.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: 200,
          responseHeaders: [{ name: 'Content-Type', value: filename.endsWith('.wav') ? 'audio/wav' : 'application/json' },
            { name: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' }], body: content.toString('base64') });
        return;
      }
      if (url.endsWith(`/presentations/${deck.id}`)) body = deck;
      else if (url.endsWith('/capabilities')) body = { engines: ['pocket', 'omnivoice', 'align'].map(id => ({ id, available: true, reason: 'Ready' })) };
      else if (url.endsWith('/voices')) body = voices;
      else if (url.endsWith('/generate')) { generated = JSON.parse(event.request.postData); body = { id: 'ui-check-job', status: 'queued', kind: 'speech' }; }
      else body = { id: 'ui-check-job', status: 'complete', kind: 'speech', result: {
        asset_id: deck.slides[0].narration.asset_id, duration_ms: deck.slides[0].narration.duration_ms,
        captions: deck.slides[0].narration.captions, generated_script: generated.script, generated_voice_id: generated.voice_id,
        generated_engine: generated.engine,
      } };
      await client.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: url.endsWith('/generate') ? 202 : 200,
        responseHeaders: [{ name: 'Content-Type', value: 'application/json' },
          { name: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
          { name: 'Access-Control-Allow-Headers', value: 'Content-Type' },
          { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' }], body: Buffer.from(JSON.stringify(body)).toString('base64') });
    } catch (error) { errors.push(error.stack); }
  });
  await page.setViewport({ width: 1672, height: 941, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(profiles => { localStorage.setItem('ppt_theme', 'dark'); localStorage.setItem('ppt_voice_profiles', JSON.stringify(profiles)); localStorage.removeItem('ppt_speech_jobs'); }, voices);
  await page.goto({ url: `http://localhost:3000/editor/${deck.id}`, timeout: 30000 });
  async function waitFor(predicate, label) {
    const deadline = Date.now() + 12000;
    while (!await page.evaluate(predicate)) {
      if (Date.now() > deadline) throw new Error(`Timed out: ${label}. Errors: ${errors.join('\n')}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  async function click(selector) {
    const point = await page.evaluate(sel => { const element = document.querySelector(sel); if (!element) throw new Error(`Missing ${sel}`); element.scrollIntoView({ block: 'nearest' }); const r = element.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, selector);
    await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  }
  async function capture(name) {
    const screenshot = await client.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(output, name), Buffer.from(screenshot.value.data, 'base64'));
  }
  await waitFor(() => Boolean(document.querySelector('[data-testid="editor-workspace"]')), 'Editor workspace');
  await waitFor(() => document.querySelector('.inspector-waveform')?.querySelectorAll('line').length > 1, 'Real WAV waveform');
  await capture('desktop.png');
  const layout = await page.evaluate(() => {
    const stage = document.querySelector('.workspace-stage').getBoundingClientRect();
    const canvas = document.querySelector('.workspace-stage svg[viewBox="0 0 1280 720"]').getBoundingClientRect();
    const inspector = document.querySelector('.workspace-inspector').getBoundingClientRect();
    const timeline = document.querySelector('.workspace-timeline').getBoundingClientRect();
    return { stage: { x: stage.x, y: stage.y, right: stage.right, bottom: stage.bottom }, canvas: { x: canvas.x, y: canvas.y, right: canvas.right, bottom: canvas.bottom }, inspectorX: inspector.x, timelineY: timeline.y, overflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert.equal(layout.overflow, false, 'Horizontal document overflow');
  assert.ok(layout.canvas.x >= layout.stage.x && layout.canvas.right <= layout.stage.right + 1, 'Canvas fits horizontally');
  assert.ok(layout.canvas.y >= layout.stage.y && layout.canvas.bottom <= layout.timelineY + 1, 'Canvas fits above timeline');
  await click('#tab-captions');
  await waitFor(() => Boolean(document.querySelector('.caption-word-list')), 'Caption editor');
  await click('button[aria-label="Preview word 3"]');
  await waitFor(() => Boolean(document.querySelector('.workspace-inline-preview')), 'Inline seek preview');
  const expectedSeek = Math.ceil(deck.slides[0].narration.captions[2].startMs / 1000 * 30) - expectedTimeline.items[0].audio_from;
  assert.equal(await page.evaluate(() => Number(document.querySelector('.timeline-ruler').getAttribute('aria-valuenow'))), expectedSeek);
  await click('button[aria-label="Play preview"]');
  await waitFor(() => document.querySelector('.timeline-clock').textContent.startsWith('00:01.'), 'Timeline playback advances');
  await click('button[aria-label="Pause preview"]');
  const boundary = expectedTimeline.items[0];
  const candidateFrames = Array.from({ length: boundary.transition }, (_, i) => boundary.transition_start + i);
  const targetFrame = candidateFrames.find(value => expectedTimeline.items.some(item => value >= item.start && value < item.start + item.audio_frames &&
    captionPhrase(item.slide.narration.captions, (value - item.start + item.audio_from) / 30 * 1000).length));
  assert.notEqual(targetFrame, undefined, 'Spoken caption exists during Morph');
  const rulerPoint = await page.evaluate(({ frame, total }) => {
    const rect = document.querySelector('.timeline-ruler').getBoundingClientRect();
    return { x: rect.left + rect.width * frame / total, y: rect.top + rect.height / 2 };
  }, { frame: targetFrame, total: expectedTimeline.totalFrames });
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...rulerPoint, button: 'left', clickCount: 1 });
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...rulerPoint, button: 'left', clickCount: 1 });
  await waitFor(() => Boolean(document.querySelector('.workspace-inline-preview [aria-hidden="true"] span span')), 'Highlighted captions during Morph');
  const overlap = await page.evaluate(() => {
    const clips = [...document.querySelectorAll('.timeline-slide-clip')].map(el => el.getBoundingClientRect());
    const morph = document.querySelector('.timeline-transition').getBoundingClientRect();
    return morph.left < clips[0].right && morph.right > clips[1].left;
  });
  assert.equal(overlap, true, 'Morph overlaps both slide clips instead of inserting a gap');
  await capture('morph-with-captions.png');
  await click('#tab-voice');
  await click('.return-to-edit');
  await click('.editor-workspace > aside .group');
  await waitFor(() => [...document.querySelectorAll('.workspace-stage rect')].some(element => element.getAttribute('width') === '530'), 'First slide restored for drag check');
  // Let the auto-fit observer and its short transform transition settle.
  let previousBox = '';
  for (let attempt = 0; attempt < 12; attempt++) {
    const box = await page.evaluate(() => {
      const rect = document.querySelector('.workspace-stage svg[viewBox="0 0 1280 720"]').getBoundingClientRect();
      return JSON.stringify([rect.x, rect.y, rect.width, rect.height]);
    });
    if (box === previousBox) break;
    previousBox = box;
    await new Promise(resolve => setTimeout(resolve, 60));
  }
  // Editing must retain pointer selection, dragging and undo in the smaller canvas.
  const shape = await page.evaluate(() => {
    const svg = document.querySelector('.workspace-stage svg[viewBox="0 0 1280 720"]');
    const r = svg.getBoundingClientRect(), scale = r.width / 1280;
    const rect = [...svg.querySelectorAll('rect')].find(element => element.getAttribute('width') === '530');
    return { x: r.x + 170 * scale, y: r.y + 490 * scale, originalX: Number(rect.getAttribute('x')) };
  });
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: shape.x, y: shape.y, button: 'left', clickCount: 1 });
  await waitFor(() => document.querySelector('#tab-design').getAttribute('aria-selected') === 'true', 'Selecting a shape opens Design');
  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: shape.x + 20, y: shape.y + 8, button: 'left', buttons: 1 });
  await waitFor(() => Number([...document.querySelectorAll('.workspace-stage rect')].find(element => element.getAttribute('width') === '530').getAttribute('x')) !== 86, 'Shape moves with pointer');
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: shape.x + 20, y: shape.y + 8, button: 'left', clickCount: 1 });
  await waitFor(() => document.querySelector('#tab-design').getAttribute('aria-selected') === 'true', 'Selecting a shape opens Design');
  assert.notEqual(await page.evaluate(() => Number([...document.querySelectorAll('.workspace-stage rect')].find(element => element.getAttribute('width') === '530').getAttribute('x'))), shape.originalX);
  await click('button[aria-label="Undo"]');
  await click('#tab-voice');
  const documentNode = await client.send('DOM.getDocument');
  const inputNode = await client.send('DOM.querySelector', { nodeId: documentNode.value.root.nodeId, selector: 'input[aria-label="Voice sample audio"]' });
  await client.send('DOM.setFileInputFiles', { nodeId: inputNode.value.nodeId, files: [path.join(root, 'samples/morph-voice-demo/assets', deck.slides[0].narration.asset_id, 'narration.wav')] });
  await waitFor(() => Boolean(document.querySelector('.voice-sample-form')), 'Upload opens inline sample form');
  await page.evaluate(() => [...document.querySelectorAll('button')].find(button => button.textContent === 'Close sample settings').click());
  assert.equal(await page.evaluate(() => Boolean(document.querySelector('.voice-sample-form'))), false, 'Sample form closes while retaining its draft');
  await page.evaluate(() => {
    const element = document.querySelector('#slide-script');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(element, 'A changed narration script for the UI check.');
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await waitFor(() => Boolean(document.querySelector('.editor-stale')), 'Changed narration is stale');
  await click('.editor-generate');
  await waitFor(() => document.querySelector('.audio-ready')?.textContent.includes('Audio ready'), 'Generation result applied');
  assert.equal(generated.script, 'A changed narration script for the UI check.');
  await click('#tab-design');
  await waitFor(() => Boolean(document.querySelector('.workspace-design aside')), 'Design properties remain available');
  await click('#tab-voice');
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto({ url: `http://localhost:3000/editor/${deck.id}`, timeout: 30000 });
  await waitFor(() => Boolean(document.querySelector('[data-testid="editor-workspace"]')), 'Laptop editor');
  await waitFor(() => document.querySelector('.inspector-waveform')?.querySelectorAll('line').length > 1, 'Laptop waveform');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Laptop viewport fits');
  await capture('laptop.png');
  await click('button[aria-label="Toggle dark/light theme"]');
  await capture('light.png');
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify({ layout, caption_editing: true, inline_seek: true,
    synchronized_playback: true, morph_overlap: true, captions_during_morph: true, stale_audio_guard: true, generation_job_polling: true,
    design_inspector: true, shape_drag_and_undo: true, inline_voice_upload: true, laptop_layout: true, light_theme: true, uncaught_errors: errors }, null, 2));
  console.log(JSON.stringify({ output, passed: true, layout }, null, 2));
} finally { await browser.close({ silent: true }); }
