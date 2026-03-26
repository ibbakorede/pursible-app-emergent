import { CURRENCIES } from '@/lib/currencies';
import { DollarSign, Coins } from 'lucide-react';

export default function CurrencyIcon({ currency, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' };
  const iconSizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const c = CURRENCIES[currency];

  const icons = {
    USD: <DollarSign className={iconSizes[size]} />,
    USDC: <Coins className={iconSizes[size]} />,
    NGN: <span className={`font-bold ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}>₦</span>,
  };

  return (
    <div className={`${sizes[size]} rounded-full ${c?.bg || 'bg-slate-100'} ${c?.color || 'text-slate-600'} flex items-center justify-center flex-shrink-0`}>
      {icons[currency] || <span className="text-sm font-bold">{currency?.[0]}</span>}
    </div>
  );
}