import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  Tv, 
  Smartphone, 
  Layers, 
  Compass, 
  Clock, 
  Zap, 
  Crosshair,
  Filter,
  Plus,
  LayoutTemplate,
  Sun,
  Moon
} from 'lucide-react';
import { TemplateCard } from './TemplateCard';

const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: Layers },
  { id: 'focus', label: 'Spotlight & Focus', icon: Crosshair },
  { id: 'timeline', label: 'Timelines & Roadmaps', icon: Clock },
  { id: 'cinematic', label: 'Cinematic Camera', icon: Compass },
  { id: 'architecture', label: 'Architecture & Flows', icon: Zap },
  { id: 'reels', label: '9:16 Mobile Reels', icon: Smartphone },
];

export function TemplateLibrary({
  templates = [],
  onUseTemplate,
  onCreateTemplate,
  onEditSlides,
  onEditDetails,
  onDuplicateTemplate,
  onDeleteTemplate,
  theme,
  toggleTheme,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('all'); // 'all' | '16:9' | '9:16'
  const [searchQuery, setSearchQuery] = useState('');

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && tpl.category !== selectedCategory) {
        return false;
      }

      // 2. Aspect Ratio Filter
      if (selectedAspectRatio !== 'all' && tpl.aspect_ratio !== selectedAspectRatio) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (tpl.name || '').toLowerCase().includes(q);
        const matchesDesc = (tpl.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }

      return true;
    });
  }, [templates, selectedCategory, selectedAspectRatio, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none">
      {/* Top Banner / Hero Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 shrink-0 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                <LayoutTemplate size={18} />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Pre-Defined Template Library
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse cinematic multi-slide sequences with coordinated vector morphs, dynamic timelines, and spotlight walkthroughs.
            </p>
          </div>

          {/* Search bar & format toggle */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Format Filter */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSelectedAspectRatio('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  selectedAspectRatio === 'all'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedAspectRatio('16:9')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  selectedAspectRatio === '16:9'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Tv size={12} />
                <span>16:9</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedAspectRatio('9:16')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                  selectedAspectRatio === '9:16'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Smartphone size={12} />
                <span>9:16</span>
              </button>
            </div>

            {onCreateTemplate && (
              <button
                type="button"
                onClick={onCreateTemplate}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition shrink-0"
                title="Create a new multi-slide template"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Template</span>
              </button>
            )}

            {toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {filteredTemplates.length} {filteredTemplates.length === 1 ? 'Template' : 'Templates'} Available
          </span>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-4">
              <LayoutTemplate size={30} />
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
              No templates match your criteria
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mb-4">
              Try adjusting your search query or selecting a different category filter.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedAspectRatio('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredTemplates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                template={tpl}
                onUseTemplate={onUseTemplate}
                onEditSlides={onEditSlides}
                onEditDetails={onEditDetails}
                onDuplicateTemplate={onDuplicateTemplate}
                onDeleteTemplate={onDeleteTemplate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
