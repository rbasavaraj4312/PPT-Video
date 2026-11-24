import React, { useRef, useState } from 'react';
import { CaptionOverlay } from './CaptionOverlay';
import { captionWords } from './timeline';
import { captionGesturePatch, clampCaption as clamp } from './captionPlacement';

export function EditableCaptionOverlay({ narration, timeMs, onChange, onSelect }) {
  const surface = useRef(null), gesture = useRef(null);
  const [draft, setDraft] = useState(null);
  const style = { ...narration.caption_style, ...draft };
  // Keep a caption available for arranging even between spoken phrases.
  const displayTime = captionWords(narration.captions || [], timeMs).length ? timeMs : narration.captions?.[0]?.startMs ?? timeMs;
  function start(event, resize = false) {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation(); onSelect();
    const bounds = surface.current.getBoundingClientRect();
    const text = (resize ? event.currentTarget.parentElement : event.currentTarget).getBoundingClientRect();
    gesture.current = { pointerId: event.pointerId, resize, bounds, startX: event.clientX, startY: event.clientY,
      x: (text.left + text.width / 2 - bounds.left) / bounds.width * 100,
      y: (text.top + text.height / 2 - bounds.top) / bounds.height * 100,
      font: style.font_size || 34, textWidth: Math.max(1, text.width), patch: null };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event) {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointerId) return;
    event.stopPropagation();
    const dx = event.clientX - g.startX, dy = event.clientY - g.startY;
    if (!g.patch && Math.hypot(dx, dy) < 2) return;
    g.patch = captionGesturePatch(g, dx, dy);
    setDraft(g.patch);
  }
  function finish(event, cancel = false) {
    if (!gesture.current) return;
    event.stopPropagation();
    const patch = gesture.current.patch;
    gesture.current = null; setDraft(null);
    if (!cancel && patch) onChange(patch);
  }
  const events = { onPointerMove: move, onPointerUp: finish, onPointerCancel: event => finish(event, true),
    onLostPointerCapture: event => finish(event, true) };
  return <div ref={surface} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
    <CaptionOverlay narration={{ ...narration, caption_style: style }} timeMs={displayTime}
      contentProps={{ ...events, role: 'button', tabIndex: 0, 'aria-label': 'Move caption',
        title: 'Drag to move caption. Drag the corner to resize.', onPointerDown: event => start(event),
        onKeyDown: event => {
          if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
          event.preventDefault(); event.stopPropagation(); onSelect();
          const bounds = surface.current.getBoundingClientRect(), text = event.currentTarget.getBoundingClientRect();
          const step = event.shiftKey ? 5 : 1;
          onChange({ position: 'custom',
            x_percent: clamp((text.left + text.width / 2 - bounds.left) / bounds.width * 100 + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), 0, 100),
            y_percent: clamp((text.top + text.height / 2 - bounds.top) / bounds.height * 100 + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0), 0, 100) });
        }, style: { pointerEvents: 'auto', cursor: 'move', touchAction: 'none', outline: '2px solid #818cf8', outlineOffset: 4 } }}
      controls={<span {...events} role="button" aria-label="Resize caption" onPointerDown={event => start(event, true)}
        style={{ position: 'absolute', right: -10, bottom: -10, width: 14, height: 14, background: '#fff', border: '2px solid #6366f1', borderRadius: 2, cursor: 'nwse-resize', touchAction: 'none', pointerEvents: 'auto' }} />} />
  </div>;
}
