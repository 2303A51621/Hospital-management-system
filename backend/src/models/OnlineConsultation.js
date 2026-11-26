const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const onlineConsultationSchema = new mongoose.Schema(
  {
    consultationId: {
      type: String,
      unique: true,
      default: () => 'VC-' + uuidv4().slice(0, 8).toUpperCase(),
    },
    meetingRoomId: {
      type: String,
      unique: true,
      default: () => 'KH-VC-' + uuidv4().slice(0, 4).toUpperCase() + '-' + uuidv4().slice(0, 4).toUpperCase(),
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      default: '30 Minutes',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'waiting', 'in-progress', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    rejectionReason: String,
    cancellationReason: String,
    reason: {
      type: String,
      default: 'General Online Video Consultation',
    },
    symptoms: [String],
    consultationFee: {
      type: Number,
      default: 600,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending'],
      default: 'pending',
    },
    paymentMode: {
      type: String,
      enum: ['online_simulation', 'pay_at_hospital'],
      default: 'pay_at_hospital',
    },
    transactionId: String,
    patientConsent: {
      agreed: { type: Boolean, default: true },
      consentedAt: { type: Date, default: Date.now },
      statement: {
        type: String,
        default: 'Patient consented to receive healthcare services via Kushal Hospitals end-to-end encrypted video consultation.',
      },
    },
    doctorJoined: { type: Boolean, default: false },
    doctorJoinedAt: Date,
    patientJoined: { type: Boolean, default: false },
    patientJoinedAt: Date,
    callStartedAt: Date,
    callEndedAt: Date,
    callDurationSeconds: { type: Number, default: 0 },
    clinicalNotes: String,
    diagnosis: String,
    prescriptions: [
      {
        medicineName: { type: String, required: true },
        dosage: { type: String, default: '1 tablet' },
        frequency: { type: String, default: 'Twice daily' },
        duration: { type: String, default: '5 days' },
        instructions: { type: String, default: 'After meals' },
        timing: { type: String, default: 'after_food' },
      },
    ],
    prescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OnlineConsultation', onlineConsultationSchema);
