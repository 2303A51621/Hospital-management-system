const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      unique: true,
      default: () => 'RX-' + uuidv4().slice(0, 8).toUpperCase(),
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
    emrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EMR',
      required: false,
      default: null,
    },
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
      required: false,
      default: null,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: false,
      default: null,
    },
    diagnosis: {
      type: String,
      default: '',
    },
    medicines: [
      {
        medicineId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Medicine',
          required: false,
        },
        medicineName: {
          type: String,
          required: true,
        },
        dosage: {
          type: String, // e.g. "500 mg" or "1 tablet"
          required: true,
        },
        frequency: {
          type: String, // e.g. "once daily", "twice daily"
          required: true,
        },
        duration: {
          type: String, // e.g. "5 days"
          required: true,
        },
        quantity: {
          type: Number,
          default: 10,
        },
        instructions: {
          type: String, // e.g. "After food"
          default: 'After food',
        },
        alternativeMedicine: {
          type: String,
          default: '',
        },
      },
    ],
    prescriptionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    validUntil: Date,
    status: {
      type: String,
      enum: ['active', 'expired', 'completed', 'cancelled'],
      default: 'active',
    },
    notes: String,
    digitalSignature: String,
    allergiesChecked: {
      type: Boolean,
      default: true,
    },
    drugInteractionsChecked: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
