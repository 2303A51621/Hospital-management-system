const { connectDB } = require('../config/db');
const Doctor = require('../models/Doctor');

const EVERY_DAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const updateDoctorAvailability = async () => {
  await connectDB();
  const result = await Doctor.updateMany(
    {},
    {
      $set: {
        availableDays: EVERY_DAY,
        availableSlots: {
          startTime: '00:00',
          endTime: '24:00',
          slotDuration: 30,
        },
        availability: [],
      },
    }
  );
  console.log(`Updated ${result.modifiedCount} doctors for daily 24-hour availability.`);
  process.exit(0);
};

updateDoctorAvailability().catch((error) => {
  console.error('Unable to update doctor availability:', error.message || error);
  process.exit(1);
});
