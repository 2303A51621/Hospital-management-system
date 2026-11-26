require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
require('../src/models/index');
const User = require('../src/models/User');
const Doctor = require('../src/models/Doctor');
const Patient = require('../src/models/Patient');
const Appointment = require('../src/models/Appointment');
const Consultation = require('../src/models/Consultation');
const Prescription = require('../src/models/Prescription');

async function seedDemoData() {
  await connectDB();
  console.log('--- Seeding Rich Demo Patient & Doctor Data ---');

  // 1. Locate Demo Doctors
  const doctorUsers = await User.find({
    email: { $in: ['doctor@kushalhospitals.com', 'doctor@hospital.com'] },
  });
  if (doctorUsers.length === 0) {
    console.error('No demo doctor users found! Run ensureDemoUsers.js first.');
    process.exit(1);
  }
  const doctorProfiles = await Doctor.find({
    userId: { $in: doctorUsers.map((u) => u._id) },
  });
  console.log(`Found ${doctorProfiles.length} demo doctor profile(s).`);

  // Primary doctor profile (Dr. Rajesh Sharma)
  const primaryDoc = doctorProfiles[0];

  // 2. Locate Demo Patients
  const patientUsers = await User.find({
    email: { $in: ['patient@kushalhospitals.com', 'patient@hospital.com'] },
  });
  if (patientUsers.length === 0) {
    console.error('No demo patient users found! Run ensureDemoUsers.js first.');
    process.exit(1);
  }
  const demoPatientProfiles = await Patient.find({
    userId: { $in: patientUsers.map((u) => u._id) },
  });
  console.log(`Found ${demoPatientProfiles.length} demo patient profile(s).`);

  // Clean old demo appointments, consultations, prescriptions specifically created for these demo users
  console.log('Cleaning previously seeded demo records...');
  const allDocIds = doctorProfiles.map((d) => d._id);
  const allPatientIds = demoPatientProfiles.map((p) => p._id);

  // 3. Define Prescriptions for Demo Patient (Ananya Verma)
  const patientPrescriptionsData = [
    {
      diagnosis: 'Acute Bronchospasm & Rhinopharyngitis',
      daysAgo: 2,
      medicines: [
        {
          medicineName: 'Amoxicillin + Clavulanic Acid 625mg',
          name: 'Augmentin 625 Duo',
          dosage: '1 tablet (625mg)',
          frequency: 'Twice daily',
          duration: '5 days',
          instructions: 'After breakfast and after dinner',
          timing: 'after_food',
        },
        {
          medicineName: 'Montelukast + Levocetirizine',
          name: 'Montair-LC',
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: '10 days',
          instructions: 'At bedtime with water',
          timing: 'night',
        },
        {
          medicineName: 'Paracetamol 650mg',
          name: 'Dolo 650',
          dosage: '1 tablet',
          frequency: 'Thrice daily as needed',
          duration: '3 days',
          instructions: 'Take only if fever > 100°F or body aches',
          timing: 'after_food',
        },
        {
          medicineName: 'Salbutamol Inhaler 100mcg',
          name: 'Asthalin Inhaler',
          dosage: '2 puffs',
          frequency: 'As needed (SOS)',
          duration: '15 days',
          instructions: 'Use spacer if available; rinse mouth after use',
          timing: 'after_food',
        },
      ],
      notes: 'Avoid cold beverages. Complete full 5-day antibiotic course. Review if cough persists beyond 7 days.',
    },
    {
      diagnosis: 'Mild Sinus Tachycardia & Nutritional Fatigue',
      daysAgo: 14,
      medicines: [
        {
          medicineName: 'Propranolol 20mg',
          name: 'Ciplar-LA 20',
          dosage: '1 tablet (20mg)',
          frequency: 'Twice daily',
          duration: '14 days',
          instructions: 'After breakfast and after dinner',
          timing: 'after_food',
        },
        {
          medicineName: 'Methylcobalamin + Alpha Lipoic Acid',
          name: 'Nurokind-Plus RF',
          dosage: '1 capsule',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'Morning after food',
          timing: 'morning',
        },
        {
          medicineName: 'Cholecalciferol (Vitamin D3) 60,000 IU',
          name: 'Uprise-D3 60K',
          dosage: '1 capsule weekly',
          frequency: 'Once a week (every Sunday)',
          duration: '8 weeks',
          instructions: 'Take with whole milk after Sunday breakfast',
          timing: 'after_food',
        },
      ],
      notes: 'Monitor resting heart rate morning and evening. Target resting HR: 65-80 bpm.',
    },
    {
      diagnosis: 'GERD & Non-Ulcer Dyspepsia',
      daysAgo: 35,
      medicines: [
        {
          medicineName: 'Pantoprazole 40mg',
          name: 'Pan 40',
          dosage: '1 tablet (40mg)',
          frequency: 'Once daily',
          duration: '15 days',
          instructions: '30 minutes before breakfast on empty stomach',
          timing: 'before_food',
        },
        {
          medicineName: 'Domperidone 10mg',
          name: 'Motinorm 10mg',
          dosage: '1 tablet',
          frequency: 'Twice daily',
          duration: '10 days',
          instructions: '15 minutes before lunch and dinner',
          timing: 'before_food',
        },
        {
          medicineName: 'Magaldrate + Simethicone Oral Gel',
          name: 'Gelusil MPS',
          dosage: '2 teaspoons (10ml)',
          frequency: 'Thrice daily',
          duration: '7 days',
          instructions: 'After meals and at bedtime',
          timing: 'after_food',
        },
      ],
      notes: 'Avoid spicy and oily food. Elevate head of bed by 6 inches. No late-night heavy dinners.',
    },
    {
      diagnosis: 'Seasonal Allergic Rhinitis',
      daysAgo: 60,
      medicines: [
        {
          medicineName: 'Fexofenadine 120mg',
          name: 'Allegra 120',
          dosage: '1 tablet',
          frequency: 'Once daily',
          duration: '10 days',
          instructions: 'Evening after meals',
          timing: 'night',
        },
        {
          medicineName: 'Fluticasone Furoate Nasal Spray',
          name: 'Flomist Nasal Spray',
          dosage: '1 spray in each nostril',
          frequency: 'Once daily',
          duration: '14 days',
          instructions: 'Morning after blowing nose gently',
          timing: 'morning',
        },
      ],
      notes: 'Avoid exposure to dust and sudden temperature variations. Saline nasal rinse encouraged.',
    },
  ];

  // Seed Prescriptions for Demo Patient(s)
  for (const patientProf of demoPatientProfiles) {
    for (const rxData of patientPrescriptionsData) {
      const rxDate = new Date();
      rxDate.setDate(rxDate.getDate() - rxData.daysAgo);

      // Create consultation record
      const consultation = await Consultation.create({
        patientId: patientProf._id,
        doctorId: primaryDoc._id,
        visitDate: rxDate,
        status: 'completed',
        symptoms: ['Symptom review', 'Clinical consultation'],
        preliminaryDiagnosis: rxData.diagnosis,
        finalDiagnosis: rxData.diagnosis,
        vitalSigns: {
          bloodPressure: '122/80',
          pulseRate: 74,
          temperature: 98.4,
          oxygenSaturation: 99,
          respiratoryRate: 16,
          height: 165,
          weight: 62,
          bmi: 22.8,
        },
        clinicalNotes: `Patient attended for ${rxData.diagnosis}. Thorough systemic evaluation conducted. ${rxData.notes}`,
        followUp: {
          isRequired: rxData.daysAgo < 10,
          date: new Date(Date.now() + 7 * 86400000),
          instructions: 'Routine follow-up review',
        },
        completedAt: rxDate,
      });

      // Create completed appointment
      const appointment = await Appointment.create({
        patientId: patientProf._id,
        userId: patientProf.userId,
        doctorId: primaryDoc._id,
        appointmentDate: rxDate,
        date: rxDate,
        startTime: '10:00',
        endTime: '10:30',
        consultationFee: 600,
        consultationType: 'in-person',
        status: 'completed',
        priority: 'routine',
        reason: rxData.diagnosis,
        symptoms: [rxData.diagnosis],
      });

      // Create Prescription
      await Prescription.create({
        patientId: patientProf._id,
        doctorId: primaryDoc._id,
        consultationId: consultation._id,
        appointmentId: appointment._id,
        diagnosis: rxData.diagnosis,
        medicines: rxData.medicines,
        prescriptionDate: rxDate,
        status: 'active',
        notes: rxData.notes,
        allergiesChecked: true,
        drugInteractionsChecked: true,
      });
    }

    // Also add 1 upcoming / active appointment for Demo Patient so dashboard displays it!
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await Appointment.create({
      patientId: patientProf._id,
      userId: patientProf.userId,
      doctorId: primaryDoc._id,
      appointmentDate: tomorrow,
      date: tomorrow,
      startTime: '11:00',
      endTime: '11:30',
      consultationFee: 600,
      consultationType: 'in-person',
      status: 'confirmed',
      priority: 'routine',
      reason: 'Routine Cardiology Follow-Up & ECG Review',
      symptoms: ['Follow-up consultation', 'Resting ECG check'],
    });
  }
  console.log(`[+] Seeded ${patientPrescriptionsData.length} prescriptions and consultations for demo patient.`);

  // 4. Create Treated Patients for Demo Doctor (Dr. Rajesh Sharma)
  const treatedPatientsData = [
    {
      name: 'Ramesh Patel',
      firstName: 'Ramesh',
      lastName: 'Patel',
      email: 'ramesh.patel.demo@kushalhospitals.com',
      phone: '9876500001',
      gender: 'Male',
      dob: '1970-04-12',
      bloodGroup: 'B+',
      diagnosis: 'Essential Stage 2 Hypertension & Dyslipidemia',
      symptoms: ['Morning headache', 'Exertional dyspnea', 'Mild ankle edema'],
      vitals: { bp: '152/94', hr: 84, temp: 98.6, spo2: 97, rr: 18, wt: 79, ht: 172 },
      daysAgo: 1,
      medicines: [
        { medicineName: 'Telmisartan 40mg + Amlodipine 5mg', name: 'Telma-AM', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Morning after breakfast', timing: 'morning' },
        { medicineName: 'Atorvastatin 20mg', name: 'Atorva 20', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'At bedtime after dinner', timing: 'night' },
      ],
      notes: 'Strict low-salt DASH diet advised. 45 mins brisk walk daily. Lipid profile review after 4 weeks.',
    },
    {
      name: 'Sunita Devi',
      firstName: 'Sunita',
      lastName: 'Devi',
      email: 'sunita.devi.demo@kushalhospitals.com',
      phone: '9876500002',
      gender: 'Female',
      dob: '1976-08-20',
      bloodGroup: 'O+',
      diagnosis: 'Stable Angina Pectoris - Post-PTCA Stent Follow-up',
      symptoms: ['Occasional retrosternal tightness', 'Good effort tolerance'],
      vitals: { bp: '120/78', hr: 68, temp: 98.2, spo2: 99, rr: 15, wt: 63, ht: 158 },
      daysAgo: 3,
      medicines: [
        { medicineName: 'Aspirin 75mg + Clopidogrel 75mg', name: 'Clopilet-A 75', dosage: '1 capsule', frequency: 'Once daily', duration: '30 days', instructions: 'After lunch with full glass of water', timing: 'after_food' },
        { medicineName: 'Metoprolol Succinate 50mg', name: 'Betaloc 50', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Morning with food', timing: 'morning' },
        { medicineName: 'Rosuvastatin 20mg', name: 'Rosuvas 20', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Night at bedtime', timing: 'night' },
      ],
      notes: 'Stent widely patent on clinical evaluation. Dual antiplatelet therapy to continue for 12 months minimum.',
    },
    {
      name: 'Vikram Malhotra',
      firstName: 'Vikram',
      lastName: 'Malhotra',
      email: 'vikram.malhotra.demo@kushalhospitals.com',
      phone: '9876500003',
      gender: 'Male',
      dob: '1962-11-05',
      bloodGroup: 'A+',
      diagnosis: 'Congestive Heart Failure (NYHA Class II) & Type 2 Diabetes',
      symptoms: ['Orthopnea absent', 'Mild bilateral leg swelling', 'Fatigue on stairs'],
      vitals: { bp: '128/82', hr: 74, temp: 98.4, spo2: 98, rr: 16, wt: 83, ht: 175 },
      daysAgo: 5,
      medicines: [
        { medicineName: 'Sacubitril 24mg + Valsartan 26mg', name: 'Vymada 50mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days', instructions: '12 hours apart', timing: 'after_food' },
        { medicineName: 'Dapagliflozin 10mg', name: 'Forxiga 10mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Morning before breakfast', timing: 'morning' },
        { medicineName: 'Torsemide 10mg', name: 'Dytor 10', dosage: '1 tablet', frequency: 'Once daily in morning', duration: '15 days', instructions: 'Early morning to prevent nocturia', timing: 'morning' },
      ],
      notes: 'Fluid intake restricted to 1.5 L/day. Daily morning weight tracking required. Electrolyte panel normal.',
    },
    {
      name: 'Priya Nair',
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya.nair.demo@kushalhospitals.com',
      phone: '9876500004',
      gender: 'Female',
      dob: '1991-03-18',
      bloodGroup: 'AB+',
      diagnosis: 'Paroxysmal Supraventricular Tachycardia (Resolved)',
      symptoms: ['Sudden racing heartbeat episodes', 'Dizziness', 'Anxiety'],
      vitals: { bp: '114/72', hr: 72, temp: 98.5, spo2: 99, rr: 14, wt: 56, ht: 162 },
      daysAgo: 8,
      medicines: [
        { medicineName: 'Verapamil 40mg', name: 'Calaptin 40', dosage: '1 tablet', frequency: 'Twice daily', duration: '20 days', instructions: 'With meals', timing: 'after_food' },
        { medicineName: 'Magnesium Glycinate 400mg', name: 'Mag Glycinate', dosage: '1 tablet', frequency: 'At bedtime', duration: '30 days', instructions: 'Night with warm water', timing: 'night' },
      ],
      notes: 'Valsalva maneuver demonstrated. Avoid caffeine, energy drinks, and sleep deprivation. Normal 2D Echo.',
    },
    {
      name: 'Amitav Ghosh',
      firstName: 'Amitav',
      lastName: 'Ghosh',
      email: 'amitav.ghosh.demo@kushalhospitals.com',
      phone: '9876500005',
      gender: 'Male',
      dob: '1965-07-29',
      bloodGroup: 'O-',
      diagnosis: 'Coronary Artery Disease & Peripheral Vascular Disease',
      symptoms: ['Calf claudication after 300 meters', 'Exertional chest heaviness'],
      vitals: { bp: '138/86', hr: 80, temp: 98.7, spo2: 97, rr: 17, wt: 76, ht: 168 },
      daysAgo: 12,
      medicines: [
        { medicineName: 'Cilostazol 100mg', name: 'Pletoz 100', dosage: '1 tablet', frequency: 'Twice daily', duration: '30 days', instructions: '30 mins before breakfast and dinner', timing: 'before_food' },
        { medicineName: 'Atorvastatin 40mg', name: 'Atorva 40', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Night at bedtime', timing: 'night' },
        { medicineName: 'Ramipril 5mg', name: 'Cardace 5mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Morning after food', timing: 'morning' },
      ],
      notes: 'Supervised treadmill exercise program recommended. Absolute smoking cessation reiterated.',
    },
    {
      name: 'Neha Sengupta',
      firstName: 'Neha',
      lastName: 'Sengupta',
      email: 'neha.sengupta.demo@kushalhospitals.com',
      phone: '9876500006',
      gender: 'Female',
      dob: '1983-09-14',
      bloodGroup: 'B-',
      diagnosis: 'Cardiac Anxiety & Hyperdynamic Precordium',
      symptoms: ['Chest awareness', 'Somatic anxiety', 'Intermittent breathlessness'],
      vitals: { bp: '118/76', hr: 75, temp: 98.3, spo2: 100, rr: 15, wt: 59, ht: 164 },
      daysAgo: 0, // Treated TODAY!
      medicines: [
        { medicineName: 'Propranolol 10mg', name: 'Ciplar 10', dosage: '1 tablet', frequency: 'As needed (SOS)', duration: '15 days', instructions: 'Take 30 mins before anticipated stressful events', timing: 'after_food' },
        { medicineName: 'Escitalopram 5mg', name: 'Nexito 5mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Morning after breakfast', timing: 'morning' },
      ],
      notes: 'Reassured patient regarding cardiac health. 2D Echo completely normal (EF 64%). Advised yoga & breathing exercises.',
    },
    {
      name: 'Harpreet Singh',
      firstName: 'Harpreet',
      lastName: 'Singh',
      email: 'harpreet.singh.demo@kushalhospitals.com',
      phone: '9876500007',
      gender: 'Male',
      dob: '1974-12-01',
      bloodGroup: 'A-',
      diagnosis: 'Sinus Bradycardia Under Evaluation',
      symptoms: ['Resting HR 52 bpm', 'Occasional presyncope', 'Athletic heart'],
      vitals: { bp: '124/80', hr: 54, temp: 98.4, spo2: 99, rr: 14, wt: 81, ht: 180 },
      daysAgo: 0, // Today's pending/confirmed appointment
      isUpcomingToday: true,
      notes: '24-hour Holter monitoring in progress. Reviewing report this afternoon.',
    },
  ];

  for (const docProf of doctorProfiles) {
    for (const pData of treatedPatientsData) {
      // Find or create User
      let pUser = await User.findOne({ email: pData.email });
      if (!pUser) {
        pUser = new User({
          name: pData.name,
          firstName: pData.firstName,
          lastName: pData.lastName,
          email: pData.email,
          password: 'Patient@123456',
          phone: pData.phone,
          role: 'patient',
          isVerified: true,
          status: 'active',
        });
        await pUser.save();
      }

      // Find or create Patient
      let pat = await Patient.findOne({ userId: pUser._id });
      if (!pat) {
        pat = await Patient.create({
          userId: pUser._id,
          gender: pData.gender,
          dateOfBirth: new Date(pData.dob),
          bloodGroup: pData.bloodGroup,
          allergies: [{ allergen: 'Sulfa drugs', severity: 'mild', reaction: 'Mild pruritus' }],
          chronicDiseases: [{ disease: pData.diagnosis, diagnosisDate: new Date('2022-01-01'), status: 'active' }],
          emergencyContact: { name: `${pData.lastName} Next of Kin`, relationship: 'Spouse', phone: '9876599999' },
        });
      }

      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() - pData.daysAgo);

      if (pData.isUpcomingToday) {
        // Today's upcoming confirmed appointment
        await Appointment.create({
          patientId: pat._id,
          userId: pUser._id,
          doctorId: docProf._id,
          appointmentDate: new Date(),
          date: new Date(),
          startTime: '15:00',
          endTime: '15:30',
          consultationFee: 600,
          consultationType: 'in-person',
          status: 'confirmed',
          priority: 'urgent',
          reason: pData.diagnosis,
          symptoms: pData.symptoms,
          notes: pData.notes,
        });
        console.log(`[+] Created today's confirmed appointment for ${pData.name}`);
      } else {
        // Completed Appointment
        const appt = await Appointment.create({
          patientId: pat._id,
          userId: pUser._id,
          doctorId: docProf._id,
          appointmentDate,
          date: appointmentDate,
          startTime: '11:00',
          endTime: '11:30',
          consultationFee: 600,
          consultationType: 'in-person',
          status: 'completed',
          priority: 'routine',
          reason: pData.diagnosis,
          symptoms: pData.symptoms,
        });

        // Completed Consultation
        const consult = await Consultation.create({
          appointmentId: appt._id,
          patientId: pat._id,
          doctorId: docProf._id,
          visitDate: appointmentDate,
          status: 'completed',
          symptoms: pData.symptoms,
          preliminaryDiagnosis: pData.diagnosis,
          finalDiagnosis: pData.diagnosis,
          vitalSigns: {
            bloodPressure: pData.vitals.bp,
            pulseRate: pData.vitals.hr,
            temperature: pData.vitals.temp,
            oxygenSaturation: pData.vitals.spo2,
            respiratoryRate: pData.vitals.rr,
            weight: pData.vitals.wt,
            height: pData.vitals.ht,
            bmi: +(pData.vitals.wt / ((pData.vitals.ht / 100) ** 2)).toFixed(1),
          },
          clinicalNotes: pData.notes,
          followUp: {
            isRequired: true,
            date: new Date(Date.now() + 14 * 86400000),
            instructions: 'Re-evaluation & clinical response assessment in 2 weeks',
          },
          completedAt: appointmentDate,
        });

        // Prescription
        if (pData.medicines && pData.medicines.length > 0) {
          await Prescription.create({
            patientId: pat._id,
            doctorId: docProf._id,
            consultationId: consult._id,
            appointmentId: appt._id,
            diagnosis: pData.diagnosis,
            medicines: pData.medicines,
            prescriptionDate: appointmentDate,
            status: 'active',
            notes: pData.notes,
            allergiesChecked: true,
            drugInteractionsChecked: true,
          });
        }
        console.log(`[+] Created treated patient record for ${pData.name} (${pData.diagnosis})`);
      }
    }
  }

  console.log('\n--- Demo Data Seeding Summary ---');
  const totalPrescriptions = await Prescription.countDocuments();
  const totalConsultations = await Consultation.countDocuments();
  const totalAppointments = await Appointment.countDocuments();
  const totalPatients = await Patient.countDocuments();
  console.log(`Total Prescriptions in DB: ${totalPrescriptions}`);
  console.log(`Total Consultations in DB: ${totalConsultations}`);
  console.log(`Total Appointments in DB:  ${totalAppointments}`);
  console.log(`Total Patients in DB:      ${totalPatients}`);

  await mongoose.connection.close();
  console.log('\nDemo patient and doctor data seeded successfully!');
  process.exit(0);
}

seedDemoData().catch((err) => {
  console.error('Seed demo data error:', err);
  process.exit(1);
});
