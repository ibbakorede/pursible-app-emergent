// Comprehensive WebView and Periodic Sync support detection
const getWebViewInfo = () => {
  const ua = navigator.userAgent.toLowerCase();
  const chromeMatch = ua.match(/chrome\/([\d.]+)/);
  const versionMatch = ua.match(/version\/([\d.]+)/);
  
  return {
    isAndroid: /android/.test(ua),
    chromeVersion: chromeMatch ? parseFloat(chromeMatch[1]) : null,
    webViewVersion: versionMatch ? parseFloat(versionMatch[1]) : null,
    isOldWebView: versionMatch && parseFloat(versionMatch[1]) < 5.0,
  };
};

// Detect if Background Sync API is restricted (prioritizes IndexedDB fallback)
const isBackgroundSyncRestricted = async () => {
  try {
    const { isAndroid, isOldWebView, chromeVersion } = getWebViewInfo();
    
    if (!isAndroid) return false;

    // Old WebView versions (< 5.0) or Chrome versions < 49 don't support Periodic Sync
    if (isOldWebView || (chromeVersion && chromeVersion < 49)) {
      console.log(`WebView/Chrome ${chromeVersion || isOldWebView} too old - prioritizing IndexedDB fallback`);
      return true;
    }

    // Check if Periodic Sync API exists
    if (!('periodicSync' in ServiceWorkerRegistration.prototype)) {
      console.log('Periodic Sync API not available - prioritizing IndexedDB fallback');
      return true;
    }

    // Permission-based restriction check
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'background-sync' });
        if (permission.state === 'denied') {
          console.log('Background Sync permission denied - prioritizing IndexedDB fallback');
          return true;
        }
      } catch {
        // Permissions API unavailable; assume restricted environment
        console.log('Permissions API unavailable - assuming restricted, prioritizing IndexedDB fallback');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.log('WebView detection failed, defaulting to IndexedDB fallback:', error.message);
    return true; // Fail-safe: prioritize fallback on any error
  }
};

// IndexedDB-based polling fallback with exponential backoff retry
const FALLBACK_BASE_INTERVAL_MS = 30000; // 30 seconds base
const FALLBACK_MAX_INTERVAL_MS = 60 * 60 * 1000; // 1 hour cap
let fallbackRetryCount = 0;
let fallbackTimer = null;

const triggerFallbackSync = () => {
  if (navigator.serviceWorker?.controller) {
    const channel = new MessageChannel();
    navigator.serviceWorker.controller.postMessage(
      { type: 'FALLBACK_SYNC' },
      [channel.port2]
    );
    channel.port1.onmessage = (event) => {
      if (event.data?.success) {
        // Reset backoff on success
        fallbackRetryCount = 0;
      } else {
        fallbackRetryCount++;
      }
    };
  }
};

const scheduleNextFallbackPoll = () => {
  if (fallbackTimer) clearTimeout(fallbackTimer);

  // Read user-configured sync frequency (default 60 minutes) as upper bound
  const savedFrequency = localStorage.getItem('backgroundSyncFrequency');
  const maxIntervalMs = savedFrequency
    ? parseInt(savedFrequency) * 60 * 1000
    : FALLBACK_MAX_INTERVAL_MS;

  // Exponential backoff: base * 2^retries, capped at maxInterval
  const backoffMs = Math.min(
    FALLBACK_BASE_INTERVAL_MS * Math.pow(2, fallbackRetryCount),
    maxIntervalMs
  );

  console.log(`Fallback poll scheduled in ${Math.round(backoffMs / 1000)}s (retry #${fallbackRetryCount})`);

  fallbackTimer = setTimeout(() => {
    if (navigator.onLine) {
      triggerFallbackSync();
    }
    scheduleNextFallbackPoll();
  }, backoffMs);
};

