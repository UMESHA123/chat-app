Add Socket.IO real-time functionality to the chat application.

Use EXACTLY these event names (from SPEC.md):

Client → Server:
- conversation:join   { conversationId }
- message:send        { conversationId, content, attachments?, replyTo? }   (with ack callback)
- typing:start        { conversationId }
- typing:stop         { conversationId }
- messages:read       { conversationId, messageId }
- user:online
- user:offline

Server → Client:
- message:receive     full message object with populated sender
- typing:update       { conversationId, userId, username, isTyping }
- messages:marked-read { conversationId, userId }
- user:status         { userId, isOnline, lastSeen }

Backend structure:
- src/socket/index.js — registers all handlers on connection
- src/socket/authMiddleware.js — JWT verify in io.use()
- src/socket/handlers/messageHandler.js
- src/socket/handlers/typingHandler.js (with 3s auto-stop timer)
- src/socket/handlers/presenceHandler.js (update User.isOnline, broadcast to all conversations)

Every event handler MUST verify conversation membership before processing.

Frontend:
- app/lib/socket.js — singleton, reads accessToken from authStore
- app/hooks/useSocket.js — connects on mount, registers listeners, cleans up on unmount
- Emit user:online on connect, user:offline on disconnect
- Update conversationStore with incoming messages and typing state

Read SPEC.md §6 for the full WebSocket protocol.
