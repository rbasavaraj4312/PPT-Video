import React, { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Upload, X } from 'lucide-react';
import { BASE_URL } from '../../services/api';
import { narrationImportText } from '../../narration/importState.js';

const SAMPLE = 'Slide 1:\nEvery successful project starts with one clear idea. Give your audience a single message they can remember.\n\nSlide 2:\nTurn that idea into a practical plan. Define the goal, assign responsibilities, and set a deadline.\n\nSlide 3:\nBring the pieces together and launch with confidence. Review the results and use what you learn to improve.';
const PROMPT = 'Improve the following explanation for a narrated slide video. Return only plain text in this format:\n\nSlide 1:\nThe exact spoken explanation for this slide.\n\nSlide 2:\nThe exact spoken explanation for the next slide.\n\nUse a unique numbered Slide heading for each scene. Keep the narration natural and accurate. Include only narration under each heading, without separate titles, layout instructions, bullet metadata, or invented claims. Aim for one clear idea per slide.\n\nMy explanation:\n';

async function draftRequest(path, body) {
  const response = await fetch(`${BASE_URL}/narration-draft/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Please check the draft fields and try again.');
  return result;
}

export function NarrationImportModal({ presentation, onClose, onImport }) {
  const [text, setText] = useState(() => narrationImportText(presentation)), [slides, setSlides] = useState(null), [theme, setTheme] = useState('modern-dark');
  const sources = useRef(presentation.slides.map(slide => ({ id: slide.id, title: slide.title })));
  const hasExisting = sources.current.length > 0 && Boolean(narrationImportText(presentation));
  const empty = presentation.slides.length === 1 && !presentation.slides[0].elements?.length && !presentation.slides[0].narration?.script?.trim();
  const [mode, setMode] = useState(hasExisting ? 'update' : empty ? 'replace' : 'append'), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const upload = useRef(null), dialog = useRef(null), live = useRef(true);
  useEffect(() => {
    live.current = true;
    const previous = document.activeElement;
    dialog.current?.querySelector('textarea')?.focus();
    return () => { live.current = false; previous?.focus(); };
  }, []);
  const change = (index, patch) => setSlides(old => old.map((slide, i) => i === index ? { ...slide, ...patch } : slide));
  async function run(action) {
    setBusy(true); setError('');
    try { await action(); } catch (exception) { if (live.current) setError(exception.message); }
    finally { if (live.current) setBusy(false); }
  }
  async function readFile(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setError('');
    try {
      if (file.size > 512000) throw new Error('Choose a text or Markdown file smaller than 500 KB.');
      const value = await file.text();
      if (value.length > 400000 || value.includes('\u0000')) throw new Error('Choose a plain text narration file with at most 400,000 characters.');
      setText(value); setSlides(null);
    } catch (exception) { setError(exception.message); }
  }
  function keys(event) {
    if (event.key === 'Escape' && !busy) { event.stopPropagation(); onClose(); }
    if (event.key === 'Tab') {
      const nodes = [...dialog.current.querySelectorAll('button:not(:disabled),textarea,select,input:not([hidden])')].filter(node => node.offsetParent !== null);
      const first = nodes[0], last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }
  return <div className="narration-import-backdrop" onKeyDown={keys}>
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="narration-import-title" className="narration-import-dialog">
      <header><div><h2 id="narration-import-title"><FileText size={20} />Narration to slides</h2><p>Import all explanations together. Review the draft, then generate voices for the whole presentation.</p></div><button className="editor-icon-button" aria-label="Close narration import" onClick={onClose} disabled={busy}><X size={20} /></button></header>
      {error && <div className="editor-alert" role="alert">{error}</div>}
      {!slides ? <>
        <div className="narration-import-actions"><button className="editor-secondary" onClick={() => upload.current?.click()}><Upload size={14} />Upload .txt / .md</button><button className="editor-secondary" onClick={() => setText(SAMPLE)}>Use example</button><button className="editor-secondary" onClick={() => run(async () => { await navigator.clipboard.writeText(PROMPT); setCopied(true); })}>{copied ? 'Prompt copied' : 'Copy ChatGPT / Claude prompt'}</button></div>
        <input ref={upload} type="file" accept=".txt,.md,text/plain,text/markdown" hidden aria-label="Import narration file" onChange={readFile} />
        <label htmlFor="all-slide-narration">All slide narration</label><textarea id="all-slide-narration" className="editor-field narration-import-text" maxLength={400000} value={text} onChange={event => setText(event.target.value)} placeholder={SAMPLE} />
        <p className="editor-hint">{hasExisting && 'Existing narration is loaded. Keep slide numbers to update the corresponding slides. '}Use “Slide 1:” and “Slide 2:” headings. A script without headings becomes one slide. Up to 100 slides, 12,000 characters per slide.</p>
        <footer><span>Your narration is preserved. Visual drafts use excerpts from your words.</span><button className="editor-generate" disabled={!text.trim() || busy} onClick={() => run(async () => { const result = await draftRequest('parse', { text }); if (live.current) setSlides(result.slides.map(slide => ({ ...slide, title: mode === 'update' ? sources.current[slide.number - 1]?.title || slide.title : slide.title }))); })}>{busy && <Loader2 size={15} className="animate-spin" />}Review slide draft</button></footer>
      </> : <>
        <div className="narration-import-settings"><strong>{slides.length} slides · {presentation.aspect_ratio || '16:9'}</strong>{mode !== 'update' && <label>Style<select className="editor-field" aria-label="Narration draft style" value={theme} onChange={event => setTheme(event.target.value)}>{[['modern-dark', 'Modern dark'], ['clean-light', 'Clean light'], ['midnight', 'Midnight'], ['emerald-dark', 'Emerald'], ['sunset', 'Sunset']].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>}<label>Destination<select className="editor-field" aria-label="Narration import destination" value={mode} onChange={event => setMode(event.target.value)}>{hasExisting && <option value="update">Update narration · keep slide designs</option>}<option value="append">Add to this presentation</option><option value="replace">{empty ? 'Replace empty slide' : `Replace all ${presentation.slides.length} existing slides`}</option></select></label></div>
        <p className="editor-hint">{mode === 'update' ? 'Updates narration by slide number while keeping existing designs and voice settings. New slide numbers add slides; omitted slides stay in the presentation.' : 'Titles and visual excerpts are suggested automatically. Edit them here or arrange the actual elements after creating the slides.'} Speech starts only when you choose Generate all voices.</p>
        <div className="narration-draft-list">{slides.map((slide, index) => <section key={index} className="narration-draft-row">
          <div className="inspector-heading-row"><h3>Slide {slide.number}</h3>{mode !== 'update' && <label>Layout<select className="editor-field" aria-label={`Slide ${index + 1} draft layout`} value={slide.layout} onChange={event => change(index, { layout: event.target.value })}><option value="focus">Focus · one excerpt</option><option value="key_points">Key points · up to three excerpts</option></select></label>}</div>
          <label>Suggested title<input className="editor-field" aria-label={`Slide ${index + 1} draft title`} maxLength={90} value={slide.title} onChange={event => change(index, { title: event.target.value })} /></label>
          <div className={mode === 'update' ? '' : 'narration-draft-columns'}><label>Narration<textarea className="editor-field" rows={5} aria-label={`Slide ${index + 1} imported narration`} value={slide.script} maxLength={12000} onChange={event => change(index, { script: event.target.value })} /></label>{mode !== 'update' && <div><span>Visual excerpts</span>{slide.points.map((point, i) => <textarea key={i} className="editor-field" rows={2} aria-label={`Slide ${index + 1} visual excerpt ${i + 1}`} value={point} maxLength={180} onChange={event => change(index, { points: slide.points.map((p, j) => i === j ? event.target.value : p) })} />)}</div>}</div>
        </section>)}</div>
        <footer><button className="editor-secondary" onClick={() => setSlides(null)} disabled={busy}>Back to narration</button><button className="editor-generate" disabled={busy || slides.some(slide => !slide.title.trim() || !slide.script.trim() || slide.points.some(point => !point.trim()))} onClick={() => run(async () => { const draft = await draftRequest('build', { slides, theme, aspect_ratio: presentation.aspect_ratio || '16:9' }); if (live.current) onImport(draft, mode, { sourceIds: sources.current.map(source => source.id), numbers: slides.map(slide => slide.number) }); })}>{busy && <Loader2 size={15} className="animate-spin" />}{busy ? 'Applying draft…' : mode === 'update' ? 'Update narration' : `Create ${slides.length} slides`}</button></footer>
      </>}
    </div>
  </div>;
}
