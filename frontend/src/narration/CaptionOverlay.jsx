import React from 'react';
import { captionLyricLines, captionPhrase, captionWords } from './timeline.js';
import { captionTreatment, graphemes } from './captionTreatments';

// Pick a readable ink color for the active marker, whatever accent the user chooses.
function markerInk(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#111827';
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 0.18 ? '#111827' : '#ffffff';
}

export function CaptionOverlay({ narration, timeMs, scale = 1, contentProps = {}, controls = null }) {
  const style = narration?.caption_style || {};
  const design = style.design || 'classic';
  const words = style.enabled !== false ? captionWords(narration?.captions || [], timeMs, style.words_per_phrase || 6, design) : [];
  if (!words.length) return null;
  const accent = style.highlight || '#facc15', ink = style.color || '#ffffff';
  const highlighting = style.highlight_words !== false;
  const lyricLines = design === 'stacking_lyrics' ? captionLyricLines(narration?.captions || [], timeMs, style.words_per_phrase || 6) : [];
  const phraseWords = design === 'elastic_ribbon' ? captionPhrase(narration?.captions || [], timeMs, style.words_per_phrase || 6) : words;
  const position = style.position === 'custom'
    ? { left: `${style.x_percent ?? 50}%`, top: `${style.y_percent ?? 50}%`, width: 'max-content', maxWidth: '90%', transform: 'translate(-50%, -50%)' }
    : style.position === 'center' ? { top: '50%', transform: 'translateY(-50%)' }
      : { [style.position === 'top' ? 'top' : 'bottom']: 48 * scale };
  const treatments = {
    classic: { background: 'rgba(0,0,0,.78)', borderRadius: 10 * scale, padding: `${8 * scale}px ${16 * scale}px` },
    editorial: { background: 'rgba(16,20,29,.90)', borderLeft: `${4 * scale}px solid ${accent}`, padding: `${12 * scale}px ${22 * scale}px`, textAlign: 'left', boxShadow: `0 ${5 * scale}px ${20 * scale}px rgba(0,0,0,.25)` },
    marker: { padding: `${7 * scale}px ${12 * scale}px`, background: 'rgba(15,23,42,.82)', borderRadius: 3 * scale },
    impact: { textTransform: 'uppercase', letterSpacing: '-0.035em', textShadow: `0 ${3 * scale}px 0 rgba(0,0,0,.8), 0 ${7 * scale}px ${22 * scale}px rgba(0,0,0,.65)` },
    camera_zoom_out: { letterSpacing: '-0.025em', textShadow: `0 ${3 * scale}px ${14 * scale}px rgba(0,0,0,.8)` },
    wavy: { textShadow: `0 ${3 * scale}px ${12 * scale}px rgba(0,0,0,.75)`, padding: `${8 * scale}px 0` },
    signal: { background: 'rgba(8,16,30,.92)', borderRadius: 4 * scale, padding: `${10 * scale}px ${18 * scale}px`, borderBottom: `${3 * scale}px solid ${accent}`, boxShadow: `0 ${6 * scale}px ${24 * scale}px rgba(0,0,0,.3)` },
    typewriter: { fontFamily: 'Courier New, monospace', background: 'rgba(10,17,26,.88)', borderRadius: 4 * scale, padding: `${10 * scale}px ${16 * scale}px` },
    paper_cutout: { textShadow: 'none', padding: `${8 * scale}px` },
    neon_trace: { letterSpacing: '.015em', padding: `${8 * scale}px`, textShadow: 'none' },
    stacked_headlines: { textAlign: 'left', lineHeight: 1.05, padding: `${5 * scale}px ${12 * scale}px`, borderLeft: `${4 * scale}px solid ${accent}`, textShadow: `0 ${3 * scale}px ${10 * scale}px rgba(0,0,0,.7)` },
    focus_pull: { letterSpacing: '-.015em', textShadow: `0 ${2 * scale}px ${8 * scale}px rgba(0,0,0,.6)` },
    word_tunnel: { padding: `${8 * scale}px`, overflow: 'visible' },
    orbiting_words: { padding: `${12 * scale}px`, textShadow: `0 ${3 * scale}px ${12 * scale}px rgba(0,0,0,.75)` },
    elastic_ribbon: { padding: `${(style.font_size || 34) * scale * .55}px ${12 * scale}px`, textShadow: `0 ${3 * scale}px ${12 * scale}px rgba(0,0,0,.75)` },
    big_kinetic: { padding: '.4em .15em', lineHeight: 1.35, textShadow: `0 ${3 * scale}px ${14 * scale}px rgba(0,0,0,.8)` },
    handwritten: { fontFamily: '"Noteworthy", "Chalkboard SE", "Comic Sans MS", cursive', lineHeight: 1.5, padding: '.15em .2em', filter: `drop-shadow(0 ${2 * scale}px ${3 * scale}px rgba(0,0,0,.7))` },
    stacking_lyrics: { textAlign: 'left', lineHeight: 1.3, fontWeight: 800, letterSpacing: '-.025em', textShadow: `0 ${3 * scale}px ${12 * scale}px rgba(0,0,0,.8)` },
    outline_to_solid: { lineHeight: 1.3, padding: '.1em', textShadow: 'none' },
  };
  const containerStyle = treatments[design] || { textShadow: `0 ${2 * scale}px ${8 * scale}px rgba(0,0,0,.55)` };
  return <div aria-hidden={contentProps.role ? undefined : true} style={{ position: 'absolute', pointerEvents: 'none', left: '5%', width: '90%',
    ...position, textAlign: 'center', zIndex: 40, fontFamily: design === 'editorial' ? 'Georgia, serif' : 'Arial, sans-serif',
    fontWeight: design === 'editorial' ? 600 : 700, fontSize: (style.font_size || 34) * scale,
    lineHeight: design === 'classic' ? 1.45 : design === 'editorial' ? 1.25 : 1.15 }}>
    <span {...contentProps} data-caption-design={design} style={{ display: 'inline-block', position: 'relative', maxWidth: '100%', overflowWrap: 'anywhere',
      ...containerStyle, ...contentProps.style }}>
      {(() => {
        const renderWord = (word, index) => {
        const progress = Math.max(0, Math.min(1, (timeMs - word.startMs) / 180));
        const zoomProgress = Math.max(0, Math.min(1, (timeMs - word.startMs) / Math.max(1, Math.min(320, (word.endMs - word.startMs) * .75))));
        const zoomScale = 1 + 0.65 * (1 - zoomProgress) ** 3;
        const active = word.active && highlighting;
        const animated = ['build', 'word', 'marker', 'impact', 'signal'].includes(design) && word.active;
        const treatment = captionTreatment({ design, word, index, timeMs, scale, ink, accent, highlighting, markerInk, fontSize: style.font_size || 34, phraseWords });
        return <span key={`${word.startMs}-${index}`} style={{ display: 'inline-block', whiteSpace: 'pre-wrap',
          ...(['big_kinetic', 'handwritten', 'outline_to_solid'].includes(design) ? { marginRight: '.22em', maxWidth: '100%', overflowWrap: 'anywhere', whiteSpace: 'normal' } : {}),
          color: active && design === 'marker' ? markerInk(accent) : active ? accent : ink,
          ...(active && design === 'marker' ? { background: accent, borderRadius: 3 * scale, boxShadow: `0 0 0 ${3 * scale}px ${accent}` } : {}),
          ...(active && design === 'editorial' ? { textDecoration: 'underline', textDecorationColor: accent, textUnderlineOffset: '0.18em', textDecorationThickness: '0.07em' } : {}),
          ...(design === 'camera_zoom_out' && word.active ? { opacity: 0.65 + 0.35 * zoomProgress, transform: `scale(${zoomScale})`, transformOrigin: 'center center' }
            : animated ? { opacity: 0.5 + progress * 0.5, transform: `translateY(${(1 - progress) * (design === 'impact' ? 20 : 10) * scale}px) scale(${(design === 'impact' ? 1.12 : 0.94) + progress * (design === 'impact' ? -0.12 : 0.06)})` } : {}),
          ...treatment.style
        }}>{index && !['stacked_headlines', 'paper_cutout', 'big_kinetic', 'handwritten', 'outline_to_solid'].includes(design) ? ' ' : ''}{design === 'wavy' ? (() => {
          const letters = graphemes(word.text.trim());
          // Each letter enters in sequence, then settles before the word ends.
          const duration = Math.max(1, Math.min(400, (word.endMs - word.startMs) * 0.85));
          return letters.map((letter, letterIndex) => {
            const delay = letters.length > 1 ? duration * 0.6 * letterIndex / (letters.length - 1) : 0;
            const entrance = Math.max(0, Math.min(1, (timeMs - word.startMs - delay) / (duration * 0.4)));
            const offset = (Math.sin(entrance * Math.PI * 2) * (1 - entrance) + (1 - entrance) * 0.3) * (style.font_size || 34) * scale * 0.18;
            return <span key={letterIndex} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: entrance, transform: `translateY(${offset.toFixed(3)}px)` }}>{letter}</span>;
          });
        })() : treatment.content}</span>;
        };
        if (design !== 'stacking_lyrics') return words.map(renderWord);
        return lyricLines.map((line, index) => {
          const entrance = Math.max(0, Math.min(1, (timeMs - line.startMs) / 260));
          const currentStart = lyricLines[lyricLines.length - 1].startMs;
          const shift = (1 - Math.max(0, Math.min(1, (timeMs - currentStart) / 260))) ** 3;
          return <span key={line.id} data-caption-lyric={line.current ? 'current' : 'previous'} style={{ display: 'block',
            opacity: line.current ? .3 + .7 * entrance : .25 + .15 * index,
            transform: `translateY(${(shift * (style.font_size || 34) * scale * .5).toFixed(3)}px)`,
            padding: '.08em 0' }}>{line.words.map(renderWord)}</span>;
        });
      })()}
      {controls}
    </span>
  </div>;
}
