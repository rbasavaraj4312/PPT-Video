import React from 'react';
import { SlideElement } from '../../rendering/SlideElement';

export const SlideThumbnail = React.memo(function SlideThumbnail({ slide, vertical = false }) {
  const width = vertical ? 720 : 1280, height = vertical ? 1280 : 720;
  return <svg viewBox={`0 0 ${width} ${height}`} className="editor-slide-thumbnail" aria-hidden="true" style={{ background: slide.background || '#fff', aspectRatio: `${width}/${height}` }}>
    {[...(slide.elements || [])].sort((a, b) => (a.z_index || 0) - (b.z_index || 0)).map(element =>
      element.type === 'motion_component' ? <g key={element.id}><rect x={element.x} y={element.y} width={element.width} height={element.height} rx="12" fill={element.motion_data?.card_color || '#16283e'} /><text x={element.x + 12} y={element.y + 28} fill="#94a3b8" fontSize="20">{element.motion_data?.title || 'Motion'}</text></g>
      : <SlideElement key={element.id} element={element} />)}
  </svg>;
});
