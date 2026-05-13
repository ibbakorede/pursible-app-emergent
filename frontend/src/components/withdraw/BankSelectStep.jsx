/**
 * BankSelectStep - Bank selection step for withdrawals
 */
import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomSheetSelect from '@/components/shared/BottomSheetSelect';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  ArrowLeft, Building2, Check, Loader2, Plus, Star, AlertCircle,
  BadgeCheck, ChevronRight, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { NIGERIAN_BANKS } from './withdrawConstants';

export default function BankSelectStep({
  bankAccounts,
  selectedBankId,
  setSelectedBankId,
  onBack,
  onContinue,
  user,
  queryClient,
  loadingBanks
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_name: '', account_number: '' });
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Memoized lookup function to avoid recreating on each render
  const lookupAccount = useCallback(async (accountNumber, bankName) => {
    setIsLoadingName(true);
    setLookupError('');
    setIsVerified(false);
    setForm(prev => ({ ...prev, account_name: '' }));
    try {
      const response = await base44.functions.invoke('verifyBankAccount', {
        accountNumber,
        bankName,
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
  }, []);

  // Auto-lookup account name when both bank and 10-digit account are set
  useEffect(() => {
    if (form.account_number.length !== 10 || !form.bank_name) return;
    
    const debouncedLookup = debounce(() => {
      lookupAccount(form.account_number, form.bank_name);
    }, 800);
    
    debouncedLookup();
    return () => debouncedLookup.cancel();
  }, [form.account_number, form.bank_name, lookupAccount]);

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

  // Add new bank form
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

  // Bank selection list
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
