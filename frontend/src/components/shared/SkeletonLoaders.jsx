import { Skeleton } from '@/components/ui/skeleton';

export function HomePageSkeleton() {
  return (
    <div className="px-4 pt-6 pb-24 space-y-5" aria-label="Loading home page content" role="status">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-20 mb-2 rounded-lg" aria-label="Loading greeting text" />
          <Skeleton className="h-6 w-32 rounded-lg" aria-label="Loading user name" />
        </div>
        <Skeleton className="h-11 w-11 rounded-xl" aria-label="Loading notification icon" />
      </div>

      {/* KYC Banner Skeleton */}
      <Skeleton className="h-20 rounded-2xl" aria-label="Loading KYC status banner" />

      {/* Balance Card Skeleton */}
      <Skeleton className="h-32 rounded-3xl" aria-label="Loading balance card" />

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton key="action-deposit" className="h-20 rounded-2xl" aria-label="Loading deposit action" />
        <Skeleton key="action-withdraw" className="h-20 rounded-2xl" aria-label="Loading withdraw action" />
        <Skeleton key="action-convert" className="h-20 rounded-2xl" aria-label="Loading convert action" />
      </div>

      {/* Quick Converter */}
      <Skeleton className="h-32 rounded-2xl" aria-label="Loading currency converter" />

      {/* Recent Transactions */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded-lg" aria-label="Loading recent transactions title" />
        <Skeleton key="txn-1" className="h-20 rounded-2xl" aria-label="Loading transaction 1" />
        <Skeleton key="txn-2" className="h-20 rounded-2xl" aria-label="Loading transaction 2" />
        <Skeleton key="txn-3" className="h-20 rounded-2xl" aria-label="Loading transaction 3" />
      </div>
    </div>
  );
}

export function WalletPageSkeleton() {
  return (
    <div className="px-4 pt-6 pb-10 space-y-5" aria-label="Loading wallet page content" role="status">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32 rounded-lg" aria-label="Loading wallet title" />
        <div className="flex gap-1">
          <Skeleton className="h-9 w-9 rounded-full" aria-label="Loading action button 1" />
          <Skeleton className="h-9 w-9 rounded-full" aria-label="Loading action button 2" />
        </div>
      </div>

      {/* Net Worth Hero */}
      <Skeleton className="h-40 rounded-3xl" aria-label="Loading net worth summary" />

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Skeleton key="wallet-action-1" className="h-20 rounded-2xl" aria-label="Loading wallet action 1" />
        <Skeleton key="wallet-action-2" className="h-20 rounded-2xl" aria-label="Loading wallet action 2" />
        <Skeleton key="wallet-action-3" className="h-20 rounded-2xl" aria-label="Loading wallet action 3" />
      </div>

      {/* Currency Converter */}
      <Skeleton className="h-40 rounded-2xl" aria-label="Loading currency converter" />

      {/* Wallet Cards */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-20 rounded-lg" aria-label="Loading wallet cards title" />
        <Skeleton key="wallet-usd" className="h-24 rounded-2xl" aria-label="Loading USD wallet" />
        <Skeleton key="wallet-usdc" className="h-24 rounded-2xl" aria-label="Loading USDC wallet" />
        <Skeleton key="wallet-usdt" className="h-24 rounded-2xl" aria-label="Loading USDT wallet" />
        <Skeleton key="wallet-ngn" className="h-24 rounded-2xl" aria-label="Loading NGN wallet" />
      </div>
    </div>
  );
}

export function TransactionsPageSkeleton() {
  return (
    <div className="px-4 pt-6 pb-24 space-y-5" aria-label="Loading transactions page content" role="status">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Skeleton className="h-6 w-32 rounded-lg mb-2" aria-label="Loading transactions title" />
          <Skeleton className="h-4 w-24 rounded-lg" aria-label="Loading transaction count" />
        </div>
        <Skeleton className="h-9 w-20 rounded-xl" aria-label="Loading export button" />
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton key="summary-total" className="h-20 rounded-xl" aria-label="Loading total summary" />
        <Skeleton key="summary-in" className="h-20 rounded-xl" aria-label="Loading inflow summary" />
        <Skeleton key="summary-out" className="h-20 rounded-xl" aria-label="Loading outflow summary" />
      </div>

      {/* Search */}
      <Skeleton className="h-11 rounded-xl" aria-label="Loading search input" />

      {/* Direction Filters */}
      <div className="flex gap-2">
        <Skeleton key="filter-all" className="h-9 w-20 rounded-lg" aria-label="Loading all filter" />
        <Skeleton key="filter-in" className="h-9 w-20 rounded-lg" aria-label="Loading inbound filter" />
        <Skeleton key="filter-out" className="h-9 w-20 rounded-lg" aria-label="Loading outbound filter" />
      </div>

      {/* Type/Status Filters */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" aria-label="Loading type filter" />
        <Skeleton className="h-9 flex-1 rounded-xl" aria-label="Loading status filter" />
      </div>

      {/* Transaction List */}
      <div className="bg-card rounded-2xl overflow-hidden border border-border space-y-0">
        {['txn-item-1', 'txn-item-2', 'txn-item-3', 'txn-item-4', 'txn-item-5', 'txn-item-6'].map((id) => (
          <div key={id} className="border-b border-border last:border-0 px-4 py-4" aria-label={`Loading transaction ${id}`}>
            <div className="flex items-center gap-3.5">
              <Skeleton className="h-10 w-10 rounded-2xl flex-shrink-0" aria-label="Loading transaction icon" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24 rounded-lg" aria-label="Loading transaction type" />
                <Skeleton className="h-3 w-32 rounded-lg" aria-label="Loading transaction date" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20 rounded-lg" aria-label="Loading transaction amount" />
                <Skeleton className="h-3 w-16 rounded-lg" aria-label="Loading transaction status" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
