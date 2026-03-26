import React from 'react';

/**
 * Wraps route components in React.memo to prevent unnecessary re-renders
 * during route transitions and animations
 */
export const memoizeRoute = (Component) => {
  const displayName = Component.displayName || Component.name || 'Component';
  const Memoized = React.memo(Component);
  Memoized.displayName = `memoized(${displayName})`;
  return Memoized;
};

export default memoizeRoute;