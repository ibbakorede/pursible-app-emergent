/**
 * ConversionConfirm - Confirmation step for conversions
 */
import { Button } from '@/components/ui/button';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency } from '@/lib/currencies';
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export default function ConversionConfirm({
  fromCurrency,
  toCurrency,
  amount,
  rate,
  fee,
  receiveAmount,
  onBack,
  onConfirm,
  isSubmitting
}) {
  const numAmount = Number(amount) || 0;
  const feeAmount = (numAmount * fee) / 100;
  const netAmount = numAmount - feeAmount;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Confirm Conversion</h1>
            <p className="text-xs text-muted-foreground">Review the details below</p>
          </div>
        </div>

        {/* Conversion visual */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <CurrencyIcon currency={fromCurrency} size="lg" />
              <p className="font-bold text-lg mt-2 tabular-nums">{formatCurrency(numAmount, fromCurrency)}</p>
              <p className="text-xs text-muted-foreground">{fromCurrency}</p>
            </div>
            <div className="flex flex-col items-center gap-1 px-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-center flex-1">
              <CurrencyIcon currency={toCurrency} size="lg" />
              <p className="font-bold text-lg mt-2 text-emerald-600 tabular-nums">{formatCurrency(receiveAmount, toCurrency)}</p>
              <p className="text-xs text-muted-foreground">{toCurrency}</p>
            </div>
          </div>
        </div>

        {/* Details breakdown */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/50 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conversion Details</p>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm">Amount to convert</span>
              <span className="text-sm font-semibold tabular-nums">{formatCurrency(numAmount, fromCurrency)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-muted-foreground">Conversion fee ({fee}%)</span>
              <span className="text-sm text-muted-foreground tabular-nums">-{formatCurrency(feeAmount, fromCurrency)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm text-muted-foreground">Net amount</span>
              <span className="text-sm text-muted-foreground tabular-nums">{formatCurrency(netAmount, fromCurrency)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm">Exchange rate</span>
              <span className="text-sm font-semibold tabular-nums">1 {fromCurrency} = {rate.toLocaleString()} {toCurrency}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5 bg-emerald-50/50">
              <span className="text-sm font-semibold">You will receive</span>
              <span className="text-base font-bold text-emerald-600 tabular-nums">{formatCurrency(receiveAmount, toCurrency)}</span>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Instant Conversion</p>
            <p className="text-blue-700 mt-0.5">
              Your wallets will be updated immediately after confirmation.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="w-full py-6 text-base rounded-2xl"
            data-testid="convert-confirm-button"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              'Confirm Conversion'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="w-full py-6 text-base rounded-2xl"
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
