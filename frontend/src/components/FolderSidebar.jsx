import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen,
  FolderPlus, 
  Tv, 
  Smartphone, 
  Layers, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  ChevronRight,
  ChevronDown,
  CornerDownRight,
  FolderInput,
  Plus,
  Sparkles,
  Home,
  LayoutTemplate
} from 'lucide-react';

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

export function FolderSidebar({
  currentSection = 'projects',
  setCurrentSection,
  onSectionChange,
  templateCount = 0,
  motionTemplateCount = 0,
  activeFilter,
  setActiveFilter,
  selectedFolderId,
  setSelectedFolderId,
  folders = [],
  presentations = [],
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveFolder,
  onOpenAiOutline,
}) {
  const changeSection = (sec) => {
    if (typeof setCurrentSection === 'function') setCurrentSection(sec);
    if (typeof onSectionChange === 'function') onSectionChange(sec);
  };

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [creatingParentId, setCreatingParentId] = useState(null); // null for root, or parent_id
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [openMenuFolderId, setOpenMenuFolderId] = useState(null);

  const [expandedFolders, setExpandedFolders] = useState(() => {
    const s = new Set();
    folders.forEach((f) => s.add(f.id));
    return s;
  });

  // Counts
  const totalCount = presentations.length;
  const longVideoCount = presentations.filter((p) => (p.aspect_ratio || '16:9') === '16:9').length;
  const reelsCount = presentations.filter((p) => p.aspect_ratio === '9:16').length;

  // Folder tree structure
  const folderTree = useMemo(() => {
    const map = {};
    const roots = [];
    folders.forEach((f) => {
      map[f.id] = { ...f, children: [] };
    });
    folders.forEach((f) => {
      if (f.parent_id && map[f.parent_id]) {
        map[f.parent_id].children.push(map[f.id]);
      } else {
        roots.push(map[f.id]);
      }
    });
    return roots;
  }, [folders]);

  const toggleExpand = (folderId, e) => {
    e.stopPropagation();
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const startCreateSubfolder = (parentId) => {
    setCreatingParentId(parentId);
    setNewFolderName('');
    setNewFolderColor(FOLDER_COLORS[0]);
    setIsCreatingFolder(true);
    setOpenMenuFolderId(null);
    if (parentId) {
      setExpandedFolders((prev) => new Set([...prev, parentId]));
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder({
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      parent_id: creatingParentId,
    });
    setNewFolderName('');
    setIsCreatingFolder(false);
    setCreatingParentId(null);
  };

  const handleEditSubmit = (folderId) => {
    if (!editingFolderName.trim()) {
      setEditingFolderId(null);
      return;
    }
    onUpdateFolder(folderId, { name: editingFolderName.trim() });
    setEditingFolderId(null);
  };

  const renderFolderTreeItem = (folder, depth = 0) => {
    const isSelected = selectedFolderId === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const folderPresCount = presentations.filter((p) => p.folder_id === folder.id).length;

    return (
      <div key={folder.id} className="relative group/folder">
        <div
          onClick={() => {
            changeSection('projects');
            setSelectedFolderId(folder.id);
            setActiveFilter('folder');
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`flex items-center justify-between py-1.5 pr-2 rounded-xl text-xs font-medium transition cursor-pointer ${
            isSelected && currentSection === 'projects'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className={`p-0.5 rounded transition ${
                  isSelected ? 'hover:bg-blue-700 text-white' : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-400'
                }`}
              >
                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : (
              <span className="w-3.5" />
            )}

            <Folder
              size={15}
              fill={isSelected && currentSection === 'projects' ? '#ffffff' : folder.color || '#f97316'}
              stroke="none"
              className="shrink-0 drop-shadow-xs"
            />

            {editingFolderId === folder.id ? (
              <input
                type="text"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onBlur={() => handleEditSubmit(folder.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSubmit(folder.id);
                  if (e.key === 'Escape') setEditingFolderId(null);
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="w-24 px-1 py-0.5 text-xs rounded bg-white text-slate-900 border border-blue-400 outline-none"
              />
            ) : (
              <span className="truncate max-w-[110px]" title={folder.name}>
                {folder.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {folderPresCount > 0 && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isSelected && currentSection === 'projects' ? 'bg-blue-500 text-white' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500'
              }`}>
                {folderPresCount}
              </span>
            )}

            {/* Menu Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuFolderId(openMenuFolderId === folder.id ? null : folder.id);
                }}
                className={`p-1 rounded opacity-0 group-hover/folder:opacity-100 transition ${
                  isSelected && currentSection === 'projects' ? 'hover:bg-blue-700 text-white' : 'hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-400'
                }`}
              >
                <MoreVertical size={13} />
              </button>

              {openMenuFolderId === folder.id && (
                <div 
                  className="absolute right-0 top-6 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => startCreateSubfolder(folder.id)}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Plus size={13} className="text-emerald-500" />
                    <span>New Subfolder</span>
                  </button>

                  {onMoveFolder && (
                    <button
                      onClick={() => {
                        setOpenMenuFolderId(null);
                        onMoveFolder(folder);
                      }}
                      className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                      <FolderInput size={13} className="text-indigo-500" />
                      <span>Move Folder...</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setOpenMenuFolderId(null);
                      setEditingFolderId(folder.id);
                      setEditingFolderName(folder.name);
                    }}
                    className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Edit2 size={13} className="text-amber-500" />
                    <span>Rename</span>
                  </button>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  <button
                    onClick={() => {
                      setOpenMenuFolderId(null);
                      onDeleteFolder(folder.id);
                    }}
                    className="w-full text-left px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nested Subfolders */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Visual tree guide line */}
            <div 
              className="absolute left-[18px] top-1 bottom-1 w-px bg-slate-200 dark:bg-slate-800 pointer-events-none"
              style={{ left: `${depth * 14 + 16}px` }}
            />
            {folder.children.map((child) => renderFolderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full select-none">
      {/* Primary Section Switcher: Projects vs Templates */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-1">
        <button
          type="button"
          onClick={() => changeSection('projects')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
            currentSection === 'projects'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={15} />
            <span>Projects & Files</span>
          </div>
          <span className="text-[10px] font-mono opacity-80">{totalCount}</span>
        </button>

        <button
          type="button"
          onClick={() => changeSection('templates')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
            currentSection === 'templates'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <LayoutTemplate size={15} />
            <span>Template Library</span>
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            currentSection === 'templates' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
          }`}>
            {templateCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => changeSection('motion-templates')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
            currentSection === 'motion-templates'
              ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={15} />
            <span>Motion Templates</span>
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            currentSection === 'motion-templates' ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300'
          }`}>
            {motionTemplateCount}
          </span>
        </button>
      </div>

      {/* Quick Access Views */}
      <div className="p-3 space-y-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 px-2">
          Quick Access
        </div>

        {/* All Presentations */}
        <button
          onClick={() => {
            changeSection('projects');
            setActiveFilter('all');
            setSelectedFolderId(null);
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
            activeFilter === 'all' && !selectedFolderId && currentSection === 'projects'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers size={15} />
            <span>All Projects</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            activeFilter === 'all' && !selectedFolderId && currentSection === 'projects'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {totalCount}
          </span>
        </button>

        {/* 16:9 Long Videos */}
        <button
          onClick={() => {
            changeSection('projects');
            setActiveFilter('16:9');
            setSelectedFolderId(null);
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
            activeFilter === '16:9' && !selectedFolderId && currentSection === 'projects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Tv size={15} />
            <span>16:9 Long Videos</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            activeFilter === '16:9' && !selectedFolderId && currentSection === 'projects'
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {longVideoCount}
          </span>
        </button>

        {/* 9:16 Reels & Shorts */}
        <button
          onClick={() => {
            changeSection('projects');
            setActiveFilter('9:16');
            setSelectedFolderId(null);
          }}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
            activeFilter === '9:16' && !selectedFolderId && currentSection === 'projects'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800/80'
          }`}
        >
          <div className="flex items-center gap-2">
            <Smartphone size={15} />
            <span>9:16 Reels & Shorts</span>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            activeFilter === '9:16' && !selectedFolderId && currentSection === 'projects'
              ? 'bg-rose-500 text-white'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {reelsCount}
          </span>
        </button>
      </div>

      <div className="h-px bg-slate-200 dark:bg-slate-800 mx-4 my-1" />

      {/* Middle Section: Folders Tree */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Folders
          </span>
          <button
            onClick={() => {
              setCreatingParentId(null);
              setIsCreatingFolder(true);
            }}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            title="Create New Root Folder"
          >
            <FolderPlus size={15} />
          </button>
        </div>

        {/* Inline Folder Creation */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateSubmit} className="mb-2 p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <div className="text-[10px] text-slate-400 font-medium">
              {creatingParentId
                ? `Subfolder inside ${folders.find(f => f.id === creatingParentId)?.name || 'Folder'}`
                : 'New Root Folder'}
            </div>
            <input
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
              className="w-full px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {/* Color options */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewFolderColor(c)}
                  className={`w-3.5 h-3.5 rounded-full transition-transform ${
                    newFolderColor === c ? 'scale-125 ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-800' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingFolder(false);
                  setCreatingParentId(null);
                }}
                className="px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-0.5 text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-xs transition"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Folder Tree Scrollable List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
          {folderTree.length === 0 ? (
            <div className="text-center py-6 px-2 text-slate-400 dark:text-slate-500 text-xs">
              No folders yet. Click <span className="font-semibold text-slate-600 dark:text-slate-300">+</span> above to create one.
            </div>
          ) : (
            folderTree.map((rootFolder) => renderFolderTreeItem(rootFolder, 0))
          )}
        </div>
      </div>

      {/* Bottom Action: AI Outline Studio */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onOpenAiOutline}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Sparkles size={14} />
          <span>AI Outline Studio</span>
        </button>
      </div>
    </aside>
  );
}
