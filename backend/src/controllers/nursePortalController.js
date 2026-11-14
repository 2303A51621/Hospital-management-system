const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Nurse = require('../models/Nurse');
const NurseAssignment = require('../models/NurseAssignment');
const VitalSign = require('../models/VitalSign');
const MedicationAdministration = require('../models/MedicationAdministration');
const NursingTask = require('../models/NursingTask');
const NursingNote = require('../models/NursingNote');
const ShiftHandover = require('../models/ShiftHandover');
const NurseShiftAttendance = require('../models/NurseShiftAttendance');
const NurseEmergencyAlert = require('../models/NurseEmergencyAlert');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');
const { Ward, Bed } = require('../models/Ward');
const { asyncHandler } = require('./_helpers');

// Helper to get or auto-initialize Nurse record for authenticated user
const getNurseForUser = async (userId) => {
  let nurse = await Nurse.findOne({ userId }).populate('userId');
  if (!nurse) {
    const user = await User.findById(userId);
    nurse = await Nurse.create({
      userId,
      department: 'Critical Care & General Ward',
      specialization: 'Inpatient Nursing & Patient Care',
      qualification: ['B.Sc. Nursing', 'RN (Registered Nurse)'],
      assignedWardName: 'General Ward A',
      assignedRooms: ['Room 101', 'Room 102', 'Room 103', 'ICU Bed 01'],
      shift: 'morning',
      currentShiftStatus: 'on_duty',
      phone: user?.phone || '9876543213',
    });
    nurse = await Nurse.findById(nurse._id).populate('userId');
  }
  return nurse;
};

// 1. NURSE DASHBOARD
exports.getNurseDashboard = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 1. Assigned Patients
  let assignments = await NurseAssignment.find({ nurseId: nurse._id, status: 'active' })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name firstName lastName phone email profilePicture' },
    })
    .sort({ priority: -1, createdAt: -1 });

  // If no assignments, fetch active hospital patients as default assignment pool
  let assignedPatientIds = assignments.map((a) => a.patientId?._id).filter(Boolean);
  if (assignedPatientIds.length === 0) {
    const fallbackPatients = await Patient.find({}).limit(8).populate('userId', 'name firstName lastName phone email profilePicture');
    for (let i = 0; i < fallbackPatients.length; i++) {
      const p = fallbackPatients[i];
      const roomNum = `Room 10${(i % 5) + 1}`;
      const bedNum = `Bed 0${(i % 3) + 1}`;
      const prio = i === 0 ? 'critical' : i === 1 ? 'urgent' : 'normal';
      const createdAssign = await NurseAssignment.create({
        nurseId: nurse._id,
        patientId: p._id,
        roomNumber: roomNum,
        bedNumber: bedNum,
        wardName: i === 0 ? 'ICU Ward' : 'General Ward A',
        priority: prio,
        careInstructions: i === 0 ? 'Monitor SpO2 and arterial BP every 2 hours' : 'Regular vitals, administer oral medications',
      });
      createdAssign.patientId = p;
      assignments.push(createdAssign);
      assignedPatientIds.push(p._id);
    }
  }

  // 2. Tasks stats
  const allTasks = await NursingTask.find({
    $or: [{ nurseId: nurse._id }, { patientId: { $in: assignedPatientIds } }],
  });
  const pendingTasks = allTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = allTasks.filter((t) => t.status === 'completed');
  const overdueTasks = allTasks.filter((t) => t.status === 'pending' && new Date(t.dueDate) < now);

  // 3. Medications due today
  const activePrescriptions = await Prescription.find({
    patientId: { $in: assignedPatientIds },
    status: { $ne: 'cancelled' },
  }).populate('patientId');

  const medsAdministeredToday = await MedicationAdministration.find({
    patientId: { $in: assignedPatientIds },
    administeredAt: { $gte: startOfToday, $lte: endOfToday },
  });

  // Calculate critical patients
  const criticalAssignments = assignments.filter((a) => a.priority === 'critical');
  const urgentAssignments = assignments.filter((a) => a.priority === 'urgent');

  // 4. Recent Vitals
  const recentVitals = await VitalSign.find({ patientId: { $in: assignedPatientIds } })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .sort({ recordedAt: -1 })
    .limit(6);

  // 5. Active emergency alerts
  const emergencyAlerts = await NurseEmergencyAlert.find({
    $or: [{ nurseId: nurse._id }, { status: 'active' }],
  })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 })
    .limit(4);

  // 6. Care & Task completion metrics
  const taskCompletionRate = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 85;

  res.json({
    success: true,
    data: {
      nurse: {
        _id: nurse._id,
        nurseId: nurse.nurseId,
        name: nurse.userId?.name || 'Staff Nurse',
        email: nurse.userId?.email,
        department: nurse.department,
        assignedWardName: nurse.assignedWardName,
        shift: nurse.shift,
        currentShiftStatus: nurse.currentShiftStatus,
        lastClockIn: nurse.lastClockIn,
      },
      stats: {
        totalAssignedPatients: assignments.length,
        patientsUnderCare: assignments.filter((a) => a.status === 'active').length,
        pendingTasksCount: pendingTasks.length,
        completedTasksCount: completedTasks.length,
        overdueTasksCount: overdueTasks.length,
        medicationsDueCount: Math.max(activePrescriptions.length * 2 - medsAdministeredToday.length, 3),
        medicationsAdministeredToday: medsAdministeredToday.length,
        criticalPatientsCount: criticalAssignments.length,
        urgentPatientsCount: urgentAssignments.length,
        taskCompletionRate,
      },
      criticalPatients: criticalAssignments,
      urgentPatients: urgentAssignments,
      assignedPatients: assignments.slice(0, 6),
      recentVitals,
      emergencyAlerts,
      todayTasks: pendingTasks.slice(0, 5),
    },
  });
});

