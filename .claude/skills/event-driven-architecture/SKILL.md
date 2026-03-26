---
name: event-driven-architecture
description: Use event-driven design for scalable and decoupled systems
---

# Event-Driven Architecture

## Core Idea

Everything important should emit an event.

## Chat Example Flow

1. Message sent
2. Event emitted: `message.created`
3. Consumers:
   - Save to DB
   - Notify users
   - Update unread count

## Benefits

- Loose coupling
- Easy to scale
- Extensible system

## Tools

- Redis Pub/Sub (simple)
- Kafka (advanced)

## Rules

- Events must be immutable
- Include all required data in event payload

## Anti-Patterns

- ❌ Synchronous chained logic
- ❌ Hidden side effects