import { useState, useEffect, useContext } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { MotionFrameContext } from './MotionFrameContext';

/**
 * Hook that safely returns current frame & fps whether inside a Remotion
 * Composition/Player or inside standard React DOM canvas.
 *
 * @param {number} fallbackFps - Frame rate (default: 30)
 * @param {object} options - { loop: boolean, maxFrames: number }
 *   - loop: if false (default), animation performs once and stops at resting state.
 *   - maxFrames: maximum frames before animation settles (default: 180).
 */
export function useSafeFrame(fallbackFps = 30, options = {}) {
  const motionFrame = useContext(MotionFrameContext);
  const { loop = false, maxFrames = 180 } = typeof options === 'object' && options !== null ? options : {};
  let remotionFrame = null;
  let remotionFps = null;

  try {
    remotionFrame = useCurrentFrame();
    const config = useVideoConfig();
    remotionFps = config?.fps || fallbackFps;
  } catch (err) {
    // Outside Remotion context - fallback to internal animated frame counter
    remotionFrame = null;
    remotionFps = null;
  }

  // If outside Remotion (e.g. interactive canvas edit mode), run a gentle requestAnimationFrame clock
  const [localFrame, setLocalFrame] = useState(0);

  useEffect(() => {
    if (motionFrame !== null || remotionFrame !== null) return;
    let animId;
    let startTime = null;

    const tick = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsedSeconds = (timestamp - startTime) / 1000;
      const rawCurrentFrame = Math.floor(elapsedSeconds * fallbackFps);

      if (!loop) {
        const clamped = Math.min(maxFrames, rawCurrentFrame);
        setLocalFrame(clamped);
        if (rawCurrentFrame < maxFrames) {
          animId = requestAnimationFrame(tick);
        }
      } else {
        setLocalFrame(rawCurrentFrame % maxFrames);
        animId = requestAnimationFrame(tick);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [fallbackFps, loop, maxFrames, motionFrame !== null, remotionFrame !== null]);

  const sourceFrame = Math.max(0, motionFrame ?? remotionFrame ?? localFrame);
  const frame = maxFrames > 0 ? (loop ? sourceFrame % maxFrames : Math.min(sourceFrame, maxFrames)) : sourceFrame;
  return { frame, fps: remotionFps ?? fallbackFps, isRemotion: remotionFrame !== null };
}
