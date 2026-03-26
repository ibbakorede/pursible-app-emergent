import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * Check if haptics are enabled system-wide
 */
let hapticsEnabled = true;

export const setHapticsEnabled = (enabled) => {
  hapticsEnabled = enabled;
};

export const areHapticsEnabled = () => {
  return hapticsEnabled;
};

/**
 * Initialize haptics - check system settings on app load
 */
export const initHaptics = async () => {
  try {
    // iOS/Android automatically respect system haptic settings
    // Capacitor handles this transparently
    return true;
  } catch (error) {
    return false;
  }
};

export const triggerHaptic = async (style = 'light') => {
  if (!hapticsEnabled) return;
  try {
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    };
    await Haptics.impact({ style: styleMap[style] || ImpactStyle.Light });
  } catch (error) {
    // Silently fail on web/non-capacitor environments
  }
};

export const triggerSelection = async () => {
  if (!hapticsEnabled) return;
  try {
    await Haptics.selectionStart();
  } catch (error) {
    // Silently fail
  }
};

export const triggerNotification = async (type = 'success') => {
  if (!hapticsEnabled) return;
  try {
    const typeMap = {
      success: 'Success',
      warning: 'Warning',
      error: 'Error',
    };
    await Haptics.notification({ type: typeMap[type] || 'Success' });
  } catch (error) {
    // Silently fail
  }
};

/**
 * Custom haptic patterns for specific interactions
 */
export const triggerConfirmation = async () => {
  if (!hapticsEnabled) return;
  try {
    // Double tap pattern for confirmation
    await Haptics.impact({ style: ImpactStyle.Medium });
    await new Promise(r => setTimeout(r, 100));
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    // Silently fail
  }
};

export const triggerError = async () => {
  if (!hapticsEnabled) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (error) {
    // Silently fail
  }
};