/**
 * Push Notification Service
 * Supports both Web Push and prepares for FCM (mobile)
 */

const NOTIFICATION_PERMISSION_KEY = 'paysible_notification_permission';
const NOTIFICATION_SETTINGS_KEY = 'paysible_notification_settings';
const FCM_TOKEN_KEY = 'paysible_fcm_token';

// Default notification settings
const defaultSettings = {
  transactions: true,      // Deposits, withdrawals, conversions
  rateAlerts: true,        // When target rate is reached
  security: true,          // New login, password changes
  marketing: false,        // Promotional notifications
};

// Check if notifications are supported
export const isNotificationSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

// Get current permission status
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return { granted: false, reason: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
    
    if (permission === 'granted') {
      await registerServiceWorker();
      return { granted: true };
    }
    
    return { granted: false, reason: permission };
  } catch (error) {
    console.error('Notification permission request failed:', error);
    return { granted: false, reason: 'error' };
  }
};

// Register service worker for push notifications
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

// Get notification settings
export const getNotificationSettings = () => {
  const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  if (stored) {
    return { ...defaultSettings, ...JSON.parse(stored) };
  }
  return defaultSettings;
};

// Update notification settings
export const updateNotificationSettings = (settings) => {
  const current = getNotificationSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
  return updated;
};

// Show local notification
export const showNotification = async (title, options = {}) => {
  if (getNotificationPermission() !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  const settings = getNotificationSettings();
  
  // Check if this notification type is enabled
  if (options.type && !settings[options.type]) {
    return;
  }

  const defaultOptions = {
    icon: '/paysible_icon_white.svg',
    badge: '/paysible_icon_white.svg',
    vibrate: [200, 100, 200],
    tag: options.tag || 'paysible-notification',
    renotify: true,
    requireInteraction: false,
    ...options,
  };

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, defaultOptions);
    } else {
      new Notification(title, defaultOptions);
    }
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
};

// Notification helper functions for different types
export const notifyTransaction = (type, amount, currency) => {
  const titles = {
    deposit: '💰 Deposit Received',
    withdrawal: '📤 Withdrawal Processed',
    conversion: '🔄 Conversion Complete',
  };

  showNotification(titles[type] || 'Transaction Update', {
    body: `${type === 'deposit' ? '+' : '-'}${amount} ${currency}`,
    type: 'transactions',
    tag: `transaction-${Date.now()}`,
  });
};

export const notifyRateAlert = (fromCurrency, toCurrency, rate) => {
  showNotification('📊 Rate Alert Triggered!', {
    body: `${fromCurrency}/${toCurrency} reached ${rate}`,
    type: 'rateAlerts',
    tag: `rate-alert-${Date.now()}`,
  });
};

export const notifySecurity = (event) => {
  const messages = {
    login: '🔐 New login detected on your account',
    password_change: '🔑 Your password was changed',
    biometric_enabled: '👆 Biometric login enabled',
  };

  showNotification('Security Alert', {
    body: messages[event] || 'Security update on your account',
    type: 'security',
    tag: `security-${Date.now()}`,
    requireInteraction: true,
  });
};

// Store FCM token for mobile push (future use)
export const storeFCMToken = (token) => {
  localStorage.setItem(FCM_TOKEN_KEY, token);
};

export const getFCMToken = () => {
  return localStorage.getItem(FCM_TOKEN_KEY);
};

// Check if user has seen the notification prompt
export const hasSeenNotificationPrompt = () => {
  return localStorage.getItem('paysible_notification_prompt_seen') === 'true';
};

export const markNotificationPromptSeen = () => {
  localStorage.setItem('paysible_notification_prompt_seen', 'true');
};
