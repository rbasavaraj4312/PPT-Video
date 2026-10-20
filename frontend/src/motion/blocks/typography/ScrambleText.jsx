import React, { useMemo } from 'react';
import { useSafeFrame } from '../../core/useSafeFrame';

const SCRAMBLE_CHARS = '0123456789ABCDEF$#@%&*!<>?/\\';

/**
 * ScrambleText - React Bits inspired cyberpunk text decoder
 * Deterministically resolves characters one-by-one from a glyph cipher.
 */
export function ScrambleText({
  text = 'CYBER DECODER v2.0',
  textColor = '#00f2fe',
  fontSize = 28,
  fontFamily = 'monospace',
  speed = 2, // frames per character resolved
  scrambleColor = '#38bdf8',
  loop = false,
  className = '',
}) {
  const rawText = String(text || '');
  const maxFrames = Math.max(45, rawText.length * Math.max(1, speed) + 20);
  const { frame } = useSafeFrame(30, { loop, maxFrames });

  const displayText = useMemo(() => {
    const chars = rawText.split('');
    const totalChars = chars.length;
    if (totalChars === 0) return '';

    // How many characters have permanently locked in
    const lockedCount = Math.min(totalChars, Math.floor(frame / Math.max(1, speed)));

    return chars.map((char, idx) => {
      if (char === ' ') return ' ';
      if (idx < lockedCount) {
        return { char, isLocked: true };
      }
      // Pseudo-random deterministic character from frame + index
      const charIndex = Math.abs((frame * 7 + idx * 13)) % SCRAMBLE_CHARS.length;
      return { char: SCRAMBLE_CHARS[charIndex], isLocked: false };
    });
  }, [rawText, frame, speed]);

  return (
    <div
      className={`select-none tracking-wider ${className}`}
      style={{
        fontFamily: fontFamily,
        fontSize: `${fontSize}px`,
        fontWeight: 800,
        lineHeight: 1.2,
      }}
    >
      {Array.isArray(displayText) && displayText.map((item, i) => (
        <span
          key={i}
          style={{
            color: item.isLocked ? textColor : scrambleColor,
            opacity: item.isLocked ? 1 : 0.85,
            textShadow: item.isLocked ? `0 0 12px ${textColor}40` : `0 0 8px ${scrambleColor}`,
            transition: 'color 0.1s ease',
          }}
        >
          {item.char}
        </span>
      ))}
    </div>
  );
}
