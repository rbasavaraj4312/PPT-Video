import React, { useState } from 'react';
import { 
  Layers, 
  Tv, 
  Smartphone, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Play, 
  Check,
  Zap,
  Clock,
  Compass,
  Crosshair,
  Edit3,
  MoreVertical,
  Copy,
  Sliders
} from 'lucide-react';

const CATEGORY_META = {
  focus: {
    label: 'Focus & Walkthrough',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300',
    icon: Crosshair,
  },
  timeline: {
    label: 'Timeline & Roadmap',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    icon: Clock,
  },
  cinematic: {
    label: 'Cinematic Motion',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300',
    icon: Compass,
  },
  architecture: {
    label: 'Architecture & Flow',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300',
    icon: Zap,
  },
  reels: {
    label: '9:16 Mobile Reel',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
    icon: Smartphone,
  },
  general: {
    label: 'General',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    icon: Layers,
  },
};

export function TemplateCard({
  template,
  onUseTemplate,
  onEditSlides,
  onEditDetails,
  onDuplicateTemplate,
  onDeleteTemplate,
}) {
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const slides = template.slides || [];
  const slideCount = template.slide_count || slides.length || 1;
  const is916 = template.aspect_ratio === '9:16';
  const catMeta = CATEGORY_META[template.category] || CATEGORY_META.general;
  const CatIcon = catMeta.icon;

  const currentSlide = slides[activePreviewIndex] || slides[0] || {};
  const currentElements = currentSlide.elements || [];

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden select-none">
      {/* Top Visual Mockup Preview */}
      <div 
        className="relative bg-slate-950 p-3 flex items-center justify-center overflow-hidden"
        style={{ height: is916 ? '240px' : '180px' }}
      >
        {/* Slide Canvas Mockup */}
        <div
          className="relative rounded-lg shadow-md overflow-hidden transition-all duration-300 flex items-center justify-center border border-slate-800"
          style={{
            width: is916 ? '120px' : '92%',
            height: is916 ? '95%' : '90%',
            backgroundColor: currentSlide.background || '#0f172a',
          }}
        >
          {/* Miniature Element Wireframes */}
          <div className="absolute inset-0 p-2 pointer-events-none overflow-hidden">
            {currentElements.slice(0, 10).map((el, idx) => {
              const canvasW = is916 ? 720 : 1280;
              const canvasH = is916 ? 1280 : 720;
              const leftPct = (el.x / canvasW) * 100;
              const topPct = (el.y / canvasH) * 100;
              const widthPct = (el.width / canvasW) * 100;
              const heightPct = (el.height / canvasH) * 100;

              return (
                <div
                  key={el.id || idx}
                  className="absolute rounded-xs transition-all duration-300"
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${Math.max(4, widthPct)}%`,
                    height: `${Math.max(2, heightPct)}%`,
                    backgroundColor: el.fill || el.stroke || '#38bdf8',
                    opacity: el.opacity !== undefined ? el.opacity : 0.7,
                  }}
                />
              );
            })}
          </div>

          {/* Slide Indicator Badge */}
          <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono text-slate-300">
            {activePreviewIndex + 1}/{slideCount}
          </div>
        </div>

        {/* Multi-Slide Navigation Arrows */}
        {slideCount > 1 && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePreviewIndex((prev) => (prev > 0 ? prev - 1 : slideCount - 1));
              }}
              className="p-1 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 shadow-md backdrop-blur-xs"
              title="Previous slide preview"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActivePreviewIndex((prev) => (prev < slideCount - 1 ? prev + 1 : 0));
              }}
              className="p-1 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 shadow-md backdrop-blur-xs"
              title="Next slide preview"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Aspect Ratio Badge Top Left */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            is916
              ? 'bg-rose-500/90 text-white'
              : 'bg-indigo-600/90 text-white'
          }`}>
            {is916 ? <Smartphone size={10} /> : <Tv size={10} />}
            <span>{is916 ? '9:16 Reel' : '16:9 Video'}</span>
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/90 text-slate-300 backdrop-blur-xs">
            <Layers size={10} />
            <span>{slideCount} {slideCount === 1 ? 'Slide' : 'Slides'}</span>
          </span>
        </div>

        {/* Top-Right Action Cluster: Quick Edit + More Menu */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-20">
          {onEditSlides && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditSlides(template);
              }}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-blue-600 text-slate-300 hover:text-white transition shadow-sm backdrop-blur-xs"
              title="Edit Template Slides in Studio"
            >
              <Edit3 size={12} />
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white transition shadow-sm backdrop-blur-xs"
              title="Template Options"
            >
              <MoreVertical size={12} />
            </button>

            {isMenuOpen && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 z-30 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
              >
                {onEditSlides && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEditSlides(template);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Edit3 size={13} className="text-blue-500" />
                    <span>Edit Slides in Studio</span>
                  </button>
                )}

                {onEditDetails && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEditDetails(template);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Sliders size={13} className="text-purple-500" />
                    <span>Edit Metadata...</span>
                  </button>
                )}

                {onDuplicateTemplate && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDuplicateTemplate(template);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Copy size={13} className="text-emerald-500" />
                    <span>Duplicate Template</span>
                  </button>
                )}

                {onDeleteTemplate && (
                  <>
                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDeleteTemplate(template.id);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 font-medium"
                    >
                      <Trash2 size={13} />
                      <span>Delete Template</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Info Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category Tag */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${catMeta.badgeClass}`}>
              <CatIcon size={11} />
              <span>{catMeta.label}</span>
            </span>
            {template.is_builtin && (
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                • Built-in
              </span>
            )}
          </div>

          {/* Template Title */}
          <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {template.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {template.description || 'Pre-configured multi-slide sequence with 60 FPS vector morph animations.'}
          </p>
        </div>

        {/* Slide Dots Indicator & Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {/* Mini Slide Dots */}
          <div className="flex items-center gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActivePreviewIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  activePreviewIndex === i
                    ? 'w-4 bg-blue-600 dark:bg-blue-400'
                    : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                }`}
                title={`Preview slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Use, Edit & Delete Action Buttons */}
          <div className="flex items-center gap-1.5">
            {onDeleteTemplate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTemplate(template.id);
                }}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 transition"
                title="Delete Template"
              >
                <Trash2 size={13} />
              </button>
            )}

            {onEditSlides && (
              <button
                type="button"
                onClick={() => onEditSlides(template)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                title="Edit template slides and morph animations"
              >
                <Edit3 size={12} />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onUseTemplate(template)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <Sparkles size={13} />
              <span>Use</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
