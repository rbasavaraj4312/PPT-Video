import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareVoiceBatch, applyBatchResults, latestBatchRows } from '../src/narration/batchState.js';

const n = script => ({ script, engine: 'omnivoice', voice_id: 'voice', captions: [], caption_style: { enabled: false } });
const fixture = () => ({ id: 'deck', slides: [{ id: 'a', narration: n('First.') }, { id: 'b', narration: n('Second.') }, { id: 'empty', elements: [] }] });
const result = script => ({ asset_id: 'a'.repeat(64), duration_ms: 1000, generated_script: script, generated_engine: 'omnivoice', generated_voice_id: 'voice', captions: [{ text: script, startMs: 0, endMs: 1000 }] });
const row = (id, script, status = 'complete') => ({ slide_id: id, script, engine: 'omnivoice', voice_id: 'voice', job: { status, result: result(script) } });

test('Batch generation skips blank and current narration and only queues changed slides', () => {
  const deck = fixture(); Object.assign(deck.slides[0].narration, result('First.'));
  const prepared = prepareVoiceBatch(deck, { applyToAll: false });
  assert.deepEqual(prepared.tasks.map(task => task.slide_id), ['b']);
  assert.equal(prepared.presentation.slides[0].narration.caption_style.enabled, false);
  const changed = prepareVoiceBatch(deck, { voiceId: 'new-voice', engine: 'pocket' });
  assert.deepEqual(changed.tasks.map(task => task.slide_id), ['a', 'b']);
  assert.equal(deck.slides[0].narration.voice_id, 'voice');
});

test('Per-slide retries snapshot current scripts and respect existing individual voices', () => {
  const deck = fixture(); deck.slides[1].narration.script = 'Edited after failure';
  const { tasks } = prepareVoiceBatch(deck, { slideIds: ['b'], applyToAll: false });
  assert.deepEqual(tasks, [{ slide_id: 'b', script: 'Edited after failure', voice_id: 'voice', engine: 'omnivoice' }]);
  deck.slides[1].narration.voice_id = '';
  assert.throws(() => prepareVoiceBatch(deck, { applyToAll: false }), /Choose a voice for slide 2/);
});

test('Recovered batch results attach by slide id after reorder and preserve caption settings', () => {
  const deck = fixture(); deck.slides.reverse();
  const applied = applyBatchResults(deck, { presentation_id: 'deck', slides: [row('a', 'First.'), row('b', 'Second.', 'failed')] });
  assert.equal(applied.slides.find(s => s.id === 'a').narration.asset_id, 'a'.repeat(64));
  assert.equal(applied.slides.find(s => s.id === 'a').narration.caption_style.enabled, false);
  assert.equal(applied.slides.find(s => s.id === 'b').narration.asset_id, undefined);
  assert.equal(applyBatchResults(applied, { presentation_id: 'deck', slides: [row('a', 'First.')] }), applied);
});

test('Late batch results cannot overwrite changed scripts, changed voices, deleted slides or another deck', () => {
  for (const edit of [deck => { deck.id = 'other'; }, deck => { deck.slides[0].narration.script = 'Edited'; },
    deck => { deck.slides[0].narration.voice_id = 'other'; }, deck => { deck.slides.shift(); }]) {
    const deck = fixture(); edit(deck);
    assert.equal(applyBatchResults(deck, { presentation_id: 'deck', slides: [row('a', 'First.')] }), deck);
  }
  const deck = fixture(), bad = row('a', 'Different requested script');
  bad.job.result = result('First.');
  assert.equal(applyBatchResults(deck, { presentation_id: 'deck', slides: [bad] }), deck);
});

test('A retry replaces the failed status only for its own slide', () => {
  const rows = latestBatchRows([{ slides: [row('a', 'First.'), row('b', 'Second.', 'failed')] }, { slides: [row('b', 'Second.', 'queued')] }]);
  assert.equal(rows.get('a').job.status, 'complete'); assert.equal(rows.get('b').job.status, 'queued');
});

test('Recovering an older batch never replaces newer current audio or corrected captions', () => {
  const deck = fixture(); Object.assign(deck.slides[0].narration, result('First.'), { asset_id: 'b'.repeat(64) });
  deck.slides[0].narration.captions[0].startMs = 150;
  assert.equal(applyBatchResults(deck, { presentation_id: 'deck', slides: [row('a', 'First.')] }), deck);
  assert.equal(deck.slides[0].narration.captions[0].startMs, 150);
});
