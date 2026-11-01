const crypto = require('node:crypto');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Billing = require('../models/Billing');
const LabTest = require('../models/LabTest');
const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');
const EMR = require('../models/EMR');
const { Ward, Bed } = require('../models/Ward');
const MedicalKnowledge = require('../models/MedicalKnowledge');
const AIChatAudit = require('../models/AIChatAudit');

const NO_DATA_MESSAGE = 'No relevant data is available in the hospital system for this request. Please update the required information in the system or contact our hospital/team for assistance.';
const UNSUPPORTED_MESSAGE = 'I can only answer questions related to this hospital system, authorized hospital records, or approved medical knowledge.';
const AGENTS = {
  patient: 'patient-agent', doctor: 'doctor-agent', appointment: 'appointment-agent', billing: 'billing-agent',
  pharmacy: 'pharmacy-agent', laboratory: 'lab-agent', bed: 'bed-agent', inventory: 'inventory-agent',
  symptom: 'medical-rag-agent', feature: 'application-agent', unsupported: 'safety-agent',
};

const APPLICATION_FEATURES = [
  ['dashboard', 'The dashboard shows role-based appointments, alerts, completion metrics, and hospital capacity information.'],
  ['appointment', 'Appointments supports doctor selection, date and slot selection, verified availability, booking, reminders, cancellation, rescheduling, reviews, and video consultation links.'],
  ['doctor', 'Doctors Directory lists active doctors, specializations, ratings, reviews, and appointment booking.'],
  ['emergency', 'Emergency Ambulance captures pickup coordinates, checks availability, submits requests, and provides request tracking.'],
  ['record', 'Medical Records provides authorized EMR information, diagnoses, investigations, treatment, and follow-up data.'],
  ['billing', 'Billing provides authorized invoices, bill status, payment details, and insurance information when recorded. Online payment confirmation is verified by the backend; cash or pay-at-hospital bookings remain unpaid until staff record collection.'],
  ['pharmacy', 'Pharmacy data supports authorized prescriptions and medicine inventory information, including stock, batches, prices, and expiry alerts when recorded.'],
  ['laboratory', 'Laboratory data supports authorized test status and recorded results.'],
  ['bed', 'Bed and ward information provides current availability and ward capacity when recorded.'],
  ['profile', 'Profile provides the authenticated user account information.'],
  ['payment methods', 'Appointment payment supports online checkout when configured and pay-at-hospital cash booking. The final amount is based on the verified consultation fee and recorded billing data.'],
  ['privacy', 'Patient records are restricted to the authenticated patient or authorized hospital staff. The assistant does not disclose another patient’s private medical information.'],
  ['medical guidance', 'Symptom responses provide approved safety guidance only, do not diagnose from chat, and recommend urgent care for emergency warning signs.'],
  ['receipt', 'Confirmed appointment and payment details can be reviewed from the relevant hospital workflow when the record exists.'],
];

const normalize = (value) => String(value || '').trim().toLowerCase();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasAny = (text, terms) => terms.some((term) => {
  const normalizedTerm = normalize(term);
  if (!normalizedTerm) return false;
  if (normalizedTerm.includes(' ')) return text.includes(normalizedTerm);
  return new RegExp(`\\b${escapeRegex(normalizedTerm)}(?:s|es)?\\b`, 'i').test(text);
});
const hasCountIntent = (text) => hasAny(text, ['how many', 'count', 'total', 'number of']);
const hasAvailabilityIntent = (text) => hasAny(text, ['available', 'availability', 'free', 'vacant']);
const SYMPTOM_TERMS = [
  'symptom', 'fever', 'cough', 'pain', 'ache', 'itch', 'itching', 'rash',
  'skin irritation', 'redness', 'swelling', 'headache', 'dizziness', 'nausea',
  'vomiting', 'diarrhea', 'constipation', 'sore throat', 'runny nose',
  'congestion', 'fatigue', 'weakness', 'burning', 'bleeding', 'breathing',
  'shortness of breath', 'allergy', 'allergic reaction', 'precaution',
];
const isEmergencySymptom = (text) => hasAny(text, [
  'chest pain', 'heart pain', 'difficulty breathing', 'shortness of breath',
  'cannot breathe', 'fainted', 'unconscious', 'stroke', 'face drooping',
  'slurred speech', 'severe bleeding', 'heavy bleeding', 'seizure',
  'overdose', 'suicidal', 'severe allergic reaction',
]);

