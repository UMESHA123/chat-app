const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

const initSocket = (io) => {
  // Authenticate socket connections via JWT
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      if (!socket.user) return next(new Error('User not found'));
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    try {
      // Mark user online — no longer store single socketId; use rooms instead
      await User.findByIdAndUpdate(userId, { isOnline: true });

      // Join a personal room so we can target all devices for this user
      socket.join(`user:${userId}`);
      socket.broadcast.emit('user:online', { userId });

      // Join all conversation rooms the user is part of
      const conversations = await Conversation.find({ 'participants.user': userId })
        .select('_id')
        .lean();
      conversations.forEach((c) => socket.join(c._id.toString()));
    } catch (err) {
      console.error('[socket] connection setup error:', err.message);
    }

    // ── Send message ────────────────────────────────────────────────────────
    socket.on('message:send', async ({ conversationId, content, attachments = [] }, callback) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversationId,
          'participants.user': userId,
        });
        if (!conversation) return callback?.({ error: 'Conversation not found' });

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          content: content || '',
          attachments,
          readBy: [{ user: userId }],
        });

        conversation.lastMessage = message._id;
        conversation.lastActivityAt = new Date();
        await conversation.save();

        await message.populate('sender', 'username avatar');

        // Broadcast to everyone in the room (including sender for confirmation)
        io.to(conversationId).emit('message:receive', message);

        // Batch-create notifications for all other participants at once
        const otherParticipants = conversation.participants
          .map((p) => p.user.toString())
          .filter((id) => id !== userId);

        if (otherParticipants.length > 0) {
          const notifications = await Notification.insertMany(
            otherParticipants.map((recipientId) => ({
              recipient: recipientId,
              type: 'new_message',
              conversation: conversation._id,
              message: message._id,
              preview: content ? content.slice(0, 80) : 'Sent an attachment',
            }))
          );

          // Emit to each recipient's personal room (covers all their devices)
          notifications.forEach((notification) => {
            io.to(`user:${notification.recipient.toString()}`).emit('notification:new', notification);
          });
        }

        callback?.({ success: true, message });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── Typing indicators ───────────────────────────────────────────────────
    socket.on('typing:start', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('typing:start', { userId, conversationId });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(conversationId).emit('typing:stop', { userId, conversationId });
    });

    // ── Mark messages as read ───────────────────────────────────────────────
    socket.on('messages:read', async ({ conversationId }) => {
      try {
        // Verify the user is a member of the conversation
        const isMember = await Conversation.exists({
          _id: conversationId,
          'participants.user': userId,
        });
        if (!isMember) return;

        await Message.updateMany(
          {
            conversation: conversationId,
            'readBy.user': { $ne: userId },
            isDeleted: false,
          },
          { $push: { readBy: { user: userId } } }
        );
        socket.to(conversationId).emit('messages:read', { userId, conversationId });
      } catch (err) {
        console.error('[socket] messages:read error:', err.message);
      }
    });

    // ── Join a new conversation room (after being added to a group) ─────────
    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        const isMember = await Conversation.exists({
          _id: conversationId,
          'participants.user': userId,
        });
        if (!isMember) return;
        socket.join(conversationId);
      } catch (err) {
        console.error('[socket] conversation:join error:', err.message);
      }
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      try {
        // Only mark offline if no other sockets are connected for this user
        const userSockets = await io.in(`user:${userId}`).fetchSockets();
        if (userSockets.length === 0) {
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });
          socket.broadcast.emit('user:offline', { userId, lastSeen: new Date() });
        }
      } catch (err) {
        console.error('[socket] disconnect error:', err.message);
      }
    });
  });
};

module.exports = initSocket;
