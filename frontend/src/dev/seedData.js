/**
 * DEV ONLY - Seed data for development and testing
 * This file is only used in development mode and should never be bundled in production.
 * Test credentials should be set via VITE_DEV_* environment variables.
 */

export const TEST_CREDENTIALS = {
  email: import.meta.env.VITE_DEV_TEST_EMAIL || 'devtest@example.com',
  password: import.meta.env.VITE_DEV_TEST_PASSWORD || '',
  full_name: 'Test User',
};

export const MOCK_WALLETS = [
  { currency: 'USD', available_balance: 1500.00, pending_balance: 0 },
  { currency: 'USDC', available_balance: 500.00, pending_balance: 50.00 },
  { currency: 'USDT', available_balance: 250.00, pending_balance: 0 },
  { currency: 'NGN', available_balance: 750000, pending_balance: 0 },
];

export const MOCK_TRANSACTIONS = [
  { type: 'deposit', from_amount: 100, from_currency: 'USD', status: 'completed' },
  { type: 'swap', from_amount: 50, from_currency: 'USD', to_amount: 73500, to_currency: 'NGN', status: 'completed' },
  { type: 'withdrawal', from_amount: 25000, from_currency: 'NGN', status: 'pending' },
];

export const MOCK_GOALS = [
  { name: 'Emergency Fund', target_amount: 5000, current_amount: 1500, currency: 'USD', status: 'active' },
  { name: 'Vacation', target_amount: 2000, current_amount: 800, currency: 'USD', status: 'active' },
];

export const MOCK_RATE_ALERTS = [
  { from_currency: 'USD', to_currency: 'NGN', target_rate: 1600, condition: 'above', is_active: true },
];
