import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { ArrowLeftRight, ArrowLeft, Zap, AlertCircle, ChevronDown, TrendingUp, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SUPPORTED = ['USD', 'USDC', 'USDT', 'NGN'];

export default function CurrencyCalculator() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [pickingFor, setPickingFor] = useState(null);
  const navigate = useNavigate();

  const { data: rates = [], refetch, dataUpdatedAt } = useQuery({
    queryKey: ['rates'],
    queryFn: () => base44.entities.ConversionRate.list(),
    refetchInterval: 30000,
  });

  const rateMap = useMemo(() => {
    const map = {};
    rates.forEach(r => { map[`${r.from_currency}->${r.to_currency}`] = r; });
    return map;
  }, [rates]);

  const currentRate = rateMap[`${fromCurrency}->${toCurrency}`];
  const rate = currentRate?.rate || null;
  const fee = currentRate?.fee_percentage ?? 0.5;
  const numAmount = Number(amount) || 0;
  const feeAmount = (numAmount * fee) / 100;
  const netAmount = numAmount - feeAmount;
  const receiveAmount = rate ? netAmount * rate : null;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  const swap = () => { setFromCurrency(toCurrency); setToCurrency(fromCurrency); setAmount(''); };

  // Memoize filtered currencies for picker
  const filteredCurrencies = useMemo(() => {
    const other = pickingFor === 'from' ? toCurrency : fromCurrency;
    return SUPPORTED.filter(c => c !== other);
  }, [pickingFor, toCurrency, fromCurrency]);

  // Memoize active rates
  const activeRates = useMemo(() => rates.filter(r => r.is_active), [rates]);

  if (pickingFor) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setPickingFor(null)} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-bold">Select {pickingFor === 'from' ? 'Source' : 'Destination'}</h1>
          </div>
          <div className="space-y-2">
            {filteredCurrencies.map(c => {
              const isSelected = pickingFor === 'from' ? c === fromCurrency : c === toCurrency;
              return (
                <button key={c} onClick={() => { if (pickingFor === 'from') setFromCurrency(c); else setToCurrency(c); setAmount(''); setPickingFor(null); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'}`}
                >
                  <CurrencyIcon currency={c} />
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm">{CURRENCIES[c]?.name || c}</p>
                    <p className="text-xs text-muted-foreground">{c}</p>
                  </div>
                  {isSelected && <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-white" /></div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/convert" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Calculator</h1>
              <p className="text-xs text-muted-foreground">Preview rates before converting</p>
            </div>
          </div>
          <button onClick={() => refetch()} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Live rate badge */}
        {currentRate && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-700">Live Rate</span>
            </div>
            <span className="text-sm font-bold text-emerald-800 tabular-nums">1 {fromCurrency} = {rate?.toLocaleString()} {toCurrency}</span>
            {lastUpdated && <span className="text-xs text-emerald-600">{lastUpdated}</span>}
          </div>
        )}

        {/* Calculator card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {/* From */}
          <div className="p-4 space-y-3">
            <label className="text-xs text-muted-foreground font-medium">You send</label>
            <button onClick={() => setPickingFor('from')} className="flex items-center gap-3 w-full bg-muted/50 hover:bg-muted rounded-xl p-3 transition-colors">
              <CurrencyIcon currency={fromCurrency} />
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{CURRENCIES[fromCurrency]?.name || fromCurrency}</p>
                <p className="text-xs text-muted-foreground">{fromCurrency}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xl">
                {CURRENCIES[fromCurrency]?.symbol}
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="rounded-xl text-2xl h-16 pl-10 font-bold border-2 focus-visible:border-primary focus-visible:ring-0"
                inputMode="decimal"
              />
            </div>
          </div>

          {/* Swap */}
          <div className="flex items-center gap-3 px-4 py-1">
            <div className="flex-1 h-px bg-border" />
            <button onClick={swap} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-4 h-4" />
            </button>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* To */}
          <div className="p-4 space-y-3">
            <label className="text-xs text-muted-foreground font-medium">You receive</label>
            <button onClick={() => setPickingFor('to')} className="flex items-center gap-3 w-full bg-muted/50 hover:bg-muted rounded-xl p-3 transition-colors">
              <CurrencyIcon currency={toCurrency} />
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{CURRENCIES[toCurrency]?.name || toCurrency}</p>
                <p className="text-xs text-muted-foreground">{toCurrency}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="bg-muted/50 border border-border rounded-xl px-4 h-16 flex items-center">
              <p className={`text-2xl font-bold tabular-nums ${receiveAmount !== null && numAmount > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {receiveAmount !== null && numAmount > 0 ? formatCurrency(receiveAmount, toCurrency) : '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* No rate warning */}
        {!currentRate && fromCurrency !== toCurrency && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-600">No rate available for this currency pair</span>
          </div>
        )}

        {/* Breakdown */}
        {currentRate && numAmount > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Breakdown</p>
            </div>
            <div className="divide-y divide-border">
              {[
                { label: 'Amount', value: formatCurrency(numAmount, fromCurrency), highlight: false, negative: false },
                { label: `Service fee (${fee}%)`, value: `-${formatCurrency(feeAmount, fromCurrency)}`, highlight: false, negative: true },
                { label: 'Exchange rate', value: `1 ${fromCurrency} = ${rate?.toLocaleString()} ${toCurrency}`, highlight: false, negative: false },
                { label: 'You receive', value: formatCurrency(receiveAmount, toCurrency), highlight: true, negative: false },
              ].map(({ label, value, highlight, negative }) => (
                <div key={label} className={`flex items-center justify-between px-4 py-3.5 ${highlight ? 'bg-emerald-50/50' : ''}`}>
                  <span className={`text-sm ${!highlight ? 'text-muted-foreground' : 'font-semibold'}`}>{label}</span>
                  <span className={`text-sm font-semibold tabular-nums ${highlight ? 'text-emerald-600 text-base' : negative ? 'text-destructive' : ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All rates */}
        {activeRates.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border bg-muted/30 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">All Exchange Rates</p>
            </div>
            <div className="divide-y divide-border">
              {activeRates.map(r => (
                <button key={`${r.from_currency}-${r.to_currency}`}
                  onClick={() => { setFromCurrency(r.from_currency); setToCurrency(r.to_currency); setAmount(''); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-1.5">
                      <div className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-sm z-10">{CURRENCIES[r.from_currency]?.flag}</div>
                      <div className="w-7 h-7 rounded-full bg-white border border-border flex items-center justify-center text-sm">{CURRENCIES[r.to_currency]?.flag}</div>
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

        <Button className="w-full rounded-xl h-12 text-base font-semibold" disabled={!currentRate || numAmount <= 0} onClick={() => navigate('/convert')}>
          <Zap className="w-4 h-4 mr-2" /> Start Conversion
        </Button>

        <p className="text-center text-xs text-muted-foreground">Rates refresh every 30 seconds. Actual rate may vary slightly at conversion time.</p>
      </div>
    </div>
  );
}