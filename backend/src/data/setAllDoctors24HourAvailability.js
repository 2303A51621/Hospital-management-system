const { connectDB } = require('../config/db');
const Doctor = require('../models/Doctor');

const EVERY_DAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SHIFTS_12H = [
  { startTime: '06:00', endTime: '18:00', shiftName: 'Morning Shift' },
  { startTime: '08:00', endTime: '20:00', shiftName: 'Day Shift' },
  { startTime: '10:00', endTime: '22:00', shiftName: 'Mid-Day Shift' },
  { startTime: '12:00', endTime: '24:00', shiftName: 'Afternoon Shift' },
  { startTime: '14:00', endTime: '02:00', shiftName: 'Evening Shift' },
  { startTime: '16:00', endTime: '04:00', shiftName: 'Twilight Shift' },
  { startTime: '18:00', endTime: '06:00', shiftName: 'Night Shift' },
  { startTime: '20:00', endTime: '08:00', shiftName: 'Overnight Shift' },
  { startTime: '22:00', endTime: '10:00', shiftName: 'Late Night Shift' },
  { startTime: '00:00', endTime: '12:00', shiftName: 'Graveyard Shift' },
  { startTime: '02:00', endTime: '14:00', shiftName: 'Early Bird Shift' },
  { startTime: '04:00', endTime: '16:00', shiftName: 'Dawn Shift' },
];

const updateDoctorAvailability = async () => {
  await connectDB();
  const doctors = await Doctor.find({}).sort({ createdAt: 1 });
  console.log(`Setting staggered 12-hour shifts Monday-Sunday for ${doctors.length} doctors...`);

  let count = 0;
  for (let i = 0; i < doctors.length; i++) {
    const doc = doctors[i];
    const shift = SHIFTS_12H[i % SHIFTS_12H.length];

    doc.availableDays = EVERY_DAY;
    doc.availableSlots = {
      startTime: shift.startTime,
      endTime: shift.endTime,
      slotDuration: 30,
    };
    doc.availability = EVERY_DAY.map((day) => ({
      day,
      startTime: shift.startTime,
      endTime: shift.endTime,
    }));
    doc.isActive = true;
    await doc.save();
    count++;
  }

  console.log(`Successfully updated ${count} doctors with 12-hour staggered shifts (Monday to Sunday).`);
  process.exit(0);
};

updateDoctorAvailability().catch((error) => {
  console.error('Unable to update doctor availability:', error.message || error);
  process.exit(1);
});
