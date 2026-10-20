import React, { useMemo } from 'react';
import { interpolate, spring } from 'remotion';
import { useSafeFrame } from '../../core/useSafeFrame';

/**
 * Procedural pseudo-random deterministic generator based on seed
 */
function seededRandom(seed) {
  const x = Math.sin(seed * 9999.123) * 10000;
  return x - Math.floor(x);
}

/**
 * KineticSupernovaText - Cinematic Hyper-Kinetic Typography (Enhanced)
 * Same props as before. New visual layers:
 * - Impact flash + breathing bloom halo behind the headline
 * - Radial god-rays / speed streaks that fire on impact
 * - Real 3D extruded depth (stacked layers) under every word
 * - Chromatic aberration split + sweeping metallic glint (gradient-position based)
 * - Double shockwave rings + an extra thin scan ring
 * - Spark particles with trails, ambient embers with twinkle
 * - HUD corner brackets that draw in, shimmering badge, diamond-capped subheadline
 * - Soft floor reflection glow, 100% transparent background
 */
export function KineticSupernovaText({
  headline = 'BREAK THE LIMITS',
  subheadline = 'AUTONOMOUS MOTION GRAPHICS CORE',
  badgeText = 'HYPER-KINETIC VFX',
  primaryColor = '#00f2fe',
  secondaryColor = '#f43f5e',
  accentGlow = '#8b5cf6',
  fontSize = 58,
  chromaticShift = 10,
  particleCount = 32,
  speed = 1,
  loop = false,
  className = '',
  style = {},
}) {
  const maxFrames = 80;
  const { frame: rawFrame, fps } = useSafeFrame(30, { loop, maxFrames });
  const frame = rawFrame * Math.max(0.2, speed);

  const clampOpts = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' };

  // 1. Impact camera rumble (decays after frame 14)
  const shakeDecay = interpolate(frame, [14, 30], [1, 0], clampOpts);
  const shakeX = Math.sin(frame * 2.2) * shakeDecay * 7;
  const shakeY = Math.cos(frame * 2.8) * shakeDecay * 5;

  // 2. Idle 3D parallax breathing
  const idleRotateY = Math.sin(frame * 0.05) * 3.5;
  const idleRotateX = Math.cos(frame * 0.04) * 2.2;
  const idleFloatY = Math.sin(frame * 0.06) * 3;

  // 3. Badge entrance
  const badgeSpring = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });
  const badgeY = (1 - badgeSpring) * -30;
  const badgeOpacity = Math.min(1, badgeSpring * 1.5);
  const badgeShine = interpolate(frame, [10, 34], [-60, 160], clampOpts);

  // 4. Headline words
  const words = useMemo(() => {
    return String(headline || '').trim().split(/\s+/).filter(Boolean);
  }, [headline]);

  // 5. Particles
  const particleSpring = spring({
    frame: Math.max(0, frame - 13),
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.8 },
  });

  const particles = useMemo(() => {
    const list = [];
    const count = Math.min(60, Math.max(12, particleCount));
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI + (seededRandom(i * 17) - 0.5) * 0.4;
      const speedMult = 0.5 + seededRandom(i * 31) * 0.9;
      const size = 2.5 + seededRandom(i * 47) * 3.5;
      const colorType = i % 3;
      const color =
        colorType === 0 ? primaryColor : colorType === 1 ? secondaryColor : '#ffffff';
      const maxDistance = 140 + seededRandom(i * 59) * 180;
      list.push({ id: i, angle, speedMult, size, color, maxDistance });
    }
    return list;
  }, [particleCount, primaryColor, secondaryColor]);

  // God-ray streaks (static geometry, animated by impact)
  const rays = useMemo(() => {
    const list = [];
    for (let i = 0; i < 18; i++) {
      list.push({
        id: i,
        angle: (i / 18) * 360 + (seededRandom(i * 7) - 0.5) * 14,
        length: 120 + seededRandom(i * 23) * 190,
        width: 1 + seededRandom(i * 41) * 2.2,
        color: i % 3 === 0 ? secondaryColor : i % 3 === 1 ? primaryColor : accentGlow,
      });
    }
    return list;
  }, [primaryColor, secondaryColor, accentGlow]);

  // 6. Shockwave rings
  const wave1Spring = spring({
    frame: Math.max(0, frame - 14),
    fps,
    config: { damping: 20, stiffness: 120, mass: 1 },
  });
  const wave1Scale = interpolate(wave1Spring, [0, 1], [0.1, 2.6]);
  const wave1Opacity = interpolate(wave1Spring, [0, 0.4, 1], [0.95, 0.7, 0]);

  const wave2Spring = spring({
    frame: Math.max(0, frame - 18),
    fps,
    config: { damping: 18, stiffness: 100, mass: 1.2 },
  });
  const wave2Scale = interpolate(wave2Spring, [0, 1], [0.1, 3.2]);
  const wave2Opacity = interpolate(wave2Spring, [0, 0.5, 1], [0.85, 0.5, 0]);

  const wave3Spring = spring({
    frame: Math.max(0, frame - 16),
    fps,
    config: { damping: 24, stiffness: 160, mass: 0.9 },
  });
  const wave3Scale = interpolate(wave3Spring, [0, 1], [0.05, 4.2]);
  const wave3Opacity = interpolate(wave3Spring, [0, 0.3, 1], [0.9, 0.35, 0]);

  // 7. Glint sweep (moves a gradient across the text, not the element)
  const glintPos = interpolate(frame, [22, 44], [160, -60], clampOpts);

  // 8. Subheadline
  const subSpring = spring({
    frame: Math.max(0, frame - 20),
    fps,
    config: { damping: 14, stiffness: 150, mass: 0.6 },
  });
  const subY = (1 - subSpring) * 18;
  const subTracking = interpolate(subSpring, [0, 1], [0.1, 0.35]);
  const lineScaleX = interpolate(subSpring, [0.3, 1], [0, 1], clampOpts);

  // 9. Impact flash, bloom halo, HUD brackets
  const flashOpacity = interpolate(frame, [13, 16, 30], [0, 0.85, 0], clampOpts);
  const flashScale = interpolate(frame, [13, 30], [0.3, 2.4], clampOpts);

  const haloIn = interpolate(frame, [8, 26], [0, 1], clampOpts);
  const haloPulse = 0.85 + Math.sin(frame * 0.09) * 0.15;

  const rayProgress = interpolate(frame, [14, 38], [0, 1], clampOpts);
  const rayOpacity = interpolate(frame, [14, 20, 38], [0, 0.85, 0], clampOpts);

  const bracketProgress = interpolate(frame, [18, 38], [0, 1], clampOpts);
  const bracketLen = 26 * bracketProgress;
  const bracketOpacity = interpolate(frame, [18, 26], [0, 0.9], clampOpts);

  const reflectIn = interpolate(frame, [22, 44], [0, 1], clampOpts);

  // Depth extrusion: layered offsets from dark accent to near-black
  const EXTRUDE_LAYERS = 7;

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none overflow-visible ${className}`}
      style={{
        backgroundColor: 'transparent',
        background: 'transparent',
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        transform: `translate3d(${shakeX}px, ${shakeY + idleFloatY}px, 0px) rotateY(${idleRotateY}deg) rotateX(${idleRotateX}deg)`,
        ...style,
      }}
    >
      {/* ================= LAYER 0: BLOOM HALO + IMPACT FLASH ================= */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible"
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: 'absolute',
            width: '620px',
            height: '260px',
            borderRadius: '50%',
            background: `radial-gradient(ellipse at center, ${accentGlow}55 0%, ${primaryColor}22 38%, transparent 70%)`,
            filter: 'blur(22px)',
            opacity: haloIn * haloPulse,
            transform: `scale(${0.8 + haloIn * 0.25})`,
            mixBlendMode: 'screen',
          }}
        />
        {flashOpacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              width: '260px',
              height: '260px',
              borderRadius: '50%',
              background: `radial-gradient(circle, #ffffff 0%, ${primaryColor}99 30%, ${secondaryColor}33 55%, transparent 72%)`,
              opacity: flashOpacity,
              transform: `scale(${flashScale})`,
              mixBlendMode: 'screen',
              filter: 'blur(4px)',
            }}
          />
        )}
      </div>

      {/* ================= LAYER 1: GOD-RAYS, PARTICLES, SHOCKWAVES ================= */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible"
        style={{ zIndex: 1 }}
      >
        {/* Radial speed streaks */}
        {rayOpacity > 0.01 &&
          rays.map((r) => {
            const start = 40 + rayProgress * 40;
            const len = r.length * rayProgress;
            return (
              <span
                key={`ray-${r.id}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${len}px`,
                  height: `${r.width}px`,
                  transformOrigin: '0% 50%',
                  transform: `rotate(${r.angle}deg) translateX(${start}px)`,
                  background: `linear-gradient(90deg, transparent 0%, ${r.color} 55%, #ffffff 100%)`,
                  opacity: rayOpacity,
                  mixBlendMode: 'screen',
                  borderRadius: '999px',
                  filter: 'blur(0.4px)',
                }}
              />
            );
          })}

        {/* Spark particles with trails */}
        {particles.map((p) => {
          const currentDist = p.maxDistance * particleSpring * p.speedMult;
          const pOpacity = interpolate(particleSpring, [0, 0.2, 0.7, 1], [0, 1, 0.8, 0]);
          const px = Math.cos(p.angle) * currentDist;
          const py = Math.sin(p.angle) * currentDist;
          const velocityStretch = 1 + (1 - particleSpring) * 3.2;
          const rotDeg = (p.angle * 180) / Math.PI;

          if (pOpacity <= 0.01) return null;

          return (
            <span
              key={p.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${p.size * velocityStretch}px`,
                height: `${p.size}px`,
                borderRadius: '999px',
                background: `linear-gradient(90deg, transparent 0%, ${p.color}aa 40%, ${p.color} 100%)`,
                boxShadow: `0 0 10px ${p.color}, 0 0 22px ${p.color}80`,
                opacity: pOpacity,
                transform: `translate(-50%, -50%) translate3d(${px}px, ${py}px, 0px) rotate(${rotDeg}deg)`,
                willChange: 'transform, opacity',
              }}
            />
          );
        })}

        {/* Shockwave 1: crisp primary ring */}
        {wave1Opacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              width: '280px',
              height: '110px',
              borderRadius: '50%',
              border: `2.5px solid ${primaryColor}`,
              boxShadow: `0 0 25px ${primaryColor}, inset 0 0 15px ${primaryColor}60`,
              transform: `scale(${wave1Scale})`,
              opacity: wave1Opacity,
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Shockwave 2: dashed secondary ring */}
        {wave2Opacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              width: '320px',
              height: '130px',
              borderRadius: '50%',
              border: `2px dashed ${secondaryColor}`,
              boxShadow: `0 0 30px ${secondaryColor}80`,
              transform: `scale(${wave2Scale}) rotate(${frame * 1.5}deg)`,
              opacity: wave2Opacity,
              mixBlendMode: 'screen',
            }}
          />
        )}

        {/* Shockwave 3: thin white scan ring */}
        {wave3Opacity > 0.01 && (
          <div
            style={{
              position: 'absolute',
              width: '240px',
              height: '90px',
              borderRadius: '50%',
              border: `1px solid #ffffff`,
              boxShadow: `0 0 14px ${accentGlow}`,
              transform: `scale(${wave3Scale})`,
              opacity: wave3Opacity,
              mixBlendMode: 'screen',
            }}
          />
        )}
      </div>

      {/* ================= LAYER 1.5: HUD CORNER BRACKETS ================= */}
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 4,
          width: '78%',
          height: '62%',
          opacity: bracketOpacity,
        }}
      >
        {[
          { k: 'tl', pos: { top: 0, left: 0 }, bt: 'borderTop', bs: 'borderLeft' },
          { k: 'tr', pos: { top: 0, right: 0 }, bt: 'borderTop', bs: 'borderRight' },
          { k: 'bl', pos: { bottom: 0, left: 0 }, bt: 'borderBottom', bs: 'borderLeft' },
          { k: 'br', pos: { bottom: 0, right: 0 }, bt: 'borderBottom', bs: 'borderRight' },
        ].map((c) => (
          <span
            key={c.k}
            style={{
              position: 'absolute',
              width: `${bracketLen}px`,
              height: `${bracketLen}px`,
              ...c.pos,
              [c.bt]: `2px solid ${primaryColor}`,
              [c.bs]: `2px solid ${primaryColor}`,
              boxShadow: `0 0 10px ${primaryColor}80`,
              filter: `drop-shadow(0 0 4px ${primaryColor})`,
            }}
          />
        ))}
      </div>

      {/* ================= LAYER 2: CYBER BADGE ================= */}
      {badgeText && (
        <div
          className="relative flex items-center gap-2 px-3.5 py-1 mb-3 rounded-full backdrop-blur-md overflow-hidden"
          style={{
            zIndex: 10,
            opacity: badgeOpacity,
            transform: `translateY(${badgeY}px)`,
            border: `1px solid ${primaryColor}70`,
            backgroundColor: 'transparent',
            background: `linear-gradient(90deg, ${primaryColor}14, ${accentGlow}1f, ${secondaryColor}14)`,
            boxShadow: `0 0 18px ${primaryColor}35, inset 0 0 10px ${primaryColor}22`,
          }}
        >
          {/* Shimmer sweep */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)',
              transform: `translateX(${badgeShine}%)`,
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
            }}
          />
          {/* Pulsing neon dot with radar ring */}
          <span className="relative w-2 h-2 flex items-center justify-center">
            <span
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `1px solid ${secondaryColor}`,
                transform: `scale(${1 + ((frame * 0.08) % 1) * 2.4})`,
                opacity: 1 - ((frame * 0.08) % 1),
              }}
            />
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: secondaryColor,
                boxShadow: `0 0 8px ${secondaryColor}, 0 0 14px ${secondaryColor}`,
                transform: `scale(${1 + Math.sin(frame * 0.2) * 0.25})`,
              }}
            />
          </span>
          <span
            style={{
              position: 'relative',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              textShadow: `0 0 8px ${primaryColor}`,
            }}
          >
            {badgeText}
          </span>
        </div>
      )}

      {/* ================= LAYER 3: 3D HYPER HEADLINE ================= */}
      <div
        className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center"
        style={{
          zIndex: 20,
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {words.map((word, wIdx) => {
          const wordStartFrame = 6 + wIdx * 4;
          const wordSpring = spring({
            frame: Math.max(0, frame - wordStartFrame),
            fps,
            config: { damping: 14, stiffness: 220, mass: 0.65 },
          });

          const transZ = (1 - wordSpring) * 350;
          const rotX = (1 - wordSpring) * -45;
          const rotY = (1 - wordSpring) * (wIdx % 2 === 0 ? 20 : -20);
          const scale = interpolate(wordSpring, [0, 0.7, 1], [2.2, 0.94, 1]);
          const opacity = Math.min(1, wordSpring * 1.6);
          const blur = Math.max(0, (1 - wordSpring) * 14);

          // Chromatic aberration (strong at speed, snaps to 0 on settle)
          const velocityFactor = Math.max(0, 1 - wordSpring);
          const splitAmount = chromaticShift * velocityFactor;
          const glitchJitter =
            velocityFactor > 0.05 ? Math.sin(frame * 3 + wIdx) * 2.5 : 0;

          // Depth extrusion grows as the word lands
          const depth = interpolate(wordSpring, [0, 1], [0, 1], clampOpts);
          const idleGlow = 0.7 + Math.sin(frame * 0.1 + wIdx * 0.8) * 0.3;

          return (
            <div
              key={`${word}-${wIdx}`}
              className="relative inline-block"
              style={{
                opacity,
                filter: `blur(${blur}px)`,
                transform: `translate3d(0px, 0px, ${transZ}px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
                transformStyle: 'preserve-3d',
                fontSize: `${fontSize}px`,
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                willChange: 'transform, opacity, filter',
              }}
            >
              {/* --- EXTRUSION: stacked depth slices --- */}
              {depth > 0.05 &&
                Array.from({ length: EXTRUDE_LAYERS }).map((_, d) => {
                  const t = (d + 1) / EXTRUDE_LAYERS;
                  return (
                    <span
                      key={`ex-${d}`}
                      aria-hidden
                      style={{
                        position: 'absolute',
                        inset: 0,
                        color: d % 2 === 0 ? accentGlow : '#1b1033',
                        opacity: (1 - t * 0.55) * 0.85 * depth,
                        transform: `translate3d(${t * 3.2 * depth}px, ${t * 4.6 * depth}px, ${-t * 8}px)`,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                    >
                      {word}
                    </span>
                  );
                })}

              {/* --- PASS A: secondary channel split (left/up) --- */}
              {splitAmount > 0.5 && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    color: secondaryColor,
                    transform: `translate3d(${-splitAmount - glitchJitter}px, ${-splitAmount * 0.4}px, -2px)`,
                    opacity: 0.8,
                    mixBlendMode: 'screen',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {word}
                </span>
              )}

              {/* --- PASS B: primary channel split (right/down) --- */}
              {splitAmount > 0.5 && (
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    color: primaryColor,
                    transform: `translate3d(${splitAmount + glitchJitter}px, ${splitAmount * 0.4}px, -1px)`,
                    opacity: 0.85,
                    mixBlendMode: 'screen',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                >
                  {word}
                </span>
              )}

              {/* --- PASS C: neon outline glow (behind core) --- */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  color: 'transparent',
                  WebkitTextStroke: `1.5px ${primaryColor}`,
                  filter: `drop-shadow(0 0 ${6 * idleGlow}px ${primaryColor}) drop-shadow(0 0 ${16 * idleGlow}px ${accentGlow})`,
                  opacity: 0.9,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                {word}
              </span>

              {/* --- PASS D: metallic chrome core --- */}
              <span
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  background: `linear-gradient(170deg, #ffffff 0%, #ffffff 22%, ${primaryColor} 52%, ${accentGlow} 74%, ${secondaryColor} 100%)`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: `drop-shadow(0 4px 14px rgba(0,0,0,0.75)) drop-shadow(0 0 ${12 * idleGlow}px ${primaryColor}60)`,
                  zIndex: 2,
                }}
              >
                {word}
              </span>

              {/* --- PASS E: anamorphic glint sweep (gradient position) --- */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'linear-gradient(110deg, transparent 0%, transparent 38%, rgba(255,255,255,1) 50%, transparent 62%, transparent 100%)',
                  backgroundSize: '260% 100%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `${glintPos - wIdx * 14}% 0%`,
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  opacity: 0.95,
                  mixBlendMode: 'color-dodge',
                  pointerEvents: 'none',
                  zIndex: 3,
                }}
              >
                {word}
              </span>
            </div>
          );
        })}
      </div>

      {/* ================= LAYER 4: SUBHEADLINE & BEAM ================= */}
      {subheadline && (
        <div
          className="relative flex flex-col items-center mt-4"
          style={{
            zIndex: 15,
            opacity: Math.min(1, subSpring * 1.5),
            transform: `translateY(${subY}px)`,
          }}
        >
          {/* Laser underline with travelling hot spot and diamond end caps */}
          <div
            className="relative w-full mb-2.5 flex items-center justify-center"
            style={{
              maxWidth: '380px',
              height: '8px',
              transform: `scaleX(${lineScaleX})`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className="w-full h-[2px] relative overflow-hidden"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${primaryColor} 25%, #ffffff 50%, ${secondaryColor} 75%, transparent 100%)`,
                boxShadow: `0 0 12px ${primaryColor}, 0 0 24px ${secondaryColor}`,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  width: '18%',
                  left: `${((frame * 2.2) % 140) - 20}%`,
                  background:
                    'linear-gradient(90deg, transparent, rgba(255,255,255,1), transparent)',
                }}
              />
            </div>
            {['left', 'right'].map((side) => (
              <span
                key={side}
                style={{
                  position: 'absolute',
                  [side]: '-2px',
                  width: '7px',
                  height: '7px',
                  background: side === 'left' ? primaryColor : secondaryColor,
                  boxShadow: `0 0 10px ${side === 'left' ? primaryColor : secondaryColor}`,
                  transform: 'rotate(45deg)',
                }}
              />
            ))}
          </div>

          <span
            style={{
              color: '#f1f5f9',
              fontSize: `${Math.max(12, Math.round(fontSize * 0.26))}px`,
              fontWeight: 700,
              letterSpacing: `${subTracking}em`,
              textTransform: 'uppercase',
              textShadow: `0 0 10px ${primaryColor}70, 0 0 22px ${secondaryColor}50, 0 2px 6px rgba(0,0,0,0.6)`,
              textAlign: 'center',
            }}
          >
            {subheadline}
          </span>
        </div>
      )}

      {/* ================= LAYER 4.5: FLOOR REFLECTION GLOW ================= */}
      <div
        className="absolute pointer-events-none"
        style={{
          zIndex: 3,
          bottom: '14%',
          width: '60%',
          height: '14px',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${primaryColor}70 0%, ${accentGlow}30 45%, transparent 75%)`,
          filter: 'blur(8px)',
          opacity: reflectIn * (0.7 + Math.sin(frame * 0.08) * 0.2),
          transform: `scaleX(${0.6 + reflectIn * 0.4})`,
          mixBlendMode: 'screen',
        }}
      />

      {/* ================= LAYER 5: AMBIENT EMBERS ================= */}
      <div
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ zIndex: 5 }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const emberX =
            Math.sin(frame * 0.04 + i * 2) * 150 + (seededRandom(i * 13) - 0.5) * 140;
          const emberY = ((frame * (0.5 + (i % 4) * 0.12) + i * 29) % 240) - 120;
          const lifeFade = Math.sin(((emberY + 120) / 240) * Math.PI);
          const twinkle = 0.65 + Math.sin(frame * 0.3 + i * 1.7) * 0.35;
          const emberOpacity = lifeFade * 0.7 * twinkle;
          const emberColor = i % 3 === 0 ? '#ffffff' : i % 2 === 0 ? primaryColor : secondaryColor;
          const emberSize = 2 + (i % 4);

          return (
            <span
              key={`ember-${i}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: `${emberSize}px`,
                height: `${emberSize}px`,
                borderRadius: '50%',
                backgroundColor: emberColor,
                boxShadow: `0 0 8px ${emberColor}, 0 0 18px ${emberColor}`,
                opacity: Math.max(0, emberOpacity),
                transform: `translate(-50%, -50%) translate3d(${emberX}px, ${-emberY}px, 0px)`,
                pointerEvents: 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default KineticSupernovaText;