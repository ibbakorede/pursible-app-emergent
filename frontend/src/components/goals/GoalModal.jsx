import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

const CATEGORIES = ['savings', 'investment', 'emergency', 'education', 'travel', 'other'];
const CURRENCIES = ['USD', 'USDC', 'USDT', 'NGN'];

export default function GoalModal({ open, onOpenChange, goal, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(goal ? {
    title: goal.title,
    description: goal.description || '',
    target_amount: goal.target_amount,
    target_currency: goal.target_currency,
    category: goal.category,
    target_date: goal.target_date || '',
    current_amount: goal.current_amount || 0,
    is_auto_track: goal.is_auto_track || false,
    tracked_wallet_currency: goal.tracked_wallet_currency || '',
    notes: goal.notes || '',
  } : {
    title: '',
    description: '',
    target_amount: '',
    target_currency: 'USD',
    category: 'savings',
    target_date: '',
    current_amount: 0,
    is_auto_track: false,
    tracked_wallet_currency: '',
    notes: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{goal ? 'Edit Goal' : 'Create New Goal'}</DialogTitle>
          <DialogDescription>
            {goal ? 'Update your financial goal' : 'Set a savings or investment goal'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Goal Title *</label>
            <Input
              placeholder="e.g., Save for down payment"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="rounded-lg"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
            <Textarea
              placeholder="Why is this goal important to you?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="rounded-lg h-20"
            />
          </div>

          {/* Target Amount & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Target Amount *</label>
              <Input
                type="number"
                placeholder="5000"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || '' })}
                className="rounded-lg"
                step="0.01"
                min="0"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Currency *</label>
              <Select value={formData.target_currency} onValueChange={(value) => setFormData({ ...formData, target_currency: value })}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category & Target Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Target Date</label>
              <Input
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Current Amount */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Current Amount (optional)</label>
            <Input
              type="number"
              placeholder="0"
              value={formData.current_amount}
              onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
              className="rounded-lg"
              step="0.01"
              min="0"
            />
          </div>

          {/* Auto-track */}
          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground block">Auto-track from wallet</label>
                <p className="text-xs text-muted-foreground mt-1">Automatically track progress from your wallet balance</p>
              </div>
              <Switch
                checked={formData.is_auto_track}
                onCheckedChange={(checked) => setFormData({ ...formData, is_auto_track: checked })}
              />
            </div>

            {formData.is_auto_track && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Track from Currency</label>
                <Select
                  value={formData.tracked_wallet_currency}
                  onValueChange={(value) => setFormData({ ...formData, tracked_wallet_currency: value })}
                >
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Notes</label>
            <Textarea
              placeholder="Any additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-lg h-16"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-lg"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
              ) : (
                goal ? 'Update Goal' : 'Create Goal'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}