import React from 'react';
import { registerRoot, Composition } from 'remotion';
import { NarratedComposition } from './NarratedComposition';
import { buildTimeline } from './timeline';
import 'narration-render-styles';

registerRoot(() => <Composition id="NarratedPresentation" component={NarratedComposition}
  width={1920} height={1080} fps={30} durationInFrames={30}
  defaultProps={{ presentation: { slides: [] }, assetBase: '' }}
  calculateMetadata={({ props }) => ({ durationInFrames: buildTimeline(props.presentation, 30).totalFrames,
    width: props.presentation.aspect_ratio === '9:16' ? 1080 : 1920,
    height: props.presentation.aspect_ratio === '9:16' ? 1920 : 1080 })} />);
