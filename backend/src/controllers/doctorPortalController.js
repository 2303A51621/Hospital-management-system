const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const LabTest = require('../models/LabTest');
const LeaveRequest = require('../models/LeaveRequest');
const Referral = require('../models/Referral');
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { asyncHandler } = require('./_helpers');
const {
  checkDrugInteractions,
  checkAllergyConflicts,
  checkDuplicateMedicines,
} = require('../services/clinicalSafetyService');

// Helper to get current doctor record
const getDoctorForUser = async (userId) => {
  const doctor = await Doctor.findOne({ userId }).populate('userId');
  if (!doctor) {
    throw new Error('Doctor profile not found for this account.');
  }
  return doctor;
};

// 1. DOCTOR DASHBOARD
exports.getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Appointments counts
  const allAppointments = await Appointment.find({ doctorId: doctor._id })
    .populate(['patientId', 'userId'])
    .sort({ appointmentDate: 1, startTime: 1 });

  const todayAppointments = allAppointments.filter((a) => {
    const d = new Date(a.appointmentDate);
    return d >= startOfToday && d <= endOfToday;
  });

  const upcomingAppointments = allAppointments.filter((a) => {
    const d = new Date(a.appointmentDate);
    return d > endOfToday && ['pending', 'confirmed', 'scheduled'].includes(a.status);
  });

  const completedConsultations = allAppointments.filter((a) => a.status === 'completed');
  const pendingConsultations = allAppointments.filter((a) => ['pending', 'confirmed', 'scheduled'].includes(a.status));
  const cancelledAppointments = allAppointments.filter((a) => a.status === 'cancelled');

  // Unique treated patients
  const treatedPatientIds = new Set(
    completedConsultations.map((a) => a.patientId?._id?.toString() || a.patientId?.toString()).filter(Boolean)
  );

  // Follow-ups
  const consultationsWithFollowUp = await Consultation.find({
    doctorId: doctor._id,
    'followUp.isRequired': true,
    'followUp.date': { $gte: startOfToday },
  }).populate('patientId');

  // Emergency patient alerts
  const emergencyAppointments = allAppointments.filter((a) => a.priority === 'emergency' || a.priority === 'urgent');
  const unreadMessages = await Message.countDocuments({ receiverId: req.user._id, isRead: false });

  // Weekly stats (last 7 days)
  const weeklyStats = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = allAppointments.filter((a) => {
      const ad = new Date(a.appointmentDate);
      return ad >= dayStart && ad <= dayEnd;
    }).length;
    const completed = allAppointments.filter((a) => {
      const ad = new Date(a.appointmentDate);
      return ad >= dayStart && ad <= dayEnd && a.status === 'completed';
    }).length;
    weeklyStats.push({ day: dayName, date: dayStart.toISOString().slice(0, 10), total: count, completed });
  }

  // Monthly stats
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyAppointments = allAppointments.filter((a) => new Date(a.appointmentDate) >= startOfMonth);

  // Status breakdown for chart
  const statusCounts = {
    completed: completedConsultations.length,
    pending: pendingConsultations.length,
    cancelled: cancelledAppointments.length,
    noShow: allAppointments.filter((a) => a.status === 'no-show').length,
  };

  res.json({
    success: true,
    data: {
      doctor: {
        _id: doctor._id,
        name: doctor.userId?.name || `Dr. ${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim(),
        specialization: doctor.specialization,
        department: doctor.department,
        profilePicture: doctor.userId?.profilePicture,
        licenseNumber: doctor.licenseNumber,
      },
      metrics: {
        totalPatientsTreated: treatedPatientIds.size,
        todayAppointmentsCount: todayAppointments.length,
        upcomingAppointmentsCount: upcomingAppointments.length,
        completedConsultationsCount: completedConsultations.length,
        pendingConsultationsCount: pendingConsultations.length,
        cancelledAppointmentsCount: cancelledAppointments.length,
        followUpsCount: consultationsWithFollowUp.length,
        emergencyAlertsCount: emergencyAppointments.length,
        unreadMessagesCount: unreadMessages,
        monthlyAppointmentsCount: monthlyAppointments.length,
      },
      todayAppointments: todayAppointments.slice(0, 10),
      upcomingAppointments: upcomingAppointments.slice(0, 5),
      emergencyAlerts: emergencyAppointments.slice(0, 5),
      weeklyStats,
      statusCounts,
      recentFollowUps: consultationsWithFollowUp.slice(0, 5),
    },
  });
});

// 2. PATIENT MANAGEMENT
exports.getDoctorPatients = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { search = '', status = '', page = 1, limit = 25 } = req.query;

  // Find all appointments for this doctor to identify assigned patients
  const appointments = await Appointment.find({ doctorId: doctor._id }).select('patientId appointmentDate status reason');
  const patientIds = [...new Set(appointments.map((a) => a.patientId?.toString()).filter(Boolean))];

  // Query patient records
  const patientQuery = { _id: { $in: patientIds } };
  let patients = await Patient.find(patientQuery)
    .populate('userId', 'name firstName lastName email phone profilePicture')
    .sort({ updatedAt: -1 });

  // In-memory search & filter
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    patients = patients.filter((p) => {
      const u = p.userId || {};
      const name = `${u.name || ''} ${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
      const patientId = (p.patientId || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      return name.includes(q) || patientId.includes(q) || phone.includes(q);
    });
  }

  // Attach last visit & latest diagnosis
  const enhanced = await Promise.all(
    patients.map(async (p) => {
      const lastAppt = appointments
        .filter((a) => a.patientId?.toString() === p._id.toString())
        .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))[0];
      const lastConsultation = await Consultation.findOne({ patientId: p._id }).sort({ visitDate: -1 });

      return {
        ...p.toObject(),
        lastVisitDate: lastAppt?.appointmentDate || null,
        lastVisitStatus: lastAppt?.status || null,
        lastDiagnosis: lastConsultation?.finalDiagnosis || lastConsultation?.preliminaryDiagnosis || 'General Evaluation',
        allergiesCount: p.allergies?.length || 0,
        chronicConditionsCount: p.chronicDiseases?.length || 0,
      };
    })
  );

  const startIdx = (Number(page) - 1) * Number(limit);
  const paged = enhanced.slice(startIdx, startIdx + Number(limit));

  res.json({
    success: true,
    data: paged,
    total: enhanced.length,
    page: Number(page),
    pages: Math.ceil(enhanced.length / Number(limit)),
  });
});

