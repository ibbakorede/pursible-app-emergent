# Implementation Examples: Offline Queue Progress & Touch Targets

---

## Example 1: Using Progress Tracking in a Component

### Before (Without Progress)

```jsx
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Button } from '@/components/ui/button';

export default function TransactionPage() {
  const { manualSync } = useOfflineQueue();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await manualSync();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div>
      <Button onClick={handleSync} disabled={isSyncing}>
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </Button>
    </div>
  );
}
```

### After (With Progress)

```jsx
import { useOfflineQueue } from '@/hooks/useOfflineQueue';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function TransactionPage() {
  const { manualSync } = useOfflineQueue();
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(null);

  // Listen for progress events
  useEffect(() => {
    const handleProgress = (e) => {
      setProgress(e.detail);
    };
    window.addEventListener('offlineQueueProgress', handleProgress);
    return () => window.removeEventListener('offlineQueueProgress', handleProgress);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setProgress(null);
    try {
      await manualSync();
    } finally {
      setIsSyncing(false);
      setProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleSync} 
        disabled={isSyncing}
        className="w-full"
      >
        {isSyncing ? 'Syncing...' : 'Sync Now'}
      </Button>

      {/* Progress Display */}
      {isSyncing && progress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {progress.completed} of {progress.total} synced
            </span>
            <span className="text-muted-foreground">
              {progress.percentage}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary on Complete */}
      {progress?.status === 'complete' && !isSyncing && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-medium text-green-900">
            ✓ Synced {progress.summary.succeeded} transaction
            {progress.summary.succeeded !== 1 ? 's' : ''}
          </p>
          {progress.summary.failed > 0 && (
            <p className="text-xs text-green-700 mt-1">
              {progress.summary.failed} failed - retry to reprocess
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Example 2: Custom Progress Hook

Create a reusable hook for progress tracking:

```javascript
// hooks/useOfflineQueueProgress.js
import { useState, useEffect } from 'react';

export function useOfflineQueueProgress() {
  const [progress, setProgress] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleProgress = (e) => {
      const detail = e.detail;
      setProgress(detail);

      // Auto-manage syncing state
      if (detail.status === 'starting') {
        setIsSyncing(true);
      } else if (detail.status === 'complete') {
        setIsSyncing(false);
      }
    };

    window.addEventListener('offlineQueueProgress', handleProgress);
    return () => window.removeEventListener('offlineQueueProgress', handleProgress);
  }, []);

  return {
    progress,
    isSyncing,
    percentage: progress?.percentage || 0,
    completed: progress?.completed || 0,
    total: progress?.total || 0,
    summary: progress?.summary || null,
    isComplete: progress?.status === 'complete',
  };
}
```

**Usage:**
```jsx
import { useOfflineQueueProgress } from '@/hooks/useOfflineQueueProgress';

export default function Page() {
  const { percentage, completed, total, summary } = useOfflineQueueProgress();

  return (
    <div>
      <p>{completed} of {total} synced</p>
      <ProgressBar value={percentage} />
    </div>
  );
}
```

---

## Example 3: Advanced Progress Component

```jsx
// components/offline/SyncProgressPanel.jsx
import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