const parseTimeToMinutes = (value) => {
  const match = String(value || '').match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const getRequestedDay = (text, date = new Date()) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const requested = days.find((day) => text.includes(day));
  if (requested) return requested[0].toUpperCase() + requested.slice(1);
  if (hasAny(text, ['today', 'now', 'currently'])) return days[date.getDay()][0].toUpperCase() + days[date.getDay()].slice(1);
  if (text.includes('tomorrow')) {
    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);
    return days[tomorrow.getDay()][0].toUpperCase() + days[tomorrow.getDay()].slice(1);
  }
  return null;
};

const getRequestedTime = (text) => {
  const times = [...text.matchAll(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi)]
    .map((match) => parseTimeToMinutes(match[0]))
    .filter((time) => time !== null);
  return times.length ? { start: Math.min(...times), end: Math.max(...times) } : null;
};

const isScheduleMatch = (doctor, day, requestedTime) => {
  const schedules = doctor.availability?.length
    ? doctor.availability
    : (doctor.availableSlots?.startTime ? [{ day, startTime: doctor.availableSlots.startTime, endTime: doctor.availableSlots.endTime }] : []);
  return schedules.some((schedule) => {
    if (day && schedule.day !== day) return false;
    if (!requestedTime) return true;
    const start = parseTimeToMinutes(schedule.startTime);
    const end = parseTimeToMinutes(schedule.endTime);
    return start !== null && end !== null && start <= requestedTime.start && end >= requestedTime.end;
  });
};

const getDoctorAvailability = async (question) => {
  const text = normalize(question);
  const day = getRequestedDay(text);
  const requestedTime = getRequestedTime(text);
  const requestedDate = new Date();
  if (text.includes('tomorrow')) requestedDate.setDate(requestedDate.getDate() + 1);
  if (day && !text.includes('today') && !text.includes('tomorrow')) {
    const targetDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
    const daysAhead = (targetDay - requestedDate.getDay() + 7) % 7;
    requestedDate.setDate(requestedDate.getDate() + daysAhead);
  }
  const specialtyTerms = ['cardiology', 'neurology', 'orthopedics', 'dermatology', 'ent', 'pediatrics', 'gynecology', 'psychiatry', 'oncology', 'radiology', 'pathology', 'general surgery', 'general physician'];
  const specialty = specialtyTerms.find((term) => text.includes(term));
  const nameTerm = text.match(/\bdr\.?\s+[a-z]+(?:\s+[a-z]+)?/i)?.[0];
  const doctorQuery = { isActive: true };
  if (specialty) doctorQuery.specialization = new RegExp(`^${escapeRegex(specialty)}$`, 'i');
  const doctors = await Doctor.find(doctorQuery).populate('userId', 'name firstName lastName').lean();
  const filtered = doctors.filter((doctor) => {
    const name = normalize(formatDoctor(doctor));
    return (!nameTerm || name.includes(normalize(nameTerm.replace(/^dr\.?\s*/i, '')))) && isScheduleMatch(doctor, day, requestedTime);
  });

  if (!day || !requestedTime || filtered.length === 0) {
    return { items: filtered, verifiedSlots: false, day, requestedTime };
  }

  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const appointments = await Appointment.find({
    doctorId: { $in: filtered.map((doctor) => doctor._id) },
    appointmentDate: { $gte: startOfDay, $lt: endOfDay },
    status: { $nin: ['cancelled', 'completed', 'no-show'] },
  }).select('doctorId startTime endTime').lean();
  const available = filtered.filter((doctor) => !appointments.some((appointment) => {
    if (String(appointment.doctorId) !== String(doctor._id)) return false;
    const appointmentStart = parseTimeToMinutes(appointment.startTime);
    const appointmentEnd = parseTimeToMinutes(appointment.endTime);
    return appointmentStart !== null && appointmentEnd !== null
      && appointmentStart <= requestedTime.start && appointmentEnd >= requestedTime.end;
  }));
  return { items: available, source: 'doctor schedules and appointment conflicts', verifiedSlots: true, day, requestedTime };
};

