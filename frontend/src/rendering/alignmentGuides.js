// Editor-only geometry. Thresholds are supplied in slide units by the canvas.
export function elementBounds(element) {
  const { x = 0, y = 0, width = 0, height = 0 } = element;
  let w = Math.abs(width), h = Math.abs(height);
  const cx = x + width / 2, cy = y + height / 2;
  if (element.type !== 'line' && element.type !== 'arrow') {
    const radians = (element.rotation || 0) * Math.PI / 180;
    const cos = Math.abs(Math.cos(radians)), sin = Math.abs(Math.sin(radians));
    [w, h] = [w * cos + h * sin, w * sin + h * cos];
  }
  return { left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
}

export function selectionBounds(elements) {
  const boxes = elements.map(elementBounds);
  return { left: Math.min(...boxes.map(b => b.left)), right: Math.max(...boxes.map(b => b.right)),
    top: Math.min(...boxes.map(b => b.top)), bottom: Math.max(...boxes.map(b => b.bottom)) };
}

export function alignmentTargets(elements, width, height) {
  return [{ left: 0, top: 0, right: width, bottom: height, slide: true }, ...elements.map(elementBounds)];
}

const anchors = (box, axis) => axis === 'x'
  ? [box.left, (box.left + box.right) / 2, box.right]
  : [box.top, (box.top + box.bottom) / 2, box.bottom];

export function snapDrag({ bounds, targets, dx, dy, threshold, disabled = false }) {
  if (disabled) return { dx, dy, guides: [] };
  const moved = { left: bounds.left + dx, right: bounds.right + dx, top: bounds.top + dy, bottom: bounds.bottom + dy };
  function correction(axis) {
    let best = null;
    const moving = anchors(moved, axis);
    for (const target of targets) anchors(target, axis).forEach((value, targetIndex) => {
      moving.forEach((point, index) => {
        const delta = value - point, distance = Math.abs(delta);
        // Equal-distance matches prefer like anchors (center/center, edge/edge).
        const priority = index === targetIndex ? 0 : 1;
        if (distance <= threshold && (!best || distance < best.distance - 1e-7 ||
            (Math.abs(distance - best.distance) < 1e-7 && priority < best.priority))) best = { delta, distance, priority };
      });
    });
    return best?.delta ?? 0;
  }
  const cx = correction('x'), cy = correction('y');
  const snapped = { left: moved.left + cx, right: moved.right + cx, top: moved.top + cy, bottom: moved.bottom + cy };
  const guides = [];
  for (const axis of ['x', 'y']) {
    const values = new Map();
    for (const target of targets) for (const value of anchors(target, axis)) {
      if (!anchors(snapped, axis).some(point => Math.abs(point - value) < .001)) continue;
      const start = axis === 'x' ? Math.min(snapped.top, target.top) : Math.min(snapped.left, target.left);
      const end = axis === 'x' ? Math.max(snapped.bottom, target.bottom) : Math.max(snapped.right, target.right);
      const key = value.toFixed(3), previous = values.get(key);
      values.set(key, { axis, value, start: Math.min(start, previous?.start ?? start), end: Math.max(end, previous?.end ?? end) });
    }
    guides.push(...values.values());
  }
  return { dx: dx + cx, dy: dy + cy, guides };
}
