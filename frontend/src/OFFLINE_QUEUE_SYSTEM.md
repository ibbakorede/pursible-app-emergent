# Offline Queue System Documentation

## Overview

A comprehensive background sync queue that captures transaction attempts when users are offline and automatically retries them with exponential backoff once connectivity is restored. Built on Service Worker background sync and IndexedDB for reliable offline-first transaction handling.

---

## Architecture

### Components

1. **Service Worker** (`public/service-worker.js`)
   - Manages background sync via Background Sync API
   - Retries failed transactions with exponential backoff
   - Broadcasts sync status to app clients
   - Persists queue in IndexedDB

2. **Offline Queue Library** (`lib/offlineQueue.js`)
   - Manages transaction queue in IndexedDB
   - Handles retry logic and status tracking
   - Provides event listener system for queue updates
   - Triggers service worker sync on online restoration

3. **Hooks** (`hooks/useOfflineQueue.js`)
   - React hook for queue state and actions
   - Monitors online/offline status
   - Handles manual sync triggering
   - Provides real-time queue updates

4. **UI Component** (`components/shared/OfflineQueueStatus.jsx`)
   - Shows offline status banner
   - Displays pending/failed transaction counts
   - Manual sync button
   - Auto-hides when online and queue empty

---

## Transaction Flow

### Queueing (Offline)
```
User Action
    ↓
Check Online Status
    ↓
[Offline] Queue to IndexedDB
    ↓
Update UI Status
    ↓
Show Offline Banner
```

### Syncing (Online Restored)
```
Online Event
    ↓
Service Worker Activates
    ↓
Fetch Pending Transactions
    ↓
Retry with Exponential Backoff (Max 3 attempts)
    ↓
[Success] Mark as Synced, Remove from Queue
[Failure] Mark as Failed, Broadcast Error
    ↓
Broadcast Status to Clients
```

---

## Implementation Guide

### 1. Queueing Transactions

When making a transaction offline, queue it instead of retrying the API call:

```javascript
import { queueTransaction } from '@/lib/offlineQueue';

const handleWithdraw = async () => {
  if (!navigator.onLine) {
    // Offline - queue the transaction
    const queueId = await queueTransaction({
      type: 'withdrawal',
      from_currency: 'NGN',
      from_amount: amount,
      bank_account_id: selectedBankId,
      description: 'Withdrawal from app',
    });
    
    toast.success('Transaction queued. Will sync when online.');
    return;
  }
  
  // Online - proceed normally
  await submitWithdrawal();
};
```

### 2. Using the Hook

```javascript
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

export default function TransactionPage() {
  const {
    isOnline,
    pendingCount,
    failedCount,
    queuedTransactions,
    syncStatus,
    queueTransaction,
    manualSync,
  } = useOfflineQueue();

  return (
    <div>
      {!isOnline && (
        <Banner>
          You have {pendingCount} transactions waiting to sync
        </Banner>
      )}
      
      <Button onClick={() => queueTransaction(txData)}>
        Submit Transaction
      </Button>
      
      {pendingCount > 0 && (
        <Button onClick={manualSync}>
          Sync Now
        </Button>
      )}
    </div>
  );
}
```

### 3. Monitoring Queue Status

```javascript
import { subscribeToQueueUpdates } from '@/lib/offlineQueue';

useEffect(() => {
  const unsubscribe = subscribeToQueueUpdates(event => {
    switch (event.type) {
      case 'transaction_queued':
        console.log('Added to queue:', event.id);
        break;
      case 'transaction_updated':
        console.log('Updated:', event.updates);
        break;
      case 'transaction_synced':
        console.log('Synced:', event.id);
        break;
      case 'transaction_failed':
        console.log('Failed:', event.error);
        break;
    }
  });

  return unsubscribe;
}, []);
```

---

## Retry Strategy

### Exponential Backoff
- **Attempt 1**: Immediate
- **Attempt 2**: Wait 2 seconds
- **Attempt 3**: Wait 4 seconds
- **Failed**: Mark as failed after 3 attempts

### Status Tracking
Each queued transaction has:
```javascript
{
  id: 1,
  type: 'withdrawal',
  status: 'pending' | 'synced' | 'failed',
  retries: 0,
  last_error: null,
  last_error_at: null,
  queued_at: '2026-03-24T10:00:00Z',
  synced_at: null,
  sync_result: null,
}
```

---

## Queue Management

