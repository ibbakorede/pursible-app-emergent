/**
 * ConvertFunds - Currency Conversion Flow
 * Refactored to use smaller, single-responsibility components
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { triggerHaptic } from '@/lib/haptics';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Import step components
import {
  CurrencyPicker,
  ConversionInput,
  ConversionConfirm,
  ConversionSuccess,
  isValidPair
} from '@/components/convert';

export default function ConvertFunds() {
  const { user, isLoadingAuth } = useAuth();
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('NGN');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('input');
  const [pickingFor, setPickingFor] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch wallets
  const { data: wallets = [], isLoading: loadingWallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => base44.entities.Wallet.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  // Fetch rates
  const { data: rates = [], refetch: refetchRates } = useQuery({
    queryKey: ['rates'],
    queryFn: () => base44.entities.ConversionRate.list(),
    refetchInterval: 30000,
  });

  // Fetch recent transactions
  const { data: recentTxns = [] } = useQuery({
    queryKey: ['conv-transactions', user?.email],
    queryFn: () => base44.entities.Transaction.filter({ user_email: user?.email, type: 'conversion' }, '-created_date', 5),
    enabled: !!user?.email,
  });

  // Memoized rate map
  const rateMap = useMemo(() => {
    const map = {};
    rates.forEach(r => { map[`${r.from_currency}->${r.to_currency}`] = r; });
    return map;
  }, [rates]);

  // Derived values
  const currentRate = rateMap[`${fromCurrency}->${toCurrency}`];
  const rate = currentRate?.rate || 1;
  const fee = currentRate?.fee_percentage ?? 0.5;
  const numAmount = Number(amount) || 0;
  const feeAmount = (numAmount * fee) / 100;
  const netAmount = numAmount - feeAmount;
  const receiveAmount = netAmount * rate;

  const sourceWallet = wallets.find(w => w.currency === fromCurrency);
  const availableBalance = sourceWallet?.available_balance || 0;
  const canProceed = numAmount > 0 && numAmount <= availableBalance && fromCurrency !== toCurrency && currentRate;

  // Swap currencies
  const handleSwapCurrencies = () => {
    if (isValidPair(toCurrency, fromCurrency)) {
      triggerHaptic('medium');
      const newFrom = toCurrency;
      const newTo = fromCurrency;
      setFromCurrency(newFrom);
      setToCurrency(newTo);
      setAmount('');
    }
  };

  // Currency selection handler
  const handleCurrencySelect = (currency) => {
    if (pickingFor === 'from') {
      setFromCurrency(currency);
    } else {
      setToCurrency(currency);
    }
    setAmount('');
    setPickingFor(null);
  };

  // Conversion mutation
  const createConversion = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('swapCurrency', {
        fromCurrency,
        toCurrency,
        amount: numAmount,
        confirmed: true,
      });
      if (result.kycBlocked) {
        navigate('/kyc');
        throw new Error(result.error || 'Identity verification required');
      }
      if (!result.success) {
        throw new Error(result.error || 'Swap failed');
      }
      return result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['wallets'] });
      const previousWallets = queryClient.getQueryData(['wallets']);
      
      const optimisticWallets = wallets.map(w => {
        if (w.id === sourceWallet?.id) {
          return { ...w, available_balance: w.available_balance - numAmount };
        }
        if (w.currency === toCurrency) {
          return { ...w, available_balance: w.available_balance + receiveAmount };
        }
        return w;
      });
      
      queryClient.setQueryData(['wallets'], optimisticWallets);
      return { previousWallets };
    },
    onSuccess: (result) => {
      triggerHaptic('success');
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setLastTransaction(result.transaction);
      setStep('success');
    },
    onError: (err, _, context) => {
      if (context?.previousWallets) {
        queryClient.setQueryData(['wallets'], context.previousWallets);
        toast.error('Conversion failed. Your wallet balance has been restored.');
      } else {
        toast.error('Conversion failed. Please try again.');
      }
    },
  });

  // Loading state
  if (isLoadingAuth || (loadingWallets && !!user?.email)) {
    return <LoadingSpinner />;
  }

  // Currency picker view
  if (pickingFor) {
    return (
      <CurrencyPicker
        pickingFor={pickingFor}
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        wallets={wallets}
        onSelect={handleCurrencySelect}
        onClose={() => setPickingFor(null)}
      />
    );
  }

  // Success view
  if (step === 'success') {
    return (
      <ConversionSuccess
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        amount={amount}
        receiveAmount={receiveAmount}
        rate={rate}
        transaction={lastTransaction}
        onNewSwap={() => { setStep('input'); setAmount(''); setLastTransaction(null); }}
      />
    );
  }

  // Confirm view
  if (step === 'confirm') {
    return (
      <ConversionConfirm
        fromCurrency={fromCurrency}
        toCurrency={toCurrency}
        amount={amount}
        rate={rate}
        fee={fee}
        receiveAmount={receiveAmount}
        onBack={() => setStep('input')}
        onConfirm={() => createConversion.mutate()}
        onRefreshRates={() => refetchRates()}
        isSubmitting={createConversion.isPending}
        rateExpirySeconds={60}
      />
    );
  }

  // Input view (default)
  return (
    <ConversionInput
      fromCurrency={fromCurrency}
      toCurrency={toCurrency}
      amount={amount}
      setAmount={setAmount}
      availableBalance={availableBalance}
      rate={rate}
      fee={fee}
      receiveAmount={receiveAmount}
      lastUpdated={null}
      recentTxns={recentTxns}
      onPickFrom={() => setPickingFor('from')}
      onPickTo={() => setPickingFor('to')}
      onSwap={handleSwapCurrencies}
      onRefreshRates={() => refetchRates()}
      onContinue={() => setStep('confirm')}
      canProceed={canProceed}
    />
  );
}
