import { useState, useCallback, useRef } from 'react';

export function generateId(prefix = 'id') {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  return prefix ? `${prefix}-${uuid}` : uuid;
}

export const DEFAULT_SLIDE = () => ({
  id: generateId('slide'),
  title: 'Untitled Slide',
  background: '#ffffff',
  transition_type: 'morph',
  transition_duration: 1.0,
  slide_duration: 3.0,
  elements: [],
});

export const DEFAULT_PRESENTATION = () => ({
  id: generateId('pres'),
  title: 'New Presentation',
  description: 'Built with JSON PPT Studio',
  width: 1280,
  height: 720,
  slides: [
    {
      id: generateId('slide'),
      title: 'Title Slide',
      background: '#ffffff',
      transition_type: 'morph',
      transition_duration: 1.0,
      slide_duration: 3.0,
      elements: [
        {
          id: generateId('el'),
          morph_id: 'title-heading',
          type: 'text',
          x: 140,
          y: 200,
          width: 1000,
          height: 120,
          rotation: 0,
          fill_color: null,
          stroke_color: null,
          stroke_width: 1,
          stroke_style: 'solid',
          arrow_head_start: false,
          arrow_head_end: false,
          text: 'Welcome to Slide Studio',
          font_size: 48,
          font_family: 'Arial',
          text_color: '#0f172a',
          font_bold: true,
          font_italic: false,
          text_align: 'center',
          z_index: 0,
        },
        {
          id: generateId('el'),
          type: 'text',
          x: 240,
          y: 330,
          width: 800,
          height: 60,
          rotation: 0,
          fill_color: null,
          stroke_color: null,
          stroke_width: 1,
          stroke_style: 'solid',
          arrow_head_start: false,
          arrow_head_end: false,
          text: 'Interactive visual canvas powered by JSON and FastAPI',
          font_size: 22,
          font_family: 'Arial',
          text_color: '#64748b',
          font_bold: false,
          font_italic: false,
          text_align: 'center',
          z_index: 1,
        },
      ],
    },
  ],
});

export function normalizePresentation(raw) {
  if (!raw) return DEFAULT_PRESENTATION();
  const p = JSON.parse(JSON.stringify(raw));
  p.slides = (p.slides || []).map((slide) => ({
    transition_type: slide.transition_type || 'morph',
    transition_duration: slide.transition_duration ?? 1.0,
    slide_duration: slide.slide_duration ?? 3.0,
    ...slide,
    elements: (slide.elements || []).map((el) => {
      const norm = { ...el };
      if (norm.morph_id === undefined) norm.morph_id = null;
      if (norm.content !== undefined && norm.text === undefined) norm.text = norm.content;
      if (norm.text !== undefined && norm.content === undefined) norm.content = norm.text;
      if (norm.fill !== undefined && norm.fill_color === undefined) norm.fill_color = norm.fill;
      if (norm.stroke !== undefined && norm.stroke_color === undefined) norm.stroke_color = norm.stroke;
      if (norm.font_color !== undefined && norm.text_color === undefined) norm.text_color = norm.font_color;
      if (norm.font_weight !== undefined && norm.font_bold === undefined) norm.font_bold = norm.font_weight === 'bold';
      if (norm.font_style !== undefined && norm.font_italic === undefined) norm.font_italic = norm.font_style === 'italic';
      if (norm.arrow_head) {
        norm.arrow_head_end = ['end', 'both'].includes(norm.arrow_head);
        norm.arrow_head_start = ['start', 'both'].includes(norm.arrow_head);
      }
      if (norm.group_id === undefined) norm.group_id = null;
      if (norm.x1 !== undefined && norm.x1 !== null && norm.x2 !== undefined && norm.x2 !== null) {
        norm.x = norm.x1;
        norm.y = norm.y1;
        norm.width = norm.x2 - norm.x1;
        norm.height = norm.y2 - norm.y1;
      }
      return norm;
    }),
  }));
  return p;
}

