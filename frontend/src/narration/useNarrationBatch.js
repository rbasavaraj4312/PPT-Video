import { useEffect, useRef, useState } from 'react';
import { speechPost, speechRequest } from '../services/speech';
import { savePresentation } from '../services/api';
import { applyBatchResults, latestBatchRows, prepareVoiceBatch } from './batchState.js';

const KEY = 'ppt_narration_batches';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };

export function useNarrationBatch({ presentation, updatePresentation }) {
  const [tracked, setTracked] = useState(read), [batches, setBatches] = useState({});
  const [submitting, setSubmitting] = useState(false), [error, setError] = useState('');
  const guard = useRef(false), mounted = useRef(true), current = useRef(presentation);
  current.current = presentation;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  function remember(refs) {
    // Write before enqueueing: a refresh can recover an ambiguous HTTP response
    // by resending the same idempotent request identifier.
    localStorage.setItem(KEY, JSON.stringify(refs));
    setTracked(refs);
  }
  const deckRefs = tracked.filter(item => item.presentationId === presentation.id);
  const key = JSON.stringify(deckRefs);
  useEffect(() => {
    if (!deckRefs.length) return;
    let live = true, timeout;
    const finished = new Set();
    async function poll() {
      let waiting = false;
      for (const ref of deckRefs) {
        if (finished.has(ref.id)) continue;
        try {
          const batch = ref.pending ? await speechPost('/batches', ref.pending) : await speechRequest(`/batches/${ref.id}`);
          if (!live) return;
          setError('');
          setBatches(previous => ({ ...previous, [batch.id]: batch }));
          updatePresentation(previous => applyBatchResults(previous, batch), false);
          if (batch.finished) finished.add(ref.id);
          else waiting = true;
          if (ref.pending) {
            // Keep references to completed batches too; they restore unsaved
            // completed audio after a reload without storing captions in storage.
            setTracked(previous => {
              const next = previous.map(item => item.id === ref.id ? { id: item.id, presentationId: item.presentationId } : item);
              try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* Existing reference remains recoverable. */ }
              return next;
            });
          }
        } catch (exception) {
          if (!live) return;
          setError(exception.message);
          if ([400, 404, 422].includes(exception.status)) {
            finished.add(ref.id);
            setBatches(previous => ({ ...previous, [ref.id]: { id: ref.id, presentation_id: ref.presentationId, finished: true,
              slides: (ref.pending?.slides || []).map(task => ({ ...task, job: { status: 'failed', phase: 'Failed', error: exception.message } })) } }));
          } else waiting = true;
        }
      }
      if (live && waiting) timeout = setTimeout(poll, 1500);
    }
    poll();
    return () => { live = false; clearTimeout(timeout); };
  }, [key, presentation.id, updatePresentation]);

  const ordered = deckRefs.map(ref => batches[ref.id]).filter(Boolean);
  const rows = latestBatchRows(ordered);
  const busy = deckRefs.some(ref => !batches[ref.id]?.finished);
  async function start(options) {
    if (guard.current || busy) return;
    guard.current = true; setSubmitting(true); setError('');
    const original = current.current;
    try {
      const prepared = prepareVoiceBatch(original, options);
      if (!prepared.tasks.length) return;
      // Save scripts and voice choices before starting durable background jobs.
      await savePresentation(prepared.presentation);
      if (!mounted.current || current.current.id !== original.id) return;
      const changed = prepared.presentation.slides.some((slide, index) => slide.narration?.script !== current.current.slides[index]?.narration?.script);
      if (changed || current.current !== original) throw new Error('The presentation changed while saving. Review it and generate again.');
      updatePresentation(prepared.presentation);
      const id = 'batch-' + crypto.randomUUID().replaceAll('-', '');
      const request = { id, presentation_id: original.id, slides: prepared.tasks };
      remember([...read(), { id, presentationId: original.id, pending: request }]);
      // The polling effect sends the persisted request if this batch is new.
    } catch (exception) { if (mounted.current) setError(exception.message); }
    finally { guard.current = false; if (mounted.current) setSubmitting(false); }
  }
  async function cancel(batchId) {
    try {
      const batch = await speechRequest(`/batches/${batchId}`, { method: 'DELETE' });
      setBatches(previous => ({ ...previous, [batch.id]: batch }));
    } catch (exception) { setError(exception.message); }
  }
  return { rows, batches: ordered, busy, submitting, error, setError, start, cancel };
}
