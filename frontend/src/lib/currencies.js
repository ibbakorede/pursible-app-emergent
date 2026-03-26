export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸', color: 'text-green-600', bg: 'bg-green-50', decimals: 2 },
  USDC: { symbol: '$', name: 'USD Coin', flag: '💎', color: 'text-blue-600', bg: 'bg-blue-50', decimals: 2 },
  USDT: { symbol: '$', name: 'Tether', flag: '💚', color: 'text-teal-600', bg: 'bg-teal-50', decimals: 2 },
  NGN: { symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬', color: 'text-purple-600', bg: 'bg-purple-50', decimals: 2 },
};

export const formatCurrency = (amount, currency) => {
  const c = CURRENCIES[currency];
  if (!c) return `${amount}`;
  return `${c.symbol}${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals })}`;
};

export const STATUS_COLORS = {
  initiated: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  processing: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
  reversed: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
};

export const KYC_STATUS_COLORS = {
  not_started: { bg: 'bg-slate-100', text: 'text-slate-600' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700' },
  in_review: { bg: 'bg-blue-50', text: 'text-blue-700' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700' },
};

export const CONVERSION_PAIRS = [
  { from: 'USD', to: 'NGN', label: 'USD → NGN' },
  { from: 'USD', to: 'USDC', label: 'USD → USDC' },
  { from: 'USD', to: 'USDT', label: 'USD → USDT' },
  { from: 'USDC', to: 'NGN', label: 'USDC → NGN' },
  { from: 'USDC', to: 'USDT', label: 'USDC → USDT' },
  { from: 'USDT', to: 'NGN', label: 'USDT → NGN' },
];

export const generateRefId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TXN-';
  for (let i = 0; i < 12; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};