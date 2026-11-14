const mongoose = require('mongoose');

const vitalSignSchema = new mongoose.Schema(
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
    temperature: {
      type: Number, // in °F, e.g. 98.6
      required: true,
    },
    temperatureUnit: {
      type: String,
      default: '°F',
    },
    bloodPressure: {
      systolic: { type: Number, required: true }, // e.g. 120
      diastolic: { type: Number, required: true }, // e.g. 80
    },
    heartRate: {
      type: Number, // bpm, e.g. 72
      required: true,
    },
    respiratoryRate: {
      type: Number, // breaths/min, e.g. 16
      required: true,
    },
    oxygenSaturation: {
      type: Number, // SpO2 %, e.g. 98
      required: true,
    },
    bloodGlucose: {
      type: Number, // mg/dL, e.g. 110
      required: false,
      default: null,
    },
    bloodGlucoseType: {
      type: String,
      enum: ['fasting', 'post_prandial', 'random'],
      default: 'random',
    },
    height: {
      type: Number, // cm
      default: null,
    },
    weight: {
      type: Number, // kg
      default: null,
    },
    bmi: {
      type: Number,
      default: null,
    },
    painScore: {
      type: Number, // 0 to 10
      default: 0,
      min: 0,
      max: 10,
    },
    isAbnormal: {
      type: Boolean,
      default: false,
    },
    abnormalFlags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    notifiedDoctor: {
      type: Boolean,
      default: false,
    },
    doctorNotifiedAt: {
      type: Date,
      default: null,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Pre-save clinical evaluation helper to flag abnormal vitals
vitalSignSchema.pre('save', function () {
  const flags = [];
  if (this.temperature > 100.4) flags.push(`High Temperature (${this.temperature}°F - Febrile)`);
  if (this.temperature < 95.0) flags.push(`Hypothermia (${this.temperature}°F)`);

  const sys = this.bloodPressure?.systolic || 120;
  const dia = this.bloodPressure?.diastolic || 80;
  if (sys >= 140 || dia >= 90) flags.push(`Hypertension (BP ${sys}/${dia} mmHg)`);
  if (sys < 90 || dia < 60) flags.push(`Hypotension (BP ${sys}/${dia} mmHg)`);

  if (this.heartRate > 100) flags.push(`Tachycardia (Pulse ${this.heartRate} bpm)`);
  if (this.heartRate < 60) flags.push(`Bradycardia (Pulse ${this.heartRate} bpm)`);

  if (this.oxygenSaturation < 94) flags.push(`Hypoxia / Low SpO2 (${this.oxygenSaturation}%)`);
  if (this.respiratoryRate > 22 || this.respiratoryRate < 10) flags.push(`Abnormal RR (${this.respiratoryRate}/min)`);

  if (this.bloodGlucose && (this.bloodGlucose > 180 || this.bloodGlucose < 70)) {
    flags.push(`Abnormal Glucose (${this.bloodGlucose} mg/dL)`);
  }

  this.abnormalFlags = flags;
  this.isAbnormal = flags.length > 0;

  if (this.height && this.weight && this.height > 0) {
    const hMeters = this.height / 100;
    this.bmi = parseFloat((this.weight / (hMeters * hMeters)).toFixed(1));
  }
});

vitalSignSchema.index({ patientId: 1, recordedAt: -1 });
vitalSignSchema.index({ nurseId: 1, recordedAt: -1 });

module.exports = mongoose.model('VitalSign', vitalSignSchema);
