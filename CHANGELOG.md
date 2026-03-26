# Changelog

All notable changes to Paysible will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-03-26

### Added
- **Biometric Authentication**
  - WebAuthn-based login (Face ID, Fingerprint, Windows Hello)
  - Post-login prompt to enable biometric
  - Biometric option on subsequent app opens
  - Security settings toggles for biometric features

- **Push Notifications**
  - Service worker for web push notifications
  - Transaction alerts (deposits, withdrawals, conversions)
  - Rate alerts (when target rate is reached)
  - Security alerts (new login, password changes)
  - Notification permission request flow
  - FCM-ready for future mobile app

- **UI Enhancements**
  - Currency logos: US Flag (USD), USDC logo, Tether logo, Nigeria Flag (NGN)
  - Light/Dark mode toggle in Profile > Preferences
  - Paysible brand logo on login page
  - Updated tagline: "Send, Receive, Convert & Withdraw — Instantly"
  - Enhanced bottom navigation with larger icons
  - Clickable currency cards on Convert page for quick selection

- **Documentation**
  - API documentation (`/docs/API.md`)
  - Developer setup guide (`/docs/SETUP.md`)
  - Product requirements document (`/memory/PRD.md`)
  - Project README with full documentation

- **Developer Experience**
  - Environment config validation (`/src/lib/config.js`)
  - Loading skeleton components (`/src/components/shared/Skeletons.jsx`)
  - Global error boundary for crash recovery
  - Proper `.gitignore` files for sensitive data

### Changed
- Login page redesigned with Olive/Black brand colors
- Bank selection bottom sheet improved (scroll, search, keyboard handling)
- Currency converter reorganized (wallets up, converter down, input field added)
- Bottom navigation styling (cleaner icons, better active states)

### Fixed
- "Invalid time value" date error on dashboard
- Deposit funds tab not showing deposit methods
- "No rate available" error on currency conversion
- KYC file upload failing
- Bank account list cut off at top
- Text visibility on login page (white on dark background)

### Security
- Fixed bare `except` clauses in backend
- Removed unused imports
- Added biometric login endpoint with proper validation
- Environment variables protected in `.gitignore`

---

## [0.9.0] - 2026-03-25

### Added
- Initial migration from Base44 to FastAPI
- JWT authentication system
- Multi-currency wallet support (USD, USDC, USDT, NGN)
- Currency conversion with exchange rates
- Bank account linking flow
- KYC verification flow
- Transaction history
- Profile management

### Infrastructure
- React frontend (migrated from Vite to CRA)
- FastAPI backend
- MongoDB database
- Emergent platform deployment

---

## [1.0.1] - 2026-03-26

### Added
- **Documentation**
  - Security guidelines (`/docs/SECURITY.md`) with authentication, data protection, and production checklist
  - Architecture documentation (`/docs/ARCHITECTURE.md`) with system diagrams and database schema
  - Enhanced test coverage documentation

### Improved
- **Testing**
  - Comprehensive test run: 26/26 backend tests passing (100%)
  - Full frontend testing: All pages and flows verified working
  - Added explicit `data-testid` attributes for theme toggle components

### Technical
- Profile page theme toggle now has `data-testid="theme-toggle-button"` and `data-testid="theme-toggle-switch"` for easier automated testing

---

## [Unreleased]

### Planned
- Flutterwave integration for Nigerian bank payments
- Dojah integration for KYC verification
- Bridge.xyz integration for USD rails
- Native mobile app (Capacitor)
- Two-factor authentication (TOTP/SMS)
- Recurring transfers
- Bill payments
- Virtual USD cards
