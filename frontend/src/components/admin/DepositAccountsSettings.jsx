import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from 'lucide-react';

const TYPE_LABELS = {
  usd_wire: '🇺🇸 USD Wire Transfer',
  stable_wallet: '🪙 Stablecoin Wallet Address',
  ngn_bank: '🇳🇬 NGN Bank Account',
};

const DEFAULT_FIELDS = {
  usd_wire: [
    { key: 'bank_name', label: 'Bank Name', value: '' },
    { key: 'account_name', label: 'Account Name', value: '' },
    { key: 'account_number', label: 'Account Number', value: '' },
    { key: 'routing_number', label: 'Routing Number', value: '' },
    { key: 'account_type', label: 'Account Type', value: 'Checking' },
    { key: 'swift_code', label: 'SWIFT Code', value: '' },
    { key: 'reference', label: 'Reference/Memo', value: 'Your registered email' },
  ],
  stable_wallet: [
    { key: 'network', label: 'Network', value: '' },
    { key: 'wallet_address', label: 'Wallet Address', value: '' },
    { key: 'currency', label: 'Currency', value: '' },
    { key: 'memo', label: 'Memo/Tag (if required)', value: '' },
  ],
  ngn_bank: [
    { key: 'bank_name', label: 'Bank Name', value: '' },
    { key: 'account_name', label: 'Account Name', value: '' },
    { key: 'account_number', label: 'Account Number', value: '' },
    { key: 'reference', label: 'Reference/Memo', value: 'Your registered email' },
  ],
};

function AccountEditor({ account, onSave, onDelete }) {
  const [fields, setFields] = useState(account.fields || []);
  const [label, setLabel] = useState(account.label || '');
  const [open, setOpen] = useState(false);

  const updateField = (i, val) => {
    const updated = fields.map((f, idx) => idx === i ? { ...f, value: val } : f);
    setFields(updated);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="font-medium text-sm">{TYPE_LABELS[account.type] || account.type}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Display Label</p>
            <Input value={label} onChange={e => setLabel(e.target.value)} className="h-8 rounded-lg" />
          </div>
          {fields.map((f, i) => (
            <div key={f.key}>
              <p className="text-xs text-muted-foreground mb-1">{f.label}</p>
              <Input
                value={f.value}
                onChange={e => updateField(i, e.target.value)}
                className="h-8 rounded-lg font-mono text-sm"
                placeholder={`Enter ${f.label ? f.label.toLowerCase() : 'value'}...`}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="rounded-lg" onClick={() => onSave(account.id, { label, fields })}>
              <Save className="w-3 h-3 mr-1" /> Save
            </Button>
            <Button size="sm" variant="destructive" className="rounded-lg" onClick={() => onDelete(account.id)}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DepositAccountsSettings() {
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['deposit-accounts'],
    queryFn: () => base44.entities.DepositAccount.list(),
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DepositAccount.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deposit-accounts'] }); toast.success('Account details saved'); },
  });

  const deleteAccount = useMutation({
    mutationFn: (id) => base44.entities.DepositAccount.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deposit-accounts'] }); toast.success('Deleted'); },
  });

  const createAccount = useMutation({
    mutationFn: (data) => base44.entities.DepositAccount.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deposit-accounts'] }); toast.success('Account added'); },
  });

  const addAccount = (type) => {
    createAccount.mutate({
      type,
      label: TYPE_LABELS[type],
      fields: DEFAULT_FIELDS[type],
      is_active: true,
    });
  };

  const existingTypes = accounts.map(a => a.type);
  const missingTypes = Object.keys(TYPE_LABELS).filter(t => !existingTypes.includes(t));

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Deposit Account Details</h3>
        {missingTypes.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {missingTypes.map(t => (
              <Button key={t} size="sm" variant="outline" className="rounded-lg text-xs" onClick={() => addAccount(t)}>
                <Plus className="w-3 h-3 mr-1" /> {TYPE_LABELS[t]}
              </Button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">These details are shown to users when they want to deposit funds.</p>

      {accounts.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">No deposit accounts configured yet. Click the buttons above to add them.</p>
      )}

      <div className="space-y-2">
        {accounts.map(account => (
          <AccountEditor
            key={account.id}
            account={account}
            onSave={(id, data) => updateAccount.mutate({ id, data })}
            onDelete={(id) => deleteAccount.mutate(id)}
          />
        ))}
      </div>
    </Card>
  );
}