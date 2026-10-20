import React, { useMemo } from 'react';
import { interpolate } from 'remotion';
import { useSafeFrame } from '../../core/useSafeFrame';

/**
 * Deterministic pseudo-random generator
 */
function seededRandom(seed) {
  const x = Math.sin(seed * 9999.123) * 10000;
  return x - Math.floor(x);
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };
const alphaHex = (a) =>
  Math.round(clamp(a, 0, 1) * 255)
    .toString(16)
    .padStart(2, '0');
const SCRAMBLE = '#$%&*+<>/\\|=?01ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * TypewriterSpotlight - Cinematic Moving Spotlight Typewriter (Enhanced)
 * - Layout is reserved up-front (no re-centering jitter); the spotlight, cone and
 *   caret are anchored inside the text flow so they follow the real cursor, even
 *   across wrapped lines.
 * - Every struck key: stamp-in with pop, drop & rotation, impact outline stamp,
 *   white-hot glow that cools, a light pool that leaves a smooth glowing trail,
 *   and a burst of sparks. The text block also gets a tiny keystroke jolt.
 * - Volumetric double beam with swaying light, drifting dust motes in the cone,
 *   floor light pool and glint line.
 * - Finale: a wave of light runs through the finished sentence and a ring pulses
 *   out from the caret, which then blinks.
 * - Subtext decodes from scrambled glyphs between two drawing rules.
 * - 100% transparent background.
 */
