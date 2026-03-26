import { STATUS_COLORS, KYC_STATUS_COLORS } from '@/lib/currencies';

export default function StatusBadge({ status, type = 'transaction' }) {
  const colors = type === 'kyc' ? KYC_STATUS_COLORS : STATUS_COLORS;
  const c = colors[status] || colors.initiated || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  const label = (status || 'unknown').replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${c.bg} ${c.text}`}>
      {c.dot && <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />}
      {label}
    </span>
  );
}