exports.getPatientFullProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.patientId).populate('userId', 'name firstName lastName email phone profilePicture');
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  const [appointments, consultations, prescriptions, labTests] = await Promise.all([
    Appointment.find({ patientId: patient._id }).sort({ appointmentDate: -1 }).populate('doctorId'),
    Consultation.find({ patientId: patient._id }).sort({ visitDate: -1 }).populate('doctorId'),
    Prescription.find({ patientId: patient._id }).sort({ prescriptionDate: -1 }).populate('doctorId'),
    LabTest.find({ patientId: patient._id }).sort({ orderDate: -1 }).populate('doctorId'),
  ]);

  res.json({
    success: true,
    data: {
      patient,
      appointments,
      consultations,
      prescriptions,
      labTests,
    },
  });
});

exports.getPatientTimeline = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const patient = await Patient.findById(patientId).populate('userId', 'name firstName lastName');
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  const [appointments, consultations, prescriptions, labTests] = await Promise.all([
    Appointment.find({ patientId }).populate('doctorId'),
    Consultation.find({ patientId }).populate('doctorId'),
    Prescription.find({ patientId }).populate('doctorId'),
    LabTest.find({ patientId }).populate('doctorId'),
  ]);

  const timeline = [];

  appointments.forEach((a) => {
    timeline.push({
      id: a._id,
      type: 'appointment',
      date: a.appointmentDate,
      title: `${a.consultationType === 'telemedicine' ? 'Video' : 'In-person'} Consultation (${a.status})`,
      description: a.reason || 'Routine follow-up',
      doctor: a.doctorId?.userId?.name || 'Assigned Specialist',
      status: a.status,
      details: a,
    });
  });

  consultations.forEach((c) => {
    timeline.push({
      id: c._id,
      type: 'consultation',
      date: c.visitDate || c.createdAt,
      title: `Clinical Consultation: ${c.finalDiagnosis || c.preliminaryDiagnosis || 'Clinical Assessment'}`,
      description: c.clinicalNotes || c.treatmentRecommendations || 'Clinical findings documented',
      doctor: c.doctorId?.userId?.name || 'Consulting Physician',
      status: c.status,
      details: c,
    });
  });

  prescriptions.forEach((p) => {
    timeline.push({
      id: p._id,
      type: 'prescription',
      date: p.prescriptionDate || p.createdAt,
      title: `Prescription Issued: ${p.prescriptionId}`,
      description: `${p.medicines?.length || 0} medications prescribed (${p.diagnosis || 'Standard therapy'})`,
      doctor: p.doctorId?.userId?.name || 'Prescribing Doctor',
      status: p.status,
      details: p,
    });
  });

  labTests.forEach((t) => {
    timeline.push({
      id: t._id,
      type: 'lab-test',
      date: t.orderDate || t.createdAt,
      title: `Investigation: ${t.testName} (${t.status})`,
      description: t.testResults?.interpretation || t.testCategory || 'Diagnostic test',
      doctor: t.doctorId?.userId?.name || 'Ordering Physician',
      status: t.status,
      isAbnormal: t.isAbnormal || false,
      details: t,
    });
  });

  // Sort chronological descending
  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    success: true,
    data: {
      patient,
      timeline,
    },
  });
});