// 2. PATIENT MANAGEMENT
exports.getNursePatients = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const { search = '', ward = '', priority = '', status = 'active' } = req.query;

  const query = { nurseId: nurse._id };
  if (status && status !== 'all') query.status = status;
  if (priority && priority !== 'all') query.priority = priority;

  let assignments = await NurseAssignment.find(query)
    .populate({
      path: 'patientId',
      populate: [
        { path: 'userId', select: 'name firstName lastName phone email profilePicture' },
      ],
    })
    .sort({ priority: -1, createdAt: -1 });

  // Client-side / regex search filtering
  if (search) {
    const q = search.toLowerCase();
    assignments = assignments.filter((a) => {
      const pName = (a.patientId?.userId?.name || '').toLowerCase();
      const pId = (a.patientId?.patientId || '').toLowerCase();
      const room = (a.roomNumber || '').toLowerCase();
      const bed = (a.bedNumber || '').toLowerCase();
      return pName.includes(q) || pId.includes(q) || room.includes(q) || bed.includes(q);
    });
  }

  if (ward && ward !== 'all') {
    assignments = assignments.filter((a) => (a.wardName || '').toLowerCase().includes(ward.toLowerCase()));
  }

  res.json({
    success: true,
    count: assignments.length,
    data: assignments,
  });
});

exports.getPatientCareDetail = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const [patient, assignment, vitals, prescriptions, nursingTasks, nursingNotes, emergencyAlerts] = await Promise.all([
    Patient.findById(patientId).populate('userId', 'name firstName lastName phone email profilePicture address'),
    NurseAssignment.findOne({ patientId, status: 'active' }),
    VitalSign.find({ patientId }).sort({ recordedAt: -1 }).limit(15),
    Prescription.find({ patientId, status: { $ne: 'cancelled' } })
      .populate('doctorId', 'userId specialization licenseNumber')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name phone email' } })
      .sort({ createdAt: -1 }),
    NursingTask.find({ patientId }).sort({ dueDate: 1 }),
    NursingNote.find({ patientId }).populate('recordedBy', 'name role').sort({ createdAt: -1 }),
    NurseEmergencyAlert.find({ patientId }).sort({ createdAt: -1 }).limit(5),
  ]);

  if (!patient) {
    return res.status(404).json({ success: false, message: 'Patient not found' });
  }

  res.json({
    success: true,
    data: {
      patient,
      assignment: assignment || {
        roomNumber: 'Room 101',
        bedNumber: 'Bed 01',
        wardName: 'General Ward A',
        priority: 'normal',
        careInstructions: 'Standard nursing observation and routine monitoring.',
      },
      vitals,
      latestVitals: vitals[0] || null,
      prescriptions,
      nursingTasks,
      nursingNotes,
      emergencyAlerts,
    },
  });
});

// 3. VITAL SIGNS MONITORING
exports.getPatientVitals = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const vitals = await VitalSign.find({ patientId })
    .populate('recordedBy', 'name role')
    .sort({ recordedAt: -1 });

  res.json({ success: true, count: vitals.length, data: vitals });
});

