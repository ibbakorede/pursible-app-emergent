import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, ArrowDownLeft, ArrowUpRight, ShieldCheck, RefreshCcw, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG = {
  transaction: { icon: ArrowDownLeft, bg: 'bg-emerald-100', text: 'text-emerald-600' },
  kyc: { icon: ShieldCheck, bg: 'bg-blue-100', text: 'text-blue-600' },
  security: { icon: ShieldCheck, bg: 'bg-amber-100', text: 'text-amber-600' },
  system: { icon: Info, bg: 'bg-purple-100', text: 'text-purple-600' },
};

function getTypeConfig(type, title = '') {
  const t = title.toLowerCase();
  if (type === 'transaction') {
    if (t.includes('withdraw') || t.includes('sent')) return { icon: ArrowUpRight, bg: 'bg-red-100', text: 'text-red-500' };
    if (t.includes('convert') || t.includes('swap')) return { icon: RefreshCcw, bg: 'bg-blue-100', text: 'text-blue-600' };
  }
  return TYPE_CONFIG[type] || { icon: Bell, bg: 'bg-muted', text: 'text-muted-foreground' };
}

export default function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-header'],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date', 5),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h3 className="text-sm font-semibold">Notifications</h3>
              {unreadCount > 0 && <p className="text-xs text-primary font-medium">{unreadCount} unread</p>}
            </div>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map(n => {
                  const cfg = getTypeConfig(n.type, n.title);
                  const Icon = cfg.icon;
                  return (
                    <div key={n.id} className={`px-4 py-3 hover:bg-muted/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                          <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-snug ${!n.is_read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                          </p>
                        </div>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-xs text-primary font-semibold text-center border-t border-border hover:bg-muted/30 transition-colors"
            >
              View all notifications
            </Link>
          )}
        </div>
      )}

      {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-40" />}
    </div>
  );
}