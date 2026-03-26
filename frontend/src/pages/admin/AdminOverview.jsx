import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Users, ShieldCheck, ArrowLeftRight, Wallet, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(221, 83%, 53%)', 'hsl(152, 69%, 41%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

export default function AdminOverview() {
  const { data: users = [] } = useQuery({ queryKey: ['admin-users'], queryFn: () => base44.entities.User.list() });
  const { data: kycs = [] } = useQuery({ queryKey: ['admin-kycs'], queryFn: () => base44.entities.KYCRecord.list() });
  const { data: transactions = [] } = useQuery({ queryKey: ['admin-txs'], queryFn: () => base44.entities.Transaction.list('-created_date', 100) });
  const { data: wallets = [] } = useQuery({ queryKey: ['admin-wallets'], queryFn: () => base44.entities.Wallet.list() });

  const totalVolume = transactions.reduce((a, t) => a + (t.from_amount || 0), 0);
  const completedTx = transactions.filter(t => t.status === 'completed').length;
  const failedTx = transactions.filter(t => t.status === 'failed').length;
  const pendingKyc = kycs.filter(k => k.status === 'pending' || k.status === 'in_review').length;

  const kycData = [
    { name: 'Approved', value: kycs.filter(k => k.status === 'approved').length },
    { name: 'Pending', value: kycs.filter(k => k.status === 'pending').length },
    { name: 'In Review', value: kycs.filter(k => k.status === 'in_review').length },
    { name: 'Rejected', value: kycs.filter(k => k.status === 'rejected').length },
  ].filter(d => d.value > 0);

  const typeData = [
    { name: 'Deposits', value: transactions.filter(t => t.type === 'deposit').length },
    { name: 'Conversions', value: transactions.filter(t => t.type === 'conversion').length },
    { name: 'Withdrawals', value: transactions.filter(t => t.type === 'withdrawal').length },
  ];

  const stats = [
    { icon: Users, label: 'Total Users', value: users.length, color: 'text-blue-600 bg-blue-50' },
    { icon: ShieldCheck, label: 'Pending KYC', value: pendingKyc, color: 'text-amber-600 bg-amber-50' },
    { icon: ArrowLeftRight, label: 'Total Transactions', value: transactions.length, color: 'text-purple-600 bg-purple-50' },
    { icon: Wallet, label: 'Transaction Volume', value: `$${totalVolume.toLocaleString()}`, color: 'text-emerald-600 bg-emerald-50' },
    { icon: CheckCircle, label: 'Completed', value: completedTx, color: 'text-emerald-600 bg-emerald-50' },
    { icon: AlertTriangle, label: 'Failed', value: failedTx, color: 'text-red-600 bg-red-50' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <Card 
            key={label} 
            className="p-4 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background transition-all"
            role="region"
            aria-label={`${label}: ${value}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">
          <h3 className="text-sm font-semibold mb-4">Transactions by Type</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={typeData}>
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        
        <Card className="p-5 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background">
          <h3 className="text-sm font-semibold mb-4">KYC Status Distribution</h3>
          {kycData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={kycData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {kycData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">No KYC data yet</div>
          )}
        </Card>
      </div>
    </div>
  );
}