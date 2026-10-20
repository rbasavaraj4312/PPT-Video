import React from 'react';
import { captionPhrase } from './timeline.js';

export function CaptionOverlay({ narration, timeMs, scale = 1 }) {
  const style = narration?.caption_style || {};
  const words = style.enabled !== false ? captionPhrase(narration?.captions || [], timeMs, style.words_per_phrase || 6) : [];
  if (!words.length) return null;
  return <div aria-hidden="true" style={{ position: 'absolute', pointerEvents: 'none', left: '5%', width: '90%',
    [style.position === 'top' ? 'top' : 'bottom']: 48 * scale, textAlign: 'center', zIndex: 40,
    fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: (style.font_size || 34) * scale, lineHeight: 1.45 }}>
    <span style={{ display: 'inline-block', background: 'rgba(0,0,0,.78)', borderRadius: 10 * scale, padding: `${8 * scale}px ${16 * scale}px` }}>
      {words.map((word, index) => <span key={index} style={{ color: word.active && style.highlight_words !== false ? (style.highlight || '#facc15') : (style.color || '#ffffff'), whiteSpace: 'pre-wrap' }}>{index ? ' ' : ''}{word.text.trim()}</span>)}
    </span>
  </div>;
}
