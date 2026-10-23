/** @typedef {import('@remotion/captions').Caption} Caption */
import { canonicalElement } from '../rendering/elementModel.js';
import { normalizedCrop } from '../rendering/imageModel.js';
import { resolveReveal, revealOpacity } from './reveals.js';
export { canonicalElement };
export const narrationReady = (n) => Boolean(n?.asset_id && n.duration_ms > 0 &&
  n.generated_script === n.script?.trim() && n.generated_engine === n.engine &&
  n.generated_voice_id === n.voice_id);

export const needsAnimatedExport = presentation => (presentation?.slides || []).some(slide =>
  slide.narration?.script?.trim() || slide.elements?.some(element => element.type === 'motion_component' || element.reveal));

export function motionSlideAtFrame(items, index, frame, fps = 30) {
  const item = items[index];
  const previous = items[index - 1];
  const origin = previous?.transition > 0 ? previous.transition_start : item.start;
  return { ...item.slide, elements: item.slide.elements.map(element => {
    const resolved = resolveReveal(items, index, element, fps);
    return { ...canonicalElement(element),
      ...(element.reveal ? { _reveal_opacity: revealOpacity(resolved, frame), _reveal_binding: JSON.stringify([item.slide.id, element.reveal]) } : {}),
      ...(element.type === 'motion_component' ? { motion_frame: Math.max(0, frame - (element.reveal && resolved.valid ? resolved.trigger : origin)) } : {}) };
  }) };
}

export function audioBounds(n, fps = 30) {
  const duration = Math.max(1, Math.ceil(n.duration_ms / 1000 * fps));
  let from = Math.max(0, Math.floor((n.audio_start_ms ?? 0) / 1000 * fps));
  let to = Math.min(duration, Math.ceil((n.audio_end_ms ?? n.duration_ms) / 1000 * fps));
  // Edited caption timings must never cause spoken words to be clipped.
  const words = n.captions || [];
  if (words.length) {
    from = Math.min(from, Math.max(0, Math.floor((Math.min(...words.map(w => w.startMs)) - 80) / 1000 * fps)));
    to = Math.max(to, Math.min(duration, Math.ceil((Math.max(...words.map(w => w.endMs)) + 120) / 1000 * fps)));
  }
  if (from >= to) return { audio_from: 0, audio_frames: duration };
  return { audio_from: from, audio_frames: to - from };
}

export function buildTimeline(presentation, fps = 30) {
  let cursor = 0;
  const slides = presentation?.slides || [];
  const items = slides.map((slide, index) => {
    const n = slide.narration;
    const narrated = narrationReady(n) && Boolean(n.script?.trim());
    let hold = Math.max(1, Math.ceil(Math.max(500, Number(slide.slide_duration ?? 3) * 1000) / 1000 * fps));
    if (narrated) {
      const bounds = audioBounds(n, fps);
      const audioHold = bounds.audio_frames + (index < slides.length - 1 ? Math.ceil((n.padding_ms ?? 200) / 1000 * fps) : 0);
      hold = n.fit_to_audio !== false ? audioHold : Math.max(hold, audioHold);
    }
    const item = { start: cursor, hold, transition: 0, transition_start: cursor + hold, slide, narrated,
      ...(narrated ? audioBounds(n, fps) : { audio_from: 0, audio_frames: 0 }) };
    cursor += hold;
    return item;
  });
  items.forEach((item, index) => {
    const next = items[index + 1];
    if (!next || (item.slide.transition_type || 'morph') === 'none') return;
    // Reserve half of each scene for either adjacent transition. Long Morphs
    // shorten instead of colliding or inserting silence into the audio track.
    const lower = item.start + Math.ceil(item.hold / 2);
    const upper = next.start + Math.floor(next.hold / 2);
    const requested = Math.ceil(Math.max(0, item.slide.transition_duration ?? 1) * fps);
    item.transition = Math.min(requested, upper - lower);
    const offset = item.slide.transition_timing === 'manual' ? (item.slide.transition_offset_ms ?? 0) / 1000 * fps : 0;
    item.transition_start = Math.max(lower, Math.min(upper - item.transition, Math.round(next.start + offset - item.transition / 2)));
  });
  return { items, totalFrames: Math.max(1, cursor) };
}

