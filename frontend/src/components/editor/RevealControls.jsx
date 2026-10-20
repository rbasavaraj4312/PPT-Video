import React, { useState } from 'react';
import { createReveal, resolveReveal } from '../../narration/reveals.js';

export function RevealControls({ items, slideIndex, selectedElements, onChange, onPreview }) {
  const [choosing, setChoosing] = useState(false), [effect, setEffect] = useState('fade');
  if (!selectedElements.length) return null;
  const item = items[slideIndex], n = item?.slide.narration;
  const first = selectedElements[0].reveal;
  const same = selectedElements.every(element => JSON.stringify(element.reveal ?? null) === JSON.stringify(first ?? null));
  const cue = same ? first : null;
  const resolved = cue ? resolveReveal(items, slideIndex, selectedElements[0]) : null;
  const ready = Boolean(item?.narrated && n?.captions?.length);
  const apply = patch => onChange({ reveal: patch });
  function changeEffect(value) {
    if (value === 'none') { apply(null); setChoosing(false); return; }
    setEffect(value);
    if (cue) apply({ ...cue, effect: value });
    else setChoosing(true);
  }
  return <section className="reveal-controls inspector-section" aria-label="Reveal with narration">
    <h3 className="inspector-heading">Reveal with narration</h3>
    {selectedElements.length > 1 && <p className="editor-hint">Applies to {selectedElements.length} selected elements.</p>}
    <label>Effect<select className="editor-field" aria-label="Reveal effect" value={same ? (cue?.effect || (choosing ? effect : 'none')) : 'mixed'} onChange={event => changeEffect(event.target.value)}>
      {!same && <option value="mixed" disabled>Mixed reveal settings</option>}
      <option value="none">Always visible</option><option value="appear" disabled={!ready}>Appear</option><option value="fade" disabled={!ready}>Fade in</option>
    </select></label>
    {!ready && <p className="editor-hint">Generate narration to link words. Existing reveal settings are preserved.</p>}
    {cue && <p className="editor-hint">Word {cue.word_index + 1}: “{cue.word_text}”{resolved?.valid ? ` · ${(n.captions[cue.word_index].startMs / 1000).toFixed(2)} s` : ''}. Stays visible after reveal.</p>}
    {resolved && !resolved.valid && <p role="status" className="editor-stale">{resolved.issue}</p>}
    <button className="editor-secondary full" disabled={!ready} onClick={() => { setEffect(cue?.effect || 'fade'); setChoosing(open => !open); }}>{cue ? 'Change word' : 'Choose spoken word'}</button>
    {choosing && ready && <div className="reveal-word-picker" role="group" aria-label="Choose spoken word">
      {n.captions.map((word, index) => <button key={index} className="reveal-word" aria-pressed={cue?.word_index === index}
        aria-label={`Link word ${index + 1}: ${word.text.trim()} at ${(word.startMs / 1000).toFixed(2)} seconds`}
        onClick={() => { apply(createReveal(n, index, { ...(cue || {}), effect: cue?.effect || effect })); setChoosing(false); }}>
        <span>{index + 1}. {word.text.trim()}</span><small>{(word.startMs / 1000).toFixed(2)} s</small>
      </button>)}
    </div>}
    {cue && <>
      <div className="sample-actions"><button className="editor-secondary" disabled={!resolved?.valid} onClick={() => onPreview(resolved)}>Preview reveal</button><button className="editor-secondary" onClick={() => { apply(null); setChoosing(false); }}>Remove reveal</button></div>
      <details className="editor-details"><summary>Advanced timing</summary>
        <label>Offset (ms)<input className="editor-field" aria-label="Reveal offset" type="number" min="-500" max="500" step="50" value={cue.offset_ms} onChange={event => apply({ ...cue, offset_ms: Math.max(-500, Math.min(500, Math.round(Number(event.target.value)))) })} /></label>
        {cue.effect === 'fade' && <label>Fade duration (ms)<input className="editor-field" aria-label="Reveal fade duration" type="number" min="100" max="1000" step="50" value={cue.duration_ms} onChange={event => apply({ ...cue, duration_ms: Math.max(100, Math.min(1000, Math.round(Number(event.target.value)))) })} /></label>}
      </details>
    </>}
  </section>;
}
