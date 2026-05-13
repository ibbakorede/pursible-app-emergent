import { useMemo, useState } from 'react';
import { TrendingUp, Calendar, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const TIER_CONFIG = {
  tier_1: { label: 'Tier 1', bonus: '$5', color: '#3b82f6' },
  tier_2: { label: 'Tier 2', bonus: '$15', color: '#10b981' },
  tier_3: { label: 'Tier 3', bonus: '$50', color: '#f59e0b' }
};

const BONUS_TYPE_CONFIG = {
  signup: { label: 'Sign-up', color: '#06b6d4' },
  kyc_completed: { label: 'KYC Completed', color: '#8b5cf6' },
  first_deposit: { label: 'First Deposit', color: '#ec4899' },
  volume_milestone: { label: 'Volume Milestone', color: '#f97316' }
};

// Chart style constants
const CHART_TICK_STYLE = { fontSize: 12 };
const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px'
};

export default function ReferralActivityDashboard({ referrals }) {
  const [dateRange, setDateRange] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const filteredData = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return referrals.filter(ref => {
      const refDate = ref.completed_at ? new Date(ref.completed_at) : new Date(ref.created_date);
      
      if (dateRange === 'week' && refDate < oneWeekAgo) return false;
      if (dateRange === 'month' && refDate < oneMonthAgo) return false;
      if (selectedType !== 'all' && ref.bonus_type !== selectedType) return false;
      
      return ref.status === 'completed';
    });
  }, [referrals, dateRange, selectedType]);

  const bonusByTier = useMemo(() => {
    const data = Object.keys(TIER_CONFIG).map(tier => ({
      name: TIER_CONFIG[tier].label,
      count: filteredData.filter(r => r.bonus_tier === tier).length,
      total: filteredData
        .filter(r => r.bonus_tier === tier)
        .reduce((sum, r) => sum + (r.bonus_amount || 0), 0),
      fill: TIER_CONFIG[tier].color
    }));
    return data.filter(d => d.count > 0);
  }, [filteredData]);

  const bonusByType = useMemo(() => {
    const data = Object.keys(BONUS_TYPE_CONFIG).map(type => ({
      name: BONUS_TYPE_CONFIG[type].label,
      value: filteredData.filter(r => r.bonus_type === type).length,
      fill: BONUS_TYPE_CONFIG[type].color
    }));
    return data.filter(d => d.value > 0);
  }, [filteredData]);

  const dailyActivity = useMemo(() => {
    const grouped = {};
    filteredData.forEach(ref => {
      const date = ref.completed_at ? new Date(ref.completed_at).toLocaleDateString() : new Date(ref.created_date).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + (ref.bonus_amount || 0);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([date, amount]) => ({ date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), amount }));
  }, [filteredData]);

  const totalEarned = filteredData.reduce((sum, r) => sum + (r.bonus_amount || 0), 0);
  const avgBonus = filteredData.length > 0 ? (totalEarned / filteredData.length).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1">
          {['all', 'week', 'month'].map(range => (
            <Button
              key={range}
              size="sm"
              variant={dateRange === range ? 'default' : 'outline'}
              className="rounded-lg text-xs"
              onClick={() => setDateRange(range)}
            >
              {range === 'all' ? 'All Time' : range === 'week' ? 'This Week' : 'This Month'}
            </Button>
          ))}
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Bonus Types</option>
          {Object.entries(BONUS_TYPE_CONFIG).map(([type, cfg]) => (
            <option key={type} value={type}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Earned</p>
          <p className="text-2xl font-bold text-primary">${totalEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Average Bonus</p>
          <p className="text-2xl font-bold text-emerald-500">${avgBonus}</p>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No referrals in this period
        </div>
      ) : (
        <>
          {/* Daily Activity Chart */}
          {dailyActivity.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Daily Bonus Activity</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={CHART_TICK_STYLE} />
                  <YAxis tick={CHART_TICK_STYLE} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bonus by Type */}
          {bonusByType.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Bonus Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={bonusByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {bonusByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Bonus by Tier */}
          {bonusByTier.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Tier Performance</h3>
              </div>
              <div className="space-y-3">
                {bonusByTier.map(tier => (
                  <div key={tier.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.fill }} />
                      <span className="text-sm font-medium">{tier.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${tier.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">{tier.count} referral{tier.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}