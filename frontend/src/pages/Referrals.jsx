import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Copy, Users, Award, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ReferralActivityDashboard from '@/components/referrals/ReferralActivityDashboard';

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function Referrals() {
  const [copied, setCopied] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const queryClient = useQueryClient();

  // ── Auth — same pattern as BankAccounts.jsx (proven working) ──────────────
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  // ── Referrals list — only fires once user.email is available ──────────────
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referrals', user?.email],
    queryFn: () => base44.entities.Referral.filter({ referrer_email: user.email }),
    enabled: !!user?.email,
  });

  // ── Save referral code — called once if user.referral_code is missing ─────
  const saveCode = useMutation({
    mutationFn: (code) => {
      return base44.auth.updateMe({ referral_code: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  // ── Auto-generate referral code on first visit ────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (!user.referral_code && !saveCode.isPending) {
      const code = generateCode();
      saveCode.mutate(code);
    }
  }, [user, saveCode]);

  // ── Loading guard ─────────────────────────────────────────────────────────
  if (!user || isLoading) return <LoadingSpinner />;

  // ── Derived data ──────────────────────────────────────────────────────────
  const referralCode = user.referral_code || '';
  const referralLink = referralCode ? `https://pursible.com/join?ref=${referralCode}` : '';

  const completedReferrals = referrals.filter(r => r.status === 'completed');
  const pendingReferrals = referrals.filter(r => r.status === 'pending');
  const totalBonus = completedReferrals.reduce((sum, r) => sum + (r.bonus_amount || 0), 0);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-20 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/profile" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Referrals</h1>
            <p className="text-xs text-muted-foreground">Earn bonuses by inviting friends</p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
          <div className="relative space-y-6">
            <div>
              <p className="text-sm opacity-80 font-medium mb-1">Your Referral Link</p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={referralLink || (saveCode.isPending ? 'Generating…' : '')}
                  className="flex-1 rounded-xl bg-white/15 border-white/20 text-white placeholder:text-white/50 text-xs font-mono focus-visible:ring-white/40"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 flex-shrink-0 hover:bg-white/20 text-white rounded-xl"
                  onClick={handleCopyLink}
                  disabled={!referralLink}
                  aria-label="Copy referral link"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs opacity-80 font-medium">Friends Referred</p>
                <p className="text-2xl font-bold mt-1">{completedReferrals.length}</p>
              </div>
              <div>
                <p className="text-xs opacity-80 font-medium">Total Bonus Earned</p>
                <p className="text-2xl font-bold mt-1">${totalBonus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 border border-border rounded-xl p-3 text-center">
            <Users className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{completedReferrals.length}</p>
            <p className="text-xs text-muted-foreground font-medium">Active</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 mx-auto text-blue-600 mb-1" />
            <p className="text-lg font-bold text-blue-700">{pendingReferrals.length}</p>
            <p className="text-xs text-blue-600 font-medium">Pending</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <Award className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
            <p className="text-lg font-bold text-emerald-700">{referrals.length}</p>
            <p className="text-xs text-emerald-600 font-medium">Total</p>
          </div>
        </div>

        {/* Analytics Dashboard Toggle */}
        {completedReferrals.length > 0 && (
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => setShowDashboard(!showDashboard)}
          >
            {showDashboard ? 'Hide Analytics' : 'View Analytics Dashboard'}
          </Button>
        )}

        {/* Analytics Dashboard */}
        {showDashboard && completedReferrals.length > 0 && (
          <ReferralActivityDashboard referrals={completedReferrals} />
        )}

        {/* Referral History */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Referral History</h2>
          </div>

          {referrals.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center space-y-3 bg-card rounded-2xl border border-border p-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm">No referrals yet</p>
                <p className="text-xs text-muted-foreground mt-1">Share your link and start earning bonuses</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map(ref => (
                <div key={ref.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ref.referred_email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ref.created_date ? new Date(ref.created_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {ref.bonus_amount && (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">${ref.bonus_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs text-muted-foreground">{ref.bonus_currency}</p>
                      </div>
                    )}
                    <div className="flex-shrink-0">
                      {ref.status === 'completed' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                      {ref.status === 'pending' && <Clock className="w-5 h-5 text-blue-500" />}
                      {ref.status === 'cancelled' && <XCircle className="w-5 h-5 text-destructive" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
