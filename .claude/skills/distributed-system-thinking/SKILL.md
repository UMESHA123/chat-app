---
name: distributed-system-thinking
description: Design backend systems as distributed, scalable, and fault-tolerant
---

# Distributed System Thinking

## Principles

- **ASSUME** multiple servers, not one
- **ASSUME** failures will happen
- **DESIGN** for horizontal scaling

## Stateless Services

- Backend services must be stateless
- Store session/data in external systems (DB, Redis)

## Communication

- Prefer event-driven communication over tight coupling
- Avoid direct service dependencies when possible

## Resilience

- Retry failed operations
- Handle partial failures gracefully

## Anti-Patterns

- ❌ Storing state in memory
- ❌ Single point of failure