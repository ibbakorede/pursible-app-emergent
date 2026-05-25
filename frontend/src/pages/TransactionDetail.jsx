import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  ArrowLeft, Copy, Download, ArrowDownLeft, ArrowUpRight, 
  RefreshCcw, Check, Share2, FileText, RotateCcw, MessageCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';

// ============================================================================
// Download Receipt PDF
// ============================================================================
function downloadReceipt(tx) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const accent = [92, 107, 62]; // Olive brand color
  
  doc.setFillColor(...accent);
  doc.rect(0, 0, pageW, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('Pursible', 40, 48);
  doc.setFontSize(11); doc.setFont('helvetica', 'normal');
  doc.text('Transaction Receipt', pageW - 40, 48, { align: 'right' });
  
  doc.setTextColor(30, 41, 59); doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text('Payment Receipt', 40, 120);
  
  doc.setFillColor(245, 247, 242);
  doc.roundedRect(40, 135, pageW - 80, 36, 6, 6, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
  doc.text('Reference ID', 55, 152);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...accent);
  doc.text(tx.reference_id || 'N/A', pageW - 55, 152, { align: 'right' });
  
  doc.setFontSize(32); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text(formatCurrency(tx.to_amount || tx.from_amount, tx.to_currency || tx.from_currency), pageW / 2, 215, { align: 'center' });
  
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  const statusColor = tx.status === 'completed' ? [151, 196, 89] : tx.status === 'failed' ? [240, 149, 149] : [250, 199, 117];
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
  doc.text('This is an automatically generated receipt. For queries, contact support@pursible.com', pageW / 2, footerY + 20, { align: 'center' });
  doc.text(`Generated on ${format(new Date(), 'MMM d, yyyy h:mm a')}`, pageW / 2, footerY + 36, { align: 'center' });
  
  doc.save(`receipt-${tx.reference_id || tx.id}.pdf`);
}

// ============================================================================
// Constants
// ============================================================================
const TYPE_META = {
  deposit:    { icon: ArrowDownLeft, label: 'Deposit' },
  withdrawal: { icon: ArrowUpRight,  label: 'Withdrawal' },
  conversion: { icon: RefreshCcw,    label: 'Swap' },
};

const STATUS_STYLES = {
  completed:  { bg: 'rgba(122,140,84,0.15)', text: '#97C459' },
  pending:    { bg: 'rgba(239,159,39,0.12)', text: '#FAC775' },
  processing: { bg: 'rgba(133,183,235,0.12)', text: '#85B7EB' },
  failed:     { bg: 'rgba(226,75,74,0.12)', text: '#F09595' },
};

// ============================================================================
// Components
// ============================================================================

