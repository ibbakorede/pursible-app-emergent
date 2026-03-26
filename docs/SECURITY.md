# Paysible - Security Guidelines

## Overview

This document outlines the security measures implemented in Paysible and best practices for maintaining security in production deployments.

---

## Authentication & Authorization

### JWT Tokens
- **Algorithm:** HS256
- **Expiration:** 7 days (configurable via `JWT_EXPIRATION_HOURS`)
- **Storage:** `localStorage` (client-side)
- **Refresh:** Tokens are re-issued on biometric login

### Password Security
- **Hashing:** bcrypt with auto-generated salt
- **Minimum Length:** 6 characters (enforced frontend + backend)
- **Transmission:** Always over HTTPS

### WebAuthn (Biometric Authentication)
- Platform authenticators only (Face ID, Fingerprint, Windows Hello)
- Credential IDs stored in `localStorage`
- No biometric templates leave the device
- Server trusts client-side WebAuthn verification

---

## Data Protection

### Sensitive Data Handling
| Data Type | Storage | Encryption |
|-----------|---------|------------|
| Passwords | MongoDB | bcrypt hash |
| JWT Secret | Environment | N/A |
| API Keys | Environment | N/A |
| User PII | MongoDB | At rest (MongoDB) |
| File Uploads | Local/S3 | In transit (HTTPS) |

### MongoDB Security
- Authentication required in production
- Network access restricted to backend only
- Indexes on sensitive lookup fields
- `_id` excluded from API responses

### Environment Variables
Protected variables (never commit):
```
JWT_SECRET
MONGO_URL
FLUTTERWAVE_SECRET_KEY
DOJAH_SECRET_KEY
DOJAH_APP_ID
BRIDGE_API_KEY
WEBHOOK_SECRET
```

---

## API Security

### CORS Configuration
```python
allow_origins=["https://your-domain.com"]  # Production
allow_credentials=True
allow_methods=["GET", "POST", "PATCH", "DELETE"]
```

### Rate Limiting (Recommended)
```python
# Production rate limits (not yet implemented)
- Auth endpoints: 10 req/min
- API endpoints: 100 req/min
- File uploads: 5 req/min
```

### Input Validation
- Pydantic models for all request bodies
- Email validation via `EmailStr`
- File type/size restrictions on uploads
- Account number format validation

---

## Webhook Security

### Flutterwave Webhooks
```python
# Verify signature
verif_hash = request.headers.get("verif-hash")
if verif_hash != WEBHOOK_SECRET:
    return {"received": True}  # Silent reject
```

### Webhook Best Practices
1. Always verify signatures
2. Use HTTPS endpoints only
3. Implement idempotency
4. Log all webhook events
5. Process asynchronously

---

## KYC & Compliance

### Identity Verification Flow
1. User submits personal information
2. Documents uploaded via secure endpoint
3. Dojah API verifies identity (when configured)
4. Status tracked: `not_started` → `pending` → `in_review` → `approved/rejected`

### Document Handling
- Accepted formats: JPG, PNG, WEBP, PDF
- Maximum size: 10MB
- Stored with unique UUIDs
- Access restricted to document owner

---

## Security Headers (Recommended)

Add these headers in production:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

---

## Logging & Monitoring

### Error Logging
- All exceptions logged to `AppError` collection
- Includes: function name, error message, user email, provider
- No sensitive data in logs (passwords, tokens)

### Audit Events to Track
- Login attempts (success/failure)
- Password changes
- Biometric enrollments
- KYC status changes
- Large transactions
- Withdrawal requests

---

## Production Checklist

### Before Launch
- [ ] Change `JWT_SECRET` to strong random value
- [ ] Configure HTTPS with valid certificate
- [ ] Restrict CORS to production domain
- [ ] Enable MongoDB authentication
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Enable audit logging
- [ ] Set up monitoring/alerting
- [ ] Remove test mode auto-approvals
- [ ] Review file permissions

### Ongoing
- [ ] Regular dependency updates
- [ ] Security audit quarterly
- [ ] Penetration testing annually
- [ ] Monitor for unusual activity
- [ ] Review access logs

---

## Incident Response

### If Token Compromised
1. Invalidate all user sessions
2. Force password reset
3. Notify affected user
4. Review access logs
5. Rotate JWT_SECRET if widespread

### If API Key Exposed
1. Rotate key immediately in provider dashboard
2. Update environment variables
3. Review for unauthorized transactions
4. Notify affected users if data exposed

---

## Reporting Security Issues

If you discover a security vulnerability:
1. **Do NOT** create a public GitHub issue
2. Email: security@paysible.com
3. Include: steps to reproduce, impact assessment
4. We aim to respond within 48 hours

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [WebAuthn Guide](https://webauthn.guide/)
- [MongoDB Security Checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
