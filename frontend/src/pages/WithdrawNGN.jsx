/**
 * WithdrawNGN - NGN Withdrawal Flow
 * Refactored to use smaller, single-responsibility components
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useHaptics } from '@/hooks/useHaptics';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Import step components
import { AmountStep, BankSelectStep, ConfirmStep, SuccessStep, WITHDRAWAL_FEE } from '@/components/withdraw';

export default function WithdrawNGN() {
  const { user, isLoadingAuth } = useAuth();
  const { confirm: confirmHaptic, light: lightHaptic } = useHaptics();
  const [amount, setAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [step, setStep] = useState('main');
  const [txRef, setTxRef] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch wallets
  const { data: wallets = [], isLoading: loadingWallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => base44.entities.Wallet.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  // Fetch bank accounts
  const { data: bankAccounts = [], isLoading: loadingBanks } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => base44.entities.BankAccount.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  // Fetch recent transactions
  const { data: recentTxns = [] } = useQuery({
    queryKey: ['transactions', user?.email],
    queryFn: () => base44.entities.Transaction.filter({ user_email: user?.email, type: 'withdrawal' }, '-created_date', 5),
    enabled: !!user?.email,
  });

  // Derived values
  const ngnWallet = wallets.find(w => w.currency === 'NGN');
  const balance = ngnWallet?.available_balance || 0;
  const bank = bankAccounts.find(b => b.id === selectedBankId);
  const numAmount = Number(amount) || 0;

  // Auto-select default bank
  useEffect(() => {
    if (!selectedBankId && bankAccounts.length > 0) {
      const def = bankAccounts.find(b => b.is_default) || bankAccounts[0];
      setSelectedBankId(def.id);
    }
  }, [bankAccounts, selectedBankId]);

  // Withdrawal mutation
  const withdraw = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('withdraw', {
        currency: 'NGN',
        amount: numAmount,
        destination: { bankAccountId: selectedBankId },
      });
      if (!result.success) {
        if (result.kycBlocked) {
          navigate('/kyc');
          throw new Error('KYC required');
        }
        throw new Error(result.error || 'Withdrawal failed');
      }
      return result;
    },
    onSuccess: (data) => {
      confirmHaptic?.();
      setTxRef(data.transaction?.referenceId || '');
      setStep('success');
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error) => {
      if (error.message !== 'KYC required') {
        toast.error(error.message || 'Withdrawal failed');
      }
    },
  });

  // Reset flow
  const resetFlow = () => {
    setAmount('');
    setStep('main');
    setTxRef('');
  };

  // Loading state
  if (isLoadingAuth || loadingWallets) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Render current step
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10">
        {step === 'main' && (
          <AmountStep
            amount={amount}
            setAmount={setAmount}
            balance={balance}
            bank={bank}
            recentTxns={recentTxns}
            onContinue={() => setStep('bank')}
            lightHaptic={lightHaptic}
          />
        )}

        {step === 'bank' && (
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
        )}

        {step === 'confirm' && (
          <ConfirmStep
            bank={bank}
            amount={amount}
            onBack={() => setStep('bank')}
            onConfirm={() => withdraw.mutate()}
            isSubmitting={withdraw.isPending}
          />
        )}

        {step === 'success' && (
          <SuccessStep
            bank={bank}
            amount={amount}
            txRef={txRef}
            onReset={resetFlow}
          />
        )}
      </div>
    </div>
  );
}
