const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const nurseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    nurseId: {
      type: String,
      unique: true,
      default: () => 'NUR-' + uuidv4().slice(0, 6).toUpperCase(),
    },
    department: {
      type: String,
      default: 'General Medicine',
    },
    specialization: {
      type: String,
      default: 'General Patient Care',
    },
    qualification: {
      type: [String],
      default: ['B.Sc. Nursing', 'RN (Registered Nurse)'],
    },
    licenseNumber: {
      type: String,
      default: () => 'KMC-NUR-' + Math.floor(100000 + Math.random() * 900000),
    },
    experienceYears: {
      type: Number,
      default: 3,
    },
    assignedWardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      default: null,
    },
    assignedWardName: {
      type: String,
      default: 'General Ward A',
    },
    assignedRooms: {
      type: [String],
      default: ['Room 101', 'Room 102', 'Room 103'],
    },
    shift: {
      type: String,
      enum: ['morning', 'afternoon', 'night', 'rotational'],
      default: 'morning',
    },
    currentShiftStatus: {
      type: String,
      enum: ['on_duty', 'off_duty', 'break'],
      default: 'on_duty',
    },
    lastClockIn: {
      type: Date,
      default: Date.now,
    },
    lastClockOut: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'on_leave', 'inactive'],
      default: 'active',
    },
    phone: {
      type: String,
      default: '',
    },
    emergencyContact: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

nurseSchema.index({ assignedWardId: 1 });

module.exports = mongoose.model('Nurse', nurseSchema);