const setupFallbackSync = async () => {
  console.log('Setting up IndexedDB-based fallback sync with exponential backoff');
  sessionStorage.setItem('__fallback_sync_active__', 'true');
  fallbackRetryCount = 0;

  // Immediate sync attempt if online
  if (navigator.onLine) {
    triggerFallbackSync();
  }

  // Start backoff polling
  scheduleNextFallbackPoll();

  // On reconnect: reset backoff and sync immediately
  window.addEventListener('online', () => {
    console.log('Device went online - triggering immediate fallback sync');
    fallbackRetryCount = 0;
    triggerFallbackSync();
    scheduleNextFallbackPoll();
  });

  window.addEventListener('offline', () => {
    console.log('Device went offline - pausing fallback sync');
    if (fallbackTimer) clearTimeout(fallbackTimer);
  });
};

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Wait for service worker to be ready before attempting sync registration
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      console.log('Service Worker registered:', registration);

      // Ensure controller is ready before setting up sync
      await navigator.serviceWorker.ready;
      console.log('Service Worker controller ready');

      // Prioritize IndexedDB fallback for restricted environments
      const isRestricted = await isBackgroundSyncRestricted();

      if (isRestricted) {
        console.log('Restricted environment detected - prioritizing IndexedDB fallback sync');
        await setupFallbackSync();
      } else {
        // Attempt Periodic Sync as secondary mechanism
        const syncTag = 'txsync'; // 6 chars - ultra-concise, maximum compat
        const savedFrequency = localStorage.getItem('backgroundSyncFrequency');
        const frequencyMinutes = savedFrequency ? parseInt(savedFrequency) : 60;
        const minIntervalMs = frequencyMinutes * 60 * 1000;
        
        let periodicSyncSuccess = false;
        
        if ('periodicSync' in registration) {
          try {
            await registration.periodicSync.register(syncTag, {
              minInterval: minIntervalMs,
            });
            console.log(`Periodic sync registered (${frequencyMinutes}min): ${syncTag}`);
            sessionStorage.setItem('__periodic_sync_active__', 'true');
            periodicSyncSuccess = true;
          } catch (error) {
            // Periodic sync failed; gracefully fall back to IndexedDB
            console.log(`Periodic sync failed (${error.name}); falling back to IndexedDB polling`);
            periodicSyncSuccess = false;
          }
        }

        // Fall back to IndexedDB polling if Periodic Sync fails or unavailable
        if (!periodicSyncSuccess) {
          await setupFallbackSync();
        }
      }

      // Listen for status updates from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'OFFLINE_QUEUE_STATUS') {
          window.dispatchEvent(
            new CustomEvent('offlineQueueStatusUpdate', {
              detail: event.data.data,
            })
          );
        }

        // Fallback sync completion
        if (event.data.type === 'FALLBACK_SYNC_COMPLETE') {
          console.log('Fallback sync completed:', event.data.data);
          window.dispatchEvent(
            new CustomEvent('offlineQueueStatusUpdate', {
              detail: event.data.data,
            })
          );
        }
      });

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error.message);
      console.log('Immediately activating IndexedDB fallback polling');
      // Immediate graceful fallback — no SW needed
      setupFallbackSync().catch(fallbackError => {
        console.error('Fallback sync setup failed:', fallbackError.message);
      });
      return null;
    }
  }
};

export const manualSyncTransactions = async () => {
  if (!('serviceWorker' in navigator)) {
    return Promise.reject(new Error('Service Worker not supported'));
  }

  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No active service worker controller'));
      return;
    }

    const channel = new MessageChannel();
    const timeout = setTimeout(() => {
      reject(new Error('Sync timeout - please check your connection'));
    }, 30000); // 30 second timeout

    channel.port1.onmessage = event => {
      clearTimeout(timeout);
      if (event.data.success) {
        resolve(event.data);
      } else {
        reject(new Error(event.data.error || 'Sync failed'));
      }
    };

    channel.port1.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Port communication error'));
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'SYNC_TRANSACTIONS' },
      [channel.port2]
    );
  });
};

// Utility to check if we're using fallback mechanism
export const isFallbackSyncActive = () => {
  return sessionStorage.getItem('__fallback_sync_active__') === 'true';
};

// Utility to check if Periodic Sync is active
export const isPeriodicSyncActive = () => {
  return sessionStorage.getItem('__periodic_sync_active__') === 'true';
};

// Get current sync mechanism info
export const getSyncMechanismInfo = () => {
  const { isAndroid, chromeVersion, webViewVersion, isOldWebView } = getWebViewInfo();
  
  return {
    isAndroid,
    chromeVersion,
    webViewVersion,
    isOldWebView,
    isFallbackActive: isFallbackSyncActive(),
    isPeriodicActive: isPeriodicSyncActive(),
    syncFrequencyMinutes: parseInt(localStorage.getItem('backgroundSyncFrequency') || '60'),
  };
};