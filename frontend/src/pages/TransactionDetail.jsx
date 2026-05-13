import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Copy, Download, CheckCircle2, Clock, XCircle, ArrowDownLeft, ArrowUpRight, RefreshCcw, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';

function downloadReceipt(tx) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const accent = [37, 99, 235];
  doc.setFillColor(...accent);
  doc.rect(0, 0, pageW, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('Nexus Finance', 40, 48);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text('Transaction Receipt', pageW - 40, 48, { align: 'right' });
  doc.setTextColor(30, 41, 59); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('Payment Receipt', 40, 120);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(40, 135, pageW - 80, 36, 6, 6, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
  doc.text('Reference ID', 55, 152);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(37, 99, 235);
  doc.text(tx.reference_id || 'N/A', pageW - 55, 152, { align: 'right' });
  doc.setFontSize(32); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(tx.to_amount || tx.from_amount, tx.to_currency || tx.from_currency), pageW / 2, 215, { align: 'center' });
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  const statusColor = tx.status === 'completed' ? [16, 185, 129] : tx.status === 'failed' ? [239, 68, 68] : [245, 158, 11];
  doc.setTextColor(...statusColor);
  doc.text((tx.status || '').toUpperCase(), pageW / 2, 235, { align: 'center' });
  doc.setDrawColor(226, 232, 240); doc.setLineWidth(1); doc.line(40, 250, pageW - 40, 250);
  const rows = [
    ['Transaction Type', (tx.type || '').charAt(0).toUpperCase() + (tx.type || '').slice(1)],
    ['Date & Time', tx.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy h:mm a') : '-'],
  ];
  if (tx.from_currency && tx.from_amount) rows.push(['Amount Sent', `${formatCurrency(tx.from_amount, tx.from_currency)} ${tx.from_currency}`]);
  if (tx.to_currency && tx.to_amount) rows.push(['Amount Received', `${formatCurrency(tx.to_amount, tx.to_currency)} ${tx.to_currency}`]);
  if (tx.exchange_rate) rows.push(['Exchange Rate', `1 ${tx.from_currency} = ${tx.exchange_rate.toLocaleString()} ${tx.to_currency}`]);
  if (tx.fee > 0) rows.push(['Service Fee', formatCurrency(tx.fee, tx.from_currency)]);
  if (tx.description) rows.push(['Description', tx.description]);
  let y = 275;
  rows.forEach(([label, value], i) => {
    if (i % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(40, y - 14, pageW - 80, 26, 'F'); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
    doc.text(label, 55, y);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
    doc.text(String(value), pageW - 55, y, { align: 'right' });
    y += 30;
  });
  const footerY = doc.internal.pageSize.getHeight() - 50;
  doc.setFillColor(...accent); doc.rect(0, footerY, pageW, 50, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('This is an automatically generated receipt. For queries, contact support@nexusfinance.com', pageW / 2, footerY + 20, { align: 'center' });
  doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}`, pageW / 2, footerY + 36, { align: 'center' });
  doc.save(`receipt-${tx.reference_id || tx.id}.pdf`);
}

const TYPE_META = {
  deposit:    { icon: ArrowDownLeft, bg: 'from-emerald-500 to-teal-600',  label: 'Deposit' },
  withdrawal: { icon: ArrowUpRight,  bg: 'from-purple-600 to-indigo-700', label: 'Withdrawal' },
  conversion: { icon: RefreshCcw,    bg: 'from-primary to-blue-700',      label: 'Swap' },
};

const STATUS_CONFIG = {
  completed:  { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  pending:    { icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  processing: { icon: Clock,        color: 'text-blue-600',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  failed:     { icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
};

export default function TransactionDetail() {
  const [copied, setCopied] = useState(false);
  const txId = window.location.pathname.split('/').pop();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transaction', txId],
    queryFn: () => base44.entities.Transaction.filter({ id: txId }),
  });

  const tx = transactions[0];

  if (isLoading) return <LoadingSpinner />;
  if (!tx) return (
    <div className="px-4 pt-6 text-center py-20">
      <p className="text-muted-foreground">Transaction not found.</p>
      <Link to="/transactions"><Button className="mt-4 rounded-xl">Back to Transactions</Button></Link>
    </div>
  );

  const meta = TYPE_META[tx.type] || TYPE_META.deposit;
  const statusCfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  const copyRef = () => {
    navigator.clipboard.writeText(tx.reference_id);
    setCopied(true);
    toast.success('Reference copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const details = [
    { label: 'Type', value: meta.label },
    { label: 'Date', value: tx.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy · h:mm a') : '—' },
    tx.from_currency && tx.from_amount && { label: 'Amount Sent', value: `${formatCurrency(tx.from_amount, tx.from_currency)} ${tx.from_currency}` },
    tx.to_currency && tx.to_amount && { label: 'Amount Received', value: `${formatCurrency(tx.to_amount, tx.to_currency)} ${tx.to_currency}` },
    tx.exchange_rate && { label: 'Exchange Rate', value: `1 ${tx.from_currency} = ${tx.exchange_rate?.toLocaleString()} ${tx.to_currency}` },
    tx.fee > 0 && { label: 'Fee', value: formatCurrency(tx.fee, tx.from_currency) },
    tx.description && { label: 'Description', value: tx.description },
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/transactions" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Transaction</h1>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={() => downloadReceipt(tx)}>
            <Download className="w-3.5 h-3.5" /> Receipt
          </Button>
        </div>

        {/* Hero card */}
        <div className={`bg-gradient-to-br ${meta.bg} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
          <div className="relative text-center">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold mb-4 ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {tx.status?.replace(/_/g, ' ')}
            </div>
            <p className="text-4xl font-bold tabular-nums mb-1">
              {formatCurrency(tx.to_amount || tx.from_amount, tx.to_currency || tx.from_currency)}
            </p>
            <p className="text-sm opacity-70">{tx.to_currency || tx.from_currency} · {meta.label}</p>
          </div>
        </div>

        {/* Reference ID */}
        {tx.reference_id && (
          <button
            onClick={copyRef}
            className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3.5 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p className="text-xs text-muted-foreground">Reference ID</p>
              <p className="text-sm font-mono font-semibold mt-0.5">{tx.reference_id}</p>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${copied ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </div>
          </button>
        )}

        {/* Details */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</p>
          </div>
          <div className="divide-y divide-border">
            {details.map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between px-4 py-3.5 gap-3">
                <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
                <span className="text-sm font-medium text-right capitalize">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        {tx.timeline && tx.timeline.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timeline</p>
            </div>
            <div className="p-5 space-y-0">
              {tx.timeline.map((entry, i) => (
                <div key={entry.timestamp || `timeline-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${i === tx.timeline.length - 1 ? 'bg-primary ring-4 ring-primary/20' : 'bg-border'}`} />
                    {i < tx.timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[2rem]" />}
                  </div>
                  <div className="pb-5 flex-1">
                    <p className="text-sm font-semibold capitalize">{entry.status?.replace(/_/g, ' ')}</p>
                    {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
                    {entry.timestamp && <p className="text-xs text-muted-foreground/60 mt-0.5">{format(new Date(entry.timestamp), 'MMM d, h:mm a')}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}