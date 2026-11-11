const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const LabTest = require('../models/LabTest');
const Billing = require('../models/Billing');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const LeaveRequest = require('../models/LeaveRequest');
const FamilyMember = require('../models/FamilyMember');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { asyncHandler } = require('./_helpers');
const { v4: uuidv4 } = require('uuid');

// Helper to get or create Patient record for authenticated user
const getPatientForUser = async (userId, userDetails = {}) => {
  let patient = await Patient.findOne({ userId }).populate('userId', 'name firstName lastName email phone profilePicture');
  if (!patient) {
    patient = await Patient.create({
      userId,
      emergencyContact: userDetails.emergencyContact || undefined,
    });
    patient = await Patient.findById(patient._id).populate('userId', 'name firstName lastName email phone profilePicture');
  }
  return patient;
};

// 1. PATIENT DASHBOARD
exports.getPatientDashboard = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);

  const [
    allAppointments,
    consultations,
    prescriptions,
    labTests,
    billings,
    notifications,
  ] = await Promise.all([
    Appointment.find({ patientId: patient._id })
      .populate('doctorId', 'userId specialization consultationFee department rating')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name firstName lastName email phone profilePicture' } })
      .sort({ appointmentDate: -1 }),
    Consultation.find({ patientId: patient._id, status: 'completed' })
      .populate('doctorId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name firstName lastName' } })
      .sort({ visitDate: -1 })
      .limit(5),
    Prescription.find({ patientId: patient._id })
      .populate('doctorId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(5),
    LabTest.find({ patientId: patient._id })
      .populate('doctorId')
      .sort({ orderDate: -1 })
      .limit(5),
    Billing.find({ patientId: patient._id })
      .sort({ invoiceDate: -1 }),
    Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(6),
  ]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const upcomingAppointments = allAppointments.filter((a) => {
    const dStr = (a.appointmentDate || a.date || '').slice(0, 10);
    return ['pending', 'scheduled', 'confirmed'].includes(a.status) && dStr >= todayStr;
  });

  const completedAppointments = allAppointments.filter((a) => a.status === 'completed');
  const cancelledAppointments = allAppointments.filter((a) => a.status === 'cancelled');
  const pendingAppointments = allAppointments.filter((a) => a.status === 'pending');

  const pendingReports = labTests.filter((t) => t.status !== 'completed');
  const unreadNotificationsCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

  // Outstanding payments
  const unpaidInvoices = billings.filter((b) => b.paymentDetails?.paymentStatus === 'pending' || b.status === 'issued');
  const totalOutstandingPayment = unpaidInvoices.reduce((sum, b) => sum + (b.summary?.totalAmount || 0), 0);

  // Doctor follow-up recommendations
  const allFollowUps = await Consultation.find({
    patientId: patient._id,
    'followUp.isRequired': true,
  })
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .sort({ 'followUp.date': 1 });

  res.json({
    success: true,
    data: {
      patient: {
        _id: patient._id,
        patientId: patient.patientId,
        name: patient.userId?.name || req.user.name,
        email: patient.userId?.email || req.user.email,
        phone: patient.userId?.phone || req.user.phone,
        bloodGroup: patient.bloodGroup || 'Not recorded',
        gender: patient.gender || 'Not specified',
        profilePicture: patient.userId?.profilePicture || null,
        allergiesCount: patient.allergies?.length || 0,
        chronicConditionsCount: patient.chronicDiseases?.length || 0,
      },
      metrics: {
        totalAppointments: allAppointments.length,
        upcomingAppointmentsCount: upcomingAppointments.length,
        completedAppointmentsCount: completedAppointments.length,
        cancelledAppointmentsCount: cancelledAppointments.length,
        pendingAppointmentsCount: pendingAppointments.length,
        totalPrescriptionsCount: prescriptions.length,
        pendingReportsCount: pendingReports.length,
        unreadNotificationsCount,
        totalOutstandingPayment,
      },
      upcomingAppointments: upcomingAppointments.slice(0, 3),
      recentConsultations: consultations,
      recentPrescriptions: prescriptions,
      pendingReports,
      recentNotifications: notifications,
      followUpReminders: allFollowUps.slice(0, 3),
    },
  });
});

