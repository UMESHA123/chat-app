Add a new Socket.IO event to the chat application.

Arguments: $ARGUMENTS (event name and description)

Steps:
1. Read SPEC.md §6 for the existing WebSocket protocol
2. Read backend/src/socket/ to understand current handler structure
3. Read app/hooks/useSocket.js for current client patterns

Backend:
- Add event handler in the appropriate handler file (or create a new one in src/socket/handlers/)
- ALWAYS verify conversation membership if the event touches a conversation
- Use acknowledgement callback for write events
- Use correct broadcast: io.to(room) for all, socket.to(room) to exclude sender
- Register the handler in src/socket/index.js

Frontend:
- Add emit function in app/hooks/useSocket.js
- Register listener in useEffect with cleanup (socket.off)
- Update relevant Zustand store if state needs to change

Name the event following SPEC conventions:
- resource:action pattern (e.g., message:send, typing:start)
- No camelCase, no underscores in event names

Update SPEC.md §6 with the new event.
