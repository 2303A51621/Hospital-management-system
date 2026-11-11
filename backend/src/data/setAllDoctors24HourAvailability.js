const { connectDB } = require('../config/db');
const Doctor = require('../models/Doctor');

const EVERY_DAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const updateDoctorAvailability = async () => {
  await connectDB();
  const doctors = await Doctor.find({});
  console.log(`Setting 24-hour round-the-clock availability Monday-Sunday for ${doctors.length} doctors...`);

  let count = 0;
  for (const doc of doctors) {
    doc.availableDays = EVERY_DAY;
    doc.availableSlots = {
      startTime: '00:00',
      endTime: '24:00',
      slotDuration: 30,
    };
    doc.availability = EVERY_DAY.map((day) => ({
      day,
      startTime: '00:00',
      endTime: '24:00',
    }));
    doc.isActive = true;
    doc.emergencyAvailable = true;
    await doc.save();
    count++;
  }

  console.log(`Successfully updated all ${count} doctors with 24-hour availability (00:00 to 24:00) Monday through Sunday!`);
  process.exit(0);
};

updateDoctorAvailability().catch((error) => {
  console.error('Unable to update doctor availability:', error.message || error);
  process.exit(1);
});
