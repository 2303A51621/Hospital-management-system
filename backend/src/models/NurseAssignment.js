const mongoose = require('mongoose');

const nurseAssignmentSchema = new mongoose.Schema(
  {
    nurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      default: null,
    },
    wardName: {
      type: String,
      default: 'General Ward',
    },
    roomNumber: {
      type: String,
      default: 'Room 101',
    },
    bedNumber: {
      type: String,
      default: 'Bed 01',
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    shift: {
      type: String,
      default: 'Morning',
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'transferred', 'discharged'],
      default: 'active',
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent', 'critical'],
      default: 'normal',
    },
    careInstructions: {
      type: String,
      default: 'Regular vitals monitoring and scheduled medication administration',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

nurseAssignmentSchema.index({ nurseId: 1, status: 1 });
nurseAssignmentSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model('NurseAssignment', nurseAssignmentSchema);

