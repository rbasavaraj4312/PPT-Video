import React, { useEffect, useState } from 'react';
import { speechUrl } from '../../services/speech';
import { wavPeaks } from '../../narration/editorState.js';

const cache = new Map();
export function AudioWaveform({ assetId, className = '', label = 'Narration waveform', fromMs = 0, toMs, durationMs }) {
  const [peaks, setPeaks] = useState(null);
  useEffect(() => {
    setPeaks(null);
    if (!assetId) return;
    let live = true;
    if (!cache.has(assetId)) {
      if (cache.size > 100) cache.delete(cache.keys().next().value);
      cache.set(assetId, fetch(speechUrl(`/assets/${assetId}/narration.wav`)).then(response => {
        if (!response.ok) throw new Error('Audio unavailable');
        return response.arrayBuffer();
      }).then(buffer => wavPeaks(buffer)).catch(() => null));
    }
    cache.get(assetId).then(value => { if (live) setPeaks(value); });
    return () => { live = false; };
  }, [assetId]);
  const max = Math.max(.01, ...(peaks || []));
  const left = durationMs ? Math.max(0, fromMs / durationMs * 216) : 0;
  const right = durationMs && toMs != null ? Math.min(216, toMs / durationMs * 216) : 216;
  return <svg className={className} viewBox={`${left} 0 ${Math.max(1, right - left)} 32`} preserveAspectRatio="none" role="img" aria-label={label}>
    {peaks ? peaks.map((peak, index) => <line key={index} x1={index * 3 + 1} x2={index * 3 + 1}
      y1={16 - Math.max(.6, peak / max * 14)} y2={16 + Math.max(.6, peak / max * 14)} stroke="currentColor" strokeWidth="1.5" />)
      : <line x1="0" x2="216" y1="16" y2="16" stroke="currentColor" strokeWidth="1" opacity=".3" />}
  </svg>;
}
