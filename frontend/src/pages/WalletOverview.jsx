import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import RefreshableList from '@/components/shared/RefreshableList';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { WalletPageSkeleton } from '@/components/shared/SkeletonLoaders';
import WalletCard from '@/components/wallet/WalletCard';
import CurrencyConverter from '@/components/wallet/CurrencyConverter';
import { Eye, EyeOff, RefreshCw, ArrowDownLeft, ArrowUpRight, RefreshCcw, TrendingUp } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useBalanceAnnouncement } from '@/components/shared/AriaLiveRegions';

const ALL_CURRENCIES = ['USD', 'USDC', 'USDT', 'NGN'];
const PRIMARY_CURRENCIES = ['USD', 'NGN'];

export default function WalletOverview() {
  const [user, setUser] = useState(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [primaryCurrency, setPrimaryCurrency] = useState('USD');
  const [prevTotalInPrimary, setPrevTotalInPrimary] = useState(null);
  const queryClient = useQueryClient();
  const announceBalance = useBalanceAnnouncement();
  const { isPulling } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['wallets', 'conversion-rates'] });
  });

  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: wallets = [], isLoading, refetch: refetchWallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => base44.entities.Wallet.filter({ user_email: user?.email }),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const { data: rates = [], isRefetching: isRefreshingRates, refetch: refetchRates } = useQuery({
    queryKey: ['conversion-rates'],
    queryFn: () => base44.entities.ConversionRate.filter({ is_active: true }),
    refetchInterval: 60000,
  });

  const walletData = ALL_CURRENCIES.map(c => {
    const w = wallets.find(w => w.currency === c);
    return { currency: c, available_balance: w?.available_balance || 0, pending_balance: w?.pending_balance || 0 };
  });

  // Build rate map for conversions
  const rateMap = useMemo(() => {
    const map = {};
    rates.forEach(r => { map[`${r.from_currency}->${r.to_currency}`] = r.rate; });
    return map;
  }, [rates]);

  const convertTo = (amount, from, to) => {
    if (from === to) return amount;
    const direct = rateMap[`${from}->${to}`];
    if (direct) return amount * direct;
    const toUSD = rateMap[`${from}->USD`] || (from === 'USD' ? 1 : null);
    const fromUSD = rateMap[`USD->${to}`] || (to === 'USD' ? 1 : null);
    if (toUSD && fromUSD) return amount * toUSD * fromUSD;
    return null;
  };

  const totalInPrimary = useMemo(() => {
    return walletData.reduce((sum, w) => {
      if (w.available_balance === 0) return sum;
      const converted = convertTo(w.available_balance, w.currency, primaryCurrency);
      return converted !== null ? sum + converted : sum;
    }, 0);
  }, [walletData, primaryCurrency, rateMap]);

  // Sync live balances from providers in the background; invalidate wallets on success.
  const { data: balanceSync, refetch: refetchBalance } = useQuery({
    queryKey: ['balance-sync', user?.email],
    queryFn: () => base44.functions.invoke('getBalance', {}),
    enabled: !!user?.email,
    staleTime: 30000,
    refetchInterval: 60000,
  });
  useEffect(() => {
    if (balanceSync?.success) queryClient.invalidateQueries({ queryKey: ['wallets'] });
  }, [balanceSync, queryClient]);

  const handleRefresh = () => { refetchBalance(); refetchWallets(); refetchRates(); };

  // Announce balance changes
  useEffect(() => {
    if (totalInPrimary !== null && prevTotalInPrimary !== null && totalInPrimary !== prevTotalInPrimary) {
      announceBalance(primaryCurrency, totalInPrimary.toFixed(2), totalInPrimary - prevTotalInPrimary);
    }
    setPrevTotalInPrimary(totalInPrimary);
  }, [totalInPrimary, primaryCurrency, announceBalance]);

  const lastUpdated = rates.length > 0
    ? format(new Date(Math.max(...rates.map(r => new Date(r.updated_date)))), 'h:mm a')
    : null;

  if (isLoading) return <WalletPageSkeleton />;

  return (
    <RefreshableList queryKey={['wallets', 'conversion-rates']}>
      <div className="px-4 pt-6 pb-10 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Wallets</h1>
        <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Refresh rates"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingRates ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setHideBalance(h => !h)}
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
            >
              {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
      </div>

      {/* Net Worth Hero Card */}
      <div className="bg-gradient-to-br from-primary via-primary to-blue-700 rounded-3xl p-5 text-primary-foreground overflow-hidden relative">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 opacity-80">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Total Net Worth</span>
            </div>
            {/* Currency toggle */}
            <div className="flex gap-1">
              {PRIMARY_CURRENCIES.map(c => (
                <button
                  key={c}
                  onClick={() => setPrimaryCurrency(c)}
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white ${primaryCurrency === c ? 'bg-white text-primary' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  aria-label={`Convert to ${c}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <p className="text-4xl font-bold mt-2 mb-1 tabular-nums tracking-tight">
            {hideBalance ? '••••••••' : formatCurrency(totalInPrimary, primaryCurrency)}
          </p>
          {lastUpdated && <p className="text-xs opacity-50 mb-4">Rates at {lastUpdated}</p>}


        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction to="/wallet/receive" icon={<ArrowDownLeft className="w-5 h-5" />} label="Deposit" color="emerald" />
        <QuickAction to="/withdraw" icon={<ArrowUpRight className="w-5 h-5" />} label="Withdraw" color="purple" />
        <QuickAction to="/convert" icon={<RefreshCcw className="w-5 h-5" />} label="Swap" color="blue" />
      </div>


      {/* Currency converter */}
      <CurrencyConverter walletData={walletData} rateMap={rateMap} />

      {/* Individual wallet cards */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Wallets</p>
        <div className="space-y-3">
          {walletData.map(w => (
            <WalletCard key={w.currency} wallet={w} hideBalance={hideBalance} />
          ))}
        </div>
      </div>
      </div>
    </RefreshableList>
  );
}

function QuickAction({ to, icon, label, color }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  };
  return (
    <Link to={to} className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${colors[color]}`} aria-label={label}>
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </Link>
  );
}