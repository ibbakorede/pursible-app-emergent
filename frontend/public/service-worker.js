// Service Worker for offline transaction queue management

const DB_NAME = 'FinanceApp';
const STORE_NAME = 'transactions_queue';
const SYNC_TAG = 'sync-transactions';

let db;

// Initialize IndexedDB connection in service worker
const initDB = async () => {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// Get all pending transactions
const getPendingTransactions = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const txs = request.result.filter(tx => tx.status !== 'synced');
      resolve(txs);
    };
  });
};

// Update transaction status
const updateTransaction = async (id, updates) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const tx = getRequest.result;
      if (tx) {
        const updated = { ...tx, ...updates };
        const putRequest = store.put(updated);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve(updated);
      } else {
        resolve(null);
      }
    };
  });
};

// Broadcast status to clients
const broadcastStatus = async (status) => {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'OFFLINE_QUEUE_STATUS',
      data: status,
    });
  });
};

// Retry logic with exponential backoff
const retrySync = async (tx, attempt = 0, maxAttempts = 3) => {
  const backoffDelay = 1000 * Math.pow(2, attempt);

  if (attempt > 0) {
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
  }

  try {
    // Attempt to sync via fetch to backend
    const response = await fetch('/api/sync-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: tx.id,
        type: tx.type,
        from_currency: tx.from_currency,
        to_currency: tx.to_currency,
        from_amount: tx.from_amount,
        to_amount: tx.to_amount,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Mark as synced
    await updateTransaction(tx.id, {
      status: 'synced',
      synced_at: new Date().toISOString(),
      sync_result: result,
    });

    await broadcastStatus({
      type: 'transaction_synced',
      id: tx.id,
      attempt: attempt + 1,
    });

    return { success: true, result };
  } catch (error) {
    const nextAttempt = attempt + 1;

    if (nextAttempt >= maxAttempts) {
      // Final failure
      await updateTransaction(tx.id, {
        status: 'failed',
        last_error: error.message,
        last_error_at: new Date().toISOString(),
        retries: nextAttempt,
      });

      await broadcastStatus({
        type: 'transaction_failed',
        id: tx.id,
        error: error.message,
        retries: nextAttempt,
      });

      return { success: false, error: error.message, attempts: nextAttempt };
    } else {
      // Retry
      await updateTransaction(tx.id, {
        retries: nextAttempt,
        last_error: error.message,
        last_error_at: new Date().toISOString(),
      });

      await broadcastStatus({
        type: 'transaction_retry',
        id: tx.id,
        attempt: nextAttempt,
        error: error.message,
      });

      return retrySync(tx, nextAttempt, maxAttempts);
    }
  }
};

// Handle background sync event
self.addEventListener('sync', event => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(
      (async () => {
        try {
          const pendingTransactions = await getPendingTransactions();

          const results = await Promise.all(
            pendingTransactions.map(tx => retrySync(tx, 0, 3))
          );

          const successCount = results.filter(r => r.success).length;
          const failCount = results.filter(r => !r.success).length;

          await broadcastStatus({
            type: 'sync_complete',
            successCount,
            failCount,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Background sync error:', error);
          await broadcastStatus({
            type: 'sync_error',
            error: error.message,
          });
        }
      })()
    );
  }
});

// Handle messages from clients
self.addEventListener('message', event => {
  const { type } = event.data;

  if (type === 'SYNC_TRANSACTIONS') {
    event.waitUntil(
      (async () => {
        try {
          const pendingTransactions = await getPendingTransactions();

          if (pendingTransactions.length === 0) {
            event.ports[0]?.postMessage({
              success: true,
              message: 'No transactions to sync',
            });
            return;
          }

          const results = await Promise.all(
            pendingTransactions.map(tx => retrySync(tx, 0, 3))
          );

          event.ports[0]?.postMessage({
            success: true,
            results,
            summary: {
              total: results.length,
              succeeded: results.filter(r => r.success).length,
              failed: results.filter(r => !r.success).length,
            },
          });

          await broadcastStatus({
            type: 'manual_sync_complete',
            results,
          });
        } catch (error) {
          event.ports[0]?.postMessage({
            success: false,
            error: error.message,
          });
        }
      })()
    );
  }
});

// Keep service worker alive and log lifecycle
self.addEventListener('install', event => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});
