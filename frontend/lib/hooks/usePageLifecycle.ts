/**
 * Page visibility and lifecycle-aware sync hook
 */

import { useEffect, useState, useRef } from 'react';

interface PageLifecycleState {
  isVisible: boolean;
  isActive: boolean;
  lastVisible: number;
  lastHidden: number;
}

export function usePageLifecycle() {
  const [state, setState] = useState<PageLifecycleState>({
    isVisible: !document.hidden,
    isActive: document.hasFocus(),
    lastVisible: Date.now(),
    lastHidden: 0,
  });

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      const now = Date.now();

      setState(prev => ({
        ...prev,
        isVisible,
        lastVisible: isVisible ? now : prev.lastVisible,
        lastHidden: !isVisible ? now : prev.lastHidden,
      }));
    };

    const handleFocus = () => {
      setState(prev => ({ ...prev, isActive: true }));
    };

    const handleBlur = () => {
      setState(prev => ({ ...prev, isActive: false }));
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return state;
}