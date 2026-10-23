import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resizeGroup, unscaledElement } from '../src/rendering/groupResize.js';
import { selectionBounds } from '../src/rendering/alignmentGuides.js';
import { morphSlide } from '../src/narration/timeline.js';

const elements = [
  { id: 'box', type: 'rounded_rectangle', x: 100, y: 100, width: 200, height: 100,
    font_size: 24, stroke_width: 4, radius: 16, rotation: 30, group_id: 'g', text: 'Keep this layout' },
  { id: 'arrow', type: 'arrow', x: 450, y: 250, width: -150, height: -100,
    stroke_width: 2, arrow_head: 'both', group_id: 'g' },
  { id: 'image', type: 'image', x: 460, y: 100, width: 40, height: 60,
    image_crop: { x: .1, y: .2, width: .5, height: .5 }, flip_x: true, group_id: 'g' },
];
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test('Every corner shrinks all geometry and styles uniformly around the opposite corner', () => {
  const bounds = selectionBounds(elements);
  for (const handle of ['nw', 'ne', 'sw', 'se']) {
    const west = handle.includes('w'), north = handle.includes('n');
    const dx = (bounds.right - bounds.left) * (west ? .5 : -.5);
    const dy = (bounds.bottom - bounds.top) * (north ? .5 : -.5);
    const result = resizeGroup(elements, bounds, handle, dx, dy);
    const anchorX = west ? bounds.right : bounds.left;
    const anchorY = north ? bounds.bottom : bounds.top;
    result.forEach((el, index) => {
      const original = elements[index];
      close(el.x, anchorX + (original.x - anchorX) / 2);
      close(el.y, anchorY + (original.y - anchorY) / 2);
      close(el.width, original.width / 2); close(el.height, original.height / 2);
      close(el.x2, el.x + el.width); close(el.y2, el.y + el.height);
      assert.equal(el.group_id, original.group_id);
      assert.equal(el.rotation, original.rotation);
      assert.equal(el.visual_scale, .5);
    });
    assert.equal(result[0].font_size, 12); assert.equal(result[0].radius, 8);
    assert.equal(result[1].stroke_width, 1);
    assert.deepEqual(result[2].image_crop, elements[2].image_crop);
    const scaledBounds = selectionBounds(result);
    close(west ? scaledBounds.right : scaledBounds.left, anchorX);
    close(north ? scaledBounds.bottom : scaledBounds.top, anchorY);
  }
});

test('Local renderer geometry stays identical, including implicit defaults and motion layouts', () => {
  const bounds = selectionBounds(elements);
  const result = resizeGroup(elements, bounds, 'se', -(bounds.right - bounds.left) / 2, -(bounds.bottom - bounds.top) / 2);
  result.forEach((element, index) => {
    const local = unscaledElement(element), original = elements[index];
    for (const field of ['width', 'height', 'font_size', 'stroke_width', 'radius']) {
      assert.equal(local[field], original[field]);
    }
  });
  assert.equal(elements[0].font_size, 24, 'Original snapshots must remain untouched');
});

test('Enlarging again restores positions and fractional styles without rounding drift', () => {
  const bounds = selectionBounds(elements);
  const small = resizeGroup(elements, bounds, 'se', -(bounds.right - bounds.left) * .7, -(bounds.bottom - bounds.top) * .7);
  const smallerBounds = selectionBounds(small);
  const factor = 1 / .3 - 1;
  const restored = resizeGroup(small, smallerBounds, 'se', (smallerBounds.right - smallerBounds.left) * factor, (smallerBounds.bottom - smallerBounds.top) * factor);
  restored.forEach((el, index) => {
    for (const field of ['x', 'y', 'width', 'height']) close(el[field], elements[index][field]);
    close(el.visual_scale, 1);
  });
});

test('Crossing the fixed corner and zero-length groups never flip or produce invalid geometry', () => {
  const result = resizeGroup(elements, selectionBounds(elements), 'se', -10000, -10000);
  assert.ok(result.every(el => el.visual_scale > 0 && Number.isFinite(el.x)));
  assert.ok(result[1].width < 0, 'Reversed arrows keep direction');
  const point = [{ id: 'point', type: 'line', x: 10, y: 20, width: 0, height: 0 }];
  assert.equal(resizeGroup(point, selectionBounds(point), 'se', 50, 50)[0].visual_scale, 1);
});

test('Morph interpolates implicit and explicit visual scale in either direction', () => {
  const from = { elements: [elements[0]], background: '#fff' };
  const to = { elements: [{ ...elements[0], visual_scale: .5 }], background: '#fff' };
  close(morphSlide(from, to, .5).elements[0].visual_scale, .75);
  close(morphSlide(to, from, 1).elements[0].visual_scale, 1);
});
