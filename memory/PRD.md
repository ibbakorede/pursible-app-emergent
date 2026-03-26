# Paysible - Product Requirements Document

## Original Problem Statement
"Do not build a frontend UI. I have an existing designed app. Focus entirely on building the backend API integrations, serverless functions, data models, webhooks, and Capacitor mobile configuration described below. Output clean, exportable code I can connect to my existing frontend. I will give access to my GitHub for the code, just migrate a copy to Emergent and host it here without making any edit to my GitHub repo"

**Source Repository:** https://github.com/ibbakorede/paysible-app-main

## What Was Built

### Date: March 26, 2026

### Backend API (FastAPI + MongoDB)
- **Authentication System**: JWT-based authentication with registration, login, and session management
- **User Management**: User CRUD operations with password hashing (bcrypt)
- **Wallet System**: Multi-currency wallets (USD, USDC, USDT, NGN) auto-created on registration
- **Transaction Management**: Full transaction lifecycle with status tracking and timeline
- **KYC System**: KYC submission and verification (auto-approves in test mode)
- **Bank Account Verification**: Nigerian bank account verification via Flutterwave API (mocked in test mode)
- **Currency Conversion**: Swap between currencies with quotes and execution
- **Withdrawal System**: Withdrawal processing with fee calculation
- **Deposit System**: Virtual account deposit instructions
- **Notifications**: User notification system
- **Webhooks**: Flutterwave webhook handler for payment events
- **Generic Entity API**: CRUD operations for all entity types

### Frontend Migration
- Migrated from Vite to Create React App (Emergent platform)
- Replaced Base44 SDK with custom API client
- Updated AuthContext for JWT authentication
- Fixed React hook issues and missing dependencies
- Added Capacitor stubs for web deployment
- Preserved ALL original UI/design - no changes to styles or layouts

### Database Models (MongoDB Collections)
- `users` - User accounts with auth credentials
- `wallets` - Multi-currency wallet balances
- `transactions` - Transaction history with status tracking
- `kyc_records` - KYC verification records
- `bank_accounts` - Linked bank accounts
- `notifications` - User notifications
- `balances` - Balance snapshots
- `conversion_rates` - Currency conversion rates
- `app_errors` - Error logging
- `audit_logs` - Audit trail

## User Personas
1. **Primary User**: Nigerian/African diaspora sending/receiving money internationally
2. **Secondary User**: Individuals holding multiple currencies (USD, USDC, USDT, NGN)
3. **Admin User**: Platform administrators managing KYC, transactions, and support

## Core Requirements (Static)
- Multi-currency wallet management
- KYC identity verification
- Currency conversion with live rates
- Bank withdrawals (NGN)
- USD/USDC deposits
- Transaction history and receipts
- Push notifications (mobile)
- Offline queue for transactions

## What's Been Implemented ✅
- [x] User registration and login (JWT auth)
- [x] Multi-currency wallet creation
- [x] Balance fetching API
- [x] KYC submission flow (auto-approve in test mode)
- [x] Bank account verification (mocked)
- [x] Currency swap with quotes
- [x] Withdrawal processing
- [x] Deposit instructions
- [x] Transaction history
- [x] Notification system
- [x] Webhook handlers
- [x] Frontend migration to Emergent
- [x] **Deposit Funds UI** - 3 deposit methods (USD Wire, Stablecoin, NGN Bank) with account details
- [x] **Currency Conversion Rates** - `/api/rates` endpoint with seeded exchange rates
- [x] **Bank Selection BottomSheet** - Fixed CSS overflow/cutoff issue
- [x] **KYC File Upload** - `/api/upload` endpoint for document uploads

## Third-Party Integrations (MOCKED - API Keys Required)
| Provider | Purpose | Status |
|----------|---------|--------|
| Flutterwave | NGN payments, bank verification, withdrawals | MOCKED - needs `FLUTTERWAVE_SECRET_KEY` |
| Dojah | KYC verification (BVN, NIN) | MOCKED - needs `DOJAH_API_KEY`, `DOJAH_SECRET_KEY` |
| Bridge.xyz | USD/USDC API | MOCKED - needs `BRIDGE_API_KEY` |

## Prioritized Backlog

### P0 - Critical (Required for Production)
1. Integrate real Flutterwave API with production keys
2. Integrate real Dojah KYC verification
3. Integrate Bridge.xyz for USD/USDC handling
4. Add rate limiting and security hardening
5. Production webhook secret validation

### P1 - High Priority
1. Real-time exchange rate fetching
2. Transaction email notifications
3. Admin dashboard backend APIs
4. Referral system completion
5. Support ticket handling

### P2 - Medium Priority
1. Push notifications via FCM
2. Biometric authentication
3. Rate alerts system
4. Savings goals feature
5. Market comparison data

### P3 - Nice to Have
1. Multi-language support
2. Transaction receipt PDF export
3. Account statements
4. Recurring transfers
5. Spending analytics

## Next Tasks List
1. Obtain production API keys from Flutterwave, Dojah, and Bridge
2. Configure environment variables for production
3. Test real payment flows end-to-end
4. Set up Capacitor for mobile builds
5. Configure webhook URLs with providers

## Bug Fixes Completed (March 26, 2026)
| Issue | Description | Fix Applied |
|-------|-------------|-------------|
| Bug 1 | Deposit Funds tab UI incomplete | Added `DepositAccount` entity to apiClient.js, seeded 3 deposit accounts |
| Bug 2 | Currency conversion "no rate available" | Added `/api/rates` endpoint, seeded 10 currency pairs |
| Bug 3 | Bank account list cut off at top | Fixed BottomSheetSelect.jsx CSS with proper max-height and overflow |
| Bug 4 | KYC file upload fails | Added `/api/upload` endpoint + `integrations.Core.UploadFile` in apiClient.js |

## Architecture Notes
- **Backend**: FastAPI running on port 8001
- **Frontend**: React (CRA) running on port 3000
- **Database**: MongoDB (local development)
- **Auth**: JWT tokens with 7-day expiry
- **API Pattern**: RESTful with /api prefix
