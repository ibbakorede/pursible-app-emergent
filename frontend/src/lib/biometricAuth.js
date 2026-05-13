/**
 * Biometric Authentication Service
 * Uses WebAuthn API for fingerprint/face recognition
 * 
 * SECURITY: All credential data is stored server-side in MongoDB.
 * No localStorage/sessionStorage is used for biometric data.
 */
import { base44 } from '../api/apiClient';
import { logger } from './logger';

// Check if WebAuthn is supported
export const isBiometricSupported = () => {
  return !!(window.PublicKeyCredential && navigator.credentials);
};

// Check if biometric is available on this device
export const isBiometricAvailable = async () => {
  if (!isBiometricSupported()) return false;
  
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (err) {
    logger.warn('Biometric availability check failed:', err);
    return false;
  }
};

// Check if user has enabled biometric login (from server)
export const isBiometricEnabled = async () => {
  try {
    const status = await base44.biometric.status();
    return status.biometric_enabled === true;
  } catch (err) {
    logger.warn('Biometric status check failed:', err);
    return false;
  }
};

// Get stored biometric user email (from auth context, not storage)
// This is now managed by the AuthContext, not localStorage
export const getBiometricUser = () => {
  // Return null - email is now retrieved from server via /auth/me
  return null;
};

// Generate a random challenge
const generateChallenge = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return array;
};

// Convert ArrayBuffer to base64
const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert base64 to ArrayBuffer
const base64ToBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Register biometric credential after successful login
export const registerBiometric = async (userEmail, userName) => {
  if (!await isBiometricAvailable()) {
    throw new Error('Biometric authentication not available on this device');
  }

  const challenge = generateChallenge();
  const userId = new TextEncoder().encode(userEmail);

  const publicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'Pursible',
      id: window.location.hostname,
    },
    user: {
      id: userId,
      name: userEmail,
      displayName: userName || userEmail,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },   // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
    timeout: 60000,
    attestation: 'none',
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    // Store credential on server (not in localStorage)
    const credentialId = credential.id;
    const credentialRawId = bufferToBase64(credential.rawId);
    
    await base44.biometric.register(credentialId, credentialRawId);
    
    return true;
  } catch (error) {
    throw error;
  }
};

// Authenticate using biometric - returns user email from server
export const authenticateWithBiometric = async (storedCredentialId = null, storedRawId = null) => {
  // If we have stored credentials, use them; otherwise, allow any credential
  const challenge = generateChallenge();

  const publicKeyCredentialRequestOptions = {
    challenge,
    userVerification: 'required',
    timeout: 60000,
  };

  // If specific credential is provided, restrict to it
  if (storedCredentialId && storedRawId) {
    publicKeyCredentialRequestOptions.allowCredentials = [{
      id: base64ToBuffer(storedRawId),
      type: 'public-key',
      transports: ['internal'],
    }];
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    // Verify credential on server and get user email
    const verifyResult = await base44.biometric.verify(assertion.id);
    
    if (verifyResult.success && verifyResult.email) {
      return { success: true, email: verifyResult.email };
    }
    
    throw new Error('Biometric verification failed');
  } catch (error) {
    throw error;
  }
};

// Disable biometric login
export const disableBiometric = async () => {
  try {
    await base44.biometric.disable();
  } catch (err) {
    logger.warn('Biometric disable failed:', err);
  }
};

// Get biometric type name for UI
export const getBiometricTypeName = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'Face ID / Touch ID';
  } else if (/android/.test(userAgent)) {
    return 'Fingerprint / Face Unlock';
  } else if (/mac/.test(userAgent)) {
    return 'Touch ID';
  } else if (/win/.test(userAgent)) {
    return 'Windows Hello';
  }
  
  return 'Biometric Login';
};
