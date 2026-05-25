/**
 * ConversionSuccess - Success confirmation for conversions
 * Features: Currency badge pair, transaction reference, view receipt CTA
 */
import { Button } from '@/components/ui/button';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency } from '@/lib/currencies';
import { Check, Zap, ArrowRight, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ConversionSuccess({
  fromCurrency,
  toCurrency,
  amount,
  receiveAmount,
  rate,
  transaction,
  onNewSwap
}) {
  const navigate = useNavigate();
  const numAmount = Number(amount) || 0;
  
  // Get transaction details
  const txId = transaction?.id;
  const txRef = transaction?.referenceId;

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

        {/* Conversion summary card */}
        <div className="w-full bg-card border border-border rounded-2xl p-5 mb-4">
          {/* Currency badge pair - 40px circles with olive arrow */}
          <div className="flex items-center justify-center gap-3 mb-4 pb-4 border-b border-border">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#1a5fb4' }}
            >
              <CurrencyIcon currency={fromCurrency} size="sm" />
            </div>
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(122,140,84,0.2)' }}
            >
              <ArrowRight className="w-3 h-3" style={{ color: '#7A8C54' }} />
            </div>
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: '#26a269' }}
            >
              <CurrencyIcon currency={toCurrency} size="sm" />
            </div>
          </div>
          
          {/* Amount display */}
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
          
          {/* Rate and reference */}
          <div className="border-t border-border pt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Rate: 1 {fromCurrency} = {rate.toLocaleString()} {toCurrency}
            </p>
            {txRef && (
              <p className="text-xs text-muted-foreground font-mono">
                Ref: {txRef}
              </p>
            )}
          </div>
        </div>

        {/* View receipt button */}
        {txId && (
          <button
            onClick={() => navigate(`/receipt/${txId}`)}
            className="w-full flex items-center justify-center gap-2 py-3 mb-4 rounded-xl transition-colors hover:bg-white/5"
            style={{
              background: 'transparent',
              border: '0.5px solid rgba(255,255,255,0.12)'
            }}
            data-testid="view-receipt-btn"
          >
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">View receipt</span>
          </button>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl h-11" 
            onClick={onNewSwap}
            data-testid="new-swap-btn"
          >
            New Swap
          </Button>
          <Button 
            className="flex-1 rounded-xl h-11" 
            onClick={() => navigate('/wallet')}
            data-testid="done-btn"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
