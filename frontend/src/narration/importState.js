export function narrationImportText(presentation) {
  return presentation.slides.flatMap((slide, index) => slide.narration?.script?.trim()
    ? [`Slide ${index + 1}:\n${slide.narration.script}`] : []).join('\n\n');
}

export function applyNarrationImport(presentation, draft, mode, { sourceIds = [], numbers = [], voiceId = '', engine = 'omnivoice' } = {}) {
  const imported = draft.slides.map(slide => ({ ...slide, narration: { ...slide.narration, voice_id: voiceId, engine } }));
  if (mode !== 'update') return { ...presentation, slides: mode === 'replace' ? imported : [...presentation.slides, ...imported] };
  const updates = new Map(), additions = [];
  imported.forEach((slide, index) => {
    const sourceId = sourceIds[numbers[index] - 1];
    if (sourceId) updates.set(sourceId, slide);
    else additions.push(slide);
  });
  return { ...presentation, slides: [...presentation.slides.map(slide => {
    const update = updates.get(slide.id);
    if (!update) return slide;
    return { ...slide, title: update.title,
      ...(!slide.elements?.length ? { elements: update.elements, background: update.background } : {}),
      narration: { ...update.narration, ...slide.narration, script: update.narration.script } };
  }), ...additions] };
}
