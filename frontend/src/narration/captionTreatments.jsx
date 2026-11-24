import React from 'react';

const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
export const graphemes = text => segmenter ? Array.from(segmenter.segment(text), part => part.segment) : Array.from(text);
const clamp = value => Math.max(0, Math.min(1, value));
const rgba = (hex, opacity) => `rgba(${[1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',')},${opacity})`;

// All motion comes from the narration clock so seeking and exported frames match.
export function captionTreatment({ design, word, index, timeMs, scale, ink, accent, highlighting, markerInk, fontSize = 34, phraseWords = [word] }) {
  const duration = Math.max(1, Math.min(300, (word.endMs - word.startMs) * .8));
  const progress = clamp((timeMs - word.startMs) / duration);
  const remaining = (1 - progress) ** 3;
  const color = word.active && highlighting ? accent : ink;
  const text = word.text.trim();
  if (design === 'orbiting_words') {
    const radius = fontSize * scale * 1.6 * remaining;
    const angle = (1 - progress) * Math.PI * 1.4;
    return { style: {
      transform: `translate(${(Math.cos(angle) * radius).toFixed(3)}px, ${(Math.sin(angle) * radius * .65).toFixed(3)}px) rotate(${(-14 * remaining).toFixed(3)}deg) scale(${(1 - .2 * remaining).toFixed(3)})`,
      transformOrigin: 'center center', opacity: .2 + .8 * progress,
    }, content: text };
  }
  if (design === 'elastic_ribbon') {
    // Use the full phrase for a continuous curve, even before every word is visible.
    const lengths = phraseWords.map(item => graphemes(item.text.trim()).length);
    const total = Math.max(1, lengths.reduce((sum, length) => sum + length + 1, -1));
    const prefix = lengths.slice(0, index).reduce((sum, length) => sum + length + 1, 0);
    const midpoint = (prefix + (lengths[index] || 1) / 2) / total;
    const phase = (midpoint - .5) * Math.PI * 1.4;
    const spoken = phraseWords.find(item => item.active);
    const beatProgress = spoken ? clamp((timeMs - spoken.startMs) / Math.max(1, Math.min(350, (spoken.endMs - spoken.startMs) * .8))) : 1;
    const beat = Math.sin(beatProgress * Math.PI) * (1 - beatProgress);
    const amplitude = fontSize * scale * (.48 + beat * .12);
    const phraseWidth = Math.max(fontSize * scale, total * fontSize * scale * .56);
    const tilt = Math.atan(amplitude * Math.PI * 1.4 / phraseWidth * Math.sin(phase)) * 180 / Math.PI;
    return { style: {
      transform: `translateY(${(-Math.cos(phase) * amplitude + remaining * fontSize * scale * .3).toFixed(3)}px) rotate(${tilt.toFixed(3)}deg) scaleX(${(1 + .06 * beat).toFixed(3)})`,
      transformOrigin: 'center center', opacity: .2 + .8 * progress,
    }, content: text };
  }
  if (design === 'word_tunnel') {
    const wordDuration = Math.max(1, word.endMs - word.startMs);
    const elapsed = timeMs - word.startMs;
    const enterDuration = Math.min(140, wordDuration * .22);
    const exitDuration = Math.min(160, wordDuration * .22);
    const entering = 1 - clamp(elapsed / enterDuration);
    const leaving = clamp((elapsed - (wordDuration - exitDuration)) / exitDuration);
    // A readable hold at the focal plane separates the approach and fly-through.
    const depth = -1100 * entering ** 3 + 650 * leaving ** 2;
    const opacity = (1 - .75 * entering) * (1 - leaving ** 3);
    return { style: { fontWeight: 900, letterSpacing: '-.035em', textTransform: 'uppercase',
      transform: `perspective(${700 * scale}px) translateZ(${(depth * scale).toFixed(3)}px) rotateY(${(-12 * entering + 8 * leaving).toFixed(3)}deg)`,
      transformOrigin: 'center center', backfaceVisibility: 'hidden',
      filter: `blur(${((5 * entering ** 2 + 4 * leaving ** 2) * scale).toFixed(3)}px)`, opacity,
      textShadow: `0 ${2 * scale}px 0 rgba(0,0,0,.6), 0 ${8 * scale}px ${24 * scale}px rgba(0,0,0,.7)` }, content: text };
  }
  if (design === 'typewriter') {
    const letters = graphemes(text);
    const count = Math.min(letters.length, Math.floor(progress * letters.length) + 1);
    const cursor = word.active && count < letters.length;
    return { style: {}, content: <>{letters.slice(0, count).join('')}{cursor && <span data-caption-cursor style={{ display: 'inline-block', width: 0, height: '.95em', verticalAlign: '-.08em', borderLeft: `${2 * scale}px solid ${accent}`, opacity: Math.floor((timeMs - word.startMs) / 120) % 2 ? .45 : 1 }} /> }<span style={{ visibility: 'hidden' }}>{letters.slice(count).join('')}</span></> };
  }
  if (design === 'paper_cutout') {
    const rotation = [-2, 1.5, -1, 2, -.5][index % 5];
    const paper = word.active && highlighting ? accent : '#f4eddc';
    return { style: { margin: `${5 * scale}px ${4 * scale}px`, padding: `${3 * scale}px ${9 * scale}px`,
      color: markerInk(paper), backgroundColor: paper,
      backgroundImage: 'repeating-linear-gradient(7deg,rgba(70,49,24,.045) 0px,rgba(70,49,24,.045) 1px,transparent 1px,transparent 4px)',
      boxShadow: `${2 * scale}px ${4 * scale}px 0 rgba(0,0,0,.3)`,
      transform: `translateY(${-18 * scale * remaining}px) rotate(${rotation + 7 * remaining}deg) scale(${1 + .08 * remaining})`, opacity: .3 + .7 * progress }, content: text };
  }
  if (design === 'neon_trace') {
    const fill = clamp((progress - .3) / .7);
    return { style: { WebkitTextStroke: `${Math.max(.5, .8 * scale)}px ${color}`,
      WebkitTextFillColor: rgba(color, fill), textShadow: `0 0 ${3 * scale}px ${rgba(color, .3)}, 0 0 ${(word.active ? 14 : 5) * scale}px ${rgba(color, .35)}`,
      opacity: .65 + .35 * progress }, content: text };
  }
  if (design === 'stacked_headlines') {
    return { style: { display: 'block', textAlign: 'left', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-.035em',
      transform: `translateX(${-35 * scale * remaining}px)`, opacity: progress }, content: text };
  }
  if (design === 'focus_pull') {
    return { style: { filter: `blur(${(9 * scale * remaining).toFixed(3)}px)`, opacity: .15 + .85 * progress,
      transform: `scale(${1 + .06 * remaining})` }, content: text };
  }
  return { style: {}, content: text };
}
