const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    attachments: [
      {
        fileName: String,
        fileType: String,
        fileUrl: String,
        extractedText: String,
        fileSize: Number,
      },
    ],
    intent: String,
    sources: [String],
    ragDocumentIds: [String],
    toolCalls: [
      {
        toolName: String,
        args: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed,
      },
    ],
    agent: String,
    modelUsed: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const aiChatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Consultation',
      trim: true,
    },
    messages: [messageSchema],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

aiChatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('AIChatSession', aiChatSessionSchema);

