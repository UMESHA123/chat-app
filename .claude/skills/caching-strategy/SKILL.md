---
name: caching-strategy
description: Use caching to improve performance and reduce load
---

# Caching Strategy

## What to Cache

- User sessions
- Chat lists
- Recent messages

## Tools

- Redis (preferred)

## Patterns

- Cache-aside
- TTL-based expiration

## Rules

- Cache only what can be recomputed
- Always have a fallback to DB

## Anti-Patterns

- ❌ Stale critical data
- ❌ Over-caching everything