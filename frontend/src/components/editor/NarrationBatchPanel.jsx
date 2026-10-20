import React, { useState } from 'react';
import { AudioLines, Loader2 } from 'lucide-react';
import { narrationReady } from '../../narration/timeline.js';

export function NarrationBatchPanel({ presentation, batch, voice, onSelectSlide }) {
  const [applyToAll, setApplyToAll] = useState(true);
  const scripted = presentation.slides.filter(slide => slide.narration?.script?.trim());
  const ready = scripted.filter(slide => narrationReady(slide.narration)).length;
  const active = batch.busy || batch.submitting;
  const allCurrent = scripted.length > 0 && ready === scripted.length && (!applyToAll || scripted.every(slide =>
    slide.narration.voice_id === voice.n.voice_id && slide.narration.engine === voice.n.engine));
  function start(slideIds, override = applyToAll) {
    batch.start({ voiceId: voice.n.voice_id, engine: voice.n.engine, applyToAll: override, slideIds });
  }
  const failedIds = scripted.filter(slide => ['failed', 'cancelled'].includes(batch.rows.get(slide.id)?.job.status) && !narrationReady(slide.narration)).map(slide => slide.id);
  return <section className="inspector-section narration-batch-panel" aria-label="Presentation voice jobs">
    <div className="inspector-heading-row"><h3 className="inspector-heading">Presentation voices</h3><span className="editor-hint">{ready}/{scripted.length} ready</span></div>
    <label className="editor-check"><input type="checkbox" checked={applyToAll} disabled={active} onChange={event => setApplyToAll(event.target.checked)} />Use this slide’s voice and engine for all slides</label>
    <p className="editor-hint">Saves the draft, then queues missing or outdated audio. Voices run one at a time; completed slides are reused.</p>
    <button className="editor-generate" disabled={active || allCurrent || !scripted.length || (applyToAll && !voice.n.voice_id) || voice.deckJobs.length > 0} onClick={() => start()}>{active ? <Loader2 size={16} className="animate-spin" /> : <AudioLines size={16} />}{batch.submitting ? 'Saving draft…' : batch.busy ? 'Generating presentation voices…' : allCurrent ? 'All voices ready' : 'Generate all voices'}</button>
    {applyToAll && !voice.n.voice_id && <p className="editor-hint">Choose a voice above, then generate all slides together.</p>}
    {batch.error && <div className="editor-alert" role="alert">{batch.error}<button aria-label="Dismiss batch error" onClick={() => batch.setError('')}>×</button></div>}
    {failedIds.length > 0 && <button className="editor-secondary full" disabled={active} onClick={() => start(failedIds, false)}>Retry failed slides ({failedIds.length})</button>}
    <div className="narration-batch-list">{scripted.map(slide => {
      const index = presentation.slides.indexOf(slide), row = batch.rows.get(slide.id), job = row?.job;
      const current = narrationReady(slide.narration);
      const changed = row && (row.script.trim() !== slide.narration.script.trim() || row.voice_id !== slide.narration.voice_id || row.engine !== slide.narration.engine);
      const status = current ? 'Voice ready' : changed ? 'Changed · generate again' : job?.status === 'complete' ? 'Changed · generate again' : job?.phase || 'Not generated';
      return <div key={slide.id} className="narration-batch-row"><button className="editor-text-button" onClick={() => onSelectSlide(index)} title={slide.title}>{index + 1}. {slide.title}</button><span className={job?.status === 'failed' && !current ? 'editor-stale' : 'editor-hint'} title={job?.error}>{status}</span>
        {job?.error && !current && <small className="editor-stale">{job.error}</small>}
        {!active && !current && job && <button className="editor-text-button" disabled={voice.deckJobs.length > 0} onClick={() => start([slide.id], false)}>{['failed', 'cancelled'].includes(job.status) ? 'Retry slide' : 'Generate changed slide'}</button>}
      </div>;
    })}</div>
    {batch.batches.filter(item => item.awaiting_generation).map(item => <button key={item.id} className="editor-secondary full" disabled={active} onClick={() => batch.resume(item.id)}>Resume voice generation</button>)}
    {batch.batches.filter(item => !item.finished).map(item => <button key={item.id} className="editor-secondary full" onClick={() => batch.cancel(item.id)}>Cancel remaining voice jobs</button>)}
    {active && <p className="editor-hint">You can keep editing. Progress is recovered when you reopen this presentation.</p>}
  </section>;
}
