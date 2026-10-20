import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cropImagePatch, normalizedCrop } from '../src/rendering/imageModel.js';
import { morphSlide } from '../src/narration/timeline.js';

test('Image crop bounds stay valid and applying crop preserves proportions and center', () => {
  assert.deepEqual(normalizedCrop({ x: .9, y: -1, width: .5, height: .5 }), { x: .5, y: 0, width: .5, height: .5 });
  const element = { width: 400, height: 200, y: 100, image_width: 800, image_height: 400 };
  const patch = cropImagePatch(element, { x: .5, width: .5 });
  assert.equal(patch.height, 400);
  assert.equal(patch.y + patch.height / 2, element.y + element.height / 2);
});

test('Morph interpolates crop and cross-fades replacement image sources', () => {
  const a = { background: '#fff', elements: [{ id: 'image', type: 'image', image_src: 'first', image_crop: { x: 0, y: 0, width: 1, height: 1 } }] };
  const b = { background: '#fff', elements: [{ ...a.elements[0], image_crop: { x: .5, y: 0, width: .5, height: 1 } }] };
  const middle = morphSlide(a, b, .5);
  assert.deepEqual(middle.elements[0].image_crop, { x: .25, y: 0, width: .75, height: 1 });
  b.elements[0].image_src = 'replacement';
  const crossfade = morphSlide(a, b, .5);
  assert.equal(crossfade.elements.length, 2);
  assert.deepEqual(crossfade.elements.map(element => element.image_src), ['first', 'replacement']);
});