export function syncElementAttributes(el) {
  const synced = { ...el };
  if (synced.text !== undefined) synced.content = synced.text;
  if (synced.fill_color !== undefined) synced.fill = synced.fill_color;
  if (synced.stroke_color !== undefined) synced.stroke = synced.stroke_color;
  if (synced.text_color !== undefined) synced.font_color = synced.text_color;
  if (synced.font_bold !== undefined) synced.font_weight = synced.font_bold ? 'bold' : 'normal';
  if (synced.font_italic !== undefined) synced.font_style = synced.font_italic ? 'italic' : 'normal';
  if (synced.morph_id !== undefined) synced.morph_id = synced.morph_id || null;
  if (synced.group_id !== undefined) synced.group_id = synced.group_id || null;
  if (synced.arrow_head_start || synced.arrow_head_end) {
    if (synced.arrow_head_start && synced.arrow_head_end) synced.arrow_head = 'both';
    else if (synced.arrow_head_start) synced.arrow_head = 'start';
    else if (synced.arrow_head_end) synced.arrow_head = 'end';
  } else {
    synced.arrow_head = 'none';
  }
  if (synced.x !== undefined && synced.width !== undefined) {
    synced.x1 = synced.x;
    synced.x2 = synced.x + synced.width;
  }
  if (synced.y !== undefined && synced.height !== undefined) {
    synced.y1 = synced.y;
    synced.y2 = synced.y + synced.height;
  }
  return synced;
}

