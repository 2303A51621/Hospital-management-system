const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    feedbackType: {
      type: String,
      enum: ['doctor_review', 'hospital_service', 'facility_cleanliness', 'complaint', 'suggestion'],
      required: true,
      default: 'doctor_review',
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      default: null,
      index: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    doctorRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    hospitalRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    cleanlinessRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    staffBehaviorRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'addressed', 'resolved', 'closed'],
      default: 'submitted',
    },
    hospitalResponse: {
      responseMessage: String,
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      respondedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
