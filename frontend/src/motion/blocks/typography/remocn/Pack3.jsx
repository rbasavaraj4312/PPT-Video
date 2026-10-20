import React, { useMemo } from 'react';
import { spring, interpolate } from 'remotion';
import { useSafeFrame } from '@/motion/core/useSafeFrame';

// ================= 29. SHORT SLIDE DOWN =================
export function ShortSlideDown({
  text = 'EXECUTIVE DIRECTIVE // 01',
  textColor = '#f8fafc',
  fontSize = 50,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 45;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 15, stiffness: 160 } });
  const y = (1 - s) * -24;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 800,
          color: textColor,
          opacity: Math.min(1, s * 1.5),
          transform: `translate3d(0, ${y}px, 0)`,
          letterSpacing: '-0.02em',
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 30. SHORT SLIDE RIGHT =================
export function ShortSlideRight({
  text = 'RAPID VELOCITY STREAM',
  textColor = '#00f2fe',
  fontSize = 50,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 45;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 150 } });
  const x = (1 - s) * -40;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 800,
          color: textColor,
          opacity: Math.min(1, s * 1.5),
          transform: `translate3d(${x}px, 0, 0)`,
          textShadow: `0 0 16px ${textColor}60`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 31. SOFT BLUR IN =================
export function SoftBlurIn({
  text = 'COALESCING FROM MIST',
  textColor = '#ffffff',
  accentColor = '#a855f7',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 55;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 100 } });
  const blur = (1 - s) * 16;
  const opacity = Math.min(1, s * 1.4);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          color: textColor,
          opacity,
          filter: `blur(${blur}px)`,
          textShadow: `0 0 24px ${accentColor}80`,
          letterSpacing: '-0.01em',
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 32. SPLIT TEXT =================
export function SplitText({
  text = 'FRACTURED CONVERGENCE',
  textColor = '#ffffff',
  accentColor = '#f43f5e',
  fontSize = 54,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 50;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });
  const topX = (1 - s) * -60;
  const bottomX = (1 - s) * 60;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <div className="relative inline-block" style={{ fontSize: `${fontSize}px`, fontWeight: 900 }}>
        {/* Top Half Slice */}
        <span
          className="absolute inset-0"
          style={{
            color: textColor,
            clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
            transform: `translate3d(${topX}px, 0, 0)`,
          }}
        >
          {text}
        </span>
        {/* Bottom Half Slice */}
        <span
          className="relative inline-block"
          style={{
            color: textColor,
            clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
            transform: `translate3d(${bottomX}px, 0, 0)`,
            textShadow: `0 0 20px ${accentColor}80`,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

// ================= 33. SPRING SCALE IN =================
export function SpringScaleIn({
  text = 'BOUNCY POP EXPLOSION',
  textColor = '#facc15',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 50;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: textColor,
          transform: `scale(${s})`,
          textShadow: `0 0 24px ${textColor}70`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 34. SWAP TEXT =================
export function SwapText({
  state1 = 'IMAGINE',
  state2 = 'CREATE',
  textColor = '#00f2fe',
  fontSize = 58,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 70;
  const { frame } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const isState2 = loop ? f % 40 >= 20 : f >= 25;
  const activeWord = isState2 ? state2 : state1;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', perspective: '800px', ...style }}
    >
      <span
        key={activeWord}
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: textColor,
          letterSpacing: '-0.02em',
          textShadow: `0 0 24px ${textColor}80`,
          animation: 'flipIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {activeWord}
      </span>
    </div>
  );
}

// ================= 35. TEXT BORDER ANIMATION =================
export function TextBorderAnimation({
  text = 'CYBER SECURITY SHIELD',
  borderColor = '#00f2fe',
  textColor = '#ffffff',
  fontSize = 46,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 60;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  const dashOffset = (1 - s) * 400;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <div className="relative px-8 py-4">
        {/* Animated Laser Border SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <rect
            x="2"
            y="2"
            width="calc(100% - 4px)"
            height="calc(100% - 4px)"
            rx="12"
            fill="none"
            stroke={borderColor}
            strokeWidth="2.5"
            strokeDasharray="400"
            strokeDashoffset={dashOffset}
            style={{ filter: `drop-shadow(0 0 10px ${borderColor})` }}
          />
        </svg>

        <span
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 800,
            color: textColor,
            letterSpacing: '-0.01em',
            opacity: Math.min(1, s * 1.5),
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

// ================= 36. TEXT EXPLODE (IMESSAGE) =================
export function TextExplode({
  text = 'KABOOM // DETONATION',
  textColor = '#ff0055',
  fontSize = 54,
  particleCount = 18,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 55;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 11, stiffness: 220, mass: 0.5 } });
  const shake = f < 15 ? Math.sin(f * 3) * (15 - f) : 0;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <div className="relative inline-block" style={{ transform: `translate3d(${shake}px, 0, 0)` }}>
        <span
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 900,
            color: textColor,
            transform: `scale(${s})`,
            textShadow: `0 0 30px ${textColor}90`,
            display: 'inline-block',
          }}
        >
          {text}
        </span>

        {/* Explosion Sparks */}
        {f > 5 && f < 40 && Array.from({ length: particleCount }).map((_, i) => {
          const angle = (i / particleCount) * 2 * Math.PI;
          const dist = (f - 5) * 6;
          const px = Math.cos(angle) * dist;
          const py = Math.sin(angle) * dist;
          const op = Math.max(0, 1 - (f - 5) / 30);

          return (
            <span
              key={i}
              className="absolute w-2 h-2 rounded-full pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                backgroundColor: textColor,
                boxShadow: `0 0 10px ${textColor}`,
                transform: `translate(${px}px, ${py}px)`,
                opacity: op,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ================= 37. TEXT FLIP =================
export function TextFlip({
  text = 'PERSPECTIVE CARD FLIP',
  textColor = '#38bdf8',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 50;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 140 } });
  const rotX = (1 - s) * -90;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', perspective: '1000px', ...style }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: textColor,
          opacity: Math.min(1, s * 1.5),
          transform: `rotateX(${rotX}deg)`,
          transformOrigin: 'center center',
          textShadow: `0 0 20px ${textColor}70`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 38. TICKER TEXT =================
export function TickerText({
  text = 'BREAKING: NEXT-GEN AI ARCHITECTURE RELEASED • ZERO PIPELINE DRIFT • RECORD HIGH PERFORMANCE •',
  textColor = '#00f2fe',
  fontSize = 32,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 180;
  const { frame } = useSafeFrame(30, { loop: true, maxFrames }); // tickers continuously marquee
  const f = frame * Math.max(0.2, speed);

  const offset = ((f * 2.5) % 1000);

  return (
    <div
      className={`relative w-full h-full flex items-center overflow-hidden select-none ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <div
        className="flex whitespace-nowrap font-mono font-bold"
        style={{
          transform: `translate3d(-${offset}px, 0, 0)`,
          fontSize: `${fontSize}px`,
          color: textColor,
          textShadow: `0 0 12px ${textColor}60`,
        }}
      >
        <span>{text}</span>
        <span className="ml-8">{text}</span>
      </div>
    </div>
  );
}

// ================= 39. TOP-DOWN LETTERS =================
export function TopDownLetters({
  text = 'RAINFALL LETTER DROP',
  textColor = '#10b981',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const chars = useMemo(() => String(text || '').split(''), [text]);
  const maxFrames = Math.max(50, chars.length * 2 + 25);
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center flex-wrap gap-x-[2px] overflow-hidden select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      {chars.map((c, idx) => {
        if (c === ' ') return <span key={idx} style={{ width: `${fontSize * 0.35}px` }} />;

        const s = spring({
          frame: Math.max(0, f - idx * 2),
          fps,
          config: { damping: 11, stiffness: 190, mass: 0.5 },
        });

        const y = (1 - s) * -65;
        const opacity = Math.min(1, s * 1.6);

        return (
          <span
            key={idx}
            className="inline-block"
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              color: textColor,
              opacity,
              transform: `translate3d(0, ${y}px, 0)`,
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
}

// ================= 40. TYPING TEXT =================
export function TypingText({
  text = 'Prompt engineering is compiled thought.',
  textColor = '#f8fafc',
  cursorColor = '#38bdf8',
  fontSize = 42,
  typeSpeed = 2,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const fullText = String(text || '');
  const ts = Math.max(1, typeSpeed);
  const maxFrames = Math.max(50, fullText.length * ts + 25);
  const { frame } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const typedChars = Math.min(fullText.length, Math.floor(f / ts));
  const displayText = fullText.slice(0, typedChars);
  const cursorBlink = Math.floor(f / 6) % 2 === 0;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center font-mono select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span style={{ fontSize: `${fontSize}px`, fontWeight: 600, color: textColor }}>
        {displayText}
      </span>
      <span
        style={{
          display: 'inline-block',
          width: '3px',
          height: `${fontSize * 0.85}px`,
          backgroundColor: cursorColor,
          opacity: cursorBlink ? 1 : 0,
          marginLeft: '4px',
          boxShadow: `0 0 10px ${cursorColor}`,
        }}
      />
    </div>
  );
}

// ================= 41. UNDERLINE HOVER TEXT =================
export function UnderlineHoverText({
  text = 'INTERACTIVE KINETIC ANCHOR',
  textColor = '#ffffff',
  underlineColor = '#f43f5e',
  fontSize = 50,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 50;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 140 } });

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span style={{ fontSize: `${fontSize}px`, fontWeight: 900, color: textColor, letterSpacing: '-0.02em' }}>
        {text}
      </span>
      <div
        className="h-[3px] rounded-full w-full max-w-md mt-2"
        style={{
          backgroundColor: underlineColor,
          boxShadow: `0 0 12px ${underlineColor}`,
          transform: `scaleX(${s})`,
          transformOrigin: 'center center',
        }}
      />
    </div>
  );
}

// ================= 42. WAVE REVEAL =================
export function WaveReveal({
  text = 'OCEANIC HARMONIC WAVE',
  textColor = '#00f2fe',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const chars = useMemo(() => String(text || '').split(''), [text]);
  const maxFrames = Math.max(60, chars.length * 3 + 20);
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center flex-wrap gap-x-[2px] select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      {chars.map((c, i) => {
        if (c === ' ') return <span key={i} style={{ width: `${fontSize * 0.35}px` }} />;

        const s = spring({
          frame: Math.max(0, f - i * 2),
          fps,
          config: { damping: 13, stiffness: 140 },
        });

        const waveY = (1 - s) * Math.sin(i * 0.5) * 35;
        const opacity = Math.min(1, s * 1.5);

        return (
          <span
            key={i}
            className="inline-block"
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              color: textColor,
              opacity,
              transform: `translate3d(0, ${waveY}px, 0)`,
              textShadow: `0 0 16px ${textColor}70`,
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
}
