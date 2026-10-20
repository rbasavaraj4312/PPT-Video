import React, { useMemo } from 'react';
import { spring, interpolate } from 'remotion';
import { useSafeFrame } from '@/motion/core/useSafeFrame';

// ================= 1. ANIMATED GRADIENT TEXT =================
export function AnimatedGradientText({
  text = 'IRIDESCENT NEON MOTION',
  gradientColors = ['#00f2fe', '#4facfe', '#ec4899', '#f59e0b', '#00f2fe'],
  fontSize = 54,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 75;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const angle = (f * 3.5) % 360;
  const gradStr = `linear-gradient(${angle}deg, ${gradientColors.join(', ')})`;
  const scale = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          background: gradStr,
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          transform: `scale(${0.9 + scale * 0.1})`,
          filter: `drop-shadow(0 4px 16px ${gradientColors[0]}40) drop-shadow(0 0 24px ${gradientColors[2] || '#ec4899'}30)`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 2. BLUR OUT UP =================
export function BlurOutUp({
  text = 'DISSOLVING INTO ETHER',
  textColor = '#ffffff',
  accentColor = '#38bdf8',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 60;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const words = useMemo(() => String(text || '').split(' '), [text]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center flex-wrap gap-x-3 gap-y-1 select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      {words.map((w, idx) => {
        const s = spring({
          frame: Math.max(0, f - idx * 3),
          fps,
          config: { damping: 13, stiffness: 140 },
        });

        // Starts high & blurred, slams into crisp resting state
        const translateY = (1 - s) * -45;
        const blur = (1 - s) * 20;
        const opacity = Math.min(1, s * 1.5);

        return (
          <span
            key={idx}
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              color: textColor,
              opacity,
              filter: `blur(${blur}px)`,
              transform: `translate3d(0, ${translateY}px, 0)`,
              textShadow: `0 0 16px ${accentColor}50`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

// ================= 3. BOLD COPY =================
export function BoldCopy({
  text = 'UNSTOPPABLE FORCE OF INNOVATION',
  accentWord = 'UNSTOPPABLE',
  baseColor = '#94a3b8',
  boldColor = '#00f2fe',
  fontSize = 50,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 50;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const words = useMemo(() => String(text || '').split(' '), [text]);
  const popSpring = spring({ frame: f, fps, config: { damping: 10, stiffness: 220, mass: 0.5 } });

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center flex-wrap gap-x-3 gap-y-1 select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      {words.map((w, idx) => {
        const isBold = w.toUpperCase().includes(accentWord.toUpperCase());
        const scale = isBold ? 1 + popSpring * 0.18 : 1;
        const color = isBold ? boldColor : baseColor;

        return (
          <span
            key={idx}
            style={{
              fontSize: isBold ? `${fontSize * 1.15}px` : `${fontSize}px`,
              fontWeight: isBold ? 900 : 500,
              color,
              transform: `scale(${scale})`,
              letterSpacing: isBold ? '-0.03em' : 'normal',
              textShadow: isBold ? `0 0 24px ${boldColor}80` : 'none',
              transition: 'transform 0.1s ease',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

// ================= 4. BOTTOM-UP LETTERS =================
export function BottomUpLetters({
  text = 'RISING FROM THE BASELINE',
  textColor = '#ffffff',
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
          config: { damping: 12, stiffness: 180, mass: 0.6 },
        });

        const y = (1 - s) * 70;
        const opacity = Math.min(1, s * 1.6);
        const rot = (1 - s) * 15;

        return (
          <span
            key={idx}
            className="inline-block"
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              color: textColor,
              opacity,
              transform: `translate3d(0, ${y}px, 0) rotate(${rot}deg)`,
              transformOrigin: 'bottom center',
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
}

// ================= 5. CIRCULAR TEXT =================
export function CircularText({
  text = '• REVOLUTIONARY • MULTI-AGENT • SWARM ',
  centerBadge = 'AI',
  textColor = '#38bdf8',
  badgeColor = '#00f2fe',
  radius = 90,
  fontSize = 16,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 120;
  const { frame } = useSafeFrame(30, { loop: true, maxFrames }); // circular orbit gently orbits
  const f = frame * Math.max(0.2, speed);

  const rotation = f * 1.5;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: `${radius * 2 + 60}px`, height: `${radius * 2 + 60}px` }}
      >
        {/* Central Glowing Core Badge */}
        {centerBadge && (
          <div
            className="absolute z-10 w-16 h-16 rounded-full flex items-center justify-center font-black text-xl"
            style={{
              backgroundColor: `${badgeColor}15`,
              color: badgeColor,
              border: `2px solid ${badgeColor}`,
              boxShadow: `0 0 20px ${badgeColor}60, inset 0 0 10px ${badgeColor}30`,
            }}
          >
            {centerBadge}
          </div>
        )}

        {/* Orbiting SVG Text Path */}
        <svg
          viewBox={`0 0 ${radius * 2 + 60} ${radius * 2 + 60}`}
          className="w-full h-full"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <defs>
            <path
              id="circular-orbit-path"
              d={`M ${radius + 30},${radius + 30} m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
            />
          </defs>
          <text
            fill={textColor}
            fontSize={fontSize}
            fontWeight="bold"
            letterSpacing="2.5"
            style={{ filter: `drop-shadow(0 0 6px ${textColor}80)` }}
          >
            <textPath href="#circular-orbit-path" startOffset="0%">
              {text}
            </textPath>
          </text>
        </svg>
      </div>
    </div>
  );
}

// ================= 6. COUNTER TEXT =================
export function CounterText({
  targetNumber = 1000000,
  prefix = '$',
  suffix = '+',
  label = 'TOTAL RUNTIME CHECKPOINTS',
  primaryColor = '#10b981',
  fontSize = 62,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 60;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 15, stiffness: 70 } });
  const currentVal = Math.round(Number(targetNumber) * Math.min(1, s));

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <div
        className="font-mono font-black tracking-tight flex items-baseline justify-center"
        style={{
          fontSize: `${fontSize}px`,
          color: '#ffffff',
          textShadow: `0 0 24px ${primaryColor}60`,
        }}
      >
        <span style={{ color: primaryColor }}>{prefix}</span>
        <span>{currentVal.toLocaleString()}</span>
        <span style={{ color: primaryColor }}>{suffix}</span>
      </div>
      {label && (
        <span
          className="mt-2 text-xs font-mono font-bold tracking-widest uppercase px-3 py-0.5 rounded border"
          style={{
            color: primaryColor,
            borderColor: `${primaryColor}40`,
            backgroundColor: `${primaryColor}10`,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ================= 7. CYCLE TEXT =================
export function CycleText({
  words = ['FAST', 'SECURE', 'AUTONOMOUS', 'INTELLIGENT'],
  prefix = 'WE BUILD IT ',
  accentColor = '#ec4899',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 90;
  const { frame } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const list = Array.isArray(words) && words.length > 0 ? words : ['FAST', 'RELIABLE'];
  const activeIdx = loop ? Math.floor(f / 24) % list.length : Math.min(list.length - 1, Math.floor(f / 24));
  const currentWord = list[activeIdx];

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center flex-wrap gap-2 ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span style={{ fontSize: `${fontSize}px`, fontWeight: 700, color: '#94a3b8' }}>
        {prefix}
      </span>
      <span
        key={currentWord}
        className="inline-block px-3 py-1 rounded-xl"
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: '#ffffff',
          backgroundColor: `${accentColor}25`,
          border: `2px solid ${accentColor}`,
          boxShadow: `0 0 20px ${accentColor}50`,
          animation: 'fadeIn 0.2s ease',
        }}
      >
        {currentWord}
      </span>
    </div>
  );
}

// ================= 8. DOUBLE UNDERLINE =================
export function DoubleUnderline({
  text = 'ARCHITECTURAL EXCELLENCE',
  lineColor1 = '#00f2fe',
  lineColor2 = '#f43f5e',
  textColor = '#ffffff',
  fontSize = 50,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 50;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s1 = spring({ frame: f, fps, config: { damping: 14, stiffness: 140 } });
  const s2 = spring({ frame: Math.max(0, f - 6), fps, config: { damping: 14, stiffness: 140 } });

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <span
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 900,
          color: textColor,
          letterSpacing: '-0.02em',
        }}
      >
        {text}
      </span>

      {/* Dual Laser Lines */}
      <div className="relative w-full max-w-lg mt-3 flex flex-col gap-1.5 items-center">
        {/* Line 1: Expands from Left */}
        <div
          className="h-[3px] rounded-full w-full"
          style={{
            backgroundColor: lineColor1,
            boxShadow: `0 0 12px ${lineColor1}`,
            transform: `scaleX(${s1})`,
            transformOrigin: 'left center',
          }}
        />
        {/* Line 2: Expands from Right */}
        <div
          className="h-[2px] rounded-full w-3/4"
          style={{
            backgroundColor: lineColor2,
            boxShadow: `0 0 10px ${lineColor2}`,
            transform: `scaleX(${s2})`,
            transformOrigin: 'right center',
          }}
        />
      </div>
    </div>
  );
}

// ================= 9. FADE THROUGH =================
export function FadeThrough({
  text = 'SEAMLESS SPATIAL TRANSITION',
  textColor = '#f8fafc',
  accentGlow = '#8b5cf6',
  fontSize = 52,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 55;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 16, stiffness: 110 } });
  const scale = 0.94 + s * 0.06;
  const opacity = Math.min(1, s * 1.4);

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
          opacity,
          transform: `scale(${scale})`,
          textShadow: `0 0 20px ${accentGlow}60`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 10. FOCUS BLUR RESOLVE =================
export function FocusBlurResolve({
  text = 'CLARITY FROM CHAOS',
  textColor = '#ffffff',
  accentColor = '#00f2fe',
  fontSize = 54,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 60;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const s = spring({ frame: f, fps, config: { damping: 14, stiffness: 120 } });
  const blur = (1 - s) * 28;
  const scale = 1.15 - s * 0.15;
  const opacity = Math.min(1, s * 1.5);

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
          filter: `blur(${blur}px)`,
          transform: `scale(${scale})`,
          textShadow: `0 0 24px ${accentColor}70`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 11. GIBBERISH TEXT =================
export function GibberishText({
  text = 'CYBER_CIPHER_RESOLVED',
  textColor = '#38bdf8',
  scrambleColor = '#f43f5e',
  fontSize = 44,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const glyphs = '#@%&*!?/\\$§∆0198';
  const rawText = String(text || '');
  const maxFrames = Math.max(50, rawText.length * 2 + 15);
  const { frame } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const resolved = useMemo(() => {
    return rawText.split('').map((char, i) => {
      const lockF = i * 2 + 6;
      if (f >= lockF || char === ' ') {
        return { char, isLocked: true };
      }
      const g = glyphs[Math.abs(Math.floor(f * 7 + i * 13)) % glyphs.length];
      return { char: g, isLocked: false };
    });
  }, [rawText, f]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center font-mono ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <div style={{ fontSize: `${fontSize}px`, fontWeight: 800 }}>
        {resolved.map((r, i) => (
          <span
            key={i}
            style={{
              color: r.isLocked ? textColor : scrambleColor,
              textShadow: r.isLocked ? `0 0 12px ${textColor}70` : `0 0 8px ${scrambleColor}`,
            }}
          >
            {r.char}
          </span>
        ))}
      </div>
    </div>
  );
}

// ================= 12. GLITCH TEXT =================
export function GlitchText({
  text = 'SYSTEM ANOMALY DETECTED',
  textColor = '#ffffff',
  cyanGlitch = '#00f2fe',
  redGlitch = '#ff0055',
  fontSize = 50,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 60;
  const { frame } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  // Periodic chromatic slice glitch
  const isGlitch = loop ? f % 25 < 4 : f < 18 && f % 5 < 2;
  const shiftX = isGlitch ? Math.sin(f * 6) * 6 : 0;
  const shiftY = isGlitch ? Math.cos(f * 8) * 3 : 0;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none text-center font-mono ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      <div className="relative inline-block" style={{ fontSize: `${fontSize}px`, fontWeight: 900 }}>
        {isGlitch && (
          <span
            aria-hidden
            className="absolute inset-0 select-none pointer-events-none"
            style={{
              color: cyanGlitch,
              transform: `translate(${shiftX}px, ${-shiftY}px)`,
              clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
              opacity: 0.85,
            }}
          >
            {text}
          </span>
        )}
        {isGlitch && (
          <span
            aria-hidden
            className="absolute inset-0 select-none pointer-events-none"
            style={{
              color: redGlitch,
              transform: `translate(${-shiftX}px, ${shiftY}px)`,
              clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
              opacity: 0.85,
            }}
          >
            {text}
          </span>
        )}
        <span style={{ color: textColor, textShadow: `0 0 12px rgba(255,255,255,0.4)` }}>
          {text}
        </span>
      </div>
    </div>
  );
}

// ================= 13. JITTER TEXT =================
export function JitterText({
  text = 'KINETIC ENERGY UNLEASHED',
  textColor = '#facc15',
  fontSize = 50,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 60;
  const { frame } = useSafeFrame(30, { loop, maxFrames });
  const f = frame * Math.max(0.2, speed);

  const isJittering = loop ? true : f < 30;
  const jx = isJittering ? Math.sin(f * 12) * 2.5 : 0;
  const jy = isJittering ? Math.cos(f * 14) * 2 : 0;
  const rot = isJittering ? Math.sin(f * 9) * 1.5 : 0;

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
          transform: `translate3d(${jx}px, ${jy}px, 0) rotate(${rot}deg)`,
          textShadow: `0 0 16px ${textColor}60`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ================= 14. JUMPING TEXT (INSTAGRAM) =================
export function JumpingText({
  text = 'POPULAR REEL VIBES',
  textColor = '#f43f5e',
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
      className={`relative w-full h-full flex items-center justify-center flex-wrap gap-x-[3px] select-none text-center ${className}`}
      style={{ backgroundColor: 'transparent', ...style }}
    >
      {chars.map((c, i) => {
        if (c === ' ') return <span key={i} style={{ width: `${fontSize * 0.35}px` }} />;

        // Playful bounce jump
        const bounceF = Math.max(0, f - i * 2.5);
        const s = spring({
          frame: bounceF,
          fps,
          config: { damping: 8, stiffness: 220, mass: 0.5 },
        });

        const y = Math.sin(Math.min(Math.PI, s * Math.PI)) * -22;
        const scaleY = 1 + Math.sin(s * Math.PI) * 0.25;
        const scaleX = 1 - Math.sin(s * Math.PI) * 0.15;

        return (
          <span
            key={i}
            className="inline-block"
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 900,
              color: textColor,
              transform: `translate3d(0, ${y}px, 0) scale(${scaleX}, ${scaleY})`,
              transformOrigin: 'bottom center',
              textShadow: `0 0 18px ${textColor}70`,
            }}
          >
            {c}
          </span>
        );
      })}
    </div>
  );
}
