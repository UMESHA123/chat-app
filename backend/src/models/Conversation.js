const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    // Track when this participant joined (useful for group message history)
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'group'],
      required: true,
    },
    // Group-only fields
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    groupAvatar: {
      type: String,
      default: null,
    },
    // Participants with roles
    participants: {
      type: [participantSchema],
      validate: {
        validator: function (v) {
          if (this.type === 'direct') return v.length === 2;
          if (this.type === 'group') return v.length >= 2;
          return false;
        },
        message: 'Direct conversations must have exactly 2 participants; groups need at least 2.',
      },
    },
    // Snapshot of the last message for inbox preview
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Prevent duplicate direct conversations between the same two users
conversationSchema.index(
  { type: 1, 'participants.user': 1 },
  { partialFilterExpression: { type: 'direct' } }
);

module.exports = mongoose.model('Conversation', conversationSchema);
