---
name: message-delivery
description: Ensure reliable message delivery in chat systems
---

# Message Delivery Guarantees

## Levels

- At-most-once (fast, less reliable)
- At-least-once (preferred)
- Exactly-once (complex, rarely needed)

## Strategy

- Use unique message IDs
- Store before sending
- Acknowledge delivery

## Chat Features

- Retry failed sends
- Sync missed messages on reconnect

## Anti-Patterns

- ❌ Fire-and-forget messaging
- ❌ No retry mechanism 