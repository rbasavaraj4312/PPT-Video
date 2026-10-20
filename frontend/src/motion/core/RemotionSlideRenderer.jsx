import React from 'react';
import { SlideElement } from '../../rendering/SlideElement';

/** Scale the editor's SVG scene as a unit, keeping all layout in slide coordinates. */
export function RemotionSlideRenderer({ slide, scale = 1, isVertical = false }) {
  if (!slide) return null;
  const width = isVertical ? 720 : 1280;
  const height = isVertical ? 1280 : 720;
  const elements = [...(slide.elements || [])].sort((a, b) => (a.z_index || 0) - (b.z_index || 0));
  return <svg
    viewBox={`0 0 ${width} ${height}`}
    width={width * scale}
    height={height * scale}
    style={{ display: 'block', overflow: 'hidden', backgroundColor: slide.background || '#ffffff' }}
  >
    {elements.map(element => <SlideElement key={element.id} element={element} isPreview />)}
  </svg>;
}
