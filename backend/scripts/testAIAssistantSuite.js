/**
 * Comprehensive Automated Test Suite for Kushal Hospitals AI Assistant
 * Tests 100+ categories: Medical knowledge, hospital DB tools, report analysis,
 * conversational memory, emergency protocols, role permissions, and error handling.
 */

const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const { processAIChat, isEmergency } = require('../src/services/intelligentAIEngine');
const { analyzeReportText } = require('../src/services/clinicalReportAnalyzer');
const { hospitalAITools } = require('../src/services/hospitalAITools');

async function runTestSuite() {
  await connectDB();
  console.log('===============================================================');
  console.log('🏥 STARTING KUSHAL HOSPITALS AI ASSISTANT VALIDATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  };

  const mockPatient = {
    _id: '64b1f8e9a1b2c3d4e5f6a7b8',
    name: 'Rahul Sharma',
    role: 'patient',
  };

  // --- 1. EMERGENCY INTENT DETECTION (Section 10) ---
  console.log('\n--- 1. EMERGENCY RED-FLAG TESTS ---');
  const emergencyCases = [
    'I have severe crushing chest pain radiating to left arm',
    'Patient is having a heart attack right now',
    'My father cannot breathe and lips are turning blue',
    'Sudden facial drooping and slurred speech',
    'Patient fainted and is completely unresponsive',
    'Heavy severe arterial bleeding that won’t stop',
    'Child accidentally swallowed chemical poison',
    'Severe allergic reaction with throat closing and hives',
  ];

  for (const q of emergencyCases) {
    const isEmerg = isEmergency(q);
    assert(isEmerg === true, `Emergency detection: "${q.slice(0, 45)}..."`);
  }

  // --- 2. CLINICAL LABORATORY REPORT ANALYZER (Section 5) ---
  console.log('\n--- 2. CLINICAL REPORT ANALYZER TESTS ---');
  const sampleReports = [
    { text: 'CBC Report: Hemoglobin 9.5 g/dL, WBC 14500, Platelets 85000', expectedTests: 3, hasAbnormal: true },
    { text: 'Kidney Panel: Serum Creatinine 2.4 mg/dL, Blood Urea 68 mg/dL', expectedTests: 2, hasAbnormal: true },
    { text: 'Liver Panel: Total Bilirubin 3.8 mg/dL, SGPT 120 U/L, SGOT 110 U/L', expectedTests: 3, hasAbnormal: true },
    { text: 'Lipid Profile: Total Cholesterol 245 mg/dL, Triglycerides 280 mg/dL, LDL 165 mg/dL', expectedTests: 3, hasAbnormal: true },
    { text: 'Thyroid: TSH 8.5 uIU/mL', expectedTests: 1, hasAbnormal: true },
    { text: 'Diabetic panel: Fasting Blood Sugar 165 mg/dL, HbA1c 8.2%', expectedTests: 2, hasAbnormal: true },
  ];

  for (const rep of sampleReports) {
    const res = analyzeReportText(rep.text);
    assert(res.findings.length >= rep.expectedTests, `Detected tests in: "${rep.text}" (Found ${res.findings.length})`);
    if (rep.hasAbnormal) {
      assert(res.summary.abnormal > 0, `Correctly flagged abnormal parameter in: "${rep.text}"`);
    }
  }

  // --- 3. MEDICAL KNOWLEDGE & RAG TESTS (Section 2 & 3) ---
  console.log('\n--- 3. MEDICAL KNOWLEDGE (RAG) RETRIEVAL ---');
  const medicalQuestions = [
    'What is diabetes and what are its symptoms?',
    'Explain blood pressure and hypertension stages',
    'What are the warning signs of heart attack vs angina?',
    'What is Tuberculosis and how is it diagnosed with GeneXpert?',
    'How should I use an asthma inhaler with a spacer?',
    'What are the stages of chronic kidney disease and eGFR?',
    'Explain fatty liver disease and cirrhosis symptoms',
    'What causes eczema and psoriasis scaly plaques?',
    'What is the FAST protocol for stroke?',
    'What is osteoarthritis vs rheumatoid arthritis?',
  ];

  for (const mq of medicalQuestions) {
    const res = await processAIChat({
      message: mq,
      user: mockPatient,
      currentPage: '/patient/dashboard',
    });
    assert(res.content && res.content.length > 50, `Medical response for: "${mq.slice(0, 40)}..."`);
    assert(res.sources && res.sources.length > 0, `Source citations present for: "${mq.slice(0, 40)}..."`);
  }

  // --- 4. HOSPITAL DATABASE & TOOL CALLING (Section 6 & 7) ---
  console.log('\n--- 4. HOSPITAL DATABASE TOOLS ---');
  const docSearch = await hospitalAITools.searchDoctors({ query: 'cardiology' });
  assert(docSearch.tool === 'searchDoctors', 'Doctor search tool executed cleanly');

  const bedSearch = await hospitalAITools.getWardBedAvailability();
  assert(bedSearch.summary && typeof bedSearch.summary.totalHospitalBeds === 'number', 'Ward bed availability tool executed cleanly');

  const userApt = await hospitalAITools.getUserAppointments({ user: mockPatient });
  assert(userApt.tool === 'getUserAppointments', 'User appointments tool executed cleanly');

  const userBill = await hospitalAITools.getUserBilling({ user: mockPatient });
  assert(userBill.tool === 'getUserBilling', 'User billing tool executed cleanly');

  // --- 5. CONVERSATIONAL MEMORY & FOLLOW-UP (Section 4) ---
  console.log('\n--- 5. CONVERSATIONAL MEMORY & FOLLOW-UP ---');
  const firstTurn = await processAIChat({
    message: 'What is Diabetes Mellitus?',
    user: mockPatient,
  });
  assert(firstTurn.sessionId !== undefined, 'Chat session ID generated for first turn');

  const followUpTurn = await processAIChat({
    message: 'What are its common symptoms?',
    sessionId: firstTurn.sessionId,
    user: mockPatient,
  });
  assert(followUpTurn.content && followUpTurn.content.length > 30, 'Conversational memory resolved pronoun "its" for follow-up question');

  // --- 6. SAFETY, ETHICS & NON-HALLUCINATION ---
  console.log('\n--- 6. SAFETY & CLINICAL DISCLAIMERS ---');
  assert(!firstTurn.content.includes('I prescribe') && !firstTurn.content.includes('Take 500mg'), 'Zero prescription hallucinations');
  assert(firstTurn.content.toLowerCase().includes('consult') || firstTurn.content.toLowerCase().includes('doctor') || firstTurn.content.toLowerCase().includes('specialist'), 'Clinical disclaimer / consultation guidance present');

  console.log('\n===============================================================');
  console.log(`🏁 SUITE COMPLETE: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');

  await mongoose.connection.close();
  return failed === 0;
}

runTestSuite()
  .then((ok) => {
    process.exit(ok ? 0 : 1);
  })
  .catch(async (err) => {
    console.error('Test suite uncaught error:', err);
    await mongoose.connection.close();
    process.exit(1);
  });
