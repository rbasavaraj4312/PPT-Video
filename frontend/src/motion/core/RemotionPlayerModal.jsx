import React, { useMemo } from 'react';
import { Player } from '@remotion/player';
import { X, Film, Maximize2, Sparkles, Layers } from 'lucide-react';
import { RemotionPresentationComposition } from './RemotionRoot';
import { NarratedComposition } from '../../narration/NarratedComposition';
import { buildTimeline, needsAnimatedExport, narrationReady } from '../../narration/timeline';
import { speechUrl } from '../../services/speech';

export function RemotionPlayerModal({ isOpen, onClose, presentation }) {
  const slides = Array.isArray(presentation?.slides) ? presentation.slides : [];
  const narrated = needsAnimatedExport(presentation);
  const fps = 30;
  const isVertical = String(presentation?.aspect_ratio || '').trim() === '9:16';

  const compositionWidth = isVertical ? 720 : 1280;
  const compositionHeight = isVertical ? 1280 : 720;

  // Calculate total frames from all slides
  const totalFrames = useMemo(() => {
    if (narrated) return buildTimeline(presentation, fps).totalFrames;
    if (slides.length === 0) return 30;
    const totalSec = slides.reduce((acc, s) => {
      const dur = Math.max(1, parseFloat(s.slide_duration) || 3);
      return acc + dur;
    }, 0);
    return Math.max(30, Math.round(totalSec * fps));
  }, [slides, fps, narrated, presentation]);

  const totalDurationSec = (totalFrames / fps).toFixed(1);
  if (!isOpen || !presentation) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* 1. Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {slides.some(slide => slide.narration?.script?.trim()) ? 'Narration & Caption Preview' : 'Motion Video Preview'}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {isVertical ? '9:16 Vertical Reel' : '16:9 Landscape Video'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {slides.length} slides • {totalDurationSec}s total duration • 30 FPS deterministic timeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Player Viewport Container */}
        <div className="flex-1 bg-black/95 flex items-center justify-center p-4 overflow-hidden">
          <div
            className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-800"
            style={{
              aspectRatio: isVertical ? '9 / 16' : '16 / 9',
              maxHeight: '100%',
              maxWidth: '100%',
              width: isVertical ? 'auto' : '100%',
              height: isVertical ? '100%' : 'auto',
            }}
          >
            <Player
              component={narrated ? NarratedComposition : RemotionPresentationComposition}
              inputProps={{ presentation, assetBase: speechUrl('/assets') }}
              durationInFrames={totalFrames}
              compositionWidth={compositionWidth}
              compositionHeight={compositionHeight}
              fps={fps}
              style={{
                width: '100%',
                height: '100%',
              }}
              controls
              autoPlay
              loop={false}
            />
          </div>
        </div>

        {/* 3. Footer Bar with Tips */}
        {narrated && slides.some(s => s.narration?.script?.trim() && !narrationReady(s.narration)) &&
          <p className="px-6 py-2 text-xs text-amber-300">Some narration is missing or outdated. Generate those slides before exporting.</p>}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Real-time frame scrubbing, spring physics, and dynamic variable interpolation are active.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span>Powered by Remotion 4.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
