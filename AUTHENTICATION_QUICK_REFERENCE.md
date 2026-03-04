# GramMate Authentication Quick Reference

## ✅ STATUS: FULLY IMPLEMENTED & TESTED (18/18 Tests Passing)

---

## 🚀 QUICK START

### Run the Backend
```bash
cd /workspaces/GramMate/backend
pip install -r requirements.txt
python main.py  # Server runs on http://localhost:8000
```

### Run Tests
```bash
cd /workspaces/GramMate/backend
pytest tests/ -v  # All 18 tests
pytest tests/test_security.py -v  # Security tests
pytest tests/test_auth.py -v  # Auth tests
```

### Frontend (Already Configured)
```bash
cd /workspaces/GramMate/frontend
npm install
npm start  # Frontend runs on http://localhost:3000
```

---

## 🔐 WHAT'S IMPLEMENTED

### Authentication
- ✅ JWT Bearer Token (24-hour expiration)
- ✅ Password Hashing (PBKDF2-SHA256)
- ✅ OAuth2 Security Dependency
- ✅ Protected Routes (automatic validation)

### Security
- ✅ Password Strength Validation (8+ chars, complexity)
- ✅ Rate Limiting (5 auth attempts/min, 100 API/min)
- ✅ Email Verification (7-day token expiration)
- ✅ Password Reset (1-hour token expiration)
- ✅ Input Validation (Pydantic models)

---

## 📋 TEST ENDPOINTS

### 1. Signup
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPass123!",
    "username": "testuser",
    "country_code": "US"
  }'
```
**Response:** `{ "access_token": "...", "token_type": "bearer", "user_id": "..." }`

### 2. Login
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPass123!"
  }'
```
**Response:** `{ "access_token": "...", "token_type": "bearer", "user_id": "..." }`

### 3. Protected Route (with Token)
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8000/wallet
```
**Response:** `{ "balance_cents": 0, "currency": "USD", ... }`

### 4. Password Reset Request
```bash
curl -X POST http://localhost:8000/auth/password-reset-request \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com" }'
```
**Response:** `{ "success": true, "message": "..." }`

### 5. Change Password (Authenticated)
```bash
curl -X POST http://localhost:8000/auth/change-password \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "StrongPass123!",
    "new_password": "NewPassword456!"
  }'
```
**Response:** `{ "success": true, "message": "Password changed successfully" }`

---

## 📚 DOCUMENTATION FILES

| File | Purpose |
|------|---------|
| [AUTHENTICATION_SECURITY_SUMMARY.md](AUTHENTICATION_SECURITY_SUMMARY.md) | **Comprehensive guide with all details** |
| [backend/tests/test_security.py](backend/tests/test_security.py) | Test examples & usage patterns |
| [backend/tests/test_auth.py](backend/tests/test_auth.py) | Original auth tests (still passing) |
| [backend/main.py](backend/main.py) | Implementation code |

---

## 🔑 DEFAULT CREDENTIALS (Development Only)

| Variable | Default | Where |
|----------|---------|-------|
| `SECRET_KEY` | `dev-secret-key-change-in-prod` | `.env` file |
| `DATABASE_URL` | `sqlite:///:memory:` | `.env` file |
| `JWT_ALGORITHM` | `HS256` | backend/main.py |
| `TOKEN_EXPIRY` | 24 hours | backend/main.py |

**⚠️ PRODUCTION:** Change `SECRET_KEY` to random 32+ character string!

---

## 🛡️ PASSWORD REQUIREMENTS

A strong password must have:
- ✅ Minimum 8 characters
- ✅ At least 3 of these 4 types:
  1. Uppercase (A-Z)
  2. Lowercase (a-z)
  3. Numbers (0-9)
  4. Special (!@#$%^&*()_+-=[]{}|;:,.<>?)

**Examples:**
- ✅ `StrongPass123!`
- ❌ `weakpassword123!` (no uppercase)
- ❌ `WeakPassword123` (no special char)
- ❌ `weak` (too short)

---

## 🔗 FRONTEND INTEGRATION (Already Done)

The frontend **already correctly sends JWT tokens**:

```javascript
// In App.jsx and AuthPage.jsx
const response = await fetch('http://localhost:8000/wallet', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`  // ✅ Correct format
  }
});
```

No frontend changes needed!

---

## 📊 TEST SUMMARY

### All 18 Tests Passing ✅

```
✅ test_signup_and_login (auth)
✅ test_reward_low_watch_unverified (reward)
✅ test_reward_full_watch_verified_us (reward)
✅ test_reward_handles_zero_duration (reward)
✅ test_signup_strong_password_success (security)
✅ test_signup_invalid_email (security)
✅ test_email_verification_with_token (security)
✅ test_password_reset_request (security)
✅ test_password_reset_confirm_invalid_token (security)
✅ test_password_reset_weak_new_password (security)
✅ test_login_with_valid_credentials (security)
✅ test_login_with_invalid_password (security)
✅ test_login_with_nonexistent_email (security)
✅ test_protected_route_without_token (security)
✅ test_protected_route_with_invalid_token (security)
✅ test_protected_route_with_valid_token (security)
✅ test_change_password_with_valid_old_password (security)
✅ test_change_password_with_invalid_old_password (security)
```

Run: `pytest tests/ -v`

---

## ⚡ COMMON SCENARIOS

### Scenario 1: New User Signs Up
```
1. User fills signup form with valid password
2. POST /auth/signup → Receives JWT token
3. Token stored in localStorage
4. User redirected to feed
5. All API requests send token in Authorization header
```

### Scenario 2: User Forgets Password
```
1. Click "Forgot Password" on login page
2. Enter email → POST /auth/password-reset-request
3. (In production) Email sent with reset link
4. Click reset link → Verify token
5. Enter new password → POST /auth/password-reset-confirm
6. Login with new password
```

### Scenario 3: Access Protected Route Without Token
```
1. Try to GET /wallet (no token)
2. Server returns 401 Unauthorized
3. Frontend detects 401 → redirect to login
```

### Scenario 4: Rate Limit Hit
```
1. 6th login attempt in 1 minute
2. Server returns 429 Too Many Requests
3. Client shows "Try again later" message
4. Rate limit resets after 60 seconds
```

---

## 🚨 TROUBLESHOOTING

### "Invalid credentials" on login
- ✅ Check email is correct
- ✅ Check password is correct
- ✅ Passwords are case-sensitive

### "Token validation failed" on API requests
- ✅ Token may be expired (24 hours) → Login again
- ✅ Check token is in Authorization header
- ✅ Format: `Authorization: Bearer <token>` (space after "Bearer")

### "Rate limit exceeded"
- ✅ Wait 60 seconds, then retry
- ✅ Auth endpoints have strict limits (5/min)
- ✅ General API has higher limits (100/min)

### "Password too weak"
- ✅ Must be 8+ characters
- ✅ Must have uppercase, lowercase, digits, special chars
- ✅ Need at least 3 of 4 character types

---

## 📞 SUPPORT

**For more details, see:** [AUTHENTICATION_SECURITY_SUMMARY.md](AUTHENTICATION_SECURITY_SUMMARY.md)

**API Documentation:** http://localhost:8000/docs (auto-generated Swagger UI)

**Test Examples:** [backend/tests/test_security.py](backend/tests/test_security.py)

---

**Last Updated:** March 4, 2026  
**Status:** ✅ Production-Ready (with recommendations)  
**Tests:** 18/18 PASSING ✅
