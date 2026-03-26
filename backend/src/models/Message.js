const mongoose = require('mongoose');

const readReceiptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['image', 'video', 'file'],
      required: true,
    },
    filename: { type: String },
    size: { type: Number }, // bytes
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Text content (optional if attachments are present)
    content: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: '',
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
    // Per-user read receipts
    readBy: {
      type: [readReceiptSchema],
      default: [],
    },
    // Soft delete — message content replaced with null when deleted
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient paginated message loading
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
