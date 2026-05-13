/**
 * Security Components - Shared constants and utilities
 */

export const SECURITY_SETTINGS = {
  biometric_login: {
    key: 'biometric_login_enabled',
    label: 'Biometric Login',
    description: 'Use Face ID or fingerprint to log in',
    icon: 'Fingerprint',
  },
  biometric_transfers: {
    key: 'biometric_transfers',
    label: 'Biometric Transfers',
    description: 'Require biometrics to confirm transfers',
    icon: 'ShieldCheck',
  },
  transaction_pin: {
    key: 'transaction_pin',
    label: 'Transaction PIN',
    description: '4-digit PIN for transaction approval',
    icon: 'Lock',
  },
};

export const validatePin = (pin, confirmPin) => {
  if (pin.length !== 4) {
    return { valid: false, error: 'PIN must be 4 digits.' };
  }
  if (pin !== confirmPin) {
    return { valid: false, error: 'PINs do not match.' };
  }
  return { valid: true, error: null };
};

export const validatePassword = (currentPw, newPw, confirmPw) => {
  if (!currentPw) {
    return { valid: false, error: 'Current password is required.' };
  }
  if (!newPw || newPw.length < 8) {
    return { valid: false, error: 'New password must be at least 8 characters.' };
  }
  if (newPw !== confirmPw) {
    return { valid: false, error: 'Passwords do not match.' };
  }
  return { valid: true, error: null };
};
