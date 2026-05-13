/**
 * ConversionInput - Main conversion input form
 */
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import {
  ArrowDown, ArrowLeft, ChevronDown, TrendingUp, RefreshCw, 
  History, Shield, AlertCircle, ArrowDownToLine
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { isValidPair } from './convertConstants';

export default function ConversionInput({
  fromCurrency,
  toCurrency,
  amount,
  setAmount,
  availableBalance,
  rate,
  fee,
  receiveAmount,
  lastUpdated,
  recentTxns,
  onPickFrom,
  onPickTo,
  onSwap,
  onRefreshRates,
  onContinue,
  canProceed
}) {
  const numAmount = Number(amount) || 0;
  const feeAmount = (numAmount * fee) / 100;

  const validationError = useMemo(() => {
    if (numAmount > 0 && numAmount > availableBalance) {
      return `Insufficient ${fromCurrency} balance`;
    }
    return null;
  }, [numAmount, availableBalance, fromCurrency]);

  const canSwap = isValidPair(toCurrency, fromCurrency);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Convert</h1>
            <p className="text-xs text-muted-foreground">Swap between currencies instantly</p>
          </div>
        </div>

        {/* From currency */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">From</span>
            <span className="text-xs text-muted-foreground">
              Balance: {formatCurrency(availableBalance, fromCurrency)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onPickFrom}
              className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
            >
              <CurrencyIcon currency={fromCurrency} size="sm" />
              <span className="font-semibold">{fromCurrency}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              className="flex-1 text-right text-2xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              data-testid="convert-amount-input"
            />
          </div>
          {validationError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span>{validationError}</span>
            </div>
          )}
          {/* Quick percentage buttons */}
          <div className="flex gap-2">
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                onClick={() => setAmount(String((availableBalance * pct / 100).toFixed(6)))}
                className="flex-1 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={onSwap}
            disabled={!canSwap}
            className={`w-10 h-10 rounded-full bg-card border-2 border-border flex items-center justify-center transition-all ${
              canSwap ? 'hover:border-primary hover:bg-primary/5 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* To currency */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">To</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onPickTo}
              className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
            >
              <CurrencyIcon currency={toCurrency} size="sm" />
              <span className="font-semibold">{toCurrency}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex-1 text-right">
              <p className={`text-2xl font-bold tabular-nums ${numAmount > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {numAmount > 0 ? formatCurrency(receiveAmount, toCurrency) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Rate info */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              1 {fromCurrency} = {rate.toLocaleString()} {toCurrency}
            </span>
          </div>
          <button
            onClick={onRefreshRates}
            className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>

        {/* Conversion breakdown */}
        {numAmount > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conversion Breakdown</p>
            </div>
            {[
              { id: 'send', label: 'You send', value: formatCurrency(numAmount, fromCurrency), highlight: false },
              { id: 'fee', label: `Fee (${fee}%)`, value: `-${formatCurrency(feeAmount, fromCurrency)}`, muted: true, highlight: false },
              { id: 'rate', label: 'Exchange rate', value: `1 ${fromCurrency} = ${rate.toLocaleString()} ${toCurrency}`, highlight: false },
              { id: 'receive', label: 'You receive', value: formatCurrency(receiveAmount, toCurrency), highlight: true },
            ].map(({ id, label, value, muted, highlight }) => (
              <div key={id} className={`flex items-center justify-between px-4 py-3.5 border-b border-border last:border-0 ${highlight ? 'bg-emerald-50/50' : ''}`}>
                <span className={`text-sm ${muted ? 'text-muted-foreground' : ''}`}>{label}</span>
                <span className={`text-sm font-semibold tabular-nums ${highlight ? 'text-emerald-600 text-base' : muted ? 'text-muted-foreground' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Info badges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'instant', icon: RefreshCw, label: 'Instant', sub: 'Real-time conversion' },
            { id: 'secure', icon: Shield, label: 'Secure', sub: 'Bank-grade encryption' },
            { id: 'low-fee', icon: TrendingUp, label: `${fee}% fee`, sub: 'Competitive rates' },
          ].map(({ id, icon: Icon, label, sub }) => (
            <div key={id} className="bg-card border border-border rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
            </div>
          ))}
        </div>

        {/* Continue button */}
        <Button
          onClick={onContinue}
          disabled={!canProceed}
          className="w-full py-6 text-base rounded-2xl"
          data-testid="convert-continue-button"
        >
          Review Conversion
        </Button>

        {/* Recent conversions */}
        {recentTxns.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Conversions</p>
              </div>
              <Link to="/transactions" className="text-xs text-primary font-semibold hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-border">
              {recentTxns.slice(0, 3).map(tx => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ArrowDownToLine className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.from_currency} → {tx.to_currency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emerald-600 tabular-nums">
                      +{formatCurrency(tx.to_amount, tx.to_currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
