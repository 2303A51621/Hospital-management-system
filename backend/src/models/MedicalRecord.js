const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    recordType: { type: String, enum: ['prescription', 'report', 'other'], default: 'prescription' },
    title: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileData: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

medicalRecordSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
