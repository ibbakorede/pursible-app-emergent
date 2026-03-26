import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, User, ArrowLeftRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currencies';
import StatusBadge from '@/components/shared/StatusBadge';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import EmptyState from '@/components/shared/EmptyState';

export default function AdminSupport() {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => base44.entities.User.list() });
  const { data: wallets = [] } = useQuery({ queryKey: ['admin-wallets'], queryFn: () => base44.entities.Wallet.list() });
  const { data: transactions = [] } = useQuery({ queryKey: ['admin-txs'], queryFn: () => base44.entities.Transaction.list('-created_date', 200) });

  const filteredUsers = search.length >= 2 ? users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const userWallets = selectedUser ? wallets.filter(w => w.user_email === selectedUser.email) : [];
  const userTx = selectedUser ? transactions.filter(t => t.user_email === selectedUser.email).slice(0, 10) : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Support Tools</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search users by email or name..." value={search} onChange={e => { setSearch(e.target.value); setSelectedUser(null); }} className="pl-9 rounded-xl" />
      </div>

      {filteredUsers.length > 0 && !selectedUser && (
        <Card className="divide-y divide-border">
          {filteredUsers.slice(0, 5).map(u => (
            <div key={u.id} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50" onClick={() => setSelectedUser(u)}>
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{u.full_name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {selectedUser && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold mb-3">User Profile</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground">Name</p><p className="font-medium">{selectedUser.full_name}</p></div>
              <div><p className="text-muted-foreground">Email</p><p className="font-medium">{selectedUser.email}</p></div>
              <div><p className="text-muted-foreground">Role</p><p className="font-medium capitalize">{selectedUser.role || 'user'}</p></div>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Wallets</h3>
            {userWallets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No wallets found</p>
            ) : (
              <div className="space-y-2">
                {userWallets.map(w => (
                  <div key={w.id} className="flex items-center gap-3">
                    <CurrencyIcon currency={w.currency} size="sm" />
                    <span className="flex-1 text-sm font-medium">{w.currency}</span>
                    <span className="font-semibold">{formatCurrency(w.available_balance, w.currency)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold mb-3">Recent Transactions</h3>
            {userTx.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions found</p>
            ) : (
              <div className="space-y-2">
                {userTx.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 text-sm">
                    <span className="capitalize flex-1">{tx.type}</span>
                    <span className="font-medium">{formatCurrency(tx.from_amount, tx.from_currency)}</span>
                    <StatusBadge status={tx.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {!selectedUser && filteredUsers.length === 0 && search.length >= 2 && (
        <EmptyState icon={Search} title="No users found" description="Try a different search term" />
      )}
    </div>
  );
}