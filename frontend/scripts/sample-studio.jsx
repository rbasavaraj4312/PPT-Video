import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { NarratedComposition } from '../src/narration/NarratedComposition';
import { buildTimeline } from '../src/narration/timeline';
import '../src/index.css';

registerRoot(() => <Composition
  id="MomentumDemo"
  component={NarratedComposition}
  width={1920}
  height={1080}
  fps={30}
  durationInFrames={30}
  defaultProps={{ presentation: { slides: [] }, assetBase: 'http://127.0.0.1:8766/assets' }}
  calculateMetadata={async () => {
    const presentation = await fetch('http://127.0.0.1:8766/presentation.json').then(response => {
      if (!response.ok) throw new Error('Generate the sample presentation first.');
      return response.json();
    });
    return { durationInFrames: buildTimeline(presentation, 30).totalFrames,
      props: { presentation, assetBase: 'http://127.0.0.1:8766/assets' } };
  }}
/>);
