import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Bell, ArrowDownLeft, ArrowUpRight, ShieldCheck, Info, CheckCheck, RefreshCcw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import RefreshableList from '@/components/shared/RefreshableList';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'transaction', label: 'Transactions' },
  { key: 'kyc', label: 'Account' },
  { key: 'security', label: 'Security' },
];

const TYPE_CONFIG = {
  transaction: { icon: ArrowDownLeft, bg: 'bg-emerald-100', text: 'text-emerald-600' },
  kyc:         { icon: ShieldCheck,   bg: 'bg-blue-100',   text: 'text-blue-600' },
  security:    { icon: ShieldCheck,   bg: 'bg-amber-100',  text: 'text-amber-600' },
  system:      { icon: Info,          bg: 'bg-purple-100', text: 'text-purple-600' },
};

function getTypeConfig(type, title = '') {
  const t = title.toLowerCase();
  if (type === 'transaction') {
    if (t.includes('withdraw') || t.includes('sent')) return { icon: ArrowUpRight, bg: 'bg-red-100', text: 'text-red-500' };
    if (t.includes('convert') || t.includes('swap')) return { icon: RefreshCcw, bg: 'bg-blue-100', text: 'text-blue-600' };
  }
  return TYPE_CONFIG[type] || { icon: Bell, bg: 'bg-muted', text: 'text-muted-foreground' };
}

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => { base44.auth.me().then(setUser); }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const markRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-notifications'] }),
  });

  const filtered = activeTab === 'all' ? notifications : notifications.filter(n => n.type === activeTab);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) return <LoadingSpinner />;

  return (
    <RefreshableList queryKey={['all-notifications']}>
      <div className="px-4 pt-6 pb-10 space-y-5 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label="Go back">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Notifications</h1>
              {unreadCount > 0 ? (
                <p className="text-xs text-primary font-semibold">{unreadCount} unread</p>
              ) : (
                <p className="text-xs text-muted-foreground">All caught up!</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1.5 h-8 rounded-xl" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-card border border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              {tab.label}
              {tab.key === 'all' && unreadCount > 0 && (
                <span className="ml-1.5 bg-white/30 text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold">No notifications</p>
            <p className="text-sm text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(n => {
              const cfg = getTypeConfig(n.type, n.title);
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markRead.mutate(n.id)}
                  className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                    !n.is_read ? 'bg-primary/5 border-primary/20 hover:bg-primary/8' : 'bg-card border-border hover:bg-muted/50'
                  }`}
                >
                  {!n.is_read && <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-4.5 h-4.5 ${cfg.text}`} style={{ width: '1.1rem', height: '1.1rem' }} />
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5">
                      {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
        </RefreshableList>
        );
        }