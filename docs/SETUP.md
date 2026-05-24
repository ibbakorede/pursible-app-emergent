# Pursible - Developer Setup Guide

## Overview

Pursible is a fintech application for cross-border payments, built with:
- **Frontend:** React (Create React App) + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python) + MongoDB
- **Authentication:** JWT tokens + WebAuthn biometrics

---

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB 6+
- Git

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/pursible-app.git
cd pursible-app
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=pursible
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
EOF

# Run server
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
yarn install

# Create .env file
cat > .env << EOF
REACT_APP_BACKEND_URL=http://localhost:8001
EOF

# Run development server
yarn start
```

### 4. Seed Demo Data
```bash
curl -X POST http://localhost:8001/api/seed-demo-data
```

---

## Project Structure

```
/app
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   ├── .env              # Environment variables
│   ├── uploads/          # User file uploads
│   └── tests/            # API tests
│
├── frontend/
│   ├── public/
│   │   ├── pursible_icon.svg       # Black logo
│   │   ├── pursible_icon_white.svg # White logo
│   │   └── sw.js                   # Service worker
│   │
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   │   ├── ui/        # Shadcn components
│   │   │   ├── shared/    # Shared components
│   │   │   ├── wallet/    # Wallet components
│   │   │   └── kyc/       # KYC components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities & contexts
│   │   └── pages/         # Page components
│   │
│   ├── package.json
│   └── .env
│
├── docs/
│   ├── API.md             # API documentation
│   └── SETUP.md           # This file
│
└── memory/
    └── PRD.md             # Product requirements
```

---

## Key Features

### Authentication
- Email/password registration and login
- JWT token-based sessions
- WebAuthn biometric login (Face ID, Fingerprint)

### Multi-Currency Wallets
- USD, USDC, USDT, NGN
- Real-time balance tracking
- Transaction history

### Currency Conversion
- Live exchange rates
- Quote before swap
- Fee transparency

### KYC Verification
- Document upload
- Identity verification (Dojah integration ready)

### Bank Accounts
- Link Nigerian bank accounts
- Bank verification (Flutterwave integration ready)

### Notifications
- Push notifications (web + mobile ready)
- Transaction alerts
- Rate alerts
- Security alerts

---

## Environment Variables

### Backend (.env)
```env
MONGO_URL=mongodb://...          # MongoDB connection string
DB_NAME=pursible                  # Database name
JWT_SECRET=...                    # JWT signing secret
JWT_ALGORITHM=HS256               # JWT algorithm
JWT_EXPIRATION_HOURS=24           # Token expiration

# Optional - for production integrations
FLUTTERWAVE_SECRET_KEY=...        # Flutterwave API key
DOJAH_APP_ID=...                  # Dojah app ID
DOJAH_SECRET_KEY=...              # Dojah secret key
BRIDGE_API_KEY=...                # Bridge.xyz API key
```

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=...         # Backend API URL
```

---

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
yarn test
```

---

## Deployment

### Emergent Platform
1. Push code to GitHub
2. Connect repo in Emergent dashboard
3. Click "Deploy"
4. Configure custom domain (optional)

### Docker (Alternative)
```dockerfile
# Dockerfile.backend
FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001"]
```

---

## API Integration Checklist

Before going to production, configure these integrations:

- [ ] **Flutterwave** - Nigerian bank payments
  - Get API keys: https://dashboard.flutterwave.com
  - Add `FLUTTERWAVE_SECRET_KEY` to backend .env

- [ ] **Dojah** - KYC verification
  - Get API keys: https://dojah.io
  - Add `DOJAH_APP_ID` and `DOJAH_SECRET_KEY` to backend .env

- [ ] **Bridge.xyz** - USD/USDC rails
  - Get API keys: https://bridge.xyz
  - Add `BRIDGE_API_KEY` to backend .env

---

## Support

- **Discord:** https://discord.gg/VzKfwCXC4A
- **Documentation:** /docs folder
- **Issues:** GitHub Issues
