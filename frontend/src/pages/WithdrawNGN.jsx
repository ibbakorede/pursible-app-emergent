import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useHaptics } from '@/hooks/useHaptics';
import { debounce } from 'lodash';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomSheetSelect from '@/components/shared/BottomSheetSelect';
import {
  ArrowLeft, Check, Loader2, Building2, ChevronRight, Star, AlertCircle,
  BadgeCheck, Clock, ArrowDownToLine, Plus, TrendingDown,
  Wallet, Shield, Zap, History, ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/currencies';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const NIGERIAN_BANKS = [
  'Access Bank', 'Carbon', 'Citibank Nigeria', 'Ecobank Nigeria', 'Fidelity Bank',
  'First Bank of Nigeria', 'First City Monument Bank (FCMB)', 'Guaranty Trust Bank (GTBank)',
  'Heritage Bank', 'Jaiz Bank', 'Keystone Bank', 'Kuda Bank', 'Moniepoint',
  'OPay', 'PalmPay', 'Parallex Bank', 'Polaris Bank', 'Providus Bank',
  'Stanbic IBTC Bank', 'Standard Chartered Bank', 'Sterling Bank', 'SunTrust Bank',
  'Union Bank', 'United Bank for Africa (UBA)', 'Unity Bank', 'Wema Bank', 'Zenith Bank',
];

