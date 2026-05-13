import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Trash2, Building2, Star, ShieldCheck, CreditCard, ChevronRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BottomSheetSelect from '@/components/shared/BottomSheetSelect';
import { toast } from 'sonner';

const BANK_CODES = {
  'Access Bank': '044',
  'Carbon': '565',
  'Citibank Nigeria': '023',
  'Ecobank Nigeria': '050',
  'Fidelity Bank': '070',
  'First Bank of Nigeria': '011',
  'First City Monument Bank (FCMB)': '030',
  'Guaranty Trust Bank (GTBank)': '058',
  'Heritage Bank': '051',
  'Jaiz Bank': '089',
  'Keystone Bank': '082',
  'Kuda Bank': '090',
  'Moniepoint': '999993',
  'OPay': '999991',
  'PalmPay': '999992',
  'Parallex Bank': '526',
  'Polaris Bank': '076',
  'Providus Bank': '101',
  'Stanbic IBTC Bank': '039',
  'Standard Chartered Bank': '068',
  'Sterling Bank': '232',
  'SunTrust Bank': '100',
  'Union Bank': '032',
  'United Bank for Africa (UBA)': '033',
  'Unity Bank': '215',
  'Wema Bank': '035',
  'Zenith Bank': '057',
};

// Sorted A-Z for display
const NIGERIAN_BANKS = Object.keys(BANK_CODES).sort((a, b) => a.localeCompare(b));

