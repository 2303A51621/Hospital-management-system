require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
require('../src/models/index');
const Doctor = require('../src/models/Doctor');
const User = require('../src/models/User');

const updateFees = async () => {
  await connectDB();
  const doctors = await Doctor.find({}).populate('userId');
  console.log(`Found ${doctors.length} doctors.`);

  let updated = 0;
  for (const doc of doctors) {
    const name = doc.userId?.name || `${doc.userId?.firstName || ''} ${doc.userId?.lastName || ''}`.trim() || 'Unknown';
    console.log(`Doctor: ${name} (${doc.specialization}) - Current fee: ${doc.consultationFee}`);
    
    // If fee is 0, missing, or less than 100, or for all doctors if specified
    if (!doc.consultationFee || doc.consultationFee === 0 || doc.consultationFee < 100) {
      doc.consultationFee = 600;
      await doc.save();
      updated++;
      console.log(`  -> Updated ${name} consultation fee to 600.`);
    } else if (name.toLowerCase().includes('manidhar')) {
      doc.consultationFee = 600;
      await doc.save();
      updated++;
      console.log(`  -> Specifically updated ${name} consultation fee to 600.`);
    }
  }

  console.log(`\nUpdated ${updated} doctors to 600 consultation fee.`);
  await mongoose.connection.close();
  process.exit(0);
};

updateFees().catch((err) => {
  console.error('Error updating doctor fees:', err);
  process.exit(1);
});
