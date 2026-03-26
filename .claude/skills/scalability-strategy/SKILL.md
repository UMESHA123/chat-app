---
name: scalability-strategy
description: Plan systems that scale from 1 user to millions
---

# Scalability Strategy

## Levels

1. Monolith (start here)
2. Modular monolith
3. Microservices (only when needed)

## Scaling Techniques

- Horizontal scaling (multiple instances)
- Load balancing
- Caching (Redis)

## Database Scaling

- Read replicas
- Indexing
- Query optimization

## Chat-Specific

- Partition messages by chatId
- Avoid full table scans

## Anti-Patterns

- ❌ Premature microservices
- ❌ Ignoring bottlenecks