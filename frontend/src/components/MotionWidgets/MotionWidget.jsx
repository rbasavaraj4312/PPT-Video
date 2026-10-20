import React, { useContext, useLayoutEffect, useMemo, useRef } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { getRegisteredMotionComponent, getDefaultVariables } from '../../motion/registry';
import { getMotionTemplateById } from '../../data/motionComponentsCatalog';
import { MotionFrameContext } from '../../motion/core/MotionFrameContext';

function FrameLockedHtml({ code }) {
  const root = useRef(null);
  const presentationFrame = useCurrentFrame();
  const motionFrame = useContext(MotionFrameContext);
  const frame = motionFrame ?? presentationFrame;
  const { fps } = useVideoConfig();
  useLayoutEffect(() => {
    // Resolve freshly inserted styles before enumerating CSS animations.
    if (root.current) getComputedStyle(root.current).opacity;
    for (const animation of root.current?.getAnimations({ subtree: true }) || []) {
      animation.pause();
      animation.currentTime = frame / fps * 1000;
    }
  }, [frame, fps, code]);
  return <div ref={root} className="w-full h-full" dangerouslySetInnerHTML={{ __html: code }} />;
}

export function MotionWidget({ element, isPreview = false }) {
  const motionData = element?.motion_data || {};
  const componentId = motionData.component_id || element?.component_id;

  // 1. Check if component is in the New Typed Native React Registry (React Bits, Aceternity, Remocn, Shotcraft)
  const registered = useMemo(() => {
    return getRegisteredMotionComponent(componentId);
  }, [componentId]);

  if (registered && registered.component) {
    const MotionComp = registered.component;
    const resolvedVars = {
      ...getDefaultVariables(registered),
      ...(registered.defaultProps || {}),
      ...(motionData.custom_vars || {}),
    };

    return (
      <div data-motion-component={componentId} className="relative w-full h-full overflow-hidden select-none pointer-events-none">
        <MotionComp {...resolvedVars} />
      </div>
    );
  }

  return <LegacyMotionWidget element={element} isPreview={isPreview} />;
}

function LegacyMotionWidget({ element, isPreview }) {
  const motionData = element?.motion_data || {};
  const componentId = motionData.component_id || element?.component_id;

  // 2. Fallback to Legacy HTML/CSS templates from motionComponentsCatalog
  const fallbackTpl = useMemo(() => {
    return getMotionTemplateById(componentId);
  }, [componentId]);

  const rawCode = motionData.code || motionData.custom_html || fallbackTpl?.code || '<div style="padding: 16px; color: white;">Motion Component</div>';
  const customVars = {
    ...(fallbackTpl?.custom_vars || {}),
    ...(motionData.custom_vars || {}),
    ...motionData,
  };

  const interpolatedCode = useMemo(() => {
    return rawCode.replace(/{{\s*([a-zA-Z0-9_\-.]+)\s*}}/gi, (match, varName) => {
      const trimmed = varName.trim();
      if (customVars[trimmed] !== undefined && customVars[trimmed] !== null) {
        return String(customVars[trimmed]);
      }
      const lowerKey = Object.keys(customVars).find(k => k.toLowerCase() === trimmed.toLowerCase());
      if (lowerKey && customVars[lowerKey] !== undefined && customVars[lowerKey] !== null) {
        return String(customVars[lowerKey]);
      }
      return match;
    });
  }, [rawCode, customVars]);

  const scopeId = `mot-widget-${(element?.id || 'live').replace(/[^a-zA-Z0-9_-]/g, '')}`;

  return (
    <div 
      id={scopeId}
      data-motion-component={componentId}
      className="relative w-full h-full overflow-hidden select-none"
    >
      {isPreview ? <FrameLockedHtml code={interpolatedCode} /> : <div 
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: interpolatedCode }}
      />}
    </div>
  );
}
