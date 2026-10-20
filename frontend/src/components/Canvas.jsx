import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Scan, Hand, Magnet } from 'lucide-react';
import { SlideElement } from '../rendering/SlideElement';
import { alignmentTargets, selectionBounds, snapDrag } from '../rendering/alignmentGuides.js';

const DEFAULT_CANVAS_WIDTH = 1280;
const DEFAULT_CANVAS_HEIGHT = 720;

export function Canvas({
  activeSlide,
  overlay = null,
  aspectRatio = '16:9',
  selectedElementId,
  setSelectedElementId,
  selectedElementIds = [],
  setSelectedElementIds,
  selectElement,
  selectAllElements,
  activeTool,
  setActiveTool,
  addElement,
  updateElement,
  deleteElement,
  duplicateElement,
  groupSelected,
  ungroupSelected,
  copySelected,
  cutSelected,
  paste,
  copyStyle,
  pasteStyle,
  onInsertImages,
}) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const currentSlide = activeSlide && Array.isArray(activeSlide.elements)
    ? activeSlide
    : { id: 'slide-fallback', title: 'Untitled', background: '#ffffff', elements: [], ...(activeSlide || {}) };
  const slideElements = [...(currentSlide.elements || [])].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));

  const is916 = aspectRatio === '9:16' || currentSlide.aspect_ratio === '9:16';
  const canvasWidth = is916 ? 720 : DEFAULT_CANVAS_WIDTH;
  const canvasHeight = is916 ? 1280 : DEFAULT_CANVAS_HEIGHT;

  const effectiveSelectedIds =
    selectedElementIds && selectedElementIds.length > 0
      ? selectedElementIds
      : selectedElementId
        ? [selectedElementId]
        : [];

  // Zoom & Pan state (PowerPoint-style pasteboard navigation)
  const [zoom, setZoom] = useState(0.75); // Start at 75% so pasteboard is visible by default
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Dragging / Resizing / Creating state
  const [interactionState, setInteractionState] = useState(null);
  const [guides, setGuides] = useState([]);
  const [smartGuides, setSmartGuides] = useState(() => {
    try { return localStorage.getItem('ppt_smart_guides') !== 'false'; } catch { return true; }
  });
  useEffect(() => {
    try { localStorage.setItem('ppt_smart_guides', String(smartGuides)); } catch { /* Optional preference. */ }
    if (!smartGuides) setGuides([]);
  }, [smartGuides]);
  useEffect(() => { setGuides([]); setInteractionState(null); }, [currentSlide.id]);

  // Inline text editing
  const [editingTextId, setEditingTextId] = useState(null);
  const [editingTextValue, setEditingTextValue] = useState('');

  // Fit slide to container with generous pasteboard margins
  const handleFitToScreen = useCallback(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth && clientHeight) {
      const availableW = clientWidth - 48;
      const availableH = clientHeight - 72;
      const scaleW = availableW / canvasWidth;
      const scaleH = availableH / canvasHeight;
      const fitZoom = Math.min(scaleW, scaleH);
      const clamped = Math.min(1.2, Math.max(0.1, Math.floor(fitZoom * 20) / 20));
      setZoom(clamped);
      setPan({ x: 0, y: 0 });
    }
  }, [canvasWidth, canvasHeight]);

  // Auto-fit on mount or aspect ratio change
  useEffect(() => {
    handleFitToScreen();
    if (!containerRef.current) return;
    const observer = new ResizeObserver(handleFitToScreen);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [handleFitToScreen, is916]);

  // Convert client viewport coordinates to SVG canvas coordinates
  // getBoundingClientRect inherently accounts for zoom scale and translate pan!
  const getCanvasCoords = useCallback((e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, [canvasWidth, canvasHeight]);

  // Wheel listener: Ctrl+Wheel (or pinch) for Zoom, normal Wheel for Pan
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Zoom in/out towards cursor
        const zoomDelta = -e.deltaY * 0.002;
        setZoom((prevZoom) => {
          const newZoom = Math.min(3.0, Math.max(0.2, prevZoom + zoomDelta));
          return Math.round(newZoom * 100) / 100;
        });
      } else {
        // Pan canvas
        setPan((prevPan) => ({
          x: prevPan.x - e.deltaX,
          y: prevPan.y - e.deltaY,
        }));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  // Keyboard shortcut listener (Tool switching: R, U, O, L, A, T, V, H; Space for Hand/Pan; Delete, Backspace, Ctrl+D, Zoom keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input, textarea, or editing text on canvas
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) return;
      if (editingTextId) return;

      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom((z) => Math.min(3.0, Math.round((z + 0.1) * 10) / 10));
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(0.2, Math.round((z - 0.1) * 10) / 10));
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        handleFitToScreen();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (effectiveSelectedIds.length > 0) {
          e.preventDefault();
          deleteElement();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (effectiveSelectedIds.length > 0) {
          e.preventDefault();
          duplicateElement();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        if (effectiveSelectedIds.length > 0 && copyStyle) {
          e.preventDefault();
          copyStyle();
        }
      } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'c') {
        if (effectiveSelectedIds.length > 0 && copySelected) {
          e.preventDefault();
          copySelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        if (effectiveSelectedIds.length > 0 && cutSelected) {
          e.preventDefault();
          cutSelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        if (effectiveSelectedIds.length > 0 && pasteStyle) {
          e.preventDefault();
          pasteStyle();
        }
      } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'v') {
        // Let the browser dispatch paste so image clipboard data is available.
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (e.shiftKey) {
          if (ungroupSelected) ungroupSelected();
        } else {
          if (groupSelected) groupSelected();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (selectAllElements) selectAllElements();
      } else if (e.key === 'Escape') {
        if (setSelectedElementIds) setSelectedElementIds([]);
        else setSelectedElementId(null);
        setActiveTool('select');
        setEditingTextId(null);
      } else if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        // Single key shortcuts for canvas tools (R, U, O, L, A, T, V, H)
        const k = e.key.toLowerCase();
        if (k === 'v') {
          e.preventDefault();
          setActiveTool('select');
        } else if (k === 'h') {
          e.preventDefault();
          setActiveTool((prev) => (prev === 'hand' ? 'select' : 'hand'));
        } else if (k === 'r') {
          e.preventDefault();
          setActiveTool('rectangle');
        } else if (k === 'u') {
          e.preventDefault();
          setActiveTool('rounded_rectangle');
        } else if (k === 'o') {
          e.preventDefault();
          setActiveTool('ellipse');
        } else if (k === 'l') {
          e.preventDefault();
          setActiveTool('line');
        } else if (k === 'a') {
          e.preventDefault();
          setActiveTool('arrow');
        } else if (k === 't') {
          e.preventDefault();
          setActiveTool('text');
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    effectiveSelectedIds,
    deleteElement,
    duplicateElement,
    copySelected,
    cutSelected,
    paste,
    copyStyle,
    pasteStyle,
    groupSelected,
    ungroupSelected,
    selectAllElements,
    setSelectedElementIds,
    setSelectedElementId,
    setActiveTool,
    handleFitToScreen,
  ]);

  // Handle pointer down on canvas or pasteboard
  const handleContainerPointerDown = (e) => {
    // If Space is held, middle mouse button clicked, or Hand tool active -> start panning
    if (e.button === 1 || isSpacePressed || activeTool === 'hand') {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return;

    // If inline editing, finish editing first
    if (editingTextId) {
      updateElement(editingTextId, { text: editingTextValue });
      setEditingTextId(null);
    }

    const { x, y } = getCanvasCoords(e);

    // If a tool other than 'select' or 'hand' is active, start creation anywhere (slide or pasteboard)
    if (activeTool !== 'select' && activeTool !== 'hand') {
      setInteractionState({
        type: 'create',
        tool: activeTool,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });
      return;
    }

    // In 'select' mode, dragging on canvas or pasteboard starts a marquee selection box!
    setInteractionState({
      type: 'marquee',
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      isShift: e.shiftKey,
      originalSelection: [...effectiveSelectedIds],
    });
  };

  // Start moving an existing element (works for elements on-slide or off-slide)
  const handleElementPointerDown = (e, element) => {
    if (e.button !== 0) return;
    if (isSpacePressed || activeTool === 'hand') return;
    if (activeTool !== 'select') return;
    e.stopPropagation();

    if (editingTextId === element.id) return;

    const { x, y } = getCanvasCoords(e);

    // If shift key is held, toggle this element (and its group)
    if (e.shiftKey) {
      if (selectElement) {
        selectElement(element.id, { toggle: true });
      } else {
        setSelectedElementId(element.id);
      }
      return;
    }

    // Normal click without shift:
    // If the clicked element is already in effectiveSelectedIds, keep the multi-selection active so all can drag together!
    // Otherwise, select this element (and its group members)
    let currentSelection = effectiveSelectedIds;
    if (!effectiveSelectedIds.includes(element.id)) {
      if (selectElement) {
        selectElement(element.id, { toggle: false });
      } else if (setSelectedElementIds) {
        setSelectedElementIds([element.id]);
      } else {
        setSelectedElementId(element.id);
      }
      const groupMembers = element.group_id
        ? slideElements.filter((el) => el.group_id === element.group_id).map((el) => el.id)
        : [element.id];
      currentSelection = groupMembers;
    }

    const initialElements = slideElements
      .filter((el) => currentSelection.includes(el.id))
      .map((el) => ({ ...el }));

    setGuides([]);
    setInteractionState({
      type: 'drag',
      startX: x,
      startY: y,
      initialElements,
      bounds: selectionBounds(initialElements),
      targets: alignmentTargets(slideElements.filter(el => !currentSelection.includes(el.id)), canvasWidth, canvasHeight),
    });
  };

  // Start resizing via a handle
  const handleResizePointerDown = (e, handle, element) => {
    if (isSpacePressed || activeTool === 'hand') return;
    e.stopPropagation();
    const { x, y } = getCanvasCoords(e);

    setInteractionState({
      type: 'resize',
      handle,
      startX: x,
      startY: y,
      initialElement: { ...element },
    });
  };

  // Pointer move (moving, resizing, creating, or panning)
  const handlePointerMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (!interactionState) return;

    const { x, y } = getCanvasCoords(e);
    const dx = x - interactionState.startX;
    const dy = y - interactionState.startY;

    if (interactionState.type === 'create') {
      setInteractionState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));
    } else if (interactionState.type === 'marquee') {
      setInteractionState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));
    } else if (interactionState.type === 'drag') {
      const { initialElements } = interactionState;
      // A plain click must never move an element toward a nearby guide.
      if (!interactionState.moved && Math.hypot(dx, dy) * zoom < 2) return;
      if (!interactionState.moved) containerRef.current?.setPointerCapture(e.pointerId);
      const snapped = snapDrag({ bounds: interactionState.bounds, targets: interactionState.targets,
        dx, dy, threshold: 7 / zoom, disabled: !smartGuides || e.altKey });
      setGuides(snapped.guides);
      setInteractionState(prev => ({ ...prev, moved: true }));
      const round = value => Math.round(value * 1000) / 1000;
      if (initialElements) {
        initialElements.forEach((initial) => {
          const isLine = initial.type === 'line' || initial.type === 'arrow';
          const partial = {
            x: round(initial.x + snapped.dx),
            y: round(initial.y + snapped.dy),
          };
          if (isLine) {
            partial.x1 = round((initial.x1 ?? initial.x) + snapped.dx);
            partial.y1 = round((initial.y1 ?? initial.y) + snapped.dy);
            partial.x2 = round((initial.x2 ?? (initial.x + initial.width)) + snapped.dx);
            partial.y2 = round((initial.y2 ?? (initial.y + initial.height)) + snapped.dy);
          }
          updateElement(initial.id, partial, false);
        });
      }
    } else if (interactionState.type === 'resize') {
      const initial = interactionState.initialElement;
      const { handle } = interactionState;
      let newX = initial.x;
      let newY = initial.y;
      let newWidth = initial.width;
      let newHeight = initial.height;

      if (initial.type === 'line' || initial.type === 'arrow') {
        if (handle === 'start') {
          newX = initial.x + dx;
          newY = initial.y + dy;
          newWidth = initial.width - dx;
          newHeight = initial.height - dy;
        } else if (handle === 'end') {
          newWidth = initial.width + dx;
          newHeight = initial.height + dy;
        }
      } else {
        if (handle.includes('e')) newWidth = Math.max(10, initial.width + dx);
        if (handle.includes('s')) newHeight = Math.max(10, initial.height + dy);
        if (handle.includes('w')) {
          const w = initial.width - dx;
          if (w >= 10) {
            newX = initial.x + dx;
            newWidth = w;
          }
        }
        if (handle.includes('n')) {
          const h = initial.height - dy;
          if (h >= 10) {
            newY = initial.y + dy;
            newHeight = h;
          }
        }
      }

      if (initial.type === 'image' && (initial.aspect_locked !== false) !== e.shiftKey) {
        const ratio = initial.width / initial.height;
        if (handle.includes('e') || handle.includes('w')) newHeight = newWidth / ratio;
        else newWidth = newHeight * ratio;
        if (handle.includes('w')) newX = initial.x + initial.width - newWidth;
        if (handle.includes('n')) newY = initial.y + initial.height - newHeight;
      }

      updateElement(
        initial.id,
        {
          x: Math.round(newX),
          y: Math.round(newY),
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        },
        false
      );
    }
  };

  // Pointer up (finishing create, drag, resize, or pan)
  const handlePointerUp = () => {
    setGuides([]);
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!interactionState) return;

    if (interactionState.type === 'create') {
      const { startX, startY, currentX, currentY, tool } = interactionState;
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const rawW = Math.abs(currentX - startX);
      const rawH = Math.abs(currentY - startY);

      let createdElement = null;

      if (tool === 'line' || tool === 'arrow') {
        const dx = currentX - startX;
        const dy = currentY - startY;
        const isTiny = Math.hypot(dx, dy) < 5;
        createdElement = addElement({
          type: tool,
          x: Math.round(startX),
          y: Math.round(startY),
          width: isTiny ? 200 : Math.round(dx),
          height: isTiny ? 0 : Math.round(dy),
          stroke_color: '#2563eb',
          stroke_width: 3,
          arrow_head_end: tool === 'arrow',
        });
      } else if (tool === 'text') {
        const isClick = rawW < 10 && rawH < 10;
        createdElement = addElement({
          type: 'text',
          x: Math.round(x),
          y: Math.round(y),
          width: isClick ? 320 : Math.max(80, Math.round(rawW)),
          height: isClick ? 50 : Math.max(30, Math.round(rawH)),
          text: 'Double click to edit',
          font_size: 24,
          font_bold: false,
          text_color: '#1e293b',
          text_align: 'left',
          fill_color: null,
          stroke_color: null,
        });
      } else {
        // Shapes: rectangle, rounded_rectangle, ellipse
        const isClick = rawW < 10 && rawH < 10;
        createdElement = addElement({
          type: tool,
          x: Math.round(x),
          y: Math.round(y),
          width: isClick ? 180 : Math.max(20, Math.round(rawW)),
          height: isClick ? 120 : Math.max(20, Math.round(rawH)),
          fill_color: '#3b82f6',
          stroke_color: '#1d4ed8',
          stroke_width: 2,
          radius: tool === 'rounded_rectangle' ? 16 : 0,
          text: '',
          text_color: '#ffffff',
          font_size: 18,
          text_align: 'center',
          vertical_align: 'middle',
        });
      }

      if (createdElement) {
        if (setSelectedElementIds) setSelectedElementIds([createdElement.id]);
        else setSelectedElementId(createdElement.id);
      }
      setActiveTool('select');
    } else if (interactionState.type === 'marquee') {
      const { startX, startY, currentX, currentY, isShift, originalSelection } = interactionState;
      const mx = Math.min(startX, currentX);
      const my = Math.min(startY, currentY);
      const mw = Math.abs(currentX - startX);
      const mh = Math.abs(currentY - startY);

      if (mw < 5 && mh < 5) {
        if (!isShift) {
          if (setSelectedElementIds) setSelectedElementIds([]);
          else setSelectedElementId(null);
        }
      } else {
        const hitElements = slideElements.filter((el) => {
          const isLine = el.type === 'line' || el.type === 'arrow';
          const elLeft = isLine ? Math.min(el.x, el.x + el.width) : el.x;
          const elTop = isLine ? Math.min(el.y, el.y + el.height) : el.y;
          const elRight = isLine ? Math.max(el.x, el.x + el.width) : el.x + el.width;
          const elBottom = isLine ? Math.max(el.y, el.y + el.height) : el.y + el.height;

          return !(elRight < mx || elLeft > mx + mw || elBottom < my || elTop > my + mh);
        });

        let hitIds = hitElements.map((e) => e.id);
        const groupIds = new Set();
        hitElements.forEach((el) => {
          if (el.group_id) groupIds.add(el.group_id);
        });
        slideElements.forEach((el) => {
          if (el.group_id && groupIds.has(el.group_id) && !hitIds.includes(el.id)) {
            hitIds.push(el.id);
          }
        });

        if (isShift) {
          const combined = Array.from(new Set([...originalSelection, ...hitIds]));
          if (setSelectedElementIds) setSelectedElementIds(combined);
          else setSelectedElementId(combined[0] || null);
        } else {
          if (setSelectedElementIds) setSelectedElementIds(hitIds);
          else setSelectedElementId(hitIds[0] || null);
        }
      }
    } else if (interactionState.type === 'drag') {
      const { initialElements } = interactionState;
      if (interactionState.moved && initialElements && initialElements.length > 0) {
        // All members already moved without history. Commit the whole current
        // presentation once, so one Undo restores the entire selection.
        const el = slideElements.find(item => item.id === initialElements[0].id);
        if (el) updateElement(el.id, { ...el }, true);
      }
    } else if (interactionState.type === 'resize') {
      const el = slideElements.find((item) => item.id === interactionState.initialElement.id);
      if (el) {
        updateElement(el.id, { ...el }, true);
      }
    }

    setInteractionState(null);
  };

  // Render preview while creating
  const renderCreationPreview = () => {
    if (!interactionState || interactionState.type !== 'create') return null;

    const { startX, startY, currentX, currentY, tool } = interactionState;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    if (tool === 'line' || tool === 'arrow') {
      return (
        <line
          x1={startX}
          y1={startY}
          x2={currentX}
          y2={currentY}
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      );
    }

    if (tool === 'ellipse') {
      return (
        <ellipse
          cx={x + w / 2}
          cy={y + h / 2}
          rx={w / 2}
          ry={h / 2}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
      );
    }

    return (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={tool === 'rounded_rectangle' ? 16 : 0}
        ry={tool === 'rounded_rectangle' ? 16 : 0}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
    );
  };

  // Render selection marquee box while dragging on canvas
  const renderMarquee = () => {
    if (!interactionState || interactionState.type !== 'marquee') return null;
    const { startX, startY, currentX, currentY } = interactionState;
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);
    if (w < 2 && h < 2) return null;

    return (
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="rgba(59, 130, 246, 0.12)"
        stroke="#2563eb"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        pointerEvents="none"
      />
    );
  };

  // Interaction stays in the editor; all visible element geometry is shared with video.
  const renderElement = (el) => (
    <g key={el.id} className="cursor-move"
      onPointerDown={(event) => handleElementPointerDown(event, el)}
      onDoubleClick={el.type === 'text' ? (event) => {
        event.stopPropagation();
        setEditingTextId(el.id);
        setEditingTextValue(el.text ?? el.content ?? '');
      } : undefined}>
      <SlideElement element={el} editing={editingTextId === el.id} />
    </g>
  );

  // Render selection handles (works for elements on-slide or off-slide)
  const renderSelectionOutline = () => {
    const selectedElements = slideElements.filter((el) => effectiveSelectedIds.includes(el.id));
    if (selectedElements.length === 0) return null;

    // Single element selection outline and handles
    if (selectedElements.length === 1) {
      const el = selectedElements[0];
      const handleSize = 8;

      if (el.type === 'line' || el.type === 'arrow') {
        const x1 = el.x;
        const y1 = el.y;
        const x2 = el.x + el.width;
        const y2 = el.y + el.height;

        return (
          <g pointerEvents="all">
            <circle
              cx={x1}
              cy={y1}
              r={6}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth={2}
              className="cursor-pointer"
              onPointerDown={(e) => handleResizePointerDown(e, 'start', el)}
            />
            <circle
              cx={x2}
              cy={y2}
              r={6}
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth={2}
              className="cursor-pointer"
              onPointerDown={(e) => handleResizePointerDown(e, 'end', el)}
            />
          </g>
        );
      }

      const { x, y, width: w, height: h } = el;
      const handles = [
        { id: 'nw', cx: x, cy: y, cursor: 'nwse-resize' },
        { id: 'n', cx: x + w / 2, cy: y, cursor: 'ns-resize' },
        { id: 'ne', cx: x + w, cy: y, cursor: 'nesw-resize' },
        { id: 'e', cx: x + w, cy: y + h / 2, cursor: 'ew-resize' },
        { id: 'se', cx: x + w, cy: y + h, cursor: 'nwse-resize' },
        { id: 's', cx: x + w / 2, cy: y + h, cursor: 'ns-resize' },
        { id: 'sw', cx: x, cy: y + h, cursor: 'nesw-resize' },
        { id: 'w', cx: x, cy: y + h / 2, cursor: 'ew-resize' },
      ];

      return (
        <g pointerEvents="all">
          {/* Selection bounding box */}
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            pointerEvents="none"
          />
          {/* Resize Handles */}
          {handles.map((hd) => (
            <rect
              key={hd.id}
              x={hd.cx - handleSize / 2}
              y={hd.cy - handleSize / 2}
              width={handleSize}
              height={handleSize}
              fill="#ffffff"
              stroke="#3b82f6"
              strokeWidth={1.5}
              style={{ cursor: hd.cursor }}
              onPointerDown={(e) => handleResizePointerDown(e, hd.id, el)}
            />
          ))}
        </g>
      );
    }

    // Multiple elements selected (PowerPoint style)
    const minX = Math.min(...selectedElements.map((e) => (e.type === 'line' || e.type === 'arrow' ? Math.min(e.x, e.x + e.width) : e.x)));
    const maxX = Math.max(...selectedElements.map((e) => (e.type === 'line' || e.type === 'arrow' ? Math.max(e.x, e.x + e.width) : e.x + e.width)));
    const minY = Math.min(...selectedElements.map((e) => (e.type === 'line' || e.type === 'arrow' ? Math.min(e.y, e.y + e.height) : e.y)));
    const maxY = Math.max(...selectedElements.map((e) => (e.type === 'line' || e.type === 'arrow' ? Math.max(e.y, e.y + e.height) : e.y + e.height)));
    const groupW = maxX - minX;
    const groupH = maxY - minY;

    const allInSameGroup =
      selectedElements.every((e) => e.group_id && e.group_id === selectedElements[0].group_id);

    return (
      <g pointerEvents="none">
        {/* Outlines on each individual member element */}
        {selectedElements.map((el) => {
          const isLine = el.type === 'line' || el.type === 'arrow';
          if (isLine) {
            return (
              <line
                key={`outline-${el.id}`}
                x1={el.x}
                y1={el.y}
                x2={el.x + el.width}
                y2={el.y + el.height}
                stroke="#60a5fa"
                strokeWidth={(el.stroke_width || 2) + 4}
                opacity={0.35}
              />
            );
          }
          return (
            <rect
              key={`outline-${el.id}`}
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill="none"
              stroke="#60a5fa"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          );
        })}

        {/* Collective selection bounding box */}
        <rect
          x={minX - 3}
          y={minY - 3}
          width={groupW + 6}
          height={groupH + 6}
          fill="none"
          stroke={allInSameGroup ? "#3b82f6" : "#2563eb"}
          strokeWidth={allInSameGroup ? 2 : 1.5}
          strokeDasharray={allInSameGroup ? "none" : "5 4"}
        />

        {/* Group Badge if elements share a group */}
        {allInSameGroup && (
          <g transform={`translate(${minX - 3}, ${minY - 24})`}>
            <rect x={0} y={0} width={50} height={18} rx={4} fill="#2563eb" />
            <text x={25} y={13} fill="#ffffff" fontSize={10} fontFamily="Inter, sans-serif" fontWeight="bold" textAnchor="middle">
              GROUP
            </text>
          </g>
        )}

        {/* Corner Indicator Dots */}
        {[
          { cx: minX - 3, cy: minY - 3 },
          { cx: maxX + 3, cy: minY - 3 },
          { cx: minX - 3, cy: maxY + 3 },
          { cx: maxX + 3, cy: maxY + 3 },
        ].map((pt, idx) => (
          <rect
            key={idx}
            x={pt.cx - 4}
            y={pt.cy - 4}
            width={8}
            height={8}
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth={1.5}
          />
        ))}
      </g>
    );
  };

  const isHandActive = activeTool === 'hand' || isSpacePressed;
  const cursorClass = isPanning
    ? 'cursor-grabbing'
    : isHandActive
      ? 'cursor-grab'
      : activeTool !== 'select'
        ? 'cursor-crosshair'
        : 'cursor-default';

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative overflow-hidden bg-slate-300/60 dark:bg-slate-950 flex items-center justify-center select-none ${cursorClass} transition-colors duration-200`}
      onPointerDown={handleContainerPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDragOver={event => { if ([...(event.dataTransfer?.types || [])].includes('Files')) event.preventDefault(); }}
      onDrop={event => {
        const files = [...(event.dataTransfer?.files || [])].filter(file => file.type.startsWith('image/'));
        if (files.length) { event.preventDefault(); event.stopPropagation(); onInsertImages?.(files); }
      }}
    >
      {/* Pasteboard Background Pattern (Subtle Dot Grid) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1.2px, transparent 1.2px)',
          backgroundSize: '24px 24px',
          color: '#64748b',
        }}
      />

      {/* Zoomable & Pannable Viewport */}
      <div
        className="relative"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.04s ease-out',
        }}
      >
        {/* Presentation Slide Canvas */}
        <div
          className="relative rounded-xl select-none"
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            backgroundColor: currentSlide.background || '#ffffff',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.12)',
          }}
        >
          {/* Slide Frame Header Indicator */}
          <div className="absolute -top-7 left-0 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pointer-events-none flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full inline-block ${is916 ? 'bg-indigo-500' : 'bg-blue-500'}`} />
            {is916 ? 'Reel Canvas (9:16 • 720 × 1280)' : 'Slide Canvas (16:9 • 1280 × 720)'}
          </div>

          {/* Slide Boundary Outline */}
          <div className="absolute inset-0 border border-slate-300 dark:border-slate-700/60 pointer-events-none rounded-xl" />

          {/* SVG Canvas for elements (overflow: visible ensures off-slide elements are visible on pasteboard) */}
          <svg
            ref={svgRef}
            viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
            style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px`, overflow: 'visible' }}
            className="block overflow-visible"
          >
            {/* Elements on active slide (both on-slide and off-slide) */}
            {slideElements.map(renderElement)}

            {/* Creation Preview */}
            {renderCreationPreview()}

            {/* Marquee Drag Selection Box */}
            {renderMarquee()}

            {/* Selection Box & Resize Handles */}
            {renderSelectionOutline()}
            {guides.length > 0 && <g data-alignment-guides aria-hidden="true" pointerEvents="none">
              {guides.map((guide, index) => <line key={index}
                x1={guide.axis === 'x' ? guide.value : guide.start - 12 / zoom}
                y1={guide.axis === 'y' ? guide.value : guide.start - 12 / zoom}
                x2={guide.axis === 'x' ? guide.value : guide.end + 12 / zoom}
                y2={guide.axis === 'y' ? guide.value : guide.end + 12 / zoom}
                stroke="#e83eaa" strokeWidth={1 / zoom} strokeDasharray={`${5 / zoom} ${4 / zoom}`} />)}
            </g>}
          </svg>

          {overlay}

          {/* Inline Text Editor Overlay */}
          {editingTextId && (() => {
            const el = slideElements.find((e) => e.id === editingTextId);
            if (!el) return null;

            const topPercent = (el.y / canvasHeight) * 100;
            const leftPercent = (el.x / canvasWidth) * 100;
            const widthPercent = (el.width / canvasWidth) * 100;
            const heightPercent = (el.height / canvasHeight) * 100;

            return (
              <textarea
                autoFocus
                value={editingTextValue}
                onChange={(e) => setEditingTextValue(e.target.value)}
                onBlur={() => {
                  updateElement(editingTextId, { text: editingTextValue });
                  setEditingTextId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    updateElement(editingTextId, { text: editingTextValue });
                    setEditingTextId(null);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: `${topPercent}%`,
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                  fontSize: `${el.font_size || 20}px`,
                  fontWeight: el.font_bold ? 'bold' : 'normal',
                  fontStyle: el.font_italic ? 'italic' : 'normal',
                  textAlign: el.text_align || 'left',
                  color: el.text_color || '#0f172a',
                  fontFamily: el.font_family || 'Arial',
                  background: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 0 0 2px #3b82f6',
                  resize: 'none',
                  padding: '4px',
                  borderRadius: '4px',
                  outline: 'none',
                  zIndex: 50,
                }}
              />
            );
          })()}
        </div>
      </div>

      {/* Floating Zoom & Pan Controls HUD (PowerPoint style) */}
      <div onPointerDown={event => event.stopPropagation()} className="absolute bottom-5 right-6 z-30 flex items-center gap-1 px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl text-slate-700 dark:text-slate-200 select-none">
        <button type="button" aria-label="Smart alignment guides" aria-pressed={smartGuides}
          title="Smart alignment guides (hold Alt/Option while dragging to bypass)"
          onClick={() => setSmartGuides(value => !value)}
          className={`p-1.5 rounded-lg transition ${smartGuides ? 'bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
          <Magnet size={14} />
        </button>
        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />
        {/* Fit Slide to Window */}
        <button
          onClick={handleFitToScreen}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
          title="Fit Slide to Window (Ctrl+0)"
        >
          <Scan size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Zoom Out (-) */}
        <button
          onClick={() => setZoom((z) => Math.max(0.2, Math.round((z - 0.1) * 10) / 10))}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
          title="Zoom Out (Ctrl -)"
        >
          <ZoomOut size={14} />
        </button>

        {/* Zoom Level Display / Reset to 100% */}
        <button
          onClick={() => setZoom(1.0)}
          className="px-2 py-0.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 min-w-[48px] text-center"
          title="Reset to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        {/* Zoom In (+) */}
        <button
          onClick={() => setZoom((z) => Math.min(3.0, Math.round((z + 0.1) * 10) / 10))}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition"
          title="Zoom In (Ctrl +)"
        >
          <ZoomIn size={14} />
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Hand / Pan Tool Toggle */}
        <button
          onClick={() => setActiveTool(activeTool === 'hand' ? 'select' : 'hand')}
          className={`p-1.5 rounded-lg transition ${
            activeTool === 'hand'
              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
          title="Hand / Pan Tool (H or hold Spacebar to pan)"
        >
          <Hand size={14} />
        </button>
      </div>
    </div>
  );
}
