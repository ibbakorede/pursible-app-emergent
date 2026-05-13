/**
 * ConversionBreakdown - Shows fee breakdown and conversion details
 */
import { formatCurrency } from '@/lib/currencies';
import { Shield } from 'lucide-react';

export default function ConversionBreakdown({
  fromCurrency,
  toCurrency,
  amount,
  fee,
  feeAmount,
  receiveAmount
}) {
  const numAmount = Number(amount) || 0;

  if (numAmount <= 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <span className="text-sm font-semibold">Conversion Details</span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">You pay</span>
          <span className="font-semibold">{formatCurrency(numAmount, fromCurrency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Fee ({fee}%)</span>
          <span className="text-amber-600">-{formatCurrency(feeAmount, fromCurrency)}</span>
        </div>
        <div className="border-t border-border my-2" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">You receive</span>
          <span className="font-bold text-emerald-600">{formatCurrency(receiveAmount, toCurrency)}</span>
        </div>
      </div>
    </div>
  );
}

export function SecurityBadge() {
  return (
    <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground">
      <Shield className="w-4 h-4 text-emerald-600" />
      <span>Instant settlement • No hidden fees</span>
    </div>
  );
}
