const { asyncHandler } = require('../middleware/errorHandler');
const OnlineConsultation = require('../models/OnlineConsultation');
const ConsultationMessage = require('../models/ConsultationMessage');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Billing = require('../models/Billing');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
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

// Helper to get current doctor record
const getDoctorForUser = async (userId) => {
  const doctor = await Doctor.findOne({ userId }).populate('userId');
  if (!doctor) {
    throw new Error('Doctor profile not found for this account.');
  }
  return doctor;
};

// 1. BOOK ONLINE VIDEO CONSULTATION
exports.bookOnlineConsultation = asyncHandler(async (req, res) => {
  const {
    doctorId,
    appointmentDate,
    scheduledDate,
    startTime,
    reason,
    symptoms,
    paymentMode,
    paymentStatus,
    transactionId,
    patientConsent,
  } = req.body;

  if (!doctorId) {
    return res.status(400).json({ success: false, message: 'Please select an attending physician' });
  }

  const rawDate = scheduledDate || appointmentDate;
  if (!rawDate) {
    return res.status(400).json({ success: false, message: 'Please select a consultation date' });
  }

  const activeSlot = startTime || '10:00 AM';

  const doctor = await Doctor.findById(doctorId).populate('userId', 'name firstName lastName email phone');
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  const patient = await getPatientForUser(req.user._id, req.user);

  // Parse Date Range for same-day conflict check
  const targetDate = new Date(rawDate);
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  // Check double-booking conflicts (Existing appointment or online consultation)
  const existingApt = await Appointment.findOne({
    doctorId: doctor._id,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    startTime: activeSlot,
    status: { $nin: ['cancelled', 'rejected'] },
  });

  const existingOnline = await OnlineConsultation.findOne({
    doctorId: doctor._id,
    scheduledDate: { $gte: startOfDay, $lte: endOfDay },
    startTime: activeSlot,
    status: { $nin: ['cancelled', 'rejected'] },
  });

  if (existingApt || existingOnline) {
    return res.status(400).json({
      success: false,
      message: `Dr. ${doctor.userId?.name || doctor.name} is already booked for ${activeSlot} on this date. Please select another time slot.`,
    });
  }

  const fee = doctor.consultationFee || 600;
  const isPaidOnline = paymentMode === 'online_simulation' || paymentStatus === 'completed';
  const initialStatus = isPaidOnline ? 'confirmed' : 'pending';
  const meetingRoomId = 'KH-VC-' + uuidv4().slice(0, 4).toUpperCase() + '-' + uuidv4().slice(0, 4).toUpperCase();

  // Create underlying Appointment for unified scheduling records
  const appointment = await Appointment.create({
    patientId: patient._id,
    userId: req.user._id,
    doctorId: doctor._id,
    appointmentDate: targetDate,
    date: targetDate,
    startTime: activeSlot,
    endTime: '30 Mins',
    consultationFee: fee,
    consultationType: 'telemedicine',
    status: initialStatus,
    reason: reason || 'Online Video Consultation',
    symptoms: Array.isArray(symptoms) ? symptoms : symptoms ? [symptoms] : [],
  });

  // Create Billing Invoice
  const billing = await Billing.create({
    patientId: patient._id,
    appointmentId: appointment._id,
    invoiceDate: new Date(),
    billItems: [
      {
        itemType: 'consultation',
        description: `Online Video Consultation with Dr. ${doctor.userId?.name || doctor.name} (${doctor.specialization})`,
        quantity: 1,
        unitPrice: fee,
        total: fee,
      },
    ],
    summary: {
      subtotal: fee,
      gstRate: 0,
      gstAmount: 0,
      totalAmount: fee,
    },
    paymentDetails: {
      paymentMethod: isPaidOnline ? 'upi' : 'pay_at_hospital',
      paymentStatus: isPaidOnline ? 'completed' : 'pending',
      transactionId: isPaidOnline ? (transactionId || `UPI-${Date.now().toString().slice(-6)}`) : undefined,
      paymentDate: isPaidOnline ? new Date() : undefined,
    },
    status: isPaidOnline ? 'paid' : 'issued',
  });

  appointment.billingId = billing._id;
  await appointment.save();

  // Create OnlineConsultation Document
  const onlineConsultation = await OnlineConsultation.create({
    appointmentId: appointment._id,
    meetingRoomId,
    doctorId: doctor._id,
    patientId: patient._id,
    userId: req.user._id,
    scheduledDate: targetDate,
    startTime: activeSlot,
    endTime: '30 Minutes',
    status: initialStatus,
    reason: reason || 'Online Video Consultation',
    symptoms: Array.isArray(symptoms) ? symptoms : symptoms ? [symptoms] : [],
    consultationFee: fee,
    paymentStatus: isPaidOnline ? 'paid' : 'pending',
    paymentMode: isPaidOnline ? 'online_simulation' : 'pay_at_hospital',
    transactionId: isPaidOnline ? (transactionId || billing.paymentDetails?.transactionId) : undefined,
    patientConsent: {
      agreed: patientConsent?.agreed !== false,
      consentedAt: new Date(),
      statement: 'Patient consented to telehealth consultation and data privacy terms.',
    },
  });

  const doctorName = doctor.userId?.name || `Dr. ${doctor.userId?.firstName || ''} ${doctor.userId?.lastName || ''}`.trim() || 'Clinician';

  // Send Notifications
  await Notification.create({
    userId: req.user._id,
    type: 'appointment-reminder',
    title: 'Video Consultation Scheduled',
    message: `Your video consultation with Dr. ${doctorName} is confirmed for ${targetDate.toLocaleDateString()} at ${activeSlot}. Room ID: ${meetingRoomId}`,
  });

  if (doctor.userId?._id) {
    await Notification.create({
      userId: doctor.userId._id,
      type: 'appointment-reminder',
      title: 'New Video Consultation Request',
      message: `Patient ${req.user.name || 'User'} has scheduled an online video consultation on ${targetDate.toLocaleDateString()} at ${activeSlot}.`,
    });
  }

  res.status(201).json({
    success: true,
    message: 'Online video consultation booked successfully',
    data: {
      ...onlineConsultation.toObject(),
      doctorName,
      specialization: doctor.specialization,
      department: doctor.department,
    },
  });
});

