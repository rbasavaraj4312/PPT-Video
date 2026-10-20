import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Code2, 
  Play, 
  Sparkles, 
  Save, 
  Check, 
  Sliders, 
  Plus, 
  Trash2, 
  Layers, 
  Scan, 
  HelpCircle,
  Eye,
  RotateCcw,
  Palette
} from 'lucide-react';

const CATEGORIES = [
  { id: 'cards', label: 'HUD & Feature Cards' },
  { id: 'metrics', label: 'Metrics & Counters' },
  { id: 'clash', label: 'Versus & Comparison' },
  { id: 'ambient', label: 'Ambient Backgrounds' },
  { id: 'badges', label: 'Pills & Badges' },
  { id: 'general', label: 'General Motion' },
];

const STARTER_CODE = `<style>
  .custom-card {
    position: relative;
    width: 100%;
    height: 100%;
    padding: 24px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-sizing: border-box;
    background: {{card_bg}};
    border: 1.5px solid {{accent_color}}50;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }
  .custom-glow {
    position: absolute;
    top: -20px;
    right: -20px;
    width: 90px;
    height: 90px;
    background: {{accent_color}};
    filter: blur(40px);
    opacity: 0.35;
    animation: pulseGlow 2.5s ease-in-out infinite alternate;
  }
  .custom-tag {
    font-family: monospace;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.12em;
    padding: 3px 8px;
    border-radius: 4px;
    background: {{accent_color}}18;
    color: {{accent_color}};
    border: 1px solid {{accent_color}}40;
    display: inline-block;
  }
  .custom-heading {
    font-size: 20px;
    font-weight: 800;
    color: {{text_color}};
    margin: 8px 0 4px 0;
    line-height: 1.25;
  }
  .custom-desc {
    font-size: 11px;
    color: {{text_color}};
    opacity: 0.75;
    margin: 0;
    line-height: 1.4;
  }
  @keyframes pulseGlow {
    0% { transform: scale(0.9); opacity: 0.25; }
    100% { transform: scale(1.2); opacity: 0.45; }
  }
</style>

<div class="custom-card">
  <div class="custom-glow"></div>
  <div>
    <span class="custom-tag">{{tag}}</span>
    <h3 class="custom-heading">{{heading}}</h3>
    <p class="custom-desc">{{description}}</p>
  </div>
</div>`;

const STARTER_VARS = [
  { id: 'v1', key: 'tag', value: 'SYSTEM READY' },
  { id: 'v2', key: 'heading', value: 'Adaptive Motion Engine' },
  { id: 'v3', key: 'description', value: 'Unified HTML and CSS rendering with live custom variable bindings.' },
  { id: 'v4', key: 'accent_color', value: '#38bdf8' },
  { id: 'v5', key: 'card_bg', value: '#0a1128' },
  { id: 'v6', key: 'text_color', value: '#ffffff' },
];

