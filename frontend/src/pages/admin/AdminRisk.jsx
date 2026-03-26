import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

export default function AdminRisk() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-txs'],
    queryFn: () => base44.entities.Transaction.list('-created_date', 200),
  });

  // Flag high-value or failed transactions
  const flagged = transactions.filter(tx =>
    tx.status === 'failed' ||
    tx.status === 'reversed' ||
    (tx.from_amount && tx.from_amount > 10000)
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Risk Monitoring</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Flagged Transactions</p>
              <p className="text-xl font-bold">{flagged.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed Transactions</p>
              <p className="text-xl font-bold">{transactions.filter(t => t.status === 'failed').length}</p>
            </div>
          </div>
        </Card>
      </div>

      {flagged.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No flagged activity" description="All transactions look normal" />
      ) : (
        <Card className="overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-semibold">Flagged Transactions</h3></div>
          <div className="overflow-x-auto rounded-b-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flag</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flagged.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.reference_id || '-'}</TableCell>
                    <TableCell className="text-sm">{tx.user_email}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(tx.from_amount, tx.from_currency)}</TableCell>
                    <TableCell className="capitalize text-sm">{tx.type}</TableCell>
                    <TableCell><StatusBadge status={tx.status} /></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-red-50 text-red-700">
                        {tx.status === 'failed' || tx.status === 'reversed' ? 'Failed/Reversed' : 'High Value'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.created_date ? format(new Date(tx.created_date), 'MMM d') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}