import React, { useMemo } from 'react';
import { useSafeFrame } from '../../core/useSafeFrame';

const CIPHER_SYMBOLS = '0123456789ABCDEF$#@%&*!<>?/\\Ø§∆∑¥';

/**
 * GlitchScrambleDecode - Hacker Terminal Text Decoder
 * Characters shuffle through random cyber symbols, then lock into the real
 * text one by one with digital slice glitches and chromatic ghosting.
 */
export function GlitchScrambleDecode({
  text = 'TERMINAL_BREACH_DETECTED',
  subtext = 'SYSTEM OVERRIDE // 0x7F9A_AUTHORIZED',
  textColor = '#00ff66',
  glitchColor = '#ff0055',
  scrambleColor = '#38bdf8',
  fontSize = 38,
  decodeSpeed = 2, // frames per character lock
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const rawText = String(text || '');
  const maxFrames = Math.max(60, rawText.length * Math.max(1, decodeSpeed) + 20);
  const { frame: rawFrame } = useSafeFrame(30, { loop, maxFrames });
  const frame = rawFrame * Math.max(0.2, speed);

  const items = useMemo(() => {
    const chars = rawText.split('');
    const total = chars.length;
    const lockFramesPerChar = Math.max(1, decodeSpeed);

    return chars.map((realChar, idx) => {
      if (realChar === ' ') {
        return { char: ' ', isLocked: true, isGlitching: false };
      }

      // Frame at which this character permanently resolves
      const lockFrame = idx * lockFramesPerChar + 4;
      const isLocked = frame >= lockFrame;
      // Exact frame window when it snaps in with slice glitch
      const isGlitching = frame >= lockFrame && frame <= lockFrame + 3;

      if (isLocked) {
        return { char: realChar, isLocked: true, isGlitching };
      }

      // Procedural pseudo-random cipher symbol
      const cipherIdx = Math.abs(Math.floor(frame * 13 + idx * 23)) % CIPHER_SYMBOLS.length;
      return {
        char: CIPHER_SYMBOLS[cipherIdx],
        isLocked: false,
        isGlitching: false,
      };
    });
  }, [rawText, frame, decodeSpeed]);

  const totalChars = rawText.length;
  const lockedCount = items.filter((it) => it.isLocked).length;
  const progressPercent = totalChars > 0 ? Math.round((lockedCount / totalChars) * 100) : 100;
  const isComplete = progressPercent >= 100;

  // Blinking terminal cursor
  const showCursor = Math.floor(frame / 6) % 2 === 0;

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-visible ${className}`}
      style={{
        backgroundColor: 'transparent',
        background: 'transparent',
        ...style,
      }}
    >
      {/* Hacker Terminal Metadata Header */}
      <div
        className="flex items-center gap-2 mb-2 font-mono text-xs tracking-wider"
        style={{
          color: scrambleColor,
          opacity: 0.85,
        }}
      >
        <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: isComplete ? textColor : glitchColor }} />
        <span>BUFFER: [{progressPercent}% DECRYPTED]</span>
        <span className="opacity-50">//</span>
        <span>SHA-256 HASH LOCK</span>
      </div>

      {/* Main Decoding Text Row */}
      <div
        className="relative font-mono font-bold tracking-wider leading-none text-center flex flex-wrap items-center justify-center"
        style={{
          fontSize: `${fontSize}px`,
          textShadow: `0 0 12px ${textColor}60`,
        }}
      >
        {items.map((item, idx) => {
          if (item.char === ' ') {
            return (
              <span
                key={idx}
                style={{ display: 'inline-block', width: `${fontSize * 0.4}px` }}
              />
            );
          }

          return (
            <span
              key={idx}
              className="relative inline-block"
              style={{
                color: item.isLocked ? textColor : scrambleColor,
                opacity: item.isLocked ? 1 : 0.75,
                transform: item.isGlitching
                  ? `translate(${Math.sin(frame * 8) * 4}px, ${Math.cos(frame * 6) * 2}px)`
                  : 'none',
                transition: 'color 0.1s ease',
              }}
            >
              {item.char}

              {/* Digital Slice Glitch Overlay on lock */}
              {item.isGlitching && (
                <>
                  <span
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      color: glitchColor,
                      clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
                      transform: 'translate(-3px, -1px)',
                      opacity: 0.9,
                    }}
                  >
                    {item.char}
                  </span>
                  <span
                    aria-hidden
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      color: scrambleColor,
                      clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
                      transform: 'translate(3px, 1px)',
                      opacity: 0.9,
                    }}
                  >
                    {item.char}
                  </span>
                </>
              )}
            </span>
          );
        })}

        {/* Terminal Block Cursor */}
        <span
          className="inline-block ml-1 font-mono font-normal"
          style={{
            color: isComplete ? textColor : glitchColor,
            opacity: showCursor ? 1 : 0,
            textShadow: `0 0 8px ${isComplete ? textColor : glitchColor}`,
          }}
        >
          █
        </span>
      </div>

      {/* Terminal Subtext Status */}
      {subtext && (
        <div
          className="mt-3 font-mono text-xs tracking-widest uppercase text-center"
          style={{
            color: '#94a3b8',
            opacity: 0.9,
          }}
        >
          <span style={{ color: glitchColor }}>[EXEC] </span>
          {subtext}
        </div>
      )}
    </div>
  );
}

export default GlitchScrambleDecode;