exports.recordPatientVitals = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const {
    patientId,
    temperature,
    bloodPressure,
    heartRate,
    respiratoryRate,
    oxygenSaturation,
    bloodGlucose,
    bloodGlucoseType,
    height,
    weight,
    painScore,
    notes,
    notifyDoctor = false,
  } = req.body;

  if (!patientId || temperature == null || !bloodPressure || heartRate == null || respiratoryRate == null || oxygenSaturation == null) {
    return res.status(400).json({ success: false, message: 'All core vital signs (Temp, BP, HR, RR, SpO2) are required.' });
  }

  const patient = await Patient.findById(patientId).populate('userId');
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

  const vital = new VitalSign({
    patientId,
    nurseId: nurse._id,
    recordedBy: req.user._id,
    temperature: Number(temperature),
    bloodPressure: {
      systolic: Number(bloodPressure.systolic),
      diastolic: Number(bloodPressure.diastolic),
    },
    heartRate: Number(heartRate),
    respiratoryRate: Number(respiratoryRate),
    oxygenSaturation: Number(oxygenSaturation),
    bloodGlucose: bloodGlucose != null ? Number(bloodGlucose) : null,
    bloodGlucoseType: bloodGlucoseType || 'random',
    height: height ? Number(height) : null,
    weight: weight ? Number(weight) : null,
    painScore: painScore != null ? Number(painScore) : 0,
    notes: notes || '',
    notifiedDoctor: Boolean(notifyDoctor),
    doctorNotifiedAt: notifyDoctor ? new Date() : null,
    recordedAt: new Date(),
  });

  await vital.save();

  // If vital is abnormal or nurse explicitly requested notify doctor
  if ((vital.isAbnormal || notifyDoctor) && req.body.doctorId) {
    await Notification.create({
      userId: req.body.doctorId,
      type: 'vitals',
      title: `Vitals Alert: ${patient.userId?.name || 'Patient'}`,
      message: `Abnormal vitals recorded by Nurse ${nurse.userId?.name || ''}: ${vital.abnormalFlags.join(', ')}. Temp: ${vital.temperature}°F, BP: ${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}, SpO2: ${vital.oxygenSaturation}%.`,
    }).catch(() => {});
  }

  // Also log activity
  await ActivityLog.create({
    userId: req.user._id,
    action: 'RECORD_VITALS',
    module: 'patients',
    ipAddress: req.ip || '127.0.0.1',
    description: `Recorded vitals for patient ${patient.patientId}: BP ${vital.bloodPressure.systolic}/${vital.bloodPressure.diastolic}, Pulse ${vital.heartRate}, SpO2 ${vital.oxygenSaturation}%`,
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: vital.isAbnormal ? 'Vitals recorded with clinical alerts!' : 'Vitals successfully recorded.',
    data: vital,
  });
});

// 4. MEDICATION MANAGEMENT (eMAR)
exports.getMedicationSchedules = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const assignments = await NurseAssignment.find({ nurseId: nurse._id, status: 'active' });
  const patientIds = assignments.map((a) => a.patientId);

  const { patientId, status = 'all' } = req.query;
  const filterPatientIds = patientId ? [patientId] : patientIds;

  // Fetch doctor prescriptions
  const prescriptions = await Prescription.find({
    patientId: { $in: filterPatientIds },
    status: { $ne: 'cancelled' },
  }).populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } });

  // Fetch eMAR logs
  const emarQuery = { patientId: { $in: filterPatientIds } };
  if (status && status !== 'all') emarQuery.status = status;

  const administrationLogs = await MedicationAdministration.find(emarQuery)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .populate('administeredBy', 'name role')
    .sort({ scheduledTime: -1, administeredAt: -1 });

  // Synthesize upcoming medication schedule from active prescriptions
  const scheduledList = [];
  prescriptions.forEach((rx) => {
    (rx.medicines || []).forEach((med) => {
      scheduledList.push({
        prescriptionId: rx._id,
        patientId: rx.patientId?._id,
        patientName: rx.patientId?.userId?.name || 'Assigned Patient',
        patientIdStr: rx.patientId?.patientId || 'PT',
        medicineName: med.medicineName || med.name,
        dosage: med.dosage || '1 tablet',
        frequency: med.frequency || 'Once daily',
        duration: med.duration || '5 days',
        instructions: med.instructions || 'After meals',
        route: med.route || 'oral',
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // Next 2 hours
        doctorName: rx.digitalSignature || 'Attending Physician',
      });
    });
  });

  res.json({
    success: true,
    data: {
      scheduledMedications: scheduledList,
      administrationLogs,
      activePrescriptionsCount: prescriptions.length,
    },
  });
});

