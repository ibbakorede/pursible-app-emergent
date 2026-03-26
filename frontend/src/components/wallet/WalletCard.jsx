import { Link } from 'react-router-dom';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';

export default function WalletCard({ wallet, hideBalance }) {
  const { currency, available_balance, pending_balance } = wallet;
  const c = CURRENCIES[currency];

  const actions = getActions(currency);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50">
      <div className="flex items-center gap-3 mb-4">
        <CurrencyIcon currency={currency} size="md" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{c?.name}</p>
          <p className="text-xs text-muted-foreground">{currency}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">
            {hideBalance ? '••••••' : formatCurrency(available_balance, currency)}
          </p>
          {pending_balance > 0 && (
            <p className="text-xs text-amber-600 mt-0.5">
              {hideBalance ? '••••' : `+ ${formatCurrency(pending_balance, currency)}`} pending
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        {actions.map(action => (
          <Link
            key={action.label}
            to={action.to}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${action.primary
              ? 'bg-primary/8 hover:bg-primary/15 text-primary'
              : 'bg-muted hover:bg-muted/70 text-foreground'
            }`}
          >
            {action.icon}
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function getActions(currency) {
  const receive = { label: 'Deposit', to: '/wallet/receive', icon: <ArrowDownLeft className="w-3.5 h-3.5" />, primary: true };
  const swap = { label: 'Swap', to: '/convert', icon: <RefreshCw className="w-3.5 h-3.5" />, primary: false };

  if (currency === 'NGN') {
    return [
      receive,
      { label: 'Withdraw', to: '/withdraw', icon: <ArrowUpRight className="w-3.5 h-3.5" />, primary: true },
      swap,
    ];
  }
  return [
    receive,
    { label: 'Send', to: '/withdraw', icon: <ArrowUpRight className="w-3.5 h-3.5" />, primary: true },
    swap,
  ];
}