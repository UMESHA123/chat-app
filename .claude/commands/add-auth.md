Build the complete authentication system for this chat application.

Backend (Express.js + Mongoose):
- POST /api/auth/register — create user, return JWT pair
- POST /api/auth/login — verify password with bcryptjs, return JWT pair
- POST /api/auth/logout — clear refreshToken in DB
- GET /api/auth/me — return current user (protected)
- POST /api/auth/refresh — verify + rotate refresh token

OAuth (Passport.js):
- GET /api/auth/google + /api/auth/google/callback
- GET /api/auth/github + /api/auth/github/callback
- Both redirect to CLIENT_URL/auth/callback?token=<jwt>

Token strategy:
- Access token: JWT, 7 days, returned in response body (stored in localStorage)
- Refresh token: JWT, 30 days, stored in User.refreshToken (select: false)
- Same error message for wrong email and wrong password (prevent enumeration)

Frontend (Next.js + Zustand):
- authStore (persisted to localStorage): user, accessToken, refreshToken, setAuth(), clearAuth()
- api.js: fetch wrapper that auto-refreshes on 401 using stored refreshToken
- app/auth/callback/page.js: reads ?token from URL, fetches /api/auth/me, stores in authStore
- Login/register forms with error handling
- Redirect to /inbox after successful auth
- Redirect to /login if not authenticated when visiting protected pages

Security:
- bcryptjs 12 rounds on password
- Rate limiting: 10 requests per 15min on login and register
- Password excluded from all responses via Mongoose select: false + toJSON transform

Read SPEC.md §9 for the full security context including the localStorage trade-off rationale.
