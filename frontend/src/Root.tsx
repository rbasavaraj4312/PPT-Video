import React from "react";
import { Composition } from "remotion";
import { MarkerHighlight } from "@/components/remocn/marker-highlight";
import { KineticSupernovaText } from "./motion/blocks/typography/KineticSupernovaText";
import { LiquidMorphText } from "./motion/blocks/typography/LiquidMorphText";
import { NeonSignFlicker } from "./motion/blocks/typography/NeonSignFlicker";
import { GlitchScrambleDecode } from "./motion/blocks/typography/GlitchScrambleDecode";
import { PaperCutReveal } from "./motion/blocks/typography/PaperCutReveal";
import { TypewriterSpotlight } from "./motion/blocks/typography/TypewriterSpotlight";
import { RemotionPresentationComposition } from "./motion/core/RemotionRoot";

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

export default RemotionRoot;