const detectIntent = (question) => {
  const text = normalize(question);
  if (hasAny(text, ['feature', 'what can you do', 'how does this work', 'application', 'system', 'module'])) return 'feature';
  if (hasAny(text, [...SYMPTOM_TERMS, 'disease'])) return 'symptom';
  if (hasAny(text, ['payment methods', 'pay online', 'pay at hospital', 'cash payment', 'how to book', 'how can i book', 'how do i cancel', 'how do i reschedule'])) return 'feature';
  if (hasAny(text, ['bill', 'billing', 'invoice', 'payment', 'insurance', 'charge'])) return 'billing';
  if (hasAny(text, ['lab', 'laboratory', 'test result', 'report'])) return 'laboratory';
  if (hasAny(text, ['medicine', 'medication', 'pharmacy', 'prescription', 'stock'])) return 'pharmacy';
  if (hasAny(text, ['bed', 'room', 'icu', 'ward', 'admission'])) return 'bed';
  if (hasAny(text, ['inventory', 'equipment', 'consumable', 'supplies'])) return 'inventory';
  if (hasAny(text, ['appointment', 'booking', 'visit', 'schedule'])) return 'appointment';
  if (hasAny(text, ['doctor', 'specialist', 'department'])) return 'doctor';
  if (hasAny(text, ['profile', 'patient', 'medical record', 'emr', 'history', 'diagnosis'])) return 'patient';
  return 'unsupported';
};

const detectFallbackIntents = (question) => {
  const text = normalize(question);
  const intents = [];

  if (hasAny(text, ['bed', 'room', 'icu', 'ward', 'admission', 'availability', 'capacity'])) intents.push('bed');
  if (hasAny(text, ['appointment', 'booking', 'visit', 'schedule'])) intents.push('appointment');
  if (hasAny(text, ['doctor', 'specialist', 'department']) || (hasAvailabilityIntent(text) && !hasAny(text, ['bed', 'room', 'icu', 'ward']))) intents.push('doctor');
  if (hasAny(text, ['bill', 'billing', 'invoice', 'payment', 'insurance', 'charge'])) intents.push('billing');
  if (hasAny(text, ['lab', 'laboratory', 'test', 'report'])) intents.push('laboratory');
  if (hasAny(text, ['medicine', 'medication', 'pharmacy', 'prescription', 'stock'])) intents.push('pharmacy');
  if (hasAny(text, ['patient', 'profile', 'record', 'emr', 'history'])) intents.push('patient');
  if (hasAny(text, ['inventory', 'equipment', 'consumable', 'supplies'])) intents.push('inventory');

  return [...new Set(intents)];
};

const detectIntents = (question) => {
  const text = normalize(question);
  const intents = [];
  if (hasAny(text, [...SYMPTOM_TERMS, 'disease'])) intents.push('symptom');
  const operational = detectFallbackIntents(text);
  intents.push(...operational);
  return [...new Set(intents)];
};

