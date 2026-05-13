# Pursible - Product Requirements Document

## Product Overview

**Pursible** is a fintech application that enables users to send, receive, convert, and withdraw money across multiple currencies. The app focuses on the USD-NGN corridor with support for stablecoins (USDC, USDT).

### Tagline
*"Send, Receive, Convert & Withdraw — Instantly"*

---

## Target Users

1. **Nigerian Diaspora** - Sending money home to Nigeria
2. **Freelancers** - Receiving USD payments, converting to NGN
3. **Crypto Users** - Converting between stablecoins and fiat
4. **Small Businesses** - Cross-border payments

---

## Core Features

### ✅ Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| User Registration & Login | ✅ Complete | JWT authentication |
| Biometric Login | ✅ Complete | Face ID, Fingerprint, Windows Hello |
| Multi-Currency Wallets | ✅ Complete | USD, USDC, USDT, NGN |
| Currency Conversion | ✅ Complete | Real-time rates, fee transparency |
| Deposit Instructions | ✅ Complete | Wire, Stablecoin, Bank transfer |
| Bank Account Linking | ✅ Complete | Nigerian banks |
| KYC Verification Flow | ✅ Complete | Document upload |
| Push Notifications | ✅ Complete | Web push, FCM-ready |
| Light/Dark Mode | ✅ Complete | System preference + toggle |
| Transaction History | ✅ Complete | Filterable, searchable |
| Profile Management | ✅ Complete | Settings, preferences |

### 🔄 Pending (Requires API Keys)

| Feature | Integration | Status |
|---------|-------------|--------|
| Real Bank Verification | Flutterwave | Awaiting API key |
| KYC Identity Check | Dojah | Awaiting API key |
| USD Deposits | Bridge.xyz | Awaiting API key |
| NGN Withdrawals | Flutterwave | Awaiting API key |

### 📋 Future Roadmap

| Feature | Priority | Notes |
|---------|----------|-------|
| Native Mobile App | P1 | Capacitor build |
| Two-Factor Authentication | P1 | TOTP/SMS |
| Recurring Transfers | P2 | Scheduled payments |
| Bill Payments | P2 | Airtime, utilities |
| Virtual Cards | P3 | USD virtual cards |

---

## Technical Architecture

### Frontend
- **Framework:** React 18 (Create React App)
- **Styling:** Tailwind CSS + Shadcn/UI
- **State Management:** React Query + Context API
- **Routing:** React Router v6
- **Authentication:** JWT + WebAuthn

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** MongoDB (Motor async driver)
- **Authentication:** JWT (PyJWT) + bcrypt
- **File Storage:** Local (S3 ready)

### Integrations
- **Payments:** Flutterwave (pending)
- **KYC:** Dojah (pending)
- **USD Rails:** Bridge.xyz (pending)

---

## Database Schema

### Users Collection
```json
{
  "id": "uuid",
  "email": "string",
  "password_hash": "string",
  "full_name": "string",
  "kyc_status": "not_started|pending|approved|rejected",
  "created_date": "datetime",
  "last_biometric_login": "datetime"
}
```

### Wallets Collection
```json
{
  "id": "uuid",
  "user_email": "string",
  "currency": "USD|USDC|USDT|NGN",
  "available_balance": "number",
  "pending_balance": "number",
  "created_date": "datetime"
}
```

### Transactions Collection
```json
{
  "id": "uuid",
  "user_email": "string",
  "type": "deposit|withdrawal|conversion|transfer",
  "from_currency": "string",
  "to_currency": "string",
  "from_amount": "number",
  "to_amount": "number",
  "fee": "number",
  "status": "pending|completed|failed",
  "created_date": "datetime"
}
```

### Conversion Rates Collection
```json
{
  "id": "uuid",
  "from_currency": "string",
  "to_currency": "string",
  "rate": "number",
  "fee_percentage": "number",
  "is_active": "boolean",
  "created_date": "datetime"
}
```

---

## Exchange Rates