exports.addClinicalNote = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { condition, treatment, notes } = req.body;

  const patient = await Patient.findByIdAndUpdate(
    req.params.patientId,
    {
      $push: {
        medicalHistory: {
          date: new Date(),
          condition: condition || 'Clinical Evaluation',
          treatment: treatment || notes || 'Clinical note added by attending physician',
          doctorId: doctor._id,
        },
      },
    },
    { new: true }
  );

  // Log activity
  await ActivityLog.create({
    userId: req.user._id,
    userRole: 'doctor',
    action: 'create',
    module: 'patient',
    entityType: 'Patient',
    entityId: patient._id,
    details: { note: condition || treatment },
  });

  res.json({ success: true, data: patient });
});

exports.addPatientAllergy = asyncHandler(async (req, res) => {
  const { allergen, severity = 'moderate', reaction = 'Hypersensitivity' } = req.body;
  if (!allergen) return res.status(400).json({ message: 'Allergen name is required' });

  const patient = await Patient.findByIdAndUpdate(
    req.params.patientId,
    {
      $push: {
        allergies: { allergen, severity, reaction },
      },
    },
    { new: true }
  );

  res.json({ success: true, data: patient });
});

// 3. APPOINTMENT MANAGEMENT ACTIONS
exports.acceptAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: 'confirmed' },
    { new: true }
  ).populate('patientId userId');

  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

  // Send in-app notification to patient
  if (appointment.userId) {
    await Notification.create({
      userId: appointment.userId._id || appointment.userId,
      appointmentId: appointment._id,
      type: 'appointment-reminder',
      title: 'Appointment Confirmed',
      message: `Your appointment on ${new Date(appointment.appointmentDate).toDateString()} at ${appointment.startTime} has been confirmed by the doctor.`,
    });
  }

  res.json({ success: true, data: appointment, message: 'Appointment accepted' });
});

exports.rejectAppointment = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: 'cancelled', rejectionReason: rejectionReason || 'Unavailable at this time' },
    { new: true }
  ).populate('userId');

  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

  if (appointment.userId) {
    await Notification.create({
      userId: appointment.userId._id || appointment.userId,
      appointmentId: appointment._id,
      type: 'appointment-reminder',
      title: 'Appointment Request Update',
      message: `Your appointment request for ${new Date(appointment.appointmentDate).toDateString()} was declined. Reason: ${rejectionReason || 'Doctor unavailable'}.`,
    });
  }

  res.json({ success: true, data: appointment, message: 'Appointment rejected' });
});

exports.markAppointmentNoShow = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status: 'no-show' },
    { new: true }
  );
  res.json({ success: true, data: appointment, message: 'Marked as no-show' });
});

// 4. CONSULTATION MANAGEMENT
exports.getConsultations = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { status, patientId } = req.query;
  const filter = { doctorId: doctor._id };
  if (status) filter.status = status;
  if (patientId) filter.patientId = patientId;

  const consultations = await Consultation.find(filter)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name firstName lastName phone email' },
    })
    .populate('appointmentId')
    .sort({ updatedAt: -1 });

  res.json({ success: true, data: consultations, count: consultations.length });
});

