const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

// GET /api/conversations/:id/messages — cursor-based paginated message history
// Query params: before=<ISO timestamp>, limit=30
const getMessages = async (req, res) => {
  try {
    const { before, limit = 30 } = req.query;

    // Verify the user is a participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      'participants.user': req.user._id,
    });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const query = { conversation: req.params.id, isDeleted: false };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({ success: true, data: messages.reverse(), hasMore: messages.length === Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations/:id/messages — send a message (REST fallback; primary path is socket)
const sendMessage = async (req, res) => {
  try {
    const { content, attachments } = req.body;

    const conversation = await Conversation.findOne({
      _id: req.params.id,
      'participants.user': req.user._id,
    });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: content || '',
      attachments: attachments || [],
      readBy: [{ user: req.user._id }],
    });

    // Update the conversation's last message snapshot
    conversation.lastMessage = message._id;
    conversation.lastActivityAt = new Date();
    await conversation.save();

    await message.populate('sender', 'username avatar');

    // Create notifications for other participants
    const otherParticipants = conversation.participants
      .map((p) => p.user.toString())
      .filter((id) => id !== req.user._id.toString());

    await Notification.insertMany(
      otherParticipants.map((userId) => ({
        recipient: userId,
        type: 'new_message',
        conversation: conversation._id,
        message: message._id,
        preview: content ? content.slice(0, 80) : 'Sent an attachment',
      }))
    );

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/messages/:id/read — mark a message as read by the current user
const markRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    // Verify the requesting user is a participant in the conversation
    const isMember = await Conversation.exists({
      _id: message.conversation,
      'participants.user': req.user._id,
    });
    if (!isMember) return res.status(403).json({ message: 'Forbidden' });

    const alreadyRead = message.readBy.some(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({ user: req.user._id });
      await message.save();
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/messages/:id — soft delete a message
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id,
    });

    if (!message) return res.status(404).json({ message: 'Message not found' });

    message.isDeleted = true;
    message.content = '';
    message.attachments = [];
    await message.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getMessages, sendMessage, markRead, deleteMessage };