| From | To | Rate | Fee |
|------|-----|------|-----|
| USD | NGN | 1,550 | 0.5% |
| USD | USDC | 1 | 0.1% |
| USD | USDT | 1 | 0.1% |
| USDC | NGN | 1,550 | 0.5% |
| USDT | NGN | 1,550 | 0.5% |
| NGN | USD | 0.000645 | 0.5% |

---

## Security Measures

1. **Authentication**
   - JWT tokens with 24-hour expiration
   - Bcrypt password hashing
   - WebAuthn biometric authentication

2. **Data Protection**
   - Environment variables for secrets
   - No sensitive data in logs
   - HTTPS only in production

3. **Input Validation**
   - Pydantic models for API requests
   - Frontend form validation
   - File type/size restrictions

---

## UI/UX Design

### Brand Colors
- **Primary:** Olive (#5C6B3E in HSL: 82, 40%, 38%)
- **Background:** Dark (#0D0D0D) / Light (#FAFAFA)
- **Accent:** Olive variations

### Typography
- **Font:** Inter
- **Headings:** Bold, larger sizes
- **Body:** Regular, readable sizes

### Design Principles
1. Mobile-first responsive design
2. Clear visual hierarchy
3. Minimal, focused interfaces
4. Instant feedback on actions
5. Beautiful currency logos (flags + crypto icons)

---

## Testing

### Backend Test Coverage
- 26 API tests (100% pass rate)
- Authentication flows
- CRUD operations
- Validation errors
- Edge cases
- Full frontend testing (all pages verified)

### Test Credentials
- **Email:** testuser123@paysible.com
- **Password:** Test123!

### Test Reports
- `/app/test_reports/iteration_5.json` (Latest - All passing)

---

## Deployment

### Current Environment
- **Platform:** Emergent
- **Preview URL:** https://backend-api-hub-1.preview.emergentagent.com
- **Database:** MongoDB (Emergent managed)

### Production Checklist
- [ ] Configure custom domain
- [ ] Add Flutterwave API keys
- [ ] Add Dojah API keys
- [ ] Add Bridge.xyz API keys
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Configure backup strategy

---

## Changelog

### May 13, 2026 (v1.0.5)
- **Large Component Splitting Complete:**
  - **ConvertFunds.jsx** (574 → 150 lines):
    - `CurrencyPicker.jsx` - Currency selection with balances
    - `ConversionInput.jsx` - Main conversion form
    - `ConversionConfirm.jsx` - Review and confirm step
    - `ConversionSuccess.jsx` - Success confirmation
    - `convertConstants.js` - Shared utilities
  - **KYCFlow.jsx** (467 → 200 lines):
    - `KYCIntroStep.jsx` - Introduction and requirements
    - `KYCPersonalStep.jsx` - Personal info form
    - `KYCDocumentStep.jsx` - ID document upload
    - `KYCSelfieStep.jsx` - Selfie verification
    - `kycConstants.js` - Validation utilities
  - **SecuritySettings.jsx** (409 → 175 lines):
    - `BiometricSection.jsx` - Biometric toggles
    - `TransactionPinModal.jsx` - PIN management
    - `ChangePasswordModal.jsx` - Password change
    - `securityConstants.js` - Validation utilities
- **Total Lines Reduced:** ~1,450 lines → ~525 lines (64% reduction)
- **All linting passed:** 0 errors across all new components

### May 13, 2026 (v1.0.4)
- **Backend Complexity Refactoring:**
  - Created `/app/backend/services/` module with single-responsibility services:
    - `WalletService` - Wallet CRUD, balance operations, credit/debit
    - `TransactionService` - Transaction creation, status updates, conversion rates
    - `NotificationService` - Notification creation, templates, user preferences
    - `KYCService` - KYC submission, validation, approval/rejection
  - Refactored `swap_currency()` from 161 lines to ~75 lines using services
  - Refactored `withdraw()` from 121 lines to ~70 lines using services
  - Refactored `flutterwave_webhook()` from 129 lines to separate handlers:
    - `_handle_deposit_webhook()`
    - `_handle_withdrawal_success_webhook()`
    - `_handle_withdrawal_failed_webhook()`
- **Frontend Component Splitting:**
  - Created `/app/frontend/src/components/withdraw/` module:
    - `AmountStep.jsx` - Amount entry with validation
    - `BankSelectStep.jsx` - Bank account selection/addition
    - `ConfirmStep.jsx` - Withdrawal confirmation
    - `SuccessStep.jsx` - Success confirmation
    - `withdrawConstants.js` - Shared constants and utilities
  - Refactored `WithdrawNGN.jsx` from 738 lines to 135 lines
- **All linting passed:** 0 errors across backend and frontend

### May 13, 2026 (v1.0.3)
- **Code Quality Audit Fixes - Round 2:**
  - **Security Fixes:**
    - Moved test credentials to environment variables in `test_code_quality_fixes.py`
    - Migrated biometric lock timestamp from localStorage to sessionStorage (`useBiometricLock.js`)
    - Migrated prompt tracking to sessionStorage (`PostLoginPrompts.jsx`)
    - Updated Onboarding.jsx to use sessionStorage for auth token retrieval
  - **Index as Key Fixes (9 instances):**
    - `AdminOverview.jsx` - KYC pie chart cells now use `entry.name` as key
    - `TransactionDetail.jsx` - Timeline entries use `entry.timestamp` as key
    - `ReceiveUSD.jsx` - Info badges and steps use unique IDs
    - `KYCFlow.jsx` - Progress steps and rejection messages use stable keys
    - `Support.jsx` - FAQ items now have unique IDs
    - `WithdrawNGN.jsx` - Info badges use stable IDs
    - `ConvertFunds.jsx` - Conversion breakdown rows use stable IDs
  - **Hook Dependency Fixes:**
    - `WithdrawNGN.jsx` - Refactored bank lookup with useCallback pattern
    - `PostLoginPrompts.jsx` - Extracted notification check into useCallback
  - **Python Linting Fixes:**
    - Fixed `== True` comparisons to use `is True` (Pythonic style)
- **All linting passed:** 0 errors across all files

### May 12, 2026 (v1.0.2)
- **Code Quality Audit Fixes Applied:**
  - Item 2: Fixed missing React hook dependencies in WithdrawNGN, WalletOverview, RateAlerts, Transactions
  - Item 3: Improved security - moved auth tokens from localStorage to sessionStorage with expiration
  - Item 4: Refactored DocUpload component - nested ternaries replaced with clean render functions
  - Item 6: Eliminated nested ternary expressions throughout codebase
  - Item 8: Added Python type hints to backend utility functions
- **Security Improvements:**
  - Auth tokens now use sessionStorage (cleared on tab close)
  - Added token expiration handling (7 days)
  - Legacy localStorage token migration for backwards compatibility
  - Biometric credentials include 90-day expiration
- **New Feature: Security Score Indicator**
  - Added visual security score on Profile page (0-100 scale)
  - Tracks 5 security factors: KYC, Biometric, Email, Password, Bank
  - Color-coded progress bar (Excellent/Good/Fair/Needs Attention)
  - Clickable incomplete factors link to relevant setup pages
  - Contextual tips to improve security score
- **Test Coverage:** 24/24 backend tests passing

### March 26, 2026 (v1.0.1)
- Added Security Guidelines documentation
- Added Architecture documentation
- Enhanced test coverage (26/26 backend tests + full frontend tests)
- Added data-testid attributes for theme toggle

### March 26, 2026 (v1.0.0)
- Implemented biometric login (WebAuthn)
- Added push notifications (service worker)
- Updated currency logos (flags + crypto icons)
- Added light/dark mode toggle
- Fixed bank selection bottom sheet
- Fixed currency converter input
- Added global error boundary
- Code audit and fixes

### Previous
- Initial app migration from Base44 to FastAPI
- JWT authentication implementation
- Multi-currency wallet setup
- KYC flow implementation
- Bank account linking

---

## Contact

- **Repository:** GitHub (private)
- **Support:** Emergent Discord