export default function BankAccounts() {
  const [showAdd, setShowAdd] = useState(false);
  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [form, setForm] = useState({ bank_name: '', account_name: '', account_number: '', bank_code: '' });
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [lookupBypass, setLookupBypass] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const queryClient = useQueryClient();

  // Auto-lookup account name when account number is 10 digits AND bank is selected
  useEffect(() => {
    if (form.account_number.length !== 10 || !form.bank_name) return;

    const lookup = debounce(async () => {
      setIsLoadingName(true);
      setLookupError('');
      setLookupBypass(false);
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
          // TODO: Remove bypass when Flutterwave keys are live — set isVerified=true for test mode
          setLookupBypass(true);
          setIsVerified(true);
        }
      } catch (err) {
        // TODO: Remove bypass when Flutterwave keys are live — set isVerified=true for test mode
        setLookupBypass(true);
        setIsVerified(true);
      } finally {
        setIsLoadingName(false);
      }
    }, 800);

    lookup();
    return () => lookup.cancel();
  }, [form.account_number, form.bank_name]);

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: () => base44.entities.BankAccount.filter({ user_email: user?.email }),
    enabled: !!user?.email,
  });

  const addAccount = useMutation({
    mutationFn: () => base44.entities.BankAccount.create({
      ...form,
      user_email: user.email,
      currency: 'NGN',
      is_default: accounts.length === 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      setShowAdd(false);
      setForm({ bank_name: '', account_name: '', account_number: '', bank_code: '' });
      toast.success('Bank account added successfully');
    },
    onError: () => toast.error('Failed to add bank account. Please try again.'),
  });

  const deleteAccount = useMutation({
    mutationFn: (id) => base44.entities.BankAccount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Bank account removed');
    },
    onError: () => toast.error('Failed to delete bank account. Please try again.'),
  });

  const setDefault = useMutation({
    mutationFn: async (id) => {
      await Promise.all(accounts.map(acc =>
        base44.entities.BankAccount.update(acc.id, { is_default: acc.id === id })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Default account updated');
    },
    onError: () => toast.error('Failed to update default account. Please try again.'),
  });

  const handleSelectBank = (bankName) => {
    const bankCode = BANK_CODES[bankName];
    setForm(prev => ({ ...prev, bank_name: bankName, bank_code: bankCode, account_name: '' }));
    setIsVerified(false);
    setLookupError('');
    setLookupBypass(false);
  };

  const resetForm = () => {
    setForm({ bank_name: '', account_name: '', account_number: '', bank_code: '' });
    setIsVerified(false);
    setLookupError('');
    setLookupBypass(false);
    setShowAdd(false);
  };

  if (isLoading) return <LoadingSpinner />;

  const defaultAccount = accounts.find(a => a.is_default);
  const otherAccounts = accounts.filter(a => !a.is_default);

  return (
    <div className="px-4 pt-6 pb-10 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="p-2 rounded-xl bg-card hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label="Back to profile">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Bank Accounts</h1>
            <p className="text-xs text-muted-foreground">NGN withdrawals & deposits</p>
          </div>
        </div>
        <Button size="sm" className="rounded-xl" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Account
        </Button>
      </div>

      {/* TODO: Remove this banner and re-enable isVerified on save button once Flutterwave keys are configured */}
      <div className="flex gap-3 bg-amber-50 border border-amber-300 rounded-2xl p-4">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">Bank verification unavailable in test mode — will be enabled in production.</p>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 bg-primary/5 border border-primary/10 rounded-2xl p-4">
        <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Secure Bank Linking</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your bank details are encrypted and used only for NGN withdrawals and deposits. You can add up to 5 accounts.
          </p>
        </div>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No bank accounts linked"
          description="Add a Nigerian bank account to withdraw NGN or receive deposits directly."
          action={
            <Button onClick={() => setShowAdd(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> Link Bank Account
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {/* Default account */}
          {defaultAccount && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Default Account</p>
              <AccountCard
                acc={defaultAccount}
                isDefault
                onDelete={() => deleteAccount.mutate(defaultAccount.id)}
                onSetDefault={() => {}}
                isDeleting={deleteAccount.isPending}
              />
            </div>
          )}

          {/* Other accounts */}
          {otherAccounts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Other Accounts</p>
              <div className="space-y-3">
                {otherAccounts.map(acc => (
                  <AccountCard
                    key={acc.id}
                    acc={acc}
                    isDefault={false}
                    onDelete={() => deleteAccount.mutate(acc.id)}
                    onSetDefault={() => setDefault.mutate(acc.id)}
                    isDeleting={deleteAccount.isPending}
                    isSettingDefault={setDefault.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {accounts.length >= 5 && (
            <div className="flex gap-2 items-center text-xs text-amber-600 bg-amber-50 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Maximum of 5 bank accounts reached.
            </div>
          )}
        </div>
      )}

      {/* Add Account Dialog */}
      <Dialog open={showAdd} onOpenChange={resetForm}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Link Bank Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {/* Bank name with bottom sheet select */}
            <BottomSheetSelect
              open={bankSheetOpen}
              onOpenChange={setBankSheetOpen}
              value={form.bank_name}
              onValueChange={handleSelectBank}
              placeholder="Select Bank"
              searchPlaceholder="Search bank name..."
              options={NIGERIAN_BANKS.map(b => ({ value: b, label: b }))}
            >
              <Input
                placeholder="Select bank name..."
                value={form.bank_name}
                onChange={e => setForm({ ...form, bank_name: e.target.value })}
                onFocus={() => setBankSheetOpen(true)}
                readOnly
                className="rounded-xl cursor-pointer"
              />
            </BottomSheetSelect>

            <Input
              placeholder="Account Number (10 digits)"
              value={form.account_number}
              onChange={e => {
                setForm(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '').slice(0, 10), account_name: '' }));
                setIsVerified(false);
                setLookupError('');
                setLookupBypass(false);
              }}
              className="rounded-xl"
              inputMode="numeric"
            />
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
            {lookupBypass && !lookupError && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700">Verification unavailable — you can still save this account and verify it later.</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={resetForm}>Cancel</Button>
              <Button
                className="flex-1 rounded-xl h-11"
                disabled={!form.bank_name || form.account_number.length < 10 || addAccount.isPending || accounts.length >= 5} /* TODO: restore !isVerified condition once Flutterwave keys are set */
                onClick={() => addAccount.mutate()}
              >
                {addAccount.isPending ? 'Linking...' : 'Link Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AccountCard({ acc, isDefault, onDelete, onSetDefault, isDeleting, isSettingDefault }) {
  return (
    <div className={`bg-card rounded-2xl p-4 border-2 transition-colors ${isDefault ? 'border-primary/20' : 'border-transparent'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDefault ? 'bg-primary/10' : 'bg-muted'}`}>
          <Building2 className={`w-5 h-5 ${isDefault ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold truncate">{acc.account_name}</p>
            {isDefault && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
            {acc.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">{acc.bank_name}</p>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            •••• •••• {acc.account_number?.slice(-4)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!isDefault && (
            <button
              onClick={onSetDefault}
              disabled={isSettingDefault}
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-amber-500 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Set as default account"
            >
              <Star className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Delete bank account"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${acc.is_verified ? 'bg-green-500' : 'bg-amber-400'}`} />
          {acc.is_verified ? 'Verified' : 'Pending verification'}
        </span>
        <span className="font-medium text-foreground">NGN</span>
      </div>
    </div>
  );
}