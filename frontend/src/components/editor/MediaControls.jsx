import React from 'react';
import { Film, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { mediaDuration, mediaGeometry } from '../../rendering/mediaModel.js';

export function MediaControls({ slide, vertical, onChange, onEdit }) {
  const media = slide?.media;
  if (!media) return null;
  const duration = mediaDuration(slide);
  const isVideo = media.kind === 'video';
  const Icon = isVideo ? Film : ImageIcon;
  const change = patch => { onEdit(); onChange({ media: { ...media, ...patch } }); };
  const number = (label, value, min, max, apply, step = .01, visibleLabel = label) => <label className="media-field">
    <span>{visibleLabel}</span>
    <input className="editor-field" aria-label={label} type="number" min={min} max={max} step={step}
      value={Number(Number(value).toFixed(3))}
      onChange={event => { if (event.target.value !== '' && Number.isFinite(Number(event.target.value))) apply(Math.max(min, Math.min(max, Number(event.target.value)))); }} />
  </label>;

  return <section className="inspector-section media-controls">
    <div className="media-control-heading"><h3 className="inspector-heading"><Icon size={15} />{isVideo ? 'Video clip' : 'Image clip'}</h3><span className="media-duration">{duration.toFixed(2)} s</span></div>
    <p className="media-file-name editor-hint" title={media.name}>{media.name}</p>
    <div className="media-control-group">
      {isVideo ? <>
        <div className="media-field-grid">
          {number('Video start (s)', media.trim_start, 0, media.trim_end - .1, value => change({ trim_start: value }), .01, 'Start (s)')}
          {number('Video end (s)', media.trim_end, media.trim_start + .1, media.duration, value => change({ trim_end: value }), .01, 'End (s)')}
        </div>
        <div className="media-audio-row">
          <label className="editor-check"><input type="checkbox" checked={media.muted} onChange={event => change({ muted: event.target.checked })} />Mute video audio</label>
          {number('Video volume (%)', Math.round(media.volume * 100), 0, 100, value => change({ volume: value / 100 }), 1, 'Volume (%)')}
        </div>
      </> : number('Image duration (s)', slide.slide_duration, .5, 3600, value => { onEdit(); onChange({ slide_duration: value }); }, .1)}
      <label className="media-field"><span>Media fit</span><select className="editor-field" aria-label="Media fit" value={media.fit} onChange={event => {
        const fit = event.target.value, image = slide.elements[0]; onEdit();
        onChange({ media: { ...media, fit }, elements: slide.elements.map((element, index) => index ? element : {
          ...element, ...mediaGeometry({ fit }, vertical ? 720 : 1280, vertical ? 1280 : 720, image?.image_width || 1, image?.image_height || 1),
        }) });
      }}><option value="contain">Fit · Show entire media</option><option value="cover">Fill · Crop edges</option></select></label>
    </div>

    <div className="media-control-group media-subtitles">
      <h3 className="inspector-heading">Media subtitles</h3>
      <p className="editor-hint">Time subtitles from the start of the trimmed clip.</p>
      <div className="media-field-grid">
        <label className="media-field"><span>Position</span><select className="editor-field" aria-label="Subtitle position" value={media.subtitle_position || 'bottom'} onChange={event => change({ subtitle_position: event.target.value })}>
          {['top', 'center', 'bottom'].map(position => <option key={position} value={position}>{position[0].toUpperCase() + position.slice(1)}</option>)}
        </select></label>
        {number('Subtitle size', media.subtitle_size || 34, 16, 160, value => change({ subtitle_size: value }), 1, 'Text size (px)')}
      </div>
      {(media.subtitles || []).map((cue, index) => {
        const patch = update => change({ subtitles: media.subtitles.map((item, i) => i === index ? { ...item, ...update } : item) });
        return <div key={index} className="media-subtitle-row">
          <div className="media-control-heading"><span className="editor-hint">Subtitle {index + 1}</span>
            <button className="editor-icon-button" aria-label={`Remove subtitle ${index + 1}`} title="Remove subtitle" onClick={() => change({ subtitles: media.subtitles.filter((_, i) => i !== index) })}><Trash2 size={13} /></button>
          </div>
          <textarea className="editor-field" rows={2} aria-label={`Subtitle ${index + 1}`} placeholder="Subtitle text" value={cue.text} maxLength={2000} onChange={event => patch({ text: event.target.value })} />
          <div className="media-field-grid">
            {number(`Subtitle ${index + 1} start (s)`, cue.startMs / 1000, 0, Math.max(0, Math.min(duration, cue.endMs / 1000) - .01), value => patch({ startMs: value * 1000 }), .01, 'Start (s)')}
            {number(`Subtitle ${index + 1} end (s)`, cue.endMs / 1000, cue.startMs / 1000 + .01, Math.max(duration, cue.startMs / 1000 + .01), value => patch({ endMs: value * 1000 }), .01, 'End (s)')}
          </div>
          {cue.endMs > duration * 1000 && <p role="alert" className="editor-hint">This subtitle extends beyond the clip. Adjust its timing.</p>}
        </div>;
      })}
      <button className="editor-secondary full" onClick={() => change({ subtitles: [...(media.subtitles || []), { text: '', startMs: 0, endMs: duration * 1000 }] })}><Plus size={14} />Add subtitle</button>
    </div>
  </section>;
}
