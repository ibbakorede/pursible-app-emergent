# Background Sync Architecture - RefactoredVersion

## Overview

This document describes the refactored background sync system that prioritizes IndexedDB polling fallback for maximum compatibility with all Android WebView versions (5.0+) and restricted environments.

## Architecture Principles

1. **Graceful Degradation**: Automatically fall back to more compatible mechanisms
2. **WebView Version Awareness**: Detect and handle older Android browsers
3. **User Configurability**: Respect user-set sync frequency preferences
4. **No UX Impact**: All optimizations transparent to end users
5. **Performance**: Minimize battery drain while maintaining data consistency

## Sync Mechanism Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ 1. Periodic Sync (Primary) - Preferred if available     │
│    • API: ServiceWorkerRegistration.periodicSync        │
│    • Availability: Android 5.0+, Chrome 49+             │
│    • Limitations: May be restricted in some environments │
│    • Tag: 'txsync' (6 chars, alphanumeric only)         │
│    • Frequency: User-configurable (15-240 min)          │
└─────────────────────────────────────────────────────────┘
                           ↓ (on failure)
┌─────────────────────────────────────────────────────────┐
│ 2. IndexedDB Polling (Fallback) - Guaranteed support    │
│    • Storage: IndexedDB (OfflineQueueDB)                │
│    • Polling: User-configured interval (default 60 min) │
│    • Online Detection: window.onLine + event listeners  │
│    • Immediate Sync: Triggered on 'online' event        │
│    • Compatibility: All Android versions 5.0+           │
└─────────────────────────────────────────────────────────┘
                           ↓ (on SW failure)
┌─────────────────────────────────────────────────────────┐
│ 3. Ultimate Fallback - IndexedDB without Service Worker │
│    • Usage: When SW registration fails entirely         │
│    • Polling: Same as mechanism #2                      │
│    • Status: Fallback to app-level sync only            │
└─────────────────────────────────────────────────────────┘
```

## Detection Logic

### WebView Version Detection

```javascript
const { isAndroid, chromeVersion, webViewVersion, isOldWebView } = getWebViewInfo();

// Returns:
// {
//   isAndroid: boolean,
//   chromeVersion: number | null,  // e.g., 49, 120
//   webViewVersion: number | null, // e.g., 4.5, 5.2
//   isOldWebView: boolean          // true if < 5.0
// }
```

### Restricted Environment Detection

The system checks for restrictions in this order:

1. **Old WebView Check** (< 5.0): Periodic Sync not supported
2. **Chrome Version Check** (< 49): Periodic Sync API not available
3. **Periodic Sync API Availability**: Check if API exists
4. **Permissions Query**: Check if background-sync permission is denied
5. **Error Fallback**: If any check throws, assume restricted

## Configuration

### User-Configurable Sync Frequency

Users can set sync frequency via AdminSettings page:

```javascript
// localStorage key: 'backgroundSyncFrequency'
// Default: '60' (minutes)
// Options: 15, 30, 60, 120, 240

const frequency = localStorage.getItem('backgroundSyncFrequency') || '60';
const intervalMs = parseInt(frequency) * 60 * 1000;

// Applied to both:
// - Periodic Sync: minInterval option
// - IndexedDB Polling: setTimeout interval
```

### Sync Tag (Periodic Sync Only)

```javascript
const syncTag = 'txsync'; // 6 characters

// Constraints (W3C spec):
// • Max 64 characters
// • Alphanumeric + underscore/hyphen only
// • Single word (no spaces)
// • Case-sensitive
```

## State Management

### Session Storage Flags

```javascript
// Periodic Sync active
sessionStorage.getItem('__periodic_sync_active__') === 'true'

// IndexedDB fallback active
sessionStorage.getItem('__fallback_sync_active__') === 'true'

