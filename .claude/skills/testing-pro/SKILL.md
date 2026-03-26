---
name: testing-pro
description: Defines testing standards for production-grade applications
---

# Testing Standards

## General

- Write tests for critical logic
- Focus on reliability over coverage %

## Backend

- Use Jest + Supertest
- Test:
  - auth
  - chat APIs
  - error cases

## Frontend

- Test key UI flows
- Avoid over-testing UI details

## Principles

- Tests must be deterministic
- Avoid flaky tests