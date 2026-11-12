const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const MedicalKnowledge = require('../models/MedicalKnowledge');
const { comprehensiveKnowledgeBase } = require('./seedComprehensiveMedicalKnowledge');

const documents = [
  {
    sourceId: 'HMS-CLINICAL-SAFETY-FEVER-001',
    version: '1.0',
    title: 'Fever symptom safety guidance',
    category: 'symptom',
    content: 'Fever is a symptom that can occur with many conditions. This document provides safety guidance only and does not diagnose illness.',
    symptoms: ['fever', 'high temperature', 'chills'],
    precautions: ['Rest and drink fluids if able', 'Monitor temperature and changes in symptoms', 'Arrange a qualified clinician review if symptoms persist or worsen'],
    warnings: ['Seek urgent care for difficulty breathing, confusion, fainting, severe dehydration, seizure, or rapidly worsening symptoms'],
    approved: true,
  },
  {
    sourceId: 'HMS-CLINICAL-SAFETY-RESPIRATORY-001',
    version: '1.0',
    title: 'Cough and sore throat symptom safety guidance',
    category: 'symptom',
    content: 'Cough and sore throat can occur with several conditions. This document provides general safety guidance only and does not diagnose illness.',
    symptoms: ['cough', 'sore throat', 'fever', 'congestion'],
    precautions: ['Rest and drink fluids if able', 'Avoid close contact when unwell and follow current hospital infection-control guidance', 'Arrange a qualified clinician review if symptoms persist or worsen'],
    warnings: ['Seek urgent care for difficulty breathing, blue lips, chest pain, confusion, or rapidly worsening symptoms'],
    approved: true,
  },
  {
    sourceId: 'HMS-CLINICAL-SAFETY-EMERGENCY-001',
    version: '1.0',
    title: 'Emergency warning signs',
    category: 'education',
    content: 'Certain symptoms need immediate emergency assessment. This document is a safety escalation guide and is not a diagnosis.',
    symptoms: ['chest pain', 'difficulty breathing', 'fainting', 'face drooping', 'severe bleeding'],
    precautions: ['Call the local emergency number or use the Emergency Ambulance workflow in the hospital application', 'Do not drive yourself when severely unwell'],
    warnings: ['Immediate emergency assessment is required for these warning signs'],
    approved: true,
  },
  {
    sourceId: 'HMS-CLINICAL-SAFETY-HEADACHE-001',
    version: '1.0',
    title: 'Headache and dizziness symptom safety guidance',
    category: 'symptom',
    content: 'Headache and dizziness have many possible causes. This document provides safety guidance only and does not diagnose illness.',
    symptoms: ['headache', 'dizziness', 'nausea'],
    precautions: ['Rest and hydrate if able', 'Avoid driving or operating machinery while dizzy', 'Arrange a qualified clinician review if symptoms persist or worsen'],
    warnings: ['Seek urgent care for a sudden severe headache, fainting, weakness, confusion, vision loss, or difficulty speaking'],
    approved: true,
  },
  {
    sourceId: 'HMS-CLINICAL-SAFETY-ITCHING-RASH-001',
    version: '1.0',
    title: 'Itching and rash symptom safety guidance',
    category: 'symptom',
    content: 'Itching or a rash can have many causes, including irritation, allergy, insect bites, infection, or other skin conditions. This document provides general safety guidance only and does not diagnose illness.',
    symptoms: ['itch', 'itching', 'itches', 'itchy', 'rash', 'skin irritation', 'redness', 'allergy'],
    precautions: ['Avoid scratching and stop using any newly introduced skin product if it may be irritating', 'Keep the area clean and note new foods, medicines, soaps, detergents, or insect exposure', 'Arrange a qualified clinician or pharmacist review if symptoms persist, spread, or recur'],
    warnings: ['Seek urgent care for trouble breathing, swelling of the lips or tongue, fainting, rapidly spreading rash, blistering or peeling skin, high fever, or severe pain'],
    approved: true,
  },
  {
    sourceId: 'HMS-APPLICATION-APPOINTMENTS-001',
    version: '1.0',
    title: 'Appointment booking and availability',
    category: 'faq',
    content: 'Patients can browse active doctors, filter by specialization, choose a future date, view verified appointment slots, and submit a booking. Slot availability is checked against doctor schedules and existing appointments. Patients can review upcoming appointments and use supported cancellation, rescheduling, review, and video consultation workflows.',
    symptoms: [],
    precautions: ['Confirm the doctor, date, time, patient details, consultation reason, and payment method before booking', 'A booking is only confirmed after the backend successfully creates it'],
    warnings: ['Do not treat a chat response as a booking confirmation unless the hospital system confirms the appointment'],
    approved: true,
  },
  {
    sourceId: 'HMS-APPLICATION-PAYMENTS-001',
    version: '1.0',
    title: 'Appointment payments and cash bookings',
    category: 'faq',
    content: 'The appointment workflow supports online payment when the configured gateway is available and pay-at-hospital cash booking. Online payments require backend verification. Cash bookings remain unpaid until hospital staff record payment. Invoice and payment status are shown only from authorized hospital billing records.',
    symptoms: [],
    precautions: ['Use the payment status shown in the hospital account', 'Contact hospital staff if a payment is processing or a receipt is missing'],
    warnings: ['A browser callback alone does not prove that an online payment succeeded'],
    approved: true,
  },
  {
    sourceId: 'HMS-APPLICATION-RECORDS-PRIVACY-001',
    version: '1.0',
    title: 'Patient records and privacy',
    category: 'policy',
    content: 'The assistant can summarize authorized patient profile, medical record, prescription, laboratory, appointment, and billing data when those records exist. A patient can access only their own records; staff access depends on their hospital role and authorization.',
    symptoms: [],
    precautions: ['Ask the patient to sign in before requesting personal records', 'Use a qualified clinician for interpretation of diagnoses, prescriptions, or laboratory results'],
    warnings: ['The assistant must not reveal another patient’s records or invent missing clinical data'],
    approved: true,
  },
  {
    sourceId: 'HMS-APPLICATION-PHARMACY-001',
    version: '1.0',
    title: 'Pharmacy inventory and prescriptions',
    category: 'faq',
    content: 'Authorized pharmacy workflows can show recorded prescriptions and medicine inventory details such as medicine name, type, strength, batch, stock quantity, selling price, supplier information, and expiry alerts. Medication instructions should be confirmed with the prescribing clinician or pharmacist.',
    symptoms: [],
    precautions: ['Check medicine name, strength, batch, expiry, and stock against the recorded inventory', 'Consult the prescribing clinician or pharmacist before changing medication'],
    warnings: ['Inventory information is not a prescription and does not replace professional medication advice'],
    approved: true,
  },
  {
    sourceId: 'HMS-APPLICATION-EMERGENCY-001',
    version: '1.0',
    title: 'Emergency ambulance workflow',
    category: 'faq',
    content: 'The Emergency Ambulance workflow accepts emergency type, patient contact, pickup location, priority, and optional drop location. It checks recorded ambulance availability, submits a request, and provides a request code and tracking status when the system has created the request.',
    symptoms: [],
    precautions: ['Provide an accurate phone number and pickup location', 'For life-threatening symptoms, call local emergency services immediately and do not delay for chat'],
    warnings: ['The assistant cannot diagnose or safely manage an emergency through chat'],
    approved: true,
  },
  {
    sourceId: 'HMS-APPLICATION-WARDS-001',
    version: '1.0',
    title: 'Beds and wards availability',
    category: 'faq',
    content: 'Bed and ward information reports current recorded ward capacity and bed statuses such as available, occupied, reserved, and maintenance. Availability can change and should be confirmed by hospital admission staff before an admission decision.',
    symptoms: [],
    precautions: ['Treat the displayed availability as current system data, not a reservation', 'Contact admission staff to confirm allocation'],
    warnings: ['The assistant must not promise a bed unless an authorized hospital workflow confirms it'],
    approved: true,
  },
];

const seed = async () => {
  await connectDB();
  const allDocs = [...documents, ...comprehensiveKnowledgeBase];
  for (const document of allDocs) {
    await MedicalKnowledge.updateOne({ sourceId: document.sourceId }, { $set: document }, { upsert: true });
  }
  console.log(`Medical knowledge seed complete: ${allDocs.length} approved documents`);
  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error('Medical knowledge seed failed:', error.message);
  await mongoose.connection.close();
  process.exitCode = 1;
});
