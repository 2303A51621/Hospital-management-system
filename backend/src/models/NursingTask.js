const mongoose = require('mongoose');

const nursingTaskSchema = new mongoose.Schema(
  {
    nurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
      required: false,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'Patient Monitoring',
        'Medication Administration',
        'Wound Dressing',
        'Injection Administration',
        'Blood Sample Collection',
        'Patient Hygiene',
        'Patient Mobility Assistance',
        'IV Monitoring',
        'Postoperative Care',
        'General Patient Care',
        'Other',
      ],
      default: 'General Patient Care',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue', 'cancelled'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 4 * 60 * 60 * 1000), // Default 4 hours from now
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completionNotes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

nursingTaskSchema.index({ nurseId: 1, status: 1 });
nursingTaskSchema.index({ patientId: 1, status: 1 });
nursingTaskSchema.index({ dueDate: 1 });

module.exports = mongoose.model('NursingTask', nursingTaskSchema);

