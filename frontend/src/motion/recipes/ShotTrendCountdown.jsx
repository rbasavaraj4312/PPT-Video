import React from 'react';
import { spring } from 'remotion';
import { useSafeFrame } from '../core/useSafeFrame';
import { GlowingCard } from '../blocks/surfaces/GlowingCard';

/**
 * ShotTrendCountdown - Video-Shotcraft inspired stacked trend countdown
 * Optimized for vertical 9:16 reels and landscape 16:9 process slides.
 */
export function ShotTrendCountdown({
  title = '3 Major Tech Trends in 2026',
  badge = 'REELS RADAR',
  trends = [
    { number: '01', title: 'On-Device SLMs', description: '7B parameter models running locally on mobile NPUs with sub-10ms latency.', accent: '#00f2fe' },
    { number: '02', title: 'Agentic Swarms', description: 'Self-organizing teams of specialized AI workers replacing brittle pipelines.', accent: '#ec4899' },
    { number: '03', title: 'Neuro-Symbolic AI', description: 'Deep learning neural models unified with formal mathematical verification.', accent: '#10b981' },
  ],
  primaryColor = '#00f2fe',
  cardBg = 'transparent',
  staggerFrames = 8,
  loop = false,
  className = '',
}) {
  const maxFrames = Math.max(60, (trends?.length || 3) * staggerFrames + 30);
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 120 },
  });

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between p-4 md:p-6 select-none ${className}`}
      style={{ backgroundColor: 'transparent' }}
    >
      {/* 1. Header Section */}
      <div
        className="relative z-10 text-center mb-4"
        style={{
          transform: `scale(${titleSpring})`,
          opacity: Math.min(1, titleSpring * 1.4),
        }}
      >
        <span
          className="inline-block px-3 py-1 mb-2 rounded text-[10px] font-mono font-extrabold tracking-widest uppercase border"
          style={{
            backgroundColor: `${primaryColor}15`,
            color: primaryColor,
            borderColor: `${primaryColor}40`,
          }}
        >
          {badge}
        </span>
        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
          {title}
        </h2>
      </div>

      {/* 2. Staggered Trend Cards */}
      <div className="relative z-10 flex-1 flex flex-col justify-center gap-3 w-full max-w-md mx-auto">
        {Array.isArray(trends) && trends.map((item, idx) => {
          const cardAccent = item.accent || primaryColor;
          return (
            <div key={idx} className="h-24 md:h-28">
              <GlowingCard
                tag={`TREND // ${item.number || idx + 1}`}
                heading={item.title}
                description={item.description}
                accentColor={cardAccent}
                cardBg={cardBg}
                delayFrames={(idx + 1) * staggerFrames}
                loop={loop}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
