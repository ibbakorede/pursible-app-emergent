import { useState, useCallback } from 'react';
import {
  isBiometricAvailable as checkBiometricAvailable,
  registerBiometric,
  authenticateWithBiometric,
  isBiometricEnabled,
  disableBiometric,
} from '@/lib/biometricAuth';

export const useBiometricAuth = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);

  // Check availability on mount
  const checkAvailability = useCallback(async () => {
    const available = await checkBiometricAvailable();
    setIsAvailable(available);
    return available;
  }, []);

  // Register biometric for a user
  const register = useCallback(async (userEmail, userName) => {
    setIsAuthenticating(true);
    try {
      await registerBiometric(userEmail, userName);
      setIsAuthenticating(false);
      return { success: true };
    } catch (error) {
      setIsAuthenticating(false);
      throw error;
    }
  }, []);

  // Authenticate with biometric
  const authenticate = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const result = await authenticateWithBiometric();
      setIsAuthenticating(false);
      return result;
    } catch (error) {
      setIsAuthenticating(false);
      throw error;
    }
  }, []);

  // Simple biometric challenge (for security settings, transfers, etc.)
  const requestBiometricChallenge = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      // Modern approach: use WebAuthn
      if (window.PublicKeyCredential) {
        const available = await checkBiometricAvailable();
        if (!available) {
          throw new Error('Biometric not available');
        }

        // If user has registered biometric, use it
        if (isBiometricEnabled()) {
          const result = await authenticateWithBiometric();
          setIsAuthenticating(false);
          return result.success;
        }

        // Otherwise, try simple challenge
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge: crypto.getRandomValues(new Uint8Array(32)),
            timeout: 60000,
            userVerification: 'required',
          },
          mediation: 'optional',
        });
        
        if (assertion) {
          setIsAuthenticating(false);
          return true;
        }
      }

      setIsAuthenticating(false);
      return false;
    } catch (error) {
      setIsAuthenticating(false);
      console.warn('Biometric challenge failed:', error);
      throw error;
    }
  }, []);

  return {
    authenticate,
    register,
    requestBiometricChallenge,
    checkAvailability,
    isAuthenticating,
    isAvailable,
    isEnabled: isBiometricEnabled,
    disable: disableBiometric,
  };
};