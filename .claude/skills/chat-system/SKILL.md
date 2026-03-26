
---

# 💬 3. Chat System Rules

```md
---
name: chat-system
description: Defines architecture and best practices for real-time chat systems
---

# Chat Application Standards

## Core Principles

- **REAL-TIME FIRST** design
- **EVENT-DRIVEN** architecture
- **OPTIMISTIC UI** on frontend

## Messaging

- Messages must include:
  - id
  - senderId
  - chatId
  - content
  - timestamp

## Real-Time

- Use Socket.IO
- **USE** rooms for chats
- Handle:
  - reconnects
  - disconnections
  - retries

## Features

- Typing indicators
- Read receipts
- Message delivery status

## Scalability

- Design for horizontal scaling
- Avoid tight coupling
- Use Redis (future scaling)

## Reliability

- Ensure message persistence
- Prevent message duplication
- Handle race conditions