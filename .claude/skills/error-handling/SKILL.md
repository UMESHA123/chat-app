---
name: error-handling
description: Handle errors consistently across frontend and backend
---

# Error Handling

## Backend

- Use centralized error middleware
- Return consistent error format

## Frontend

- Show user-friendly messages
- Log technical details separately

## Principles

- Never expose internal errors
- Always handle async failures

## Patterns

- Try/catch in async code
- Fallback UI for failures

## Anti-Patterns

- ❌ Silent failures
- ❌ Inconsistent error formats