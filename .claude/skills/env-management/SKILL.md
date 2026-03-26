---
name: env-management
description: Manage environment variables and configuration securely
---

# Environment Management

## Rules

- Use `.env` files
- Never commit secrets

## Separation

- `.env.development`
- `.env.production`

## Access

- Backend: process.env
- Frontend: only expose safe variables

## Naming

- Use clear prefixes:
  - NEXT_PUBLIC_ for frontend

## Anti-Patterns

- ❌ Hardcoding secrets
- ❌ Mixing environments