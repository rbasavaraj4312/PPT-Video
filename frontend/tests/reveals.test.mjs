import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, motionSlideAtFrame, morphSlide, needsAnimatedExport } from '../src/narration/timeline.js';
import { createReveal, fingerprint, resolveReveal, revealOpacity, revealIssues } from '../src/narration/reveals.js';
import { exportNarratedVideo } from '../src/services/speech.js';

const narration = () => ({ script: 'Plan plan launch.', generated_script: 'Plan plan launch.', engine: 'omnivoice', generated_engine: 'omnivoice',
  voice_id: 'voice', generated_voice_id: 'voice', asset_id: 'a'.repeat(64), duration_ms: 3000, audio_start_ms: 100, audio_end_ms: 2900,
  captions: [{ text: 'Plan', startMs: 200, endMs: 600 }, { text: ' plan', startMs: 1200, endMs: 1600 }, { text: ' launch.', startMs: 2200, endMs: 2600 }], caption_style: { enabled: false } });
function fixture(effect = 'fade') {
  const n = narration(), element = { id: 'card', type: 'rectangle', x: 0, y: 0, width: 100, height: 100, opacity: .4, reveal: createReveal(n, 1, { effect }) };
  const deck = { slides: [{ id: 'one', title: 'Plan', narration: n, elements: [element], transition_type: 'none' }] };
  return { deck, element, n, items: buildTimeline(deck).items };
}

test('Appear uses the exact linked occurrence and trimmed audio frame, then stays visible', () => {
  const { element, items } = fixture('appear'), resolved = resolveReveal(items, 0, element);
  assert.equal(resolved.trigger, 33);
  assert.equal(revealOpacity(resolved, 32), 0);
  assert.equal(revealOpacity(resolved, 33), 1);
  assert.equal(revealOpacity(resolved, 80), 1);
  assert.equal(element.reveal.word_index, 1);
});

test('Fade preserves original opacity, works without captions displayed, and scrubs deterministically', () => {
  const { items } = fixture();
  const opacity = frame => {
    const el = motionSlideAtFrame(items, 0, frame).elements[0];
    return el.opacity * el._reveal_opacity;
  };
  assert.equal(opacity(32), 0);
  assert.equal(opacity(33), 0);
  assert.equal(opacity(36), .2);
  assert.equal(opacity(39), .4);
  assert.equal(opacity(80), .4);
  assert.equal(opacity(36), .2);
});

test('Voice regeneration and timestamp corrections reuse anchors when words and script match', () => {
  const { deck, element, n } = fixture('appear');
  n.asset_id = 'b'.repeat(64);
  n.captions[1].startMs = 1400;
  const resolved = resolveReveal(buildTimeline(deck).items, 0, element);
  assert.equal(resolved.valid, true);
  assert.equal(resolved.trigger, 39);
});

test('Changed scripts, word sequences, and invalid indices require relinking and remain visible', () => {
  for (const change of [n => { n.script = n.generated_script = 'New script'; }, n => n.captions.unshift({ text: 'Extra', startMs: 0, endMs: 100 }),
    n => { n.captions[1].text = 'changed'; }]) {
    const { deck, element, n } = fixture(); change(n);
    const items = buildTimeline(deck).items, resolved = resolveReveal(items, 0, element);
    assert.equal(resolved.valid, false);
    assert.equal(revealOpacity(resolved, 0), 1);
    assert.equal(revealIssues(items).length, 1);
  }
  const { items, element } = fixture(); element.reveal.word_index = 99;
  assert.equal(resolveReveal(items, 0, element).valid, false);
});

test('Missing narration and out-of-view offsets remain saveable but invalid for playback/export', () => {
  const { deck, element, n } = fixture();
  element.reveal = createReveal(n, 0, { offset_ms: -500 });
  assert.match(resolveReveal(buildTimeline(deck).items, 0, element).issue, /visible interval/);
  delete deck.slides[0].narration;
  assert.match(resolveReveal(buildTimeline(deck).items, 0, element).issue, /Generate/);
  assert.equal(needsAnimatedExport(deck), true);
});

