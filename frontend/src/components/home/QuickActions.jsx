import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Plus } from 'lucide-react';

const actions = [
  { icon: ArrowDownLeft, label: 'Receive', path: '/wallet/receive', color: 'bg-emerald-50 text-emerald-600' },
  { icon: ArrowLeftRight, label: 'Convert', path: '/convert', color: 'bg-blue-50 text-blue-600' },
  { icon: ArrowUpRight, label: 'Withdraw', path: '/withdraw', color: 'bg-purple-50 text-purple-600' },
  { icon: Plus, label: 'Add Bank', path: '/bank-accounts', color: 'bg-amber-50 text-amber-600' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ icon: Icon, label, path, color }) => (
        <Link
          key={label}
          to={path}
          className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-card hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={label}
        >
          <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-foreground">{label}</span>
        </Link>
      ))}
    </div>
  );
}