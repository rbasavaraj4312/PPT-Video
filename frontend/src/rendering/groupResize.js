// All members use the same affine transform, with the opposite corner fixed.
export function resizeGroup(elements, bounds, handle, dx, dy) {
  const west = handle.includes('w'), north = handle.includes('n');
  const vx = (bounds.right - bounds.left) * (west ? -1 : 1);
  const vy = (bounds.bottom - bounds.top) * (north ? -1 : 1);
  const lengthSquared = vx * vx + vy * vy;
  const scale = Math.max(0.01, lengthSquared ? 1 + (dx * vx + dy * vy) / lengthSquared : 1);
  const anchorX = west ? bounds.right : bounds.left;
  const anchorY = north ? bounds.bottom : bounds.top;
  return elements.map(element => {
    const resized = { ...element,
      x: anchorX + (element.x - anchorX) * scale,
      y: anchorY + (element.y - anchorY) * scale,
      width: element.width * scale,
      height: element.height * scale,
      visual_scale: (element.visual_scale ?? 1) * scale,
    };
    for (const field of ['font_size', 'stroke_width', 'radius']) {
      if (typeof element[field] === 'number') resized[field] = element[field] * scale;
    }
    // Keep legacy endpoint aliases consistent for save/reload and exports.
    resized.x1 = resized.x;
    resized.y1 = resized.y;
    resized.x2 = resized.x + resized.width;
    resized.y2 = resized.y + resized.height;
    return resized;
  });
}

// Restore the original local geometry inside a scaled SVG group. This also
// scales fixed renderer details such as arrowheads, dash lengths and icon gaps.
export function unscaledElement(element) {
  const scale = element.visual_scale;
  const local = { ...element, x: 0, y: 0, width: element.width / scale,
    height: element.height / scale, visual_scale: 1 };
  for (const field of ['font_size', 'stroke_width', 'radius']) {
    if (typeof element[field] === 'number') local[field] = element[field] / scale;
  }
  return local;
}
