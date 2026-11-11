const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const referralSchema = new mongoose.Schema(
  {
    referralCode: {
      type: String,
      unique: true,
      default: () => 'REF-' + uuidv4().slice(0, 8).toUpperCase(),
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    referringDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    referredDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    department: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    clinicalNotes: String,
    priority: {
      type: String,
      enum: ['routine', 'urgent', 'emergency'],
      default: 'routine',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'completed'],
      default: 'pending',
    },
    scheduledDate: Date,
  },
  { timestamps: true }
);

referralSchema.index({ referringDoctorId: 1, createdAt: -1 });
referralSchema.index({ referredDoctorId: 1, createdAt: -1 });
referralSchema.index({ patientId: 1 });

module.exports = mongoose.model('Referral', referralSchema);