test('Motion components start their internal animation at the reveal', () => {
  const { items, element } = fixture('appear'); element.type = 'motion_component';
  assert.equal(motionSlideAtFrame(items, 0, 33).elements[0].motion_frame, 0);
  assert.equal(motionSlideAtFrame(items, 0, 43).elements[0].motion_frame, 10);
});

test('Morph keeps outgoing and incoming reveal gates independent at the same interpolated geometry', () => {
  const { deck, n, element } = fixture('appear');
  element.reveal = createReveal(n, 0, { effect: 'appear' });
  deck.slides[0].transition_type = 'morph'; deck.slides[0].transition_duration = 1;
  deck.slides.push({ id: 'two', elements: [{ ...element, x: 200, reveal: createReveal(n, 2) }], narration: n });
  const { items } = buildTimeline(deck), frame = items[0].transition_start + 5;
  const result = morphSlide(motionSlideAtFrame(items, 0, frame), motionSlideAtFrame(items, 1, frame), .5);
  assert.equal(result.elements.length, 2);
  assert.equal(result.elements[0].x, result.elements[1].x);
  assert.deepEqual(result.elements.map(el => el._reveal_opacity), [1, 0]);
});

test('Reveal edits do not change duration or narration start times; deleting cues removes warnings', () => {
  const { deck } = fixture(); const before = buildTimeline(deck);
  deck.slides[0].elements[0].reveal.offset_ms = 500;
  const after = buildTimeline(deck);
  assert.equal(before.totalFrames, after.totalFrames);
  assert.deepEqual(before.items.map(item => item.start), after.items.map(item => item.start));
  deck.slides[0].elements = [];
  assert.deepEqual(revealIssues(buildTimeline(deck).items), []);
});

test('Invalid reveal export is rejected before any generation or rendering request', async t => {
  const { deck, n } = fixture(); n.captions[0].text = 'Different';
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Network must not run'); });
  await assert.rejects(exportNarratedVideo(deck), /Needs relinking/);
});

test('Fingerprints normalize Unicode word anchors consistently', () => {
  assert.equal(fingerprint(''), '811c9dc5');
  const n = narration(); n.captions[0].text = ' CAFÉ';
  const cue = createReveal(n, 0); n.captions[0].text = 'cafe\u0301';
  const items = buildTimeline({ slides: [{ narration: n, elements: [] }] }).items;
  assert.equal(resolveReveal(items, 0, { reveal: cue }).valid, true);
});

test('First-frame appearances, Fade transitions and Morph to always-visible elements preserve independent states', () => {
  const { deck, n, element } = fixture('appear');
  element.reveal = createReveal(n, 0, { effect: 'appear', offset_ms: -100 });
  assert.equal(revealOpacity(resolveReveal(buildTimeline(deck).items, 0, element), 0), 1);
  deck.slides[0].transition_type = 'fade'; deck.slides[0].transition_duration = 1;
  deck.slides.push({ id: 'two', elements: [{ ...element, reveal: createReveal(n, 1, { effect: 'appear' }) }], narration: n });
  const { items } = buildTimeline(deck), frame = items[0].transition_start + 5;
  const outgoing = motionSlideAtFrame(items, 0, frame), incoming = motionSlideAtFrame(items, 1, frame);
  assert.equal(outgoing.elements[0]._reveal_opacity, 1);
  assert.equal(incoming.elements[0]._reveal_opacity, 0);
  delete deck.slides[1].elements[0].reveal;
  const layers = morphSlide(outgoing, motionSlideAtFrame(items, 1, frame), .5).elements;
  assert.equal(layers.length, 2);
  assert.equal(layers[0]._reveal_opacity, 1);
  assert.equal(layers[1]._reveal_opacity, undefined);
});
