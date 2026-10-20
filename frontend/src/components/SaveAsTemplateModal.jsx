import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  LayoutTemplate, 
  Tv, 
  Smartphone, 
  Crosshair, 
  Clock, 
  Compass, 
  Zap, 
  Layers,
  Check
} from 'lucide-react';

const CATEGORIES = [
  { id: 'focus', label: 'Spotlight & Focus', icon: Crosshair, color: 'text-cyan-500' },
  { id: 'timeline', label: 'Timelines & Roadmaps', icon: Clock, color: 'text-emerald-500' },
  { id: 'cinematic', label: 'Cinematic Camera', icon: Compass, color: 'text-purple-500' },
  { id: 'architecture', label: 'Architecture & Flows', icon: Zap, color: 'text-blue-500' },
  { id: 'reels', label: '9:16 Mobile Reels', icon: Smartphone, color: 'text-rose-500' },
  { id: 'general', label: 'General Decks', icon: Layers, color: 'text-amber-500' },
];

export function SaveAsTemplateModal({
  isOpen,
  onClose,
  presentation,
  onSaveAsTemplate, // (templateData) => Promise
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const aspectRatio = presentation?.aspect_ratio || '16:9';
  const slideCount = presentation?.slides?.length || 0;

  useEffect(() => {
    if (presentation) {
      setName(presentation.title ? `${presentation.title} Template` : 'My Custom Template');
      setDescription('');
      setCategory(aspectRatio === '9:16' ? 'reels' : 'general');
    }
    setError(null);
  }, [presentation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a template title');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Deep clone presentation slides
      const clonedSlides = JSON.parse(JSON.stringify(presentation?.slides || []));

      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
      const templateData = {
        id: `tpl-custom-${uuid}`,
        name: name.trim(),
        description: description.trim(),
        category,
        aspect_ratio: aspectRatio,
        slide_count: clonedSlides.length,
        slides: clonedSlides,
        is_builtin: false,
      };

      await onSaveAsTemplate(templateData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <LayoutTemplate size={16} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Save as Reusable Template
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Publish this deck ({slideCount} {slideCount === 1 ? 'slide' : 'slides'}) into your template library
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Template Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Template Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Masterclass Design System..."
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-semibold transition ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon size={14} className={cat.color} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this template contains..."
              className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Aspect Ratio Badge */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Format & Ratio:</span>
            <span className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white">
              {aspectRatio === '9:16' ? <Smartphone size={14} className="text-rose-500" /> : <Tv size={14} className="text-indigo-500" />}
              <span>{aspectRatio === '9:16' ? '9:16 Reel / Short' : '16:9 Widescreen'}</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>Save Template</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
