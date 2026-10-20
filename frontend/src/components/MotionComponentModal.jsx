import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  Radio, 
  Square, 
  CircleDot,
  Plus, 
  Layers,
  Search,
  Code2
} from 'lucide-react';
import { 
  MOTION_ACTION_CATEGORIES,
  getAllMotionComponents
} from '../data/motionComponentsCatalog';
import { MotionWidget } from './MotionWidgets/MotionWidget';

export function MotionComponentModal({
  isOpen,
  onClose,
  onInsertComponent,
  onOpenCodeEditor,
  motionTemplates = null,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allComponents = useMemo(() => {
    if (motionTemplates && motionTemplates.length > 0) {
      return motionTemplates;
    }
    return getAllMotionComponents();
  }, [isOpen, motionTemplates]);

  if (!isOpen) return null;

  const filteredComponents = allComponents.filter((comp) => {
    if (selectedCategory !== 'all' && comp.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (comp.name || '').toLowerCase().includes(q);
      const matchDesc = (comp.description || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
                <Sparkles size={16} />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Insert Motion Template
              </h2>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border border-cyan-300/30">
                UNIFIED HTML + CSS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select an animated Remotion-style template with pure custom variables to place onto this slide.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCodeEditor?.(null);
              }}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition active:scale-[0.98]"
            >
              <Code2 size={14} />
              <span>+ Create Custom Template</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Action Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {MOTION_ACTION_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
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

        {/* Component Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredComponents.map((comp) => {
            const width = comp.width || comp.defaultWidth || 420;
            const height = comp.height || comp.defaultHeight || 220;

            return (
              <div
                key={comp.id}
                className="group relative bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3.5 flex flex-col justify-between hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all duration-200 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1"
              >
                <div>
                  {/* Category Action Tag */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-xs bg-indigo-500/15 text-indigo-400 border-indigo-500/30">
                      {comp.category || 'cards'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {width} × {height}
                    </span>
                  </div>

                  {/* Live Mini Preview Box */}
                  <div className="w-full h-44 rounded-xl overflow-hidden mb-3 border border-white/10 shadow-inner bg-slate-950 flex items-center justify-center p-2 relative group-hover:border-cyan-500/30 transition-colors">
                    <div className="w-full h-full flex items-center justify-center pointer-events-none">
                      <MotionWidget
                        element={{
                          id: `preview-${comp.id}`,
                          type: 'motion_component',
                          motion_data: {
                            component_id: comp.id,
                            name: comp.name,
                            category: comp.category,
                            code: comp.code,
                            custom_vars: comp.custom_vars,
                          },
                        }}
                        isPreview={true}
                      />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-blue-500 dark:group-hover:text-cyan-400 transition-colors">
                    {comp.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {comp.description || 'Custom HTML & CSS motion template with custom variables.'}
                  </p>
                </div>

                {/* Insert Button */}
                <button
                  type="button"
                  onClick={() => {
                    onInsertComponent(comp);
                    onClose();
                  }}
                  className="mt-3.5 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/35 active:scale-[0.98]"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Insert on Slide</span>
                </button>
              </div>
            );
          })}

          {filteredComponents.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500">
              <Sparkles size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No motion templates found</p>
              <p className="text-xs opacity-75 mt-0.5">Try searching with a different keyword</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
