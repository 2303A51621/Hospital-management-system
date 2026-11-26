const { connectDB } = require('../src/config/db');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Patient = require('../src/models/Patient');
const Nurse = require('../src/models/Nurse');

async function ensureUsers() {
  await connectDB();
  console.log('Ensuring demo users for all portals...');

  const accounts = [
    {
      emails: ['admin@kushalhospitals.com', 'admin@hospital.com'],
      role: 'admin',
      password: 'Admin@123456',
      name: 'System Administrator',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '9876543210',
    },
    {
      emails: ['doctor@kushalhospitals.com', 'doctor@hospital.com'],
      role: 'doctor',
      password: 'Doctor@123456',
      name: 'Dr. Rajesh Sharma',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      phone: '9876543211',
      doctorProfile: {
        licenseNumber: 'KH-DOC-9999',
        specialization: 'Cardiology',
        department: 'Cardiology',
        experience: 16,
        experienceYears: 16,
        qualification: ['MBBS', 'MD (Cardiology)', 'DM'],
        consultationFee: 600,
        rating: 4.9,
        totalReviews: 24,
        isActive: true,
        emergencyAvailable: true,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        availableSlots: { startTime: '09:00', endTime: '18:00', slotDuration: 30 },
      },
    },
    {
      emails: ['patient@kushalhospitals.com', 'patient@hospital.com'],
      role: 'patient',
      password: 'Patient@123456',
      name: 'Ananya Verma',
      firstName: 'Ananya',
      lastName: 'Verma',
      phone: '9876543212',
      patientProfile: {
        gender: 'Female',
        dateOfBirth: new Date('1998-05-15'),
        bloodGroup: 'B+',
        allergies: [{ allergen: 'Penicillin', severity: 'mild', reaction: 'Skin rash' }],
        chronicDiseases: [{ disease: 'Mild Asthma', diagnosisDate: new Date('2020-01-01'), status: 'active' }],
        emergencyContact: {
          name: 'Suresh Verma',
          relationship: 'Father',
          phone: '9876543219',
        },
      },
    },
    {
      emails: ['nurse@kushalhospitals.com', 'nurse@hospital.com'],
      role: 'nurse',
      password: 'Nurse@123456',
      name: 'Sister Mary Joseph',
      firstName: 'Mary',
      lastName: 'Joseph',
      phone: '9876543213',
      nurseProfile: {
        department: 'Inpatient Nursing Care',
        specialization: 'Critical Care & Post-Op Recovery',
        qualification: ['B.Sc. Nursing', 'RN (Registered Nurse)'],
        licenseNumber: 'KMC-NUR-882194',
        experienceYears: 6,
        assignedWardName: 'General Ward A',
        assignedRooms: ['Room 101', 'Room 102', 'Room 103'],
        shift: 'morning',
        currentShiftStatus: 'on_duty',
        status: 'active',
      },
    },
  ];

  for (const group of accounts) {
    for (const email of group.emails) {
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          name: group.name,
          firstName: group.firstName,
          lastName: group.lastName,
          email,
          password: group.password,
          phone: email.includes('@hospital.com') ? `${group.phone.slice(0, 8)}${Math.floor(10 + Math.random() * 89)}` : group.phone,
          role: group.role,
          isVerified: true,
          status: 'active',
        });
        await user.save();
        console.log(`Created ${group.role} user: ${email}`);
      } else {
        user.password = group.password;
        user.status = 'active';
        user.isVerified = true;
        user.role = group.role;
        await user.save();
        console.log(`Updated ${group.role} user password: ${email}`);
      }

      if (group.role === 'doctor') {
        let doctor = await Doctor.findOne({ userId: user._id });
        if (!doctor) {
          await Doctor.create({
            userId: user._id,
            ...group.doctorProfile,
            licenseNumber: `${group.doctorProfile.licenseNumber}-${email.startsWith('doctor@hospital') ? 'HOSP' : 'KUSH'}`,
          });
          console.log(`Created doctor profile for ${email}`);
        } else {
          doctor.consultationFee = 600;
          doctor.isActive = true;
          await doctor.save();
          console.log(`Updated doctor profile for ${email}`);
        }
      }

      if (group.role === 'patient') {
        let patient = await Patient.findOne({ userId: user._id });
        if (!patient) {
          await Patient.create({
            userId: user._id,
            ...group.patientProfile,
          });
          console.log(`Created patient profile for ${email}`);
        }
      }

      if (group.role === 'nurse') {
        let nurse = await Nurse.findOne({ userId: user._id });
        if (!nurse) {
          await Nurse.create({
            userId: user._id,
            ...group.nurseProfile,
            nurseId: `NUR-${email.startsWith('nurse@hospital') ? 'HOSP01' : 'KUSH01'}`,
          });
          console.log(`Created nurse profile for ${email}`);
        }
      }
    }
  }

  await mongoose.connection.close();
  console.log('Demo users setup complete!');
}

ensureUsers().catch((err) => {
  console.error('Error ensuring demo users:', err);
  process.exit(1);
});
