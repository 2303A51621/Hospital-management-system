const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const amendmentSchema = new mongoose.Schema(
  {
    amendedAt: {
      type: Date,
      default: Date.now,
    },
    amendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amendmentNote: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      default: 'Clinical record clarification / update',
    },
  },
  { _id: true }
);

const nursingNoteSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    nurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
      required: false,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    noteType: {
      type: String,
      enum: ['progress', 'observation', 'treatment', 'wound_care', 'incident', 'discharge_summary'],
      default: 'progress',
    },
    patientComplaints: {
      type: String,
      default: '',
    },
    observedSymptoms: {
      type: String,
      default: '',
    },
    patientCondition: {
      type: String,
      enum: ['stable', 'improving', 'deteriorating', 'critical', 'fair'],
      default: 'stable',
    },
    treatmentAndCareProvided: {
      type: String,
      required: true,
    },
    woundObservations: {
      type: String,
      default: '',
    },
    patientResponse: {
      type: String,
      default: 'Tolerated care well without adverse signs',
    },
    followUpPlan: {
      type: String,
      default: '',
    },
    isSigned: {
      type: Boolean,
      default: true,
    },
    signedAt: {
      type: Date,
      default: Date.now,
    },
    signatureHash: {
      type: String,
      default: () => 'KH-SIG-' + uuidv4().slice(0, 10).toUpperCase(),
    },
    amendments: [amendmentSchema],
  },
  { timestamps: true }
);

nursingNoteSchema.index({ patientId: 1, createdAt: -1 });
nursingNoteSchema.index({ nurseId: 1, createdAt: -1 });

module.exports = mongoose.model('NursingNote', nursingNoteSchema);
