/**
 * Convert components - Shared constants and utilities
 */

export const ALLOWED_PAIRS = {
  USD: ['USDT', 'NGN'],
  USDT: ['NGN'],
  USDC: ['NGN'],
};

export const SUPPORTED_CURRENCIES = ['USD', 'USDC', 'USDT', 'NGN'];

/**
 * Get valid destination currencies for a source currency
 */
export const getValidDestinations = (fromCurrency) => {
  return ALLOWED_PAIRS[fromCurrency] || [];
};

/**
 * Check if a currency pair is valid
 */
export const isValidPair = (from, to) => {
  return ALLOWED_PAIRS[from]?.includes(to) || false;
};
