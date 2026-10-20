import React, { useRef, useState } from 'react';
import { cropImagePatch, fullCrop, normalizedCrop, readSlideImage } from '../../rendering/imageModel.js';

export function ImageCropDialog({ element, onClose, onApply }) {
  const [crop, setCrop] = useState(() => normalizedCrop(element.image_crop));
  const drag = useRef(null), stage = useRef(null);
  function begin(event, handle) {
    event.preventDefault(); event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = stage.current.getBoundingClientRect();
    drag.current = { handle, crop, x: event.clientX, y: event.clientY, width: rect.width, height: rect.height };
  }
  function move(event) {
    const d = drag.current;
    if (!d) return;
    const dx = (event.clientX - d.x) / d.width, dy = (event.clientY - d.y) / d.height;
    if (d.handle === 'move') {
      setCrop(normalizedCrop({ ...d.crop, x: d.crop.x + dx, y: d.crop.y + dy })); return;
    }
    let left = d.crop.x, top = d.crop.y, right = left + d.crop.width, bottom = top + d.crop.height;
    if (d.handle.includes('w')) left = Math.max(0, Math.min(right - .02, left + dx));
    if (d.handle.includes('e')) right = Math.min(1, Math.max(left + .02, right + dx));
    if (d.handle.includes('n')) top = Math.max(0, Math.min(bottom - .02, top + dy));
    if (d.handle.includes('s')) bottom = Math.min(1, Math.max(top + .02, bottom + dy));
    setCrop(normalizedCrop({ x: left, y: top, width: right - left, height: bottom - top }));
  }
  function preset(ratio) {
    if (!ratio) { setCrop(fullCrop()); return; }
    const natural = element.image_width / element.image_height;
    const width = Math.min(1, ratio / natural), height = Math.min(1, natural / ratio);
    setCrop({ x: (1 - width) / 2, y: (1 - height) / 2, width, height });
  }
  return <div className="image-dialog-backdrop" role="dialog" aria-modal="true" aria-label="Crop image" onKeyDown={event => {
    event.stopPropagation();
    if (event.key === 'Escape') onClose();
    if (event.key === 'Tab') {
      const controls = [...event.currentTarget.querySelectorAll('button,input')];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }}>
    <div className="image-dialog">
      <h2>Crop image</h2><p>Drag the selection to reposition it. Drag a corner to crop. The original image is preserved.</p>
      <div className="image-crop-presets">{[['Original', 0], ['Square', 1], ['16:9', 16 / 9], ['4:3', 4 / 3], ['9:16', 9 / 16]].map(([label, ratio]) => <button key={label} className="editor-secondary" onClick={() => preset(ratio)}>{label}</button>)}</div>
      <div ref={stage} className="image-crop-stage" style={{ aspectRatio: `${element.image_width} / ${element.image_height}`, width: `min(100%, ${48 * element.image_width / element.image_height}vh)` }}>
        <img src={element.image_src} alt={element.image_name || 'Image to crop'} draggable={false} />
        <div className="image-crop-selection" aria-label="Crop selection" style={{ left: `${crop.x * 100}%`, top: `${crop.y * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%` }} onPointerDown={event => begin(event, 'move')} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
          {['nw', 'ne', 'sw', 'se'].map(handle => <button key={handle} aria-label={`Crop ${handle} corner`} className={`image-crop-handle ${handle}`} onPointerDown={event => begin(event, handle)} />)}
        </div>
      </div>
      <div className="editor-field-grid image-crop-fields">{[['x', 'Left'], ['y', 'Top'], ['width', 'Width'], ['height', 'Height']].map(([key, label]) => <label key={key}>{label} (%)<input className="editor-field" aria-label={`Crop ${label.toLowerCase()}`} type="number" min={key === 'x' || key === 'y' ? 0 : 2} max="100" step="1" value={Number((crop[key] * 100).toFixed(1))} onChange={event => setCrop(normalizedCrop({ ...crop, [key]: Number(event.target.value) / 100 }))} /></label>)}</div>
      <div className="image-dialog-actions"><button className="editor-secondary" onClick={onClose}>Cancel</button><button autoFocus className="editor-generate" onClick={() => onApply(crop)}>Apply crop</button></div>
    </div>
  </div>;
}

export function ImageProperties({ element: el, onUpdateElement, onDeleteElement, onDuplicateElement, onBringToFront, onSendToBack }) {
  const [cropping, setCropping] = useState(false), [error, setError] = useState('');
  const replace = useRef(null);
  const update = patch => onUpdateElement(el.id, patch);
  function size(key, value) {
    const amount = Math.max(10, Math.min(10000, Number(value) || 10));
    const patch = { [key]: amount };
    if (el.aspect_locked !== false) patch[key === 'width' ? 'height' : 'width'] = amount * (key === 'width' ? el.height / el.width : el.width / el.height);
    update(patch);
  }
  async function replaceImage(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try { const image = await readSlideImage(file); update({ ...image, ...cropImagePatch({ ...el, ...image }, fullCrop()) }); setError(''); }
    catch (exc) { setError(exc.message); }
  }
  return <aside className="image-properties p-4 space-y-4">
    <h3 className="inspector-heading">Image</h3><p className="editor-hint">{el.image_name || 'Pasted image'} · {el.image_width} × {el.image_height}</p>
    {error && <p role="alert" className="editor-alert">{error}</p>}
    <div className="sample-actions"><button className="editor-secondary" onClick={() => setCropping(true)}>Crop image</button><button className="editor-secondary" onClick={() => replace.current.click()}>Replace image</button></div>
    <input ref={replace} type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Replace image file" hidden onChange={replaceImage} />
    <div className="editor-field-grid">{[['x', 'X position'], ['y', 'Y position'], ['width', 'Image width'], ['height', 'Image height']].map(([key, label]) => <label key={key}>{label}<input className="editor-field" aria-label={label} type="number" step="1" value={Number(el[key].toFixed(1))} onChange={event => key === 'width' || key === 'height' ? size(key, event.target.value) : update({ [key]: Number(event.target.value) })} /></label>)}</div>
    <label className="editor-check"><input type="checkbox" checked={el.aspect_locked !== false} onChange={event => update({ aspect_locked: event.target.checked })} />Lock aspect ratio</label>
    <label>Rotation (degrees)<input className="editor-field" aria-label="Image rotation" type="number" min="-360" max="360" value={el.rotation || 0} onChange={event => update({ rotation: Number(event.target.value) })} /></label>
    <div className="sample-actions"><button className="editor-secondary" onClick={() => update({ rotation: ((el.rotation || 0) + 90) % 360 })}>Rotate 90°</button><button className="editor-secondary" aria-pressed={Boolean(el.flip_x)} onClick={() => update({ flip_x: !el.flip_x })}>Flip horizontal</button><button className="editor-secondary" aria-pressed={Boolean(el.flip_y)} onClick={() => update({ flip_y: !el.flip_y })}>Flip vertical</button></div>
    {[["opacity", 'Opacity', 100], ['image_brightness', 'Brightness', 200], ['image_contrast', 'Contrast', 200], ['image_saturation', 'Saturation', 200]].map(([key, label, max]) => <label className="image-adjustment" key={key}>{label}<span>{key === 'opacity' ? Math.round((el.opacity ?? 1) * 100) : el[key] ?? 100}%</span><input aria-label={`Image ${label.toLowerCase()}`} type="range" min="0" max={max} value={key === 'opacity' ? (el.opacity ?? 1) * 100 : el[key] ?? 100} onChange={event => update({ [key]: Number(event.target.value) / (key === 'opacity' ? 100 : 1) })} /></label>)}
    <button className="editor-secondary full" onClick={() => update({ ...cropImagePatch(el, fullCrop()), rotation: 0, flip_x: false, flip_y: false, opacity: 1, image_brightness: 100, image_contrast: 100, image_saturation: 100 })}>Reset image edits</button>
    <div className="sample-actions"><button className="editor-secondary" onClick={() => onDuplicateElement(el.id)}>Duplicate</button><button className="editor-secondary" onClick={() => onDeleteElement(el.id)}>Delete image</button><button className="editor-secondary" onClick={() => onBringToFront(el.id)}>Bring to front</button><button className="editor-secondary" onClick={() => onSendToBack(el.id)}>Send to back</button></div>
    {cropping && <ImageCropDialog element={el} onClose={() => setCropping(false)} onApply={crop => { update(cropImagePatch(el, crop)); setCropping(false); }} />}
  </aside>;
}
