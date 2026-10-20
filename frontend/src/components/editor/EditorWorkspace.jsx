import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import { CheckCircle2, Pencil, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { SlideSidebar } from '../SlideSidebar';
import { NarratedComposition } from '../../narration/NarratedComposition';
import { CaptionOverlay } from '../../narration/CaptionOverlay';
import { narrationReady } from '../../narration/timeline';
import { editorTimeline, slideAtFrame } from '../../narration/editorState.js';
import { speechUrl } from '../../services/speech';
import { EditorTimeline } from './EditorTimeline';
import { NarrationInspector } from './NarrationInspector';
import { RevealControls } from './RevealControls';
import { revealIssues } from '../../narration/reveals.js';
import './editor-workspace.css';

export const EditorWorkspace = forwardRef(function EditorWorkspace({ presentation, activeSlideIndex, onSelectSlide,
  updatePresentation, onUpdateSlide, selectedElementId, selectedElements = [], onUpdateSelectedElements, onSelectRevealElement,
  toolbar, canvas, designPanel, sidebarProps }, ref) {
  const [tab, setTab] = useState('voice');
  const [sidebarHidden, setSidebarHidden] = useState(() => {
    try { return localStorage.getItem('ppt_slides_sidebar_hidden') === 'true'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('ppt_slides_sidebar_hidden', String(sidebarHidden)); } catch { /* Layout works without storage. */ }
  }, [sidebarHidden]);
  const [preview, setPreview] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const revealStop = useRef(null), markerSelection = useRef(false);
  const player = useRef(null), stage = useRef(null), frameRef = useRef(frame), playingRef = useRef(playing), indexRef = useRef(activeSlideIndex);
  const [size, setSize] = useState({ width: 1000, height: 580 });
  const timeline = useMemo(() => editorTimeline(presentation), [presentation]);
  const issues = useMemo(() => revealIssues(timeline.items), [timeline]);
  const timelineRef = useRef(timeline);
  const selectSlideRef = useRef(onSelectSlide);
  selectSlideRef.current = onSelectSlide;
  const selectSlide = useCallback(index => selectSlideRef.current(index), []);
  timelineRef.current = timeline; frameRef.current = frame; playingRef.current = playing; indexRef.current = activeSlideIndex;
  const vertical = presentation.aspect_ratio === '9:16';
  const width = vertical ? 720 : 1280, height = vertical ? 1280 : 720;
  const inputProps = useMemo(() => ({ presentation, assetBase: speechUrl('/assets') }), [presentation]);
  const edit = useCallback(() => { revealStop.current = null; player.current?.pause(); setPlaying(false); setPreview(false); }, []);
  const seek = useCallback(value => {
    revealStop.current = null;
    const target = Math.max(0, Math.min(timelineRef.current.totalFrames - 1, Math.round(value)));
    player.current?.pause(); setPlaying(false); setFrame(target); frameRef.current = target;
    setPreview(true); selectSlide(slideAtFrame(timelineRef.current.items, target));
    player.current?.seekTo(target);
  }, [selectSlide]);
  function play() {
    revealStop.current = null;
    if (playing) { player.current?.pause(); setPlaying(false); return; }
    if (frame >= timeline.totalFrames - 1) { frameRef.current = 0; setFrame(0); player.current?.seekTo(0); }
    setPlaying(true); setPreview(true); player.current?.play();
  }
  useImperativeHandle(ref, () => ({ preview: () => {
    revealStop.current = null;
    if (frameRef.current >= timelineRef.current.totalFrames - 1) { frameRef.current = 0; setFrame(0); player.current?.seekTo(0); }
    setPlaying(true); setPreview(true); player.current?.play();
  }, edit,
    showVoice: () => { edit(); setTab('voice'); } }), [edit]);
  useEffect(() => {
    if (selectedElementId) { if (!markerSelection.current) edit(); setTab('design'); }
    markerSelection.current = false;
  }, [selectedElementId, edit]);
  function previewReveal(resolved) {
    const start = Math.max(0, resolved.trigger - 15);
    revealStop.current = Math.min(timeline.totalFrames - 1, resolved.trigger + resolved.duration + 30);
    setFrame(start); frameRef.current = start; player.current?.seekTo(start);
    setPreview(true); setPlaying(true); player.current?.play();
  }
  function selectReveal(slideIndex, elementId, target) {
    markerSelection.current = elementId !== selectedElementId;
    seek(target);
    selectSlide(slideIndex);
    onSelectRevealElement?.(elementId, slideIndex);
    setTab('design');
  }
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(element); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!preview || !player.current) return;
    const instance = player.current;
    const onFrame = event => {
      setFrame(event.detail.frame);
      if (revealStop.current !== null && event.detail.frame >= revealStop.current) {
        instance.pause(); revealStop.current = null; setPlaying(false);
      }
      const index = slideAtFrame(timelineRef.current.items, event.detail.frame);
      if (playingRef.current && index !== indexRef.current) selectSlide(index);
    };
    const onPlay = () => setPlaying(true), onPause = () => setPlaying(false);
    instance.addEventListener('frameupdate', onFrame); instance.addEventListener('play', onPlay);
    instance.addEventListener('pause', onPause); instance.addEventListener('ended', onPause);
    instance.seekTo(frameRef.current);
    if (playingRef.current) instance.play();
    return () => { instance.removeEventListener('frameupdate', onFrame); instance.removeEventListener('play', onPlay); instance.removeEventListener('pause', onPause); instance.removeEventListener('ended', onPause); };
  }, [preview, selectSlide]);
  useEffect(() => { edit(); setFrame(0); }, [presentation.id, edit]);
  useEffect(() => {
    if (!preview) setFrame(timelineRef.current.items[activeSlideIndex]?.start || 0);
  }, [activeSlideIndex, presentation.id]);
  useEffect(() => {
    if (frameRef.current >= timeline.totalFrames) { setFrame(timeline.totalFrames - 1); player.current?.seekTo(timeline.totalFrames - 1); }
  }, [timeline.totalFrames]);

  const slide = presentation.slides[activeSlideIndex];
  const localMs = Math.max(0, frame - (timeline.items[activeSlideIndex]?.start || 0) + (timeline.items[activeSlideIndex]?.audio_from || 0)) / 30 * 1000;
  const previewWidth = Math.max(100, Math.min(size.width - 48, (size.height - 48) * width / height));
  return <div className="editor-workspace" data-testid="editor-workspace" style={{ '--slides-sidebar-width': sidebarHidden ? '0px' : undefined }}>
    <SlideSidebar {...sidebarProps} id="slide-sidebar" hidden={sidebarHidden} slides={presentation.slides} aspectRatio={presentation.aspect_ratio || '16:9'} activeSlideIndex={activeSlideIndex}
      onSelectSlide={index => { edit(); setFrame(timeline.items[index]?.start || 0); onSelectSlide(index); }} />
    <main className="workspace-center">
      <div className="workspace-toolbar" onPointerDownCapture={event => { if (!event.target.closest('[data-sidebar-toggle]')) edit(); }}>
        <button type="button" data-sidebar-toggle className="editor-icon-button sidebar-toggle" aria-controls="slide-sidebar" aria-expanded={!sidebarHidden}
          aria-label={sidebarHidden ? 'Show slide sidebar' : 'Hide slide sidebar'} title={sidebarHidden ? 'Show slide sidebar' : 'Hide slide sidebar'}
          onClick={() => setSidebarHidden(hidden => !hidden)}>
          {sidebarHidden ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
        </button>
        {toolbar}
      </div>
      <div ref={stage} className="workspace-stage">
        {preview && issues.length > 0 && <div className="reveal-preview-warning" role="status">{issues.length} reveal{issues.length === 1 ? '' : 's'} need attention. Unresolved elements remain visible. Select their timeline markers to relink.</div>}
        {preview ? <div className="workspace-inline-preview"><div style={{ width: previewWidth, height: previewWidth * height / width }}>
          <Player ref={player} component={NarratedComposition} inputProps={inputProps} durationInFrames={timeline.totalFrames}
            compositionWidth={width} compositionHeight={height} fps={30} controls={false} autoPlay={false}
            style={{ width: '100%', height: '100%' }} clickToPlay={false} doubleClickToFullscreen={false} loop={false} />
        </div><button className="return-to-edit editor-secondary" onClick={edit}><Pencil size={13} />Back to editing</button></div>
          : React.cloneElement(canvas, { overlay: narrationReady(slide?.narration) ? <CaptionOverlay narration={slide.narration} timeMs={localMs} /> : null })}
      </div>
      <EditorTimeline presentation={presentation} timeline={timeline} frame={frame} playing={playing} onSeek={seek} onTogglePlay={play}
        activeSlideIndex={activeSlideIndex} onCaptionSelect={() => setTab('captions')} onRevealSelect={selectReveal} />
    </main>
    <NarrationInspector tab={tab} onTabChange={value => { if (value === 'design') edit(); setTab(value); }} presentation={presentation}
      activeSlideIndex={activeSlideIndex} updatePresentation={updatePresentation} onUpdateSlide={onUpdateSlide} designPanel={designPanel}
      revealPanel={<RevealControls key={selectedElements.map(element => element.id).join('|')} items={timeline.items} slideIndex={activeSlideIndex} selectedElements={selectedElements}
        onChange={patch => { edit(); onUpdateSelectedElements?.(patch); }} onPreview={previewReveal} />}
      onEdit={edit} onSeekCaption={ms => seek((timeline.items[activeSlideIndex]?.start || 0) - (timeline.items[activeSlideIndex]?.audio_from || 0) + Math.ceil(ms / 1000 * 30))} />
    <footer className="workspace-status"><span><CheckCircle2 size={13} />{narrationReady(slide?.narration) ? 'Narration ready' : 'Edit slides, voice and captions in one place'}</span><span>Slide {activeSlideIndex + 1} of {presentation.slides.length} <i />{presentation.aspect_ratio || '16:9'}</span></footer>
  </div>;
});