const WITHDRAWAL_FEE = 50;
const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export default function WithdrawNGN() {
  const { user, isLoadingAuth } = useAuth();
  const { confirm: confirmHaptic, light: lightHaptic } = useHaptics();
  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [step, setStep] = useState('main');
  const [txRef, setTxRef] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: wallets = [], isLoading: loadingWallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => base44.entities.Wallet.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: bankAccounts = [], isLoading: loadingBanks } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => base44.entities.BankAccount.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: recentTxns = [] } = useQuery({
    queryKey: ['transactions', user?.email],
    queryFn: () => base44.entities.Transaction.filter({ user_email: user?.email, type: 'withdrawal' }, '-created_date', 5),
    enabled: !!user?.email,
  });

  const ngnWallet = wallets.find(w => w.currency === 'NGN');
  const balance = ngnWallet?.available_balance || 0;
  const bank = bankAccounts.find(b => b.id === selectedBankId);
  const numAmount = Number(amount) || 0;
  const youReceive = numAmount - WITHDRAWAL_FEE;

  useEffect(() => {
    if (!selectedBankId && bankAccounts.length > 0) {
      const def = bankAccounts.find(b => b.is_default) || bankAccounts[0];
      setSelectedBankId(def.id);
    }
  }, [bankAccounts, selectedBankId]);

  const withdraw = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('withdraw', {
        currency: 'NGN',
        amount: numAmount,
        destination: { bankAccountId: selectedBankId },
      });
      // KYC gate: redirect to /kyc if user is not verified
      if (result.kycBlocked) {
        navigate('/kyc');
        throw new Error(result.error || 'Identity verification required before withdrawing.');
      }
      if (!result.success) throw new Error(result.error || 'Withdrawal failed. Please try again.');
      if (result.transaction?.referenceId) setTxRef(result.transaction.referenceId);
      return result;
    },
    onMutate: async () => {
      // Optimistically update wallet balance
      await queryClient.cancelQueries({ queryKey: ['wallets'] });
      const previousWallets = queryClient.getQueryData(['wallets']);
      
      const optimisticWallets = wallets.map(w => {
        if (w.id === ngnWallet?.id) {
          return { ...w, available_balance: Math.max(0, w.available_balance - numAmount) };
        }
        return w;
      });
      
      queryClient.setQueryData(['wallets'], optimisticWallets);
      return { previousWallets };
    },
    onSuccess: () => {
      confirmHaptic();
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setStep('success');
    },
    onError: (err, vars, context) => {
       if (context?.previousWallets) {
         queryClient.setQueryData(['wallets'], context.previousWallets);
         toast.error('Withdrawal failed. Your wallet balance has been restored.');
       } else {
         toast.error('Withdrawal failed. Please try again.');
       }
     },
  });

  if (isLoadingAuth || (loadingWallets && !!user?.email)) return <LoadingSpinner />;

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 pt-12 pb-10 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-12 h-12 text-emerald-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-1">Withdrawal Submitted</h2>
          <p className="text-muted-foreground text-sm mb-4">Your funds are on their way</p>
          <p className="text-4xl font-bold text-emerald-600 mb-1">{formatCurrency(youReceive, 'NGN')}</p>
          <p className="text-sm text-muted-foreground mb-1">to {bank?.account_name}</p>
          <p className="text-xs text-muted-foreground mb-8">{bank?.bank_name} · ····{bank?.account_number?.slice(-4)}</p>

          <div className="w-full bg-card border border-border rounded-2xl p-5 space-y-3 mb-4 text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Transaction Details</p>
            {[
              ['Reference', txRef],
              ['Amount sent', formatCurrency(numAmount, 'NGN')],
              ['Processing fee', `-${formatCurrency(WITHDRAWAL_FEE, 'NGN')}`],
              ['You receive', formatCurrency(youReceive, 'NGN')],
            ].map(([label, value], i) => (
              <div key={label} className={`flex justify-between text-sm ${i === 3 ? 'border-t pt-3 font-semibold' : ''}`}>
                <span className="text-muted-foreground">{label}</span>
                <span className={i === 3 ? 'text-emerald-600' : 'font-medium font-mono text-xs'}>{value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-8 w-full">
            <Clock className="w-4 h-4 flex-shrink-0" />
            Funds will arrive within 1–24 hours
          </div>

          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => navigate('/transactions')}>
              <History className="w-4 h-4 mr-1.5" /> View History
            </Button>
            <Button className="flex-1 rounded-xl h-11" onClick={() => { setStep('main'); setAmount(''); }}>
              New Withdrawal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirm ───────────────────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep('bank')} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label="Back to bank selection">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Confirm Withdrawal</h1>
              <p className="text-xs text-muted-foreground">Review before submitting</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-6 text-white text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-6 h-6" />
            </div>
            <p className="text-sm opacity-75 mb-1">You're withdrawing</p>
            <p className="text-4xl font-bold mb-1">{formatCurrency(numAmount, 'NGN')}</p>
            <p className="text-sm opacity-60">from your NGN Wallet</p>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Breakdown</p>
            </div>
            {[
              ['Withdrawal amount', formatCurrency(numAmount, 'NGN'), false, false],
              ['Processing fee', `-${formatCurrency(WITHDRAWAL_FEE, 'NGN')}`, true, false],
              ['You receive', formatCurrency(youReceive, 'NGN'), false, true],
            ].map(([label, value, muted, highlight]) => (
              <div key={label} className="flex justify-between items-center px-4 py-3.5 border-b border-border last:border-0">
                <span className={`text-sm ${muted ? 'text-muted-foreground' : highlight ? 'font-semibold' : ''}`}>{label}</span>
                <span className={`text-sm font-semibold ${highlight ? 'text-emerald-600 text-base' : muted ? 'text-muted-foreground' : ''}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Receiving Account</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold">{bank?.account_name}</p>
                  {bank?.is_default && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                </div>
                <p className="text-xs text-muted-foreground">{bank?.bank_name}</p>
                <p className="text-xs text-muted-foreground font-mono">···· ···· {bank?.account_number?.slice(-4)}</p>
              </div>
              {bank?.is_verified && <BadgeCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/60 rounded-xl px-4 py-3">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
            By confirming, you authorize this withdrawal. Funds will be deducted from your NGN wallet immediately.
          </div>

          <Button
            className="w-full rounded-xl h-12 text-base"
            onClick={() => {
              confirmHaptic();
              withdraw.mutate();
            }}
            disabled={withdraw.isPending}
          >
            {withdraw.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...</>
              : <><ArrowDownToLine className="w-4 h-4 mr-2" /> Confirm Withdrawal</>}
          </Button>
        </div>
      </div>
    );
  }

  // ── Bank selection ────────────────────────────────────────────────────────
  if (step === 'bank') {
    return (
      <BankSelectStep
        bankAccounts={bankAccounts}
        selectedBankId={selectedBankId}
        setSelectedBankId={setSelectedBankId}
        onBack={() => setStep('main')}
        onContinue={() => setStep('confirm')}
        user={user}
        queryClient={queryClient}
        loadingBanks={loadingBanks}
      />
    );
  }

  // ── Main dashboard ────────────────────────────────────────────────────────
  const isAmountValid = numAmount > WITHDRAWAL_FEE && numAmount <= balance;
  const progressPct = balance > 0 ? Math.min((numAmount / balance) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/wallet" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label="Back to wallet">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Withdraw NGN</h1>
            <p className="text-xs text-muted-foreground">Send funds to your bank account</p>
          </div>
        </div>

        {/* Balance hero card */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs opacity-70">NGN Wallet</p>
                  <p className="text-xs opacity-50">Available</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-medium">Active</span>
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{formatCurrency(balance, 'NGN')}</p>
            <p className="text-xs opacity-60">Available for withdrawal</p>

            {numAmount > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs opacity-70 mb-1.5">
                  <span>Withdrawing</span>
                  <span>{progressPct.toFixed(0)}% of balance</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${numAmount > balance ? 'bg-red-400' : 'bg-emerald-400'}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Amount input card */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <p className="text-sm font-semibold">Withdrawal Amount</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₦</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="rounded-xl text-2xl h-16 pl-10 font-bold border-2 focus-visible:border-purple-400 focus-visible:ring-0 [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                inputMode="decimal"
              />
            </div>

            {numAmount > 0 && numAmount <= WITHDRAWAL_FEE && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Minimum withdrawal must exceed the ₦50 fee
              </p>
            )}
            {numAmount > balance && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Amount exceeds available balance
              </p>
            )}

            {/* Quick amounts */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium">Quick select</p>
              <div className="flex flex-wrap gap-2">
                {balance > 0 && (
                  <button
                    onClick={() => setAmount(String(balance))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${numAmount === balance ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 hover:bg-purple-100 text-purple-600'}`}
                  >
                    MAX
                  </button>
                )}
                {QUICK_AMOUNTS.filter(q => q <= balance).map(q => (
                  <button
                    key={q}
                    onClick={() => setAmount(String(q))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${numAmount === q ? 'bg-purple-600 text-white shadow-sm' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
                  >
                    {formatCurrency(q, 'NGN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Fee summary */}
            {numAmount > WITHDRAWAL_FEE && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Processing fee</span>
                  <span>-{formatCurrency(WITHDRAWAL_FEE, 'NGN')}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-purple-200 pt-2">
                  <span className="text-sm">You receive</span>
                  <span className="text-emerald-600 text-base">{formatCurrency(youReceive, 'NGN')}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Destination bank */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <p className="text-sm font-semibold">Destination Account</p>
            <button onClick={() => setStep('bank')} className="text-xs font-semibold text-primary">Change</button>
          </div>
          {loadingBanks ? (
            <div className="p-5 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : bank ? (
            <div className="p-5 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm">{bank.account_name}</p>
                  {bank.is_default && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                  {bank.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-xs text-muted-foreground">{bank.bank_name}</p>
                <p className="text-xs text-muted-foreground font-mono">···· ···· {bank.account_number?.slice(-4)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <button onClick={() => setStep('bank')} className="w-full p-5 flex items-center gap-3 hover:bg-muted/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold">Add a bank account</p>
                <p className="text-xs text-muted-foreground">Link your Nigerian bank to continue</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
          )}
        </div>

        {/* Info badges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Shield, label: 'Secure', sub: 'Bank-grade encryption' },
            { icon: Clock, label: '1–24 hrs', sub: 'Estimated arrival' },
            { icon: Zap, label: '₦50 fee', sub: 'Flat processing fee' },
          ].map(({ icon: Icon, label, sub }, idx) => (
            <div key={idx} className="bg-card border border-border rounded-xl p-3 text-center">
              <Icon className="w-4 h-4 text-purple-600 mx-auto mb-1.5" />
              <p className="text-xs font-semibold">{label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{sub}</p>
            </div>
          ))}
        </div>

        {/* Recent withdrawals */}
        {recentTxns.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-muted/30">
              <p className="text-sm font-semibold">Recent Withdrawals</p>
            </div>
            <div className="divide-y divide-border">
              {recentTxns.slice(0, 3).map(tx => (
                <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                      <ArrowDownToLine className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{formatCurrency(tx.from_amount, 'NGN')}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    tx.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                    tx.status === 'failed' ? 'bg-red-50 text-red-700' : 'bg-muted text-muted-foreground'
                  }`}>{tx.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <Button
          className="w-full rounded-xl h-12 text-base bg-purple-600 hover:bg-purple-700"
          disabled={!isAmountValid || !selectedBankId}
          onClick={() => {
            lightHaptic();
            setStep('confirm');
          }}
        >
          Continue to Review <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

function BankSelectStep({ bankAccounts, selectedBankId, setSelectedBankId, onBack, onContinue, user, queryClient, loadingBanks }) {
  const [showAdd, setShowAdd] = useState(false);
  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_name: '', account_number: '' });
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Auto-lookup account name when both bank and 10-digit account are set
  useEffect(() => {
    if (form.account_number.length !== 10 || !form.bank_name) return;
    const lookup = debounce(async () => {
      setIsLoadingName(true);
      setLookupError('');
      setIsVerified(false);
      setForm(prev => ({ ...prev, account_name: '' }));
      try {
        const response = await base44.functions.invoke('verifyBankAccount', {
          accountNumber: form.account_number,
          bankName: form.bank_name,
        });
        if (response?.success && response.accountName) {
          setForm(prev => ({ ...prev, account_name: response.accountName }));
          setIsVerified(true);
        } else {
          setLookupError('Account not found. Please check the account number and bank selected.');
        }
      } catch {
        setLookupError('Account not found. Please check the account number and bank selected.');
      } finally {
        setIsLoadingName(false);
      }
    }, 800);
    lookup();
    return () => lookup.cancel();
  }, [form.account_number, form.bank_name]);

  const addAccount = useMutation({
    mutationFn: () => base44.entities.BankAccount.create({
      ...form, user_email: user.email, currency: 'NGN', is_default: bankAccounts.length === 0,
    }),
    onSuccess: (newAcc) => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      setSelectedBankId(newAcc.id);
      setShowAdd(false);
      setForm({ bank_name: '', account_name: '', account_number: '' });
      setIsVerified(false);
      toast.success('Bank account added!');
    },
    onError: () => toast.error('Failed to add bank account. Please try again.'),
  });

  const canAdd = isVerified && form.account_number.length === 10;

  if (showAdd) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowAdd(false)} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors" aria-label="Cancel adding bank account">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Add Bank Account</h1>
              <p className="text-xs text-muted-foreground">Link a Nigerian bank account</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Bank Name</label>
              <BottomSheetSelect
                open={bankSheetOpen}
                onOpenChange={setBankSheetOpen}
                value={form.bank_name}
                onValueChange={(bankName) => {
                  setForm(prev => ({ ...prev, bank_name: bankName, account_name: '' }));
                  setIsVerified(false);
                  setLookupError('');
                }}
                placeholder="Select Bank"
                searchPlaceholder="Search bank name..."
                options={NIGERIAN_BANKS.map(b => ({ value: b, label: b }))}
              >
                <Input
                  placeholder="Select your bank..."
                  value={form.bank_name}
                  onFocus={() => setBankSheetOpen(true)}
                  readOnly
                  className="rounded-xl cursor-pointer"
                />
              </BottomSheetSelect>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Account Number</label>
              <Input
                placeholder="10-digit account number"
                value={form.account_number}
                onChange={e => {
                  setForm(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '').slice(0, 10), account_name: '' }));
                  setIsVerified(false);
                  setLookupError('');
                }}
                inputMode="numeric"
                className="rounded-xl font-mono"
              />
            </div>
            {isLoadingName && (
              <p className="text-xs text-muted-foreground px-1">Looking up account name…</p>
            )}
            {isVerified && form.account_name && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-800">Account Name: {form.account_name}</p>
              </div>
            )}
            {lookupError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{lookupError}</p>
              </div>
            )}
          </div>

          <Button
            className="w-full rounded-xl h-12"
            disabled={!canAdd || addAccount.isPending}
            onClick={() => addAccount.mutate()}
          >
            {addAccount.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save & Select Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Select Account</h1>
              <p className="text-xs text-muted-foreground">Where should we send your NGN?</p>
            </div>
          </div>
          {bankAccounts.length > 0 && bankAccounts.length < 5 && (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          )}
        </div>

        {loadingBanks ? (
          <LoadingSpinner text="Loading accounts..." />
        ) : bankAccounts.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center">
              <Building2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">No bank accounts linked</p>
              <p className="text-sm text-muted-foreground mt-1">Add one to continue with your withdrawal</p>
            </div>
            <Button className="rounded-xl px-6" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Add Bank Account
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bankAccounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => setSelectedBankId(acc.id)}
                className={`w-full text-left flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${selectedBankId === acc.id ? 'border-purple-500 bg-purple-50/50' : 'border-border bg-card hover:border-purple-200'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${selectedBankId === acc.id ? 'bg-purple-100' : 'bg-muted'}`}>
                  <Building2 className={`w-6 h-6 ${selectedBankId === acc.id ? 'text-purple-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate">{acc.account_name}</p>
                    {acc.is_default && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{acc.bank_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">···· ···· {acc.account_number?.slice(-4)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {acc.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                  {selectedBankId === acc.id
                    ? <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white" /></div>
                    : <div className="w-6 h-6 rounded-full border-2 border-border" />
                  }
                </div>
              </button>
            ))}

            {bankAccounts.length < 5 && (
              <button
                onClick={() => setShowAdd(true)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-border hover:border-purple-300 hover:bg-purple-50/30 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Add new bank account</span>
              </button>
            )}
          </div>
        )}

        {bankAccounts.length > 0 && (
          <Button className="w-full rounded-xl h-12 bg-purple-600 hover:bg-purple-700" disabled={!selectedBankId} onClick={onContinue}>
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}