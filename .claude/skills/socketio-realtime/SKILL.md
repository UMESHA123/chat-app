---
name: socketio-realtime
description: Build scalable and reliable real-time systems using Socket.IO for this chat application
---

# Socket.IO Best Practices

## Architecture

- Keep socket logic separate from HTTP routes: `src/socket/` directory
- Separate handler files: `messageHandler.js`, `typingHandler.js`, `presenceHandler.js`
- JWT auth in `io.use()` middleware — runs before any event

## Event Names (use EXACTLY these — from SPEC)

```
Client → Server:
  conversation:join     { conversationId }
  message:send          { conversationId, content, attachments?, replyTo? }
  typing:start          { conversationId }
  typing:stop           { conversationId }
  messages:read         { conversationId, messageId }
  user:online
  user:offline

Server → Client:
  message:receive       full message object
  typing:update         { conversationId, userId, username, isTyping }
  messages:marked-read  { conversationId, userId }
  user:status           { userId, isOnline, lastSeen }
```

## Rooms

- Use `conversationId` as the Socket.IO room name
- Client calls `conversation:join` to subscribe to a conversation's events
- Server verifies membership before allowing join

## Reliability

- Use acknowledgement callbacks for write events (`message:send`, `conversation:join`)
- Auto-stop typing after 3s server-side timer (prevent stuck indicators)
- Broadcast `user:offline` on `disconnect` event

## Broadcast Rules

- `io.to(room)` — all sockets in room including sender (use for `message:receive`)
- `socket.to(room)` — all EXCEPT sender (use for `typing:update`, `user:status`)

## Client (Next.js)

- Single Socket.IO instance per session: `app/lib/socket.js` singleton
- `connectSocket()` on auth, `disconnectSocket()` on logout
- Always clean up listeners in `useEffect` return: `socket.off('event', handler)`
- Emit `user:online` on connect, `user:offline` before disconnect

## Anti-Patterns

- ❌ Using different event names than SPEC defines
- ❌ Processing events without verifying conversation membership
- ❌ Using `io.to()` for typing events (sends back to typer)
- ❌ No acknowledgement callback on `message:send`
- ❌ Creating new socket instance per component
- ❌ Not cleaning up listeners in useEffect
