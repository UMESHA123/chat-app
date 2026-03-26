---
name: express-pro
description: Enforces scalable and production-ready Express.js backend architecture for this chat application (plain JavaScript, Mongoose, no TypeScript)
---

# Express.js Professional Standards

We use **Express.js 4 with plain JavaScript** for backend services.

## Architecture

- **FOLLOW** modular structure: `routes/` → `controllers/` → `models/` (Mongoose)
- **SEPARATE** business logic: controllers are thin, delegate heavy work to Mongoose queries
- Organize by resource: `authRoutes.js`, `conversationRoutes.js`, `messageRoutes.js`

## API Design

- Follow RESTful conventions
- Always use consistent response format:
  ```json
  { "success": true, "data": {} }
  { "success": false, "error": "message" }
  ```
- Base path: `/api/`

## Middleware Stack Order

```javascript
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// routes...
app.use(errorHandler); // LAST
```

## Error Handling

- Every async route handler MUST wrap in try/catch and call `next(err)`
- Global `errorHandler` middleware handles: Mongoose ValidationError, duplicate key (11000), JWT errors
- Never send raw error messages in production — check `NODE_ENV`

## Security Baseline

- `helmet()` on all responses
- `cors()` with specific `CLIENT_URL` origin (not `*`)
- Rate limiting on auth routes (`express-rate-limit`)
- `protect` middleware on all non-public routes
- `.select('-password -refreshToken')` or schema `select: false`

## File Uploads

- Always use `multer({ storage: multer.memoryStorage() })`
- Never write files to disk — stream buffer to Cloudinary with `upload_stream`
- Validate MIME type in `fileFilter`, not just extension

## Anti-Patterns

- ❌ Using TypeScript (project is plain JavaScript)
- ❌ Using Zod (use Mongoose schema validation)
- ❌ Storing files on disk (use Cloudinary stream)
- ❌ Inconsistent response format
- ❌ Missing `next(err)` in async handlers
- ❌ Wildcard CORS origin with credentials
