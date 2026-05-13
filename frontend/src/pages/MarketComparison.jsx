import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const CURRENCIES = ['USD', 'USDC', 'USDT', 'NGN'];

// Chart style constants - extracted from inline objects
const CHART_TICK_STYLE = { fontSize: 12 };
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};
const LINE_DOT_STYLE = { r: 6 };

const BENCHMARK_RATES = {
  'USD-USDC': 1.0,
  'USD-USDT': 1.0,
  'USD-NGN': 450,
  'USDC-USD': 1.0,
  'USDC-USDT': 1.0,
  'USDC-NGN': 450,
  'USDT-USD': 1.0,
  'USDT-USDC': 1.0,
  'USDT-NGN': 450,
  'NGN-USD': 0.0022,
  'NGN-USDC': 0.0022,
  'NGN-USDT': 0.0022,
};

export default function MarketComparison() {
  const [pair1, setPair1] = useState({ from: 'USD', to: 'NGN' });
  const [pair2, setPair2] = useState({ from: 'USDC', to: 'NGN' });

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['rates'],
    queryFn: () => base44.entities.ConversionRate.list(),
  });

  const chartData = useMemo(() => {
    const rate1Key = `${pair1.from}-${pair1.to}`;
    const rate2Key = `${pair2.from}-${pair2.to}`;

    const r1 = rates.find(r => r.from_currency === pair1.from && r.to_currency === pair1.to);
    const r2 = rates.find(r => r.from_currency === pair2.from && r.to_currency === pair2.to);

    const benchmark1 = BENCHMARK_RATES[rate1Key] || 0;
    const benchmark2 = BENCHMARK_RATES[rate2Key] || 0;

    const current1 = r1?.rate || benchmark1;
    const current2 = r2?.rate || benchmark2;

    return [
      {
        name: 'Current',
        [rate1Key]: current1,
        [rate2Key]: current2,
        Benchmark1: benchmark1,
        Benchmark2: benchmark2,
      },
    ];
  }, [pair1, pair2, rates]);

  const metrics = useMemo(() => {
    const rate1Key = `${pair1.from}-${pair1.to}`;
    const rate2Key = `${pair2.from}-${pair2.to}`;

    const r1 = rates.find(r => r.from_currency === pair1.from && r.to_currency === pair1.to);
    const r2 = rates.find(r => r.from_currency === pair2.from && r.to_currency === pair2.to);

    const b1 = BENCHMARK_RATES[rate1Key] || 0;
    const b2 = BENCHMARK_RATES[rate2Key] || 0;

    const current1 = r1?.rate || b1;
    const current2 = r2?.rate || b2;

    const diff1 = ((current1 - b1) / b1 * 100).toFixed(2);
    const diff2 = ((current2 - b2) / b2 * 100).toFixed(2);

    return {
      pair1: { current: current1, benchmark: b1, diff: diff1 },
      pair2: { current: current2, benchmark: b2, diff: diff2 },
    };
  }, [pair1, pair2, rates]);

  // Memoize filtered currency options for dropdowns
  const pair1ToOptions = useMemo(() => CURRENCIES.filter(c => c !== pair1.from), [pair1.from]);
  const pair2ToOptions = useMemo(() => CURRENCIES.filter(c => c !== pair2.from), [pair2.from]);

  if (isLoading) return <LoadingSpinner />;

  const rate1Key = `${pair1.from}-${pair1.to}`;
  const rate2Key = `${pair2.from}-${pair2.to}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-20 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/wallet" className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Market Comparison</h1>
            <p className="text-xs text-muted-foreground">Compare exchange rates & benchmarks</p>
          </div>
        </div>

        {/* Currency Pair Selectors */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Pair 1</p>
            <div className="flex gap-2">
              <select
                value={pair1.from}
                onChange={(e) => setPair1({ ...pair1, from: e.target.value })}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={pair1.to}
                onChange={(e) => setPair1({ ...pair1, to: e.target.value })}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {pair1ToOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{metrics.pair1.current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">vs Benchmark: {metrics.pair1.benchmark.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold ${parseFloat(metrics.pair1.diff) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {parseFloat(metrics.pair1.diff) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(metrics.pair1.diff)}% from benchmark
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Pair 2</p>
            <div className="flex gap-2">
              <select
                value={pair2.from}
                onChange={(e) => setPair2({ ...pair2, from: e.target.value })}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={pair2.to}
                onChange={(e) => setPair2({ ...pair2, to: e.target.value })}
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {pair2ToOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{metrics.pair2.current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">vs Benchmark: {metrics.pair2.benchmark.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold ${parseFloat(metrics.pair2.diff) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {parseFloat(metrics.pair2.diff) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(metrics.pair2.diff)}% from benchmark
            </div>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Rate Comparison</h2>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={CHART_TICK_STYLE} />
                <YAxis tick={CHART_TICK_STYLE} />
                <Tooltip
                  contentStyle={TOOLTIP_CONTENT_STYLE}
                  formatter={(value) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={rate1Key}
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={LINE_DOT_STYLE}
                  name={`${pair1.from}→${pair1.to}`}
                />
                <Line
                  type="monotone"
                  dataKey={rate2Key}
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  dot={LINE_DOT_STYLE}
                  name={`${pair2.from}→${pair2.to}`}
                />
                <Line
                  type="monotone"
                  dataKey="Benchmark1"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`${pair1.from}→${pair1.to} Benchmark`}
                />
                <Line
                  type="monotone"
                  dataKey="Benchmark2"
                  stroke="hsl(var(--secondary-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`${pair2.from}→${pair2.to} Benchmark`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Insights */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold">Market Insights</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• <strong>{pair1.from}→{pair1.to}</strong> is trading {parseFloat(metrics.pair1.diff) > 0 ? 'above' : 'below'} benchmark rates</p>
            <p>• <strong>{pair2.from}→{pair2.to}</strong> is trading {parseFloat(metrics.pair2.diff) > 0 ? 'above' : 'below'} benchmark rates</p>
            <p>• Compare rates to find the best exchange rates for your needs</p>
          </div>
        </div>
      </div>
    </div>
  );
}