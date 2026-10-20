import React, { useId, useMemo } from 'react';
import { interpolate, spring } from 'remotion';
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
const STAR_CLIP =
  'polygon(50% 0%, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0% 50%, 39% 39%)';

/**
 * LiquidMorphText - Liquid Chrome Typography (Enhanced)
 * - Letters drop in as liquid slugs: stretch while falling, squash on landing
 * - Animated turbulence displacement + real SVG specular lighting (moving point light)
 *   for a true wet-metal highlight, plus a soft accent glow baked into the filter
 * - Horizon-line chrome gradient with a per-letter travelling light sweep
 * - Two counter-travelling melt waves; molten letters shed physics-based drips
 *   that land in a puddle and send out ripples
 * - Mirrored liquid reflection, living surface wave that bulges under the melt,
 *   landing shock ring, aurora blobs and glinting sparkles
 * - 100% transparent background
 */
export function LiquidMorphText({
  text = 'LIQUID CHROME',
  primaryColor = '#e2e8f0',
  accentColor = '#38bdf8',
  highlightColor = '#ffffff',
  fontSize = 62,
  meltIntensity = 1,
  waveSpeed = 1,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const chars = useMemo(() => String(text || '').split(''), [text]);
  const totalChars = chars.length;
  const rowW = Math.max(1, totalChars) * fontSize * 0.62;

  const cycleFrames = 60 / Math.max(0.2, waveSpeed);
  const waveDuration = totalChars * 2 + cycleFrames + 25;
  const maxFrames = Math.round(waveDuration);

  const { frame: rawFrame, fps } = useSafeFrame(30, { loop, maxFrames });
  const frame = rawFrame * Math.max(0.2, speed);
  const fid = useId().replace(/:/g, '');

  // ---------- Timeline ----------
  const isCompleted = !loop && frame >= maxFrames - 5;
  const lastLand = (totalChars - 1) * 2 + 14;
  const settle = isCompleted ? 0 : interpolate(frame, [0, totalChars * 2 + 30], [1, 0], CLAMP);
  const rawWaveGate = interpolate(frame, [totalChars * 2 + 14, totalChars * 2 + 34], [0, 1], CLAMP);
  const waveGate = isCompleted ? 0 : rawWaveGate;
  const intro = interpolate(frame, [0, 18], [0, 1], CLAMP);

  // ---------- Wave travel (primary + counter wave) ----------
  const cycleProgress = isCompleted ? 0 : (frame % cycleFrames) / cycleFrames;
  const waveCenter = isCompleted ? -99 : interpolate(cycleProgress, [0, 1], [-2, totalChars + 2]);
  const counterProgress = (cycleProgress + 0.5) % 1;
  const waveCenter2 = isCompleted ? 99 : interpolate(counterProgress, [0, 1], [totalChars + 2, -2]);

  // ---------- Filter animation ----------
  const f1 = 0.018 + Math.sin(frame * 0.07) * 0.007;
  const f2 = f1 * 2.6 + Math.cos(frame * 0.05) * 0.004;
  const dispScale = isCompleted ? 0 : (9 + Math.sin(frame * 0.1) * 3) * meltIntensity + settle * 16;
  const lightX = ((frame * 3.2) % (rowW + 500)) - 250;
  const lightY = -fontSize * 0.25 + Math.sin(frame * 0.08) * fontSize * 0.15;

  // Global sweep cursor for chrome shine (in char units)
  const sweepCursor = ((frame * 0.32) % (totalChars + 10)) - 4;

  // ---------- Idle camera drift ----------
  const tiltY = Math.sin(frame * 0.035) * 3;
  const tiltX = Math.cos(frame * 0.03) * 1.8;

  // ---------- Ambient sparkles ----------
  const sparkles = useMemo(
    () =>
      Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: (seededRandom(i * 11) - 0.5) * 1.05,
        y: (seededRandom(i * 29) - 0.5) * 1.5,
        size: 0.14 + seededRandom(i * 43) * 0.2,
        phase: seededRandom(i * 61) * 6.28,
      })),
    []
  );

  // ---------- Surface wave path ----------
  const WAVE_W = 440;
  const bumpX = ((waveCenter + 0.5) / Math.max(1, totalChars)) * WAVE_W;
  const bumpX2 = ((waveCenter2 + 0.5) / Math.max(1, totalChars)) * WAVE_W;
  const buildWave = (phaseShift, amp, bumpAmp) => {
    let d = '';
    for (let x = 0; x <= WAVE_W; x += 4) {
      const envelope = Math.sin((x / WAVE_W) * Math.PI);
      const base = Math.sin(x * 0.035 + frame * 0.16 + phaseShift) * amp * envelope;
      const b1 = Math.exp(-Math.pow((x - bumpX) / 34, 2)) * bumpAmp * waveGate;
      const b2 = Math.exp(-Math.pow((x - bumpX2) / 30, 2)) * bumpAmp * 0.5 * waveGate;
      const y = 14 + base - b1 - b2;
      d += `${x === 0 ? 'M' : 'L'}${x},${y.toFixed(2)} `;
    }
    return d;
  };
  const ringScale = interpolate(frame, [lastLand, lastLand + 28], [0.15, 1.7], CLAMP);
  const ringOpacity = interpolate(frame, [lastLand, lastLand + 6, lastLand + 28], [0, 0.9, 0], CLAMP);

  // ---------- Row renderer (main + reflection) ----------
  const renderRow = (isReflection) =>
    chars.map((char, idx) => {
      if (char === ' ') {
        return (
          <span
            key={`${isReflection ? 'r' : 'm'}-sp-${idx}`}
            style={{ display: 'inline-block', width: `${fontSize * 0.35}px` }}
          />
        );
      }

      // --- Entrance: liquid slug drop with stretch & squash ---
      const enter = spring({
        frame: Math.max(0, frame - idx * 2),
        fps,
        config: { damping: 11, stiffness: 170, mass: 0.7 },
      });
      const stretch = 1 - enter;
      const entY = -(1 - enter) * fontSize * 1.6;
      const entScaleY = clamp(1 + stretch * 0.7, 0.62, 1.8);
      const entScaleX = clamp(1 - stretch * 0.3, 0.7, 1.15);
      const entOpacity = Math.min(1, enter * 3);
      const entBlur = Math.max(0, 1 - enter) * 10;

      // --- Melt waves ---
      const dist1 = Math.abs(idx - waveCenter);
      const dist2 = Math.abs(idx - waveCenter2);
      const w1 = dist1 < 3.2 ? Math.cos((dist1 / 3.2) * (Math.PI / 2)) : 0;
      const w2 = dist2 < 3.2 ? Math.cos((dist2 / 3.2) * (Math.PI / 2)) * 0.55 : 0;
      const waveFactor = Math.max(w1, w2) * meltIntensity * waveGate;

      const scaleY = 1 + waveFactor * 0.45;
      const scaleX = 1 - waveFactor * 0.2;
      const meltY = waveFactor * 14;
      const skewX = Math.sin(frame * 0.2 + idx) * waveFactor * 18;
      const bob = Math.sin(frame * 0.07 + idx * 0.6) * fontSize * 0.018 * meltIntensity * waveGate;
      const isHighlight = waveFactor > 0.4;

      // --- Chrome light sweep (per letter) ---
      const p = sweepCursor - idx;
      const c = 50 + p * 100;
      const sweepLayer =
        Math.abs(p) < 1.6
          ? `linear-gradient(110deg, transparent ${c - 20}%, ${highlightColor} ${c}%, transparent ${c + 20}%)`
          : 'linear-gradient(110deg, transparent, transparent)';
      const chromeLayer = `linear-gradient(180deg, ${highlightColor} 0%, ${primaryColor} 26%, ${primaryColor} 40%, #475569 49%, #1e293b 51%, ${accentColor} 58%, ${primaryColor} 80%, ${highlightColor} 100%)`;
      const hotLayer = isHighlight
        ? `linear-gradient(180deg, ${highlightColor}, ${highlightColor})`
        : null;

      // --- Drips (deterministic physics) ---
      const passFrac = (((cycleProgress - (idx + 2) / (totalChars + 4)) % 1) + 1) % 1;
      const tDrip = passFrac * cycleFrames - 4 - (idx % 3) * 3;
      const dripEligible = !isReflection && waveGate > 0.5 && (idx * 7) % 3 !== 1;
      const FALL = 20;
      const DROP_D = fontSize * 0.85;
      let drip = null;
      let ripple = null;
      if (dripEligible && tDrip > 0 && tDrip < FALL) {
        const k = tDrip / FALL;
        const y = DROP_D * k * k;
        const w = fontSize * (0.05 + 0.04 * Math.min(1, k * 3));
        const h = w * (1.2 + k * 2.4);
        drip = { y, w, h, opacity: 1 - Math.pow(k, 4) };
      } else if (dripEligible && tDrip >= FALL && tDrip < FALL + 16) {
        const k = (tDrip - FALL) / 16;
        ripple = { y: DROP_D, scale: 0.2 + k * 1.6, opacity: (1 - k) * 0.85 };
      }

      // --- Sparkle on hot letters ---
      const showSparkle = !isReflection && waveFactor > 0.55;
      const sparkleSize = fontSize * 0.22 * waveFactor;

      return (
        <span
          key={`${isReflection ? 'r' : 'm'}-${char}-${idx}`}
          className="relative inline-block"
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1,
            opacity: entOpacity,
            filter: entBlur > 0.2 ? `blur(${entBlur}px)` : undefined,
            transform: `translate3d(0, ${entY + meltY + bob}px, 0) scale(${scaleX * entScaleX}, ${scaleY * entScaleY}) skewX(${skewX}deg)`,
            transformOrigin: 'center bottom',
            willChange: 'transform, opacity',
          }}
        >
          {/* Chrome glyph */}
          <span
            style={{
              display: 'inline-block',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              backgroundImage: [sweepLayer, hotLayer, chromeLayer].filter(Boolean).join(', '),
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              WebkitTextStroke: `0.8px ${highlightColor}59`,
            }}
          >
            {char}
          </span>

          {/* Falling drip */}
          {drip && (
            <span
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '88%',
                width: `${drip.w}px`,
                height: `${drip.h}px`,
                borderRadius: '50% 50% 50% 50% / 65% 65% 35% 35%',
                background: `radial-gradient(circle at 35% 30%, ${highlightColor} 0%, ${accentColor} 70%, ${primaryColor} 100%)`,
                boxShadow: `0 0 10px ${accentColor}`,
                opacity: drip.opacity,
                transform: `translate(-50%, ${drip.y}px)`,
              }}
            />
          )}

          {/* Puddle ripple */}
          {ripple && (
            <span
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '88%',
                width: `${fontSize * 0.5}px`,
                height: `${fontSize * 0.14}px`,
                borderRadius: '50%',
                border: `1.5px solid ${accentColor}`,
                boxShadow: `0 0 8px ${accentColor}`,
                opacity: ripple.opacity,
                transform: `translate(-50%, ${ripple.y}px) scale(${ripple.scale})`,
              }}
            />
          )}

          {/* Hot-letter sparkle */}
          {showSparkle && (
            <span
              aria-hidden
              className="absolute pointer-events-none"
              style={{
                right: '-6%',
                top: '4%',
                width: `${sparkleSize}px`,
                height: `${sparkleSize}px`,
                background: highlightColor,
                clipPath: STAR_CLIP,
                transform: `rotate(${frame * 4 + idx * 30}deg)`,
                filter: `drop-shadow(0 0 6px ${highlightColor})`,
                opacity: waveFactor,
              }}
            />
          )}
        </span>
      );
    });

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-visible ${className}`}
      style={{
        backgroundColor: 'transparent',
        background: 'transparent',
        perspective: '1100px',
        ...style,
      }}
    >
      {/* ================= SVG FILTERS ================= */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          {/* Main liquid-metal filter: displacement + specular lighting + glow */}
          <filter
            id={`liquid-filter-${fid}`}
            x="-15%"
            y="-30%"
            width="130%"
            height="260%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${f1} ${f2}`}
              numOctaves="2"
              seed="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={dispScale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />
            <feGaussianBlur in="displaced" stdDeviation="2.2" result="bump" />
            <feSpecularLighting
              in="bump"
              surfaceScale="6"
              specularConstant="1.2"
              specularExponent="26"
              lightingColor={highlightColor}
              result="spec"
            >
              <fePointLight x={lightX} y={lightY} z={fontSize * 1.5} />
            </feSpecularLighting>
            <feComposite in="spec" in2="displaced" operator="in" result="specClip" />
            <feComposite
              in="displaced"
              in2="specClip"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="lit"
            />
            <feGaussianBlur in="displaced" stdDeviation="9" result="glowBlur" />
            <feFlood floodColor={accentColor} floodOpacity="0.55" result="glowFlood" />
            <feComposite in="glowFlood" in2="glowBlur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="lit" />
            </feMerge>
          </filter>

          {/* Softer, wobblier filter for the reflection */}
          <filter
            id={`liquid-soft-${fid}`}
            x="-15%"
            y="-30%"
            width="130%"
            height="260%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${f1 * 1.3} ${f2 * 1.8}`}
              numOctaves="2"
              seed="7"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={dispScale * 1.7}
              xChannelSelector="R"
              yChannelSelector="G"
            />
            <feGaussianBlur stdDeviation="1.2" />
          </filter>

          <linearGradient id={`wave-grad-${fid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0" />
            <stop offset="30%" stopColor={accentColor} stopOpacity="0.9" />
            <stop offset="50%" stopColor={highlightColor} stopOpacity="1" />
            <stop offset="70%" stopColor={accentColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* ================= AURORA BLOBS ================= */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible"
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: 'absolute',
            width: `${rowW * 0.7}px`,
            height: `${fontSize * 1.9}px`,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, ${accentColor}55 0%, transparent 70%)`,
            filter: 'blur(28px)',
            opacity: intro * (0.55 + Math.sin(frame * 0.06) * 0.15),
            transform: `translate(${Math.sin(frame * 0.03) * rowW * 0.14}px, ${Math.cos(frame * 0.04) * 8}px)`,
            mixBlendMode: 'screen',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: `${rowW * 0.5}px`,
            height: `${fontSize * 1.4}px`,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, ${primaryColor}33 0%, transparent 70%)`,
            filter: 'blur(26px)',
            opacity: intro * 0.6,
            transform: `translate(${Math.cos(frame * 0.035) * rowW * 0.16}px, ${Math.sin(frame * 0.05) * 6}px)`,
            mixBlendMode: 'screen',
          }}
        />
      </div>

      {/* ================= MAIN STACK ================= */}
      <div
        className="relative flex flex-col items-center"
        style={{
          zIndex: 5,
          transformStyle: 'preserve-3d',
          transform: `rotateY(${tiltY}deg) rotateX(${tiltX}deg)`,
        }}
      >
        {/* Liquid chrome row */}
        <div
          className="relative flex items-center justify-center flex-wrap gap-x-[2px] leading-none text-center"
          style={{
            filter: `url(#liquid-filter-${fid}) drop-shadow(0 8px 14px rgba(0,0,0,0.4))`,
          }}
        >
          {renderRow(false)}
        </div>

        {/* Mirrored liquid reflection */}
        <div
          aria-hidden
          className="relative overflow-hidden pointer-events-none"
          style={{
            height: `${fontSize * 0.62}px`,
            marginTop: `${fontSize * 0.04}px`,
            opacity: 0.55 * intro,
          }}
        >
          <div
            className="relative flex items-center justify-center flex-wrap gap-x-[2px] leading-none text-center"
            style={{
              transform: 'scaleY(-1)',
              filter: `url(#liquid-soft-${fid})`,
              WebkitMaskImage:
                'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 62%)',
              maskImage: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 62%)',
            }}
          >
            {renderRow(true)}
          </div>
        </div>

        {/* Living liquid surface wave + landing shock ring */}
        <div
          className="relative pointer-events-none"
          style={{ width: `${WAVE_W}px`, maxWidth: '90%', height: '28px', marginTop: '6px' }}
        >
          {ringOpacity > 0.01 && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${WAVE_W}px`,
                height: '30px',
                marginLeft: `${-WAVE_W / 2}px`,
                marginTop: '-15px',
                borderRadius: '50%',
                border: `2px solid ${accentColor}`,
                boxShadow: `0 0 18px ${accentColor}`,
                opacity: ringOpacity,
                transform: `scale(${ringScale})`,
                mixBlendMode: 'screen',
              }}
            />
          )}
          <svg
            viewBox={`0 0 ${WAVE_W} 28`}
            width="100%"
            height="28"
            preserveAspectRatio="none"
            style={{ overflow: 'visible', opacity: intro }}
          >
            <path
              d={buildWave(1.6, 3.2, 6)}
              fill="none"
              stroke={`url(#wave-grad-${fid})`}
              strokeWidth="1.2"
              opacity="0.55"
            />
            <path
              d={buildWave(0, 4.5, 9)}
              fill="none"
              stroke={`url(#wave-grad-${fid})`}
              strokeWidth="2.2"
              style={{ filter: `drop-shadow(0 0 6px ${accentColor})` }}
            />
            {/* Travelling hot spot riding the bump */}
            <circle
              cx={clamp(bumpX, 0, WAVE_W)}
              cy={14 - 9 * waveGate}
              r={2.6 * waveGate}
              fill={highlightColor}
              style={{ filter: `drop-shadow(0 0 8px ${highlightColor})` }}
              opacity={waveGate}
            />
          </svg>
        </div>
      </div>

      {/* ================= AMBIENT SPARKLES ================= */}
      <div
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ zIndex: 8 }}
      >
        {sparkles.map((s) => {
          const tw = Math.pow(Math.max(0, Math.sin(frame * 0.12 + s.phase)), 3) * waveGate;
          if (tw < 0.02) return null;
          const size = fontSize * s.size * tw;
          return (
            <span
              key={`spark-${s.id}`}
              style={{
                position: 'absolute',
                left: `calc(50% + ${s.x * rowW}px)`,
                top: `calc(50% + ${s.y * fontSize}px)`,
                width: `${size}px`,
                height: `${size}px`,
                marginLeft: `${-size / 2}px`,
                marginTop: `${-size / 2}px`,
                background: s.id % 2 === 0 ? highlightColor : accentColor,
                clipPath: STAR_CLIP,
                transform: `rotate(${frame * 2 + s.id * 40}deg)`,
                filter: `drop-shadow(0 0 6px ${accentColor})`,
                opacity: tw,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default LiquidMorphText;