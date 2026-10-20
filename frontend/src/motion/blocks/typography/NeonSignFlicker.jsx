import React from 'react';
import { interpolate } from 'remotion';
import { useSafeFrame } from '../../core/useSafeFrame';

/**
 * NeonSignFlicker - Motion Graphics Neon Tube Sign
 * Realistic glass tube light that buzzes on with stuttering electrical flickers,
 * then settles into a steady vibrant glow with a continuous faint hum pulse.
 */
export function NeonSignFlicker({
  text = 'OPEN ALL NIGHT',
  subtext = '24/7 COCKTAILS & CODE',
  neonColor = '#ff2a85',
  accentColor = '#00f2fe',
  tubeColor = '#ffffff',
  fontSize = 54,
  flickerStutter = true,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 90;
  const { frame: rawFrame } = useSafeFrame(30, { loop, maxFrames });
  const frame = rawFrame * Math.max(0.2, speed);

  // 1. Initial Stuttering Buzz Ignition (frames 0 to 20)
  let ignitionOpacity = 1;
  let ignitionBrightness = 1;

  if (flickerStutter && frame < 22) {
    if (frame < 3) {
      ignitionOpacity = 0.08; // cold glass tube
      ignitionBrightness = 0.1;
    } else if (frame < 5) {
      ignitionOpacity = 0.75; // first spark
      ignitionBrightness = 1.3;
    } else if (frame < 7) {
      ignitionOpacity = 0.1; // blackout dip
      ignitionBrightness = 0.2;
    } else if (frame < 11) {
      ignitionOpacity = 0.9; // electric surge
      ignitionBrightness = 1.4;
    } else if (frame < 13) {
      ignitionOpacity = 0.15; // secondary sputter
      ignitionBrightness = 0.3;
    } else if (frame < 16) {
      ignitionOpacity = 0.85; // almost locked
      ignitionBrightness = 1.1;
    } else if (frame < 18) {
      ignitionOpacity = 0.35; // final micro flicker
      ignitionBrightness = 0.5;
    } else {
      ignitionOpacity = 1.0; // fully ignited
      ignitionBrightness = 1.0;
    }
  }

  // 2. Faint Electrical Hum Pulse (continuous subtle oscillation)
  const humPulse = 0.94 + Math.sin(frame * 0.35) * 0.06;

  // 3. Occasional Organic Tube Glitch (every ~85 frames)
  const isMicroFlicker = (Math.floor(frame) % 85 === 72 || Math.floor(frame) % 85 === 73);
  const microFlickerMult = isMicroFlicker ? 0.3 : 1;

  const finalOpacity = Math.max(0.08, ignitionOpacity * humPulse * microFlickerMult);
  const glowIntensity = ignitionBrightness * humPulse * microFlickerMult;

  // Ambient Wall Reflection / Bloom
  const ambientSpread = Math.max(4, 20 * glowIntensity);

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-visible ${className}`}
      style={{
        backgroundColor: 'transparent',
        background: 'transparent',
        ...style,
      }}
    >
      {/* Neon Sign Outer Tube Bracket Wire (aesthetic framing) */}
      <div
        className="relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl transition-opacity duration-75"
        style={{
          border: `2px solid ${neonColor}`,
          borderColor: `rgba(${neonColor === '#ff2a85' ? '255, 42, 133' : '56, 189, 248'}, ${finalOpacity * 0.7})`,
          boxShadow: `
            0 0 ${ambientSpread}px ${neonColor}40,
            inset 0 0 ${ambientSpread * 0.8}px ${neonColor}30
          `,
          opacity: finalOpacity,
        }}
      >
        {/* Neon Mounting Brackets at corners */}
        <span
          className="absolute -top-1.5 left-6 w-3 h-3 rounded-full bg-slate-700 border border-slate-500"
          style={{ opacity: 0.8 }}
        />
        <span
          className="absolute -top-1.5 right-6 w-3 h-3 rounded-full bg-slate-700 border border-slate-500"
          style={{ opacity: 0.8 }}
        />
        <span
          className="absolute -bottom-1.5 left-6 w-3 h-3 rounded-full bg-slate-700 border border-slate-500"
          style={{ opacity: 0.8 }}
        />
        <span
          className="absolute -bottom-1.5 right-6 w-3 h-3 rounded-full bg-slate-700 border border-slate-500"
          style={{ opacity: 0.8 }}
        />

        {/* Primary Main Neon Tube Headline */}
        <h1
          className="text-center font-bold tracking-wider leading-none"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: "'Courier New', Courier, monospace, system-ui",
            color: tubeColor,
            textShadow: `
              0 0 4px #ffffff,
              0 0 10px #ffffff,
              0 0 20px ${neonColor},
              0 0 40px ${neonColor},
              0 0 80px ${neonColor},
              0 0 120px ${neonColor}80
            `,
            opacity: finalOpacity,
            willChange: 'text-shadow, opacity',
          }}
        >
          {text}
        </h1>

        {/* Secondary Accent Neon Tube Subtext */}
        {subtext && (
          <div
            className="mt-3.5 px-3 py-1 rounded-md tracking-widest uppercase font-semibold text-center"
            style={{
              fontSize: `${Math.max(12, Math.round(fontSize * 0.28))}px`,
              fontFamily: "'Courier New', Courier, monospace",
              color: '#ffffff',
              border: `1px solid ${accentColor}60`,
              textShadow: `
                0 0 4px #ffffff,
                0 0 12px ${accentColor},
                0 0 24px ${accentColor}
              `,
              boxShadow: `0 0 15px ${accentColor}40`,
              opacity: Math.max(0.1, finalOpacity * 0.9),
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

export default NeonSignFlicker;
