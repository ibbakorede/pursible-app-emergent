import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';

export default function RecentTransactions({ transactions }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
        <Link to="/transactions" className="text-xs text-primary font-medium flex items-center gap-1">
          See all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="bg-card rounded-2xl divide-y divide-border">
        {transactions.length > 0 ? (
          transactions.slice(0, 5).map(tx => (
            <Link key={tx.id} to={`/transactions/${tx.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
              <CurrencyIcon currency={tx.type === 'withdrawal' ? tx.from_currency : tx.to_currency || tx.from_currency} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate capitalize">{tx.type}</p>
                <p className="text-xs text-muted-foreground">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, h:mm a') : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{tx.to_amount ? formatCurrency(tx.to_amount, tx.to_currency) : formatCurrency(tx.from_amount, tx.from_currency)}</p>
                <StatusBadge status={tx.status} />
              </div>
            </Link>
          ))
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">Start converting or receiving funds to see your transaction history</p>
          </div>
        )}
      </div>
    </div>
  );
}