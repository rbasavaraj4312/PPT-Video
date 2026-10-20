import React from 'react';
import { ImageProperties } from './editor/ImageProperties';
import { 
  Trash2, 
  Copy, 
  BringToFront, 
  SendToBack, 
  Bold, 
  Italic, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  ArrowRight,
  ArrowLeft,
  Group,
  Ungroup,
  Scissors,
  AlignStartVertical,
  AlignEndVertical,
  Sparkles,
  Lock,
  Code2,
  Sliders,
  Plus,
  Paintbrush
} from 'lucide-react';
import { MOTION_COMPONENTS } from '../data/motionComponentsCatalog';
import { getRegisteredMotionComponent } from '../motion/registry';

const PRESET_COLORS = [
  '#ffffff', '#f8fafc', '#e2e8f0', '#94a3b8', '#475569', '#0f172a',
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'
];

const ACTION_BADGES = {
  custom: { label: 'Custom HTML / CSS / JS', badgeClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30' },
  jumping: { label: 'Jumping & Bouncing', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' },
  moving: { label: 'Moving & Floating', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  sliding: { label: 'Sliding & Gliding', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  counting: { label: 'Counting & Ticking', badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30' },
  pulsing: { label: 'Moving & Pulsing', badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  glowing: { label: 'Glowing & Breathing', badgeClass: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30' },
  blinking: { label: 'Blinking & Flashing', badgeClass: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30' },
};

export function PropertyPanel({
  selectedElement,
  selectedElements = [],
  selectedElementIds = [],
  activeSlide,
  onUpdateElement,
  onUpdateSelectedElements,
  onDeleteElement,
  onDuplicateElement,
  onBringToFront,
  onSendToBack,
  onUpdateSlide,
  onGroup,
  canGroup = false,
  onUngroup,
  canUngroup = false,
  isGroupSelected = false,
  onAlign,
  onCopy,
  onCut,
  onCopyStyle,
  onPasteStyle,
  hasStyleClipboard = false,
  onOpenIconPicker,
  onOpenCodeEditor,
}) {
  if (!selectedElement) {
    if (!activeSlide) {
      return (
        <aside className="w-64 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 h-[calc(100vh-3.5rem)] select-none" />
      );
    }
    // Slide Properties Panel
    return (
      <aside className="w-64 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 h-[calc(100vh-3.5rem)] overflow-y-auto select-none transition-colors">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
          Slide Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Slide Title
            </label>
            <input
              type="text"
              value={activeSlide.title || ''}
              onChange={(e) => onUpdateSlide({ title: e.target.value })}
              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Overview"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Slide Background
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {PRESET_COLORS.slice(0, 10).map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateSlide({ background: color })}
                  className={`w-8 h-8 rounded-lg border transition-transform ${
                    activeSlide.background === color
                      ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                      : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={activeSlide.background || '#ffffff'}
                onChange={(e) => onUpdateSlide({ background: e.target.value })}
                className="w-8 h-8 p-0 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {activeSlide.background || '#ffffff'}
              </span>
            </div>
          </div>

          {/* Slide Transition & Video Duration */}
          {/* Slide Transition & Video Duration */}
          {/* Slide Transition & Video Duration */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Transition (to next slide)
            </label>
            <div className="grid grid-cols-3 gap-1 mb-2">
              {['morph', 'fade', 'none'].map((type) => (
                <button
                  key={type}
                  onClick={() => onUpdateSlide({ transition_type: type })}
                  className={`py-1 text-xs capitalize rounded border transition ${
                    (activeSlide.transition_type || 'morph') === type
                      ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px]">Transition (s):</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="5.0"
                  value={activeSlide.transition_duration ?? 1.0}
                  onChange={(e) => onUpdateSlide({ transition_duration: parseFloat(e.target.value) || 1.0 })}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px]">Display Hold (s):</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="30.0"
                  value={activeSlide.slide_duration ?? 3.0}
                  onChange={(e) => onUpdateSlide({ slide_duration: parseFloat(e.target.value) || 3.0 })}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Aspect Ratio:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">16:9 Widescreen</span>
            </div>
            <div className="flex justify-between">
              <span>Resolution:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">1280 x 720 px</span>
            </div>
            <div className="flex justify-between">
              <span>Elements count:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{(activeSlide.elements || []).length}</span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Multi-Selection Panel (PowerPoint style)
  if (selectedElements.length > 1) {
    return (
      <aside className="w-64 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 h-[calc(100vh-3.5rem)] overflow-y-auto select-none transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
              {selectedElements.length} Items Selected
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onCopy}
              title="Copy (Ctrl+C)"
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={onCut}
              title="Cut (Ctrl+X)"
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              <Scissors size={14} />
            </button>
            {onCopyStyle && (
              <button
                onClick={onCopyStyle}
                title="Copy Style (Ctrl+Shift+C)"
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <Paintbrush size={14} />
              </button>
            )}
            {onPasteStyle && (
              <button
                onClick={onPasteStyle}
                disabled={!hasStyleClipboard}
                title="Paste Style (Ctrl+Shift+V)"
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 rounded"
              >
                <Paintbrush size={14} className="rotate-45" />
              </button>
            )}
            <button
              onClick={() => onDuplicateElement && onDuplicateElement()}
              title="Duplicate (Ctrl+D)"
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => onDeleteElement && onDeleteElement()}
              title="Delete (Delete)"
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Grouping Actions */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Grouping
            </label>
            <div className="flex flex-col gap-1.5">
              {canGroup && (
                <button
                  onClick={onGroup}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition shadow-sm"
                >
                  <Group size={15} />
                  Group Elements (Ctrl+G)
                </button>
              )}
              {canUngroup && (
                <button
                  onClick={onUngroup}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg transition"
                >
                  <Ungroup size={15} />
                  Ungroup Elements (Ctrl+Shift+G)
                </button>
              )}
            </div>
          </div>

          {/* Alignment Tools */}
          {onAlign && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Align Selected
              </label>
              <div className="grid grid-cols-3 gap-1 mb-1.5">
                <button
                  onClick={() => onAlign('left')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 transition"
                  title="Align Left"
                >
                  <AlignLeft size={13} /> Left
                </button>
                <button
                  onClick={() => onAlign('center')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 transition"
                  title="Align Center"
                >
                  <AlignCenter size={13} /> Center
                </button>
                <button
                  onClick={() => onAlign('right')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 transition"
                  title="Align Right"
                >
                  <AlignRight size={13} /> Right
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => onAlign('top')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 transition"
                  title="Align Top"
                >
                  <AlignStartVertical size={13} /> Top
                </button>
                <button
                  onClick={() => onAlign('middle')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 transition"
                  title="Align Middle"
                >
                  Middle
                </button>
                <button
                  onClick={() => onAlign('bottom')}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 transition"
                  title="Align Bottom"
                >
                  <AlignEndVertical size={13} /> Bottom
                </button>
              </div>
            </div>
          )}

          {/* Quick Bulk Color Palette */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Bulk Fill Color
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {PRESET_COLORS.slice(0, 10).map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    if (onUpdateSelectedElements) {
                      onUpdateSelectedElements({ fill_color: color });
                    } else {
                      selectedElements.forEach((el) => onUpdateElement(el.id, { fill_color: color }));
                    }
                  }}
                  className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-700 hover:scale-105 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Layer Ordering */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Arrangement
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onBringToFront && onBringToFront()}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 transition"
              >
                <BringToFront size={14} /> Bring Forward
              </button>
              <button
                onClick={() => onSendToBack && onSendToBack()}
                className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 transition"
              >
                <SendToBack size={14} /> Send Backward
              </button>
            </div>
          </div>

          {/* Morph Pairing Tag for Groups / Multi-Selection */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Morph Pairing Tag
            </label>
            <input
              type="text"
              value={selectedElements.every((el) => el.morph_id === selectedElements[0]?.morph_id) ? (selectedElements[0]?.morph_id || '') : ''}
              onChange={(e) => {
                const val = e.target.value.trim() || null;
                if (onUpdateSelectedElements) {
                  onUpdateSelectedElements({ morph_id: val });
                } else {
                  selectedElements.forEach((el) => onUpdateElement(el.id, { morph_id: val }));
                }
              }}
              placeholder="e.g. card-group, hero-banner"
              className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block leading-tight">
              Assigns a shared morph tag to this group or selected elements for coordinated morph transitions.
            </span>
          </div>
        </div>
      </aside>
    );
  }

  if (selectedElement.type === 'image') return <ImageProperties key={selectedElement.id} element={selectedElement}
    onUpdateElement={onUpdateElement} onDeleteElement={onDeleteElement} onDuplicateElement={onDuplicateElement}
    onBringToFront={onBringToFront} onSendToBack={onSendToBack} />;

  // Single Selected Element Properties Panel
  const isLineOrArrow = selectedElement.type === 'line' || selectedElement.type === 'arrow';
  const isText = selectedElement.type === 'text';
  const isIcon = selectedElement.type === 'icon';
  const isMotion = selectedElement.type === 'motion_component';
  const motionData = selectedElement.motion_data || {};
  const componentId = motionData.component_id || selectedElement.component_id;
  const registeredMotion = getRegisteredMotionComponent(componentId);

  const compDef = registeredMotion || MOTION_COMPONENTS.find((c) => c.id === componentId) || {
    name: motionData.name || motionData.template_name || 'Motion Component',
    category: motionData.category || 'cards',
  };

  // Dynamic custom variables defined for this motion template
  const elementCustomVars = (() => {
    const regDefaults = registeredMotion?.variableSchema 
      ? Object.fromEntries(registeredMotion.variableSchema.map(v => [v.key, v.defaultValue]))
      : {};
    return {
      ...(compDef.custom_vars || {}),
      ...regDefaults,
      ...(motionData.custom_vars || {}),
    };
  })();

  const updateCustomVar = (varKey, val) => {
    const nextVars = { ...elementCustomVars, [varKey]: val };
    onUpdateElement(selectedElement.id, {
      motion_data: {
        ...(selectedElement.motion_data || {}),
        custom_vars: nextVars,
      },
    });
  };

  const addCustomVar = () => {
    const nextKey = `var_${Object.keys(elementCustomVars).length + 1}`;
    updateCustomVar(nextKey, 'New Value');
  };

  const deleteCustomVar = (varKey) => {
    const nextVars = { ...elementCustomVars };
    delete nextVars[varKey];
    onUpdateElement(selectedElement.id, {
      motion_data: {
        ...(selectedElement.motion_data || {}),
        custom_vars: nextVars,
      },
    });
  };


  return (
    <aside className="w-64 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 h-[calc(100vh-3.5rem)] overflow-y-auto select-none transition-colors">
      {/* Element Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
        <div className="flex items-center gap-1">
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
            isMotion
              ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800'
              : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
          }`}>
            {isMotion && <Sparkles size={11} className="text-cyan-500" />}
            {selectedElement.type.replace('_', ' ')}
          </span>
          {selectedElement.group_id && (
            <span className="text-[10px] font-medium bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
              Group
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {selectedElement.group_id && (
            <button
              onClick={onUngroup}
              title="Ungroup (Ctrl+Shift+G)"
              className="p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded"
            >
              <Ungroup size={14} />
            </button>
          )}
          <button
            onClick={onCopy}
            title="Copy (Ctrl+C)"
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={onCut}
            title="Cut (Ctrl+X)"
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            <Scissors size={14} />
          </button>
          {onCopyStyle && (
            <button
              onClick={onCopyStyle}
              title="Copy Style (Ctrl+Shift+C)"
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
            >
              <Paintbrush size={14} />
            </button>
          )}
          {onPasteStyle && (
            <button
              onClick={onPasteStyle}
              disabled={!hasStyleClipboard}
              title="Paste Style (Ctrl+Shift+V)"
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 rounded"
            >
              <Paintbrush size={14} className="rotate-45" />
            </button>
          )}
          <button
            onClick={() => onDuplicateElement(selectedElement.id)}
            title="Duplicate (Ctrl+D)"
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => onBringToFront(selectedElement.id)}
            title="Bring to Front"
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            <BringToFront size={14} />
          </button>
          <button
            onClick={() => onSendToBack(selectedElement.id)}
            title="Send to Back"
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            <SendToBack size={14} />
          </button>
          <button
            onClick={() => onDeleteElement(selectedElement.id)}
            title="Delete (Delete)"
            className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Dedicated Motion Component Properties (Unique Identity & Pure Custom Variables) */}
        {isMotion && (
          <div className="space-y-4 p-3.5 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 shadow-sm">
            {/* Template Identity Header */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Sparkles size={14} className="text-cyan-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {compDef.name || 'Motion Component'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {registeredMotion?.sourceLibrary && (
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      {registeredMotion.sourceLibrary}
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                    {compDef.category || 'cards'}
                  </span>
                </div>
              </div>

              {!registeredMotion && (
                <button
                  type="button"
                  onClick={() => onOpenCodeEditor?.(selectedElement)}
                  className="w-full py-1.5 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98]"
                >
                  <Code2 size={13} />
                  <span>Edit HTML + CSS Code</span>
                </button>
              )}
            </div>

            {/* Typed Variable Inspector (from Schema) */}
            {registeredMotion?.variableSchema ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={12} className="text-cyan-500" />
                    <span>Dynamic Variables</span>
                  </label>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                    {registeredMotion.variableSchema.length} variables
                  </span>
                </div>

                <div className="space-y-2.5">
                  {registeredMotion.variableSchema.map((v) => {
                    const currentVal = elementCustomVars[v.key] !== undefined ? elementCustomVars[v.key] : v.defaultValue;

                    return (
                      <div
                        key={v.key}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {v.label || v.key}
                          </label>
                          <span className="text-[9px] font-mono text-slate-400">
                            {v.type}
                          </span>
                        </div>

                        {/* 1. Color Picker */}
                        {v.type === 'color' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={String(currentVal || '#00f2fe')}
                              onChange={(e) => updateCustomVar(v.key, e.target.value)}
                              className="w-7 h-7 p-0 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                            />
                            <input
                              type="text"
                              value={String(currentVal || '#00f2fe')}
                              onChange={(e) => updateCustomVar(v.key, e.target.value)}
                              className="flex-1 text-xs px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                          </div>
                        )}

                        {/* 2. Number with Range Slider */}
                        {v.type === 'number' && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {v.min !== undefined && v.max !== undefined && (
                                <input
                                  type="range"
                                  min={v.min}
                                  max={v.max}
                                  step={v.step || 1}
                                  value={Number(currentVal ?? v.defaultValue ?? 0)}
                                  onChange={(e) => updateCustomVar(v.key, Number(e.target.value))}
                                  className="flex-1 accent-cyan-500"
                                />
                              )}
                              <input
                                type="number"
                                min={v.min}
                                max={v.max}
                                step={v.step || 1}
                                value={currentVal ?? 0}
                                onChange={(e) => updateCustomVar(v.key, Number(e.target.value))}
                                className="w-16 text-xs px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono text-right focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              />
                            </div>
                          </div>
                        )}

                        {/* 3. Select Dropdown */}
                        {v.type === 'select' && (
                          <select
                            value={String(currentVal || '')}
                            onChange={(e) => updateCustomVar(v.key, e.target.value)}
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          >
                            {(v.options || []).map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* 4. Boolean Toggle */}
                        {v.type === 'boolean' && (
                          <label className="flex items-center gap-2 cursor-pointer pt-0.5">
                            <input
                              type="checkbox"
                              checked={Boolean(currentVal)}
                              onChange={(e) => updateCustomVar(v.key, e.target.checked)}
                              className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 dark:border-slate-600"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                              {Boolean(currentVal) ? 'Enabled' : 'Disabled'}
                            </span>
                          </label>
                        )}

                        {/* 5. Text / Textarea */}
                        {v.type === 'text' && (
                          String(currentVal || '').length > 35 ? (
                            <textarea
                              rows={2}
                              value={String(currentVal || '')}
                              onChange={(e) => updateCustomVar(v.key, e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(currentVal || '')}
                              onChange={(e) => updateCustomVar(v.key, e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Fallback to Generic Custom Variables Management */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={12} className="text-indigo-500" />
                    <span>Custom Variables</span>
                  </label>
                  <button
                    type="button"
                    onClick={addCustomVar}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[10px] font-bold flex items-center gap-1 transition"
                    title="Add Custom Variable"
                  >
                    <Plus size={11} />
                    <span>Add Var</span>
                  </button>
                </div>

                {Object.keys(elementCustomVars).length === 0 ? (
                  <div className="p-3 text-center rounded-xl bg-white dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
                    No custom variables defined.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(elementCustomVars).map(([key, val]) => {
                      const strVal = String(val ?? '');
                      const isColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(strVal.trim());
                      const isNumeric = !isNaN(Number(strVal)) && strVal.trim() !== '' && !isColor;
                      const isLong = strVal.length > 40 || strVal.includes('\n');

                      return (
                        <div
                          key={key}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400 truncate">
                              {`{{${key}}}`}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteCustomVar(key)}
                              className="p-0.5 rounded text-slate-400 hover:text-rose-500 transition"
                              title={`Delete variable ${key}`}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {isColor ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={strVal}
                                onChange={(e) => updateCustomVar(key, e.target.value)}
                                className="w-7 h-7 p-0 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                              />
                              <input
                                type="text"
                                value={strVal}
                                onChange={(e) => updateCustomVar(key, e.target.value)}
                                className="flex-1 text-xs px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          ) : isLong ? (
                            <textarea
                              rows={2}
                              value={strVal}
                              onChange={(e) => updateCustomVar(key, e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          ) : (
                            <input
                              type={isNumeric ? 'number' : 'text'}
                              value={strVal}
                              onChange={(e) => updateCustomVar(key, e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Text Content & Typography (if text or has text capability, non-icon, non-motion) */}
        {!isIcon && !isMotion && (isText || selectedElement.text !== undefined) && (
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Text
            </label>
            <textarea
              rows={2}
              value={selectedElement.text || ''}
              onChange={(e) => onUpdateElement(selectedElement.id, { text: e.target.value })}
              className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter text..."
            />

            {/* Typography Controls */}
            <div className="mt-2 flex items-center gap-1.5">
              <input
                type="number"
                min="10"
                max="120"
                value={selectedElement.font_size || 18}
                onChange={(e) => onUpdateElement(selectedElement.id, { font_size: parseInt(e.target.value) || 18 })}
                className="w-16 text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                title="Font size (px)"
              />
              <button
                onClick={() => onUpdateElement(selectedElement.id, { font_bold: !selectedElement.font_bold })}
                className={`p-1.5 rounded border text-xs font-bold transition ${
                  selectedElement.font_bold
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Bold"
              >
                <Bold size={13} />
              </button>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { font_italic: !selectedElement.font_italic })}
                className={`p-1.5 rounded border text-xs italic transition ${
                  selectedElement.font_italic
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Italic"
              >
                <Italic size={13} />
              </button>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />
              <button
                onClick={() => onUpdateElement(selectedElement.id, { text_align: 'left' })}
                className={`p-1.5 rounded border transition ${
                  selectedElement.text_align === 'left'
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Align Left"
              >
                <AlignLeft size={13} />
              </button>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { text_align: 'center' })}
                className={`p-1.5 rounded border transition ${
                  selectedElement.text_align === 'center'
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Align Center"
              >
                <AlignCenter size={13} />
              </button>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { text_align: 'right' })}
                className={`p-1.5 rounded border transition ${
                  selectedElement.text_align === 'right'
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Align Right"
              >
                <AlignRight size={13} />
              </button>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <label className="text-[11px] text-slate-500 dark:text-slate-400">Text Color:</label>
              <input
                type="color"
                value={selectedElement.text_color || '#0f172a'}
                onChange={(e) => onUpdateElement(selectedElement.id, { text_color: e.target.value })}
                className="w-6 h-6 p-0 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
              />
              <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{selectedElement.text_color || '#0f172a'}</span>
            </div>
          </div>
        )}

        {/* Fill Color (Shapes only) */}
        {!isLineOrArrow && !isText && !isIcon && !isMotion && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Fill Color</label>
              <button
                onClick={() => onUpdateElement(selectedElement.id, { fill_color: null })}
                className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
              >
                Transparent
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {PRESET_COLORS.slice(0, 10).map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateElement(selectedElement.id, { fill_color: color })}
                  className={`w-8 h-8 rounded-lg border transition-transform ${
                    selectedElement.fill_color === color
                      ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                      : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedElement.fill_color || '#3b82f6'}
                onChange={(e) => onUpdateElement(selectedElement.id, { fill_color: e.target.value })}
                className="w-7 h-7 p-0 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {selectedElement.fill_color || 'Transparent'}
              </span>
            </div>
          </div>
        )}

        {/* Stroke / Border */}
        {!isMotion && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {isLineOrArrow ? 'Line Color' : 'Border / Stroke'}
              </label>
              {!isLineOrArrow && (
                <button
                  onClick={() => onUpdateElement(selectedElement.id, { stroke_color: null })}
                  className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
                >
                  None
                </button>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {PRESET_COLORS.slice(0, 10).map((color) => (
                <button
                  key={color}
                  onClick={() => onUpdateElement(selectedElement.id, { stroke_color: color })}
                  className={`w-8 h-8 rounded-lg border transition-transform ${
                    selectedElement.stroke_color === color
                      ? 'border-blue-600 ring-2 ring-blue-500/30 scale-105'
                      : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedElement.stroke_color || '#1d4ed8'}
                onChange={(e) => onUpdateElement(selectedElement.id, { stroke_color: e.target.value })}
                className="w-7 h-7 p-0 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {selectedElement.stroke_color || 'None'}
              </span>
            </div>

            {/* Stroke Width & Style */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">Width:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 4, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() => onUpdateElement(selectedElement.id, { stroke_width: w })}
                    className={`w-7 h-7 text-xs font-semibold rounded border transition ${
                      selectedElement.stroke_width === w
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">Style:</span>
              <div className="flex items-center gap-1">
                {['solid', 'dashed'].map((style) => (
                  <button
                    key={style}
                    onClick={() => onUpdateElement(selectedElement.id, { stroke_style: style })}
                    className={`px-2.5 py-1 text-xs capitalize rounded border transition ${
                      selectedElement.stroke_style === style
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Arrowheads Controls */}
        {isLineOrArrow && (
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Arrowheads
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateElement(selectedElement.id, {
                    arrow_head_start: !selectedElement.arrow_head_start,
                  })
                }
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition ${
                  selectedElement.arrow_head_start
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <ArrowLeft size={13} />
                <span>Start</span>
              </button>
              <button
                onClick={() =>
                  onUpdateElement(selectedElement.id, {
                    arrow_head_end: !selectedElement.arrow_head_end,
                  })
                }
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition ${
                  selectedElement.arrow_head_end
                    ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>End</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Geometry (X, Y, W, H) */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
            Dimensions
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">X:</span>
              <input
                type="number"
                value={Math.round(selectedElement.x)}
                onChange={(e) => onUpdateElement(selectedElement.id, { x: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">Y:</span>
              <input
                type="number"
                value={Math.round(selectedElement.y)}
                onChange={(e) => onUpdateElement(selectedElement.id, { y: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">W:</span>
              <input
                type="number"
                value={Math.round(selectedElement.width)}
                onChange={(e) => onUpdateElement(selectedElement.id, { width: parseInt(e.target.value) || 10 })}
                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">H:</span>
              <input
                type="number"
                value={Math.round(selectedElement.height)}
                onChange={(e) => onUpdateElement(selectedElement.id, { height: parseInt(e.target.value) || 10 })}
                className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Morph Pairing Tag */}
        {/* Morph Pairing Tag */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Morph Pairing Tag
          </label>
          <input
            type="text"
            value={selectedElement.morph_id || ''}
            onChange={(e) => onUpdateElement(selectedElement.id, { morph_id: e.target.value.trim() || null })}
            placeholder="e.g. vector-db, hero-box"
            className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block leading-tight">
            Objects with identical tags on adjacent slides smoothly morph during transitions.
          </span>
        </div>
      </div>
    </aside>
  );
}
