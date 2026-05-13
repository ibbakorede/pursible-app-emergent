/**
 * GoalModal - Modal for creating/editing goals (refactored)
 */
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  GoalBasicFields,
  GoalAmountFields,
  GoalCategoryFields,
  GoalAutoTrackToggle,
  GoalNotesField
} from './GoalForm';

const getInitialFormData = (goal) => {
  if (goal) {
    return {
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
    };
  }
  return {
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
  };
};

export default function GoalModal({ open, onOpenChange, goal, onSubmit, isLoading }) {
  const [formData, setFormData] = useState(() => getInitialFormData(goal));

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
          <GoalBasicFields formData={formData} onChange={setFormData} />
          <GoalAmountFields formData={formData} onChange={setFormData} />
          <GoalCategoryFields formData={formData} onChange={setFormData} />
          <GoalAutoTrackToggle formData={formData} onChange={setFormData} />
          <GoalNotesField formData={formData} onChange={setFormData} />

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.title || !formData.target_amount}
              className="rounded-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
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
