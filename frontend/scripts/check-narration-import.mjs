// Isolated browser workflow; real draft builder, simulated speech jobs, no inference.
import { openBrowser } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '../..'), output = path.join(root, 'output/narration-import-check');
fs.mkdirSync(output, { recursive: true });
const python = path.join(root, 'backend/.venv-speech/bin/python');
let deck = { id: 'narration-import-check', title: 'Narration import check', aspect_ratio: '16:9', slides: [{ id: 'blank', title: 'Blank', background: '#081321', elements: [] }] };
const voice = 'voice-' + 'a'.repeat(32), batches = new Map(), submitted = [];
let finishThird = false, saves = 0;
const wav = Buffer.alloc(44 + 24000 * 3 * 2);
wav.write('RIFF'); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
function result(task, index) {
  return { generated_script: task.script.trim(), generated_voice_id: task.voice_id, generated_engine: task.engine,
    asset_id: String(index + 1).repeat(64), duration_ms: 3000, audio_start_ms: 0, audio_end_ms: 3000,
    captions: [{ text: task.script.split(/\s+/)[0], startMs: 0, endMs: 1000 }] };
}
function state(batch) {
  const first = submitted[0]?.id === batch.id;
  const rows = batch.slides.map((task, index) => ({ ...task, job_id: `job-${batch.id}-${index}`, job: {
    id: `job-${batch.id}-${index}`, status: first && index === 1 ? 'failed' : first && index === 2 && !finishThird ? 'running' : 'complete',
    phase: first && index === 1 ? 'Failed' : first && index === 2 && !finishThird ? 'Generating speech' : 'Ready',
    error: first && index === 1 ? 'Synthetic generation failure' : null, result: result(task, index),
  } }));
  return { id: batch.id, presentation_id: batch.presentation_id, slides: rows, finished: rows.every(row => row.job.status !== 'running') };
}
const browser = await openBrowser('chrome', { browserExecutable: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', logLevel: 'error' });
try {
  const page = await browser.newPage({ context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => {} });
  const client = page._client(), errors = [];
  client.on('Runtime.exceptionThrown', event => errors.push(event.exceptionDetails.exception?.description || event.exceptionDetails.text));
  await client.send('Fetch.enable', { patterns: [{ urlPattern: '*/api/*' }] });
  client.on('Fetch.requestPaused', async event => {
    const url = new URL(event.request.url), method = event.request.method;
    const body = event.request.postData ? JSON.parse(event.request.postData) : null;
    let response = [], status = 200, audio = false;
    if (method === 'OPTIONS') response = null;
    else if (url.pathname.endsWith('/narration-draft/parse')) {
      response = JSON.parse(execFileSync(python, ['-c', 'import json,sys; from backend.app.services.narration_draft import parse_narration; print(json.dumps(dict(slides=[s.model_dump() for s in parse_narration(json.load(sys.stdin)["text"])])))'], { cwd: root, input: JSON.stringify(body) }));
    } else if (url.pathname.endsWith('/narration-draft/build')) {
      response = JSON.parse(execFileSync(python, ['-c', 'import json,sys; from backend.app.services.narration_draft import build_draft,DraftBuildRequest; print(build_draft(DraftBuildRequest.model_validate(json.load(sys.stdin))).model_dump_json())'], { cwd: root, input: JSON.stringify(body) }));
    } else if (url.pathname === '/api/presentations' && method === 'POST') { deck = body; saves++; response = deck; }
    else if (url.pathname === '/api/presentations/' + deck.id) response = deck;
    else if (url.pathname.endsWith('/speech/voices')) response = [{ id: voice, name: 'Test voice' }];
    else if (url.pathname.endsWith('/speech/capabilities')) response = { engines: ['omnivoice', 'pocket', 'align'].map(id => ({ id, available: true })) };
    else if (url.pathname.endsWith('/speech/batches') && method === 'POST') {
      assert.ok(saves > 0, 'Draft saved before jobs are queued');
      if (!batches.has(body.id)) { batches.set(body.id, body); submitted.push(body); }
      response = state(batches.get(body.id));
    } else if (url.pathname.includes('/speech/batches/')) {
      const batch = batches.get(url.pathname.split('/').at(-1));
      if (batch) response = state(batch); else { status = 404; response = { detail: 'Voice batch not found' }; }
    } else if (url.pathname.endsWith('.wav') || url.pathname.endsWith('/reference')) audio = true;
    await client.send('Fetch.fulfillRequest', { requestId: event.requestId, responseCode: method === 'OPTIONS' ? 204 : status,
      responseHeaders: [{ name: 'Content-Type', value: audio ? 'audio/wav' : 'application/json' }, { name: 'Access-Control-Allow-Origin', value: 'http://localhost:3000' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,DELETE,OPTIONS' }],
      ...(method === 'OPTIONS' ? {} : { body: (audio ? wav : Buffer.from(JSON.stringify(response))).toString('base64') }) });
  });
  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  async function waitFor(predicate, label) {
    const deadline = Date.now() + 14000;
    while (!await page.evaluate(predicate)) {
      if (Date.now() > deadline) throw new Error(`${label}: ${await page.evaluate(() => document.querySelector('.workspace-inspector')?.textContent)} ${errors.join('\n')}`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  const click = selector => page.evaluate(value => document.querySelector(value)?.click(), selector);
  const button = text => page.evaluate(value => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === value)?.click(), text);
  async function save() {
    const before = saves;
    await click('button[title="Save to JSON (Ctrl+S)"]');
    const deadline = Date.now() + 5000;
    while (saves === before) {
      if (Date.now() > deadline) throw new Error('Save request did not arrive');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    await waitFor(() => document.querySelector('button[title="Save to JSON (Ctrl+S)"]')?.textContent.includes('Saved'), 'Save finished');
  }
  async function field(selector, value) {
    await page.evaluate(({ selector, value }) => {
      const element = document.querySelector(selector);
      const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
      element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
    }, { selector, value });
  }
  await page.goto({ url: `http://localhost:3000/editor/${deck.id}`, timeout: 30000 });
  await waitFor(() => Boolean(document.querySelector('.workspace-stage')) && document.body.textContent.includes('Narration import check'), 'Editor');
  await new Promise(resolve => setTimeout(resolve, 300));
  await click('button[aria-label="Narration to slides"]');
  await waitFor(() => Boolean(document.querySelector('#all-slide-narration')), 'Narration import');
  await page.evaluate(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['Slide 1:\nUploaded narration remains intact.'], 'narration.txt', { type: 'text/plain' }));
    const input = document.querySelector('input[aria-label="Import narration file"]');
    input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await waitFor(() => document.querySelector('#all-slide-narration').value.includes('Uploaded narration remains intact.'), 'Text file import');
  await button('Use example'); await button('Review slide draft');
  await waitFor(() => document.querySelectorAll('.narration-draft-row').length === 3, 'Review parsed draft');
  await field('input[aria-label="Slide 1 draft title"]', 'Start with a clear idea');
  const draftShot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, 'review.png'), Buffer.from(draftShot.value.data, 'base64'));
  assert.equal(submitted.length, 0);
  await button('Create 3 slides');
  await waitFor(() => document.querySelector('.workspace-status')?.textContent.includes('of 3'), 'Three editable slides');
  await click('button[aria-label="Undo"]');
  await waitFor(() => document.querySelector('.workspace-status')?.textContent.includes('of 1'), 'Undo import');
  await click('button[aria-label="Redo"]');
  await waitFor(() => document.querySelector('.workspace-status')?.textContent.includes('of 3'), 'Redo import');
  await click('button[aria-label="Refresh saved voices"]');
  await waitFor(() => document.querySelector('#saved-voice')?.textContent.includes('Test voice'), 'Saved voices');
  await field('#saved-voice', voice);
  await button('Generate all voices');
  await waitFor(() => document.querySelector('.narration-batch-panel')?.textContent.includes('1/3 ready'), 'First job applied');
  assert.equal(submitted.length, 1); assert.equal(submitted[0].slides.length, 3);
  assert.equal(deck.slides[0].narration.script.startsWith('Every successful'), true);
  assert.equal(deck.slides[0].title, 'Start with a clear idea');
  await page.goto({ url: `http://localhost:3000/editor/${deck.id}`, timeout: 30000 });
  await waitFor(() => document.querySelector('.narration-batch-panel')?.textContent.includes('1/3 ready'), 'Batch recovered after refresh');
  assert.equal(submitted.length, 1, 'Refresh does not submit duplicate work');
  await page.evaluate(() => document.querySelectorAll('.narration-batch-row>button:first-child')[2].click());
  await waitFor(() => document.querySelector('#slide-script')?.value.startsWith('Bring the pieces'), 'Third slide selected');
  await field('#slide-script', 'Edited while the original voice job was running. Keep this exact explanation.');
  finishThird = true;
  await waitFor(() => [...document.querySelectorAll('button')].some(el => el.textContent.trim() === 'Retry failed slides (1)' && !el.disabled), 'Queue finished with retry');
  assert.equal(await page.evaluate(() => document.querySelector('#slide-script').value), 'Edited while the original voice job was running. Keep this exact explanation.');
  await button('Retry failed slides (1)');
  await waitFor(() => document.querySelector('.narration-batch-panel')?.textContent.includes('2/3 ready'), 'Only failed slide retried');
  assert.equal(submitted[1].slides.length, 1); assert.equal(submitted[1].slides[0].slide_id, deck.slides[1].id);
  await button('Generate changed slide');
  await waitFor(() => document.querySelector('.narration-batch-panel')?.textContent.includes('3/3 ready'), 'Edited slide generated');
  assert.equal(submitted[2].slides.length, 1); assert.ok(submitted[2].slides[0].script.startsWith('Edited while'));
  await save();
  assert.ok(deck.slides.every(slide => slide.narration.asset_id));
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, 'editor.png'), Buffer.from(shot.value.data, 'base64'));
  const originalElements = JSON.stringify(deck.slides.map(slide => slide.elements));
  await click('button[aria-label="Narration to slides"]');
  await waitFor(() => Boolean(document.querySelector('#all-slide-narration')), 'Append narration');
  const existing = await page.evaluate(() => document.querySelector('#all-slide-narration').value);
  assert.ok(existing.includes('Slide 1:\nEvery successful project'));
  assert.ok(existing.includes('Slide 3:\nEdited while the original'));
  await field('#all-slide-narration', existing.replace('Every successful project', 'A successful project'));
  await button('Review slide draft');
  await waitFor(() => document.querySelectorAll('.narration-draft-row').length === 3, 'Existing narration review');
  assert.equal(await page.evaluate(() => document.querySelector('select[aria-label="Narration import destination"]').value), 'update');
  await button('Update narration');
  await waitFor(() => !document.querySelector('[aria-labelledby="narration-import-title"]'), 'Narration updated');
  await save();
  assert.equal(deck.slides.length, 3);
  assert.equal(JSON.stringify(deck.slides.map(slide => slide.elements)), originalElements);
  assert.ok(deck.slides[0].narration.script.startsWith('A successful project'));
  await click('button[aria-label="Narration to slides"]');
  await waitFor(() => Boolean(document.querySelector('#all-slide-narration')), 'Append new narration');
  await field('#all-slide-narration', 'One additional explanation without headings.');
  await button('Review slide draft');
  await waitFor(() => document.querySelectorAll('.narration-draft-row').length === 1, 'One-slide draft');
  await field('select[aria-label="Narration import destination"]', 'append');
  await button('Create 1 slides');
  await waitFor(() => document.querySelector('.workspace-status')?.textContent.includes('of 4'), 'Append preserves existing slides');
  await save();
  assert.ok(deck.slides.slice(0, 3).every(slide => slide.narration.asset_id));
  assert.equal(deck.slides[3].narration.script, 'One additional explanation without headings.');
  assert.equal(submitted.length, 3, 'Importing more slides never starts speech');
  deck = { id: 'narration-portrait-check', title: 'Portrait import check', aspect_ratio: '9:16',
    slides: [{ id: 'portrait-blank', title: 'Blank', elements: [] }] };
  await page.goto({ url: `http://localhost:3000/editor/${deck.id}`, timeout: 30000 });
  await waitFor(() => document.body.textContent.includes('Portrait import check') && Boolean(document.querySelector('.workspace-stage')), 'Portrait editor');
  await new Promise(resolve => setTimeout(resolve, 300));
  await click('button[aria-label="Narration to slides"]');
  await waitFor(() => Boolean(document.querySelector('#all-slide-narration')), 'Portrait import');
  await field('#all-slide-narration', 'Slide 1:\nStart with one clear idea. Build a practical plan. Launch with confidence.');
  await button('Review slide draft');
  await waitFor(() => document.querySelectorAll('.narration-draft-row').length === 1, 'Portrait review');
  await button('Create 1 slides');
  await waitFor(() => document.querySelector('.workspace-stage svg.block')?.getAttribute('viewBox') === '0 0 720 1280' && document.querySelectorAll('.workspace-stage svg.block rect').length > 3, 'Portrait layout');
  await new Promise(resolve => setTimeout(resolve, 300));
  const portrait = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(output, 'portrait.png'), Buffer.from(portrait.value.data, 'base64'));
  assert.deepEqual(errors, []);
  const report = { importedSlides: 3, editableReview: true, undoRedo: true, savedBeforeQueue: true,
    refreshRecovery: true, duplicateJobs: false, guardedLateResult: true, failedOnlyRetry: true,
    changedOnlyRetry: true, existingNarrationPrefilled: true, updatePreservesDesigns: true,
    textFileImport: true, appendPreservesAudio: true, portraitLayout: true, speechInference: false, errors };
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close({ silent: true }); }
