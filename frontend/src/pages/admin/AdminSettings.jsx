import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Save, Battery } from 'lucide-react';
import DepositAccountsSettings from '@/components/admin/DepositAccountsSettings';

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['rates'],
    queryFn: () => base44.entities.ConversionRate.list(),
  });

  const [editingRates, setEditingRates] = useState({});
  const [syncFrequency, setSyncFrequency] = useState('60'); // minutes

  // Load sync frequency from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('backgroundSyncFrequency');
    if (saved) setSyncFrequency(saved);
  }, []);

  // Save sync frequency to localStorage and trigger service worker update
  const handleSyncFrequencyChange = (value) => {
    setSyncFrequency(value);
    localStorage.setItem('backgroundSyncFrequency', value);
    
    // Notify service worker of new frequency
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_SYNC_FREQUENCY',
        frequency: parseInt(value),
      });
    }
    
    toast.success(`Background sync frequency updated to ${value} minutes`);
  };

  const updateRate = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ConversionRate.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rates'] }); toast.success('Rate updated'); },
  });

  const createRate = useMutation({
    mutationFn: (data) => base44.entities.ConversionRate.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rates'] }); toast.success('Rate created'); },
  });

  const defaultRates = [
    { from: 'USD', to: 'NGN', rate: 1550, fee: 0.5 },
    { from: 'USD', to: 'USDC', rate: 1, fee: 0.1 },
    { from: 'USDC', to: 'NGN', rate: 1550, fee: 0.5 },
  ];

  const initRates = async () => {
    for (const r of defaultRates) {
      const exists = rates.find(e => e.from_currency === r.from && e.to_currency === r.to);
      if (!exists) {
        await base44.entities.ConversionRate.create({
          from_currency: r.from, to_currency: r.to, rate: r.rate, fee_percentage: r.fee, is_active: true,
        });
      }
    }
    queryClient.invalidateQueries({ queryKey: ['rates'] });
    toast.success('Default rates initialized');
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        {rates.length === 0 && (
          <Button onClick={initRates} className="rounded-xl">Initialize Default Rates</Button>
        )}
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Conversion Rates & Fees</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pair</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Fee %</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.from_currency} → {r.to_currency}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-28 h-8 rounded"
                    value={editingRates[r.id]?.rate ?? r.rate}
                    onChange={e => setEditingRates({...editingRates, [r.id]: {...(editingRates[r.id] || {}), rate: Number(e.target.value)}})}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    className="w-20 h-8 rounded"
                    step="0.1"
                    value={editingRates[r.id]?.fee_percentage ?? r.fee_percentage}
                    onChange={e => setEditingRates({...editingRates, [r.id]: {...(editingRates[r.id] || {}), fee_percentage: Number(e.target.value)}})}
                  />
                </TableCell>
                <TableCell className={`text-sm font-medium ${r.is_active ? 'text-emerald-600' : 'text-red-600'}`}>{r.is_active ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" disabled={!editingRates[r.id]} onClick={() => {
                    updateRate.mutate({ id: r.id, data: editingRates[r.id] });
                    setEditingRates(prev => { const n = {...prev}; delete n[r.id]; return n; });
                  }}>
                    <Save className="w-3 h-3 mr-1" /> Save
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <DepositAccountsSettings />

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <Battery className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-3">Background Sync Frequency (Android)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Optimize battery usage by adjusting how frequently offline transactions sync. Lower values consume more battery but sync faster. Higher values are battery-friendly but may delay transaction synchronization.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sync Interval (minutes)</label>
              <Select value={syncFrequency} onValueChange={handleSyncFrequencyChange}>
                <SelectTrigger className="w-full sm:w-48 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes (high battery use)</SelectItem>
                  <SelectItem value="30">30 minutes (moderate battery use)</SelectItem>
                  <SelectItem value="60">60 minutes (low battery use)</SelectItem>
                  <SelectItem value="120">2 hours (minimal battery use)</SelectItem>
                  <SelectItem value="240">4 hours (ultra low battery use)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Current setting: <strong>{syncFrequency} minutes</strong>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-semibold mb-2">Role Permissions</h3>
        <p className="text-sm text-muted-foreground">
          <strong>Admin:</strong> Full access to all admin features.<br />
          <strong>User:</strong> Standard user access only.
        </p>
      </Card>
    </div>
  );
}