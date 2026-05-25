/**
 * ConversionInput - Main conversion input form (refactored)
 */
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowLeft, TrendingUp, RefreshCw } from 'lucide-react';
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

        {/* Swap button - 42x42px, 14px border-radius, brand colors */}
        <div className="flex justify-center -my-2 relative z-10">
          <button
            onClick={onSwap}
            disabled={!canSwap}
            className={`flex items-center justify-center transition-all ${
              canSwap ? 'hover:opacity-80 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '14px',
              background: '#1a1a14',
              border: '1px solid rgba(122,140,84,0.4)'
            }}
          >
            <ArrowUpDown className="w-5 h-5" style={{ color: '#7A8C54' }} />
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

        {/* Rate info with manual refresh icon button */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              1 {fromCurrency} = {rate.toLocaleString()} {toCurrency}
            </span>
            <button
              onClick={onRefreshRates}
              className="p-1 rounded hover:bg-muted/50 transition-colors"
              title="Refresh rate"
              data-testid="refresh-rate-btn"
            >
              <RefreshCw className="w-3.5 h-3.5" style={{ color: '#7A8C54' }} />
            </button>
          </div>
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

        {/* Reassurance text */}
        <p 
          className="text-center"
          style={{ 
            fontSize: '10px', 
            color: 'rgba(255,255,255,0.35)' 
          }}
        >
          Rate locks at the moment of confirmation
        </p>

        {/* Recent conversions */}
        <RecentConversions transactions={recentTxns} />
      </div>
    </div>
  );
}
