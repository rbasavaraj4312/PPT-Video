import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  MousePointer,
  PenTool,
  Sun,
  Type,
  Eraser,
  Trash2
} from 'lucide-react';
import { getIconComponent } from '../data/iconLibrary';
import { MotionWidget } from './MotionWidgets/MotionWidget';
import { SlideElement } from '../rendering/SlideElement';
import { morphSlide } from '../narration/timeline.js';

const DEFAULT_CANVAS_WIDTH = 1280;
const DEFAULT_CANVAS_HEIGHT = 720;
const REEL_CANVAS_WIDTH = 720;
const REEL_CANVAS_HEIGHT = 1280;

function parseColor(str, defaultOpacity = 1) {
  if (!str || str === 'transparent' || str === 'none') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  const s = String(str).trim();
  if (s.startsWith('rgb')) {
    const match = s.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] !== undefined ? parseFloat(match[4]) : defaultOpacity,
      };
    }
  }
  let clean = s.replace('#', '').trim();
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
      a: defaultOpacity,
    };
  }
  if (clean.length === 8) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
      a: parseInt(clean.substring(6, 8), 16) / 255,
    };
  }
  return { r: 0, g: 0, b: 0, a: 0 };
}

function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

function lerpColor(c1, c2, t) {
  const isC1None = !c1 || c1 === 'transparent' || c1 === 'none';
  const isC2None = !c2 || c2 === 'transparent' || c2 === 'none';

  if (isC1None && isC2None) return 'transparent';

  const col1 = parseColor(c1);
  const col2 = parseColor(c2);

  if (isC1None) {
    const a = +(lerp(0, col2.a, t).toFixed(3));
    return `rgba(${col2.r}, ${col2.g}, ${col2.b}, ${a})`;
  }
  if (isC2None) {
    const a = +(lerp(col1.a, 0, t).toFixed(3));
    return `rgba(${col1.r}, ${col1.g}, ${col1.b}, ${a})`;
  }

  const r = Math.round(lerp(col1.r, col2.r, t));
  const g = Math.round(lerp(col1.g, col2.g, t));
  const b = Math.round(lerp(col1.b, col2.b, t));
  const a = +(lerp(col1.a, col2.a, t).toFixed(3));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function easeInOut(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

function pointsToSvgPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

function matchElements(slideA, slideB) {
  const matched = [];
  const unmatchedA = [...(slideA?.elements || [])];
  const unmatchedB = [...(slideB?.elements || [])];

  // 1. By explicit morph_id (prefer matching identical type first!)
  for (let i = 0; i < unmatchedA.length; i++) {
    const elA = unmatchedA[i];
    if (elA.morph_id) {
      let idxB = unmatchedB.findIndex(b => b.morph_id === elA.morph_id && b.type === elA.type);
      if (idxB === -1) {
        idxB = unmatchedB.findIndex(b => b.morph_id === elA.morph_id);
      }
      if (idxB !== -1) {
        matched.push([elA, unmatchedB[idxB]]);
        unmatchedA.splice(i, 1);
        unmatchedB.splice(idxB, 1);
        i--;
      }
    }
  }

  // 1b. By group_id (if both belong to matching group and same type)
  for (let i = 0; i < unmatchedA.length; i++) {
    const elA = unmatchedA[i];
    if (elA.group_id) {
      const idxB = unmatchedB.findIndex(b => b.group_id === elA.group_id && b.type === elA.type);
      if (idxB !== -1) {
        matched.push([elA, unmatchedB[idxB]]);
        unmatchedA.splice(i, 1);
        unmatchedB.splice(idxB, 1);
        i--;
      }
    }
  }

  // 2. By direct id
  for (let i = 0; i < unmatchedA.length; i++) {
    const elA = unmatchedA[i];
    const idxB = unmatchedB.findIndex(b => b.id === elA.id);
    if (idxB !== -1) {
      matched.push([elA, unmatchedB[idxB]]);
      unmatchedA.splice(i, 1);
      unmatchedB.splice(idxB, 1);
      i--;
    }
  }

  // 3. By content/icon and type
  for (let i = 0; i < unmatchedA.length; i++) {
    const elA = unmatchedA[i];
    const keyA = elA.type === 'icon' ? elA.icon_name : (elA.text || elA.content);
    if (keyA) {
      const idxB = unmatchedB.findIndex(b => b.type === elA.type && (b.type === 'icon' ? b.icon_name === keyA : (b.text || b.content) === keyA));
      if (idxB !== -1) {
        matched.push([elA, unmatchedB[idxB]]);
        unmatchedA.splice(i, 1);
        unmatchedB.splice(idxB, 1);
        i--;
      }
    }
  }

  // 4. Smart fallback: Match remaining elements of the SAME type by closest distance
  for (let i = 0; i < unmatchedA.length; i++) {
    const elA = unmatchedA[i];
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let j = 0; j < unmatchedB.length; j++) {
      const elB = unmatchedB[j];
      if (elB.type === elA.type) {
        const dist = Math.hypot(elB.x - elA.x, elB.y - elA.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = j;
        }
      }
    }
    if (bestIdx !== -1) {
      matched.push([elA, unmatchedB[bestIdx]]);
      unmatchedA.splice(i, 1);
      unmatchedB.splice(bestIdx, 1);
      i--;
    }
  }

  return { matched, departing: unmatchedA, arriving: unmatchedB };
}

function FloatingTextInput({ x, y, canvasWidth, canvasHeight, penColor, onSave, onCancel }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-40 select-text pointer-events-auto transform -translate-y-1/2"
      style={{
        left: `${Math.min(80, (x / canvasWidth) * 100)}%`,
        top: `${Math.min(85, (y / canvasHeight) * 100)}%`,
      }}
    >
      <div 
        className="flex items-center gap-2 px-3 py-2 bg-slate-950/95 border-2 rounded-2xl shadow-2xl backdrop-blur-xl ring-2 ring-black/40"
        style={{ borderColor: penColor }}
      >
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
              e.preventDefault();
              if (value.trim()) onSave(value.trim());
              else onCancel();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          placeholder="Type note & hit Enter..."
          className="px-2 py-1 bg-transparent text-white placeholder-slate-400 outline-none font-bold text-base min-w-[210px]"
          style={{ color: penColor === '#ffffff' ? '#ffffff' : penColor }}
        />
        <button
          onClick={() => {
            if (value.trim()) onSave(value.trim());
            else onCancel();
          }}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition shadow-md"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="p-1.5 text-slate-400 hover:text-white rounded-xl transition"
          title="Cancel"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export function SlideShowModal({
  isOpen,
  onClose,
  presentation,
  initialSlideIndex = 0,
}) {
  const [slideIndex, setSlideIndex] = useState(initialSlideIndex);
  const [animState, setAnimState] = useState(null); // { fromIndex, toIndex, progress, transitionType }
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Interactive presentation annotation tools
  const [activeTool, setActiveTool] = useState('pointer'); // 'pointer' | 'pen' | 'laser' | 'text'
  const [annotations, setAnnotations] = useState({}); // { [slideIndex]: { strokes: [], texts: [] } }
  const [penColor, setPenColor] = useState('#ef4444');
  const [penWidth, setPenWidth] = useState(4);
  const [currentStroke, setCurrentStroke] = useState(null);
  const [activeTextInput, setActiveTextInput] = useState(null); // { x, y }

  // Excalidraw Laser Engine refs
  const laserCanvasRef = useRef(null);
  const laserTrailRef = useRef([]); // [{ x, y, time, isDown }]
  const laserPosRef = useRef({ x: -100, y: -100, visible: false });
  const isLaserDownRef = useRef(false);
  const laserAnimRef = useRef(null);

  const containerRef = useRef(null);
  const slideContainerRef = useRef(null);
  const animFrameRef = useRef(null);

  const slides = presentation?.slides || [];
  const totalSlides = slides.length;

  const activeDisplaySlide = animState ? (animState.toSlide || slides[slideIndex]) : slides[slideIndex];
  const is916 =
    presentation?.aspect_ratio === '9:16' ||
    activeDisplaySlide?.aspect_ratio === '9:16' ||
    (presentation?.width === 720 && presentation?.height === 1280) ||
    (presentation?.height && presentation?.width && presentation.height > presentation.width);

  const canvasWidth = is916 ? REEL_CANVAS_WIDTH : DEFAULT_CANVAS_WIDTH;
  const canvasHeight = is916 ? REEL_CANVAS_HEIGHT : DEFAULT_CANVAS_HEIGHT;

  // Reset to initial slide and clear active tools when opened
  useEffect(() => {
    if (isOpen) {
      setSlideIndex(Math.max(0, Math.min(initialSlideIndex, totalSlides - 1)));
      setAnimState(null);
      setActiveTool('pointer');
      setCurrentStroke(null);
      laserTrailRef.current = [];
      laserPosRef.current = { x: -100, y: -100, visible: false };
      isLaserDownRef.current = false;
      setActiveTextInput(null);
    }
  }, [isOpen, initialSlideIndex, totalSlides]);

  // Excalidraw Laser Rendering Loop (Smooth Decaying Glowing Trail + Laser Dot)
  useEffect(() => {
    if (!isOpen || activeTool !== 'laser') {
      if (laserAnimRef.current) {
        cancelAnimationFrame(laserAnimRef.current);
        laserAnimRef.current = null;
      }
      if (laserCanvasRef.current) {
        const ctx = laserCanvasRef.current.getContext('2d');
        ctx?.clearRect(0, 0, canvasWidth, canvasHeight);
      }
      return;
    }

    const canvas = laserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const LASER_LIFETIME = 1100; // 1.1s decay duration like Excalidraw

    const renderLaserFrame = () => {
      const now = performance.now();
      laserTrailRef.current = laserTrailRef.current.filter((p) => now - p.time < LASER_LIFETIME);
      const points = laserTrailRef.current;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 1. Draw decaying glowing laser ribbon
      if (points.length >= 2) {
        for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i + 1];
          const age = (now - p2.time) / LASER_LIFETIME;
          const progress = 1 - Math.max(0, Math.min(1, age)); // 1.0 (newest/head) -> 0.0 (oldest/tail)
          if (progress <= 0.01) continue;

          const baseWidth = p2.isDown ? 14 : 9;
          const width = 2.5 + progress * baseWidth;
          const alpha = Math.pow(progress, 1.15);

          // Wide radiant halo glow
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = width * 1.8;
          ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 0.45})`;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 14 * progress;
          ctx.stroke();
          ctx.restore();

          // Core vibrant laser beam
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = width;
          ctx.strokeStyle = `rgba(255, 68, 68, ${alpha * 0.9})`;
          ctx.stroke();

          // Hot white center laser core
          if (progress > 0.25) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = Math.max(1.5, width * 0.35);
            ctx.strokeStyle = `rgba(255, 255, 255, ${(progress - 0.25) * 1.3})`;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // 2. Draw glowing laser pointer dot at current mouse position
      const pos = laserPosRef.current;
      if (pos && pos.visible) {
        ctx.save();
        // Radial outer halo
        const grad = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, 22);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
        grad.addColorStop(0.35, 'rgba(239, 68, 68, 0.5)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
        ctx.fill();

        // Mid vibrant red dot
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
        ctx.fill();

        // White hot laser center
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      laserAnimRef.current = requestAnimationFrame(renderLaserFrame);
    };

    laserAnimRef.current = requestAnimationFrame(renderLaserFrame);

    return () => {
      if (laserAnimRef.current) {
        cancelAnimationFrame(laserAnimRef.current);
        laserAnimRef.current = null;
      }
    };
  }, [isOpen, activeTool, canvasWidth, canvasHeight]);

  // Transition handler
  const transitionToSlide = useCallback((targetIndex) => {
    if (targetIndex === slideIndex || targetIndex < 0 || targetIndex >= totalSlides) {
      return;
    }
    if (animState) {
      setSlideIndex(animState.toIndex);
      setAnimState(null);
      return;
    }

    const fromSlide = slides[slideIndex];
    const toSlide = slides[targetIndex];
    const isForward = targetIndex > slideIndex;
    const transitionType = isForward 
      ? (fromSlide?.transition_type || 'morph') 
      : (toSlide?.transition_type || 'morph');
    const duration = isForward 
      ? (fromSlide?.transition_duration ?? 1.0) 
      : (toSlide?.transition_duration ?? 1.0);

    if (transitionType === 'none' || duration <= 0) {
      setSlideIndex(targetIndex);
      return;
    }

    const morphData = transitionType === 'morph' ? matchElements(fromSlide, toSlide) : null;
    const durationMs = duration * 1000;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(1.0, elapsed / durationMs);

      if (rawProgress >= 1.0) {
        setSlideIndex(targetIndex);
        setAnimState(null);
      } else {
        setAnimState({
          fromIndex: slideIndex,
          toIndex: targetIndex,
          progress: rawProgress,
          transitionType,
          fromSlide,
          toSlide,
          morphData,
        });
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [slideIndex, totalSlides, animState, slides]);

  // Clean up animation frame
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const nextSlide = useCallback(() => {
    if (slideIndex < totalSlides - 1) {
      transitionToSlide(slideIndex + 1);
    }
  }, [slideIndex, totalSlides, transitionToSlide]);

  const prevSlide = useCallback(() => {
    if (slideIndex > 0) {
      transitionToSlide(slideIndex - 1);
    }
  }, [slideIndex, transitionToSlide]);

  // Helper to commit text annotation
  const saveTextAnnotation = useCallback((x, y, text) => {
    if (!text || !text.trim()) return;
    setAnnotations((prev) => {
      const slideAnn = prev[slideIndex] || { strokes: [], texts: [] };
      return {
        ...prev,
        [slideIndex]: {
          ...slideAnn,
          texts: [
            ...slideAnn.texts,
            {
              id: Date.now() + Math.random(),
              x,
              y,
              text: text.trim(),
              color: penColor,
            },
          ],
        },
      };
    });
  }, [slideIndex, penColor]);

  const commitTextInput = useCallback(() => {
    if (activeTextInput && activeTextInput.text.trim()) {
      saveTextAnnotation(activeTextInput.x, activeTextInput.y, activeTextInput.text.trim());
    }
    setActiveTextInput(null);
  }, [activeTextInput, saveTextAnnotation]);

  const deleteTextAnnotation = useCallback((id) => {
    setAnnotations((prev) => {
      const slideAnn = prev[slideIndex] || { strokes: [], texts: [] };
      return {
        ...prev,
        [slideIndex]: {
          ...slideAnn,
          texts: slideAnn.texts.filter((t) => t.id !== id),
        },
      };
    });
  }, [slideIndex]);

  // Clear drawings and text on current slide
  const clearCurrentSlideAnnotations = useCallback(() => {
    setAnnotations((prev) => ({
      ...prev,
      [slideIndex]: { strokes: [], texts: [] },
    }));
    setCurrentStroke(null);
    laserTrailRef.current = [];
    setActiveTextInput(null);
  }, [slideIndex]);

  // Convert mouse/pointer event coordinates to slide coordinate space
  const getSlideCoords = useCallback((e) => {
    if (!slideContainerRef.current) return null;
    const rect = slideContainerRef.current.getBoundingClientRect();
    const scaleX = canvasWidth / rect.width;
    const scaleY = canvasHeight / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return {
      x: Math.max(0, Math.min(canvasWidth, x)),
      y: Math.max(0, Math.min(canvasHeight, y)),
    };
  }, [canvasWidth, canvasHeight]);

  const handlePointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    const coords = getSlideCoords(e);
    if (!coords) return;

    if (activeTool === 'pen') {
      setCurrentStroke([coords]);
    } else if (activeTool === 'laser') {
      isLaserDownRef.current = true;
      laserPosRef.current = { x: coords.x, y: coords.y, visible: true };
      laserTrailRef.current.push({ x: coords.x, y: coords.y, time: performance.now(), isDown: true });
    } else if (activeTool === 'text') {
      setActiveTextInput({ x: Math.round(coords.x), y: Math.round(coords.y) });
    }
  }, [activeTool, getSlideCoords, activeTextInput, saveTextAnnotation]);

  const handlePointerMove = useCallback((e) => {
    const coords = getSlideCoords(e);
    if (!coords) return;

    if (activeTool === 'laser') {
      laserPosRef.current = { x: coords.x, y: coords.y, visible: true };
      laserTrailRef.current.push({
        x: coords.x,
        y: coords.y,
        time: performance.now(),
        isDown: isLaserDownRef.current,
      });
    } else if (activeTool === 'pen' && currentStroke) {
      setCurrentStroke((prev) => [...prev, coords]);
    }
  }, [activeTool, currentStroke, getSlideCoords]);

  const handlePointerUp = useCallback(() => {
    if (activeTool === 'laser') {
      isLaserDownRef.current = false;
    } else if (activeTool === 'pen' && currentStroke && currentStroke.length > 0) {
      setAnnotations((prev) => {
        const slideAnn = prev[slideIndex] || { strokes: [], texts: [] };
        return {
          ...prev,
          [slideIndex]: {
            ...slideAnn,
            strokes: [...slideAnn.strokes, { points: currentStroke, color: penColor, width: penWidth }],
          },
        };
      });
      setCurrentStroke(null);
    }
  }, [activeTool, currentStroke, slideIndex, penColor, penWidth]);

  const handlePointerLeave = useCallback(() => {
    if (activeTool === 'laser') {
      laserPosRef.current = { x: -100, y: -100, visible: false };
      isLaserDownRef.current = false;
    }
    if (activeTool === 'pen' && currentStroke && currentStroke.length > 0) {
      setAnnotations((prev) => {
        const slideAnn = prev[slideIndex] || { strokes: [], texts: [] };
        return {
          ...prev,
          [slideIndex]: {
            ...slideAnn,
            strokes: [...slideAnn.strokes, { points: currentStroke, color: penColor, width: penWidth }],
          },
        };
      });
      setCurrentStroke(null);
    }
  }, [activeTool, currentStroke, slideIndex, penColor, penWidth]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation & tools
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Don't intercept slide navigation or tool shortcuts when typing in text note or any input
      if (activeTextInput || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName) || document.activeElement?.isContentEditable) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setActiveTextInput(null);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown' || e.key === 'Enter') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Backspace') {
        e.preventDefault();
        prevSlide();
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool((prev) => (prev === 'pen' ? 'pointer' : 'pen'));
      } else if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool((prev) => (prev === 'laser' ? 'pointer' : 'laser'));
      } else if (e.key.toLowerCase() === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool((prev) => (prev === 'text' ? 'pointer' : 'text'));
      } else if (e.key.toLowerCase() === 'v' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setActiveTool('pointer');
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        clearCurrentSlideAnnotations();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTextInput, nextSlide, prevSlide, toggleFullscreen, clearCurrentSlideAnnotations, onClose]);

  if (!isOpen || totalSlides === 0) return null;

  // Helper to render multiline SVG text
  const renderSvgTextLines = ({
    text,
    x,
    y,
    width,
    height,
    fontSize = 20,
    fontFamily = 'Arial',
    fontWeight = 'normal',
    fontStyle = 'normal',
    color = '#0f172a',
    textAlign = 'left',
    verticalAlign = 'top',
    opacity = 1.0,
  }) => {
    if (!text) return null;

    const rawLines = String(text).split('\n');
    const avgCharWidth = fontSize * 0.55;
    const maxChars = width > 0 ? Math.max(6, Math.floor(width / avgCharWidth)) : 999;

    const lines = [];
    for (const rawLine of rawLines) {
      if (rawLine.length <= maxChars || maxChars >= 999) {
        lines.push(rawLine);
        continue;
      }
      const words = rawLine.split(' ');
      let curr = '';
      for (const word of words) {
        if (!curr) {
          curr = word;
        } else if ((curr + ' ' + word).length <= maxChars) {
          curr += ' ' + word;
        } else {
          lines.push(curr);
          curr = word;
        }
      }
      if (curr) lines.push(curr);
    }

    const lineHeight = fontSize * 1.25;
    const count = lines.length;

    let startY;
    if (verticalAlign === 'middle') {
      const centerY = y + height / 2;
      startY = centerY - ((count - 1) * lineHeight) / 2;
    } else if (verticalAlign === 'bottom') {
      startY = y + height - (count - 1) * lineHeight - fontSize * 0.5;
    } else {
      startY = y + fontSize * 0.6;
    }

    let textAnchor = 'start';
    let textX = x;
    if (textAlign === 'center') {
      textAnchor = 'middle';
      textX = x + width / 2;
    } else if (textAlign === 'right') {
      textAnchor = 'end';
      textX = x + width;
    }

    return (
      <text
        x={textX}
        y={startY}
        textAnchor={textAnchor}
        dominantBaseline="central"
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        fontStyle={fontStyle}
        fill={color}
        opacity={opacity}
        pointerEvents="none"
      >
        {lines.map((line, idx) => (
          <tspan
            key={idx}
            x={textX}
            y={startY + idx * lineHeight}
            dominantBaseline="central"
          >
            {line || '\u00A0'}
          </tspan>
        ))}
      </text>
    );
  };

  // Render an element
  const renderElement = (el, keyPrefix = '') => {
    const strokeDash = el.stroke_style === 'dashed' ? '8 6' : undefined;
    const opacity = el.opacity !== undefined ? el.opacity : 1.0;
    const rotation = el.rotation || 0;
    const cx = (el.x || 0) + (el.width || 0) / 2;
    const cy = (el.y || 0) + (el.height || 0) / 2;
    const transform = rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined;

    switch (el.type) {
      case 'image':
        return <SlideElement key={`${keyPrefix}${el.id}`} element={el} />;
      case 'rectangle':
        return (
          <g key={`${keyPrefix}${el.id}`} opacity={opacity} transform={transform}>
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill={el.fill_color || el.fill || 'transparent'}
              stroke={el.stroke_color || el.stroke || 'transparent'}
              strokeWidth={el.stroke_width !== undefined ? el.stroke_width : 0}
              strokeDasharray={strokeDash}
            />
            {renderSvgTextLines({
              text: el.text || el.content,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              fontSize: el.font_size || 18,
              fontFamily: el.font_family || 'Arial',
              fontWeight: el.font_bold ? 'bold' : (el.font_weight || 'normal'),
              fontStyle: el.font_italic ? 'italic' : (el.font_style || 'normal'),
              color: el.text_color || el.font_color || '#ffffff',
              textAlign: el.text_align || 'center',
              verticalAlign: 'middle',
            })}
          </g>
        );

      case 'rounded_rectangle':
        return (
          <g key={`${keyPrefix}${el.id}`} opacity={opacity} transform={transform}>
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              rx={el.radius !== undefined ? el.radius : 16}
              ry={el.radius !== undefined ? el.radius : 16}
              fill={el.fill_color || el.fill || 'transparent'}
              stroke={el.stroke_color || el.stroke || 'transparent'}
              strokeWidth={el.stroke_width !== undefined ? el.stroke_width : 0}
              strokeDasharray={strokeDash}
            />
            {renderSvgTextLines({
              text: el.text || el.content,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              fontSize: el.font_size || 18,
              fontFamily: el.font_family || 'Arial',
              fontWeight: el.font_bold ? 'bold' : (el.font_weight || 'normal'),
              fontStyle: el.font_italic ? 'italic' : (el.font_style || 'normal'),
              color: el.text_color || el.font_color || '#ffffff',
              textAlign: el.text_align || 'center',
              verticalAlign: 'middle',
            })}
          </g>
        );

      case 'ellipse':
        return (
          <g key={`${keyPrefix}${el.id}`} opacity={opacity} transform={transform}>
            <ellipse
              cx={el.x + el.width / 2}
              cy={el.y + el.height / 2}
              rx={Math.max(1, el.width / 2)}
              ry={Math.max(1, el.height / 2)}
              fill={el.fill_color || el.fill || 'transparent'}
              stroke={el.stroke_color || el.stroke || 'transparent'}
              strokeWidth={el.stroke_width !== undefined ? el.stroke_width : 0}
              strokeDasharray={strokeDash}
            />
            {renderSvgTextLines({
              text: el.text || el.content,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              fontSize: el.font_size || 18,
              fontFamily: el.font_family || 'Arial',
              fontWeight: el.font_bold ? 'bold' : (el.font_weight || 'normal'),
              fontStyle: el.font_italic ? 'italic' : (el.font_style || 'normal'),
              color: el.text_color || el.font_color || '#ffffff',
              textAlign: el.text_align || 'center',
              verticalAlign: 'middle',
            })}
          </g>
        );

      case 'line':
      case 'arrow': {
        const x1 = el.x1 !== undefined && el.x1 !== null ? el.x1 : el.x;
        const y1 = el.y1 !== undefined && el.y1 !== null ? el.y1 : el.y;
        const x2 = el.x2 !== undefined && el.x2 !== null ? el.x2 : (el.x + el.width);
        const y2 = el.y2 !== undefined && el.y2 !== null ? el.y2 : (el.y + el.height);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLen = 14;

        return (
          <g key={`${keyPrefix}${el.id}`} opacity={opacity} transform={transform}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={el.stroke_color || el.stroke || '#000000'}
              strokeWidth={el.stroke_width !== undefined ? el.stroke_width : 2}
              strokeDasharray={strokeDash}
              strokeLinecap="round"
            />
            {(el.arrow_head_end || el.arrow_head === 'end' || el.arrow_head === 'both') && (
              <polygon
                points={`
                  ${x2},${y2} 
                  ${x2 - headLen * Math.cos(angle - Math.PI / 6)},${y2 - headLen * Math.sin(angle - Math.PI / 6)} 
                  ${x2 - headLen * Math.cos(angle + Math.PI / 6)},${y2 - headLen * Math.sin(angle + Math.PI / 6)}
                `}
                fill={el.stroke_color || el.stroke || '#000000'}
              />
            )}
            {(el.arrow_head_start || el.arrow_head === 'start' || el.arrow_head === 'both') && (
              <polygon
                points={`
                  ${x1},${y1} 
                  ${x1 + headLen * Math.cos(angle - Math.PI / 6)},${y1 + headLen * Math.sin(angle - Math.PI / 6)} 
                  ${x1 + headLen * Math.cos(angle + Math.PI / 6)},${y1 + headLen * Math.sin(angle + Math.PI / 6)}
                `}
                fill={el.stroke_color || el.stroke || '#000000'}
              />
            )}
          </g>
        );
      }

      case 'text':
        return (
          <g key={`${keyPrefix}${el.id}`} opacity={opacity} transform={transform}>
            {renderSvgTextLines({
              text: el.text || el.content,
              x: el.x,
              y: el.y,
              width: el.width,
              height: el.height,
              fontSize: el.font_size || 20,
              fontFamily: el.font_family || 'Arial',
              fontWeight: el.font_bold ? 'bold' : (el.font_weight || 'normal'),
              fontStyle: el.font_italic ? 'italic' : (el.font_style || 'normal'),
              color: el.text_color || el.font_color || '#0f172a',
              textAlign: el.text_align || 'left',
              verticalAlign: el.vertical_align ? el.vertical_align : (el.text_align === 'center' ? 'middle' : 'top'),
            })}
          </g>
        );

      case 'icon': {
        const IconComponent = getIconComponent(el.icon_name);
        const badgeStyle = el.icon_badge || 'none';
        const badgeFill = el.badge_color || el.fill_color || el.fill || 'transparent';
        const iconColor = el.icon_color || el.stroke_color || el.stroke || el.text_color || '#38bdf8';
        const labelText = el.text || el.content || '';

        const labelFontSize = el.font_size ? el.font_size * 0.75 : 14;
        const badgeH = labelText ? Math.max(24, el.height - labelFontSize * 1.6) : el.height;
        const iconSize = Math.max(16, Math.min(el.width, badgeH) * 0.58);
        const iconX = el.x + (el.width - iconSize) / 2;
        const iconY = el.y + (badgeH - iconSize) / 2;

        return (
          <g key={`${keyPrefix}${el.id}`} opacity={opacity} transform={transform}>
            {badgeStyle === 'circle' && (
              <ellipse
                cx={el.x + el.width / 2}
                cy={el.y + badgeH / 2}
                rx={Math.max(1, Math.min(el.width, badgeH) / 2)}
                ry={Math.max(1, Math.min(el.width, badgeH) / 2)}
                fill={badgeFill}
                stroke={el.stroke_color || el.stroke || 'transparent'}
                strokeWidth={el.stroke_width || 0}
              />
            )}
            {badgeStyle === 'rounded' && (
              <rect
                x={el.x}
                y={el.y}
                width={el.width}
                height={badgeH}
                rx={Math.min(16, el.width * 0.25)}
                ry={Math.min(16, el.width * 0.25)}
                fill={badgeFill}
                stroke={el.stroke_color || el.stroke || 'transparent'}
                strokeWidth={el.stroke_width || 0}
              />
            )}
            {badgeStyle === 'none' && badgeFill !== 'transparent' && (
              <rect
                x={el.x}
                y={el.y}
                width={el.width}
                height={badgeH}
                fill={badgeFill}
              />
            )}

            <foreignObject
              x={iconX}
              y={iconY}
              width={iconSize}
              height={iconSize}
              className="pointer-events-none overflow-visible"
            >
              <div
                style={{
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: iconColor,
                }}
              >
                <IconComponent size={iconSize} color={iconColor} strokeWidth={2} />
              </div>
            </foreignObject>

            {labelText &&
              renderSvgTextLines({
                text: labelText,
                x: el.x,
                y: el.y + badgeH + 4,
                width: el.width,
                height: el.height - badgeH,
                fontSize: labelFontSize,
                fontFamily: el.font_family || 'Arial',
                fontWeight: el.font_bold ? 'bold' : (el.font_weight || 'normal'),
                fontStyle: el.font_italic ? 'italic' : (el.font_style || 'normal'),
                color: el.text_color || el.font_color || '#ffffff',
                textAlign: 'center',
                verticalAlign: 'top',
              })}
          </g>
        );
      }

      case 'motion_component': {
        return (
          <g key={`${keyPrefix}${el.id}`} opacity={opacity} transform={transform}>
            <foreignObject
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              className="overflow-visible"
              style={{ pointerEvents: 'none' }}
            >
              <div 
                style={{ 
                  width: `${el.width}px`, 
                  height: `${el.height}px`,
                  pointerEvents: 'auto',
                }}
              >
                <MotionWidget element={el} />
              </div>
            </foreignObject>
          </g>
        );
      }

      default:
        return null;
    }
  };

  // Compute current display frame
  let currentBackground = slides[slideIndex]?.background || '#0f172a';
  let elementsToRender = [];

  if (animState) {
    const { fromSlide, toSlide, progress, transitionType } = animState;
    const eased = easeInOut(progress);

    if (transitionType === 'morph') {
      currentBackground = lerpColor(fromSlide?.background || '#0f172a', toSlide?.background || '#0f172a', eased);
      const { matched, departing, arriving } = animState.morphData || matchElements(fromSlide, toSlide);

      // 1. Departing elements fade out and gently shift
      departing.forEach((el, dIdx) => {
        elementsToRender.push({
          ...el,
          x: el.x + 15 * eased,
          opacity: (el.opacity !== undefined ? el.opacity : 1.0) * (1.0 - eased),
          z_index: el.z_index ?? dIdx,
        });
      });

      // 2. Matched elements morph smoothly in position, size, geometry, and color
      matched.forEach(([elA, elB], mIdx) => {
        if (elA.type === 'image' && elB.type === 'image') {
          elementsToRender.push(...morphSlide({ background: fromSlide.background, elements: [elA] },
            { background: toSlide.background, elements: [elB] }, progress).elements);
          return;
        }
        const textA = elA.text || elA.content || '';
        const textB = elB.text || elB.content || '';
        const sameText = textA === textB;

        const x1A = elA.x1 !== undefined && elA.x1 !== null ? elA.x1 : elA.x;
        const y1A = elA.y1 !== undefined && elA.y1 !== null ? elA.y1 : elA.y;
        const x2A = elA.x2 !== undefined && elA.x2 !== null ? elA.x2 : (elA.x + elA.width);
        const y2A = elA.y2 !== undefined && elA.y2 !== null ? elA.y2 : (elA.y + elA.height);

        const x1B = elB.x1 !== undefined && elB.x1 !== null ? elB.x1 : elB.x;
        const y1B = elB.y1 !== undefined && elB.y1 !== null ? elB.y1 : elB.y;
        const x2B = elB.x2 !== undefined && elB.x2 !== null ? elB.x2 : (elB.x + elB.width);
        const y2B = elB.y2 !== undefined && elB.y2 !== null ? elB.y2 : (elB.y + elB.height);

        const fillA = elA.fill_color || elA.fill;
        const fillB = elB.fill_color || elB.fill;
        const strokeA = elA.stroke_color || elA.stroke;
        const strokeB = elB.stroke_color || elB.stroke;

        const defaultTextColorA = elA.type === 'text' ? '#0f172a' : '#ffffff';
        const defaultTextColorB = elB.type === 'text' ? '#0f172a' : '#ffffff';
        const textColorA = elA.text_color || elA.font_color || defaultTextColorA;
        const textColorB = elB.text_color || elB.font_color || defaultTextColorB;

        const morphedFill = lerpColor(fillA, fillB, eased);
        const morphedStroke = lerpColor(strokeA, strokeB, eased);
        const morphedTextColor = lerpColor(textColorA, textColorB, eased);

        const morphedEl = {
          id: elB.id || elA.id,
          type: eased >= 0.5 ? elB.type : elA.type,
          x: lerp(elA.x, elB.x, eased),
          y: lerp(elA.y, elB.y, eased),
          width: lerp(elA.width, elB.width, eased),
          height: lerp(elA.height, elB.height, eased),
          x1: lerp(x1A, x1B, eased),
          y1: lerp(y1A, y1B, eased),
          x2: lerp(x2A, x2B, eased),
          y2: lerp(y2A, y2B, eased),
          rotation: lerp(elA.rotation || 0, elB.rotation || 0, eased),
          radius: lerp(elA.radius !== undefined ? elA.radius : 16, elB.radius !== undefined ? elB.radius : 16, eased),
          fill_color: morphedFill,
          fill: morphedFill,
          stroke_color: morphedStroke,
          stroke: morphedStroke,
          stroke_width: lerp(elA.stroke_width !== undefined ? elA.stroke_width : 0, elB.stroke_width !== undefined ? elB.stroke_width : 0, eased),
          stroke_style: eased >= 0.5 ? (elB.stroke_style || 'solid') : (elA.stroke_style || 'solid'),
          text: sameText ? textA : '',
          content: sameText ? textA : '',
          font_size: lerp(elA.font_size || 20, elB.font_size || 20, eased),
          font_family: eased >= 0.5 ? (elB.font_family || 'Arial') : (elA.font_family || 'Arial'),
          font_weight: (eased >= 0.5 ? elB.font_weight : elA.font_weight) || (eased >= 0.5 ? (elB.font_bold ? 'bold' : 'normal') : (elA.font_bold ? 'bold' : 'normal')),
          font_bold: eased >= 0.5 ? (elB.font_bold || elB.font_weight === 'bold') : (elA.font_bold || elA.font_weight === 'bold'),
          font_style: (eased >= 0.5 ? elB.font_style : elA.font_style) || (eased >= 0.5 ? (elB.font_italic ? 'italic' : 'normal') : (elA.font_italic ? 'italic' : 'normal')),
          font_italic: eased >= 0.5 ? (elB.font_italic || elB.font_style === 'italic') : (elA.font_italic || elA.font_style === 'italic'),
          text_color: morphedTextColor,
          font_color: morphedTextColor,
          text_align: eased >= 0.5 ? elB.text_align : elA.text_align,
          vertical_align: eased >= 0.5 ? elB.vertical_align : elA.vertical_align,
          arrow_head: eased >= 0.5 ? elB.arrow_head : elA.arrow_head,
          arrow_head_end: eased >= 0.5 ? elB.arrow_head_end : elA.arrow_head_end,
          arrow_head_start: eased >= 0.5 ? elB.arrow_head_start : elA.arrow_head_start,
          icon_name: eased >= 0.5 ? elB.icon_name : elA.icon_name,
          icon_badge: eased >= 0.5 ? elB.icon_badge : elA.icon_badge,
          badge_color: lerpColor(elA.badge_color || fillA, elB.badge_color || fillB, eased),
          icon_color: lerpColor(elA.icon_color || strokeA, elB.icon_color || strokeB, eased),
          opacity: lerp(elA.opacity !== undefined ? elA.opacity : 1.0, elB.opacity !== undefined ? elB.opacity : 1.0, eased),
          z_index: Math.max(elA.z_index ?? mIdx, elB.z_index ?? mIdx),
          motion_data: eased >= 0.5 ? elB.motion_data : elA.motion_data,
        };

        elementsToRender.push(morphedEl);

        // Cross-fade text if content changes (matching video exporter)
        if (!sameText) {
          if (textA) {
            elementsToRender.push({
              ...morphedEl,
              id: `${elA.id}-text-out`,
              fill: 'transparent',
              fill_color: 'transparent',
              stroke: 'transparent',
              stroke_color: 'transparent',
              stroke_width: 0,
              text: textA,
              content: textA,
              text_color: textColorA,
              font_color: textColorA,
              opacity: (elA.opacity ?? 1.0) * Math.max(0, 1.0 - eased * 1.5),
              z_index: (morphedEl.z_index ?? mIdx) + 0.1,
            });
          }
          if (textB) {
            elementsToRender.push({
              ...morphedEl,
              id: `${elB.id}-text-in`,
              fill: 'transparent',
              fill_color: 'transparent',
              stroke: 'transparent',
              stroke_color: 'transparent',
              stroke_width: 0,
              text: textB,
              content: textB,
              text_color: textColorB,
              font_color: textColorB,
              opacity: (elB.opacity ?? 1.0) * Math.max(0, (eased - 0.33) * 1.5),
              z_index: (morphedEl.z_index ?? mIdx) + 0.2,
            });
          }
        }
      });

      // 3. Arriving elements fade in and settle
      arriving.forEach((el, aIdx) => {
        elementsToRender.push({
          ...el,
          x: el.x - 15 * (1.0 - eased),
          opacity: (el.opacity !== undefined ? el.opacity : 1.0) * eased,
          z_index: el.z_index ?? aIdx,
        });
      });

      // Sort by z_index to preserve true layering
      elementsToRender.sort((a, b) => (a.z_index ?? 0) - (b.z_index ?? 0));
    } else if (transitionType === 'fade') {
      currentBackground = lerpColor(fromSlide?.background || '#0f172a', toSlide?.background || '#0f172a', eased);
      // Render slide A fading out, slide B fading in
      elementsToRender = [
        ...(fromSlide?.elements || []).map(el => ({ ...el, opacity: (el.opacity ?? 1.0) * (1.0 - eased) })),
        ...(toSlide?.elements || []).map(el => ({ ...el, id: `${el.id}-incoming`, opacity: (el.opacity ?? 1.0) * eased })),
      ];
    }
  } else {
    const currentSlide = slides[slideIndex];
    elementsToRender = currentSlide?.elements || [];
  }

  const cursorClass =
    activeTool === 'laser'
      ? 'cursor-none'
      : activeTool === 'pen'
        ? 'cursor-crosshair'
        : activeTool === 'text'
          ? 'cursor-text'
          : 'cursor-default';

  // Responsive Presentation Container Geometry:
  // For 9:16 vertical reels: Size strictly according to available viewport height,
  // keeping the 9:16 vertical aspect ratio centered with pillarbox margins instead of stretching full screen!
  const containerStyle = is916
    ? {
        height: isFullscreen
          ? 'min(calc(100vh - 36px), calc(100vw * 16 / 9))'
          : 'min(calc(100vh - 96px), calc(100vw * 16 / 9))',
        width: isFullscreen
          ? 'calc(min(calc(100vh - 36px), calc(100vw * 16 / 9)) * 9 / 16)'
          : 'calc(min(calc(100vh - 96px), calc(100vw * 16 / 9)) * 9 / 16)',
        aspectRatio: '9 / 16',
        backgroundColor: currentBackground,
        touchAction: activeTool === 'pen' ? 'none' : 'auto',
      }
    : {
        width: 'min(100vw, calc(100vh * 16 / 9))',
        height: 'min(100vh, calc(100vw * 9 / 16))',
        aspectRatio: '16 / 9',
        backgroundColor: currentBackground,
        touchAction: activeTool === 'pen' ? 'none' : 'auto',
      };

  const currentSlideAnn = annotations[slideIndex] || { strokes: [], texts: [] };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Presentation Canvas Container (strictly clipped to slide dimensions) */}
      <div 
        ref={slideContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={`relative flex items-center justify-center transition-all duration-300 overflow-hidden shadow-2xl ${cursorClass} ${
          is916
            ? 'rounded-3xl border border-slate-700/80 ring-1 ring-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]'
            : ''
        }`}
        style={containerStyle}
      >
        <svg
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="w-full h-full block overflow-hidden pointer-events-none"
          style={{ overflow: 'hidden' }}
        >
          <defs>
            <clipPath id="slideShowViewportClip">
              <rect x={0} y={0} width={canvasWidth} height={canvasHeight} />
            </clipPath>
          </defs>
          <g clipPath="url(#slideShowViewportClip)">
            {elementsToRender.map(el => renderElement(el))}

            {/* Slide Annotation Strokes */}
            {currentSlideAnn.strokes.map((st, sIdx) => (
              <path
                key={`stroke-${sIdx}`}
                d={pointsToSvgPath(st.points)}
                fill="none"
                stroke={st.color}
                strokeWidth={st.width || 4}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            ))}

            {/* Active drawing stroke */}
            {currentStroke && (
              <path
                d={pointsToSvgPath(currentStroke)}
                fill="none"
                stroke={penColor}
                strokeWidth={penWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            )}

          </g>
        </svg>

        {/* Excalidraw Style Laser Pointer Canvas Overlay */}
        <canvas
          ref={laserCanvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Committed Text Annotations as interactive badges */}
        {currentSlideAnn.texts.map((txt) => (
          <div
            key={txt.id}
            className="absolute z-30 transform -translate-y-1/2 group pointer-events-auto select-none"
            style={{
              left: `${(txt.x / canvasWidth) * 100}%`,
              top: `${(txt.y / canvasHeight) * 100}%`,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md shadow-2xl border transition-transform hover:scale-105"
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                borderColor: txt.color || '#ef4444',
              }}
            >
              <span 
                className="font-bold text-sm tracking-wide whitespace-nowrap select-text"
                style={{ color: txt.color || '#ef4444' }}
              >
                {txt.text}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTextAnnotation(txt.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-red-400 rounded transition"
                title="Delete note"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))}

        {/* Text Input Overlay for Typing New Annotations */}
        {activeTextInput && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute z-40 select-text pointer-events-auto transform -translate-y-1/2"
            style={{
              left: `${Math.min(80, (activeTextInput.x / canvasWidth) * 100)}%`,
              top: `${Math.min(85, (activeTextInput.y / canvasHeight) * 100)}%`,
            }}
          >
            <div 
              className="flex items-center gap-2 px-3 py-2 bg-slate-950/95 border-2 rounded-2xl shadow-2xl backdrop-blur-xl ring-2 ring-black/40"
              style={{ borderColor: penColor }}
            >
              <input
                ref={textInputRef}
                autoFocus
                type="text"
                value={activeTextInput.text}
                onChange={(e) => setActiveTextInput((prev) => ({ ...prev, text: e.target.value }))}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitTextInput();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setActiveTextInput(null);
                  }
                }}
                placeholder="Type note & hit Enter..."
                className="px-2 py-1 bg-transparent text-white placeholder-slate-400 outline-none font-bold text-base min-w-[210px]"
                style={{ color: penColor === '#ffffff' ? '#ffffff' : penColor }}
              />
              <button
                onClick={commitTextInput}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition shadow-md"
              >
                Add
              </button>
              <button
                onClick={() => setActiveTextInput(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl transition"
                title="Cancel"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Click areas for left/right navigation (Only in Pointer mode) */}
        {activeTool === 'pointer' && (
          <>
            <div 
              onClick={prevSlide}
              className="absolute left-0 top-0 bottom-0 w-1/4 cursor-w-resize z-10" 
              title="Previous slide"
            />
            <div 
              onClick={nextSlide}
              className="absolute right-0 top-0 bottom-0 w-1/4 cursor-e-resize z-10" 
              title="Next slide"
            />
          </>
        )}
      </div>

      {/* Left-Side Bottom Hover Toolbar: ONLY visible on hover at bottom-left */}
      <div className="absolute bottom-0 left-0 p-4 z-40 group">
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto flex items-center gap-1.5 px-3 py-2 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl text-slate-300">
          
          {/* Previous Slide Button */}
          <button
            onClick={prevSlide}
            disabled={slideIndex === 0 && !animState}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition"
            title="Previous Slide (Left Arrow / Up Arrow)"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Slide Counter */}
          <span className="text-xs font-semibold text-slate-200 px-1 min-w-[50px] text-center tracking-wide select-none">
            {slideIndex + 1} / {totalSlides}
          </span>

          {/* Next Slide Button */}
          <button
            onClick={nextSlide}
            disabled={slideIndex === totalSlides - 1 && !animState}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition"
            title="Next Slide (Right Arrow / Down Arrow / Space)"
          >
            <ChevronRight size={16} />
          </button>

          <div className="h-4 w-px bg-slate-700/80 mx-0.5" />

          {/* Normal Pointer Tool */}
          <button
            onClick={() => setActiveTool('pointer')}
            className={`p-1.5 rounded-lg transition ${
              activeTool === 'pointer'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Pointer / Normal Mode (V)"
          >
            <MousePointer size={15} />
          </button>

          {/* Laser Pointer Tool */}
          <button
            onClick={() => setActiveTool((prev) => (prev === 'laser' ? 'pointer' : 'laser'))}
            className={`p-1.5 rounded-lg transition ${
              activeTool === 'laser'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
            }`}
            title="Laser Pointer (L)"
          >
            <Sun size={15} />
          </button>

          {/* Marker / Pen Tool */}
          <button
            onClick={() => setActiveTool((prev) => (prev === 'pen' ? 'pointer' : 'pen'))}
            className={`p-1.5 rounded-lg transition ${
              activeTool === 'pen'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-red-400 hover:bg-slate-800'
            }`}
            title="Marker / Pen (P)"
          >
            <PenTool size={15} />
          </button>

          {/* Text Annotation Tool */}
          <button
            onClick={() => setActiveTool((prev) => (prev === 'text' ? 'pointer' : 'text'))}
            className={`p-1.5 rounded-lg transition ${
              activeTool === 'text'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
            }`}
            title="Text Note / Annotation (T)"
          >
            <Type size={15} />
          </button>

          {/* Color Palette (available when Pen or Text tool is selected) */}
          {(activeTool === 'pen' || activeTool === 'text') && (
            <div className="flex items-center gap-1 pl-1">
              {['#ef4444', '#facc15', '#3b82f6', '#10b981', '#ffffff'].map((color) => (
                <button
                  key={color}
                  onClick={() => setPenColor(color)}
                  className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                    penColor === color ? 'scale-125 border-white ring-1 ring-white/50' : 'border-slate-600 hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Color ${color}`}
                />
              ))}
            </div>
          )}

          {/* Clear Current Slide Annotations */}
          <button
            onClick={clearCurrentSlideAnnotations}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition ml-0.5"
            title="Clear Current Slide Drawings & Notes (C)"
          >
            <Eraser size={15} />
          </button>

          <div className="h-4 w-px bg-slate-700/80 mx-0.5" />

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Enter Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Exit Slide Show */}
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
            title="Exit Presenting Mode (Esc)"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
