import React from 'react';
import { Plus, Copy, Trash2, ChevronUp, ChevronDown, LayoutTemplate, Sparkles, Volume2, Mic } from 'lucide-react';
import { SlideThumbnail } from './editor/SlideThumbnail';
import { narrationStatus } from '../narration/editorState.js';

export function SlideSidebar({
  id,
  hidden = false,
  slides,
  aspectRatio = '16:9',
  activeSlideIndex,
  onSelectSlide,
  onAddSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onReorderSlides,
  onOpenTemplateModal,
  onOpenAiOutline,
}) {
  return (
    <aside id={id} hidden={hidden} aria-label="Slides" className="slides-sidebar w-56 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col h-[calc(100vh-3.5rem)] select-none transition-colors">
      {/* Header with Add Slide Button, AI Outline & Template Import */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
          Slides ({slides.length})
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onAddSlide(activeSlideIndex)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md border border-blue-200 dark:border-blue-800 transition"
            title="Add new blank slide"
          >
            <Plus size={14} />
            <span>Add slide</span>
          </button>
        </div>
      </div>

      {/* Slide Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {slides.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl my-4 text-xs text-slate-400">
            <p className="mb-2">No slides in presentation</p>
            {onOpenAiOutline && (
              <button
                onClick={onOpenAiOutline}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Sparkles size={13} />
                <span>AI Outline</span>
              </button>
            )}
          </div>
        )}
        {slides.map((slide, idx) => {
          const isActive = idx === activeSlideIndex;

          return (
            <div
              key={slide.id}
              onClick={() => onSelectSlide(idx)}
              className={`group relative rounded-xl border-2 transition-all cursor-pointer p-1.5 ${
                isActive
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                  {idx + 1}. {slide.title || 'Untitled'}
                </span>
                
                {/* Hover Quick Actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderSlides(idx, idx - 1);
                      }}
                      title="Move Up"
                      className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    >
                      <ChevronUp size={12} />
                    </button>
                  )}
                  {idx < slides.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReorderSlides(idx, idx + 1);
                      }}
                      title="Move Down"
                      className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                    >
                      <ChevronDown size={12} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSlide(idx);
                    }}
                    title="Duplicate Slide"
                    className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded"
                  >
                    <Copy size={12} />
                  </button>
                  {slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(idx);
                      }}
                      title="Delete Slide"
                      className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              <div className={`mx-auto rounded-md overflow-hidden border border-slate-200 dark:border-slate-800 ${aspectRatio === '9:16' ? 'w-20 aspect-[9/16]' : 'w-full aspect-video'}`}>
                <SlideThumbnail slide={slide} vertical={aspectRatio === '9:16'} />
              </div>
              <div className={`slide-voice-status ${narrationStatus(slide) === 'Voice ready' ? 'ready' : slide.narration?.asset_id ? 'stale' : ''}`}>
                <span>{narrationStatus(slide) === 'Voice ready' ? <Volume2 size={12} /> : <Mic size={11} />}{narrationStatus(slide)}</span>
                {narrationStatus(slide) === 'Voice ready' && <span>{(slide.narration.duration_ms / 1000).toFixed(1)}s</span>}
              </div>
        </div>
      );
    })}
      </div>
    </aside>
  );
}

