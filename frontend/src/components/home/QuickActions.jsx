import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Plus } from 'lucide-react';

const actions = [
  { 
    icon: ArrowDownLeft, 
    label: 'Receive', 
    path: '/wallet/receive', 
    bgColor: 'rgba(151,196,89,0.18)',  // olive tint
    iconColor: '#97C459'               // olive 600
  },
  { 
    icon: ArrowLeftRight, 
    label: 'Convert', 
    path: '/convert', 
    bgColor: 'rgba(133,183,235,0.18)', // blue tint
    iconColor: '#85B7EB'               // blue 600
  },
  { 
    icon: ArrowUpRight, 
    label: 'Withdraw', 
    path: '/withdraw', 
    bgColor: 'rgba(175,169,236,0.18)', // purple tint
    iconColor: '#AFA9EC'               // purple 600
  },
  { 
    icon: Plus, 
    label: 'Add Bank', 
    path: '/bank-accounts', 
    bgColor: 'rgba(250,199,117,0.18)', // amber tint
    iconColor: '#FAC775'               // amber 600
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map(({ icon: Icon, label, path, bgColor, iconColor }) => (
        <Link
          key={label}
          to={path}
          className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-card hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={label}
        >
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <span className="text-xs font-medium text-foreground">{label}</span>
        </Link>
      ))}
    </div>
  );
}
