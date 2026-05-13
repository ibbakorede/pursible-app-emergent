/**
 * ConfirmStep - Confirmation step for withdrawals
 */
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Check, Loader2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/currencies';
import { WITHDRAWAL_FEE } from './withdrawConstants';

export default function ConfirmStep({
  bank,
  amount,
  onBack,
  onConfirm,
  isSubmitting
}) {
  const numAmount = Number(amount) || 0;
  const youReceive = numAmount - WITHDRAWAL_FEE;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Confirm Withdrawal</h1>
          <p className="text-sm text-muted-foreground">Review the details below</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-5 text-center border-b border-border">
          <p className="text-sm text-muted-foreground mb-1">You will receive</p>
          <p className="text-4xl font-bold text-emerald-600 tabular-nums">
            {formatCurrency(youReceive, 'NGN')}
          </p>
        </div>

        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="text-sm font-semibold tabular-nums">{formatCurrency(numAmount, 'NGN')}</span>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm text-muted-foreground">Processing fee</span>
            <span className="text-sm tabular-nums">-{formatCurrency(WITHDRAWAL_FEE, 'NGN')}</span>
          </div>
        </div>
      </div>

      {/* Bank details */}
      {bank && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{bank.bank_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{bank.account_number}</p>
              <p className="text-xs text-muted-foreground">{bank.account_name}</p>
            </div>
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      )}

      {/* Security note */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-800">
          <p className="font-semibold">Secure Transaction</p>
          <p className="text-emerald-700 mt-0.5">
            Funds typically arrive within 1–24 hours during business days.
          </p>
        </div>
      </div>

      {/* Confirm button */}
      <Button
        onClick={onConfirm}
        disabled={isSubmitting}
        className="w-full py-6 text-base rounded-2xl bg-purple-600 hover:bg-purple-700"
        data-testid="withdraw-confirm-button"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Confirm Withdrawal'
        )}
      </Button>
    </div>
  );
}
