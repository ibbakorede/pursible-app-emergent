import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';

const FROM_CURRENCIES = ['USD', 'USDC', 'NGN'];

export default function CreateAlertModal({ open, onClose, onSave, currentRates }) {
  const [form, setForm] = useState({
    from_currency: 'USD',
    to_currency: 'NGN',
    target_rate: '',
    condition: 'above',
    notify_email: true,
    notify_inapp: true,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Memoize filtered destination currencies
  const toCurrencyOptions = useMemo(
    () => FROM_CURRENCIES.filter(c => c !== form.from_currency),
    [form.from_currency]
  );

  const currentRate = currentRates?.find(
    r => r.from_currency === form.from_currency && r.to_currency === form.to_currency
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, target_rate: Number(form.target_rate) });
    // Note: onClose is called by the parent's onSuccess after the mutation completes
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> New Rate Alert
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Currency Pair</Label>
            <div className="flex gap-2">
              <Select value={form.from_currency} onValueChange={v => set('from_currency', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FROM_CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="flex items-center text-muted-foreground font-medium">→</span>
              <Select value={form.to_currency} onValueChange={v => set('to_currency', v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {toCurrencyOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {currentRate && (
              <p className="text-xs text-muted-foreground">Current rate: <span className="font-semibold text-foreground">{currentRate.rate.toLocaleString()}</span></p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Condition</Label>
            <Select value={form.condition} onValueChange={v => set('condition', v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="above">Rate goes above</SelectItem>
                <SelectItem value="below">Rate goes below</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Rate</Label>
            <Input
              type="number"
              step="any"
              placeholder="e.g. 1600"
              value={form.target_rate}
              onChange={e => set('target_rate', e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer">In-app notification</Label>
              <Switch checked={form.notify_inapp} onCheckedChange={v => set('notify_inapp', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="cursor-pointer">Email notification</Label>
              <Switch checked={form.notify_email} onCheckedChange={v => set('notify_email', v)} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="flex-1 rounded-xl" disabled={!form.target_rate}>Create Alert</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}