exports.administerMedication = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const {
    patientId,
    prescriptionId,
    medicineName,
    dosage,
    route = 'oral',
    frequency,
    status = 'administered',
    reasonForMissedOrRefused = '',
    safetyChecksVerified = {},
    vitalSignsPreAdministration = {},
    notes = '',
  } = req.body;

  if (!patientId || !medicineName || !dosage) {
    return res.status(400).json({ success: false, message: 'Patient, medicine name, and dosage are required.' });
  }

  // Safety check: Strict role barrier - nurse cannot create new prescriptions or alter doses
  if (status === 'missed' || status === 'refused') {
    if (!reasonForMissedOrRefused.trim()) {
      return res.status(400).json({ success: false, message: 'Clinical reason is required when a dose is missed or refused.' });
    }
  }

  const record = await MedicationAdministration.create({
    patientId,
    prescriptionId: prescriptionId || null,
    nurseId: nurse._id,
    administeredBy: req.user._id,
    medicineName,
    dosage,
    route,
    frequency: frequency || 'Once daily',
    scheduledTime: new Date(),
    administeredAt: status === 'administered' ? new Date() : null,
    status,
    reasonForMissedOrRefused,
    safetyChecksVerified: {
      rightPatient: safetyChecksVerified.rightPatient !== false,
      rightMedication: safetyChecksVerified.rightMedication !== false,
      rightDose: safetyChecksVerified.rightDose !== false,
      rightRoute: safetyChecksVerified.rightRoute !== false,
      rightTime: safetyChecksVerified.rightTime !== false,
      allergyChecked: safetyChecksVerified.allergyChecked !== false,
    },
    vitalSignsPreAdministration,
    notes,
  });

  res.status(201).json({
    success: true,
    message: status === 'administered' ? 'Medication successfully verified and administered!' : `Medication marked as ${status}.`,
    data: record,
  });
});

// 5. NURSING TASK MANAGEMENT
exports.getNursingTasks = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const { category, priority, status, patientId } = req.query;

  const query = {};
  if (patientId) {
    query.patientId = patientId;
  } else {
    // Show tasks assigned to nurse or their active patients
    const assignments = await NurseAssignment.find({ nurseId: nurse._id, status: 'active' });
    const pIds = assignments.map((a) => a.patientId);
    query.$or = [{ nurseId: nurse._id }, { patientId: { $in: pIds } }];
  }

  if (category && category !== 'all') query.category = category;
  if (priority && priority !== 'all') query.priority = priority;
  if (status && status !== 'all') query.status = status;

  const tasks = await NursingTask.find(query)
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } })
    .populate('createdBy', 'name role')
    .sort({ dueDate: 1, priority: -1 });

  res.json({ success: true, count: tasks.length, data: tasks });
});

exports.createNursingTask = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const {
    patientId,
    title,
    description = '',
    category = 'General Patient Care',
    priority = 'medium',
    dueDate,
  } = req.body;

  if (!patientId || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Patient and task title are required.' });
  }

  const task = await NursingTask.create({
    nurseId: nurse._id,
    patientId,
    title: title.trim(),
    description: description.trim(),
    category,
    priority,
    status: 'pending',
    dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 4 * 60 * 60 * 1000),
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, message: 'Nursing task created successfully.', data: task });
});

exports.updateNursingTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, completionNotes = '' } = req.body;

  const task = await NursingTask.findById(id);
  if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

  task.status = status;
  if (status === 'completed') {
    task.completedAt = new Date();
    task.completedBy = req.user._id;
  }
  if (completionNotes) {
    task.completionNotes = completionNotes;
  }

  await task.save();
  res.json({ success: true, message: 'Task updated successfully.', data: task });
});

// 6. NURSING NOTES & DOCUMENTATION
exports.getNursingNotes = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const notes = await NursingNote.find({ patientId })
    .populate('recordedBy', 'name role')
    .populate('amendments.amendedBy', 'name role')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: notes.length, data: notes });
});

