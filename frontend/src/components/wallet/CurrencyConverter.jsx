import { useState, useMemo } from 'react';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { ArrowRightLeft } from 'lucide-react';

export default function CurrencyConverter({ walletData, rateMap }) {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');

  const getRate = (from, to) => {
    if (from === to) return 1;
    const direct = rateMap[`${from}->${to}`];
    if (direct) return direct;
    const toUSD = rateMap[`${from}->USD`] || (from === 'USD' ? 1 : null);
    const fromUSD = rateMap[`USD->${to}`] || (to === 'USD' ? 1 : null);
    if (toUSD && fromUSD) return toUSD * fromUSD;
    return null;
  };

  const fromWallet = walletData.find(w => w.currency === fromCurrency);
  const fromBalance = fromWallet?.available_balance || 0;
  const rate = getRate(fromCurrency, toCurrency);
  const convertedAmount = rate !== null ? fromBalance * rate : null;

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const availableCurrencies = ['USD', 'USDC', 'USDT', 'NGN'];

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Currency Converter</p>

      <div className="space-y-3">
        {/* From */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block font-medium">From</label>
          <select
            value={fromCurrency}
            onChange={e => setFromCurrency(e.target.value)}
            className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {availableCurrencies.map(c => (
              <option key={c} value={c}>{c} - {CURRENCIES[c]?.name}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-2">
            Balance: {formatCurrency(fromBalance, fromCurrency)}
          </p>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            onClick={swapCurrencies}
            className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 text-primary" />
          </button>
        </div>

        {/* To */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block font-medium">To</label>
          <select
            value={toCurrency}
            onChange={e => setToCurrency(e.target.value)}
            className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {availableCurrencies.map(c => (
              <option key={c} value={c}>{c} - {CURRENCIES[c]?.name}</option>
            ))}
          </select>
        </div>

        {/* Result */}
        {rate !== null ? (
          <div className="bg-muted/50 rounded-lg p-3.5 mt-4">
            <p className="text-xs text-muted-foreground mb-2">Estimated value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(convertedAmount, toCurrency)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Rate: 1 {fromCurrency} = {rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {toCurrency}
            </p>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 mt-4">
            <p className="text-xs text-red-600">No rate available for this currency pair</p>
          </div>
        )}
      </div>
    </div>
  );
}