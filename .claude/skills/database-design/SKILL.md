---
name: database-design
description: Enforces scalable and clean database schema design for the chat application using MongoDB and Mongoose
---

# Database Standards

## Stack

- **Database**: MongoDB Atlas
- **ODM**: Mongoose 8
- Use `mongoose.model()` for all schemas — no raw MongoDB driver

## Core Models

- **User** — credentials, OAuth IDs, presence (isOnline, lastSeen)
- **Conversation** — type (direct/group), participants array with roles, lastMessage ref
- **Message** — content, attachments (Cloudinary), readBy array, soft-delete
- **Notification** — recipient, type, preview, isRead

## Schema Rules

- Use `{ type: mongoose.Schema.Types.ObjectId, ref: 'ModelName' }` for all references
- Add `{ timestamps: true }` to every schema
- Set `select: false` on `password` and `refreshToken` fields
- Add `toJSON` transform to strip sensitive fields from all responses
- Use enums for fixed-value fields: `type: { type: String, enum: ['direct', 'group'] }`

## Relationships

- Conversation ↔ Users: `participants: [{ user: ObjectId, role: String }]`
- Message → Conversation: `conversation: ObjectId` (indexed)
- Message → User (sender): `sender: ObjectId`
- Read receipts: `readBy: [{ user: ObjectId, readAt: Date }]` on Message

## Indexes (required)

```javascript
// Message — most frequent query pattern
messageSchema.index({ conversation: 1, createdAt: -1 });

// Conversation — user's conversations
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ lastActivityAt: -1 });

// Notification — unread lookup
notificationSchema.index({ recipient: 1, isRead: 1 });
```

## Query Patterns

- Use `.lean()` on all read-only queries (faster, plain JS objects)
- Use `.select()` to fetch only needed fields
- Use `.populate()` instead of separate queries (avoid N+1)
- Use cursor-based pagination for messages (NOT offset/skip)
- Use `$regex` with escaped user input for search

## Anti-Patterns

- ❌ Using `.skip()` for message pagination — use cursor instead
- ❌ Querying inside loops — use `.populate()` or aggregation
- ❌ Forgetting `.lean()` on read-only list queries
- ❌ Raw user input in `$regex` without escaping — NoSQL injection risk
- ❌ Returning documents without stripping password/refreshToken
