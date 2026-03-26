import { useEffect, useRef, useState } from 'react';
import { triggerHaptic, triggerNotification } from '@/lib/haptics';

export function usePullToRefresh(onRefresh, options = {}) {
  const { threshold = 80, maxPull = 150 } = options;
  const containerRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef(0);
  const hapticTriggeredRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e) => {
      if (container.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e) => {
      if (isRefreshing) return;
      if (container.scrollTop !== 0) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.min(currentY - startYRef.current, maxPull);

      if (distance > 0) {
        e.preventDefault();
        setPullDistance(distance);
        // Haptic feedback when threshold reached
        if (distance > threshold && !hapticTriggeredRef.current) {
          triggerHaptic('medium');
          hapticTriggeredRef.current = true;
        } else if (distance <= threshold && hapticTriggeredRef.current) {
          hapticTriggeredRef.current = false;
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance > threshold) {
        triggerNotification('success');
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }
      setPullDistance(0);
      hapticTriggeredRef.current = false;
      startYRef.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, maxPull, isRefreshing, onRefresh]);

  return { containerRef, isRefreshing, pullDistance };
}