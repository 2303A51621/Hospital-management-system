const mongoose = require('mongoose');

const consultationMessageSchema = new mongoose.Schema(
  {
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnlineConsultation',
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['doctor', 'patient', 'admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ConsultationMessage', consultationMessageSchema);
