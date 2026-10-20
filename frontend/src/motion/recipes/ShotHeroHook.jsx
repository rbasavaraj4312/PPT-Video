import React from 'react';
import { spring } from 'remotion';
import { useSafeFrame } from '../core/useSafeFrame';
import { BlurText } from '../blocks/typography/BlurText';
import { ScrambleText } from '../blocks/typography/ScrambleText';

/**
 * ShotHeroHook - Video-Shotcraft inspired opening hook shot
 * Full-bleed cinematic entrance with spotlight sweep, category badge, and punchy kinetic headline.
 */
export function ShotHeroHook({
  badgeText = '2026 ARCHITECTURE SHIFT',
  headline = 'Why Monolithic Pipelines Fail',
  subheadline = 'Autonomous Multi-Agent Swarms Rewrite Modern Infrastructure',
  accentColor = '#00f2fe',
  bgColor = 'transparent',
  loop = false,
  className = '',
}) {
  const maxFrames = 75;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });

  const badgeSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 140, mass: 0.5 },
  });

  const subtitleSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center p-4 select-none ${className}`}
      style={{ backgroundColor: 'transparent' }}
    >
      {/* 1. Top Scramble Badge */}
      <div
        className="relative z-10 mb-6 flex items-center gap-2"
        style={{
          transform: `scale(${badgeSpring})`,
          opacity: Math.min(1, badgeSpring * 1.5),
        }}
      >
        <span
          className="inline-block px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border shadow-lg"
          style={{
            backgroundColor: `${accentColor}18`,
            borderColor: `${accentColor}60`,
            boxShadow: `0 0 16px ${accentColor}30`,
          }}
        >
          <ScrambleText text={badgeText} textColor={accentColor} fontSize={12} speed={1} loop={loop} />
        </span>
      </div>

      {/* 3. Kinetic Headline (React Bits BlurText) */}
      <div className="relative z-10 max-w-2xl text-center px-4">
        <BlurText
          text={headline}
          textColor="#ffffff"
          fontSize={44}
          fontWeight={900}
          textAlign="center"
          staggerDelay={3}
          loop={loop}
        />
      </div>

      {/* 4. Subheadline reveal */}
      {subheadline && (
        <div
          className="relative z-10 max-w-lg mt-6 text-center text-sm md:text-base font-medium leading-relaxed px-4"
          style={{
            color: '#94a3b8',
            opacity: Math.min(1, subtitleSpring),
            transform: `translateY(${(1 - subtitleSpring) * 16}px)`,
          }}
        >
          {subheadline}
        </div>
      )}
    </div>
  );
}
