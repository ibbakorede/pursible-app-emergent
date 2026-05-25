/**
 * CurrencyAmountInput - Reusable currency amount input with balance display
 */
import { Input } from '@/components/ui/input';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency } from '@/lib/currencies';
import { ChevronDown, AlertCircle } from 'lucide-react';

export default function CurrencyAmountInput({
  label,
  currency,
  balance,
  amount,
  onAmountChange,
  onCurrencyClick,
  validationError,
  showQuickButtons = true,
  readOnly = false,
  testId
}) {
  const numAmount = Number(amount) || 0;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        {balance !== undefined && (
          <span className="text-xs text-muted-foreground">
            Balance: {formatCurrency(balance, currency)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onCurrencyClick}
          className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
        >
          <CurrencyIcon currency={currency} size="sm" />
          <span className="font-semibold">{currency}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
        {readOnly ? (
          <div className="flex-1 text-right">
            <p className={`text-2xl font-bold tabular-nums ${numAmount > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
              {numAmount > 0 ? formatCurrency(numAmount, currency) : '0.00'}
            </p>
          </div>
        ) : (
          <Input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            className="flex-1 text-right text-2xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.]/g, ''))}
            data-testid={testId}
          />
        )}
      </div>
      {validationError && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span>{validationError}</span>
        </div>
      )}
      {/* Percentage chips: 25%, 50%, Max */}
      {showQuickButtons && balance > 0 && !readOnly && (
        <div className="flex gap-2">
          {[
            { label: '25%', value: 0.25 },
            { label: '50%', value: 0.50 },
            { label: 'Max', value: 1.0 }
          ].map(({ label, value }) => (
            <button
              key={label}
              onClick={() => onAmountChange(String((balance * value).toFixed(6)))}
              className="px-2 py-0.5 text-[10px] font-semibold rounded-[6px] transition-colors hover:opacity-80"
              style={{
                background: 'rgba(122,140,84,0.15)',
                color: '#97C459'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
