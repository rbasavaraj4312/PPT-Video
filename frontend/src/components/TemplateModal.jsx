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
  Check,
  Plus,
  Trash2
} from 'lucide-react';

const CATEGORIES = [
  { id: 'focus', label: 'Spotlight & Focus', icon: Crosshair, color: 'text-cyan-500' },
  { id: 'timeline', label: 'Timelines & Roadmaps', icon: Clock, color: 'text-emerald-500' },
  { id: 'cinematic', label: 'Cinematic Camera', icon: Compass, color: 'text-purple-500' },
  { id: 'architecture', label: 'Architecture & Flows', icon: Zap, color: 'text-blue-500' },
  { id: 'reels', label: '9:16 Mobile Reels', icon: Smartphone, color: 'text-rose-500' },
  { id: 'general', label: 'General Decks', icon: Layers, color: 'text-amber-500' },
];

export function TemplateModal({
  isOpen,
  onClose,
  template = null, // null for create, object for edit
  onSave, // (templateData) => Promise
  onEditSlides, // (template) => void
  onDelete, // (templateId) => void
}) {
  const isEditing = !!template;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('focus');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [slideCount, setSlideCount] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setDescription(template.description || '');
      setCategory(template.category || 'focus');
      setAspectRatio(template.aspect_ratio || '16:9');
      setSlideCount(template.slides?.length || template.slide_count || 2);
    } else {
      setName('');
      setDescription('');
      setCategory('focus');
      setAspectRatio('16:9');
      setSlideCount(2);
    }
    setError(null);
  }, [template, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e, shouldOpenStudio = false) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError('Please provide a template title');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let updatedTemplate;
      if (isEditing) {
        updatedTemplate = {
          ...template,
          name: name.trim(),
          description: description.trim(),
          category,
          aspect_ratio: aspectRatio,
        };
      } else {
        // Generate blank slides with coordinated morph ID templates
        const newSlides = [];
        const isVert = aspectRatio === '9:16';
        const canvasW = isVert ? 720 : 1280;
        const canvasH = isVert ? 1280 : 720;

        for (let i = 0; i < slideCount; i++) {
          newSlides.push({
            id: `slide_${Date.now()}_${i}`,
            title: `Slide ${i + 1}: Step & Focus`,
            aspect_ratio: aspectRatio,
            background: '#090d16',
            elements: [
              {
                id: `el_bg_${i}`,
                type: 'rounded_rectangle',
                x: 40,
                y: 40,
                width: canvasW - 80,
                height: canvasH - 80,
                fill: '#0f172a',
                stroke: '#1e293b',
                stroke_width: 1,
                radius: 20,
                morph_id: 'container-frame',
                z_index: 0,
              },
              {
                id: `el_title_${i}`,
                type: 'text',
                x: 80,
                y: isVert ? 120 : 80,
                width: canvasW - 160,
                height: 60,
                content: `${name} — Part ${i + 1}`,
                font_size: isVert ? 32 : 36,
                font_weight: 'bold',
                font_color: '#ffffff',
                morph_id: 'section-title',
                z_index: 1,
              },
              {
                id: `el_badge_${i}`,
                type: 'rounded_rectangle',
                x: 80,
                y: isVert ? 200 : 160,
                width: 140,
                height: 36,
                fill: '#3b82f6',
                radius: 12,
                content: `STAGE 0${i + 1}`,
                font_size: 13,
                font_weight: 'bold',
                font_color: '#ffffff',
                morph_id: 'stage-indicator',
                z_index: 2,
              }
            ],
          });
        }

        const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36);
        updatedTemplate = {
          id: `tpl-custom-${uuid}`,
          name: name.trim(),
          description: description.trim(),
          category,
          aspect_ratio: aspectRatio,
          slide_count: newSlides.length,
          slides: newSlides,
          is_builtin: false,
        };
      }

      await onSave(updatedTemplate);

      if (shouldOpenStudio && onEditSlides) {
        onClose();
        onEditSlides(updatedTemplate);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save template');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <LayoutTemplate size={16} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Template Details' : 'Create New Multi-Slide Template'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing 
                  ? 'Update template title, category, and metadata' 
                  : 'Design reusable slide sequences with connected animations'}
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

        {/* Content Body */}
        <form onSubmit={(e) => handleSubmit(e, !isEditing)} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Template Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Template Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Executive Quarterly Roadmap, Tech Explainer Reel..."
              className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (cat.id === 'reels') setAspectRatio('9:16');
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon size={15} className={cat.color} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Format & Aspect Ratio
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition ${
                  aspectRatio === '16:9'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                  <Tv size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold">16:9 Widescreen</div>
                  <div className="text-[11px] text-slate-400">Desktop, Video, YouTube</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition ${
                  aspectRatio === '9:16'
                    ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400">
                  <Smartphone size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold">9:16 Vertical Reel</div>
                  <div className="text-[11px] text-slate-400">Shorts, TikTok, Stories</div>
                </div>
              </button>
            </div>
          </div>

          {/* Initial Slides Count (Only for new template) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Initial Slides in Sequence
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSlideCount(num)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition ${
                      slideCount === num
                        ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {num} {num === 1 ? 'Slide' : 'Slides'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the purpose and animation flow of this template..."
              className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              {isEditing && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(template.id);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition"
                  title="Delete this template"
                >
                  <Trash2 size={13} />
                  <span>Delete Template</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>

              {isEditing ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>Save Changes</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  <span>Create & Edit Slides</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
