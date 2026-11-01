const mongoose = require('mongoose');

const medicalKnowledgeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: ['symptom', 'disease', 'precaution', 'policy', 'faq', 'education'] },
    symptoms: { type: [String], default: [] },
    precautions: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    sourceId: { type: String, required: true },
    version: { type: String, default: '1' },
    approved: { type: Boolean, default: false, index: true },
    embedding: { type: [Number], default: undefined },
  },
  { timestamps: true }
);

medicalKnowledgeSchema.index({ title: 'text', content: 'text', symptoms: 'text' });

module.exports = mongoose.model('MedicalKnowledge', medicalKnowledgeSchema);
