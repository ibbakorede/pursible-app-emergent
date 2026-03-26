import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { useState } from 'react';
import ResponsiveTable from '@/components/admin/ResponsiveTable';

export default function AdminTransactions() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-txs'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 200),
  });

  const filtered = transactions.filter(tx => {
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    if (search && !tx.reference_id?.toLowerCase().includes(search.toLowerCase()) && !tx.user_email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (isLoading) return <LoadingSpinner />;

  const columns = [
    { key: 'reference', label: 'Reference' },
    { key: 'user', label: 'User' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
  ];

  const renderRow = (tx) => (
    <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/50 focus-within:bg-primary/5 transition-colors">
      <td className="px-4 py-4 font-mono text-xs">{tx.reference_id || '-'}</td>
      <td className="px-4 py-4 text-sm">{tx.user_email}</td>
      <td className="px-4 py-4 capitalize text-sm">{tx.type}</td>
      <td className="px-4 py-4 font-medium text-sm">{formatCurrency(tx.from_amount, tx.from_currency)} {tx.to_currency ? `→ ${formatCurrency(tx.to_amount, tx.to_currency)}` : ''}</td>
      <td className="px-4 py-4"><StatusBadge status={tx.status} /></td>
      <td className="px-4 py-4 text-sm text-muted-foreground">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, h:mm a') : '-'}</td>
    </tr>
  );

  const renderCard = (tx) => (
    <>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Reference:</span>
        <span className="font-mono text-xs">{tx.reference_id || '-'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">User:</span>
        <span className="text-sm">{tx.user_email}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Type:</span>
        <span className="capitalize text-sm">{tx.type}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Amount:</span>
        <span className="font-medium text-sm">{formatCurrency(tx.from_amount, tx.from_currency)} {tx.to_currency ? `→ ${formatCurrency(tx.to_amount, tx.to_currency)}` : ''}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Status:</span>
        <StatusBadge status={tx.status} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Date:</span>
        <span className="text-sm">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, h:mm a') : '-'}</span>
      </div>
    </>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Transactions</h1>
      
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input 
            placeholder="Search by ref or email..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pl-9 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Search transactions"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-36 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="conversion">Conversion</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="initiated">Initiated</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ResponsiveTable 
        columns={columns}
        data={filtered}
        renderRow={renderRow}
        renderCard={renderCard}
      />
    </div>
  );
}