const isStaff = (role) => ['admin', 'super_admin', 'doctor', 'nurse', 'receptionist', 'accountant', 'pharmacist', 'lab_technician'].includes(role);
const canAccess = (intent, role) => ({
  patient: ['admin', 'super_admin', 'doctor', 'nurse', 'receptionist', 'patient'].includes(role),
  doctor: isStaff(role) || role === 'patient',
  appointment: ['admin', 'super_admin', 'doctor', 'nurse', 'receptionist', 'patient'].includes(role),
  billing: ['admin', 'super_admin', 'accountant', 'receptionist', 'patient'].includes(role),
  pharmacy: ['admin', 'super_admin', 'doctor', 'pharmacist', 'patient'].includes(role),
  laboratory: ['admin', 'super_admin', 'doctor', 'nurse', 'lab_technician', 'patient'].includes(role),
  bed: ['admin', 'super_admin', 'doctor', 'nurse', 'receptionist', 'patient'].includes(role),
  inventory: ['admin', 'super_admin', 'pharmacist'].includes(role),
  symptom: ['admin', 'super_admin', 'doctor', 'nurse', 'receptionist', 'patient', 'pharmacist', 'lab_technician', 'accountant'].includes(role),
  feature: ['admin', 'super_admin', 'doctor', 'nurse', 'receptionist', 'patient', 'pharmacist', 'lab_technician', 'accountant'].includes(role),
}[intent] || false);

const resolvePatientScope = async (user) => {
  if (isStaff(user.role)) return {};
  const patient = await Patient.findOne({ userId: user._id }).select('_id').lean();
  return patient ? { patientId: patient._id } : { patientId: null };
};

const retrieveOperationalData = async (intent, user) => {
  const scope = await resolvePatientScope(user);
  if (scope.patientId === null) return { items: [], source: 'hospital database', tool: 'resolve_patient_scope' };

  const queries = {
    patient: () => Patient.find(isStaff(user.role) ? {} : { userId: user._id }).select('-documents').limit(10).lean(),
    appointment: () => Appointment.find(scope).populate({ path: 'doctorId', populate: { path: 'userId', select: 'name firstName lastName' } }).sort({ appointmentDate: -1 }).limit(20).lean(),
    billing: () => Billing.find(scope).sort({ invoiceDate: -1 }).limit(20).lean(),
    laboratory: () => LabTest.find(scope).sort({ orderDate: -1 }).limit(20).lean(),
    pharmacy: () => Prescription.find(scope).sort({ createdAt: -1 }).limit(20).lean(),
    doctor: () => Doctor.find({ isActive: true }).populate('userId', 'name firstName lastName').sort({ rating: -1 }).limit(20).lean(),
    bed: () => Ward.find({ isActive: true }).select('wardName totalBeds occupiedBeds availableBeds').lean(),
    inventory: () => Medicine.find({ isActive: true }).select('medicineName stock isActive').limit(50).lean(),
  };
  const query = queries[intent];
  if (!query) return { items: [], source: '', tool: '' };
  const items = await query();

  // Bed questions should still work when ward summary rows are missing but bed rows exist.
  if (intent === 'bed' && (!items || items.length === 0)) {
    const bedRows = await Bed.find({}).select('status wardId').lean();
    if (!bedRows.length) return { items: [], source: 'hospital database', tool: 'get_bed_data' };

    const available = bedRows.filter((row) => row.status === 'available').length;
    const occupied = bedRows.filter((row) => row.status === 'occupied').length;
    const maintenance = bedRows.filter((row) => row.status === 'maintenance').length;
    const reserved = bedRows.filter((row) => row.status === 'reserved').length;

    return {
      items: [
        {
          _id: 'bed-summary',
          wardName: 'Hospital Total',
          totalBeds: bedRows.length,
          occupiedBeds: occupied,
          availableBeds: available,
          maintenanceBeds: maintenance,
          reservedBeds: reserved,
        },
      ],
      source: 'hospital database',
      tool: 'get_bed_data',
    };
  }

  if (intent === 'patient' && !isStaff(user.role)) {
    const emr = await EMR.find({ patientId: scope.patientId }).sort({ visitDate: -1 }).limit(5).lean();
    return { items: [...items, ...emr], source: 'authorized hospital records', tool: 'get_authorized_patient_records' };
  }

  return { items, source: 'hospital database', tool: `get_${intent}_data` };
};