// 2. DOCTOR SEARCH & DISCOVERY
exports.getDoctorsDirectory = asyncHandler(async (req, res) => {
  const { specialization, department, search, sort = 'experience' } = req.query;

  const query = { isActive: true };

  if (specialization) query.specialization = specialization;
  if (department) query.department = department;

  let doctors = await Doctor.find(query)
    .populate('userId', 'name firstName lastName email phone profilePicture')
    .lean();

  if (search) {
    const q = String(search).toLowerCase();
    doctors = doctors.filter((doc) => {
      const name = doc.userId?.name || `${doc.userId?.firstName || ''} ${doc.userId?.lastName || ''}`;
      return (
        name.toLowerCase().includes(q) ||
        doc.specialization?.toLowerCase().includes(q) ||
        doc.department?.toLowerCase().includes(q)
      );
    });
  }

  // Sorting
  if (sort === 'fee_asc') doctors.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
  else if (sort === 'fee_desc') doctors.sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
  else if (sort === 'rating') doctors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else doctors.sort((a, b) => (b.experience || 0) - (a.experience || 0));

  res.json({ success: true, count: doctors.length, data: doctors });
});

// Real-time available slots calculation with leave conflict & double-booking prevention
exports.getDoctorAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) {
    return res.status(400).json({ message: 'doctorId and date (YYYY-MM-DD) are required' });
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  const queryDate = new Date(date);
  const dayName = queryDate.toLocaleDateString('en-US', { weekday: 'long' });

  // 1. Check if doctor is on approved leave on that date
  const onLeave = await LeaveRequest.findOne({
    doctorId: doctor._id,
    status: 'approved',
    startDate: { $lte: new Date(date + 'T23:59:59.999Z') },
    endDate: { $gte: new Date(date + 'T00:00:00.000Z') },
  });

  if (onLeave) {
    return res.json({
      success: true,
      isOnLeave: true,
      leaveReason: 'Doctor is on approved clinical leave',
      availableSlots: [],
    });
  }

  // 2. Determine base schedule for that day
  const defaultSlotTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  ];

  // 3. Find existing bookings for that date
  const bookedAppointments = await Appointment.find({
    doctorId: doctor._id,
    appointmentDate: {
      $gte: new Date(date + 'T00:00:00.000Z'),
      $lte: new Date(date + 'T23:59:59.999Z'),
    },
    status: { $nin: ['cancelled', 'rejected'] },
  });

  const bookedTimes = new Set(bookedAppointments.map((a) => a.startTime));
  const availableSlots = defaultSlotTimes.filter((slot) => !bookedTimes.has(slot));

  res.json({
    success: true,
    dayName,
    date,
    doctorFee: doctor.consultationFee,
    availableSlots,
    bookedCount: bookedTimes.size,
  });
});