exports.getConsultationById = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name firstName lastName phone email' },
    })
    .populate('appointmentId')
    .populate('doctorId');

  if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
  res.json({ success: true, data: consultation });
});

exports.saveConsultationDraft = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const body = req.body || {};

  let consultation;
  if (body._id) {
    consultation = await Consultation.findByIdAndUpdate(
      body._id,
      { ...body, doctorId: doctor._id, status: 'draft' },
      { new: true }
    );
  } else {
    consultation = await Consultation.create({
      ...body,
      doctorId: doctor._id,
      status: 'draft',
    });
  }

  res.json({ success: true, data: consultation, message: 'Consultation draft saved' });
});

exports.completeConsultation = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const body = req.body || {};

  const payload = {
    ...body,
    doctorId: doctor._id,
    status: 'completed',
    completedAt: new Date(),
    digitalSignature: body.digitalSignature || doctor.digitalSignature || `Dr. ${doctor.userId?.name || ''}`,
  };

  let consultation;
  if (body._id) {
    consultation = await Consultation.findByIdAndUpdate(body._id, payload, { new: true });
  } else {
    consultation = await Consultation.create(payload);
  }

  // Update associated appointment to completed
  if (consultation.appointmentId) {
    await Appointment.findByIdAndUpdate(consultation.appointmentId, { status: 'completed' });
  }

  // Update patient medical history
  if (consultation.finalDiagnosis && consultation.patientId) {
    await Patient.findByIdAndUpdate(consultation.patientId, {
      $push: {
        medicalHistory: {
          date: new Date(),
          condition: consultation.finalDiagnosis,
          treatment: consultation.treatmentRecommendations || 'Completed consultation',
          doctorId: doctor._id,
        },
      },
    });
  }

  // If referral specified, create a Referral record automatically
  if (body.referral?.referredDoctorId && body.referral?.department) {
    await Referral.create({
      patientId: consultation.patientId,
      referringDoctorId: doctor._id,
      referredDoctorId: body.referral.referredDoctorId,
      department: body.referral.department,
      reason: body.referral.reason || 'Specialist consultation recommendation',
      clinicalNotes: `Referred following consultation on ${new Date().toDateString()}: ${consultation.finalDiagnosis || ''}`,
      priority: 'routine',
    });
  }

  res.json({ success: true, data: consultation, message: 'Consultation successfully completed and signed' });
});

// 5. PRESCRIPTION MANAGEMENT
exports.getDoctorPrescriptions = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { search = '', patientId } = req.query;

  const filter = { doctorId: doctor._id };
  if (patientId) filter.patientId = patientId;

  const prescriptions = await Prescription.find(filter)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name firstName lastName phone email' },
    })
    .sort({ prescriptionDate: -1, createdAt: -1 });

  res.json({ success: true, data: prescriptions, count: prescriptions.length });
});

exports.createDoctorPrescription = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { patientId, medicines = [], diagnosis = '', notes = '', digitalSignature } = req.body;

  if (!patientId) return res.status(400).json({ message: 'Patient is required' });
  if (!medicines.length) return res.status(400).json({ message: 'At least one medicine is required' });

  // 1. Fetch patient allergies
  const patient = await Patient.findById(patientId);
  const allergies = patient?.allergies || [];

  // 2. Clinical safety verification
  const allergyAlerts = checkAllergyConflicts(medicines, allergies);
  const drugInteractions = checkDrugInteractions(medicines);
  const duplicateWarnings = checkDuplicateMedicines(medicines);

  // If critical severe allergy conflict and not explicitly overridden
  if (allergyAlerts.some((a) => a.severity === 'severe') && !req.body.overrideAllergyWarning) {
    return res.status(422).json({
      success: false,
      blocked: true,
      allergyAlerts,
      message: 'Severe allergy conflict detected. Doctor confirmation override required.',
    });
  }

  const prescription = await Prescription.create({
    patientId,
    doctorId: doctor._id,
    diagnosis,
    notes,
    medicines,
    digitalSignature: digitalSignature || doctor.digitalSignature || `Dr. ${doctor.userId?.name || ''}`,
    allergiesChecked: true,
    drugInteractionsChecked: true,
    prescriptionDate: new Date(),
  });

  // Notify patient
  if (patient?.userId) {
    await Notification.create({
      userId: patient.userId,
      type: 'system',
      title: 'New Digital Prescription Issued',
      message: `Dr. ${doctor.userId?.name || 'Your specialist'} issued a prescription (${prescription.prescriptionId}) for ${diagnosis || 'your treatment'}.`,
    });
  }

  res.status(201).json({
    success: true,
    data: prescription,
    allergyAlerts,
    drugInteractions,
    duplicateWarnings,
    message: 'Prescription successfully confirmed and issued.',
  });
});

