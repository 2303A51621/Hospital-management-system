const mongoose = require('mongoose');

const nurseShiftAttendanceSchema = new mongoose.Schema(
  {
    nurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Nurse',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    shiftType: {
      type: String,
      default: 'Morning',
    },
    scheduledStart: {
      type: String,
      default: '07:00 AM',
    },
    scheduledEnd: {
      type: String,
      default: '03:00 PM',
    },
    clockIn: {
      type: Date,
      default: Date.now,
    },
    clockOut: {
      type: Date,
      default: null,
    },
    totalHoursWorked: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['on_duty', 'completed', 'late', 'absent', 'on_leave'],
      default: 'on_duty',
    },
    wardAssigned: {
      type: String,
      default: 'General Ward A',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

nurseShiftAttendanceSchema.index({ nurseId: 1, date: -1 });

module.exports = mongoose.model('NurseShiftAttendance', nurseShiftAttendanceSchema);