const retrieveRagData = async (question) => {
  const stopWords = new Set(['what', 'should', 'have', 'with', 'the', 'and', 'for', 'this', 'that', 'does']);
  const terms = normalize(question)
    .split(/\s+/)
    .map((term) => term.replace(/[^a-z0-9-]/g, ''))
    .map((term) => ({ itches: 'itch', itchy: 'itch', itching: 'itch', rashes: 'rash', aches: 'ache' }[term] || term))
    .filter((term) => term.length > 2 && !stopWords.has(term));
  if (terms.length === 0) return [];
  const matches = terms.flatMap((term) => {
    const match = new RegExp(term, 'i');
    return [{ title: match }, { content: match }, { symptoms: match }];
  });
  const documents = await MedicalKnowledge.find({ approved: true, $or: matches }).limit(5).lean();
  return documents.map((document) => ({ id: document._id.toString(), sourceId: document.sourceId, title: document.title, content: document.content, symptoms: document.symptoms, precautions: document.precautions, warnings: document.warnings, version: document.version }));
};

const formatDoctor = (doctor) => doctor?.userId?.name || `${doctor?.userId?.firstName || ''} ${doctor?.userId?.lastName || ''}`.trim() || 'Doctor';
const formatOperationalAnswer = (intent, items, question = '') => {
  const text = normalize(question);
  if (!items || items.length === 0) return '';
  if (intent === 'doctor') {
    const requestedDay = getRequestedDay(text);
    const requestedTime = getRequestedTime(text);
    const qualifier = requestedDay || requestedTime ? ` matching ${[requestedDay, requestedTime && `${requestedTime.start}-${requestedTime.end} minutes`].filter(Boolean).join(' at ')}` : '';
    return `Verified active doctors${qualifier}: ${items.map((item) => `${formatDoctor(item)} (${item.specialization})`).join(', ')}.`;
  }
  if (intent === 'appointment') return `Verified appointments found: ${items.slice(0, 5).map((item) => `${new Date(item.appointmentDate).toLocaleDateString()} with ${formatDoctor(item.doctorId)} (${item.status})`).join('; ')}.`;
  if (intent === 'billing') return `Verified billing records found: ${items.slice(0, 5).map((item) => `${item.invoiceNumber || 'invoice'} (${item.status})`).join('; ')}.`;
  if (intent === 'laboratory') return `Verified laboratory records found: ${items.slice(0, 5).map((item) => `${item.testName} (${item.status})`).join('; ')}.`;
  if (intent === 'pharmacy') return `Verified prescription records found: ${items.length}. Please consult the prescribing clinician for medication instructions.`;
  if (intent === 'bed') {
    const totalAvailable = items.reduce((sum, item) => sum + Number(item.availableBeds ?? Math.max((item.totalBeds || 0) - (item.occupiedBeds || 0), 0)), 0);
    const totalBeds = items.reduce((sum, item) => sum + Number(item.totalBeds || 0), 0);
    const details = items.map((item) => `${item.wardName}: ${item.availableBeds ?? Math.max((item.totalBeds || 0) - (item.occupiedBeds || 0), 0)} free of ${item.totalBeds || 0}`).join('; ');

    if ((hasCountIntent(text) || hasAvailabilityIntent(text)) && hasAny(text, ['today', 'now', 'currently', 'current'])) {
      return `Verified current bed availability today: ${totalAvailable} beds free out of ${totalBeds}. Ward-wise: ${details}.`;
    }

    if (hasCountIntent(text) || hasAvailabilityIntent(text)) {
      return `Verified bed availability: ${totalAvailable} beds free out of ${totalBeds}. Ward-wise: ${details}.`;
    }

    return `Verified current bed availability: ${details}.`;
  }
  if (intent === 'inventory') return `Verified inventory records found: ${items.slice(0, 8).map((item) => `${item.medicineName}: ${item.stock?.quantity ?? 'not recorded'}`).join('; ')}.`;
  if (intent === 'patient') {
    const records = items.filter((item) => item.visitDate || item.diagnosis);
    if (!records.length) return 'Verified patient information is available in your authorized hospital records.';
    const summaries = records.slice(0, 5).map((record) => {
      const diagnoses = record.diagnosis?.map((diagnosis) => diagnosis.condition).filter(Boolean).join(', ');
      const medications = record.treatment?.medications?.map((medication) => medication.name).filter(Boolean).join(', ');
      return `${new Date(record.visitDate).toLocaleDateString()}: ${diagnoses || 'diagnosis not recorded'}${medications ? `; medications: ${medications}` : ''}`;
    });
    return `Verified recent clinical records:\n\n${summaries.join('\n')}\n\nPlease consult your clinician before changing any treatment.`;
  }
  return '';
};

