/**
 * SuccessStep - Success confirmation for withdrawals
 */
import { Button } from '@/components/ui/button';
import { Check, Clock, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/currencies';

export default function SuccessStep({
  bank,
  amount,
  txRef,
  onReset
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Success icon */}
      <div className="flex justify-center pt-8">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in duration-300">
          <Check className="w-10 h-10 text-emerald-600" />
        </div>
      </div>

      {/* Success message */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">Withdrawal Initiated!</h2>
        <p className="text-muted-foreground">Your funds are on the way</p>
      </div>

      {/* Amount */}
      <div className="bg-card border border-border rounded-2xl p-5 text-center">
        <p className="text-sm text-muted-foreground mb-1">Amount</p>
        <p className="text-3xl font-bold tabular-nums">{formatCurrency(Number(amount), 'NGN')}</p>
      </div>

      {/* Destination */}
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
          </div>
        </div>
      )}

      {/* Reference */}
      {txRef && (
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 rounded-xl">
          <span className="text-xs text-muted-foreground">Reference</span>
          <span className="text-xs font-mono">{txRef}</span>
        </div>
      )}

      {/* Timeline */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Expected within 1–24 hours</span>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={onReset}
          className="w-full py-6 text-base rounded-2xl bg-purple-600 hover:bg-purple-700"
          data-testid="withdraw-again-button"
        >
          Withdraw Again
        </Button>
        <Link to="/">
          <Button
            variant="outline"
            className="w-full py-6 text-base rounded-2xl"
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
