import { createContext } from 'react';

// null uses the enclosing Remotion sequence or the editing canvas's local clock.
export const MotionFrameContext = createContext(null);
