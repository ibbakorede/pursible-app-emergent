import { Button } from '@/components/ui/button';
import { Trash2, Edit2, CheckCircle2, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/currencies';
import { format, parseISO } from 'date-fns';

export default function GoalCard({ goal, onEdit, onDelete }) {
  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const isCompleted = goal.status === 'completed' || progress >= 100;

  const categoryColors = {
    savings: 'bg-blue-50 text-blue-700 border-blue-200',
    investment: 'bg-purple-50 text-purple-700 border-purple-200',
    emergency: 'bg-red-50 text-red-700 border-red-200',
    education: 'bg-amber-50 text-amber-700 border-amber-200',
    travel: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    other: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  const progressColor = isCompleted ? 'bg-emerald-500' : progress > 75 ? 'bg-blue-500' : progress > 50 ? 'bg-amber-500' : 'bg-primary';

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${isCompleted ? 'bg-emerald-50/30 border-emerald-200' : 'bg-card border-border'}`}>
      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-foreground">{goal.title}</h3>
              {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">{goal.description}</p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${categoryColors[goal.category]}`}>
            {goal.category}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${progressColor}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              {formatCurrency(goal.current_amount, goal.target_currency)}
            </span>
            <span className="text-xs text-muted-foreground">
              {progress.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Amount Info */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Current</p>
            <p className="text-sm font-bold">{formatCurrency(goal.current_amount, goal.target_currency)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-xs text-muted-foreground mb-0.5">Target</p>
            <p className="text-sm font-bold">{formatCurrency(goal.target_amount, goal.target_currency)}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${isCompleted ? 'bg-emerald-100' : 'bg-muted/50'}`}>
            <p className={`text-xs mb-0.5 ${isCompleted ? 'text-emerald-700' : 'text-muted-foreground'}`}>
              Remaining
            </p>
            <p className={`text-sm font-bold ${isCompleted ? 'text-emerald-700' : 'text-foreground'}`}>
              {formatCurrency(remaining, goal.target_currency)}
            </p>
          </div>
        </div>

        {/* Target Date */}
        {goal.target_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Target className="w-3.5 h-3.5" />
            <span>Target: {format(parseISO(goal.target_date), 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* Auto-track Badge */}
        {goal.is_auto_track && (
          <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Auto-tracking from {goal.tracked_wallet_currency} wallet
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 rounded-lg gap-1.5"
            onClick={() => onEdit(goal)}
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}