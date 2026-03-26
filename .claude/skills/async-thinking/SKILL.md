---
name: async-thinking
description: Design systems with async and event-driven mindset
---

# Async & Event Thinking

## Principles

- Everything is asynchronous
- Design around events, not sequences

## Chat Example

- Send message → emit event → persist → broadcast

## Benefits

- Better scalability
- More resilient systems

## Anti-Patterns

- ❌ Blocking flows
- ❌ Tight coupling between steps