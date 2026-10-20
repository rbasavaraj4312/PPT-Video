import { useEffect, useRef, useState } from 'react';
import { speechPost, speechRequest } from '../services/speech';
import { applyNarrationResult, narrationDefaults, slideNarration } from './editorState.js';
import { narrationReady } from './timeline.js';

const readSaved = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };

export function useNarration({ presentation, activeSlideIndex, updatePresentation }) {
  const [voices, setVoices] = useState(() => readSaved('ppt_voice_profiles', []));
  const [capabilities, setCapabilities] = useState([]);
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [jobs, setJobs] = useState(() => readSaved('ppt_speech_jobs', []));
  const [states, setStates] = useState({});
  const [file, setFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [name, setName] = useState('My voice');
  const [transcript, setTranscript] = useState('');
  const [start, setStart] = useState('0');
  const [end, setEnd] = useState('');
  const recorder = useRef(null), mediaStream = useRef(null), timer = useRef(null), mounted = useRef(true), connection = useRef(null);
  const slide = presentation.slides[activeSlideIndex];
  const n = slideNarration(slide);
  const currentJobs = jobs.filter(job => job.presentationId === presentation.id && job.slideId === slide?.id);

  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false; clearTimeout(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
    mediaStream.current?.getTracks().forEach(track => track.stop());
  }; }, []);
  useEffect(() => { localStorage.setItem('ppt_speech_jobs', JSON.stringify(jobs)); }, [jobs]);
  useEffect(() => { localStorage.setItem('ppt_voice_profiles', JSON.stringify(voices)); }, [voices]);
  // Upgrade existing clips using a cheap PCM scan, without regenerating speech.
  const missingTiming = presentation.slides.filter(item => narrationReady(item.narration) &&
    (item.narration.audio_start_ms == null || item.narration.audio_end_ms == null)).map(item => item.narration.asset_id);
  const timingKey = JSON.stringify([presentation.id, ...new Set(missingTiming)]);
  useEffect(() => {
    let live = true;
    const deckId = presentation.id;
    Promise.allSettled([...new Set(missingTiming)].map(async assetId => {
      const result = await speechRequest(`/assets/${assetId}/result.json`);
      if (!live || !Number.isFinite(result.audio_start_ms) || !Number.isFinite(result.audio_end_ms)) return;
      updatePresentation(prev => prev.id !== deckId ? prev : ({ ...prev, slides: prev.slides.map(item =>
        item.narration?.asset_id === assetId ? { ...item, narration: { ...item.narration,
          audio_start_ms: result.audio_start_ms, audio_end_ms: result.audio_end_ms } } : item) }));
    }));
    return () => { live = false; };
  }, [timingKey, updatePresentation]);
  useEffect(() => {
    if (!file) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(file); setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (!jobs.some(job => job.presentationId === presentation.id)) return;
    let live = true, timeout;
    async function poll() {
      const finished = [];
      let failed = false;
      for (const tracked of jobs.filter(job => job.presentationId === presentation.id)) {
        try {
          const state = await speechRequest(`/jobs/${tracked.id}`);
          if (!live) return;
          setStates(old => ({ ...old, [tracked.id]: state }));
          if (['complete', 'failed', 'cancelled'].includes(state.status)) {
            finished.push(tracked.id);
            if (state.status === 'complete' && state.kind === 'speech') updatePresentation(prev => applyNarrationResult(prev, tracked, state.result));
            if (state.status === 'failed') setError(state.error || 'Generation failed');
          }
        } catch (e) {
          if (!live) return;
          failed = true; setError(e.message);
          if (/not found/i.test(e.message)) finished.push(tracked.id);
        }
      }
      if (!live) return;
      if (finished.length) setJobs(old => old.filter(job => !finished.includes(job.id)));
      else timeout = setTimeout(poll, failed ? 5000 : 1000);
    }
    poll();
    return () => { live = false; clearTimeout(timeout); };
  }, [jobs, presentation.id, updatePresentation]);

  function change(patch) {
    const id = slide?.id;
    updatePresentation(prev => prev.id !== presentation.id ? prev : ({ ...prev, slides: prev.slides.map(item => item.id === id
      ? { ...item, narration: { ...narrationDefaults(), ...item.narration, ...patch } } : item) }));
  }
  function connect() {
    if (connection.current) return connection.current;
    setConnecting(true); setError('');
    connection.current = Promise.all([speechRequest('/voices'), speechRequest('/capabilities')]).then(([list, caps]) => {
      if (mounted.current) { setVoices(list); setCapabilities(caps.engines); }
      return caps.engines;
    }).catch(e => { if (mounted.current) setError(e.message); return null; }).finally(() => {
      if (mounted.current) setConnecting(false);
      connection.current = null;
    });
    return connection.current;
  }
  async function generate() {
    setError('');
    setSubmitting(true);
    // Capture defaults at the click, before awaiting startup, without replacing later edits.
    change(n);
    const caps = await connect();
    if (!mounted.current) return;
    if (!caps) { setSubmitting(false); return; }
    for (const engine of [n.engine, 'align']) {
      const status = caps.find(item => item.id === engine);
      if (!status?.available) { setError(status?.reason || 'Speech engine unavailable'); setSubmitting(false); return; }
    }
    try {
      const job = await speechPost('/generate', { script: n.script, engine: n.engine, voice_id: n.voice_id });
      const tracked = { id: job.id, presentationId: presentation.id, slideId: slide.id };
      if (mounted.current) setJobs(old => [...old, tracked]);
      else localStorage.setItem('ppt_speech_jobs', JSON.stringify([...readSaved('ppt_speech_jobs', []), tracked]));
    } catch (e) { if (mounted.current) setError(e.message); }
    finally { if (mounted.current) setSubmitting(false); }
  }
  async function record() {
    if (recording) { recorder.current?.stop(); return; }
    setError('');
    try {
      mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { mediaStream.current.getTracks().forEach(track => track.stop()); return; }
      const media = new MediaRecorder(mediaStream.current);
      recorder.current = media;
      const parts = [];
      media.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
      media.onstop = () => {
        clearTimeout(timer.current); mediaStream.current?.getTracks().forEach(track => track.stop());
        if (mounted.current) { setFile(new File(parts, 'recording.webm', { type: media.mimeType })); setStart('0'); setEnd(''); setRecording(false); }
      };
      media.start(); setRecording(true);
      timer.current = setTimeout(() => { if (media.state === 'recording') media.stop(); }, 14500);
    } catch (e) { mediaStream.current?.getTracks().forEach(track => track.stop()); setError(`Microphone: ${e.message}`); }
  }
  async function saveVoice() {
    setUploading(true); setError('');
    try {
      const data = new FormData();
      data.append('name', name); data.append('transcript', transcript); data.append('audio', file); data.append('start', start || '0');
      if (end !== '') data.append('end', end);
      const profile = await speechRequest('/voices', { method: 'POST', body: data });
      setVoices(old => [...old, profile]); change({ voice_id: profile.id }); setFile(null); setTranscript('');
    } catch (e) { setError(e.message); } finally { setUploading(false); }
  }
  const run = action => Promise.resolve().then(action).catch(e => setError(e.message));
  return { n, voices, capabilities, error, setError, connecting, submitting, connect, change, generate, jobs: currentJobs, states,
    deckJobs: jobs.filter(job => job.presentationId === presentation.id),
    cancel: id => run(() => speechRequest(`/jobs/${id}`, { method: 'DELETE' })),
    stop: () => run(() => speechPost('/service/stop', {})),
    file, setFile, name, setName, transcript, setTranscript, start, setStart, end, setEnd,
    previewUrl, record, recording, uploading, saveVoice, run };
}