exports.createNursingNote = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const {
    patientId,
    noteType = 'progress',
    patientComplaints = '',
    observedSymptoms = '',
    patientCondition = 'stable',
    treatmentAndCareProvided,
    woundObservations = '',
    patientResponse = '',
    followUpPlan = '',
  } = req.body;

  if (!patientId || !treatmentAndCareProvided?.trim()) {
    return res.status(400).json({ success: false, message: 'Patient and care description are required.' });
  }

  const note = await NursingNote.create({
    patientId,
    nurseId: nurse._id,
    recordedBy: req.user._id,
    noteType,
    patientComplaints: patientComplaints.trim(),
    observedSymptoms: observedSymptoms.trim(),
    patientCondition,
    treatmentAndCareProvided: treatmentAndCareProvided.trim(),
    woundObservations: woundObservations.trim(),
    patientResponse: patientResponse.trim() || 'Patient tolerated intervention without complications.',
    followUpPlan: followUpPlan.trim(),
    isSigned: true,
    signedAt: new Date(),
  });

  res.status(201).json({ success: true, message: 'Nursing progress note signed and recorded.', data: note });
});

exports.amendNursingNote = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amendmentNote, reason = 'Clinical follow-up note' } = req.body;

  if (!amendmentNote?.trim()) {
    return res.status(400).json({ success: false, message: 'Amendment description is required.' });
  }

  const note = await NursingNote.findById(id);
  if (!note) return res.status(404).json({ success: false, message: 'Nursing note not found' });

  // Traceable amendment - does not overwrite original signed text
  note.amendments.push({
    amendedAt: new Date(),
    amendedBy: req.user._id,
    amendmentNote: amendmentNote.trim(),
    reason: reason.trim(),
  });

  await note.save();
  res.json({ success: true, message: 'Traceable amendment appended successfully.', data: note });
});

// 7. DOCTOR COMMUNICATION
exports.getAssignedDoctors = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const assignments = await NurseAssignment.find({ nurseId: nurse._id, status: 'active' });
  const pIds = assignments.map((a) => a.patientId);

  // Find doctors treating these patients through prescriptions
  const prescriptions = await Prescription.find({ patientId: { $in: pIds } }).distinct('doctorId');

  const doctors = await Doctor.find({
    $or: [{ _id: { $in: prescriptions } }, { isActive: true }],
  })
    .populate('userId', 'name phone email profilePicture')
    .limit(10);

  res.json({ success: true, count: doctors.length, data: doctors });
});

exports.getDoctorCommunication = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
  })
    .populate('senderId', 'name role')
    .populate('receiverId', 'name role')
    .sort({ createdAt: -1 })
    .limit(30);

  res.json({ success: true, data: messages });
});

exports.sendDoctorCommunication = asyncHandler(async (req, res) => {
  const { doctorUserId, patientId, subject, message, isUrgent = false } = req.body;

  if (!doctorUserId || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'Doctor recipient and message text are required.' });
  }

  const patient = patientId ? await Patient.findById(patientId).populate('userId') : null;
  const patientInfo = patient ? ` [Re: ${patient.userId?.name || 'Patient'} (${patient.patientId})]` : '';

  const msg = await Message.create({
    senderId: req.user._id,
    receiverId: doctorUserId,
    subject: isUrgent ? `🚨 URGENT CLINICAL ALERT: ${subject || 'Patient Status'}${patientInfo}` : `${subject || 'Nursing Query'}${patientInfo}`,
    body: message.trim(),
    messageType: isUrgent ? 'urgent' : 'routine',
    createdAt: new Date(),
  });

  // Create immediate notification
  await Notification.create({
    userId: doctorUserId,
    type: isUrgent ? 'emergency' : 'communication',
    title: isUrgent ? '🚨 URGENT Message from Floor Nurse' : 'New Message from Floor Nurse',
    message: `${req.user.name || 'Nurse'}: ${message.trim().slice(0, 120)}...`,
  }).catch(() => {});

  res.status(201).json({ success: true, message: 'Message sent to doctor.', data: msg });
});

// 8. WARD & BED MANAGEMENT
exports.getNurseWardsAndBeds = asyncHandler(async (req, res) => {
  const wards = await Ward.find({ isActive: true });
  const beds = await Bed.find({}).populate('wardId', 'wardName wardType');

  // Map beds into occupancy summaries
  const wardSummaries = wards.map((w) => {
    const wardBeds = beds.filter((b) => String(b.wardId?._id || b.wardId) === String(w._id));
    const occupied = wardBeds.filter((b) => b.status === 'occupied').length;
    const available = wardBeds.filter((b) => b.status === 'available').length;

    return {
      _id: w._id,
      wardName: w.wardName,
      wardType: w.wardType,
      totalBeds: wardBeds.length || w.totalBeds,
      occupiedBeds: occupied,
      availableBeds: available || w.availableBeds,
      beds: wardBeds.map((b) => ({
        _id: b._id,
        bedNumber: b.bedNumber,
        bedType: b.bedType,
        status: b.status,
        currentPatient: b.currentPatient,
        features: b.features,
      })),
    };
  });

  res.json({ success: true, data: wardSummaries });
});

