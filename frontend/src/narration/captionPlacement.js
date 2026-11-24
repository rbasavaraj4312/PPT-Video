export const clampCaption = (value, min, max) => Math.max(min, Math.min(max, value));

// Screen-space deltas and bounds share the canvas zoom, so percentages do not.
export function captionGesturePatch(gesture, dx, dy) {
  return gesture.resize
    ? { font_size: clampCaption(Math.round(gesture.font * (1 + 2 * dx / gesture.textWidth)), 16, 160) }
    : { position: 'custom', x_percent: clampCaption(gesture.x + dx / gesture.bounds.width * 100, 0, 100),
      y_percent: clampCaption(gesture.y + dy / gesture.bounds.height * 100, 0, 100) };
}
