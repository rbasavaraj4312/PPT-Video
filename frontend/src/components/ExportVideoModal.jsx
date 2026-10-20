import React, { useState } from 'react';
import { buildTimeline, needsAnimatedExport } from '../narration/timeline';
import { 
  X, 
  Film, 
  Loader2, 
  Monitor, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Clock, 
  Layers, 
  Download
} from 'lucide-react';

const RESOLUTIONS_16_9 = [
  {
    id: '1080p',
    name: '1080p Full HD',
    dimensions: '1920 × 1080',
    description: 'Crisp vector rendering. Ideal for YouTube, presentations & displays.',
    badge: 'Recommended',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
  },
  {
    id: '720p',
    name: '720p HD',
    dimensions: '1280 × 720',
    description: 'Faster rendering with smaller file size. Great for email & messaging.',
    badge: 'Fast',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
  },
  {
    id: '4k',
    name: '4K Ultra HD',
    dimensions: '3840 × 2160',
    description: 'Ultra high resolution with razor-sharp anti-aliased vector typography.',
    badge: 'Maximum Quality',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
  },
  {
    id: '480p',
    name: '480p SD',
    dimensions: '854 × 480',
    description: 'Quick draft preview with smallest file footprint.',
  },
];

const RESOLUTIONS_9_16 = [
  {
    id: '1080p',
    name: '1080p Full HD Vertical',
    dimensions: '1080 × 1920',
    description: 'Crisp 9:16 vertical video. Perfect for Instagram Reels, Shorts & TikTok.',
    badge: 'Recommended',
    badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300',
  },
  {
    id: '720p',
    name: '720p HD Vertical',
    dimensions: '720 × 1280',
    description: 'Fast mobile export with compact file footprint.',
    badge: 'Fast',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
  },
  {
    id: '4k',
    name: '4K Ultra HD Vertical',
    dimensions: '2160 × 3840',
    description: 'Ultra high-definition vertical video with razor-sharp vector graphics.',
    badge: 'Maximum Quality',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300',
  },
  {
    id: '480p',
    name: '480p SD Vertical',
    dimensions: '480 × 854',
    description: 'Quick draft preview for vertical reels.',
  },
];

const FRAME_RATES = [
  {
    fps: 30,
    label: '30 FPS',
    tag: 'Recommended',
    description: 'Smooth animation, balanced rendering time & file size',
  },
  {
    fps: 60,
    label: '60 FPS',
    tag: 'Ultra Smooth',
    description: 'Silky smooth morph transitions for high-refresh screens',
  },
  {
    fps: 24,
    label: '24 FPS',
    tag: 'Cinematic',
    description: 'Classic film cadence, quickest export duration',
  },
];

const PACING_OPTIONS = [
  {
    id: 'default',
    label: 'Slide Settings (3.0s)',
    tag: 'Normal',
    description: 'Uses display duration set on each slide',
  },
  {
    id: '1.5',
    label: 'Fluid Pacing (1.5s)',
    tag: 'Recommended',
    description: 'Dynamic flow with shorter pause between morphs',
  },
  {
    id: '1.0',
    label: 'Fast Motion (1.0s)',
    tag: 'Quick',
    description: 'Rapid continuous animation with minimal delay',
  },
];

