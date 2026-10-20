import React, { useState, useMemo } from 'react';
import { 
  X, 
  Folder, 
  FolderOpen, 
  Home, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Search,
  FolderInput,
  AlertCircle
} from 'lucide-react';

export function MoveModal({
  isOpen,
  onClose,
  item, // { id, name, title, type: 'presentation' | 'folder', current_folder_id }
  folders = [],
  onConfirmMove,
}) {
  const [selectedFolderId, setSelectedFolderId] = useState(
    item?.current_folder_id || item?.folder_id || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolderIds, setExpandedFolderIds] = useState(() => {
    const s = new Set();
    folders.forEach((f) => s.add(f.id));
    return s;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !item) return null;

  const isFolderItem = item.type === 'folder' || (!item.aspect_ratio && !item.slides);
  const itemName = item.name || item.title || 'Untitled';
  const currentFolderId = isFolderItem ? item.parent_id : item.folder_id;

  // Find all descendant IDs of the item if moving a folder (to prevent circular nesting)
  const descendantFolderIds = useMemo(() => {
    if (!isFolderItem) return new Set();
    const descendants = new Set([item.id]);
    let added = true;
    while (added) {
      added = false;
      for (const f of folders) {
        if (descendants.has(f.parent_id) && !descendants.has(f.id)) {
          descendants.add(f.id);
          added = true;
        }
      }
    }
    return descendants;
  }, [isFolderItem, item.id, folders]);

  // Build tree hierarchy
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
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleMove = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirmMove(selectedFolderId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to move item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFolderItem = (folder, depth = 0) => {
    const isCurrent = currentFolderId === folder.id;
    const isInvalid = isFolderItem && descendantFolderIds.has(folder.id);
    const isSelected = selectedFolderId === folder.id;
    const isExpanded = expandedFolderIds.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;

    // Search filter
    if (searchQuery.trim()) {
      const matchesSelf = folder.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChild = hasChildren && folder.children.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSelf && !matchesChild) return null;
    }

    return (
      <div key={folder.id} className="select-none">
        <div
          onClick={() => {
            if (!isInvalid && !isCurrent) {
              setSelectedFolderId(folder.id);
            }
          }}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          className={`flex items-center justify-between py-2 pr-3 rounded-xl transition text-xs font-medium ${
            isInvalid || isCurrent
              ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
              : isSelected
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(folder.id, e)}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-4" />
            )}

            <Folder 
              size={16} 
              fill={folder.color || '#f97316'} 
              stroke="none" 
              className="shrink-0"
            />
            <span className="truncate">{folder.name}</span>
            {isCurrent && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                (Current)
              </span>
            )}
            {isInvalid && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                (Cannot move here)
              </span>
            )}
          </div>

          {isSelected && <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {folder.children.map((child) => renderFolderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <FolderInput size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Move {isFolderItem ? 'Folder' : 'Presentation'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                Moving "{itemName}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search destination folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Folder Hierarchy List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1">
          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-2">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Root Directory (Home) */}
          <div
            onClick={() => {
              if (currentFolderId !== null) {
                setSelectedFolderId(null);
              }
            }}
            className={`flex items-center justify-between py-2 px-3 rounded-xl transition text-xs font-medium cursor-pointer ${
              currentFolderId === null
                ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                : selectedFolderId === null
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Home size={15} className="text-slate-500" />
              <span>Root Directory (Home)</span>
              {currentFolderId === null && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                  (Current)
                </span>
              )}
            </div>
            {selectedFolderId === null && <Check size={14} className="text-blue-600 dark:text-blue-400" />}
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

          {/* Folder Tree Items */}
          {folderTree.map((rootFolder) => renderFolderItem(rootFolder, 0))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleMove}
            disabled={isSubmitting || selectedFolderId === currentFolderId}
            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
          >
            <span>Move Here</span>
          </button>
        </div>
      </div>
    </div>
  );
}
