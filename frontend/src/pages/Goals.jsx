import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import RefreshableList from '@/components/shared/RefreshableList';
import GoalCard from '@/components/goals/GoalCard';
import GoalModal from '@/components/goals/GoalModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Target, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Goals() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ── Auth — same pattern as BankAccounts.jsx (proven working) ──────────────
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
  });

  // ── Goals list — only fires once user.email is available ──────────────────
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', user?.email],
    queryFn: () => base44.entities.Goal.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (goalData) => {
      return base44.entities.Goal.create({
        ...goalData,
        user_email: user.email,
        status: 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user.email] });
      setModalOpen(false);
      setEditingGoal(null);
      toast.success('Goal created successfully!');
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (goalData) => {
      return base44.entities.Goal.update(editingGoal.id, goalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user.email] });
      setModalOpen(false);
      setEditingGoal(null);
      toast.success('Goal updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update goal');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (goalId) => base44.entities.Goal.delete(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user.email] });
      toast.success('Goal deleted');
    },
    onError: () => toast.error('Failed to delete goal'),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmit = (formData) => {
    if (editingGoal) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setModalOpen(true);
  };

  const handleDelete = (goalId) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteMutation.mutate(goalId);
    }
  };

  const handleCreateNew = () => {
    setEditingGoal(null);
    setModalOpen(true);
  };

  // ── Loading guards ────────────────────────────────────────────────────────
  if (!user || isLoading) return <LoadingSpinner />;

  // ── Derived data ──────────────────────────────────────────────────────────
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const totalProgress = activeGoals.length > 0
    ? (activeGoals.reduce((sum, g) => sum + Math.min((g.current_amount / g.target_amount) * 100, 100), 0) / activeGoals.length)
    : 0;

  return (
    <RefreshableList queryKey={['goals', user.email]}>
      <div className="min-h-screen bg-background">
      <div className="px-4 pt-6 pb-24 space-y-5 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Financial Goals</h1>
            <p className="text-xs text-muted-foreground">Track your savings and investment targets</p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="rounded-xl h-10 w-10 p-0"
            title="Create new goal"
            disabled={createMutation.isPending}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Summary Card */}
        {activeGoals.length > 0 && (
          <div className="bg-gradient-to-br from-primary via-primary to-blue-700 rounded-3xl p-5 text-primary-foreground overflow-hidden relative">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 opacity-80">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">Overall Progress</span>
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-4xl font-bold">{totalProgress.toFixed(0)}%</p>
                  <span className="text-sm opacity-75">{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Goals */}
        {activeGoals.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active Goals</h2>
            </div>
            <div className="space-y-3">
              {activeGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">No active goals yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first financial goal to get started</p>
            </div>
            <Button onClick={handleCreateNew} className="rounded-xl mt-2" disabled={createMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" /> Create Your First Goal
            </Button>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completed</h2>
              <span className="text-xs text-muted-foreground">({completedGoals.length})</span>
            </div>
            <div className="space-y-3">
              {completedGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Modal — key forces fresh mount so form state resets on each open */}
      <GoalModal
        key={modalOpen ? `open-${editingGoal?.id ?? 'new'}` : 'closed'}
        open={modalOpen}
        onOpenChange={setModalOpen}
        goal={editingGoal}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </RefreshableList>
  );
}
