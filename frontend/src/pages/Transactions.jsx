import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Component } from 'react';
import { base44 } from '@/api/base44Client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import RefreshableList from '@/components/shared/RefreshableList';
import { Link } from 'react-router-dom';
import { TransactionsPageSkeleton } from '@/components/shared/SkeletonLoaders';
import StatusBadge from '@/components/shared/StatusBadge';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import { Clock, Search, Download, ArrowDownLeft, ArrowUpRight, RefreshCcw, Filter, ChevronRight, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationAnnouncement } from '@/components/shared/AriaLiveRegions';
import { jsPDF } from 'jspdf';

function downloadCSV(transactions) {
  if (!transactions.length) { return; }
  const headers = ['Date', 'Type', 'From Currency', 'From Amount', 'To Currency', 'To Amount', 'Status', 'Provider'];
  const rows = transactions.map(tx => [
    tx.created_date ? format(new Date(tx.created_date), 'yyyy-MM-dd HH:mm:ss') : '',
    tx.type || '',
    tx.from_currency || '',
    tx.from_amount ?? '',
    tx.to_currency || '',
    tx.to_amount ?? '',
    tx.status || '',
    tx.provider || '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(transactions) {
  if (!transactions.length) { return; }
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Transaction History', 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 23);
  doc.setTextColor(0);

  const headers = ['Date', 'Type', 'From', 'Amount', 'To', 'Status'];
  const colX = [14, 46, 78, 105, 132, 159];
  let y = 32;

  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  doc.setFont(undefined, 'normal');
  y += 6;
  doc.setDrawColor(200);
  doc.line(14, y - 3, 196, y - 3);

  for (const tx of transactions) {
    const row = [
      tx.created_date ? format(new Date(tx.created_date), 'MM/dd/yy') : '—',
      (tx.type || '').charAt(0).toUpperCase() + (tx.type || '').slice(1),
      tx.from_currency || '—',
      String(tx.from_amount ?? '—'),
      tx.to_currency || '—',
      (tx.status || '').charAt(0).toUpperCase() + (tx.status || '').slice(1),
    ];
    row.forEach((cell, i) => doc.text(String(cell).slice(0, 14), colX[i], y));
    y += 7;
    if (y > 272) { doc.addPage(); y = 20; }
  }

  doc.save(`transactions-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

const TYPE_META = {
  deposit:    { icon: ArrowDownLeft, bg: 'bg-emerald-100', color: 'text-emerald-600', label: 'Deposit' },
  withdrawal: { icon: ArrowUpRight,  bg: 'bg-red-100',     color: 'text-red-500',     label: 'Withdrawal' },
  conversion: { icon: RefreshCcw,    bg: 'bg-blue-100',    color: 'text-blue-600',    label: 'Swap' },
};

const PAGE_SIZE = 20;

class TransactionsErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error('Transactions render error:', err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="px-4 pt-6 pb-24">
          <EmptyState icon={Clock} title="Something went wrong" description="We couldn't load your transactions. Pull down to try again." />
        </div>
      );
    }
    return this.props.children;
  }
}

function TransactionsPage() {
  const [user, setUser] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const announceNotification = useNotificationAnnouncement();
  const { isPulling } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  });

  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(null)); }, []);

  // Reset to first page when filters change
  useEffect(() => { setPage(0); }, [typeFilter, statusFilter, directionFilter, search, setPage]);

  // Build server-side filter object
  const buildFilter = () => {
    const filter = { user_email: user?.email };
    if (typeFilter !== 'all') filter.type = typeFilter;
    if (statusFilter !== 'all') filter.status = statusFilter;
    if (directionFilter === 'incoming') filter.type = 'deposit';
    if (directionFilter === 'outgoing') filter.type = 'withdrawal';
    return filter;
  };

  const { data: pageData = [], isLoading, isFetching, isError } = useQuery({
    queryKey: ['transactions', typeFilter, statusFilter, directionFilter, page],
    queryFn: () => base44.entities.Transaction.filter(
      buildFilter(),
      '-created_date',
      PAGE_SIZE,
      page * PAGE_SIZE
    ),
    enabled: !!user?.email,
    placeholderData: keepPreviousData,
  });

  // Summary counts — fetched once without pagination
  const { data: allTransactions = [] } = useQuery({
    queryKey: ['transactions', 'summary'],
    queryFn: () => base44.entities.Transaction.filter({ user_email: user?.email }, '-created_date', 500),
    enabled: !!user?.email,
    staleTime: 60000,
  });

  // Client-side search filter on current page
  const filtered = search
    ? pageData.filter(tx =>
        tx.reference_id?.toLowerCase().includes(search.toLowerCase()) ||
        tx.description?.toLowerCase().includes(search.toLowerCase())
      )
    : pageData;

  const summary = {
    deposits:    allTransactions.filter(t => t.type === 'deposit').length,
    withdrawals: allTransactions.filter(t => t.type === 'withdrawal').length,
    swaps:       allTransactions.filter(t => t.type === 'conversion').length,
  };

  const hasNextPage = pageData.length === PAGE_SIZE;
  const hasPrevPage = page > 0;

  // Announce page changes
  useEffect(() => {
    if (!isLoading) {
      announceNotification(`Page ${page + 1}, showing ${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`);
    }
  }, [page, filtered.length, isLoading, announceNotification]);

  if (isLoading && page === 0) return <TransactionsPageSkeleton />;

  if (isError) {
    return (
      <div className="px-4 pt-6 pb-24">
        <EmptyState icon={Clock} title="Could not load transactions" description="There was a problem fetching your transactions. Please try again." />
      </div>
    );
  }

  return (
    <RefreshableList queryKey={['transactions']}>
      <div className="px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Transactions</h1>
          <p className="text-xs text-muted-foreground">{allTransactions.length} total records</p>
        </div>
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => { const data = allTransactions.length > 0 ? allTransactions : filtered; if (!data.length) { toast.info('No transactions to export'); return; } downloadCSV(data); }} aria-label="Export transactions as CSV">
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => { const data = allTransactions.length > 0 ? allTransactions : filtered; if (!data.length) { toast.info('No transactions to export'); return; } downloadPDF(data); }} aria-label="Export transactions as PDF">
            <FileText className="w-4 h-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Summary strip */}
      {allTransactions.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Deposits', count: summary.deposits, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
            { label: 'Withdrawals', count: summary.withdrawals, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
            { label: 'Swaps', count: summary.swaps, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
          ].map(({ label, count, bg, text, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-xl p-3 text-center`}>
              <p className={`text-xl font-bold ${text}`}>{count}</p>
              <p className={`text-xs font-medium ${text} opacity-80`}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search reference or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl bg-card h-11"
        />
      </div>

      {/* Direction Filters */}
      <div className="flex gap-2">
        {['all', 'incoming', 'outgoing'].map(direction => (
          <Button
            key={direction}
            variant={directionFilter === direction ? 'default' : 'outline'}
            size="sm"
            className="rounded-lg text-xs font-medium"
            onClick={() => setDirectionFilter(direction)}
          >
            {direction === 'all' ? 'All' : direction === 'incoming' ? 'Incoming' : 'Outgoing'}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Filter className="w-4 h-4" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="rounded-xl bg-card flex-1 h-9 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="conversion">Swap</SelectItem>
            <SelectItem value="withdrawal">Withdrawal</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="rounded-xl bg-card flex-1 h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 && !isFetching ? (
        <EmptyState
          icon={Clock}
          title="No transactions yet"
          description={search || typeFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Your transaction history will appear here'}
        />
      ) : (
        <div className={`bg-card rounded-2xl divide-y divide-border overflow-hidden border border-border transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
          {filtered.map(tx => {
            const meta = TYPE_META[tx.type] || TYPE_META.deposit;
            const Icon = meta.icon;
            const isWithdrawal = tx.type === 'withdrawal';
            const displayCurrency = isWithdrawal ? tx.from_currency : (tx.to_currency || tx.from_currency);
            const displayAmount = isWithdrawal ? tx.from_amount : (tx.to_amount || tx.from_amount);
            return (
              <Link key={tx.id} to={`/transactions/${tx.id}`} className="flex items-center gap-3.5 px-4 py-4 hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background" aria-label={`View ${meta.label} transaction ${tx.reference_id}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                  <Icon className={`w-4.5 h-4.5 ${meta.color}`} style={{ width: '1.1rem', height: '1.1rem' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{meta.label}</p>
                  <p className="text-xs text-muted-foreground truncate font-mono">{tx.reference_id || tx.description || '—'}</p>
                  <p className="text-xs text-muted-foreground">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, h:mm a') : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${isWithdrawal ? 'text-red-600' : 'text-emerald-600'}`}>
                    {isWithdrawal ? '-' : '+'}{formatCurrency(displayAmount, displayCurrency)}
                  </p>
                  <StatusBadge status={tx.status} />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={!hasPrevPage || isFetching}
            onClick={() => setPage(p => p - 1)}
          >
            ← Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page + 1}</span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={!hasNextPage || isFetching}
            onClick={() => setPage(p => p + 1)}
          >
            Next →
          </Button>
        </div>
      )}
      </div>
    </RefreshableList>
  );
}

export default function Transactions() {
  return (
    <TransactionsErrorBoundary>
      <TransactionsPage />
    </TransactionsErrorBoundary>
  );
}