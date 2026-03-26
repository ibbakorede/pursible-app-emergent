# Paysible - Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Web App   │  │  iOS App*   │  │ Android App*│              │
│  │   (React)   │  │ (Capacitor) │  │ (Capacitor) │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          └────────────────┴────────────────┘
                           │
                      HTTPS/WSS
                           │
┌─────────────────────────────────────────────────────────────────┐
│                        API LAYER                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    FastAPI Server                        │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │    │
│  │  │  Auth   │ │ Entities│ │Functions│ │Webhooks │        │    │
│  │  │ Router  │ │ Router  │ │ Router  │ │ Router  │        │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘        │    │
│  │       └──────────┬┴──────────┬┴───────────┘             │    │
│  │                  │           │                           │    │
│  │  ┌───────────────┴───────────┴───────────────┐          │    │
│  │  │         Middleware (CORS, Auth)            │          │    │
│  │  └───────────────────────────────────────────┘          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   MongoDB   │  │ File Store  │  │    Redis*   │              │
│  │  (Primary)  │  │  (Uploads)  │  │   (Cache)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ Flutterwave │  │    Dojah    │  │   Bridge    │              │
│  │ (Payments)  │  │    (KYC)    │  │ (USD Rails) │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘

* = Planned/Future
```

---

## Frontend Architecture

### Technology Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 18.x |
| Bundler | Create React App | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | Shadcn/UI | Latest |
| State Management | React Query | 5.x |
| Routing | React Router | 6.x |
| HTTP Client | Axios | 1.x |

### Directory Structure
```
frontend/src/
├── api/                    # API client layer
│   ├── apiClient.js        # Axios instance with interceptors
│   ├── base44Client.js     # High-level API client
│   └── entities.js         # Entity CRUD operations
│
├── components/
│   ├── ui/                 # Shadcn/UI components
│   ├── shared/             # Shared components
│   │   ├── BottomNav.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── SkeletonLoaders.jsx
│   ├── wallet/             # Wallet-specific components
│   └── kyc/                # KYC flow components
│
├── hooks/                  # Custom React hooks
│   ├── usePullToRefresh.js
│   └── useNotifications.js
│
├── lib/                    # Utilities and contexts
│   ├── AuthContext.jsx     # Authentication state
│   ├── ThemeContext.jsx    # Dark/Light mode
│   ├── biometricAuth.js    # WebAuthn implementation
│   ├── currencies.js       # Currency utilities
│   └── utils.js            # General utilities
│
├── pages/                  # Page components
│   ├── Login.jsx
│   ├── WalletOverview.jsx
│   ├── ConvertFunds.jsx
│   ├── TransactionHistory.jsx
│   └── Profile.jsx
│
└── App.jsx                 # Root component with routing
```

### State Management
```
┌─────────────────────────────────────────────────────┐
│                    React Query                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │   wallets   │  │    rates    │  │   kyc       │ │
│  │   query     │  │    query    │  │   query     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│              ↑ Automatic refresh (30-60s)           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   React Context                      │
│  ┌─────────────┐  ┌─────────────┐                   │
│  │ AuthContext │  │ThemeContext │                   │
│  │  user, jwt  │  │ dark/light  │                   │
│  └─────────────┘  └─────────────┘                   │
└─────────────────────────────────────────────────────┘
```

---

## Backend Architecture

### Technology Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.100+ |
| Runtime | Python | 3.10+ |
| Database Driver | Motor (async) | 3.x |
| Authentication | PyJWT | 2.x |
| Password Hashing | bcrypt | 4.x |
| HTTP Client | httpx | 0.24+ |

### API Router Structure
```python
app/
├── api_router/           # /api prefix
│   ├── auth_router/      # /api/auth
│   │   ├── POST /register
│   │   ├── POST /login
│   │   ├── POST /biometric-login
│   │   ├── GET  /me
│   │   └── PATCH /me
│   │
│   ├── entities_router/  # /api/entities/{entity}
│   │   ├── GET    /           # List
│   │   ├── GET    /filter     # Filter
│   │   ├── GET    /{id}       # Get one
│   │   ├── POST   /           # Create
│   │   ├── PATCH  /{id}       # Update
│   │   └── DELETE /{id}       # Delete
│   │
│   ├── functions_router/ # /api/functions
│   │   ├── POST /getBalance
│   │   ├── POST /submitKYC
│   │   ├── POST /verifyBankAccount
│   │   ├── POST /withdraw
│   │   ├── POST /swapCurrency
│   │   ├── POST /depositFiat
│   │   └── POST /createUserWallet
│   │
│   └── webhooks_router/  # /api/webhooks
│       └── POST /flutterwave
│
├── GET  /api/health
├── GET  /api/rates
├── GET  /api/rates/{from}/{to}
├── POST /api/upload
├── GET  /api/files/{filename}
└── POST /api/seed-demo-data
```

### Request Flow
```
Request → CORS → Auth Middleware → Router → Handler → Response
                      │                        │
                      ↓                        ↓
                 JWT Decode              MongoDB Query
                      │                        │
                      ↓                        ↓
                 User Lookup           Business Logic
