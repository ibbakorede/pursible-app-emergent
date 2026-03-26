import { useEffect, useState, useCallback } from 'react';
import {
  queueTransaction,
  getQueuedTransactions,
  subscribeToQueueUpdates,
  syncQueuedTransactions,
  removeQueuedTransaction,
} from '@/lib/offlineQueue';
import { manualSyncTransactions } from '@/lib/serviceWorkerRegister';

export function useOfflineQueue() {
  const [queuedTransactions, setQueuedTransactions] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load initial queue
  useEffect(() => {
    const loadQueue = async () => {
      const transactions = await getQueuedTransactions();
      setQueuedTransactions(transactions);
    };

    loadQueue();

    // Subscribe to queue updates
    const unsubscribe = subscribeToQueueUpdates(event => {
      if (event.type === 'transaction_queued') {
        setQueuedTransactions(prev => [
          ...prev,
          { id: event.id, ...event.transaction },
        ]);
      } else if (event.type === 'transaction_updated') {
        setQueuedTransactions(prev =>
          prev.map(t =>
            t.id === event.id ? { ...t, ...event.updates } : t
          )
        );
      } else if (event.type === 'transaction_removed') {
        setQueuedTransactions(prev => prev.filter(t => t.id !== event.id));
      }
    });

    // Listen for offline queue status updates from service worker
    const handleStatusUpdate = event => {
      setSyncStatus(event.detail);
    };

    window.addEventListener('offlineQueueStatusUpdate', handleStatusUpdate);

    // Online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('offlineQueueStatusUpdate', handleStatusUpdate);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const queueTx = useCallback(async (transaction) => {
    return queueTransaction(transaction);
  }, []);

  const removeTx = useCallback(async (id) => {
    return removeQueuedTransaction(id);
  }, []);

  const manualSync = useCallback(async () => {
    setSyncStatus({ type: 'syncing', message: 'Syncing transactions...' });
    try {
      const result = await manualSyncTransactions();
      setSyncStatus({
        type: 'sync_complete',
        ...result.summary,
        timestamp: new Date().toISOString(),
      });
      return result;
    } catch (error) {
      setSyncStatus({
        type: 'sync_error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }, []);

  const pendingCount = queuedTransactions.filter(t => t.status === 'pending').length;
  const failedCount = queuedTransactions.filter(t => t.status === 'failed').length;

  return {
    // Queue data
    queuedTransactions,
    pendingCount,
    failedCount,
    isOnline,

    // Status
    syncStatus,

    // Actions
    queueTransaction: queueTx,
    removeTransaction: removeTx,
    manualSync,
  };
}