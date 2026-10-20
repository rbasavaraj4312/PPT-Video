import React, { useState, useRef, useEffect } from 'react';
import { 
  Folder, 
  FolderOpen, 
  MoreVertical, 
  CornerDownRight, 
  FolderInput, 
  Edit3, 
  Trash2, 
  Plus,
  Layers,
  Smartphone,
  Tv
} from 'lucide-react';

const COLOR_OPTIONS = [
  '#f97316', // Orange (like GNOME files)
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#ec4899', // Rose
  '#8b5cf6', // Purple
  '#eab308', // Amber
  '#06b6d4', // Cyan
];

export function FolderCard({
  folder,
  subfolderCount = 0,
  presentationCount = 0,
  onOpen,
  onAddSubfolder,
  onMove,
  onRename,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [selectedColor, setSelectedColor] = useState(folder.color || '#f97316');
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSaveRename = () => {
    setIsEditing(false);
    if (editName.trim() && (editName.trim() !== folder.name || selectedColor !== folder.color)) {
      onRename(folder.id, { name: editName.trim(), color: selectedColor });
    } else {
      setEditName(folder.name);
    }
  };

  const totalItems = subfolderCount + presentationCount;
  const folderColor = folder.color || '#f97316';

  return (
    <div
      onClick={(e) => {
        if (!menuOpen && !isEditing) {
          onOpen(folder.id);
        }
      }}
      className="group relative bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer p-4 flex flex-col justify-between select-none"
    >
      {/* Top row: Folder visual icon & Action menu */}
      <div className="flex items-start justify-between">
        {/* Modern Folder Glyph with 3D sheen & gradient glow */}
        <div 
          className="relative w-12 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-200"
          style={{
            backgroundColor: `${folderColor}18`, // 10% opacity fill
            color: folderColor,
          }}
        >
          {/* Subtle colored glow behind folder */}
          <div 
            className="absolute inset-0 rounded-xl opacity-20 blur-md pointer-events-none group-hover:opacity-40 transition-opacity"
            style={{ backgroundColor: folderColor }}
          />

          {/* Folder Icon */}
          <Folder 
            size={28} 
            fill={folderColor} 
            fillOpacity={0.88}
            stroke="currentColor" 
            strokeWidth={1.5}
            className="drop-shadow-xs relative z-10"
          />
        </div>

        {/* 3-Dot Options Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition"
            title="Folder Options"
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div 
              className="absolute right-0 top-7 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpen(folder.id);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <FolderOpen size={14} className="text-blue-500" />
                <span>Open Folder</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onAddSubfolder(folder.id);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Plus size={14} className="text-emerald-500" />
                <span>New Subfolder Inside</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onMove(folder);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <FolderInput size={14} className="text-indigo-500" />
                <span>Move Folder to...</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  setIsEditing(true);
                }}
                className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <Edit3 size={14} className="text-amber-500" />
                <span>Rename / Color</span>
              </button>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(folder.id);
                }}
                className="w-full text-left px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
              >
                <Trash2 size={14} />
                <span>Delete Folder</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Middle row: Folder Name (or Rename input) */}
      <div className="mt-3">
        {isEditing ? (
          <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename();
                if (e.key === 'Escape') {
                  setEditName(folder.name);
                  setIsEditing(false);
                }
              }}
              autoFocus
              className="w-full px-2 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-700 border border-blue-400 dark:border-blue-500 rounded focus:outline-none"
            />
            {/* Color pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-4 h-4 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                onClick={() => {
                  setEditName(folder.name);
                  setIsEditing(false);
                }}
                className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRename}
                className="px-2 py-0.5 text-[11px] bg-blue-600 text-white rounded font-medium"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <h3 
            className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
            title={folder.name}
          >
            {folder.name}
          </h3>
        )}
      </div>

      {/* Bottom row: Item counts & subfolder indicator */}
      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
        <span className="font-medium">
          {totalItems === 0
            ? 'Empty folder'
            : totalItems === 1
            ? '1 item'
            : `${totalItems} items`}
        </span>

        <div className="flex items-center gap-1.5">
          {subfolderCount > 0 && (
            <span 
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px]"
              title={`${subfolderCount} subfolders`}
            >
              <Folder size={10} />
              {subfolderCount}
            </span>
          )}
          {presentationCount > 0 && (
            <span 
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-mono text-[10px]"
              title={`${presentationCount} presentations / reels`}
            >
              <Layers size={10} />
              {presentationCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