export function usePresentation(initialPresentation = null) {
  const MAX_HISTORY = 50;

  // Undo / Redo history stored as deep-cloned immutable snapshots in ref to avoid StrictMode double-call issues
  const historyRef = useRef([]);
  const historyIndexRef = useRef(0);
  const isUndoRedoAction = useRef(false);
  const [, setHistoryVersion] = useState(0);

  const [presentation, setPresentationState] = useState(() => {
    const initial = normalizePresentation(initialPresentation || DEFAULT_PRESENTATION());
    historyRef.current = [JSON.parse(JSON.stringify(initial))];
    historyIndexRef.current = 0;
    return initial;
  });
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [selectedElementIds, setSelectedElementIdsState] = useState([]);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'rectangle' | 'rounded_rectangle' | 'ellipse' | 'line' | 'arrow' | 'text'

  // Clipboard state for Cut/Copy/Paste across slides: { sourceSlideIndex: number, elements: ElementModel[] }
  const [clipboard, setClipboard] = useState(() => {
    try {
      const stored = localStorage.getItem('ppt_clipboard');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Style Clipboard state for Ctrl+Shift+C / Ctrl+Shift+V
  const [styleClipboard, setStyleClipboard] = useState(() => {
    try {
      const stored = localStorage.getItem('ppt_style_clipboard');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Set presentation with deterministic history tracking
  const updatePresentation = useCallback((newPresOrUpdater, recordHistory = true) => {
    setPresentationState((prev) => {
      const safePrev = (prev && prev.slides) ? prev : (historyRef.current[historyIndexRef.current] || DEFAULT_PRESENTATION());
      let nextPres = typeof newPresOrUpdater === 'function' ? newPresOrUpdater(safePrev) : newPresOrUpdater;
      if (!nextPres || !nextPres.slides) {
        nextPres = safePrev;
      }

      if (recordHistory && !isUndoRedoAction.current) {
        try {
          const snapshot = JSON.parse(JSON.stringify(nextPres));
          const currentIdx = historyIndexRef.current;
          const trimmed = historyRef.current.slice(0, Math.max(0, currentIdx + 1));
          trimmed.push(snapshot);
          if (trimmed.length > MAX_HISTORY) {
            trimmed.shift();
          }
          historyRef.current = trimmed;
          historyIndexRef.current = trimmed.length - 1;
          setHistoryVersion((v) => v + 1);
        } catch (err) {
          console.warn('Failed to snapshot presentation state for undo:', err);
        }
      }
      return nextPres;
    });
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      isUndoRedoAction.current = true;
      historyIndexRef.current -= 1;
      const targetPres = historyRef.current[historyIndexRef.current];
      if (targetPres && targetPres.slides) {
        try {
          const restored = normalizePresentation(JSON.parse(JSON.stringify(targetPres)));
          setPresentationState(restored);
          setActiveSlideIndex((prevIdx) => Math.max(0, Math.min(prevIdx, restored.slides.length - 1)));
          setSelectedElementIdsState([]);
          setHistoryVersion((v) => v + 1);
        } catch (err) {
          console.error('Error restoring undo state:', err);
        }
      }
      isUndoRedoAction.current = false;
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      isUndoRedoAction.current = true;
      historyIndexRef.current += 1;
      const targetPres = historyRef.current[historyIndexRef.current];
      if (targetPres && targetPres.slides) {
        try {
          const restored = normalizePresentation(JSON.parse(JSON.stringify(targetPres)));
          setPresentationState(restored);
          setActiveSlideIndex((prevIdx) => Math.max(0, Math.min(prevIdx, restored.slides.length - 1)));
          setSelectedElementIdsState([]);
          setHistoryVersion((v) => v + 1);
        } catch (err) {
          console.error('Error restoring redo state:', err);
        }
      }
      isUndoRedoAction.current = false;
    }
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  // Active slide with bulletproof fallback
  const safeSlides = Array.isArray(presentation?.slides) ? presentation.slides : [];
  const activeSlide = safeSlides[activeSlideIndex] || safeSlides[0] || DEFAULT_SLIDE();

  // Helper to expand a set of element IDs to include entire groups
  const resolveGroupIds = useCallback((slide, ids) => {
    if (!slide || !ids || ids.length === 0) return [];
    const idSet = new Set(ids);
    const groupIds = new Set();
    (slide.elements || []).forEach((el) => {
      if (idSet.has(el.id) && el.group_id) {
        groupIds.add(el.group_id);
      }
    });
    if (groupIds.size === 0) return Array.from(idSet);
    (slide.elements || []).forEach((el) => {
      if (el.group_id && groupIds.has(el.group_id)) {
        idSet.add(el.id);
      }
    });
    return Array.from(idSet);
  }, []);

  // Multi-element selection setter
  const setSelectedElementIds = useCallback((idsOrUpdater, autoExpandGroups = true) => {
    setSelectedElementIdsState((prev) => {
      const res = typeof idsOrUpdater === 'function' ? idsOrUpdater(prev) : idsOrUpdater;
      if (!res) return [];
      const arr = Array.isArray(res) ? res : [res];
      if (!autoExpandGroups) return arr;
      return resolveGroupIds(presentation.slides[activeSlideIndex], arr);
    });
  }, [activeSlideIndex, presentation.slides, resolveGroupIds]);

  // Backward-compatible single ID getter & setter
  const selectedElementId = selectedElementIds[0] || null;
  const setSelectedElementId = useCallback((idOrArrayOrFn) => {
    if (typeof idOrArrayOrFn === 'function') {
      setSelectedElementIdsState((prev) => {
        const single = prev[0] || null;
        const res = idOrArrayOrFn(single);
        if (!res) return [];
        const arr = Array.isArray(res) ? res : [res];
        return resolveGroupIds(presentation.slides[activeSlideIndex], arr);
      });
    } else if (!idOrArrayOrFn) {
      setSelectedElementIdsState([]);
    } else if (Array.isArray(idOrArrayOrFn)) {
      setSelectedElementIds(idOrArrayOrFn);
    } else {
      setSelectedElementIds([idOrArrayOrFn]);
    }
  }, [activeSlideIndex, presentation.slides, resolveGroupIds, setSelectedElementIds]);

  // Selected element objects
  const selectedElements = (activeSlide?.elements || []).filter((el) =>
    selectedElementIds.includes(el.id)
  );
  const selectedElement = selectedElements[0] || null;

  // Toggle or select an element with Shift key support
  const selectElement = useCallback((elementId, { toggle = false, multi = false, slideIndex = activeSlideIndex } = {}) => {
    if (!elementId) {
      setSelectedElementIdsState([]);
      return;
    }
    const currentSlide = presentation.slides[slideIndex];
    if (!currentSlide) return;
    const targetEl = currentSlide.elements.find((e) => e.id === elementId);
    const groupMembers = targetEl?.group_id
      ? currentSlide.elements.filter((e) => e.group_id === targetEl.group_id).map((e) => e.id)
      : [elementId];

    setSelectedElementIdsState((prev) => {
      if (toggle) {
        const isCurrentlySelected = groupMembers.some((id) => prev.includes(id));
        if (isCurrentlySelected) {
          return prev.filter((id) => !groupMembers.includes(id));
        } else {
          return [...prev, ...groupMembers];
        }
      } else if (multi) {
        return Array.from(new Set([...prev, ...groupMembers]));
      } else {
        return groupMembers;
      }
    });
  }, [activeSlideIndex, presentation.slides]);

  // Select all elements on the active slide
  const selectAllElements = useCallback(() => {
    const currentSlide = presentation.slides[activeSlideIndex];
    if (!currentSlide) return;
    setSelectedElementIdsState(currentSlide.elements.map((e) => e.id));
  }, [activeSlideIndex, presentation.slides]);

  // Slide actions
  const addSlide = useCallback((afterIndex = null) => {
    const newSlide = DEFAULT_SLIDE();
    newSlide.title = `Slide ${presentation.slides.length + 1}`;
    const insertAt = afterIndex !== null ? afterIndex + 1 : presentation.slides.length;
    
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      newSlides.splice(insertAt, 0, newSlide);
      return { ...prev, slides: newSlides };
    });
    setActiveSlideIndex(insertAt);
    setSelectedElementIdsState([]);
  }, [presentation.slides.length, updatePresentation]);

  const duplicateSlide = useCallback((index) => {
    const target = presentation.slides[index];
    if (!target) return;
    const duplicated = {
      ...JSON.parse(JSON.stringify(target)),
      id: generateId('slide'),
      title: `${target.title} (Copy)`,
      elements: target.elements.map((el) => {
        const morphId = el.morph_id || el.id;
        return {
          ...el,
          id: generateId('el'),
          morph_id: morphId,
        };
      }),
    };
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      // Ensure source slide elements also have morph_id set so both slides pair up
      newSlides[index] = {
        ...newSlides[index],
        elements: newSlides[index].elements.map((el) => ({
          ...el,
          morph_id: el.morph_id || el.id,
        })),
      };
      newSlides.splice(index + 1, 0, duplicated);
      return { ...prev, slides: newSlides };
    });
    setActiveSlideIndex(index + 1);
    setSelectedElementIdsState([]);
  }, [presentation.slides, updatePresentation]);

  const deleteSlide = useCallback((index) => {
    if (presentation.slides.length <= 1) return; // Keep at least one slide
    updatePresentation((prev) => {
      const newSlides = prev.slides.filter((_, i) => i !== index);
      return { ...prev, slides: newSlides };
    });
    setActiveSlideIndex((prevIdx) => Math.min(prevIdx, presentation.slides.length - 2));
    setSelectedElementIdsState([]);
  }, [presentation.slides.length, updatePresentation]);

  const reorderSlides = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const [moved] = newSlides.splice(fromIndex, 1);
      newSlides.splice(toIndex, 0, moved);
      return { ...prev, slides: newSlides };
    });
    setActiveSlideIndex(toIndex);
  }, [updatePresentation]);

  const updateSlideProperties = useCallback((partial) => {
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      newSlides[activeSlideIndex] = { ...newSlides[activeSlideIndex], ...partial };
      return { ...prev, slides: newSlides };
    });
  }, [activeSlideIndex, updatePresentation]);

  // Element actions
  const addElement = useCallback((element) => {
    const fullElement = {
      id: generateId('el'),
      rotation: 0,
      fill_color: '#3b82f6',
      stroke_color: '#1d4ed8',
      stroke_width: 2,
      stroke_style: 'solid',
      arrow_head_start: false,
      arrow_head_end: false,
      text: '',
      font_size: 18,
      font_family: 'Arial',
      text_color: '#0f172a',
      font_bold: false,
      font_italic: false,
      text_align: 'center',
      z_index: activeSlide?.elements.length || 0,
      group_id: null,
      ...element,
    };

    const syncedElement = syncElementAttributes(fullElement);

    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      newSlides[activeSlideIndex] = {
        ...slide,
        elements: [...slide.elements, syncedElement],
      };
      return { ...prev, slides: newSlides };
    });

    setSelectedElementIdsState([syncedElement.id]);
    return syncedElement;
  }, [activeSlideIndex, activeSlide, updatePresentation]);

  const updateElement = useCallback((elementId, partial, recordHistory = true) => {
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      if (!slide) return prev;
      newSlides[activeSlideIndex] = {
        ...slide,
        elements: slide.elements.map((el) =>
          el.id === elementId ? syncElementAttributes({ ...el, ...partial }) : el
        ),
      };
      return { ...prev, slides: newSlides };
    }, recordHistory);
  }, [activeSlideIndex, updatePresentation]);

  // Bulk update all currently selected elements
  const updateSelectedElements = useCallback((partial, recordHistory = true) => {
    if (selectedElementIds.length === 0) return;
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      if (!slide) return prev;
      newSlides[activeSlideIndex] = {
        ...slide,
        elements: slide.elements.map((el) =>
          selectedElementIds.includes(el.id) ? syncElementAttributes({ ...el, ...partial }) : el
        ),
      };
      return { ...prev, slides: newSlides };
    }, recordHistory);
  }, [activeSlideIndex, selectedElementIds, updatePresentation]);

  // Delete element or all currently selected elements
  const deleteElement = useCallback((elementId = null) => {
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      if (!slide) return prev;

      let idsToDelete = selectedElementIds;
      if (elementId && !selectedElementIds.includes(elementId)) {
        idsToDelete = [elementId];
      }
      if (idsToDelete.length === 0 && elementId) {
        idsToDelete = [elementId];
      }

      newSlides[activeSlideIndex] = {
        ...slide,
        elements: slide.elements.filter((el) => !idsToDelete.includes(el.id)),
      };
      return { ...prev, slides: newSlides };
    });
    setSelectedElementIdsState([]);
  }, [activeSlideIndex, selectedElementIds, updatePresentation]);

  // Duplicate element or all currently selected elements
  const duplicateElement = useCallback((elementId = null) => {
    const currentSlide = presentation.slides[activeSlideIndex];
    if (!currentSlide) return;

    let targetIds = selectedElementIds;
    if (elementId && !selectedElementIds.includes(elementId)) {
      targetIds = [elementId];
    }
    if (targetIds.length === 0) return;

    const groupMap = {};
    const clonedElements = targetIds
      .map((id) => {
        const el = currentSlide.elements.find((e) => e.id === id);
        if (!el) return null;
        let newGroupId = null;
        if (el.group_id) {
          if (!groupMap[el.group_id]) {
            groupMap[el.group_id] = generateId('grp');
          }
          newGroupId = groupMap[el.group_id];
        }
        const cloned = {
          ...JSON.parse(JSON.stringify(el)),
          id: generateId('el'),
          group_id: newGroupId,
          morph_id: null,
          x: el.x + 24,
          y: el.y + 24,
        };
        if (el.type === 'line' || el.type === 'arrow') {
          cloned.x1 = (el.x1 ?? el.x) + 24;
          cloned.y1 = (el.y1 ?? el.y) + 24;
          cloned.x2 = (el.x2 ?? (el.x + el.width)) + 24;
          cloned.y2 = (el.y2 ?? (el.y + el.height)) + 24;
        }
        return syncElementAttributes(cloned);
      })
      .filter(Boolean);

    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      newSlides[activeSlideIndex] = {
        ...slide,
        elements: [...slide.elements, ...clonedElements],
      };
      return { ...prev, slides: newSlides };
    });
    setSelectedElementIdsState(clonedElements.map((e) => e.id));
  }, [activeSlideIndex, presentation.slides, selectedElementIds, updatePresentation]);

  // Bring selected element(s) to front
  const bringToFront = useCallback((elementId = null) => {
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      if (!slide) return prev;
      const ids = elementId && !selectedElementIds.includes(elementId) ? [elementId] : selectedElementIds;
      const moving = slide.elements.filter((e) => ids.includes(e.id));
      const rest = slide.elements.filter((e) => !ids.includes(e.id));
      newSlides[activeSlideIndex] = {
        ...slide,
        elements: [...rest, ...moving],
      };
      return { ...prev, slides: newSlides };
    });
  }, [activeSlideIndex, selectedElementIds, updatePresentation]);

  // Send selected element(s) to back
  const sendToBack = useCallback((elementId = null) => {
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      if (!slide) return prev;
      const ids = elementId && !selectedElementIds.includes(elementId) ? [elementId] : selectedElementIds;
      const moving = slide.elements.filter((e) => ids.includes(e.id));
      const rest = slide.elements.filter((e) => !ids.includes(e.id));
      newSlides[activeSlideIndex] = {
        ...slide,
        elements: [...moving, ...rest],
      };
      return { ...prev, slides: newSlides };
    });
  }, [activeSlideIndex, selectedElementIds, updatePresentation]);

  // Group / Ungroup
  const groupSelected = useCallback(() => {
    if (selectedElementIds.length < 2) return;
    const newGroupId = generateId('grp');
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      if (!slide) return prev;
      newSlides[activeSlideIndex] = {
        ...slide,
        elements: slide.elements.map((el) =>
          selectedElementIds.includes(el.id)
            ? syncElementAttributes({ ...el, group_id: newGroupId })
            : el
        ),
      };
      return { ...prev, slides: newSlides };
    });
  }, [activeSlideIndex, selectedElementIds, updatePresentation]);

  const ungroupSelected = useCallback(() => {
    if (selectedElementIds.length === 0) return;
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      if (!slide) return prev;
      newSlides[activeSlideIndex] = {
        ...slide,
        elements: slide.elements.map((el) =>
          selectedElementIds.includes(el.id)
            ? syncElementAttributes({ ...el, group_id: null })
            : el
        ),
      };
      return { ...prev, slides: newSlides };
    });
  }, [activeSlideIndex, selectedElementIds, updatePresentation]);

  const canGroup = selectedElementIds.length >= 2;
  const canUngroup = selectedElements.some((el) => !!el.group_id);
  const isGroupSelected =
    selectedElements.length >= 2 &&
    selectedElements.every((el) => el.group_id && el.group_id === selectedElements[0].group_id);

  // Cross-slide Clipboard Operations (Cut, Copy, Paste)
  const copySelected = useCallback(() => {
    const currentSlide = presentation.slides[activeSlideIndex];
    if (!currentSlide) return;
    const toCopy = currentSlide.elements.filter((el) => selectedElementIds.includes(el.id));
    if (toCopy.length === 0) return;

    const clipData = {
      sourceSlideIndex: activeSlideIndex,
      elements: JSON.parse(JSON.stringify(toCopy)),
    };
    setClipboard(clipData);
    try {
      localStorage.setItem('ppt_clipboard', JSON.stringify(clipData));
    } catch {}
  }, [activeSlideIndex, presentation.slides, selectedElementIds]);

  const cutSelected = useCallback(() => {
    const currentSlide = presentation.slides[activeSlideIndex];
    if (!currentSlide) return;
    const toCut = currentSlide.elements.filter((el) => selectedElementIds.includes(el.id));
    if (toCut.length === 0) return;

    const clipData = {
      sourceSlideIndex: activeSlideIndex,
      elements: JSON.parse(JSON.stringify(toCut)),
    };
    setClipboard(clipData);
    try {
      localStorage.setItem('ppt_clipboard', JSON.stringify(clipData));
    } catch {}

    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      if (!slide) return prev;
      newSlides[activeSlideIndex] = {
        ...slide,
        elements: slide.elements.filter((el) => !selectedElementIds.includes(el.id)),
      };
      return { ...prev, slides: newSlides };
    });
    setSelectedElementIdsState([]);
  }, [activeSlideIndex, presentation.slides, selectedElementIds, updatePresentation]);

  const paste = useCallback(() => {
    let clipData = clipboard;
    if (!clipData) {
      try {
        const stored = localStorage.getItem('ppt_clipboard');
        if (stored) clipData = JSON.parse(stored);
      } catch {}
    }
    if (!clipData || !clipData.elements || clipData.elements.length === 0) return;

    const isSameSlide = activeSlideIndex === clipData.sourceSlideIndex;
    const offset = isSameSlide ? 24 : 0;

    const groupMap = {};
    const newElements = clipData.elements.map((el) => {
      let newGroupId = null;
      if (el.group_id) {
        if (!groupMap[el.group_id]) {
          groupMap[el.group_id] = generateId('grp');
        }
        newGroupId = groupMap[el.group_id];
      }

      const cloned = {
        ...JSON.parse(JSON.stringify(el)),
        id: generateId('el'),
        group_id: newGroupId,
        // If pasting to same slide, clear morph_id; if pasting to another slide, preserve morph_id for cross-slide morph transitions!
        morph_id: isSameSlide ? null : el.morph_id,
        x: Math.round((el.x ?? 0) + offset),
        y: Math.round((el.y ?? 0) + offset),
      };

      if (el.type === 'line' || el.type === 'arrow') {
        cloned.x1 = Math.round((el.x1 ?? el.x) + offset);
        cloned.y1 = Math.round((el.y1 ?? el.y) + offset);
        cloned.x2 = Math.round((el.x2 ?? (el.x + el.width)) + offset);
        cloned.y2 = Math.round((el.y2 ?? (el.y + el.height)) + offset);
      }

      return syncElementAttributes(cloned);
    });

    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      if (!slide) return prev;
      const baseZ = slide.elements.length;
      const elementsWithZ = newElements.map((el, i) => ({ ...el, z_index: baseZ + i }));
      newSlides[activeSlideIndex] = {
        ...slide,
        elements: [...slide.elements, ...elementsWithZ],
      };
      return { ...prev, slides: newSlides };
    });

    setSelectedElementIdsState(newElements.map((e) => e.id));
    if (isSameSlide) {
      setClipboard((prev) => (prev ? { ...prev, elements: newElements } : null));
    }
  }, [clipboard, activeSlideIndex, updatePresentation]);

  // Copy formatting & style attributes (PowerPoint Ctrl+Shift+C)
  const copyStyle = useCallback(() => {
    const target = selectedElements[0];
    if (!target) return;

    const styleData = {
      fill: target.fill,
      fill_color: target.fill_color || target.fill,
      fill_opacity: target.fill_opacity !== undefined ? target.fill_opacity : 1.0,
      stroke: target.stroke,
      stroke_color: target.stroke_color || target.stroke,
      stroke_width: target.stroke_width !== undefined ? target.stroke_width : 2,
      stroke_style: target.stroke_style || 'solid',
      stroke_opacity: target.stroke_opacity !== undefined ? target.stroke_opacity : 1.0,
      radius: target.radius,
      opacity: target.opacity !== undefined ? target.opacity : 1.0,
      font_size: target.font_size,
      font_family: target.font_family,
      font_weight: target.font_weight,
      font_bold: target.font_bold !== undefined ? target.font_bold : target.font_weight === 'bold',
      font_style: target.font_style,
      font_italic: target.font_italic !== undefined ? target.font_italic : target.font_style === 'italic',
      text_color: target.text_color || target.font_color,
      font_color: target.font_color || target.text_color,
      text_align: target.text_align,
      vertical_align: target.vertical_align,
      arrow_head: target.arrow_head,
      arrow_head_start: target.arrow_head_start,
      arrow_head_end: target.arrow_head_end,
      icon_badge: target.icon_badge,
      badge_color: target.badge_color,
      icon_color: target.icon_color,
    };

    setStyleClipboard(styleData);
    try {
      localStorage.setItem('ppt_style_clipboard', JSON.stringify(styleData));
    } catch {}
  }, [selectedElements]);

  // Paste formatting & style attributes onto selected elements (PowerPoint Ctrl+Shift+V)
  const pasteStyle = useCallback(() => {
    let styleData = styleClipboard;
    if (!styleData) {
      try {
        const stored = localStorage.getItem('ppt_style_clipboard');
        if (stored) styleData = JSON.parse(stored);
      } catch {}
    }
    if (!styleData || selectedElementIds.length === 0) return;

    const updates = {};
    for (const [k, v] of Object.entries(styleData)) {
      if (v !== undefined) {
        updates[k] = v;
      }
    }

    updateSelectedElements(updates);
  }, [styleClipboard, selectedElementIds.length, updateSelectedElements]);

  // PowerPoint Alignment Tools
  const alignSelected = useCallback((alignment) => {
    if (selectedElementIds.length < 2) return;
    updatePresentation((prev) => {
      const newSlides = [...prev.slides];
      const slide = newSlides[activeSlideIndex];
      if (!slide) return prev;
      const selected = slide.elements.filter((e) => selectedElementIds.includes(e.id));
      if (selected.length < 2) return prev;

      const minX = Math.min(...selected.map((e) => e.x));
      const maxX = Math.max(...selected.map((e) => e.x + e.width));
      const minY = Math.min(...selected.map((e) => e.y));
      const maxY = Math.max(...selected.map((e) => e.y + e.height));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      newSlides[activeSlideIndex] = {
        ...slide,
        elements: slide.elements.map((el) => {
          if (!selectedElementIds.includes(el.id)) return el;
          let nx = el.x;
          let ny = el.y;
          if (alignment === 'left') nx = minX;
          else if (alignment === 'center') nx = centerX - el.width / 2;
          else if (alignment === 'right') nx = maxX - el.width;
          else if (alignment === 'top') ny = minY;
          else if (alignment === 'middle') ny = centerY - el.height / 2;
          else if (alignment === 'bottom') ny = maxY - el.height;

          return syncElementAttributes({
            ...el,
            x: Math.round(nx),
            y: Math.round(ny),
          });
        }),
      };
      return { ...prev, slides: newSlides };
    });
  }, [activeSlideIndex, selectedElementIds, updatePresentation]);

  // Import / Insert multiple slides from template or external source
  const importSlides = useCallback((importedSlides, mode = 'insert_after', templateMeta = {}) => {
    if (!importedSlides || importedSlides.length === 0) return;

    const normalizedSlides = importedSlides.map((slide) => {
      const normSlide = {
        transition_type: slide.transition_type || 'morph',
        transition_duration: slide.transition_duration ?? 1.0,
        slide_duration: slide.slide_duration ?? 3.0,
        aspect_ratio: slide.aspect_ratio || templateMeta?.aspect_ratio || presentation.aspect_ratio || '16:9',
        ...slide,
      };
      normSlide.elements = (slide.elements || []).map((el) => {
        const normEl = { ...el };
        if (normEl.morph_id === undefined) normEl.morph_id = null;
        if (normEl.content !== undefined && normEl.text === undefined) normEl.text = normEl.content;
        if (normEl.text !== undefined && normEl.content === undefined) normEl.content = normEl.text;
        if (normEl.fill !== undefined && normEl.fill_color === undefined) normEl.fill_color = normEl.fill;
        if (normEl.stroke !== undefined && normEl.stroke_color === undefined) normEl.stroke_color = normEl.stroke;
        if (normEl.font_color !== undefined && normEl.text_color === undefined) normEl.text_color = normEl.font_color;
        if (normEl.group_id === undefined) normEl.group_id = null;
        return normEl;
      });
      return normSlide;
    });

    let targetActiveIndex = 0;

    updatePresentation((prev) => {
      const currentSlides = prev.slides || [];
      let updatedSlides = [];

      if (mode === 'replace') {
        updatedSlides = normalizedSlides;
        targetActiveIndex = 0;
      } else if (mode === 'append') {
        targetActiveIndex = currentSlides.length;
        updatedSlides = [...currentSlides, ...normalizedSlides];
      } else { // 'insert_after'
        const insertAt = Math.min(currentSlides.length, activeSlideIndex + 1);
        targetActiveIndex = insertAt;
        const copy = [...currentSlides];
        copy.splice(insertAt, 0, ...normalizedSlides);
        updatedSlides = copy;
      }

      // If replacing or if current deck only had 1 empty untitled slide, adopt template aspect ratio
      const isBlankDeck = currentSlides.length <= 1 && (!currentSlides[0]?.elements || currentSlides[0].elements.length === 0);
      const updatedAspectRatio = (mode === 'replace' || isBlankDeck) && templateMeta?.aspect_ratio
        ? templateMeta.aspect_ratio
        : prev.aspect_ratio || '16:9';

      return {
        ...prev,
        aspect_ratio: updatedAspectRatio,
        slides: updatedSlides,
      };
    });

    setActiveSlideIndex(targetActiveIndex);
    setSelectedElementIdsState([]);
  }, [activeSlideIndex, presentation.aspect_ratio, updatePresentation]);

  return {
    presentation,
    setPresentation: (p) => {
      if (typeof p === 'function') {
        updatePresentation((prev) => {
          const res = p(prev);
          return normalizePresentation(res);
        });
        return;
      }
      const norm = normalizePresentation(p || DEFAULT_PRESENTATION());
      setPresentationState(norm);
      historyRef.current = [JSON.parse(JSON.stringify(norm))];
      historyIndexRef.current = 0;
      setHistoryVersion((v) => v + 1);
      setActiveSlideIndex(0);
      setSelectedElementIdsState([]);
    },
    updatePresentation,
    importSlides,
    updatePresentationMeta: (meta) => updatePresentation((p) => ({ ...p, ...meta })),
    activeSlide,
    activeSlideIndex,
    setActiveSlideIndex: (idx) => {
      setActiveSlideIndex(idx);
      setSelectedElementIdsState([]);
    },
    selectedElement,
    selectedElements,
    selectedElementId,
    selectedElementIds,
    setSelectedElementId,
    setSelectedElementIds,
    selectElement,
    selectAllElements,
    activeTool,
    setActiveTool,
    addSlide,
    duplicateSlide,
    deleteSlide,
    reorderSlides,
    updateSlideProperties,
    addElement,
    updateElement,
    updateSelectedElements,
    deleteElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    groupSelected,
    ungroupSelected,
    canGroup,
    canUngroup,
    isGroupSelected,
    clipboard,
    copySelected,
    cutSelected,
    paste,
    styleClipboard,
    copyStyle,
    pasteStyle,
    alignSelected,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
