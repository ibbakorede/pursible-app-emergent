import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { toast } from 'sonner';

export default function AdminWithdrawals() {
  const queryClient = useQueryClient();
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => base44.entities.Transaction.filter({ type: 'withdrawal' }, '-created_date', 200),
  });

  const retryPayout = useMutation({
    mutationFn: (id) => base44.entities.Transaction.update(id, { status: 'processing', timeline: [...(transactions.find(t => t.id === id)?.timeline || []), { status: 'processing', timestamp: new Date().toISOString(), note: 'Payout retry initiated' }] }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] }); toast.success('Retry initiated'); },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Withdrawals / Payouts</h1>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(tx => (
              <TableRow key={tx.id} className="hover:bg-muted/50 focus-within:bg-primary/5 transition-colors">
                <TableCell className="font-mono text-xs">{tx.reference_id || '-'}</TableCell>
                <TableCell className="text-sm">{tx.user_email}</TableCell>
                <TableCell className="font-medium">{formatCurrency(tx.from_amount, tx.from_currency)}</TableCell>
                <TableCell className="text-sm">{formatCurrency(tx.fee, tx.from_currency)}</TableCell>
                <TableCell><StatusBadge status={tx.status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{tx.created_date ? format(new Date(tx.created_date), 'MMM d, h:mm a') : '-'}</TableCell>
                <TableCell>
                  {tx.status === 'failed' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => retryPayout.mutate(tx.id)}
                      className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label="Retry payout"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}