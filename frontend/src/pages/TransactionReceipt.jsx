import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, CheckCircle, Clock, XCircle, Copy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { jsPDF } from 'jspdf';

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Completed' },
  pending: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Pending' },
  processing: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Processing' },
  failed: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Failed' },
  initiated: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Initiated' },
};

const typeConfig = {
  deposit: { label: 'Deposit', emoji: '📥' },
  withdrawal: { label: 'Withdrawal', emoji: '📤' },
  conversion: { label: 'Conversion', emoji: '🔄' },
};

export default function TransactionReceipt() {
  const { id } = useParams();
  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => base44.entities.Transaction.filter({ id }),
    select: (data) => data[0],
  });

  const status = transaction && statusConfig[transaction.status];
  const type = transaction && typeConfig[transaction.type];

  const handleCopyReference = () => {
    if (transaction?.reference_id) {
      navigator.clipboard.writeText(transaction.reference_id);
      toast.success('Reference ID copied!');
    }
  };

  const handleDownloadPDF = () => {
    if (!transaction) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(51, 65, 85);
    doc.text('Transaction Receipt', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Status badge
    doc.setFontSize(10);
    const statusColor = {
      completed: [16, 185, 129],
      pending: [59, 130, 246],
      processing: [59, 130, 246],
      failed: [239, 68, 68],
      initiated: [59, 130, 246],
    };
    doc.setTextColor(...(statusColor[transaction.status] || [100, 100, 100]));
    doc.text(`Status: ${status?.label || transaction.status}`, 20, yPos);
    yPos += 10;

    // Transaction info section
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Transaction Details', 20, yPos);
    yPos += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const details = [
      ['Type:', `${type?.emoji} ${type?.label}`],
      ['Date:', new Date(transaction.created_date).toLocaleString()],
      ['Reference ID:', transaction.reference_id || 'N/A'],
    ];

    details.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value, 80, yPos);
      yPos += 7;
    });

    yPos += 5;

    // Amount section
    doc.setFont(undefined, 'bold');
    doc.setFontSize(12);
    doc.text('Amount Breakdown', 20, yPos);
    yPos += 8;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    const amounts = [
      ['From:', `${transaction.from_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${transaction.from_currency}`],
      ['To:', `${transaction.to_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${transaction.to_currency}`],
      ['Fee:', `${transaction.fee?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'} ${transaction.from_currency}`],
    ];

    amounts.forEach(([label, value]) => {
      doc.text(label, 20, yPos);
      doc.text(value, 80, yPos);
      yPos += 7;
    });

    yPos += 5;

    // Exchange rate section
    if (transaction.exchange_rate) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('Exchange Rate', 20, yPos);
      yPos += 8;

      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text(`1 ${transaction.from_currency} =`, 20, yPos);
      doc.text(`${transaction.exchange_rate.toLocaleString('en-US', { minimumFractionDigits: 6 })} ${transaction.to_currency}`, 80, yPos);
      yPos += 7;
    }

    yPos += 10;

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('This receipt was generated on ' + new Date().toLocaleString(), pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`receipt-${transaction.reference_id || 'transaction'}.pdf`);
    toast.success('Receipt downloaded!');
  };

  if (isLoading) return <LoadingSpinner />;
  if (!transaction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Transaction not found</p>
          <Link to="/transactions" className="text-primary hover:underline">Back to transactions</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/transactions" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Transaction Receipt</h1>
        </div>

        {/* Receipt Card */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
          {/* Status */}
          {status && (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${status.bg}`}>
              <status.icon className={`w-5 h-5 ${status.color}`} />
              <span className={`font-semibold ${status.color}`}>{status.label}</span>
            </div>
          )}

          {/* Transaction Type & Date */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Transaction Type</p>
              <p className="text-lg font-bold">{type?.emoji} {type?.label}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Date & Time</p>
              <p className="text-sm">{new Date(transaction.created_date).toLocaleString()}</p>
            </div>
          </div>

          {/* Reference ID */}
          <div>
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Reference ID</p>
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
              <code className="text-sm font-mono flex-1 break-all">{transaction.reference_id || 'N/A'}</code>
              {transaction.reference_id && (
                <Button size="icon" variant="ghost" className="w-8 h-8 flex-shrink-0" onClick={handleCopyReference}>
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">Amount Breakdown</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">From Amount</span>
                <span className="font-semibold">{transaction.from_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {transaction.from_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">To Amount</span>
                <span className="font-semibold text-primary">{transaction.to_amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {transaction.to_currency}</span>
              </div>
              {transaction.fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm">Fee</span>
                  <span className="font-semibold text-destructive">-{transaction.fee?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {transaction.from_currency}</span>
                </div>
              )}
            </div>
          </div>

          {/* Exchange Rate */}
          {transaction.exchange_rate && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-3">Exchange Rate</p>
              <div className="flex justify-between">
                <span className="text-sm">1 {transaction.from_currency}</span>
                <span className="font-semibold">{transaction.exchange_rate.toLocaleString('en-US', { minimumFractionDigits: 6 })} {transaction.to_currency}</span>
              </div>
            </div>
          )}

          {/* Description */}
          {transaction.description && (
            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Notes</p>
              <p className="text-sm">{transaction.description}</p>
            </div>
          )}
        </div>

        {/* Download Button */}
        <Button
          onClick={handleDownloadPDF}
          className="w-full mt-6 rounded-xl gap-2 h-11"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      </div>
    </div>
  );
}