exports.checkClinicalSafety = asyncHandler(async (req, res) => {
  const { medicines = [], patientId } = req.body;
  let patientAllergies = [];
  if (patientId) {
    const patient = await Patient.findById(patientId);
    patientAllergies = patient?.allergies || [];
  }

  const allergyAlerts = checkAllergyConflicts(medicines, patientAllergies);
  const drugInteractions = checkDrugInteractions(medicines);
  const duplicateWarnings = checkDuplicateMedicines(medicines);

  res.json({
    success: true,
    data: {
      hasWarnings: allergyAlerts.length > 0 || drugInteractions.length > 0 || duplicateWarnings.length > 0,
      allergyAlerts,
      drugInteractions,
      duplicateWarnings,
    },
  });
});

// 6. MEDICAL REPORTS MANAGEMENT
exports.getDoctorReports = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { status, testType, patientId } = req.query;

  const filter = { doctorId: doctor._id };
  if (status) filter.status = status;
  if (testType) filter.testType = testType;
  if (patientId) filter.patientId = patientId;

  const reports = await LabTest.find(filter)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name firstName lastName phone email' },
    })
    .sort({ orderDate: -1, createdAt: -1 });

  res.json({ success: true, data: reports, count: reports.length });
});

exports.orderDiagnosticTest = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { patientId, testName, testType = 'blood', testCategory = 'pathology', remarks = '' } = req.body;

  if (!patientId || !testName) {
    return res.status(400).json({ message: 'Patient and Test Name are required' });
  }

  const labTest = await LabTest.create({
    patientId,
    doctorId: doctor._id,
    testName,
    testType,
    testCategory,
    orderDate: new Date(),
    status: 'ordered',
    testResults: {
      remarks,
    },
  });

  res.status(201).json({ success: true, data: labTest, message: 'Diagnostic investigation ordered' });
});

exports.reviewReport = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { doctorComments, isAbnormal } = req.body;

  const report = await LabTest.findByIdAndUpdate(
    req.params.id,
    {
      reviewedAt: new Date(),
      reviewedBy: doctor._id,
      doctorComments,
      isAbnormal: Boolean(isAbnormal),
    },
    { new: true }
  ).populate('patientId');

  res.json({ success: true, data: report, message: 'Report reviewed and documented' });
});

// 7. REFERRALS MANAGEMENT
exports.getReferrals = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const outgoing = await Referral.find({ referringDoctorId: doctor._id })
    .populate('patientId')
    .populate({ path: 'referredDoctorId', populate: { path: 'userId', select: 'name specialization' } })
    .sort({ createdAt: -1 });

  const incoming = await Referral.find({ referredDoctorId: doctor._id })
    .populate('patientId')
    .populate({ path: 'referringDoctorId', populate: { path: 'userId', select: 'name specialization' } })
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { outgoing, incoming } });
});

exports.createReferral = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { patientId, referredDoctorId, department, reason, clinicalNotes, priority = 'routine' } = req.body;

  if (!patientId || !department || !reason) {
    return res.status(400).json({ message: 'Patient, department, and referral reason are required' });
  }

  const referral = await Referral.create({
    patientId,
    referringDoctorId: doctor._id,
    referredDoctorId: referredDoctorId || undefined,
    department,
    reason,
    clinicalNotes,
    priority,
    status: 'pending',
  });

  res.status(201).json({ success: true, data: referral, message: 'Specialist referral created' });
});

exports.updateReferralStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const referral = await Referral.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  );
  res.json({ success: true, data: referral });
});

