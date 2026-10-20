import { test } from 'node:test';
import assert from 'node:assert/strict';
import { audioBounds, buildTimeline, captionPhrase, narrationReady, morphSlide, canonicalElement, visualAtFrame, motionSlideAtFrame, needsAnimatedExport } from '../src/narration/timeline.js';

const voice = { script: 'Hello world', generated_script: 'Hello world', engine: 'pocket',
  generated_engine: 'pocket', voice_id: 'v', generated_voice_id: 'v', asset_id: 'a'.repeat(64),
  duration_ms: 1201, padding_ms: 400, fit_to_audio: true };

test('Motion clocks restart when later slides become visible, including incoming Morph objects', () => {
  const element = { id: 'widget', type: 'motion_component', motion_data: { component_id: 'typo-marker-highlight' } };
  const slides = [{ id: 'a', elements: [], slide_duration: 4, transition_type: 'morph', transition_duration: 1 },
    { id: 'b', elements: [element], slide_duration: 3, transition_type: 'none' }];
  const { items } = buildTimeline({ slides });
  const appearance = items[0].transition_start;
  assert.equal(motionSlideAtFrame(items, 1, appearance).elements[0].motion_frame, 0);
  assert.equal(motionSlideAtFrame(items, 1, appearance + 10).elements[0].motion_frame, 10);
  const mixed = morphSlide(motionSlideAtFrame(items, 0, appearance + 10), motionSlideAtFrame(items, 1, appearance + 10), .5);
  assert.equal(mixed.elements[0].motion_frame, 10);
  assert.equal(element.motion_frame, undefined, 'Saved element is unchanged');
});

test('Motion-only and narrated exports use the animated renderer', () => {
  assert.equal(needsAnimatedExport({ slides: [{ elements: [{ type: 'motion_component' }] }] }), true);
  assert.equal(needsAnimatedExport({ slides: [{ narration: { script: 'Hello' } }] }), true);
  assert.equal(needsAnimatedExport({ slides: [{ elements: [{ type: 'text' }] }] }), false);
});

test('Morph overlaps the narration boundary without adding frames', () => {
  const result = buildTimeline({ slides: [
    { id: 'a', slide_duration: 3, transition_type: 'morph', transition_duration: .3, narration: voice },
    { id: 'b', slide_duration: 2, transition_type: 'none' },
  ] });
  assert.equal(result.items[0].hold, 49);
  assert.equal(result.items[0].transition, 9);
  assert.equal(result.items[0].transition_start, 45);
  assert.equal(result.items[1].start, 49);
  assert.equal(result.totalFrames, 109);
});

test('Long transitions and manual offsets stay separated on very short slides', () => {
  const slides = Array.from({ length: 4 }, (_, i) => ({ id: `${i}`, transition_type: i === 2 ? 'fade' : 'morph',
    transition_duration: 10, transition_timing: 'manual', transition_offset_ms: i % 2 ? -5000 : 5000,
    narration: { ...voice, duration_ms: 100, padding_ms: 0 } }));
  const { items, totalFrames } = buildTimeline({ slides });
  assert.equal(totalFrames, 12);
  for (let i = 0; i < items.length - 1; i++) {
    assert.ok(items[i].transition_start >= items[i].start);
    assert.ok(items[i].transition_start + items[i].transition <= items[i + 1].start + items[i + 1].hold);
    if (i < items.length - 2) assert.ok(items[i].transition_start + items[i].transition <= items[i + 1].transition_start);
  }
  assert.deepEqual(items.map(item => item.start), [0, 3, 6, 9]);
});

test('Audio trims shift playback without removing caption words, and final padding is omitted', () => {
  const n = { ...voice, duration_ms: 3000, audio_start_ms: 500, audio_end_ms: 2300,
    captions: [{ text: 'Hello', startMs: 700, endMs: 2100 }] };
  assert.deepEqual(audioBounds(n), { audio_from: 15, audio_frames: 54 });
  const { items, totalFrames } = buildTimeline({ slides: [{ narration: n, transition_type: 'none' }] });
  assert.equal(items[0].hold, 54);
  assert.equal(totalFrames, 54);
  const safe = audioBounds({ ...n, audio_start_ms: 1500, audio_end_ms: 1600 });
  assert.ok(safe.audio_from / 30 * 1000 <= 620);
  assert.ok((safe.audio_from + safe.audio_frames) / 30 * 1000 >= 2220);
});

