/**
 * ConfirmStep - Confirmation step for withdrawals
 * Updated with olive brand colors and dark-mode friendly styling
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
          <p 
            className="text-4xl font-bold tabular-nums"
            style={{ color: '#97C459' }}
          >
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
            <span className="text-sm tabular-nums">−{formatCurrency(WITHDRAWAL_FEE, 'NGN')}</span>
          </div>
        </div>
      </div>

      {/* Bank details */}
      {bank && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(127,119,221,0.18)' }}
            >
              <Building2 className="w-6 h-6" style={{ color: '#AFA9EC' }} />
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

      {/* Security note - olive tinted */}
      <div 
        className="flex items-start gap-3 p-4 rounded-2xl"
        style={{
          background: 'rgba(122,140,84,0.08)',
          border: '0.5px solid rgba(122,140,84,0.3)'
        }}
      >
        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#97C459' }} />
        <div className="text-sm">
          <p className="font-semibold" style={{ color: '#97C459' }}>Secure Transaction</p>
          <p className="mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Funds typically arrive within 1–24 hours during business days.
          </p>
        </div>
      </div>

      {/* Confirm button - olive */}
      <Button
        onClick={onConfirm}
        disabled={isSubmitting}
        className="w-full py-6 text-base rounded-2xl text-white hover:opacity-90 transition-opacity"
        style={{ 
          background: '#5C6B3E',
        }}
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
