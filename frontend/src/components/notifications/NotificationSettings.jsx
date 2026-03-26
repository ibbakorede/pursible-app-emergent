import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, AlertCircle, CheckCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();
  const [browserSupported, setBrowserSupported] = useState(false);

  useEffect(() => {
    setBrowserSupported(isSupported);
  }, [isSupported]);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-prefs', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter({ user_email: user?.email });
      return prefs.length > 0 ? prefs[0] : null;
    },
    enabled: !!user?.email,
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (updates) => {
      if (!preferences) {
        return base44.entities.NotificationPreference.create({
          user_email: user.email,
          ...updates,
        });
      }
      return base44.entities.NotificationPreference.update(preferences.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-prefs'] });
      toast.success('Preferences updated');
    },
  });

  const handleTogglePushNotifications = async (enabled) => {
    if (enabled && !isSubscribed) {
      const success = await subscribe();
      if (success) {
        await updatePrefsMutation.mutateAsync({ push_notifications_enabled: true });
      } else {
        toast.error('Failed to enable notifications');
      }
    } else if (!enabled && isSubscribed) {
      await unsubscribe();
      await updatePrefsMutation.mutateAsync({ push_notifications_enabled: false });
    }
  };

  const handleToggleTransactionNotifications = (enabled) => {
    updatePrefsMutation.mutate({ transaction_notifications: enabled });
  };

  const handleToggleBalanceNotifications = (enabled) => {
    updatePrefsMutation.mutate({ balance_change_notifications: enabled });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading preferences...</div>;
  }

  return (
    <div className="space-y-4">
      {!browserSupported && (
        <Card className="bg-amber-50 border-amber-200 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Browser not supported</p>
            <p className="text-xs text-amber-800">Push notifications are not available in your browser.</p>
          </div>
        </Card>
      )}

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Get alerts on your device</p>
            </div>
          </div>
          <Switch
            checked={isSubscribed && (preferences?.push_notifications_enabled ?? true)}
            onCheckedChange={handleTogglePushNotifications}
            disabled={!browserSupported || updatePrefsMutation.isPending}
          />
        </div>

        {isSubscribed && (
          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
            <CheckCircle className="w-4 h-4" />
            Notifications enabled for this device
          </div>
        )}
      </Card>

      {isSubscribed && (
        <>
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Transaction Notifications</p>
                <p className="text-xs text-muted-foreground">Deposits and withdrawals</p>
              </div>
              <Switch
                checked={preferences?.transaction_notifications ?? true}
                onCheckedChange={handleToggleTransactionNotifications}
                disabled={updatePrefsMutation.isPending}
              />
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Balance Change Notifications</p>
                <p className="text-xs text-muted-foreground">Any wallet balance updates</p>
              </div>
              <Switch
                checked={preferences?.balance_change_notifications ?? true}
                onCheckedChange={handleToggleBalanceNotifications}
                disabled={updatePrefsMutation.isPending}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}