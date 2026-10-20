import { test } from 'node:test';
import assert from 'node:assert/strict';
import { narrationImportText, applyNarrationImport } from '../src/narration/importState.js';
import { narrationReady } from '../src/narration/timeline.js';

function fixture() {
  const narration = { script: 'Original explanation.', generated_script: 'Original explanation.', engine: 'pocket', generated_engine: 'pocket',
    voice_id: 'my-voice', generated_voice_id: 'my-voice', asset_id: 'a'.repeat(64), duration_ms: 2000,
    caption_style: { enabled: false }, captions: [{ text: 'Original', startMs: 0, endMs: 1000 }] };
  return { id: 'existing', slides: [{ id: 'one', title: 'Existing name', background: '#123456', narration,
    elements: [{ id: 'picture', type: 'image', image_src: 'data:my-picture', reveal: { word_index: 0 } }] },
    { id: 'blank', title: 'Not narrated', elements: [] },
    { id: 'three', title: 'Third', narration: { script: 'Third explanation.' }, elements: [{ id: 'card' }] }] };
}
const draft = scripts => ({ slides: scripts.map(script => ({ id: 'new-' + script, title: 'Reviewed name',
  elements: [{ id: 'new-design' }], narration: { script, engine: 'omnivoice', voice_id: '' } })) });

test('Opening narration import preloads current scripts with their actual slide numbers', () => {
  assert.equal(narrationImportText(fixture()), 'Slide 1:\nOriginal explanation.\n\nSlide 3:\nThird explanation.');
  assert.equal(narrationImportText({ slides: [{ id: 'blank' }] }), '');
});

test('Updating existing narration keeps designs, IDs, voices, captions and reveal links', () => {
  const deck = fixture();
  const updated = applyNarrationImport(deck, draft(['Changed explanation.']), 'update', { sourceIds: ['one', 'blank', 'three'], numbers: [1] });
  assert.equal(updated.slides.length, 3); assert.equal(updated.slides[0].id, 'one');
  assert.equal(updated.slides[0].elements, deck.slides[0].elements);
  assert.equal(updated.slides[0].background, '#123456');
  assert.equal(updated.slides[0].narration.voice_id, 'my-voice');
  assert.equal(updated.slides[0].narration.caption_style.enabled, false);
  assert.equal(updated.slides[0].narration.asset_id, 'a'.repeat(64));
  assert.equal(narrationReady(updated.slides[0].narration), false);
  assert.equal(updated.slides[1], deck.slides[1]);
});

test('Unchanged narration retains current audio; numbers remain linked after slide reorder', () => {
  const deck = fixture(); deck.slides.reverse();
  const updated = applyNarrationImport(deck, draft(['Original explanation.']), 'update', { sourceIds: ['one', 'blank', 'three'], numbers: [1] });
  assert.equal(updated.slides[2].id, 'one');
  assert.equal(narrationReady(updated.slides[2].narration), true);
  assert.equal(updated.slides[0], deck.slides[0]);
});

test('New numbers append slides and omitted existing slides remain intact', () => {
  const deck = fixture();
  const updated = applyNarrationImport(deck, draft(['New scene']), 'update', { sourceIds: ['one', 'blank', 'three'], numbers: [4], voiceId: 'new-voice' });
  assert.equal(updated.slides.length, 4); assert.equal(updated.slides[0], deck.slides[0]);
  assert.equal(updated.slides[3].narration.voice_id, 'new-voice');
});

test('Append and replace only occur when explicitly selected', () => {
  const deck = fixture(), incoming = draft(['New scene']);
  assert.equal(applyNarrationImport(deck, incoming, 'append').slides.length, 4);
  assert.equal(applyNarrationImport(deck, incoming, 'replace').slides.length, 1);
});
