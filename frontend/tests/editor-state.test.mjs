import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyNarrationResult, editorTimeline, narrationStatus, slideAtFrame, slideNarration, wavPeaks } from '../src/narration/editorState.js';

const narration = { script: 'Hello world', engine: 'pocket', voice_id: 'voice-a', generated_script: 'Hello world',
  generated_engine: 'pocket', generated_voice_id: 'voice-a', asset_id: 'a'.repeat(64), duration_ms: 1200, padding_ms: 400 };

test('Job completion updates only the requested slide and preserves caption preferences', () => {
  const deck = { id: 'deck', slides: [{ id: 'one', narration: { ...narration, caption_style: { enabled: false } } }, { id: 'two', narration }] };
  const result = { ...narration, duration_ms: 1600 };
  const updated = applyNarrationResult(deck, { presentationId: 'deck', slideId: 'one' }, result);
  assert.equal(updated.slides[0].narration.duration_ms, 1600);
  assert.equal(updated.slides[0].narration.caption_style.enabled, false);
  assert.equal(updated.slides[1], deck.slides[1]);
  assert.equal(deck.slides[0].narration.duration_ms, 1200);
});

test('Late voice results cannot overwrite edits or attach to another deck', () => {
  const tracked = { presentationId: 'deck', slideId: 'one' };
  for (const patch of [{ script: 'Changed' }, { engine: 'omnivoice' }, { voice_id: 'other' }]) {
    const deck = { id: 'deck', slides: [{ id: 'one', narration: { ...narration, ...patch } }] };
    assert.equal(applyNarrationResult(deck, tracked, narration).slides[0], deck.slides[0]);
  }
  const other = { id: 'other', slides: [{ id: 'one', narration }] };
  assert.equal(applyNarrationResult(other, tracked, narration), other);
});

test('Timeline selection follows the narration boundary during Morph', () => {
  const { items } = editorTimeline({ slides: [
    { id: 'one', narration, transition_type: 'morph', transition_duration: .5 },
    { id: 'two', slide_duration: 3, transition_type: 'none' },
  ] });
  assert.equal(items[0].hold, 48);
  assert.equal(items[1].start, 48);
  assert.equal(slideAtFrame(items, 47), 0);
  assert.equal(slideAtFrame(items, 48), 1);
  assert.equal(slideAtFrame(items, -10), 0);
  assert.equal(slideAtFrame(items, 9999), 1);
});

test('Voice status reflects stale audio and default caption preferences preserve old decks', () => {
  assert.equal(slideNarration({}).engine, 'omnivoice');
  assert.equal(slideNarration({ narration }).engine, 'pocket');
  assert.equal(narrationStatus({ narration }), 'Voice ready');
  assert.equal(narrationStatus({ narration: { ...narration, script: 'Edited' } }), 'Needs update');
  assert.equal(narrationStatus({ narration: { script: 'New' } }), 'Not generated');
  assert.equal(narrationStatus({}), 'Add narration');
  assert.equal(slideNarration({ narration: { caption_style: { enabled: false } } }).caption_style.highlight_words, true);
  assert.equal(slideNarration({ narration: { caption_style: { enabled: false } } }).caption_style.enabled, false);
});

test('Waveforms use actual signed PCM16 sample amplitudes and skip unknown WAV chunks', () => {
  const buffer = new ArrayBuffer(68), view = new DataView(buffer);
  function tag(offset, text) { [...text].forEach((letter, index) => view.setUint8(offset + index, letter.charCodeAt(0))); }
  tag(0, 'RIFF'); view.setUint32(4, 60, true); tag(8, 'WAVE');
  tag(12, 'JUNK'); view.setUint32(16, 4, true);
  tag(24, 'fmt '); view.setUint32(28, 16, true); view.setUint16(32, 1, true); view.setUint16(34, 1, true); view.setUint16(46, 16, true);
  tag(48, 'data'); view.setUint32(52, 12, true);
  [0, 16384, -32768, 8192, -16384, 0].forEach((sample, index) => view.setInt16(56 + index * 2, sample, true));
  assert.deepEqual(wavPeaks(buffer, 3), [.5, 1, .5]);
  assert.throws(() => wavPeaks(new ArrayBuffer(20)), /Unsupported audio/);
});