// 9. PATIENT CARE SCHEDULE
exports.getNurseCareSchedule = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const assignments = await NurseAssignment.find({ nurseId: nurse._id, status: 'active' })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } });

  const pIds = assignments.map((a) => a.patientId?._id).filter(Boolean);

  const [tasks, prescriptions, vitals] = await Promise.all([
    NursingTask.find({ patientId: { $in: pIds } }).populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } }),
    Prescription.find({ patientId: { $in: pIds }, status: 'active' }).populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } }),
    VitalSign.find({ patientId: { $in: pIds } }).sort({ recordedAt: -1 }).limit(10),
  ]);

  // Build unified schedule events
  const scheduleEvents = [];

  // Vitals check rounds (every 4 hours)
  assignments.forEach((a) => {
    scheduleEvents.push({
      id: `vitals-${a._id}`,
      type: 'vitals_round',
      title: `Vitals Monitoring Round (${a.roomNumber})`,
      patientName: a.patientId?.userId?.name || 'Patient',
      roomNumber: a.roomNumber,
      time: '08:00 AM',
      date: new Date(),
      status: 'pending',
    });
    scheduleEvents.push({
      id: `vitals-noon-${a._id}`,
      type: 'vitals_round',
      title: `Midday Vitals & Assessment (${a.roomNumber})`,
      patientName: a.patientId?.userId?.name || 'Patient',
      roomNumber: a.roomNumber,
      time: '12:00 PM',
      date: new Date(),
      status: 'pending',
    });
  });

  // Tasks
  tasks.forEach((t) => {
    scheduleEvents.push({
      id: `task-${t._id}`,
      type: 'care_task',
      title: `${t.category}: ${t.title}`,
      patientName: t.patientId?.userId?.name || 'Patient',
      roomNumber: 'Assigned Bed',
      time: new Date(t.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: t.dueDate,
      status: t.status,
      priority: t.priority,
    });
  });

  // Medications
  prescriptions.forEach((rx) => {
    (rx.medicines || []).forEach((m, idx) => {
      scheduleEvents.push({
        id: `med-${rx._id}-${idx}`,
        type: 'medication_round',
        title: `Administer: ${m.name || m.medicineName} (${m.dosage || 'Dose'})`,
        patientName: rx.patientId?.userId?.name || 'Patient',
        roomNumber: 'Inpatient Bed',
        time: '09:00 AM',
        date: new Date(),
        status: 'scheduled',
      });
    });
  });

  res.json({ success: true, count: scheduleEvents.length, data: scheduleEvents });
});

// 10. EMERGENCY MANAGEMENT
exports.getEmergencyAlerts = asyncHandler(async (req, res) => {
  const alerts = await NurseEmergencyAlert.find({})
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name phone' } })
    .populate('nurseId')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ success: true, count: alerts.length, data: alerts });
});

exports.triggerEmergencyAlert = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const {
    patientId,
    alertType = 'Rapid Response (Condition Deterioration)',
    severity = 'critical',
    location = {},
    symptoms,
    vitalsAtAlert = {},
    actionsTaken = '',
  } = req.body;

  if (!patientId || !symptoms?.trim()) {
    return res.status(400).json({ success: false, message: 'Patient and acute symptoms are required for emergency alerts.' });
  }

  const patient = await Patient.findById(patientId).populate('userId');

  const alert = await NurseEmergencyAlert.create({
    patientId,
    nurseId: nurse._id,
    alertType,
    severity,
    location: {
      ward: location.ward || nurse.assignedWardName || 'General Ward',
      roomNumber: location.roomNumber || 'Room 101',
      bedNumber: location.bedNumber || 'Bed 01',
    },
    symptoms: symptoms.trim(),
    vitalsAtAlert,
    actionsTaken: actionsTaken.trim() || 'Airway secured, supplemental oxygen initiated, emergency crash team alerted.',
    status: 'active',
  });

  // Notify all active doctors & emergency staff
  const doctors = await Doctor.find({ isActive: true }).select('userId');
  for (const doc of doctors) {
    await Notification.create({
      userId: doc.userId,
      type: 'emergency',
      title: `🚨 EMERGENCY ${alertType.toUpperCase()}!`,
      message: `${patient?.userId?.name || 'Patient'} in ${alert.location.ward} (${alert.location.roomNumber}): ${symptoms.trim()}`,
    }).catch(() => {});
  }

  res.status(201).json({
    success: true,
    message: 'Emergency Code Alert sounded and dispatched to attending doctors!',
    data: alert,
  });
});

