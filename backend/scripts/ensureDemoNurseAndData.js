const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Doctor = require('../src/models/Doctor');
const Prescription = require('../src/models/Prescription');
const Nurse = require('../src/models/Nurse');
const NurseAssignment = require('../src/models/NurseAssignment');
const VitalSign = require('../src/models/VitalSign');
const MedicationAdministration = require('../src/models/MedicationAdministration');
const NursingTask = require('../src/models/NursingTask');
const NursingNote = require('../src/models/NursingNote');
const ShiftHandover = require('../src/models/ShiftHandover');
const NurseShiftAttendance = require('../src/models/NurseShiftAttendance');
const NurseEmergencyAlert = require('../src/models/NurseEmergencyAlert');
const { Ward, Bed } = require('../src/models/Ward');

async function seedNurseData() {
  await connectDB();
  console.log('Seeding comprehensive Nurse Role demo data...');

  // 1. Nurse User
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
    console.log('Created nurse user: nurse@kushalhospitals.com / Nurse@123456');
  } else {
    nurseUser.password = 'Nurse@123456';
    nurseUser.role = 'nurse';
    nurseUser.status = 'active';
    await nurseUser.save();
    console.log('Updated nurse user password: Nurse@123456');
  }

  // 2. Nurse Profile
  let nurse = await Nurse.findOne({ userId: nurseUser._id });
  if (!nurse) {
    nurse = await Nurse.create({
      userId: nurseUser._id,
      nurseId: 'NUR-7024',
      department: 'Critical Care & General Ward',
      specialization: 'Critical Care & Inpatient Nursing',
      qualification: ['B.Sc. Nursing', 'RN (Registered Nurse)', 'BLS/ACLS Certified'],
      licenseNumber: 'KMC-NUR-482910',
      experienceYears: 7,
      assignedWardName: 'General Ward A & ICU Wing',
      assignedRooms: ['Room 101', 'Room 102', 'Room 103', 'ICU Bed 01', 'ICU Bed 02'],
      shift: 'morning',
      currentShiftStatus: 'on_duty',
      phone: '9876543213',
      emergencyContact: '+91 9876543299 (Dr. K. Joseph - Brother)',
      lastClockIn: new Date(Date.now() - 3 * 60 * 60 * 1000),
    });
    console.log('Created Nurse profile');
  } else {
    nurse.currentShiftStatus = 'on_duty';
    nurse.assignedWardName = 'General Ward A & ICU Wing';
    await nurse.save();
  }

  // 3. Ensure Patients
  const patients = await Patient.find({}).limit(6).populate('userId');
  if (patients.length === 0) {
    console.log('No patients found, cannot seed assignments.');
    process.exit(0);
  }

  // 4. Assignments
  await NurseAssignment.deleteMany({ nurseId: nurse._id });
  const assignmentData = [
    {
      patient: patients[0],
      room: 'ICU Bed 01',
      bed: 'Bed 01',
      ward: 'ICU Critical Care',
      priority: 'critical',
      instructions: 'Continuous arterial line BP and SpO2 monitoring. Alert doctor if SpO2 drops < 92%.',
    },
    {
      patient: patients[1] || patients[0],
      room: 'Room 102',
      bed: 'Bed 02',
      ward: 'General Ward A',
      priority: 'urgent',
      instructions: 'Post-surgical recovery. Check surgical dressing every 4 hours, administer IV analgesics.',
    },
    {
      patient: patients[2] || patients[0],
      room: 'Room 103',
      bed: 'Bed 01',
      ward: 'General Ward A',
      priority: 'normal',
      instructions: 'Regular blood glucose before meals. Monitor diabetic diet and oral Metformin.',
    },
    {
      patient: patients[3] || patients[0],
      room: 'Room 104',
      bed: 'Bed 03',
      ward: 'Step-Down Unit',
      priority: 'normal',
      instructions: 'Hypertension monitoring. Mobilization assistance with walker.',
    },
  ];

  for (const item of assignmentData) {
    await NurseAssignment.create({
      nurseId: nurse._id,
      patientId: item.patient._id,
      roomNumber: item.room,
      bedNumber: item.bed,
      wardName: item.ward,
      priority: item.priority,
      careInstructions: item.instructions,
      assignedDate: new Date(),
      status: 'active',
    });
  }
  console.log('Created 4 active patient assignments');

  // 5. Vital Signs
  await VitalSign.deleteMany({ patientId: { $in: patients.map((p) => p._id) } });
  const p0 = patients[0];
  const p1 = patients[1] || p0;

  const vitalsToCreate = [
    {
      patientId: p0._id,
      nurseId: nurse._id,
      recordedBy: nurseUser._id,
      temperature: 101.2,
      bloodPressure: { systolic: 145, diastolic: 92 },
      heartRate: 104,
      respiratoryRate: 22,
      oxygenSaturation: 93,
      bloodGlucose: 168,
      painScore: 6,
      notes: 'Patient febrile and experiencing mild dyspnea. Administered cold sponge and supplemental oxygen at 2 L/min.',
      recordedAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      patientId: p0._id,
      nurseId: nurse._id,
      recordedBy: nurseUser._id,
      temperature: 99.4,
      bloodPressure: { systolic: 138, diastolic: 88 },
      heartRate: 88,
      respiratoryRate: 18,
      oxygenSaturation: 96,
      bloodGlucose: 140,
      painScore: 3,
      notes: 'Temperature settling post-paracetamol. Oxygen saturation improved to 96%.',
      recordedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      patientId: p1._id,
      nurseId: nurse._id,
      recordedBy: nurseUser._id,
      temperature: 98.6,
      bloodPressure: { systolic: 120, diastolic: 78 },
      heartRate: 72,
      respiratoryRate: 16,
      oxygenSaturation: 99,
      bloodGlucose: 110,
      painScore: 2,
      notes: 'Normal hemodynamic indicators. Patient alert, oriented, and ambulating comfortably.',
      recordedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ];

  for (const v of vitalsToCreate) {
    const vitalDoc = new VitalSign(v);
    await vitalDoc.save();
  }
  console.log('Created sample vital signs records');

  // 6. Medication Administration Records (eMAR)
  await MedicationAdministration.deleteMany({ patientId: { $in: patients.map((p) => p._id) } });
  await MedicationAdministration.create([
    {
      patientId: p0._id,
      nurseId: nurse._id,
      administeredBy: nurseUser._id,
      medicineName: 'Inj. Ceftriaxone',
      dosage: '1g IV in 100ml NS',
      route: 'iv',
      frequency: 'BD (Twice daily)',
      scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      administeredAt: new Date(Date.now() - 110 * 60 * 1000),
      status: 'administered',
      notes: 'IV infused over 30 minutes via peripheral cannula. No phlebitis or allergic reaction observed.',
    },
    {
      patientId: p0._id,
      nurseId: nurse._id,
      administeredBy: nurseUser._id,
      medicineName: 'Tab. Paracetamol',
      dosage: '650mg',
      route: 'oral',
      frequency: 'SOS (for temp > 100°F)',
      scheduledTime: new Date(Date.now() - 40 * 60 * 1000),
      administeredAt: new Date(Date.now() - 35 * 60 * 1000),
      status: 'administered',
      notes: 'Given for temperature 101.2°F with water.',
    },
    {
      patientId: p1._id,
      nurseId: nurse._id,
      administeredBy: nurseUser._id,
      medicineName: 'Tab. Pantoprazole',
      dosage: '40mg',
      route: 'oral',
      frequency: 'OD Morning (Before breakfast)',
      scheduledTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
      administeredAt: new Date(Date.now() - 290 * 60 * 1000),
      status: 'administered',
      notes: 'Administered 30 mins prior to breakfast.',
    },
    {
      patientId: p1._id,
      nurseId: nurse._id,
      administeredBy: nurseUser._id,
      medicineName: 'Tab. Tramadol',
      dosage: '50mg',
      route: 'oral',
      frequency: 'BD Post-op',
      scheduledTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'refused',
      reasonForMissedOrRefused: 'Patient states mild nausea and prefers to defer pain medication as pain score is 2/10.',
      notes: 'Doctor informed of dose deferral.',
    },
  ]);
  console.log('Created sample eMAR medication records');

  // 7. Nursing Tasks
  await NursingTask.deleteMany({ nurseId: nurse._id });
  await NursingTask.create([
    {
      nurseId: nurse._id,
      patientId: p0._id,
      title: 'High-Flow Oxygen & Arterial Line Check',
      description: 'Check arterial transducer calibration and monitor continuous blood gas saturation.',
      category: 'Patient Monitoring',
      priority: 'urgent',
      status: 'pending',
      dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
      createdBy: nurseUser._id,
    },
    {
      nurseId: nurse._id,
      patientId: p1._id,
      title: 'Clean and Re-dress Abdominal Incision',
      description: 'Sterile dressing with betadine swab, inspect for erythema or discharge.',
      category: 'Wound Dressing',
      priority: 'high',
      status: 'pending',
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      createdBy: nurseUser._id,
    },
    {
      nurseId: nurse._id,
      patientId: p0._id,
      title: 'Midday Blood Glucose & Insulin Protocol',
      description: 'Perform fingerprick capillary glucose test before lunch.',
      category: 'Medication Administration',
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
      createdBy: nurseUser._id,
    },
    {
      nurseId: nurse._id,
      patientId: p1._id,
      title: 'Morning Sponge Bath & Linen Change',
      description: 'Completed hygiene protocol and replaced bed linen with sanitized sheets.',
      category: 'Patient Hygiene',
      priority: 'low',
      status: 'completed',
      dueDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 150 * 60 * 1000),
      completedBy: nurseUser._id,
      completionNotes: 'Patient felt refreshed, skin intact without pressure spots.',
      createdBy: nurseUser._id,
    },
  ]);
  console.log('Created sample nursing tasks');

  // 8. Nursing Notes
  await NursingNote.deleteMany({ patientId: { $in: patients.map((p) => p._id) } });
  await NursingNote.create([
    {
      patientId: p0._id,
      nurseId: nurse._id,
      recordedBy: nurseUser._id,
      noteType: 'progress',
      patientComplaints: 'Chills and dry cough with chest tightness.',
      observedSymptoms: 'Fever (101.2°F), mild tachypnea, coarse bibasilar crackles on auscultation.',
      patientCondition: 'fair',
      treatmentAndCareProvided: 'Administered prescribed IV Ceftriaxone, placed on 2 L/min oxygen via nasal cannula. Tepid sponging performed. Encouraged deep breathing exercises.',
      woundObservations: 'Peripheral IV site in left forearm clean, patent, no signs of thrombophlebitis.',
      patientResponse: 'Reported feeling more comfortable after sponging and antipyretic. Cough persists.',
      followUpPlan: 'Recheck vitals at 14:00. Inform Dr. Rajesh Sharma if febrile spike exceeds 102°F.',
      isSigned: true,
      signedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      patientId: p1._id,
      nurseId: nurse._id,
      recordedBy: nurseUser._id,
      noteType: 'progress',
      patientComplaints: 'Mild soreness around abdominal surgical site.',
      observedSymptoms: 'Alert and cheerful. Vital signs within normal clinical parameters (BP 120/78, Pulse 72).',
      patientCondition: 'stable',
      treatmentAndCareProvided: 'Wound inspection performed under aseptic conditions. Incision line clean, dry, with surgical staples intact. No serosanguinous oozing. Sterile pad replaced.',
      woundObservations: 'Incision healing by primary intention. Minimal edema.',
      patientResponse: 'Patient tolerated mobility assessment and walked 50 meters down the hallway without dizziness.',
      followUpPlan: 'Encourage oral fluid intake. Scheduled for evening wound review.',
      isSigned: true,
      signedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ]);
  console.log('Created sample nursing progress notes');

  // 9. Emergency Alert Sample
  await NurseEmergencyAlert.deleteMany({ nurseId: nurse._id });
  await NurseEmergencyAlert.create({
    patientId: p0._id,
    nurseId: nurse._id,
    alertType: 'Rapid Response (Condition Deterioration)',
    severity: 'critical',
    location: {
      ward: 'ICU Critical Care',
      roomNumber: 'Room 101',
      bedNumber: 'Bed 01',
    },
    symptoms: 'Transient drop in oxygen saturation to 91% with sudden tachycardia (115 bpm).',
    vitalsAtAlert: { bp: '145/92', pulse: 115, spo2: 91, temp: 101.2, rr: 24 },
    actionsTaken: 'Increased oxygen flow to 4 L/min via Venturi mask. Stat call sent to Attending Cardiologist.',
    status: 'stabilized',
    doctorResponseTimeMinutes: 4,
    resolvedAt: new Date(Date.now() - 20 * 60 * 1000),
    resolutionNotes: 'Dr. Rajesh Sharma evaluated patient on-site. Added Nebulization with Duolin. SpO2 recovered to 96%.',
  });
  console.log('Created sample emergency alert record');

  // 10. Shift Attendance Sample
  await NurseShiftAttendance.deleteMany({ nurseId: nurse._id });
  await NurseShiftAttendance.create([
    {
      nurseId: nurse._id,
      userId: nurseUser._id,
      date: new Date(),
      shiftType: 'Morning (07:00 - 15:00)',
      clockIn: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'on_duty',
      wardAssigned: 'General Ward A & ICU Wing',
      notes: 'Morning handover received from Night Nurse Sister Sunita.',
    },
    {
      nurseId: nurse._id,
      userId: nurseUser._id,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      shiftType: 'Morning (07:00 - 15:00)',
      clockIn: new Date(Date.now() - 28 * 60 * 60 * 1000),
      clockOut: new Date(Date.now() - 20 * 60 * 60 * 1000),
      totalHoursWorked: 8.0,
      status: 'completed',
      wardAssigned: 'General Ward A',
      notes: 'Full shift completed without incidents.',
    },
  ]);
  console.log('Created sample shift attendance records');

  // 11. Shift Handover Sample
  await ShiftHandover.deleteMany({ outgoingNurseId: nurse._id });
  await ShiftHandover.create({
    outgoingNurseId: nurse._id,
    wardName: 'General Ward A & ICU Wing',
    shiftDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    outgoingShift: 'Morning (06:00 - 14:00)',
    incomingShift: 'Afternoon (14:00 - 22:00)',
    handoverSummary: 'Ward census: 4 patients under active nursing care. 1 critical in ICU Bed 01, 1 surgical post-op in Room 102 stable. All scheduled morning medications administered.',
    criticalPatientObservations: [
      {
        patientId: p0._id,
        patientName: p0.userId?.name || 'Patient',
        roomNumber: 'ICU Bed 01',
        bedNumber: 'Bed 01',
        diagnosis: 'Bacterial Bronchopneumonia & Hypertension',
        acuity: 'critical',
        observations: 'SpO2 stable at 95% on 2L nasal cannula. Evening IV Ceftriaxone due at 18:00.',
        pendingActions: 'Repeat CBC report pending from central lab.',
      },
    ],
    pendingMedications: ['Inj. Ceftriaxone 1g at 18:00', 'Tab. Paracetamol 650mg SOS for fever'],
    pendingTasks: ['Post-operative dressing inspection Room 102', 'Evening vitals chart round at 16:00'],
    status: 'acknowledged',
    acknowledgedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
    acknowledgementNotes: 'Handover received and verified by Afternoon Nurse.',
  });
  console.log('Created sample shift handover report');

  await mongoose.connection.close();
  console.log('Nurse role seed completed successfully!');
}

seedNurseData().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
