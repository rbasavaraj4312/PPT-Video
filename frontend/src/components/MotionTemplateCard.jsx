import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Trash2, 
  Play, 
  Check, 
  Copy, 
  Edit3, 
  Code2, 
  Sliders, 
  Layers, 
  Zap, 
  Radio, 
  Square, 
  CircleDot,
  MoreVertical 
} from 'lucide-react';

const CATEGORY_META = {
  cards: {
    label: 'HUD & Feature Cards',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-400/30',
    icon: Square,
  },
  metrics: {
    label: 'Metrics & Counters',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-400/30',
    icon: Zap,
  },
  clash: {
    label: 'Versus & Comparison',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-400/30',
    icon: Radio,
  },
  ambient: {
    label: 'Ambient Backgrounds',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-400/30',
    icon: CircleDot,
  },
  badges: {
    label: 'Pills & Badges',
    badgeClass: 'bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300 border-pink-400/30',
    icon: Sparkles,
  },
  general: {
    label: 'General Motion',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-400/30',
    icon: Layers,
  },
};

export function MotionTemplateCard({
  template,
  onUseTemplate,
  onEditTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  canInsert = false,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const catMeta = CATEGORY_META[template.category] || CATEGORY_META.general;
  const CatIcon = catMeta.icon;
  const customVars = template.custom_vars || {};
  const varCount = Object.keys(customVars).length;

  const width = template.width || 420;
  const height = template.height || 220;

  // Process HTML + CSS replacing {{var_name}}
  const processedCode = useMemo(() => {
    const raw = template.code || '<div style="padding: 20px; color: #fff;">Empty Motion Template</div>';
    return raw.replace(/{{\s*([a-zA-Z0-9_\-.]+)\s*}}/gi, (match, varName) => {
      const trimmed = varName.trim();
      if (customVars[trimmed] !== undefined && customVars[trimmed] !== null) {
        return String(customVars[trimmed]);
      }
      return match;
    });
  }, [template.code, customVars]);

  // Unique container ID to scope styles
  const previewScopeId = `mot-card-${(template.id || 'preview').replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Compute thumbnail scale to fit into 260px wide by 170px high preview box
  const targetW = 280;
  const targetH = 170;
  const scale = Math.min(targetW / width, targetH / height, 0.95);

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden select-none">
      {/* Visual Live Preview Viewport */}
      <div 
        className="relative bg-slate-950 p-2 flex items-center justify-center overflow-hidden border-b border-slate-200/60 dark:border-slate-800/80"
        style={{ height: '190px' }}
      >
        {/* Isolated Widget Container */}
        <div
          key={replayKey}
          id={previewScopeId}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="relative pointer-events-none shrink-0"
          dangerouslySetInnerHTML={{ __html: processedCode }}
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-20">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 border shadow-xs ${catMeta.badgeClass}`}>
            <CatIcon size={10} />
            <span>{catMeta.label}</span>
          </span>
          {template.is_builtin && (
            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Built-in
            </span>
          )}
        </div>

        {/* Top Right Quick Menu */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setReplayKey((k) => k + 1);
            }}
            title="Replay animation"
            className="p-1 rounded-lg bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white backdrop-blur-xs transition"
          >
            <Play size={12} fill="currentColor" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 rounded-lg bg-black/60 hover:bg-black/80 text-slate-300 hover:text-white backdrop-blur-xs transition"
            >
              <MoreVertical size={13} />
            </button>

            {isMenuOpen && (
              <div 
                className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEditTemplate?.(template);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2"
                >
                  <Edit3 size={13} className="text-blue-500" />
                  <span>Edit Code & Variables</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDuplicateTemplate?.(template);
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2"
                >
                  <Copy size={13} className="text-indigo-500" />
                  <span>Duplicate</span>
                </button>

                {onDeleteTemplate && (
                  <>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDeleteTemplate?.(template.id);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                    >
                      <Trash2 size={13} />
                      <span>Delete Template</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Info & Meta */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate" title={template.name}>
              {template.name}
            </h3>
            <span className="text-[11px] font-mono text-slate-400 shrink-0">
              {width}×{height}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 min-h-[32px] leading-relaxed">
            {template.description || 'Custom HTML & CSS motion template with dynamic custom variables.'}
          </p>

          {/* Variables Count Tag */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            <Sliders size={12} className="text-indigo-500" />
            <span>
              {varCount} custom {varCount === 1 ? 'variable' : 'variables'}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Code2 size={12} className="text-cyan-500" />
            <span>Unified HTML + CSS</span>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => onEditTemplate?.(template)}
            className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Edit3 size={13} />
            <span>Edit Code</span>
          </button>

          {canInsert && onUseTemplate ? (
            <button
              type="button"
              onClick={() => onUseTemplate?.(template)}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <Sparkles size={13} />
              <span>Insert</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onDuplicateTemplate?.(template)}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition"
              title="Duplicate Template"
            >
              <Copy size={13} />
            </button>
          )}

          {onDeleteTemplate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTemplate?.(template.id);
              }}
              className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 text-xs font-medium transition"
              title="Delete Template"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
