/**
 * WithdrawNGN - Shared utilities and constants
 */

export const NIGERIAN_BANKS = [
  'Access Bank', 'Carbon', 'Citibank Nigeria', 'Ecobank Nigeria', 'Fidelity Bank',
  'First Bank of Nigeria', 'First City Monument Bank (FCMB)', 'Guaranty Trust Bank (GTBank)',
  'Heritage Bank', 'Jaiz Bank', 'Keystone Bank', 'Kuda Bank', 'Moniepoint',
  'OPay', 'PalmPay', 'Parallex Bank', 'Polaris Bank', 'Providus Bank',
  'Stanbic IBTC Bank', 'Standard Chartered Bank', 'Sterling Bank', 'SunTrust Bank',
  'Union Bank', 'United Bank for Africa (UBA)', 'Unity Bank', 'Wema Bank', 'Zenith Bank',
];

export const WITHDRAWAL_FEE = 50;
export const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

/**
 * Get status styles for transaction badges
 */
export const getStatusStyles = (status) => {
  const styles = {
    completed: 'bg-emerald-50 text-emerald-700',
    processing: 'bg-blue-50 text-blue-700',
    failed: 'bg-red-50 text-red-700',
  };
  return styles[status] || 'bg-muted text-muted-foreground';
};
