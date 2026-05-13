import { useState, useCallback, useRef } from 'react';
import { useBiometricAuth } from './useBiometricAuth';

const BIOMETRIC_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/**
 * Hook for biometric lock functionality
 * Uses in-memory timestamp (React ref) instead of sessionStorage
 * Lock state is session-scoped via memory, not persistent storage
 */
export const useBiometricLock = () => {
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const { checkAvailability } = useBiometricAuth();
  
  // Use ref for lock timestamp - memory only, no storage
  const lastAuthTimestampRef = useRef(null);

  const isLocked = useCallback(() => {
    const lastAuth = lastAuthTimestampRef.current;
    if (!lastAuth) return true;
    
    const timeSinceAuth = Date.now() - lastAuth;
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
    // Store timestamp in memory ref
    lastAuthTimestampRef.current = Date.now();
    
    if (pendingAction?.callback) {
      pendingAction.callback();
    }

    setPendingAction(null);
    setShowBiometricModal(false);
  }, [pendingAction]);

  const clearLock = useCallback(() => {
    lastAuthTimestampRef.current = null;
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