export default function SyncProgressPanel() {
  const { manualSync } = useOfflineQueue();
  const [progress, setProgress] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const handleProgress = (e) => {
      const detail = e.detail;
      setProgress(detail);

      // Track individual syncs in history
      if (detail.transactionId && detail.result) {
        setHistory(prev => [...prev, {
          id: detail.transactionId,
          success: detail.result.success,
          attempt: detail.result.attempt,
          timestamp: new Date(),
        }]);
      }
    };

    window.addEventListener('offlineQueueProgress', handleProgress);
    return () => window.removeEventListener('offlineQueueProgress', handleProgress);
  }, []);

  const handleSync = async () => {
    setHistory([]);
    await manualSync();
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Sync Status</h3>
        <Button 
          size="sm" 
          onClick={handleSync}
          disabled={progress?.status === 'starting' || progress?.status === 'complete' === false}
        >
          Sync Now
        </Button>
      </div>

      {/* Main Progress */}
      {progress && (
        <>
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.completed}/{progress.total}</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="text-sm text-muted-foreground">
            {progress.status === 'starting' && 'Starting sync...'}
            {progress.status === 'synced' && `Synced transaction ${progress.completed}`}
            {progress.status === 'failed' && `Transaction ${progress.completed} failed`}
            {progress.status === 'complete' && 'Sync complete!'}
          </div>

          {/* Summary */}
          {progress.status === 'complete' && progress.summary && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {progress.summary.succeeded}
                </div>
                <div className="text-xs text-muted-foreground">Succeeded</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {progress.summary.failed}
                </div>
                <div className="text-xs text-muted-foreground">Failed</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="pt-2 border-t space-y-1 max-h-48 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground">Recent</p>
          {history.slice(-5).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted">
              {item.success ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-muted-foreground">
                Transaction {item.id.substring(0, 8)}...
              </span>
              <span className={item.success ? 'text-green-600' : 'text-red-600'}>
                {item.success ? '✓' : '✗'} {item.attempt} attempt{item.attempt !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Example 4: Touch Target Audit Checklist

When creating new interactive components, use this checklist:

```javascript
// ✅ TOUCH TARGET CHECKLIST

// 1. Button Components
<Button>Submit</Button> // ✅ min-h-[44px]
<Button size="icon">
  <ChevronLeft /> // ✅ h-11 w-11 = 44×44px
</Button>

// 2. Form Controls
<Input /> // ✅ Default h-9 but wrapped in label for 44px touch
<Select>
  <SelectTrigger /> // ✅ 44px minimum height
</Select>

// 3. List Items
<div className="p-3 min-h-[48px]"> // ✅ At least 48px height
  <button className="h-11 w-11"> // ✅ Icon buttons 44×44px
    <Edit />
  </button>
</div>

// 4. Spacing Between Elements
<div className="space-y-2"> // ✅ At least 8px gap
  <Button>First</Button>
  <Button>Second</Button>
</div>

// 5. Icon Sizes (with 44×44px button)
<Button size="icon">
  <ChevronDown className="w-5 h-5" /> // ✅ 20px icon in 44px button
</Button>

// 6. ARIA Labels (for icon buttons)
<Button size="icon" aria-label="Delete item">
  <Trash className="w-5 h-5" />
</Button>
```

---

## Example 5: Progressive Enhancement

```jsx
// Example: Form with sync progress

export default function WithdrawalForm() {
  const { manualSync, isOnline } = useOfflineQueue();
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    window.addEventListener('offlineQueueProgress', (e) => {
      setProgress(e.detail);
    });
  }, []);

  return (
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Amount</label>
        <input
          type="number"
          className="w-full h-11 px-3 border rounded-lg" // ✅ 44px height
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-11">
          Cancel
        </Button>
        <Button className="h-11">
          Submit
        </Button>
      </div>

      {/* Show progress when syncing */}
      {!isOnline && progress && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-sm mb-2">
            Syncing {progress.completed}/{progress.total}
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-full transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}
    </form>
  );
}
```

---

## Testing Checklist

```bash
# 1. Test Progress Events
- [ ] Queue 5+ transactions offline
- [ ] Go online
- [ ] Watch progress 0% → 100%
- [ ] Verify final summary count

# 2. Test Touch Targets
- [ ] DevTools → Device Mode (320px width)
- [ ] Tap each button successfully
- [ ] Verify no overlapping elements
- [ ] Test with maximum font size

# 3. Test Accessibility
- [ ] All icon buttons have aria-label
- [ ] Focus indicators visible
- [ ] Tab navigation works
- [ ] Screen reader announces progress

# 4. Test on Real Devices
- [ ] Low-density phone (MDPI)
- [ ] High-density phone (XXHDPI)
- [ ] Tablet (landscape)
- [ ] With accessibility features enabled
```

---

**Ready to implement?** Start with Example 1 (basic progress) and expand to Example 3 (advanced panel) for production apps.