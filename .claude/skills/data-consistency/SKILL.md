---
name: data-consistency
description: Ensure data correctness in concurrent and distributed systems
---

# Data Consistency

## Principles

- Data must remain correct under concurrency
- Prefer eventual consistency where needed

## Chat Considerations

- Prevent duplicate messages
- Ensure message order (by timestamp or sequence)

## Techniques

- Use transactions when required
- Add unique IDs for idempotency
- Use optimistic updates carefully

## Trade-offs

- Strong consistency vs performance

## Anti-Patterns

- ❌ Blind overwrites
- ❌ Ignoring race conditions