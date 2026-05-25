import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import RefreshableList from '@/components/shared/RefreshableList';
import { Bell, Shield, ChevronRight, ArrowDownLeft, ArrowUpRight, RefreshCcw, TrendingUp, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import BalanceCard from '@/components/home/BalanceCard';
import QuickActions from '@/components/home/QuickActions';
import RecentTransactions from '@/components/home/RecentTransactions';
import QuickConverter from '@/components/home/QuickConverter';
import { HomePageSkeleton } from '@/components/shared/SkeletonLoaders';
import { useEffect, useRef } from 'react';
import { formatCurrency } from '@/lib/currencies';
import { useTransactionAnnouncement } from '@/components/shared/AriaLiveRegions';

export default function Home() {
  const prevTransactionsRef = useRef([]);
  const queryClient = useQueryClient();
  const announceTransaction = useTransactionAnnouncement();
  const { isPulling } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['wallets', 'transactions', 'notifications'] });
  });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: wallets = [], isLoading: loadingWallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => base44.entities.Wallet.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.filter({ user_email: user?.email }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const { data: kyc = [] } = useQuery({
    queryKey: ['kyc'],
    queryFn: () => base44.entities.KYCRecord.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email, is_read: false }),
    enabled: !!user?.email,
  });

  // Sync live balances from providers (Bridge, Circle) in the background.
  // getBalance updates the Wallet entities in Base44, then we invalidate the
  // local cache so the UI reflects fresh provider data.
  const { data: balanceSync } = useQuery({
    queryKey: ['balance-sync', user?.email],
    queryFn: () => base44.functions.invoke('getBalance', {}),
    enabled: !!user?.email,
    staleTime: 30000,
    refetchInterval: 60000,
  });
  useEffect(() => {
    if (balanceSync?.success) queryClient.invalidateQueries({ queryKey: ['wallets'] });
  }, [balanceSync, queryClient]);

  const kycRecord = kyc[0];
  const allCurrencies = ['USD', 'USDC', 'USDT', 'NGN'];
  const walletData = allCurrencies.map(c => {
    const w = wallets.find(w => w.currency === c);
    return { currency: c, available_balance: w?.available_balance || 0, pending_balance: w?.pending_balance || 0 };
  });
  const unread = notifications.length;
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  // Announce new transactions
  useEffect(() => {
    if (transactions.length > prevTransactionsRef.current.length) {
      const newTx = transactions[0];
      if (newTx) {
        announceTransaction(
          newTx.type === 'deposit' ? 'Deposit' : newTx.type === 'withdrawal' ? 'Withdrawal' : 'Swap',
          newTx.from_amount || newTx.to_amount,
          newTx.from_currency,
          newTx.status
        );
      }
    }
    prevTransactionsRef.current = transactions;
  }, [transactions, announceTransaction]);

  if (loadingWallets) return <HomePageSkeleton />;

  return (
    <RefreshableList queryKey={['wallets', 'transactions', 'notifications']}>
      <div className="px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Welcome back, {firstName}!</h1>
        </div>
        <Link to="/notifications" className="relative h-11 w-11 flex items-center justify-center rounded-xl bg-card border border-border hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label="View notifications">
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-[10px] text-white font-bold">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
      </div>

      {/* KYC Banner */}
      {(!kycRecord || kycRecord.status !== 'approved') && (
        <Link 
          to="/kyc" 
          className="flex items-center gap-3 p-4 rounded-2xl transition-colors hover:opacity-90"
          style={{
            backgroundColor: 'rgba(122,140,84,0.08)',
            border: '0.5px solid rgba(122,140,84,0.3)',
          }}
        >
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'rgba(122,140,84,0.2)' }}
          >
            <Shield className="w-5 h-5" style={{ color: '#7A8C54' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Complete your verification</p>
            <p className="text-xs text-muted-foreground">Verify identity to unlock all features</p>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: '#7A8C54' }} />
        </Link>
      )}

      <BalanceCard wallets={walletData} />
      <QuickActions />
      <QuickConverter />
      <div className="mt-5">
        <RecentTransactions transactions={transactions} />
      </div>
      </div>
    </RefreshableList>
  );
}