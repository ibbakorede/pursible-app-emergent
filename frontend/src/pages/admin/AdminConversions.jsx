import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminConversions() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-conversions'],
    queryFn: () => base44.entities.Transaction.filter({ type: 'conversion' }, '-created_date', 200),
  });

  const completed = transactions.filter(t => t.status === 'completed').length;
  const failed = transactions.filter(t => t.status === 'failed').length;
  const totalVolume = transactions.reduce((a, t) => a + (t.from_amount || 0), 0);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Conversions</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card 
          className="p-4 text-center focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background transition-all"
          role="region"
          aria-label="Total conversions"
        >
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{transactions.length}</p>
        </Card>
        <Card 
          className="p-4 text-center focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background transition-all"
          role="region"
          aria-label="Completed conversions"
        >
          <p className="text-xs text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{completed}</p>
        </Card>
        <Card 
          className="p-4 text-center focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background transition-all"
          role="region"
          aria-label="Failed conversions"
        >
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="text-2xl font-bold text-red-600">{failed}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow 
                  key={tx.id}
                  className="hover:bg-muted/50 focus-within:bg-primary/5 transition-colors"
                >
                  <TableCell className="font-mono text-xs">{tx.reference_id || '-'}</TableCell>
                  <TableCell className="text-sm">{tx.user_email}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(tx.from_amount, tx.from_currency)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(tx.to_amount, tx.to_currency)}</TableCell>
                  <TableCell className="text-sm">{tx.exchange_rate?.toLocaleString() || '-'}</TableCell>
                  <TableCell><StatusBadge status={tx.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, h:mm a') : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}