import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, Bell, ArrowLeft, TrendingUp, Zap, CheckCircle, Clock, PauseCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import CreateAlertModal from '@/components/alerts/CreateAlertModal';
import AlertCard from '@/components/alerts/AlertCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

export default function RateAlerts() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const checkAlertsRef = useRef(null);

  // ── Auth — same pattern as BankAccounts.jsx (proven working) ──────────────
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // ── Alerts list — only fires once user.email is available ─────────────────
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['rate-alerts', user?.email],
    queryFn: () => base44.entities.RateAlert.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  // ── Conversion rates (no auth dependency) ────────────────────────────────
  const { data: rates = [] } = useQuery({
    queryKey: ['rates'],
    queryFn: () => base44.entities.ConversionRate.list(),
  });

  // ── Create alert ──────────────────────────────────────────────────────────
  const createAlert = useMutation({
    mutationFn: (data) => {
      console.log('[RateAlerts] create — user.email:', user.email, 'data:', data);
      return base44.entities.RateAlert.create({ ...data, user_email: user.email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-alerts', user.email] });
      setShowCreate(false);
      toast.success('Alert created!');
    },
    onError: (err) => {
      console.error('[RateAlerts] create error:', err);
      toast.error('Failed to create alert. Please try again.');
    },
  });

  // ── Delete alert ──────────────────────────────────────────────────────────
  const deleteAlert = useMutation({
    mutationFn: (id) => base44.entities.RateAlert.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-alerts', user.email] });
      toast.success('Alert deleted');
    },
    onError: () => toast.error('Failed to delete alert. Please try again.'),
  });

  // ── Toggle alert active state ─────────────────────────────────────────────
  const toggleAlert = useMutation({
    mutationFn: (alert) => base44.entities.RateAlert.update(alert.id, { is_active: !alert.is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rate-alerts', user.email] }),
    onError: () => toast.error('Failed to update alert. Please try again.'),
  });

  // ── Rate check — runs on load and every 60s ───────────────────────────────
  const checkAlerts = useCallback(async () => {
    if (!alerts.length || !rates.length || !user) return;
    const activeAlerts = alerts.filter(a => a.is_active && !a.triggered_at);
    for (const alert of activeAlerts) {
      const rate = rates.find(r => r.from_currency === alert.from_currency && r.to_currency === alert.to_currency);
      if (!rate) continue;
      const triggered = (alert.condition === 'above' && rate.rate >= alert.target_rate) || (alert.condition === 'below' && rate.rate <= alert.target_rate);
      if (triggered) {
        let msg = `${alert.from_currency}→${alert.to_currency} is now ${rate.rate.toLocaleString()} (target: ${alert.condition} ${alert.target_rate.toLocaleString()})`;
        try {
          const aiResponse = await base44.functions.invoke('generateAlertMessage', {
            fromCurrency: alert.from_currency,
            toCurrency: alert.to_currency,
            targetRate: alert.target_rate,
            currentRate: rate.rate,
            condition: alert.condition,
          });
          msg = aiResponse.message || msg;
        } catch {
          console.warn('[RateAlerts] AI message failed, using default');
        }
        await base44.entities.RateAlert.update(alert.id, { triggered_at: new Date().toISOString(), is_active: false, last_checked_rate: rate.rate });
        if (alert.notify_inapp) {
          await base44.entities.Notification.create({ user_email: user.email, title: 'Rate Alert Triggered 🔔', message: msg, type: 'transaction', is_read: false });
          toast.success(`Rate alert triggered! ${msg}`);
        }
        if (alert.notify_email) {
          await base44.integrations.Core.SendEmail({ to: user.email, subject: 'Rate Alert Triggered — Pursible', body: `Hi ${user.full_name || ''},\n\nYour rate alert has been triggered!\n\n${msg}\n\nLog in to act on this opportunity.\n\n— Pursible` });
        }
        queryClient.invalidateQueries({ queryKey: ['rate-alerts', user.email] });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } else {
        await base44.entities.RateAlert.update(alert.id, { last_checked_rate: rate.rate });
      }
    }
  }, [alerts, rates, user, queryClient]);

  // Store the latest checkAlerts in ref to avoid stale closure in interval
  useEffect(() => {
    checkAlertsRef.current = checkAlerts;
  }, [checkAlerts]);

  useEffect(() => {
    // Initial check
    checkAlertsRef.current?.();
    
    // Interval check
    const interval = setInterval(() => {
      checkAlertsRef.current?.();
    }, 60_000);
    
    return () => clearInterval(interval);
  }, []);

  // ── Loading guard ─────────────────────────────────────────────────────────
  if (!user || isLoading) return <LoadingSpinner />;

  const active = alerts.filter(a => a.is_active && !a.triggered_at);
  const triggered = alerts.filter(a => a.triggered_at);
  const paused = alerts.filter(a => !a.is_active && !a.triggered_at);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Rate Alerts</h1>
              <p className="text-xs text-muted-foreground">Get notified when rates hit your target</p>
            </div>
          </div>
          <Button size="sm" className="rounded-xl gap-1" onClick={() => setShowCreate(true)} disabled={createAlert.isPending}>
            <Plus className="w-3.5 h-3.5" /> New Alert
          </Button>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-lg">{alerts.length} Alert{alerts.length !== 1 ? 's' : ''}</p>
              <p className="text-sm opacity-70">{active.length} watching · {triggered.length} triggered</p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {alerts.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Zap, label: 'Watching', count: active.length, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
              { icon: CheckCircle, label: 'Triggered', count: triggered.length, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
              { icon: PauseCircle, label: 'Paused', count: paused.length, bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
            ].map(({ icon: Icon, label, count, bg, text, border }) => (
              <div key={label} className={`${bg} border ${border} rounded-xl p-3 text-center`}>
                <Icon className={`w-4 h-4 mx-auto mb-1 ${text}`} />
                <p className={`text-xl font-bold ${text}`}>{count}</p>
                <p className={`text-xs font-medium ${text} opacity-80`}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {alerts.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No rate alerts yet"
            description="Create one to get notified when your target rate is reached"
            action={
              <Button className="rounded-xl px-6" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Create First Alert
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <section className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Watching ({active.length})</p>
                {active.map(a => <AlertCard key={a.id} alert={a} onDelete={id => deleteAlert.mutate(id)} onToggle={a => toggleAlert.mutate(a)} />)}
              </section>
            )}
            {triggered.length > 0 && (
              <section className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Triggered ({triggered.length})</p>
                {triggered.map(a => <AlertCard key={a.id} alert={a} onDelete={id => deleteAlert.mutate(id)} onToggle={a => toggleAlert.mutate(a)} />)}
              </section>
            )}
            {paused.length > 0 && (
              <section className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Paused ({paused.length})</p>
                {paused.map(a => <AlertCard key={a.id} alert={a} onDelete={id => deleteAlert.mutate(id)} onToggle={a => toggleAlert.mutate(a)} />)}
              </section>
            )}
          </div>
        )}
      </div>

      <CreateAlertModal open={showCreate} onClose={() => setShowCreate(false)} onSave={data => createAlert.mutate(data)} currentRates={rates} />
    </div>
  );
}