```

---

## Database Schema

### Collections
```
MongoDB
├── users
│   ├── id (uuid)
│   ├── email (unique index)
│   ├── password_hash
│   ├── full_name
│   ├── kyc_status
│   └── created_date
│
├── wallets
│   ├── id
│   ├── user_email (index)
│   ├── currency (USD|USDC|USDT|NGN)
│   ├── available_balance
│   ├── pending_balance
│   └── created_date
│
├── transactions
│   ├── id
│   ├── user_email (index)
│   ├── type (deposit|withdrawal|conversion|transfer)
│   ├── from_currency, to_currency
│   ├── from_amount, to_amount
│   ├── fee
│   ├── status
│   ├── reference_id (index)
│   ├── timeline[]
│   └── created_date
│
├── conversion_rates
│   ├── id
│   ├── from_currency
│   ├── to_currency
│   ├── rate
│   ├── fee_percentage
│   ├── is_active
│   └── created_date
│
├── kyc_records
│   ├── id
│   ├── user_email (index)
│   ├── full_name
│   ├── date_of_birth
│   ├── nationality
│   ├── id_type, id_number
│   ├── id_document_url
│   ├── selfie_url
│   ├── status
│   ├── timeline[]
│   └── created_date
│
├── bank_accounts
│   ├── id
│   ├── user_email (index)
│   ├── bank_name
│   ├── account_number
│   ├── account_name
│   └── is_verified
│
├── notifications
│   ├── id
│   ├── user_email (index)
│   ├── title, message
│   ├── type
│   ├── is_read (index)
│   └── created_date
│
└── deposit_accounts
    ├── id
    ├── type
    ├── label
    ├── is_active
    ├── fields[]
    └── created_date
```

---

## Integration Architecture

### Payment Flow (Flutterwave)
```
User Request → API → Check KYC → Check Balance
                         ↓
                    Flutterwave API
                         ↓
                 Create Transaction (pending)
                         ↓
                    Webhook Callback
                         ↓
                 Update Transaction (completed)
                         ↓
                    Update Wallet
                         ↓
                 Send Notification
```

### KYC Flow (Dojah)
```
User Submits → Upload Docs → Call Dojah API
                                  ↓
                           Verify Identity
                                  ↓
                        ┌─────────┴─────────┐
                        ↓                   ↓
                   Approved             Rejected
                        ↓                   ↓
               Update kyc_status    Send Notification
                        ↓
               Unlock Features
```

---

## Deployment Architecture

### Current (Emergent Platform)
```
┌─────────────────────────────────────────┐
│            Kubernetes Cluster            │
│  ┌─────────────┐  ┌─────────────┐       │
│  │  Frontend   │  │   Backend   │       │
│  │   (nginx)   │  │  (uvicorn)  │       │
│  │   :3000     │  │    :8001    │       │
│  └──────┬──────┘  └──────┬──────┘       │
│         └────────┬───────┘              │
│                  ↓                      │
│         ┌───────────────┐               │
│         │    Ingress    │               │
│         │  /api → :8001 │               │
│         │    / → :3000  │               │
│         └───────────────┘               │
│                  ↓                      │
│         ┌───────────────┐               │
│         │   MongoDB     │               │
│         │   (managed)   │               │
│         └───────────────┘               │
└─────────────────────────────────────────┘
```

### Production (Recommended)
```
┌─────────────────────────────────────────────────────┐
│                    Load Balancer                     │
│                    (HTTPS/SSL)                       │
└─────────────────────┬───────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
┌─────────────────┐     ┌─────────────────┐
│   CDN / Static  │     │   API Gateway   │
│   (Frontend)    │     │  (Rate Limit)   │
└─────────────────┘     └────────┬────────┘
                                 │
                      ┌──────────┴──────────┐
                      ↓                     ↓
              ┌─────────────┐       ┌─────────────┐
              │  Backend 1  │       │  Backend 2  │
              └──────┬──────┘       └──────┬──────┘
                     └──────────┬──────────┘
                                ↓
                     ┌─────────────────┐
                     │   MongoDB Atlas │
                     │    (Replica)    │
                     └─────────────────┘
```

---

## Performance Considerations

### Frontend
- React Query caching (staleTime: 30s)
- Automatic background refetching
- Skeleton loaders for perceived speed
- Lazy loading for routes

### Backend
- Async MongoDB operations (Motor)
- Database indexes on frequently queried fields
- Connection pooling
- Response compression (gzip)

### Scaling
- Horizontal scaling via Kubernetes replicas
- Database read replicas for high traffic
- CDN for static assets
- Redis caching for rates (future)

---

## Monitoring & Observability

### Logs
- Application logs via Python logging
- Error tracking in AppError collection
- Request/response logging (production: minimal)

### Metrics (Recommended)
- Request latency (p50, p95, p99)
- Error rates by endpoint
- Database query performance
- External API call times

### Alerts
- High error rate (>1%)
- Slow responses (>2s p95)
- Database connection issues
- External service failures