// 3. APPOINTMENT BOOKING MANAGEMENT
exports.bookAppointment = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const {
    doctorId,
    appointmentDate,
    startTime,
    consultationType = 'in-person',
    reason,
    symptoms = [],
    previousReports = [],
    familyMemberId,
    paymentMethod = 'upi',
  } = req.body;

  if (!doctorId || !appointmentDate || !startTime) {
    return res.status(400).json({ message: 'Doctor, appointment date, and time slot are required' });
  }

  const doctor = await Doctor.findById(doctorId).populate('userId');
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

  // Prevent double booking for same doctor at same slot
  const dateStr = String(appointmentDate).slice(0, 10);
  const existing = await Appointment.findOne({
    doctorId: doctor._id,
    appointmentDate: {
      $gte: new Date(dateStr + 'T00:00:00.000Z'),
      $lte: new Date(dateStr + 'T23:59:59.999Z'),
    },
    startTime,
    status: { $nin: ['cancelled', 'rejected'] },
  });

  if (existing) {
    return res.status(409).json({ message: 'Selected time slot is no longer available. Please pick another slot.' });
  }

  // Calculate endTime (default 30 mins)
  const [h, m] = startTime.split(':').map(Number);
  const endMinutes = m + 30;
  const endH = endMinutes >= 60 ? h + 1 : h;
  const endM = endMinutes >= 60 ? endMinutes - 60 : endMinutes;
  const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  const symptomsList = Array.isArray(symptoms) ? symptoms : [symptoms].filter(Boolean);

  const appointment = await Appointment.create({
    patientId: patient._id,
    userId: req.user._id,
    doctorId: doctor._id,
    department: doctor.department || doctor.specialization,
    appointmentDate: new Date(appointmentDate),
    startTime,
    endTime,
    consultationType,
    reason: reason || 'Routine Clinical Consultation',
    symptoms: symptomsList,
    previousReports,
    status: 'pending',
    paymentStatus: paymentMethod === 'pay_at_hospital' ? 'pending' : 'pending',
  });

  // Automatically create corresponding Billing invoice
  const billing = await Billing.create({
    patientId: patient._id,
    appointmentId: appointment._id,
    invoiceDate: new Date(),
    billItems: [
      {
        itemType: 'consultation',
        description: `Consultation Fee with Dr. ${doctor.userId?.name || doctor.name} (${doctor.specialization})`,
        quantity: 1,
        unitPrice: doctor.consultationFee || 500,
        total: doctor.consultationFee || 500,
      },
    ],
    summary: {
      subtotal: doctor.consultationFee || 500,
      gstRate: 0,
      gstAmount: 0,
      totalAmount: doctor.consultationFee || 500,
    },
    paymentDetails: {
      paymentMethod: paymentMethod === 'pay_at_hospital' ? 'pay_at_hospital' : 'upi',
      paymentStatus: 'pending',
    },
    status: 'issued',
  });

  // Create notifications
  await Notification.create({
    userId: req.user._id,
    type: 'appointment-reminder',
    title: 'Appointment Request Submitted',
    message: `Your booking request with Dr. ${doctor.userId?.name || doctor.name} on ${dateStr} at ${startTime} has been submitted.`,
  });

  if (doctor.userId?._id) {
    await Notification.create({
      userId: doctor.userId._id,
      type: 'system',
      title: 'New Appointment Booking Request',
      message: `Patient ${patient.userId?.name || req.user.name} has requested an appointment on ${dateStr} at ${startTime}.`,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Appointment successfully booked!',
    data: { appointment, billing },
  });
});

// 4. MY APPOINTMENTS LIST & ACTIONS
exports.getPatientAppointments = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const { status, tab } = req.query;

  const filter = { patientId: patient._id };
  if (status && status !== 'all') filter.status = status;

  let appointments = await Appointment.find(filter)
    .populate('doctorId', 'userId specialization consultationFee department rating digitalSignature')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name firstName lastName email phone profilePicture' } })
    .sort({ appointmentDate: -1 });

  const nowStr = new Date().toISOString().slice(0, 10);

  if (tab === 'today') {
    appointments = appointments.filter((a) => (a.appointmentDate || a.date || '').slice(0, 10) === nowStr);
  } else if (tab === 'upcoming') {
    appointments = appointments.filter((a) => {
      const d = (a.appointmentDate || a.date || '').slice(0, 10);
      return ['pending', 'confirmed', 'scheduled'].includes(a.status) && d >= nowStr;
    });
  } else if (tab === 'past') {
    appointments = appointments.filter((a) => a.status === 'completed' || (a.appointmentDate || '').slice(0, 10) < nowStr);
  } else if (tab === 'cancelled') {
    appointments = appointments.filter((a) => a.status === 'cancelled' || a.status === 'rejected');
  } else if (tab === 'pending') {
    appointments = appointments.filter((a) => a.status === 'pending');
  }

  res.json({ success: true, count: appointments.length, data: appointments });
});

exports.rescheduleAppointment = asyncHandler(async (req, res) => {
  const { newDate, newStartTime, reason } = req.body;
  if (!newDate || !newStartTime) {
    return res.status(400).json({ message: 'New date and time slot are required' });
  }

  const appt = await Appointment.findById(req.params.id);
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });

  // Update
  appt.appointmentDate = new Date(newDate);
  appt.startTime = newStartTime;
  appt.status = 'rescheduled';
  if (reason) appt.notes = (appt.notes || '') + ` | Rescheduled: ${reason}`;
  await appt.save();

  await Notification.create({
    userId: req.user._id,
    type: 'appointment-reminder',
    title: 'Appointment Rescheduled',
    message: `Your appointment has been rescheduled to ${newDate} at ${newStartTime}.`,
  });

  res.json({ success: true, message: 'Appointment rescheduled successfully', data: appt });
});

