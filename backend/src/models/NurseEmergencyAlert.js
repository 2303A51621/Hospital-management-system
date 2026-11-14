const mongoose = require('mongoose');

const nurseEmergencyAlertSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    nurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: false,
      default: null,
    },
    alertType: {
      type: String,
      enum: ['Code Blue (Cardiac Arrest)', 'Rapid Response (Condition Deterioration)', 'Severe Respiratory Distress', 'Emergency Doctor Stat Call', 'Fall / Injury Hazard'],
      default: 'Rapid Response (Condition Deterioration)',
    },
    severity: {
      type: String,
      enum: ['critical', 'urgent', 'high'],
      default: 'critical',
    },
    location: {
      ward: { type: String, default: 'General Ward' },
      roomNumber: { type: String, default: 'Room 101' },
      bedNumber: { type: String, default: 'Bed 01' },
    },
    symptoms: {
      type: String,
      required: true,
    },
    vitalsAtAlert: {
      bp: String,
      pulse: Number,
      spo2: Number,
      temp: Number,
      rr: Number,
    },
    actionsTaken: {
      type: String,
      default: 'Administered high-flow oxygen, positioned patient in high Fowler position, sounded emergency response bell.',
    },
    status: {
      type: String,
      enum: ['active', 'doctor_arrived', 'stabilized', 'transferred_icu', 'resolved'],
      default: 'active',
    },
    doctorResponseTimeMinutes: {
      type: Number,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

nurseEmergencyAlertSchema.index({ status: 1, createdAt: -1 });
nurseEmergencyAlertSchema.index({ patientId: 1 });

module.exports = mongoose.model('NurseEmergencyAlert', nurseEmergencyAlertSchema);

