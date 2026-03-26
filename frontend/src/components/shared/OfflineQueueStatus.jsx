import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { AlertCircle, Wifi, WifiOff, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSyncStatusAnnouncement, announceSyncProgress } from '@/components/shared/AriaLiveRegions';

export default function OfflineQueueStatus() {
  const { isOnline, pendingCount, failedCount, syncStatus, manualSync } = useOfflineQueue();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const announceSyncStatus = useSyncStatusAnnouncement();

  if (isOnline && !pendingCount && !failedCount) {
    return null; // Don't show if online and no queue
  }

  useEffect(() => {
    const handleProgress = (e) => {
      setSyncProgress(e.detail);
      
      // Announce progress for screen readers
      if (e.detail.status === 'starting') {
        announceSyncStatus('starting');
      } else if (e.detail.status === 'complete') {
        announceSyncStatus('complete');
      } else if (e.detail.completed && e.detail.total) {
        announceSyncProgress(e.detail.completed, e.detail.total);
      }
    };
    window.addEventListener('offlineQueueProgress', handleProgress);
    return () => window.removeEventListener('offlineQueueProgress', handleProgress);
  }, [announceSyncStatus]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncProgress(null);
    try {
      await manualSync();
      toast.success('Transactions synced successfully');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // Offline with pending transactions
  if (!isOnline && pendingCount > 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WifiOff className="w-4 h-4 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {pendingCount} transaction{pendingCount !== 1 ? 's' : ''} waiting to sync
            </p>
            <p className="text-xs text-amber-700">You're offline. Will sync when connection restored.</p>
          </div>
        </div>
        {failedCount > 0 && (
          <span className="text-xs font-semibold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
            {failedCount} failed
          </span>
        )}
      </div>
    );
  }

  // Online with pending/failed transactions
  if (isOnline && (pendingCount > 0 || failedCount > 0)) {
    const showProgress = isSyncing && syncProgress && syncProgress.total > 0;
    const progressPercent = syncProgress?.percentage || 0;

    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-blue-50 border-b border-blue-200 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {syncStatus?.type === 'syncing' || isSyncing ? (
              <Loader2 className="w-4 h-4 text-blue-700 animate-spin" />
            ) : (
              <Wifi className="w-4 h-4 text-blue-700" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-900">
                {syncStatus?.type === 'syncing' || isSyncing
                  ? 'Syncing transactions...'
                  : `${pendingCount} transaction${pendingCount !== 1 ? 's' : ''} ready to sync`}
              </p>
              <p className="text-xs text-blue-700">
                {showProgress
                  ? `${syncProgress.completed} of ${syncProgress.total} synced`
                  : syncStatus?.type === 'sync_complete'
                    ? `Synced: ${syncStatus.succeeded || 0}`
                    : 'Connection restored. Retrying now...'}
              </p>
            </div>
          </div>
          {syncStatus?.type !== 'syncing' && !isSyncing && (
            <Button
              size="icon"
              variant="ghost"
              className="h-11 w-11"
              onClick={handleManualSync}
              disabled={isSyncing}
              aria-label="Retry sync"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Granular progress bar */}
        {showProgress && (
          <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-700 h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Failed transactions — error recovery state
  if (failedCount > 0 && isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-40 bg-red-50 border-b border-red-200 px-4 py-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-900">
                {failedCount} transaction{failedCount !== 1 ? 's' : ''} failed to sync
              </p>
              <button
                className="text-xs text-red-700 underline underline-offset-2 text-left"
                onClick={() => setShowRecovery(r => !r)}
                aria-expanded={showRecovery}
              >
                {showRecovery ? 'Hide steps' : 'How to resolve →'}
              </button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11"
            onClick={handleManualSync}
            disabled={isSyncing}
            aria-label="Retry sync"
          >
            {isSyncing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </Button>
        </div>

        {showRecovery && (
          <div className="bg-red-100 rounded-xl px-3 py-2.5 space-y-1.5" role="region" aria-label="Error recovery steps">
            <p className="text-xs font-semibold text-red-900">To manually resolve failed syncs:</p>
            <ol className="text-xs text-red-800 space-y-1 list-decimal list-inside">
              <li>Tap the <strong>retry</strong> button above — most failures resolve automatically.</li>
              <li>Check your internet connection is stable, then retry.</li>
              <li>Go to <strong>Transactions</strong> and look for transactions marked "Failed" — note the reference IDs.</li>
              <li>If retrying still fails, contact support with your reference IDs and we'll process them manually.</li>
            </ol>
            <a
              href="/support"
              className="inline-block text-xs font-semibold text-red-900 underline underline-offset-2 mt-1"
            >
              Contact Support →
            </a>
          </div>
        )}
      </div>
    );
  }

  return null;
}