// 2. GET PATIENT'S VIDEO CONSULTATIONS
exports.getPatientConsultations = asyncHandler(async (req, res) => {
  const patient = await getPatientForUser(req.user._id, req.user);

  const consultations = await OnlineConsultation.find({
    $or: [{ patientId: patient._id }, { userId: req.user._id }],
  })
    .populate({
      path: 'doctorId',
      select: 'specialization department consultationFee experienceYears profilePicture licenseNumber',
      populate: { path: 'userId', select: 'name firstName lastName email phone profilePicture' },
    })
    .populate('appointmentId')
    .populate('prescriptionId')
    .sort({ scheduledDate: -1, createdAt: -1 });

  res.json({
    success: true,
    count: consultations.length,
    data: consultations,
  });
});

// 3. GET DOCTOR'S VIDEO CONSULTATIONS
exports.getDoctorConsultations = asyncHandler(async (req, res) => {
  const doctor = await getDoctorForUser(req.user._id);

  const consultations = await OnlineConsultation.find({ doctorId: doctor._id })
    .populate({
      path: 'patientId',
      select: 'gender dateOfBirth bloodGroup emergencyContact allergies chronicDiseases',
      populate: { path: 'userId', select: 'name firstName lastName email phone profilePicture' },
    })
    .populate('appointmentId')
    .populate('prescriptionId')
    .sort({ scheduledDate: 1, startTime: 1 });

  res.json({
    success: true,
    count: consultations.length,
    data: consultations,
  });
});

