require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
require('../src/models/index');
const Doctor = require('../src/models/Doctor');

const EVERY_DAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// 12-hour shifts, staggered by 2 hours
const SHIFTS = [
  { startTime: '06:00', endTime: '18:00', label: '06:00 AM - 06:00 PM', shiftName: 'Morning Shift' },
  { startTime: '08:00', endTime: '20:00', label: '08:00 AM - 08:00 PM', shiftName: 'Day Shift' },
  { startTime: '10:00', endTime: '22:00', label: '10:00 AM - 10:00 PM', shiftName: 'Mid-Day Shift' },
  { startTime: '12:00', endTime: '24:00', label: '12:00 PM - 12:00 AM', shiftName: 'Afternoon Shift' },
  { startTime: '14:00', endTime: '02:00', label: '02:00 PM - 02:00 AM', shiftName: 'Evening Shift' },
  { startTime: '16:00', endTime: '04:00', label: '04:00 PM - 04:00 AM', shiftName: 'Twilight Shift' },
  { startTime: '18:00', endTime: '06:00', label: '06:00 PM - 06:00 AM', shiftName: 'Night Shift' },
  { startTime: '20:00', endTime: '08:00', label: '08:00 PM - 08:00 AM', shiftName: 'Overnight Shift' },
  { startTime: '22:00', endTime: '10:00', label: '10:00 PM - 10:00 AM', shiftName: 'Late Night Shift' },
  { startTime: '00:00', endTime: '12:00', label: '12:00 AM - 12:00 PM', shiftName: 'Graveyard Shift' },
  { startTime: '02:00', endTime: '14:00', label: '02:00 AM - 02:00 PM', shiftName: 'Early Bird Shift' },
  { startTime: '04:00', endTime: '16:00', label: '04:00 AM - 04:00 PM', shiftName: 'Dawn Shift' },
];

const updateAllDoctors = async () => {
  await connectDB();
  const doctors = await Doctor.find({}).sort({ createdAt: 1 });
  console.log(`Found ${doctors.length} doctors to configure with staggered 12-hour shifts.`);

  let count = 0;
  for (let i = 0; i < doctors.length; i++) {
    const doc = doctors[i];
    const shift = SHIFTS[i % SHIFTS.length];

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
    doc.emergencyAvailable = true;

    await doc.save();
    count++;
    console.log(`Updated Dr. ${doc.licenseNumber}: ${shift.shiftName} (${shift.label}) - Monday to Sunday`);
  }

  console.log(`\nSuccessfully updated all ${count} doctors with 12-hour staggered availability Monday-Sunday!`);
  await mongoose.connection.close();
  process.exit(0);
};

updateAllDoctors().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});