const formatFeatureAnswer = (question) => {
  const text = normalize(question);
  const matches = APPLICATION_FEATURES.filter(([keyword]) => text.includes(keyword));
  const selected = matches.length > 0 ? matches : APPLICATION_FEATURES;
  return `Verified HMS capabilities:\n\n${selected.map(([name, description]) => `${name}: ${description}`).join('\n')}`;
};

const formatRagAnswer = (documents) => {
  if (documents.length === 0) return '';
  const document = documents[0];
  return `Based on the approved hospital knowledge base:\n\nPossible condition or topic: ${document.title}\n\nSymptoms matched: ${document.symptoms.join(', ') || 'Not recorded'}\n\nPrecautions: ${document.precautions.join('; ') || 'Not recorded'}\n\nCaution: ${document.warnings.join('; ') || 'Not recorded'}\n\nMedical note: This information is not a confirmed diagnosis. Please consult a qualified healthcare professional.\n\nSource: ${document.sourceId} (version ${document.version})`;
};

const formatGenericSymptomAnswer = (question) => `I’m sorry you’re uncomfortable. ${question.trim()} can have several causes, so I cannot diagnose it through chat. For now, avoid scratching or using a new cream/medicine until a clinician or pharmacist advises you, keep the area clean, and note when it started and anything new such as food, medicine, soap, detergent, or an insect bite. Arrange a clinician review if it persists, spreads, keeps returning, or is severe. Seek urgent care immediately for trouble breathing, swelling of the lips or tongue, fainting, rapidly spreading rash, blistering/peeling skin, high fever, or severe pain.`;

const formatEmergencyAnswer = () => 'This may be a medical emergency. Call your local emergency number now or use the hospital Emergency Ambulance service. Do not drive yourself if you are severely unwell. If safe, unlock the door, sit or lie down, and ask someone to stay with you. I cannot diagnose or safely manage emergency symptoms through chat.';

const audit = async ({ requestId, user, question, result }) => AIChatAudit.create({
  requestId, userId: user._id, userRole: user.role, currentPage: question.currentPage || '', intent: result.intent,
  agentsUsed: ['supervisor-agent', result.agent, 'validation-agent'], toolsUsed: result.tool ? [result.tool] : [],
  dataSources: result.sources, retrievedRecordIds: result.recordIds || [], ragDocumentIds: result.ragIds || [],
  authorizationResult: result.authorized ? 'allowed' : 'denied', finalResponse: result.message,
  dataAvailable: result.dataAvailable, responseStatus: result.status,
});

