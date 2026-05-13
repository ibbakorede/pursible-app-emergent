import { logger } from './logger';
import { openDB } from 'idb';

const DB_NAME = 'FinanceApp';
const STORE_NAME = 'transactions_queue';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

let db;
let listeners = new Set();

export const initOfflineQueue = async () => {
  db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });

  // Monitor online/offline events and trigger sync
  window.addEventListener('online', handleOnlineRestored);
  return db;
};

export const queueTransaction = async (transaction) => {
  if (!db) await initOfflineQueue();
  const id = await db.add(STORE_NAME, {
    ...transaction,
    queued_at: new Date().toISOString(),
    status: 'pending',
    retries: 0,
    last_error: null,
  });
  notifyListeners({ type: 'transaction_queued', id, transaction });
  return id;
};

export const getQueuedTransactions = async () => {
  if (!db) await initOfflineQueue();
  return db.getAll(STORE_NAME);
};

export const getQueuedTransaction = async (id) => {
  if (!db) await initOfflineQueue();
  return db.get(STORE_NAME, id);
};

export const removeQueuedTransaction = async (id) => {
  if (!db) await initOfflineQueue();
  await db.delete(STORE_NAME, id);
  notifyListeners({ type: 'transaction_removed', id });
};

export const updateQueuedTransaction = async (id, updates) => {
  if (!db) await initOfflineQueue();
  const tx = await db.get(STORE_NAME, id);
  if (tx) {
    const updated = { ...tx, ...updates };
    await db.put(STORE_NAME, updated);
    notifyListeners({ type: 'transaction_updated', id, updates });
    return updated;
  }
};

export const syncQueuedTransactions = async (syncFn, onProgress) => {
  if (!db) await initOfflineQueue();
  const transactions = await getQueuedTransactions();
  const pending = transactions.filter(tx => tx.status !== 'synced');
  const results = [];
  const failedIds = [];

  // Notify initial batch progress
  if (onProgress) {
    onProgress({
      total: pending.length,
      completed: 0,
      percentage: 0,
      status: 'starting',
    });
  }

  for (let i = 0; i < pending.length; i++) {
    const tx = pending[i];
    const result = await retrySyncTransaction(tx, syncFn);
    results.push(result);

    if (!result.success) {
      failedIds.push(tx.id);
    }

    // Report granular progress
    if (onProgress) {
      const completed = i + 1;
      const percentage = Math.round((completed / pending.length) * 100);
      onProgress({
        total: pending.length,
        completed,
        percentage,
        status: result.success ? 'synced' : 'failed',
        transactionId: tx.id,
        result,
      });
    }
  }

  // Final summary
  if (onProgress) {
    onProgress({
      total: pending.length,
      completed: pending.length,
      percentage: 100,
      status: 'complete',
      summary: {
        succeeded: results.filter(r => r.success).length,
        failed: failedIds.length,
      },
    });
  }

  return {
    results,
    failedCount: failedIds.length,
    successCount: results.filter(r => r.success).length,
  };
};

const retrySyncTransaction = async (tx, syncFn) => {
  let lastError;
  let currentTx = { ...tx };

  for (let attempt = currentTx.retries || 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await syncFn(currentTx);
      await updateQueuedTransaction(tx.id, {
        status: 'synced',
        synced_at: new Date().toISOString(),
        sync_result: result,
      });
      notifyListeners({
        type: 'transaction_synced',
        id: tx.id,
        attempt: attempt + 1,
      });
      return { id: tx.id, success: true, result, attempt: attempt + 1 };
    } catch (error) {
      lastError = error;
      const nextRetry = attempt + 1;
      const backoffDelay = INITIAL_RETRY_DELAY * Math.pow(2, nextRetry);

      await updateQueuedTransaction(tx.id, {
        retries: nextRetry,
        last_error: error.message,
        last_error_at: new Date().toISOString(),
        status: nextRetry >= MAX_RETRIES ? 'failed' : 'pending',
      });

      if (nextRetry < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        currentTx = await getQueuedTransaction(tx.id);
      }
    }
  }

  notifyListeners({
    type: 'transaction_failed',
    id: tx.id,
    error: lastError?.message,
    retries: MAX_RETRIES,
  });

  return {
    id: tx.id,
    success: false,
    error: lastError?.message || 'Unknown error',
    attempts: MAX_RETRIES,
  };
};

export const clearSyncedTransactions = async () => {
  if (!db) await initOfflineQueue();
  const transactions = await getQueuedTransactions();
  for (const tx of transactions) {
    if (tx.status === 'synced') {
      await removeQueuedTransaction(tx.id);
    }
  }
};

// Status reporting via listeners
export const subscribeToQueueUpdates = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notifyListeners = (event) => {
  listeners.forEach(listener => {
    try {
      listener(event);
    } catch (err) {
      logger.error('Queue listener error:', err);
    }
  });

  // Also post to service worker for syncing
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'QUEUE_STATUS_UPDATE',
      event,
    });
  }

  // Dispatch custom event for progress tracking
  if (event.type === 'sync_progress') {
    window.dispatchEvent(
      new CustomEvent('offlineQueueProgress', { detail: event })
    );
  }
};

const handleOnlineRestored = () => {
  logger.log('Connection restored, attempting sync...');
  notifyListeners({ type: 'online_restored', timestamp: new Date().toISOString() });

  // Request background sync if available
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      registration.sync.register('txsync').catch(err => {
        logger.log('Background sync not available:', err);
      });
    });
  }

  // Also trigger immediate sync via service worker
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SYNC_TRANSACTIONS',
    });
  }
};