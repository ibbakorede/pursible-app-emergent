import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

// Build daily balance snapshots from a list of transactions + current balance
function buildTrendData(transactions, currentBalance, days = 14) {
  const today = startOfDay(new Date());
  const dailyDeltas = {};

  // Map each day bucket
  for (let i = 0; i < days; i++) {
    const d = format(subDays(today, i), 'yyyy-MM-dd');
    dailyDeltas[d] = 0;
  }

  transactions.forEach(tx => {
    if (!tx.created_date) return;
    const d = format(startOfDay(new Date(tx.created_date)), 'yyyy-MM-dd');
    if (!(d in dailyDeltas)) return;
    // Deposits add to balance (going back in time, they reduce it)
    const amount = tx.from_amount || 0;
    if (tx.type === 'deposit') dailyDeltas[d] += amount;
    if (tx.type === 'withdrawal') dailyDeltas[d] -= amount;
  });

  // Walk backwards from today to reconstruct historical balances
  const sortedDays = Object.keys(dailyDeltas).sort();
  let balance = currentBalance;
  const result = [];

  for (let i = sortedDays.length - 1; i >= 0; i--) {
    const d = sortedDays[i];
    result.unshift({ date: d, balance: Math.max(0, balance), label: format(new Date(d + 'T00:00:00'), 'MMM d') });
    balance -= dailyDeltas[d]; // subtract today's net to get yesterday's balance
  }

  return result;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-3 py-2">
      <p className="text-xs text-muted-foreground">{payload[0]?.payload?.label}</p>
      <p className="text-sm font-bold text-primary">${Number(payload[0]?.value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
    </div>
  );
};

export default function BalanceTrendChart({ transactions = [], currentBalance = 0, days = 14 }) {
  const data = useMemo(() => buildTrendData(transactions, currentBalance, days), [transactions, currentBalance, days]);

  const min = Math.min(...data.map(d => d.balance));
  const max = Math.max(...data.map(d => d.balance));
  const change = data.length >= 2 ? data[data.length - 1].balance - data[0].balance : 0;
  const changePct = data[0]?.balance > 0 ? (change / data[0].balance) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
          {isPositive ? '▲' : '▼'} {Math.abs(changePct).toFixed(1)}% ({days}d)
        </span>
        <span className="text-xs text-white/60">vs {days} days ago</span>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="95%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis domain={[Math.max(0, min * 0.95), max * 1.05]} hide />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
              fill="url(#balanceGrad)"
              dot={false}
              activeDot={{ r: 4, fill: 'white', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}