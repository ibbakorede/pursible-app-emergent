/**
 * GoalForm - Form fields for creating/editing goals
 */
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const CATEGORIES = ['savings', 'investment', 'emergency', 'education', 'travel', 'other'];
const CURRENCIES = ['USD', 'USDC', 'USDT', 'NGN'];

export { CATEGORIES, CURRENCIES };

export function GoalBasicFields({ formData, onChange }) {
  return (
    <>
      {/* Title */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Goal Title *</label>
        <Input
          placeholder="e.g., Save for down payment"
          value={formData.title}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
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
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          className="rounded-lg h-20"
        />
      </div>
    </>
  );
}

export function GoalAmountFields({ formData, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Target Amount *</label>
        <Input
          type="number"
          placeholder="10,000"
          value={formData.target_amount}
          onChange={(e) => onChange({ ...formData, target_amount: e.target.value })}
          className="rounded-lg"
          min="0"
          step="0.01"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Currency</label>
        <Select
          value={formData.target_currency}
          onValueChange={(v) => onChange({ ...formData, target_currency: v })}
        >
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
  );
}

export function GoalCategoryFields({ formData, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Category</label>
        <Select
          value={formData.category}
          onValueChange={(v) => onChange({ ...formData, category: v })}
        >
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
          onChange={(e) => onChange({ ...formData, target_date: e.target.value })}
          className="rounded-lg"
        />
      </div>
    </div>
  );
}

export function GoalAutoTrackToggle({ formData, onChange }) {
  return (
    <div className="p-4 bg-muted/50 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">Auto-track from wallet</p>
          <p className="text-sm text-muted-foreground">Automatically add deposits to this goal</p>
        </div>
        <Switch
          checked={formData.is_auto_track}
          onCheckedChange={(checked) => onChange({ ...formData, is_auto_track: checked })}
        />
      </div>
      
      {formData.is_auto_track && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Track Wallet</label>
          <Select
            value={formData.tracked_wallet_currency}
            onValueChange={(v) => onChange({ ...formData, tracked_wallet_currency: v })}
          >
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Select wallet to track" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => (
                <SelectItem key={c} value={c}>{c} Wallet</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

export function GoalNotesField({ formData, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">Notes</label>
      <Textarea
        placeholder="Any additional notes about this goal..."
        value={formData.notes}
        onChange={(e) => onChange({ ...formData, notes: e.target.value })}
        className="rounded-lg h-16"
      />
    </div>
  );
}
