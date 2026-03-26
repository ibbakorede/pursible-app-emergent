import { Capacitor } from '@capacitor/core';

let PushNotifications = null;
let App = null;

// Conditionally import Capacitor plugins only on native platforms
if (Capacitor.isNativePlatform()) {
  PushNotifications = require('@capacitor/push-notifications').PushNotifications;
  App = require('@capacitor/app').App;
}

export const initPushNotifications = async () => {
  if (!PushNotifications) return; // Skip on web
  
  try {
    // Request permissions
    await PushNotifications.requestPermissions();

    // Register with native push service
    await PushNotifications.register();

    // Listen for registration token
    PushNotifications.addListener('registration', (token) => {
      console.log('Push registration token:', token.value);
      // Save token to backend if needed
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
  if (!App) return; // Skip on web
  
  try {
    await App.setBadgeCount({ count });
  } catch (error) {
    console.error('Badge count error:', error);
  }
};

export const updateBadgeCount = async (count = 1) => {
  if (!App) return; // Skip on web
  
  try {
    const current = await App.getBadgeCount();
    await setBadgeCount(Math.max(0, current.count + count));
  } catch (error) {
    console.error('Badge update error:', error);
  }
};

export const clearBadgeCount = async () => {
  if (!App) return; // Skip on web
  
  try {
    await setBadgeCount(0);
  } catch (error) {
    console.error('Badge clear error:', error);
  }
};