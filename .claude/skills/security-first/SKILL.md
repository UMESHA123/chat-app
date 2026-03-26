---
name: security-first
description: Enforces strong security practices for this chat application (Express.js + MongoDB + Next.js)
---

# Security Standards

## Authentication

- JWT stored in **localStorage** — accepted project trade-off (see SPEC §9)
  - Mitigate XSS risk: never use `dangerouslySetInnerHTML` with user content
  - React's default rendering auto-escapes, which covers most cases
- Passwords hashed with `bcryptjs` (12 rounds minimum)
- Refresh tokens stored in MongoDB with rotation (one-time use)

## Input Handling

- Validate and sanitize all inputs — use Mongoose schema validation as primary gate
- Escape user input used in `$regex` queries to prevent NoSQL injection:
  ```javascript
  const safe = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  ```
- Never pass raw `req.body` to `Model.create()` — whitelist fields explicitly

## API Protection

- `helmet()` on all responses (sets security headers)
- `cors()` with specific `CLIENT_URL` — never `origin: '*'` with `credentials: true`
- Rate limiting on auth endpoints (`express-rate-limit`)
- `protect` middleware on every non-public route
- Membership check on every conversation/message route

## Secrets

- All secrets in `.env` (never committed)
- `.env` in `.gitignore` — provide `.env.example` for onboarding
- `JWT_SECRET` must be ≥ 32 random characters
- `CLOUDINARY_API_SECRET`, OAuth secrets: never in frontend code or `NEXT_PUBLIC_` vars

## File Uploads

- Multer `fileFilter` validates MIME type (not just extension)
- `multer.memoryStorage()` — never write to disk
- Max file size: 10MB
- Cloudinary generates the storage path — users have no control over filenames

## MongoDB

- All queries via Mongoose (parameterized — no raw query string building)
- `select: false` on sensitive schema fields (password, refreshToken)
- Add `toJSON` transform to strip sensitive fields before serialization

## Socket.IO

- JWT verified in `io.use()` middleware before any event is processed
- Membership check inside every event handler that touches a conversation
