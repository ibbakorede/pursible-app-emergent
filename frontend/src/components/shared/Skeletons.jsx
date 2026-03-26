/**
 * Skeleton loading components for better UX
 */

export function WalletCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-muted rounded mb-1" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
      <div className="h-6 w-32 bg-muted rounded mb-2" />
      <div className="h-3 w-20 bg-muted rounded" />
    </div>
  );
}

export function TransactionSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-muted" />
      <div className="flex-1">
        <div className="h-4 w-32 bg-muted rounded mb-1" />
        <div className="h-3 w-24 bg-muted rounded" />
      </div>
      <div className="text-right">
        <div className="h-4 w-20 bg-muted rounded mb-1" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-muted" />
        <div>
          <div className="h-5 w-32 bg-muted rounded mb-2" />
          <div className="h-4 w-48 bg-muted rounded" />
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded mb-6" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-muted rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function ConverterSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 animate-pulse">
      <div className="h-4 w-24 bg-muted rounded mb-4" />
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="h-3 w-12 bg-muted rounded mb-2" />
          <div className="flex items-center gap-3">
            <div className="h-8 flex-1 bg-muted rounded" />
            <div className="h-10 w-20 bg-muted rounded-lg" />
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-10 h-10 rounded-full bg-muted" />
        </div>
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="h-3 w-8 bg-muted rounded mb-2" />
          <div className="flex items-center gap-3">
            <div className="h-8 flex-1 bg-muted rounded" />
            <div className="h-10 w-20 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
