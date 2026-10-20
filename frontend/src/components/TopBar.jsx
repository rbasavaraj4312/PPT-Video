import React, { useState, useRef, useEffect } from 'react';
import { 
  Save, 
  Download, 
  Undo2, 
  Redo2, 
  FilePlus2, 
  FolderOpen, 
  Code2, 
  Check, 
  Loader2,
  Presentation,
  Sun,
  Moon,
  Film,
  Play,
  Sparkles,
  ChevronLeft,
  ChevronDown,
  Tv,
  Smartphone,
  LayoutTemplate,
  MoreHorizontal
} from 'lucide-react';

export function TopBar({
  presentation,
  updatePresentationMeta,
  onSave,
  onExport,
  onExportVideo,
  onStartSlideShow,
  onStartRemotionVideo,
  onOpenNarration,
  onOpenAiOutlineModal,
  onOpenTemplateModal,
  onSaveAsTemplate,
  isTemplateMode = false,
  editingTemplate = null,
  onBackToDashboard,
  isSaving,
  isExporting,
  isExportingVideo,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewPresentation,
  onOpenList,
  onOpenJsonModal,
  saveSuccess,
  theme,
  toggleTheme,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(presentation.title);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const exportMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      updatePresentationMeta({ title: titleInput.trim() });
    } else {
      setTitleInput(presentation.title);
    }
  };

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-4 flex items-center justify-between select-none z-20 transition-colors gap-2">
      {/* Left side: Back + Brand + Title + Template Mode + Ratio + Undo/Redo */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition shrink-0"
            title={isTemplateMode ? 'Back to Template Library' : 'Back to Projects Dashboard'}
          >
            <ChevronLeft size={16} />
            <span className="sr-only">Dashboard</span>
          </button>
        )}

        {/* Brand */}
        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white text-sm sm:text-base shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
            <Presentation size={16} />
          </div>
          <span className="hidden xl:inline bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            Slide Studio
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 shrink-0 hidden sm:block" />

        {/* Presentation / Template Title */}
        <div className="min-w-0 flex items-center gap-1.5">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTitleInput(presentation.title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
              className="px-2 py-1 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border border-blue-400 dark:border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[130px] sm:max-w-[180px] md:max-w-[220px]"
            />
          ) : (
            <button
              onClick={() => {
                setTitleInput(presentation.title);
                setIsEditingTitle(true);
              }}
              className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition max-w-[110px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[240px] truncate text-left"
              title="Click to rename"
            >
              {presentation.title || 'Untitled'}
            </button>
          )}

          {isTemplateMode && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-xs shrink-0">
              <LayoutTemplate size={11} />
              <span className="hidden sm:inline">Template Mode</span>
            </span>
          )}
        </div>

        {/* Aspect Ratio Switcher (16:9 Landscape vs 9:16 Vertical Reel) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs shrink-0">
          <button
            onClick={() => updatePresentationMeta({ aspect_ratio: '16:9' })}
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded font-medium transition ${
              (presentation.aspect_ratio || '16:9') === '16:9'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
            title="16:9 Landscape (Video, Desktop, YouTube)"
          >
            <Tv size={13} />
            <span className="hidden xl:inline">16:9</span>
          </button>
          <button
            onClick={() => updatePresentationMeta({ aspect_ratio: '9:16' })}
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded font-medium transition ${
              presentation.aspect_ratio === '9:16'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
            title="9:16 Portrait (Reels, TikTok, Shorts)"
          >
            <Smartphone size={13} />
            <span className="hidden xl:inline">Reel</span>
          </button>
        </div>

      </div>

      {/* Right side: Accelerators + Primary Actions + Export Dropdown + More Dropdown + Theme */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* AI Outline */}
        <button
          onClick={onOpenAiOutlineModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800 transition shadow-xs"
          title="Create slides with Approach-4 natural outline"
        >
          <Sparkles size={14} />
          <span className="hidden md:inline">AI Outline</span>
        </button>

        {/* Templates Modal */}
        <button
          onClick={onOpenTemplateModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg border border-purple-200 dark:border-purple-800 transition shadow-xs"
          title="Browse & Import Multi-Slide Templates"
        >
          <LayoutTemplate size={14} />
          <span className="hidden lg:inline">Templates</span>
        </button>

        {/* Save Button (Primary Action) */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition shadow-xs shrink-0 ${
            saveSuccess
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
              : isTemplateMode
              ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-purple-500/20'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
          }`}
          title={isTemplateMode ? 'Save Template (Ctrl+S)' : 'Save to JSON (Ctrl+S)'}
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin text-current" />
          ) : saveSuccess ? (
            <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
          ) : isTemplateMode ? (
            <LayoutTemplate size={14} />
          ) : (
            <Save size={14} />
          )}
          <span className="hidden sm:inline">
            {isSaving
              ? 'Saving...'
              : saveSuccess
              ? 'Saved'
              : isTemplateMode
              ? 'Save Template'
              : 'Save'}
          </span>
        </button>

        <button onClick={onStartRemotionVideo || onStartSlideShow}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-300 dark:border-blue-700 rounded-lg transition"
          title="Preview slides, voice and captions" aria-label="Preview presentation">
          <Play size={14} className="fill-current" /><span>Preview</span>
        </button>

        {/* Export Dropdown (PowerPoint & MP4 Video) */}
        <div className="relative shrink-0" ref={exportMenuRef}>
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={isExporting || isExportingVideo}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 disabled:opacity-50 rounded-lg shadow-xs transition"
            title="Export Presentation to Video or PowerPoint"
          >
            {isExportingVideo || isExporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            <span className="hidden sm:inline">
              {isExportingVideo ? 'Rendering...' : isExporting ? 'Exporting...' : 'Export'}
            </span>
            <ChevronDown size={12} className={`transition-transform duration-150 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 top-10 z-40 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => {
                  setIsExportMenuOpen(false);
                  onExportVideo();
                }}
                disabled={isExportingVideo}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5"
              >
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Film size={14} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Export MP4 Video</div>
                  <div className="text-[11px] text-slate-400">60 FPS with Morph Transitions</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExportMenuOpen(false);
                  onExport();
                }}
                disabled={isExporting}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5"
              >
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Download size={14} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Export PowerPoint</div>
                  <div className="text-[11px] text-slate-400">Standard editable .pptx deck</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* More Actions Dropdown (New, Open, Save as Template, JSON) */}
        <div className="relative shrink-0" ref={moreMenuRef}>
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            title="More Options & File Actions"
          >
            <MoreHorizontal size={15} />
          </button>

          {isMoreMenuOpen && (
            <div className="absolute right-0 top-10 z-40 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100">
              {onOpenNarration && <button type="button" onClick={() => { setIsMoreMenuOpen(false); onOpenNarration(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5"><Film size={14} /><span>Voice & narration</span></button>}
              {onStartSlideShow && <button type="button" onClick={() => { setIsMoreMenuOpen(false); onStartSlideShow(); }} className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5"><Presentation size={14} /><span>Present full screen</span></button>}
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onNewPresentation();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5"
              >
                <FilePlus2 size={14} className="text-blue-500" />
                <span>New Blank Presentation</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenList();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5"
              >
                <FolderOpen size={14} className="text-amber-500" />
                <span>Open Presentations...</span>
              </button>

              {!isTemplateMode && onSaveAsTemplate && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onSaveAsTemplate();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5"
                >
                  <Sparkles size={14} className="text-purple-500" />
                  <span>Save as Template...</span>
                </button>
              )}

              <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenJsonModal();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2.5"
              >
                <Code2 size={14} className="text-emerald-500" />
                <span>Inspect Raw JSON</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition shrink-0"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle dark/light theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