### Check Queue Status
```javascript
import { getQueuedTransactions } from '@/lib/offlineQueue';

const transactions = await getQueuedTransactions();
console.log(`Pending: ${transactions.filter(t => t.status === 'pending').length}`);
console.log(`Synced: ${transactions.filter(t => t.status === 'synced').length}`);
console.log(`Failed: ${transactions.filter(t => t.status === 'failed').length}`);
```

### Remove Transaction
```javascript
import { removeQueuedTransaction } from '@/lib/offlineQueue';

await removeQueuedTransaction(txId);
```

### Clear Synced Transactions
```javascript
import { clearSyncedTransactions } from '@/lib/offlineQueue';

// Removes all synced transactions from queue
await clearSyncedTransactions();
```

### Manual Sync
```javascript
import { manualSyncTransactions } from '@/lib/serviceWorkerRegister';

const result = await manualSyncTransactions();
console.log(`Synced: ${result.summary.succeeded}`);
console.log(`Failed: ${result.summary.failed}`);
```

---

## Service Worker Background Sync

### Automatic Triggers
1. **Online Restoration**: Automatically triggers when `online` event fires
2. **Periodic Sync**: Registers for hourly sync (if available)
3. **App Foreground**: Manual sync via `manualSyncTransactions()`

### Background Sync API
The Background Sync API registers the `sync-transactions` tag with the service worker:

```javascript
// Automatic on online restoration
registration.sync.register('sync-transactions');

// Service worker handles:
self.addEventListener('sync', event => {
  if (event.tag === 'sync-transactions') {
    // Fetch and sync pending transactions
    // Retry with exponential backoff
    // Broadcast results to clients
  }
});
```

---

## Granular Progress Tracking

For large batches of transactions, use the new progress callback:

```javascript
import { syncQueuedTransactions } from '@/lib/offlineQueue';

const handleSync = async () => {
  await syncQueuedTransactions(
    async (tx) => {
      // Your sync function
      return await submitTransaction(tx);
    },
    (progress) => {
      // Progress callback fires for each transaction
      console.log(`Progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
      
      if (progress.status === 'complete') {
        console.log(`Summary:`, progress.summary);
        // {succeeded: 45, failed: 2}
      }
    }
  );
};
```

**Progress Event Structure:**
```javascript
{
  total: number,           // Total transactions to sync
  completed: number,       // Transactions processed
  percentage: number,      // 0-100
  status: 'starting' | 'synced' | 'failed' | 'complete',
  transactionId: string,   // Current transaction (if processing)
  result: {success, attempt, error},  // Result of current transaction
  summary: {succeeded, failed}  // Final summary on complete
}
```

### Status Reporting

#### Queue Status Events

**From Service Worker to Clients:**
```javascript
// Via postMessage
{
  type: 'OFFLINE_QUEUE_STATUS',
  data: {
    type: 'transaction_synced' | 'transaction_failed' | 'sync_complete',
    id: transactionId,
    attempt: number,
    error: string | null,
  }
}

// Via Custom Event
window.dispatchEvent(
  new CustomEvent('offlineQueueStatusUpdate', { detail: data })
);
```

**Progress Tracking Event:**
```javascript
// Custom event for UI progress bars
window.addEventListener('offlineQueueProgress', (e) => {
  const {total, completed, percentage, status} = e.detail;
  // Update progress bar: percentage%
  // Update label: `${completed}/${total} synced`
});
```

**From App to Listeners:**
```javascript
subscribeToQueueUpdates(event => {
  // event.type: 'transaction_queued' | 'transaction_updated' | 'transaction_synced' | 'transaction_failed' | 'sync_progress'
  // event.id: transaction ID
  // event.updates: changed fields
  // event.progress: {total, completed, percentage} for sync_progress events
});
```

---

## UI Components

### OfflineQueueStatus Component

Auto-showing banner that displays:
- **Offline with pending**: "X transactions waiting to sync"
- **Online with pending**: "X transactions ready to sync" + Retry button
- **Syncing**: "Syncing transactions..." loading state
- **Failed**: "X transactions failed" + Manual retry button

```jsx
import OfflineQueueStatus from '@/components/shared/OfflineQueueStatus';

<OfflineQueueStatus />
```

---

## Error Handling

### Failed Transactions

When a transaction fails after 3 retries:

1. **Status marked as `failed`**
2. **Error message stored** in `last_error` field
3. **User notified** via UI banner
4. **Manual retry available** via button

```javascript
const failedTransactions = await getQueuedTransactions()
  .then(txs => txs.filter(t => t.status === 'failed'));

