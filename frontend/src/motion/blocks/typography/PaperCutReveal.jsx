import React from 'react';
import { interpolate, spring } from 'remotion';
import { useSafeFrame } from '../../core/useSafeFrame';

/**
 * PaperCutReveal - Tactile Layered Paper Cutout Collage
 * Words slide in from alternating directions with soft multi-layered paper shadows
 * and a 3D fold tilt, stacking into an editorial cutout collage.
 */
export function PaperCutReveal({
  word1 = 'CRAFT',
  word2 = 'DESIGN',
  word3 = 'INNOVATE',
  tagText = 'EDITORIAL COLLAGE // VOL. 04',
  paperColor1 = '#fef08a', // Canary Yellow
  paperColor2 = '#fda4af', // Rose Pastel
  paperColor3 = '#67e8f9', // Cyan Mint
  textColor = '#0f172a',
  fontSize = 48,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 65;
  const { frame: rawFrame, fps } = useSafeFrame(30, { loop, maxFrames });
  const frame = rawFrame * Math.max(0.2, speed);

  // Spring physics for each paper layer
  const s1 = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 14, stiffness: 140, mass: 0.8 },
  });

  const s2 = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 13, stiffness: 150, mass: 0.85 },
  });

  const s3 = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 14, stiffness: 130, mass: 0.9 },
  });

  // Layer 1: Slides from Top-Left
  const x1 = (1 - s1) * -220;
  const y1 = (1 - s1) * -70;
  const rot1 = interpolate(s1, [0, 1], [-14, -3]);
  const fold1 = (1 - s1) * 20;

  // Layer 2: Slides from Right
  const x2 = (1 - s2) * 240;
  const y2 = (1 - s2) * 30;
  const rot2 = interpolate(s2, [0, 1], [12, 2.5]);
  const fold2 = (1 - s2) * -18;

  // Layer 3: Slides from Bottom-Left
  const x3 = (1 - s3) * -160;
  const y3 = (1 - s3) * 120;
  const rot3 = interpolate(s3, [0, 1], [-10, -1.5]);
  const fold3 = (1 - s3) * 15;

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-visible ${className}`}
      style={{
        backgroundColor: 'transparent',
        background: 'transparent',
        perspective: '1200px',
        ...style,
      }}
    >
      {/* Top Editorial Tag */}
      {tagText && (
        <div
          className="mb-3 px-3 py-0.5 rounded text-[11px] font-mono font-bold tracking-widest uppercase"
          style={{
            backgroundColor: '#ffffff15',
            color: '#f8fafc',
            border: '1px solid #ffffff25',
            backdropFilter: 'blur(8px)',
            opacity: Math.min(1, s1 * 1.5),
            transform: `translateY(${(1 - s1) * -10}px)`,
          }}
        >
          {tagText}
        </div>
      )}

      {/* Stacked Paper Cutout Collage Group */}
      <div className="relative flex flex-col items-center justify-center gap-1.5" style={{ transformStyle: 'preserve-3d' }}>
        {/* Paper Layer 1 (Top / Yellow) */}
        {word1 && (
          <div
            className="relative px-6 py-2.5 rounded-lg flex items-center justify-center"
            style={{
              zIndex: 10,
              backgroundColor: paperColor1,
              color: textColor,
              transform: `translate3d(${x1}px, ${y1}px, 0) rotate(${rot1}deg) rotateX(${fold1}deg)`,
              boxShadow: `
                4px 10px 24px rgba(0,0,0,0.35),
                0 2px 4px rgba(0,0,0,0.2),
                inset 0 1px 0 rgba(255,255,255,0.7),
                inset 0 -1px 0 rgba(0,0,0,0.15)
              `,
              opacity: Math.min(1, s1 * 2),
            }}
          >
            {/* Washi tape accent on top edge */}
            <span
              className="absolute -top-2 left-6 w-8 h-4 rounded-sm bg-white/40 border border-white/60 pointer-events-none"
              style={{ transform: 'rotate(-5deg)' }}
            />
            <span
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {word1}
            </span>
          </div>
        )}

        {/* Paper Layer 2 (Middle / Rose) */}
        {word2 && (
          <div
            className="relative -mt-2 px-7 py-3 rounded-lg flex items-center justify-center ml-10"
            style={{
              zIndex: 20,
              backgroundColor: paperColor2,
              color: textColor,
              transform: `translate3d(${x2}px, ${y2}px, 0) rotate(${rot2}deg) rotateY(${fold2}deg)`,
              boxShadow: `
                6px 14px 28px rgba(0,0,0,0.4),
                0 3px 6px rgba(0,0,0,0.25),
                inset 0 1px 0 rgba(255,255,255,0.7),
                inset 0 -1px 0 rgba(0,0,0,0.15)
              `,
              opacity: Math.min(1, s2 * 2),
            }}
          >
            <span
              style={{
                fontSize: `${fontSize * 1.05}px`,
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {word2}
            </span>
          </div>
        )}

        {/* Paper Layer 3 (Bottom / Cyan) */}
        {word3 && (
          <div
            className="relative -mt-2 px-8 py-3.5 rounded-lg flex items-center justify-center -ml-6"
            style={{
              zIndex: 30,
              backgroundColor: paperColor3,
              color: textColor,
              transform: `translate3d(${x3}px, ${y3}px, 0) rotate(${rot3}deg) rotateX(${fold3}deg)`,
              boxShadow: `
                8px 18px 32px rgba(0,0,0,0.45),
                0 4px 8px rgba(0,0,0,0.3),
                inset 0 1px 0 rgba(255,255,255,0.7),
                inset 0 -1px 0 rgba(0,0,0,0.15)
              `,
              opacity: Math.min(1, s3 * 2),
            }}
          >
            <span
              style={{
                fontSize: `${fontSize * 1.1}px`,
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {word3}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaperCutReveal;
