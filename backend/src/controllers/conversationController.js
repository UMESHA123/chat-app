const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// GET /api/conversations — list all conversations for the logged-in user
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      'participants.user': req.user._id,
    })
      .populate('participants.user', 'username email avatar isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username avatar' },
      })
      .sort({ lastActivityAt: -1 });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations/direct — create or return existing direct conversation
const createDirect = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if a direct conversation already exists between these two users
    const existing = await Conversation.findOne({
      type: 'direct',
      'participants.user': { $all: [req.user._id, userId] },
    }).populate('participants.user', 'username email avatar isOnline lastSeen');

    if (existing) return res.json(existing);

    const conversation = await Conversation.create({
      type: 'direct',
      participants: [
        { user: req.user._id, role: 'member' },
        { user: userId, role: 'member' },
      ],
    });

    await conversation.populate('participants.user', 'username email avatar isOnline lastSeen');
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations/group — create a group conversation
const createGroup = async (req, res) => {
  try {
    const { name, participantIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required' });
    }

    // Current user is always the admin
    const participants = [
      { user: req.user._id, role: 'admin' },
      ...participantIds.map((id) => ({ user: id, role: 'member' })),
    ];

    const conversation = await Conversation.create({
      type: 'group',
      name: name.trim(),
      participants,
    });

    await conversation.populate('participants.user', 'username email avatar isOnline lastSeen');
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/conversations/:id — get single conversation details
const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      'participants.user': req.user._id,
    }).populate('participants.user', 'username email avatar isOnline lastSeen');

    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/conversations/:id/participants — add participants to a group (admin only)
const addParticipants = async (req, res) => {
  try {
    const { userIds } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isAdmin = conversation.participants.some(
      (p) => p.user.toString() === req.user._id.toString() && p.role === 'admin'
    );
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can add participants' });

    const existingIds = conversation.participants.map((p) => p.user.toString());
    const newParticipants = userIds
      .filter((id) => !existingIds.includes(id))
      .map((id) => ({ user: id, role: 'member' }));

    conversation.participants.push(...newParticipants);
    await conversation.save();
    await conversation.populate('participants.user', 'username email avatar isOnline lastSeen');

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/conversations/:id/participants/:userId — remove a participant (admin only)
const removeParticipant = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || conversation.type !== 'group') {
      return res.status(404).json({ message: 'Group not found' });
    }

    const isAdmin = conversation.participants.some(
      (p) => p.user.toString() === req.user._id.toString() && p.role === 'admin'
    );
    if (!isAdmin) return res.status(403).json({ message: 'Only admins can remove participants' });

    // Prevent admin from removing themselves
    if (req.params.userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot remove yourself; leave the group instead' });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p.user.toString() !== req.params.userId
    );
    await conversation.save();
    await conversation.populate('participants.user', 'username email avatar isOnline lastSeen');

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/conversations/:id — leave or delete a conversation
const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      'participants.user': req.user._id,
    });
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

    if (conversation.type === 'direct') {
      // Hard delete direct chats, their messages, and related notifications
      await Message.deleteMany({ conversation: conversation._id });
      await Notification.deleteMany({ conversation: conversation._id });
      await Conversation.deleteOne({ _id: conversation._id });
    } else {
      // Leave the group (remove self from participants)
      conversation.participants = conversation.participants.filter(
        (p) => p.user.toString() !== req.user._id.toString()
      );
      if (conversation.participants.length === 0) {
        await Message.deleteMany({ conversation: conversation._id });
        await Notification.deleteMany({ conversation: conversation._id });
        await Conversation.deleteOne({ _id: conversation._id });
      } else {
        await conversation.save();
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getConversations,
  createDirect,
  createGroup,
  getConversation,
  addParticipants,
  removeParticipant,
  deleteConversation,
};
