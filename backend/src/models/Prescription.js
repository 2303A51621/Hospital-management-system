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
          required: false,
        },
        name: {
          type: String,
          required: false,
        },
        dosage: {
          type: String, // e.g. "500 mg" or "1 tablet"
          default: '1 tablet',
        },
        frequency: {
          type: String, // e.g. "once daily", "twice daily"
          default: 'Once daily',
        },
        duration: {
          type: String, // e.g. "5 days"
          default: '5 days',
        },
        quantity: {
          type: Number,
          default: 10,
        },
        instructions: {
          type: String, // e.g. "After food"
          default: 'After food',
        },
        timing: {
          type: String,
          default: 'after_food',
        },
        alternativeMedicine: {
          type: String,
          default: '',
        },
        alternatives: {
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
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    fileType: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    attachments: [
      {
        fileUrl: String,
        fileName: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

// Pre-validation normalization hook so neither medicineName nor name is ever missing
prescriptionSchema.pre('validate', function () {
  if (this.medicines && Array.isArray(this.medicines)) {
    this.medicines.forEach((m) => {
      const medName = (m.medicineName || m.name || '').trim();
      m.medicineName = medName || 'Prescribed Medication';
      m.name = medName || 'Prescribed Medication';
      if (!m.dosage) m.dosage = '1 tablet';
      if (!m.frequency) m.frequency = 'Once daily';
      if (!m.duration) m.duration = '5 days';
      if (!m.instructions) m.instructions = m.timing || 'After food';
    });
  }
});

prescriptionSchema.index({ doctorId: 1, prescriptionDate: -1 });
prescriptionSchema.index({ patientId: 1, prescriptionDate: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
