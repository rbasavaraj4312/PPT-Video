import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Tv, 
  Smartphone, 
  Sparkles, 
  Presentation, 
  Sun, 
  Moon, 
  Layers,
  FolderOpen,
  FolderPlus,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  LayoutGrid,
  List,
  Home,
  Folder,
  Calendar,
  MoreVertical,
  Film
} from 'lucide-react';
import { FolderSidebar } from './FolderSidebar';
import { PresentationCard } from './PresentationCard';
import { FolderCard } from './FolderCard';
import { MoveModal } from './MoveModal';
import { TemplateLibrary } from './TemplateLibrary';
import { TemplateModal } from './TemplateModal';
import { MotionTemplateLibrary } from './MotionTemplateLibrary';

const FOLDER_COLORS = [
  '#f97316', // orange (GNOME style)
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#10b981', // emerald
  '#ec4899', // rose
  '#8b5cf6', // purple
  '#eab308', // amber
  '#06b6d4', // cyan
];

export function Dashboard({
  presentations = [],
  folders = [],
  templates = [],
  currentSection: controlledSection,
  onSectionChange,
  selectedFolderId: controlledFolderId,
  onFolderChange,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onSelectPresentation,
  onNewPresentation, // accepts (aspect_ratio, folderId)
  onDeletePresentation,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveToFolder,
  onMoveFolder,
  onUseTemplate,
  onEditTemplateSlides,
  onSaveTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  motionTemplates = [],
  onSaveMotionTemplate,
  onDeleteMotionTemplate,
  onDuplicateMotionTemplate,
  onUseMotionTemplate,
  onOpenAiOutline,
  onExportVideo,
  theme,
  toggleTheme,
}) {
  const [internalSection, setInternalSection] = useState('projects'); // 'projects' | 'templates' | 'motion-templates'
  const currentSection = controlledSection !== undefined ? controlledSection : internalSection;

  const handleSectionChange = useCallback((sec) => {
    setInternalSection(sec);
    if (onSectionChange) {
      onSectionChange(sec);
    }
  }, [onSectionChange]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | '16:9' | '9:16' | 'folder'
  const [internalFolderId, setInternalFolderId] = useState(null);
  const selectedFolderId = controlledFolderId !== undefined ? controlledFolderId : internalFolderId;
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Sync activeFilter with selectedFolderId
  useEffect(() => {
    if (selectedFolderId) {
      setActiveFilter('folder');
    } else {
      setActiveFilter((prev) => (prev === 'folder' ? 'all' : prev));
    }
  }, [selectedFolderId]);

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateMeta, setEditingTemplateMeta] = useState(null);

  // Navigation History Stack for < and > browser-style navigation
  const [history, setHistory] = useState([null]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // New Folder Modal / Popover state
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [newFolderParentId, setNewFolderParentId] = useState(null);

  // Move Modal State
  const [moveModalItem, setMoveModalItem] = useState(null); // { id, name/title, type: 'presentation' | 'folder', ... }

  // Navigate to a folder and record in history
  const navigateToFolder = useCallback((folderId, replace = false) => {
    setInternalFolderId(folderId);
    if (onFolderChange) {
      onFolderChange(folderId);
    }
    if (folderId) {
      setActiveFilter('folder');
    } else {
      setActiveFilter('all');
    }

    if (!replace) {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(folderId);
        return next;
      });
      setHistoryIndex((prev) => prev + 1);
    }
  }, [historyIndex, onFolderChange]);

  // Back button <
  const handleNavBack = () => {
    if (onGoBack) {
      onGoBack();
      return;
    }
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const targetFolderId = history[nextIndex];
      setHistoryIndex(nextIndex);
      setInternalFolderId(targetFolderId);
      if (onFolderChange) onFolderChange(targetFolderId);
      if (targetFolderId) {
        setActiveFilter('folder');
      } else {
        setActiveFilter('all');
      }
    }
  };

  // Forward button >
  const handleNavForward = () => {
    if (onGoForward) {
      onGoForward();
      return;
    }
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetFolderId = history[nextIndex];
      setHistoryIndex(nextIndex);
      setInternalFolderId(targetFolderId);
      if (onFolderChange) onFolderChange(targetFolderId);
      if (targetFolderId) {
        setActiveFilter('folder');
      } else {
        setActiveFilter('all');
      }
    }
  };

  // Up button (go to parent folder)
  const currentFolder = folders.find((f) => f.id === selectedFolderId);
  const handleNavUp = () => {
    if (currentFolder) {
      navigateToFolder(currentFolder.parent_id || null);
    }
  };

  // Build breadcrumb segments from root to current folder
  const breadcrumbPath = useMemo(() => {
    const crumbs = [{ id: null, name: 'Home' }];
    if (!selectedFolderId) return crumbs;

    const segments = [];
    let curr = folders.find((f) => f.id === selectedFolderId);
    while (curr) {
      segments.unshift({ id: curr.id, name: curr.name });
      curr = curr.parent_id ? folders.find((f) => f.id === curr.parent_id) : null;
    }

    return [...crumbs, ...segments];
  }, [selectedFolderId, folders]);

  // Subfolders in current level
  const currentSubfolders = useMemo(() => {
    // If searching, search across all folders
    if (searchQuery.trim()) {
      return folders.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // If a folder is selected, show folders whose parent_id matches
    if (selectedFolderId) {
      return folders.filter((f) => f.parent_id === selectedFolderId);
    }

    // At root Home: if 'all', show root folders (parent_id == null)
    if (activeFilter === 'all') {
      return folders.filter((f) => !f.parent_id);
    }

    // In format filters (16:9 or 9:16), don't show folders
    return [];
  }, [folders, selectedFolderId, activeFilter, searchQuery]);

  // Presentations in current level
  const currentPresentations = useMemo(() => {
    return presentations.filter((p) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (p.title || '').toLowerCase().includes(q);
      }

      // 2. Folder specific view
      if (selectedFolderId) {
        return p.folder_id === selectedFolderId;
      }

      // 3. Format view filters
      if (activeFilter === '16:9') {
        return (p.aspect_ratio || '16:9') === '16:9';
      }
      if (activeFilter === '9:16') {
        return p.aspect_ratio === '9:16';
      }

      // 4. Root Home 'all' view: show presentations directly at root (folder_id == null)
      return p.folder_id == null;
    });
  }, [presentations, searchQuery, selectedFolderId, activeFilter]);

  // Create folder inside current folder or specified parent
  const handleOpenCreateFolderModal = (parentId = selectedFolderId) => {
    setNewFolderParentId(parentId);
    setNewFolderName('');
    setNewFolderColor(FOLDER_COLORS[0]);
    setIsNewFolderModalOpen(true);
  };

  const handleCreateFolderSubmit = async (e) => {
    e.preventDefault();
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now();
    await onCreateFolder({
      id: `folder-${uuid}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      parent_id: newFolderParentId,
    });
    setIsNewFolderModalOpen(false);
  };

  // Move confirmation handler
  const handleConfirmMove = async (targetFolderId) => {
    if (!moveModalItem) return;
    if (moveModalItem.type === 'folder') {
      if (onMoveFolder) {
        await onMoveFolder(moveModalItem.id, targetFolderId);
      } else {
        await onUpdateFolder(moveModalItem.id, { parent_id: targetFolderId });
      }
    } else {
      await onMoveToFolder(moveModalItem.id, targetFolderId);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none">
      {/* Sidebar: Navigation, Formats & Folders Tree */}
      <FolderSidebar
        currentSection={currentSection}
        setCurrentSection={handleSectionChange}
        onSectionChange={handleSectionChange}
        templateCount={templates.length}
        activeFilter={activeFilter}
        setActiveFilter={(f) => {
          setActiveFilter(f);
          setSelectedFolderId(null);
        }}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={(id) => navigateToFolder(id)}
        folders={folders}
        presentations={presentations}
        motionTemplateCount={motionTemplates.length}
        onCreateFolder={onCreateFolder}
        onUpdateFolder={onUpdateFolder}
        onDeleteFolder={onDeleteFolder}
        onMoveFolder={(folder) => setMoveModalItem({ ...folder, type: 'folder' })}
        onOpenAiOutline={onOpenAiOutline}
      />

      {/* Main Content Area: Motion Templates Library, Templates Library or Projects/Folders */}
      {currentSection === 'motion-templates' ? (
        <MotionTemplateLibrary
          motionTemplates={motionTemplates}
          onSaveTemplate={onSaveMotionTemplate}
          onDeleteTemplate={onDeleteMotionTemplate}
          onDuplicateTemplate={onDuplicateMotionTemplate}
          onUseTemplate={onUseMotionTemplate}
        />
      ) : currentSection === 'templates' ? (
        <TemplateLibrary
          templates={templates}
          onUseTemplate={onUseTemplate}
          onCreateTemplate={() => {
            setEditingTemplateMeta(null);
            setIsTemplateModalOpen(true);
          }}
          onEditSlides={onEditTemplateSlides}
          onEditDetails={(tpl) => {
            setEditingTemplateMeta(tpl);
            setIsTemplateModalOpen(true);
          }}
          onDuplicateTemplate={onDuplicateTemplate}
          onDeleteTemplate={onDeleteTemplate}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Navbar: Navigation Controls, Breadcrumbs Pill, Search, View Switcher & Action Buttons */}
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-5 flex items-center justify-between z-10 transition-colors gap-4">
            {/* Left section: History Buttons < >, Up ↑, and Breadcrumbs */}
            <div className="flex items-center gap-2 min-w-0">
              {/* History Back / Forward */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200/80 dark:border-slate-700/80">
              <button
                type="button"
                onClick={handleNavBack}
                disabled={onGoBack ? !canGoBack : historyIndex <= 0}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-600 transition"
                title="Go Back"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNavForward}
                disabled={onGoForward ? !canGoForward : historyIndex >= history.length - 1}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-600 transition"
                title="Go Forward"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Up to Parent Button */}
            {selectedFolderId && (
              <button
                type="button"
                onClick={handleNavUp}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
                title="Up to Parent Folder"
              >
                <ArrowUp size={15} />
              </button>
            )}

            {/* GNOME / macOS Tahoe Style Breadcrumbs Pill */}
            <div className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-medium overflow-x-auto max-w-[340px] md:max-w-md no-scrollbar">
              {breadcrumbPath.map((crumb, idx) => {
                const isLast = idx === breadcrumbPath.length - 1;
                return (
                  <React.Fragment key={crumb.id || 'home'}>
                    <button
                      type="button"
                      onClick={() => navigateToFolder(crumb.id)}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg transition whitespace-nowrap ${
                        isLast
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {idx === 0 && <Home size={13} className="shrink-0" />}
                      <span>{crumb.name}</span>
                    </button>
                    {!isLast && (
                      <span className="text-slate-400 dark:text-slate-500 mx-0.5 font-mono">/</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Right section: Search, View Mode, New Actions, Theme */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Search Input */}
            <div className="relative w-44 md:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Grid / List View Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="List View"
              >
                <List size={15} />
              </button>
            </div>

            {/* New Folder Button */}
            <button
              onClick={() => handleOpenCreateFolderModal(selectedFolderId)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
              title={selectedFolderId ? "Create subfolder inside current folder" : "Create new folder"}
            >
              <FolderPlus size={14} className="text-amber-500" />
              <span className="hidden sm:inline">+ Folder</span>
            </button>

            {/* AI Outline Button */}
            {onOpenAiOutline && (
              <button
                onClick={onOpenAiOutline}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold shadow-xs transition"
                title="Create slides from AI outline markdown"
              >
                <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">+ AI Outline</span>
              </button>
            )}

            {/* New 16:9 Video */}
            <button
              onClick={() => onNewPresentation('16:9', selectedFolderId)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              title="Create new 16:9 Landscape Video presentation"
            >
              <Tv size={14} />
              <span className="hidden md:inline">+ 16:9 Video</span>
            </button>

            {/* New 9:16 Reel */}
            <button
              onClick={() => onNewPresentation('9:16', selectedFolderId)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              title="Create new 9:16 Vertical Reel / Short"
            >
              <Smartphone size={14} />
              <span className="hidden md:inline">+ 9:16 Reel</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* Header Title & Items Counter */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                {currentFolder ? (
                  <>
                    <div
                      className="w-4 h-4 rounded-md shadow-xs flex items-center justify-center text-white"
                      style={{ backgroundColor: currentFolder.color || '#f97316' }}
                    >
                      <Folder size={11} fill="white" />
                    </div>
                    <span>{currentFolder.name}</span>
                  </>
                ) : activeFilter === '16:9' ? (
                  <>
                    <Tv size={20} className="text-indigo-500" />
                    <span>16:9 Landscape Videos</span>
                  </>
                ) : activeFilter === '9:16' ? (
                  <>
                    <Smartphone size={20} className="text-rose-500" />
                    <span>9:16 Reels & Shorts</span>
                  </>
                ) : (
                  <>
                    <Layers size={20} className="text-blue-500" />
                    <span>Home & Projects</span>
                  </>
                )}
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {currentSubfolders.length} {currentSubfolders.length === 1 ? 'folder' : 'folders'} • {currentPresentations.length} {currentPresentations.length === 1 ? 'presentation' : 'presentations'}
                {searchQuery ? ` matching "${searchQuery}"` : ''}
              </p>
            </div>
          </div>

          {/* Empty State */}
          {currentSubfolders.length === 0 && currentPresentations.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                <FolderOpen size={30} />
              </div>
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
                {selectedFolderId ? `"${currentFolder?.name}" is empty` : 'No presentations or folders found'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mb-5">
                {searchQuery
                  ? `No items matching "${searchQuery}". Try a different keyword.`
                  : 'Start organizing your work by creating a subfolder, a 16:9 widescreen video, or a 9:16 vertical reel.'}
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  onClick={() => handleOpenCreateFolderModal(selectedFolderId)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  + Create Subfolder
                </button>
                {onOpenAiOutline && (
                  <button
                    onClick={onOpenAiOutline}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    <Sparkles size={14} />
                    <span>+ AI Outline</span>
                  </button>
                )}
                <button
                  onClick={() => onNewPresentation('16:9', selectedFolderId)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  + 16:9 Video
                </button>
                <button
                  onClick={() => onNewPresentation('9:16', selectedFolderId)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                >
                  + 9:16 Reel
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* ================= GRID VIEW ================= */
            <div className="space-y-8 animate-in fade-in duration-150">
              {/* 1. Folders Section */}
              {currentSubfolders.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
                    <Folder size={14} className="text-amber-500" />
                    <span>Folders ({currentSubfolders.length})</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {currentSubfolders.map((folder) => {
                      const childFolders = folders.filter((f) => f.parent_id === folder.id);
                      const childPres = presentations.filter((p) => p.folder_id === folder.id);
                      return (
                        <FolderCard
                          key={folder.id}
                          folder={folder}
                          subfolderCount={childFolders.length}
                          presentationCount={childPres.length}
                          onOpen={(id) => navigateToFolder(id)}
                          onAddSubfolder={(id) => handleOpenCreateFolderModal(id)}
                          onMove={(f) => setMoveModalItem({ ...f, type: 'folder' })}
                          onRename={(id, data) => onUpdateFolder(id, data)}
                          onDelete={(id) => onDeleteFolder(id)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Presentations & Reels Section */}
              {currentPresentations.length > 0 && (
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-2">
                    <Layers size={14} className="text-blue-500" />
                    <span>Presentations & Reels ({currentPresentations.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {currentPresentations.map((pres) => (
                      <PresentationCard
                        key={pres.id}
                        presentation={pres}
                        folders={folders}
                        onSelect={onSelectPresentation}
                        onDelete={onDeletePresentation}
                        onMoveToFolder={(presId) => {
                          const target = presentations.find((p) => p.id === presId);
                          if (target) setMoveModalItem({ ...target, type: 'presentation' });
                        }}
                        onExportVideo={onExportVideo}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================= LIST VIEW (TABLE) ================= */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-150">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Type / Format</th>
                    <th className="py-3 px-4">Items / Slides</th>
                    <th className="py-3 px-4">Updated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Folders in List */}
                  {currentSubfolders.map((folder) => {
                    const childPres = presentations.filter((p) => p.folder_id === folder.id);
                    const childFolders = folders.filter((f) => f.parent_id === folder.id);
                    return (
                      <tr
                        key={folder.id}
                        onClick={() => navigateToFolder(folder.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                      >
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                          <Folder size={18} fill={folder.color || '#f97316'} stroke="none" />
                          <span>{folder.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">Folder</td>
                        <td className="py-3 px-4 text-slate-500">
                          {childFolders.length} folders, {childPres.length} files
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {folder.updated_at ? new Date(folder.updated_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setMoveModalItem({ ...folder, type: 'folder' })}
                            className="px-2 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          >
                            Move
                          </button>
                          <button
                            onClick={() => onDeleteFolder(folder.id)}
                            className="px-2 py-1 text-rose-500 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Presentations in List */}
                  {currentPresentations.map((pres) => (
                    <tr
                      key={pres.id}
                      onClick={() => onSelectPresentation(pres)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                    >
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5">
                        {pres.aspect_ratio === '9:16' ? (
                          <Smartphone size={16} className="text-rose-500" />
                        ) : (
                          <Tv size={16} className="text-indigo-500" />
                        )}
                        <span className="truncate max-w-xs">{pres.title || 'Untitled'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          pres.aspect_ratio === '9:16'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300'
                            : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300'
                        }`}>
                          {pres.aspect_ratio === '9:16' ? '9:16 Reel' : '16:9 Video'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{pres.slide_count} slides</td>
                      <td className="py-3 px-4 text-slate-400">
                        {pres.updated_at ? new Date(pres.updated_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onExportVideo(pres)}
                          className="px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Export MP4
                        </button>
                        <button
                          onClick={() => setMoveModalItem({ ...pres, type: 'presentation' })}
                          className="px-2 py-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Move
                        </button>
                        <button
                          onClick={() => onDeletePresentation(pres.id)}
                          className="px-2 py-1 text-rose-500 hover:text-rose-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    )}

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateFolderSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus size={18} className="text-amber-500" />
                <span>
                  {newFolderParentId
                    ? `Create Subfolder inside "${folders.find(f => f.id === newFolderParentId)?.name || 'Folder'}"`
                    : 'Create New Folder'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose a folder name and color accent.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Folder Name
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Q3 Campaigns, Social Reels, Pitch Decks..."
                autoFocus
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewFolderColor(c)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      newFolderColor === c
                        ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900'
                        : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewFolderModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Move Item Modal */}
      {moveModalItem && (
        <MoveModal
          isOpen={true}
          item={moveModalItem}
          folders={folders}
          onClose={() => setMoveModalItem(null)}
          onConfirmMove={handleConfirmMove}
        />
      )}

      {/* Create / Edit Template Metadata Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        template={editingTemplateMeta}
        onClose={() => {
          setIsTemplateModalOpen(false);
          setEditingTemplateMeta(null);
        }}
        onSave={async (tplData) => {
          if (onSaveTemplate) {
            await onSaveTemplate(tplData);
          }
        }}
        onEditSlides={(tpl) => {
          if (onEditTemplateSlides) {
            onEditTemplateSlides(tpl);
          }
        }}
        onDelete={(templateId) => {
          setIsTemplateModalOpen(false);
          setEditingTemplateMeta(null);
          if (onDeleteTemplate) {
            onDeleteTemplate(templateId);
          }
        }}
      />


    </div>
  );
}
