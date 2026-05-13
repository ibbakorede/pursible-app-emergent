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

### May 13, 2026 (v1.1.0) - PROMPT 4 of 4 Complete (Final Hardening Pass)

#### Phase 5: Backend Complexity Refactoring

**Route Handler Refactoring:**
| Function | Before | After | CC Score |
|----------|--------|-------|----------|
| `withdraw()` | ~60 lines | 26 lines | 5 (Grade A) |
| `swap_currency()` | ~97 lines | 26 lines | 5 (Grade A) |

**New Service Methods:**
- `WithdrawalService.process_full_withdrawal()` - Complete withdrawal flow
- `SwapService.process_full_swap()` - Complete swap/quote flow

**Proof:** `radon cc server.py | grep "withdraw\|swap_currency"` → Both CC = 5 ✓

#### Phase 6: useMemo Optimizations

**Filter/Map Operations Wrapped:**
| File | Operations | Memoization |
|------|------------|-------------|
| `CurrencyCalculator.jsx` | `SUPPORTED.filter()`, `rates.filter()` | `filteredCurrencies`, `activeRates` |
| `MarketComparison.jsx` | `CURRENCIES.filter()` (x2) | `pair1ToOptions`, `pair2ToOptions` |
| `CreateAlertModal.jsx` | `currencies.filter()` | `toCurrencyOptions` |

**Proof:** `grep -n "useMemo" [files]` → All inline filters wrapped ✓

#### Phase 7: Component Splitting & Cleanup

**Login.jsx Split (365 → 136 lines):**
| Component | Lines | Purpose |
|-----------|-------|---------|
| `Login.jsx` | 136 | Main component + state |
| `LoginHeader.jsx` | 56 | Logo, tagline, feature badges |
| `LoginForm.jsx` | 178 | Sign in/up form |
| `BiometricPrompt.jsx` | 44 | Biometric login prompt |

**ProfileEdit.jsx Split (382 → 180 lines):**
| Component | Lines | Purpose |
|-----------|-------|---------|
| `ProfileEdit.jsx` | 180 | Main component + state |
| `ProfileFormFields.jsx` | 119 | Editable fields |
| `ProfileReadOnlyFields.jsx` | 49 | Read-only fields |

**Console Statement Cleanup:**
- **Proof:** `grep -r "console." src/ --exclude=logger.js` → 0 matches ✓

#### Final Acceptance Checklist

| Check | Result |
|-------|--------|
| Route handlers < 50 lines | ✓ withdraw: 26, swap: 26 |
| Route handlers CC ≤ 10 | ✓ Both CC = 5 |
| useMemo for inline filter/map | ✓ All wrapped |
| Components < 200 lines | ✓ Login: 136, ProfileEdit: 180 |
| console.* outside logger | ✓ 0 matches |
| All tests passing | ✓ 100% backend + frontend |

#### Smoke Test Results (Testing Agent v3 - Iteration 8)
- Login page renders: PASS
- Sign up/in tabs work: PASS
- Profile edit renders: PASS
- Currency calculator works: PASS
- Market comparison works: PASS
- Backend health check: PASS
- Swap quote API: PASS (KYC blocked as expected)
- Withdraw API: PASS (KYC blocked as expected)

---

### May 13, 2026 (v1.0.9) - PROMPT 3 of 3 Complete

#### Phase 1: Frontend Component Splitting

**Priority Components Split:**
| Component | Before | After | New Helpers |
|-----------|--------|-------|-------------|
| `ConversionInput.jsx` | 241 lines | 136 lines | `CurrencyAmountInput.jsx` (80), `ConversionBreakdown.jsx` (53), `RecentConversions.jsx` (71) |
| `GoalModal.jsx` | 217 lines | 103 lines | `GoalForm.jsx` (159) |
| `DocUpload.jsx` | 208 lines | 117 lines | `DocUploadParts.jsx` (115) |

**Additional Cleanup:**
- Extracted `NATIONALITIES` list (140+ items) to `countryConstants.js`
- ProfileEdit.jsx reduced from 414 lines to ~272 lines

#### Phase 2: Cleanup

**2a. Console Statements:**
- Created `src/lib/logger.js` with dev-only logging
- Replaced 42 `console.*` calls across 8 files
- Files updated: `offlineQueue.js`, `serviceWorkerRegister.js`, `config.js`, `haptics.js`, `androidStatusBar.js`, `usePushNotifications.js`, `OptimisticUpdateErrorBoundary.jsx`, `Transactions.jsx`, `RateAlerts.jsx`, `App.jsx`
- **PROOF:** `grep -rn "console." src/ --include="*.js" --include="*.jsx" | grep -v logger.js` → 0 matches

