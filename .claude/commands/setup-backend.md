Act as a senior backend engineer for this chat application.

Set up the Express.js backend with the exact stack from SPEC.md:

Tech stack:
- Express.js 4 (plain JavaScript — no TypeScript)
- Mongoose 8 + MongoDB Atlas
- JWT + bcryptjs for auth
- Passport.js for Google + GitHub OAuth
- Socket.IO 4 for real-time
- Multer (memory) + Cloudinary v2 for file uploads
- express-rate-limit + helmet + cors for security

Structure:
```
backend/
  src/
    models/          (User, Conversation, Message, Notification)
    controllers/     (authController, conversationController, messageController, uploadController)
    routes/          (authRoutes, userRoutes, conversationRoutes, messageRoutes, uploadRoutes, notificationRoutes)
    middleware/      (auth.js, upload.js, errorHandler.js)
    socket/
      index.js
      authMiddleware.js
      handlers/      (messageHandler, typingHandler, presenceHandler)
    config/          (passport.js, cloudinary.js, db.js)
    utils/           (token.js)
  app.js
  server.js
```

Include:
- Global error handler that handles Mongoose ValidationError, CastError, duplicate key (11000)
- Consistent response format: { success: true/false, data/error }
- Health check: GET /api/health
- Rate limiting on /api/auth/login and /api/auth/register
- helmet() + cors() with CLIENT_URL from env

Read SPEC.md first to understand data models, API contracts, and security requirements.