export function MotionTemplateEditorModal({
  isOpen,
  onClose,
  template = null, // null for new, or existing MotionTemplateModel
  onSave,
  onInsertIntoSlide = null, // if opened from slide editor to directly insert
  onDeleteTemplate = null,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('cards');
  const [width, setWidth] = useState(420);
  const [height, setHeight] = useState(220);

  // Single unified code container for HTML + CSS
  const [code, setCode] = useState(STARTER_CODE);

  // Pure custom variables only (key, value)
  const [customVars, setCustomVars] = useState(STARTER_VARS);

  const [previewBg, setPreviewBg] = useState('#050814'); // canvas preview bg
  const [replayKey, setReplayKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activePane, setActivePane] = useState('both'); // 'both' | 'code' | 'preview'

  const textareaRef = useRef(null);

  // Populate state on open or template change
  useEffect(() => {
    if (isOpen) {
      if (template) {
        setName(template.name || 'Custom Motion Template');
        setDescription(template.description || '');
        setCategory(template.category || 'cards');
        setWidth(template.width || 420);
        setHeight(template.height || 220);
        setCode(template.code || STARTER_CODE);
        const rawVars = template.custom_vars || {};
        const varList = Object.entries(rawVars).map(([k, v], idx) => ({
          id: `var-${idx}-${k}`,
          key: k,
          value: String(v ?? ''),
        }));
        setCustomVars(varList.length > 0 ? varList : STARTER_VARS);
      } else {
        setName('New Motion Template');
        setDescription('Custom unified HTML & CSS animation template.');
        setCategory('cards');
        setWidth(420);
        setHeight(220);
        setCode(STARTER_CODE);
        setCustomVars(STARTER_VARS);
      }
      setSaveSuccess(false);
      setReplayKey((k) => k + 1);
    }
  }, [isOpen, template]);

  // Variables Map for interpolation
  const varsMap = useMemo(() => {
    const map = {};
    customVars.forEach((item) => {
      if (item.key && item.key.trim()) {
        map[item.key.trim()] = item.value;
      }
    });
    return map;
  }, [customVars]);

  // Interpolated code for live preview
  const interpolatedCode = useMemo(() => {
    return code.replace(/{{\s*([a-zA-Z0-9_\-.]+)\s*}}/gi, (match, varName) => {
      const trimmed = varName.trim();
      if (varsMap[trimmed] !== undefined && varsMap[trimmed] !== null) {
        return String(varsMap[trimmed]);
      }
      return match;
    });
  }, [code, varsMap]);

  if (!isOpen) return null;

  // Custom Variable Handlers
  const handleAddVariable = () => {
    const newId = `var-${Date.now()}`;
    const nextNum = customVars.length + 1;
    setCustomVars((prev) => [
      ...prev,
      { id: newId, key: `custom_var_${nextNum}`, value: 'Value' },
    ]);
  };

  const handleUpdateVarKey = (id, newKey) => {
    setCustomVars((prev) =>
      prev.map((item) => (item.id === id ? { ...item, key: newKey } : item))
    );
  };

  const handleUpdateVarValue = (id, newValue) => {
    setCustomVars((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value: newValue } : item))
    );
  };

  const handleDeleteVariable = (id) => {
    setCustomVars((prev) => prev.filter((item) => item.id !== id));
  };

  // Auto-detect variables from code: scans {{var_name}} in unified code
  const handleAutoDetectVars = () => {
    const matches = code.matchAll(/{{\s*([a-zA-Z0-9_\-.]+)\s*}}/gi);
    const foundKeys = new Set();
    for (const match of matches) {
      if (match[1]) foundKeys.add(match[1].trim());
    }

    const currentKeys = new Set(customVars.map((v) => v.key.trim()));
    const newEntries = [];

    foundKeys.forEach((key) => {
      if (!currentKeys.has(key)) {
        // Generate a sensible default based on key name
        let defaultVal = 'Text';
        if (key.includes('color') || key.includes('bg')) defaultVal = '#38bdf8';
        else if (key.includes('count') || key.includes('num')) defaultVal = '100';
        else if (key.includes('tag') || key.includes('badge')) defaultVal = 'FEATURE';
        newEntries.push({ id: `var-${Date.now()}-${key}`, key, value: defaultVal });
      }
    });

    if (newEntries.length > 0) {
      setCustomVars((prev) => [...prev, ...newEntries]);
    }
  };

  // Insert variable tag into code editor at cursor
  const handleInsertVarTag = (varKey) => {
    if (!textareaRef.current) return;
    const tag = `{{${varKey}}}`;
    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newCode = code.substring(0, start) + tag + code.substring(end);
    setCode(newCode);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + tag.length;
    }, 50);
  };

  // Handle Save
  const handleSaveSubmit = async (e) => {
    e?.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const templatePayload = {
        id: template?.id || `mot-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        category,
        width: Number(width) || 420,
        height: Number(height) || 220,
        code,
        custom_vars: varsMap,
        is_builtin: template?.is_builtin || false,
      };

      await onSave?.(templatePayload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(`Failed to save motion template: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Insert directly into active slide
  const handleInsertClick = () => {
    if (!onInsertIntoSlide) return;
    const templatePayload = {
      id: template?.id || `mot-${Date.now()}`,
      name: name.trim(),
      category,
      width: Number(width) || 420,
      height: Number(height) || 220,
      code,
      custom_vars: varsMap,
    };
    onInsertIntoSlide(templatePayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Code2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {template ? `Edit Motion Template: ${template.name}` : 'New Motion Template'}
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-400/20">
                  Unified HTML + CSS
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Single code container for full HTML markup and embedded &lt;style&gt; with custom variables.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            {template && onDeleteTemplate && (
              <button
                type="button"
                onClick={() => {
                  onDeleteTemplate(template.id);
                  onClose();
                }}
                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Delete Motion Template"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            )}

            {onInsertIntoSlide && (
              <button
                type="button"
                onClick={handleInsertClick}
                className="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Sparkles size={14} />
                <span>Insert to Slide</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveSubmit}
              disabled={isSaving}
              className={`py-1.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
              }`}
            >
              {saveSuccess ? <Check size={14} /> : <Save size={14} />}
              <span>{saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Template'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Template Meta Sub-bar */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hologram Grid Card"
              className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Width (px)
              </label>
              <input
                type="number"
                min="100"
                max="1280"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Height (px)
              </label>
              <input
                type="number"
                min="60"
                max="720"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this motion component..."
              className="w-full px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Main Split Body: Left (Code & Variables) / Right (Live 60fps Preview) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Left Column: Unified Code Editor & Variables Manager */}
          <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-800 min-h-0 bg-slate-50/50 dark:bg-slate-950/30">
            {/* Unified Code Editor Container */}
            <div className="flex-1 flex flex-col p-4 pb-2 min-h-0">
              <div className="flex items-center justify-between pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 size={14} className="text-blue-500" />
                    <span>Unified HTML + CSS Container</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    (&lt;style&gt; + HTML markup)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick insert tag dropdown */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <span>Insert:</span>
                    <div className="flex items-center gap-1 flex-wrap max-w-xs">
                      {customVars.slice(0, 4).map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleInsertVarTag(v.key)}
                          className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 font-mono text-[10px] transition"
                          title={`Insert {{${v.key}}}`}
                        >
                          {`{{${v.key}}}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDetectVars}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[11px] font-semibold flex items-center gap-1 transition"
                    title="Scan code for {{variable}} tags and add them to variables table"
                  >
                    <Scan size={12} />
                    <span>Auto-detect Variables</span>
                  </button>
                </div>
              </div>

              {/* Monospace Code Editor Textarea */}
              <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#0d1117] shadow-inner flex flex-col">
                <div className="px-3 py-1.5 bg-[#161b22] border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-1 text-slate-300 font-semibold">template.html</span>
                  </div>
                  <span>HTML & CSS in one container</span>
                </div>

                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="<style>\n  /* CSS here */\n</style>\n\n<div class='card'>\n  {{your_custom_var}}\n</div>"
                  spellCheck="false"
                  className="w-full flex-1 p-3.5 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-blue-600/40"
                />
              </div>
            </div>

            {/* Pure Custom Variables Manager Table */}
            <div className="h-56 border-t border-slate-200 dark:border-slate-800 p-4 pt-3 flex flex-col bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center justify-between pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders size={13} className="text-indigo-500" />
                    <span>Custom Variables Management</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (No forced default fields — only your custom variables)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddVariable}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition shadow-xs"
                >
                  <Plus size={13} />
                  <span>Add Custom Variable</span>
                </button>
              </div>

              {/* Table / List of Custom Variables */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {customVars.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                    <p className="font-medium">No custom variables defined.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Click "+ Add Custom Variable" or "Auto-detect Variables" to manage template placeholders.
                    </p>
                  </div>
                ) : (
                  customVars.map((v) => {
                    const isColor = typeof v.value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.value.trim());

                    return (
                      <div
                        key={v.id}
                        className="flex items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 group"
                      >
                        {/* Variable Key Placeholder */}
                        <div className="flex items-center gap-1 w-44 shrink-0">
                          <span className="text-slate-400 font-mono text-xs font-bold pl-1">{'{{'}</span>
                          <input
                            type="text"
                            value={v.key}
                            onChange={(e) => handleUpdateVarKey(v.id, e.target.value.replace(/[^a-zA-Z0-9_\-.]/g, ''))}
                            placeholder="var_name"
                            className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md font-mono text-xs text-blue-600 dark:text-blue-400 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-slate-400 font-mono text-xs font-bold">{'}}'}</span>
                        </div>

                        {/* Variable Value (Color preview or text/number) */}
                        <div className="flex-1 flex items-center gap-1.5">
                          {isColor && (
                            <input
                              type="color"
                              value={v.value}
                              onChange={(e) => handleUpdateVarValue(v.id, e.target.value)}
                              className="w-7 h-7 p-0 rounded border border-slate-300 dark:border-slate-600 cursor-pointer shrink-0"
                            />
                          )}

                          <input
                            type="text"
                            value={v.value}
                            onChange={(e) => handleUpdateVarValue(v.id, e.target.value)}
                            placeholder="Default value..."
                            className="flex-1 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                          />
                        </div>

                        {/* Delete Variable Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteVariable(v.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                          title="Delete Variable"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Live 60fps Preview & Testing Sandbox */}
          <div className="w-full md:w-[480px] lg:w-[520px] flex flex-col bg-slate-900 dark:bg-slate-950 p-4 shrink-0 min-h-0">
            {/* Preview Toolbar */}
            <div className="flex items-center justify-between pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={14} className="text-cyan-400" />
                  <span>Live 60fps Motion Preview</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  ({width}×{height}px)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Canvas Background switchers */}
                <button
                  type="button"
                  onClick={() => setPreviewBg('#050814')}
                  title="Dark Navy Canvas"
                  className={`w-5 h-5 rounded-md border ${previewBg === '#050814' ? 'border-cyan-400 scale-110' : 'border-slate-700'}`}
                  style={{ backgroundColor: '#050814' }}
                />
                <button
                  type="button"
                  onClick={() => setPreviewBg('#000000')}
                  title="Pure Black Canvas"
                  className={`w-5 h-5 rounded-md border ${previewBg === '#000000' ? 'border-cyan-400 scale-110' : 'border-slate-700'}`}
                  style={{ backgroundColor: '#000000' }}
                />
                <button
                  type="button"
                  onClick={() => setPreviewBg('#1e293b')}
                  title="Slate Canvas"
                  className={`w-5 h-5 rounded-md border ${previewBg === '#1e293b' ? 'border-cyan-400 scale-110' : 'border-slate-700'}`}
                  style={{ backgroundColor: '#1e293b' }}
                />

                <div className="w-px h-4 bg-slate-800 mx-1" />

                <button
                  type="button"
                  onClick={() => setReplayKey((k) => k + 1)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                  title="Restart animation playback"
                >
                  <RotateCcw size={12} />
                  <span>Replay</span>
                </button>
              </div>
            </div>

            {/* Visual Preview Frame */}
            <div 
              className="flex-1 rounded-2xl border border-slate-800 flex items-center justify-center p-4 overflow-hidden relative shadow-2xl"
              style={{ backgroundColor: previewBg }}
            >
              <div
                key={replayKey}
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
                className="relative shrink-0"
                dangerouslySetInnerHTML={{ __html: interpolatedCode }}
              />
            </div>

            {/* Quick Variable Value Overrides Notice */}
            <div className="pt-3 text-[11px] text-slate-400 text-center">
              Variables in preview update in real-time as you type. When placed on slides, the property panel will render inputs for these variables only.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
