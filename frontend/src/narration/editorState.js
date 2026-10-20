import { buildTimeline, narrationReady } from './timeline.js';

export const narrationDefaults = () => ({ script: '', engine: 'omnivoice', voice_id: '', fit_to_audio: true,
  padding_ms: 200, captions: [], caption_style: { enabled: true, highlight_words: true, font_size: 28,
    color: '#ffffff', highlight: '#22d3ee', position: 'bottom', words_per_phrase: 6 } });

export function slideNarration(slide) {
  const defaults = narrationDefaults();
  return { ...defaults, ...slide?.narration, caption_style: { ...defaults.caption_style, ...slide?.narration?.caption_style } };
}

export function applyNarrationResult(presentation, tracked, result) {
  if (presentation.id !== tracked.presentationId) return presentation;
  return { ...presentation, slides: presentation.slides.map(slide => {
    const n = slide.narration;
    if (slide.id !== tracked.slideId || !n || n.script.trim() !== result.generated_script ||
      n.engine !== result.generated_engine || n.voice_id !== result.generated_voice_id) return slide;
    return { ...slide, narration: { ...n, ...result } };
  }) };
}

export function slideAtFrame(items, frame) {
  if (frame < 0) return 0;
  const index = items.findIndex(item => frame >= item.start && frame < item.start + item.hold);
  return index < 0 ? Math.max(0, items.length - 1) : index;
}

export function narrationStatus(slide) {
  if (narrationReady(slide.narration) && slide.narration.script?.trim()) return 'Voice ready';
  if (slide.narration?.script?.trim()) return slide.narration.asset_id ? 'Needs update' : 'Not generated';
  return 'Add narration';
}

export const editorTimeline = presentation => buildTimeline(presentation, 30);

// Production narration files are PCM16 WAVs; decode peaks without an AudioContext.
export function wavPeaks(buffer, count = 72) {
  const view = new DataView(buffer);
  const tag = offset => String.fromCharCode(...new Uint8Array(buffer, offset, 4));
  if (view.byteLength < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('Unsupported audio');
  let offset = 12, bits = 0, format = 0, dataOffset = 0, dataSize = 0;
  while (offset + 8 <= view.byteLength) {
    const name = tag(offset), size = view.getUint32(offset + 4, true);
    if (name === 'fmt ' && size >= 16) { format = view.getUint16(offset + 8, true); bits = view.getUint16(offset + 22, true); }
    if (name === 'data') { dataOffset = offset + 8; dataSize = Math.min(size, view.byteLength - dataOffset); break; }
    offset += 8 + size + size % 2;
  }
  if (!dataOffset || format !== 1 || bits !== 16) throw new Error('Expected PCM16 audio');
  const samples = Math.floor(dataSize / 2);
  return Array.from({ length: count }, (_, index) => {
    let peak = 0;
    for (let sample = Math.floor(index * samples / count); sample < Math.floor((index + 1) * samples / count); sample++) {
      peak = Math.max(peak, Math.abs(view.getInt16(dataOffset + sample * 2, true)) / 32768);
    }
    return peak;
  });
}