failedTransactions.forEach(tx => {
  console.error(`Transaction ${tx.id} failed: ${tx.last_error}`);
});
```

### User Actions on Failure

1. **Automatic Retry**: Click "Sync Now" button to retry manually
2. **Remove**: User can delete failed transactions
3. **Contact Support**: Link provided in UI for persistent failures

---

## Performance Considerations

### Data Storage
- **IndexedDB Quota**: Typically 50MB+ per origin (varies by browser)
- **Cleanup**: Synced transactions removed automatically
- **Monitoring**: Check `navigator.storage.estimate()` if needed

### Sync Timing
- **Online Detection**: Immediate
- **Service Worker**: 0-100ms activation time
- **Database Query**: <10ms per transaction
- **Network Retry**: 1-4 seconds between attempts

### Best Practices
1. Keep transaction objects lean (essential fields only)
2. Clear synced transactions regularly
3. Monitor failed queue count in analytics
4. Set reasonable timeout (30 seconds) for manual sync

---

## Testing

### Offline Simulation

**DevTools (Chrome/Firefox):**
1. Open DevTools → Application/Storage → Service Workers
2. Check "Offline" checkbox
3. Perform transaction
4. Verify queued in IndexedDB
5. Uncheck "Offline"
6. Watch automatic sync occur

### Testing Steps
```javascript
// 1. Queue a transaction offline
navigator.onLine = false;
await queueTransaction({ type: 'withdrawal', ... });

// 2. Verify in IndexedDB
const txs = await getQueuedTransactions();
console.log(txs); // Shows pending transaction

// 3. Go online
navigator.onLine = true;
window.dispatchEvent(new Event('online'));

// 4. Watch sync occur
// Check Service Worker logs
// Verify transaction synced
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Transactions not queuing | App not checking `navigator.onLine` | Wrap submission in `if (!navigator.onLine)` |
| Service Worker not syncing | SW not registered | Check `/service-worker.js` exists and is served |
| Persistent failures | Backend API endpoint missing | Implement `/api/sync-transaction` endpoint |
| Memory leaks | Listeners not cleaned up | Always call `unsubscribe()` in cleanup |
| IndexedDB quota exceeded | Too many transactions queued | Call `clearSyncedTransactions()` periodically |

---

## API Reference

### `lib/offlineQueue.js`

```javascript
// Initialize
initOfflineQueue() → Promise<IDBDatabase>

// Queue operations
queueTransaction(transaction) → Promise<number> // Returns queue ID
getQueuedTransactions() → Promise<Transaction[]>
getQueuedTransaction(id) → Promise<Transaction | null>
removeQueuedTransaction(id) → Promise<void>
updateQueuedTransaction(id, updates) → Promise<Transaction | null>

// Sync with progress tracking
syncQueuedTransactions(
  syncFn: (tx) => Promise<any>,
  onProgress?: (progress) => void
) → Promise<SyncResult>

clearSyncedTransactions() → Promise<void>

// Listening
subscribeToQueueUpdates(listener) → () => void // Returns unsubscribe
```

### `lib/serviceWorkerRegister.js`

```javascript
// Service Worker lifecycle
registerServiceWorker() → Promise<ServiceWorkerRegistration | null>

// Manual sync
manualSyncTransactions() → Promise<{
  success: boolean,
  results: SyncResult[],
  summary: {
    total: number,
    succeeded: number,
    failed: number,
  },
}>
```

### `hooks/useOfflineQueue.js`

```javascript
useOfflineQueue() → {
  // State
  queuedTransactions: Transaction[],
  pendingCount: number,
  failedCount: number,
  isOnline: boolean,
  syncStatus: SyncStatus | null,

  // Actions
  queueTransaction(tx) → Promise<number>,
  removeTransaction(id) → Promise<void>,
  manualSync() → Promise<SyncResult>,
}
```

---

## Summary

The offline queue system provides robust transaction handling for offline scenarios with:
- ✅ Automatic background sync via Service Worker
- ✅ Exponential backoff retry strategy (max 3 attempts)
- ✅ **Granular progress tracking for large batches** (0-100% with per-transaction updates)
- ✅ Real-time queue status reporting via events
- ✅ Manual sync triggering with visual progress
- ✅ Persistent storage in IndexedDB
- ✅ Zero user configuration required

Users can confidently initiate transactions offline, knowing they'll automatically sync with transparent progress tracking and report status once connectivity is restored.

### New Features (v2)

**Granular Batch Progress:**
- Per-transaction sync reporting
- Overall batch percentage calculation
- Real-time UI progress bars
- Success/failure summary on completion

**UI Enhancement:**
- `OfflineQueueStatus` component now shows live progress bar
- Displays "X of Y synced" during sync
- Progress bar animates to 100% on completion
- All touch targets meet 44px accessibility standard