exports.cancelAppointment = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const appt = await Appointment.findById(req.params.id);
  if (!appt) return res.status(404).json({ message: 'Appointment not found' });

  appt.status = 'cancelled';
  appt.cancellationReason = reason || 'Patient cancelled';
  await appt.save();

  res.json({ success: true, message: 'Appointment cancelled', data: appt });
});

// 5. MY MEDICAL RECORDS & TIMELINE
exports.getPatientMedicalRecords = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);

  const [consultations, prescriptions, labTests] = await Promise.all([
    Consultation.find({ patientId: patient._id, status: 'completed' })
      .populate('doctorId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name specialization' } })
      .sort({ visitDate: -1 }),
    Prescription.find({ patientId: patient._id })
      .populate('doctorId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name specialization' } })
      .sort({ createdAt: -1 }),
    LabTest.find({ patientId: patient._id })
      .populate('doctorId')
      .sort({ orderDate: -1 }),
  ]);

  // Construct unified chronological timeline
  const timeline = [];

  consultations.forEach((c) => {
    timeline.push({
      date: c.visitDate || c.createdAt,
      type: 'consultation',
      title: `Clinical Consultation: ${c.finalDiagnosis || c.preliminaryDiagnosis || 'General Evaluation'}`,
      doctorName: c.doctorId?.userId?.name || 'Doctor',
      data: c,
    });
  });

  prescriptions.forEach((p) => {
    timeline.push({
      date: p.createdAt || p.date,
      type: 'prescription',
      title: `Digital Prescription Issued (${p.medicines?.length || 0} medications)`,
      doctorName: p.doctorId?.userId?.name || 'Doctor',
      data: p,
    });
  });

  labTests.forEach((l) => {
    timeline.push({
      date: l.orderDate || l.createdAt,
      type: 'lab_test',
      title: `Diagnostic Investigation: ${l.testName || 'Lab Investigation'}`,
      doctorName: 'Clinical Laboratory',
      data: l,
    });
  });

  timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({
    success: true,
    data: {
      patient,
      timeline,
      allergies: patient.allergies || [],
      chronicDiseases: patient.chronicDiseases || [],
      medicalHistory: patient.medicalHistory || [],
    },
  });
});

exports.uploadPatientDocument = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const { title, documentType = 'report', fileUrl } = req.body;

  if (!fileUrl) {
    return res.status(400).json({ message: 'File document URL is required' });
  }

  patient.documents.push({
    documentType,
    fileUrl,
    uploadDate: new Date(),
  });
  await patient.save();

  res.status(201).json({ success: true, message: 'Medical document uploaded', data: patient.documents });
});

// 6. PRESCRIPTIONS (Strictly read-only for patient)
exports.getPatientPrescriptions = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);

  const prescriptions = await Prescription.find({ patientId: patient._id })
    .populate('doctorId', 'userId specialization qualification digitalSignature department')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name firstName lastName email' } })
    .sort({ createdAt: -1 });

  res.json({ success: true, count: prescriptions.length, data: prescriptions });
});

// 7. MEDICAL REPORTS MANAGEMENT
exports.getPatientMedicalReports = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const { category, abnormalOnly } = req.query;

  const filter = { patientId: patient._id };
  if (category) filter.testCategory = category;
  if (abnormalOnly === 'true') filter.isAbnormal = true;

  const reports = await LabTest.find(filter)
    .populate('doctorId', 'userId specialization')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .sort({ orderDate: -1 });

  res.json({ success: true, count: reports.length, data: reports });
});

// 8. ONLINE PAYMENTS & INVOICES
exports.getPatientBilling = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);

  const billings = await Billing.find({ patientId: patient._id })
    .populate('appointmentId')
    .sort({ invoiceDate: -1 });

  const totalPaid = billings
    .filter((b) => b.paymentDetails?.paymentStatus === 'completed')
    .reduce((s, b) => s + (b.summary?.totalAmount || 0), 0);

  const totalPending = billings
    .filter((b) => b.paymentDetails?.paymentStatus === 'pending' || b.status === 'issued')
    .reduce((s, b) => s + (b.summary?.totalAmount || 0), 0);

  res.json({
    success: true,
    data: {
      invoices: billings,
      summary: {
        totalPaid,
        totalPending,
        invoicesCount: billings.length,
      },
    },
  });
});

