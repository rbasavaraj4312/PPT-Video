import React from 'react';
import { Composition, Series, useVideoConfig } from 'remotion';
import { RemotionSlideRenderer } from './RemotionSlideRenderer';
import { MarkerHighlight } from '@/components/remocn/marker-highlight';
import { KineticSupernovaText } from '../blocks/typography/KineticSupernovaText';
import { LiquidMorphText } from '../blocks/typography/LiquidMorphText';
import { NeonSignFlicker } from '../blocks/typography/NeonSignFlicker';
import { GlitchScrambleDecode } from '../blocks/typography/GlitchScrambleDecode';
import { PaperCutReveal } from '../blocks/typography/PaperCutReveal';
import { TypewriterSpotlight } from '../blocks/typography/TypewriterSpotlight';

/**
 * Top-level Remotion Composition component
 * Plays each slide in the presentation sequentially according to its slide_duration.
 */
export function RemotionPresentationComposition({ presentation }) {
  const { fps, width, height } = useVideoConfig();

  const slides = Array.isArray(presentation?.slides) ? presentation.slides : [];
  const isVertical = String(presentation?.aspect_ratio || '').trim() === '9:16';

  const baseW = isVertical ? 720 : 1280;
  const scale = width / baseW;

  if (slides.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white font-mono text-xl">
        Empty Presentation
      </div>
    );
  }

  return (
    <Series>
      {slides.map((slide, index) => {
        const slideSec = Math.max(1, parseFloat(slide.slide_duration) || 3);
        const durationFrames = Math.max(30, Math.round(slideSec * fps));

        return (
          <Series.Sequence key={slide.id || index} durationInFrames={durationFrames}>
            <RemotionSlideRenderer slide={slide} scale={scale} isVertical={isVertical} />
          </Series.Sequence>
        );
      })}
    </Series>
  );
}

export const MarkerHighlightScene = () => (
  <MarkerHighlight
    before="Ship it "
    highlight="fast"
    after="."
    markerColor="#facc15"
  />
);

export const SupernovaTextScene = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16' }}>
    <KineticSupernovaText
      headline="BREAK THE LIMITS"
      subheadline="AUTONOMOUS MOTION GRAPHICS CORE"
      badgeText="HYPER-KINETIC VFX"
      primaryColor="#00f2fe"
      secondaryColor="#f43f5e"
      accentGlow="#8b5cf6"
      fontSize={64}
      chromaticShift={12}
      particleCount={36}
    />
  </div>
);

export const LiquidMorphScene = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' }}>
    <LiquidMorphText text="LIQUID CHROME" primaryColor="#e2e8f0" accentColor="#38bdf8" fontSize={68} />
  </div>
);

export const NeonSignScene = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712' }}>
    <NeonSignFlicker text="OPEN ALL NIGHT" subtext="24/7 COCKTAILS & CODE" neonColor="#ff2a85" fontSize={56} />
  </div>
);

export const GlitchDecodeScene = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000000' }}>
    <GlitchScrambleDecode text="TERMINAL_BREACH_DETECTED" subtext="SYSTEM OVERRIDE // 0x7F9A_AUTHORIZED" fontSize={42} />
  </div>
);

export const PaperCutScene = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
    <PaperCutReveal word1="CRAFT" word2="DESIGN" word3="INNOVATE" fontSize={52} />
  </div>
);

export const TypewriterSpotlightScene = () => (
  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' }}>
    <TypewriterSpotlight text="Ideas emerge in the quietest hours." subtext="CHAPTER 01 — THE GENESIS" fontSize={40} />
  </div>
);

export const RemotionRoot = () => (
  <>
    <Composition
      id="SupernovaBlast"
      component={SupernovaTextScene}
      durationInFrames={120}
      fps={30}
      width={1280}
      height={720}
    />
    <Composition
      id="LiquidMorph"
      component={LiquidMorphScene}
      durationInFrames={120}
      fps={30}
      width={1280}
      height={720}
    />
    <Composition
      id="NeonFlicker"
      component={NeonSignScene}
      durationInFrames={120}
      fps={30}
      width={1280}
      height={720}
    />
    <Composition
      id="GlitchDecode"
      component={GlitchDecodeScene}
      durationInFrames={120}
      fps={30}
      width={1280}
      height={720}
    />
    <Composition
      id="PaperCut"
      component={PaperCutScene}
      durationInFrames={120}
      fps={30}
      width={1280}
      height={720}
    />
    <Composition
      id="TypewriterSpotlight"
      component={TypewriterSpotlightScene}
      durationInFrames={120}
      fps={30}
      width={1280}
      height={720}
    />
    <Composition
      id="MarkerHighlight"
      component={MarkerHighlightScene}
      durationInFrames={90}
      fps={30}
      width={1280}
      height={720}
    />
    <Composition
      id="Presentation"
      component={RemotionPresentationComposition}
      durationInFrames={300}
      fps={30}
      width={1280}
      height={720}
      defaultProps={{ presentation: null }}
    />
  </>
);