// Status pill
function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span 
      className="inline-block text-[10px] font-bold uppercase tracking-wider"
      style={{
        padding: '4px 10px',
        borderRadius: '20px',
        background: style.bg,
        color: style.text,
      }}
    >
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// Hero card (flat design)
function HeroCard({ tx, meta }) {
  const displayAmount = tx.to_amount || tx.from_amount;
  const displayCurrency = tx.to_currency || tx.from_currency;
  
  return (
    <div 
      className="rounded-[22px] p-5"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '0.5px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Status pill at top */}
      <div className="text-center mb-4">
        <StatusPill status={tx.status} />
      </div>
      
      {/* Amount */}
      <p 
        className="text-center font-bold tabular-nums"
        style={{ 
          fontSize: '38px',
          fontFamily: 'Outfit, sans-serif',
          lineHeight: 1.1,
        }}
      >
        {formatCurrency(displayAmount, displayCurrency)}
      </p>
      
      {/* Date */}
      <p className="text-center text-sm text-muted-foreground mt-1.5 mb-4">
        {tx.created_date ? format(new Date(tx.created_date), 'MMM d, yyyy · h:mm a') : '—'}
      </p>
      
      {/* From → To row */}
      {tx.from_currency && tx.to_currency && tx.from_currency !== tx.to_currency && (
        <div 
          className="pt-4 mt-2"
          style={{ borderTop: '0.5px solid rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center justify-between">
            {/* From */}
            <div className="flex items-center gap-2">
              <CurrencyIcon currency={tx.from_currency} size="sm" />
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-sm font-semibold tabular-nums">
                  {formatCurrency(tx.from_amount, tx.from_currency)}
                </p>
              </div>
            </div>
            
            {/* Arrow */}
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(122,140,84,0.15)' }}
            >
              <RefreshCcw className="w-4 h-4" style={{ color: '#7A8C54' }} />
            </div>
            
            {/* To */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">To</p>
                <p className="text-sm font-semibold tabular-nums" style={{ color: '#97C459' }}>
                  {formatCurrency(tx.to_amount, tx.to_currency)}
                </p>
              </div>
              <CurrencyIcon currency={tx.to_currency} size="sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Timeline component (newest first)
function Timeline({ timeline }) {
  if (!timeline || timeline.length === 0) return null;
  
  // Reverse to show newest at top
  const reversed = [...timeline].reverse();
  
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 bg-muted/30 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timeline</p>
      </div>
      <div className="p-5 space-y-0">
        {reversed.map((entry, i) => {
          const isNewest = i === 0;
          return (
            <div key={entry.timestamp || `timeline-${i}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div 
                  className={`rounded-full mt-1 flex-shrink-0 ${isNewest ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'}`}
                  style={{
                    background: isNewest ? '#5C6B3E' : 'rgba(255,255,255,0.2)',
                    boxShadow: isNewest ? '0 0 0 4px rgba(92,107,62,0.2)' : 'none',
                  }}
                />
                {i < reversed.length - 1 && <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[2rem]" />}
              </div>
              <div className="pb-5 flex-1">
                <p className="text-sm font-semibold capitalize">{entry.status?.replace(/_/g, ' ')}</p>
                {entry.note && <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>}
                {entry.timestamp && (
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {format(new Date(entry.timestamp), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Action buttons
function ActionButtons({ tx, onDownloadReceipt, navigate }) {
  const canRepeat = tx.status === 'completed' && (tx.type === 'conversion' || tx.type === 'withdrawal');
  
  const handleRepeat = () => {
    if (tx.type === 'conversion') {
      // Navigate to convert with pre-filled data
      const params = new URLSearchParams({
        from: tx.from_currency,
        to: tx.to_currency,
        amount: tx.from_amount,
      });
      navigate(`/convert?${params.toString()}`);
    } else if (tx.type === 'withdrawal') {
      navigate(`/withdraw?amount=${tx.from_amount}`);
    }
  };
  
  const handleReportIssue = () => {
    // Navigate to support with transaction ID
    navigate(`/support?txId=${tx.id}&ref=${tx.reference_id}`);
  };
  
  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        {/* Receipt button */}
        <Button
          variant="outline"
          className="flex-1 rounded-xl h-11 gap-2"
          onClick={onDownloadReceipt}
        >
          <FileText className="w-4 h-4" />
          Receipt
        </Button>
        
        {/* Repeat button (only for completed conversions/withdrawals) */}
        {canRepeat && (
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-11 gap-2"
            onClick={handleRepeat}
          >
            <RotateCcw className="w-4 h-4" />
            Repeat
          </Button>
        )}
      </div>
      
      {/* Report issue - tertiary button */}
      <button
        onClick={handleReportIssue}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageCircle className="w-4 h-4" />
        Report an issue
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================
export default function TransactionDetail() {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
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

  const copyRef = () => {
    navigator.clipboard.writeText(tx.reference_id);
    setCopied(true);
    toast.success('Reference copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `Transaction ${tx.reference_id}\n${meta.label}: ${formatCurrency(tx.to_amount || tx.from_amount, tx.to_currency || tx.from_currency)}\nStatus: ${tx.status}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Transaction Details', text: shareText });
      } catch {
        navigator.clipboard.writeText(shareText);
        toast.success('Details copied to clipboard');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Details copied to clipboard');
    }
  };

  const details = [
    { label: 'Type', value: meta.label },
    tx.exchange_rate && { label: 'Exchange Rate', value: `1 ${tx.from_currency} = ${tx.exchange_rate?.toLocaleString()} ${tx.to_currency}` },
    tx.fee > 0 && { label: 'Fee', value: formatCurrency(tx.fee, tx.from_currency) },
    tx.provider && { label: 'Provider', value: tx.provider },
    tx.description && { label: 'Note', value: tx.description },
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
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-card border border-border hover:bg-muted transition-colors"
              aria-label="Share transaction"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => downloadReceipt(tx)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-card border border-border hover:bg-muted transition-colors"
              aria-label="Download receipt"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero card (flat) */}
        <HeroCard tx={tx} meta={meta} />

        {/* Reference ID */}
        {tx.reference_id && (
          <button
            onClick={copyRef}
            className="w-full flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3.5 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p className="text-xs text-muted-foreground">Reference ID</p>
              <p 
                className="text-sm font-semibold mt-0.5"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {tx.reference_id}
              </p>
            </div>
            <div 
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
              style={{
                background: copied ? 'rgba(122,140,84,0.18)' : 'rgba(255,255,255,0.05)',
                color: copied ? '#97C459' : 'rgba(255,255,255,0.6)',
              }}
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
            </div>
          </button>
        )}

        {/* Details */}
        {details.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 bg-muted/30 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</p>
            </div>
            <div className="divide-y divide-border">
              {details.map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between px-4 py-3.5 gap-3">
                  <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
                  <span className="text-sm font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline (newest first) */}
        <Timeline timeline={tx.timeline} />

        {/* Action buttons */}
        <ActionButtons 
          tx={tx} 
          onDownloadReceipt={() => downloadReceipt(tx)}
          navigate={navigate}
        />
      </div>
    </div>
  );
}
