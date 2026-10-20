import React, { useMemo } from 'react';
import { spring, interpolate } from 'remotion';
import { useSafeFrame } from '@/motion/core/useSafeFrame';

// ================= 15. KINETIC CENTER BUILD =================
export function KineticCenterBuild({
  text = 'EXPANDING FROM THE CORE',
  textColor = '#00f2fe',
  fontSize = 50,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 50;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 13, stiffness: 150 } });
  const scale = 0.4 + s * 0.6;
  const letterSpacing = interpolate(s, [0, 1], [-0.1, 0.04]); // em

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
          opacity: Math.min(1, s * 1.5),
          transform: `scale(${scale})`,
          letterSpacing: `${letterSpacing}em`,
          textShadow: `0 0 24px ${textColor}70`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 16. LINE-BY-LINE SLIDE =================
export function LineByLineSlide({
  lines = ['DISRUPTING LEGACY SYSTEMS', 'ONE ATOM AT A TIME', 'FORWARD THINKING VISION'],
  lineColor = '#ffffff',
  accentColor = '#f43f5e',
  fontSize = 42,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const lineList = Array.isArray(lines) && lines.length > 0 ? lines : ['LINE ONE', 'LINE TWO'];
  const maxFrames = Math.max(60, lineList.length * 15 + 25);
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center gap-2 select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      {lineList.map((lineText, idx) => {
        const s = spring({
          frame: Math.max(0, f - idx * 10),
          fps,
          config: { damping: 14, stiffness: 130 },
        });

        const y = (1 - s) * 40;
        const opacity = Math.min(1, s * 1.5);
        const color = idx === 0 ? accentColor : lineColor;

        return (
          <div key={idx} className="overflow-hidden">
            <span
              className="inline-block"
              style={{
                fontSize: `${fontSize}px`,
                fontWeight: 800,
                color,
                opacity,
                transform: `translate3d(0, ${y}px, 0)`,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {lineText}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ================= 17. MASK REVEAL UP =================
export function MaskRevealUp({
  text = 'GEOMETRIC REVEAL MATRIX',
  textColor = '#f8fafc',
  borderColor = '#38bdf8',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 50;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 160 } });
  const y = (1 - s) * 100; // % translation

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <div className="relative overflow-hidden py-2 px-4 border-b-2" style={{ borderColor }}>
        <span
          className="inline-block"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 900,
            color: textColor,
            transform: `translate3d(0, ${y}%, 0)`,
            letterSpacing: '-0.02em',
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

// ================= 18. METIS TEXT =================
export function MetisText({
  text = 'METIS HAUTE COUTURE',
  subtext = 'ATHENS • MILAN • TOKYO',
  primaryColor = '#f1f5f9',
  accentColor = '#facc15',
  fontSize = 50,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 60;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 90 } });
  const tracking = interpolate(s, [0, 1], [0.05, 0.28]); // em tracking

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          color: primaryColor,
          opacity: Math.min(1, s * 1.4),
          letterSpacing: `${tracking}em`,
          textTransform: 'uppercase',
          textShadow: `0 0 20px ${accentColor}40`,
        }}
      >
        {text}
      </span>
      {subtext && (
        <span
          className="mt-3 text-xs font-mono tracking-widest uppercase opacity-75"
          style={{ color: accentColor }}
        >
          {subtext}
        </span>
      )}
    </div>
  );
}

// ================= 19. MICRO SCALE FADE =================
export function MicroScaleFade({
  text = 'PRECISION DESIGN CRAFT',
  textColor = '#ffffff',
  fontSize = 54,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 45;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 120 } });
  const scale = 0.94 + s * 0.06;

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
          transform: `scale(${scale})`,
          letterSpacing: '-0.02em',
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 20. MIRROR TEXT =================
export function MirrorText({
  text = 'REFLECTIVE SYMMETRY',
  textColor = '#00f2fe',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 55;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  const opacity = Math.min(1, s * 1.5);

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      {/* Top Original */}
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: textColor,
          opacity,
          letterSpacing: '-0.02em',
          textShadow: `0 0 20px ${textColor}70`,
        }}
      >
        {text}
      </span>

      {/* Mirrored Reflection Below */}
      <span
        aria-hidden
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: textColor,
          opacity: opacity * 0.28,
          transform: 'scaleY(-1) translateY(6px)',
          letterSpacing: '-0.02em',
          maskImage: 'linear-gradient(to top, transparent, black)',
          WebkitMaskImage: 'linear-gradient(to top, transparent, black)',
          filter: 'blur(1.5px)',
          userSelect: 'none',
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 21. PER-CHARACTER RISE =================
export function PerCharacterRise({
  text = 'ELEVATING STANDARDS',
  textColor = '#ffffff',
  fontSize = 50,
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
      className={`relative w-full h-full flex items-center justify-center flex-wrap gap-x-[2px] select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      {chars.map((c, i) => {
        if (c === ' ') return <span key={i} style={{ width: `${fontSize * 0.35}px` }} />;

        const s = spring({
          frame: Math.max(0, f - i * 2),
          fps,
          config: { damping: 13, stiffness: 160 },
        });

        const y = (1 - s) * 36;
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

// ================= 22. PER-WORD CROSSFADE =================
export function PerWordCrossfade({
  words = ['VISION', 'STRATEGY', 'EXECUTION', 'IMPACT'],
  textColor = '#38bdf8',
  fontSize = 56,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const list = Array.isArray(words) && words.length > 0 ? words : ['ONE', 'TWO'];
  const maxFrames = list.length * 25;
  const { frame } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const idx = loop ? Math.floor(f / 25) % list.length : Math.min(list.length - 1, Math.floor(f / 25));
  const activeWord = list[idx];

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span
        key={activeWord}
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: textColor,
          letterSpacing: '-0.02em',
          textShadow: `0 0 24px ${textColor}80`,
          animation: 'fadeIn 0.25s ease',
        }}
      >
        {activeWord}
      </span>
    </div>
  );
}

// ================= 23. ROLL TEXT (NEW) =================
export function RollText({
  text = 'ROLLING INTO ACTION',
  textColor = '#facc15',
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
      className={`relative w-full h-full flex items-center justify-center flex-wrap gap-x-[3px] select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', perspective: '800px', ...style }}
    >
      {chars.map((c, i) => {
        if (c === ' ') return <span key={i} style={{ width: `${fontSize * 0.35}px` }} />;

        const s = spring({
          frame: Math.max(0, f - i * 2),
          fps,
          config: { damping: 11, stiffness: 180 },
        });

        const rotX = (1 - s) * -90;
        const opacity = Math.min(1, s * 1.6);

        return (
          <span
            key={i}
            className="inline-block"
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 900,
              color: textColor,
              opacity,
              transform: `rotateX(${rotX}deg)`,
              transformOrigin: 'top center',
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
}

// ================= 24. SCALE DOWN FADE =================
export function ScaleDownFade({
  text = 'TITANIC SLAM INCOMING',
  textColor = '#ffffff',
  glowColor = '#f43f5e',
  fontSize = 54,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 50;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 12, stiffness: 190, mass: 0.6 } });
  const scale = 2.4 - s * 1.4; // 2.4 down to 1.0
  const opacity = Math.min(1, s * 1.8);

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
          opacity,
          transform: `scale(${scale})`,
          textShadow: `0 0 30px ${glowColor}80`,
          letterSpacing: '-0.02em',
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 25. SCROLL REVEAL =================
export function ScrollReveal({
  text = 'UNFOLDING THE DIGITAL PARCHMENT',
  textColor = '#10b981',
  fontSize = 48,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 55;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  const clipWidth = interpolate(s, [0, 1], [0, 100]); // 0% to 100%

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          clipPath: `inset(0 ${100 - clipWidth}% 0 0)`,
        }}
      >
        <span
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 800,
            color: textColor,
            letterSpacing: '-0.02em',
            textShadow: `0 0 16px ${textColor}60`,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

// ================= 26. SHARED AXIS Y =================
export function SharedAxisY({
  text = 'SPATIAL Y-AXIS SHIFT',
  textColor = '#ffffff',
  accentColor = '#ec4899',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 50;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 150 } });
  const y = (1 - s) * 50;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center overflow-hidden ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 800,
          color: textColor,
          opacity: Math.min(1, s * 1.5),
          transform: `translate3d(0, ${y}px, 0)`,
          borderBottom: `3px solid ${accentColor}`,
          paddingBottom: '4px',
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 27. SHARED AXIS Z =================
export function SharedAxisZ({
  text = 'DEPTH TRAVERSAL VORTEX',
  textColor = '#38bdf8',
  fontSize = 54,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 55;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 140 } });
  const z = (1 - s) * -300;
  const opacity = Math.min(1, s * 1.5);

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
          opacity,
          transform: `translate3d(0, 0, ${z}px)`,
          textShadow: `0 0 24px ${textColor}70`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 28. SHIMMER SWEEP =================
export function ShimmerSweep({
  text = 'METALLIC ANAMORPHIC SHIMMER',
  textColor = '#e2e8f0',
  shimmerColor = '#ffffff',
  fontSize = 50,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 60;
  const { frame } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  // Shimmer light sweep from -100% to 200%
  const pos = loop ? ((f * 3) % 300) - 100 : Math.min(150, (f * 3) - 100);

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
          background: `linear-gradient(110deg, ${textColor} 0%, ${textColor} 35%, ${shimmerColor} 50%, ${textColor} 65%, ${textColor} 100%)`,
          backgroundSize: '200% 100%',
          backgroundPosition: `${pos}% 0%`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
        }}
      >
        {text}
      </span>
    </div>
  );
}
