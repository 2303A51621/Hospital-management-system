const { connectDB } = require('../src/config/db');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Patient = require('../src/models/Patient');

async function ensureUsers() {
  await connectDB();
  console.log('Ensuring demo users for report capture...');

  // 1. Admin
  let admin = await User.findOne({ email: 'admin@kushalhospitals.com' });
  if (!admin) {
    admin = new User({
      name: 'System Administrator',
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@kushalhospitals.com',
      password: 'Admin@123456',
      phone: '9876543210',
      role: 'admin',
      isVerified: true,
      status: 'active',
    });
    await admin.save();
    console.log('Created admin demo user');
  } else {
    admin.password = 'Admin@123456';
    admin.status = 'active';
    await admin.save();
    console.log('Updated admin demo password');
  }

  // 2. Doctor
  let docUser = await User.findOne({ email: 'doctor@kushalhospitals.com' });
  if (!docUser) {
    docUser = new User({
      name: 'Dr. Rajesh Sharma',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      email: 'doctor@kushalhospitals.com',
      password: 'Doctor@123456',
      phone: '9876543211',
      role: 'doctor',
      isVerified: true,
      status: 'active',
    });
    await docUser.save();
    console.log('Created doctor user');
  } else {
    docUser.password = 'Doctor@123456';
    docUser.status = 'active';
    await docUser.save();
    console.log('Updated doctor user password');
  }

  let doctor = await Doctor.findOne({ userId: docUser._id });
  if (!doctor) {
    doctor = await Doctor.create({
      userId: docUser._id,
      licenseNumber: 'KH-DOC-9999',
      specialization: 'Cardiology',
      department: 'Cardiology',
      experience: 16,
      experienceYears: 16,
      qualification: ['MBBS', 'MD (Cardiology)', 'DM'],
      consultationFee: 800,
      rating: 4.9,
      totalReviews: 24,
      isActive: true,
      emergencyAvailable: true,
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      availableSlots: { startTime: '09:00', endTime: '18:00', slotDuration: 30 },
    });
    console.log('Created doctor profile');
  }

  // 3. Patient
  let patientUser = await User.findOne({ email: 'patient@kushalhospitals.com' });
  if (!patientUser) {
    patientUser = new User({
      name: 'Ananya Verma',
      firstName: 'Ananya',
      lastName: 'Verma',
      email: 'patient@kushalhospitals.com',
      password: 'Patient@123456',
      phone: '9876543212',
      role: 'patient',
      isVerified: true,
      status: 'active',
    });
    await patientUser.save();
    console.log('Created patient user');
  } else {
    patientUser.password = 'Patient@123456';
    patientUser.status = 'active';
    await patientUser.save();
    console.log('Updated patient user password');
  }

  let patient = await Patient.findOne({ userId: patientUser._id });
  if (!patient) {
    patient = await Patient.create({
      userId: patientUser._id,
      gender: 'female',
      dateOfBirth: new Date('1998-05-15'),
      bloodGroup: 'B+',
      allergies: ['Penicillin'],
      chronicDiseases: ['Mild Asthma'],
      emergencyContact: {
        name: 'Suresh Verma',
        relationship: 'Father',
        phone: '9876543219',
      },
    });
    console.log('Created patient profile');
  }

  // 4. Nurse
  let nurseUser = await User.findOne({ email: 'nurse@kushalhospitals.com' });
  if (!nurseUser) {
    nurseUser = new User({
      name: 'Sister Mary Joseph',
      firstName: 'Mary',
      lastName: 'Joseph',
      email: 'nurse@kushalhospitals.com',
      password: 'Nurse@123456',
      phone: '9876543213',
      role: 'nurse',
      isVerified: true,
      status: 'active',
    });
    await nurseUser.save();
    console.log('Created nurse user');
  } else {
    nurseUser.password = 'Nurse@123456';
    nurseUser.status = 'active';
    await nurseUser.save();
    console.log('Updated nurse user password');
  }

  await mongoose.connection.close();
  console.log('Demo users setup complete!');
}

ensureUsers().catch((err) => {
  console.error('Error ensuring demo users:', err);
  process.exit(1);
});

