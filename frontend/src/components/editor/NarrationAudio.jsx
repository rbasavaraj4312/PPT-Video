import React, { useRef, useState } from 'react';
import { Download, Pause, Play } from 'lucide-react';
import { speechUrl } from '../../services/speech';
import { AudioWaveform } from './AudioWaveform';

export function NarrationAudio({ narration, onError }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false), [time, setTime] = useState(0);
  const url = speechUrl(`/assets/${narration.asset_id}/narration.wav`);
  async function toggle() {
    try { if (playing) ref.current.pause(); else await ref.current.play(); }
    catch (error) { onError(error.message); }
  }
  return <div className="narration-audio-dock">
    <audio ref={ref} src={url} preload="none" onTimeUpdate={() => setTime(ref.current.currentTime)}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onError={() => onError('Narration audio could not be loaded. Try generating it again.')} />
    <button className="editor-icon-button" aria-label={playing ? 'Pause narration audio' : 'Play narration audio'} onClick={toggle}>{playing ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}</button>
    <div className="narration-audio-wave"><AudioWaveform assetId={narration.asset_id} className="inspector-waveform" />
      <input type="range" aria-label="Seek narration audio" min="0" max={narration.duration_ms / 1000} step=".01" value={time} onChange={event => { ref.current.currentTime = Number(event.target.value); setTime(Number(event.target.value)); }} />
    </div><span>{time.toFixed(1)}s</span><a className="editor-icon-button" href={url} download aria-label="Download narration audio"><Download size={13} /></a>
  </div>;
}
