import { useMemo, useState } from 'react';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { TrendingUp, RefreshCw } from 'lucide-react';

const PRIMARY_CURRENCIES = ['USD', 'USDC', 'USDT', 'NGN'];

export default function PortfolioSummary({ walletData, rates, lastUpdated, onRefresh, isRefreshing, hideBalance }) {
  const [primaryCurrency, setPrimaryCurrency] = useState('USD');

  // Build a rate map: "FROM->TO" => rate
  const rateMap = useMemo(() => {
    const map = {};
    (rates || []).forEach(r => { map[`${r.from_currency}->${r.to_currency}`] = r.rate; });
    return map;
  }, [rates]);

  // Convert any amount to primary currency
  const convertTo = (amount, from, to) => {
    if (from === to) return amount;
    const direct = rateMap[`${from}->${to}`];
    if (direct) return amount * direct;
    // Try via USD as bridge
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

  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 opacity-80" />
          <span className="text-sm font-medium opacity-80">Total Portfolio Value</span>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1 rounded-full opacity-70 hover:opacity-100 transition-opacity"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <p className="text-3xl font-bold mt-2 mb-4">
        {hideBalance ? '••••••••' : formatCurrency(totalInPrimary, primaryCurrency)}
      </p>

      {/* Currency toggle */}
      <div className="flex gap-1.5 mb-4">
        {PRIMARY_CURRENCIES.map(c => (
          <button
            key={c}
            onClick={() => setPrimaryCurrency(c)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              primaryCurrency === c
                ? 'bg-white text-primary'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Per-wallet breakdown */}
      <div className="space-y-2">
        {walletData.map(w => {
          const converted = convertTo(w.available_balance, w.currency, primaryCurrency);
          const pct = totalInPrimary > 0 && converted !== null
            ? Math.round((converted / totalInPrimary) * 100)
            : 0;
          return (
            <div key={w.currency}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="opacity-80 flex items-center gap-1">
                  {CURRENCIES[w.currency]?.flag} {w.currency}
                </span>
                <span className="font-medium">
                  {hideBalance ? '••••' : formatCurrency(w.available_balance, w.currency)}
                  {!hideBalance && w.currency !== primaryCurrency && converted !== null && (
                    <span className="opacity-60 ml-1">≈ {formatCurrency(converted, primaryCurrency)}</span>
                  )}
                </span>
              </div>
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white/70 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {lastUpdated && (
        <p className="text-xs opacity-50 mt-3">
          Rates updated {lastUpdated}
        </p>
      )}
    </div>
  );
}