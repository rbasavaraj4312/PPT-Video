import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, CheckCircle2, ChevronDown, Download, Loader2, Mic, Play, RefreshCw, Square, Upload } from 'lucide-react';
import { useNarration } from '../../narration/useNarration';
import { narrationReady } from '../../narration/timeline';
import { downloadSrt, speechUrl } from '../../services/speech';
import { NarrationAudio } from './NarrationAudio';

function Toggle({ label, checked, onChange }) {
  return <label className="editor-toggle-label"><span>{label}</span><input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)} /><span className="editor-switch" aria-hidden="true" /></label>;
}

export function NarrationInspector({ tab, onTabChange, presentation, activeSlideIndex, updatePresentation, onUpdateSlide, designPanel, revealPanel, onEdit, onSeekCaption }) {
  const voice = useNarration({ presentation, activeSlideIndex, updatePresentation });
  const { n } = voice;
  const slide = presentation.slides[activeSlideIndex];
  const ready = narrationReady(n), audioRef = useRef(null), uploadRef = useRef(null);
  const [showSample, setShowSample] = useState(false);
  useEffect(() => { if (tab !== 'voice' && voice.recording) voice.record(); }, [tab, voice.recording]);
  const change = patch => { onEdit(); voice.change(patch); };
  const caption = patch => change({ caption_style: { ...n.caption_style, ...patch } });
  const currentVoice = voice.voices.find(item => item.id === n.voice_id);
  const words = n.script.trim() ? n.script.trim().split(/\s+/).length : 0;
  const acceptFile = event => { voice.setFile(event.target.files?.[0] || null); voice.setStart('0'); voice.setEnd(''); setShowSample(true); event.target.value = ''; };

  return <aside className="workspace-inspector" aria-label="Slide inspector">
    <div className="inspector-tabs" role="tablist" aria-label="Inspector sections">
      {['design', 'voice', 'captions'].map(name => <button key={name} role="tab" aria-selected={tab === name} aria-controls={`inspector-${name}`} id={`tab-${name}`} onClick={() => onTabChange(name)}>{name[0].toUpperCase() + name.slice(1)}</button>)}
    </div>
    <div className="inspector-scroll" role="tabpanel" id={`inspector-${tab}`} aria-labelledby={`tab-${tab}`}>
      {tab === 'design' ? <>{revealPanel}<div className="workspace-design">{designPanel}</div></> : <>
        {voice.error && <div role="alert" className="editor-alert">{voice.error}<button aria-label="Dismiss error" onClick={() => voice.setError('')}>×</button></div>}
        {tab === 'voice' && <>
          <section className="inspector-section">
            <label className="inspector-heading" htmlFor="slide-script">Slide narration</label>
            <textarea id="slide-script" className="editor-field script-field" rows={4} value={n.script} maxLength={12000} onChange={event => change({ script: event.target.value })} placeholder="What should your audience hear on this slide?" />
            <div className="editor-meta"><span>{words} words</span><span>{ready ? `${(n.duration_ms / 1000).toFixed(1)} sec` : 'Not generated'}</span></div>
          </section>
          <section className="inspector-section">
            <label>TTS engine<select className="editor-field" value={n.engine} onFocus={voice.connect} onChange={event => change({ engine: event.target.value })}><option value="omnivoice">OmniVoice · Local voice cloning</option><option value="pocket">Pocket TTS · Optional</option></select></label>
            <div className="inspector-heading-row"><label className="inspector-heading" htmlFor="saved-voice">Voice</label><button className="editor-icon-button" aria-label="Refresh saved voices" title="Refresh saved voices" onClick={voice.connect} disabled={voice.connecting}>{voice.connecting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}</button></div>
            <div className="voice-choice-row">
              <div className="voice-select-wrap"><AudioLines size={17} /><select id="saved-voice" className="editor-field" value={n.voice_id} onFocus={voice.connect} onChange={event => change({ voice_id: event.target.value })}>
                <option value="">Choose voice</option>
                {n.voice_id && !currentVoice && <option value={n.voice_id}>Saved voice</option>}
                {voice.voices.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select></div>
              <button className="editor-icon-button bordered" disabled={!n.voice_id} aria-label="Play voice sample" onClick={() => audioRef.current?.play().catch(error => voice.setError(error.message))}><Play size={15} /></button>
              {n.voice_id && <audio ref={audioRef} key={n.voice_id} src={speechUrl(`/voices/${n.voice_id}/reference`)} preload="none" />}
            </div>
            <div className="sample-actions"><button className="editor-secondary" onClick={() => { setShowSample(true); voice.record(); }} disabled={voice.uploading}>{voice.recording ? <Square size={14} /> : <Mic size={14} />}{voice.recording ? 'Stop recording' : 'Record'}</button><button className="editor-secondary" onClick={() => uploadRef.current?.click()} disabled={voice.recording || voice.uploading}><Upload size={14} />Upload sample</button></div>
            <input ref={uploadRef} type="file" accept="audio/*" aria-label="Voice sample audio" hidden onChange={acceptFile} />
            {showSample && <div className="voice-sample-form">
              <p className="editor-hint">Use 3–15 seconds of clear speech and enter exactly what is said.</p>
              <label>Voice name<input className="editor-field" value={voice.name} onChange={event => voice.setName(event.target.value)} maxLength={100} /></label>
              {voice.previewUrl && <audio controls src={voice.previewUrl} className="editor-audio" />}
              <div className="editor-field-grid"><label>Start (s)<input className="editor-field" type="number" min="0" step=".1" value={voice.start} onChange={event => voice.setStart(event.target.value)} /></label><label>End (s)<input className="editor-field" type="number" min="0" step=".1" value={voice.end} placeholder="Optional" onChange={event => voice.setEnd(event.target.value)} /></label></div>
              <label>Exact transcript<textarea className="editor-field" rows={3} maxLength={3000} value={voice.transcript} onChange={event => voice.setTranscript(event.target.value)} /></label>
              <button className="editor-secondary full" onClick={voice.saveVoice} disabled={!voice.file || !voice.name.trim() || !voice.transcript.trim() || voice.uploading || voice.recording}>{voice.uploading ? 'Preparing sample…' : 'Save voice profile'}</button>
              <button className="editor-text-button" onClick={() => setShowSample(false)} disabled={voice.recording}>Close sample settings</button>
            </div>}
            <button className="editor-generate" onClick={voice.generate} disabled={!n.script.trim() || !n.voice_id || voice.jobs.length > 0 || voice.connecting || voice.submitting}>{voice.connecting || voice.jobs.length > 0 ? <Loader2 size={17} className="animate-spin" /> : <AudioLines size={18} />}{voice.jobs.length ? voice.states[voice.jobs[0].id]?.phase || 'Generating voice…' : 'Generate voice'}</button>
            {voice.jobs.map(job => <div className="editor-meta" key={job.id}><span>Processing this slide</span><button className="editor-text-button" onClick={() => voice.cancel(job.id)}>Cancel</button></div>)}
            {ready && <>
              <div className="audio-ready"><span><CheckCircle2 size={15} />Audio ready</span><small>{(n.duration_ms / 1000).toFixed(1)} sec</small></div>
              <NarrationAudio key={n.asset_id} narration={n} onError={voice.setError} />
            </>}
            {n.asset_id && !ready && <p className="editor-stale">Narration changed. Generate voice to update the audio.</p>}
            {voice.capabilities.find(item => item.id === n.engine)?.available === false && <p className="editor-stale">{voice.capabilities.find(item => item.id === n.engine).reason}</p>}
            <details className="editor-details"><summary>Voice settings <ChevronDown size={12} /></summary>{n.engine === 'omnivoice' && <p className="editor-hint">Uses your local OmniVoice model when available. Only the selected TTS engine runs. OmniVoice pretrained weights are for noncommercial use.</p>}<button className="editor-text-button" onClick={voice.stop} disabled={voice.jobs.length > 0}>Stop voice processing</button></details>
          </section>
        </>}
        <section className="inspector-section caption-settings">
          <Toggle label="Captions" checked={n.caption_style.enabled} onChange={enabled => caption({ enabled })} />
          <Toggle label="Word highlight" checked={n.caption_style.highlight_words !== false} onChange={highlight_words => caption({ highlight_words })} />
          <div className="editor-field-grid three"><label>Highlight<input className="editor-field color-field" aria-label="Caption highlight color" type="color" value={n.caption_style.highlight} onChange={event => caption({ highlight: event.target.value })} /></label><label>Text color<input className="editor-field color-field" aria-label="Caption text color" type="color" value={n.caption_style.color} onChange={event => caption({ color: event.target.value })} /></label><label>Position<select className="editor-field" value={n.caption_style.position} onChange={event => caption({ position: event.target.value })}><option value="bottom">Bottom</option><option value="top">Top</option></select></label></div>
          {tab === 'captions' && <>
            <div className="editor-field-grid"><label>Font size<input className="editor-field" type="number" min="16" max="72" value={n.caption_style.font_size} onChange={event => caption({ font_size: Math.max(16, Math.min(72, Number(event.target.value))) })} /></label><label>Words per phrase<input className="editor-field" type="number" min="2" max="12" value={n.caption_style.words_per_phrase} onChange={event => caption({ words_per_phrase: Math.max(2, Math.min(12, Number(event.target.value))) })} /></label></div>
            <h3 className="inspector-heading">Words & timing</h3><p className="editor-hint">Times are in seconds within this slide. Select a word to preview it.</p>
            {ready ? <div className="caption-word-list">{n.captions.map((word, index) => <div className="caption-word-row" key={index}>
              <button className="editor-icon-button" aria-label={`Preview word ${index + 1}`} onClick={() => onSeekCaption(word.startMs)}><Play size={12} /></button>
              <input className="editor-field" aria-label={`Caption word ${index + 1}`} value={word.text} onChange={event => change({ captions: n.captions.map((item, i) => i === index ? { ...item, text: event.target.value } : item) })} />
              {['startMs', 'endMs'].map(field => <input key={field} className="editor-field" aria-label={`Word ${index + 1} ${field}`} type="number" min="0" max={n.duration_ms / 1000} step=".01" value={Number((word[field] / 1000).toFixed(3))} onChange={event => {
                const value = Math.max(0, Math.min(n.duration_ms, Number(event.target.value) * 1000));
                change({ captions: n.captions.map((item, i) => i === index ? { ...item, [field]: value, ...(field === 'startMs' ? { endMs: Math.max(value, item.endMs) } : { startMs: Math.min(item.startMs, value) }) } : item) });
              }} />)}
            </div>)}</div> : <p className="editor-hint">Generate narration to create aligned captions.</p>}
            <button className="editor-secondary full" onClick={() => voice.run(() => downloadSrt(presentation))}><Download size={14} />Download SRT captions</button>
          </>}
        </section>
        <section className="inspector-section transition-settings">
          <h3 className="inspector-heading">Transition</h3><div className="editor-segmented">{['morph', 'fade', 'none'].map(type => <button key={type} aria-pressed={(slide?.transition_type || 'morph') === type} onClick={() => { onEdit(); onUpdateSlide({ transition_type: type }); }}>{type[0].toUpperCase() + type.slice(1)}</button>)}</div>
          <div className="transition-timing"><label>Duration (s)<input className="editor-field" aria-label="Transition duration" type="number" min="0" max="10" step=".05" value={slide?.transition_duration ?? 1} onChange={event => { onEdit(); onUpdateSlide({ transition_duration: Math.max(0, Math.min(10, Number(event.target.value))) }); }} /></label><label className="editor-check"><input type="checkbox" checked={n.fit_to_audio} onChange={event => change({ fit_to_audio: event.target.checked })} />Fit slide to narration</label></div>
          <p className="editor-hint">Continuous narration: transitions overlap the voice boundary without adding silence.</p>
          <label className="editor-pause">Pause before next narration (ms)<input className="editor-field" aria-label="Pause before next narration" type="number" min="0" max="5000" step="50" value={n.padding_ms} onChange={event => change({ padding_ms: Math.max(0, Math.min(5000, Number(event.target.value))) })} /></label>
          <button className="editor-text-button" onClick={() => change({ padding_ms: 800 })}>Pause for emphasis · 800 ms</button>
          <label>Transition timing<select className="editor-field" aria-label="Transition timing" value={slide?.transition_timing || 'auto'} onChange={event => { onEdit(); onUpdateSlide({ transition_timing: event.target.value }); }}><option value="auto">Auto · around narration boundary</option><option value="manual">Adjust timing</option></select></label>
          {slide?.transition_timing === 'manual' && <label>Offset from narration boundary (ms)<input className="editor-field" aria-label="Transition offset" type="number" min="-5000" max="5000" step="50" value={slide.transition_offset_ms || 0} onChange={event => { onEdit(); onUpdateSlide({ transition_offset_ms: Math.max(-5000, Math.min(5000, Number(event.target.value))) }); }} /><small className="editor-hint">Negative starts earlier; positive starts later. Long transitions are shortened to fit.</small></label>}
        </section>
      </>}
    </div>
  </aside>;
}
