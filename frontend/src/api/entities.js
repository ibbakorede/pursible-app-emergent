/**
 * entities.js — Centralized entity access layer for Pursible
 *
 * All backend integration functions (Steps 3–5) import from here.
 * UI pages continue to import directly from base44Client as before — do not change them.
 *
 * Entity schemas (defined in Base44 dashboard):
 *
 * User (extended)
 *   - bridge_wallet_id:        String  — Bridge.xyz wallet ID
 *   - circle_wallet_id:        String  — Circle wallet ID
 *   - flutterwave_account_id:  String  — Flutterwave virtual account ID
 *   (all other fields already existed)
 *
 * Transaction (extended)
 *   - provider:                String  — "bridge" | "circle" | "breet" | "flutterwave"
 *   - provider_transaction_id: String  — external provider's transaction reference
 *   (all other fields already existed)
 *
 * Balance (new)
 *   - user_email:   String   — lookup key, matches Base44 auth email
 *   - usd:          Number   — USD balance
 *   - usdc:         Number   — USDC balance
 *   - usdt:         Number   — USDT balance
 *   - ngn:          Number   — NGN balance
 *   - last_updated: DateTime — last time balances were fetched from providers
 *
 * AppError (new)
 *   - user_email:     String  — optional, omitted for unauthenticated errors
 *   - function_name:  String  — name of the cloud function that threw
 *   - provider:       String  — optional, which provider was being called
 *   - error_message:  String  — full error string (never exposed raw to UI)
 *   - created_date:   DateTime — set automatically by Base44
 *
 * KYCRecord (existing, used for KYC gate checks in functions 3, 4, 5)
 *   - user_email: String
 *   - status:     "pending" | "approved" | "rejected" | "in_review"
 */

import { base44 } from './base44Client';

// Existing entities — re-exported here so backend functions have one import point
export const Users        = base44.entities.User;
export const Transactions = base44.entities.Transaction;
export const Wallets      = base44.entities.Wallet;
export const KYCRecords   = base44.entities.KYCRecord;

// New entities created in dashboard (Step 1)
export const Balances  = base44.entities.Balance;
export const AppErrors = base44.entities.AppError;

/**
 * logError — writes a structured error record to the AppError collection.
 * Call this inside every catch block in every cloud function.
 *
 * @param {object} params
 * @param {string} params.functionName  - name of the function that threw
 * @param {string} params.errorMessage  - error.message or stringified error
 * @param {string} [params.userEmail]   - omit if not available
 * @param {string} [params.provider]    - omit if not a provider call
 */
export async function logError({ functionName, errorMessage, userEmail, provider }) {
  try {
    await AppErrors.create({
      function_name: functionName,
      error_message: errorMessage,
      ...(userEmail  && { user_email: userEmail }),
      ...(provider   && { provider }),
    });
  } catch {
    // Silently swallow — error logging must never crash the caller
  }
}

/**
 * getKYCStatus — returns the KYCRecord for a user, or null if none exists.
 * Used by the KYC gate in functions 3, 4, and 5.
 *
 * @param {string} userEmail
 * @returns {Promise<object|null>}
 */
export async function getKYCStatus(userEmail) {
  const records = await KYCRecords.filter({ user_email: userEmail });
  return records?.[0] ?? null;
}

/**
 * assertKYCApproved — throws a structured error if the user is not KYC-approved.
 * Import and call this at the top of depositFiat, swapCurrency, and withdraw.
 *
 * @param {string} userEmail
 * @throws {{ kycBlocked: true, status: string, redirectTo: "/kyc" }}
 */
export async function assertKYCApproved(userEmail) {
  const record = await getKYCStatus(userEmail);
  if (!record || record.status !== 'approved') {
    const status = record?.status ?? 'none';
    throw {
      kycBlocked: true,
      status,
      message:
        status === 'pending'   ? 'Your identity verification is pending review. You will be notified once approved.' :
        status === 'in_review' ? 'Your documents are under review. Please check back shortly.' :
        status === 'rejected'  ? 'Your verification was not approved. Please re-submit your documents.' :
                                 'You must complete identity verification before making transactions.',
      redirectTo: '/kyc',
    };
  }
}
