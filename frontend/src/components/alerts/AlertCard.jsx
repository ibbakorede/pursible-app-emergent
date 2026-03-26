import { Button } from '@/components/ui/button';
import { Bell, BellOff, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AlertCard({ alert, onDelete, onToggle }) {
  const isTriggered = !!alert.triggered_at;

  return (
    <div className={`p-4 rounded-2xl border bg-card flex items-start gap-3 ${!alert.is_active ? 'opacity-60' : ''}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isTriggered ? 'bg-emerald-50' : 'bg-primary/10'}`}>
        {isTriggered
          ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          : <Bell className="w-4 h-4 text-primary" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{alert.from_currency} → {alert.to_currency}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.condition === 'above' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {alert.condition} {alert.target_rate?.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {alert.notify_inapp && <span>In-app</span>}
          {alert.notify_email && <span>Email</span>}
          {isTriggered && (
            <span className="text-emerald-600 font-medium">
              Triggered {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
            </span>
          )}
          {!isTriggered && alert.is_active && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Watching</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggle(alert)}>
          {alert.is_active ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5 text-muted-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(alert.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}