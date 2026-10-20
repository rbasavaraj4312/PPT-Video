import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alignmentTargets, elementBounds, selectionBounds, snapDrag } from '../src/rendering/alignmentGuides.js';

const box = (id, x, y, width = 200, height = 100) => ({ id, type: 'rectangle', x, y, width, height });
const move = (elements, others, dx, dy, options = {}) => snapDrag({ bounds: selectionBounds(elements),
  targets: alignmentTargets(others, 1280, 720), dx, dy, threshold: 7, ...options });

test('Dragging snaps to nearby element edges and centers on both axes', () => {
  const result = move([box('moving', 400, 300)], [box('target', 100, 100)], -296, -196);
  assert.equal(result.dx, -300); assert.equal(result.dy, -200);
  assert.ok(result.guides.some(g => g.axis === 'x' && g.value === 100));
  assert.ok(result.guides.some(g => g.axis === 'y' && g.value === 150));
  assert.ok(result.guides.every(g => Number.isFinite(g.start) && g.end >= g.start));
});

test('Slide edges and center align in landscape and portrait without other elements', () => {
  for (const [width, height] of [[1280, 720], [720, 1280]]) {
    const bounds = selectionBounds([box('moving', 100, 100)]), targets = alignmentTargets([], width, height);
    const centered = snapDrag({ bounds, targets, dx: width / 2 - 200 + 4, dy: height / 2 - 150 - 3, threshold: 7 });
    assert.equal(bounds.left + centered.dx + 100, width / 2);
    assert.equal(bounds.top + centered.dy + 50, height / 2);
    const edge = snapDrag({ bounds, targets, dx: -96, dy: height - 203, threshold: 7 });
    assert.equal(bounds.left + edge.dx, 0); assert.equal(bounds.bottom + edge.dy, height);
  }
});

test('A group snaps as one bounding box, preserving all internal spacing', () => {
  const elements = [box('one', 400, 300, 100, 100), box('two', 550, 330, 50, 50)];
  const result = move(elements, [box('target', 100, 100)], -296, -196);
  assert.equal(result.dx, -300); assert.equal(result.dy, -200);
  const moved = elements.map(e => ({ ...e, x: e.x + result.dx, y: e.y + result.dy }));
  assert.equal(moved[1].x - moved[0].x, 150); assert.equal(moved[1].y - moved[0].y, 30);
});

test('Outside the threshold, and with Alt or guides disabled, movement stays free', () => {
  const elements = [box('moving', 400, 300)];
  const free = move(elements, [], 11, 30);
  assert.deepEqual(free, { dx: 11, dy: 30, guides: [] });
  const disabled = move(elements, [box('target', 100, 100)], -296, -196, { disabled: true });
  assert.deepEqual(disabled, { dx: -296, dy: -196, guides: [] });
});

test('Snap sensitivity stays seven screen pixels across zoom levels', () => {
  for (const zoom of [.25, .5, 1, 2, 3]) {
    const bounds = selectionBounds([box('moving', 400, 300)]), targets = alignmentTargets([], 1280, 720);
    const near = snapDrag({ bounds, targets, dx: 140 + 6 / zoom, dy: 0, threshold: 7 / zoom });
    const far = snapDrag({ bounds, targets, dx: 140 + 8 / zoom, dy: 0, threshold: 7 / zoom });
    assert.equal(near.dx, 140);
    assert.equal(far.dx, 140 + 8 / zoom);
  }
});

test('Images, rotated boxes and reversed lines expose correct visible bounds', () => {
  assert.deepEqual(elementBounds({ ...box('image', 50, 70), type: 'image' }), { left: 50, right: 250, top: 70, bottom: 170 });
  const rotated = elementBounds({ ...box('rotated', 100, 100), rotation: 90 });
  assert.ok(Math.abs(rotated.left - 150) < 1e-6); assert.ok(Math.abs(rotated.top - 50) < 1e-6);
  assert.deepEqual(elementBounds({ ...box('line', 250, 200, -150, -100), type: 'line' }), { left: 100, right: 250, top: 100, bottom: 200 });
});

test('Closest target wins and guides do not accumulate when moving away', () => {
  const elements = [box('moving', 400, 300)];
  const targets = [box('a', 100, 100), box('b', 108, 200)];
  const near = move(elements, targets, -293, 0);
  assert.equal(near.dx, -292);
  assert.ok(near.guides.some(g => g.axis === 'x' && g.value === 108));
  const far = move(elements, targets, -270, 30);
  assert.deepEqual(far.guides, []);
});