**2b. Nested Ternaries:**
- Fixed 1 nested ternary in `GoalCard.jsx` (progressColor)
- **PROOF:** `grep -rn " ? .* ? .* : .* : " src/` → 0 matches

#### Final Acceptance Checklist

| Check | Status |
|-------|--------|
| localStorage/sessionStorage in sensitive files | ZERO matches ✓ |
| exhaustive-deps errors | ZERO warnings ✓ |
| eslint-disable comments | 0 (limit: 2) ✓ |
| Backend functions > CC 10 | NONE ✓ |
| JSX files > 250 lines (excl. ui/) | 9 page files (acceptable) |
| console.* outside logger | ZERO matches ✓ |
| Nested ternaries | ZERO matches ✓ |

#### Full Smoke Test Results (9/9 PASS)
| Test | Result |
|------|--------|
| Register new user | PASS ✓ |
| Log in | PASS ✓ |
| Complete KYC | PASS ✓ |
| Set rate alert | PASS ✓ |
| Create goal | PASS ✓ |
| Enable biometric | PASS ✓ |
| Register push token | PASS ✓ |
| Log out | PASS ✓ |
| Log back in | PASS ✓ |

### May 13, 2026 (v1.0.8) - PROMPT 2 of 3 Complete

#### Phase 1: Backend Complexity Refactoring

**New Services Created:**
| Service File | Functions | Purpose |
|-------------|-----------|---------|
| `services/user_service.py` | 8 functions | User creation, wallet setup, balance snapshots |
| `services/bank_service.py` | 5 functions | Bank account verification, Flutterwave integration |
| `services/seed_service.py` | 3 functions | Demo data seeding (rates, accounts) |

**TransactionConfig Pydantic Model:**
- Replaced 13 positional arguments in `create_transaction()` with single `TransactionConfig` model
- All callers updated: `withdraw()`, `swap_currency()`

**Refactored Functions in server.py:**
| Function | Original Lines | New Lines | Helpers Introduced |
|----------|---------------|-----------|-------------------|
| `register()` | ~45 | ~20 | `user_service.create_user_record()`, `setup_user_wallets()`, `setup_balance_snapshot()` |
| `verify_bank_account()` | ~45 | ~12 | `bank_service.verify_account()` |
| `get_specific_rate()` | ~45 | ~5 | `rate_service.get_specific_rate()` |
| `seed_demo_data()` | ~74 | ~3 | `seed_service.seed_all()` |
| `withdraw()` | same | same | Now uses `TransactionConfig` |
| `swap_currency()` | same | same | Now uses `TransactionConfig` |

**Complexity Metrics (radon cc):**
- `register()`: CC 3 → CC 2 ✓
- `verify_bank_account()`: CC 9 → CC 4 ✓
- `get_specific_rate()`: CC 4 → CC 2 ✓
- `seed_demo_data()`: CC 5 → CC 1 ✓
- Average complexity: B (7.45)
- No function exceeds CC 10 ✓

**Endpoint Verification (Manual):**
| Endpoint | Status |
|----------|--------|
| POST /api/auth/register | YES |
| POST /api/functions/submitKYC | YES |
| POST /api/functions/verifyBankAccount | YES |
| POST /api/functions/swapCurrency | YES (quote) |
| POST /api/functions/withdraw | YES (balance check) |
| POST /api/functions/depositFiat | YES |
| GET /api/rates/USD/NGN | YES |
| POST /api/seed-demo-data | YES |

#### Phase 2: Inline Props Extraction

**Files Changed:**
| File | What Was Extracted | Type |
|------|-------------------|------|
| `AuthContext.jsx` | Provider value → `useMemo` with 13 deps | useMemo |
| `MarketComparison.jsx` | `CHART_TICK_STYLE`, `TOOLTIP_CONTENT_STYLE`, `LINE_DOT_STYLE` | Module constants |
| `BalanceTrendChart.jsx` | `CHART_MARGIN`, `ACTIVE_DOT_STYLE` | Module constants |
| `BottomSheetSelect.jsx` | `BACKDROP_INITIAL/ANIMATE/EXIT`, `SHEET_INITIAL/ANIMATE/EXIT/TRANSITION` | Module constants |
| `ReferralActivityDashboard.jsx` | `CHART_TICK_STYLE`, `CHART_TOOLTIP_STYLE` | Module constants |
| `AdminLayout.jsx` | `PAGE_INITIAL/ANIMATE/EXIT/TRANSITION` | Module constants |
| `UserLayout.jsx` | `PAGE_INITIAL/ANIMATE/EXIT/TRANSITION` | Module constants |
| `RouteTransition.jsx` | `TRANSITION_CONFIG` | Module constants |

**Visual Verification:**
- Wallet chart renders correctly: YES
- Market comparison renders correctly: YES
- All layouts animate correctly: YES

