/**
 * Accessibility utility hooks and helpers
 */

import { useEffect, useState } from 'react';

/**
 * Hook to detect high-contrast mode preference
 * @returns {boolean} True if user prefers high contrast
 */
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setPrefersHighContrast(mediaQuery.matches);

    // Listen for changes
    const handler = (e) => setPrefersHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersHighContrast;
}

/**
 * Hook to detect reduced motion preference
 * @returns {boolean} True if user prefers reduced motion
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Announces text to screen reader
 * @param {string} text - Text to announce
 * @param {string} priority - 'polite' (default) or 'assertive'
 */
export function announceToScreenReader(text, priority = 'polite') {
  const announcer = document.getElementById('sr-announcer');
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = text;
    // Clear after announcement is read
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
}

/**
 * Focus management utility
 */
export const focusManagement = {
  /**
   * Trap focus within an element (for modals, dialogs)
   */
  trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    });
  },

  /**
   * Restore focus to previously focused element
   */
  restoreFocus(element) {
    const previouslyFocused = document.activeElement;
    return () => {
      previouslyFocused?.focus();
    };
  },
};

/**
 * Motion-safe animation variants for Framer Motion
 */
export const motionVariants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
};

/**
 * Transition config respecting motion preferences
 */
export const motionConfig = {
  transition: { duration: 0.2 },
  // In prefers-reduced-motion, CSS will override to 0.01ms
};