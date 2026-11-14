const { connectDB } = require('../src/config/db');
const mongoose = require('mongoose');
const models = require('../src/models');
const fs = require('fs');
const path = require('path');

async function inspect() {
  await connectDB();
  console.log('=== REAL DATABASE STATISTICS ===');
  const collections = await mongoose.connection.db.listCollections().toArray();
  const stats = {};
  for (const c of collections) {
    const count = await mongoose.connection.db.collection(c.name).countDocuments();
    stats[c.name] = count;
    console.log(`${c.name}: ${count} records`);
  }

  console.log('\n=== SAMPLE RECORDS ===');
  const sampleUsers = await models.User.find({}).select('-password').limit(3).lean();
  console.log('Sample Users:', JSON.stringify(sampleUsers, null, 2));

  const sampleDoctors = await models.Doctor.find({}).populate('userId', 'name email').limit(2).lean();
  console.log('Sample Doctors:', JSON.stringify(sampleDoctors, null, 2));

  const samplePatients = await models.Patient.find({}).populate('userId', 'name email phone').limit(2).lean();
  console.log('Sample Patients:', JSON.stringify(samplePatients, null, 2));

  const sampleAppointments = await models.Appointment.find({}).limit(2).lean();
  console.log('Sample Appointments:', JSON.stringify(sampleAppointments, null, 2));

  const sampleBillings = await models.Billing.find({}).limit(2).lean();
  console.log('Sample Billings:', JSON.stringify(sampleBillings, null, 2));

  const sampleWards = await models.Ward.find({}).limit(2).lean();
  console.log('Sample Wards:', JSON.stringify(sampleWards, null, 2));

  await mongoose.connection.close();
}

inspect().catch((err) => {
  console.error('Inspection failed:', err);
  process.exit(1);
});

