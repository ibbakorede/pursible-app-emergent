import { useState, useCallback } from 'react';
import { useBiometricAuth } from './useBiometricAuth';

const BIOMETRIC_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'biometric_lock_timestamp';

/**
 * Hook for biometric lock functionality
 * Uses sessionStorage for lock timestamp (security-sensitive, session-scoped)
 */
export const useBiometricLock = () => {
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const { checkAvailability } = useBiometricAuth();

  const isLocked = useCallback(() => {
    const lastAuth = sessionStorage.getItem(STORAGE_KEY);
    if (!lastAuth) return true;
    
    const timeSinceAuth = Date.now() - parseInt(lastAuth, 10);
    return timeSinceAuth > BIOMETRIC_LOCK_TIMEOUT;
  }, []);

  const checkBiometricAuth = useCallback(async (action) => {
    const available = await checkAvailability();
    
    if (!available) {
      // No biometric available, allow action
      return true;
    }

    if (!isLocked()) {
      // Recently authenticated, allow action
      return true;
    }

    // Need biometric auth
    setPendingAction(action);
    setShowBiometricModal(true);
    return false;
  }, [checkAvailability, isLocked]);

  const handleBiometricSuccess = useCallback(() => {
    sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
    
    if (pendingAction?.callback) {
      pendingAction.callback();
    }

    setPendingAction(null);
    setShowBiometricModal(false);
  }, [pendingAction]);

  const clearLock = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    showBiometricModal,
    setShowBiometricModal,
    checkBiometricAuth,
    handleBiometricSuccess,
    isLocked,
    clearLock,
    pendingAction,
  };
};