const mongoose = require('mongoose');

const medicationAdministrationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
      required: false,
      default: null,
    },
    nurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
      required: false,
    },
    administeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      enum: ['oral', 'iv', 'im', 'subcutaneous', 'inhalation', 'topical', 'rectal', 'sublingual'],
      default: 'oral',
    },
    frequency: {
      type: String,
      default: 'Once daily',
    },
    scheduledTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    administeredAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['scheduled', 'administered', 'missed', 'delayed', 'refused'],
      default: 'scheduled',
    },
    reasonForMissedOrRefused: {
      type: String,
      default: '',
    },
    safetyChecksVerified: {
      rightPatient: { type: Boolean, default: true },
      rightMedication: { type: Boolean, default: true },
      rightDose: { type: Boolean, default: true },
      rightRoute: { type: Boolean, default: true },
      rightTime: { type: Boolean, default: true },
      allergyChecked: { type: Boolean, default: true },
    },
    vitalSignsPreAdministration: {
      bloodPressure: String,
      heartRate: Number,
      notes: String,
    },
    reactionObserved: {
      type: String,
      default: 'None / Well tolerated',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

medicationAdministrationSchema.index({ patientId: 1, scheduledTime: 1 });
medicationAdministrationSchema.index({ status: 1 });
medicationAdministrationSchema.index({ nurseId: 1, administeredAt: -1 });

module.exports = mongoose.model('MedicationAdministration', medicationAdministrationSchema);

