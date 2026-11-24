import { test } from 'node:test';
import assert from 'node:assert/strict';
import { captionGesturePatch } from '../src/narration/captionPlacement.js';

test('Caption dragging follows the same slide distance at different canvas zooms', () => {
  for (const zoom of [0.2, 0.75, 1, 3]) {
    assert.deepEqual(captionGesturePatch({ x: 50, y: 50, bounds: { width: 1280 * zoom, height: 720 * zoom } }, 128 * zoom, -72 * zoom),
      { position: 'custom', x_percent: 60, y_percent: 40 });
  }
});

test('Caption placement stays within slide bounds and resize respects supported sizes', () => {
  assert.deepEqual(captionGesturePatch({ x: 50, y: 50, bounds: { width: 720, height: 1280 } }, 2000, -2000),
    { position: 'custom', x_percent: 100, y_percent: 0 });
  const gesture = { resize: true, font: 40, textWidth: 200 };
  assert.equal(captionGesturePatch(gesture, 50, 0).font_size, 60);
  assert.equal(captionGesturePatch(gesture, -200, 0).font_size, 16);
  assert.equal(captionGesturePatch(gesture, 2000, 0).font_size, 160);
});
