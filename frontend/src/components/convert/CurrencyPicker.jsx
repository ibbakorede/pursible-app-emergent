/**
 * CurrencyPicker - Currency selection view for conversions
 */
import { ArrowLeft, Check } from 'lucide-react';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { ALLOWED_PAIRS } from './convertConstants';

export default function CurrencyPicker({
  pickingFor,
  fromCurrency,
  toCurrency,
  wallets,
  onSelect,
  onClose
}) {
  const validCurrencies = pickingFor === 'from' 
    ? Object.keys(ALLOWED_PAIRS) 
    : ALLOWED_PAIRS[fromCurrency] || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold">
              Select {pickingFor === 'from' ? 'Source' : 'Destination'}
            </h1>
            <p className="text-xs text-muted-foreground">Choose a currency wallet</p>
          </div>
        </div>
        
        <div className="space-y-2">
          {validCurrencies.map(currency => {
            const wallet = wallets.find(w => w.currency === currency);
            const balance = wallet?.available_balance || 0;
            const isSelected = pickingFor === 'from' 
              ? currency === fromCurrency 
              : currency === toCurrency;
            const hasBalance = balance > 0 || pickingFor === 'to';
            
            return (
              <button
                key={currency}
                onClick={() => onSelect(currency)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30'
                }`}
              >
                <CurrencyIcon currency={currency} />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm">{CURRENCIES[currency]?.name}</p>
                  <p className="text-xs text-muted-foreground">{currency}</p>
                </div>
                {pickingFor === 'from' && (
                  <div className="text-right">
                    <p className={`text-sm font-semibold tabular-nums ${!hasBalance ? 'text-muted-foreground' : ''}`}>
                      {formatCurrency(balance, currency)}
                    </p>
                    <p className="text-xs text-muted-foreground">available</p>
                  </div>
                )}
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
