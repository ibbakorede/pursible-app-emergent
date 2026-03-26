/**
 * Push Notifications - Web-compatible version
 * Uses Capacitor for native platforms, gracefully degrades on web
 */

let Capacitor = null;
let PushNotifications = null;
let App = null;
let isNative = false;

// Try to load Capacitor dynamically
try {
  const capacitorCore = require('@capacitor/core');
  Capacitor = capacitorCore.Capacitor;
  isNative = Capacitor?.isNativePlatform?.() || false;
  
  if (isNative) {
    try {
      PushNotifications = require('@capacitor/push-notifications').PushNotifications;
    } catch (e) {
      console.log('[Push] Push notifications plugin not available');
    }
    try {
      App = require('@capacitor/app').App;
    } catch (e) {
      console.log('[Push] App plugin not available');
    }
  }
} catch (e) {
  console.log('[Push] Capacitor not available, running in web mode');
}

export const initPushNotifications = async () => {
  if (!isNative || !PushNotifications) {
    console.log('[Push] Web mode - push notifications disabled');
    return;
  }
  
  try {
    // Request permissions
    await PushNotifications.requestPermissions();

    // Register with native push service
    await PushNotifications.register();

    // Listen for registration token
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value);
      localStorage.setItem('pushToken', token.value);
    });

    // Listen for push notifications
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
      updateBadgeCount();
    });

    // Listen for push notification actions
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action:', action);
      updateBadgeCount();
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error.error);
    });
  } catch (error) {
    console.error('Push notifications init error:', error);
  }
};

export const setBadgeCount = async (count) => {
  if (!isNative || !App) return;
  
  try {
    await App.setBadgeCount({ count });
  } catch (error) {
    console.error('Badge count error:', error);
  }
};

export const updateBadgeCount = async (count = 1) => {
  if (!isNative || !App) return;
  
  try {
    const current = await App.getBadgeCount();
    await setBadgeCount(Math.max(0, current.count + count));
  } catch (error) {
    console.error('Badge update error:', error);
  }
};

export const clearBadgeCount = async () => {
  if (!isNative || !App) return;
  
  try {
    await setBadgeCount(0);
  } catch (error) {
    console.error('Badge clear error:', error);
  }
};
