import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { 
  MousePointer, 
  Hand,
  Square, 
  Circle, 
  Minus, 
  ArrowRight, 
  Type,
  SquareDashedBottomCode,
  Scissors,
  Copy,
  ClipboardPaste,
  Group,
  Ungroup,
  Boxes,
  Undo2,
  Redo2,
  Sparkles
} from 'lucide-react';

const TOOLS = [
  { id: 'select', label: 'Select (V)', icon: MousePointer, key: 'v' },
  { id: 'hand', label: 'Hand / Pan (H or Space)', icon: Hand, key: 'h' },
  { id: 'rectangle', label: 'Rectangle (R)', icon: Square, key: 'r' },
  { id: 'rounded_rectangle', label: 'Rounded Rect (U)', icon: SquareDashedBottomCode, key: 'u' },
  { id: 'ellipse', label: 'Circle / Ellipse (O)', icon: Circle, key: 'o' },
  { id: 'line', label: 'Line (L)', icon: Minus, key: 'l' },
  { id: 'arrow', label: 'Arrow (A)', icon: ArrowRight, key: 'a' },
  { id: 'text', label: 'Text (T)', icon: Type, key: 't' },
];

export function Toolbar({
  onInsertImages,
  onUndo, onRedo, canUndo = false, canRedo = false,
  activeTool,
  setActiveTool,
  onOpenIconPicker,
  isIconPickerOpen = false,
  onOpenMotionPicker,
  isMotionPickerOpen = false,
  onCut,
  onCopy,
  onPaste,
  canPaste = false,
  hasSelection = false,
  onGroup,
  canGroup = false,
  onUngroup,
  canUngroup = false,
}) {
  const imageInput = useRef(null);
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg dark:shadow-slate-950/60 rounded-2xl p-1.5 flex items-center gap-1 transition-colors">
      {/* Creation and Navigation Tools */}
      {TOOLS.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        return (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => setActiveTool(tool.id)}
            className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon size={17} strokeWidth={2.2} />
          </button>
        );
      })}

      {/* Symbols & Architecture Icons */}
      <button type="button" title="Insert image" aria-label="Insert image" onClick={() => imageInput.current.click()} className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-slate-800"><ImagePlus size={18} /></button>
      <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden aria-label="Image files" onChange={event => { onInsertImages?.(event.target.files); event.target.value = ''; }} />
      <button
        type="button"
        title="Symbols & Architecture Icons (I)"
        onClick={onOpenIconPicker}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 ${
          isIconPickerOpen
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <Boxes size={17} strokeWidth={2.2} />
      </button>

      {/* Motion Components & Animations */}
      <button
        type="button"
        title="Remotion Motion Components & Actions (M)"
        onClick={onOpenMotionPicker}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 ${
          isMotionPickerOpen
            ? 'bg-gradient-to-tr from-purple-600 to-cyan-500 text-white shadow-md shadow-cyan-500/25 scale-105 ring-2 ring-cyan-400/50'
            : 'text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/40'
        }`}
      >
        <Sparkles size={17} strokeWidth={2.2} />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Cut, Copy, Paste Operations */}
      <button
        type="button"
        title="Cut (Ctrl+X)"
        disabled={!hasSelection}
        onClick={onCut}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition ${
          hasSelection
            ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
        }`}
      >
        <Scissors size={16} />
      </button>

      <button
        type="button"
        title="Copy (Ctrl+C)"
        disabled={!hasSelection}
        onClick={onCopy}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition ${
          hasSelection
            ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
        }`}
      >
        <Copy size={16} />
      </button>

      <button
        type="button"
        title="Paste (Ctrl+V)"
        disabled={!canPaste}
        onClick={onPaste}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition ${
          canPaste
            ? 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
        }`}
      >
        <ClipboardPaste size={16} />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Group & Ungroup Operations */}
      <button
        type="button"
        title="Group (Ctrl+G)"
        disabled={!canGroup}
        onClick={onGroup}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition ${
          canGroup
            ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
        }`}
      >
        <Group size={16} />
      </button>

      <button
        type="button"
        title="Ungroup (Ctrl+Shift+G)"
        disabled={!canUngroup}
        onClick={onUngroup}
        className={`flex items-center justify-center w-9 h-9 rounded-xl transition ${
          canUngroup
            ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
            : 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
        }`}
      >
        <Ungroup size={16} />
      </button>
      {onUndo && <><div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" /><button type="button" title="Undo (Ctrl+Z)" aria-label="Undo" disabled={!canUndo} onClick={onUndo} className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 disabled:opacity-30"><Undo2 size={16} /></button><button type="button" title="Redo (Ctrl+Y)" aria-label="Redo" disabled={!canRedo} onClick={onRedo} className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 disabled:opacity-30"><Redo2 size={16} /></button></>}
    </div>
  );
}

