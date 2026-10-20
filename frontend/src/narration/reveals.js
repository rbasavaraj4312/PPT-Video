// Fingerprints identify editing anchors, not security-sensitive data. Keep the
// UTF-8 FNV-1a contract identical to backend/app/services/reveals.py.
export function fingerprint(text) {
  let value = 2166136261;
  for (const byte of new TextEncoder().encode(text)) value = Math.imul(value ^ byte, 16777619) >>> 0;
  return value.toString(16).padStart(8, '0');
}
export const normalizeWord = text => String(text).normalize('NFC').trim().toLowerCase().replace(/\s+/gu, ' ');
export function revealAnchors(n) {
  return { script_hash: fingerprint(n.script.trim()), token_sequence_hash: fingerprint(JSON.stringify(n.captions.map(word => normalizeWord(word.text)))) };
}
export function createReveal(n, wordIndex, settings = {}) {
  return { effect: 'fade', offset_ms: 0, duration_ms: 200, ...settings, ...revealAnchors(n),
    word_index: wordIndex, word_text: n.captions[wordIndex].text.trim() };
}

export function resolveReveal(items, index, element, fps = 30) {
  const cue = element.reveal;
  if (!cue) return { valid: true, trigger: null, opacity: 1 };
  const item = items[index], n = item.slide.narration;
  if (!item.narrated || !n?.captions?.length) return { valid: false, issue: 'Generate current narration to link words.' };
  const anchors = revealAnchors(n), word = n.captions[cue.word_index];
  if (anchors.script_hash !== cue.script_hash || anchors.token_sequence_hash !== cue.token_sequence_hash ||
      !word || normalizeWord(word.text) !== normalizeWord(cue.word_text)) {
    return { valid: false, issue: 'Needs relinking: narration words have changed.' };
  }
  const trigger = item.start - item.audio_from + Math.ceil((word.startMs + cue.offset_ms) / 1000 * fps);
  const previous = items[index - 1];
  const from = previous?.transition > 0 ? previous.transition_start : item.start;
  const to = item.transition > 0 ? item.transition_start + item.transition : item.start + item.hold;
  if (trigger < from || trigger >= to) return { valid: false, trigger,
    issue: 'Reveal falls outside this slide’s visible interval. Adjust its word, offset, or transition.' };
  return { valid: true, trigger, duration: cue.effect === 'appear' ? 0 : Math.max(1, Math.ceil(cue.duration_ms / 1000 * fps)) };
}

export function revealOpacity(resolved, frame) {
  if (!resolved.valid || resolved.trigger == null) return 1;
  if (frame < resolved.trigger) return 0;
  if (!resolved.duration) return 1;
  const progress = Math.max(0, Math.min(1, (frame - resolved.trigger) / resolved.duration));
  return progress * progress * (3 - 2 * progress);
}

export function revealIssues(items, fps = 30) {
  return items.flatMap((item, index) => (item.slide.elements || []).filter(element => element.reveal).flatMap(element => {
    const resolved = resolveReveal(items, index, element, fps);
    return resolved.valid ? [] : [{ slideId: item.slide.id, elementId: element.id, title: item.slide.title, ...resolved }];
  }));
}