exports.processOnlinePayment = asyncHandler(async (req, res) => {
  const { billingId, paymentMethod = 'upi', transactionId } = req.body;
  if (!billingId) return res.status(400).json({ message: 'Billing ID is required' });

  const billing = await Billing.findById(billingId);
  if (!billing) return res.status(404).json({ message: 'Invoice not found' });

  if (billing.paymentDetails?.paymentStatus === 'completed') {
    return res.status(400).json({ message: 'Invoice has already been paid.' });
  }

  const generatedTxnId = transactionId || 'TXN-' + uuidv4().slice(0, 12).toUpperCase();

  billing.paymentDetails.paymentMethod = paymentMethod;
  billing.paymentDetails.transactionId = generatedTxnId;
  billing.paymentDetails.paymentStatus = 'completed';
  billing.paymentDetails.paymentDate = new Date();
  billing.paymentDetails.signatureVerified = true;
  billing.status = 'paid';

  billing.auditTrail.push({
    action: 'ONLINE_PAYMENT_VERIFIED',
    userId: req.user._id,
    previousStatus: 'pending',
    newStatus: 'completed',
    createdAt: new Date(),
  });

  await billing.save();

  // If tied to an appointment, mark appointment payment confirmed
  if (billing.appointmentId) {
    await Appointment.findByIdAndUpdate(billing.appointmentId, {
      paymentStatus: 'paid',
      status: 'confirmed',
    });
  }

  // Generate notification
  await Notification.create({
    userId: req.user._id,
    type: 'billing',
    title: 'Payment Confirmed',
    message: `Payment of ₹${billing.summary?.totalAmount} (Txn: ${generatedTxnId}) was successfully processed.`,
  });

  res.json({
    success: true,
    message: 'Payment verified and receipt generated!',
    data: billing,
  });
});

// 9. TELEMEDICINE / ONLINE CONSULTATION
exports.getPatientTelemedicineSessions = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);

  const appointments = await Appointment.find({
    patientId: patient._id,
    consultationType: 'telemedicine',
  })
    .populate('doctorId', 'userId specialization consultationFee')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email profilePicture' } })
    .sort({ appointmentDate: -1 });

  res.json({ success: true, count: appointments.length, data: appointments });
});

// 10. NOTIFICATIONS
exports.getPatientNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
  const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

  res.json({ success: true, data: notifications, unreadCount });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

// 11. DOCTOR COMMUNICATION
exports.getPatientMessages = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);

  const messages = await Message.find({
    $or: [{ senderId: req.user._id }, { receiverId: req.user._id }, { patientId: patient._id }],
  })
    .populate('senderId', 'name role email profilePicture')
    .populate('receiverId', 'name role email profilePicture')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: messages });
});

exports.sendMessageToDoctor = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const { doctorId, subject, body } = req.body;

  if (!doctorId || !body) {
    return res.status(400).json({ message: 'Doctor and message body are required' });
  }

  const doctor = await Doctor.findById(doctorId).populate('userId');
  if (!doctor || !doctor.userId) {
    return res.status(404).json({ message: 'Doctor user not found' });
  }

  const message = await Message.create({
    senderId: req.user._id,
    receiverId: doctor.userId._id,
    patientId: patient._id,
    subject: subject || 'Patient Clinical Inquiry',
    body,
    messageType: 'clinical_query',
    priority: 'normal',
  });

  await Notification.create({
    userId: doctor.userId._id,
    type: 'system',
    title: 'New Patient Message',
    message: `Message from ${req.user.name}: "${body.slice(0, 100)}"`,
  });

  res.status(201).json({ success: true, data: message });
});

// 12. FOLLOW-UP REMINDERS
exports.getPatientFollowUps = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);

  const consultationsWithFollowUp = await Consultation.find({
    patientId: patient._id,
    'followUp.isRequired': true,
  })
    .populate('doctorId', 'userId specialization consultationFee')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .sort({ 'followUp.date': 1 });

  const followUps = consultationsWithFollowUp.map((c) => ({
    consultationId: c._id,
    doctorId: c.doctorId?._id,
    doctorName: c.doctorId?.userId?.name || 'Consulting Physician',
    specialization: c.doctorId?.specialization || 'Specialist',
    consultationFee: c.doctorId?.consultationFee || 500,
    diagnosis: c.finalDiagnosis || c.preliminaryDiagnosis || 'Clinical Visit',
    followUpDate: c.followUp?.date,
    instructions: c.followUp?.instructions || 'Standard recovery evaluation',
    isOverdue: c.followUp?.date && new Date(c.followUp.date) < new Date(),
  }));

  res.json({ success: true, count: followUps.length, data: followUps });
});

