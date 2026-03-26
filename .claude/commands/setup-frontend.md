Act as a senior frontend engineer for this chat application.

Set up the Next.js 16 frontend with the exact stack from SPEC.md:

Tech stack:
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4 (config in CSS via @theme, not tailwind.config.js)
- Zustand v5 (authStore, conversationStore, uiStore, userStore)
- Socket.IO client (singleton pattern)
- Lucide React for icons
- Neobrutalism design system (NO border-radius, 2px borders, box-shadow buttons)

Design colors:
- Primary: #ae7aff (purple)
- Background: #111111
- Card: #1a1a1a
- Input: #0f0f0f
- Border: #4f4e4e
- Danger: #ff4d4d

Structure:
```
my-app/app/
  (auth)/login/page.js
  (auth)/register/page.js
  auth/callback/page.js      (OAuth token handler)
  inbox/page.js
  inbox/layout.js            (protected, renders sidebar + chat)
  components/                (Navbar, ChatSidebar, ChatWindow, MessageBubble, MessageInput, TypingIndicator, CreateChatModal, CreateGroupModal)
  store/                     (authStore, conversationStore, uiStore, userStore)
  lib/api.js                 (fetch wrapper with auto-refresh)
  lib/socket.js              (Socket.IO singleton)
  hooks/                     (useSocket, useConversation, useTyping)
  globals.css                (Tailwind v4 @theme + neo utilities)
```

Include:
- Neobrutalism utility classes in globals.css: .neo-btn, .neo-card, .neo-input, .neo-avatar, .neo-badge
- api.js with auto-refresh on 401 using refreshToken from Zustand
- socket.js as singleton that reads token from authStore
- Auth guard: redirect to /login if not authenticated

Read SPEC.md first for full design system, state management structure, and component list.