test('Changing Morph duration never changes voice starts or total duration', () => {
  const deck = duration => ({ slides: [0, 1, 2].map(id => ({ id, transition_type: 'morph', transition_duration: duration, narration: voice })) });
  const short = buildTimeline(deck(.2)), long = buildTimeline(deck(2));
  assert.equal(short.totalFrames, long.totalFrames);
  assert.deepEqual(short.items.map(item => item.start), long.items.map(item => item.start));
});

test('Adjusted Morph completes without reverting to the old slide and captions continue across it', () => {
  const n = { ...voice, padding_ms: 0, captions: [{ text: 'Hello', startMs: 0, endMs: 1201 }] };
  const { items } = buildTimeline({ slides: [
    { narration: n, transition_type: 'morph', transition_duration: .4, transition_timing: 'manual', transition_offset_ms: -200 },
    { narration: n, transition_type: 'none' },
  ] });
  const end = items[0].transition_start + items[0].transition;
  assert.equal(visualAtFrame(items, end).index, 1);
  assert.equal(visualAtFrame(items, end).inTransition, false);
  assert.equal(visualAtFrame(items, end - 1).progress, 1);
  const during = items[0].transition_start;
  assert.equal(visualAtFrame(items, during).inTransition, true);
  assert.equal(captionPhrase(n.captions, during / 30 * 1000)[0].text, 'Hello');
});
test('Stale scripts, engines and voices never play old audio', () => {
  assert.equal(narrationReady(voice), true);
  for (const patch of [{ script: 'Different' }, { engine: 'omnivoice' }, { voice_id: 'other' }]) {
    assert.equal(narrationReady({ ...voice, ...patch }), false);
  }
});
test('Manual hold never truncates narration and no-transition adds no time', () => {
  const { items, totalFrames } = buildTimeline({ slides: [
    { slide_duration: .5, narration: { ...voice, fit_to_audio: false }, transition_type: 'none' },
    { slide_duration: 1 },
  ] });
  assert.equal(items[0].hold, 49);
  assert.equal(items[1].start, 49);
  assert.equal(totalFrames, 79);
});
test('Word boundaries are half open and seeking selects the right phrase', () => {
  const words = Array.from({ length: 8 }, (_, i) => ({ text: ` ${i}`, startMs: i * 100, endMs: (i + 1) * 100 }));
  assert.equal(captionPhrase(words, 100, 3)[1].active, true);
  assert.equal(captionPhrase(words, 610, 3)[0].text, ' 6');
  assert.deepEqual(captionPhrase(words, 800), []);
});
test('Morph matches objects, interpolates geometry and fades changed text', () => {
  const a = { background: '#000000', elements: [{ id: 'a', morph_id: 'title', type: 'text', x: 0, content: 'Before' }] };
  const b = { background: '#ffffff', elements: [{ id: 'b', morph_id: 'title', type: 'text', x: 100, content: 'After' }] };
  const middle = morphSlide(a, b, .5);
  assert.equal(middle.elements.length, 2);
  assert.equal(middle.elements[0].x, 50);
  assert.equal(middle.elements[0].opacity, .5);
  assert.equal(middle.elements[1].content, 'After');
});

test('Legacy aliases cannot override interpolated colors or incoming text', () => {
  const a = { background: '#000000', elements: [{ id: 'title', type: 'text', text: 'Before', fill_color: '#000000', text_color: '#000000' }] };
  const b = { background: '#ffffff', elements: [{ id: 'title', type: 'text', text: 'After', fill_color: '#ffffff', text_color: '#ffffff' }] };
  const middle = morphSlide(a, b, .5).elements.map(canonicalElement);
  assert.deepEqual(middle.map(el => el.content), ['Before', 'After']);
  assert.equal(middle[0].font_color, 'rgba(128,128,128,1)');
  assert.equal(middle[0].fill, 'rgba(128,128,128,1)');
});
