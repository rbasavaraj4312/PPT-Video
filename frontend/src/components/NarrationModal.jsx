import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { downloadSrt, speechPost, speechRequest, speechUrl } from '../services/speech';
import { narrationReady } from '../narration/timeline';

const defaults = () => ({ script: '', engine: 'omnivoice', voice_id: '', fit_to_audio: true,
  padding_ms: 400, captions: [], caption_style: { enabled: true, font_size: 34, color: '#ffffff',
    highlight: '#facc15', position: 'bottom', words_per_phrase: 6 } });
const input = 'w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-sm';
const button = 'rounded-lg px-3 py-2 text-sm font-semibold bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-500';

export function NarrationModal({ isOpen, onClose, presentation, activeSlideIndex, updatePresentation, onPreview }) {
  const [voices, setVoices] = useState([]);
  const [capabilities, setCapabilities] = useState([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('My English voice');
  const [transcript, setTranscript] = useState('');
  const [file, setFile] = useState(null);
  const [start, setStart] = useState('0');
  const [end, setEnd] = useState('');
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const recorder = useRef(null);
  const recordingTimer = useRef(null);
  const stream = useRef(null);
  const [jobs, setJobs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ppt_speech_jobs') || '[]'); } catch { return []; }
  });
  const [states, setStates] = useState({});
  const [exportId, setExportId] = useState(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; clearTimeout(recordingTimer.current); stream.current?.getTracks().forEach(t => t.stop()); }; }, []);
  useEffect(() => {
    if (!file) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(file); setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (!isOpen) { if (recorder.current?.state === 'recording') recorder.current.stop(); return; }
    let live = true;
    Promise.all([speechRequest('/voices'), speechRequest('/capabilities')]).then(([v, c]) => {
      if (live) { setVoices(v); setCapabilities(c.engines); }
    }).catch(e => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [isOpen]);
  useEffect(() => { localStorage.setItem('ppt_speech_jobs', JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => {
    if (!isOpen) return;
    const saved = localStorage.getItem(`ppt_narration_export_${presentation.id}`);
    setExportId(saved);
    if (saved) speechRequest(`/jobs/${saved}`).then(state => {
      setStates(old => ({ ...old, [saved]: state }));
    }).catch(() => localStorage.removeItem(`ppt_narration_export_${presentation.id}`));
  }, [isOpen, presentation.id]);
  useEffect(() => {
    if (!jobs.some(job => job.presentationId === presentation.id)) return;
    let live = true, timer;
    const poll = async () => {
      const finished = [];
      for (const tracked of jobs) {
        if (tracked.presentationId !== presentation.id) continue;
        try {
          const state = await speechRequest(`/jobs/${tracked.id}`);
          if (!live) return;
          setStates(old => ({ ...old, [tracked.id]: state }));
          if (['complete', 'failed', 'cancelled'].includes(state.status)) {
            finished.push(tracked.id);
            if (state.status === 'complete' && state.kind === 'speech') {
              updatePresentation(prev => {
                if (prev.id !== tracked.presentationId) return prev;
                return { ...prev, slides: prev.slides.map(s => {
                  const n = s.narration;
                  if (s.id !== tracked.slideId || !n || n.script.trim() !== state.result.generated_script ||
                    n.engine !== state.result.generated_engine || n.voice_id !== state.result.generated_voice_id) return s;
                  return { ...s, narration: { ...n, ...state.result } };
                }) };
              });
            }
            if (state.status === 'failed') setError(state.error || 'Job failed');
          }
        } catch (e) { if (live) { setError(e.message); if (/not found/i.test(e.message)) finished.push(tracked.id); } }
      }
      if (!live) return;
      if (finished.length) setJobs(old => old.filter(j => !finished.includes(j.id)));
      else timer = setTimeout(poll, 1000);
    };
    poll();
    return () => { live = false; clearTimeout(timer); };
  }, [jobs, updatePresentation, presentation.id]);

  const slide = presentation.slides[activeSlideIndex];
  const n = { ...defaults(), ...slide?.narration, caption_style: { ...defaults().caption_style, ...slide?.narration?.caption_style } };
  const change = (patch) => {
    const slideId = slide.id;
    updatePresentation(prev => prev.id !== presentation.id ? prev : ({ ...prev, slides: prev.slides.map(s => s.id === slideId
      ? { ...s, narration: { ...defaults(), ...s.narration, ...patch } } : s) }));
  };
  const addJob = (job, slideId) => setJobs(old => [...old, { id: job.id, presentationId: presentation.id, slideId }]);
  const currentJobs = jobs.filter(j => j.presentationId === presentation.id && j.slideId === slide?.id);
  const renderJob = states[exportId];

  async function record() {
    setError('');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream.current);
      recorder.current = media;
      const parts = [];
      media.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
      media.onstop = () => {
        clearTimeout(recordingTimer.current);
        stream.current?.getTracks().forEach(t => t.stop());
        if (mounted.current) { setFile(new File(parts, 'recording.webm', { type: media.mimeType })); setStart('0'); setEnd(''); setRecording(false); }
      };
      media.start(); setRecording(true);
      recordingTimer.current = setTimeout(() => { if (media.state === 'recording') media.stop(); }, 14500);
    } catch (e) { stream.current?.getTracks().forEach(t => t.stop()); setError(`Microphone: ${e.message}`); }
  }
  async function saveVoice() {
    setError(''); setUploading(true);
    try {
      const data = new FormData(); data.append('name', name); data.append('transcript', transcript);
      data.append('audio', file); data.append('start', start || '0'); if (end !== '') data.append('end', end);
      const profile = await speechRequest('/voices', { method: 'POST', body: data });
      setVoices(old => [...old, profile]); change({ voice_id: profile.id });
      setFile(null); setTranscript('');
    } catch (e) { setError(e.message); } finally { setUploading(false); }
  }
  async function generate() {
    setError('');
    try {
      // Persist defaults before polling so results can be matched to this slide safely.
      change(n);
      addJob(await speechPost('/generate', { script: n.script, voice_id: n.voice_id, engine: n.engine }), slide.id);
    } catch (e) { setError(e.message); }
  }
  async function render() {
    setError('');
    try {
      const job = await speechPost('/render', presentation);
      localStorage.setItem(`ppt_narration_export_${presentation.id}`, job.id);
      setExportId(job.id); addJob(job, null);
    }
    catch (e) { setError(e.message); }
  }
  const run = action => Promise.resolve().then(action).catch(e => setError(e.message));
  if (!isOpen || !slide) return null;
  const ready = narrationReady(n);
  const engineStatus = capabilities.find(c => c.id === n.engine);
  const alignmentStatus = capabilities.find(c => c.id === 'align');
  const renderPending = jobs.some(j => j.id === exportId);
  return <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="narration-title">
    <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xl">
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b dark:border-slate-700 p-4 flex justify-between items-center">
        <div><h2 id="narration-title" className="font-bold text-lg">Voice & narration</h2><p className="text-xs text-slate-500">English · {slide.title} · Audio and captions are saved with your deck when you save.</p></div>
        <button onClick={onClose} aria-label="Close narration" className="p-2"><X /></button>
      </header>
      {error && <div role="alert" className="m-4 p-3 rounded bg-red-50 text-red-700 whitespace-pre-wrap text-sm">{error}</div>}
      <div className="grid md:grid-cols-2 gap-6 p-5">
        <section className="space-y-3">
          <h3 className="font-semibold">1. Your voice</h3>
          <label className="block text-sm">Saved voice<select className={input} value={n.voice_id} onChange={e => change({ voice_id: e.target.value })}><option value="">Choose a voice</option>{voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
          {n.voice_id && <audio key={n.voice_id} controls src={speechUrl(`/voices/${n.voice_id}/reference`)} className="w-full" />}
          <details className="rounded-xl border dark:border-slate-700 p-3" open={!voices.length}>
            <summary className="cursor-pointer font-semibold text-sm">Record or upload a voice sample</summary>
            <div className="space-y-3 mt-3">
              <p className="text-xs text-slate-500">Use 5–15 seconds of clean, natural speech. The transcript must match the selected clip exactly.</p>
              <label className="block text-sm">Voice name<input className={input} value={name} onChange={e => setName(e.target.value)} maxLength={100} /></label>
              <input aria-label="Reference audio file" type="file" accept="audio/*" onChange={e => { setFile(e.target.files[0] || null); setStart('0'); setEnd(''); }} />
              <button className={button} onClick={recording ? () => recorder.current?.stop() : record} disabled={uploading}>{recording ? <><Square className="inline w-4 h-4" /> Stop recording</> : <><Mic className="inline w-4 h-4" /> Record sample</>}</button>
              {previewUrl && <audio controls src={previewUrl} className="w-full" />}
              <div className="grid grid-cols-2 gap-2"><label className="text-sm">Trim start (seconds)<input className={input} type="number" min="0" step="0.1" value={start} onChange={e => setStart(e.target.value)} /></label><label className="text-sm">Trim end (optional)<input className={input} type="number" min="0" step="0.1" value={end} onChange={e => setEnd(e.target.value)} /></label></div>
              <label className="block text-sm">Exact transcript<textarea className={input} rows={3} value={transcript} onChange={e => setTranscript(e.target.value)} maxLength={3000} /></label>
              <button className={button} onClick={saveVoice} disabled={!file || !name.trim() || !transcript.trim() || uploading || recording}>{uploading ? 'Preparing sample…' : 'Save voice profile'}</button>
            </div>
          </details>
          <label className="block text-sm">Speech engine<select className={input} value={n.engine} onChange={e => change({ engine: e.target.value })}><option value="omnivoice">OmniVoice · MLX / Apple Silicon</option><option value="pocket">Pocket TTS · CPU</option></select></label>
          <p className="text-xs text-slate-500">{engineStatus?.reason || 'Checking speech engine…'}</p>
          {alignmentStatus?.available === false && <p className="text-xs text-amber-600">Word alignment: {alignmentStatus.reason}</p>}
          {n.engine === 'omnivoice' && <p className="text-xs text-amber-600">OmniVoice pretrained weights are for noncommercial use.</p>}
        </section>
        <section className="space-y-3">
          <h3 className="font-semibold">2. Narrate this slide</h3>
          <label className="block text-sm">Narration script<textarea className={input} rows={7} value={n.script} maxLength={12000} onChange={e => change({ script: e.target.value })} placeholder="Write what your voice should say…" /></label>
          <button className={button} onClick={generate} disabled={!n.script.trim() || !n.voice_id || currentJobs.length > 0 || engineStatus?.available === false || alignmentStatus?.available === false}><Volume2 className="inline w-4 h-4 mr-1" />{ready ? 'Regenerate narration' : 'Generate narration'}</button>
          {currentJobs.map(j => <div key={j.id} className="text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{states[j.id]?.phase || 'Queued'}<button className="underline" onClick={() => run(() => speechRequest(`/jobs/${j.id}`, { method: 'DELETE' }))}>Cancel</button></div>)}
          {n.asset_id && !ready && <p className="text-sm text-amber-600">The script, voice, or engine changed. Generate again before exporting.</p>}
          {ready && <><audio key={n.asset_id} controls src={speechUrl(`/assets/${n.asset_id}/narration.wav`)} className="w-full" /><a className="text-sm underline" download href={speechUrl(`/assets/${n.asset_id}/narration.wav`)}>Download narration WAV</a><p className="text-xs text-slate-500">{(n.duration_ms / 1000).toFixed(1)} seconds · {n.captions.length} aligned words</p></>}
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={n.fit_to_audio} onChange={e => change({ fit_to_audio: e.target.checked })} />Fit slide duration to narration</label>
          <label className="block text-sm">Pause after narration (ms)<input className={input} type="number" min="0" max="5000" step="100" value={n.padding_ms} onChange={e => change({ padding_ms: Math.max(0, Math.min(5000, Number(e.target.value))) })} /></label>
          <p className="text-xs text-slate-500">Speech finishes before the outgoing transition. Only one generation, alignment, or export runs at a time.</p>
        </section>
        <section className="md:col-span-2 space-y-3 border-t dark:border-slate-700 pt-4">
          <h3 className="font-semibold">3. Captions & export</h3>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="text-sm flex gap-2"><input type="checkbox" checked={n.caption_style.enabled} onChange={e => change({ caption_style: { ...n.caption_style, enabled: e.target.checked } })} />Show captions</label>
            <label className="text-sm">Highlight <input type="color" value={n.caption_style.highlight} onChange={e => change({ caption_style: { ...n.caption_style, highlight: e.target.value } })} /></label>
            <label className="text-sm">Text <input type="color" value={n.caption_style.color} onChange={e => change({ caption_style: { ...n.caption_style, color: e.target.value } })} /></label>
            <label className="text-sm">Size <input className="w-16 bg-transparent border rounded p-1" type="number" min="16" max="72" value={n.caption_style.font_size} onChange={e => change({ caption_style: { ...n.caption_style, font_size: Math.max(16, Math.min(72, Number(e.target.value))) } })} /></label>
            <label className="text-sm">Words <input className="w-14 bg-transparent border rounded p-1" type="number" min="2" max="12" value={n.caption_style.words_per_phrase} onChange={e => change({ caption_style: { ...n.caption_style, words_per_phrase: Math.max(2, Math.min(12, Number(e.target.value))) } })} /></label>
            <select aria-label="Caption position" className="bg-transparent border rounded p-1" value={n.caption_style.position} onChange={e => change({ caption_style: { ...n.caption_style, position: e.target.value } })}><option value="bottom">Bottom</option><option value="top">Top</option></select>
          </div>
          {ready && <details><summary className="cursor-pointer text-sm">Correct individual words and timing</summary><div className="max-h-56 overflow-auto space-y-1 mt-2">{n.captions.map((word, index) => <div key={index} className="flex gap-2">
            <input aria-label={`Word ${index + 1}`} className={input} value={word.text} onChange={e => change({ captions: n.captions.map((c, i) => i === index ? { ...c, text: e.target.value } : c) })} />
            {['startMs', 'endMs'].map(field => <input key={field} aria-label={`Word ${index + 1} ${field}`} className="w-28 border rounded bg-transparent p-1" type="number" min="0" max={n.duration_ms} value={word[field]} onChange={e => {
              const value = Math.max(0, Math.min(n.duration_ms, Number(e.target.value)));
              change({ captions: n.captions.map((c, i) => i === index ? { ...c, [field]: value, ...(field === 'startMs' ? { endMs: Math.max(value, c.endMs) } : { startMs: Math.min(c.startMs, value) }) } : c) });
            }} />)}
          </div>)}</div><p className="text-xs text-slate-500">Times are milliseconds relative to this slide's audio. Text edits change captions only.</p></details>}
          <div className="flex flex-wrap gap-2"><button className={button} onClick={onPreview}>Preview narration & captions</button><button className={button} disabled={renderPending} onClick={render}>Export narrated MP4 · 1080p / 30 FPS</button><button className={button} onClick={() => run(() => downloadSrt(presentation))}>Download SRT</button><button className={button} disabled={jobs.some(job => job.presentationId === presentation.id)} onClick={() => run(() => speechPost('/service/stop', {}))}>Stop voice processing</button></div>
          <p className="text-xs text-slate-500">Voice processing starts when needed and stops automatically when idle. You can also stop it here after jobs finish.</p>
          {renderPending && <p className="text-sm">{renderJob?.phase || 'Export queued'}{renderJob?.progress !== undefined ? ` ${renderJob.progress}%` : ''} <button className="underline" onClick={() => run(() => speechRequest(`/jobs/${exportId}`, { method: 'DELETE' }))}>Cancel export</button></p>}
          {renderJob?.status === 'complete' && <a className="inline-block underline text-indigo-500" href={speechUrl(`/jobs/${exportId}/video`)} download>Download narrated MP4</a>}
        </section>
      </div>
    </div>
  </div>;
}
