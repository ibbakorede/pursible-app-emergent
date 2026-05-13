/**
 * RecentConversions - Displays recent conversion transactions
 */
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { History, ArrowDownToLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function RecentConversions({ transactions = [] }) {
  const recentTxns = transactions
    .filter(t => t.type === 'conversion')
    .slice(0, 3);

  if (recentTxns.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <History className="w-4 h-4 text-muted-foreground" />
          <span>Recent Conversions</span>
        </div>
        <Link to="/transactions" className="text-xs text-primary font-semibold hover:underline">
          View All
        </Link>
      </div>
      <div className="space-y-2">
        {recentTxns.map(tx => (
          <RecentTxnCard key={tx.id} tx={tx} />
        ))}
      </div>
    </div>
  );
}

function RecentTxnCard({ tx }) {
  const fromCurr = tx.from_currency || 'USD';
  const toCurr = tx.to_currency || 'NGN';

  return (
    <Link 
      to={`/transactions/${tx.id}`}
      className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors"
    >
      <div className="relative">
        <CurrencyIcon currency={fromCurr} size="sm" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-card rounded-full flex items-center justify-center border border-border">
          <ArrowDownToLine className="w-2.5 h-2.5 text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {fromCurr} → {toCurr}
        </p>
        <p className="text-xs text-muted-foreground">
          {tx.created_date ? formatDistanceToNow(new Date(tx.created_date), { addSuffix: true }) : 'Recently'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-emerald-600">
          +{formatCurrency(tx.to_amount || 0, toCurr)}
        </p>
        <p className="text-xs text-muted-foreground">
          -{formatCurrency(tx.from_amount || 0, fromCurr)}
        </p>
      </div>
    </Link>
  );
}
