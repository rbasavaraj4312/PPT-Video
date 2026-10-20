import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportNarratedVideo } from '../src/services/speech.js';

const script = 'Hello world';
const presentation = { title: 'Narrated demo', slides: [{ title: 'Opening', narration: {
  script, generated_script: script, engine: 'pocket', generated_engine: 'pocket',
  voice_id: 'voice-a', generated_voice_id: 'voice-a', asset_id: 'a'.repeat(64), duration_ms: 1200,
} }] };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('Narrated export polls the job and downloads only after completion', async t => {
  const calls = [], progress = [], events = [];
  const responses = [
    json({ id: 'job-demo', status: 'queued', phase: 'Queued' }),
    json({ id: 'job-demo', status: 'running', phase: 'Rendering', progress: 60 }),
    json({ id: 'job-demo', status: 'complete', phase: 'Ready' }),
    new Response(new Blob(['sample mp4'], { type: 'video/mp4' })),
  ];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    assert.ok(responses.length, 'Unexpected network call');
    return responses.shift();
  });
  const originalDocument = globalThis.document;
  t.after(() => { if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument; });
  const link = { click() { events.push('click'); }, remove() { events.push('remove'); } };
  globalThis.document = { createElement: () => link, body: { appendChild: () => events.push('append') } };
  await exportNarratedVideo(presentation, { pollInterval: 0, onProgress: job => progress.push(job.status) });
  assert.deepEqual(calls.map(call => call.url), [
    '/api/speech/render', '/api/speech/jobs/job-demo', '/api/speech/jobs/job-demo', '/api/speech/jobs/job-demo/video',
  ]);
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body), presentation);
  assert.deepEqual(progress, ['queued', 'running', 'complete']);
  assert.deepEqual(events, ['append', 'click', 'remove']);
  assert.equal(link.download, 'Narrated_demo_1080p_30fps.mp4');
});

test('Stale narration is rejected before queuing a render', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected request'); });
  const stale = structuredClone(presentation);
  stale.slides[0].narration.script = 'Edited script';
  await assert.rejects(exportNarratedVideo(stale), /Generate current narration for "Opening"/);
  assert.equal(fetch.mock.callCount(), 0);
});

for (const status of ['failed', 'cancelled']) {
  test(`${status} render stops polling without downloading a video`, async t => {
    const responses = [json({ id: 'job-demo', status: 'queued' }),
      json({ id: 'job-demo', status, ...(status === 'failed' ? { error: 'Chrome could not start' } : {}) })];
    const fetch = t.mock.method(globalThis, 'fetch', async () => responses.shift());
    await assert.rejects(exportNarratedVideo(presentation, { pollInterval: 0 }),
      status === 'failed' ? /Chrome could not start/ : /cancelled/);
    assert.equal(fetch.mock.callCount(), 2);
  });
}

test('Server validation errors reach the export dialog', async t => {
  t.mock.method(globalThis, 'fetch', async () => json({ detail: 'Narration metadata does not match audio.' }, 400));
  await assert.rejects(exportNarratedVideo(presentation), /Narration metadata does not match audio/);
});

test('A failed video download is reported after a completed render', async t => {
  const responses = [json({ id: 'job-demo', status: 'complete' }), json({ detail: 'Video file missing' }, 404)];
  t.mock.method(globalThis, 'fetch', async () => responses.shift());
  await assert.rejects(exportNarratedVideo(presentation), /Video file missing/);
});
