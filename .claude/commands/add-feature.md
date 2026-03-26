Add a new end-to-end feature to the chat application.

Arguments: $ARGUMENTS (feature name and description)

Read SPEC.md and explore the codebase first to understand the current structure.

For each new feature, implement the full vertical slice:

1. **Database** (if needed)
   - Mongoose schema changes or new model
   - Add appropriate indexes
   - Follow patterns in backend/src/models/

2. **Backend API** (if needed)
   - Controller in backend/src/controllers/
   - Route in backend/src/routes/
   - Register in backend/src/app.js
   - Always include: protect middleware, membership check, error handling, { success, data } envelope

3. **Socket.IO** (if real-time needed)
   - Handler in backend/src/socket/handlers/
   - Register in backend/src/socket/index.js
   - Use event names following resource:action pattern
   - Verify membership before processing

4. **Frontend**
   - Component(s) in my-app/app/components/ following Neobrutalism design
   - Update relevant Zustand store if state changes
   - Add API call in relevant hook or directly via apiFetch
   - Wire up Socket.IO listener with proper cleanup

5. **Update SPEC.md** if the feature adds new API routes or socket events

Neobrutalism reminder: NO border-radius, 2px borders, neo-btn class on buttons.