export function TypewriterSpotlight({
  text = 'Ideas emerge in the quietest hours.',
  subtext = 'CHAPTER 01 — THE GENESIS',
  textColor = '#ffffff',
  spotlightColor = '#38bdf8',
  cursorColor = '#38bdf8',
  fontSize = 38,
  typeSpeed = 2, // frames per character
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const fullText = String(text || '');
  const totalChars = fullText.length;
  const ts = Math.max(1, typeSpeed);
  const maxFrames = Math.max(60, totalChars * ts + 35);

  const { frame: rawFrame } = useSafeFrame(30, { loop, maxFrames });
  const frame = rawFrame * Math.max(0.2, speed);

  // How many characters have typed out
  const charsTyped = Math.min(totalChars, Math.max(0, Math.floor(frame / ts)));
  const isTypingComplete = charsTyped >= totalChars;
  const doneFrame = totalChars * ts;
  const finaleT = frame - doneFrame; // >= 0 once finished

  // Cursor blink & light pulse
  const cursorBlink = Math.floor(frame / 6) % 2 === 0;
  const lightPulse = 0.9 + Math.sin(frame * 0.15) * 0.1;
  const coneIn = interpolate(frame, [0, 14], [0, 1], CLAMP);

  // Keystroke jolt (decays quickly after each strike while typing)
  const sinceStrike = charsTyped > 0 ? frame - charsTyped * ts : 99;
  const jolt = !isTypingComplete || finaleT < 3 ? Math.exp(-Math.max(0, sinceStrike) / 2.5) : 0;
  const joltX = (charsTyped % 2 ? 1 : -1) * 1.3 * jolt * (fontSize / 38);
  const joltY = 0.7 * jolt * (fontSize / 38);

  // Beam sway
  const sway = Math.sin(frame * 0.045) * 3.2;

  // Tokenize into words/spaces so wrapping stays word-based
  const tokens = useMemo(() => {
    const out = [];
    let cur = null;
    for (let i = 0; i < fullText.length; i++) {
      const ch = fullText[i];
      if (/\s/.test(ch)) {
        cur = null;
        out.push({ type: 'space', ch, idx: i });
      } else {
        if (!cur) {
          cur = { type: 'word', chars: [] };
          out.push(cur);
        }
        cur.chars.push({ ch, idx: i });
      }
    }
    return out;
  }, [fullText]);

  // Dust motes inside the beam
  const motes = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        x: (seededRandom(i * 17) - 0.5) * 1.6,
        speed: 0.25 + seededRandom(i * 31) * 0.45,
        offset: seededRandom(i * 53) * 400,
        size: 1.5 + seededRandom(i * 71) * 2.2,
        phase: seededRandom(i * 89) * 6.28,
      })),
    []
  );

  // Subtext decode
  const subChars = String(subtext || '').split('');
  const ruleW = interpolate(frame, [0, 22], [0, 46], CLAMP);

  /* ------------------------------------------------------------------ */
  /* One struck character                                                */
  /* ------------------------------------------------------------------ */
  const renderChar = (c) => {
    const age = frame - (c.idx + 1) * ts;

    // Not typed yet: invisible, but it reserves exact layout space
    if (age < 0) {
      return (
        <span
          key={`c-${c.idx}`}
          style={{ display: 'inline-block', opacity: 0, whiteSpace: 'pre' }}
        >
          {c.ch}
        </span>
      );
    }

    const pop = interpolate(age, [0, 3, 8, 14], [1.55, 0.93, 1.03, 1], CLAMP);
    const dropY = interpolate(age, [0, 3, 8], [-fontSize * 0.18, fontSize * 0.03, 0], CLAMP);
    const rot = (seededRandom(c.idx * 7) - 0.5) * 10 * interpolate(age, [0, 10], [1, 0], CLAMP);
    const op = interpolate(age, [0, 2], [0, 1], CLAMP);
    const blur = interpolate(age, [0, 4], [5, 0], CLAMP);
    const heat = Math.exp(-age / 9);
    const fin =
      finaleT >= 0 ? Math.exp(-Math.pow((finaleT * 1.3 - c.idx) / 2.6, 2)) : 0;
    const glow = Math.max(heat, fin * 0.9);
    const restDim = age > 40 && fin < 0.05 ? 0.94 : 1;

    return (
      <span
        key={`c-${c.idx}`}
        className="relative inline-block"
        style={{
          whiteSpace: 'pre',
          transform: `translateY(${dropY}px) rotate(${rot}deg) scale(${pop})`,
          transformOrigin: '50% 80%',
          willChange: 'transform',
        }}
      >
        {/* Light pool that leaves a smooth moving trail */}
        {heat > 0.03 && (
          <span
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              width: `${fontSize * 4.4}px`,
              height: `${fontSize * 4.4}px`,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${spotlightColor}${alphaHex(0.6 * heat)} 0%, ${spotlightColor}${alphaHex(0.16 * heat)} 40%, transparent 70%)`,
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Impact outline stamp */}
        {age < 9 && (
          <span
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              color: 'transparent',
              WebkitTextStroke: `1px ${spotlightColor}`,
              transform: `scale(${1 + age * 0.13})`,
              transformOrigin: '50% 60%',
              opacity: (1 - age / 9) * 0.8,
            }}
          >
            {c.ch}
          </span>
        )}

        {/* Glyph */}
        <span
          style={{
            display: 'inline-block',
            color: textColor,
            opacity: op * restDim,
            filter: `blur(${blur}px) brightness(${1 + heat * 0.9})`,
            textShadow: `0 0 ${3 + glow * 12}px ${spotlightColor}${alphaHex(0.25 + glow * 0.75)}, 0 0 ${glow * 34}px ${spotlightColor}${alphaHex(glow * 0.6)}, 0 2px 8px rgba(0,0,0,0.45)`,
          }}
        >
          {c.ch}
        </span>

        {/* Strike sparks */}
        {age < 14 &&
          [0, 1, 2].map((k) => {
            const r1 = seededRandom(c.idx * 13 + k * 5);
            const r2 = seededRandom(c.idx * 29 + k * 11);
            const angle = -Math.PI / 2 + (r1 - 0.5) * 2.2;
            const t = age / 14;
            const ease = 1 - Math.pow(1 - t, 2.4);
            const dist = (10 + r2 * 30) * (fontSize / 38) * ease;
            const sx = Math.cos(angle) * dist;
            const sy = Math.sin(angle) * dist + age * age * 0.32;
            const size = 2 + r2 * 1.8;
            const col = k === 1 ? '#ffffff' : spotlightColor;
            return (
              <span
                key={`sp-${k}`}
                aria-hidden
                className="absolute pointer-events-none"
                style={{
                  left: '50%',
                  top: '72%',
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  background: col,
                  boxShadow: `0 0 8px ${col}, 0 0 16px ${col}`,
                  opacity: 1 - t,
                  transform: `translate(${sx}px, ${sy}px)`,
                }}
              />
            );
          })}
      </span>
    );
  };

  /* ------------------------------------------------------------------ */
  /* Anchor: caret + spotlight rig, sits in the text flow at the cursor  */
  /* ------------------------------------------------------------------ */
  const lineH = fontSize * 1.45;
  const coneH = fontSize * 6.5;
  const coneW = fontSize * 7;
  const caretW = Math.max(3, fontSize * 0.1);
  const caretVisible = cursorBlink || !isTypingComplete;
  const ringScale = interpolate(finaleT, [0, 26], [0.2, 3], CLAMP);
  const ringOpacity = isTypingComplete
    ? interpolate(finaleT, [0, 4, 26], [0, 0.9, 0], CLAMP)
    : 0;

  const anchor = (
    <span
      key="anchor"
      aria-hidden
      style={{
        position: 'relative',
        display: 'inline-block',
        width: 0,
        height: `${lineH}px`,
        verticalAlign: 'top',
      }}
    >
      {/* Wide volumetric cone */}
      <span
        className="absolute pointer-events-none"
        style={{
          left: `${-coneW / 2}px`,
          top: `${-coneH + lineH * 0.55}px`,
          width: `${coneW}px`,
          height: `${coneH}px`,
          background: `linear-gradient(180deg, ${spotlightColor}${alphaHex(0.3)} 0%, ${spotlightColor}${alphaHex(0.09)} 65%, transparent 100%)`,
          clipPath: 'polygon(46% 0%, 54% 0%, 100% 100%, 0% 100%)',
          filter: 'blur(14px)',
          transformOrigin: '50% 0%',
          transform: `rotate(${sway}deg)`,
          opacity: lightPulse * 0.85 * coneIn,
          mixBlendMode: 'screen',
        }}
      />
      {/* Tight bright core cone */}
      <span
        className="absolute pointer-events-none"
        style={{
          left: `${-coneW * 0.22}px`,
          top: `${-coneH + lineH * 0.55}px`,
          width: `${coneW * 0.44}px`,
          height: `${coneH}px`,
          background: `linear-gradient(180deg, #ffffff${alphaHex(0.35)} 0%, ${spotlightColor}${alphaHex(0.18)} 55%, transparent 100%)`,
          clipPath: 'polygon(47% 0%, 53% 0%, 100% 100%, 0% 100%)',
          filter: 'blur(6px)',
          transformOrigin: '50% 0%',
          transform: `rotate(${sway * 0.6}deg)`,
          opacity: lightPulse * 0.7 * coneIn,
          mixBlendMode: 'screen',
        }}
      />

      {/* Dust motes drifting through the beam */}
      {motes.map((m) => {
        const travel = (frame * m.speed + m.offset) % (coneH * 0.9);
        const y = -travel + lineH * 0.4;
        const spread = 1 - travel / (coneH * 0.9);
        const x = m.x * fontSize * 2.2 * (1 - spread * 0.7) + Math.sin(frame * 0.03 + m.phase) * 8;
        const tw = 0.5 + Math.sin(frame * 0.12 + m.phase) * 0.5;
        const fade = Math.sin(clamp(travel / (coneH * 0.9), 0, 1) * Math.PI);
        return (
          <span
            key={`mote-${m.id}`}
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: `${m.size}px`,
              height: `${m.size}px`,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: `0 0 6px ${spotlightColor}`,
              opacity: tw * fade * 0.7 * coneIn,
              transform: `translate(${x}px, ${y}px)`,
            }}
          />
        );
      })}

      {/* Caret hot-spot glow */}
      <span
        className="absolute pointer-events-none"
        style={{
          left: `${-fontSize * 1.1}px`,
          top: `${lineH / 2 - fontSize * 1.1}px`,
          width: `${fontSize * 2.2}px`,
          height: `${fontSize * 2.2}px`,
          background: `radial-gradient(circle, ${cursorColor}${alphaHex(0.45)} 0%, transparent 65%)`,
          opacity: lightPulse,
          mixBlendMode: 'screen',
        }}
      />

      {/* Floor light pool + glint line */}
      <span
        className="absolute pointer-events-none"
        style={{
          left: `${-fontSize * 3}px`,
          top: `${lineH - fontSize * 0.1}px`,
          width: `${fontSize * 6}px`,
          height: `${fontSize * 0.55}px`,
          background: `radial-gradient(ellipse at center, ${spotlightColor}${alphaHex(0.4)} 0%, transparent 70%)`,
          filter: 'blur(6px)',
          opacity: 0.8 * lightPulse * coneIn,
          mixBlendMode: 'screen',
        }}
      />
      <span
        className="absolute pointer-events-none"
        style={{
          left: `${-fontSize * 3.5}px`,
          top: `${lineH + fontSize * 0.1}px`,
          width: `${fontSize * 7}px`,
          height: '1px',
          background: `radial-gradient(circle, ${spotlightColor} 0%, transparent 80%)`,
          boxShadow: `0 0 10px ${spotlightColor}`,
          opacity: 0.6 * coneIn,
        }}
      />

      {/* Finale ring */}
      {ringOpacity > 0.01 && (
        <span
          className="absolute pointer-events-none"
          style={{
            left: `${-fontSize * 1.5}px`,
            top: `${lineH / 2 - fontSize * 0.6}px`,
            width: `${fontSize * 3}px`,
            height: `${fontSize * 1.2}px`,
            borderRadius: '50%',
            border: `1.5px solid ${spotlightColor}`,
            boxShadow: `0 0 16px ${spotlightColor}`,
            opacity: ringOpacity,
            transform: `scale(${ringScale})`,
            mixBlendMode: 'screen',
          }}
        />
      )}

      {/* Mechanical caret */}
      <span
        className="absolute"
        style={{
          left: `${-caretW * 0.35}px`,
          top: `${lineH * 0.5 - fontSize * 0.45}px`,
          width: `${caretW}px`,
          height: `${fontSize * 0.9}px`,
          borderRadius: '1px',
          background: `linear-gradient(180deg, #ffffff 0%, ${cursorColor} 22%, ${cursorColor} 78%, #ffffff 100%)`,
          boxShadow: `0 0 12px ${cursorColor}, 0 0 26px ${cursorColor}`,
          opacity: caretVisible ? (isTypingComplete ? 1 : 0.9 + Math.sin(frame * 1.7) * 0.1) : 0,
        }}
      />
    </span>
  );

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-visible ${className}`}
      style={{
        backgroundColor: 'transparent',
        background: 'transparent',
        ...style,
      }}
    >
      {/* Subtext: decoding glyphs between two drawing rules */}
      {subtext && (
        <div
          className="relative mb-4 flex items-center gap-3"
          style={{ zIndex: 10, opacity: interpolate(frame, [0, 8], [0, 1], CLAMP) }}
        >
          <span
            style={{
              width: `${ruleW}px`,
              height: '1px',
              background: `linear-gradient(90deg, transparent, ${spotlightColor})`,
              boxShadow: `0 0 8px ${spotlightColor}`,
            }}
          />
          <span
            className="font-mono text-xs tracking-widest uppercase text-slate-300"
            style={{ textShadow: `0 0 8px ${spotlightColor}80` }}
          >
            {subChars.map((ch, i) => {
              const resolveAt = 4 + i * 0.9;
              if (ch === ' ' || frame >= resolveAt) {
                const flash = frame >= resolveAt && frame < resolveAt + 4;
                return (
                  <span
                    key={`s-${i}`}
                    style={{
                      color: flash ? '#ffffff' : undefined,
                      textShadow: flash ? `0 0 12px ${spotlightColor}` : undefined,
                    }}
                  >
                    {ch}
                  </span>
                );
              }
              const g =
                SCRAMBLE[Math.floor(seededRandom(i * 13 + Math.floor(frame / 2)) * SCRAMBLE.length)];
              return (
                <span key={`s-${i}`} style={{ color: spotlightColor, opacity: 0.8 }}>
                  {g}
                </span>
              );
            })}
          </span>
          <span
            style={{
              width: `${ruleW}px`,
              height: '1px',
              background: `linear-gradient(270deg, transparent, ${spotlightColor})`,
              boxShadow: `0 0 8px ${spotlightColor}`,
            }}
          />
        </div>
      )}

      {/* Main typewriter text (layout reserved, chars revealed in place) */}
      <div
        className="relative font-mono text-center px-4 max-w-4xl"
        style={{
          zIndex: 20,
          fontSize: `${fontSize}px`,
          fontWeight: 600,
          lineHeight: `${lineH}px`,
          color: textColor,
          minHeight: `${fontSize * 1.4}px`,
          transform: `translate(${joltX}px, ${joltY}px)`,
        }}
      >
        {tokens.map((tok, ti) => {
          if (tok.type === 'space') {
            return (
              <React.Fragment key={`t-${ti}`}>
                {charsTyped === tok.idx && anchor}
                <span style={{ display: 'inline-block', whiteSpace: 'pre', opacity: 0 }}>
                  {'\u00A0'}
                </span>
              </React.Fragment>
            );
          }
          return (
            <span key={`t-${ti}`} className="inline-block whitespace-nowrap">
              {tok.chars.map((c) => (
                <React.Fragment key={`w-${c.idx}`}>
                  {charsTyped === c.idx && anchor}
                  {renderChar(c)}
                </React.Fragment>
              ))}
            </span>
          );
        })}
        {charsTyped >= totalChars && anchor}
      </div>
    </div>
  );
}

export default TypewriterSpotlight;