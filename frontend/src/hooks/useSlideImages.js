import { useEffect, useRef, useState } from 'react';
import { generateId } from './usePresentation';
import { readSlideImage } from '../rendering/imageModel.js';

export function useSlideImages({ enabled, presentation, activeSlideIndex, updatePresentation, setSelectedElementIds, setActiveTool, workspaceRef, paste }) {
  const [error, setError] = useState(''), [loading, setLoading] = useState(false);
  const current = useRef(null);
  current.current = { enabled, presentation, activeSlideIndex, updatePresentation, setSelectedElementIds, setActiveTool, workspaceRef, paste };
  async function insert(files) {
    const context = current.current, deckId = context.presentation.id;
    const slideId = context.presentation.slides[context.activeSlideIndex]?.id;
    if (!slideId) return;
    setLoading(true); setError('');
    try {
      const images = [];
      for (const file of [...files]) images.push(await readSlideImage(file));
      const vertical = context.presentation.aspect_ratio === '9:16';
      const width = vertical ? 720 : 1280, height = vertical ? 1280 : 720;
      const elements = images.map((image, i) => {
        const factor = Math.min(1, width * .7 / image.image_width, height * .7 / image.image_height);
        const w = Math.round(image.image_width * factor), h = Math.round(image.image_height * factor);
        return { ...image, id: generateId('image'), x: (width - w) / 2 + i * 16, y: (height - h) / 2 + i * 16, width: w, height: h };
      });
      context.updatePresentation(prev => prev.id !== deckId ? prev : ({ ...prev, slides: prev.slides.map(slide => slide.id !== slideId ? slide : {
        ...slide, elements: [...slide.elements, ...elements.map((image, i) => ({ ...image, z_index: Math.max(0, ...slide.elements.map(el => el.z_index || 0)) + i + 1 }))] }) }));
      const live = current.current;
      if (live.presentation.id === deckId && live.presentation.slides[live.activeSlideIndex]?.id === slideId) {
        live.workspaceRef.current?.edit(); live.setSelectedElementIds(elements.map(el => el.id)); live.setActiveTool('select');
      }
    } catch (exc) { setError(exc.message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    if (!enabled) return;
    function onPaste(event) {
      if (event.target.closest?.('input,textarea,[contenteditable="true"],[role="dialog"]')) return;
      const files = [...(event.clipboardData?.items || [])].filter(item => item.kind === 'file' && item.type.startsWith('image/')).map(item => item.getAsFile()).filter(Boolean);
      if (files.length) { event.preventDefault(); insert(files); }
      else if (current.current.paste) { event.preventDefault(); current.current.paste(); }
    }
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [enabled]);
  async function pasteFromClipboard() {
    try {
      if (navigator.clipboard?.read) {
        const items = await navigator.clipboard.read();
        const files = [];
        for (const item of items) {
          const type = item.types.find(type => /^image\/(png|jpeg|webp|gif)$/.test(type));
          if (type) files.push(await item.getType(type));
        }
        if (files.length) { await insert(files); return; }
      }
    } catch { /* Internal slide clipboard remains available if browser access is denied. */ }
    current.current.paste();
  }
  return { insert, pasteFromClipboard, error, setError, loading };
}
