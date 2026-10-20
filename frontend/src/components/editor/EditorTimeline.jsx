import React, { useEffect, useRef, useState } from 'react';
import { Captions, Layers, Mic, Minus, Pause, Play, Plus, SkipBack, SkipForward, Sparkles } from 'lucide-react';
import { resolveReveal } from '../../narration/reveals.js';
import { narrationReady } from '../../narration/timeline';
import { AudioWaveform } from './AudioWaveform';
import { SlideThumbnail } from './SlideThumbnail';

const clock = frames => `${Math.floor(frames / 1800).toString().padStart(2, '0')}:${((frames % 1800) / 30).toFixed(1).padStart(4, '0')}`;

export function EditorTimeline({ presentation, timeline, frame, playing, onSeek, onTogglePlay, onCaptionSelect, onRevealSelect, activeSlideIndex }) {
  const [zoom, setZoom] = useState(1);
  const [trackWidth, setTrackWidth] = useState(800);
  const scroll = useRef(null);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setTrackWidth(entry.contentRect.width));
    observer.observe(scroll.current);
    return () => observer.disconnect();
  }, []);
  const { items, totalFrames } = timeline;
  const reveals = items.flatMap((item, slideIndex) => (item.slide.elements || []).filter(element => element.reveal).map(element => ({
    element, slideIndex, resolved: resolveReveal(items, slideIndex, element), start: item.start,
    label: element.content || element.text || (element.type === 'image' ? element.image_name : null) || element.motion_data?.title || element.type,
  })));
  // Pack nearby markers into separate rows so every linked element stays clickable.
  const rowEnds = [];
  for (const cue of [...reveals].sort((a, b) => (a.resolved.trigger ?? a.start) - (b.resolved.trigger ?? b.start))) {
    const x = Math.max(0, cue.resolved.valid ? cue.resolved.trigger : cue.start) / totalFrames * trackWidth * zoom;
    let row = rowEnds.findIndex(end => end + 4 <= x);
    if (row < 0) row = rowEnds.length;
    cue.row = row;
    rowEnds[row] = x + Math.min(130, 28 + cue.label.length * 6);
  }
  const percent = value => `${value / totalFrames * 100}%`;
  function seekPointer(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(totalFrames - 1, Math.round((event.clientX - rect.left) / rect.width * totalFrames))));
  }
  function jump(direction) {
    const target = Math.max(0, Math.min(items.length - 1, activeSlideIndex + direction));
    onSeek(items[target]?.start || 0);
  }
  const tickSeconds = Math.max(1, Math.ceil(totalFrames / 30 / 5));
  return <section className={`workspace-timeline${reveals.length ? ' has-reveals' : ''}`} aria-label="Presentation timeline">
    <div className="timeline-header"><h2>Timeline</h2><div className="timeline-playback">
      <button className="editor-icon-button" aria-label="Previous slide" onClick={() => jump(-1)}><SkipBack size={15} /></button>
      <button className="editor-icon-button" aria-label={playing ? 'Pause preview' : 'Play preview'} onClick={onTogglePlay}>{playing ? <Pause size={19} /> : <Play size={19} fill="currentColor" />}</button>
      <button className="editor-icon-button" aria-label="Next slide" onClick={() => jump(1)}><SkipForward size={15} /></button>
      <span className="timeline-clock">{clock(frame)} <span>/ {clock(totalFrames)}</span></span>
    </div><div className="timeline-zoom"><button className="editor-icon-button" aria-label="Zoom timeline out" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .5))}><Minus size={13} /></button><button className="editor-icon-button" aria-label="Zoom timeline in" disabled={zoom >= 4} onClick={() => setZoom(value => Math.min(4, value + .5))}><Plus size={13} /></button><button className="editor-text-button" onClick={() => { setZoom(1); if (scroll.current) scroll.current.scrollLeft = 0; }}>Fit</button></div></div>
    <div className="timeline-body"><div className="timeline-labels"><div /><span><Layers size={14} />Slides</span><span><Mic size={14} />Voice</span><span><Captions size={14} />Captions</span>{reveals.length > 0 && <span><Sparkles size={14} />Reveals</span>}</div>
      <div ref={scroll} className="timeline-scroll"><div className="timeline-surface" style={{ width: `${zoom * 100}%` }}>
        <div className="timeline-ruler" role="slider" aria-label="Timeline playhead" aria-valuemin={0} aria-valuemax={totalFrames - 1} aria-valuenow={frame} aria-valuetext={`${(frame / 30).toFixed(1)} seconds`} tabIndex={0}
          onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); seekPointer(event); }}
          onPointerMove={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) seekPointer(event); }}
          onKeyDown={event => { const value = event.key === 'Home' ? 0 : event.key === 'End' ? totalFrames - 1 : event.key === 'ArrowRight' ? frame + 1 : event.key === 'ArrowLeft' ? frame - 1 : null; if (value !== null) { event.preventDefault(); onSeek(value); } }}>
          {Array.from({ length: Math.floor(totalFrames / 30 / tickSeconds) + 1 }, (_, index) => <span key={index} style={{ left: percent(index * tickSeconds * 30) }}>{index * tickSeconds}s</span>)}
        </div>
        <div className="timeline-lane slides-lane">{items.map((item, index) => <React.Fragment key={item.slide.id}>
          <button className={`timeline-slide-clip ${index === activeSlideIndex ? 'selected' : ''}`} style={{ left: percent(item.start), width: percent(item.hold) }} title={item.slide.title} onClick={() => onSeek(item.start)}><SlideThumbnail slide={item.slide} vertical={presentation.aspect_ratio === '9:16'} /><span>{item.slide.title || `Slide ${index + 1}`}</span></button>
          {item.transition > 0 && <button className="timeline-transition" style={{ left: percent(item.transition_start), width: percent(item.transition) }} title={`${item.slide.transition_type || 'morph'} overlap · ${(item.transition / 30).toFixed(2)} s · narration continues`} onClick={() => onSeek(item.transition_start)}>{item.slide.transition_type === 'fade' ? 'Fade' : 'Morph'}</button>}
        </React.Fragment>)}</div>
        <div className="timeline-lane">{items.map(item => <button key={item.slide.id} className={`timeline-voice-clip ${item.narrated ? '' : 'empty'}`} style={{ left: percent(item.start), width: percent(item.narrated ? item.audio_frames : item.hold) }} onClick={() => onSeek(item.start)} title={item.narrated ? `Narration: ${(item.audio_frames / 30).toFixed(1)} seconds` : 'Generate narration for this slide'}>
          {item.narrated ? <AudioWaveform assetId={item.slide.narration.asset_id} fromMs={item.audio_from / 30 * 1000} toMs={(item.audio_from + item.audio_frames) / 30 * 1000} durationMs={item.slide.narration.duration_ms} className="timeline-waveform" /> : <span>No narration</span>}
        </button>)}</div>
        <div className="timeline-lane caption-lane">{items.flatMap((item, slideIndex) => {
          const n = item.slide.narration;
          if (!narrationReady(n) || n.caption_style?.enabled === false) return [];
          const size = n.caption_style?.words_per_phrase || 6;
          return n.captions.filter((_, index) => index % size === 0).map((_, group) => {
            const words = n.captions.slice(group * size, (group + 1) * size);
            const from = item.start - item.audio_from + words[0].startMs / 1000 * 30;
            const to = item.start - item.audio_from + words[words.length - 1].endMs / 1000 * 30;
            const text = words.map(word => word.text.trim()).join(' ');
            return <button key={`${item.slide.id}-${group}`} className={`timeline-caption-clip ${frame >= from && frame < to ? 'active' : ''}`} style={{ left: percent(from), width: percent(Math.max(1, to - from)) }} title={text} onClick={() => { onSeek(Math.floor(from)); onCaptionSelect(slideIndex); }}>{text}</button>;
          });
        })}</div>
        {reveals.length > 0 && <div className="timeline-lane reveal-lane"><div className="reveal-marker-surface" style={{ height: rowEnds.length * 16 + 6 }}>{reveals.map(({ element, slideIndex, resolved, start, label, row }) => {
          const target = Math.max(0, Math.min(totalFrames - 1, resolved.valid ? resolved.trigger : start));
          return <button key={`${slideIndex}-${element.id}`} className={`timeline-reveal-marker${resolved.valid ? '' : ' unresolved'}`} style={{ left: percent(target), top: 3 + row * 16 }}
            aria-label={`Reveal ${label} on word ${element.reveal.word_index + 1}: ${element.reveal.word_text}`}
            title={resolved.valid ? `${label} · “${element.reveal.word_text}” · ${(target / 30).toFixed(2)} s` : `${label}: ${resolved.issue}`}
            onClick={() => onRevealSelect?.(slideIndex, element.id, target)}><Sparkles size={11} /><span>{label}</span></button>;
        })}</div></div>}
        <div className="timeline-playhead" style={{ left: percent(frame) }} aria-hidden="true"><span /></div>
      </div></div>
    </div>
  </section>;
}
