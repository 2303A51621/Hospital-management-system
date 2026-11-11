const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const consultationSchema = new mongoose.Schema(
  {
    consultationId: {
      type: String,
      unique: true,
      default: () => 'CNS-' + uuidv4().slice(0, 8).toUpperCase(),
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    visitDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'completed'],
      default: 'draft',
    },
    symptoms: [String],
    preliminaryDiagnosis: String,
    finalDiagnosis: String,
    icdCode: String,
    vitalSigns: {
      bloodPressure: String, // e.g. 120/80
      pulseRate: Number,
      temperature: Number, // Fahrenheit
      oxygenSaturation: Number, // SpO2 %
      respiratoryRate: Number,
      height: Number, // cm
      weight: Number, // kg
      bmi: Number,
    },
    physicalExamination: String,
    clinicalNotes: String,
    treatmentRecommendations: String,
    documents: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadDate: { type: Date, default: Date.now },
      },
    ],
    followUp: {
      isRequired: { type: Boolean, default: false },
      date: Date,
      instructions: String,
    },
    referral: {
      referredDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
      department: String,
      reason: String,
    },
    digitalSignature: String,
    voiceDictated: { type: Boolean, default: false },
    aiAssisted: { type: Boolean, default: false },
    completedAt: Date,
  },
  { timestamps: true }
);

consultationSchema.index({ doctorId: 1, visitDate: -1 });
consultationSchema.index({ patientId: 1, visitDate: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);
