import { useCallback } from 'react';
import { triggerHaptic, triggerNotification, triggerSelection, triggerConfirmation, triggerError } from '@/lib/haptics';

export const useHaptics = () => {
  const light = useCallback(() => triggerHaptic('light'), []);
  const medium = useCallback(() => triggerHaptic('medium'), []);
  const heavy = useCallback(() => triggerHaptic('heavy'), []);
  const success = useCallback(() => triggerNotification('success'), []);
  const warning = useCallback(() => triggerNotification('warning'), []);
  const error = useCallback(() => triggerNotification('error'), []);
  const selection = useCallback(() => triggerSelection(), []);
  const confirm = useCallback(() => triggerConfirmation(), []);
  const errorHaptic = useCallback(() => triggerError(), []);

  return { light, medium, heavy, success, warning, error, selection, confirm, errorHaptic };
};