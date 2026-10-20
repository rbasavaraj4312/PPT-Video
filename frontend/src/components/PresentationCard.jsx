import React, { useState } from 'react';
import { 
  Tv, 
  Smartphone, 
  MoreVertical, 
  Play, 
  Trash2, 
  FolderInput, 
  Film, 
  Calendar, 
  Layers,
  Copy
} from 'lucide-react';

export function PresentationCard({
  presentation,
  folders = [],
  onSelect,
  onDelete,
  onMoveToFolder,
  onExportVideo,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFolderSubmenuOpen, setIsFolderSubmenuOpen] = useState(false);

  const isReel = presentation.aspect_ratio === '9:16';
  const folder = folders.find((f) => f.id === presentation.folder_id);

  const dateStr = presentation.updated_at
    ? new Date(presentation.updated_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      onClick={() => onSelect(presentation.id)}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
    >
      {/* Visual Screen Preview Frame */}
      <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center p-2 mb-3.5 border border-slate-100 dark:border-slate-800">
        {isReel ? (
          // 9:16 Reel Vertical Phone Mockup
          <div className="w-24 h-40 bg-gradient-to-br from-rose-950/60 to-slate-900 border-2 border-rose-500/50 rounded-2xl flex flex-col items-center justify-between p-2 shadow-inner relative group-hover:border-rose-400 transition-colors">
            {/* Phone Speaker Notch */}
            <div className="w-6 h-1 bg-rose-500/40 rounded-full" />
            <div className="flex flex-col items-center gap-1 text-rose-300">
              <Smartphone size={22} className="animate-pulse" />
              <span className="text-[10px] font-bold tracking-wider">REEL</span>
            </div>
            {/* Phone Home Pill */}
            <div className="w-8 h-1 bg-rose-500/30 rounded-full" />
          </div>
        ) : (
          // 16:9 Long Video Landscape Monitor Mockup
          <div className="w-full h-32 bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-lg flex flex-col items-center justify-center gap-1.5 text-indigo-300 group-hover:border-indigo-400 transition-colors shadow-inner">
            <Tv size={24} />
            <span className="text-[11px] font-bold tracking-wider text-indigo-200">16:9 VIDEO</span>
          </div>
        )}

        {/* Hover Quick Open Overlay */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play size={18} className="ml-0.5" />
          </div>
        </div>

        {/* Screen Format Badge */}
        <div className="absolute top-2 left-2">
          {isReel ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <Smartphone size={10} />
              <span>9:16 Shorts</span>
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
              <Tv size={10} />
              <span>16:9 Video</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Info */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
            {presentation.title || 'Untitled Presentation'}
          </h3>

          {/* 3-Dot Options Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                onMouseLeave={() => {
                  setIsMenuOpen(false);
                  setIsFolderSubmenuOpen(false);
                }}
                className="absolute right-0 top-6 z-30 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 text-xs select-none"
              >
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onSelect(presentation.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                >
                  <Play size={13} className="text-blue-500" />
                  <span>Open Editor</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExportVideo(presentation.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                >
                  <Film size={13} className="text-purple-500" />
                  <span>Export Video MP4</span>
                </button>

                {/* Move to Folder Submenu */}
                <div className="relative">
                  <button
                    onClick={() => setIsFolderSubmenuOpen(!isFolderSubmenuOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <FolderInput size={13} className="text-amber-500" />
                      <span>Move to Folder</span>
                    </div>
                    <span className="text-[10px]">▶</span>
                  </button>

                  {isFolderSubmenuOpen && (
                    <div className="absolute left-full top-0 ml-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 text-xs z-40">
                      <button
                        onClick={() => {
                          onMoveToFolder(presentation.id, null);
                          setIsMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 ${!presentation.folder_id ? 'font-bold text-blue-500' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        (No Folder)
                      </button>
                      {folders.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => {
                            onMoveToFolder(presentation.id, f.id);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 ${presentation.folder_id === f.id ? 'font-bold text-blue-500' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: f.color || '#3b82f6' }}
                          />
                          <span className="truncate">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (window.confirm(`Delete "${presentation.title}"?`)) {
                      onDelete(presentation.id);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-1">
          <div className="flex items-center gap-1.5">
            <Layers size={13} />
            <span>{presentation.slide_count} slides</span>
          </div>

          <div className="flex items-center gap-2">
            {folder && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white truncate max-w-[100px]"
                style={{ backgroundColor: folder.color || '#3b82f6' }}
              >
                {folder.name}
              </span>
            )}

            {dateStr && (
              <span className="flex items-center gap-1 text-[11px]">
                <Calendar size={11} />
                {dateStr}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
