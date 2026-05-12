# Pursible - API Documentation

## Base URL
```
Production: https://your-domain.com/api
Preview: https://backend-api-hub-1.preview.emergentagent.com/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### Health Check
```http
GET /api/health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000000+00:00"
}
```

---

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}
```
**Response:**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "kyc_status": "not_started",
    "created_date": "2024-01-01T00:00:00.000000+00:00"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Biometric Login
```http
POST /api/auth/biometric-login
Content-Type: application/json

{
  "email": "user@example.com"
}
```
*Note: Client must verify biometric before calling this endpoint*

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

---

### Conversion Rates

#### Get All Rates
```http
GET /api/rates
```
**Response:**
```json
{
  "success": true,
  "rates": [
    {"from_currency": "USD", "to_currency": "NGN", "rate": 1550, "fee_percentage": 0.5},
    {"from_currency": "USD", "to_currency": "USDC", "rate": 1, "fee_percentage": 0.1},
    ...
  ]
}
```

#### Get Specific Rate
```http
GET /api/rates/{from_currency}/{to_currency}
```
**Example:** `GET /api/rates/USD/NGN`

**Response:**
```json
{
  "success": true,
  "rate": 1550,
  "fee_percentage": 0.5,
  "from_currency": "USD",
  "to_currency": "NGN"
}
```

---

### Wallets

#### Get User Balance
```http
GET /api/user/balance
Authorization: Bearer <token>
```
**Response:**
```json
{
  "total_usd": 0,
  "wallets": [
    {"currency": "USD", "available_balance": 0, "pending_balance": 0},
    {"currency": "USDC", "available_balance": 0, "pending_balance": 0},
    {"currency": "USDT", "available_balance": 0, "pending_balance": 0},
    {"currency": "NGN", "available_balance": 0, "pending_balance": 0}
  ]
}
```

---

### Currency Swap

#### Get Quote
```http
POST /api/functions/GetSwapQuote
Authorization: Bearer <token>
Content-Type: application/json

{
  "from_currency": "USD",
  "to_currency": "NGN",
  "amount": 100
}
```
**Response:**
```json
{
  "success": true,
  "quote": {
    "from_amount": 100,
    "to_amount": 154225,
    "rate": 1550,
    "fee": 775,
    "fee_percentage": 0.5,
    "expires_at": "2024-01-01T00:15:00.000000+00:00"
  }
}
```

#### Execute Swap
```http
POST /api/functions/ExecuteSwap
Authorization: Bearer <token>
Content-Type: application/json

{
  "from_currency": "USD",
  "to_currency": "NGN",
  "amount": 100
}
```

---

### Bank Accounts

#### Verify Bank Account
```http
POST /api/functions/VerifyBankAccount
Authorization: Bearer <token>
Content-Type: application/json

{
  "bank_code": "058",
  "account_number": "0123456789"
}
```
**Response:**
```json
{
  "success": true,
  "account_name": "John Doe",
  "account_number": "0123456789",
  "bank_name": "Guaranty Trust Bank"
}
```

---

### KYC

#### Submit KYC
```http
POST /api/functions/SubmitKYC
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "John Doe",
  "date_of_birth": "1990-01-15",
  "address": "123 Main St, Lagos",
  "nationality": "Nigerian",
  "id_type": "passport",
  "id_number": "A12345678",
  "id_front_url": "/api/files/abc123.png",
  "id_back_url": "/api/files/def456.png",
  "selfie_url": "/api/files/ghi789.png"
}
```

---

### File Upload

#### Upload File
```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
```
**Supported types:** JPG, PNG, WEBP, PDF (max 10MB)

**Response:**
```json
{
  "success": true,
  "file_url": "/api/files/abc123.png"
}
```

#### Serve File
```http
GET /api/files/{filename}
```

---

### Deposit Accounts

#### Get Deposit Methods
```http
GET /api/entities/deposit_accounts/filter?is_active=true
Authorization: Bearer <token>
```
**Response:**
```json
[
  {
    "id": "uuid",
    "type": "usd_wire",
    "label": "USD Wire Transfer",
    "is_active": true,
    "fields": [
      {"key": "bank_name", "label": "Bank Name", "value": "Bridge Bank"},
      {"key": "routing_number", "label": "Routing Number", "value": "..."},
      {"key": "account_number", "label": "Account Number", "value": "..."}
    ]
  },
  ...
]
```

---

## Error Responses

All errors follow this format:
```json
{
  "detail": "Error message here"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limits

Currently no rate limiting is implemented. For production, consider:
- 100 requests/minute for authenticated endpoints
- 20 requests/minute for auth endpoints (login/register)

---

## Supported Currencies

| Code | Name | Type |
|------|------|------|
| USD | US Dollar | Fiat |
| NGN | Nigerian Naira | Fiat |
| USDC | USD Coin | Stablecoin |
| USDT | Tether | Stablecoin |
