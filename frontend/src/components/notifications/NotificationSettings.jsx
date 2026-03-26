import { useState, useEffect } from 'react';
import { Bell, BellOff, TrendingUp, Shield, CreditCard, ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationSettings,
  updateNotificationSettings,
} from '@/lib/pushNotifications';

export default function NotificationSettings() {
  const [permission, setPermission] = useState('default');
  const [settings, setSettings] = useState(getNotificationSettings());
  const [requesting, setRequesting] = useState(false);
  const supported = isNotificationSupported();

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  const handleRequestPermission = async () => {
    setRequesting(true);
    try {
      const result = await requestNotificationPermission();
      setPermission(getNotificationPermission());
      
      if (result.granted) {
        toast.success('Notifications enabled!');
      } else if (result.reason === 'denied') {
        toast.error('Notifications blocked. Please enable in browser settings.');
      }
    } catch (error) {
      toast.error('Failed to request notification permission');
    } finally {
      setRequesting(false);
    }
  };

  const handleToggle = (key, value) => {
    const updated = updateNotificationSettings({ [key]: value });
    setSettings(updated);
    toast.success('Notification preference saved');
  };

  if (!supported) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
            <BellOff className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Notifications Not Supported</p>
            <p className="text-xs text-muted-foreground">Your browser doesn't support push notifications</p>
          </div>
        </div>
      </div>
    );
  }

  if (permission !== 'granted') {
    return (
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold mb-1">Enable Push Notifications</p>
            <p className="text-xs text-muted-foreground mb-4">
              Get instant alerts for transactions, rate changes, and security updates
            </p>
            <Button 
              onClick={handleRequestPermission} 
              disabled={requesting || permission === 'denied'}
              className="rounded-xl"
            >
              {requesting ? 'Requesting...' : permission === 'denied' ? 'Blocked - Check Browser Settings' : 'Enable Notifications'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Permission granted - show toggles
  const notificationTypes = [
    {
      key: 'transactions',
      icon: CreditCard,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
      title: 'Transaction Alerts',
      desc: 'Deposits, withdrawals & conversions',
    },
    {
      key: 'rateAlerts',
      icon: TrendingUp,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
      title: 'Rate Alerts',
      desc: 'When your target rate is reached',
    },
    {
      key: 'security',
      icon: Shield,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
      title: 'Security Alerts',
      desc: 'Login attempts & password changes',
    },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50/50">
        <Bell className="w-4 h-4 text-emerald-600" />
        <p className="text-xs font-semibold text-emerald-700">Notifications Enabled</p>
      </div>

      {/* Notification type toggles */}
      {notificationTypes.map(({ key, icon: Icon, bg, color, title, desc }) => (
        <div key={key} className="flex items-center gap-4 p-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
          <Switch
            checked={settings[key]}
            onCheckedChange={(v) => handleToggle(key, v)}
          />
        </div>
      ))}
    </div>
  );
}
