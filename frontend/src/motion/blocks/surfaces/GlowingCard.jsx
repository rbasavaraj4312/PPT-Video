import React from 'react';
import { spring } from 'remotion';
import { useSafeFrame } from '../../core/useSafeFrame';

/**
 * GlowingCard - Aceternity UI & Remocn inspired glassmorphism card
 * Features cyber corner brackets, neon breathing aura, and Remotion spring entrance.
 */
export function GlowingCard({
  tag = 'FEATURE // 01',
  heading = 'Autonomous Agent Mesh',
  description = 'Deterministic state execution across edge nodes with zero pipeline drift.',
  accentColor = '#00f2fe',
  cardBg = 'transparent',
  textColor = '#ffffff',
  icon = 'zap',
  delayFrames = 0,
  loop = false,
  className = '',
  children,
}) {
  const maxFrames = 60;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });

  const progress = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: { damping: 14, stiffness: 100, mass: 0.8 },
  });

  const scale = 0.92 + progress * 0.08;
  const opacity = Math.min(1, progress * 1.5);
  const translateY = (1 - progress) * 20;

  return (
    <div
      className={`relative w-full h-full p-6 flex flex-col justify-between box-border rounded-2xl overflow-hidden select-none ${className}`}
      style={{
        backgroundColor: cardBg || 'transparent',
        backdropFilter: cardBg === 'transparent' ? 'blur(12px)' : undefined,
        WebkitBackdropFilter: cardBg === 'transparent' ? 'blur(12px)' : undefined,
        border: `1.5px solid ${accentColor}40`,
        boxShadow: `0 12px 40px rgba(0, 0, 0, 0.4), 0 0 24px ${accentColor}20`,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* 1. Neon Radial Glow in Corner */}
      <div
        className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl pointer-events-none"
        style={{
          background: accentColor,
          opacity: 0.25,
        }}
      />

      {/* 2. Cyber Corner Brackets */}
      <div
        className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 pointer-events-none"
        style={{ borderColor: accentColor }}
      />
      <div
        className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 pointer-events-none"
        style={{ borderColor: accentColor }}
      />

      {/* 3. Header: Tag & Status indicator */}
      <div className="relative z-10 flex items-center justify-between mb-2">
        {tag && (
          <span
            className="font-mono text-[10px] font-extrabold tracking-widest px-2.5 py-1 rounded border"
            style={{
              backgroundColor: `${accentColor}15`,
              color: accentColor,
              borderColor: `${accentColor}50`,
            }}
          >
            {tag}
          </span>
        )}
        <div
          className="w-2 h-2 rounded-full animate-ping"
          style={{ backgroundColor: accentColor }}
        />
      </div>

      {/* 4. Body Content */}
      {children || (
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          {heading && (
            <h3
              className="text-xl font-black tracking-tight leading-snug mb-1.5"
              style={{ color: textColor }}
            >
              {heading}
            </h3>
          )}
          {description && (
            <p
              className="text-xs leading-relaxed opacity-80"
              style={{ color: textColor }}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