// 4. UPDATE CONSULTATION STATUS (Accept / Reject / Cancel)
exports.updateConsultationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason, cancellationReason } = req.body;

  const consultation = await OnlineConsultation.findById(id)
    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name' } })
    .populate('patientId');

  if (!consultation) {
    return res.status(404).json({ success: false, message: 'Consultation not found' });
  }

  if (status) consultation.status = status;
  if (rejectionReason) consultation.rejectionReason = rejectionReason;
  if (cancellationReason) consultation.cancellationReason = cancellationReason;

  await consultation.save();

  // Sync to underlying Appointment
  if (consultation.appointmentId) {
    const aptStatus = status === 'rejected' ? 'cancelled' : status;
    await Appointment.findByIdAndUpdate(consultation.appointmentId, {
      status: aptStatus,
      rejectionReason,
      cancellationReason,
    });
  }

  // Notify patient
  if (consultation.userId) {
    await Notification.create({
      userId: consultation.userId,
      type: 'appointment-reminder',
      title: `Video Consultation ${status === 'confirmed' ? 'Accepted' : status === 'rejected' ? 'Declined' : 'Updated'}`,
      message: `Your video consultation with Dr. ${consultation.doctorId?.userId?.name || 'Doctor'} has been marked as ${status}.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
    });
  }

  res.json({ success: true, message: `Consultation marked as ${status}`, data: consultation });
});

// 5. GET ROOM DETAILS & ACCESS VERIFICATION
exports.getRoomDetails = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const consultation = await OnlineConsultation.findOne({ meetingRoomId: roomId })
    .populate({
      path: 'doctorId',
      select: 'specialization department consultationFee experienceYears profilePicture',
      populate: { path: 'userId', select: 'name firstName lastName email phone profilePicture' },
    })
    .populate({
      path: 'patientId',
      select: 'gender dateOfBirth bloodGroup emergencyContact allergies chronicDiseases',
      populate: { path: 'userId', select: 'name firstName lastName email phone profilePicture' },
    })
    .populate('prescriptionId');

  if (!consultation) {
    return res.status(404).json({ success: false, message: 'Consultation room not found' });
  }

  // Authorization Check
  const currentUserId = req.user._id.toString();
  const doctorUserId = consultation.doctorId?.userId?._id?.toString();
  const patientUserId = consultation.userId?.toString();
  const isDoctor = currentUserId === doctorUserId;
  const isPatient = currentUserId === patientUserId;
  const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';

  if (!isDoctor && !isPatient && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You are not an authorized participant for this consultation room.',
    });
  }

  // Fetch in-call chat history
  const messages = await ConsultationMessage.find({ roomId }).sort({ timestamp: 1 });

  // Calculate time window
  const now = new Date();
  const schedDate = new Date(consultation.scheduledDate);
  const isToday =
    now.getFullYear() === schedDate.getFullYear() &&
    now.getMonth() === schedDate.getMonth() &&
    now.getDate() === schedDate.getDate();

  res.json({
    success: true,
    data: {
      ...consultation.toObject(),
      isDoctor,
      isPatient,
      isAdmin,
      messages,
      isToday,
      canJoin: isDoctor || isAdmin || isToday || consultation.status === 'in-progress' || consultation.status === 'confirmed' || consultation.status === 'waiting',
    },
  });
});

// 6. COMPLETE CONSULTATION WITH CLINICAL NOTES & PRESCRIPTIONS
exports.completeConsultation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { clinicalNotes, diagnosis, prescriptions, followUpDate } = req.body;

  const consultation = await OnlineConsultation.findById(id)
    .populate('doctorId')
    .populate('patientId');

  if (!consultation) {
    return res.status(404).json({ success: false, message: 'Consultation not found' });
  }

  consultation.status = 'completed';
  consultation.clinicalNotes = clinicalNotes || consultation.clinicalNotes;
  consultation.diagnosis = diagnosis || consultation.diagnosis;
  consultation.callEndedAt = new Date();

  if (consultation.callStartedAt) {
    consultation.callDurationSeconds = Math.round(
      (consultation.callEndedAt.getTime() - consultation.callStartedAt.getTime()) / 1000
    );
  }

  if (Array.isArray(prescriptions) && prescriptions.length > 0) {
    consultation.prescriptions = prescriptions;

    // Create official digital Prescription document in database
    const prescriptionDoc = await Prescription.create({
      patientId: consultation.patientId._id,
      doctorId: consultation.doctorId._id,
      appointmentId: consultation.appointmentId,
      date: new Date(),
      diagnosis: diagnosis || 'Online Consultation Diagnosis',
      medicines: prescriptions.map((p) => ({
        name: p.medicineName,
        medicineName: p.medicineName,
        dosage: p.dosage || '1 tablet',
        frequency: p.frequency || 'Twice daily',
        duration: p.duration || '5 days',
        instructions: p.instructions || 'After food',
        timing: p.timing || 'after_food',
      })),
      notes: clinicalNotes || 'Follow prescribed regimen.',
      status: 'active',
    });

    consultation.prescriptionId = prescriptionDoc._id;
  }

  await consultation.save();

  // Sync underlying appointment
  if (consultation.appointmentId) {
    await Appointment.findByIdAndUpdate(consultation.appointmentId, {
      status: 'completed',
      notes: clinicalNotes,
    });
  }

  // Notify patient
  if (consultation.userId) {
    await Notification.create({
      userId: consultation.userId,
      type: 'prescription-issued',
      title: 'Consultation Completed & Prescription Issued',
      message: `Your video consultation with Dr. ${consultation.doctorId?.userId?.name || 'Doctor'} has finished. Your digital prescription and doctor notes are ready.`,
    });
  }

  res.json({
    success: true,
    message: 'Consultation completed and clinical records updated successfully',
    data: consultation,
  });
});

// 7. ADMIN: GET ALL ONLINE CONSULTATIONS & ANALYTICS
exports.getAdminConsultations = asyncHandler(async (req, res) => {
  const { status, doctorId, page = 1, limit = 50 } = req.query;

  const query = {};
  if (status && status !== 'all') query.status = status;
  if (doctorId) query.doctorId = doctorId;

  const skip = (Number(page) - 1) * Number(limit);

  const [consultations, totalCount, statsAgg] = await Promise.all([
    OnlineConsultation.find(query)
      .populate({
        path: 'doctorId',
        select: 'specialization department consultationFee',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .populate({
        path: 'patientId',
        select: 'gender dateOfBirth bloodGroup emergencyContact',
        populate: { path: 'userId', select: 'name email phone' },
      })
      .sort({ scheduledDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    OnlineConsultation.countDocuments(query),
    OnlineConsultation.aggregate([
      {
        $group: {
          _id: null,
          totalConsultations: { $sum: 1 },
          completedConsultations: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          totalRevenue: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$consultationFee', 0],
            },
          },
          avgDuration: { $avg: '$callDurationSeconds' },
        },
      },
    ]),
  ]);

  const stats = statsAgg[0] || {
    totalConsultations: totalCount,
    completedConsultations: 0,
    totalRevenue: 0,
    avgDuration: 0,
  };

  res.json({
    success: true,
    data: consultations,
    pagination: {
      total: totalCount,
      page: Number(page),
      pages: Math.ceil(totalCount / Number(limit)),
    },
    analytics: {
      totalConsultations: stats.totalConsultations,
      completedConsultations: stats.completedConsultations,
      totalRevenue: stats.totalRevenue,
      avgDurationMinutes: Math.round((stats.avgDuration || 0) / 60),
    },
  });
});

// 8. GET AVAILABLE TIME SLOTS FOR A DOCTOR ON A DATE
exports.getDoctorAvailableSlots = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) {
    return res.status(400).json({ success: false, message: 'Doctor ID and Date are required' });
  }

  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

  // Standard consultation slots
  const allSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
    '07:00 PM', '07:30 PM', '08:00 PM',
  ];

  // Fetch booked slots from both Appointments and OnlineConsultations
  const [bookedApts, bookedOnline] = await Promise.all([
    Appointment.find({
      doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled', 'rejected'] },
    }).select('startTime'),
    OnlineConsultation.find({
      doctorId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $nin: ['cancelled', 'rejected'] },
    }).select('startTime'),
  ]);

  const bookedSlots = new Set([
    ...bookedApts.map((a) => a.startTime),
    ...bookedOnline.map((o) => o.startTime),
  ]);

  const slotsWithStatus = allSlots.map((slot) => ({
    slot,
    available: !bookedSlots.has(slot),
  }));

  res.json({
    success: true,
    doctorId,
    date,
    availableSlots: slotsWithStatus.filter((s) => s.available).map((s) => s.slot),
    allSlots: slotsWithStatus,
  });
});