const answerQuestion = async ({ question, context = {}, user }) => {
  const requestId = crypto.randomUUID();
  const query = typeof question === 'string' ? question : '';
  const intent = detectIntent(query);
  const detectedIntents = detectIntents(query);
  let result = { intent, agent: AGENTS[intent], sources: [], recordIds: [], ragIds: [], authorized: true, dataAvailable: false, status: 'success', message: NO_DATA_MESSAGE };

  if (intent === 'symptom' && isEmergencySymptom(normalize(query))) {
    result = {
      ...result,
      agent: AGENTS.symptom,
      sources: ['hospital emergency safety protocol'],
      dataAvailable: true,
      message: formatEmergencyAnswer(),
    };
  } else if (detectedIntents.length > 1 && detectedIntents.every((detected) => canAccess(detected, user.role))) {
    const sections = [];
    for (const detected of detectedIntents) {
      if (detected === 'symptom') {
        const rag = await retrieveRagData(query);
        sections.push(formatRagAnswer(rag) || 'No approved symptom guidance matched this question.');
        result.ragIds.push(...rag.map((item) => item.id));
        if (rag.length) result.sources.push('approved hospital RAG knowledge base');
        continue;
      }
      const retrieved = detected === 'doctor' && hasAvailabilityIntent(query)
        ? await getDoctorAvailability(query)
        : await retrieveOperationalData(detected, user);
      const data = Array.isArray(retrieved.items) ? retrieved.items : [];
      sections.push(formatOperationalAnswer(detected, data, query) || `No verified ${detected} data matched this request.`);
      result.recordIds.push(...data.slice(0, 20).map((item) => item._id?.toString()).filter(Boolean));
      if (data.length) result.sources.push(retrieved.source || 'hospital database');
    }
    result = {
      ...result,
      intent: detectedIntents.join('+'),
      agent: 'orchestrator-agent',
      tool: 'multi_agent_orchestration',
      sources: [...new Set(result.sources)],
      dataAvailable: sections.some((section) => !section.includes('No verified') && !section.includes('No approved')),
      message: sections.join('\n\n'),
    };
  } else if (!query || query.trim().length < 2 || intent === 'unsupported') {
    const fallbackIntents = detectFallbackIntents(query);
    let fallbackResolved = false;

    for (const fallbackIntent of fallbackIntents) {
      if (!canAccess(fallbackIntent, user.role)) continue;
      const retrieved = await retrieveOperationalData(fallbackIntent, user);
      const data = Array.isArray(retrieved.items) ? retrieved.items : [];
      const fallbackMessage = formatOperationalAnswer(fallbackIntent, data, query);

      if (fallbackMessage) {
        result = {
          ...result,
          intent: fallbackIntent,
          agent: AGENTS[fallbackIntent],
          sources: ['hospital database'],
          tool: retrieved.tool,
          recordIds: data.slice(0, 20).map((item) => item._id?.toString()).filter(Boolean),
          dataAvailable: true,
          message: fallbackMessage,
        };
        fallbackResolved = true;
        break;
      }
    }

    if (!fallbackResolved) {
      result = { ...result, intent: 'unsupported', agent: AGENTS.unsupported, message: !query ? 'Please ask a hospital-related question.' : UNSUPPORTED_MESSAGE };
    }
  } else if (!canAccess(intent, user.role)) {
    result = { ...result, authorized: false, status: 'denied', message: NO_DATA_MESSAGE };
  } else if (intent === 'feature') {
    result = { ...result, agent: AGENTS.feature, sources: ['approved HMS application capability catalog'], dataAvailable: true, message: formatFeatureAnswer(query) };
  } else if (intent === 'symptom') {
    const rag = await retrieveRagData(query);
    result = { ...result, sources: rag.length ? ['approved hospital RAG knowledge base'] : ['hospital symptom-safety protocol'], ragIds: rag.map((item) => item.id), dataAvailable: true, message: formatRagAnswer(rag) || formatGenericSymptomAnswer(query) };
  } else {
    const retrieved = intent === 'doctor' && hasAvailabilityIntent(query)
      ? await getDoctorAvailability(query)
      : await retrieveOperationalData(intent, user);
    const data = Array.isArray(retrieved.items) ? retrieved.items : retrieved.items.flat();
    result = { ...result, sources: data.length ? [retrieved.source] : [], tool: retrieved.tool, recordIds: data.slice(0, 20).map((item) => item._id?.toString()).filter(Boolean), dataAvailable: data.length > 0, message: formatOperationalAnswer(intent, data, query) || NO_DATA_MESSAGE };
  }

  await audit({ requestId, user, question: context, result });
  return { requestId, ...result };
};

module.exports = { answerQuestion, NO_DATA_MESSAGE };