// 8. COMMUNICATION MANAGEMENT
exports.getDoctorMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const messages = await Message.find({
    $or: [{ senderId: userId }, { receiverId: userId }],
  })
    .populate('senderId', 'name role email profilePicture')
    .populate('receiverId', 'name role email profilePicture')
    .populate('patientId')
    .sort({ createdAt: -1 });

  const unreadCount = await Message.countDocuments({ receiverId: userId, isRead: false });

  res.json({ success: true, data: messages, unreadCount });
});

exports.sendDoctorMessage = asyncHandler(async (req, res) => {
  const { receiverId, patientId, subject, body, messageType = 'general', priority = 'normal' } = req.body;

  if (!receiverId || !body) {
    return res.status(400).json({ message: 'Recipient and message body are required' });
  }

  const message = await Message.create({
    senderId: req.user._id,
    receiverId,
    patientId: patientId || undefined,
    subject: subject || 'Clinical Message',
    body,
    messageType,
    priority,
  });

  // Also create notification
  await Notification.create({
    userId: receiverId,
    type: priority === 'emergency' ? 'emergency' : 'system',
    title: subject || 'New Message from Doctor',
    message: body.slice(0, 150),
  });

  res.status(201).json({ success: true, data: message });
});

exports.markMessageAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndUpdate(
    req.params.id,
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  res.json({ success: true, data: message });
});

// 9. LEAVE & AVAILABILITY
exports.getDoctorLeaveRequests = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const leaves = await LeaveRequest.find({ doctorId: doctor._id })
    .populate('emergencyCoverDoctorId')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: leaves });
});

exports.applyDoctorLeave = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { startDate, endDate, leaveType = 'personal', reason, emergencyCoverDoctorId } = req.body;

  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ message: 'Start date, end date, and reason are required' });
  }

  const leave = await LeaveRequest.create({
    doctorId: doctor._id,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    leaveType,
    reason,
    emergencyCoverDoctorId: emergencyCoverDoctorId || undefined,
    status: 'pending',
  });

  res.status(201).json({ success: true, data: leave, message: 'Leave application submitted for approval' });
});

exports.updateDoctorAvailability = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const { availability, availableDays, availableSlots, emergencyAvailable, customUnavailableDates } = req.body;

  const updated = await Doctor.findByIdAndUpdate(
    doctor._id,
    {
      ...(availability && { availability }),
      ...(availableDays && { availableDays }),
      ...(availableSlots && { availableSlots }),
      ...(emergencyAvailable !== undefined && { emergencyAvailable }),
      ...(customUnavailableDates && { customUnavailableDates }),
    },
    { new: true }
  );

  res.json({ success: true, data: updated, message: 'Availability schedule updated' });
});

// 10. DOCTOR ANALYTICS
exports.getDoctorAnalytics = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const allAppointments = await Appointment.find({ doctorId: doctor._id }).populate('patientId');
  const allConsultations = await Consultation.find({ doctorId: doctor._id });

  const completed = allAppointments.filter((a) => a.status === 'completed');
  const cancelled = allAppointments.filter((a) => a.status === 'cancelled');
  const total = allAppointments.length || 1;

  const cancellationRate = Math.round((cancelled.length / total) * 100);
  const completionRate = Math.round((completed.length / total) * 100);

  // Department / Diagnosis breakdown
  const diagnosisMap = {};
  allConsultations.forEach((c) => {
    const diag = c.finalDiagnosis || c.preliminaryDiagnosis || 'General Assessment';
    diagnosisMap[diag] = (diagnosisMap[diag] || 0) + 1;
  });

  const topDiagnoses = Object.entries(diagnosisMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      totalAppointments: allAppointments.length,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      cancellationRate,
      completionRate,
      totalPrescriptions: await Prescription.countDocuments({ doctorId: doctor._id }),
      totalLabTestsOrdered: await LabTest.countDocuments({ doctorId: doctor._id }),
      topDiagnoses,
      averageDurationMinutes: 25,
    },
  });
});

