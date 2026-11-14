const mongoose = require('mongoose');

const patientObservationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    patientName: {
      type: String,
      default: '',
    },
    roomNumber: {
      type: String,
      default: '',
    },
    bedNumber: {
      type: String,
      default: '',
    },
    diagnosis: {
      type: String,
      default: '',
    },
    acuity: {
      type: String,
      enum: ['stable', 'guarded', 'critical', 'observation'],
      default: 'stable',
    },
    observations: {
      type: String,
      required: true,
    },
    pendingActions: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const shiftHandoverSchema = new mongoose.Schema(
  {
    outgoingNurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
      required: true,
    },
    incomingNurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
      required: false,
      default: null,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: false,
      default: null,
    },
    wardName: {
      type: String,
      default: 'General Ward A',
    },
    shiftDate: {
      type: Date,
      default: Date.now,
    },
    outgoingShift: {
      type: String,
      enum: ['Morning (06:00 - 14:00)', 'Afternoon (14:00 - 22:00)', 'Night (22:00 - 06:00)'],
      default: 'Morning (06:00 - 14:00)',
    },
    incomingShift: {
      type: String,
      enum: ['Morning (06:00 - 14:00)', 'Afternoon (14:00 - 22:00)', 'Night (22:00 - 06:00)'],
      default: 'Afternoon (14:00 - 22:00)',
    },
    handoverSummary: {
      type: String,
      required: true,
    },
    criticalPatientObservations: [patientObservationSchema],
    pendingMedications: {
      type: [String],
      default: [],
    },
    pendingTasks: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'acknowledged'],
      default: 'submitted',
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgementNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

shiftHandoverSchema.index({ outgoingNurseId: 1, shiftDate: -1 });
shiftHandoverSchema.index({ incomingNurseId: 1, shiftDate: -1 });

module.exports = mongoose.model('ShiftHandover', shiftHandoverSchema);

