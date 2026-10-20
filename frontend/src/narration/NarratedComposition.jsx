import React from 'react';
import { Sequence, useCurrentFrame, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { CaptionOverlay } from './CaptionOverlay';
import { RemotionSlideRenderer } from '../motion/core/RemotionSlideRenderer';
import { buildTimeline, motionSlideAtFrame, morphSlide, visualAtFrame } from './timeline';

function NarrationTrack({ item, scale, assetBase }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = item.slide.narration;
  return <>
    <Audio src={`${assetBase}/${n.asset_id}/narration.wav`} trimBefore={item.audio_from} trimAfter={item.audio_from + item.audio_frames} />
    <CaptionOverlay narration={n} timeMs={(frame + item.audio_from) / fps * 1000} scale={scale} />
  </>;
}

export function NarratedComposition({ presentation, assetBase }) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const vertical = presentation?.aspect_ratio === '9:16';
  const scale = width / (vertical ? 720 : 1280);
  const { items } = buildTimeline(presentation, fps);
  const { index, inTransition, progress } = visualAtFrame(items, frame);
  const item = items[index];
  if (!item) return null;
  const normal = motionSlideAtFrame(items, index, frame, fps);
  const next = items[index + 1] ? motionSlideAtFrame(items, index + 1, frame, fps) : null;
  const display = inTransition && item.slide.transition_type !== 'fade' ? morphSlide(normal, next, progress) : normal;
  return <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
    <RemotionSlideRenderer slide={display} scale={scale} isVertical={vertical} />
    {inTransition && item.slide.transition_type === 'fade' && <div style={{ position: 'absolute', inset: 0, opacity: progress }}>
      <RemotionSlideRenderer slide={next} scale={scale} isVertical={vertical} />
    </div>}
    {items.filter(entry => entry.narrated).map(entry => <Sequence key={entry.slide.id} from={entry.start}
      durationInFrames={entry.audio_frames} premountFor={fps}>
      <NarrationTrack item={entry} scale={scale} assetBase={assetBase} />
    </Sequence>)}
  </div>;
}