// Use getter functions:
isPeriodicSyncActive()  // Check Periodic Sync status
isFallbackSyncActive()  // Check fallback status
getSyncMechanismInfo()  // Get detailed sync info
```

## Implementation Details

### 1. Periodic Sync Registration (Primary Path)

```javascript
if ('periodicSync' in registration) {
  try {
    await registration.periodicSync.register('txsync', {
      minInterval: frequencyMinutes * 60 * 1000,
    });
    sessionStorage.setItem('__periodic_sync_active__', 'true');
  } catch (error) {
    // NotAllowedError, SecurityError → use fallback
    await setupFallbackSync();
  }
}
```

**Pros:**
- Native OS integration (more efficient)
- Respects system power settings
- Persistent across app restarts

**Cons:**
- May be restricted in some WebView versions
- Requires background-sync permission
- OS may throttle based on battery/usage patterns

### 2. IndexedDB Polling (Fallback Path)

```javascript
const setupFallbackSync = async () => {
  sessionStorage.setItem('__fallback_sync_active__', 'true');
  
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open('OfflineQueueDB', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  const pollIntervalMs = frequencyMinutes * 60 * 1000;

  const setupPolling = () => {
    if (navigator.onLine) {
      // Send FALLBACK_SYNC message to Service Worker
      navigator.serviceWorker.controller.postMessage({
        type: 'FALLBACK_SYNC'
      }, [channel.port2]);
    }
    setTimeout(setupPolling, pollIntervalMs);
  };

  // Start polling when online
  if (navigator.onLine) {
    setTimeout(setupPolling, 30000); // 30s initial delay
  }

  // Immediate sync on 'online' event
  window.addEventListener('online', () => {
    navigator.serviceWorker.controller.postMessage({
      type: 'FALLBACK_SYNC'
    });
    setTimeout(setupPolling, 5000); // Resume polling
  });
};
```

**Pros:**
- Works on ALL Android versions (5.0+)
- No permission required
- Simple, reliable polling mechanism
- Immediate sync on 'online' event

**Cons:**
- Higher battery drain (polling vs native)
- Requires app to be running
- Less efficient than Periodic Sync

### 3. Service Worker Message Handling

Service Worker receives:
```javascript
// 'txsync' periodic sync event
self.addEventListener('sync', event => {
  if (event.tag === 'txsync') {
    event.waitUntil(syncTransactions());
  }
});

// FALLBACK_SYNC message
self.addEventListener('message', event => {
  if (event.data.type === 'FALLBACK_SYNC') {
    event.ports[0].postMessage({
      type: 'FALLBACK_SYNC_COMPLETE',
      data: syncResult
    });
  }
});
```

## Monitoring & Debugging

### Check Current Sync Mechanism

```javascript
import { getSyncMechanismInfo } from '@/lib/serviceWorkerRegister';

const info = getSyncMechanismInfo();
console.log({
  isAndroid: info.isAndroid,
  chromeVersion: info.chromeVersion,
  isFallbackActive: info.isFallbackActive,
  isPeriodicActive: info.isPeriodicActive,
  syncFrequencyMinutes: info.syncFrequencyMinutes
});

// Output:
// {
//   isAndroid: true,
//   chromeVersion: 49,
//   isFallbackActive: true,        // → IndexedDB polling
//   isPeriodicActive: false,
//   syncFrequencyMinutes: 60
// }
```

### Console Logging

The system logs all sync decisions:
```
✓ Periodic sync registered (60min): txsync
  (successful → isPeriodicSyncActive = true)

✗ Periodic sync failed (SecurityError)
  falling back to IndexedDB polling
  (failed → setupFallbackSync called)

✓ Setting up IndexedDB-based fallback sync mechanism
  (fallback → isFallbackSyncActive = true)

✓ Device went online - triggering immediate fallback sync
  (online event detected → immediate FALLBACK_SYNC message)
```

## Edge Cases & Handled Scenarios

| Scenario | Detection | Resolution |
|----------|-----------|-----------|
| WebView < 5.0 | `isOldWebView` check | Use IndexedDB fallback |
| Chrome < 49 | `chromeVersion < 49` | Use IndexedDB fallback |
| Periodic Sync API unavailable | Check `'periodicSync' in registration` | Use IndexedDB fallback |
| Permissions denied | Permission query returns 'denied' | Use IndexedDB fallback |
| Service Worker fails | Registration throws | IndexedDB polling without SW |
| Offline → Online transition | 'online' event fired | Immediate sync attempt |
| User changes frequency | localStorage update | Message to SW to update interval |
| Multiple attempts failed | Catch-all try/catch | Log error, user can manual sync |

## Testing Checklist

- [ ] Test on Android 5.0-8.x (older WebView)
- [ ] Test on Android 9+ (modern WebView)
- [ ] Test on Chrome mobile (test browser)
- [ ] Test on Samsung Internet
- [ ] Test offline → online transition
- [ ] Test frequency change in AdminSettings
- [ ] Test manual sync button
- [ ] Verify no battery drain increase
- [ ] Check console logs for correct path
- [ ] Verify sync actually completes

## Performance Considerations

### Battery Impact

| Mechanism | Battery Impact | Notes |
|-----------|---|---|
| Periodic Sync | Low | OS handles efficiently |
| IndexedDB Polling (60 min) | Medium | Once per hour |
| IndexedDB Polling (15 min) | High | 4× per hour |

**Recommendation**: Default to 60 minutes for battery efficiency.

### Network Impact

- Periodic Sync: Defers to OS scheduler (may batch with other tasks)
- IndexedDB Polling: Immediate when online event fires
- Both mechanisms: Single API call per sync cycle

## Future Enhancements

1. **Service Worker Persistence**: Unregister periodic sync if Service Worker unregisters
2. **Sync Metrics**: Track success/failure rates for each mechanism
3. **Exponential Backoff**: Retry failed syncs with increasing delay
4. **Bandwidth Awareness**: Adjust frequency based on network type
5. **Battery Saver Mode**: Reduce frequency when battery < 15%

## References

- [Periodic Background Sync API (W3C)](https://w3c.github.io/background-sync/)
- [WCAG 2.1 AA Standards](https://www.w3.org/WAI/WCAG21/quickref/)
- [Android WebView Documentation](https://developer.android.com/develop/ui/webview)
- [Service Worker Specification](https://w3c.github.io/ServiceWorker/)