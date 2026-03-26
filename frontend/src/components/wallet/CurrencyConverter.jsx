import { useState } from 'react';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { ArrowRightLeft } from 'lucide-react';

export default function CurrencyConverter({ walletData, rateMap }) {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');

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
  
  const inputAmount = parseFloat(amount) || 0;
  const convertedAmount = rate !== null ? inputAmount * rate : null;

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const useMaxBalance = () => {
    setAmount(fromBalance.toString());
  };

  const availableCurrencies = ['USD', 'USDC', 'USDT', 'NGN'];

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Quick Convert</p>

      <div className="space-y-4">
        {/* From Section */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground font-medium">From</label>
            <button 
              onClick={useMaxBalance}
              className="text-xs text-primary font-medium hover:underline"
            >
              Max: {formatCurrency(fromBalance, fromCurrency)}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Amount Input */}
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              className="flex-1 bg-transparent text-2xl font-bold outline-none placeholder:text-muted-foreground/50 min-w-0"
            />
            
            {/* Currency Select */}
            <select
              value={fromCurrency}
              onChange={e => setFromCurrency(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center -my-1">
          <button
            onClick={swapCurrencies}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors shadow-lg"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* To Section */}
        <div className="bg-muted/50 rounded-xl p-4">
          <label className="text-xs text-muted-foreground font-medium block mb-2">To</label>
          
          <div className="flex items-center gap-3">
            {/* Converted Amount Display */}
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-bold truncate">
                {rate !== null && inputAmount > 0 
                  ? convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '0.00'
                }
              </p>
            </div>
            
            {/* Currency Select */}
            <select
              value={toCurrency}
              onChange={e => setToCurrency(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {availableCurrencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Rate Info */}
        {rate !== null ? (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Exchange Rate</span>
            <span className="font-medium text-foreground">
              1 {fromCurrency} = {rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {toCurrency}
            </span>
          </div>
        ) : (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-xs text-destructive text-center">No rate available for this pair</p>
          </div>
        )}
      </div>
    </div>
  );
}
