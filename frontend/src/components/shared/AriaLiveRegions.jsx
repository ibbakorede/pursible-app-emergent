import { useEffect, useState } from 'react';

/**
 * AriaLiveRegions - Manages ARIA live regions for dynamic content updates
 * Announces balance changes, transaction updates, and sync status to screen readers
 */

// Store for live region announcements
const liveRegionStore = {
  balance: '',
  transaction: '',
  syncStatus: '',
  notification: '',
};

export const useAriaLiveRegion = (region = 'notification') => {
  const announce = (message) => {
    liveRegionStore[region] = message;
    // Trigger a re-render by dispatching a custom event
    window.dispatchEvent(
      new CustomEvent('ariaLiveUpdate', {
        detail: { region, message },
      })
    );
  };

  return { announce };
};

/**
 * AriaLiveRegionContainer - Renders all live regions for the app
 * Place this once in your root layout
 */
export function AriaLiveRegionContainer() {
  const [regions, setRegions] = useState({
    balance: '',
    transaction: '',
    syncStatus: '',
    notification: '',
  });

  useEffect(() => {
    const handleUpdate = (e) => {
      const { region, message } = e.detail;
      setRegions(prev => ({ ...prev, [region]: message }));

      // Clear message after announcement (prevent repetition)
      setTimeout(() => {
        setRegions(prev => ({ ...prev, [region]: '' }));
      }, 1000);
    };

    window.addEventListener('ariaLiveUpdate', handleUpdate);
    return () => window.removeEventListener('ariaLiveUpdate', handleUpdate);
  }, []);

  return (
    <>
      {/* Balance updates - polite (don't interrupt) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
        data-testid="aria-live-balance"
      >
        {regions.balance}
      </div>

      {/* Transaction updates - assertive (interrupt) */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="sr-only"
        data-testid="aria-live-transaction"
      >
        {regions.transaction}
      </div>

      {/* Sync status - polite */}
      <div
        aria-live="polite"
        aria-atomic="true"
        role="status"
        className="sr-only"
        data-testid="aria-live-sync-status"
      >
        {regions.syncStatus}
      </div>

      {/* General notifications - assertive */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        role="alert"
        className="sr-only"
        data-testid="aria-live-notification"
      >
        {regions.notification}
      </div>
    </>
  );
}

/**
 * Convenience hooks for common announcement patterns
 */

export const useBalanceAnnouncement = () => {
  const { announce } = useAriaLiveRegion('balance');

  return (currency, amount, change = null) => {
    let message = `${currency} balance is now ${amount}`;
    if (change) {
      message += `, ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}`;
    }
    announce(message);
  };
};

export const useTransactionAnnouncement = () => {
  const { announce } = useAriaLiveRegion('transaction');

  return (type, amount, currency, status = null) => {
    let message = `${type} transaction of ${amount} ${currency}`;
    if (status) {
      message += ` ${status}`;
    }
    announce(message);
  };
};

export const useSyncStatusAnnouncement = () => {
  const { announce } = useAriaLiveRegion('syncStatus');

  return (status) => {
    const messages = {
      starting: 'Synchronization started',
      synced: 'Transaction synchronized successfully',
      failed: 'Transaction synchronization failed',
      complete: 'Synchronization complete',
      error: 'Synchronization error occurred',
    };
    announce(messages[status] || status);
  };
};

export const useNotificationAnnouncement = () => {
  const { announce } = useAriaLiveRegion('notification');
  return announce;
};

/**
 * Helper to announce balance updates when data changes
 */
export const announceBalanceUpdate = (currency, newBalance, oldBalance = null) => {
  const { announce } = useAriaLiveRegion('balance');

  if (oldBalance !== null) {
    const change = newBalance - oldBalance;
    const direction = change > 0 ? 'increased' : 'decreased';
    announce(
      `${currency} balance ${direction} from ${oldBalance} to ${newBalance}`
    );
  } else {
    announce(`${currency} balance updated to ${newBalance}`);
  }
};

/**
 * Helper to announce transaction completions
 */
export const announceTransactionComplete = (transactionType, amount, currency, status) => {
  const { announce } = useAriaLiveRegion('transaction');
  announce(
    `${transactionType} of ${amount} ${currency} has ${status}`
  );
};

/**
 * Helper to announce sync progress
 */
export const announceSyncProgress = (completed, total) => {
  const { announce } = useAriaLiveRegion('syncStatus');
  const percentage = Math.round((completed / total) * 100);
  announce(`Syncing transactions: ${completed} of ${total} complete, ${percentage}%`);
};