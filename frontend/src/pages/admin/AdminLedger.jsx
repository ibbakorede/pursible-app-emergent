import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import CurrencyIcon from '@/components/shared/CurrencyIcon';
import { formatCurrency, CURRENCIES } from '@/lib/currencies';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AdminLedger() {
  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ['admin-wallets'],
    queryFn: () => base44.entities.Wallet.list(),
  });

  const totals = ['USD', 'USDC', 'USDT', 'NGN'].map(currency => {
    const currencyWallets = wallets.filter(w => w.currency === currency);
    return {
      currency,
      total_available: currencyWallets.reduce((a, w) => a + (w.available_balance || 0), 0),
      total_pending: currencyWallets.reduce((a, w) => a + (w.pending_balance || 0), 0),
      wallet_count: currencyWallets.length,
    };
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ledger</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {totals.map(t => (
          <Card 
            key={t.currency} 
            className="p-5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background transition-all"
            role="region"
            aria-label={`${t.currency} wallet summary`}
          >
            <div className="flex items-center gap-3 mb-3">
              <CurrencyIcon currency={t.currency} className="flex-shrink-0" />
              <div>
                <p className="font-semibold">{CURRENCIES[t.currency]?.name}</p>
                <p className="text-xs text-muted-foreground">{t.wallet_count} wallets</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available</span>
                <span className="font-semibold">{formatCurrency(t.total_available, t.currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="text-amber-600">{formatCurrency(t.total_pending, t.currency)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-1 mt-1">
                <span className="font-medium">Total</span>
                <span className="font-bold">{formatCurrency(t.total_available + t.total_pending, t.currency)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-semibold">All Wallet Balances</h3></div>
        <div className="overflow-x-auto rounded-b-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map(w => (
                <TableRow 
                  key={w.id}
                  className="hover:bg-muted/50 focus-within:bg-primary/5 transition-colors"
                >
                  <TableCell className="text-sm">{w.user_email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CurrencyIcon currency={w.currency} size="sm" className="flex-shrink-0" />
                      <span className="font-medium">{w.currency}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(w.available_balance, w.currency)}</TableCell>
                  <TableCell className="text-amber-600">{formatCurrency(w.pending_balance, w.currency)}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium ${w.is_active !== false ? 'text-emerald-600' : 'text-red-600'}`}>
                      {w.is_active !== false ? 'Active' : 'Frozen'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}