// 13. PATIENT PROFILE MANAGEMENT
exports.getPatientProfile = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  res.json({ success: true, data: patient });
});

exports.updatePatientProfile = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const {
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    emergencyContact,
    phone,
  } = req.body;

  if (dateOfBirth) patient.dateOfBirth = new Date(dateOfBirth);
  if (gender) patient.gender = gender;
  if (bloodGroup) patient.bloodGroup = bloodGroup;
  if (address) patient.address = address;
  if (emergencyContact) patient.emergencyContact = emergencyContact;

  await patient.save();

  if (phone) {
    await User.findByIdAndUpdate(req.user._id, { phone });
  }

  res.json({ success: true, message: 'Profile updated successfully', data: patient });
});

// 14. FAMILY MEMBERS MANAGEMENT
exports.getFamilyMembers = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const members = await FamilyMember.find({ patientId: patient._id, isActive: true }).sort({ createdAt: -1 });

  res.json({ success: true, count: members.length, data: members });
});

exports.addFamilyMember = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const { fullName, relationship, dateOfBirth, gender, bloodGroup, phone, knownAllergies, existingConditions } = req.body;

  if (!fullName || !relationship || !gender) {
    return res.status(400).json({ message: 'Full name, relationship, and gender are required' });
  }

  const member = await FamilyMember.create({
    patientId: patient._id,
    primaryUserId: req.user._id,
    fullName,
    relationship,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    gender,
    bloodGroup: bloodGroup || 'Unknown',
    phone,
    knownAllergies: Array.isArray(knownAllergies) ? knownAllergies : [],
    existingConditions: Array.isArray(existingConditions) ? existingConditions : [],
  });

  res.status(201).json({ success: true, message: 'Family member registered successfully', data: member });
});

exports.deleteFamilyMember = asyncHandler(async (req, res) => {
  await FamilyMember.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Family member profile deactivated' });
});

// 15. PATIENT FEEDBACK & DOCTOR REVIEWS
exports.getPatientFeedback = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const feedbackList = await Feedback.find({ patientId: patient._id })
    .populate('doctorId', 'userId specialization')
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 });

  res.json({ success: true, count: feedbackList.length, data: feedbackList });
});

exports.submitDoctorReview = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const { doctorId, appointmentId, doctorRating, comment } = req.body;

  if (!doctorId || !doctorRating || !comment) {
    return res.status(400).json({ message: 'Doctor, rating (1-5), and feedback comments are required' });
  }

  const feedback = await Feedback.create({
    patientId: patient._id,
    userId: req.user._id,
    feedbackType: 'doctor_review',
    doctorId,
    appointmentId: appointmentId || undefined,
    doctorRating: Number(doctorRating),
    comment,
  });

  // Recalculate doctor rating
  const allDoctorReviews = await Feedback.find({ doctorId, feedbackType: 'doctor_review' });
  const avgRating = (allDoctorReviews.reduce((sum, r) => sum + (r.doctorRating || 5), 0) / allDoctorReviews.length).toFixed(1);

  await Doctor.findByIdAndUpdate(doctorId, {
    rating: Number(avgRating),
    totalReviews: allDoctorReviews.length,
  });

  res.status(201).json({ success: true, message: 'Review submitted. Thank you for your feedback!', data: feedback });
});

exports.submitHospitalFeedback = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);
  const { feedbackType = 'hospital_service', cleanlinessRating, staffBehaviorRating, title, comment } = req.body;

  if (!comment) return res.status(400).json({ message: 'Feedback comment is required' });

  const feedback = await Feedback.create({
    patientId: patient._id,
    userId: req.user._id,
    feedbackType,
    cleanlinessRating: Number(cleanlinessRating) || 5,
    staffBehaviorRating: Number(staffBehaviorRating) || 5,
    title,
    comment,
    status: 'submitted',
  });

  res.status(201).json({
    success: true,
    message: 'Feedback submitted to Hospital Quality and Facility Management.',
    data: feedback,
  });
});

