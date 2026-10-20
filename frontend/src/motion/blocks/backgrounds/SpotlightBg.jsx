import React from 'react';
import { useSafeFrame } from '../../core/useSafeFrame';

/**
 * SpotlightBg - Aceternity UI inspired cinematic spotlight background
 * Features smooth cone sweep, radial glow, and optional ambient cyber grid.
 */
export function SpotlightBg({
  spotlightColor = '#00f2fe',
  ambientColor = 'transparent',
  glowIntensity = 0.35,
  showGrid = true,
  loop = false,
  className = '',
}) {
  const maxFrames = 90;
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });

  // Subtle breathing oscillation
  const timeSec = frame / fps;
  const pulse = !loop && frame >= maxFrames ? 1 : Math.sin(timeSec * 1.5) * 0.08 + 1; // 0.92 to 1.08
  const currentOpacity = Math.max(0.1, Math.min(0.8, glowIntensity * pulse));

  return (
    <div
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none ${className}`}
      style={{ backgroundColor: ambientColor !== 'transparent' ? ambientColor : 'transparent' }}
    >
      {/* 1. Cyber Grid Pattern */}
      {showGrid && (
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${spotlightColor} 1px, transparent 1px),
              linear-gradient(to bottom, ${spotlightColor} 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
      )}

      {/* 2. Top-Left Primary Spotlight Cone */}
      <div
        className="absolute -top-32 -left-20 w-[600px] h-[600px] rounded-full blur-[120px]"
        style={{
          background: `radial-gradient(circle, ${spotlightColor} 0%, transparent 70%)`,
          opacity: currentOpacity,
          transform: `scale(${pulse})`,
        }}
      />

      {/* 3. Bottom-Right Subtle Fill Light */}
      <div
        className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full blur-[140px]"
        style={{
          background: `radial-gradient(circle, ${spotlightColor} 0%, transparent 65%)`,
          opacity: currentOpacity * 0.4,
        }}
      />
    </div>
  );
}
