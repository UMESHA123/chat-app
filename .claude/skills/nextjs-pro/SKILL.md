---
name: nextjs-pro
description: Enforces production-grade Next.js 16 architecture with App Router, Tailwind CSS v4, Neobrutalism design system, and Zustand v5 state management
---

# Next.js Professional Standards

We use **Next.js 16 (App Router)** with React 19 for the frontend.

## General Principles

- **PREFER** Client Components for all interactive UI (this is a real-time app — most components are client-side)
- **USE** Server Components only for static pages (login, register, error pages)
- **FOLLOW** existing folder structure: `app/components/`, `app/store/`, `app/hooks/`, `app/lib/`

## Styling — Tailwind CSS v4

- Config is in CSS, not `tailwind.config.js`:
  ```css
  @import "tailwindcss";
  @theme { --color-primary: #ae7aff; }
  ```
- PostCSS uses `@tailwindcss/postcss` package
- No `@tailwind base/components/utilities` directives

## Design System — Neobrutalism

- **NO border-radius** on any element
- Borders: `border: 2px solid #4f4e4e` everywhere
- Buttons: `box-shadow: 5px 5px 0px 0px #4f4e4e` + shift on hover/press
- Primary color: `#ae7aff`, Danger: `#ff4d4d`, Background: `#111111`
- Cards: `#1a1a1a`, Inputs: `#0f0f0f`
- Use `.neo-btn`, `.neo-card`, `.neo-input`, `.neo-avatar` utility classes

## State Management — Zustand v5

- Use `create` from `zustand` (v5 API — no longer uses `immer` by default)
- `authStore` — persisted to localStorage, holds user + tokens
- `conversationStore` — conversations, messages cache (5-min TTL), typing state
- `uiStore` — modals, sidebar state, toasts
- `userStore` — users list cache (2-min TTL)
- Use selector functions to avoid unnecessary re-renders:
  ```javascript
  const user = useAuthStore((s) => s.user); // ✅ not useAuthStore().user
  ```

## Data Fetching

- Use native `fetch` wrapper from `app/lib/api.js` for all HTTP calls
- Auto-refresh token on 401 in `api.js` interceptor
- Cache conversation data in Zustand store with TTL (not React Query/SWR)

## Route Structure

```
app/
  (auth)/login/page.js        — public
  (auth)/register/page.js     — public
  auth/callback/page.js       — OAuth callback (public)
  inbox/page.js               — protected
  inbox/layout.js             — checks auth, renders Navbar + ChatSidebar
  page.js                     — redirects to /inbox
```

## Performance

- Use dynamic imports for heavy components (emoji picker, file upload modals)
- Use `useConversationStore((s) => s.x)` selectors — not full store destructure
- Keep Socket.IO as singleton (`app/lib/socket.js`)

## Anti-Patterns

- ❌ Adding `border-radius` to anything (neobrutalism rule)
- ❌ Using `shadcn/ui` (not in project)
- ❌ Using React Query / SWR (use Zustand + manual fetch)
- ❌ `dangerouslySetInnerHTML` with user content
- ❌ Reading localStorage directly (use Zustand store)
- ❌ Creating new Socket.IO connection per component (use singleton)