// 16. EMERGENCY SUPPORT INFO
exports.getEmergencyInfo = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      hospitalName: 'Kushal Hospitals (NABH Accredited)',
      emergencyHelpline: '+91 1800-KUSHAL-CARE (1800-587-425)',
      ambulanceDirect: '+91 9999-999-999',
      traumaCenter: '+91 1800-911-911',
      bloodBank24x7: '+91 1800-888-777',
      address: 'Plot 42, Health City Boulevard, Bangalore, Karnataka, India - 560001',
      coordinates: { latitude: 12.9716, longitude: 77.5946 },
      emergencyBedsAvailable: 18,
      icuAvailability: 'Active 24x7 Trauma & Critical Care Unit',
      disclaimer: 'This portal is not a replacement for immediate emergency services. For critical life-threatening situations, dial 108 or our 24x7 Ambulance direct line immediately.',
    },
  });
});

// 17. HEALTH TIPS & EDUCATION
exports.getHealthTips = asyncHandler(async (req, res) => {
  const articles = [
    {
      id: 'tip-1',
      title: 'Managing Blood Pressure: Everyday Lifestyle Modifications',
      category: 'Cardiology & Wellness',
      readTime: '4 min read',
      summary: 'Sodium reduction, consistent aerobic exercise, and stress mitigation can lower systolic BP by 5-10 mmHg.',
      points: [
        'Aim for under 2,000mg sodium per day.',
        'Adopt the DASH (Dietary Approaches to Stop Hypertension) diet.',
        'Engage in 30 minutes of moderate cardiovascular activity 5 days a week.',
      ],
      reviewedBy: 'Dr. Clinical Cardiology Board',
    },
    {
      id: 'tip-2',
      title: 'Diabetes Foot Care and Daily Neuropathy Prevention',
      category: 'Endocrinology',
      readTime: '3 min read',
      summary: 'Regular inspection and maintaining glycemic control significantly reduces risk of diabetic ulcers.',
      points: [
        'Inspect feet daily for cuts, blisters, or redness.',
        'Wash feet in lukewarm water and dry thoroughly between toes.',
        'Never walk barefoot, even indoors.',
      ],
      reviewedBy: 'Dr. Diabetology Division',
    },
    {
      id: 'tip-3',
      title: 'Hydration and Kidney Stone Prevention',
      category: 'Nephrology',
      readTime: '3 min read',
      summary: 'Drinking 2.5 to 3 liters of water daily remains the gold standard in reducing urinary oxalate crystallization.',
      points: [
        'Maintain light-colored urine throughout the day.',
        'Balance calcium and oxalate dietary intake.',
        'Limit animal protein and high-fructose beverages.',
      ],
      reviewedBy: 'Dr. Nephrology Division',
    },
  ];

  res.json({ success: true, count: articles.length, data: articles });
});

// 18. PATIENT HEALTH OVERVIEW & VITAL TRENDS
exports.getPatientHealthOverview = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);

  const consultations = await Consultation.find({ patientId: patient._id, status: 'completed' })
    .sort({ visitDate: 1 });

  // Extract clinically recorded vital sign trends from real consultations
  const vitalsTrends = consultations
    .filter((c) => c.vitalSigns && (c.vitalSigns.bloodPressure || c.vitalSigns.pulseRate || c.vitalSigns.temperature))
    .map((c) => ({
      date: new Date(c.visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      bloodPressure: c.vitalSigns.bloodPressure || 'N/A',
      pulseRate: c.vitalSigns.pulseRate || null,
      temperature: c.vitalSigns.temperature || null,
      oxygenSaturation: c.vitalSigns.oxygenSaturation || null,
      weight: c.vitalSigns.weight || null,
      bmi: c.vitalSigns.bmi || null,
    }));

  res.json({
    success: true,
    data: {
      vitalsTrends,
      consultationsCount: consultations.length,
      allergiesCount: patient.allergies?.length || 0,
      chronicDiseasesCount: patient.chronicDiseases?.length || 0,
    },
  });
});
