import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { ICON_CATEGORIES, searchIcons, getIconComponent } from '../data/iconLibrary';

export function IconPickerPopover({ isOpen, onClose, onSelectIcon, anchorPosition }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const popoverRef = useRef(null);
  const inputRef = useRef(null);

  const filteredIcons = searchIcons(query, activeCategory);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-96 max-w-[95vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all animate-in fade-in zoom-in-95 duration-150"
      style={{
        top: anchorPosition?.top ? `${anchorPosition.top}px` : '4.5rem',
        left: anchorPosition?.left ? `${anchorPosition.left}px` : '50%',
        transform: anchorPosition?.left ? 'none' : 'translateX(-50%)',
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/60">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search icons (db, server, aws, user)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition"
          title="Close (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto no-scrollbar bg-white dark:bg-slate-900">
        {ICON_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md whitespace-nowrap transition-colors ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Icons Grid */}
      <div className="p-3 max-h-72 overflow-y-auto grid grid-cols-4 gap-2 bg-slate-50/40 dark:bg-slate-950/20">
        {filteredIcons.length === 0 ? (
          <div className="col-span-4 py-8 text-center text-xs text-slate-400">
            No icons found matching "{query}"
          </div>
        ) : (
          filteredIcons.map((item) => {
            const IconComp = getIconComponent(item.componentName);
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectIcon(item);
                  onClose();
                }}
                className="group flex flex-col items-center justify-center p-2.5 rounded-xl border border-transparent hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-800/80 hover:bg-blue-50/50 dark:hover:bg-blue-950/40 hover:shadow-sm transition-all"
                title={`${item.name} (${item.tags.join(', ')})`}
              >
                <div className="w-8 h-8 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <IconComp size={22} strokeWidth={1.8} />
                </div>
                <span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 truncate w-full text-center">
                  {item.name}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-slate-100/70 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <span>{filteredIcons.length} symbols available</span>
        <span>Click to insert • Esc to close</span>
      </div>
    </div>
  );
}
