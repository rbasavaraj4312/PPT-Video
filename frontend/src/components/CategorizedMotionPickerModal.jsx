import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  Plus,
  Target,
  Type,
  Layers,
  TrendingUp,
  Swords,
  GitBranch,
  Network,
  Sun,
  Bookmark,
  ExternalLink,
  Film,
} from 'lucide-react';
import {
  FUNCTIONAL_CATEGORIES,
  FORMAT_OPTIONS,
  STYLE_PRESETS,
  SOURCE_LIBRARIES,
  filterMotionItems,
} from '../motion/registry/categories';
import { MOTION_REGISTRY, getDefaultVariables } from '../motion/registry';

// Icon mapping
const CATEGORY_ICONS = {
  Sparkles,
  Target,
  Type,
  Layers,
  TrendingUp,
  Swords,
  GitBranch,
  Network,
  Sun,
  Bookmark,
};

export function CategorizedMotionPickerModal({ isOpen, onClose, onInsertComponent }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtered components
  const filteredItems = useMemo(() => {
    return filterMotionItems(MOTION_REGISTRY, {
      category: selectedCategory,
      format: selectedFormat,
      style: selectedStyle,
      source: selectedSource,
      searchQuery,
    });
  }, [selectedCategory, selectedFormat, selectedStyle, selectedSource, searchQuery]);

  if (!isOpen) return null;

  const handleInsert = (item) => {
    const defaultVars = getDefaultVariables(item);
    const width = item.defaultDimensions?.width || 380;
    const height = item.defaultDimensions?.height || 220;

    onInsertComponent({
      type: 'motion_component',
      width,
      height,
      component_id: item.id,
      motion_data: {
        component_id: item.id,
        custom_vars: defaultVars,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-5xl h-[86vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* 1. Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Motion Components & Recipe Catalog
              </h2>
              <p className="text-xs text-slate-400">
                Curated kinetic blocks from React Bits, Aceternity UI, Remocn & Video-Shotcraft
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Filter Bar */}
        <div className="flex flex-col gap-3 px-6 py-3 border-b border-slate-800 bg-slate-950/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, tag, or library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            {/* Format Pills */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {FORMAT_OPTIONS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id)}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    selectedFormat === fmt.id
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>

            {/* Source Library Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {SOURCE_LIBRARIES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Functional Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
            {FUNCTIONAL_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon] || Sparkles;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-cyan-500/15 border border-cyan-500/50 text-cyan-300 font-semibold shadow-sm'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <Search className="w-12 h-12 mb-3 stroke-1 text-slate-600" />
              <p className="text-base font-semibold text-slate-300">No matching motion components found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Try clearing your search query or selecting a different category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const MotionComponent = item.component;
                const defaultProps = getDefaultVariables(item);

                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col justify-between bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-cyan-950/20"
                  >
                    {/* Live Motion Preview Canvas */}
                    <div className="relative h-44 bg-slate-950/90 border-b border-slate-800/80 overflow-hidden flex items-center justify-center p-3">
                      <div className="w-full h-full transform scale-[0.85] origin-center pointer-events-none">
                        <MotionComponent {...defaultProps} />
                      </div>

                      {/* Source library badge */}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900/90 border border-slate-700/80 text-cyan-300 shadow">
                        {item.sourceLibrary}
                      </span>

                      {/* Format badge */}
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/90 border border-slate-700/80 text-slate-300 shadow">
                        {item.aspectRatio === '9:16' ? '9:16 Reel' : item.aspectRatio === '16:9' ? '16:9 Video' : 'Flexible'}
                      </span>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Variables Pill Count */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/70 text-slate-400">
                            {item.variableSchema?.length || 0} Dynamic Vars
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/70 text-slate-400 capitalize">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleInsert(item)}
                        className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Insert Onto Slide</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