export function captionPhrase(captions, timeMs, size = 6) {
  const active = captions.findIndex(c => timeMs >= c.startMs && timeMs < c.endMs);
  if (active < 0) return [];
  const offset = Math.floor(active / size) * size;
  return captions.slice(offset, offset + size).map((c, i) => ({ ...c, active: offset + i === active }));
}

export function visualAtFrame(items, frame) {
  const boundary = items.findIndex(item => item.transition > 0 && frame >= item.transition_start && frame < item.transition_start + item.transition);
  if (boundary >= 0) return { index: boundary, inTransition: true,
    progress: (frame - items[boundary].transition_start + 1) / items[boundary].transition };
  const index = items.findIndex((item, i) => frame < (item.transition > 0
    ? item.transition_start + item.transition : (items[i + 1]?.start ?? Infinity)));
  return { index: Math.max(0, index), inTransition: false, progress: 0 };
}

function color(value) {
  if (!value || value === 'transparent' || value === 'none') return [0, 0, 0, 0];
  let h = value.replace('#', '');
  if (h.length === 3) h = h.split('').map(v => v + v).join('');
  if (!/^[a-f0-9]{6}([a-f0-9]{2})?$/i.test(h)) return [0, 0, 0, 1];
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).concat(h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1);
}
export function mixColor(a, b, t) {
  const x = color(a), y = color(b);
  return `rgba(${x.slice(0, 3).map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')},${x[3] + (y[3] - x[3]) * t})`;
}

export function morphSlide(a, b, progress) {
  const t = progress * progress * (3 - 2 * progress);
  const remaining = b.elements.map(canonicalElement);
  const elements = [];
  for (const raw of a.elements) {
    const from = canonicalElement(raw);
    let index = remaining.findIndex(to => to.type === from.type && from.morph_id && to.morph_id === from.morph_id);
    if (index < 0) index = remaining.findIndex(to => to.type === from.type && to.id === from.id);
    if (index < 0) index = remaining.findIndex(to => to.type === from.type && from.content && to.content === from.content);
    if (index < 0) { elements.push({ ...from, opacity: (from.opacity ?? 1) * (1 - t) }); continue; }
    const to = remaining.splice(index, 1)[0];
    const mixed = { ...from };
    mixed.visual_scale = (from.visual_scale ?? 1) + ((to.visual_scale ?? 1) - (from.visual_scale ?? 1)) * t;
    for (const field of ['x', 'y', 'width', 'height', 'rotation', 'font_size', 'stroke_width', 'radius', 'opacity', 'x1', 'x2', 'y1', 'y2', 'image_brightness', 'image_contrast', 'image_saturation']) {
      if (typeof from[field] === 'number' && typeof to[field] === 'number') mixed[field] = from[field] + (to[field] - from[field]) * t;
    }
    for (const field of ['fill', 'stroke', 'font_color']) mixed[field] = mixColor(from[field], to[field], t);
    if (from.type === 'image') {
      const start = normalizedCrop(from.image_crop), end = normalizedCrop(to.image_crop);
      mixed.image_crop = Object.fromEntries(Object.keys(start).map(key => [key, start[key] + (end[key] - start[key]) * t]));
    }
    const imageChanged = from.type === 'image' && (from.image_src !== to.image_src || Boolean(from.flip_x) !== Boolean(to.flip_x) || Boolean(from.flip_y) !== Boolean(to.flip_y));
    const revealChanged = (from._reveal_binding || to._reveal_binding) && from._reveal_binding !== to._reveal_binding;
    if (revealChanged || imageChanged || from.content !== to.content || (from.type === 'motion_component' && JSON.stringify(from.motion_data) !== JSON.stringify(to.motion_data))) {
      elements.push({ ...mixed, opacity: (mixed.opacity ?? 1) * (1 - t) });
      elements.push({ ...mixed, ...(imageChanged ? { image_src: to.image_src, image_width: to.image_width, image_height: to.image_height, flip_x: to.flip_x, flip_y: to.flip_y } : {}), id: `${to.id}-incoming`, content: to.content, motion_data: to.motion_data, motion_frame: to.motion_frame,
        reveal: to.reveal, _reveal_binding: to._reveal_binding, _reveal_opacity: to._reveal_opacity, opacity: (mixed.opacity ?? 1) * t });
    } else elements.push(mixed);
  }
  elements.push(...remaining.map(el => ({ ...el, id: `${el.id}-incoming`, opacity: (el.opacity ?? 1) * t })));
  return { ...a, background: mixColor(a.background, b.background, t), elements };
}