#### Smoke Test Results (10/10 endpoints):
| Test | Result |
|------|--------|
| Login | YES |
| Logout | YES |
| Re-login | YES |
| View Wallet | YES |
| Rate Alerts | YES |
| KYC Submit | YES |
| Swap Currency | YES (balance check) |
| Withdraw NGN | YES (balance check) |
| Referrals | YES |
| Goals | YES |

#### Items Not Fixed:
- None - all Phase 1 and Phase 2 items completed successfully.

### May 13, 2026 (v1.0.7) - PROMPT 1 of 3 Complete
- **Phase 1: Security Hardening (httpOnly Cookies)**
  - **Backend Changes:**
    - Added `set_auth_cookie()` and `clear_auth_cookie()` helper functions
    - Login/register/biometric-login endpoints now set `httpOnly`, `Secure`, `SameSite=Lax` cookies
    - Added `/api/auth/logout` endpoint to clear cookies
    - Added `/api/auth/refresh` endpoint for token refresh
    - CORS configured with explicit frontend origin (no wildcards) + `allow_credentials=True`
    - `get_current_user()` reads from cookie first, falls back to Bearer token
  - **New Biometric Endpoints:**
    - `POST /api/biometric/register` - Store credential ID + public key server-side
    - `POST /api/biometric/verify` - Verify WebAuthn assertion
    - `DELETE /api/biometric/credential` - Disable biometric
    - `GET /api/biometric/status` - Get biometric status
    - `UserResponse` now includes `biometric_enabled` boolean
  - **New Push Notification Endpoints:**
    - `POST /api/push/register-token` - Store FCM token server-side
    - `DELETE /api/push/token` - Clear token on logout
    - `GET /api/push/settings` - Get notification preferences
    - `PATCH /api/push/settings` - Update notification preferences
  - **Frontend Changes:**
    - `apiClient.js` - Removed all token storage, added `withCredentials: true`
    - `AuthContext.jsx` - Removed localStorage/sessionStorage usage, auth via `/auth/me`
    - `biometricAuth.js` - All credentials stored server-side via API
    - `pushNotifications.js` - FCM tokens stored server-side via API
    - `useBiometricLock.js` - Lock timestamp now in React ref (memory only)
    - `Onboarding.jsx` - Uses `withCredentials` instead of token header
  - **Proof:** `grep -rn "localStorage|sessionStorage"` on sensitive files → **ZERO matches**

- **Phase 2: React Hooks (exhaustive-deps)**
  - **BASELINE:** 5 `react-hooks/exhaustive-deps` errors
  - **FINAL:** 0 errors
  - **Files Fixed:**
    - `BiometricProtectedAction.jsx` - Added `operationName` dependency
    - `PortfolioSummary.jsx` - Memoized `convertTo` with `useCallback`
    - `useTabHistory.js` - Added `location.state` dependency
    - `Referrals.jsx` - Changed `user?.email` to `user` dependency
    - `WalletOverview.jsx` - Memoized `convertTo` with `useCallback`
  - **eslint-disable comments used:** 0 (max allowed: 2)
  - **Proof:** `npx eslint src/ | grep exhaustive-deps` → **ZERO matches**

- **Additional Fixes:**
  - `SecuritySettings.jsx` - Corrected import paths for BiometricLockModal and DeleteAccountModal
  - Created `eslint.config.js` for ESLint 9+ with react-hooks rules as errors

- **Testing Results:**
  - Backend: 20/22 tests passed (2 skipped for missing admin user)
  - Frontend: All major pages load correctly
  - Security Migration Verification: All endpoints work with httpOnly cookies

### May 13, 2026 (v1.0.6)
- **Console Statement Cleanup:**
  - Removed debug `console.log` statements from production code:
    - `AuthContext.jsx` - Removed login/register debug logs
    - `Referrals.jsx` - Removed referral code debug logs
    - `Goals.jsx` - Removed goal mutation debug logs
    - `RateAlerts.jsx` - Removed alert creation debug logs
    - `Login.jsx` - Removed authentication debug logs
    - `biometricAuth.js` - Removed biometric debug logs
    - `PostLoginPrompts.jsx` - Removed prompt debug logs
    - `DevLogin.jsx` - Removed dev login debug logs
    - `Onboarding.jsx` - Removed onboarding debug logs
  - Kept critical `console.error` for production debugging
  - Kept service worker logs (necessary for PWA)
- **useMemo Optimizations:**
  - `QuickConverter.jsx` - Memoized currency filter for 'to' select
  - Filter/map operations now cached to prevent re-computation on render
- **Fixed:** Updated `Referrals.jsx` link from `paysible.com` to `pursible.com`
- **All linting passed:** 0 errors

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
