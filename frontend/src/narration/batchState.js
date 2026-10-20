import { narrationReady } from './timeline.js';
import { slideNarration, applyNarrationResult } from './editorState.js';

export function prepareVoiceBatch(presentation, { voiceId, engine, applyToAll = true, slideIds } = {}) {
  const selected = slideIds ? new Set(slideIds) : null;
  const slides = presentation.slides.map(slide => {
    if (!slide.narration?.script?.trim() || (selected && !selected.has(slide.id))) return slide;
    const n = slideNarration(slide);
    return { ...slide, narration: applyToAll ? { ...n, voice_id: voiceId, engine } : n };
  });
  const tasks = slides.filter(slide => (!selected || selected.has(slide.id)) && slide.narration?.script?.trim() &&
    !narrationReady(slide.narration)).map(slide => ({ slide_id: slide.id, script: slide.narration.script,
    voice_id: slide.narration.voice_id, engine: slide.narration.engine }));
  const missing = tasks.find(task => !task.voice_id);
  if (tasks.length > 100) throw new Error('Generate up to 100 voices per batch. Generate individual slides first to reduce the pending count.');
  if (missing) throw new Error(`Choose a voice for slide ${slides.findIndex(slide => slide.id === missing.slide_id) + 1}.`);
  return { presentation: { ...presentation, slides }, tasks };
}

export function applyBatchResults(presentation, batch) {
  if (presentation.id !== batch.presentation_id) return presentation;
  let next = presentation;
  for (const row of batch.slides) {
    const result = row.job?.result;
    if (row.job?.status !== 'complete' || !result || row.script.trim() !== result.generated_script ||
        row.engine !== result.generated_engine || row.voice_id !== result.generated_voice_id) continue;
    const slide = next.slides.find(item => item.id === row.slide_id);
    if (!slide || narrationReady(slide.narration)) continue;
    next = applyNarrationResult(next, { presentationId: batch.presentation_id, slideId: row.slide_id }, result);
  }
  return next;
}

export function latestBatchRows(batches) {
  const rows = new Map();
  for (const batch of batches) for (const row of batch.slides || []) rows.set(row.slide_id, row);
  return rows;
}
