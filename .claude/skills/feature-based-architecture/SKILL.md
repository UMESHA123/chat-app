---
name: feature-based-architecture
description: Organize code by features instead of technical layers for scalability
---

# Feature-Based Architecture

## Structure

Organize by feature, not by type:

- `/features/chat`
- `/features/auth`
- `/features/user`

Each feature contains:
- components
- hooks
- services
- types

## Benefits

- Improves scalability
- Easier to maintain
- Reduces cross-dependency

## Rules

- Features should be self-contained
- Shared logic goes in `/lib` or `/shared`
- Avoid tight coupling between features