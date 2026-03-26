# Chat Application — Production Specification

> Version 1.0 · Last updated 2026-03-25

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Folder Structure](#3-folder-structure)
4. [Data Models](#4-data-models)
5. [API Contracts](#5-api-contracts)
6. [WebSocket Protocol](#6-websocket-protocol)
7. [State Management](#7-state-management)
8. [File Upload Pipeline](#8-file-upload-pipeline)
9. [Authentication & Security](#9-authentication--security)
10. [Design System](#10-design-system)
11. [Design Decisions](#11-design-decisions)
12. [Scaling Strategy](#12-scaling-strategy)
13. [Claude Agents, Skills & Commands](#13-claude-agents-skills--commands)
14. [Environment Variables](#14-environment-variables)

---

## 1. Overview

A real-time chat application with direct messaging and group conversations. Built on a decoupled frontend/backend architecture:

| Layer     | Technology                        | Port  |
|-----------|-----------------------------------|-------|
| Frontend  | Next.js 16 (App Router), React 19 | 3000  |
| Backend   | Express.js 4, Socket.io 4         | 4000  |
| Database  | MongoDB Atlas (Mongoose 8)        | —     |
| Storage   | Cloudinary v2                     | —     |

---

## 2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         Browser / Client                         │
│                                                                  │
│  ┌─────────────────────────┐   ┌──────────────────────────────┐  │
│  │     Next.js App Router  │   │    Zustand State Stores       │  │
│  │  /login  /register      │   │  authStore (persisted)        │  │
│  │  /inbox  /             │   │  conversationStore            │  │
│  │                         │   │  uiStore                      │  │
│  │  Components:            │   │  userStore                    │  │
│  │  Navbar                 │   └──────────────┬───────────────┘  │
│  │  ChatSidebar            │                  │                  │
│  │  ChatWindow             │                  │                  │
│  │  CreateChatModal        │                  │                  │
│  │  CreateGroupModal       │                  │                  │
│  │  AboutGroupPanel        │                  │                  │
│  │  ToastContainer         │                  │                  │
│  └────────────┬────────────┘                  │                  │
│               │                               │                  │
│               │  HTTP (fetch)                 │  WS (socket.io)  │
└───────────────┼───────────────────────────────┼──────────────────┘
                │                               │
                ▼                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Express + Socket.io Server                     │
│                         (Port 4000)                              │
│                                                                  │
│  ┌───────────────────────┐   ┌──────────────────────────────┐   │
│  │      REST API          │   │      Socket.io Namespace     │   │
│  │  /api/auth             │   │  JWT auth middleware          │   │
│  │  /api/users            │   │  message:send                │   │
│  │  /api/conversations    │   │  typing:start / :stop        │   │
│  │  /api/messages         │   │  messages:read               │   │
│  │  /api/notifications    │   │  conversation:join           │   │
│  │  /api/upload           │   │  user:online / :offline      │   │
│  └──────────┬─────────────┘   └──────────────┬───────────────┘   │
│             │                                │                   │
│             │   Passport.js (Google/GitHub)  │                   │
│             │   JWT protect middleware        │                   │
│             │   Multer memory storage         │                   │
│             │   Cloudinary upload_stream      │                   │
│             └──────────────┬─────────────────┘                   │
└────────────────────────────┼────────────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
┌─────────────────────┐       ┌────────────────────────┐
│    MongoDB Atlas     │       │       Cloudinary        │
│                      │       │                        │
│  users               │       │  Images (auto)         │
│  conversations       │       │  Videos (video)        │
│  messages            │       │  Files (raw)           │
│  notifications       │       │                        │
└─────────────────────┘       └────────────────────────┘
```

**Request flow (sending a message):**

```
User types + hits Send
  → handleSend() in ChatWindow
    → [if files] POST /api/upload → Cloudinary → attachment URLs
    → POST /api/conversations/:id/messages (REST)
      → messageController.sendMessage()
        → Message.create() in MongoDB
        → io.to(conversationId).emit('message:new', message)
          → ChatWindow receives via socket, addMessage() updates Zustand
```

---

## 3. Folder Structure

```
untitled folder/
├── backend/                        # Express + Socket.io API server
│   ├── server.js                   # Entry point: HTTP + Socket.io init, Mongoose connect
│   ├── package.json
│   ├── .env                        # Server secrets (not committed)
│   └── src/
│       ├── app.js                  # Express app factory: middleware, route mounts
│       ├── passport.js             # Google + GitHub OAuth strategy config
│       ├── models/
│       │   ├── User.js             # Schema: username, email, password (bcrypt), isOnline
│       │   ├── Conversation.js     # Schema: type, participants[], lastMessage ref
│       │   ├── Message.js          # Schema: content, attachments[], readBy[], isDeleted
│       │   └── Notification.js     # Schema: recipient, type, preview, isRead
│       ├── controllers/
│       │   ├── authController.js   # register, login, getMe, oauthCallback
│       │   ├── conversationController.js
│       │   ├── messageController.js
│       │   ├── notificationController.js
│       │   └── userController.js
│       ├── routes/
│       │   ├── auth.js
│       │   ├── conversations.js
│       │   ├── messages.js
│       │   ├── notifications.js
│       │   ├── upload.js
│       │   └── users.js
│       ├── middleware/
│       │   ├── auth.js             # JWT protect middleware
│       │   └── upload.js           # Multer memoryStorage + uploadToCloudinary helper
│       └── socket/
│           └── index.js            # Socket.io event handlers
│
└── my-app/                         # Next.js 16 frontend
    ├── next.config.ts
    ├── package.json
    ├── tsconfig.json
    ├── .env.local                  # NEXT_PUBLIC_API_URL
    └── app/
        ├── layout.tsx              # Root layout: StoreHydration, ToastContainer
        ├── page.tsx                # / redirect to /inbox
        ├── globals.css             # Tailwind v4 + neobrutalist utility classes
        ├── favicon.ico
        ├── login/
        │   └── page.tsx
        ├── register/
        │   └── page.tsx
        ├── inbox/
        │   └── page.tsx            # Main chat UI: Sidebar + ChatWindow + AboutGroupPanel
        ├── components/
        │   ├── Avatar.tsx          # Deterministic color initials avatar
        │   ├── Navbar.tsx          # Top nav with user menu, create chat/group
        │   ├── ChatSidebar.tsx     # Conversation list with unread indicators
        │   ├── ChatWindow.tsx      # Message list + input bar + file chips
        │   ├── CreateChatModal.tsx # DM creation modal
        │   ├── CreateGroupModal.tsx
        │   ├── AboutGroupPanel.tsx # Group details side panel
        │   ├── StoreHydration.tsx  # Triggers Zustand persist rehydration on mount
        │   └── ToastContainer.tsx  # Global toast notifications
        ├── store/
        │   ├── authStore.ts        # Persisted: user, token, login, register, logout
        │   ├── conversationStore.ts # Conversations + message cache per conversation
        │   ├── uiStore.ts          # Modal state, sidebar, toasts queue
        │   ├── userStore.ts        # Users list cache with 2-min stale TTL
        │   └── index.ts            # Re-exports all stores
        ├── lib/
        │   ├── api.ts              # Typed HTTP client + all API modules
        │   ├── helpers.ts          # Avatar color, conv name/color, time formatting
        │   └── mockData.ts         # Empty — no mock data
        └── types/
            └── api.ts              # TypeScript interfaces matching Mongoose schemas
```

---

## 4. Data Models

### User
```
_id          ObjectId
username     String   unique, 3–30 chars
email        String   unique, lowercase
password     String   bcrypt(12), select:false
avatar       String?  URL
googleId     String?
githubId     String?
isOnline     Boolean  default: false
lastSeen     Date
socketId     String?  current Socket.io connection ID
createdAt    Date
updatedAt    Date
```

### Conversation
```
_id              ObjectId
type             "direct" | "group"
name             String?            group name (group only)
groupAvatar      String?
participants[]
  user           ObjectId → User
  role           "admin" | "member"
  joinedAt       Date
lastMessage      ObjectId → Message (populated for inbox preview)
lastActivityAt   Date               updated on every new message
createdAt        Date
updatedAt        Date

Indexes:
  { type: 1, "participants.user": 1 }  partial on type="direct"
    → prevents duplicate DM conversations
```

### Message
```
_id            ObjectId
conversation   ObjectId → Conversation   indexed
sender         ObjectId → User
content        String   max 5000 chars, default ""
attachments[]
  url          String
  type         "image" | "video" | "file"
  filename     String?
  size         Number?  bytes
  width        Number?
  height       Number?
  format       String?
readBy[]
  user         ObjectId → User
  readAt       Date
isDeleted      Boolean  default: false  (soft delete)
createdAt      Date
updatedAt      Date

Indexes:
  { conversation: 1, createdAt: -1 }  → paginated message loading
```

### Notification
```
_id            ObjectId
recipient      ObjectId → User
type           "new_message" | "group_invite" | "group_removed"
conversation   ObjectId → Conversation?
message        ObjectId → Message?
preview        String   first 80 chars of message content
isRead         Boolean  default: false
createdAt      Date
updatedAt      Date
```

---

## 5. API Contracts

All endpoints are prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth — `/api/auth`

| Method | Path               | Auth | Body / Params                          | Response                    |
|--------|--------------------|------|----------------------------------------|-----------------------------|
| POST   | `/register`        | —    | `{ username, email, password }`        | `{ token, user }`           |
| POST   | `/login`           | —    | `{ identifier, password }`             | `{ token, user }`           |
| GET    | `/me`              | ✓    | —                                      | `ApiUser`                   |
| GET    | `/google`          | —    | — (OAuth redirect)                     | redirect                    |
| GET    | `/google/callback` | —    | —                                      | redirect → client with token|
| GET    | `/github`          | —    | — (OAuth redirect)                     | redirect                    |
| GET    | `/github/callback` | —    | —                                      | redirect → client with token|

### Users — `/api/users`

| Method | Path       | Auth | Query              | Response       |
|--------|------------|------|--------------------|----------------|
| GET    | `/`        | ✓    | `?search=<query>`  | `ApiUser[]`    |
| GET    | `/:id`     | ✓    | —                  | `ApiUser`      |

### Conversations — `/api/conversations`

| Method | Path                            | Auth | Body / Params                           | Response              |
|--------|---------------------------------|------|-----------------------------------------|-----------------------|
| GET    | `/`                             | ✓    | —                                       | `ApiConversation[]`   |
| POST   | `/direct`                       | ✓    | `{ participantId }`                     | `ApiConversation`     |
| POST   | `/group`                        | ✓    | `{ name, participantIds[] }`            | `ApiConversation`     |
| GET    | `/:id`                          | ✓    | —                                       | `ApiConversation`     |
| PATCH  | `/:id/participants`             | ✓    | `{ userIds[] }`                         | `ApiConversation`     |
| DELETE | `/:id/participants/:userId`     | ✓    | —                                       | `{ message }`         |
| GET    | `/:id/messages`                 | ✓    | `?page=1&limit=30`                      | `ApiMessage[]`        |
| POST   | `/:id/messages`                 | ✓    | `{ content, attachments[] }`            | `ApiMessage`          |

### Messages — `/api/messages`

| Method | Path         | Auth | Body | Response         |
|--------|--------------|------|------|------------------|
| PATCH  | `/:id/read`  | ✓    | —    | `{ message }`    |
| DELETE | `/:id`       | ✓    | —    | `{ message }`    |

### Upload — `/api/upload`

| Method | Path           | Auth | Body                                        | Response                  |
|--------|----------------|------|---------------------------------------------|---------------------------|
| POST   | `/`            | ✓    | `multipart/form-data` field `files` (≤10)   | `{ files: Attachment[] }` |
| DELETE | `/:publicId`   | ✓    | —                                           | `{ success: true }`       |

**Upload response attachment shape:**
```json
{
  "url": "https://res.cloudinary.com/...",
  "publicId": "1712345678-photo.jpg",
  "type": "image",
  "filename": "photo.jpg",
  "size": 204800,
  "width": 1920,
  "height": 1080,
  "format": "jpg"
}
```

### Notifications — `/api/notifications`

| Method | Path         | Auth | Response               |
|--------|--------------|------|------------------------|
| GET    | `/`          | ✓    | `ApiNotification[]`    |
| PATCH  | `/:id/read`  | ✓    | `ApiNotification`      |
| PATCH  | `/read-all`  | ✓    | `{ modifiedCount }`    |

### Error response shape (all endpoints)
```json
{ "message": "Human-readable error description" }
```
HTTP status codes: `400` validation, `401` unauthorized, `403` forbidden, `404` not found, `500` server error.

---

## 6. WebSocket Protocol

Connection URL: `ws://localhost:4000`

Authentication: token passed in `socket.handshake.auth.token` (JWT).

On connect, the server automatically joins the socket to all conversation rooms the user belongs to.

### Client → Server events

| Event              | Payload                                          | Callback                    |
|--------------------|--------------------------------------------------|-----------------------------|
| `message:send`     | `{ conversationId, content, attachments[] }`     | `{ success, message }` or `{ error }` |
| `typing:start`     | `{ conversationId }`                             | —                           |
| `typing:stop`      | `{ conversationId }`                             | —                           |
| `messages:read`    | `{ conversationId }`                             | —                           |
| `conversation:join`| `{ conversationId }`                             | —                           |

### Server → Client events

| Event              | Payload                                          | Scope           |
|--------------------|--------------------------------------------------|-----------------|
| `message:new`      | `ApiMessage`                                     | conversation room |
| `typing:start`     | `{ userId, conversationId }`                     | conversation room |
| `typing:stop`      | `{ userId, conversationId }`                     | conversation room |
| `messages:read`    | `{ userId, conversationId }`                     | conversation room |
| `user:online`      | `{ userId }`                                     | broadcast all   |
| `user:offline`     | `{ userId, lastSeen }`                           | broadcast all   |
| `notification:new` | `ApiNotification`                                | targeted (socketId) |

---

## 7. State Management

Four Zustand stores with clear ownership boundaries:

```
┌─────────────────────────────────────────────────────────────────┐
│ authStore (persisted to localStorage)                           │
│   user: ApiUser | null                                          │
│   token: string | null                                          │
│   isLoading, error                                              │
│   login() / register() / logout()                              │
│   SSR-safe: skipHydration:true + StoreHydration component       │
├─────────────────────────────────────────────────────────────────┤
│ conversationStore                                               │
│   byId: Record<id, ApiConversation>   — O(1) lookup            │
│   allIds: string[]                    — insertion-ordered       │
│   selectedId: string | null                                     │
│   messageCache: Record<id, MessageEntry>                        │
│     messages[], page, hasMore, fetchedAt (5-min stale TTL)      │
│   fetchConversations() / fetchMessages() / fetchMoreMessages()  │
│   addMessage() — also bubbles conversation to top of sidebar    │
│   upsertConversation() / removeConversation()                   │
├─────────────────────────────────────────────────────────────────┤
│ uiStore                                                         │
│   modal: "create-chat" | "create-group" | null                  │
│   aboutGroupOpen: boolean                                       │
│   sidebarOpen: boolean                                          │
│   toasts: Toast[]                     — auto-dismiss 4s         │
│   pushToast() / dismissToast()                                  │
├─────────────────────────────────────────────────────────────────┤
│ userStore                                                       │
│   users: ApiUser[]    — fetched once, 2-min stale TTL           │
│   results: ApiUser[]  — debounced search results                │
│   fetchUsers() / searchUsers()                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Cache invalidation rules:**
- Conversations: re-fetch only when `hasLoaded=false` or `force=true`
- Messages: re-fetch when `fetchedAt` is older than 5 minutes or `force=true`
- Users: re-fetch when `fetchedAt` is older than 2 minutes
- All stores reset on `logout()`

---

## 8. File Upload Pipeline

```
Browser File Input
  ↓ (File[])
pendingFiles state in ChatWindow
  ↓ (on Send)
FormData with field name "files"
  ↓ POST /api/upload
Multer memoryStorage (no disk I/O)
  ↓ req.files[].buffer
uploadToCloudinary(buffer, options)
  Readable.from(buffer).pipe(cloudinary.uploader.upload_stream())
  ↓
Cloudinary CDN
  ↓ secure_url, public_id, width, height, format
ApiAttachment[] returned to client
  ↓
POST /api/conversations/:id/messages with attachments[]
  ↓
Stored in Message.attachments[], served via Cloudinary URLs
```

**Accepted MIME types (frontend filter):** `image/*`, `video/*`, `.pdf`, `.doc`, `.docx`, `.txt`
**Max files per upload:** 10
**Resource type mapping:**
- `image/*` → Cloudinary `resource_type: auto`
- `video/*` → Cloudinary `resource_type: video`
- everything else → Cloudinary `resource_type: auto`

---

## 9. Authentication & Security

### JWT
- Signed with `JWT_SECRET`, expiry `7d`
- Stored in `localStorage` via Zustand persist (not httpOnly cookie — trade-off: simpler but XSS-exposed)
- All REST routes protected with `protect` middleware: extracts Bearer token, verifies, attaches `req.user`
- Socket.io connections authenticated via `socket.handshake.auth.token`

### OAuth (Passport.js)
- Google: `passport-google-oauth20`, scope `profile email`
- GitHub: `passport-github2`, scope `user:email`
- On callback: upsert user by `googleId`/`githubId`, sign JWT, redirect to `CLIENT_URL/inbox?token=<jwt>`
- Sessions disabled (`session: false`)

### Password hashing
- bcrypt with cost factor 12
- `password` field has `select: false` — never returned in queries unless explicitly selected

### CORS
- `origin: process.env.CLIENT_URL` — exact origin whitelist, not wildcard
- `credentials: true`

### Input validation
- Mongoose schema-level: required fields, min/maxlength, enum constraints
- Participant count validation in Conversation schema (direct = 2, group ≥ 2)
- Message content: maxlength 5000
- Upload: max 10 files per request (Multer `array('files', 10)`)

---

## 10. Design System

### Neobrutalism — core principles
- No border-radius (sharp corners everywhere)
- 2px solid borders using `#4f4e4e`
- Box-shadow **on buttons only**: `5px 5px 0px 0px #4f4e4e`
- Press animation on buttons: `active:translate-x-[5px] active:translate-y-[5px] + shadow: none`
- Primary color: `#ae7aff` (purple)
- Danger color: `#ff4d4d` (red)
- Background: `#111111` (page), `#1a1a1a` (cards), `#0f0f0f` (inputs), `#1e1e1e` (received bubbles)

### CSS utility classes (`globals.css`)

| Class         | Usage                                                      |
|---------------|------------------------------------------------------------|
| `.btn-primary`| Purple CTA buttons — shadow + press animation              |
| `.btn-danger` | Red destructive buttons — same shadow pattern              |
| `.neo-input`  | Text inputs — `border-2 border-[#4f4e4e]`, focus highlight |
| `.neo-card`   | Modal/panel containers — `border-2 border-[#4f4e4e]`       |

### Avatar colors
Deterministic 8-color palette via `getAvatarColor(username)` — hash of username → index into palette. Same username always maps to the same color across sessions without storing it.

---

## 11. Design Decisions

### Why Socket.io over raw WebSockets?
Socket.io provides rooms (conversation-scoped broadcasts), automatic reconnection, and acknowledgement callbacks (`callback?.({ success, message })`). Rooms are critical for targeted message delivery without a Redis pub-sub in single-server mode.

### Why Zustand over Redux Toolkit?
- Zero boilerplate for small-to-medium stores
- No Provider wrapping needed
- Built-in persist middleware handles localStorage auth token
- Selector pattern (`useStore(s => s.x)`) prevents unnecessary re-renders

### Why `skipHydration: true` in authStore?
Next.js App Router renders on the server. `localStorage` does not exist server-side. Without `skipHydration`, Zustand reads `localStorage` during SSR and throws. `StoreHydration` triggers rehydration on the first client render cycle.

### Why message cache TTL of 5 minutes?
Socket.io delivers new messages in real-time, so the cache is kept warm. A 5-minute TTL handles the edge case of reconnecting after a brief offline period without a full refetch on every conversation switch.

### Why soft-delete messages?
Setting `isDeleted: true` and clearing `content`/`attachments` preserves conversation history structure (participant counts, thread continuity) and prevents message-ID gaps in pagination. The frontend renders "Message deleted" in place of the content.

### Why Multer `memoryStorage` over disk storage?
- No ephemeral disk writes needed — the file goes Buffer → Cloudinary upload stream directly
- Avoids temp file cleanup in serverless/containerized deployments
- Slightly higher RAM pressure for large files, acceptable given the 10-file cap and Cloudinary's 10MB default limit

### Why partial index on Conversation for direct type?
```js
{ type: 1, "participants.user": 1 },
{ partialFilterExpression: { type: "direct" } }
```
Prevents duplicate DM conversations at the database level. A full unique index would fail for group conversations since multiple groups can share the same participants.

### Why `joinedAt` on participants?
Enables future "show messages after you joined" semantics for groups — users added after a group is created should not see older messages by default (not implemented yet, but the data is there).

---

## 12. Scaling Strategy

### Current architecture (single server)
- Works for ~1,000 concurrent users
- Socket.io rooms are in-process memory — no external adapter needed
- MongoDB Atlas handles connection pooling and replica set failover

### Path to horizontal scaling

**Step 1 — Stateless API servers (easy)**
```
Load Balancer (Nginx / AWS ALB)
  ├── API Server 1
  ├── API Server 2
  └── API Server 3
       ↕
  MongoDB Atlas (already replicated)
  Cloudinary (already CDN)
```
REST endpoints are already stateless (JWT, no server sessions). Can be deployed immediately.

**Step 2 — Socket.io with Redis Adapter (medium)**
Socket.io rooms are in-process. With multiple nodes, a message sent on Server 1 won't reach a client connected to Server 2.

```
npm install @socket.io/redis-adapter ioredis

// server.js
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('ioredis');

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

This makes `io.to(room).emit()` work across all nodes via Redis pub-sub.

**Step 3 — Read replicas for message history (medium)**
Message list queries (`GET /api/conversations/:id/messages`) are read-heavy. Route them to a MongoDB Atlas read replica:
```js
Message.find({ conversation: id })
  .read('secondaryPreferred')
  .sort({ createdAt: -1 })
  .skip((page-1)*30).limit(30)
```

**Step 4 — CDN for static assets (easy)**
Deploy Next.js to Vercel — automatic edge caching. Point `NEXT_PUBLIC_API_URL` to the load-balanced API.

**Step 5 — Message queue for notifications (advanced)**
Replace the inline `Notification.create()` in `socket/index.js` with a BullMQ job queue. Decouples notification delivery from the critical message path.

```
message:send event
  → Message saved to DB (synchronous)
  → io.to(room).emit('message:new') (synchronous)
  → notificationQueue.add({ recipients, message }) (async, fire-and-forget)
     → BullMQ worker → Notification.create() + socket delivery
```

### MongoDB indexes (already in place)

| Collection    | Index                                    | Purpose                         |
|---------------|------------------------------------------|---------------------------------|
| messages      | `{ conversation: 1, createdAt: -1 }`     | Paginated message loading       |
| conversations | `{ type: 1, "participants.user": 1 }`    | Direct DM deduplication         |

**Indexes to add before production:**

```js
// Fast inbox query per user
db.conversations.createIndex({ "participants.user": 1, lastActivityAt: -1 });

// Unread notification count
db.notifications.createIndex({ recipient: 1, isRead: 1 });

// User search
db.users.createIndex({ username: "text", email: "text" });
```

### Rate limiting (not yet implemented)
```js
const rateLimit = require('express-rate-limit');

app.use('/api/auth', rateLimit({ windowMs: 15 * 60_000, max: 20 }));
app.use('/api/upload', rateLimit({ windowMs: 60_000, max: 30 }));
app.use('/api/', rateLimit({ windowMs: 60_000, max: 300 }));
```

---

## 13. Claude Agents, Skills & Commands

This project uses Claude Code with specialized agents, skills, and commands configured in `.claude/`.

### Agents (`.claude/agents/`)

Agents are autonomous subprocesses with specialized knowledge about this project's stack. Claude picks the right agent automatically based on the task.

| Agent | When It's Used |
|-------|---------------|
| `Architect` | System design, API planning, folder structure decisions |
| `BackendDev` | Express routes, controllers, Mongoose queries, middleware |
| `FrontendDev` | Next.js components, Zustand stores, hooks, Tailwind styling |
| `RealtimeDev` | Socket.IO handlers, client socket hooks, event wiring |
| `DatabaseDev` | Mongoose schemas, indexes, aggregation pipelines, query optimization |
| `AuthDev` | JWT flow, Passport.js OAuth, auth middleware, auth store |
| `UIDesigner` | Neobrutalism components, layout, responsive design |
| `Tester` | Jest + Supertest backend tests, React Testing Library, Playwright E2E |
| `SecurityReviewer` | OWASP audit, auth bypass checks, injection risks |
| `CodeReviewer` | PR review, bug detection, convention compliance |
| `Debugger` | Socket.IO issues, Mongoose errors, Next.js hydration, CORS |
| `PerformanceOptimizer` | MongoDB indexes, query optimization, frontend re-renders |
| `DevOps` | Docker, docker-compose, Nginx, GitHub Actions CI/CD |
| `DocsExplorer` | Fetch up-to-date docs for any library via Context7 MCP |

### Skills (`.claude/skills/`)

Skills are standing rules that guide every code change. They're always active.

**Project-specific (most important):**
- `mongodb-mongoose` — MongoDB/Mongoose query patterns, indexes, cursor pagination
- `cloudinary-upload` — Multer memory storage → Cloudinary stream upload
- `neobrutalism-ui` — Zero border-radius, 2px borders, box-shadow buttons, dark palette
- `passport-oauth` — Passport.js Google/GitHub find-or-create + JWT redirect
- `database-design` — Mongoose schema conventions, relationships, indexing
- `express-pro` — Express.js architecture (JS, not TS), error handling, response format
- `nextjs-pro` — Next.js 16 + Tailwind v4 + Zustand v5 conventions
- `socketio-realtime` — Socket.IO event names, room auth, broadcast rules
- `auth-flow` — JWT + localStorage strategy, refresh rotation, OAuth flow
- `security-first` — Security checklist for all code changes

### Commands (`.claude/commands/`)

Commands are slash-commands that trigger specific implementation tasks. Usage: `/command-name [args]`

| Command | What It Does |
|---------|-------------|
| `/setup-backend` | Scaffold the full Express.js backend structure |
| `/setup-frontend` | Scaffold the Next.js frontend with Neobrutalism design |
| `/add-auth` | Build complete JWT + OAuth authentication system |
| `/add-realtime` | Add Socket.IO events following SPEC protocol |
| `/add-model [name]` | Add a new Mongoose model with controller + routes |
| `/add-socket-event [name]` | Add a new Socket.IO event (backend + frontend) |
| `/add-feature [description]` | Build a feature end-to-end (DB + API + socket + UI) |
| `/setup-docker` | Create Docker + Nginx + docker-compose setup |
| `/setup-ci-cd` | GitHub Actions CI/CD pipeline |
| `/code-review [BUGS\|SECURITY\|PERFORMANCE]` | Code review with optional focus mode |
| `/add-testing` | Add Jest + Supertest test setup |
| `/add-monitoring` | Add logging and monitoring |
| `/refactor-code` | Refactor with quality improvements |

---

## 14. Environment Variables

### Backend (`backend/.env`)

| Variable                | Required | Description                              |
|-------------------------|----------|------------------------------------------|
| `PORT`                  | No       | Server port (default 4000)               |
| `MONGODB_URI`           | Yes      | MongoDB Atlas connection string          |
| `JWT_SECRET`            | Yes      | Secret for signing JWTs (min 32 chars)   |
| `CLIENT_URL`            | Yes      | Frontend origin for CORS                 |
| `CLOUDINARY_CLOUD_NAME` | Yes      | Cloudinary account cloud name            |
| `CLOUDINARY_API_KEY`    | Yes      | Cloudinary API key                       |
| `CLOUDINARY_API_SECRET` | Yes      | Cloudinary API secret                    |
| `GOOGLE_CLIENT_ID`      | No       | Google OAuth app client ID               |
| `GOOGLE_CLIENT_SECRET`  | No       | Google OAuth app client secret           |
| `GITHUB_CLIENT_ID`      | No       | GitHub OAuth app client ID               |
| `GITHUB_CLIENT_SECRET`  | No       | GitHub OAuth app client secret           |

### Frontend (`my-app/.env.local`)

| Variable                | Required | Description                     |
|-------------------------|----------|---------------------------------|
| `NEXT_PUBLIC_API_URL`   | Yes      | Backend base URL (e.g. http://localhost:4000) |
