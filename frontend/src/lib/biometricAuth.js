/**
 * Biometric Authentication Service
 * Uses WebAuthn API for fingerprint/face recognition
 */

const BIOMETRIC_CREDENTIAL_KEY = 'pursible_biometric_credential';
const BIOMETRIC_ENABLED_KEY = 'pursible_biometric_enabled';
const BIOMETRIC_USER_KEY = 'pursible_biometric_user';

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
  } catch (error) {
    console.error('Biometric availability check failed:', error);
    return false;
  }
};

// Check if user has enabled biometric login
export const isBiometricEnabled = () => {
  return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
};

// Get stored biometric user email
export const getBiometricUser = () => {
  return localStorage.getItem(BIOMETRIC_USER_KEY);
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

    // Store credential info
    const credentialData = {
      id: credential.id,
      rawId: bufferToBase64(credential.rawId),
      type: credential.type,
    };

    localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, JSON.stringify(credentialData));
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    localStorage.setItem(BIOMETRIC_USER_KEY, userEmail);

    return true;
  } catch (error) {
    console.error('Biometric registration failed:', error);
    throw error;
  }
};

// Authenticate using biometric
export const authenticateWithBiometric = async () => {
  if (!isBiometricEnabled()) {
    throw new Error('Biometric login not enabled');
  }

  const credentialDataStr = localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
  if (!credentialDataStr) {
    throw new Error('No biometric credential found');
  }

  const credentialData = JSON.parse(credentialDataStr);
  const challenge = generateChallenge();

  const publicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: [{
      id: base64ToBuffer(credentialData.rawId),
      type: 'public-key',
      transports: ['internal'],
    }],
    userVerification: 'required',
    timeout: 60000,
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    // Verification successful
    const userEmail = localStorage.getItem(BIOMETRIC_USER_KEY);
    return { success: true, email: userEmail };
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    throw error;
  }
};

// Disable biometric login
export const disableBiometric = () => {
  localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
  localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  localStorage.removeItem(BIOMETRIC_USER_KEY);
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