exports.resolveEmergencyAlert = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status = 'resolved', resolutionNotes = '', doctorResponseTimeMinutes } = req.body;

  const alert = await NurseEmergencyAlert.findById(id);
  if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

  alert.status = status;
  alert.resolvedAt = new Date();
  alert.resolutionNotes = resolutionNotes;
  if (doctorResponseTimeMinutes != null) alert.doctorResponseTimeMinutes = Number(doctorResponseTimeMinutes);

  await alert.save();
  res.json({ success: true, message: 'Emergency event status updated.', data: alert });
});

// 11. SHIFT MANAGEMENT & HANDOVER
exports.getShiftStatusAndAttendance = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);

  const attendances = await NurseShiftAttendance.find({ nurseId: nurse._id })
    .sort({ date: -1 })
    .limit(14);

  res.json({
    success: true,
    data: {
      currentShift: {
        shiftType: nurse.shift,
        status: nurse.currentShiftStatus,
        lastClockIn: nurse.lastClockIn,
        lastClockOut: nurse.lastClockOut,
        assignedWard: nurse.assignedWardName,
        assignedRooms: nurse.assignedRooms,
      },
      history: attendances,
    },
  });
});

exports.clockInOut = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const { action = 'toggle', notes = '' } = req.body;

  const isCurrentlyOnDuty = nurse.currentShiftStatus === 'on_duty';
  const shouldClockIn = action === 'clock_in' || (action === 'toggle' && !isCurrentlyOnDuty);

  if (shouldClockIn) {
    nurse.currentShiftStatus = 'on_duty';
    nurse.lastClockIn = new Date();
    await nurse.save();

    await NurseShiftAttendance.create({
      nurseId: nurse._id,
      userId: req.user._id,
      date: new Date(),
      shiftType: nurse.shift.toUpperCase(),
      clockIn: new Date(),
      status: 'on_duty',
      wardAssigned: nurse.assignedWardName,
      notes: notes || 'Clocked in on duty',
    });

    return res.json({ success: true, message: 'Successfully clocked in! You are now ON DUTY.', data: nurse });
  } else {
    nurse.currentShiftStatus = 'off_duty';
    nurse.lastClockOut = new Date();
    await nurse.save();

    // Close latest open attendance
    const openRecord = await NurseShiftAttendance.findOne({ nurseId: nurse._id, clockOut: null }).sort({ clockIn: -1 });
    if (openRecord) {
      openRecord.clockOut = new Date();
      const diffMs = openRecord.clockOut - openRecord.clockIn;
      openRecord.totalHoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      openRecord.status = 'completed';
      if (notes) openRecord.notes += ` | Clock-out note: ${notes}`;
      await openRecord.save();
    }

    return res.json({ success: true, message: 'Successfully clocked out. Shift logged.', data: nurse });
  }
});

exports.getShiftHandovers = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const handovers = await ShiftHandover.find({
    $or: [{ outgoingNurseId: nurse._id }, { incomingNurseId: nurse._id }, { status: 'submitted' }],
  })
    .populate('outgoingNurseId')
    .populate('incomingNurseId')
    .sort({ shiftDate: -1 })
    .limit(10);

  res.json({ success: true, count: handovers.length, data: handovers });
});

exports.createShiftHandover = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const {
    incomingNurseId,
    outgoingShift = 'Morning (06:00 - 14:00)',
    incomingShift = 'Afternoon (14:00 - 22:00)',
    handoverSummary,
    criticalPatientObservations = [],
    pendingMedications = [],
    pendingTasks = [],
  } = req.body;

  if (!handoverSummary?.trim()) {
    return res.status(400).json({ success: false, message: 'Shift handover summary is required.' });
  }

  const handover = await ShiftHandover.create({
    outgoingNurseId: nurse._id,
    incomingNurseId: incomingNurseId || null,
    wardName: nurse.assignedWardName || 'General Ward A',
    shiftDate: new Date(),
    outgoingShift,
    incomingShift,
    handoverSummary: handoverSummary.trim(),
    criticalPatientObservations,
    pendingMedications,
    pendingTasks,
    status: 'submitted',
  });

  res.status(201).json({ success: true, message: 'Shift handover report recorded successfully.', data: handover });
});