// 11. AI CLINICAL ASSISTANT
exports.aiClinicalAssist = asyncHandler(async (req, res) => {
  const { symptoms = [], notes = '', patientId } = req.body;

  let patientSummary = 'No previous clinical record.';
  if (patientId) {
    const past = await Consultation.find({ patientId }).sort({ visitDate: -1 }).limit(3);
    if (past.length > 0) {
      patientSummary = past
        .map((c) => `${new Date(c.visitDate).toLocaleDateString()}: ${c.finalDiagnosis || 'Evaluation'} - ${c.treatmentRecommendations || ''}`)
        .join(' | ');
    }
  }

  const symptomsList = Array.isArray(symptoms) ? symptoms : [symptoms].filter(Boolean);
  const rawText = `${symptomsList.join(', ')} ${notes}`.toLowerCase();

  // Clinically grounded differential assessment suggestions
  const suggestions = [];
  if (rawText.includes('chest pain') || rawText.includes('shortness of breath')) {
    suggestions.push({
      category: 'Cardiopulmonary',
      provisionalDiagnosis: 'Rule out Acute Coronary Syndrome / Angina Pectoris',
      recommendedVitals: ['BP', 'Heart Rate', 'SpO2'],
      recommendedInvestigations: ['12-Lead ECG', 'Cardiac Troponin I', 'Chest X-ray'],
      urgency: 'high',
    });
  }
  if (rawText.includes('fever') || rawText.includes('cough') || rawText.includes('chills')) {
    suggestions.push({
      category: 'Infectious / Respiratory',
      provisionalDiagnosis: 'Upper / Lower Respiratory Tract Infection',
      recommendedVitals: ['Temperature', 'SpO2', 'Respiratory Rate'],
      recommendedInvestigations: ['Complete Blood Count (CBC)', 'Chest X-ray PA View'],
      urgency: 'moderate',
    });
  }
  if (rawText.includes('headache') || rawText.includes('dizziness')) {
    suggestions.push({
      category: 'Neurological',
      provisionalDiagnosis: 'Tension Headache / Migraine Cephalea',
      recommendedVitals: ['BP', 'Pulse'],
      recommendedInvestigations: ['Fundoscopy', 'CT Brain if red flags present'],
      urgency: 'moderate',
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      category: 'General Clinical Review',
      provisionalDiagnosis: 'Acute Symptomatic Presentation - Further Evaluation Advised',
      recommendedVitals: ['BP', 'Heart Rate', 'Temperature', 'SpO2'],
      recommendedInvestigations: ['Routine Blood Work (CBC, ESR)'],
      urgency: 'routine',
    });
  }

  const formattedNoteDraft = `CHIEF COMPLAINT:\n${symptomsList.length ? symptomsList.join(', ') : 'Patient presents for clinical consultation.'}\n\nCLINICAL OBSERVATIONS:\n${notes || 'Physical examination unremarkable.'}\n\nPREVIOUS HISTORY SUMMARY:\n${patientSummary}\n\nPRELIMINARY ASSESSMENT:\n${suggestions.map((s) => s.provisionalDiagnosis).join('\n')}\n\nRECOMMENDED PLAN:\nComplete vital sign monitoring and diagnostic workup as clinically indicated.`;

  res.json({
    success: true,
    data: {
      formattedNoteDraft,
      suggestions,
      patientHistorySummary: patientSummary,
      disclaimer: 'AI Clinical Assistant output is supportive documentation only. All final diagnoses, prescriptions, and clinical decisions remain the exclusive professional responsibility of the attending physician.',
    },
  });
});

// 12. DOCTOR PROFILE & DIGITAL SIGNATURE
exports.getDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  res.json({ success: true, data: doctor });
});

exports.updateDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);
  const {
    experience,
    consultationFee,
    bio,
    phone,
    qualifications,
    digitalSignature,
  } = req.body;

  const updateFields = {};
  if (experience !== undefined) updateFields.experience = Number(experience);
  if (consultationFee !== undefined) updateFields.consultationFee = Number(consultationFee);
  if (bio !== undefined) updateFields.bio = bio;
  if (qualifications !== undefined) updateFields.qualification = qualifications;
  if (digitalSignature !== undefined) updateFields.digitalSignature = digitalSignature;

  const updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, updateFields, { new: true }).populate('userId');

  if (phone) {
    await User.findByIdAndUpdate(req.user._id, { phone });
  }

  res.json({ success: true, data: updatedDoctor, message: 'Doctor profile updated' });
});

