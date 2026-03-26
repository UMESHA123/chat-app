---
name: system-boundaries
description: Define clear boundaries between system components
---

# System Boundaries

## Principles

- Each module has one responsibility
- Define clear interfaces

## Backend

- Auth system separate from chat logic
- Messaging isolated from notifications

## Benefits

- Easier scaling
- Better maintainability

## Anti-Patterns

- ❌ God modules
- ❌ Tight coupling