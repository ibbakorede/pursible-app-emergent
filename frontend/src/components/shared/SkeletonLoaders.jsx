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
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" aria-label={`Loading quick action ${i + 1}`} />
        ))}
      </div>

      {/* Quick Converter */}
      <Skeleton className="h-32 rounded-2xl" aria-label="Loading currency converter" />

      {/* Recent Transactions */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded-lg" aria-label="Loading recent transactions title" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" aria-label={`Loading transaction ${i + 1}`} />
        ))}
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
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" aria-label={`Loading wallet action ${i + 1}`} />
        ))}
      </div>

      {/* Currency Converter */}
      <Skeleton className="h-40 rounded-2xl" aria-label="Loading currency converter" />

      {/* Wallet Cards */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-20 rounded-lg" aria-label="Loading wallet cards title" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" aria-label={`Loading wallet card for currency ${i + 1}`} />
        ))}
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
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" aria-label={`Loading transaction summary ${i + 1}`} />
        ))}
      </div>

      {/* Search */}
      <Skeleton className="h-11 rounded-xl" aria-label="Loading search input" />

      {/* Direction Filters */}
      <div className="flex gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-lg" aria-label={`Loading direction filter ${i + 1}`} />
        ))}
      </div>

      {/* Type/Status Filters */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" aria-label="Loading type filter" />
        <Skeleton className="h-9 flex-1 rounded-xl" aria-label="Loading status filter" />
      </div>

      {/* Transaction List */}
      <div className="bg-card rounded-2xl overflow-hidden border border-border space-y-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border-b border-border last:border-0 px-4 py-4" aria-label={`Loading transaction item ${i + 1}`}>
            <div className="flex items-center gap-3.5">
              <Skeleton className="h-10 w-10 rounded-2xl flex-shrink-0" aria-label={`Loading transaction icon ${i + 1}`} />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24 rounded-lg" aria-label={`Loading transaction type ${i + 1}`} />
                <Skeleton className="h-3 w-32 rounded-lg" aria-label={`Loading transaction date ${i + 1}`} />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-20 rounded-lg" aria-label={`Loading transaction amount ${i + 1}`} />
                <Skeleton className="h-3 w-16 rounded-lg" aria-label={`Loading transaction status ${i + 1}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}