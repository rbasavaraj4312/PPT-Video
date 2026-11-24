import React from 'react';
import { OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export function MediaSubtitles({ media, timeMs, scale = 1 }) {
  if (!media) return null;
  const cues = (media.subtitles || []).filter(cue => cue.text.trim() && timeMs >= cue.startMs && timeMs < cue.endMs);
  if (!cues.length) return null;
  const position = media.subtitle_position === 'top' ? { top: '7%' }
    : media.subtitle_position === 'center' ? { top: '50%', transform: 'translateY(-50%)' } : { bottom: '7%' };
  return <div style={{ position: 'absolute', left: '5%', width: '90%', textAlign: 'center', pointerEvents: 'none', zIndex: 41, ...position }}>
    <span style={{ display: 'inline-block', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#fff', background: 'rgba(0,0,0,.8)', borderRadius: 8 * scale, padding: `${8 * scale}px ${16 * scale}px`, font: `600 ${(media.subtitle_size || 34) * scale}px/1.4 Arial, sans-serif` }}>{cues.map(c => c.text).join('\n')}</span>
  </div>;
}

export function MediaClip({ media, scale }) {
  const frame = useCurrentFrame(), { fps } = useVideoConfig();
  return <>
    {media.kind === 'video' && <OffthreadVideo src={/^(data:|https?:)/.test(media.src) ? media.src : staticFile(media.src)} trimBefore={Math.floor(media.trim_start * fps)} trimAfter={Math.ceil(media.trim_end * fps)}
      muted={media.muted} volume={media.volume} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: media.fit, background: '#000' }} />}
    <MediaSubtitles media={media} timeMs={frame / fps * 1000} scale={scale} />
  </>;
}
