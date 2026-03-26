---
name: realtime-architecture
description: Design reliable and scalable real-time communication systems
---

# Real-Time Architecture

## Principles

- WebSocket servers must scale horizontally
- Connections are ephemeral, data is persistent

## Connection Handling

- Authenticate on connection
- Rejoin rooms on reconnect

## Message Flow

1. Client sends message
2. Server validates
3. Persist to DB
4. Emit to room

## Reliability

- Use message acknowledgements
- Prevent duplicates (idempotency)

## Scaling

- Use Redis adapter for Socket.IO
- Share events across instances

## Anti-Patterns

- ❌ Trusting client messages blindly
- ❌ Skipping persistence before emit