const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Ward } = require('../models/Ward');

const wards = [
  { wardName: 'ICU', wardType: 'icu', totalBeds: 20, occupiedBeds: 14, availableBeds: 6 },
  { wardName: 'General Ward', wardType: 'general', totalBeds: 100, occupiedBeds: 76, availableBeds: 24 },
  { wardName: 'Private Ward', wardType: 'private', totalBeds: 30, occupiedBeds: 18, availableBeds: 12 },
];

const seed = async () => {
  await connectDB();
  for (const ward of wards) {
    await Ward.updateOne({ wardName: ward.wardName }, { $set: { ...ward, isActive: true } }, { upsert: true });
  }
  console.log(`Ward seed complete: ${wards.length} active wards`);
  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error('Ward seed failed:', error.message);
  await mongoose.connection.close();
  process.exitCode = 1;
});
