---
name: mongodb-mongoose
description: MongoDB and Mongoose 8 patterns for this chat application — schemas, queries, indexes, aggregations, and common pitfalls
---

# MongoDB + Mongoose Standards

## Schema Definition

```javascript
const schema = new mongoose.Schema({
  field: { type: String, required: true, trim: true },
  ref:   { type: mongoose.Schema.Types.ObjectId, ref: 'Model' },
}, { timestamps: true }); // always add timestamps
```

- Always add `{ timestamps: true }` — adds `createdAt` and `updatedAt`
- Use `select: false` for sensitive fields (password, refreshToken)
- Add `toJSON` transform to strip sensitive fields
- Use enums to enforce valid values: `type: { type: String, enum: ['direct', 'group'] }`

## Query Rules

| Rule | Why |
|------|-----|
| `.lean()` on reads | 2-5x faster, plain JS objects |
| `.select('field1 field2')` | Fetch only needed fields |
| `.populate('ref')` | Avoid N+1, not query-in-loop |
| Cursor pagination for messages | `skip()` is O(N), cursor is O(log N) |
| `countDocuments()` not `.find().length` | Doesn't load documents |

## Common Patterns

### Find or Return 403
```javascript
const doc = await Model.findOne({ _id: id, owner: req.user._id });
if (!doc) return res.status(403).json({ success: false, error: 'Not found or not authorized' });
```

### Cursor Pagination
```javascript
const items = await Message.find({
  conversation: convId,
  ...(cursor ? { createdAt: { $lt: new Date(cursor) } } : {}),
}).sort({ createdAt: -1 }).limit(limit + 1).lean();

const hasMore = items.length > limit;
return { items: items.slice(0, limit).reverse(), hasMore, nextCursor: hasMore ? items[limit - 1].createdAt : null };
```

### Regex Search (sanitized)
```javascript
const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const users = await User.find({
  username: { $regex: safe, $options: 'i' },
}).select('username avatar').limit(20).lean();
```

### Update Array Element
```javascript
// Update nested array element by filter
await Conversation.updateOne(
  { _id: convId, 'participants.user': userId },
  { $set: { 'participants.$.lastRead': messageId } }
);
```

## Error Handling

| Error | Code | Meaning |
|-------|------|---------|
| `ValidationError` | 400 | Schema validation failed |
| `CastError` | 400 | Invalid ObjectId format |
| `MongoServerError code 11000` | 409 | Duplicate unique key |

```javascript
// In global errorHandler.js
if (err.name === 'CastError') return res.status(400).json({ success: false, error: 'Invalid ID' });
if (err.code === 11000) {
  const field = Object.keys(err.keyValue)[0];
  return res.status(409).json({ success: false, error: `${field} already taken` });
}
```

## Anti-Patterns

- ❌ `.skip()` for message pagination (use cursor)
- ❌ Query inside a loop (use `.populate()` or aggregation)
- ❌ Forgetting `.lean()` when only reading data
- ❌ `Model.findById(id)` then `.save()` to update (use `findByIdAndUpdate` for simple updates)
- ❌ Raw user input in `$regex` without escaping
- ❌ Using `.find()` when you need `.findOne()` (returns array vs single doc)
