import React from 'react';
import { interpolate, interpolateColors, spring } from 'remotion';
import { useSafeFrame } from '../../motion/core/useSafeFrame';

/**
 * MarkerHighlight - Remocn Typography Component
 * Colored marker highlighter bar draws behind a phrase as the text color shifts.
 * 100% transparent background for seamless slide & video integration.
 */
export function MarkerHighlight({
  before = 'Made for ',
  highlight = 'builders',
  after = '.',
  markerColor = '#facc15',
  baseColor = '#171717',
  highlightedTextColor = '#171717',
  fontSize = 72,
  fontWeight = '600',
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 60;
  const { frame: safeFrame, fps } = useSafeFrame(30, { loop, maxFrames });
  const frame = safeFrame * speed;

  const markerScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14 },
  });

  const clampedScale = Math.max(0, markerScale);

  let textColor = highlightedTextColor;
  try {
    textColor = interpolateColors(
      interpolate(markerScale, [0.5, 0.8], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
      [0, 1],
      [baseColor, highlightedTextColor]
    );
  } catch (err) {
    textColor = markerScale >= 0.5 ? highlightedTextColor : baseColor;
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        background: 'transparent',
        ...style,
      }}
    >
      <span
        className={className}
        style={{
          fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize,
          fontWeight,
          color: baseColor,
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          display: 'inline-block',
          textAlign: 'center',
          maxWidth: '100%',
          wordBreak: 'break-word',
        }}
      >
        {before}
        <span style={{ position: 'relative', display: 'inline-block' }}>
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: '0 -0.1em',
              backgroundColor: markerColor,
              transformOrigin: 'left center',
              transform: `scaleX(${clampedScale})`,
              borderRadius: '4px',
              zIndex: 0,
            }}
          />
          <span style={{ position: 'relative', zIndex: 1, color: textColor }}>
            {highlight}
          </span>
        </span>
        {after}
      </span>
    </div>
  );
}

export default MarkerHighlight;
