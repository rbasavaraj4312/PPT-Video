import React, { useMemo } from 'react';
import { spring } from 'remotion';
import { useSafeFrame } from '../../core/useSafeFrame';

/**
 * BlurText - React Bits inspired kinetic text reveal
 * Letter/word-by-word blur, opacity, and vertical glide-in driven by Remotion spring.
 */
export function BlurText({
  text = 'Dynamic Kinetic Headline',
  textColor = '#ffffff',
  fontSize = 36,
  fontWeight = 800,
  textAlign = 'center',
  staggerDelay = 3, // frames between each word
  direction = 'up', // 'up' | 'down'
  loop = false,
  className = '',
}) {
  const words = useMemo(() => {
    return String(text || '').trim().split(/\s+/).filter(Boolean);
  }, [text]);

  const maxFrames = Math.max(60, words.length * staggerDelay + 25);
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });

  const alignClass = 
    textAlign === 'left' ? 'justify-start text-left' :
    textAlign === 'right' ? 'justify-end text-right' :
    'justify-center text-center';

  return (
    <div className={`relative flex flex-wrap items-center gap-x-2.5 gap-y-1 w-full overflow-hidden ${alignClass} ${className}`}>
      {words.map((word, idx) => {
        const wordStartFrame = idx * staggerDelay;
        const progress = spring({
          frame: Math.max(0, frame - wordStartFrame),
          fps,
          config: { damping: 14, stiffness: 120, mass: 0.6 },
        });

        // 0 -> 1 progress
        const opacity = Math.min(1, progress * 1.2);
        const blur = Math.max(0, (1 - progress) * 12);
        const yOffset = (1 - progress) * (direction === 'up' ? 24 : -24);

        return (
          <span
            key={`${word}-${idx}`}
            style={{
              display: 'inline-block',
              color: textColor,
              fontSize: `${fontSize}px`,
              fontWeight: fontWeight,
              opacity: opacity,
              filter: `blur(${blur}px)`,
              transform: `translateY(${yOffset}px)`,
              willChange: 'transform, opacity, filter',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}
