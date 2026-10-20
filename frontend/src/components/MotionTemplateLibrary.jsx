import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Sparkles, 
  Plus, 
  Layers, 
  Zap, 
  Radio, 
  Square, 
  CircleDot,
  Code2,
  Sliders,
  Filter
} from 'lucide-react';
import { MotionTemplateCard } from './MotionTemplateCard';
import { MotionTemplateEditorModal } from './MotionTemplateEditorModal';

const CATEGORIES = [
  { id: 'all', label: 'All Motion Templates', icon: Layers },
  { id: 'cards', label: 'HUD & Feature Cards', icon: Square },
  { id: 'metrics', label: 'Metrics & Counters', icon: Zap },
  { id: 'ambient', label: 'Ambient Backgrounds', icon: CircleDot },
  { id: 'clash', label: 'Versus & Comparison', icon: Radio },
  { id: 'badges', label: 'Pills & Badges', icon: Sparkles },
  { id: 'general', label: 'General', icon: Layers },
];

export function MotionTemplateLibrary({
  motionTemplates = [],
  onUseTemplate,
  onSaveTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  canInsert = false,
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return motionTemplates.filter((tpl) => {
      // 1. Category Filter
      if (selectedCategory !== 'all' && tpl.category !== selectedCategory) {
        return false;
      }

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (tpl.name || '').toLowerCase().includes(q);
        const matchesDesc = (tpl.description || '').toLowerCase().includes(q);
        const matchesCode = (tpl.code || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCode) return false;
      }

      return true;
    });
  }, [motionTemplates, selectedCategory, searchQuery]);

  // Open modal for new template
  const handleCreateNew = () => {
    setEditingTemplate(null);
    setIsEditorModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (tpl) => {
    setEditingTemplate(tpl);
    setIsEditorModalOpen(true);
  };

  // Duplicate template
  const handleDuplicate = (tpl) => {
    if (onDuplicateTemplate) {
      onDuplicateTemplate(tpl);
    } else if (onSaveTemplate) {
      const duplicated = {
        ...tpl,
        id: `mot-${Date.now()}`,
        name: `${tpl.name} (Copy)`,
        is_builtin: false,
      };
      onSaveTemplate(duplicated);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans select-none">
      {/* Top Banner / Hero Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-5 shrink-0 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles size={18} />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Motion Template Management
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage animated HTML + CSS templates with full code in one container and pure custom variables.
            </p>
          </div>

          {/* Search bar & + New Motion Template Button */}
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search motion templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition active:scale-[0.98]"
            >
              <Plus size={15} />
              <span>+ New Motion Template</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 mt-5 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count = cat.id === 'all'
              ? motionTemplates.length
              : motionTemplates.filter((t) => t.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon size={13} />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Motion Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTemplates.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
              <Sparkles size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
              No motion templates found
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mb-4">
              {searchQuery
                ? `No motion templates matching "${searchQuery}".`
                : 'Create your first custom HTML + CSS animated template with custom variables.'}
            </p>
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              + Create New Motion Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-150">
            {filteredTemplates.map((template) => (
              <MotionTemplateCard
                key={template.id}
                template={template}
                onUseTemplate={onUseTemplate}
                onEditTemplate={handleEdit}
                onDuplicateTemplate={handleDuplicate}
                onDeleteTemplate={onDeleteTemplate}
                canInsert={canInsert}
              />
            ))}
          </div>
        )}
      </div>

      {/* Motion Template Editor Modal */}
      {isEditorModalOpen && (
        <MotionTemplateEditorModal
          isOpen={isEditorModalOpen}
          onClose={() => setIsEditorModalOpen(false)}
          template={editingTemplate}
          onDeleteTemplate={(id) => {
            onDeleteTemplate?.(id);
            setIsEditorModalOpen(false);
          }}
          onSave={async (savedTemplate) => {
            await onSaveTemplate?.(savedTemplate);
            setIsEditorModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
