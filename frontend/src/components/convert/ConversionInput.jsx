/**
 * ConversionInput - Main conversion input form (refactored)
 */
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowLeft, TrendingUp, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isValidPair } from './convertConstants';
import CurrencyAmountInput from './CurrencyAmountInput';
import ConversionBreakdown, { SecurityBadge } from './ConversionBreakdown';
import RecentConversions from './RecentConversions';

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
        <CurrencyAmountInput
          label="From"
          currency={fromCurrency}
          balance={availableBalance}
          amount={amount}
          onAmountChange={setAmount}
          onCurrencyClick={onPickFrom}
          validationError={validationError}
          testId="convert-amount-input"
        />

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
        <CurrencyAmountInput
          label="To"
          currency={toCurrency}
          amount={receiveAmount}
          onCurrencyClick={onPickTo}
          readOnly
        />

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
        <ConversionBreakdown
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
          amount={amount}
          fee={fee}
          feeAmount={feeAmount}
          receiveAmount={receiveAmount}
        />

        {/* Security badge */}
        <SecurityBadge />

        {/* Continue button */}
        <Button
          onClick={onContinue}
          disabled={!canProceed || !!validationError}
          className="w-full h-14 rounded-xl text-lg font-semibold"
          data-testid="convert-continue-btn"
        >
          Continue
        </Button>

        {/* Recent conversions */}
        <RecentConversions transactions={recentTxns} />
      </div>
    </div>
  );
}
