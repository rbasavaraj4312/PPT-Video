import React, { useMemo } from 'react';
import { spring } from 'remotion';
import { useSafeFrame } from '../core/useSafeFrame';

/**
 * ShotMetricTicking - Video-Shotcraft inspired dynamic metric showcase
 * Numbers smoothly tick up from 0 to target value with animated circular gauge.
 */
export function ShotMetricTicking({
  targetNumber = 99.9,
  suffix = '%',
  label = 'SYSTEM AVAILABILITY',
  subtitle = 'Zero-downtime distributed consensus across 42 global regions',
  accentColor = '#10b981',
  bgColor = 'transparent',
  durationFrames = 45,
  loop = false,
  className = '',
}) {
  const maxFrames = Math.max(45, durationFrames + 20);
  const { frame, fps } = useSafeFrame(30, { loop, maxFrames });

  const progress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
  });

  // Numeric interpolation
  const currentVal = useMemo(() => {
    const rawTarget = parseFloat(targetNumber) || 100;
    const isDecimal = String(targetNumber).includes('.');
    const decimalPlaces = isDecimal ? String(targetNumber).split('.')[1].length : 0;

    const val = rawTarget * Math.min(1, progress);
    return val.toFixed(decimalPlaces);
  }, [targetNumber, progress]);

  // Circumference for 120px radius circle = 2 * PI * 120 = 754
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * Math.min(1, progress));

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center p-4 select-none ${className}`}
      style={{ backgroundColor: 'transparent' }}
    >
      {/* 1. Circular Gauge with Centered Numeric Display */}
      <div className="relative z-10 flex items-center justify-center w-64 h-64 mb-4">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
          {/* Background circle */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke={`${accentColor}20`}
            strokeWidth="8"
            fill="transparent"
          />
          {/* Animated active stroke */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            stroke={accentColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 12px ${accentColor}80)`,
              transition: 'stroke-dashoffset 0.05s ease',
            }}
          />
        </svg>

        {/* Center Numbers */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="flex items-baseline justify-center">
            <span
              className="font-mono text-5xl md:text-6xl font-black tracking-tight"
              style={{
                color: '#ffffff',
                textShadow: `0 0 24px ${accentColor}60`,
              }}
            >
              {currentVal}
            </span>
            <span
              className="text-2xl md:text-3xl font-extrabold ml-1"
              style={{ color: accentColor }}
            >
              {suffix}
            </span>
          </div>
          <span
            className="text-[10px] font-mono tracking-widest font-extrabold mt-1 px-2.5 py-0.5 rounded border uppercase"
            style={{
              backgroundColor: `${accentColor}15`,
              color: accentColor,
              borderColor: `${accentColor}40`,
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* 2. Subtitle Description */}
      {subtitle && (
        <p className="relative z-10 max-w-sm text-center text-xs md:text-sm font-medium text-slate-400 leading-relaxed px-4">
          {subtitle}
        </p>
      )}
    </div>
  );
}
