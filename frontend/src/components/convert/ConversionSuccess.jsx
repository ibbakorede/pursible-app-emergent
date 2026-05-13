/**
 * ConversionSuccess - Success confirmation for conversions
 */
import { Button } from '@/components/ui/button';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency } from '@/lib/currencies';
import { Check, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ConversionSuccess({
  fromCurrency,
  toCurrency,
  amount,
  receiveAmount,
  rate,
  onNewSwap
}) {
  const navigate = useNavigate();
  const numAmount = Number(amount) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-12 pb-10 flex flex-col items-center text-center">
        {/* Success icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-in zoom-in duration-300">
            <Check className="w-12 h-12 text-emerald-600" />
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Success message */}
        <h2 className="text-2xl font-bold mb-1">Swap Complete!</h2>
        <p className="text-muted-foreground text-sm mb-6">Your wallets have been updated instantly</p>

        {/* Conversion summary */}
        <div className="w-full bg-card border border-border rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center flex-1">
              <CurrencyIcon currency={fromCurrency} size="md" />
              <p className="font-bold mt-2 tabular-nums">{formatCurrency(numAmount, fromCurrency)}</p>
              <p className="text-xs text-muted-foreground">{fromCurrency}</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-center flex-1">
              <CurrencyIcon currency={toCurrency} size="md" />
              <p className="font-bold mt-2 text-emerald-600 tabular-nums">{formatCurrency(receiveAmount, toCurrency)}</p>
              <p className="text-xs text-muted-foreground">{toCurrency}</p>
            </div>
          </div>
          <div className="border-t border-border pt-3 text-center">
            <p className="text-xs text-muted-foreground">
              Rate: 1 {fromCurrency} = {rate.toLocaleString()} {toCurrency}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full mt-4">
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl h-11" 
            onClick={onNewSwap}
          >
            New Swap
          </Button>
          <Button 
            className="flex-1 rounded-xl h-11" 
            onClick={() => navigate('/wallet')}
          >
            Back to Wallet
          </Button>
        </div>
      </div>
    </div>
  );
}
