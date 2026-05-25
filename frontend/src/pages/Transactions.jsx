import { logger } from '@/lib/logger';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Component, useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import RefreshableList from '@/components/shared/RefreshableList';
import { Link } from 'react-router-dom';
import { TransactionsPageSkeleton } from '@/components/shared/SkeletonLoaders';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency } from '@/lib/currencies';
import { format, isToday, isYesterday } from 'date-fns';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import { 
  Clock, Search, Download, ArrowDownLeft, ArrowUpRight, RefreshCcw, 
  ChevronRight, ChevronDown, ChevronLeft, X, FileText, FileSpreadsheet
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationAnnouncement } from '@/components/shared/AriaLiveRegions';
import { jsPDF } from 'jspdf';

// ============================================================================
// Export functions
// ============================================================================
function downloadCSV(transactions) {
  if (!transactions.length) return;
  const headers = ['Date', 'Type', 'From Currency', 'From Amount', 'To Currency', 'To Amount', 'Status', 'Provider'];
  const rows = transactions.map(tx => [
    tx.created_date ? format(new Date(tx.created_date), 'yyyy-MM-dd HH:mm:ss') : '',
    tx.type || '', tx.from_currency || '', tx.from_amount ?? '',
    tx.to_currency || '', tx.to_amount ?? '', tx.status || '', tx.provider || '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(transactions) {
  if (!transactions.length) return;
  const doc = new jsPDF();
  doc.setFontSize(16); doc.text('Transaction History', 14, 16);
  doc.setFontSize(9); doc.setTextColor(100);
  doc.text(`Generated ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 23);
  doc.setTextColor(0);
  const headers = ['Date', 'Type', 'From', 'Amount', 'To', 'Status'];
  const colX = [14, 46, 78, 105, 132, 159];
  let y = 32;
  doc.setFontSize(8); doc.setFont(undefined, 'bold');
  headers.forEach((h, i) => doc.text(h, colX[i], y));
  doc.setFont(undefined, 'normal'); y += 6;
  doc.setDrawColor(200); doc.line(14, y - 3, 196, y - 3);
  for (const tx of transactions) {
    const row = [
      tx.created_date ? format(new Date(tx.created_date), 'MM/dd/yy') : '—',
      (tx.type || '').charAt(0).toUpperCase() + (tx.type || '').slice(1),
      tx.from_currency || '—', String(tx.from_amount ?? '—'),
      tx.to_currency || '—', (tx.status || '').charAt(0).toUpperCase() + (tx.status || '').slice(1),
    ];
    row.forEach((cell, i) => doc.text(String(cell).slice(0, 14), colX[i], y)); y += 7;
    if (y > 272) { doc.addPage(); y = 20; }
  }
  doc.save(`transactions-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

// ============================================================================
// Constants
// ============================================================================
const TYPE_META = {
  deposit:    { icon: ArrowDownLeft, bg: 'bg-emerald-100', color: 'text-emerald-600', label: 'Deposit' },
  withdrawal: { icon: ArrowUpRight,  bg: 'bg-red-100',     color: 'text-red-500',     label: 'Withdrawal' },
  conversion: { icon: RefreshCcw,    bg: 'bg-blue-100',    color: 'text-blue-600',    label: 'Swap' },
};

const STATUS_COLORS = {
  completed: { bg: 'rgba(93,202,165,0.12)', text: '#5DCAA5' },
  pending: { bg: 'rgba(250,199,117,0.12)', text: '#FAC775' },
  processing: { bg: 'rgba(133,183,235,0.12)', text: '#85B7EB' },
  failed: { bg: 'rgba(240,149,149,0.12)', text: '#F09595' },
};

const PAGE_SIZE = 20;

// ============================================================================
// Components
// ============================================================================

// Type filter pills
function TypeFilterPills({ value, onChange, counts }) {
  const filters = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'conversion', label: 'Convert' },
    { id: 'withdrawal', label: 'Withdraw' },
    { id: 'deposit', label: 'Receive' },
  ];
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
      {filters.map(f => {
        const isActive = value === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            className="flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
            style={{
              background: isActive ? '#5C6B3E' : 'rgba(255,255,255,0.05)',
              color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
              border: isActive ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {f.label}{f.count !== undefined && ` ${f.count}`}
          </button>
        );
      })}
    </div>
  );
}

// Status select pill
function StatusSelectPill({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger 
        className="h-8 px-3 rounded-full text-xs font-medium border-0"
        style={{ 
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <SelectValue placeholder="Status: All" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Status: All</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="processing">Processing</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
        <SelectItem value="failed">Failed</SelectItem>
      </SelectContent>
    </Select>
  );
}

// Date filter pill
function DateFilterPill({ isActive, onRemove }) {
  if (!isActive) return null;
  return (
    <button
      onClick={onRemove}
      className="flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-all"
      style={{
        background: 'rgba(122,140,84,0.15)',
        color: '#97C459',
      }}
    >
      Last 30 days
      <X className="w-3 h-3" />
    </button>
  );
}

// Export bottom sheet
function ExportBottomSheet({ isOpen, onClose, onExportCSV, onExportPDF }) {
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl p-4 pb-8 animate-in slide-in-from-bottom duration-300">
        <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4" />
        <p className="text-sm font-semibold mb-3">Export transactions</p>
        <div className="space-y-2">
          <button
            onClick={() => { onExportCSV(); onClose(); }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">Export as CSV</span>
          </button>
          <button
            onClick={() => { onExportPDF(); onClose(); }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <FileText className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium">Export as PDF</span>
          </button>
        </div>
      </div>
    </>
  );
}

// Day section header
function DaySectionHeader({ date }) {
  const d = new Date(date);
  let label;
  if (isToday(d)) label = 'Today';
  else if (isYesterday(d)) label = 'Yesterday';
  else label = format(d, 'd MMM');
  
  return (
    <div 
      className="px-4 py-2"
      style={{ 
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '1.5px',
        color: 'rgba(255,255,255,0.45)',
        textTransform: 'uppercase',
      }}
    >
      {label}
    </div>
  );
}

// Transaction row
function TransactionRow({ tx }) {
  const meta = TYPE_META[tx.type] || TYPE_META.deposit;
  const Icon = meta.icon;
  const isWithdrawal = tx.type === 'withdrawal';
  const isFailed = tx.status === 'failed';
  const displayCurrency = isWithdrawal ? tx.from_currency : (tx.to_currency || tx.from_currency);
  const displayAmount = isWithdrawal ? tx.from_amount : (tx.to_amount || tx.from_amount);
  const statusColors = STATUS_COLORS[tx.status] || STATUS_COLORS.pending;
  
  return (
    <Link 
      to={`/transactions/${tx.id}`} 
      className="flex items-center gap-3.5 px-4 py-4 hover:bg-muted/50 transition-colors"
      style={{
        borderBottom: isFailed 
          ? '1px solid rgba(226,75,74,0.18)' 
          : '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
        <Icon className={`w-4.5 h-4.5 ${meta.color}`} style={{ width: '1.1rem', height: '1.1rem' }} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{meta.label}</p>
        {isFailed && tx.rejection_reason ? (
          <p className="text-xs text-red-400 truncate">{tx.rejection_reason}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {tx.created_date ? format(new Date(tx.created_date), 'h:mm a') : ''}
          </p>
        )}
      </div>
      
      <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
        <p 
          className="text-sm font-bold"
          style={{ 
            fontFamily: 'Outfit, sans-serif',
            color: isFailed ? 'rgba(255,255,255,0.45)' : (isWithdrawal ? '#F09595' : '#5DCAA5'),
            textDecoration: isFailed ? 'line-through' : 'none',
          }}
        >
          {isWithdrawal ? '-' : '+'}{formatCurrency(displayAmount, displayCurrency)}
        </p>
        <span 
          className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
          style={{ 
            background: statusColors.bg,
            color: statusColors.text,
          }}
        >
          {tx.status}
        </span>
      </div>
      
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </Link>
  );
}

// Group transactions by day
function groupByDay(transactions) {
  const groups = {};
  for (const tx of transactions) {
    const dateKey = tx.created_date 
      ? format(new Date(tx.created_date), 'yyyy-MM-dd')
      : 'unknown';
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(tx);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

// ============================================================================
// Error Boundary
// ============================================================================
class TransactionsErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { logger.error('Transactions render error:', err); }
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

// ============================================================================
// Main Page
// ============================================================================
function TransactionsPage() {
  const [user, setUser] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilterActive, setDateFilterActive] = useState(true);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const announceNotification = useNotificationAnnouncement();
  const { isPulling } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  });

  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(null)); }, []);
  useEffect(() => { setPage(0); }, [typeFilter, statusFilter, dateFilterActive, search]);

  const buildFilter = () => {
    const filter = { user_email: user?.email };
    if (typeFilter !== 'all') filter.type = typeFilter;
    if (statusFilter !== 'all') filter.status = statusFilter;
    return filter;
  };

  const { data: pageData = [], isLoading, isFetching, isError } = useQuery({
    queryKey: ['transactions', typeFilter, statusFilter, dateFilterActive, page],
    queryFn: () => base44.entities.Transaction.filter(
      buildFilter(), '-created_date', PAGE_SIZE, page * PAGE_SIZE
    ),
    enabled: !!user?.email,
    placeholderData: keepPreviousData,
  });

  const { data: allTransactions = [] } = useQuery({
    queryKey: ['transactions', 'summary'],
    queryFn: () => base44.entities.Transaction.filter({ user_email: user?.email }, '-created_date', 500),
    enabled: !!user?.email,
    staleTime: 60000,
  });

  const filtered = useMemo(() => {
    return search
      ? pageData.filter(tx =>
          tx.reference_id?.toLowerCase().includes(search.toLowerCase()) ||
          tx.description?.toLowerCase().includes(search.toLowerCase())
        )
      : pageData;
  }, [pageData, search]);

  const groupedTransactions = useMemo(() => groupByDay(filtered), [filtered]);

  const counts = {
    all: allTransactions.length,
    deposits: allTransactions.filter(t => t.type === 'deposit').length,
    withdrawals: allTransactions.filter(t => t.type === 'withdrawal').length,
    swaps: allTransactions.filter(t => t.type === 'conversion').length,
  };

  const hasNextPage = pageData.length === PAGE_SIZE;
  const hasPrevPage = page > 0;
  const totalCount = allTransactions.length;
  const showingCount = filtered.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  useEffect(() => {
    if (!isLoading) {
      announceNotification(`Page ${page + 1}, showing ${filtered.length} transactions`);
    }
  }, [page, filtered.length, isLoading, announceNotification]);

  const handleExportCSV = () => {
    const data = allTransactions.length > 0 ? allTransactions : filtered;
    if (!data.length) { toast.info('No transactions to export'); return; }
    downloadCSV(data);
    toast.success('CSV exported');
  };

  const handleExportPDF = () => {
    const data = allTransactions.length > 0 ? allTransactions : filtered;
    if (!data.length) { toast.info('No transactions to export'); return; }
    downloadPDF(data);
    toast.success('PDF exported');
  };

  if (isLoading && page === 0) return <TransactionsPageSkeleton />;

  if (isError) {
    return (
      <div className="px-4 pt-6 pb-24">
        <EmptyState icon={Clock} title="Could not load transactions" description="There was a problem fetching your transactions." />
      </div>
    );
  }

  return (
    <RefreshableList queryKey={['transactions']}>
      <div className="px-4 pt-6 pb-24 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Transactions</h1>
            <p className="text-xs text-muted-foreground">{totalCount} total records</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-card border border-border hover:bg-muted transition-colors"
              aria-label="Search transactions"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowExport(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-card border border-border hover:bg-muted transition-colors"
              aria-label="Export transactions"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search input (collapsible) */}
        {showSearch && (
          <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search reference or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-card h-11"
              autoFocus
            />
          </div>
        )}

        {/* Type filter pills (row 1) */}
        <TypeFilterPills value={typeFilter} onChange={setTypeFilter} counts={counts} />

        {/* Status + Date filters (row 2) */}
        <div className="flex gap-2 items-center">
          <StatusSelectPill value={statusFilter} onChange={setStatusFilter} />
          <DateFilterPill isActive={dateFilterActive} onRemove={() => setDateFilterActive(false)} />
        </div>

        {/* Transaction list grouped by day */}
        {filtered.length === 0 && !isFetching ? (
          <EmptyState
            icon={Clock}
            title="No transactions yet"
            description={search || typeFilter !== 'all' || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Your transaction history will appear here'}
          />
        ) : (
          <div className={`bg-card rounded-2xl overflow-hidden border border-border transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
            {groupedTransactions.map(([dateKey, txs]) => (
              <div key={dateKey}>
                <DaySectionHeader date={dateKey} />
                {txs.map(tx => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {(hasPrevPage || hasNextPage || totalCount > PAGE_SIZE) && (
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1"
              disabled={!hasPrevPage || isFetching}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Showing {showingCount} of {totalCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1"
                disabled={!hasNextPage || isFetching}
                onClick={() => setPage(p => p + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Export bottom sheet */}
      <ExportBottomSheet
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
      />
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