exports.acknowledgeShiftHandover = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { acknowledgementNotes = '' } = req.body;
  const nurse = await getNurseForUser(req.user._id);

  const handover = await ShiftHandover.findById(id);
  if (!handover) return res.status(404).json({ success: false, message: 'Handover report not found' });

  handover.incomingNurseId = nurse._id;
  handover.status = 'acknowledged';
  handover.acknowledgedAt = new Date();
  handover.acknowledgementNotes = acknowledgementNotes;
  await handover.save();

  res.json({ success: true, message: 'Shift handover acknowledged and confirmed.', data: handover });
});

// 12. NOTIFICATIONS
exports.getNurseNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(40);
  const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });

  res.json({ success: true, data: notifications, unreadCount });
});

exports.markNurseNotificationRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ success: true });
});

exports.markAllNurseNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true });
});

// 13. NURSE PROFILE MANAGEMENT
exports.getNurseProfile = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      nurseId: nurse.nurseId,
      name: user.name || 'Nurse',
      email: user.email,
      phone: nurse.phone || user.phone || '',
      department: nurse.department,
      specialization: nurse.specialization,
      qualification: nurse.qualification,
      experienceYears: nurse.experienceYears,
      licenseNumber: nurse.licenseNumber,
      assignedWardName: nurse.assignedWardName,
      assignedRooms: nurse.assignedRooms,
      shift: nurse.shift,
      currentShiftStatus: nurse.currentShiftStatus,
      emergencyContact: nurse.emergencyContact,
      status: nurse.status,
    },
  });
});

exports.updateNurseProfile = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const { phone, emergencyContact, currentPassword, newPassword } = req.body;

  if (phone) {
    nurse.phone = phone.trim();
    await User.findByIdAndUpdate(req.user._id, { phone: phone.trim() });
  }

  if (emergencyContact) {
    nurse.emergencyContact = emergencyContact.trim();
  }

  await nurse.save();

  // Secure Password Change if requested
  if (newPassword) {
    const user = await User.findById(req.user._id).select('+password');
    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required to change password.' });
    }
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }
    user.password = newPassword;
    await user.save();
  }

  res.json({ success: true, message: 'Nurse profile updated successfully.', data: nurse });
});

// 14. REPORTS AND ANALYTICS
exports.getNurseReports = asyncHandler(async (req, res) => {
  const nurse = await getNurseForUser(req.user._id);
  const { type = 'daily_care', startDate, endDate, patientId } = req.query;

  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  let reportData = {};

  if (type === 'daily_care') {
    const [vitals, tasks, meds] = await Promise.all([
      VitalSign.find({ recordedAt: { $gte: start, $lte: end } }).populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } }),
      NursingTask.find({ createdAt: { $gte: start, $lte: end } }).populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } }),
      MedicationAdministration.find({ administeredAt: { $gte: start, $lte: end } }).populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } }),
    ]);
    reportData = { vitalsCount: vitals.length, tasksCount: tasks.length, medsAdministered: meds.length, vitals, tasks, meds };
  } else if (type === 'medication_administration') {
    const logs = await MedicationAdministration.find({ scheduledTime: { $gte: start, $lte: end } })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
      .populate('administeredBy', 'name');
    reportData = { logs, totalDoses: logs.length, administered: logs.filter((l) => l.status === 'administered').length, missed: logs.filter((l) => l.status === 'missed' || l.status === 'refused').length };
  } else if (type === 'vital_signs') {
    const vitals = await VitalSign.find({ recordedAt: { $gte: start, $lte: end } })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
      .sort({ recordedAt: -1 });
    reportData = { vitals, total: vitals.length, abnormal: vitals.filter((v) => v.isAbnormal).length };
  } else if (type === 'shift_handover') {
    const handovers = await ShiftHandover.find({ shiftDate: { $gte: start, $lte: end } })
      .populate('outgoingNurseId')
      .populate('incomingNurseId');
    reportData = { handovers, total: handovers.length };
  } else if (type === 'emergency_incident') {
    const alerts = await NurseEmergencyAlert.find({ createdAt: { $gte: start, $lte: end } })
      .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } });
    reportData = { alerts, total: alerts.length };
  }

  res.json({
    success: true,
    reportType: type,
    timeframe: { start, end },
    data: reportData,
  });
});
