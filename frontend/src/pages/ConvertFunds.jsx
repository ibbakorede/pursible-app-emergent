import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { triggerHaptic } from '@/lib/haptics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import {
  ArrowDown, ArrowLeft, Check, Loader2, Zap, ChevronDown, ArrowRight,
  TrendingUp, RefreshCw, History, Shield, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useNavigate, Link } from 'react-router-dom';

const ALLOWED_PAIRS = {
  USD: ['USDT', 'NGN'],
  USDT: ['NGN'],
  USDC: ['NGN'],
};

const SUPPORTED = ['USD', 'USDC', 'USDT', 'NGN'];

export default function ConvertFunds() {
  const { user, isLoadingAuth } = useAuth();
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('input');
  const [pickingFor, setPickingFor] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: wallets = [], isLoading: loadingWallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => base44.entities.Wallet.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: rates = [], refetch: refetchRates, dataUpdatedAt } = useQuery({
    queryKey: ['rates'],
    queryFn: () => base44.entities.ConversionRate.list(),
    refetchInterval: 30000,
  });

  const { data: recentTxns = [] } = useQuery({
    queryKey: ['conv-transactions', user?.email],
    queryFn: () => base44.entities.Transaction.filter({ user_email: user?.email, type: 'conversion' }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const rateMap = useMemo(() => {
    const map = {};
    rates.forEach(r => { map[`${r.from_currency}->${r.to_currency}`] = r; });
    return map;
  }, [rates]);

  const currentRate = rateMap[`${fromCurrency}->${toCurrency}`];
  const rate = currentRate?.rate || 1;
  const fee = currentRate?.fee_percentage ?? 0.5;
  const numAmount = Number(amount) || 0;
  const feeAmount = (numAmount * fee) / 100;
  const netAmount = numAmount - feeAmount;
  const receiveAmount = netAmount * rate;

  const sourceWallet = wallets.find(w => w.currency === fromCurrency);
  const availableBalance = sourceWallet?.available_balance || 0;
  const canProceed = numAmount > 0 && numAmount <= availableBalance && fromCurrency !== toCurrency && currentRate;

  const swapCurrencies = () => {
    const newFrom = toCurrency;
    const newTo = fromCurrency;
    // Only swap if the pair is allowed
    if (ALLOWED_PAIRS[newFrom]?.includes(newTo)) {
      triggerHaptic('medium');
      setFromCurrency(newFrom);
      setToCurrency(newTo);
      setAmount('');
    }
  };

  const createConversion = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('swapCurrency', {
        fromCurrency,
        toCurrency,
        amount: numAmount,
        confirmed: true,
      });
      // KYC gate: function returns kycBlocked when user is not verified
      if (result.kycBlocked) {
        navigate('/kyc');
        throw new Error(result.error || 'Identity verification required before swapping currencies.');
      }
      if (!result.success) throw new Error(result.error || 'Swap failed. Please try again.');
      return result;
    },
    onMutate: async () => {
      // Optimistically update wallets
      await queryClient.cancelQueries({ queryKey: ['wallets'] });
      const previousWallets = queryClient.getQueryData(['wallets']);
      
      const optimisticWallets = wallets.map(w => {
        if (w.id === sourceWallet?.id) {
          return { ...w, available_balance: w.available_balance - numAmount };
        }
        if (w.currency === toCurrency) {
          return { ...w, available_balance: w.available_balance + receiveAmount };
        }
        return w;
      });
      
      queryClient.setQueryData(['wallets'], optimisticWallets);
      return { previousWallets };
    },
    onSuccess: () => {
      triggerHaptic('success');
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setStep('success');
    },
    onError: (err, vars, context) => {
       if (context?.previousWallets) {
         queryClient.setQueryData(['wallets'], context.previousWallets);
         toast.error('Conversion failed. Your wallet balance has been restored.');
       } else {
         toast.error('Conversion failed. Please try again.');
       }
     },
  });

  if (isLoadingAuth || (loadingWallets && !!user?.email)) return <LoadingSpinner />;

  // ── Currency picker ───────────────────────────────────────────────────────
  if (pickingFor) {
    let validCurrencies = [];
    if (pickingFor === 'from') {
      validCurrencies = Object.keys(ALLOWED_PAIRS);
    } else {
      validCurrencies = ALLOWED_PAIRS[fromCurrency] || [];
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setPickingFor(null)} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Select {pickingFor === 'from' ? 'Source' : 'Destination'}</h1>
              <p className="text-xs text-muted-foreground">Choose a currency wallet</p>
            </div>
          </div>
          <div className="space-y-2">
            {validCurrencies.map(c => {
              const w = wallets.find(w => w.currency === c);
              const bal = w?.available_balance || 0;
              const isSelected = pickingFor === 'from' ? c === fromCurrency : c === toCurrency;
              const hasBalance = bal > 0 || pickingFor === 'to';
              return (
                <button
                  key={c}
                  onClick={() => {
                    if (pickingFor === 'from') setFromCurrency(c);
                    else setToCurrency(c);
                    setAmount('');
                    setPickingFor(null);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30'}`}
                >
                  <CurrencyIcon currency={c} />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">{CURRENCIES[c]?.name}</p>
                    <p className="text-xs text-muted-foreground">{c}</p>
                  </div>
                  {pickingFor === 'from' && (
                    <div className="text-right">
                      <p className={`text-sm font-semibold tabular-nums ${!hasBalance ? 'text-muted-foreground' : ''}`}>
                        {formatCurrency(bal, c)}
                      </p>
                      <p className="text-xs text-muted-foreground">available</p>
                    </div>
                  )}
                  {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-12 h-12 text-emerald-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-1">Swap Complete!</h2>
          <p className="text-muted-foreground text-sm mb-6">Your wallets have been updated instantly</p>

          <div className="w-full bg-card border border-border rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <CurrencyIcon currency={fromCurrency} size="md" />
                <p className="font-bold mt-2">{formatCurrency(numAmount, fromCurrency)}</p>
                <p className="text-xs text-muted-foreground">{fromCurrency}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-center flex-1">
                <CurrencyIcon currency={toCurrency} size="md" />
                <p className="font-bold mt-2 text-emerald-600">{formatCurrency(receiveAmount, toCurrency)}</p>
                <p className="text-xs text-muted-foreground">{toCurrency}</p>
              </div>
            </div>
            <div className="border-t border-border pt-3 text-center">
              <p className="text-xs text-muted-foreground">Rate: 1 {fromCurrency} = {rate.toLocaleString()} {toCurrency}</p>
            </div>
          </div>

          <div className="flex gap-3 w-full mt-4">
            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => { setStep('input'); setAmount(''); }}>
              New Swap
            </Button>
            <Button className="flex-1 rounded-xl h-11" onClick={() => navigate('/wallet')}>
              Back to Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirm ───────────────────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('input')} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Review Swap</h1>
              <p className="text-xs text-muted-foreground">Confirm your conversion details</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary via-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs opacity-70 mb-3">You send</p>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold">{CURRENCIES[fromCurrency]?.flag}</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(numAmount, fromCurrency)}</p>
                <p className="text-xs opacity-60 mt-0.5">{fromCurrency}</p>
              </div>
              <div className="flex flex-col items-center gap-2 px-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs opacity-70 mb-3">You receive</p>
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold">{CURRENCIES[toCurrency]?.flag}</span>
                </div>
                <p className="text-xl font-bold">{formatCurrency(receiveAmount, toCurrency)}</p>
                <p className="text-xs opacity-60 mt-0.5">{toCurrency}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conversion Breakdown</p>
            </div>
            {[
              ['You send', formatCurrency(numAmount, fromCurrency), false, false],
              [`Fee (${fee}%)`, `-${formatCurrency(feeAmount, fromCurrency)}`, true, false],
              ['Exchange rate', `1 ${fromCurrency} = ${rate.toLocaleString()} ${toCurrency}`, false, false],
              ['You receive', formatCurrency(receiveAmount, toCurrency), false, true],
            ].map(([label, value, muted, highlight], i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-3.5 border-b border-border last:border-0 ${highlight ? 'bg-emerald-50/50' : ''}`}>
                <span className={`text-sm ${muted ? 'text-muted-foreground' : ''}`}>{label}</span>
                <span className={`text-sm font-semibold tabular-nums ${highlight ? 'text-emerald-600 text-base' : muted ? 'text-muted-foreground' : ''}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/60 rounded-xl px-4 py-3">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
            This swap is instant. Your balances will update immediately upon confirmation.
          </div>

          <Button
            className="w-full rounded-xl h-12 text-base"
            onClick={() => {
              triggerHaptic('confirm');
              createConversion.mutate();
            }}
            disabled={createConversion.isPending}
          >
            {createConversion.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
              : <><Zap className="w-4 h-4 mr-2" /> Confirm Swap</>}
          </Button>
        </div>
      </div>
    );
  }

  // ── Main input screen ─────────────────────────────────────────────────────
  const allRatePairs = rates.filter(r => r.is_active);
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Swap Currencies</h1>
            <p className="text-xs text-muted-foreground">Convert between your wallets instantly</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/calculator" className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors">
              Calculator
            </Link>
          </div>
        </div>

        {/* Wallet balances strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {SUPPORTED.map(c => {
            const w = wallets.find(ww => ww.currency === c);
            const bal = w?.available_balance || 0;
            return (
              <div key={c} className={`flex-shrink-0 bg-card border rounded-xl px-3 py-2.5 min-w-[120px] ${c === fromCurrency ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm">{CURRENCIES[c]?.flag}</span>
                  <span className="text-xs font-semibold">{c}</span>
                </div>
                <p className={`text-sm font-bold tabular-nums ${bal === 0 ? 'text-muted-foreground' : ''}`}>
                  {formatCurrency(bal, c)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Swap card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* From */}
          <div className="p-4 space-y-3">
            <label className="text-xs text-muted-foreground font-medium">From</label>
            <button
              onClick={() => setPickingFor('from')}
              className="flex items-center gap-3 w-full bg-muted/50 hover:bg-muted rounded-xl p-3 transition-colors"
            >
              <CurrencyIcon currency={fromCurrency} />
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{CURRENCIES[fromCurrency]?.name}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(availableBalance, fromCurrency)} available</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-lg">
                {CURRENCIES[fromCurrency]?.symbol}
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="rounded-xl text-2xl h-16 pl-10 font-bold border-2 focus-visible:border-primary focus-visible:ring-0 [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
              />
              {availableBalance > 0 && (
                <button
                  onClick={() => setAmount(String(availableBalance))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  MAX
                </button>
              )}
            </div>
            {numAmount > availableBalance && numAmount > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Exceeds available balance
              </p>
            )}
          </div>

          {/* Swap divider */}
          <div className="flex items-center gap-3 px-4 py-1">
            <div className="flex-1 h-px bg-border" />
            <button
              onClick={swapCurrencies}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* To */}
          <div className="p-4 space-y-3">
            <label className="text-xs text-muted-foreground font-medium">To</label>
            <button
              onClick={() => setPickingFor('to')}
              className="flex items-center gap-3 w-full bg-muted/50 hover:bg-muted rounded-xl p-3 transition-colors"
            >
              <CurrencyIcon currency={toCurrency} />
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{CURRENCIES[toCurrency]?.name}</p>
                <p className="text-xs text-muted-foreground">Destination wallet</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="bg-muted/50 border border-border rounded-xl px-4 h-16 flex items-center">
              <p className={`text-2xl font-bold tabular-nums ${numAmount > 0 && canProceed ? 'text-foreground' : 'text-muted-foreground'}`}>
                {CURRENCIES[toCurrency]?.symbol}{numAmount > 0 && canProceed ? receiveAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Rate info */}
        {currentRate ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                1 {fromCurrency} = {rate.toLocaleString()} {toCurrency}
              </span>
              <span className="text-xs text-emerald-600 opacity-70">· {fee}% fee</span>
            </div>
            <button onClick={() => refetchRates()} className="text-emerald-600 hover:text-emerald-700 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : fromCurrency !== toCurrency ? (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">No rate available for this currency pair</span>
          </div>
        ) : null}

        {/* Live market rates */}
        {allRatePairs.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Live Rates</p>
              </div>
              {lastUpdated && <p className="text-xs text-muted-foreground">Updated {lastUpdated}</p>}
            </div>
            <div className="divide-y divide-border">
              {allRatePairs
                .filter(r => ALLOWED_PAIRS[r.from_currency]?.includes(r.to_currency))
                .map(r => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setFromCurrency(r.from_currency);
                      setToCurrency(r.to_currency);
                      setAmount('');
                    }}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        <div className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-sm z-10">
                          {CURRENCIES[r.from_currency]?.flag}
                        </div>
                        <div className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-sm">
                          {CURRENCIES[r.to_currency]?.flag}
                        </div>
                      </div>
                      <span className="text-sm font-medium">{r.from_currency} → {r.to_currency}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{r.rate.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{r.fee_percentage}% fee</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Recent conversions */}
        {recentTxns.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border bg-muted/30 flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Recent Swaps</p>
            </div>
            <div className="divide-y divide-border">
              {recentTxns.slice(0, 3).map(tx => (
                <div key={tx.id} className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5">
                      <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-sm z-10">
                        {CURRENCIES[tx.from_currency]?.flag || '💱'}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-sm">
                        {CURRENCIES[tx.to_currency]?.flag || '💱'}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(tx.from_amount, tx.from_currency)} → {formatCurrency(tx.to_amount, tx.to_currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Button
          className="w-full rounded-xl h-12 text-base font-semibold"
          disabled={!canProceed}
          onClick={() => {
            triggerHaptic('light');
            setStep('confirm');
          }}
        >
          Review Swap <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}