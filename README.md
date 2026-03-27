# Paysible

<p align="center">
  <img src="frontend/public/paysible_icon_white.svg" alt="Paysible Logo" width="80" height="80">
</p>

<p align="center">
  <strong>Send, Receive, Convert & Withdraw — Instantly</strong>
</p>

<p align="center">
  A modern fintech application for cross-border payments and currency conversion.
</p>

---

## Features

🔐 **Secure Authentication**
- Email/password login
- Biometric login (Face ID, Fingerprint, Windows Hello)
- JWT token-based sessions

💰 **Multi-Currency Wallets**
- US Dollar (USD)
- USD Coin (USDC)
- Tether (USDT)
- Nigerian Naira (NGN)

🔄 **Instant Conversion**
- Real-time exchange rates
- Low fees (0.1% - 0.5%)
- Transparent pricing

🏦 **Bank Integration**
- Link Nigerian bank accounts
- Instant withdrawals (coming soon)
- Wire transfers

📱 **Modern Experience**
- Beautiful, responsive UI
- Light & Dark mode
- Push notifications
- Mobile-ready (Capacitor)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, **Vite 6**, Tailwind CSS, Shadcn/UI |
| Backend | FastAPI, Python 3.10+ |
| Database | MongoDB |
| Auth | JWT, WebAuthn |
| Notifications | Web Push, FCM-ready |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB 6+

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/paysible-app.git
cd paysible-app

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
yarn install

# Start development servers
# Terminal 1 - Backend
cd backend && uvicorn server:app --port 8001 --reload

# Terminal 2 - Frontend
cd frontend && yarn start
```

### Environment Variables

Create `.env` files:

**backend/.env**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=paysible
JWT_SECRET=your-secret-key
```

**frontend/.env**
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

---

## Documentation

- 📘 [API Documentation](docs/API.md)
- 🛠️ [Setup Guide](docs/SETUP.md)
- 🏗️ [Architecture](docs/ARCHITECTURE.md)
- 🔐 [Security Guidelines](docs/SECURITY.md)
- 📋 [Product Requirements](memory/PRD.md)

---

## Project Structure

```
paysible/
├── backend/
│   ├── server.py         # FastAPI application
│   ├── requirements.txt  # Python dependencies
│   └── tests/            # API tests
│
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities
│   │   └── api/          # API client
│   └── public/           # Static assets
│
└── docs/                 # Documentation
```

---

## Screenshots

| Login | Dashboard | Convert |
|-------|-----------|---------|
| Biometric + Password | Multi-currency wallets | Instant conversion |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/auth/biometric-login` | Login with biometrics |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/rates` | Get exchange rates |
| GET | `/api/user/balance` | Get wallet balances |
| POST | `/api/functions/GetSwapQuote` | Get conversion quote |
| POST | `/api/functions/ExecuteSwap` | Execute conversion |
| POST | `/api/upload` | Upload file |

See [full API documentation](docs/API.md) for details.

---

## Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
yarn test
```

**Test Credentials:**
- Email: `testuser123@paysible.com`
- Password: `Test123!`

---

## Roadmap

- [x] User authentication (JWT)
- [x] Biometric login
- [x] Multi-currency wallets
- [x] Currency conversion
- [x] Push notifications
- [x] Light/Dark mode
- [ ] Flutterwave integration
- [ ] Dojah KYC integration
- [ ] Bridge.xyz USD rails
- [ ] Native mobile app
- [ ] Two-factor authentication

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is proprietary software. All rights reserved.

---

## Support

- 💬 [Discord](https://discord.gg/VzKfwCXC4A)
- 📧 Email: support@paysible.com

---

<p align="center">
  Built with ❤️ using <a href="https://emergent.sh">Emergent</a>
</p>
