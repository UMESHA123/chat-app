---
name: auth-flow
description: Implement secure authentication flows for this chat application using JWT + Passport.js OAuth
---

# Authentication Flow

## Strategy (from SPEC)

- **Access Token**: 7-day JWT, stored in **localStorage** via Zustand persist
- **Refresh Token**: 30-day JWT, stored in MongoDB (rotation on each use)
- **OAuth**: Passport.js Google + GitHub → same JWT issued on callback
- **Socket.IO**: Token passed in `socket.handshake.auth.token`

> **Note on localStorage**: JWT is stored in localStorage (not httpOnly cookies) in this project. This is a documented trade-off in SPEC §9 — accepted for simplicity. Mitigated by sanitizing all rendered content to prevent XSS.

## Backend Flow

1. User registers/logs in → `bcryptjs.hash(password, 12)` on register
2. On success: issue `accessToken` (JWT, 7d) + `refreshToken` (JWT, 30d)
3. Store `refreshToken` in User document
4. Return both tokens in response body (client stores in localStorage)

## Refresh Flow

1. Client sends `refreshToken` in request body to `POST /api/auth/refresh`
2. Server verifies token + checks it matches DB stored value
3. If valid: delete old token, issue new pair (rotation)
4. Client updates localStorage with new tokens

## OAuth Flow (Passport.js)

1. Redirect user to `/api/auth/google` or `/api/auth/github`
2. Passport authenticates, finds or creates User
3. Issue JWT, redirect to `CLIENT_URL/auth/callback?token=<jwt>`
4. Frontend callback page: reads token from URL, fetches `/api/auth/me`, stores in Zustand

## Frontend (Zustand)

```javascript
// authStore persisted to localStorage key 'auth-storage'
// Exposes: user, accessToken, refreshToken, setAuth(), clearAuth()
```

Auto-refresh: `api.js` fetch wrapper catches 401, sends refreshToken, retries original request.

## Security

- Same error message for wrong email and wrong password (prevent enumeration)
- Rate limit `/api/auth/login` and `/api/auth/register` (10 req/15min)
- Passwords excluded via Mongoose `select: false` + `toJSON` transform
- Logout invalidates refreshToken in DB
- Socket.IO refuses connection if JWT invalid

## Anti-Patterns

- ❌ Returning different errors for wrong email vs wrong password
- ❌ Not invalidating refresh token on logout
- ❌ Exposing password hash in any API response
- ❌ Using `session: true` in Passport.js (we use session: false + JWT)
