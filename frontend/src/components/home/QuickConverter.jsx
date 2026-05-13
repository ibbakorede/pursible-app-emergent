import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeftRight } from 'lucide-react';

const CURRENCIES = ['USD', 'USDC', 'USDT', 'NGN'];

export default function QuickConverter() {
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('NGN');

  const { data: rates = [] } = useQuery({
    queryKey: ['conversion-rates'],
    queryFn: () => base44.entities.ConversionRate.filter({ is_active: true }),
  });

  const currentRate = useMemo(() => {
    if (from === to) return 1;
    const direct = rates.find(r => r.from_currency === from && r.to_currency === to);
    if (direct) return direct.rate;
    const reverse = rates.find(r => r.from_currency === to && r.to_currency === from);
    if (reverse && reverse.rate > 0) return 1 / reverse.rate;
    return null;
  }, [from, to, rates]);

  const converted = useMemo(() => {
    const num = parseFloat(amount);
    if (!num || isNaN(num)) return null;
    if (currentRate === null) return null;
    return num * currentRate;
  }, [amount, currentRate]);

  // Memoize filtered currencies for 'to' select
  const toCurrencies = useMemo(() => {
    return CURRENCIES.filter(c => c !== 'USD' && c !== from);
  }, [from]);

  const swap = () => { setFrom(to); setTo(from); };

  const fmt = (val, currency) => {
    if (val === null) return '—';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: currency === 'NGN' ? 2 : 4,
      maximumFractionDigits: currency === 'NGN' ? 2 : 4,
    }).format(val);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">Quick Converter</p>

      <div className="flex items-center gap-2">
        {/* Amount + From */}
          <div className="flex-1 flex items-center border border-input rounded-xl overflow-hidden bg-background focus-within:ring-1 focus-within:ring-ring">
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none min-w-0 [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
            />
            <select
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="text-xs font-semibold bg-muted px-2 py-2.5 border-l border-input outline-none cursor-pointer"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

        {/* Swap */}
        <button onClick={swap} className="p-2 rounded-xl bg-muted hover:bg-secondary transition-colors flex-shrink-0">
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* To currency */}
         <select
           value={to}
           onChange={e => setTo(e.target.value)}
           className="text-xs font-semibold bg-muted px-3 py-2.5 rounded-xl border border-input outline-none cursor-pointer"
         >
           {toCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
         </select>
      </div>

      {/* Rate info */}
       {currentRate !== null && (
         <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
           <p className="text-xs text-muted-foreground">Exchange Rate</p>
           <p className="text-sm font-semibold text-foreground mt-1">
             1 {from} = {fmt(currentRate, to)} {to}
           </p>
         </div>
       )}

       {/* Result */}
       <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center justify-between">
         <p className="text-xs text-muted-foreground">Estimated value</p>
         <p className="text-base font-bold text-foreground">
           {converted !== null ? `${fmt(converted, to)} ${to}` : '—'}
         </p>
       </div>
    </div>
  );
}