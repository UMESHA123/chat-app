---
name: modern-react-state
description: Manage state efficiently in React applications without overengineering
---

# React State Management

## Principles

- **PREFER** local state (`useState`, `useReducer`)
- **AVOID** global state unless necessary
- **DERIVE** state instead of duplicating it

## Server vs Client State

- Treat server data as the source of truth
- Use tools like React Query for async state
- Avoid syncing the same data in multiple places

## Patterns

- Lift state only when needed
- Use custom hooks for reusable logic
- Keep components small and focused

## Anti-Patterns

- ❌ Overusing Context for everything
- ❌ Deep prop drilling without abstraction
- ❌ Duplicated state across components