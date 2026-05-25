import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';

// Transaction type to color mapping
const txTypeStyles = {
  conversion: {
    bgColor: 'rgba(29,158,117,0.15)',  // teal tint
    iconColor: '#1D9E75',
    Icon: ArrowLeftRight,
  },
  withdrawal: {
    bgColor: 'rgba(127,119,221,0.15)', // purple tint
    iconColor: '#7F77DD',
    Icon: ArrowUpRight,
  },
  deposit: {
    bgColor: 'rgba(55,138,221,0.15)',  // blue tint
    iconColor: '#378ADD',
    Icon: ArrowDownLeft,
  },
  receive: {
    bgColor: 'rgba(55,138,221,0.15)',  // blue tint (same as deposit)
    iconColor: '#378ADD',
    Icon: ArrowDownLeft,
  },
};

function TransactionIcon({ type, currency }) {
  const style = txTypeStyles[type] || txTypeStyles.deposit;
  const { Icon, bgColor, iconColor } = style;
  
  return (
    <div 
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: bgColor }}
    >
      <Icon className="w-5 h-5" style={{ color: iconColor }} />
    </div>
  );
}

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
              <TransactionIcon 
                type={tx.type} 
                currency={tx.type === 'withdrawal' ? tx.from_currency : tx.to_currency || tx.from_currency} 
              />
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
