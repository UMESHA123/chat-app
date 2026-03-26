---
name: api-client-layer
description: Standardize API communication in frontend applications
---

# API Client Layer

## Principles

- Centralize all API calls
- Avoid calling `fetch` directly inside components

## Structure

- `/lib/api.ts`
- `/features/*/api.ts`

## Best Practices

- Use a wrapper around `fetch`
- Handle:
  - errors
  - auth headers
  - base URL

## Example Responsibilities

- Attach JWT token
- Parse JSON safely
- Normalize responses

## Anti-Patterns

- ❌ API calls inside UI components
- ❌ Repeating request logic