export function ExportVideoModal({
  isOpen,
  onClose,
  presentation,
  onExport,
  isExporting,
  exportProgress = '',
}) {
  const [resolution, setResolution] = useState('1080p');
  const [fps, setFps] = useState(60);
  const [pacing, setPacing] = useState('1.5');
  const [error, setError] = useState(null);

  const is916 = presentation?.aspect_ratio === '9:16';
  const resolutions = is916 ? RESOLUTIONS_9_16 : RESOLUTIONS_16_9;

  if (!isOpen) return null;

  // Calculate approximate duration based on selected pacing
  const slides = presentation?.slides || [];
  const hasNarration = slides.some(slide => slide.narration?.script?.trim());
  const isAnimated = needsAnimatedExport(presentation);
  const outputResolution = isAnimated ? '1080p' : resolution;
  const outputFps = isAnimated ? 30 : fps;
  const slideCount = slides.length;
  const effectiveHold = isAnimated || pacing === 'default' ? null : parseFloat(pacing);
  let totalSeconds = 0;
  slides.forEach((s, idx) => {
    totalSeconds += effectiveHold !== null ? effectiveHold : Number(s.slide_duration || 3.0);
    if (idx < slideCount - 1 && s.transition_type !== 'none') {
      totalSeconds += Number(s.transition_duration ?? 1.0);
    }
  });
  if (isAnimated) totalSeconds = buildTimeline(presentation, outputFps).totalFrames / outputFps;

  const handleStartExport = async () => {
    setError(null);
    try {
      await onExport({ 
        resolution: outputResolution,
        fps: outputFps,
        slide_duration: effectiveHold 
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Export failed. Please try again.');
    }
  };

  const selectedResObj = resolutions.find((r) => r.id === outputResolution) || resolutions[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] transition-all animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-video-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
              is916
                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400'
                : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
            }`}>
              <Film size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="export-video-title" className="text-base font-bold text-slate-900 dark:text-white">
                  Export MP4 Video
                </h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  is916
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300'
                }`}>
                  {is916 ? '9:16 Vertical Reel' : '16:9 Landscape'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAnimated ? (hasNarration ? 'Export video with voice narration, captions and transitions' : 'Export animated motion components and slide transitions')
                  : is916
                    ? `Render ${outputFps} FPS vertical video optimized for Reels, TikTok & Shorts`
                    : `Render ${outputFps} FPS widescreen video for YouTube, presentations & displays`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {error && (
            <div role="alert" className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {isAnimated && <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 text-sm">
            {hasNarration ? 'Voice narration and enabled captions are included.' : 'Motion components and slide transitions are animated.'} Output: {selectedResObj.dimensions} at 30 FPS.
            Slide lengths follow your {hasNarration ? 'narration and ' : ''}timing settings.
          </div>}

          {!isAnimated && <>
          {/* 1. Resolution Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Resolution Quality</span>
              <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">
                Target: {selectedResObj.dimensions}
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {resolutions.map((item) => {
                const isSelected = resolution === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isExporting}
                    onClick={() => setResolution(item.id)}
                    className={`relative text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {item.name}
                        {isSelected && <CheckCircle2 size={15} className="text-indigo-600 dark:text-indigo-400" />}
                      </span>
                      {item.badge && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                      {item.dimensions}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {item.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Frame Rate (FPS) Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              Frame Rate (FPS)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {FRAME_RATES.map((item) => {
                const isSelected = fps === item.fps;
                return (
                  <button
                    key={item.fps}
                    type="button"
                    disabled={isExporting}
                    onClick={() => setFps(item.fps)}
                    className={`text-center p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                      {item.label}
                      {isSelected && <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <div className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                      {item.tag}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Slide Pacing & Timing */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Slide Pacing (Hold Time)</span>
              <span className="text-slate-400 dark:text-slate-500 font-normal normal-case">
                Pause between morphs
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {PACING_OPTIONS.map((item) => {
                const isSelected = pacing === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isExporting}
                    onClick={() => setPacing(item.id)}
                    className={`text-center p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1 text-xs">
                      {item.label}
                      {isSelected && <CheckCircle2 size={13} className="text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {item.description}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">
              💡 Why videos pause between slides: Each slide holds static so viewers have time to read, before morphing to the next slide. For continuous active animation without long pauses, choose <strong>Fluid Pacing (1.5s)</strong> or <strong>Fast Motion (1.0s)</strong>.
            </p>
          </div>

          </>}

          {/* 4. Export Summary */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="grid grid-cols-3 gap-3 text-center divide-x divide-slate-200 dark:divide-slate-700">
              <div className="flex flex-col items-center">
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-0.5">
                  <Layers size={13} /> Slides
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {slideCount} slides
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-0.5">
                  <Clock size={13} /> Est. Duration
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  ~{totalSeconds.toFixed(1)}s
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-0.5">
                  <Zap size={13} /> Output Format
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  H.264 MP4
                </span>
              </div>
            </div>
          </div>

          {/* Rendering Notice if exporting */}
          {isExporting && (
            <div className="bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-center gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold text-indigo-900 dark:text-indigo-200">
                  {exportProgress || `Rendering ${selectedResObj.name} @ ${outputFps} FPS...`}
                </div>
                <div className="text-indigo-700 dark:text-indigo-400 mt-0.5">
                  Generating morph transitions and encoding video. Download will start automatically when ready.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl disabled:opacity-40 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleStartExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-60 rounded-xl shadow-sm transition"
          >
            {isExporting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Export {outputResolution.toUpperCase()} MP4</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
