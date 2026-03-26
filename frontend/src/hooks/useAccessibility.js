import { useEffect, useState } from 'react';
import { useTabHistory } from './useTabHistory';

/**
 * Combined accessibility hook managing motion, contrast, and screen reader preferences
 */
export function useAccessibility() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const { goBack } = useTabHistory();

  useEffect(() => {
    // Check motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const motionHandler = (e) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', motionHandler);

    // Check contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    setPrefersHighContrast(contrastQuery.matches);

    const contrastHandler = (e) => setPrefersHighContrast(e.matches);
    contrastQuery.addEventListener('change', contrastHandler);

    return () => {
      motionQuery.removeEventListener('change', motionHandler);
      contrastQuery.removeEventListener('change', contrastHandler);
    };
  }, []);

  // Announce to screen reader
  const announceToScreenReader = (text, priority = 'polite') => {
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
      announcer.setAttribute('aria-live', priority);
      announcer.textContent = text;
      setTimeout(() => {
        announcer.textContent = '';
      }, 1000);
    }
  };

  return {
    prefersReducedMotion,
    prefersHighContrast,
    announceToScreenReader,
    goBack,
  };
}

/**
 * Motion-safe animation config for Framer Motion
 */
export const getMotionConfig = (prefersReducedMotion) => {
  return {
    transition: { duration: prefersReducedMotion ? 0 : 0.2 },
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  };
};