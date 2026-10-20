import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  Layers, 
  Tv, 
  Smartphone, 
  PlusCircle, 
  ArrowRight, 
  RefreshCw,
  Check,
  LayoutTemplate,
  Crosshair,
  Clock,
  Compass,
  Zap
} from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'focus', label: 'Spotlight' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'cinematic', label: 'Camera Pan' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'reels', label: '9:16 Reels' },
];

/**
 * Clones template slides with fresh unique IDs while safely preserving
 * multi-slide morph_id pairings within the template.
 */
export function cloneTemplateSlides(slides, templateAspectRatio = null) {
  const morphIdMap = {}; // old pairing key -> new unique morph_id
  const slideIdPrefix = Date.now().toString(36);

  // Detect element IDs that appear on more than one slide in the template
  const idCounts = {};
  slides.forEach((slide) => {
    (slide.elements || []).forEach((el) => {
      if (el.id) idCounts[el.id] = (idCounts[el.id] || 0) + 1;
    });
  });

  return slides.map((slide, sIdx) => {
    const newSlideId = `s-${slideIdPrefix}-${sIdx}-${Math.random().toString(36).substring(2, 6)}`;
    const clonedElements = (slide.elements || []).map((el, eIdx) => {
      const newElId = `el-${slideIdPrefix}-${sIdx}-${eIdx}-${Math.random().toString(36).substring(2, 6)}`;
      let newMorphId = null;

      // Pair either by explicit morph_id or by template element ID shared across slides
      const pairingKey = el.morph_id || (el.id && idCounts[el.id] > 1 ? el.id : null);
      if (pairingKey) {
        if (!morphIdMap[pairingKey]) {
          morphIdMap[pairingKey] = `morph-${slideIdPrefix}-${Math.random().toString(36).substring(2, 7)}`;
        }
        newMorphId = morphIdMap[pairingKey];
      }

      return {
        ...el,
        id: newElId,
        morph_id: newMorphId,
      };
    });

    return {
      ...slide,
      id: newSlideId,
      transition_type: slide.transition_type || 'morph',
      aspect_ratio: slide.aspect_ratio || templateAspectRatio || '16:9',
      elements: clonedElements,
    };
  });
}

export function TemplateImportModal({
  isOpen,
  onClose,
  templates = [],
  activeSlideIndex = 0,
  onImportSlides, // (slides, mode = 'append' | 'insert_after' | 'replace', template) => void
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [importMode, setImportMode] = useState('insert_after'); // 'append' | 'insert_after' | 'replace'

  if (!isOpen) return null;

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = (t.name || '').toLowerCase().includes(q);
      const matchesDesc = (t.description || '').toLowerCase().includes(q);
      if (!matchesName && !matchesDesc) return false;
    }
    return true;
  });

  const activeTpl = (selectedTemplate && filteredTemplates.some((t) => t.id === selectedTemplate.id))
    ? selectedTemplate
    : filteredTemplates[0] || null;

  const handleConfirmImport = () => {
    try {
      if (!activeTpl || !activeTpl.slides || activeTpl.slides.length === 0) return;
      const clonedSlides = cloneTemplateSlides(activeTpl.slides, activeTpl.aspect_ratio);
      onImportSlides(clonedSlides, importMode, activeTpl);
      onClose();
    } catch (err) {
      console.error('Failed to import template slides:', err);
      alert(`Import error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <LayoutTemplate size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Import Pre-Defined Template
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose a multi-slide sequence with built-in vector animations and import into your presentation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedTemplate(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content Body: Split Left (List) & Right (Preview / Options) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Template Catalog List */}
          <div className="w-1/2 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-2.5">
            {filteredTemplates.map((tpl) => {
              const isSelected = activeTpl?.id === tpl.id;
              const is916 = tpl.aspect_ratio === '9:16';
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer select-none ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tpl.name}
                    </h4>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      is916
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}>
                      {is916 ? '9:16 Reel' : '16:9'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {tpl.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Layers size={11} />
                      {tpl.slide_count || tpl.slides?.length || 1} slides
                    </span>
                    <span>•</span>
                    <span className="capitalize">{tpl.category}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Template Preview & Import Mode */}
          <div className="w-1/2 flex flex-col justify-between overflow-y-auto p-5 bg-slate-50/40 dark:bg-slate-900/40">
            {activeTpl ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeTpl.name}
                    </h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                      {activeTpl.slide_count || activeTpl.slides?.length} Slides Sequence
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeTpl.description}
                  </p>
                </div>

                {/* Slides Overview Sequence */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Sequence Preview
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(activeTpl.slides || []).map((s, idx) => (
                      <div
                        key={s.id || idx}
                        className="rounded-lg p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex flex-col justify-between h-20 shadow-xs"
                      >
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">
                          Slide {idx + 1}
                        </span>
                        <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200 truncate" title={s.title}>
                          {s.title || 'Untitled'}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {s.elements?.length || 0} elements
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Import Mode Options */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Import Destination
                  </div>
                  <div className="space-y-2">
                    {/* Insert After Active Slide */}
                    <label
                      onClick={() => setImportMode('insert_after')}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        importMode === 'insert_after'
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'insert_after'}
                        onChange={() => setImportMode('insert_after')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Insert After Current Slide (Slide {activeSlideIndex + 1})
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Inserts the {activeTpl.slides?.length} slides directly where you are currently editing.
                        </div>
                      </div>
                    </label>

                    {/* Append to End */}
                    <label
                      onClick={() => setImportMode('append')}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        importMode === 'append'
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Append to End
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Adds all slides to the very end of your current presentation.
                        </div>
                      </div>
                    </label>

                    {/* Replace Presentation */}
                    <label
                      onClick={() => setImportMode('replace')}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        importMode === 'replace'
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="mt-0.5 text-rose-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          Replace Entire Presentation
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Overwrites all existing slides with this template.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                disabled={!activeTpl}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                <Sparkles size={14} />
                <span>Import {activeTpl?.slides?.length || 1} Slides</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
