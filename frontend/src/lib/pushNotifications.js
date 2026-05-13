/**
 * Push Notification Service
 * Supports both Web Push and prepares for FCM (mobile)
 * 
 * SECURITY: All notification settings and FCM tokens are stored server-side in MongoDB.
 * No localStorage/sessionStorage is used for notification data.
 */
import { base44 } from '../api/apiClient';
import { logger } from './logger';

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
    
    if (permission === 'granted') {
      await registerServiceWorker();
      return { granted: true };
    }
    
    return { granted: false, reason: permission };
  } catch (error) {
    return { granted: false, reason: 'error' };
  }
};

// Register service worker for push notifications
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    } catch (err) {
      logger.warn('Service worker registration failed:', err);
    }
  }
};

// Get notification settings from server
export const getNotificationSettings = async () => {
  try {
    const result = await base44.push.getSettings();
    return result.settings || {
      transactions: true,
      rateAlerts: true,
      security: true,
      marketing: false,
    };
  } catch (err) {
    logger.warn('Failed to get notification settings, using defaults:', err);
    return {
      transactions: true,
      rateAlerts: true,
      security: true,
      marketing: false,
    };
  }
};

// Update notification settings on server
export const updateNotificationSettings = async (settings) => {
  try {
    const result = await base44.push.updateSettings(settings);
    return result.settings;
  } catch (err) {
    logger.warn('Failed to update notification settings:', err);
    return settings;
  }
};

// Show local notification
export const showNotification = async (title, options = {}) => {
  if (getNotificationPermission() !== 'granted') {
    return;
  }

  // Get settings from server for type filtering
  let settings = { transactions: true, rateAlerts: true, security: true, marketing: false };
  try {
    settings = await getNotificationSettings();
  } catch (err) {
    logger.warn('Notification settings fetch failed, using defaults:', err);
  }
  
  // Check if this notification type is enabled
  if (options.type && !settings[options.type]) {
    return;
  }

  const defaultOptions = {
    icon: '/pursible_icon_white.svg',
    badge: '/pursible_icon_white.svg',
    vibrate: [200, 100, 200],
    tag: options.tag || 'pursible-notification',
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
  } catch (err) {
    logger.warn('Failed to show notification:', err);
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

// Store FCM token on server
export const storeFCMToken = async (token) => {
  try {
    await base44.push.registerToken(token, 'web');
  } catch (err) {
    logger.warn('FCM token storage failed:', err);
  }
};

// Get FCM token - now returns null (server-managed)
export const getFCMToken = () => {
  // FCM token is now server-side only
  return null;
};

// Delete FCM token on server (call on logout)
export const clearFCMToken = async () => {
  try {
    await base44.push.deleteToken();
  } catch (err) {
    logger.warn('FCM token deletion failed:', err);
  }
};

// Check if user has seen the notification prompt (session-based)
let notificationPromptSeen = false;

export const hasSeenNotificationPrompt = () => {
  return notificationPromptSeen;
};

export const markNotificationPromptSeen = () => {
  notificationPromptSeen = true;
};
