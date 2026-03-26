import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';

export default function BalanceCard({ wallets }) {
  const [visible, setVisible] = useState(true);
  const { data: rates = [] } = useQuery({
    queryKey: ['rates'],
    queryFn: () => base44.entities.ConversionRate.list(),
  });

  const totalUSD = wallets.reduce((acc, w) => {
    if (w.currency === 'USD' || w.currency === 'USDC' || w.currency === 'USDT') {
      return acc + (w.available_balance || 0);
    }
    return acc;
  }, 0);

  const usdToNgnRate = rates.find(r => r.from_currency === 'USD' && r.to_currency === 'NGN')?.rate || 1;
  const totalNGN = totalUSD * usdToNgnRate;

  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground">
      <div className="flex items-center justify-between mb-1">
         <p className="text-sm opacity-80">Total Balance</p>
         <button onClick={() => setVisible(!visible)} className="opacity-70 hover:opacity-100 transition-opacity">
           {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
         </button>
       </div>
       <h2 className="text-3xl font-bold tracking-tight mb-3">
         {visible ? formatCurrency(totalUSD, 'USD') : '••••••'}
       </h2>
       <p className="text-sm opacity-70 mb-4">
         {visible ? formatCurrency(totalNGN, 'NGN') : '••••••'}
       </p>
      <div className="flex gap-2">
        {wallets.map(w => {
          const currency = CURRENCIES[w.currency];
          return (
            <div key={w.currency} className="flex-1 bg-white/10 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{currency?.flag}</span>
                <p className="text-[10px] uppercase opacity-70">{w.currency}</p>
              </div>
              <p className="text-sm font-semibold">{visible ? formatCurrency(w.available_balance, w.currency) : '••••'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}